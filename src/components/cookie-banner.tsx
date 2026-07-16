"use client";

import React, { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já aceitou os cookies
    const hasAcceptedCookies = localStorage.getItem("fintech_cookies_accepted");
    if (!hasAcceptedCookies) {
      // Pequeno delay para aparecer de forma suave
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("fintech_cookies_accepted", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom-10 fade-in duration-500 pointer-events-none flex justify-center">
      <div className="pointer-events-auto bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(234,179,8,0.15)] rounded-2xl p-4 sm:p-5 w-full max-w-4xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex-shrink-0 flex items-center justify-center">
            <Cookie className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight">Privacidade e Cookies</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
              Usamos cookies para melhorar sua experiência, garantir a segurança do seu login e analisar o tráfego. 
              Ao continuar navegando, você concorda com a nossa política de privacidade.
            </p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3 mt-2 sm:mt-0">
          <Button 
            onClick={() => setIsVisible(false)} 
            variant="ghost" 
            className="flex-1 sm:flex-none h-10 px-4 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            Recusar
          </Button>
          <Button 
            onClick={acceptCookies} 
            className="flex-1 sm:flex-none h-10 px-6 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-black rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all"
          >
            Aceitar Todos
          </Button>
          <button 
            onClick={() => setIsVisible(false)}
            className="hidden sm:flex p-2 text-zinc-500 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
