"""FastAPI entrypoint for the Dream AI Assistant service.

Exposes `POST /chat`, which the Node backend calls in place of running the
LangGraph agent in TypeScript.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel

from .config import settings
from .graph import graph
from .llm import describe_provider_error

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dream-ai")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.missing_api_key:
        logger.warning("Dream AI LangGraph agent loaded, but no Google API key is configured.")
    else:
        logger.info("Dream AI LangGraph agent ready with model %s.", settings.model)
    yield


app = FastAPI(title="Dream AI Service", lifespan=lifespan)


class ChatRequest(BaseModel):
    role: str
    userId: str
    message: str


class ChatResponse(BaseModel):
    reply: str


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "model": settings.model,
        "configured": not settings.missing_api_key,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        result = await graph.ainvoke(
            {
                "role": request.role,
                "userId": request.userId,
                "message": request.message,
                "attempts": 0,
            }
        )
        return ChatResponse(reply=result.get("reply") or "I could not generate a response.")
    except Exception as error:  # noqa: BLE001
        message = describe_provider_error(error)
        logger.error("Dream AI agent failed: %s", message)
        return ChatResponse(reply=f"Dream AI could not complete the request right now. {message}")
