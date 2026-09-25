# Vercel & Render Deployment Guide

This guide details how to deploy the **Hospital AI Scheduling / CareFlow** monorepo:
- **Frontend (`apps/web`)** on **Vercel**
- **Backend Services (`apps/api` & `apps/ai-service`) + PostgreSQL + Redis** on **Render**

---

## 🏛️ System Architecture Overview

```
 ┌───────────────────────────┐         ┌──────────────────────────────────────┐
 │    Vercel (Frontend)      │         │           Render (Backend)           │
 │                           │         │                                      │
 │   ┌───────────────────┐   │         │   ┌──────────────────────────────┐   │
 │   │    apps/web       │   │   HTTPS │   │         apps/api             │   │
 │   │   (Next.js 16)    │───┼─────────┼──>│  (Java 21 / Spring Boot)    │   │
 │   └───────────────────┘   │   REST  │   └──────────────┬───────────────┘   │
 └───────────────────────────┘         │                  │                   │
                                       │    ┌─────────────┼─────────────┐     │
                                       │    │             │             │     │
                                       │    ▼             ▼             ▼     │
                                       │ ┌───────┐   ┌─────────┐   ┌────────┐ │
                                       │ │  AI   │   │Postgres │   │ Redis  │ │
                                       │ │Service│   │  DB 16  │   │ Cache  │ │
                                       │ └───────┘   └─────────┘   └────────┘ │
                                       └──────────────────────────────────────┘
```

---

## 🚀 Step 1: Deploy Backend Stack on Render (Using Blueprint)

A [`render.yaml`](../../render.yaml) file is included in the project root.

1. **Push your code to GitHub / GitLab**.
2. Sign in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** (top right) ➔ Select **Blueprint**.
4. Connect your GitHub repository.
5. Render will automatically parse [`render.yaml`](../../render.yaml) and provision:
   - **PostgreSQL Database** (`careflow-db`)
   - **FastAPI AI Service** (`careflow-ai-service`) built via `./apps/ai-service/Dockerfile`
   - **Spring Boot API** (`careflow-api`) built via `./apps/api/Dockerfile`
6. Create a **Key-Value / Redis** instance named `careflow-redis` in Render and link `REDIS_HOST` if needed.
7. Once `careflow-api` completes building and reaches healthy state:
   - Copy its public HTTPS endpoint (e.g., `https://careflow-api.onrender.com`).

---

## 🌐 Step 2: Deploy Frontend on Vercel

1. Sign in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository.
4. In the Project Configuration screen:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Edit and set to `apps/web` *(Important for monorepos)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Expand **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://careflow-api.onrender.com` (Your Render API URL)
6. Click **Deploy**.
7. Once deployed, copy your production Vercel URL (e.g., `https://careflow-web.vercel.app`).

---

## 🔄 Step 3: Configure CORS on Render API

1. Go back to your [Render Dashboard](https://dashboard.render.com).
2. Select your `careflow-api` service.
3. Navigate to **Environment**.
4. Update the `WEB_ORIGIN` variable to your Vercel URL:
   - `WEB_ORIGIN` = `https://careflow-web.vercel.app`
5. Save changes. Render will automatically redeploy the API service with updated CORS policies.

---

## 🧪 Step 4: Verification & Smoke Test

1. Open your Vercel deployment URL (`https://careflow-web.vercel.app`).
2. Log in with the initial admin credentials provisioned by Flyway/Bootstrap:
   - **Email**: `admin@careflow.local`
   - **Password**: `CareFlowAdmin!2026` (or the password configured in `BOOTSTRAP_ADMIN_PASSWORD`).
3. Verify doctor slot ranking, appointment booking, and patient dashboard interactions.
