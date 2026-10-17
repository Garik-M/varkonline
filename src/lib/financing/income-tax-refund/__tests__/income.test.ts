import { describe, expect, it } from "vitest";
import { ARMENIA_REFUND_RULES_2026_10 as rules, calculateSalaryIncomeTax, type RefundRuleSet } from "..";

describe("salary income tax", () => {
  it("estimates 20% of gross registered salary and does not calculate net pay", () => {
    expect(calculateSalaryIncomeTax({ month: "2026-10", grossRegisteredSalaryAMD: 500_000 }, rules)).toEqual({
      month: "2026-10", estimatedSalaryIncomeTaxAMD: 100_000, actualIncomeTaxWithheldAMD: null,
      selectedIncomeTaxAMD: 100_000, taxRatePercent: 20, taxSource: "standard_rate",
    });
  });

  it.each([["2020-01", 23], ["2021-01", 22], ["2022-12", 21], ["2023-01", 20]] as const)("uses the versioned historical rate for %s", (month, rate) => {
    expect(calculateSalaryIncomeTax({ month, grossRegisteredSalaryAMD: 100 }, rules).selectedIncomeTaxAMD).toBe(rate);
  });

  it("does not apply a flat 20% rate to uncovered historical progressive regimes", () => {
    expect(calculateSalaryIncomeTax({ month: "2019-01", grossRegisteredSalaryAMD: 1000 }, rules)).toMatchObject({
      estimatedSalaryIncomeTaxAMD: null, selectedIncomeTaxAMD: null, taxSource: "unresolved",
    });
    expect(calculateSalaryIncomeTax({ month: "2019-01", grossRegisteredSalaryAMD: 1000, actualIncomeTaxWithheldAMD: 222 }, rules).selectedIncomeTaxAMD).toBe(222);
  });

  it.each([0, 50_000])("uses actual withheld tax %s rather than the salary estimate", actualIncomeTaxWithheldAMD => {
    expect(calculateSalaryIncomeTax({ month: "2026-10", grossRegisteredSalaryAMD: 500_000,
      actualIncomeTaxWithheldAMD }, rules)).toMatchObject({ selectedIncomeTaxAMD: actualIncomeTaxWithheldAMD,
      estimatedSalaryIncomeTaxAMD: 100_000, taxSource: "actual_withheld" });
  });

  it.each([0, 9.5, 10])("supports a caller-supplied exception rate of %s percent", taxRatePercent => {
    expect(calculateSalaryIncomeTax({ month: "2026-10", grossRegisteredSalaryAMD: 1000, taxRatePercent }, rules)).toMatchObject({
      selectedIncomeTaxAMD: taxRatePercent * 10, taxSource: "custom_rate",
    });
  });

  it("supports zero salary and exact half-up AMD rounding", () => {
    expect(calculateSalaryIncomeTax({ month: "2026-10", grossRegisteredSalaryAMD: 0 }, rules).selectedIncomeTaxAMD).toBe(0);
    expect(calculateSalaryIncomeTax({ month: "2026-10", grossRegisteredSalaryAMD: 5, taxRatePercent: 10 }, rules).selectedIncomeTaxAMD).toBe(1);
  });

  it("accepts a new versioned rate policy without modifying the engine or old profile", () => {
    const future: RefundRuleSet = { ...rules, version: "test-future-policy", salaryRates: [...rules.salaryRates,
      { fromMonth: "2027-01", ratePercent: 19 }] };
    expect(calculateSalaryIncomeTax({ month: "2027-01", grossRegisteredSalaryAMD: 1000 }, future).selectedIncomeTaxAMD).toBe(190);
    expect(calculateSalaryIncomeTax({ month: "2027-01", grossRegisteredSalaryAMD: 1000 }, rules).selectedIncomeTaxAMD).toBe(200);
  });
});
