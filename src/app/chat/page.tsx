"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Coins, 
  Send, 
  ArrowLeft,
  Bot,
  User,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  PiggyBank,
  Pizza,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAiTokenBalance, askFinancialAdvisor, getChatHistory } from "@/actions/ai";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  
  // Seletor de mês ativo do chat
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().substring(0, 7);
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [outOfTokensAlert, setOutOfTokensAlert] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchBalance();
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchBalance = async () => {
    const res = await getAiTokenBalance();
    if (res.success) {
      setTokenBalance(res.balance);
      if (res.balance <= 0) {
        setOutOfTokensAlert(true);
      }
    } else {
      setTokenBalance(0);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const res = await getChatHistory(50);
    const welcomeMessage = {
      role: "model" as const,
      content: "Olá! Sou o seu Conselheiro IA. Estou conectado à estratégia de Operação de Choque do seu casal. Como posso ajudar vocês hoje? Podem me perguntar sobre gastos pontuais, renegociação de lote/financiamento ou amortização de empréstimos."
    };

    if (res.success && res.messages.length > 0) {
      // Adiciona o histórico mantendo a mensagem de boas vindas no topo
      setMessages([
        welcomeMessage,
        ...res.messages.map((m: any) => ({ role: m.role, content: m.content }))
      ]);
    } else {
      setMessages([welcomeMessage]);
    }
    setLoadingHistory(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    if (tokenBalance !== null && tokenBalance <= 0) {
      setOutOfTokensAlert(true);
      return;
    }

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    // Envia o e-mail, histórico e o mês selecionado para a IA
    const res = await askFinancialAdvisor(text, messages, selectedMonth);
    
    if (res.success && res.answer) {
      setMessages(prev => [...prev, { role: "model", content: res.answer! }]);
      await fetchBalance(); // Atualiza saldo após debitar
    } else {
      if (res.status === 402) {
        setOutOfTokensAlert(true);
        setMessages(prev => [
          ...prev, 
          { 
            role: "model", 
            content: "⚠️ Saldo de tokens esgotado! Não foi possível processar a consulta. Recarreguem a carteira para continuar recebendo conselhos." 
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev, 
          { role: "model", content: "Erro de conexão: " + (res.error || "Tente novamente mais tarde.") }
        ]);
      }
    }
    setLoading(false);
  };

  const handleSuggest = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const reloadTokensSimulation = () => {
    toast.success("Simulação de Recarga: Adicionados +50.000 XP/Tokens à carteira!");
    setTokenBalance(50000);
    setOutOfTokensAlert(false);
  };

  if (!mounted) return null;

  return (
    <div className="flex-1 w-full max-w-md mx-auto bg-zinc-950 flex flex-col md:min-h-screen max-md:h-[100dvh] px-4 py-4 sm:max-w-xl sm:px-6 md:max-w-2xl lg:max-w-3xl lg:px-8 max-md:overflow-hidden">
      
      {/* Header do Chat */}
      <header className="flex-none flex flex-col gap-4 xs:flex-row xs:justify-between xs:items-center mb-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5 w-full xs:w-auto">
          <Link href="/dashboard" className="p-2 rounded-xl bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-yellow-500 transition-colors mr-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 relative overflow-hidden">
            <Bot className="w-5.5 h-5.5 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white sm:text-base">Conselheiro IA</h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Operação de Choque</p>
          </div>
        </div>
        
        {/* Filtros e tokens */}
        <div className="flex items-center gap-2.5 w-full xs:w-auto justify-between xs:justify-end">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-zinc-900 border border-white/5 rounded-xl text-zinc-200 text-xs px-2.5 py-1.5 focus:outline-none [color-scheme:dark] font-bold"
            title="Mês de Contexto da IA"
          />
          {tokenBalance !== null ? (
            <Badge variant="outline" className="border-yellow-500/20 text-yellow-400 bg-yellow-950/10 px-2.5 py-1.5 text-xs flex items-center gap-1.5 font-bold">
              <Coins className="w-3.5 h-3.5 text-yellow-500" />
              {tokenBalance.toLocaleString()} XP
            </Badge>
          ) : (
            <div className="w-20 h-7 bg-zinc-900 animate-pulse rounded-xl" />
          )}
        </div>
      </header>

      {/* Alerta de falta de tokens (Status 402) */}
      {outOfTokensAlert && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-black text-yellow-500 uppercase tracking-wider">Saldo de Tokens Esgotado</h4>
              <p className="text-[10px] text-zinc-450 leading-relaxed font-semibold mt-1">
                Vocês consumiram todo o saldo de consultas da carteira conjugal. Adquira mais tokens para continuar recebendo diagnósticos estratégicos de choque.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={reloadTokensSimulation} className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-8 rounded-lg text-[10px] px-3">
              <RefreshCw className="w-3 h-3 mr-1" /> Simular Recarga
            </Button>
          </div>
        </div>
      )}

      {/* Janela de Conversa Scrollable */}
      <Card className="flex-1 bg-zinc-900/40 border-white/5 shadow-xl backdrop-blur-md overflow-hidden flex flex-col max-md:min-h-0 md:min-h-[350px]">
        <CardContent className="p-4 flex-1 overflow-y-auto space-y-4 md:max-h-[500px]">
          {loadingHistory ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex gap-2.5 max-w-[70%]">
                <div className="w-8 h-8 rounded-full bg-zinc-800" />
                <div className="h-10 bg-zinc-800 rounded-2xl w-full" />
              </div>
              <div className="flex gap-2.5 max-w-[70%] ml-auto flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-zinc-800" />
                <div className="h-12 bg-zinc-800 rounded-2xl w-full" />
              </div>
              <div className="flex gap-2.5 max-w-[60%]">
                <div className="w-8 h-8 rounded-full bg-zinc-800" />
                <div className="h-8 bg-zinc-800 rounded-2xl w-full" />
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex items-start gap-2.5 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-zinc-800 text-zinc-350" : "bg-yellow-500 text-zinc-950 shadow-md shadow-yellow-500/10"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                msg.role === "user" 
                  ? "bg-zinc-800 text-zinc-150 rounded-tr-none" 
                  : "bg-zinc-950/60 border border-white/5 text-zinc-350 rounded-tl-none"
              }`}>
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-3 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-zinc-300" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          )))}

          {/* Loader de Resposta */}
          {loading && (
            <div className="flex items-start gap-2.5 mr-auto max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-yellow-500 text-zinc-950 flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-white/5 text-zinc-500 text-xs font-semibold rounded-tl-none flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-bounce delay-200" />
                <span className="ml-1 uppercase text-[9px] tracking-wider font-bold">Inspecionando caixa...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Caixa de Entrada e Prompt Ideas */}
      <div className="flex-none mt-4 max-md:pb-2 space-y-4 bg-zinc-950">
        {/* Sugestões rápidas (Só exibe se o chat estiver ocioso) */}
        {!loading && (
          <div className="flex gap-2 overflow-x-auto pb-1.5 max-w-full">
            {[
              { text: "Posso pedir pizza hoje?", icon: <Pizza className="w-3.5 h-3.5 mr-1" /> },
              { text: "Como renegociar o lote?", icon: <HelpCircle className="w-3.5 h-3.5 mr-1" /> },
              { text: "Dicas para amortizar o banco", icon: <PiggyBank className="w-3.5 h-3.5 mr-1" /> }
            ].map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSuggest(sug.text)}
                className="bg-zinc-900 border border-white/5 hover:border-yellow-500/20 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center whitespace-nowrap transition-colors"
              >
                {sug.icon}
                {sug.text}
              </button>
            ))}
          </div>
        )}

        {/* Form para envio */}
        <form 
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder={outOfTokensAlert ? "Saldo esgotado..." : "Pergunte ao conselheiro..."}
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            disabled={loading || outOfTokensAlert}
            className="bg-zinc-900/80 border border-white/5 rounded-xl text-zinc-200 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 focus:outline-none p-3.5 flex-1 text-xs disabled:opacity-50"
            required
          />
          <Button 
            type="submit" 
            disabled={loading || !inputMessage.trim() || outOfTokensAlert}
            className="bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black h-[46px] w-[46px] rounded-xl flex items-center justify-center p-0 disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Footer PWA (Oculto no mobile porque a tela de chat ocupa 100% da altura e input fica sticky) */}
      <footer className="hidden md:flex mt-8 pt-5 border-t border-white/5 justify-around text-zinc-600 text-xs">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 hover:text-zinc-400 transition-colors">
          <Coins className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Dashboard</span>
        </Link>
        <Link href="/transactions" className="flex flex-col items-center gap-1 hover:text-zinc-400 transition-colors">
          <TrendingUp className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Transações</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 hover:text-zinc-400 transition-colors">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[9px] tracking-wider uppercase font-semibold">Perfil</span>
        </Link>
      </footer>

    </div>
  );
}
