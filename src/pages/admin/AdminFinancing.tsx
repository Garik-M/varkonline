import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseWidgetConfiguration } from "@/embed/sdk-core";
import PartnerPreview from "@/embed/PartnerPreview";
import { integrationSnippet } from "@/embed/snippet";
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
  appearance: { theme: "light", accentColor: "#29986c", logoUrl: null },
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
export default function AdminFinancing() {
  const [partners, setPartners] = useState<FinancingPartner[]>([]);
  const [selected, setSelected] = useState<FinancingPartner | null>(null);
  const [fields, setFields] = useState(blankFields);
  const [config, setConfig] = useState(blankConfiguration);
  const [evidence, setEvidence] = useState(
    JSON.stringify(blankConfiguration().refund, null, 2),
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [samplePrice, setSamplePrice] = useState("35000000");
  const [sampleRate, setSampleRate] = useState("9");
  const [sampleApartmentId, setSampleApartmentId] = useState("preview-apartment");
  const [copied, setCopied] = useState(false);
  const refundDraft = useMemo<Record<string, unknown> | null>(() => {
    try {
      const value: unknown = JSON.parse(evidence);
      return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
    } catch {
      return null;
    }
  }, [evidence]);
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
  function choose(partner: FinancingPartner | null) {
    setSelected(partner);
    setMessage("");
    setCopied(false);
    if (!partner) {
      setFields(blankFields());
      const fresh = blankConfiguration();
      setConfig(fresh);
      setEvidence(JSON.stringify(fresh.refund, null, 2));
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
    setEvidence(JSON.stringify(value.refund, null, 2));
    setSamplePrice(String(value.defaults.apartmentPrice ?? 35000000));
    setSampleRate(String(value.defaults.annualInterestRatePercent ?? 9));
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
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
        refund: JSON.parse(evidence),
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
      setMessage(
        "Saved. Active widgets refresh this configuration within 60 seconds.",
      );
      await load();
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
  }, [selected, samplePrice, sampleRate, sampleApartmentId]);
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
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financing integrations</h1>
        <p className="text-muted-foreground mt-2">
          Staff configuration for saved website integrations. Prospective partners
          apply through Varkonline Financing Partners. All calculations are estimates.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Select financing partner"
          className="border rounded-lg p-2 min-w-0"
          value={selected?.slug ?? ""}
          onChange={(e) =>
            choose(
              partners.find((partner) => partner.slug === e.target.value) ??
                null,
            )
          }
        >
          <option value="">Create new partner</option>
          {partners.map((partner) => (
            <option key={partner.slug} value={partner.slug}>
              {partner.displayName} ({partner.active ? "active" : "inactive"})
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          onClick={() => {
            void load();
          }}
        >
          Reload partner list
        </Button>
        {selected && (
          <Button
            variant="outline"
            onClick={() =>
              choose(
                partners.find((partner) => partner.slug === selected.slug) ??
                  null,
              )
            }
          >
            Discard / reload editor
          </Button>
        )}
      </div>
      {loading && <p role="status">Loading partners…</p>}
      {loadError && <p role="alert" className="text-destructive">{loadError} Integration code is available after a partner configuration can be saved and loaded.</p>}
      {!selected && !loadError && !loading && <p className="text-sm text-muted-foreground">Select a saved integration or create a partner configuration below to generate its SDK code. Application acceptance alone does not create an integration.</p>}
      {message && (
        <p
          role="status"
          className="p-4 rounded-lg bg-muted whitespace-pre-wrap break-words"
        >
          {message}
        </p>
      )}
      <form onSubmit={save} className="space-y-5">
        <section className={box}>
          <h2 className="font-semibold text-lg">Partner & website access</h2>
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
            HTTPS required; loopback HTTP is allowed for local testing. Include
            scheme and port. No paths, wildcards, or subdomain inheritance.
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
            {config.defaults.financingType === "mortgage" && (
              <label className={label}>
                Annual nominal rate, %
                <Input
                  required={
                    !config.overrides.includes("annualInterestRatePercent")
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
          <div className="grid sm:grid-cols-2 gap-4">
            <fieldset>
              <legend className="text-sm font-medium mb-2">
                Allowed financing models
              </legend>
              {(["mortgage", "developer_installment"] as const).map((type) => (
                <label className="flex gap-2 mb-2" key={type}>
                  <input
                    type="checkbox"
                    checked={config.allowedFinancingTypes.includes(type)}
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
              ))}
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
                          : config.overrides.filter((value) => value !== key),
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
            Set reviewed partner limits. The initial broad bounds are engine
            resource limits, not lending terms.
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
                      (config.limits[key] as unknown as Record<string, number>)[
                        bound
                      ]
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
            {(["downPaymentPercent", "durationMonths"] as const).map((key) => (
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
            ))}
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
        <section className={box}>
          <h2 className="font-semibold text-lg">
            Refund policy & reviewed property evidence
          </h2>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={refundDraft?.enabled === true}
              disabled={!refundDraft}
              onChange={(e) => setEvidence(JSON.stringify({ ...refundDraft, enabled: e.target.checked }, null, 2))}
            />
            Show income-tax refund tools for mortgages
          </label>
          <p className="text-sm text-muted-foreground">
            Showing the tools does not confirm eligibility. Save before previewing.
            Unreviewed properties show the missing evidence and a separate salary-tax estimate.
            Development facts may
            cover acquisition type, exact location, permit decision and
            self-build permit. Lender, price, title, documents and origination
            evidence belong to individual properties. Unknown facts must remain
            null or unverified. Each reviewed record needs a documentary
            verificationReference (at least 8 characters); it is kept private.
            These facts never override the legal engine.
          </p>
          <textarea
            aria-label="Refund configuration JSON"
            className="w-full border rounded-md p-3 font-mono text-xs"
            rows={18}
            spellCheck={false}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
          />
          <p className="text-xs">
            Evidence schema and complete examples:{" "}
            <a
              href="/docs/financing-integration.md"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Integration documentation
            </a>
            . Property exceptions are optional; apartment prices still come from
            the partner website.
          </p>
        </section>
        <Button disabled={busy || loading || !!loadError} type="submit">
          {busy
            ? "Saving…"
            : selected
              ? "Save configuration"
              : "Create partner"}
        </Button>
      </form>
      {selected && preview && (
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
                onChange={(e) => { setSampleApartmentId(e.target.value); setCopied(false); }}
              />
              <span className="text-xs text-muted-foreground">
                Use the exact apartment ID from reviewed property evidence to preview its refund eligibility.
              </span>
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
