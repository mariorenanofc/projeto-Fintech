"use client";

import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  MoreHorizontal, 
  CalendarPlus, 
  Undo2, 
  Info, 
  Trash2, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Activity 
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ptBR } from "date-fns/locale";
import { Bill } from "@/types";
import { TiltCard } from "@/components/ui/tilt-card";
import { deleteTransaction } from "@/actions/transactions";
import { toast } from "sonner";
import Link from "next/link";

interface CalendarSectionProps {
  selectedDate: Date | undefined;
  handleDateSelect: (date: Date | undefined) => void;
  selectedDateBills: Bill[];
  allBills?: Bill[];
  hasBillOnDay: (date: Date) => boolean;
  mounted: boolean;
  handleSyncGoogleCalendar: (bill: Bill) => void;
  openConfirmModal: (bill: Bill) => void;
  handleUndoPayment: (transactionId: string) => void;
  onMonthChange?: (monthDate: Date) => void;
  transactions?: any[];
  onRefresh?: () => void;
  selectedMonthStr?: string;
}

export function CalendarSection({
  selectedDate,
  handleDateSelect,
  selectedDateBills,
  allBills = [],
  hasBillOnDay,
  mounted,
  handleSyncGoogleCalendar,
  openConfirmModal,
  handleUndoPayment,
  onMonthChange,
  transactions = [],
  onRefresh,
  selectedMonthStr,
}: CalendarSectionProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Calcula o mês selecionado para sincronizar a exibição do calendário
  const calendarMonth = (() => {
    if (!selectedMonthStr) return new Date();
    const [year, month] = selectedMonthStr.split("-").map(Number);
    return new Date(year, month - 1, 1);
  })();

  // Filtra as transações de despesas do mês
  const monthlyExpenses = transactions.filter(t => t.type === "expense");
  const totalExpensesValue = monthlyExpenses.reduce((sum, t) => sum + Number(t.amount), 0);

  // Quantidade de dias no mês
  const getDaysInMonth = () => {
    const baseDate = selectedDate || new Date();
    return new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  };
  const totalDays = getDaysInMonth();
  const dailyAverage = totalExpensesValue > 0 ? totalExpensesValue / totalDays : 0;

  // Encontra o maior gasto diário para escalonar o gráfico de ritmo
  const dailyExpenseTotals = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const baseDate = selectedDate || new Date();
    const dayStr = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayExpenses = monthlyExpenses.filter(t => t.date === dayStr);
    return dayExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
  });
  const maxDayExpense = Math.max(...dailyExpenseTotals, 1);

  // Determina o saldo líquido de cada dia para colorir o calendário (Mapa de Calor)
  const getDayBalanceStatus = (date: Date) => {
    // Corrige fuso horário local
    const localOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - localOffset);
    const dateStr = localDate.toISOString().substring(0, 10);

    const dayTx = transactions.filter(t => t.date === dateStr);
    if (dayTx.length === 0) return "none";

    const income = dayTx.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = dayTx.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);

    if (income === 0 && expense === 0) return "none";
    return income >= expense ? "positive" : "negative";
  };

  // Trata a seleção do dia no calendário e abre a gaveta de detalhes
  const onDayClick = (date: Date | undefined) => {
    handleDateSelect(date);
    if (date) {
      setIsDetailOpen(true);
    }
  };

  // Exclusão de transações rápida dentro do modal
  const handleDeleteTx = async (id: string) => {
    try {
      const res = await deleteTransaction(id);
      if (res.success) {
        toast.success("Transação excluída com sucesso!");
        if (onRefresh) onRefresh();
      } else {
        toast.error("Erro ao excluir transação: " + res.error);
      }
    } catch (err) {
      toast.error("Ocorreu um erro inesperado.");
    }
  };

  // Calcula contas pendentes a vencer nos próximos 3 dias
  const todayStr = new Date().toISOString().substring(0, 10);
  const in3DaysDate = new Date();
  in3DaysDate.setDate(in3DaysDate.getDate() + 3);
  const in3DaysStr = in3DaysDate.toISOString().substring(0, 10);

  const upcomingBills = allBills.filter(
    b => b.status === "pending" && b.dueDate >= todayStr && b.dueDate <= in3DaysStr
  );
  const upcomingBillsTotal = upcomingBills.reduce((sum, b) => sum + b.amount, 0);

  // Filtra as transações e saldos do dia selecionado
  const getSelectedDayDetails = () => {
    if (!selectedDate) return { transactions: [], balance: 0, income: 0, expense: 0, dateStr: "" };
    
    const localOffset = selectedDate.getTimezoneOffset() * 60000;
    const localDate = new Date(selectedDate.getTime() - localOffset);
    const dateStr = localDate.toISOString().substring(0, 10);

    const dayTx = transactions.filter(t => t.date === dateStr);
    const income = dayTx.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = dayTx.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = income - expense;

    return {
      transactions: dayTx,
      income,
      expense,
      balance,
      dateStr
    };
  };

  const dayDetails = getSelectedDayDetails();

  return (
    <section className="w-full mt-6">
      <TiltCard glowColor="rgba(234, 179, 8, 0.15)" className="space-y-4" disableTilt={true}>
        
        {/* Header do componente */}
        <div className="flex flex-col border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-yellow-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mapa de Calor &amp; Ritmo Mensal Conjugal 📅</h3>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Acompanhem o ritmo de gastos diários e visualizem os lançamentos selecionando uma data no mapa.</p>
        </div>

        <div className="space-y-4 pt-1">
          {upcomingBills.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-xl flex items-center justify-between gap-3 mb-4 text-xs font-semibold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span>
                  Atenção, casal: <strong className="text-amber-200 font-extrabold">{upcomingBills.length} {upcomingBills.length === 1 ? 'conta vence' : 'contas vencem'} nos próximos 3 dias</strong> (Total: R$ {upcomingBillsTotal.toFixed(2)})!
                </span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] uppercase font-black px-2.5 py-0.5 shrink-0 hidden xs:inline-flex">
                Vencimento Próximo ⚠️
              </Badge>
            </div>
          )}

          {/* Grid Principal de 2 colunas */}
          <div className="flex flex-col gap-6 lg:gap-8 lg:flex-row lg:items-stretch w-full mt-2 h-full">
            
            {/* Coluna 1: Mapa de Calor (Calendário) */}
            <div className="w-full lg:w-[54%] bg-zinc-950/50 p-4 sm:p-5 rounded-xl border border-white/5 flex flex-col justify-center items-center shadow-inner min-h-[380px]">
              {mounted ? (
                <div className="flex flex-col items-center w-full space-y-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={onDayClick}
                    onMonthChange={onMonthChange}
                    month={calendarMonth}
                    locale={ptBR}
                    className="rounded-md text-zinc-100"
                    modifiers={{
                      hasBill: (date) => hasBillOnDay(date),
                      positiveDay: (date) => getDayBalanceStatus(date) === "positive",
                      negativeDay: (date) => getDayBalanceStatus(date) === "negative",
                    }}
                    modifiersClassNames={{
                      hasBill: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-yellow-500",
                      positiveDay: "bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 font-black rounded-full hover:bg-emerald-500/20 transition-all",
                      negativeDay: "bg-rose-500/10 text-rose-450 border border-rose-500/25 font-black rounded-full hover:bg-rose-500/20 transition-all"
                    }}
                  />
                  
                  {/* Legenda do Mapa de Calor */}
                  <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-500 pt-2 border-t border-white/5 w-full justify-center">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30" /> Saldo Positivo</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/30" /> Saldo Negativo</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Contas a Vencer</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 animate-pulse">
                  <CalendarIcon className="w-8 h-8 opacity-20" />
                  <span className="text-xs font-bold uppercase tracking-wider opacity-50">Carregando Agenda...</span>
                </div>
              )}
            </div>

            {/* Coluna 2: Ritmo do Mês */}
            <div className="w-full lg:w-[46%] flex bg-zinc-950/50 p-4 sm:p-5 rounded-xl border border-white/5 flex-col justify-between min-h-[380px] space-y-4">
              <div className="flex justify-between items-start pb-2 border-b border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-yellow-500" /> Ritmo de Gastos do Mês
                  </h4>
                  <span className="text-[9px] text-zinc-550 block mt-0.5">Mapeamento diário de desembolsos do casal</span>
                </div>
                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[9px] font-bold">
                  Mês Corrente
                </Badge>
              </div>

              {/* Informações de Média */}
              <div className="bg-zinc-900/30 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Despesa Média Diária</span>
                  <strong className="text-sm font-black text-white">R$ {dailyAverage.toFixed(2)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Total Desembolsado</span>
                  <strong className="text-sm font-black text-rose-450 font-mono">R$ {totalExpensesValue.toFixed(2)}</strong>
                </div>
              </div>

              {/* Gráfico de Barras em SVG/CSS */}
              <div className="flex items-end justify-between gap-1 w-full h-44 bg-zinc-950/40 border border-white/5 rounded-xl p-3 shadow-inner relative overflow-hidden">
                {Array.from({ length: totalDays }, (_, i) => {
                  const day = i + 1;
                  const dayExpense = dailyExpenseTotals[i] || 0;
                  const heightPct = maxDayExpense > 0 ? (dayExpense / maxDayExpense) * 100 : 0;

                  return (
                    <div 
                      key={day}
                      onClick={() => {
                        const baseDate = selectedDate || new Date();
                        const newDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), day);
                        onDayClick(newDate);
                      }}
                      className="group relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 bg-zinc-900 border border-white/10 rounded-lg p-2 text-[9px] text-zinc-100 font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap shadow-xl">
                        Dia {day}: R$ {dayExpense.toFixed(2)}
                      </div>

                      {/* Barra */}
                      <div 
                        style={{ height: `${Math.max(4, heightPct)}%` }} 
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          dayExpense > 0 
                            ? "bg-gradient-to-t from-yellow-500 to-amber-600 group-hover:from-yellow-400 group-hover:to-amber-500 shadow-[0_0_10px_rgba(234,179,8,0.15)]" 
                            : "bg-zinc-800/10 group-hover:bg-zinc-800/30"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              <p className="text-[8px] text-zinc-550 text-center leading-relaxed">
                💡 Dica: Passem o cursor sobre as barras para ver o gasto diário ou cliquem na barra para abrir os detalhes daquele dia.
              </p>
            </div>

          </div>
        </div>
      </TiltCard>

      {/* MODAL DETALHADO DO DIA SELECIONADO */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-zinc-100 w-[95vw] md:w-[75vw] sm:max-w-3xl md:max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          <DialogHeader className="border-b border-white/5 pb-3">
            <DialogTitle className="text-sm font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-yellow-500" />
              Detalhamento de Fluxo: {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>

          {/* Resumo Financeiro do Dia */}
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-center">
              <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-500 block mb-1">Entradas</span>
              <strong className="text-sm font-black text-emerald-400 font-mono">R$ {dayDetails.income.toFixed(2)}</strong>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 text-center">
              <span className="text-[8px] font-bold uppercase tracking-wider text-rose-500 block mb-1">Saídas</span>
              <strong className="text-sm font-black text-rose-450 font-mono">R$ {dayDetails.expense.toFixed(2)}</strong>
            </div>
            <div className={`rounded-xl p-3 text-center border ${
              dayDetails.balance >= 0 
                ? "bg-emerald-500/5 border-emerald-500/10" 
                : "bg-rose-500/5 border-rose-500/10"
            }`}>
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">Saldo Líquido</span>
              <strong className={`text-sm font-black font-mono ${dayDetails.balance >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                R$ {dayDetails.balance.toFixed(2)}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Lado Esquerdo: Contas / Compromissos a vencer */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 pb-1.5 flex justify-between items-center">
                <span>Contas a Vencer no Dia</span>
                <span className="text-[9px] font-semibold text-zinc-500">{selectedDateBills.length} itens</span>
              </h4>
              
              {selectedDateBills.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateBills.map((bill) => (
                    <div key={bill.id} className="bg-zinc-900/40 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase font-bold block">{bill.category}</span>
                        <strong className="text-xs font-bold text-zinc-200 block">{bill.title}</strong>
                        <span className="text-[9px] text-zinc-400">R$ {bill.amount.toFixed(2)}</span>
                      </div>
                      <div>
                        {bill.status === "pending" ? (
                          <div className="flex gap-1.5">
                            <Button 
                              size="sm" 
                              onClick={() => handleSyncGoogleCalendar(bill)} 
                              className="h-7 w-7 p-0 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg"
                              title="Google Agenda"
                            >
                              <CalendarPlus className="w-3.5 h-3.5 text-blue-400" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => openConfirmModal(bill)} 
                              className="h-7 w-7 p-0 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg"
                              title="Confirmar Pagamento"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            </Button>
                          </div>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase py-0.5">
                            Pago ✓
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-500 text-[10px] bg-zinc-950/20 rounded-xl border border-dashed border-white/5">
                  Nenhum vencimento fixado para esta data.
                </div>
              )}
            </div>

            {/* Lado Direito: Transações do Dia */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-white/5 pb-1.5 flex justify-between items-center">
                <span>Transações Registradas</span>
                <span className="text-[9px] font-semibold text-zinc-500">{dayDetails.transactions.length} itens</span>
              </h4>

              {dayDetails.transactions.length > 0 ? (
                <div className="space-y-2">
                  {dayDetails.transactions.map((tx: any) => (
                    <div key={tx.id} className="bg-zinc-900/40 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase font-bold block">{tx.category}</span>
                        <strong className="text-xs font-bold text-zinc-200 block">{tx.description}</strong>
                        <span className="text-[9px] text-zinc-400 font-medium">Método: {tx.paymentMethod || "Não informado"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black font-mono ${tx.type === "income" ? "text-emerald-400" : "text-rose-455"}`}>
                          {tx.type === "income" ? "+" : "-"} R$ {Number(tx.amount).toFixed(2)}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteTx(tx.id)} 
                          className="h-7 w-7 p-0 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-500 text-[10px] bg-zinc-950/20 rounded-xl border border-dashed border-white/5 flex flex-col items-center gap-1.5">
                  <span>Nenhuma transação lançada no dia.</span>
                  <Link href="/transactions" className="inline-flex items-center gap-1 text-[9px] text-yellow-500 font-extrabold hover:underline">
                    <Plus className="w-3 h-3" /> Adicionar Transação
                  </Link>
                </div>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
