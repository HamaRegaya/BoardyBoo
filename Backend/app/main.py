"""FastAPI application with WebSocket endpoint for ADK Bidi-streaming.

Follows the bidi-demo pattern:
- Per-connection LiveRequestQueue + RunConfig
- upstream_task: WebSocket → LiveRequestQueue
- downstream_task: run_live() Events → WebSocket
- asyncio.gather() with try/except/finally for cleanup
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict

from dotenv import load_dotenv

# Load .env BEFORE importing agent modules that read env vars at import time.
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.config import settings
from app.utils.errors import (
    ErrorCategory,
    ErrorPayload,
    ErrorSeverity,
    classify_adk_error,
)
from app.utils.logging_config import setup_logging

logger = logging.getLogger(__name__)

# ── Globals initialised at startup ────────────────────────────────────────────
session_service: InMemorySessionService | None = None
runner: Runner | None = None


# ── Lifespan ──────────────────────────────────────────────────────────────────





# ── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Magic Whiteboard Tutor",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health-check ──────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {"status": "ok", "agent": "magic-whiteboard-tutor"}


# ── WebSocket Endpoint ────────────────────────────────────────────────────────


@app.websocket("/ws/{user_id}/{session_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, session_id: str):
    """Bidirectional streaming session.

    Protocol
    --------
    **Client → Server (upstream):**
    - Binary frame → raw 16-bit PCM audio at 16 kHz (sent via ``send_realtime``)
    - JSON ``{"type":"text","text":"..."}`` → text content
    - JSON ``{"type":"image","data":"<base64>","mimeType":"image/jpeg"}`` → image
    - JSON ``{"type":"canvas","data":"<base64>","mimeType":"image/jpeg"}`` → canvas snapshot
    - JSON ``{"type":"canvas_elements","elements":[...]}`` → Excalidraw JSON
    - JSON ``{"type":"stop"}`` → graceful close

    **Server → Client (downstream):**
    - JSON ``event.model_dump_json(exclude_none=True, by_alias=True)`` per Event
    - JSON error payloads (type=error)
    """
    await websocket.accept()
    logger.info("WS connected: user=%s session=%s", user_id, session_id)

    assert runner is not None and session_service is not None

    # Ensure an ADK session exists for this user/session pair.
    session = await session_service.get_session(
        app_name="magic-whiteboard-tutor",
        user_id=user_id,
        session_id=session_id,
    )
    if session is None:
        session = await session_service.create_session(
            app_name="magic-whiteboard-tutor",
            user_id=user_id,
            session_id=session_id,
        )
        logger.info("Created new ADK session %s for user %s", session_id, user_id)

    # Per-connection LiveRequestQueue — MUST be created inside async context.
    live_request_queue = LiveRequestQueue()

    # RunConfig for bidi-streaming with audio.
    run_config = RunConfig(
        response_modalities=["AUDIO"],
        streaming_mode=StreamingMode.BIDI,
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Aoede",
                )
            ),
        ),
    )

    # ── Upstream: WebSocket → LiveRequestQueue ────────────────────────────

    async def upstream_task():
        """Read frames from the client WebSocket and forward to ADK."""
        try:
            while True:
                message = await websocket.receive()

                # Binary frame = raw PCM audio
                if "bytes" in message and message["bytes"]:
                    audio_data: bytes = message["bytes"]
                    audio_blob = types.Blob(
                        mime_type="audio/pcm;rate=16000",
                        data=audio_data,
                    )
                    live_request_queue.send_realtime(audio_blob)
                    continue

                # Text frame = JSON message
                raw_text = message.get("text")
                if not raw_text:
                    continue

                try:
                    json_msg: Dict[str, Any] = json.loads(raw_text)
                except json.JSONDecodeError:
                    logger.warning("Non-JSON text frame ignored")
                    continue

                msg_type = json_msg.get("type", "")

                if msg_type == "text":
                    # Plain text from the student
                    text = json_msg.get("text", "")
                    if text:
                        live_request_queue.send_content(
                            types.Content(
                                role="user",
                                parts=[types.Part.from_text(text=text)],
                            )
                        )

                elif msg_type in ("image", "canvas"):
                    # JPEG image or canvas snapshot
                    image_data = base64.b64decode(json_msg["data"])
                    mime_type = json_msg.get("mimeType", "image/jpeg")
                    image_blob = types.Blob(
                        mime_type=mime_type,
                        data=image_data,
                    )
                    live_request_queue.send_realtime(image_blob)

                elif msg_type == "canvas_elements":
                    # Excalidraw element data sent as text so the agent can reason
                    elements = json_msg.get("elements", [])
                    live_request_queue.send_content(
                        types.Content(
                            role="user",
                            parts=[
                                types.Part.from_text(
                                    text=f"[Canvas Elements JSON]\n{json.dumps(elements, indent=2)}"
                                )
                            ],
                        )
                    )

                elif msg_type == "activity_start":
                    live_request_queue.send_activity_start()

                elif msg_type == "activity_end":
                    live_request_queue.send_activity_end()

                elif msg_type == "stop":
                    logger.info("Client sent stop signal")
                    break

                else:
                    logger.debug("Unknown message type: %s", msg_type)

        except WebSocketDisconnect:
            logger.info("WS disconnected (upstream): user=%s", user_id)
        except Exception as exc:
            logger.error("Upstream error: %s", exc, exc_info=True)

    # ── Downstream: run_live() Events → WebSocket ─────────────────────────

    async def downstream_task():
        """Stream ADK events back to the client WebSocket."""
        try:
            async for event in runner.run_live(
                user_id=user_id,
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config,
            ):
                # ── Check for ADK-level errors first ──────────────────────
                if event.error_code:
                    error_payload, should_break = classify_adk_error(
                        event.error_code,
                        getattr(event, "error_message", None),
                    )
                    await _send_json(websocket, error_payload.to_ws_json())
                    logger.warning(
                        "ADK error: code=%s severity=%s break=%s",
                        event.error_code,
                        error_payload.severity,
                        should_break,
                    )
                    if should_break:
                        break
                    continue

                # ── Log function calls/responses for debugging ─────────
                if event.content and event.content.parts:
                    for _p in event.content.parts:
                        if _p.function_call:
                            logger.info(
                                "\u25b6 FunctionCall: %s args=%s",
                                _p.function_call.name,
                                _p.function_call.args,
                            )
                        if _p.function_response:
                            logger.info(
                                "\u25c0 FunctionResponse: %s -> %s",
                                _p.function_response.name,
                                json.dumps(_p.function_response.response)[:300],
                            )

                # ── Forward the full event JSON to the client ─────────────
                try:
                    event_json = event.model_dump_json(
                        exclude_none=True, by_alias=True
                    )
                    await websocket.send_text(event_json)
                except Exception as send_exc:
                    logger.error("Failed to send event: %s", send_exc)
                    break

        except Exception as exc:
            logger.error("Downstream error: %s", exc, exc_info=True)
            # Attempt to inform the client
            try:
                await _send_json(
                    websocket,
                    ErrorPayload(
                        category=ErrorCategory.INTERNAL,
                        severity=ErrorSeverity.FATAL,
                        code="STREAM_ERROR",
                        message="Streaming session encountered an error.",
                        detail=str(exc),
                    ).to_ws_json(),
                )
            except Exception:
                pass

    # ── Run both tasks concurrently, clean up on exit ─────────────────────

    try:
        await asyncio.gather(upstream_task(), downstream_task())
    except Exception as exc:
        logger.error("Session error: %s", exc, exc_info=True)
    finally:
        live_request_queue.close()
        logger.info("WS session cleaned up: user=%s session=%s", user_id, session_id)
        try:
            await websocket.close()
        except Exception:
            pass


# ── Helpers ───────────────────────────────────────────────────────────────────


async def _send_json(ws: WebSocket, data: dict) -> None:
    """Send a JSON dict over the WebSocket, swallowing errors."""
    try:
        await ws.send_text(json.dumps(data))
    except Exception:
        pass


# ── Entry-point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
        reload=True,
    )
