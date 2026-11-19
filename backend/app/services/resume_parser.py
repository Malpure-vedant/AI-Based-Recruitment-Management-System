import re
import pymupdf as fitz
from typing import Dict, Any, List

# High-frequency tech skills dictionary for regex detection
SKILL_KEYWORDS = [
    "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "FastAPI",
    "Django", "Flask", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker",
    "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "CI/CD", "Git", "GitHub",
    "PyTorch", "TensorFlow", "Scikit-Learn", "LLMs", "LangChain", "Vector Databases",
    "System Design", "Microservices", "REST API", "GraphQL", "Tailwind CSS",
    "Linux", "Prometheus", "Kafka", "SQLAlchemy", "Agile", "Scrum", "Figma"
]

class PyMuPDFResumeParser:
    """Service utilizing PyMuPDF (fitz) to extract text, structure, and entities from PDF resumes."""

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> Dict[str, Any]:
        """Extracts text and metadata from a PDF file using PyMuPDF."""
        try:
            doc = fitz.open(file_path)
            full_text_pages = []
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                # Extract text preserving reading blocks
                text = page.get_text("text")
                if text.strip():
                    full_text_pages.append(text)

            doc.close()

            full_text = "\n\n".join(full_text_pages).strip()
            
            # Clean and normalize text
            normalized_text = re.sub(r'[ \t]+', ' ', full_text)
            normalized_text = re.sub(r'\n{3,}', '\n\n', normalized_text)

            # Entity extraction
            email = PyMuPDFResumeParser._extract_email(normalized_text)
            phone = PyMuPDFResumeParser._extract_phone(normalized_text)
            skills = PyMuPDFResumeParser._extract_skills(normalized_text)

            return {
                "page_count": len(full_text_pages),
                "extracted_text": normalized_text,
                "preview_snippet": normalized_text[:500] + ("..." if len(normalized_text) > 500 else ""),
                "detected_email": email,
                "detected_phone": phone,
                "detected_skills": skills
            }
        except Exception as e:
            raise RuntimeError(f"PyMuPDF failed to parse PDF document: {str(e)}")

    @staticmethod
    def _extract_email(text: str) -> str | None:
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0) if match else None

    @staticmethod
    def _extract_phone(text: str) -> str | None:
        match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        return match.group(0) if match else None

    @staticmethod
    def _extract_skills(text: str) -> List[str]:
        found_skills = []
        lower_text = text.lower()
        for skill in SKILL_KEYWORDS:
            # Word boundary matching
            pattern = rf'\b{re.escape(skill.lower())}\b'
            if re.search(pattern, lower_text):
                found_skills.append(skill)
        return sorted(list(set(found_skills)))

resume_parser_service = PyMuPDFResumeParser()
