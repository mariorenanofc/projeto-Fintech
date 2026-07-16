-- =====================================================================
-- MIGRATION: ADICIONAR CLASSIFICAÇÃO DE DÍVIDAS (TÓXICA VS ESTRUTURAL)
-- =====================================================================
-- Adiciona a coluna tipo_divida com padrão 'toxica' na tabela debts_and_financings

ALTER TABLE public.debts_and_financings 
ADD COLUMN IF NOT EXISTS tipo_divida VARCHAR(30) NOT NULL DEFAULT 'toxica';
