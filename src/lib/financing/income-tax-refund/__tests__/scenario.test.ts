import { describe, expect, it } from "vitest";
import { calculateFinancing } from "../..";
import {
  ARMENIA_REFUND_RULES_2026_10 as rules,
  calculateMortgageIncomeTaxRefund,
  calculateMortgageRefundScenario,
  type MortgageRefundScenarioInput,
} from "..";
import { sample, paymentDates, income } from "./fixtures";

function scenario(): MortgageRefundScenarioInput {
  const input = sample();
  return {
    financing: input.financing,
    loanOriginationDate: input.loanOriginationDate,
    payments: input.payments,
    participants: input.participants.map((person) => ({
      id: person.id,
      role: person.role,
      incomePeriods: person.incomePeriods,
    })),
  };
}
describe("financial refund scenario without eligibility assessment", () => {
  it("applies the origination-date cap once across all participants", () => {
    const financing = calculateFinancing({
      financingType: "mortgage",
      currency: "AMD",
      apartmentPrice: 125000000,
      downPaymentPercent: 20,
      annualInterestRatePercent: 12,
      durationMonths: 3,
    });
    // First month's interest alone is 1000000 AMD; combined quarter tax is 2400000 AMD.
    for (const [year, expected] of [
      [2024, 1500000],
      [2026, 750000],
    ] as const) {
      const result = calculateMortgageRefundScenario(
        {
          financing,
          loanOriginationDate: `${year}-01-01`,
          payments: paymentDates(financing, `${year}-01`),
          participants: [
            {
              id: "one",
              role: "borrower",
              incomePeriods: [income(2000000, `${year}-01`, `${year}-03`)],
            },
            {
              id: "two",
              role: "co_borrower",
              incomePeriods: [income(2000000, `${year}-01`, `${year}-03`)],
            },
          ],
        },
        rules,
      );
      expect(result.totalEstimatedRefundAMD).toBe(expected);
    }
  });
  it("reuses the exact quarterly arithmetic without manufacturing positive eligibility facts", () => {
    const input = scenario();
    const original = JSON.stringify(input);
    const result = calculateMortgageRefundScenario(input, rules);
    // 1000 principal, 1% monthly: interest 10+7+3=20. Salary tax 20*3=60; cap750000.
    expect(result.totalEstimatedRefundAMD).toBe(20);
    expect(result.calculationBasis).toBe("financial_scenario");
    expect(result.eligibility.status).toBe("not_assessed");
    expect(result.loanEligibility.status).toBe("not_assessed");
    for (const row of result.quarterlySchedule) {
      expect(row.eligibility.status).toBe("not_assessed");
      expect(row.participants[0].eligibility.status).toBe("not_assessed");
    }
    expect(JSON.stringify(result)).not.toMatch(
      /CONDITIONS_VERIFIED|CONDITIONS_DECLARED/,
    );
    expect(JSON.stringify(input)).toBe(original);
    expect(calculateMortgageRefundScenario(input, rules)).toEqual(result);
    // The existing entitlement evaluator still requires actual legal inputs.
    expect(() =>
      calculateMortgageIncomeTaxRefund(input as never, rules),
    ).toThrow();
  });
  it.each([
    [250000, 11312474, 49149244, 204789],
    [500000, 20950438, 39511280, 164630],
    [2000000, 32461718, 28000000, 116667],
  ])(
    "matches an independent 80-digit Decimal 20-year reference for salary %i",
    (gross, refund, net, average) => {
      const financing = calculateFinancing({
        financingType: "mortgage",
        currency: "AMD",
        apartmentPrice: 35000000,
        downPaymentPercent: 20,
        annualInterestRatePercent: 9,
        durationMonths: 240,
      });
      const input = scenario();
      const result = calculateMortgageRefundScenario(
        {
          ...input,
          financing,
          payments: paymentDates(financing),
          participants: [
            {
              id: "borrower",
              role: "borrower",
              incomePeriods: [income(gross, "2026-01", "2045-12")],
            },
          ],
        },
        rules,
      );
      expect(result.totalMortgagePaymentsBeforeRefundAMD).toBe(60461718);
      expect(result.totalEstimatedRefundAMD).toBe(refund);
      expect(result.totalEffectiveFinancingCostAMD).toBe(net);
      expect(result.effectiveAverageMonthlyFinancingCostAMD).toBe(average);
    },
  );
  it("retains unresolved financial inputs, and explicit zero tax", () => {
    const input = scenario();
    const person = input.participants[0];
    const zero = calculateMortgageRefundScenario(
      {
        ...input,
        participants: [
          {
            ...person,
            incomePeriods: [
              { ...person.incomePeriods[0], actualIncomeTaxWithheldAMD: 0 },
            ],
          },
        ],
      },
      rules,
    );
    expect(zero.totalEstimatedRefundAMD).toBe(0);
    const missing = calculateMortgageRefundScenario(
      { ...input, participants: [{ ...person, incomePeriods: [] }] },
      rules,
    );
    expect(missing.totalEstimatedRefundAMD).toBeNull();
    const usd = calculateFinancing({
      financingType: "mortgage",
      currency: "USD",
      apartmentPrice: 1250,
      downPaymentPercent: 20,
      annualInterestRatePercent: 12,
      durationMonths: 3,
    });
    expect(
      calculateMortgageRefundScenario({ ...input, financing: usd }, rules)
        .totalEstimatedRefundAMD,
    ).toBeNull();
  });
  it.each([
    { eligibility: {} },
    { originationDateVerified: true },
    { loanOriginationDate: "not-a-date" },
    { participants: [] },
    { payments: [] },
  ])("rejects unsupported or invalid scenario fields %j", (overrides) => {
    expect(() =>
      calculateMortgageRefundScenario(
        { ...scenario(), ...overrides } as never,
        rules,
      ),
    ).toThrow();
  });
  it("does not grant a mortgage refund to a developer installment plan", () => {
    const input = scenario();
    const financing = calculateFinancing({
      financingType: "developer_installment",
      formula: "interest_free",
      currency: "AMD",
      apartmentPrice: 1250,
      downPaymentPercent: 20,
      durationMonths: 3,
    });
    expect(
      calculateMortgageRefundScenario({ ...input, financing }, rules)
        .totalEstimatedRefundAMD,
    ).toBe(0);
  });
});
