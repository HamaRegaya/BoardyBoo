"""Media Agent — generates educational images and audio using MCP GenMedia.

Transferred to when the tutor wants to generate illustrations, diagrams,
or pronunciation audio for the student.

Uses the MCP genmedia server (Imagen 3 / Chirp 3 HD) via MCPToolset.
"""

from __future__ import annotations

import logging

from google.adk.agents import Agent
from google.adk.tools.mcp_tool import MCPToolset, SseConnectionParams

from app.config import settings

logger = logging.getLogger(__name__)

MEDIA_AGENT_INSTRUCTION = """\
You are the **Media Agent** — the creative assistant inside the Magic
Whiteboard Tutor.

## Your responsibilities
- Generate educational illustrations, diagrams, and concept art using
  Imagen 3 (via the genmedia MCP server).
- Generate pronunciation audio clips using Chirp 3 HD when teaching
  languages or vocabulary.

## Guidelines
1. **Educational focus** — generated images should be clear, labelled,
   age-appropriate, and directly support the lesson.
2. **Prompt engineering** — write detailed, specific prompts. Include
   "educational illustration", "labelled diagram", "whiteboard style"
   as appropriate.
3. Tell the student what you're generating and give a brief description
   after it's ready.
4. If the MCP server is unavailable, inform the tutor agent gracefully.

When media generation is complete, transfer back to the tutor agent.
"""


def build_media_agent() -> Agent:
    """Build the media agent with MCP genmedia toolset.

    The MCP tools connect to the genmedia SSE server at startup.
    If the server URL is not configured the agent is still created
    but without MCP tools (it can report the error gracefully).
    """
    tools = []
    mcp_server_url = settings.genmedia_mcp_server_url

    if mcp_server_url:
        try:
            toolset = MCPToolset(
                connection_params=SseConnectionParams(
                    url=f"{mcp_server_url}/sse",
                ),
            )
            tools.append(toolset)
            logger.info("MCP GenMedia toolset configured: %s", mcp_server_url)
        except Exception as exc:
            logger.warning("Failed to configure MCP GenMedia: %s", exc)

    return Agent(
        name="media_agent",
        model=settings.media_agent_model,
        instruction=MEDIA_AGENT_INSTRUCTION,
        tools=tools,
    )
