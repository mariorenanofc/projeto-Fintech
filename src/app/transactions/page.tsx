"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Coins, 
  Trash2, 
  Edit2, 
  Save, 
  ShieldCheck, 
  TrendingUp, 
  Plus, 
  ArrowLeft,
  Calendar as CalendarIcon,
  Info,
  ChevronRight,
  TrendingDown,
  Sparkles,
  DollarSign,
  Check
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { 
  getTransactions, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction, 
  TransactionInput 
} from "@/actions/transactions";
import { getProfileFinancialData, generateFinancialStrategy } from "@/actions/onboarding";
import { FinancialErrorBoundary } from "@/components/ui/financial-error-boundary";


export default function TransactionsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Estratégia planejada
  const [strategy, setStrategy] = useState<any>(null);

  // Previsões pendentes obtidas do planejamento
  const [pendingIncomes, setPendingIncomes] = useState<any[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [highlightForm, setHighlightForm] = useState(false);

  // Refs para autofoco e rolagem automática
  const formRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Filtro de mês (Ex: "2026-07")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().substring(0, 7);
  });

  const [userCreditCards, setUserCreditCards] = useState<any[]>([]);

  // Estados de Edição / Cadastro
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formOwnership, setFormOwnership] = useState<"shared" | "individual">("shared");
  const [form, setForm] = useState<TransactionInput>({
    type: "expense",
    amount: 0,
    description: "",
    category: "Alimentação",
    date: new Date().toISOString().substring(0, 10),
    paymentMethod: "pix",
    creditCardId: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && selectedMonth) {
      fetchData(selectedMonth);
    }
  }, [selectedMonth, mounted]);

  // Canal do Supabase Realtime para sincronização automática entre o casal
  useEffect(() => {
    if (!mounted) return;
    
    const supabase = createClient();
    const channel = supabase
      .channel("realtime-transactions-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          fetchData(selectedMonth);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMonth, mounted]);

  const fetchData = async (monthStr: string) => {
    setLoading(true);
    setLoadingForecast(true);
    
    // 1. Busca as transações reais já cadastradas
    const res = await getTransactions(monthStr);
    let currentTransactions: any[] = [];
    if (res.success) {
      setTransactions(res.data);
      currentTransactions = res.data;
    } else {
      toast.error("Erro ao buscar transações: " + res.error);
    }

    // 2. Busca as previsões e filtra o que já foi liquidado/realizado
    try {
      const rawRes = await getProfileFinancialData();
      if (rawRes.success) {
        setUserCreditCards(rawRes.creditCards || []);
        // Filtragem de Receitas Previstas que ainda não possuem transação no mês
        const filteredIncomes = (rawRes.incomes || [])
          .filter((inc: any) => {
            return !currentTransactions.some(
              t => t.type === "income" && t.description.toLowerCase().trim() === inc.title.toLowerCase().trim()
            );
          })
          .map((inc: any) => ({
            id: inc.id,
            title: inc.title,
            amount: Number(inc.amount),
            category: "Receita",
            type: "income"
          }));

        // Consolidação e filtragem de Despesas Previstas (Fixas, Cartões, Dívidas)
        const expList: any[] = [];

        // A: Despesas Fixas
        (rawRes.fixedExpenses || []).forEach((e: any) => {
          expList.push({
            id: `fixed-${e.id}`,
            title: e.title,
            amount: Number(e.amount),
            category: e.category,
            type: "expense"
          });
        });

        // B: Cartões
        (rawRes.creditCards || []).forEach((c: any) => {
          let invVal = Number(c.current_invoice);
          if (c.invoices_schedule && Array.isArray(c.invoices_schedule)) {
            const schedItem = c.invoices_schedule.find((s: any) => s.month === monthStr);
            if (schedItem) invVal = Number(schedItem.amount);
          }
          expList.push({
            id: `card-${c.id}`,
            title: `Fatura ${c.name}`,
            amount: invVal,
            category: "Cartão",
            type: "expense"
          });
        });

        // C: Dívidas / Empréstimos
        (rawRes.debts || []).forEach((d: any) => {
          let instVal = Number(d.current_installment_value);
          if (d.installments_schedule && Array.isArray(d.installments_schedule)) {
            const schedItem = d.installments_schedule.find((s: any) => s.month === monthStr);
            if (schedItem) instVal = Number(schedItem.amount);
          }
          expList.push({
            id: `debt-${d.id}`,
            title: d.title,
            amount: instVal,
            category: "Empréstimo",
            type: "expense"
          });
        });

        // Filtragem final: omite o que já possui lançamento com a mesma descrição e categoria
        const filteredExpenses = expList.filter((exp: any) => {
          return !currentTransactions.some(
            t => t.type === "expense" && t.description.toLowerCase().trim() === exp.title.toLowerCase().trim()
          );
        });

        setPendingIncomes(filteredIncomes);
        setPendingExpenses(filteredExpenses);
      }
    } catch (err) {
      console.error("Erro ao cruzar previsões:", err);
    }
    
    // 3. Busca a estratégia planejada para comparação de orçamento
    try {
      const stratRes = await generateFinancialStrategy(monthStr);
      setStrategy(stratRes);
    } catch (err) {
      console.error("Erro ao cruzar estratégia:", err);
    }

    setLoadingForecast(false);
    setLoading(false);
  };

  const handleConfirmForecast = (item: any) => {
    setFormOwnership("shared");
    setForm({
      type: item.type,
      amount: item.amount,
      description: item.title,
      category: item.category || "Geral",
      date: new Date().toISOString().substring(0, 10)
    });

    setHighlightForm(true);
    setTimeout(() => {
      setHighlightForm(false);
    }, 2000);

    setTimeout(() => {
      if (amountInputRef.current) {
        amountInputRef.current.focus();
        amountInputRef.current.select();
      }
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || form.amount <= 0 || !form.date) return;

    const finalDescription = formOwnership === "individual" 
      ? `[Individual] ${form.description.replace(/^\[Individual\]\s*/, "")}` 
      : form.description.replace(/^\[Individual\]\s*/, "");

    const payload = {
      ...form,
      description: finalDescription
    };

    setLoading(true);
    if (editId) {
      const res = await updateTransaction(editId, payload);
      if (res.success) {
        setEditId(null);
        resetForm();
        await fetchData(selectedMonth);
      } else toast.error(res.error);
    } else {
      const res = await addTransaction(payload);
      if (res.success) {
        resetForm();
        await fetchData(selectedMonth);
      } else toast.error(res.error);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    const isIndividual = item.description.startsWith("[Individual]");
    setFormOwnership(isIndividual ? "individual" : "shared");
    setForm({
      type: item.type,
      amount: Number(item.amount),
      description: item.description.replace(/^\[Individual\]\s*/, ""),
      category: item.category,
      date: item.date
    });
  };

  const openDeleteConfirm = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setLoading(true);
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    const res = await deleteTransaction(id);
    if (res.success) await fetchData(selectedMonth);
    else toast.error(res.error);
  };

  const resetForm = () => {
    setFormOwnership("shared");
    setForm({
      type: "expense",
      amount: 0,
      description: "",
      category: "Alimentação",
      date: new Date().toISOString().substring(0, 10)
    });
  };

  if (!mounted) return null;

  // Valores consolidados para comparação Previsto vs Realizado
  const prevIncome = strategy?.totalIncome || 0;
  const prevEssentials = strategy?.totalEssentialExpenses || 0;
  const prevCommitments = (strategy?.totalDebtInstallments || 0) + (strategy?.totalCreditCardInvoices || 0);
  const prevDisposable = strategy?.disposableIncomeForDebts || 0;

  const realIncome = transactions
    .filter(t => t.type === "income" && !t.description.startsWith("[Individual]"))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const realEssentials = transactions
    .filter(t => t.type === "expense" && !t.description.startsWith("[Individual]") && !["Cartão", "Lote/Terreno", "Empréstimo", "Aporte na Reserva", "Investimento"].includes(t.category))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const realCommitments = transactions
    .filter(t => t.type === "expense" && !t.description.startsWith("[Individual]") && ["Cartão", "Lote/Terreno", "Empréstimo"].includes(t.category))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const realDisposable = realIncome - realEssentials - realCommitments;

  // Totalizar despesas individuais por cônjuge
  const individualExpensesByUser: { [name: string]: number } = {};
  transactions.forEach(t => {
    if (t.type === "expense" && t.description.startsWith("[Individual]")) {
      const name = t.profiles?.full_name || "Parceiro";
      individualExpensesByUser[name] = (individualExpensesByUser[name] || 0) + Number(t.amount);
    }
  });

  // Categorias de transações recomendadas
  const categories = [
    "Moradia", "Alimentação", "Transporte", "Lazer", "Saúde", 
    "Educação", "Cartão", "Lote/Terreno", "Empréstimo", "Aporte na Reserva", "Investimento", "Outros"
  ];

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-zinc-950 flex flex-col min-h-screen px-4 py-6 pb-24 sm:pb-10 sm:max-w-xl sm:px-6 md:max-w-2xl lg:max-w-4xl lg:px-8 lg:py-10">
      
      {/* Header do Histórico */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="p-2 rounded-xl bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors mr-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 relative overflow-hidden">
            <TrendingUp className="w-5.5 h-5.5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white sm:text-base">Histórico de Lançamentos</h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">DR Financeira & Transações</p>
          </div>
        </div>
        
        {/* Seletor de mês nativo do PWA */}
        <div className="flex items-center gap-1">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-zinc-900 border border-white/5 rounded-xl text-zinc-200 text-xs px-2 py-1.5 focus:outline-none [color-scheme:dark] font-bold"
          />
        </div>
      </header>

      {/* Painel comparativo de Previsto vs Realizado */}
      <FinancialErrorBoundary fallbackTitle="Resumo Financeiro Indisponível" onReset={() => fetchData(selectedMonth)}>
        {loadingForecast || !strategy ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-900/40 border border-white/5 p-3 rounded-xl backdrop-blur-md animate-pulse h-[82px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
            {/* Receitas */}
            <div className="bg-zinc-900/40 backdrop-blur-md p-3 rounded-xl border border-white/5 flex flex-col justify-between text-xs">
              <div>
                <span className="text-[8px] text-zinc-500 uppercase font-black block">Receitas</span>
                <span className="text-sm font-black text-emerald-400 mt-1 block">
                  R$ {realIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-col gap-0.5 text-[9px] text-zinc-405">
                <div className="flex justify-between">
                  <span>Previsto:</span>
                  <span className="font-bold text-zinc-300">R$ {prevIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-[8px] text-zinc-500">
                  <span>Falta receber:</span>
                  <span className="font-semibold text-zinc-400">R$ {Math.max(0, prevIncome - realIncome).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            {/* Essenciais */}
            <div className="bg-zinc-900/40 backdrop-blur-md p-3 rounded-xl border border-white/5 flex flex-col justify-between text-xs">
              <div>
                <span className="text-[8px] text-zinc-500 uppercase font-black block">Essenciais</span>
                <span className="text-sm font-black text-zinc-200 mt-1 block">
                  R$ {realEssentials.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-col gap-0.5 text-[9px] text-zinc-405">
                <div className="flex justify-between">
                  <span>Limite:</span>
                  <span className="font-bold text-zinc-300">R$ {prevEssentials.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-[8px] text-zinc-500">
                  <span>Disponível:</span>
                  <span className="font-semibold text-emerald-400">R$ {Math.max(0, prevEssentials - realEssentials).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            {/* Compromissos */}
            <div className="bg-zinc-900/40 backdrop-blur-md p-3 rounded-xl border border-white/5 flex flex-col justify-between text-xs">
              <div>
                <span className="text-[8px] text-zinc-500 uppercase font-black block">Compromissos</span>
                <span className="text-sm font-black text-rose-400 mt-1 block">
                  R$ {realCommitments.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-col gap-0.5 text-[9px] text-zinc-405">
                <div className="flex justify-between">
                  <span>Previsão:</span>
                  <span className="font-bold text-zinc-300">R$ {prevCommitments.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-[8px] text-zinc-500">
                  <span>Falta pagar:</span>
                  <span className="font-semibold text-rose-400">R$ {Math.max(0, prevCommitments - realCommitments).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            {/* Saldo Disponível */}
            <div className="bg-zinc-900/40 backdrop-blur-md p-3 rounded-xl border border-white/5 flex flex-col justify-between text-xs">
              <div>
                <span className="text-[8px] text-zinc-500 uppercase font-black block">Saldo Disponível</span>
                <span className={`text-sm font-black mt-1 block ${realDisposable >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                  R$ {realDisposable.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-col gap-0.5 text-[9px] text-zinc-405">
                <div className="flex justify-between">
                  <span>Previsto:</span>
                  <span className="font-bold text-zinc-300">R$ {prevDisposable.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-[8px] text-zinc-500">
                  <span>Diferença:</span>
                  <span className={`font-semibold ${realDisposable >= prevDisposable ? 'text-emerald-400' : 'text-rose-500'}`}>
                    R$ {(realDisposable - prevDisposable).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </FinancialErrorBoundary>

      <div className="flex-1 flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">

        {/* COLUNA ESQUERDA: Formulário Lançador + Checklist de Previsões */}
        <div className="flex flex-col gap-6 w-full">
          <Card 
            ref={formRef}
            className={`bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md transition-all duration-500 ease-out ${
              highlightForm 
                ? "ring-2 ring-yellow-500/50 border-yellow-500/20 shadow-[0_0_25px_rgba(234,179,8,0.15)] scale-[1.01]" 
                : ""
            }`}
          >
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                {editId ? "Editar Lançamento" : "Novo Lançamento"}
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Registre receitas ou saídas para atualizar o caixa livre em tempo real</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {loading ? (
                <p className="text-xs text-zinc-550 uppercase tracking-widest font-semibold animate-pulse text-center py-8">Processando...</p>
              ) : (
                <form onSubmit={handleSaveTransaction} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Tipo de Lançamento</label>
                      <select
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value as any })}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                      >
                        <option value="expense">Saída (Despesa)</option>
                        <option value="income">Entrada (Receita)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Destinação</label>
                      <select
                        value={formOwnership}
                        onChange={e => setFormOwnership(e.target.value as any)}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                      >
                        <option value="shared">Conjunto (Compartilhado)</option>
                        <option value="individual">Individual (Pessoal)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor (R$)</label>
                      <input
                        ref={amountInputRef}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.amount || ""}
                        onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Data da Transação / Vencimento (DD/MM/AAAA)</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-250 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 [color-scheme:dark]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Descrição do Lançamento</label>
                    <input
                      type="text"
                      placeholder="Ex: Feira de verduras, PIX recebido"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Categoria</label>
                      <select
                        value={form.category}
                        onChange={e => setForm({ ...form, category: e.target.value })}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                      >
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Forma de Pagamento</label>
                      <select
                        value={form.paymentMethod || "pix"}
                        onChange={e => setForm({ ...form, paymentMethod: e.target.value as any })}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                      >
                        <option value="pix">PIX</option>
                        <option value="money">Dinheiro à Vista</option>
                        <option value="transfer">Transferência / Débito</option>
                        <option value="credit_card">Cartão de Crédito</option>
                      </select>
                    </div>

                    {form.paymentMethod === "credit_card" && (
                      <div className="col-span-2">
                        <label className="text-[9px] text-yellow-500 uppercase tracking-wider font-bold block mb-1">Qual Cartão de Crédito?</label>
                        <select
                          value={form.creditCardId || ""}
                          onChange={e => {
                            const selectedId = e.target.value;
                            const cardObj = userCreditCards.find(c => c.id === selectedId);
                            setForm({
                              ...form,
                              creditCardId: selectedId,
                              creditCardName: cardObj?.name || ""
                            });
                          }}
                          className="bg-zinc-950/80 border border-yellow-500/30 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                        >
                          <option value="">Selecione o cartão de crédito...</option>
                          {userCreditCards.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>


                  <div className="flex gap-2 pt-2">
                    <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-11 rounded-xl text-xs">
                      <Save className="w-4 h-4 mr-1.5" /> Salvar Transação
                    </Button>
                    {editId && (
                      <Button type="button" onClick={() => { setEditId(null); resetForm(); }} className="bg-zinc-900 text-zinc-300 border border-white/5 font-bold h-11 rounded-xl text-xs px-4">
                        Cancelar
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Checklist de Previsões Pendentes do Mês */}
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="p-6 pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-yellow-500" />
                  Previsões Pendentes
                </CardTitle>
                <Badge className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-bold">
                  {pendingIncomes.length + pendingExpenses.length} itens
                </Badge>
              </div>
              <CardDescription className="text-[10px] text-zinc-500 mt-0.5">
                Seu planejamento previsto para este período. Clique em confirmar para conciliar o valor real.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {loadingForecast ? (
                <p className="text-xs text-zinc-550 uppercase tracking-widest font-semibold animate-pulse text-center py-6">Atualizando previsões...</p>
              ) : (pendingIncomes.length === 0 && pendingExpenses.length === 0) ? (
                <div className="text-center py-6 bg-zinc-950/10 rounded-xl border border-dashed border-white/5">
                  <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-xs text-emerald-400/90 font-bold">Tudo em dia! 🎉</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Todas as previsões deste mês já foram confirmadas ou conciliadas.</p>
                </div>
              ) : (
                <>
                  {/* Seção Receitas Previstas */}
                  {pendingIncomes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] uppercase tracking-wider font-black text-emerald-500">Receitas Previstas</h4>
                      <div className="space-y-1.5">
                        {pendingIncomes.map((item, idx) => (
                          <div key={`pending-inc-${idx}`} className="bg-zinc-950/30 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                            <div>
                              <h5 className="font-bold text-zinc-200">{item.title}</h5>
                              <span className="text-[9px] text-zinc-550">Categoria: Receita</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-emerald-400">R$ {item.amount.toFixed(2)}</span>
                              <Button 
                                onClick={() => handleConfirmForecast(item)}
                                className="h-8 rounded-lg bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-400 text-[10px] px-2.5 font-bold transition-all"
                              >
                                Confirmar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seção Despesas Previstas */}
                  {pendingExpenses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[9px] uppercase tracking-wider font-black text-rose-400">Despesas Previstas</h4>
                      <div className="space-y-1.5">
                        {pendingExpenses.map((item, idx) => (
                          <div key={`pending-exp-${idx}`} className="bg-zinc-950/30 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                            <div>
                              <h5 className="font-bold text-zinc-200">{item.title}</h5>
                              <span className="text-[9px] text-zinc-550">Categoria: {item.category}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-zinc-400">R$ {item.amount.toFixed(2)}</span>
                              <Button 
                                onClick={() => handleConfirmForecast(item)}
                                className="h-8 rounded-lg bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-400 text-[10px] px-2.5 font-bold transition-all"
                              >
                                Confirmar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Gastos Pessoais Individuais do Casal */}
          {Object.keys(individualExpensesByUser).length > 0 && (
            <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                  Gastos Pessoais (Individuais)
                </CardTitle>
                <CardDescription className="text-[10px] text-zinc-500 mt-0.5">
                  Valores pessoais que não afetam o caixa compartilhado do casal
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-2">
                {Object.entries(individualExpensesByUser).map(([name, val]) => (
                  <div key={name} className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-xl border border-white/5 text-xs font-semibold">
                    <span className="text-zinc-300">{name}</span>
                    <span className="text-yellow-500 font-black">R$ {val.toFixed(2)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* COLUNA DIREITA: Listagem de Transações */}
        <FinancialErrorBoundary fallbackTitle="Lista de Transações Indisponível" onReset={() => fetchData(selectedMonth)}>
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
            <CardHeader className="p-6 pb-3">
              <CardTitle className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-yellow-500" />
                Lançamentos do Mês
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Histórico financeiro detalhado e ordenado por data</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3 max-h-[480px] overflow-y-auto pr-2">
              {loading ? (
                <p className="text-xs text-zinc-555 uppercase tracking-widest font-semibold animate-pulse text-center py-8">Carregando...</p>
              ) : transactions.length > 0 ? (
                transactions.map((item, idx) => (
                  <div key={idx} className="bg-zinc-950/40 p-4.5 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className="bg-zinc-900 text-zinc-400 border border-white/5 text-[8px] uppercase font-bold py-0">{item.category}</Badge>
                        {item.description.startsWith("[Individual]") ? (
                          <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[8px] uppercase font-bold py-0">Pessoal</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] uppercase font-bold py-0">Conjunto</Badge>
                        )}
                        {item.profiles?.full_name && (
                          <span className="text-[9px] text-zinc-500 font-semibold">
                            por {item.profiles.full_name.split(" ")[0]}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-zinc-200 mt-2">
                        {item.description.replace(/^\[Individual\]\s*/, "")}
                      </h4>
                      <span className="text-[9px] text-zinc-550 font-semibold block mt-1">
                        {new Date(item.date + "T00:00:00").toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-black ${item.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                        {item.type === "income" ? "+" : "-"} R$ {Number(item.amount).toFixed(2)}
                      </span>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleEdit(item)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openDeleteConfirm(item.id)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-zinc-950/10 rounded-xl border border-dashed border-white/5">
                  <Info className="w-6 h-6 text-zinc-650 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">Nenhuma transação registrada neste mês.</p>
                  <p className="text-[9px] text-zinc-650 mt-1">Use o formulário ao lado para lançar receitas ou saídas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </FinancialErrorBoundary>

      </div>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="bg-zinc-950 border border-white/10 shadow-2xl sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2 text-lg">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Excluir Transação
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm mt-1.5 leading-relaxed">
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDeleteId(null)}
              className="flex-1 bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800 hover:text-white h-11 rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)] h-11 rounded-xl font-bold border-none"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer / Barra de Navegação PWA Minimalista */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-t border-white/5 py-3 flex justify-around text-zinc-600 text-xs sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:z-auto sm:bg-transparent sm:backdrop-blur-none sm:border-t-0 sm:border-white/5 sm:py-0 sm:mt-10 sm:pt-5">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 hover:text-zinc-400 transition-colors">
          <Coins className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Dashboard</span>
        </Link>
        <Link href="/transactions" className="flex flex-col items-center gap-1 text-yellow-500 font-bold transition-colors">
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Transações</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 hover:text-zinc-400 transition-colors">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Perfil</span>
        </Link>
      </footer>

    </div>
  );
}
