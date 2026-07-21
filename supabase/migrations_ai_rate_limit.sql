-- Tabela para log de requisições de IA e controle de Rate Limiting (FinOps)
CREATE TABLE IF NOT EXISTS public.ai_requests_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL DEFAULT 'chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para buscas rápidas por janela de tempo (1 hora)
CREATE INDEX IF NOT EXISTS idx_ai_requests_log_user_created ON public.ai_requests_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_requests_log_family_created ON public.ai_requests_log(family_group_id, created_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.ai_requests_log ENABLE ROW LEVEL SECURITY;

-- Política RLS: Usuários podem visualizar e registrar requisições de seu próprio perfil/grupo
CREATE POLICY "Users can insert and view their own AI requests log"
ON public.ai_requests_log
FOR ALL
USING (
  auth.uid() = user_id OR 
  family_group_id IN (SELECT family_group_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  auth.uid() = user_id OR 
  family_group_id IN (SELECT family_group_id FROM public.profiles WHERE id = auth.uid())
);
