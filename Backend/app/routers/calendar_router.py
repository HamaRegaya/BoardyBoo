"""Calendar router — Google Calendar integration endpoints.

Exposes the user's real Google Calendar events for the /schedule page
and provides a freebusy check for the calendar agent.
"""

from __future__ import annotations

import datetime
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.utils.google_tokens import get_calendar_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/calendar",
    tags=["calendar"],
)


@router.get("/events", response_model=Dict[str, Any])
async def list_calendar_events(
    days: int = 14,
    user: dict = Depends(get_current_user),
):
    """Fetch upcoming events from the user's Google Calendar.

    Parameters
    ----------
    days:  Number of days ahead to fetch (default 14).
    """
    uid = user["uid"]
    service = get_calendar_service(uid)
    if not service:
        raise HTTPException(
            status_code=400,
            detail="Google Calendar not connected. Please sign in again to grant calendar access.",
        )

    now = datetime.datetime.now(datetime.timezone.utc)
    time_max = now + datetime.timedelta(days=days)

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
    except Exception as e:
        logger.error("Calendar API error for user %s: %s", uid, e)
        raise HTTPException(status_code=502, detail=f"Calendar API error: {e}")

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

    return {"status": "ok", "events": events, "count": len(events)}


@router.get("/freebusy", response_model=Dict[str, Any])
async def check_freebusy(
    date: str,
    user: dict = Depends(get_current_user),
):
    """Check free/busy status for a given date (ISO format YYYY-MM-DD).

    Returns busy time ranges so the calendar agent can suggest
    non-conflicting slots.
    """
    uid = user["uid"]
    service = get_calendar_service(uid)
    if not service:
        raise HTTPException(
            status_code=400,
            detail="Google Calendar not connected.",
        )

    try:
        day_start = datetime.datetime.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date format, use YYYY-MM-DD")

    day_end = day_start + datetime.timedelta(days=1)

    try:
        body = {
            "timeMin": day_start.isoformat() + "Z",
            "timeMax": day_end.isoformat() + "Z",
            "items": [{"id": "primary"}],
        }
        result = service.freebusy().query(body=body).execute()
        busy = result.get("calendars", {}).get("primary", {}).get("busy", [])
        return {"status": "ok", "date": date, "busy": busy}
    except Exception as e:
        logger.error("FreeBusy API error for user %s: %s", uid, e)
        raise HTTPException(status_code=502, detail=f"Calendar API error: {e}")


@router.get("/status", response_model=Dict[str, Any])
async def calendar_status(user: dict = Depends(get_current_user)):
    """Check whether the user has a Google Calendar token stored."""
    uid = user["uid"]
    service = get_calendar_service(uid)
    return {
        "connected": service is not None,
        "uid": uid,
    }
