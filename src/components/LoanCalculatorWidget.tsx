import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Calculator } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function LoanCalculatorWidget() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(3000000);
  const [months, setMonths] = useState(36);
  const rate = 13.5;

  const { monthly, total, totalInterest } = useMemo(() => {
    const r = rate / 100 / 12;
    const n = months;
    const m = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return {
      monthly: Math.round(m),
      total: Math.round(m * n),
      totalInterest: Math.round(m * n - amount),
    };
  }, [amount, months]);

  const fmt = (v: number) => new Intl.NumberFormat("en-US").format(v) + " AMD";

  return (
    <section className="section-padding bg-muted/40">
      <div className="container-tight">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">
            {t("calculator.badge")}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("calculator.title")}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t("calculator.subtitle")}
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto fintech-card p-8 md:p-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Calculator size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("calculator.smartCalc")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("calculator.avgRate").replace("{rate}", String(rate))}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">
                  {t("calculator.loanAmount")}
                </label>
                <span className="text-base font-bold text-primary tabular-nums">
                  {fmt(amount)}
                </span>
              </div>
              <Slider
                value={[amount]}
                onValueChange={([v]) => setAmount(v)}
                min={100000}
                max={200000000}
                step={100000}
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>100K</span>
                <span>200M AMD</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">
                  {t("calculator.duration")}
                </label>
                <span className="text-base font-bold text-primary tabular-nums">
                  {months} {t("calculator.months")}
                </span>
              </div>
              <Slider
                value={[months]}
                onValueChange={([v]) => setMonths(v)}
                min={3}
                max={360}
                step={1}
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>3 mo</span>
                <span>360 mo</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 pt-8 border-t border-border">
            <div className="rounded-xl bg-accent/8 border border-accent/15 p-4 text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                {t("calculator.monthlyPayment")}
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-accent tabular-nums leading-tight">
                {new Intl.NumberFormat("en-US").format(monthly)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {t("calculator.amdPerMonth")}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                {t("calculator.totalRepayment")}
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-foreground tabular-nums leading-tight">
                {new Intl.NumberFormat("en-US").format(total)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">AMD</p>
            </div>
            <div className="rounded-xl bg-destructive/6 border border-destructive/12 p-4 text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                {t("calculator.totalInterest")}
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-destructive tabular-nums leading-tight">
                {new Intl.NumberFormat("en-US").format(totalInterest)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">AMD</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
