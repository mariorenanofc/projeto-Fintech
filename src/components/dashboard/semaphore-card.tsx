"use client";

import React from "react";
import Link from "next/link";
import { TiltCard } from "@/components/ui/tilt-card";
import { ShieldAlert, Bot, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinancialStrategyResult } from "@/actions/onboarding";

interface SemaphoreCardProps {
  loadingRealData: boolean;
  financeStatus: "green" | "yellow" | "red";
  realDisposable: number;
  reservaLivreCasal: number;
  tetoDiario: number;
  strategy: FinancialStrategyResult | null;
  onOpenPrintModal?: () => void;
}

export function SemaphoreCard({
  loadingRealData,
  financeStatus,
  realDisposable,
  reservaLivreCasal,
  tetoDiario,
  strategy,
  onOpenPrintModal,
}: SemaphoreCardProps) {
  const glowColor = financeStatus === "green" 
    ? "rgba(16, 185, 129, 0.25)" 
    : financeStatus === "yellow" 
    ? "rgba(234, 179, 8, 0.25)" 
    : "rgba(244, 63, 94, 0.25)";

  const cardStyleClass = financeStatus === "green" 
    ? "border-emerald-500/30 bg-emerald-950/10" 
    : financeStatus === "yellow" 
    ? "border-yellow-500/30 bg-yellow-950/10" 
    : "border-rose-500/30 bg-rose-950/10";

  const iconStyleClass = financeStatus === "green" 
    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
    : financeStatus === "yellow" 
    ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" 
    : "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse";

  return (
    <TiltCard glowColor={glowColor} className={cardStyleClass} disableTilt={true}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${iconStyleClass}`}>
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest block opacity-80">Semáforo de Gastos</span>
          <h3 className="text-lg font-black text-white">
            {financeStatus === "green" ? "LIVRE PARA COMPRAS! ✨" : financeStatus === "yellow" ? "MODERAÇÃO ATIVA! ⚠️" : "AJUSTE DE ROTA! 🚨"}
          </h3>
        </div>
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed bg-black/40 p-3.5 rounded-xl border border-white/5 mb-4">
        {financeStatus === "green" 
          ? "Parabéns, casal! As receitas cobrem todas as contas essenciais e compromissos com folga."
          : financeStatus === "yellow"
          ? "Atenção, casal! As contas estão equilibradas no limite. Evitem novos parcelamentos dispensáveis."
          : "Cuidado, casal! Fechamos no vermelho. O Conselheiro IA traçou um plano de resgate!"}
      </p>

      <div className="grid grid-cols-2 gap-2 mt-5">
        <Link href="/chat" className="w-full">
          <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-extrabold text-xs rounded-xl h-11 shadow-[0_0_15px_rgba(234,179,8,0.25)] flex items-center justify-center gap-1.5">
            <Bot className="w-4 h-4" /> Conselheiro IA
          </Button>
        </Link>
        <Button 
          onClick={onOpenPrintModal} 
          variant="outline" 
          className="w-full border-white/10 text-white font-extrabold text-xs rounded-xl h-11 bg-zinc-900/60 hover:bg-zinc-800 flex items-center justify-center gap-1.5"
        >
          <Printer className="w-4 h-4" /> Imprimir A4
        </Button>
      </div>
    </TiltCard>
  );
}
