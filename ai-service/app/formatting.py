"""Deterministic result formatting + the local (non-LLM) fallback reply.

Ported from the Node service so the agent can answer ranking/insight questions
and degrade gracefully when the model finalization fails.
"""
from __future__ import annotations

import json
import math
import re
from typing import Any, Optional

from .state import AgentAction, AgentState, has_tool_action

_VERBS = {
    "list": "Listed",
    "get": "Loaded",
    "create": "Created",
    "update": "Updated",
    "delete": "Deleted",
}


def readable_error(result: Any) -> Optional[str]:
    if isinstance(result, dict) and "error" in result:
        return str(result["error"])
    return None


def numeric_value(value: Any) -> Optional[float]:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)) and math.isfinite(value):
        return float(value)
    if isinstance(value, str):
        try:
            parsed = float(value.replace("%", "").strip())
        except ValueError:
            return None
        return parsed if math.isfinite(parsed) else None
    return None


def format_probability(value: float) -> str:
    if float(value).is_integer():
        return f"{int(value)}%"
    return f"{round(value, 2)}%"


def missing_requested_fields(result: Any, fields: Optional[list[str]]) -> list[str]:
    if not fields:
        return []
    if isinstance(result, list):
        if not result:
            return []
        first = result[0]
        if not isinstance(first, dict):
            return list(fields)
        return [field for field in fields if field not in first]
    if isinstance(result, dict):
        if result.get("error") or result.get("deleted"):
            return []
        return [field for field in fields if field not in result]
    return list(fields)


def field_label(key: str) -> str:
    spaced = re.sub(r"([A-Z])", r" \1", key)
    return spaced[:1].upper() + spaced[1:] if spaced else spaced


def format_value(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, list):
        return ", ".join(str(item) for item in value)
    if isinstance(value, dict):
        return json.dumps(value)
    if value is None:
        return ""
    return str(value)


def format_row(row: dict[str, Any]) -> str:
    return ", ".join(f"{field_label(key)}: {format_value(value)}" for key, value in row.items())


def format_list(resource: str, rows: list[Any]) -> str:
    if not rows:
        return f"No {'prospects' if resource == 'prospect' else 'submission cases'} found."
    header = "Prospects" if resource == "prospect" else "Submission cases"
    lines = [f"{index + 1}. {format_row(row)}" for index, row in enumerate(rows)]
    return f"{header}:\n" + "\n".join(lines)


def format_object(action: AgentAction, row: dict[str, Any]) -> str:
    if row.get("error"):
        return str(row["error"])
    if row.get("deleted"):
        label = row.get("name") if action.get("resource") == "prospect" else row.get("applicant")
        return f"Deleted {action.get('resource')} {label or row.get('id') or ''}."
    verb = _VERBS.get(action.get("operation", ""), "Updated")
    return f"{verb} {action.get('resource')}: {format_row(row)}."


def build_structured_insight(state: AgentState) -> Optional[str]:
    return _build_prospect_probability_insight(state)


def _build_prospect_probability_insight(state: AgentState) -> Optional[str]:
    action = state.get("action")
    rows = state.get("toolResult")
    lower = (state.get("message") or "").lower()

    if not action or action.get("resource") != "prospect" or not isinstance(rows, list):
        return None
    if not re.search(r"\b(probability|score)\b", lower) or not re.search(
        r"\b(lowest|highest|second|higher|lower)\b", lower
    ):
        return None

    prospects: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        probability = numeric_value(row.get("probability"))
        if probability is None:
            continue
        name = str(row.get("name") or row.get("id") or "Unnamed prospect")
        prospects.append({"name": name, "probability": probability})

    if not prospects:
        return "I could not find any prospect probability values to compare."

    prospects.sort(key=lambda item: item["probability"])

    if "highest" in lower:
        highest = prospects[-1]
        second = prospects[-2] if len(prospects) >= 2 else None
        if second and re.search(r"\b(second|lower)\b", lower):
            return (
                f"The highest-probability prospect is {highest['name']} at "
                f"{format_probability(highest['probability'])}. The next lower prospect is "
                f"{second['name']} at {format_probability(second['probability'])}."
            )
        return (
            f"The highest-probability prospect is {highest['name']} at "
            f"{format_probability(highest['probability'])}."
        )

    if "lowest" in lower:
        lowest = prospects[0]
        nxt = prospects[1] if len(prospects) >= 2 else None
        if nxt and re.search(r"\b(second|higher|slightly)\b", lower):
            return (
                f"The lowest-probability prospect is {lowest['name']} at "
                f"{format_probability(lowest['probability'])}. The next higher prospect is "
                f"{nxt['name']} at {format_probability(nxt['probability'])}."
            )
        return (
            f"The lowest-probability prospect is {lowest['name']} at "
            f"{format_probability(lowest['probability'])}."
        )

    return None


def build_tool_fallback_reply(state: AgentState) -> str:
    result = state.get("toolResult")
    action = state.get("action")
    if not has_tool_action(action):
        return (
            readable_error(result)
            or "Tell me which database you want to organize: prospects or submission pipeline."
        )
    evaluation = state.get("evaluation")
    if evaluation and not evaluation["satisfied"] and not evaluation["needsRepair"]:
        return readable_error(result) or evaluation["reason"]
    if isinstance(result, list):
        return format_list(action["resource"], result)  # type: ignore[index]
    if isinstance(result, dict):
        return format_object(action, result)  # type: ignore[arg-type]
    return "Done."
