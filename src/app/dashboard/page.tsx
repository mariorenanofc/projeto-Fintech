"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Activity, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Heart, 
  Printer, 
  Bot, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { 
  getProfileFinancialData, 
  generateFinancialStrategy, 
  FinancialStrategyResult,
  getGoals,
  GoalInput
} from "@/actions/onboarding";
import { createCalendarEvent } from "@/actions/calendar";
import { getTransactions, addTransaction, deleteTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { Bill } from "@/types";

import { Header } from "@/components/dashboard/header";
import { SemaphoreCard } from "@/components/dashboard/semaphore-card";
import { CreditCardLimitsCard } from "@/components/dashboard/credit-card-limits-card";
import { RecommendationsCard } from "@/components/dashboard/recommendations-card";
import { FlowSummary } from "@/components/dashboard/flow-summary";
import { CalendarSection } from "@/components/dashboard/calendar-section";
import { ConfirmPaymentDialog } from "@/components/dashboard/confirm-payment-dialog";
import { CelebrationModal } from "@/components/dashboard/celebration-modal";
import { FinancialErrorBoundary } from "@/components/ui/financial-error-boundary";
import { BankNegotiationModal } from "@/components/dashboard/bank-negotiation-modal";
import { PrintReportModal } from "@/components/dashboard/print-report-modal";

import { TiltCard } from "@/components/ui/tilt-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [loadingRealData, setLoadingRealData] = useState(true);

  // Estado do Semáforo Financeiro: 'green' | 'yellow' | 'red'
  const [financeStatus, setFinanceStatus] = useState<"green" | "yellow" | "red">("green");
  
  // Estado do Calendário (Dia selecionado)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Estado do Mês Selecionado (Ex: "2026-07")
  const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
    return new Date().toISOString().substring(0, 7);
  });

  // Contas reais obtidas do banco
  const [bills, setBills] = useState<Bill[]>([]);

  // Estado do perfil do usuário carregado do Supabase Auth
  const [userProfile, setUserProfile] = useState<{ full_name: string; avatar_url: string } | null>(null);

  // Diagnóstico matemático do motor de choque
  const [strategy, setStrategy] = useState<FinancialStrategyResult | null>(null);

  // Dados brutos carregados do banco (para previsões)
  const [rawCards, setRawCards] = useState<any[]>([]);
  const [rawDebts, setRawDebts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<GoalInput[]>([]);

  // Novos estados para a inteligência de pagamentos, simulação de renegociação e impressão
  const [economyTotal, setEconomyTotal] = useState(0);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [billToConfirm, setBillToConfirm] = useState<Bill | null>(null);
  const [actualAmountPaid, setActualAmountPaid] = useState<number>(0);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationStage, setCelebrationStage] = useState<"yellow" | "green">("yellow");

  // Estados dos novos modais
  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false);
  const [negotiationItem, setNegotiationItem] = useState<{ id: string; title: string; amount: number; type: "card" | "debt"; rawItem?: any } | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Garante a montagem inicial
  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date());
  }, []);

  // Monitora a mudança do mês selecionado para atualizar o Dashboard de forma reativa (Virada de Mês)
  useEffect(() => {
    if (mounted && selectedMonthStr) {
      loadDashboardData(selectedMonthStr);
    }
  }, [selectedMonthStr, mounted]);

  // Canal do Supabase Realtime para sincronização automática no Dashboard
  useEffect(() => {
    if (!mounted) return;
    
    const supabase = createClient();
    const channel = supabase
      .channel("realtime-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          loadDashboardData(selectedMonthStr);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMonthStr, mounted]);


  const loadDashboardData = async (monthStr: string) => {
    try {
      setLoadingRealData(true);
      
      // Busca perfil do usuário, dados financeiros, transações, estratégia e metas em paralelo
      const supabase = createClient();
      const [
        userRes,
        rawRes,
        txRes,
        strat,
        goalsRes
      ] = await Promise.all([
        supabase.auth.getUser(),
        getProfileFinancialData(),
        getTransactions(monthStr),
        generateFinancialStrategy(monthStr),
        getGoals()
      ]);

      if (userRes.data?.user) {
        const user = userRes.data.user;
        setUserProfile({
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "Usuário",
          avatar_url: user.user_metadata?.avatar_url || ""
        });
      }

      if (rawRes.success) {
        setRawCards(rawRes.creditCards);
        setRawDebts(rawRes.debts);
        const realBills = buildRealBills(rawRes.fixedExpenses, rawRes.debts, rawRes.creditCards, monthStr, txRes.data || []);
        setBills(realBills);
        if (txRes.success) {
          setTransactions(txRes.data || []);
        }

        // Calcula economia total do mês
        let econ = 0;
        realBills.forEach(b => {
          if (b.status === "paid" && b.paidAmount !== undefined) {
            econ += (b.amount - b.paidAmount);
          }
        });
        setEconomyTotal(econ);
      }

      setStrategy(strat);

      if (goalsRes.success && goalsRes.data) {
        setGoals(goalsRes.data);
      }

      // Define status de finanças com base no motor de transição de estágios
      if (strat.hasStrategy) {
        setFinanceStatus(strat.financialStage);
        
        // Gamificação / Detecção de Subida de Fase
        if (mounted) {
          const prevStage = localStorage.getItem("casal_financial_stage");
          if (prevStage && prevStage !== strat.financialStage) {
            const stagesOrder = { red: 1, yellow: 2, green: 3 };
            const currentRank = stagesOrder[strat.financialStage];
            const prevRank = stagesOrder[prevStage as "red" | "yellow" | "green"] || 1;
            
            if (currentRank > prevRank) {
              setCelebrationStage(strat.financialStage as "yellow" | "green");
              setCelebrationOpen(true);
            }
          }
          localStorage.setItem("casal_financial_stage", strat.financialStage);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do Dashboard:", error);
    } finally {
      setLoadingRealData(false);
    }
  };

  // Helper para construir faturas e parcelas em cima dos dias do mês
  const buildRealBills = (expenses: any[], debts: any[], cards: any[], currentMonthStr: string, transactions: any[]) => {
    const generatedBills: Bill[] = [];
    const currentYearMonth = `${currentMonthStr}-`;

    // 1. Mapeia Despesas Fixas para dias padrão do calendário
    expenses.forEach((exp, idx) => {
      let dueDay = 15;
      const titleStr = exp.title || "";
      const match = titleStr.match(/\[due:(\d+)\]/);
      
      if (match) {
        dueDay = parseInt(match[1]);
      } else {
        const cat = exp.category;
        if (cat === "Água") dueDay = 10;
        else if (cat === "Luz") dueDay = 12;
        else if (cat === "Internet") dueDay = 15;
        else if (cat === "Telefonia") dueDay = 18;
        else if (cat === "Feira/Mercado") dueDay = 5;
        else if (cat === "Combustível") dueDay = 8;
        else dueDay = 25;
      }

      const cleanTitle = titleStr.replace(/\s*\[due:\d+\]/, "");

      generatedBills.push({
        id: `exp-${exp.id || idx}`,
        title: cleanTitle,
        amount: Number(exp.amount),
        dueDate: `${currentYearMonth}${String(dueDay).padStart(2, '0')}`,
        status: "pending",
        category: exp.category
      });
    });

    // 2. Mapeia parcelas de Dívidas / Empréstimos com o dia real de vencimento
    debts.forEach((debt, idx) => {
      let instVal = Number(debt.current_installment_value);
      let dueDay = debt.dueDay || 10;
      const titleStr = debt.title || "";
      const dueMatch = titleStr.match(/\[due:(\d+)\]/);
      const nextMatch = titleStr.match(/\[next:([^\]]+)\]/);

      if (dueMatch) {
        dueDay = parseInt(dueMatch[1]);
      }
      if (nextMatch && nextMatch[1]?.startsWith(currentMonthStr)) {
        const parts = nextMatch[1].split("-");
        if (parts[2]) dueDay = parseInt(parts[2]);
      }

      const cleanTitle = titleStr.replace(/\s*\[due:\d+\]/, "").replace(/\s*\[next:[^\]]+\]/, "");

      if (debt.installments_schedule && Array.isArray(debt.installments_schedule)) {
        const schedItem = debt.installments_schedule.find((s: any) => s.month === currentMonthStr || s.date?.startsWith(currentMonthStr));
        if (schedItem) {
          instVal = Number(schedItem.amount);
          if (schedItem.date) {
            const dayStr = schedItem.date.split("-")[2];
            if (dayStr) dueDay = parseInt(dayStr);
          }
        }
      }

      generatedBills.push({
        id: `debt-${debt.id || idx}`,
        title: cleanTitle,
        amount: instVal,
        dueDate: `${currentYearMonth}${String(dueDay).padStart(2, '0')}`,
        status: "pending",
        category: "Financiamentos/Dívidas"
      });
    });

    // 3. Mapeia Faturas do Cartão com o dia real de vencimento
    const isCurrentMonth = currentMonthStr === new Date().toISOString().substring(0, 7);

    cards.forEach((card, idx) => {
      let invVal = isCurrentMonth ? Number(card.current_invoice) : Number(card.next_invoice || card.current_invoice || 0);
      let dueDay = card.dueDay || card.due_day || 15;
      const nameStr = card.name || "";
      const dueMatch = nameStr.match(/\[due:(\d+)\]/);

      if (dueMatch) {
        dueDay = parseInt(dueMatch[1]);
      }

      const cleanName = nameStr.replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");

      if (card.invoices_schedule && Array.isArray(card.invoices_schedule) && card.invoices_schedule.length > 0) {
        const schedItem = card.invoices_schedule.find((s: any) => s.month === currentMonthStr || s.date?.startsWith(currentMonthStr));
        if (schedItem) {
          invVal = Number(schedItem.amount);
          if (schedItem.date) {
            const dayStr = schedItem.date.split("-")[2];
            if (dayStr) dueDay = parseInt(dayStr);
          }
        }
      }

      if (invVal > 0) {
        generatedBills.push({
          id: `card-${card.id || idx}`,
          title: `Fatura ${cleanName}`,
          amount: invVal,
          dueDate: `${currentYearMonth}${String(dueDay).padStart(2, '0')}`,
          status: "pending",
          category: "Cartão de Crédito"
        });
      }
    });

    // Cruza com transações pagas
    return generatedBills.map(bill => {
      const tx = transactions.find(t => {
        const desc = t.description.replace(/^\[Individual\]\s*/, "");
        return desc === bill.title && t.category === bill.category;
      });
      if (tx) {
        bill.status = "paid";
        bill.transactionId = tx.id;
        bill.paidAmount = Number(tx.amount);
        bill.paidBy = tx.profiles?.full_name ? tx.profiles.full_name.split(" ")[0] : undefined;
        bill.isIndividual = tx.description.startsWith("[Individual]");
      }
      return bill;
    });
  };

  // Formatação de data local robusta
  const formatLocalDate = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filtrar contas com base na data selecionada no calendário
  const getBillsForDate = (date: Date | undefined) => {
    if (!date) return [];
    const formattedSelected = formatLocalDate(date);
    return bills.filter(bill => bill.dueDate === formattedSelected);
  };

  const selectedDateBills = getBillsForDate(selectedDate);

  // Abrir Modal de Pagamento
  const openConfirmModal = (bill: Bill) => {
    setBillToConfirm(bill);
    setActualAmountPaid(bill.amount);
    setConfirmModalOpen(true);
  };

  // Confirmar pagamento real no BD
  const handleConfirmPayment = async () => {
    if (!billToConfirm) return;
    setLoadingRealData(true);
    setConfirmModalOpen(false);
    
    const res = await addTransaction({
      type: "expense",
      amount: actualAmountPaid,
      description: billToConfirm.title,
      category: billToConfirm.category,
      date: billToConfirm.dueDate
    });

    if (res.success) {
      toast.success("Pagamento confirmado e registrado!");
      await loadDashboardData(selectedMonthStr);
    } else {
      toast.error("Erro ao registrar pagamento: " + res.error);
      setLoadingRealData(false);
    }
  };

  // Desfazer Pagamento
  const handleUndoPayment = async (transactionId: string) => {
    setLoadingRealData(true);
    const res = await deleteTransaction(transactionId);
    if (res.success) {
      toast.info("Pagamento desfeito com sucesso.");
      await loadDashboardData(selectedMonthStr);
    } else {
      toast.error("Erro ao desfazer pagamento: " + res.error);
      setLoadingRealData(false);
    }
  };

  // Sincronizar conta com o Google Calendar com reconexão resiliente
  const handleSyncGoogleCalendar = async (bill: Bill) => {
    try {
      const res = await createCalendarEvent({
        title: bill.title,
        dueDate: bill.dueDate,
        amount: bill.amount
      });
      if (res.success) {
        toast.success(`Conta "${bill.title}" agendada no Google Agenda!`);
      } else if (res.code === "TOKEN_EXPIRED" || res.code === "NO_GOOGLE_AUTH") {
        toast.warning(res.error, {
          action: {
            label: "Reconectar Google",
            onClick: async () => {
              const supabase = createClient();
              await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                  scopes: "https://www.googleapis.com/auth/calendar.events"
                }
              });
            }
          }
        });
      } else {
        toast.warning(`Aviso: ${res.error}`);
      }
    } catch (err: any) {
      toast.error("Erro ao conectar com a API do Google: " + err.message);
    }
  };

  // Função de Sair (Logout)
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Trata a seleção de data no calendário, mudando dinamicamente o mês ativo do Dashboard
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthStr = `${year}-${month}`;
      if (monthStr !== selectedMonthStr) {
        setSelectedMonthStr(monthStr);
        loadDashboardData(monthStr);
      }
    }
  };

  // Trata a navegação de mês nas setas do calendário (Setembro, Outubro, Novembro, etc.)
  const handleCalendarMonthChange = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = String(monthDate.getMonth() + 1).padStart(2, '0');
    const newMonthStr = `${year}-${month}`;
    if (newMonthStr !== selectedMonthStr) {
      setSelectedMonthStr(newMonthStr);
      loadDashboardData(newMonthStr);
    }
  };

  // Helper para verificar se um dia possui contas
  const hasBillOnDay = (date: Date) => {
    const formatted = formatLocalDate(date);
    return bills.some(bill => bill.dueDate === formatted);
  };

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

  // Valores de Exibição das Métricas Principais (Utiliza Previsão do Onboarding/Estratégia se ainda não houver lançamentos reais no mês)
  const displayIncome = realIncome > 0 ? realIncome : prevIncome;
  const displayExpenses = (realEssentials + realCommitments) > 0 ? (realEssentials + realCommitments) : (prevEssentials + prevCommitments);
  const displayDisposable = (realIncome > 0 || realEssentials > 0 || realCommitments > 0) 
    ? realDisposable 
    : (strategy?.remainingCashResidue !== undefined ? strategy.remainingCashResidue : prevDisposable);

  // Reserva Livre real (o valor alocado para lazer/desejos do casal)
  const reservaLivreCasal = strategy?.hasStrategy
    ? (displayDisposable > 0 
        ? Math.min(strategy.lazerTravaValue, displayDisposable) 
        : 0)
    : 0;

  const tetoDiario = strategy?.hasStrategy && reservaLivreCasal > 0
    ? Math.round((reservaLivreCasal / 30) * 100) / 100
    : 0;

  // Formata o mês selecionado em formato legível PT-BR (ex: "Agosto de 2026")
  const getReadableMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-").map(Number);
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${months[month - 1]} de ${year}`;
  };

  const totalCardLimitFree = rawCards.reduce((acc: number, c: any) => {
    const limit = Number(c.total_limit || c.totalLimit || 0);
    const invoice = Number(c.current_invoice || c.currentInvoice || 0);
    return acc + Math.max(0, limit - invoice);
  }, 0);

  if (!mounted || loadingRealData) {
    return (
      <div className="flex-1 w-full bg-zinc-950 flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-yellow-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)] animate-pulse">
            <Coins className="w-6 h-6 text-yellow-500 animate-spin [animation-duration:3s]" />
          </div>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest animate-pulse">
            Sincronizando Diagnóstico...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full mx-auto bg-transparent flex flex-col min-h-screen px-3 py-4 xs:px-4 xs:py-6 pb-6 sm:pb-6 max-w-full xs:max-w-[480px] sm:max-w-[768px] tablet:max-w-[834px] md:max-w-[1024px] lg:max-w-[1440px] laptop:max-w-[1600px] sm:px-6 md:px-8 lg:py-8 space-y-6">
      
      {/* Header do App */}
      <Header 
        userProfile={userProfile}
        selectedMonthStr={selectedMonthStr}
        hasStrategy={!!strategy?.hasStrategy}
        getReadableMonthLabel={getReadableMonthLabel}
        handleLogout={handleLogout}
      />

      {/* Hero Section Micro1 Style (Igual ao test/dashboard) */}
      <section className="relative text-center py-4 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold mb-1 backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.15)] animate-pulse">
          <Sparkles className="w-4 h-4 text-yellow-400" /> ENGINE FLUIDITY 2.0 &amp; SUPABASE REALTIME ⚡
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Diagnóstico Inteligente &amp; <br />
          <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent filter drop-shadow-[0_0_25px_rgba(234,179,8,0.3)]">
            Fluxo de Caixa Conjugal
          </span>
        </h1>
      </section>

      {/* 4 Cards de Métricas Chave com Contadores Animados Reais (Count-Up) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        <TiltCard glowColor="rgba(16, 185, 129, 0.2)">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">Receita Prevista</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            <AnimatedCounter value={displayIncome} prefix="R$ " decimals={2} />
          </div>
          <span className="text-[10px] text-zinc-400 mt-2 block">100% liquidadas no mês</span>
        </TiltCard>

        <TiltCard glowColor="rgba(244, 63, 94, 0.2)">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-rose-400 uppercase tracking-wider">Saídas Previstas</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            <AnimatedCounter value={displayExpenses} prefix="R$ " decimals={2} />
          </div>
          <span className="text-[10px] text-zinc-400 mt-2 block">Essenciais + Dívidas + Cartões</span>
        </TiltCard>

        <TiltCard glowColor="rgba(234, 179, 8, 0.2)">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-yellow-400 uppercase tracking-wider">Sobra Líquida</span>
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${displayDisposable >= 0 ? "text-yellow-400" : "text-rose-400"} tracking-tight`}>
            <AnimatedCounter value={displayDisposable} prefix="R$ " decimals={2} />
          </div>
          <span className="text-[10px] text-yellow-500/80 font-bold mt-2 block">
            {displayDisposable >= 0 ? "✨ Fluxo positivo mantido" : "⚠️ Ajuste de rota recomendado"}
          </span>
        </TiltCard>

        <TiltCard glowColor="rgba(6, 182, 212, 0.2)">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider">Limite Total Livre</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            <AnimatedCounter value={totalCardLimitFree} prefix="R$ " decimals={2} />
          </div>
          <span className="text-[10px] text-zinc-400 mt-2 block">Disponível em {rawCards.length} cartões</span>
        </TiltCard>
      </section>

      {/* Grid Principal de 2 Colunas (Equilibradas em Altura) */}
      <div className="flex-1 flex flex-col gap-6 tablet:grid tablet:grid-cols-12 tablet:gap-6 lg:gap-8 tablet:items-stretch h-full">
        
        {/* COLUNA ESQUERDA (tablet:col-span-5): Semáforo e Limites de Crédito Reais */}
        <div className="flex flex-col gap-6 tablet:col-span-5 h-full justify-between space-y-2">
          {/* 1. Card do Semáforo */}
          <FinancialErrorBoundary fallbackTitle="Semáforo Indisponível" onReset={() => loadDashboardData(selectedMonthStr)}>
            <SemaphoreCard 
              loadingRealData={loadingRealData}
              financeStatus={financeStatus}
              realDisposable={displayDisposable}
              reservaLivreCasal={reservaLivreCasal}
              tetoDiario={tetoDiario}
              strategy={strategy}
              onOpenPrintModal={() => setPrintModalOpen(true)}
            />
          </FinancialErrorBoundary>

          {/* 2. Nossos Limites de Crédito Reais 💳 */}
          <FinancialErrorBoundary fallbackTitle="Limites de Crédito Indisponíveis">
            <CreditCardLimitsCard 
              rawCards={rawCards}
              financeStatus={financeStatus}
            />
          </FinancialErrorBoundary>
        </div>

        {/* COLUNA DIREITA (tablet:col-span-7): Painel Estratégico (Nosso Fluxo & Sonhos ✨) */}
        <div className="flex flex-col gap-6 tablet:col-span-7 h-full flex-grow">
          <FinancialErrorBoundary fallbackTitle="Fluxo Financeiro Indisponível" onReset={() => loadDashboardData(selectedMonthStr)}>
            <FlowSummary 
              loadingRealData={loadingRealData}
              strategy={strategy}
              realIncome={displayIncome}
              realEssentials={realEssentials}
              realCommitments={realCommitments}
              realDisposable={displayDisposable}
              prevIncome={prevIncome}
              prevEssentials={prevEssentials}
              prevCommitments={prevCommitments}
              prevDisposable={prevDisposable}
              financeStatus={financeStatus}
              rawCards={rawCards}
              rawDebts={rawDebts}
              selectedMonthStr={selectedMonthStr}
              getReadableMonthLabel={getReadableMonthLabel}
              goals={goals}
              onOpenNegotiationModal={(item) => {
                setNegotiationItem(item);
                setNegotiationModalOpen(true);
              }}
            />
          </FinancialErrorBoundary>
        </div>
      </div>

      {/* SEÇÃO LARGURA TOTAL 100% 1: Engenharia Financeira & IA 💡 (Plano de Resgate Priorizado) */}
      <div className="w-full pt-2">
        <FinancialErrorBoundary fallbackTitle="Diagnóstico Indisponível">
          <RecommendationsCard 
            strategy={strategy} 
            rawCards={rawCards}
            rawDebts={rawDebts}
            onOpenNegotiationModal={(item) => {
              setNegotiationItem(item);
              setNegotiationModalOpen(true);
            }}
          />
        </FinancialErrorBoundary>
      </div>

      {/* SEÇÃO LARGURA TOTAL 100% 2: Nosso Calendário de Vencimentos 📅 */}
      <div className="w-full pt-2">
        <FinancialErrorBoundary fallbackTitle="Agenda e Vencimentos Indisponíveis" onReset={() => loadDashboardData(selectedMonthStr)}>
          <CalendarSection 
            selectedDate={selectedDate}
            handleDateSelect={handleDateSelect}
            selectedDateBills={selectedDateBills}
            allBills={bills}
            hasBillOnDay={hasBillOnDay}
            mounted={mounted}
            handleSyncGoogleCalendar={handleSyncGoogleCalendar}
            openConfirmModal={openConfirmModal}
            handleUndoPayment={handleUndoPayment}
            onMonthChange={handleCalendarMonthChange}
          />
        </FinancialErrorBoundary>
      </div>

      {/* MODAL DE SIMULAÇÃO DE RENEGOCIAÇÃO BANCÁRIA */}
      <BankNegotiationModal 
        isOpen={negotiationModalOpen}
        onClose={() => setNegotiationModalOpen(false)}
        itemToNegotiate={negotiationItem}
        currentResidue={displayDisposable}
        onSuccess={() => loadDashboardData(selectedMonthStr)}
      />

      {/* MODAL DE IMPRESSÃO DE RELATÓRIO MENSAL E ANUAL (Plano da Geladeira) */}
      <PrintReportModal 
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        strategy={strategy}
        bills={bills}
        rawCards={rawCards}
        rawDebts={rawDebts}
        goals={goals}
        selectedMonthStr={selectedMonthStr}
        getReadableMonthLabel={getReadableMonthLabel}
      />

      {/* Footer Padrão Micro1 (Igual ao test/dashboard) */}
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
          {!strategy?.hasStrategy && (
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

      {/* Modal de Confirmação de Pagamento */}
      <ConfirmPaymentDialog 
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        bill={billToConfirm}
        actualAmountPaid={actualAmountPaid}
        setActualAmountPaid={setActualAmountPaid}
        onConfirm={handleConfirmPayment}
      />

      {/* Modal de Conquista / Subida de Estágio Financeiro */}
      <CelebrationModal 
        isOpen={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        stage={celebrationStage}
      />
    </div>
  );
}
