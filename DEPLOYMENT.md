# TalentPulse AI — Production Deployment Guide

This guide details the step-by-step procedures for deploying **TalentPulse AI** to production using **Managed PostgreSQL**, **Render** (FastAPI Backend), and **Vercel** (React Frontend).

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (React Frontend)                  │
│       - React 19 + Vite + Tailwind CSS v4 + Recharts        │
│       - Protected Routes + JWT Bearer Auth Headers          │
│       - SPA fallback routing (vercel.json)                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Render (FastAPI Backend)                 │
│       - Python 3.11 / Uvicorn Web Service                   │
│       - PDF Extraction (PyMuPDF) + Resume Storage           │
│       - Gemini AI Screening + Deterministic Rubric Engine   │
│       - JWT Security, RBAC & Request Validation             │
└──────────────────────────────┬──────────────────────────────┘
                               │ SSL / TCP (Pool)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Managed PostgreSQL (Render / Neon)            │
│       - Tables: users, recruiters, jobs, candidates,        │
│                 applications, status_history, interviews,    │
│                 scorecards, notifications                   │
│       - Automatic schema migrations via SQLAlchemy          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Step 1: Provision Managed PostgreSQL Database

You can provision a managed PostgreSQL instance on **Render**, **Neon**, **Supabase**, or **AWS RDS**.

### Using Render PostgreSQL (Recommended for simplicity)
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **PostgreSQL**.
3. Configure the database:
   - **Name**: `talentpulse-db`
   - **Database**: `recruitment_db`
   - **User**: `postgres`
   - **Region**: Choose the region closest to your users (e.g., Oregon or Frankfurt).
   - **Plan**: Select **Free** (or Starter/Standard for production workloads).
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL** (for Render web service) or **External Database URL** (for external/local access):
   ```
   postgresql://postgres:<PASSWORD>@dpg-xxxxx.render.com/recruitment_db
   ```

---

## 3. Step 2: Deploy Backend to Render

### Option A: Using Render Blueprint (`render.yaml`) — Fastest
1. Fork or push the repository to your GitHub account.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** and choose **Blueprint**.
3. Connect your GitHub repository.
4. Render will read `render.yaml` and configure both the database and web service automatically.
5. In the environment variables prompt, enter your `GEMINI_API_KEY` (optional) and your Vercel frontend URL for `BACKEND_CORS_ORIGINS`.
6. Click **Apply**.

### Option B: Manual Web Service Setup on Render
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name**: `talentpulse-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables under the **Environment** tab:
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `DATABASE_URL` | `postgresql://...` | Connection string from Step 1 |
   | `SECRET_KEY` | `openssl rand -hex 32` | 64-char random hex string |
   | `ALGORITHM` | `HS256` | JWT signing algorithm |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | 24-hour expiration |
   | `GEMINI_API_KEY` | `AIzaSy...` | Optional: Your Gemini API Key |
   | `GEMINI_MODEL` | `gemini-1.5-flash` | Gemini model tag |
   | `BACKEND_CORS_ORIGINS` | `["https://your-app.vercel.app"]` | Allowed frontend domains |
5. Click **Create Web Service**.
6. When deployment finishes, copy your Render service URL:
   `https://talentpulse-backend.onrender.com`
7. Verify by opening `https://talentpulse-backend.onrender.com/docs` in your browser to inspect Swagger API docs.

---

## 4. Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. In the project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build` (or `tsc -b && vite build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://talentpulse-backend.onrender.com` | Your live Render backend URL |
6. Click **Deploy**.
7. Vercel will build the frontend assets and provision an SSL-secured URL:
   `https://talentpulse-ai.vercel.app`
8. In Render, update `BACKEND_CORS_ORIGINS` to include this production Vercel domain.

---

## 5. Security & Verification Checklist

- [x] **File Security**: Only `.pdf` files accepted; files > 15MB are rejected with HTTP 400.
- [x] **Filename Sanitization**: Uploaded resumes prefixed with UUIDs to prevent directory traversal or collision.
- [x] **Protected Routes**: Frontend redirects unauthenticated visitors to `/login`.
- [x] **JWT Token Storage**: Auth tokens stored with automatic expiration headers.
- [x] **Role-Based Access Control**: Sensitive actions (delete job, update recruiter role) protected by `role_required(["SUPER_ADMIN", "RECRUITER"])`.
- [x] **Secret Isolation**: `GEMINI_API_KEY` and `SECRET_KEY` are kept on the server and never returned in API payloads.
- [x] **Client-Side Routing**: `vercel.json` provides SPA routing rewrites to `/index.html`.

---

## 6. Maintenance & Operations

### Health Checks
- Live endpoint: `GET /health` returns:
  ```json
  {"status": "ok", "timestamp": "2026-11-19T13:25:00Z"}
  ```

### Database Backups
- Render provides automated daily backups for managed PostgreSQL.
- Manual backup via CLI:
  ```bash
  pg_dump -d "$DATABASE_URL" -F c -b -v -f backup.dump
  ```
