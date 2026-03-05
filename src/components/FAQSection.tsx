import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "@/lib/i18n";

const faqKeys = ["1", "2", "3", "4", "5", "6"] as const;

export default function FAQSection() {
  const { t } = useTranslation();

  return (
    <section className="section-padding bg-background">
      <div className="container-tight max-w-3xl">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-sm font-semibold text-accent uppercase tracking-widest mb-3">{t("faq.badge")}</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("faq.title")}</h2>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqKeys.map((key) => (
              <AccordionItem key={key} value={`item-${key}`} className="fintech-card px-6 border border-border hover:shadow-none data-[state=open]:shadow-none">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-5 text-left">
                  {t(`faq.q${key}`)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
                  {t(`faq.a${key}`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
