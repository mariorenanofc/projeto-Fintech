import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Info, ShieldCheck, RefreshCcw, Target, CheckCircle2, Sparkles, ArrowRight, Zap } from "lucide-react";
import { AudioExplainerButton } from "@/components/ui/audio-explainer";
import { FinancialStrategyResult, GoalInput } from "@/actions/onboarding";
import { TiltCard } from "@/components/ui/tilt-card";

interface FlowSummaryProps {
  loadingRealData: boolean;
  strategy: FinancialStrategyResult | null;
  realIncome: number;
  realEssentials: number;
  realCommitments: number;
  realDisposable: number;
  prevIncome: number;
  prevEssentials: number;
  prevCommitments: number;
  prevDisposable: number;
  financeStatus: "green" | "yellow" | "red";
  rawCards: any[];
  rawDebts: any[];
  selectedMonthStr: string;
  getReadableMonthLabel: (monthStr: string) => string;
  goals: GoalInput[];
  onOpenNegotiationModal?: (item: { id: string; title: string; amount: number; type: "card" | "debt"; rawItem?: any }) => void;
}

export function FlowSummary({
  loadingRealData,
  strategy,
  realIncome,
  realEssentials,
  realCommitments,
  realDisposable,
  prevIncome,
  prevEssentials,
  prevCommitments,
  prevDisposable,
  financeStatus,
  rawCards,
  rawDebts,
  selectedMonthStr,
  getReadableMonthLabel,
  goals,
  onOpenNegotiationModal,
}: FlowSummaryProps) {
  
  const getNextMonthStr = (monthStr: string): string => {
    const [year, month] = monthStr.split("-").map(Number);
    if (month === 12) return `${year + 1}-01`;
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  };

  const nextMonthStr = getNextMonthStr(selectedMonthStr);

  const getNextMonthForecast = () => {
    if (!strategy) return { nextCommitments: 0, nextResidue: 0, difference: 0 };
    
    let nextCommitments = strategy.totalEssentialExpenses;
    
    rawDebts.forEach((debt) => {
      if (debt.installments_schedule && Array.isArray(debt.installments_schedule)) {
        const item = debt.installments_schedule.find((s: any) => s.month === nextMonthStr);
        if (item) nextCommitments += Number(item.amount);
      } else {
        nextCommitments += Number(debt.current_installment_value || 0);
      }
    });
    
    rawCards.forEach((card) => {
      let invVal = Number(card.next_invoice || 0);
      if (card.invoices_schedule && Array.isArray(card.invoices_schedule)) {
        const item = card.invoices_schedule.find((s: any) => s.month === nextMonthStr);
        if (item) invVal = Number(item.amount);
      }
      nextCommitments += invVal;
    });

    const nextResidue = strategy.totalIncome - nextCommitments;
    const currentCommitments = strategy.totalEssentialExpenses + strategy.totalDebtInstallments + strategy.totalCreditCardInvoices;
    const difference = currentCommitments - nextCommitments;
    
    return {
      nextCommitments,
      nextResidue,
      difference
    };
  };

  const forecast = getNextMonthForecast();
  const totalCommitment = strategy
    ? strategy.totalEssentialExpenses + strategy.totalDebtInstallments + strategy.totalCreditCardInvoices
    : 0;

  return (
    <TiltCard glowColor="rgba(234, 179, 8, 0.15)" className="relative overflow-hidden space-y-6 flex-grow flex flex-col h-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div>
          <span className="text-[10px] text-yellow-500 font-extrabold uppercase tracking-widest block">Painel Estratégico</span>
          <h3 className="text-xl font-black text-white flex items-center gap-2">Nosso Fluxo &amp; Sonhos ✨</h3>
        </div>
        <Button size="sm" className="bg-zinc-900 border border-white/10 text-xs text-yellow-400 font-bold rounded-xl hover:bg-zinc-800">
          <Zap className="w-3.5 h-3.5 mr-1" /> Dados do Banco
        </Button>
      </div>
      
      <div className="pt-2 space-y-8 flex-grow flex flex-col justify-between">
        {loadingRealData || !strategy ? (
          <div className="space-y-4 animate-pulse py-4 w-full">
            <div className="w-full h-12 bg-zinc-950/40 rounded-xl" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[110px] bg-zinc-950/40 rounded-2xl" />
              ))}
            </div>
            <div className="w-full h-24 bg-zinc-950/40 rounded-2xl" />
          </div>
        ) : strategy.hasStrategy ? (
          <>
            {/* Banner de CTA para a Previsão Futura do Casal (Posicionado dentro do Painel Estratégico) */}
            <div className="w-full">
              <Link href="/dashboard/previsao" className="block w-full group">
                <div className="w-full bg-gradient-to-r from-yellow-500/10 via-amber-500/15 to-yellow-500/10 hover:from-yellow-500/20 hover:to-amber-500/25 border border-yellow-500/30 hover:border-yellow-400/60 rounded-2xl p-4 transition-all duration-300 shadow-[0_4px_20px_rgba(234,179,8,0.1)] hover:shadow-[0_0_25px_rgba(234,179,8,0.25)] flex items-center justify-between gap-3 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shrink-0 shadow-[0_0_12px_rgba(234,179,8,0.3)]">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase tracking-wider">Previsão Futura do Casal 🔮</span>
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

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {/* Receitas */}
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-[10px] text-zinc-550 uppercase font-black tracking-wider block">Receitas</span>
                  <span className="text-base font-black text-emerald-400 mt-1.5 block">
                    R$ {realIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col gap-1 text-[11px] text-zinc-405">
                  <div className="flex justify-between">
                    <span>Previsto:</span>
                    <span className="font-bold text-zinc-300">R$ {prevIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Falta:</span>
                    <span className="font-semibold text-zinc-400">R$ {Math.max(0, prevIncome - realIncome).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Essenciais */}
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-[10px] text-zinc-555 uppercase font-black tracking-wider block">Essenciais</span>
                  <span className="text-base font-black text-zinc-200 mt-1.5 block">
                    R$ {realEssentials.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col gap-1 text-[11px] text-zinc-405">
                  <div className="flex justify-between">
                    <span>Limite:</span>
                    <span className="font-bold text-zinc-300">R$ {prevEssentials.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Disp.:</span>
                    <span className="font-semibold text-emerald-400">R$ {Math.max(0, prevEssentials - realEssentials).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Compromissos */}
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-[10px] text-zinc-550 uppercase font-black tracking-wider block">Compromissos</span>
                  <span className="text-base font-black text-rose-400 mt-1.5 block">
                    R$ {realCommitments.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col gap-1 text-[11px] text-zinc-405">
                  <div className="flex justify-between">
                    <span>Previsão:</span>
                    <span className="font-bold text-zinc-300">R$ {prevCommitments.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Falta:</span>
                    <span className="font-semibold text-rose-400">R$ {Math.max(0, prevCommitments - realCommitments).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Saldo Disponível */}
              <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-[10px] text-zinc-550 uppercase font-black tracking-wider block">Saldo Disponível</span>
                  <span className={`text-base font-black mt-1.5 block ${realDisposable >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    R$ {realDisposable.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col gap-1 text-[11px] text-zinc-405">
                  <div className="flex justify-between">
                    <span>Previsto:</span>
                    <span className="font-bold text-zinc-300">R$ {prevDisposable.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Dif.:</span>
                    <span className={`font-semibold ${realDisposable >= prevDisposable ? 'text-emerald-400' : 'text-rose-500'}`}>
                      R$ {(realDisposable - prevDisposable).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Descrição resumida da situação / Diagnóstico */}
            <div className="bg-zinc-950/40 p-5 rounded-2xl border border-white/5 flex gap-3.5 items-start w-full">
              <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-3 flex-grow w-full">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-200 font-extrabold uppercase tracking-wider block">Diagnóstico do Período</span>
                  <AudioExplainerButton 
                    text={(() => {
                      const fund = realDisposable * 0.30;
                      const inv = (realDisposable - fund) * 0.20;
                      const remaining = realDisposable - fund - inv;
                      if (financeStatus === "red") {
                        return `Veja só, casal. Atualmente identificamos que estamos na Fase Vermelha de Resgate. Nossa receita familiar é de ${strategy.totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} e os gastos essenciais chegam a ${strategy.totalEssentialExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Sobrou um saldo de R$ ${realDisposable.toFixed(0)} para cobrir cartões e parcelamentos. Por estarmos com dívidas sob pressão ou com saldo negativo, o conselheiro acionou o plano de resgate para priorizar os pagamentos essenciais da Alocação Crítica.`;
                      } else if (financeStatus === "yellow") {
                        return `Parabéns, casal! Estamos na Fase Amarela de Segurança. As contas estão equilibradas e sob controle, sem dívidas em atraso. Com o saldo disponível de ${realDisposable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, nossa sugestão é destiar trinta por cento, equivalente a ${fund.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, para o nosso Fundo de Reserva de Emergência, e vinte por cento do restante, equivalente a ${inv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, para novos investimentos. Isso nos assegura uma reserva livre de ${remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para aproveitarmos com tranquilidade no dia a dia.`;
                      } else {
                        return `Sintonia nota dez! Vocês alcançaram a Fase Verde de Prosperidade. Nosso fundo de segurança está completo e sem dívidas pendentes. Do saldo disponível de ${realDisposable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, recomendamos seguir a regra cinquenta, trinta, vinte: direcionar trinta por cento, equivalente a ${fund.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, para poupança, vinte por cento do restante, equivalente a ${inv.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, em investimentos para fazer o dinheiro trabalhar por nós, restando uma reserva livre de ${remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para gastarmos como bem entendermos e realizarmos nossos sonhos sem peso na consciência!`;
                      }
                    })()} 
                  />
                </div>
                <div className="text-[11px] text-zinc-355 leading-relaxed font-semibold w-full">
                  {financeStatus === "red" ? (
                    <p className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-xl text-rose-400 mt-1 leading-relaxed w-full">
                      Atenção, casal! Estamos na Fase Vermelha de Resgate. Nosso caixa livre está pressionado pelas faturas e parcelas. Sigam o plano abaixo para priorizar a Alocação Crítica e reorganizar as contas! 🛡️
                    </p>
                  ) : (() => {
                    const fund = realDisposable * 0.30;
                    const inv = (realDisposable - fund) * 0.20;
                    const remaining = realDisposable - fund - inv;
                    return (
                      <div className="space-y-4 mt-1 w-full">
                        <p className="text-zinc-300">
                          {financeStatus === "green" 
                            ? `Sintonia nota 10! Vocês estão na Fase Verde de Prosperidade. Com o saldo disponível de R$ ${realDisposable.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} livres, podemos fazer nosso dinheiro render:` 
                            : `Sintonia nota 10! Vocês estão na Fase Amarela de Segurança. Com o saldo disponível de R$ ${realDisposable.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} livres, sugerimos focar em construir a nossa reserva:`
                          }
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-2">
                          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex flex-col justify-center h-20 hover:border-yellow-500/20 transition-all duration-300">
                            <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider block">Fundo Reserva (30%)</span>
                            <span className="text-sm font-black text-yellow-500 mt-1.5 block">
                              R$ {fund.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex flex-col justify-center h-20 hover:border-yellow-500/20 transition-all duration-300">
                            <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider block">Investimento (20% do rest.)</span>
                            <span className="text-sm font-black text-yellow-400 mt-1.5 block">
                              R$ {inv.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="bg-zinc-900/60 p-4 rounded-xl border border-yellow-500/10 flex flex-col justify-center h-20 hover:border-yellow-500/20 transition-all duration-300">
                            <span className="text-[9px] text-yellow-500/60 font-bold uppercase tracking-wider block">Reserva Livre Real</span>
                            <span className="text-sm font-black text-emerald-400 mt-1.5 block">
                              R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Painel de Metas & Sonhos (Aparece apenas quando não está na Fase Vermelha/Resgate) */}
            {financeStatus !== "red" && (
              <div className="border-t border-white/5 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Nossas Metas &amp; Sonhos do Casal</span>
                  </span>
                  <Link
                    href="/profile"
                    className="text-[9px] text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-wider transition-colors"
                  >
                    {goals.length === 0 ? "+ Adicionar" : "Gerenciar"}
                  </Link>
                </div>

                {goals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <Target className="w-8 h-8 text-zinc-700" />
                    <p className="text-xs text-zinc-600 font-semibold">Nenhuma meta cadastrada ainda.</p>
                    <Link
                      href="/profile"
                      className="text-[10px] text-yellow-500 hover:text-yellow-400 font-black underline underline-offset-2 transition-colors"
                    >
                      Cadastre o primeiro sonho do casal →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    {goals.map((goal, idx) => {
                      const pct = goal.targetAmount > 0
                        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                        : 0;
                      const done = pct >= 100;
                      return (
                        <div
                          key={goal.id || idx}
                          className="bg-zinc-950/60 p-3.5 rounded-xl border border-white/5 space-y-2 hover:border-yellow-500/20 transition-all duration-300"
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[10px] text-zinc-200 font-bold leading-tight">{goal.title}</span>
                            {done
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              : <span className="text-[9px] text-yellow-500 font-black flex-shrink-0">{pct}%</span>
                            }
                          </div>
                          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]" : "bg-yellow-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] text-zinc-500 font-medium">
                            <span>R$ {goal.currentAmount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</span>
                            <span>{done ? "Conquistada! ✨" : `de R$ ${goal.targetAmount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {goals.length > 0 && (
                  <p className="text-[9px] text-zinc-500 leading-relaxed font-semibold italic text-center">
                    💡 Cada conquista orçamentária aproxima vocês desses sonhos!
                  </p>
                )}

              </div>
            )}

            {/* Previsão do Mês que Vem (Próximo Mês) */}
            <div className="border-t border-white/5 pt-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Como será nosso próximo mês ({getReadableMonthLabel(getNextMonthStr(selectedMonthStr))})?</span>
                <Badge 
                  className={`font-black text-[10px] uppercase tracking-wider border-none px-3 py-1 ${
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

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[10px] text-zinc-550 font-bold uppercase">Contas já Programadas</span>
                  <span className="text-sm font-black text-zinc-300 mt-1">R$ {forecast.nextCommitments.toFixed(2)}</span>
                </div>
                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[90px]">
                  <span className="text-[10px] text-zinc-550 font-bold uppercase">Nossa Estimativa de Caixa</span>
                  <span className={`text-sm font-black mt-1 ${forecast.nextResidue >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    R$ {forecast.nextResidue.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-405 leading-relaxed font-semibold text-center italic mt-1 bg-zinc-950/20 p-3.5 rounded-xl border border-white/5">
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
      </div>
    </TiltCard>
  );
}
