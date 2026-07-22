"use client";

import React from "react";
import Link from "next/link";
import { AuthButton } from "@/components/auth-button";
import { TiltCard } from "@/components/ui/tilt-card";
import { Coins, ShieldAlert, Sparkles, CalendarRange, Heart, Bot, TrendingUp, Lock, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex-1 w-full min-h-screen bg-transparent flex flex-col items-center justify-between px-4 py-8 relative overflow-hidden">
      
      {/* Luz de Fundo Efeito Glow Micro1 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-3/4 -left-20 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Outer Container */}
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center z-10 space-y-12">
        
        {/* Top Header Logo */}
        <header className="w-full flex justify-between items-center py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-yellow-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <Coins className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-white">
                FINTECH CASAL
              </span>
              <span className="text-[9px] text-zinc-400 font-medium tracking-wider uppercase">
                Planejamento Conjugal &amp; Engenharia de Crédito
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-zinc-400">
            <Lock className="w-3.5 h-3.5 text-yellow-500" />
            <span>Google OAuth 2.0 Verified</span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-black backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.15)] animate-pulse">
            <Sparkles className="w-4 h-4 text-yellow-400" /> PLATAFORMA DE SINTONIA FINANCEIRA PARA CASAIS ⚡
          </div>
          <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Sintonia, Orçamento &amp; <br />
            <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent filter drop-shadow-[0_0_25px_rgba(234,179,8,0.3)]">
              Engenharia Financeira Conjugal
            </span>
          </h1>
          <p className="text-xs sm:text-base text-zinc-300 font-medium max-w-2xl mx-auto leading-relaxed">
            Eliminem o estresse financeiro a dois. Acompanhem o semáforo de gastos, planejem reservas e sincronizem automaticamente as contas no Google Calendar.
          </p>
        </section>

        {/* Card Central de Login com Google OAuth */}
        <div className="w-full max-w-lg">
          <TiltCard glowColor="rgba(234, 179, 8, 0.25)" className="p-10 sm:p-12 relative overflow-hidden backdrop-blur-xl bg-zinc-950/90 border-[#27272A] shadow-2xl">
            {/* Cabeçalho de Identificação */}
            <div className="flex flex-col items-center space-y-3 pb-2">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-yellow-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(234,179,8,0.35)] mb-1">
                <Coins className="w-7 h-7 text-yellow-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Entrar no Fintech Casal</h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-semibold">Acesso rápido e seguro para o casal</p>
            </div>

            {/* Linha Divisória Dourada Suave */}
            <div className="relative w-full h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent my-6">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent blur-[3px]" />
            </div>

            {/* Conteúdo de Acesso */}
            <div className="space-y-6">
              {/* Google OAuth Login Button com espaço adequado */}
              <div className="w-full flex justify-center py-2">
                <AuthButton />
              </div>

              {/* Aviso de Transparência do Google Calendar API */}
              <div className="bg-zinc-900/90 p-5 sm:p-6 rounded-2xl border border-white/10 text-left space-y-2.5 shadow-inner">
                <span className="text-xs text-yellow-400 uppercase font-extrabold tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0" /> Integração com Google Agenda
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                  Utilizamos permissões estritas para adicionar lembretes das contas a pagar diretamente na sua agenda pessoal, evitando atrasos e juros. Seus dados estão protegidos sob isolamento RLS.
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs text-zinc-400 font-bold tracking-wider uppercase pt-2">
                <span className="flex items-center gap-1.5">🔒 Criptografia SSL</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">🛡️ Supabase Auth</span>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* Grade de Funcionalidades em 3D Tilt Cards */}
        <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          
          <TiltCard glowColor="rgba(234, 179, 8, 0.15)">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mb-3">
              <ShieldAlert className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Semáforo de Gastos 🚦</h3>
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              Sinal visual diário (Verde, Amarelo ou Vermelho) calculando o teto de gastos do casal em tempo real.
            </p>
          </TiltCard>

          <TiltCard glowColor="rgba(16, 185, 129, 0.15)">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Engenharia de Crédito ⚡</h3>
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              Aplicação da Lei 14.690/23 para simulação de parcelamentos e resgate imediato da saúde financeira.
            </p>
          </TiltCard>

          <TiltCard glowColor="rgba(6, 182, 212, 0.15)">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <CalendarRange className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Google Calendar Sync 📅</h3>
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              Sincronização automática das datas de vencimento de cartões e contas no Google Agenda do casal.
            </p>
          </TiltCard>

          <TiltCard glowColor="rgba(244, 63, 94, 0.15)">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <Bot className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Conselheira IA 🤖</h3>
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              Assistente virtual com inteligência financeira pronta para responder dúvidas e traçar estratégias.
            </p>
          </TiltCard>

        </section>

        {/* Footer com Links Requeridos pelo Google OAuth */}
        <footer className="w-full border-t border-white/5 pt-6 pb-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-6 text-xs text-zinc-400 font-bold">
            <Link href="/politica-de-privacidade" className="hover:text-yellow-400 transition-colors underline underline-offset-4">
              Política de Privacidade
            </Link>
            <span>&bull;</span>
            <Link href="/termos-de-uso" className="hover:text-yellow-400 transition-colors underline underline-offset-4">
              Termos de Uso
            </Link>
          </div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-medium tracking-wide">
            <span>Desenvolvido com</span>
            <Heart className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
            <span>para casais investidores — {new Date().getFullYear()}</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
