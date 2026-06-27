# FitFlow Implementation Notes

MVP build checklist, technical gotchas, and milestone definitions.

## MVP Milestones

### Milestone 0 — Foundation (This Init)

- [x] Monorepo scaffold (pnpm workspaces)
- [x] Documentation (`docs/`)
- [x] Prisma schema with core models
- [x] Express API bootstrap with error handling
- [x] Next.js frontend with i18n, TanStack Query, PWA config
- [x] BullMQ worker stubs
- [x] Docker Compose (PostgreSQL + Redis)

### Milestone 1 — Authentication

- [x] `POST /v1/auth/device` — full upsert logic
- [x] JWT access + refresh token issuance and rotation
- [x] `POST /v1/auth/refresh` endpoint
- [x] `POST /v1/auth/recover` — email OTP stub (SMS later)
- [x] Auth middleware on protected routes
- [x] Frontend: auto device registration on app load
- [x] Frontend: token refresh interceptor in API client
- [x] Rate limiting on auth endpoints (express-rate-limit)

### Milestone 2 — Profiles

- [x] `GET/PATCH /v1/profile` — read/update profile
- [x] Avatar upload (Cloudinary)
- [x] Coach profile with location fields (lat/lng + map picker on profile page)
- [x] Frontend profile page with form validation (shared Zod schemas + react-hook-form)

### Milestone 3 — Workouts

- [x] Coach CRUD: `POST/GET/PATCH/DELETE /v1/workouts`
- [x] Recurrence rule creation with RRule builder UI
- [x] Share code / QR generation for workout links
- [x] Worker: `expand-recurrence` processor (materialize 90 days)
- [x] Frontend: workout list, detail, create form

### Milestone 4 — Bookings

- [x] `POST /v1/bookings` — create with PENDING status
- [x] Coach approve/reject: `PATCH /v1/bookings/:id`
- [x] Client cancel: `PATCH /v1/bookings/:id/cancel`
- [x] Attendance marking: `PATCH /v1/bookings/:id/attend`
- [x] Booking history: `GET /v1/bookings?clientId=...`
- [x] Frontend: booking flow, status badges, history list
- [x] TanStack Query offline persistence for booking list

### Milestone 5 — Notifications

- [x] In-app notifications: `GET /v1/notifications`, `PATCH /v1/notifications/:id/read`
- [x] Worker: `send-notification` processor
- [x] Trigger notifications on booking status changes
- [x] Frontend: notification bell + list
- [x] Web Push setup (VAPID keys, service worker push handler) — foundation only; no production push delivery yet
- [ ] Firebase Cloud Messaging or OneSignal integration (choose one) — deferred

### Milestone 6 — Discovery

- [x] Coach search by location: `GET /v1/coaches?lat=&lng=&radius=`
- [x] Workout search: `GET /v1/workouts/search?lat=&lng=&q=`
- [x] Shared link access: `GET /v1/workouts/share/:code`
- [x] Coach subscription: `POST/DELETE /v1/subscriptions/:coachId`
- [x] Frontend: search page, map view (optional), QR scanner
- [x] Structured logging (pino)
- [x] Production deployment configs

---

## Technical Gotchas

### Next.js PWA (`@ducanh2912/next-pwa`)

```typescript
// next.config.ts
const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
});
```

- **Never enable SW in dev** — causes stale cache issues and HMR conflicts
- Service worker files land in `public/` after production build
- Test PWA with `pnpm build && pnpm start`, not `pnpm dev`
- Add `'use client'` components that interact with SW APIs
- iOS Safari PWA limitations: no push notifications until iOS 16.4+; test on real devices

### Push Notifications

Web Push requires:

1. **VAPID key pair** — generate with `web-push generate-vapid-keys`
2. **Service worker** `push` event listener
3. **User permission** prompt (must be triggered by user gesture)
4. **Backend** stores push subscription endpoint per device

Recommended path:

- **MVP:** In-app notifications only (polling via TanStack Query every 30s)
- **Phase 2:** Firebase Cloud Messaging (FCM) for cross-platform push
- **Alternative:** OneSignal SDK (simpler setup, vendor lock-in)

Do not implement push in Milestone 0. Stub the `send-notification` worker processor with a log statement.

### TanStack Query Offline Strategy

```typescript
// Milestone 4 — add to app-providers.tsx
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({ storage: window.localStorage });

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
});
```

**Cache priorities:**

| Query | staleTime | Persist |
|-------|-----------|---------|
| Workout list | 60s | Yes |
| Booking history | 30s | Yes |
| Profile | 5min | Yes |
| Notifications | 15s | No (always fresh) |

Use `networkMode: 'offlineFirst'` for workout and booking queries on mobile.

### BullMQ Job Patterns

**Recurrence expansion:**

```typescript
await recurrenceQueue.add(
  'expand',
  { workoutId },
  {
    jobId: `recurrence-${workoutId}`,  // idempotent — no colons (BullMQ)
    repeat: { pattern: '0 2 * * *' },   // nightly at 2 AM
  }
);
```

**Notification dispatch:**

```typescript
await notificationQueue.add(
  'send',
  { userId, type, payload },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  }
);
```

- Always use deterministic `jobId` for repeatable jobs
- Set `removeOnComplete: 100` to prevent Redis memory bloat
- Worker and API must share the same Redis URL

### next-intl App Router

- Middleware must run on all locale routes — exclude `/api`, `/_next`, static files
- Server Components use `getTranslations()`; Client Components use `useTranslations()`
- Never import messages JSON directly in components — always through next-intl hooks
- Default locale `uk` — ensure all keys exist in both `en.json` and `uk.json`

### Prisma

- Run `pnpm db:generate` after every schema change
- Use `@@map("snake_case")` for table names if team prefers SQL conventions (currently camelCase)
- JSONB fields typed as `Json` in Prisma — validate shape with Zod at API boundary
- Connection pooling: add PgBouncer or Prisma Accelerate before production scale

### Environment Variables

Copy `.env.example` to `.env` at monorepo root. Both `apps/api` and `apps/worker` read from root `.env` via dotenv or shell export.

Required for local dev:

```
DATABASE_URL=postgresql://fitflow:fitflow@localhost:5432/fitflow
REDIS_URL=redis://localhost:6379
JWT_SECRET=<min-32-chars>
API_PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Local Development Workflow

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Push schema to DB
pnpm db:push

# 4. Start all services
pnpm dev

# 5. Verify
curl http://localhost:4000/health
open http://localhost:3000/uk
```

## Code Conventions

- All API inputs validated with Zod schemas from `@fitflow/shared`
- HTTP errors use `AppError` class with explicit status codes
- Frontend API calls go through `src/lib/api-client.ts` (never raw fetch in components)
- Feature folders contain co-located hooks, components, and services
- No hardcoded user-facing strings — always i18n keys
- Mobile-first CSS: base styles for mobile, `md:` breakpoint for tablet+

## Out of Scope (Post-MVP)

- Payment processing
- Coach analytics dashboard
- Video workout content
- Multi-coach organizations/teams
- Native iOS/Android apps (PWA is the mobile strategy)
- PostGIS advanced geo queries
