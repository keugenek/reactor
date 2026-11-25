#!/usr/bin/env node
// Reactor CLI + MCP server. Zero dependencies, Node >= 18.
// Thin client: all scoring happens in the Reactor API.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';

const VERSION = '1.1.0';
const API = (process.env.REACTOR_API_URL || 'https://reactor-api.keugenek.workers.dev').replace(/\/+$/, '');
const KEY_DIR = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'reactor');
const KEY_FILE = join(KEY_DIR, 'api_key');
const DEFAULT_FOLLOWERS = 1000;

// ---------- API client ----------

function loadKey() {
  if (process.env.REACTOR_API_KEY) return process.env.REACTOR_API_KEY.trim();
  try { return readFileSync(KEY_FILE, 'utf8').trim(); } catch { return ''; }
}

function saveKey(key) {
  mkdirSync(KEY_DIR, { recursive: true, mode: 0o700 });
  writeFileSync(KEY_FILE, key + '\n', { mode: 0o600 });
}

class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || body?.error || `HTTP ${status}`);
    this.status = status;
    this.body = body || {};
  }
}

async function api(method, path, body) {
  const headers = { 'User-Agent': `reactor-cli/${VERSION}` };
  const key = loadKey();
  // Placeholder keys from copied config examples must not be sent: the API rejects them with 401.
  if (key && !/your_key|xxx/i.test(key)) headers.Authorization = `Bearer ${key}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await fetch(API + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (e) {
      if (attempt < 1) continue;
      throw new ApiError(0, { error: `Network error: ${e.message}` });
    }
    if (res.status >= 500 && attempt < 1) { await new Promise(r => setTimeout(r, 1500)); continue; }
    break;
  }
  let data;
  try { data = await res.json(); } catch { data = { error: `HTTP ${res.status} (non-JSON response)` }; }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

function predictBody(o) {
  const body = { post: o.post };
  if (o.content_type) body.content_type = o.content_type;
  if (Number.isInteger(o.hour)) body.hour = o.hour;
  if (Number.isInteger(o.weekday)) body.weekday = o.weekday;
  // Always send followers: when omitted the API assumes its 4,410 calibration audience,
  // not the 1,000 default this client advertises.
  body.followers = Number.isFinite(o.followers) && o.followers > 0 ? Math.round(o.followers) : DEFAULT_FOLLOWERS;
  return body;
}

// ---------- formatting ----------

const n = x => (typeof x === 'number' ? x.toLocaleString('en-US') : String(x ?? '–'));
const ICON = { GO: '✅', WAIT: '⏳', IMPROVE: '🛠️', NO: '❌' };

function range(d) {
  return d.impressions_low && d.impressions_high
    ? `${n(d.impressions_low)} – ${n(d.impressions_high)}`
    : `~${n(d.impressions)}`;
}

function formatPrediction(d) {
  const out = [
    '',
    `  ${ICON[d.verdict] || ''} ${d.verdict}  ${range(d)} impressions${d.followers ? ` (for ${n(d.followers)} followers)` : ''}`,
    '',
    `  Debate    ${d.debate_score}/100`,
    `  Hook      ${d.hook_score}`,
    `  Cringe    ${d.cringe_score}/100`,
    `  Auth      ${d.authenticity_score}/100`,
    `  Timing    ${d.timing_multiplier}x`,
  ];
  if (d.warnings?.length) out.push('', ...d.warnings.map(w => `  ${w}`));
  if (d.improvements?.length) out.push('', ...d.improvements.map(i => `  💡 ${i}`));
  if (d.rateLimit) out.push('', `  ${d.tier} tier: ${d.rateLimit.remaining}/${d.rateLimit.limit} calls left today`);
  return out.join('\n') + '\n';
}

function formatError(e) {
  if (e.status === 429) {
    const reset = e.body.resetAt ? ` Resets ${new Date(e.body.resetAt).toISOString()}.` : '';
    const hint = e.body.needsRegistration
      ? '\n  Get a free key (5/day):  reactor --register you@example.com'
      : '';
    return `Rate limit reached. ${e.body.message || ''}${reset}${hint}`;
  }
  if (e.status === 401) return 'Invalid API key. Check REACTOR_API_KEY or re-run: reactor --register you@example.com';
  return e.message;
}

// ---------- MCP server (stdio, newline-delimited JSON-RPC 2.0) ----------

const TOOLS = [
  {
    name: 'predict_post',
    description:
      'Predict LinkedIn post performance before publishing. Returns verdict (GO/WAIT/IMPROVE/NO), an impressions range, ' +
      'debate/hook/cringe/authenticity scores, timing multiplier, warnings and improvements. Each call counts against a ' +
      'daily quota (2/day without a key, 5/day with a free key), so do not call it in a loop.',
    inputSchema: {
      type: 'object',
      properties: {
        post: { type: 'string', description: 'Full text of the LinkedIn post draft' },
        followers: { type: 'integer', minimum: 1, description: "Author's LinkedIn follower count (default 1000)" },
        content_type: { type: 'string', description: 'Optional content type, see list_content_types' },
        hour: { type: 'integer', minimum: 0, maximum: 23, description: 'Planned posting hour, US Pacific time (default: now)' },
        weekday: { type: 'integer', minimum: 0, maximum: 6, description: 'Planned posting weekday, 0 = Sunday (default: today)' },
      },
      required: ['post'],
    },
    run: a => api('POST', '/v1/predict', predictBody(a)),
  },
  {
    name: 'analyze_hook',
    description:
      'Analyze the opening lines of a LinkedIn post: curiosity gap, emotional trigger, controversy potential, ' +
      'relatability, specificity (each 0-1). Counts against the same daily quota as predict_post.',
    inputSchema: {
      type: 'object',
      properties: { post: { type: 'string', description: 'Post text; the hook is taken from the first lines' } },
      required: ['post'],
    },
    run: a => api('POST', '/v1/analyze-hook', { post: a.post }),
  },
  {
    name: 'best_posting_times',
    description: 'Ranked posting hours (US Pacific time) with audience-awake % and peak-engagement %. Free, no quota.',
    inputSchema: { type: 'object', properties: {} },
    run: () => api('GET', '/v1/best-times'),
  },
  {
    name: 'list_content_types',
    description: 'List the 18 content types with their reach multipliers. Free, no quota.',
    inputSchema: { type: 'object', properties: {} },
    run: () => api('GET', '/v1/content-types'),
  },
  {
    name: 'reactor_register',
    description:
      'Register an email for a free API key (5 predictions/day). Only call after the user has explicitly agreed: ' +
      'the service stores the email and a usage counter. The key is saved locally for later calls.',
    inputSchema: {
      type: 'object',
      properties: { email: { type: 'string', description: "The user's email, provided by the user" } },
      required: ['email'],
    },
    run: async a => {
      const d = await api('POST', '/v1/register', { email: a.email });
      if (d.api_key) { try { saveKey(d.api_key); } catch { /* read-only home: key is still returned */ } }
      return d;
    },
  },
  {
    name: 'reactor_join_waitlist',
    description: 'Add an email to the Pro waitlist. Only call after the user has explicitly asked to join.',
    inputSchema: {
      type: 'object',
      properties: { email: { type: 'string' } },
      required: ['email'],
    },
    run: a => api('POST', '/v1/waitlist', { email: a.email }),
  },
];

function runMcp() {
  const send = msg => process.stdout.write(JSON.stringify(msg) + '\n');
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });

  const pending = new Set();
  const handle = async line => {
    if (!line.trim()) return;
    let msg;
    try { msg = JSON.parse(line); } catch {
      return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    }
    const { id, method, params } = msg;
    const isRequest = id !== undefined && id !== null;
    const reply = result => isRequest && send({ jsonrpc: '2.0', id, result });
    const fail = (code, message) => isRequest && send({ jsonrpc: '2.0', id, error: { code, message } });

    try {
      switch (method) {
        case 'initialize':
          return reply({
            protocolVersion: params?.protocolVersion || '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'reactor', version: VERSION },
            instructions:
              'Reactor predicts LinkedIn post performance. Ask the user for their follower count once, pass it as ' +
              '`followers`, and present the returned impressions range as-is. Never invent scores.',
          });
        case 'ping':
          return reply({});
        case 'tools/list':
          return reply({ tools: TOOLS.map(({ run, ...t }) => t) });
        case 'tools/call': {
          const tool = TOOLS.find(t => t.name === params?.name);
          if (!tool) return fail(-32602, `Unknown tool: ${params?.name}`);
          const args = params.arguments || {};
          const missing = (tool.inputSchema.required || []).filter(k => args[k] === undefined || args[k] === '');
          if (missing.length) {
            return reply({ isError: true, content: [{ type: 'text', text: `Missing required argument: ${missing.join(', ')}` }] });
          }
          try {
            const data = await tool.run(args);
            return reply({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
          } catch (e) {
            return reply({ isError: true, content: [{ type: 'text', text: formatError(e) }] });
          }
        }
        case 'resources/list': return reply({ resources: [] });
        case 'prompts/list': return reply({ prompts: [] });
        default:
          if (isRequest) fail(-32601, `Method not found: ${method}`);
      }
    } catch (e) {
      fail(-32603, e.message);
    }
  };
  rl.on('line', line => {
    const p = handle(line).finally(() => pending.delete(p));
    pending.add(p);
  });
  // Finish in-flight calls before exiting when the client closes stdin.
  rl.on('close', async () => { await Promise.allSettled([...pending]); process.exit(0); });
}

// ---------- CLI ----------

const HELP = `reactor ${VERSION} — LinkedIn post performance predictor

Usage:
  reactor "Your post text" [--followers N] [--type TYPE] [--hour 0-23] [--weekday 0-6] [--json]
                                      --followers defaults to 1000
  reactor --file draft.txt            predict a post read from a file ("-" = stdin)
  reactor --hook "Your post text"     hook analysis
  reactor --types                     list content types
  reactor --best-times                best posting hours (US Pacific)
  reactor --register you@example.com  get a free API key (5/day), saved to ${KEY_FILE}
  reactor --waitlist you@example.com  join the Pro waitlist
  reactor --delete                    delete your account and the saved key
  reactor --mcp                       run as an MCP server over stdio

Environment:
  REACTOR_API_KEY   API key (overrides the saved key)
  REACTOR_API_URL   API base URL (default ${API})
`;

function parseArgs(argv) {
  const o = { _: [] };
  const flags = { '--type': 'content_type', '--hour': 'hour', '--weekday': 'weekday', '--followers': 'followers',
    '--register': 'register', '--waitlist': 'waitlist', '--file': 'file', '--hook': 'hook' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a in flags) {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      o[flags[a]] = ['hour', 'weekday', 'followers'].includes(flags[a]) ? Number(v) : v;
      if (Number.isNaN(o[flags[a]])) throw new Error(`${a} must be a number`);
    } else if (a.startsWith('--')) o[a.slice(2)] = true;
    else if (a === '-h') o.help = true;
    else o._.push(a);
  }
  return o;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const print = d => console.log(JSON.stringify(d, null, 2));

  if (o.mcp) return runMcp();
  if (o.version) return console.log(VERSION);
  if (o.help) return console.log(HELP);

  if (o.types) {
    const d = await api('GET', '/v1/content-types');
    if (o.json) return print(d);
    for (const t of d.contentTypes) console.log(`  ${t.name.padEnd(26)} ${t.multiplier}x`);
    return;
  }
  if (o['best-times']) {
    const d = await api('GET', '/v1/best-times');
    if (o.json) return print(d);
    for (const t of d.bestTimes) {
      console.log(`  ${String(t.pstHour).padStart(2, '0')}:00 PT   score ${t.score}   awake ${t.awakePct}%   peak ${t.peakPct}%`);
    }
    return;
  }
  if (o.register) {
    const d = await api('POST', '/v1/register', { email: o.register });
    if (d.api_key) saveKey(d.api_key);
    if (o.json) return print(d);
    return console.log(`Registered. Key saved to ${KEY_FILE}${d.limit ? ` — ${d.limit} predictions/day` : ''}.`);
  }
  if (o.waitlist) {
    const d = await api('POST', '/v1/waitlist', { email: o.waitlist });
    return o.json ? print(d) : console.log(d.message || 'Added to the Pro waitlist.');
  }
  if (o.delete) {
    const d = await api('DELETE', '/v1/account');
    try { rmSync(KEY_FILE); } catch { /* no saved key */ }
    return o.json ? print(d) : console.log(d.message || 'Account deleted.');
  }
  if (o.hook) {
    const d = await api('POST', '/v1/analyze-hook', { post: o.hook });
    if (o.json) return print(d);
    console.log(`\n  Hook: ${d.hookText}\n`);
    for (const k of ['curiosityGap', 'emotionalTrigger', 'controversyPotential', 'relatability', 'specificity']) {
      console.log(`  ${k.padEnd(22)} ${d[k]}`);
    }
    return console.log();
  }

  let post = o._.join(' ');
  if (o.file) post = readFileSync(o.file === '-' ? 0 : o.file, 'utf8');
  if (!post.trim()) { console.log(HELP); process.exitCode = 1; return; }

  const d = await api('POST', '/v1/predict', predictBody({ ...o, post }));
  if (o.json) return print(d);
  process.stdout.write(formatPrediction(d));
}

main().catch(e => {
  console.error(e instanceof ApiError ? formatError(e) : `Error: ${e.message}`);
  process.exitCode = 1;
});
