import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, AlertTriangle } from "lucide-react";
import { FinancialStrategyResult } from "@/actions/onboarding";

interface RecommendationsCardProps {
  strategy: FinancialStrategyResult | null;
}

export function RecommendationsCard({ strategy }: RecommendationsCardProps) {
  if (!strategy || !strategy.hasStrategy) return null;

  const percent = strategy.reservaMeta > 0 
    ? Math.round(Math.min(100, (strategy.reservaFinanceiraAtual / strategy.reservaMeta) * 100)) 
    : 0;

  const essentialsIdeal = strategy.totalIncome * 0.50;
  const lazerIdeal = strategy.totalIncome * 0.30;
  const investIdeal = strategy.totalIncome * 0.20;

  return (
    <Card className="bg-zinc-900/40 border-white/5 shadow-[0_8px_30px_rgba(234,179,8,0.04)] hover:shadow-[0_8px_30px_rgba(234,179,8,0.1)] backdrop-blur-md overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:-translate-y-0.5">
      <CardHeader className="p-5 sm:p-6 pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
          <Info className="w-4 h-4" />
          Recomendações da Nossa IA 💡
        </CardTitle>
        <CardDescription className="text-[9px] text-zinc-550 mt-0.5">
          Ideias personalizadas para apoiar a jornada de vocês
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-5 sm:p-6 pt-3 space-y-4">
        {/* Risco de Insolvência Alerta Crítico */}
        {strategy.isInsolvencyRisk && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl space-y-1.5 text-rose-400">
            <span className="text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              Risco de Insolvência Detectado!
            </span>
            <p className="text-[9px] leading-relaxed font-semibold text-zinc-355">
              A soma dos Gastos Essenciais e das Parcelas Estruturais consome mais de 100% da renda de vocês. A trava de Lazer foi suspensa (0%). É urgente revisar e cortar despesas básicas de imediato!
            </p>
          </div>
        )}

        {/* Plano de Distribuição Matemática V2 */}
        <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 space-y-2.5">
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">
            Distribuição Sugerida do Orçamento:
          </span>
          <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-semibold text-zinc-300">
            <div className="bg-zinc-950/60 p-2 rounded-lg border border-white/5">
              <span className="text-[8px] text-zinc-500 block uppercase font-bold">Essenciais</span>
              <span className="text-zinc-200 block font-black mt-1">R$ {strategy.essentialsValue.toFixed(0)}</span>
            </div>
            {strategy.estruturalDebtsValue > 0 && (
              <div className="bg-zinc-950/60 p-2 rounded-lg border border-white/5">
                <span className="text-[8px] text-zinc-500 block uppercase font-bold">Estruturais</span>
                <span className="text-zinc-200 block font-black mt-1">R$ {strategy.estruturalDebtsValue.toFixed(0)}</span>
              </div>
            )}
            <div className="bg-zinc-950/60 p-2 rounded-lg border border-white/5">
              <span className="text-[8px] text-zinc-500 block uppercase font-bold">Lazer ({strategy.financialStage === "red" ? "6%" : "12%"})</span>
              <span className="text-yellow-500 block font-black mt-1">R$ {strategy.lazerTravaValue.toFixed(0)}</span>
            </div>
            {strategy.reserveMaintenanceValue > 0 && (
              <div className="bg-zinc-950/60 p-2 rounded-lg border border-white/5">
                <span className="text-[8px] text-zinc-500 block uppercase font-bold">Reserva (7%)</span>
                <span className="text-emerald-400 block font-black mt-1">R$ {strategy.reserveMaintenanceValue.toFixed(0)}</span>
              </div>
            )}
            <div className="bg-zinc-950/60 p-2 rounded-lg border border-yellow-500/20 col-span-2">
              <span className="text-[8px] text-yellow-500 block uppercase font-bold">
                {strategy.financialStage === "red" ? "Foco: Quitar Dívidas" : strategy.financialStage === "yellow" ? "Foco: Reserva" : "Foco: Investir"}
              </span>
              <span className="text-yellow-400 block font-black mt-1">R$ {strategy.focusValue.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {strategy.financialStage === "red" && (
          <div className="space-y-3">
            <span className="text-[9px] text-rose-400 uppercase tracking-widest font-black block">Plano de Resgate (Fase Vermelha):</span>
            
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
        )}

        {strategy.financialStage === "yellow" && (
          <div className="space-y-4">
            <div className="bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-xl">
              <span className="text-[9px] text-yellow-400 uppercase tracking-widest font-black block mb-2">Fase de Segurança (Fundo de Reserva):</span>
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] text-zinc-300 font-bold">Progresso da Reserva</span>
                <span className="text-[11px] text-yellow-400 font-black">{percent}%</span>
              </div>
              <div className="w-full bg-zinc-950 border border-white/5 h-2 rounded-full overflow-hidden mb-3">
                <div 
                  className="bg-yellow-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-[10px] text-zinc-400 pt-1">
                <div>
                  <span className="text-zinc-550 block text-[8px] uppercase font-bold">Reserva Atual</span>
                  <span className="font-bold text-zinc-200">R$ {strategy.reservaFinanceiraAtual.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block text-[8px] uppercase font-bold">Meta (3x Essenciais)</span>
                  <span className="font-bold text-yellow-400">R$ {strategy.reservaMeta.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-405 leading-relaxed font-semibold text-center italic bg-zinc-950/20 p-3 rounded-lg border border-white/5">
              💡 Dica: Direcionem as sobras mensais para atingir a meta da reserva e liberar a trilha verde de investimentos!
            </p>
          </div>
        )}

        {strategy.financialStage === "green" && (
          <div className="space-y-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl space-y-3">
              <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-black block">Fase de Prosperidade (Alocação 50/30/20):</span>
              
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-white/5 text-center">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-wider block font-bold">Essenciais (50%)</span>
                  <span className="text-[10px] text-zinc-300 font-bold block mt-1">R$ {essentialsIdeal.toFixed(0)}</span>
                  <span className="text-[8px] text-zinc-550 block mt-0.5">Atual: R$ {strategy.totalEssentialExpenses.toFixed(0)}</span>
                </div>
                <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-white/5 text-center">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-wider block font-bold">Desejos (30%)</span>
                  <span className="text-[10px] text-yellow-500 font-bold block mt-1">R$ {lazerIdeal.toFixed(0)}</span>
                </div>
                <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-white/5 text-center">
                  <span className="text-[8px] text-zinc-500 uppercase tracking-wider block font-bold">Investir (20%)</span>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">R$ {investIdeal.toFixed(0)}</span>
                  <span className="text-[8px] text-zinc-555 block mt-0.5">Total: R$ {strategy.investimentosTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-zinc-405 leading-relaxed font-semibold text-center italic bg-zinc-950/20 p-3 rounded-lg border border-white/5">
              💡 Dica: Vocês têm o Caminho Livre! Foquem em diversificar investimentos e realizar sonhos de longo prazo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
