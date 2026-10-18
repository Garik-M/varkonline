import { useEffect, useRef, useState, type FormEvent } from "react";
import { Building2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";

const ACKNOWLEDGEMENT_VERSION = "2026-10-18-v2";

export default function FinancingPartners() {
  const { t, lang } = useTranslation();
  const [checkedLanguage, setCheckedLanguage] = useState<string | null>(null);
  const [acceptedLanguage, setAcceptedLanguage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const accepted = acceptedLanguage === lang;
  const checked = checkedLanguage === lang;
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const copy = (key: string): string => t(`financingPartner.${key}`);
  useEffect(() => {
    if (accepted || submitted) {
      window.scrollTo({ top: 0, behavior: "instant" });
      stepHeading.current?.focus({ preventScroll: true });
    }
  }, [accepted, submitted]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted || busy) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError(false);
    try {
      await api.request("/financing-applications", {
        method: "POST",
        body: JSON.stringify({
          organizationName: String(fields.get("organizationName") ?? "").trim(),
          website: String(fields.get("website") ?? "").trim(),
          contactName: String(fields.get("contactName") ?? "").trim(),
          email: String(fields.get("email") ?? "").trim(),
          phone: String(fields.get("phone") ?? "").trim(),
          acknowledgementAccepted: true,
          acknowledgementVersion: ACKNOWLEDGEMENT_VERSION,
          language: lang,
        }),
      });
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-tight px-4 py-12 md:py-20 max-w-4xl mx-auto space-y-8">
      <header className="space-y-4">
        <Building2 className="h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="text-3xl md:text-4xl font-bold">{copy("title")}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">{copy("intro")}</p>
        <a href={`/partner/login?lang=${lang}`} className="inline-block text-primary underline">{copy("partnerLogin")}</a>
      </header>
      {submitted ? (
        <section role="status" className="rounded-2xl border bg-card p-6 space-y-4">
          <CheckCircle2 className="text-primary h-8 w-8" aria-hidden="true" />
          <h2 ref={stepHeading} id="financing-application-step" tabIndex={-1} className="font-semibold text-xl focus:outline-none">{copy("successTitle")}</h2>
          <p>{copy("success")}</p>
        </section>
      ) : !accepted ? (
        <section className="rounded-2xl border bg-card p-6 md:p-8 space-y-5" aria-labelledby="partner-introduction">
          <h2 id="partner-introduction" className="text-xl font-semibold">{copy("readTitle")}</h2>
          <p>{copy("product")}</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>{copy("step1")}</li><li>{copy("step2")}</li><li>{copy("step3")}</li>
          </ol>
          <p className="text-sm text-muted-foreground">{copy("estimates")}</p>
          <div className="border-t pt-5 space-y-3">
            <h3 className="font-semibold">{copy("acknowledgementTitle")}</h3>
            <p className="text-sm">{copy("dataUse")}</p>
            <p className="text-sm">{copy("noActivation")}</p>
            <a className="text-primary underline text-sm" href="/privacy_policy.pdf" target="_blank" rel="noreferrer">{copy("privacy")}</a>
            <p className="text-xs text-muted-foreground">{copy("version")}: {ACKNOWLEDGEMENT_VERSION}</p>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1" checked={checked} onChange={event => setCheckedLanguage(event.target.checked ? lang : null)} />
              <span>{copy("accept")}</span>
            </label>
          </div>
          <Button disabled={!checked} onClick={() => { setAcceptedLanguage(lang); setCheckedLanguage(null); }} className="gap-2">
            {copy("continue")}<ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </section>
      ) : (
        <form onSubmit={submit} className="rounded-2xl border bg-card p-6 md:p-8 space-y-5" aria-label={copy("formTitle")}>
          <h2 ref={stepHeading} id="financing-application-step" tabIndex={-1} className="text-xl font-semibold focus:outline-none">{copy("formTitle")}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <label className="space-y-2 text-sm font-medium">{copy("organization")}<Input name="organizationName" required minLength={2} maxLength={200} autoComplete="organization" /></label>
            <label className="space-y-2 text-sm font-medium">{copy("website")}<Input name="website" type="url" required maxLength={500} placeholder="https://example.am" autoComplete="url" /></label>
            <label className="space-y-2 text-sm font-medium">{copy("contact")}<Input name="contactName" required minLength={2} maxLength={120} autoComplete="name" /></label>
            <label className="space-y-2 text-sm font-medium">{copy("email")}<Input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
            <label className="space-y-2 text-sm font-medium">{copy("phone")}<Input name="phone" type="tel" required minLength={7} maxLength={30} autoComplete="tel" /></label>
          </div>
          <p className="text-sm text-muted-foreground">{copy("contactPurpose")}</p>
          {error && <p role="alert" className="text-destructive">{copy("error")}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>{busy ? copy("submitting") : copy("submit")}</Button>
            <Button type="button" disabled={busy} variant="outline" onClick={() => { setAcceptedLanguage(null); setError(false); window.scrollTo({ top: 0, behavior: "instant" }); }}>{copy("back")}</Button>
          </div>
        </form>
      )}
    </main>
  );
}
