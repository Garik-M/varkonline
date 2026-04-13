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

export default function Index() {
  const { locale } = useTranslation();

  useEffect(() => {
    trackPageView("/");
  }, []);

  return (
    <main className="pb-16 md:pb-0">
      <PageMeta
        title="Վարկերի Համեմատություն Հայաստանում"
        description="Համեմատեք հայկական բանկերի վարկային առաջարկները, ստուգեք ձեր իրավասությունը 3 րոպեում և գտեք լավագույն տոկոսադրույքները։"
        path="/"
      />
      <StructuredData type="home" locale={locale} path="/" />
      <HeroSection />
      <HowItWorks />
      <LoanCalculatorWidget />
      <LoanCategories />
      <TestimonialsSection />
      <TrustSection />
      <FAQSection />
    </main>
  );
}
