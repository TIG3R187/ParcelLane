# ParcelLane project rules

## Product and scope

- Build a traditional shipping and cargo company website for a small Nigerian business. ParcelLane is a temporary brand.
- Follow `ParcelLane Logistics UI Design Board.png`: deep navy, orange, soft white, strong typography, professional photography, accessible responsive layouts, restrained motion.
- Never invent statistics, testimonials, offices, contact details, operating guarantees, or carrier partnerships. Clearly identify demonstration content.
- Implement only the phase requested. Phase 1 covers the foundation, public pages, design system, Neon connection code, and Drizzle migrations. Shipment processing is Phase 2; admin/auth is Phase 3; payments/notifications are Phase 4.
- Never activate paid services, create external infrastructure, or deploy without explicit user permission.

## Architecture

- Keep one Next.js App Router repository: strict TypeScript, React, Tailwind CSS, shadcn/ui, Motion, Neon PostgreSQL, Drizzle, Zod. Use npm and commit the lockfile.
- Use compatible stable versions. No Laravel, Supabase, Docker, separate backend, microservices, food marketplace, rider app, GPS, fleet management, native app, or automatic international carrier integration.
- Server-only modules must use `import "server-only"`. Never import database or secret configuration into client components. Validate environment configuration and all future server inputs with Zod.
- Keep server components by default; isolate interactive client components. Use local optimized images and semantic HTML. Respect reduced motion and support keyboard navigation.

## Security requirements for all later phases

- Protect every admin page and operation on the server with Better Auth authentication AND administrator authorization. No public admin signup or production demo bypass.
- Generate cryptographically random unguessable tracking numbers. Public tracking exposes only a minimal status projection; never addresses, contacts, or payments.
- Use persistent PostgreSQL-backed rate limits for authentication, tracking, bookings, and enquiries. Fail closed if unavailable. Do not use process memory as the production limiter.
- Calculate prices on the server using versioned configured rates; never trust client totals. Keep shipment and payment statuses independent.
- Preserve chronological shipment events and audit sensitive admin changes. Minimize personal data in logs and audit metadata.
- Paystack is optional and test mode only until separately approved. Verify webhook HMAC signatures, payment reference, amount, currency, and provider status on the backend. Confirm idempotently with unique provider references.
- Keep secrets out of source, logs, browser bundles, test artifacts, and committed files. Use fictional demonstration data only.
- Do not expose unfinished write endpoints. An unavailable feature must never pretend to submit, save, track, or accept payment successfully.

## Verification and handoff

- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and relevant Playwright checks after substantial changes. Report actual failures and limits.
- Keep `README.md`, `.env.example`, and `PROGRESS.md` accurate. Check in generated SQL plus Drizzle metadata; never run destructive schema commands against a real database.
- Apply migrations only to the explicitly configured database. Do not auto-migrate during application startup or CI.
- Before production, require approved operational copy, business contact details, legal review, enabled secure backend features, and separate deployment permission.
