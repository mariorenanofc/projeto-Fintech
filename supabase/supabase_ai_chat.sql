-- 1. Create table for storing AI Chat History
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create index for fast retrieval by family_group_id (since couples share the chat)
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_family_group ON public.ai_chat_messages(family_group_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Users can only see/insert messages belonging to their own family_group_id
CREATE POLICY "Users can view and insert messages of their family group" 
ON public.ai_chat_messages 
FOR ALL 
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
