import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Building2,
  Clock,
  Percent,
  Shield,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { trackFormSubmit, trackCTA, trackPageView } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import StructuredData from "@/components/StructuredData";
import PageMeta from "@/components/PageMeta";

interface ScrapedLoan {
  id: string;
  bank_name: string;
  product_name: string;
  loan_category: string;
  loan_type: string | null;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  currency: string;
  term_max_months: number | null;
  max_loan_amount: number | null;
  requires_collateral: boolean;
  source_url: string;
}

interface BankResult {
  name: string;
  productName: string;
  rate: number;
  monthly: number;
  probability: "high" | "medium" | "low";
  eligibilityPercent: number;
  termMonths: number | null;
  maxAmount: number | null;
}

// Map loan purpose to scraped_loans category
const purposeToCategory: Record<string, string> = {
  consumer: "consumer",
  mortgage: "mortgage",
  auto: "car",
  business: "business",
  refinancing: "refinance",
};

export default function Eligibility() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applyBank, setApplyBank] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, locale } = useTranslation();

  const validPurposes = [
    "consumer",
    "mortgage",
    "auto",
    "business",
    "refinancing",
  ];
  const initialPurpose = searchParams.get("type") || "";
  const [amount, setAmount] = useState(2000000);
  const [duration, setDuration] = useState(36);
  const [purpose, setPurpose] = useState(
    validPurposes.includes(initialPurpose) ? initialPurpose : "",
  );
  const [employment, setEmployment] = useState("");
  const [income, setIncome] = useState("");
  const [existingLoans, setExistingLoans] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loans, setLoans] = useState<ScrapedLoan[]>([]);

  const purposes = [
    { value: "consumer", label: t("eligibility.consumer") },
    { value: "mortgage", label: t("eligibility.mortgage") },
    { value: "auto", label: t("eligibility.auto") },
    { value: "business", label: t("eligibility.business") },
    { value: "refinancing", label: t("eligibility.refinancing") },
  ];

  const employmentTypes = [
    { value: "employed", label: t("eligibility.employed") },
    { value: "self-employed", label: t("eligibility.selfEmployed") },
    { value: "business-owner", label: t("eligibility.businessOwner") },
    { value: "pensioner", label: t("eligibility.pensioner") },
  ];

  useEffect(() => {
    trackPageView("/eligibility");
  }, []);

  useEffect(() => {
    if (!purpose) return;
    const category = purposeToCategory[purpose] ?? purpose;
    api
      .getMortgages({ category })
      .then((res) => {
        const items: ScrapedLoan[] = res?.data ?? res ?? [];
        // Only keep products with at least a rate
        setLoans(items.filter((l) => l.interest_rate_min !== null));
      })
      .catch(() => setLoans([]));
  }, [purpose]);

  const canNext = () => {
    if (step === 1) return purpose !== "";
    if (step === 2) return employment !== "" && income !== "";
    if (step === 3) return name.trim() !== "" && phone.trim() !== "";
    return false;
  };

  const results: BankResult[] = useMemo(() => {
    const inc = parseInt(income) || 300000;
    const ratio = amount / (inc * duration);
    const baseScore = Math.max(10, Math.min(98, 100 - ratio * 80));

    const calcMonthly = (r: number) => {
      const mr = r / 100 / 12;
      if (mr === 0) return Math.round(amount / duration);
      return Math.round(
        (amount * mr * Math.pow(1 + mr, duration)) /
          (Math.pow(1 + mr, duration) - 1),
      );
    };

    const calcPercent = (rate: number, allRates: number[]) => {
      const minRate = Math.min(...allRates);
      const maxRate = Math.max(...allRates);
      const spread = maxRate - minRate || 1;
      const bonus = ((rate - minRate) / spread) * 15;
      return Math.round(Math.max(10, Math.min(98, baseScore + bonus)));
    };

    const deriveProb = (pct: number): "high" | "medium" | "low" =>
      pct >= 70 ? "high" : pct >= 40 ? "medium" : "low";

    if (loans.length > 0) {
      // Postgres returns DECIMAL as strings — coerce to number first
      const parsed = loans
        .map((l) => ({
          ...l,
          interest_rate_min: parseFloat(String(l.interest_rate_min)) || 0,
          interest_rate_max: parseFloat(String(l.interest_rate_max)) || 0,
        }))
        .filter((l) => l.interest_rate_min > 0);

      if (parsed.length === 0) return [];

      const rates = parsed.map(
        (l) => (l.interest_rate_min + l.interest_rate_max) / 2,
      );
      return parsed
        .map((l, i) => {
          const rate = Math.round(rates[i] * 100) / 100;
          const pct = calcPercent(rate, rates);
          return {
            name: l.bank_name,
            productName: l.product_name,
            rate,
            monthly: calcMonthly(rate),
            probability: deriveProb(pct),
            eligibilityPercent: pct,
            termMonths: l.term_max_months,
            maxAmount: l.max_loan_amount,
          };
        })
        .sort((a, b) => a.rate - b.rate);
    }

    // Fallback — shown only if scraped data not yet available
    const fallbackRates = [12.5, 13.0, 13.5];
    return [
      {
        name: "ACBA Bank",
        productName: "Consumer Loan",
        rate: 12.5,
        monthly: calcMonthly(12.5),
        probability: deriveProb(calcPercent(12.5, fallbackRates)),
        eligibilityPercent: calcPercent(12.5, fallbackRates),
        termMonths: null,
        maxAmount: null,
      },
      {
        name: "Ameriabank",
        productName: "Consumer Loan",
        rate: 13.0,
        monthly: calcMonthly(13.0),
        probability: deriveProb(calcPercent(13.0, fallbackRates)),
        eligibilityPercent: calcPercent(13.0, fallbackRates),
        termMonths: null,
        maxAmount: null,
      },
      {
        name: "Ardshinbank",
        productName: "Consumer Loan",
        rate: 13.5,
        monthly: calcMonthly(13.5),
        probability: deriveProb(calcPercent(13.5, fallbackRates)),
        eligibilityPercent: calcPercent(13.5, fallbackRates),
        termMonths: null,
        maxAmount: null,
      },
    ];
  }, [amount, duration, income, loans]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const sessionId = localStorage.getItem("session_id") || undefined;
      await api.submitLead({
        full_name: name,
        phone,
        email: email || null,
        loan_amount: amount,
        loan_duration_months: duration,
        loan_purpose: purpose,
        employment_type: employment,
        monthly_income: parseInt(income) || null,
        existing_loans: parseInt(existingLoans) || 0,
        approval_probability: results[0]?.probability || "medium",
        visitor_id: sessionId,
      });
      trackFormSubmit("eligibility", "/eligibility");
      setSubmitted(true);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    }
    setSubmitting(false);
  };

  const probConfig = {
    high: {
      icon: CheckCircle,
      color: "text-accent",
      bg: "bg-accent/10",
      label: t("eligibility.highProb"),
    },
    medium: {
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
      label: t("eligibility.mediumProb"),
    },
    low: {
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      label: t("eligibility.lowProb"),
    },
  };

  if (submitted) {
    const overallProb = results[0]?.probability || "medium";
    const overallConfig = probConfig[overallProb];
    return (
      <main className="section-padding bg-background min-h-screen pb-24 md:pb-16">
        <div className="container-tight max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div
              className={`w-16 h-16 rounded-2xl ${overallConfig.bg} flex items-center justify-center mx-auto mb-5`}
            >
              <overallConfig.icon size={28} className={overallConfig.color} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {t("eligibility.resultsTitle")}
            </h1>
            <p className="text-muted-foreground">
              {t("eligibility.resultsSubtitle")}
            </p>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${overallConfig.bg} ${overallConfig.color} text-sm font-semibold mt-4`}
            >
              <overallConfig.icon size={16} />
              {t("eligibility.overall")}: {overallConfig.label}
            </div>
          </motion.div>

          <div className="space-y-4">
            {results.map((bank, i) => {
              const prob = probConfig[bank.probability];
              return (
                <motion.div
                  key={i}
                  className={`fintech-card ${i === 0 ? "ring-2 ring-accent/40" : ""}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.12) }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl primary-gradient flex items-center justify-center">
                          <Building2
                            size={18}
                            className="text-primary-foreground"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-foreground">
                              {bank.name}
                            </h3>
                            <span
                              className={`text-sm font-extrabold ${prob.color}`}
                            >
                              {bank.eligibilityPercent}%
                            </span>
                            {i === 0 && (
                              <Badge className="bg-accent/15 text-accent border-accent/30 text-[10px] px-1.5 py-0">
                                🏆 Best Offer
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {bank.productName}
                          </p>
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${prob.bg} ${prob.color} mt-1`}
                          >
                            <prob.icon size={11} />
                            {prob.label}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">
                            {t("eligibility.interestRate")}
                          </p>
                          <p className="font-bold text-foreground flex items-center gap-1">
                            <Percent size={12} className="text-accent" />{" "}
                            {bank.rate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">
                            {t("eligibility.monthlyPayment")}
                          </p>
                          <p className="font-bold text-foreground">
                            {bank.monthly.toLocaleString()} AMD
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">
                            {t("eligibility.approvalSpeed")}
                          </p>
                          <p className="font-bold text-foreground flex items-center gap-1">
                            <Clock size={12} className="text-info" /> 1-3 days
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="accent-gradient border-0 text-accent-foreground shrink-0 h-11 px-6 rounded-xl"
                      onClick={() => {
                        trackCTA("apply_now", bank.name);
                        setApplyBank(bank.name);
                      }}
                    >
                      {t("eligibility.applyNow")}
                      <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link to="/compare">{t("eligibility.compareAll")}</Link>
            </Button>
          </div>
        </div>

        {/* Contact popup */}
        <Dialog open={!!applyBank} onOpenChange={() => setApplyBank(null)}>
          <DialogContent className="max-w-sm rounded-2xl text-center">
            <DialogHeader>
              <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-3">
                <Phone size={24} className="text-accent-foreground" />
              </div>
              <DialogTitle className="text-xl font-bold">
                Application Received
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm mt-1">
              We will contact you within{" "}
              <span className="font-semibold text-foreground">24 hours</span>{" "}
              regarding your{" "}
              <span className="font-semibold text-foreground">{applyBank}</span>{" "}
              application.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Our team will review your eligibility and reach out to{" "}
              {phone || "you"} with the best available offer.
            </p>
            <Button
              className="w-full mt-4 accent-gradient border-0 text-accent-foreground rounded-xl h-11"
              onClick={() => setApplyBank(null)}
            >
              Got it
            </Button>
          </DialogContent>
        </Dialog>
      </main>
    );
  }

  return (
    <main className="section-padding bg-background min-h-screen pb-24 md:pb-16">
      <PageMeta
        title="Ստուգեք Ձեր Վարկային Իրավասությունը"
        description="Լրացրեք 3 քայլ և ստացեք անվճար նախնական հաստատում Հայաստանի բանկերից 3 րոպեում։"
        path="/eligibility"
      />
      <StructuredData type="page" locale={locale} path="/eligibility" />
      <div className="container-tight max-w-xl">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Shield size={22} className="text-accent-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {t("eligibility.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("eligibility.subtitle")}
          </p>
        </motion.div>

        <div className="flex items-center gap-3 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${s < step ? "accent-gradient text-accent-foreground" : s === step ? "primary-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {s < step ? <CheckCircle size={14} /> : s}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${s <= step ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {s === 1
                    ? t("eligibility.step1")
                    : s === 2
                      ? t("eligibility.step2")
                      : t("eligibility.step3")}
                </span>
              </div>
              <div
                className={`h-1 rounded-full transition-colors ${s <= step ? "accent-gradient" : "bg-muted"}`}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="fintech-card space-y-6"
            >
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {t("eligibility.loanAmount")}
                </Label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    100K AMD
                  </span>
                  <span className="text-sm font-bold text-primary tabular-nums">
                    {amount.toLocaleString()} AMD
                  </span>
                  <span className="text-xs text-muted-foreground">30M AMD</span>
                </div>
                <Slider
                  value={[amount]}
                  onValueChange={([v]) => setAmount(v)}
                  min={100000}
                  max={30000000}
                  step={100000}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {t("eligibility.duration")}
                </Label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">3</span>
                  <span className="text-sm font-bold text-primary tabular-nums">
                    {duration} {t("eligibility.months")}
                  </span>
                  <span className="text-xs text-muted-foreground">120</span>
                </div>
                <Slider
                  value={[duration]}
                  onValueChange={([v]) => setDuration(v)}
                  min={3}
                  max={120}
                  step={1}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {t("eligibility.loanPurpose")}
                </Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("eligibility.selectPurpose")} />
                  </SelectTrigger>
                  <SelectContent>
                    {purposes.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="fintech-card space-y-6"
            >
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {t("eligibility.employmentType")}
                </Label>
                <Select value={employment} onValueChange={setEmployment}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("eligibility.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {t("eligibility.monthlyIncome")}
                </Label>
                <Input
                  type="number"
                  placeholder={t("eligibility.incomePlaceholder")}
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {t("eligibility.existingLoans")}
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={existingLoans}
                  onChange={(e) => setExistingLoans(e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="fintech-card space-y-6"
            >
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {t("eligibility.fullName")}
                </Label>
                <Input
                  placeholder={t("eligibility.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {t("eligibility.phone")}
                </Label>
                <Input
                  type="tel"
                  placeholder={t("eligibility.phonePlaceholder")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  {t("eligibility.emailOptional")}
                </Label>
                <Input
                  type="email"
                  placeholder={t("eligibility.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Shield size={12} className="text-accent shrink-0" />
                {t("eligibility.privacyNote")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1 h-12 rounded-xl"
            >
              <ArrowLeft size={16} className="mr-2" />
              {t("eligibility.back")}
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex-1 h-12 rounded-xl accent-gradient border-0 text-accent-foreground"
            >
              {t("eligibility.continue")}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
              className="flex-1 h-12 rounded-xl accent-gradient border-0 text-accent-foreground"
            >
              {submitting
                ? t("eligibility.submitting")
                : t("eligibility.seeResults")}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
