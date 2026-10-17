import { describe, expect, it } from "vitest";
import { calculateFinancing } from "../..";
import { ARMENIA_REFUND_RULES_2026_10 as rules, evaluateMortgageRefundEligibility,
  type ArmenianRegion, type MortgageEligibilityFacts, type PropertyLocation } from "..";
import { context, sample, verified } from "./fixtures";

function evaluate(facts: Partial<MortgageEligibilityFacts> = {}, date = "2026-01-01") {
  const input = context(sample());
  return evaluateMortgageRefundEligibility({ ...input, loanOriginationDate: date,
    eligibility: { ...input.eligibility, ...facts } }, rules);
}

describe("official eligibility rules", () => {
  it("accepts supplied verified conditions without claiming government approval", () => {
    expect(evaluate()).toMatchObject({ status: "eligible", reasons: [{ code: "CONDITIONS_VERIFIED" }] });
  });

  it("applies the cap to contractual purchase price, with exactly 55 million allowed", () => {
    for (const [price, status] of [[55_000_000, "eligible"], [55_000_001, "ineligible"]] as const) {
      const financing = calculateFinancing({ currency: "AMD", financingType: "mortgage",
        apartmentPrice: price, downPaymentPercent: 90, annualInterestRatePercent: 12, durationMonths: 3 });
      const result = evaluateMortgageRefundEligibility(context(sample({ financing })), rules);
      expect(result.status).toBe(status);
      if (status === "ineligible") expect(result.reasons.map(row => row.code)).toContain("CONTRACT_PRICE_EXCEEDS_LIMIT");
    }
  });

  it("does not apply the purchase-price ceiling to building one's own house", () => {
    expect(evaluate({ acquisitionType: verified("self_build_house"), contractPriceAMD: verified(100_000_000),
      validSelfBuildPermit: verified(true) }).status).toBe("eligible");
    expect(evaluate({ acquisitionType: verified("self_build_house"), validSelfBuildPermit: verified(false) }).status).toBe("ineligible");
  });

  it.each(["secondary_market", "assignment_from_individual"] as const)("rejects %s", acquisitionType => {
    expect(evaluate({ acquisitionType: verified(acquisitionType) }).status).toBe("ineligible");
  });

  it("requires individual review for special construction-right contracts", () => {
    expect(evaluate({ acquisitionType: verified("construction_right_acquisition") }).status).toBe("requires_verification");
  });

  it.each([
    [1, "2022-07-01"], [2, "2023-01-01"], [3, "2023-07-01"], ["other", "2025-01-01"],
  ] as const)("checks the actual zone %s origination cutoff %s", (valuationZone, cutoff) => {
    const location = verified<PropertyLocation>({ region: "yerevan", valuationZone });
    const before = cutoff === "2022-07-01" ? "2022-06-30" : cutoff === "2023-01-01" ? "2022-12-31" :
      cutoff === "2023-07-01" ? "2023-06-30" : "2024-12-31";
    expect(evaluate({ location }, before).status).toBe("eligible");
    expect(evaluate({ location }, cutoff).status).toBe("requires_verification");
    expect(evaluate({ location }, `${cutoff.slice(0, 8)}02`).status).toBe("ineligible");
  });

  it.each([1, 2, 3, "other", null] as const)("preserves the verified pre-2022 permit exception in Yerevan zone %s", valuationZone => {
    const result = evaluate({ location: verified({ region: "yerevan", valuationZone }),
      permitDecisionDate: verified("2021-12-31") });
    expect(result.status).toBe("eligible");
    expect(result.reasons.map(row => row.code)).toContain("PERMIT_EXCEPTION_APPLIED");
  });

  it("does not treat a permit granted in 2022 as a transitional exception", () => {
    expect(evaluate({ location: verified({ region: "yerevan", valuationZone: 1 }),
      permitDecisionDate: verified("2022-01-01") }).status).toBe("ineligible");
  });

  it("requires proof of the permit exception instead of rejecting all Yerevan apartments", () => {
    expect(evaluate({ location: verified({ region: "yerevan", valuationZone: 1 }), permitDecisionDate: null }).status).toBe("requires_verification");
    expect(evaluate({ location: verified({ region: "yerevan", valuationZone: 1 }),
      permitDecisionDate: { value: "2021-01-01", verified: false } }).status).toBe("requires_verification");
  });

  it("needs a valuation zone only when it changes the legal outcome", () => {
    const location = verified<PropertyLocation>({ region: "yerevan", valuationZone: null });
    expect(evaluate({ location }, "2021-12-01").status).toBe("eligible");
    expect(evaluate({ location }, "2023-04-01").status).toBe("requires_verification");
    expect(evaluate({ location }, "2026-04-01").status).toBe("ineligible");
  });

  it.each(["aragatsotn", "ararat", "armavir", "kotayk"] as const)("applies the 2027 regional restriction to %s", region => {
    const location = verified<PropertyLocation>({ region, governmentBorderSettlement: verified(false) });
    expect(evaluate({ location }, "2026-12-31").status).toBe("eligible");
    expect(evaluate({ location }, "2027-01-01").status).toBe("requires_verification");
    expect(evaluate({ location, permitDecisionDate: verified("2021-01-01") }, "2027-01-02").status).toBe("ineligible");
  });

  it.each(["shirak", "lori", "tavush", "gegharkunik", "syunik", "vayots_dzor"] as const)("applies the 2029 regional restriction to %s", region => {
    const location = verified<PropertyLocation>({ region, governmentBorderSettlement: verified(false) });
    expect(evaluate({ location }, "2028-12-31").status).toBe("eligible");
    expect(evaluate({ location }, "2029-01-02").status).toBe("ineligible");
  });

  it.each(["kotayk", "syunik"] as ArmenianRegion[])("allows only a verified government-listed border settlement exception in %s", region => {
    expect(evaluate({ location: verified({ region, governmentBorderSettlement: verified(true) }) }, "2030-01-02").status).toBe("eligible");
    expect(evaluate({ location: verified({ region, governmentBorderSettlement: null }) }, "2030-01-02").status).toBe("requires_verification");
  });

  it.each([
    ["residentFinancialLender", "NON_RESIDENT_FINANCIAL_LENDER"],
    ["fundsUsedForHousing", "NOT_USED_FOR_HOUSING"],
    ["propertyRightsRegistered", "RIGHTS_NOT_REGISTERED"],
    ["requiredDocumentsAvailable", "DOCUMENTS_INCOMPLETE"],
  ] as const)("checks verified %s", (field, code) => {
    expect(evaluate({ [field]: null }).status).toBe("requires_verification");
    expect(evaluate({ [field]: { value: false, verified: false } }).status).toBe("requires_verification");
    const result = evaluate({ [field]: verified(false) });
    expect(result.status).toBe("ineligible");
    expect(result.reasons.map(row => row.code)).toContain(code);
  });

  it("does not infer a partner's location, contract price or eligibility", () => {
    expect(evaluate({ location: null, contractPriceAMD: null }).status).toBe("requires_verification");
    expect(evaluate({ contractPriceAMD: verified(1000) }).status).toBe("requires_verification");
    expect(evaluate({ location: verified({ region: "outside_armenia" }) }).status).toBe("ineligible");
  });

  it("keeps legacy originations under review rather than applying new purchase/geography limits", () => {
    expect(evaluate({ contractPriceAMD: verified(100_000_000) }, "2017-12-31").status).toBe("requires_verification");
  });

  it("never declares date-dependent ineligibility from an unverified origination date", () => {
    const input = context(sample());
    expect(evaluateMortgageRefundEligibility({ ...input, originationDateVerified: false,
      eligibility: { ...input.eligibility, location: verified({ region: "yerevan", valuationZone: 1 }) } }, rules).status).toBe("requires_verification");
  });
});
