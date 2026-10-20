import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { integrationSnippet } from "@/embed/snippet";
import { DEFAULT_ACCENT_COLOR } from "@/embed/appearance";
import PartnerPreview from "@/embed/PartnerPreview";
import { parseWidgetConfiguration } from "@/embed/sdk-core";
import type { WidgetConfiguration } from "@/embed/types";
import { PartnerApiError, partnerErrorMessage, partnerRequest, type Company, type Settings } from "./api";
import { messages, type PartnerLanguage } from "./messages";

export default function PartnerApp({ invitation }: { invitation: string | null }) {
  const [lang, setLang] = useState<PartnerLanguage>(() => {
    const value = new URLSearchParams(window.location.search).get("lang");
    return value === "en" || value === "ru" ? value : "hy";
  });
  const c = messages[lang];
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [invite, setInvite] = useState<{ organizationName: string; email: string; requiresExistingPassword: boolean } | null>(null);
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
    setSelectedId(previous => result.companies.some(company => company.applicationId === previous) ? previous : result.companies[0]?.applicationId ?? "");
    setSavedVersion(value => value + 1);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    let live = true;
    async function initialize() {
      try {
        if (invitation) {
          const result = await partnerRequest<{ organizationName: string; email: string; requiresExistingPassword: boolean }>("/auth/invitation", { token: invitation });
          if (live) setInvite(result);
        } else {
          await load();
        }
      } catch (error) {
        if (live && (!(error instanceof PartnerApiError) || error.status !== 401)) setError(error);
      } finally { if (live) setLoading(false); }
    }
    void initialize();
    return () => { live = false; };
  }, [invitation, load]);
  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (invite && !invite.requiresExistingPassword && password !== data.get("confirmPassword")) { setError(c.passwordMismatch); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      if (invite && invitation && !inviteUsed) {
        await partnerRequest("/auth/claim", { token: invitation, password });
        setInviteUsed(true); setInvite(null);
      } else await partnerRequest("/auth/login", { email: data.get("email"), password });
      await load();
    } catch (error) { showError(error); }
    finally { setBusy(false); }
  }
  const selected = companies?.find(company => company.applicationId === selectedId);
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <a href="/" aria-label="Varkonline"><img src="/logo.png" alt="Varkonline" className="h-8 w-auto" /></a>
          <div className="flex gap-3 items-center">
            <select aria-label="Language" className="rounded border bg-background p-2 text-sm" value={lang} onChange={event => setLang(event.target.value as PartnerLanguage)}>
              <option value="hy">Հայերեն</option><option value="en">English</option><option value="ru">Русский</option>
            </select>
            {companies && <Button variant="outline" disabled={busy} onClick={async () => {
              setBusy(true); setError("");
              try { await partnerRequest("/auth/logout", {}); setCompanies(null); setNotice(""); }
              catch (error) { showError(error); } finally { setBusy(false); }
            }}>{c.signOut}</Button>}
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-6">
        <div><h1 className="text-2xl md:text-3xl font-bold">{c.title}</h1><p className="text-muted-foreground mt-2">{c.subtitle}</p></div>
        {error && <div role="alert" className="rounded-lg border border-destructive bg-card p-4 text-destructive break-words">{error}</div>}
        {notice && <p role="status" className="rounded-lg border bg-card p-4">{notice}</p>}
        {loading ? <p role="status">{c.loading}</p> : !companies ? (
          <section className="max-w-lg rounded-2xl border bg-card p-6 space-y-4">
            <h2 className="text-xl font-semibold">{invite ? c.activateTitle : c.signIn}</h2>
            {invite && <p>{invite.organizationName} · {invite.email}</p>}
            {invitation && !invite && !inviteUsed && <p>{c.invalidInvite}</p>}
            <form onSubmit={authenticate} className="space-y-4">
              {!invite && <label className="block space-y-2 text-sm font-medium">{c.email}<Input type="email" name="email" required maxLength={254} autoComplete="username" /></label>}
              <label className="block space-y-2 text-sm font-medium">{invite && !invite.requiresExistingPassword ? c.newPassword : c.password}
                <Input type="password" name="password" required minLength={invite && !invite.requiresExistingPassword ? 12 : 1} maxLength={72} autoComplete={invite && !invite.requiresExistingPassword ? "new-password" : "current-password"} />
              </label>
              {invite && !invite.requiresExistingPassword && <label className="block space-y-2 text-sm font-medium">{c.confirmPassword}<Input type="password" name="confirmPassword" required minLength={12} maxLength={72} autoComplete="new-password" /></label>}
              {invite && <p className="text-sm text-muted-foreground">{invite.requiresExistingPassword ? c.existingPassword : c.passwordHint}</p>}
              <Button disabled={busy} type="submit">{busy ? c.working : invite ? c.activate : c.signIn}</Button>
            </form>
            <p className="text-sm text-muted-foreground">{c.accessHelp} <a href="mailto:info@varkonline.am" className="underline">info@varkonline.am</a></p>
            <a href={lang === "hy" ? "/financing-partners" : `/${lang}/financing-partners`} className="block text-primary underline text-sm">{c.apply}</a>
          </section>
        ) : <>
          <label className="block text-sm font-medium space-y-2">{c.company}
            <select aria-label={c.company} value={selectedId} className="block w-full rounded-lg border bg-card p-3" onChange={event => { setSelectedId(event.target.value); setError(""); setNotice(""); }}>
              {companies.map(company => <option key={company.applicationId} value={company.applicationId}>{company.organizationName}</option>)}
            </select>
          </label>
          {selected && <CompanyWorkspace key={`${selected.applicationId}-${savedVersion}`} company={selected} lang={lang} busy={busy} save={async (settings) => {
            setBusy(true); setError(""); setNotice("");
            try {
              await partnerRequest(`/companies/${selected.applicationId}/settings`, { settings, revision: selected.integration?.revision ?? null }, "PUT");
              await load(); setNotice(c.saved);
            } catch (error) {
              if (error instanceof PartnerApiError && error.status === 401) setCompanies(null);
              showError(error);
            } finally { setBusy(false); }
          }} />}
          <section className="rounded-xl border bg-card p-5 space-y-4">
            <h2 className="font-semibold">{c.changePassword}</h2>
            <form className="grid sm:grid-cols-3 gap-4 items-end" onSubmit={async event => {
              event.preventDefault(); const form = event.currentTarget; const values = new FormData(form);
              if (values.get("newPassword") !== values.get("confirmPassword")) { setError(c.passwordMismatch); return; }
              setBusy(true); setError(""); setNotice("");
              try { await partnerRequest("/auth/password", { currentPassword: values.get("currentPassword"), newPassword: values.get("newPassword") }); form.reset(); setNotice(c.passwordChanged); }
              catch (error) { showError(error); } finally { setBusy(false); }
            }}>
              <label className="text-sm space-y-2">{c.currentPassword}<Input name="currentPassword" type="password" required maxLength={72} autoComplete="current-password" /></label>
              <label className="text-sm space-y-2">{c.newPassword}<Input name="newPassword" type="password" required minLength={12} maxLength={72} autoComplete="new-password" /></label>
              <label className="text-sm space-y-2">{c.confirmPassword}<Input name="confirmPassword" type="password" required minLength={12} maxLength={72} autoComplete="new-password" /></label>
              <Button type="submit" disabled={busy}>{c.changePassword}</Button>
            </form>
          </section>
        </>}
      </main>
    </div>
  );
}

function CompanyWorkspace({ company, lang, busy, save }: { company: Company; lang: PartnerLanguage; busy: boolean; save: (settings: Settings) => Promise<void> }) {
  const c = messages[lang];
  const existing = company.integration;
  const [type, setType] = useState<Settings["financingType"]>(existing?.settings.financingType ?? "mortgage");
  const [currency, setCurrency] = useState<Settings["currency"]>(existing?.settings.currency ?? "AMD");
  const [samplePrice, setSamplePrice] = useState(existing && !existing.overrides.includes("apartmentPrice") ? String(existing.settings.apartmentPrice ?? "") : "");
  const [sampleApartmentId, setSampleApartmentId] = useState("");
  const [widgetLanguage, setWidgetLanguage] = useState<PartnerLanguage>("hy");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [preview, setPreview] = useState<WidgetConfiguration | null>(null);
  let snippet = "";
  if (existing?.active && samplePrice.trim() && Number(samplePrice) >= existing.limits.apartmentPrice.min && Number(samplePrice) <= existing.limits.apartmentPrice.max) {
    try { snippet = integrationSnippet(window.location.origin, parseWidgetConfiguration({ partner: existing.slug, language: widgetLanguage, apartmentId: sampleApartmentId.trim() || "APARTMENT_ID", currency: existing.settings.currency, apartmentPrice: Number(samplePrice) })); } catch { /* Keep invalid sample values out of integration code. */ }
  }
  return <div className="space-y-6">
    <section className="rounded-xl border bg-card p-5 space-y-3">
      <h2 className="font-semibold text-xl">{c.settings}</h2>
      <p className="text-sm text-muted-foreground">{c.explicitTerms}</p>
      <p className="text-sm break-all">{c.approvedWebsite}: {existing?.allowedOrigins.join(", ") ?? company.website}</p>
      {existing && !existing.active && <p role="status" className="text-destructive">{c.paused}</p>}
      <form onSubmit={event => {
        event.preventDefault(); const fields = new FormData(event.currentTarget);
        void save({ financingType: type, currency, downPaymentPercent: Number(fields.get("downPayment")), durationMonths: Number(fields.get("duration")),
          ...(type === "mortgage" ? { annualInterestRatePercent: Number(fields.get("rate")) } : {}),
          theme: String(fields.get("theme")) as Settings["theme"], accentColor: String(fields.get("accentColor")), incomeTaxRefundEnabled: fields.get("incomeTaxRefundEnabled") === "on" });
      }} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-2 text-sm font-medium">{c.financingType}<select aria-label={c.financingType} className="block border rounded-lg p-2 w-full bg-background" value={type} onChange={event => setType(event.target.value as Settings["financingType"])}>
            {(existing?.allowedFinancingTypes ?? ["mortgage", "developer_installment"]).map(value => <option key={value} value={value}>{value === "mortgage" ? c.mortgage : c.installment}</option>)}
          </select></label>
          <label className="space-y-2 text-sm font-medium">{c.currency}<select aria-label={c.currency} className="block border rounded-lg p-2 w-full bg-background" value={currency} onChange={event => setCurrency(event.target.value as Settings["currency"])}>{(existing?.allowedCurrencies ?? ["AMD", "USD"]).map(value => <option key={value}>{value}</option>)}</select></label>
          {type === "mortgage" && <label className="space-y-2 text-sm font-medium">{c.rate}<Input name="rate" type="number" min={existing?.limits.annualInterestRatePercent.min ?? 0} max={existing?.limits.annualInterestRatePercent.max ?? 100} step="any" required defaultValue={existing?.settings.annualInterestRatePercent ?? ""} /></label>}
          <label className="space-y-2 text-sm font-medium">{c.down}<Input name="downPayment" type="number" min={existing?.limits.downPaymentPercent.min ?? 0} max={existing?.limits.downPaymentPercent.max ?? 100} step={existing?.limits.downPaymentPercent.step ?? 0.01} required defaultValue={existing?.settings.downPaymentPercent ?? ""} /></label>
          <label className="space-y-2 text-sm font-medium">{c.duration}{existing?.limits.supportedDurations.length ? <select aria-label={c.duration} name="duration" className="block border rounded-lg p-2 w-full bg-background" defaultValue={existing.settings.durationMonths}>{existing.limits.supportedDurations.map(months => <option key={months} value={months}>{months}</option>)}</select> : <Input name="duration" type="number" min={existing?.limits.durationMonths.min ?? 1} max={existing?.limits.durationMonths.max ?? 600} step={existing?.limits.durationMonths.step ?? 1} required defaultValue={existing?.settings.durationMonths ?? ""} />}</label>
          <label className="space-y-2 text-sm font-medium">{c.theme}<select aria-label={c.theme} name="theme" className="block border rounded-lg p-2 w-full bg-background" defaultValue={existing?.settings.theme ?? "light"}><option value="light">{c.light}</option><option value="dark">{c.dark}</option></select></label>
          <label className="space-y-2 text-sm font-medium">{c.accent}<Input name="accentColor" type="color" defaultValue={existing?.settings.accentColor ?? DEFAULT_ACCENT_COLOR} /></label>
        </div>
        <fieldset className="rounded-lg border p-4 space-y-2">
          <legend className="px-1 text-sm font-semibold">{c.refundTitle}</legend>
          <label className="flex items-start gap-3 text-sm font-medium">
            <input name="incomeTaxRefundEnabled" type="checkbox" className="mt-1" defaultChecked={existing?.settings.incomeTaxRefundEnabled ?? true} />
            <span>{c.refundEnable}</span>
          </label>
          <p className="text-sm text-muted-foreground">{c.refundHelp}</p>
        </fieldset>
        <Button disabled={busy} type="submit">{busy ? c.working : existing ? c.save : c.create}</Button>
      </form>
    </section>
    {existing?.active && <section className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="font-semibold text-xl">{c.integration}</h2>
      {!existing.settings.incomeTaxRefundEnabled && <p className="rounded-lg border p-3 text-sm" role="status">{c.refundDisabled}</p>}
      <p className="text-sm text-muted-foreground">{c.instructions}</p>
      <label className="block text-sm space-y-2 max-w-md">{c.sampleApartmentId}<Input maxLength={120} value={sampleApartmentId} placeholder="A-101" onChange={event => { setSampleApartmentId(event.target.value); setCopied(false); setPreview(null); }} /></label>
      <p className="text-sm text-muted-foreground">{c.sampleApartmentHelp}</p>
      <label className="block text-sm space-y-2 max-w-md">{c.samplePrice} ({existing.settings.currency})<Input type="number" min={existing.limits.apartmentPrice.min} max={existing.limits.apartmentPrice.max} step={1} value={samplePrice} disabled={!existing.overrides.includes("apartmentPrice")} onChange={event => { setSamplePrice(event.target.value); setCopied(false); setPreview(null); }} /></label>
      <label className="block text-sm space-y-2 max-w-md">{c.widgetLanguage}<select aria-label={c.widgetLanguage} className="block border rounded-lg p-2 w-full bg-background" value={widgetLanguage} onChange={event => { setWidgetLanguage(event.target.value as PartnerLanguage); setCopied(false); setPreview(null); }}><option value="hy">Հայերեն</option><option value="en">English</option><option value="ru">Русский</option></select></label>
      <pre data-testid="partner-sdk-code" className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-4 text-xs">{snippet || c.enterSample}</pre>
      <div className="flex flex-wrap gap-3">
        <Button disabled={!snippet} onClick={async () => { try { await navigator.clipboard.writeText(snippet); setCopied(true); setCopyError(false); } catch { setCopyError(true); } }}>{copied ? c.copied : c.copy}</Button>
        <Button variant="outline" disabled={!snippet} onClick={() => { if (existing && snippet) setPreview({ partner: existing.slug, language: widgetLanguage, apartmentId: sampleApartmentId.trim() || "PREVIEW", apartmentPrice: Number(samplePrice), currency: existing.settings.currency }); }}>{c.preview}</Button>
      </div>
      {copyError && <p role="status">{c.copyManually}</p>}
      {preview && <PartnerPreview key={existing.revision} configuration={preview} />}
      <a className="underline text-primary text-sm" href="/docs/financing-integration.md" target="_blank" rel="noreferrer">{c.documentation}</a>
      <p className="text-xs text-muted-foreground">{c.estimates}</p>
    </section>}
  </div>;
}
