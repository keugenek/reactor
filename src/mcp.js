#!/usr/bin/env node
/**
 * Reactor MCP Server
 * Predicts LinkedIn post performance using the Reactor API
 * 
 * Tools:
 *   predict_post - Full prediction with verdict, impressions, debate score
 *   analyze_hook - Hook-only analysis (curiosity, emotion, controversy)
 *   best_posting_times - Optimal posting times for your audience
 *   reactor_register - Register for API key
 *   reactor_join_waitlist - Join Pro waitlist
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { predict, analyzeHook, bestTimes, register, joinWaitlist, contentTypes } from "./client.js";

const CONTENT_TYPES = [
  "technical_achievement", "opinion_hot_take", "research_publication",
  "retrospective", "product_launch", "short_commentary",
  "methodology_discussion", "achievement_announcement", "workflow_sharing",
  "cautionary_tale", "tool_appreciation", "media_mention",
  "event_recap", "technical_deep_dive", "philosophical_take",
  "feature_announcement", "technical_note", "rant"
];

function formatPrediction(result) {
  const verdictEmoji = { GO: "✅", WAIT: "⏰", IMPROVE: "⚠️", NO: "🚫" };
  
  let output = `${verdictEmoji[result.verdict] || "❓"} ${result.verdict}: ${result.impressions.toLocaleString()} impressions predicted\n\n`;
  output += `📊 Scores:\n`;
  output += `  Debate: ${result.debateScore}/100\n`;
  output += `  Hook: ${result.hookScore}\n`;
  output += `  Cringe: ${result.cringeScore}/100\n`;
  output += `  Authenticity: ${result.authenticityScore}/100\n`;
  output += `  Timing: ${result.timingMultiplier}x\n\n`;

  if (result.warnings && result.warnings.length > 0) {
    output += `⚠️ Warnings:\n`;
    result.warnings.forEach(w => { output += `  ${w}\n`; });
    output += "\n";
  }

  if (result.improvements && result.improvements.length > 0) {
    output += `💡 Improvements:\n`;
    result.improvements.forEach(i => { output += `  → ${i}\n`; });
    output += "\n";
  }

  output += `Tier: ${result.tier}`;
  if (result.rateLimit) {
    output += ` (${result.rateLimit.remaining}/${result.rateLimit.limit} remaining today)`;
  }

  if (result.proTeaser) {
    output += `\n\n🔒 Pro-only: ${result.proTeaser.locked.join(', ')}`;
    output += `\n→ Join waitlist for early access (50% off): call reactor_join_waitlist`;
  }

  return output;
}

const server = new Server(
  {
    name: "reactor-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "predict_post",
      description: "Predict LinkedIn post performance. Returns verdict (GO/WAIT/IMPROVE/NO), estimated impressions, debate score, cringe score, and actionable improvements. If the response indicates needsRegistration, ask the user for their email (with consent) and call reactor_register first.",
      inputSchema: {
        type: "object",
        properties: {
          post: {
            type: "string",
            description: "The full LinkedIn post text to analyze",
          },
          content_type: {
            type: "string",
            description: "Content type for baseline multiplier",
            enum: CONTENT_TYPES,
          },
          hour: {
            type: "number",
            description: "Posting hour in PST (0-23). Default: current hour",
            minimum: 0,
            maximum: 23,
          },
          weekday: {
            type: "number",
            description: "Day of week (0=Monday, 6=Sunday). Default: current day",
            minimum: 0,
            maximum: 6,
          },
        },
        required: ["post"],
      },
    },
    {
      name: "analyze_hook",
      description: "Analyze just the hook (first 1-2 lines) of a LinkedIn post. Returns curiosity gap, emotional trigger, controversy potential, and relatability scores.",
      inputSchema: {
        type: "object",
        properties: {
          post: {
            type: "string",
            description: "The LinkedIn post text (hook will be extracted from first 1-2 lines)",
          },
        },
        required: ["post"],
      },
    },
    {
      name: "best_posting_times",
      description: "Get the best times to post on LinkedIn for maximum reach, based on audience timezone distribution.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "reactor_register",
      description: "Register for a free Reactor API key (5 predictions/day). IMPORTANT: Before calling this, you MUST ask the user for explicit consent. Explain: 'Reactor stores only your email and usage count. You can delete your account anytime via DELETE /v1/account.' Only call after the user provides their email and agrees.",
      inputSchema: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "User's email address (must have explicit consent before calling)",
          },
        },
        required: ["email"],
      },
    },
    {
      name: "reactor_join_waitlist",
      description: "Join the Reactor Pro waitlist. Pro features include: custom audience personas, image/carousel/video analysis, A/B hook testing, historical calibration from your actual posts, and unlimited predictions. Ask user for email with consent before calling. Mention: early birds get 50% off.",
      inputSchema: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "User's email address (must have explicit consent)",
          },
          source: {
            type: "string",
            description: "Where the user found Reactor (e.g. 'mcp', 'cli', 'github')",
          },
        },
        required: ["email"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "predict_post": {
        const result = await predict(args.post, {
          type: args.content_type,
          hour: args.hour,
          weekday: args.weekday,
        });
        return {
          content: [{ type: "text", text: formatPrediction(result) }],
        };
      }

      case "analyze_hook": {
        const result = await analyzeHook(args.post);
        let output = `🎣 Hook Analysis:\n`;
        output += `  Text: "${result.hookText}"\n`;
        output += `  Curiosity Gap: ${result.curiosityGap}\n`;
        output += `  Emotional Trigger: ${result.emotionalTrigger}\n`;
        output += `  Controversy: ${result.controversyPotential}\n`;
        output += `  Relatability: ${result.relatability}\n`;
        output += `  Specificity: ${result.specificity}\n`;
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "best_posting_times": {
        const result = await bestTimes();
        let output = `⏰ Best Posting Times (PST):\n\n`;
        result.bestTimes.slice(0, 5).forEach((t, i) => {
          output += `  ${i + 1}. ${t.pstHour}:00 PST — Score: ${t.score} (${t.awakePct}% awake, ${t.peakPct}% peak)\n`;
        });
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "reactor_join_waitlist": {
        const result = await joinWaitlist(args.email, args.source || "mcp");
        let output = `🚀 ${result.message}\n`;
        output += `  Position: #${result.position}\n\n`;
        if (result.proFeatures) {
          output += `Pro features coming soon:\n`;
          result.proFeatures.forEach(f => { output += `  ✨ ${f}\n`; });
        }
        if (result.pricing) output += `\n💰 ${result.pricing}`;
        return {
          content: [{ type: "text", text: output }],
        };
      }

      case "reactor_register": {
        const result = await register(args.email);
        let output = `✅ Registered!\n`;
        output += `  API Key: ${result.api_key}\n`;
        output += `  Tier: ${result.tier} (${result.limit} predictions/day)\n`;
        output += `  ${result.terms || ''}\n\n`;
        output += `To use: set REACTOR_API_KEY=${result.api_key} in your MCP config.`;
        return {
          content: [{ type: "text", text: output }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Surface registration prompt on rate limit
    if (error.message && error.message.includes('Rate limit')) {
      return {
        content: [{ type: "text", text: `⚠️ ${error.message}\n\nTo get more predictions, I can register you for a free API key (5/day). I just need your email — we only store email + usage count. Want to register?` }],
      };
    }
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
