import type { MonthKey } from "./types";

export const DEFAULT_FINANCIAL_TIME_ZONE = "America/Sao_Paulo";

function isValidMonthKey(value: string): value is MonthKey {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function assertMonthKey(month: string): asserts month is MonthKey {
  if (!isValidMonthKey(month)) {
    throw new Error("Competência inválida. Use o formato AAAA-MM.");
  }
}

export function getFinancialMonth(date = new Date(), timeZone = DEFAULT_FINANCIAL_TIME_ZONE): MonthKey {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  if (!year || !month) {
    throw new Error("Não foi possível determinar a competência financeira.");
  }

  return `${year}-${month}` as MonthKey;
}

export function getDaysInMonth(month: MonthKey): number {
  assertMonthKey(month);
  const [year, monthNumber] = month.split("-").map(Number);

  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

export function getDateInMonth(month: MonthKey, configuredDay: number): string {
  assertMonthKey(month);
  if (!Number.isInteger(configuredDay) || configuredDay < 1 || configuredDay > 31) {
    throw new Error("O dia configurado deve estar entre 1 e 31.");
  }

  const dueDay = Math.min(configuredDay, getDaysInMonth(month));
  return `${month}-${String(dueDay).padStart(2, "0")}`;
}

export function addMonths(month: MonthKey, monthsToAdd: number): MonthKey {
  assertMonthKey(month);
  if (!Number.isInteger(monthsToAdd)) {
    throw new Error("A quantidade de meses deve ser um número inteiro.");
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + monthsToAdd, 1));
  const result = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

  return result as MonthKey;
}

export function getLocalDateString(date: Date, timeZone = DEFAULT_FINANCIAL_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Não foi possível determinar a data local.");
  }

  return `${year}-${month}-${day}`;
}

