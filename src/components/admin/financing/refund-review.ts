import type { PartnerConfiguration } from "@/embed/types";
type Refund = PartnerConfiguration["refund"];

export function clearVerification<T>(value: T): T {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(clearVerification) as T;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      key === "verified" ? false : clearVerification(child),
    ]),
  ) as T;
}
function containsVerified(value: unknown): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    Object.entries(value).some(([key, child]) =>
      key === "verified" ? child === true : containsVerified(child),
    )
  );
}
export function refundReviewError(value: Refund): string | null {
  for (const record of value.developments) {
    if (!record.id.trim() || !record.name.trim())
      return "Give each development record an ID and name, or remove the unfinished record in Refund review.";
    if (
      containsVerified(record) &&
      (record.verificationReference?.trim().length ?? 0) < 8
    )
      return `Development ${record.name} needs a document reference of at least 8 characters for its verified facts.`;
  }
  for (const record of value.propertyEvidence) {
    if (!record.apartmentId.trim())
      return "Enter an apartment ID for each property record, or remove the unfinished record in Refund review.";
    if (
      containsVerified(record) &&
      (record.verificationReference?.trim().length ?? 0) < 8
    )
      return `Apartment ${record.apartmentId} needs a document reference of at least 8 characters for its verified facts.`;
  }
  return null;
}
