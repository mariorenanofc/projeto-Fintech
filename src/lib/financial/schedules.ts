import { roundMoney } from "./money";
import type { MonthKey, MonthlyScheduleItem } from "./types";

export function getScheduledAmount(
  schedule: readonly MonthlyScheduleItem[] | null | undefined,
  month: MonthKey,
  fallbackAmount: number
): number {
  const scheduledItem = schedule?.find((item) => item.month === month);

  return roundMoney(scheduledItem ? scheduledItem.amount : fallbackAmount);
}

export function hasScheduledAmount(
  schedule: readonly MonthlyScheduleItem[] | null | undefined,
  month: MonthKey
): boolean {
  return schedule?.some((item) => item.month === month) ?? false;
}
