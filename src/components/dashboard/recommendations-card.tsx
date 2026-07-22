import React from "react";
import { TiltCard } from "@/components/ui/tilt-card";
import { Button } from "@/components/ui/button";
import { Info, AlertTriangle, Calculator, ShieldCheck, Zap } from "lucide-react";
import { FinancialStrategyResult } from "@/actions/onboarding";

interface RecommendationsCardProps {
  strategy: FinancialStrategyResult | null;
  rawCards?: any[];
  rawDebts?: any[];
  onOpenNegotiationModal?: (item: { id: string; title: string; amount: number; type: "card" | "debt"; rawItem?: any }) => void;
}

export function RecommendationsCard({ strategy, rawCards = [], rawDebts = [], onOpenNegotiationModal }: RecommendationsCardProps) {
  if (!strategy || !strategy.hasStrategy) return null;

  const percent = strategy.reservaMeta > 0 
    ? Math.round(Math.min(100, (strategy.reservaFinanceiraAtual / strategy.reservaMeta) * 100)) 
    : 0;

  const essentialsIdeal = strategy.totalIncome * 0.50;
  const lazerIdeal = strategy.totalIncome * 0.30;
  const investIdeal = strategy.totalIncome * 0.20;

  const criticalCards = strategy.financialStage === "red"
    ? strategy.cardActions.filter(c => !c.requiresNegotiation && c.suggestedProportionalPayment >= c.currentInvoice && c.currentInvoice > 0)
    : [];

  const negotiationCards = strategy.financialStage === "red"
    ? strategy.cardActions.filter(c => c.requiresNegotiation || c.suggestedProportionalPayment < c.currentInvoice || c.recommendation.toLowerCase().includes("parcelar") || c.recommendation.toLowerCase().includes("renegociar") || c.recommendation.toLowerCase().includes("indisponível"))
    : [];

  return (
    <TiltCard glowColor="rgba(234, 179, 8, 0.15)" className="space-y-6" disableTilt={true}>
      {/* Header do Card com Ícone e Subtítulo */}
      <div className="flex flex-col border-b border-white/5 pb-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-yellow-500 flex items-center gap-2">
          <Info className="w-4.5 h-4.5" />
          Engenharia Financeira &amp; IA 💡
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Ideias personalizadas e simulações para resgatar a saúde financeira do casal
        </p>
      </div>
      
      <div className="space-y-6">
        {/* LINHA 1: Distribuição do Orçamento + Alocação Crítica (50% / 50% lado a lado em telas grandes) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* CARD 1: Distribuição Sugerida do Orçamento */}
          <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-4 flex flex-col justify-between h-full">
            <div>
              <span className="text-xs text-zinc-300 uppercase tracking-widest font-black block mb-3">
                📊 Distribuição Sugerida do Orçamento:
              </span>

              {/* Risco de Insolvência Alerta Crítico */}
              {strategy.isInsolvencyRisk && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl space-y-1.5 text-rose-400 mb-3">
                  <span className="text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                    Risco de Insolvência Detectado!
                  </span>
                  <p className="text-[10px] leading-relaxed font-semibold text-zinc-300">
                    A soma dos Gastos Essenciais e das Parcelas Estruturais consome mais de 100% da renda. A trava de Lazer foi suspensa (0%).
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 text-center text-xs font-semibold text-zinc-300">
                <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5">
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Essenciais</span>
                  <span className="text-zinc-200 block font-black mt-1 text-sm">R$ {strategy.essentialsValue.toFixed(0)}</span>
                </div>
                {strategy.estruturalDebtsValue > 0 && (
                  <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold">Estruturais</span>
                    <span className="text-zinc-200 block font-black mt-1 text-sm">R$ {strategy.estruturalDebtsValue.toFixed(0)}</span>
                  </div>
                )}
                <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5">
                  <span className="text-[9px] text-zinc-500 block uppercase font-bold">Lazer ({strategy.financialStage === "red" ? "6%" : "12%"})</span>
                  <span className="text-yellow-500 block font-black mt-1 text-sm">R$ {strategy.lazerTravaValue.toFixed(0)}</span>
                </div>
                {strategy.reserveMaintenanceValue > 0 && (
                  <div className="bg-zinc-950/60 p-3 rounded-lg border border-white/5">
                    <span className="text-[9px] text-zinc-500 block uppercase font-bold">Reserva (7%)</span>
                    <span className="text-emerald-400 block font-black mt-1 text-sm">R$ {strategy.reserveMaintenanceValue.toFixed(0)}</span>
                  </div>
                )}
                <div className="bg-zinc-950/60 p-3 rounded-lg border border-yellow-500/20 col-span-2">
                  <span className="text-[9px] text-yellow-500 block uppercase font-bold">
                    {strategy.financialStage === "red" ? "Foco: Quitar Dívidas" : strategy.financialStage === "yellow" ? "Foco: Reserva" : "Foco: Investir"}
                  </span>
                  <span className="text-yellow-400 block font-black mt-1 text-base">R$ {strategy.focusValue.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium pt-2 border-t border-white/5">
              Metodologia conjugal baseada no teto tático de resgate e proteção de caixa.
            </p>
          </div>

          {/* CARD 2: Alocação Crítica (Pagar Integralmente) */}
          <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-zinc-200 uppercase tracking-wider font-black flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  🛡️ Alocação Crítica (Pagar Integralmente)
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">
                Contas prioritárias que devem ser pagas integralmente assim que o salário for recebido:
              </p>

              <div className="space-y-2.5">
                {strategy.debtActions.map((act, i) => {
                  const cleanDebtTitle = act.debtTitle.replace(/\s*\[due:\d+\]/, "").replace(/\s*\[next:[^\]]+\]/, "");
                  return (
                    <div key={`debt-${i}`} className="bg-zinc-900/60 p-3 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-zinc-200 font-bold block">{cleanDebtTitle}</span>
                        <span className="text-[10px] text-zinc-400 font-semibold">{act.recommendation}</span>
                      </div>
                      <span className="text-rose-400 font-black whitespace-nowrap ml-2 text-sm">R$ {act.installmentValue.toFixed(2)}</span>
                    </div>
                  );
                })}

                {criticalCards.map((act, i) => {
                  const cleanCardName = act.cardName.replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");
                  return (
                    <div key={`card-crit-${i}`} className="bg-zinc-900/60 p-3 rounded-lg border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-zinc-200 font-bold block">{cleanCardName}</span>
                        <span className="text-[10px] text-zinc-400 font-semibold">Pagamento integral da fatura atual.</span>
                      </div>
                      <span className="text-rose-400 font-black whitespace-nowrap ml-2 text-sm">R$ {act.currentInvoice.toFixed(2)}</span>
                    </div>
                  );
                })}

                {strategy.debtActions.length === 0 && criticalCards.length === 0 && (
                  <p className="text-xs text-emerald-400 font-bold text-center py-4 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                    Nenhuma dívida prioritária com juros abusivos em atraso! 🎉
                  </p>
                )}
              </div>
            </div>

            {strategy.financialStage === "yellow" && (
              <div className="bg-yellow-500/5 border border-yellow-500/10 p-3.5 rounded-xl space-y-2">
                <span className="text-[9px] text-yellow-400 uppercase tracking-widest font-black block">Progresso da Reserva: {percent}%</span>
                <div className="w-full bg-zinc-950 border border-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-yellow-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* LINHA 2: Renegociações Bancárias (Ocupando 100% da largura da tela) */}
        {negotiationCards.length > 0 && (
          <div className="w-full bg-zinc-950/40 p-5 rounded-xl border border-yellow-500/20 space-y-4">
            <div>
              <span className="text-xs text-yellow-400 uppercase tracking-wider font-black flex items-center gap-1.5 mb-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                ⚡ Engenharia Financeira (Renegociações Bancárias)
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Faturas que ultrapassam o caixa disponível. Simule o parcelamento usando a taxa mínima do seu banco (Lei 14.690/23):
              </p>
            </div>

            {/* Grade Responsiva dos Cartões de Crédito (Lado a Lado em blocos empilhados) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {negotiationCards.map((act, i) => {
                const cleanCardName = act.cardName.replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");
                const rawCard = rawCards.find(c => (c.name || "").includes(cleanCardName) || (c.name || "").includes(act.cardName));

                return (
                  <div key={`card-neg-${i}`} className="bg-yellow-500/5 border border-yellow-500/15 p-4 rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-white font-extrabold">{cleanCardName}</span>
                        <span className="text-yellow-400 font-black">R$ {act.currentInvoice.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">{act.recommendation}</p>
                    </div>

                    {onOpenNegotiationModal && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onOpenNegotiationModal({
                          id: rawCard?.id || `card-${i}`,
                          title: cleanCardName,
                          amount: act.currentInvoice,
                          type: "card",
                          rawItem: rawCard
                        })}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black text-xs h-9 rounded-lg flex items-center justify-center gap-1.5 shadow-md mt-2"
                      >
                        <Calculator className="w-3.5 h-3.5" /> Simular Renegociação ⚡
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </TiltCard>
  );
}
