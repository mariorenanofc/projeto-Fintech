Aja como um Engenheiro de Software Sênior especialista em Supabase e PostgreSQL. 
Sua tarefa é criar o script SQL inicial para um sistema SaaS financeiro focado em casais, garantindo conformidade com a LGPD e segurança extrema contra acessos indevidos.

Requisitos técnicos a serem gerados:
1. Crie as tabelas: `profiles` (conectada ao auth.users), `family_groups` (para unir casais), `transactions` (receitas/despesas) e `ai_tokens_wallet` (saldo de tokens).
2. Implemente Row Level Security (RLS) rigoroso em todas as tabelas. Um usuário só pode acessar dados se o seu `profile_id` pertencer ao `family_group_id` da transação.
3. Crie uma função (Trigger) que desconta o saldo da tabela `ai_tokens_wallet` sempre que uma chamada de IA for registrada.
4. O sistema usa Google Auth, certifique-se de que a estrutura `profiles` espere a inserção no primeiro login (trigger `after insert` no `auth.users`).

Entregue o código SQL limpo, comentado e otimizado para produção.