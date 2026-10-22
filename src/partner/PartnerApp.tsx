import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { integrationSnippet } from "@/embed/snippet";
import { DEFAULT_ACCENT_COLOR } from "@/embed/appearance";
import CalculatorControlsEditor from "@/components/financing/CalculatorControlsEditor";
import AnalyticsPanel from "@/components/financing/AnalyticsPanel";
import DraftCalculatorPreview from "@/components/financing/DraftCalculatorPreview";
import {
  mortgageControlPreset,
  LEGACY_CALCULATOR_OPTIONS,
} from "@/embed/calculator-options";
import type { PartnerConfiguration } from "@/embed/types";
import PartnerPreview from "@/embed/PartnerPreview";
import { parseWidgetConfiguration } from "@/embed/sdk-core";
import type { WidgetConfiguration } from "@/embed/types";
import {
  PartnerApiError,
  partnerErrorMessage,
  partnerRequest,
  type Company,
  type Settings,
} from "./api";
import { messages, type PartnerLanguage } from "./messages";

export default function PartnerApp({
  invitation,
}: {
  invitation: string | null;
}) {
  const [lang, setLang] = useState<PartnerLanguage>(() => {
    const value = new URLSearchParams(window.location.search).get("lang");
    return value === "en" || value === "ru" ? value : "hy";
  });
  const c = messages[lang];
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [invite, setInvite] = useState<{
    organizationName: string;
    email: string;
    requiresExistingPassword: boolean;
  } | null>(null);
  const [inviteUsed, setInviteUsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failure, setError] = useState<unknown>(null);
  const error = partnerErrorMessage(failure, c);
  const [notice, setNotice] = useState("");
  const [savedVersion, setSavedVersion] = useState(0);
  const showError = (error: unknown) => setError(error);
  const load = useCallback(async () => {
    const result = await partnerRequest<{ companies: Company[] }>("/workspace");
    setCompanies(result.companies);
    setSelectedId((previous) =>
      result.companies.some((company) => company.applicationId === previous)
        ? previous
        : (result.companies[0]?.applicationId ?? ""),
    );
    setSavedVersion((value) => value + 1);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    let live = true;
    async function initialize() {
      try {
        if (invitation) {
          const result = await partnerRequest<{
            organizationName: string;
            email: string;
            requiresExistingPassword: boolean;
          }>("/auth/invitation", { token: invitation });
          if (live) setInvite(result);
        } else {
          await load();
        }
      } catch (error) {
        if (
          live &&
          (!(error instanceof PartnerApiError) || error.status !== 401)
        )
          setError(error);
      } finally {
        if (live) setLoading(false);
      }
    }
    void initialize();
    return () => {
      live = false;
    };
  }, [invitation, load]);
  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (
      invite &&
      !invite.requiresExistingPassword &&
      password !== data.get("confirmPassword")
    ) {
      setError(c.passwordMismatch);
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (invite && invitation && !inviteUsed) {
        await partnerRequest("/auth/claim", { token: invitation, password });
        setInviteUsed(true);
        setInvite(null);
      } else
        await partnerRequest("/auth/login", {
          email: data.get("email"),
          password,
        });
      await load();
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }
  const selected = companies?.find(
    (company) => company.applicationId === selectedId,
  );
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <a href="/" aria-label="Varkonline">
            <img src="/logo.png" alt="Varkonline" className="h-8 w-auto" />
          </a>
          <div className="flex gap-3 items-center">
            <select
              aria-label="Language"
              className="rounded border bg-background p-2 text-sm"
              value={lang}
              onChange={(event) =>
                setLang(event.target.value as PartnerLanguage)
              }
            >
              <option value="hy">Հայերեն</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
            {companies && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    await partnerRequest("/auth/logout", {});
                    setCompanies(null);
                    setNotice("");
                  } catch (error) {
                    showError(error);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {c.signOut}
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{c.title}</h1>
          <p className="text-muted-foreground mt-2">{c.subtitle}</p>
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive bg-card p-4 text-destructive break-words"
          >
            {error}
          </div>
        )}
        {notice && (
          <p role="status" className="rounded-lg border bg-card p-4">
            {notice}
          </p>
        )}
        {loading ? (
          <p role="status">{c.loading}</p>
        ) : !companies ? (
          <section className="max-w-lg rounded-2xl border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">
              {invite ? c.activateTitle : c.signIn}
            </h2>
            {invite && (
              <p>
                {invite.organizationName} · {invite.email}
              </p>
            )}
            {invitation && !invite && !inviteUsed && <p>{c.invalidInvite}</p>}
            <form onSubmit={authenticate} className="space-y-4">
              {!invite && (
                <label className="block space-y-2 text-sm font-medium">
                  {c.email}
                  <Input
                    type="email"
                    name="email"
                    required
                    maxLength={254}
                    autoComplete="username"
                  />
                </label>
              )}
              <label className="block space-y-2 text-sm font-medium">
                {invite && !invite.requiresExistingPassword
                  ? c.newPassword
                  : c.password}
                <Input
                  type="password"
                  name="password"
                  required
                  minLength={
                    invite && !invite.requiresExistingPassword ? 12 : 1
                  }
                  maxLength={72}
                  autoComplete={
                    invite && !invite.requiresExistingPassword
                      ? "new-password"
                      : "current-password"
                  }
                />
              </label>
              {invite && !invite.requiresExistingPassword && (
                <label className="block space-y-2 text-sm font-medium">
                  {c.confirmPassword}
                  <Input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                  />
                </label>
              )}
              {invite && (
                <p className="text-sm text-muted-foreground">
                  {invite.requiresExistingPassword
                    ? c.existingPassword
                    : c.passwordHint}
                </p>
              )}
              <Button disabled={busy} type="submit">
                {busy ? c.working : invite ? c.activate : c.signIn}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground">
              {c.accessHelp}{" "}
              <a href="mailto:info@varkonline.am" className="underline">
                info@varkonline.am
              </a>
            </p>
            <a
              href={
                lang === "hy"
                  ? "/financing-partners"
                  : `/${lang}/financing-partners`
              }
              className="block text-primary underline text-sm"
            >
              {c.apply}
            </a>
          </section>
        ) : (
          <>
            <label className="block text-sm font-medium space-y-2">
              {c.company}
              <select
                aria-label={c.company}
                value={selectedId}
                className="block w-full rounded-lg border bg-card p-3"
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setError("");
                  setNotice("");
                }}
              >
                {companies.map((company) => (
                  <option
                    key={company.applicationId}
                    value={company.applicationId}
                  >
                    {company.organizationName}
                  </option>
                ))}
              </select>
            </label>
            {selected && (
              <CompanyWorkspace
                key={`${selected.applicationId}-${savedVersion}`}
                company={selected}
                lang={lang}
                busy={busy}
                save={async (settings) => {
                  setBusy(true);
                  setError("");
                  setNotice("");
                  try {
                    await partnerRequest(
                      `/companies/${selected.applicationId}/settings`,
                      {
                        settings,
                        revision: selected.integration?.revision ?? null,
                      },
                      "PUT",
                    );
                    await load();
                    setNotice(c.saved);
                  } catch (error) {
                    if (
                      error instanceof PartnerApiError &&
                      error.status === 401
                    )
                      setCompanies(null);
                    showError(error);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            )}
            <section className="rounded-xl border bg-card p-5 space-y-4">
              <h2 className="font-semibold">{c.changePassword}</h2>
              <form
                className="grid sm:grid-cols-3 gap-4 items-end"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const values = new FormData(form);
                  if (
                    values.get("newPassword") !== values.get("confirmPassword")
                  ) {
                    setError(c.passwordMismatch);
                    return;
                  }
                  setBusy(true);
                  setError("");
                  setNotice("");
                  try {
                    await partnerRequest("/auth/password", {
                      currentPassword: values.get("currentPassword"),
                      newPassword: values.get("newPassword"),
                    });
                    form.reset();
                    setNotice(c.passwordChanged);
                  } catch (error) {
                    showError(error);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="text-sm space-y-2">
                  {c.currentPassword}
                  <Input
                    name="currentPassword"
                    type="password"
                    required
                    maxLength={72}
                    autoComplete="current-password"
                  />
                </label>
                <label className="text-sm space-y-2">
                  {c.newPassword}
                  <Input
                    name="newPassword"
                    type="password"
                    required
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                  />
                </label>
                <label className="text-sm space-y-2">
                  {c.confirmPassword}
                  <Input
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                  />
                </label>
                <Button type="submit" disabled={busy}>
                  {c.changePassword}
                </Button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function CompanyWorkspace({
  company,
  lang,
  busy,
  save,
}: {
  company: Company;
  lang: PartnerLanguage;
  busy: boolean;
  save: (settings: Settings) => Promise<void>;
}) {
  const c = messages[lang];
  const existing = company.integration;
  const [tab, setTab] = useState<"calculator" | "sdk" | "analytics">(
    existing?.active ? "sdk" : "calculator",
  );
  const [type, setType] = useState<Settings["financingType"]>(
    existing?.settings.financingType ?? "mortgage",
  );
  const [controls, setControls] = useState(
    () =>
      existing?.settings.controls ??
      (existing
        ? {
            limits: existing.limits,
            adjustable: { downPaymentPercent: true, durationMonths: true },
            calculator: LEGACY_CALCULATOR_OPTIONS,
          }
        : mortgageControlPreset()),
  );
  const factor = type === "mortgage" ? 12 : 1;
  const [defaultDown, setDefaultDown] = useState(
    String(existing?.settings.downPaymentPercent ?? 20),
  );
  const [defaultMonths, setDefaultMonths] = useState(
    String(existing?.settings.durationMonths ?? 240),
  );
  const [defaultRate, setDefaultRate] = useState(
    existing?.settings.annualInterestRatePercent?.toString() ?? "",
  );
  const [theme, setTheme] = useState<"light" | "dark">(
    existing?.settings.theme ?? "light",
  );
  const [accent, setAccent] = useState(
    existing?.settings.accentColor ?? DEFAULT_ACCENT_COLOR,
  );
  const [refundEnabled, setRefundEnabled] = useState(
    existing?.settings.incomeTaxRefundEnabled ?? true,
  );
  const [currency, setCurrency] = useState<Settings["currency"]>(
    existing?.settings.currency ?? "AMD",
  );
  const [samplePrice, setSamplePrice] = useState(
    existing && !existing.overrides.includes("apartmentPrice")
      ? String(existing.settings.apartmentPrice ?? "")
      : "",
  );
  const [sampleApartmentId, setSampleApartmentId] = useState("");
  const [widgetLanguage, setWidgetLanguage] = useState<PartnerLanguage>(
    existing?.settings.controls?.calculator?.defaultLanguage ?? "hy",
  );
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [preview, setPreview] = useState<WidgetConfiguration | null>(null);
  const analyticsRequest = useCallback(
    <T,>(path: string) =>
      partnerRequest<T>(`/companies/${company.applicationId}/analytics${path}`),
    [company.applicationId],
  );
  const draftConfig: PartnerConfiguration = {
    schemaVersion: 1,
    ...controls,
    defaults: {
      financingType: type,
      currency,
      downPaymentPercent: defaultDown.trim() ? Number(defaultDown) : NaN,
      durationMonths: defaultMonths.trim() ? Number(defaultMonths) : NaN,
      ...(type === "mortgage"
        ? {
            annualInterestRatePercent: defaultRate.trim()
              ? Number(defaultRate)
              : NaN,
          }
        : {}),
    },
    overrides: existing?.overrides ?? [
      "apartmentPrice",
      "annualInterestRatePercent",
    ],
    allowedCurrencies: [currency],
    allowedFinancingTypes: [type],
    appearance: { theme, accentColor: accent, logoUrl: null },
    refund: {
      enabled: refundEnabled,
      defaultDevelopmentId: null,
      developments: [],
      propertyEvidence: [],
    },
  };
  let snippet = "";
  if (
    existing?.active &&
    samplePrice.trim() &&
    Number(samplePrice) >= existing.limits.apartmentPrice.min &&
    Number(samplePrice) <= existing.limits.apartmentPrice.max
  ) {
    try {
      snippet = integrationSnippet(
        window.location.origin,
        parseWidgetConfiguration({
          partner: existing.slug,
          language: widgetLanguage,
          apartmentId: sampleApartmentId.trim() || "APARTMENT_ID",
          currency: existing.settings.currency,
          apartmentPrice: Number(samplePrice),
        }),
      );
    } catch {
      /* Keep invalid sample values out of integration code. */
    }
  }
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2" aria-label={c.settings}>
        {(
          [
            ["calculator", c.settings],
            ["sdk", { hy: "SDK կոդ", en: "SDK code", ru: "SDK код" }[lang]],
            [
              "analytics",
              { hy: "Վերլուծություն", en: "Analytics", ru: "Аналитика" }[lang],
            ],
          ] as const
        ).map(([key, title]) => (
          <Button
            key={key}
            type="button"
            variant={tab === key ? "default" : "outline"}
            aria-pressed={tab === key}
            disabled={key !== "calculator" && !existing}
            onClick={() => setTab(key)}
          >
            {title}
          </Button>
        ))}
      </nav>
      <div
        className={
          tab === "calculator"
            ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
            : "space-y-6"
        }
      >
        {tab === "calculator" && (
          <section className="min-w-0 rounded-xl border bg-card p-5 space-y-3">
            <h2 className="font-semibold text-xl">{c.settings}</h2>
            <p className="text-sm text-muted-foreground">{c.explicitTerms}</p>
            <p className="text-sm break-all">
              {c.approvedWebsite}:{" "}
              {existing?.allowedOrigins.join(", ") ?? company.website}
            </p>
            {existing && !existing.active && (
              <p role="status" className="text-destructive">
                {c.paused}
              </p>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save({
                  financingType: type,
                  currency,
                  downPaymentPercent: Number(defaultDown),
                  durationMonths: Number(defaultMonths),
                  controls,
                  ...(type === "mortgage" && defaultRate.trim()
                    ? { annualInterestRatePercent: Number(defaultRate) }
                    : {}),
                  theme,
                  accentColor: accent,
                  incomeTaxRefundEnabled: refundEnabled,
                });
              }}
              className="space-y-5"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm font-medium">
                  {c.financingType}
                  <select
                    aria-label={c.financingType}
                    className="block border rounded-lg p-2 w-full bg-background"
                    value={type}
                    onChange={(event) => {
                      const next = event.target
                        .value as Settings["financingType"];
                      setType(next);
                      if (next === "developer_installment") {
                        setDefaultMonths("36");
                        setControls({
                          ...controls,
                          calculator: {
                            ...(controls.calculator ??
                              LEGACY_CALCULATOR_OPTIONS),
                            durationUnit: "months",
                          },
                          limits: {
                            ...controls.limits,
                            durationMonths: { min: 1, max: 600, step: 1 },
                            supportedDurations: [],
                          },
                        });
                      } else {
                        setDefaultMonths("240");
                        setControls({
                          ...mortgageControlPreset(),
                          calculator: {
                            ...(controls.calculator ??
                              mortgageControlPreset().calculator),
                            durationUnit: "years",
                          },
                        });
                      }
                    }}
                  >
                    {(
                      existing?.allowedFinancingTypes ?? [
                        "mortgage",
                        "developer_installment",
                      ]
                    ).map((value) => (
                      <option key={value} value={value}>
                        {value === "mortgage" ? c.mortgage : c.installment}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  {c.currency}
                  <select
                    aria-label={c.currency}
                    className="block border rounded-lg p-2 w-full bg-background"
                    value={currency}
                    onChange={(event) =>
                      setCurrency(event.target.value as Settings["currency"])
                    }
                  >
                    {(existing?.allowedCurrencies ?? ["AMD", "USD"]).map(
                      (value) => (
                        <option key={value}>{value}</option>
                      ),
                    )}
                  </select>
                </label>
                {type === "mortgage" && (
                  <label className="space-y-2 text-sm font-medium">
                    {c.rate}{" "}
                    {controls.calculator?.priceRateRule?.currency ===
                      currency && (
                      <span className="text-muted-foreground">
                        ({c.optional})
                      </span>
                    )}
                    <Input
                      name="rate"
                      aria-label={c.rate}
                      type="number"
                      min={controls.limits.annualInterestRatePercent.min}
                      max={controls.limits.annualInterestRatePercent.max}
                      step="any"
                      required={
                        controls.calculator?.priceRateRule?.currency !==
                        currency
                      }
                      placeholder={c.automaticRate}
                      value={defaultRate}
                      onChange={(event) => setDefaultRate(event.target.value)}
                    />
                    <small className="block text-muted-foreground">
                      {c.rateHelp}
                    </small>
                  </label>
                )}
                <label className="space-y-2 text-sm font-medium">
                  {c.down}
                  <Input
                    name="downPayment"
                    type="number"
                    min={controls.limits.downPaymentPercent.min}
                    max={controls.limits.downPaymentPercent.max}
                    step="any"
                    required
                    value={defaultDown}
                    onChange={(event) => setDefaultDown(event.target.value)}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  {factor === 12
                    ? {
                        hy: "Ժամկետ, տարի",
                        en: "Default term, years",
                        ru: "Срок по умолчанию, лет",
                      }[lang]
                    : c.duration}
                  <Input
                    name="duration"
                    type="number"
                    min={controls.limits.durationMonths.min / factor}
                    max={controls.limits.durationMonths.max / factor}
                    step={controls.limits.durationMonths.step / factor}
                    required
                    value={
                      defaultMonths === "" ? "" : Number(defaultMonths) / factor
                    }
                    onChange={(event) =>
                      setDefaultMonths(
                        event.target.value === ""
                          ? ""
                          : String(Number(event.target.value) * factor),
                      )
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  {c.theme}
                  <select
                    aria-label={c.theme}
                    name="theme"
                    className="block border rounded-lg p-2 w-full bg-background"
                    value={theme}
                    onChange={(event) =>
                      setTheme(event.target.value as typeof theme)
                    }
                  >
                    <option value="light">{c.light}</option>
                    <option value="dark">{c.dark}</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  {c.accent}
                  <Input
                    name="accentColor"
                    type="color"
                    value={accent}
                    onChange={(event) => setAccent(event.target.value)}
                  />
                </label>
              </div>
              <fieldset className="rounded-lg border p-4 space-y-2">
                <legend className="px-1 text-sm font-semibold">
                  {c.refundTitle}
                </legend>
                <label className="flex items-start gap-3 text-sm font-medium">
                  <input
                    name="incomeTaxRefundEnabled"
                    type="checkbox"
                    className="mt-1"
                    checked={refundEnabled}
                    onChange={(event) => setRefundEnabled(event.target.checked)}
                  />
                  <span>{c.refundEnable}</span>
                </label>
                <p className="text-sm text-muted-foreground">{c.refundHelp}</p>
              </fieldset>
              <CalculatorControlsEditor
                value={controls}
                onChange={setControls}
                mortgage={type === "mortgage"}
                language={lang}
              />
              <Button disabled={busy} type="submit">
                {busy ? c.working : existing ? c.save : c.create}
              </Button>
            </form>
          </section>
        )}
        {tab === "calculator" && (
          <aside className="min-w-0 order-first rounded-xl border bg-card p-5 space-y-4 xl:order-last xl:sticky xl:top-6 xl:max-h-[calc(100dvh-5rem)] xl:overflow-y-auto">
            <h2 className="font-semibold">
              {
                {
                  hy: "Կենդանի նախադիտում",
                  en: "Live draft preview",
                  ru: "Предпросмотр изменений",
                }[lang]
              }
            </h2>
            <p className="text-xs text-muted-foreground">
              {
                {
                  hy: "Փոփոխությունները կայքում կիրառվում են միայն պահպանելուց հետո։",
                  en: "Changes reach your website only after saving. This preview does not collect analytics.",
                  ru: "Изменения попадут на сайт после сохранения. Предпросмотр не собирает аналитику.",
                }[lang]
              }
            </p>
            <label className="block text-sm space-y-2">
              {
                {
                  hy: "Նախադիտման բնակարանի գին",
                  en: "Preview apartment price",
                  ru: "Цена квартиры в предпросмотре",
                }[lang]
              }{" "}
              ({currency})
              <Input
                type="number"
                min={1}
                max={1e12}
                step={1}
                value={samplePrice}
                placeholder="35000000"
                onChange={(event) => setSamplePrice(event.target.value)}
              />
            </label>
            <DraftCalculatorPreview
              configuration={draftConfig}
              name={company.organizationName}
              price={samplePrice.trim() ? Number(samplePrice) : 35000000}
              language={lang}
            />
          </aside>
        )}
        {existing && tab === "analytics" && (
          <AnalyticsPanel request={analyticsRequest} language={lang} />
        )}
        {existing?.active && tab === "sdk" && (
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-xl">{c.integration}</h2>
            {!existing.settings.incomeTaxRefundEnabled && (
              <p className="rounded-lg border p-3 text-sm" role="status">
                {c.refundDisabled}
              </p>
            )}
            <p className="text-sm text-muted-foreground">{c.instructions}</p>
            <label className="block text-sm space-y-2 max-w-md">
              {c.sampleApartmentId}
              <Input
                maxLength={120}
                value={sampleApartmentId}
                placeholder="A-101"
                onChange={(event) => {
                  setSampleApartmentId(event.target.value);
                  setCopied(false);
                  setPreview(null);
                }}
              />
            </label>
            <p className="text-sm text-muted-foreground">
              {c.sampleApartmentHelp}
            </p>
            <label className="block text-sm space-y-2 max-w-md">
              {c.samplePrice} ({existing.settings.currency})
              <Input
                type="number"
                min={existing.limits.apartmentPrice.min}
                max={existing.limits.apartmentPrice.max}
                step={1}
                value={samplePrice}
                disabled={!existing.overrides.includes("apartmentPrice")}
                onChange={(event) => {
                  setSamplePrice(event.target.value);
                  setCopied(false);
                  setPreview(null);
                }}
              />
            </label>
            <label className="block text-sm space-y-2 max-w-md">
              {c.widgetLanguage}
              <select
                aria-label={c.widgetLanguage}
                className="block border rounded-lg p-2 w-full bg-background"
                value={widgetLanguage}
                onChange={(event) => {
                  setWidgetLanguage(event.target.value as PartnerLanguage);
                  setCopied(false);
                  setPreview(null);
                }}
              >
                <option value="hy">Հայերեն</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
            </label>
            <pre
              data-testid="partner-sdk-code"
              className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-4 text-xs"
            >
              {snippet || c.enterSample}
            </pre>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={!snippet}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(snippet);
                    setCopied(true);
                    setCopyError(false);
                  } catch {
                    setCopyError(true);
                  }
                }}
              >
                {copied ? c.copied : c.copy}
              </Button>
              <Button
                variant="outline"
                disabled={!snippet}
                onClick={() => {
                  if (existing && snippet)
                    setPreview({
                      partner: existing.slug,
                      language: widgetLanguage,
                      apartmentId: sampleApartmentId.trim() || "PREVIEW",
                      apartmentPrice: Number(samplePrice),
                      currency: existing.settings.currency,
                    });
                }}
              >
                {c.preview}
              </Button>
            </div>
            {copyError && <p role="status">{c.copyManually}</p>}
            {preview && (
              <PartnerPreview key={existing.revision} configuration={preview} />
            )}
            <a
              className="underline text-primary text-sm"
              href="/docs/financing-integration.md"
              target="_blank"
              rel="noreferrer"
            >
              {c.documentation}
            </a>
            <p className="text-xs text-muted-foreground">{c.estimates}</p>
          </section>
        )}
      </div>
    </div>
  );
}
