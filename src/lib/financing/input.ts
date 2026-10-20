export type FinancingCurrency = "AMD" | "USD";

interface BaseFinancingInput {
  /** Explicit denomination; all input and output amounts use this currency. */
  readonly currency: FinancingCurrency;
  /** Positive whole currency units, including whole dollars for USD. */
  readonly apartmentPrice: number;
  /** Percentage points: 9.5 means 9.5%, not 0.095. */
  readonly downPaymentPercent: number;
  /** Exact whole-unit amount when entered directly; must agree with the percentage. */
  readonly downPaymentAmount?: number;
  readonly durationMonths: number;
}

/** Fixed nominal annual rate, monthly payments in arrears; annuity unless explicit. */
export interface MortgageInput extends BaseFinancingInput {
  readonly financingType: "mortgage";
  readonly annualInterestRatePercent: number;
  readonly repaymentMethod?: "annuity" | "equal_principal";
}

export interface DeveloperInstallmentInput extends BaseFinancingInput {
  readonly financingType: "developer_installment";
  /** Future developer formulas must be explicit variants with their own inputs. */
  readonly formula: "interest_free";
  readonly annualInterestRatePercent?: never;
}

export type FinancingInput = MortgageInput | DeveloperInstallmentInput;
