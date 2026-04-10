import { writeFileSync } from "fs";
import { resolve } from "path";

type Locale = "am" | "en" | "ru";

const BASE_URL = "https://varkonline.am";

const ROUTES = ["/", "/eligibility", "/compare", "/calculator", "/blog"];

const LOCALE_PREFIX: Record<Locale, string> = {
  am: "",
  en: "/en",
  ru: "/ru",
};

const LOCALES: Locale[] = ["am", "en", "ru"];

function buildUrl(locale: Locale, route: string): string {
  const prefix = LOCALE_PREFIX[locale];
  // Root: /en not /en/
  const path = route === "/" ? "" : route;
  return `${BASE_URL}${prefix}${path}`;
}

function generateSitemap(): string {
  const entries: string[] = [];

  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      const loc = buildUrl(locale, route);
      entries.push(
        `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n  </url>`,
      );
    }
  }

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries,
    `</urlset>`,
  ].join("\n");
}

const xml = generateSitemap();
const outPath = resolve(process.cwd(), "public/sitemap.xml");
writeFileSync(outPath, xml, "utf-8");
console.log(`Sitemap written to ${outPath}`);
