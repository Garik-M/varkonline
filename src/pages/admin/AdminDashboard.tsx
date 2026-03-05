import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CreditCard, Users, DollarSign, TrendingUp, Eye } from "lucide-react";

interface Stats {
  banks: number;
  products: number;
  leads: number;
  leadsNew: number;
  leadsApproved: number;
  leadsFunded: number;
  totalCommission: number;
  pageViews: number;
  ctaClicks: number;
  formSubmits: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    banks: 0, products: 0, leads: 0, leadsNew: 0,
    leadsApproved: 0, leadsFunded: 0, totalCommission: 0,
    pageViews: 0, ctaClicks: 0, formSubmits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const sb = supabase as any;
      const [banks, products, leads, commissions, views, clicks, forms] = await Promise.all([
        sb.from("banks").select("id", { count: "exact", head: true }),
        sb.from("loan_products").select("id", { count: "exact", head: true }),
        sb.from("leads").select("id, status"),
        sb.from("commissions").select("amount"),
        sb.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "page_view"),
        sb.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "cta_click"),
        sb.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "form_submit"),
      ]);

      const leadsData = leads.data || [];
      const commissionsData = commissions.data || [];

      setStats({
        banks: banks.count || 0,
        products: products.count || 0,
        leads: leadsData.length,
        leadsNew: leadsData.filter((l: any) => l.status === "new").length,
        leadsApproved: leadsData.filter((l: any) => l.status === "approved").length,
        leadsFunded: leadsData.filter((l: any) => l.status === "funded").length,
        totalCommission: commissionsData.reduce((sum: number, c: any) => sum + Number(c.amount), 0),
        pageViews: views.count || 0,
        ctaClicks: clicks.count || 0,
        formSubmits: forms.count || 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Banks", value: stats.banks, icon: Building2, color: "text-info" },
    { title: "Loan Products", value: stats.products, icon: CreditCard, color: "text-primary" },
    { title: "Total Leads", value: stats.leads, icon: Users, color: "text-accent" },
    { title: "New Leads", value: stats.leadsNew, icon: TrendingUp, color: "text-warning" },
    { title: "Funded Deals", value: stats.leadsFunded, icon: DollarSign, color: "text-success" },
    { title: "Commission (AMD)", value: stats.totalCommission.toLocaleString(), icon: DollarSign, color: "text-success" },
    { title: "Page Views", value: stats.pageViews, icon: Eye, color: "text-info" },
    { title: "CTA Clicks", value: stats.ctaClicks, icon: TrendingUp, color: "text-accent" },
    { title: "Form Submits", value: stats.formSubmits, icon: Users, color: "text-primary" },
  ];

  if (loading) return <div className="text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
