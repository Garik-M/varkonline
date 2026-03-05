import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const tKeys = ["t1", "t2", "t3"] as const;

export default function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <section className="section-padding bg-background">
      <div className="container-tight">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">{t("testimonials.badge")}</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("testimonials.title")}</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tKeys.map((key, i) => (
            <motion.div key={i} className="fintech-card relative" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Quote size={28} className="text-muted/50 absolute top-5 right-5" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={14} className="fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed italic">"{t(`testimonials.${key}Text`)}"</p>
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-bold text-foreground">{t(`testimonials.${key}Name`)}</p>
                <p className="text-xs text-accent font-medium">{t(`testimonials.${key}Role`)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
