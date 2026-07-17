# Casal Fintech - SaaS de Gestão & Sintonia Financeira

Uma plataforma SaaS inteligente de gestão financeira compartilhada para casais, projetada com inteligência artificial para traçar estratégias de orçamento, semáforo financeiro, agendamentos automáticos e mecânicas de gamificação.

---

## 🏗️ Estrutura do Projeto & Arquitetura

O projeto adota uma arquitetura Next.js limpa (Clean/Clear Architecture), separando de forma explícita a lógica de servidor (Server Actions), as rotas da aplicação (App Router), e os componentes de interface desacoplados.

```
├── public/                 # Assets públicos, ícones e PWA Manifest
├── supabase/               # Esquemas SQL e migrações do Supabase
├── src/
│   ├── actions/            # Server Actions (IA, Supabase, Google Calendar)
│   ├── app/                # App Router (Páginas de rotas e APIs)
│   │   ├── api/            # Endpoints de webhook (RISC, etc.)
│   │   ├── chat/           # Interface do Conselheiro IA
│   │   ├── dashboard/      # Painel de Sintonia Principal
│   │   ├── onboarding/     # Diagnóstico Financeiro Inicial
│   │   └── profile/        # Gestão de Perfil do Casal
│   ├── components/         # Componentes React Modulares
│   │   ├── dashboard/      # Subcomponentes do Dashboard (Header, Semáforo, etc.)
│   │   └── ui/             # Componentes base e primitivos de UI (shadcn)
│   ├── lib/                # Configurações de clientes (Supabase, helpers)
│   ├── types/              # Definições globais de tipos do TypeScript
│   └── middleware.ts       # Controle de acesso e proteção de rotas
├── AGENTS.md               # Diretrizes de desenvolvimento dos agentes
└── Plano_Diretor_Arquitetura.md # Documentação de infra e stack
```

---

## ⚡ Principais Funcionalidades

1. **Painel de Sintonia (Dashboard):**
   * **Semáforo Financeiro:** Indicador visual inteligente do ritmo de gastos do casal (Estágios: *Vermelho* para Choque/Resgate, *Amarelo* para Fundo de Segurança e *Verde* para Prosperidade).
   * **Conselheiro IA Integrado:** Geração reativa de dicas e renegociações usando inteligência artificial, acompanhado de explicação detalhada por áudio via sintetizador.
   * **Alocação Crítica:** Separação automática de despesas prioritárias para liquidação imediata em fases de aperto.

2. **Calendário Conjugal Compartilhado:**
   * Visualização interativa dos dias de vencimento de faturas, contas fixas e empréstimos.
   * Agendamento integrado em um clique com o **Google Calendar** de ambos os parceiros.

3. **Gamificação:**
   * Acúmulo de XP e evolução de nível baseados em comportamento financeiro saudável (ex: poupar saldo, bater metas de reserva).
   * Conquista de distintivos (*badges*) visuais personalizados.

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** Next.js 14 (App Router)
* **Linguagem:** TypeScript
* **Estilização:** Tailwind CSS (com esquema de cores *yellow-themed* premium e *glassmorphism*)
* **Banco de Dados & Auth:** Supabase (Auth + PostgreSQL + RLS ativo por grupo familiar)
* **Biblioteca de Ícones:** Lucide React

---

## 🚀 Como Executar Localmente

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env.local` na raiz com os seguintes parâmetros:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=seu_url_do_supabase
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_do_supabase
   GEMINI_API_KEY=sua_chave_do_google_gemini
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.
