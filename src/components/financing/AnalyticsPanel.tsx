import { useCallback, useEffect, useState } from "react";

interface Report {
  days: number;
  retentionDays: number;
  timeZone: string;
  summary: {
    events: number;
    sessions: number;
    views: number;
    engaged: number;
    refund_sessions: number;
    schedule_sessions: number;
  };
  events: { type: string; field: string | null; count: number }[];
  daily: { date: string; sessions: number; refunds: number }[];
  apartments: { apartmentId: string; sessions: number; refunds: number }[];
  languages: { language: string; views: number }[];
  sessions: {
    id: string;
    startedAt: string;
    lastSeenAt: string;
    events: number;
    apartments: number;
  }[];
}
interface SessionEvent {
  type: string;
  field: string | null;
  language: string;
  apartmentId: string;
  at: string;
}
export default function AnalyticsPanel({
  request,
  language = "en",
}: {
  request: <T>(path: string) => Promise<T>;
  language?: "hy" | "en" | "ru";
}) {
  const l = (hy: string, en: string, ru: string) => ({ hy, en, ru })[language];
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [events, setEvents] = useState<SessionEvent[] | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const load = useCallback(() => {
    setSession(null);
    setEvents(null);
    setRefresh((value) => value + 1);
  }, []);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError(false);
    request<Report>(`?days=${days}`)
      .then((value) => {
        if (active) setReport(value);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [request, days, refresh]);
  useEffect(() => {
    if (!session) return;
    let active = true;
    setEvents(null);
    setSessionError(false);
    request<{ events: SessionEvent[] }>(
      `/sessions/${encodeURIComponent(session)}`,
    )
      .then((value) => {
        if (active) setEvents(value.events);
      })
      .catch(() => {
        if (active) setSessionError(true);
      });
    return () => {
      active = false;
    };
  }, [request, session]);
  const names: Record<string, string> = {
    widget_view: l("Վիջեթի բացում", "Widget loaded", "Загрузка виджета"),
    field_changed: l(
      "Դաշտի փոփոխություն",
      "Field interaction",
      "Изменение поля",
    ),
    refund_calculated: l(
      "Հետվերադարձի հաշվարկ",
      "Refund calculated",
      "Расчёт возврата",
    ),
    schedule_opened: l("Գրաֆիկի բացում", "Schedule opened", "Открытие графика"),
    schedule_closed: l("Գրաֆիկի փակում", "Schedule closed", "Закрытие графика"),
    schedule_page: l(
      "Գրաֆիկի դիտում",
      "Schedule navigation",
      "Просмотр графика",
    ),
    language_changed: l(
      "Լեզվի փոփոխություն",
      "Language changed",
      "Смена языка",
    ),
    repayment_changed: l(
      "Մարման տարբերակի փոփոխություն",
      "Repayment changed",
      "Смена погашения",
    ),
    co_borrower_toggled: l(
      "Համավարկառուի ընտրություն",
      "Co-borrower toggled",
      "Выбор созаёмщика",
    ),
    refund_details_opened: l(
      "Հետվերադարձի մանրամասներ",
      "Refund notes opened",
      "Условия возврата",
    ),
    down_payment: l("Կանխավճար", "Down payment", "Первоначальный взнос"),
    duration: l("Ժամկետ", "Term", "Срок"),
    interest_rate: l("Տոկոսադրույք", "Interest rate", "Ставка"),
    net_salary: l("Մաքուր աշխատավարձ", "Net salary", "Зарплата на руки"),
    co_net_salary: l(
      "Համավարկառուի աշխատավարձ",
      "Co-borrower salary",
      "Зарплата созаёмщика",
    ),
  };
  const dateTime = (value: string) =>
    new Date(value).toLocaleString(
      language === "hy" ? "hy-AM" : language === "ru" ? "ru-RU" : "en-GB",
      { timeZone: "Asia/Yerevan" },
    );
  const tableClass =
    "w-full text-sm text-left [&_th]:p-2 [&_td]:p-2 [&_tr]:border-b";
  return (
    <section
      className="rounded-xl border bg-card p-5 space-y-5"
      data-testid="financing-analytics"
    >
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <h2 className="font-semibold text-xl">
          {l("Վերլուծություն", "Analytics", "Аналитика")}
        </h2>
        <div className="flex gap-2">
          <select
            aria-label={l(
              "Ժամանակահատված",
              "Analytics period",
              "Период аналитики",
            )}
            className="border rounded bg-background p-2"
            value={days}
            onChange={(event) => {
              setDays(Number(event.target.value));
              setSession(null);
            }}
          >
            {[7, 30, 90].map((value) => (
              <option key={value} value={value}>
                {value} {l("օր", "days", "дней")}
              </option>
            ))}
          </select>
          <button
            className="border rounded px-3 py-2"
            disabled={busy}
            onClick={load}
          >
            {l("Թարմացնել", "Refresh", "Обновить")}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {l(
          "Կարճատև անանուն սեսիաներ, ոչ նույնականացված անձինք։ Չկան աշխատավարձեր, մուտքագրված գումարներ կամ այլ էջերի գործողություններ։ 90-օրյա պահպանում, Երևանի ժամով։ Արգելափակիչները և գաղտնիության նախապատվությունները կարող են սահմանափակել տվյալները։",
          "Short-lived pseudonymous sessions, not identified people. No salaries, typed amounts or activity outside the widget. 90-day retention; Yerevan time. Blocking and privacy preferences can reduce coverage.",
          "Временные обезличенные сессии, не установленные личности. Без зарплат, введённых сумм и действий вне виджета. Хранение 90 дней, время Еревана. Блокировщики и настройки приватности могут снижать охват.",
        )}
      </p>
      {busy && <p role="status">{l("Բեռնվում է…", "Loading…", "Загрузка…")}</p>}
      {error && (
        <p role="alert">
          {l(
            "Չհաջողվեց բեռնել վերլուծությունը։ Փորձեք թարմացնել։",
            "Unable to load analytics. Try refreshing.",
            "Не удалось загрузить аналитику. Обновите.",
          )}
        </p>
      )}
      {!error && report && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              [l("Սեսիաներ", "Sessions", "Сессии"), report.summary.sessions],
              [
                l("Փոխազդեցությամբ", "Interacted", "С взаимодействием"),
                report.summary.engaged,
              ],
              [
                l(
                  "Հետվերադարձը հաշվարկած",
                  "Calculated refund",
                  "Рассчитали возврат",
                ),
                report.summary.refund_sessions,
              ],
              [
                l("Գրաֆիկը բացած", "Opened schedule", "Открыли график"),
                report.summary.schedule_sessions,
              ],
            ].map(([label, count]) => (
              <div className="rounded-lg bg-muted p-4" key={label}>
                <div className="text-xs">{label}</div>
                <strong className="text-2xl">{count}</strong>
              </div>
            ))}
          </div>
          {report.summary.sessions === 0 ? (
            <p>
              {l(
                "Դեռ տվյալներ չկան։ Կայքի այցելուների գործողությունները կհայտնվեն այստեղ։",
                "No activity yet. Visitor interactions will appear here.",
                "Пока нет активности. Действия посетителей появятся здесь.",
              )}
            </p>
          ) : (
            <>
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="font-medium">
                  {l(
                    "Հետվերադարձի ներգրավվածություն",
                    "Refund engagement",
                    "Вовлечённость в возврат",
                  )}
                </h3>
                <div className="h-3 rounded bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(100, (report.summary.refund_sessions / report.summary.sessions) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-sm">
                  {Math.round(
                    (report.summary.refund_sessions / report.summary.sessions) *
                      100,
                  )}
                  % · {report.summary.refund_sessions} /{" "}
                  {report.summary.sessions}
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="overflow-x-auto">
                  <h3 className="font-semibold mb-2">
                    {l(
                      "Օրական ակտիվություն",
                      "Daily activity",
                      "Активность по дням",
                    )}
                  </h3>
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th>{l("Ամսաթիվ", "Date", "Дата")}</th>
                        <th>{l("Սեսիաներ", "Sessions", "Сессии")}</th>
                        <th>
                          {l("Հաշվարկներ", "Refund calculations", "Расчёты")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.daily.map((row) => (
                        <tr key={row.date}>
                          <td>{row.date}</td>
                          <td>{row.sessions}</td>
                          <td>{row.refunds}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto">
                  <h3 className="font-semibold mb-2">
                    {l(
                      "Հայտնի բնակարաններ",
                      "Top apartments",
                      "Популярные квартиры",
                    )}
                  </h3>
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{l("Սեսիաներ", "Sessions", "Сессии")}</th>
                        <th>
                          {l("Հաշվարկներ", "Refund calculations", "Расчёты")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.apartments.map((row) => (
                        <tr key={row.apartmentId}>
                          <td className="break-all">{row.apartmentId}</td>
                          <td>{row.sessions}</td>
                          <td>{row.refunds}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <details>
                <summary className="cursor-pointer font-semibold">
                  {l(
                    "Բոլոր գործողությունները և լեզուները",
                    "Actions and languages",
                    "Действия и языки",
                  )}
                </summary>
                <ul className="text-sm space-y-2 mt-3">
                  {report.events.map((row) => (
                    <li key={row.type + row.field}>
                      {names[row.type] ?? row.type}
                      {row.field
                        ? ` · ${names[row.field] ?? row.field}`
                        : ""}: <strong>{row.count}</strong>
                    </li>
                  ))}
                </ul>
                <p className="text-sm mt-3">
                  {report.languages
                    .map((row) => `${row.language.toUpperCase()}: ${row.views}`)
                    .join(" · ")}
                </p>
              </details>
              <div>
                <h3 className="font-semibold">
                  {l(
                    "Վերջին 50 սեսիաները",
                    "Latest 50 sessions",
                    "Последние 50 сессий",
                  )}
                </h3>
                <div className="overflow-x-auto">
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th>{l("Սեսիա", "Session", "Сессия")}</th>
                        <th>
                          {l(
                            "Վերջին գործողություն",
                            "Last seen",
                            "Последнее действие",
                          )}
                        </th>
                        <th>{l("Գործողություններ", "Actions", "Действия")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.sessions.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <button
                              className="underline text-primary"
                              onClick={() => setSession(row.id)}
                            >
                              {row.id.slice(0, 8)}
                            </button>
                          </td>
                          <td>{dateTime(row.lastSeenAt)}</td>
                          <td>{row.events}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          {session && (
            <div
              className="rounded border p-4 space-y-3"
              data-testid="analytics-session"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">
                  {l(
                    "Սեսիայի գործողությունները",
                    "Session timeline",
                    "Хронология сессии",
                  )}{" "}
                  · {session.slice(0, 8)}
                </h3>
                <button
                  onClick={() => setSession(null)}
                  aria-label={l("Փակել", "Close", "Закрыть")}
                >
                  ×
                </button>
              </div>
              {sessionError ? (
                <p role="alert">
                  {l(
                    "Չհաջողվեց բեռնել սեսիան։",
                    "Unable to load session.",
                    "Не удалось загрузить сессию.",
                  )}
                </p>
              ) : events === null ? (
                <p role="status">…</p>
              ) : (
                <ol className="space-y-3 text-sm">
                  {events.map((event, index) => (
                    <li key={index} className="border-l-2 pl-3">
                      <strong>{names[event.type] ?? event.type}</strong>
                      {event.field ? ` · ${names[event.field]}` : ""}
                      <div className="text-xs text-muted-foreground">
                        {dateTime(event.at)} · {event.language.toUpperCase()} ·{" "}
                        {event.apartmentId}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <p className="text-xs text-muted-foreground">
                {l(
                  "Առավելագույնը՝ առաջին 500 գործողությունը։",
                  "Up to the first 500 recorded actions.",
                  "До первых 500 записанных действий.",
                )}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
