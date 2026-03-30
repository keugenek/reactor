# AGENTS.md — Reactor

This is the **open-source client** for Reactor (LinkedIn post predictor).

## For AI Agents
- Read `skill/SKILL.md` for full integration guide
- Read `llms.txt` for quick API reference
- The scoring engine is server-side — call the API, don't try to replicate the logic

## Architecture
- This repo = thin client (CLI + MCP + Skill). MIT licensed.
- Scoring engine = proprietary Cloudflare Worker. Not in this repo.
- All business logic lives server-side. This client just formats and sends requests.
