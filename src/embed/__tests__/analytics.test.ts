import { afterEach, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createWidgetTracker } from "../analytics";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
function setup() {
  vi.useFakeTimers();
  vi.stubGlobal("crypto", { randomUUID });
  const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 204 });
  vi.stubGlobal("fetch", fetcher);
  const tracker = createWidgetTracker("/events");
  return { tracker, fetcher };
}
it("keeps one session across apartments and sends queued events with their original signing context", async () => {
  const { tracker, fetcher } = setup();
  tracker.configure("apartment-A");
  tracker.track("calculation_completed", "hy");
  tracker.configure("apartment-B");
  tracker.track("widget_view", "en");
  await tracker.flush();
  await tracker.flush();
  const bodies = fetcher.mock.calls.map(([, init]) => JSON.parse(init.body));
  expect(bodies[0].token).toBe("apartment-A");
  expect(bodies[1].token).toBe("apartment-B");
  expect(bodies[0].sessionId).toBe(bodies[1].sessionId);
  expect(bodies.map((body) => body.events[0].type)).toEqual([
    "calculation_completed",
    "widget_view",
  ]);
  expect(bodies[0].events[0]).not.toHaveProperty("token");
  tracker.stop();
});
it("retries an event without changing its ID, session or sequence", async () => {
  const { tracker, fetcher } = setup();
  fetcher.mockResolvedValueOnce({ ok: false, status: 500 });
  tracker.configure("signed");
  tracker.track("schedule_downloaded", "en");
  await tracker.flush();
  await tracker.flush();
  expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body);
  tracker.stop();
});
it.each([{ doNotTrack: "1" }, { globalPrivacyControl: true }])(
  "respects privacy preference %j",
  async (navigator) => {
    const { tracker, fetcher } = setup();
    vi.stubGlobal("navigator", navigator);
    tracker.configure("signed");
    tracker.track("calculation_completed", "hy");
    await tracker.flush();
    expect(fetcher).not.toHaveBeenCalled();
    tracker.stop();
  },
);
it("previews without a token never emit events", async () => {
  const { tracker, fetcher } = setup();
  tracker.configure(null);
  tracker.track("calculation_completed", "hy");
  await tracker.flush();
  expect(fetcher).not.toHaveBeenCalled();
  tracker.stop();
});
