# Deployment Guide — Neon + Oracle ARM VM + Vercel
# Smart Ride Sharing System

This repo is prepared for:

| Layer | Platform |
|-------|----------|
| Database | **Neon** (PostgreSQL) |
| Backend | **Oracle Cloud Always Free ARM VM** (Docker Compose) |
| Frontend | **Vercel** |

I (the agent) prepared Dockerfiles, `docker-compose.yml`, nginx, and env templates.
**You must complete the cloud-console steps below** (accounts, Neon DBs, VM, Vercel).

---

## Architecture

```
Browser → Vercel (React)
              │
              ├─ REST  → http://ORACLE_IP/api/  → nginx → API Gateway → microservices
              └─ WS    → http://ORACLE_IP/ws    → nginx → ride-service
                              │
                         Neon Postgres
                         (user_db, ride_db, payment_db)
```

---

## PART A — What YOU do (required)

### 1) Neon (database) — ~10 minutes

1. Go to https://console.neon.tech and sign up / log in.
2. Create a project (region close to you or to Oracle).
3. In the Neon SQL Editor or Databases UI, create **three** databases:
   - `user_db`
   - `ride_db`
   - `payment_db`
4. Open **Connection details** and copy:
   - Host (e.g. `ep-xxxx.ap-southeast-1.aws.neon.tech`)
   - User (often `neondb_owner`)
   - Password
5. Build JDBC URLs like:

```text
jdbc:postgresql://HOST/user_db?sslmode=require
jdbc:postgresql://HOST/ride_db?sslmode=require
jdbc:postgresql://HOST/payment_db?sslmode=require
```

Keep these for the `.env` file on the VM.

---

### 2) Oracle Cloud Always Free ARM VM — ~20–30 minutes

1. Sign up: https://www.oracle.com/cloud/free/
2. **Compute → Instances → Create instance**
   - Image: **Ubuntu 22.04** (ARM)
   - Shape: **VM.Standard.A1.Flex** (Ampere)
   - Use as much free ARM capacity as allowed (e.g. 2–4 OCPU, 12–24 GB)
   - Add your **SSH public key**
3. Create instance → note **Public IP**
4. **Networking → VCN → Subnet → Security List** (or NSG): add Ingress rules:
   - TCP **22** (SSH) — ideally only your IP
   - TCP **80** (HTTP / nginx)
   - (Optional while testing) TCP **8080**, **8082**, **8761**
5. SSH in:

```bash
ssh -i your-key.pem ubuntu@YOUR_PUBLIC_IP
```

6. Install Docker (script from repo after clone, or):

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out and SSH back in
```

Or after cloning:

```bash
chmod +x deploy/oracle-setup.sh
./deploy/oracle-setup.sh
# then log out / SSH again
```

7. Clone and configure:

```bash
git clone https://github.com/ManikantaReddi2273/Ride_share.git
cd Ride_share
cp deploy/env.example .env
nano .env   # paste Neon URLs, JWT, mail, Razorpay, CORS
```

8. **CORS_ALLOWED_ORIGINS**: first you can use `*` temporarily is NOT supported with credentials — leave a placeholder, then update after Vercel gives you a URL:

```env
CORS_ALLOWED_ORIGINS=https://YOUR_APP.vercel.app,http://localhost:5173
```

9. Build and start (first build takes a long time on ARM):

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
```

10. Smoke test from your PC:

```text
http://YOUR_PUBLIC_IP/health
http://YOUR_PUBLIC_IP:8761          (Eureka — lock down later)
http://YOUR_PUBLIC_IP/api/users/admin/health   (may need auth)
```

Try register/login via Postman against `http://YOUR_PUBLIC_IP/api/users/register`

---

### 3) Vercel (frontend) — ~10 minutes

1. Go to https://vercel.com and sign in with GitHub.
2. **Add New Project** → import `ManikantaReddi2273/Ride_share`.
3. Set **Root Directory** to: `fronted_ride_share`
4. Framework: Vite (auto).
5. **Environment Variables**:

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `http://YOUR_ORACLE_PUBLIC_IP/api` |
| `VITE_WS_URL` | `http://YOUR_ORACLE_PUBLIC_IP/ws` |
| `VITE_STORAGE_SECRET` | any long random string |

6. Deploy → copy the URL, e.g. `https://ride-share-xxx.vercel.app`
7. Go back to Oracle VM `.env` and set:

```env
CORS_ALLOWED_ORIGINS=https://ride-share-xxx.vercel.app,http://localhost:5173
```

8. Restart gateway + ride (CORS / WebSocket origins):

```bash
docker compose up -d --force-recreate api-gateway-service ride-service nginx
```

9. Redeploy Vercel if you changed env vars (Deployments → Redeploy).

10. Open the Vercel URL and test: register → login → search/post ride.

---

## PART B — What was prepared in this repo (already done)

- `Dockerfile` in each backend service
- `docker-compose.yml` (Eureka, Gateway, User, Ride, Payment, Nginx)
- `deploy/nginx.conf` (`/api` + `/ws`)
- `deploy/env.example`
- `deploy/oracle-setup.sh`
- `fronted_ride_share/vercel.json`
- `fronted_ride_share/.env.example`
- Spring `application.properties` read Neon/JWT/CORS/mail from environment
- `POSTGRES_AUTO_CREATE=false` for Neon (you create DBs in Neon UI)

---

## PART C — Useful commands (on the VM)

```bash
docker compose ps
docker compose logs -f user-service
docker compose restart api-gateway-service
docker compose down
docker compose up -d --build
```

---

## PART D — Later improvements (optional, still free)

1. Point a domain to the VM IP + Let's Encrypt HTTPS (Certbot).
2. Close public access to 8761 / 8081 / 8084.
3. Restrict SSH to your IP only.
4. Rotate JWT / DB / Razorpay secrets (they were in git history before).

---

## Checklist (print this)

- [ ] Neon project + `user_db` / `ride_db` / `payment_db`
- [ ] Oracle ARM VM + SSH + security list (22, 80)
- [ ] Docker installed on VM
- [ ] Repo cloned + `.env` filled from `deploy/env.example`
- [ ] `docker compose up -d --build` healthy
- [ ] Vercel project (`fronted_ride_share` root) + env vars
- [ ] CORS updated with Vercel URL + services recreated
- [ ] End-to-end test in browser

---

## If something fails

| Symptom | Check |
|---------|--------|
| Services crash on DB | Neon URL `sslmode=require`, DB names exist, password correct |
| CORS errors in browser | `CORS_ALLOWED_ORIGINS` exact Vercel URL (https, no trailing slash) |
| WebSocket fails | Port 80 open; `VITE_WS_URL=http://IP/ws`; ride-service healthy |
| Eureka empty | Wait 1–2 min; `docker compose logs eureka-server` |
| Build OOM on VM | Lower `JAVA_OPTS` or increase VM memory; build one service at a time |

When your Oracle public IP and Neon connection string are ready, fill `.env` and run Compose — that is the backend go-live step.
