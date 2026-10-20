import type { PartnerConfiguration, CalculatorOptions } from "@/embed/types";
import { DEFAULT_CALCULATOR_OPTIONS } from "@/embed/calculator-options";

export type CalculatorControls = Pick<
  PartnerConfiguration,
  "limits" | "adjustable" | "calculator"
>;
export default function CalculatorControlsEditor({
  value,
  onChange,
  mortgage,
  language = "en",
}: {
  value: CalculatorControls;
  onChange: (value: CalculatorControls) => void;
  mortgage: boolean;
  language?: "hy" | "en" | "ru";
}) {
  const l = (hy: string, en: string, ru: string) => ({ hy, en, ru })[language];
  const options = value.calculator ?? DEFAULT_CALCULATOR_OPTIONS;
  const option = <K extends keyof CalculatorOptions>(
    key: K,
    next: CalculatorOptions[K],
  ) => onChange({ ...value, calculator: { ...options, [key]: next } });
  const bound = (
    key: "downPaymentPercent" | "durationMonths" | "annualInterestRatePercent",
    edge: "min" | "max",
    next: number,
  ) =>
    onChange({
      ...value,
      limits: {
        ...value.limits,
        [key]: { ...value.limits[key], [edge]: next },
      },
    });
  const factor = mortgage && options.durationUnit === "years" ? 12 : 1;
  const numeric = (
    label: string,
    current: number,
    change: (value: number) => void,
    min: number,
    max: number,
    step = 1,
  ) => (
    <label className="block text-sm space-y-2">
      {label}
      <input
        className="block w-full rounded border bg-background p-2"
        type="number"
        required
        min={min}
        max={max}
        step={step}
        value={Number.isNaN(current) ? "" : current}
        onChange={(event) =>
          change(event.target.value === "" ? NaN : Number(event.target.value))
        }
      />
    </label>
  );
  const check = (
    label: string,
    checked: boolean,
    change: (checked: boolean) => void,
  ) => (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(event) => change(event.target.checked)}
      />
      {label}
    </label>
  );
  return (
    <div className="space-y-5" data-testid="calculator-controls-editor">
      <h3 className="font-semibold">
        {l(
          "Այցելուի կառավարումներ",
          "Visitor controls",
          "Настройки для посетителя",
        )}
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {numeric(
          l(
            "Նվազագույն կանխավճար, %",
            "Minimum down payment, %",
            "Минимальный взнос, %",
          ),
          value.limits.downPaymentPercent.min,
          (next) => bound("downPaymentPercent", "min", next),
          0,
          100,
          0.01,
        )}
        {numeric(
          l(
            "Առավելագույն կանխավճար, %",
            "Maximum down payment, %",
            "Максимальный взнос, %",
          ),
          value.limits.downPaymentPercent.max,
          (next) => bound("downPaymentPercent", "max", next),
          0,
          100,
          0.01,
        )}
        {numeric(
          l(
            "Կանխավճարի քայլ, ֏",
            "Down-payment increment, AMD",
            "Шаг взноса, AMD",
          ),
          options.downPaymentAmountStep,
          (next) => option("downPaymentAmountStep", next),
          1,
          1e9,
        )}
        <label className="block text-sm space-y-2">
          {l("Ժամկետի միավոր", "Term unit", "Единица срока")}
          <select
            className="block w-full rounded border bg-background p-2"
            aria-label={l("Ժամկետի միավոր", "Term unit", "Единица срока")}
            value={options.durationUnit}
            onChange={(event) => {
              const unit = event.target.value as "years" | "months";
              const min =
                unit === "years"
                  ? Math.max(
                      12,
                      Math.ceil(value.limits.durationMonths.min / 12) * 12,
                    )
                  : value.limits.durationMonths.min;
              const max =
                unit === "years"
                  ? Math.max(
                      min,
                      Math.floor(value.limits.durationMonths.max / 12) * 12,
                    )
                  : value.limits.durationMonths.max;
              onChange({
                ...value,
                calculator: { ...options, durationUnit: unit },
                limits: {
                  ...value.limits,
                  durationMonths: { min, max, step: unit === "years" ? 12 : 1 },
                  supportedDurations: [],
                },
              });
            }}
          >
            <option value="years">{l("Տարիներ", "Years", "Годы")}</option>
            <option value="months">{l("Ամիսներ", "Months", "Месяцы")}</option>
          </select>
        </label>
        {numeric(
          l("Նվազագույն ժամկետ", "Minimum term", "Минимальный срок"),
          value.limits.durationMonths.min / factor,
          (next) => bound("durationMonths", "min", next * factor),
          1,
          600 / factor,
        )}
        {numeric(
          l("Առավելագույն ժամկետ", "Maximum term", "Максимальный срок"),
          value.limits.durationMonths.max / factor,
          (next) => bound("durationMonths", "max", next * factor),
          1,
          600 / factor,
        )}
        {mortgage && (
          <>
            {numeric(
              l(
                "Նվազագույն տոկոսադրույք, %",
                "Minimum annual rate, %",
                "Минимальная ставка, %",
              ),
              value.limits.annualInterestRatePercent.min,
              (next) => bound("annualInterestRatePercent", "min", next),
              0,
              100,
              0.01,
            )}
            {numeric(
              l(
                "Առավելագույն տոկոսադրույք, %",
                "Maximum annual rate, %",
                "Максимальная ставка, %",
              ),
              value.limits.annualInterestRatePercent.max,
              (next) => bound("annualInterestRatePercent", "max", next),
              0,
              100,
              0.01,
            )}
            <label className="block text-sm space-y-2">
              {l("Մարման տարբերակ", "Repayment method", "Способ погашения")}
              <select
                className="block w-full rounded border bg-background p-2"
                aria-label={l(
                  "Մարման տարբերակ",
                  "Repayment method",
                  "Способ погашения",
                )}
                value={options.repaymentMethod}
                onChange={(event) =>
                  option(
                    "repaymentMethod",
                    event.target.value as CalculatorOptions["repaymentMethod"],
                  )
                }
              >
                <option value="annuity">
                  {l(
                    "Հավասար վճարումներ",
                    "Equal payments (annuity)",
                    "Равные платежи (аннуитет)",
                  )}
                </option>
                <option value="equal_principal">
                  {l(
                    "Նվազող վճարումներ",
                    "Declining payments (equal principal)",
                    "Убывающие платежи",
                  )}
                </option>
              </select>
            </label>
          </>
        )}
        <label className="block text-sm space-y-2">
          {l("Սկզբնական լեզու", "Default language", "Язык по умолчанию")}
          <select
            className="block w-full rounded border bg-background p-2"
            aria-label={l(
              "Սկզբնական լեզու",
              "Default language",
              "Язык по умолчанию",
            )}
            value={options.defaultLanguage}
            onChange={(event) =>
              option(
                "defaultLanguage",
                event.target.value as CalculatorOptions["defaultLanguage"],
              )
            }
          >
            <option value="hy">Հայերեն</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {check(
          l(
            "Թույլատրել կանխավճարի փոփոխություն",
            "Allow visitors to change down payment",
            "Разрешить менять взнос",
          ),
          value.adjustable.downPaymentPercent,
          (checked) =>
            onChange({
              ...value,
              adjustable: { ...value.adjustable, downPaymentPercent: checked },
            }),
        )}
        {check(
          l(
            "Թույլատրել ժամկետի փոփոխություն",
            "Allow visitors to change term",
            "Разрешить менять срок",
          ),
          value.adjustable.durationMonths,
          (checked) =>
            onChange({
              ...value,
              adjustable: { ...value.adjustable, durationMonths: checked },
            }),
        )}
        {mortgage &&
          check(
            l(
              "Թույլատրել տոկոսադրույքի փոփոխություն",
              "Allow visitors to change interest rate",
              "Разрешить менять ставку",
            ),
            options.rateEditable,
            (checked) => option("rateEditable", checked),
          )}
        {mortgage &&
          check(
            l(
              "Թույլատրել մարման տարբերակի ընտրություն",
              "Allow visitors to choose repayment method",
              "Разрешить выбирать способ погашения",
            ),
            options.allowRepaymentChoice,
            (checked) => option("allowRepaymentChoice", checked),
          )}
        {check(
          l(
            "Ցուցադրել մարման գրաֆիկը",
            "Show repayment schedule",
            "Показывать график",
          ),
          options.showSchedule,
          (checked) => option("showSchedule", checked),
        )}
        {check(
          l(
            "Ցուցադրել ընդհանուր գումարները",
            "Show full-term totals",
            "Показывать итоговые суммы",
          ),
          options.showTotals,
          (checked) => option("showTotals", checked),
        )}
        {mortgage &&
          check(
            l(
              "Թույլատրել համավարկառուի աշխատավարձ",
              "Allow optional co-borrower salary",
              "Разрешить зарплату созаёмщика",
            ),
            options.allowCoBorrower,
            (checked) => option("allowCoBorrower", checked),
          )}
        {check(
          l(
            "Հավաքել անանուն փոխազդեցությունների վերլուծություն",
            "Collect pseudonymous interaction analytics",
            "Собирать обезличенную аналитику действий",
          ),
          options.analyticsEnabled,
          (checked) => option("analyticsEnabled", checked),
        )}
      </div>
      {mortgage && (
        <fieldset className="rounded border p-4 space-y-4">
          <legend className="px-1 text-sm font-medium">
            {l(
              "Տոկոսադրույք՝ ըստ գնի",
              "Interest rate by apartment price",
              "Ставка по стоимости квартиры",
            )}
          </legend>
          {check(
            l(
              "Միացնել գնի շեմով կանոնը",
              "Enable a price-threshold rule",
              "Включить правило порога цены",
            ),
            options.priceRateRule !== null,
            (checked) =>
              option(
                "priceRateRule",
                checked
                  ? {
                      currency: "AMD",
                      threshold: 35_000_000,
                      below: 12.75,
                      atOrAbove: 13.25,
                    }
                  : null,
              ),
          )}
          {options.priceRateRule && (
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm space-y-2">
                {l("Գնի արժույթ", "Price currency", "Валюта цены")}
                <select
                  className="block w-full rounded border bg-background p-2"
                  value={options.priceRateRule.currency}
                  onChange={(event) =>
                    option("priceRateRule", {
                      ...options.priceRateRule!,
                      currency: event.target.value as "AMD" | "USD",
                    })
                  }
                >
                  <option>AMD</option>
                  <option>USD</option>
                </select>
              </label>
              {numeric(
                l("Գնի շեմ", "Price threshold", "Порог цены"),
                options.priceRateRule.threshold,
                (next) =>
                  option("priceRateRule", {
                    ...options.priceRateRule!,
                    threshold: next,
                  }),
                1,
                1e12,
              )}
              {numeric(
                l(
                  "Շեմից ցածր տոկոսադրույք, %",
                  "Rate below threshold, %",
                  "Ставка ниже порога, %",
                ),
                options.priceRateRule.below,
                (next) =>
                  option("priceRateRule", {
                    ...options.priceRateRule!,
                    below: next,
                  }),
                0,
                100,
                0.01,
              )}
              {numeric(
                l(
                  "Շեմին հավասար կամ բարձր, %",
                  "Rate at or above threshold, %",
                  "Ставка от порога и выше, %",
                ),
                options.priceRateRule.atOrAbove,
                (next) =>
                  option("priceRateRule", {
                    ...options.priceRateRule!,
                    atOrAbove: next,
                  }),
                0,
                100,
                0.01,
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {l(
              "Բնակարանի կայքից փոխանցված բացահայտ տոկոսադրույքը գերակա է այս կանոնին։ Արժույթները չեն փոխարկվում։",
              "An explicit apartment rate supplied by your website takes precedence. Currencies are never converted.",
              "Явная ставка с сайта имеет приоритет над правилом. Конвертации валют нет.",
            )}
          </p>
        </fieldset>
      )}
      {mortgage && options.installmentControls && (
        <details>
          <summary className="cursor-pointer text-sm font-medium">
            {l(
              "Ապառիկի առանձին սահմաններ",
              "Separate developer-installment limits",
              "Отдельные лимиты рассрочки",
            )}
          </summary>
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            {numeric(
              l(
                "Նվազագույն ապառիկ կանխավճար, %",
                "Minimum installment down payment, %",
                "Минимальный взнос рассрочки, %",
              ),
              options.installmentControls.downPaymentPercent.min,
              (next) =>
                option("installmentControls", {
                  ...options.installmentControls!,
                  downPaymentPercent: {
                    ...options.installmentControls!.downPaymentPercent,
                    min: next,
                  },
                }),
              0,
              100,
              0.01,
            )}
            {numeric(
              l(
                "Առավելագույն ապառիկ կանխավճար, %",
                "Maximum installment down payment, %",
                "Максимальный взнос рассрочки, %",
              ),
              options.installmentControls.downPaymentPercent.max,
              (next) =>
                option("installmentControls", {
                  ...options.installmentControls!,
                  downPaymentPercent: {
                    ...options.installmentControls!.downPaymentPercent,
                    max: next,
                  },
                }),
              0,
              100,
              0.01,
            )}
            {numeric(
              l(
                "Ապառիկի նվազագույն ամիսներ",
                "Minimum installment months",
                "Минимум месяцев рассрочки",
              ),
              options.installmentControls.durationMonths.min,
              (next) =>
                option("installmentControls", {
                  ...options.installmentControls!,
                  durationMonths: {
                    ...options.installmentControls!.durationMonths,
                    min: next,
                  },
                }),
              1,
              600,
            )}
            {numeric(
              l(
                "Ապառիկի առավելագույն ամիսներ",
                "Maximum installment months",
                "Максимум месяцев рассрочки",
              ),
              options.installmentControls.durationMonths.max,
              (next) =>
                option("installmentControls", {
                  ...options.installmentControls!,
                  durationMonths: {
                    ...options.installmentControls!.durationMonths,
                    max: next,
                  },
                }),
              1,
              600,
            )}
          </div>
        </details>
      )}
      <p className="text-xs text-muted-foreground">
        {l(
          "Աշխատավարձերը, մուտքագրված գումարները և այլ էջերի գործողությունները չեն գրանցվում։ Հարկային կանոնները կառավարվում են Varkonline-ի կողմից։",
          "Salary values, typed amounts and activity elsewhere on your website are never recorded. Varkonline maintains the statutory tax rules.",
          "Зарплаты, введённые суммы и действия на других страницах не записываются. Налоговые правила поддерживает Varkonline.",
        )}
      </p>
    </div>
  );
}
