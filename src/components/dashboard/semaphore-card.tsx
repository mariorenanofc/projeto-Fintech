import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { FinancialStrategyResult } from "@/actions/onboarding";

interface SemaphoreCardProps {
  loadingRealData: boolean;
  financeStatus: "green" | "yellow" | "red";
  realDisposable: number;
  reservaLivreCasal: number;
  tetoDiario: number;
  strategy: FinancialStrategyResult | null;
}

export function SemaphoreCard({
  loadingRealData,
  financeStatus,
  realDisposable,
  reservaLivreCasal,
  tetoDiario,
  strategy,
}: SemaphoreCardProps) {
  return (
    <Card className="bg-zinc-900/40 border-white/5 shadow-[0_8px_30px_rgba(234,179,8,0.04)] hover:shadow-[0_8px_30px_rgba(234,179,8,0.1)] backdrop-blur-md overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:-translate-y-0.5">
      <CardHeader className="p-5 sm:p-6 pb-2 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nosso Ritmo Diário 💛</CardTitle>
          <CardDescription className="text-[10px] text-zinc-550 mt-0.5">Como estamos cuidando do nosso dinheiro hoje</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 sm:p-6 pt-3 flex flex-col items-center space-y-4">
        {loadingRealData ? (
          <div className="w-full flex flex-col items-center py-6 space-y-6 animate-pulse">
            <div className="w-28 h-28 rounded-full bg-zinc-950/40 border border-white/5" />
            <div className="w-32 h-4 bg-zinc-950/40 rounded-lg" />
            <div className="w-full h-12 bg-zinc-950/40 rounded-xl" />
            <div className="w-full flex gap-3 mt-4 pt-4 border-t border-white/5">
              <div className="flex-1 h-14 bg-zinc-950/40 rounded-xl" />
              <div className="flex-1 h-14 bg-zinc-950/40 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex flex-col items-center justify-center mt-2 mb-4 w-full">
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[60px] opacity-20 transition-all duration-700 pointer-events-none ${
                financeStatus === "green" ? "bg-emerald-500" : 
                financeStatus === "yellow" ? "bg-yellow-400" : "bg-rose-500"
              }`} />

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
              
              <span className={`text-xs font-black uppercase tracking-widest mt-6 z-10 ${
                financeStatus === "green" ? "text-emerald-400" : 
                financeStatus === "yellow" ? "text-yellow-400" : "text-rose-400"
              }`}>
                {financeStatus === "green" ? "Caminho Livre! ✨" : 
                 financeStatus === "yellow" ? "Fase de Segurança ⚠️" : "Ajuste de Rota! 🛡️"}
              </span>
            </div>

            <div className="text-center max-w-sm mt-1 px-3 min-h-[80px] flex flex-col justify-center">
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                {financeStatus === "red" && "Cuidado, casal! Estamos no vermelho. O Conselheiro IA traçou um plano de resgate para ajudar a colocar as contas em ordem e blindar nosso bolso! 🛡️"}
                {financeStatus === "yellow" && "Parabéns, casal! Nossas contas estão sob controle. O foco agora é construir nosso fundo de segurança financeira para emergências! ⚠️"}
                {financeStatus === "green" && "Sintonia perfeita, casal! Temos uma reserva financeira sólida. Caminho livre e seguro para realizar novos investimentos e prosperar! ✨"}
              </p>
            </div>
            
            {realDisposable !== 0 && (
              <div className={`w-full max-w-sm mt-2 p-3 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                realDisposable > 0 
                  ? "bg-emerald-500/10 border-emerald-500/20" 
                  : "bg-rose-500/10 border-rose-500/20"
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    realDisposable > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                  }`}>
                    {realDisposable > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[10px] uppercase font-black tracking-widest ${
                      realDisposable > 0 ? "text-emerald-500" : "text-rose-500"
                    }`}>
                      {realDisposable > 0 ? "Economia no Mês" : "Despesa Extra"}
                    </span>
                    <span className={`text-[10px] font-semibold ${
                      realDisposable > 0 ? "text-emerald-400/80" : "text-rose-400/80"
                    }`}>
                      {realDisposable > 0 ? "Poupamos mais do que o previsto!" : "Gastamos além do previsto."}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-black ${
                    realDisposable > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    R$ {Math.abs(realDisposable).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="w-full flex gap-3 mt-4 pt-3 border-t border-white/5 text-xs">
              <div className="flex-1 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Reserva Livre do Casal</span>
                <span className={`text-sm font-black mt-0.5 ${reservaLivreCasal > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  R$ {strategy?.hasStrategy ? reservaLivreCasal.toFixed(2) : "0,00"}
                </span>
              </div>
              <div className="flex-1 bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Nosso Teto Diário</span>
                <span className="text-sm font-black text-yellow-500 mt-0.5">
                  R$ {tetoDiario.toFixed(2)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
