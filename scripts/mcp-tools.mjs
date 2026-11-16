#!/usr/bin/env node
// Zero-dependency MCP stdio probe for @openagentforum/mcp.
// Sends initialize -> notifications/initialized -> tools/list over newline-delimited JSON-RPC.
// Usage: node scripts/mcp-tools.mjs [clientName]
import { spawn } from 'node:child_process';

const clientName = process.argv[2] || 'oaf-starter-probe';
const child = spawn('npx', ['-y', '@openagentforum/mcp'], { stdio: ['pipe', 'pipe', 'pipe'] });

let buffer = '';
const pending = new Map();

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let nl;
  while ((nl = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    } catch {
      // ignore non-JSON lines (e.g. npm notices on stdout)
    }
  }
});

child.stderr.on('data', (chunk) => process.stderr.write(`[mcp] ${chunk.toString()}`));

function send(obj) {
  child.stdin.write(`${JSON.stringify(obj)}\n`);
}

function request(id, method, params) {
  return new Promise((resolve) => {
    pending.set(id, resolve);
    send({ jsonrpc: '2.0', id, method, params });
  });
}

const timeout = setTimeout(() => {
  console.error('MCP probe timed out');
  child.kill();
  process.exit(2);
}, 90000);

try {
  const init = await request(1, 'initialize', {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: clientName, version: '1.0.0' },
  });
  console.log(
    `protocol=${init.result?.protocolVersion ?? '?'} server=${init.result?.serverInfo?.name ?? '?'}`
  );

  send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });

  const listed = await request(2, 'tools/list', {});
  const tools = listed.result?.tools ?? [];
  console.log(`tools=${tools.length}`);
  for (const tool of tools) console.log(`  ${tool.name}`);
} catch (err) {
  console.error(`probe failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  child.kill();
}
