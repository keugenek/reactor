# 🔮 Reactor — LinkedIn Post Analyzer & Engagement Predictor

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/keugenek/reactor?style=social)](https://github.com/keugenek/reactor)

**LinkedIn Post Analyzer** — predict engagement before you publish. Get a clear GO/WAIT/IMPROVE verdict, estimated impressions, hook score, debate potential, and cringe detection.

**Try it free:** [keugenek.github.io/reactor](https://keugenek.github.io/reactor/)

```bash
npx -y github:keugenek/reactor "I just ran a 685B parameter model on consumer hardware. Here is what broke." --followers 1000
```

```
  🛠️ IMPROVE  91 – 213 impressions (for 1,000 followers)

  Debate    21/100
  Hook      0.37
  Cringe    15/100
  Auth      85/100
  Timing    0.64x

  ⚠️ LOW DEBATE: Score <30 = reduced reach. Comments drive the algorithm.
  💡 Boost debate score from 21 to >30
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
# Run without installing (Node 18+, zero dependencies)
npx -y github:keugenek/reactor "Your LinkedIn post text" --followers 1000

# Or install globally
npm install -g github:keugenek/reactor
reactor "Your post"
```

### MCP Server (Claude Desktop / Cursor / Windsurf / Claude Code)

Add to your MCP config:

```json
{
  "mcpServers": {
    "reactor": {
      "command": "npx",
      "args": ["-y", "github:keugenek/reactor", "--mcp"]
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
| `list_content_types` | Content types with multipliers |
| `reactor_register` | Get free API key |
| `reactor_join_waitlist` | Join Pro waitlist |

No key is needed for the demo tier (2 calls/day per IP). For 5/day, run `reactor --register you@example.com` once — the key is saved locally — or set `REACTOR_API_KEY` in the `env` block.

### Agent Skill (Claude Code, Cursor, Codex, OpenClaw, ...)

```bash
npx skills add keugenek/reactor
```

Claude Code plugin:

```
/plugin marketplace add keugenek/reactor
/plugin install reactor@reactor
```

Or copy [`skills/reactor/SKILL.md`](skills/reactor/SKILL.md) into your agent's skills directory (for claude.ai, zip the `skills/reactor` folder and upload it as a skill).

## CLI Commands

```bash
reactor "Your post"                        # predict
reactor "Post" --type opinion_hot_take     # with content type
reactor "Post" --hour 9                    # with posting hour (US Pacific)
reactor "Post" --followers 8000            # scale impressions to your audience
reactor --file draft.txt                   # read the post from a file
reactor --hook "Post"                      # hook analysis
reactor --best-times                       # best posting hours
reactor --types                            # list 18 content types
reactor --register me@email.com            # get free API key (5/day)
reactor --waitlist me@email.com            # join Pro waitlist (50% off)
reactor --delete                           # delete your account
reactor --mcp                              # run as MCP server
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
| `/v1/waitlist` | POST | Join Pro waitlist |
| `/v1/account` | DELETE | Delete account |
| `/v1/health` | GET | Health check |

OpenAPI spec: [`docs/openapi.json`](docs/openapi.json). `/v1/predict` and `/v1/analyze-hook` share the daily quota.

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
│ CLI/MCP/Web │────▶│  Cloudflare Worker   │
│ (this repo) │◀────│  (scoring engine)    │
└─────────────┘     │  KV: rate limits     │
                    │  KV: registrations   │
                    └──────────────────────┘
```

## Contributing

Issues and PRs welcome. `npm test` runs the CLI and MCP server against a local mock API — no dependencies to install. The scoring engine is proprietary (Cloudflare Worker).

---

**If Reactor saved you from posting a 💀, [star the repo](https://github.com/keugenek/reactor)** ⭐
