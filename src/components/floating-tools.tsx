"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Calculator, X, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingTools() {
  const pathname = usePathname();
  const router = useRouter();

  // Estados da Calculadora
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");

  // Não exibe o balão de chat se já estiver na página do próprio chat
  const showChatBubble = pathname !== "/chat";

  React.useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let lastScrollTop = 0;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Rolando para baixo -> esconde balões flutuantes, mostra o menu
        document.body.classList.add("scrolling-down");
      } else {
        // Rolando para cima -> mostra balões, esconde o menu
        document.body.classList.remove("scrolling-down");
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

      // Debounce para detectar parada de scroll
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove("scrolling-down");
      }, 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
      // Limpa ao desmontar
      document.body.classList.remove("scrolling-down");
    };
  }, []);

  const handleKeyPress = (val: string) => {
    if (val === "C") {
      setExpression("");
      setResult("");
    } else if (val === "del") {
      setExpression(prev => prev.slice(0, -1));
    } else if (val === "=") {
      try {
        // Sanitização rigorosa contra injeção de código (permite apenas números, operadores, parênteses, ponto e percentual)
        const sanitized = expression.replace(/[^0-9+\-*/().%]/g, "");
        if (!sanitized) return;

        // Trata o percentual trocando algo como "x%" por "x/100"
        let finalExpression = sanitized.replace(/([0-9.]+)(%)/g, "($1/100)");

        // Executa o cálculo de forma segura em escopo isolado
        const calcResult = new Function(`return ${finalExpression}`)();
        
        if (calcResult === Infinity || calcResult === -Infinity || isNaN(calcResult)) {
          setResult("Erro");
        } else {
          // Formata decimais longos
          const rounded = Number(calcResult);
          setResult(rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2));
        }
      } catch (e) {
        setResult("Erro");
      }
    } else {
      setExpression(prev => prev + val);
    }
  };

  return (
    <>
      {/* 1. Balão Flutuante do Chat IA (Canto Inferior Esquerdo) */}
      {showChatBubble && (
        <div className="fixed bottom-6 left-6 z-50 group">
          <Button
            onClick={() => router.push("/chat")}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 shadow-xl shadow-yellow-500/20 flex items-center justify-center p-0 border border-yellow-400/20 animate-pulse transition-transform hover:scale-110"
            title="Abrir Conselheiro IA"
          >
            <MessageSquare className="w-6 h-6 text-zinc-950 fill-zinc-950" />
          </Button>
          <span className="absolute bottom-16 left-0 bg-zinc-900 border border-white/10 text-yellow-500 text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md shadow-black/50">
            Conselheiro IA 🤖
          </span>
        </div>
      )}

      {/* 2. Botão Flutuante da Calculadora (Canto Inferior Direito) */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <Button
          onClick={() => setIsCalcOpen(!isCalcOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center p-0 border transition-all hover:scale-110 ${
            isCalcOpen 
              ? "bg-zinc-900 border-white/10 text-white hover:bg-zinc-800" 
              : "bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-zinc-950 shadow-yellow-500/20 border-yellow-400/20"
          }`}
          title="Calculadora Virtual"
        >
          {isCalcOpen ? <X className="w-6 h-6" /> : <Calculator className="w-6 h-6" />}
        </Button>
        <span className="absolute bottom-16 right-0 bg-zinc-900 border border-white/10 text-yellow-500 text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md shadow-black/50">
          Calculadora 🧮
        </span>
      </div>

      {/* 3. Modal / Widget da Calculadora Glassmorphic */}
      {isCalcOpen && (
        <div className="fixed bottom-24 right-6 w-[280px] bg-zinc-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-50 text-xs text-white">
          {/* Header */}
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
            <span className="text-[10px] uppercase tracking-widest font-black text-yellow-500 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-yellow-500" />
              Calculadora Casal
            </span>
            <button 
              onClick={() => setIsCalcOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Visor / Tela */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3.5 mb-4 text-right overflow-hidden min-h-[72px] flex flex-col justify-end">
            <div className="text-[10px] text-zinc-500 font-mono break-all leading-tight mb-1">{expression || "0"}</div>
            <div className="text-lg font-black text-yellow-500 font-mono break-all leading-none">
              {result || (expression ? "" : "0")}
            </div>
          </div>

          {/* Teclado da Calculadora */}
          <div className="grid grid-cols-4 gap-2 font-mono">
            {/* Linha 1 */}
            <button onClick={() => handleKeyPress("C")} className="bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-rose-450 font-bold transition-colors">C</button>
            <button onClick={() => handleKeyPress("(")} className="bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-350 transition-colors">(</button>
            <button onClick={() => handleKeyPress(")")} className="bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-350 transition-colors">)</button>
            <button onClick={() => handleKeyPress("/")} className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/10 py-2.5 rounded-xl text-yellow-500 font-bold transition-colors">/</button>

            {/* Linha 2 */}
            <button onClick={() => handleKeyPress("7")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">7</button>
            <button onClick={() => handleKeyPress("8")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">8</button>
            <button onClick={() => handleKeyPress("9")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">9</button>
            <button onClick={() => handleKeyPress("*")} className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/10 py-2.5 rounded-xl text-yellow-500 font-bold transition-colors">*</button>

            {/* Linha 3 */}
            <button onClick={() => handleKeyPress("4")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">4</button>
            <button onClick={() => handleKeyPress("5")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">5</button>
            <button onClick={() => handleKeyPress("6")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">6</button>
            <button onClick={() => handleKeyPress("-")} className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/10 py-2.5 rounded-xl text-yellow-500 font-bold transition-colors">-</button>

            {/* Linha 4 */}
            <button onClick={() => handleKeyPress("1")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">1</button>
            <button onClick={() => handleKeyPress("2")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">2</button>
            <button onClick={() => handleKeyPress("3")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">3</button>
            <button onClick={() => handleKeyPress("+")} className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/10 py-2.5 rounded-xl text-yellow-500 font-bold transition-colors">+</button>

            {/* Linha 5 */}
            <button onClick={() => handleKeyPress("0")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">0</button>
            <button onClick={() => handleKeyPress(".")} className="bg-zinc-900/30 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-200 transition-colors">.</button>
            <button onClick={() => handleKeyPress("del")} className="bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 py-2.5 rounded-xl text-zinc-400 font-bold transition-colors">⌫</button>
            <button onClick={() => handleKeyPress("=")} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black py-2.5 rounded-xl transition-colors">=</button>
          </div>
        </div>
      )}
    </>
  );
}
