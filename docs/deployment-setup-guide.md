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

**Hetzner tip:** If SSH with a password fails from your Mac, use the **Hetzner Cloud Console** (browser terminal) to log in as `root`. The Hetzner account password is not the same as the server root password — reset the root password in the Hetzner panel if needed.

### 1.3 Create a deploy user (recommended)

```bash
adduser deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
```

### 1.4 Open firewall ports (Hetzner / cloud)

For the first deploy without HTTPS, the browser must reach the app directly:

| Port | Purpose |
|------|---------|
| 22 | SSH (GitHub Actions deploy) |
| 3000 | Web (Next.js) |
| 4000 | API (Express) |

**Hetzner:** Cloud Console → your server → **Firewalls** (or **Networking**) → allow inbound TCP on 22, 3000, and 4000.

Later, with a reverse proxy, you can close 3000/4000 publicly and expose only 80/443.

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

### 2.1 Enable SSH from your Mac (step by step)

`ssh-copy-id` only works if you can already log in. Use the **Hetzner browser console** first, then Mac SSH will work without a password.

> **Filename trap:** SSH only reads `authorized_keys` (underscore `_`).  
> A file named `authorized-keys` (hyphen `-`) is **ignored** and will not work.

> **Hetzner console paste:** Copy-paste often breaks in the browser terminal. Prefer the **full reset script** in [2.2](#22-fresh-start--reset-all-ssh-keys) — one paste, key already embedded.

**Step 1 — On your Mac: confirm the key exists**

```bash
ls -la ~/.ssh/fitflow_deploy ~/.ssh/fitflow_deploy.pub
cat ~/.ssh/fitflow_deploy.pub
```

You should see one line starting with `ssh-ed25519`. Copy that entire line.

If the files are missing, create them:

```bash
ssh-keygen -t ed25519 -C "fitflow-github-deploy" -f ~/.ssh/fitflow_deploy -N ""
cat ~/.ssh/fitflow_deploy.pub
```

**Step 2 — Open Hetzner browser console**

1. Go to [console.hetzner.cloud](https://console.hetzner.cloud)
2. Click your project → your server (`ubuntu-4gb-fsn1-1`)
3. Click **Console** (top right) — a terminal opens in the browser
4. Log in as **`root`** (reset root password in Hetzner panel if needed)

**Step 3 — On the server (browser console): install your Mac's public key**

Replace `PASTE_YOUR_PUBLIC_KEY_LINE_HERE` with the line from Step 1:

```bash
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
```

Paste your public key as **one line**, save (`Ctrl+O`, Enter, `Ctrl+X`), then:

```bash
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

One-liner alternative (paste your real key instead of the example):

```bash
mkdir -p /home/deploy/.ssh && chmod 700 /home/deploy/.ssh
echo "ssh-ed25519 AAAA...your-key... fitflow-github-deploy" >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

**Step 4 — On your Mac: optional SSH config (so you don't need `-i` every time)**

If you already have `~/.ssh/config`, add a **blank line** before the new block (do not append directly after another `IdentityFile` line):

```bash
cat >> ~/.ssh/config << 'EOF'

Host fitflow
  HostName 46.224.141.71
  User deploy
  IdentityFile ~/.ssh/fitflow_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
```

The leading blank line in the heredoc is required so the new `Host fitflow` block does not merge with the previous line.

**Step 5 — On your Mac: test login**

```bash
ssh -i ~/.ssh/fitflow_deploy deploy@46.224.141.71
```

Or, if you added the config:

```bash
ssh fitflow
```

You should land on the server **without** a password prompt. Success looks like:

```text
deploy@ubuntu-4gb-fsn1-1:~$
```

**Step 6 — Deploy / update the app from Mac**

```bash
cd ~/fitflow
git pull origin main
rm -f docker-compose.override.yml
docker compose -f docker-compose.prod.yml up -d --build
curl http://localhost:4000/health
```

**If it still asks for a password**

- Wrong filename — must be `authorized_keys` with an **underscore**, not `authorized-keys`
- Wrong key on server — the line must match `cat ~/.ssh/fitflow_deploy.pub` exactly
- Wrong user — use `deploy`, not `root`
- Port 22 blocked — in Hetzner, allow inbound TCP 22 on the server firewall

### 2.2 Fresh start — reset all SSH keys

Use this when keys are mixed up, paste failed, or you have stray files like `authorized-keys`.

**A) On your Mac — delete old keys and create new ones**

```bash
rm -f ~/.ssh/fitflow_deploy ~/.ssh/fitflow_deploy.pub
ssh-keygen -t ed25519 -C "fitflow-deploy" -f ~/.ssh/fitflow_deploy -N ""
cat ~/.ssh/fitflow_deploy.pub
ssh-keygen -lf ~/.ssh/fitflow_deploy.pub
```

**B) On your Mac — encode the public key (paste-friendly for Hetzner console)**

```bash
cat ~/.ssh/fitflow_deploy.pub | base64
```

Copy the **single line** of base64 output.

**C) On the server — Hetzner console as `root`**

Paste this whole block, then replace `PASTE_BASE64_LINE_HERE` with the base64 from step B:

```bash
rm -rf /home/deploy/.ssh
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
echo "PASTE_BASE64_LINE_HERE" | base64 -d > /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chown deploy:deploy /home/deploy
chmod 755 /home/deploy
ssh-keygen -lf /home/deploy/.ssh/authorized_keys
ls -la /home/deploy/.ssh/
```

You must see exactly **one** file: `authorized_keys` (underscore).  
The fingerprint from the last command must match step A on your Mac.

**D) On your Mac — test**

```bash
ssh fitflow
```

**E) Update GitHub Actions secret**

GitHub → repo → **Settings → Secrets → Actions** → edit `DEPLOY_SSH_KEY`:

```bash
cat ~/.ssh/fitflow_deploy
```

Paste the **full private key** (including `BEGIN` / `END` lines). Auto-deploy uses this key.

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

Configure SSH so `git clone` uses that key:

```bash
cat >> ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/github_fitflow
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
```

Then clone:

```bash
git clone git@github.com:yedyharova22/fitflow.git
cd fitflow
```

Path will be `/home/deploy/fitflow` — use this for `DEPLOY_PATH`.

**Do not create `docker-compose.override.yml` on the server.** Production startup is handled by `docker-compose.prod.yml` and the API Dockerfile (see below).

---

## Part 4 — Production environment on the server

```bash
cd ~/fitflow
cp .env.production.example .env
nano .env   # or vim
```

**Minimum values to set** (replace with your server IP):

```env
POSTGRES_PASSWORD=your-strong-db-password
JWT_SECRET=your-random-string-at-least-32-characters-long
CORS_ORIGIN=http://YOUR_SERVER_IP:3000
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:4000
API_PUBLIC_URL=http://YOUR_SERVER_IP:4000
```

Example with Hetzner IP `46.224.141.71`:

```env
CORS_ORIGIN=http://46.224.141.71:3000
NEXT_PUBLIC_API_URL=http://46.224.141.71:4000
API_PUBLIC_URL=http://46.224.141.71:4000
```

Later, when you have a domain:

```env
CORS_ORIGIN=https://app.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_PUBLIC_URL=https://api.yourdomain.com
```

### How the stack starts

On `docker compose up`, five containers start:

| Service | Role |
|---------|------|
| `postgres` | Database |
| `redis` | Job queue (BullMQ) |
| `api` | REST API — **runs `prisma db push` on startup**, then listens on port 4000 |
| `worker` | Background jobs |
| `web` | Next.js frontend |

The API applies the database schema automatically (`prisma db push`). There are no Prisma migration files in this repo — you do **not** need to run migrations manually.

The first build can take **5–15 minutes** on a small VPS (2–4 GB RAM).

### First manual deploy (verify before GitHub Actions)

```bash
cd ~/fitflow
docker compose -f docker-compose.prod.yml up -d --build
```

Wait for the build to finish, then check:

```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost:4000/health
curl -I http://localhost:3000
```

**Healthy output looks like:**

- `postgres`, `redis`, `web`, `api`, `worker` all show **Up** (not `Restarting`)
- `curl http://localhost:4000/health` returns a JSON OK response
- Browser: `http://YOUR_SERVER_IP:3000` loads the login page

If `api` is **Restarting**, see [Troubleshooting → API container keeps restarting](#api-container-keeps-restarting-prisma-not-found).

Optional — seed demo users and workouts:

```bash
docker compose -f docker-compose.prod.yml exec api pnpm exec tsx prisma/seed.ts
```

Demo logins (after seed): see [deploy.md](./deploy.md#smoke-test-after-seed).

Open in browser: `http://YOUR_SERVER_IP:3000`

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
cd ~/fitflow
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs api --tail 50
curl http://localhost:4000/health
```

Each push to `main` runs `git reset --hard origin/main` and `docker compose -f docker-compose.prod.yml up -d --build` — no extra compose override file is used.

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
- Test from your Mac: `ssh -i ~/.ssh/fitflow_deploy deploy@YOUR_SERVER_IP`
- Server firewall must allow port 22 from the internet (GitHub Actions connects over SSH)
- If Mac SSH fails but Hetzner console works, use the console to fix `authorized_keys` for the `deploy` user

### Deploy fails: docker permission denied

```bash
sudo usermod -aG docker deploy
# log out and back in (or open a new SSH session)
```

### API container keeps restarting (`prisma` not found)

**Symptom:** `docker compose ps` shows `api` as `Restarting`. Logs show:

```
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "prisma" not found
```

**Cause:** The API container runs `pnpm exec prisma db push` before starting. The `prisma` CLI must be installed as a **production** dependency. Older images had it only in devDependencies, which are omitted when `NODE_ENV=production`.

**Fix:** Pull the latest `main` (includes the fix), remove any old workaround, rebuild:

```bash
cd ~/fitflow
git pull origin main
rm -f docker-compose.override.yml   # delete if you created one during debugging
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs api --tail 30
curl http://localhost:4000/health
```

You should see log lines about Prisma applying the schema, then the API listening on port 4000.

### API healthy but worker keeps restarting

Check worker logs:

```bash
docker compose -f docker-compose.prod.yml logs worker --tail 50
```

Usually resolves once `postgres`, `redis`, and `api` are up and the schema exists. Rebuild if needed:

```bash
docker compose -f docker-compose.prod.yml up -d --build worker
```

### Deploy succeeds but site unreachable

- Open ports **3000** and **4000** in your cloud firewall (Hetzner Firewalls / security groups)
- Check containers: `docker compose -f docker-compose.prod.yml ps`
- Test from the server first: `curl http://localhost:3000` and `curl http://localhost:4000/health`

### Web loads but API errors (CORS / network)

- `NEXT_PUBLIC_API_URL` must match what the **browser** uses to reach the API (e.g. `http://46.224.141.71:4000`, not `localhost`)
- `CORS_ORIGIN` must match the web URL **exactly** (including `http://` and port)
- Rebuild **web** after changing `NEXT_PUBLIC_API_URL` (it is baked in at build time):

  ```bash
  docker compose -f docker-compose.prod.yml up -d --build web
  ```

### Deploy workflow does not run

- Secret `DEPLOY_HOST` must be non-empty
- Workflow only runs on pushes to `main`

### Updating the server after a code fix

```bash
cd ~/fitflow
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

Or push to `main` and let GitHub Actions deploy automatically (once secrets are set).

---

## Quick reference

| Item | Location |
|------|----------|
| Workflows | `.github/workflows/ci.yml`, `deploy-main.yml` |
| Production compose | `docker-compose.prod.yml` |
| API startup (schema) | `apps/api/Dockerfile` — `prisma db push` then `node dist/index.js` |
| Env template | `.env.production.example` |
| Manual deploy details | [deploy.md](./deploy.md) |
| Git / feature workflow | [git-workflow.md](./git-workflow.md) |

---

## Checklist

- [ ] VPS created with Docker installed
- [ ] Firewall allows ports 22, 3000, 4000 (or 80/443 with reverse proxy)
- [ ] `deploy` user in `docker` group
- [ ] SSH deploy key: Mac → GitHub secret + server `authorized_keys`
- [ ] GitHub deploy key for `git clone` on server (`~/.ssh/config` for `github.com`)
- [ ] Repo cloned on server at `/home/deploy/fitflow`
- [ ] `.env` configured (IP-based URLs before domain)
- [ ] Manual `docker compose -f docker-compose.prod.yml up -d --build` works
- [ ] All five containers **Up**; `curl localhost:4000/health` OK
- [ ] (Optional) Demo data seeded
- [ ] Four GitHub secrets set (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`)
- [ ] Push to `main` → CI and Deploy Actions green
- [ ] App opens in browser at `http://YOUR_SERVER_IP:3000`
