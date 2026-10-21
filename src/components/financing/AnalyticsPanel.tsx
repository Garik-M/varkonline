import { useCallback, useEffect, useId, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyticsCopy } from "./analytics-copy";
import type { AnalyticsReport, AnalyticsRequest } from "./analytics-types";

const tableClass =
  "w-full text-sm text-left [&_th]:px-3 [&_th]:py-3 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:px-3 [&_td]:py-3 [&_tr]:border-b [&_tbody_tr:last-child]:border-0";
const cardClass = "min-w-0 rounded-2xl border bg-card p-4 sm:p-6";

export default function AnalyticsPanel({
  request,
  language = "en",
}: {
  request: AnalyticsRequest;
  language?: "hy" | "en" | "ru";
}) {
  const c = analyticsCopy(language);
  const [days, setDays] = useState(30);
  const [loaded, setLoaded] = useState<{
    source: AnalyticsRequest;
    days: number;
    value: AnalyticsReport;
  } | null>(null);
  // Keep the current company's dashboard mounted during period updates.
  // A different company must never inherit the previous report.
  const report = loaded?.source === request ? loaded.value : null;
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [showAllApartments, setShowAllApartments] = useState(false);
  const gradientId = useId().replace(/:/g, "");
  const load = useCallback(() => {
    setRefresh((value) => value + 1);
  }, []);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError(false);
    request<AnalyticsReport>(`?days=${days}`)
      .then((value) => {
        if (active) setLoaded({ source: request, days, value });
      })
      .catch(() => {
        if (active) {
          setLoaded(null);
          setError(true);
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [request, days, refresh]);
  const count = (value: number) =>
    new Intl.NumberFormat(language).format(value);
  const date = (value: string, time = false) =>
    new Date(
      value.length === 10 ? `${value}T12:00:00+04:00` : value,
    ).toLocaleString(language, {
      timeZone: "Asia/Yerevan",
      day: "numeric",
      month: "short",
      ...(time ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  const band = (from: number, to: number) =>
    `${count(from / 1_000_000)}–${count(to / 1_000_000)} ${c.million}`;
  const periodNames = [c.today, c.week, c.month, c.quarter];
  const priceData =
    report?.priceRanges
      .slice(0, 8)
      .map((row) => ({ ...row, label: band(row.fromAMD, row.toAMD) })) ?? [];
  const otherRanges = report
    ? report.summary.priced_calculations -
      report.priceRanges.reduce((sum, row) => sum + row.calculations, 0)
    : 0;
  const refundRate = report?.summary.sessions
    ? (report.summary.refund_sessions / report.summary.sessions) * 100
    : 0;
  return (
    <section
      className="min-w-0 space-y-5"
      data-testid="financing-analytics"
      aria-busy={busy}
    >
      <header className="relative overflow-hidden rounded-2xl bg-[#173453] p-5 text-white sm:p-7">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-sky-400/10"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <BarChart3 aria-hidden="true" size={22} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {c.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-200">{c.subtitle}</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-3 py-2 text-sm hover:bg-white/10 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
            disabled={busy}
            onClick={load}
          >
            <RefreshCw
              size={15}
              className={busy ? "animate-spin" : ""}
              aria-hidden="true"
            />
            {c.refresh}
          </button>
        </div>
        {report && (
          <p className="relative mt-4 text-xs text-slate-300">
            {c.updated} · {date(report.asOf, true)} · {report.timeZone}
          </p>
        )}
      </header>
      {busy && (
        <div
          className={
            report
              ? "sr-only"
              : `${cardClass} animate-pulse text-muted-foreground`
          }
          role="status"
        >
          {c.loading}
        </div>
      )}
      {error && (
        <div
          className={`${cardClass} border-destructive/30 text-destructive`}
          role="alert"
        >
          {c.error}
        </div>
      )}
      {!error && report && (
        <>
          <div
            className="grid grid-cols-3 gap-2 sm:gap-3"
            data-testid="analytics-usage"
          >
            {report.periods.map((period, index) => (
              <div
                key={period.days}
                className="relative min-w-0 overflow-hidden rounded-2xl border bg-card p-3 sm:p-5"
              >
                <div className="flex min-h-8 items-start justify-between gap-1 text-xs text-muted-foreground sm:text-sm">
                  <span>{periodNames[index]}</span>
                  <Users
                    size={17}
                    className="hidden shrink-0 sm:block"
                    aria-hidden="true"
                  />
                </div>
                <strong
                  className="mt-2 block text-3xl font-semibold tabular-nums tracking-tight text-[#173453] sm:text-4xl dark:text-sky-100"
                  data-testid={`usage-${period.days}`}
                >
                  {count(period.sessions)}
                </strong>
                <div className="mt-1 break-words text-[11px] sm:text-sm">
                  {c.sessions}
                </div>
                <div className="mt-3 break-words border-t pt-3 text-[10px] text-muted-foreground sm:text-xs">
                  {count(period.calculations)}{" "}
                  {c.calculations.toLocaleLowerCase(language)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays size={17} aria-hidden="true" />
              {c.period}
              {busy && (
                <RefreshCw
                  size={14}
                  className="animate-spin"
                  aria-hidden="true"
                />
              )}
            </div>
            <div
              role="group"
              aria-label={c.period}
              className="flex max-w-full flex-wrap gap-1 rounded-xl border bg-card p-1"
            >
              {[1, 7, 30, 90].map((value, index) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={days === value}
                  onClick={() => {
                    setDays(value);
                  }}
                  className={`rounded-lg px-3 py-2 text-xs sm:text-sm ${days === value ? "bg-[#173453] text-white shadow-sm" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {periodNames[index]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: c.calculations,
                value: count(report.summary.calculations),
                icon: Activity,
              },
              {
                label: c.refunds,
                value: count(report.summary.refund_sessions),
                icon: Users,
              },
              {
                label: c.downloads,
                value: count(report.summary.downloads),
                icon: ArrowDownToLine,
              },
              {
                label: c.refundRate,
                value: `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(refundRate)}%`,
                icon: BarChart3,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                className="min-w-0 rounded-xl border bg-card p-4"
                key={label}
              >
                <Icon
                  size={17}
                  className="mb-3 text-muted-foreground"
                  aria-hidden="true"
                />
                <strong className="block text-2xl font-semibold tabular-nums">
                  {value}
                </strong>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
          {report.summary.sessions === 0 ? (
            <div className={`${cardClass} py-14 text-center`}>
              <BarChart3
                className="mx-auto mb-4 text-muted-foreground"
                size={30}
                aria-hidden="true"
              />
              <h3 className="font-semibold">{c.empty}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {c.emptyHelp}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className={cardClass} data-testid="analytics-daily">
                  <h3 className="font-semibold">{c.activity}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {c.activityHelp}
                  </p>
                  <div
                    className="mt-5 h-64 min-w-0"
                    role="img"
                    aria-label={`${c.activity}. ${c.details}`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={report.daily}
                        margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                        accessibilityLayer
                      >
                        <defs>
                          <linearGradient
                            id={gradientId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#173453"
                              stopOpacity={0.22}
                            />
                            <stop
                              offset="100%"
                              stopColor="#173453"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 4"
                          vertical={false}
                          stroke="#cbd5e1"
                          strokeOpacity={0.6}
                        />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value: string) => date(value)}
                          minTickGap={30}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: "#64748b" }}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: "#64748b" }}
                        />
                        <Tooltip
                          labelFormatter={(value) => date(String(value))}
                          contentStyle={{
                            borderRadius: 12,
                            fontSize: 12,
                            color: "#173453",
                          }}
                          formatter={(value: number, name: string) => [
                            count(value),
                            name,
                          ]}
                        />
                        <Area
                          name={c.calculations}
                          dataKey="calculations"
                          stroke="#38bdf8"
                          fill="transparent"
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                        <Area
                          name={c.sessions}
                          dataKey="sessions"
                          stroke="#173453"
                          fill={`url(#${gradientId})`}
                          strokeWidth={2.5}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs">
                    <span>
                      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[#173453]" />
                      {c.sessions}
                    </span>
                    <span>
                      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-400" />
                      {c.calculations}
                    </span>
                  </div>
                  <details className="mt-4 border-t pt-3">
                    <summary className="cursor-pointer text-xs font-medium">
                      {c.details}
                    </summary>
                    <div className="max-h-72 overflow-auto">
                      <table className={tableClass}>
                        <thead>
                          <tr>
                            <th>{c.date}</th>
                            <th>{c.sessions}</th>
                            <th>{c.calculations}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.daily.map((row) => (
                            <tr key={row.date}>
                              <td className="whitespace-nowrap">
                                {date(row.date)}
                              </td>
                              <td>{count(row.sessions)}</td>
                              <td>{count(row.calculations)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>
                <div className={cardClass} data-testid="analytics-price-ranges">
                  <h3 className="font-semibold">{c.ranges}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {c.rangeHelp}
                  </p>
                  {priceData.length ? (
                    <>
                      <div
                        className="mt-5 min-w-0"
                        style={{ height: Math.max(170, priceData.length * 39) }}
                        role="img"
                        aria-label={c.ranges}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={priceData}
                            layout="vertical"
                            margin={{ top: 0, right: 38, left: 0, bottom: 0 }}
                            accessibilityLayer
                          >
                            <CartesianGrid
                              strokeDasharray="3 4"
                              horizontal={false}
                              stroke="#cbd5e1"
                              strokeOpacity={0.6}
                            />
                            <XAxis
                              type="number"
                              allowDecimals={false}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 10, fill: "#64748b" }}
                            />
                            <YAxis
                              type="category"
                              dataKey="label"
                              width={88}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 11, fill: "#64748b" }}
                            />
                            <Tooltip
                              cursor={{ fill: "#f1f5f9" }}
                              contentStyle={{
                                borderRadius: 12,
                                fontSize: 12,
                                color: "#173453",
                              }}
                              formatter={(value: number) => [
                                count(value),
                                c.calculations,
                              ]}
                            />
                            <Bar
                              name={c.calculations}
                              dataKey="calculations"
                              fill="#173453"
                              radius={[0, 5, 5, 0]}
                              barSize={19}
                              isAnimationActive={false}
                            >
                              <LabelList
                                dataKey="calculations"
                                position="right"
                                fill="#475569"
                                fontSize={11}
                                formatter={(value: unknown) =>
                                  typeof value === "number"
                                    ? count(value)
                                    : String(value)
                                }
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <details className="mt-4 border-t pt-3">
                        <summary className="cursor-pointer text-xs font-medium">
                          {c.rangeTable}
                        </summary>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {c.rangeLimit}
                        </p>
                        <div className="max-h-80 overflow-auto">
                          <table className={tableClass}>
                            <thead>
                              <tr>
                                <th>{c.range}</th>
                                <th>{c.calculations}</th>
                                <th>{c.sessions}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.priceRanges.map((row) => (
                                <tr key={row.fromAMD}>
                                  <td className="whitespace-nowrap">
                                    {band(row.fromAMD, row.toAMD)}
                                  </td>
                                  <td>{count(row.calculations)}</td>
                                  <td>{count(row.sessions)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {otherRanges > 0 && (
                          <p className="mt-2 text-xs">
                            {c.otherRanges}: {count(otherRanges)}
                          </p>
                        )}
                      </details>
                    </>
                  ) : (
                    <p className="py-14 text-center text-sm text-muted-foreground">
                      {c.noRanges}
                    </p>
                  )}
                  {report.summary.usd_calculations > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {c.usd} ({count(report.summary.usd_calculations)})
                    </p>
                  )}
                  {report.summary.unclassified_calculations > 0 && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {c.legacy} (
                      {count(report.summary.unclassified_calculations)})
                    </p>
                  )}
                </div>
              </div>
              <div className={cardClass}>
                <h3 className="mb-3 font-semibold">{c.apartments}</h3>
                <div className="overflow-x-auto">
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th>{c.apartment}</th>
                        <th>{c.calculations}</th>
                        <th>{c.refunds}</th>
                        <th>{c.downloads}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.apartments
                        .slice(0, showAllApartments ? 20 : 5)
                        .map((row) => (
                          <tr key={row.apartmentId}>
                            <td className="max-w-60 break-all font-medium">
                              {row.apartmentId}
                            </td>
                            <td>{count(row.calculations)}</td>
                            <td>{count(row.refunds)}</td>
                            <td>{count(row.downloads)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {report.apartments.length > 5 && (
                  <button
                    type="button"
                    className="mt-3 rounded-lg border px-3 py-2 text-xs font-medium"
                    aria-expanded={showAllApartments}
                    onClick={() => setShowAllApartments(!showAllApartments)}
                  >
                    {showAllApartments ? c.showLess : c.allApartments}
                  </button>
                )}
              </div>
              <details className={cardClass}>
                <summary className="cursor-pointer font-medium">
                  {c.actions}
                </summary>
                <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  {report.events.map((row) => (
                    <li
                      className="flex justify-between gap-3 rounded-lg bg-muted/40 p-3"
                      key={row.type + row.field}
                    >
                      <span>
                        {c.names[row.type] ?? row.type}
                        {row.field
                          ? ` · ${c.names[row.field] ?? row.field}`
                          : ""}
                      </span>
                      <strong className="tabular-nums">
                        {count(row.count)}
                      </strong>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  {report.languages
                    .map(
                      (row) =>
                        `${row.language.toUpperCase()}: ${count(row.views)}`,
                    )
                    .join(" · ")}
                </p>
              </details>
            </>
          )}
          <footer className="space-y-2 rounded-xl bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
            <p>{c.refundRateHelp}</p>
            <p>{c.counting}</p>
            <p>{c.privacy}</p>
          </footer>
        </>
      )}
    </section>
  );
}
