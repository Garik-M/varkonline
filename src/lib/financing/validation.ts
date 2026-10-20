import { FinancingCalculationError } from "./errors";
import type { FinancingInput } from "./input";

/** Supported estimate domain and resource bounds, not lender eligibility rules. */
export const FINANCING_LIMITS = Object.freeze({
  maxApartmentPrice: 1_000_000_000_000,
  maxDurationMonths: 600,
  maxAnnualInterestRatePercent: 100,
});

function requireNumber(
  input: Record<string, unknown>,
  field: string,
  min: number,
  max: number,
  integer = false,
): void {
  const value = input[field];
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isSafeInteger(value))
  ) {
    throw new FinancingCalculationError(
      "INVALID_INPUT",
      `${field} must be a finite ${integer ? "whole " : ""}number between ${min} and ${max}.`,
      field,
    );
  }
}

/** Validate untrusted JSON without coercion, financial defaults, or ignored fields. */
export function validateFinancingInput(
  input: unknown,
): asserts input is FinancingInput {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new FinancingCalculationError(
      "INVALID_INPUT",
      "Financing input must be an object.",
    );
  }
  const values = input as Record<string, unknown>;
  const type = values.financingType;
  if (!Object.prototype.hasOwnProperty.call(values, "financingType")) {
    throw new FinancingCalculationError(
      "INVALID_INPUT",
      "financingType is required.",
      "financingType",
    );
  }
  if (type !== "mortgage" && type !== "developer_installment") {
    throw new FinancingCalculationError(
      "UNSUPPORTED_CONFIGURATION",
      "Unsupported financingType.",
      "financingType",
    );
  }

  const required = [
    "currency",
    "apartmentPrice",
    "downPaymentPercent",
    "durationMonths",
  ];
  required.push(type === "mortgage" ? "annualInterestRatePercent" : "formula");
  for (const field of required) {
    if (!Object.prototype.hasOwnProperty.call(values, field)) {
      throw new FinancingCalculationError(
        "INVALID_INPUT",
        `${field} is required.`,
        field,
      );
    }
  }
  const supported = new Set([
    "financingType",
    "downPaymentAmount",
    ...required,
    ...(type === "mortgage" ? ["repaymentMethod"] : []),
  ]);
  for (const field of Reflect.ownKeys(values)) {
    if (typeof field !== "string" || !supported.has(field)) {
      throw new FinancingCalculationError(
        "UNSUPPORTED_CONFIGURATION",
        `Unsupported financing field: ${String(field)}.`,
        String(field),
      );
    }
  }

  if (values.currency !== "AMD" && values.currency !== "USD") {
    throw new FinancingCalculationError(
      "UNSUPPORTED_CONFIGURATION",
      "Unsupported currency. Use AMD or USD.",
      "currency",
    );
  }
  requireNumber(
    values,
    "apartmentPrice",
    1,
    FINANCING_LIMITS.maxApartmentPrice,
    true,
  );
  requireNumber(values, "downPaymentPercent", 0, 100);
  if (values.downPaymentAmount !== undefined) {
    requireNumber(
      values,
      "downPaymentAmount",
      0,
      values.apartmentPrice as number,
      true,
    );
    if (
      Math.round(
        ((values.apartmentPrice as number) *
          (values.downPaymentPercent as number)) /
          100,
      ) !== values.downPaymentAmount
    )
      throw new FinancingCalculationError(
        "INVALID_INPUT",
        "Down payment amount and percentage must agree.",
        "downPaymentAmount",
      );
  }
  requireNumber(
    values,
    "durationMonths",
    1,
    FINANCING_LIMITS.maxDurationMonths,
    true,
  );
  if (type === "mortgage") {
    requireNumber(
      values,
      "annualInterestRatePercent",
      0,
      FINANCING_LIMITS.maxAnnualInterestRatePercent,
    );
    if (
      values.repaymentMethod !== undefined &&
      values.repaymentMethod !== "annuity" &&
      values.repaymentMethod !== "equal_principal"
    )
      throw new FinancingCalculationError(
        "UNSUPPORTED_CONFIGURATION",
        "Unsupported repayment method.",
        "repaymentMethod",
      );
  } else if (values.formula !== "interest_free") {
    throw new FinancingCalculationError(
      "UNSUPPORTED_CONFIGURATION",
      "Unsupported developer installment formula.",
      "formula",
    );
  }
}
