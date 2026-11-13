# Security review

The customer preview has real protected backend features, but public booking/enquiry writes and Paystack payments remain disabled pending business details and approval. This review records implementation boundaries, not an independent security certification.

## Controls

- Server-only Neon, auth, shipping, payments, notifications and environment modules; bounded request bodies and server-side Zod validation. Public clients never receive database credentials or payment secrets.
- Better Auth email/password with public registration disabled and an explicit auth-route allowlist. Administrator authorization is checked on every admin page and mutation against the current database role; no production demo bypass. Private provisioning is audited; password reset revokes sessions.
- Persistent PostgreSQL counters enforce authentication, tracking, estimates, bookings, enquiries and admin limits. Authentication has account and client limits. Keys are HMAC hashes. Vercel's trusted forwarded-IP header is used there; elsewhere the shared fallback does not trust spoofed client headers. Database failures fail closed.
- Random 128-bit tracking identifiers and a separate hashed private payment capability. Public tracking returns only identifier, service, status and timestamped status events. No contacts, addresses, city inputs, notes or payment data appear in the projection.
- Backend calculations use versioned prices and bounded amounts in integer kobo. Shipment state transitions, history/audit, quote approval and payment confirmation use atomic statements/batches. Payment status stays independent.
- Same-origin checks protect browser mutations. A per-request script nonce and strict CSP protect hydration without production inline-script permission; styles permit inline values for animation. Framing/device permissions/MIME sniffing are restricted. Private routes use no-store/no-referrer; Vercel uses HSTS. Preview indexing is disabled.
- Test-only Paystack keys and verification of provider success, test domain, amount, currency and exact stored reference. Signed raw webhooks support modern timestamped HMAC and legacy signatures; modern configuration prevents downgrade. Unique provider references and conditional updates make confirmations idempotent. Uncertain initialization remains pending for reconciliation.
- Disabled email queues without delivery. SMTP requires TLS, validates settings, restricts file/URL access, and claims queued jobs atomically with limited retries. Notification and audit views are administrator-only.
- Secrets and artifacts are excluded from source/deployment. Safe application errors suppress raw database/provider errors. No analytics, third-party JavaScript or remote fonts are included.

## Verification and remaining limits

Real Neon integration checks verified login, fresh-role authorization, concurrent limits, backend pricing, atomic shipment history and public privacy. Paystack responses were mocked; actual checkout/webhook dashboard and SMTP delivery require provider credentials. Browser coverage and current results are recorded in `PROGRESS.md`.

Email delivery can be duplicated after an acknowledgement failure; it is informational, not exactly-once delivery. Retry is manual, not scheduled. Uncertain/failed payment initialization needs provider reconciliation; there is no automatic replacement charge, live payment mode or refund workflow. Recovery of a lost private payment code is not public. Operational data retention, database backups/restores and deletion requests need approved owner policies before collecting real customer data. Session storage may retain user-agent metadata; raw IP tracking is disabled in Better Auth.

## Dependencies

Exact versions and overrides are locked. The legacy Drizzle loader's esbuild is overridden to patched `0.25.12`, the same release used by Drizzle Kit itself; migration generation/check must pass before release. No Drizzle Studio/esbuild development server is exposed. Better Auth's optional tooling peer can classify Drizzle Kit as production in npm audit, so it is included when checking the production tree.

The previous audit had 11 moderate findings. After the esbuild fix, the full tree reports 7 moderate lint-tool findings (minimatch and affected TypeScript ESLint parents), with zero high/critical. Compatible `npm audit fix` did not resolve them; no forced lint-major downgrade was applied. See [the minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249). These glob-processing dependencies are not used by application request handlers. Final runtime audit results are recorded in `PROGRESS.md`.

ESLint 9 is retained for compatibility with the Next.js plugin chain; npm marks the major unsupported. Revisit when the plugins support ESLint 10. Re-run audits before releases; a clean runtime audit alone is not proof of application security.
