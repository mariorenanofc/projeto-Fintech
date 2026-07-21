import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";

interface CreditCardLimitsCardProps {
  rawCards: any[];
  financeStatus: "red" | "yellow" | "green";
}

export function CreditCardLimitsCard({ rawCards = [], financeStatus }: CreditCardLimitsCardProps) {
  if (!rawCards || rawCards.length === 0) return null;

  return (
    <Card className="bg-zinc-900/40 border-white/5 shadow-[0_8px_30px_rgba(234,179,8,0.04)] hover:shadow-[0_8px_30px_rgba(234,179,8,0.1)] backdrop-blur-md overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:-translate-y-0.5">
      <CardHeader className="p-5 sm:p-6 pb-2 sm:pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-yellow-500" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Nossos Limites de Crédito &amp; Alertas 💳
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-4 space-y-4">
        {/* Banner de Orientação Tática por Fase Financeira */}
        {financeStatus === "red" ? (
          <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl space-y-1 text-rose-300">
            <div className="flex items-center gap-1.5 text-rose-400 font-extrabold text-[10px] uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
              <span>🚨 Alerta de Blindagem do Caixa!</span>
            </div>
            <p className="text-[10px] text-zinc-350 leading-relaxed font-semibold">
              Cuidado, casal! Como estamos no vermelho, <strong className="text-rose-300">EVITEM utilizar novos cartões de crédito</strong> para conter a bola de neve de juros rotativos. Foquem na Alocação Crítica!
            </p>
          </div>
        ) : financeStatus === "yellow" ? (
          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl space-y-1 text-amber-300">
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-[10px] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>⚠️ Uso Consciente do Crédito!</span>
            </div>
            <p className="text-[10px] text-zinc-350 leading-relaxed font-semibold">
              Atenção: Optem por compras à vista dentro do seu saldo mensal disponível ou limite responsável, protegendo o fundo de reserva de emergência do casal.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl space-y-1 text-emerald-300">
            <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>✨ Trilha Livre &amp; Estratégica!</span>
            </div>
            <p className="text-[10px] text-zinc-350 leading-relaxed font-semibold">
              Trilha livre! Para novas compras planejadas, optem por parcelamento sem juros mantendo o dinheiro rendendo no fundo de investimentos para o casal!
            </p>
          </div>
        )}

        {/* Lista de Limites por Cartão */}
        <div className="space-y-3 pt-1">
          {rawCards.map((card, idx) => {
            const cleanName = (card.name || "").replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");
            const currentInv = Number(card.current_invoice || 0);
            const limitTotal = Number(card.total_limit || 1);
            const limitUsedPercent = Math.min(100, Math.round((currentInv / limitTotal) * 100));
            const availableLimit = Math.max(0, limitTotal - currentInv);

            return (
              <div key={card.id || idx} className="bg-zinc-950/50 p-3 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-zinc-200">{cleanName}</span>
                  <span className="font-bold text-emerald-400">R$ {availableLimit.toFixed(2)} livre</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      limitUsedPercent > 80 ? "bg-rose-500" : limitUsedPercent > 50 ? "bg-yellow-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${limitUsedPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[8px] text-zinc-500 font-medium">
                  <span>Limite: R$ {limitTotal.toFixed(0)}</span>
                  <span>Fatura: R$ {currentInv.toFixed(2)} ({limitUsedPercent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
