import type { FinancingCurrency } from "../input";
import type { EligibilityStatus, IncomePeriod, RefundRuleSet } from "./input";

export type RefundReasonCode =
  | "CONDITIONS_VERIFIED" | "NOT_A_MORTGAGE" | "NO_FINANCED_PRINCIPAL"
  | "FACT_REQUIRES_VERIFICATION" | "NON_RESIDENT_FINANCIAL_LENDER" | "NOT_USED_FOR_HOUSING"
  | "ACQUISITION_NOT_ELIGIBLE" | "SPECIAL_ACQUISITION_REVIEW" | "LEGACY_LOAN_REVIEW"
  | "CONTRACT_PRICE_EXCEEDS_LIMIT" | "CONTRACT_PRICE_MISMATCH" | "OUTSIDE_ARMENIA"
  | "LOCATION_RESTRICTED" | "CUTOFF_DATE_REVIEW" | "PERMIT_EXCEPTION_APPLIED"
  | "RIGHTS_NOT_REGISTERED" | "DOCUMENTS_INCOMPLETE" | "SELF_BUILD_PERMIT_INVALID"
  | "NOT_AN_EMPLOYEE" | "NOT_AN_OWNER" | "IDENTITY_DOCUMENT_MISSING" | "PRIOR_OTHER_MORTGAGE"
  | "MISSING_INCOME_MONTH" | "TAX_RATE_REQUIRES_VERIFICATION" | "TAX_PAYMENT_UNKNOWN"
  | "TAX_NOT_FULLY_PAID" | "TUITION_BENEFIT_OVERLAP" | "OTHER_BENEFIT_REVIEW"
  | "AMD_AMOUNTS_REQUIRED" | "NO_ELIGIBLE_PARTICIPANT";

export interface RefundReason {
  readonly code: RefundReasonCode;
  readonly message: string;
  readonly effect: "ineligible" | "requires_verification" | "information";
  readonly field?: string;
  readonly participantId?: string;
}

export interface RefundEligibilityResult {
  readonly status: EligibilityStatus;
  readonly reasons: readonly RefundReason[];
}

export interface MonthlyIncomeTaxResult {
  readonly participantId: string;
  readonly month: string;
  readonly estimatedSalaryIncomeTaxAMD: number | null;
  readonly actualIncomeTaxWithheldAMD: number | null;
  readonly selectedIncomeTaxAMD: number | null;
  readonly taxRatePercent: number | null;
  readonly taxSource: "actual_withheld" | "standard_rate" | "custom_rate" | "unresolved";
  readonly taxPaymentStatus: IncomePeriod["taxPaymentStatus"] | "missing";
}

export type SalaryIncomeTaxResult = Omit<MonthlyIncomeTaxResult, "participantId" | "taxPaymentStatus">;

export interface QuarterlyParticipantTax {
  readonly participantId: string;
  readonly eligibility: RefundEligibilityResult;
  readonly eligibleIncomeTaxAMD: number | null;
}

export interface QuarterlyRefundResult {
  readonly year: number;
  readonly quarter: 1 | 2 | 3 | 4;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly paymentMonths: readonly number[];
  readonly projectedMortgageInterestAMD: number | null;
  readonly interestUsedAMD: number | null;
  readonly subsidizedInterestAMD: number | null;
  readonly eligibleInterestAMD: number | null;
  readonly verifiedInterestPaidAMD: number | null;
  readonly hasProjectedInterest: boolean;
  readonly hasProjectedTaxPayments: boolean;
  readonly eligibleIncomeTaxAMD: number | null;
  /** Single cap for the mortgage, shared by every participant. */
  readonly quarterlyRefundCapAMD: number | null;
  readonly estimatedRefundAMD: number | null;
  readonly mortgagePaymentsBeforeRefundAMD: number | null;
  readonly effectiveFinancingCostAMD: number | null;
  readonly eligibility: RefundEligibilityResult;
  readonly participants: readonly QuarterlyParticipantTax[];
}

export interface MortgageRefundResult {
  readonly isEstimate: true;
  readonly refundCurrency: "AMD";
  readonly financingCurrency: FinancingCurrency;
  readonly originalRegularMonthlyBankPayment: number;
  readonly bankPayments: readonly {
    readonly month: number; readonly paymentDate: string; readonly originalBankPayment: number;
  }[];
  readonly monthlyIncomeTax: readonly MonthlyIncomeTaxResult[];
  readonly loanEligibility: RefundEligibilityResult;
  readonly eligibility: RefundEligibilityResult;
  readonly quarterlySchedule: readonly QuarterlyRefundResult[];
  readonly annualRefunds: readonly { readonly year: number; readonly estimatedRefundAMD: number | null }[];
  readonly totalEstimatedRefundAMD: number | null;
  readonly totalMortgagePaymentsBeforeRefundAMD: number | null;
  readonly totalEffectiveFinancingCostAMD: number | null;
  /** Rounded informational equivalent; never an amount charged by the bank. */
  readonly effectiveAverageMonthlyFinancingCostAMD: number | null;
  /** Complete applied snapshot for reproducibility; contains no payroll inputs. */
  readonly rules: RefundRuleSet;
  readonly assumptions: readonly string[];
}
