# Financing platform implementation report

Implemented in the existing React/Vite frontend and Express/PostgreSQL backend. Phase 1 and Phase 2 remain the financial authorities; their calculation APIs and formulas were not rewritten. The initial implementation was verified locally before the approved partner-workspace release.

The frontend serves the small versioned `/sdk/v1.js` bundle and a separate built `embed.html` entry. Express serves `/embed/:partner`, applying a partner-specific HTTP ancestor policy and safe bootstrap values, then loads the calculator assets from the configured frontend origin. This uses the existing frontend/backend deployments and requires no new subdomain or service.

The iframe has its own Armenian UI, React root and CSS. It does not import the site's auth, analytics, main application or browser storage helpers. It displays apartment price, down payment, principal, nominal rate, term, monthly payment, interest, complete totals, and a full schedule paginated by twelve rows. Whole AMD and whole USD use the existing half-up engine rounding and final-payment reconciliation. Visitor controls obey the partner's approved bounds, steps and supported terms.

The refund flow preflights property eligibility before collecting personal eligibility details. Known exclusions skip the salary form; unresolved property evidence permits a separate income-tax estimate without inventing refunds. Eligible property inputs unlock the real Phase 2 projection, optional actual withheld tax and one optional co-borrower. It separates the bank payment, quarterly refund and average effective cost. Salary stays in iframe memory and is never sent in API requests, stored, logged or included in host events. Personal documentary self-checks are user assertions; property evidence can only be marked reviewed through authenticated administration. Nothing substitutes for SRC approval.

The SDK auto-mounts multiple widgets, observes apartment attribute changes and inserted/removed nodes, supports SPA cleanup, repeated loading and an optional mount/update/destroy API. Message handling checks exact origins, source window, random instance and protocol version. Malformed messages do not coerce arbitrary objects. Per-widget state/timers and message listeners are removed on cleanup; the shared observer remains for future widgets until `disconnect()`. Only identifiers/status codes appear in public events. The production SDK is approximately **8.02 kB / 3.55 kB gzip**; React and financial modules load inside the iframe.

Administrators use `/admin/financing` with existing JWT/role permissions. They can create stable partner IDs, edit/deactivate records, set exact website origins, defaults, allowed overrides, term/range constraints, light/dark branding, and reviewed development/property facts. A mortgage default rate may be omitted only when explicit apartment rates are permitted; an unresolved rate is an error. The live preview uses the real SDK and backend, and the generated snippet uses the actual frontend hostname. Optimistic revisions prevent overwriting another administrator's edits. Existing partner-application administration remains intact.

| Area | Created or changed files |
| --- | --- |
| Hosted UI and lifecycle | `src/embed/main.tsx`, `FinancingCalculator.tsx`, `RefundPanel.tsx`, `refund-model.ts`, `refund-messages.ts`, `format.ts`, `embed.css`, `types.ts`, `embed.html` |
| SDK and integration | `src/embed/sdk.ts`, `sdk-core.ts`, `protocol.ts`, `snippet.ts`, `PartnerPreview.tsx`, `scripts/build-sdk.mjs`, `public/examples/apartments.html` |
| Existing admin integration | `src/pages/admin/AdminFinancing.tsx`, `src/App.tsx`, `src/components/admin/AdminLayout.tsx` |
| Backend boundary/storage/security | `../backend/src/embed/config.ts`, `repository.ts`, `security.ts`, `routes.ts`, existing `src/index.ts` |
| Additive storage | `../backend/migrations/20261017_financing_partners.sql` |
| Hosting/build | frontend/backend `vercel.json`, frontend `vite.config.ts`, package scripts, generated SDK ignore rule |
| Verification | `src/embed/__tests__`, `tsconfig.embed.json`, backend `tests/financing-*`, `scripts/test-financing-local.sh` |
| Developer documentation | `public/docs/financing-integration.md`; Phase 2 README now links the implemented consumer |

API changes:

- `POST /api/embed/:slug/resolve`: strictly validates non-sensitive apartment data and returns canonical permitted financing inputs, controls, branding, partner revision and scoped legal evidence. It accepts no payroll fields.
- `GET /embed/:slug`: isolated HTML with CSP, nonce, exact ancestor origins, no-store and restricted capabilities.
- Protected `GET/POST /api/financing-partners`, `PUT /api/financing-partners/:slug`: partner management with immutable IDs and optimistic revision checks. Protected documentary responses are explicitly no-store.
- The migration adds only `financing_partners`: slug, display name, activation, JSONB origins/configuration, revision, last editor and timestamps. It never synchronizes apartment inventory, alters existing tables, or runs automatically at startup.

Public configuration and iframe endpoints have bounded per-process IP rate limits. Public integrations have no secret API key. Origin allowlisting is a browser control, not cryptographic API authentication; actual ancestors are separately checked by CSP. Frontend static asset CORS headers support cross-origin module loading. Financial estimate assumptions and lack of official approval are visible in the calculator.

A production integration, after configuring and deploying an actual active `defanse` record, is:

```html
<div class="varkonline-widget"
  data-partner="defanse"
  data-apartment-id="A-101"
  data-price-amd="35000000"
  data-annual-interest-rate="9"
  data-down-payment-percent="20"
  data-duration-months="240"
  data-financing-type="mortgage"></div>
<script async src="https://www.varkonline.am/sdk/v1.js"></script>
```

The ID and financial values above are examples. Add the script once and bind the div's values to each apartment in the shared website/CMS template. The integration guide documents all attributes, precedence, WordPress, Webflow, React/Next.js, SPA behavior, programmatic calls, events, evidence examples and troubleshooting.

Limitations and release requirements:

- The UI projects constant monthly income/answers, complete calendar quarters and no interest subsidy. Variable payroll, subsidized/irregular contracts and richer paid-interest reconciliation need individual handling. The underlying Phase 2 API retains its broader capabilities.
- USD bank payments work, but the basic UI does not collect bank-certified AMD amounts for every USD schedule row. Refund quantities remain unresolved; no FX rate is invented.
- Reviewed metadata requires human documentary checks. A reference-string guard is not document authentication. No real Defanse evidence or financial conditions were assumed or seeded in production.
- Active widgets refresh while visible every sixty seconds; deactivation is enforced on that refresh rather than instant remote revocation. Template caching is thirty seconds. Preserve prior hashed assets through rollout where supported.
- IP limits are per backend process. Configure the exact trusted proxy count and use deployment perimeter controls for global quotas. Modern Chromium desktop/mobile viewports were tested; real iOS/Safari/Firefox certification is not claimed.
- Full-app lint/type baseline failures remain separate from this feature. No unrelated code was changed to conceal them.

Before production: review the legal snapshot and actual partner terms/evidence; apply the additive migration through the normal reviewed database release; deploy frontend/backend through the existing pipelines; set the absolute `VITE_API_URL`, canonical `EMBED_FRONTEND_ORIGIN`, backend `EMBED_PUBLIC_ORIGIN` and reviewed `TRUST_PROXY_HOPS`; retain asset CORS/CSP settings; create the real partner with exact origins, approve bounds/branding, activate and test on its actual shared apartment template. The workspace's frontend/backend are separate Git checkouts, so release their changes through the existing repository workflow. No commit, push or deployment is performed by the local test command.

Run the complete disposable verification from the repository root:

```sh
bash backend/scripts/test-financing-local.sh
```

It initializes an isolated local PostgreSQL cluster, applies the baseline and additive migration (twice to check idempotency), builds both applications, runs unit/API/Chromium scenarios and tears down its own services and database. Browser reports/screenshots are in ignored `backend/artifacts/`.

Local verification on 17 October 2026 completed successfully:

| Check | Result |
| --- | --- |
| Frontend Vitest | **359 passed**: 161 Phase 1, 172 Phase 2, 25 SDK/presentation tests and the existing app test |
| Backend native unit tests | **7 passed** |
| Real API/PostgreSQL checks | **30 passed**, including JWT permissions, real CRUD, revisions, bounds, scoped evidence, private-response caching and active/unknown/domain states |
| Real Chromium integration | **56 passed**, Chromium 147.0.7727.15; desktop/mobile layouts, three distinct apartments, control/attribute changes, schedules, refunds, SPA insertion/removal, duplicate SDK, source/instance/CSP checks, failed/slow requests, live refresh/deactivation, admin creation/editing/copy and dark preview |
| Strict TypeScript | Financial engine and new embed/admin modules passed; backend production TypeScript build passed |
| Feature lint | New modules, their tests and financial engines passed without errors or warnings |
| Production builds | Frontend and backend passed; SDK 8.02 kB / 3.55 kB gzip |
| Full-app baseline | Existing **30 lint errors / 18 warnings** and the existing DOMPurify configuration mismatch at `src/lib/sanitize.ts:22` remain separately reported |
| Local cleanup | Disposable application services and PostgreSQL stopped; no production migration/deployment occurred |

The three sample apartments were also recalculated independently with Python Decimal (70-digit precision, half-up whole-AMD interest and final-payment reconciliation):

| Apartment | Price AMD | Nominal rate | Down payment | Months | Monthly AMD | Total interest AMD | Total with down payment AMD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 35,000,000 | 9% | 20% | 240 | 251,923 | 32,461,718 | 67,461,718 |
| B | 42,000,000 | 11.5% | 30% | 180 | 343,448 | 32,420,544 | 74,420,544 |
| C | 58,000,000 | 8.5% | 25% | 300 | 350,274 | 61,581,982 | 119,581,982 |

Every final balance was zero. The separate short refund fixture independently reconciles 421,046 AMD of quarterly interest, 300,000 AMD salary tax and a 750,000 AMD cap to a 300,000 AMD refund; the bank payment remains 9,473,682 AMD while its informational monthly equivalent after refund is 9,373,682 AMD. Synthetic fixtures are not real partner terms or evidence.

## Financing partner onboarding and workspace (18 October 2026)

The partner-facing entry is **Varkonline Financing Partners**, at `/financing-partners` (also `/en/financing-partners` and `/ru/financing-partners`). The footer and existing Become a partner chooser link to it. Applicants read the calculator description and contact-data acknowledgement, explicitly accept, then submit company, website, contact name, email and phone. Version `2026-10-18-v2`, language and server timestamp are recorded. This acknowledgement describes the application process; it is not a signed commercial agreement.

Staff review `/admin/financing-applications`. Leaving an application alone keeps it pending. Acceptance preserves the original reviewer/time and creates a single-use invitation valid for 72 hours. Staff copy and privately share that link with the approved contact. **Delivery is manual; no email provider or automatic notification is configured.** Staff can issue a new invitation, invalidating any older unused link. Confirm the contact identity and canonical company website before approving or issuing recovery invitations.

The approved contact follows the invitation, sets a password (at least 12 characters and at most 72 UTF-8 bytes), and enters `/partner`. An existing email account must authenticate with its current password; invitations cannot overwrite unrelated accounts or administrator passwords. A recovery invitation may reset the account originally created through that same application; existing linked accounts still use their existing credentials. Invitations are stored as SHA-256 digests, removed from the address bar immediately, expire in 72 hours and are consumed in a row-locked transaction. Concurrent claims cannot reuse the same token.

The partner workspace is an independent `partner.html` Vite entry, with Armenian, English and Russian UI. It loads no public advertising or analytics scripts. Those scripts are also excluded on direct staff and financing-application page entry; links into the application page perform a full navigation. Partners explicitly provide financing type, currency, nominal mortgage rate (where applicable), down payment, term and appearance. No financial rate, down payment, duration or apartment price is prefilled. Saving creates an active integration limited to the approved website's HTTPS origin and its www counterpart (loopback HTTP is accepted for local testing). The partner then provides a sample price, copies the SDK snippet, opens the real preview and follows the shared apartment-template documentation. Whole AMD and USD use the existing engine. No new financial formulas were added.

Owners can edit their own basic terms, appearance and refund-tool visibility. Staff limits, allowed models/currencies/overrides, website origins, reviewed tax-refund evidence and activation state are preserved. A partner cannot reactivate an integration paused by staff. Optimistic revisions reject stale edits. The private API projects only necessary settings; documentary references are not returned. Multiple approved companies can belong to one existing account without adding a new global user role.

Authentication reuses users, bcrypt and JWT. Partner sessions are eight-hour, audience-scoped tokens in Secure/HttpOnly/SameSite=Strict cookies, restricted to `/partner-api`. The frontend gateway proxies that same-origin path to `/api/partner` on the existing Railway backend. No token is returned to browser storage. State-changing requests require the exact canonical frontend Origin; APIs use no-store caching. Login/invitation attempts are bounded by account/token digest as well as a coarse IP limit. Authenticated workspace quotas use the account ID so gateway IP sharing does not conflate accounts. Password changes invalidate older partner sessions immediately. Admin permission checks now verify the current stored role, so deleting or demoting a staff account revokes approval privileges even before its old JWT expires.

Deleting an application revokes its invitations/account access and pauses its integration in one transaction. The underlying user record is retained because it can be shared with other approved companies or existing site functionality. Configuration history remains available to staff, inactive. Existing bank/institution partnership applications remain separate and unchanged.

### Storage and release

Apply the explicit additive migrations in order:

1. Backend `migrations/20261017_financing_partners.sql`.
2. Backend `migrations/20261018_financing_partner_applications.sql`.
3. Backend `migrations/20261018_financing_partner_access.sql`.

The explicit command `node --import tsx scripts/migrate-financing.ts` checks setup without changing it. `--apply` executes the reviewed migrations; a remote database additionally requires `--allow-remote`. The runner checks baseline tables, obtains an advisory lock and uses bounded statement/lock timeouts. Migrations do not run on server startup. The local runner applies each twice to check idempotency.

The original live failure was an absent `financing_partners` table in the configured Railway database. The admin now reports `FINANCING_SETUP_REQUIRED` for missing relations and explains why SDK code needs a saved configuration. Public errors omit database details. Logging includes safe PostgreSQL codes and routes, without request bodies or credentials.

Set `EMBED_FRONTEND_ORIGIN=https://www.varkonline.am`, which serves `embed.html` and `partner.html` without redirect. The code fallback now uses that canonical hostname. `EMBED_PUBLIC_ORIGIN` remains the existing Railway origin. Vercel rewrites `/partner` and its subpaths to the isolated partner entry, and `/partner-api/*` to the existing backend. Private HTML receives CSP, no-referrer, no-store and anti-framing headers. Static SDK and calculator hosting are unchanged.

Run `bash backend/scripts/test-financing-local.sh` for the complete disposable verification. `FINANCING_TEST_FOCUS=portal` skips only the longer existing widget-browser suite when iterating on account flow; it still runs financial/unit checks, both builds, all database/API checks and application/workspace browsers. Artifacts are ignored under `backend/artifacts`. The runner tears down its temporary PostgreSQL and services.

The explicitly authorized production smoke command is `node --import tsx scripts/verify-financing-production.ts --allow-production`. It verifies the real public application, staff approval, invitation, account claim, first-party Secure cookie, explicit setup, SDK copying, live preview, actual published SDK execution, refresh, sign-out/sign-in, domain enforcement and deletion/revocation. It uses separately named synthetic records and removes only those records, including temporary staff roles, afterward. No real partner terms, contacts or tax evidence are seeded.

### Refund preview visibility correction

New partner and staff integrations show refund tools by default. Existing integrations preserve their saved visibility; an explicit checkbox in both editors enables or disables the tools. This changes presentation only: property and development evidence remain staff-controlled and eligibility still passes through the existing Phase 2 engine. Partner and staff previews accept an exact sample apartment ID, also used in the generated snippet, so reviewed evidence can be matched instead of always requesting a dummy property. Missing evidence keeps refund and effective cost unresolved while permitting a separate salary-tax estimate.

The staff landing page now lists all saved integrations, including partner-created ones, with search, active/paused filtering, counts and 25-record display pages. Each opens a direct `/admin/financing/:slug` review URL with Overview, Calculator settings, Refund review, SDK & preview and Advanced settings. Manual creation is secondary and uses `/admin/financing/setup/new`; it does not reserve an otherwise valid partner ID. Accepted applications link to their saved integration once configured. Existing admin repository, authorization and optimistic revisions remain in use; no migration or new partner registry was added.

`components/admin/financing/RefundEvidenceEditor.tsx` replaces the staff JSON editor with typed development and property forms. Unknown, recorded and document-verified facts remain distinct. Editing a fact clears its verified flag; changing a record's identity clears nested verification and its reference. Human-readable preflight errors catch unfinished records and missing review references before submitting to the existing server validator. Salary and participant eligibility data are never collected by this form.

Local verification of this correction: 363 frontend and 16 backend unit tests, 85 real API checks, and 117 Chromium checks (70 widget/staff, 16 applications, 31 partner workspace) passed. Strict feature TypeScript checks, feature lint and both production builds passed. The reviewed partner fixture independently matches 300,000 AMD quarterly refund, 9,373,682 AMD effective monthly cost and an unchanged 9,473,682 AMD bank payment.

### Website www aliases

`backend/src/embed/security.ts` derives an effective origin list by pairing each approved DNS hostname with its single www counterpart, retaining scheme and port. The same list drives API origin checks, iframe `frame-ancestors` and the partner workspace’s approved-website display. Existing stored lists and optimistic revisions remain unchanged; no migration or resave is required. IP literals, loopback and unrelated subdomains retain exact matching. The actual parent origin is preserved for iframe messages; aliases never loosen authentication CORS or cookies. Host website CSP must still permit the script and iframe hosts.

Local www-alias verification passed: 363 frontend and 19 backend unit tests, 92 real API checks and 117 Chromium checks, plus strict feature TypeScript checks, lint and both production builds. New origin tests cover both directions, explicit duplicate entries, retained scheme/port, actual iframe ancestor headers/bootstrap, loopback/IP boundaries and rejection of other subdomains and lookalike domains.

### Borrower field review and Armenian wording

Reviewed the borrower inputs against the official [refund procedure, Decision 1321-N](https://www.arlis.am/hy/acts/200943) and [SRC June 2026 guidance](https://www.src.am/storage/File_Link_Uploade/tv_yndhanur_teghekutyun_rev0626_6a26b2c6dad5f.pdf). The widget is a forecast, not an SRC application; it does not collect ID numbers, bank-account numbers or document uploads. Employment, required document confirmation, prior benefit use, tuition overlap and tax settlement are eligibility/availability checks. They should not be confused with the arithmetic inputs or with Varkonline verification. Actual claim conditions are not established merely because a visitor is considering a purchase.

| Input | Purpose and source |
| --- | --- |
| Registered gross monthly salary in AMD | Visitor salary before taxes and deductions; other taxable income is not silently treated as eligible salary. |
| Actual salary income tax withheld | Optional override for the applicable payroll case; zero is an explicit override. |
| First monthly payment date | Calendar-quarter timing for the mortgage projection. |
| Actual origination/disbursement date | Bank/property review establishes the applicable legal period; a visitor-entered date remains unverified. |
| Optional co-borrower | Separate salary and personal eligibility; not automatically the spouse or every co-borrower on a contract. |
| Employment, ownership/document and prior-use answers | Personal eligibility assertions. Missing answers remain unresolved. |
| Tuition overlap, tax already allocated and employer settlement | Avoid unavailable or doubly counted salary tax; distinguish forecasts from paid amounts. |
| Property location, permit, acquisition type, contractual price and documents | Staff-reviewed development/property evidence, not ordinary calculator visitor inputs. |

Armenian refund labels now use «հետվերադարձ». The salary label explicitly identifies gross salary before deductions. The existing legal snapshot, calculations, caps, validation and eligibility semantics are unchanged. The borrower form now has two explicit steps: salary/payment inputs (including an optional co-borrower) followed by eligibility checks. Calendar/date and salary inputs are validated before advancing. Going back preserves entered values; editing salary invalidates the displayed tax and refund result. Document confirmation is cleared when a personal eligibility answer changes. Property exclusions still preflight before salary collection, and unreviewed properties expose only salary-tax estimates with unresolved refund amounts in step two. No legal checks are silently removed and no missing answers are assumed.

The ownership question explicitly routes prospective purchases and registered rights to buy a property under construction to “unknown / needs review.” The current participant-ownership model must not turn a future purchase intention or a construction purchase-right into confirmed ownership. This is a conservative model boundary, not a statement that those purchases are legally excluded.

Two-step verification passed: 368 frontend and 19 backend unit tests, 92 real API checks and 121 Chromium checks, plus feature TypeScript/lint and both production builds. Component checks cover step separation, preserved inputs, optional co-borrower tax aggregation, explicit zero withheld tax, missing historical rates, document self-check invalidation, and property preflight exclusions. Real iframe checks retain the independent 300,000 AMD quarterly refund reference and salary privacy.

### Partner appearance

New partner and staff setups default to navy blue (`#173453`). Existing saved colors are preserved. The saved appearance accent colors the widget payment panel, primary refund actions, partner marker, focus indicators, checkboxes and active refund-step border in both light and dark themes. Black or white text is selected using sRGB relative luminance for the higher contrast on the exact chosen color; the refund toggle uses the inverse combination. Preview and installed SDK use the same calculator and server-provided appearance. No configuration migration is required.

Appearance verification passed: 375 frontend and 19 backend unit tests, 92 real API checks and 126 Chromium checks, plus feature TypeScript/lint and both production builds. Browser checks cover navy defaults in both setup forms, saved purple after refresh, actual computed payment/action colors, and yellow with black text in dark mode. Mobile screenshots were visually reviewed.
