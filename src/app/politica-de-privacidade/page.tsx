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
                <li><strong>Endereço de e-mail:</strong> Usado unicamente para identificar a sua conta e vinculá-la ao seu parceiro(a).</li>
                <li><strong>Nome e Foto de Perfil:</strong> Usados para personalizar a interface e torná-la amigável para o uso do casal.</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed">
                Além disso, coletamos os dados financeiros que você insere manualmente no aplicativo (receitas, despesas, faturas, dívidas) para que a nossa Inteligência Artificial possa gerar o diagnóstico da "Operação de Choque".
              </p>
            </section>

            <section className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-yellow-500">2. Como Usamos as Suas Informações</h2>
              <p className="text-zinc-300 leading-relaxed">
                Nós utilizamos as suas informações exclusivamentes para:
              </p>
              <ul className="list-disc pl-5 text-zinc-300 space-y-2">
                <li>Prestar, operar e manter os serviços do aplicativo.</li>
                <li>Conectar o seu perfil ao do seu cônjuge para a formação do "Grupo Familiar".</li>
                <li>Alimentar o <em>Conselheiro IA</em> para que ele possa fornecer dicas financeiras contextualizadas sobre os dados inseridos.</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed font-bold">
                Nós nunca venderemos, alugaremos ou repassaremos seus dados financeiros ou e-mail para terceiros.
              </p>
            </section>

            <section className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-yellow-500">3. Segurança dos Dados</h2>
              <p className="text-zinc-300 leading-relaxed">
                Levamos a segurança da sua família a sério. Utilizamos provedores de ponta (Supabase e Vercel) com criptografia em trânsito e em repouso (SSL/TLS) para proteger suas senhas, sessões de autenticação e histórico financeiro contra acessos não autorizados. 
              </p>
            </section>

            <section className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-yellow-500">4. Seus Direitos (Revogação e Exclusão)</h2>
              <p className="text-zinc-300 leading-relaxed">
                Você é o dono dos seus dados. A qualquer momento, você pode:
              </p>
              <ul className="list-disc pl-5 text-zinc-300 space-y-2">
                <li>Revogar o acesso do nosso aplicativo na sua <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-yellow-500 underline">Conta do Google</a>.</li>
                <li>Solicitar a exclusão total da sua conta e de todos os registros financeiros associados no nosso banco de dados, enviando uma solicitação ou utilizando o botão de exclusão no aplicativo (quando disponível).</li>
              </ul>
            </section>

            <section className="space-y-4 mb-8">
              <h2 className="text-xl font-bold text-yellow-500">5. Contato</h2>
              <p className="text-zinc-300 leading-relaxed">
                Se você tiver qualquer dúvida sobre como tratamos seus dados ou sobre esta Política de Privacidade, sinta-se à vontade para nos contatar através do e-mail do desenvolvedor fornecido na tela de consentimento do Google.
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
