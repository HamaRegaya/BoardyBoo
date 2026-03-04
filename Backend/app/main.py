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
from datetime import datetime, timezone
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
from firebase_admin import auth as firebase_auth

from app.agents.tutor_agent import build_tutor_agent
from app.config import settings
from app.routers import users, dashboard, schedule, tutors, calendar_router
from app.utils.errors import (
    ErrorCategory,
    ErrorPayload,
    ErrorSeverity,
    classify_adk_error,
    classify_api_error,
)
from app.utils.logging_config import setup_logging
from app.utils.ws_signals import set_ws_notify, ws_notify

logger = logging.getLogger(__name__)

# ── Globals initialised at startup ────────────────────────────────────────────
session_service: InMemorySessionService | None = None
runner: Runner | None = None


# ── Lifespan ──────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialise ADK agent & runner once at startup."""
    global session_service, runner

    setup_logging(settings.log_level)
    logger.info("Initialising Magic Whiteboard Tutor backend…")

    # Build agent tree (root + sub-agents)
    root_agent = build_tutor_agent()

    # Session service — swap to Firestore / Vertex for production persistence
    session_service = InMemorySessionService()

    # Runner — the ADK orchestrator
    runner = Runner(
        agent=root_agent,
        app_name="magic-whiteboard-tutor",
        session_service=session_service,
    )
    logger.info("ADK Runner ready (agent=%s)", root_agent.name)

    yield  # ← app is running

    logger.info("Shutting down Magic Whiteboard Tutor backend.")

# ── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Magic Whiteboard Tutor",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(schedule.router)
app.include_router(tutors.router)
app.include_router(calendar_router.router)

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

    # Secure WebSocket connection using Firebase Token
    token = websocket.query_params.get("token")
    if not token:
        logger.warning("WS connection rejected: Missing token for user %s", user_id)
        await websocket.close(code=1008, reason="Missing authentication token")
        return

    try:
        decoded_token = firebase_auth.verify_id_token(token)
        token_uid = decoded_token.get("uid")
        if token_uid != user_id:
            logger.warning("WS connection rejected: Token UID %s != %s", token_uid, user_id)
            await websocket.close(code=1008, reason="Unauthorized user")
            return
    except Exception as e:
        logger.warning("WS connection rejected: Invalid token: %s", e)
        await websocket.close(code=1008, reason="Invalid authentication token")
        return

    logger.info("WS connected: user=%s session=%s", user_id, session_id)

    # ── Persist session start to Firestore ────────────────────────────────
    session_start_time = datetime.now(timezone.utc)
    try:
        from app.db import get_db as _get_dashboard_db
        _dash_db = _get_dashboard_db()
        if _dash_db:
            _sess_doc = (
                _dash_db.collection("users")
                .document(user_id)
                .collection("sessions")
                .document(session_id)
            )
            _sess_doc.set(
                {
                    "created_at": session_start_time,
                    "status": "active",
                    "topic": "General Tutoring",
                    "subject": "",
                    "duration_minutes": 0,
                },
                merge=True,
            )
            logger.info("Session doc created in Firestore: users/%s/sessions/%s", user_id, session_id)
    except Exception as _fs_exc:
        logger.warning("Failed to save session start: %s", _fs_exc)

    assert runner is not None and session_service is not None

    # Register per-session WS notify callback so tools (e.g.
    # generate_and_show_image) can send early status signals to this
    # client without holding a direct WebSocket reference.
    _notify_token = set_ws_notify(
        lambda data: asyncio.ensure_future(_send_json(websocket, data))
    )

    # Set the current user ID and timezone so calendar tools can access per-user tokens
    from app.mcp.calendar_mcp import current_user_id as _cal_user_ctx
    from app.mcp.calendar_mcp import current_user_timezone as _cal_tz_ctx
    _cal_user_ctx.set(user_id)
    # Load user's timezone from Firestore profile
    try:
        from app.db import get_db as _get_tz_db
        _tz_db = _get_tz_db()
        if _tz_db:
            _user_doc = _tz_db.collection("users").document(user_id).get()
            if _user_doc.exists:
                _user_tz = _user_doc.to_dict().get("timezone", "")
                if _user_tz:
                    _cal_tz_ctx.set(_user_tz)
                    logger.info("User timezone set to: %s", _user_tz)
    except Exception as _tz_err:
        logger.warning("Could not load user timezone: %s", _tz_err)

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
        response_modalities=[types.Modality.AUDIO],
        streaming_mode=StreamingMode.BIDI,
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name="Fenrir",
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
                        live_request_queue.send_realtime_text(text)

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
                    canvas_text = f"[Canvas Elements JSON]\n{json.dumps(elements, indent=2)}"
                    live_request_queue.send_realtime_text(canvas_text)

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
        except RuntimeError as exc:
            # Starlette raises RuntimeError when WS is already disconnected
            if "disconnect" in str(exc).lower():
                logger.info("WS already disconnected (upstream): user=%s", user_id)
            else:
                logger.error("Upstream runtime error: %s", exc, exc_info=True)
        except Exception as exc:
            logger.error("Upstream error: %s", exc, exc_info=True)

    # ── Downstream: run_live() Events → WebSocket ─────────────────────────

    MAX_LIVE_RETRIES = 3

    def _is_transient_live_error(exc: BaseException) -> bool:
        """Return True if the Gemini Live WS error is retryable.

        Delegates to classify_api_error which checks:
          1. exc.status_code (google.genai.errors.APIError structured field)
          2. String-matching the message as a fallback
        """
        _, retryable = classify_api_error(exc)
        return retryable

    # ── Early-push helper: execute the canvas tool on functionCall
    # so the frontend starts animating before ADK completes the round-trip.
    # The tool also runs normally via ADK (populating canvas_bridge), but
    # by then the bridge entry is already consumed here, so re-injection
    # in the functionResponse path gracefully no-ops.

    # Set of canvas tools whose results carry visual elements.
    _CANVAS_TOOL_NAMES = {
        "draw_on_canvas", "write_text_on_canvas", "draw_diagram",
        "highlight_area", "add_image_to_canvas", "clear_canvas",
        "plot_function",
    }

    # Track tool names already early-pushed so we skip the duplicate
    # re-injection when the normal functionResponse arrives from ADK.
    _early_pushed: set[str] = set()

    async def _try_early_canvas_push(
        ws: WebSocket, tool_name: str, args: dict | None,
    ) -> None:
        """If *tool_name* is a canvas tool, run it now and push the result
        to the client right away so animation starts while the model is
        still processing the tool round-trip internally."""
        if tool_name not in _CANVAS_TOOL_NAMES or args is None:
            return
        try:
            # Dynamically resolve the tool function
            from app.tools import canvas_tools as _ct
            from app.tools import plot_tools as _pt

            fn = getattr(_pt, tool_name, None) or getattr(_ct, tool_name, None)
            if fn is None:
                return

            result = fn(**args)  # returns a slim dict with deferred_canvas_id

            # If it produced bridge data, pop and forward immediately
            if isinstance(result, dict) and "deferred_canvas_id" in result:
                c_id = result["deferred_canvas_id"]
                from app.tools.canvas_tools import canvas_bridge
                if c_id in canvas_bridge:
                    bridge_data = canvas_bridge.pop(c_id)
                    result["elements"] = bridge_data["elements"]
                    if "animation" in bridge_data:
                        result["animation"] = bridge_data["animation"]

                    # Wrap in a functionResponse-shaped event so the
                    # frontend's existing CanvasCommand extractor works.
                    early_event = {
                        "content": {
                            "parts": [{
                                "functionResponse": {
                                    "name": tool_name,
                                    "response": result,
                                }
                            }]
                        }
                    }
                    await ws.send_text(json.dumps(early_event))
                    _early_pushed.add(tool_name)
                    logger.info(
                        "Early canvas push for %s (%d elements, animated=%s)",
                        tool_name, len(bridge_data["elements"]),
                        "animation" in bridge_data,
                    )
        except Exception as exc:
            # Never let this crash the stream — the normal ADK path
            # will still deliver the data via functionResponse.
            logger.warning("Early canvas push failed for %s: %s", tool_name, exc)

    # Mutable holder so the retry loop can swap the session id
    current_session_id = session_id

    async def downstream_task():
        """Stream ADK events back to the client WebSocket.

        Wraps ``run_live`` in a retry loop so transient Gemini Live
        connection drops are automatically recovered instead of killing
        the whole session.  On reconnect we create a **fresh** ADK session
        because the old conversation history can contain data that the new
        Gemini Live connection rejects (→ 1007).
        """
        nonlocal current_session_id

        for attempt in range(MAX_LIVE_RETRIES + 1):
            try:
                async for event in runner.run_live(
                    user_id=user_id,
                    session_id=current_session_id,
                    live_request_queue=live_request_queue,
                    run_config=run_config,
                ):
                    # ── Check for ADK-level errors first ──────────────
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

                    # ── Log function calls/responses for debugging ────
                    # Also: pre-execute canvas tools on functionCall so
                    # the frontend starts drawing IMMEDIATELY, before
                    # ADK finishes its internal tool round-trip.  This
                    # lets the animation overlap with the speech that
                    # follows the tool result.
                    if event.content and event.content.parts:
                        for _p in event.content.parts:
                            if _p.function_call:
                                logger.info(
                                    "\u25b6 FunctionCall: %s args=%s",
                                    _p.function_call.name,
                                    _p.function_call.args,
                                )
                                # ── Early image-generation signal ──────
                                # Alert the frontend IMMEDIATELY so it
                                # can show a loading spinner before the
                                # Gemini image API call even starts.
                                if _p.function_call.name == "generate_and_show_image":
                                    await _send_json(websocket, {
                                        "type": "generating_image",
                                        "tool": "generate_and_show_image",
                                        "status": "started",
                                    })
                                    logger.info("Sent early generating_image signal to client")
                                # ── Early canvas push ─────────────────
                                await _try_early_canvas_push(
                                    websocket,
                                    _p.function_call.name,
                                    _p.function_call.args,
                                )
                            if _p.function_response:
                                logger.info(
                                    "\u25c0 FunctionResponse: %s -> %s",
                                    _p.function_response.name,
                                    json.dumps(_p.function_response.response)[:300],
                                )

                    # ── Forward the full event JSON to the client ─────
                    try:
                        event_dict = event.model_dump(
                            mode='json', exclude_none=True, by_alias=True,
                        )

                        # ── Data Bridge Re-injection ──────────────────
                        if event_dict.get("content") and event_dict["content"].get("parts"):
                            for part in event_dict["content"]["parts"]:
                                resp = part.get("functionResponse") or part.get("function_response")
                                if resp and resp.get("response"):
                                    r_data = resp["response"]
                                    # Re-inject deferred image data
                                    if isinstance(r_data, dict) and "deferred_file_id" in r_data:
                                        f_id = r_data["deferred_file_id"]
                                        from app.tools.canvas_tools import image_bridge
                                        if f_id in image_bridge:
                                            r_data["files"] = {f_id: image_bridge.pop(f_id)}
                                            if not r_data.get("elements"):
                                                r_data["elements"] = [
                                                    {
                                                        "type": "image",
                                                        "fileId": f_id,
                                                        "x": 100,
                                                        "y": 100,
                                                        "width": 400,
                                                        "height": 300,
                                                        "status": "saved",
                                                    }
                                                ]
                                                r_data.setdefault("tool", "generate_and_show_image")
                                                r_data.setdefault("action", "add")
                                            logger.info("Re-injected deferred image data for fileId: %s", f_id)
                                    # Re-inject deferred canvas element data
                                    # (skip if already delivered via early canvas push)
                                    if isinstance(r_data, dict) and "deferred_canvas_id" in r_data:
                                        tool_of_resp = r_data.get("tool") or (resp.get("name") or "")
                                        if tool_of_resp in _early_pushed:
                                            # Already sent — discard the duplicate bridge entry
                                            c_id = r_data["deferred_canvas_id"]
                                            from app.tools.canvas_tools import canvas_bridge
                                            canvas_bridge.pop(c_id, None)
                                            _early_pushed.discard(tool_of_resp)
                                            logger.info(
                                                "Skipped duplicate re-injection for %s (early-pushed)",
                                                tool_of_resp,
                                            )
                                        else:
                                            c_id = r_data["deferred_canvas_id"]
                                            from app.tools.canvas_tools import canvas_bridge
                                            if c_id in canvas_bridge:
                                                bridge_data = canvas_bridge.pop(c_id)
                                                r_data["elements"] = bridge_data["elements"]
                                                if "animation" in bridge_data:
                                                    r_data["animation"] = bridge_data["animation"]
                                                logger.info(
                                                    "Re-injected canvas elements for cmd: %s (%d elements, animated=%s)",
                                                    c_id, len(bridge_data["elements"]),
                                                    "animation" in bridge_data,
                                                )

                        event_json = json.dumps(event_dict)
                        await websocket.send_text(event_json)
                    except Exception as send_exc:
                        logger.error("Failed to send event: %s", send_exc)
                        break

                # Generator finished cleanly — no retry needed
                return

            except Exception as exc:
                error_payload, retryable = classify_api_error(exc)
                if retryable and attempt < MAX_LIVE_RETRIES:
                    delay = 1.0 * (attempt + 1)
                    logger.warning(
                        "Gemini Live connection lost (attempt %d/%d, code=%s): %s "
                        "— reconnecting in %.0fs…",
                        attempt + 1, MAX_LIVE_RETRIES,
                        error_payload.code, exc, delay,
                    )
                    await _send_json(websocket, {
                        "type": "info",
                        "code": "RECONNECTING",
                        "message": error_payload.message,
                        "attempt": attempt + 1,
                        "max_attempts": MAX_LIVE_RETRIES,
                    })

                    # Create a fresh ADK session so the reconnect doesn't
                    # replay stale history that the model would reject (1007).
                    try:
                        new_sid = f"{session_id}-r{attempt + 1}"
                        await session_service.create_session(
                            app_name="magic-whiteboard-tutor",
                            user_id=user_id,
                            session_id=new_sid,
                        )
                        current_session_id = new_sid
                        logger.info(
                            "Created fresh ADK session %s for reconnect attempt %d",
                            new_sid, attempt + 1,
                        )
                    except Exception as sess_exc:
                        logger.error("Failed to create fresh session: %s", sess_exc)

                    await asyncio.sleep(delay)
                    continue

                # Non-transient or out of retries — inform client and exit
                logger.error("Downstream error: %s", exc, exc_info=True)
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
                return

    # ── Run both tasks concurrently, clean up on exit ─────────────────────

    try:
        await asyncio.gather(upstream_task(), downstream_task())
    except Exception as exc:
        logger.error("Session error: %s", exc, exc_info=True)
    finally:
        # ── Persist session end to Firestore ─────────────────────────────
        try:
            from app.db import get_db as _get_dashboard_db
            _dash_db = _get_dashboard_db()
            if _dash_db:
                session_end_time = datetime.now(timezone.utc)
                duration_minutes = round(
                    (session_end_time - session_start_time).total_seconds() / 60, 1
                )
                _sess_doc = (
                    _dash_db.collection("users")
                    .document(user_id)
                    .collection("sessions")
                    .document(session_id)
                )
                _sess_doc.set(
                    {
                        "ended_at": session_end_time,
                        "duration_minutes": duration_minutes,
                        "status": "completed",
                    },
                    merge=True,
                )
                logger.info(
                    "Session ended in Firestore: users/%s/sessions/%s (%.1f min)",
                    user_id, session_id, duration_minutes,
                )
        except Exception as _fs_exc:
            logger.warning("Failed to save session end: %s", _fs_exc)

        # Remove the WS notify callback so the closed websocket can
        # be GC'd and no stale callbacks linger in the contextvar.
        ws_notify.reset(_notify_token)
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
