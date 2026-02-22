"""Application configuration using pydantic-settings."""

from __future__ import annotations

import json
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised application settings loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Google AI / Vertex AI ──────────────────────────────────────────────
    google_genai_use_vertexai: bool = False
    google_api_key: str = ""
    google_cloud_project: str = ""
    google_cloud_location: str = "us-central1"

    # ── Models ─────────────────────────────────────────────────────────────
    # Root agent uses native-audio model; sub-agents need bidi-compatible models
    tutor_agent_model: str = "gemini-2.5-flash-native-audio-preview-12-2025"
    planner_agent_model: str = "gemini-2.5-flash-native-audio-preview-12-2025"
    canvas_agent_model: str = "gemini-2.5-flash-native-audio-preview-12-2025"
    calendar_agent_model: str = "gemini-2.5-flash-native-audio-preview-12-2025"
    media_agent_model: str = "gemini-2.5-flash-native-audio-preview-12-2025"
    progress_agent_model: str = "gemini-2.5-flash-native-audio-preview-12-2025"

    # ── MCP GenMedia ───────────────────────────────────────────────────────
    genmedia_mcp_server_url: str = "http://localhost:8081"
    genmedia_bucket: str = ""

    # ── Google OAuth (Calendar / Gmail) ────────────────────────────────────
    google_oauth_client_id: str = ""
    google_oauth_client_secret: str = ""

    # ── Firestore ──────────────────────────────────────────────────────────
    firestore_database: str = "(default)"

    # ── Cloud Storage ──────────────────────────────────────────────────────
    gcs_bucket: str = ""

    # ── Server ─────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"
    cors_origins: str = '["http://localhost:3000"]'

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from JSON string."""
        try:
            return json.loads(self.cors_origins)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:3000"]


# Singleton
settings = Settings()
