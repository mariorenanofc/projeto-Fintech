-- =====================================================================
-- FASE 5: EVOLUÇÃO DE METAS, ALOCAÇÕES E HISTÓRICO DE APORTES
-- =====================================================================

-- 1. Adicionar colunas de controle financeiro detalhado na tabela de metas
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 1 CONSTRAINT goals_priority_check CHECK (priority > 0),
ADD COLUMN IF NOT EXISTS monthly_planned_contribution NUMERIC(12, 2) NOT NULL DEFAULT 0 CONSTRAINT goals_monthly_contrib_check CHECK (monthly_planned_contribution >= 0),
ADD COLUMN IF NOT EXISTS allocation_percent NUMERIC(5, 2) NOT NULL DEFAULT 0 CONSTRAINT goals_allocation_pct_check CHECK (allocation_percent >= 0 AND allocation_percent <= 100),
ADD COLUMN IF NOT EXISTS target_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CONSTRAINT goals_status_check CHECK (status IN ('active', 'completed', 'paused'));

-- 2. Criar a tabela de movimentações (aportes/resgates) de metas
CREATE TABLE IF NOT EXISTS public.goal_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    type TEXT NOT NULL CONSTRAINT goal_tx_type_check CHECK (type IN ('contribution', 'withdrawal')),
    amount NUMERIC(12, 2) NOT NULL CONSTRAINT goal_tx_amount_check CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_goal_tx_goal_id ON public.goal_transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_tx_family_group_id ON public.goal_transactions(family_group_id);

-- 4. Habilitar RLS e criar políticas de acesso
ALTER TABLE public.goal_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam movimentações de metas do seu grupo" ON public.goal_transactions;
CREATE POLICY "Gerenciamento: usuários gerenciam movimentações de metas do seu grupo"
  ON public.goal_transactions FOR ALL
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id())
  WITH CHECK (family_group_id = public.get_my_family_group_id());

-- 5. Trigger para atualizar automaticamente a coluna goals.current_amount baseada em goal_transactions
CREATE OR REPLACE FUNCTION public.update_goal_current_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'contribution' THEN
            UPDATE public.goals 
            SET current_amount = current_amount + NEW.amount
            WHERE id = NEW.goal_id;
        ELSIF NEW.type = 'withdrawal' THEN
            UPDATE public.goals 
            SET current_amount = GREATEST(0, current_amount - NEW.amount)
            WHERE id = NEW.goal_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'contribution' THEN
            UPDATE public.goals 
            SET current_amount = GREATEST(0, current_amount - OLD.amount)
            WHERE id = OLD.goal_id;
        ELSIF OLD.type = 'withdrawal' THEN
            UPDATE public.goals 
            SET current_amount = current_amount + OLD.amount
            WHERE id = OLD.goal_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_goal_current_amount ON public.goal_transactions;
CREATE TRIGGER trg_update_goal_current_amount
AFTER INSERT OR DELETE ON public.goal_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_goal_current_amount();

-- 6. Comentários explicativos
COMMENT ON COLUMN public.goals.priority IS 'Prioridade de execução da meta pelo casal.';
COMMENT ON COLUMN public.goals.monthly_planned_contribution IS 'Valor planejado para aporte mensal recorrente.';
COMMENT ON COLUMN public.goals.allocation_percent IS 'Percentual de alocação de aportes automáticos livres (teto 100%).';
COMMENT ON COLUMN public.goals.status IS 'Status da meta (active, completed, paused).';
COMMENT ON TABLE public.goal_transactions IS 'Histórico auditável de aportes e resgates aplicados a cada meta.';
