import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackCTA } from "@/lib/analytics";
import { useTranslation } from "@/lib/i18n";

export default function StickyCTA() {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-xl border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Button
        className="w-full accent-gradient border-0 text-accent-foreground h-12 rounded-xl text-sm font-semibold shadow-lg"
        asChild
        onClick={() => trackCTA("sticky_cta_eligibility")}
      >
        <Link to="/eligibility">
          {t("cta.stickyCta")}
          <ArrowRight className="ml-2" size={16} />
        </Link>
      </Button>
    </div>
  );
}
