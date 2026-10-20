import { describe, expect, it } from "vitest";
import { calculateFinancing } from "../engine";
const base = {
  financingType: "mortgage",
  currency: "AMD",
  apartmentPrice: 1000000,
  downPaymentPercent: 10,
  annualInterestRatePercent: 12,
  durationMonths: 3,
} as const;
describe("explicit repayment methods and whole-unit down payment", () => {
  it("equal principal uses declining outstanding-balance interest", () => {
    const result = calculateFinancing({
      ...base,
      repaymentMethod: "equal_principal",
    });
    expect(
      result.schedule.map((row) => [
        row.principalPaid,
        row.interestPaid,
        row.scheduledPayment,
        row.remainingBalance,
      ]),
    ).toEqual([
      [300000, 9000, 309000, 600000],
      [300000, 6000, 306000, 300000],
      [300000, 3000, 303000, 0],
    ]);
    expect(result.totalInterest).toBe(18000);
  });
  it("distributes indivisible principal without accumulating a large final balance", () => {
    const result = calculateFinancing({
      ...base,
      apartmentPrice: 1001,
      downPaymentPercent: 0,
      repaymentMethod: "equal_principal",
      annualInterestRatePercent: 0,
    });
    expect(result.schedule.map((row) => row.scheduledPayment)).toEqual([
      334, 333, 334,
    ]);
    expect(result.totalFinancedRepayment).toBe(1001);
  });
  it("retains the annuity contract when no method is supplied", () => {
    expect(calculateFinancing(base).schedule).toEqual(
      calculateFinancing({ ...base, repaymentMethod: "annuity" }).schedule,
    );
  });
  it("retains exact dram input and rejects contradictory inputs", () => {
    expect(
      calculateFinancing({
        ...base,
        apartmentPrice: 35000001,
        downPaymentAmount: 7000001,
        downPaymentPercent: (7000001 / 35000001) * 100,
      }).downPaymentAmount,
    ).toBe(7000001);
    expect(() =>
      calculateFinancing({ ...base, downPaymentAmount: 1 }),
    ).toThrow();
  });
  it("rejects floating-rate predictions and developer repayment methods", () => {
    expect(() =>
      calculateFinancing({ ...base, repaymentMethod: "floating" } as never),
    ).toThrow();
    expect(() =>
      calculateFinancing({
        financingType: "developer_installment",
        currency: "AMD",
        apartmentPrice: 1000,
        downPaymentPercent: 0,
        durationMonths: 3,
        formula: "interest_free",
        repaymentMethod: "annuity",
      } as never),
    ).toThrow();
  });
  it("supports both down-payment boundaries and repeatable independent schedules", () => {
    for (const currency of ["AMD", "USD"] as const)
      for (const downPaymentPercent of [0, 100]) {
        const input = {
          ...base,
          currency,
          downPaymentPercent,
          repaymentMethod: "equal_principal" as const,
        };
        expect(calculateFinancing(input)).toEqual(calculateFinancing(input));
        expect(
          calculateFinancing(input).schedule.at(-1)?.remainingBalance ?? 0,
        ).toBe(0);
      }
  });
});
