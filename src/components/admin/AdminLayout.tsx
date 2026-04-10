import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  DollarSign,
  LogOut,
  Loader2,
  BarChart3,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/banks", label: "Institutions", icon: Building2 },
  { path: "/admin/products", label: "Loan Products", icon: CreditCard },
  { path: "/admin/leads", label: "Leads", icon: Users },
  { path: "/admin/commissions", label: "Commissions", icon: DollarSign },
  { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/admin/blog", label: "Blog", icon: FileText },
];

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <img src="/logo.png" alt="VarkOnline.am" className="h-6 w-auto" />
          </div>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <h1 className="text-lg font-bold">VarkOnline Admin</h1>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </header>
        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto border-b border-border bg-card px-2 gap-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground",
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
