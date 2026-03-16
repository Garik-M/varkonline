import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Percent,
  Clock,
  Filter,
  ArrowRight,
  Loader2,
  Calculator,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { trackPageView, trackCTA } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";

interface LoanProduct {
  id: string;
  name: string;
  loan_type: string;
  interest_rate_min: number;
  interest_rate_max: number;
  min_amount: number;
  max_amount: number;
  max_duration_months: number;
  approval_time_days: number;
  requires_collateral: boolean;
  requires_salary_transfer: boolean;
  early_repayment: boolean;
  banks: { name: string; institution_type: string } | null;
}

export default function Compare() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") || "all";
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [institutionFilter, setInstitutionFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"rate" | "speed">("rate");
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const typeLabels: Record<string, string> = {
    all: t("compare.allTypes"),
    consumer: t("compare.consumer"),
    mortgage: t("compare.mortgage"),
    auto: t("compare.auto"),
    business: t("compare.business"),
    refinancing: t("compare.refinancing"),
  };

  useEffect(() => {
    trackPageView("/compare");
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await api.getProducts({
          loan_type: typeFilter === "all" ? undefined : typeFilter,
        });
        setProducts(data || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [typeFilter]);

  const filtered = useMemo(() => {
    if (institutionFilter === "all") return products;
    return products.filter(
      (p) => (p.banks as any)?.institution_type === institutionFilter,
    );
  }, [products, institutionFilter]);

  const sorted = useMemo(() => {
    if (sortBy === "rate")
      return [...filtered].sort(
        (a, b) => a.interest_rate_min - b.interest_rate_min,
      );
    return [...filtered].sort(
      (a, b) => a.approval_time_days - b.approval_time_days,
    );
  }, [filtered, sortBy]);

  const fmt = (v: number) => new Intl.NumberFormat("en-US").format(v);

  const getInstitutionLabel = (type: string) => {
    return type === "credit_organization"
      ? t("compare.creditOrganization")
      : t("compare.bank");
  };

  return (
    <main className="section-padding bg-background min-h-screen pb-24 md:pb-16">
      <div className="container-tight">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">
            {t("compare.badge")}
          </p>
          <h1 className="text-2xl md:text-4xl font-bold mb-3">
            {t("compare.title")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            {t("compare.subtitle")}
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="sm:w-56">
              <Filter size={14} className="mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={institutionFilter}
            onValueChange={setInstitutionFilter}
          >
            <SelectTrigger className="sm:w-56">
              <Landmark size={14} className="mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("compare.allInstitutions")}
              </SelectItem>
              <SelectItem value="bank">{t("compare.banks")}</SelectItem>
              <SelectItem value="credit_organization">
                {t("compare.creditOrganizations")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as "rate" | "speed")}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rate">{t("compare.sortByRate")}</SelectItem>
              <SelectItem value="speed">{t("compare.sortBySpeed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sorted.map((loan, i) => {
              const instType = (loan.banks as any)?.institution_type || "bank";
              return (
                <motion.div
                  key={loan.id}
                  className="fintech-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${instType === "credit_organization" ? "bg-info/10" : "primary-gradient"}`}
                    >
                      {instType === "credit_organization" ? (
                        <Landmark size={18} className="text-info" />
                      ) : (
                        <Building2
                          size={18}
                          className="text-primary-foreground"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {(loan.banks as any)?.name || "Unknown"}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${instType === "credit_organization" ? "bg-info/10 text-info" : "bg-accent/10 text-accent"}`}
                        >
                          {getInstitutionLabel(instType)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {loan.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="flex items-start gap-2.5">
                      <Percent
                        size={14}
                        className="text-accent mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t("compare.interestRate")}
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {loan.interest_rate_min}–{loan.interest_rate_max}% APR
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Clock size={14} className="text-info mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {t("compare.approvalTime")}
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          {loan.approval_time_days <= 1
                            ? t("compare.sameDay")
                            : `${loan.approval_time_days} ${t("compare.days")}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                      {t("compare.upTo")} {fmt(loan.max_amount)} AMD
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                      {loan.max_duration_months} {t("calculator.months")}
                    </span>
                    {loan.requires_collateral && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-warning/10 text-warning font-medium">
                        {t("compare.collateral")}
                      </span>
                    )}
                    {loan.requires_salary_transfer && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-info/10 text-info font-medium">
                        {t("compare.salaryTransfer")}
                      </span>
                    )}
                    {loan.early_repayment && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">
                        {t("compare.earlyRepayment")}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 rounded-xl"
                      asChild
                    >
                      <Link
                        to={`/calculator?rate=${loan.interest_rate_min}&amount=${loan.max_amount}&months=${loan.max_duration_months}`}
                      >
                        <Calculator size={14} className="mr-1.5" />
                        {t("compare.calculate") || "Calculate"}
                      </Link>
                    </Button>
                    <Button
                      className="flex-1 accent-gradient border-0 text-accent-foreground h-10 rounded-xl"
                      asChild
                      onClick={() =>
                        trackCTA("compare_apply", {
                          bank: (loan.banks as any)?.name,
                          product: loan.name,
                        })
                      }
                    >
                      <Link to={`/eligibility?type=${loan.loan_type}`}>
                        {t("compare.applyNow")}
                        <ArrowRight size={14} className="ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && sorted.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t("compare.noProducts")}</p>
          </div>
        )}
      </div>
    </main>
  );
}
