# Dream Agency Platform

Dream Agency is an insurance agent workspace for tracking prospects, managing policy submissions, and keeping daily agency work organized from one dashboard.

The platform is built for insurance agents who need a practical CRM-style tool: capture leads, track prospect probability, manage underwriting submissions, follow up on tasks, view appointments, and use an AI assistant to operate the platform faster.

## Core Features

- Prospect database with CRUD support for lead names, stage, contact details, probability score, notes, and next actions.
- Submission pipeline database with CRUD support for applicant name, plan, underwriting status, pending reasons, required documents, remarks, submission date, and expiry.
- Agent dashboard for pipeline progress, production metrics, tasks, appointments, notifications, rewards, vault documents, claims, and service requests.
- JWT authentication with agent, customer, and admin roles.
- Prisma/PostgreSQL data model for users, policies, prospects, submissions, claims, tasks, appointments, content, rewards, vault documents, and audit logs.
- Dream AI Assistant for advice, workflow help, control-panel actions, and organizing the prospect/submission databases through backend CRUD tools.

## Dream AI Assistant

Dream AI Assistant is intended to be a "do-anything" assistant inside the insurance platform. It can answer agent questions, give operational advice, and execute authorized platform actions through backend tools.

For database work, the assistant uses a LangGraph agent flow:

1. `plan` - understand the user request and choose one resource: prospects or submission pipeline.
2. `tool` - execute the matching CRUD tool.
3. `evaluate` - check whether the tool result satisfies the user request.
4. `repair` - retry once with safer/default fields if the first result is incomplete.
5. `finalize` - return a clear response to the user.

The assistant is optimized to reduce latency:

- Uses a deterministic local parser for common CRUD requests before calling the model.
- Queries only the database the user asked for.
- Uses Prisma field projection so reads only fetch requested fields.
- Formats final CRUD responses locally instead of making another model call.
- Uses one repair retry and a model timeout.

The default model is `gemma-4-31b-it`, configured through the backend AI environment variables.

## Tech Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS, Recharts, Lucide icons.
- Backend: NestJS, Prisma, PostgreSQL, JWT auth, LangGraph, Google GenAI SDK.
- Infrastructure dependencies: Redis and S3-compatible object storage such as MinIO.

## Repository Structure

```text
.
+-- src/                    # React frontend
+-- backend/
|   +-- src/                # NestJS backend modules
|   +-- prisma/             # Prisma schema and migrations
|   +-- .env.example        # Backend environment template
+-- package.json            # Frontend scripts
+-- README.md
```

Important backend modules:

- `auth` - login and refresh tokens.
- `prospects` - prospect CRUD and notes.
- `pipeline` - submission pipeline CRUD.
- `ai` - Dream AI Assistant and LangGraph CRUD agent.
- `policies`, `claims`, `tasks`, `appointments`, `notifications`, `vault`, `rewards`, `content` - supporting insurance platform areas.

## Local Development

### Prerequisites

- Node.js
- PostgreSQL
- Redis
- S3-compatible storage, for example MinIO
- Google AI API key for the assistant

### 1. Install Dependencies

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

### 2. Configure Frontend Environment

Create a root `.env` file:

```env
VITE_API_URL=http://localhost:4000

VITE_DEV_AGENT_LOGIN_IDENTIFIER=agent@example.com
VITE_DEV_AGENT_LOGIN_PASSWORD=your-dev-password
VITE_DEV_CUSTOMER_LOGIN_IDENTIFIER=customer@example.com
VITE_DEV_CUSTOMER_LOGIN_PASSWORD=your-dev-password
```

The `VITE_DEV_*` values are optional. They only auto-fill the login form during local development.

### 3. Configure Backend Environment

Copy the backend environment template:

```bash
cd backend
cp .env.example .env
```

On Windows PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

Update `backend/.env`:

```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dream_agency"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="replace_with_a_long_secret"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"

S3_ENDPOINT="http://localhost:9000"
S3_REGION="us-east-1"
S3_BUCKET="dream-agency"
S3_ACCESS_KEY="minio"
S3_SECRET_KEY="minio123"

AI_API_KEY="your_google_ai_api_key"
AI_MODEL="gemma-4-31b-it"
```

### 4. Prepare the Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

Use Prisma Studio if you want to inspect or edit local data:

```bash
npm run prisma:studio
```

### 5. Run the App

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000` if `PORT=4000` is set

## Useful Scripts

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

Backend:

```bash
cd backend
npm run dev
npm run build
npm start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Main API Areas

- `POST /auth/login`
- `POST /auth/refresh`
- `GET /prospects`
- `POST /prospects`
- `PATCH /prospects/:id`
- `DELETE /prospects/:id`
- `GET /pipeline`
- `POST /pipeline`
- `PATCH /pipeline/:id`
- `DELETE /pipeline/:id`
- `POST /ai/assistant`

The frontend API client is in `src/api/client.ts`.

## Environment and Secrets

Environment files are ignored by Git. Keep real API keys, database credentials, and JWT secrets out of commits.

Use `backend/.env.example` as the backend template and keep local frontend variables in the root `.env`.

## Development Notes

- Update `backend/prisma/schema.prisma` first when changing database structure.
- Run Prisma generate and migrations after schema changes.
- Keep AI tool access role-aware. CRUD actions should stay behind authenticated agent/admin access.
- The AI assistant should prefer scoped tool calls over broad database retrieval so responses stay fast.
