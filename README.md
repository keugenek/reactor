# 🔮 Reactor — LinkedIn Post Analyzer & Engagement Predictor

[![npm](https://img.shields.io/npm/v/@keugenek/reactor)](https://npmjs.com/package/@keugenek/reactor)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/keugenek/reactor?style=social)](https://github.com/keugenek/reactor)

**LinkedIn Post Analyzer** — predict engagement before you publish. Get a clear GO/WAIT/IMPROVE verdict, estimated impressions, hook score, debate potential, and cringe detection.

**Try it free:** [keugenek.github.io/reactor](https://keugenek.github.io/reactor/)

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

## Why Reactor?

| Competitors | Reactor |
|-------------|---------|
| Give you a score (0-100) | **Give you a decision: GO/WAIT/IMPROVE** |
| "Your hook is weak" | **"You'll get ~2,500 impressions"** |
| Generic emotional analysis | **Debate score + Cringe detection** |
| Web-only | **CLI + MCP + Claude Desktop + Web** |
| Black-box AI | **Transparent scoring rules** |

### Unique Metrics

- **Debate Score** — Will people argue in comments? (controversy = engagement)
- **Cringe Detection** — Is it too salesy, cliché, or inauthentic?
- **Estimated Impressions** — Not just "good/bad" — actual reach prediction
- **Timing Multiplier** — Best posting times for your audience

## Quick Start

### Web (Free)
**[Analyze your post →](https://keugenek.github.io/reactor/)** — no sign-up required

### CLI

```bash
# Run without installing
npx @keugenek/reactor "Your LinkedIn post text"

# Or install globally
npm install -g @keugenek/reactor
reactor "Your post"
```

### MCP Server (Claude Desktop / Cursor / Windsurf / Claude Code)

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
| `predict_post` | Full prediction: verdict + impressions + improvements |
| `analyze_hook` | Hook analysis (curiosity, emotion, controversy) |
| `best_posting_times` | Optimal posting windows for your audience |
| `reactor_register` | Get free API key |
| `reactor_join_waitlist` | Join Pro waitlist |

### OpenClaw / AI Agent Skill

Copy `skill/SKILL.md` to your agent's skills directory. Auto-triggers on LinkedIn post discussions.

## CLI Commands

```bash
reactor "Your post"                        # predict
reactor "Post" --type opinion_hot_take     # with content type
reactor "Post" --hour 9                    # with posting time
reactor --types                            # list 18 content types
reactor --discover                         # API features + tiers
reactor --register me@email.com            # get free API key (5/day)
reactor --waitlist me@email.com            # join Pro waitlist (50% off)
```

## Content Types

Each type has a viral multiplier based on LinkedIn data:

| Type | Multiplier | Example |
|------|-----------|---------|
| `technical_achievement` | 9.72x | "I built X, here's how" |
| `opinion_hot_take` | 5.00x | "Unpopular opinion: Y is overrated" |
| `research_publication` | 1.28x | Original data, studies |
| `product_launch` | 0.60x | "Excited to announce Z" |
| `rant` | 0.15x | Pure complaints |

Run `reactor --types` for all 18 types.

## API

Base URL: `https://reactor-api.keugenek.workers.dev`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/predict` | POST | Predict post performance |
| `/v1/analyze-hook` | POST | Analyze hook quality |
| `/v1/best-times` | GET | Optimal posting times |
| `/v1/content-types` | GET | List content types + multipliers |
| `/v1/register` | POST | Get free API key |
| `/v1/discover` | GET | Progressive discovery (all endpoints) |

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Demo** | Free | 2 predictions/day, basic verdict |
| **Free** | Free | 5 predictions/day, hook analysis, best times |
| **Pro** | £19/mo | Unlimited, custom personas, media analysis, A/B testing |

## SEO Keywords

LinkedIn post analyzer, LinkedIn engagement predictor, LinkedIn post checker, LinkedIn virality checker, LinkedIn hook analyzer, LinkedIn post score, LinkedIn content analyzer, LinkedIn algorithm tool, LinkedIn post optimizer, LinkedIn engagement calculator, LinkedIn post performance predictor, LinkedIn cringe detector, LinkedIn debate score.

## Privacy

- We store only your email and usage count
- No post content is stored or logged
- All scoring is stateless
- Delete your account anytime: `reactor --delete`

## Architecture

```
┌─────────────┐     ┌──────────────────────┐
│  CLI / MCP  │────▶│  Cloudflare Worker   │
│  (this pkg) │◀────│  (scoring engine)    │
└─────────────┘     │  KV: rate limits     │
                    │  KV: registrations   │
                    └──────────────────────┘
```

## Contributing

Issues and PRs welcome. The scoring engine is proprietary (Cloudflare Worker).

---

**If Reactor saved you from posting a 💀, [star the repo](https://github.com/keugenek/reactor)** ⭐
