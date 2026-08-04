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

### Uncertain / manual

- Whether migrations 001–009 are applied on the live Supabase project.
- Production secrets: `MONITOR_CRON_SECRET`, VAPID, optional Resend.
- Google OAuth redirect allowlist for production `/home`.

### Critical issues addressed in later phases

1. Open `/api/proxy` → ticket + cookie auth (**PASS** code; **NEEDS MANUAL TEST**).
2. Email half-wired → still off by default (**PASS** as documented off).
3. Cron / migration 005 → documented; legacy path improved.
4. `VITE_ADMIN_EMAILS` removed from allowlist reader (**PASS** — use `ADMIN_EMAILS` only).
5. Automated tests + scripts (**PASS**).
6. Large PNGs → WebP (**PASS**).
7. Fetch retry with backoff (**PASS**).
8. Legacy apply health fields (**PASS**).

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
| No raw Supabase/fetch errors to users | PASS |
| Understandable messages + server-side technical logs | PASS |
| One failed page must not stop other watches | PASS |
| Timeout on external requests | PASS (12s) |
| Limited retry with backoff | PASS |
| Dedupe alerts for same change | PASS (migration 005 + legacy) |
| Consecutive failures + last success | PASS |
| Mark watch problematic after repeated failures | PASS (badge Unstable ≥3) |

### Fase 3 — Sikkerhet

| Requirement | Status |
|-------------|--------|
| RLS on user tables | PASS (migrations; NEEDS MANUAL TEST on prod) |
| Users only own data | PASS |
| Admin validated server-side | PASS |
| Service role never on client | PASS |
| `MONITOR_CRON_SECRET` required | PASS |
| Safe secret compare | PASS (`timingSafeEqual`) |
| Block localhost / private / metadata | PASS |
| Redirect re-validation | PASS |
| Max response size | PASS (2 MB) |
| http(s) only | PASS |
| No secrets in logs | PASS (code review; NEEDS MANUAL TEST) |
| Proxy not open to anonymous abuse | PASS (ticket + HttpOnly cookie) |

### Fase 4 — Monitorering

| Requirement | Status |
|-------------|--------|
| Cron URL documented | PASS (below) |
| Env vars documented | PASS |
| Only due watches checked | PASS |
| No parallel double-check (claim/lease) | PASS (if 005 applied) |
| Next check time updated | PASS |
| Run summary logged | PASS (`monitor_run` JSON log) |
| No alert if normalized value unchanged | PASS |
| Safe admin manual test | PASS (Admin → Run due / Force) |

### Fase 5 — Tester

| Requirement | Status |
|-------------|--------|
| Vitest configured | PASS |
| Core unit tests | PASS (25 tests) |
| `test` / `test:watch` / `typecheck` scripts | PASS |
| lint + typecheck + test + build green | NEEDS MANUAL TEST (verify after deploy) |

### Fase 6 — Ytelse

| Requirement | Status |
|-------------|--------|
| Compress large PNGs | PASS |
| Lazy-load heavy assets / routes | PASS (per-variant WebP import) |
| Document before/after sizes | PASS (below) |

**Mascot assets (before → after WebP):**

| File | Before | After |
|------|--------|-------|
| binoculars | 1162 KB | 26 KB |
| rinja-guard | 1187 KB | 26 KB |
| rinja-laptop | 1266 KB | 41 KB |
| rinja-notify | 1213 KB | 31 KB |
| rinja-relax | 1458 KB | 68 KB |
| rinja-secure | 1245 KB | 40 KB |
| rinja | 1193 KB | 34 KB |
| **Total** | **~8.7 MB** | **~266 KB** |

### Fase 7 — Observability

| Requirement | Status |
|-------------|--------|
| Admin beta health overview | PASS |

### Fase 8 — Beta polish

| Requirement | Status |
|-------------|--------|
| Discrete BETA badge | PASS |
| Report a problem | PASS (Profile) |
| Short beta message | PASS |
| Pause / delete watch | PASS |
| Clear failing watch status | PASS |
| Empty + loading states | PASS (existing + improved errors) |

---

## Cron (production)

- **URL:** `POST https://rinja.vercel.app/api/check-watches` (or your host)
- **Header:** `Authorization: Bearer <MONITOR_CRON_SECRET>`
- **Manual force (admin/local only):** `?force=1` or Admin → Force run
- **Schedule:** `.github/workflows/monitor.yml` every ~15 minutes

### Env vars (names only — never commit values)

| Name | Where | Purpose |
|------|--------|---------|
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Anon key (RLS) |
| `VITE_VAPID_PUBLIC_KEY` | Client | Web Push public key |
| `SUPABASE_URL` | Server | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service role — never `VITE_*` |
| `MONITOR_CRON_SECRET` | Server + GitHub | Auth for monitor + proxy tickets fallback |
| `MONITOR_URL` | GitHub Actions | Full URL to `POST` monitor endpoint |
| `ADMIN_EMAILS` | Server | Comma-separated admin emails |
| `PROXY_TICKET_SECRET` | Server (optional) | Prefer dedicated secret for proxy tickets |
| `VAPID_PRIVATE_KEY` | Server | Web Push private key |
| `VAPID_SUBJECT` | Server | `mailto:` or URL for VAPID |
| `RESEND_API_KEY` / `EMAIL_FROM` | Server | Optional email (off by default) |

Avoid: `VITE_ADMIN_EMAILS`.

---

## Manual test plan (mobile)

1. Install / open https://rinja.vercel.app as PWA (Add to Home Screen).
2. Sign in with Google and with email once each.
3. Paste a simple static page URL → Highlight → select text → save.
4. Confirm watch appears on Home with status Watching / Pending.
5. Open watch detail → Pause → Resume → Delete (confirm dialog).
6. Create a paste-text watch and a whole-page watch.
7. Enable push in Settings; leave app; trigger a known HTML change; confirm alert + push.
8. Confirm whitespace-only change does **not** alert.
9. Open a JS-heavy SPA; expect Issue / Unstable after fails — watch not deleted.
10. Profile → Report a problem → send a short note.
11. As admin: `/admin` → see health stats → Run due checks.
12. Confirm unauthenticated `GET /api/proxy?url=https://example.com` returns 401.
13. Confirm cron (or Force run) advances `last_checked` without duplicate alerts.

### Pre-flight (you / ops)

- [ ] Supabase migrations 001–009 applied
- [ ] `ADMIN_EMAILS` set on Vercel (not `VITE_`)
- [ ] GitHub secrets `MONITOR_URL` + `MONITOR_CRON_SECRET`
- [ ] VAPID keys set if push is expected
