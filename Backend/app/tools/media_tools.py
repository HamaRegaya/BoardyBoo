import mimetypes
import os
from google import genai
from google.genai import types

class MediaTools:
    """Tool for generating educational images using Nano Babana Pro (Gemini API)."""
    def __init__(self):
        self.client = genai.Client(
            api_key=os.environ.get("GEMINI_API_KEY"),
        )
        self.model = "gemini-3-pro-image-preview"

    def generate_image(self, prompt: str, file_prefix: str = "media_image") -> str:
        """
        Generate an image from a prompt using Nano Babana Pro (Gemini API).
        Returns the saved file path.
        """
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)],
            ),
        ]
        tools = [
            types.Tool(googleSearch=types.GoogleSearch()),
        ]
        generate_content_config = types.GenerateContentConfig(
            image_config=types.ImageConfig(
                aspect_ratio="",
                image_size="1K",
                person_generation="",
            ),
            response_modalities=["IMAGE", "TEXT"],
            tools=tools,
        )
        file_index = 0
        saved_files = []
        for chunk in self.client.models.generate_content_stream(
            model=self.model,
            contents=contents,
            config=generate_content_config,
        ):
            if chunk.parts is None:
                continue
            if chunk.parts[0].inline_data and chunk.parts[0].inline_data.data:
                inline_data = chunk.parts[0].inline_data
                data_buffer = inline_data.data
                file_extension = mimetypes.guess_extension(inline_data.mime_type)
                file_name = f"{file_prefix}_{file_index}{file_extension}"
                with open(file_name, "wb") as f:
                    f.write(data_buffer)
                saved_files.append(file_name)
                file_index += 1
            elif chunk.text:
                # Optionally log or return text
                pass
        return saved_files[0] if saved_files else ""

# Example usage:
# tool = MediaTools()
# file_path = tool.generate_image("Draw a labelled diagram of a plant cell.")
# print(f"Image saved to: {file_path}")
