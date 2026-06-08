# Dream AI Service (Python / LangGraph)

The Dream AI Assistant agent, moved out of the TypeScript backend into Python so
the LangGraph wiring is first-class and readable.

## What lives where

| Concern | Owner |
| --- | --- |
| Agent graph (plan → tool → evaluate → repair → finalize) | **this service** |
| Gemini calls (planning, conversation, finalization) | **this service** |
| Result formatting + ranking insights | **this service** |
| Database CRUD (Prisma), role scoping, field vocabulary | **Node backend** |

The `tool` node never touches the database. It calls the backend's internal
endpoint `POST /internal/ai/tool` (guarded by a shared secret), which runs the
Prisma CRUD and returns the projected rows plus the field set it used.

```
frontend ──POST /ai/assistant──▶ Node backend ──POST /chat──▶ ai-service (this)
                                      ▲                              │
                                      └──POST /internal/ai/tool──────┘
```

## Setup

From the repository root (the existing `.venv` already has the deps installed):

```powershell
.venv\Scripts\python.exe -m pip install -r ai-service\requirements.txt
copy ai-service\.env.example ai-service\.env   # then fill in your Gemini key
```

`AI_INTERNAL_SECRET` here must match `AI_INTERNAL_SECRET` in `backend/.env`, and
`BACKEND_URL` must point at the running Node backend (default `http://localhost:4000`).

## Run

`npm run dev` from the repo root now starts this service alongside the backend
and frontend. To run it on its own:

```powershell
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload
```

- `GET /health` — readiness + which model is configured
- `POST /chat` — `{ "role", "userId", "message" }` → `{ "reply" }`

## Layout

| File | Responsibility |
| --- | --- |
| `app/main.py` | FastAPI app, `/chat` + `/health` |
| `app/graph.py` | LangGraph `StateGraph` and the five nodes |
| `app/state.py` | `AgentState` / `AgentAction` / `Evaluation` types |
| `app/llm.py` | Gemini calls, prompts, JSON parsing |
| `app/tools.py` | HTTP proxy to the backend's internal tool endpoint |
| `app/formatting.py` | Ranking insights + local fallback formatting |
| `app/config.py` | Environment configuration |
