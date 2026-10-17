import type { FinancingCurrency } from "./input";

/** All monetary fields are nonnegative, safe integers in whole currency units. */
export interface FinancingScheduleEntry {
  readonly month: number;
  readonly openingBalance: number;
  readonly scheduledPayment: number;
  readonly principalPaid: number;
  readonly interestPaid: number;
  readonly remainingBalance: number;
}

interface BaseFinancingResult {
  readonly currency: FinancingCurrency;
  readonly isEstimate: true;
  readonly apartmentPrice: number;
  readonly downPaymentPercent: number;
  readonly downPaymentAmount: number;
  readonly financedPrincipal: number;
  readonly durationMonths: number;
  /** Rounded annuity or principal / months; actual final payment may differ. */
  readonly regularMonthlyPayment: number;
  readonly totalInterest: number;
  readonly totalFinancedRepayment: number;
  readonly totalCostIncludingDownPayment: number;
  /** Empty when financed principal is zero; otherwise one entry per month. */
  readonly schedule: readonly FinancingScheduleEntry[];
}

export interface MortgageResult extends BaseFinancingResult {
  readonly financingType: "mortgage";
  readonly annualInterestRatePercent: number;
}

export interface DeveloperInstallmentResult extends BaseFinancingResult {
  readonly financingType: "developer_installment";
  readonly formula: "interest_free";
  /** Not applicable; developer installment plans do not accept annual rates. */
  readonly annualInterestRatePercent: null;
}

export type FinancingResult = MortgageResult | DeveloperInstallmentResult;
