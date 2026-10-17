import type { FinancingInput } from "@/lib/financing";
import type {
  Evidence,
  MortgageEligibilityFacts,
} from "@/lib/financing/income-tax-refund";

export interface ApartmentConfiguration {
  apartmentId: string;
  apartmentPrice?: number;
  currency?: "AMD" | "USD";
  financingType?: "mortgage" | "developer_installment";
  annualInterestRatePercent?: number;
  downPaymentPercent?: number;
  durationMonths?: number;
  developmentId?: string;
  contractPriceAMD?: number;
  loanOriginationDate?: string;
  firstPaymentDate?: string;
}
export type WidgetConfiguration = ApartmentConfiguration & { partner: string };
export interface Range {
  min: number;
  max: number;
  step: number;
}
export interface PartnerConfiguration {
  schemaVersion: 1;
  defaults: {
    currency: "AMD" | "USD";
    financingType: "mortgage" | "developer_installment";
    apartmentPrice?: number;
    annualInterestRatePercent?: number;
    downPaymentPercent: number;
    durationMonths: number;
  };
  overrides: (keyof PartnerConfiguration["defaults"])[];
  allowedFinancingTypes: ("mortgage" | "developer_installment")[];
  allowedCurrencies: ("AMD" | "USD")[];
  limits: {
    apartmentPrice: { min: number; max: number };
    annualInterestRatePercent: { min: number; max: number };
    downPaymentPercent: Range;
    durationMonths: Range;
    supportedDurations: number[];
  };
  adjustable: { downPaymentPercent: boolean; durationMonths: boolean };
  appearance: {
    accentColor: string;
    theme: "light" | "dark";
    logoUrl: string | null;
  };
  refund: {
    enabled: boolean;
    defaultDevelopmentId: string | null;
    developments: {
      id: string;
      name: string;
      facts: Partial<
        Pick<
          MortgageEligibilityFacts,
          | "location"
          | "permitDecisionDate"
          | "acquisitionType"
          | "validSelfBuildPermit"
        >
      >;
      verificationReference?: string;
    }[];
    propertyEvidence: {
      apartmentId: string;
      facts: Partial<MortgageEligibilityFacts>;
      loanOriginationDate?: Evidence<string>;
      noInterestSubsidy?: Evidence<boolean>;
      verificationReference?: string;
    }[];
  };
}
export interface FinancingPartner {
  slug: string;
  displayName: string;
  active: boolean;
  allowedOrigins: string[];
  configuration: PartnerConfiguration;
  revision: number;
  updatedAt: string;
}
export interface ResolvedWidget {
  partner: { slug: string; displayName: string; revision: number };
  apartmentId: string;
  financing: FinancingInput;
  controls: PartnerConfiguration["adjustable"] & {
    limits: PartnerConfiguration["limits"];
  };
  appearance: PartnerConfiguration["appearance"];
  refund: {
    enabled: boolean;
    facts: MortgageEligibilityFacts;
    developmentName: string | null;
    configurationUpdatedAt: string;
    loanOriginationDate: Evidence<string>;
    firstPaymentDate: string | null;
    noInterestSubsidy: Evidence<boolean>;
  };
  estimateNotice: string;
}
