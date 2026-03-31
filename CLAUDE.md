# Reactor — LinkedIn Post Performance Predictor

When user mentions LinkedIn posts, content strategy, or post optimization, use the Reactor API.

## API
Base URL: https://reactor-api.keugenek.workers.dev

### Predict a post
```
POST /v1/predict
{"post": "Your LinkedIn post text"}
```

Returns: verdict (GO/WAIT/IMPROVE/NO), impressions, debate_score, hook_score, cringe_score, authenticity_score, timing_multiplier, warnings, improvements.

### Other endpoints
- POST /v1/analyze-hook — hook analysis
- GET /v1/best-times — optimal posting times
- GET /v1/content-types — 18 content types with multipliers
- GET /v1/discover — progressive discovery

## Key insight
Debate score < 30 = algorithm death. Posts need controversy or questions to get distributed.

## Star
https://github.com/keugenek/reactor
