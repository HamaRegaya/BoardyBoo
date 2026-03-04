from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from app.auth.dependencies import get_current_user
from app.db import get_db
from datetime import datetime, timedelta
import logging
import asyncio
import concurrent.futures

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
)

# Thread pool for running sync Firestore calls concurrently
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

def _user_sessions_ref(uid: str):
    """Return the user's sessions sub-collection ref."""
    db = get_db()
    return db.collection("users").document(uid).collection("sessions") if db else None


def _user_progress_ref(uid: str):
    """Return the user's progress sub-collection ref."""
    db = get_db()
    return db.collection("users").document(uid).collection("progress") if db else None


def _user_quizzes_ref(uid: str):
    """Return the user's quizzes sub-collection ref."""
    db = get_db()
    return db.collection("users").document(uid).collection("quizzes") if db else None


def _user_study_plans_ref(uid: str):
    """Return the user's study_plans sub-collection ref."""
    db = get_db()
    return db.collection("users").document(uid).collection("study_plans") if db else None


# ── Stats ─────────────────────────────────────────────────────────────────────


@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    """
    Get high-level statistics for the dashboard:
    total_sessions, total_hours, avg_score, subjects_covered.
    """
    uid = user["uid"]
    sessions_ref = _user_sessions_ref(uid)
    progress_ref = _user_progress_ref(uid)
    quizzes_ref = _user_quizzes_ref(uid)

    total_sessions = 0
    total_duration_minutes = 0
    subjects = set()
    avg_score = 0.0

    try:
        # Sessions
        if sessions_ref:
            for doc in sessions_ref.stream():
                total_sessions += 1
                data = doc.to_dict()
                total_duration_minutes += data.get("duration_minutes", 0)
                if data.get("subject"):
                    subjects.add(data["subject"])

        # Subjects from progress collection too
        if progress_ref:
            for doc in progress_ref.stream():
                data = doc.to_dict()
                if data.get("subject"):
                    subjects.add(data["subject"])

        # Average quiz score
        if quizzes_ref:
            scores = []
            for doc in quizzes_ref.stream():
                data = doc.to_dict()
                if data.get("percentage") is not None:
                    scores.append(data["percentage"])
            if scores:
                avg_score = round(sum(scores) / len(scores), 1)

    except Exception as e:
        logger.error("Error fetching stats: %s", e)

    return {
        "total_sessions": total_sessions,
        "total_hours": round(total_duration_minutes / 60, 1),
        "avg_score": avg_score,
        "subjects_covered": len(subjects),
    }


# ── Sessions ──────────────────────────────────────────────────────────────────


@router.get("/sessions", response_model=List[Dict[str, Any]])
async def get_user_sessions(limit: int = 10, user: dict = Depends(get_current_user)):
    """
    List past tutoring sessions (from user sub-collection).
    """
    uid = user["uid"]
    sessions_ref = _user_sessions_ref(uid)
    if not sessions_ref:
        return []

    try:
        query = sessions_ref.order_by(
            "created_at", direction="DESCENDING"
        ).limit(limit)

        results = []
        for doc in query.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            # Serialize any datetime/timestamp fields to ISO strings
            for key in ("created_at", "ended_at", "updated_at"):
                val = data.get(key)
                if val and hasattr(val, "isoformat"):
                    data[key] = val.isoformat()
            results.append(data)

        return results
    except Exception as e:
        logger.error("Error fetching sessions: %s", e)
        return []


# ── Streak ────────────────────────────────────────────────────────────────────


@router.get("/streak", response_model=Dict[str, Any])
async def get_learning_streak(user: dict = Depends(get_current_user)):
    """
    Calculate the user's current consecutive-day learning streak.
    A day counts if at least one session was started on that date.
    """
    uid = user["uid"]
    sessions_ref = _user_sessions_ref(uid)
    if not sessions_ref:
        return {"current_streak": 0, "longest_streak": 0}

    try:
        # Fetch all sessions (only need created_at so this is lightweight)
        docs = sessions_ref.order_by("created_at", direction="DESCENDING").stream()

        session_dates = set()
        for doc in docs:
            data = doc.to_dict()
            created = data.get("created_at")
            if created:
                if hasattr(created, "date"):
                    session_dates.add(created.date())
                elif isinstance(created, str):
                    try:
                        session_dates.add(datetime.fromisoformat(created).date())
                    except ValueError:
                        pass

        if not session_dates:
            return {"current_streak": 0, "longest_streak": 0}

        sorted_dates = sorted(session_dates, reverse=True)
        today = datetime.utcnow().date()

        # Current streak: count consecutive days from today (or yesterday)
        current_streak = 0
        check_date = today
        if sorted_dates[0] < today - timedelta(days=1):
            # Last session was more than 1 day ago — streak broken
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

        return {"current_streak": current_streak, "longest_streak": longest_streak}

    except Exception as e:
        logger.error("Error calculating streak: %s", e)
        return {"current_streak": 0, "longest_streak": 0}


# ── Progress / Topics ─────────────────────────────────────────────────────────


@router.get("/progress", response_model=List[Dict[str, Any]])
async def get_learning_progress(user: dict = Depends(get_current_user)):
    """
    Get per-topic mastery progress for the student.
    """
    uid = user["uid"]
    progress_ref = _user_progress_ref(uid)
    if not progress_ref:
        return []

    try:
        results = []
        for doc in progress_ref.stream():
            data = doc.to_dict()
            results.append({
                "id": doc.id,
                "subject": data.get("subject", ""),
                "topic": data.get("topic", ""),
                "mastery_level": data.get("mastery_level", 0),
            })
        return results
    except Exception as e:
        logger.error("Error fetching progress: %s", e)
        return []


@router.get("/topics", response_model=Dict[str, Any])
async def get_suggested_topics(user: dict = Depends(get_current_user)):
    """
    Suggest topics to review based on low mastery or recent session subjects.
    """
    uid = user["uid"]
    progress_ref = _user_progress_ref(uid)
    sessions_ref = _user_sessions_ref(uid)

    suggested = []

    try:
        # Low-mastery topics (level <= 2) → suggest for review
        if progress_ref:
            for doc in progress_ref.stream():
                data = doc.to_dict()
                if data.get("mastery_level", 0) <= 2:
                    label = data.get("topic", "Unknown Topic")
                    if data.get("subject"):
                        label = f"{data['subject']}: {label}"
                    suggested.append(label)

        # Recent session topics (last 5 sessions) — add any not yet in progress
        if sessions_ref:
            recent = sessions_ref.order_by(
                "created_at", direction="DESCENDING"
            ).limit(5).stream()
            for doc in recent:
                data = doc.to_dict()
                topic = data.get("topic")
                if topic and topic not in suggested:
                    suggested.append(topic)

        # Cap at 6 suggestions
        suggested = suggested[:6]

    except Exception as e:
        logger.error("Error fetching suggested topics: %s", e)

    return {"topics": suggested}


# ── Study Plans ───────────────────────────────────────────────────────────────


@router.get("/study-plans", response_model=List[Dict[str, Any]])
async def get_study_plans(user: dict = Depends(get_current_user)):
    """
    List saved study plans.
    """
    uid = user["uid"]
    plans_ref = _user_study_plans_ref(uid)
    if not plans_ref:
        return []

    try:
        results = []
        for doc in plans_ref.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)
        return results
    except Exception as e:
        logger.error("Error fetching study plans: %s", e)
        return []


# ── Combined endpoint (single call) ──────────────────────────────────────────


def _fetch_stats_sync(uid: str) -> Dict[str, Any]:
    """Synchronous stats fetch for thread pool."""
    db = get_db()
    if not db:
        return {"total_sessions": 0, "total_hours": 0, "avg_score": 0, "subjects_covered": 0}

    total_sessions = 0
    total_duration_minutes = 0
    subjects = set()
    avg_score = 0.0

    try:
        for doc in db.collection("users").document(uid).collection("sessions").stream():
            total_sessions += 1
            data = doc.to_dict()
            total_duration_minutes += data.get("duration_minutes", 0)
            if data.get("subject"):
                subjects.add(data["subject"])

        for doc in db.collection("users").document(uid).collection("progress").stream():
            data = doc.to_dict()
            if data.get("subject"):
                subjects.add(data["subject"])

        scores = []
        for doc in db.collection("users").document(uid).collection("quizzes").stream():
            data = doc.to_dict()
            if data.get("percentage") is not None:
                scores.append(data["percentage"])
        if scores:
            avg_score = round(sum(scores) / len(scores), 1)
    except Exception as e:
        logger.error("_fetch_stats_sync: %s", e)

    return {
        "total_sessions": total_sessions,
        "total_hours": round(total_duration_minutes / 60, 1),
        "avg_score": avg_score,
        "subjects_covered": len(subjects),
    }


def _fetch_sessions_sync(uid: str, limit: int = 5) -> List[Dict[str, Any]]:
    db = get_db()
    if not db:
        return []
    try:
        results = []
        query = db.collection("users").document(uid).collection("sessions").order_by(
            "created_at", direction="DESCENDING"
        ).limit(limit)
        for doc in query.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            for key in ("created_at", "ended_at", "updated_at"):
                val = data.get(key)
                if val and hasattr(val, "isoformat"):
                    data[key] = val.isoformat()
            results.append(data)
        return results
    except Exception as e:
        logger.error("_fetch_sessions_sync: %s", e)
        return []


def _fetch_streak_sync(uid: str) -> Dict[str, Any]:
    db = get_db()
    if not db:
        return {"current_streak": 0, "longest_streak": 0}
    try:
        docs = db.collection("users").document(uid).collection("sessions").order_by(
            "created_at", direction="DESCENDING"
        ).stream()
        session_dates = set()
        for doc in docs:
            data = doc.to_dict()
            created = data.get("created_at")
            if created:
                if hasattr(created, "date"):
                    session_dates.add(created.date())
                elif isinstance(created, str):
                    try:
                        session_dates.add(datetime.fromisoformat(created).date())
                    except ValueError:
                        pass
        if not session_dates:
            return {"current_streak": 0, "longest_streak": 0}

        sorted_dates = sorted(session_dates, reverse=True)
        today = datetime.utcnow().date()
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

        longest_streak = 1
        run = 1
        for i in range(1, len(sorted_dates)):
            if sorted_dates[i] == sorted_dates[i - 1] - timedelta(days=1):
                run += 1
                longest_streak = max(longest_streak, run)
            else:
                run = 1

        return {"current_streak": current_streak, "longest_streak": longest_streak}
    except Exception as e:
        logger.error("_fetch_streak_sync: %s", e)
        return {"current_streak": 0, "longest_streak": 0}


def _fetch_progress_and_topics_sync(uid: str) -> Dict[str, Any]:
    """Combined progress + topics to avoid double-reading progress collection."""
    db = get_db()
    if not db:
        return {"progress": [], "topics": []}

    progress_list = []
    suggested = []

    try:
        for doc in db.collection("users").document(uid).collection("progress").stream():
            data = doc.to_dict()
            progress_list.append({
                "id": doc.id,
                "subject": data.get("subject", ""),
                "topic": data.get("topic", ""),
                "mastery_level": data.get("mastery_level", 0),
            })
            if data.get("mastery_level", 0) <= 2:
                label = data.get("topic", "Unknown Topic")
                if data.get("subject"):
                    label = f"{data['subject']}: {label}"
                suggested.append(label)

        # Recent session topics
        recent = db.collection("users").document(uid).collection("sessions").order_by(
            "created_at", direction="DESCENDING"
        ).limit(5).stream()
        for doc in recent:
            data = doc.to_dict()
            topic = data.get("topic")
            if topic and topic not in suggested:
                suggested.append(topic)

        suggested = suggested[:6]
    except Exception as e:
        logger.error("_fetch_progress_and_topics_sync: %s", e)

    return {"progress": progress_list, "topics": suggested}


def _fetch_schedule_sync(uid: str) -> List[Dict[str, Any]]:
    db = get_db()
    if not db:
        return []
    try:
        results = []
        ref = db.collection("users").document(uid).collection("scheduled_sessions")
        for doc in ref.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            for key in ("start_time", "end_time", "created_at"):
                val = data.get(key)
                if val and hasattr(val, "isoformat"):
                    data[key] = val.isoformat()
            results.append(data)
        return results
    except Exception as e:
        logger.error("_fetch_schedule_sync: %s", e)
        return []


@router.get("/all", response_model=Dict[str, Any])
async def get_dashboard_all(user: dict = Depends(get_current_user)):
    """
    Combined endpoint: returns all dashboard data in a single call.
    Runs Firestore queries concurrently via thread pool.
    """
    uid = user["uid"]
    loop = asyncio.get_running_loop()

    # Run all sync Firestore queries concurrently
    stats_fut = loop.run_in_executor(_executor, _fetch_stats_sync, uid)
    sessions_fut = loop.run_in_executor(_executor, _fetch_sessions_sync, uid, 5)
    streak_fut = loop.run_in_executor(_executor, _fetch_streak_sync, uid)
    progress_fut = loop.run_in_executor(_executor, _fetch_progress_and_topics_sync, uid)
    schedule_fut = loop.run_in_executor(_executor, _fetch_schedule_sync, uid)

    stats, sessions, streak, progress_data, schedule = await asyncio.gather(
        stats_fut, sessions_fut, streak_fut, progress_fut, schedule_fut
    )

    return {
        "stats": stats,
        "sessions": sessions,
        "streak": streak,
        "progress": progress_data["progress"],
        "topics": progress_data["topics"],
        "schedule": schedule,
    }
