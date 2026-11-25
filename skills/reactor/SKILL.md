---
name: reactor
description: Predict LinkedIn post performance before publishing. Returns a GO/WAIT/IMPROVE/NO verdict, an estimated impressions range, debate, hook, cringe and authenticity scores, timing advice and concrete improvements. Use when the user shares a LinkedIn post draft, asks "should I post this", "will this go viral", wants hook analysis, the best time to post, or help optimizing LinkedIn engagement.
license: MIT
metadata:
  author: keugenek
  version: "1.1.0"
  homepage: https://github.com/keugenek/reactor
---

# Reactor — LinkedIn Post Performance Predictor

Reactor scores a LinkedIn post draft with calibrated heuristics (no LLM calls, instant) and returns:

- **Verdict** — GO / WAIT / IMPROVE / NO
- **Impressions range** — scaled to the author's follower count by the API
- **Debate score** (0-100) — comments drive distribution
- **Hook score** (0-1) — first-line effectiveness
- **Cringe score** (0-100) and **authenticity score** (0-100)
- **Timing multiplier** — effect of the posting hour
- **Warnings** and **improvements**

All numbers come from the API. Never invent or adjust them.

## API

Base URL: `https://reactor-api.keugenek.workers.dev`
OpenAPI spec: `https://keugenek.github.io/reactor/openapi.json`

| Endpoint | Method | Quota | Purpose |
|----------|--------|-------|---------|
| `/v1/predict` | POST | counts | Full prediction |
| `/v1/analyze-hook` | POST | counts | Hook breakdown |
| `/v1/best-times` | GET | free | Ranked posting hours |
| `/v1/content-types` | GET | free | 18 content types with multipliers |
| `/v1/register` | POST | free | Email → free API key |
| `/v1/waitlist` | POST | free | Join the Pro waitlist |
| `/v1/account` | DELETE | free | Delete account (needs key) |
| `/v1/health` | GET | free | Health check |

Send a key, when there is one, as `Authorization: Bearer rk_...`.

### Quota — read this before calling

| Tier | Limit | How |
|------|-------|-----|
| Demo | 2 calls/day per IP address | no key |
| Free | 5 calls/day | key from `/v1/register` |

`/v1/predict` and `/v1/analyze-hook` share the same quota. Consequences:

- **Do not predict in a loop.** One prediction for the draft, at most one re-check after the user approves a rewrite.
- Do not call `/v1/analyze-hook` in addition to `/v1/predict` unless the user asks for hook detail; `hook_score` is already in the prediction.
- The demo limit is per IP, so in a shared or cloud environment it may already be used up. A `429` on the first call is normal there — go to the rate-limit steps below.
- Every response carries `rateLimit.remaining`. Tell the user when it reaches 0.

## Workflow

### 1. Get the follower count (once per session)

Ask: "How many LinkedIn followers do you have?" If the user does not know or will not say, use `1000` and say so. Always send `followers` — when it is omitted the API assumes its calibration audience of 4,410.

The audience model is fixed: tech leaders and engineers. Say this if the user's audience is clearly different, since the estimate will be less reliable.

### 2. Predict

```bash
curl -sS -X POST https://reactor-api.keugenek.workers.dev/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"post": "Full post text", "followers": 1000}'
```

Request fields:

| Field | Required | Notes |
|-------|----------|-------|
| `post` | yes | Full post text |
| `followers` | recommended | Integer; impressions are scaled server-side |
| `content_type` | no | One of the names from `/v1/content-types` |
| `hour` | no | Planned posting hour, 0-23, US Pacific time. Default: now |
| `weekday` | no | 0-6, 0 = Sunday. Default: today |

Response:

```json
{
  "verdict": "IMPROVE",
  "impressions": 152,
  "impressions_low": 91,
  "impressions_high": 213,
  "confidence": "low (±40%) — upgrade to Pro for calibrated predictions",
  "followers": 1000,
  "debate_score": 21,
  "hook_score": 0.37,
  "cringe_score": 15,
  "authenticity_score": 85,
  "timing_multiplier": 0.64,
  "warnings": ["⚠️ LOW DEBATE: Score <30 = reduced reach. Comments drive the algorithm."],
  "improvements": ["Boost debate score from 21 to >30"],
  "tier": "demo",
  "rateLimit": { "remaining": 1, "limit": 2, "resetAt": 1795651199000 }
}
```

The response may also contain a `proTeaser` object. Ignore it unless the user asks about Pro.

### 3. Present the result

Use `impressions_low`–`impressions_high` exactly as returned. Do not rescale them. The range is wide (about ±40%) — present it as a rough estimate, not a forecast.

```
Reactor: IMPROVE — roughly 91–213 impressions (for 1,000 followers)

Debate 21/100 · Hook 0.37 · Cringe 15/100 · Authenticity 85/100
Timing 0.64x

Main issue: low debate score — posts that draw no comments get little reach.
```

Then list the `warnings` and `improvements` in plain language.

### 4. Act on the verdict

- **GO** — tell the user it is ready. Offer the compose link `https://www.linkedin.com/feed/?shareActive=true`. Publish on the user's behalf only if they explicitly ask, and confirm the final text first.
- **IMPROVE** — propose a rewrite that addresses the listed improvements. Re-predict only after the user accepts the rewrite, and only if quota remains.
- **WAIT** — the post is fine but `timing_multiplier` is low. Call `GET /v1/best-times` (free) and suggest the best upcoming slot. Hours are US Pacific (`pstHour`); convert to the user's time zone.
- **NO** — explain the blocking warnings and suggest a substantial rewrite.

Reading the scores: debate below 30 means reduced reach and below 15 is close to none; a timing multiplier of 1.4 means about 40% more impressions than baseline.

### Hook analysis (only when asked)

```bash
curl -sS -X POST https://reactor-api.keugenek.workers.dev/v1/analyze-hook \
  -H "Content-Type: application/json" -d '{"post": "Full post text"}'
```

Returns `hookText`, `curiosityGap`, `emotionalTrigger`, `controversyPotential`, `relatability`, `specificity` (each 0-1).

### Content types

`GET /v1/content-types` returns `{"contentTypes": [{"name", "multiplier"}]}`. Examples: `technical_achievement` 9.72x, `opinion_hot_take` 5x, `research_publication` 1.28x, `product_launch` 0.6x, `rant` 0.15x. Pass `content_type` only when the type is clear from the draft.

## Rate limits and registration

On `429` the body is:

```json
{ "error": "Rate limit exceeded", "message": "...", "needsRegistration": true, "resetAt": 1795651199000 }
```

1. Tell the user the daily limit is reached and when it resets (`resetAt`, epoch milliseconds).
2. If `needsRegistration` is true, offer a free key (5/day). Ask for consent first: "Reactor stores your email and a usage counter; you can delete the account at any time."
3. Only with an email the user gave for this purpose: `POST /v1/register {"email": "..."}` → `{"api_key": "rk_free_...", "limit": 5}`. Give the key to the user and send it as `Authorization: Bearer <key>` from then on.
4. If the user declines, stop. Do not estimate scores yourself.

Never register an email the user did not provide for this purpose, and never join the waitlist unless the user asks.

## Errors

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Missing `post` (or `email`) | Fix the request |
| 401 | Invalid API key | Retry without the key or re-register |
| 404 | Unknown endpoint | Use only the endpoints listed above |
| 429 | Daily quota used | See above |
| 5xx / network | Service problem | Retry once after a few seconds, then tell the user Reactor is unavailable |

If the API cannot be reached, say so. You may still give your own qualitative feedback on the draft, clearly labelled as not a Reactor score.

## Alternatives to raw HTTP

CLI (Node 18+):

```bash
npx -y github:keugenek/reactor "Post text" --followers 1000
npx -y github:keugenek/reactor --best-times
npx -y github:keugenek/reactor --help
```

MCP server (tools: `predict_post`, `analyze_hook`, `best_posting_times`, `list_content_types`, `reactor_register`, `reactor_join_waitlist`):

```json
{
  "mcpServers": {
    "reactor": { "command": "npx", "args": ["-y", "github:keugenek/reactor", "--mcp"] }
  }
}
```

## Sharing a score (only if the user asks)

Link with the scores encoded:

```
https://keugenek.github.io/reactor/?v=GO&i=14772&d=60&h=0.34&c=8&a=93&t=1.38
```

`v` verdict, `i` impressions, `d` debate, `h` hook, `c` cringe, `a` authenticity, `t` timing.

## Privacy

Post text is sent to the Reactor API for scoring. According to the service it is not stored; registration stores the email and a usage counter. Mention this if the draft looks confidential.
