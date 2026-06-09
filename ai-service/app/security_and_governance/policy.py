"""Authorization and governance policy helpers."""
from __future__ import annotations

CRM_TOOL_ROLES = {"AGENT", "ADMIN"}


def can_use_crm_tools(role: str | None) -> bool:
    return role in CRM_TOOL_ROLES
