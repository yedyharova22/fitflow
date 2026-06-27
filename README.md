# FitFlow

Mobile-first fitness management platform. Coaches manage workouts and clients; clients discover, book, and attend sessions.

## Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, TanStack Query, next-intl, PWA
- **Backend:** Express, TypeScript, Prisma, PostgreSQL, Zod
- **Jobs:** BullMQ + Redis
- **Monorepo:** pnpm workspaces

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Start PostgreSQL and Redis
docker compose up -d

# 3. Install dependencies
pnpm install

# 4. Push database schema
pnpm db:push

# 5. Start all services (web + api + worker)
pnpm dev
```

- Web: http://localhost:3000/uk
- API: http://localhost:4000/health

## Project Structure

```
fitflow/
├── apps/
│   ├── web/       # Next.js PWA frontend
│   ├── api/       # Express REST API
│   └── worker/    # BullMQ job processors
├── packages/
│   └── shared/    # Shared Zod schemas & types
└── docs/          # Architecture & design docs
```

## Documentation

- [Architecture Plan](./docs/architecture-plan.md)
- [Database Design](./docs/database-design.md)
- [Implementation Notes](./docs/implementation-notes.md)
- [Git workflow](./docs/git-workflow.md) — feature branches + per-feature change logs
- [Feature implementation logs](./docs/features-implementation/README.md)
- [CI/CD & auto-deploy from main](./docs/ci-cd.md)
- [**Auto-deployment setup guide (start here)**](./docs/deployment-setup-guide.md)
- [Production deploy (manual)](./docs/deploy.md)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web, api, and worker concurrently |
| `pnpm dev:web` | Start Next.js dev server only |
| `pnpm dev:api` | Start Express API only |
| `pnpm dev:worker` | Start BullMQ worker only |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm build` | Build all packages |
