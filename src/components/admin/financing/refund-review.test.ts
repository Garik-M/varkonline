import { describe, expect, it } from "vitest";
import type { PartnerConfiguration } from "@/embed/types";
import { clearVerification, refundReviewError } from "./refund-review";

const empty = (): PartnerConfiguration["refund"] => ({
  enabled: true,
  defaultDevelopmentId: null,
  developments: [],
  propertyEvidence: [],
});
describe("document review safeguards", () => {
  it("clears nested review flags without changing recorded values or the saved source", () => {
    const saved = {
      facts: {
        location: {
          value: {
            region: "kotayk",
            governmentBorderSettlement: { value: false, verified: true },
          },
          verified: true,
        },
        contractPriceAMD: { value: 35000000, verified: true },
      },
      loanOriginationDate: { value: "2026-01-01", verified: true },
    };
    expect(clearVerification(saved)).toEqual({
      facts: {
        location: {
          value: {
            region: "kotayk",
            governmentBorderSettlement: { value: false, verified: false },
          },
          verified: false,
        },
        contractPriceAMD: { value: 35000000, verified: false },
      },
      loanOriginationDate: { value: "2026-01-01", verified: false },
    });
    expect(saved.facts.location.value.governmentBorderSettlement.verified).toBe(
      true,
    );
    expect(saved.facts.contractPriceAMD.verified).toBe(true);
  });
  it("requires a private reference even when only a nested fact is verified", () => {
    const refund = empty();
    refund.propertyEvidence.push({
      apartmentId: "A-101",
      facts: {
        location: {
          value: {
            region: "kotayk",
            governmentBorderSettlement: { value: false, verified: true },
          },
          verified: false,
        },
      },
    });
    expect(refundReviewError(refund)).toContain(
      "Apartment A-101 needs a document reference",
    );
    refund.propertyEvidence[0].verificationReference = "synthetic-record-123";
    expect(refundReviewError(refund)).toBeNull();
  });
  it("identifies unfinished records instead of silently saving an empty identity", () => {
    const refund = empty();
    refund.developments.push({ id: "building-one", name: "", facts: {} });
    expect(refundReviewError(refund)).toContain("ID and name");
    refund.developments = [];
    refund.propertyEvidence.push({ apartmentId: "  ", facts: {} });
    expect(refundReviewError(refund)).toContain("apartment ID");
  });
  it("allows unknown or unreviewed records without inventing verification", () => {
    const refund = empty();
    refund.propertyEvidence.push({
      apartmentId: "A-101",
      facts: {
        contractPriceAMD: { value: 35000000, verified: false },
        propertyRightsRegistered: null,
      },
    });
    expect(refundReviewError(refund)).toBeNull();
    expect(refund.propertyEvidence[0].facts.contractPriceAMD?.verified).toBe(
      false,
    );
  });
});
