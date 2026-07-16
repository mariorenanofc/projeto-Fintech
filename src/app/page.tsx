import React from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { Coins, ShieldAlert, Sparkles, CalendarRange, Heart } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex-1 w-full min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      
      {/* Atmosfera: Efeitos de iluminação (glow) sutis no fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-yellow-500/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Conteúdo Principal */}
      <div className="w-full max-w-4xl flex flex-col items-center z-10 py-12">
        
        {/* Card Centralizado de Login */}
        <div className="w-full max-w-md bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(234,179,8,0.06)] flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Brilho interno do card */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
          
          {/* Logotipo da Fintech */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-2xl blur-md animate-pulse" />
            <div className="relative w-12 h-12 rounded-2xl bg-zinc-900 border border-yellow-500/30 flex items-center justify-center shadow-lg">
              <Coins className="w-6.5 h-6.5 text-yellow-500 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
            </div>
          </div>

          {/* Textos de Títulos */}
          <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            Fintech Casal
          </h1>
          <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mt-1">
            Finanças Compartilhadas
          </p>

          <div className="bg-zinc-950/50 border border-white/5 p-4 rounded-xl mt-4">
            <h2 className="text-sm font-bold text-white mb-2">Qual a finalidade deste app?</h2>
            <p className="text-xs text-zinc-400 leading-relaxed text-justify">
              O <strong>Fintech Casal</strong> é um aplicativo de organização financeira projetado para ajudar casais a planejar orçamentos conjuntos, gerenciar despesas e acompanhar contas a pagar de forma gamificada. 
              <br/><br/>
              <strong>Integração com Google:</strong> Utilizamos o Login do Google para garantir acesso seguro à sua conta. Solicitamos acesso ao seu <strong>Google Calendar (Google Agenda)</strong> exclusivamente para poder adicionar, de forma automática, lembretes das datas de vencimento das contas cadastradas no aplicativo diretamente na sua agenda pessoal, evitando multas e atrasos. Seus dados não são compartilhados com terceiros.
            </p>
          </div>

          {/* Botão de Google Auth Premium Centralizado */}
          <div className="w-full flex justify-center mt-8 mb-2">
            <AuthButton />
          </div>

          <span className="text-[9px] text-zinc-650 mt-4 uppercase tracking-wider font-semibold">
            Seguro &bull; RLS Isolado &bull; Google OAuth
          </span>
        </div>

        {/* Estética dos Textos: Funcionalidades em Grid Elegante abaixo do Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-3xl">
          
          {/* Item 1: Semáforo */}
          <div className="bg-zinc-900/20 border border-white/5 backdrop-blur-sm p-5 rounded-2xl flex flex-col items-center text-center hover:bg-zinc-900/30 hover:border-white/10 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-3 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-yellow-500 filter drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]" />
            </div>
            <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider">Semáforo de Gastos</h3>
            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
              Sinal visual diário (Verde, Amarelo ou Vermelho) indicando se vocês podem realizar novas compras.
            </p>
          </div>

          {/* Item 2: Gamificação */}
          <div className="bg-zinc-900/20 border border-white/5 backdrop-blur-sm p-5 rounded-2xl flex flex-col items-center text-center hover:bg-zinc-900/30 hover:border-white/10 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-yellow-500 filter drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]" />
            </div>
            <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider">Metas Gamificadas</h3>
            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
              Acumulem XP pagando contas no prazo e conquistem medalhas premium compartilhadas.
            </p>
          </div>

          {/* Item 3: Calendário */}
          <div className="bg-zinc-900/20 border border-white/5 backdrop-blur-sm p-5 rounded-2xl flex flex-col items-center text-center hover:bg-zinc-900/30 hover:border-white/10 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 mb-3 group-hover:scale-105 transition-transform">
              <CalendarRange className="w-5 h-5 text-yellow-500 filter drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]" />
            </div>
            <h3 className="text-xs font-black text-zinc-200 uppercase tracking-wider">Google Calendar</h3>
            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
              Agenda integrada para salvar as datas de vencimento automaticamente em seus calendários do Google.
            </p>
          </div>

        </div>

        {/* Footer da Página com Links Legais (Exigência do Google OAuth) */}
        <footer className="mt-12 flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
            <Link href="/politica-de-privacidade" className="hover:text-yellow-500 transition-colors underline underline-offset-4">
              Política de Privacidade
            </Link>
            <span>&bull;</span>
            <Link href="/termos-de-uso" className="hover:text-yellow-500 transition-colors underline underline-offset-4">
              Termos de Uso
            </Link>
          </div>
          <div className="text-[10px] text-zinc-650 flex items-center gap-1.5 font-medium tracking-wide">
            <span>Desenvolvido com</span>
            <Heart className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
            <span>para casais investidores</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
