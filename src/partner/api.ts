import type { PartnerConfiguration } from "@/embed/types";
import type { messages } from "./messages";

export class PartnerApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function partnerErrorMessage(
  error: unknown,
  copy: typeof messages.en,
): string {
  if (typeof error === "string") return error;
  if (!error) return "";
  if (!(error instanceof PartnerApiError)) return copy.networkError;
  const keys: Record<string, keyof typeof copy> = {
    INVALID_INPUT: "invalidInput",
    INVALID_CREDENTIALS: "invalidCredentials",
    AUTHENTICATION_REQUIRED: "signIn",
    INVITATION_UNAVAILABLE: "invitationUnavailable",
    EXISTING_PASSWORD_REQUIRED: "existingAccountPassword",
    REVISION_CONFLICT: "revisionConflict",
    WEBSITE_REVIEW_REQUIRED: "websiteReview",
    COMPANY_NOT_FOUND: "companyUnavailable",
    RATE_LIMITED: "rateLimited",
    ORIGIN_NOT_ALLOWED: "networkError",
  };
  return copy[keys[error.code] ?? "networkError"];
}
export async function partnerRequest<T>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> {
  const response = await fetch(`/partner-api${path}`, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response
    .json()
    .catch(() => ({
      code: "SERVICE_UNAVAILABLE",
      error: "Partner service is unavailable.",
    }));
  if (!response.ok)
    throw new PartnerApiError(response.status, data.code, data.error);
  return data;
}
export interface Settings {
  controls?: Pick<PartnerConfiguration, "limits" | "adjustable" | "calculator">;
  financingType: "mortgage" | "developer_installment";
  currency: "AMD" | "USD";
  annualInterestRatePercent?: number;
  downPaymentPercent: number;
  durationMonths: number;
  theme: "light" | "dark";
  accentColor: string;
  incomeTaxRefundEnabled: boolean;
}
export interface Company {
  applicationId: string;
  organizationName: string;
  website: string;
  email: string;
  integration: {
    slug: string;
    active: boolean;
    revision: number;
    updatedAt: string;
    allowedOrigins: string[];
    settings: Settings & { apartmentPrice?: number };
    limits: PartnerConfiguration["limits"];
    overrides: PartnerConfiguration["overrides"];
    allowedCurrencies: Settings["currency"][];
    allowedFinancingTypes: Settings["financingType"][];
  } | null;
}
