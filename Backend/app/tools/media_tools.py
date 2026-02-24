import base64
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types

from app.tools.canvas_tools import add_image_to_canvas

# Pre-recorded audio: 16 kHz mono PCM, 16-bit. Played when image is generated.
# Add your own file at this path or run scripts/generate_image_ok_audio.py
_AUDIO_ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets" / "audio"
_IMAGE_GENERATED_AUDIO_PATH = _AUDIO_ASSETS_DIR / "image_generated_successfully.pcm"
_AUDIO_MIME = "audio/pcm;rate=16000"


class MediaTools:
    """Tool for generating educational images using Gemini API and displaying them on the canvas."""

    def __init__(self):
        self.client = genai.Client(
            api_key=os.environ.get("GEMINI_API_KEY"),
        )
        self.model = "gemini-3-pro-image-preview"

    async def generate_image(self, prompt: str) -> str:
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            image_config=types.ImageConfig(image_size="1K"),
            response_modalities=["IMAGE", "TEXT"],
        )

        # 🔥 IMPORTANT: await first
        stream = await self.client.aio.models.generate_content_stream(
            model=self.model,
            contents=contents,
            config=generate_content_config,
        )

        async for chunk in stream:
            if not chunk.parts:
                continue

            part = chunk.parts[0]

            if part.inline_data and part.inline_data.data:
                return base64.b64encode(part.inline_data.data).decode("utf-8")

        return ""

    async def generate_and_show_image(
        self,
        prompt: str,
        x: float = 100.0,
        y: float = 100.0,
        width: float = 400.0,
        height: float = 300.0,
    ) -> Dict[str, Any]:
        """
        Generate an educational image and place it on the student's whiteboard.

        Parameters
        ----------
        prompt:
            Detailed description of the image to generate.
        x:
            Horizontal position on the canvas (default 100).
        y:
            Vertical position on the canvas (default 100).
        width:
            Display width in pixels (default 400).
        height:
            Display height in pixels (default 300).

        Returns
        -------
        dict
            Canvas command payload with the image element and file data,
            ready to be rendered on the Excalidraw whiteboard.
        """
        image_b64 = await self.generate_image(prompt)
        if not image_b64:
            # Same shape as canvas tools: status, tool, action, elements
            return {
                "status": "error",
                "tool": "generate_and_show_image",
                "action": "add",
                "elements": [],
                "message": "Image generation failed — no data returned.",
            }

        await add_image_to_canvas(
            image_base64=image_b64,
            x=x,
            y=y,
            width=width,
            height=height,
            mime_type="image/png",
        )

        # Align with canvas tool response format: ensure tool name matches this tool

        
        return {
        "status": "ok",
        "tool": "generate_and_show_image",
        "action": "add"
    }
