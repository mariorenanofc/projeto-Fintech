-- =====================================================================
-- FASE 4: ADICIONAR SALDO EM CONTA CORRENTE NO PERFIL
-- =====================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_balance NUMERIC(12, 2) NOT NULL DEFAULT 0
CONSTRAINT profiles_account_balance_check CHECK (account_balance >= 0);

COMMENT ON COLUMN public.profiles.account_balance IS 'Saldo atual em conta corrente consolidado e informado pelo usuário para fluxo de caixa.';
