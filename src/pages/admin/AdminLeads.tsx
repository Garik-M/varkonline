import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["new", "sent_to_bank", "approved", "funded"] as const;
const STATUS_COLORS: Record<string, string> = {
  new: "bg-info/10 text-info",
  sent_to_bank: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  funded: "bg-success/10 text-success",
};

interface Lead {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  loan_amount: number;
  loan_duration_months: number;
  loan_purpose: string;
  employment_type: string | null;
  monthly_income: number | null;
  existing_loans: number | null;
  status: string;
  approval_probability: string | null;
  notes: string | null;
  created_at: string;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const sb = supabase as any;

  const fetchLeads = async () => {
    let query = sb.from("leads").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setLeads(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await sb.from("leads").update({ status }).eq("id", id);
    toast({ title: `Lead marked as ${status.replace("_", " ")}` });
    fetchLeads();
  };

  const exportCSV = () => {
    const headers = ["Name", "Phone", "Email", "Amount", "Duration", "Purpose", "Income", "Status", "Date"];
    const rows = filtered.map((l) => [
      l.full_name, l.phone, l.email || "", l.loan_amount, l.loan_duration_months,
      l.loan_purpose, l.monthly_income || "", l.status, new Date(l.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "leads.csv"; a.click();
  };

  const filtered = leads.filter((l) =>
    !search || l.full_name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)
  );

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Leads ({filtered.length})</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {filtered.map((lead) => (
          <Card key={lead.id}>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold">{lead.full_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {lead.phone} · {lead.email || "No email"} · {lead.loan_purpose}
                  </div>
                  <div className="text-sm">
                    Amount: <span className="font-medium">{Number(lead.loan_amount).toLocaleString()} AMD</span> ·
                    Duration: {lead.loan_duration_months}mo ·
                    Income: {lead.monthly_income ? `${Number(lead.monthly_income).toLocaleString()} AMD` : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLORS[lead.status]}>{lead.status.replace("_", " ")}</Badge>
                  <Select value={lead.status} onValueChange={(v) => updateStatus(lead.id, v)}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-8">No leads found.</p>}
      </div>
    </div>
  );
}
