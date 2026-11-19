import json
from typing import Dict, Any, List
from app.core.config import settings

class AIScoringService:
    """Evaluates candidate resumes against target job criteria using Gemini AI or structured rubric scoring."""

    @staticmethod
    def evaluate_candidate(
        job_title: str,
        job_description: str,
        required_skills: List[str],
        scoring_weights: Dict[str, float],
        resume_text: str
    ) -> Dict[str, Any]:
        """Evaluates resume against job requirements, returning structured metrics and questions."""
        
        # If Gemini API key is configured, invoke Gemini API
        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel(settings.GEMINI_MODEL)
                
                prompt = f"""
                You are a Senior Technical Recruiter. Evaluate this resume against the Job Description.
                
                Job Title: {job_title}
                Required Skills: {', '.join(required_skills)}
                Job Description: {job_description}
                
                Candidate Resume Text:
                {resume_text[:4000]}
                
                Return a valid JSON object matching this exact structure:
                {{
                    "match_score": 85.0,
                    "technical_score": 90.0,
                    "experience_score": 82.0,
                    "education_score": 85.0,
                    "domain_score": 80.0,
                    "verdict": "STRONG_FIT",
                    "summary": "Concise 2-sentence summary of the candidate fit.",
                    "matched_skills": ["Python", "FastAPI"],
                    "missing_skills": ["Kubernetes"],
                    "strengths": ["Clear production experience", "Solid architecture understanding"],
                    "weaknesses": ["Missing Kubernetes orchestration"],
                    "suggested_questions": ["Question 1?", "Question 2?", "Question 3?"]
                }}
                """
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                return json.loads(response.text)
            except Exception:
                pass  # Fall through to deterministic rubric engine

        # Deterministic explainable rubric calculation engine
        lower_resume = resume_text.lower()
        matched = []
        missing = []

        for skill in required_skills:
            if skill.lower() in lower_resume:
                matched.append(skill)
            else:
                missing.append(skill)

        # Technical score based on matched percentage
        total_req = max(len(required_skills), 1)
        tech_score = round((len(matched) / total_req) * 100, 1)

        # Experience heuristics
        exp_score = 80.0
        if "senior" in lower_resume or "lead" in lower_resume or "architect" in lower_resume:
            exp_score = 92.0
        elif "junior" in lower_resume or "intern" in lower_resume:
            exp_score = 55.0

        edu_score = 85.0
        if "master" in lower_resume or "m.s." in lower_resume or "ph.d" in lower_resume:
            edu_score = 95.0
        elif "bachelor" in lower_resume or "b.s." in lower_resume:
            edu_score = 85.0

        domain_score = 80.0

        # Weighted composite score
        w_skills = scoring_weights.get("skills", 0.40)
        w_exp = scoring_weights.get("experience", 0.35)
        w_edu = scoring_weights.get("education", 0.15)
        w_domain = scoring_weights.get("domain", 0.10)

        composite_score = round(
            (tech_score * w_skills) +
            (exp_score * w_exp) +
            (edu_score * w_edu) +
            (domain_score * w_domain),
            1
        )

        # Verdict
        if composite_score >= 85:
            verdict = "STRONG_FIT"
        elif composite_score >= 70:
            verdict = "MODERATE_FIT"
        elif composite_score >= 50:
            verdict = "LOW_FIT"
        else:
            verdict = "NO_FIT"

        strengths = [
            f"Demonstrated proficiency in {', '.join(matched[:3])}" if matched else "Foundational software understanding",
            "Strong contextual alignment with target engineering responsibilities"
        ]
        
        weaknesses = []
        if missing:
            weaknesses.append(f"Gaps identified in required skills: {', '.join(missing[:3])}")
        else:
            weaknesses.append("No critical skill gaps detected against requisition checklist.")

        questions = [
            f"Can you explain your hands-on production experience with {matched[0] if matched else 'distributed systems'}?",
            f"How do you plan to quickly bridge gaps in {missing[0] if missing else 'system scalability'}?",
            "Can you walk us through an incident where you debugged a high-priority production bottleneck?"
        ]

        summary = (
            f"Candidate exhibits a {composite_score}% alignment for the {job_title} role. "
            f"Demonstrated competencies in {len(matched)} of {total_req} core requirements."
        )

        return {
            "match_score": composite_score,
            "technical_score": tech_score,
            "experience_score": exp_score,
            "education_score": edu_score,
            "domain_score": domain_score,
            "verdict": verdict,
            "summary": summary,
            "matched_skills": matched,
            "missing_skills": missing,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "suggested_questions": questions
        }

ai_scoring_service = AIScoringService()
