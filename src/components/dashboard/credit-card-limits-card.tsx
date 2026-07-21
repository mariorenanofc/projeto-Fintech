import React from "react";
import { motion } from "framer-motion";
import { TiltCard } from "@/components/ui/tilt-card";
import { CreditCard } from "lucide-react";

interface CreditCardLimitsCardProps {
  rawCards: any[];
  financeStatus: "red" | "yellow" | "green";
}

export function CreditCardLimitsCard({ rawCards = [] }: CreditCardLimitsCardProps) {
  if (!rawCards || rawCards.length === 0) return null;

  return (
    <TiltCard className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-yellow-500" /> Limites de Crédito Reais
        </h3>
        <span className="text-[10px] text-zinc-400 font-semibold">{rawCards.length} Cartões</span>
      </div>

      <div className="space-y-3.5 pt-1">
        {rawCards.map((card, idx) => {
          const cleanName = (card.name || "").replace(/\s*\[close:\d+\]/, "").replace(/\s*\[due:\d+\]/, "");
          const currentInv = Number(card.current_invoice || card.currentInvoice || 0);
          const limitTotal = Number(card.total_limit || card.totalLimit || 1);
          const limitUsedPercent = limitTotal > 0 ? Math.min(100, Math.round((currentInv / limitTotal) * 100)) : 0;
          const availableLimit = Math.max(0, limitTotal - currentInv);

          return (
            <div key={card.id || idx} className="space-y-1.5">
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
    </TiltCard>
  );
}
