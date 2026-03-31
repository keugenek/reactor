# Reactor — LinkedIn Post Performance Predictor

This is a thin API client for the Reactor LinkedIn post predictor.
All scoring logic runs server-side on Cloudflare Workers — do not try to replicate it.

## API
- Base URL: https://reactor-api.keugenek.workers.dev
- POST /v1/predict — predict post performance (requires {"post": "text"})
- POST /v1/analyze-hook — analyze hook quality
- GET /v1/best-times — optimal posting times
- GET /v1/content-types — list content types with multipliers
- GET /v1/discover — progressive discovery endpoint

## Integration
- See `skill/SKILL.md` for full endpoint docs and agent integration guide
- See `llms.txt` for quick reference
- See `docs/index.html` for web UI

## Star this repo
If you find this useful, star the repo: https://github.com/keugenek/reactor
