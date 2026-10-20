import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  FinancingCalculationError,
  type FinancingResult,
} from "@/lib/financing";
import {
  ARMENIA_REFUND_RULES_2026_10,
  evaluateMortgageRefundEligibility,
  type MortgageRefundResult,
} from "@/lib/financing/income-tax-refund";
import type { ResolvedWidget } from "./types";
import {
  emptyPayroll,
  paymentDates,
  payrollParticipant,
  refundProjection,
  salaryEstimate,
  initialProperty,
  propertyFacts,
  type PropertyForm,
  type PayrollForm,
} from "./refund-model";
import { refundMessages } from "./refund-messages";
import { useWidgetText } from "./language";
import type { MessageKey } from "./messages";

type PayrollFieldsProps = {
  value: PayrollForm;
  onChange: (value: PayrollForm) => void;
  title: string;
};

function SalaryFields({ value, onChange, title }: PayrollFieldsProps) {
  const { t } = useWidgetText();
  const id = useId();
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className="vk-grid">
        <label>
          {t("gross")}
          <small id={`${id}-gross-help`}>{t("grossHelp")}</small>
          <input
            id={`${id}-gross`}
            aria-label={t("gross")}
            aria-describedby={`${id}-gross-help`}
            inputMode="numeric"
            value={value.gross}
            required
            onChange={(e) => onChange({ ...value, gross: e.target.value })}
            placeholder={t("grossExample")}
            autoComplete="off"
          />
        </label>
        <label>
          {t("withheld")} <small>{t("withheldHelp")}</small>
          <input
            aria-label={t("withheld")}
            inputMode="numeric"
            value={value.withheld}
            onChange={(e) => onChange({ ...value, withheld: e.target.value })}
            placeholder={t("withheldPlaceholder")}
            autoComplete="off"
          />
        </label>
      </div>
    </fieldset>
  );
}

function EligibilityFields({ value, onChange, title }: PayrollFieldsProps) {
  const { t } = useWidgetText();
  const id = useId();
  const field = (
    key: keyof PayrollForm,
    label: string,
    options: [string, string][],
    hint?: string,
  ) => (
    <label>
      {label}
      <select
        aria-label={label}
        aria-describedby={hint ? `${id}-${key}-help` : undefined}
        value={String(value[key])}
        onChange={(event) =>
          onChange({
            ...value,
            [key]: event.target.value,
          })
        }
      >
        <option value="">{t("unknown")}</option>
        {options.map(([code, text]) => (
          <option key={code} value={code}>
            {text}
          </option>
        ))}
      </select>
      {hint && <small id={`${id}-${key}-help`}>{hint}</small>}
    </label>
  );
  const yesNo: [string, string][] = [
    ["yes", t("yes")],
    ["no", t("no")],
  ];
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className="vk-grid">
        {field("employee", t("employee"), yesNo)}
        {field("owner", t("owner"), yesNo, t("plannedOwnerHelp"))}
        {field("prior", t("prior"), [
          ["none", t("no")],
          ["same_mortgage", t("priorSame")],
          ["other_post_2018_mortgage", t("priorOther")],
          ["pre_2018_only", t("priorLegacy")],
        ])}
        {field("tuition", t("tuition"), yesNo)}
        <label>
          {t("allocation")}
          <input
            inputMode="numeric"
            value={value.allocation}
            onChange={(e) => onChange({ ...value, allocation: e.target.value })}
            placeholder={t("zeroPlaceholder")}
            autoComplete="off"
          />
        </label>
        {field("settlement", t("settlement"), [
          ["projected", t("projectedSettlement")],
          ["unpaid", t("unpaidSettlement")],
        ])}
      </div>
    </fieldset>
  );
}

function PropertyFields({
  value,
  onChange,
  currency,
  loan,
}: {
  value: PropertyForm;
  onChange: (value: PropertyForm) => void;
  currency: string;
  loan: string;
}) {
  const { t } = useWidgetText();
  const select = (
    key: keyof PropertyForm,
    label: string,
    options: readonly (readonly [string, string])[],
  ) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={value[key]}
        onChange={(event) => onChange({ ...value, [key]: event.target.value })}
      >
        <option value="">{t("unknown")}</option>
        {options.map(([code, text]) => (
          <option key={code} value={code}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  const regions = [
    "yerevan",
    "aragatsotn",
    "ararat",
    "armavir",
    "kotayk",
    "shirak",
    "lori",
    "tavush",
    "gegharkunik",
    "syunik",
    "vayots_dzor",
    "outside_armenia",
  ] as const;
  return (
    <fieldset>
      <legend>{t("propertyConditions")}</legend>
      <div className="vk-grid">
        {select("acquisition", t("purchaseSource"), [
          ["developer_apartment", t("fromDeveloper")],
          ["developer_house", t("developerHouse")],
          ["state_or_community_apartment", t("fromState")],
          ["self_build_house", t("selfBuild")],
          ["secondary_market", t("secondaryMarket")],
          ["assignment_from_individual", t("assignment")],
          ["construction_right_acquisition", t("constructionRight")],
        ])}
        {select(
          "region",
          t("propertyRegion"),
          regions.map((region) => [region, t(region)] as const),
        )}
        {value.region === "yerevan" && (
          <>
            {loan < "2025-01-01" &&
              select("zone", t("valuationZone"), [
                ["1", "1"],
                ["2", "2"],
                ["3", "3"],
                ["other", t("otherZones")],
              ])}
            {select("permitException", t("oldPermit"), [
              ["yes", t("yes")],
              ["no", t("no")],
            ])}
            {value.permitException === "yes" && (
              <label>
                {t("permitDate")}
                <input
                  aria-label={t("permitDate")}
                  type="date"
                  max="2021-12-31"
                  required
                  value={value.permitDate}
                  onChange={(event) =>
                    onChange({ ...value, permitDate: event.target.value })
                  }
                />
              </label>
            )}
          </>
        )}
        {value.region &&
          !["yerevan", "outside_armenia"].includes(value.region) &&
          loan >= "2027-01-01" &&
          select("border", t("borderSettlement"), [
            ["yes", t("yes")],
            ["no", t("no")],
          ])}
        {currency === "USD" && (
          <label>
            {t("contractAMD")}
            <input
              aria-label={t("contractAMD")}
              inputMode="numeric"
              value={value.contractAMD}
              onChange={(event) =>
                onChange({ ...value, contractAMD: event.target.value })
              }
            />
          </label>
        )}
      </div>
    </fieldset>
  );
}

export default function RefundPanel({
  financing,
  configuration,
  onProjectionChange,
}: {
  financing: FinancingResult;
  configuration: ResolvedWidget;
  onProjectionChange?: (projection: MortgageRefundResult | null) => void;
}) {
  const { t, money, language } = useWidgetText();
  const id = useId();
  const [property, setProperty] = useState(() =>
    initialProperty(configuration),
  );
  const [borrower, setBorrower] = useState(emptyPayroll);
  const [co, setCo] = useState(emptyPayroll);
  const [includeCo, setIncludeCo] = useState(false);
  const [first, setFirst] = useState(
    configuration.refund.firstPaymentDate ?? "",
  );
  const [loan, setLoan] = useState(
    configuration.refund.loanOriginationDate?.value ?? "",
  );
  const [noSubsidy, setNoSubsidy] = useState(
    configuration.refund.noInterestSubsidy?.verified === true &&
      configuration.refund.noInterestSubsidy.value,
  );
  const [constant, setConstant] = useState(false);
  const [projection, setProjection] = useState<MortgageRefundResult | null>(
    null,
  );
  useEffect(() => {
    onProjectionChange?.(projection);
  }, [projection, onProjectionChange]);
  const [tax, setTax] = useState<number | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [page, setPage] = useState(0);
  const [step, setStep] = useState<1 | 2>(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (projection) resultHeading.current?.focus();
  }, [projection]);
  const legal = useMemo(() => {
    if (!loan) return null;
    try {
      return evaluateMortgageRefundEligibility(
        {
          financing,
          evidenceMode: "declared",
          loanOriginationDate: loan,
          originationDateVerified:
            configuration.refund.loanOriginationDate?.verified === true &&
            configuration.refund.loanOriginationDate.value === loan,
          eligibility: propertyFacts(
            financing,
            configuration,
            property,
            constant,
          ),
        },
        ARMENIA_REFUND_RULES_2026_10,
      );
    } catch {
      return null;
    }
  }, [financing, configuration, loan, property, constant]);
  const invalidate = () => {
    setProjection(null);
    setError(null);
  };
  const change = (value: PayrollForm, secondary = false) => {
    const previous = secondary ? co : borrower;
    (secondary ? setCo : setBorrower)(value);
    if (value.gross !== previous.gross || value.withheld !== previous.withheld)
      setTax(null);
    invalidate();
  };
  function showError(cause: unknown) {
    setError(
      cause instanceof FinancingCalculationError
        ? "financialError"
        : cause instanceof Error &&
            [
              "historicalTaxError",
              "propertyError",
              "assumptionsError",
            ].includes(cause.message)
          ? (cause.message as MessageKey)
          : cause instanceof Error && cause.message === "INVALID_AMOUNT"
            ? "amountError"
            : cause instanceof Error && cause.message === "INVALID_DATE"
              ? "dateError"
              : "inputError",
    );
  }
  function selectedSalaryTax() {
    const month = first.slice(0, 7);
    const primary = salaryEstimate(borrower, month).selectedIncomeTaxAMD;
    const secondary = includeCo
      ? salaryEstimate(co, month).selectedIncomeTaxAMD
      : 0;
    if (primary === null || secondary === null)
      throw new Error("historicalTaxError");
    return primary + secondary;
  }
  function next(event: React.FormEvent) {
    event.preventDefault();
    invalidate();
    try {
      paymentDates(first, financing.schedule.length);
      setTax(selectedSalaryTax());
      setStep(2);
    } catch (cause) {
      showError(cause);
    }
  }
  function calculate(event: React.FormEvent) {
    event.preventDefault();
    invalidate();
    try {
      if (!constant || !noSubsidy) throw new Error("assumptionsError");
      const dates = paymentDates(first, financing.schedule.length);
      const payroll = [
        payrollParticipant(borrower, dates, "borrower", constant),
        ...(includeCo
          ? [payrollParticipant(co, dates, "co_borrower", constant)]
          : []),
      ];
      setTax(selectedSalaryTax());
      setProjection(
        refundProjection(
          financing,
          configuration,
          first,
          loan,
          payroll,
          property,
          constant,
        ),
      );
      setPage(0);
    } catch (cause) {
      showError(cause);
    }
  }
  const propertyNotice =
    legal?.status === "ineligible" ? (
      <p className="vk-warning">
        {refundMessages(legal.reasons, language).join(" ")}
      </p>
    ) : null;
  return (
    <section className="vk-refund" aria-label={t("refundTitle")}>
      <h2>{t("refundTitle")}</h2>
      <p className="vk-muted">{t("privacy")}</p>
      {step === 2 && financing.currency === "USD" && (
        <p className="vk-warning">{t("usdWarning")}</p>
      )}
      <details className="vk-refund-form" open={!projection}>
        <summary hidden={!projection}>{t("editRefund")}</summary>
        <ol className="vk-refund-steps" aria-label={t("refundSteps")}>
          <li aria-current={step === 1 ? "step" : undefined}>
            {t("stepIncome")}
          </li>
          <li aria-current={step === 2 ? "step" : undefined}>
            {t("stepEligibility")}
          </li>
        </ol>
        <form onSubmit={step === 1 ? next : calculate} onChange={invalidate}>
          {step === 1 ? (
            <div className="vk-refund-step" data-testid="refund-step-income">
              <h3
                className="vk-sr-only"
                ref={heading}
                tabIndex={-1}
                id={`${id}-step-heading`}
              >
                {t("incomeHeading")}
              </h3>
              <label>
                {t("firstPayment")}
                <input
                  aria-label={t("firstPayment")}
                  type="date"
                  required
                  value={first}
                  onChange={(event) => {
                    setFirst(event.target.value);
                    setTax(null);
                  }}
                />
                <small>{t("firstPaymentHelp")}</small>
              </label>
              <SalaryFields
                value={borrower}
                onChange={change}
                title={t("borrowerSalary")}
              />
              <label className="vk-check">
                <input
                  type="checkbox"
                  checked={includeCo}
                  onChange={(event) => {
                    setIncludeCo(event.target.checked);
                    setTax(null);
                  }}
                />
                {t("includeCo")}
              </label>
              {includeCo && (
                <SalaryFields
                  value={co}
                  onChange={(value) => change(value, true)}
                  title={t("coSalary")}
                />
              )}
              <button className="vk-button" type="submit">
                {t("continue")}
              </button>
            </div>
          ) : (
            <div
              className="vk-refund-step"
              data-testid="refund-step-eligibility"
            >
              <h3
                className="vk-sr-only"
                ref={heading}
                tabIndex={-1}
                id={`${id}-step-heading`}
              >
                {t("conditionsHeading")}
              </h3>
              <p className="vk-muted">{t("scenarioIntro")}</p>
              <label>
                {t("loanDate")}
                <input
                  aria-label={t("loanDate")}
                  type="date"
                  required
                  value={loan}
                  onChange={(event) => setLoan(event.target.value)}
                />
                <small>{t("declaredDate")}</small>
              </label>
              <PropertyFields
                value={property}
                onChange={setProperty}
                currency={financing.currency}
                loan={loan}
              />
              <EligibilityFields
                value={borrower}
                onChange={change}
                title={t("borrowerConditions")}
              />
              {includeCo && (
                <EligibilityFields
                  value={co}
                  onChange={(value) => change(value, true)}
                  title={t("coConditions")}
                />
              )}
              <label className="vk-check">
                <input
                  type="checkbox"
                  checked={noSubsidy}
                  onChange={(event) => setNoSubsidy(event.target.checked)}
                />
                {t("noSubsidy")}
              </label>
              <label className="vk-check">
                <input
                  type="checkbox"
                  checked={constant}
                  onChange={(event) => setConstant(event.target.checked)}
                />
                {t("scenarioAssumptions")}
              </label>
              <div className="vk-refund-actions">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                >
                  {t("back")}
                </button>
                <button className="vk-button" type="submit">
                  {t("calculateRefund")}
                </button>
              </div>
            </div>
          )}
        </form>
      </details>
      {error && (
        <p className="vk-warning" role="alert">
          {t("inputErrorPrefix")}
          {t(error)}
        </p>
      )}
      {tax !== null && (
        <p className="vk-tax" data-testid="salary-tax">
          {includeCo ? t("combinedTax") : t("selectedTax")}{" "}
          <strong>{money(tax)}</strong>
        </p>
      )}
      {step === 2 && projection && (
        <div
          className={`vk-refund-result${projection.eligibility.status === "requires_verification" ? " vk-refund-result--unresolved" : ""}`}
          aria-live="polite"
          data-testid="refund-result"
        >
          <h3 ref={resultHeading} tabIndex={-1}>
            {projection.eligibility.status === "eligible"
              ? t("conditionalEstimate")
              : projection.eligibility.status === "ineligible"
                ? t("ineligible")
                : t("verification")}
          </h3>
          <div className="vk-refund-total">
            <span>{t("totalRefund")}</span>
            <strong data-testid="total-refund">
              {projection.totalEstimatedRefundAMD === null
                ? t("unresolved")
                : money(projection.totalEstimatedRefundAMD)}
            </strong>
            <p>{t("refundPeriod", { months: financing.durationMonths })}</p>
          </div>
          <div className="vk-refund-metrics">
            <div>
              <span>{t("effectiveCost")}</span>
              <strong data-testid="effective-cost">
                {projection.effectiveAverageMonthlyFinancingCostAMD === null
                  ? t("unresolved")
                  : money(projection.effectiveAverageMonthlyFinancingCostAMD)}
              </strong>
            </div>
          </div>
          <details>
            <summary>{t("quarterSchedule")}</summary>
            <div className="vk-quarter-list">
              {projection.quarterlySchedule
                .slice(page * 8, page * 8 + 8)
                .map((q) => (
                  <div key={`${q.year}-${q.quarter}`}>
                    <span>
                      {q.year} · {q.quarter}
                      {t("quarterSuffix")}
                    </span>
                    <strong>
                      {q.estimatedRefundAMD === null
                        ? t("needsReview")
                        : money(q.estimatedRefundAMD)}
                    </strong>
                    <small>
                      {t("interestPrefix")}{" "}
                      {q.interestUsedAMD === null
                        ? t("unresolved")
                        : money(q.interestUsedAMD)}{" "}
                      {t("taxPrefix")}{" "}
                      {q.eligibleIncomeTaxAMD === null
                        ? t("unresolved")
                        : money(q.eligibleIncomeTaxAMD)}{" "}
                      {t("capPrefix")}{" "}
                      {q.quarterlyRefundCapAMD === null
                        ? t("unresolved")
                        : money(q.quarterlyRefundCapAMD)}
                    </small>
                  </div>
                ))}
            </div>
            <div className="vk-pagination">
              <button disabled={!page} onClick={() => setPage(page - 1)}>
                {t("previous")}
              </button>
              <span>
                {page + 1} /{" "}
                {Math.max(
                  1,
                  Math.ceil(projection.quarterlySchedule.length / 8),
                )}
              </span>
              <button
                disabled={(page + 1) * 8 >= projection.quarterlySchedule.length}
                onClick={() => setPage(page + 1)}
              >
                {t("next")}
              </button>
            </div>
          </details>
        </div>
      )}
      <details
        className="vk-refund-notes"
        open={
          projection && projection.eligibility.status !== "eligible"
            ? true
            : undefined
        }
      >
        <summary>{t("refundDetails")}</summary>
        <p>{t("conditionalNotice")}</p>
        <p>{t("effectiveHelp")}</p>
        {!projection && propertyNotice}
        {projection?.eligibility.status === "requires_verification" && (
          <p>{t("projectionUnresolved")}</p>
        )}
        {projection && (
          <ul>
            {refundMessages(projection.eligibility.reasons, language).map(
              (text) => (
                <li key={text}>{text}</li>
              ),
            )}
          </ul>
        )}
        <p className="vk-fine">
          {t("ruleVersion")}
          {ARMENIA_REFUND_RULES_2026_10.version}
          {t("futureChanges")}{" "}
          <a
            href="https://www.arlis.am/hy/acts/230455"
            target="_blank"
            rel="noreferrer"
          >
            {t("taxCode")}
          </a>
          {t("period")}
        </p>
      </details>
    </section>
  );
}
