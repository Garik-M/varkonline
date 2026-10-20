import type { Evidence, EvidenceMode, MortgageEligibilityContext, RefundParticipant, RefundRuleSet } from "./input";
import type { RefundEligibilityResult, RefundReason, RefundReasonCode } from "./output";
import { validateRefundEligibilityContext, validateRefundRules } from "./validation";

export function reason(code: RefundReasonCode, message: string,
  effect: RefundReason["effect"], field?: string, participantId?: string): RefundReason {
  return { code, message, effect, ...(field === undefined ? {} : { field }),
    ...(participantId === undefined ? {} : { participantId }) };
}

export function decision(reasons: readonly RefundReason[], mode: EvidenceMode = "verified"): RefundEligibilityResult {
  const status = reasons.some(item => item.effect === "ineligible") ? "ineligible" :
    reasons.some(item => item.effect === "requires_verification") ? "requires_verification" : "eligible";
  return { status, reasons: reasons.length ? [...reasons] : [reason(
    mode === "declared" ? "CONDITIONS_DECLARED" : "CONDITIONS_VERIFIED",
    mode === "declared" ? "Conditional scenario based on declared answers and assumptions; eligibility has not been verified." : "Eligible based on the supplied verified conditions; this is not SRC approval.", "information",
  )] };
}

function read<T>(fact: Evidence<T>, field: string, reasons: RefundReason[], participantId?: string, mode: EvidenceMode = "verified"): T | undefined {
  if (fact === null || (!fact.verified && mode !== "declared")) {
    reasons.push(reason("FACT_REQUIRES_VERIFICATION", `Verify ${field} before relying on a refund.`, "requires_verification", field, participantId));
    return undefined;
  }
  return fact.value;
}

function requiredTrue(fact: Evidence<boolean>, field: string, code: RefundReasonCode,
  reasons: RefundReason[], participantId?: string, mode: EvidenceMode = "verified") {
  if (read(fact, field, reasons, participantId, mode) === false) reasons.push(reason(code,
    `${field} is not satisfied.`, "ineligible", field, participantId));
}

/** Legal eligibility only; no salary, payment-date, or refund arithmetic. */
export function evaluateMortgageRefundEligibility(
  input: MortgageEligibilityContext, rules: RefundRuleSet,
): RefundEligibilityResult {
  validateRefundRules(rules);
  validateRefundEligibilityContext(input);
  return evaluateLoanEligibility(input, rules);
}

/** Internal validated path, shared by the standalone evaluator and engine. */
export function evaluateLoanEligibility(input: MortgageEligibilityContext, rules: RefundRuleSet): RefundEligibilityResult {
  if (input.financing.financingType !== "mortgage") return decision([
    reason("NOT_A_MORTGAGE", "Developer installments are not eligible mortgage loans.", "ineligible"),
  ]);
  if (input.financing.financedPrincipal === 0) return decision([
    reason("NO_FINANCED_PRINCIPAL", "There is no financed mortgage principal or interest to refund.", "ineligible"),
  ]);
  const reasons: RefundReason[] = [];
  const mode = input.evidenceMode ?? "verified";
  const dateKnown = input.originationDateVerified || mode === "declared";
  const facts = input.eligibility;
  const originated = input.loanOriginationDate;
  if (!dateKnown) reasons.push(reason("FACT_REQUIRES_VERIFICATION",
    "Verify the actual origination/disbursement date, not a booking or refinancing date.", "requires_verification", "loanOriginationDate"));
  if (originated < rules.supportedOriginationsFrom) return decision([...reasons, reason("LEGACY_LOAN_REVIEW",
    "Pre-2018 loans may fall under Decision 205-N or transitional rules and need individual review.", "requires_verification", "loanOriginationDate")]);
  requiredTrue(facts.residentFinancialLender, "residentFinancialLender", "NON_RESIDENT_FINANCIAL_LENDER", reasons, undefined, mode);
  requiredTrue(facts.fundsUsedForHousing, "fundsUsedForHousing", "NOT_USED_FOR_HOUSING", reasons, undefined, mode);
  requiredTrue(facts.propertyRightsRegistered, "propertyRightsRegistered", "RIGHTS_NOT_REGISTERED", reasons, undefined, mode);
  requiredTrue(facts.requiredDocumentsAvailable, "requiredDocumentsAvailable", "DOCUMENTS_INCOMPLETE", reasons, undefined, mode);
  const acquisition = read(facts.acquisitionType, "acquisitionType", reasons, undefined, mode);
  if (acquisition === "secondary_market" || acquisition === "assignment_from_individual") {
    reasons.push(reason("ACQUISITION_NOT_ELIGIBLE", "This acquisition is not directly from an eligible developer/state/community source.", "ineligible", "acquisitionType"));
  } else if (acquisition === "construction_right_acquisition") {
    reasons.push(reason("SPECIAL_ACQUISITION_REVIEW", "Article 160(8) requires verification of the specific 2018–2021 registered construction-right contract and Article 160(9).", "requires_verification", "acquisitionType"));
  }
  if (acquisition === "self_build_house") {
    requiredTrue(facts.validSelfBuildPermit, "validSelfBuildPermit", "SELF_BUILD_PERMIT_INVALID", reasons, undefined, mode);
  } else {
    const price = read(facts.contractPriceAMD, "contractPriceAMD", reasons, undefined, mode);
    if (price !== undefined && price > rules.maxContractPriceAMD) reasons.push(reason("CONTRACT_PRICE_EXCEEDS_LIMIT",
      `Contractual purchase price exceeds ${rules.maxContractPriceAMD} AMD.`, dateKnown ? "ineligible" : "requires_verification", "contractPriceAMD"));
    if (price !== undefined && input.financing.currency === "AMD" && price !== input.financing.apartmentPrice) {
      reasons.push(reason("CONTRACT_PRICE_MISMATCH", "Contractual AMD price and Phase 1 apartment price differ; reconcile the property inputs.", "requires_verification", "contractPriceAMD"));
    }
  }
  const location = read(facts.location, "location", reasons, undefined, mode);
  if (location?.region === "outside_armenia") reasons.push(reason("OUTSIDE_ARMENIA", "The property is outside Armenia.", "ineligible", "location"));
  else if (location?.region === "yerevan") {
    let cutoff: string | undefined;
    if (location.valuationZone !== null) cutoff = rules.yerevanCutoffs[location.valuationZone];
    else {
      const allCutoffs = Object.values(rules.yerevanCutoffs);
      if (allCutoffs.every(date => originated > date)) cutoff = [...allCutoffs].sort().pop();
      else if (allCutoffs.some(date => originated >= date)) {
        // An old verified permit can make an unknown zone immaterial.
        const permit = read(facts.permitDecisionDate, "permitDecisionDate", reasons, undefined, mode);
        if (permit !== undefined && permit !== null && permit < rules.permitExceptionBefore) {
          reasons.push(reason("PERMIT_EXCEPTION_APPLIED", "Supplied pre-2022 permit decision exempts the Yerevan phase-out.", "information", "permitDecisionDate"));
        } else reasons.push(reason("FACT_REQUIRES_VERIFICATION", "Verify the official valuation zone; a district or partner name is insufficient.", "requires_verification", "location.valuationZone"));
      }
    }
    if (cutoff !== undefined && originated >= cutoff) {
      const permit = read(facts.permitDecisionDate, "permitDecisionDate", reasons, undefined, mode);
      if (permit !== undefined && permit !== null && permit < rules.permitExceptionBefore) {
        reasons.push(reason("PERMIT_EXCEPTION_APPLIED", "Supplied pre-2022 permit decision exempts the Yerevan phase-out.", "information", "permitDecisionDate"));
      } else if (permit !== undefined) {
        reasons.push(originated === cutoff
          ? reason("CUTOFF_DATE_REVIEW", "Origination is on a geographic cutoff date; obtain SRC confirmation of date-boundary treatment.", "requires_verification", "loanOriginationDate")
          : reason("LOCATION_RESTRICTED", "Yerevan valuation-zone restriction applies and no qualifying permit exception was supplied.", dateKnown ? "ineligible" : "requires_verification", "location"));
      }
    }
  } else if (location !== undefined) {
    const cutoff = rules.firstRestrictedRegions.includes(location.region)
      ? rules.firstRegionalCutoff : rules.otherRegionalCutoff;
    if (originated >= cutoff) {
      const border = read(location.governmentBorderSettlement, "location.governmentBorderSettlement", reasons, undefined, mode);
      if (border === false) reasons.push(originated === cutoff
        ? reason("CUTOFF_DATE_REVIEW", "Origination is on a regional cutoff date; verify boundary treatment with SRC.", "requires_verification", "loanOriginationDate")
        : reason("LOCATION_RESTRICTED", "Regional origination restriction applies; the settlement is not on the government exception list.", dateKnown ? "ineligible" : "requires_verification", "location"));
    }
  }
  return decision(reasons, mode);
}

export function evaluateParticipant(participant: RefundParticipant, mode: EvidenceMode = "verified"): RefundEligibilityResult {
  const reasons: RefundReason[] = [];
  const facts = participant.eligibility;
  requiredTrue(facts.employee, "employee", "NOT_AN_EMPLOYEE", reasons, participant.id, mode);
  requiredTrue(facts.ownerOrCoOwner, "ownerOrCoOwner", "NOT_AN_OWNER", reasons, participant.id, mode);
  requiredTrue(facts.requiredIdentityOrResidenceDocument, "requiredIdentityOrResidenceDocument", "IDENTITY_DOCUMENT_MISSING", reasons, participant.id, mode);
  const prior = read(facts.priorBenefitUse, "priorBenefitUse", reasons, participant.id, mode);
  if (prior === "other_post_2018_mortgage") reasons.push(reason("PRIOR_OTHER_MORTGAGE",
    "This person has used the post-2018 benefit on another mortgage; exclude their income tax.", "ineligible", "priorBenefitUse", participant.id));
  return decision(reasons, mode);
}

/** A financial scenario must never claim that eligibility conditions were checked. */
export function scenarioDecision(result: RefundEligibilityResult): RefundEligibilityResult {
  const reasons = result.reasons.filter(item => item.code !== "CONDITIONS_VERIFIED" && item.code !== "CONDITIONS_DECLARED" && item.code !== "ELIGIBILITY_NOT_ASSESSED");
  return { status: result.status === "eligible" ? "not_assessed" : result.status,
    reasons: [...reasons, reason("ELIGIBILITY_NOT_ASSESSED", "Illustration assuming an eligible mortgage and participant; legal entitlement is not assessed.", "information")] };
}
