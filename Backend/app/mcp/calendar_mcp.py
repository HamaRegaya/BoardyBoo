"""Google Calendar MCP tool-set for the tutor's calendar sub-agent.

Wraps the Google Calendar API v3 so ADK agents can create, list, and
manage study-session events.  Uses OAuth2 credentials from config.

This module exposes plain functions (not an MCP server process) so they
integrate as standard ADK FunctionTools.
"""

from __future__ import annotations

import datetime
import logging
from typing import Any, Dict, List, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.config import settings

logger = logging.getLogger(__name__)

# In a real deployment you'd load per-user OAuth tokens from Firestore.
# For the hackathon demo we use a service-account or a stored refresh token.

_service: Any = None


def _get_service(access_token: Optional[str] = None) -> Any:
    """Return a Google Calendar API service instance."""
    global _service
    if _service is not None:
        return _service
    # Fallback: use ADC / service account via google-auth
    import google.auth
    creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/calendar"])
    _service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    return _service


# ── Calendar Tools ────────────────────────────────────────────────────────────


def create_study_session(
    summary: str,
    start_time: str,
    duration_minutes: int = 60,
    description: str = "",
    timezone: str = "America/Los_Angeles",
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
    service = _get_service()

    start_dt = datetime.datetime.fromisoformat(start_time)
    end_dt = start_dt + datetime.timedelta(minutes=duration_minutes)

    event_body = {
        "summary": summary,
        "description": description,
        "start": {"dateTime": start_dt.isoformat(), "timeZone": timezone},
        "end": {"dateTime": end_dt.isoformat(), "timeZone": timezone},
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


def list_upcoming_sessions(
    max_results: int = 10,
    timezone: str = "America/Los_Angeles",
) -> Dict[str, Any]:
    """List upcoming calendar events.

    Parameters
    ----------
    max_results:
        Maximum number of events to return (default 10).
    timezone:
        IANA timezone.
    """
    service = _get_service()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    result = (
        service.events()
        .list(
            calendarId="primary",
            timeMin=now,
            maxResults=max_results,
            singleEvents=True,
            orderBy="startTime",
            timeZone=timezone,
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


def delete_study_session(event_id: str) -> Dict[str, Any]:
    """Delete a study-session event by its ID.

    Parameters
    ----------
    event_id:  The Google Calendar event ID.
    """
    service = _get_service()
    service.events().delete(calendarId="primary", eventId=event_id).execute()
    logger.info("Calendar event deleted: %s", event_id)
    return {"status": "ok", "message": f"Event {event_id} deleted."}


def reschedule_study_session(
    event_id: str,
    new_start_time: str,
    duration_minutes: int = 60,
    timezone: str = "America/Los_Angeles",
) -> Dict[str, Any]:
    """Reschedule an existing study session.

    Parameters
    ----------
    event_id:  The Google Calendar event ID.
    new_start_time:  New ISO 8601 start time.
    duration_minutes:  Duration in minutes.
    timezone:  IANA timezone.
    """
    service = _get_service()
    start_dt = datetime.datetime.fromisoformat(new_start_time)
    end_dt = start_dt + datetime.timedelta(minutes=duration_minutes)

    body = {
        "start": {"dateTime": start_dt.isoformat(), "timeZone": timezone},
        "end": {"dateTime": end_dt.isoformat(), "timeZone": timezone},
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


# ── Export ────────────────────────────────────────────────────────────────────

calendar_tools = [
    create_study_session,
    list_upcoming_sessions,
    delete_study_session,
    reschedule_study_session,
]
