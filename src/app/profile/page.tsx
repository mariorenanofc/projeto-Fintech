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
  Info, 
  AlertTriangle,
  Heart,
  Sparkles,
  LogOut
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  getProfileFinancialData,
  addIncome, updateIncome, deleteIncome,
  addFixedExpense, updateFixedExpense, deleteFixedExpense,
  addCreditCard, updateCreditCard, deleteCreditCard,
  addDebt, updateDebt, deleteDebt,
  linkPartnerByEmail, getLinkedPartner,
  updateVoicePreferences, updateProfileAssets,
  IncomeInput, FixedExpenseInput, CreditCardInput, DebtInput
} from "@/actions/onboarding";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dados do Parceiro Conjugal
  const [partner, setPartner] = useState<any | null>(null);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [linkingPartner, setLinkingPartner] = useState(false);

  // Dados carregados do banco
  const [incomes, setIncomes] = useState<any[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);

  // Estados de edição / criação
  const [activeTab, setActiveTab] = useState<"account" | "incomes" | "expenses" | "cards" | "debts">("account");
  const [editId, setEditId] = useState<string | null>(null);

  // Estados de Voz
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [voiceRate, setVoiceRate] = useState<number>(1.0);
  const [savingVoice, setSavingVoice] = useState(false);

  // Reserva financeira e Investimentos
  const [reservaFinanceira, setReservaFinanceira] = useState(0);
  const [investimentosTotal, setInvestimentosTotal] = useState(0);
  const [savingAssets, setSavingAssets] = useState(false);

  // Form templates para novos itens
  const [incomeForm, setIncomeForm] = useState<IncomeInput>({ title: "", amount: 0, owner: "Parceiro A" });
  const [expenseForm, setExpenseForm] = useState<FixedExpenseInput>({ category: "Customizada", title: "", amount: 0 });
  const [cardForm, setCardForm] = useState<CreditCardInput>({ name: "", totalLimit: 0, currentInvoice: 0, nextInvoice: 0, invoicesSchedule: [] });
  const [debtForm, setDebtForm] = useState<DebtInput>({ 
    title: "", acquisitionValue: 0, totalInstallments: 12, currentInstallmentValue: 0,
    monthlyLateInterestRate: 0, penaltyValue: 0, installmentsPaid: 0, installmentsSchedule: [],
    overdueInstallments: 0, overdueValueAccumulated: 0, tipoDivida: "toxica"
  });

  // Schedule sub-editors
  const [tempScheduleMonth, setTempScheduleMonth] = useState("");
  const [tempScheduleAmount, setTempScheduleAmount] = useState(0);

  // Confirmar exclusão dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "income" | "expense" | "card" | "debt"; title: string } | null>(null);

  const parseSchedule = (schedule: any): any[] => {
    if (!schedule) return [];
    if (Array.isArray(schedule)) return schedule;
    if (typeof schedule === "string") {
      try {
        const parsed = JSON.parse(schedule);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Erro ao parsear cronograma:", e);
      }
    }
    return [];
  };

  useEffect(() => {
    setMounted(true);
    fetchData();

    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        const ptVoices = availableVoices.filter(v => v.lang.startsWith("pt-"));
        setVoices(ptVoices);
      };
      
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  const handleVoiceChange = async (uri: string, rate: number = voiceRate) => {
    setSelectedVoiceURI(uri);
    setVoiceRate(rate);
    localStorage.setItem("preferredVoiceURI", uri);
    localStorage.setItem("preferredVoiceRate", rate.toString());
    
    setSavingVoice(true);
    await updateVoicePreferences(uri, rate);
    setSavingVoice(false);
  };

  const testVoice = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Olá! Eu serei a sua conselheira financeira IA.");
      utterance.lang = "pt-BR";
      utterance.rate = voiceRate;
      const voiceToUse = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (voiceToUse) utterance.voice = voiceToUse;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveAssets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAssets(true);
    const res = await updateProfileAssets(reservaFinanceira, investimentosTotal);
    setSavingAssets(false);
    if (res.success) {
      toast.success("Patrimônio e reservas salvos com sucesso!");
      await fetchData();
    } else {
      toast.error("Erro ao salvar patrimônio: " + res.error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Busca dados financeiros do casal
    const res = await getProfileFinancialData();
    if (res.success) {
      setIncomes(res.incomes);
      setFixedExpenses(res.fixedExpenses);
      setCreditCards(res.creditCards);
      setDebts(res.debts);
      setReservaFinanceira(Number(res.reservaFinanceiraAtual || 0));
      setInvestimentosTotal(Number(res.investimentosTotal || 0));
      
      // Sincroniza preferências de voz do DB para o localStorage
      if (res.voicePreferences) {
        setSelectedVoiceURI(res.voicePreferences.uri);
        setVoiceRate(res.voicePreferences.rate || 1.0);
        localStorage.setItem("preferredVoiceURI", res.voicePreferences.uri);
        localStorage.setItem("preferredVoiceRate", res.voicePreferences.rate?.toString() || "1.0");
      } else {
        // Fallback local se DB estiver vazio
        const savedVoice = localStorage.getItem("preferredVoiceURI");
        const savedRate = localStorage.getItem("preferredVoiceRate");
        if (savedVoice) setSelectedVoiceURI(savedVoice);
        if (savedRate) setVoiceRate(parseFloat(savedRate));
      }
    } else {
      toast.error("Erro ao buscar dados: " + res.error);
    }

    // 2. Busca parceiro de conta vinculado
    const partnerRes = await getLinkedPartner();
    if (partnerRes.success && partnerRes.partners && partnerRes.partners.length > 0) {
      setPartner(partnerRes.partners[0]);
    } else {
      setPartner(null);
    }

    setLoading(false);
  };

  if (!mounted) return null;

  // --- Operações de Conta Conjugal ---
  const handleLinkPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail) return;
    setLinkingPartner(true);
    const res = await linkPartnerByEmail(partnerEmail);
    if (res.success) {
      toast.success(`Sucesso! Parceiro ${res.partnerName} foi vinculado. Agora vocês visualizam e gerenciam as finanças juntos.`);
      setPartnerEmail("");
      await fetchData();
    } else {
      toast.warning("Aviso: " + res.error);
    }
    setLinkingPartner(false);
  };

  // --- Operações de Logout ---
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // --- Operações CRUD Receitas ---
  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeForm.title || incomeForm.amount <= 0) return;
    
    setLoading(true);
    if (editId) {
      const res = await updateIncome(editId, incomeForm);
      if (res.success) {
        setEditId(null);
        setIncomeForm({ title: "", amount: 0, owner: "Parceiro A" });
        await fetchData();
      } else toast.error(res.error);
    } else {
      const res = await addIncome(incomeForm);
      if (res.success) {
        setIncomeForm({ title: "", amount: 0, owner: "Parceiro A" });
        await fetchData();
      } else toast.error(res.error);
    }
  };

  const handleEditIncome = (item: any) => {
    setEditId(item.id);
    setIncomeForm({ title: item.title, amount: item.amount, owner: item.owner });
  };

  const confirmDelete = (id: string, type: "income" | "expense" | "card" | "debt", title: string) => {
    setItemToDelete({ id, type, title });
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    setDeleteConfirmOpen(false);
    
    let res;
    if (itemToDelete.type === "income") {
      res = await deleteIncome(itemToDelete.id);
    } else if (itemToDelete.type === "expense") {
      res = await deleteFixedExpense(itemToDelete.id);
    } else if (itemToDelete.type === "card") {
      res = await deleteCreditCard(itemToDelete.id);
    } else if (itemToDelete.type === "debt") {
      res = await deleteDebt(itemToDelete.id);
    }

    if (res?.success) {
      toast.success("Registro excluído com sucesso!");
      await fetchData();
    } else if (res) {
      toast.error(res.error);
    }
    
    setItemToDelete(null);
    setLoading(false);
  };

  // --- Operações CRUD Despesas ---
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || expenseForm.amount <= 0) return;

    setLoading(true);
    if (editId) {
      const res = await updateFixedExpense(editId, expenseForm);
      if (res.success) {
        setEditId(null);
        setExpenseForm({ category: "Customizada", title: "", amount: 0 });
        await fetchData();
      } else toast.error(res.error);
    } else {
      const res = await addFixedExpense(expenseForm);
      if (res.success) {
        setExpenseForm({ category: "Customizada", title: "", amount: 0 });
        await fetchData();
      } else toast.error(res.error);
    }
  };

  const handleEditExpense = (item: any) => {
    setEditId(item.id);
    setExpenseForm({ category: item.category, title: item.title, amount: item.amount });
  };

  // Exclusão gerenciada pelo modal centralizado

  // --- Operações CRUD Cartões ---
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.name || cardForm.totalLimit <= 0) return;

    setLoading(true);
    if (editId) {
      const res = await updateCreditCard(editId, cardForm);
      if (res.success) {
        setEditId(null);
        setCardForm({ name: "", totalLimit: 0, currentInvoice: 0, nextInvoice: 0, invoicesSchedule: [] });
        await fetchData();
      } else toast.error(res.error);
    } else {
      const res = await addCreditCard(cardForm);
      if (res.success) {
        setCardForm({ name: "", totalLimit: 0, currentInvoice: 0, nextInvoice: 0, invoicesSchedule: [] });
        await fetchData();
      } else toast.error(res.error);
    }
  };

  const handleEditCard = (item: any) => {
    setEditId(item.id);
    setCardForm({ 
      name: item.name, 
      totalLimit: item.total_limit, 
      currentInvoice: item.current_invoice, 
      nextInvoice: item.next_invoice,
      invoicesSchedule: parseSchedule(item.invoices_schedule)
    });
  };

  // Exclusão gerenciada pelo modal centralizado

  const addCardScheduleItem = () => {
    if (!tempScheduleMonth || tempScheduleAmount <= 0) return;
    const sched = [...parseSchedule(cardForm.invoicesSchedule)];
    const filtered = sched.filter(item => item.month !== tempScheduleMonth);
    filtered.push({ month: tempScheduleMonth, amount: tempScheduleAmount });
    filtered.sort((a, b) => a.month.localeCompare(b.month));
    setCardForm({ ...cardForm, invoicesSchedule: filtered });
    setTempScheduleMonth("");
    setTempScheduleAmount(0);
  };

  const removeCardScheduleItem = (month: string) => {
    const sched = [...parseSchedule(cardForm.invoicesSchedule)];
    const filtered = sched.filter(item => item.month !== month);
    setCardForm({ ...cardForm, invoicesSchedule: filtered });
  };

  // --- Operações CRUD Dívidas ---
  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtForm.title || debtForm.currentInstallmentValue <= 0) return;

    setLoading(true);
    if (editId) {
      const res = await updateDebt(editId, debtForm);
      if (res.success) {
        setEditId(null);
        setDebtForm({ 
          title: "", acquisitionValue: 0, totalInstallments: 12, currentInstallmentValue: 0,
          monthlyLateInterestRate: 0, penaltyValue: 0, installmentsPaid: 0, installmentsSchedule: [],
          overdueInstallments: 0, overdueValueAccumulated: 0, tipoDivida: "toxica"
        });
        await fetchData();
      } else toast.error(res.error);
    } else {
      const res = await addDebt(debtForm);
      if (res.success) {
        setDebtForm({ 
          title: "", acquisitionValue: 0, totalInstallments: 12, currentInstallmentValue: 0,
          monthlyLateInterestRate: 0, penaltyValue: 0, installmentsPaid: 0, installmentsSchedule: [],
          overdueInstallments: 0, overdueValueAccumulated: 0, tipoDivida: "toxica"
        });
        await fetchData();
      } else toast.error(res.error);
    }
  };

  const handleEditDebt = (item: any) => {
    setEditId(item.id);
    setDebtForm({ 
      title: item.title, 
      acquisitionValue: item.acquisition_value, 
      totalInstallments: item.total_installments, 
      currentInstallmentValue: item.current_installment_value,
      monthlyLateInterestRate: item.monthly_late_interest_rate,
      penaltyValue: item.penalty_value,
      installmentsPaid: item.installments_paid,
      installmentsSchedule: parseSchedule(item.installments_schedule),
      overdueInstallments: item.overdue_installments || 0,
      overdueValueAccumulated: item.overdue_value_accumulated || 0,
      tipoDivida: item.tipo_divida || item.tipoDivida || "toxica"
    });
  };

  // Exclusão gerenciada pelo modal centralizado

  const addDebtScheduleItem = () => {
    if (!tempScheduleMonth || tempScheduleAmount <= 0) return;
    const sched = [...parseSchedule(debtForm.installmentsSchedule)];
    const filtered = sched.filter(item => item.month !== tempScheduleMonth);
    filtered.push({ month: tempScheduleMonth, amount: tempScheduleAmount });
    filtered.sort((a, b) => a.month.localeCompare(b.month));
    setDebtForm({ ...debtForm, installmentsSchedule: filtered });
    setTempScheduleMonth("");
    setTempScheduleAmount(0);
  };

  const removeDebtScheduleItem = (month: string) => {
    const sched = [...parseSchedule(debtForm.installmentsSchedule)];
    const filtered = sched.filter(item => item.month !== month);
    setDebtForm({ ...debtForm, installmentsSchedule: filtered });
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-zinc-950 flex flex-col min-h-screen px-4 py-6 sm:max-w-xl sm:px-6 md:max-w-2xl lg:max-w-4xl lg:px-8 lg:py-10">
      
      {/* Header do Perfil */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 relative overflow-hidden">
            <ShieldCheck className="w-5.5 h-5.5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white sm:text-lg">Configurações do Casal</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Perfil & Parâmetros</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-yellow-500/20 text-yellow-400 bg-yellow-950/10 px-2.5 py-1 text-xs">
            Modo Editor
          </Badge>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-xl bg-zinc-900/50 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors group"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="grid grid-cols-5 gap-1.5 mb-6">
        {[
          { id: "account", label: "Conta" },
          { id: "incomes", label: "Receitas" },
          { id: "expenses", label: "Despesas" },
          { id: "cards", label: "Cartões" },
          { id: "debts", label: "Dívidas" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setEditId(null); }}
            className={`py-2 px-1 text-center rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
              activeTab === tab.id
                ? "bg-yellow-500 border-yellow-500 text-zinc-950 shadow-md shadow-yellow-500/10"
                : "bg-zinc-900/30 border-white/5 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "account" ? (
        <div className="space-y-6">
          {/* NOVO CARD: Conta Conjugal & Parceria */}
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="p-6 pb-2.5 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              Conta Conjugal & Parceria
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-500 mt-0.5">
              Vincule a conta do seu cônjuge para monitoramento e visualização compartilhada de gastos
            </CardDescription>
          </div>
          {partner ? (
            <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase tracking-wider">
              Compartilhado ✓
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black text-[9px] uppercase tracking-wider">
              Conta Individual
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {partner ? (
            <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {partner.avatar_url ? (
                  <img 
                    src={partner.avatar_url} 
                    alt={partner.full_name} 
                    className="w-10 h-10 rounded-full border border-white/5 object-cover" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-xs font-black text-zinc-400">
                    {partner.full_name ? partner.full_name.substring(0, 2).toUpperCase() : "PJ"}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-black text-zinc-200">{partner.full_name || "Parceiro"}</h4>
                  <span className="text-[10px] text-zinc-500 font-semibold block">{partner.email}</span>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-950/10 text-[9px] font-bold">
                Conectado
              </Badge>
            </div>
          ) : (
            <form onSubmit={handleLinkPartner} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block">
                  E-mail de Login do Cônjuge
                </label>
                <p className="text-[9px] text-zinc-500 font-medium">
                  Digite o e-mail cadastrado pelo seu parceiro na Fintech Casal para unificá-los sob o mesmo teto orçamentário.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="parceiro@exemplo.com"
                  value={partnerEmail}
                  onChange={e => setPartnerEmail(e.target.value)}
                  className="bg-zinc-950/85 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 flex-1 text-xs"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={linkingPartner}
                  className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-11 px-4 rounded-xl text-xs flex items-center gap-1.5"
                >
                  {linkingPartner ? "Vinculando..." : "Vincular Conta"}
                </Button>
              </div>
            </form>
          )}
            </CardContent>
          </Card>

          {/* CARD: Patrimônio & Reservas */}
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="p-6 pb-2.5">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-yellow-500" />
                Patrimônio & Reservas
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-500 mt-0.5">
                Defina seus saldos guardados para reserva de emergência e investimentos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleSaveAssets} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block">
                      Reserva Financeira Atual (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={reservaFinanceira || ""}
                      onChange={(e) => setReservaFinanceira(Number(e.target.value))}
                      className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block">
                      Investimentos Totais (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={investimentosTotal || ""}
                      onChange={(e) => setInvestimentosTotal(Number(e.target.value))}
                      className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={savingAssets}
                    className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-11 px-6 rounded-xl text-xs flex items-center gap-1.5 border-none transition-all"
                  >
                    {savingAssets ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* CARD: Configurações de Voz */}
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="p-6 pb-2.5">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Voz da IA & Conselheiro
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-500 mt-0.5">
                Escolha a voz que fará a leitura do diagnóstico e relatórios (Apenas para o seu dispositivo atual).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-4">
                
                {/* Seleção de Voz */}
                <div className="space-y-2">
                  <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block">
                    Vozes Disponíveis (Português)
                  </label>
                  {voices.length > 0 ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedVoiceURI}
                        onChange={(e) => handleVoiceChange(e.target.value, voiceRate)}
                        className="bg-zinc-950/85 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 flex-1 text-xs"
                      >
                        {voices.map(v => (
                          <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                        ))}
                      </select>
                      <Button 
                        onClick={testVoice}
                        type="button"
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black h-11 px-4 rounded-xl text-xs flex items-center gap-1.5"
                      >
                        Testar
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-500">Nenhuma voz em português encontrada neste dispositivo.</p>
                  )}
                </div>

                {/* Controle de Velocidade */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block">
                      Velocidade da Leitura
                    </label>
                    <span className="text-xs font-black text-yellow-500">{voiceRate}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.75" 
                    max="1.5" 
                    step="0.25" 
                    value={voiceRate}
                    onChange={(e) => handleVoiceChange(selectedVoiceURI, parseFloat(e.target.value))}
                    className="w-full accent-yellow-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 font-bold px-1">
                    <span>Lento</span>
                    <span>Rápido</span>
                  </div>
                </div>

                {savingVoice && (
                  <p className="text-[9px] text-emerald-500/70 font-semibold text-right animate-pulse">
                    Sincronizando com a nuvem...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">

        {/* COLUNA ESQUERDA: Formulário de Cadastro/Edição */}
        <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              {editId ? "Editar Registro" : "Adicionar Novo"}
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Preencha os campos para salvar no banco do casal</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {loading ? (
              <p className="text-xs text-zinc-550 uppercase tracking-widest font-semibold animate-pulse text-center py-10">Processando...</p>
            ) : (
              <>
                {/* FORM RECEITAS */}
                {activeTab === "incomes" && (
                  <form onSubmit={handleSaveIncome} className="space-y-4">
                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Título da Receita</label>
                      <input
                        type="text"
                        placeholder="Ex: Salário Principal, Pro labore"
                        value={incomeForm.title}
                        onChange={e => setIncomeForm({ ...incomeForm, title: e.target.value })}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor Mensal (R$)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={incomeForm.amount || ""}
                          onChange={e => setIncomeForm({ ...incomeForm, amount: Number(e.target.value) })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Responsável</label>
                        <select
                          value={incomeForm.owner}
                          onChange={e => setIncomeForm({ ...incomeForm, owner: e.target.value })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                        >
                          <option value="Parceiro A">Parceiro A</option>
                          <option value="Parceiro B">Parceiro B</option>
                          <option value="Compartilhado">Compartilhado</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-11 rounded-xl text-xs">
                        <Save className="w-4 h-4 mr-1.5" /> Salvar
                      </Button>
                      {editId && (
                        <Button type="button" onClick={() => { setEditId(null); setIncomeForm({ title: "", amount: 0, owner: "Parceiro A" }); }} className="bg-zinc-900 text-zinc-300 border border-white/5 font-bold h-11 rounded-xl text-xs px-4">
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                )}

                {/* FORM DESPESAS */}
                {activeTab === "expenses" && (
                  <form onSubmit={handleSaveExpense} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Categoria</label>
                        <select
                          value={expenseForm.category}
                          onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                        >
                          {["Água", "Luz", "Internet", "Telefonia", "Feira/Mercado", "Combustível", "Customizada"].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Título da Despesa</label>
                        <input
                          type="text"
                          placeholder="Ex: Conta de Luz"
                          value={expenseForm.title}
                          onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor Mensal (R$)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={expenseForm.amount || ""}
                        onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                        required
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-11 rounded-xl text-xs">
                        <Save className="w-4 h-4 mr-1.5" /> Salvar
                      </Button>
                      {editId && (
                        <Button type="button" onClick={() => { setEditId(null); setExpenseForm({ category: "Customizada", title: "", amount: 0 }); }} className="bg-zinc-900 text-zinc-300 border border-white/5 font-bold h-11 rounded-xl text-xs px-4">
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                )}

                {/* FORM CARTÕES */}
                {activeTab === "cards" && (
                  <form onSubmit={handleSaveCard} className="space-y-4">
                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Instituição / Nome do Cartão</label>
                      <input
                        type="text"
                        placeholder="Ex: Nubank, Neon"
                        value={cardForm.name}
                        onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Limite Total</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={cardForm.totalLimit || ""}
                          onChange={e => setCardForm({ ...cardForm, totalLimit: Number(e.target.value) })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-2 w-full text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Fatura Atual</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={cardForm.currentInvoice || ""}
                          onChange={e => setCardForm({ ...cardForm, currentInvoice: Number(e.target.value) })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-2 w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Próx. Fatura</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={cardForm.nextInvoice || ""}
                          onChange={e => setCardForm({ ...cardForm, nextInvoice: Number(e.target.value) })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-2 w-full text-xs"
                        />
                      </div>
                    </div>

                    {/* Editor de Cronograma de Faturas */}
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 space-y-2">
                      <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block">Cronograma de Faturas Futuras (Opcional)</span>
                      
                      <div className="grid grid-cols-3 gap-2 items-end">
                        <div>
                          <label className="text-[8px] text-zinc-650 block mb-1">Mês (Ex: 08/2026)</label>
                          <input
                            type="month"
                            value={tempScheduleMonth}
                            onChange={e => setTempScheduleMonth(e.target.value)}
                            className="bg-zinc-950/80 border border-white/5 rounded-lg text-zinc-200 p-2 w-full text-xs [color-scheme:dark]"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-zinc-650 block mb-1">Valor Fatura</label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={tempScheduleAmount || ""}
                            onChange={e => setTempScheduleAmount(Number(e.target.value))}
                            className="bg-zinc-950/80 border border-white/5 rounded-lg text-zinc-200 p-2 w-full text-xs"
                          />
                        </div>
                        <Button type="button" onClick={addCardScheduleItem} className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold h-9 rounded-lg text-[10px] w-full">
                          Adicionar
                        </Button>
                      </div>

                      {/* Lista de faturas agendadas */}
                      {parseSchedule(cardForm.invoicesSchedule).length > 0 && (
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto mt-2 pr-1">
                          {parseSchedule(cardForm.invoicesSchedule).map((sch, i) => (
                            <div key={i} className="flex justify-between items-center bg-zinc-900/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                              <span className="text-[10px] font-bold text-yellow-400">{sch.month}</span>
                              <span className="text-[10px] font-black text-zinc-300">R$ {sch.amount.toFixed(2)}</span>
                              <button type="button" onClick={() => removeCardScheduleItem(sch.month)} className="text-zinc-600 hover:text-rose-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-11 rounded-xl text-xs">
                        <Save className="w-4 h-4 mr-1.5" /> Salvar
                      </Button>
                      {editId && (
                        <Button type="button" onClick={() => { setEditId(null); setCardForm({ name: "", totalLimit: 0, currentInvoice: 0, nextInvoice: 0, invoicesSchedule: [] }); }} className="bg-zinc-900 text-zinc-300 border border-white/5 font-bold h-11 rounded-xl text-xs px-4">
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                )}

                {/* FORM DÍVIDAS */}
                {activeTab === "debts" && (
                  <form onSubmit={handleSaveDebt} className="space-y-4">
                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Título da Dívida / Financiamento</label>
                      <input
                        type="text"
                        placeholder="Ex: Financiamento de Carro, Terreno"
                        value={debtForm.title}
                        onChange={e => setDebtForm({ ...debtForm, title: e.target.value })}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Qual o tipo dessa conta?</label>
                      <select
                        value={debtForm.tipoDivida || "toxica"}
                        onChange={e => setDebtForm({ ...debtForm, tipoDivida: e.target.value as any })}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11"
                        required
                      >
                        <option value="toxica">Dívida de Cartão / Empréstimo (Curto Prazo)</option>
                        <option value="estrutural">Financiamento de Patrimônio / Consórcio (Longo Prazo)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor Total (Aquisição)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={debtForm.acquisitionValue || ""}
                          onChange={e => setDebtForm({ ...debtForm, acquisitionValue: Number(e.target.value) })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block mb-1">Valor da Parcela Atual</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={debtForm.currentInstallmentValue || ""}
                          onChange={e => setDebtForm({ ...debtForm, currentInstallmentValue: Number(e.target.value) })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] text-zinc-550 block mb-1">Juros Atraso/Mês (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={debtForm.monthlyLateInterestRate || ""}
                          onChange={e => setDebtForm({ ...debtForm, monthlyLateInterestRate: Number(e.target.value) })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 p-2 w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-zinc-550 block mb-1">Valor da Multa (R$)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={debtForm.penaltyValue || ""}
                          onChange={e => setDebtForm({ ...debtForm, penaltyValue: Number(e.target.value) })}
                          className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 p-2 w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-zinc-550 block mb-1">Pagas / Total</label>
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            placeholder="Pagas"
                            value={debtForm.installmentsPaid || ""}
                            onChange={e => setDebtForm({ ...debtForm, installmentsPaid: Number(e.target.value) })}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 p-2 w-full text-center text-xs"
                          />
                          <span className="text-zinc-650 text-xs">/</span>
                          <input
                            type="number"
                            placeholder="Total"
                            value={debtForm.totalInstallments || ""}
                            onChange={e => setDebtForm({ ...debtForm, totalInstallments: Number(e.target.value) })}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 p-2 w-full text-center text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Campos de Parcelas Vencidas em Atraso */}
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 space-y-2">
                      <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block flex items-center gap-1.5 text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        Atrasos no Pagamento (Terrenos / Carnês)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[8px] text-zinc-550 block mb-1">Nº Parcelas Vencidas</label>
                          <input
                            type="number"
                            placeholder="Ex: 5"
                            value={debtForm.overdueInstallments || ""}
                            onChange={e => setDebtForm({ ...debtForm, overdueInstallments: Number(e.target.value) })}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 p-2.5 w-full text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-zinc-550 block mb-1">Total com Juros (R$)</label>
                          <input
                            type="number"
                            placeholder="Ex: 1300.00"
                            value={debtForm.overdueValueAccumulated || ""}
                            onChange={e => setDebtForm({ ...debtForm, overdueValueAccumulated: Number(e.target.value) })}
                            className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 p-2.5 w-full text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Editor de Cronograma de Parcelas */}
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 space-y-2">
                      <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-bold block">Cronograma de Parcelas Variáveis (Opcional)</span>
                      
                      <div className="grid grid-cols-3 gap-2 items-end">
                        <div>
                          <label className="text-[8px] text-zinc-650 block mb-1">Mês (Ex: 08/2026)</label>
                          <input
                            type="month"
                            value={tempScheduleMonth}
                            onChange={e => setTempScheduleMonth(e.target.value)}
                            className="bg-zinc-950/80 border border-white/5 rounded-lg text-zinc-200 p-2 w-full text-xs [color-scheme:dark]"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-zinc-650 block mb-1">Valor Parcela</label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={tempScheduleAmount || ""}
                            onChange={e => setTempScheduleAmount(Number(e.target.value))}
                            className="bg-zinc-950/80 border border-white/5 rounded-lg text-zinc-200 p-2 w-full text-xs"
                          />
                        </div>
                        <Button type="button" onClick={addDebtScheduleItem} className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold h-9 rounded-lg text-[10px] w-full">
                          Adicionar
                        </Button>
                      </div>

                      {/* Lista de parcelas variáveis agendadas */}
                      {parseSchedule(debtForm.installmentsSchedule).length > 0 && (
                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto mt-2 pr-1">
                          {parseSchedule(debtForm.installmentsSchedule).map((sch, i) => (
                            <div key={i} className="flex justify-between items-center bg-zinc-900/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                              <span className="text-[10px] font-bold text-yellow-400">{sch.month}</span>
                              <span className="text-[10px] font-black text-zinc-300">R$ {sch.amount.toFixed(2)}</span>
                              <button type="button" onClick={() => removeDebtScheduleItem(sch.month)} className="text-zinc-600 hover:text-rose-400">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-11 rounded-xl text-xs">
                        <Save className="w-4 h-4 mr-1.5" /> Salvar
                      </Button>
                      {editId && (
                        <Button type="button" onClick={() => { setEditId(null); setDebtForm({ title: "", acquisitionValue: 0, totalInstallments: 12, currentInstallmentValue: 0, monthlyLateInterestRate: 0, penaltyValue: 0, installmentsPaid: 0, installmentsSchedule: [], overdueInstallments: 0, overdueValueAccumulated: 0, tipoDivida: "toxica" }); }} className="bg-zinc-900 text-zinc-300 border border-white/5 font-bold h-11 rounded-xl text-xs px-4">
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* COLUNA DIREITA: Listagem de Registros Ativos */}
        <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-yellow-500" />
              Lista de Parâmetros Ativos
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-550 mt-0.5">Veja e altere as configurações atuais do seu orçamento</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {loading ? (
              <p className="text-xs text-zinc-550 uppercase tracking-widest font-semibold animate-pulse text-center py-10">Buscando do banco...</p>
            ) : (
              <>
                {/* LISTAGEM DE INCOMES */}
                {activeTab === "incomes" && incomes.map((item, idx) => (
                  <div key={idx} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-zinc-200">{item.title}</h4>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[10px] text-emerald-400 font-bold">R$ {Number(item.amount).toFixed(2)}</span>
                        <span className="text-[9px] text-zinc-650 font-semibold uppercase tracking-wider">&bull; {item.owner}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditIncome(item)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => confirmDelete(item.id, "income", item.title)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* LISTAGEM DE DESPESAS */}
                {activeTab === "expenses" && fixedExpenses.map((item, idx) => (
                  <div key={idx} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[8px] uppercase font-bold py-0">{item.category}</Badge>
                        <h4 className="text-xs font-black text-zinc-200">{item.title}</h4>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-bold block mt-1">R$ {Number(item.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditExpense(item)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => confirmDelete(item.id, "expense", item.title)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* LISTAGEM DE CARTÕES */}
                {activeTab === "cards" && creditCards.map((item, idx) => (
                  <div key={idx} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black text-zinc-200">{item.name}</h4>
                        <span className="text-[9px] text-zinc-500 font-semibold">Limite: R$ {Number(item.total_limit).toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditCard(item)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                         <button onClick={() => confirmDelete(item.id, "card", item.name)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-white/5 pt-2">
                      <div>
                        <span className="text-zinc-550 block">Fatura Atual:</span>
                        <span className="font-bold text-rose-400">R$ {Number(item.current_invoice).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-550 block">Próxima Fatura:</span>
                        <span className="font-bold text-zinc-350">R$ {Number(item.next_invoice || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    {parseSchedule(item.invoices_schedule).length > 0 && (
                      <div className="bg-zinc-900/30 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[8px] text-zinc-500 uppercase tracking-wider block mb-1">Futuros Fechamentos Agendados:</span>
                        <div className="grid grid-cols-3 gap-1">
                          {parseSchedule(item.invoices_schedule).map((sch: any, i: number) => (
                            <div key={i} className="bg-zinc-950/60 p-1 rounded border border-white/5 text-center">
                              <span className="text-[8px] text-yellow-500 block font-bold">{sch.month}</span>
                              <span className="text-[9px] text-zinc-300 block font-bold">R$ {Number(sch.amount).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* LISTAGEM DE DÍVIDAS */}
                {activeTab === "debts" && debts.map((item, idx) => (
                  <div key={idx} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black text-zinc-200">{item.title}</h4>
                        <span className="text-[9px] text-zinc-500 block font-semibold">Total: R$ {Number(item.acquisition_value).toFixed(2)} &bull; Pagas: {item.installments_paid}/{item.total_installments}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditDebt(item)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                         <button onClick={() => confirmDelete(item.id, "debt", item.title)} className="p-2 rounded-lg bg-zinc-900 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-white/5 pt-2">
                      <div>
                        <span className="text-zinc-550 block">Parcela Regular:</span>
                        <span className="font-black text-yellow-500">R$ {Number(item.current_installment_value).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-550 block">Juros/Atraso Mensal:</span>
                        <span className="font-bold text-rose-400">{Number(item.monthly_late_interest_rate).toFixed(1)}% ({Number(item.penalty_value).toFixed(0)} Multa)</span>
                      </div>
                    </div>
                    {item.overdue_installments > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span className="text-[9px] text-rose-300 font-bold">
                          {item.overdue_installments} parcelas vencidas em atraso totalizando R$ {Number(item.overdue_value_accumulated).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {parseSchedule(item.installments_schedule).length > 0 && (
                      <div className="bg-zinc-900/30 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[8px] text-zinc-550 uppercase tracking-wider block mb-1">Parcelas Variáveis Agendadas:</span>
                        <div className="grid grid-cols-3 gap-1">
                          {parseSchedule(item.installments_schedule).map((sch: any, i: number) => (
                            <div key={i} className="bg-zinc-950/60 p-1 rounded border border-white/5 text-center">
                              <span className="text-[8px] text-yellow-500 block font-bold">{sch.month}</span>
                              <span className="text-[9px] text-zinc-300 block font-bold">R$ {Number(sch.amount).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

      </div>
      )}

      {/* Footer / Barra de Navegação PWA Minimalista */}
      <footer className="mt-10 pt-5 border-t border-white/5 flex justify-around text-zinc-600 text-xs">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 hover:text-zinc-400 transition-colors">
          <Coins className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Dashboard</span>
        </Link>
        <Link href="/transactions" className="flex flex-col items-center gap-1 hover:text-zinc-400 transition-colors">
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Transações</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-yellow-500 font-bold transition-colors">
          <ShieldCheck className="w-5 h-5 animate-pulse" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Perfil</span>
        </Link>
      </footer>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-zinc-950 border border-white/10 shadow-2xl sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-zinc-405 text-xs mt-2">
              Tem certeza que deseja excluir <strong>{itemToDelete?.title}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="text-zinc-400 hover:text-white rounded-xl">
              Cancelar
            </Button>
            <Button onClick={executeDelete} className="bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl">
              Excluir Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
