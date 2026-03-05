import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Tag, BookOpen } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const posts = [
  { title: "Top 7 Tips to Get Your Loan Approved Faster", excerpt: "Learn the key factors banks look at when reviewing your loan application and how to improve your chances of approval.", categoryKey: "loanTips", date: "Feb 15, 2026", readTime: "5 min read" },
  { title: "Best Consumer Loan Rates in Armenia — 2026 Comparison", excerpt: "We compared consumer loan rates from 10+ Armenian banks. Here's our detailed breakdown of who offers the best deal.", categoryKey: "bankComparisons", date: "Feb 10, 2026", readTime: "8 min read" },
  { title: "First-Time Mortgage Buyer's Guide for Armenia", excerpt: "Everything you need to know about getting a mortgage in Armenia — from documentation to down payment strategies.", categoryKey: "mortgageGuides", date: "Feb 5, 2026", readTime: "10 min read" },
  { title: "Understanding Interest Rates: Fixed vs Variable", excerpt: "What's the difference between fixed and variable interest rates? Which one is better for your loan? We break it down.", categoryKey: "financialEducation", date: "Jan 28, 2026", readTime: "6 min read" },
  { title: "How to Improve Your Credit Score in Armenia", excerpt: "A practical guide to improving your creditworthiness and unlocking better loan terms from Armenian banks.", categoryKey: "creditScore", date: "Jan 20, 2026", readTime: "7 min read" },
  { title: "Refinancing Your Loan: When Does It Make Sense?", excerpt: "Should you refinance your existing loan? Learn when refinancing saves you money and when it doesn't.", categoryKey: "loanTips", date: "Jan 15, 2026", readTime: "5 min read" },
];

const categoryKeys = ["all", "loanTips", "bankComparisons", "financialEducation", "mortgageGuides", "creditScore"];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const { t } = useTranslation();

  const categoryLabels: Record<string, string> = {
    all: t("blog.all"),
    loanTips: t("blog.loanTips"),
    bankComparisons: t("blog.bankComparisons"),
    financialEducation: t("blog.financialEducation"),
    mortgageGuides: t("blog.mortgageGuides"),
    creditScore: t("blog.creditScore"),
  };

  const filtered = activeCategory === "all" ? posts : posts.filter((p) => p.categoryKey === activeCategory);

  return (
    <main className="section-padding bg-background min-h-screen pb-24 md:pb-16">
      <div className="container-tight">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center mx-auto mb-4">
            <BookOpen size={22} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-3">{t("blog.title")}</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">{t("blog.subtitle")}</p>
        </motion.div>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categoryKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`text-xs font-semibold px-4 py-2.5 rounded-full transition-all duration-200 ${
                activeCategory === key
                  ? "accent-gradient text-accent-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {categoryLabels[key]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post, i) => (
            <motion.article
              key={i}
              className="fintech-card group cursor-pointer flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-accent">
                  <Tag size={11} />
                  {categoryLabels[post.categoryKey]}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {post.date}
                </span>
              </div>
              <h2 className="text-base font-bold text-foreground mb-2 group-hover:text-accent transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{post.readTime}</span>
                <div className="flex items-center text-sm font-semibold text-accent group-hover:gap-2 gap-1 transition-all">
                  <span>{t("blog.readMore")}</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </main>
  );
}
