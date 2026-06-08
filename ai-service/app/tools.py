"""Tool execution proxy.

The agent does not touch the database directly. Instead it calls back into the
Node backend's internal endpoint, which owns Prisma, role-based scoping, and the
CRUD field vocabulary. The backend returns the projected `result` plus the
normalized `fields` it actually used (so the evaluate node can check coverage
without duplicating the field vocabulary here).
"""
from __future__ import annotations

import logging
from typing import Any, TypedDict

import httpx

from .config import settings
from .state import AgentAction

logger = logging.getLogger("dream-ai.tools")


class ToolResponse(TypedDict):
    result: Any
    fields: list[str]


async def run_tool(role: str, user_id: str, action: AgentAction) -> ToolResponse:
    url = f"{settings.backend_url}/internal/ai/tool"
    headers = {"x-internal-secret": settings.internal_secret}
    payload = {"role": role, "userId": user_id, "action": action}

    async with httpx.AsyncClient(timeout=settings.tool_timeout) as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code == 401 or response.status_code == 403:
        logger.error("Internal tool endpoint rejected the request (%s).", response.status_code)
        return {"result": {"error": "The AI service is not authorized to reach the CRM tools."}, "fields": []}

    response.raise_for_status()
    data = response.json()
    return {"result": data.get("result"), "fields": data.get("fields") or []}
