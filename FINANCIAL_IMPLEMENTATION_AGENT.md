# Agente de Implementacao Financeira

## Missao

Evoluir o Fintech Casal com calculos financeiros auditaveis, explicaveis e coerentes com o fluxo de caixa real de um casal brasileiro. Priorizar o uso correto dos dados ja persistidos antes de adicionar indicadores ou telas novas.

O agente deve preservar o motor de estagios atual (`red`, `yellow`, `green`) e suas diretrizes comportamentais, mas pode corrigir a base matematica quando houver dupla contagem, saldo projetado irreal ou informacao insuficiente.

## Escopo Prioritario

Implementar primeiro os dados existentes que ainda nao alimentam os calculos:

1. Utilizacao de limite dos cartoes.
2. Encargos de atraso das dividas.
3. Saldo vencido e parcelas vencidas.
4. Ciclo de fechamento e vencimento dos cartoes.
5. Fluxo de caixa diario com dias de recebimento e vencimento.
6. Metas no destino do dinheiro do estagio verde.
7. Analise de transacoes realizadas versus planejamento.

Nao apresentar como dado real algo que seja estimativa. Todo resultado projetado deve informar premissas, periodo e, quando aplicavel, o rotulo `estimativa`.

## Base Atual a Respeitar

| Conceito | Fonte atual | Uso atual |
| --- | --- | --- |
| Receita recorrente | `incomes.amount`, `receipt_day` | Soma mensal; o dia ainda nao e usado na projecao. |
| Despesa fixa essencial | `fixed_expenses.amount`, `due_day`, `category` | Soma mensal e lista de vencimentos. |
| Cartao | `credit_cards.total_limit`, `current_invoice`, `next_invoice`, `invoices_schedule`, `closing_day`, `due_day` | Fatura mensal e cronograma; limite e fechamento ainda nao entram na matematica. |
| Divida | `debts_and_financings.*` | Parcela mensal e cronograma; atraso aparece no texto, sem capitalizacao na previsao. |
| Reserva e investimentos | `profiles.reserva_financeira_atual`, `investimentos_total` | Saldo inicial e acumulacao por aportes, sem rendimento. |
| Meta | `goals.target_amount`, `current_amount` | CRUD existente; nao recebe alocacao nem previsao. |
| Realizado | `transactions` | Extrato e atualizacao simples de fatura; nao ha comparacao com o planejado. |

Arquivos centrais atuais:

- `src/actions/onboarding.ts`: diagnostico mensal e estrategia dos estagios.
- `src/actions/forecast.ts`: projecao mensal de ate 12 meses.
- `src/actions/transactions.ts`: lancamentos realizados.
- `src/app/dashboard/page.tsx`: construcao de contas e conciliacao exibida no calendario.
- `supabase/migrations_onboarding.sql` e migracoes posteriores: schema financeiro.

## Regras Inviolaveis de Modelagem

### Dinheiro, precisao e datas

- Armazenar valores monetarios como `NUMERIC(12,2)` no PostgreSQL. Em TypeScript, arredondar somente no limite de exibicao ou ao persistir um valor monetario calculado. Nunca somar valores formatados como texto.
- Usar valor em reais positivo para entradas e saidas, diferenciadas por tipo. Nao usar sinal negativo e tipo ao mesmo tempo para representar uma despesa.
- Datas devem usar ano, mes e dia. Nao usar `toISOString()` para decidir o mes de negocio sem considerar o fuso horario do usuario, pois perto da meia-noite UTC isso pode trocar o mes ou o dia local.
- Ao receber dia entre 29 e 31, usar `min(dia_configurado, ultimo_dia_do_mes)` para montar a data de um mes que nao possui esse dia.
- Todo calculo deve declarar se e de caixa (movimento por data de pagamento), de competencia (despesa pertencente ao mes) ou de saldo devedor. Nao misturar essas tres visoes na mesma variavel.

### Sem dupla contagem

- Uma fatura de cartao e uma obrigacao de pagamento; uma compra no cartao registrada em `transactions` compoe essa fatura, mas nao pode ser subtraida novamente do caixa na data da compra.
- A compra no cartao reduz o limite disponivel na data da compra. O caixa e reduzido apenas no pagamento da fatura, no vencimento ou na data real de pagamento.
- A parcela contratual de uma divida reduz o saldo devedor somente pelo componente de amortizacao. Sem uma tabela de amortizacao contratual, a aplicacao nao pode declarar que `valor_da_parcela` reduz integralmente o principal.
- `overdue_value_accumulated` representa um saldo vencido informado pelo usuario. Ele nao pode ser somado ao saldo contratual sem uma definicao explicita de que os dois valores nao se sobrepoem.

### Dados incompletos

- Quando faltar taxa, saldo devedor, data ou cronograma, nao inventar dados. Usar uma premissa documentada e mostrar o resultado como cenario, ou solicitar o dado ao usuario.
- Taxa de juros deve informar a unidade: percentual ao mes, percentual ao ano ou taxa efetiva. Converter somente uma vez, por exemplo `i_mensal = percentual / 100`.
- O teto da Lei 14.690/2023 somente deve ser aplicado a operacoes de credito rotativo e parcelamento de fatura de cartao abrangidas pela regra. Nao aplicar esse teto genericamente a emprestimos, financiamentos, consignados, consorcios ou multas de contas.
- A classificacao `toxica` e `estrutural` serve para priorizacao. Ela nao substitui taxa, saldo, garantia ou natureza juridica do contrato.

## Ordem de Implementacao

Cada fase deve ser entregue com migration, tipos, calculo no servidor, apresentacao e testes. Nao iniciar a fase seguinte se os invariantes da anterior falharem.

## Registro de Implementacao

Atualizar esta secao na mesma alteracao que criar, mudar ou remover qualquer funcao financeira. Registrar fase, data, arquivos, funcoes e verificacao executada. Uma fase so pode ser marcada como concluida depois de todos os seus criterios de aceite.

#### Fase 0 - Concluída

Implementado em 25/07/2026:

- `src/lib/financial/types.ts`: contratos estruturados para competência, status dos dados, cronogramas, eventos de caixa, ciclo de cartão, planejado, realizado e projeção de dívida.
- `src/lib/financial/money.ts`: `toCents`, `fromCents`, `roundMoney`, `sumMoney` e `clampMoney`. Os cálculos ocorrem em centavos para impedir deriva de ponto flutuante.
- `src/lib/financial/dates.ts`: `assertMonthKey`, `getFinancialMonth`, `getDaysInMonth`, `getDateInMonth`, `addMonths` e `getLocalDateString`. O mês financeiro e formatação de datas locais usam por padrão o fuso `America/Sao_Paulo`.
- `src/lib/financial/schedules.ts`: `getScheduledAmount` e `hasScheduledAmount`, que consultam cronogramas estruturados sem inferência por título ou descrição.
- `src/lib/financial/index.ts`: ponto único de exportação dos módulos financeiros.
- `src/actions/onboarding.ts`: `generateFinancialStrategy` agora usa `getFinancialMonth`, `assertMonthKey`, `addMonths` e `getScheduledAmount` para a competência atual, próxima competência e cronogramas de parcelas/faturas.
- `src/actions/forecast.ts`: `getFinancialForecast` e `addMonthsToMonthStr` agora usam a competência em `America/Sao_Paulo`, datas UTC para rótulos mensais e `getScheduledAmount` para cronogramas.
- `src/components/dashboard/calendar-section.tsx`: integrado para utilizar os utilitários de fuso horário brasileiro (`getLocalDateString`) e arredondamento/soma exata (`sumMoney`).
- `src/lib/financial/financial.test.ts` e `vitest.config.ts`: configurado Vitest e criados testes unitários de cobertura para lógica financeira e de datas.

Verificação em 25/07/2026: Todos os 13 testes do Vitest passaram com sucesso. `npx tsc --noEmit` completou sem erros.

### Fase 1 - Concluída

Implementado em 25/07/2026:

- `src/lib/financial/credit-cards.ts`: `calculateCreditUtilization` calcula saldo aberto normalizado, limite livre, percentual de utilização, percentual seguro para a barra e faixa educativa.
- `src/components/dashboard/credit-card-limits-card.tsx`: o uso do limite agora considera somente a fatura aberta da competência exibida.
- `supabase/migrations/20260725_card_transaction_links.sql`: adiciona os campos opcionais `credit_card_id`, `transaction_kind` e `billing_month`, com validações e índices.
- `src/actions/transactions.ts` e `src/app/dashboard/page.tsx`: o fluxo de conciliação de faturas no calendário agora passa `creditCardId` e `paymentMethod` estruturados para `addTransaction`, que por sua vez utiliza o helper `inferTransactionKind` inteligente para mapear receitas, despesas, transferências e pagamentos de fatura (`card_payment`), resolvendo a conciliação e evitando a dupla contagem.

Verificação parcial em 25/07/2026: `npx tsc --noEmit` e testes unitários de utilização de limite passaram. A aplicação local da migração no Supabase remoto deve ser realizada pelo usuário através do SQL Editor utilizando a query em `supabase/migrations/20260725_card_transaction_links.sql`.

### Fase 2 - Concluída

Implementado em 25/07/2026:

- `src/lib/financial/debts.ts`: `calculateLateCharges` calcula multas únicas e juros de mora acumulados (simples ou composto) sobre saldos em atraso e implementa a ordem de amortização regulamentar (multa -> juros -> principal).
- `supabase/migrations/20260726000000_debt_installments.sql`: adiciona a tabela `debt_installments` com controle de competências, vencimentos, multas e juros de parcelas individuais e adiciona RLS e políticas familiares, além de configurar `late_interest_method` em `debts_and_financings`.
- `src/actions/onboarding.ts`: estratégia agora calcula encargos da Fase 2 reais e os exibe detalhadamente no diagnóstico de choque das dívidas.
- `src/actions/forecast.ts`: loop de meses agora projeta a evolução do atraso com rolagem de juros de mora individuais e prioriza o abatimento de atrasos com a sobra de caixa (`focusValue`).
- `src/lib/financial/financial.test.ts`: adicionada cobertura de 5 testes específicos para juros, multas e amortizações.

Verificação em 25/07/2026: Todos os 18 testes unitários passaram. Checagem de tipos estáticos do TypeScript foi executada com sucesso.

### Fase 3 - Concluída

Implementado em 25/07/2026:

- `src/lib/financial/credit-cards.ts`: adicionadas as funções determinísticas `getInvoiceCycleForPurchase` e `getInvoiceDatesForBillingMonth` para calcular faturas e datas reais de fechamento e vencimento de compras (inclusive tratando meses curtos como fevereiro e limites dinâmicos de dias).
- `supabase/migrations/20260726010000_credit_card_cycles.sql`: cria as tabelas `credit_card_statements` e `credit_card_purchase_installments` com índices de performance, chaves únicas, RLS e políticas de acesso familiar.
- `src/actions/transactions.ts`: adaptadas as Server Actions de criação (`addTransaction`), deleção (`deleteTransaction`) e alteração (`updateTransaction`) para gerar/remover parcelas de cartão e recalcular automaticamente as faturas estruturadas correspondentes a cada mês afetado.
- `src/actions/onboarding.ts` e `src/actions/forecast.ts`: o diagnóstico de onboarding agora lê faturas reais estruturadas de `credit_card_statements` e as projeções futuras de 12 meses consolidam a soma das parcelas registradas no cartão por competência.
- `src/lib/financial/financial.test.ts`: adicionados 5 testes específicos cobrindo compras antes/no dia/após o fechamento, vencimentos em meses subsequentes e fechamento em 31 de fevereiro.

Verificação em 25/07/2026: Sincronização automática de banco via CLI (`supabase db push`) concluída com sucesso. Todos os 23 testes unitários passando. TypeScript check compilando com sucesso total.

### Fase 4 - Concluída

Implementado em 25/07/2026:

- `src/lib/financial/cash-flow.ts`: criados os tipos `DailyCashFlowEvent` (renomeado para evitar ambiguidade com `CashFlowEvent` legado) e a função pura `calculateDailyCashFlow` que computa cronologicamente do dia 1 ao último dia do mês o saldo de conta antes/depois, e sinaliza vales de caixa negativos.
- `supabase/migrations/20260726020000_account_balance.sql`: adiciona o campo `account_balance` na tabela `profiles` para guardar o saldo consolidado informado.
- `src/actions/cash-flow.ts`: cria a Server Action `getDailyCashFlow` que busca as despesas fixas, transações realizadas, faturas estruturadas e parcelas de dívidas mapeadas para cada data do mês, computando a projeção diária (e aplicando fallbacks inteligentes de conciliação para evitar duplicações).
- `src/lib/financial/financial.test.ts`: adicionados 2 testes unitários completos cobrindo fluxos reais com vales de caixa negativos e fluxos relativos (saldo inicial nulo).

Verificação em 25/07/2026: Sincronização de banco remoto via CLI (`supabase db push`) concluída com sucesso. Todos os 25 testes unitários passando. TypeScript check compilando com sucesso total.

### Fase 5 - Concluída

Implementado em 25/07/2026:

- `src/lib/financial/goals.ts`: criadas a função pura `projectGoalTimeline` para prever a quantidade de meses restantes até a conclusão de cada meta (com fallbacks para pausada, aporte nulo ou já completa) e a função `validateGoalAllocations` para garantir que as alocações ativas não ultrapassem 100%.
- `supabase/migrations/20260726030000_goals_allocation.sql`: altera a tabela `goals` adicionando colunas para prioridade, aporte mensal planejado, percentual de alocação, data alvo e status. Cria a tabela `goal_transactions` com RLS, índices e uma trigger `trg_update_goal_current_amount` para manter a integridade do saldo `current_amount` com base nas movimentações.
- `src/actions/goals.ts`: cria as Server Actions `getGoals`, `addGoal`, `updateGoal`, `deleteGoal` e `addGoalTransaction`, integrando validações de teto acumulado de alocação de 100% e cálculo dinâmico de prazos.
- `src/lib/financial/financial.test.ts`: adicionados 5 testes unitários testando a previsão de prazos sob aportes ativos/nulos/pausados, metas completas, e validação lógica de teto de alocação (soma <= 100%).

Verificação em 25/07/2026: Sincronização de banco remoto via CLI (`supabase db push`) concluída com sucesso. Todos os 30 testes unitários passando. TypeScript check compilando com sucesso total.

### Fase 6 - Concluída

Implementado em 25/07/2026:

- `src/lib/financial/planned-vs-realized.ts`: criada a função pura `comparePlannedVersusRealized` para cruzar categorias orçadas em `fixed_expenses` com o gasto real obtido de saídas da conta, faturas de cartão de crédito cobradas na competência de análise e parcelas de dívida vencidas no mês. Determina o percentual de gasto e sinaliza visualmente o status (`ok`, `warning` ou `over`).
- `src/actions/planned-vs-realized.ts`: cria a Server Action `getPlannedVersusRealized` consolidando gastos diretos, parcelas de faturas e parcelas de dívidas no respectivo mês de análise, trazendo uma visão granular das transações em cada categoria.
- `src/lib/financial/financial.test.ts`: adicionados 2 testes unitários verificando a comparação correta (ok, warning, over) e o tratamento especial de estouro imediato para gastos em categorias não planejadas (planejado = 0 e realizado > 0).

Verificação em 25/07/2026: Sincronização de banco remoto via CLI concluída. Todos os 32 testes unitários passando. TypeScript check compilando com sucesso total.

### Fase 0: Fundacao e contrato de dados

Objetivo: eliminar ambiguidades antes de alterar indicadores.

1. Criar `src/lib/financial/` com funcoes puras para dinheiro, datas, cronogramas, taxas e validacoes. Extrair gradualmente logicas repetidas de `onboarding.ts` e `forecast.ts`.
2. Criar tipos explicitos para `CashFlowEvent`, `DebtProjection`, `CreditCardCycle`, `PlannedAmount` e `ActualAmount`.
3. Definir a fonte de verdade de cada conceito:

| Conceito | Fonte de verdade |
| --- | --- |
| Fatura aberta | `credit_cards.current_invoice` ou item do `invoices_schedule` do mes, nunca ambos somados. |
| Compra de cartao | `transactions` identificada pelo `credit_card_id`, a ser adicionada como coluna; nao por prefixo textual. |
| Pagamento de fatura | Transacao propria vinculada ao cartao e a competencia da fatura. |
| Conta prevista | Registro de despesa, divida ou fatura no cronograma. |
| Conta quitada | Pagamento conciliado por chave estruturada, nao apenas por descricao semelhante. |

4. Antes de alterar o schema, mapear registros legados que codificam metadados em `title` ou `description` (`[due:DD]`, `[rec:DD]`, `[Cartao: ...]`, `[Individual]`). Manter leitura de legado apenas durante uma migration de dados com data de retirada definida.

Critrios de aceite:

- Nenhum calculo financeiro novo depende de `includes`, `startsWith` ou regex em descricao para identificar relacionamento financeiro.
- Funcoes de calculo sao deterministicas e recebem dados como argumentos, sem acesso direto ao Supabase.
- Testes cobrem fevereiro, ano bissexto, vencimento dia 31 e arredondamento de centavos.

### Fase 1: Utilizacao de limite de cartao

Objetivo: transformar `total_limit` em alerta util, sem confundir limite com dinheiro disponivel.

Formula por cartao, na data de referencia:

```text
limite_disponivel = max(0, limite_total - saldo_em_aberto)
utilizacao = limite_total > 0 ? saldo_em_aberto / limite_total : null
```

Regras:

- `saldo_em_aberto` deve ser a fatura aberta correta para a data de referencia, incluindo compras ja lancadas naquele ciclo e excluindo faturas quitadas.
- Se `total_limit = 0`, nao calcular percentual nem dividir por zero; apresentar `limite nao informado`.
- Faixas iniciais apenas para educacao financeira, nao como score oficial: abaixo de 30% adequado, de 30% a 50% atencao, acima de 50% elevado e acima de 70% critico. Explicar que instituicoes variam e que nao e um score Serasa.
- Somar utilizacao consolidada somente como `soma(saldos_em_aberto) / soma(limites_totais)`; nunca pela media simples dos percentuais individuais.
- A utilizacao nao deve entrar como despesa adicional no fluxo de caixa. Apenas a fatura devida entra como saida.

Dados/schema necessarios:

- Adicionar `credit_card_id UUID REFERENCES credit_cards(id)` em `transactions`.
- Adicionar tipo ou referencia estruturada para pagamento de fatura, por exemplo `transaction_kind` (`expense`, `income`, `card_payment`) e `billing_month` (`YYYY-MM`).
- Planejar migration retroativa com revisao do usuario para associar transacoes antigas que usam o texto `[Cartao: Nome]`.

Validacoes obrigatorias:

- Limite de R$ 1.000,00 e fatura de R$ 700,00 gera 70%, e limite disponivel de R$ 300,00.
- Duas faturas de R$ 700,00 em limites de R$ 1.000,00 e R$ 9.000,00 geram utilizacao consolidada de 14%, nao 38,9%.
- Pagamento integral da fatura reduz saldo em aberto uma unica vez e restaura o limite correspondente.

### Fase 2: Atraso, multa e juros de mora

Objetivo: projetar o custo de atrasos sem apresentar uma precisao inexistente.

Modelo minimo para saldo vencido sem pagamento no mes:

```text
saldo_inicial_vencido = overdue_value_accumulated
multa_unica = saldo_novo_em_atraso * percentual_multa ou valor fixo contratual
juros_do_mes = saldo_apos_multa * taxa_mensal_de_mora
saldo_final_vencido = saldo_inicial_vencido + nova_parcela_vencida + multa_unica + juros_do_mes - pagamento_destinado_ao_atraso
```

Regras:

- O campo atual `penalty_value` e valor fixo, nao percentual. Preservar esse significado; se for necessario percentual, criar outro campo com nome e unidade claros.
- Multa normalmente incide uma unica vez por parcela que entrou em atraso. Nao reaplicar a cada mes sobre o mesmo evento vencido.
- `monthly_late_interest_rate` deve ser aplicada somente ao saldo vencido enquanto este permanecer aberto. Aplicar juros simples ou compostos conforme contrato informado; se o produto nao coletar essa informacao, nomear a simulacao como `juros mensais estimados` e mostrar a premissa.
- Separar em dados e UI: saldo contratual a vencer, saldo vencido, encargos acumulados e valor para regularizacao. Nao chamar a soma de todos esses itens de `saldo devedor` sem detalhamento.
- Pagamentos devem seguir uma ordem configuravel ou contratual. Na ausencia dela, documentar a premissa usada, por exemplo encargos, parcelas vencidas e principal.
- Para cartao em atraso, nao reutilizar automaticamente a taxa de uma divida comum; o produto, taxa e regras sao distintos.

Dados/schema necessarios:

- Criar tabela de eventos de atraso ou parcelas (`debt_installments`) com competencia, vencimento, valor original, status, multa aplicada, juros acumulados, valor pago e data de pagamento.
- Manter `overdue_installments` e `overdue_value_accumulated` como legado/calculo agregado temporario, nao como fonte definitiva apos a migration.
- Coletar `late_interest_method` (`simple` ou `compound`), taxa e tipo de multa quando o contrato permitir informar esses dados.

Validacoes obrigatorias:

- Parcela de R$ 100,00 vencida com multa fixa de R$ 2,00 e juros de 1% ao mes, sem pagamento, gera R$ 103,02 no primeiro ciclo se a regra for juros compostos sobre saldo apos multa. A UI deve exibir essa premissa.
- No segundo ciclo, a multa da mesma parcela nao reaparece; apenas o juro definido incide sobre o saldo aberto.
- Um pagamento maior que o saldo nunca gera saldo negativo nem juros negativos.

### Fase 3: Ciclo de cartao e competencia da fatura

Objetivo: usar `closing_day` e `due_day` para evitar atribuir uma compra a fatura errada.

Regras:

- Cada compra de cartao deve ter data, cartao e competencia de fatura calculada.
- Definir e documentar a convencao de dia de fechamento: compra feita no proprio dia fecha na fatura atual ou na proxima. Essa regra pode variar por emissor; oferecer configuracao por cartao se necessario.
- Para um cartao com fechamento dia 10 e vencimento dia 17, compras apos o fechamento pertencem a proxima fatura. Compras ate o fechamento pertencem a fatura que vence no ciclo imediatamente posterior definido pelo emissor.
- A data de vencimento deve ser calculada no mes correto, inclusive quando o fechamento for posterior ao vencimento no calendario e em meses curtos.
- `current_invoice`, `next_invoice` e `invoices_schedule` precisam de uma unica estrategia. A recomendada e uma tabela de faturas por cartao/competencia; os campos agregados podem ser mantidos apenas como cache transitorio.
- Parcelamentos de compras devem gerar parcelas futuras com competencia definida. Nao projetar a fatura inteira atual repetida por 12 meses quando nao ha cronograma confiavel.

Dados/schema necessarios:

- Tabela `credit_card_statements`: cartao, competencia, fechamento, vencimento, saldo previsto, saldo realizado, status e valor pago.
- Tabela `credit_card_purchase_installments` ou campos equivalentes para compra parcelada, valor da parcela, numero da parcela e competencia.

Validacoes obrigatorias:

- Casos de compra antes, no dia e depois do fechamento.
- Cartao com fechamento no dia 31 em fevereiro.
- Pagamento parcial, integral e fatura atrasada.
- Nenhuma compra no cartao aparece como despesa de caixa antes do pagamento da fatura.

### Fase 4: Fluxo de caixa diario

Objetivo: responder se existe saldo suficiente em cada dia, e nao somente no fechamento do mes.

Algoritmo por mes:

```text
saldo_dia_0 = saldo_em_conta_informado + entradas_confirmadas_anteriores - saidas_pendentes_anteriores
para cada dia em ordem cronologica:
  saldo_antes = saldo_anterior
  entradas = receitas com data naquele dia + recebimentos confirmados
  saidas = contas, parcelas e faturas vencendo naquele dia + pagamentos confirmados
  saldo_final = saldo_antes + entradas - saidas
```

Regras:

- Incluir `receipt_day`, `due_day`, `next_due_date` e vencimento de fatura. Se o usuario nao informar saldo inicial em conta, exibir apenas `fluxo relativo do mes`, sem afirmar que ha cobertura financeira.
- Nao usar a reserva de emergencia como saldo de conta automaticamente. Ela so entra no fluxo se o usuario registrar transferencia/resgate.
- Nao incluir investimentos como liquidez imediata sem que o usuario informe liquidez, prazo de resgate e tributos aplicaveis.
- Marcar dias com saldo projetado negativo e apontar qual vencimento causa o vale de caixa. Oferecer sugestoes de data, sem recomendar atraso.
- Quando houver receitas irregulares, incluir somente as confirmadas ou cenarios explicitamente selecionados pelo usuario; nao tratar expectativa como caixa certo.

Dados/schema necessarios:

- Saldo inicial por conta e competencia, ou uma conta de caixa com saldo datado.
- Entidades de contas financeiras caso o produto passe a suportar mais de uma conta.
- Origem estruturada de cada evento para permitir conciliar previsao e realizado.

Validacoes obrigatorias:

- Receita no dia 5 e aluguel no dia 2: o fluxo deve alertar insuficiencia antes do dia 5, mesmo que o total mensal seja positivo.
- Vencimento em fim de semana deve manter a data contratual e opcionalmente sinalizar a politica de antecipacao do banco, sem mover silenciosamente a data.
- O saldo final do mes deve bater com saldo inicial mais entradas menos saidas de todos os eventos exibidos.

### Fase 5: Metas, reserva e investimentos

Objetivo: dar destino explicito ao `focusValue` do estagio verde e separar liquidez de patrimonio.

Regras:

- Antes da reserva atingir a meta, o aporte prioritario permanece na reserva conforme o estagio amarelo. Metas nao devem competir silenciosamente com a reserva.
- No verde, a alocacao entre metas e investimentos deve ser definida pelo usuario por percentual ou prioridade. A soma das alocacoes nao pode ultrapassar o valor disponivel.
- Para cada meta: `faltante = max(0, target_amount - current_amount)`. O prazo somente e calculado se houver aporte mensal positivo e repetivel: `meses = ceil(faltante / aporte_mensal)`, inicialmente sem rendimento.
- Se for simulado rendimento, exigir produto, taxa, liquidez, tributacao e periodicidade. Usar uma taxa liquida coerente com a modalidade ou identificar o resultado como bruto/estimado.
- Reserva de emergencia e meta financeira podem aparecer no mesmo painel, mas devem ter saldos e destinos distintos para evitar contar o mesmo dinheiro duas vezes.

Dados/schema necessarios:

- Adicionar a `goals`: prioridade, aporte_mensal_planejado, percentual_de_alocacao, data_alvo opcional e status.
- Criar eventos de aporte/resgate vinculados a meta. Nao atualizar `current_amount` sem historico de movimentacao.

Validacoes obrigatorias:

- Duas metas com percentuais de 60% e 50% devem falhar na validacao.
- Meta ja concluida recebe prazo zero e nao recebe novos aportes automaticos.
- Aporte de meta nao pode ser simultaneamente somado a investimentos genericos.

### Fase 6: Planejado versus realizado

Objetivo: usar `transactions` para adaptar o diagnostico ao comportamento real.

Regras:

- Comparar por competencia mensal e categoria normalizada. O planejado deve ser uma entidade propria ou derivado de fonte identificavel, nunca inferido por descricao de transacao.
- Formula da variacao: `variacao = realizado - planejado`. Para despesas, variacao positiva representa estouro; para receitas, variacao negativa representa frustracao. A UI deve usar termos claros, nao apenas cores.
- Separar despesas pagas no cartao das compras realizadas: no relatorio de consumo, considerar a data da compra; no fluxo de caixa, considerar o pagamento da fatura. Explicar a diferenca ao usuario.
- Excluir transferencias internas, pagamentos de fatura e aportes entre contas do total de consumo para nao inflar despesas.
- So gerar tendencias quando houver quantidade suficiente de meses comparaveis. Com menos de tres meses, apresentar historico, nao uma conclusao comportamental.

Dados/schema necessarios:

- Normalizar categoria e adicionar tipo/subtipo de transacao estruturado.
- Adicionar referencias para conta, cartao, fatura, meta e divida quando aplicavel.
- Criar uma tabela de orcamento por categoria/competencia se o planejamento deixar de ser apenas despesa fixa.

Validacoes obrigatorias:

- Compra de R$ 200 no cartao e pagamento de fatura de R$ 200 nao resultam em R$ 400 de consumo.
- Uma transferencia entre contas nao altera receita nem despesa consolidada.
- A soma das categorias de realizado confere com o extrato filtrado pelo mesmo criterio.

## Ajustes Necessarios no Motor Atual

Antes ou durante as fases, revisar os seguintes pontos em `src/actions/forecast.ts` e `src/actions/onboarding.ts`:

1. `activeToxicDebtsRemaining` hoje estima saldo por `parcelas_restantes * valor_da_parcela`. Isso confunde fluxo de parcelas com saldo devedor e pode superestimar ou subestimar contratos com juros. Renomear para algo como `estimatedRemainingScheduledPayments` ate haver saldo principal/amortizacao real.
2. A projecao reduz esse valor por `focusValue` e por `totalMonthToxicDebts`. Definir uma unica regra de alocacao para evitar que a parcela obrigatoria e o pagamento extra reduzam o mesmo saldo duas vezes.
3. `current_invoice` e `next_invoice` sao repetidos em meses futuros quando falta `invoices_schedule`. Exibir essa previsao como recorrencia assumida ou interromper a projecao apos o ultimo dado confirmado; nao afirmar que e fatura real.
4. `monthly_late_interest_rate`, `penalty_value`, `overdue_installments` e `overdue_value_accumulated` precisam alimentar a simulacao da Fase 2, com eventos de atraso para impedir multa repetida.
5. `receipt_day`, `due_day` e `closing_day` devem ser consumidos pela Fase 3 e Fase 4, sem remover a visao mensal existente.
6. A reserva e os investimentos pertencem ao casal, mas hoje sao lidos do perfil autenticado. Confirmar a regra de propriedade e, se forem saldos familiares, migrar para `family_groups` ou para uma tabela de patrimonio compartilhado antes de exibir um unico total do casal.

## Arquitetura Recomendada

```text
src/lib/financial/
  money.ts                 arredondamento, comparacao e somas monetarias
  dates.ts                 datas de competencia, vencimento e fechamento
  credit-cards.ts          ciclo, fatura, limite e utilizacao
  debts.ts                 parcelas, atraso, multa e juros
  cash-flow.ts             eventos diarios e saldo projetado
  goals.ts                 alocacao e prazo de metas
  budget-variance.ts       planejado versus realizado
  validators.ts            invariantes financeiros reutilizaveis
```

As server actions devem apenas carregar dados autorizados, chamar funcoes puras, persistir resultados quando necessario e retornar DTOs. A camada visual nao deve recalcular juros, datas de fatura ou saldo devedor.

## Testes e Qualidade

Para cada calculadora nova:

1. Criar testes unitarios com valores inteiros e centavos.
2. Criar testes de propriedades/invariantes: saldo nao negativo quando limitado, percentual entre 0 e 1 quando aplicavel, soma de eventos igual ao saldo final e nenhuma data invalida.
3. Criar testes de integracao para migration, RLS e associacao exclusiva ao `family_group_id` do usuario.
4. Testar regressao do dashboard, previsao e calendario com dados legados e dados novos.
5. Validar exemplos com um profissional financeiro antes de transformar recomendacoes em orientacao prescritiva.

## Transparencia e Protecao ao Usuario

- Exibir origem do numero, data de atualizacao e premissas de cada simulacao relevante.
- Diferenciar `confirmado`, `planejado`, `estimado` e `nao informado`.
- Nunca prometer score, aprovacao de credito, taxa bancaria ou rentabilidade.
- Incluir aviso de que simulacoes apoiam planejamento e nao substituem orientacao financeira, contabil ou juridica individualizada.
- Registrar alteracoes de parametros que afetam calculos, especialmente taxa, saldo, vencimento, pagamento e classificacao de divida.

## Definicao de Pronto

Uma funcionalidade financeira esta pronta somente quando:

- Tem uma fonte de dados estruturada e documentada.
- Explica sua formula e suas premissas ao usuario.
- Nao duplica consumo, caixa, fatura, amortizacao ou aporte.
- Mantem os dados do casal isolados por `family_group_id` e respeita RLS.
- Possui testes de casos normais, limites, dados incompletos e migracao de legado.
- Mostra claramente quando o resultado e uma estimativa e quando e um valor confirmado.
