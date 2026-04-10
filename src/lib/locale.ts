export type Locale = 'am' | 'en' | 'ru';

export const SUPPORTED_LOCALES: Locale[] = ['am', 'en', 'ru'];
// Locales that get a URL prefix (am is default — no prefix)
export const LOCALE_PREFIXES: Partial<Record<Locale, string>> = { en: 'en', ru: 'ru' };
// Map from i18n lang codes used in the app
export const LOCALE_TO_LANG: Record<Locale, 'hy' | 'en' | 'ru'> = {
  am: 'hy',
  en: 'en',
  ru: 'ru',
};
export const LANG_TO_LOCALE: Record<string, Locale> = { hy: 'am', en: 'en', ru: 'ru' };

export interface ResolvedLocale {
  locale: Locale;
  normalizedPath: string; // path without locale prefix
  redirect?: string;      // set when caller should redirect here instead
}

/**
 * Resolves locale and normalized path from a URL pathname.
 *
 * Examples:
 *   /en/eligibility  → { locale: 'en', normalizedPath: '/eligibility' }
 *   /eligibility     → { locale: 'am', normalizedPath: '/eligibility' }
 *   /am/eligibility  → { locale: 'am', normalizedPath: '/eligibility', redirect: '/eligibility' }
 *   /en              → { locale: 'en', normalizedPath: '/' }
 *   /en/             → { locale: 'en', normalizedPath: '/', redirect: '/en' }
 *   /fr/page         → { locale: 'am', normalizedPath: '/fr/page' }  (unknown prefix → fallback)
 *   /EN/page         → { locale: 'en', normalizedPath: '/page' }     (case-insensitive)
 */
export function resolveLocaleFromPath(
  pathname: string,
  search = '',
): ResolvedLocale {
  // Normalise trailing slash (keep root '/' intact)
  const hasTrailingSlash = pathname.length > 1 && pathname.endsWith('/');
  const clean = hasTrailingSlash ? pathname.slice(0, -1) : pathname;

  const segments = clean.split('/').filter(Boolean); // ['en', 'eligibility'] etc.
  const first = (segments[0] ?? '').toLowerCase() as Locale;

  // /am/... → redirect to path without prefix
  if (first === 'am') {
    const rest = '/' + segments.slice(1).join('/');
    const normalizedPath = rest === '/' ? '/' : rest || '/';
    return {
      locale: 'am',
      normalizedPath,
      redirect: normalizedPath + search,
    };
  }

  // /en/... or /ru/...
  if (first === 'en' || first === 'ru') {
    const rest = segments.slice(1).join('/');
    const normalizedPath = rest ? '/' + rest : '/';
    const canonical = `/${first}${normalizedPath === '/' ? '' : normalizedPath}`;

    // Trailing slash normalisation: /en/ → /en
    if (hasTrailingSlash) {
      return { locale: first, normalizedPath, redirect: canonical + search };
    }

    return { locale: first, normalizedPath };
  }

  // No recognised prefix → Armenian (default), path is unchanged
  const normalizedPath = clean || '/';

  // Trailing slash normalisation for default locale
  if (hasTrailingSlash) {
    return { locale: 'am', normalizedPath, redirect: normalizedPath + search };
  }

  return { locale: 'am', normalizedPath };
}

/**
 * Build a locale-prefixed path.
 *   localePath('en', '/eligibility') → '/en/eligibility'
 *   localePath('am', '/eligibility') → '/eligibility'
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === 'am') return path;
  const base = path === '/' ? '' : path;
  return `/${locale}${base}`;
}

/**
 * Detect preferred locale from browser navigator.languages.
 * Returns undefined if no match (caller decides the fallback).
 */
export function detectBrowserLocale(): Locale | undefined {
  const langs = navigator.languages ?? [navigator.language];
  for (const l of langs) {
    const code = l.split('-')[0].toLowerCase();
    if (code === 'hy') return 'am';
    if (code === 'en') return 'en';
    if (code === 'ru') return 'ru';
  }
  return undefined;
}
