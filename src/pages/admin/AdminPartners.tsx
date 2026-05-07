import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Landmark,
  Trash2,
  Search,
  Download,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface PartnerApplication {
  id: string;
  type: "bank" | "institution";
  organization_name: string;
  website: string;
  contact_name: string;
  phone: string;
  privacy_accepted: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  institution: "Financial Institution",
};

const TYPE_COLORS: Record<string, string> = {
  bank: "bg-primary/10 text-primary",
  institution: "bg-accent/10 text-accent",
};

export default function AdminPartners() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getPartnerApplications();
      setApplications(data || []);
    } catch (err) {
      console.error("Failed to fetch partner applications:", err);
      toast({ title: "Failed to load applications", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const deleteApplication = async (id: string) => {
    try {
      await api.deletePartnerApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Application deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const headers = [
      "Type",
      "Organization",
      "Website",
      "Contact",
      "Phone",
      "Date",
    ];
    const rows = filtered.map((a) => [
      TYPE_LABELS[a.type] || a.type,
      a.organization_name,
      a.website,
      a.contact_name,
      a.phone,
      new Date(a.created_at).toLocaleDateString(),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "partner-applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = applications.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.organization_name.toLowerCase().includes(q) ||
      a.contact_name.toLowerCase().includes(q) ||
      a.phone.includes(q) ||
      a.website.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">
          Partner Applications{" "}
          <span className="text-muted-foreground font-normal text-lg">
            ({filtered.length})
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchApplications}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={filtered.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold">{applications.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground mb-1">Banks</p>
            <p className="text-2xl font-bold text-primary">
              {applications.filter((a) => a.type === "bank").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground mb-1">Institutions</p>
            <p className="text-2xl font-bold text-accent">
              {applications.filter((a) => a.type === "institution").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No partner applications yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Organization
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Website
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Contact
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Badge className={TYPE_COLORS[app.type]}>
                        <span className="flex items-center gap-1.5">
                          {app.type === "bank" ? (
                            <Building2 size={11} />
                          ) : (
                            <Landmark size={11} />
                          )}
                          {TYPE_LABELS[app.type] || app.type}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {app.organization_name}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={app.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline truncate max-w-[160px] block"
                      >
                        {app.website.replace(/^https?:\/\//, "")}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {app.contact_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {app.phone}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
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
                            <AlertDialogTitle>
                              Delete this application?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the application from{" "}
                              <strong>{app.organization_name}</strong>. This
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteApplication(app.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden grid gap-3">
            {filtered.map((app) => (
              <Card key={app.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={TYPE_COLORS[app.type]}>
                          {TYPE_LABELS[app.type] || app.type}
                        </Badge>
                        <span className="font-semibold text-foreground truncate">
                          {app.organization_name}
                        </span>
                      </div>
                      <a
                        href={app.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline block truncate"
                      >
                        {app.website}
                      </a>
                      <p className="text-sm text-muted-foreground">
                        {app.contact_name} · {app.phone}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(app.created_at).toLocaleString()}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete this application?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the application from{" "}
                            <strong>{app.organization_name}</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteApplication(app.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
