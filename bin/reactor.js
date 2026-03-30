#!/usr/bin/env node
/**
 * Reactor CLI — LinkedIn Post Predictor
 * Usage: reactor "post text" [--type X] [--hour N] [--weekday N]
 *        reactor --register email@example.com
 *        reactor --waitlist email@example.com
 *        reactor --mcp  (start MCP server)
 */

// MCP mode — hand off to MCP server
if (process.argv.includes('--mcp')) {
  await import('../src/mcp.js');
  // mcp.js runs forever, no fallthrough
} else {
  const { predict, register, joinWaitlist, contentTypes } = await import('../src/client.js');
  
  const args = process.argv.slice(2);
  const flags = {};
  const positional = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') { flags.help = true; }
    else if (args[i] === '--register') { flags.register = args[++i]; }
    else if (args[i] === '--waitlist') { flags.waitlist = args[++i]; }
    else if (args[i] === '--type') { flags.type = args[++i]; }
    else if (args[i] === '--hour') { flags.hour = parseInt(args[++i]); }
    else if (args[i] === '--weekday') { flags.weekday = parseInt(args[++i]); }
    else if (args[i] === '--key') { process.env.REACTOR_API_KEY = args[++i]; }
    else if (args[i] === '--types') { flags.types = true; }
    else if (!args[i].startsWith('-')) { positional.push(args[i]); }
  }
  
  const c = { reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
    green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', magenta: '\x1b[35m' };
  
  if (flags.help || (positional.length === 0 && !flags.register && !flags.waitlist && !flags.types)) {
    console.log(`
${c.bold}Reactor${c.reset} — LinkedIn Post Performance Predictor

${c.cyan}Usage:${c.reset}
  reactor "Your LinkedIn post text"          Predict performance
  reactor "Post" --type opinion_hot_take     Set content type
  reactor "Post" --hour 9 --weekday 2        Set posting time (PST)
  reactor --register me@email.com            Get free API key (5/day)
  reactor --waitlist me@email.com            Join Pro waitlist
  reactor --types                            List content types
  reactor --mcp                              Start MCP server

${c.cyan}Options:${c.reset}
  --key KEY          Use API key (or set REACTOR_API_KEY env)
  --type TYPE        Content type (use --types to list)
  --hour N           Posting hour in PST (0-23)
  --weekday N        Day of week (0=Mon, 6=Sun)

${c.cyan}Tiers:${c.reset}
  Demo    2/day (no key)
  Free    5/day (register with email)
  Pro     Unlimited + custom personas + media analysis (waitlist)

${c.dim}https://github.com/keugenek/reactor${c.reset}
`);
    process.exit(0);
  }
  
  if (flags.register) {
    try {
      const r = await register(flags.register);
      console.log(`${c.green}✓${c.reset} Registered!`);
      console.log(`  API Key: ${c.bold}${r.api_key}${c.reset}`);
      console.log(`  Tier: ${r.tier} (${r.limit}/day)`);
      console.log(`\n  ${c.dim}export REACTOR_API_KEY=${r.api_key}${c.reset}`);
      if (r.terms) console.log(`\n  ${c.dim}${r.terms}${c.reset}`);
    } catch (e) { console.error(`${c.red}✗${c.reset} ${e.message}`); process.exit(1); }
    process.exit(0);
  }
  
  if (flags.waitlist) {
    try {
      const r = await joinWaitlist(flags.waitlist, 'cli');
      console.log(`${c.green}🚀${c.reset} ${r.message}`);
      console.log(`  Position: #${r.position}`);
      if (r.proFeatures) { console.log(`\n  ${c.bold}Pro features:${c.reset}`); r.proFeatures.forEach(f => console.log(`  ✨ ${f}`)); }
      if (r.pricing) console.log(`\n  ${c.magenta}${r.pricing}${c.reset}`);
    } catch (e) { console.error(`${c.red}✗${c.reset} ${e.message}`); process.exit(1); }
    process.exit(0);
  }
  
  if (flags.types) {
    try {
      const r = await contentTypes();
      console.log(`${c.bold}Content Types:${c.reset}\n`);
      r.contentTypes.forEach(t => {
        const bar = '█'.repeat(Math.min(30, Math.round(t.multiplier * 3)));
        console.log(`  ${t.name.padEnd(28)} ${c.cyan}${t.multiplier.toFixed(2)}x${c.reset} ${c.dim}${bar}${c.reset}`);
      });
    } catch (e) { console.error(`${c.red}✗${c.reset} ${e.message}`); process.exit(1); }
    process.exit(0);
  }
  
  // Main prediction
  const post = positional.join(' ');
  if (!post) { console.error(`${c.red}✗${c.reset} No post text provided`); process.exit(1); }
  
  try {
    const r = await predict(post, { type: flags.type, hour: flags.hour, weekday: flags.weekday });
    
    const emoji = { GO: `${c.green}✅ GO`, WAIT: `${c.yellow}⏰ WAIT`, IMPROVE: `${c.yellow}⚠️  IMPROVE`, NO: `${c.red}🚫 NO` };
    
    console.log(`\n  ${emoji[r.verdict] || r.verdict}${c.reset}  ${c.bold}${r.impressions.toLocaleString()}${c.reset} impressions\n`);
    console.log(`  ${c.dim}Debate${c.reset}    ${r.debate_score}/100`);
    console.log(`  ${c.dim}Hook${c.reset}      ${r.hook_score}`);
    console.log(`  ${c.dim}Cringe${c.reset}    ${r.cringe_score}/100`);
    console.log(`  ${c.dim}Auth${c.reset}      ${r.authenticity_score}/100`);
    console.log(`  ${c.dim}Timing${c.reset}    ${r.timing_multiplier}x`);
    
    if (r.warnings && Object.keys(r.warnings).length > 0) {
      console.log(`\n  ${c.yellow}Warnings:${c.reset}`);
      Object.values(r.warnings).forEach(w => console.log(`  ⚠ ${w}`));
    }
    if (r.improvements && Object.keys(r.improvements).length > 0) {
      console.log(`\n  ${c.cyan}Improvements:${c.reset}`);
      Object.values(r.improvements).forEach(i => console.log(`  → ${i}`));
    }
    
    if (r.rateLimit) {
      console.log(`\n  ${c.dim}${r.tier} tier: ${r.rateLimit.remaining}/${r.rateLimit.limit} remaining${c.reset}`);
    }
    if (r.proTeaser) {
      console.log(`\n  ${c.magenta}🔒 Pro: ${r.proTeaser.locked.join(', ')}${c.reset}`);
      console.log(`  ${c.dim}reactor --waitlist you@email.com${c.reset}`);
    }
  } catch (e) {
    if (e.data?.needsRegistration) {
      console.error(`${c.yellow}⚠${c.reset} Demo limit reached. Register for free (5/day):`);
      console.error(`  ${c.bold}reactor --register you@email.com${c.reset}`);
    } else {
      console.error(`${c.red}✗${c.reset} ${e.message}`);
    }
    process.exit(1);
  }
}
