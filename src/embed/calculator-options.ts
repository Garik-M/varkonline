import type { CalculatorOptions, PartnerConfiguration } from "./types";

export const DEFAULT_CALCULATOR_OPTIONS: CalculatorOptions = {
  downPaymentAmountStep: 10_000,
  durationUnit: "years",
  repaymentMethod: "annuity",
  allowRepaymentChoice: false,
  rateEditable: true,
  priceRateRule: {
    currency: "AMD",
    threshold: 35_000_000,
    below: 12.75,
    atOrAbove: 13.25,
  },
  defaultLanguage: "hy",
  showSchedule: true,
  showTotals: true,
  allowCoBorrower: false,
  analyticsEnabled: true,
  installmentControls: {
    downPaymentPercent: { min: 0, max: 100, step: 0.01 },
    durationMonths: { min: 1, max: 120, step: 1 },
    supportedDurations: [],
  },
};
export const LEGACY_CALCULATOR_OPTIONS: CalculatorOptions = {
  ...DEFAULT_CALCULATOR_OPTIONS,
  durationUnit: "months",
  priceRateRule: null,
};
export function mortgageControlPreset(): Pick<
  PartnerConfiguration,
  "limits" | "adjustable"
> & { calculator: CalculatorOptions } {
  return {
    calculator: { ...DEFAULT_CALCULATOR_OPTIONS },
    limits: {
      apartmentPrice: { min: 1, max: 1e12 },
      annualInterestRatePercent: { min: 1, max: 30 },
      downPaymentPercent: { min: 10, max: 100, step: 0.01 },
      durationMonths: { min: 120, max: 240, step: 12 },
      supportedDurations: [],
    },
    adjustable: { downPaymentPercent: true, durationMonths: true },
  };
}
