Aja como um Desenvolvedor Frontend Sênior especialista em Next.js, React, TypeScript, Tailwind CSS e shadcn-ui.
Sua tarefa é construir a arquitetura inicial do frontend de um PWA financeiro para casais.

Requisitos da interface e código a serem gerados:
1. Configure o `manifest.json` e o `next.config.js` para garantir o funcionamento offline-first e a instalabilidade (PWA) sem fricção.
2. Crie o layout do Dashboard (Mobile First) que inclua:
   - Um widget de "Sinal Verde, Amarelo ou Vermelho" indicando se o usuário pode gastar no dia.
   - Um calendário unificado de contas a pagar.
3. Desenvolva o componente de Gamificação (Sistema de XP e Conquistas). 
   IMPORTANTE: O design das imagens e componentes das "badges" de conquista deve manter um estilo visual específico e uma paleta de cores baseada em temas amarelos (yellow-themed), garantindo total consistência visual em todo o aplicativo. Utilize classes do Tailwind para refletir esse tema (ex: bg-yellow-400, text-yellow-900, border-yellow-500).
4. Utilize o Middleware do Next.js para proteger rotas (`/dashboard`, `/chat-ia`) validando o token JWT do Supabase Auth.

Entregue a estrutura de pastas sugerida e os códigos dos principais componentes de UI utilizando shadcn-ui.