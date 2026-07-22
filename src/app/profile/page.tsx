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
  LogOut,
  Target,
  Plus,
  CheckCircle2,
  UserCheck,
  Users,
  CreditCard,
  Key,
  Loader2
} from "lucide-react";
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
  deleteUserAccount,
  getGoals, addGoal, updateGoal, deleteGoal,
  generateFinancialStrategy,
  IncomeInput, FixedExpenseInput, CreditCardInput, DebtInput, GoalInput
} from "@/actions/onboarding";
import { createClient } from "@/lib/supabase/client";
import { TiltCard } from "@/components/ui/tilt-card";
import { Header } from "@/components/dashboard/header";
import { cn } from "@/lib/utils";

// Helper para obter o mês formatado em PT-BR
function getMonthLabelPT(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return `${months[month - 1]} de ${year}`;
}

// Helper para calcular o cronograma de faturas
function generateCardSchedule(
  currentInvoice: number,
  isInvoiceClosed: boolean,
  closingDay: number,
  dueDay: number,
  futureInvoices: { month: string; amount: number; dueDay: number }[]
) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const schedule: { month: string; date: string; amount: number }[] = [];

  let closingMonth = currentMonth;
  let closingYear = currentYear;

  if (currentDay >= closingDay || isInvoiceClosed) {
    closingMonth += 1;
    if (closingMonth > 12) {
      closingMonth = 1;
      closingYear += 1;
    }
  }

  let dueMonth = closingMonth + 1;
  let dueYear = closingYear;
  if (dueMonth > 12) {
    dueMonth = 1;
    dueYear += 1;
  }

  const currentInvoiceMonth = `${dueYear}-${String(dueMonth).padStart(2, '0')}`;
  const currentInvoiceDueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

  schedule.push({
    month: currentInvoiceMonth,
    date: currentInvoiceDueDate,
    amount: currentInvoice
  });

  let nextDueMonth = dueMonth;
  let nextDueYear = dueYear;

  futureInvoices.forEach((fut) => {
    nextDueMonth += 1;
    if (nextDueMonth > 12) {
      nextDueMonth = 1;
      nextDueYear += 1;
    }
    const mStr = `${nextDueYear}-${String(nextDueMonth).padStart(2, '0')}`;
    const dStr = `${nextDueYear}-${String(nextDueMonth).padStart(2, '0')}-${String(fut.dueDay || dueDay).padStart(2, '0')}`;
    schedule.push({
      month: mStr,
      date: dStr,
      amount: fut.amount
    });
  });

  return schedule;
}

// Helper para retornar a lista de meses futuros
function getFutureMonths(
  isInvoiceClosed: boolean,
  closingDay: number,
  dueDay: number,
  count: number
) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  let closingMonth = currentMonth;
  let closingYear = currentYear;

  if (currentDay >= closingDay || isInvoiceClosed) {
    closingMonth += 1;
    if (closingMonth > 12) {
      closingMonth = 1;
      closingYear += 1;
    }
  }

  let dueMonth = closingMonth + 1;
  let dueYear = closingYear;
  if (dueMonth > 12) {
    dueMonth = 1;
    dueYear += 1;
  }

  const list: { month: string; label: string }[] = [];
  let nextMonth = dueMonth;
  let nextYear = dueYear;

  for (let i = 0; i < count; i++) {
    nextMonth += 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const mStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    list.push({
      month: mStr,
      label: getMonthLabelPT(mStr)
    });
  }

  return list;
}

// Componente CustomSelect Premium com design dourado/amarelo
function CustomSelect({
  value,
  onChange,
  options,
  className
}: {
  value: string;
  onChange: (val: any) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs h-11 flex justify-between items-center text-left transition-all",
          open && "border-yellow-500/50",
          className
        )}
      >
        <span className="font-semibold text-zinc-300">{selectedOption?.label}</span>
        <span className="text-[10px] text-zinc-500">▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left p-2.5 rounded-lg text-xs font-bold transition-all",
                  opt.value === value
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "text-zinc-400 hover:bg-yellow-500 hover:text-zinc-950"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasStrategy, setHasStrategy] = useState(false);

  // Dados do Parceiro Conjugal
  const [partner, setPartner] = useState<any | null>(null);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [linkingPartner, setLinkingPartner] = useState(false);

  // Dados carregados do banco
  const [incomes, setIncomes] = useState<any[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [goals, setGoals] = useState<GoalInput[]>([]);

  // Estados de edição / criação
  const [activeTab, setActiveTab] = useState<"account" | "incomes" | "expenses" | "cards" | "debts" | "goals">("account");
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
  const [expenseForm, setExpenseForm] = useState<FixedExpenseInput>({ category: "Customizada", title: "", amount: 0, dueDay: 15 });
  const [cardForm, setCardForm] = useState<any>({ name: "", totalLimit: 0, currentInvoice: 0, nextInvoice: 0, invoicesSchedule: [] });
  const [debtForm, setDebtForm] = useState<DebtInput>({ 
    title: "", acquisitionValue: 0, totalInstallments: 12, currentInstallmentValue: 0,
    monthlyLateInterestRate: 0, penaltyValue: 0, installmentsPaid: 0, installmentsSchedule: [],
    overdueInstallments: 0, overdueValueAccumulated: 0, tipoDivida: "toxica"
  });
  const [goalForm, setGoalForm] = useState<GoalInput>({ title: "", targetAmount: 0, currentAmount: 0 });

  // Schedule sub-editors
  const [tempScheduleMonth, setTempScheduleMonth] = useState("");
  const [tempScheduleAmount, setTempScheduleAmount] = useState(0);

  // Confirmar exclusão dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "income" | "expense" | "card" | "debt" | "goal"; title: string } | null>(null);
  
  // Exclusão definitiva de conta LGPD
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
    const supabase = createClient();
    
    // Busca informações de perfil do usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setUserProfile(profile);
    }
    
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

    // 3. Busca metas e sonhos do casal
    const goalsRes = await getGoals();
    if (goalsRes.success && goalsRes.data) {
      setGoals(goalsRes.data);
    }

    try {
      const stratRes = await generateFinancialStrategy();
      setHasStrategy(!!stratRes.hasStrategy);
    } catch (err) {
      console.error("Erro ao verificar estratégia:", err);
    }

    setLoading(false);
  };

  if (!mounted || loading) {
    return (
      <div className="flex-1 w-full bg-zinc-950 flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-yellow-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-pulse">
            <Coins className="w-6 h-6 text-yellow-500 animate-spin [animation-duration:3s]" />
          </div>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest animate-pulse">
            Carregando Perfil...
          </p>
        </div>
      </div>
    );
  }

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

  // --- Operações de Exclusão de Conta (LGPD) ---
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    const res = await deleteUserAccount();
    setDeletingAccount(false);
    setDeleteAccountConfirmOpen(false);
    if (res.success) {
      toast.success("Todos os seus dados foram definitivamente removidos!");
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } else {
      toast.error("Erro ao excluir dados: " + res.error);
    }
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
    setIncomeForm({ title: item.title, amount: item.amount, owner: item.owner, receiptDay: item.receiptDay || 5 });
  };

  const confirmDelete = (id: string, type: "income" | "expense" | "card" | "debt" | "goal", title: string) => {
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
    } else if (itemToDelete.type === "goal") {
      res = await deleteGoal(itemToDelete.id);
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

  // --- Operações CRUD Metas & Sonhos ---
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.title || goalForm.targetAmount <= 0) {
      toast.error("Preencha o título e o valor-alvo da meta.");
      return;
    }
    setLoading(true);
    if (editId) {
      const res = await updateGoal(editId, goalForm);
      if (res.success) {
        setEditId(null);
        setGoalForm({ title: "", targetAmount: 0, currentAmount: 0 });
        await fetchData();
        toast.success("Meta atualizada!");
      } else toast.error(res.error);
    } else {
      const res = await addGoal(goalForm);
      if (res.success) {
        setGoalForm({ title: "", targetAmount: 0, currentAmount: 0 });
        await fetchData();
        toast.success("Meta adicionada!");
      } else toast.error(res.error);
    }
    setLoading(false);
  };

  const handleEditGoal = (item: GoalInput) => {
    setEditId(item.id!);
    setGoalForm({ title: item.title, targetAmount: item.targetAmount, currentAmount: item.currentAmount });
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
        setExpenseForm({ category: "Customizada", title: "", amount: 0, dueDay: 15 });
        await fetchData();
      } else toast.error(res.error);
    } else {
      const res = await addFixedExpense(expenseForm);
      if (res.success) {
        setExpenseForm({ category: "Customizada", title: "", amount: 0, dueDay: 15 });
        await fetchData();
      } else toast.error(res.error);
    }
  };

  const handleEditExpense = (item: any) => {
    setEditId(item.id);
    setExpenseForm({ category: item.category, title: item.title, amount: item.amount, dueDay: item.dueDay || 15 });
  };

  // --- Operações CRUD Cartões ---
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.name || cardForm.totalLimit <= 0) return;

    // Validação de limite total acumulado
    const futureSum = (cardForm.futureInvoices || []).reduce((acc: number, f: any) => acc + Number(f.amount || 0), 0);
    const totalAccumulatedInvoice = Number(cardForm.currentInvoice || 0) + futureSum;
    if (totalAccumulatedInvoice > cardForm.totalLimit) {
      toast.error(`A soma das faturas do cartão ${cardForm.name} ultrapassa o limite total do cartão! Por favor ajuste.`);
      return;
    }

    setLoading(true);

    const schedule = generateCardSchedule(
      cardForm.currentInvoice || 0,
      !!cardForm.isInvoiceClosed,
      cardForm.closingDay || 5,
      cardForm.dueDay || 15,
      cardForm.futureInvoices || []
    );

    const nextInvoiceVal = cardForm.futureInvoices && cardForm.futureInvoices[0] ? Number(cardForm.futureInvoices[0].amount) : 0;

    const payload = {
      ...cardForm,
      nextInvoice: nextInvoiceVal,
      invoicesSchedule: schedule
    };

    if (editId) {
      const res = await updateCreditCard(editId, payload);
      if (res.success) {
        setEditId(null);
        setCardForm({ name: "", totalLimit: 0, currentInvoice: 0, nextInvoice: 0, invoicesSchedule: [] });
        await fetchData();
        toast.success("Cartão atualizado com sucesso!");
      } else toast.error(res.error);
    } else {
      const res = await addCreditCard(payload);
      if (res.success) {
        setCardForm({ name: "", totalLimit: 0, currentInvoice: 0, nextInvoice: 0, invoicesSchedule: [] });
        await fetchData();
        toast.success("Cartão cadastrado com sucesso!");
      } else toast.error(res.error);
    }
  };

  const handleEditCard = (item: any) => {
    setEditId(item.id);
    const schedule = parseSchedule(item.invoices_schedule);
    const futureInvoices = schedule.slice(1).map(s => {
      let day = item.dueDay || item.due_day || 15;
      if (s.date && s.date.includes("-")) {
        const parts = s.date.split("-");
        if (parts[2]) day = parseInt(parts[2]);
      }
      return {
        month: s.month,
        amount: Number(s.amount),
        dueDay: day
      };
    });

    setCardForm({ 
      name: item.name.replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, ""), 
      totalLimit: Number(item.total_limit || item.totalLimit || 0), 
      currentInvoice: Number(item.current_invoice || item.currentInvoice || 0), 
      nextInvoice: Number(item.next_invoice || item.nextInvoice || 0),
      dueDay: item.dueDay || item.due_day || 15,
      closingDay: item.closingDay || item.closing_day || 5,
      isInvoiceClosed: false,
      hasFutureInvoices: futureInvoices.length > 0,
      futureInvoicesCount: futureInvoices.length,
      futureInvoices: futureInvoices,
      invoicesSchedule: schedule
    } as any);
  };

  const addCardScheduleItem = () => {
    if (!tempScheduleMonth || tempScheduleAmount <= 0) return;
    const sched = [...parseSchedule(cardForm.invoicesSchedule)];
    const monthKey = tempScheduleMonth.length >= 7 ? tempScheduleMonth.substring(0, 7) : tempScheduleMonth;
    const filtered = sched.filter(item => item.month !== monthKey && item.date !== tempScheduleMonth);
    filtered.push({ month: monthKey, date: tempScheduleMonth, amount: tempScheduleAmount });
    filtered.sort((a, b) => (a.date || a.month).localeCompare(b.date || b.month));
    setCardForm({ ...cardForm, invoicesSchedule: filtered });
    setTempScheduleMonth("");
    setTempScheduleAmount(0);
  };

  const removeCardScheduleItem = (monthOrDate: string) => {
    const sched = [...parseSchedule(cardForm.invoicesSchedule)];
    const filtered = sched.filter(item => item.month !== monthOrDate && item.date !== monthOrDate);
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
      dueDay: item.dueDay || 10,
      nextDueDate: item.nextDueDate || "",
      installmentsSchedule: parseSchedule(item.installments_schedule),
      overdueInstallments: item.overdue_installments || 0,
      overdueValueAccumulated: item.overdue_value_accumulated || 0,
      tipoDivida: item.tipo_divida || item.tipoDivida || "toxica"
    });
  };

  const addDebtScheduleItem = () => {
    if (!tempScheduleMonth || tempScheduleAmount <= 0) return;
    const sched = [...parseSchedule(debtForm.installmentsSchedule)];
    const monthKey = tempScheduleMonth.length >= 7 ? tempScheduleMonth.substring(0, 7) : tempScheduleMonth;
    const filtered = sched.filter(item => item.month !== monthKey && item.date !== tempScheduleMonth);
    filtered.push({ month: monthKey, date: tempScheduleMonth, amount: tempScheduleAmount });
    filtered.sort((a, b) => (a.date || a.month).localeCompare(b.date || b.month));
    setDebtForm({ ...debtForm, installmentsSchedule: filtered });
    setTempScheduleMonth("");
    setTempScheduleAmount(0);
  };

  const removeDebtScheduleItem = (monthOrDate: string) => {
    const sched = [...parseSchedule(debtForm.installmentsSchedule)];
    const filtered = sched.filter(item => item.month !== monthOrDate && item.date !== monthOrDate);
    setDebtForm({ ...debtForm, installmentsSchedule: filtered });
  };

  // Valores de Resumo Global para os Cartões
  const totalLimit = creditCards.reduce((acc, c) => acc + Number(c.total_limit || c.totalLimit || 0), 0);
  const totalInvoices = creditCards.reduce((acc, c) => acc + Number(c.current_invoice || c.currentInvoice || 0), 0);

  return (
    <div className="flex-1 w-full mx-auto bg-transparent flex flex-col min-h-screen px-3 py-4 xs:px-4 xs:py-6 pb-24 sm:pb-24 max-w-full xs:max-w-[480px] sm:max-w-[768px] tablet:max-w-[834px] md:max-w-[1024px] lg:max-w-[1440px] laptop:max-w-[1600px] sm:px-6 md:px-8 lg:py-8 space-y-6">
      
      {/* Header Unificado do App */}
      <Header 
        userProfile={userProfile}
        selectedMonthStr={new Date().toISOString().substring(0, 7)}
        hasStrategy={hasStrategy}
        getReadableMonthLabel={(monthStr) => {
          const [year, month] = monthStr.split("-").map(Number);
          const months = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
          ];
          return `${months[month - 1]} de ${year}`;
        }}
        handleLogout={handleLogout}
      />

      {/* Hero Section */}
      <section className="relative text-center py-4 space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold mb-1 backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.15)] animate-pulse">
          🔒 Configurações Seguras & Parâmetros
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
          Perfil & <br className="sm:hidden" />
          <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Gestão do Casal
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Gerencie o vínculo familiar de dados RLS, edite receitas, despesas fixas, parâmetros de cartões, faturas e dívidas consolidadas.
        </p>
      </section>

      {/* Grid Principal de 2 Colunas com Layout de Menu Lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full flex-grow">
        
        {/* COLUNA ESQUERDA (lg:col-span-3): Navegação das Abas (Menu Lateral no Desktop, Horizontal no Mobile) */}
        <div className="lg:col-span-3 flex flex-row lg:flex-col overflow-x-auto gap-2 bg-[#121214]/60 p-3 sm:p-4 rounded-2xl border border-[#27272A] backdrop-blur-md select-none no-scrollbar scroll-smooth w-full lg:h-fit" data-lenis-prevent>
          {[
            { id: "account", label: "Conta & Voz IA", icon: Heart },
            { id: "incomes", label: "Receitas", icon: Coins },
            { id: "expenses", label: "Despesas Fixas", icon: AlertTriangle },
            { id: "cards", label: "Cartões", icon: CreditCard },
            { id: "debts", label: "Dívidas", icon: AlertTriangle },
            { id: "goals", label: "🎯 Metas", icon: Target },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setEditId(null); }}
                className={cn(
                  "flex items-center gap-2 py-2.5 px-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider border transition-all whitespace-nowrap lg:w-full",
                  isSelected
                    ? "bg-yellow-500 border-yellow-500 text-zinc-950 shadow-md shadow-yellow-500/10"
                    : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* COLUNA DIREITA (lg:col-span-9): Área de Conteúdo da Aba Ativa */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          
          {activeTab === "account" ? (
            /* Layout Compacto de Duas Colunas para Perfil / Configurações Gerais */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Lado Esquerdo: Conta Conjugal & LGPD */}
              <div className="space-y-6">
                <TiltCard glowColor="rgba(234, 179, 8, 0.15)" disableTilt={true} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase">Conta Conjugal & Parceria</h3>
                      <span className="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Vínculo de Acesso RLS</span>
                    </div>
                  </div>

                  {partner ? (
                    <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {partner.avatar_url ? (
                          <img 
                            src={partner.avatar_url} 
                            alt={partner.full_name} 
                            className="w-9 h-9 rounded-full border border-white/5 object-cover" 
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] font-black text-zinc-400">
                            {partner.full_name ? partner.full_name.substring(0, 2).toUpperCase() : "PJ"}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-black text-zinc-200">{partner.full_name || "Parceiro"}</h4>
                          <span className="text-[9px] text-zinc-500 font-semibold block">{partner.email}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-950/15 text-[8px] font-bold py-0.5 px-2">
                        Conectado
                      </Badge>
                    </div>
                  ) : (
                    <form onSubmit={handleLinkPartner} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">
                          E-mail de Login do Cônjuge
                        </label>
                        <p className="text-[9px] text-zinc-500 leading-relaxed">
                          Digite o e-mail cadastrado pelo seu parceiro na Fintech Casal para unificá-los sob o mesmo teto orçamentário.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="parceiro@exemplo.com"
                          value={partnerEmail}
                          onChange={e => setPartnerEmail(e.target.value)}
                          className="bg-zinc-950/85 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 flex-1 text-xs"
                          required
                        />
                        <Button 
                          type="submit" 
                          disabled={linkingPartner}
                          className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-10 px-4 rounded-xl text-xs flex items-center gap-1.5"
                        >
                          {linkingPartner ? "Vinculando..." : "Vincular"}
                        </Button>
                      </div>
                    </form>
                  )}
                </TiltCard>

                <TiltCard glowColor="rgba(244, 63, 94, 0.15)" disableTilt={true} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase">Excluir Conta (LGPD)</h3>
                      <span className="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Ação Irreversível</span>
                    </div>
                  </div>
                  <div className="bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl space-y-3">
                    <p className="text-[10px] text-rose-400 font-bold leading-relaxed">
                      Esta ação apagará de forma irreversível todas as transações, receitas, cartões de crédito, dívidas e logs cadastrados por este casal.
                    </p>
                    <Button
                      onClick={() => setDeleteAccountConfirmOpen(true)}
                      type="button"
                      className="bg-rose-600 hover:bg-rose-500 text-white font-black h-10 px-4 rounded-xl text-xs flex items-center gap-1.5 border-none shadow-[0_4px_15px_rgba(244,63,94,0.15)] transition-all w-full justify-center"
                    >
                      Excluir permanentemente todos os dados
                    </Button>
                  </div>
                </TiltCard>
              </div>

              {/* Lado Direito: Patrimônio & Voz IA */}
              <div className="space-y-6">
                <TiltCard glowColor="rgba(234, 179, 8, 0.15)" disableTilt={true} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase">Patrimônio & Reservas</h3>
                      <span className="text-[9px] text-zinc-555 uppercase font-bold tracking-wider">Saldos Globais Compartilhados</span>
                    </div>
                  </div>

                  <form onSubmit={handleSaveAssets} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">
                          Reserva Financeira (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={reservaFinanceira || ""}
                          onChange={(e) => setReservaFinanceira(Number(e.target.value))}
                          className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">
                          Investimentos Totais (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={investimentosTotal || ""}
                          onChange={(e) => setInvestimentosTotal(Number(e.target.value))}
                          className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={savingAssets}
                        className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-10 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                      >
                        {savingAssets ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </div>
                  </form>
                </TiltCard>

                <TiltCard glowColor="rgba(234, 179, 8, 0.15)" disableTilt={true} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase">Voz da IA & Conselheiro</h3>
                      <span className="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Configuração Local do Dispositivo</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">
                        Vozes Disponíveis (Português)
                      </label>
                      {voices.length > 0 ? (
                        <div className="flex gap-2">
                          <select
                            value={selectedVoiceURI}
                            onChange={(e) => handleVoiceChange(e.target.value, voiceRate)}
                            className="bg-zinc-950/85 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 flex-1 text-xs"
                          >
                            {voices.map(v => (
                              <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                            ))}
                          </select>
                          <Button 
                            onClick={testVoice}
                            type="button"
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold h-10 px-4 rounded-xl text-xs flex items-center gap-1.5"
                          >
                            Testar
                          </Button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-500">Nenhuma voz em português encontrada neste dispositivo.</p>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">
                          Velocidade de Leitura
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
                      <div className="flex justify-between text-[8px] text-zinc-500 font-bold px-1">
                        <span>Lento</span>
                        <span>Rápido</span>
                      </div>
                    </div>

                    {savingVoice && (
                      <p className="text-[9px] text-emerald-500/70 font-semibold text-right animate-pulse">
                        Sincronizando preferências de voz...
                      </p>
                    )}
                  </div>
                </TiltCard>
              </div>

            </div>
          ) : (
            /* Layout Grid Lado-a-Lado no Desktop para Abas CRUD */
            <div className="flex-1 flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
              
              {/* Formulário de Cadastro/Edição (lg:col-span-5) */}
              <div className="lg:col-span-5 w-full">
                <TiltCard glowColor="rgba(234, 179, 8, 0.15)" disableTilt={true} className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase">{editId ? "Editar Registro" : "Adicionar Novo"}</h3>
                      <span className="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Banco de Dados Compartilhado</span>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                    </div>
                  ) : (
                    <>
                      {/* FORM RECEITAS */}
                      {activeTab === "incomes" && (
                        <form onSubmit={handleSaveIncome} className="space-y-4">
                          <div>
                            <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">Título da Receita</label>
                            <input
                              type="text"
                              placeholder="Ex: Salário Principal, Pro labore"
                              value={incomeForm.title}
                              onChange={e => setIncomeForm({ ...incomeForm, title: e.target.value })}
                              className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Valor Mensal (R$)</label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={incomeForm.amount || ""}
                                onChange={e => setIncomeForm({ ...incomeForm, amount: Number(e.target.value) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Dia Recebimento</label>
                              <input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="05"
                                value={incomeForm.receiptDay || 5}
                                onChange={e => setIncomeForm({ ...incomeForm, receiptDay: Math.max(1, Math.min(31, Number(e.target.value))) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Responsável</label>
                              <CustomSelect
                                value={incomeForm.owner}
                                onChange={val => setIncomeForm({ ...incomeForm, owner: val })}
                                options={[
                                  { value: "Parceiro A", label: "Parceiro A" },
                                  { value: "Parceiro B", label: "Parceiro B" },
                                  { value: "Compartilhado", label: "Compartilhado" }
                                ]}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-10 rounded-xl text-xs">
                              <Save className="w-4 h-4 mr-1.5" /> Salvar
                            </Button>
                            {editId && (
                              <Button type="button" onClick={() => { setEditId(null); setIncomeForm({ title: "", amount: 0, owner: "Parceiro A" }); }} className="bg-zinc-900 text-zinc-300 border border-white/5 font-bold h-10 rounded-xl text-xs px-4">
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </form>
                      )}

                      {/* FORM DESPESAS */}
                      {activeTab === "expenses" && (
                        <form onSubmit={handleSaveExpense} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Categoria</label>
                              <CustomSelect
                                value={expenseForm.category}
                                onChange={val => setExpenseForm({ ...expenseForm, category: val })}
                                options={[
                                  { value: "Moradia & Contas", label: "Moradia & Contas" },
                                  { value: "Alimentação & Mercado", label: "Alimentação & Mercado" },
                                  { value: "Transporte & Mobilidade", label: "Transporte & Mobilidade" },
                                  { value: "Comunicação & Internet", label: "Comunicação & Internet" },
                                  { value: "Saúde & Cuidados", label: "Saúde & Cuidados" },
                                  { value: "Outros Essenciais", label: "Outros Essenciais" },
                                  { value: "Customizada", label: "Customizada" }
                                ]}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Título da Despesa</label>
                              <input
                                type="text"
                                placeholder="Ex: Conta de Luz"
                                value={expenseForm.title}
                                onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Valor Mensal (R$)</label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={expenseForm.amount || ""}
                                onChange={e => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Dia do Vencimento</label>
                              <input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="15"
                                value={expenseForm.dueDay || 15}
                                onChange={e => setExpenseForm({ ...expenseForm, dueDay: Math.max(1, Math.min(31, Number(e.target.value))) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-10 rounded-xl text-xs">
                              <Save className="w-4 h-4 mr-1.5" /> Salvar
                            </Button>
                            {editId && (
                              <Button type="button" onClick={() => { setEditId(null); setExpenseForm({ category: "Customizada", title: "", amount: 0, dueDay: 15 }); }} className="bg-zinc-900 text-zinc-300 border border-[#27272A] font-bold h-10 rounded-xl text-xs px-4">
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
                            <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">Instituição / Nome do Cartão</label>
                            <input
                              type="text"
                              placeholder="Ex: Nubank, Neon"
                              value={cardForm.name}
                              onChange={e => setCardForm({ ...cardForm, name: e.target.value })}
                              className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Limite Total (R$)</label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={cardForm.totalLimit || ""}
                                onChange={e => setCardForm({ ...cardForm, totalLimit: Number(e.target.value) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Fatura Atual (R$)</label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={cardForm.currentInvoice || ""}
                                onChange={e => setCardForm({ ...cardForm, currentInvoice: Number(e.target.value) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">Dia Fechamento (Corte)</label>
                              <input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="05"
                                value={cardForm.closingDay || 5}
                                onChange={e => setCardForm({ ...cardForm, closingDay: Math.max(1, Math.min(31, Number(e.target.value))) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">Dia Vencimento da Fatura</label>
                              <input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="15"
                                value={cardForm.dueDay || 15}
                                onChange={e => setCardForm({ ...cardForm, dueDay: Math.max(1, Math.min(31, Number(e.target.value))) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                          </div>

                          {/* Checkboxes de Fechamento e Futuras */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 bg-zinc-950/40 border border-white/5 px-3 py-2.5 rounded-xl cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!cardForm.isInvoiceClosed}
                                onChange={(e) => setCardForm({ ...cardForm, isInvoiceClosed: e.target.checked })}
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-yellow-555 focus:ring-0 focus:ring-offset-0 accent-yellow-500"
                              />
                              <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Fatura já fechou?</span>
                            </label>

                            <label className="flex items-center gap-2 bg-zinc-950/40 border border-white/5 px-3 py-2.5 rounded-xl cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!cardForm.hasFutureInvoices}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const count = checked ? 1 : 0;
                                  setCardForm({
                                    ...cardForm,
                                    hasFutureInvoices: checked,
                                    futureInvoicesCount: count,
                                    futureInvoices: checked 
                                      ? getFutureMonths(!!cardForm.isInvoiceClosed, cardForm.closingDay || 5, cardForm.dueDay || 15, count).map(m => ({ month: m.month, amount: 0, dueDay: cardForm.dueDay || 15 })) 
                                      : []
                                  });
                                }}
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-yellow-555 focus:ring-0 focus:ring-offset-0 accent-yellow-500"
                              />
                              <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">Faturas futuras?</span>
                            </label>
                          </div>

                          {/* Inputs Dinâmicos de Faturas Futuras */}
                          {cardForm.hasFutureInvoices && (
                            <div className="space-y-3 bg-zinc-950/60 p-3 rounded-xl border border-[#27272A] mt-1">
                              <div>
                                <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">
                                  Quantidade de faturas futuras (meses a parcelar):
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="12"
                                  value={cardForm.futureInvoicesCount || 1}
                                  onChange={(e) => {
                                    const count = Math.max(1, Math.min(12, Number(e.target.value)));
                                    const list = getFutureMonths(!!cardForm.isInvoiceClosed, cardForm.closingDay || 5, cardForm.dueDay || 15, count);
                                    const prevFuture = cardForm.futureInvoices || [];
                                    setCardForm({
                                      ...cardForm,
                                      futureInvoices: list.map((item, idx) => {
                                        const existing = prevFuture[idx];
                                        return {
                                          month: item.month,
                                          amount: existing ? existing.amount : 0,
                                          dueDay: existing ? existing.dueDay : (cardForm.dueDay || 15)
                                        };
                                      }),
                                      futureInvoicesCount: count
                                    });
                                  }}
                                  className="bg-zinc-950/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-2.5 w-full text-xs font-bold"
                                />
                              </div>

                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1" data-lenis-prevent="true">
                                {(cardForm.futureInvoices || []).map((fut: any, fIdx: number) => (
                                  <div key={fIdx} className="bg-zinc-900/30 p-2 rounded-lg border border-white/5 space-y-2">
                                    <span className="text-[9px] font-black text-yellow-400 uppercase tracking-wider">
                                      {getMonthLabelPT(fut.month)}
                                    </span>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">Valor (R$)</label>
                                        <input
                                          type="number"
                                          placeholder="0,00"
                                          value={fut.amount || ""}
                                          onChange={(e) => {
                                            const futureInvoicesCopy = [...(cardForm.futureInvoices || [])];
                                            futureInvoicesCopy[fIdx] = {
                                              ...futureInvoicesCopy[fIdx],
                                              amount: Number(e.target.value)
                                            };
                                            setCardForm({
                                              ...cardForm,
                                              futureInvoices: futureInvoicesCopy
                                            });
                                          }}
                                          className="bg-zinc-950/80 border border-[#27272A] rounded-lg text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-1.5 w-full text-xs font-semibold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">Dia do Vencimento</label>
                                        <input
                                          type="number"
                                          min="1"
                                          max="31"
                                          placeholder="15"
                                          value={fut.dueDay || cardForm.dueDay || 15}
                                          onChange={(e) => {
                                            const val = Math.max(1, Math.min(31, Number(e.target.value)));
                                            const futureInvoicesCopy = [...(cardForm.futureInvoices || [])];
                                            futureInvoicesCopy[fIdx] = {
                                              ...futureInvoicesCopy[fIdx],
                                              dueDay: val
                                            };
                                            setCardForm({
                                              ...cardForm,
                                              futureInvoices: futureInvoicesCopy
                                            });
                                          }}
                                          className="bg-zinc-950/80 border border-[#27272A] rounded-lg text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-1.5 w-full text-xs font-semibold"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Barra de Limite Visual do Cartão */}
                          {(() => {
                            const totalLimit = cardForm.totalLimit || 0;
                            const currentInvoice = cardForm.currentInvoice || 0;
                            const futureSum = (cardForm.futureInvoices || []).reduce((acc: number, f: any) => acc + Number(f.amount || 0), 0);
                            const totalAccumulatedInvoice = currentInvoice + futureSum;
                            const availableLimit = totalLimit - totalAccumulatedInvoice;
                            const isLimitExceeded = totalAccumulatedInvoice > totalLimit;
                            const limitPercentage = totalLimit > 0 ? Math.min(100, (totalAccumulatedInvoice / totalLimit) * 100) : 0;

                            return (
                              <div className="mt-2 space-y-2 bg-zinc-950/20 p-3 rounded-xl border border-[#27272A]">
                                <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold">
                                  <span className="uppercase tracking-wider">Fluxo de Limite de Crédito:</span>
                                  <span className={isLimitExceeded ? "text-rose-500 font-black animate-pulse" : "text-zinc-300 font-bold"}>
                                    {totalAccumulatedInvoice.toFixed(2)} / {totalLimit.toFixed(2)} R$
                                  </span>
                                </div>

                                {totalLimit > 0 && (
                                  <div className="space-y-1">
                                    <div className="w-full bg-zinc-950 border border-white/5 h-2.5 rounded-full overflow-hidden">
                                      <div 
                                        className={cn("h-full transition-all duration-300 rounded-full", isLimitExceeded ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse" : "bg-yellow-500")}
                                        style={{ width: `${limitPercentage}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-550">
                                      <span>Limite Disponível: <strong className={availableLimit >= 0 ? "text-emerald-400" : "text-rose-500"}>R$ {availableLimit.toFixed(2)}</strong></span>
                                      <span>{limitPercentage.toFixed(0)}% Utilizado</span>
                                    </div>
                                  </div>
                                )}

                                {isLimitExceeded && (
                                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 text-rose-400">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <div className="text-[10px] leading-relaxed font-bold">
                                      Atenção: A soma das faturas planejadas (R$ {totalAccumulatedInvoice.toFixed(2)}) ultrapassa o limite total do cartão! O limite disponível ficará negativo em R$ {Math.abs(availableLimit).toFixed(2)}.
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          <div className="flex gap-2 pt-2">
                            <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-10 rounded-xl text-xs">
                              <Save className="w-4 h-4 mr-1.5" /> Salvar
                            </Button>
                            {editId && (
                              <Button type="button" onClick={() => { setEditId(null); setCardForm({ name: "", totalLimit: 0, currentInvoice: 0, nextInvoice: 0, invoicesSchedule: [] }); }} className="bg-zinc-900 text-zinc-300 border border-[#27272A] font-bold h-10 rounded-xl text-xs px-4">
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
                            <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">Título da Dívida / Financiamento</label>
                            <input
                              type="text"
                              placeholder="Ex: Financiamento de Carro, Terreno"
                              value={debtForm.title}
                              onChange={e => setDebtForm({ ...debtForm, title: e.target.value })}
                              className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3 w-full text-xs"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">Qual o tipo dessa conta?</label>
                            <CustomSelect
                              value={debtForm.tipoDivida || "toxica"}
                              onChange={val => setDebtForm({ ...debtForm, tipoDivida: val })}
                              options={[
                                { value: "toxica", label: "Dívida de Cartão / Empréstimo (Curto Prazo)" },
                                { value: "estrutural", label: "Financiamento de Patrimônio / Consórcio (Longo Prazo)" }
                              ]}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Valor Total (Aquisição)</label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={debtForm.acquisitionValue || ""}
                                onChange={e => setDebtForm({ ...debtForm, acquisitionValue: Number(e.target.value) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Valor da Parcela Atual</label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={debtForm.currentInstallmentValue || ""}
                                onChange={e => setDebtForm({ ...debtForm, currentInstallmentValue: Number(e.target.value) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Dia Vencimento Mensal</label>
                              <input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="10"
                                value={debtForm.dueDay || 10}
                                onChange={e => setDebtForm({ ...debtForm, dueDay: Math.max(1, Math.min(31, Number(e.target.value))) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Próxima Parcela (DD/MM/AAAA)</label>
                              <input
                                type="date"
                                value={debtForm.nextDueDate || ""}
                                onChange={e => setDebtForm({ ...debtForm, nextDueDate: e.target.value })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:outline-none p-2.5 w-full text-xs [color-scheme:dark]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-500 block">Juros Atraso/Mês (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="0.0"
                                value={debtForm.monthlyLateInterestRate || ""}
                                onChange={e => setDebtForm({ ...debtForm, monthlyLateInterestRate: Number(e.target.value) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 p-2 w-full text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-500 block">Valor Multa (R$)</label>
                              <input
                                type="number"
                                placeholder="0.00"
                                value={debtForm.penaltyValue || ""}
                                onChange={e => setDebtForm({ ...debtForm, penaltyValue: Number(e.target.value) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 p-2 w-full text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-500 block">Pagas / Total</label>
                              <div className="flex gap-1 items-center">
                                <input
                                  type="number"
                                  placeholder="Pagas"
                                  value={debtForm.installmentsPaid || ""}
                                  onChange={e => setDebtForm({ ...debtForm, installmentsPaid: Number(e.target.value) })}
                                  className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 p-2 w-full text-center text-xs"
                                />
                                <span className="text-zinc-650 text-xs">/</span>
                                <input
                                  type="number"
                                  placeholder="Total"
                                  value={debtForm.totalInstallments || ""}
                                  onChange={e => setDebtForm({ ...debtForm, totalInstallments: Number(e.target.value) })}
                                  className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 p-2 w-full text-center text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Campos de Parcelas Vencidas em Atraso */}
                          <div className="bg-zinc-950/40 p-3 rounded-xl border border-[#27272A] space-y-2">
                            <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block flex items-center gap-1.5 text-rose-450">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              Atrasos no Pagamento (Terrenos / Carnês)
                            </span>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[8px] text-zinc-500 block">Nº Parcelas Vencidas</label>
                                <input
                                  type="number"
                                  placeholder="Ex: 5"
                                  value={debtForm.overdueInstallments || ""}
                                  onChange={e => setDebtForm({ ...debtForm, overdueInstallments: Number(e.target.value) })}
                                  className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 p-2 w-full text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] text-zinc-500 block">Total com Juros (R$)</label>
                                <input
                                  type="number"
                                  placeholder="Ex: 1300.00"
                                  value={debtForm.overdueValueAccumulated || ""}
                                  onChange={e => setDebtForm({ ...debtForm, overdueValueAccumulated: Number(e.target.value) })}
                                  className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 p-2 w-full text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Editor de Cronograma de Parcelas */}
                          <div className="bg-zinc-950/40 p-3 rounded-xl border border-[#27272A] space-y-2">
                            <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block">Cronograma de Parcelas Variáveis (Opcional)</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                              <div className="space-y-1">
                                <label className="text-[8px] text-zinc-500 block">Vencimento</label>
                                <input
                                  type="date"
                                  value={tempScheduleMonth}
                                  onChange={e => setTempScheduleMonth(e.target.value)}
                                  className="bg-zinc-950/80 border border-[#27272A] rounded-lg text-zinc-200 p-2 w-full text-xs [color-scheme:dark]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8px] text-zinc-500 block">Valor Parcela</label>
                                <input
                                  type="number"
                                  placeholder="0.00"
                                  value={tempScheduleAmount || ""}
                                  onChange={e => setTempScheduleAmount(Number(e.target.value))}
                                  className="bg-zinc-950/80 border border-[#27272A] rounded-lg text-zinc-200 p-2 w-full text-xs"
                                />
                              </div>
                              <Button type="button" onClick={addDebtScheduleItem} className="bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 font-bold h-9 rounded-lg text-[10px] w-full">
                                Adicionar
                              </Button>
                            </div>

                            {parseSchedule(debtForm.installmentsSchedule).length > 0 && (
                              <div className="space-y-1.5 max-h-[100px] overflow-y-auto mt-2 pr-1" data-lenis-prevent>
                                {parseSchedule(debtForm.installmentsSchedule).map((sch, i) => (
                                  <div key={i} className="flex justify-between items-center bg-zinc-900/40 px-2.5 py-1 rounded-lg border border-white/5">
                                    <span className="text-[10px] font-bold text-yellow-400">
                                      {sch.date ? new Date(sch.date + "T00:00:00").toLocaleDateString('pt-BR') : sch.month}
                                    </span>
                                    <span className="text-[10px] font-black text-zinc-300">R$ {sch.amount.toFixed(2)}</span>
                                    <button type="button" onClick={() => removeDebtScheduleItem(sch.date || sch.month)} className="text-zinc-500 hover:text-rose-450">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-10 rounded-xl text-xs">
                              <Save className="w-4 h-4 mr-1.5" /> Salvar
                            </Button>
                            {editId && (
                              <Button type="button" onClick={() => { setEditId(null); setDebtForm({ title: "", acquisitionValue: 0, totalInstallments: 12, currentInstallmentValue: 0, monthlyLateInterestRate: 0, penaltyValue: 0, installmentsPaid: 0, installmentsSchedule: [], overdueInstallments: 0, overdueValueAccumulated: 0, tipoDivida: "toxica" }); }} className="bg-zinc-900 text-zinc-300 border border-[#27272A] font-bold h-10 rounded-xl text-xs px-4">
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </form>
                      )}

                      {/* FORM METAS */}
                      {activeTab === "goals" && (
                        <form onSubmit={handleSaveGoal} className="space-y-4">
                          <div>
                            <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">Título da Meta / Sonho</label>
                            <input
                              type="text"
                              placeholder="Ex: Viagem para Europa ✈️"
                              value={goalForm.title}
                              onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                              className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 p-3 w-full text-xs focus:border-yellow-500/40 focus:outline-none transition-colors placeholder:text-zinc-600"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">Valor-Alvo (R$)</label>
                              <input
                                type="number"
                                placeholder="10.000,00"
                                min="1"
                                step="0.01"
                                value={goalForm.targetAmount || ""}
                                onChange={e => setGoalForm({ ...goalForm, targetAmount: Number(e.target.value) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 p-3 w-full text-xs focus:border-yellow-500/40 focus:outline-none transition-colors"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold block mb-1">Valor Atual (R$)</label>
                              <input
                                type="number"
                                placeholder="0,00"
                                min="0"
                                step="0.01"
                                value={goalForm.currentAmount || ""}
                                onChange={e => setGoalForm({ ...goalForm, currentAmount: Number(e.target.value) })}
                                className="bg-zinc-950/80 border border-[#27272A] rounded-xl text-zinc-200 p-3 w-full text-xs focus:border-yellow-500/40 focus:outline-none transition-colors"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-10 rounded-xl text-xs">
                              <Save className="w-4 h-4 mr-1.5" /> {editId ? "Atualizar Meta" : "Salvar Meta"}
                            </Button>
                            {editId && (
                              <Button type="button" onClick={() => { setEditId(null); setGoalForm({ title: "", targetAmount: 0, currentAmount: 0 }); }} className="bg-zinc-900 text-zinc-300 border border-[#27272A] font-bold h-10 rounded-xl text-xs px-4">
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </TiltCard>
              </div>

              {/* Listagem de Registros Ativos (lg:col-span-7) */}
              <div className="lg:col-span-7 w-full">
                <TiltCard glowColor="rgba(234, 179, 8, 0.15)" disableTilt={true} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                        <Info className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase">Parâmetros Ativos</h3>
                        <span className="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Visualização e Controle</span>
                      </div>
                    </div>
                  </div>

                  {/* Renderização Condicional de Detalhes dos Cartões */}
                  {activeTab === "cards" && creditCards.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 p-4 rounded-xl border border-white/5 text-center mb-4">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold block mb-1">Limite Global</span>
                        <strong className="text-sm sm:text-base text-white">R$ {totalLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold block mb-1">Faturas Abertas</span>
                        <strong className="text-sm sm:text-base text-rose-400">R$ {totalInvoices.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2" data-lenis-prevent>
                    {loading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
                      </div>
                    ) : (
                      <>
                        {/* LISTAGEM DE INCOMES */}
                        {activeTab === "incomes" && incomes.length === 0 && (
                          <p className="text-xs text-zinc-500 text-center py-10">Nenhuma receita cadastrada.</p>
                        )}
                        {activeTab === "incomes" && incomes.map((item, idx) => (
                          <div key={idx} className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex justify-between items-center transition-colors hover:border-yellow-500/20">
                            <div>
                              <h4 className="text-xs font-black text-zinc-200">{item.title}</h4>
                              <div className="flex gap-2 items-center mt-1">
                                <span className="text-[10px] text-emerald-400 font-bold">R$ {Number(item.amount).toFixed(2)}</span>
                                <span className="text-[9px] text-zinc-600 font-semibold uppercase tracking-wider">&bull; {item.owner}</span>
                                <span className="text-[9px] text-zinc-550 font-semibold uppercase tracking-wider">&bull; Dia {item.receiptDay || 5}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditIncome(item)} className="p-2 rounded-lg bg-zinc-900 border border-[#27272A] hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => confirmDelete(item.id, "income", item.title)} className="p-2 rounded-lg bg-zinc-900 border border-[#27272A] hover:border-rose-500/25 text-zinc-400 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* LISTAGEM DE DESPESAS */}
                        {activeTab === "expenses" && fixedExpenses.length === 0 && (
                          <p className="text-xs text-zinc-500 text-center py-10">Nenhuma despesa fixa cadastrada.</p>
                        )}
                        {activeTab === "expenses" && fixedExpenses.map((item, idx) => (
                          <div key={idx} className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex justify-between items-center transition-colors hover:border-yellow-500/20">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[8px] uppercase font-bold py-0">{item.category}</Badge>
                                <h4 className="text-xs font-black text-zinc-200">{item.title}</h4>
                              </div>
                              <div className="flex gap-2 items-center mt-1 flex-wrap">
                                <span className="text-[10px] text-zinc-300 font-bold">R$ {Number(item.amount).toFixed(2)}</span>
                                <span className="text-[9px] text-zinc-550 font-semibold uppercase tracking-wider">&bull; Vence Dia {item.dueDay || 15}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditExpense(item)} className="p-2 rounded-lg bg-zinc-900 border border-[#27272A] hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => confirmDelete(item.id, "expense", item.title)} className="p-2 rounded-lg bg-zinc-900 border border-[#27272A] hover:border-rose-500/25 text-zinc-400 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* LISTAGEM DE CARTÕES */}
                        {activeTab === "cards" && creditCards.length === 0 && (
                          <p className="text-xs text-zinc-500 text-center py-10">Nenhum cartão cadastrado.</p>
                        )}
                        {activeTab === "cards" && creditCards.map((item, idx) => {
                          const currentInv = Number(item.current_invoice || 0);
                          const limitTotal = Number(item.total_limit || 1);
                          const limitUsedPercent = Math.min(100, Math.round((currentInv / limitTotal) * 100));
                          const availableLimit = Math.max(0, limitTotal - currentInv);

                          return (
                            <div key={idx} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3 hover:border-yellow-500/20 transition-colors">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="text-xs font-black text-zinc-200">{item.name}</h4>
                                  <div className="flex gap-2 items-center mt-0.5">
                                    <span className="text-[9px] text-zinc-550 font-semibold">Limite: R$ {limitTotal.toFixed(2)}</span>
                                    <span className="text-[9px] text-yellow-500/80 font-mono font-semibold">
                                      &bull; Corte: Dia {item.closingDay || 5} | Venc: Dia {item.dueDay || 15}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditCard(item)} className="p-2 rounded-lg bg-zinc-900 border border-[#27272A] hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => confirmDelete(item.id, "card", item.name)} className="p-2 rounded-lg bg-zinc-900 border border-[#27272A] hover:border-rose-500/25 text-zinc-400 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Barra de Progresso do Limite */}
                              <div className="space-y-1.5 pt-1 border-t border-white/5">
                                <div className="flex justify-between items-center text-[9px]">
                                  <span className="text-zinc-400 font-bold uppercase">Uso ({limitUsedPercent}%)</span>
                                  <span className="text-emerald-400 font-bold">R$ {availableLimit.toFixed(2)} disponível</span>
                                </div>
                                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-[#27272A]">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      limitUsedPercent > 80 ? "bg-rose-500" : limitUsedPercent > 50 ? "bg-yellow-500" : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${limitUsedPercent}%` }}
                                  />
                                </div>
                              </div>

                              {parseSchedule(item.invoices_schedule).length > 0 && (
                                <div className="bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                                  <span className="text-[8px] text-zinc-500 uppercase block mb-1">Fechamentos Agendados:</span>
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
                          );
                        })}

                        {/* LISTAGEM DE DÍVIDAS */}
                        {activeTab === "debts" && debts.length === 0 && (
                          <p className="text-xs text-zinc-500 text-center py-10">Nenhuma dívida cadastrada.</p>
                        )}
                        {activeTab === "debts" && debts.map((item, idx) => (
                          <div key={idx} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3 hover:border-yellow-500/20 transition-colors">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="text-xs font-black text-zinc-200">{item.title}</h4>
                                <div className="flex gap-2 items-center mt-0.5">
                                  <span className="text-[9px] text-zinc-500 block font-semibold">Total: R$ {Number(item.acquisition_value).toFixed(2)} &bull; Parc: {item.installments_paid}/{item.total_installments}</span>
                                  <span className="text-[9px] text-amber-400/80 font-mono font-semibold">
                                    &bull; Venc: Dia {item.dueDay || 10}{item.nextDueDate ? ` (${item.nextDueDate})` : ''}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleEditDebt(item)} className="p-2 rounded-lg bg-zinc-900 border border-[#27272A] hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => confirmDelete(item.id, "debt", item.title)} className="p-2 rounded-lg bg-zinc-900 border border-[#27272A] hover:border-rose-500/25 text-zinc-400 hover:text-rose-500 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-white/5 pt-2">
                              <div>
                                <span className="text-zinc-550 block font-bold">PARCELA REGULAR</span>
                                <span className="font-black text-yellow-550">R$ {Number(item.current_installment_value).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-zinc-555 block font-bold font-bold">JUROS & MULTA</span>
                                <span className="font-bold text-rose-400">{Number(item.monthly_late_interest_rate).toFixed(1)}% ({Number(item.penalty_value).toFixed(0)} Multa)</span>
                              </div>
                            </div>
                            {item.overdue_installments > 0 && (
                              <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
                                <span className="text-[9px] text-rose-300 font-bold">
                                  {item.overdue_installments} parcelas vencidas em atraso totalizando R$ {Number(item.overdue_value_accumulated).toFixed(2)}
                                </span>
                              </div>
                            )}
                            {parseSchedule(item.installments_schedule).length > 0 && (
                              <div className="bg-zinc-900/30 p-2 rounded-lg border border-white/5">
                                <span className="text-[8px] text-zinc-500 uppercase block mb-1">Parcelas Variáveis Agendadas:</span>
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

                        {/* LISTAGEM DE METAS */}
                        {activeTab === "goals" && goals.length === 0 && (
                          <div className="text-center py-10 text-zinc-500 select-none">
                            <Target className="w-8 h-8 mx-auto mb-2 opacity-25" />
                            <p className="text-xs font-bold">Nenhuma meta ativa.</p>
                          </div>
                        )}
                        {activeTab === "goals" && goals.map((item, idx) => {
                          const pct = item.targetAmount > 0 ? Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100)) : 0;
                          const done = pct >= 100;
                          return (
                            <div key={item.id || idx} className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3 hover:border-yellow-500/20 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 pr-3">
                                  <div className="flex items-center gap-2">
                                    {done ? <CheckCircle2 className="w-4 h-4 text-emerald-450 flex-shrink-0" /> : <Target className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                                    <h4 className="text-xs font-black text-zinc-200">{item.title}</h4>
                                  </div>
                                  <div className="flex gap-2 items-center mt-1.5 text-[10px]">
                                    <span className="text-emerald-400 font-bold">R$ {item.currentAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                    <span className="text-zinc-650">/</span>
                                    <span className="text-zinc-400 font-bold">R$ {item.targetAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                    <span className={`font-black ml-auto ${done ? "text-emerald-400" : "text-yellow-400"}`}>{pct}%</span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => handleEditGoal(item)} className="p-1.5 rounded-lg bg-zinc-900 border border-[#27272A] hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => confirmDelete(item.id!, "goal", item.title)} className="p-1.5 rounded-lg bg-zinc-900 border border-[#27272A] hover:border-rose-500/25 text-zinc-400 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {/* Barra de progresso */}
                              <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-[#27272A]">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-400" : "bg-yellow-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {done && (
                                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest text-center animate-bounce mt-1">✨ Meta Conquistada!</p>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </TiltCard>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Footer / Assinatura Padrão */}
      <footer className="w-full mt-12 mb-6 text-zinc-550 select-none">
        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 text-[10px] font-bold uppercase tracking-wider mb-3">
          <Link href="/dashboard" className="hover:text-yellow-400 transition-colors">Dashboard</Link>
          <span>&bull;</span>
          <Link href="/transactions" className="hover:text-yellow-400 transition-colors">Transações</Link>
          <span>&bull;</span>
          <Link href="/profile" className="hover:text-yellow-400 transition-colors text-yellow-500">Perfil</Link>
          <span>&bull;</span>
          {!hasStrategy && (
            <>
              <Link href="/onboarding" className="hover:text-yellow-400 transition-colors">Onboarding</Link>
              <span>&bull;</span>
            </>
          )}
          <Link href="/chat" className="hover:text-yellow-400 transition-colors">Conselheira IA</Link>
          <span>&bull;</span>
          <Link href="/politica-de-privacidade" className="hover:text-yellow-400 transition-colors">Privacidade</Link>
        </div>

        <div className="text-[10px] text-zinc-500 pt-3 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-2 max-w-4xl mx-auto px-4">
          <span>&copy; {new Date().getFullYear()} Fintech Casal. Todos os direitos reservados.</span>
          <span className="flex items-center gap-1">Desenvolvido com <Heart className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" /> para casais de alto desempenho</span>
        </div>
      </footer>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-zinc-950 border border-white/10 shadow-2xl sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-2">
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
      
      {/* Modal de Confirmação Exclusão de Conta LGPD */}
      <Dialog open={deleteAccountConfirmOpen} onOpenChange={(open) => !open && setDeleteAccountConfirmOpen(false)}>
        <DialogContent className="bg-zinc-950 border border-white/10 shadow-2xl sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Confirmar Exclusão de Conta
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-2 leading-relaxed">
              Você está prestes a excluir **todos os dados financeiros e de perfil** do casal. Esta ação é definitiva, apagará permanentemente todos os lançamentos de vocês e não pode ser desfeita de forma alguma. Tem certeza que deseja prosseguir?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setDeleteAccountConfirmOpen(false)}
              className="flex-1 bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800 hover:text-white h-11 rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)] h-11 rounded-xl font-bold border-none"
            >
              {deletingAccount ? "Excluindo..." : "Sim, Excluir Tudo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
