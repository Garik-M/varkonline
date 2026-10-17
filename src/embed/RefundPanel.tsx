import { useId, useMemo, useState } from "react";
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

function PayrollFields({
  value,
  onChange,
  title,
}: {
  value: PayrollForm;
  onChange: (value: PayrollForm) => void;
  title: string;
}) {
  const id = useId();
  const field = (
    key: keyof PayrollForm,
    label: string,
    options: [string, string][],
  ) => (
    <label>
      {label}
      <select
        value={String(value[key])}
        onChange={(event) => onChange({ ...value, [key]: event.target.value })}
      >
        <option value="">Չգիտեմ / չի ստուգվել</option>
        {options.map(([code, text]) => (
          <option key={code} value={code}>
            {text}
          </option>
        ))}
      </select>
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
        <label>
          Գրանցված ամսական համախառն եկամուտ, ֏
          <input
            id={`${id}-gross`}
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
        {field("employee", "Աշխատանքային պայմանագրով աշխատո՞ւմ եք", yesNo)}
        {field("owner", "Գույքի սեփականատե՞ր կամ համասեփականատեր եք", yesNo)}
        {field(
          "identity",
          "Պահանջվող անձը հաստատող / կացության փաստաթուղթ ունե՞ք",
          yesNo,
        )}
        {field("prior", "Նախկինում օգտվե՞լ եք այս վերադարձից", [
          ["none", "Ոչ"],
          ["same_mortgage", "Միայն այս հիփոթեքի համար"],
          ["other_post_2018_mortgage", "Մեկ այլ՝ 2018-ից հետո հիփոթեքի համար"],
          ["pre_2018_only", "Միայն մինչև 2018թ․ հիփոթեքի համար"],
        ])}
        {field(
          "tuition",
          "Նույն եռամսյակում ուսման վճարի հարկային վերադարձ կա՞",
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
    setTax(null);
    setError("");
  };
  const change = (value: PayrollForm, secondary = false) => {
    (secondary ? setCo : setBorrower)(value);
    invalidate();
  };
  function calculate(event: React.FormEvent) {
    event.preventDefault();
    invalidate();
    try {
      if (!propertyReady) {
        setTax(
          salaryEstimate(borrower, first.slice(0, 7)).selectedIncomeTaxAMD,
        );
        return;
      }
      if (!constant || !noSubsidy)
        throw new Error(
          "Հաստատեք կանխատեսման ենթադրությունները։ Սուբսիդավորված կամ փոփոխվող եկամտով դեպքը պահանջում է անհատական հաշվարկ։",
        );
      const dates = paymentDates(first, financing.schedule.length);
      const payroll = [
        payrollParticipant(borrower, dates, "borrower"),
        ...(includeCo ? [payrollParticipant(co, dates, "co_borrower")] : []),
      ];
      setTax(salaryEstimate(borrower, first.slice(0, 7)).selectedIncomeTaxAMD);
      setProjection(
        refundProjection(financing, configuration, first, loan, payroll),
      );
      setPage(0);
    } catch (cause) {
      setError(
        cause instanceof FinancingCalculationError
          ? "Ստուգեք ամսաթվերը, աշխատավարձը և պահված հարկը։ Առաջին վճարումը պետք է լինի վարկի տրամադրման կամ հաջորդ ամսում, պահված հարկը՝ եկամտից ոչ մեծ, այլ պահանջների հարկը՝ ընտրված հարկից ոչ մեծ։"
          : cause instanceof Error
            ? cause.message
            : "Ստուգեք մուտքագրված տվյալները։",
      );
    }
  }
  return (
    <section className="vk-refund" aria-label="Եկամտահարկի վերադարձ">
      <div className="vk-section-heading">
        <span className="vk-eyebrow">ԵԿԱՄՏԱՀԱՐԿԻ ՎԵՐԱԴԱՐՁ</span>
        <h2>Գնահատեք վերադարձի հնարավորությունը</h2>
      </div>
      <p className="vk-muted">
        Աշխատավարձը չի պահպանվում և չի փոխանցվում գործընկերոջը։ Վերադարձը
        կատարվում է առանձին՝ եռամսյակային կարգով, ՊԵԿ-ի հաստատման դեպքում։
      </p>
      {financing.currency === "USD" && (
        <p className="vk-warning">
          USD հիփոթեքի համար անհրաժեշտ են բանկի տրամադրած դրամային վճարներն ու
          տոկոսները յուրաքանչյուր ամսվա համար։ Այստեղ փոխարժեք չի ենթադրվում․
          վերադարձի գումարը կմնա չորոշված։
        </p>
      )}
      {!propertyReady && (
        <div className="vk-warning" data-testid="refund-result">
          <h3>
            {legal?.status === "ineligible"
              ? "Վերադարձը կիրառելի չէ ըստ տրամադրված տվյալների"
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
              Վերադարձի գումար չի ենթադրվում։ Դիմեք կառուցապատողին կամ ՊԵԿ-ին
              փաստաթղթերի ստուգման համար։ Արդյունավետ ամսական ծախս՝{" "}
              <strong data-testid="effective-cost">Չորոշված</strong>։ Այստեղ
              կարող եք առանձին գնահատել ձեր եկամտային հարկը։
            </p>
          )}
        </div>
      )}
      {legal?.status !== "ineligible" && (
        <form onSubmit={calculate} onChange={invalidate}>
          <div className="vk-grid">
            <label>
              Հիփոթեքի տրամադրման ամսաթիվ
              <input
                type="date"
                required={propertyReady}
                value={loan}
                readOnly={
                  configuration.refund.loanOriginationDate?.verified === true
                }
                onChange={(e) => setLoan(e.target.value)}
              />
              <small>
                {configuration.refund.loanOriginationDate?.verified
                  ? "Փաստաթղթով ստուգված ամսաթիվ"
                  : "Չստուգված ամսաթիվը կպահանջի հաստատում"}
              </small>
            </label>
            <label>
              Առաջին ամսական վճարման ամսաթիվ
              <input
                type="date"
                required
                value={first}
                onChange={(e) => setFirst(e.target.value)}
              />
            </label>
          </div>
          {!propertyReady && (
            <div className="vk-grid" style={{ marginTop: 18 }}>
              <label>
                Գրանցված ամսական համախառն եկամուտ, ֏
                <input
                  inputMode="numeric"
                  required
                  value={borrower.gross}
                  onChange={(e) =>
                    change({ ...borrower, gross: e.target.value })
                  }
                  autoComplete="off"
                />
              </label>
              <label>
                Փաստացի պահված եկամտային հարկ, ֏
                <input
                  inputMode="numeric"
                  value={borrower.withheld}
                  onChange={(e) =>
                    change({ ...borrower, withheld: e.target.value })
                  }
                  placeholder="Ըստ ցանկության"
                  autoComplete="off"
                />
              </label>
            </div>
          )}
          {propertyReady && (
            <>
              <PayrollFields
                value={borrower}
                onChange={change}
                title="Վարկառու"
              />
              <label className="vk-check">
                <input
                  type="checkbox"
                  checked={includeCo}
                  onChange={(e) => setIncludeCo(e.target.checked)}
                />
                Ներառել մեկ համավարկառուի եկամուտը
              </label>
              {includeCo && (
                <PayrollFields
                  value={co}
                  onChange={(value) => change(value, true)}
                  title="Համավարկառու"
                />
              )}
              <label className="vk-check">
                <input
                  type="checkbox"
                  checked={noSubsidy}
                  onChange={(e) => setNoSubsidy(e.target.checked)}
                />
                Տոկոսների սուբսիդավորում չկա․ բոլոր վճարների համար այն 0 է։
              </label>
              <label className="vk-check">
                <input
                  type="checkbox"
                  checked={constant}
                  onChange={(e) => setConstant(e.target.checked)}
                />
                Սա կանխատեսում է․ նշված ամսական եկամուտը, հարկն ու պատասխանները
                հաստատուն են ամբողջ ժամանակահատվածում, ներառյալ առաջին և վերջին
                ամբողջ օրացուցային եռամսյակները։ Վճարման օրը կրկնվում է ամսական՝
                ամսավերջին սահմանափակմամբ։
              </label>
            </>
          )}
          <button className="vk-button" type="submit">
            {propertyReady
              ? "Հաշվել վերադարձի կանխատեսումը"
              : "Հաշվել եկամտային հարկը"}
          </button>
        </form>
      )}
      {error && (
        <p className="vk-warning" role="alert">
          Մուտքային տվյալների սխալ․ {error}
        </p>
      )}
      {tax !== null && (
        <p className="vk-tax" data-testid="salary-tax">
          Ընտրված ամսական եկամտային հարկ՝ <strong>{money(tax)}</strong>
        </p>
      )}
      {projection && (
        <div
          className="vk-refund-result"
          aria-live="polite"
          data-testid="refund-result"
        >
          <h3>
            {projection.eligibility.status === "eligible"
              ? "Պայմանները բավարարված են ըստ տրամադրված տվյալների"
              : projection.eligibility.status === "ineligible"
                ? "Վերադարձը կիրառելի չէ ըստ տրամադրված տվյալների"
                : "Անհրաժեշտ է տվյալների լրացուցիչ ստուգում"}
          </h3>
          {projection.eligibility.status === "requires_verification" && (
            <p>
              Վերադարձի և արդյունավետ ծախսի գումար չի ենթադրվում։ Գույքի, վարկի
              կամ ձեր փաստաթղթերի ստուգումը դեռ ավարտված չէ։ Դիմեք
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
              <span>Վերադարձից հետո միջին ամսական ծախս</span>
              <strong data-testid="effective-cost">
                {projection.effectiveAverageMonthlyFinancingCostAMD === null
                  ? "Չորոշված"
                  : money(projection.effectiveAverageMonthlyFinancingCostAMD)}
              </strong>
            </div>
          </div>
          <p className="vk-muted">
            Միջին ծախսը տեղեկատվական համարժեք է․ այն չի փոխում բանկին վճարվող
            գումարը և չի ներառում կանխավճարը։ Վերադարձը երաշխավորված չէ։
          </p>
          <details>
            <summary>Եռամսյակային վերադարձի գրաֆիկ</summary>
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
              Ընդհանուր կանխատեսված վերադարձ՝{" "}
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
