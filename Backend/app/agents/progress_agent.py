"""Progress Agent — tracks mastery, runs quizzes, and sends reports.

Transferred to when the tutor wants to assess the student, update
mastery levels, or email a progress report.
"""

from __future__ import annotations

from google.adk.agents import Agent

from app.config import settings
from app.mcp.gmail_mcp import gmail_tools
from app.tools.firestore_tools import (
    get_progress,
    save_quiz_result,
    save_session_notes,
    update_progress,
)

PROGRESS_AGENT_INSTRUCTION = """\
You are the **Progress Agent** — the assessment & reporting assistant inside
the Magic Whiteboard Tutor.

## Your responsibilities
- Give short quizzes to check understanding (3-5 questions).
- Record quiz results via `save_quiz_result`.
- Update mastery levels after assessments via `update_progress`.
- Save session notes summarising what was covered via `save_session_notes`.
- Email progress reports to the student or parent via `send_progress_email`
  or `send_study_reminder`.

## Mastery Scale
1 = Just introduced · 2 = Needs practice · 3 = Developing
4 = Proficient · 5 = Mastered

## Guidelines
1. Quiz questions should match the topic just taught.
2. Keep quizzes encouraging — praise correct answers, gently explain incorrect
   ones.
3. After a quiz, update the mastery level based on the percentage score:
   0-39% → 1, 40-59% → 2, 60-74% → 3, 75-89% → 4, 90-100% → 5.
4. Ask the student before sending an email to a parent.
5. Include specific examples of what the student did well in reports.

When assessment is done, transfer back to the tutor agent.
"""


def build_progress_agent() -> Agent:
    return Agent(
        name="progress_agent",
        model=settings.progress_agent_model,
        instruction=PROGRESS_AGENT_INSTRUCTION,
        tools=[
            get_progress,
            save_quiz_result,
            save_session_notes,
            update_progress,
            *gmail_tools,
        ],
    )
