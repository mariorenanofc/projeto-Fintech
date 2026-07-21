-- =====================================================================
-- MIGRAÇÃO DE COLUNAS NATIVAS DE DATA PARA O BANCO DE DADOS FINTECH CASAL
-- =====================================================================

-- 1. Tabela de Receitas (incomes)
ALTER TABLE public.incomes 
ADD COLUMN IF NOT EXISTS receipt_day INTEGER CHECK (receipt_day >= 1 AND receipt_day <= 31);

-- 2. Tabela de Despesas Fixas (fixed_expenses)
ALTER TABLE public.fixed_expenses 
ADD COLUMN IF NOT EXISTS due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31);

-- 3. Tabela de Cartões de Crédito (credit_cards)
ALTER TABLE public.credit_cards 
ADD COLUMN IF NOT EXISTS closing_day INTEGER CHECK (closing_day >= 1 AND closing_day <= 31),
ADD COLUMN IF NOT EXISTS due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31);

-- 4. Tabela de Dívidas e Financiamentos (debts_and_financings)
ALTER TABLE public.debts_and_financings 
ADD COLUMN IF NOT EXISTS due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
ADD COLUMN IF NOT EXISTS next_due_date DATE;

-- COMENTÁRIOS E DOCUMENTAÇÃO DO ESQUEMA
COMMENT ON COLUMN public.incomes.receipt_day IS 'Dia mensal de recebimento da receita (1 a 31)';
COMMENT ON COLUMN public.fixed_expenses.due_day IS 'Dia mensal de vencimento da despesa (1 a 31)';
COMMENT ON COLUMN public.credit_cards.closing_day IS 'Dia mensal de fechamento/corte da fatura (1 a 31)';
COMMENT ON COLUMN public.credit_cards.due_day IS 'Dia mensal de vencimento da fatura do cartão (1 a 31)';
COMMENT ON COLUMN public.debts_and_financings.due_day IS 'Dia mensal de vencimento da parcela (1 a 31)';
COMMENT ON COLUMN public.debts_and_financings.next_due_date IS 'Data completa do próximo vencimento (AAAA-MM-DD)';
