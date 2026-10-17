import { describe, expect, it } from "vitest";
import {
  calculateFinancing, FinancingCalculationError, validateFinancingInput,
  type FinancingErrorCode, type FinancingInput,
} from "..";

const mortgage = {
  currency: "AMD",
  financingType: "mortgage", apartmentPrice: 50_000_000,
  downPaymentPercent: 20, annualInterestRatePercent: 9.5, durationMonths: 240,
};
const developer = {
  currency: "AMD",
  financingType: "developer_installment", formula: "interest_free",
  apartmentPrice: 50_000_000, downPaymentPercent: 20, durationMonths: 36,
};

function expectError(input: unknown, code: FinancingErrorCode, field?: string): void {
  for (const run of [() => validateFinancingInput(input), () => calculateFinancing(input as FinancingInput)]) {
    expect(run).toThrow(FinancingCalculationError);
    try { run(); } catch (error) {
      expect(error).toMatchObject({ name: "FinancingCalculationError", code, ...(field ? { field } : {}) });
      expect((error as Error).message.length).toBeGreaterThan(0);
    }
  }
}

describe("runtime input validation", () => {
  it.each([null, undefined, NaN, Infinity, 0, "mortgage", true, [], new Date(0)])("rejects non-input value %s", input => {
    expectError(input, "INVALID_INPUT");
  });

  it.each(Object.keys(mortgage))("rejects missing mortgage field %s", field => {
    const input: Record<string, unknown> = { ...mortgage };
    delete input[field];
    expectError(input, "INVALID_INPUT", field);
  });

  it.each(Object.keys(developer))("rejects missing developer field %s", field => {
    const input: Record<string, unknown> = { ...developer };
    delete input[field];
    expectError(input, "INVALID_INPUT", field);
  });

  for (const field of ["apartmentPrice", "downPaymentPercent", "annualInterestRatePercent", "durationMonths"]) {
    it.each([undefined, null, NaN, Infinity, -Infinity, -1, "12", true, {}, []])(`rejects invalid ${field}: %s`, value => {
      expectError({ ...mortgage, [field]: value }, "INVALID_INPUT", field);
    });
  }

  it.each([
    ["apartmentPrice", 0], ["apartmentPrice", 0.5], ["apartmentPrice", 1.1],
    ["apartmentPrice", 1_000_000_000_001], ["apartmentPrice", Number.MAX_SAFE_INTEGER + 1],
    ["durationMonths", 0], ["durationMonths", 2.5], ["durationMonths", 601],
    ["durationMonths", Number.MAX_VALUE], ["downPaymentPercent", 100.01],
    ["annualInterestRatePercent", 100.01],
  ])("rejects out-of-domain %s = %s", (field, value) => {
    expectError({ ...mortgage, [field]: value }, "INVALID_INPUT", String(field));
  });

  it("does not bypass validation for a fully paid purchase", () => {
    expectError({ ...mortgage, downPaymentPercent: 100, annualInterestRatePercent: NaN }, "INVALID_INPUT", "annualInterestRatePercent");
    expectError({ ...developer, downPaymentPercent: 100, durationMonths: 0 }, "INVALID_INPUT", "durationMonths");
  });

  it("requires own fields rather than inherited financial defaults", () => {
    expectError(Object.create(mortgage), "INVALID_INPUT", "financingType");
  });

  it("accepts explicit zero rates and boundary deposits", () => {
    for (const downPaymentPercent of [0, 9.5, 100]) {
      expect(() => validateFinancingInput({ ...mortgage, annualInterestRatePercent: 0, downPaymentPercent })).not.toThrow();
    }
  });

  it("narrows unknown JSON for subsequent calculation", () => {
    const input: unknown = JSON.parse(JSON.stringify(mortgage));
    validateFinancingInput(input);
    expect(calculateFinancing(input).financingType).toBe("mortgage");
  });
});

describe("unsupported financial configurations", () => {
  it.each(["EUR", "amd", "usd", "", 0, null, undefined, {}, []])("rejects unsupported currency %s", currency => {
    expectError({ ...mortgage, currency }, "UNSUPPORTED_CONFIGURATION", "currency");
  });

  it.each(["AMD", "USD"])("requires whole apartment prices in %s", currency => {
    for (const input of [mortgage, developer]) {
      for (const apartmentPrice of [0.01, 1.01, 99_999.99]) {
        expectError({ ...input, currency, apartmentPrice }, "INVALID_INPUT", "apartmentPrice");
      }
    }
  });

  it.each(["lease", "developer_markup", "", 0, null, undefined])("rejects financing type %s", financingType => {
    expectError({ ...mortgage, financingType }, "UNSUPPORTED_CONFIGURATION", "financingType");
  });

  it.each(["flat_markup", "annuity", "", 0, null, undefined])("rejects developer formula %s", formula => {
    expectError({ ...developer, formula }, "UNSUPPORTED_CONFIGURATION", "formula");
  });

  it.each([0, 9.5, undefined])("rejects even a zero/undefined annual rate on developer financing: %s", annualInterestRatePercent => {
    expectError({ ...developer, annualInterestRatePercent }, "UNSUPPORTED_CONFIGURATION", "annualInterestRatePercent");
  });

  it.each([
    ["formula", "variable_rate"], ["flatMarkupPercent", 10], ["fees", 1000],
    ["repaymentCurrency", "USD"], ["exchangeRate", 400],
    ["repaymentMethod", "differentiated"], ["partnerId", "defanse"],
  ])("rejects an unsupported field %s instead of ignoring it", (field, value) => {
    expectError({ ...mortgage, [field]: value }, "UNSUPPORTED_CONFIGURATION", String(field));
  });

  it("rejects symbol configuration fields", () => {
    expectError({ ...mortgage, [Symbol("markup")]: 10 }, "UNSUPPORTED_CONFIGURATION");
  });
});
