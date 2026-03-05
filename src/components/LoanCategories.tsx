import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CreditCard, Home, Car, Briefcase, RefreshCw, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const icons = [CreditCard, Home, Car, Briefcase, RefreshCw];
const hrefs = ["/compare?type=consumer", "/compare?type=mortgage", "/compare?type=auto", "/compare?type=business", "/compare?type=refinancing"];
const keys = ["consumer", "mortgage", "auto", "business", "refinancing"] as const;
const iconBgs = ["bg-info/10 text-info", "bg-accent/10 text-accent", "bg-warning/10 text-warning", "bg-primary/10 text-primary", "bg-destructive/10 text-destructive"];

export default function LoanCategories() {
  const { t } = useTranslation();

  return (
    <section className="section-padding bg-background">
      <div className="container-tight">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">{t("loanCategories.badge")}</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("loanCategories.title")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{t("loanCategories.subtitle")}</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {keys.map((key, i) => {
            const Icon = icons[i];
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link to={hrefs[i]} className="fintech-card flex flex-col h-full group cursor-pointer">
                  <div className={`w-12 h-12 rounded-2xl ${iconBgs[i]} flex items-center justify-center mb-5`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{t(`loanCategories.${key}`)}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-5 leading-relaxed">{t(`loanCategories.${key}Desc`)}</p>
                  <div className="flex items-center text-sm font-semibold text-accent group-hover:gap-2.5 gap-1.5 transition-all">
                    <span>{t("loanCategories.explore")}</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
