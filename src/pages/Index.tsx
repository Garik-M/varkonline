import { useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import LoanCalculatorWidget from "@/components/LoanCalculatorWidget";
import LoanCategories from "@/components/LoanCategories";
import TestimonialsSection from "@/components/TestimonialsSection";
import TrustSection from "@/components/TrustSection";
import FAQSection from "@/components/FAQSection";
import { trackPageView } from "@/lib/analytics";
import StructuredData from "@/components/StructuredData";
import { useTranslation } from "@/lib/i18n";
import PageMeta from "@/components/PageMeta";
import HomepageAdLayout from "@/components/HomepageAdLayout";
import Advertisement from "@/components/Advertisement";
import { useIsDesktop } from "@/hooks/useBreakpoint";

export default function Index() {
  const { locale } = useTranslation();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    trackPageView("/");
  }, []);

  return (
    <HomepageAdLayout>
      <main className="pb-16 md:pb-0">
        <PageMeta
          title="Վարկերի Համեմատություն Հայաստանում"
          description="Համեմատեք հայկական բանկերի վարկային առաջարկները, ստուգեք ձեր իրավասությունը 3 րոպեում և գտեք լավագույն տոկոսադրույքները։"
          path="/"
        />
        <StructuredData type="home" locale={locale} path="/" />
        <HeroSection />
        {isDesktop === false && (
          <div className="container-tight px-4 py-4">
            <Advertisement slot="HOME_MOBILE_ROW" />
          </div>
        )}
        <HowItWorks />
        <LoanCalculatorWidget />
        <LoanCategories />
        <TestimonialsSection />
        <TrustSection />
        <FAQSection />
      </main>
    </HomepageAdLayout>
  );
}
