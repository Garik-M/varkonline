import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { I18nProvider } from "@/lib/i18n";
import ScrollToTop from "@/components/ScrollToTop";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StickyCTA from "@/components/StickyCTA";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import CallbackWidget from "@/components/CallbackWidget";
import Index from "./pages/Index";
import Eligibility from "./pages/Eligibility";
import Compare from "./pages/Compare";
import Calculator from "./pages/Calculator";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBanks from "./pages/admin/AdminBanks";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminCommissions from "./pages/admin/AdminCommissions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminBlog from "./pages/admin/AdminBlog";

const queryClient = new QueryClient();

/** Wraps a page with the standard public layout */
function PublicLayout({
  children,
  withExit = false,
}: {
  children: React.ReactNode;
  withExit?: boolean;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
      <StickyCTA />
      <CallbackWidget />
      {withExit && <ExitIntentPopup />}
    </div>
  );
}

/** Public routes — rendered under both bare paths and locale-prefixed paths */
function PublicRoutes() {
  return (
    <Routes>
      <Route
        index
        element={
          <PublicLayout withExit>
            <Index />
          </PublicLayout>
        }
      />
      <Route
        path="eligibility"
        element={
          <PublicLayout>
            <Eligibility />
          </PublicLayout>
        }
      />
      <Route
        path="compare"
        element={
          <PublicLayout>
            <Compare />
          </PublicLayout>
        }
      />
      <Route
        path="calculator"
        element={
          <PublicLayout>
            <Calculator />
          </PublicLayout>
        }
      />
      <Route
        path="blog"
        element={
          <PublicLayout>
            <Blog />
          </PublicLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppRoutes() {
  return (
    <I18nProvider>
      <ScrollToTop />
      <Routes>
        {/* Admin routes — not locale-prefixed */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="banks" element={<AdminBanks />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="commissions" element={<AdminCommissions />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="blog" element={<AdminBlog />} />
        </Route>

        {/* Locale-prefixed public routes */}
        <Route path="/en/*" element={<PublicRoutes />} />
        <Route path="/ru/*" element={<PublicRoutes />} />

        {/* Default (Armenian) public routes — no prefix */}
        <Route path="/*" element={<PublicRoutes />} />
      </Routes>
    </I18nProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
