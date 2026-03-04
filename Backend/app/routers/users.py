from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.auth.dependencies import get_current_user
from app.db import get_users_ref, get_db
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
)


# ── Pydantic models ──────────────────────────────────────────────────────────


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    grade: Optional[str] = None
    school: Optional[str] = None
    languages: Optional[List[str]] = None
    preferences: Optional[Dict[str, Any]] = None


# ── GET /me — basic token profile ─────────────────────────────────────────────


@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_profile(user: dict = Depends(get_current_user)):
    """
    Get the current user's profile from Firestore based on the Firebase token.
    """
    users_ref = get_users_ref()
    if not users_ref:
        raise HTTPException(status_code=500, detail="Database connection not available")

    uid = user["uid"]
    doc_ref = users_ref.document(uid)
    doc = doc_ref.get()

    if doc.exists:
        profile_data = doc.to_dict()
        return {
            "uid": uid,
            "metadata": profile_data
        }
    
    # If the user is in Firebase Auth but not in our Firestore yet, return the basic token info
    return {"uid": uid, "metadata": {"name": user.get("name"), "email": user.get("email")}}


# ── GET /me/full — aggregated profile for the profile page ────────────────────


@router.get("/me/full", response_model=Dict[str, Any])
async def get_full_profile(user: dict = Depends(get_current_user)):
    """
    Return everything the profile page needs in a single request:
    user info, stats, streak, progress, recent sessions, quiz averages.
    """
    uid = user["uid"]
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection not available")

    # ── User document ────────────────────────────────────
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    profile = {
        "name": user_data.get("name") or user.get("name", ""),
        "email": user_data.get("email") or user.get("email", ""),
        "picture": user_data.get("picture") or user.get("picture", ""),
        "bio": user_data.get("bio", ""),
        "grade": user_data.get("grade", ""),
        "school": user_data.get("school", ""),
        "languages": user_data.get("languages", []),
        "created_at": _serialize_ts(user_data.get("created_at")),
        "preferences": user_data.get("preferences", {}),
    }

    # ── Sessions ─────────────────────────────────────────
    sessions_ref = db.collection("users").document(uid).collection("sessions")
    sessions_docs = list(sessions_ref.order_by("created_at", direction="DESCENDING").stream())

    total_sessions = len(sessions_docs)
    total_duration_minutes = 0
    session_dates = set()
    recent_sessions = []

    for i, doc in enumerate(sessions_docs):
        data = doc.to_dict()
        total_duration_minutes += data.get("duration_minutes", 0)

        created = data.get("created_at")
        if created:
            if hasattr(created, "date"):
                session_dates.add(created.date())
            elif isinstance(created, str):
                try:
                    session_dates.add(datetime.fromisoformat(created).date())
                except ValueError:
                    pass

        if i < 5:
            recent_sessions.append({
                "id": doc.id,
                "topic": data.get("topic", "General Tutoring"),
                "subject": data.get("subject", ""),
                "duration_minutes": data.get("duration_minutes", 0),
                "created_at": _serialize_ts(data.get("created_at")),
                "status": data.get("status", "completed"),
            })

    # ── Streak ───────────────────────────────────────────
    current_streak, longest_streak = _compute_streak(session_dates)

    # ── Progress (subject mastery) ───────────────────────
    progress_ref = db.collection("users").document(uid).collection("progress")
    subjects_map: Dict[str, Dict[str, Any]] = {}
    for doc in progress_ref.stream():
        data = doc.to_dict()
        subject = data.get("subject", "Other")
        topic = data.get("topic", "")
        level = data.get("mastery_level", 0)

        if subject not in subjects_map:
            subjects_map[subject] = {"total_mastery": 0, "count": 0, "topics": []}
        subjects_map[subject]["total_mastery"] += level
        subjects_map[subject]["count"] += 1
        subjects_map[subject]["topics"].append({
            "topic": topic,
            "mastery_level": level,
        })

    subjects = []
    for subj_name, info in subjects_map.items():
        avg = round((info["total_mastery"] / max(info["count"], 1)) / 5 * 100)
        subjects.append({
            "name": subj_name,
            "progress": avg,
            "topic_count": info["count"],
            "topics": info["topics"],
        })

    # ── Quizzes ──────────────────────────────────────────
    quizzes_ref = db.collection("users").document(uid).collection("quizzes")
    quiz_scores = []
    for doc in quizzes_ref.stream():
        data = doc.to_dict()
        if data.get("percentage") is not None:
            quiz_scores.append(data["percentage"])
    avg_score = round(sum(quiz_scores) / len(quiz_scores), 1) if quiz_scores else 0

    # ── Study Plans ──────────────────────────────────────
    plans_ref = db.collection("users").document(uid).collection("study_plans")
    goals = []
    for doc in plans_ref.stream():
        data = doc.to_dict()
        goals.append({
            "id": doc.id,
            "plan_name": data.get("plan_name", ""),
            "subjects": data.get("subjects", []),
            "weekly_goals": data.get("weekly_goals", []),
            "target_date": data.get("target_date"),
        })

    return {
        "profile": profile,
        "stats": {
            "total_sessions": total_sessions,
            "total_hours": round(total_duration_minutes / 60, 1),
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "avg_score": avg_score,
            "subjects_covered": len(subjects_map),
        },
        "subjects": subjects,
        "recent_sessions": recent_sessions,
        "goals": goals,
    }


# ── PUT /me — update profile fields ──────────────────────────────────────────


@router.put("/me", response_model=Dict[str, Any])
async def update_user_profile(
    body: ProfileUpdate,
    user: dict = Depends(get_current_user),
):
    """
    Update editable profile fields (name, bio, grade, school, languages, preferences).
    """
    users_ref = get_users_ref()
    if not users_ref:
        raise HTTPException(status_code=500, detail="Database connection not available")

    uid = user["uid"]
    doc_ref = users_ref.document(uid)

    update_data: Dict[str, Any] = {"updated_at": datetime.utcnow().isoformat()}
    for field in ("name", "bio", "grade", "school", "languages", "preferences"):
        val = getattr(body, field, None)
        if val is not None:
            update_data[field] = val

    doc_ref.set(update_data, merge=True)
    logger.info("Profile updated for user %s: %s", uid, list(update_data.keys()))

    return {"status": "ok", "updated_fields": list(update_data.keys())}


# ── POST /sync — ensure user exists ──────────────────────────────────────────


@router.post("/sync", response_model=Dict[str, Any])
async def sync_user(user: dict = Depends(get_current_user)):
    """
    Ensure the user document exists in Firestore.
    The frontend should hit this endpoint exactly once after successful login/signup.
    """
    users_ref = get_users_ref()
    if not users_ref:
        raise HTTPException(status_code=500, detail="Database connection not available")

    uid = user["uid"]
    doc_ref = users_ref.document(uid)
    doc = doc_ref.get()

    now = datetime.utcnow().isoformat()
    
    if not doc.exists:
        logger.info(f"Creating new user profile for {uid}")
        new_data = {
            "email": user.get("email"),
            "name": user.get("name"),
            "picture": user.get("picture"),
            "created_at": now,
            "last_login": now,
            "bio": "",
            "grade": "",
            "school": "",
            "languages": [],
            "preferences": {}
        }
        doc_ref.set(new_data)
        return {"status": "created", "data": new_data}
    else:
        logger.info(f"Updating last_login for {uid}")
        update_data = {
            "last_login": now,
            "name": user.get("name", doc.to_dict().get("name")), 
            "picture": user.get("picture", doc.to_dict().get("picture"))
        }
        # Update without overwriting things like preferences
        doc_ref.set(update_data, merge=True)
        return {"status": "updated", "data": update_data}


# ── Helpers ───────────────────────────────────────────────────────────────────


def _serialize_ts(val: Any) -> str:
    """Convert a Firestore timestamp or datetime to an ISO string."""
    if val is None:
        return ""
    if hasattr(val, "isoformat"):
        return val.isoformat()
    return str(val)


def _compute_streak(session_dates: set) -> tuple[int, int]:
    """Return (current_streak, longest_streak) given a set of date objects."""
    if not session_dates:
        return 0, 0

    sorted_dates = sorted(session_dates, reverse=True)
    today = datetime.utcnow().date()

    # Current streak
    current_streak = 0
    check_date = today
    if sorted_dates[0] < today - timedelta(days=1):
        current_streak = 0
    else:
        if sorted_dates[0] == today - timedelta(days=1):
            check_date = today - timedelta(days=1)
        for d in sorted_dates:
            if d == check_date:
                current_streak += 1
                check_date -= timedelta(days=1)
            elif d < check_date:
                break

    # Longest streak
    longest_streak = 1
    run = 1
    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] == sorted_dates[i - 1] - timedelta(days=1):
            run += 1
            longest_streak = max(longest_streak, run)
        else:
            run = 1

    return current_streak, longest_streak
