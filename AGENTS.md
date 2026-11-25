# AGENTS.md — Reactor

Reactor predicts LinkedIn post performance before publishing: GO/WAIT/IMPROVE/NO verdict, impressions range, debate score, cringe detection and timing.

## For AI agents
1. Read `skills/reactor/SKILL.md` — full integration guide, quota rules and error handling
2. `llms.txt` — quick API reference
3. `docs/openapi.json` — OpenAPI spec (served at https://keugenek.github.io/reactor/openapi.json)
4. Call the API directly: `POST https://reactor-api.keugenek.workers.dev/v1/predict`

## Architecture
- This repo = client (skill, CLI/MCP server in `bin/reactor.mjs`, web UI). MIT licensed.
- Scoring engine = proprietary Cloudflare Worker. Not in this repo.

## Development
- `npm test` — runs the CLI and MCP server against a local mock API. No dependencies to install.
- Document only endpoints and fields the live API returns.
