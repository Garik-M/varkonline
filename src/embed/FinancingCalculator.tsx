import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateFinancing, type FinancingResult } from "@/lib/financing";
import type { ResolvedWidget } from "./types";
import RefundPanel, { RefundNotes } from "./RefundPanel";
import { useWidgetText, WidgetLanguageContext } from "./language";
import type { WidgetLanguage } from "./messages";
import { accentForeground } from "./appearance";
import type { MortgageRefundResult } from "@/lib/financing/income-tax-refund";
import { LEGACY_CALCULATOR_OPTIONS } from "./calculator-options";
import type { TrackWidgetEvent } from "./analytics";

function CalculatorBody({
  configuration,
  notify,
  onLanguageChange,
  track,
}: {
  configuration: ResolvedWidget;
  notify: (type: "calculated" | "changed") => void;
  onLanguageChange: (language: WidgetLanguage) => void;
  track?: TrackWidgetEvent;
}) {
  const { t, language, money, number } = useWidgetText();
  const initial = configuration.financing;
  const options = configuration.calculator ?? LEGACY_CALCULATOR_OPTIONS;
  const limits = configuration.controls.limits;
  const mortgage = initial.financingType === "mortgage";
  const factor = mortgage && options.durationUnit === "years" ? 12 : 1;
  const [down, setDown] = useState(
    String(
      Math.round((initial.apartmentPrice * initial.downPaymentPercent) / 100),
    ),
  );
  const [duration, setDuration] = useState(
    String(initial.durationMonths / factor),
  );
  const [rate, setRate] = useState(
    mortgage ? String(initial.annualInterestRatePercent) : "0",
  );
  const [method, setMethod] = useState(options.repaymentMethod);
  const [page, setPage] = useState(0);
  const [quarterPage, setQuarterPage] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [refundState, setRefundState] = useState<{
    financing: FinancingResult;
    projection: MortgageRefundResult;
  } | null>(null);
  const publishRefund = useCallback(
    (
      projection: MortgageRefundResult | null,
      financing: FinancingResult | null,
    ) => {
      setRefundState(
        projection && financing ? { financing, projection } : null,
      );
    },
    [],
  );
  const minDown = Math.ceil(
    (initial.apartmentPrice * limits.downPaymentPercent.min) / 100,
  );
  const maxDown = Math.floor(
    (initial.apartmentPrice * limits.downPaymentPercent.max) / 100,
  );
  const downError =
    down === "" ||
    !Number.isSafeInteger(Number(down)) ||
    Number(down) < minDown ||
    Number(down) > maxDown;
  const durationValue = Number(duration) * factor;
  const durationError =
    duration === "" ||
    !Number.isInteger(durationValue) ||
    durationValue < limits.durationMonths.min ||
    durationValue > limits.durationMonths.max ||
    (limits.supportedDurations.length
      ? !limits.supportedDurations.includes(durationValue)
      : Math.abs(
          (durationValue - limits.durationMonths.min) /
            limits.durationMonths.step -
            Math.round(
              (durationValue - limits.durationMonths.min) /
                limits.durationMonths.step,
            ),
        ) > 1e-8);
  const rateValue = Number(rate.replace(",", "."));
  const rateError =
    mortgage &&
    (!/^\d+(?:[.,]\d*)?$/.test(rate.trim()) ||
      !Number.isFinite(rateValue) ||
      rateValue < limits.annualInterestRatePercent.min ||
      rateValue > limits.annualInterestRatePercent.max);
  const result = useMemo(() => {
    if (downError || durationError || rateError) return null;
    try {
      const common = {
        currency: initial.currency,
        apartmentPrice: initial.apartmentPrice,
        downPaymentAmount: Number(down),
        downPaymentPercent: (Number(down) / initial.apartmentPrice) * 100,
        durationMonths: durationValue,
      };
      return calculateFinancing(
        initial.financingType === "mortgage"
          ? {
              ...common,
              financingType: "mortgage",
              annualInterestRatePercent: rateValue,
              repaymentMethod: method,
            }
          : {
              ...common,
              financingType: "developer_installment",
              formula: "interest_free",
            },
      );
    } catch {
      return null;
    }
  }, [
    initial,
    down,
    downError,
    durationValue,
    durationError,
    rateError,
    rateValue,
    method,
  ]);
  useEffect(() => {
    if (result) notify("calculated");
  }, [result, notify]);
  const change = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
    setQuarterPage(0);
    notify("changed");
  };
  const projection =
    refundState?.financing === result ? refundState.projection : null;
  const row =
    result?.schedule[Math.min(selectedMonth, result.schedule.length) - 1];
  const refundRow = projection?.monthlySchedule.find(
    (item) => item.month === row?.month,
  );
  const hasRefund =
    result?.currency === "AMD" &&
    projection?.totalEstimatedRefundAMD != null &&
    refundRow?.allocatedRefundAMD != null;
  const moneyInCurrency = (value: number) => money(value, initial.currency);
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
          onChange={(event) => {
            onLanguageChange(event.target.value as WidgetLanguage);
          }}
        >
          <option value="hy">Հայ</option>
          <option value="en">EN</option>
          <option value="ru">РУ</option>
        </select>
      </header>
      <h1>{t(mortgage ? "mortgage" : "installment")}</h1>
      <div className="vk-price-row">
        <div>
          <span>{t("price")}</span>
          <strong data-testid="apartment-price">
            {moneyInCurrency(initial.apartmentPrice)}
          </strong>
        </div>
        {mortgage && (
          <label className="vk-rate vk-rate-edit">
            {t("annualRate")}
            {options.rateEditable ? (
              <div className="vk-input-suffix">
                <input
                  data-testid="annual-rate"
                  aria-label={t("annualRate")}
                  aria-invalid={rateError}
                  type="text"
                  inputMode="decimal"
                  value={rate}
                  onChange={(event) => change(setRate, event.target.value)}
                  onBlur={() => track?.("field_changed", "interest_rate")}
                />
                <span>%</span>
              </div>
            ) : (
              <strong data-testid="annual-rate">{number(rateValue)}%</strong>
            )}
            {rateError && (
              <small className="vk-field-error">
                {t("rateBounds", {
                  min: limits.annualInterestRatePercent.min,
                  max: limits.annualInterestRatePercent.max,
                })}
              </small>
            )}
          </label>
        )}

        {!mortgage && (
          <div className="vk-rate">
            <span>{t("interestFree")}</span>
            <strong>0%</strong>
          </div>
        )}
      </div>
      <div className="vk-controls">
        <label>
          {t("downAmount")}
          {configuration.controls.downPaymentPercent ? (
            <div className="vk-input-suffix">
              <input
                aria-label={t("downAmount")}
                aria-invalid={downError}
                aria-describedby="vk-down-help"
                type="number"
                inputMode="numeric"
                min={minDown}
                max={maxDown}
                step={
                  initial.currency === "AMD" ? options.downPaymentAmountStep : 1
                }
                value={down}
                onChange={(event) => change(setDown, event.target.value)}
                onBlur={() => track?.("field_changed", "down_payment")}
              />
              <span>{initial.currency === "AMD" ? "֏" : "$"}</span>
            </div>
          ) : (
            <strong>{moneyInCurrency(Number(down))}</strong>
          )}
          <small
            id="vk-down-help"
            className={downError ? "vk-field-error" : ""}
          >
            {downError
              ? t("downBounds", {
                  min: moneyInCurrency(minDown),
                  max: moneyInCurrency(maxDown),
                })
              : t("downPercentHelp", {
                  percent: number(
                    (Number(down) / initial.apartmentPrice) * 100,
                  ),
                })}
          </small>
        </label>
        <label>
          {t(factor === 12 ? "durationYears" : "duration")}
          {configuration.controls.durationMonths ? (
            limits.supportedDurations.length ? (
              <select
                aria-label={t(factor === 12 ? "durationYears" : "duration")}
                value={duration}
                onChange={(event) => change(setDuration, event.target.value)}
                onBlur={() => track?.("field_changed", "duration")}
              >
                {limits.supportedDurations.map((months) => (
                  <option key={months} value={months / factor}>
                    {months / factor}
                  </option>
                ))}
              </select>
            ) : (
              <div className="vk-input-suffix">
                <input
                  aria-label={t(factor === 12 ? "durationYears" : "duration")}
                  aria-invalid={durationError}
                  type="number"
                  inputMode="numeric"
                  min={limits.durationMonths.min / factor}
                  max={limits.durationMonths.max / factor}
                  step={limits.durationMonths.step / factor}
                  value={duration}
                  onChange={(event) => change(setDuration, event.target.value)}
                  onBlur={() => track?.("field_changed", "duration")}
                />
                <span>{t(factor === 12 ? "years" : "months")}</span>
              </div>
            )
          ) : (
            <strong>
              {duration} {t(factor === 12 ? "years" : "months")}
            </strong>
          )}
          {durationError && (
            <small className="vk-field-error">
              {t("termBounds", {
                min: limits.durationMonths.min / factor,
                max: limits.durationMonths.max / factor,
              })}
            </small>
          )}
        </label>
        {mortgage && options.allowRepaymentChoice && (
          <label className="vk-control-wide">
            {t("repaymentMethod")}
            <select
              aria-label={t("repaymentMethod")}
              value={method}
              onChange={(event) => {
                setMethod(event.target.value as typeof method);
                setPage(0);
                track?.("repayment_changed");
              }}
            >
              <option value="annuity">{t("annuity")}</option>
              <option value="equal_principal">{t("equalPrincipal")}</option>
            </select>
          </label>
        )}
      </div>
      {mortgage && configuration.refund.enabled && (
        <RefundPanel
          financing={result}
          configuration={configuration}
          onProjectionChange={publishRefund}
          track={track}
        />
      )}
      <div className="vk-payment" aria-live="polite">
        {hasRefund && row && refundRow ? (
          <>
            <span>{t("selectedMonthCost", { month: row.month })}</span>
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
                    {moneyInCurrency(row.scheduledPayment)}
                  </strong>
                </del>
              </div>
              <span className="vk-equation-symbol">−</span>
              <div>
                <span>{t("allocatedRefund")}</span>
                <strong data-testid="monthly-refund">
                  {money(refundRow.allocatedRefundAMD!)}
                </strong>
              </div>
              <span className="vk-equation-symbol">=</span>
              <div className="vk-equation-result">
                <span>{t("costAfterRefund")}</span>
                <strong data-testid="monthly-net-payment">
                  {money(refundRow.costAfterAllocatedRefundAMD!)}
                </strong>
              </div>
            </div>
            <p>{t("refundAllocationShort")}</p>
          </>
        ) : (
          <>
            <span>{t(mortgage ? "bankPayment" : "monthlyPayment")}</span>
            <strong data-testid="monthly-payment">
              {result
                ? moneyInCurrency(
                    row?.scheduledPayment ?? result.regularMonthlyPayment,
                  )
                : "—"}
            </strong>
          </>
        )}
        {result && options.showTotals && (
          <div
            className={`vk-repayment${hasRefund ? "" : " vk-repayment--plain"}`}
            data-testid="repayment-summary"
          >
            <span>
              {t(
                hasRefund
                  ? "totalWithRefund"
                  : mortgage
                    ? "totalBankPayment"
                    : "totalInstallments",
              )}
            </span>
            <div className="vk-repayment-amounts">
              {hasRefund ? (
                <>
                  <del data-testid="total-bank-payment">
                    {moneyInCurrency(result.totalFinancedRepayment)}
                  </del>
                  <strong data-testid="total-net-payment">
                    {money(projection!.totalEffectiveFinancingCostAMD!)}
                  </strong>
                </>
              ) : (
                <strong data-testid="total-bank-payment">
                  {moneyInCurrency(result.totalFinancedRepayment)}
                </strong>
              )}
            </div>
            <small>{t(hasRefund ? "netTotalHelp" : "bankTotalHelp")}</small>
          </div>
        )}
        {result?.financedPrincipal === 0 && <p>{t("fullDown")}</p>}
      </div>
      {hasRefund && result && (
        <section className="vk-timeline" aria-label={t("refundTimeline")}>
          <label>
            {t("refundTimeline")}
            <input
              aria-label={t("chooseMonth")}
              type="range"
              min={1}
              max={result.durationMonths}
              value={Math.min(selectedMonth, result.durationMonths)}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              onPointerUp={() => track?.("schedule_page")}
              onKeyUp={() => track?.("schedule_page")}
            />
          </label>
          <div className="vk-timeline-points">
            {[
              0,
              Math.floor((result.schedule.length - 1) / 2),
              result.schedule.length - 1,
            ].map((index, i) => {
              const item = projection!.monthlySchedule[index];
              return (
                <button
                  key={i}
                  aria-pressed={row?.month === item.month}
                  onClick={() => {
                    setSelectedMonth(item.month);
                    track?.("schedule_page");
                  }}
                >
                  <small>{t("monthNumber", { month: item.month })}</small>
                  <strong>{money(item.allocatedRefundAMD!)}</strong>
                </button>
              );
            })}
          </div>
        </section>
      )}
      {result && options.showSchedule && (
        <div className="vk-download">
          <button
            type="button"
            data-testid="download-schedule"
            disabled={downloading}
            aria-busy={downloading}
            onClick={async () => {
              setDownloading(true);
              setDownloadError(false);
              try {
                const { downloadPaymentSchedule } = await import(
                  "./schedule-export"
                );
                await downloadPaymentSchedule({
                  financing: result,
                  projection: hasRefund ? projection : null,
                  partnerName: configuration.partner.displayName,
                  apartmentId: configuration.apartmentId,
                  language,
                });
              } catch {
                setDownloadError(true);
              } finally {
                setDownloading(false);
              }
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
            </svg>
            {t(downloading ? "preparingDownload" : "downloadSchedule")}
          </button>
          {downloadError && (
            <p role="alert" className="vk-field-error">
              {t("downloadFailed")}
            </p>
          )}
        </div>
      )}
      {result && options.showSchedule && (
        <details
          className="vk-schedule"
          onToggle={(event) =>
            track?.(
              event.currentTarget.open ? "schedule_opened" : "schedule_closed",
            )
          }
        >
          <summary>
            {t("schedule")}{" "}
            <span>
              {result.schedule.length} {t("months")}
            </span>
          </summary>
          <dl className="vk-totals">
            {[
              ["downAmount", result.downPaymentAmount, "down-payment"],
              ["principal", result.financedPrincipal, "principal"],
              ["totalInterest", result.totalInterest, "total-interest"],
              ["totalCost", result.totalCostIncludingDownPayment, "total-cost"],
            ].map(([key, value, testId]) => (
              <div key={key}>
                <dt>{t(key as "downAmount")}</dt>
                <dd data-testid={testId}>{moneyInCurrency(value as number)}</dd>
              </div>
            ))}
          </dl>
          <p className="vk-fine">
            {t("roundingNote")} {t("costNote")}
          </p>
          {hasRefund && <p className="vk-fine">{t("refundAllocationNote")}</p>}
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
                        ...(hasRefund
                          ? ["allocatedRefund", "costAfterRefund"]
                          : []),
                      ].map((key) => (
                        <th key={key}>{t(key as "month")}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.schedule
                      .slice(page * 12, page * 12 + 12)
                      .map((item) => {
                        const benefit = projection?.monthlySchedule.find(
                          (entry) => entry.month === item.month,
                        );
                        return (
                          <tr key={item.month}>
                            <td>{item.month}</td>
                            <td>{number(item.scheduledPayment)}</td>
                            <td>{number(item.principalPaid)}</td>
                            <td>{number(item.interestPaid)}</td>
                            <td>{number(item.remainingBalance)}</td>
                            {hasRefund && (
                              <>
                                <td>{number(benefit!.allocatedRefundAMD!)}</td>
                                <td>
                                  {number(
                                    benefit!.costAfterAllocatedRefundAMD!,
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th>{t("total")}</th>
                      <td>{number(result.totalFinancedRepayment)}</td>
                      <td>{number(result.financedPrincipal)}</td>
                      <td>{number(result.totalInterest)}</td>
                      <td>0</td>
                      {hasRefund && (
                        <>
                          <td>
                            {number(projection!.totalEstimatedRefundAMD!)}
                          </td>
                          <td>
                            {number(
                              projection!.totalEffectiveFinancingCostAMD!,
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="vk-pagination">
                <button
                  disabled={!page}
                  onClick={() => {
                    setPage(page - 1);
                    track?.("schedule_page");
                  }}
                  aria-label={t("previousPage")}
                >
                  {t("previousArrow")}
                </button>
                <span>
                  {page + 1} / {Math.ceil(result.schedule.length / 12)}
                </span>
                <button
                  disabled={(page + 1) * 12 >= result.schedule.length}
                  onClick={() => {
                    setPage(page + 1);
                    track?.("schedule_page");
                  }}
                  aria-label={t("nextPage")}
                >
                  {t("nextArrow")}
                </button>
              </div>
            </>
          )}
        </details>
      )}
      {hasRefund && options.showSchedule && (
        <details className="vk-schedule">
          <summary>{t("quarterSchedule")}</summary>
          <div className="vk-quarter-list">
            {projection!.quarterlySchedule
              .slice(quarterPage * 8, quarterPage * 8 + 8)
              .map((quarter) => (
                <div key={`${quarter.year}-${quarter.quarter}`}>
                  <span>
                    {quarter.year} · {quarter.quarter}
                    {t("quarterSuffix")}
                  </span>
                  <strong>{money(quarter.estimatedRefundAMD!)}</strong>
                  <small>
                    {t("interestPrefix")} {money(quarter.eligibleInterestAMD!)}{" "}
                    · {t("taxPrefix")} {money(quarter.eligibleIncomeTaxAMD!)} ·{" "}
                    {t("capPrefix")} {money(quarter.quarterlyRefundCapAMD!)}
                  </small>
                </div>
              ))}
          </div>
          <div className="vk-pagination">
            <button
              disabled={!quarterPage}
              onClick={() => {
                setQuarterPage(quarterPage - 1);
                track?.("schedule_page");
              }}
            >
              {t("previous")}
            </button>
            <span>
              {quarterPage + 1} /{" "}
              {Math.ceil(projection!.quarterlySchedule.length / 8)}
            </span>
            <button
              disabled={
                (quarterPage + 1) * 8 >= projection!.quarterlySchedule.length
              }
              onClick={() => {
                setQuarterPage(quarterPage + 1);
                track?.("schedule_page");
              }}
            >
              {t("next")}
            </button>
          </div>
        </details>
      )}
      {mortgage && configuration.refund.enabled && (
        <RefundNotes configuration={configuration} track={track} />
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
  track?: TrackWidgetEvent;
}) {
  const [language, setLanguage] = useState<WidgetLanguage>(
    props.initialLanguage ??
      props.configuration.calculator?.defaultLanguage ??
      "hy",
  );
  useEffect(() => {
    setLanguage(
      props.initialLanguage ??
        props.configuration.calculator?.defaultLanguage ??
        "hy",
    );
  }, [props.initialLanguage, props.configuration.calculator?.defaultLanguage]);
  return (
    <WidgetLanguageContext.Provider value={language}>
      <CalculatorBody
        configuration={props.configuration}
        notify={props.notify}
        track={props.track}
        onLanguageChange={(value) => {
          setLanguage(value);
          props.onLanguageChange?.(value);
        }}
      />
    </WidgetLanguageContext.Provider>
  );
}
