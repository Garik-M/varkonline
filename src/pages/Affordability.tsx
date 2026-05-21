import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Percent,
  Clock,
  ArrowRight,
  Calculator as CalcIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";

const DTI_RATIO = 0.5; // max share of income that can go to all loan payments

export default function Affordability() {
  const { t, lp } = useTranslation();
  const [income, setIncome] = useState<string>("300000");
  const [existingPayments, setExistingPayments] = useState<string>("0");
  const [rate, setRate] = useState<number>(13);
  const [duration, setDuration] = useState<number>(36);

  useEffect(() => {
    trackPageView("/affordability");
  }, []);

  const { maxMonthly, maxLoan, totalRepayment, totalInterest } = useMemo(() => {
    const inc = Math.max(0, parseInt(income) || 0);
    const exist = Math.max(0, parseInt(existingPayments) || 0);
    const available = Math.max(0, inc * DTI_RATIO - exist);
    const mr = rate / 100 / 12;
    const n = duration;
    const principal =
      mr === 0
        ? available * n
        : (available * (Math.pow(1 + mr, n) - 1)) / (mr * Math.pow(1 + mr, n));
    const principalRounded = Math.max(0, Math.round(principal));
    const total = Math.round(available * n);
    return {
      maxMonthly: Math.round(available),
      maxLoan: principalRounded,
      totalRepayment: total,
      totalInterest: Math.max(0, total - principalRounded),
    };
  }, [income, existingPayments, rate, duration]);

  const fmt = (v: number) => v.toLocaleString();

  return (
    <main className="section-padding bg-background min-h-screen pb-24 md:pb-16">
      <div className="container-tight max-w-3xl">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Wallet size={22} className="text-accent-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {t("affordability.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("affordability.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Inputs */}
          <motion.div
            className="fintech-card space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                {t("affordability.income")}
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="300000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("affordability.incomeHint")}
              </p>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                {t("affordability.existingPayments")}
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={existingPayments}
                onChange={(e) => setExistingPayments(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("affordability.existingHint")}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">
                  {t("affordability.duration")}
                </Label>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {duration} {t("affordability.months")}
                </span>
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
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">
                  {t("affordability.rate")}
                </Label>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {rate}%
                </span>
              </div>
              <Slider
                value={[rate]}
                onValueChange={([v]) => setRate(v)}
                min={5}
                max={25}
                step={0.1}
              />
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="fintech-card primary-gradient text-primary-foreground">
              <div className="flex items-center gap-2 mb-2 opacity-90">
                <TrendingUp size={16} />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t("affordability.maxLoan")}
                </span>
              </div>
              <p className="text-3xl md:text-4xl font-extrabold tabular-nums">
                {fmt(maxLoan)}{" "}
                <span className="text-lg font-bold opacity-80">AMD</span>
              </p>
              <p className="text-xs opacity-80 mt-2">
                {t("affordability.basedOn")}
              </p>
            </div>

            <div className="fintech-card">
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <Wallet size={14} />
                <span className="text-xs font-semibold">
                  {t("affordability.maxMonthly")}
                </span>
              </div>
              <p className="text-xl font-bold tabular-nums">
                {fmt(maxMonthly)} AMD
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="fintech-card">
                <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                  <Clock size={12} />
                  <span className="text-xs font-semibold">
                    {t("affordability.totalRepayment")}
                  </span>
                </div>
                <p className="text-base font-bold tabular-nums">
                  {fmt(totalRepayment)}
                </p>
              </div>
              <div className="fintech-card">
                <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                  <Percent size={12} />
                  <span className="text-xs font-semibold">
                    {t("affordability.totalInterest")}
                  </span>
                </div>
                <p className="text-base font-bold tabular-nums">
                  {fmt(totalInterest)}
                </p>
              </div>
            </div>

            <Button
              asChild
              className="w-full h-12 rounded-xl accent-gradient border-0 text-accent-foreground"
            >
              <Link to={lp("/eligibility")}>
                {t("affordability.checkEligibility")}
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-11 rounded-xl"
            >
              <Link to={lp("/calculator")}>
                <CalcIcon size={14} className="mr-2" />
                {t("affordability.openCalculator")}
              </Link>
            </Button>
          </motion.div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6 max-w-xl mx-auto">
          {t("affordability.disclaimer")}
        </p>
      </div>
    </main>
  );
}
