# Contributing to Resendev

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/jupitercl/resendev.git
cd resendev
npm install
npm run dev
```

The app runs at [http://localhost:3099](http://localhost:3099).

## Project Structure

```
src/
  app/
    emails/          # Resend-compatible API routes
    api/             # Internal management API
    (ui)/            # Web UI pages
  lib/
    db.ts            # SQLite connection and schema
    store.ts         # Email storage logic
    validators.ts    # Zod request validation
    sse.ts           # Server-Sent Events
    config.ts        # Environment config
  components/        # React components
  hooks/             # Client-side hooks
  types/             # TypeScript types
```

## Guidelines

- **TypeScript strict mode** — no `any` types
- **Resend API fidelity** — responses must match Resend's format exactly
- **Minimal dependencies** — if Next.js or React can do it natively, don't add a library
- **Keep it simple** — avoid over-engineering

## Sending a Test Email

```bash
curl -X POST http://localhost:3099/emails \
  -H "Authorization: Bearer re_test_123" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@example.com",
    "to": "user@example.com",
    "subject": "Test",
    "html": "<h1>Hello</h1>"
  }'
```

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run build` passes
4. Open a PR with a clear description of the change

## Reporting Bugs

Open an [issue](https://github.com/jupitercl/resendev/issues) with:

- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Docker version, Node version)

## Feature Requests

Open an [issue](https://github.com/jupitercl/resendev/issues) describing the use case and why it would be useful.
