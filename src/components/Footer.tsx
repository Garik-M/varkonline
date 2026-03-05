import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Shield, Building2, Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const serviceHrefs = ["/eligibility", "/compare", "/calculator", "/blog"];
const loanTypeHrefs = ["/compare?type=consumer", "/compare?type=mortgage", "/compare?type=auto", "/compare?type=business", "/compare?type=refinancing"];

export default function Footer() {
  const { t } = useTranslation();
  const serviceLinks = t("footer.serviceLinks") as unknown as string[];
  const loanTypeLinks = t("footer.loanTypeLinks") as unknown as string[];

  return (
    <footer className="bg-primary text-primary-foreground border-t border-primary-foreground/15">
      <div className="container-tight px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center">
                <span className="text-accent-foreground font-extrabold text-xs">V</span>
              </div>
              <span className="font-extrabold text-lg">VarkOnline.am</span>
            </div>
            <p className="text-sm text-primary-foreground/60 leading-relaxed mb-5">
              {t("footer.description")}
            </p>
            <div className="flex items-center gap-4 text-primary-foreground/40">
              <Shield size={16} />
              <Building2 size={16} />
              <Clock size={16} />
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/80">{t("footer.services")}</h4>
            <div className="flex flex-col gap-2.5">
              {(Array.isArray(serviceLinks) ? serviceLinks : []).map((item, i) => (
                <Link key={i} to={serviceHrefs[i]} className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/80">{t("footer.loanTypes")}</h4>
            <div className="flex flex-col gap-2.5">
              {(Array.isArray(loanTypeLinks) ? loanTypeLinks : []).map((item, i) => (
                <Link key={i} to={loanTypeHrefs[i]} className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/80">{t("footer.contact")}</h4>
            <div className="flex flex-col gap-3 text-sm text-primary-foreground/60">
              <div className="flex items-center gap-2.5">
                <MapPin size={14} className="shrink-0 text-accent" />
                <span>Yerevan, Armenia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="shrink-0 text-accent" />
                <span>+374 XX XXX XXX</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={14} className="shrink-0 text-accent" />
                <span>info@varkonline.am</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-foreground/40">
            &copy; {new Date().getFullYear()} VarkOnline.am &mdash; {t("footer.rights")}
          </p>
          <div className="flex gap-5 text-xs text-primary-foreground/40">
            <Link to="#" className="hover:text-primary-foreground transition-colors">{t("footer.privacy")}</Link>
            <Link to="#" className="hover:text-primary-foreground transition-colors">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
