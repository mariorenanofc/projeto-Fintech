"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioExplainerButton({ text, className }: { text: string; className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Efeito Glow dinâmico no painel pai
  useEffect(() => {
    if (buttonRef.current) {
      const container = buttonRef.current.closest(".rounded-xl") || buttonRef.current.parentElement;
      if (container) {
        if (isPlaying) {
          container.classList.add("ring-1", "ring-yellow-500", "bg-yellow-500/5", "shadow-[0_0_15px_rgba(234,179,8,0.15)]");
          container.classList.add("transition-all", "duration-700");
        } else {
          container.classList.remove("ring-1", "ring-yellow-500", "bg-yellow-500/5", "shadow-[0_0_15px_rgba(234,179,8,0.15)]");
        }
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  const handleTogglePlay = () => {
    if (!speechSynthesis) return;

    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      speechSynthesis.cancel(); // Parar qualquer fala anterior
      
      const newUtterance = new SpeechSynthesisUtterance(text);
      newUtterance.lang = "pt-BR";
      
      const savedRate = localStorage.getItem("preferredVoiceRate");
      newUtterance.rate = savedRate ? parseFloat(savedRate) : 1.0;
      
      const voices = speechSynthesis.getVoices();
      const preferredURI = localStorage.getItem('preferredVoiceURI');
      let selectedVoice = null;

      if (preferredURI) {
        selectedVoice = voices.find(v => v.voiceURI === preferredURI) || null;
      }
      
      if (!selectedVoice) {
        // Fallback: Tentar encontrar uma voz em PT-BR
        const ptBrVoices = voices.filter(v => v.lang.startsWith("pt-"));
        if (ptBrVoices.length > 0) {
          selectedVoice = ptBrVoices.find(v => v.name.includes("Google") || v.name.includes("Microsoft Maria")) || ptBrVoices[0];
        }
      }

      if (selectedVoice) {
        newUtterance.voice = selectedVoice;
      }

      newUtterance.onend = () => {
        setIsPlaying(false);
      };
      
      newUtterance.onerror = () => {
        setIsPlaying(false);
      };

      setUtterance(newUtterance);
      speechSynthesis.speak(newUtterance);
      setIsPlaying(true);
    }
  };

  // Limpar ao desmontar o componente
  useEffect(() => {
    return () => {
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, [speechSynthesis]);

  if (!speechSynthesis) {
    return null; // Ocultar se o navegador não suportar
  }

  return (
    <div className="relative inline-flex items-center">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon-xs"
        onClick={handleTogglePlay}
        className={`h-5 w-5 bg-zinc-800/80 hover:bg-zinc-700 hover:text-white text-zinc-400 rounded-full flex items-center justify-center border border-white/10 transition-colors z-10 ${isPlaying ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : ''} ${className || ""}`}
        title={isPlaying ? "Parar explicação em áudio" : "Ouvir explicação detalhada"}
      >
        {isPlaying ? (
          <Square className="w-2 h-2 fill-current" />
        ) : (
          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
        )}
      </Button>

      {/* Tooltip Dinâmico (Legenda Visual) */}
      {isPlaying && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 max-w-[85vw] p-3 bg-zinc-900 border border-yellow-500/30 rounded-xl shadow-xl shadow-black/50 z-50 animate-in fade-in slide-in-from-top-1 pointer-events-none">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-yellow-500/30" />
          <div className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-zinc-900" />
          <p className="text-[10px] text-zinc-300 leading-relaxed text-center font-medium">
            {text}
          </p>
        </div>
      )}
    </div>
  );
}
