import { useState } from "react";
import { motion } from "framer-motion";
import { PhoneCall, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { trackFormSubmit, trackCTA } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";

export default function CallbackWidget() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    try {
      await api.submitLead({
        full_name: "Callback Request",
        phone: phone.trim(),
        loan_amount: 0,
        loan_duration_months: 0,
        loan_purpose: "consumer",
        notes: "Callback widget request",
      });
      trackFormSubmit("callback_widget", { phone: phone.trim() });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setPhone("");
      }, 2500);
    } catch (error) {
      console.error("Failed to submit callback request:", error);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          trackCTA("callback_widget_open");
        }}
        className="hidden md:flex fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl accent-gradient items-center justify-center shadow-lg hover:shadow-xl transition-shadow text-accent-foreground"
        aria-label="Request callback"
      >
        <PhoneCall size={22} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-80"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <div className="fintech-card shadow-xl relative">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
              >
                <X size={16} />
              </button>
              {submitted ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <PhoneCall size={20} className="text-accent" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {t("callback.success")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("callback.successSub")}
                  </p>
                </div>
              ) : (
                <>
                  <h4 className="text-sm font-bold text-foreground mb-1">
                    {t("callback.title")}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t("callback.text")}
                  </p>
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="+374 XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="accent-gradient border-0 text-accent-foreground shrink-0 px-3"
                    >
                      <Send size={14} />
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
