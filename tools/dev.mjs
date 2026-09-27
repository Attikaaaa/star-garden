// Developer checks that drive the real game in headless Chromium (Node 22+, no dependencies).
// Nothing here ships: the game never loads this folder.
//
//   node tools/dev.mjs layouts              every room layout: size, characters, open door lanes,
//                                           doors and enemy slots reachable (BFS), sealed pockets
//   node tools/dev.mjs sheet [regex] [zoom] contact sheet of the sprites whose name matches, 3x by default,
//                                           written to /tmp/star-garden/sheet.png
//   node tools/dev.mjs bot [land] [floors]  an invulnerable bot clears every room of a run (from
//                                           the given land, or the default road), then reports
//                                           errors, frame times and a screenshot per floor
//   node tools/dev.mjs room [land] [js] [ms] [type]  screenshot of a room in that land (first
//                                           normal room, or the given type) after an optional expression
//
// The browser: CHROME=/path/to/chrome, else Playwright's headless shell or Google Chrome.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(os.tmpdir(), 'star-garden');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function chrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const pw = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const found = [];
  if (fs.existsSync(pw)) for (const d of fs.readdirSync(pw).filter((d) => d.startsWith('chromium_headless_shell')).sort().reverse())
    for (const b of ['chrome-headless-shell-mac-arm64', 'chrome-headless-shell-mac-x64', 'chrome-linux']) found.push(path.join(pw, d, b, 'chrome-headless-shell'));
  found.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome');
  const bin = found.find((f) => fs.existsSync(f));
  if (!bin) throw new Error('no Chromium found: set CHROME');
  return bin;
}

async function open({ w = 1152, h = 648 } = {}) {
  const port = 9400 + Math.floor(Math.random() * 400), dir = path.join(OUT, 'profile');
  fs.rmSync(dir, { recursive: true, force: true });
  const proc = spawn(chrome(), ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + dir, '--allow-file-access-from-files',
    '--autoplay-policy=no-user-gesture-required', '--window-size=' + w + ',' + h, 'about:blank'], { stdio: 'ignore' });
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
  await cmd('Page.navigate', { url: 'file://' + path.join(ROOT, 'index.html') });
  await sleep(1500);
  const ev = async (expr) => {
    const r = await cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error((r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text) + '\n  in: ' + expr.slice(0, 160));
    return r.result?.result?.value;
  };
  const shot = async (file) => {
    const r = await cmd('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, file), Buffer.from(r.result.data, 'base64'));
    return path.join(OUT, file);
  };
  // file:// cannot fetch live.json; that one error is expected
  const realErrors = () => errors.filter((e) => !/live\.json|Failed to fetch/.test(e));
  return { ev, shot, realErrors, close: () => { try { ws.close(); } catch (e) { /* gone */ } proc.kill(); } };
}

// ---------- layouts ----------
// Every top-level const whose name ends in LAYOUT or LAYOUTS, in any source file.
function layoutNames() {
  const names = new Set();
  for (const f of fs.readdirSync(path.join(ROOT, 'src')).filter((f) => f.endsWith('.js')))
    for (const m of fs.readFileSync(path.join(ROOT, 'src', f), 'utf8').matchAll(/^const ([A-Z_]*LAYOUTS?)\s*=/gm)) names.add(m[1]);
  return [...names];
}

// Checks one 22x10 layout; returns a list of problems (empty when fine).
function checkLayout(L) {
  const bad = [];
  if (L.length !== 10) return ['has ' + L.length + ' rows, expected 10'];
  L.forEach((r, y) => {
    if (r.length !== 22) bad.push('row ' + y + ' has ' + r.length + ' chars');
    const u = r.replace(/[.#b~epsg]/g, '');
    if (u) bad.push('row ' + y + ' has unknown "' + u + '"');
  });
  if (bad.length) return bad;
  const at = (x, y) => L[y][x];
  const lanes = { up: [[10, 0], [11, 0]], down: [[10, 9], [11, 9]], left: [[0, 4], [0, 5]], right: [[21, 4], [21, 5]] };
  for (const [d, cells] of Object.entries(lanes)) for (const [x, y] of cells) if (at(x, y) !== '.') bad.push(d + ' door lane blocked at ' + x + ',' + y);
  // players walk floor and enemy slots; breakables count only as a second pass
  const flood = (pass) => {
    const seen = new Uint8Array(220), q = [[10, 0]];
    seen[10] = 1;
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx > 21 || ny > 9 || seen[ny * 22 + nx] || !pass.includes(at(nx, ny))) continue;
        seen[ny * 22 + nx] = 1; q.push([nx, ny]);
      }
    }
    return seen;
  };
  const walk = flood('.e'), dig = flood('.ebg');
  for (const [d, cells] of Object.entries(lanes)) for (const [x, y] of cells) if (!walk[y * 22 + x]) bad.push(d + ' door unreachable');
  for (let y = 0; y < 10; y++) for (let x = 0; x < 22; x++) {
    const c = at(x, y), i = y * 22 + x;
    if (c === 'e' && !walk[i]) bad.push('enemy slot ' + x + ',' + y + (dig[i] ? ' only reachable by breaking' : ' sealed off'));
    if (c === '.' && !dig[i]) bad.push('sealed floor pocket at ' + x + ',' + y);
  }
  return bad;
}

// Finds every 22x10 layout inside a value (a layout, a list of them, or an object of them).
function layoutsIn(v, name, out) {
  if (Array.isArray(v) && v.length && v.every((r) => typeof r === 'string')) out.push([name, v]);
  else if (v && typeof v === 'object') for (const k of Object.keys(v)) layoutsIn(v[k], name + '[' + k + ']', out);
  return out;
}

async function layouts() {
  const b = await open();
  let fails = 0, n = 0;
  try {
    for (const name of layoutNames()) {
      const v = await b.ev('typeof ' + name + " === 'undefined' ? null : " + name);
      for (const [where, L] of layoutsIn(v, name, [])) {
        n++;
        const bad = checkLayout(L);
        if (bad.length) { fails++; console.log('✗ ' + where + '\n    ' + [...new Set(bad)].join('\n    ')); }
      }
    }
  } finally { b.close(); }
  console.log(n + ' layouts, ' + fails + ' with problems');
  process.exitCode = fails ? 1 : 0;
}

// ---------- sheet ----------
async function sheet(re = '.', zoom = 3) {
  const b = await open();
  try {
    const url = await b.ev(`(() => {
      const re = new RegExp(${JSON.stringify(re)}), seen = new Set(), names = Object.keys(SPR).filter(n => re.test(n)).sort()
        .filter(n => { const k = n.replace(/#\\d+$/, '').replace(/_[dus]\\d[a-z]?$/, '').replace(/(_p?(\\d+|move|tell|atk|stag|die))+$|@(beach|crystal)$/, ''); return !seen.has(k) && seen.add(k); });
      const Z = ${zoom}, pad = 6, lab = 10, W = ${zoom > 3 ? 4000 : 1200};
      let x = pad, y = pad, rowH = 0; const at = [];
      for (const n of names) {
        const s = SPR[n], w = Math.max(s.w * Z, n.length * 6), h = s.h * Z + lab;
        if (x + w > W) { x = pad; y += rowH + pad; rowH = 0; }
        at.push([n, x, y]); x += w + pad; rowH = Math.max(rowH, h);
      }
      const cv = document.createElement('canvas'); cv.width = W; cv.height = y + rowH + pad;
      const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      g.fillStyle = PAL.L; g.fillRect(0, 0, cv.width, cv.height);
      g.font = '9px monospace'; g.fillStyle = PAL['0'];
      for (const [n, x, y] of at) {
        const s = SPR[n];
        g.drawImage(ATLAS, s.x[0], s.y[0], s.w, s.h, x, y, s.w * Z, s.h * Z);
        g.fillText(n, x, y + s.h * Z + 8);
      }
      return names.length ? cv.toDataURL('image/png') : '';
    })()`);
    if (!url) { console.log('no sprite matches /' + re + '/'); return; }
    const file = path.join(OUT, 'sheet.png');
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log(file);
  } finally {
    const errs = b.realErrors();
    if (errs.length) console.log('✗ load errors:\n  ' + [...new Set(errs)].slice(0, 10).join('\n  '));
    b.close();
  }
}

// ---------- bot ----------
async function bot(land, floors = 3) {
  const b = await open();
  let failed = false;
  try {
    await b.ev(`(() => {
      Save.stats.runs = Math.max(5, Save.stats.runs || 0); Save.settings.sfx = 0; Save.settings.music = 0;
      startRun('adv', null, {});
      ${land ? `if (!LAND[${JSON.stringify(land)}]) throw new Error('no land ${land}');
      G.run.path = [${JSON.stringify(land)}].concat(roadPath().filter(id => id !== ${JSON.stringify(land)})); loadFloor(0);` : ''}
      MODALS.length = 0;
      window.__bot = { frames: [], last: performance.now() };
      (function tick() {
        const t = performance.now(); __bot.frames.push(t - __bot.last); __bot.last = t;
        for (const p of G.players) { p.inv = 9; p.hp = p.maxHp; }
        MODALS.length = 0;
        requestAnimationFrame(tick);
      })();
      return 1;
    })()`);
    for (let f = 0; f < floors; f++) {
      const info = await b.ev(`({ land: G.floor.land.id, depth: G.floor.depth, rooms: G.floor.rooms.length })`);
      const t0 = Date.now();
      for (let i = 0; i < info.rooms; i++) {
        const kind = await b.ev(`(() => { const r = G.floor.rooms[${i}]; if (r.type === 'boss') return 'later'; enterRoom(r, 'd'); return r.type; })()`);
        if (kind === 'later') continue;
        await clearRoom(b, i);
      }
      await b.ev(`enterRoom(G.floor.rooms.find(r => r.type === 'boss'), 'd'); 1`);
      await sleep(4000); // boss intro
      if (!(await clearRoom(b, -1, 60000))) { console.log('✗ boss not beaten on land ' + info.land); failed = true; break; }
      const shot = await b.shot('bot_' + f + '_' + info.land + '.png');
      const fr = await b.ev(`(() => { const a = __bot.frames.slice(10).sort((x, y) => x - y); __bot.frames.length = 0;
        return { p50: a[a.length >> 1], p99: a[Math.floor(a.length * 0.99)], max: a[a.length - 1] }; })()`);
      console.log('land ' + (info.depth + 1) + ' ' + info.land + ': ' + info.rooms + ' rooms in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s, frame ms p50 '
        + fr.p50.toFixed(1) + ' p99 ' + fr.p99.toFixed(1) + ' max ' + fr.max.toFixed(1) + '  ' + shot);
      if (f < floors - 1) { await sleep(1500); await b.ev(`G.nextLock = 0; nextFloor(); 1`); await sleep(2500); }
    }
  } finally {
    const errs = b.realErrors();
    if (errs.length) { failed = true; console.log('✗ errors:\n  ' + [...new Set(errs)].slice(0, 20).join('\n  ')); }
    b.close();
  }
  console.log(failed ? 'bot run failed' : 'bot run ok');
  process.exitCode = failed ? 1 : 0;
}
// Hits every foe until the room counts as cleared (waves and bosses included).
async function clearRoom(b, i, ms = 20000) {
  for (const end = Date.now() + ms; Date.now() < end;) {
    const done = await b.ev(`(() => {
      if (G.state !== 'play') setState('play');
      for (const e of G.enemies) if (!e.dead && !e.dying) hurtEnemy(e, 9999, e.x, e.y);
      return G.room.cleared && !G.enemies.some(e => !e.dead);
    })()`);
    if (done) return true;
    await sleep(250);
  }
  console.log('✗ room ' + i + ' did not clear');
  return false;
}

// ---------- room ----------
// Starts a run in the given land, enters its first normal room (or the room type named by
// the third argument), runs an optional expression, waits ms and saves a screenshot.
async function room(land, js = '', ms = 1500, type = 'normal') {
  const b = await open();
  try {
    await b.ev(`(() => {
      Save.stats.runs = Math.max(5, Save.stats.runs || 0); Save.settings.sfx = 0; Save.settings.music = 0;
      startRun('adv', null, {});
      G.run.path = [${JSON.stringify(land)}].concat(roadPath().filter(id => id !== ${JSON.stringify(land)})); loadFloor(0);
      MODALS.length = 0; enterRoom(G.floor.rooms.find(r => r.type === ${JSON.stringify(type)}), 'd');
      for (const p of G.players) p.inv = 99;
      return 1; })()`);
    await sleep(800);
    if (js) await b.ev(js);
    await sleep(ms);
    console.log(await b.shot('room_' + land + '.png'));
  } finally {
    const errs = b.realErrors();
    if (errs.length) console.log('✗ errors:\n  ' + [...new Set(errs)].slice(0, 10).join('\n  '));
    b.close();
  }
}

const [cmdName, ...args] = process.argv.slice(2);
if (cmdName === 'layouts') await layouts();
else if (cmdName === 'sheet') await sheet(args[0], +args[1] || 3);
else if (cmdName === 'bot') await bot(args[0] && args[0] !== '-' ? args[0] : null, +args[1] || 3);
else if (cmdName === 'room') await room(args[0] || 'meadow', args[1], +args[2] || 1500, args[3]);
else console.log('usage: node tools/dev.mjs layouts | sheet [regex] | bot [land] [floors] | room [land] [js] [ms] [type]');
