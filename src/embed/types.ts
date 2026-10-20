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
export type WidgetConfiguration = ApartmentConfiguration & {
  partner: string;
  language?: "hy" | "en" | "ru";
};
export interface Range {
  min: number;
  max: number;
  step: number;
}
export interface CalculatorOptions {
  downPaymentAmountStep: number;
  durationUnit: "years" | "months";
  repaymentMethod: "annuity" | "equal_principal";
  allowRepaymentChoice: boolean;
  rateEditable: boolean;
  priceRateRule: {
    currency: "AMD" | "USD";
    threshold: number;
    below: number;
    atOrAbove: number;
  } | null;
  defaultLanguage: "hy" | "en" | "ru";
  showSchedule: boolean;
  showTotals: boolean;
  allowCoBorrower: boolean;
  analyticsEnabled: boolean;
  installmentControls?: Pick<
    PartnerConfiguration["limits"],
    "downPaymentPercent" | "durationMonths" | "supportedDurations"
  >;
}
export interface PartnerConfiguration {
  schemaVersion: 1;
  calculator?: CalculatorOptions;
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
  calculator?: CalculatorOptions;
  analytics?: { token: string } | null;
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
