import { useEffect, useMemo, useState } from "react";
import { calculateFinancing } from "@/lib/financing";
import type { ResolvedWidget } from "./types";
import RefundPanel from "./RefundPanel";
import { money, number } from "./format";
import { accentForeground } from "./appearance";

export default function FinancingCalculator({
  configuration,
  notify,
}: {
  configuration: ResolvedWidget;
  notify: (type: "calculated" | "changed") => void;
}) {
  const initial = configuration.financing;
  const [down, setDown] = useState(String(initial.downPaymentPercent));
  const [duration, setDuration] = useState(String(initial.durationMonths));
  const [page, setPage] = useState(0);
  const [refundOpen, setRefundOpen] = useState(false);
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
        error: "Ընտրեք գործընկերոջ թույլատրած կանխավճարն ու ժամկետը։",
      };
    }
  }, [configuration.controls.limits, initial, down, duration]);
  useEffect(() => {
    if (calculated.result) notify("calculated");
  }, [calculated.result, notify]);
  const change = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(0);
    notify("changed");
  };
  const result = calculated.result;
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
      style={
        {
          "--vk-accent": configuration.appearance.accentColor,
          "--vk-on-accent": accentForeground(configuration.appearance.accentColor),
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
        <span className="vk-badge">Նախնական հաշվարկ</span>
      </header>
      <div className="vk-intro">
        <span className="vk-eyebrow">
          ՁԵՐ ԲՆԱԿԱՐԱՆԸ · {configuration.apartmentId}
        </span>
        <h1>
          {initial.financingType === "mortgage"
            ? "Հիփոթեքային ֆինանսավորում"
            : "Կառուցապատողի ապառիկ"}
        </h1>
        <p>Հասկանալի վճարներ։ Տեղեկացված որոշում։</p>
      </div>
      <div className="vk-main-grid">
        <div className="vk-inputs">
          <div className="vk-price">
            <span>Բնակարանի արժեք</span>
            <strong data-testid="apartment-price">
              {money(initial.apartmentPrice, initial.currency)}
            </strong>
          </div>
          <div className="vk-controls">
            <label>
              Կանխավճար, %
              <div className="vk-input-suffix">
                <input
                  aria-label="Կանխավճար, %"
                  type="number"
                  inputMode="decimal"
                  min={limits.downPaymentPercent.min}
                  max={limits.downPaymentPercent.max}
                  step={limits.downPaymentPercent.step}
                  value={down}
                  disabled={!configuration.controls.downPaymentPercent}
                  onChange={(e) => change(setDown, e.target.value)}
                />
                <span>%</span>
              </div>
              {configuration.controls.downPaymentPercent && (
                <small>
                  Թույլատրելի՝ {number(limits.downPaymentPercent.min)}–
                  {number(limits.downPaymentPercent.max)}%
                </small>
              )}
            </label>
            <label>
              Ֆինանսավորման ժամկետ
              {configuration.controls.durationMonths &&
              limits.supportedDurations.length ? (
                <select
                  aria-label="Ֆինանսավորման ժամկետ"
                  value={duration}
                  onChange={(e) => change(setDuration, e.target.value)}
                >
                  {limits.supportedDurations.map((months) => (
                    <option key={months} value={months}>
                      {months} ամիս
                    </option>
                  ))}
                </select>
              ) : (
                <div className="vk-input-suffix">
                  <input
                    aria-label="Ֆինանսավորման ժամկետ"
                    type="number"
                    inputMode="numeric"
                    min={limits.durationMonths.min}
                    max={limits.durationMonths.max}
                    step={limits.durationMonths.step}
                    value={duration}
                    disabled={!configuration.controls.durationMonths}
                    onChange={(e) => change(setDuration, e.target.value)}
                  />
                  <span>ամիս</span>
                </div>
              )}
            </label>
          </div>
          <div className="vk-rate">
            <span>
              {initial.financingType === "mortgage"
                ? "Տարեկան անվանական տոկոսադրույք"
                : "Անտոկոս ապառիկ"}
            </span>
            <strong data-testid="annual-rate">
              {initial.financingType === "mortgage"
                ? `${number(initial.annualInterestRatePercent)}%`
                : "0%"}
            </strong>
          </div>
        </div>
        <div className="vk-payment" aria-live="polite">
          <span>
            Ամսական {initial.financingType === "mortgage" ? "բանկային " : ""}
            վճար
          </span>
          <strong data-testid="monthly-payment">
            {result
              ? money(result.regularMonthlyPayment, initial.currency)
              : "—"}
          </strong>
          <p>
            {result?.financedPrincipal === 0
              ? "Ամբողջական կանխավճար․ ֆինանսավորվող մնացորդ չկա։"
              : "Վճարումը հաշվարկված է ամբողջ միավորով։ Վերջին վճարումը կարող է տարբերվել։"}
          </p>
          {initial.financingType === "mortgage" &&
            configuration.refund.enabled &&
            !!result?.schedule.length && (
              <button
                className="vk-refund-toggle"
                aria-expanded={refundOpen}
                onClick={() => setRefundOpen(!refundOpen)}
              >
                {refundOpen
                  ? "Փակել հետվերադարձի հաշվարկը"
                  : "Հաշվել եկամտահարկի հետվերադարձով"}
                <span aria-hidden="true">↗</span>
              </button>
            )}
        </div>
      </div>
      {calculated.error && (
        <p role="alert" className="vk-warning">
          {calculated.error}
        </p>
      )}
      {result && (
        <>
          <dl className="vk-totals">
            {metric(
              "Սկզբնական կանխավճար",
              result.downPaymentAmount,
              "down-payment",
            )}
            {metric(
              "Ֆինանսավորվող գումար",
              result.financedPrincipal,
              "principal",
            )}
            {metric(
              "Ընդհանուր տոկոսներ",
              result.totalInterest,
              "total-interest",
            )}
            {metric(
              "Ընդհանուր արժեք՝ կանխավճարով",
              result.totalCostIncludingDownPayment,
              "total-cost",
            )}
          </dl>
          <details className="vk-schedule">
            <summary>
              Վճարումների գրաֆիկ <span>{result.schedule.length} ամիս</span>
            </summary>
            {!result.schedule.length ? (
              <p>Ֆինանսավորվող մնացորդ չկա։</p>
            ) : (
              <>
                <div className="vk-table-wrap">
                  <table>
                    <caption className="vk-sr-only">
                      Վճարումների գրաֆիկ՝ {initial.currency}
                    </caption>
                    <thead>
                      <tr>
                        <th>Ամիս</th>
                        <th>Վճար</th>
                        <th>Մայր գումար</th>
                        <th>Տոկոս</th>
                        <th>Մնացորդ</th>
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
                        <th>Ընդամենը</th>
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
                    aria-label="Գրաֆիկի նախորդ էջ"
                  >
                    ← Նախորդ
                  </button>
                  <span>
                    {page + 1} / {Math.ceil(result.schedule.length / 12)}
                  </span>
                  <button
                    disabled={(page + 1) * 12 >= result.schedule.length}
                    onClick={() => setPage(page + 1)}
                    aria-label="Գրաֆիկի հաջորդ էջ"
                  >
                    Հաջորդ →
                  </button>
                </div>
              </>
            )}
          </details>
          {refundOpen && (
            <RefundPanel
              key={`${down}-${duration}`}
              financing={result}
              configuration={configuration}
            />
          )}
        </>
      )}
      {initial.financingType === "developer_installment" && (
        <p className="vk-muted">
          Անտոկոս ապառիկի դեպքում հիփոթեքային տոկոսների եկամտահարկի հետվերադարձ չի
          հաշվարկվում։
        </p>
      )}
      <footer className="vk-footer">
        <p>
          Գործընկերոջ տրամադրած տվյալներով գնահատական է․ բանկի պաշտոնական
          առաջարկ կամ վարկի հաստատում չէ։ Գումարները՝ ամբողջ{" "}
          {initial.currency === "AMD" ? "դրամով" : "դոլարով"}։ Վճարներ,
          ապահովագրություն և այլ ծախսեր չեն ավելացվում։
        </p>
        <a href="https://varkonline.am" target="_blank" rel="noreferrer">
          Հաշվարկը՝ <strong>Varkonline</strong>
          <span aria-hidden="true"> ↗</span>
        </a>
      </footer>
    </article>
  );
}
