"""Per-user Google OAuth token management.

Stores and retrieves Google OAuth access tokens in Firestore
at ``users/{uid}/google_tokens/calendar``.

The token is the raw access_token obtained during Firebase
Google sign-in (with the ``calendar`` scope).  Since Firebase
sign-in does NOT provide refresh tokens by default, the token
will eventually expire (~1 h).  When it does, the frontend
will obtain a fresh one on the next sign-in and re-sync.
"""

from __future__ import annotations

import logging
from typing import Optional

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.db import get_db

logger = logging.getLogger(__name__)

CALENDAR_SCOPES = ["https://www.googleapis.com/auth/calendar"]


def save_google_token(uid: str, access_token: str) -> None:
    """Persist a Google access token for the given user."""
    db = get_db()
    if not db:
        logger.warning("Firestore unavailable — cannot save Google token for %s", uid)
        return
    doc_ref = db.collection("users").document(uid).collection("google_tokens").document("calendar")
    doc_ref.set({"access_token": access_token}, merge=True)
    logger.info("Google Calendar token saved for user %s", uid)


def load_google_token(uid: str) -> Optional[str]:
    """Load the stored Google access token for the given user, or None."""
    db = get_db()
    if not db:
        return None
    doc_ref = db.collection("users").document(uid).collection("google_tokens").document("calendar")
    doc = doc_ref.get()
    if doc.exists:
        return doc.to_dict().get("access_token")
    return None


def get_calendar_service(uid: str):
    """Build a Google Calendar API v3 service using the user's stored token.

    Returns None if no token is stored or the token is invalid.
    """
    token = load_google_token(uid)
    if not token:
        logger.warning("No Google Calendar token found for user %s", uid)
        return None

    creds = Credentials(token=token, scopes=CALENDAR_SCOPES)
    try:
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)
        return service
    except Exception as e:
        logger.error("Failed to build Calendar service for user %s: %s", uid, e)
        return None
