export type WidgetEventType =
  | "widget_view"
  | "calculation_completed"
  | "schedule_downloaded"
  | "field_changed"
  | "refund_calculated"
  | "schedule_opened"
  | "schedule_closed"
  | "schedule_page"
  | "language_changed"
  | "repayment_changed"
  | "co_borrower_toggled"
  | "refund_details_opened";
export type WidgetField =
  | "down_payment"
  | "duration"
  | "interest_rate"
  | "net_salary"
  | "co_net_salary";
export type TrackWidgetEvent = (
  type: WidgetEventType,
  field?: WidgetField,
) => void;

/** Per-iframe, in-memory session. Only named actions are sent. Coarse property
 * context is signed by the server, never supplied as arbitrary event metadata.
 * No cookies, persistent identifiers, payroll, URLs or third-party analytics. */
export function createWidgetTracker(endpoint: string) {
  const sessionId = crypto.randomUUID();
  let token: string | null = null;
  let stopped = false;
  let sending = false;
  let sequence = 0;
  let queue: {
    token: string;
    id: string;
    sequence: number;
    type: WidgetEventType;
    language: "hy" | "en" | "ru";
    field?: WidgetField;
  }[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = "",
    lastAt = 0;
  async function flush() {
    if (!token || stopped || sending || !queue.length) return;
    sending = true;
    // Capture context per event so apartment changes cannot misattribute queued actions.
    const batchToken = queue[0].token;
    const nextContext = queue.findIndex((event) => event.token !== batchToken);
    const batch = queue.splice(
      0,
      Math.min(40, nextContext < 0 ? queue.length : nextContext),
    );
    const events = batch.map(({ token: _token, ...event }) => event);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "omit",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: batchToken, sessionId, events }),
      });
      if (!response.ok && response.status >= 500)
        queue = [...batch, ...queue].slice(0, 120);
    } catch {
      if (!stopped) queue = [...batch, ...queue].slice(0, 120);
    } finally {
      sending = false;
      if (queue.length && !stopped)
        timer = setTimeout(() => void flush(), 5000);
    }
  }
  return {
    configure(value: string | null) {
      const privacy =
        navigator.doNotTrack === "1" ||
        (navigator as Navigator & { globalPrivacyControl?: boolean })
          .globalPrivacyControl === true;
      token = privacy ? null : value;
      if (!token) queue = [];
    },
    track(
      type: WidgetEventType,
      language: "hy" | "en" | "ru",
      field?: WidgetField,
    ) {
      if (!token || stopped) return;
      const key = `${token}:${type}:${language}:${field ?? ""}`;
      if (key === last && Date.now() - lastAt < 500) return;
      last = key;
      lastAt = Date.now();
      if (queue.length < 120 && sequence < 1000000)
        queue.push({
          token,
          id: crypto.randomUUID(),
          sequence: ++sequence,
          type,
          language,
          ...(field ? { field } : {}),
        });
      clearTimeout(timer);
      timer = setTimeout(() => void flush(), 700);
    },
    flush,
    stop() {
      clearTimeout(timer);
      void flush();
      stopped = true;
      queue = [];
    },
  };
}
