import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { AD_SLOTS, SLOT_LABELS, type AdSlot } from "@/lib/adSlots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  ImagePlus,
  X,
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  BarChart2,
  Calendar,
  CheckSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Advertisement {
  id: string;
  title: string;
  slot: string;
  destination_url: string;
  open_in_new_tab: boolean;
  image_desktop: string;
  image_tablet: string | null;
  image_mobile: string | null;
  enabled: boolean;
  priority: number;
  impressions: number;
  clicks: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

type AdStatus = "active" | "scheduled" | "expired" | "disabled";
type StatusFilter = "all" | AdStatus;

type SortOption =
  | "priority-desc"
  | "priority-asc"
  | "created-desc"
  | "created-asc"
  | "updated-desc"
  | "impressions-desc"
  | "clicks-desc"
  | "ctr-desc";

// ── Helpers ────────────────────────────────────────────────────────────────────

function ctr(impressions: number, clicks: number): string {
  if (impressions === 0) return "—";
  return ((clicks / impressions) * 100).toFixed(2) + "%";
}

function ctrValue(impressions: number, clicks: number): number {
  return impressions === 0 ? 0 : clicks / impressions;
}

function getAdStatus(ad: Advertisement): AdStatus {
  if (!ad.enabled) return "disabled";
  const now = new Date();
  if (ad.start_date && new Date(ad.start_date) > now) return "scheduled";
  if (ad.end_date && new Date(ad.end_date) <= now) return "expired";
  return "active";
}

const STATUS_CONFIG: Record<AdStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  scheduled: {
    label: "Scheduled",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  expired: {
    label: "Expired",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  disabled: {
    label: "Disabled",
    className: "bg-muted text-muted-foreground",
  },
};

const SORT_LABELS: Record<SortOption, string> = {
  "priority-desc": "Priority: High → Low",
  "priority-asc": "Priority: Low → High",
  "created-desc": "Created: Newest",
  "created-asc": "Created: Oldest",
  "updated-desc": "Updated: Newest",
  "impressions-desc": "Impressions: Most",
  "clicks-desc": "Clicks: Most",
  "ctr-desc": "CTR: Highest",
};

function sortAds(ads: Advertisement[], sort: SortOption): Advertisement[] {
  return [...ads].sort((a, b) => {
    switch (sort) {
      case "priority-desc": return b.priority - a.priority;
      case "priority-asc":  return a.priority - b.priority;
      case "created-desc":  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "created-asc":   return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "updated-desc":  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case "impressions-desc": return (b.impressions ?? 0) - (a.impressions ?? 0);
      case "clicks-desc":  return (b.clicks ?? 0) - (a.clicks ?? 0);
      case "ctr-desc":     return ctrValue(b.impressions ?? 0, b.clicks ?? 0) - ctrValue(a.impressions ?? 0, a.clicks ?? 0);
      default: return 0;
    }
  });
}

// Convert a DB ISO timestamp to a datetime-local input value (local time).
function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isValidHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// ── ImageUploadField ───────────────────────────────────────────────────────────

interface ImageField {
  preview: string | null;
  file: File | null;
  removed: boolean;
}

const emptyImage = (): ImageField => ({ preview: null, file: null, removed: false });

interface ImageUploadProps {
  label: string;
  required?: boolean;
  icon: React.ReactNode;
  field: ImageField;
  onChange: (updated: ImageField) => void;
  error?: string;
}

function ImageUploadField({ label, required, icon, field, onChange, error }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onChange({ preview, file, removed: false });
    e.target.value = "";
  };

  const handleRemove = () => {
    if (field.preview && field.file) URL.revokeObjectURL(field.preview);
    onChange({ preview: null, file: null, removed: true });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </span>
        {!required && (
          <span className="text-xs text-muted-foreground">(optional)</span>
        )}
      </div>

      {field.preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
          <img src={field.preview} alt={label} className="w-full h-28 object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded transition-colors"
            >
              Replace
            </button>
            {!required && (
              <button
                type="button"
                onClick={handleRemove}
                className="bg-black/60 hover:bg-destructive text-white rounded-full p-1 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            error
              ? "border-destructive/60 bg-destructive/5 hover:bg-destructive/10"
              : "border-border hover:bg-muted/50"
          }`}
        >
          <ImagePlus size={20} className="text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">Click to upload</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      )}

      {field.preview && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Form state ─────────────────────────────────────────────────────────────────

const emptyForm = {
  title: "",
  slot: "" as AdSlot | "",
  destinationUrl: "",
  openInNewTab: true,
  priority: 0,
  enabled: true,
  startDate: "",
  endDate: "",
};

type FormState = typeof emptyForm;

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminAdvertisements() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [slotFilter, setSlotFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("priority-desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [desktop, setDesktop] = useState<ImageField>(emptyImage());
  const [tablet, setTablet] = useState<ImageField>(emptyImage());
  const [mobile, setMobile] = useState<ImageField>(emptyImage());
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "imageDesktop", string>>>({});
  const [detailsAd, setDetailsAd] = useState<Advertisement | null>(null);
  const { toast } = useToast();

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchAds = async () => {
    setLoading(true);
    try {
      const data = await api.getAdvertisements();
      setAds(data || []);
    } catch {
      toast({ title: "Failed to load advertisements", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // ── Filtering & sorting ──────────────────────────────────────────────────────

  const filtered = sortAds(
    ads.filter((ad) => {
      if (search && !ad.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && getAdStatus(ad) !== statusFilter) return false;
      if (slotFilter !== "all" && ad.slot !== slotFilter) return false;
      return true;
    }),
    sortOption
  );

  // ── Selection ────────────────────────────────────────────────────────────────

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((ad) => selectedIds.has(ad.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((ad) => next.delete(ad.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((ad) => next.add(ad.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────────

  const handleBulkAction = async (action: "enable" | "disable" | "delete") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      await api.bulkAdvertisements(ids, action);
      toast({
        title: `${ids.length} advertisement${ids.length > 1 ? "s" : ""} ${
          action === "delete" ? "deleted" : action + "d"
        }`,
      });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      fetchAds();
    } catch {
      toast({ title: `Failed to ${action} advertisements`, variant: "destructive" });
    }
    setBulkDeleting(false);
  };

  // ── Dialog helpers ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDesktop(emptyImage());
    setTablet(emptyImage());
    setMobile(emptyImage());
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (ad: Advertisement) => {
    setEditing(ad);
    setForm({
      title: ad.title,
      slot: ad.slot as AdSlot,
      destinationUrl: ad.destination_url,
      openInNewTab: ad.open_in_new_tab,
      priority: ad.priority,
      enabled: ad.enabled,
      startDate: isoToDatetimeLocal(ad.start_date),
      endDate: isoToDatetimeLocal(ad.end_date),
    });
    setDesktop({ preview: ad.image_desktop, file: null, removed: false });
    setTablet({ preview: ad.image_tablet, file: null, removed: false });
    setMobile({ preview: ad.image_mobile, file: null, removed: false });
    setErrors({});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    if (desktop.file && desktop.preview) URL.revokeObjectURL(desktop.preview);
    if (tablet.file && tablet.preview) URL.revokeObjectURL(tablet.preview);
    if (mobile.file && mobile.preview) URL.revokeObjectURL(mobile.preview);
  };

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = "Title is required";
    if (!form.slot) next.slot = "Slot is required";
    if (!form.destinationUrl.trim()) {
      next.destinationUrl = "Destination URL is required";
    } else if (!isValidHttpsUrl(form.destinationUrl)) {
      next.destinationUrl = "Must be a valid HTTPS URL";
    }
    if (!editing && !desktop.file) next.imageDesktop = "Desktop banner is required";
    if (form.priority < 0 || !Number.isInteger(form.priority)) {
      next.priority = "Must be a non-negative integer";
    }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      next.endDate = "End date must be after start date";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = new FormData();
      data.append("title", form.title.trim());
      data.append("slot", form.slot);
      data.append("destinationUrl", form.destinationUrl.trim());
      data.append("openInNewTab", String(form.openInNewTab));
      data.append("priority", String(form.priority));
      data.append("enabled", String(form.enabled));
      // Send ISO string so backend stores UTC; empty string clears the date
      data.append("startDate", form.startDate ? new Date(form.startDate).toISOString() : "");
      data.append("endDate", form.endDate ? new Date(form.endDate).toISOString() : "");

      if (desktop.file) data.append("imageDesktop", desktop.file);
      if (tablet.file) data.append("imageTablet", tablet.file);
      else if (tablet.removed) data.append("removeImageTablet", "true");
      if (mobile.file) data.append("imageMobile", mobile.file);
      else if (mobile.removed) data.append("removeImageMobile", "true");

      if (editing) {
        await api.updateAdvertisement(editing.id, data);
        toast({ title: "Advertisement updated" });
      } else {
        await api.createAdvertisement(data);
        toast({ title: "Advertisement created" });
      }

      closeDialog();
      fetchAds();
    } catch (err: any) {
      toast({ title: err.message || "Failed to save advertisement", variant: "destructive" });
    }
    setSaving(false);
  };

  // ── Single-item actions ──────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAdvertisement(id);
      setAds((prev) => prev.filter((a) => a.id !== id));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast({ title: "Advertisement deleted" });
    } catch {
      toast({ title: "Failed to delete advertisement", variant: "destructive" });
    }
  };

  const handleToggleEnabled = async (ad: Advertisement) => {
    try {
      const data = new FormData();
      data.append("enabled", String(!ad.enabled));
      await api.updateAdvertisement(ad.id, data);
      setAds((prev) =>
        prev.map((a) => (a.id === ad.id ? { ...a, enabled: !a.enabled } : a))
      );
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  // ── Stats ────────────────────────────────────────────────────────────────────

  const statusCounts = ads.reduce(
    (acc, ad) => { acc[getAdStatus(ad)]++; return acc; },
    { active: 0, scheduled: 0, expired: 0, disabled: 0 } as Record<AdStatus, number>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">
          Advertisements{" "}
          <span className="text-muted-foreground font-normal text-lg">
            ({filtered.length})
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-52"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchAds}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            New Advertisement
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {statusCounts.active}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {statusCounts.scheduled}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground mb-1">Expired</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {statusCounts.expired}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground mb-1">Disabled</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {statusCounts.disabled}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Sort */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status pills */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg flex-wrap">
          {(["all", "active", "scheduled", "expired", "disabled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                statusFilter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>

        {/* Slot filter */}
        <Select value={slotFilter} onValueChange={setSlotFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All Slots" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Slots</SelectItem>
            {AD_SLOTS.map((s) => (
              <SelectItem key={s} value={s}>
                {SLOT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
          <SelectTrigger className="w-52 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => (
              <SelectItem key={k} value={k}>
                {SORT_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-muted/60 border border-border rounded-lg px-4 py-2.5">
          <CheckSquare className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("enable")}
              disabled={bulkDeleting}
            >
              Enable
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("disable")}
              disabled={bulkDeleting}
            >
              Disable
            </Button>
            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={bulkDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete {selectedIds.size}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selectedIds.size} advertisement{selectedIds.size > 1 ? "s" : ""}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the selected advertisements and remove all
                    uploaded banner images. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleBulkAction("delete")}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={bulkDeleting}
                  >
                    {bulkDeleting ? "Deleting…" : "Delete All"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {ads.length === 0
              ? "No advertisements yet. Create your first one."
              : "No results match the current filters."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-20">
                    Banner
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Slot
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-20">
                    Pri.
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-28">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-36">
                    Schedule
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground w-20">
                    Impr.
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground w-16">
                    Clicks
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground w-16">
                    CTR
                  </th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((ad) => {
                  const status = getAdStatus(ad);
                  const sc = STATUS_CONFIG[status];
                  return (
                    <tr
                      key={ad.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        selectedIds.has(ad.id) ? "bg-muted/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(ad.id)}
                          onCheckedChange={() => toggleSelect(ad.id)}
                          aria-label={`Select ${ad.title}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <img
                          src={ad.image_desktop}
                          alt={ad.title}
                          className="w-14 h-9 rounded object-cover border border-border"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-[160px]">
                        <span className="block truncate">{ad.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {SLOT_LABELS[ad.slot as AdSlot] ?? ad.slot}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-muted-foreground">
                        {ad.priority}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleEnabled(ad)}
                          className="flex items-center gap-2 group"
                          title="Toggle enabled"
                        >
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.className}`}>
                            {sc.label}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {ad.start_date || ad.end_date ? (
                          <div className="space-y-0.5">
                            {ad.start_date && (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground/60">From</span>{" "}
                                {new Date(ad.start_date).toLocaleDateString()}
                              </div>
                            )}
                            {ad.end_date && (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground/60">Until</span>{" "}
                                {new Date(ad.end_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">Always</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">
                        {(ad.impressions ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">
                        {(ad.clicks ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                        {ctr(ad.impressions ?? 0, ad.clicks ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => setDetailsAd(ad)}
                            title="View details"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(ad)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this advertisement?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete{" "}
                                  <strong>{ad.title}</strong> and remove all uploaded banner
                                  images. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(ad.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid gap-3">
            {filtered.map((ad) => {
              const status = getAdStatus(ad);
              const sc = STATUS_CONFIG[status];
              return (
                <Card key={ad.id} className={selectedIds.has(ad.id) ? "ring-2 ring-primary/30" : ""}>
                  <CardContent className="py-4">
                    <div className="flex gap-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedIds.has(ad.id)}
                          onCheckedChange={() => toggleSelect(ad.id)}
                          className="mt-0.5"
                        />
                        <img
                          src={ad.image_desktop}
                          alt={ad.title}
                          className="w-20 h-14 rounded object-cover border border-border shrink-0"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm truncate">{ad.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${sc.className}`}>
                            {sc.label}
                          </span>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {SLOT_LABELS[ad.slot as AdSlot] ?? ad.slot}
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate">
                          {ad.destination_url.replace(/^https?:\/\//, "")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Priority: {ad.priority}
                          {ad.start_date && ` · From ${new Date(ad.start_date).toLocaleDateString()}`}
                          {ad.end_date && ` · Until ${new Date(ad.end_date).toLocaleDateString()}`}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {(ad.impressions ?? 0).toLocaleString()} impr ·{" "}
                          {(ad.clicks ?? 0).toLocaleString()} clicks · CTR{" "}
                          {ctr(ad.impressions ?? 0, ad.clicks ?? 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <Button variant="outline" size="sm" onClick={() => setDetailsAd(ad)}>
                        <BarChart2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEdit(ad)}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-2" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete advertisement?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete{" "}
                              <strong>{ad.title}</strong> and all uploaded banners.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(ad.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Advertisement" : "New Advertisement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Summer Promo — Left Banner"
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            {/* Slot */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Slot <span className="text-destructive">*</span>
              </label>
              <Select
                value={form.slot}
                onValueChange={(v) => {
                  setForm({ ...form, slot: v as AdSlot });
                  if (errors.slot) setErrors({ ...errors, slot: undefined });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a slot" />
                </SelectTrigger>
                <SelectContent>
                  {AD_SLOTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SLOT_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.slot && <p className="text-xs text-destructive">{errors.slot}</p>}
            </div>

            {/* Destination URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Destination URL <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="https://example.com/landing"
                value={form.destinationUrl}
                onChange={(e) => {
                  setForm({ ...form, destinationUrl: e.target.value });
                  if (errors.destinationUrl)
                    setErrors({ ...errors, destinationUrl: undefined });
                }}
              />
              {errors.destinationUrl && (
                <p className="text-xs text-destructive">{errors.destinationUrl}</p>
              )}
            </div>

            {/* Priority + Toggles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Priority</label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.priority}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setForm({ ...form, priority: isNaN(v) ? 0 : Math.max(0, v) });
                    if (errors.priority) setErrors({ ...errors, priority: undefined });
                  }}
                />
                {errors.priority && (
                  <p className="text-xs text-destructive">{errors.priority}</p>
                )}
              </div>
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.openInNewTab}
                    onCheckedChange={(v) => setForm({ ...form, openInNewTab: v })}
                  />
                  <span className="text-sm">Open in new tab</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(v) => setForm({ ...form, enabled: v })}
                  />
                  <span className="text-sm">Enabled</span>
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Scheduling
                </p>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Start date</label>
                  <Input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => {
                      setForm({ ...form, startDate: e.target.value });
                      if (errors.startDate) setErrors({ ...errors, startDate: undefined });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Leave blank to start immediately</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">End date</label>
                  <Input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => {
                      setForm({ ...form, endDate: e.target.value });
                      if (errors.endDate) setErrors({ ...errors, endDate: undefined });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Leave blank to run indefinitely</p>
                  {errors.endDate && (
                    <p className="text-xs text-destructive">{errors.endDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="border-t border-border pt-4 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Banner Images
              </p>

              <ImageUploadField
                label="Desktop Banner"
                required
                icon={<Monitor className="w-4 h-4 text-muted-foreground" />}
                field={desktop}
                onChange={(f) => {
                  setDesktop(f);
                  if (errors.imageDesktop) setErrors({ ...errors, imageDesktop: undefined });
                }}
                error={errors.imageDesktop}
              />

              <ImageUploadField
                label="Tablet Banner"
                icon={<Tablet className="w-4 h-4 text-muted-foreground" />}
                field={tablet}
                onChange={setTablet}
              />

              <ImageUploadField
                label="Mobile Banner"
                icon={<Smartphone className="w-4 h-4 text-muted-foreground" />}
                field={mobile}
                onChange={setMobile}
              />

              {((!tablet.preview && !tablet.file) || (!mobile.preview && !mobile.file)) ? (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                  {!tablet.preview && !tablet.file && !mobile.preview && !mobile.file
                    ? "Only the desktop banner will be used — tablet and mobile banners are missing."
                    : !tablet.preview && !tablet.file
                    ? "Tablet banner is missing — desktop will be used for tablets."
                    : "Mobile banner is missing — desktop will be used for mobile."}
                </p>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeDialog} disabled={saving}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving
                  ? editing ? "Saving…" : "Creating…"
                  : editing ? "Save Changes" : "Create Advertisement"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={!!detailsAd}
        onOpenChange={(open) => { if (!open) setDetailsAd(null); }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Advertisement Details</DialogTitle>
          </DialogHeader>
          {detailsAd && (() => {
            const status = getAdStatus(detailsAd);
            const sc = STATUS_CONFIG[status];
            return (
              <div className="space-y-5 pt-1">
                <img
                  src={detailsAd.image_desktop}
                  alt={detailsAd.title}
                  className="w-full rounded-lg object-cover max-h-40 border border-border"
                />

                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Title</p>
                    <p className="font-medium">{detailsAd.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Slot</p>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {SLOT_LABELS[detailsAd.slot as AdSlot] ?? detailsAd.slot}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.className}`}>
                      {sc.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Priority</p>
                    <p className="font-mono">{detailsAd.priority}</p>
                  </div>
                  {detailsAd.start_date && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Start date</p>
                      <p className="text-sm">{new Date(detailsAd.start_date).toLocaleString()}</p>
                    </div>
                  )}
                  {detailsAd.end_date && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">End date</p>
                      <p className="text-sm">{new Date(detailsAd.end_date).toLocaleString()}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Destination URL</p>
                    <a
                      href={detailsAd.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-sm truncate"
                    >
                      <span className="truncate">{detailsAd.destination_url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                    <p className="text-sm">{new Date(detailsAd.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Updated</p>
                    <p className="text-sm">{new Date(detailsAd.updated_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Analytics
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/40 px-4 py-3 text-center">
                      <p className="text-2xl font-bold">
                        {(detailsAd.impressions ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Impressions</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-4 py-3 text-center">
                      <p className="text-2xl font-bold">
                        {(detailsAd.clicks ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Clicks</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {ctr(detailsAd.impressions ?? 0, detailsAd.clicks ?? 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">CTR</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDetailsAd(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => { setDetailsAd(null); openEdit(detailsAd); }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
