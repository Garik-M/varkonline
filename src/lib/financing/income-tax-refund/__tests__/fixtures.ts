import { calculateFinancing } from "../..";
import type { Evidence, IncomePeriod, MortgageEligibilityContext, MortgageRefundInput, RefundParticipant } from "..";

export const verified = <T>(value: T): Evidence<T> => ({ value, verified: true });

export function income(grossRegisteredSalaryAMD = 100, fromMonth = "2026-01", toMonth = "2026-12"): IncomePeriod {
  return { fromMonth, toMonth, grossRegisteredSalaryAMD, taxPaymentStatus: "projected",
    tuitionRefundClaimed: false, taxAlreadyAllocatedAMD: 0 };
}

export function person(id = "borrower", role: RefundParticipant["role"] = "borrower"): RefundParticipant {
  return { id, role, eligibility: { employee: verified(true), ownerOrCoOwner: verified(true),
    requiredIdentityOrResidenceDocument: verified(true), priorBenefitUse: verified("none") },
  incomePeriods: [income()] };
}

export function paymentDates(financing: MortgageRefundInput["financing"], firstMonth = "2026-01") {
  const firstIndex = Number(firstMonth.slice(0, 4)) * 12 + Number(firstMonth.slice(5)) - 1;
  return financing.schedule.map(row => {
    const index = firstIndex + row.month - 1;
    return { month: row.month, paymentDate: `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}-15`,
      interestBasis: "projected" as const, subsidizedInterest: 0 };
  });
}

export function sample(overrides: Partial<MortgageRefundInput> = {}): MortgageRefundInput {
  const financing = overrides.financing ?? calculateFinancing({
    currency: "AMD", financingType: "mortgage", apartmentPrice: 1250,
    downPaymentPercent: 20, annualInterestRatePercent: 12, durationMonths: 3,
  });
  return { financing, loanOriginationDate: "2026-01-01", originationDateVerified: true,
    eligibility: { residentFinancialLender: verified(true), fundsUsedForHousing: verified(true),
      acquisitionType: verified("developer_apartment"), contractPriceAMD: verified(financing.apartmentPrice),
      location: verified({ region: "kotayk", governmentBorderSettlement: verified(false) }),
      permitDecisionDate: verified(null), propertyRightsRegistered: verified(true),
      requiredDocumentsAvailable: verified(true), validSelfBuildPermit: null },
    participants: [person()], payments: paymentDates(financing), ...overrides };
}

export function context(input: MortgageRefundInput): MortgageEligibilityContext {
  return { financing: input.financing, loanOriginationDate: input.loanOriginationDate,
    originationDateVerified: input.originationDateVerified, eligibility: input.eligibility };
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
