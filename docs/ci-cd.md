# CI/CD — automatic deployment from `main`

FitFlow is a monorepo (Next.js + Express + BullMQ worker + Postgres + Redis). The production stack is defined in [`docker-compose.prod.yml`](../docker-compose.prod.yml). See also [`deploy.md`](./deploy.md) for manual deploy steps.

## Recommended approach (MVP)

**GitHub Actions → SSH → your VPS → `docker compose up`**

Best fit because the worker and Redis must run alongside the API; a single VPS with Docker matches the existing compose file.

```mermaid
flowchart LR
  push[Push to main] --> gha[GitHub Actions]
  gha --> ssh[SSH to server]
  ssh --> pull[git pull]
  pull --> build[docker compose build]
  build --> up[docker compose up -d]
```

### One-time server setup

1. **Provision a VPS** (e.g. Hetzner, DigitalOcean, AWS EC2) with Docker + Docker Compose v2.
2. **Clone the repo** on the server:

   ```bash
   git clone git@github.com:yedyharova22/fitflow.git
   cd fitflow
   cp .env.production.example .env
   # edit .env with production secrets
   docker compose -f docker-compose.prod.yml up -d --build
   ```

3. **DNS** — point your domain(s) at the server; put nginx/Caddy in front for HTTPS (optional but recommended).

### GitHub secrets

In the repo: **Settings → Secrets and variables → Actions**, add:

| Secret | Example | Purpose |
|--------|---------|---------|
| `DEPLOY_HOST` | `123.45.67.89` | Server IP or hostname |
| `DEPLOY_USER` | `deploy` | SSH user |
| `DEPLOY_SSH_KEY` | private key PEM | Deploy key (add public key to server `~/.ssh/authorized_keys`) |
| `DEPLOY_PATH` | `/home/deploy/fitflow` | Repo path on server |

Optional: store production `.env` on the server only (never commit). The workflow only pulls code and rebuilds containers.

### Workflow file

[`.github/workflows/deploy-main.yml`](../.github/workflows/deploy-main.yml) runs on every push to `main`:

1. SSH into the server
2. `git pull origin main`
3. `docker compose -f docker-compose.prod.yml up -d --build`

Enable it by committing that file and configuring secrets.

### CI on pull requests (optional)

Add a separate workflow (e.g. `ci.yml`) on PRs:

```yaml
- run: pnpm install
- run: pnpm --filter @fitflow/shared build
- run: pnpm db:generate
- run: pnpm typecheck
```

No deploy on PRs — only on merge to `main`.

---

## Other options (later)

| Platform | Web | API + Worker | Notes |
|----------|-----|--------------|-------|
| **VPS + Docker Compose** | ✅ | ✅ | Recommended; one `main` deploy hook |
| **Railway / Render** | ✅ | ✅ | Connect GitHub repo; set root directory per service; need managed Postgres + Redis |
| **Vercel (web only)** | ✅ | ❌ | Web auto-deploy from `main`; API/worker must live elsewhere |
| **GitHub Container Registry** | Build images in Actions, pull on server | Good if you outgrow build-on-server |

For FitFlow today, **VPS + GitHub Actions on `main`** is the simplest path that matches [`deploy.md`](./deploy.md).

## Checklist before first auto-deploy

- [ ] Server has Docker and repo cloned
- [ ] `.env` on server with `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`
- [ ] GitHub Actions secrets configured
- [ ] Firewall: only 80/443 (and 22 for SSH) public; Postgres/Redis not exposed
- [ ] Smoke test from [`deploy.md`](./deploy.md) after first deploy
