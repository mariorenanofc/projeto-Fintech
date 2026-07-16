"use client";

import { useState, useEffect } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioExplainerButton({ text, className }: { text: string; className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

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
      newUtterance.rate = 1.0;
      
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
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleTogglePlay}
      className={`h-5 w-5 bg-zinc-800/80 hover:bg-zinc-700 hover:text-white text-zinc-400 rounded-full flex items-center justify-center border border-white/10 transition-colors ${className || ""}`}
      title={isPlaying ? "Parar explicação em áudio" : "Ouvir explicação detalhada"}
    >
      {isPlaying ? (
        <Square className="w-2.5 h-2.5 fill-current" />
      ) : (
        <Play className="w-3 h-3 fill-current ml-0.5" />
      )}
    </Button>
  );
}
