import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator as CalcIcon, TrendingDown, Table } from "lucide-react";
import { trackPageView } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";
import { useSearchParams } from "react-router-dom";
import StructuredData from "@/components/StructuredData";
import PageMeta from "@/components/PageMeta";

export default function Calculator() {
  const [searchParams] = useSearchParams();
  const initialAmount = Number(searchParams.get("amount")) || 5000000;
  const initialMonths = Number(searchParams.get("months")) || 48;
  const initialRate = Number(searchParams.get("rate")) || 13;
  const [amount, setAmount] = useState(initialAmount);
  const [months, setMonths] = useState(initialMonths);
  const [rate, setRate] = useState(initialRate);
  const { t, locale } = useTranslation();

  useEffect(() => {
    trackPageView("/calculator");
  }, []);

  const calc = useMemo(() => {
    const r = rate / 100 / 12;
    const n = months;
    const monthly =
      (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = monthly * n;
    const totalInterest = total - amount;

    const schedule: {
      month: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }[] = [];
    let balance = amount;
    for (let i = 1; i <= n; i++) {
      const intPart = balance * r;
      const prinPart = monthly - intPart;
      balance -= prinPart;
      schedule.push({
        month: i,
        payment: Math.round(monthly),
        principal: Math.round(prinPart),
        interest: Math.round(intPart),
        balance: Math.max(0, Math.round(balance)),
      });
    }

    return {
      monthly: Math.round(monthly),
      total: Math.round(total),
      totalInterest: Math.round(totalInterest),
      schedule,
    };
  }, [amount, months, rate]);

  const earlyMonths = Math.max(6, Math.floor(months / 2));
  const earlySaved = useMemo(() => {
    const paidUntilEarly = calc.schedule
      .slice(0, earlyMonths)
      .reduce((s, row) => s + row.payment, 0);
    const remainingBalance = calc.schedule[earlyMonths - 1]?.balance || 0;
    const earlyTotal = paidUntilEarly + remainingBalance;
    return Math.max(0, Math.round(calc.total - earlyTotal));
  }, [calc, earlyMonths]);

  const [page, setPage] = useState(0);
  const perPage = 12;
  const totalPages = Math.ceil(calc.schedule.length / perPage);
  const paged = calc.schedule.slice(page * perPage, (page + 1) * perPage);

  useEffect(() => {
    setPage(0);
  }, [calc.schedule.length]);

  const fmt = (v: number) => new Intl.NumberFormat("en-US").format(v);

  return (
    <main className="section-padding bg-background min-h-screen pb-24 md:pb-16">
      <PageMeta
        title="Վարկի Հաշվիչ"
        description="Հաշվեք ձեր ամսական վճարները, ընդհանուր տոկոսները և մարման ժամանակացույցը անվճար վարկի հաշվիչով։"
        path="/calculator"
      />
      <StructuredData type="page" locale={locale} path="/calculator" />
      <div className="container-tight max-w-3xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center mx-auto mb-4">
            <CalcIcon size={22} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-3">
            {t("calculator.title")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("calculator.subtitle")}
          </p>
        </motion.div>

        <div className="fintech-card mb-8 space-y-8 p-8">
          <div>
            <div className="flex justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">
                {t("calculator.loanAmount")}
              </span>
              <span className="text-sm font-bold text-primary tabular-nums">
                {fmt(amount)} AMD
              </span>
            </div>
            <Slider
              value={[amount]}
              onValueChange={([v]) => setAmount(v)}
              min={100000}
              max={50000000}
              step={100000}
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>100K</span>
              <span>50M</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">
                {t("calculator.duration")}
              </span>
              <span className="text-sm font-bold text-primary tabular-nums">
                {months} {t("calculator.months")}
              </span>
            </div>
            <Slider
              value={[months]}
              onValueChange={([v]) => setMonths(v)}
              min={3}
              max={240}
              step={1}
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>3 {t("calculator.months")}</span>
              <span>240 {t("calculator.months")}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">
                {t("calculator.interestRate")}
              </span>
              <span className="text-sm font-bold text-primary tabular-nums">
                {rate}% APR
              </span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={([v]) => setRate(v)}
              min={5}
              max={30}
              step={0.5}
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>5%</span>
              <span>30%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="fintech-card text-center">
            <p className="text-xs text-muted-foreground mb-2">
              {t("calculator.monthlyPayment")}
            </p>
            <p className="text-2xl font-extrabold text-accent tabular-nums">
              {fmt(calc.monthly)}
            </p>
            <p className="text-xs text-muted-foreground">AMD</p>
          </div>
          <div className="fintech-card text-center">
            <p className="text-xs text-muted-foreground mb-2">
              {t("calculator.totalRepayment")}
            </p>
            <p className="text-2xl font-extrabold text-foreground tabular-nums">
              {fmt(calc.total)}
            </p>
            <p className="text-xs text-muted-foreground">AMD</p>
          </div>
          <div className="fintech-card text-center">
            <p className="text-xs text-muted-foreground mb-2">
              {t("calculator.totalInterest")}
            </p>
            <p className="text-2xl font-extrabold text-destructive tabular-nums">
              {fmt(calc.totalInterest)}
            </p>
            <p className="text-xs text-muted-foreground">AMD</p>
          </div>
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-5 h-11">
            <TabsTrigger value="schedule" className="text-sm gap-1.5">
              <Table size={14} /> {t("calculator.amortization")}
            </TabsTrigger>
            <TabsTrigger value="early" className="text-sm gap-1.5">
              <TrendingDown size={14} /> {t("calculator.earlyRepayment")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            {/* Desktop table */}
            <div className="fintech-card overflow-x-auto p-0 hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-semibold">
                      #
                    </th>
                    <th className="text-right py-3 px-4 text-xs text-muted-foreground font-semibold">
                      {t("calculator.payment")}
                    </th>
                    <th className="text-right py-3 px-4 text-xs text-muted-foreground font-semibold">
                      {t("calculator.principal")}
                    </th>
                    <th className="text-right py-3 px-4 text-xs text-muted-foreground font-semibold">
                      {t("calculator.interest")}
                    </th>
                    <th className="text-right py-3 px-4 text-xs text-muted-foreground font-semibold">
                      {t("calculator.balance")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row) => (
                    <tr
                      key={row.month}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-foreground font-medium">
                        {row.month}
                      </td>
                      <td className="py-2.5 px-4 text-right text-foreground tabular-nums">
                        {fmt(row.payment)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-accent tabular-nums">
                        {fmt(row.principal)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-destructive tabular-nums">
                        {fmt(row.interest)}
                      </td>
                      <td className="py-2.5 px-4 text-right text-muted-foreground tabular-nums">
                        {fmt(row.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    {page * perPage + 1}–
                    {Math.min((page + 1) * perPage, calc.schedule.length)}{" "}
                    {t("calculator.of")} {calc.schedule.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`h-7 w-7 rounded-md flex items-center justify-center text-xs transition-colors ${i === page ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted/50"}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={page === totalPages - 1}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile card layout */}
            <div className="md:hidden space-y-3">
              {paged.map((row) => (
                <div key={row.month} className="fintech-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Month {row.month}
                    </span>
                    <span className="text-base font-bold text-foreground tabular-nums">
                      {fmt(row.payment)}{" "}
                      <span className="text-[10px] text-muted-foreground font-normal">
                        AMD
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">
                        {t("calculator.principal")}
                      </p>
                      <p className="text-sm font-semibold text-accent tabular-nums">
                        {fmt(row.principal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">
                        {t("calculator.interest")}
                      </p>
                      <p className="text-sm font-semibold text-destructive tabular-nums">
                        {fmt(row.interest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">
                        {t("calculator.balance")}
                      </p>
                      <p className="text-sm font-semibold text-muted-foreground tabular-nums">
                        {fmt(row.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    {page * perPage + 1}–
                    {Math.min((page + 1) * perPage, calc.schedule.length)}{" "}
                    {t("calculator.of")} {calc.schedule.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs transition-colors ${i === page ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:bg-muted/50"}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={page === totalPages - 1}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-sm text-muted-foreground hover:bg-muted/50 disabled:opacity-30 transition-colors"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="early">
            <motion.div
              className="fintech-card text-center py-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <TrendingDown size={32} className="text-accent mx-auto mb-4" />
              <p className="text-muted-foreground text-sm mb-3">
                {t("calculator.earlyText1")}{" "}
                <strong className="text-foreground">
                  {earlyMonths} {t("calculator.months")}
                </strong>{" "}
                {t("calculator.earlyText2")} {months}{" "}
                {t("calculator.earlyText3")}
              </p>
              <p className="text-4xl font-extrabold text-accent mb-2 tabular-nums">
                {fmt(earlySaved)} AMD
              </p>
              <p className="text-xs text-muted-foreground">
                {t("calculator.earlyText4")}
              </p>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
