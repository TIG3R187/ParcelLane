# ParcelLane

A shipping and cargo website for a small Nigerian logistics business, built in one Next.js repository. ParcelLane is a temporary brand. All four implementation phases are implemented; the customer preview keeps public bookings, enquiries, and payments closed while business details are pending.

Customer preview: **https://parcellane-preview.vercel.app**  
Administrator login: **https://parcellane-preview.vercel.app/admin/login**

## Experience

- Responsive navy, orange, and soft-white homepage following the supplied design board, with local photography, Manrope typography, tracking, service cards, and shipment planning.
- Express delivery, nationwide shipping, international cargo, about, contact, FAQs, and clearly marked legal drafts.
- Full sender/recipient, pickup/destination, dimensions, weight, contents, collection date, and instructions form. Booking and quote requests are reviewed before acceptance.
- Server-calculated estimates from versioned city-to-city rates. Missing rates and international cargo require individual review; no invented prices are seeded.
- Database-backed tracking with a chronological timeline and cryptographically random identifiers. Public results omit all private customer, address, payment, and admin data.
- Better Auth administrator login, dashboard, shipment creation and review, quote confirmation, controlled status transitions, pricing history, enquiries, notification retries, payment verification, and read-only audit log.
- Optional Paystack **test-mode** hosted checkout with backend verification, signed webhooks, and idempotent confirmation. SMTP email adapter with a persistent notification queue; disabled by default.

## Design, Tailwind CSS, and animations

Tailwind CSS v4 supplies utility styles; the tokens and layout classes in `src/app/globals.css` establish the navy/orange palette, soft backgrounds, typography, form controls, admin sidebar, and responsive tables. Adapted shadcn/ui components live in `src/components/ui`, using Radix primitives for accessible interaction. Change shared tokens first when replacing the temporary brand.

Motion provides small scroll reveals and a restrained page-entry movement. Animations respect reduced-motion preferences. Controls support keyboard use, visible focus, semantic labels, and accessible feedback. Fonts and the optimized WebP hero are local; no remote font or image service is required. Image provenance is in `docs/assets.md`.

## Stack and setup

Next.js App Router, React, strict TypeScript, Tailwind/shadcn, Motion, Neon PostgreSQL, Drizzle ORM, Better Auth, Zod, Nodemailer, Vitest, and Playwright. Exact stable versions are locked in `package-lock.json`. Use **Node.js 24** and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

On Windows use `npm.cmd` and `Copy-Item .env.example .env.local`. Open http://localhost:3000. Do not overwrite an existing configured `.env.local`.

Public information pages work without database credentials. Tracking, quotes, authentication, and admin operations need Neon and `BETTER_AUTH_SECRET`; unavailable services fail with a safe error instead of claiming success. Keep secrets in ignored local configuration and Vercel secret storage, never chat, client code, screenshots, or source control.

## Database

Set `DATABASE_URL` to your authorized Neon PostgreSQL connection with `sslmode=require` or `verify-full`. The hostname must end in `.neon.tech`. The configured local database has migrations `0000` and `0001` applied and all 13 tables verified.

```sh
npm run db:check
npm run db:migrate
npm run db:verify
```

Review SQL before applying it to another database. Migrations never run during application startup, build, or CI. For schema changes run `npm run db:generate` and commit generated SQL and Drizzle metadata together. Do not use destructive schema push commands against an operating database.

Tables cover shipments, private shipment details, events, versioned prices, enquiries, persistent rate limits, audit records, Better Auth users/sessions/accounts/verifications, payments, and notifications. Monetary values use integer kobo; stored dimensions/weight use millimetres/grams. Atomic database batches or SQL statements couple operational changes with history and audit records.

## Administrator access

In `.env.local`, fill these exact keys:

```dotenv
ADMIN_BOOTSTRAP_EMAIL=your-admin@example.com
ADMIN_BOOTSTRAP_PASSWORD=your-private-strong-password
```

Use 14–128 characters for the password and generate a separate random `BETTER_AUTH_SECRET` using the command in `.env.example`. Then:

```sh
npm run admin:create
```

The owner account requested in this session is already provisioned. Visit `/admin/login` and use the saved password. There is no public signup. To reset the owner's password privately, update the bootstrap values and run `npm run admin:reset-password`; this revokes existing sessions. Bootstrap variables belong to the private CLI, not the deployed application.

Every admin page and operation checks the current session and database administrator role on the server. Sessions expire after eight hours. Public signup and unused authentication endpoints return 404. Authentication has persistent IP/account limits; signed-in writes require the exact configured origin.

## Pricing and shipment workflow

1. Add approved service/city-to-city rates under `/admin/pricing`. Names match without case sensitivity. Prices are in kobo: **100 kobo = ₦1**. Each saved version archives the previous active version.
2. Estimates calculate `base + ceil(max(actual kg, length × width × height / divisor, 1)) × per-kg price`. International cargo always needs review.
3. A request starts at **Awaiting review**. Review the details and confirm a final quote; estimates alone do not accept a booking.
4. Progress through **Confirmed → Collected → In transit → Delivered**. Exceptions and cancellations have controlled transitions. Each change records its actor, timestamp, status event, and audit entry.
5. Payment status is independent of shipment status. Confirmation of a payment never advances the parcel. Offline arrangements are possible; this app does not implement refunds or accounting reconciliation.

Booking confirmation shows a private payment access code once. Only its hash is stored. Keep this code out of URLs and public tracking; losing it requires assistance from the business, not public recovery.

## Optional test payments

Leave `PAYSTACK_ENABLED=false` for the preview. To test later, supply an authorized `sk_test_` secret, set the switch true, and configure the test webhook URL `/api/payments/webhook` and callback `/payment/callback` on the canonical site origin. The application uses hosted checkout, so no public key or payment widget is needed.

The server validates the stored reference, amount, NGN currency, provider success, and test domain through Paystack's verification API. A redirect alone cannot mark an order paid. Unique references and an atomic conditional update make duplicate confirmations idempotent.

Set `PAYSTACK_WEBHOOK_SECRET` to the full `whsec_` secret when available. The modern signature checks the raw body, every supported signature entry, and a five-minute timestamp window. When no signing secret is configured, the legacy raw-body HMAC uses the test API secret. Once the modern secret is configured, there is no downgrade to legacy verification. See [Paystack's webhook documentation](https://paystack.com/docs/payments/webhooks/).

An uncertain initialization remains pending to avoid a duplicate charge. Administrators can verify it by reference from payment records; do not delete or reset it merely because the browser timed out. Definitive failed-provider recovery/refunds require manual provider reconciliation; no live payment keys are accepted. External Paystack checkout has **not** been exercised with real provider credentials.

## Email

`EMAIL_ADAPTER=disabled` records notifications without sending. For SMTP, configure `EMAIL_FROM` as a mailbox address, host, port, username and password, then select `smtp`. Port 465 uses TLS; other ports require STARTTLS. Sender verification and provider credentials remain the owner's responsibility.

Shipment creation, quote review, and status changes attempt immediate delivery. Payment notifications are queued. `/admin/notifications` provides explicit retries with an atomic claim and up to five attempts; there is no paid scheduler or background worker. SMTP can deliver twice if delivery succeeds but its database acknowledgement fails; recipients should treat emails as informational and consult tracking. No real SMTP delivery has been tested.

## Customer preview and opening requests

Keep `PUBLIC_REQUESTS_ENABLED=false`, `LEGAL_APPROVED=false`, `PAYSTACK_ENABLED=false`, and `EMAIL_ADAPTER=disabled` for demonstrations. The forms visibly explain their preview status, and their server endpoints refuse public writes. Use fictional admin-created data only. No production rates, fictional testimonials, fabricated statistics, support details, or offices are seeded.

Before opening requests, obtain the approved company identity, support email/phone, publishable address, coverage, rates, legal terms/privacy notice, retention policy, and operational procedures. Replace temporary copy, review legal drafts, set every `BUSINESS_*` value, and explicitly enable both public-request/legal switches. Verify the complete operational journey with the owner. Preview noindex headers remain until an approved launch change.

## Vercel deployment

The tested customer preview is deployed to the owner's personal Vercel account as `parcellane-preview`. The server and browser live checks passed through a reachable Vercel edge with normal TLS verification; this machine initially resolved older edge addresses while Google Public DNS returned the reachable addresses. If the new URL does not load immediately, allow DNS propagation or try another network before presenting it. Redeploy with the current Vercel CLI after checks:

```sh
vercel login
vercel link
vercel env add DATABASE_URL --environment production --sensitive
vercel env add BETTER_AUTH_SECRET --environment production --sensitive
vercel --prod
```

Commands use Vercel CLI 65's flag syntax. On Windows use `vercel.cmd`. The CLI prompts privately for secrets; never put values in shell arguments. Configure the preview switches above as ordinary nonsecret environment variables. Do not upload `.env.local`, bootstrap credentials, localhost origins, or unused provider secrets. `.vercelignore` excludes secrets, tests reports, caches and the original design board.

With no explicit `BETTER_AUTH_URL`, the app derives HTTPS origin from `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`. When adding a custom domain, set `BETTER_AUTH_URL` to the exact canonical HTTPS origin and redeploy. Access the canonical URL when signing in. See [Vercel system variables](https://vercel.com/docs/environment-variables/system-environment-variables).

Apply reviewed migrations separately to the configured database before deployment. Verify the homepage, service pages, tracking, admin login, disabled public endpoints, HTTPS headers, and the administrator workflow afterward. No paid services, custom domain purchases, or automatic migrations are part of this setup. Direct CLI deployment does not create a GitHub remote or enable Git-triggered deployments.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run db:check
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright runs the production server on port 3100, desktop and mobile Chromium, public-page accessibility, form validation, routing, security headers, and closed preview/admin endpoints. It uses no credentials in CI. Browser reports are ignored. Physical-device, Safari, manual assistive-technology, and independent penetration testing remain outside these checks.

`npm run test:integration` uses the explicitly configured Neon database: it creates clearly fictional temporary fixtures, checks Better Auth and authorization, concurrent persistent rate limits, server pricing, shipment history/privacy, and idempotent payments with the provider mocked, then removes its fixtures. Run only against an authorized development database; never point CI at production. It sends no emails and makes no real Paystack calls.

`npm run test:admin-browser` verifies real browser login, all eight protected admin pages with accessibility checks, shipment form submission, quote approval, status changes, public privacy, mobile layout, and logout. Build first and use an authorized development database. The script starts its own production server on port 3200, uses temporary fictional fixtures, and removes the fixtures and server afterward. No passwords or private payment codes are written to browser artifacts.

GitHub Actions runs dependency audit, lint, types, units, Drizzle checks, build, and browsers. The workflow is prepared but has not run on GitHub. Actual verification and remaining limitations are recorded in `PROGRESS.md`; dependency/security notes are in `docs/security.md`.

## Project map

| Path                | Purpose                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| `src/app`           | Public pages, admin pages, and same-repository API handlers                |
| `src/components`    | Responsive site, forms, admin controls, shadcn/ui adaptations              |
| `src/lib`           | Auth, server pricing, shipping, rate limits, payment checks, notifications |
| `src/db`, `drizzle` | Server-only connection, schema, reviewed migration SQL and metadata        |
| `scripts`           | Private admin provisioning, database verification, integration checks      |
| `tests`             | Vitest and Playwright checks                                               |
| `AGENTS.md`         | Permanent project and security rules                                       |
