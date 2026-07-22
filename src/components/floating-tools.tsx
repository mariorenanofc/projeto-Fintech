"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Calculator, X, Percent, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingTools() {
  const pathname = usePathname();
  const router = useRouter();

  // Estados da Calculadora
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [isResultComputed, setIsResultComputed] = useState(false);
  const [previousExpression, setPreviousExpression] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<{ equation: string; result: string }[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  // Não exibe a barra de ferramentas nas rotas públicas
  const isChat = pathname?.includes("/chat");
  const isPublic = ["/", "/politica-de-privacidade", "/termos-de-uso"].includes(pathname);
  
  if (isPublic) {
    return null;
  }

  const showChatBubble = !isChat; // Não mostra o botão de chat se já estiver na página de chat

  React.useEffect(() => {
    let lastScrollTop = 0;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Rolando para baixo -> esconde balões flutuantes
        setIsVisible(false);
        document.body.classList.add("scrolling-down");
      } else if (scrollTop < lastScrollTop) {
        // Rolando para cima -> mostra balões flutuantes
        setIsVisible(true);
        document.body.classList.remove("scrolling-down");
      }
      
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.classList.remove("scrolling-down");
    };
  }, []);

  // Carrega histórico inicial do cache temporário se tiver menos de 7 minutos
  React.useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("calc_history");
      const lastActiveStr = localStorage.getItem("calc_last_active");
      
      if (savedHistory && lastActiveStr) {
        const lastActive = parseInt(lastActiveStr, 10);
        const timePassed = Date.now() - lastActive;
        const sevenMinutes = 7 * 60 * 1000;
        
        if (timePassed < sevenMinutes) {
          setHistory(JSON.parse(savedHistory));
        } else {
          localStorage.removeItem("calc_history");
          localStorage.removeItem("calc_last_active");
        }
      }
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
    }
  }, []);

  // Efeito de limpeza do cache temporário (limpa após 7 minutos de inatividade)
  React.useEffect(() => {
    const checkExpiry = () => {
      try {
        const lastActiveStr = localStorage.getItem("calc_last_active");
        if (lastActiveStr) {
          const lastActive = parseInt(lastActiveStr, 10);
          const timePassed = Date.now() - lastActive;
          const sevenMinutes = 7 * 60 * 1000;
          
          if (timePassed >= sevenMinutes) {
            setHistory([]);
            localStorage.removeItem("calc_history");
            localStorage.removeItem("calc_last_active");
          }
        }
      } catch (e) {
        console.error("Erro ao verificar expiração do histórico:", e);
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const updateActivity = () => {
    try {
      localStorage.setItem("calc_last_active", String(Date.now()));
    } catch (e) {}
  };

  // Suporte a teclado físico para a calculadora
  React.useEffect(() => {
    if (!isCalcOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      if (/[0-9+\-*/.()]/.test(key)) {
        e.preventDefault();
        handleKeyPress(key);
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleKeyPress("=");
      } else if (key === "Backspace") {
        e.preventDefault();
        handleKeyPress("del");
      } else if (key === "Escape" || key === "c" || key === "C") {
        e.preventDefault();
        handleKeyPress("C");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCalcOpen, expression, result, isResultComputed]);

  const handleKeyPress = (val: string) => {
    updateActivity();
    const isOperator = ["+", "-", "*", "/"].includes(val);

    if (val === "C") {
      setExpression("");
      setResult("");
      setPreviousExpression("");
      setIsResultComputed(false);
    } else if (val === "del") {
      if (isResultComputed) {
        setExpression("");
        setResult("");
        setPreviousExpression("");
        setIsResultComputed(false);
      } else {
        setExpression(prev => prev.slice(0, -1));
      }
    } else if (val === "=") {
      try {
        const sanitized = expression.replace(/[^0-9+\-*/().%]/g, "");
        if (!sanitized) return;

        let finalExpression = sanitized.replace(/([0-9.]+)(%)/g, "($1/100)");

        const calcResult = new Function(`return ${finalExpression}`)();
        
        if (calcResult === Infinity || calcResult === -Infinity || isNaN(calcResult)) {
          setResult("Erro");
          setPreviousExpression(expression + " =");
          setIsResultComputed(true);
        } else {
          const rounded = Number(calcResult);
          const formatted = rounded % 1 === 0 ? String(rounded) : String(Number(rounded.toFixed(4)));
          
          // Adiciona ao histórico de forma temporária
          const newEntry = { equation: expression + " =", result: formatted };
          const updatedHistory = [newEntry, ...history];
          setHistory(updatedHistory);
          try {
            localStorage.setItem("calc_history", JSON.stringify(updatedHistory));
          } catch (e) {}

          setResult(formatted);
          setPreviousExpression(expression + " =");
          setExpression(formatted);
          setIsResultComputed(true);
        }
      } catch (e) {
        setResult("Erro");
        setPreviousExpression(expression + " =");
        setIsResultComputed(true);
      }
    } else {
      if (isResultComputed) {
        setPreviousExpression("");
        if (isOperator) {
          if (result === "Erro") {
            setExpression(val);
            setResult("");
          } else {
            setExpression(result + val);
            setResult("");
          }
        } else {
          setExpression(val === "." ? "0." : val);
          setResult("");
        }
        setIsResultComputed(false);
      } else {
        // Impedir múltiplos pontos decimais no mesmo número
        if (val === ".") {
          const segments = expression.split(/[+\-*/()]/);
          const lastSegment = segments[segments.length - 1];
          if (lastSegment.includes(".")) {
            return;
          }
          if (lastSegment === "") {
            setExpression(prev => prev + "0.");
            return;
          }
        }

        // Se a expressão for "0", substitui pelo número digitado se não for operador
        if (expression === "0" && !isOperator && val !== ".") {
          setExpression(val);
          return;
        }

        const lastChar = expression.slice(-1);
        const isLastCharOperator = ["+", "-", "*", "/"].includes(lastChar);
        
        if (isOperator && isLastCharOperator) {
          // Substitui o operador anterior pelo novo digitado
          setExpression(prev => prev.slice(0, -1) + val);
        } else {
          setExpression(prev => prev + val);
        }
      }
    }
  };

  const getLargeDisplayValue = () => {
    if (result) return result;
    if (!expression) return "0";

    const segments = expression.split(/[+\-*/()]/);
    const lastSegment = segments[segments.length - 1];

    if (lastSegment === "") {
      for (let i = segments.length - 2; i >= 0; i--) {
        if (segments[i] !== "") return segments[i];
      }
      return "0";
    }
    return lastSegment;
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("calc_history");
    } catch (e) {}
    updateActivity();
  };

  const handleSelectHistory = (entry: { equation: string; result: string }) => {
    setExpression(entry.result);
    setResult(entry.result);
    setPreviousExpression("");
    setIsResultComputed(true);
    setIsHistoryOpen(false); // Retorna ao teclado para continuar calculando
    updateActivity();
  };

  return (
    <>
      {/* 1. Balão Flutuante do Chat IA (Canto Inferior Esquerdo) */}
      {showChatBubble && (
        <div className={`fixed left-6 z-[9990] group transition-all duration-300 ${isVisible ? 'bottom-6 translate-y-0 opacity-100' : 'bottom-0 translate-y-full opacity-0 pointer-events-none'}`}>
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
      <div className={`fixed right-6 z-[9990] group transition-all duration-300 ${isVisible || isCalcOpen ? 'bottom-6 translate-y-0 opacity-100' : 'bottom-0 translate-y-full opacity-0 pointer-events-none'} ${isChat ? 'max-md:hidden' : ''}`}>
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
        <div className={`fixed bottom-24 right-6 w-[280px] bg-zinc-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-[9999] text-xs text-white ${isChat ? 'max-md:hidden' : ''}`}>
          {/* Header */}
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
            <span className="text-[10px] uppercase tracking-widest font-black text-yellow-500 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-yellow-500" />
              Calculadora Casal
            </span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className={`p-1 rounded transition-colors ${isHistoryOpen ? 'text-yellow-500 bg-yellow-500/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                title="Histórico de Cálculos"
              >
                <History className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsCalcOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Visor / Tela */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3.5 mb-4 text-right overflow-hidden min-h-[72px] flex flex-col justify-end select-all">
            <div className="text-[10px] text-zinc-500 font-mono break-all leading-tight mb-1">
              {isResultComputed ? previousExpression : (expression || "0")}
            </div>
            <div className="text-lg font-black text-yellow-500 font-mono break-all leading-none">
              {getLargeDisplayValue()}
            </div>
          </div>

          {isHistoryOpen ? (
            /* Painel do Histórico */
            <div className="flex flex-col h-[180px]">
              <div className="flex justify-between items-center mb-2 px-1 text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                <span>Histórico Recente</span>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory} 
                    className="text-rose-450 hover:text-rose-400 flex items-center gap-1 transition-colors uppercase text-[9px] font-black"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin" data-lenis-prevent>
                {history.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[10px] text-zinc-650 font-bold uppercase tracking-wider">
                    Nenhum cálculo salvo
                  </div>
                ) : (
                  history.map((entry, index) => (
                    <button 
                      key={index}
                      onClick={() => handleSelectHistory(entry)}
                      className="w-full text-right bg-zinc-900/10 hover:bg-zinc-900/40 border border-white/5 hover:border-yellow-500/20 rounded-lg p-2 transition-all block group"
                      title="Clique para utilizar o valor"
                    >
                      <div className="text-[9px] text-zinc-500 font-mono break-all leading-tight group-hover:text-zinc-400 transition-colors">
                        {entry.equation}
                      </div>
                      <div className="text-xs font-bold text-yellow-500/80 font-mono break-all leading-normal group-hover:text-yellow-500 transition-colors mt-0.5">
                        {entry.result}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="mt-3 w-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Voltar ao Teclado
              </button>
            </div>
          ) : (
            /* Teclado da Calculadora */
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
          )}
        </div>
      )}
    </>
  );
}
