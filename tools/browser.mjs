// A headless Chromium driven over the DevTools protocol (Node 22+, no dependencies), shared by
// tools/dev.mjs and the qa/ checks. Nothing here ships: the game never loads this folder.
//
// The browser: CHROME=/path/to/chrome, else Playwright's headless shell, Google Chrome or Edge.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = path.join(os.tmpdir(), 'star-garden');
fs.mkdirSync(OUT, { recursive: true });
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const pw = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const found = [];
  if (fs.existsSync(pw)) for (const d of fs.readdirSync(pw).filter((d) => d.startsWith('chromium_headless_shell')).sort().reverse())
    for (const b of ['chrome-headless-shell-mac-arm64', 'chrome-headless-shell-mac-x64', 'chrome-linux']) found.push(path.join(pw, d, b, 'chrome-headless-shell'));
  found.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome');
  for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean))
    found.push(path.join(base, 'Google/Chrome/Application/chrome.exe'), path.join(base, 'Microsoft/Edge/Application/msedge.exe'));
  const bin = found.find((f) => fs.existsSync(f));
  if (!bin) throw new Error('no Chromium found: set CHROME');
  return bin;
}

// Keys for press(): the code the game reads, the key and the Windows key code Chromium wants.
const KEYS = { Escape: ['Escape', 27], Enter: ['Enter', 13], Space: [' ', 32], Tab: ['Tab', 9], ArrowUp: ['ArrowUp', 38], ArrowDown: ['ArrowDown', 40], ArrowLeft: ['ArrowLeft', 37], ArrowRight: ['ArrowRight', 39] };

// Opens the game in a fresh profile. Returns { ev, shot, press, realErrors, close }.
export async function open({ w = 1152, h = 648 } = {}) {
  const port = 9400 + Math.floor(Math.random() * 400), dir = path.join(OUT, 'profile-' + port);
  fs.rmSync(dir, { recursive: true, force: true });
  const proc = spawn(chrome(), ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + dir, '--allow-file-access-from-files',
    '--autoplay-policy=no-user-gesture-required', '--mute-audio', '--window-size=' + w + ',' + h, 'about:blank'], { stdio: 'ignore' });
  let list = [];
  for (let i = 0; i < 80 && !list.find((t) => t.type === 'page'); i++) {
    await sleep(100);
    try { list = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); } catch (e) { /* not up yet */ }
  }
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const wait = new Map(), errors = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map((a) => a.value ?? a.description).join(' '));
  };
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await cmd('Runtime.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.navigate', { url: pathToFileURL(path.join(ROOT, 'index.html')).href });
  const ev = async (expr) => {
    const r = await cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error((r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text) + '\n  in: ' + expr.slice(0, 160));
    return r.result?.result?.value;
  };
  // wait for the last script (net.js), then a moment for the title to settle; a busy machine is slow
  for (let i = 0; i < 300 && !(await ev('typeof NET !== "undefined" && typeof G !== "undefined"')); i++) await sleep(100);
  await sleep(1000);
  const shot = async (file) => {
    const r = await cmd('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, file), Buffer.from(r.result.data, 'base64'));
    return path.join(OUT, file);
  };
  // a key tap, by the code the game reads ('KeyE', 'Escape', 'Space'...)
  const press = async (code, ms = 60) => {
    const [key, vk] = KEYS[code] || [code.replace(/^Key|^Digit/, '').toLowerCase(), code.replace(/^Key|^Digit/, '').toUpperCase().charCodeAt(0)];
    await cmd('Input.dispatchKeyEvent', { type: 'keyDown', code, key, windowsVirtualKeyCode: vk });
    await sleep(ms);
    await cmd('Input.dispatchKeyEvent', { type: 'keyUp', code, key, windowsVirtualKeyCode: vk });
  };
  // file:// cannot fetch live.json; that one error is expected
  const realErrors = () => errors.filter((e) => !/live\.json|Failed to fetch/.test(e));
  const close = () => {
    try { ws.close(); } catch (e) { /* gone */ }
    proc.kill();
    setTimeout(() => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* still locked */ } }, 500);
  };
  return { ev, shot, press, realErrors, close };
}

// Polls a page expression until it is truthy; rejects after ms.
export async function waitFor(ev, expr, ms = 10000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(100)) if (await ev(expr)) return true;
  throw new Error('timed out waiting for ' + expr);
}
