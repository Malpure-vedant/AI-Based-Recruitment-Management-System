import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.resume import ResumeExtractResponse, ResumeUploadResponse
from app.services.resume_parser import resume_parser_service

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("/upload", response_model=ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Uploads a candidate resume in PDF format to secure storage."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents (.pdf) are supported."
        )

    # Generate sanitized unique filename
    unique_id = str(uuid.uuid4())[:8]
    clean_name = os.path.basename(file.filename).replace(" ", "_")
    stored_filename = f"{unique_id}_{clean_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    # Asynchronous file save
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    async with aiofiles.open(file_path, "wb") as out_file:
        await out_file.write(content)

    return {
        "file_name": stored_filename,
        "file_path": file_path,
        "message": f"Resume '{file.filename}' uploaded successfully."
    }

@router.post("/extract-text", response_model=ResumeExtractResponse)
async def extract_resume_text(
    file: UploadFile = File(...)
):
    """Executes PyMuPDF (fitz) text layout parsing, extracting full text and detected entities."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported for text extraction."
        )

    content = await file.read()
    temp_filename = f"temp_{uuid.uuid4()}.pdf"
    temp_path = os.path.join(settings.UPLOAD_DIR, temp_filename)

    try:
        async with aiofiles.open(temp_path, "wb") as out_file:
            await out_file.write(content)

        extracted_data = resume_parser_service.extract_text_from_pdf(temp_path)

        return {
            "file_name": file.filename,
            "file_size_bytes": len(content),
            "page_count": extracted_data["page_count"],
            "extracted_text": extracted_data["extracted_text"],
            "preview_snippet": extracted_data["preview_snippet"],
            "detected_email": extracted_data["detected_email"],
            "detected_phone": extracted_data["detected_phone"],
            "detected_skills": extracted_data["detected_skills"]
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/download/{file_name}")
def download_resume(
    file_name: str,
    current_user: User = Depends(get_current_user)
):
    """Securely streams resume PDF file for authorized recruiters."""
    clean_name = os.path.basename(file_name)
    file_path = os.path.join(settings.UPLOAD_DIR, clean_name)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resume file '{file_name}' not found."
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=clean_name
    )
