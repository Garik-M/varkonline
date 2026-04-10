import type { Locale } from "@/lib/locale";
import { localePath } from "@/lib/locale";

const BASE_URL = "https://varkonline.am";
const ORG_NAME = "Vark Online";
const LOGO_URL = `${BASE_URL}/logo.png`;

function absUrl(locale: Locale, path: string): string {
  return `${BASE_URL}${localePath(locale, path)}`;
}

// ─── Shared schemas (every page) ────────────────────────────────────────────

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: ORG_NAME,
  url: BASE_URL,
  logo: LOGO_URL,
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: BASE_URL,
  name: ORG_NAME,
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

// ─── Breadcrumb ──────────────────────────────────────────────────────────────

const PAGE_NAMES: Record<string, string> = {
  "/eligibility": "Eligibility",
  "/compare": "Compare",
  "/calculator": "Calculator",
  "/blog": "Blog",
};

function breadcrumb(locale: Locale, path: string) {
  const pageName = PAGE_NAMES[path] ?? path.replace("/", "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absUrl(locale, "/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: pageName,
        item: absUrl(locale, path),
      },
    ],
  };
}

// ─── Article ─────────────────────────────────────────────────────────────────

interface ArticleParams {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
}

function article(p: ArticleParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    author: { "@type": "Organization", name: ORG_NAME },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
    datePublished: p.publishedAt,
    dateModified: p.updatedAt,
    mainEntityOfPage: absUrl(p.locale, p.path),
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface StructuredDataParams {
  /** 'home' = root, 'page' = inner page, 'blog' = blog list, 'blog-post' = single post */
  type: "home" | "page" | "blog" | "blog-post";
  locale: Locale;
  /** Normalised path without locale prefix, e.g. '/eligibility' */
  path: string;
  title?: string;
  description?: string;
  publishedAt?: string;
  updatedAt?: string;
}

export function generateStructuredData(p: StructuredDataParams): object[] {
  const base: object[] = [organization, website];

  switch (p.type) {
    case "home":
      return base;

    case "page":
      return [...base, breadcrumb(p.locale, p.path)];

    case "blog":
      // /blog list — breadcrumb only, no Article
      return [...base, breadcrumb(p.locale, "/blog")];

    case "blog-post":
      return [
        ...base,
        breadcrumb(p.locale, p.path),
        article({
          locale: p.locale,
          path: p.path,
          title: p.title ?? "",
          description: p.description ?? "",
          publishedAt: p.publishedAt ?? new Date().toISOString(),
          updatedAt: p.updatedAt ?? new Date().toISOString(),
        }),
      ];

    default:
      return base;
  }
}
