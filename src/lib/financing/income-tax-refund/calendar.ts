import { FinancingCalculationError } from "../errors";

export function invalid(message: string, field: string): never {
  throw new FinancingCalculationError("INVALID_INPUT", message, field);
}

export function isMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) >= 1900;
}

export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !isMonth(value.slice(0, 7))) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  const day = Number(value.slice(8));
  return day >= 1 && day <= days;
}

export function monthIndex(month: string): number {
  return Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;
}

export function quarterFor(date: string) {
  const year = Number(date.slice(0, 4));
  const quarter = (Math.floor((Number(date.slice(5, 7)) - 1) / 3) + 1) as 1 | 2 | 3 | 4;
  const months = [0, 1, 2].map(offset => `${year}-${String((quarter - 1) * 3 + 1 + offset).padStart(2, "0")}`);
  const endMonth = quarter * 3;
  return { year, quarter, months,
    periodStart: `${months[0]}-01`,
    periodEnd: `${months[2]}-${endMonth === 3 || endMonth === 12 ? 31 : 30}`,
    key: `${year}-Q${quarter}` };
}
