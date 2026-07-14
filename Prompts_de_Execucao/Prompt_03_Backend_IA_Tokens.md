Aja como um Arquiteto de Integrações Backend. 
Sua tarefa é desenhar as funções (Server Actions do Next.js ou Supabase Edge Functions) que controlam o assistente de inteligência artificial e a tokenização.

Requisitos do sistema:
1. Crie uma função que recebe uma pergunta do usuário no Chat de IA ou texto transcrito do WhatsApp.
2. Antes de chamar a API da LLM (ex: Google Gemini ou OpenAI), a função deve checar no Supabase (tabela `ai_tokens_wallet`) se o usuário possui saldo suficiente. Se não tiver, retorne um erro amigável (Status 402 Payment Required) com o link para recarga.
3. Envie para o modelo de IA o prompt contextualizado + os dados financeiros do usuário relativos àquele mês para gerar a análise (ex: "Posso pedir uma pizza hoje?").
4. Após o retorno da IA, desconte a quantidade de tokens utilizados (prompt + completion) da carteira do usuário.
5. Adicione suporte a cache com Redis/Upstash para armazenar as análises diárias da IA e evitar consultas repetitivas (economizando recursos do servidor e tokens).

Entregue o código TypeScript das funções e detalhe a lógica de validação.