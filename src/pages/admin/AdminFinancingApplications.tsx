import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface FinancingApplication {
  id: string;
  organization_name: string;
  website: string;
  contact_name: string;
  email: string;
  phone: string;
  status: "pending" | "accepted";
  acknowledgement_version: string;
  acknowledgement_language: string;
  acknowledged_at: string;
  created_at: string;
  accepted_at: string | null;
  claimed_at: string | null;
  invitation_expires_at: string | null;
  partner_slug: string | null;
}

export default function AdminFinancingApplications() {
  const [applications, setApplications] = useState<FinancingApplication[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Record<string, { url: string; expiresAt: string | null }>>({});
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result: { applications: FinancingApplication[]; hasMore: boolean } = await api.request(`/financing-applications?page=${page}`);
      setApplications(result.applications);
      setHasMore(result.hasMore);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load applications.");
    } finally { setLoading(false); }
  }, [page]);
  useEffect(() => { void load(); }, [load]);

  async function act(id: string, action: "accept" | "delete" | "invitation") {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await api.request(`/financing-applications/${id}${action === "accept" ? "/accept" : action === "invitation" ? "/invitation" : ""}`, {
        method: action === "accept" ? "PATCH" : action === "invitation" ? "POST" : "DELETE",
        ...(action !== "delete" ? { body: "{}" } : {}),
      });
      if (result.invitation) setInvitations(previous => ({ ...previous, [id]: result.invitation }));
      else if (action === "delete") setInvitations(previous => { const next = { ...previous }; delete next[id]; return next; });
      setDeleting(null);
      setMessage(action === "accept" ? "Application accepted. Share the private invitation below with the approved contact." : action === "invitation" ? "New invitation created. Previous unused invitation links are invalid." : "Application deleted.");
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update application.");
    } finally { setBusy(false); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Financing partner applications</h1>
        <p className="text-muted-foreground">Review companies applying through Varkonline Financing Partners. Leave an application pending, accept it, or delete it.</p>
        <p className="text-sm">Accept to create a private, single-use invitation. Share it with the approved contact. They can activate their account, configure their calculator and get their SDK code.</p>
        <p className="text-sm text-muted-foreground">Invitation delivery is manual. Confirm the contact and website before approving; no email is sent automatically.</p>
        <a href="/financing-partners" target="_blank" rel="noreferrer" className="text-primary underline text-sm">Open public application page</a>
      </header>
      <Button variant="outline" disabled={loading || busy} onClick={() => void load()}>Reload applications</Button>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {message && <p role="status">{message}</p>}
      {loading ? <p role="status">Loading applications…</p> : !error && applications.length === 0 ? <p>No applications on this page.</p> : null}
      {!loading && !error && applications.map(application => (
        <article key={application.id} className="rounded-xl border bg-card p-5 space-y-4 break-words">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-lg">{application.organization_name}</h2>
            <span className="rounded-full bg-muted px-3 py-1 text-sm">{application.status === "pending" ? "Pending review" : "Accepted"}</span>
          </div>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Contact person</dt><dd>{application.contact_name}</dd></div>
            <div><dt className="text-muted-foreground">Website</dt><dd><a className="underline" href={application.website} target="_blank" rel="noreferrer">{application.website}</a></dd></div>
            <div><dt className="text-muted-foreground">Email</dt><dd>{application.email}</dd></div>
            <div><dt className="text-muted-foreground">Phone</dt><dd>{application.phone}</dd></div>
            <div><dt className="text-muted-foreground">Submitted</dt><dd>{new Date(application.created_at).toLocaleString()}</dd></div>
            <div><dt className="text-muted-foreground">Acknowledgement</dt><dd>{application.acknowledgement_version} ({application.acknowledgement_language}), {new Date(application.acknowledged_at).toLocaleString()}</dd></div>
            {application.accepted_at && <div><dt className="text-muted-foreground">Accepted</dt><dd>{new Date(application.accepted_at).toLocaleString()}</dd></div>}
            {application.claimed_at && <div><dt className="text-muted-foreground">Partner account activated</dt><dd>{new Date(application.claimed_at).toLocaleString()}</dd></div>}
            {application.partner_slug && <div><dt className="text-muted-foreground">Integration ID</dt><dd>{application.partner_slug}</dd></div>}
          </dl>
          {invitations[application.id] && <div className="rounded-lg border p-4 space-y-3">
            <label className="block text-sm font-medium">Private invitation link<input readOnly className="block w-full border rounded p-2 mt-2 text-xs bg-background" value={invitations[application.id].url} onFocus={event => event.currentTarget.select()} /></label>
            <p className="text-xs text-muted-foreground">Share only with {application.email}. This single-use link does not expire. Issuing a new invitation replaces it. This secret is shown only for this session; create a new invitation if lost.</p>
            <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(invitations[application.id].url); setMessage("Invitation copied. Share it privately with the approved contact."); } catch { setMessage("Select and copy the invitation link manually."); } }}>Copy invitation link</Button>
          </div>}
          <div className="flex flex-wrap gap-3 items-center">
            {application.partner_slug && <Button asChild variant="outline"><Link to={`/admin/financing/${encodeURIComponent(application.partner_slug)}`}>Review saved integration</Link></Button>}
            {application.status === "pending" && <Button disabled={busy} onClick={() => void act(application.id, "accept")}>Accept application</Button>}
            {application.status === "accepted" && <Button disabled={busy} variant="outline" onClick={() => void act(application.id, "invitation")}>Create new invitation</Button>}
            {deleting === application.id ? <>
              <span className="text-sm">Delete this application? Partner access will be revoked and its integration paused.</span>
              <Button variant="destructive" disabled={busy} onClick={() => void act(application.id, "delete")}>Confirm deletion</Button>
              <Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button>
            </> : <Button variant="outline" disabled={busy} onClick={() => setDeleting(application.id)}>Delete application</Button>}
          </div>
        </article>
      ))}
      <nav aria-label="Application pages" className="flex items-center gap-3">
        <Button variant="outline" disabled={page === 1 || busy || loading} onClick={() => { setDeleting(null); setPage(value => value - 1); }}>Previous page</Button>
        <span>Page {page}</span>
        <Button variant="outline" disabled={!hasMore || busy || loading || !!error} onClick={() => { setDeleting(null); setPage(value => value + 1); }}>Next page</Button>
      </nav>
    </div>
  );
}
