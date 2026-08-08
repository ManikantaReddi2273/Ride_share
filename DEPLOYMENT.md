# Deployment Guide — Neon + Render (free) + Vercel

| Layer | Platform |
|-------|----------|
| Database | **Neon** (PostgreSQL) — free |
| Backend | **Render** (5 free Web Services) |
| Frontend | **Vercel** — free |

> Free Render services **sleep when idle**. First request after sleep can take 1–2 minutes. Wake Eureka + all services before demoing (open each `*.onrender.com` once).

---

## Architecture

```
Browser → Vercel
            ├─ REST → https://api-gateway-xxxx.onrender.com/api/**
            └─ WS   → https://ride-service-xxxx.onrender.com/ws
                        │
              Render free Web Services
              eureka / gateway / user / ride / payment
                        │
                      Neon
               user_db / ride_db / payment_db
```

---

## STEP 1 — Neon (database)

1. https://console.neon.tech → your project  
2. SQL Editor — create databases:

```sql
CREATE DATABASE user_db;
CREATE DATABASE ride_db;
CREATE DATABASE payment_db;
```

3. From **Connect**, note Host / User / Password.

**JDBC URLs** (replace HOST if different):

```text
jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/user_db?sslmode=require
jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/ride_db?sslmode=require
jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/payment_db?sslmode=require
```

User: `neondb_owner`  
Password: from Neon Connect (rotate if you pasted it publicly)

---

## STEP 2 — Render (backend) — YOU do this in the browser

### 2.1 Blueprint deploy

1. Push is already on GitHub: `ManikantaReddi2273/Ride_share` (includes `render.yaml`)  
2. Go to https://dashboard.render.com  
3. **New +** → **Blueprint**  
4. Connect GitHub → select **Ride_share** → apply `render.yaml`  
5. Render creates 5 free Web Services:
   - `eureka-server`
   - `user-service`
   - `ride-service`
   - `payment-service`
   - `api-gateway-service`

### 2.2 Fill secret env vars (Blueprint marks `sync: false`)

For each service that asks, set:

#### user-service
| Key | Value |
|-----|--------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://HOST/user_db?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `neondb_owner` |
| `SPRING_DATASOURCE_PASSWORD` | Neon password |
| `JWT_SECRET` | long random string (same on gateway) |
| `SPRING_MAIL_USERNAME` | Gmail |
| `SPRING_MAIL_PASSWORD` | Gmail app password |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | `https://<eureka-server-url>/eureka/` |

#### ride-service
| Key | Value |
|-----|--------|
| `SPRING_DATASOURCE_URL` | `.../ride_db?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `neondb_owner` |
| `SPRING_DATASOURCE_PASSWORD` | Neon password |
| `CORS_ALLOWED_ORIGINS` | `https://YOUR.vercel.app,http://localhost:5173` |
| `GOOGLE_MAPS_API_KEY` | OpenRouteService key |
| `SPRING_MAIL_*` | same as user |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | `https://<eureka-server-url>/eureka/` |

#### payment-service
| Key | Value |
|-----|--------|
| `SPRING_DATASOURCE_URL` | `.../payment_db?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `neondb_owner` |
| `SPRING_DATASOURCE_PASSWORD` | Neon password |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay test keys |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | `https://<eureka-server-url>/eureka/` |

#### api-gateway-service
| Key | Value |
|-----|--------|
| `JWT_SECRET` | **same** as user-service |
| `CORS_ALLOWED_ORIGINS` | your Vercel URL |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | `https://<eureka-server-url>/eureka/` |

### 2.3 Eureka URL (important)

1. Open **eureka-server** on Render → copy public URL  
   Example: `https://eureka-server-xxxx.onrender.com`  
2. Set on user / ride / payment / gateway:

```text
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=https://eureka-server-xxxx.onrender.com/eureka/
```

3. Redeploy those 4 services after setting it.

### 2.4 Wait for builds

First Docker builds take **10–20+ minutes** each on free tier. Watch **Logs**.  
Success when you see app started / Tomcat or Netty listening.

### 2.5 Sanity check

- Open Eureka URL in browser → dashboard should list services (after they register)  
- Gateway: `https://api-gateway-xxxx.onrender.com/actuator/health`  
- Ride: `https://ride-service-xxxx.onrender.com/actuator/health`

---

## STEP 3 — Vercel (frontend)

1. https://vercel.com → Import `ManikantaReddi2273/Ride_share`  
2. **Root Directory:** `fronted_ride_share`  
3. Environment variables:

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `https://api-gateway-xxxx.onrender.com/api` |
| `VITE_WS_URL` | `https://ride-service-xxxx.onrender.com/ws` |
| `VITE_STORAGE_SECRET` | any long random string |

4. Deploy → copy Vercel URL  
5. Update Render `CORS_ALLOWED_ORIGINS` on **gateway** + **ride** to that Vercel URL → **Manual Deploy**  
6. Redeploy Vercel if you changed env after first deploy  

---

## STEP 4 — Demo tip (free tier sleep)

Before showing the app:

1. Open Eureka URL  
2. Open gateway `/actuator/health`  
3. Open user / ride / payment health URLs  
4. Wait until all are up  
5. Then open the Vercel site  

---

## Checklist

- [ ] Neon: `user_db`, `ride_db`, `payment_db`  
- [ ] Render Blueprint applied from this repo  
- [ ] All secret env vars filled  
- [ ] `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` set on 4 services  
- [ ] Gateway + ride public URLs work  
- [ ] Vercel env points at gateway + ride  
- [ ] CORS includes Vercel URL  
- [ ] End-to-end test (register / login / ride)

---

## What I cannot do from Cursor

- Log into your Render / Vercel / Neon accounts  
- Click “Apply Blueprint” or paste your Neon password  

You must complete Steps 1–3 in the browser.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Out of memory / crash | Free = 512MB; `JAVA_OPTS` already low; don’t raise heap |
| 502 / service unavailable | Service sleeping — hit health URL and wait |
| Eureka empty | Wrong `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE`; use `https://.../eureka/` |
| CORS error | Exact Vercel origin in `CORS_ALLOWED_ORIGINS` |
| DB SSL error | URL must end with `?sslmode=require` |
| Build failed | Check Render logs; retry deploy |

Full env template: `deploy/render.env.example`
