# Dream Agency Backend (NestJS + Prisma)

## What’s included
- NestJS app with JWT auth, role guard, Prisma ORM, and stubs for AI, files (presigned), policies, tasks, and official-source news monitoring.
- Prisma schema covering users, policies, documents, pipeline, claims, reminders, vault, rewards, trainings, news, audit logs.
- Env validation and example env file.

## Quick start (dev)
```bash
cd backend
cp .env.example .env      # set real secrets/URLs
npm install
npx prisma generate
npx prisma migrate dev --name init   # requires Postgres DATABASE_URL
npm run dev
```

## Scripts
- `npm run dev` – start with ts-node-dev
- `npm run build` – compile to dist
- `npm start` – run compiled build
- `npm run prisma:migrate` – run migrations
- `npm run prisma:studio` – inspect data

## Modules (initial stubs)
- Auth: `/auth/login`, `/auth/refresh`
- Users: `/users/me`
- Policies: `/policies`, `/policies/:id`
- Prospects: `/prospects`, `/prospects/:id`, `/prospects/:id/notes`
- Submission pipeline: `/pipeline`, `/pipeline/:id`
- Tasks: `/tasks`, `/tasks/:id/complete`
- Files: `/files/presign-upload`, `/files/presign-download` (fake URLs; swap with S3)
- AI: `/ai/assistant` (Personal Assistant Agent; set `AI_API_KEY` and optional `AI_MODEL`, default `gemini-2.5-flash`)
- Content: `/news`, `/news/check-updates`, `/trainings`

## Next steps
- Hook real S3/MinIO presign logic; add virus scan webhook.
- Flesh out claims, service requests, appointments, notifications, rewards, vault controllers.
- Implement AI role-aware prompts and retrieval; add BullMQ workers for reminders/AI summarization.
- Add rate limiting, request logging, metrics/tracing.
