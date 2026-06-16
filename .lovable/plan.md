## Audit results

**RLS / Data API — clean ✅**
- Only one public table: `early_signups`. RLS enabled. Two policies only:
  - `INSERT` (anon + authenticated) with email regex + length checks.
  - `SELECT` returns `false` for both anon and authenticated (locked last turn).
- No GRANTs to `anon`/`authenticated` for SELECT — Data API physically cannot read it. Verified via `pg_policies` + `information_schema.role_table_grants`.
- Admin reads happen only through `adminListSignups` server fn using `supabaseAdmin` (service role), gated by a timing-safe password compare.
- No other tables, no views, no functions exposed.

**Remaining risks (all are abuse / cost, not data leaks):**

1. **`early_signups` insert spam** — anonymous unlimited inserts. A bot can flood the table with junk emails. No rate-limit, no honeypot, no per-IP throttle, no uniqueness on `email`.
2. **`/api/generate-image` is open + unauthenticated** — anyone on the internet can hit it, burning `LOVABLE_API_KEY` credits. Also no `Origin` / `Referer` check, so other sites can embed it.
3. **`generatePosts` server fn is open + unauthenticated** — same cost-abuse risk as #2.
4. **Admin login has no brute-force throttle** — password is strong + timing-safe, but unlimited guesses are still allowed.
5. **Admin password stored in `sessionStorage`** — re-sent on every refresh. XSS on `/admin` would leak it. A short-lived signed token is safer than the raw password.
6. **No `robots`/security headers on `/api/*`** — minor.

## Plan

### A. Database — `early_signups` hardening (migration)
- Add `UNIQUE` index on `lower(email)` to stop duplicate spam.
- Add a `created_at` index for the rate-limit check.
- Add a lightweight per-IP/per-email throttle via a `BEFORE INSERT` trigger that rejects when the same email or same `inet` source inserts more than N rows / minute. Store source IP in a new nullable `ip inet` column (set from server side; never trusted from client).
- Keep policies as-is.

### B. Signup endpoint — move insert behind a server fn
- Replace direct `supabase.from('early_signups').insert(...)` in `src/routes/index.tsx` and `src/components/ExitIntentPopup.tsx` with a new `submitEarlySignup` server fn that:
  - Re-validates email + shop URL with Zod.
  - Reads client IP from request headers and writes it to `ip` (server-side only).
  - Catches unique-violation as a friendly "أنت مسجّل بالفعل" message (no enumeration leak — same response either way).
- Then `REVOKE INSERT ON public.early_signups FROM anon` so the table is no longer directly writable from the browser — the server fn (service role) is the only writer.

### C. Public AI endpoints — abuse protection
- Add a shared `rateLimit(key, limit, windowMs)` helper backed by a new `public.rate_limits` table (key text PK, count int, window_start timestamptz) with proper GRANTs and RLS denying all client access. Service-role only.
- Wrap `generatePosts` and `/api/generate-image` POST handlers:
  - Key = client IP (from `x-forwarded-for` / `cf-connecting-ip`) + endpoint name.
  - Limit example: 10 requests / 10 min per IP. Return 429 on overflow.
- Add `Origin` allowlist check on `/api/generate-image` (allow only this project's preview + published + custom domains, plus no-origin same-site). Reject cross-origin POSTs with 403.
- Set `X-Robots-Tag: noindex` on `/api/generate-image` responses.

### D. Admin endpoint — harden
- Add brute-force throttle on `adminListSignups` using the same `rate_limits` table: e.g. 5 wrong attempts / 15 min per IP → 429.
- Replace `sessionStorage` password persistence: on successful password check, issue a short-lived signed token (HMAC of `exp` using a new `ADMIN_SESSION_SECRET`, 30 min TTL). Client stores the token only. Subsequent calls send the token; server verifies HMAC + expiry instead of re-checking the password each time. Password is only ever sent on the initial login.

### E. Verification
- After build:
  - `psql` to confirm new index, trigger, and revoked INSERT grant.
  - Hit `/api/generate-image` from a foreign origin → expect 403.
  - Spam the same IP 15× → expect 429 from both AI endpoints.
  - Submit duplicate email → expect friendly success-equivalent response, only one row in DB.
  - Wrong admin password 6× → expect 429.

### Non-goals
- No changes to the UI/copy or the AI prompt logic.
- No new auth system for end users (the app has no user accounts; only the admin password).
- Custom captcha (hCaptcha/Turnstile) is intentionally NOT added unless you ask — it requires a third-party key and UI change.

### Open question
For section **C**, I'm defaulting to **10 requests / 10 min per IP** for the AI endpoints. Tell me if you want it stricter (e.g. 3/hour) or looser before I implement.
