export type MonthKey = `${number}-${string}`;

export type FinancialDataStatus = "confirmed" | "planned" | "estimated" | "not_informed";

export interface MonthlyScheduleItem {
  month: MonthKey;
  amount: number;
  date?: string;
}

export interface CashFlowEvent {
  id: string;
  date: string;
  amount: number;
  direction: "inflow" | "outflow";
  status: FinancialDataStatus;
  source: "income" | "expense" | "debt" | "card_statement" | "transaction";
  description: string;
}

export interface CreditCardCycle {
  statementMonth: MonthKey;
  closingDate: string;
  dueDate: string;
}

export interface PlannedAmount {
  month: MonthKey;
  category: string;
  amount: number;
  status: Exclude<FinancialDataStatus, "confirmed">;
}

export interface ActualAmount {
  month: MonthKey;
  category: string;
  amount: number;
  status: "confirmed";
}

export interface DebtProjection {
  scheduledPayment: number;
  overdueBalance: number;
  lateFees: number;
  lateInterest: number;
  totalDue: number;
  status: FinancialDataStatus;
}
