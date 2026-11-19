# AI-Based Recruitment Management System (TalentPulse AI)

An enterprise-grade, full-stack **AI-Powered Recruitment Management System (RMS / ATS)** designed to streamline end-to-end recruitment pipelines, parse resumes using layout-preserved extraction, evaluate candidates against custom job rubrics using **Google Gemini AI**, and empower hiring teams with real-time candidate ranking and collaborative scorecards.

---

## 🚀 Key Features

- **Decoupled Architecture:** Single Page Application (SPA) built with React 19, Vite, and Tailwind CSS v4 consuming modular FastAPI microservices.
- **Explainable AI Screening (XAI):** Multi-dimensional scoring evaluating Technical Skills (40%), Experience Depth (35%), Education (15%), and Domain Alignment (10%) with verified skills vs. missing gaps.
- **Deterministic Document Parsing:** Layout-preserved, multi-column PDF text extraction powered by **PyMuPDF (`fitz`)**.
- **Interactive Kanban Pipeline:** 7-stage candidate progression (`Applied` $\to$ `AI Screened` $\to$ `Shortlisted` $\to$ `Interview` $\to$ `Offered` $\to$ `Hired` $\to$ `Rejected`) with 1-click stage advancement.
- **AI Candidate Ranking Leaderboard:** Deterministic candidate stack-ranking with gold/silver/bronze podium displays, minimum score threshold filters, and head-to-head candidate comparison.
- **Interview Coordination & Collaborative Scorecards:** Schedule rounds with Google Meet/Teams links, criteria ratings (1–5 stars), and Gemini-generated interview questions tailored specifically to candidate resume gaps.
- **Talent Analytics Telemetry:** Interactive hiring velocity charts, candidate department spread, AI score distributions, and application sourcing channels.
- **Role-Based Access Control (RBAC):** Strict JWT bearer token authentication with role-guarded routes (`SUPER_ADMIN`, `RECRUITER`, `INTERVIEWER`, `CANDIDATE`).

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts |
| **Backend** | Python 3.12+, FastAPI, Uvicorn, Pydantic v2 |
| **ORM & Database** | SQLAlchemy 2.0, PostgreSQL (with SQLite fallback for local development) |
| **Authentication** | JWT (JSON Web Tokens), bcrypt password hashing, RBAC |
| **Document Parsing** | PyMuPDF (`fitz`) |
| **Artificial Intelligence** | Google Gemini API (Gemini 1.5 Flash / 2.0 Flash) |

---

## 📂 Project Structure

```
.
├── ARCHITECTURE.md                  # Comprehensive architectural specification
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py              # Auth & RBAC dependency injection
│   │   │   └── v1/
│   │   │       ├── router.py        # Central API router
│   │   │       └── endpoints/       # Modular endpoints (auth, candidates, jobs, etc.)
│   │   ├── core/                    # Security, database connection, config settings
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   ├── schemas/                 # Pydantic v2 validation DTOs
│   │   └── services/                # PyMuPDF resume parser & Gemini AI scoring engine
│   ├── uploads/resumes/             # Secure PDF file storage
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example                 # Environment configuration template
│   └── main.py                      # FastAPI ASGI entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/              # Shadcn UI reusable components, layout shells
│   │   ├── context/                 # Reactive state provider (AppContext)
│   │   ├── data/                    # High-fidelity mock datasets
│   │   ├── pages/                   # All 12 SaaS dashboard pages
│   │   ├── routes/                  # React Router v7 routes
│   │   └── types/                   # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## ⚙️ Getting Started

### 1. Backend Setup (FastAPI)

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials and Gemini API key (optional)
   ```
5. Start the FastAPI development server:
   ```bash
   python main.py
   # Or using uvicorn:
   uvicorn main:app --reload --port 8000
   ```
6. Open interactive API docs:
   - **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

*Default Admin Account (auto-seeded):*  
- **Email:** `sarah.jenkins@hireai.enterprise`  
- **Password:** `admin123`

---

### 2. Frontend Setup (React + Vite)

1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open the application at **`http://localhost:5173`**.

---

## 📖 Interactive API Modules

1. **Authentication (`/api/v1/auth`):** User registration, JWT login, profile lookup, role verification.
2. **Candidates (`/api/v1/candidates`):** Candidate profile creation, full-text search, pagination, and detail updates.
3. **Jobs (`/api/v1/jobs`):** Requisition management, custom criteria weight configurations, and status transitions.
4. **Applications (`/api/v1/applications`):** Public job application submission, automated scoring, and pipeline status advancement.
5. **Resumes (`/api/v1/resumes`):** PDF file upload, text layout extraction using PyMuPDF, and secure streaming downloads.
6. **Interviews (`/api/v1/interviews`):** Scheduling, video conference links, and interviewer scorecards with 1–5 star ratings.

---

## 📄 License
This project is licensed under the MIT License.
