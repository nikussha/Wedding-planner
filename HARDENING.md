# Hardening Pass — Problems, Solutions & Rationale

This document records a fix + hardening pass across the three apps
(`wedding-planner-api`, `wedding-planner-app`, `wedding-planner-admin`). For each
item: **what was wrong**, **why it mattered**, and **what changed** (with rationale).

Verified: `nest build` (API), `ng build` (admin), `ng build` (public app) all succeed.

---

## Part 1 — Photo bug (the original report)

**Symptom:** Visiting `/photos` in the admin panel showed broken images; e.g.
`http://localhost:4201/uploads/sample-1.jpg` returned 404.

**Root cause:** The seed inserted `Photo` rows pointing at `/uploads/sample-1.jpg`
and `sample-2.jpg`, but **those files were never on disk**, and `uploads/` is
git-ignored (correctly — it's user media). So the DB referenced files that didn't
exist. The proxy, static serving, and URL construction were all correct; only the
seed data was inconsistent with the filesystem.

**Fix:**
- Added tracked placeholder images at `wedding-planner-api/prisma/seed-assets/sample-1.png`
  and `sample-2.png`. (Switched the format to **PNG** because no JPEG tooling
  (sharp/ImageMagick/Python) was available locally; PNG can be generated with
  pure Node via `zlib`.)
- `prisma/seed.ts`: added `ensureUploadExists()` to copy the tracked assets into
  `uploads/` on every seed run (**self-healing** across fresh clones), switched the
  sample URLs to `.png`, and added a one-time `deleteMany` to purge the legacy
  broken `.jpg` rows.
- `photos.component` (admin): `<img>` now has an `(error)` handler that swaps a
  broken image for an inline "image unavailable" SVG placeholder, plus
  `loading="lazy"`. Future disk/DB drift is now visible instead of a broken icon.

**Files:** `prisma/seed.ts`, `prisma/seed-assets/*`,
`wedding-planner-admin/src/app/features/photos/photos.component.{ts,html,scss}`

---

## Part 2 — Security

### S1. Open redirect on login/register (public app)
- **Problem:** Post-login navigation used `navigateByUrl(redirect)` where `redirect`
  came straight from the `?redirect=` query param.
- **Why:** `navigateByUrl('//evil.com')` sends a just-authenticated user offsite —
  a phishing vector because the link lives on your trusted domain.
- **Fix:** New `safeInternalRedirect()` util only allows paths beginning with a
  single `/` (rejects `//host`, `/\host`, absolute URLs), defaulting to `/`. Applied
  in both `login.component.ts` and `register.component.ts`.
- **Files:** `wedding-planner-app/src/app/core/utils/safe-redirect.util.ts`, auth components.

### S2. Unvalidated route-param IDs
- **Problem:** `@Param('id')` values went straight to Prisma with no validation.
- **Why:** Malformed IDs produced inconsistent DB-layer errors instead of a clean 400.
- **Fix:** New `ParseCuidPipe` validates the CUID shape and returns 400 on junk.
  **Note:** the built-in `ParseUUIDPipe` was deliberately NOT used — these IDs are
  **CUIDs** (`@default(cuid())`), not UUIDs, so `ParseUUIDPipe` would reject valid IDs.
  Applied to `:id` params in photos, blog, bookings, users (blog's `:slug` left as-is).
- **Files:** `src/common/pipes/parse-cuid.pipe.ts`, the four controllers.

### S3. No env/secret validation at boot
- **Problem:** Missing env vars (JWT secrets, CORS URLs) silently resolved to `undefined`.
- **Why:** A missing `JWT_ACCESS_SECRET` weakens token signing; missing CORS URLs
  produce `origin: [undefined, undefined]` that silently blocks the browser apps.
  Failures appeared later as confusing runtime errors.
- **Fix:** `validateEnv()` (class-validator schema) wired into `ConfigModule.forRoot({ validate })`
  — the app now **fails fast at boot** with a clear message if required vars are missing.
- **Files:** `src/config/env.validation.ts`, `src/app.module.ts`.

### S4. File-deletion path hardening
- **Problem:** Photo delete built a path via `join(process.cwd(), photo.url)`.
- **Why:** Not exploitable today (`photo.url` is server-generated as `/uploads/<uuid>`),
  but a future code path that lets `url` be edited could escape the uploads folder.
- **Fix:** Now resolves strictly as `join(process.cwd(), 'uploads', basename(photo.url))`.
  Defense-in-depth, not a live-vuln fix.
- **Files:** `src/content/photos/photos.service.ts`.

### S5. No rate limiting on auth
- **Problem:** `/auth/login` and `/auth/register` had no throttling.
- **Why:** Enables password brute-forcing / credential stuffing.
- **Fix:** Added `@nestjs/throttler` — global 100 req/min per IP, with auth endpoints
  tightened to 10/min via `@Throttle`. `ThrottlerGuard` registered as the first `APP_GUARD`.
- **Files:** `src/app.module.ts`, `src/auth/auth.controller.ts`, `package.json`.

### S6. Cookie `sameSite` (flagged, not changed)
- `sameSite: 'lax'` is a reasonable default; switching to `strict` can break legitimate
  cross-site navigation into the app. Left as a deliberate trade-off, noted for review.

---

## Part 3 — Correctness

### C1. `submitting` flag never reset on success
- **Problem:** On successful login/register, the success branch navigated away without
  resetting `submitting`. If navigation was blocked (guard/redirect), the button stayed
  spinning forever.
- **Fix:** Wrapped the auth calls in `finalize(() => submitting.set(false))` so the flag
  resets on every path. Applied in admin login + public app login/register.

### C2. Memory leaks from unsubscribed observables
- **Problem:** `valueChanges` subscriptions in the blog form (and content subscriptions
  in home) were never torn down. `valueChanges` never completes, so repeated visits
  accumulate dead subscribers and duplicate side effects (e.g. slug auto-fill firing twice).
- **Fix:** `takeUntilDestroyed(destroyRef)` on those subscriptions.
- **Files:** admin `blog-form.component.ts`, public `home.component.ts`.

### C3. Silent failures / stuck UI state across admin actions
- **Problem:** Many admin actions used `.subscribe(next)` with no error handler, so a
  failed request left loaders / per-row spinners (`loading`, `updatingId`, `savingId`)
  stuck on forever and gave the user no feedback.
- **Fix:** Added error callbacks that reset state. The user-facing error message now
  comes automatically from the new error interceptor (see F1). Photo reorder reloads
  from the server on failure to resync optimistic order.
- **Files:** admin `blog-list`, `dashboard`, `bookings`, `photos`, `content`, `users`.

---

## Part 4 — Frontend

### F1. Global HTTP error interceptor + toasts (admin)
- **Problem:** Errors were handled ad-hoc or not at all.
- **Fix:** New `NotificationService` (signal-based toasts) + `NotificationComponent`
  (toast outlet in the app shell) + `errorInterceptor` that surfaces failed requests as
  a toast and re-throws so components can still react. 401s are skipped (handled by the
  auth flow; avoids spamming on the unauthenticated `auth/me` probe).
- **Scope note:** Kept **admin-only**. The public app is SSR (a `setTimeout`-based toast
  service is risky server-side) and its components already handle errors locally
  (login, register, home, blog-list). Documented rather than forced.
- **Files:** admin `core/services/notification.service.ts`,
  `core/interceptors/error.interceptor.ts`, `layout/notification/*`, `app.config.ts`,
  `app.component.{ts,html}`.

### F2. Loading / empty / error states
- **Problem:** Public blog list showed a blank page while loading and an identical
  "no posts" message on error.
- **Fix:** Added `loading`/`error` signals and distinct template branches (loading /
  error / empty / list). Admin content/list pages already had loading; their error
  paths were fixed under C3.
- **Files:** public `blog-list.component.{ts,html}`.

### F3. `currentUserId` captured once (admin users)
- **Problem:** `currentUserId = authService.user()?.id` was evaluated once at construction,
  going stale if the auth user changed — the "this is you, can't change own role" guard
  could misfire.
- **Fix:** Converted to `computed(() => authService.user()?.id)`; template calls it as
  `currentUserId()`. (Also added the missing C3 error handlers here.)

### F4. Hardcoded SSR base URL (reviewed, no change)
- The public app's `api-base-url.interceptor.ts` already falls back to
  `process.env['API_URL']` and only uses `http://localhost:3000` as an SSR **dev default**.
  SSR genuinely needs an absolute URL, and it's already env-overridable — so this is
  correct as-is.

### F5. Lazy images (already in place)
- Public gallery and blog list already use `loading="lazy"`; admin gallery got it in
  Part 1. The blog-detail cover image is an above-the-fold hero, so eager loading is
  correct there.

---

## Part 6 — Performance

### P2. Dashboard fetched full tables just to count
- **Problem:** The admin dashboard `forkJoin`'d full users/bookings/posts lists only to
  display counts — transferring whole tables to compute a number.
- **Fix:** New admin-only `GET /api/stats` endpoint returns counts via Prisma `count()`
  in a single `$transaction`. Dashboard now makes one lightweight call.
- **Files:** `src/stats/*` (module/controller/service), admin
  `core/services/stats.service.ts`, `dashboard.component.ts`.

### P3. Blog author N+1 (verified — not an issue)
- Checked: the blog service never includes the `author` relation and no template renders
  an author. There is **no N+1**; adding `include: { author: true }` would be wasted work.
  No change made.

### P1. Pagination (deliberately deferred)
- **Problem:** List endpoints (bookings/blog/users/photos) use unbounded `findMany`.
- **Decision:** Deferred. Real pagination needs coordinated `skip`/`take` on the API
  **and** paging UI across multiple frontend lists — that's feature work, not hardening,
  and current data volumes are tiny. **Recommended next step**, tracked below.

---

## Part 5 — Architecture (documented as tech-debt, not changed)

Chosen approach: **document, don't refactor now** (lowest risk, no functional gain).

### A1. Duplicated `AuthService` + models across the two Angular apps
- The admin and public `auth.service.ts` are near-identical (public adds `register()`),
  and `User`/`BlogPost`/`Photo`/`Booking`/`Content` models are defined separately in each.
- **Risk:** copies drift apart when one side changes a field.

### A2. Duplicated `http-error.util.ts`
- Byte-identical file in both Angular apps.

### Recommended fix (own task, green build required)
Extract a single source of truth consumed by all projects. Options, lightest → heaviest:
1. **pnpm/npm workspace + one shared package** — pragmatic for 3 projects; kills the
   duplication with minimal tooling.
2. **Nx workspace** (`apps/api`, `apps/admin`, `apps/web`, `libs/shared-*`) — best
   long-term if the repo keeps growing: native Angular + NestJS plugins handle the build
   wiring, plus caching and `affected` builds. The NestJS API makes this layout natural.
   Heavier migration; do it as a dedicated task.

**Recommendation:** if growth is expected, migrate to **Nx**; otherwise a **pnpm
workspace + shared package** is enough. Either way, not a side-change.

---

## Outstanding / recommended next steps
- [ ] Pagination on list endpoints + frontend paging (P1).
- [ ] De-duplicate shared frontend code via workspace/Nx (A1, A2).
- [ ] Decide on `sameSite: 'strict'` for auth cookies (S6).
- [ ] Replace placeholder sample images with real photos when available.
