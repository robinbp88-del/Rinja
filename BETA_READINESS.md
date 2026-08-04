# Rinja — private beta readiness

Audience: ~5–20 friend testers. Goal: stable, secure, fast, testable — not a public launch.

Status legend: **PASS** · **FAIL** · **NEEDS MANUAL TEST** · **IN PROGRESS**

---

## Fase 1 — Flow map (2026-08-04)

### What works

- Email + Google auth with persisted PWA session (`auth.ts`, `AuthProvider`, `requireAuth` client-only).
- Watch create paths: highlight → save, paste text, whole page (`highlight.tsx`, `setup.tsx`, `watches.ts`).
- Proxy + picker for static HTML selection (`/api/proxy`, `picker-inject.ts`).
- Supabase RLS on watches / notifications / push / preferences / analytics (migrations 001–009).
- Monitor engine with claim lease, atomic apply, health fields, notification `dedupe_key` (migration 005 + `engine.ts`).
- Dual triggers: GitHub Actions cron → `POST /api/check-watches` + in-app due checks.
- Compare / normalize (`compare.ts`); in-app alerts + optional Web Push.
- Admin gate server-validated (`admin.functions.ts`).
- Outbound SSRF guard: scheme/port/creds/private IP/DNS, timeout, size cap, redirect re-validation (`outbound-url.ts`).

### Uncertain

- Whether migrations 001–009 are applied on the live Supabase project (code falls back to weaker legacy paths if RPCs missing).
- Production secrets: `MONITOR_CRON_SECRET`, VAPID, optional Resend.
- Google OAuth redirect allowlist for production `/home`.
- How often real beta sites fail as `js_shell` / empty HTML.

### Critical issues

1. **Open `/api/proxy`** — SSRF mitigated, but unauthenticated egress abuse risk.
2. **Email half-wired** — server paths exist; Settings UI does not expose digest; default `none`. Treat as off.
3. **Cron depends on secrets + migration 005** — without them, monitoring degrades or 503s.
4. **`VITE_ADMIN_EMAILS`** can ship allowlist into the client bundle.
5. **No automated tests**; no `test` / `typecheck` scripts.
6. **Large PNG mascots** (~1.2 MB each) hurt mobile first load.
7. **No fetch retry** on transient failures (timeouts exist).
8. **Legacy apply path** does not update `consecutive_failures` / `last_success_at` / dedupe.

### Recommended fix order

1. Lock down proxy + timing-safe cron secret compare.
2. Harden error handling, retries, legacy apply health fields.
3. Confirm migrations + cron env; document ops; admin manual run.
4. Vitest + typecheck scripts; green lint/typecheck/test/build.
5. Compress images / lazy-load heavy assets.
6. Admin beta health overview.
7. Discrete BETA badge, report problem, clear fail/empty/loading states.

### Env vars (names only — never commit values)

| Name | Where | Purpose |
|------|--------|---------|
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Anon key (RLS) |
| `VITE_VAPID_PUBLIC_KEY` | Client | Web Push public key |
| `SUPABASE_URL` | Server | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service role — never `VITE_*` |
| `MONITOR_CRON_SECRET` | Server + GitHub secret | Auth for `/api/check-watches` |
| `MONITOR_URL` | GitHub Actions | Full URL to `POST` monitor endpoint |
| `ADMIN_EMAILS` | Server | Comma-separated admin emails |
| `VAPID_PRIVATE_KEY` | Server | Web Push private key |
| `VAPID_SUBJECT` | Server | `mailto:` or URL for VAPID |
| `RESEND_API_KEY` | Server | Optional email (off by default) |
| `EMAIL_FROM` | Server | Optional From address |
| `MONITOR_URL_DIGEST` | GitHub Actions | Optional daily digest endpoint |
| `LOVABLE_API_KEY` | Server | Optional AI/search |

Avoid: `VITE_ADMIN_EMAILS` (prefer `ADMIN_EMAILS` only).

---

## Checklist by phase

### Fase 1 — Kartlegging

| Requirement | Status |
|-------------|--------|
| Document end-to-end flow | PASS |
| Report works / uncertain / critical / fix order | PASS |

### Fase 2 — Stabilitet

| Requirement | Status |
|-------------|--------|
| No raw Supabase/fetch errors to users | IN PROGRESS |
| Understandable messages + server-side technical logs | IN PROGRESS |
| One failed page must not stop other watches | PASS (per-watch try/catch in engine) |
| Timeout on external requests | PASS (12s) |
| Limited retry with backoff | IN PROGRESS |
| Dedupe alerts for same change | PASS (if migration 005 applied) |
| Consecutive failures + last success | PASS (if migration 005; legacy path incomplete) |
| Mark watch problematic after repeated failures | IN PROGRESS |

### Fase 3 — Sikkerhet

| Requirement | Status |
|-------------|--------|
| RLS on user tables | PASS (migrations present; NEEDS MANUAL TEST on prod) |
| Users only own data | PASS (RLS + server admin) |
| Admin validated server-side | PASS |
| Service role never on client | PASS |
| `MONITOR_CRON_SECRET` required | PASS |
| Safe secret compare | IN PROGRESS |
| Block localhost / private / metadata | PASS |
| Redirect re-validation | PASS |
| Max response size | PASS (2 MB) |
| http(s) only | PASS |
| No secrets in logs | NEEDS MANUAL TEST |
| Proxy not open to anonymous abuse | FAIL → fix |

### Fase 4 — Monitorering

| Requirement | Status |
|-------------|--------|
| Cron URL documented | IN PROGRESS |
| Env vars documented | PASS (table above) |
| Only due watches checked | PASS (claim RPC / due filter) |
| No parallel double-check (claim/lease) | PASS (if 005 applied) |
| Next check time updated | PASS (`last_checked` + frequency) |
| Run summary logged | IN PROGRESS |
| No alert if normalized value unchanged | PASS (`valuesEqual`) |
| Safe admin manual test | IN PROGRESS |

### Fase 5 — Tester

| Requirement | Status |
|-------------|--------|
| Vitest configured | FAIL → fix |
| Core unit tests | FAIL → fix |
| `test` / `test:watch` / `typecheck` scripts | FAIL → fix |
| lint + typecheck + test + build green | IN PROGRESS |

### Fase 6 — Ytelse

| Requirement | Status |
|-------------|--------|
| Compress large PNGs | FAIL → fix |
| Lazy-load heavy assets / routes | IN PROGRESS |
| Document before/after sizes | IN PROGRESS |

### Fase 7 — Observability

| Requirement | Status |
|-------------|--------|
| Admin beta health overview | FAIL → fix |

### Fase 8 — Beta polish

| Requirement | Status |
|-------------|--------|
| Discrete BETA badge | FAIL → fix |
| Report a problem | FAIL → fix |
| Short beta message | FAIL → fix |
| Pause / delete watch | PASS (existing) |
| Clear failing watch status | IN PROGRESS |
| Empty + loading states | IN PROGRESS |

---

## Cron (production)

- **URL:** `POST https://<your-host>/api/check-watches`
- **Header:** `Authorization: Bearer <MONITOR_CRON_SECRET>`
- **Manual force (admin/local only):** `?force=1` — checks claimed watches regardless of due time
- **Schedule:** `.github/workflows/monitor.yml` every ~15 minutes (GitHub may delay)

---

## Manual test plan (mobile)

See end of this file after implementation phases complete.
