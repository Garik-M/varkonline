import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Commission {
  id: string;
  lead_id: string;
  amount: number;
  currency: string;
  status: string;
  notes: string | null;
  created_at: string;
  lead_name?: string;
}

interface Lead {
  id: string;
  full_name: string;
  loan_amount: number;
  status: string;
}

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Commission | null>(null);
  const [form, setForm] = useState({
    lead_id: "",
    amount: 0,
    currency: "AMD",
    status: "pending",
    notes: "",
  });
  const { toast } = useToast();

  const fetch = async () => {
    try {
      const [c, l] = await Promise.all([api.getCommissions(), api.getLeads()]);
      setCommissions(c || []);
      setLeads((l || []).filter((lead: Lead) => lead.status === "funded"));
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      lead_id: leads[0]?.id || "",
      amount: 0,
      currency: "AMD",
      status: "pending",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, notes: form.notes || null };
      if (editing) {
        await api.updateCommission(editing.id, payload);
        toast({ title: "Commission updated" });
      } else {
        await api.createCommission(payload);
        toast({ title: "Commission added" });
      }
      setDialogOpen(false);
      fetch();
    } catch (error) {
      toast({ title: "Failed to save commission", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this commission?")) return;
    try {
      await api.deleteCommission(id);
      toast({ title: "Commission deleted" });
      fetch();
    } catch (error) {
      toast({ title: "Failed to delete commission", variant: "destructive" });
    }
  };

  const total = commissions.reduce((s, c) => s + Number(c.amount), 0);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commissions</h2>
          <p className="text-sm text-muted-foreground">
            Total: {total.toLocaleString()} AMD
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Add Commission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit" : "Add"} Commission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select
                value={form.lead_id}
                onValueChange={(v) => setForm({ ...form, lead_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select funded lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.full_name} ({Number(l.loan_amount).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: +e.target.value })}
              />
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <Button onClick={handleSave} className="w-full">
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {commissions.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="font-semibold">
                  {Number(c.amount).toLocaleString()} {c.currency}
                </div>
                <div className="text-sm text-muted-foreground">
                  {c.lead_name || "Unknown"} · {c.status} ·{" "}
                  {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(c.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {commissions.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No commissions yet.
          </p>
        )}
      </div>
    </div>
  );
}
