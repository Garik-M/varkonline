import {
  calculateMortgageIncomeTaxRefund,
  calculateSalaryIncomeTax,
  ARMENIA_REFUND_RULES_2026_10,
  type MortgageRefundInput,
  type RefundParticipant,
} from "@/lib/financing/income-tax-refund";
import type { FinancingResult } from "@/lib/financing";
import type { ResolvedWidget } from "./types";

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
  employee: string;
  owner: string;
  identity: string;
  prior: string;
  tuition: string;
  allocation: string;
  settlement: string;
  documentsChecked: boolean;
}
export const emptyPayroll = (): PayrollForm => ({
  gross: "",
  withheld: "",
  employee: "",
  owner: "",
  identity: "",
  prior: "",
  tuition: "",
  allocation: "",
  settlement: "",
  documentsChecked: false,
});
export function wholeAmount(raw: string): number {
  if (!/^(0|[1-9]\d*)$/.test(raw) || Number(raw) > 1e12)
    throw new Error("INVALID_AMOUNT");
  return Number(raw);
}
export function payrollParticipant(
  form: PayrollForm,
  dates: string[],
  role: "borrower" | "co_borrower",
): RefundParticipant {
  const fact = (value: string) =>
    value === ""
      ? null
      : { value: value === "yes", verified: form.documentsChecked };
  return {
    id: role,
    role,
    eligibility: {
      employee: fact(form.employee),
      ownerOrCoOwner: fact(form.owner),
      requiredIdentityOrResidenceDocument: fact(form.identity),
      priorBenefitUse: form.prior
        ? {
            value: form.prior as
              | "none"
              | "same_mortgage"
              | "other_post_2018_mortgage"
              | "pre_2018_only",
            verified: form.documentsChecked,
          }
        : null,
    },
    incomePeriods: [
      {
        ...quarterIncomeRange(dates),
        grossRegisteredSalaryAMD: wholeAmount(form.gross),
        ...(form.withheld === ""
          ? {}
          : { actualIncomeTaxWithheldAMD: wholeAmount(form.withheld) }),
        tuitionRefundClaimed:
          form.tuition === "" ? null : form.tuition === "yes",
        taxAlreadyAllocatedAMD:
          form.allocation === "" ? null : wholeAmount(form.allocation),
        taxPaymentStatus:
          form.settlement === "projected"
            ? "projected"
            : form.settlement === "unpaid"
              ? "unpaid"
              : "unknown",
      },
    ],
  };
}
export function refundProjection(
  result: FinancingResult,
  configuration: ResolvedWidget,
  first: string,
  loan: string,
  participants: RefundParticipant[],
) {
  const dates = paymentDates(first, result.schedule.length);
  const input: MortgageRefundInput = {
    financing: result,
    loanOriginationDate: loan,
    originationDateVerified:
      configuration.refund.loanOriginationDate?.verified === true &&
      configuration.refund.loanOriginationDate.value === loan,
    eligibility: configuration.refund.facts,
    participants,
    payments: dates.map((paymentDate, i) => ({
      month: i + 1,
      paymentDate,
      interestBasis: "projected",
      subsidizedInterest: 0,
    })),
  };
  return calculateMortgageIncomeTaxRefund(input, ARMENIA_REFUND_RULES_2026_10);
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
