import React from "react";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage: "yellow" | "green";
}

export function CelebrationModal({
  isOpen,
  onClose,
  stage,
}: CelebrationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-zinc-900/90 border border-yellow-500/30 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-[0_10px_50px_rgba(234,179,8,0.2)] text-center relative overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-400" />
        <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4 mt-2">
          <Trophy className="w-8 h-8 text-yellow-500 animate-bounce" />
        </div>
        
        <h3 className="text-lg font-black text-white uppercase tracking-wider">Subida de Nível! 🏆</h3>
        <p className="text-zinc-400 text-xs mt-2 leading-relaxed font-semibold">
          Parabéns, casal! O sistema detectou que vocês subiram de fase financeira! Vocês saíram do estágio anterior e agora estão na:
        </p>
        
        <div className="mt-4 p-3 rounded-2xl bg-zinc-950/50 border border-white/5 inline-flex items-center gap-2">
          <span className="text-xl">
            {stage === "green" ? "🟢" : "🟡"}
          </span>
          <span className={`text-xs font-black uppercase tracking-widest ${stage === "green" ? "text-emerald-400" : "text-yellow-500"}`}>
            {stage === "green" ? "Fase Verde de Prosperidade" : "Fase Amarela de Segurança"}
          </span>
        </div>
        
        <p className="text-[10px] text-zinc-550 mt-4 leading-relaxed font-medium">
          {stage === "green" 
            ? "Sua reserva está completa e sem dívidas tóxicas. Caminho livre para a regra 50/30/20 e novos investimentos!" 
            : "Parabéns por eliminarem as dívidas de curto prazo! Agora o foco total é construir o fundo de emergência."}
        </p>
        
        <Button 
          onClick={onClose}
          className="mt-6 w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-zinc-950 font-black h-11 rounded-xl text-xs border-none shadow-[0_4px_15px_rgba(234,179,8,0.2)] hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300"
        >
          Sensacional! 🚀
        </Button>
      </div>
    </div>
  );
}
