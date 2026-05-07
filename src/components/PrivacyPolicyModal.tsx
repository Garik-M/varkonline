import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

const POLICY_VERSION = "1.0";
const STORAGE_KEY = "privacyAccepted";

export function isPrivacyAccepted(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data?.version === POLICY_VERSION && !!data?.timestamp;
  } catch {
    return false;
  }
}

export function acceptPrivacy(): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: POLICY_VERSION, timestamp: Date.now() }),
  );
}

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
  onAccepted?: () => void;
}

export default function PrivacyPolicyModal({
  open,
  onClose,
  onAccepted,
}: PrivacyPolicyModalProps) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (open) setChecked(false);
  }, [open]);

  const handleAccept = useCallback(() => {
    if (!checked) return;
    acceptPrivacy();
    onAccepted?.();
    onClose();
  }, [checked, onAccepted, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-sm"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4">
              <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shrink-0">
                <Shield size={16} className="text-accent-foreground" />
              </div>
              <h2 className="text-base font-bold text-foreground flex-1">
                {t("privacy.title")}
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-5 space-y-4">
              {/* Brief description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("privacy.consentDescription")}
              </p>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      checked
                        ? "bg-accent border-accent"
                        : "border-border group-hover:border-accent/60"
                    }`}
                  >
                    {checked && (
                      <CheckCircle
                        size={13}
                        className="text-accent-foreground"
                      />
                    )}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground leading-snug">
                  {t("privacy.checkboxLabel")}{" "}
                  <a
                    href="/privacy_policy.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent underline underline-offset-2 hover:text-accent/80 font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("privacy.title")}
                  </a>
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-xl text-sm"
                  onClick={onClose}
                >
                  {t("privacy.close")}
                </Button>
                <Button
                  disabled={!checked}
                  className="flex-1 h-10 rounded-xl accent-gradient border-0 text-accent-foreground text-sm disabled:opacity-40"
                  onClick={handleAccept}
                >
                  {t("privacy.acceptBtn")}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
