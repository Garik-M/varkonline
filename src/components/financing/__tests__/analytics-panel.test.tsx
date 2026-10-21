import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import AnalyticsPanel from "../AnalyticsPanel";
import type { AnalyticsReport, AnalyticsRequest } from "../analytics-types";
vi.mock("recharts", async (original) => ({
  ...(await original<typeof import("recharts")>()),
  ResponsiveContainer: () => null,
}));
afterEach(cleanup);
function report(): AnalyticsReport {
  return {
    days: 30,
    asOf: "2026-10-21T12:00:00Z",
    retentionDays: 90,
    timeZone: "Asia/Yerevan",
    priceRangeLimit: 50,
    priceBandSizeAMD: 5e6,
    summary: {
      events: 120,
      sessions: 50,
      views: 50,
      engaged: 40,
      refund_sessions: 20,
      schedule_sessions: 10,
      calculator_sessions: 42,
      calculations: 69,
      downloads: 5,
      priced_calculations: 69,
      usd_calculations: 0,
      unclassified_calculations: 0,
    },
    periods: [
      { days: 1, sessions: 3, calculations: 8 },
      { days: 7, sessions: 12, calculations: 20 },
      { days: 30, sessions: 42, calculations: 69 },
    ],
    priceRanges: [
      { fromAMD: 30e6, toAMD: 35e6, calculations: 42, sessions: 30 },
      { fromAMD: 25e6, toAMD: 30e6, calculations: 15, sessions: 10 },
      { fromAMD: 20e6, toAMD: 25e6, calculations: 12, sessions: 9 },
    ],
    events: [],
    daily: [{ date: "2026-10-21", sessions: 3, calculations: 8, refunds: 2 }],
    apartments: [],
    languages: [],
  };
}
it("shows session counts separately from estimates, with exact 5m range data", async () => {
  const request = vi.fn().mockResolvedValue(report()) as AnalyticsRequest;
  render(<AnalyticsPanel request={request} />);
  expect(await screen.findByTestId("usage-1")).toHaveTextContent("3");
  expect(screen.getByTestId("usage-7")).toHaveTextContent("12");
  expect(screen.getByTestId("usage-30")).toHaveTextContent("42");
  expect(screen.getByText("40%")).toBeInTheDocument();
  fireEvent.click(screen.getByText("View price range details"));
  expect(screen.getByText("20–25 m").closest("tr")).toHaveTextContent("12");
  expect(screen.getByText("25–30 m").closest("tr")).toHaveTextContent("15");
  expect(screen.getByText("30–35 m").closest("tr")).toHaveTextContent("42");
  expect(screen.queryByText("Leads")).not.toBeInTheDocument();
});
it("clears the previous company's data immediately and ignores late responses", async () => {
  let resolveOld: (value: AnalyticsReport) => void = () => {};
  const oldRequest: AnalyticsRequest = vi.fn(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  ) as AnalyticsRequest;
  let resolveNew: (value: AnalyticsReport) => void = () => {};
  const newRequest: AnalyticsRequest = vi.fn(
    () =>
      new Promise((resolve) => {
        resolveNew = resolve;
      }),
  ) as AnalyticsRequest;
  const view = render(<AnalyticsPanel request={oldRequest} />);
  view.rerender(<AnalyticsPanel request={newRequest} />);
  resolveOld(report());
  await waitFor(() =>
    expect(screen.queryByTestId("usage-30")).not.toBeInTheDocument(),
  );
  resolveNew({
    ...report(),
    periods: [{ days: 1, sessions: 0, calculations: 0 }],
  });
  expect(await screen.findByTestId("usage-1")).toHaveTextContent("0");
  expect(screen.queryByTestId("usage-30")).not.toBeInTheDocument();
});
it("requests the selected period and replaces a failed report with an error", async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(report())
    .mockRejectedValue(new Error("forbidden"));
  render(<AnalyticsPanel request={request as AnalyticsRequest} />);
  await screen.findByTestId("usage-1");
  fireEvent.click(
    screen.getByRole("button", { name: "Last 7 days", exact: true }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Unable to load analytics",
  );
  expect(request).toHaveBeenLastCalledWith("?days=7");
  expect(screen.queryByTestId("usage-30")).not.toBeInTheDocument();
});
it.each(["hy", "ru"] as const)(
  "localizes analytics in %s",
  async (language) => {
    render(
      <AnalyticsPanel
        language={language}
        request={vi.fn().mockResolvedValue(report()) as AnalyticsRequest}
      />,
    );
    await screen.findByTestId("usage-1");
    expect(
      screen.getByRole("heading", {
        name: language === "hy" ? "Վերլուծություն" : "Аналитика",
      }),
    ).toBeInTheDocument();
  },
);

it("keeps the dashboard and open details mounted while changing periods", async () => {
  let finish: (value: AnalyticsReport) => void = () => {};
  const request = vi
    .fn()
    .mockResolvedValueOnce(report())
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  render(<AnalyticsPanel request={request as AnalyticsRequest} />);
  const usage = await screen.findByTestId("analytics-usage");
  const chart = screen.getByTestId("analytics-daily");
  const details = screen
    .getByText("View price range details")
    .closest("details")!;
  fireEvent.click(screen.getByText("View price range details"));
  fireEvent.click(
    screen.getByRole("button", { name: "Last 7 days", exact: true }),
  );
  expect(screen.getByTestId("analytics-usage")).toBe(usage);
  expect(screen.getByTestId("analytics-daily")).toBe(chart);
  expect(details).toHaveAttribute("open");
  expect(screen.getByTestId("financing-analytics")).toHaveAttribute(
    "aria-busy",
    "true",
  );
  expect(screen.getByRole("status")).toHaveClass("sr-only");
  await act(async () => finish({ ...report(), days: 7 }));
  expect(screen.getByTestId("analytics-daily")).toBe(chart);
  expect(details).toHaveAttribute("open");
  expect(screen.getByTestId("financing-analytics")).toHaveAttribute(
    "aria-busy",
    "false",
  );
});
