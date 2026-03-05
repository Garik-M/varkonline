import { useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import LoanCalculatorWidget from "@/components/LoanCalculatorWidget";
import LoanCategories from "@/components/LoanCategories";
import TestimonialsSection from "@/components/TestimonialsSection";
import TrustSection from "@/components/TrustSection";
import FAQSection from "@/components/FAQSection";
import { trackPageView } from "@/lib/analytics";

export default function Index() {
  useEffect(() => {
    trackPageView("/");
  }, []);

  return (
    <main className="pb-16 md:pb-0">
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
