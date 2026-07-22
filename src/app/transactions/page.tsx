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
  Check,
  PlusCircle,
  XCircle,
  Loader2,
  Heart
} from "lucide-react";
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
import { Header } from "@/components/dashboard/header";
import { TiltCard } from "@/components/ui/tilt-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export default function TransactionsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Perfil do usuário logado
  const [userProfile, setUserProfile] = useState<{ full_name: string; avatar_url: string } | null>(null);

  // Estratégia planejada
  const [strategy, setStrategy] = useState<any>(null);

  // Previsões pendentes obtidas do planejamento
  const [pendingIncomes, setPendingIncomes] = useState<any[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [highlightForm, setHighlightForm] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  // Carrega perfil do usuário
  const loadUserProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "Usuário",
          avatar_url: user.user_metadata?.avatar_url || ""
        });
      }
    } catch (err) {
      console.error("Erro ao carregar perfil do Supabase:", err);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadUserProfile();
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted && selectedMonth) {
      fetchData(selectedMonth);
    }
  }, [selectedMonth, mounted]);

  // Sincronização em tempo real via Supabase Postgres Changes
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
      date: new Date().toISOString().substring(0, 10),
      paymentMethod: "pix",
      creditCardId: ""
    });

    setHighlightForm(true);
    setIsFormOpen(true);
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
        setIsFormOpen(false);
        await fetchData(selectedMonth);
        toast.success("Transação atualizada com sucesso!");
      } else {
        toast.error(res.error);
      }
    } else {
      const res = await addTransaction(payload);
      if (res.success) {
        resetForm();
        setIsFormOpen(false);
        await fetchData(selectedMonth);
        toast.success("Transação registrada com sucesso!");
      } else {
        toast.error(res.error);
      }
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
      date: item.date,
      paymentMethod: item.payment_method || item.paymentMethod || "pix",
      creditCardId: item.credit_card_id || item.creditCardId || ""
    });
    setIsFormOpen(true);
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
    if (res.success) {
      await fetchData(selectedMonth);
      toast.success("Transação removida!");
    } else {
      toast.error(res.error);
    }
  };

  const resetForm = () => {
    setFormOwnership("shared");
    setForm({
      type: "expense",
      amount: 0,
      description: "",
      category: "Alimentação",
      date: new Date().toISOString().substring(0, 10),
      paymentMethod: "pix",
      creditCardId: ""
    });
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Formata o mês selecionado em formato legível PT-BR (ex: "Agosto de 2026")
  const getReadableMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${months[month - 1]} de ${year}`;
  };

  if (!mounted) return null;

  // Valores consolidados para comparação Previsto vs Realizado
  const prevIncome = strategy?.totalIncome || 0;
  const prevEssentials = strategy?.totalEssentialExpenses || 0;
  const prevCommitments = (strategy?.totalDebtInstallments || 0) + (strategy?.totalCreditCardInvoices || 0);
  const prevDisposable = strategy?.remainingCashResidue || 0;

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

  const categories = [
    "Moradia", "Alimentação", "Transporte", "Lazer", "Saúde", 
    "Educação", "Cartão", "Lote/Terreno", "Empréstimo", "Aporte na Reserva", "Investimento", "Outros"
  ];

  return (
    <div className="flex-1 w-full mx-auto bg-transparent flex flex-col min-h-screen px-3 py-4 xs:px-4 xs:py-6 pb-6 sm:pb-6 max-w-full xs:max-w-[480px] sm:max-w-[768px] tablet:max-w-[834px] md:max-w-[1024px] lg:max-w-[1440px] laptop:max-w-[1600px] sm:px-6 md:px-8 lg:py-8 space-y-6">
      
      {/* Header do App */}
      <Header 
        userProfile={userProfile}
        selectedMonthStr={selectedMonth}
        hasStrategy={!!strategy?.hasStrategy}
        getReadableMonthLabel={getReadableMonthLabel}
        handleLogout={handleLogout}
      />

      {/* Hero Section e Seletor de Mês */}
      <section className="flex flex-col md:flex-row justify-between items-center py-4 gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-yellow-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Coins className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Gestão de Lançamentos
            </h1>
            <p className="text-xs text-zinc-400 font-medium">Controle de receitas, saídas e previsões em tempo real</p>
          </div>
        </div>

        {/* Seletor de Mês Integrado */}
        <div className="bg-zinc-900/60 p-1.5 rounded-2xl border border-white/10 flex items-center gap-2 backdrop-blur-md">
          <span className="text-[10px] text-zinc-400 uppercase font-black px-2 tracking-wider">Mês de Referência:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-zinc-950 border border-white/5 rounded-xl text-zinc-200 text-xs px-3 py-2 focus:outline-none [color-scheme:dark] font-bold"
          />
        </div>
      </section>

      {/* Painel comparativo de Previsto vs Realizado (Cards Metas) */}
      <FinancialErrorBoundary fallbackTitle="Resumo Financeiro Indisponível" onReset={() => fetchData(selectedMonth)}>
        {loadingForecast || !strategy ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl backdrop-blur-md animate-pulse h-[96px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Receitas */}
            <TiltCard glowColor="rgba(16, 185, 129, 0.2)">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">Receitas Reais</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                <AnimatedCounter value={realIncome} prefix="R$ " decimals={2} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2 pt-2 border-t border-white/5">
                <span>Previsto: R$ {prevIncome.toFixed(0)}</span>
                <span>Falta: R$ {Math.max(0, prevIncome - realIncome).toFixed(0)}</span>
              </div>
            </TiltCard>

            {/* Essenciais */}
            <TiltCard glowColor="rgba(234, 179, 8, 0.2)">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold text-yellow-400 uppercase tracking-wider">Gastos Essenciais</span>
                <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                <AnimatedCounter value={realEssentials} prefix="R$ " decimals={2} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2 pt-2 border-t border-white/5">
                <span>Meta Teto: R$ {prevEssentials.toFixed(0)}</span>
                <span className={realEssentials > prevEssentials ? "text-rose-400 font-bold" : "text-emerald-400"}>
                  Livre: R$ {Math.max(0, prevEssentials - realEssentials).toFixed(0)}
                </span>
              </div>
            </TiltCard>

            {/* Compromissos */}
            <TiltCard glowColor="rgba(244, 63, 94, 0.2)">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold text-rose-400 uppercase tracking-wider">Compromissos</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                <AnimatedCounter value={realCommitments} prefix="R$ " decimals={2} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2 pt-2 border-t border-white/5">
                <span>Previsão: R$ {prevCommitments.toFixed(0)}</span>
                <span>Falta Pagar: R$ {Math.max(0, prevCommitments - realCommitments).toFixed(0)}</span>
              </div>
            </TiltCard>

            {/* Saldo Disponível */}
            <TiltCard glowColor={realDisposable >= 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)"}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-extrabold uppercase tracking-wider ${realDisposable >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Sobra Líquida
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${realDisposable >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black tracking-tight ${realDisposable >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                <AnimatedCounter value={realDisposable} prefix="R$ " decimals={2} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-400 mt-2 pt-2 border-t border-white/5">
                <span>Planejado: R$ {prevDisposable.toFixed(0)}</span>
                <span className={realDisposable >= prevDisposable ? "text-emerald-400" : "text-rose-400"}>
                  Desvio: R$ {(realDisposable - prevDisposable).toFixed(0)}
                </span>
              </div>
            </TiltCard>

          </div>
        )}
      </FinancialErrorBoundary>

      {/* Grid Principal de 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA: Formulário Lançador + Checklist de Previsões */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card do Formulário de Lançamento Expansível */}
          <div ref={formRef}>
            <TiltCard 
              className={`space-y-5 transition-all duration-500 border-[#27272A] ${
                highlightForm 
                  ? "ring-2 ring-yellow-500/50 border-yellow-500/20 shadow-[0_0_25px_rgba(234,179,8,0.15)] scale-[1.01]" 
                  : ""
              }`}
            >
              {!isFormOpen && !editId ? (
                // Visão Contraída: Botão Limpo para Lançar
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                    <PlusCircle className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Lançar Nova Movimentação</h3>
                    <p className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-relaxed">
                      Adicione receitas ou despesas essenciais, cartões de crédito e compromissos rapidamente.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsFormOpen(true)}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black text-xs px-6 h-11 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.2)] mt-2"
                  >
                    + Novo Lançamento Real
                  </Button>
                </div>
              ) : (
                // Visão Expandida: Formulário com os campos originais preservados
                <>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      {editId ? "Editar Lançamento" : "Novo Lançamento Real"}
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => {
                        resetForm();
                        setEditId(null);
                        setIsFormOpen(false);
                      }} 
                      className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Processando...</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveTransaction} className="space-y-4 text-xs">
                      {/* Tipo e Destinação */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase font-black block mb-1">Tipo de Lançamento</label>
                          <select
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value as any })}
                            className="bg-zinc-950 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 font-semibold"
                          >
                            <option value="expense">Saída (Despesa)</option>
                            <option value="income">Entrada (Receita)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase font-black block mb-1">Destinação</label>
                          <select
                            value={formOwnership}
                            onChange={e => setFormOwnership(e.target.value as any)}
                            className="bg-zinc-950 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 font-semibold"
                          >
                            <option value="shared">Conjunto (Compartilhado)</option>
                            <option value="individual">Individual (Pessoal)</option>
                          </select>
                        </div>
                      </div>

                      {/* Valor e Data */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase font-black block mb-1">Valor (R$)</label>
                          <input
                            ref={amountInputRef}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={form.amount || ""}
                            onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                            className="bg-zinc-950 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 font-bold font-mono"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase font-black block mb-1">Data da Transação</label>
                          <input
                            type="date"
                            value={form.date}
                            onChange={e => setForm({ ...form, date: e.target.value })}
                            className="bg-zinc-950 border border-white/5 rounded-xl text-zinc-300 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 [color-scheme:dark] font-bold"
                            required
                          />
                        </div>
                      </div>

                      {/* Descrição */}
                      <div>
                        <label className="text-[9px] text-zinc-400 uppercase font-black block mb-1">Descrição do Lançamento</label>
                        <input
                          type="text"
                          placeholder="Ex: Mercado Mensal, Combustível, PIX"
                          value={form.description}
                          onChange={e => setForm({ ...form, description: e.target.value })}
                          className="bg-zinc-950 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 font-semibold"
                          required
                        />
                      </div>

                      {/* Categoria e Forma Pagamento */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase font-black block mb-1">Categoria</label>
                          <select
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            className="bg-zinc-950 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 font-semibold"
                          >
                            {categories.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase font-black block mb-1">Forma de Pagamento</label>
                          <select
                            value={form.paymentMethod || "pix"}
                            onChange={e => setForm({ ...form, paymentMethod: e.target.value as any })}
                            className="bg-zinc-950 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 font-semibold"
                          >
                            <option value="pix">PIX</option>
                            <option value="money">Dinheiro à Vista</option>
                            <option value="transfer">Transferência / Débito</option>
                            <option value="credit_card">Cartão de Crédito</option>
                          </select>
                        </div>
                      </div>

                      {/* Seleção de Cartão de Crédito */}
                      {form.paymentMethod === "credit_card" && (
                        <div className="animate-fade-in">
                          <label className="text-[9px] text-yellow-500 uppercase font-black block mb-1">Qual Cartão de Crédito?</label>
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
                            className="bg-zinc-950 border border-yellow-500/30 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 font-bold"
                          >
                            <option value="">Selecione o cartão...</option>
                            {userCreditCards.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex gap-2 pt-2">
                        <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-11 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md">
                          <Save className="w-4 h-4" /> {editId ? "Atualizar Lançamento" : "Salvar Lançamento"}
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => {
                            resetForm();
                            setEditId(null);
                            setIsFormOpen(false);
                          }} 
                          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/5 font-extrabold h-11 rounded-xl text-xs px-4"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </TiltCard>
          </div>

          {/* Checklist de Previsões Pendentes */}
          <TiltCard className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-yellow-500" />
                Previsões Pendentes
              </h3>
              <Badge className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-bold">
                {pendingIncomes.length + pendingExpenses.length} itens
              </Badge>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Concilie seu planejamento previsto para este mês clicando em confirmar para preencher o formulário:
            </p>

            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1" data-lenis-prevent>
              {loadingForecast ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                </div>
              ) : (pendingIncomes.length === 0 && pendingExpenses.length === 0) ? (
                <div className="text-center py-6 bg-zinc-950/20 rounded-xl border border-white/5">
                  <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-xs text-emerald-400 font-bold">Tudo em dia! 🎉</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Todas as previsões deste período foram conciliadas.</p>
                </div>
              ) : (
                <>
                  {/* Receitas */}
                  {pendingIncomes.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-emerald-500 block tracking-widest">Receitas Previstas</span>
                      <div className="space-y-1.5">
                        {pendingIncomes.map((item, idx) => (
                          <div key={`pending-inc-${idx}`} className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                            <div>
                              <h5 className="font-bold text-zinc-200">{item.title}</h5>
                              <span className="text-[9px] text-zinc-500">Fluxo Entrada</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-emerald-400 font-mono">R$ {item.amount.toFixed(2)}</span>
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

                  {/* Despesas */}
                  {pendingExpenses.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase text-rose-400 block tracking-widest">Despesas Previstas</span>
                      <div className="space-y-1.5">
                        {pendingExpenses.map((item, idx) => (
                          <div key={`pending-exp-${idx}`} className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                            <div>
                              <h5 className="font-bold text-zinc-200">{item.title}</h5>
                              <span className="text-[9px] text-zinc-500">Categoria: {item.category}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-zinc-300 font-mono">R$ {item.amount.toFixed(2)}</span>
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
            </div>
          </TiltCard>

          {/* Gastos Pessoais Individuais */}
          {Object.keys(individualExpensesByUser).length > 0 && (
            <TiltCard className="space-y-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                  Gastos Pessoais (Individuais)
                </h3>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Valores pessoais de cada cônjuge que não afetam o caixa livre conjunto do casal:
              </p>
              <div className="space-y-2 pt-1">
                {Object.entries(individualExpensesByUser).map(([name, val]) => (
                  <div key={name} className="flex justify-between items-center bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 text-xs font-semibold">
                    <span className="text-zinc-300">{name}</span>
                    <span className="text-yellow-500 font-black font-mono">R$ {val.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </TiltCard>
          )}

        </div>

        {/* COLUNA DIREITA: Listagem de Transações */}
        <div className="lg:col-span-7">
          <FinancialErrorBoundary fallbackTitle="Lista de Transações Indisponível" onReset={() => fetchData(selectedMonth)}>
            <TiltCard className="space-y-4" disableTilt={true}>
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-yellow-500" />
                  Lançamentos Registrados
                </h3>
                <span className="text-[10px] text-zinc-400 font-semibold">{transactions.length} Registros</span>
              </div>

              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1" data-lenis-prevent>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((item, idx) => (
                    <div key={idx} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 flex justify-between items-center hover:border-white/10 transition-colors">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className="bg-zinc-900 text-zinc-400 border border-white/5 text-[8px] uppercase font-bold py-0.5 px-2">{item.category}</Badge>
                          {item.description.startsWith("[Individual]") ? (
                            <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[8px] uppercase font-bold py-0.5 px-2">Pessoal</Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] uppercase font-bold py-0.5 px-2">Conjunto</Badge>
                          )}
                          {item.profiles?.full_name && (
                            <span className="text-[9px] text-zinc-500 font-bold block">
                              por {item.profiles.full_name.split(" ")[0]}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black text-white mt-2">
                          {item.description.replace(/^\[Individual\]\s*/, "")}
                        </h4>
                        <span className="text-[9px] text-zinc-550 font-semibold block mt-1">
                          {new Date(item.date + "T00:00:00").toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-black font-mono ${item.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
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
                  <div className="text-center py-10 bg-zinc-950/20 rounded-xl border border-dashed border-white/5">
                    <Info className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400 font-semibold">Nenhuma transação registrada neste mês.</p>
                    <p className="text-[9px] text-zinc-500 mt-1">Use o formulário ao lado para lançar novas receitas ou saídas.</p>
                  </div>
                )}
              </div>
            </TiltCard>
          </FinancialErrorBoundary>
        </div>

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

      {/* Footer Padrão Unificado */}
      <footer className="w-full border-t border-white/5 pt-8 pb-8 text-center space-y-4 mt-6">
        <div className="flex justify-center items-center">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-yellow-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Coins className="w-5 h-5 text-yellow-500" />
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-black text-white tracking-tight">Sintonia &amp; Engenharia Financeira Familiar</h4>
          <p className="text-xs text-zinc-400 font-medium">Plataforma de inteligência financeira conjugal e gestão de crédito de alto desempenho</p>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-zinc-400 font-semibold flex-wrap">
          <Link href="/dashboard" className="hover:text-yellow-400 transition-colors">Dashboard</Link>
          <span>&bull;</span>
          <Link href="/transactions" className="hover:text-yellow-400 transition-colors">Transações</Link>
          <span>&bull;</span>
          <Link href="/profile" className="hover:text-yellow-400 transition-colors">Perfil &amp; Cartões</Link>
          <span>&bull;</span>
          <Link href="/onboarding" className="hover:text-yellow-400 transition-colors">Onboarding</Link>
          <span>&bull;</span>
          <Link href="/chat" className="hover:text-yellow-400 transition-colors">Conselheira IA</Link>
          <span>&bull;</span>
          <Link href="/politica-de-privacidade" className="hover:text-yellow-400 transition-colors">Privacidade</Link>
        </div>

        <div className="text-[10px] text-zinc-500 pt-3 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-2 max-w-4xl mx-auto px-4">
          <span>&copy; {new Date().getFullYear()} Fintech Casal. Todos os direitos reservados.</span>
          <span className="flex items-center gap-1">Desenvolvido com <Heart className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" /> para casais de alto desempenho</span>
        </div>
      </footer>

    </div>
  );
}
