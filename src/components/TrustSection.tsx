import { motion } from "framer-motion";
import { Shield, Users, Zap, Award, Lock, HeadphonesIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const icons = [Shield, Users, Zap, Award, Lock, HeadphonesIcon];
const titleKeys = ["bankSecurity", "usersServed", "fastProcess", "bankPartners", "confidential", "expertSupport"] as const;

export default function TrustSection() {
  const { t } = useTranslation();

  return (
    <section className="section-padding bg-muted/40">
      <div className="container-tight">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">{t("trust.badge")}</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("trust.title")}</h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {titleKeys.map((key, i) => {
            const Icon = icons[i];
            return (
              <motion.div key={i} className="fintech-card text-center" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Icon size={20} className="text-accent" />
                </div>
                <h3 className="text-sm font-bold mb-1.5">{t(`trust.${key}`)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(`trust.${key}Desc`)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
