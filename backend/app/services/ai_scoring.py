"""
Production-quality Gemini AI Resume Screening Engine.
Falls back to a deterministic rubric engine when Gemini is unavailable.
"""
import json
import re
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Extended skill keyword list for rubric fallback detection
# ---------------------------------------------------------------------------
SKILL_KEYWORDS: List[str] = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby",
    "Kotlin", "Swift", "PHP", "Scala", "R", "MATLAB",
    "React", "Next.js", "Vue.js", "Angular", "Svelte", "Node.js", "Express",
    "FastAPI", "Django", "Flask", "Spring Boot", "Rails", "Laravel",
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Cassandra", "DynamoDB",
    "Elasticsearch", "Neo4j",
    "Docker", "Kubernetes", "Terraform", "Ansible", "Helm", "ArgoCD",
    "AWS", "GCP", "Azure", "Heroku", "Vercel", "Netlify",
    "CI/CD", "GitHub Actions", "Jenkins", "CircleCI", "GitLab CI",
    "Git", "GitHub", "Bitbucket",
    "PyTorch", "TensorFlow", "Scikit-Learn", "Keras", "Hugging Face",
    "LLMs", "LangChain", "Vector Databases", "OpenAI", "Gemini",
    "Kafka", "RabbitMQ", "Celery", "gRPC", "REST API", "GraphQL", "WebSocket",
    "Linux", "Bash", "Prometheus", "Grafana",
    "SQLAlchemy", "Prisma", "Hibernate",
    "System Design", "Microservices", "Event-Driven Architecture",
    "Tailwind CSS", "Bootstrap", "Material UI", "Figma",
    "Agile", "Scrum", "Kanban", "JIRA",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Data Analysis", "Pandas", "NumPy", "Spark", "Hadoop",
    "iOS", "Android", "React Native", "Flutter",
]

EDUCATION_KEYWORDS: Dict[str, int] = {
    "phd": 100, "ph.d": 100, "doctorate": 100,
    "master": 85, "m.s.": 85, "m.e.": 85, "mba": 85, "m.tech": 85,
    "bachelor": 70, "b.s.": 70, "b.e.": 70, "b.tech": 70, "undergraduate": 65,
    "associate": 50, "diploma": 40, "bootcamp": 35, "certification": 30,
}

EXPERIENCE_PATTERNS: List[re.Pattern] = [
    re.compile(r'(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience|exp)', re.I),
    re.compile(r'(\d{4})\s*[-–]\s*(?:present|current|now)', re.I),
]


# ---------------------------------------------------------------------------
# Import ScreeningResult lazily to avoid circular imports at module load
# ---------------------------------------------------------------------------
def _get_screening_result_class():
    from app.schemas.screening import ScreeningResult, EducationItem, WorkExperienceItem, ProjectItem
    return ScreeningResult, EducationItem, WorkExperienceItem, ProjectItem


# ---------------------------------------------------------------------------
# Main service class
# ---------------------------------------------------------------------------
class GeminiScreeningService:
    """
    AI-powered resume screening service.

    Uses Google Gemini as the primary engine and falls back to a
    deterministic rubric engine when Gemini is unavailable or the API
    key is not configured.
    """

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def screen_resume(self, job: Dict[str, Any], resume_text: str):
        """
        Screen a resume against a job description.

        Parameters
        ----------
        job:         dict representation of the Job model row
        resume_text: plain-text content of the candidate's resume

        Returns
        -------
        ScreeningResult (Pydantic model)
        """
        ScreeningResult, _, _, _ = _get_screening_result_class()

        if settings.GEMINI_API_KEY:
            try:
                raw = self._call_gemini(job, resume_text)
                result = self._parse_gemini_response(raw)
                result.engine_used = "gemini"
                result.screened_at = datetime.now(timezone.utc)
                return result
            except Exception as exc:
                logger.warning("Gemini screening failed (%s). Falling back to rubric.", exc)

        # Fallback
        result = self._rubric_fallback(job, resume_text)
        result.engine_used = "rubric_fallback"
        result.screened_at = datetime.now(timezone.utc)
        return result

    def evaluate_candidate(
        self,
        job_title: str,
        job_description: str,
        required_skills: List[str],
        scoring_weights: Dict[str, float],
        resume_text: str
    ) -> Dict[str, Any]:
        """Compatibility adapter for legacy callers returning raw dict format."""
        job_dict = {
            "title": job_title,
            "description": job_description,
            "required_skills": required_skills,
            "scoring_weights": scoring_weights
        }
        res = self.screen_resume(job_dict, resume_text)
        return {
            "match_score": res.overall_score,
            "technical_score": res.technical_score,
            "experience_score": res.experience_score,
            "education_score": res.education_score,
            "domain_score": res.domain_score,
            "verdict": res.verdict,
            "summary": res.screening_summary,
            "matched_skills": res.matched_skills,
            "missing_skills": res.missing_skills,
            "strengths": res.strengths,
            "weaknesses": res.areas_for_improvement,
            "suggested_questions": res.suggested_interview_questions
        }

    # ------------------------------------------------------------------
    # Gemini path
    # ------------------------------------------------------------------

    def _build_prompt(self, job: Dict[str, Any], resume_text: str) -> str:
        required_skills = job.get("required_skills", [])
        preferred_skills = job.get("preferred_skills", [])
        scoring_weights = job.get("scoring_weights", {
            "skills": 0.40, "experience": 0.35, "education": 0.15, "domain": 0.10
        })

        return f"""You are an expert senior technical recruiter performing an AI-assisted resume screening.

ETHICS GUARDRAIL: Do NOT infer or comment on gender, race, age, nationality, religion, disability, or any protected characteristic. Evaluate ONLY professional qualifications.

## Job Details
- Title: {job.get("title", "N/A")}
- Department: {job.get("department", "N/A")}
- Experience Level: {job.get("experience_level", "N/A")}
- Location: {job.get("location", "N/A")}
- Job Type: {job.get("job_type", "N/A")}
- Description: {job.get("description", "")[:2000]}
- Required Skills: {", ".join(required_skills) if required_skills else "Not specified"}
- Preferred Skills: {", ".join(preferred_skills) if preferred_skills else "Not specified"}
- Scoring Weights: skills={scoring_weights.get("skills", 0.4)}, experience={scoring_weights.get("experience", 0.35)}, education={scoring_weights.get("education", 0.15)}, domain={scoring_weights.get("domain", 0.10)}

## Candidate Resume
{resume_text[:5000]}

## Instructions
Analyze the resume against the job requirements and return a STRICT JSON object with EXACTLY these fields (no extra keys, no markdown):

{{
  "candidate_name": "Full name extracted from resume or 'Unknown'",
  "candidate_email": "email@example.com or null",
  "technical_skills": ["list of ALL technical skills found in resume"],
  "education": [{{"degree": "degree name", "institution": "university/college name", "year": "graduation year or empty string"}}],
  "work_experience": [{{"title": "job title", "company": "company name", "duration": "e.g. 2019-2022 or 3 years", "highlights": ["key achievement 1", "key achievement 2"]}}],
  "projects": [{{"name": "project name", "description": "brief description", "technologies": ["tech1", "tech2"]}}],
  "matched_skills": ["skills from required_skills list that appear in resume"],
  "missing_skills": ["required skills NOT found in resume"],
  "overall_score": 0.0,
  "technical_score": 0.0,
  "experience_score": 0.0,
  "education_score": 0.0,
  "domain_score": 0.0,
  "verdict": "STRONG_FIT",
  "screening_summary": "2-3 sentence human-readable explanation of fit.",
  "strengths": ["strength 1", "strength 2"],
  "areas_for_improvement": ["gap 1", "gap 2"],
  "suggested_interview_questions": ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"],
  "confidence_level": "HIGH",
  "disclaimer": "AI-generated screening. Must be reviewed by a human recruiter before making any hiring decisions."
}}

Scoring rules:
- overall_score = weighted average: (technical_score * {scoring_weights.get("skills", 0.4)}) + (experience_score * {scoring_weights.get("experience", 0.35)}) + (education_score * {scoring_weights.get("education", 0.15)}) + (domain_score * {scoring_weights.get("domain", 0.10)})
- verdict: STRONG_FIT (≥80), FIT (60-79), WEAK_FIT (40-59), NOT_FIT (<40)
- confidence_level: HIGH if many signals, MEDIUM if moderate, LOW if resume is sparse
- All scores must be floats between 0 and 100
- suggested_interview_questions must be exactly 5 tailored questions
"""

    def _call_gemini(self, job: Dict[str, Any], resume_text: str) -> str:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        prompt = self._build_prompt(job, resume_text)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return response.text

    def _parse_gemini_response(self, raw: str):
        ScreeningResult, EducationItem, WorkExperienceItem, ProjectItem = _get_screening_result_class()

        data: Dict[str, Any] = json.loads(raw)

        # Coerce nested objects
        education = [
            EducationItem(
                degree=e.get("degree", ""),
                institution=e.get("institution", ""),
                year=e.get("year")
            )
            for e in data.get("education", [])
            if isinstance(e, dict)
        ]

        work_experience = [
            WorkExperienceItem(
                title=w.get("title", ""),
                company=w.get("company", ""),
                duration=w.get("duration"),
                highlights=w.get("highlights", [])
            )
            for w in data.get("work_experience", [])
            if isinstance(w, dict)
        ]

        projects = [
            ProjectItem(
                name=p.get("name", ""),
                description=p.get("description"),
                technologies=p.get("technologies", [])
            )
            for p in data.get("projects", [])
            if isinstance(p, dict)
        ]

        return ScreeningResult(
            candidate_name=data.get("candidate_name", "Unknown"),
            candidate_email=data.get("candidate_email"),
            technical_skills=data.get("technical_skills", []),
            education=education,
            work_experience=work_experience,
            projects=projects,
            matched_skills=data.get("matched_skills", []),
            missing_skills=data.get("missing_skills", []),
            overall_score=float(data.get("overall_score", 0)),
            technical_score=float(data.get("technical_score", 0)),
            experience_score=float(data.get("experience_score", 0)),
            education_score=float(data.get("education_score", 0)),
            domain_score=float(data.get("domain_score", 0)),
            verdict=data.get("verdict", "NOT_FIT"),
            screening_summary=data.get("screening_summary", ""),
            strengths=data.get("strengths", []),
            areas_for_improvement=data.get("areas_for_improvement", []),
            suggested_interview_questions=data.get("suggested_interview_questions", []),
            confidence_level=data.get("confidence_level", "MEDIUM"),
            disclaimer=data.get(
                "disclaimer",
                "AI-generated screening. Must be reviewed by a human recruiter before making any hiring decisions."
            ),
        )

    # ------------------------------------------------------------------
    # Rubric fallback
    # ------------------------------------------------------------------

    def _rubric_fallback(self, job: Dict[str, Any], resume_text: str):
        """
        Deterministic rubric-based scoring engine.
        Returns the same ScreeningResult shape as the Gemini path.
        """
        ScreeningResult, EducationItem, WorkExperienceItem, ProjectItem = _get_screening_result_class()

        lower_resume = resume_text.lower()
        scoring_weights = job.get("scoring_weights", {
            "skills": 0.40, "experience": 0.35, "education": 0.15, "domain": 0.10
        })
        required_skills: List[str] = job.get("required_skills", [])
        preferred_skills: List[str] = job.get("preferred_skills", [])
        job_description: str = job.get("description", "")

        # ── Skill detection ─────────────────────────────────────────────
        all_job_skills = list({s.lower() for s in required_skills + preferred_skills})
        detected_skills: List[str] = []
        for skill in SKILL_KEYWORDS:
            pattern = rf'\b{re.escape(skill.lower())}\b'
            if re.search(pattern, lower_resume):
                detected_skills.append(skill)

        matched_skills = [s for s in required_skills if s.lower() in lower_resume]
        missing_skills = [s for s in required_skills if s.lower() not in lower_resume]

        technical_score = min(
            100.0,
            (len(matched_skills) / max(len(required_skills), 1)) * 70.0
            + (len(detected_skills) / max(len(SKILL_KEYWORDS), 1)) * 30.0
        )

        # ── Experience detection ─────────────────────────────────────────
        experience_years = 0
        for pattern in EXPERIENCE_PATTERNS:
            m = pattern.search(resume_text)
            if m:
                try:
                    val = int(m.group(1))
                    # If it looks like a year (e.g. 2019), estimate years
                    if val > 1950:
                        val = max(0, 2024 - val)
                    experience_years = max(experience_years, min(val, 30))
                except ValueError:
                    pass

        # Count date ranges as experience signals
        date_ranges = re.findall(r'\b(19|20)\d{2}\b', resume_text)
        if not experience_years and len(date_ranges) >= 2:
            years = sorted(set(int(y) for y in date_ranges))
            if len(years) >= 2:
                experience_years = min(years[-1] - years[0], 20)

        exp_level = job.get("experience_level", "Mid-Level").lower()
        exp_benchmarks = {
            "entry": 1, "mid-level": 3, "mid": 3,
            "senior": 5, "lead": 7, "executive": 10
        }
        benchmark = exp_benchmarks.get(exp_level, 3)
        experience_score = min(100.0, (experience_years / benchmark) * 100.0)

        # ── Education detection ──────────────────────────────────────────
        education_score = 0.0
        edu_level_found = ""
        for keyword, score in EDUCATION_KEYWORDS.items():
            if keyword in lower_resume:
                if score > education_score:
                    education_score = float(score)
                    edu_level_found = keyword
        if education_score == 0.0:
            education_score = 20.0  # Gave it some baseline

        # ── Domain score ─────────────────────────────────────────────────
        domain_keywords: List[str] = []
        if job_description:
            words = re.findall(r'\b[a-z]{4,}\b', job_description.lower())
            common = {"with", "that", "this", "from", "have", "will", "must", "your",
                      "their", "about", "into", "than", "more", "been", "also",
                      "work", "team", "role", "help", "able", "experience", "skills"}
            domain_keywords = [w for w in set(words) if w not in common][:30]

        domain_hits = sum(1 for kw in domain_keywords if kw in lower_resume)
        domain_score = min(100.0, (domain_hits / max(len(domain_keywords), 1)) * 100.0)

        # ── Overall score (weighted) ─────────────────────────────────────
        w_skills = scoring_weights.get("skills", 0.40)
        w_exp = scoring_weights.get("experience", 0.35)
        w_edu = scoring_weights.get("education", 0.15)
        w_dom = scoring_weights.get("domain", 0.10)

        overall_score = (
            technical_score * w_skills
            + experience_score * w_exp
            + education_score * w_edu
            + domain_score * w_dom
        )

        # ── Verdict ──────────────────────────────────────────────────────
        if overall_score >= 80:
            verdict = "STRONG_FIT"
        elif overall_score >= 60:
            verdict = "FIT"
        elif overall_score >= 40:
            verdict = "WEAK_FIT"
        else:
            verdict = "NOT_FIT"

        # ── Confidence ───────────────────────────────────────────────────
        word_count = len(resume_text.split())
        if word_count > 400 and len(detected_skills) > 5:
            confidence = "MEDIUM"
        elif word_count > 200:
            confidence = "LOW"
        else:
            confidence = "LOW"

        # ── Strengths & gaps ─────────────────────────────────────────────
        strengths: List[str] = []
        if matched_skills:
            strengths.append(f"Demonstrates {len(matched_skills)} of {len(required_skills)} required skills: {', '.join(matched_skills[:3])}")
        if experience_years >= benchmark:
            strengths.append(f"Meets experience threshold ({experience_years} years vs {benchmark} required)")
        if education_score >= 70:
            strengths.append(f"Relevant educational background detected ({edu_level_found})")
        if detected_skills:
            strengths.append(f"Broad technical knowledge across {len(detected_skills)} detected technologies")

        areas_for_improvement: List[str] = []
        if missing_skills:
            areas_for_improvement.append(f"Missing required skills: {', '.join(missing_skills[:5])}")
        if experience_years < benchmark:
            areas_for_improvement.append(f"Experience ({experience_years} yrs) below benchmark ({benchmark} yrs for {exp_level})")
        if education_score < 50:
            areas_for_improvement.append("Educational background not clearly evidenced in resume")

        # ── Screening summary ────────────────────────────────────────────
        job_title = job.get("title", "the role")
        screening_summary = (
            f"This candidate scored {overall_score:.1f}/100 using the rubric engine for the {job_title} position. "
            f"They matched {len(matched_skills)}/{len(required_skills)} required skills"
            + (f" and are missing: {', '.join(missing_skills[:3])}." if missing_skills else ".")
            + f" Verdict: {verdict}. Note: This is a rubric-based estimate; Gemini AI was not available."
        )

        # ── Interview questions ───────────────────────────────────────────
        suggested_questions: List[str] = [
            f"Can you walk us through your experience with {matched_skills[0] if matched_skills else 'your primary technical stack'}?",
            f"How have you handled a technically challenging project involving {detected_skills[0] if detected_skills else 'your core technology'}?",
            f"What is your approach to {missing_skills[0] if missing_skills else 'learning new technologies'}, and how would you get up to speed?",
            f"Describe a situation where you had to collaborate cross-functionally on a {job.get('department', 'engineering')} project.",
            f"Where do you see your technical skills evolving in the context of a {job.get('experience_level', 'senior')}-level {job_title} role?",
        ]

        # ── Basic entity extraction for rubric ───────────────────────────
        email_match = re.search(r'[\w\.\-]+@[\w\.\-]+\.\w+', resume_text)
        candidate_email = email_match.group(0) if email_match else None

        # Try to extract name (first non-empty line)
        lines = [l.strip() for l in resume_text.splitlines() if l.strip()]
        candidate_name = lines[0] if lines else "Unknown"
        # Reject if first line looks like an email or URL
        if "@" in candidate_name or "http" in candidate_name or len(candidate_name.split()) > 5:
            candidate_name = "Unknown"

        return ScreeningResult(
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            technical_skills=detected_skills,
            education=[],  # Rubric can't parse structured edu entries
            work_experience=[],
            projects=[],
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            overall_score=round(overall_score, 2),
            technical_score=round(technical_score, 2),
            experience_score=round(experience_score, 2),
            education_score=round(education_score, 2),
            domain_score=round(domain_score, 2),
            verdict=verdict,
            screening_summary=screening_summary,
            strengths=strengths,
            areas_for_improvement=areas_for_improvement,
            suggested_interview_questions=suggested_questions,
            confidence_level=confidence,
            disclaimer="AI-generated screening. Must be reviewed by a human recruiter before making any hiring decisions.",
        )


# ---------------------------------------------------------------------------
# Module-level singletons and compatibility aliases
# ---------------------------------------------------------------------------
gemini_screening_service = GeminiScreeningService()
ai_scoring_service = gemini_screening_service
