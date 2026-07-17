-- =====================================================================
-- TABELA DE METAS & SONHOS DO CASAL (goals)
-- =====================================================================
-- Este script cria a tabela para gerenciar sonhos compartilhados e individuais,
-- incluindo a respectiva política de RLS (Row Level Security).

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index para ganho de performance
CREATE INDEX IF NOT EXISTS idx_goals_family_group_id ON public.goals(family_group_id);

-- Habilita RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Política de RLS: usuários gerenciam metas do seu grupo familiar
DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam metas do seu grupo" ON public.goals;
CREATE POLICY "Gerenciamento: usuários gerenciam metas do seu grupo"
  ON public.goals FOR ALL
  TO authenticated
  USING (family_group_id = public.get_my_family_group_id())
  WITH CHECK (family_group_id = public.get_my_family_group_id());
