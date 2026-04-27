import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  TrendingUp,
  Building2,
  ExternalLink,
  Clock,
  Percent,
  ChevronDown,
  ChevronUp,
  ArrowDownToLine,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScrapedLoan {
  id: string;
  bank_name: string;
  product_name: string;
  loan_category: string;
  loan_type: string | null;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  currency: string;
  term_min_months: number | null;
  term_max_months: number | null;
  min_down_payment_percent: number | null;
  max_loan_amount: number | null;
  requires_collateral: boolean;
  description: string | null;
  source_url: string;
  last_updated: string;
}

interface RateHistory {
  id: string;
  bank_name: string;
  product_name: string;
  currency: string;
  interest_rate_min: number | null;
  interest_rate_max: number | null;
  recorded_at: string;
}

const CATEGORIES = [
  "all",
  "mortgage",
  "consumer",
  "car",
  "business",
  "refinance",
  "other",
];

const categoryColor: Record<string, string> = {
  mortgage: "bg-blue-500/10 text-blue-600",
  consumer: "bg-green-500/10 text-green-600",
  car: "bg-orange-500/10 text-orange-600",
  business: "bg-purple-500/10 text-purple-600",
  refinance: "bg-yellow-500/10 text-yellow-600",
  other: "bg-muted text-muted-foreground",
};

function fmt(n: number | null) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}

export default function AdminScrapedLoans() {
  const [loans, setLoans] = useState<ScrapedLoan[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [bankFilter, setBankFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedBank, setExpandedBank] = useState<string | null>(null);
  const [historyProduct, setHistoryProduct] = useState<ScrapedLoan | null>(
    null,
  );
  const [history, setHistory] = useState<RateHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { toast } = useToast();

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (bankFilter !== "all") filters.bank = bankFilter;
      if (categoryFilter !== "all") filters.category = categoryFilter;
      const res = await api.getScrapedLoans(filters);
      const items: ScrapedLoan[] = res?.data ?? res ?? [];
      setLoans(items);
    } catch (err) {
      toast({ title: "Failed to load scraped loans", variant: "destructive" });
    }
    setLoading(false);
  }, [bankFilter, categoryFilter]);

  const fetchBanks = async () => {
    try {
      const data = await api.getScrapedBanks();
      setBanks(Array.isArray(data) ? data : []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.syncScrapedToProducts();
      toast({
        title: `Sync complete — ${res.banks} banks, ${res.products} products synced`,
      });
    } catch (err: any) {
      toast({
        title: "Sync failed",
        description: err.message,
        variant: "destructive",
      });
    }
    setSyncing(false);
  };

  const handleScrape = async (bank?: string) => {
    setScraping(true);
    try {
      await api.triggerScrape(bank);
      toast({
        title: bank ? `Scraping ${bank}...` : "Full scrape started",
        description: "Results will appear in a few minutes.",
      });
      // Refresh after a short delay
      setTimeout(() => {
        fetchLoans();
        fetchBanks();
        setScraping(false);
      }, 5000);
    } catch (err: any) {
      toast({
        title: "Scrape failed",
        description: err.message,
        variant: "destructive",
      });
      setScraping(false);
    }
  };

  const openHistory = async (loan: ScrapedLoan) => {
    setHistoryProduct(loan);
    setHistoryLoading(true);
    try {
      const data = await api.getRateHistory(loan.bank_name, loan.product_name);
      setHistory(Array.isArray(data) ? data : []);
    } catch (_) {
      setHistory([]);
    }
    setHistoryLoading(false);
  };

  // Group loans by bank
  const grouped = loans.reduce<Record<string, ScrapedLoan[]>>((acc, loan) => {
    if (!acc[loan.bank_name]) acc[loan.bank_name] = [];
    acc[loan.bank_name].push(loan);
    return acc;
  }, {});

  const totalBanks = Object.keys(grouped).length;
  const totalLoans = loans.length;
  const withRates = loans.filter(
    (l) =>
      l.interest_rate_min !== null &&
      parseFloat(String(l.interest_rate_min)) > 0,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Scraped Loans</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalBanks} banks · {totalLoans} products · {withRates} with rates
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLoans()}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            <ArrowDownToLine
              className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync to Banks & Products"}
          </Button>
          <Button size="sm" onClick={() => handleScrape()} disabled={scraping}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${scraping ? "animate-spin" : ""}`}
            />
            {scraping ? "Scraping..." : "Run Full Scrape"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Banks", value: totalBanks, icon: Building2 },
          { label: "Total Products", value: totalLoans, icon: TrendingUp },
          { label: "With Rates", value: withRates, icon: Percent },
          {
            label: "Last Updated",
            value: loans[0]
              ? new Date(loans[0].last_updated).toLocaleDateString()
              : "—",
            icon: Clock,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={bankFilter} onValueChange={setBankFilter}>
          <SelectTrigger className="w-48">
            <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All banks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All banks</SelectItem>
            {banks.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "all"
                  ? "All categories"
                  : c.charAt(0).toUpperCase() + c.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grouped by bank */}
      {loading ? (
        <div className="text-muted-foreground text-center py-12">
          Loading...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-medium mb-1">No scraped loans found</p>
          <p className="text-sm">
            Run the scraper first:{" "}
            <code className="bg-muted px-1 rounded">npm run scrape</code>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([bankName, bankLoans]) => {
            const isExpanded = expandedBank === bankName;
            const avgRate = bankLoans
              .filter((l) => l.interest_rate_min !== null)
              .map((l) => parseFloat(String(l.interest_rate_min)))
              .filter((r) => r > 0);
            const minRate = avgRate.length ? Math.min(...avgRate) : null;

            return (
              <Card key={bankName} className="overflow-hidden">
                {/* Bank header row */}
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedBank(isExpanded ? null : bankName)}
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{bankName}</p>
                        <p className="text-xs text-muted-foreground">
                          {bankLoans.length} products
                          {minRate ? ` · from ${minRate}%` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScrape(bankName);
                        }}
                        disabled={scraping}
                        className="text-xs h-7"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Re-scrape
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </button>

                {/* Expanded loan list */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {bankLoans.map((loan) => {
                      const rateMin =
                        loan.interest_rate_min !== null
                          ? parseFloat(String(loan.interest_rate_min))
                          : null;
                      const rateMax =
                        loan.interest_rate_max !== null
                          ? parseFloat(String(loan.interest_rate_max))
                          : null;
                      return (
                        <div
                          key={loan.id}
                          className="px-4 py-3 flex items-start justify-between gap-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-medium text-sm truncate">
                                {loan.product_name}
                              </span>
                              <Badge
                                className={`text-[10px] px-1.5 py-0 ${categoryColor[loan.loan_category] || categoryColor.other}`}
                              >
                                {loan.loan_category}
                              </Badge>
                              {loan.requires_collateral && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  collateral
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              {rateMin !== null && rateMin > 0 && (
                                <span className="font-semibold text-foreground">
                                  {rateMin === rateMax
                                    ? `${rateMin}%`
                                    : `${rateMin}–${rateMax}%`}
                                </span>
                              )}
                              {loan.max_loan_amount && (
                                <span>
                                  up to {fmt(loan.max_loan_amount)}{" "}
                                  {loan.currency}
                                </span>
                              )}
                              {loan.term_max_months && (
                                <span>up to {loan.term_max_months} months</span>
                              )}
                              {loan.min_down_payment_percent && (
                                <span>
                                  {loan.min_down_payment_percent}% down
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Updated{" "}
                              {new Date(loan.last_updated).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Rate history"
                              onClick={() => openHistory(loan)}
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </Button>
                            <a
                              href={loan.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Source"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Rate history dialog */}
      <Dialog
        open={!!historyProduct}
        onOpenChange={() => setHistoryProduct(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Rate History</DialogTitle>
          </DialogHeader>
          {historyProduct && (
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm">
                  {historyProduct.product_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {historyProduct.bank_name}
                </p>
              </div>
              {historyLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No rate changes recorded yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2"
                    >
                      <span className="font-medium">
                        {h.interest_rate_min !== null
                          ? parseFloat(String(h.interest_rate_min)).toFixed(2)
                          : "—"}
                        {h.interest_rate_max !== null &&
                        h.interest_rate_max !== h.interest_rate_min
                          ? `–${parseFloat(String(h.interest_rate_max)).toFixed(2)}`
                          : ""}
                        %
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(h.recorded_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
