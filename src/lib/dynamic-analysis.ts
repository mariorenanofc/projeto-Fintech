/**
 * Gerador de Análises Dinâmicas de Finanças e Projeção (Zero LLM API / Zero Token Cost).
 * Gera análises determinísticas, empáticas e ricas baseadas no estágio (Red, Yellow, Green)
 * e nos marcos históricos (milestones) da projeção de 1 a 12 meses do casal.
 */

export interface ProjectionMilestones {
  toxicDebtClearedMonth?: string;
  reserveTargetReachedMonth?: string;
  isInsolvencyRisk: boolean;
  initialStage: "red" | "yellow" | "green";
  targetStageMonth12: "red" | "yellow" | "green";
}

export interface MonthSnapshotData {
  income: number;
  essentials: number;
  lazerTravaValue: number;
  lazerPercent: number;
  toxicDebts: number;
  structuralDebts: number;
  focusValue: number;
  projectedReserve: number;
  projectedInvestments: number;
  reserveMeta: number;
}

/**
 * Retorna a frase de leitura de 5 segundos (Headline) para o topo do Dashboard
 */
export function getProjectionHeadline(
  stage: "red" | "yellow" | "green",
  monthLabel: string,
  milestones: ProjectionMilestones
): string {
  if (milestones.isInsolvencyRisk) {
    return `🚨 ALERTA CRÍTICO: Risco de insolvência detectado! É necessário realizar um plano de choque e cortes imediatos.`;
  }

  if (stage === "red") {
    if (milestones.toxicDebtClearedMonth) {
      return `🔴 FASE DE RESGATE: Foco total na eliminação de dívidas tóxicas. Previsão de quitação total em ${milestones.toxicDebtClearedMonth}!`;
    }
    return `🔴 FASE DE RESGATE: Priorizem quitar juros e dívidas tóxicas com 100% do saldo restante. Lazer mantido em 6%.`;
  }

  if (stage === "yellow") {
    if (milestones.reserveTargetReachedMonth) {
      return `🟡 FASE DE SEGURANÇA: Dívidas tóxicas zeradas! Meta da Reserva de Emergência estimada para ${milestones.reserveTargetReachedMonth}.`;
    }
    return `🟡 FASE DE SEGURANÇA: Construção da Reserva de Emergência. Lazer expandido para 12% para um progresso leve.`;
  }

  // Green
  return `🟢 FASE DE PROSPERIDADE: Reserva de emergência sólida e saúde financeira em dia! Caminho livre para investimentos de longo prazo.`;
}

/**
 * Gera um texto detalhado de análise estratégica para o mês ou projeção geral
 */
export function getDynamicAnalysisText(
  stage: "red" | "yellow" | "green",
  monthLabel: string,
  data: MonthSnapshotData,
  milestones: ProjectionMilestones
): string {
  const formattedIncome = data.income.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedFocus = data.focusValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedLazer = data.lazerTravaValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedReserve = data.projectedReserve.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedMeta = data.reserveMeta.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (milestones.isInsolvencyRisk) {
    return `Em ${monthLabel}, a soma dos Gastos Essenciais com as dívidas excede a renda familiar de R$ ${formattedIncome}. Suspendam a trava de lazer e contatem as instituições financeiras para renegociar faturas ou carência de parcelas imediatamente.`;
  }

  if (stage === "red") {
    let text = `Em ${monthLabel}, o casal opera na Fase Vermelha de Resgate. Garantimos a trava de lazer emocional em ${data.lazerPercent}% (R$ ${formattedLazer}) para manter a motivação do casal. `;
    text += `Todo o valor de foco projetado de R$ ${formattedFocus} deve ser alocado estritamente na amortização das dívidas tóxicas (cartões e juros). `;
    
    if (milestones.toxicDebtClearedMonth) {
      text += `Se mantiverem a disciplina, até ${milestones.toxicDebtClearedMonth} todas as dívidas de juros altos estarão completamente liquidadas!`;
    }
    return text;
  }

  if (stage === "yellow") {
    let text = `Em ${monthLabel}, vocês estão na Fase Amarela de Segurança. As dívidas tóxicas estão zeradas! O lazer do casal está elevado para 12% (R$ ${formattedLazer}). `;
    text += `A sobra orçamentária de R$ ${formattedFocus} está sendo acumulada no Fundo de Reserva (atualmente em R$ ${formattedReserve} de uma meta de R$ ${formattedMeta}). `;
    
    if (milestones.reserveTargetReachedMonth) {
      text += `No ritmo atual, vocês atingirão 100% da meta de segurança em ${milestones.reserveTargetReachedMonth}, entrando na Fase Verde de Prosperidade!`;
    }
    return text;
  }

  // Green
  let text = `Em ${monthLabel}, o casal alcança a Fase Verde de Prosperidade. Com o fundo de reserva mantido em R$ ${formattedReserve}, 7% da renda é destinado à manutenção e o restante de R$ ${formattedFocus} está 100% liberado para investimentos e realização de metas de longo prazo. `;
  text += `O lazer do casal está garantido em R$ ${formattedLazer} (12% da renda). Parabéns pela solidez financeira!`;
  return text;
}
