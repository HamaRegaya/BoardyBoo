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


# ── Text measurement helper ───────────────────────────────────────────────────

_CHAR_WIDTH_RATIO = 0.8    # approximate width-per-pixel relative to font_size (Virgil/handwriting font runs wide)
_LINE_HEIGHT_RATIO = 1.35  # line height relative to font_size
_H_PAD = 24                # horizontal padding inside a box (each side)
_V_PAD = 14                # vertical padding inside a box (each side)

# Auto-advancing Y cursor so consecutive text writes stack vertically.
# Reset by clear_canvas.
_TEXT_SPACING = 12          # vertical gap between consecutive text blocks
_cursor_y: float = 60.0    # current vertical cursor position
_CURSOR_Y_INIT: float = 60.0


def _measure_text_width(text: str, font_size: int) -> float:
    """Estimate the rendered pixel width for a single line of text.

    Uses a conservative character-width ratio suitable for Excalidraw's
    'Virgil' (hand-drawn) font.  Multi-line strings use the longest line.
    """
    longest = max((len(line) for line in text.splitlines()), default=0)
    return max(longest * font_size * _CHAR_WIDTH_RATIO, font_size)


def _box_size(
    text: str,
    font_size: int,
    min_width: float = 120.0,
    min_height: float = 44.0,
) -> tuple[float, float]:
    """Return (width, height) for a box that comfortably contains *text*."""
    lines = text.splitlines() or [text]
    num_lines = len(lines)
    w = max(
        max(_measure_text_width(line, font_size) for line in lines) + _H_PAD * 2,
        min_width,
    )
    h = max(
        num_lines * font_size * _LINE_HEIGHT_RATIO + _V_PAD * 2,
        min_height,
    )
    return w, h


# ── Canvas Element Bridge ─────────────────────────────────────────────────────
# Stores full element payloads so tool responses sent back to the Gemini Live
# model stay small.  main.py re-injects the element data before forwarding
# events to the client WebSocket.  This prevents 1008 policy-violation errors
# caused by large function-response payloads in the Live streaming session.

canvas_bridge: Dict[str, Dict[str, Any]] = {}


def _defer_elements(
    tool_name: str,
    action: str,
    elements: List[Dict[str, Any]],
    animation: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Store elements in the bridge and return a slim, model-safe response.

    Parameters
    ----------
    animation:
        Optional list of animation group dicts, each with ``start`` (int),
        ``end`` (int, exclusive) and ``delay`` (ms).  When present the
        frontend renders the element slices progressively.
    """
    import uuid as _uuid_mod

    cmd_id = f"cmd-{_uuid_mod.uuid4().hex[:12]}"
    bridge_data: Dict[str, Any] = {
        "tool": tool_name,
        "action": action,
        "elements": elements,
    }
    if animation:
        bridge_data["animation"] = animation
    canvas_bridge[cmd_id] = bridge_data
    return {
        "status": "ok",
        "tool": tool_name,
        "action": action,
        "element_count": len(elements),
        "deferred_canvas_id": cmd_id,
    }


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

    elems = elements if action != "clear" else []
    logger.info("draw_on_canvas: action=%s elements=%d", action, len(elems))
    return _defer_elements("draw_on_canvas", action, elems)


def write_text_on_canvas(
    text: str,
    x: float = 100.0,
    y: float = -1.0,
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
        Vertical position in canvas pixels.  Leave at default (-1) to
        auto-place below the last text written.
    font_size:
        Font size in pixels (default 24).
    color:
        Hex color string (default dark grey).
    """
    global _cursor_y

    # Auto-position: place below the last text written
    if y < 0:
        y = _cursor_y

    # Estimate height of this text block
    lines = text.splitlines() or [text]
    text_h = len(lines) * font_size * _LINE_HEIGHT_RATIO

    element = {
        "type": "text",
        "x": x,
        "y": y,
        "text": text,
        "fontSize": font_size,
        "strokeColor": color,
        "fontFamily": 1,          # Virgil (hand-drawn)
        # width/height omitted — Excalidraw auto-sizes text using real font metrics
    }

    # Advance cursor past this block
    _cursor_y = y + text_h + _TEXT_SPACING

    logger.info("write_text_on_canvas at (%.0f, %.0f): %s", x, y, text[:60])
    return _defer_elements("write_text_on_canvas", "add", [element])


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
        # Pre-compute the widest box so all flowchart steps are the same width
        fc_font = 18
        max_box_w = max((_box_size(it, fc_font)[0] for it in items), default=200)
        box_h = 50  # fixed height per step
        row_gap = 100  # vertical distance between box tops

        for i, item in enumerate(items):
            box_y = y + 60 + i * row_gap
            item_w, _ = _box_size(item, fc_font)
            bw = max(item_w, max_box_w)  # uniform width across all steps
            cx = x + bw / 2             # centre-x for the arrow
            elements.append({
                "type": "rectangle",
                "x": x,
                "y": box_y,
                "width": bw,
                "height": box_h,
                "strokeColor": "#1864ab",
                "backgroundColor": "#d0ebff",
                "fillStyle": "solid",
            })
            _, th = _box_size(item, fc_font, min_width=0, min_height=0)
            elements.append({
                "type": "text",
                "x": x + _H_PAD,
                "y": box_y + (box_h - th) / 2,
                "text": item,
                "fontSize": fc_font,
                "strokeColor": "#1e1e1e",
                # Use full box interior so long labels are never clipped
                "width": bw - _H_PAD * 2,
                "height": th,
            })
            if i < len(items) - 1:
                elements.append({
                    "type": "arrow",
                    "x": cx,
                    "y": box_y + box_h,
                    "width": 0,
                    "height": row_gap - box_h,
                    "strokeColor": "#1864ab",
                })

    elif diagram_type == "mindmap":
        import math
        mm_font = 16
        # Size the central node to fit the title text
        centre_text = title or "Topic"
        centre_w = max(_measure_text_width(centre_text, mm_font) + _H_PAD * 2, 160)
        centre_h = max(mm_font * _LINE_HEIGHT_RATIO + _V_PAD * 2, 60)
        cx_centre = x + 50 + centre_w / 2
        cy_centre = y + 90 + centre_h / 2
        elements.append({
            "type": "ellipse",
            "x": x + 50,
            "y": y + 60,
            "width": centre_w,
            "height": centre_h,
            "strokeColor": "#e67700",
            "backgroundColor": "#fff3bf",
            "fillStyle": "solid",
        })
        for i, item in enumerate(items):
            angle = (2 * math.pi * i) / max(len(items), 1)
            bw, bh = _box_size(item, mm_font)
            # Radiate branches further out when items are wider
            radius_x = max(centre_w / 2 + bw + 40, 220)
            radius_y = max(centre_h / 2 + bh + 40, 175)
            bx = int(cx_centre + radius_x * math.cos(angle) - bw / 2)
            by = int(cy_centre + radius_y * math.sin(angle) - bh / 2)
            elements.append({
                "type": "rectangle",
                "x": bx,
                "y": by,
                "width": bw,
                "height": bh,
                "strokeColor": "#2b8a3e",
                "backgroundColor": "#d3f9d8",
                "fillStyle": "solid",
            })
            _, th = _box_size(item, mm_font, min_width=0, min_height=0)
            elements.append({
                "type": "text",
                "x": bx + _H_PAD,
                "y": by + (bh - th) / 2,
                "text": item,
                "fontSize": mm_font,
                "strokeColor": "#1e1e1e",
                "width": bw - _H_PAD * 2,
                "height": th,
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
        # Generic: render items as text list inside a border rectangle.
        # Size the rectangle to the widest item so nothing overflows.
        gen_font = 18
        inner_w = max(
            (_measure_text_width(it, gen_font) for it in items),
            default=300,
        )
        box_w = inner_w + _H_PAD * 2 + 20
        row_px = gen_font * _LINE_HEIGHT_RATIO + 6
        box_h = 60 + len(items) * row_px + 20
        elements.append({
            "type": "rectangle",
            "x": x - 10,
            "y": y - 10,
            "width": box_w,
            "height": box_h,
            "strokeColor": "#868e96",
        })
        for i, item in enumerate(items):
            _, th = _box_size(item, gen_font, min_width=0, min_height=0)
            elements.append({
                "type": "text",
                "x": x + _H_PAD,
                "y": y + 50 + i * row_px,
                "text": item,
                "fontSize": gen_font,
                "strokeColor": "#1e1e1e",
                # Full box interior so nothing clips
                "width": box_w - _H_PAD * 2 - 20,
                "height": th,
            })

    logger.info(
        "draw_diagram: type=%s title=%s items=%d elements=%d",
        diagram_type, title, len(items), len(elements),
    )
    return _defer_elements("draw_diagram", "add", elements)


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
    return _defer_elements("highlight_area", "add", [element])



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


# ── Imported from plot_tools to keep this module focused ──────────────────────
from app.tools.plot_tools import plot_function  # noqa: E402


def clear_canvas() -> Dict[str, Any]:
    """Clear everything from the whiteboard canvas."""
    global _cursor_y
    _cursor_y = _CURSOR_Y_INIT
    return _defer_elements("clear_canvas", "clear", [])


# ── Export FunctionTool wrappers ──────────────────────────────────────────────

canvas_tools = [
    draw_on_canvas,
    write_text_on_canvas,
    draw_diagram,
    highlight_area,
    add_image_to_canvas,
    plot_function,
    clear_canvas,
]
