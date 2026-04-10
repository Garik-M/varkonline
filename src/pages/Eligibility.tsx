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
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { trackFormSubmit, trackCTA, trackPageView } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import StructuredData from "@/components/StructuredData";

interface LoanProduct {
  id: string;
  name: string;
  interest_rate_min: number;
  interest_rate_max: number;
  approval_time_days: number;
  max_amount: number;
  max_duration_months: number;
  requires_collateral: boolean;
  requires_salary_transfer: boolean;
  early_repayment: boolean;
  loan_type: string;
  banks: { name: string; website: string | null } | null;
}

interface BankResult {
  name: string;
  productName: string;
  rate: number;
  monthly: number;
  speed: string;
  probability: "high" | "medium" | "low";
  eligibilityPercent: number;
  website?: string | null;
}

export default function Eligibility() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const [products, setProducts] = useState<LoanProduct[]>([]);

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
    const fetchProducts = async () => {
      try {
        const data = await api.getProducts({ loan_type: purpose });
        setProducts(data || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
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
    const calcMonthly = (r: number) => {
      const mr = r / 100 / 12;
      return Math.round(
        (amount * mr * Math.pow(1 + mr, duration)) /
          (Math.pow(1 + mr, duration) - 1),
      );
    };

    // Higher interest rate = higher approval percentage (banks with higher rates approve more easily)
    const baseScore = Math.max(10, Math.min(98, 100 - ratio * 80));
    const calcPercent = (rate: number, allRates: number[]) => {
      const minRate = Math.min(...allRates);
      const maxRate = Math.max(...allRates);
      const rateSpread = maxRate - minRate || 1;
      const rateBonus = ((rate - minRate) / rateSpread) * 15; // higher rate = higher bonus
      return Math.round(Math.max(10, Math.min(98, baseScore + rateBonus)));
    };
    const deriveProb = (pct: number): "high" | "medium" | "low" =>
      pct >= 70 ? "high" : pct >= 40 ? "medium" : "low";

    if (products.length > 0) {
      const rates = products.map(
        (p) => (p.interest_rate_min + p.interest_rate_max) / 2,
      );
      return products
        .map((p) => {
          const avgRate = (p.interest_rate_min + p.interest_rate_max) / 2;
          const eligibilityPercent = calcPercent(avgRate, rates);
          return {
            name: (p.banks as any)?.name || "Unknown Bank",
            productName: p.name,
            rate: avgRate,
            monthly: calcMonthly(avgRate),
            speed:
              p.approval_time_days <= 1
                ? t("compare.sameDay")
                : `${p.approval_time_days} ${t("compare.days")}`,
            probability: deriveProb(eligibilityPercent),
            eligibilityPercent,
            website: (p.banks as any)?.website || null,
          };
        })
        .sort((a, b) => a.rate - b.rate);
    }

    const fallbackRates = [12.5, 13.0, 13.5];
    return [
      {
        name: "ACBA Bank",
        productName: "Consumer Loan",
        rate: 12.5,
        monthly: calcMonthly(12.5),
        speed: "1-2 days",
        probability: deriveProb(calcPercent(12.5, fallbackRates)),
        eligibilityPercent: calcPercent(12.5, fallbackRates),
        website: "https://www.acba.am",
      },
      {
        name: "Ameriabank",
        productName: "Consumer Loan",
        rate: 13.0,
        monthly: calcMonthly(13.0),
        speed: t("compare.sameDay"),
        probability: deriveProb(calcPercent(13.0, fallbackRates)),
        eligibilityPercent: calcPercent(13.0, fallbackRates),
        website: "https://ameriabank.am",
      },
      {
        name: "Ardshinbank",
        productName: "Consumer Loan",
        rate: 13.5,
        monthly: calcMonthly(13.5),
        speed: "1-3 days",
        probability: deriveProb(calcPercent(13.5, fallbackRates)),
        eligibilityPercent: calcPercent(13.5, fallbackRates),
        website: "https://ardshinbank.am",
      },
    ];
  }, [amount, duration, income, products, t]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const bestProb = results[0]?.probability || "medium";

    try {
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
        approval_probability: bestProb,
      });

      trackFormSubmit("eligibility", "/eligibility");
      setSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit lead:", err);
      toast({
        title: "Error submitting",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl primary-gradient flex items-center justify-center relative">
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
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${prob.bg} ${prob.color} mt-1`}
                          >
                            <prob.icon size={11} />
                            {prob.label} — {bank.eligibilityPercent}%
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
                            {bank.rate}%
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
                            <Clock size={12} className="text-info" />{" "}
                            {bank.speed}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="accent-gradient border-0 text-accent-foreground shrink-0 h-11 px-6 rounded-xl"
                      onClick={() => {
                        trackCTA("apply_now", bank.name);
                        if (bank.website) {
                          window.open(bank.website, "_blank");
                        } else {
                          toast({
                            title: t("eligibility.applicationSent"),
                            description: (
                              t("eligibility.applicationSentDesc") as string
                            ).replace("{bank}", bank.name),
                          });
                        }
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
      </main>
    );
  }

  return (
    <main className="section-padding bg-background min-h-screen pb-24 md:pb-16">
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
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    s < step
                      ? "accent-gradient text-accent-foreground"
                      : s === step
                        ? "primary-gradient text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
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
