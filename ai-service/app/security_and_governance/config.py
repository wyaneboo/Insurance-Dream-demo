"""Runtime configuration loaded from environment variables.

Mirrors the resolution order used by the Node backend's `configuration.ts`
so the same `.env` values work for either side.
"""
from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

DEFAULT_AI_MODEL = "gemini-2.5-flash"
PLACEHOLDER_API_KEY = "your_google_gemini_api_key"


def _first_configured(*values: str | None) -> str:
    for value in values:
        if value and value != PLACEHOLDER_API_KEY:
            return value
    return ""


class Settings:
    def __init__(self) -> None:
        self.api_key = _first_configured(
            os.getenv("AI_API_KEY"),
            os.getenv("GOOGLE_API_KEY"),
            os.getenv("GEMINI_API_KEY"),
        )
        self.model = os.getenv("AI_MODEL") or os.getenv("GEMINI_MODEL") or DEFAULT_AI_MODEL
        # The Node backend that owns the database + auth scoping.
        self.backend_url = (os.getenv("BACKEND_URL") or "http://localhost:4000").rstrip("/")
        # Shared secret guarding the backend's internal tool endpoint.
        self.internal_secret = os.getenv("AI_INTERNAL_SECRET", "dev_internal_secret")
        self.port = int(os.getenv("PORT", "8000"))
        self.model_timeout = float(os.getenv("AI_MODEL_TIMEOUT", "30"))
        self.tool_timeout = float(os.getenv("AI_TOOL_TIMEOUT", "30"))

    @property
    def missing_api_key(self) -> bool:
        return not self.api_key or self.api_key == PLACEHOLDER_API_KEY


settings = Settings()
