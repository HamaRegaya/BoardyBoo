"""Tutors router — CRUD for per-user custom AI tutors.

Each tutor document lives at  users/{uid}/tutors/{doc_id}  in Firestore.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.db import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/tutors",
    tags=["tutors"],
)


# ── Pydantic models ──────────────────────────────────────────────────────────


class TeachingStyleIn(BaseModel):
    icon: str = ""
    name: str = ""
    desc: str = ""


class TagIn(BaseModel):
    label: str
    color: str = "gray"


class TutorCreate(BaseModel):
    name: str
    title: str = ""
    desc: str = ""
    avatar: str = ""
    placeholder: str = ""
    subjects: List[str] = []
    personality: str = ""
    level: str = "Intermediate"
    voice: str = "default"
    tags: List[TagIn] = []
    styles: List[TeachingStyleIn] = []


class TutorUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    desc: Optional[str] = None
    avatar: Optional[str] = None
    placeholder: Optional[str] = None
    subjects: Optional[List[str]] = None
    personality: Optional[str] = None
    level: Optional[str] = None
    voice: Optional[str] = None
    tags: Optional[List[TagIn]] = None
    styles: Optional[List[TeachingStyleIn]] = None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _tutors_ref(uid: str):
    db = get_db()
    return db.collection("users").document(uid).collection("tutors") if db else None


def _serialize(doc) -> Dict[str, Any]:
    data = doc.to_dict()
    data["id"] = doc.id
    for key in ("created_at", "updated_at"):
        val = data.get(key)
        if val and hasattr(val, "isoformat"):
            data[key] = val.isoformat()
    return data


# ── GET /api/tutors — list all tutors ────────────────────────────────────────


@router.get("", response_model=List[Dict[str, Any]])
async def list_tutors(user: dict = Depends(get_current_user)):
    uid = user["uid"]
    ref = _tutors_ref(uid)
    if not ref:
        return []

    try:
        results = []
        for doc in ref.order_by("created_at").stream():
            results.append(_serialize(doc))
        return results
    except Exception as e:
        logger.error("Error listing tutors: %s", e)
        return []


# ── POST /api/tutors — create a new tutor ────────────────────────────────────


@router.post("", response_model=Dict[str, Any])
async def create_tutor(
    body: TutorCreate,
    user: dict = Depends(get_current_user),
):
    uid = user["uid"]
    ref = _tutors_ref(uid)
    if not ref:
        raise HTTPException(status_code=500, detail="Database not available")

    now = datetime.utcnow().isoformat()
    data: Dict[str, Any] = {
        "name": body.name,
        "title": body.title,
        "desc": body.desc,
        "avatar": body.avatar,
        "placeholder": body.placeholder,
        "subjects": body.subjects,
        "personality": body.personality,
        "level": body.level,
        "voice": body.voice,
        "tags": [t.dict() for t in body.tags],
        "styles": [s.dict() for s in body.styles],
        "status": "New",
        "stats": {"sessions": "0", "rating": "N/A"},
        "created_at": now,
        "updated_at": now,
    }

    doc_ref = ref.document()
    doc_ref.set(data)
    data["id"] = doc_ref.id
    logger.info("Tutor created: %s for user %s", doc_ref.id, uid)
    return data


# ── PUT /api/tutors/{tutor_id} — update a tutor ─────────────────────────────


@router.put("/{tutor_id}", response_model=Dict[str, Any])
async def update_tutor(
    tutor_id: str,
    body: TutorUpdate,
    user: dict = Depends(get_current_user),
):
    uid = user["uid"]
    ref = _tutors_ref(uid)
    if not ref:
        raise HTTPException(status_code=500, detail="Database not available")

    doc_ref = ref.document(tutor_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Tutor not found")

    update: Dict[str, Any] = {"updated_at": datetime.utcnow().isoformat()}
    for field in ("name", "title", "desc", "avatar", "placeholder", "subjects", "personality", "level", "voice"):
        val = getattr(body, field, None)
        if val is not None:
            update[field] = val
    if body.tags is not None:
        update["tags"] = [t.dict() for t in body.tags]
    if body.styles is not None:
        update["styles"] = [s.dict() for s in body.styles]

    doc_ref.set(update, merge=True)
    logger.info("Tutor updated: %s for user %s", tutor_id, uid)
    return {**doc.to_dict(), **update, "id": tutor_id}


# ── DELETE /api/tutors/{tutor_id} ────────────────────────────────────────────


@router.delete("/{tutor_id}", response_model=Dict[str, Any])
async def delete_tutor(
    tutor_id: str,
    user: dict = Depends(get_current_user),
):
    uid = user["uid"]
    ref = _tutors_ref(uid)
    if not ref:
        raise HTTPException(status_code=500, detail="Database not available")

    doc_ref = ref.document(tutor_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Tutor not found")

    doc_ref.delete()
    logger.info("Tutor deleted: %s for user %s", tutor_id, uid)
    return {"status": "ok", "deleted_id": tutor_id}
