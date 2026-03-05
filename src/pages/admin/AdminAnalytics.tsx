import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EventGroup {
  event_type: string;
  element: string | null;
  page: string | null;
  count: number;
}

interface EventRow {
  id: string;
  event_type: string;
  page: string | null;
  element: string | null;
  metadata: any;
  session_id: string | null;
  created_at: string;
}

export default function AdminAnalytics() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [days, setDays] = useState("7");
  const sb = supabase as any;

  const fetchEvents = async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    let query = sb.from("analytics_events")
      .select("*")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    if (filter !== "all") query = query.eq("event_type", filter);
    const { data } = await query;
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [filter, days]);

  // Group by event_type + element
  const grouped: EventGroup[] = [];
  const map = new Map<string, EventGroup>();
  events.forEach((e) => {
    const key = `${e.event_type}::${e.element || ""}::${e.page || ""}`;
    if (map.has(key)) {
      map.get(key)!.count++;
    } else {
      const g = { event_type: e.event_type, element: e.element, page: e.page, count: 1 };
      map.set(key, g);
      grouped.push(g);
    }
  });
  grouped.sort((a, b) => b.count - a.count);

  const uniqueSessions = new Set(events.map((e) => e.session_id).filter(Boolean)).size;
  const eventTypes = [...new Set(events.map((e) => e.event_type))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <div className="flex gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="page_view">Page views</SelectItem>
              <SelectItem value="cta_click">CTA clicks</SelectItem>
              <SelectItem value="click">Clicks</SelectItem>
              <SelectItem value="form_submit">Form submits</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Events</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{events.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unique Sessions</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{uniqueSessions}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Event Types</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{eventTypes.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Top Trigger</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-bold truncate">{grouped[0]?.element || "—"}</div></CardContent>
        </Card>
      </div>

      {/* Grouped table */}
      <Card>
        <CardHeader><CardTitle>Events by Trigger</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Element/Trigger</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((g, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {g.event_type}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{g.element || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{g.page || "—"}</TableCell>
                    <TableCell className="text-right font-bold">{g.count}</TableCell>
                  </TableRow>
                ))}
                {grouped.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No events recorded yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent events */}
      <Card>
        <CardHeader><CardTitle>Recent Events</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Element</TableHead>
                <TableHead>Page</TableHead>
                <TableHead>Session</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.slice(0, 50).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{e.event_type}</span>
                  </TableCell>
                  <TableCell className="font-medium">{e.element || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{e.page || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.session_id?.slice(0, 10) || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
