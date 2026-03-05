import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Commission {
  id: string;
  lead_id: string;
  amount: number;
  currency: string;
  status: string;
  notes: string | null;
  created_at: string;
  leads?: { full_name: string; loan_amount: number };
}

interface Lead { id: string; full_name: string; loan_amount: number; }

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Commission | null>(null);
  const [form, setForm] = useState({ lead_id: "", amount: 0, currency: "AMD", status: "pending", notes: "" });
  const { toast } = useToast();
  const sb = supabase as any;

  const fetch = async () => {
    const [c, l] = await Promise.all([
      sb.from("commissions").select("*, leads(full_name, loan_amount)").order("created_at", { ascending: false }),
      sb.from("leads").select("id, full_name, loan_amount").eq("status", "funded"),
    ]);
    setCommissions(c.data || []);
    setLeads(l.data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditing(null); setForm({ lead_id: leads[0]?.id || "", amount: 0, currency: "AMD", status: "pending", notes: "" }); setDialogOpen(true); };

  const handleSave = async () => {
    const payload = { ...form, notes: form.notes || null };
    if (editing) {
      await sb.from("commissions").update(payload).eq("id", editing.id);
      toast({ title: "Commission updated" });
    } else {
      await sb.from("commissions").insert(payload);
      toast({ title: "Commission added" });
    }
    setDialogOpen(false);
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this commission?")) return;
    await sb.from("commissions").delete().eq("id", id);
    toast({ title: "Commission deleted" });
    fetch();
  };

  const total = commissions.reduce((s, c) => s + Number(c.amount), 0);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commissions</h2>
          <p className="text-sm text-muted-foreground">Total: {total.toLocaleString()} AMD</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Commission</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Commission</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Select value={form.lead_id} onValueChange={(v) => setForm({ ...form, lead_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select funded lead" /></SelectTrigger>
                <SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.full_name} ({Number(l.loan_amount).toLocaleString()})</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} />
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {commissions.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="font-semibold">{Number(c.amount).toLocaleString()} {c.currency}</div>
                <div className="text-sm text-muted-foreground">
                  {(c.leads as any)?.full_name || "Unknown"} · {c.status} · {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {commissions.length === 0 && <p className="text-muted-foreground text-center py-8">No commissions yet.</p>}
      </div>
    </div>
  );
}
