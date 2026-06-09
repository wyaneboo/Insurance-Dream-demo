"""Prompt builders used by the LLM client."""
from __future__ import annotations

import json

from ..memory.state import AgentState

ACTION_SCHEMA = """{
  "resource": "prospect" | "pipeline",
  "operation": "list" | "get" | "create" | "update" | "delete",
  "id": "optional exact row id",
  "lookupName": "optional prospect name or submission applicant name",
  "fields": ["only fields the user requested"],
  "data": {
    "prospect": {
      "name": "string",
      "stage": "New | Contacted | Proposal | Closing",
      "score": 0-100,
      "contact": { "email": "string", "phone": "string" },
      "nextActionAt": "ISO date"
    },
    "pipeline": {
      "applicantName": "string",
      "planName": "string",
      "underwritingStatus": "Submitted | Underwriting | Pending Requirement",
      "remarks": "string",
      "pendingReasons": ["string"],
      "requiredDocs": ["string"],
      "submittedAt": "ISO date",
      "estimatedIssueDate": "ISO date",
      "expiry": "ISO date"
    }
  }
}"""


def build_plan_prompt(role: str, message: str) -> str:
    return "\n".join(
        [
            "You are the planning node for the Personal Assistant Agent.",
            "Every user message must go through this agent plan.",
            "Return exactly one compact JSON object and no markdown.",
            "If the user needs CRM database work, return one tool action using the schema below.",
            "Only AGENT and ADMIN roles may use CRM tools. For any other role, return a normal reply and do not plan a tool.",
            'For comparisons, rankings, counts, lowest/highest, second-lowest/second-highest, or "which record has" questions, use operation "list" and include the fields needed to answer.',
            'Use operation "get", "update", or "delete" only when the user gives an exact row id or a specific prospect/applicant name.',
            'Never put words like "has the lowest", "highest probability", or another comparative phrase in lookupName.',
            'If no CRM tool is needed, return {"reply":"a concise helpful assistant response"}.',
            "Allowed CRM action schema:",
            ACTION_SCHEMA,
            'Example for "which prospect has the lowest probability and which one is second lowest": {"resource":"prospect","operation":"list","fields":["name","probability"]}',
            f"User role: {role}",
            f"User message: {message}",
        ]
    )


def build_conversation_prompt(state: AgentState) -> str:
    return "\n".join(
        [
            "You are the Personal Assistant Agent in an insurance agency CRM.",
            "Answer normally and concisely.",
            "If the user asks to change CRM data, say you need a clear CRM request instead of pretending it was done.",
            f"User role: {state.get('role')}",
            f"User message: {state.get('message')}",
        ]
    )


def build_final_reply_prompt(state: AgentState) -> str:
    return "\n".join(
        [
            "You are the Personal Assistant Agent finalizing a CRM tool result.",
            "Answer the user using only the tool result. Do not invent rows or values.",
            "For probabilities and scores, compare numbers numerically.",
            "If the tool result is a mutation, confirm only what changed.",
            "Do not mention internal tool names, JSON, Prisma, LangGraph, or model details.",
            f"User message: {state.get('message')}",
            f"Planned action: {json.dumps(state.get('action'))}",
            f"Tool result: {json.dumps(state.get('toolResult'))}",
        ]
    )
