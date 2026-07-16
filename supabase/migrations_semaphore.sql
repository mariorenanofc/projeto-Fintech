-- =====================================================================
-- MIGRATION: ADICIONAR CAMPOS PARA MOTOR DE TRANSIÇÃO E REGRA 50/30/20
-- =====================================================================
-- Adiciona suporte para saldo de reserva financeira atual e investimentos totais
-- na tabela profiles.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reserva_financeira_atual NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (reserva_financeira_atual >= 0),
ADD COLUMN IF NOT EXISTS investimentos_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (investimentos_total >= 0);
