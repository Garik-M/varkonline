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
  type PayrollForm,
} from "./refund-model";
import { refundMessages } from "./refund-messages";
import { money } from "./format";

type PayrollFieldsProps = {
  value: PayrollForm;
  onChange: (value: PayrollForm) => void;
  title: string;
};

function SalaryFields({ value, onChange, title }: PayrollFieldsProps) {
  const id = useId();
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className="vk-grid">
        <label>
          Գրանցված ամսական համախառն աշխատավարձ, ֏
          <small id={`${id}-gross-help`}>
            Աշխատավարձը՝ մինչև հարկերի և այլ պահումների նվազեցումը։
          </small>
          <input
            id={`${id}-gross`}
            aria-label="Գրանցված ամսական համախառն աշխատավարձ, ֏"
            aria-describedby={`${id}-gross-help`}
            inputMode="numeric"
            value={value.gross}
            required
            onChange={(e) => onChange({ ...value, gross: e.target.value })}
            placeholder="Օրինակ՝ 500000"
            autoComplete="off"
          />
        </label>
        <label>
          Փաստացի պահված եկամտային հարկ, ֏{" "}
          <small>Ըստ ցանկության․ հատուկ հարկային ռեժիմի դեպքում լրացրեք</small>
          <input
            inputMode="numeric"
            value={value.withheld}
            onChange={(e) => onChange({ ...value, withheld: e.target.value })}
            placeholder="Դատարկ՝ օրենքի ստանդարտ դրույք"
            autoComplete="off"
          />
        </label>
      </div>
    </fieldset>
  );
}

function EligibilityFields({ value, onChange, title }: PayrollFieldsProps) {
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
            documentsChecked: [
              "employee",
              "owner",
              "identity",
              "prior",
            ].includes(key)
              ? false
              : value.documentsChecked,
          })
        }
      >
        <option value="">Չգիտեմ / չի ստուգվել</option>
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
    ["yes", "Այո"],
    ["no", "Ոչ"],
  ];
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className="vk-grid">
        {field("employee", "Աշխատանքային պայմանագրով աշխատո՞ւմ եք", yesNo)}
        {field(
          "owner",
          "Գույքի սեփականատե՞ր կամ համասեփականատեր եք",
          yesNo,
          "Եթե գնումը դեռ նախատեսվում է կամ գրանցված է կառուցվող գույքը գնելու իրավունք, ընտրեք «Չգիտեմ / չի ստուգվել»․ այդ դեպքը պահանջում է առանձին ստուգում։",
        )}
        {field(
          "identity",
          "Պահանջվող անձը հաստատող / կացության փաստաթուղթ ունե՞ք",
          yesNo,
        )}
        {field("prior", "Նախկինում օգտվե՞լ եք այս հետվերադարձից", [
          ["none", "Ոչ"],
          ["same_mortgage", "Միայն այս հիփոթեքի համար"],
          ["other_post_2018_mortgage", "Մեկ այլ՝ 2018-ից հետո հիփոթեքի համար"],
          ["pre_2018_only", "Միայն մինչև 2018թ․ հիփոթեքի համար"],
        ])}
        {field(
          "tuition",
          "Նույն եռամսյակում ուսման վճարի հարկային հետվերադարձ կա՞",
          yesNo,
        )}
        <label>
          Այլ պահանջների համար օգտագործված ամսական հարկ, ֏
          <input
            inputMode="numeric"
            value={value.allocation}
            onChange={(e) => onChange({ ...value, allocation: e.target.value })}
            placeholder="Չկա՝ մուտքագրեք 0"
            autoComplete="off"
          />
        </label>
        {field("settlement", "Գործատուի եկամտային հարկի վճարում", [
          ["projected", "Կանխատեսում՝ ենթադրում եմ ամբողջական վճարում"],
          ["unpaid", "Չի վճարվել ամբողջությամբ"],
        ])}
      </div>
      <label className="vk-check">
        <input
          type="checkbox"
          checked={value.documentsChecked}
          onChange={(e) =>
            onChange({ ...value, documentsChecked: e.target.checked })
          }
        />
        Աշխատանքի, սեփականության, անձնական փաստաթղթերի և նախկին օգտվելու իմ
        պատասխանները ստուգել եմ փաստաթղթերով։
      </label>
    </fieldset>
  );
}

export default function RefundPanel({
  financing,
  configuration,
}: {
  financing: FinancingResult;
  configuration: ResolvedWidget;
}) {
  const id = useId();
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
  const [tax, setTax] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [step, setStep] = useState<1 | 2>(1);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const legal = useMemo(() => {
    if (!loan) return null;
    try {
      return evaluateMortgageRefundEligibility(
        {
          financing,
          loanOriginationDate: loan,
          originationDateVerified:
            configuration.refund.loanOriginationDate?.verified === true &&
            configuration.refund.loanOriginationDate.value === loan,
          eligibility: configuration.refund.facts,
        },
        ARMENIA_REFUND_RULES_2026_10,
      );
    } catch {
      return null;
    }
  }, [financing, configuration, loan]);
  const propertyReady = legal?.status === "eligible";
  const invalidate = () => {
    setProjection(null);
    setError("");
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
        ? "Ստուգեք ամսաթվերը, աշխատավարձը և պահված հարկը։ Առաջին վճարումը պետք է լինի վարկի տրամադրման կամ հաջորդ ամսում, պահված հարկը՝ աշխատավարձից ոչ մեծ, այլ պահանջների հարկը՝ ընտրված հարկից ոչ մեծ։"
        : cause instanceof Error
          ? cause.message
          : "Ստուգեք մուտքագրված տվյալները։",
    );
  }
  function selectedSalaryTax() {
    const month = first.slice(0, 7);
    const primary = salaryEstimate(borrower, month).selectedIncomeTaxAMD;
    const secondary = includeCo
      ? salaryEstimate(co, month).selectedIncomeTaxAMD
      : 0;
    if (primary === null || secondary === null)
      throw new Error(
        "Ընտրված ժամանակահատվածի համար մուտքագրեք փաստացի պահված եկամտային հարկը․ ստանդարտ դրույքը հաստատված չէ։",
      );
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
      if (!propertyReady)
        throw new Error("Գույքի և վարկի տվյալները նախ պետք է ստուգվեն։");
      if (!constant || !noSubsidy)
        throw new Error(
          "Հաստատեք կանխատեսման ենթադրությունները։ Սուբսիդավորված կամ փոփոխվող աշխատավարձով դեպքը պահանջում է անհատական հաշվարկ։",
        );
      const dates = paymentDates(first, financing.schedule.length);
      const payroll = [
        payrollParticipant(borrower, dates, "borrower"),
        ...(includeCo ? [payrollParticipant(co, dates, "co_borrower")] : []),
      ];
      setTax(selectedSalaryTax());
      setProjection(
        refundProjection(financing, configuration, first, loan, payroll),
      );
      setPage(0);
    } catch (cause) {
      showError(cause);
    }
  }
  const propertyNotice = !propertyReady ? (
    <div className="vk-warning" data-testid="refund-result">
      <h3>
        {legal?.status === "ineligible"
          ? "Հետվերադարձը կիրառելի չէ ըստ տրամադրված տվյալների"
          : "Անհրաժեշտ է տվյալների լրացուցիչ ստուգում"}
      </h3>
      <p>
        Բանկի ամսական վճարը՝{" "}
        <strong>
          {money(financing.regularMonthlyPayment, financing.currency)}
        </strong>
        ։
      </p>
      <ul>
        {(legal
          ? refundMessages(legal.reasons)
          : ["Վարկի և գույքի փաստաթղթերը դեռ չեն ստուգվել։"]
        ).map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
      {legal?.status !== "ineligible" && (
        <p>
          Հետվերադարձի գումար չի ենթադրվում։ Դիմեք կառուցապատողին կամ ՊԵԿ-ին
          փաստաթղթերի ստուգման համար։ Արդյունավետ ամսական ծախս՝{" "}
          <strong data-testid="effective-cost">Չորոշված</strong>։ Այստեղ կարող
          եք առանձին գնահատել ձեր եկամտային հարկը։
        </p>
      )}
    </div>
  ) : null;
  return (
    <section className="vk-refund" aria-label="Եկամտահարկի հետվերադարձ">
      <div className="vk-section-heading">
        <span className="vk-eyebrow">ԵԿԱՄՏԱՀԱՐԿԻ ՀԵՏՎԵՐԱԴԱՐՁ</span>
        <h2>Գնահատեք հետվերադարձի հնարավորությունը</h2>
      </div>
      <p className="vk-muted">
        Աշխատավարձը չի պահպանվում և չի փոխանցվում գործընկերոջը։ Հետվերադարձը
        կատարվում է առանձին՝ եռամսյակային կարգով, ՊԵԿ-ի հաստատման դեպքում։
      </p>
      {step === 2 && financing.currency === "USD" && (
        <p className="vk-warning">
          USD հիփոթեքի համար անհրաժեշտ են բանկի տրամադրած դրամային վճարներն ու
          տոկոսները յուրաքանչյուր ամսվա համար։ Այստեղ փոխարժեք չի ենթադրվում․
          հետվերադարձի գումարը կմնա չորոշված։
        </p>
      )}
      {legal?.status === "ineligible" && propertyNotice}
      {legal?.status !== "ineligible" && (
        <>
          <ol
            className="vk-refund-steps"
            aria-label="Հետվերադարձի հաշվարկի քայլեր"
          >
            <li aria-current={step === 1 ? "step" : undefined}>
              1. Աշխատավարձ և վճարումներ
            </li>
            <li aria-current={step === 2 ? "step" : undefined}>
              2. Հետվերադարձի պայմաններ
            </li>
          </ol>
          <form onSubmit={step === 1 ? next : calculate} onChange={invalidate}>
            {step === 1 ? (
              <div className="vk-refund-step" data-testid="refund-step-income">
                <h3 ref={heading} tabIndex={-1} id={`${id}-step-heading`}>
                  Աշխատավարձ և վճարումներ
                </h3>
                <p className="vk-muted">
                  Մուտքագրեք աշխատավարձը՝ ամսական եկամտային հարկը գնահատելու
                  համար։ Հետվերադարձի պայմանները կստուգվեն հաջորդ քայլում։
                </p>
                <label>
                  Առաջին ամսական վճարման ամսաթիվ
                  <input
                    aria-label="Առաջին ամսական վճարման ամսաթիվ"
                    type="date"
                    required
                    value={first}
                    onChange={(event) => {
                      setFirst(event.target.value);
                      setTax(null);
                    }}
                  />
                  <small>
                    Կանխատեսման համար ընտրեք պլանավորվող առաջին վճարման օրը։ Այն
                    չի հաստատում վարկի տրամադրման ամսաթիվը։
                  </small>
                </label>
                <SalaryFields
                  value={borrower}
                  onChange={change}
                  title="Վարկառուի աշխատավարձը"
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
                  Ներառել մեկ համավարկառուի եկամուտը
                </label>
                {includeCo && (
                  <SalaryFields
                    value={co}
                    onChange={(value) => change(value, true)}
                    title="Համավարկառուի աշխատավարձը"
                  />
                )}
                <button className="vk-button" type="submit">
                  Շարունակել՝ ստուգել պայմանները
                </button>
              </div>
            ) : (
              <div
                className="vk-refund-step"
                data-testid="refund-step-eligibility"
              >
                <h3 ref={heading} tabIndex={-1} id={`${id}-step-heading`}>
                  Հետվերադարձի պայմաններ
                </h3>
                <p className="vk-muted">
                  Պատասխանեք ըստ հաստատված տվյալների։ Չստուգված պայմանների համար
                  ընտրեք «Չգիտեմ / չի ստուգվել»։ Սա կանխատեսում է, ոչ ՊԵԿ-ին
                  ներկայացվող դիմում։
                </p>
                {propertyNotice}
                <label>
                  Հիփոթեքի տրամադրման ամսաթիվ
                  <input
                    type="date"
                    required={propertyReady}
                    value={loan}
                    readOnly={
                      configuration.refund.loanOriginationDate?.verified ===
                      true
                    }
                    onChange={(event) => setLoan(event.target.value)}
                  />
                  <small>
                    {configuration.refund.loanOriginationDate?.verified
                      ? "Փաստաթղթով ստուգված ամսաթիվ"
                      : "Չստուգված ամսաթիվը կպահանջի հաստատում"}
                  </small>
                </label>
                {propertyReady && (
                  <>
                    <EligibilityFields
                      value={borrower}
                      onChange={change}
                      title="Վարկառուի պայմանները"
                    />
                    {includeCo && (
                      <EligibilityFields
                        value={co}
                        onChange={(value) => change(value, true)}
                        title="Համավարկառուի պայմանները"
                      />
                    )}
                    <label className="vk-check">
                      <input
                        type="checkbox"
                        checked={noSubsidy}
                        onChange={(event) => setNoSubsidy(event.target.checked)}
                      />
                      Տոկոսների սուբսիդավորում չկա․ բոլոր վճարների համար այն 0
                      է։
                    </label>
                    <label className="vk-check">
                      <input
                        type="checkbox"
                        checked={constant}
                        onChange={(event) => setConstant(event.target.checked)}
                      />
                      Սա կանխատեսում է․ նշված ամսական աշխատավարձը, հարկն ու
                      պատասխանները հաստատուն են ամբողջ ժամանակահատվածում,
                      ներառյալ առաջին և վերջին ամբողջ օրացուցային եռամսյակները։
                      Վճարման օրը կրկնվում է ամսական՝ ամսավերջին սահմանափակմամբ։
                    </label>
                  </>
                )}
                <div className="vk-refund-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                  >
                    Նախորդ քայլ
                  </button>
                  {propertyReady && (
                    <button className="vk-button" type="submit">
                      Հաշվել հետվերադարձի կանխատեսումը
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </>
      )}
      {error && (
        <p className="vk-warning" role="alert">
          Մուտքային տվյալների սխալ․ {error}
        </p>
      )}
      {tax !== null && (
        <p className="vk-tax" data-testid="salary-tax">
          {includeCo
            ? "Երկու անձանց ամսական եկամտային հարկ՝ "
            : "Ընտրված ամսական եկամտային հարկ՝ "}{" "}
          <strong>{money(tax)}</strong>
        </p>
      )}
      {step === 2 && projection && (
        <div
          className="vk-refund-result"
          aria-live="polite"
          data-testid="refund-result"
        >
          <h3>
            {projection.eligibility.status === "eligible"
              ? "Պայմանները բավարարված են ըստ տրամադրված տվյալների"
              : projection.eligibility.status === "ineligible"
                ? "Հետվերադարձը կիրառելի չէ ըստ տրամադրված տվյալների"
                : "Անհրաժեշտ է տվյալների լրացուցիչ ստուգում"}
          </h3>
          {projection.eligibility.status === "requires_verification" && (
            <p>
              Հետվերադարձի և արդյունավետ ծախսի գումար չի ենթադրվում։ Գույքի,
              վարկի կամ ձեր փաստաթղթերի ստուգումը դեռ ավարտված չէ։ Դիմեք
              կառուցապատողին կամ ՊԵԿ-ին։
            </p>
          )}
          <ul>
            {refundMessages(projection.eligibility.reasons).map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <div className="vk-grid vk-refund-metrics">
            <div>
              <span>Բանկի ամսական վճար</span>
              <strong>
                {money(
                  projection.originalRegularMonthlyBankPayment,
                  financing.currency,
                )}
              </strong>
            </div>
            <div>
              <span>Հետվերադարձից հետո միջին ամսական ծախս</span>
              <strong data-testid="effective-cost">
                {projection.effectiveAverageMonthlyFinancingCostAMD === null
                  ? "Չորոշված"
                  : money(projection.effectiveAverageMonthlyFinancingCostAMD)}
              </strong>
            </div>
          </div>
          <p className="vk-muted">
            Միջին ծախսը տեղեկատվական համարժեք է․ այն չի փոխում բանկին վճարվող
            գումարը և չի ներառում կանխավճարը։ Հետվերադարձը երաշխավորված չէ։
          </p>
          <details>
            <summary>Եռամսյակային հետվերադարձի գրաֆիկ</summary>
            <div className="vk-quarter-list">
              {projection.quarterlySchedule
                .slice(page * 8, page * 8 + 8)
                .map((q) => (
                  <div key={`${q.year}-${q.quarter}`}>
                    <span>
                      {q.year} · {q.quarter}-րդ եռամսյակ
                    </span>
                    <strong>
                      {q.estimatedRefundAMD === null
                        ? "Ստուգում է պահանջվում"
                        : money(q.estimatedRefundAMD)}
                    </strong>
                    <small>
                      Տոկոս՝{" "}
                      {q.interestUsedAMD === null
                        ? "Չորոշված"
                        : money(q.interestUsedAMD)}{" "}
                      · Հարկ՝{" "}
                      {q.eligibleIncomeTaxAMD === null
                        ? "Չորոշված"
                        : money(q.eligibleIncomeTaxAMD)}{" "}
                      · Սահմանաչափ՝{" "}
                      {q.quarterlyRefundCapAMD === null
                        ? "Չորոշված"
                        : money(q.quarterlyRefundCapAMD)}
                    </small>
                  </div>
                ))}
            </div>
            <div className="vk-pagination">
              <button disabled={!page} onClick={() => setPage(page - 1)}>
                Նախորդ
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
                Հաջորդ
              </button>
            </div>
          </details>
          <p>
            <strong>
              Ընդհանուր կանխատեսված հետվերադարձ՝{" "}
              {projection.totalEstimatedRefundAMD === null
                ? "Չորոշված"
                : money(projection.totalEstimatedRefundAMD)}
            </strong>
          </p>
        </div>
      )}
      <p className="vk-fine">
        Իրավական տարբերակ՝ {ARMENIA_REFUND_RULES_2026_10.version}։ Ապագա
        օրենքների, եկամուտների և տոկոսների փոփոխություններ չեն կանխատեսվում։{" "}
        <a
          href="https://www.arlis.am/hy/acts/230455"
          target="_blank"
          rel="noreferrer"
        >
          ՀՀ հարկային օրենսգիրք, հոդված 160
        </a>
        ։
      </p>
    </section>
  );
}
