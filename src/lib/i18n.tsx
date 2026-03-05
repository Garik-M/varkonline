import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { en } from "@/translations/en";
import { hy } from "@/translations/hy";
import { ru } from "@/translations/ru";

export type Language = "hy" | "en" | "ru";

export const languageLabels: Record<Language, string> = {
  hy: "Հայ",
  en: "Eng",
  ru: "Рус",
};

const translations: Record<Language, typeof en> = { en, hy, ru };

type TranslationKeys = typeof en;

type NestedKeyOf<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<TranslationKeys>;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => any;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: any, path: string): any {
  const result = path.split(".").reduce((acc, part) => acc?.[part], obj);
  return result !== undefined ? result : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "hy" || saved === "en" || saved === "ru") return saved;
    return "hy";
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  }, []);

  const t = useCallback(
    (key: string) => getNestedValue(translations[lang], key),
    [lang]
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}
