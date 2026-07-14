-- =====================================================================
-- TABELAS DO FLUXO DE ONBOARDING E ESTRATÉGIA FINANCEIRA
-- =====================================================================
-- Este script estende o banco de dados inicial do projeto para suportar
-- receitas, despesas essenciais, cartões de crédito e financiamentos/dívidas.

-- 1. Tabela: Receitas (incomes)
CREATE TABLE IF NOT EXISTS public.incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    owner TEXT NOT NULL, -- Nome do responsável (ex: Parceiro A, Parceiro B)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela: Despesas Fixas Essenciais (fixed_expenses)
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- Categorias: 'Água', 'Luz', 'Internet', 'Telefonia', 'Feira/Mercado', 'Combustível', ou 'Customizada'
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela: Cartões de Crédito (credit_cards)
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Nome da Instituição
    total_limit NUMERIC(12, 2) NOT NULL CHECK (total_limit >= 0),
    current_invoice NUMERIC(12, 2) NOT NULL CHECK (current_invoice >= 0),
    next_invoice NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (next_invoice >= 0), -- Fatura do próximo mês
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garante a criação da coluna caso a tabela já existisse de execuções anteriores sem a coluna
ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS next_invoice NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (next_invoice >= 0);

-- 4. Tabela: Dívidas, Consórcios, Financiamentos, Terrenos e Locais (debts_and_financings)
CREATE TABLE IF NOT EXISTS public.debts_and_financings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    acquisition_value NUMERIC(12, 2) NOT NULL CHECK (acquisition_value >= 0),
    total_installments INTEGER NOT NULL CHECK (total_installments > 0),
    current_installment_value NUMERIC(12, 2) NOT NULL CHECK (current_installment_value >= 0),
    monthly_late_interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (monthly_late_interest_rate >= 0), -- Taxa de juros mensal por atraso (%)
    penalty_value NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (penalty_value >= 0), -- Valor da multa por atraso
    installments_paid INTEGER NOT NULL DEFAULT 0 CHECK (installments_paid >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes para ganho de performance
CREATE INDEX IF NOT EXISTS idx_incomes_family_group_id ON public.incomes(family_group_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_family_group_id ON public.fixed_expenses(family_group_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_family_group_id ON public.credit_cards(family_group_id);
CREATE INDEX IF NOT EXISTS idx_debts_and_financings_family_group_id ON public.debts_and_financings(family_group_id);

-- =====================================================================
-- 2. HABILITAÇÃO E CONFIGURAÇÃO DO ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts_and_financings ENABLE ROW LEVEL SECURITY;

-- Exclui políticas antigas se existirem para evitar erros de duplicidade
DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam receitas do seu grupo" ON public.incomes;
DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam despesas fixas do seu grupo" ON public.fixed_expenses;
DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam cartões do seu grupo" ON public.credit_cards;
DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam dívidas do seu grupo" ON public.debts_and_financings;

-- Cria políticas para incomes
CREATE POLICY "Gerenciamento: usuários gerenciam receitas do seu grupo"
  ON public.incomes FOR ALL
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id())
  WITH CHECK (family_group_id = public.get_my_family_group_id());

-- Cria políticas para fixed_expenses
CREATE POLICY "Gerenciamento: usuários gerenciam despesas fixas do seu grupo"
  ON public.fixed_expenses FOR ALL
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id())
  WITH CHECK (family_group_id = public.get_my_family_group_id());

-- Cria políticas para credit_cards
CREATE POLICY "Gerenciamento: usuários gerenciam cartões do seu grupo"
  ON public.credit_cards FOR ALL
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id())
  WITH CHECK (family_group_id = public.get_my_family_group_id());

-- Cria políticas para debts_and_financings
CREATE POLICY "Gerenciamento: usuários gerenciam dívidas do seu grupo"
  ON public.debts_and_financings FOR ALL
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id())
  WITH CHECK (family_group_id = public.get_my_family_group_id());
