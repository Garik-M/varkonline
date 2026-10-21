import { describe, expect, it } from "vitest";
import { calculateFinancing } from "../..";
import {
  ARMENIA_REFUND_RULES_2026_10 as rules,
  calculateMonthlyMortgageRefundEstimate,
  calculateMortgageRefundScenario,
} from "..";
import { income, paymentDates, sample } from "./fixtures";

function input() {
  const financing = calculateFinancing({
    financingType: "mortgage",
    currency: "AMD",
    apartmentPrice: 35000000,
    downPaymentPercent: 20,
    durationMonths: 240,
    annualInterestRatePercent: 10,
  });
  return {
    financing,
    loanOriginationDate: "2026-10-21",
    payments: paymentDates(financing, "2026-11"),
    participants: [
      {
        id: "borrower",
        role: "borrower" as const,
        incomePeriods: [income(695429, "2026-10", "2046-12")],
      },
    ],
  };
}

describe("conservative monthly mortgage refund estimate", () => {
  it("fixes the reported first two payment spikes and matches an independent 90-digit Decimal calculation", () => {
    const data = input();
    const result = calculateMonthlyMortgageRefundEstimate(data, rules);
    expect(result.calculationMethod).toBe("monthly_tax_limit");
    expect(result.calculationBasis).toBe("financial_scenario");
    expect(result.eligibility.status).toBe("not_assessed");
    expect(
      result.monthlySchedule
        .slice(0, 3)
        .map((row) => [
          row.bankPaymentAMD,
          row.eligibleInterestAMD,
          row.allocatedRefundAMD,
          row.costAfterAllocatedRefundAMD,
        ]),
    ).toEqual([
      [270206, 233333, 139086, 131120],
      [270206, 233026, 139086, 131120],
      [270206, 232716, 139086, 131120],
    ]);
    expect(result.totalEstimatedRefundAMD).toBe(28114727);
    expect(result.totalEffectiveFinancingCostAMD).toBe(36734768);
    expect(result.monthlySchedule.at(-1)).toMatchObject({
      bankPaymentAMD: 270261,
      allocatedRefundAMD: 2234,
      costAfterAllocatedRefundAMD: 268027,
    });
    for (const row of result.monthlySchedule) {
      expect(row.allocatedRefundAMD).toBeLessThanOrEqual(139086);
      expect(row.allocatedRefundAMD).toBeLessThanOrEqual(
        row.eligibleInterestAMD!,
      );
    }
    expect(result.quarterlySchedule[0].estimatedRefundAMD).toBe(278172);
    expect(
      result.quarterlySchedule.reduce(
        (total, row) => total + row.estimatedRefundAMD!,
        0,
      ),
    ).toBe(result.totalEstimatedRefundAMD);
    // Statutory quarterly pooling remains available and explicitly distinguishable.
    const quarterly = calculateMortgageRefundScenario(data, rules);
    expect(quarterly.calculationMethod).toBe("quarterly_pool");
    expect(quarterly.monthlySchedule[0].allocatedRefundAMD).toBe(208742);
  });

  it("does not use tax from a month without a payment or move unused tax to another month", () => {
    const data = sample();
    const scenario = {
      financing: data.financing,
      loanOriginationDate: data.loanOriginationDate,
      payments: data.payments,
      participants: [
        {
          id: "one",
          role: "borrower" as const,
          incomePeriods: [
            income(0, "2026-01", "2026-02"),
            income(100, "2026-03", "2026-03"),
          ],
        },
      ],
    };
    const result = calculateMonthlyMortgageRefundEstimate(scenario, rules);
    expect(result.monthlySchedule.map((row) => row.allocatedRefundAMD)).toEqual(
      [0, 0, 3],
    );
    expect(result.totalEstimatedRefundAMD).toBe(3);
    expect(
      calculateMortgageRefundScenario(scenario, rules).totalEstimatedRefundAMD,
    ).toBe(20);
  });

  it("still applies one shared quarterly cap across co-borrowers and reconciles rounding", () => {
    const data = input();
    data.financing = calculateFinancing({
      financingType: "mortgage",
      currency: "AMD",
      apartmentPrice: 125000000,
      downPaymentPercent: 20,
      durationMonths: 240,
      annualInterestRatePercent: 12,
    });
    data.payments = paymentDates(data.financing);
    data.loanOriginationDate = "2026-01-01";
    const participants = ["one", "two"].map((id, index) => ({
      id,
      role: index ? ("co_borrower" as const) : ("borrower" as const),
      incomePeriods: [income(2000000, "2026-01", "2046-12")],
    }));
    const result = calculateMonthlyMortgageRefundEstimate(
      { ...data, participants },
      rules,
    );
    expect(result.quarterlySchedule[0].estimatedRefundAMD).toBe(750000);
    expect(
      result.monthlySchedule.slice(0, 3).map((row) => row.allocatedRefundAMD),
    ).toEqual([250000, 250000, 250000]);
  });
});
