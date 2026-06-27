# Auto-deployment setup guide

Step-by-step guide to deploy FitFlow from GitHub `main` to a VPS.  
Estimated time: **30–60 minutes** (first time).

## What those GitHub checks are

After each push to `main`, two workflows run:

| Workflow | File | What it does | When it fails |
|----------|------|--------------|----------------|
| **CI / typecheck** | `.github/workflows/ci.yml` | Installs deps, builds shared, runs `pnpm typecheck` | Code/type errors |
| **Deploy main / deploy** | `.github/workflows/deploy-main.yml` | SSH to your server, `git pull`, `docker compose up --build` | Secrets missing, SSH/Docker/server issues |

**Deploy is skipped** until you add the `DEPLOY_HOST` secret (so you won't see a red deploy while setting up).

### Common CI error (fixed)

If you saw:

```
Multiple versions of pnpm specified:
  - version 9 in the GitHub Action config
  - version pnpm@9.15.4 in package.json packageManager
```

The workflow must **not** set `version:` in `pnpm/action-setup` — it reads `packageManager` from root `package.json` automatically.

---

## Architecture

```
GitHub (main) ──push──► GitHub Actions ──SSH──► Your VPS
                                              ├── docker: web :3000
                                              ├── docker: api :4000
                                              ├── docker: worker
                                              ├── docker: postgres
                                              └── docker: redis
```

---

## Part 1 — VPS (server)

### 1.1 Create a server

Use any provider (Hetzner, DigitalOcean, AWS, etc.):

- **OS:** Ubuntu 22.04 or 24.04
- **Size:** 2 GB RAM minimum (4 GB recommended for Docker builds)
- **Open ports:** 22 (SSH), 80/443 (HTTP/HTTPS later)

Note the **public IP** (e.g. `123.45.67.89`).

### 1.2 Install Docker on the server

SSH in as root or your user:

```bash
ssh root@YOUR_SERVER_IP
```

Install Docker + Compose plugin:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in so docker group applies
docker compose version
```

### 1.3 Create a deploy user (recommended)

```bash
adduser deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
```

---

## Part 2 — SSH key for GitHub Actions

On **your Mac** (not the server):

```bash
ssh-keygen -t ed25519 -C "fitflow-github-deploy" -f ~/.ssh/fitflow_deploy -N ""
```

This creates:

- Private key: `~/.ssh/fitflow_deploy` → goes into GitHub secret `DEPLOY_SSH_KEY`
- Public key: `~/.ssh/fitflow_deploy.pub` → goes on the server

Add the public key to the server:

```bash
ssh-copy-id -i ~/.ssh/fitflow_deploy.pub deploy@YOUR_SERVER_IP
```

Or manually paste into `/home/deploy/.ssh/authorized_keys` on the server.

Test login:

```bash
ssh -i ~/.ssh/fitflow_deploy deploy@YOUR_SERVER_IP
```

---

## Part 3 — Clone repo on the server

On the **server** as `deploy`:

```bash
ssh deploy@YOUR_SERVER_IP

# GitHub deploy key or HTTPS — SSH example:
ssh-keygen -t ed25519 -f ~/.ssh/github_fitflow -N ""
cat ~/.ssh/github_fitflow.pub
```

Add that public key in GitHub: **Repo → Settings → Deploy keys → Add** (read-only is enough).

Then:

```bash
git clone git@github.com:yedyharova22/fitflow.git
cd fitflow
```

Path will be `/home/deploy/fitflow` — use this for `DEPLOY_PATH`.

---

## Part 4 — Production environment on the server

```bash
cd ~/fitflow
cp .env.production.example .env
nano .env   # or vim
```

**Minimum values to set:**

```env
POSTGRES_PASSWORD=your-strong-db-password
JWT_SECRET=your-random-string-at-least-32-characters-long
CORS_ORIGIN=http://YOUR_SERVER_IP:3000
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:4000
API_PUBLIC_URL=http://YOUR_SERVER_IP:4000
```

Later, when you have a domain:

```env
CORS_ORIGIN=https://app.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### First manual deploy (verify before GitHub Actions)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Wait a few minutes for the build. Check:

```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost:4000/health
curl -I http://localhost:3000
```

Open in browser: `http://YOUR_SERVER_IP:3000`

Optional seed:

```bash
docker compose -f docker-compose.prod.yml exec api pnpm exec tsx prisma/seed.ts
```

---

## Part 5 — GitHub Actions secrets

In GitHub: **https://github.com/yedyharova22/fitflow/settings/secrets/actions**

Click **New repository secret** for each:

| Secret name | Value | Example |
|-------------|-------|---------|
| `DEPLOY_HOST` | Server IP or hostname | `123.45.67.89` |
| `DEPLOY_USER` | SSH user | `deploy` |
| `DEPLOY_SSH_KEY` | **Full private key** contents of `~/.ssh/fitflow_deploy` | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PATH` | Absolute path to repo on server | `/home/deploy/fitflow` |

Copy private key:

```bash
cat ~/.ssh/fitflow_deploy
```

Paste everything including `BEGIN` / `END` lines.

---

## Part 6 — Trigger auto-deploy

After secrets are saved, any push to `main` runs deploy.

Test with an empty commit:

```bash
git checkout main
git pull
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

Watch: **GitHub → Actions tab**

- **CI / typecheck** — should pass (green)
- **Deploy main / deploy** — should SSH and rebuild (green)

On the server after deploy:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api --tail 50
```

---

## Part 7 — HTTPS (optional, recommended)

Expose only 80/443 publicly; put **Caddy** or **nginx** in front:

- `app.yourdomain.com` → `localhost:3000`
- `api.yourdomain.com` → `localhost:4000`

Update `.env` on the server with HTTPS URLs and rebuild web (needs `NEXT_PUBLIC_API_URL` at build time):

```bash
cd ~/fitflow
nano .env
docker compose -f docker-compose.prod.yml up -d --build web
```

---

## Troubleshooting

### CI fails on typecheck

```bash
pnpm install && pnpm --filter @fitflow/shared build && pnpm typecheck
```

Fix locally, push again.

### Deploy fails: "connection refused" / SSH

- Check `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`
- Test: `ssh -i ~/.ssh/fitflow_deploy deploy@HOST`
- Server firewall must allow port 22 from GitHub Actions IPs (or temporarily open)

### Deploy fails: docker permission denied

```bash
sudo usermod -aG docker deploy
# re-login
```

### Deploy succeeds but site unreachable

- Open ports 3000 and 4000 in cloud firewall, or use reverse proxy on 80/443
- Check containers: `docker compose -f docker-compose.prod.yml ps`

### Web loads but API errors

- `NEXT_PUBLIC_API_URL` must match what the browser uses to reach the API
- `CORS_ORIGIN` must match the web URL exactly
- Rebuild web after changing `NEXT_PUBLIC_API_URL`

### Deploy workflow does not run

- Secret `DEPLOY_HOST` must be non-empty
- Workflow only runs on pushes to `main`

---

## Quick reference

| Item | Location |
|------|----------|
| Workflows | `.github/workflows/ci.yml`, `deploy-main.yml` |
| Production compose | `docker-compose.prod.yml` |
| Env template | `.env.production.example` |
| Manual deploy details | [deploy.md](./deploy.md) |
| Git / feature workflow | [git-workflow.md](./git-workflow.md) |

---

## Checklist

- [ ] VPS created with Docker installed
- [ ] `deploy` user in `docker` group
- [ ] SSH deploy key: Mac → GitHub secret + server `authorized_keys`
- [ ] Repo cloned on server at known path
- [ ] `.env` configured on server
- [ ] Manual `docker compose -f docker-compose.prod.yml up -d --build` works
- [ ] Four GitHub secrets set
- [ ] Push to `main` → both Actions green
- [ ] App opens in browser
