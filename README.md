# 🚗 Smart Ride Sharing & Carpooling Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2023.0.0-blue.svg)](https://spring.io/projects/spring-cloud)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2-purple.svg)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ed.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

> An enterprise-grade, microservices-based dynamic carpooling and ride-sharing platform that connects vehicle owners traveling long distances with passengers heading along the same route. Features real-time route matching, dynamic distance-based fare calculation, Razorpay payment processing, and live WebSocket updates.

---

## 📌 Table of Contents
1. [About the Project](#-about-the-project)
2. [Why This Project?](#-why-this-project)
3. [Key Features](#-key-features)
4. [System Architecture & Services](#-system-architecture--services)
5. [Prerequisites](#-prerequisites)
6. [How to Clone](#-how-to-clone)
7. [Configuration Guide (.env and application.properties)](#-configuration-guide)
8. [How to Run the Project](#-how-to-run-the-project)
   - [Method 1: One-Click Startup (Windows)](#method-1-one-click-startup-windows)
   - [Method 2: Manual Step-by-Step (Individual Terminals)](#method-2-manual-step-by-step-individual-terminals)
   - [Method 3: Running with Docker Compose](#method-3-running-with-docker-compose)
   - [Method 4: Cloud Deployment (Neon + Render + Vercel)](#method-4-cloud-deployment-neon--render--vercel)
9. [Default Test Credentials](#-default-test-credentials)
10. [Health Checks & Verification](#-health-checks--verification)
11. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 📖 About the Project

The **Smart Ride Sharing System** is a full-stack platform designed to optimize intercity and daily commuting. Vehicle owners can list their upcoming trips with spare seating capacity, and passengers traveling along that trajectory can discover, book, and pay for seats seamlessly.

### Core Problem It Solves:
- **Solo Travel Waste**: Millions of vehicles travel daily with 3 to 4 empty seats, resulting in excessive fuel expenditure and high personal costs.
- **Traffic Congestion & Carbon Footprint**: More single-occupant vehicles on roads contribute significantly to greenhouse gas emissions and urban traffic jams.
- **Lack of Trust in Traditional Carpooling**: Informal carpooling lacks identity verification, structured cancellation policies, secure payment guarantees, and driver/passenger accountability.

---

## 🎯 Key Features

- **Dynamic Route Matching**: Matches riders not only on exact origins and destinations, but also intelligently along waypoints on the driver's route.
- **Dynamic Fare Calculation**: Fares are calculated dynamically based on actual distance traveled using the formula:  
  $$\text{Fare} = \text{Base Fare} + (\text{Rate per Km} \times \text{Distance in Km})$$
- **Secure Authentication & RBAC**: Stateless JWT-based authentication with role-based access control for `PASSENGER`, `DRIVER`, and `ADMIN`.
- **Seat Inventory Management**: Real-time seat updates upon booking or cancellation to prevent overbooking.
- **Integrated Payments & Wallets**: Powered by Razorpay with escrow-like ride payouts and driver wallet withdrawals.
- **Real-Time Communication**: Live booking alerts, driver location notifications, and status changes via WebSockets (STOMP/SockJS).
- **Automated Email Notifications**: Booking confirmation receipts and OTP verification via SMTP / Resend API.
- **Review & Rating System**: Bilateral post-ride ratings and reviews to build network trust.
- **Interactive Modern UI**: Fast, responsive React 19 single-page application built with Vite, Material UI, and Tailwind CSS.

---

## 🏗️ System Architecture & Services

The platform follows a **Microservices Architecture with Domain-Driven Design (DDD)**:

```
                            ┌───────────────────────────────────┐
                            │    React Frontend (Vite)          │
                            │    http://localhost:5173          │
                            └─────────────────┬─────────────────┘
                                              │
                                              ▼
                            ┌───────────────────────────────────┐
                            │    Spring Cloud API Gateway       │
                            │    http://localhost:8080          │
                            └─────────────────┬─────────────────┘
                                              │
                                              ▼
                            ┌───────────────────────────────────┐
                            │    Eureka Service Discovery       │
                            │    http://localhost:8761          │
                            └─────────────────┬─────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        ▼                                     ▼                                     ▼
┌───────────────┐                     ┌───────────────┐                     ┌───────────────┐
│ User Service  │                     │ Ride Service  │                     │Payment Service│
│  Port: 8081   │                     │  Port: 8082   │                     │  Port: 8084   │
└───────┬───────┘                     └───────┬───────┘                     └───────┬───────┘
        ▼                                     ▼                                     ▼
┌───────────────┐                     ┌───────────────┐                     ┌───────────────┐
│  user_db (PG) │                     │  ride_db (PG) │                     │payment_db (PG)│
└───────────────┘                     └───────────────┘                     └───────────────┘
```

### Microservice Breakdown:

| Service | Port | Directory | Description |
| :--- | :---: | :--- | :--- |
| **Eureka Server** | `8761` | `/eureka-server` | Service Registry & Discovery center. |
| **API Gateway** | `8080` | `/api-gateway-service` | Single entry point routing `/api/users/**`, `/api/rides/**`, `/api/payments/**`. |
| **User Service** | `8081` | `/user-service` | User registration, login, JWT token generation, email OTP, and profiles. |
| **Ride Service** | `8082` | `/ride-service` | Ride creation, seat booking, route matching, OpenRouteService API, and WebSockets. |
| **Payment Service** | `8084` | `/payment-service` | Razorpay order creation, payment verification, and wallet management. |
| **Frontend** | `5173` | `/fronted_ride_share` | React single-page application with modern UI components. |

---

## 💻 Prerequisites

Ensure you have the following installed on your machine:

1. **Java JDK 17 or 21**:
   ```bash
   java -version
   ```
2. **Apache Maven 3.8+**:
   ```bash
   mvn -version
   ```
3. **Node.js (v18+) & npm**:
   ```bash
   node -v
   npm -v
   ```
4. **PostgreSQL 14+** (running locally on port `5432` or a free cloud [Neon](https://neon.tech) database)
5. **Git** (for version control)
6. *(Optional)* **Docker & Docker Compose**

---

## 📥 How to Clone

Clone the repository and enter the project root directory:

```bash
git clone https://github.com/ManikantaReddi2273/Ride_share.git
cd Ride_share
```

---

## ⚙️ Configuration Guide

Each service is pre-configured with sane local defaults in its `application.properties`, but you can override configurations using environment variables or a `.env` file.

### 1. Database Setup (PostgreSQL)

You need three logical databases: `user_db`, `ride_db`, and `payment_db`.

#### On Local PostgreSQL:
Connect to your local PostgreSQL instance and execute:
```sql
CREATE DATABASE user_db;
CREATE DATABASE ride_db;
CREATE DATABASE payment_db;
```

---

### 2. Microservice `application.properties` Files

Each backend service contains an `application.properties` located in `src/main/resources/application.properties`. Below is what each service configures:

#### A. Eureka Server (`eureka-server/src/main/resources/application.properties`)
- `server.port`: `8761` (default Eureka port)
- `eureka.client.register-with-eureka`: `false` (does not register with itself)
- `eureka.client.fetch-registry`: `false`

#### B. API Gateway (`api-gateway-service/src/main/resources/application.properties`)
- `server.port`: `8080`
- `eureka.client.service-url.defaultZone`: `http://localhost:8761/eureka/`
- `jwt.secret`: Secret key used to validate incoming JWT bearer tokens.
- `cors.allowed-origins`: Allowed client origins (`http://localhost:5173,http://localhost:3000`).

#### C. User Service (`user-service/src/main/resources/application.properties`)
- `server.port`: `8081`
- `spring.datasource.url`: `jdbc:postgresql://localhost:5432/user_db`
- `spring.datasource.username`: PostgreSQL user (default: `postgres`)
- `spring.datasource.password`: PostgreSQL password
- `jwt.secret`: Must match the API Gateway secret key.
- `spring.mail.username` & `spring.mail.password`: SMTP credentials for verification emails.

#### D. Ride Service (`ride-service/src/main/resources/application.properties`)
- `server.port`: `8082`
- `spring.datasource.url`: `jdbc:postgresql://localhost:5432/ride_db`
- `google.maps.api.key`: API Key for OpenRouteService routing and distance matrix.
- `fare.base-fare`: Base fare in INR (default: `50.0`).
- `fare.rate-per-km`: Rate per kilometer in INR (default: `10.0`).

#### E. Payment Service (`payment-service/src/main/resources/application.properties`)
- `server.port`: `8084`
- `spring.datasource.url`: `jdbc:postgresql://localhost:5432/payment_db`
- `razorpay.key.id`: Razorpay Test Key ID (`rzp_test_...`).
- `razorpay.key.secret`: Razorpay Key Secret.
- `payment.platform.fee.percentage`: Platform commission (default: `10.0%`).

---

### 3. Root `.env` Configuration (For Docker & Deployments)

For containerized setups or cloud deployments, copy `deploy/env.example` to `.env` in the root directory:

```env
# Database Credentials (Neon or Local Postgres)
NEON_DB_USER=postgres
NEON_DB_PASSWORD=your_postgres_password
USER_DB_URL=jdbc:postgresql://localhost:5432/user_db
RIDE_DB_URL=jdbc:postgresql://localhost:5432/ride_db
PAYMENT_DB_URL=jdbc:postgresql://localhost:5432/payment_db

# Security
JWT_SECRET=SmartRideSharingSystemSecretKeyForJWTTokenGeneration2024

# CORS (Frontend URL)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Email (Gmail App Password)
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_email@gmail.com
SPRING_MAIL_PASSWORD=your_gmail_app_password

# Routing (OpenRouteService)
GOOGLE_MAPS_API_KEY=your_openrouteservice_key

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_id
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_MODE=TEST
```

---

### 4. Frontend Environment Configuration

In `fronted_ride_share/`, the Vite dev server automatically proxies `/api` to `http://localhost:8080`.  
For production builds, you can create a `.env` in `fronted_ride_share/`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8082/ws
VITE_STORAGE_SECRET=smart-ride-sharing-secret
```

---

## 🚀 How to Run the Project

### Method 1: One-Click Startup (Windows)

The repository provides automated launcher scripts:

1. Double-click or run:
   ```cmd
   .\run-local.bat
   ```
   *This starts Eureka Server, waits for it to initialize, then starts User Service, Ride Service, Payment Service, API Gateway, and Vite Frontend in separate labeled terminal windows.*

2. To stop all services at once, double-click or run:
   ```cmd
   .\stop-local.bat
   ```

---

### Method 2: Manual Step-by-Step (Individual Terminals)

If you prefer starting services manually or are on macOS/Linux, follow the exact order below:

#### Step 1: Start Eureka Server (Port 8761)
```bash
cd eureka-server
mvn spring-boot:run
```
*Wait ~15 seconds until Eureka is up at `http://localhost:8761`.*

#### Step 2: Start User Service (Port 8081)
```bash
cd user-service
mvn spring-boot:run
```

#### Step 3: Start Ride Service (Port 8082)
```bash
cd ride-service
mvn spring-boot:run
```

#### Step 4: Start Payment Service (Port 8084)
```bash
cd payment-service
mvn spring-boot:run
```

#### Step 5: Start API Gateway (Port 8080)
```bash
cd api-gateway-service
mvn spring-boot:run
```

#### Step 6: Start Frontend (Port 5173)
```bash
cd fronted_ride_share
npm install
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

### Method 3: Running with Docker Compose

If Docker Desktop is running, you can spin up the full stack with one command:

```bash
docker compose up --build
```

---

### Method 4: Cloud Deployment (Neon + Render + Vercel)

The codebase is fully equipped for free-tier cloud deployment:
- **Databases**: Managed PostgreSQL on [Neon](https://neon.tech).
- **Backend Services**: Hosted on [Render](https://render.com) using the included `render.yaml` Blueprint.
- **Frontend**: Hosted on [Vercel](https://vercel.com).

For detailed cloud deployment steps, refer to [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🔑 Default Test Credentials

The database migration automatically seeds a default administrator account:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin2273@gmail.com` | `admin2273` |

You can also register new **Driver** and **Passenger** accounts directly from the web registration screen.

---

## 🩺 Health Checks & Verification

Verify each component is functioning by opening these endpoints in your browser:

- **Eureka Server Dashboard**: [http://localhost:8761](http://localhost:8761)  
  *(Verify that `API-GATEWAY-SERVICE`, `USER-SERVICE`, `RIDE-SERVICE`, and `PAYMENT-SERVICE` are listed as UP)*
- **API Gateway Health**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- **User Service Health**: [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health)
- **Ride Service Health**: [http://localhost:8082/actuator/health](http://localhost:8082/actuator/health)
- **Payment Service Health**: [http://localhost:8084/actuator/health](http://localhost:8084/actuator/health)
- **Frontend Application**: [http://localhost:5173](http://localhost:5173)

---

## ❓ Troubleshooting & FAQs

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Port already in use (`8080`, `8761`, etc.)** | A previous instance is still running | Run `stop-local.bat` or find and terminate the process using `netstat -ano \| findstr :<PORT>`. |
| **Connection refused: PostgreSQL** | PostgreSQL is not started | Verify PostgreSQL service is running (`Get-Service *postgres*`). Ensure databases `user_db`, `ride_db`, and `payment_db` exist. |
| **Eureka registry empty** | Services started before Eureka was ready | Always ensure Eureka Server starts first. Give Eureka 15–20 seconds to establish before starting microservices. |
| **CORS errors in browser** | Origin mismatch | Ensure `CORS_ALLOWED_ORIGINS` in Gateway contains `http://localhost:5173`. |
| **Distance or Fare calculation error** | Missing OpenRouteService Key | Provide a valid API key in `GOOGLE_MAPS_API_KEY` or `ride-service/src/main/resources/application.properties`. |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
