import { translate, type MessageKey, type WidgetLanguage } from "./messages";
import type { RefundReason } from "@/lib/financing/income-tax-refund";
const fields: Record<string, MessageKey> = {
  residentFinancialLender: "lenderField",
  fundsUsedForHousing: "housingField",
  acquisitionType: "acquisitionField",
  contractPriceAMD: "contractField",
  location: "locationField",
  permitDecisionDate: "permitField",
  propertyRightsRegistered: "rightsField",
  requiredDocumentsAvailable: "documentsField",
  loanOriginationDate: "loanField",
};
const messages: Partial<Record<RefundReason["code"], MessageKey>> = {
  CONTRACT_PRICE_EXCEEDS_LIMIT: "priceLimitReason",
  CONTRACT_PRICE_MISMATCH: "priceMismatchReason",
  LOCATION_RESTRICTED: "locationReason",
  AMD_AMOUNTS_REQUIRED: "amdReason",
  ACQUISITION_NOT_ELIGIBLE: "acquisitionReason",
  PRIOR_OTHER_MORTGAGE: "priorReason",
  TUITION_BENEFIT_OVERLAP: "tuitionReason",
  NO_ELIGIBLE_PARTICIPANT: "noParticipantReason",
  NOT_AN_EMPLOYEE: "employeeReason",
  NOT_AN_OWNER: "ownerReason",
  TAX_NOT_FULLY_PAID: "unpaidReason",
};
export function refundMessages(
  reasons: readonly RefundReason[],
  language: WidgetLanguage = "hy",
): string[] {
  return [
    ...new Set(
      reasons
        .filter((reason) => reason.effect !== "information")
        .map((reason) =>
          messages[reason.code]
            ? translate(language, messages[reason.code]!)
            : `${translate(language, fields[reason.field?.split(".").pop() ?? ""] ?? "factsField")}: ${translate(language, "verificationRequired")}`,
        ),
    ),
  ];
}
