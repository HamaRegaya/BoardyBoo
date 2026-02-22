"""Canvas interaction tools for the Magic Whiteboard Tutor.

These tools let the AI agent read the current whiteboard state and
instruct the frontend to draw / modify elements on the Excalidraw canvas.
The actual rendering happens client-side — the agent emits JSON commands
that the frontend interprets.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from google.adk.tools import FunctionTool
from google.genai import types

logger = logging.getLogger(__name__)


# ── Tool functions ────────────────────────────────────────────────────────────


def draw_on_canvas(
    elements: List[Dict[str, Any]],
    action: str = "add",
) -> Dict[str, Any]:
    """Draw, update, or clear elements on the student's whiteboard.

    Parameters
    ----------
    elements:
        A list of Excalidraw-compatible element dicts.  Each dict should
        contain at least ``type`` (e.g. "text", "rectangle", "arrow",
        "line", "freedraw", "ellipse") and the relevant properties like
        ``x``, ``y``, ``width``, ``height``, ``text``, ``strokeColor``, etc.
    action:
        One of ``"add"`` (append new elements), ``"replace"`` (clear then
        add), or ``"clear"`` (remove everything from canvas).

    Returns
    -------
    dict
        Confirmation payload with the action performed.
    """
    if action not in ("add", "replace", "clear"):
        return {"status": "error", "message": f"Unknown action: {action}"}

    payload = {
        "tool": "draw_on_canvas",
        "action": action,
        "elements": elements if action != "clear" else [],
        "element_count": len(elements) if action != "clear" else 0,
    }
    logger.info("draw_on_canvas: action=%s elements=%d", action, len(elements))
    return {"status": "ok", **payload}


def write_text_on_canvas(
    text: str,
    x: float = 100.0,
    y: float = 100.0,
    font_size: int = 24,
    color: str = "#1e1e1e",
) -> Dict[str, Any]:
    """Write text on the canvas at a given position.

    Parameters
    ----------
    text:
        The text string to display.
    x:
        Horizontal position in canvas pixels.
    y:
        Vertical position in canvas pixels.
    font_size:
        Font size in pixels (default 24).
    color:
        Hex color string (default dark grey).
    """
    element = {
        "type": "text",
        "x": x,
        "y": y,
        "text": text,
        "fontSize": font_size,
        "strokeColor": color,
        "fontFamily": 1,  # Virgil (hand-drawn)
    }
    logger.info("write_text_on_canvas at (%.0f, %.0f): %s", x, y, text[:60])
    return {
        "status": "ok",
        "tool": "write_text_on_canvas",
        "action": "add",
        "elements": [element],
    }


def draw_diagram(
    diagram_type: str,
    title: str = "",
    items: Optional[List[str]] = None,
    x: float = 100.0,
    y: float = 100.0,
) -> Dict[str, Any]:
    """Draw a structured diagram on the canvas.

    Parameters
    ----------
    diagram_type:
        One of ``"flowchart"``, ``"mindmap"``, ``"timeline"``,
        ``"comparison_table"``, ``"equation"``, ``"list"``.
    title:
        Title for the diagram.
    items:
        List of labels / steps to include.
    x:
        Starting X position.
    y:
        Starting Y position.
    """
    items = items or []
    elements: List[Dict[str, Any]] = []

    # Title element
    if title:
        elements.append({
            "type": "text",
            "x": x,
            "y": y,
            "text": title,
            "fontSize": 28,
            "strokeColor": "#1864ab",
            "fontFamily": 1,
        })

    # Generate elements based on diagram type
    if diagram_type == "flowchart":
        for i, item in enumerate(items):
            box_y = y + 60 + i * 100
            elements.append({
                "type": "rectangle",
                "x": x,
                "y": box_y,
                "width": 200,
                "height": 50,
                "strokeColor": "#1864ab",
                "backgroundColor": "#d0ebff",
                "fillStyle": "solid",
            })
            elements.append({
                "type": "text",
                "x": x + 20,
                "y": box_y + 12,
                "text": item,
                "fontSize": 18,
                "strokeColor": "#1e1e1e",
            })
            if i < len(items) - 1:
                elements.append({
                    "type": "arrow",
                    "x": x + 100,
                    "y": box_y + 50,
                    "width": 0,
                    "height": 50,
                    "strokeColor": "#1864ab",
                })

    elif diagram_type == "mindmap":
        # Central node
        elements.append({
            "type": "ellipse",
            "x": x + 50,
            "y": y + 60,
            "width": 160,
            "height": 60,
            "strokeColor": "#e67700",
            "backgroundColor": "#fff3bf",
            "fillStyle": "solid",
        })
        for i, item in enumerate(items):
            import math
            angle = (2 * math.pi * i) / max(len(items), 1)
            bx = x + 130 + int(200 * math.cos(angle))
            by = y + 90 + int(150 * math.sin(angle))
            elements.append({
                "type": "rectangle",
                "x": bx,
                "y": by,
                "width": 140,
                "height": 40,
                "strokeColor": "#2b8a3e",
                "backgroundColor": "#d3f9d8",
                "fillStyle": "solid",
            })
            elements.append({
                "type": "text",
                "x": bx + 10,
                "y": by + 8,
                "text": item,
                "fontSize": 16,
                "strokeColor": "#1e1e1e",
            })

    elif diagram_type == "list":
        for i, item in enumerate(items):
            elements.append({
                "type": "text",
                "x": x + 10,
                "y": y + 60 + i * 36,
                "text": f"• {item}",
                "fontSize": 20,
                "strokeColor": "#1e1e1e",
            })

    else:
        # Generic: render items as text list with a border
        elements.append({
            "type": "rectangle",
            "x": x - 10,
            "y": y - 10,
            "width": 340,
            "height": 60 + len(items) * 36 + 20,
            "strokeColor": "#868e96",
        })
        for i, item in enumerate(items):
            elements.append({
                "type": "text",
                "x": x + 10,
                "y": y + 50 + i * 36,
                "text": item,
                "fontSize": 18,
                "strokeColor": "#1e1e1e",
            })

    logger.info(
        "draw_diagram: type=%s title=%s items=%d elements=%d",
        diagram_type, title, len(items), len(elements),
    )
    return {
        "status": "ok",
        "tool": "draw_diagram",
        "action": "add",
        "elements": elements,
    }


def highlight_area(
    x: float,
    y: float,
    width: float,
    height: float,
    color: str = "#ffec99",
) -> Dict[str, Any]:
    """Draw a translucent highlight rectangle on the canvas.

    Useful for pointing the student's attention to a specific area.

    Parameters
    ----------
    x:  Left edge.
    y:  Top edge.
    width:  Width of highlight.
    height:  Height of highlight.
    color:  Hex background color (default yellow).
    """
    element = {
        "type": "rectangle",
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "strokeColor": "transparent",
        "backgroundColor": color,
        "fillStyle": "solid",
        "opacity": 40,
    }
    return {
        "status": "ok",
        "tool": "highlight_area",
        "action": "add",
        "elements": [element],
    }



# ── Image Data Bridge ─────────────────────────────────────────────────────────

# This global store allows us to pass large image data to the frontend without
# blobbing it into the LLM conversation history, which causes 1007 errors.
# Key: file_id, Value: { dataURL, mimeType }
image_bridge: Dict[str, Dict[str, Any]] = {}


async def add_image_to_canvas(
    image_base64: str,
    x: float = 100.0,
    y: float = 100.0,
    width: float = 400.0,
    height: float = 300.0,
    mime_type: str = "image/png",
) -> Dict[str, Any]:
    """Place a base64-encoded image on the student's whiteboard canvas.

    Parameters
    ----------
    image_base64:
        The raw image bytes encoded as a base64 string (no data-URL prefix).
    x:
        Horizontal position in canvas pixels.
    y:
        Vertical position in canvas pixels.
    width:
        Display width in canvas pixels (default 400).
    height:
        Display height in canvas pixels (default 300).
    mime_type:
        MIME type of the image (default ``"image/png"``).
    """
    import uuid as _uuid

    file_id = f"img-{_uuid.uuid4().hex[:12]}"
    data_url = f"data:{mime_type};base64,{image_base64}"

    element = {
        "type": "image",
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "fileId": file_id,
        "status": "saved",
    }

    # Store the actual data in the bridge for main.py to re-inject.
    # We do NOT return the 'files' dict to the LLM to prevent 1007 errors.
    image_bridge[file_id] = {
        "id": file_id,
        "dataURL": data_url,
        "mimeType": mime_type,
        "created": 0,
    }

    logger.info(
        "add_image_to_canvas at (%.0f, %.0f) %dx%d fileId=%s (deferred)",
        x, y, width, height, file_id,
    )
    return{
        "status": "ok",
        "tool": "add_image_to_canvas",
        "action": "add",
        "elements": [element],
        "deferred_file_id": file_id,  # Signals main.py to inject files[file_id]
    }


def clear_canvas() -> Dict[str, Any]:
    """Clear everything from the whiteboard canvas."""
    return {
        "status": "ok",
        "tool": "clear_canvas",
        "action": "clear",
        "elements": [],
    }


# ── Export FunctionTool wrappers ──────────────────────────────────────────────

canvas_tools = [
    draw_on_canvas,
    write_text_on_canvas,
    draw_diagram,
    highlight_area,
    add_image_to_canvas,
    clear_canvas,
]
