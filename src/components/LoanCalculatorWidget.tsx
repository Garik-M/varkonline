import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Calculator } from "lucide-react";

export default function LoanCalculatorWidget() {
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
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">Quick Estimate</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Loan Calculator</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Estimate your monthly payment and total cost before applying.
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
              <p className="text-sm font-semibold text-foreground">Smart Calculator</p>
              <p className="text-xs text-muted-foreground">Average rate: {rate}% APR</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">Loan Amount</label>
                <span className="text-base font-bold text-primary tabular-nums">{fmt(amount)}</span>
              </div>
              <Slider
                value={[amount]}
                onValueChange={([v]) => setAmount(v)}
                min={100000}
                max={30000000}
                step={100000}
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>100K</span>
                <span>30M AMD</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">Duration</label>
                <span className="text-base font-bold text-primary tabular-nums">{months} months</span>
              </div>
              <Slider
                value={[months]}
                onValueChange={([v]) => setMonths(v)}
                min={3}
                max={120}
                step={1}
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>3 mo</span>
                <span>120 mo</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 pt-8 border-t border-border">
            <div className="rounded-xl bg-accent/8 border border-accent/15 p-4 text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Monthly Payment</p>
              <p className="text-2xl md:text-3xl font-extrabold text-accent tabular-nums leading-tight">{new Intl.NumberFormat("en-US").format(monthly)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">AMD / month</p>
            </div>
            <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Total Repayment</p>
              <p className="text-2xl md:text-3xl font-extrabold text-foreground tabular-nums leading-tight">{new Intl.NumberFormat("en-US").format(total)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">AMD</p>
            </div>
            <div className="rounded-xl bg-destructive/6 border border-destructive/12 p-4 text-center">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Total Interest</p>
              <p className="text-2xl md:text-3xl font-extrabold text-destructive tabular-nums leading-tight">{new Intl.NumberFormat("en-US").format(totalInterest)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">AMD</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
