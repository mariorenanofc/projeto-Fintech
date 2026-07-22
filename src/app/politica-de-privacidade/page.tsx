"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
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
            <Shield className="w-5 h-5 text-yellow-500" />
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
                Política de Privacidade
              </h1>
              <p className="text-xs text-zinc-550 font-bold uppercase tracking-wider mb-8">Última atualização: Julho de 2026</p>

              <section className="space-y-4 mb-8">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">1. Informações que Coletamos</h2>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Ao utilizar o <strong>Fintech Casal</strong>, nós solicitamos acesso a certas informações para fornecer a melhor experiência possível de organização financeira para o seu lar. 
                  Quando você faz login utilizando o Google (OAuth), coletamos apenas as informações estritamente necessárias autorizadas por você, como:
                </p>
                <ul className="list-disc pl-5 text-zinc-300 text-xs sm:text-sm space-y-2">
                  <li><strong>Endereço de e-mail e dados de perfil público:</strong> Usados unicamente para autenticação, identificação da sua conta e vinculação ao seu parceiro(a).</li>
                  <li><strong>Google Calendar API (<code className="text-yellow-400 font-bold bg-yellow-950/20 px-1 py-0.5 rounded">https://www.googleapis.com/auth/calendar.events</code>):</strong> Acesso para criar, visualizar e gerenciar lembretes e eventos de vencimento de contas diretamente na agenda do usuário.</li>
                </ul>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Além disso, processamos os dados financeiros inseridos manualmente (receitas, despesas, faturas, dívidas) para geração de diagnósticos e relatórios da "Operação de Choque".
                </p>
              </section>

              <section className="space-y-4 mb-8">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">2. Como Usamos e Compartilhamos as Suas Informações</h2>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Nós utilizamos as suas informações exclusivamente para:
                </p>
                <ul className="list-disc pl-5 text-zinc-300 text-xs sm:text-sm space-y-2">
                  <li>Prestar, operar e manter os serviços do aplicativo.</li>
                  <li>Conectar o seu perfil ao do seu cônjuge para a formação do "Grupo Familiar".</li>
                  <li>Sincronizar as datas de vencimento de contas com o seu Google Agenda via Google Calendar API.</li>
                  <li>Alimentar o <em>Conselheiro IA</em> para fornecer sugestões financeiras personalizadas.</li>
                </ul>
                <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm font-bold bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-xl">
                  ⚠️ Nenhum dado recebido das APIs do Google é transferido, vendido ou compartilhado com terceiros, corretores de dados (data brokers) ou empresas de publicidade sob nenhuma circunstância.
                </p>
              </section>

              <section className="space-y-4 mb-8">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">3. Requisitos de Uso Limitado do Google</h2>
                <p className="text-zinc-350 leading-relaxed bg-zinc-950/60 border border-white/5 p-4 rounded-xl text-xs sm:text-sm font-semibold">
                  "O uso e a transferência para qualquer outro aplicativo de informações recebidas das APIs do Google Workspace (incluindo o Google Calendar) pela <strong>Fintech Casal</strong> obedecerão à <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 underline transition-colors">Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo os requisitos de <strong>Uso Limitado (Limited Use Requirements)</strong>."
                </p>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Em alinhamento rigoroso com as diretrizes do Google:
                </p>
                <ul className="list-disc pl-5 text-zinc-300 text-xs sm:text-sm space-y-2">
                  <li>Os dados do Google Workspace jamais serão utilizados para treinar, aprimorar ou alimentar modelos de Inteligência Artificial ou Machine Learning (AI/ML) genéricos ou de terceiros.</li>
                  <li>Os dados obtidos via Google APIs são utilizados estritamente para fornecer e melhorar recursos visíveis e úteis diretamente para o usuário.</li>
                  <li><strong>Isolamento Total de Dados da IA (AI Data Isolation):</strong> Declaramos formalmente que a nossa integração com serviços de Inteligência Artificial (API do Google Gemini) está totalmente isolada e desconectada das APIs do Google Workspace. Nenhum dado obtido do Google Workspace (como eventos do calendário, e-mails ou metadados de contas) é lido, coletado, derivado ou transferido para os modelos de IA. A nossa IA processa exclusivamente os valores financeiros declarados manualmente pelo usuário (receitas e despesas genéricas).</li>
                  <li><strong>Termos do Provedor de IA:</strong> O serviço de inteligência artificial utiliza a API do Google Gemini (Pay-as-you-go Developer Tier). Em total conformidade com os termos de serviço da API de desenvolvedor do Google Gemini, as informações enviadas às requisições da API de chat não são utilizadas pelo provedor para treinar, refinar ou melhorar modelos públicos ou fundacionais de aprendizado de máquina.</li>
                </ul>
              </section>

              <section className="space-y-4 mb-8">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">4. Segurança dos Dados</h2>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Levamos a segurança da sua família a sério. Utilizamos provedores de ponta (Supabase e Vercel) com criptografia em trânsito (HTTPS/TLS) e em repouso (AES-256) para proteger suas senhas, tokens OAuth, sessões de autenticação e histórico financeiro contra acessos não autorizados.
                </p>
              </section>

              <section className="space-y-4 mb-8">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">5. Retenção, Seus Direitos e Exclusão de Dados</h2>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Você mantém o controle total sobre seus dados. A qualquer momento, você pode:
                </p>
                <ul className="list-disc pl-5 text-zinc-300 text-xs sm:text-sm space-y-2">
                  <li>Revogar a autorização de acesso concedida ao Fintech Casal através da sua <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 underline transition-colors">Conta do Google</a>.</li>
                  <li>Solicitar a exclusão total da sua conta e de todos os dados financeiros e registros associados no nosso banco de dados entrando em contato conosco. Os dados são retidos apenas enquanto a conta estiver ativa.</li>
                </ul>
              </section>

              <section className="space-y-4 mb-4">
                <h2 className="text-lg font-black text-yellow-500 uppercase tracking-wide">6. Contato</h2>
                <p className="text-zinc-350 leading-relaxed text-xs sm:text-sm">
                  Se você tiver qualquer dúvida sobre como tratamos seus dados ou sobre esta Política de Privacidade, entre em contato conosco pelo e-mail do desenvolvedor cadastrado no Google Cloud Console.
                </p>
              </section>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
