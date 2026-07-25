import { clampMoney, roundMoney } from "./money";

export type CreditUtilizationBand = "not_informed" | "adequate" | "attention" | "high" | "critical";

export interface CreditUtilization {
  openBalance: number;
  totalLimit: number | null;
  availableLimit: number | null;
  utilizationRatio: number | null;
  utilizationPercent: number | null;
  progressPercent: number | null;
  band: CreditUtilizationBand;
}

export function calculateCreditUtilization(totalLimit: number, openBalance: number): CreditUtilization {
  const normalizedBalance = roundMoney(Math.max(0, openBalance));

  if (!Number.isFinite(totalLimit) || totalLimit <= 0) {
    return {
      openBalance: normalizedBalance,
      totalLimit: null,
      availableLimit: null,
      utilizationRatio: null,
      utilizationPercent: null,
      progressPercent: null,
      band: "not_informed"
    };
  }

  const normalizedLimit = roundMoney(totalLimit);
  const utilizationRatio = normalizedBalance / normalizedLimit;
  const utilizationPercent = Math.round(utilizationRatio * 100);
  const progressPercent = clampMoney(utilizationPercent, 0, 100);

  let band: CreditUtilizationBand = "adequate";
  if (utilizationRatio >= 0.7) {
    band = "critical";
  } else if (utilizationRatio >= 0.5) {
    band = "high";
  } else if (utilizationRatio >= 0.3) {
    band = "attention";
  }

  return {
    openBalance: normalizedBalance,
    totalLimit: normalizedLimit,
    availableLimit: roundMoney(Math.max(0, normalizedLimit - normalizedBalance)),
    utilizationRatio,
    utilizationPercent,
    progressPercent,
    band
  };
}

/**
 * Retorna a competência de vencimento (YYYY-MM), data de fechamento e data de vencimento da fatura
 * para uma determinada compra de cartão de crédito.
 */
export function getInvoiceCycleForPurchase(params: {
  purchaseDateStr: string; // YYYY-MM-DD
  closingDay: number;
  dueDay: number;
}): {
  billingMonth: string; // YYYY-MM
  closingDateStr: string; // YYYY-MM-DD
  dueDateStr: string; // YYYY-MM-DD
} {
  const { purchaseDateStr, closingDay, dueDay } = params;

  // Analisa o ano, mês e dia da compra
  const [year, month, day] = purchaseDateStr.split("-").map(Number);

  // Zera horas UTC para evitar ruídos de timezone
  const purchaseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // Determina o último dia do mês corrente de compra para evitar estouros (ex: dia 31 em fevereiro)
  const lastDayOfCurrentMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const actualClosingDay = Math.min(closingDay, lastDayOfCurrentMonth);

  const closingDateThisMonth = new Date(Date.UTC(year, month - 1, actualClosingDay, 12, 0, 0));

  let cycleClosingDate: Date;
  let cycleDueDate: Date;

  if (purchaseDate.getTime() <= closingDateThisMonth.getTime()) {
    // A compra foi feita até o fechamento deste mês. O fechamento é neste mês.
    cycleClosingDate = closingDateThisMonth;

    // O vencimento correspondente:
    if (dueDay > closingDay) {
      // Mesma competência do fechamento
      const lastDayOfDueMonth = lastDayOfCurrentMonth;
      const actualDueDay = Math.min(dueDay, lastDayOfDueMonth);
      cycleDueDate = new Date(Date.UTC(year, month - 1, actualDueDay, 12, 0, 0));
    } else {
      // Vencimento cai no mês seguinte
      const nextMonthDate = new Date(Date.UTC(year, month, 1));
      const nextMonthYear = nextMonthDate.getUTCFullYear();
      const nextMonthVal = nextMonthDate.getUTCMonth();
      const lastDayOfDueMonth = new Date(Date.UTC(nextMonthYear, nextMonthVal + 1, 0)).getUTCDate();
      const actualDueDay = Math.min(dueDay, lastDayOfDueMonth);
      cycleDueDate = new Date(Date.UTC(nextMonthYear, nextMonthVal, actualDueDay, 12, 0, 0));
    }
  } else {
    // A compra foi feita após o fechamento. Pertence ao próximo ciclo de fechamento.
    const nextMonthDate = new Date(Date.UTC(year, month, 1));
    const nextMonthYear = nextMonthDate.getUTCFullYear();
    const nextMonthVal = nextMonthDate.getUTCMonth();
    
    const lastDayOfNextMonth = new Date(Date.UTC(nextMonthYear, nextMonthVal + 1, 0)).getUTCDate();
    const actualClosingDayNextMonth = Math.min(closingDay, lastDayOfNextMonth);
    
    cycleClosingDate = new Date(Date.UTC(nextMonthYear, nextMonthVal, actualClosingDayNextMonth, 12, 0, 0));

    if (dueDay > closingDay) {
      // Vencimento no mesmo mês do fechamento (mês seguinte ao da compra)
      const lastDayOfDueMonth = lastDayOfNextMonth;
      const actualDueDay = Math.min(dueDay, lastDayOfDueMonth);
      cycleDueDate = new Date(Date.UTC(nextMonthYear, nextMonthVal, actualDueDay, 12, 0, 0));
    } else {
      // Vencimento cai no mês subsequente (2 meses após a compra)
      const subMonthDate = new Date(Date.UTC(nextMonthYear, nextMonthVal + 1, 1));
      const subMonthYear = subMonthDate.getUTCFullYear();
      const subMonthVal = subMonthDate.getUTCMonth();
      const lastDayOfDueMonth = new Date(Date.UTC(subMonthYear, subMonthVal + 1, 0)).getUTCDate();
      const actualDueDay = Math.min(dueDay, lastDayOfDueMonth);
      cycleDueDate = new Date(Date.UTC(subMonthYear, subMonthVal, actualDueDay, 12, 0, 0));
    }
  }

  // Formata as datas de saída no formato YYYY-MM-DD
  const closingDateStr = cycleClosingDate.toISOString().substring(0, 10);
  const dueDateStr = cycleDueDate.toISOString().substring(0, 10);
  
  // A competência da fatura (billingMonth) é o ano-mês da data de vencimento (dueDate)
  const billingMonth = dueDateStr.substring(0, 7);

  return {
    billingMonth,
    closingDateStr,
    dueDateStr
  };
}

/**
 * Retorna as datas de fechamento e vencimento estimadas/reais para uma competência específica de fatura (YYYY-MM)
 */
export function getInvoiceDatesForBillingMonth(params: {
  billingMonth: string; // YYYY-MM
  closingDay: number;
  dueDay: number;
}): {
  closingDateStr: string; // YYYY-MM-DD
  dueDateStr: string; // YYYY-MM-DD
} {
  const { billingMonth, closingDay, dueDay } = params;
  const [year, month] = billingMonth.split("-").map(Number);

  let closingYear = year;
  let closingMonthVal = month;

  if (dueDay < closingDay) {
    // O fechamento ocorre no mês anterior ao do vencimento
    const prevMonthDate = new Date(Date.UTC(year, month - 2, 1));
    closingYear = prevMonthDate.getUTCFullYear();
    closingMonthVal = prevMonthDate.getUTCMonth() + 1;
  }

  // Trata meses curtos para o fechamento
  const lastDayOfClosingMonth = new Date(Date.UTC(closingYear, closingMonthVal, 0)).getUTCDate();
  const actualClosingDay = Math.min(closingDay, lastDayOfClosingMonth);
  const closingDate = new Date(Date.UTC(closingYear, closingMonthVal - 1, actualClosingDay, 12, 0, 0));

  // Trata meses curtos para o vencimento
  const lastDayOfDueMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const actualDueDay = Math.min(dueDay, lastDayOfDueMonth);
  const dueDate = new Date(Date.UTC(year, month - 1, actualDueDay, 12, 0, 0));

  return {
    closingDateStr: closingDate.toISOString().substring(0, 10),
    dueDateStr: dueDate.toISOString().substring(0, 10)
  };
}


