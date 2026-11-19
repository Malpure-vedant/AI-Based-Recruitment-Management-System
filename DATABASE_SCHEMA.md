# TalentPulse AI — Database Schema Documentation

> **Engine:** PostgreSQL 15+ (SQLite for local dev)  
> **ORM:** SQLAlchemy 2.x  
> **Migrations:** Alembic  
> **Tables:** 10  
> **Generated:** 2025 — TalentPulse AI Recruitment Management System

---

## ER Diagram

```mermaid
erDiagram
    users {
        string id PK
        string email UK
        string hashed_password
        string full_name
        string role
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    recruiters {
        string id PK
        string user_id FK
        string department
        string title
        string phone
        integer hiring_quota
        datetime created_at
        datetime updated_at
    }

    candidates {
        string id PK
        string user_id FK
        string full_name
        string email UK
        string phone
        string current_title
        string current_company
        string location
        text summary
        float experience_years
        string education_level
        string linkedin_url
        string github_url
        string portfolio_url
        string status
        string avatar_url
        datetime created_at
        datetime updated_at
    }

    candidate_skills {
        string id PK
        string candidate_id FK
        string skill_name
        string proficiency
        integer years_of_experience
        boolean is_verified
        datetime created_at
    }

    jobs {
        string id PK
        string recruiter_id FK
        string title
        string department
        string location
        string job_type
        string experience_level
        decimal min_salary
        decimal max_salary
        string salary_currency
        integer openings
        string status
        text description
        json responsibilities
        json required_skills
        json preferred_skills
        json scoring_weights
        datetime created_at
        datetime updated_at
    }

    resumes {
        string id PK
        string candidate_id FK
        string file_path
        string original_filename
        integer file_size_bytes
        string mime_type
        string file_hash UK
        boolean is_primary
        text parsed_text
        json parsed_metadata
        string upload_status
        datetime created_at
        datetime updated_at
    }

    applications {
        string id PK
        string job_id FK
        string candidate_id FK
        string resume_id FK
        string status
        text cover_letter
        decimal overall_match_score
        decimal technical_score
        decimal experience_score
        decimal education_score
        decimal domain_score
        string ai_verdict
        text ai_summary
        json matched_skills
        json missing_skills
        json strengths
        json weaknesses
        json suggested_questions
        boolean is_shortlisted
        datetime shortlisted_at
        text rejection_reason
        datetime applied_at
        datetime updated_at
    }

    interviews {
        string id PK
        string application_id FK
        string interviewer_id FK
        string interviewer_name
        string interview_round
        datetime scheduled_at
        integer duration_minutes
        string meeting_link
        string meeting_platform
        string location
        string notes
        string status
        datetime created_at
        datetime updated_at
    }

    interview_feedback {
        string id PK
        string interview_id FK
        string interviewer_id FK
        string overall_recommendation
        integer rating
        integer technical_score
        integer communication_score
        integer problem_solving_score
        integer cultural_fit_score
        text strengths_noted
        text concerns_noted
        text detailed_feedback
        datetime submitted_at
        datetime updated_at
    }

    notifications {
        string id PK
        string user_id FK
        string title
        text message
        string notification_type
        boolean is_read
        datetime read_at
        string related_entity_type
        string related_entity_id
        datetime created_at
    }

    users ||--o| recruiters : "has profile"
    users ||--o| candidates : "may have account"
    users ||--o{ interviews : "conducts"
    users ||--o{ interview_feedback : "submits"
    users ||--o{ notifications : "receives"

    recruiters ||--o{ jobs : "posts"

    candidates ||--o{ candidate_skills : "has"
    candidates ||--o{ resumes : "uploads"
    candidates ||--o{ applications : "submits"

    jobs ||--o{ applications : "receives"

    resumes ||--o{ applications : "attached to"

    applications ||--o{ interviews : "leads to"

    interviews ||--o| interview_feedback : "receives"
```

---

## Table Definitions

### 1. `users`
Central authentication & authorization table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Login identifier |
| `hashed_password` | VARCHAR(255) | NOT NULL | bcrypt hash |
| `full_name` | VARCHAR(150) | NOT NULL | Display name |
| `role` | VARCHAR(50) | NOT NULL, INDEX | SUPER_ADMIN / RECRUITER / INTERVIEWER / CANDIDATE |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft-disable without deletion |
| `created_at` | TIMESTAMPTZ | NOT NULL | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Auto-updated on change |

**Constraints:**
- `CHECK (role IN ('SUPER_ADMIN', 'RECRUITER', 'INTERVIEWER', 'CANDIDATE'))`

---

### 2. `recruiters`
Recruiter-specific profile linked 1:1 to a user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `user_id` | VARCHAR(36) | FK→users, UNIQUE, INDEX | Owning user |
| `department` | VARCHAR(100) | NOT NULL, INDEX | e.g. "Engineering" |
| `title` | VARCHAR(150) | NOT NULL | Job title |
| `phone` | VARCHAR(50) | — | Contact number |
| `hiring_quota` | INTEGER | DEFAULT 10 | Max open requisitions |
| `created_at` | TIMESTAMPTZ | NOT NULL | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | — |

**Constraints:**
- `CHECK (hiring_quota >= 0)`

---

### 3. `candidates`
Talent pool — unique by email to prevent duplicates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `user_id` | VARCHAR(36) | FK→users, UNIQUE, nullable | Linked account |
| `full_name` | VARCHAR(200) | NOT NULL | Deduplication anchor |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Primary dedup key |
| `phone` | VARCHAR(50) | INDEX | Contact |
| `current_title` | VARCHAR(200) | — | Current job title |
| `current_company` | VARCHAR(150) | — | Employer |
| `location` | VARCHAR(150) | — | City, Country |
| `summary` | TEXT | — | Professional bio |
| `experience_years` | FLOAT | DEFAULT 0.0 | Total YoE |
| `education_level` | VARCHAR(150) | — | Highest degree |
| `linkedin_url` | VARCHAR(255) | — | LinkedIn profile |
| `github_url` | VARCHAR(255) | — | GitHub profile |
| `portfolio_url` | VARCHAR(255) | — | Personal site |
| `status` | VARCHAR(50) | INDEX | ACTIVE / PASSIVE / HIRED / ARCHIVED |
| `avatar_url` | VARCHAR(255) | — | Profile picture URL |
| `created_at` | TIMESTAMPTZ | NOT NULL | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | — |

**Constraints:**
- `CHECK (experience_years >= 0.0)`
- `CHECK (status IN ('ACTIVE','PASSIVE','HIRED','ARCHIVED'))`

---

### 4. `candidate_skills`
Normalized skill tags for a candidate (queryable, filterable).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `candidate_id` | VARCHAR(36) | FK→candidates, INDEX | Owner |
| `skill_name` | VARCHAR(100) | NOT NULL, INDEX | e.g. "Python" |
| `proficiency` | VARCHAR(50) | NOT NULL | BEGINNER / INTERMEDIATE / ADVANCED / EXPERT |
| `years_of_experience` | INTEGER | DEFAULT 0 | Years using this skill |
| `is_verified` | BOOLEAN | DEFAULT FALSE | Verified by assessment |
| `created_at` | TIMESTAMPTZ | NOT NULL | — |

**Constraints:**
- `UNIQUE (candidate_id, skill_name)` — prevents duplicate skill entries
- `CHECK (proficiency IN ('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT'))`
- `CHECK (years_of_experience >= 0)`

---

### 5. `jobs`
Job requisitions posted by recruiters.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `recruiter_id` | VARCHAR(36) | FK→recruiters, nullable, INDEX | Posting recruiter |
| `title` | VARCHAR(200) | NOT NULL, INDEX | Position title |
| `department` | VARCHAR(100) | NOT NULL, INDEX | e.g. "Engineering" |
| `location` | VARCHAR(150) | DEFAULT "Remote" | Office/remote |
| `job_type` | VARCHAR(50) | NOT NULL | Full-time / Part-time / Contract / Remote / Internship |
| `experience_level` | VARCHAR(50) | NOT NULL | Entry / Mid-Level / Senior / Lead / Executive |
| `min_salary` | NUMERIC(12,2) | nullable | Compensation floor |
| `max_salary` | NUMERIC(12,2) | nullable | Compensation ceiling |
| `salary_currency` | VARCHAR(10) | DEFAULT "USD" | ISO currency |
| `openings` | INTEGER | DEFAULT 1 | Headcount |
| `status` | VARCHAR(50) | INDEX | DRAFT / OPEN / PAUSED / CLOSED |
| `description` | TEXT | NOT NULL | Full JD |
| `responsibilities` | JSON | DEFAULT [] | Bulleted duties |
| `required_skills` | JSON | DEFAULT [] | Must-have skills |
| `preferred_skills` | JSON | DEFAULT [] | Nice-to-have skills |
| `scoring_weights` | JSON | DEFAULT {...} | AI scoring config (must sum to 1.0) |
| `created_at` | TIMESTAMPTZ | NOT NULL | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | — |

**Constraints:**
- `CHECK (openings > 0)`
- `CHECK (status IN ('DRAFT','OPEN','PAUSED','CLOSED'))`
- `CHECK (job_type IN ('Full-time','Part-time','Contract','Remote','Internship'))`
- `CHECK (experience_level IN ('Entry','Mid-Level','Senior','Lead','Executive'))`

---

### 6. `resumes`
Resume file metadata — filesystem path stored, never binary.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `candidate_id` | VARCHAR(36) | FK→candidates, INDEX | Owner |
| `file_path` | VARCHAR(500) | NOT NULL | Relative path on disk / S3 key |
| `original_filename` | VARCHAR(255) | NOT NULL | Uploaded filename |
| `file_size_bytes` | INTEGER | NOT NULL | File size |
| `mime_type` | VARCHAR(100) | DEFAULT "application/pdf" | MIME type |
| `file_hash` | VARCHAR(128) | INDEX | SHA-256 hex — deduplication key |
| `is_primary` | BOOLEAN | DEFAULT TRUE | Active resume |
| `parsed_text` | TEXT | nullable | PyMuPDF extracted text |
| `parsed_metadata` | JSON | DEFAULT {} | Pages, word count, contact detected |
| `upload_status` | VARCHAR(50) | NOT NULL | PENDING / PROCESSING / COMPLETED / FAILED |
| `created_at` | TIMESTAMPTZ | NOT NULL | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | — |

**Constraints:**
- `CHECK (file_size_bytes > 0)`
- `CHECK (upload_status IN ('PENDING','PROCESSING','COMPLETED','FAILED'))`

> [!IMPORTANT]
> Resume PDFs are stored on the **filesystem** (or S3). The `file_path` column holds a relative path, never binary content. This keeps the database lean and scalable.

---

### 7. `applications`
Links a candidate to a job; holds AI screening results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `job_id` | VARCHAR(36) | FK→jobs, INDEX | Applied job |
| `candidate_id` | VARCHAR(36) | FK→candidates, INDEX | Applicant |
| `resume_id` | VARCHAR(36) | FK→resumes, nullable | Resume used |
| `status` | VARCHAR(50) | INDEX | APPLIED / SCREENING / SHORTLISTED / INTERVIEW / OFFERED / HIRED / REJECTED |
| `cover_letter` | TEXT | nullable | Applicant's message |
| `overall_match_score` | NUMERIC(5,2) | 0–100 | Composite AI score |
| `technical_score` | NUMERIC(5,2) | 0–100 | Technical skills score |
| `experience_score` | NUMERIC(5,2) | 0–100 | Experience match score |
| `education_score` | NUMERIC(5,2) | 0–100 | Education match score |
| `domain_score` | NUMERIC(5,2) | 0–100 | Domain expertise score |
| `ai_verdict` | VARCHAR(50) | nullable | STRONG_FIT / FIT / WEAK_FIT / NOT_FIT |
| `ai_summary` | TEXT | nullable | AI-generated summary |
| `matched_skills` | JSON | nullable | Skills found in both JD and resume |
| `missing_skills` | JSON | nullable | Skills in JD but missing in resume |
| `strengths` | JSON | nullable | Candidate strengths |
| `weaknesses` | JSON | nullable | Candidate weaknesses |
| `suggested_questions` | JSON | nullable | AI-generated interview questions |
| `is_shortlisted` | BOOLEAN | DEFAULT FALSE | Manual/AI shortlist flag |
| `shortlisted_at` | TIMESTAMPTZ | nullable | When shortlisted |
| `rejection_reason` | TEXT | nullable | Rejection notes |
| `applied_at` | TIMESTAMPTZ | NOT NULL | Submission time |
| `updated_at` | TIMESTAMPTZ | NOT NULL | — |

**Constraints:**
- `UNIQUE (job_id, candidate_id)` — one application per job per candidate
- `CHECK (status IN ('APPLIED','SCREENING','SHORTLISTED','INTERVIEW','OFFERED','HIRED','REJECTED'))`
- `CHECK (ai_verdict IN ('STRONG_FIT','FIT','WEAK_FIT','NOT_FIT') OR ai_verdict IS NULL)`
- `CHECK (overall_match_score IS NULL OR overall_match_score BETWEEN 0 AND 100)`

**Indexes:**
- `(job_id, overall_match_score)` — fast ranking query

---

### 8. `interviews`
Scheduled interview sessions (one application → many rounds).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `application_id` | VARCHAR(36) | FK→applications, INDEX | Parent application |
| `interviewer_id` | VARCHAR(36) | FK→users, nullable | System user interviewer |
| `interviewer_name` | VARCHAR(150) | nullable | External interviewer name |
| `interview_round` | VARCHAR(100) | NOT NULL | e.g. "Technical Round 1" |
| `scheduled_at` | TIMESTAMPTZ | NOT NULL | Interview date/time |
| `duration_minutes` | INTEGER | DEFAULT 60 | Length |
| `meeting_link` | VARCHAR(255) | nullable | Video call URL |
| `meeting_platform` | VARCHAR(50) | nullable | Zoom / Google Meet / MS Teams / In-Person / Phone |
| `location` | VARCHAR(255) | nullable | Physical venue |
| `notes` | VARCHAR(1000) | nullable | Pre-interview notes |
| `status` | VARCHAR(50) | INDEX | SCHEDULED / COMPLETED / CANCELLED / NO_SHOW |
| `created_at` | TIMESTAMPTZ | NOT NULL | — |
| `updated_at` | TIMESTAMPTZ | NOT NULL | — |

**Constraints:**
- `CHECK (status IN ('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW'))`
- `CHECK (duration_minutes > 0)`

---

### 9. `interview_feedback`
Post-interview scorecard — one per interview (1:1).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `interview_id` | VARCHAR(36) | FK→interviews, UNIQUE | Parent interview |
| `interviewer_id` | VARCHAR(36) | FK→users, nullable | Submitting interviewer |
| `overall_recommendation` | VARCHAR(50) | NOT NULL | STRONG_HIRE / HIRE / NO_HIRE / STRONG_NO_HIRE |
| `rating` | INTEGER | 1–5 | Overall interview rating |
| `technical_score` | INTEGER | 1–5, nullable | Technical ability |
| `communication_score` | INTEGER | 1–5, nullable | Communication skills |
| `problem_solving_score` | INTEGER | 1–5, nullable | Problem solving |
| `cultural_fit_score` | INTEGER | 1–5, nullable | Culture fit |
| `strengths_noted` | TEXT | nullable | Observed strengths |
| `concerns_noted` | TEXT | nullable | Observed concerns |
| `detailed_feedback` | TEXT | nullable | Full narrative |
| `submitted_at` | TIMESTAMPTZ | NOT NULL | Submission time |
| `updated_at` | TIMESTAMPTZ | NOT NULL | — |

**Constraints:**
- `CHECK (overall_recommendation IN ('STRONG_HIRE','HIRE','NO_HIRE','STRONG_NO_HIRE'))`
- `CHECK (rating BETWEEN 1 AND 5)`
- `CHECK (technical_score IS NULL OR technical_score BETWEEN 1 AND 5)` (and similar for all rating columns)

---

### 10. `notifications`
In-app notification messages delivered to users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR(36) | PK | UUID v4 |
| `user_id` | VARCHAR(36) | FK→users, INDEX | Recipient |
| `title` | VARCHAR(200) | NOT NULL | Short heading |
| `message` | TEXT | NOT NULL | Full message body |
| `notification_type` | VARCHAR(50) | NOT NULL | INFO / SUCCESS / WARNING / ALERT |
| `is_read` | BOOLEAN | DEFAULT FALSE | Read state |
| `read_at` | TIMESTAMPTZ | nullable | When marked read |
| `related_entity_type` | VARCHAR(50) | nullable | e.g. "Application", "Interview" |
| `related_entity_id` | VARCHAR(36) | nullable | UUID of related object |
| `created_at` | TIMESTAMPTZ | NOT NULL | — |

**Constraints:**
- `CHECK (notification_type IN ('INFO','SUCCESS','WARNING','ALERT'))`

**Indexes:**
- `(user_id, is_read)` — fast unread count
- `created_at DESC` — newest first

---

## Relationships Summary

| Relationship | Type | Description |
|---|---|---|
| users → recruiters | 1:0..1 | A user can have one recruiter profile |
| users → candidates | 1:0..1 | A user can have one candidate profile |
| users → interviews | 1:N | An interviewer conducts many interviews |
| users → interview_feedback | 1:N | An interviewer gives many feedbacks |
| users → notifications | 1:N | A user receives many notifications |
| recruiters → jobs | 1:N | A recruiter posts many jobs |
| candidates → candidate_skills | 1:N | A candidate has many skills |
| candidates → resumes | 1:N | A candidate uploads many resumes |
| candidates → applications | 1:N | A candidate submits many applications |
| jobs → applications | 1:N | A job receives many applications |
| resumes → applications | 1:N | A resume is used in many applications |
| applications → interviews | 1:N | An application leads to many interview rounds |
| interviews → interview_feedback | 1:0..1 | Each interview has at most one feedback |

---

## Database Indexes

| Index Name | Table | Columns | Purpose |
|---|---|---|---|
| `ix_users_email` | users | email | Login lookup |
| `ix_users_role` | users | role | RBAC filtering |
| `ix_candidates_email` | candidates | email | Deduplication lookup |
| `ix_candidates_name` | candidates | full_name | Search |
| `ix_candidates_status` | candidates | status | Pool filtering |
| `ix_jobs_title` | jobs | title | Search |
| `ix_jobs_status_department` | jobs | status, department | Filtered listing |
| `ix_applications_job_score` | applications | job_id, overall_match_score | AI ranking |
| `ix_applications_status` | applications | status | Pipeline filtering |
| `ix_interviews_interviewer_scheduled` | interviews | interviewer_id, scheduled_at | Calendar view |
| `ix_notifications_user_unread` | notifications | user_id, is_read | Unread count |
| `ix_resumes_file_hash` | resumes | file_hash | Deduplication |

---

## Seed Data Summary

The seed script (`backend/db/seed.py`) creates:

| Table | Records | Notes |
|---|---|---|
| users | 3 | 1 SUPER_ADMIN, 1 RECRUITER, 1 INTERVIEWER |
| recruiters | 2 | Linked to Sarah Jenkins & Mike Chen |
| candidates | 3 | Alex Morgan, Jasmine Patel, Carlos Rivera |
| candidate_skills | 11 | Across 3 candidates |
| jobs | 3 | 2 OPEN, 1 DRAFT |
| resumes | 2 | File path metadata only |
| applications | 3 | With AI scoring data |
| interviews | 2 | 1 SCHEDULED, 1 COMPLETED |
| interview_feedback | 1 | Jasmine Patel — STRONG_HIRE |
| notifications | 3 | Unread in-app alerts |

---

## Migration Commands

```bash
# From backend/ directory:

# Create a new migration after model changes
alembic revision --autogenerate -m "describe_your_change"

# Apply all pending migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# Show current state
alembic current

# View history
alembic history --verbose

# Re-seed the database
python db/seed.py
```

---

## Environment Configuration

```env
# PostgreSQL (production)
DATABASE_URL=postgresql://user:password@localhost:5432/recruitment_db

# SQLite (local dev — auto-fallback if PostgreSQL unavailable)
DATABASE_URL=sqlite:///./recruitment.db
```
