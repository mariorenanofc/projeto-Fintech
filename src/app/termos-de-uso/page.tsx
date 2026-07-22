"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function TermsOfUsePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 md:p-8 justify-center items-center">
        <span className="text-xs text-zinc-550 uppercase tracking-widest font-black animate-pulse">
          Carregando...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 md:p-8 relative overflow-hidden">
      
      {/* Luz de Fundo Efeito Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-3/4 -left-20 w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto w-full z-10">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link href="/">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 px-3 rounded-xl border border-transparent hover:border-white/5 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-yellow-500 font-black tracking-tight text-sm uppercase">
            <FileText className="w-5 h-5 text-yellow-500" />
            Fintech Casal
          </div>
        </motion.header>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-zinc-900/40 border-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
            <CardContent className="p-6 md:p-10 prose prose-invert prose-yellow max-w-none">
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">
                Termos de Serviço
              </h1>
              <p className="text-xs text-zinc-550 font-bold uppercase tracking-wider mb-8">Última atualização: Julho de 2026</p>

              <section className="space-y-4 mb-8">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">1. Aceitação dos Termos</h2>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Ao acessar e utilizar o aplicativo <strong>Fintech Casal</strong> (acessível via projeto-fintech-kohl.vercel.app), você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concorda com qualquer parte destes termos, você não deve usar nosso serviço.
                </p>
              </section>

              <section className="space-y-4 mb-8">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">2. Descrição do Serviço</h2>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  O Fintech Casal é uma plataforma de organização financeira projetada para ajudar casais a gerenciar suas receitas, despesas e dívidas conjuntas. O sistema utiliza a metodologia de "Operação de Choque" e uma Inteligência Artificial ("Conselheiro IA") para fornecer insights e sugestões de renegociação (Engenharia Financeira).
                </p>
                <p className="text-yellow-400 font-bold bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-xl text-xs sm:text-sm">
                  ⚠️ Aviso Legal: As informações e dicas geradas pela plataforma e pela IA têm caráter puramente consultivo e educacional. O Fintech Casal NÃO atua como instituição financeira, corretora de valores ou consultoria contábil oficial, e não se responsabiliza por prejuízos decorrentes da aplicação (ou má aplicação) das sugestões fornecidas.
                </p>
              </section>

              <section className="space-y-4 mb-8">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">3. Responsabilidades do Usuário</h2>
                <ul className="list-disc pl-5 text-zinc-350 text-xs sm:text-sm space-y-2">
                  <li>Você é responsável por manter a confidencialidade das credenciais da sua conta (através do Google OAuth).</li>
                  <li>Você garante que os dados financeiros inseridos refletem a sua realidade e você possui autorização do seu cônjuge para compartilhá-los no "Grupo Familiar".</li>
                  <li>É proibido utilizar a plataforma para qualquer fim ilegal, fraudulento ou não autorizado.</li>
                </ul>
              </section>

              <section className="space-y-4 mb-8">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">4. Disponibilidade do Serviço</h2>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Nós nos esforçamos para garantir que o serviço esteja disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos acesso ininterrupto. O aplicativo pode ficar temporariamente indisponível para manutenção, atualizações ou devido a falhas nos provedores (ex: Supabase, Vercel ou Google Cloud).
                </p>
              </section>

              <section className="space-y-4 mb-8">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">5. Modificações dos Termos</h2>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Reservamo-nos o direito de modificar estes Termos a qualquer momento. Quaisquer alterações entrarão em vigor imediatamente após a publicação da versão atualizada nesta página. O uso contínuo do serviço após as alterações constitui a sua aceitação dos novos Termos.
                </p>
              </section>

              <section className="space-y-4 mb-4">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">6. Contato</h2>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco através do e-mail oficial do desenvolvedor registrado na plataforma do Google Cloud.
                </p>
              </section>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
