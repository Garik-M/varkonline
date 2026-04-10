import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Tag, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { sanitizeHtml } from "@/lib/sanitize";

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

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang } = useTranslation();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getBlogPostBySlug(slug)
      .then((data) => setPost(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

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
  const content = sanitizeHtml(rawContent);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(
      lang === "hy" ? "hy-AM" : lang === "ru" ? "ru-RU" : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );

  return (
    <main className="section-padding min-h-screen bg-background pb-24 md:pb-16">
      <div className="container-tight max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent mb-8 transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          {/* Cover image */}
          {post.image_url && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img
                src={post.image_url}
                alt={title}
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}

          {/* Meta */}
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

          {/* Title */}
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-8 leading-tight">
            {title}
          </h1>

          {/* Rich text content */}
          <article
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </motion.div>
      </div>
    </main>
  );
}
