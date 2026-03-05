import { motion } from "framer-motion";
import { FileText, CheckCircle, Building2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const icons = [FileText, CheckCircle, Building2];
const nums = ["01", "02", "03"];
const stepKeys = ["step1", "step2", "step3"] as const;

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="section-padding bg-background">
      <div className="container-tight">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">{t("howItWorks.badge")}</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("howItWorks.title")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{t("howItWorks.subtitle")}</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stepKeys.map((key, i) => {
            const Icon = icons[i];
            return (
              <motion.div key={i} className="fintech-card text-center relative group" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="absolute top-5 right-5 text-5xl font-black text-muted/60 select-none">{nums[i]}</div>
                <div className="w-14 h-14 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:shadow-md transition-shadow">
                  <Icon size={24} className="text-accent-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-3">{t(`howItWorks.${key}Title`)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(`howItWorks.${key}Desc`)}</p>
                {i < 2 && <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-full w-8 border-t-2 border-dashed border-border" />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
