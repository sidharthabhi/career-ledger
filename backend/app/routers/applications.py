import os
import uuid
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Application
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationOut,
)

router = APIRouter(prefix="/api/applications", tags=["applications"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_RESUME_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXT = {".pdf", ".doc", ".docx"}


@router.get("", response_model=List[ApplicationOut])
def list_applications(
    q: Optional[str] = Query(None, description="Search company or role"),
    status_filter: Optional[str] = Query(None, alias="status"),
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Application).filter(Application.user_id == current_user.id)

    if q:
        like = f"%{q}%"
        query = query.filter(or_(Application.company.ilike(like), Application.role.ilike(like)))
    if status_filter and status_filter != "all":
        query = query.filter(Application.status == status_filter)
    if role and role != "all":
        query = query.filter(Application.role == role)

    return query.order_by(desc(Application.apply_date), desc(Application.id)).all()


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app_obj = Application(user_id=current_user.id, **payload.model_dump())
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.get("/{app_id}", response_model=ApplicationOut)
def get_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app_obj = (
        db.query(Application)
        .filter(Application.id == app_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_obj


@router.patch("/{app_id}", response_model=ApplicationOut)
def update_application(
    app_id: int,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app_obj = (
        db.query(Application)
        .filter(Application.id == app_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(app_obj, k, v)
    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app_obj = (
        db.query(Application)
        .filter(Application.id == app_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    # Best-effort delete of resume file
    if app_obj.resume_url:
        try:
            file_path = UPLOAD_DIR / app_obj.resume_url.split("/")[-1]
            if file_path.exists():
                file_path.unlink()
        except Exception:
            pass
    db.delete(app_obj)
    db.commit()


@router.post("/{app_id}/resume", response_model=ApplicationOut)
async def upload_resume(
    app_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app_obj = (
        db.query(Application)
        .filter(Application.id == app_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {ALLOWED_EXT}")

    contents = await file.read()
    if len(contents) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    stored_name = f"{current_user.id}_{app_id}_{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / stored_name
    file_path.write_bytes(contents)

    # Remove previous resume
    if app_obj.resume_url:
        try:
            old = UPLOAD_DIR / app_obj.resume_url.split("/")[-1]
            if old.exists() and old != file_path:
                old.unlink()
        except Exception:
            pass

    app_obj.resume_filename = file.filename
    app_obj.resume_url = f"/api/applications/{app_id}/resume/download"
    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.get("/{app_id}/resume/download")
def download_resume(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app_obj = (
        db.query(Application)
        .filter(Application.id == app_id, Application.user_id == current_user.id)
        .first()
    )
    if not app_obj or not app_obj.resume_filename:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Find file by pattern user_id_app_id_*
    pattern = f"{current_user.id}_{app_id}_"
    candidates = list(UPLOAD_DIR.glob(f"{pattern}*"))
    if not candidates:
        raise HTTPException(status_code=404, detail="Resume file missing")
    return FileResponse(
        path=candidates[0],
        filename=app_obj.resume_filename,
        media_type="application/octet-stream",
    )
