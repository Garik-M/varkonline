import type { FinancingResult } from "../output";

/** Verification is supplied by the caller, never performed by this pure engine. */
export type Evidence<T> = { readonly value: T; readonly verified: boolean } | null;
export type EvidenceMode = "verified" | "declared";
export type EligibilityStatus = "eligible" | "ineligible" | "requires_verification" | "not_assessed";
export type ArmenianRegion = "aragatsotn" | "ararat" | "armavir" | "kotayk" |
  "shirak" | "lori" | "tavush" | "gegharkunik" | "syunik" | "vayots_dzor";

export type PropertyLocation =
  | { readonly region: "yerevan"; readonly valuationZone: 1 | 2 | 3 | "other" | null }
  | { readonly region: ArmenianRegion; readonly governmentBorderSettlement: Evidence<boolean> }
  | { readonly region: "outside_armenia" };

export type AcquisitionType = "developer_apartment" | "developer_house" |
  "state_or_community_apartment" | "self_build_house" | "secondary_market" |
  "assignment_from_individual" | "construction_right_acquisition";

export interface MortgageEligibilityFacts {
  readonly residentFinancialLender: Evidence<boolean>;
  readonly fundsUsedForHousing: Evidence<boolean>;
  readonly acquisitionType: Evidence<AcquisitionType>;
  /** Actual contractual AMD price, not the mortgage principal or an assumed FX value. */
  readonly contractPriceAMD: Evidence<number>;
  readonly location: Evidence<PropertyLocation>;
  /** Decision granting the permit; verified null means no pre-2022 permit exception. */
  readonly permitDecisionDate: Evidence<string | null>;
  readonly propertyRightsRegistered: Evidence<boolean>;
  readonly requiredDocumentsAvailable: Evidence<boolean>;
  /** Relevant only to self-build cases. */
  readonly validSelfBuildPermit: Evidence<boolean>;
}

export interface ParticipantEligibilityFacts {
  readonly employee: Evidence<boolean>;
  readonly ownerOrCoOwner: Evidence<boolean>;
  readonly requiredIdentityOrResidenceDocument: Evidence<boolean>;
  readonly priorBenefitUse: Evidence<"none" | "same_mortgage" | "other_post_2018_mortgage" | "pre_2018_only">;
}

/** One monthly payroll amount or an explicitly constant inclusive monthly range. */
export interface IncomePeriod {
  readonly fromMonth: string; // YYYY-MM
  readonly toMonth: string; // YYYY-MM
  readonly grossRegisteredSalaryAMD: number;
  /** Salary income tax only; overrides the estimate, including an explicit zero. */
  readonly actualIncomeTaxWithheldAMD?: number;
  /** For exceptions; otherwise the explicitly selected versioned rules apply. */
  readonly taxRatePercent?: number;
  readonly taxPaymentStatus: "projected" | "verified_paid" | "unpaid" | "unknown";
  readonly tuitionRefundClaimed: boolean | null;
  /** Tax already committed to other benefits/claims; null means unresolved. */
  readonly taxAlreadyAllocatedAMD: number | null;
}

export interface SalaryIncomeTaxInput {
  readonly month: string;
  readonly grossRegisteredSalaryAMD: number;
  readonly actualIncomeTaxWithheldAMD?: number;
  readonly taxRatePercent?: number;
}

export interface RefundParticipant {
  /** Opaque per-person identifier. The same person must not appear twice. */
  readonly id: string;
  readonly role: "borrower" | "co_borrower";
  readonly eligibility: ParticipantEligibilityFacts;
  readonly incomePeriods: readonly IncomePeriod[];
}

export interface DatedMortgagePayment {
  readonly month: number;
  /** YYYY-MM-DD, one date per Phase 1 row. Calendar months must be consecutive. */
  readonly paymentDate: string;
  readonly interestBasis: "projected" | "verified_paid";
  /** Required for verified_paid; in the Phase 1 currency, excluding fees/penalties. */
  readonly actualInterestPaid?: number;
  /** Explicit zero is required when there is no subsidy; in the financing currency. */
  readonly subsidizedInterest: number;
  /** Required to quantify a USD schedule in AMD; no exchange rates are invented. */
  readonly amountsAMD?: {
    readonly mortgagePayment: number;
    readonly scheduledInterest: number;
    readonly interest: number;
    readonly subsidizedInterest: number;
    readonly source: "bank_certificate" | "supplied_projection";
  };
}

export interface MortgageRefundInput {
  /** Default: verified. Declared scenarios use supplied answers without claiming verification; missing facts remain unknown. */
  readonly evidenceMode?: EvidenceMode;
  readonly financing: FinancingResult;
  readonly loanOriginationDate: string;
  readonly originationDateVerified: boolean;
  readonly eligibility: MortgageEligibilityFacts;
  readonly participants: readonly RefundParticipant[];
  readonly payments: readonly DatedMortgagePayment[];
}

/** Financial illustration only: no legal eligibility facts are supplied or inferred. */
export interface MortgageRefundScenarioInput {
  readonly financing: FinancingResult;
  readonly loanOriginationDate: string;
  readonly participants: readonly Omit<RefundParticipant, "eligibility">[];
  readonly payments: readonly DatedMortgagePayment[];
}

export type MortgageEligibilityContext = Pick<MortgageRefundInput,
  "financing" | "loanOriginationDate" | "originationDateVerified" | "eligibility" | "evidenceMode">;

export interface RefundRuleSet {
  readonly version: string;
  readonly reviewedAsOf: string;
  readonly supportedOriginationsFrom: string;
  readonly maxContractPriceAMD: number;
  readonly quarterlyCaps: readonly { readonly fromDate: string; readonly amountAMD: number }[];
  readonly salaryRates: readonly { readonly fromMonth: string; readonly ratePercent: number }[];
  readonly yerevanCutoffs: Readonly<Record<"1" | "2" | "3" | "other", string>>;
  readonly permitExceptionBefore: string;
  readonly firstRegionalCutoff: string;
  readonly firstRestrictedRegions: readonly ArmenianRegion[];
  readonly otherRegionalCutoff: string;
  readonly sources: readonly { readonly id: string; readonly url: string; readonly description: string }[];
}
