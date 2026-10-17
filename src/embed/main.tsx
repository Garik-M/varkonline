import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import FinancingCalculator from "./FinancingCalculator";
import { CHANNEL, VERSION } from "./protocol";
import { parseWidgetConfiguration } from "./sdk-core";
import type { ResolvedWidget, WidgetConfiguration } from "./types";
import "./embed.css";

const boot = document.documentElement.dataset;
const validBoot =
  !!boot.apiBase &&
  !!boot.partner &&
  !!boot.parentOrigin &&
  !!boot.instance &&
  window.parent !== window;
function emit(type: string, extra: Record<string, unknown> = {}) {
  if (validBoot)
    window.parent.postMessage(
      {
        channel: CHANNEL,
        version: VERSION,
        instance: boot.instance,
        type,
        ...extra,
      },
      boot.parentOrigin!,
    );
}
class Boundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    emit("error", { code: "CALCULATOR_ERROR" });
  }
  render() {
    return this.state.failed ? (
      <div className="vk-error" role="alert">
        Հաշվիչը ժամանակավորապես հասանելի չէ։ Թարմացրեք էջը։
      </div>
    ) : (
      this.props.children
    );
  }
}
// eslint-disable-next-line react-refresh/only-export-components -- Isolated HTML entry owns its React root.
function EmbedApp() {
  const [configuration, setConfiguration] = useState<ResolvedWidget | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [generation, setGeneration] = useState(0);
  const current = useRef<WidgetConfiguration>();
  const notify = useCallback(
    (type: "calculated" | "changed") => emit(type),
    [],
  );
  useEffect(() => {
    if (!validBoot) {
      setLoading(false);
      setError("Հաշվիչը հասանելի է գործընկերոջ կայքի ինտեգրման միջոցով։");
      return;
    }
    let controller: AbortController | undefined;
    let sequence = 0;
    let disposed = false;
    const load = async (config: WidgetConfiguration, refresh = false) => {
      current.current = config;
      controller?.abort();
      const active = new AbortController();
      controller = active;
      const request = ++sequence;
      if (!refresh) {
        setGeneration((value) => value + 1);
        setLoading(true);
        setConfiguration(null);
        setError("");
      }
      const timeout = setTimeout(() => active.abort(), 12_000);
      try {
        const { partner: _partner, ...apartment } = config;
        const response = await fetch(
          `${boot.apiBase}/embed/${encodeURIComponent(boot.partner!)}/resolve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "omit",
            cache: "no-store",
            body: JSON.stringify({
              parentOrigin: boot.parentOrigin,
              apartment,
            }),
            signal: active.signal,
          },
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.code ?? "SERVICE_UNAVAILABLE");
        }
        const data = (await response.json()) as ResolvedWidget;
        if (disposed || request !== sequence) return;
        setConfiguration((previous) =>
          refresh && previous?.partner.revision === data.partner.revision
            ? previous
            : data,
        );
        setError("");
        setLoading(false);
        emit("loaded");
      } catch (cause) {
        if (disposed || request !== sequence) return;
        const code =
          cause instanceof Error && /^[A-Z_]{2,60}$/.test(cause.message)
            ? cause.message
            : "NETWORK_ERROR";
        setConfiguration(null);
        setLoading(false);
        setError(
          code === "PARTNER_UNAVAILABLE"
            ? "Գործընկերոջ հաշվիչը հասանելի չէ։"
            : code === "ORIGIN_NOT_ALLOWED"
              ? "Այս կայքի համար հաշվիչը թույլատրված չէ։"
              : code === "NETWORK_ERROR"
                ? "Չհաջողվեց կապվել ֆինանսավորման ծառայության հետ։ Փորձեք կրկին։"
                : `Ինտեգրման տվյալները հնարավոր չէ կիրառել (${code})։ Դիմեք կայքի պատասխանատուին։`,
        );
        emit("error", { code });
      } finally {
        clearTimeout(timeout);
      }
    };
    const message = (event: MessageEvent) => {
      const data = event.data;
      if (
        event.origin !== boot.parentOrigin ||
        event.source !== window.parent ||
        !data ||
        typeof data !== "object" ||
        data.channel !== CHANNEL ||
        data.version !== VERSION ||
        data.instance !== boot.instance ||
        !["init", "update"].includes(data.type)
      )
        return;
      try {
        const parsed = parseWidgetConfiguration(data.configuration);
        if (parsed.partner !== boot.partner)
          throw new Error("PARTNER_MISMATCH");
        if (
          data.type === "init" &&
          JSON.stringify(parsed) === JSON.stringify(current.current)
        )
          return;
        if (data.type === "update") emit("changed");
        void load(parsed);
      } catch {
        sequence++;
        controller?.abort();
        setConfiguration(null);
        setLoading(false);
        setError("Մուտքային տվյալները սխալ են։");
        emit("error", { code: "INVALID_CONFIGURATION" });
      }
    };
    window.addEventListener("message", message);
    emit("ready");
    if (current.current) void load(current.current);
    const interval = setInterval(() => {
      if (current.current && document.visibilityState === "visible")
        void load(current.current, true);
    }, 60_000);
    return () => {
      disposed = true;
      sequence++;
      clearInterval(interval);
      controller?.abort();
      window.removeEventListener("message", message);
    };
  }, [retry]);
  useEffect(() => {
    let animation = 0;
    let last = 0;
    const measure = () => {
      cancelAnimationFrame(animation);
      animation = requestAnimationFrame(() => {
        const height = Math.min(
          20000,
          Math.max(
            200,
            Math.ceil(
              document.getElementById("embed-root")!.getBoundingClientRect()
                .height + 2,
            ),
          ),
        );
        if (height !== last) {
          last = height;
          emit("resize", { height });
        }
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(document.getElementById("embed-root")!);
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animation);
    };
  }, []);
  if (loading)
    return (
      <div className="vk-loading" role="status">
        <span className="vk-spinner" />
        Ֆինանսավորման հաշվիչը բեռնվում է…
      </div>
    );
  if (error || !configuration)
    return (
      <div className="vk-error" role="alert">
        <h1>Հաշվիչը հասանելի չէ</h1>
        <p>{error}</p>
        {validBoot && (
          <button onClick={() => setRetry(retry + 1)}>Փորձել կրկին</button>
        )}
        <p className="vk-fine">Varkonline · Ֆինանսավորման հաշվարկ</p>
      </div>
    );
  return (
    <FinancingCalculator
      key={`${configuration.apartmentId}:${configuration.partner.revision}:${generation}`}
      configuration={configuration}
      notify={notify}
    />
  );
}
createRoot(document.getElementById("embed-root")!).render(
  <Boundary>
    <EmbedApp />
  </Boundary>,
);
