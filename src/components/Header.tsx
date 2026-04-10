import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { resolveLocaleFromPath } from "@/lib/locale";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const navKeys = [
  "home",
  "eligibility",
  "compare",
  "calculator",
  "blog",
] as const;
const navPaths = ["/", "/eligibility", "/compare", "/calculator", "/blog"];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t, lp } = useTranslation();

  // Active check against the normalised path (strips locale prefix)
  const { normalizedPath } = resolveLocaleFromPath(location.pathname);
  const navHrefs = navPaths.map((p) => lp(p));

  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/60">
      <div className="container-tight flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="VarkOnline.am" className="h-8 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navKeys.map((key, i) => (
            <Link
              key={navHrefs[i]}
              to={navHrefs[i]}
              className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-all duration-200 ${
                normalizedPath === navPaths[i]
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <LanguageSwitcher />
          <Button
            size="sm"
            className="accent-gradient border-0 text-accent-foreground shadow-sm hover:shadow-md transition-shadow"
            asChild
          >
            <Link to={lp("/eligibility")}>
              {t("cta.checkEligibility")}
              <ArrowRight className="ml-1.5" size={14} />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-foreground"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden border-t border-border bg-card"
          >
            <nav className="flex flex-col p-4 gap-1">
              {navKeys.map((key, i) => (
                <Link
                  key={navHrefs[i]}
                  to={navHrefs[i]}
                  onClick={() => setMobileOpen(false)}
                  className={`text-sm font-medium py-3 px-4 rounded-xl transition-colors ${
                    normalizedPath === navPaths[i]
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t(`nav.${key}`)}
                </Link>
              ))}
              <Button
                className="mt-3 accent-gradient border-0 text-accent-foreground py-5 rounded-xl"
                asChild
              >
                <Link
                  to={lp("/eligibility")}
                  onClick={() => setMobileOpen(false)}
                >
                  {t("cta.checkEligibility")}
                  <ArrowRight className="ml-1.5" size={14} />
                </Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
