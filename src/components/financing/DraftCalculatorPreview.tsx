import FinancingCalculator from "@/embed/FinancingCalculator";
import type { PartnerConfiguration, ResolvedWidget } from "@/embed/types";
import "@/embed/embed.css";

const noop = () => undefined;
export default function DraftCalculatorPreview({
  configuration,
  name,
  price,
  language = "hy",
}: {
  configuration: PartnerConfiguration;
  name: string;
  price: number;
  language?: "hy" | "en" | "ru";
}) {
  const defaults = configuration.defaults;
  const rule = configuration.calculator?.priceRateRule;
  const rate =
    rule && rule.currency === defaults.currency
      ? price < rule.threshold
        ? rule.below
        : rule.atOrAbove
      : defaults.annualInterestRatePercent;
  const resolved: ResolvedWidget = {
    calculator: configuration.calculator,
    partner: { slug: "draft-preview", displayName: name, revision: 1 },
    apartmentId: "draft",
    financing: {
      currency: defaults.currency,
      apartmentPrice: price,
      downPaymentPercent: defaults.downPaymentPercent,
      durationMonths: defaults.durationMonths,
      ...(defaults.financingType === "mortgage"
        ? {
            financingType: "mortgage",
            annualInterestRatePercent: rate ?? NaN,
            repaymentMethod: configuration.calculator?.repaymentMethod,
          }
        : { financingType: "developer_installment", formula: "interest_free" }),
    },
    controls: {
      ...configuration.adjustable,
      limits: {
        ...configuration.limits,
        ...(defaults.financingType === "developer_installment"
          ? configuration.calculator?.installmentControls
          : {}),
      },
    },
    appearance: configuration.appearance,
    refund: {
      enabled: configuration.refund.enabled,
      developmentName: null,
      configurationUpdatedAt: "",
      firstPaymentDate: null,
      loanOriginationDate: null,
      noInterestSubsidy: null,
      facts: {
        residentFinancialLender: null,
        fundsUsedForHousing: null,
        acquisitionType: null,
        contractPriceAMD: null,
        location: null,
        permitDecisionDate: null,
        propertyRightsRegistered: null,
        requiredDocumentsAvailable: null,
        validSelfBuildPermit: null,
      },
    },
    estimateNotice: "Draft preview",
  };
  return (
    <div className="vk-widget" data-testid="draft-calculator-preview">
      <FinancingCalculator
        key={JSON.stringify([configuration, price])}
        configuration={resolved}
        initialLanguage={language}
        notify={noop}
      />
    </div>
  );
}
