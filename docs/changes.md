# FitFlow — Session Changes Log

Chronological record of work completed across development sessions, grouped by MVP milestone.  
For the live checklist and gotchas, see [`implementation-notes.md`](./implementation-notes.md).

**Last updated:** 2026-06-19 (M6 complete)

---

## Milestone 0 — Foundation

Monorepo scaffold and local dev stack.

| Area | What was done |
|------|----------------|
| **Monorepo** | pnpm workspaces: `apps/web`, `apps/api`, `apps/worker`, `packages/shared` |
| **Database** | Prisma schema with core models (User, Profile, Workout, WorkoutInstance, Booking, DeviceToken, RefreshToken, Notification) |
| **API** | Express bootstrap, Zod validation middleware, typed `AppError` handler, `/health` |
| **Web** | Next.js 15 App Router, MUI theme, TanStack Query, PWA config (disabled in dev) |
| **Worker** | BullMQ worker entrypoint, queue stubs |
| **Infra** | Docker Compose — PostgreSQL 16 + Redis 7 |
| **Docs** | `architecture-plan.md`, `database-design.md`, `implementation-notes.md` |

**Key paths:** `package.json`, `docker-compose.yml`, `apps/api/prisma/schema.prisma`, `apps/api/src/app.ts`, `apps/web/next.config.ts`

---

## Milestone 1 — Authentication

Full auth flow with cookie-based refresh and web session management.

### Implemented

| Area | What was done |
|------|----------------|
| **API** | `POST /v1/auth/device`, `/login`, `/register`, `/logout`, `/refresh`, `/recover/request`, `/recover`, `GET /v1/auth/me` |
| **Tokens** | JWT access tokens + rotating refresh tokens (hashed in DB); httpOnly cookies for both |
| **Middleware** | `authenticate` / `optionalAuth` on protected routes |
| **Rate limiting** | Credential endpoints (`login`, `register`, `device`) — 20 req / 15 min |
| **Web** | Login/register pages, device ID in localStorage, API client with 401 → refresh retry |
| **Web** | `AuthProvider` session bootstrap via cookie refresh → `/me` |
| **Web** | Next.js middleware guards for `/dashboard`, `/profile`, `/bookings` |
| **Clients API** | `GET/POST /v1/clients` — coach lists and creates clients with temp password |

**Key paths:**
- API: `apps/api/src/modules/auth/`, `apps/api/src/lib/jwt.ts`, `apps/api/src/lib/auth-cookies.ts`
- Web: `apps/web/src/features/auth/`, `apps/web/src/lib/api-client.ts`, `apps/web/src/middleware.ts`

### Bug fixes (this session)

| Issue | Fix |
|-------|-----|
| **401 on `/v1/auth/me` at startup** | `restoreSessionFromCookies()` sets access token before calling `/me`; skip re-bootstrap when session already exists |
| **429 on `/v1/auth/refresh`** | Refresh had shared the strict auth limiter (20/15 min). Moved to dedicated `refreshLimiter` (120/15 min); login/register/device keep strict limit |
| **500 on refresh race** | `deleteRefreshToken` changed to `deleteMany` (idempotent) — parallel refresh attempts no longer throw P2025 |
| **Stale session after refresh failure** | Failed refresh now clears httpOnly cookies server-side; client calls logout + redirects to `/login` |
| **No redirect on expired session** | `AuthProvider.handleAuthFailure()` clears state, clears cookies, `router.replace('/login')`; deduped to avoid loops |
| **Duplicate refresh paths** | `refreshSession()` and API client 401 handler now share exported `refreshAccessToken()` with single in-flight promise |

---

## Milestone 2 — Profiles

Coach/client profile CRUD with avatar and map-based location.

### Implemented

| Area | What was done |
|------|----------------|
| **API** | `GET/PATCH /v1/profile`, `POST /v1/profile/avatar/upload`, `POST /v1/profile/avatar` |
| **Validation** | Shared Zod schemas; location fields coach-only |
| **Avatar storage** | Cloudinary when configured; local fallback to `uploads/avatars/` served at `/uploads/avatars/...` |
| **Web** | Profile page, `ProfileForm` (react-hook-form + Zod), `CoachLocationMap` (react-leaflet, dynamic import) |
| **Web** | `useProfile()` TanStack Query hook |

**Key paths:**
- API: `apps/api/src/modules/profile/`, `apps/api/src/lib/avatar-storage.ts`
- Web: `apps/web/src/features/profile/`, `apps/web/src/app/profile/page.tsx`
- Shared: `packages/shared/src/schemas/profile.schema.ts`

### Bug fixes

| Issue | Fix |
|-------|-----|
| **Avatar upload 500 (`PayloadTooLargeError`)** | Express JSON body limit raised to 10 MB; 413 handler for oversized payloads |

---

## Milestone 3 — Workouts

Coach workout CRUD, recurrence, share links, and worker-driven instance expansion.

### Implemented

| Area | What was done |
|------|----------------|
| **API** | `POST/GET/PATCH/DELETE /v1/workouts`, public `GET /v1/workouts/share/:code` |
| **Recurrence** | `recurrencePreset` (none / daily / weekly) → RRule JSON via `buildRecurrenceRule()` |
| **Share codes** | nanoid alphanumeric codes; join link `/join/:code` |
| **Queue** | On create/update with recurrence → enqueue `recurrence-expand` job |
| **Worker** | `expand-recurrence.processor.ts` — RRule → `WorkoutInstance` upserts for 90-day horizon |
| **Web** | Workout list, create form, detail page, `RecurrencePresetBuilder`, `ShareCodePanel` (QR) |
| **Web** | Public join page with workout info + book button |
| **Nav** | Dashboard layout: Clients \| Workouts \| Bookings \| Profile |

**Key paths:**
- API: `apps/api/src/modules/workouts/`, `apps/api/src/lib/workout-jobs.ts`
- Worker: `apps/worker/src/processors/expand-recurrence.processor.ts`
- Web: `apps/web/src/features/workouts/`, `apps/web/src/app/dashboard/workouts/`, `apps/web/src/app/join/[code]/`
- Shared: `packages/shared/src/schemas/workout.schema.ts`, `packages/shared/src/lib/recurrence.ts`

### Bug fixes

| Issue | Fix |
|-------|-----|
| **POST `/v1/workouts` 500** | BullMQ rejects `:` in custom job IDs. Changed `recurrence:${workoutId}` → `recurrence-${workoutId}` |
| **Worker crash on Node 24** | `rrule` CJS/ESM interop — `import rrulePkg from 'rrule'; const { RRule } = rrulePkg` |
| **Orphan workouts after failed create** | Workout row committed before queue enqueue failed; delete orphans manually or recreate |

---

## Milestone 4 — Bookings

Full booking lifecycle with role guards and offline-friendly lists.

### Implemented

| Area | What was done |
|------|----------------|
| **API** | `POST /v1/bookings` (client, PENDING), `GET /v1/bookings` (paginated, role-filtered) |
| **API** | `PATCH /v1/bookings/:id` (coach approve/reject), `/cancel` (client), `/attend` (coach) |
| **Guards** | Capacity checks, duplicate booking prevention, past-session validation |
| **Web** | Client `/bookings`, coach `/dashboard/bookings`, `BookingList`, `BookingStatusChip` |
| **Web** | `BookSessionButton` on join page; booking summary on client dashboard |
| **Offline** | TanStack Query persist (localStorage) for `workouts` and `bookings` query keys in `app-providers.tsx` |

**Key paths:**
- API: `apps/api/src/modules/bookings/`
- Web: `apps/web/src/features/bookings/`, `apps/web/src/providers/app-providers.tsx`
- Shared: `packages/shared/src/schemas/booking.schema.ts`

---

## Cross-cutting changes

### UI convention (TrainSync port)

- MUI-based English UI (not next-intl/Tailwind for current pages)
- Route constants in `apps/web/src/consts/Pages.ts`
- Coach role surfaced as `legacyRole: 'trainer'` in auth user type for dashboard compatibility

### Shared package (`packages/shared`)

| Module | Contents |
|--------|----------|
| `schemas/auth.schema.ts` | Device, login, register, refresh, recover inputs |
| `schemas/profile.schema.ts` | Profile update + avatar schemas |
| `schemas/workout.schema.ts` | Create/update/list/detail/share responses |
| `schemas/booking.schema.ts` | Create, list, update, response schemas |
| `schemas/recurrence.schema.ts` | Recurrence preset + rule types |
| `lib/recurrence.ts` | `buildRecurrenceRule()` — UI preset → RRule JSON |
| `types/index.ts` | Shared enums and API response types |

### Seed data

`pnpm db:seed` creates:

| Entity | Value |
|--------|-------|
| Coach | `coach@fitflow.dev` (no password — use registered account for login) |
| Client | `client@fitflow.dev` |
| Workout | "Morning HIIT", share code **`DEMO2026`** |
| Instance | One scheduled instance |
| Booking | One PENDING booking |

**Path:** `apps/api/prisma/seed.ts`

---

## Dev / ops notes (from sessions)

| Topic | Notes |
|-------|-------|
| **Start stack** | `docker compose up -d` → `pnpm db:push` → `pnpm db:seed` (optional) → `pnpm dev` |
| **Worker required** | Recurring workouts need worker running for instance expansion |
| **Port conflicts** | `lsof -ti :3000,:4000 \| xargs kill -9` then `pnpm dev` |
| **Stale Next.js assets** | Kill old `next-server`, `rm -rf apps/web/.next`, restart `pnpm dev`, hard refresh browser |
| **Shell paste trap** | Do not paste comment lines with `#` together — run commands one at a time in zsh |
| **Cloudinary** | Optional in dev; avatar upload falls back to local storage |

---

## Milestone 5 — Notifications

In-app notification system with booking triggers and Web Push foundation (no production push delivery yet).

### Implemented

| Area | What was done |
|------|----------------|
| **Shared** | `notification.schema.ts`, `BOOKING_REQUEST` enum value |
| **DB** | `PushSubscription` model; `Notification` model unchanged |
| **API** | `GET /v1/notifications`, `GET /unread-count`, `PATCH /:id/read`, `PATCH /read-all` |
| **API** | Push foundation: `GET /push/vapid-public-key`, `POST/DELETE /push/subscribe` |
| **Worker** | `send-notification` persists `Notification` row; logs push stub if subscriptions exist |
| **Triggers** | Booking create → coach `BOOKING_REQUEST`; approve/reject → client; cancel → coach |
| **Web** | `NotificationBell` in dashboard layout + `AppHeader` on `/bookings` |
| **Web** | TanStack Query polling (30s refetch, 15s stale); not persisted to localStorage |
| **Web** | `push-sw.js` service worker stub; opt-in on profile + notification panel |
| **Env** | `VAPID_*` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in `.env.example` |

**Key paths:**
- API: `apps/api/src/modules/notifications/`, `apps/api/src/lib/notification-jobs.ts`
- Worker: `apps/worker/src/processors/send-notification.processor.ts`
- Web: `apps/web/src/features/notifications/`, `apps/web/public/push-sw.js`

### Deferred

- Actual `web-push` message delivery
- FCM / OneSignal integration
- Workout schedule/cancel notifications (`SCHEDULE_CHANGED`, `WORKOUT_CANCELED`)

---

## Milestone 6 — Discovery

Geo-based coach/workout discovery, client subscriptions, discover UI with map and QR scan, pino logging, and Docker production stack.

| Area | What was done |
|------|----------------|
| **Shared** | `discovery.schema.ts` — coach/workout search + response schemas; `geo.ts` — bounding box + haversine |
| **API** | `GET /v1/coaches` — bounding-box filter, haversine sort, optional `isSubscribed` for logged-in clients |
| **API** | `GET /v1/workouts/search` — public discovery (text + geo filters, next upcoming instance) |
| **API** | `GET/POST/DELETE /v1/subscriptions` — client follow/unfollow coaches |
| **Web** | `/discover` — tabs: Coaches nearby, Workouts, Following; optional map; geolocation with Kyiv fallback |
| **Web** | `/discover/scan` — html5-qrcode camera scan + manual share code entry |
| **Web** | Discover link in client nav (dashboard layout + AppHeader); middleware auth guard |
| **Logging** | pino + pino-http on API; pino on worker processors; `LOG_LEVEL` env |
| **Deploy** | Dockerfiles (api/web/worker), `docker-compose.prod.yml`, `.env.production.example`, `docs/deploy.md` |

**Verified (M3/M4, no changes):** `GET /v1/workouts/share/:code`, `/join/[code]`, `ShareCodePanel` QR generation.

**Key paths:**
- Shared: `packages/shared/src/schemas/discovery.schema.ts`, `packages/shared/src/lib/geo.ts`
- API: `apps/api/src/modules/coaches/`, `apps/api/src/modules/subscriptions/`, workout search in `workouts/`
- Web: `apps/web/src/features/discovery/`, `apps/web/src/app/discover/`
- Infra: `docker-compose.prod.yml`, `apps/*/Dockerfile`, `docs/deploy.md`

### Smoke test (M6)

1. Log in as client → `/discover` → see demo coach nearby (seed lat/lng)
2. Search workouts → find "Morning HIIT" → open join link
3. Follow coach → appears under **Following** tab
4. `/discover/scan` → enter `DEMO2026` manually → lands on join page
5. API logs JSON via pino; `docker compose -f docker-compose.prod.yml config` validates prod stack

---

## Not yet done (post-M6)

| Item | Status |
|------|--------|
| PostGIS / DB-level radius queries | Deferred |
| Full PWA production tuning | Deferred |
| FCM / OneSignal push delivery | Deferred (M5 foundation only) |
| Platform-specific deploy (Vercel, Railway) | Documented as future option in `docs/deploy.md` |

See [`implementation-notes.md`](./implementation-notes.md) for the full checklist.

---

## Smoke-test flow (manual)

1. Register or log in as coach
2. Create workout with weekly recurrence → verify instances appear (worker running)
3. Copy share link / open `/join/DEMO2026` (after seed)
4. Log in as client → book session from join page
5. Coach approves booking on `/dashboard/bookings` → client bell shows `BOOKING_APPROVED`
6. Coach marks attendance → instance becomes `COMPLETED`
7. Check notification bell (coach + client); mark read; optional push opt-in on profile
