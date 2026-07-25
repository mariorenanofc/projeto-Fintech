-- =====================================================================
-- FASE 2: MODELAGEM DE PARCELAS DE DÍVIDAS E ENCARGOS DE ATRASO
-- =====================================================================

-- 1. Adicionar o método de cálculo de juros de atraso na tabela de dívidas
ALTER TABLE public.debts_and_financings
ADD COLUMN IF NOT EXISTS late_interest_method TEXT NOT NULL DEFAULT 'simple'
CONSTRAINT debts_late_interest_method_check CHECK (late_interest_method IN ('simple', 'compound'));

-- 2. Criar a tabela de parcelas de dívidas para acompanhamento detalhado de atrasos
CREATE TABLE IF NOT EXISTS public.debt_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    debt_id UUID NOT NULL REFERENCES public.debts_and_financings(id) ON DELETE CASCADE,
    billing_month TEXT NOT NULL CONSTRAINT debt_installments_billing_month_check CHECK (billing_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    due_date DATE NOT NULL,
    original_value NUMERIC(12, 2) NOT NULL CONSTRAINT debt_installments_original_value_check CHECK (original_value >= 0),
    penalty_applied NUMERIC(12, 2) NOT NULL DEFAULT 0 CONSTRAINT debt_installments_penalty_applied_check CHECK (penalty_applied >= 0),
    interest_accumulated NUMERIC(12, 2) NOT NULL DEFAULT 0 CONSTRAINT debt_installments_interest_accumulated_check CHECK (interest_accumulated >= 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CONSTRAINT debt_installments_amount_paid_check CHECK (amount_paid >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CONSTRAINT debt_installments_status_check CHECK (status IN ('pending', 'paid', 'overdue')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_debt_installments_debt_id ON public.debt_installments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_installments_family_group_status ON public.debt_installments(family_group_id, status);

-- 4. RLS (Row Level Security)
ALTER TABLE public.debt_installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam parcelas do seu grupo" ON public.debt_installments;
CREATE POLICY "Gerenciamento: usuários gerenciam parcelas do seu grupo"
  ON public.debt_installments FOR ALL
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id())
  WITH CHECK (family_group_id = public.get_my_family_group_id());

-- 5. Comentários para documentação de schema
COMMENT ON COLUMN public.debts_and_financings.late_interest_method IS 'Método de cálculo dos juros de mora (simple ou compound).';
COMMENT ON TABLE public.debt_installments IS 'Registro individual de parcelas de dívidas para cálculo auditável de juros e conciliação de atrasos.';
COMMENT ON COLUMN public.debt_installments.billing_month IS 'Mês de competência da parcela (AAAA-MM).';
COMMENT ON COLUMN public.debt_installments.penalty_applied IS 'Valor de multa cobrado/calculado uma única vez.';
COMMENT ON COLUMN public.debt_installments.interest_accumulated IS 'Valor de juros de mora acumulados sobre a parcela em atraso.';
