import { roundMoney } from "./money";

export interface GoalProjectionInput {
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  status: "active" | "completed" | "paused";
}

export interface GoalProjectionResult {
  remainingAmount: number;
  monthsToTarget: number; // Infinito se o aporte for 0
  isCompleted: boolean;
}

/**
 * Calcula a quantidade de meses necessários para atingir o valor alvo da meta
 * com base no aporte mensal planejado e status.
 */
export function projectGoalTimeline(goal: GoalProjectionInput): GoalProjectionResult {
  const target = roundMoney(Math.max(0, goal.targetAmount));
  const current = roundMoney(Math.max(0, goal.currentAmount));
  
  const remainingAmount = roundMoney(Math.max(0, target - current));
  const isCompleted = goal.status === "completed" || remainingAmount === 0;

  if (isCompleted) {
    return {
      remainingAmount: 0,
      monthsToTarget: 0,
      isCompleted: true
    };
  }

  if (goal.monthlyContribution <= 0 || goal.status === "paused") {
    return {
      remainingAmount,
      monthsToTarget: Infinity,
      isCompleted: false
    };
  }

  const monthly = roundMoney(goal.monthlyContribution);
  const monthsToTarget = Math.ceil(remainingAmount / monthly);

  return {
    remainingAmount,
    monthsToTarget,
    isCompleted: false
  };
}

/**
 * Valida se o percentual acumulado de alocação de metas ultrapassa 100%.
 * 
 * @param allocations Array com os percentuais de alocação das metas ativas
 */
export function validateGoalAllocations(allocations: number[]): boolean {
  const sum = allocations.reduce((sumVal, val) => sumVal + Number(val || 0), 0);
  // Tolerância pequena de ponto flutuante
  return roundMoney(sum) <= 100;
}
