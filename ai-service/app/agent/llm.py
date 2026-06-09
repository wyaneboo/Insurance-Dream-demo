"""Gemini calls and model output parsing.

Uses the same `google-genai` SDK the Node backend used via `@google/genai`,
with the same model fallback + timeout behaviour.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Optional

from google import genai

from ..memory.state import AgentAction, AgentState
from ..prompt import prompts
from ..security_and_governance.config import DEFAULT_AI_MODEL, settings

logger = logging.getLogger("dream-ai.llm")

_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.api_key)
    return _client


async def generate_text(prompt: str) -> str:
    """Call Gemini, falling back to the default model and enforcing a timeout."""
    models = list(dict.fromkeys([settings.model, DEFAULT_AI_MODEL]))
    client = _get_client()

    last_error: Optional[BaseException] = None
    for model in models:
        try:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(model=model, contents=prompt),
                timeout=settings.model_timeout,
            )
            return response.text or ""
        except Exception as error:  # noqa: BLE001 - surfaced to the caller below
            last_error = error
            if model != DEFAULT_AI_MODEL:
                logger.warning(
                    "AI model %s failed; retrying with %s. %s",
                    model,
                    DEFAULT_AI_MODEL,
                    describe_provider_error(error),
                )

    raise RuntimeError(describe_provider_error(last_error))


async def generate_conversation_reply(state: AgentState) -> str:
    text = await generate_text(prompts.build_conversation_prompt(state))
    return text.strip() or "How can I help?"


async def generate_final_reply(state: AgentState) -> str:
    text = await generate_text(prompts.build_final_reply_prompt(state))
    return text.strip()


# --- Parsing -----------------------------------------------------------------

def parse_json_object(text: str) -> Optional[dict[str, Any]]:
    raw = text.strip()
    if raw.startswith("{"):
        json_text: Optional[str] = raw
    else:
        start = raw.find("{")
        end = raw.rfind("}")
        json_text = raw[start : end + 1] if start != -1 and end > start else None
    if not json_text:
        return None
    try:
        parsed = json.loads(json_text)
    except (ValueError, TypeError):
        return None
    return parsed if isinstance(parsed, dict) else None


def parse_action(text: str) -> Optional[AgentAction]:
    """Extract a CRUD action from the model output.

    Field normalization deliberately stays in the Node backend (it owns the
    Prisma column vocabulary), so the raw requested fields are passed through.
    """
    parsed = parse_json_object(text)
    if parsed is None:
        return None

    nested = parsed.get("action")
    candidate = nested if isinstance(nested, dict) else parsed

    resource = candidate.get("resource")
    operation = candidate.get("operation")
    if resource not in ("prospect", "pipeline"):
        return None
    if operation not in ("list", "get", "create", "update", "delete"):
        return None

    action: AgentAction = {"resource": resource, "operation": operation}
    if isinstance(candidate.get("id"), str):
        action["id"] = candidate["id"]
    if isinstance(candidate.get("lookupName"), str):
        action["lookupName"] = candidate["lookupName"]
    if isinstance(candidate.get("fields"), list):
        action["fields"] = [f for f in candidate["fields"] if isinstance(f, str)]
    if isinstance(candidate.get("data"), dict):
        action["data"] = candidate["data"]
    return action


def parse_reply(text: str) -> Optional[str]:
    parsed = parse_json_object(text)
    reply = parsed.get("reply") if parsed else None
    if isinstance(reply, str) and reply.strip():
        return reply.strip()
    return None


# --- Errors ------------------------------------------------------------------

def describe_provider_error(error: Any) -> str:
    raw = str(error) if error else "Unknown AI error"
    try:
        parsed = json.loads(raw)
        inner = parsed.get("error", {}) if isinstance(parsed, dict) else {}
        message = inner.get("message") or "AI provider request failed."
        status = inner.get("status")
        if status:
            return f"AI provider returned {status}: {message}"
        return f"AI provider returned an error: {message}"
    except (ValueError, TypeError):
        return raw or "Unknown AI error"
