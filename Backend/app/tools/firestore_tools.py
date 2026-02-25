"""Firestore tools for persisting student progress, session notes, and quiz data.

All functions are synchronous FunctionTool-compatible callables
(ADK auto-executes them).  They use the synchronous Firestore client
so they're safe inside the ADK tool executor.
"""

from __future__ import annotations

import functools
import logging
from typing import Any, Callable, Dict, List, Optional

from google.cloud import firestore

from app.config import settings

logger = logging.getLogger(__name__)


def _safe_tool(fn: Callable) -> Callable:
    """Decorator ensuring tool functions never raise.

    ADK live-flow crashes if a tool raises an unhandled exception.
    This catches everything and returns a graceful error dict instead.
    """

    @functools.wraps(fn)
    def wrapper(*args: Any, **kwargs: Any) -> Dict[str, Any]:
        try:
            return fn(*args, **kwargs)
        except Exception as exc:
            logger.error("%s failed: %s", fn.__name__, exc, exc_info=True)
            return {"status": "error", "message": f"{fn.__name__} is temporarily unavailable."}

    return wrapper

# Lazy-initialised Firestore client
_db = None


def _get_db():
    global _db
    if _db is None:
        _db = firestore.Client(
            project=settings.google_cloud_project or None,
            database=settings.firestore_database,
        )
    return _db


# ── Session Notes ─────────────────────────────────────────────────────────────


@_safe_tool
def save_session_notes(
    user_id: str,
    session_id: str,
    subject: str,
    topic: str,
    notes: str,
    key_concepts: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Save session notes and key concepts to Firestore.

    Parameters
    ----------
    user_id:  Student identifier.
    session_id:  Current session ID.
    subject:  Subject (e.g. "Mathematics").
    topic:  Specific topic (e.g. "Quadratic Equations").
    notes:  Summary notes from the tutoring session.
    key_concepts:  List of key concepts covered.
    """
    db = _get_db()
    doc_ref = db.collection("users").document(user_id).collection("sessions").document(session_id)
    data = {
        "subject": subject,
        "topic": topic,
        "notes": notes,
        "key_concepts": key_concepts or [],
        "updated_at": firestore.SERVER_TIMESTAMP,
        "created_at": firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(data, merge=True)
    logger.info("Saved session notes: user=%s session=%s topic=%s", user_id, session_id, topic)
    return {"status": "ok", "message": f"Session notes saved for {topic}."}


# ── Progress Tracking ─────────────────────────────────────────────────────────


@_safe_tool
def update_progress(
    user_id: str,
    subject: str,
    topic: str,
    mastery_level: int,
    details: str = "",
) -> Dict[str, Any]:
    """Update the student's mastery level for a topic.

    Parameters
    ----------
    user_id:  Student identifier.
    subject:  Subject name.
    topic:  Topic name.
    mastery_level:  Score from 1 (beginner) to 5 (mastered).
    details:  Optional details about what was learned.
    """
    if mastery_level < 1 or mastery_level > 5:
        return {"status": "error", "message": "mastery_level must be between 1 and 5."}

    db = _get_db()
    doc_id = f"{subject}__{topic}".replace(" ", "_").lower()
    doc_ref = db.collection("users").document(user_id).collection("progress").document(doc_id)
    data = {
        "subject": subject,
        "topic": topic,
        "mastery_level": mastery_level,
        "details": details,
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(data, merge=True)
    logger.info("Progress updated: user=%s %s/%s → %d", user_id, subject, topic, mastery_level)
    return {"status": "ok", "message": f"Progress updated: {topic} → level {mastery_level}/5."}


@_safe_tool
def get_progress(
    user_id: str,
    subject: Optional[str] = None,
) -> Dict[str, Any]:
    """Retrieve the student's progress across topics.

    Parameters
    ----------
    user_id:  Student identifier.
    subject:  If provided, filter to this subject only.
    """
    db = _get_db()
    ref = db.collection("users").document(user_id).collection("progress")
    if subject:
        docs = ref.where("subject", "==", subject).stream()
    else:
        docs = ref.stream()

    progress_list = []
    for doc in docs:
        d = doc.to_dict()
        progress_list.append({
            "subject": d.get("subject"),
            "topic": d.get("topic"),
            "mastery_level": d.get("mastery_level"),
        })

    return {"status": "ok", "progress": progress_list}


# ── Quiz / Assessment ─────────────────────────────────────────────────────────


@_safe_tool
def save_quiz_result(
    user_id: str,
    session_id: str,
    subject: str,
    topic: str,
    score: int,
    total: int,
    questions_missed: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Save a quiz attempt result.

    Parameters
    ----------
    user_id:  Student identifier.
    session_id:  Session during which the quiz was taken.
    subject:  Subject name.
    topic:  Topic name.
    score:  Number of correct answers.
    total:  Total number of questions.
    questions_missed:  List of questions answered incorrectly.
    """
    db = _get_db()
    doc_ref = (
        db.collection("users")
        .document(user_id)
        .collection("quizzes")
        .document()  # auto-ID
    )
    data = {
        "session_id": session_id,
        "subject": subject,
        "topic": topic,
        "score": score,
        "total": total,
        "percentage": round(score / max(total, 1) * 100, 1),
        "questions_missed": questions_missed or [],
        "taken_at": firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(data)
    pct = data["percentage"]
    logger.info("Quiz saved: user=%s %s/%s score=%d/%d (%.1f%%)", user_id, subject, topic, score, total, pct)
    return {
        "status": "ok",
        "message": f"Quiz result saved: {score}/{total} ({pct}%) on {topic}.",
    }


# ── Study Plan ────────────────────────────────────────────────────────────────


@_safe_tool
def save_study_plan(
    user_id: str,
    plan_name: str,
    subjects: List[str],
    weekly_goals: List[str],
    target_date: Optional[str] = None,
) -> Dict[str, Any]:
    """Save or update a study plan for the student.

    Parameters
    ----------
    user_id:  Student identifier.
    plan_name:  Name of the study plan (e.g. "Midterm Prep").
    subjects:  Subjects included.
    weekly_goals:  Goals for each week.
    target_date:  ISO-format target completion date (optional).
    """
    db = _get_db()
    doc_id = plan_name.replace(" ", "_").lower()
    doc_ref = db.collection("users").document(user_id).collection("study_plans").document(doc_id)
    data = {
        "plan_name": plan_name,
        "subjects": subjects,
        "weekly_goals": weekly_goals,
        "target_date": target_date,
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    doc_ref.set(data, merge=True)
    logger.info("Study plan saved: user=%s plan=%s", user_id, plan_name)
    return {"status": "ok", "message": f"Study plan '{plan_name}' saved."}


@_safe_tool
def get_study_plans(user_id: str) -> Dict[str, Any]:
    """Retrieve all study plans for a student.

    Parameters
    ----------
    user_id:  Student identifier.
    """
    db = _get_db()
    docs = db.collection("users").document(user_id).collection("study_plans").stream()
    plans = []
    for doc in docs:
        d = doc.to_dict()
        plans.append({
            "plan_name": d.get("plan_name"),
            "subjects": d.get("subjects"),
            "weekly_goals": d.get("weekly_goals"),
            "target_date": d.get("target_date"),
        })
    return {"status": "ok", "plans": plans}


# ── Export ────────────────────────────────────────────────────────────────────

firestore_tools = [
    save_session_notes,
    update_progress,
    get_progress,
    save_quiz_result,
    save_study_plan,
    get_study_plans,
]
