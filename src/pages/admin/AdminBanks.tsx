import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, ArrowDownToLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Bank {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  institution_type: string;
  active: boolean;
}

export default function AdminBanks() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    description: "",
    website: "",
    institution_type: "bank",
    active: true,
  });
  const { toast } = useToast();

  const fetchBanks = async () => {
    try {
      const data = await api.getBanks();
      setBanks(data || []);
    } catch (error) {
      console.error("Failed to fetch banks:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      logo_url: "",
      description: "",
      website: "",
      institution_type: "bank",
      active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (bank: Bank) => {
    setEditing(bank);
    setForm({
      name: bank.name,
      logo_url: bank.logo_url || "",
      description: bank.description || "",
      website: bank.website || "",
      institution_type: bank.institution_type || "bank",
      active: bank.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        logo_url: form.logo_url || null,
        description: form.description || null,
        website: form.website || null,
      };
      if (editing) {
        await api.updateBank(editing.id, payload);
        toast({ title: "Institution updated" });
      } else {
        await api.createBank(payload);
        toast({ title: "Institution added" });
      }
      setDialogOpen(false);
      fetchBanks();
    } catch (error) {
      toast({ title: "Failed to save institution", variant: "destructive" });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.syncScrapedToProducts();
      toast({
        title: `Synced ${res.banks} banks and ${res.products} products from scraped data`,
      });
      fetchBanks();
    } catch (err: any) {
      toast({
        title: "Sync failed",
        description: err.message,
        variant: "destructive",
      });
    }
    setSyncing(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this institution and all its products?")) return;
    try {
      await api.deleteBank(id);
      toast({ title: "Institution deleted" });
      fetchBanks();
    } catch (error) {
      toast({ title: "Failed to delete institution", variant: "destructive" });
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Institutions</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <ArrowDownToLine
              className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync from Scraped"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="w-4 h-4 mr-2" /> Add Institution
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Institution" : "Add Institution"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Institution name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Select
                  value={form.institution_type}
                  onValueChange={(v) =>
                    setForm({ ...form, institution_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Institution type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="credit_organization">
                      Credit Organization
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Logo URL"
                  value={form.logo_url}
                  onChange={(e) =>
                    setForm({ ...form, logo_url: e.target.value })
                  }
                />
                <Input
                  placeholder="Website"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                />
                <Input
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => setForm({ ...form, active: v })}
                  />
                  <span className="text-sm">Active</span>
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editing ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {banks.map((bank) => (
          <Card key={bank.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                {bank.logo_url && (
                  <img
                    src={bank.logo_url}
                    alt={bank.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                )}
                <div>
                  <div className="font-semibold">{bank.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {bank.institution_type === "credit_organization"
                      ? "Credit Organization"
                      : "Bank"}{" "}
                    · {bank.website}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${bank.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {bank.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(bank)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(bank.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {banks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-medium mb-2">No institutions yet.</p>
            <p className="text-sm mb-4">
              Click "Sync from Scraped" to import all banks from scraped loan
              data.
            </p>
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              {syncing ? "Syncing..." : "Sync from Scraped"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
