"""Shared agent state types.

These map 1:1 onto the LangGraph state channels. LangGraph uses the dict keys
as channels with a last-write-wins reducer, so each node just returns a partial
dict of the keys it wants to update.
"""
from __future__ import annotations

from typing import Any, Literal, Optional, TypedDict

CrudResource = Literal["prospect", "pipeline"]
CrudOperation = Literal["list", "get", "create", "update", "delete"]


class AgentAction(TypedDict, total=False):
    resource: CrudResource
    operation: CrudOperation
    id: str
    lookupName: str
    fields: list[str]
    data: dict[str, Any]
    # Set by the repair node so the backend re-runs with its default field set.
    useDefaultFields: bool


class Evaluation(TypedDict):
    satisfied: bool
    reason: str
    needsRepair: bool


class AgentState(TypedDict, total=False):
    role: str
    userId: str
    message: str
    action: Optional[AgentAction]
    toolResult: Any
    evaluation: Optional[Evaluation]
    reply: Optional[str]
    attempts: int


def has_tool_action(action: Optional[AgentAction]) -> bool:
    """True when the planned action is a real CRUD request."""
    return bool(action and action.get("resource") and action.get("operation"))
