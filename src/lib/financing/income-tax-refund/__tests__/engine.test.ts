import { describe, expect, it } from "vitest";
import { calculateFinancing } from "../..";
import { ARMENIA_REFUND_RULES_2026_10 as rules, calculateMortgageIncomeTaxRefund as calculate,
  type MortgageRefundInput, type MortgageRefundResult, type RefundRuleSet } from "..";
import { clone, income, paymentDates, person, sample, verified } from "./fixtures";
import { refundReferenceCases } from "./reference-cases";

function reconcile(result: MortgageRefundResult) {
  for (const row of result.quarterlySchedule) {
    if (row.estimatedRefundAMD !== null) {
      expect(Number.isSafeInteger(row.estimatedRefundAMD)).toBe(true);
      expect(row.estimatedRefundAMD).toBeGreaterThanOrEqual(0);
      if (row.eligibleInterestAMD !== null) expect(row.estimatedRefundAMD).toBeLessThanOrEqual(row.eligibleInterestAMD);
      if (row.eligibleIncomeTaxAMD !== null) expect(row.estimatedRefundAMD).toBeLessThanOrEqual(row.eligibleIncomeTaxAMD);
      if (row.quarterlyRefundCapAMD !== null) expect(row.estimatedRefundAMD).toBeLessThanOrEqual(row.quarterlyRefundCapAMD);
      if (row.mortgagePaymentsBeforeRefundAMD !== null) expect(row.effectiveFinancingCostAMD).toBe(row.mortgagePaymentsBeforeRefundAMD - row.estimatedRefundAMD);
    }
  }
  if (result.totalEstimatedRefundAMD !== null) {
    expect(result.quarterlySchedule.reduce((sum, row) => sum + (row.estimatedRefundAMD ?? 0), 0)).toBe(result.totalEstimatedRefundAMD);
    expect(result.annualRefunds.reduce((sum, row) => sum + (row.estimatedRefundAMD ?? 0), 0)).toBe(result.totalEstimatedRefundAMD);
  }
  if (result.totalEffectiveFinancingCostAMD !== null && result.totalMortgagePaymentsBeforeRefundAMD !== null) {
    expect(result.totalEffectiveFinancingCostAMD).toBe(result.totalMortgagePaymentsBeforeRefundAMD - (result.totalEstimatedRefundAMD ?? 0));
  }
}

describe("independent refund reference examples", () => {
  it.each(refundReferenceCases)("matches $financingInput.apartmentPrice AMD, $financingInput.durationMonths months from $firstMonth", test => {
    const financing = calculateFinancing(test.financingInput);
    const input = sample({ financing, loanOriginationDate: test.originated,
      payments: paymentDates(financing, test.firstMonth), participants: [{ ...person(),
        incomePeriods: [income(test.salary, test.incomeFrom, test.incomeTo)] }] });
    const result = calculate(input, rules);
    expect(result.eligibility.status).toBe("eligible");
    expect(result).toMatchObject(test.expectedTotals);
    expect(result.annualRefunds).toEqual(test.expectedAnnual);
    expect(result.quarterlySchedule).toHaveLength(test.expectedQuarters.length);
    test.expectedQuarters.forEach((row, index) => expect(result.quarterlySchedule[index]).toMatchObject(row));
    reconcile(result);
  });
});

describe("quarterly refund calculation", () => {
  it("uses mortgage interest, never principal or the whole bank payment", () => {
    const input = sample(); const result = calculate(input, rules);
    expect(result.totalEstimatedRefundAMD).toBe(20); // Hand schedule: interest 10 + 7 + 3.
    expect(result.monthlyIncomeTax.map(row => row.selectedIncomeTaxAMD)).toEqual([20, 20, 20]);
    expect(result.totalMortgagePaymentsBeforeRefundAMD).toBe(1020);
    expect(result.totalEffectiveFinancingCostAMD).toBe(1000);
    expect(result.originalRegularMonthlyBankPayment).toBe(340);
    expect(result.bankPayments.map(row => row.originalBankPayment)).toEqual([340, 340, 340]);
    expect(result.effectiveAverageMonthlyFinancingCostAMD).toBe(333);
    expect(result.bankPayments[0].originalBankPayment).not.toBe(result.effectiveAverageMonthlyFinancingCostAMD);
    reconcile(result);
  });

  it("limits refunds to income tax when tax is lower than interest", () => {
    const result = calculate(sample({ participants: [{ ...person(), incomePeriods: [income(5)] }] }), rules);
    expect(result.totalEstimatedRefundAMD).toBe(3); // 5 AMD gross * 20% * 3 months.
  });

  it.each(["2024-12-31", "2025-01-01"])("selects one lifetime-origination cap for %s, not a cap based on payment year", loanOriginationDate => {
    const financing = calculateFinancing({ currency: "AMD", financingType: "mortgage", apartmentPrice: 55_000_000,
      downPaymentPercent: 0, annualInterestRatePercent: 12, durationMonths: 120 });
    const input = sample({ financing, loanOriginationDate, payments: paymentDates(financing, "2025-01"),
      participants: [{ ...person(), incomePeriods: [income(10_000_000, "2025-01", "2035-12")] }] });
    const result = calculate(input, rules);
    const cap = loanOriginationDate === "2024-12-31" ? 1_500_000 : 750_000;
    expect(result.quarterlySchedule[0].quarterlyRefundCapAMD).toBe(cap);
    expect(result.quarterlySchedule[0].estimatedRefundAMD).toBe(cap);
    expect(result.quarterlySchedule.every(row => row.quarterlyRefundCapAMD === cap)).toBe(true);
    expect(result.eligibility.status).toBe("eligible"); // Existing loan survives later regional phase-outs.
    reconcile(result);
  });

  it("groups partial quarters and year boundaries using explicit dates", () => {
    const financing = calculateFinancing({ currency: "AMD", financingType: "mortgage", apartmentPrice: 1250,
      downPaymentPercent: 20, annualInterestRatePercent: 12, durationMonths: 3 });
    const result = calculate(sample({ financing, loanOriginationDate: "2026-11-30",
      payments: paymentDates(financing, "2026-12"), participants: [{ ...person(),
        incomePeriods: [income(100, "2026-10", "2027-03")] }] }), rules);
    expect(result.quarterlySchedule.map(row => [row.year, row.quarter, row.paymentMonths, row.estimatedRefundAMD])).toEqual([
      [2026, 4, [1], 10], [2027, 1, [2, 3], 10],
    ]);
    expect(result.quarterlySchedule.map(row => row.eligibleIncomeTaxAMD)).toEqual([60, 60]);
    expect(result.quarterlySchedule[0]).toMatchObject({ periodStart: "2026-10-01", periodEnd: "2026-12-31", quarterlyRefundCapAMD: 750_000 });
    expect(result.quarterlySchedule[1]).toMatchObject({ periodStart: "2027-01-01", periodEnd: "2027-03-31" });
    expect(result.annualRefunds).toEqual([{ year: 2026, estimatedRefundAMD: 10 }, { year: 2027, estimatedRefundAMD: 10 }]);
    reconcile(result);
  });

  it("uses all three calendar-quarter salary months, with no monthly interest/tax minimum", () => {
    const input = sample({ participants: [{ ...person(), incomePeriods: [
      income(0, "2026-01", "2026-01"), income(0, "2026-02", "2026-02"), income(100, "2026-03", "2026-03"),
    ] }] });
    expect(calculate(input, rules).totalEstimatedRefundAMD).toBe(20);
  });

  it("handles changing salary across multiple quarters without carrying unused tax", () => {
    const financing = calculateFinancing({ currency: "AMD", financingType: "mortgage", apartmentPrice: 1250,
      downPaymentPercent: 20, annualInterestRatePercent: 12, durationMonths: 6 });
    const input = sample({ financing, participants: [{ ...person(), incomePeriods: [
      income(100_000, "2026-01", "2026-03"), income(0, "2026-04", "2026-06"),
    ] }] });
    const result = calculate(input, rules);
    expect(result.quarterlySchedule[0].estimatedRefundAMD).toBe(result.quarterlySchedule[0].eligibleInterestAMD);
    expect(result.quarterlySchedule[1].eligibleInterestAMD).toBeGreaterThan(0);
    expect(result.quarterlySchedule[1].estimatedRefundAMD).toBe(0);
    reconcile(result);
  });

  it.each([0, 5])("honors actual monthly tax withheld %s including zero", actualIncomeTaxWithheldAMD => {
    const result = calculate(sample({ participants: [{ ...person(), incomePeriods: [{ ...income(), actualIncomeTaxWithheldAMD }] }] }), rules);
    expect(result.quarterlySchedule[0].eligibleIncomeTaxAMD).toBe(actualIncomeTaxWithheldAMD * 3);
    expect(result.totalEstimatedRefundAMD).toBe(Math.min(20, actualIncomeTaxWithheldAMD * 3));
  });

  it("handles zero gross salary and zero interest without inventing refunds", () => {
    const zeroIncome = calculate(sample({ participants: [{ ...person(), incomePeriods: [income(0)] }] }), rules);
    expect(zeroIncome.eligibility.status).toBe("eligible");
    expect(zeroIncome.totalEstimatedRefundAMD).toBe(0);
    const financing = calculateFinancing({ currency: "AMD", financingType: "mortgage", apartmentPrice: 1250,
      downPaymentPercent: 20, annualInterestRatePercent: 0, durationMonths: 3 });
    expect(calculate(sample({ financing }), rules).totalEstimatedRefundAMD).toBe(0);
  });

  it("subtracts subsidies from paid interest and distinguishes projections from confirmed payments", () => {
    const input = sample();
    const result = calculate({ ...input, payments: input.payments.map((row, index) => index === 0
      ? { ...row, interestBasis: "verified_paid", actualInterestPaid: 5, subsidizedInterest: 1 } : row) }, rules);
    expect(result.quarterlySchedule[0]).toMatchObject({ projectedMortgageInterestAMD: 20, interestUsedAMD: 15,
      subsidizedInterestAMD: 1, eligibleInterestAMD: 14, estimatedRefundAMD: 14,
      verifiedInterestPaidAMD: 5, hasProjectedInterest: true });
    expect(result.bankPayments.map(row => row.originalBankPayment)).toEqual([340, 340, 340]);
  });

  it("reports fully supplied bank-confirmed interest separately from projected interest", () => {
    const input = sample();
    const result = calculate({ ...input, payments: input.payments.map((row, index) => ({ ...row,
      interestBasis: "verified_paid", actualInterestPaid: input.financing.schedule[index].interestPaid })),
    participants: [{ ...person(), incomePeriods: [{ ...income(), actualIncomeTaxWithheldAMD: 20, taxPaymentStatus: "verified_paid" }] }] }, rules);
    expect(result.quarterlySchedule[0]).toMatchObject({ hasProjectedInterest: false, verifiedInterestPaidAMD: 20, hasProjectedTaxPayments: false });
    expect(result.isEstimate).toBe(true);
  });

  it("can exclude all interest when a subsidy pays it", () => {
    const input = sample();
    expect(calculate({ ...input, payments: input.payments.map((row, index) => ({ ...row,
      subsidizedInterest: input.financing.schedule[index].interestPaid })) }, rules).totalEstimatedRefundAMD).toBe(0);
  });
});

describe("co-borrowers and overlapping benefits", () => {
  it("combines distinct eligible co-owner salary taxes only once", () => {
    const participants = [{ ...person(), incomePeriods: [income(5)] },
      { ...person("co", "co_borrower"), incomePeriods: [income(10)] }];
    const result = calculate(sample({ participants }), rules);
    expect(result.quarterlySchedule[0].eligibleIncomeTaxAMD).toBe(9);
    expect(result.totalEstimatedRefundAMD).toBe(9);
    expect(result.monthlyIncomeTax).toHaveLength(6);
  });

  it("shares a single quarterly cap rather than multiplying it per co-borrower", () => {
    const financing = calculateFinancing({ currency: "AMD", financingType: "mortgage", apartmentPrice: 50_000_000,
      downPaymentPercent: 0, annualInterestRatePercent: 12, durationMonths: 240 });
    const participants = [person(), person("co", "co_borrower")].map(row => ({ ...row,
      incomePeriods: [income(10_000_000, "2026-01", "2046-12")] }));
    const result = calculate(sample({ financing, participants }), rules);
    expect(result.quarterlySchedule[0].estimatedRefundAMD).toBe(750_000);
    reconcile(result);
  });

  it("excludes an ineligible co-borrower without excluding the eligible borrower", () => {
    const co = person("co", "co_borrower");
    const result = calculate(sample({ participants: [{ ...person(), incomePeriods: [income(5)] },
      { ...co, eligibility: { ...co.eligibility, ownerOrCoOwner: verified(false) } }] }), rules);
    expect(result.totalEstimatedRefundAMD).toBe(3);
    expect(result.quarterlySchedule[0].participants[1].eligibility.status).toBe("ineligible");
  });

  it.each(["none", "same_mortgage", "pre_2018_only"] as const)("allows prior-use category %s", priorBenefitUse => {
    const borrower = person();
    expect(calculate(sample({ participants: [{ ...borrower, eligibility: {
      ...borrower.eligibility, priorBenefitUse: verified(priorBenefitUse) } }] }), rules).totalEstimatedRefundAMD).toBe(20);
  });

  it("excludes a person who used the post-2018 benefit on a different mortgage", () => {
    const borrower = person();
    const result = calculate(sample({ participants: [{ ...borrower, eligibility: {
      ...borrower.eligibility, priorBenefitUse: verified("other_post_2018_mortgage") } }] }), rules);
    expect(result.eligibility.status).toBe("ineligible");
    expect(result.totalEstimatedRefundAMD).toBe(0);
  });

  it("excludes a whole participant-quarter with a tuition refund, while other eligible co-borrowers can qualify", () => {
    const borrower = { ...person(), incomePeriods: [{ ...income(5), tuitionRefundClaimed: true }] };
    const alone = calculate(sample({ participants: [borrower] }), rules);
    expect(alone.totalEstimatedRefundAMD).toBe(0);
    const withCo = calculate(sample({ participants: [borrower, { ...person("co", "co_borrower"), incomePeriods: [income(5)] }] }), rules);
    expect(withCo.totalEstimatedRefundAMD).toBe(3);
  });

  it("deducts tax already allocated to other claims without refunding it twice", () => {
    const result = calculate(sample({ participants: [{ ...person(), incomePeriods: [{ ...income(), taxAlreadyAllocatedAMD: 15 }] }] }), rules);
    expect(result.quarterlySchedule[0].eligibleIncomeTaxAMD).toBe(15);
    expect(result.totalEstimatedRefundAMD).toBe(15);
  });

  it("excludes the quarter until every month's salary-tax obligation for the person is settled", () => {
    const result = calculate(sample({ participants: [{ ...person(), incomePeriods: [
      income(100, "2026-01", "2026-01"), { ...income(100, "2026-02", "2026-02"), taxPaymentStatus: "unpaid" },
      income(100, "2026-03", "2026-03"),
    ] }] }), rules);
    expect(result.totalEstimatedRefundAMD).toBe(0);
  });
});

describe("unresolved facts, unsupported financing and currencies", () => {
  it("returns null, not a promised refund, for missing legal evidence", () => {
    const input = sample();
    const result = calculate({ ...input, eligibility: { ...input.eligibility, location: null } }, rules);
    expect(result.eligibility.status).toBe("requires_verification");
    expect(result.totalEstimatedRefundAMD).toBeNull();
    expect(result.quarterlySchedule[0].estimatedRefundAMD).toBeNull();
    expect(result.totalEffectiveFinancingCostAMD).toBeNull();
    expect(result.originalRegularMonthlyBankPayment).toBe(340);
  });

  it("preserves resolved annual/quarterly amounts when a later quarter is unresolved", () => {
    const input = sample({ loanOriginationDate: "2026-11-30", payments: paymentDates(sample().financing, "2026-12"),
      participants: [{ ...person(), incomePeriods: [income(100, "2026-10", "2027-02")] }] });
    const result = calculate(input, rules);
    expect(result.quarterlySchedule[0].estimatedRefundAMD).toBe(10);
    expect(result.quarterlySchedule[1].estimatedRefundAMD).toBeNull();
    expect(result.annualRefunds).toEqual([{ year: 2026, estimatedRefundAMD: 10 }, { year: 2027, estimatedRefundAMD: null }]);
    expect(result.totalEstimatedRefundAMD).toBeNull();
    expect(result.eligibility.status).toBe("requires_verification");
  });

  it.each(["missing", "tax_payment", "other_allocations", "tuition", "co_owner"] as const)("does not silently assume eligibility for unresolved %s", scenario => {
    let borrower = person();
    if (scenario === "missing") borrower = { ...borrower, incomePeriods: [income(100, "2026-02", "2026-03")] };
    if (scenario === "tax_payment") borrower = { ...borrower, incomePeriods: [{ ...income(), taxPaymentStatus: "unknown" }] };
    if (scenario === "other_allocations") borrower = { ...borrower, incomePeriods: [{ ...income(), taxAlreadyAllocatedAMD: null }] };
    if (scenario === "tuition") borrower = { ...borrower, incomePeriods: [{ ...income(), tuitionRefundClaimed: null }] };
    if (scenario === "co_owner") borrower = { ...borrower, eligibility: { ...borrower.eligibility, ownerOrCoOwner: null } };
    const result = calculate(sample({ participants: [borrower] }), rules);
    expect(result.totalEstimatedRefundAMD).toBeNull();
    expect(result.eligibility.status).toBe("requires_verification");
  });

  it("does not apply the mortgage refund to developer installment plans", () => {
    const financing = calculateFinancing({ currency: "AMD", financingType: "developer_installment",
      formula: "interest_free", apartmentPrice: 1250, downPaymentPercent: 20, durationMonths: 3 });
    const result = calculate(sample({ financing }), rules);
    expect(result.loanEligibility).toMatchObject({ status: "ineligible", reasons: [{ code: "NOT_A_MORTGAGE" }] });
    expect(result.totalEstimatedRefundAMD).toBe(0);
    expect(result.originalRegularMonthlyBankPayment).toBe(financing.regularMonthlyPayment);
  });

  it("handles fully paid properties without creating phantom quarters or interest", () => {
    const financing = calculateFinancing({ currency: "AMD", financingType: "mortgage", apartmentPrice: 1250,
      downPaymentPercent: 100, annualInterestRatePercent: 12, durationMonths: 3 });
    const result = calculate(sample({ financing }), rules);
    expect(result.quarterlySchedule).toEqual([]);
    expect(result.totalEstimatedRefundAMD).toBe(0);
    expect(result.effectiveAverageMonthlyFinancingCostAMD).toBe(0);
    expect(result.eligibility.status).toBe("ineligible");
  });

  it("does not assume USD amounts are AMD, or invent an exchange rate", () => {
    const financing = calculateFinancing({ currency: "USD", financingType: "mortgage", apartmentPrice: 1250,
      downPaymentPercent: 20, annualInterestRatePercent: 12, durationMonths: 3 });
    const input = sample({ financing });
    const result = calculate({ ...input, eligibility: { ...input.eligibility, contractPriceAMD: verified(500_000) } }, rules);
    expect(result.totalEstimatedRefundAMD).toBeNull();
    expect(result.totalMortgagePaymentsBeforeRefundAMD).toBeNull();
    expect(result.eligibility.status).toBe("requires_verification");
    expect(result.financingCurrency).toBe("USD");
    expect(result.originalRegularMonthlyBankPayment).toBe(340);
  });

  it("uses explicit supplied AMD amounts for USD schedules while preserving the USD bank obligation", () => {
    const financing = calculateFinancing({ currency: "USD", financingType: "mortgage", apartmentPrice: 1250,
      downPaymentPercent: 20, annualInterestRatePercent: 12, durationMonths: 3 });
    const input = sample({ financing });
    const result = calculate({ ...input, eligibility: { ...input.eligibility, contractPriceAMD: verified(500_000) },
      participants: [{ ...person(), incomePeriods: [income(100_000)] }],
      payments: input.payments.map((row, index) => ({ ...row, amountsAMD: {
        source: "supplied_projection", mortgagePayment: financing.schedule[index].scheduledPayment * 400,
        scheduledInterest: financing.schedule[index].interestPaid * 400,
        interest: financing.schedule[index].interestPaid * 400, subsidizedInterest: 0,
      } })) }, rules);
    expect(result.totalEstimatedRefundAMD).toBe(8000); // Explicit caller quote; no engine exchange-rate logic.
    expect(result.originalRegularMonthlyBankPayment).toBe(340);
    expect(result.bankPayments.map(row => row.originalBankPayment)).toEqual([340, 340, 340]);
    expect(result.refundCurrency).toBe("AMD");
    reconcile(result);
  });
});

describe("determinism, versioning and safe serialization", () => {
  it("does not mutate or retain salary, schedule, or rules objects", () => {
    const input = sample(); const original = clone(input);
    const deepFreeze = (value: unknown) => {
      if (value !== null && typeof value === "object") { Object.freeze(value); Object.values(value).forEach(deepFreeze); }
    };
    deepFreeze(input);
    const first = calculate(input, rules); const second = calculate(input, rules);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.rules.sources).not.toBe(rules.sources);
    expect(first.rules.quarterlyCaps).not.toBe(rules.quarterlyCaps);
    expect(first.rules).toEqual(rules);
    expect(input).toEqual(original);
    expect(JSON.parse(JSON.stringify(first))).toEqual(first);
    expect(first.assumptions.join(" ")).toContain("never reduces the bank obligation");
    expect(first.rules.version).toBe(rules.version);
  });

  it("updates legal caps through a versioned rule profile without rebuilding formulas", () => {
    const custom: RefundRuleSet = { ...rules, version: "test-profile", quarterlyCaps: [{ fromDate: "2018-01-01", amountAMD: 7 }] };
    const result = calculate(sample(), custom);
    expect(result.totalEstimatedRefundAMD).toBe(7);
    expect(result.rules.version).toBe("test-profile");
    expect(calculate(sample(), rules).totalEstimatedRefundAMD).toBe(20);
  });

  it("reconciles varied inputs without ever exceeding interest, income tax, or a shared cap", () => {
    for (const price of [1, 101, 1_000_000, 55_000_000]) {
      for (const rate of [0, 9.5, 100]) {
        for (const months of [1, 6, 36]) {
          const financing = calculateFinancing({ currency: "AMD", financingType: "mortgage", apartmentPrice: price,
            downPaymentPercent: 12.5, annualInterestRatePercent: rate, durationMonths: months });
          const input = sample({ financing, participants: [{ ...person(), incomePeriods: [income(300_003, "2026-01", "2029-12")] }] });
          const result = calculate(input, rules);
          reconcile(result);
          expect(result.originalRegularMonthlyBankPayment).toBe(financing.regularMonthlyPayment);
          expect(result.totalMortgagePaymentsBeforeRefundAMD).toBe(financing.totalFinancedRepayment);
        }
      }
    }
  });
});
