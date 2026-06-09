# Dream Agency Platform

Dream Agency Platform is a full-stack insurance workspace demo for agents and customers. It combines a React portal UI with a NestJS API so agents can manage prospects, policy submissions, tasks, appointments, service work, claims, vault documents, rewards, and AI-assisted workflows from one application.

The repository is organized as a frontend at the project root and a backend in `backend/`.

## What This Repo Contains

- Agent portal with dashboard metrics, prospect tracking, submission pipeline views, training, circulars, tools, support, and linked carrier portals.
- Customer portal with policy overview, service requests, planning, rewards, and secure document vault screens.
- Personal Assistant Agent overlay for operational questions and authorized platform actions.
- News Monitor agent for official-source Malaysian insurance, healthcare, tax, retirement, economic, and market updates.
- NestJS backend with JWT authentication, role guards, Prisma, PostgreSQL, Redis configuration, S3-compatible file storage configuration, and domain modules for the insurance workflow.
- Prisma schema and migrations for users, policies, prospects, submission pipeline records, claims, tasks, appointments, content, notifications, rewards, vault documents, and audit logs.

## Tech Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS, Recharts, Lucide React.
- Backend: NestJS, Prisma, PostgreSQL, JWT auth, LangGraph, Google GenAI SDK.
- Supporting services: Redis and S3-compatible object storage such as MinIO.

## Repository Layout

```text
.
+-- src/                    # React frontend application
+-- backend/
|   +-- src/                # NestJS API modules
|   +-- prisma/             # Prisma schema and migrations
|   +-- .env.example        # Backend environment template
+-- scripts/dev.mjs         # Starts frontend and backend together
+-- package.json            # Frontend and root dev scripts
+-- README.md
```

Key backend modules include:

- `auth` - login, refresh tokens, and role-aware access.
- `prospects` - prospect database CRUD.
- `pipeline` - insurance submission pipeline CRUD.
- `ai` - Personal Assistant Agent and LangGraph-powered tool flow.
- `content` - trainings, saved news items, and the News Monitor check endpoint.
- `policies`, `claims`, `tasks`, `appointments`, `notifications`, `vault`, `rewards`, `content`, `services` - supporting platform areas.

## Local Setup

### Prerequisites

- Node.js
- PostgreSQL
- Redis
- S3-compatible storage, for example MinIO
- Google AI API key if you want to use the assistant

### Install Dependencies

Install frontend/root dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
```

### Configure Environment

Create a root `.env` file for the frontend:

```env
VITE_API_URL=http://localhost:4000

VITE_DEV_AGENT_LOGIN_IDENTIFIER=agent@example.com
VITE_DEV_AGENT_LOGIN_PASSWORD=your-dev-password
VITE_DEV_CUSTOMER_LOGIN_IDENTIFIER=customer@example.com
VITE_DEV_CUSTOMER_LOGIN_PASSWORD=your-dev-password
```

The `VITE_DEV_*` values are optional local-development helpers that prefill the login form.

Create the backend environment file:

```bash
cd backend
cp .env.example .env
```

On Windows PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

Update `backend/.env` with your local service values:

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

AI_API_KEY="your_google_gemini_api_key"
AI_MODEL="gemini-2.5-flash"
```

If you change the backend `PORT`, update `VITE_API_URL` to match it.

### Prepare the Database

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

To inspect or edit local data:

```bash
npm run prisma:studio
```

### Run the App

From the repository root, start the frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:frontend
npm run dev:backend
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000` with the recommended `PORT=4000` setting

The backend falls back to port `3000` if `PORT` is omitted, but the full-stack dev setup should use a separate API port so it does not collide with Vite.

```env
# backend/.env
PORT=4000
```

```env
# .env
VITE_API_URL=http://localhost:4000
```

## Useful Scripts

Root/frontend:

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
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
- `GET /news`
- `POST /news/check-updates`

The frontend API client lives in `src/api/client.ts`.

## Development Notes

- Keep real secrets, JWT values, API keys, database credentials, and storage credentials out of Git.
- Use `backend/.env.example` as the backend environment template.
- Update `backend/prisma/schema.prisma` before changing database-backed behavior.
- Run Prisma generation and migrations after schema changes.
- Keep personal assistant actions scoped and role-aware so AI tool calls only reach authorized resources.
