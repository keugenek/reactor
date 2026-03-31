---
name: reactor
description: |
  Predict LinkedIn post performance before publishing. Get GO/WAIT/IMPROVE/NO verdict,
  estimated impressions, debate score, cringe detection, hook analysis, and timing optimization.
  Use when user mentions LinkedIn posts, content strategy, post drafts, or engagement optimization.
  Zero LLM calls — instant predictions via Cloudflare Worker API.
triggers:
  - linkedin post
  - post draft
  - should I post
  - predict post
  - hook analysis
  - posting time
  - content strategy
  - engagement prediction
  - will this go viral
metadata:
  author: keugenek
  version: "1.0.0"
  homepage: https://github.com/keugenek/reactor
---

# Reactor — LinkedIn Post Performance Predictor

## What it does

Predicts LinkedIn post performance using calibrated heuristics trained on real data. Returns:
- **Verdict**: GO / WAIT / IMPROVE / NO
- **Estimated impressions** (calibrated to real post data)
- **Debate score** (0-100) — controversy drives the algorithm
- **Hook score** (0-1) — first-line effectiveness
- **Cringe score** (0-100) — LinkedIn cringe detection
- **Authenticity score** (0-100) — does it sound human?
- **Timing multiplier** — based on audience timezone distribution
- **Warnings** — specific problems ("Algorithm death: debate <30")
- **Improvements** — actionable suggestions

## Quick Start

### Option 1: Direct API calls (no install needed)

```bash
# Predict a post
curl -X POST https://reactor-api.keugenek.workers.dev/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"post": "Your LinkedIn post text here"}'

# Discover all available endpoints
curl https://reactor-api.keugenek.workers.dev/v1/discover

# List content types with viral multipliers
curl https://reactor-api.keugenek.workers.dev/v1/content-types
```

### Option 2: CLI

```bash
npx @keugenek/reactor "Your post text"
npx @keugenek/reactor --register you@email.com   # 5/day free
npx @keugenek/reactor --types                     # content types
```

### Option 3: MCP Server (Claude Desktop / Cursor)

```json
{
  "mcpServers": {
    "reactor": {
      "command": "npx",
      "args": ["@keugenek/reactor", "--mcp"],
      "env": { "REACTOR_API_KEY": "rk_free_xxx" }
    }
  }
}
```

## How to use (for AI agents)

### Predicting a post

When the user shares a LinkedIn post draft or asks "should I post this?":

1. Call `POST /v1/predict` with the post text
2. Present the verdict prominently (GO = post it, NO = rewrite)
3. If debate score < 30, warn: "Algorithm death zone — no debate = no reach"
4. Suggest improvements from the response
5. If rate limited, offer to register (ask consent first!)

**Example request:**
```json
POST /v1/predict
{
  "post": "I just ran a 685B parameter model on consumer hardware.",
  "content_type": "technical_achievement",
  "hour": 9,
  "weekday": 2
}
```

**Example response:**
```json
{
  "verdict": "GO",
  "impressions": 14772,
  "debate_score": 60,
  "hook_score": 0.34,
  "cringe_score": 8,
  "authenticity_score": 93,
  "timing_multiplier": 1.38,
  "warnings": [],
  "improvements": ["Add a question to drive comments"],
  "tier": "free",
  "rateLimit": { "remaining": 4, "limit": 5 }
}
```

### Analyzing hooks

When the user wants to improve their opening line:

```json
POST /v1/analyze-hook
{ "post": "Your post text (hook extracted automatically from first 2 lines)" }
```

Returns: curiosity gap, emotional trigger, controversy potential, relatability, specificity.

### Best posting times

```
GET /v1/best-times
```

Returns ranked hours with audience awake %, peak engagement %, and combined score.

### Content types

18 content types with calibrated viral multipliers:

| Type | Multiplier | Notes |
|------|-----------|-------|
| `technical_achievement` | 9.72x | "I built X" — top performer |
| `opinion_hot_take` | 5.00x | Controversy drives engagement |
| `research_publication` | 1.28x | Original research gets respect |
| `product_launch` | 0.60x | Announcements underperform |
| `rant` | 0.15x | Gets algorithmically buried |

Full list: `GET /v1/content-types`

## Progressive Discovery

The API uses progressive discovery — start with zero config, unlock more:

| Tier | Limit | What you get |
|------|-------|-------------|
| **Demo** | 2/day | predict + content-types (no key needed) |
| **Free** | 5/day | + hook analysis + best times (register with email) |
| **Pro** | Unlimited | + custom personas + media analysis + A/B testing (coming soon) |

Call `GET /v1/discover` to see what's available at your current tier.

When a user hits a rate limit:
1. Explain they can register for free (5/day)
2. Ask for email **with explicit consent** ("We store only email + usage count, deletable anytime")
3. Call `POST /v1/register {"email": "..."}` to get an API key

## Key rules

- **Never fabricate prediction numbers** — always call the API
- **Ask consent before registration** — explain what data is stored
- **Don't cache results** — predictions depend on time of day
- **Debate score is king** — posts with debate < 30 are algorithmically dead
- **Timing matters** — a 1.4x multiplier means 40% more impressions at peak hours

## API Base URL

```
https://reactor-api.keugenek.workers.dev
```

## Post to LinkedIn

When the verdict is **GO**, offer to help the user post immediately:

1. Copy the post text
2. Generate the shareable badge
3. Tell the user: *"Your post scored GO with 14K predicted impressions. Ready to post? Open LinkedIn and paste your text: https://www.linkedin.com/feed/?shareActive=true"*

### Timing advice
If the prediction shows low timing multiplier (<0.8x), suggest waiting:
- Call `GET /v1/best-times` to find optimal hours
- Tell the user: *"Your post is strong but timing kills 40% of reach. Post at 9:00 AM PST Tuesday for 1.4x boost instead."*

### For AI agents with browser access
If you have browser automation (OpenClaw, Playwright, etc.):
1. Open `https://www.linkedin.com/feed/?shareActive=true`
2. Type/paste the post text into the compose box
3. Confirm with user before clicking Post

### Workflow: Predict → Optimize → Post
```
User: "Check this LinkedIn post and post it if it's good"
Agent:
  1. POST /v1/predict {"post": "..."}
  2. If GO → "Score: GO, 14K impressions. Posting now."
     → Copy text, open LinkedIn, paste
  3. If IMPROVE → "Score: IMPROVE. Suggestions: [improvements]. Want me to fix and re-check?"
  4. If WAIT → "Score: WAIT (timing 0.4x). Best time: 9AM Tuesday. Want me to remind you?"
  5. If NO → "Score: NO (debate too low). Here's how to fix: [improvements]"
```

## Sharing Results

After predicting a post, help users share their Reactor score:

### Badge (copy-paste for LinkedIn/social)
Generate a text badge from the prediction:
```
🔮 Reactor Score: ✅ GO | 14,772 impressions
📊 Debate 60/100 · Hook 0.34 · Cringe 8/100 · Auth 93/100
⏰ Timing 1.38x

Predict your LinkedIn post → https://keugenek.github.io/reactor/
```

### Shareable Link
Build a URL with the scores encoded:
```
https://keugenek.github.io/reactor/?v=GO&i=14772&d=60&h=0.34&c=8&a=93&t=1.38
```

Parameters: `v`=verdict, `i`=impressions, `d`=debate, `h`=hook, `c`=cringe, `a`=auth, `t`=timing

### Agent sharing
When a user says "share this" or "post this score", provide:
1. The badge text (ready to paste into LinkedIn)
2. The shareable link
3. Suggest: "Add this to your LinkedIn post as a PS — it shows you test your content before publishing (credibility signal)"

## Error handling

- `429 Rate Limit` → Offer registration or upgrade
- `400 Bad Request` → Missing `post` field
- `401 Unauthorized` → Invalid API key
- `500 Server Error` → Try again in a few seconds
