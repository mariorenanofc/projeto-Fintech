"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { TiltCard } from "@/components/ui/tilt-card";
import { CreditCard, CalendarDays } from "lucide-react";
import { FinancialStrategyResult } from "@/actions/onboarding";

interface CreditCardLimitsCardProps {
  rawCards: any[];
  financeStatus: "red" | "yellow" | "green";
  strategy?: FinancialStrategyResult | null;
}

export function CreditCardLimitsCard({ rawCards = [], strategy = null }: CreditCardLimitsCardProps) {
  const [activeTab, setActiveTab] = useState<"limites" | "datas" | "tatico">("limites");

  if (!rawCards || rawCards.length === 0) return null;

  return (
    <TiltCard className="space-y-4" disableTilt={true}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-yellow-500" /> Limites de Crédito Reais
        </h3>
        <span className="text-[10px] text-zinc-400 font-semibold">{rawCards.length} Cartões</span>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 pb-2 mb-2 gap-3 text-[10px] uppercase font-black tracking-wider text-zinc-500">
        <button 
          onClick={() => setActiveTab("limites")}
          className={`pb-1 border-b-2 transition-all duration-200 ${
            activeTab === "limites" ? "text-yellow-500 border-yellow-500 font-black" : "border-transparent hover:text-zinc-300"
          }`}
        >
          Limites
        </button>
        <button 
          onClick={() => setActiveTab("datas")}
          className={`pb-1 border-b-2 transition-all duration-200 ${
            activeTab === "datas" ? "text-yellow-500 border-yellow-500 font-black" : "border-transparent hover:text-zinc-350"
          }`}
        >
          Faturas e Datas
        </button>
        {strategy && strategy.cardActions && strategy.cardActions.length > 0 && (
          <button 
            onClick={() => setActiveTab("tatico")}
            className={`pb-1 border-b-2 transition-all duration-200 ${
              activeTab === "tatico" ? "text-yellow-500 border-yellow-500 font-black" : "border-transparent hover:text-zinc-350"
            }`}
          >
            Ações Táticas
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="space-y-3.5 pt-1">
        {activeTab === "limites" && (
          <div className="space-y-3.5">
            {rawCards.map((card, idx) => {
              const cleanName = (card.name || "").replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");
              const currentInv = Number(card.current_invoice || card.currentInvoice || 0);
              const limitTotal = Number(card.total_limit || card.totalLimit || 1);
              const limitUsedPercent = limitTotal > 0 ? Math.min(100, Math.round((currentInv / limitTotal) * 100)) : 0;
              const availableLimit = Math.max(0, limitTotal - currentInv);

              return (
                <div key={card.id || idx} className="space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-200">{cleanName}</span>
                    <span className="text-emerald-400">R$ {availableLimit.toFixed(2)} livre</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-950 border border-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      whileInView={{ width: `${limitUsedPercent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-zinc-400">
                    <span>Uso: {limitUsedPercent}%</span>
                    <span>Limite Total: R$ {limitTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "datas" && (
          <div className="space-y-3 animate-fade-in">
            {rawCards.map((card, idx) => {
              const cleanName = (card.name || "").replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");
              const currentInv = Number(card.current_invoice || card.currentInvoice || 0);
              const nextInv = Number(card.next_invoice || card.nextInvoice || 0);
              const closingDay = card.closingDay || card.closing_day || 5;
              const dueDay = card.dueDay || card.due_day || 15;

              const today = new Date();
              const currentDay = today.getDate();
              const isClosed = currentDay >= closingDay;

              return (
                <div key={card.id || idx} className="bg-zinc-900/30 border border-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold border-b border-white/5 pb-1.5">
                    <span className="text-zinc-200">{cleanName}</span>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black border ${
                      isClosed 
                        ? "bg-rose-500/10 text-rose-450 border-rose-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {isClosed ? "🔒 Fechada" : "🔓 Aberta"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Fechamento: <strong className="text-zinc-200 font-bold">Dia {closingDay}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Vencimento: <strong className="text-zinc-200 font-bold">Dia {dueDay}</strong></span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-medium pt-1">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-500">Fatura Atual</span>
                      <strong className="text-yellow-500 font-bold">R$ {currentInv.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-zinc-500">Próxima Fatura (Est.)</span>
                      <strong className="text-zinc-300 font-bold">R$ {nextInv.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "tatico" && strategy && (
          <div className="space-y-3 animate-fade-in">
            {strategy.cardActions.map((action, idx) => {
              const cleanName = (action.cardName || "").replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");
              return (
                <div key={idx} className="bg-zinc-900/30 border border-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold border-b border-white/5 pb-1.5">
                    <span className="text-zinc-200">{cleanName}</span>
                    <span className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-black border ${
                      action.requiresNegotiation 
                        ? "bg-rose-500/10 text-rose-450 border-rose-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {action.requiresNegotiation ? "⚠️ Requer Ajuste" : "✅ Sob Controle"}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-300 leading-relaxed font-normal">
                    {action.recommendation}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-400 font-medium pt-1 border-t border-white/5">
                    <div>
                      <span>Total Fatura: </span>
                      <strong className="text-zinc-300 font-bold">R$ {action.currentInvoice.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>Pagamento Recomendado: </span>
                      <strong className="text-yellow-500 font-bold">R$ {action.suggestedProportionalPayment.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TiltCard>
  );
}
