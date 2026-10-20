import { useEffect, useId, useMemo, useState } from "react";
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

function messageForError(cause: unknown): MessageKey {
  return cause instanceof FinancingCalculationError
    ? "financialError"
    : cause instanceof Error &&
        ["historicalTaxError", "propertyError", "assumptionsError"].includes(
          cause.message,
        )
      ? (cause.message as MessageKey)
      : cause instanceof Error && cause.message === "INVALID_AMOUNT"
        ? "amountError"
        : cause instanceof Error && cause.message === "INVALID_DATE"
          ? "dateError"
          : "inputError";
}

export default function RefundPanel({
  financing,
  configuration,
  onProjectionChange,
  onCalculate,
}: {
  financing: FinancingResult | null;
  configuration: ResolvedWidget;
  onProjectionChange?: (
    projection: MortgageRefundResult | null,
    financing: FinancingResult | null,
  ) => void;
  onCalculate?: () => void;
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
  const [submitted, setSubmitted] = useState<{
    borrower: PayrollForm;
    co: PayrollForm;
    includeCo: boolean;
    first: string;
    loan: string;
  } | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);
  const [page, setPage] = useState(0);
  useEffect(() => {
    setPage(0);
  }, [financing]);
  const invalidate = () => {
    setSubmitted(null);
    setError(null);
  };
  const change = (value: PayrollForm, secondary = false) => {
    (secondary ? setCo : setBorrower)(value);
    invalidate();
  };
  const outcome = useMemo(() => {
    if (!submitted || !financing)
      return { projection: null, tax: null, error: null };
    try {
      const { borrower, co, includeCo, first, loan } = submitted;
      const dates = paymentDates(first, financing.schedule.length);
      const primary = salaryEstimate(
        borrower,
        first.slice(0, 7),
      ).selectedIncomeTaxAMD;
      const secondary = includeCo
        ? salaryEstimate(co, first.slice(0, 7)).selectedIncomeTaxAMD
        : 0;
      if (primary === null || secondary === null)
        throw new Error("historicalTaxError");
      const participants = [
        payrollParticipant(borrower, dates, "borrower"),
        ...(includeCo ? [payrollParticipant(co, dates, "co_borrower")] : []),
      ];
      return {
        projection: refundProjection(financing, first, loan, participants),
        tax: primary + secondary,
        error: null,
      };
    } catch (cause) {
      return { projection: null, tax: null, error: messageForError(cause) };
    }
  }, [submitted, financing]);
  const { projection, tax } = outcome;
  const visibleError = error ?? outcome.error;
  useEffect(() => {
    onProjectionChange?.(projection, financing);
  }, [projection, financing, onProjectionChange]);
  function calculate(event: React.FormEvent) {
    event.preventDefault();
    if (!constant) {
      setError("assumptionsError");
      return;
    }
    if (!financing) return;
    setError(null);
    setPage(0);
    onCalculate?.();
    setSubmitted({ borrower, co, includeCo, first, loan });
  }
  return (
    <section className="vk-refund" aria-label={t("refundTitle")}>
      <h2>{t("refundTitle")}</h2>
      <p className="vk-muted">{t("privacy")}</p>
      {financing?.currency === "USD" && (
        <p className="vk-warning">{t("usdWarning")}</p>
      )}
      <details
        className="vk-refund-form"
        open={!submitted || outcome.error !== null}
      >
        <summary hidden={!submitted || outcome.error !== null}>
          {t("editRefund")}
        </summary>
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
            <button className="vk-button" type="submit" disabled={!financing}>
              {t("calculateRefund")}
            </button>
          </div>
        </form>
      </details>
      {visibleError && (
        <p className="vk-warning" role="alert">
          {t("inputErrorPrefix")}
          {t(visibleError)}
        </p>
      )}
      {tax !== null && (
        <p className="vk-tax" data-testid="salary-tax">
          {includeCo ? t("combinedTax") : t("selectedTax")}{" "}
          <strong>{money(tax)}</strong>
        </p>
      )}
      {projection && financing && (
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
        {projection && financing && (
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
