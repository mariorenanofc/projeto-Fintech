"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Coins, 
  Sparkles,
  Check,
  Info,
  DollarSign,
  TrendingDown,
  ArrowRight,
  RefreshCcw,
  LogOut,
  MoreHorizontal,
  CalendarPlus,
  Undo2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { createClient } from "@/lib/supabase/client";
import { 
  getProfileFinancialData, 
  generateFinancialStrategy, 
  FinancialStrategyResult 
} from "@/actions/onboarding";
import { createCalendarEvent } from "@/actions/calendar";
import { ptBR } from "date-fns/locale";
import { getTransactions, addTransaction, deleteTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Tipagem para as contas
interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // Formato: AAAA-MM-DD
  status: "paid" | "pending";
  category: string;
  transactionId?: string;
  paidAmount?: number;
}

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

  // Novos estados para a inteligência de pagamentos e economia
  const [economyTotal, setEconomyTotal] = useState(0);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [billToConfirm, setBillToConfirm] = useState<Bill | null>(null);
  const [actualAmountPaid, setActualAmountPaid] = useState<number>(0);

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

      // Define status de finanças com base no motor de choque
      if (strat.hasStrategy) {
        if (strat.isChoqueRequired) {
          setFinanceStatus("red");
        } else if (strat.remainingCashResidue < 300) {
          setFinanceStatus("yellow");
        } else {
          setFinanceStatus("green");
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do Dashboard:", error);
    } finally {
      setLoadingRealData(false);
    }
  };

  // Helper para obter o próximo mês string (Ex: "2026-08" -> "2026-09")
  const getNextMonthStr = (monthStr: string): string => {
    const [year, month] = monthStr.split("-").map(Number);
    if (month === 12) {
      return `${year + 1}-01`;
    }
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  };

  // Helper para construir faturas e parcelas em cima dos dias do mês
  const buildRealBills = (expenses: any[], debts: any[], cards: any[], currentMonthStr: string, transactions: any[]) => {
    const generatedBills: Bill[] = [];
    const currentYearMonth = `${currentMonthStr}-`;

    // 1. Mapeia Despesas Fixas para dias padrão do calendário
    expenses.forEach((exp, idx) => {
      let dueDay = 15;
      const cat = exp.category;
      if (cat === "Água") dueDay = 10;
      else if (cat === "Luz") dueDay = 12;
      else if (cat === "Internet") dueDay = 15;
      else if (cat === "Telefonia") dueDay = 18;
      else if (cat === "Feira/Mercado") dueDay = 5;
      else if (cat === "Combustível") dueDay = 8;
      else dueDay = 25;

      generatedBills.push({
        id: `exp-${exp.id || idx}`,
        title: exp.title,
        amount: Number(exp.amount),
        dueDate: `${currentYearMonth}${String(dueDay).padStart(2, '0')}`,
        status: "pending",
        category: cat
      });
    });

    // 2. Mapeia parcelas de Dívidas / Empréstimos
    debts.forEach((debt, idx) => {
      let instVal = Number(debt.current_installment_value);
      if (debt.installments_schedule && Array.isArray(debt.installments_schedule)) {
        const schedItem = debt.installments_schedule.find((s: any) => s.month === currentMonthStr);
        if (schedItem) instVal = Number(schedItem.amount);
      }

      generatedBills.push({
        id: `debt-${debt.id || idx}`,
        title: debt.title,
        amount: instVal,
        dueDate: `${currentYearMonth}22`,
        status: "pending",
        category: "Financiamentos/Dívidas"
      });
    });

    // 3. Mapeia Faturas do Cartão
    cards.forEach((card, idx) => {
      let invVal = Number(card.current_invoice);
      if (card.invoices_schedule && Array.isArray(card.invoices_schedule)) {
        const schedItem = card.invoices_schedule.find((s: any) => s.month === currentMonthStr);
        if (schedItem) invVal = Number(schedItem.amount);
      }

      generatedBills.push({
        id: `card-${card.id || idx}`,
        title: `Fatura ${card.name}`,
        amount: invVal,
        dueDate: `${currentYearMonth}20`,
        status: "pending",
        category: "Cartão de Crédito"
      });
    });

    // Cruza com transações pagas
    return generatedBills.map(bill => {
      const tx = transactions.find(t => t.description === bill.title && t.category === bill.category);
      if (tx) {
        bill.status = "paid";
        bill.transactionId = tx.id;
        bill.paidAmount = Number(tx.amount);
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

  // Calcula a previsão de fluxo de caixa para o mês seguinte
  const getNextMonthForecast = () => {
    if (!strategy) return { nextCommitments: 0, nextResidue: 0, difference: 0 };
    
    const nextMonthStr = getNextMonthStr(selectedMonthStr);
    const nextEssentials = strategy.totalEssentialExpenses;
    
    const nextCards = rawCards.reduce((sum, card) => {
      let val = Number(card.next_invoice || 0);
      if (card.invoices_schedule && Array.isArray(card.invoices_schedule)) {
        const item = card.invoices_schedule.find((s: any) => s.month === nextMonthStr);
        if (item) val = Number(item.amount);
      }
      return sum + val;
    }, 0);
    
    const nextDebts = rawDebts.reduce((sum, debt) => {
      let val = Number(debt.current_installment_value || 0);
      if (debt.installments_schedule && Array.isArray(debt.installments_schedule)) {
        const item = debt.installments_schedule.find((s: any) => s.month === nextMonthStr);
        if (item) val = Number(item.amount);
      }
      return sum + val;
    }, 0);
    
    const nextCommitments = nextEssentials + nextCards + nextDebts;
    const nextResidue = strategy.totalIncome - nextCommitments;
    const currentCommitments = strategy.totalEssentialExpenses + strategy.totalDebtInstallments + strategy.totalCreditCardInvoices;
    const difference = currentCommitments - nextCommitments;
    
    return {
      nextCommitments,
      nextResidue,
      difference
    };
  };

  // Helper para verificar se um dia possui contas
  const hasBillOnDay = (date: Date) => {
    const formatted = formatLocalDate(date);
    return bills.some(bill => bill.dueDate === formatted);
  };

  // O bloco de loading foi removido para permitir o SSR do Dashboard (melhora drástica no LCP)

  // Valores consolidados reais
  const totalCommitment = strategy?.hasStrategy
    ? strategy.totalEssentialExpenses + strategy.totalDebtInstallments + strategy.totalCreditCardInvoices
    : 0;

  const tetoDiario = strategy?.hasStrategy && strategy.remainingCashResidue > 0
    ? Math.round((strategy.remainingCashResidue / 30) * 100) / 100
    : 0;

  const forecast = getNextMonthForecast();

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
    <div className="flex-1 w-full mx-auto bg-zinc-950 flex flex-col min-h-screen px-3 py-4 xs:px-4 xs:py-6 max-w-full xs:max-w-[480px] sm:max-w-[768px] tablet:max-w-[834px] md:max-w-[1024px] lg:max-w-[1440px] laptop:max-w-[1600px] sm:px-6 md:px-8 lg:py-10">
      
      {/* Header do App */}
      <header className="flex flex-col gap-4 xs:flex-row xs:justify-between xs:items-center mb-6 xs:mb-8 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3 w-full xs:w-auto">
          <div className="w-11 h-11 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-[0_0_25px_rgba(234,179,8,0.4)] relative overflow-hidden transition-all duration-500 hover:scale-105">
            <Coins className="w-6 h-6 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
              {userProfile?.full_name ? `Olá, ${userProfile.full_name.split(" ")[0]} 👋` : "Fintech Casal"}
            </h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Nosso Painel de Sintonia</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap xs:flex-nowrap w-full xs:w-auto justify-between xs:justify-end">
          <Badge variant="outline" className="border-yellow-500/25 text-yellow-400 bg-yellow-950/15 px-3 py-1 text-xs font-bold shadow-[0_0_15px_rgba(234,179,8,0.05)]">
            {getReadableMonthLabel(selectedMonthStr)}
          </Badge>
          {!loadingRealData && !strategy?.hasStrategy && (
            <Link href="/onboarding">
              <Badge className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-3 py-1 text-xs font-black border-none cursor-pointer flex items-center gap-1.5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] rounded-xl">
                <Sparkles className="w-3.5 h-3.5 text-zinc-950 fill-zinc-950" />
                Planejar Nosso Futuro
              </Badge>
            </Link>
          )}
          <div className="flex items-center gap-3 border-l border-white/10 pl-3">
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt="Avatar do Usuário" 
                className="w-9 h-9 rounded-full border border-white/5 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-xs font-bold text-zinc-400">
                {userProfile?.full_name ? userProfile.full_name.substring(0, 2).toUpperCase() : "MC"}
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl bg-zinc-900/50 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/20 text-zinc-400 hover:text-rose-500 transition-colors group"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Grid Geral de Responsividade */}
      <div className="flex-1 flex flex-col gap-6 tablet:grid tablet:grid-cols-12 tablet:gap-6 lg:gap-8 tablet:items-stretch h-full">
        
        {/* COLUNA ESQUERDA (tablet:col-span-5): Semáforo e Atalhos */}
        <div className="flex flex-col gap-6 tablet:col-span-5 h-full">
          
          {/* Card do Semáforo */}
          <Card className="bg-zinc-900/40 border-white/5 shadow-[0_8px_30px_rgba(234,179,8,0.04)] hover:shadow-[0_8px_30px_rgba(234,179,8,0.1)] backdrop-blur-md overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:-translate-y-0.5">
            <CardHeader className="p-6 sm:p-8 pb-2 sm:pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nosso Ritmo Diário 💛</CardTitle>
                <CardDescription className="text-[10px] text-zinc-550 mt-0.5">Como estamos cuidando do nosso dinheiro hoje</CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 sm:p-8 pt-0 flex flex-col items-center">
              {/* Lente circular com Glow neon correspondente */}
              <div className="relative flex flex-col items-center justify-center mt-4 mb-6 w-full">
                {/* Glow de fundo */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[60px] opacity-20 transition-all duration-700 pointer-events-none ${
                  financeStatus === "green" ? "bg-emerald-500" : 
                  financeStatus === "yellow" ? "bg-yellow-400" : "bg-rose-500"
                }`} />

                {/* Círculo do Ícone */}
                <div className={`w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-500 relative overflow-hidden bg-zinc-950/80 z-10 ${
                  financeStatus === "green" ? "border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]" : 
                  financeStatus === "yellow" ? "border-yellow-400/30 text-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.2)]" : 
                  "border-rose-500/30 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]"
                }`}>
                  <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 pointer-events-none" />
                  
                  {financeStatus === "green" && <CheckCircle2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                  {financeStatus === "yellow" && <AlertTriangle className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                  {financeStatus === "red" && <XCircle className="w-12 h-12 text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" />}
                </div>
                
                {/* Título de Status fora do Círculo para não vazar */}
                <span className={`text-xs font-black uppercase tracking-widest mt-6 z-10 ${
                  financeStatus === "green" ? "text-emerald-400" : 
                  financeStatus === "yellow" ? "text-yellow-400" : "text-rose-400"
                }`}>
                  {financeStatus === "green" ? "Caminho Livre! ✨" : 
                   financeStatus === "yellow" ? "Atenção Redobrada ⚠️" : "Ajuste de Rota! 🛡️"}
                </span>
              </div>

              {/* Texto explicativo polido e dinâmico */}
              <div className="text-center max-w-sm mt-1 px-3 min-h-[80px] flex flex-col justify-center">
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  {strategy?.isChoqueRequired ? (
                    <span className="text-rose-400 font-bold block mb-1">
                      Atenção, casal! Nossas faturas estão exigindo mais do que nosso caixa livre. É hora de ativar a Operação de Choque para blindar nossas economias. Vamos juntos superar essa fase! 💪
                    </span>
                  ) : null}
                  {financeStatus === "green" && "Sintonia perfeita, casal! Vocês estão cuidando super bem do orçamento hoje. Caminho livre para gastos conscientes!"}
                  {financeStatus === "yellow" && "Atenção e carinho com o bolso hoje! Estamos perto do nosso limite diário. Que tal adiar aquela compra não urgente para amanhã?"}
                  {financeStatus === "red" && !strategy?.isChoqueRequired && "Recalculando rota! Passamos do nosso teto diário hoje. Vamos segurar novos gastos não essenciais para proteger nosso final do mês?"}
                </p>
              </div>
              
              {/* Métrica de Economia Real do Casal */}
              {(economyTotal !== 0) && (
                <div className={`w-full max-w-sm mt-2 p-3 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                  economyTotal > 0 
                    ? "bg-emerald-500/10 border-emerald-500/20" 
                    : "bg-rose-500/10 border-rose-500/20"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      economyTotal > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                    }`}>
                      {economyTotal > 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] uppercase font-black tracking-widest ${
                        economyTotal > 0 ? "text-emerald-500" : "text-rose-500"
                      }`}>
                        {economyTotal > 0 ? "Economia no Mês" : "Despesa Extra"}
                      </span>
                      <span className={`text-[10px] font-semibold ${
                        economyTotal > 0 ? "text-emerald-400/80" : "text-rose-400/80"
                      }`}>
                        {economyTotal > 0 ? "Poupamos mais do que o previsto!" : "Gastamos além do previsto."}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-black ${
                      economyTotal > 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      R$ {Math.abs(economyTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Info de valores compactos reais do casal */}
              <div className="w-full flex gap-3 mt-6 pt-4 border-t border-white/5 text-xs">
                <div className="flex-1 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Reserva Livre do Casal</span>
                  <span className={`text-sm font-black mt-0.5 ${strategy?.remainingCashResidue && strategy.remainingCashResidue > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    R$ {strategy?.hasStrategy ? strategy.remainingCashResidue.toFixed(2) : "0,00"}
                  </span>
                </div>
                <div className="flex-1 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Nosso Teto Diário</span>
                  <span className="text-sm font-black text-yellow-500 mt-0.5">
                    R$ {tetoDiario.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Botões alinhados com o Card */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Link href="/chat" className="flex-1">
              <Button 
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 font-black shadow-[0_4px_15px_rgba(234,179,8,0.2)] flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs border-none transition-all duration-300 hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-zinc-950 fill-zinc-950" />
                Conselheiro IA 🤖
              </Button>
            </Link>
            <Link href="/profile" className="flex-1">
              <Button 
                variant="outline" 
                className="w-full border-white/5 hover:bg-zinc-900/50 hover:border-zinc-800 text-zinc-300 font-bold h-11 rounded-xl text-xs transition-all duration-300 hover:scale-[1.02]"
              >
                Ajustar Finanças ⚙️
              </Button>
            </Link>
          </div>

          {/* Conselheiro de Choque Dinâmico */}
          {strategy?.hasStrategy ? (
            <Card className="bg-zinc-900/40 border-white/5 shadow-[0_8px_30px_rgba(234,179,8,0.04)] hover:shadow-[0_8px_30px_rgba(234,179,8,0.1)] backdrop-blur-md overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:-translate-y-0.5">
              <CardHeader className="p-6 sm:p-8 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  Recomendações da Nossa IA 💡
                </CardTitle>
                <CardDescription className="text-[9px] text-zinc-550 mt-0.5">
                  Ideias personalizadas para apoiar a jornada de vocês
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-0 space-y-4">
                {strategy.isChoqueRequired ? (
                  <div className="space-y-3">
                    <span className="text-[9px] text-rose-400 uppercase tracking-widest font-black block">Passo a Passo para Cuidar do Bolso:</span>
                    
                    {strategy.cardActions.map((act, i) => (
                      <div key={i} className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] text-zinc-200 font-bold block">{act.cardName}</span>
                        <p className="text-[9px] text-zinc-400 leading-relaxed font-semibold">{act.recommendation}</p>
                      </div>
                    ))}

                    {strategy.debtActions.map((act, i) => (
                      <div key={i} className="bg-yellow-500/5 border border-yellow-500/10 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] text-zinc-200 font-bold block">{act.debtTitle}</span>
                        <p className="text-[9px] text-zinc-400 leading-relaxed font-semibold">{act.recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-center">
                    <span className="text-xs font-bold text-emerald-400 block mb-1">Caminho Lindo! 🌸</span>
                    <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold">Tudo em ordem por aqui, casal! O caixa está no azul e sob controle. Continuem nessa sintonia incrível cuidando do planejamento!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

        </div>

        {/* COLUNA DIREITA (tablet:col-span-7): Resumo do Fluxo & Calendário */}
        <div className="flex flex-col gap-6 tablet:col-span-7 h-full">
          
          {/* Resumo de Fluxo & Previsão Futura */}
          <section className="relative">
            <Card className="bg-zinc-900/40 border-white/5 shadow-[0_8px_30px_rgba(234,179,8,0.04)] hover:shadow-[0_8px_30px_rgba(234,179,8,0.1)] backdrop-blur-md relative overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:-translate-y-0.5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <CardHeader className="p-6 sm:p-8 pb-2 sm:pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-xs uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Nosso Fluxo & Sonhos ✨</span>
                  </div>
                  <Badge className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black px-2.5 py-0.5 text-[9px] uppercase tracking-wider">
                    {getReadableMonthLabel(selectedMonthStr)}
                  </Badge>
                </div>
                <CardTitle className="text-base font-extrabold text-zinc-100 mt-1">Raio-X das Nossas Finanças</CardTitle>
                <CardDescription className="text-[10px] text-zinc-550 mt-0.5">Acompanhem o dinheiro deste mês e vejam como está o planejamento para o próximo</CardDescription>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 pt-0 space-y-6">
                {strategy?.hasStrategy ? (
                  <>
                    {/* Linha do Fluxo do Mês Selecionado */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold block">Receitas</span>
                        <span className="text-xs font-bold text-emerald-400 block mt-0.5">R$ {strategy.totalIncome.toFixed(0)}</span>
                      </div>
                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold block">Essenciais</span>
                        <span className="text-xs font-bold text-zinc-350 block mt-0.5">R$ {strategy.totalEssentialExpenses.toFixed(0)}</span>
                      </div>
                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold block">Compromissos</span>
                        <span className="text-xs font-bold text-rose-400 block mt-0.5">R$ {(strategy.totalDebtInstallments + strategy.totalCreditCardInvoices).toFixed(0)}</span>
                      </div>
                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold block">Saldo Disponível</span>
                        <span className={`text-xs font-black block mt-0.5 ${strategy.disposableIncomeForDebts >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          R$ {strategy.disposableIncomeForDebts.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Descrição resumida da situação */}
                    <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex gap-2.5 items-start">
                      <Info className="w-4.5 h-4.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-300 font-black uppercase tracking-wider block">Diagnóstico do Período</span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                          {strategy.isChoqueRequired ? (
                            `Recalculando rota, casal! As contas deste período estão superando a renda em R$ ${Math.abs(strategy.disposableIncomeForDebts - (strategy.totalDebtInstallments + strategy.totalCreditCardInvoices)).toFixed(2)}. Vamos acionar o Plano de Choque abaixo! Juntos, vocês conseguem colocar a casa em ordem! 💪`
                          ) : strategy.remainingCashResidue < 300 ? (
                            `Atenção redobrada, casal! Temos uma margem livre estreita de R$ ${strategy.remainingCashResidue.toFixed(2)}. Vamos evitar novas comprinhas supérfluas por agora para manter nosso caixa longe do rotativo! ⚠️`
                          ) : (
                            `Sintonia nota 10! Nosso orçamento está em perfeito equilíbrio com R$ ${strategy.remainingCashResidue.toFixed(2)} livres. Perfeito para guardar para nossos sonhos ou adiantar parcelas de contratos antigos! 🌱`
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Alocação Crítica e Engenharia (Aparece apenas em Choque) */}
                    {strategy.isChoqueRequired && (() => {
                      // Calcula os totais diretamente na UI
                      const totalAlocacaoCritica = strategy.debtActions.reduce((acc, a) => acc + a.installmentValue, 0) + 
                        strategy.cardActions.filter(c => c.suggestedProportionalPayment >= c.currentInvoice && c.currentInvoice > 0).reduce((acc, c) => acc + c.currentInvoice, 0);
                      const totalResiduoPosAlocacao = Math.max(0, strategy.disposableIncomeForDebts - totalAlocacaoCritica);

                      return (
                        <div className="space-y-4 border-t border-white/5 pt-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <ShieldCheck className="w-4 h-4 text-rose-500" />
                              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                Alocação Crítica (Total: R$ {totalAlocacaoCritica.toFixed(2)})
                              </h4>
                            </div>
                            <p className="text-[10px] text-zinc-500 mb-3">As seguintes contas devem ser pagas integralmente assim que o salário for recebido para evitar penalidades e proteger o patrimônio.</p>
                            
                            <div className="bg-zinc-950/50 rounded-xl border border-white/5 overflow-hidden">
                              {strategy.debtActions.map((action, i) => (
                                <div key={i} className="flex justify-between items-center p-3 border-b border-white/5 last:border-none">
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-zinc-300">{action.debtTitle}</span>
                                    <span className="text-[9px] text-zinc-500 leading-tight mt-0.5 pr-2">{action.recommendation}</span>
                                  </div>
                                  <span className="text-xs font-black text-rose-400 whitespace-nowrap">R$ {action.installmentValue.toFixed(2)}</span>
                                </div>
                              ))}
                              {/* Filtra cartões que foram sugeridos para pagamento integral */}
                              {strategy.cardActions.filter(c => c.suggestedProportionalPayment >= c.currentInvoice && c.currentInvoice > 0).map((action, i) => (
                                <div key={`c-${i}`} className="flex justify-between items-center p-3 border-b border-white/5 last:border-none">
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-zinc-300">{action.cardName}</span>
                                    <span className="text-[9px] text-zinc-500 leading-tight mt-0.5 pr-2">Pagamento integral da fatura atual.</span>
                                  </div>
                                  <span className="text-xs font-black text-rose-400 whitespace-nowrap">R$ {action.currentInvoice.toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between items-center p-3 bg-zinc-900/80 border-t border-white/5">
                                <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">Saldo que sobrou para renegociações</span>
                                <span className="text-xs font-black text-yellow-500">R$ {totalResiduoPosAlocacao.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Cartões para Engenharia */}
                          {strategy.cardActions.filter(c => c.suggestedProportionalPayment < c.currentInvoice && c.currentInvoice > 0).length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2 mt-4">
                                <RefreshCcw className="w-4 h-4 text-yellow-500" />
                                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                  Engenharia Financeira
                                </h4>
                              </div>
                              <p className="text-[10px] text-zinc-500 mb-3">
                                Faturas que ultrapassam o saldo restante. Exigem ação ativa de renegociação (parcelamento da fatura) usando o resíduo (se houver) como entrada.
                              </p>
                              
                              <div className="bg-zinc-950/50 rounded-xl border border-white/5 overflow-hidden">
                                {strategy.cardActions.filter(c => c.suggestedProportionalPayment < c.currentInvoice && c.currentInvoice > 0).map((action, i) => (
                                  <div key={`eng-${i}`} className="flex flex-col p-3 border-b border-white/5 last:border-none">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[11px] font-bold text-zinc-300">{action.cardName}</span>
                                      <span className="text-xs font-black text-yellow-500">R$ {action.currentInvoice.toFixed(2)}</span>
                                    </div>
                                    <span className="text-[9px] text-zinc-400 leading-tight bg-zinc-900/50 p-2 rounded border border-white/5">
                                      {action.recommendation}
                                    </span>
                                  </div>
                                ))}
                                
                                {/* Alerta importante sobre Valores Mínimos Bancários */}
                                <div className="p-3 bg-yellow-500/10 border-t border-yellow-500/20 flex gap-2">
                                  <Info className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-[9px] text-yellow-500 font-medium leading-relaxed">
                                    <strong>Importante:</strong> Verifique com o banco o valor mínimo exigido para entrada no parcelamento da fatura. Caso o resíduo sugerido pelo app seja inferior ao mínimo do banco, entre em contato com a instituição para negociar condições especiais.
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Previsão do Mês que Vem (Próximo Mês) */}
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Como será nosso próximo mês ({getReadableMonthLabel(getNextMonthStr(selectedMonthStr))})?</span>
                        <Badge 
                          className={`font-black text-[9px] uppercase tracking-wider border-none px-2.5 py-0.5 ${
                            forecast.nextResidue > strategy.remainingCashResidue
                              ? "bg-emerald-500/10 text-emerald-400"
                              : forecast.nextResidue < 0
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {forecast.nextResidue > strategy.remainingCashResidue ? "Melhorando 📈" : forecast.nextResidue < 0 ? "Ajuste Necessário ⚠️" : "Estável 🤝"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Contas já Programadas</span>
                          <span className="text-sm font-black text-zinc-300 mt-1">R$ {forecast.nextCommitments.toFixed(2)}</span>
                        </div>
                        <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Nossa Estimativa de Caixa</span>
                          <span className={`text-sm font-black mt-1 ${forecast.nextResidue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            R$ {forecast.nextResidue.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-zinc-550 leading-relaxed font-semibold text-center italic mt-1">
                        {forecast.difference > 0 ? (
                          `Boas notícias à vista! Nossos compromissos previstos para o próximo mês caem de R$ ${totalCommitment.toFixed(2)} para R$ ${forecast.nextCommitments.toFixed(2)}, trazendo um alívio de R$ ${forecast.difference.toFixed(2)} no caixa para respirarmos melhor!`
                        ) : forecast.difference < 0 ? (
                          `Atenção, casal: as contas do próximo mês sobem cerca de R$ ${Math.abs(forecast.difference).toFixed(2)}. Que tal pouparmos um pouquinho do saldo atual para começar o próximo período com tranquilidade?`
                        ) : (
                          `Previsão de estabilidade: nossos compromissos para o próximo período se mantêm firmes em R$ ${forecast.nextCommitments.toFixed(2)}.`
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <Info className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">Vamos começar? Clique em "Planejar Nosso Futuro" para nos contar um pouco sobre o orçamento de vocês e habilitar esta visão!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* SEÇÃO DE CALENDÁRIO & CONTAS INTEGRADA */}
          <section className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col bg-zinc-900/40 border-white/5 shadow-[0_8px_30px_rgba(234,179,8,0.04)] hover:shadow-[0_8px_30px_rgba(234,179,8,0.1)] backdrop-blur-md overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:-translate-y-0.5">
              <CardHeader className="p-6 sm:p-8 pb-2 sm:pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-yellow-500" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nosso Calendário de Vencimentos 📅</CardTitle>
                </div>
                <CardDescription className="text-[10px] text-zinc-550 mt-1">Escolham um dia para acompanhar o fluxo das nossas contas juntos</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 p-6 sm:p-8 pt-4 sm:pt-6">
                <div className="flex flex-col gap-8 lg:gap-12 lg:flex-row lg:items-stretch w-full mt-2 h-full">
                  
                  {/* Calendário com Tradução PT-BR (locale={ptBR}) */}
                  <div className="lg:w-[55%] min-w-fit bg-zinc-950/50 p-6 sm:p-8 rounded-xl border border-white/5 flex flex-col justify-center items-center shadow-inner min-h-[360px]">
                    {mounted ? (
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        locale={ptBR}
                        className="rounded-md text-zinc-100"
                        modifiers={{
                          hasBill: (date) => hasBillOnDay(date)
                        }}
                        modifiersClassNames={{
                          hasBill: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-yellow-500"
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 animate-pulse">
                        <CalendarIcon className="w-8 h-8 opacity-20" />
                        <span className="text-xs font-bold uppercase tracking-wider opacity-50">Carregando Agenda...</span>
                      </div>
                    )}
                  </div>

                  {/* Lista de Contas */}
                  <div className="lg:w-[45%] bg-zinc-950/50 p-6 sm:p-8 rounded-xl border border-white/5 flex flex-col min-h-[360px]">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-4">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Nosso plano para este dia:
                      </h4>
                      <Badge variant="outline" className="border-yellow-500/25 text-yellow-400 bg-yellow-950/10 text-[9px] font-bold">
                        {selectedDate ? selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : 'Data'}
                      </Badge>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      {selectedDateBills.length > 0 ? (
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {selectedDateBills.map((bill) => (
                            <div 
                              key={bill.id}
                              className="flex flex-col bg-zinc-950/40 p-4 rounded-xl border border-white/5 hover:border-zinc-800 transition-all duration-300"
                            >
                              {/* Titulo isolado no topo */}
                              <div className="mb-3">
                                <h5 className="text-xs font-bold text-zinc-200 block">{bill.title}</h5>
                                <span className="text-[9px] text-zinc-550 font-semibold">{bill.category}</span>
                              </div>
                              
                              {/* Valores e Botões na mesma linha */}
                              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
                                <div className="text-left">
                                  {bill.status === "paid" ? (
                                    <div className="flex flex-col">
                                      <span className="text-xs text-emerald-400 font-black">R$ {bill.paidAmount?.toFixed(2)} Pago</span>
                                      {bill.paidAmount !== bill.amount && (
                                        <span className="text-[9px] text-zinc-500 line-through">R$ {bill.amount.toFixed(2)}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-sm font-black text-white block">R$ {bill.amount.toFixed(2)}</span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {bill.status === "pending" ? (
                                    <>
                                      <Badge variant="outline" className="border-yellow-500/20 text-yellow-400 bg-yellow-950/10 text-[9px] uppercase font-black px-2 py-0.5 hidden xs:inline-flex">
                                        Aguardando
                                      </Badge>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8 px-3 bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-300 rounded-lg" />}>
                                          Ações <MoreHorizontal className="w-3.5 h-3.5 ml-1.5" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border border-white/10 shadow-xl rounded-xl">
                                          <DropdownMenuItem onClick={() => handleSyncGoogleCalendar(bill)} className="text-xs focus:bg-zinc-800 focus:text-white cursor-pointer rounded-lg p-2 m-1">
                                            <CalendarPlus className="w-3.5 h-3.5 mr-2 text-blue-400" />
                                            Agendar no Google
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => openConfirmModal(bill)} className="text-xs focus:bg-emerald-500/20 focus:text-emerald-400 cursor-pointer font-bold rounded-lg p-2 m-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                                            Confirmar Pagamento
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </>
                                  ) : (
                                    <>
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-black px-2 py-0.5">
                                        Pago ✓
                                      </Badge>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => bill.transactionId && handleUndoPayment(bill.transactionId)}
                                        className="h-8 px-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                        title="Desfazer Pagamento"
                                      >
                                        <Undo2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 bg-zinc-950/10 rounded-xl border border-dashed border-white/5">
                          <Info className="w-6 h-6 text-zinc-650 mb-2" />
                          <p className="text-xs text-zinc-500 font-medium text-center">Tudo em paz! Nenhuma conta vencendo hoje. Aproveitem! 🎉</p>
                          <p className="text-[9px] text-zinc-650 mt-1.5 text-center">Dica: Dias marcados com bolinhas amarelas indicam contas programadas.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </section>

        </div>

      </div>

      {/* Footer / Barra de Navegação PWA Minimalista */}
      <footer className="mt-10 pt-5 border-t border-white/5 flex justify-around text-zinc-600 text-xs">
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
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="bg-zinc-950 border border-white/10 shadow-2xl sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Confirmar Pagamento
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-2">
              Você está confirmando o pagamento de <strong>{billToConfirm?.title}</strong>. 
              Ajuste o valor abaixo se você pagou um valor diferente do planejado (isso nos ajuda a calcular sua economia).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 block">
              Valor Real Pago (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={actualAmountPaid}
              onChange={(e) => setActualAmountPaid(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50"
            />
            {billToConfirm && actualAmountPaid < billToConfirm.amount && (
              <p className="text-xs text-emerald-400 mt-3 font-bold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                <TrendingDown className="w-4 h-4" />
                Economia de R$ {(billToConfirm.amount - actualAmountPaid).toFixed(2)}! 🎉
              </p>
            )}
            {billToConfirm && actualAmountPaid > billToConfirm.amount && (
              <p className="text-xs text-rose-400 mt-3 font-bold flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                <TrendingUp className="w-4 h-4" />
                Extrapolou R$ {(actualAmountPaid - billToConfirm.amount).toFixed(2)} do planejado.
              </p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setConfirmModalOpen(false)} className="text-zinc-400 hover:text-white rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl">
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
