import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  createFinancingSdk,
  parseWidgetConfiguration,
  readWidgetAttributes,
  type FinancingSdk,
} from "../sdk-core";
import { CHANNEL, VERSION, isFrameMessage } from "../protocol";
import { integrationSnippet } from "../snippet";
// jsdom lacks the iframe sandbox DOMTokenList; real-browser tests verify sandboxing.
beforeAll(() => {
  const tokens = new WeakMap<HTMLIFrameElement, DOMTokenList>();
  Object.defineProperty(HTMLIFrameElement.prototype, "sandbox", {
    configurable: true,
    get() {
      if (!tokens.has(this))
        tokens.set(this, document.createElement("span").classList);
      return tokens.get(this);
    },
  });
});
let sdk: FinancingSdk | undefined;
afterEach(() => {
  sdk?.disconnect();
  document.body.innerHTML = "";
  document.documentElement.lang = "";
});
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
function widget(price = "35000000") {
  const node = document.createElement("div");
  node.className = "varkonline-widget";
  node.dataset.partner = "partner-one";
  node.dataset.apartmentId = "A-1";
  node.dataset.priceAmd = price;
  node.dataset.annualInterestRate = "9.5";
  document.body.append(node);
  return node;
}
describe("SDK public boundary", () => {
  it("accepts only supported explicit languages and preserves the setting in snippets", () => {
    const node = widget();
    for (const language of ["hy", "en", "ru"] as const) {
      node.dataset.language = language;
      const config = readWidgetAttributes(node);
      expect(config.language).toBe(language);
      expect(integrationSnippet("https://www.varkonline.am", config)).toContain(
        `data-language="${language}"`,
      );
    }
    node.dataset.language = "fr";
    expect(() => readWidgetAttributes(node)).toThrow("INVALID_LANGUAGE");
  });
  it("uses the page language for loading and accessible iframe titles, with an explicit override", () => {
    document.documentElement.lang = "en-US";
    const node = widget();
    sdk = createFinancingSdk("https://api.varkonline.am", false);
    sdk.mount(node);
    const frame = node.querySelector("iframe")!;
    expect(frame.title).toBe("Varkonline — apartment financing calculator");
    expect(node.querySelector('[role="status"]')).toHaveTextContent(
      "Loading financing calculator",
    );
    expect(new URL(frame.src).hash).toBe(""); // The resolver supplies the partner default unless explicitly overridden.
    sdk.update(node, { language: "ru" });
    expect(node.querySelector("iframe")).toBe(frame);
    expect(frame.title).toContain("калькулятор");
    expect(node.querySelector('[role="status"]')).toHaveTextContent(
      "Загрузка калькулятора",
    );
  });
  it("rejects malformed messages without coercing attacker-controlled values", () => {
    expect(
      isFrameMessage({
        channel: CHANNEL,
        version: VERSION,
        instance: "instance",
        type: { toString: null },
      }),
    ).toBe(false);
  });
  it("reads decimal percentages, zero, whole currency and independent apartments", () => {
    const a = widget();
    const b = widget("42000000");
    a.dataset.downPaymentPercent = "0";
    expect(readWidgetAttributes(a)).toMatchObject({
      annualInterestRatePercent: 9.5,
      downPaymentPercent: 0,
      currency: "AMD",
      apartmentPrice: 35000000,
    });
    expect(readWidgetAttributes(b).apartmentPrice).toBe(42000000);
  });
  it.each([
    "",
    "{{apartment.price}}",
    "1e7",
    "-1",
    "NaN",
    "Infinity",
    "1.1",
    "0",
    "1000000000001",
  ])("rejects invalid whole prices %s", (value) =>
    expect(() => readWidgetAttributes(widget(value))).toThrow(),
  );
  it("rejects both currencies and unsupported financial fields", () => {
    const node = widget();
    node.dataset.priceUsd = "100";
    expect(() => readWidgetAttributes(node)).toThrow("AMBIGUOUS_CURRENCY");
    expect(() =>
      parseWidgetConfiguration({
        partner: "partner-one",
        apartmentId: "A",
        markup: 10,
      }),
    ).toThrow("UNSUPPORTED_ATTRIBUTE");
  });
  it("mounts one iframe repeatedly and touches only owned children", () => {
    const node = widget();
    const original = document.createElement("p");
    original.textContent = "Host content";
    node.append(original);
    sdk = createFinancingSdk("https://api.varkonline.am", false);
    sdk.mount(node);
    sdk.mount(node);
    expect(node.querySelectorAll("iframe")).toHaveLength(1);
    expect(node.contains(original)).toBe(true);
    sdk.destroy(node);
    expect(node.querySelector("iframe")).toBeNull();
    expect(node.contains(original)).toBe(true);
    sdk.mount(node);
    expect(node.querySelector("iframe")).not.toBeNull();
  });
  it("supports dynamic insertion, updates, removals and repeated scan", async () => {
    sdk = createFinancingSdk("https://api.varkonline.am");
    await tick();
    const node = widget();
    await tick();
    const first = node.querySelector("iframe");
    expect(first).not.toBeNull();
    node.dataset.priceAmd = "42000000";
    await tick();
    expect(node.querySelector("iframe")).toBe(first);
    node.dataset.partner = "partner-two";
    await tick();
    expect(node.querySelector("iframe")).not.toBe(first);
    sdk.destroy(node);
    sdk.scan();
    expect(node.querySelector("iframe")).toBeNull();
    sdk.mount(node);
    node.remove();
    sdk.scan();
    expect(node.querySelector("iframe")).toBeNull();
  });
  it("programmatic updates persist across unrelated mutations", async () => {
    const node = widget();
    sdk = createFinancingSdk("https://api.varkonline.am");
    await tick();
    sdk.update(node, { partner: "programmatic-partner" });
    const frame = node.querySelector("iframe");
    document.body.append(document.createElement("p"));
    await tick();
    expect(node.querySelector("iframe")).toBe(frame);
    expect(frame?.src).toContain("programmatic-partner");
    node.dataset.partner = "attribute-partner";
    await tick();
    expect(node.querySelector("iframe")?.src).toContain("attribute-partner");
  });
  it("manual mounting works without a widget class or data attributes", async () => {
    const node = document.createElement("div");
    document.body.append(node);
    sdk = createFinancingSdk("https://api.varkonline.am");
    sdk.mount(node, {
      partner: "partner-one",
      apartmentId: "manual",
      apartmentPrice: 100,
    });
    await tick();
    expect(node.querySelector("iframe")).not.toBeNull();
  });
  it("invalid attributes do not cause mutation loops and can recover", async () => {
    const node = widget("{{price}}");
    sdk = createFinancingSdk("https://api.varkonline.am");
    await tick();
    document.body.append(document.createElement("p"));
    await tick();
    expect(node.querySelectorAll("[data-varkonline-error]")).toHaveLength(1);
    node.dataset.priceAmd = "35000000";
    await tick();
    expect(node.querySelector("iframe")).not.toBeNull();
    expect(node.querySelector("[data-varkonline-error]")).toBeNull();
  });
  it("validates origin, source and instance before resizing or dispatching events", () => {
    const node = widget();
    sdk = createFinancingSdk("https://api.varkonline.am", false);
    sdk.mount(node);
    const frame = node.querySelector("iframe")!;
    const instance = new URL(frame.src).searchParams.get("instance")!;
    const events: unknown[] = [];
    node.addEventListener("varkonline:calculated", (event) =>
      events.push((event as CustomEvent).detail),
    );
    const send = (
      origin: string,
      source: Window | null,
      id = instance,
      type = "resize",
      height = 999,
    ) =>
      window.dispatchEvent(
        new MessageEvent("message", {
          origin,
          source,
          data: {
            channel: CHANNEL,
            version: VERSION,
            instance: id,
            type,
            height,
            salary: 500000,
          },
        }),
      );
    send("https://evil.am", frame.contentWindow);
    send("https://api.varkonline.am", window);
    send("https://api.varkonline.am", frame.contentWindow, "wrong");
    expect(frame.style.height).toBe("500px");
    send("https://api.varkonline.am", frame.contentWindow);
    expect(frame.style.height).toBe("999px");
    send(
      "https://api.varkonline.am",
      frame.contentWindow,
      instance,
      "resize",
      Infinity,
    );
    expect(frame.style.height).toBe("999px");
    send(
      "https://api.varkonline.am",
      frame.contentWindow,
      instance,
      "calculated",
    );
    expect(events).toEqual([
      { partner: "partner-one", apartmentId: "A-1", instance },
    ]);
  });
  it("disconnect stops automatic mounting", async () => {
    sdk = createFinancingSdk("https://api.varkonline.am");
    await tick();
    sdk.disconnect();
    const node = widget();
    await tick();
    expect(node.querySelector("iframe")).toBeNull();
  });
  it("escapes snippets and uses the actual deployment host", () => {
    const code = integrationSnippet("https://varkonline.am", {
      partner: "partner-one",
      apartmentId: '"><script>alert(1)</script>',
      apartmentPrice: 35e6,
    });
    expect(code).toContain("https://varkonline.am/sdk/v1.js");
    expect(code).toContain("&lt;script&gt;");
    expect(code).not.toContain('id=""><script>');
  });
});
