// Runs the CLI and MCP server against a local mock of the Reactor API.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BIN = fileURLToPath(new URL('../bin/reactor.mjs', import.meta.url));
const seen = [];
let server, base;
const cfg = mkdtempSync(join(tmpdir(), 'reactor-'));

before(async () => {
  server = createServer((req, res) => {
    let raw = '';
    req.on('data', c => (raw += c));
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : undefined;
      seen.push({ method: req.method, url: req.url, auth: req.headers.authorization, body });
      const json = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
      if (req.url === '/v1/predict' && body?.post === 'LIMIT') {
        return json(429, { error: 'Rate limit exceeded', message: 'Demo limit (2/day) exceeded.', needsRegistration: true, resetAt: 1795651199000 });
      }
      if (req.url === '/v1/predict') {
        return json(200, { verdict: 'GO', impressions: 1000, impressions_low: 600, impressions_high: 1400, followers: body.followers,
          debate_score: 60, hook_score: 0.34, cringe_score: 8, authenticity_score: 93, timing_multiplier: 1.38,
          warnings: [], improvements: ['Add a question'], tier: 'demo', rateLimit: { remaining: 1, limit: 2 } });
      }
      if (req.url === '/v1/register') return json(200, { api_key: 'rk_free_test', limit: 5 });
      if (req.url === '/v1/content-types') return json(200, { contentTypes: [{ name: 'rant', multiplier: 0.15 }] });
      json(404, { error: 'Not found' });
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

function run(args, input) {
  return new Promise(resolve => {
    const env = { ...process.env, REACTOR_API_URL: base, XDG_CONFIG_HOME: cfg };
    delete env.REACTOR_API_KEY;
    const p = spawn(process.execPath, [BIN, ...args], { env });
    let out = '', err = '';
    p.stdout.on('data', d => (out += d));
    p.stderr.on('data', d => (err += d));
    p.on('close', code => resolve({ code, out, err }));
    if (input !== undefined) p.stdin.end(input); else p.stdin.end();
  });
}

test('predict sends followers and prints the server range', async () => {
  const r = await run(['Hello world', '--followers', '8000', '--type', 'rant', '--hour', '9']);
  assert.equal(r.code, 0);
  assert.match(r.out, /GO\s+600 – 1,400 impressions \(for 8,000 followers\)/);
  const call = seen.at(-1);
  assert.deepEqual(call.body, { post: 'Hello world', content_type: 'rant', hour: 9, followers: 8000 });
  assert.equal(call.auth, undefined);
});

test('rate limit exits non-zero with a registration hint', async () => {
  const r = await run(['LIMIT']);
  assert.equal(r.code, 1);
  assert.match(r.err, /Rate limit reached/);
  assert.match(r.err, /--register/);
});

test('register saves the key and later calls send it', async () => {
  assert.equal((await run(['--register', 'a@b.co'])).code, 0);
  await run(['Hello again']);
  assert.equal(seen.at(-1).auth, 'Bearer rk_free_test');
});

test('followers defaults to 1000 in CLI and MCP instead of the API default', async () => {
  await run(['No followers given']);
  assert.equal(seen.at(-1).body.followers, 1000);
  const call = { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'predict_post', arguments: { post: 'Hi' } } };
  await run(['--mcp'], JSON.stringify(call) + '\n');
  assert.equal(seen.at(-1).body.followers, 1000);
});

test('MCP: initialize, tools/list, tools/call', async () => {
  const msgs = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'predict_post', arguments: { post: 'Hi', followers: 500 } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'predict_post', arguments: { post: 'LIMIT' } } },
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'predict_post', arguments: {} } },
    { jsonrpc: '2.0', id: 6, method: 'nope' },
  ];
  const r = await run(['--mcp'], msgs.map(m => JSON.stringify(m)).join('\n') + '\n');
  const res = Object.fromEntries(r.out.trim().split('\n').map(l => JSON.parse(l)).map(m => [m.id, m]));
  assert.equal(Object.keys(res).length, 6); // the notification gets no reply
  assert.equal(res[1].result.protocolVersion, '2025-06-18');
  assert.equal(res[1].result.serverInfo.name, 'reactor');
  assert.equal(res[2].result.tools.length, 6);
  assert.ok(res[2].result.tools.every(t => t.inputSchema && !('run' in t)));
  assert.equal(JSON.parse(res[3].result.content[0].text).verdict, 'GO');
  assert.equal(res[4].result.isError, true);
  assert.equal(res[5].result.isError, true);
  assert.equal(res[6].error.code, -32601);
});
