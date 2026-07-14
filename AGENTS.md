Atue como Especialista em UI/UX e CSS Grid. A funcionalidade e as cores do nosso src/app/dashboard/page.tsx estão aprovadas e não devem ser alteradas (mantenha todo o esquema yellow-themed, bg-zinc, glassmorphism e cores exatas). No entanto, o layout estrutural está desorganizado.

Refatore apenas as classes de estrutura (Grid, Flex, Padding, Margins, Width) seguindo estas 4 regras:

O Calendário Espremido (Urgente): A tabela do react-day-picker está encavalando os dias e os números. Dê mais espaço para a coluna do calendário. Se necessário, altere o grid interno dessa seção (ex: mude de md:col-span-5 para algo mais largo ou utilize min-w-fit) para que os dias fiquem legíveis. Aumente o gap entre o calendário e a lista de vencimentos.

Alinhamento dos Botões Inferiores: Os botões 'Conselheiro IA' e 'Ganha +50 XP' estão parecendo soltos. Ajuste a largura do container deles para alinhar perfeitamente com a largura exata do card 'Orçamento Diário' logo acima deles.

Respiro dos Cards (Whitespace): Aumente levemente o padding interno dos CardContent (adicione p-5 ou p-6), dando mais espaço para os elementos respirarem longe das bordas translúcidas.

Alinhamento das Colunas Principais: Garanta que a coluna da esquerda (Semáforo) e a da direita (Gamificação + Calendário) utilizem h-full ou flexbox para não parecerem "quebradas" dependendo do tamanho da tela.

Entregue o código atualizado mantendo estritamente a estilização visual atual.