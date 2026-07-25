import { roundMoney, sumMoney } from "./money";

export interface DailyCashFlowEvent {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  date: string; // Formato YYYY-MM-DD
  category?: string;
}

export interface DailyCashFlowResult {
  date: string; // Formato YYYY-MM-DD
  day: number;
  balanceBefore: number;
  incomes: number;
  expenses: number;
  balanceAfter: number;
  isNegative: boolean;
  events: DailyCashFlowEvent[];
}

/**
 * Calcula cronologicamente o fluxo de caixa diário de um determinado mês e ano.
 * 
 * @param params Parâmetros com saldo inicial, eventos e competência
 */
export function calculateDailyCashFlow(params: {
  initialBalance: number | null; // null representa fluxo relativo (sem saldo inicial real)
  events: DailyCashFlowEvent[];
  year: number;
  month: number;
}): {
  isRelativeFlow: boolean;
  dailyData: DailyCashFlowResult[];
} {
  const { initialBalance, events, year, month } = params;
  
  const isRelativeFlow = initialBalance === null;
  const startBalance = isRelativeFlow ? 0 : roundMoney(initialBalance!);

  // Determinar número de dias no mês
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  
  const dailyData: DailyCashFlowResult[] = [];
  let currentBalance = startBalance;

  for (let day = 1; day <= lastDay; day++) {
    const dayStr = String(day).padStart(2, "0");
    const monthStr = String(month).padStart(2, "0");
    const currentDateStr = `${year}-${monthStr}-${dayStr}`;

    // Filtrar eventos do dia
    const dayEvents = events.filter(e => e.date === currentDateStr);
    
    // Somar entradas e saídas
    const dayIncomesList = dayEvents.filter(e => e.type === "income").map(e => e.amount);
    const dayExpensesList = dayEvents.filter(e => e.type === "expense").map(e => e.amount);

    const incomes = sumMoney(dayIncomesList);
    const expenses = sumMoney(dayExpensesList);

    const balanceBefore = currentBalance;
    const balanceAfter = roundMoney(balanceBefore + incomes - expenses);
    const isNegative = balanceAfter < 0;

    dailyData.push({
      date: currentDateStr,
      day,
      balanceBefore,
      incomes,
      expenses,
      balanceAfter,
      isNegative,
      events: dayEvents
    });

    currentBalance = balanceAfter;
  }

  return {
    isRelativeFlow,
    dailyData
  };
}
