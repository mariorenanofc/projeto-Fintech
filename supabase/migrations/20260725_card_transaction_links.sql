-- =====================================================================
-- FASE 1: VÍNCULOS ESTRUTURADOS ENTRE TRANSAÇÕES, CARTÕES E FATURAS
-- =====================================================================
-- As novas colunas são inicialmente opcionais para preservar os registros
-- legados, que ainda usam metadados no campo description.

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS transaction_kind TEXT,
ADD COLUMN IF NOT EXISTS billing_month TEXT;

ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_transaction_kind_check,
ADD CONSTRAINT transactions_transaction_kind_check
CHECK (transaction_kind IS NULL OR transaction_kind IN ('income', 'expense', 'card_payment', 'transfer', 'goal_contribution'));

ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_billing_month_format_check,
ADD CONSTRAINT transactions_billing_month_format_check
CHECK (billing_month IS NULL OR billing_month ~ '^\d{4}-(0[1-9]|1[0-2])$');

CREATE INDEX IF NOT EXISTS idx_transactions_credit_card_id ON public.transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_billing_month ON public.transactions(family_group_id, billing_month);

COMMENT ON COLUMN public.transactions.credit_card_id IS 'Cartão usado na compra ou na quitação da fatura.';
COMMENT ON COLUMN public.transactions.transaction_kind IS 'Natureza financeira estruturada; não inferir por description em novos registros.';
COMMENT ON COLUMN public.transactions.billing_month IS 'Competência AAAA-MM da fatura associada à transação de cartão.';
