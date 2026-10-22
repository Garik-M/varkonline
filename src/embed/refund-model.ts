import {
  calculateMonthlyMortgageRefundEstimate,
  calculateSalaryIncomeTax,
  ARMENIA_REFUND_RULES_2026_10,
  estimateIncomeTaxFromNetSalary,
  type MortgageRefundScenarioInput,
} from "@/lib/financing/income-tax-refund";
import type { FinancingResult } from "@/lib/financing";

/** Same contractual day, clamped at month end; no timezone or current-date defaults. */
export function paymentDates(first: string, count: number): string[] {
  const date = new Date(`${first}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(first) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== first
  )
    throw new Error("INVALID_DATE");
  return Array.from({ length: count }, (_, i) => {
    const last = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + i + 1, 0),
    );
    return new Date(
      Date.UTC(
        last.getUTCFullYear(),
        last.getUTCMonth(),
        Math.min(date.getUTCDate(), last.getUTCDate()),
      ),
    )
      .toISOString()
      .slice(0, 10);
  });
}
export function quarterIncomeRange(dates: string[]) {
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (!first || !last) throw new Error("NO_PAYMENTS");
  const start = Math.floor((Number(first.slice(5, 7)) - 1) / 3) * 3 + 1;
  const end = Math.floor((Number(last.slice(5, 7)) - 1) / 3) * 3 + 3;
  return {
    fromMonth: `${first.slice(0, 4)}-${String(start).padStart(2, "0")}`,
    toMonth: `${last.slice(0, 4)}-${String(end).padStart(2, "0")}`,
  };
}
export interface PayrollForm {
  gross: string;
  withheld: string;
}
export const emptyPayroll = (): PayrollForm => ({
  gross: "",
  withheld: "",
});
export function wholeAmount(raw: string): number {
  if (!/^(0|[1-9]\d*)$/.test(raw) || Number(raw) > 1e12)
    throw new Error("INVALID_AMOUNT");
  return Number(raw);
}
/** Explicit forecast assumptions: stable salary, settled tax, no other claims or subsidies. */
export function payrollParticipant(
  form: PayrollForm,
  dates: string[],
  role: "borrower" | "co_borrower",
): MortgageRefundScenarioInput["participants"][number] {
  return {
    id: role,
    role,
    incomePeriods: dates.length
      ? [
          {
            ...quarterIncomeRange(dates),
            grossRegisteredSalaryAMD: wholeAmount(form.gross),
            ...(form.withheld === ""
              ? {}
              : { actualIncomeTaxWithheldAMD: wholeAmount(form.withheld) }),
            tuitionRefundClaimed: false,
            taxAlreadyAllocatedAMD: 0,
            taxPaymentStatus: "projected",
          },
        ]
      : [],
  };
}
export function refundProjection(
  result: FinancingResult,
  first: string,
  loan: string,
  participants: MortgageRefundScenarioInput["participants"],
) {
  const dates = paymentDates(first, result.schedule.length);
  return calculateMonthlyMortgageRefundEstimate(
    {
      financing: result,
      loanOriginationDate: loan,
      participants,
      payments: dates.map((paymentDate, index) => ({
        month: index + 1,
        paymentDate,
        interestBasis: "projected",
        subsidizedInterest: 0,
      })),
    },
    ARMENIA_REFUND_RULES_2026_10,
  );
}
export const salaryEstimate = (form: PayrollForm, month: string) =>
  calculateSalaryIncomeTax(
    {
      month,
      grossRegisteredSalaryAMD: wholeAmount(form.gross),
      ...(form.withheld === ""
        ? {}
        : { actualIncomeTaxWithheldAMD: wholeAmount(form.withheld) }),
    },
    ARMENIA_REFUND_RULES_2026_10,
  );

export function netPayrollParticipant(
  net: string,
  dates: string[],
  role: "borrower" | "co_borrower",
) {
  const estimate = estimateIncomeTaxFromNetSalary(wholeAmount(net));
  return payrollParticipant(
    { gross: String(estimate.grossSalaryAMD), withheld: "" },
    dates,
    role,
  );
}

/** UI-only clock boundary. Pure engines always receive explicit dates. */
export function automaticProjectionDates(today: string) {
  const [year, month, day] = today.split("-").map(Number);
  const end = new Date(Date.UTC(year, month + 1, 0));
  return {
    loan: today,
    first: new Date(Date.UTC(year, month, Math.min(day, end.getUTCDate())))
      .toISOString()
      .slice(0, 10),
  };
}

export function yerevanToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Yerevan",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join("-");
}
