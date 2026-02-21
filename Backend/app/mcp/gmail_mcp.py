"""Gmail MCP tool-set for sending progress-report emails to parents/students.

Uses the Gmail API v1 to compose and send emails.  In a production
deployment, per-user OAuth tokens would be loaded from Firestore.
"""

from __future__ import annotations

import base64
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, Optional

from googleapiclient.discovery import build

from app.config import settings

logger = logging.getLogger(__name__)

_service: Any = None


def _get_service() -> Any:
    global _service
    if _service is not None:
        return _service
    import google.auth
    creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/gmail.send"])
    _service = build("gmail", "v1", credentials=creds, cache_discovery=False)
    return _service


# ── Gmail Tools ───────────────────────────────────────────────────────────────


def send_progress_email(
    to_email: str,
    student_name: str,
    subject_line: str,
    body_html: str,
) -> Dict[str, Any]:
    """Send a progress-report email to a parent or student.

    Parameters
    ----------
    to_email:
        Recipient email address.
    student_name:
        The student's name (used for personalisation).
    subject_line:
        Email subject.
    body_html:
        HTML body content of the email.
    """
    service = _get_service()

    message = MIMEMultipart("alternative")
    message["to"] = to_email
    message["subject"] = subject_line

    # Plain-text fallback
    plain = body_html.replace("<br>", "\n").replace("</p>", "\n")
    import re
    plain = re.sub(r"<[^>]+>", "", plain)

    message.attach(MIMEText(plain, "plain"))
    message.attach(MIMEText(body_html, "html"))

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    sent = service.users().messages().send(userId="me", body={"raw": raw}).execute()

    logger.info("Email sent to %s (id=%s)", to_email, sent.get("id"))
    return {
        "status": "ok",
        "message_id": sent.get("id"),
        "to": to_email,
        "subject": subject_line,
    }


def send_study_reminder(
    to_email: str,
    student_name: str,
    session_topic: str,
    session_time: str,
) -> Dict[str, Any]:
    """Send a study-session reminder email.

    Parameters
    ----------
    to_email:  Recipient email.
    student_name:  Student's name.
    session_topic:  Topic of the upcoming session.
    session_time:  Human-readable date/time string.
    """
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #1864ab;">📚 Study Session Reminder</h2>
      <p>Hi {student_name},</p>
      <p>Just a reminder about your upcoming study session:</p>
      <div style="background: #e7f5ff; border-left: 4px solid #1864ab; padding: 16px; margin: 16px 0;">
        <strong>Topic:</strong> {session_topic}<br/>
        <strong>When:</strong> {session_time}
      </div>
      <p>See you on the whiteboard! 🎨</p>
      <p style="color: #868e96; font-size: 12px;">— Magic Whiteboard Tutor</p>
    </div>
    """
    return send_progress_email(
        to_email=to_email,
        student_name=student_name,
        subject_line=f"📚 Reminder: {session_topic} – {session_time}",
        body_html=html,
    )


# ── Export ────────────────────────────────────────────────────────────────────

gmail_tools = [
    send_progress_email,
    send_study_reminder,
]
