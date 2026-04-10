import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Globe, ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/RichTextEditor";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

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

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [currentLang, setCurrentLang] = useState<"hy" | "en" | "ru">("hy");
  const [form, setForm] = useState({
    slug: "",
    title_hy: "",
    title_en: "",
    title_ru: "",
    excerpt_hy: "",
    excerpt_en: "",
    excerpt_ru: "",
    content_hy: "",
    content_en: "",
    content_ru: "",
    image_url: "",
    author: "",
    published: false,
  });
  const { toast } = useToast();
  const [coverUploading, setCoverUploading] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Cover upload failed",
        variant: "destructive",
      });
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  };

  const fetchPosts = async () => {
    try {
      const data = await api.getAdminBlogPosts();
      setPosts(data || []);
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const openNew = () => {
    setEditing(null);
    setCurrentLang("hy");
    setForm({
      slug: "",
      title_hy: "",
      title_en: "",
      title_ru: "",
      excerpt_hy: "",
      excerpt_en: "",
      excerpt_ru: "",
      content_hy: "",
      content_en: "",
      content_ru: "",
      image_url: "",
      author: "",
      published: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setCurrentLang("hy");
    setForm({
      slug: post.slug,
      title_hy: post.title_hy,
      title_en: post.title_en,
      title_ru: post.title_ru,
      excerpt_hy: post.excerpt_hy || "",
      excerpt_en: post.excerpt_en || "",
      excerpt_ru: post.excerpt_ru || "",
      content_hy: post.content_hy,
      content_en: post.content_en,
      content_ru: post.content_ru,
      image_url: post.image_url || "",
      author: post.author || "",
      published: post.published,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        excerpt_hy: form.excerpt_hy || null,
        excerpt_en: form.excerpt_en || null,
        excerpt_ru: form.excerpt_ru || null,
        image_url: form.image_url || null,
        author: form.author || null,
      };

      if (editing) {
        await api.updateBlogPost(editing.id, payload);
        toast({ title: "Blog post updated" });
      } else {
        await api.createBlogPost(payload);
        toast({ title: "Blog post created" });
      }
      setDialogOpen(false);
      fetchPosts();
    } catch (error) {
      toast({ title: "Failed to save blog post", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      await api.deleteBlogPost(id);
      toast({ title: "Blog post deleted" });
      fetchPosts();
    } catch (error) {
      toast({ title: "Failed to delete blog post", variant: "destructive" });
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Blog Posts</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Add Blog Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Blog Post" : "Add Blog Post"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="URL Slug (e.g., how-to-get-loan)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
              {/* Cover image upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Cover Image
                </label>
                {form.image_url ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                    <img
                      src={form.image_url}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${coverUploading ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <ImagePlus
                      size={22}
                      className="text-muted-foreground mb-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      {coverUploading
                        ? "Uploading..."
                        : "Click to upload cover image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </label>
                )}
              </div>
              <Input
                placeholder="Author"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />

              <Tabs
                value={currentLang}
                onValueChange={(v) => setCurrentLang(v as any)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="hy">
                    <Globe className="w-4 h-4 mr-2" /> Armenian
                  </TabsTrigger>
                  <TabsTrigger value="en">
                    <Globe className="w-4 h-4 mr-2" /> English
                  </TabsTrigger>
                  <TabsTrigger value="ru">
                    <Globe className="w-4 h-4 mr-2" /> Russian
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="hy" className="space-y-4">
                  <Input
                    placeholder="Title (Armenian)"
                    value={form.title_hy}
                    onChange={(e) =>
                      setForm({ ...form, title_hy: e.target.value })
                    }
                  />
                  <Textarea
                    placeholder="Excerpt (Armenian)"
                    value={form.excerpt_hy}
                    onChange={(e) =>
                      setForm({ ...form, excerpt_hy: e.target.value })
                    }
                    rows={3}
                  />
                  <RichTextEditor
                    value={form.content_hy}
                    onChange={(val) => setForm({ ...form, content_hy: val })}
                    placeholder="Content (Armenian)"
                  />
                </TabsContent>

                <TabsContent value="en" className="space-y-4">
                  <Input
                    placeholder="Title (English)"
                    value={form.title_en}
                    onChange={(e) =>
                      setForm({ ...form, title_en: e.target.value })
                    }
                  />
                  <Textarea
                    placeholder="Excerpt (English)"
                    value={form.excerpt_en}
                    onChange={(e) =>
                      setForm({ ...form, excerpt_en: e.target.value })
                    }
                    rows={3}
                  />
                  <RichTextEditor
                    value={form.content_en}
                    onChange={(val) => setForm({ ...form, content_en: val })}
                    placeholder="Content (English)"
                  />
                </TabsContent>

                <TabsContent value="ru" className="space-y-4">
                  <Input
                    placeholder="Title (Russian)"
                    value={form.title_ru}
                    onChange={(e) =>
                      setForm({ ...form, title_ru: e.target.value })
                    }
                  />
                  <Textarea
                    placeholder="Excerpt (Russian)"
                    value={form.excerpt_ru}
                    onChange={(e) =>
                      setForm({ ...form, excerpt_ru: e.target.value })
                    }
                    rows={3}
                  />
                  <RichTextEditor
                    value={form.content_ru}
                    onChange={(val) => setForm({ ...form, content_ru: val })}
                    placeholder="Content (Russian)"
                  />
                </TabsContent>
              </Tabs>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.published}
                  onCheckedChange={(v) => setForm({ ...form, published: v })}
                />
                <span className="text-sm">Published</span>
              </div>

              <Button onClick={handleSave} className="w-full">
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4 flex-1">
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt={post.title_en}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{post.title_en}</div>
                  <div className="text-sm text-muted-foreground">
                    {post.slug} · {post.author || "No author"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    post.published
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(post)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No blog posts yet. Add your first blog post.
          </p>
        )}
      </div>
    </div>
  );
}
