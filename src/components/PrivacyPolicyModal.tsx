import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Shield, CheckCircle, Download } from "lucide-react";
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

// ─── Full policy document ────────────────────────────────────────────────────
interface PolicySection {
  title: string;
  paragraphs: string[];
  items?: string[];
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    title: "1. Ընդհանուր դրույթներ",
    paragraphs: [
      "VarkOnline-ն առաջարկում է ինտերնետի օգտատերերին (այսուհետ՝ «Օգտատեր») օգտագործել իր ծառայությունները համաձայն սույն Օգտատիրոջ Համաձայնագրի (այսուհետ՝ «Համաձայնագիր») պայմաններին:",
      "Համաձայնագիրն ուժի մեջ է մտնում Օգտատիրոջ կողմից իր պայմաններին համաձայնություն տալու պահից՝ ըստ 1.4 կետի:",
      "VarkOnline-ն օգտատերերին առաջարկում է հասանելիություն վարկային ծառայությունների վերաբերյալ լայն ինֆորմացիայի (այսուհետ՝ «Ծառայություններ»):",
      "Ծառայությունների օգտագործումը կարգավորվում է սույն Համաձայնագրով և Գաղտնիության քաղաքականությամբ: VarkOnline-ն իրավունք ունի փոփոխելու այս Համաձայնագիրն առանց հատուկ ծանուցման: Նոր տարբերակը ուժի մեջ է մտնում այն կայքում տեղադրվելուց անմիջապես հետո:",
      "Սկսելով օգտվել VarkOnline-ի ծառայություններից, գրանցվելով կամ օգտվելով առանձին գործառույթներից, Օգտատերը համարվում է Համաձայնագրի բոլոր պայմանները ընդունած: Եթե Օգտատերը համաձայն չէ պայմանների հետ, նա պետք է դադարեցնի ծառայությունների օգտագործումը:",
    ],
  },
  {
    title: "2. Օգտատիրոջ գրանցումը և հաշիվը",
    paragraphs: [
      "Որոշ ծառայություններից օգտվելու համար Օգտատերը պետք է գրանցվի, և նրա համար կստեղծվի եզակի հաշիվ:",
      "Օգտատերը պարտավորվում է գրանցման ընթացքում տրամադրել ճշգրիտ և թարմացված տեղեկատվություն: VarkOnline-ն իրավունք ունի արգելափակել կամ ջնջել հաշիվը, եթե տրամադրված տեղեկատվությունը կեղծ է:",
      "Օգտատերը պարտավոր է ապահովել իր հաշվի մուտքի տվյալների գաղտնիությունը: Չարտոնված մուտքի դեպքում Օգտատերը պարտավոր է անմիջապես տեղեկացնել Հաճախորդների Աջակցության ծառայությանը:",
      "Օգտատերը պատասխանատու է իր հաշվի միջոցով իրականացված բոլոր գործողությունների համար:",
    ],
  },
  {
    title: "3. Ծառայությունների օգտագործման ընդհանուր պայմաններ",
    paragraphs: [
      "VarkOnline-ն իրավունք ունի սահմանափակումներ կիրառել ծառայությունների օգտագործման վրա բոլոր կամ որոշ օգտատերերի համար, ներառյալ որոշակի գործառույթների հասանելիությունը:",
      "VarkOnline-ն իրավունք ունի ուղարկել տեղեկատվական և գովազդային հաղորդագրություններ/ծանուցումներ օգտատերերին, որոնք կարող են անջատվել օգտատիրոջ կողմից անձնական հաշվի կարգավորումներում:",
      "VarkOnline-ը կարող է հավաքել օգտատերերի կարծիքներ և օգտագործել դրանք ծառայությունների բարելավման և վիճակագրության նպատակներով:",
      "VarkOnline-ն իրավունք ունի պահանջել գրանցման ընթացքում տրամադրված տվյալների հաստատում:",
    ],
  },
  {
    title: "4. Ծառայությունների օգտագործման պայմաններ",
    paragraphs: [
      "Օգտատերը պատասխանատու է իր գործողությունների համար, որոնք կապված են ծառայությունների օգտագործման հետ, և պարտավոր է պահպանել գործող օրենսդրությունը:",
      "Օգտատերը չի կարող տարածել ապօրինի, վնասակար, վիրավորական բովանդակություն կամ օգտագործել ծառայությունները սպամի նպատակով:",
      "VarkOnline-ը պարտավոր չէ ստուգել օգտատերերի կողմից տեղադրված բովանդակությունը, սակայն իրավունք ունի հեռացնել այն, եթե այն հակասում է սույն Համաձայնագրին:",
    ],
  },
  {
    title: "5. Մտավոր սեփականություն և բովանդակություն",
    paragraphs: [
      "VarkOnline-ի ծառայությունների բոլոր բովանդակությունները (դիզայն, տեքստեր, պատկերներ, տեսանյութեր և այլն) հանդիսանում են VarkOnline-ի կամ VarkOnline-ի հետ համագործացող կազմակերպությունների/անձանց մտավոր սեփականությունը:",
      "Բովանդակության օգտագործումը թույլատրվում է միայն ծառայությունների գործառույթների շրջանակներում՝ անձնական և ոչ առևտրային նպատակներով՝ պահպանելով հեղինակային իրավունքները:",
      "Թողնելով կարծիք կամ մեկնաբանություն, Օգտատերը տրամադրում է VarkOnline-ին ոչ բացառիկ իրավունք այն օգտագործելու ամբողջ աշխարհում անսահմանափակ ժամանակով:",
    ],
  },
  {
    title: "6. Կայքեր և երրորդ կողմի բովանդակություն",
    paragraphs: [
      "VarkOnline-ը կարող է պարունակել հղումներ դեպի երրորդ կողմի կայքեր: VarkOnline-ը պատասխանատվություն չի կրում այդ կայքերի բովանդակության և ծառայությունների համար:",
      "Հղումը դեպի երրորդ կողմի կայք չի համարվում VarkOnline-ի կողմից այդ կայքերի արտադրանքի կամ ծառայությունների առաջարկություն:",
    ],
  },
  {
    title: "7. Պատասխանատվության սահմանափակում",
    paragraphs: [
      "Ծառայությունները տրամադրվում են «ինչպես կա» սկզբունքով, և VarkOnline-ը չի երաշխավորում, որ դրանք համապատասխան կլինեն Օգտատիրոջ սպասումներին:",
      "VarkOnline-ը պատասխանատվություն չի կրում որևէ վնասի համար, որը կարող է առաջանալ ծառայությունների օգտագործման հետևանքով, բացառությամբ օրենսդրությամբ նախատեսված դեպքերի:",
    ],
  },
  {
    title: "8. Անձնական տվյալների մշակում և պաշտպանություն",
    paragraphs: [
      "VarkOnline-ը մշակում է Օգտատիրոջ անձնական տվյալները բացառապես ծառայությունների մատուցման, վարկային առաջարկների համեմատման և գործընկեր բանկերի հետ կապ հաստատելու նպատակով:",
      "Անձնական տվյալները ներառում են՝ անուն, հեռախոսահամար, էլ. հասցե, ֆինանսական տեղեկատվություն (վարկի գումար, ժամկետ, եկամուտ), ինչպես նաև տեխնիկական տվյալներ (IP հասցե, բրաուզեր, այցելած էջեր):",
      "VarkOnline-ը կիրառում է SSL/TLS գաղտնագրում բոլոր տվյալների փոխանցումների համար և ապահովում է բանկային մակարդակի անվտանգություն:",
      "Օգտատիրոջ տվյալները չեն վաճառվում երրորդ կողմերին: Դրանք կարող են փոխանցվել գործընկեր բանկերին և վարկային կազմակերպություններին բացառապես Օգտատիրոջ հայտի մշակման նպատակով:",
      "Օգտատերն իրավունք ունի ցանկացած պահի պահանջել իր տվյալների ուղղումը, ջնջումը կամ մշակման դադարեցումը՝ դիմելով info@varkonline.am հասցեով:",
    ],
  },
];

const POLICY_LAST_UPDATED = "Վերջին թարմացում՝ 1 հունվարի, 2025 · Տարբերակ 1.0";
const POLICY_TITLE = "Գաղտնիության քաղաքականություն և Օգտատիրոջ Համաձայնագիր";

// ─── Print helper ─────────────────────────────────────────────────────────────
function printPolicy() {
  const printId = "privacy-print-frame";
  let existing = document.getElementById(printId);
  if (existing) existing.remove();

  const sectionsHtml = POLICY_SECTIONS.map(
    (s) =>
      `<section>
        <h3>${s.title}</h3>
        ${s.paragraphs.map((p) => `<p>${p}</p>`).join("")}
        ${s.items ? `<ul>${s.items.map((i) => `<li>${i}</li>`).join("")}</ul>` : ""}
      </section>`,
  ).join("");

  const html = `<!DOCTYPE html>
<html lang="hy">
<head>
  <meta charset="UTF-8" />
  <title>${POLICY_TITLE}</title>
  <style>
    @page { margin: 2cm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #111;
      margin: 0;
      padding: 0;
    }
    header {
      border-bottom: 2px solid #111;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    header h1 { font-size: 16pt; margin: 0 0 4px; }
    header p  { font-size: 9pt; color: #555; margin: 0; }
    section   { margin-bottom: 20px; page-break-inside: avoid; }
    h3        { font-size: 12pt; margin: 0 0 6px; }
    p         { margin: 0 0 8px; }
    ul        { margin: 6px 0 8px 20px; padding: 0; }
    li        { margin-bottom: 4px; }
    footer    { margin-top: 32px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9pt; color: #555; }
  </style>
</head>
<body>
  <header>
    <h1>${POLICY_TITLE}</h1>
    <p>${POLICY_LAST_UPDATED}</p>
  </header>
  ${sectionsHtml}
  <footer>VarkOnline.am &nbsp;·&nbsp; info@varkonline.am</footer>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.id = printId;
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow?.focus();
  // Small delay so fonts/layout settle before print dialog opens
  setTimeout(() => {
    iframe.contentWindow?.print();
  }, 300);
}

// ─── Component ────────────────────────────────────────────────────────────────
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
            className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-lg flex flex-col max-h-[90vh]"
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border shrink-0">
              <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center shrink-0">
                <Shield size={18} className="text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-foreground leading-tight">
                  {t("privacy.title")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {POLICY_LAST_UPDATED}
                </p>
              </div>
              <button
                onClick={printPolicy}
                title="Download PDF"
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Download as PDF"
              >
                <Download size={16} />
              </button>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable policy content */}
            <div
              ref={scrollRef}
              className="overflow-y-auto flex-1 px-6 py-5 text-sm text-muted-foreground leading-relaxed space-y-5"
            >
              {POLICY_SECTIONS.map((section, i) => (
                <section key={i}>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">
                    {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.paragraphs.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                    {section.items && (
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {section.items.map((item, k) => (
                          <li key={k}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}

              <p className="text-xs text-muted-foreground/60 pt-2 border-t border-border">
                VarkOnline.am · info@varkonline.am
              </p>
            </div>

            {/* Footer: checkbox + buttons */}
            <div className="px-6 pb-6 pt-4 border-t border-border shrink-0 space-y-4">
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
                  {t("privacy.checkboxLabel")}
                </span>
              </label>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={onClose}
                >
                  {t("privacy.close")}
                </Button>
                <Button
                  disabled={!checked}
                  className="flex-1 h-11 rounded-xl accent-gradient border-0 text-accent-foreground disabled:opacity-40"
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
