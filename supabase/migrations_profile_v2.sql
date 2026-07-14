-- =====================================================================
-- MIGRATION: MUDANÇAS E ATUALIZAÇÕES DO SCHEMA FINANCEIRO V2
-- =====================================================================
-- Este script adiciona suporte a parcelamentos variáveis/agendados e controle
-- de atrasos de faturas e parcelas.

-- 1. Alterações na tabela de Cartões de Crédito (credit_cards)
ALTER TABLE public.credit_cards 
ADD COLUMN IF NOT EXISTS invoices_schedule JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Alterações na tabela de Dívidas e Financiamentos (debts_and_financings)
ALTER TABLE public.debts_and_financings 
ADD COLUMN IF NOT EXISTS installments_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS overdue_installments INTEGER NOT NULL DEFAULT 0 CHECK (overdue_installments >= 0),
ADD COLUMN IF NOT EXISTS overdue_value_accumulated NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (overdue_value_accumulated >= 0);
