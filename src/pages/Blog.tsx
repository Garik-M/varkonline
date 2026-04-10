import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Tag, BookOpen } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import StructuredData from "@/components/StructuredData";

interface BlogPost {
  id: string;
  slug: string;
  title_hy: string;
  title_en: string;
  title_ru: string;
  excerpt_hy: string | null;
  excerpt_en: string | null;
  excerpt_ru: string | null;
  content_hy: string;
  content_en: string;
  content_ru: string;
  image_url: string | null;
  author: string | null;
  published: boolean;
  created_at: string;
}

const categoryKeys = [
  "all",
  "loanTips",
  "bankComparisons",
  "financialEducation",
  "mortgageGuides",
  "creditScore",
];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, lang, locale } = useTranslation();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await api.getBlogPosts();
        setPosts(data || []);
      } catch (error) {
        console.error("Failed to fetch blog posts:", error);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const categoryLabels: Record<string, string> = {
    all: t("blog.all"),
    loanTips: t("blog.loanTips"),
    bankComparisons: t("blog.bankComparisons"),
    financialEducation: t("blog.financialEducation"),
    mortgageGuides: t("blog.mortgageGuides"),
    creditScore: t("blog.creditScore"),
  };

  const getLocalizedTitle = (post: BlogPost) => {
    if (lang === "hy") return post.title_hy;
    if (lang === "ru") return post.title_ru;
    return post.title_en;
  };

  const getLocalizedExcerpt = (post: BlogPost) => {
    if (lang === "hy") return post.excerpt_hy || "";
    if (lang === "ru") return post.excerpt_ru || "";
    return post.excerpt_en || "";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      lang === "hy" ? "hy-AM" : lang === "ru" ? "ru-RU" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  };

  const filtered = activeCategory === "all" ? posts : posts;

  if (loading) {
    return (
      <main className="section-padding bg-background min-h-screen pb-24 md:pb-16">
        <div className="container-tight text-center py-20">
          <p className="text-muted-foreground">
            {t("common.loading") || "Loading..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="section-padding bg-background min-h-screen pb-24 md:pb-16">
      <StructuredData type="blog" locale={locale} path="/blog" />
      <div className="container-tight">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center mx-auto mb-4">
            <BookOpen size={22} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-3">
            {t("blog.title")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("blog.subtitle")}
          </p>
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

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {t("blog.noPosts") || "No blog posts available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="fintech-card group flex flex-col h-full block"
                >
                  {post.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={getLocalizedTitle(post)}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
                    {post.author && (
                      <span className="flex items-center gap-1 font-medium text-accent">
                        <Tag size={11} />
                        {post.author}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-foreground mb-2 group-hover:text-accent transition-colors leading-snug">
                    {getLocalizedTitle(post)}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-5 leading-relaxed flex-1">
                    {getLocalizedExcerpt(post)}
                  </p>
                  <div className="flex items-center justify-end">
                    <div className="flex items-center text-sm font-semibold text-accent group-hover:gap-2 gap-1 transition-all">
                      <span>{t("blog.readMore")}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
