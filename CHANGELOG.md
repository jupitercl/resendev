# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-19

### Added

- **Resend-compatible API** — `POST /emails`, `GET /emails/:id`, `DELETE /emails/:id`, `POST /emails/batch`, `GET /emails`
- **Authentication** — Validates `Authorization: Bearer` header is present (accepts any key value)
- **Web UI** — Email list with real-time updates, email detail with tabbed view (HTML, text, source, attachments, headers, raw JSON)
- **Real-time** — Server-Sent Events (SSE) for instant email updates without polling
- **Full-text search** — SQLite FTS5 search across subject, from, to, and body content
- **Dashboard** — Stats page with total emails, emails today, top senders, emails per hour chart
- **Attachments** — Store, display, and download email attachments
- **Settings** — Configurable API delay, error rate simulation, dark/light/system theme, export as JSON
- **Keyboard navigation** — `j`/`k` to navigate, `Enter` to open, `x` to select
- **Bulk actions** — Select all, delete selected, clear all with confirmation
- **Docker** — Multi-stage Dockerfile with node:22-alpine, docker-compose.yml, health check
- **CI/CD** — GitHub Actions workflow to publish Docker image on version tags

[0.1.0]: https://github.com/jupitercl/resendev/releases/tag/v0.1.0
