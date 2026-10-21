# Financing partner analytics

## What is measured

- **Calculator sessions**: distinct random, in-memory iframe sessions with a successful `calculation_completed` event. One session survives apartment changes in the same iframe. Reloads, new tabs, and separate widgets start new sessions; these are not identified or deduplicated people.
- **Estimates**: the initial valid calculation and changes settled for 800 ms. Invalid inputs and typing bursts are not counted. Returning to an earlier scenario after a different completed estimate counts again. Changing salary alone is a refund interaction, not another base loan estimate.
- **Today / last 7 / last 30 days**: independently computed calendar-day windows in `Asia/Yerevan`, including today. The chart filter supports 1/7/30/90 days. Daily session counts cannot be summed to obtain multi-day unique sessions.
- **Refund interest**: sessions with a successful refund interaction divided by all recorded sessions in the selected period. It is not a lead, eligibility decision, or bank approval.
- **Excel downloads**: successful workbook generation and initiation of the browser download, not confirmation that the file was saved or opened.
- **Price ranges**: the server-resolved apartment price is assigned to `[floor(price / 5,000,000) × 5,000,000, next boundary)`. Thus 25,000,000 AMD belongs to 25–30m, and 35,000,000 belongs to 35–40m. Repeat estimates count separately; session counts are also available for each band. The chart shows the top eight bands, with exact counts for up to the top 50 and an explicit remainder count. USD is never converted or mixed into AMD ranges.

New detailed metrics start when this version is installed. Existing events are preserved; missing historical prices are never inferred from current apartment settings. Calendar charts include zero-activity dates. No sample traffic is included in production reports.

## Privacy and isolation

The widget sends only allowlisted event names, optional field names, language, random event/session IDs, and session sequence. The backend derives apartment/currency/coarse price-band context from the signed resolve token. It stores neither salary amounts nor exact entered prices, down payments, rates, terms, full host URLs, IP addresses, or user-agent strings in financing analytics. No cookies or persistent visitor identities are introduced. DNT/GPC, disabled analytics, and draft/live previews suppress tracking. Ad blockers and privacy preferences can reduce coverage.

Queued actions retain their original signing context across apartment switches. Retries reuse event IDs and are idempotent. Public ingestion is token-scoped, rate-limited, size-bounded, and validated with strict allowlists. It measures widget activity, not arbitrary clicks on a partner's website, and does not provide bot-proof verified-person counts.

Partner reports derive the integration slug from the authenticated user's accepted company membership. A client-supplied slug cannot select another company. Reports and timelines are scoped in SQL and are not publicly cached. Partner session tokens cannot authorize admin APIs. General admin analytics reads/deletions require a current admin role; public site event collection remains available. The standalone partner entry does not load the admin layout, admin reports, leads, or commissions.

Retention is 90 days. Reports exclude expired rows immediately, and ingestion purges expired events in bounded batches. Totals and all charts use one fixed server cutoff per report. Top apartments are bounded to 20 and session lists to 50; timelines to 500 actions.

## Deployment

Apply `backend/migrations/20261021_financing_analytics.sql` **before** deploying the new backend, then deploy the frontend. The migration is additive and idempotent; it adds nullable currency/price-band columns and extends the event allowlist. Old clients/tokens remain accepted until their normal expiry but do not gain invented price context. No automatic production migration is run by this feature.

## Local review

The isolated verification command is `FINANCING_TEST_FOCUS=workspace bash scripts/test-financing-local.sh` from the backend directory. It applies all migrations twice, runs unit/type/lint/build checks, tests real API/database tenant boundaries and calendar/bucket arithmetic, and exercises the actual partner dashboard in a browser.

For a populated **local-only** demonstration, run `scripts/ensure-financing-demo.ts --create` followed by `scripts/seed-financing-analytics-demo.ts` against an explicit localhost disposable `varkonline_*_test` database. The fixture refuses remote databases and `DATABASE_URL`, labels its company “Demo · Analytics (sample data),” and supplies a public local test account. Its traffic must never be used to represent customer adoption.
