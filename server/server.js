'use strict';
// Star Garden's optional game server: one file, no dependencies, Node 18+.
//   node server/server.js            (PORT, DATA_DIR, ADMIN_KEY, TURN_URLS, TURN_USER, TURN_PASS,
//                                     GOAL_TARGET, PUSH_SUBJECT in the environment)
// The game works without it; with its address in live.json ("server") or in
// <meta name="sg-server"> it lights up: play stats, cloud save and transfer codes,
// leaderboards with friend codes, a weekly community goal, TURN credentials and
// "your seed has bloomed" reminders. Everything lives in DATA_DIR as JSON files.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = +process.env.PORT || 8787;
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const GOAL_TARGET = +process.env.GOAL_TARGET || 50000;
fs.mkdirSync(DIR, { recursive: true });

// ---------- Storage: one JSON file, written a moment after each change ----------
const DB_FILE = path.join(DIR, 'db.json');
const db = Object.assign({ users: {}, saves: {}, codes: {}, friends: {}, boards: {}, goals: {}, push: {}, counts: {} },
  fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : {});
let dirty = false;
const touch = () => { dirty = true; };
setInterval(() => {
  if (!dirty) return;
  dirty = false;
  fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db));
  fs.renameSync(DB_FILE + '.tmp', DB_FILE);
}, 2000).unref();

// ---------- Helpers ----------
const utcDay = (t) => new Date(t || Date.now()).toISOString().slice(0, 10);
function utcWeek(t) {
  const d = new Date(t || Date.now()); d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = d.getUTCFullYear(), w = Math.ceil(((d - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}
const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const ID_RE = /^[a-z2-9]{16}$/;
// the game's join-code alphabet: no 0/O or 1/I to mix up
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newCode(taken, n) {
  for (;;) { let c = ''; for (let i = 0; i < n; i++) c += CODE_ABC[crypto.randomInt(CODE_ABC.length)]; if (!taken[c]) return c; }
}
// Leaderboard names are made here from two kid-safe word lists, never typed by players.
const ADJ = ['BRAVE', 'HAPPY', 'SUNNY', 'LUCKY', 'MIGHTY', 'SWIFT', 'CLEVER', 'GENTLE', 'SPARKY', 'COSY', 'BOLD', 'MERRY', 'QUIET', 'JOLLY', 'TINY', 'COSMIC'];
const NOUN = ['FROG', 'SLIME', 'STAR', 'MOON', 'CRAB', 'BEE', 'SNAIL', 'OWL', 'FOX', 'MOTH', 'SEAL', 'BUNNY', 'COMET', 'PEBBLE', 'TULIP', 'GEM'];
function boardName(id) {
  const h = crypto.createHash('sha256').update(id).digest();
  return ADJ[h[0] % ADJ.length] + ' ' + NOUN[h[1] % NOUN.length] + ' ' + (h[2] % 90 + 10);
}
function friendCode(id) {
  for (const c in db.friends) if (db.friends[c] === id) return c;
  const c = newCode(db.friends, 6); db.friends[c] = id; touch(); return c;
}

// A small per-address budget, so one client cannot flood the server.
const buckets = new Map();
function allow(ip, cost) {
  const now = Date.now(), b = buckets.get(ip) || { n: 60, t: now };
  b.n = Math.min(60, b.n + (now - b.t) / 1000); b.t = now;
  if (b.n < cost) { buckets.set(ip, b); return false; }
  b.n -= cost; buckets.set(ip, b); return true;
}
setInterval(() => { const old = Date.now() - 120000; for (const [k, b] of buckets) if (b.t < old) buckets.delete(k); }, 60000).unref();

// ---------- Web push (payload-free, VAPID signed with the built-in crypto) ----------
const VAPID_FILE = path.join(DIR, 'vapid.json');
if (!fs.existsSync(VAPID_FILE)) {
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  fs.writeFileSync(VAPID_FILE, JSON.stringify(privateKey.export({ format: 'jwk' })));
}
const VAPID_JWK = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
const VAPID_KEY = crypto.createPrivateKey({ key: VAPID_JWK, format: 'jwk' });
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const VAPID_PUB = b64u(Buffer.concat([Buffer.from([4]), Buffer.from(VAPID_JWK.x, 'base64url'), Buffer.from(VAPID_JWK.y, 'base64url')]));
function sendPush(sub) {
  const u = new URL(sub.endpoint);
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud: u.origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: process.env.PUSH_SUBJECT || 'mailto:admin@example.com' }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key: VAPID_KEY, dsaEncoding: 'ieee-p1363' });
  return fetch(sub.endpoint, { method: 'POST', headers: { Authorization: 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + VAPID_PUB, TTL: '86400', Urgency: 'low' } })
    .then(r => r.status).catch(() => 0);
}
// Once a minute: remind whoever has a flower in bloom (at most one a day, never at night
// for them: the game sends its local hour offset).
setInterval(() => {
  const now = Date.now();
  for (const id in db.push) {
    const P = db.push[id];
    const due = (P.at || []).filter(t => t <= now);
    if (!due.length) continue;
    P.at = P.at.filter(t => t > now); touch();
    const hour = (new Date(now).getUTCHours() + 24 + (P.tz || 0)) % 24;
    if (hour < 9 || hour >= 21 || now - (P.last || 0) < 20 * 3600000) continue;
    P.last = now;
    sendPush(P.sub).then(s => { if (s === 404 || s === 410) { delete db.push[id]; touch(); } });
  }
}, 60000).unref();

// ---------- Routes ----------
const routes = {
  // Consented, anonymous play stats: { id, v, installed, touch, ev: [{ e, t, s, p }] }
  'POST /api/events'(b, ip) {
    if (!ID_RE.test(b.id) || !Array.isArray(b.ev)) return 400;
    const day = utcDay(), U = db.users[b.id] || (db.users[b.id] = { first: day, days: [], installed: false, touch: !!b.touch });
    if (U.days[U.days.length - 1] !== day) U.days.push(day);
    U.installed = U.installed || !!b.installed; U.v = String(b.v || '').slice(0, 12);
    const C = db.counts[day] || (db.counts[day] = {});
    const lines = [];
    for (const e of b.ev.slice(0, 100)) {
      if (!e || typeof e.e !== 'string') continue;
      const k = e.e.slice(0, 32); C[k] = (C[k] || 0) + 1;
      lines.push(JSON.stringify({ id: b.id, e: k, t: +e.t || 0, s: String(e.s || '').slice(0, 12), p: e.p }));
    }
    if (lines.length) fs.appendFile(path.join(DIR, 'events-' + day.slice(0, 7) + '.ndjson'), lines.join('\n') + '\n', () => {});
    touch();
    return {};
  },
  // Cloud save: the game backs its save up here; the transfer code brings it to a new device.
  'POST /api/save'(b) {
    if (!ID_RE.test(b.id) || !b.data || typeof b.data !== 'object') return 400;
    const S = db.saves[b.id] || (db.saves[b.id] = {});
    S.data = b.data; S.t = Date.now();
    if (!S.code) { S.code = newCode(db.codes, 8); db.codes[S.code] = b.id; }
    touch();
    return { code: S.code, t: S.t };
  },
  'GET /api/save'(q) {
    const id = db.codes[String(q.get('code') || '').toUpperCase()];
    const S = id && db.saves[id];
    return S ? { data: S.data, t: S.t } : 404;
  },
  // Leaderboards: { board: daily|weekly|arena|win, key, id, score }; the best score counts.
  'POST /api/score'(b) {
    if (!ID_RE.test(b.id) || !/^(daily|weekly|arena|win)$/.test(b.board) || !/^[\w-]{1,12}$/.test(b.key)) return 400;
    const s = Math.max(0, Math.min(1e7, Math.floor(+b.score || 0)));
    const B = db.boards[b.board + ':' + b.key] || (db.boards[b.board + ':' + b.key] = {});
    // lower is better for the fastest win
    const better = b.board === 'win' ? (x) => x < B[b.id] : (x) => x > B[b.id];
    if (B[b.id] === undefined || better(s)) { B[b.id] = s; touch(); }
    return { name: boardName(b.id), friend: friendCode(b.id) };
  },
  // ?board=&key=&id=[&friends=CODE,CODE]: the top ten, your place and the share you beat.
  'GET /api/board'(q) {
    const board = q.get('board'), B = db.boards[board + ':' + q.get('key')] || {}, id = q.get('id') || '';
    let ids = Object.keys(B);
    const fr = String(q.get('friends') || '').toUpperCase().split(',').map(c => db.friends[c]).filter(Boolean);
    if (q.get('friends') !== null) ids = ids.filter(i => i === id || fr.includes(i));
    const asc = board === 'win';
    ids.sort((a, b) => (asc ? B[a] - B[b] : B[b] - B[a]));
    const rank = ids.indexOf(id);
    return {
      top: ids.slice(0, 10).map(i => ({ n: boardName(i), s: B[i], me: i === id })),
      rank: rank >= 0 ? rank + 1 : 0, n: ids.length,
      beat: rank >= 0 && ids.length > 1 ? Math.round((ids.length - 1 - rank) / (ids.length - 1) * 100) : 0,
      me: ID_RE.test(id) ? { name: boardName(id), friend: friendCode(id) } : null,
    };
  },
  // The weekly community goal: everyone's defeated foes add up.
  'GET /api/goal'() {
    const k = utcWeek(), G = db.goals[k] || { now: 0 };
    return { id: k, target: GOAL_TARGET, now: G.now };
  },
  'POST /api/goal'(b, ip) {
    if (!allow('g' + ip, 20)) return 429;
    const k = utcWeek(), G = db.goals[k] || (db.goals[k] = { now: 0 });
    G.now += Math.max(0, Math.min(2000, Math.floor(+b.kills || 0))); touch();
    return { id: k, target: GOAL_TARGET, now: G.now };
  },
  // TURN credentials for co-op links that cannot connect directly.
  'GET /api/ice'() {
    const urls = (process.env.TURN_URLS || '').split(',').filter(Boolean);
    return urls.length ? [{ urls, username: process.env.TURN_USER || '', credential: process.env.TURN_PASS || '' }] : [];
  },
  'GET /api/push-key'() { return { key: VAPID_PUB }; },
  // { id, sub (PushSubscription JSON), at: [bloom times], tz: hours from UTC } or { id, off: true }
  'POST /api/push'(b) {
    if (!ID_RE.test(b.id)) return 400;
    if (b.off) { delete db.push[b.id]; touch(); return {}; }
    const sub = b.sub || (db.push[b.id] && db.push[b.id].sub);
    if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint)) return 400;
    const now = Date.now();
    db.push[b.id] = { sub, at: (Array.isArray(b.at) ? b.at : []).map(Number).filter(t => t > now && t < now + 8 * 86400000).slice(0, 8),
      tz: Math.max(-12, Math.min(14, Math.round(+b.tz || 0))), last: db.push[b.id] ? db.push[b.id].last : 0 };
    touch();
    return {};
  },
};

// ---------- The retention dashboard: /admin?key=ADMIN_KEY ----------
function dashboard() {
  const cohorts = {};
  for (const id in db.users) {
    const U = db.users[id], C = cohorts[U.first] || (cohorts[U.first] = { n: 0, d1: 0, d7: 0, d30: 0, inst: 0 });
    C.n++; if (U.installed) C.inst++;
    const rel = new Set(U.days.map(d => dayDiff(U.first, d)));
    if (rel.has(1)) C.d1++; if (rel.has(7)) C.d7++; if (rel.has(30)) C.d30++;
  }
  const today = utcDay(), pct = (a, n, age, d) => (age < d ? '' : n ? Math.round(a / n * 100) + '%' : '-');
  const rows = Object.keys(cohorts).sort().reverse().slice(0, 60).map(d => {
    const C = cohorts[d], age = dayDiff(d, today);
    return `<tr><td>${d}</td><td>${C.n}</td><td>${C.inst}</td><td>${pct(C.d1, C.n, age, 1)}</td><td>${pct(C.d7, C.n, age, 7)}</td><td>${pct(C.d30, C.n, age, 30)}</td></tr>`;
  }).join('');
  const days = Object.keys(db.counts).sort().slice(-7), evs = [...new Set(days.flatMap(d => Object.keys(db.counts[d])))].sort();
  const evRows = evs.map(e => `<tr><td>${e}</td>${days.map(d => `<td>${db.counts[d][e] || ''}</td>`).join('')}</tr>`).join('');
  const k = utcWeek(), goal = db.goals[k] || { now: 0 };
  return `<!doctype html><meta charset="utf-8"><title>Star Garden</title><style>body{font:14px system-ui;margin:24px;color:#222;background:#fff}table{border-collapse:collapse;margin:12px 0 28px}td,th{border:1px solid #ccc;padding:4px 10px;text-align:right}td:first-child,th:first-child{text-align:left}</style>
<h1>Star Garden</h1><p>${Object.keys(db.users).length} players · ${Object.keys(db.saves).length} cloud saves · ${Object.keys(db.push).length} reminders · goal ${k}: ${goal.now} / ${GOAL_TARGET}</p>
<h2>Retention by first day</h2><table><tr><th>cohort</th><th>players</th><th>installed</th><th>D1</th><th>D7</th><th>D30</th></tr>${rows}</table>
<h2>Events, last 7 days</h2><table><tr><th>event</th>${days.map(d => `<th>${d.slice(5)}</th>`).join('')}</tr>${evRows}</table>`;
}

// ---------- HTTP ----------
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'), key = req.method + ' ' + u.pathname;
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  const out = (code, obj, type) => { res.writeHead(code, { 'Content-Type': type || 'application/json' }); res.end(type ? obj : JSON.stringify(obj)); };
  if (req.method === 'OPTIONS') return out(204, '', 'text/plain');
  if (u.pathname === '/admin') return ADMIN_KEY && u.searchParams.get('key') === ADMIN_KEY ? out(200, dashboard(), 'text/html; charset=utf-8') : out(403, 'no', 'text/plain');
  const fn = routes[key];
  if (!fn) return out(404, { error: 'not found' });
  if (!allow(ip, 1)) return out(429, { error: 'slow down' });
  const reply = (r) => (typeof r === 'number' ? out(r, { error: r }) : out(200, r));
  if (req.method === 'GET') return reply(fn(u.searchParams, ip));
  const max = u.pathname === '/api/save' ? 1 << 20 : 64 << 10;
  let size = 0; const parts = [];
  req.on('data', (c) => { size += c.length; if (size > max) req.destroy(); else parts.push(c); });
  req.on('end', () => {
    let b;
    try { b = JSON.parse(Buffer.concat(parts).toString('utf8')); } catch (e) { return out(400, { error: 'bad json' }); }
    if (!b || typeof b !== 'object') return out(400, { error: 'bad body' });
    try { reply(fn(b, ip)); } catch (e) { out(500, { error: 'server' }); }
  });
}).listen(PORT, () => console.log('Star Garden server on :' + PORT));
