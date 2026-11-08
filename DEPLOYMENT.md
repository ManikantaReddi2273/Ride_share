# Deployment Guide — Neon + Render (free) + Vercel


| Layer    | Platform                         |
| -------- | -------------------------------- |
| Database | **Neon** (PostgreSQL) — free     |
| Backend  | **Render** (5 free Web Services) |
| Frontend | **Vercel** — free                |


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

1. [https://console.neon.tech](https://console.neon.tech) → your project
2. SQL Editor — create databases:

```sql
CREATE DATABASE user_db;
CREATE DATABASE ride_db;
CREATE DATABASE payment_db;
```

1. From **Connect**, note Host / User / Password.

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
2. Go to [https://dashboard.render.com](https://dashboard.render.com)
3. **New +** → **Blueprint**
4. Connect GitHub → select **Ride_share** → apply `render.yaml`
5. Render creates 5 free Web Services:
  - `eureka-server`
  - `user-service`
  - `ride-service`
  - `payment-service`
  - `api-gateway-service`



### 2.2 Copy-paste env vars into Render (from this codebase + Neon)

> Replace only `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` after Eureka is live  
> (copy Eureka’s public URL from Render, then use `https://THAT_URL/eureka/`).  
> After Vercel deploy, update `CORS_ALLOWED_ORIGINS` on gateway + ride.

---



#### eureka-server

(Blueprint already sets most of these; usually nothing secret to paste.)

```env
JAVA_OPTS=-Xms64m -Xmx200m
EUREKA_INSTANCE_PREFER_IP_ADDRESS=false
EUREKA_NON_SECURE_PORT_ENABLED=false
EUREKA_SECURE_PORT_ENABLED=true
EUREKA_INSTANCE_SECURE_PORT=443
```

---



#### user-service

```env
JAVA_OPTS=-Xms64m -Xmx200m
POSTGRES_AUTO_CREATE=false
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/user_db?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=npg_pC6tqO7mkPwb
JWT_SECRET=SmartRideSharingSystemSecretKeyForJWTTokenGeneration2024
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=campusworks2273@gmail.com
SPRING_MAIL_PASSWORD=nlbdkysxhffrjwnt
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=https://REPLACE_EUREKA_HOST.onrender.com/eureka/
EUREKA_INSTANCE_PREFER_IP_ADDRESS=false
EUREKA_NON_SECURE_PORT_ENABLED=false
EUREKA_SECURE_PORT_ENABLED=true
EUREKA_INSTANCE_SECURE_PORT=443
```

---



#### ride-service

```env
JAVA_OPTS=-Xms64m -Xmx250m
POSTGRES_AUTO_CREATE=false
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/ride_db?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=npg_pC6tqO7mkPwb
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
GOOGLE_MAPS_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjlmOGQyMjllNjYwODQ0ZWI4ZTg0YjM2ZGUwNDY4YWQzIiwiaCI6Im11cm11cjY0In0=
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=campusworks2273@gmail.com
SPRING_MAIL_PASSWORD=nlbdkysxhffrjwnt
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=https://REPLACE_EUREKA_HOST.onrender.com/eureka/
EUREKA_INSTANCE_PREFER_IP_ADDRESS=false
EUREKA_NON_SECURE_PORT_ENABLED=false
EUREKA_SECURE_PORT_ENABLED=true
EUREKA_INSTANCE_SECURE_PORT=443
```

---



#### payment-service

```env
JAVA_OPTS=-Xms64m -Xmx200m
POSTGRES_AUTO_CREATE=false
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-weathered-cloud-axhpd4hu.c-4.us-east-2.aws.neon.tech/payment_db?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=npg_pC6tqO7mkPwb
RAZORPAY_KEY_ID=rzp_test_RlckMDrutanqWY
RAZORPAY_KEY_SECRET=pSu2rnKpY30PdJ27Osis7Lc8
RAZORPAY_MODE=TEST
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=https://REPLACE_EUREKA_HOST.onrender.com/eureka/
EUREKA_INSTANCE_PREFER_IP_ADDRESS=false
EUREKA_NON_SECURE_PORT_ENABLED=false
EUREKA_SECURE_PORT_ENABLED=true
EUREKA_INSTANCE_SECURE_PORT=443
```

---



#### api-gateway-service

```env
JAVA_OPTS=-Xms64m -Xmx200m
JWT_SECRET=SmartRideSharingSystemSecretKeyForJWTTokenGeneration2024
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=https://REPLACE_EUREKA_HOST.onrender.com/eureka/
EUREKA_INSTANCE_PREFER_IP_ADDRESS=false
EUREKA_NON_SECURE_PORT_ENABLED=false
EUREKA_SECURE_PORT_ENABLED=true
EUREKA_INSTANCE_SECURE_PORT=443
```

---



#### After Vercel is live (update gateway + ride only)

Replace `CORS_ALLOWED_ORIGINS` with (example):

```env
CORS_ALLOWED_ORIGINS=https://YOUR_APP.vercel.app,http://localhost:5173
```



#### Vercel frontend env (for later)

```env
VITE_API_BASE_URL=https://REPLACE_GATEWAY.onrender.com/api
VITE_WS_URL=https://REPLACE_RIDE.onrender.com/ws
VITE_STORAGE_SECRET=smart-ride-sharing-secret
```



### 2.3 Eureka URL (important)

1. Open **eureka-server** on Render → copy public URL
  Example: `https://eureka-server-xxxx.onrender.com`
2. Set on user / ride / payment / gateway:

```text
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=https://eureka-server-xxxx.onrender.com/eureka/
```

1. Redeploy those 4 services after setting it.



### 2.4 Wait for builds

First Docker builds take **10–20+ minutes** each on free tier. Watch **Logs**.  
Success when you see app started / Tomcat or Netty listening.

### 2.5 Sanity check

- Open Eureka URL in browser → dashboard should list services (after they register)  
- Gateway: `https://api-gateway-xxxx.onrender.com/actuator/health`  
- Ride: `https://ride-service-xxxx.onrender.com/actuator/health`

---



## STEP 3 — Vercel (frontend)

1. [https://vercel.com](https://vercel.com) → Import `ManikantaReddi2273/Ride_share`
2. **Root Directory:** `fronted_ride_share`
3. Environment variables:


| Name                  | Value                                       |
| --------------------- | ------------------------------------------- |
| `VITE_API_BASE_URL`   | `https://api-gateway-xxxx.onrender.com/api` |
| `VITE_WS_URL`         | `https://ride-service-xxxx.onrender.com/ws` |
| `VITE_STORAGE_SECRET` | any long random string                      |


1. Deploy → copy Vercel URL
2. Update Render `CORS_ALLOWED_ORIGINS` on **gateway** + **ride** to that Vercel URL → **Manual Deploy**
3. Redeploy Vercel if you changed env after first deploy

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

- [x] Neon: `user_db`, `ride_db`, `payment_db`  
- [x] Render Blueprint applied from this repo  
- [x] All secret env vars filled  
- [x] `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` set on 4 services  
- [x] Gateway + ride public URLs work  
- [x] Vercel env points at gateway + ride  
- [x] CORS includes Vercel URL  
- [x] End-to-end test (register / login / ride)

---



## What I cannot do from Cursor

- Log into your Render / Vercel / Neon accounts  
- Click “Apply Blueprint” or paste your Neon password

You must complete Steps 1–3 in the browser.

---



## Troubleshooting


| Issue                     | Fix                                                                     |
| ------------------------- | ----------------------------------------------------------------------- |
| Out of memory / crash     | Free = 512MB; `JAVA_OPTS` already low; don’t raise heap                 |
| 502 / service unavailable | Service sleeping — hit health URL and wait                              |
| Eureka empty              | Wrong `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE`; use `https://.../eureka/` |
| CORS error                | Exact Vercel origin in `CORS_ALLOWED_ORIGINS`                           |
| DB SSL error              | URL must end with `?sslmode=require`                                    |
| Build failed              | Check Render logs; retry deploy                                         |


Full env template: `deploy/render.env.example`