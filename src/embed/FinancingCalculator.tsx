import { useEffect, useMemo, useRef, useState } from "react";
import { calculateFinancing } from "@/lib/financing";
import type { ResolvedWidget } from "./types";
import RefundPanel from "./RefundPanel";
import { useWidgetText, WidgetLanguageContext } from "./language";
import type { WidgetLanguage } from "./messages";
import { accentForeground } from "./appearance";
import type { MortgageRefundResult } from "@/lib/financing/income-tax-refund";
import { roundRatio, toWholeAmount } from "@/lib/financing/arithmetic";

function CalculatorBody({
  configuration,
  notify,
  onLanguageChange,
}: {
  configuration: ResolvedWidget;
  notify: (type: "calculated" | "changed") => void;
  onLanguageChange: (language: WidgetLanguage) => void;
}) {
  const { t, language, money, number } = useWidgetText();
  const initial = configuration.financing;
  const [down, setDown] = useState(String(initial.downPaymentPercent));
  const [duration, setDuration] = useState(String(initial.durationMonths));
  const [page, setPage] = useState(0);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundProjection, setRefundProjection] =
    useState<MortgageRefundResult | null>(null);
  const paymentPanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      refundProjection?.financingCurrency === "AMD" &&
      refundProjection.totalEstimatedRefundAMD !== null
    )
      paymentPanel.current?.focus();
  }, [refundProjection]);
  const calculated = useMemo(() => {
    try {
      if (down === "" || duration === "") throw new Error("EMPTY");
      const downValue = Number(down);
      const durationValue = Number(duration);
      const limits = configuration.controls.limits;
      const aligned = (value: number, min: number, step: number) =>
        Math.abs((value - min) / step - Math.round((value - min) / step)) <
        1e-8;
      if (
        !Number.isFinite(downValue) ||
        downValue < limits.downPaymentPercent.min ||
        downValue > limits.downPaymentPercent.max ||
        !aligned(
          downValue,
          limits.downPaymentPercent.min,
          limits.downPaymentPercent.step,
        ) ||
        !Number.isInteger(durationValue) ||
        durationValue < limits.durationMonths.min ||
        durationValue > limits.durationMonths.max ||
        (limits.supportedDurations.length
          ? !limits.supportedDurations.includes(durationValue)
          : !aligned(
              durationValue,
              limits.durationMonths.min,
              limits.durationMonths.step,
            ))
      )
        throw new Error("BOUNDS");
      return {
        result: calculateFinancing({
          ...initial,
          downPaymentPercent: downValue,
          durationMonths: durationValue,
        }),
        error: null,
      };
    } catch {
      return {
        result: null,
        error: true,
      };
    }
  }, [configuration.controls.limits, initial, down, duration]);
  useEffect(() => {
    if (calculated.result) notify("calculated");
  }, [calculated.result, notify]);
  const change = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
    setRefundProjection(null);
    notify("changed");
  };
  const result = calculated.result;
  const refundSummary =
    result?.currency === "AMD" &&
    refundProjection?.totalEstimatedRefundAMD !== null &&
    refundProjection?.totalEstimatedRefundAMD !== undefined &&
    refundProjection.effectiveAverageMonthlyFinancingCostAMD !== null &&
    refundProjection.totalEffectiveFinancingCostAMD !== null
      ? {
          refund: toWholeAmount(
            roundRatio(
              BigInt(refundProjection.totalEstimatedRefundAMD),
              BigInt(result.durationMonths),
            ),
          ),
          cost: refundProjection.effectiveAverageMonthlyFinancingCostAMD,
          totalRefund: refundProjection.totalEstimatedRefundAMD,
          totalCost: refundProjection.totalEffectiveFinancingCostAMD,
        }
      : null;
  const limits = configuration.controls.limits;
  const metric = (label: string, amount: number, testId?: string) => (
    <div>
      <dt>{label}</dt>
      <dd data-testid={testId}>{money(amount, initial.currency)}</dd>
    </div>
  );
  return (
    <article
      className="vk-card"
      data-theme={configuration.appearance.theme}
      lang={language}
      style={
        {
          "--vk-accent": configuration.appearance.accentColor,
          "--vk-on-accent": accentForeground(
            configuration.appearance.accentColor,
          ),
        } as React.CSSProperties
      }
    >
      <header className="vk-header">
        <div className="vk-partner">
          {configuration.appearance.logoUrl && (
            <img
              src={configuration.appearance.logoUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
          )}
          <span>{configuration.partner.displayName}</span>
        </div>
        <select
          className="vk-language"
          aria-label={t("language")}
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as WidgetLanguage)}
        >
          <option value="hy">Հայ</option>
          <option value="en">EN</option>
          <option value="ru">РУ</option>
        </select>
      </header>
      <h1>
        {t(initial.financingType === "mortgage" ? "mortgage" : "installment")}
      </h1>
      <div className="vk-price-row">
        <div>
          <span>{t("price")}</span>
          <strong data-testid="apartment-price">
            {money(initial.apartmentPrice, initial.currency)}
          </strong>
        </div>
        <div className="vk-rate">
          <span>
            {t(
              initial.financingType === "mortgage"
                ? "annualRate"
                : "interestFree",
            )}
          </span>
          <strong data-testid="annual-rate">
            {initial.financingType === "mortgage"
              ? `${number(initial.annualInterestRatePercent)}%`
              : "0%"}
          </strong>
        </div>
      </div>
      <div className="vk-controls">
        <label>
          {t("down")}
          {configuration.controls.downPaymentPercent ? (
            <input
              aria-label={t("down")}
              type="number"
              inputMode="decimal"
              min={limits.downPaymentPercent.min}
              max={limits.downPaymentPercent.max}
              step={limits.downPaymentPercent.step}
              value={down}
              onChange={(e) => change(setDown, e.target.value)}
            />
          ) : (
            <strong>{number(initial.downPaymentPercent)}%</strong>
          )}
        </label>
        <label>
          {t("duration")}
          {configuration.controls.durationMonths ? (
            limits.supportedDurations.length ? (
              <select
                aria-label={t("duration")}
                value={duration}
                onChange={(e) => change(setDuration, e.target.value)}
              >
                {limits.supportedDurations.map((months) => (
                  <option key={months} value={months}>
                    {months} {t("months")}
                  </option>
                ))}
              </select>
            ) : (
              <div className="vk-input-suffix">
                <input
                  aria-label={t("duration")}
                  type="number"
                  inputMode="numeric"
                  min={limits.durationMonths.min}
                  max={limits.durationMonths.max}
                  step={limits.durationMonths.step}
                  value={duration}
                  onChange={(e) => change(setDuration, e.target.value)}
                />
                <span>{t("months")}</span>
              </div>
            )
          ) : (
            <strong>
              {initial.durationMonths} {t("months")}
            </strong>
          )}
        </label>
      </div>
      {calculated.error && (
        <p role="alert" className="vk-warning">
          {t("boundsError")}
        </p>
      )}
      <div
        ref={paymentPanel}
        tabIndex={-1}
        className="vk-payment"
        aria-live="polite"
      >
        {refundSummary && result ? (
          <>
            <span>{t("monthlyBreakdown")}</span>
            <div
              className="vk-payment-equation"
              role="group"
              aria-label={t("monthlyBreakdown")}
              data-testid="payment-breakdown"
            >
              <div>
                <span>{t("bankPayment")}</span>
                <del>
                  <strong data-testid="monthly-payment">
                    {money(result.regularMonthlyPayment)}
                  </strong>
                </del>
              </div>
              <span className="vk-equation-symbol" aria-hidden="true">
                −
              </span>
              <div>
                <span>{t("averageRefund")}</span>
                <strong data-testid="monthly-refund">
                  {money(refundSummary.refund)}
                </strong>
              </div>
              <span className="vk-equation-symbol" aria-hidden="true">
                {result.regularMonthlyPayment - refundSummary.refund ===
                refundSummary.cost
                  ? "="
                  : "≈"}
              </span>
              <div className="vk-equation-result">
                <span>{t("monthlyNetCost")}</span>
                <strong data-testid="monthly-net-payment">
                  {money(refundSummary.cost)}
                </strong>
              </div>
            </div>
            <p>{t("monthlyRefundNote")}</p>
            {result.regularMonthlyPayment - refundSummary.refund !==
              refundSummary.cost && <p>{t("monthlyRoundingNote")}</p>}
          </>
        ) : (
          <>
            <span>
              {t(
                initial.financingType === "mortgage"
                  ? "bankPayment"
                  : "monthlyPayment",
              )}
            </span>
            <strong data-testid="monthly-payment">
              {result
                ? money(result.regularMonthlyPayment, initial.currency)
                : "—"}
            </strong>
          </>
        )}
        {result && (
          <div
            className={`vk-repayment${refundSummary ? "" : " vk-repayment--plain"}`}
            data-testid="repayment-summary"
          >
            <span>
              {t(
                refundSummary
                  ? "totalWithRefund"
                  : initial.financingType === "mortgage"
                    ? "totalBankPayment"
                    : "totalInstallments",
              )}
            </span>
            <div className="vk-repayment-amounts">
              {refundSummary ? (
                <>
                  <del data-testid="total-bank-payment">
                    {money(result.totalFinancedRepayment, initial.currency)}
                  </del>
                  <strong data-testid="total-net-payment">
                    {money(refundSummary.totalCost)}
                  </strong>
                </>
              ) : (
                <strong data-testid="total-bank-payment">
                  {money(result.totalFinancedRepayment, initial.currency)}
                </strong>
              )}
            </div>
            {refundSummary && (
              <small>
                {t("totalRefund")} {money(refundSummary.totalRefund)}
              </small>
            )}
            <small>
              {t(refundSummary ? "netTotalHelp" : "bankTotalHelp", {
                months: result.durationMonths,
              })}
            </small>
          </div>
        )}
        {result?.financedPrincipal === 0 && <p>{t("fullDown")}</p>}
        {initial.financingType === "mortgage" &&
          configuration.refund.enabled &&
          !!result?.schedule.length && (
            <button
              className="vk-refund-toggle"
              aria-expanded={refundOpen}
              onClick={() => setRefundOpen(!refundOpen)}
            >
              {t(refundOpen ? "closeRefund" : "openRefund")}
              <span aria-hidden="true">{refundOpen ? "−" : "+"}</span>
            </button>
          )}
      </div>
      {result && (
        <>
          {(refundOpen || refundProjection !== null) && (
            <div hidden={!refundOpen}>
              <RefundPanel
                key={`${down}-${duration}`}
                financing={result}
                configuration={configuration}
                onProjectionChange={setRefundProjection}
              />
            </div>
          )}
          <details className="vk-schedule">
            <summary>
              {t("schedule")}{" "}
              <span>
                {result.schedule.length} {t("months")}
              </span>
            </summary>
            <dl className="vk-totals">
              {metric(
                t("downAmount"),
                result.downPaymentAmount,
                "down-payment",
              )}
              {metric(t("principal"), result.financedPrincipal, "principal")}
              {metric(
                t("totalInterest"),
                result.totalInterest,
                "total-interest",
              )}
              {metric(
                t("totalCost"),
                result.totalCostIncludingDownPayment,
                "total-cost",
              )}
            </dl>
            <p className="vk-fine">
              {t("roundingNote")} {t("costNote")}
            </p>
            {!result.schedule.length ? (
              <p>{t("noPrincipal")}</p>
            ) : (
              <>
                <div className="vk-table-wrap">
                  <table>
                    <caption className="vk-sr-only">
                      {t("schedule")} · {initial.currency}
                    </caption>
                    <thead>
                      <tr>
                        {[
                          "month",
                          "payment",
                          "principalColumn",
                          "interest",
                          "balance",
                        ].map((key) => (
                          <th key={key}>
                            {t(
                              key as
                                | "month"
                                | "payment"
                                | "principalColumn"
                                | "interest"
                                | "balance",
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule
                        .slice(page * 12, page * 12 + 12)
                        .map((row) => (
                          <tr key={row.month}>
                            <td>{row.month}</td>
                            <td>{number(row.scheduledPayment)}</td>
                            <td>{number(row.principalPaid)}</td>
                            <td>{number(row.interestPaid)}</td>
                            <td>{number(row.remainingBalance)}</td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th>{t("total")}</th>
                        <td>{number(result.totalFinancedRepayment)}</td>
                        <td>{number(result.financedPrincipal)}</td>
                        <td>{number(result.totalInterest)}</td>
                        <td>0</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="vk-pagination">
                  <button
                    disabled={!page}
                    onClick={() => setPage(page - 1)}
                    aria-label={t("previousPage")}
                  >
                    {t("previousArrow")}
                  </button>
                  <span>
                    {page + 1} / {Math.ceil(result.schedule.length / 12)}
                  </span>
                  <button
                    disabled={(page + 1) * 12 >= result.schedule.length}
                    onClick={() => setPage(page + 1)}
                    aria-label={t("nextPage")}
                  >
                    {t("nextArrow")}
                  </button>
                </div>
              </>
            )}
          </details>
        </>
      )}
      <footer className="vk-footer">
        <p>{t("estimate")}</p>
        <a href="https://www.varkonline.am" target="_blank" rel="noreferrer">
          Varkonline ↗
        </a>
      </footer>
    </article>
  );
}

export default function FinancingCalculator(props: {
  configuration: ResolvedWidget;
  notify: (type: "calculated" | "changed") => void;
  initialLanguage?: WidgetLanguage;
  onLanguageChange?: (language: WidgetLanguage) => void;
}) {
  const [language, setLanguage] = useState<WidgetLanguage>(
    props.initialLanguage ?? "hy",
  );
  useEffect(() => {
    setLanguage(props.initialLanguage ?? "hy");
  }, [props.initialLanguage]);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return (
    <WidgetLanguageContext.Provider value={language}>
      <CalculatorBody
        configuration={props.configuration}
        notify={props.notify}
        onLanguageChange={(value) => {
          setLanguage(value);
          props.onLanguageChange?.(value);
        }}
      />
    </WidgetLanguageContext.Provider>
  );
}
