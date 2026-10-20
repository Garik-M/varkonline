import { useEffect, useId, useMemo, useState } from "react";
import type { FinancingResult } from "@/lib/financing";
import {
  ARMENIA_REFUND_RULES_2026_10,
  estimateIncomeTaxFromNetSalary,
  type MortgageRefundResult,
} from "@/lib/financing/income-tax-refund";
import type { ResolvedWidget } from "./types";
import {
  automaticProjectionDates,
  netPayrollParticipant,
  paymentDates,
  refundProjection,
  wholeAmount,
  yerevanToday,
} from "./refund-model";
import { useWidgetText } from "./language";
import type { TrackWidgetEvent } from "./analytics";

export default function RefundPanel({
  financing,
  configuration,
  onProjectionChange,
  track,
}: {
  financing: FinancingResult | null;
  configuration: ResolvedWidget;
  onProjectionChange?: (
    projection: MortgageRefundResult | null,
    financing: FinancingResult | null,
  ) => void;
  track?: TrackWidgetEvent;
}) {
  const { t, money } = useWidgetText();
  const id = useId();
  const [net, setNet] = useState("");
  const [coNet, setCoNet] = useState("");
  const [includeCo, setIncludeCo] = useState(false);
  const [touched, setTouched] = useState(false);
  const [dates] = useState(() => {
    const automatic = automaticProjectionDates(yerevanToday());
    return {
      loan: configuration.refund.loanOriginationDate?.value ?? automatic.loan,
      first: configuration.refund.firstPaymentDate ?? automatic.first,
    };
  });
  const outcome = useMemo(() => {
    if (!net || !financing || financing.currency !== "AMD")
      return { projection: null, tax: null, error: false };
    try {
      const primary = estimateIncomeTaxFromNetSalary(wholeAmount(net));
      const secondary = includeCo
        ? estimateIncomeTaxFromNetSalary(wholeAmount(coNet))
        : null;
      const payments = paymentDates(dates.first, financing.schedule.length);
      const participants = [
        netPayrollParticipant(net, payments, "borrower"),
        ...(includeCo
          ? [netPayrollParticipant(coNet, payments, "co_borrower")]
          : []),
      ];
      return {
        projection: refundProjection(
          financing,
          dates.first,
          dates.loan,
          participants,
        ),
        tax: primary.incomeTaxAMD + (secondary?.incomeTaxAMD ?? 0),
        error: false,
      };
    } catch {
      return { projection: null, tax: null, error: true };
    }
  }, [net, coNet, includeCo, financing, dates]);
  useEffect(() => {
    onProjectionChange?.(outcome.projection, financing);
  }, [outcome.projection, financing, onProjectionChange]);
  const salaryBlur = (field: "net_salary" | "co_net_salary") => {
    setTouched(true);
    track?.("field_changed", field);
    if (
      outcome.projection?.totalEstimatedRefundAMD !== null &&
      outcome.projection
    )
      track?.("refund_calculated");
  };
  return (
    <section
      className="vk-refund vk-refund-visible"
      aria-label={t("refundTitle")}
    >
      <div className="vk-refund-badge">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            d="M4 8a8 8 0 1 1-1 7M4 3v5h5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9 12h6m-3-3v6" strokeLinecap="round" />
        </svg>
        <span>{t("refundFeatureBadge")}</span>
      </div>
      <h2>{t("refundTitle")}</h2>
      <p className="vk-muted">{t("refundPrompt")}</p>
      {financing?.currency === "USD" ? (
        <p className="vk-warning">{t("usdWarning")}</p>
      ) : (
        <>
          <label htmlFor={`${id}-salary`}>
            {t("netSalary")}
            <div className="vk-input-suffix">
              <input
                id={`${id}-salary`}
                data-testid="net-salary"
                aria-label={t("netSalary")}
                aria-describedby={`${id}-help`}
                type="number"
                inputMode="numeric"
                min="0"
                max="1000000000000"
                step="10000"
                value={net}
                onChange={(event) => setNet(event.target.value)}
                onBlur={() => salaryBlur("net_salary")}
                autoComplete="off"
                placeholder="500000"
              />
              <span>֏</span>
            </div>
            <small id={`${id}-help`}>{t("netSalaryHelp")}</small>
          </label>
          {configuration.calculator?.allowCoBorrower && (
            <label className="vk-check">
              <input
                type="checkbox"
                checked={includeCo}
                onChange={(event) => {
                  setIncludeCo(event.target.checked);
                  track?.("co_borrower_toggled");
                }}
              />
              {t("includeCo")}
            </label>
          )}
          {includeCo && (
            <label>
              {t("coNetSalary")}
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="1000000000000"
                step="10000"
                value={coNet}
                onChange={(event) => setCoNet(event.target.value)}
                onBlur={() => salaryBlur("co_net_salary")}
                autoComplete="off"
              />
            </label>
          )}
          {touched && outcome.error && (
            <p role="alert" className="vk-field-error">
              {t("amountError")}
            </p>
          )}
          {outcome.projection?.totalEstimatedRefundAMD != null && (
            <div className="vk-refund-hero-result" aria-live="polite">
              <span>{t("totalRefund")}</span>
              <strong data-testid="total-refund">
                {money(outcome.projection.totalEstimatedRefundAMD)}
              </strong>
              <small>
                {t("refundPeriod", { months: financing?.durationMonths ?? 0 })}
              </small>
            </div>
          )}
          {outcome.tax !== null && (
            <p className="vk-tax" data-testid="salary-tax">
              {t("estimatedTax")} <strong>{money(outcome.tax)}</strong>
            </p>
          )}
          <p className="vk-refund-private">
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            {t("salaryPrivateShort")}
          </p>
        </>
      )}
    </section>
  );
}

export function RefundNotes({
  configuration,
  track,
}: {
  configuration: ResolvedWidget;
  track?: TrackWidgetEvent;
}) {
  const { t } = useWidgetText();
  const [dates] = useState(() => {
    const automatic = automaticProjectionDates(yerevanToday());
    return {
      loan: configuration.refund.loanOriginationDate?.value ?? automatic.loan,
      first: configuration.refund.firstPaymentDate ?? automatic.first,
    };
  });
  return (
    <details
      className="vk-refund-notes"
      onToggle={(event) => {
        if (event.currentTarget.open) track?.("refund_details_opened");
      }}
    >
      <summary>{t("refundDetails")}</summary>
      <p>{t("financialScenarioNotice")}</p>
      <p>{t("netPayrollAssumptions")}</p>
      <p>{t("projectionDates", { loan: dates.loan, first: dates.first })}</p>
      <p>{t("refundAllocationNote")}</p>
      <p>{t("privacy")}</p>
      <p>
        {t("ruleVersion")}
        {ARMENIA_REFUND_RULES_2026_10.version}
        {t("futureChanges")}
      </p>
      <a
        href="https://www.arlis.am/hy/acts/200943"
        target="_blank"
        rel="noreferrer"
      >
        {t("taxCode")}
      </a>
    </details>
  );
}
