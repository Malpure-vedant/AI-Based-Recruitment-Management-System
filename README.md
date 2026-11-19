# AI-Based Recruitment Management System (TalentPulse AI)

An enterprise-grade, full-stack **AI-Powered Recruitment Management System (RMS / ATS)** designed to streamline end-to-end recruitment pipelines, parse resumes using layout-preserved extraction, evaluate candidates against custom job rubrics using **Google Gemini AI**, and empower hiring teams with real-time candidate ranking, collaborative interview scorecards, and dynamic telemetry analytics.

---

## 🚀 Key Modules & Capabilities

1. **Authentication & Authorization:** Secure JWT Bearer authentication, bcrypt hashing, and Role-Based Access Control (`SUPER_ADMIN`, `RECRUITER`, `INTERVIEWER`, `CANDIDATE`).
2. **Requisition & Job Management:** Create, pause, and close requisitions with customizable criteria scoring weights (skills, experience, education, domain).
3. **Candidate Registry & Deduplication:** Unified candidate profiles with email deduplication and fast multi-term search.
4. **Resume Processing & Security:** PDF file layout parsing via **PyMuPDF (`fitz`)**, MIME-type validation, 15MB file size boundary enforcement, and UUID-prefixed file storage.
5. **Explainable AI Screening (XAI):** Google Gemini 1.5 Flash evaluation with fallback to a deterministic rubric scoring engine when offline or when no API key is provided.
6. **Candidate Ranking Leaderboard:** Automated stack-ranking by match percentage with gold/silver/bronze podium indicators and side-by-side candidate comparison.
7. **Recruitment Pipeline Kanban:** Interactive 7-stage board (`APPLIED` $\to$ `SCREENING` $\to$ `SHORTLISTED` $\to$ `INTERVIEW` $\to$ `OFFERED` $\to$ `HIRED` $\to$ `REJECTED`) backed by PostgreSQL status history audit logging.
8. **Interview Management:** Round scheduling, Google Meet/Teams links, criteria scorecards (1–5 stars), and in-app recruiter notifications.
9. **Analytics Telemetry:** 5 dynamic Recharts visualizations (Applications Over Time, Status Distribution, Job-wise Applications, Recruitment Funnel, Interview Outcomes) and 8 real-time KPIs.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0 |
| **Database** | Managed PostgreSQL (with local SQLite development fallback) |
| **Authentication** | JWT (HMAC SHA-256), bcrypt, Role-Based Access Control (RBAC) |
| **PDF Extraction** | PyMuPDF (`fitz` / `pymupdf`) |
| **Artificial Intelligence** | Google Gemini API (`gemini-1.5-flash`) + Deterministic Rubric Engine |
| **Cloud Deployment** | Vercel (Frontend), Render (Backend), Managed PostgreSQL (Neon / Render) |

---

## 🧪 Comprehensive Automated Testing & Verification

The system includes an automated test suite verifying all 12 operational domains and security controls:

```bash
# Run the complete test suite
python backend/tests/test_comprehensive_suite.py
```

### Verified Test Domains
- [x] **Test 1**: User Registration & Login (Duplicate email rejection 400, bad credential rejection 401)
- [x] **Test 2**: JWT Authentication (HMAC SHA-256 token creation, expiration check, Bearer context validation)
- [x] **Test 3**: Job Creation & Requisition Management (Openings constraint, lifecycle transitions `OPEN` $\to$ `PAUSED` $\to$ `OPEN`)
- [x] **Test 4**: Candidate Registration & Deduplication (Email uniqueness constraint, query term search)
- [x] **Test 5**: Resume Uploading & Security Controls (PDF validation, non-PDF rejection 400, >15MB rejection 400)
- [x] **Test 6**: PDF Text Extraction (PyMuPDF layout-preserving text & entity extraction)
- [x] **Test 7**: Gemini AI Integration (AI screening evaluation, structured JSON schema response, rubric fallback)
- [x] **Test 8**: Candidate Screening & Persistence (Deterministic scoring weights, database persistence)
- [x] **Test 9**: Recruitment Pipeline & Kanban (Status transitions, immutable audit trail logging)
- [x] **Test 10**: Interview Management & Feedback (Scheduling, in-app notifications, 5-star scorecard submission)
- [x] **Test 11**: Analytics Telemetry (Dynamic KPIs and 5 Recharts data payloads computed from real records)
- [x] **Test 12**: API Validation & Secret Isolation (Pydantic boundaries, 404 handlers, zero API key leakage)

---

## ⚙️ Local Development Setup

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python main.py
```
API Documentation:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

*Default Seeded Recruiter Credentials:*
- **Email:** `sarah.jenkins@hireai.enterprise`
- **Password:** `admin123`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). The Vite dev proxy automatically routes `/api` requests to `http://127.0.0.1:8000`.

---

## 🚀 Production Deployment

Detailed instructions for deploying the system are documented in **[DEPLOYMENT.md](file:///DEPLOYMENT.md)**.

### Quick Deployment Summary:
1. **Managed PostgreSQL**: Provision a database instance on Render, Neon, or Supabase and copy the connection string.
2. **Backend (Render)**:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Configure Environment Variables: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `GEMINI_API_KEY`, `BACKEND_CORS_ORIGINS`.
3. **Frontend (Vercel)**:
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL` set to your Render backend URL.

---

## 🔒 Security Summary

- **File Type & Size Restrictions**: Uploads restricted to `.pdf` and capped at 15MB.
- **Sanitized Filenames**: Random UUID prefixes prevent file collisions and directory traversal attacks.
- **Role-Based Protection**: Destructive and administrative operations restricted to `SUPER_ADMIN` and `RECRUITER`.
- **Environment Isolation**: API keys and secrets are loaded from environment variables and never returned in API responses.
- **CORS Allowlist**: Configurable CORS prevents unauthorized cross-origin requests in production.

---

## 📄 License
This project is licensed under the MIT License.
