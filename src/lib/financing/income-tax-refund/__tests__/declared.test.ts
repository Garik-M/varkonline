import { describe, expect, it } from "vitest";
import {
  ARMENIA_REFUND_RULES_2026_10 as rules,
  calculateMortgageIncomeTaxRefund as calculate,
  type MortgageRefundInput,
} from "..";
import { sample, clone } from "./fixtures";

function declared(): MortgageRefundInput {
  const input = clone(sample());
  const unverify = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
      if (key === "verified") (value as Record<string, unknown>)[key] = false;
      else unverify(nested);
    }
  };
  unverify(input);
  return { ...input, originationDateVerified: false, evidenceMode: "declared" };
}
describe("explicit declared refund scenarios", () => {
  it("matches an independent whole-unit reference without changing verification flags", () => {
    const input = declared();
    const original = JSON.stringify(input);
    const result = calculate(input, rules);
    // Principal 1000, rate 1% monthly: rounded interest 10 + 7 + 3 = 20.
    // Salary 100 AMD * 20% * 3 months = 60, cap 750000; min(20,60,750000)=20.
    expect(result.totalEstimatedRefundAMD).toBe(20);
    expect(result.evidenceMode).toBe("declared");
    expect(result.eligibility.reasons.map((reason) => reason.code)).toContain(
      "CONDITIONS_DECLARED",
    );
    expect(
      result.eligibility.reasons.map((reason) => reason.code),
    ).not.toContain("CONDITIONS_VERIFIED");
    expect(JSON.stringify(input)).toBe(original);
    expect(calculate(input, rules)).toEqual(result);
  });
  it("keeps the verified default strict", () => {
    const { evidenceMode: _mode, ...input } = declared();
    expect(calculate(input, rules).totalEstimatedRefundAMD).toBeNull();
    expect(
      calculate({ ...input, evidenceMode: "verified" }, rules).evidenceMode,
    ).toBe("verified");
  });
  it("leaves absent declarations unresolved", () => {
    const input = declared();
    expect(
      calculate(
        { ...input, eligibility: { ...input.eligibility, location: null } },
        rules,
      ).totalEstimatedRefundAMD,
    ).toBeNull();
  });
  it("applies declared exclusions even without a verified origination date", () => {
    const input = declared();
    for (const eligibility of [
      {
        ...input.eligibility,
        acquisitionType: { value: "secondary_market", verified: false },
      },
      {
        ...input.eligibility,
        residentFinancialLender: { value: false, verified: false },
      },
      {
        ...input.eligibility,
        location: {
          value: { region: "yerevan", valuationZone: null },
          verified: false,
        },
      },
      {
        ...input.eligibility,
        contractPriceAMD: { value: 55000001, verified: false },
      },
    ] as const) {
      const result = calculate({ ...input, eligibility }, rules);
      expect(result.eligibility.status).toBe("ineligible");
      expect(result.totalEstimatedRefundAMD).toBe(0);
    }
  });
  it("rejects unsupported evidence modes", () => {
    expect(() =>
      calculate(
        {
          ...declared(),
          evidenceMode: "automatic",
        } as unknown as MortgageRefundInput,
        rules,
      ),
    ).toThrow();
  });
});
