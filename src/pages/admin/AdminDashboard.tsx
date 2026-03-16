import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  CreditCard,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
} from "lucide-react";

interface Stats {
  banks: number;
  products: number;
  leads: number;
  commissions: number;
  views: number;
  clicks: number;
  forms: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    banks: 0,
    products: 0,
    leads: 0,
    commissions: 0,
    views: 0,
    clicks: 0,
    forms: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Banks",
      value: stats.banks,
      icon: Building2,
      color: "text-info",
    },
    {
      title: "Loan Products",
      value: stats.products,
      icon: CreditCard,
      color: "text-primary",
    },
    {
      title: "Total Leads",
      value: stats.leads,
      icon: Users,
      color: "text-accent",
    },
    {
      title: "Commission (AMD)",
      value: stats.commissions.toLocaleString(),
      icon: DollarSign,
      color: "text-success",
    },
    { title: "Page Views", value: stats.views, icon: Eye, color: "text-info" },
    {
      title: "CTA Clicks",
      value: stats.clicks,
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      title: "Form Submits",
      value: stats.forms,
      icon: Users,
      color: "text-primary",
    },
  ];

  if (loading)
    return <div className="text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
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
