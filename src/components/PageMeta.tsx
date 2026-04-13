import { Helmet } from "react-helmet-async";

const SITE = "https://varkonline.am";
const DEFAULT_OG = `${SITE}/og-image.png`;
const SITE_NAME = "VarkOnline.am";

interface PageMetaProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: "website" | "article";
}

export default function PageMeta({
  title,
  description,
  path,
  ogImage = DEFAULT_OG,
  ogType = "website",
}: PageMetaProps) {
  const url = `${SITE}${path}`;
  const fullTitle = `${title} — ${SITE_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta
        property="og:image:width"
        content={ogImage === DEFAULT_OG ? "1200" : "1200"}
      />
      <meta
        property="og:image:height"
        content={ogImage === DEFAULT_OG ? "630" : "630"}
      />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
