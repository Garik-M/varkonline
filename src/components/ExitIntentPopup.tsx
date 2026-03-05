import { useState, useEffect } from "react";
import { X, ArrowRight, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";

export default function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5 && !sessionStorage.getItem("exitShown")) {
        setShow(true);
        sessionStorage.setItem("exitShown", "1");
        trackCTA("exit_intent_shown");
      }
    };
    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShow(false)}>
          <motion.div className="bg-card rounded-3xl p-8 md:p-10 max-w-md w-full shadow-2xl relative border border-border" initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors">
              <X size={18} />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-6 shadow-md">
                <Gift size={28} className="text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t("exitPopup.title")}</h3>
              <p className="text-sm text-muted-foreground mb-7 leading-relaxed">{t("exitPopup.text")}</p>
              <Button className="accent-gradient border-0 text-accent-foreground w-full h-12 rounded-xl font-semibold shadow-md" asChild onClick={() => trackCTA("exit_intent_click")}>
                <Link to="/eligibility" onClick={() => setShow(false)}>
                  {t("cta.checkEligibility")}
                  <ArrowRight className="ml-2" size={16} />
                </Link>
              </Button>
              <button onClick={() => setShow(false)} className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {t("exitPopup.dismiss")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
