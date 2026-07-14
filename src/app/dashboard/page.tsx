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
  ArrowRight
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

// Tipagem para as contas
interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // Formato: AAAA-MM-DD
  status: "paid" | "pending";
  category: string;
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
      if (rawRes.success) {
        setRawCards(rawRes.creditCards);
        setRawDebts(rawRes.debts);
        const realBills = buildRealBills(rawRes.fixedExpenses, rawRes.debts, rawRes.creditCards, monthStr);
        setBills(realBills);
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
  const buildRealBills = (expenses: any[], debts: any[], cards: any[], currentMonthStr: string) => {
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

    return generatedBills;
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

  // Marcar conta como paga
  const markAsPaid = (billId: string) => {
    setBills(prev => 
      prev.map(bill => {
        if (bill.id === billId && bill.status === "pending") {
          return { ...bill, status: "paid" };
        }
        return bill;
      })
    );
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
        alert(`Sucesso! A conta "${bill.title}" foi agendada no seu Google Agenda.`);
      } else {
        alert(`Aviso: ${res.error}\n\nNota: Para sincronizar compromissos, faça login usando sua conta do Google neste aplicativo.`);
      }
    } catch (err: any) {
      alert("Erro ao conectar com a API do Google: " + err.message);
    }
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

  if (!mounted) {
    return (
      <div className="flex-1 w-full max-w-md mx-auto bg-zinc-950 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center animate-pulse">
            <Coins className="w-6 h-6 text-yellow-500 animate-spin-slow" />
          </div>
          <span className="text-xs text-zinc-550 uppercase tracking-widest font-black animate-pulse">
            Carregando Fintech Casal...
          </span>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-2.5 w-full xs:w-auto">
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 relative overflow-hidden">
            <Coins className="w-5.5 h-5.5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white sm:text-lg">
              {userProfile?.full_name ? `Olá, ${userProfile.full_name.split(" ")[0]} 👋` : "Fintech Casal"}
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Dashboard Compartilhado</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap xs:flex-nowrap w-full xs:w-auto justify-between xs:justify-end">
          <Badge variant="outline" className="border-yellow-500/20 text-yellow-400 bg-yellow-950/10 px-2.5 py-1 text-xs">
            {getReadableMonthLabel(selectedMonthStr)}
          </Badge>
          <Link href="/onboarding">
            <Badge className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 px-2.5 py-1 text-xs font-black border-none cursor-pointer flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-950 fill-zinc-950" />
              Configurar Finanças
            </Badge>
          </Link>
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
        </div>
      </header>

      {/* Grid Geral de Responsividade */}
      <div className="flex-1 flex flex-col gap-6 tablet:grid tablet:grid-cols-12 tablet:gap-6 lg:gap-8 tablet:items-start">
        
        {/* COLUNA ESQUERDA (tablet:col-span-5): Semáforo e Atalhos */}
        <div className="flex flex-col gap-6 tablet:col-span-5">
          
          {/* Card do Semáforo */}
          <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="p-6 pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Orçamento Diário</CardTitle>
                <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Semáforo de saúde financeira de hoje</CardDescription>
              </div>
              
              {/* Seletor de Semáforo */}
              <div className="flex gap-1.5 bg-zinc-950/80 p-1 rounded-lg border border-white/5">
                <button 
                  onClick={() => setFinanceStatus("green")}
                  className={`w-6 h-6 rounded-md text-[10px] font-black transition-all ${financeStatus === 'green' ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  V
                </button>
                <button 
                  onClick={() => setFinanceStatus("yellow")}
                  className={`w-6 h-6 rounded-md text-[10px] font-black transition-all ${financeStatus === 'yellow' ? 'bg-yellow-400 text-zinc-950 shadow-md shadow-yellow-400/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  A
                </button>
                <button 
                  onClick={() => setFinanceStatus("red")}
                  className={`w-6 h-6 rounded-md text-[10px] font-black transition-all ${financeStatus === 'red' ? 'bg-rose-500 text-zinc-950 shadow-md shadow-rose-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  V
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 pt-0 flex flex-col items-center">
              {/* Lente circular com Glow neon correspondente */}
              <div className="relative flex items-center justify-center my-6">
                <div className={`absolute w-36 h-36 rounded-full blur-3xl opacity-25 transition-all duration-700 ${
                  financeStatus === "green" ? "bg-emerald-500" : 
                  financeStatus === "yellow" ? "bg-yellow-400" : "bg-rose-500"
                }`} />

                <div className={`w-32 h-32 rounded-full border flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden bg-zinc-950/60 ${
                  financeStatus === "green" ? "border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : 
                  financeStatus === "yellow" ? "border-yellow-400/20 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.1)]" : 
                  "border-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
                }`}>
                  <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-40 pointer-events-none" />
                  
                  {financeStatus === "green" && <CheckCircle2 className="w-10 h-10 animate-bounce" />}
                  {financeStatus === "yellow" && <AlertTriangle className="w-10 h-10 animate-pulse" />}
                  {financeStatus === "red" && <XCircle className="w-10 h-10" />}
                  
                  <span className="text-[10px] font-black uppercase tracking-widest mt-2.5">
                    {financeStatus === "green" ? "Sinal Verde" : 
                     financeStatus === "yellow" ? "Sinal Amarelo" : "Sinal Vermelho"}
                  </span>
                </div>
              </div>

              {/* Texto explicativo polido e dinâmico */}
              <div className="text-center max-w-sm mt-1 px-3">
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  {strategy?.isChoqueRequired ? (
                    <span className="text-rose-400 font-bold block">
                      Operação de Choque Ativa! As faturas de cartão superam o resíduo financeiro livre do casal.
                    </span>
                  ) : null}
                  {financeStatus === "green" && "Ótimo trabalho! Vocês estão economizando e operando abaixo da margem diária limite. Gastos moderados liberados."}
                  {financeStatus === "yellow" && "Atenção necessária! Gastos acumulados próximos ao teto do dia. Pondere novas saídas financeiras hoje."}
                  {financeStatus === "red" && !strategy?.isChoqueRequired && "Limite diário estourado! Evite novas despesas não essenciais hoje para manter as metas mensais no rumo."}
                </p>
              </div>

              {/* Info de valores compactos reais do casal */}
              <div className="w-full flex gap-3 mt-6 pt-4 border-t border-white/5 text-xs">
                <div className="flex-1 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-semibold">Resíduo de Caixa</span>
                  <span className={`text-sm font-black mt-0.5 ${strategy?.remainingCashResidue && strategy.remainingCashResidue > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    R$ {strategy?.hasStrategy ? strategy.remainingCashResidue.toFixed(2) : "0,00"}
                  </span>
                </div>
                <div className="flex-1 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[9px] text-zinc-550 uppercase tracking-wider font-semibold">Teto diário</span>
                  <span className="text-sm font-black text-yellow-500 mt-0.5">
                    R$ {tetoDiario.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Botões alinhados com o Card */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/chat" className="flex-1">
              <Button 
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 font-black shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs border-none"
              >
                <Sparkles className="w-4 h-4 text-zinc-950 fill-zinc-950" />
                Conselheiro IA
              </Button>
            </Link>
            <Link href="/profile" className="flex-1">
              <Button 
                variant="outline" 
                className="w-full border-white/5 hover:bg-zinc-900/50 hover:border-zinc-800 text-zinc-300 font-bold h-11 rounded-xl text-xs"
              >
                Editar Orçamento
              </Button>
            </Link>
          </div>

          {/* Conselheiro de Choque Dinâmico */}
          {strategy?.hasStrategy ? (
            <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  Conselheiro IA Real
                </CardTitle>
                <CardDescription className="text-[9px] text-zinc-550 mt-0.5">
                  Diagnóstico estratégico com base no seu status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {strategy.isChoqueRequired ? (
                  <div className="space-y-3">
                    <span className="text-[9px] text-rose-400 uppercase tracking-widest font-black block">Ações Recomendadas:</span>
                    
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
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-center">
                    <span className="text-xs font-bold text-emerald-400 block mb-1">Situação Saudável!</span>
                    <p className="text-[10px] text-zinc-400 font-medium">Orçamento equilibrado e caixa livre suficiente. Continuem operando com controle das faturas agendadas.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

        </div>

        {/* COLUNA DIREITA (tablet:col-span-7): Resumo do Fluxo & Calendário */}
        <div className="flex flex-col gap-6 tablet:col-span-7">
          
          {/* Resumo de Fluxo & Previsão Futura */}
          <section className="relative">
            <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <CardHeader className="p-6 pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-xs uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Fluxo & Planejamento</span>
                  </div>
                  <Badge className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black px-2.5 py-0.5 text-[9px] uppercase tracking-wider">
                    {getReadableMonthLabel(selectedMonthStr)}
                  </Badge>
                </div>
                <CardTitle className="text-base font-extrabold text-zinc-100 mt-1">Resumo de Fluxo & Previsão</CardTitle>
                <CardDescription className="text-[10px] text-zinc-500 mt-0.5">Visão transparente do caixa do casal e projeção do próximo período</CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-0 space-y-6">
                {strategy?.hasStrategy ? (
                  <>
                    {/* Linha do Fluxo do Mês Selecionado */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-zinc-550 uppercase font-bold block">Receitas</span>
                        <span className="text-xs font-bold text-emerald-400 block mt-0.5">R$ {strategy.totalIncome.toFixed(0)}</span>
                      </div>
                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-zinc-550 uppercase font-bold block">Essenciais</span>
                        <span className="text-xs font-bold text-zinc-350 block mt-0.5">R$ {strategy.totalEssentialExpenses.toFixed(0)}</span>
                      </div>
                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-zinc-550 uppercase font-bold block">Compromissos</span>
                        <span className="text-xs font-bold text-rose-400 block mt-0.5">R$ {(strategy.totalDebtInstallments + strategy.totalCreditCardInvoices).toFixed(0)}</span>
                      </div>
                      <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-zinc-550 uppercase font-bold block">Livre</span>
                        <span className={`text-xs font-black block mt-0.5 ${strategy.remainingCashResidue >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          R$ {strategy.remainingCashResidue.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Descrição resumida da situação */}
                    <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex gap-2.5 items-start">
                      <Info className="w-4.5 h-4.5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-300 font-black uppercase tracking-wider block">Diagnóstico do Período</span>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                          {strategy.remainingCashResidue <= 0 ? (
                            `Atenção crítica! Suas despesas e faturas deste mês superam suas receitas em R$ ${Math.abs(strategy.remainingCashResidue).toFixed(2)}. É fundamental acionar o Plano de Choque de cartões e renegociar os atrasos de imediato.`
                          ) : strategy.remainingCashResidue < 300 ? (
                            `Alerta de margem estreita: Vocês possuem R$ ${strategy.remainingCashResidue.toFixed(2)} de caixa livre residual. Evitem compras supérfluas para evitar o uso do rotativo.`
                          ) : (
                            `Fluxo sob controle: Orçamento balanceado com R$ ${strategy.remainingCashResidue.toFixed(2)} livres. Perfeito para guardar na reserva de emergência ou amortizar contratos antigos.`
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Previsão do Mês que Vem (Próximo Mês) */}
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Previsão Próximo Mês ({getReadableMonthLabel(getNextMonthStr(selectedMonthStr))})</span>
                        <Badge 
                          className={`font-black text-[9px] uppercase tracking-wider border-none px-2.5 py-0.5 ${
                            forecast.nextResidue > strategy.remainingCashResidue
                              ? "bg-emerald-500/10 text-emerald-400"
                              : forecast.nextResidue < 0
                              ? "bg-rose-500/10 text-rose-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {forecast.nextResidue > strategy.remainingCashResidue ? "Melhorando 📈" : forecast.nextResidue < 0 ? "Crítico ⚠️" : "Estável 🤝"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] text-zinc-550 font-bold uppercase">Compromissos Previstos</span>
                          <span className="text-sm font-black text-zinc-300 mt-1">R$ {forecast.nextCommitments.toFixed(2)}</span>
                        </div>
                        <div className="bg-zinc-950/40 p-3 rounded-xl border border-white/5 flex flex-col justify-between">
                          <span className="text-[9px] text-zinc-550 font-bold uppercase">Caixa Livre Estimado</span>
                          <span className={`text-sm font-black mt-1 ${forecast.nextResidue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            R$ {forecast.nextResidue.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-zinc-550 leading-relaxed font-semibold text-center italic mt-1">
                        {forecast.difference > 0 ? (
                          `As faturas e parcelas previstas para o próximo mês caem de R$ ${totalCommitment.toFixed(2)} para R$ ${forecast.nextCommitments.toFixed(2)}, trazendo um alívio extra de R$ ${forecast.difference.toFixed(2)} no caixa!`
                        ) : forecast.difference < 0 ? (
                          `Atenção: Os compromissos sobem em R$ ${Math.abs(forecast.difference).toFixed(2)} no próximo mês devido às faturas agendadas. Poupem o saldo atual.`
                        ) : (
                          `As parcelas e faturas previstas mantêm-se estáveis no próximo período em R$ ${forecast.nextCommitments.toFixed(2)}.`
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <Info className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">Por favor, preencha o onboarding para habilitar os relatórios de fluxo.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* SEÇÃO DE CALENDÁRIO & CONTAS INTEGRADA */}
          <section>
            <Card className="bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden">
              <CardHeader className="p-6 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-yellow-500" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">Calendário & Contas a Vencer</CardTitle>
                </div>
                <CardDescription className="text-[10px] text-zinc-500 mt-1">Selecione uma data para inspecionar os vencimentos do casal</CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch w-full">
                  
                  {/* Calendário com Tradução PT-BR (locale={ptBR}) */}
                  <div className="flex-1 bg-zinc-950/50 p-4 rounded-xl border border-white/5 flex flex-col justify-center items-center min-w-[280px] shadow-inner">
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
                  </div>

                  {/* Lista de Contas */}
                  <div className="flex-1 bg-zinc-950/50 p-4 rounded-xl border border-white/5 flex flex-col min-h-[320px]">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-4">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Vencimentos no dia:
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
                              className="flex items-center justify-between bg-zinc-950/40 p-3 rounded-xl border border-white/5 hover:border-zinc-800 transition-all duration-300"
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-200">{bill.title}</span>
                                <span className="text-[9px] text-zinc-550 mt-0.5">{bill.category}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-xs font-black text-zinc-100 block">R$ {bill.amount.toFixed(2)}</span>
                                  <span className={`text-[8px] font-black uppercase tracking-wider block mt-0.5 ${
                                    bill.status === "paid" ? "text-emerald-400" : "text-yellow-400"
                                  }`}>
                                    {bill.status === "paid" ? "Pago" : "Pendente"}
                                  </span>
                                </div>
                                
                                {bill.status === "pending" ? (
                                  <div className="flex gap-1.5">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleSyncGoogleCalendar(bill)}
                                      className="h-8 border-yellow-500/10 hover:border-yellow-500/30 hover:bg-yellow-500/5 text-yellow-500 text-[10px] px-2 font-bold rounded-lg shadow-sm"
                                    >
                                      Agendar 📅
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => markAsPaid(bill.id)}
                                      className="h-8 border-yellow-500/20 hover:border-yellow-400 hover:bg-yellow-500/10 text-yellow-400 text-xs px-2.5 font-bold rounded-lg shadow-sm"
                                    >
                                      Pagar
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-emerald-950/10 border border-emerald-500/10 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 bg-zinc-950/10 rounded-xl border border-dashed border-white/5">
                          <Info className="w-6 h-6 text-zinc-650 mb-2" />
                          <p className="text-xs text-zinc-500 font-medium text-center">Nenhum compromisso agendado para este dia.</p>
                          <p className="text-[9px] text-zinc-650 mt-1 text-center">Toque em dias com pontos amarelos no calendário para inspecionar.</p>
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
      
    </div>
  );
}
