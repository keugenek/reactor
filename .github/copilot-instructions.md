# Reactor — LinkedIn Post Performance Predictor

Open-source client for the Reactor LinkedIn post predictor: agent skill, CLI + MCP server, web UI.
All scoring logic runs server-side on Cloudflare Workers — do not try to replicate it.

## API
- Base URL: https://reactor-api.keugenek.workers.dev
- POST /v1/predict — `{"post": "text", "followers": 1000}`
- POST /v1/analyze-hook — hook quality
- GET /v1/best-times — posting hours (US Pacific)
- GET /v1/content-types — content types with multipliers

## Where things are
- `skills/reactor/SKILL.md` — endpoint docs and agent guide
- `bin/reactor.mjs` — CLI and MCP server, zero dependencies; tests in `test/` (`npm test`)
- `docs/` — web UI and `openapi.json`
