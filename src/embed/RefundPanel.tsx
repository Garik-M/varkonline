import { useEffect, useId, useState } from "react";
import {
  FinancingCalculationError,
  type FinancingResult,
} from "@/lib/financing";
import {
  ARMENIA_REFUND_RULES_2026_10,
  type MortgageRefundResult,
} from "@/lib/financing/income-tax-refund";
import type { ResolvedWidget } from "./types";
import {
  emptyPayroll,
  paymentDates,
  payrollParticipant,
  refundProjection,
  salaryEstimate,
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
  const [borrower, setBorrower] = useState(emptyPayroll);
  const [co, setCo] = useState(emptyPayroll);
  const [includeCo, setIncludeCo] = useState(false);
  const [first, setFirst] = useState(
    configuration.refund.firstPaymentDate ?? "",
  );
  const [loan, setLoan] = useState(
    configuration.refund.loanOriginationDate?.value ?? "",
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
  function calculate(event: React.FormEvent) {
    event.preventDefault();
    invalidate();
    try {
      if (!constant) throw new Error("assumptionsError");
      const dates = paymentDates(first, financing.schedule.length);
      const payroll = [
        payrollParticipant(borrower, dates, "borrower"),
        ...(includeCo ? [payrollParticipant(co, dates, "co_borrower")] : []),
      ];
      setTax(selectedSalaryTax());
      setProjection(refundProjection(financing, first, loan, payroll));
      setPage(0);
    } catch (cause) {
      showError(cause);
    }
  }
  return (
    <section className="vk-refund" aria-label={t("refundTitle")}>
      <h2>{t("refundTitle")}</h2>
      <p className="vk-muted">{t("privacy")}</p>
      {financing.currency === "USD" && (
        <p className="vk-warning">{t("usdWarning")}</p>
      )}
      <details className="vk-refund-form" open={!projection}>
        <summary hidden={!projection}>{t("editRefund")}</summary>
        <form onSubmit={calculate} onChange={invalidate}>
          <div className="vk-refund-step" data-testid="refund-step-income">
            <div className="vk-grid">
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
            </div>
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
            <p className="vk-muted">{t("financialScenarioNotice")}</p>
            <label className="vk-check">
              <input
                type="checkbox"
                checked={constant}
                onChange={(event) => setConstant(event.target.checked)}
              />
              {t("financialScenarioAssumptions")}
            </label>
            <button className="vk-button" type="submit">
              {t("calculateRefund")}
            </button>
          </div>
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
      {projection && (
        <div
          className={`vk-refund-result${projection.eligibility.status === "requires_verification" ? " vk-refund-result--unresolved" : ""}`}
          aria-live="polite"
          data-testid="refund-result"
        >
          <h3 tabIndex={-1}>
            {projection.eligibility.status === "eligible" ||
            projection.eligibility.status === "not_assessed"
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
          projection &&
          ["requires_verification", "ineligible"].includes(
            projection.eligibility.status,
          )
            ? true
            : undefined
        }
      >
        <summary>{t("refundDetails")}</summary>
        <p>{t("financialScenarioNotice")}</p>
        <p>{t("effectiveHelp")}</p>
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
