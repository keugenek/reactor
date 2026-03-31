# 🔮 Reactor — Predict LinkedIn Post Performance

[![npm](https://img.shields.io/npm/v/@keugenek/reactor)](https://npmjs.com/package/@keugenek/reactor)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/keugenek/reactor?style=social)](https://github.com/keugenek/reactor)

**Know if your post will flop — before you hit publish.** Get a GO/WAIT/IMPROVE/NO verdict, estimated impressions, debate score, cringe detection, and timing optimization — all from your terminal or AI assistant.

```bash
npx @keugenek/reactor "Just shipped my side project. Here's what I learned."
```

```
  ✅ GO  14,772 impressions

  Debate    60/100
  Hook      0.34
  Cringe    8/100
  Auth      93/100
  Timing    1.38x
```

## How it works

Reactor uses calibrated heuristics (hook analysis, debate scoring, cringe detection, audience-aware timing) trained on real LinkedIn post data. Predictions are **instant and deterministic** — no waiting for model inference.

This package is a thin client. All scoring happens server-side on Cloudflare Workers — sub-50ms worldwide.

### Post to LinkedIn
When your post scores GO, Reactor can send you straight to LinkedIn with your text ready to paste. In AI agents, it's one command: *"Predict and post."*

## Install

```bash
npm install -g @keugenek/reactor
```

Or run without installing:

```bash
npx @keugenek/reactor "Your post text"
```

## CLI

```bash
reactor "Your LinkedIn post text"                     # predict
reactor "Post" --type opinion_hot_take --hour 9       # with content type + time
reactor --types                                       # list 18 content types
reactor --discover                                    # see all available API features
reactor --register me@email.com                       # get free API key (5/day)
reactor --waitlist me@email.com                       # join Pro waitlist (50% off)
```

## MCP Server (Claude Desktop / Cursor / Windsurf / Claude Code)

Add to your MCP config:

```json
{
  "mcpServers": {
    "reactor": {
      "command": "npx",
      "args": ["@keugenek/reactor", "--mcp"],
      "env": {
        "REACTOR_API_KEY": "rk_free_your_key_here"
      }
    }
  }
}
```

Your AI assistant gets these tools:

| Tool | Description |
|------|-------------|
| `predict_post` | Full prediction with verdict + impressions + improvements |
| `analyze_hook` | Hook analysis (curiosity, emotion, controversy scores) |
| `best_posting_times` | Optimal posting windows for your audience |
| `reactor_register` | Get free API key |
| `reactor_join_waitlist` | Join Pro waitlist |

## OpenClaw / AI Agent Skill

Copy `skill/SKILL.md` to your agent's skills directory. The skill auto-triggers when you mention LinkedIn posts, content strategy, or post optimization.

## Progressive Discovery

Reactor uses **progressive discovery** — you start with zero config and unlock more as you go:

```
No key    → 2 predictions/day (demo)
Register  → 5 predictions/day + hook analysis + best times
Pro       → Unlimited + custom personas + media analysis + A/B testing
```

The API itself tells you what's available:

```bash
curl https://reactor-api.keugenek.workers.dev/v1/discover
```

```json
{
  "tiers": {
    "demo":  { "limit": "2/day",     "price": "free" },
    "free":  { "limit": "5/day",     "price": "free" },
    "pro":   { "limit": "unlimited", "price": "£19/mo", "status": "coming soon" }
  },
  "endpoints": ["/v1/predict", "/v1/analyze-hook", "/v1/best-times", "/v1/content-types"],
  "quickStart": "npx @keugenek/reactor --register you@email.com"
}
```

## Content Types

Each content type has a different viral multiplier based on real LinkedIn data:

| Type | Multiplier | What it means |
|------|-----------|---------------|
| `technical_achievement` | 9.72x | "I built X" posts crush it |
| `opinion_hot_take` | 5.00x | Controversy drives engagement |
| `research_publication` | 1.28x | Original research gets respect |
| `product_launch` | 0.60x | Product announcements underperform |
| `rant` | 0.15x | Pure rants get algorithmically buried |

Run `reactor --types` for all 18 types with multipliers.

## API

All endpoints at `https://reactor-api.keugenek.workers.dev`:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/` | GET | — | Landing page |
| `/v1/discover` | GET | — | Progressive discovery (available endpoints + tiers) |
| `/v1/predict` | POST | Optional | Predict post performance |
| `/v1/analyze-hook` | POST | Optional | Analyze hook quality |
| `/v1/best-times` | GET | Optional | Optimal posting times |
| `/v1/content-types` | GET | — | List content types with multipliers |
| `/v1/register` | POST | — | Get free API key |
| `/v1/waitlist` | POST | — | Join Pro waitlist |
| `/v1/account` | DELETE | Required | Delete your account (GDPR) |

## Privacy

- We store only your email and usage count
- No post content is stored or logged
- All scoring is stateless — your text is processed and forgotten
- Delete your account anytime: `reactor --delete` or `DELETE /v1/account`

## Architecture

```
┌─────────────┐     ┌──────────────────────┐
│  CLI / MCP  │────▶│  Cloudflare Worker   │
│  (this pkg) │◀────│  (scoring engine)    │
└─────────────┘     │  KV: rate limits     │
                    │  KV: registrations   │
                    └──────────────────────┘
```

- **This repo**: thin client (CLI + MCP + Skill). Open source, MIT.
- **Worker**: proprietary scoring engine. Runs on Cloudflare edge (~50ms worldwide).
- **No database**: Cloudflare KV for rate limits and registrations. That's it.

## Contributing

Issues and PRs welcome for the client. The scoring engine is server-side and proprietary.

---

**If this saves you from posting a 💀 post, [star the repo](https://github.com/keugenek/reactor)** ⭐
