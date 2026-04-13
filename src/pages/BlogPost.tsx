import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { sanitizeHtml } from "@/lib/sanitize";
import PageMeta from "@/components/PageMeta";

interface BlogPostData {
  id: string;
  slug: string;
  title_hy: string;
  title_en: string;
  title_ru: string;
  content_hy: string;
  content_en: string;
  content_ru: string;
  excerpt_hy: string | null;
  excerpt_en: string | null;
  excerpt_ru: string | null;
  image_url: string | null;
  author: string | null;
  created_at: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number; // 1 | 2 | 3
}

/** Parse h1/h2/h3 from HTML string, inject id attributes, return modified HTML + TOC */
function processContent(html: string): { html: string; toc: TocItem[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const toc: TocItem[] = [];
  const counts: Record<string, number> = {};

  doc.querySelectorAll("h1, h2, h3").forEach((el) => {
    const text = el.textContent?.trim() || "";
    const base = text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    counts[base] = (counts[base] || 0) + 1;
    const id = counts[base] > 1 ? `${base}-${counts[base]}` : base;
    el.setAttribute("id", id);
    toc.push({ id, text, level: parseInt(el.tagName[1]) });
  });

  return { html: doc.body.innerHTML, toc };
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getBlogPostBySlug(slug)
      .then((data) => setPost(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Highlight active TOC item on scroll
  useEffect(() => {
    if (!articleRef.current) return;
    const headings = Array.from(
      articleRef.current.querySelectorAll("h1[id], h2[id], h3[id]"),
    ) as HTMLElement[];
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [post, lang]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 96; // height of fixed header + breathing room
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  if (loading) {
    return (
      <main className="section-padding min-h-screen bg-background">
        <div className="container-tight py-20 text-center text-muted-foreground">
          Loading...
        </div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="section-padding min-h-screen bg-background">
        <div className="container-tight py-20 text-center">
          <p className="text-muted-foreground mb-4">Blog post not found.</p>
          <button
            onClick={() => navigate(-1)}
            className="text-accent underline text-sm"
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  const title =
    lang === "hy"
      ? post.title_hy
      : lang === "ru"
        ? post.title_ru
        : post.title_en;
  const rawContent =
    lang === "hy"
      ? post.content_hy
      : lang === "ru"
        ? post.content_ru
        : post.content_en;

  const { html: content, toc } = processContent(sanitizeHtml(rawContent));

  const excerpt =
    lang === "hy"
      ? post.excerpt_hy
      : lang === "ru"
        ? post.excerpt_ru
        : post.excerpt_en;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(
      lang === "hy" ? "hy-AM" : lang === "ru" ? "ru-RU" : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );

  return (
    <main className="section-padding min-h-screen bg-background pb-24 md:pb-16">
      <PageMeta
        title={title}
        description={excerpt || title}
        path={`/blog/${post.slug}`}
        ogImage={post.image_url || undefined}
        ogType="article"
      />
      {/* Outer wrapper: TOC left + content center */}
      <div className="relative max-w-6xl mx-auto px-4">
        {/* Fixed TOC — only shown when there are headings, only on large screens */}
        {toc.length > 0 && (
          <aside className="hidden xl:block fixed top-28 left-[max(1rem,calc(50%-44rem))] w-52 z-20">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Contents
              </p>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={`
                      block w-full text-left text-sm leading-snug py-1 px-2 rounded-md transition-colors
                      ${item.level === 2 ? "pl-4" : item.level === 3 ? "pl-6" : ""}
                      ${
                        activeId === item.id
                          ? "text-accent font-semibold bg-accent/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        )}

        {/* Article content */}
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent mb-8 transition-colors"
            >
              <ArrowLeft size={15} />
              Back
            </button>

            {post.image_url && (
              <div className="rounded-xl overflow-hidden mb-8">
                <img
                  src={post.image_url}
                  alt={title}
                  className="w-full max-h-96 object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
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

            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-8 leading-tight">
              {title}
            </h1>

            <article
              ref={articleRef}
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </motion.div>
        </div>
      </div>
    </main>
  );
}
