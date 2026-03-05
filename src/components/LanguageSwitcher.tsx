import { useTranslation, Language, languageLabels } from "@/lib/i18n";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages: Language[] = ["hy", "en", "ru"];

export default function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg transition-colors hover:bg-muted/60">
        <Globe size={16} />
        <span>{languageLabels[lang]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[100px]">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLang(l)}
            className={`text-sm font-medium cursor-pointer ${lang === l ? "bg-secondary text-foreground" : ""}`}
          >
            {languageLabels[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
