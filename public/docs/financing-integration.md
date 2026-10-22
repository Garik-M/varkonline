# Varkonline financing integrations

The partner website supplies apartment values through its existing template. Varkonline stores integration settings, not a synchronized apartment inventory or a mandatory document registry. Calculations are estimates, never a bank offer, loan approval or SRC decision.

## Getting access as a partner

1. Open [Varkonline Financing Partners](https://www.varkonline.am/financing-partners), read the introduction and acknowledgement, then submit your company and contact details.
2. Varkonline reviews the application. After acceptance, your approved contact receives a private invitation shared by the Varkonline team. Invitation delivery is manual.
3. Open the invitation within 72 hours and set your password. If the email already has an account, enter that account's current password instead. The link works once.
4. Sign in to the [partner workspace](https://www.varkonline.am/partner). Enter your actual currency, financing type, mortgage rate where applicable, down payment and term, then save.
5. Enter a sample apartment price to generate and copy your code. The sample is not a default apartment price. Bind the actual apartment ID and financial values in your website's shared apartment template, following the examples below.
6. Test the live preview and your deployed apartment page. Website access permits the approved hostname and its www counterpart, with the same scheme and port. Ask Varkonline to review additional domains, restricted settings.

For an expired invitation or account recovery, contact Varkonline at info@varkonline.am. Existing partners can change their password in the workspace. A staff-paused integration requires Varkonline to reactivate it.

### Income-tax refund in the preview

In Calculator settings, enable **Show income-tax refund calculator for mortgages**, then save. New integrations enable this by default. Enter a sample apartment price and open the live preview. The sample ID identifies the apartment; no staff-created apartment or development record is required.

The compact refund form asks only for monthly take-home salary, with an optional co-borrower if enabled by the partner. It is always visible and recalculates immediately. No date fields, withheld-tax override or acknowledgement checkbox are shown. It illustrates eligibility, constant income, fully settled salary tax, no interest subsidy and no other tax-refund claims; a small notes section explains those assumptions. There are no property, employment, ownership, prior-benefit, tuition or employer-payment questionnaires.

The result means **the financial amount if eligible**, not an entitlement determination. Missing legal evidence does not block this illustration because it does not assess legal conditions. Missing financial inputs still block or leave amounts unresolved. Interest-free installments have no mortgage-interest refund. USD refund amounts remain unresolved without explicit AMD payment/interest amounts; the basic form never invents exchange rates. Salary stays inside the iframe and is not submitted to Varkonline.

## Quick integration

Partners normally create their calculator in the partner workspace after application acceptance and account activation. Staff review every saved integration in the searchable directory at `/admin/financing`. **Create integration manually** is a secondary staff tool; it creates a calculator configuration, not a partner account or invitation.

Open a company's **Review** link to view its overview at `/admin/financing/:slug`. **Calculator settings** contains the actual terms, website access, pause/activation switch and appearance, with an immediate local draft beside the controls (above them on mobile). Draft interactions do not save changes or collect analytics. **Advanced settings** contains optional shared prices, permitted overrides, allowed currencies/models and technical bounds. **SDK & preview** uses the saved configuration and accepts a sample apartment ID, price and an optional annual-rate override. Leave the sample rate blank to use the saved price-tier rule or default rate. Links from application records also open the matching saved integration.

Register the exact website origin, for example `https://defanse.am`. HTTP is permitted only on loopback during development. The same hostname with or without a leading `www.` is allowed automatically, including for existing integrations. Other subdomains, schemes and ports require their own entries. Loopback and IP origins remain exact. The public identifier is stable and is not a secret.

Add this div to the shared apartment template, and load the script once in the layout. Replace the example ID and numbers with the actual apartment's escaped values. The real frontend deployment hosts `/sdk/v1.js`; the existing Express deployment hosts `/embed/:partner`. No `embed.varkonline.am` DNS assumption is made.

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

Use the snippet generated by your deployed admin page if its frontend hostname differs. Replace `defanse` with the actual active record. This example does not create or assert Defanse's financial/legal terms. The local example uses a synthetic `defanse-local` record.

## Attributes and precedence

| Attribute | Format / units | Requirement and behavior |
| --- | --- | --- |
| `data-partner` | Lowercase letters/digits/hyphens, 2–64 characters | Required stable partner ID. |
| `data-apartment-id` | Nonempty identifier, max 120 characters | Required stable apartment identity. Do not put personal information here. |
| `data-language` | `hy`, `en`, or `ru` | Optional presentation setting. Otherwise uses the page's `lang` (Armenian fallback). Visitors can change language inside the widget. |
| `data-price-amd` | Positive whole AMD, up to 1 trillion | Supply exactly one price currency, or use a configured default price. No commas or exponent notation. |
| `data-price-usd` | Positive whole USD, up to 1 trillion | Alternative to AMD, never both. No FX conversion is performed. |
| `data-annual-interest-rate` | Percentage points within the configured bounds; `9.5` means 9.5% | Mortgage only. Optional when a saved price-tier rule applies to the apartment's currency or a default rate exists. An explicit permitted apartment rate overrides both. If neither applies, supply a rate; none is invented. Omit the attribute entirely instead of sending an empty value. Never flat developer markup. |
| `data-down-payment-percent` | Percentage points, 0–100 | Omission uses partner default; 0% and 100% supported. |
| `data-duration-months` | Whole months, 1–600 | Omission uses default; must meet partner range, step or supported-term list. |
| `data-financing-type` | `mortgage` or `developer_installment` | Omission uses default. Developer plan is explicitly interest-free; omit annual rate. |
| `data-development` | Registered development ID | Legacy advanced setting; not needed for normal calculator setup. |
| `data-contract-price-amd` | Whole AMD contractual price | Optional unverified evidence; never establishes eligibility. Not an inferred currency conversion. |
| `data-loan-origination-date` | ISO `YYYY-MM-DD` | Optional actual or planned date; otherwise the current Yerevan date is used for the illustration. Does not confirm origination. |
| `data-first-payment-date` | ISO `YYYY-MM-DD` | Optional explicit first contractual monthly payment date; otherwise the same day next month, clamped at month-end, is used. |

Explicit apartment values replace defaults only when that override is permitted. A value identical to the default is accepted without override permission. Currency is inferred from the price attribute; changing it also needs currency permission. Values must meet allowed types/currencies, numeric limits, minimum-plus-step (down payment/duration), and an explicit supported-duration list when configured. There are no silent rates or invented financing defaults. Runtime visitor controls permit only configured down-payment and duration changes.

All calculations round half-up to whole AMD or whole USD. Monthly interest uses remaining principal; the final installment adjusts rounding. The complete schedule and totals come from Phase 1. Mortgage rates are nominal, fixed, with monthly annuity payments; daily accrual, fees, insurance, grace periods and irregular payments are not modeled.

## HTML, CMS, dynamic sites

**Plain HTML:** use the snippet above for each widget. Multiple widgets share the same script. Do not place the salary form or legal evidence in the host page.

**WordPress:** put the script once in the theme layout (or enqueue it), and the div inside the property template. Validate required custom fields in the CMS; escape attributes, including IDs and numbers. For example:

```php
<div class="varkonline-widget" data-partner="defanse"
  data-apartment-id="<?php echo esc_attr((string) get_the_ID()); ?>"
  data-price-amd="<?php echo esc_attr((string) get_post_meta(get_the_ID(), 'price_amd', true)); ?>"
  data-annual-interest-rate="<?php echo esc_attr((string) get_post_meta(get_the_ID(), 'mortgage_rate', true)); ?>"></div>
```

Blank or unresolved fields cause an integration error; omit an optional attribute only when a reviewed partner default should apply.

**Webflow:** put the script once in the site's footer custom code. Put the div in an Embed on the CMS property template. Connect `data-apartment-id`, `data-price-amd` and `data-annual-interest-rate` using Webflow's CMS field insertion. The inserted values must be plain whole numbers / decimal percentages. Omit optional attributes instead of inserting blank fields. Publish and allowlist the published origin; Designer preview has a different origin.

**React:** load the script once in the application layout. Data attributes work with the auto observer, including SPA insertion and removal:

```tsx
function ApartmentFinancing({ apartment }) {
  return <div className="varkonline-widget" data-partner="defanse"
    data-apartment-id={apartment.id} data-price-amd={apartment.priceAmd}
    data-annual-interest-rate={apartment.interestRate} />;
}
```

**Next.js:** use `next/script` in the layout with `src="https://www.varkonline.am/sdk/v1.js"` and `strategy="afterInteractive"`; render the same div in the property component. Do not import the iframe's React app or call browser globals during server rendering. Hydration, attribute updates and route removal are handled by the SDK observer. Give each React apartment component a stable key.

**Dynamic HTML:** append ordinary `.varkonline-widget` elements; change their `data-*` attributes to update them. Remove the element on route cleanup. The SDK removes its iframe, timer and per-instance state. It does not alter unrelated host children. Explicit `destroy` suppresses auto remounting until `mount` is called again.

## Optional browser API and events

Wait for the script's `load` event before calling the API. For a script already loaded, use `window.VarkonlineFinancing` directly.

```js
const sdk = window.VarkonlineFinancing;
sdk.mount(document.getElementById('finance'), {
  partner: 'defanse', apartmentId: 'A-101', apartmentPrice: 35000000,
  currency: 'AMD', financingType: 'mortgage', annualInterestRatePercent: 9,
  downPaymentPercent: 20, durationMonths: 240
});
sdk.update('#finance', { apartmentPrice: 36000000 });
sdk.destroy('#finance'); // e.g. component cleanup
sdk.mount('#finance', { partner: 'defanse', apartmentId: 'A-102', apartmentPrice: 42000000 });
// sdk.scan(root) explicitly scans a newly inserted subtree if needed.
// sdk.disconnect() terminally removes this SDK's widgets and stops its observer.
```

The object API uses `developmentId`, `contractPriceAMD`, `loanOriginationDate` and `firstPaymentDate` for corresponding attributes. Setting an optional value to `undefined` in `update` removes that explicit override. Programmatic updates persist until the host changes the element's apartment attributes. The SDK mounts automatically and is safe to load repeatedly. The shared observer remains active to discover future widgets, even when no widgets are currently mounted; `disconnect()` stops it completely. Message listeners are removed when the last widget is removed. Use `destroy`, rather than globally disconnecting the shared SDK, on individual component cleanup.

```js
document.addEventListener('varkonline:loaded', event => console.log(event.detail));
document.addEventListener('varkonline:calculated', event => {});
document.addEventListener('varkonline:changed', event => {});
document.addEventListener('varkonline:error', event => console.warn(event.detail.code));
```

Events bubble from the widget and contain only `partner`, `apartmentId`, `instance`, and optional error `code`. No salary, tax, legal responses or calculated amounts are emitted. Do not put private information in apartment IDs. No third-party tracking is added. Cross-window messages require the exact origin, iframe/parent window identity, protocol version and random instance ID; responses use explicit target origins.

## Refund illustrations

The iframe uses `calculateMonthlyMortgageRefundEstimate`: a conservative financial illustration that limits each month to that month’s salary tax and eligible interest, then applies the shared quarterly cap. Unused tax is not shifted to other months. The statutory quarterly APIs remain separate and unchanged. It reuses Phase 2 salary-tax, cap and interest arithmetic. Salary and personal answers are memory-only; no API, cookie, localStorage or analytics writes contain them. They reset on apartment/revision changes and iframe destruction. The UI supports one borrower plus an optional distinct co-borrower.

No property or borrower eligibility questionnaire, apartment registry, document references or documentary self-checks are required. The financial illustration assumes an eligible mortgage and eligible participants. It does not assess property location, acquisition type, the contractual price eligibility limit, employment, ownership, identity, prior use or competing legal benefits. A number is not confirmation of entitlement; those restrictions still apply in reality.

The caller explicitly chooses the pure `calculateMortgageRefundScenario` API. It returns `calculationBasis: "financial_scenario"` and `eligibility.status: "not_assessed"` for a complete illustration, even when amounts are numeric. It never fabricates positive legal evidence. The existing `calculateMortgageIncomeTaxRefund` API and standalone evaluator retain their strict entitlement checks for consumers that actually supply legal facts. Formula and calendar arithmetic are shared rather than duplicated.

The basic UI projects constant monthly income and answers throughout complete calendar quarters using the explicit `AM-160-1321N-2026-10-17` rules snapshot. It assumes fully paid salary tax, no tuition/other tax allocations and no interest subsidy. Variable payroll histories, subsidized/irregular contracts and bank-certified USD-to-AMD schedules require a richer model. Future law, income and eligibility changes are not predicted.

After the first refund calculation, changes to the down payment or financing term automatically recalculate the illustration in place. Salary and optional co-borrower values remain visible and preserved; dates are internal illustration assumptions. Empty or invalid intermediate values suspend the displayed estimate until corrected; they do not reset the form or steal typing focus. Changing the apartment still resets private refund inputs.

The full bank repayment is visible before entering salary. After calculation, original monthly and full-term amounts are crossed out alongside estimated costs after refund. The full-term deduction uses the exact sum of monthly-limited estimates, never a rounded monthly average multiplied by duration. These are cost comparisons: actual bank payments remain unchanged. Quarterly refunds are separate transfers. Costs shown with bank repayments exclude the down payment.

## Partner meeting and working demo

Open [the working SDK demo](https://www.varkonline.am/examples/financing-demo.html). It uses an active, clearly labelled **Varkonline demo** integration restricted to Varkonline's own website. It is not a bank/developer endorsement and is separate from the paused mock company records. It uses the real deployed SDK, public resolver and iframe, not a visual mockup.

Demo sequence (2026-10-20 release):

1. Select apartment A: 35,000,000 AMD; the configured price rule selects **13.25%** at the threshold. Down payment is 7,000,000 AMD and term is 20 years.
2. Bank payment: **333,041 AMD**; full bank repayment: **79,929,410 AMD**.
3. Enter **500,000 AMD take-home salary** in the already-visible field. No dates, tax override or checkbox are required. The demo fixes origination at 2026-01-01 and first payment at 2026-01-31 for reproducible references. Ordinary integrations default to a new loan now and first payment next month.
4. Standard payroll inference: gross 695,429 AMD, income tax **139,086 AMD**. First-month illustrated cost: **333,041 − 139,086 = 193,955 AMD**. Full-term refund: **30,332,866 AMD**; full-term cost after refund: **49,596,544 AMD**, excluding the 7m down payment.
5. Move the timeline to month 240: bank payment **332,611 AMD**, interest/refund allocation **3,632 AMD**, cost **328,979 AMD**. Principal is never refunded. These are conservative monthly estimates, not monthly bank deductions or predicted refund receipt dates.
6. Change down payment to **10,500,000 AMD**: bank regular payment **291,411 AMD**, total refund **29,782,541 AMD**. Change term to **15 years**: payment **314,025 AMD**, total refund **21,759,028 AMD**, net total **34,765,714 AMD**. Salary remains filled and focus stays in the edited field.
7. Switch Armenian/English/Russian; results remain. Changing apartments clears private salary values. The separate developer example remains 30m AMD, 20% down, 36 months, regular payment **666,667 AMD**, interest-free and without mortgage refunds.

References were independently calculated with 70-digit Python Decimal, half-up whole-unit amounts, outstanding-balance interest and calendar-quarter minima. These are illustrations holding the selected rules and salary constant.

Partner onboarding: application and acknowledgement at `/financing-partners`; staff review/acceptance; private invitation manually shared within its 72-hour validity; account activation; settings saved in `/partner`; SDK code copied into the partner's shared apartment template. The sample apartment price generates code but is not an inventory import. Website prices and allowed per-apartment rates/down payments/terms remain authoritative. Changes to shared defaults or appearance are available in the partner workspace.

For the meeting, collect the company's website/CMS, live and staging origins, mortgage/installment models, apartment price and term data sources, default language, brand colour and technical contact. Agree separately on commercial pricing, support expectations and contractual terms; the product does not define a commercial offer, SLA or guaranteed approval/refund. Do not promise automatic invitation email, lead capture from salary forms, eligibility scoring, ACRA checks or an official bank offer: those are not part of this feature.

Integration normally needs the script once in the website layout and a div in the existing apartment template. No apartment synchronization or per-apartment Varkonline record is required. The partner's developer binds the real apartment ID, price and terms in that template and confirms its own CSP allows the SDK and iframe domains. Implementation effort depends on the website; no universal installation deadline is promised.

## Partner controls and analytics

The partner panel provides a live draft preview and explicit save. Configure down-payment bounds and dram increments, term bounds in years for mortgages (months for installments), visitor-adjustable fields, interest bounds, a price-threshold rate rule, annuity or equal-principal repayment, optional visitor choice, default language, schedule/totals visibility, co-borrower option, refund visibility, theme and accent. Separate developer-installment limits preserve short interest-free plans. Existing saved integrations retain their terms; no customer configuration is silently overwritten.

When schedule visibility is enabled, **Download schedule · Excel** exports a real `.xlsx` workbook in the selected Armenian, English or Russian language. The summary contains the apartment ID, partner, applied loan terms and totals. The schedule contains every month (not only the visible page), opening balance, bank payment, principal, interest, remaining balance and exact final installment. A resolved AMD refund adds the estimated monthly refund allocations and cost after refund; unresolved refunds are omitted. The workbook is a snapshot of the engine results, not an editable loan model. All amounts are numeric whole AMD/USD, and salary inputs are excluded. Files are generated locally in the browser, with no upload, new API or database record. The SDK iframe permits downloads; custom outer sandboxed frames must also allow downloads.

New mortgage setup uses visible, editable presets: 10–100% down, 10,000 AMD increments, 10–20 years, editable rates 1–30%, annuity, and AMD price tiers: below 35m → 12.75%; at/above → 13.25%. An explicit website-supplied apartment rate takes precedence over the tier rule. USD never uses an AMD threshold by conversion. Defaults and bounds must reconcile before saving. These are partner-configurable product terms, not legal/bank-wide requirements.

Analytics tracks named widget loads, field interactions, refund calculations, language/repayment changes and schedule navigation. It records no salary, typed amounts, DOM text, full page URL, IP, user-agent, auth credential or activity outside the widget. Session identifiers are random, in-memory and per iframe; they do not identify a person across visits. Live/draft panel previews are excluded. Do Not Track and Global Privacy Control opt out. Delivery is best-effort, so dashboards are not audited visitor counts.

Partners can view only companies they currently own; staff can review each integration's analytics. The panel shows session/engagement/refund/schedule counts, conversion, daily activity, top apartments, languages and the latest 50 session timelines (up to 500 events each). Reports accept only 7/30/90-day ranges, use Yerevan time and hide expired events. Indexed, bounded ingestion cleanup removes data older than 90 days on subsequent batches; no history is shared with another partner.

Public ingestion uses expiring, audience-separated, partner/origin/apartment-scoped signed tokens issued after normal origin checks; strict allowlisted payloads, body/batch/rate limits and UUID event deduplication. Tokens are public telemetry capabilities, not account credentials or proof of a real human. Origin allowlisting cannot prevent scripted HTTP clients from imitating visitors. Existing HttpOnly partner sessions, CSRF-origin checks, admin roles and current ownership checks protect reporting and configuration.

## APIs and storage

- `POST /api/embed/:slug/resolve`: public `{ parentOrigin, apartment }`, returns canonical financing inputs, controls, branding, scoped evidence and partner revision. Strict JSON, 16 KiB maximum; no payroll accepted. Unknown/inactive partner: 404; origin: 403; invalid input: 400; disallowed override/bounds: 422; service unavailable: 503.
- `GET /embed/:slug?parentOrigin=...&instance=...&sdk=1`: iframe HTML with a partner-specific HTTP `frame-ancestors` policy, random script nonce and explicit bootstrap attributes. The page loads only the isolated calculator entry, without the main site's auth or analytics. No secrets in host HTML.
- `GET/POST /api/financing-partners`, `PUT /api/financing-partners/:slug`: existing JWT admin authentication. PUT body `{ revision, partner }`; stale edits/duplicate identifiers: 409. Slug immutable. Deactivate rather than delete. Admin JSON limit 512 KiB.
- `POST /api/embed/:slug/events`: scoped telemetry batches; unknown metadata/financial values rejected.
- `GET /api/partner/companies/:id/analytics?days=30` and `/analytics/sessions/:session`: current-owner authenticated reports. Staff equivalents: `/api/financing-partners/:slug/analytics`.
- Additive migration `backend/migrations/20261020_financing_events.sql`: indexed, partner-scoped telemetry storage only.
- Additive migration `backend/migrations/20261017_financing_partners.sql`: new `financing_partners` table, configuration JSONB, active flag, exact origins, revision, reviewer ID and timestamps. It never modifies existing partner applications or runs automatically at startup.

Domain allowlisting restricts browser embedding but is not API authentication: external HTTP clients can claim origins. Browsers enforce the actual ancestor origins using the [HTTP frame-ancestors policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors), even when a query parameter is forged. [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) is separately checked in both directions. Public endpoints contain no privileged operations. Rate limiting is bounded and per-process (public 240/min, iframe/admin 120/min per IP); configure `TRUST_PROXY_HOPS` to the exact trusted deployment proxy count, never blindly trust arbitrary forwarded headers. Multiple backend replicas have independent counters; use your platform's perimeter controls if a global quota is required.

Active iframes refresh configuration every 60 seconds while visible. Deactivation removes results on the next refresh; it cannot revoke an already loaded document instantly. Initial API requests time out at 12 seconds; SDK load status times out at 20 seconds. Error states have retry actions. The iframe template cache is 30 seconds. Deploy frontend assets before backend and retain prior hashed assets through rollout where supported; otherwise a reload/retry may be required across asset replacement.

## Local verification

Prerequisites: installed frontend/backend npm dependencies, PostgreSQL CLI (`initdb`, `pg_ctl`, `createdb`, `psql`) and Playwright Chromium (`cd backend && npx playwright install chromium`).

Run `bash backend/scripts/test-financing-local.sh` from the repository root. It creates an isolated temporary PostgreSQL cluster, applies the baseline schema and additive migration, builds both applications, runs unit/API/browser checks, serves the partner example on localhost:8090 and tears its processes/database down afterward. It refuses occupied ports and never reads production database credentials. Reports/screenshots go to `backend/artifacts` (ignored). Existing unrelated full-app lint/type issues are documented separately in the implementation report.

For a persistent manual session, use the same commands in the script without its cleanup trap. Frontend assets must be production-built with `VITE_API_URL=http://localhost:3000/api`; run `vite preview` on 8080 and the existing Express app on 3000 with explicit local PG variables, empty DATABASE_URL and localhost EMBED origins. The example is `frontend/public/examples/apartments.html`, served separately on 8090. All legal/partner fixtures are explicitly synthetic. Do not copy test evidence to production.

## Production rollout procedure

1. Review financing terms, legal snapshot and documentary evidence; obtain the actual partner origins and approved branding. Create explicit limits/defaults; never ship local fixture records.
2. Apply the additive migration to the intended database after normal review/backup. Deploy backend and frontend code through existing Railway/Vercel pipelines.
3. Build frontend with `VITE_API_URL` pointing to the actual backend `/api`. Set backend `EMBED_FRONTEND_ORIGIN` to the canonical frontend origin and `EMBED_PUBLIC_ORIGIN` to the backend origin, plus reviewed `TRUST_PROXY_HOPS`. HTTPS is mandatory outside loopback.
4. Preserve frontend Vercel asset CORS headers (`/assets/*`, `Access-Control-Allow-Origin: *`) so the iframe on the backend host can load frontend ES modules. `/embed.html` is a static multi-page entry, not the main SPA fallback; confirm it is served as built. SDK cache is five minutes; hashed calculator assets follow existing hosting cache behavior.
5. On another static host, configure the same module CORS headers, serve `embed.html`/`sdk/v1.js` as real files and preserve `/admin/*` SPA routing. Do not add a global X-Frame-Options DENY/SAMEORIGIN header to backend embed responses. The partner's CSP must allow the SDK host in `script-src` and backend host in `frame-src`.
6. Create an inactive real partner in admin, save approved settings, test the live preview, then activate and test on the exact allowlisted staging/production website. Copy the generated snippet to the shared property template. Test three real apartments and privacy/security behavior before rollout.
7. Monitor backend 4xx/5xx and host widget error codes; avoid logging request bodies. Test login/public-site compatibility through normal release checks. No production deploy/data mutation is authorized by the local implementation request.

## Troubleshooting

- `INVALID_NUMBER` / `INVALID_INPUT`: no commas, empty strings, currency signs, NaN, or unresolved `{{template}}` expressions. Use whole prices and months. Verify field mapping and date validity.
- `RATE_REQUIRED`: configure an explicit mortgage rate or supply an authorized apartment rate. Never use an arbitrary fallback.
- `OVERRIDE_NOT_ALLOWED` / `OUTSIDE_PARTNER_LIMITS`: change policy through an authorized admin or use allowed values; check term lists and steps.
- `INSTALLMENT_RATE_NOT_APPLICABLE`: omit annual interest for developer installments. Only interest-free formula is currently supported.
- `PARTNER_UNAVAILABLE`: wrong ID, inactive record, or unapplied migration/service issue. Check protected partner administration and backend logs.
- `ORIGIN_NOT_ALLOWED` / blocked iframe: register the real page origin, including scheme and port. Its www counterpart is included automatically; other subdomains need explicit registration. Nested ancestors must also satisfy CSP. Check browser CSP errors and partner `frame-src` policy.
- SDK timeout: check script URL, backend availability, exact origins and frontend asset deployment. A failed iframe cannot send a trusted handshake; the host shows a safe timeout rather than assuming success.
- Blank iframe/module CORS error: confirm the asset CORS header, frontend EMBED origin, built `embed.html` and correct backend URL; a SPA fallback HTML response is not a JavaScript module.
- Refund unresolved: check the financial inputs and currency. The simplified widget estimates amounts if eligible and does not perform documentary approval. USD refunds need explicit AMD payment/interest data; no exchange rate is invented. Bank payment calculations continue to work.

### Host website security policy

A host page with Content Security Policy must permit `https://www.varkonline.am` in `script-src` (and `script-src-elem` if separately defined), and `https://varkonlineback-production.up.railway.app` in `frame-src` (or the applicable fallback). Varkonline cannot change another website’s response policy. Browser-console insertion remains subject to that policy; adding www support to a partner does not bypass it.

### Borrower refund flow

Take-home salary is always visible. Entering salary estimates available payroll tax and the conservative monthly mortgage refund. There are no property/employment questionnaires, date fields, actual-withholding overrides or acknowledgement checkboxes. Optional co-borrower salary appears only when enabled by the partner. Changing down payment, rate or term recalculates in place and preserves salary. All Armenian refund labels use «հետվերադարձ».

### Compact widget and languages

The initial widget shows property price, nominal rate, editable down payment/term and monthly payment. Fixed terms appear as text. Repayment totals, the full schedule and cost/rounding notes expand on request. Marketing copy, duplicate headings and the internal apartment identifier are omitted. Phone inputs retain 16px text and controls have at least 44px touch targets.

Set `data-language="hy"`, `data-language="en"` or `data-language="ru"`; the object API uses `language: 'en'`. Both partner and staff SDK previews have a widget-language selector and include it in copied code. Without an explicit value, the SDK uses the host document's language (`en-US` and `ru-RU` normalize to `en` and `ru`); unsupported host languages fall back to Armenian. Unsupported explicit SDK languages are rejected. The visitor's selector translates labels, errors, repayment/refund schedules, eligibility reasons and number formatting. Switching languages preserves entered salary, answers and results, including through language-only SDK updates. Language is presentation data and is excluded from financial API payloads. No locale preference or salary is stored.

The refund result prominently shows **Total estimated refund** over the selected financing term. It is the exact sum of the monthly-limited estimates after the shared quarterly cap; it is never salary tax multiplied by the term. A confirmed zero displays as zero. Unsupported USD refund scenarios remain unresolved without explicit AMD inputs.

After calculation, the payment panel shows **Bank payment − Estimated refund for the selected month = Cost after refund for that month**. The full-term comparison subtracts the exact total estimated refund from full bank repayment. Original bank amounts remain visible with a strike-through, and bank obligations do not change. The salary section stays open while edits recalculate in place. Mortgage terms display in years; developer installments display in months.
