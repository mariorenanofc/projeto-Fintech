-- =====================================================================
-- FASE 3: ESTRUTURAÇÃO DE CICLOS DE CARTÃO E PARCELAMENTO DE COMPRAS
-- =====================================================================

-- 1. Criar a tabela de faturas estruturadas por competência
CREATE TABLE IF NOT EXISTS public.credit_card_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    billing_month TEXT NOT NULL CONSTRAINT cc_statements_billing_month_check CHECK (billing_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    closing_date DATE NOT NULL,
    due_date DATE NOT NULL,
    predicted_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CONSTRAINT cc_statements_predicted_amount_check CHECK (predicted_amount >= 0),
    actual_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CONSTRAINT cc_statements_actual_amount_check CHECK (actual_amount >= 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CONSTRAINT cc_statements_amount_paid_check CHECK (amount_paid >= 0),
    status TEXT NOT NULL DEFAULT 'open' CONSTRAINT cc_statements_status_check CHECK (status IN ('open', 'closed', 'paid', 'overdue')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT cc_statements_unique_card_month UNIQUE(credit_card_id, billing_month)
);

-- 2. Criar a tabela de parcelamento de compras feitas no cartão
CREATE TABLE IF NOT EXISTS public.credit_card_purchase_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    credit_card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL CONSTRAINT cc_purchase_inst_number_check CHECK (installment_number > 0),
    total_installments INTEGER NOT NULL CONSTRAINT cc_purchase_inst_total_check CHECK (total_installments > 0),
    amount NUMERIC(12, 2) NOT NULL CONSTRAINT cc_purchase_amount_check CHECK (amount >= 0),
    billing_month TEXT NOT NULL CONSTRAINT cc_purchase_billing_month_check CHECK (billing_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT cc_purchase_inst_number_lte_total CHECK (installment_number <= total_installments)
);

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_cc_statements_card_month ON public.credit_card_statements(credit_card_id, billing_month);
CREATE INDEX IF NOT EXISTS idx_cc_statements_family_status ON public.credit_card_statements(family_group_id, status);
CREATE INDEX IF NOT EXISTS idx_cc_purchase_inst_transaction_id ON public.credit_card_purchase_installments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_cc_purchase_inst_card_month ON public.credit_card_purchase_installments(credit_card_id, billing_month);

-- 4. RLS (Row Level Security)
ALTER TABLE public.credit_card_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_purchase_installments ENABLE ROW LEVEL SECURITY;

-- Políticas para credit_card_statements
DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam faturas do seu grupo" ON public.credit_card_statements;
CREATE POLICY "Gerenciamento: usuários gerenciam faturas do seu grupo"
  ON public.credit_card_statements FOR ALL
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id())
  WITH CHECK (family_group_id = public.get_my_family_group_id());

-- Políticas para credit_card_purchase_installments
DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam parcelas de cartão do seu grupo" ON public.credit_card_purchase_installments;
CREATE POLICY "Gerenciamento: usuários gerenciam parcelas de cartão do seu grupo"
  ON public.credit_card_purchase_installments FOR ALL
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id())
  WITH CHECK (family_group_id = public.get_my_family_group_id());

-- 5. Comentários para documentação de schema
COMMENT ON TABLE public.credit_card_statements IS 'Histórico consolidado de faturas de cartão de crédito por mês de competência.';
COMMENT ON TABLE public.credit_card_purchase_installments IS 'Detalhamento de parcelas de compras a prazo realizadas com cartão de crédito.';
COMMENT ON COLUMN public.credit_card_statements.billing_month IS 'Mês de vencimento da fatura (AAAA-MM).';
COMMENT ON COLUMN public.credit_card_purchase_installments.billing_month IS 'Mês de competência de vencimento desta parcela específica (AAAA-MM).';
