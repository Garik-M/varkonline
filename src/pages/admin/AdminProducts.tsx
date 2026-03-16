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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LOAN_TYPES = [
  "consumer",
  "mortgage",
  "auto",
  "business",
  "refinancing",
] as const;

interface Product {
  id: string;
  bank_id: string;
  loan_type: string;
  name: string;
  interest_rate_min: number;
  interest_rate_max: number;
  min_amount: number;
  max_amount: number;
  min_duration_months: number;
  max_duration_months: number;
  requires_collateral: boolean;
  requires_salary_transfer: boolean;
  early_repayment: boolean;
  approval_time_days: number;
  description: string | null;
  active: boolean;
  bank_name?: string;
}

interface Bank {
  id: string;
  name: string;
  institution_type: string;
}

const defaultForm = {
  bank_id: "",
  loan_type: "consumer" as string,
  name: "",
  interest_rate_min: 10,
  interest_rate_max: 18,
  min_amount: 100000,
  max_amount: 10000000,
  min_duration_months: 6,
  max_duration_months: 60,
  requires_collateral: false,
  requires_salary_transfer: false,
  early_repayment: true,
  approval_time_days: 3,
  description: "",
  active: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(defaultForm);
  const { toast } = useToast();

  const fetch = async () => {
    try {
      const [p, b] = await Promise.all([api.getProducts({}), api.getBanks()]);
      setProducts(p || []);
      setBanks(b || []);
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
    setForm({ ...defaultForm, bank_id: banks[0]?.id || "" });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      bank_id: p.bank_id,
      loan_type: p.loan_type,
      name: p.name,
      interest_rate_min: p.interest_rate_min,
      interest_rate_max: p.interest_rate_max,
      min_amount: p.min_amount,
      max_amount: p.max_amount,
      min_duration_months: p.min_duration_months,
      max_duration_months: p.max_duration_months,
      requires_collateral: p.requires_collateral,
      requires_salary_transfer: p.requires_salary_transfer,
      early_repayment: p.early_repayment,
      approval_time_days: p.approval_time_days,
      description: p.description || "",
      active: p.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form, description: form.description || null };
      if (editing) {
        await api.updateProduct(editing.id, payload);
        toast({ title: "Product updated" });
      } else {
        await api.createProduct(payload);
        toast({ title: "Product added" });
      }
      setDialogOpen(false);
      fetch();
    } catch (error) {
      toast({ title: "Failed to save product", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      toast({ title: "Product deleted" });
      fetch();
    } catch (error) {
      toast({ title: "Failed to delete product", variant: "destructive" });
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loan Products</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Product" : "Add Product"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select
                value={form.bank_id}
                onValueChange={(v) => setForm({ ...form, bank_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} (
                      {b.institution_type === "credit_organization"
                        ? "CO"
                        : "Bank"}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.loan_type}
                onValueChange={(v) => setForm({ ...form, loan_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Min rate %"
                  value={form.interest_rate_min}
                  onChange={(e) =>
                    setForm({ ...form, interest_rate_min: +e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max rate %"
                  value={form.interest_rate_max}
                  onChange={(e) =>
                    setForm({ ...form, interest_rate_max: +e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={form.min_amount}
                  onChange={(e) =>
                    setForm({ ...form, min_amount: +e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={form.max_amount}
                  onChange={(e) =>
                    setForm({ ...form, max_amount: +e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Min months"
                  value={form.min_duration_months}
                  onChange={(e) =>
                    setForm({ ...form, min_duration_months: +e.target.value })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max months"
                  value={form.max_duration_months}
                  onChange={(e) =>
                    setForm({ ...form, max_duration_months: +e.target.value })
                  }
                />
              </div>
              <Input
                type="number"
                placeholder="Approval time (days)"
                value={form.approval_time_days}
                onChange={(e) =>
                  setForm({ ...form, approval_time_days: +e.target.value })
                }
              />
              <Input
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <div className="space-y-2">
                {[
                  { label: "Requires collateral", key: "requires_collateral" },
                  {
                    label: "Requires salary transfer",
                    key: "requires_salary_transfer",
                  },
                  { label: "Early repayment allowed", key: "early_repayment" },
                  { label: "Active", key: "active" },
                ].map(({ label, key }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch
                      checked={(form as any)[key]}
                      onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
              <Button onClick={handleSave} className="w-full">
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {products.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-muted-foreground">
                  {p.bank_name} · {p.loan_type} · {p.interest_rate_min}–
                  {p.interest_rate_max}% · {p.approval_time_days}d
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${p.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {p.active ? "Active" : "Inactive"}
                </span>
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No products yet. Add banks first, then create products.
          </p>
        )}
      </div>
    </div>
  );
}
