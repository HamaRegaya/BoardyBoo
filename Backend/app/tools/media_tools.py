import base64
import mimetypes
import os
from typing import Any, Dict, List, Optional

from google import genai
from google.genai import types

from app.tools.canvas_tools import add_image_to_canvas


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
            return {"status": "error", "message": "Image generation failed — no data returned."}

        return await add_image_to_canvas(
            image_base64=image_b64,
            x=x,
            y=y,
            width=width,
            height=height,
            mime_type="image/png",
        )
