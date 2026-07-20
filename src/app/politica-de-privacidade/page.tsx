import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-zinc-400 hover:text-white px-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-yellow-500 font-bold">
            <Shield className="w-5 h-5" />
            Fintech Casal
          </div>
        </header>

        {/* Content Card */}
        <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-md">
          <CardContent className="p-6 md:p-10 prose prose-invert prose-yellow max-w-none">
            <h1 className="text-2xl md:text-4xl font-extrabold text-zinc-100 mb-6">Política de Privacidade</h1>
            <p className="text-sm text-zinc-400 mb-8">Última atualização: Julho de 2026</p>

            <section className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-yellow-500">1. Informações que Coletamos</h2>
              <p className="text-zinc-300 leading-relaxed">
                Ao utilizar o <strong>Fintech Casal</strong>, nós solicitamos acesso a certas informações para fornecer a melhor experiência possível de organização financeira para o seu lar. 
                Quando você faz login utilizando o Google (OAuth), coletamos apenas as informações estritamente necessárias autorizadas por você, como:
              </p>
              <ul className="list-disc pl-5 text-zinc-300 space-y-2">
                <li><strong>Endereço de e-mail e dados de perfil público:</strong> Usados unicamente para autenticação, identificação da sua conta e vinculação ao seu parceiro(a).</li>
                <li><strong>Google Calendar API (<code className="text-yellow-400">https://www.googleapis.com/auth/calendar.events</code>):</strong> Acesso para criar, visualizar e gerenciar lembretes e eventos de vencimento de contas diretamente na agenda do usuário.</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed">
                Além disso, processamos os dados financeiros inseridos manualmente (receitas, despesas, faturas, dívidas) para geração de diagnósticos e relatórios da "Operação de Choque".
              </p>
            </section>

            <section className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-yellow-500">2. Como Usamos e Compartilhamos as Suas Informações</h2>
              <p className="text-zinc-300 leading-relaxed">
                Nós utilizamos as suas informações exclusivamente para:
              </p>
              <ul className="list-disc pl-5 text-zinc-300 space-y-2">
                <li>Prestar, operar e manter os serviços do aplicativo.</li>
                <li>Conectar o seu perfil ao do seu cônjuge para a formação do "Grupo Familiar".</li>
                <li>Sincronizar as datas de vencimento de contas com o seu Google Agenda via Google Calendar API.</li>
                <li>Alimentar o <em>Conselheiro IA</em> para fornecer sugestões financeiras personalizadas.</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed font-bold">
                Nenhum dado recebido das APIs do Google é transferido, vendido ou compartilhado com terceiros, corretores de dados (data brokers) ou empresas de publicidade sob nenhuma circunstância.
              </p>
            </section>

            <section className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-yellow-500">3. Declaração de Requisitos de Uso Limitado do Google (Limited Use Disclosure)</h2>
              <p className="text-zinc-300 leading-relaxed bg-zinc-900 border border-yellow-500/20 p-4 rounded-lg">
                "O uso e a transferência para qualquer outro aplicativo de informações recebidas das APIs do Google Workspace (incluindo o Google Calendar) pela <strong>Fintech Casal</strong> obedecerão à <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-yellow-500 underline">Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo os requisitos de <strong>Uso Limitado (Limited Use Requirements)</strong>."
              </p>
              <p className="text-zinc-300 leading-relaxed">
                Em alinhamento rigoroso com as diretrizes do Google:
              </p>
              <ul className="list-disc pl-5 text-zinc-300 space-y-2">
                <li>Os dados do Google Workspace jamais serão utilizados para treinar, aprimorar ou alimentar modelos de Inteligência Artificial ou Machine Learning (AI/ML) genéricos ou de terceiros.</li>
                <li>Os dados obtidos via Google APIs são utilizados estritamente para fornecer e melhorar recursos visíveis e úteis diretamente para o usuário.</li>
              </ul>
            </section>

            <section className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-yellow-500">4. Segurança dos Dados</h2>
              <p className="text-zinc-300 leading-relaxed">
                Levamos a segurança da sua família a sério. Utilizamos provedores de ponta (Supabase e Vercel) com criptografia em trânsito (HTTPS/TLS) e em repouso (AES-256) para proteger suas senhas, tokens OAuth, sessões de autenticação e histórico financeiro contra acessos não autorizados.
              </p>
            </section>

            <section className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-yellow-500">5. Retenção, Seus Direitos e Exclusão de Dados</h2>
              <p className="text-zinc-300 leading-relaxed">
                Você mantém o controle total sobre seus dados. A qualquer momento, você pode:
              </p>
              <ul className="list-disc pl-5 text-zinc-300 space-y-2">
                <li>Revogar a autorização de acesso concedida ao Fintech Casal através da sua <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-yellow-500 underline">Conta do Google</a>.</li>
                <li>Solicitar a exclusão total da sua conta e de todos os dados financeiros e registros associados no nosso banco de dados entrando em contato conosco. Os dados são retidos apenas enquanto a conta estiver ativa.</li>
              </ul>
            </section>

            <section className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-yellow-500">6. Contato</h2>
              <p className="text-zinc-300 leading-relaxed">
                Se você tiver qualquer dúvida sobre como tratamos seus dados ou sobre esta Política de Privacidade, entre em contato conosco pelo e-mail do desenvolvedor cadastrado no Google Cloud Console.
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

