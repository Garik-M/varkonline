import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FinancingPartnerList from "@/components/admin/financing/FinancingPartnerList";
import RefundEvidenceEditor from "@/components/admin/financing/RefundEvidenceEditor";
import { refundReviewError } from "@/components/admin/financing/refund-review";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseWidgetConfiguration } from "@/embed/sdk-core";
import PartnerPreview from "@/embed/PartnerPreview";
import { integrationSnippet } from "@/embed/snippet";
import { DEFAULT_ACCENT_COLOR } from "@/embed/appearance";
import type {
  FinancingPartner,
  PartnerConfiguration,
  WidgetConfiguration,
} from "@/embed/types";

// Resource boundaries are editable constraints, never an implied financing offer.
const blankConfiguration = (): PartnerConfiguration => ({
  schemaVersion: 1,
  defaults: {
    currency: "AMD",
    financingType: "mortgage",
    downPaymentPercent: 0,
    durationMonths: 1,
  },
  overrides: [
    "apartmentPrice",
    "currency",
    "financingType",
    "annualInterestRatePercent",
    "downPaymentPercent",
    "durationMonths",
  ],
  allowedFinancingTypes: ["mortgage"],
  allowedCurrencies: ["AMD"],
  limits: {
    apartmentPrice: { min: 1, max: 1e12 },
    annualInterestRatePercent: { min: 0, max: 100 },
    downPaymentPercent: { min: 0, max: 100, step: 1 },
    durationMonths: { min: 1, max: 600, step: 1 },
    supportedDurations: [],
  },
  adjustable: { downPaymentPercent: true, durationMonths: true },
  appearance: {
    theme: "light",
    accentColor: DEFAULT_ACCENT_COLOR,
    logoUrl: null,
  },
  refund: {
    enabled: true,
    defaultDevelopmentId: null,
    developments: [],
    propertyEvidence: [],
  },
});
type Fields = {
  slug: string;
  displayName: string;
  active: boolean;
  origins: string;
  price: string;
  rate: string;
  down: string;
  duration: string;
  terms: string;
  logo: string;
};
const blankFields = (): Fields => ({
  slug: "",
  displayName: "",
  active: false,
  origins: "",
  price: "",
  rate: "",
  down: "",
  duration: "",
  terms: "",
  logo: "",
});
const box = "rounded-xl border bg-card p-5 space-y-4";
const label = "block text-sm font-medium space-y-2";
export default function AdminFinancing({
  create = false,
}: {
  create?: boolean;
}) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [partners, setPartners] = useState<FinancingPartner[]>([]);
  const [selected, setSelected] = useState<FinancingPartner | null>(null);
  const [fields, setFields] = useState(blankFields);
  const [config, setConfig] = useState(blankConfiguration);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [samplePrice, setSamplePrice] = useState("35000000");
  const [sampleRate, setSampleRate] = useState("9");
  const [sampleLanguage, setSampleLanguage] = useState<"hy" | "en" | "ru">(
    "hy",
  );
  const [sampleApartmentId, setSampleApartmentId] =
    useState("preview-apartment");
  const [copied, setCopied] = useState(false);
  const field = (key: keyof Fields, value: string | boolean) =>
    setFields((previous) => ({ ...previous, [key]: value }));
  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      setPartners(await api.request("/financing-partners"));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load partners",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const choose = useCallback((partner: FinancingPartner | null) => {
    setSelected(partner);
    setCopied(false);
    if (!partner) {
      setFields(blankFields());
      const fresh = blankConfiguration();
      setConfig(fresh);
      return;
    }
    const value = partner.configuration;
    setConfig(value);
    setFields({
      slug: partner.slug,
      displayName: partner.displayName,
      active: partner.active,
      origins: partner.allowedOrigins.join("\n"),
      price: value.defaults.apartmentPrice?.toString() ?? "",
      rate: value.defaults.annualInterestRatePercent?.toString() ?? "",
      down: String(value.defaults.downPaymentPercent),
      duration: String(value.defaults.durationMonths),
      terms: value.limits.supportedDurations.join(", "),
      logo: value.appearance.logoUrl ?? "",
    });
    setSamplePrice(String(value.defaults.apartmentPrice ?? 35000000));
    setSampleRate(String(value.defaults.annualInterestRatePercent ?? 9));
  }, []);
  useEffect(() => {
    if (loading || loadError || (!slug && !create)) return;
    choose(
      create
        ? null
        : (partners.find((partner) => partner.slug === slug) ?? null),
    );
  }, [slug, create, partners, loading, loadError, choose]);
  useEffect(() => {
    setTab(create ? "calculator" : "overview");
    setMessage("");
  }, [slug, create]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (!fields.down.trim() || !fields.duration.trim())
        throw new Error(
          "Enter a down payment and duration in Calculator settings before saving.",
        );
      const reviewError = refundReviewError(config.refund);
      if (reviewError) throw new Error(reviewError);
      const configuration: PartnerConfiguration = {
        ...config,
        defaults: {
          ...config.defaults,
          downPaymentPercent: Number(fields.down),
          durationMonths: Number(fields.duration),
          ...(fields.price === ""
            ? {}
            : { apartmentPrice: Number(fields.price) }),
          ...(config.defaults.financingType === "mortgage" && fields.rate !== ""
            ? { annualInterestRatePercent: Number(fields.rate) }
            : {}),
        },
        limits: {
          ...config.limits,
          supportedDurations: fields.terms.trim()
            ? fields.terms.split(",").map((value) => Number(value.trim()))
            : [],
        },
        appearance: {
          ...config.appearance,
          logoUrl: fields.logo.trim() || null,
        },
      };
      delete configuration.defaults.apartmentPrice;
      if (fields.price !== "")
        configuration.defaults.apartmentPrice = Number(fields.price);
      delete configuration.defaults.annualInterestRatePercent;
      if (config.defaults.financingType === "mortgage" && fields.rate !== "")
        configuration.defaults.annualInterestRatePercent = Number(fields.rate);
      const partner = {
        slug: fields.slug,
        displayName: fields.displayName,
        active: fields.active,
        allowedOrigins: fields.origins
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean),
        configuration,
      };
      const saved = (await api.request(
        selected
          ? `/financing-partners/${encodeURIComponent(selected.slug)}`
          : "/financing-partners",
        {
          method: selected ? "PUT" : "POST",
          body: JSON.stringify(
            selected ? { revision: selected.revision, partner } : partner,
          ),
        },
      )) as FinancingPartner;
      choose(saved);
      if (!selected)
        navigate(`/admin/financing/${encodeURIComponent(saved.slug)}`, {
          replace: true,
        });
      await load();
      setMessage(
        "Saved. Active widgets refresh this configuration within 60 seconds.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save configuration",
      );
    } finally {
      setBusy(false);
    }
  }
  const preview = useMemo<WidgetConfiguration | null>(() => {
    if (!selected) return null;
    const saved = selected.configuration;
    const defaults = saved.defaults;
    const value: WidgetConfiguration = {
      partner: selected.slug,
      language: sampleLanguage,
      apartmentId: sampleApartmentId.trim() || "preview-apartment",
    };
    if (saved.overrides.includes("apartmentPrice"))
      value.apartmentPrice =
        samplePrice.trim() === "" ? NaN : Number(samplePrice);
    if (
      saved.overrides.includes("annualInterestRatePercent") &&
      defaults.financingType === "mortgage"
    )
      value.annualInterestRatePercent =
        sampleRate.trim() === "" ? NaN : Number(sampleRate);
    return value;
  }, [selected, samplePrice, sampleRate, sampleApartmentId, sampleLanguage]);
  const snippet = useMemo(() => {
    try {
      return preview
        ? integrationSnippet(
            window.location.origin,
            parseWidgetConfiguration(preview),
          )
        : "";
    } catch {
      return "";
    }
  }, [preview]);
  if (!slug && !create)
    return (
      <FinancingPartnerList
        partners={partners}
        loading={loading}
        error={loadError}
        reload={() => void load()}
      />
    );
  if (loading)
    return (
      <p role="status" className="p-6">
        Loading partner…
      </p>
    );
  if (
    loadError ||
    (!create && !partners.some((partner) => partner.slug === slug))
  )
    return (
      <div className="p-6 space-y-4">
        <Button asChild variant="outline">
          <Link to="/admin/financing">Back to partner list</Link>
        </Button>
        <p role="alert">
          {loadError ||
            "Integration not found. The company may still be waiting to complete its calculator setup."}
        </p>
      </div>
    );
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="space-y-3">
        <Button asChild variant="outline">
          <Link to="/admin/financing">Back to partner list</Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {selected?.displayName ?? "Create integration manually"}
        </h1>
        <p className="text-muted-foreground">
          {selected
            ? "Review this partner’s saved calculator, website access and refund evidence."
            : "Partners normally create their own calculator after approval. This creates a calculator configuration. Account invitations are managed in Applications."}
        </p>
        {selected && (
          <p className="text-sm">
            {selected.active ? "Active integration" : "Paused integration"} ·{" "}
            {selected.slug} · Revision {selected.revision}
          </p>
        )}
      </header>
      {message && (
        <p
          role="status"
          className="p-4 rounded-lg bg-muted whitespace-pre-wrap break-words"
        >
          {message}
        </p>
      )}
      <nav
        aria-label="Integration review sections"
        className="flex flex-wrap gap-2"
      >
        {[
          ["overview", "Overview"],
          ["calculator", "Calculator settings"],
          ["refund", "Refund review"],
          ["sdk", "SDK & preview"],
          ["advanced", "Advanced settings"],
        ]
          .filter(
            ([key]) => !!selected || (key !== "overview" && key !== "sdk"),
          )
          .map(([key, title]) => (
            <Button
              key={key}
              type="button"
              variant={tab === key ? "default" : "outline"}
              aria-pressed={tab === key}
              onClick={() => {
                setTab(key);
                setMessage("");
              }}
            >
              {title}
            </Button>
          ))}
      </nav>
      {selected && tab === "overview" && (
        <section className={box}>
          <h2 className="text-lg font-semibold">Partner overview</h2>
          <dl className="grid sm:grid-cols-2 gap-5 text-sm">
            <div>
              <dt className="text-muted-foreground">Approved websites</dt>
              <dd className="break-all">
                {selected.allowedOrigins.join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Calculator</dt>
              <dd>
                {selected.configuration.defaults.financingType === "mortgage"
                  ? "Mortgage"
                  : "Interest-free developer installments"}{" "}
                · {selected.configuration.defaults.currency}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mortgage interest rate</dt>
              <dd>
                {selected.configuration.defaults.financingType !== "mortgage"
                  ? "Interest-free"
                  : selected.configuration.defaults
                        .annualInterestRatePercent === undefined
                    ? "Supplied per apartment"
                    : `${selected.configuration.defaults.annualInterestRatePercent}% per year (nominal)`}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Down payment & duration</dt>
              <dd>
                {selected.configuration.defaults.downPaymentPercent}% ·{" "}
                {selected.configuration.defaults.durationMonths} months
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Income-tax refund tools</dt>
              <dd>
                {selected.configuration.refund.enabled ? "Visible" : "Hidden"} ·{" "}
                {selected.configuration.refund.developments.length} development
                records ·{" "}
                {selected.configuration.refund.propertyEvidence.length} property
                records
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last saved</dt>
              <dd>{new Date(selected.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground">
            Record counts do not confirm eligibility. Review the facts and
            document references for the relevant apartment. Visitor salary and
            personal eligibility answers are never stored here.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => setTab("calculator")}>
              Edit calculator
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTab("refund")}
            >
              Review refund evidence
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTab("sdk")}
            >
              Open SDK & preview
            </Button>
          </div>
        </section>
      )}
      {tab !== "overview" && tab !== "sdk" && (
        <form onSubmit={save} className="space-y-5">
          {tab === "calculator" && (
            <>
              <section className={box}>
                <h2 className="font-semibold text-lg">
                  Partner & website access
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className={label}>
                    Stable public ID
                    <Input
                      required
                      pattern="[a-z0-9][a-z0-9-]{1,63}"
                      value={fields.slug}
                      disabled={!!selected}
                      onChange={(e) => field("slug", e.target.value)}
                      placeholder="defanse"
                    />
                  </label>
                  <label className={label}>
                    Display name
                    <Input
                      required
                      maxLength={120}
                      value={fields.displayName}
                      onChange={(e) => field("displayName", e.target.value)}
                    />
                  </label>
                </div>
                <label className={label}>
                  Allowed exact website origins (one per line)
                  <textarea
                    required
                    rows={3}
                    className="w-full border rounded-md p-3 font-mono text-sm"
                    value={fields.origins}
                    onChange={(e) => field("origins", e.target.value)}
                    placeholder="https://partner.am"
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  HTTPS required; loopback HTTP is allowed for local testing.
                  Include scheme and port. The www counterpart is included
                  automatically. Other subdomains need their own entry; no paths
                  or wildcards.
                </p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={fields.active}
                    onChange={(e) => field("active", e.target.checked)}
                  />
                  Active integration
                </label>
              </section>
              <section className={box}>
                <h2 className="font-semibold text-lg">Financing defaults</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  <label className={label}>
                    Financing type
                    <select
                      className="w-full border rounded-md p-2"
                      value={config.defaults.financingType}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          allowedFinancingTypes: [
                            ...new Set([
                              ...config.allowedFinancingTypes,
                              e.target.value as
                                | "mortgage"
                                | "developer_installment",
                            ]),
                          ],
                          defaults: {
                            ...config.defaults,
                            financingType: e.target.value as
                              | "mortgage"
                              | "developer_installment",
                          },
                        })
                      }
                    >
                      <option value="mortgage">Mortgage</option>
                      <option value="developer_installment">
                        Interest-free developer installments
                      </option>
                    </select>
                  </label>
                  <label className={label}>
                    Currency
                    <select
                      className="w-full border rounded-md p-2"
                      value={config.defaults.currency}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          allowedCurrencies: [
                            ...new Set([
                              ...config.allowedCurrencies,
                              e.target.value as "AMD" | "USD",
                            ]),
                          ],
                          defaults: {
                            ...config.defaults,
                            currency: e.target.value as "AMD" | "USD",
                          },
                        })
                      }
                    >
                      <option>AMD</option>
                      <option>USD</option>
                    </select>
                  </label>
                  {config.defaults.financingType === "mortgage" && (
                    <label className={label}>
                      Annual nominal rate, %
                      <Input
                        required={
                          !config.overrides.includes(
                            "annualInterestRatePercent",
                          )
                        }
                        placeholder="Optional when each apartment supplies a rate"
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={fields.rate}
                        onChange={(e) => field("rate", e.target.value)}
                      />
                    </label>
                  )}
                  <label className={label}>
                    Down payment, %
                    <Input
                      required
                      type="number"
                      min={0}
                      max={100}
                      step="any"
                      value={fields.down}
                      onChange={(e) => field("down", e.target.value)}
                    />
                  </label>
                  <label className={label}>
                    Duration in months
                    <Input
                      required
                      type="number"
                      min={1}
                      max={600}
                      step={1}
                      value={fields.duration}
                      onChange={(e) => field("duration", e.target.value)}
                    />
                  </label>
                </div>
              </section>
              <section className={box}>
                <h2 className="font-semibold text-lg">Appearance</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  <label className={label}>
                    Accent color
                    <Input
                      type="color"
                      value={config.appearance.accentColor}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          appearance: {
                            ...config.appearance,
                            accentColor: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  <label className={label}>
                    Theme
                    <select
                      className="w-full border rounded-md p-2"
                      aria-label="Theme"
                      value={config.appearance.theme}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          appearance: {
                            ...config.appearance,
                            theme: e.target.value as "light" | "dark",
                          },
                        })
                      }
                    >
                      <option>light</option>
                      <option>dark</option>
                    </select>
                  </label>
                  <label className={label}>
                    HTTPS logo URL (optional)
                    <Input
                      type="url"
                      value={fields.logo}
                      onChange={(e) => field("logo", e.target.value)}
                    />
                  </label>
                </div>
              </section>
            </>
          )}
          {tab === "refund" && (
            <section className={box}>
              <RefundEvidenceEditor
                key={selected?.slug ?? "new"}
                value={config.refund}
                change={(refund) =>
                  setConfig((previous) => ({ ...previous, refund }))
                }
              />
            </section>
          )}
          {tab === "advanced" && (
            <>
              <section className={box}>
                <h2 className="text-lg font-semibold">
                  Optional shared apartment price
                </h2>
                <p className="text-sm text-muted-foreground">
                  Usually each apartment page supplies its own price. Only set a
                  shared price when it applies to this integration.
                </p>{" "}
                <label className={label}>
                  Default apartment price (optional)
                  <Input
                    type="number"
                    min={1}
                    max={1e12}
                    step={1}
                    value={fields.price}
                    onChange={(e) => field("price", e.target.value)}
                  />
                </label>
              </section>
              <section className={box}>
                <h2 className="text-lg font-semibold">
                  Permissions for this integration
                </h2>
                <p className="text-sm text-muted-foreground">
                  These restrict what the partner and apartment pages may
                  supply. Routine term changes belong in Calculator settings.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <fieldset>
                    <legend className="text-sm font-medium mb-2">
                      Allowed financing models
                    </legend>
                    {(["mortgage", "developer_installment"] as const).map(
                      (type) => (
                        <label className="flex gap-2 mb-2" key={type}>
                          <input
                            type="checkbox"
                            checked={config.allowedFinancingTypes.includes(
                              type,
                            )}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                allowedFinancingTypes: e.target.checked
                                  ? [...config.allowedFinancingTypes, type]
                                  : config.allowedFinancingTypes.filter(
                                      (value) => value !== type,
                                    ),
                              })
                            }
                          />
                          {type}
                        </label>
                      ),
                    )}
                  </fieldset>
                  <fieldset>
                    <legend className="text-sm font-medium mb-2">
                      Allowed currencies
                    </legend>
                    {(["AMD", "USD"] as const).map((currency) => (
                      <label key={currency} className="flex gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={config.allowedCurrencies.includes(currency)}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              allowedCurrencies: e.target.checked
                                ? [...config.allowedCurrencies, currency]
                                : config.allowedCurrencies.filter(
                                    (value) => value !== currency,
                                  ),
                            })
                          }
                        />
                        {currency} (whole units)
                      </label>
                    ))}
                  </fieldset>
                </div>
                <fieldset>
                  <legend className="text-sm font-medium mb-2">
                    Permitted apartment overrides
                  </legend>
                  <div className="flex flex-wrap gap-4">
                    {(
                      [
                        "apartmentPrice",
                        "annualInterestRatePercent",
                        "downPaymentPercent",
                        "durationMonths",
                        "financingType",
                        "currency",
                      ] as const
                    ).map((key) => (
                      <label key={key} className="flex gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={config.overrides.includes(key)}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              overrides: e.target.checked
                                ? [...config.overrides, key]
                                : config.overrides.filter(
                                    (value) => value !== key,
                                  ),
                            })
                          }
                        />
                        {key}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </section>
              <section className={box}>
                <h2 className="font-semibold text-lg">
                  Permitted bounds & visitor controls
                </h2>
                <p className="text-xs text-muted-foreground">
                  Set reviewed partner limits. The initial broad bounds are
                  engine resource limits, not lending terms.
                </p>
                {(
                  [
                    "apartmentPrice",
                    "annualInterestRatePercent",
                    "downPaymentPercent",
                    "durationMonths",
                  ] as const
                ).map((key) => (
                  <fieldset
                    className="grid grid-cols-3 sm:grid-cols-4 gap-3 items-end"
                    key={key}
                  >
                    <legend className="text-sm font-medium">{key}</legend>
                    {(
                      [
                        "min",
                        "max",
                        ...("step" in config.limits[key] ? ["step"] : []),
                      ] as ("min" | "max" | "step")[]
                    ).map((bound) => (
                      <label key={bound} className="text-xs">
                        {bound}
                        <Input
                          required
                          type="number"
                          step="any"
                          value={
                            (
                              config.limits[key] as unknown as Record<
                                string,
                                number
                              >
                            )[bound]
                          }
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              limits: {
                                ...config.limits,
                                [key]: {
                                  ...config.limits[key],
                                  [bound]: Number(e.target.value),
                                },
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                  </fieldset>
                ))}
                <label className={label}>
                  Supported durations (comma-separated months, empty = range)
                  <Input
                    value={fields.terms}
                    onChange={(e) => field("terms", e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-5">
                  {(["downPaymentPercent", "durationMonths"] as const).map(
                    (key) => (
                      <label className="flex gap-2 text-sm" key={key}>
                        <input
                          type="checkbox"
                          checked={config.adjustable[key]}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              adjustable: {
                                ...config.adjustable,
                                [key]: e.target.checked,
                              },
                            })
                          }
                        />
                        Visitor may adjust {key}
                      </label>
                    ),
                  )}
                </div>
              </section>
            </>
          )}
          <Button disabled={busy || loading || !!loadError} type="submit">
            {busy
              ? "Saving…"
              : selected
                ? "Save configuration"
                : "Create integration"}
          </Button>
        </form>
      )}
      {tab === "sdk" && selected && preview && (
        <section className={box}>
          <h2 className="font-semibold text-lg">Integration & live preview</h2>
          <p className="text-sm text-muted-foreground">
            Preview uses the saved configuration, real SDK, API and engines.
            Save edits before previewing. Configure apartment override
            permissions to vary sample values.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className={label}>
              Sample apartment ID
              <Input
                aria-label="Sample apartment ID"
                value={sampleApartmentId}
                maxLength={120}
                onChange={(e) => {
                  setSampleApartmentId(e.target.value);
                  setCopied(false);
                }}
              />
              <span className="text-xs text-muted-foreground">
                Use the exact apartment ID from reviewed property evidence to
                preview its refund eligibility.
              </span>
            </label>
            <label className={label}>
              Widget language
              <select
                aria-label="Widget language"
                className="w-full border rounded-md p-2"
                value={sampleLanguage}
                onChange={(event) => {
                  setSampleLanguage(event.target.value as "hy" | "en" | "ru");
                  setCopied(false);
                }}
              >
                <option value="hy">Հայերեն</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
            </label>
            <label className={label}>
              Sample apartment price
              <Input
                type="number"
                value={samplePrice}
                disabled={
                  !selected.configuration.overrides.includes("apartmentPrice")
                }
                onChange={(e) => setSamplePrice(e.target.value)}
              />
            </label>
            <label className={label}>
              Sample annual rate, %
              <Input
                type="number"
                step="any"
                value={sampleRate}
                disabled={
                  !selected.configuration.overrides.includes(
                    "annualInterestRatePercent",
                  ) ||
                  selected.configuration.defaults.financingType !== "mortgage"
                }
                onChange={(e) => setSampleRate(e.target.value)}
              />
            </label>
          </div>
          {selected.active ? (
            <PartnerPreview key={selected.revision} configuration={preview} />
          ) : (
            <p>Activate and save this partner to enable the live preview.</p>
          )}
          <h3 className="font-semibold">Copyable integration code</h3>
          <p className="text-sm">
            Add the script once. Put the widget div in your shared apartment
            template. Replace the sample ID, price and rate with escaped
            CMS/database values for each apartment. Omitted values use permitted
            partner defaults.
          </p>
          <pre className="overflow-x-auto p-4 bg-muted rounded-lg text-xs whitespace-pre-wrap break-all">
            {snippet ||
              "Enter valid sample values to generate integration code."}
          </pre>
          <Button
            type="button"
            variant="outline"
            disabled={!snippet}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(snippet);
                setCopied(true);
              } catch {
                setMessage(
                  "Clipboard unavailable. Select and copy the code manually.",
                );
              }
            }}
          >
            {copied ? "Copied" : "Copy integration code"}
          </Button>
        </section>
      )}
    </div>
  );
}
