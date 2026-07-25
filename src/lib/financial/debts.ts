import { roundMoney, sumMoney } from "./money";

export type LateInterestMethod = "simple" | "compound";

export interface DebtInstallmentInput {
  originalValue: number;
  dueDate: string; // Formato YYYY-MM-DD
  amountPaid?: number;
  penaltyValue: number; // Valor fixo da multa
  monthlyInterestRate: number; // Taxa de juros ao mês (%)
  interestMethod?: LateInterestMethod;
}

export interface DebtChargesResult {
  daysLate: number;
  monthsLate: number;
  isOverdue: boolean;
  penaltyApplied: number;
  interestAccumulated: number;
  originalValue: number;
  amountPaid: number;
  totalDue: number;
  penaltyRemaining: number;
  interestRemaining: number;
  principalRemaining: number;
}

/**
 * Calcula multas, juros de mora e saldos restantes para uma parcela de dívida em atraso.
 * 
 * @param input Dados da parcela e taxas contratuais
 * @param referenceDate Data de referência para o cálculo do atraso (padrão: hoje)
 */
export function calculateLateCharges(
  input: DebtInstallmentInput,
  referenceDate: Date = new Date()
): DebtChargesResult {
  const {
    originalValue,
    dueDate,
    amountPaid = 0,
    penaltyValue,
    monthlyInterestRate,
    interestMethod = "simple"
  } = input;

  const due = new Date(dueDate + "T12:00:00");
  
  // Zera horas para comparação de dias inteiros
  const ref = new Date(referenceDate);
  ref.setHours(12, 0, 0, 0);

  const diffTime = ref.getTime() - due.getTime();
  const daysLate = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const isOverdue = daysLate > 0;

  if (!isOverdue) {
    const valRounded = roundMoney(originalValue);
    const paidRounded = roundMoney(amountPaid);
    const remaining = Math.max(0, valRounded - paidRounded);
    return {
      daysLate: 0,
      monthsLate: 0,
      isOverdue: false,
      penaltyApplied: 0,
      interestAccumulated: 0,
      originalValue: valRounded,
      amountPaid: paidRounded,
      totalDue: remaining,
      penaltyRemaining: 0,
      interestRemaining: 0,
      principalRemaining: remaining
    };
  }

  // Multa única por atraso
  const penaltyApplied = roundMoney(penaltyValue);
  const baseForInterest = originalValue + penaltyApplied;

  // Meses de atraso proporcional (dias de atraso / 30)
  const monthsLate = daysLate / 30;
  const monthlyRateDecimal = monthlyInterestRate / 100;

  let interestAccumulated = 0;
  if (interestMethod === "compound") {
    // Juros compostos: Principal * ((1 + taxa)^meses - 1)
    interestAccumulated = baseForInterest * (Math.pow(1 + monthlyRateDecimal, monthsLate) - 1);
  } else {
    // Juros simples: Principal * taxa * meses
    interestAccumulated = baseForInterest * monthlyRateDecimal * monthsLate;
  }

  const penaltyRounded = roundMoney(penaltyApplied);
  const interestRounded = roundMoney(Math.max(0, interestAccumulated));
  const valRounded = roundMoney(originalValue);
  const paidRounded = roundMoney(amountPaid);

  // Amortização de pagamento seguindo a ordem:
  // 1. Multa
  // 2. Juros acumulados
  // 3. Principal (valor original)
  let remainingPayment = paidRounded;

  const penaltyPaid = Math.min(penaltyRounded, remainingPayment);
  remainingPayment = roundMoney(Math.max(0, remainingPayment - penaltyPaid));

  const interestPaid = Math.min(interestRounded, remainingPayment);
  remainingPayment = roundMoney(Math.max(0, remainingPayment - interestPaid));

  const principalPaid = Math.min(valRounded, remainingPayment);

  // Valores restantes após amortização
  const penaltyRemaining = roundMoney(Math.max(0, penaltyRounded - penaltyPaid));
  const interestRemaining = roundMoney(Math.max(0, interestRounded - interestPaid));
  const principalRemaining = roundMoney(Math.max(0, valRounded - principalPaid));

  const totalDue = sumMoney([principalRemaining, penaltyRemaining, interestRemaining]);

  return {
    daysLate,
    monthsLate,
    isOverdue: true,
    penaltyApplied: penaltyRounded,
    interestAccumulated: interestRounded,
    originalValue: valRounded,
    amountPaid: paidRounded,
    totalDue,
    penaltyRemaining,
    interestRemaining,
    principalRemaining
  };
}
