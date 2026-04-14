import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { en } from "@/translations/en";
import { hy } from "@/translations/hy";
import { ru } from "@/translations/ru";
import {
  Locale,
  LOCALE_TO_LANG,
  LANG_TO_LOCALE,
  localePath,
  resolveLocaleFromPath,
  detectBrowserLocale,
} from "@/lib/locale";

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
  locale: Locale;
  /** Switch locale and navigate to the equivalent URL */
  setLocale: (locale: Locale) => void;
  /** Build a locale-aware path for the current locale */
  lp: (path: string) => string;
  t: (key: string) => any;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: any, path: string): any {
  const result = path.split(".").reduce((acc, part) => acc?.[part], obj);
  return result !== undefined ? result : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive locale from URL on every render — URL is the source of truth
  const { locale, normalizedPath, redirect } = resolveLocaleFromPath(
    location.pathname,
    location.search,
  );

  // Handle redirects (trailing slash, /am/... → /...)
  useEffect(() => {
    if (redirect) navigate(redirect, { replace: true });
  }, [redirect, navigate]);

  // Browser-language detection on very first visit (no stored preference)
  useEffect(() => {
    const visited = localStorage.getItem("locale_detected");
    if (visited) return;
    localStorage.setItem("locale_detected", "1");

    // Only redirect from the bare root with no explicit locale
    if (location.pathname !== "/") return;

    const detected = detectBrowserLocale();
    if (detected && detected !== "am") {
      navigate(`/${detected}`, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lang = LOCALE_TO_LANG[locale];

  const setLocale = useCallback(
    (next: Locale) => {
      // Build the equivalent path in the new locale
      const target = localePath(next, normalizedPath) + location.search;
      navigate(target, { replace: false });
    },
    [navigate, normalizedPath, location.search],
  );

  const lp = useCallback((path: string) => localePath(locale, path), [locale]);

  const t = useCallback(
    (key: string) => getNestedValue(translations[lang], key),
    [lang],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, locale, setLocale, lp, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}

// Re-export for convenience
export { localePath, type Locale };
