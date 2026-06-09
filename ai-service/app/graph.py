"""The LangGraph agent.

Flow (identical to the original TypeScript graph):

    START -> plan -> tool -> evaluate -> (repair -> tool | finalize) -> END

`plan`, `evaluate`, `repair`, and `finalize` are pure agent logic + Gemini
calls. `tool` delegates the actual database work to the Node backend.
"""
from __future__ import annotations

import logging

from langgraph.graph import END, START, StateGraph

from . import formatting, llm, tools
from .config import settings
from .state import AgentState, Evaluation, has_tool_action

logger = logging.getLogger("dream-ai.graph")


async def plan(state: AgentState) -> dict:
    if settings.missing_api_key:
        return {
            "reply": "Dream AI is not configured yet. Add a backend AI key before using the assistant.",
            "attempts": 0,
        }

    text = await llm.generate_text(llm.build_plan_prompt(state.get("role", ""), state.get("message", "")))

    action = llm.parse_action(text)
    if action:
        return {"action": action, "attempts": 0}

    reply = llm.parse_reply(text) or await llm.generate_conversation_reply(state)
    return {"reply": reply, "attempts": 0}


async def run_tool(state: AgentState) -> dict:
    action = state.get("action")
    reply = state.get("reply")

    if reply and not has_tool_action(action):
        return {"toolResult": {"skipped": True, "reason": "No CRM tool needed."}}

    if not has_tool_action(action):
        return {"toolResult": state.get("toolResult") or {"error": "I could not identify a CRM CRUD request."}}

    if state.get("role") not in ("AGENT", "ADMIN"):
        return {"toolResult": {"error": "CRM CRUD tools are only available to agents/admins."}}

    response = await tools.run_tool(state["role"], state["userId"], action)  # type: ignore[arg-type]
    updates: dict = {"toolResult": response["result"]}
    # Echo back the normalized field set the backend actually used so `evaluate`
    # can check coverage without knowing the Prisma column vocabulary.
    if response["fields"]:
        assert action is not None  # has_tool_action verified above
        updates["action"] = {**action, "fields": response["fields"]}
    return updates


def evaluate(state: AgentState) -> dict:
    result = state.get("toolResult")
    action = state.get("action")
    reply = state.get("reply")

    if reply and not has_tool_action(action):
        return {"evaluation": _eval(True, "Conversation reply planned without a tool.", False)}

    if not has_tool_action(action):
        return {"evaluation": _eval(False, "No tool action was planned.", False)}

    if isinstance(result, dict) and "error" in result:
        return {"evaluation": _eval(False, str(result["error"]), False)}

    missing = formatting.missing_requested_fields(result, action.get("fields"))  # type: ignore[union-attr]
    if missing:
        return {
            "evaluation": _eval(
                False,
                f"Tool result missed requested field(s): {', '.join(missing)}",
                (state.get("attempts") or 0) < 1,
            )
        }

    return {"evaluation": _eval(True, "Tool result satisfies the user query.", False)}


def repair(state: AgentState) -> dict:
    action = state.get("action")
    attempts = (state.get("attempts") or 0) + 1
    if not has_tool_action(action):
        return {"attempts": attempts}
    # Ask the backend to re-run with its default field set on the next tool call.
    assert action is not None  # has_tool_action verified above
    return {"attempts": attempts, "action": {**action, "useDefaultFields": True}}


async def finalize(state: AgentState) -> dict:
    return {"reply": await _build_reply(state)}


def route_after_evaluation(state: AgentState) -> str:
    evaluation = state.get("evaluation")
    return "repair" if evaluation and evaluation["needsRepair"] else "finalize"


async def _build_reply(state: AgentState) -> str:
    if state.get("reply"):
        return state["reply"]  # type: ignore[return-value]

    result = state.get("toolResult")
    action = state.get("action")
    if not has_tool_action(action):
        return (
            formatting.readable_error(result)
            or "Tell me which database you want to organize: prospects or submission pipeline."
        )

    evaluation = state.get("evaluation")
    if evaluation and not evaluation["satisfied"] and not evaluation["needsRepair"]:
        return formatting.readable_error(result) or evaluation["reason"]

    insight = formatting.build_structured_insight(state)
    if insight:
        return insight

    try:
        final = await llm.generate_final_reply(state)
        if final.strip():
            return final.strip()
    except Exception as error:  # noqa: BLE001
        logger.warning(
            "AI finalization failed; using local formatter. %s",
            llm.describe_provider_error(error),
        )

    return formatting.build_tool_fallback_reply(state)


def _eval(satisfied: bool, reason: str, needs_repair: bool) -> Evaluation:
    return {"satisfied": satisfied, "reason": reason, "needsRepair": needs_repair}


def build_graph():
    builder = StateGraph(AgentState)
    builder.add_node("plan", plan)
    builder.add_node("tool", run_tool)
    builder.add_node("evaluate", evaluate)
    builder.add_node("repair", repair)
    builder.add_node("finalize", finalize)

    builder.add_edge(START, "plan")
    builder.add_edge("plan", "tool")
    builder.add_edge("tool", "evaluate")
    builder.add_conditional_edges(
        "evaluate",
        route_after_evaluation,
        {"repair": "repair", "finalize": "finalize"},
    )
    builder.add_edge("repair", "tool")
    builder.add_edge("finalize", END)

    return builder.compile()


graph = build_graph()
