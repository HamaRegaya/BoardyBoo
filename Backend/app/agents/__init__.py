import os
from google import genai

client = genai.Client(
            api_key=os.environ.get("GEMINI_API_KEY"),
            http_options={'api_version': 'v1beta'}
        )
