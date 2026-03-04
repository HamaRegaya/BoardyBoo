"""Google Calendar MCP tool-set for the tutor's calendar sub-agent.

Wraps the Google Calendar API v3 so ADK agents can create, list, and
manage study-session events.  Uses per-user OAuth tokens stored in
Firestore — see ``app.utils.google_tokens``.

This module exposes plain functions (not an MCP server process) so they
integrate as standard ADK FunctionTools.

IMPORTANT: Every tool function is wrapped in try/except so errors are
returned as dict messages to the agent instead of crashing the live session.

User context is passed via ``current_user_id`` ContextVar, set by the
WebSocket handler before the ADK runner starts.
"""

from __future__ import annotations

import contextvars
import datetime
import logging
from typing import Any, Dict

from app.utils.google_tokens import get_calendar_service

logger = logging.getLogger(__name__)

# ContextVars set by the WebSocket handler so tools know which user is active
current_user_id: contextvars.ContextVar[str] = contextvars.ContextVar(
    "current_user_id", default=""
)
current_user_timezone: contextvars.ContextVar[str] = contextvars.ContextVar(
    "current_user_timezone", default="Africa/Tunis"
)


def _get_tz() -> str:
    """Return the active user's timezone."""
    return current_user_timezone.get()


def _get_service():
    """Return a Calendar API service for the current user (from ContextVar)."""
    uid = current_user_id.get()
    if not uid:
        logger.warning("No current_user_id set — calendar tools cannot access user calendar")
        return None
    return get_calendar_service(uid)


# ── Calendar Tools ────────────────────────────────────────────────────────────


def create_study_session(
    summary: str,
    start_time: str,
    duration_minutes: int = 60,
    description: str = "",
    timezone: str = "",
) -> Dict[str, Any]:
    """Create a study-session event on the student's Google Calendar.

    Parameters
    ----------
    summary:
        Event title (e.g. "Math Tutoring – Quadratic Equations").
    start_time:
        ISO 8601 datetime string for the start (e.g. "2026-02-22T15:00:00").
    duration_minutes:
        Length of the session in minutes (default 60).
    description:
        Optional description / agenda for the session.
    timezone:
        IANA timezone string.
    """
    try:
        tz = timezone or _get_tz()
        service = _get_service()
        if not service:
            return {"status": "error", "message": "Google Calendar is not connected. Please ask the student to sign out and sign back in to grant calendar access."}

        start_dt = datetime.datetime.fromisoformat(start_time)
        end_dt = start_dt + datetime.timedelta(minutes=duration_minutes)

        event_body = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": start_dt.isoformat(), "timeZone": tz},
            "end": {"dateTime": end_dt.isoformat(), "timeZone": tz},
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 15},
                ],
            },
        }

        event = service.events().insert(calendarId="primary", body=event_body).execute()
        logger.info("Calendar event created: %s (%s)", event.get("id"), summary)
        return {
            "status": "ok",
            "event_id": event.get("id"),
            "html_link": event.get("htmlLink"),
            "summary": summary,
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat(),
        }
    except Exception as e:
        logger.error("create_study_session failed: %s", e)
        return {"status": "error", "message": f"Failed to create calendar event: {e}"}


def list_upcoming_sessions(
    max_results: int = 10,
    timezone: str = "",
) -> Dict[str, Any]:
    """List upcoming calendar events.

    Parameters
    ----------
    max_results:
        Maximum number of events to return (default 10).
    timezone:
        IANA timezone.
    """
    try:
        tz = timezone or _get_tz()
        service = _get_service()
        if not service:
            return {"status": "error", "message": "Google Calendar is not connected. Please ask the student to sign out and sign back in to grant calendar access."}

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()

        result = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=now,
                maxResults=max_results,
                singleEvents=True,
                orderBy="startTime",
                timeZone=tz,
            )
            .execute()
        )

        events = []
        for item in result.get("items", []):
            events.append({
                "id": item.get("id"),
                "summary": item.get("summary"),
                "start": item.get("start", {}).get("dateTime"),
                "end": item.get("end", {}).get("dateTime"),
                "html_link": item.get("htmlLink"),
            })

        return {"status": "ok", "events": events, "count": len(events)}
    except Exception as e:
        logger.error("list_upcoming_sessions failed: %s", e)
        return {"status": "error", "message": f"Failed to list calendar events: {e}"}


def check_availability(
    date: str,
    timezone: str = "",
) -> Dict[str, Any]:
    """Check free/busy status for a given date.

    Parameters
    ----------
    date:
        ISO 8601 date string (e.g. "2026-03-05").
    timezone:
        IANA timezone string.
    """
    try:
        tz = timezone or _get_tz()
        service = _get_service()
        if not service:
            return {"status": "error", "message": "Google Calendar is not connected. Please ask the student to sign out and sign back in to grant calendar access."}

        day_start = datetime.datetime.fromisoformat(date)
        day_end = day_start + datetime.timedelta(days=1)

        body = {
            "timeMin": day_start.isoformat() + "Z",
            "timeMax": day_end.isoformat() + "Z",
            "timeZone": tz,
            "items": [{"id": "primary"}],
        }
        result = service.freebusy().query(body=body).execute()
        busy = result.get("calendars", {}).get("primary", {}).get("busy", [])

        return {
            "status": "ok",
            "date": date,
            "busy_slots": busy,
            "is_fully_free": len(busy) == 0,
        }
    except Exception as e:
        logger.error("check_availability failed: %s", e)
        return {"status": "error", "message": f"Failed to check availability: {e}"}


def delete_study_session(event_id: str) -> Dict[str, Any]:
    """Delete a study-session event by its ID.

    Parameters
    ----------
    event_id:  The Google Calendar event ID.
    """
    try:
        service = _get_service()
        if not service:
            return {"status": "error", "message": "Google Calendar is not connected."}

        service.events().delete(calendarId="primary", eventId=event_id).execute()
        logger.info("Calendar event deleted: %s", event_id)
        return {"status": "ok", "message": f"Event {event_id} deleted."}
    except Exception as e:
        logger.error("delete_study_session failed: %s", e)
        return {"status": "error", "message": f"Failed to delete calendar event: {e}"}


def reschedule_study_session(
    event_id: str,
    new_start_time: str,
    duration_minutes: int = 60,
    timezone: str = "",
) -> Dict[str, Any]:
    """Reschedule an existing study session.

    Parameters
    ----------
    event_id:  The Google Calendar event ID.
    new_start_time:  New ISO 8601 start time.
    duration_minutes:  Duration in minutes.
    timezone:  IANA timezone.
    """
    try:
        tz = timezone or _get_tz()
        service = _get_service()
        if not service:
            return {"status": "error", "message": "Google Calendar is not connected."}

        start_dt = datetime.datetime.fromisoformat(new_start_time)
        end_dt = start_dt + datetime.timedelta(minutes=duration_minutes)

        body = {
            "start": {"dateTime": start_dt.isoformat(), "timeZone": tz},
            "end": {"dateTime": end_dt.isoformat(), "timeZone": tz},
        }
        event = (
            service.events()
            .patch(calendarId="primary", eventId=event_id, body=body)
            .execute()
        )
        logger.info("Calendar event rescheduled: %s → %s", event_id, new_start_time)
        return {
            "status": "ok",
            "event_id": event.get("id"),
            "new_start": start_dt.isoformat(),
            "new_end": end_dt.isoformat(),
        }
    except Exception as e:
        logger.error("reschedule_study_session failed: %s", e)
        return {"status": "error", "message": f"Failed to reschedule: {e}"}


# ── Export ────────────────────────────────────────────────────────────────────

calendar_tools = [
    create_study_session,
    list_upcoming_sessions,
    check_availability,
    delete_study_session,
    reschedule_study_session,
]
