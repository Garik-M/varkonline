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

afterEach(cleanup);
const nextLabel = "Շարունակել՝ ստուգել պայմանները";
const selectedTax = () =>
  Number(
    screen
      .getByTestId("salary-tax")
      .querySelector("strong")
      ?.textContent?.replace(/[^\d]/g, "") ?? NaN,
  );
function fixture(unreviewed = false, price = 35000000) {
  const input = {
    financingType: "mortgage",
    currency: "AMD",
    apartmentPrice: price,
    annualInterestRatePercent: 9,
    downPaymentPercent: 20,
    durationMonths: 3,
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
