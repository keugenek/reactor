# Reactor — LinkedIn Post Performance Predictor

This repo is the open-source client for Reactor: the agent skill, a zero-dependency CLI + MCP server, and the web UI. The scoring engine is a separate Cloudflare Worker and is not in this repo — do not try to replicate it.

## Layout
- `skills/reactor/SKILL.md` — agent skill; the source of truth for how agents use the API
- `bin/reactor.mjs` — CLI and MCP server (Node 18+, no dependencies)
- `test/` — `npm test` runs the CLI and MCP server against a local mock API
- `docs/` — GitHub Pages site, `openapi.json`, `.well-known/ai-plugin.json`
- `.claude-plugin/` — Claude Code plugin + marketplace manifests

## API
Base URL: https://reactor-api.keugenek.workers.dev

- POST /v1/predict — `{"post": "...", "followers": 1000}`
- POST /v1/analyze-hook
- GET /v1/best-times
- GET /v1/content-types
- POST /v1/register, POST /v1/waitlist, DELETE /v1/account
- GET /v1/health

Quota: 2 calls/day per IP without a key, 5/day with a free key. Keep docs in sync with what the live API actually returns; check with `curl` before documenting an endpoint.
