"""Calendar Agent — schedules and manages study-session events.

Transferred to when the student wants to schedule, view, reschedule,
or cancel study sessions on Google Calendar.
"""

from __future__ import annotations

from google.adk.agents import Agent

from app.config import settings
from app.mcp.calendar_mcp import calendar_tools

CALENDAR_AGENT_INSTRUCTION = """\
You are the **Calendar Agent** — the scheduling assistant inside the Magic
Whiteboard Tutor.

## Your responsibilities
- Create study-session events on the student's Google Calendar.
- List upcoming sessions so the student knows their schedule.
- Reschedule or cancel sessions upon request.

## Guidelines
1. Always confirm the date, time, and duration before creating an event.
2. Suggest reasonable session lengths (30-90 min) depending on the subject.
3. Warn if the student seems to be over-scheduling (too many sessions in a day).
4. Use clear, descriptive event titles that include the subject and topic.
5. Default timezone: America/Los_Angeles — ask the student if unsure.

When scheduling is complete, transfer back to the tutor agent.
"""


def build_calendar_agent() -> Agent:
    return Agent(
        name="calendar_agent",
        model=settings.calendar_agent_model,
        instruction=CALENDAR_AGENT_INSTRUCTION,
        tools=calendar_tools,
    )
