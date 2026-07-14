"use client";

import React, { useState, useEffect } from "react";
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
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  getTransactions, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction, 
  TransactionInput 
} from "@/actions/transactions";

export default function TransactionsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Filtro de mês (Ex: "2026-07")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().substring(0, 7);
  });

  // Estados de Edição / Cadastro
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionInput>({
    type: "expense",
    amount: 0,
    description: "",
    category: "Alimentação",
    date: new Date().toISOString().substring(0, 10)
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && selectedMonth) {
      fetchData(selectedMonth);
    }
  }, [selectedMonth, mounted]);

  const fetchData = async (monthStr: string) => {
    setLoading(true);
    const res = await getTransactions(monthStr);
    if (res.success) {
      setTransactions(res.data);
    } else {
      alert("Erro ao buscar transações: " + res.error);
    }
    setLoading(false);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || form.amount <= 0 || !form.date) return;

    setLoading(true);
    if (editId) {
      const res = await updateTransaction(editId, form);
      if (res.success) {
        setEditId(null);
        resetForm();
        await fetchData(selectedMonth);
      } else alert(res.error);
    } else {
      const res = await addTransaction(form);
      if (res.success) {
        resetForm();
        await fetchData(selectedMonth);
      } else alert(res.error);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      type: item.type,
      amount: Number(item.amount),
      description: item.description,
      category: item.category,
      date: item.date
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    setLoading(true);
    const res = await deleteTransaction(id);
    if (res.success) await fetchData(selectedMonth);
    else alert(res.error);
  };

  const resetForm = () => {
    setForm({
      type: "expense",
      amount: 0,
      description: "",
      category: "Alimentação",
      date: new Date().toISOString().substring(0, 10)
    });
  };

  if (!mounted) return null;

  // Cálculos de resumo rápido
  const totalIncomes = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalIncomes - totalExpenses;

  // Categorias de transações recomendadas
  const categories = [
    "Moradia", "Alimentação", "Transporte", "Lazer", "Saúde", 
    "Educação", "Cartão", "Lote/Terreno", "Empréstimo", "Outros"
  ];

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-zinc-950 flex flex-col min-h-screen px-4 py-6 sm:max-w-xl sm:px-6 md:max-w-2xl lg:max-w-4xl lg:px-8 lg:py-10">
      
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

      {/* Caixa consolidado do Mês */}
      <div className="grid grid-cols-3 gap-3 mb-6 text-xs">
        <div className="bg-zinc-900/40 border border-white/5 p-3 rounded-xl backdrop-blur-md">
          <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Entradas
          </span>
          <span className="text-sm font-black text-emerald-400 mt-1 block">R$ {totalIncomes.toFixed(2)}</span>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 p-3 rounded-xl backdrop-blur-md">
          <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-rose-450" />
            Saídas
          </span>
          <span className="text-sm font-black text-rose-400 mt-1 block">R$ {totalExpenses.toFixed(2)}</span>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 p-3 rounded-xl backdrop-blur-md">
          <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block">
            Líquido
          </span>
          <span className={`text-sm font-black mt-1 block ${netBalance >= 0 ? "text-emerald-450" : "text-rose-450"}`}>
            R$ {netBalance.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">

        {/* COLUNA ESQUERDA: Formulário Lançador */}
        <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
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
                    <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount || ""}
                      onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                      className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
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
                    className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
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
                    <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Data</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-250 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs [color-scheme:dark]"
                      required
                    />
                  </div>
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

        {/* COLUNA DIREITA: Listagem de Transações */}
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
              <p className="text-xs text-zinc-550 uppercase tracking-widest font-semibold animate-pulse text-center py-8">Carregando...</p>
            ) : transactions.length > 0 ? (
              transactions.map((item, idx) => (
                <div key={idx} className="bg-zinc-950/40 p-4.5 rounded-xl border border-white/5 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-zinc-900 text-zinc-400 border border-white/5 text-[8px] uppercase font-bold py-0">{item.category}</Badge>
                      <h4 className="text-xs font-black text-zinc-200">{item.description}</h4>
                    </div>
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
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors">
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

      </div>

      {/* Footer PWA */}
      <footer className="mt-8 pt-5 border-t border-white/5 flex justify-around text-zinc-600 text-xs">
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
