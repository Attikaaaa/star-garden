// A Wildgrove dedicated server without a single dependency: it runs the game itself in a headless Chromium
// that keeps its own profile (so the world is saved between runs). Friends join with the printed code.
//   node tools/wg-server.mjs "MY WORLD" [--public] [--seed 42] [--code ABCDE] [--peaceful]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), name = args.find(a => !a.startsWith('--')) || 'WILDGROVE SERVER';
const opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : ''; };
function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const found = [], pw = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (fs.existsSync(pw)) for (const d of fs.readdirSync(pw).filter(d => d.startsWith('chromium_headless_shell')).sort().reverse())
    for (const b of ['chrome-headless-shell-mac-arm64', 'chrome-headless-shell-mac-x64', 'chrome-linux']) found.push(path.join(pw, d, b, 'chrome-headless-shell'));
  found.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome');
  const bin = found.find(f => fs.existsSync(f)); if (!bin) { console.error('No Chromium found: set CHROME=/path/to/chrome'); process.exit(1); } return bin;
}
const profile = path.join(os.homedir(), '.wildgrove-server', name.replace(/[^A-Za-z0-9]/g, '_'));
fs.mkdirSync(profile, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const q = new URLSearchParams({ wgserver: name });
if (args.includes('--public')) q.set('pub', '1'); if (args.includes('--peaceful')) q.set('peaceful', '1');
if (opt('seed')) q.set('seed', opt('seed')); if (opt('code')) q.set('code', opt('code'));
const url = 'file://' + path.join(root, 'index.html') + '?' + q;
const proc = spawn(chrome(), ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--window-size=640,360', url], { stdio: 'ignore' });
proc.on('exit', () => process.exit(0));
for (const sg of ['SIGINT', 'SIGTERM']) process.on(sg, () => { proc.kill(); process.exit(0); });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// read the status through DevTools every few seconds
const ws = await (async () => { for (let i = 0; i < 60; i++) { await sleep(500); try { const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const t = l.find(x => x.type === 'page'); if (t) return new WebSocket(t.webSocketDebuggerUrl); } catch (e) { /* not up yet */ } } throw new Error('browser did not start'); })();
let id = 0; const wait = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); } };
await new Promise(r => { ws.onopen = r; });
const ev = (expression) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression, returnByValue: true } })); });
console.log('Starting', name, '...');
let last = '';
for (;;) {
  await sleep(5000);
  const r = await ev(`typeof WGN !== 'undefined' && WGN.role === 'host' ? WGN.code + ' | ' + (WGN.pub ? 'PUBLIC' : 'PRIVATE') + ' | players ' + WGN.peers.filter(p => p.pid > 0).map(p => p.name).join(',') + ' | day ' + (WGS.day + 1) : 'starting'`);
  const s = r.result && r.result.result && r.result.result.value;
  if (s && s !== last) { console.log(new Date().toISOString().slice(11, 19), s); last = s; }
}
