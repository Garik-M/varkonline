import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FinancingPartner } from "@/embed/types";

export default function FinancingPartnerList({
  partners,
  loading,
  error,
  reload,
}: {
  partners: FinancingPartner[];
  loading: boolean;
  error: string;
  reload: () => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const query = search.trim().toLowerCase();
  const visible = partners.filter(
    (partner) =>
      (status === "all" || partner.active === (status === "active")) &&
      [partner.displayName, partner.slug, ...partner.allowedOrigins].some(
        (value) => value.toLowerCase().includes(query),
      ),
  );
  const pages = Math.max(1, Math.ceil(visible.length / 25));
  const currentPage = Math.min(page, pages);
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold">Financing integrations</h1>
        <p className="text-muted-foreground">
          Review every saved partner calculator, its website access and
          refund visibility. Partners configure their own calculator in
          their workspace.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/admin/financing-applications">
              Review applications & invitations
            </Link>
          </Button>
          <Button variant="outline" disabled={loading} onClick={reload}>
            Reload partner list
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/admin/financing/setup/new">
              Create integration manually
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          An accepted company appears here after its first calculator setup.
          Companies waiting for activation or setup remain in Applications.
        </p>
      </header>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Loading partners…</p>
      ) : (
        !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ["Saved integrations", partners.length],
                ["Active", partners.filter((partner) => partner.active).length],
                [
                  "Paused",
                  partners.filter((partner) => !partner.active).length,
                ],
              ].map(([name, count]) => (
                <div className="rounded-xl border bg-card p-4" key={name}>
                  <p className="text-sm text-muted-foreground">{name}</p>
                  <p className="text-2xl font-semibold">{count}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Input
                className="sm:max-w-md"
                aria-label="Search financing partners"
                placeholder="Search company, website or integration ID"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
              <select
                className="border rounded-lg p-2 bg-background"
                aria-label="Integration status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <p className="text-sm text-muted-foreground" role="status">
              {visible.length} of {partners.length} integrations
            </p>
            {!partners.length ? (
              <section className="rounded-xl border bg-card p-6 space-y-2">
                <h2 className="font-semibold">No calculators configured yet</h2>
                <p>
                  Accept a company in Applications and share its invitation.
                  After the partner saves their calculator, you can review it
                  here.
                </p>
              </section>
            ) : !visible.length ? (
              <p>No integrations match your search or status filter.</p>
            ) : (
              <div className="space-y-3">
                {visible
                  .slice((currentPage - 1) * 25, currentPage * 25)
                  .map((partner) => (
                    <article
                      className="rounded-xl border bg-card p-5 space-y-4"
                      key={partner.slug}
                    >
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold break-words">
                            {partner.displayName}
                          </h2>
                          <p className="text-sm text-muted-foreground break-all">
                            {partner.allowedOrigins.join(", ")}
                          </p>
                        </div>
                        <span className="rounded-full bg-muted px-3 py-1 text-sm">
                          {partner.active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Calculator</dt>
                          <dd>
                            {partner.configuration.defaults.financingType ===
                            "mortgage"
                              ? "Mortgage"
                              : "Interest-free installments"}{" "}
                            · {partner.configuration.defaults.currency}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            Partner terms
                          </dt>
                          <dd>
                            {partner.configuration.defaults.downPaymentPercent}%
                            down ·{" "}
                            {partner.configuration.defaults.durationMonths}{" "}
                            months
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            Refund tools
                          </dt>
                          <dd>
                            {partner.configuration.refund.enabled
                              ? "Visible"
                              : "Hidden"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Updated</dt>
                          <dd>
                            {new Date(partner.updatedAt).toLocaleString()}
                          </dd>
                        </div>
                      </dl>
                      <Button
                        asChild
                        variant="outline"
                        className="max-w-full whitespace-normal break-words h-auto min-h-10 text-left"
                      >
                        <Link
                          to={`/admin/financing/${encodeURIComponent(partner.slug)}`}
                        >
                          Review {partner.displayName}
                        </Link>
                      </Button>
                    </article>
                  ))}
              </div>
            )}
            {pages > 1 && (
              <nav
                aria-label="Integration list pages"
                className="flex items-center gap-3"
              >
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous integrations
                </Button>
                <span>
                  Page {currentPage} of {pages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next integrations
                </Button>
              </nav>
            )}
          </>
        )
      )}
    </div>
  );
}
