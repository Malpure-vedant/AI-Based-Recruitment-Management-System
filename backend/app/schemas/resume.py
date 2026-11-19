from typing import List, Optional
from pydantic import BaseModel

class ResumeExtractResponse(BaseModel):
    file_name: str
    file_size_bytes: int
    page_count: int
    extracted_text: str
    preview_snippet: str
    detected_email: Optional[str] = None
    detected_phone: Optional[str] = None
    detected_skills: List[str] = []

class ResumeUploadResponse(BaseModel):
    file_name: str
    file_path: str
    message: str
