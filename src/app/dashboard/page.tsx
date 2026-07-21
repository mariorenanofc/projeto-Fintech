"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Coins, TrendingUp, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
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

// Importações dos subcomponentes modulares
import { Header } from "@/components/dashboard/header";
import { SemaphoreCard } from "@/components/dashboard/semaphore-card";
import { RecommendationsCard } from "@/components/dashboard/recommendations-card";
import { FlowSummary } from "@/components/dashboard/flow-summary";
import { CalendarSection } from "@/components/dashboard/calendar-section";
import { ConfirmPaymentDialog } from "@/components/dashboard/confirm-payment-dialog";
import { CelebrationModal } from "@/components/dashboard/celebration-modal";
import { FinancialErrorBoundary } from "@/components/ui/financial-error-boundary";

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

  // Novos estados para a inteligência de pagamentos e economia
  const [economyTotal, setEconomyTotal] = useState(0);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [billToConfirm, setBillToConfirm] = useState<Bill | null>(null);
  const [actualAmountPaid, setActualAmountPaid] = useState<number>(0);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationStage, setCelebrationStage] = useState<"yellow" | "green">("yellow");

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
      
      // 1. Busca perfil do usuário
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "Usuário",
          avatar_url: user.user_metadata?.avatar_url || ""
        });
      }

      // 2. Busca dados brutos para construir as contas do calendário e previsões
      const rawRes = await getProfileFinancialData();
      const txRes = await getTransactions(monthStr);

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

      // 3. Busca a estratégia/diagnóstico para o mês selecionado
      const strat = await generateFinancialStrategy(monthStr);
      setStrategy(strat);

      // 4. Busca metas e sonhos do casal
      const goalsRes = await getGoals();
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
    cards.forEach((card, idx) => {
      let invVal = Number(card.current_invoice);
      let dueDay = card.dueDay || 15;
      const nameStr = card.name || "";
      const dueMatch = nameStr.match(/\[due:(\d+)\]/);

      if (dueMatch) {
        dueDay = parseInt(dueMatch[1]);
      }

      const cleanName = nameStr.replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");

      if (card.invoices_schedule && Array.isArray(card.invoices_schedule)) {
        const schedItem = card.invoices_schedule.find((s: any) => s.month === currentMonthStr || s.date?.startsWith(currentMonthStr));
        if (schedItem) {
          invVal = Number(schedItem.amount);
          if (schedItem.date) {
            const dayStr = schedItem.date.split("-")[2];
            if (dayStr) dueDay = parseInt(dayStr);
          }
        }
      }

      generatedBills.push({
        id: `card-${card.id || idx}`,
        title: `Fatura ${cleanName}`,
        amount: invVal,
        dueDate: `${currentYearMonth}${String(dueDay).padStart(2, '0')}`,
        status: "pending",
        category: "Cartão de Crédito"
      });
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

  // Sincronizar conta com o Google Calendar
  const handleSyncGoogleCalendar = async (bill: Bill) => {
    try {
      const res = await createCalendarEvent({
        title: bill.title,
        dueDate: bill.dueDate,
        amount: bill.amount
      });
      if (res.success) {
        toast.success(`Conta "${bill.title}" agendada no Google Agenda!`);
      } else {
        toast.warning(`Aviso: ${res.error}`, { description: "Faça login com Google para sincronizar." });
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
      const monthStr = date.toISOString().substring(0, 7);
      if (monthStr !== selectedMonthStr) {
        setSelectedMonthStr(monthStr);
      }
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

  // Reserva Livre real (o valor alocado para lazer/desejos do casal)
  const reservaLivreCasal = strategy?.hasStrategy
    ? (realDisposable > 0 
        ? Math.min(strategy.lazerTravaValue, realDisposable) 
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

  return (
    <div className="flex-1 w-full mx-auto bg-zinc-950 flex flex-col min-h-screen px-3 py-4 xs:px-4 xs:py-6 pb-24 sm:pb-10 max-w-full xs:max-w-[480px] sm:max-w-[768px] tablet:max-w-[834px] md:max-w-[1024px] lg:max-w-[1440px] laptop:max-w-[1600px] sm:px-6 md:px-8 lg:py-10">
      
      {/* Header do App */}
      <Header 
        userProfile={userProfile}
        selectedMonthStr={selectedMonthStr}
        hasStrategy={!!strategy?.hasStrategy}
        getReadableMonthLabel={getReadableMonthLabel}
        handleLogout={handleLogout}
      />

      {/* Banner de CTA para a Previsão Futura */}
      <div className="mb-6 w-full">
        <Link href="/dashboard/previsao" className="block w-full group">
          <div className="w-full bg-gradient-to-r from-yellow-500/10 via-amber-500/15 to-yellow-500/10 hover:from-yellow-500/20 hover:to-amber-500/25 border border-yellow-500/30 hover:border-yellow-400/60 rounded-2xl p-4 transition-all duration-300 shadow-[0_4px_20px_rgba(234,179,8,0.1)] hover:shadow-[0_0_25px_rgba(234,179,8,0.25)] flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shrink-0 shadow-[0_0_12px_rgba(234,179,8,0.3)]">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider">Previsão Futura do Casal</span>
                  <span className="bg-yellow-500/20 text-yellow-300 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-yellow-500/30">NOVO</span>
                </div>
                <p className="text-[10px] sm:text-xs text-zinc-300 font-semibold mt-0.5">
                  Projete a evolução de patrimônio, reserva e quitação de dívidas nos próximos 12 meses →
                </p>
              </div>
            </div>
            <div className="hidden xs:flex items-center gap-1 text-yellow-400 font-black text-xs group-hover:translate-x-1 transition-transform shrink-0">
              Ver Projeção
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Grid Geral de Responsividade */}
      <div className="flex-1 flex flex-col gap-6 tablet:grid tablet:grid-cols-12 tablet:gap-6 lg:gap-8 tablet:items-stretch h-full">
        
        {/* COLUNA ESQUERDA (tablet:col-span-5): Semáforo e Recomendações */}
        <div className="flex flex-col gap-6 tablet:col-span-5 h-full">
          {/* Card do Semáforo com Error Boundary */}
          <FinancialErrorBoundary fallbackTitle="Semáforo Indisponível" onReset={() => loadDashboardData(selectedMonthStr)}>
            <SemaphoreCard 
              loadingRealData={loadingRealData}
              financeStatus={financeStatus}
              realDisposable={realDisposable}
              reservaLivreCasal={reservaLivreCasal}
              tetoDiario={tetoDiario}
              strategy={strategy}
            />
          </FinancialErrorBoundary>
          
          {/* Botões de Ação */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Link href="/chat" className="w-full block">
              <Button 
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 font-black shadow-[0_4px_15px_rgba(234,179,8,0.2)] flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs border-none transition-all duration-300 hover:scale-[1.02]"
              >
                Conselheiro IA 🤖
              </Button>
            </Link>
            <Link href="/profile" className="w-full block">
              <Button 
                variant="outline" 
                className="w-full border-white/5 hover:bg-zinc-900/50 hover:border-zinc-800 text-zinc-300 font-bold h-11 rounded-xl text-xs transition-all duration-300 hover:scale-[1.02]"
              >
                Ajustar Finanças ⚙️
              </Button>
            </Link>
          </div>

          {/* Conselheiro de Choque / Recomendações */}
          <FinancialErrorBoundary fallbackTitle="Diagnóstico Indisponível">
            <RecommendationsCard strategy={strategy} />
          </FinancialErrorBoundary>
        </div>

        {/* COLUNA DIREITA (tablet:col-span-7): Resumo do Fluxo */}
        <div className="flex flex-col gap-6 tablet:col-span-7 h-full flex-grow">
          <FinancialErrorBoundary fallbackTitle="Fluxo Financeiro Indisponível" onReset={() => loadDashboardData(selectedMonthStr)}>
            <FlowSummary 
              loadingRealData={loadingRealData}
              strategy={strategy}
              realIncome={realIncome}
              realEssentials={realEssentials}
              realCommitments={realCommitments}
              realDisposable={realDisposable}
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
            />
          </FinancialErrorBoundary>
        </div>
      </div>

      {/* SEÇÃO DE CALENDÁRIO & CONTAS INTEGRADA */}
      <FinancialErrorBoundary fallbackTitle="Agenda e Vencimentos Indisponíveis" onReset={() => loadDashboardData(selectedMonthStr)}>
        <CalendarSection 
          selectedDate={selectedDate}
          handleDateSelect={handleDateSelect}
          selectedDateBills={selectedDateBills}
          hasBillOnDay={hasBillOnDay}
          mounted={mounted}
          handleSyncGoogleCalendar={handleSyncGoogleCalendar}
          openConfirmModal={openConfirmModal}
          handleUndoPayment={handleUndoPayment}
        />
      </FinancialErrorBoundary>

      {/* Footer / Barra de Navegação PWA Minimalista */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-t border-white/5 py-3 flex justify-around text-zinc-600 text-xs sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:z-auto sm:bg-transparent sm:backdrop-blur-none sm:border-t-0 sm:border-white/5 sm:py-0 sm:mt-10 sm:pt-5">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-yellow-500 font-bold transition-colors">
          <Coins className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Dashboard</span>
        </Link>
        <Link href="/transactions" className="flex flex-col items-center gap-1 hover:text-zinc-400 transition-colors">
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Transações</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 hover:text-zinc-400 transition-colors">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Perfil</span>
        </Link>
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
