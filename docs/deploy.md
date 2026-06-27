# Production deployment

FitFlow runs as a Docker Compose stack: PostgreSQL, Redis, API, BullMQ worker, and Next.js web.

## Prerequisites

- Docker and Docker Compose v2
- A `.env` file based on [`.env.production.example`](../.env.production.example)

## Quick start

1. Copy the production env template and set secrets:

   ```bash
   cp .env.production.example .env
   # Edit .env — set JWT_SECRET, POSTGRES_PASSWORD, CORS_ORIGIN, NEXT_PUBLIC_API_URL
   ```

2. Validate the compose file:

   ```bash
   docker compose -f docker-compose.prod.yml config
   ```

3. Build and start:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. (Optional) Seed demo data after first deploy:

   ```bash
   docker compose -f docker-compose.prod.yml exec api pnpm exec tsx prisma/seed.ts
   ```

The API container runs `prisma db push` on startup (applies the schema; no migration files required) before listening on port 4000.

## Services

| Service  | Port | Description                          |
|----------|------|--------------------------------------|
| `web`    | 3000 | Next.js (standalone output)          |
| `api`    | 4000 | Express REST API                     |
| `worker` | —    | BullMQ processors (recurrence, push) |
| `postgres` | 5432 (internal) | PostgreSQL 16              |
| `redis`  | 6379 (internal) | Redis 7 for job queues       |

## Environment notes

- **`JWT_SECRET`** — must be at least 32 characters.
- **`CORS_ORIGIN`** — must match the public web URL (e.g. `https://app.example.com`).
- **`NEXT_PUBLIC_API_URL`** — public API URL; passed as a build arg to the web image.
- **`LOG_LEVEL`** — `info` in production; API and worker emit JSON logs via pino.

## Smoke test (after seed)

1. Open the web URL and log in as a client.
2. Go to `/discover` — demo coach should appear nearby (Kyiv seed coordinates).
3. Search workouts — find "Morning HIIT" and open the join link.
4. Follow a coach — check the **Following** tab.
5. Visit `/discover/scan` — enter `DEMO2026` manually to reach the join page.
6. Confirm API logs are structured JSON: `docker compose -f docker-compose.prod.yml logs api`

## Future options

Split hosting (e.g. Vercel for web, Railway for API) is possible but adds complexity for the worker and Redis. Docker Compose is the recommended path for a single-server MVP deploy.
