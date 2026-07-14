-- =====================================================================
-- PLANO DIRETOR DO BANCO DE DADOS - SAAS FINANCEIRO PARA CASAIS
-- =====================================================================
-- Este script configura o banco de dados PostgreSQL no Supabase,
-- incluindo tabelas, funções auxiliares, triggers automatizados e
-- políticas rigorosas de Row Level Security (RLS).

-- Habilita a extensão pgcrypto para criptografia no nível de coluna, se necessário
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Limpeza prévia de objetos existentes para evitar conflitos no re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_ai_call_logged ON public.ai_calls_log;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_ai_call_tokens_deduction() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_family_group_id() CASCADE;

DROP TABLE IF EXISTS public.ai_calls_log CASCADE;
DROP TABLE IF EXISTS public.ai_tokens_wallet CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.family_groups CASCADE;

-- =====================================================================
-- 1. ESTRUTURA DE TABELAS (SCHEMA)
-- =====================================================================

-- Tabela: Grupos Familiares (União de casais/parcerias)
CREATE TABLE public.family_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Minha Família',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: Perfis de Usuários (Extensão do auth.users do Supabase Auth)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE RESTRICT,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: Transações Financeiras (Receitas/Despesas compartilhadas)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    description TEXT NOT NULL, -- Descrição sensível
    category TEXT NOT NULL DEFAULT 'Geral',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: Carteira de Tokens de IA (Gestão de saldo do casal)
CREATE TABLE public.ai_tokens_wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL UNIQUE REFERENCES public.family_groups(id) ON DELETE CASCADE,
    balance INT NOT NULL DEFAULT 50000 CHECK (balance >= 0), -- Garante saldo não-negativo em nível de DB
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela: Logs de Uso da IA (Para auditoria e triggers de desconto)
CREATE TABLE public.ai_calls_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prompt_tokens INT NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
    completion_tokens INT NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
    total_tokens INT GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
    action_type TEXT NOT NULL DEFAULT 'chat' CHECK (action_type IN ('chat', 'whatsapp_audio', 'whatsapp_text')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes para ganho de performance em consultas frequentes
CREATE INDEX idx_profiles_family_group_id ON public.profiles(family_group_id);
CREATE INDEX idx_transactions_family_group_id ON public.transactions(family_group_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_ai_calls_log_family_group_id ON public.ai_calls_log(family_group_id);

-- =====================================================================
-- 2. FUNÇÕES E TRIGGERS DE AUTOMAÇÃO
-- =====================================================================

-- Função auxiliar otimizada para pegar o family_group_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_my_family_group_id()
RETURNS UUID AS $$
  SELECT family_group_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger: Executado após a criação do usuário no Supabase Auth.
-- Cria automaticamente o grupo familiar, o perfil do usuário e a carteira de tokens.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_group_id UUID;
BEGIN
  -- 1. Cria o grupo familiar inicial com nome genérico
  INSERT INTO public.family_groups (name)
  VALUES ('Minha Família')
  RETURNING id INTO new_family_group_id;

  -- 2. Cria o perfil do usuário apontando para o grupo familiar criado
  INSERT INTO public.profiles (id, family_group_id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    new_family_group_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  );

  -- 3. Inicializa a carteira com o saldo de 50.000 tokens iniciais
  INSERT INTO public.ai_tokens_wallet (family_group_id, balance)
  VALUES (new_family_group_id, 50000);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associa o trigger ao auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Executado após registrar uma chamada da IA.
-- Deduz o total de tokens gastos da carteira do casal/grupo.
CREATE OR REPLACE FUNCTION public.handle_ai_call_tokens_deduction()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza o saldo da carteira do grupo correspondente
  UPDATE public.ai_tokens_wallet
  SET balance = balance - NEW.total_tokens,
      updated_at = now()
  WHERE family_group_id = NEW.family_group_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associa o trigger à tabela public.ai_calls_log
CREATE TRIGGER on_ai_call_logged
  AFTER INSERT ON public.ai_calls_log
  FOR EACH ROW EXECUTE FUNCTION public.handle_ai_call_tokens_deduction();

-- =====================================================================
-- 3. POLÍTICAS DE ROW LEVEL SECURITY (RLS) - MULTI-TENANT ISOLATION
-- =====================================================================

-- Habilita RLS em todas as tabelas públicas
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tokens_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_calls_log ENABLE ROW LEVEL SECURITY;

-- Políticas para: family_groups
CREATE POLICY "Visualização: usuários podem ler o próprio grupo"
  ON public.family_groups FOR SELECT
  TO authenticated
  USING (id = public.get_my_family_group_id());

CREATE POLICY "Alteração: usuários podem atualizar o próprio grupo"
  ON public.family_groups FOR UPDATE
  TO authenticated
  USING (id = public.get_my_family_group_id())
  WITH CHECK (id = public.get_my_family_group_id());

-- Políticas para: profiles
CREATE POLICY "Visualização: usuários podem ler perfis do mesmo grupo"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id());

CREATE POLICY "Alteração: usuários podem atualizar o próprio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Políticas para: transactions
CREATE POLICY "Gerenciamento: usuários gerenciam transações do seu grupo"
  ON public.transactions FOR ALL
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id())
  WITH CHECK (family_group_id = public.get_my_family_group_id());

-- Políticas para: ai_tokens_wallet
CREATE POLICY "Visualização: usuários leem o saldo da carteira do grupo"
  ON public.ai_tokens_wallet FOR SELECT
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id());

-- Políticas para: ai_calls_log
CREATE POLICY "Visualização: usuários leem histórico de IA do seu grupo"
  ON public.ai_calls_log FOR SELECT
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id());

CREATE POLICY "Inserção: usuários ou sistema criam log para o próprio grupo"
  ON public.ai_calls_log FOR INSERT
  TO authenticated
  WITH CHECK (
    family_group_id = public.get_my_family_group_id() AND
    profile_id = auth.uid()
  );
