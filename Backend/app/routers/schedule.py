"""Schedule router — CRUD for per-user scheduled study sessions.

Each scheduled session lives at  users/{uid}/schedule/{doc_id}  in Firestore.
The frontend calendar reads and writes through these endpoints.

When the user has a linked Google Calendar, sessions are also created/updated/deleted
as Google Calendar events (dual-write).
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.db import get_db
from app.utils.google_tokens import get_calendar_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/schedule",
    tags=["schedule"],
)


# ── Pydantic models ──────────────────────────────────────────────────────────


class ScheduleSessionCreate(BaseModel):
    title: str
    subject: str = ""
    tutor: str = ""
    avatar: str = ""
    description: str = ""
    start_time: str  # ISO 8601 datetime string
    duration_hours: float = 1.0
    session_type: str = "manual"  # "manual" | "ai-suggested"
    subject_class: str = ""  # colour-coding key: math, science, history, languages …


class ScheduleSessionUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    tutor: Optional[str] = None
    avatar: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[str] = None
    duration_hours: Optional[float] = None
    session_type: Optional[str] = None
    subject_class: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _schedule_ref(uid: str):
    db = get_db()
    return db.collection("users").document(uid).collection("schedule") if db else None


def _serialize(doc) -> Dict[str, Any]:
    """Convert a Firestore document snapshot to a plain dict."""
    data = doc.to_dict()
    data["id"] = doc.id
    for key in ("start_time", "created_at", "updated_at"):
        val = data.get(key)
        if val and hasattr(val, "isoformat"):
            data[key] = val.isoformat()
    return data


# ── GET /api/schedule — list all scheduled sessions ──────────────────────────


@router.get("", response_model=List[Dict[str, Any]])
async def list_schedule(user: dict = Depends(get_current_user)):
    """Return all scheduled sessions for the authenticated user."""
    uid = user["uid"]
    ref = _schedule_ref(uid)
    if not ref:
        return []

    try:
        results = []
        for doc in ref.order_by("start_time").stream():
            results.append(_serialize(doc))
        return results
    except Exception as e:
        logger.error("Error listing schedule: %s", e)
        return []


# ── POST /api/schedule — create a new scheduled session ──────────────────────


@router.post("", response_model=Dict[str, Any])
async def create_scheduled_session(
    body: ScheduleSessionCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new scheduled study session (Firestore + Google Calendar)."""
    uid = user["uid"]
    ref = _schedule_ref(uid)
    if not ref:
        raise HTTPException(status_code=500, detail="Database not available")

    now = datetime.utcnow().isoformat()
    data = {
        "title": body.title,
        "subject": body.subject,
        "tutor": body.tutor,
        "avatar": body.avatar,
        "description": body.description,
        "start_time": body.start_time,
        "duration_hours": body.duration_hours,
        "session_type": body.session_type,
        "subject_class": body.subject_class,
        "created_at": now,
        "updated_at": now,
        "google_event_id": "",
    }

    # Dual-write: also create a Google Calendar event if connected
    cal_service = get_calendar_service(uid)
    if cal_service:
        try:
            start_dt = datetime.fromisoformat(body.start_time)
            end_dt = start_dt + timedelta(hours=body.duration_hours)
            event_body = {
                "summary": f"📚 {body.title}",
                "description": f"Tutor: {body.tutor}\n{body.description}".strip(),
                "start": {"dateTime": start_dt.isoformat(), "timeZone": "UTC"},
                "end": {"dateTime": end_dt.isoformat(), "timeZone": "UTC"},
                "reminders": {"useDefault": False, "overrides": [{"method": "popup", "minutes": 15}]},
            }
            gcal_event = cal_service.events().insert(calendarId="primary", body=event_body).execute()
            data["google_event_id"] = gcal_event.get("id", "")
            logger.info("Google Calendar event created: %s", data["google_event_id"])
        except Exception as e:
            logger.warning("Failed to create Google Calendar event: %s", e)

    doc_ref = ref.document()
    doc_ref.set(data)
    data["id"] = doc_ref.id
    logger.info("Schedule session created: %s for user %s", doc_ref.id, uid)
    return data


# ── PUT /api/schedule/{session_id} — update a scheduled session ──────────────


@router.put("/{session_id}", response_model=Dict[str, Any])
async def update_scheduled_session(
    session_id: str,
    body: ScheduleSessionUpdate,
    user: dict = Depends(get_current_user),
):
    """Update fields on an existing scheduled session."""
    uid = user["uid"]
    ref = _schedule_ref(uid)
    if not ref:
        raise HTTPException(status_code=500, detail="Database not available")

    doc_ref = ref.document(session_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")

    update: Dict[str, Any] = {"updated_at": datetime.utcnow().isoformat()}
    for field in (
        "title", "subject", "tutor", "avatar", "description",
        "start_time", "duration_hours", "session_type", "subject_class",
    ):
        val = getattr(body, field, None)
        if val is not None:
            update[field] = val

    doc_ref.set(update, merge=True)
    logger.info("Schedule session updated: %s for user %s", session_id, uid)
    return {**doc.to_dict(), **update, "id": session_id}


# ── DELETE /api/schedule/{session_id} — remove a scheduled session ───────────


@router.delete("/{session_id}", response_model=Dict[str, Any])
async def delete_scheduled_session(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a scheduled session (Firestore + Google Calendar)."""
    uid = user["uid"]
    ref = _schedule_ref(uid)
    if not ref:
        raise HTTPException(status_code=500, detail="Database not available")

    doc_ref = ref.document(session_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")

    # Dual-write: also delete from Google Calendar
    google_event_id = doc.to_dict().get("google_event_id")
    if google_event_id:
        cal_service = get_calendar_service(uid)
        if cal_service:
            try:
                cal_service.events().delete(calendarId="primary", eventId=google_event_id).execute()
                logger.info("Google Calendar event deleted: %s", google_event_id)
            except Exception as e:
                logger.warning("Failed to delete Google Calendar event: %s", e)

    doc_ref.delete()
    logger.info("Schedule session deleted: %s for user %s", session_id, uid)
    return {"status": "ok", "deleted_id": session_id}


# ── Combined endpoint (single call) ──────────────────────────────────────────

import asyncio
import concurrent.futures

_sched_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)


def _fetch_schedule_sessions(uid: str):
    db = get_db()
    if not db:
        return []
    try:
        results = []
        ref = db.collection("users").document(uid).collection("schedule")
        for doc in ref.order_by("start_time").stream():
            results.append(_serialize(doc))
        return results
    except Exception as e:
        logger.error("_fetch_schedule_sessions: %s", e)
        return []


def _fetch_study_plans(uid: str):
    db = get_db()
    if not db:
        return []
    try:
        results = []
        ref = db.collection("users").document(uid).collection("study_plans")
        for doc in ref.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)
        return results
    except Exception as e:
        logger.error("_fetch_study_plans: %s", e)
        return []


def _fetch_calendar_events_sync(uid: str, days: int = 14):
    service = get_calendar_service(uid)
    if not service:
        return {"connected": False, "events": []}

    import datetime as dt
    now = dt.datetime.now(dt.timezone.utc)
    time_max = now + dt.timedelta(days=days)

    try:
        result = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=now.isoformat(),
                timeMax=time_max.isoformat(),
                maxResults=100,
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )
        events = []
        for item in result.get("items", []):
            start = item.get("start", {})
            end = item.get("end", {})
            events.append({
                "id": item.get("id"),
                "summary": item.get("summary", "(No title)"),
                "description": item.get("description", ""),
                "start": start.get("dateTime") or start.get("date"),
                "end": end.get("dateTime") or end.get("date"),
                "html_link": item.get("htmlLink"),
                "source": "google_calendar",
            })
        return {"connected": True, "events": events}
    except Exception as e:
        logger.error("_fetch_calendar_events_sync: %s", e)
        return {"connected": True, "events": []}


@router.get("/all", response_model=Dict[str, Any])
async def get_schedule_all(user: dict = Depends(get_current_user)):
    """
    Combined endpoint: returns schedule, study plans, calendar events & status
    in a single call with concurrent execution.
    """
    uid = user["uid"]
    loop = asyncio.get_running_loop()

    sched_fut = loop.run_in_executor(_sched_executor, _fetch_schedule_sessions, uid)
    plans_fut = loop.run_in_executor(_sched_executor, _fetch_study_plans, uid)
    cal_fut = loop.run_in_executor(_sched_executor, _fetch_calendar_events_sync, uid, 14)

    sessions, plans, cal_data = await asyncio.gather(sched_fut, plans_fut, cal_fut)

    return {
        "sessions": sessions,
        "study_plans": plans,
        "calendar_connected": cal_data["connected"],
        "calendar_events": cal_data["events"],
    }
