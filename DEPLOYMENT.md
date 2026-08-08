# Deployment Guide — Neon + Railway + Vercel

| Layer | Platform |
|-------|----------|
| Database | **Neon** (PostgreSQL) |
| Backend | **Railway** (5 Docker services) |
| Frontend | **Vercel** |

Your repo already has Dockerfiles + `railway.toml` per service.

> **Security:** If you pasted a Neon password in chat, **rotate it** in Neon → Credentials → reset password, then use the new password in Railway.

---

## Architecture

```
Browser → Vercel (React)
            │
            ├─ REST → https://<gateway>.up.railway.app/api/**
            └─ WS   → https://<ride>.up.railway.app/ws
                        │
                   Railway private network
                   eureka / user / ride / payment / gateway
                        │
                      Neon
                 user_db / ride_db / payment_db
```

---

## STEP 1 — Neon databases (you already have a project)

From your connection string:

| Field | Value |
|-------|--------|
| Host | `ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech` |
| User | `neondb_owner` |
| Default DB | `neondb` (not used by the app) |

### 1.1 Create the 3 app databases

Neon SQL Editor → run (one at a time if needed):

```sql
CREATE DATABASE user_db;
CREATE DATABASE ride_db;
CREATE DATABASE payment_db;
```

(Or use `deploy/neon-create-databases.sql`)

### 1.2 JDBC URLs for Railway

```text
jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/user_db?sslmode=require
jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/ride_db?sslmode=require
jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/payment_db?sslmode=require
```

Password = your Neon password (from Connect panel / Credentials).

---

## STEP 2 — Railway backend (do this in the browser)

### 2.1 Create project

1. Go to https://railway.app → Login with GitHub  
2. **New Project** → **Deploy from GitHub repo** → `ManikantaReddi2273/Ride_share`  
3. Empty project is fine if it asks to pick a path — we add services manually.

### 2.2 Add 5 services (same repo, different root folders)

For **each** service below: **+ New** → **GitHub Repo** → same repo → set **Root Directory**:

| Railway service name (set exactly) | Root Directory |
|------------------------------------|----------------|
| `eureka-server` | `eureka-server` |
| `api-gateway-service` | `api-gateway-service` |
| `user-service` | `user-service` |
| `ride-service` | `ride-service` |
| `payment-service` | `payment-service` |

Each folder has a `Dockerfile` + `railway.toml`. Railway will build with Docker.

**Deploy order tip:** deploy `eureka-server` first and wait until healthy, then the others.

### 2.3 Shared variables (Project → Variables) OR per-service

Set these on **every** service that needs them (or use Railway shared variables):

#### All Java services

```env
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server.railway.internal:8761/eureka/
EUREKA_INSTANCE_PREFER_IP_ADDRESS=false
JWT_SECRET=pick-a-long-random-secret
JAVA_OPTS=-Xms256m -Xmx512m
```

#### Eureka only

```env
EUREKA_INSTANCE_HOSTNAME=eureka-server.railway.internal
JAVA_OPTS=-Xms256m -Xmx384m
```

#### user-service

```env
POSTGRES_AUTO_CREATE=false
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/user_db?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<YOUR_NEON_PASSWORD>
SPRING_MAIL_USERNAME=<gmail>
SPRING_MAIL_PASSWORD=<gmail-app-password>
JWT_SECRET=<same as gateway>
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server.railway.internal:8761/eureka/
EUREKA_INSTANCE_PREFER_IP_ADDRESS=false
EUREKA_INSTANCE_HOSTNAME=user-service.railway.internal
```

#### ride-service

```env
POSTGRES_AUTO_CREATE=false
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/ride_db?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<YOUR_NEON_PASSWORD>
CORS_ALLOWED_ORIGINS=https://YOUR_VERCEL_URL.vercel.app,http://localhost:5173
GOOGLE_MAPS_API_KEY=<ors-key>
SPRING_MAIL_USERNAME=<gmail>
SPRING_MAIL_PASSWORD=<gmail-app-password>
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server.railway.internal:8761/eureka/
EUREKA_INSTANCE_PREFER_IP_ADDRESS=false
EUREKA_INSTANCE_HOSTNAME=ride-service.railway.internal
JAVA_OPTS=-Xms256m -Xmx768m
```

#### payment-service

```env
POSTGRES_AUTO_CREATE=false
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/payment_db?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<YOUR_NEON_PASSWORD>
RAZORPAY_KEY_ID=<key>
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_MODE=TEST
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server.railway.internal:8761/eureka/
EUREKA_INSTANCE_PREFER_IP_ADDRESS=false
EUREKA_INSTANCE_HOSTNAME=payment-service.railway.internal
```

#### api-gateway-service

```env
JWT_SECRET=<same secret>
CORS_ALLOWED_ORIGINS=https://YOUR_VERCEL_URL.vercel.app,http://localhost:5173
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://eureka-server.railway.internal:8761/eureka/
EUREKA_INSTANCE_PREFER_IP_ADDRESS=false
EUREKA_INSTANCE_HOSTNAME=api-gateway-service.railway.internal
```

### 2.4 Public domains (required)

On these services → **Settings → Networking → Generate Domain**:

| Service | Why |
|---------|-----|
| `api-gateway-service` | Frontend REST (`/api/...`) |
| `ride-service` | WebSocket (`/ws`) |

Copy the URLs, e.g.:

- Gateway: `https://api-gateway-service-production-xxxx.up.railway.app`  
- Ride: `https://ride-service-production-xxxx.up.railway.app`

### 2.5 Check logs

Open each service → **Deployments → View Logs**.  
Look for: started Tomcat / Netty, Eureka registration, no DB auth errors.

---

## STEP 3 — Vercel frontend

1. https://vercel.com → Import `ManikantaReddi2273/Ride_share`  
2. **Root Directory:** `fronted_ride_share`  
3. Environment variables:

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `https://<your-gateway-domain>/api` |
| `VITE_WS_URL` | `https://<your-ride-domain>/ws` |
| `VITE_STORAGE_SECRET` | any long random string |

4. Deploy → copy Vercel URL (e.g. `https://ride-share-xxx.vercel.app`)  
5. Update Railway `CORS_ALLOWED_ORIGINS` on **gateway** and **ride-service** to that URL  
6. Redeploy those two Railway services  
7. Redeploy Vercel if needed  

---

## STEP 4 — Smoke test

1. Open Vercel URL  
2. Register → OTP email → Login  
3. Add vehicle → post ride → search → book (Razorpay test)  
4. Confirm WebSocket notifications work  

---

## Checklist

- [ ] Neon: `user_db`, `ride_db`, `payment_db` created  
- [ ] Railway: 5 services, names match table above  
- [ ] Env vars set (DB URLs with `sslmode=require`)  
- [ ] Public domains on gateway + ride  
- [ ] Vercel root = `fronted_ride_share` + env vars  
- [ ] CORS updated with Vercel URL  
- [ ] End-to-end test  

---

## Common failures

| Problem | Fix |
|---------|-----|
| DB connection refused / SSL | Use `?sslmode=require` and correct DB name |
| Service not found in Eureka | Service name + `*.railway.internal` hostname; wait for Eureka healthy first |
| CORS error | Exact Vercel origin in `CORS_ALLOWED_ORIGINS` (https, no trailing `/`) |
| WS fails | `VITE_WS_URL` must be ride public URL + `/ws` |
| Out of memory | Raise Railway plan RAM or lower `JAVA_OPTS` |
| Free credits exhausted | Railway trial credits run out → add card / upgrade |

---

## What you still must do yourself

1. Create the 3 Neon databases (SQL above)  
2. Log into Railway + create 5 services from GitHub  
3. Paste env vars (including Neon password)  
4. Generate public domains  
5. Deploy Vercel with gateway/ride URLs  
6. Fix CORS after you know the Vercel URL  

I cannot finish Railway/Vercel deploys from here without your logged-in browser session (`railway login` is required locally).
