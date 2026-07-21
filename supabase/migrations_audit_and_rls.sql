-- =====================================================================
-- MIGRATION: REFORÇO DE RLS MULTI-TENANT E AUDITORIA IMUTÁVEL (COMPLIANCE)
-- =====================================================================

-- 1. REFORÇO DE POLÍTICAS DE RLS NAS TABELAS CRÍTICAS (transactions & goals)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para reconstrução estrita
DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam transações do seu grupo" ON public.transactions;
DROP POLICY IF EXISTS "Strict Tenant Select Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Strict Tenant Insert Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Strict Tenant Update Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Strict Tenant Delete Transactions" ON public.transactions;

-- Novas Políticas Granulares para Transações (Isolamento Cruzado por Grupo Familiar / Tenant)
CREATE POLICY "Strict Tenant Select Transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    family_group_id IN (
      SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Strict Tenant Insert Transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    family_group_id IN (
      SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Strict Tenant Update Transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (
    family_group_id IN (
      SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    family_group_id IN (
      SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Strict Tenant Delete Transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (
    family_group_id IN (
      SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Novas Políticas Granulares para Metas (goals)
DROP POLICY IF EXISTS "Gerenciamento: usuários gerenciam metas do seu grupo" ON public.goals;
DROP POLICY IF EXISTS "Strict Tenant Select Goals" ON public.goals;
DROP POLICY IF EXISTS "Strict Tenant Insert Goals" ON public.goals;
DROP POLICY IF EXISTS "Strict Tenant Update Goals" ON public.goals;
DROP POLICY IF EXISTS "Strict Tenant Delete Goals" ON public.goals;

CREATE POLICY "Strict Tenant Select Goals"
  ON public.goals FOR SELECT
  TO authenticated
  USING (
    family_group_id IN (
      SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Strict Tenant Insert Goals"
  ON public.goals FOR INSERT
  TO authenticated
  WITH CHECK (
    family_group_id IN (
      SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Strict Tenant Update Goals"
  ON public.goals FOR UPDATE
  TO authenticated
  USING (
    family_group_id IN (
      SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    family_group_id IN (
      SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Strict Tenant Delete Goals"
  ON public.goals FOR DELETE
  TO authenticated
  USING (
    family_group_id IN (
      SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
    )
  );


-- 2. TABELA DE AUDITORIA IMUTÁVEL (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_id UUID,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Permissões de Leitura e Inserção para Authenticated
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- TRAVAMENTO ESTRITO: Bloqueio absoluto de UPDATE e DELETE via API pública
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon, public;

-- Políticas de RLS para audit_logs
DROP POLICY IF EXISTS "Users can view audit logs performed by them" ON public.audit_logs;
CREATE POLICY "Users can view audit logs performed by them"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    performed_by = auth.uid() OR
    performed_by IN (
      SELECT id FROM public.profiles WHERE family_group_id IN (
        SELECT family_group_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    performed_by = auth.uid()
  );


-- 3. TRIGGER DE BANCO DE DADOS: AUDITORIA AUTOMÁTICA DE EXCLUSÃO DE TRANSAÇÃO
CREATE OR REPLACE FUNCTION public.log_transaction_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    performed_by,
    target_user_id,
    action,
    metadata,
    created_at
  ) VALUES (
    COALESCE(auth.uid(), OLD.profile_id),
    OLD.profile_id,
    'TRANSACTION_DELETED',
    jsonb_build_object(
      'transaction_id', OLD.id,
      'family_group_id', OLD.family_group_id,
      'description', OLD.description,
      'amount', OLD.amount,
      'type', OLD.type,
      'category', OLD.category,
      'date', OLD.date
    ),
    now()
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associa o Trigger à exclusão da tabela transactions
DROP TRIGGER IF EXISTS on_transaction_deleted ON public.transactions;
CREATE TRIGGER on_transaction_deleted
  AFTER DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_transaction_deletion();
