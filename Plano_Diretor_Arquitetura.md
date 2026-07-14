# Plano Diretor - SaaS de Gestão e Resgate Financeiro

## 1. Stack Tecnológico Principal
* **Frontend & PWA:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn-ui.
* **Backend & Banco de Dados:** Supabase (PostgreSQL, Realtime subscriptions, Edge Functions).
* **Autenticação:** Supabase Auth (Google OAuth).
* **Cache & Rate Limiting:** Redis (Upstash) para gerenciar tokens da IA e evitar sobrecarga de requisições.

## 2. Engenharia de Segurança e Estabilidade
* **Proteção de Dados (LGPD):** * Termos de uso explícitos sobre o processamento de dados financeiros pela IA.
    * Opção "Esquecer meus dados" (Hard Delete no Supabase).
    * Campos sensíveis (como descrições de dívidas) criptografados em repouso.
* **Isolamento de Inquilinos (Multi-tenant):** * Uso estrito de **Row Level Security (RLS)** no PostgreSQL. Um usuário ou cônjuge autenticado só pode realizar chamadas (SELECT, INSERT, UPDATE) nas linhas onde o `group_id` for correspondente ao seu casamento/parceria.
* **Estabilidade:**
    * Requisições pesadas da IA processadas em Edge Functions para não travar o frontend.
    * Middleware no Next.js para proteger rotas autenticadas antes da renderização da página.

## 3. Modelo de Negócios (Monetização)
* **Tier Gratuito (Freemium):** Uso irrestrito das funções de gestão. Inserção de dados manuais, PWA, dashboard compartilhado, calendário de lembretes e sistema de gamificação.
* **Tier IA (Tokenizado):** * Ao criar a conta, o casal recebe um pool inicial gratuito de "Tokens IA" (ex: 50.000 tokens).
    * Cada interação (entrada via áudio de WhatsApp ou perguntas ao conselheiro IA no dashboard) consome tokens.
    * Quando o limite grátis expira, o uso da IA é bloqueado até a aquisição de um pacote de recarga avulso (via Stripe ou Mercado Pago).

## 4. Gamificação e UX
* Sistema de XP e níveis baseado em comportamento financeiro positivo (ex: semanas sem usar cartão de crédito).
* As imagens das conquistas (badges) devem obrigatoriamente seguir um estilo visual padronizado, utilizando um esquema de cores centrado no tema amarelo (yellow-themed) para manter a identidade visual e consistência na interface.