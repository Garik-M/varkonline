import type { WidgetConfiguration } from "./types";
import { CHANNEL, VERSION, isFrameMessage } from "./protocol";
import { sdkText, widgetLanguage } from "./sdk-messages";

const attributes = {
  "data-language": "language",
  "data-apartment-id": "apartmentId",
  "data-annual-interest-rate": "annualInterestRatePercent",
  "data-down-payment-percent": "downPaymentPercent",
  "data-duration-months": "durationMonths",
  "data-financing-type": "financingType",
  "data-development": "developmentId",
  "data-contract-price-amd": "contractPriceAMD",
  "data-loan-origination-date": "loanOriginationDate",
  "data-first-payment-date": "firstPaymentDate",
} as const;
const numeric = [
  "apartmentPrice",
  "annualInterestRatePercent",
  "downPaymentPercent",
  "durationMonths",
  "contractPriceAMD",
];
const allowed = [
  "partner",
  ...Object.values(attributes),
  "apartmentPrice",
  "currency",
];

export function parseWidgetConfiguration(input: unknown): WidgetConfiguration {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("INVALID_CONFIGURATION");
  const data = input as Record<string, unknown>;
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    throw new Error("UNSUPPORTED_ATTRIBUTE");
  if (
    typeof data.partner !== "string" ||
    !/^[a-z0-9][a-z0-9-]{1,63}$/.test(data.partner)
  )
    throw new Error("INVALID_PARTNER");
  if (
    typeof data.apartmentId !== "string" ||
    !data.apartmentId.trim() ||
    data.apartmentId.length > 120
  )
    throw new Error("APARTMENT_ID_REQUIRED");
  const result = { ...data };
  if (
    result.language !== undefined &&
    !["hy", "en", "ru"].includes(String(result.language))
  )
    throw new Error("INVALID_LANGUAGE");
  for (const field of numeric)
    if (result[field] !== undefined) {
      const raw = result[field];
      if (
        (typeof raw !== "number" &&
          (typeof raw !== "string" ||
            !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(raw))) ||
        raw === ""
      )
        throw new Error("INVALID_NUMBER");
      const value = Number(raw);
      const percentage =
        field === "annualInterestRatePercent" || field === "downPaymentPercent";
      if (
        !Number.isFinite(value) ||
        value < (percentage ? 0 : 1) ||
        value > (percentage ? 100 : field === "durationMonths" ? 600 : 1e12) ||
        (!percentage && !Number.isSafeInteger(value))
      )
        throw new Error("INVALID_NUMBER");
      result[field] = value;
    }
  if (
    result.currency !== undefined &&
    result.currency !== "AMD" &&
    result.currency !== "USD"
  )
    throw new Error("INVALID_CURRENCY");
  if (
    result.financingType !== undefined &&
    !["mortgage", "developer_installment"].includes(
      String(result.financingType),
    )
  )
    throw new Error("INVALID_FINANCING_TYPE");
  for (const key of ["loanOriginationDate", "firstPaymentDate"])
    if (
      result[key] !== undefined &&
      (typeof result[key] !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(result[key] as string))
    )
      throw new Error("INVALID_DATE");
  if (
    result.developmentId !== undefined &&
    (typeof result.developmentId !== "string" ||
      !/^[a-z0-9][a-z0-9-]{1,63}$/.test(result.developmentId))
  )
    throw new Error("INVALID_DEVELOPMENT");
  return result as unknown as WidgetConfiguration;
}

export function readWidgetAttributes(
  element: HTMLElement,
): WidgetConfiguration {
  const data: Record<string, unknown> = {
    partner: element.getAttribute("data-partner"),
  };
  for (const [attribute, key] of Object.entries(attributes))
    if (element.hasAttribute(attribute))
      data[key] = element.getAttribute(attribute);
  const amd = element.getAttribute("data-price-amd");
  const usd = element.getAttribute("data-price-usd");
  if (amd !== null && usd !== null) throw new Error("AMBIGUOUS_CURRENCY");
  if (amd !== null || usd !== null) {
    data.apartmentPrice = amd ?? usd;
    data.currency = amd !== null ? "AMD" : "USD";
  }
  return parseWidgetConfiguration(data);
}

interface Mounted {
  config: WidgetConfiguration;
  signature: string;
  attributeSignature?: string;
  automatic: boolean;
  frame: HTMLIFrameElement;
  wrapper: HTMLDivElement;
  status: HTMLParagraphElement;
  instance: string;
  timer?: ReturnType<typeof setTimeout>;
  loaded: boolean;
}
export interface FinancingSdk {
  version: "1";
  mount(element: HTMLElement | string, config?: WidgetConfiguration): void;
  update(
    element: HTMLElement | string,
    config?: Partial<WidgetConfiguration>,
  ): void;
  destroy(element: HTMLElement | string): void;
  scan(root?: ParentNode): void;
  disconnect(): void;
}

export function createFinancingSdk(
  apiOrigin: string,
  auto = true,
  preview = false,
): FinancingSdk {
  const api = new URL(apiOrigin);
  if (
    api.username ||
    api.password ||
    !["http:", "https:"].includes(api.protocol)
  )
    throw new Error("INVALID_API_ORIGIN");
  const origin = api.origin;
  const instances = new Map<HTMLElement, Mounted>();
  const suppressed = new WeakSet<HTMLElement>();
  const failedAttributes = new WeakMap<HTMLElement, string>();
  let observer: MutationObserver | undefined;
  let scheduled = false;
  let listening = false;
  let stopped = false;
  const elementFor = (element: HTMLElement | string) => {
    const node =
      typeof element === "string" ? document.querySelector(element) : element;
    if (!(node instanceof HTMLElement))
      throw new Error("WIDGET_ELEMENT_REQUIRED");
    return node;
  };
  const emit = (
    element: HTMLElement,
    type: string,
    record?: Mounted,
    code?: string,
  ) => {
    // Only this whitelist crosses to generic host analytics; never payroll or results.
    element.dispatchEvent(
      new CustomEvent(`varkonline:${type}`, {
        bubbles: true,
        detail: {
          partner:
            record?.config.partner ?? element.getAttribute("data-partner"),
          apartmentId:
            record?.config.apartmentId ??
            element.getAttribute("data-apartment-id"),
          ...(record ? { instance: record.instance } : {}),
          ...(code ? { code } : {}),
        },
      }),
    );
  };
  const cleanup = (element: HTMLElement) => {
    const record = instances.get(element);
    if (!record) return;
    clearTimeout(record.timer);
    record.frame.onload = null;
    record.frame.onerror = null;
    record.wrapper.remove();
    instances.delete(element);
    if (!instances.size && listening) {
      window.removeEventListener("message", message);
      listening = false;
    }
  };
  const send = (record: Mounted, type: "init" | "update") =>
    record.frame.contentWindow?.postMessage(
      {
        channel: CHANNEL,
        version: VERSION,
        instance: record.instance,
        type,
        configuration: record.config,
      },
      origin,
    );
  function message(event: MessageEvent) {
    if (event.origin !== origin || !isFrameMessage(event.data)) return;
    for (const [element, record] of instances) {
      if (
        event.source !== record.frame.contentWindow ||
        event.data.instance !== record.instance ||
        !element.isConnected
      )
        continue;
      switch (event.data.type) {
        case "ready":
          send(record, "init");
          break;
        case "loaded":
          clearTimeout(record.timer);
          record.status.textContent = "";
          record.status.hidden = true;
          if (!record.loaded) {
            record.loaded = true;
            emit(element, "loaded", record);
          }
          break;
        case "resize": {
          const height = event.data.height;
          if (
            typeof height === "number" &&
            Number.isFinite(height) &&
            height >= 200 &&
            height <= 20000
          ) {
            record.frame.style.setProperty(
              "height",
              `${Math.ceil(height)}px`,
              "important",
            );
          }
          break;
        }
        case "error": {
          const code =
            typeof event.data.code === "string" &&
            /^[A-Z_]{2,60}$/.test(event.data.code)
              ? event.data.code
              : "WIDGET_ERROR";
          clearTimeout(record.timer);
          record.status.hidden = true;
          emit(element, "error", record, code);
          break;
        }
        case "calculated":
          emit(element, "calculated", record);
          break;
        case "changed":
          emit(element, "changed", record);
          break;
      }
      break;
    }
  }
  const report = (element: HTMLElement, error: unknown) => {
    cleanup(element);
    let status = element.querySelector<HTMLElement>(
      ":scope > [data-varkonline-error]",
    );
    if (!status) {
      status = document.createElement("p");
      status.dataset.varkonlineError = "true";
      status.setAttribute("role", "alert");
      element.append(status);
    }
    status.textContent = sdkText(
      widgetLanguage(
        element.getAttribute("data-language") ?? document.documentElement.lang,
      ),
      "configurationError",
    );
    emit(
      element,
      "error",
      undefined,
      error instanceof Error && /^[A-Z_]+$/.test(error.message)
        ? error.message
        : "INVALID_CONFIGURATION",
    );
  };
  const mount = (
    target: HTMLElement | string,
    supplied?: WidgetConfiguration,
  ) => {
    const element = elementFor(target);
    try {
      const parsed = supplied
        ? parseWidgetConfiguration(supplied)
        : readWidgetAttributes(element);
      const config = {
        ...parsed,
        language: parsed.language,
      };
      suppressed.delete(element);
      element.querySelector(":scope > [data-varkonline-error]")?.remove();
      const signature = JSON.stringify(config);
      const previous = instances.get(element);
      if (previous?.signature === signature) {
        // A visitor may have changed language inside the iframe since mounting.
        if (supplied?.language !== undefined) send(previous, "update");
        return;
      }
      if (previous && previous.config.partner === config.partner) {
        previous.config = config;
        previous.signature = signature;
        previous.frame.title = sdkText(config.language ?? widgetLanguage(document.documentElement.lang), "iframeTitle");
        if (!previous.loaded)
          previous.status.textContent = sdkText(config.language ?? widgetLanguage(document.documentElement.lang), "loading");
        send(previous, "update");
        return;
      }
      const attributeSignature = previous?.attributeSignature;
      cleanup(element);
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      const instance = Array.from(bytes, (value) =>
        value.toString(16).padStart(2, "0"),
      ).join("");
      const wrapper = document.createElement("div");
      wrapper.dataset.varkonlineOwned = "true";
      const status = document.createElement("p");
      status.setAttribute("role", "status");
      status.textContent = sdkText(config.language ?? widgetLanguage(document.documentElement.lang), "loading");
      const frame = document.createElement("iframe");
      frame.title = sdkText(config.language ?? widgetLanguage(document.documentElement.lang), "iframeTitle");
      frame.sandbox.add(
        "allow-scripts",
        "allow-same-origin",
        "allow-forms",
        "allow-downloads",
        "allow-popups",
        "allow-popups-to-escape-sandbox",
      );
      frame.referrerPolicy = "strict-origin";
      for (const [name, value] of Object.entries({
        display: "block",
        width: "100%",
        height: "500px",
        border: "0",
        "max-width": "100%",
        "min-width": "0",
      }))
        frame.style.setProperty(name, value, "important");
      const url = new URL(`/embed/${config.partner}`, origin);
      url.search = new URLSearchParams({
        parentOrigin: window.location.origin,
        instance,
        sdk: "1",
        ...(preview ? { preview: "1" } : {}),
      }).toString();
      if (config.language) url.hash = `language=${config.language}`;
      frame.src = url.href;
      const record: Mounted = {
        config,
        signature,
        automatic: !supplied,
        attributeSignature,
        frame,
        wrapper,
        status,
        instance,
        loaded: false,
      };
      record.timer = setTimeout(() => {
        status.hidden = false;
        status.textContent = sdkText(record.config.language ?? "hy", "timeout");
        emit(element, "error", record, "LOAD_TIMEOUT");
      }, 20_000);
      frame.onerror = () => {
        clearTimeout(record.timer);
        status.textContent = sdkText(
          record.config.language ?? "hy",
          "unavailableShort",
        );
        emit(element, "error", record, "NETWORK_ERROR");
      };
      instances.set(element, record);
      if (!listening) {
        window.addEventListener("message", message);
        listening = true;
      }
      wrapper.append(status, frame);
      element.append(wrapper);
    } catch (error) {
      report(element, error);
    }
  };
  const scan = (root: ParentNode = document) => {
    for (const [element] of instances)
      if (!element.isConnected) cleanup(element);
    const found = [...root.querySelectorAll<HTMLElement>(".varkonline-widget")];
    if (root instanceof HTMLElement && root.matches(".varkonline-widget"))
      found.unshift(root);
    for (const element of found)
      if (!suppressed.has(element)) {
        const current = instances.get(element);
        try {
          const config = readWidgetAttributes(element);
          const signature = JSON.stringify(config);
          if (!current && failedAttributes.get(element) === signature) continue;
          if (!current || current.attributeSignature !== signature) {
            mount(element, config);
            const record = instances.get(element);
            if (record) {
              record.attributeSignature = signature;
              record.automatic = true;
              failedAttributes.delete(element);
            } else failedAttributes.set(element, signature);
            delete element.dataset.varkonlineInvalid;
          }
        } catch (error) {
          // Avoid mutation loops from re-rendering an unchanged attribute error.
          const signature = Array.from(element.attributes)
            .filter((attr) => !attr.name.startsWith("data-varkonline-"))
            .map((attr) => `${attr.name}=${attr.value}`)
            .join(";");
          if (element.dataset.varkonlineInvalid !== signature) {
            element.dataset.varkonlineInvalid = signature;
            report(element, error);
          }
        }
      }
    for (const [element, record] of instances)
      if (record.automatic && auto && !element.matches(".varkonline-widget"))
        cleanup(element);
  };
  const queueScan = () => {
    if (scheduled || stopped) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      if (!stopped) scan();
    });
  };
  const start = () => {
    if (stopped) return;
    scan();
    observer = new MutationObserver(queueScan);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "class",
        "data-partner",
        "data-price-amd",
        "data-price-usd",
        ...Object.keys(attributes),
      ],
    });
  };
  if (auto) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }
  return {
    version: "1",
    mount,
    update(target, changes) {
      const element = elementFor(target);
      const current = instances.get(element);
      if (!changes) return mount(element);
      const config = {
        ...(current?.config ?? readWidgetAttributes(element)),
        ...changes,
      };
      for (const key of Object.keys(config))
        if (config[key as keyof WidgetConfiguration] === undefined)
          delete config[key as keyof WidgetConfiguration];
      mount(element, config);
    },
    destroy(target) {
      const element = elementFor(target);
      suppressed.add(element);
      cleanup(element);
      element.querySelector(":scope > [data-varkonline-error]")?.remove();
    },
    scan,
    disconnect() {
      stopped = true;
      observer?.disconnect();
      document.removeEventListener("DOMContentLoaded", start);
      for (const [element] of instances) cleanup(element);
    },
  };
}
