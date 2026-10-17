import { describe, expect, it } from "vitest";
import { FinancingCalculationError, calculateFinancing } from "../..";
import { ARMENIA_REFUND_RULES_2026_10 as rules, calculateMortgageIncomeTaxRefund as calculate,
  calculateSalaryIncomeTax, validateMortgageRefundInput, validateRefundRules,
  type MortgageRefundInput, type RefundRuleSet } from "..";
import { clone, income, person, sample } from "./fixtures";

function invalid(input: unknown, field?: string) {
  for (const run of [() => validateMortgageRefundInput(input), () => calculate(input as MortgageRefundInput, rules)]) {
    expect(run).toThrow(FinancingCalculationError);
    try { run(); } catch (error) {
      expect(error).toMatchObject({ code: "INVALID_INPUT", ...(field === undefined ? {} : { field }) });
    }
  }
}

describe("refund boundary validation", () => {
  it.each([undefined, null, true, 1, "refund", [], NaN])("rejects invalid input %s", input => invalid(input));

  it.each(Object.keys(sample()))("rejects missing top-level %s", field => {
    const input = clone(sample()) as unknown as Record<string, unknown>;
    delete input[field]; invalid(input);
  });

  it("rejects hidden extra financial assumptions or partner configuration", () => {
    invalid({ ...sample(), partnerId: "defanse" });
    invalid({ ...sample(), exchangeRate: 400 });
    invalid({ ...sample(), [Symbol("fee")]: 100 });
  });

  it("does not accept inherited financial/evidence defaults", () => {
    invalid(Object.create(sample()));
    invalid({ ...sample(), financing: Object.create(sample().financing) });
    const input = sample();
    invalid({ ...input, eligibility: { ...input.eligibility, residentFinancialLender: Object.create({ value: true, verified: true }) } });
  });

  it.each([NaN, Infinity, -Infinity, -1, "100", undefined, null, true, 1.5, 1_000_000_000_001])("rejects invalid gross salary %s", grossRegisteredSalaryAMD => {
    const input = sample();
    invalid({ ...input, participants: [{ ...person(), incomePeriods: [{ ...income(), grossRegisteredSalaryAMD }] }] });
  });

  it.each([NaN, Infinity, -1, "20", undefined, 100.01])("rejects invalid explicitly supplied tax rate %s", taxRatePercent => {
    invalid({ ...sample(), participants: [{ ...person(), incomePeriods: [{ ...income(), taxRatePercent }] }] });
  });

  it.each([NaN, Infinity, -1, 0.01, 101, undefined])("rejects invalid actual withheld tax %s", actualIncomeTaxWithheldAMD => {
    invalid({ ...sample(), participants: [{ ...person(), incomePeriods: [{ ...income(), actualIncomeTaxWithheldAMD }] }] });
  });

  it("does not call tax verified-paid without an actual amount", () => {
    invalid({ ...sample(), participants: [{ ...person(), incomePeriods: [{ ...income(), taxPaymentStatus: "verified_paid" }] }] });
  });

  it.each(["2026-02-29", "2026-13-01", "2026-04-31", "2026-1-01", "2026-01-01T00:00:00Z", "", "0099-01-01"])("rejects invalid loan date %s", loanOriginationDate => {
    invalid({ ...sample(), loanOriginationDate }, "loanOriginationDate");
  });

  it("accepts Gregorian leap-day payment dates independently of timezone", () => {
    const financing = calculateFinancing({ currency: "AMD", financingType: "mortgage", apartmentPrice: 1250,
      downPaymentPercent: 20, annualInterestRatePercent: 12, durationMonths: 1 });
    const input = sample({ financing, loanOriginationDate: "2024-01-31", payments: [{ month: 1,
      paymentDate: "2024-02-29", interestBasis: "projected", subsidizedInterest: 0 }] });
    expect(() => validateMortgageRefundInput(input)).not.toThrow();
  });

  it.each(["2026-00", "2026-13", "2026-1", "2026-01-01", "", undefined])("rejects invalid payroll month %s", fromMonth => {
    invalid({ ...sample(), participants: [{ ...person(), incomePeriods: [{ ...income(), fromMonth }] }] });
  });

  it("rejects reversed, overlapping and duplicate income ranges", () => {
    invalid({ ...sample(), participants: [{ ...person(), incomePeriods: [income(100, "2026-04", "2026-01")] }] });
    invalid({ ...sample(), participants: [{ ...person(), incomePeriods: [income(), income()] }] });
    invalid({ ...sample(), participants: [{ ...person(), incomePeriods: [income(100, "2026-01", "2026-02"), income(100, "2026-02", "2026-03")] }] });
  });

  it("rejects duplicate people, missing borrower roles and multiple borrowers", () => {
    invalid({ ...sample(), participants: [person(), person("borrower", "co_borrower")] });
    invalid({ ...sample(), participants: [person("co", "co_borrower")] });
    invalid({ ...sample(), participants: [person(), person("other")] });
    invalid({ ...sample(), participants: [] });
  });

  it("rejects invalid/undefined evidence instead of silently treating it as verified", () => {
    const input = sample();
    invalid({ ...input, eligibility: { ...input.eligibility, location: undefined } });
    invalid({ ...input, eligibility: { ...input.eligibility, residentFinancialLender: { value: true, verified: "yes" } } });
    invalid({ ...input, eligibility: { ...input.eligibility, location: { value: { region: "defanse" }, verified: true } } });
    invalid({ ...input, eligibility: { ...input.eligibility, permitDecisionDate: { value: "2021-02-29", verified: true } } });
  });

  it("rejects tax allocated beyond the month's selected salary tax", () => {
    const input = sample({ participants: [{ ...person(), incomePeriods: [{ ...income(), taxAlreadyAllocatedAMD: 21 }] }] });
    // Validation of period bounds happens first; selected-rate validation is financial.
    expect(() => calculate(input, rules)).toThrow(FinancingCalculationError);
  });

  it("rejects missing, duplicate or nonconsecutive monthly payment dates", () => {
    const input = sample();
    invalid({ ...input, payments: input.payments.slice(0, 2) });
    invalid({ ...input, payments: input.payments.map((row, index) => index === 1 ? { ...row, month: 1 } : row) });
    invalid({ ...input, payments: input.payments.map((row, index) => index === 1 ? { ...row, paymentDate: "2026-01-20" } : row) });
    invalid({ ...input, payments: input.payments.map((row, index) => index === 1 ? { ...row, paymentDate: "2026-03-20" } : row) });
    invalid({ ...input, payments: input.payments.map((row, index) => index === 0 ? { ...row, paymentDate: "2025-12-31" } : row) });
    invalid({ ...input, loanOriginationDate: "2025-01-01" });
  });

  it("rejects subsidies greater than selected interest and mixed paid/projected evidence", () => {
    const input = sample(); const [first, ...rest] = input.payments;
    invalid({ ...input, payments: [{ ...first, subsidizedInterest: 11 }, ...rest] });
    invalid({ ...input, payments: [{ ...first, interestBasis: "verified_paid" }, ...rest] });
    invalid({ ...input, payments: [{ ...first, interestBasis: "verified_paid", actualInterestPaid: 11 }, ...rest] });
    invalid({ ...input, payments: [{ ...first, actualInterestPaid: 10 }, ...rest] });
    invalid({ ...input, payments: [{ ...first, subsidizedInterest: undefined }, ...rest] });
  });

  it("rejects tampered or nonreconciling Phase 1 outputs without recomputing mortgage formulas", () => {
    const input = sample();
    invalid({ ...input, financing: { ...input.financing, totalInterest: 21 } });
    invalid({ ...input, financing: { ...input.financing, schedule: input.financing.schedule.map((row, index) => index === 0 ? { ...row, interestPaid: -1 } : row) } });
    invalid({ ...input, financing: { ...input.financing, schedule: input.financing.schedule.map((row, index) => index === 2 ? { ...row, remainingBalance: 1 } : row) } });
    invalid({ ...input, financing: { ...input.financing, schedule: input.financing.schedule.slice(0, 2) } });
    invalid({ ...input, financing: { ...input.financing, isEstimate: false } });
    invalid({ ...input, financing: { ...input.financing, regularMonthlyPayment: 1 } });
  });

  it("validates even configurations already known to be ineligible", () => {
    const input = sample();
    invalid({ ...input, eligibility: { ...input.eligibility, contractPriceAMD: { value: 56_000_000, verified: true } }, payments: [] });
  });

  it("rejects AMD overrides and inconsistent USD certificates", () => {
    const amd = sample(); const [first, ...rest] = amd.payments;
    const amountsAMD = { mortgagePayment: 100, scheduledInterest: 10, interest: 10, subsidizedInterest: 0, source: "supplied_projection" };
    invalid({ ...amd, payments: [{ ...first, amountsAMD }, ...rest] });
    const financing = calculateFinancing({ currency: "USD", financingType: "mortgage", apartmentPrice: 1250,
      downPaymentPercent: 20, annualInterestRatePercent: 12, durationMonths: 3 });
    const usd = sample({ financing }); const [usdFirst, ...usdRest] = usd.payments;
    invalid({ ...usd, payments: [{ ...usdFirst, amountsAMD: { ...amountsAMD, interest: 11 } }, ...usdRest] });
    invalid({ ...usd, payments: [{ ...usdFirst, amountsAMD: { ...amountsAMD, subsidizedInterest: 1 } }, ...usdRest] });
    invalid({ ...usd, payments: [{ ...usdFirst, interestBasis: "verified_paid", actualInterestPaid: 10, amountsAMD }, ...usdRest] });
  });
});

describe("versioned rule and standalone salary validation", () => {
  it.each([undefined, null, {}, { ...rules, version: "" }, { ...rules, reviewedAsOf: "tomorrow" },
    { ...rules, maxContractPriceAMD: -1 }, { ...rules, quarterlyCaps: [] }, { ...rules, salaryRates: [] },
    { ...rules, sources: [] }, { ...rules, firstRestrictedRegions: ["defanse"] },
    { ...rules, quarterlyCaps: [...rules.quarterlyCaps].reverse() },
    { ...rules, salaryRates: [{ fromMonth: "2026-01", ratePercent: Infinity }] },
  ])("rejects incomplete or invalid policy %s", invalidRules => {
    expect(() => validateRefundRules(invalidRules)).toThrow(FinancingCalculationError);
    expect(() => calculate(sample(), invalidRules as RefundRuleSet)).toThrow(FinancingCalculationError);
  });

  it.each([NaN, Infinity, -1, 0.1, "100", undefined])("validates standalone salary input %s", grossRegisteredSalaryAMD => {
    expect(() => calculateSalaryIncomeTax({ month: "2026-01", grossRegisteredSalaryAMD } as never, rules)).toThrow(FinancingCalculationError);
  });

  it("does not use an implicit rule version or a net-salary field", () => {
    expect(() => calculate(sample(), undefined as never)).toThrow(FinancingCalculationError);
    expect(() => calculateSalaryIncomeTax({ month: "2026-01", netSalaryAMD: 100 } as never, rules)).toThrow(FinancingCalculationError);
  });
});
