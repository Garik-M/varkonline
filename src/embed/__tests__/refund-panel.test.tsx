import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import RefundPanel from "../RefundPanel";
import { calculateFinancing } from "@/lib/financing";
import { sample } from "@/lib/financing/income-tax-refund/__tests__/fixtures";
import type { ResolvedWidget } from "../types";
import FinancingCalculator from "../FinancingCalculator";
import { translate, widgetMessages, type WidgetLanguage } from "../messages";

afterEach(cleanup);
const nextLabel = "Շարունակել՝ ստուգել պայմանները";
const selectedTax = () =>
  Number(
    screen
      .getByTestId("salary-tax")
      .querySelector("strong")
      ?.textContent?.replace(/[^\d]/g, "") ?? NaN,
  );
function fixture(
  unreviewed = false,
  price = 35000000,
  durationMonths = 3,
  annualInterestRatePercent = 9,
) {
  const input = {
    financingType: "mortgage",
    currency: "AMD",
    apartmentPrice: price,
    annualInterestRatePercent,
    downPaymentPercent: 20,
    durationMonths,
  } as const;
  const financing = calculateFinancing(input);
  const facts = sample({ financing }).eligibility;
  const configuration: ResolvedWidget = {
    partner: {
      slug: "test-partner",
      displayName: "Synthetic fixture",
      revision: 1,
    },
    apartmentId: "A-101",
    financing: input,
    controls: {
      downPaymentPercent: true,
      durationMonths: true,
      limits: {
        apartmentPrice: { min: 1, max: 1e12 },
        annualInterestRatePercent: { min: 0, max: 100 },
        downPaymentPercent: { min: 0, max: 100, step: 1 },
        durationMonths: { min: 1, max: 600, step: 1 },
        supportedDurations: [],
      },
    },
    appearance: { theme: "light", accentColor: "#29986c", logoUrl: null },
    estimateNotice: "Synthetic estimate",
    refund: {
      enabled: true,
      facts,
      developmentName: null,
      configurationUpdatedAt: "2026-10-19T00:00:00Z",
      loanOriginationDate: unreviewed
        ? null
        : { value: "2026-01-01", verified: true },
      firstPaymentDate: null,
      noInterestSubsidy: { value: true, verified: true },
    },
  };
  return { financing, configuration };
}
function amount(label: string | RegExp, value: string, root = screen) {
  fireEvent.change(root.getByLabelText(label), { target: { value } });
}
function firstStep(gross = "500000", date = "2026-01-31") {
  amount("Առաջին ամսական վճարման ամսաթիվ", date);
  amount("Գրանցված ամսական համախառն աշխատավարձ, ֏", gross);
}
describe("two-step borrower refund form", () => {
  it("starts with arithmetic inputs and leaves an unreviewed refund unresolved in step two", () => {
    render(<RefundPanel {...fixture(true)} />);
    expect(screen.getByTestId("refund-step-income")).toBeVisible();
    expect(
      screen.queryByLabelText(/Աշխատանքային պայմանագրով/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Հիփոթեքի տրամադրման ամսաթիվ/),
    ).not.toBeInTheDocument();
    firstStep();
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    expect(screen.getByTestId("refund-step-eligibility")).toBeVisible();
    expect(selectedTax()).toBe(100000);
    expect(screen.getByTestId("effective-cost")).toHaveTextContent("Չորոշված");
    expect(
      screen.queryByLabelText(/Աշխատանքային պայմանագրով/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Հաշվել հետվերադարձի կանխատեսումը",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Հետվերադարձի պայմաններ",
        exact: true,
      }),
    ).toHaveFocus();
  });
  it("preserves salary inputs on back navigation and honors zero actual tax for an optional co-borrower", () => {
    render(<RefundPanel {...fixture()} />);
    firstStep();
    fireEvent.click(
      screen.getByLabelText("Ներառել մեկ համավարկառուի եկամուտը"),
    );
    const co = within(
      screen.getByRole("group", { name: "Համավարկառուի աշխատավարձը" }),
    );
    fireEvent.change(
      co.getByLabelText("Գրանցված ամսական համախառն աշխատավարձ, ֏"),
      { target: { value: "250000" } },
    );
    fireEvent.change(co.getByLabelText(/Փաստացի պահված եկամտային հարկ/), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    expect(selectedTax()).toBe(100000);
    expect(
      screen.getByRole("group", { name: "Համավարկառուի պայմանները" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Նախորդ քայլ" }));
    const restoredCo = within(
      screen.getByRole("group", { name: "Համավարկառուի աշխատավարձը" }),
    );
    expect(
      restoredCo.getByLabelText("Գրանցված ամսական համախառն աշխատավարձ, ֏"),
    ).toHaveValue("250000");
    fireEvent.change(
      restoredCo.getByLabelText(/Փաստացի պահված եկամտային հարկ/),
      { target: { value: "" } },
    );
    expect(screen.queryByTestId("salary-tax")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    expect(selectedTax()).toBe(150000);
  });
  it("requires renewed personal document confirmation after changing a confirmed answer", () => {
    render(<RefundPanel {...fixture()} />);
    firstStep();
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    const documents = screen.getByLabelText(/Աշխատանքի, սեփականության/);
    fireEvent.click(documents);
    expect(documents).toBeChecked();
    fireEvent.change(screen.getByLabelText(/Նախկինում օգտվե՞լ/), {
      target: { value: "none" },
    });
    expect(documents).not.toBeChecked();
    expect(selectedTax()).toBe(100000);
  });
  it("keeps unsupported historical salary tax unresolved until an actual amount is supplied", () => {
    render(<RefundPanel {...fixture(true)} />);
    firstStep("500000", "2019-01-31");
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "ստանդարտ դրույքը հաստատված չէ",
    );
    expect(screen.getByTestId("refund-step-income")).toBeVisible();
    amount(/Փաստացի պահված եկամտային հարկ/, "0");
    fireEvent.click(screen.getByRole("button", { name: nextLabel }));
    expect(screen.getByTestId("salary-tax")).toHaveTextContent("0 ֏");
    expect(screen.getByTestId("effective-cost")).toHaveTextContent("Չորոշված");
  });
  it("preflights a known property exclusion before requesting salary", () => {
    render(<RefundPanel {...fixture(false, 58000000)} />);
    expect(screen.getByTestId("refund-result")).toHaveTextContent(
      "Հետվերադարձը կիրառելի չէ",
    );
    expect(
      screen.queryByLabelText("Գրանցված ամսական համախառն աշխատավարձ, ֏"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: nextLabel }),
    ).not.toBeInTheDocument();
  });
});

describe("compact multilingual widget and total refund", () => {
  const languages = ["hy", "en", "ru"] as const;
  const numeric = (text: string | null) => Number(text?.replace(/[^\d]/g, ""));
  function setup(
    language: WidgetLanguage,
    unreviewed = false,
    months = 3,
    gross = "500000",
    price = 35000000,
    rate = 9,
  ) {
    const { configuration } = fixture(unreviewed, price, months, rate);
    render(
      <FinancingCalculator
        configuration={configuration}
        initialLanguage={language}
        notify={() => {}}
      />,
    );
    const t = (key: keyof typeof widgetMessages) => translate(language, key);
    fireEvent.click(screen.getByRole("button", { name: t("openRefund") }));
    amount(t("firstPayment"), "2026-01-31");
    amount(t("gross"), gross);
    fireEvent.click(screen.getByRole("button", { name: t("continue") }));
    return t;
  }
  it.each([
    ["50000", 60000],
    ["0", 0],
  ] as const)("shows a full six-month total for salary %s", (gross, total) => {
    const t = setup("en", false, 6, gross);
    for (const key of ["employee", "owner", "identity"] as const)
      amount(t(key), "yes");
    amount(t("prior"), "none");
    amount(t("tuition"), "no");
    amount(t("allocation"), "0");
    amount(t("settlement"), "projected");
    for (const key of ["documentsChecked", "constantForecast"] as const)
      fireEvent.click(screen.getByLabelText(t(key)));
    fireEvent.click(screen.getByRole("button", { name: t("calculateRefund") }));
    // At 50000 AMD gross, tax = 10000/month. Each quarter has sufficient interest,
    // so two full quarters return 2 * (3 * 10000), not just one quarter's 30000.
    expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(total);
    expect(numeric(screen.getByTestId("monthly-refund").textContent)).toBe(
      total / 6,
    );
    expect(
      screen.getByText(translate("en", "refundPeriod", { months: 6 })),
    ).toBeVisible();
  });
  it("uses an approximate sign when the final installment and averaging do not equal the regular payment subtraction", () => {
    const t = setup("en", false, 3, "500000", 1251, 12);
    for (const key of ["employee", "owner", "identity"] as const)
      amount(t(key), "yes");
    amount(t("prior"), "none");
    amount(t("tuition"), "no");
    amount(t("allocation"), "0");
    amount(t("settlement"), "projected");
    for (const key of ["documentsChecked", "constantForecast"] as const)
      fireEvent.click(screen.getByLabelText(t(key)));
    fireEvent.click(screen.getByRole("button", { name: t("calculateRefund") }));
    // 1251 - round(20%) = 1001 principal. Interest 10 + 7 + 3 = 20.
    // Payments: 340, 340, 341. Refund/month rounds 20/3 to 7;
    // exact net cost/month rounds 1001/3 to 334, rather than 340-7=333.
    expect(numeric(screen.getByTestId("monthly-payment").textContent)).toBe(
      340,
    );
    expect(numeric(screen.getByTestId("monthly-refund").textContent)).toBe(7);
    expect(numeric(screen.getByTestId("monthly-net-payment").textContent)).toBe(
      334,
    );
    expect(screen.getByTestId("payment-breakdown")).toHaveTextContent("≈");
    amount(t("down"), "30");
    expect(screen.queryByTestId("payment-breakdown")).not.toBeInTheDocument();
  });
  it.each(languages)(
    "shows the independent 300000 AMD full-term refund reference in %s",
    (language) => {
      const t = setup(language);
      for (const key of ["employee", "owner", "identity"] as const)
        amount(t(key), "yes");
      amount(t("prior"), "none");
      amount(t("tuition"), "no");
      amount(t("allocation"), "0");
      amount(t("settlement"), "projected");
      for (const key of [
        "documentsChecked",
        "noSubsidy",
        "constantForecast",
      ] as const) {
        const checkbox = screen.getByLabelText(t(key)) as HTMLInputElement;
        if (!checkbox.checked) fireEvent.click(checkbox);
      }
      fireEvent.click(
        screen.getByRole("button", { name: t("calculateRefund") }),
      );
      expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(
        300000,
      );
      expect(numeric(screen.getByTestId("effective-cost").textContent)).toBe(
        9373682,
      );
      expect(numeric(screen.getByTestId("monthly-payment").textContent)).toBe(
        9473682,
      );
      expect(numeric(screen.getByTestId("monthly-refund").textContent)).toBe(
        100000,
      );
      expect(
        numeric(screen.getByTestId("monthly-net-payment").textContent),
      ).toBe(9373682);
      expect(screen.getByTestId("payment-breakdown")).toHaveTextContent("=");
      fireEvent.click(screen.getByRole("button", { name: t("closeRefund") }));
      expect(screen.getByTestId("payment-breakdown")).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: t("openRefund") }));
      expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(
        300000,
      );
      expect(
        screen.getByText(translate(language, "refundPeriod", { months: 3 })),
      ).toBeVisible();
      // Changing only the language must preserve inputs, evidence assertions and calculated totals.
      fireEvent.change(screen.getByRole("combobox", { name: t("language") }), {
        target: { value: "en" },
      });
      expect(
        screen.getByRole("region", { name: "Income tax refund" }),
      ).toBeVisible();
      expect(numeric(screen.getByTestId("total-refund").textContent)).toBe(
        300000,
      );
      fireEvent.click(screen.getByText("Edit salary or conditions"));
      fireEvent.click(screen.getByRole("button", { name: "Previous step" }));
      expect(
        screen.getByLabelText("Registered gross monthly salary, ֏"),
      ).toHaveValue("500000");
      amount("Registered gross monthly salary, ֏", "600000");
      expect(screen.queryByTestId("total-refund")).not.toBeInTheDocument();
      expect(screen.queryByTestId("payment-breakdown")).not.toBeInTheDocument();
    },
  );
  it.each(languages)(
    "keeps unreviewed totals unresolved and localizes validation in %s",
    (language) => {
      const t = setup(language, true);
      expect(screen.getByTestId("total-refund")).toHaveTextContent(
        t("unresolved"),
      );
      expect(screen.queryByTestId("payment-breakdown")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: t("calculateRefund") }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: t("back") }));
      amount(t("gross"), "-1");
      fireEvent.click(screen.getByRole("button", { name: t("continue") }));
      expect(screen.getByRole("alert")).toHaveTextContent(t("amountError"));
    },
  );
  it("has nonempty translations for every key and no Armenian fallback in English or Russian", () => {
    for (const entry of Object.values(widgetMessages)) {
      for (const language of languages)
        expect(entry[language].length).toBeGreaterThan(0);
      expect(entry.en).not.toMatch(/[Ա-Ֆա-ֆ]/);
      expect(entry.ru).not.toMatch(/[Ա-Ֆա-ֆ]/);
    }
  });
});
