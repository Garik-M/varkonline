import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Building2,
  Landmark,
  CheckCircle,
  ArrowLeft,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";

type PartnerType = "bank" | "institution";

interface PartnerModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  orgName: string;
  website: string;
  contactName: string;
  phone: string;
  privacyAccepted: boolean;
}

const INITIAL_FORM: FormState = {
  orgName: "",
  website: "",
  contactName: "",
  phone: "",
  privacyAccepted: false,
};

function isValidDomain(value: string): boolean {
  // Strip optional protocol prefix before validating
  const stripped = value.trim().replace(/^https?:\/\//i, "");
  // Must match: something.tld (tld = 2+ chars), optional path/port
  return /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/.test(stripped);
}

function isValidPhone(value: string): boolean {
  return /^\+?[\d\s\-().]{7,20}$/.test(value.trim());
}

export default function PartnerModal({ open, onClose }: PartnerModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | "success">(1);
  const [partnerType, setPartnerType] = useState<PartnerType | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setPartnerType(null);
      setForm(INITIAL_FORM);
      setErrors({});
    }
  }, [open]);

  const setField = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.orgName.trim()) newErrors.orgName = "Required";
    if (!form.website.trim()) {
      newErrors.website = "Required";
    } else if (!isValidDomain(form.website.trim())) {
      newErrors.website = t("partner.invalidUrl") as string;
    }
    if (!form.contactName.trim()) newErrors.contactName = "Required";
    if (!form.phone.trim()) {
      newErrors.phone = "Required";
    } else if (!isValidPhone(form.phone)) {
      newErrors.phone = t("partner.invalidPhone") as string;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canSubmit =
    form.orgName.trim() &&
    form.website.trim() &&
    isValidDomain(form.website.trim()) &&
    form.contactName.trim() &&
    form.phone.trim() &&
    isValidPhone(form.phone) &&
    form.privacyAccepted;

  const handleSubmit = async () => {
    if (!validate() || !partnerType) return;
    setSubmitting(true);
    try {
      const websiteValue = form.website.trim();
      const normalizedWebsite = /^https?:\/\//i.test(websiteValue)
        ? websiteValue
        : `https://${websiteValue}`;
      await api.submitPartnerApplication({
        type: partnerType,
        organization_name: form.orgName.trim(),
        website: normalizedWebsite,
        contact_name: form.contactName.trim(),
        phone: form.phone.trim(),
      });
      setStep("success");
    } catch (err) {
      console.error("Partner application failed:", err);
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-md flex flex-col max-h-[92vh]"
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border shrink-0">
                <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-primary-foreground" />
                </div>
                <h2 className="text-lg font-bold text-foreground flex-1">
                  {t("partner.modalTitle")}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 px-6 py-6">
                <AnimatePresence mode="wait">
                  {/* Step 1 — type selection */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {t("partner.whoAreYou")}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setPartnerType("bank");
                            setStep(2);
                          }}
                          className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl primary-gradient flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Building2
                              size={22}
                              className="text-primary-foreground"
                            />
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {t("partner.typeBank")}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setPartnerType("institution");
                            setStep(2);
                          }}
                          className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border hover:border-accent hover:bg-accent/5 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Landmark
                              size={22}
                              className="text-accent-foreground"
                            />
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {t("partner.typeInstitution")}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2 — form */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Selected type badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                          {partnerType === "bank"
                            ? t("partner.typeBank")
                            : t("partner.typeInstitution")}
                        </span>
                      </div>

                      {/* Organization Name */}
                      <div>
                        <Label className="text-sm font-semibold mb-1.5 block">
                          {t("partner.orgName")} *
                        </Label>
                        <Input
                          placeholder={
                            t("partner.orgNamePlaceholder") as string
                          }
                          value={form.orgName}
                          onChange={(e) => setField("orgName", e.target.value)}
                          className={errors.orgName ? "border-destructive" : ""}
                        />
                        {errors.orgName && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.orgName}
                          </p>
                        )}
                      </div>

                      {/* Website */}
                      <div>
                        <Label className="text-sm font-semibold mb-1.5 block">
                          {t("partner.website")} *
                        </Label>
                        <Input
                          placeholder={
                            t("partner.websitePlaceholder") as string
                          }
                          value={form.website}
                          onChange={(e) => setField("website", e.target.value)}
                          className={errors.website ? "border-destructive" : ""}
                        />
                        {errors.website && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.website}
                          </p>
                        )}
                      </div>

                      {/* Contact Name */}
                      <div>
                        <Label className="text-sm font-semibold mb-1.5 block">
                          {t("partner.contactName")} *
                        </Label>
                        <Input
                          placeholder={
                            t("partner.contactNamePlaceholder") as string
                          }
                          value={form.contactName}
                          onChange={(e) =>
                            setField("contactName", e.target.value)
                          }
                          className={
                            errors.contactName ? "border-destructive" : ""
                          }
                        />
                        {errors.contactName && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.contactName}
                          </p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <Label className="text-sm font-semibold mb-1.5 block">
                          {t("partner.phone")} *
                        </Label>
                        <Input
                          type="tel"
                          placeholder={t("partner.phonePlaceholder") as string}
                          value={form.phone}
                          onChange={(e) => setField("phone", e.target.value)}
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      {/* Privacy checkbox */}
                      <label className="flex items-start gap-3 cursor-pointer group pt-1">
                        <div className="relative mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={form.privacyAccepted}
                            onChange={(e) =>
                              setField("privacyAccepted", e.target.checked)
                            }
                          />
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                              form.privacyAccepted
                                ? "bg-accent border-accent"
                                : "border-border group-hover:border-accent/60"
                            }`}
                          >
                            {form.privacyAccepted && (
                              <CheckCircle
                                size={13}
                                className="text-accent-foreground"
                              />
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground leading-snug">
                          {t("partner.privacyLabel")}{" "}
                          <a
                            href="/privacy_policy.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent underline underline-offset-2 hover:text-accent/80"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t("privacy.title")}
                          </a>
                        </span>
                      </label>
                    </motion.div>
                  )}

                  {/* Success */}
                  {step === "success" && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-center py-6 space-y-4"
                    >
                      <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto">
                        <PartyPopper
                          size={28}
                          className="text-accent-foreground"
                        />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        {t("partner.successTitle")}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t("partner.successText")}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer actions */}
              {step !== 1 && (
                <div className="px-6 pb-6 pt-4 border-t border-border shrink-0">
                  {step === 2 && (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl px-4"
                        onClick={() => setStep(1)}
                      >
                        <ArrowLeft size={15} className="mr-1.5" />
                        {t("partner.back")}
                      </Button>
                      <Button
                        disabled={!canSubmit || submitting}
                        className="flex-1 h-11 rounded-xl accent-gradient border-0 text-accent-foreground disabled:opacity-40"
                        onClick={handleSubmit}
                      >
                        {submitting
                          ? t("partner.submitting")
                          : t("partner.submit")}
                      </Button>
                    </div>
                  )}
                  {step === "success" && (
                    <Button
                      className="w-full h-11 rounded-xl accent-gradient border-0 text-accent-foreground"
                      onClick={handleClose}
                    >
                      {t("partner.successClose")}
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
