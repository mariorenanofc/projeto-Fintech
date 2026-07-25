import { describe, it, expect } from "vitest";
import {
  toCents,
  fromCents,
  sumMoney,
  clampMoney,
  getFinancialMonth,
  getDaysInMonth,
  getDateInMonth,
  addMonths,
  getLocalDateString,
  calculateCreditUtilization,
  calculateLateCharges,
  getInvoiceCycleForPurchase,
  getInvoiceDatesForBillingMonth,
  calculateDailyCashFlow,
  projectGoalTimeline,
  validateGoalAllocations,
  comparePlannedVersusRealized
} from "./index";

describe("Financial Layer - money.ts", () => {
  it("should convert decimal to cents correctly avoiding floating-point drift", () => {
    expect(toCents(10.25)).toBe(1025);
    expect(toCents(0.1 + 0.2)).toBe(30); // 0.30
  });

  it("should convert cents back to decimal", () => {
    expect(fromCents(1025)).toBe(10.25);
    expect(fromCents(30)).toBe(0.3);
  });

  it("should sum money array accurately", () => {
    const values = [0.1, 0.2, 0.3];
    expect(sumMoney(values)).toBe(0.6);
  });

  it("should clamp money correctly", () => {
    expect(clampMoney(150, 0, 100)).toBe(100);
    expect(clampMoney(-50, 0, 100)).toBe(0);
    expect(clampMoney(50.5, 0, 100)).toBe(50.5);
  });
});

describe("Financial Layer - dates.ts", () => {
  it("should get financial month in standard format (YYYY-MM)", () => {
    const date = new Date(Date.UTC(2026, 6, 25)); // 25 de julho de 2026 UTC
    expect(getFinancialMonth(date)).toBe("2026-07");
  });

  it("should return the correct number of days in month (leap year check)", () => {
    expect(getDaysInMonth("2026-02")).toBe(28); // 2026 não bissexto
    expect(getDaysInMonth("2024-02")).toBe(29); // 2024 bissexto
    expect(getDaysInMonth("2026-12")).toBe(31);
  });

  it("should cap configured day to the last day of the month", () => {
    expect(getDateInMonth("2026-02", 31)).toBe("2026-02-28"); // Capped to 28
    expect(getDateInMonth("2024-02", 31)).toBe("2024-02-29"); // Capped to 29
    expect(getDateInMonth("2026-04", 31)).toBe("2026-04-30"); // Capped to 30
    expect(getDateInMonth("2026-05", 15)).toBe("2026-05-15"); // Normal day
  });

  it("should add months correctly crossing years", () => {
    expect(addMonths("2026-07", 1)).toBe("2026-08");
    expect(addMonths("2026-12", 2)).toBe("2027-02");
    expect(addMonths("2026-01", -2)).toBe("2025-11");
  });

  it("should return local date string under default timezone America/Sao_Paulo", () => {
    const date = new Date("2026-07-25T02:00:00Z"); // 22:00 do dia 24/07 em Brasília
    expect(getLocalDateString(date)).toBe("2026-07-24");
  });
});

describe("Financial Layer - credit-cards.ts", () => {
  it("should handle card with no limit gracefully", () => {
    const result = calculateCreditUtilization(0, 500);
    expect(result.band).toBe("not_informed");
    expect(result.totalLimit).toBeNull();
    expect(result.availableLimit).toBeNull();
  });

  it("should calculate credit utilization metrics correctly", () => {
    const result = calculateCreditUtilization(1000, 700);
    expect(result.utilizationPercent).toBe(70);
    expect(result.availableLimit).toBe(300);
    expect(result.band).toBe("critical"); // >= 70%
  });

  it("should assign correct educational bands", () => {
    // Abaixo de 30%: adequada
    expect(calculateCreditUtilization(1000, 250).band).toBe("adequate");
    // 30% a 50%: atenção
    expect(calculateCreditUtilization(1000, 450).band).toBe("attention");
    // 50% a 70%: elevada
    expect(calculateCreditUtilization(1000, 650).band).toBe("high");
    // Acima de 70%: crítica
    expect(calculateCreditUtilization(1000, 750).band).toBe("critical");
  });

  it("should compute aggregate utilization consolidation correctly using formula", () => {
    // Teste de validação obrigatória: 
    // Faturas de 700 reais em limites de 1000 e 9000
    // Total usado: 1400. Total limite: 10000. Utilização consolidada = 14%
    const card1 = calculateCreditUtilization(1000, 700);
    const card2 = calculateCreditUtilization(9000, 700);
    
    const sumBalances = (card1.openBalance || 0) + (card2.openBalance || 0);
    const sumLimits = (card1.totalLimit || 0) + (card2.totalLimit || 0);
    const consolidatedRatio = sumBalances / sumLimits;
    
    expect(consolidatedRatio).toBe(0.14);
  });
});

describe("Financial Layer - debts.ts", () => {
  const referenceDate = new Date("2026-08-25T12:00:00Z"); // Data de referência

  it("should not apply penalty or interest if daysLate is 0", () => {
    const result = calculateLateCharges(
      {
        originalValue: 100,
        dueDate: "2026-08-25",
        penaltyValue: 2,
        monthlyInterestRate: 1,
        interestMethod: "simple"
      },
      referenceDate
    );

    expect(result.isOverdue).toBe(false);
    expect(result.daysLate).toBe(0);
    expect(result.penaltyApplied).toBe(0);
    expect(result.interestAccumulated).toBe(0);
    expect(result.totalDue).toBe(100);
  });

  it("should calculate compound interest correctly (100 BRL, 2 BRL penalty, 1% rate, 30 days late)", () => {
    // Parcela vencida com multa de 2 e juros compostos de 1% a.m., sem pagamento (30 dias = 1 mês)
    const result = calculateLateCharges(
      {
        originalValue: 100,
        dueDate: "2026-07-26", // 30 dias antes de 2026-08-25
        penaltyValue: 2,
        monthlyInterestRate: 1,
        interestMethod: "compound"
      },
      referenceDate
    );

    expect(result.isOverdue).toBe(true);
    expect(result.daysLate).toBe(30);
    expect(result.penaltyApplied).toBe(2);
    expect(result.interestAccumulated).toBe(1.02); // 1% de 102
    expect(result.totalDue).toBe(103.02);
  });

  it("should calculate compound interest across multiple months correctly (60 days late)", () => {
    const result = calculateLateCharges(
      {
        originalValue: 100,
        dueDate: "2026-06-26", // 60 dias antes de 2026-08-25
        penaltyValue: 2,
        monthlyInterestRate: 1,
        interestMethod: "compound"
      },
      referenceDate
    );

    expect(result.isOverdue).toBe(true);
    expect(result.daysLate).toBe(60);
    expect(result.penaltyApplied).toBe(2);
    expect(result.interestAccumulated).toBe(2.05); // 102 * ((1.01)^2 - 1) = 2.0502 -> 2.05
    expect(result.totalDue).toBe(104.05);
  });

  it("should calculate simple interest correctly (100 BRL, 2 BRL penalty, 1% rate, 60 days late)", () => {
    const result = calculateLateCharges(
      {
        originalValue: 100,
        dueDate: "2026-06-26",
        penaltyValue: 2,
        monthlyInterestRate: 1,
        interestMethod: "simple"
      },
      referenceDate
    );

    expect(result.isOverdue).toBe(true);
    expect(result.daysLate).toBe(60);
    expect(result.penaltyApplied).toBe(2);
    expect(result.interestAccumulated).toBe(2.04); // 102 * 0.01 * 2 = 2.04
    expect(result.totalDue).toBe(104.04);
  });

  it("should amortize payments correctly (paying penalty first, then interest, then principal)", () => {
    // Total original: 100. Multa: 2. Juros: 1.02. Total devido: 103.02.
    // Pagamento de 5 reais.
    // Multa paga: 2. Juros pagos: 1.02. Principal pago: 1.98.
    // Restantes: Principal: 98.02. Juros: 0. Multa: 0. Total: 98.02.
    const result = calculateLateCharges(
      {
        originalValue: 100,
        dueDate: "2026-07-26",
        amountPaid: 5,
        penaltyValue: 2,
        monthlyInterestRate: 1,
        interestMethod: "compound"
      },
      referenceDate
    );

    expect(result.penaltyRemaining).toBe(0);
    expect(result.interestRemaining).toBe(0);
    expect(result.principalRemaining).toBe(98.02);
    expect(result.totalDue).toBe(98.02);
  });
});

describe("Financial Layer - credit-cards.ts (Cycles)", () => {
  it("should assign purchase to current month invoice if before or on closing day", () => {
    const result = getInvoiceCycleForPurchase({
      purchaseDateStr: "2026-08-08",
      closingDay: 10,
      dueDay: 17
    });

    expect(result.closingDateStr).toBe("2026-08-10");
    expect(result.dueDateStr).toBe("2026-08-17");
    expect(result.billingMonth).toBe("2026-08");
  });

  it("should assign purchase to next month invoice if after closing day", () => {
    const result = getInvoiceCycleForPurchase({
      purchaseDateStr: "2026-08-12",
      closingDay: 10,
      dueDay: 17
    });

    expect(result.closingDateStr).toBe("2026-09-10");
    expect(result.dueDateStr).toBe("2026-09-17");
    expect(result.billingMonth).toBe("2026-09");
  });

  it("should handle dueDay in the following month (e.g. closingDay: 28, dueDay: 5)", () => {
    // Caso A: Compra antes do fechamento
    const resA = getInvoiceCycleForPurchase({
      purchaseDateStr: "2026-08-25",
      closingDay: 28,
      dueDay: 5
    });
    expect(resA.closingDateStr).toBe("2026-08-28");
    expect(resA.dueDateStr).toBe("2026-09-05");
    expect(resA.billingMonth).toBe("2026-09");

    // Caso B: Compra depois do fechamento
    const resB = getInvoiceCycleForPurchase({
      purchaseDateStr: "2026-08-29",
      closingDay: 28,
      dueDay: 5
    });
    expect(resB.closingDateStr).toBe("2026-09-28");
    expect(resB.dueDateStr).toBe("2026-10-05");
    expect(resB.billingMonth).toBe("2026-10");
  });

  it("should handle short months (e.g. closingDay: 31 in February)", () => {
    // Fevereiro de 2026 (não bissexto) tem 28 dias. O fechamento 31 é ajustado para o dia 28.
    const result = getInvoiceCycleForPurchase({
      purchaseDateStr: "2026-02-15",
      closingDay: 31,
      dueDay: 10 // Vencimento dia 10 do mês seguinte
    });

    expect(result.closingDateStr).toBe("2026-02-28");
    expect(result.dueDateStr).toBe("2026-03-10");
    expect(result.billingMonth).toBe("2026-03");
  });

  it("should calculate correct statement dates for a billing month", () => {
    // Ex: Vencimento em Setembro (2026-09), com fechamento dia 28 e vencimento dia 5
    const result = getInvoiceDatesForBillingMonth({
      billingMonth: "2026-09",
      closingDay: 28,
      dueDay: 5
    });

    expect(result.closingDateStr).toBe("2026-08-28"); // Fechamento em agosto
    expect(result.dueDateStr).toBe("2026-09-05"); // Vencimento em setembro
  });
});

describe("Financial Layer - cash-flow.ts", () => {
  it("should compute chronological cash flow correctly with initial balance (real flow with negatives)", () => {
    // Saldo inicial de 1000 reais.
    // Despesa de 1200 reais no dia 5.
    // Receita de 500 reais no dia 10.
    // Mês de agosto (31 dias)
    const result = calculateDailyCashFlow({
      initialBalance: 1000,
      year: 2026,
      month: 8,
      events: [
        { id: "1", title: "Despesa Alta", amount: 1200, type: "expense", date: "2026-08-05" },
        { id: "2", title: "Salário", amount: 500, type: "income", date: "2026-08-10" }
      ]
    });

    expect(result.isRelativeFlow).toBe(false);
    
    // Dias 1 a 4: saldo permanece em 1000
    expect(result.dailyData[0].balanceBefore).toBe(1000);
    expect(result.dailyData[0].balanceAfter).toBe(1000);
    expect(result.dailyData[3].balanceAfter).toBe(1000);

    // Dia 5: despesa de 1200 -> saldo vai para -200 (isNegative: true)
    const day5 = result.dailyData[4];
    expect(day5.day).toBe(5);
    expect(day5.balanceBefore).toBe(1000);
    expect(day5.expenses).toBe(1200);
    expect(day5.balanceAfter).toBe(-200);
    expect(day5.isNegative).toBe(true);

    // Dia 9: saldo continua em -200
    const day9 = result.dailyData[8];
    expect(day9.balanceAfter).toBe(-200);
    expect(day9.isNegative).toBe(true);

    // Dia 10: receita de 500 -> saldo vai para +300 (isNegative: false)
    const day10 = result.dailyData[9];
    expect(day10.day).toBe(10);
    expect(day10.balanceBefore).toBe(-200);
    expect(day10.incomes).toBe(500);
    expect(day10.balanceAfter).toBe(300);
    expect(day10.isNegative).toBe(false);

    // Dia 31: saldo final de 300
    expect(result.dailyData[30].balanceAfter).toBe(300);
  });

  it("should compute relative flow if initial balance is null", () => {
    // Fluxo relativo: inicia com 0.
    // Despesa de 100 reais no dia 2.
    // Receita de 150 reais no dia 3.
    const result = calculateDailyCashFlow({
      initialBalance: null,
      year: 2026,
      month: 8,
      events: [
        { id: "1", title: "Conta", amount: 100, type: "expense", date: "2026-08-02" },
        { id: "2", title: "Pix", amount: 150, type: "income", date: "2026-08-03" }
      ]
    });

    expect(result.isRelativeFlow).toBe(true);
    expect(result.dailyData[0].balanceBefore).toBe(0);
    
    // Dia 2: saldo -100
    expect(result.dailyData[1].balanceAfter).toBe(-100);
    expect(result.dailyData[1].isNegative).toBe(true);

    // Dia 3: saldo +50
    expect(result.dailyData[2].balanceAfter).toBe(50);
    expect(result.dailyData[2].isNegative).toBe(false);
  });
});

describe("Financial Layer - goals.ts", () => {
  it("should calculate months to target correctly", () => {
    // Alvo: R$ 5.000, Atual: R$ 2.000, Aporte: R$ 300/mês -> Restam R$ 3.000 -> 10 meses
    const result = projectGoalTimeline({
      targetAmount: 5000,
      currentAmount: 2000,
      monthlyContribution: 300,
      status: "active"
    });

    expect(result.remainingAmount).toBe(3000);
    expect(result.monthsToTarget).toBe(10);
    expect(result.isCompleted).toBe(false);
  });

  it("should return zero months to target if status is completed", () => {
    const result = projectGoalTimeline({
      targetAmount: 5000,
      currentAmount: 2000,
      monthlyContribution: 300,
      status: "completed"
    });

    expect(result.remainingAmount).toBe(0);
    expect(result.monthsToTarget).toBe(0);
    expect(result.isCompleted).toBe(true);
  });

  it("should return zero months to target if current exceeds or equals target", () => {
    const result = projectGoalTimeline({
      targetAmount: 5000,
      currentAmount: 5200,
      monthlyContribution: 300,
      status: "active"
    });

    expect(result.remainingAmount).toBe(0);
    expect(result.monthsToTarget).toBe(0);
    expect(result.isCompleted).toBe(true);
  });

  it("should return Infinity months to target if monthly contribution is 0 or paused", () => {
    // Caso A: Aporte 0
    const resA = projectGoalTimeline({
      targetAmount: 5000,
      currentAmount: 2000,
      monthlyContribution: 0,
      status: "active"
    });
    expect(resA.monthsToTarget).toBe(Infinity);

    // Caso B: Pausado
    const resB = projectGoalTimeline({
      targetAmount: 5000,
      currentAmount: 2000,
      monthlyContribution: 300,
      status: "paused"
    });
    expect(resB.monthsToTarget).toBe(Infinity);
  });

  it("should validate goal allocations correctly (sum <= 100)", () => {
    expect(validateGoalAllocations([60, 40])).toBe(true);
    expect(validateGoalAllocations([60, 41])).toBe(false);
    expect(validateGoalAllocations([30, 20, 50])).toBe(true);
    expect(validateGoalAllocations([0, 0])).toBe(true);
  });
});

describe("Financial Layer - planned-vs-realized.ts", () => {
  it("should categorize compare correctly with ok, warning, and over status", () => {
    const planned = [
      { category: "Alimentação", amount: 500 },
      { category: "Transporte", amount: 200 },
      { category: "Lazer", amount: 150 }
    ];

    const direct = [
      { id: "1", category: "Alimentação", amount: 350, description: "Supermercado", date: "2026-08-05" }, // 70% -> ok
      { id: "2", category: "Transporte", amount: 180, description: "Combustível", date: "2026-08-10" } // 90% -> warning
    ];

    const card = [
      { id: "3", category: "Lazer", amount: 200, description: "Restaurante", date: "2026-08-12" } // 133.33% -> over
    ];

    const result = comparePlannedVersusRealized({
      plannedExpenses: planned,
      directTransactions: direct,
      cardInstallments: card,
      debtInstallments: []
    });

    // Lazer deve vir primeiro por ser 'over'
    expect(result[0].category).toBe("Lazer");
    expect(result[0].planned).toBe(150);
    expect(result[0].actual).toBe(200);
    expect(result[0].status).toBe("over");
    expect(result[0].percent).toBe(133.33);

    // Transporte deve vir em segundo por ser 'warning'
    expect(result[1].category).toBe("Transporte");
    expect(result[1].planned).toBe(200);
    expect(result[1].actual).toBe(180);
    expect(result[1].status).toBe("warning");

    // Alimentação deve vir em terceiro por ser 'ok'
    expect(result[2].category).toBe("Alimentação");
    expect(result[2].planned).toBe(500);
    expect(result[2].actual).toBe(350);
    expect(result[2].status).toBe("ok");
  });

  it("should handle cases where there is actual spend but no planned budget", () => {
    const result = comparePlannedVersusRealized({
      plannedExpenses: [],
      directTransactions: [
        { id: "1", category: "Extras", amount: 80, description: "Gasto surpresa", date: "2026-08-15" }
      ],
      cardInstallments: [],
      debtInstallments: []
    });

    expect(result[0].category).toBe("Extras");
    expect(result[0].planned).toBe(0);
    expect(result[0].actual).toBe(80);
    expect(result[0].percent).toBe(100);
    expect(result[0].status).toBe("over");
  });
});
