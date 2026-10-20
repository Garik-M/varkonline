import { describe, expect, it } from "vitest";
import {
  emptyPayroll,
  paymentDates,
  payrollParticipant,
  quarterIncomeRange,
  wholeAmount,
} from "../refund-model";
describe("refund presentation adapter", () => {
  it("keeps a contractual day across leap years and month ends", () => {
    expect(paymentDates("2024-01-31", 4)).toEqual([
      "2024-01-31",
      "2024-02-29",
      "2024-03-31",
      "2024-04-30",
    ]);
    expect(() => paymentDates("2026-02-30", 1)).toThrow();
  });
  it("requests complete calendar quarter salaries, not three-row blocks", () => {
    expect(quarterIncomeRange(paymentDates("2026-02-28", 3))).toEqual({
      fromMonth: "2026-01",
      toMonth: "2026-06",
    });
  });
  it("constructs explicit financial assumptions without inventing legal facts", () => {
    const result = payrollParticipant(
      { ...emptyPayroll(), gross: "500000" },
      ["2026-01-31"],
      "borrower",
    );
    expect(result).not.toHaveProperty("eligibility");
    expect(result.incomePeriods[0]).toMatchObject({
      taxPaymentStatus: "projected",
      tuitionRefundClaimed: false,
      taxAlreadyAllocatedAMD: 0,
    });
  });
  it("zero withheld tax explicitly overrides estimation and money uses whole AMD", () => {
    const result = payrollParticipant(
      { ...emptyPayroll(), gross: "500000", withheld: "0" },
      ["2026-01-31"],
      "borrower",
    );
    expect(result.incomePeriods[0].actualIncomeTaxWithheldAMD).toBe(0);
    for (const value of ["1.1", "-1", "", "1e4", "NaN"])
      expect(() => wholeAmount(value)).toThrow();
  });
});
