# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Resendev is a local development server that mocks the Resend email API. It captures emails sent via the Resend SDK/API and displays them in a web UI — no real emails are sent. Developers swap `RESEND_API_URL=http://localhost:3099` in development and their existing code works unchanged.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with TypeScript (strict mode)
- **Runtime:** Node.js 22 LTS
- **UI:** React + Tailwind CSS + shadcn/ui
- **Storage:** SQLite via better-sqlite3 (synchronous API, no ORM)
- **Validation:** Zod
- **Real-time:** Server-Sent Events (SSE)
- **Package Manager:** npm
- **Distribution:** Docker (node:22-alpine)

## Commands

```bash
npm install           # Install dependencies
npm run dev           # Start dev server on http://localhost:3099
docker build -t resendev .
docker run -p 3099:3099 resendev
```

Test email capture with:
```bash
curl -X POST http://localhost:3099/emails \
  -H "Authorization: Bearer re_test_123" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","to":"user@example.com","subject":"Test","html":"<h1>Hello</h1>"}'
```

## Architecture

### Route Structure — Two Separate API Surfaces

**Resend-compatible API** (NOT under `/api/` — must match Resend SDK's `{baseUrl}/emails` pattern):
- `src/app/emails/route.ts` → `POST /emails`, `GET /emails`
- `src/app/emails/[id]/route.ts` → `GET /emails/:id`, `DELETE /emails/:id`
- `src/app/emails/batch/route.ts` → `POST /emails/batch`

**Resendev management API** (internal, for the web UI):
- `src/app/api/health/route.ts`, `src/app/api/emails/route.ts`, `src/app/api/stats/route.ts`, `src/app/api/events/route.ts`

**Web UI** (uses `(ui)` route group to avoid path conflicts with the API):
- `src/app/(ui)/page.tsx` → email list
- `src/app/(ui)/emails/[id]/page.tsx` → email detail
- `src/app/(ui)/dashboard/page.tsx`, `src/app/(ui)/settings/page.tsx`

### Core Libraries

- `src/lib/db.ts` — SQLite connection, raw SQL queries with prepared statements
- `src/lib/store.ts` — Email storage logic
- `src/lib/sse.ts` — SSE event emitter
- `src/lib/validators.ts` — Zod request validation schemas
- `src/lib/config.ts` — Environment config with defaults

## Key Conventions

- **Resend API fidelity is critical.** Responses must match Resend's format exactly. Auth header must be present (any value accepted); return 401 if missing.
- **Email IDs** are prefixed with `rdv_` (e.g., `rdv_abc123xyz`) using `crypto.randomUUID`.
- **No `any` types.** TypeScript strict mode enforced.
- **Naming:** files in kebab-case, components PascalCase, functions camelCase, DB columns snake_case, env vars SCREAMING_SNAKE_CASE.
- **React Server Components by default;** `"use client"` only when interactivity is needed.
- **Named exports** preferred (except page components).
- **Minimal dependencies.** If Next.js or React can do it natively, don't add a library. Use latest stable versions.
- **Database:** Raw SQL with prepared statements in `src/lib/db.ts`. No ORM. Migrations run on first startup.

## Development Workflow

- Read `SPEC.md` for full specification and `ROADMAP.md` for current progress.
- Follow roadmap phases in order. Mark checkboxes `[x]` in `ROADMAP.md` as tasks complete.
- Commit after each meaningful advance to `main`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `RESENDEV_PORT` | `3099` | Port for API and Web UI |
| `RESENDEV_MAX_EMAILS` | `1000` | Max emails to store |
| `RESENDEV_RETENTION_HOURS` | `24` | Auto-delete after X hours |
| `RESENDEV_DELAY_MS` | `0` | Simulated API response delay |
| `RESENDEV_ERROR_RATE` | `0` | Error simulation rate (0-100) |
