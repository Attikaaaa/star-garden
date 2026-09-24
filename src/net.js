'use strict';
// Online co-op for up to four heroes.
//
// The host's browser runs the whole game; every other player is a client. Clients move
// their own hero (so it feels instant) and send their controls; the host sends back
// snapshots of the world ~30 times a second, plus reliable events (rooms, floors, the
// end of a run).
//
// There is no server of our own. Players meet through free, always-on public MQTT
// brokers (three independent providers, no account needed): the host listens on the
// topic of its 5-letter code, and a client joins by writing to it. The game starts
// talking through the broker right away, so joining works on any network; then the two
// browsers try to open a direct WebRTC link (the offer / answer travel through the
// broker too) and switch to it when it works, which is faster. If the direct link ever
// drops, the messages simply go through the broker again.

const NET_PROTO = 2;
const NET_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I mix-ups
const NET_RELAYS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt', 'wss://broker.emqx.io:8084/mqtt'];
const NET_TOPIC = 'stargarden/' + NET_PROTO + '/';
// STUN finds each browser's public address so they can reach each other directly.
const NET_ICE = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
];
const NET_MAX = 4, NET_RATE = 1 / 30;
const NET = {
  role: null, code: '', status: '', err: '', q: [],
  peers: [],   // host: one link per client { pid, cid, ri, r, u, pc, wand, up, heard, ... }
  host: null,  // client: the link to the host
  relays: [],  // host: one broker connection per relay
  me: 0, lobby: { mode: 'adv', diff: 1, players: [] }, sendT: 0, fx: [], sig: '', sigT: 0, heard: 0,
};
function netRandom(n, abc) { let s = ''; for (let i = 0; i < n; i++) s += abc[Math.floor(Math.random() * abc.length)]; return s; }
const RND_ID = 'abcdefghijklmnopqrstuvwxyz0123456789';

// ---------- Links ----------
// A link sends through its direct WebRTC channels when they are open ('r' reliable and
// ordered, 'u' drops late packets), otherwise through the broker.
const direct = (L) => L && L.r && L.r.readyState === 'open' && L.u && L.u.readyState === 'open';
function sendR(L, msg) {
  if (!L) return;
  if (direct(L)) L.r.send(JSON.stringify(msg));
  else if (L.send) L.send(JSON.stringify(msg));
}
function sendU(L, msg) {
  if (!L) return;
  if (direct(L)) { if (L.u.bufferedAmount < 64000) L.u.send(JSON.stringify(msg)); } // a slow link skips one
  else if (L.send) L.send(JSON.stringify(msg));
}
function closeLink(L) {
  if (!L) return;
  clearTimeout(L.helloT);
  if (L.own) L.own.close();
  try { L.r && L.r.close(); L.u && L.u.close(); L.pc && L.pc.close(); } catch (e) { /* already closed */ }
  L.r = L.u = L.pc = null;
}
function listen(L, ch) {
  if (ch.label === 'r') L.r = ch; else L.u = ch;
  ch.onmessage = (m) => { let d; try { d = JSON.parse(m.data); } catch (e) { return; } NET.q.push([L, d]); };
}
// Wait until the browser has found its network addresses, so they travel inside the offer
// / answer itself.
function gathered(pc) {
  return new Promise(res => {
    if (pc.iceGatheringState === 'complete') return res();
    const t = setTimeout(res, 2500);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
  });
}

// ---------- MQTT: a tiny 3.1.1 client (QoS 0 over a WebSocket) ----------
const _te = new TextEncoder(), _td = new TextDecoder();
function mqPacket(head, parts) {
  let len = 0;
  for (const p of parts) len += p.length;
  const v = [];
  let n = len;
  do { let d = n % 128; n = Math.floor(n / 128); if (n) d |= 128; v.push(d); } while (n);
  const out = new Uint8Array(1 + v.length + len);
  out[0] = head; out.set(v, 1);
  let o = 1 + v.length;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
function mqStr(str) { const e = _te.encode(str), o = new Uint8Array(e.length + 2); o[0] = e.length >> 8; o[1] = e.length & 255; o.set(e, 2); return o; }
// onState(true) once connected and subscribed, onState(false) when the link is gone.
function mqttOpen(url, topic, onMsg, onState) {
  const M = { up: false, closed: false, pub: () => {}, close: () => {} };
  let buf = new Uint8Array(0), ping = 0, ws;
  try { ws = new WebSocket(url, 'mqtt'); } catch (e) { setTimeout(() => onState(false), 0); return M; }
  ws.binaryType = 'arraybuffer';
  const fail = setTimeout(() => { if (!M.up) ws.close(); }, 6000);
  ws.onopen = () => ws.send(mqPacket(0x10, [mqStr('MQTT'), new Uint8Array([4, 2, 0, 30]), mqStr('sg' + netRandom(14, RND_ID))]));
  ws.onmessage = (m) => {
    const d = new Uint8Array(m.data), b = new Uint8Array(buf.length + d.length);
    b.set(buf); b.set(d, buf.length);
    let o = 0;
    for (;;) {
      if (b.length - o < 2) break;
      let len = 0, mul = 1, i = o + 1, c = 128;
      while (c & 128) { if (i >= b.length) { i = -1; break; } c = b[i++]; len += (c & 127) * mul; mul *= 128; }
      if (i < 0 || b.length < i + len) break;
      const type = b[o] >> 4, body = b.subarray(i, i + len);
      o = i + len;
      if (type === 2) {
        if (body[1] !== 0) { ws.close(); break; }
        ws.send(mqPacket(0x82, [new Uint8Array([0, 1]), mqStr(topic), new Uint8Array([0])]));
        ping = setInterval(() => { if (ws.readyState === 1) ws.send(new Uint8Array([0xc0, 0])); }, 20000);
      } else if (type === 9) { clearTimeout(fail); M.up = true; onState(true); }
      else if (type === 3) { const tl = (body[0] << 8) | body[1]; onMsg(_td.decode(body.subarray(2 + tl))); }
    }
    buf = b.slice(o);
  };
  ws.onerror = () => {};
  ws.onclose = () => { clearTimeout(fail); clearInterval(ping); M.up = false; if (!M.closed) onState(false); };
  M.pub = (t, str) => { if (M.up && ws.readyState === 1 && ws.bufferedAmount < 200000) ws.send(mqPacket(0x30, [mqStr(t), _te.encode(str)])); };
  M.close = () => { M.closed = true; M.up = false; clearTimeout(fail); clearInterval(ping); try { if (ws.readyState === 1) ws.send(new Uint8Array([0xe0, 0])); ws.close(); } catch (e) { /* */ } };
  return M;
}

// ---------- Hosting ----------
function netHost() {
  netReset();
  NET.role = 'host'; NET.me = 0; NET.status = 'CREATING A GAME...'; NET.err = '';
  NET.lobby = { mode: 'adv', diff: Save.settings.diff, players: [] };
  NET.code = netRandom(5, NET_ALPHA);
  hostRelays();
  NET.slowT = setTimeout(() => { if (NET.role === 'host' && NET.status) NET.status = 'NO CONNECTION. RETRYING...'; }, 8000);
  setState('lobby');
}
// Listen for clients on every broker, and come back when one drops.
function hostRelays() {
  for (const M of NET.relays) if (M) M.close();
  NET.relays = NET_RELAYS.map((u, i) => hostRelay(i));
}
function hostRelay(i) {
  const code = NET.code, base = NET_TOPIC + code;
  const M = mqttOpen(NET_RELAYS[i], base + '/h', (payload) => {
    let d;
    try { d = JSON.parse(payload); } catch (e) { return; }
    if (!d || typeof d.f !== 'string' || !d.m) return;
    let L = NET.peers.find(q => q.cid === d.f);
    if (!L) {
      if (d.m.t !== 'hello' || NET.peers.length >= 8) return;
      const topic = base + '/c/' + d.f;
      L = { cid: d.f, ri: i, pid: -1, open: true, heard: performance.now() };
      L.send = (str) => { const R = NET.relays[L.ri]; if (R) R.pub(topic, str); };
      NET.peers.push(L);
    }
    L.ri = i; // answer on the broker the client uses
    NET.q.push([L, d.m]);
  }, (up) => {
    if (up) { if (NET.status && NET.role === 'host') { NET.status = ''; netLobbySync(); } return; }
    if (NET.role === 'host' && NET.code === code && NET.relays[i] === M) setTimeout(() => { if (NET.role === 'host' && NET.code === code && NET.relays[i] === M) NET.relays[i] = hostRelay(i); }, 3000);
  });
  return M;
}
// A client offers a direct link: answer it (through the broker).
function hostOffer(L, m) {
  if (L.pc) { try { L.pc.close(); } catch (e) { /* */ } }
  const pc = L.pc = new RTCPeerConnection({ iceServers: NET_ICE });
  pc.ondatachannel = (e) => listen(L, e.channel);
  pc.setRemoteDescription(m.sdp)
    .then(() => pc.createAnswer()).then(a => pc.setLocalDescription(a))
    .then(() => gathered(pc))
    .then(() => { if (L.pc === pc) sendR(L, { t: 'answer', sdp: pc.localDescription }); })
    .catch(() => {});
}
// Back from the background (after sharing the code in another app): broker links may have
// died quietly, so open fresh ones.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { NET.hiddenAt = performance.now(); return; }
  if (performance.now() - (NET.hiddenAt || 0) < 3000) return;
  if (NET.role === 'host') hostRelays();
  else if (NET.role === 'client' && NET.host && NET.host.reconnect) NET.host.reconnect();
});
function hostDrop(L, why) {
  const i = NET.peers.indexOf(L);
  if (i < 0) return;
  NET.peers.splice(i, 1);
  closeLink(L);
  if (L.pid < 0) return;
  if (why !== 'quiet') toast(L.name + ' LEFT THE GAME');
  if (G.players.length && NET.playing) {
    const p = G.players.find(q => q.pid === L.pid);
    if (p) { poof(p.x, p.y - 8); G.players.splice(G.players.indexOf(p), 1); flowKey = -1; }
  }
  netLobbySync();
}
function hostMessage(L, m) {
  L.heard = performance.now();
  if (m.t === 'hello') {
    if (L.pid >= 0) { sendR(L, { t: 'hi', pid: L.pid }); netLobbySync(); return; } // our answer got lost
    if (m.v !== NET_PROTO) { sendR(L, { t: 'no', why: 'PLEASE RELOAD THE PAGE: NEW VERSION' }); return; }
    if (NET.playing) { sendR(L, { t: 'no', why: 'THAT GAME HAS ALREADY STARTED' }); return; }
    const used = new Set(NET.peers.map(q => q.pid));
    let pid = 1;
    while (used.has(pid)) pid++;
    if (pid >= NET_MAX) { sendR(L, { t: 'no', why: 'THAT GAME IS FULL' }); return; }
    L.pid = pid; L.wand = WANDS[m.wand] ? m.wand : 'wand'; L.up = m.up || {};
    netWho(L, m);
    sendR(L, { t: 'hi', pid });
    Audio_.sfx('ready');
    toast(L.name + ' JOINED!');
    netLobbySync();
  } else if (m.t === 'me') {
    if (WANDS[m.wand]) L.wand = m.wand;
    netWho(L, m);
    netLobbySync();
  }
  else if (m.t === 'in') {
    const p = G.players.find(q => q.pid === L.pid);
    if (p && p.remote) hostInput(p, L, m);
  } else if (m.t === 'offer') hostOffer(L, m);
  else if (m.t === 'resync' && L.pid >= 0) hostResync(L, m);
  else if (m.t === 'bye') hostDrop(L, 'left');
}
// A client missed something (a lost message on a broker): send it the whole picture again.
function hostResync(L, m) {
  const now = performance.now();
  if (now - (L.syncT || 0) < 900 || !NET.playing || !G.floor) return;
  L.syncT = now;
  if (m.need === 'start') sendR(L, startMsg());
  sendR(L, floorMsg());
  sendR(L, roomFullMsg());
  if (G.state === 'over' || G.state === 'win') sendR(L, stateMsg(G.state));
}
// A client's controls and its hero's position.
function hostInput(p, L, m) {
  const I = p.in;
  I.mx = m.mx; I.my = m.my; I.ax = m.ax; I.ay = m.ay; I.aim = m.aim; I.pad = m.pad;
  if (m.tp === p.tpN && !p.down && !p.dead) {
    p.x = m.x; p.y = m.y; p.face = m.face; p.flip = m.flip; p.moving = m.mv; p.walkT = m.wt; p.dx = m.dx; p.dy = m.dy;
    if (m.dn !== L.dn) { if (L.dn !== undefined) { p.dashT = 0.2; p.inv = Math.max(p.inv, 0.28); p.dashCool = p.dashCd; } }
  }
  // presses travel as counters, so a lost packet never loses a button press
  if (L.dn !== undefined) {
    if (m.sn !== L.sn) I.star = true;
    if (m.un !== L.un) I.use = true;
    if (m.bn !== L.bn) I.belt = m.bs;
  }
  L.dn = m.dn; L.sn = m.sn; L.un = m.un; L.bn = m.bn;
}
// A player's chosen name and robe (sanitised: the pixel font's letters, 8 at most).
const NAME_ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const cleanName = (n) => String(n || '').toUpperCase().split('').filter(c => NAME_ABC.includes(c)).join('').slice(0, 8);
function netWho(L, m) {
  // two heroes with the same name get a number, so everyone can tell them apart
  const base = cleanName(m.name) || 'P' + (L.pid + 1);
  const taken = (n) => n === Save.name || NET.peers.some(q => q !== L && q.pid >= 0 && q.name === n);
  let name = base, k = 2;
  while (taken(name)) name = base.slice(0, 7) + k++;
  L.name = name;
  L.skin = m.skin >= 0 && m.skin < ROBES.length ? m.skin | 0 : L.pid % ROBES.length;
  L.cos = m.cos && typeof m.cos === 'object' ? m.cos : undefined;
}
// Cosmetics (pet, trail, title) when the game has them (defined in another file).
const myCos = () => (typeof myCosmetics === 'function' ? myCosmetics() : undefined);
function netClearPresses() {
  for (const p of G.players) if (p.remote) { p.in.star = false; p.in.use = false; p.in.belt = -1; }
}
function netRoster() {
  return [{ pid: 0, wand: Save.wand, up: Save.up, name: Save.name, skin: Save.skin }]
    .concat(NET.peers.filter(L => L.pid >= 0 && L.open).map(L => ({ pid: L.pid, wand: L.wand, up: L.up, name: L.name, skin: L.skin, cos: L.cos, remote: true })));
}
function netLobbySync() {
  if (NET.role !== 'host') return;
  NET.lobby.players = netRoster().map(r => ({ pid: r.pid, wand: r.wand, name: r.name, skin: r.skin }));
  const msg = { t: 'lobby', code: NET.code, mode: NET.lobby.mode, diff: NET.lobby.diff, players: NET.lobby.players };
  for (const L of NET.peers) if (L.pid >= 0) sendR(L, msg);
}
const hostAll = (msg) => { for (const L of NET.peers) if (L.pid >= 0) sendR(L, msg); };

// ---------- Host → clients: the world ----------
const PF = ['pid', 'x', 'y', 'face', 'flip', 'moving', 'walkT', 'dashT', 'inv', 'hurtT', 'hp', 'maxHp', 'charge', 'shieldUp',
  'down', 'dead', 'deadT', 'revive', 'belt', 'beltMax', 'buff', 'tpN', 'kills', 'sayMsg', 'sayT', 'orbitals', 'items',
  'speed', 'dashCd', 'wand', 'shots', 'fireDelay', 'dmg', 'range', 'luck', 'idleT', 'backshot', 'name', 'skin']
  .concat(typeof PF_EXTRA !== 'undefined' ? PF_EXTRA : []);
const EF = ['id', 'type', 'x', 'y', 'z', 'state', 'anim', 'flip', 'flash', 'spawnT', 'ghost', 'elite', 'color', 't', 'n', 'w',
  'hp', 'maxHp', 'sw', 'h', 'r', 'fly', 'boss', 'passive', 'still']
  .concat(typeof EF_EXTRA !== 'undefined' ? EF_EXTRA : []);
const SF = ['x', 'y', 'vx', 'vy', 'kind', 'tint', 'big', 'mini', 't', 'ret', 'trail', 'fw', 'r'];
const BF = ['x', 'y', 'vx', 'vy', 'key', 'r'];
const KF = ['type', 'x', 'y', 'z', 't', 'pot'];
const r1 = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v);
function pack(o, F) { const a = new Array(F.length); for (let i = 0; i < F.length; i++) { const v = o[F[i]]; a[i] = v === undefined ? null : r1(v); } return a; }
function unpack(a, F, o) { for (let i = 0; i < F.length; i++) o[F[i]] = a[i]; return o; }
let _rev = null;
function sprName(s) {
  if (!_rev) { _rev = new Map(); for (const k in SPR) _rev.set(SPR[k], k); }
  return _rev.get(s);
}

const startMsg = () => ({ t: 'start', mode: G.mode, diff: G.diff, roster: G.players.map(p => ({ pid: p.pid, wand: p.wand, name: p.name, skin: p.skin, cos: p.pid === 0 ? myCos() : (NET.peers.find(L => L.pid === p.pid) || {}).cos })) });
function netStartRun() {
  NET.playing = true;
  hostAll(startMsg());
}
function floorMsg() {
  const rooms = G.floor.rooms;
  return {
    t: 'floor', depth: G.floor.depth, land: LANDS.indexOf(G.floor.land),
    rooms: rooms.map(r => { const d = {}; for (const k in r.doors) d[k] = rooms.indexOf(r.doors[k]); return [r.gx, r.gy, r.type, d]; }),
  };
}
function netFloor() { if (NET.role === 'host') hostAll(floorMsg()); }
function roomMsg(room) {
  const rooms = G.floor.rooms;
  return {
    i: rooms.indexOf(room), tiles: Array.from(room.tiles).join(''), pits: room.pits, seed: room.seed,
    sv: rooms.map(r => (r.seen ? 1 : 0) + (r.visited ? 2 : 0)).join(''),
  };
}
const roomFullMsg = () => Object.assign({ t: 'room', props: G.room.props, pickups: G.room.pickups.map(k => pack(k, KF)) }, roomMsg(G.room));
function netRoom() {
  if (NET.role !== 'host') return;
  hostAll(roomFullMsg());
  NET.sig = '';
}
function netTrans(dir) { hostAll(Object.assign({ t: 'trans', dir }, roomMsg(G.room.doors[dir]))); }
const stateMsg = (s) => ({ t: 'state', s, record: G.record, stats: G.stats, won: G.won, wave: G.arena && G.arena.wave, depth: G.floor && G.floor.depth, kills: G.players.map(p => [p.pid, p.kills]), tv: G.run.team || 0 });
function netState(s) { if (NET.role === 'host') hostAll(stateMsg(s)); }
function netTell(pid, k, a) {
  const L = NET.peers.find(q => q.pid === pid);
  if (L) sendR(L, { t: 'you', k, a });
}
// Shared effects: vault bonuses go out reliably, the rest rides along with the next snapshot.
function netFx(kind, a, b) {
  if (NET.role !== 'host' || !G.players.length) return;
  if (kind === 'vault') G.run.team = (G.run.team || 0) + a; // clients read the running total from snapshots
  else if (kind === 'tile') hostAll({ t: 'tile', c: a, r: b });
  else if (NET.fx.length < 300) NET.fx.push([kind, a]);
}
// Record the host's particle bursts, sounds and toasts so every screen shows them.
(function wrapFx() {
  const live = () => NET.role === 'host' && G.players.length && (G.state === 'play' || G.state === 'pause' || G.state === 'settings');
  const rec = (a) => { if (live() && NET.fx.length < 300) NET.fx.push(a); };
  const _burst = burst, _poof = poof, _dust = dust, _sfx = Audio_.sfx, _play = Audio_.play, _stop = Audio_.stop, _toast = toast, _brk = breakTile;
  burst = (x, y, n, keys, speed, life, opts) => { _burst(x, y, n, keys, speed, life, opts); rec(['b', r1(x), r1(y), n, keys, speed, life, opts || 0]); };
  poof = (x, y) => { _poof(x, y); rec(['p', r1(x), r1(y)]); };
  dust = (x, y, n, w) => { _dust(x, y, n, w); rec(['d', r1(x), r1(y), n, w]); };
  Audio_.sfx = (name) => { _sfx(name); if (name !== 'select' && name !== 'confirm') rec(['s', name]); };
  Audio_.play = (song) => { NET.song = song; _play(song); rec(['m', song]); };
  Audio_.stop = () => { NET.song = null; _stop(); rec(['m', null]); };
  toast = (msg) => { _toast(msg); rec(['t', msg]); };
  breakTile = (room, c, r) => { _brk(room, c, r); netFx('tile', c, r); };
})();
const tileSum = (room) => { let h = 0; for (let i = 0; i < room.tiles.length; i++) h = (h * 7 + room.tiles[i]) % 1000003; return h; };
function propsSig() {
  let s = '';
  for (const o of G.room.props) s += o.kind + (o.item || '') + (o.open ? 1 : 0) + (o.took ? o.took.join('') : '') + (o.say ? o.say.msg : '') + (o.price || '') + '|';
  return s;
}
function netHostTick(dt) {
  if (NET.role !== 'host') return;
  const now = performance.now();
  for (const L of NET.peers.slice()) if (now - L.heard > 15000) hostDrop(L, 'left');
  if ((NET.sendT += dt) < NET_RATE) return;
  NET.sendT = 0;
  const room = G.room, A = G.arena;
  const snap = {
    t: 's',
    P: G.players.map(p => pack(p, PF)),
    E: G.enemies.filter(e => !e.dead).map(e => pack(e, EF)),
    S: SHOTS.map(s => pack(s, SF)),
    B: EBULLETS.filter(b => b.life > 0).map(b => pack(b, BF)),
    K: room.pickups.map(k => pack(k, KF)),
    M: G.markers.map(m => [r1(m.x), r1(m.y), r1(m.t), m.max]),
    H: G.hazards.map(h => [r1(h.x), r1(h.y), r1(h.life)]),
    T: G.turrets.map(t => [r1(t.x), r1(t.y), r1(t.life), r1(t.flash)]),
    L: BOLTS.map(b => [b.x0, b.y0, b.x1, b.y1, b.mx, b.my, b.t].map(r1)),
    g: {
      coins: G.coins, doorT: r1(room.doorT), cleared: room.cleared, boss: G.boss && !G.boss.dead ? G.boss.id : 0,
      cine: G.cine ? r1(G.cine.t) : -1, combo: G.combo, pop: G.comboPop, fall: G.fall ? { t: G.fall.t, drops: G.fall.drops } : null,
      corpse: G.corpse ? { k: sprName(G.corpse.s), x: G.corpse.x, y: G.corpse.y, w: G.corpse.w, h: G.corpse.h, flip: G.corpse.flip, t: G.corpse.t } : null,
      arena: A ? { wave: A.wave, phase: A.phase, t: r1(A.t), left: A.left } : null,
      shake: r1(G.shake), flash: r1(G.flashT), stats: G.stats, song: NET.song,
      banner: G.banner && !G.banner.icon ? G.banner : null, floorBanner: G.floorBanner, trans: !!G.trans,
      ri: G.floor.rooms.indexOf(room), fd: G.floor.depth, tv: G.run.team || 0, th: tileSum(room),
    },
    fx: NET.fx,
  };
  const sig = propsSig();
  if (sig !== NET.sig || (NET.sigT += NET_RATE) > 1) { snap.props = room.props; NET.sig = sig; NET.sigT = 0; }
  const str = JSON.stringify(snap), fx = NET.fx, hadProps = !!snap.props;
  NET.fx = [];
  for (const L of NET.peers) {
    if (L.pid < 0) continue;
    if (direct(L)) { if (L.u.bufferedAmount < 64000) L.u.send(str); L.fxq = []; continue; }
    if (!L.send) continue;
    // relays get half as many snapshots, carrying the effects and props of both
    L.fxq = (L.fxq || []).concat(fx);
    if (snap.props) L.propsDue = true;
    if ((L.skip = !L.skip)) continue;
    snap.fx = L.fxq.slice(-300);
    if (L.propsDue) snap.props = room.props;
    L.send(JSON.stringify(snap));
    L.fxq = []; L.propsDue = false; snap.fx = fx;
    if (!hadProps) delete snap.props;
  }
}

// ---------- Joining ----------
// Try the brokers in turn until the host answers on one; then offer a direct link.
function netJoin(code) {
  netReset();
  NET.role = 'client'; NET.code = code; NET.status = 'CONNECTING...'; NET.err = '';
  NET.joinT = performance.now(); NET.linked = false;
  joinVia(code, 0, 'c' + netRandom(12, RND_ID));
}
function joinFail(why) { if (NET.role === 'client' && !NET.linked) { NET.err = why; NET.status = ''; netReset(); NET.role = null; } }
function joinVia(code, i, cid) {
  if (NET.role !== 'client' || NET.linked) return;
  if (i >= NET_RELAYS.length) { joinFail(NET.reached ? 'NO GAME WITH THIS CODE' : 'NO CONNECTION. CHECK YOUR INTERNET'); return; }
  const old = NET.host;
  NET.host = null;
  if (old && old.own) old.own.close();
  const hostT = NET_TOPIC + code + '/h', inbox = NET_TOPIC + code + '/c/' + cid;
  const L = { cid, ri: i, open: true };
  L.send = (str) => { if (L.own) L.own.pub(hostT, '{"f":"' + cid + '","m":' + str + '}'); };
  const connect = () => {
    if (L.own) L.own.close();
    L.own = mqttOpen(NET_RELAYS[i], inbox, (payload) => { let m; try { m = JSON.parse(payload); } catch (e) { return; } NET.q.push([L, m]); }, (up) => {
      if (NET.host !== L) return;
      if (up) {
        NET.reached = true;
        if (NET.linked) { sendR(L, { t: 'ping' }); return; } // back after a drop: the host still knows us
        sendR(L, { t: 'hello', v: NET_PROTO, wand: Save.wand, up: Save.up, name: Save.name, skin: Save.skin, cos: myCos() });
        clearTimeout(L.helloT);
        L.helloT = setTimeout(() => { if (NET.host === L && !NET.linked) joinVia(code, i + 1, cid); }, 5000);
      } else if (NET.linked) setTimeout(() => { if (NET.host === L && !(L.own && L.own.up)) connect(); }, 1500); // keep the game going
      else joinVia(code, i + 1, cid);
    });
  };
  L.reconnect = connect;
  NET.host = L;
  connect();
}
// After joining: try a direct link; the game keeps running through the broker meanwhile.
function clientUpgrade(L) {
  if (L.pc) return;
  const pc = L.pc = new RTCPeerConnection({ iceServers: NET_ICE });
  listen(L, pc.createDataChannel('r', { ordered: true }));
  listen(L, pc.createDataChannel('u', { ordered: false, maxRetransmits: 0 }));
  pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed' && L.pc === pc) { L.pc = null; L.r = L.u = null; } };
  pc.createOffer().then(o => pc.setLocalDescription(o))
    .then(() => gathered(pc))
    .then(() => { if (L.pc === pc) sendR(L, { t: 'offer', sdp: pc.localDescription }); })
    .catch(() => {});
}
function clientLost(why) {
  if (NET.role !== 'client') return;
  netReset(); NET.role = null;
  G.players = []; G.player = null;
  wipe(() => { setState('title'); toast(why); });
}
function netReset() {
  for (const L of NET.peers) closeLink(L);
  NET.peers = []; closeLink(NET.host); NET.host = null;
  for (const M of NET.relays) if (M) M.close();
  clearTimeout(NET.slowT);
  NET.relays = []; NET.linked = false; NET.reached = false;
  NET.q = []; NET.fx = []; NET.status = ''; NET.sendT = 0; NET.song = null; NET.playing = false; NET.heard = 0;
}
// Leave or end the game (host: everyone goes back to the title).
function netLeave() {
  if (NET.role === 'host') hostAll({ t: 'bye' });
  else if (NET.role === 'client') sendR(NET.host, { t: 'bye' });
  const was = NET.role;
  setTimeout(netReset, 150);
  NET.role = null;
  G.players = G.players.filter(p => !p.remote);
  if (was) wipe(() => setState('title'));
}

// Keep-alive, also while a tab is in the background (a phone switching apps for a moment).
setInterval(() => {
  if (NET.role === 'host') hostAll({ t: 'ping' });
  else if (NET.role === 'client' && NET.host) sendR(NET.host, { t: 'ping' });
}, 2000);

// ---------- Client: applying the host's world ----------
function netPoll() {
  if (!NET.role) return;
  const now = performance.now();
  if (NET.role === 'client' && !NET.linked && NET.status && now - NET.joinT > 4000) NET.status = 'LOOKING FOR THE GAME ' + NET.code + '...';
  if (NET.role === 'host' && (NET.beatT = (NET.beatT || 0) + 1) % 60 === 0) {
    // once a second: remind everyone where the game is (a message can get lost on a broker)
    if (G.state === 'lobby') netLobbySync();
    else if (NET.playing && (G.state === 'over' || G.state === 'win')) netState(G.state);
  }
  if (NET.role === 'client' && NET.linked && now - NET.heard > 15000) { clientLost('CONNECTION LOST'); return; }
  const q = NET.q; NET.q = [];
  for (const [L, m] of q) {
    if (NET.role === 'host') hostMessage(L, m);
    else if (NET.role === 'client') { NET.heard = performance.now(); clientMessage(m); }
  }
}
function clientMessage(m) {
  switch (m.t) {
    case 'hi':
      if (NET.linked) break;
      NET.me = m.pid; NET.status = ''; NET.linked = true; NET.heard = performance.now();
      clearTimeout(NET.host.helloT);
      setState('lobby'); Audio_.sfx('confirm');
      clientUpgrade(NET.host);
      break;
    case 'answer': if (NET.host && NET.host.pc) NET.host.pc.setRemoteDescription(m.sdp).catch(() => {}); break;
    case 'no': NET.err = m.why; NET.status = ''; netReset(); NET.role = null; break;
    case 'lobby':
      NET.lobby = { mode: m.mode, diff: m.diff, players: m.players };
      if (G.state !== 'lobby' && G.state !== 'entry' && Wipe.t < 0) wipe(() => setState('lobby')); // the host went back to the lobby
      break;
    case 'bye': clientLost('THE HOST ENDED THE GAME'); break;
    case 'start': clientStart(m); break;
    case 'floor': clientFloor(m); break;
    case 'room': clientRoom(m); break;
    case 'trans': clientTrans(m); break;
    case 'tile': if (G.room) { G.room.tiles[m.r * COLS + m.c] = T_FLOOR; G.room.dirty = true; flowKey = -1; } break;
    case 'you': if (YOU_FX[m.k]) YOU_FX[m.k](m.a); break;
    case 'state': clientState(m); break;
    case 's': clientSnap(m); break;
  }
}
function clientStart(m) {
  G.mode = m.mode; G.diff = m.diff;
  G.players = m.roster.map(r => {
    const p = newPlayer(r.pid);
    p.wand = r.wand; p.name = r.name; p.skin = r.skin; p.remote = r.pid !== NET.me;
    if (typeof applyCosmetics === 'function') applyCosmetics(p, p.remote ? r.cos : myCos());
    return p;
  });
  G.player = G.players.find(p => p.pid === NET.me);
  G.stats = { kills: 0, coins: 0, items: 0, time: 0 };
  G.run = { vault: 0, keep: 0 };
  G.coins = 0; G.won = false; G.record = false; G.arena = m.mode === 'arena' ? { wave: 0, phase: 'break', t: 3, left: 0 } : null;
  G.bestBefore = m.mode === 'arena' ? Save.stats.bestWave : Save.stats.bestDepth;
  resetRunFx();
  NET.kills = 0; NET.coinsSeen = 0; NET.tvSeen = 0;
  Save.stats.runs++; Save.write();
  NET.starting = true; // the game shows once the first room has arrived
}
function clientFloor(m) {
  const land = LANDS[m.land];
  const rooms = m.rooms.map(([gx, gy, type]) => Object.assign(newRoom(gx, gy), { type, stocked: true, tiles: null }));
  m.rooms.forEach((r, i) => { for (const d in r[3]) rooms[i].doors[d] = r[3][d] >= 0 ? rooms[r[3][d]] : { type: 'challenge' }; });
  G.floor = { depth: m.depth, land, theme: land.theme, rooms, start: rooms[0] };
  if (!G.stats) G.stats = { kills: 0, coins: 0, items: 0, time: 0 };
}
function fillRoom(m) {
  const room = G.floor.rooms[m.i];
  room.tiles = Uint8Array.from(m.tiles, c => +c);
  room.pits = m.pits; room.seed = m.seed; room.dirty = true;
  [...m.sv].forEach((c, i) => { G.floor.rooms[i].seen = !!(+c & 1); G.floor.rooms[i].visited = !!(+c & 2); });
  return room;
}
function clientRoom(m) {
  if (!G.floor) return;
  const room = fillRoom(m);
  G.room = room; G.trans = null;
  room.props = m.props; room.pickups = m.pickups.map(a => unpack(a, KF, {}));
  SHOTS.length = 0; clearEBullets(); G.enemies.length = 0; G.hazards.length = 0; G.markers.length = 0; G.turrets.length = 0; BOLTS.length = 0;
  for (const q of PARTS) q.life = 0;
  resetAmbient(G.floor.theme);
  flowKey = -1;
  renderRoomStatic(room, G.floor.theme);
  if (NET.starting) { NET.starting = false; setState('play'); }
}
function clientTrans(m) {
  if (!G.room) return;
  const to = fillRoom(m);
  renderRoomStatic(to, G.floor.theme);
  G.trans = { dir: m.dir, t: 0, from: G.room, to, ps: G.players.map(p => [p.x, p.y]) };
}
function clientState(m) {
  if (m.stats) G.stats = m.stats;
  if (m.tv > (NET.tvSeen || 0)) { addVault(m.tv - NET.tvSeen); NET.tvSeen = m.tv; }
  if (m.s === G.state) return; // a reminder of what we already know
  G.won = m.won;
  // our own record, not the host's
  G.record = G.mode === 'arena' ? (m.wave || 1) - 1 > G.bestBefore : (m.depth || 0) + 1 > G.bestBefore;
  if (m.kills) for (const [pid, k] of m.kills) { const p = G.players.find(q => q.pid === pid); if (p) p.kills = k; }
  if (G.arena && m.wave !== undefined) G.arena.wave = m.wave;
  if (G.floor && m.depth !== undefined) G.floor.depth = m.depth;
  if (m.s === 'wipe') wipe(() => {});
  else if (m.s === 'play') { wipe(() => setState('play')); }
  else if (m.s === 'lobby') wipe(() => setState('lobby'));
  else {
    if (m.s === 'over') { const st = Save.stats; if (G.mode === 'arena') st.bestWave = Math.max(st.bestWave, (m.wave || 1) - 1); else st.bestDepth = Math.max(st.bestDepth, (m.depth || 0) + 1); }
    if (m.s === 'win') { Save.stats.wins++; Audio_.stop(); Audio_.sfx('win'); }
    Save.write();
    setState(m.s);
  }
}
const _emap = new Map();
// Ask the host for the whole picture again (after a lost message), at most once a second.
function askSync(need) {
  const now = performance.now();
  if (now - (NET.syncT || 0) < 1000) return;
  NET.syncT = now;
  sendR(NET.host, { t: 'resync', need });
}
function clientSnap(m) {
  const g = m.g;
  if (!G.room || !G.player || !G.floor || G.state === 'lobby' || G.state === 'entry') { askSync('start'); return; }
  if (!G.trans && (G.floor.depth !== g.fd || G.floor.rooms.indexOf(G.room) !== g.ri || tileSum(G.room) !== g.th)) askSync('room');
  if (g.tv > NET.tvSeen) { addVault(g.tv - NET.tvSeen); NET.tvSeen = g.tv; Save.write(); }
  const me = G.player;
  // heroes: ours keeps its own position unless the host moved it (a new room, a revive)
  for (const a of m.P) {
    const pid = a[0];
    let p = G.players.find(q => q.pid === pid);
    if (!p) { p = newPlayer(pid); p.remote = true; G.players.push(p); }
    if (p === me) {
      const x = me.x, y = me.y, face = me.face, flip = me.flip, mv = me.moving, wt = me.walkT, dT = me.dashT, idle = me.idleT, tp = me.tpN;
      const hp0 = me.hp;
      unpack(a, PF, me);
      if (me.tpN === tp) { me.x = x; me.y = y; me.face = face; me.flip = flip; me.moving = mv; me.walkT = wt; me.dashT = dT; me.idleT = idle; }
      if (me.kills > NET.kills) { Save.stats.kills += me.kills - NET.kills; NET.kills = me.kills; }
      for (const id of me.items) if (!Save.found.includes(id)) Save.found.push(id);
      if (me.hp > hp0) G.hud.heartT = 0.4;
    } else {
      const tx = a[1], ty = a[2];
      unpack(a, PF, p);
      if (p.nx === undefined || Math.hypot(tx - p.nx, ty - p.ny) > 40) { p.sx = tx; p.sy = ty; }
      p.nx = tx; p.ny = ty; p.x = p.sx; p.y = p.sy;
    }
  }
  for (let i = G.players.length - 1; i >= 0; i--) if (!m.P.some(a => a[0] === G.players[i].pid)) G.players.splice(i, 1);
  // enemies, matched by id so they glide instead of jumping
  _emap.clear();
  for (const e of G.enemies) _emap.set(e.id, e);
  G.enemies.length = 0;
  for (const a of m.E) {
    const e = _emap.get(a[0]) || {};
    const ox = e.x, oy = e.y;
    unpack(a, EF, e);
    e.tx = e.x; e.ty = e.y;
    if (ox !== undefined && Math.hypot(e.x - ox, e.y - oy) < 40) { e.x = ox; e.y = oy; }
    G.enemies.push(e);
  }
  SHOTS.length = 0;
  for (const a of m.S) SHOTS.push(unpack(a, SF, {}));
  clearEBullets();
  m.B.forEach((a, i) => {
    let b = EBULLETS[i];
    if (!b) { b = {}; EBULLETS.push(b); }
    unpack(a, BF, b); b.spr = S(b.key); b.life = 1; b.t = 0;
  });
  G.room.pickups = m.K.map(a => unpack(a, KF, {}));
  G.markers = m.M.map(([x, y, t, max]) => ({ x, y, t, max }));
  G.hazards = m.H.map(([x, y, life]) => ({ x, y, life }));
  G.turrets = m.T.map(([x, y, life, flash]) => ({ x, y, life, flash }));
  BOLTS.length = 0;
  for (const [x0, y0, x1, y1, mx, my, t] of m.L) BOLTS.push({ x0, y0, x1, y1, mx, my, t });
  if (m.props) G.room.props = m.props.map(o => { const q = G.room.props.find(r => r.kind === o.kind && r.x === o.x && r.y === o.y); if (q) o.t = q.t; return o; });
  if (g.coins > G.coins) G.hud.coinT = 0.25;
  G.coins = g.coins;
  if (g.stats.coins > (NET.coinsSeen || 0)) { keepCoins(g.stats.coins - (NET.coinsSeen || 0)); NET.coinsSeen = g.stats.coins; }
  G.stats = g.stats;
  G.room.doorT = g.doorT; G.room.cleared = g.cleared;
  G.boss = g.boss ? G.enemies.find(e => e.id === g.boss) || null : null;
  G.cine = g.cine >= 0 ? { t: g.cine } : null;
  G.combo = g.combo; G.comboPop = g.pop; G.fall = g.fall;
  G.corpse = g.corpse ? Object.assign(g.corpse, { s: S(g.corpse.k) }) : null;
  if (g.arena) G.arena = Object.assign(G.arena || {}, g.arena);
  G.shake = Math.max(G.shake, g.shake); G.flashT = Math.max(G.flashT, g.flash);
  if (g.banner && !(G.banner && G.banner.icon)) G.banner = g.banner;
  G.floorBanner = g.floorBanner;
  if (g.song !== NET.song) { NET.song = g.song; if (g.song) Audio_.play(g.song); else Audio_.stop(); }
  // effects that happened on the host since the last snapshot
  for (const f of m.fx) {
    switch (f[0]) {
      case 'b': burst(f[1], f[2], f[3], f[4], f[5], f[6], f[7] || undefined); break;
      case 'p': poof(f[1], f[2]); break;
      case 'd': dust(f[1], f[2], f[3], f[4]); break;
      case 's': Audio_.sfx(f[1]); break;
      case 't': toast(f[1]); break;
      case 'h': case 'hap': haptic(f[1]); break;
    }
  }
}
// Client frame: move our hero, send the controls, animate everything between snapshots.
function clientPlay(dt) {
  const me = G.player;
  if (!me || !G.room) return;
  const portrait = IS_TOUCH && window.innerHeight > window.innerWidth;
  if (G.state === 'play' && (pressed('Escape', 'KeyP', 'PadStart', 'TouchPause') || portrait)) { setState('pause'); Audio_.sfx('select'); }
  tickHud(dt);
  updateAmbient(dt, G.floor.theme);
  updateParts(dt);
  if (G.trans) {
    G.trans.t = Math.min(TRANS_T - 0.001, G.trans.t + dt);
    for (const p of G.players) { p.walkT += dt; p.moving = true; }
    return;
  }
  if (G.cine) G.cine.t += dt;
  heartbeat(dt);
  readLocalInput(me);
  me.inv = Math.max(0, me.inv - dt); me.hurtT = Math.max(0, me.hurtT - dt); me.dashCool -= dt;
  if (me.sayT > 0) me.sayT -= dt;
  if (alive(me) && !G.cine) {
    movePlayer(me, dt);
    for (const o of G.room.props) if (o.kind === 'ped' || o.kind === 'frog' || o.kind === 'chest') pushOut(G.room, me, o);
  } else me.moving = false;
  const I = me.in;
  NET.ctl = NET.ctl || { sn: 0, un: 0, bn: 0, bs: -1 };
  if (I.star) NET.ctl.sn++;
  if (I.use) NET.ctl.un++;
  if (I.belt >= 0) { NET.ctl.bn++; NET.ctl.bs = I.belt; }
  if ((NET.sendT += dt) >= (direct(NET.host) ? NET_RATE : NET_RATE * 2) || I.star || I.use || I.belt >= 0 || I.dash) {
    NET.sendT = 0;
    sendU(NET.host, {
      t: 'in', mx: r1(I.mx), my: r1(I.my), ax: r1(I.ax), ay: r1(I.ay), aim: I.aim, pad: I.pad,
      x: r1(me.x), y: r1(me.y), face: me.face, flip: me.flip, mv: me.moving, wt: r1(me.walkT), dx: r1(me.dx), dy: r1(me.dy),
      tp: me.tpN, dn: me.dashN, sn: NET.ctl.sn, un: NET.ctl.un, bn: NET.ctl.bn, bs: NET.ctl.bs,
    });
  }
  // glide the others toward where the host last saw them
  const k = Math.min(1, dt * 18);
  for (const p of G.players) {
    if (p === me) continue;
    if (p.nx !== undefined) { p.sx += (p.nx - p.sx) * k; p.sy += (p.ny - p.sy) * k; p.x = p.sx; p.y = p.sy; }
    p.walkT += p.moving ? dt : 0;
  }
  for (const e of G.enemies) {
    e.anim += dt; e.flash = Math.max(0, e.flash - dt);
    if (e.spawnT > 0) e.spawnT -= dt;
    if (e.tx !== undefined) { e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k; }
  }
  for (let i = SHOTS.length - 1; i >= 0; i--) {
    const s = SHOTS[i];
    const px = s.x, py = s.y;
    s.x += s.vx * dt; s.y += s.vy * dt; s.t += dt;
    if (s.trail && Math.random() < 0.55) part(px, py, 0, 0, 0.22, s.kind === 'comet' ? pick(TRAIL_COMET) : s.fw ? pick(TRAIL_FW) : TRAIL[s.tint], { size: 1, drag: 1 });
  }
  for (const b of EBULLETS) if (b.life > 0) { b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt; }
  for (const k2 of G.room.pickups) k2.t += dt;
  for (const o of G.room.props) o.t = (o.t || 0) + dt;
  for (const t of G.turrets) { t.life -= dt; t.flash -= dt; }
  for (const h of G.hazards) h.life -= dt;
  for (const mk of G.markers) mk.t -= dt;
  updateBolts(dt);
  if (G.fall) { G.fall.t += dt; for (const d of G.fall.drops) d.t += dt; }
  if (G.corpse) G.corpse.t += dt;
}

// ---------- Screens: co-op menu, text entry (codes, names), the lobby ----------
const COOP_ITEMS = ['HOST A GAME', 'JOIN A GAME', 'BACK'];
function updateCoop() {
  const c = menu(COOP_ITEMS, 110, 16);
  if (pressed(...K_BACK) || c === 2) { Audio_.sfx('select'); titleReturn('CO-OP'); }
  else if (c === 0) { Audio_.sfx('confirm'); netHost(); }
  else if (c === 1) { Audio_.sfx('confirm'); openJoin(''); }
}
function drawCoop() {
  drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 150, 46, 300, 116);
  text('CO-OP', VW / 2, 54, 'Y', 2, 1);
  text('PLAY TOGETHER ONLINE, UP TO FOUR HEROES', VW / 2, 70, 'w', 1, 1);
  text('THE HOST SHARES A CODE, FRIENDS JOIN WITH IT', VW / 2, 81, 'c', 1, 1);
  text('MORE HEROES, TOUGHER FOES: HELP FALLEN FRIENDS UP!', VW / 2, 92, 'c', 1, 1);
  drawMenu(COOP_ITEMS, 110, 16);
}

// Text entry: type on a keyboard, or tap / pick letters on the pixel keypad.
// G.entry: { title, hint, value, abc, min, max, done(value), back() }
function openEntry(e) {
  G.entry = Object.assign({ value: '', min: 1 }, e);
  G.entry.keys = e.abc.split('').concat(['DEL', 'OK']);
  G.entry.cols = e.abc.length > 32 ? 9 : 8;
  NET.err = '';
  setState('entry');
}
function openJoin(code) {
  openEntry({
    title: 'JOIN A GAME', hint: 'ENTER THE HOST\'S CODE', abc: NET_ALPHA, min: 5, max: 5, value: code, ok: 'JOIN',
    done: (v) => netJoin(v),
    back: () => { if (NET.role) { netReset(); NET.role = null; } setState('coop'); G.menuSel = 1; },
  });
}
function entryCell(i) {
  const E = G.entry, n = E.abc.length, cols = E.cols, W = 20, H = 16, x0 = VW / 2 - cols * W / 2 + 1, y0 = 90, rows = Math.ceil(n / cols);
  if (i < n) return [x0 + (i % cols) * W, y0 + Math.floor(i / cols) * H, W - 2, H - 2];
  const y = y0 + rows * H, w = W * 3 - 2;
  return i === n ? [x0, y, w, H - 2] : [x0 + cols * W - w - 2, y, w, H - 2];
}
function entryKey(k) {
  const E = G.entry;
  if (NET.status) return;
  NET.err = '';
  if (k === 'DEL') { E.value = E.value.slice(0, -1); Audio_.sfx('select'); }
  else if (k === 'OK') {
    if (E.value.length >= E.min) { Audio_.sfx('confirm'); E.done(E.value); }
    else { Audio_.sfx('deny'); NET.err = E.min === E.max ? 'THE CODE HAS ' + E.max + ' LETTERS' : 'TOO SHORT'; }
  } else if (E.value.length < E.max) { E.value += k; Audio_.sfx('select'); }
}
function updateEntry() {
  const E = G.entry, n = E.keys.length, cols = E.cols, letters = E.abc.length, last = Math.floor((letters - 1) / cols) * cols;
  let s = G.menuSel;
  if (pressed('Escape', 'PadB')) { Audio_.sfx('select'); E.back(); return; }
  for (const code in Input.hit) {
    const ch = code.startsWith('Key') ? code.slice(3) : code.startsWith('Digit') ? code.slice(5) : null;
    if (ch && E.abc.includes(ch)) entryKey(ch);
  }
  if (pressed('Backspace')) entryKey('DEL');
  if (pressed('Enter') && E.value.length >= E.min && Input.lastAim !== 'pad') { entryKey('OK'); return; }
  if (pressed('ArrowRight', 'PadRight')) s = s >= letters ? n - 1 : Math.min(letters - 1, s % cols < cols - 1 ? s + 1 : s);
  if (pressed('ArrowLeft', 'PadLeft')) s = s >= letters ? letters : s % cols > 0 ? s - 1 : s;
  if (pressed('ArrowDown', 'PadDown')) s = s >= letters ? s : s + cols < letters ? s + cols : s % cols < cols / 2 ? letters : n - 1;
  if (pressed('ArrowUp', 'PadUp')) s = s >= letters ? (s === letters ? last : Math.min(letters - 1, last + cols - 1)) : Math.max(s % cols, s - cols);
  if (s !== G.menuSel) { G.menuSel = s; Audio_.sfx('select'); }
  let click = -1;
  for (let i = 0; i < n; i++) { const c = entryCell(i); if (hoverRow(i, c[0], c[1], c[2], c[3])) click = i; }
  if (click >= 0 && Input.mouseHit) entryKey(E.keys[click]);
  else if (pressed('PadA') || (pressed('Enter') && Input.lastAim === 'pad')) entryKey(E.keys[G.menuSel]);
}
function drawEntry() {
  const E = G.entry;
  drawTitleBg();
  dim(0.5);
  const rows = Math.ceil(E.abc.length / E.cols), bottom = 90 + (rows + 1) * 16;
  panel(VW / 2 - 100, 30, 200, bottom - 30 + 20);
  text(E.title, VW / 2, 37, 'Y', 2, 1);
  text(E.hint, VW / 2, 50, 'c', 1, 1);
  const bw = 15, x0 = VW / 2 - E.max * (bw + 2) / 2;
  for (let i = 0; i < E.max; i++) {
    const x = x0 + i * (bw + 2), y = 62, ch = E.value[i];
    rect(x, y, bw, 19, '0'); rect(x + 1, y + 1, bw - 2, 17, i === E.value.length && !NET.status && Math.floor(G.time * 3) % 2 ? '3' : '2');
    if (ch) text(ch, x + bw / 2 + 1, y + 6, 'Y', 1, 1);
  }
  E.keys.forEach((k, i) => {
    const [x, y, w, h] = entryCell(i), sel = i === G.menuSel;
    rect(x, y, w, h, sel ? 'Y' : '0'); rect(x + 1, y + 1, w - 2, h - 2, sel ? '3' : '1');
    text(k === 'OK' ? E.ok || 'OK' : k, x + w / 2 + 1, y + 4, k === 'OK' ? 'h' : sel ? 'w' : 'l', 1, 1);
  });
  const msg = NET.status || NET.err;
  if (msg) text(msg, VW / 2, bottom + 4, NET.err ? 'R' : 'c', 1, 1);
  else text(Input.lastAim === 'pad' ? 'A: PRESS   B: BACK' : Input.lastAim === 'touch' ? 'TAP THE LETTERS' : 'TYPE IT   ENTER: OK   ESC: BACK', VW / 2, bottom + 4, 'l', 1, 1);
}
// Name entry for this player (shown over heads and in the lobby).
function openName(back) {
  openEntry({
    title: 'YOUR NAME', hint: 'EVERYONE SEES IT OVER YOUR HEAD', abc: NAME_ABC, min: 1, max: 8, value: Save.name,
    done: (v) => { Save.name = v; Save.write(); netMe(); back(); },
    back,
  });
}
// Tell the others about a new name / robe / wand.
function netMe() {
  if (NET.role === 'host') netLobbySync();
  else if (NET.role === 'client') sendR(NET.host, { t: 'me', name: Save.name, skin: Save.skin, wand: Save.wand, cos: myCos() });
}

// The lobby. Everyone sets their name, robe and wand; the host picks the mode and difficulty.
function lobbyRows() { return ['name', 'robe', 'wand'].concat(NET.role === 'host' ? ['mode', 'diff', 'invite', 'start', 'leave'] : ['leave']); }
const LOBBY_Y = { name: 100, robe: 112, wand: 124, mode: 136, diff: 148, invite: 164, start: 176, leave: 188 };
const lobbyY = (row) => (NET.role !== 'host' && row === 'leave' ? 176 : LOBBY_Y[row]);
const PICK_ROWS = new Set(['robe', 'wand', 'mode', 'diff']);
function lobbyBack() { setState('lobby'); G.menuSel = 0; }
function updateLobby() {
  if (!NET.role) { setState('title'); return; }
  const rows = lobbyRows();
  menuNav(rows.length);
  let click = -1;
  rows.forEach((r, i) => { if (hoverRow(i, VW / 2 - 124, lobbyY(r) - 3, 248, 12)) click = i; });
  const row = rows[G.menuSel], pickClick = click >= 0 && Input.mouseHit && PICK_ROWS.has(row);
  const dir = pressed(...K_RIGHT) ? 1 : pressed(...K_LEFT) ? -1 : pickClick ? (Input.mx < VW / 2 + 24 ? -1 : 1) : 0;
  if (dir && row === 'robe') {
    // robes still locked are skipped (when the game locks any)
    Save.skin = typeof nextRobe === 'function' ? nextRobe(Save.skin, dir) : (Save.skin + dir + ROBES.length) % ROBES.length;
    Save.write(); Audio_.sfx('select'); netMe();
  }
  if (dir && row === 'wand') {
    const owned = WAND_IDS.filter(id => Save.wands.includes(id));
    if (owned.length > 1) { Save.wand = cycle(owned, Save.wand, dir); Save.write(); Audio_.sfx('select'); netMe(); }
    else if (pickClick || dir) toast('UNLOCK MORE WANDS IN THE GARDEN');
  }
  if (dir && row === 'mode') { NET.lobby.mode = NET.lobby.mode === 'adv' ? 'arena' : 'adv'; Audio_.sfx('select'); netLobbySync(); }
  if (dir && row === 'diff') {
    // skip difficulty levels that are still locked (if the game locks any)
    let d = NET.lobby.diff;
    for (let k = 0; k < DIFFS.length; k++) { d = (d + dir + DIFFS.length) % DIFFS.length; if (typeof diffUnlocked !== 'function' || diffUnlocked(d)) break; }
    NET.lobby.diff = d; Save.settings.diff = d; Audio_.sfx('select'); netLobbySync();
  }
  const ok = (pressed(...K_OK) && !PICK_ROWS.has(row)) || (click >= 0 && Input.mouseHit && !PICK_ROWS.has(row));
  if (pressed(...K_BACK) || (ok && row === 'leave')) { Audio_.sfx('select'); netLeave(); return; }
  if (ok && row === 'name') { Audio_.sfx('confirm'); openName(lobbyBack); }
  if (ok && row === 'invite') netInvite();
  if (ok && row === 'start' && NET.status === '') {
    Audio_.sfx('confirm');
    G.diff = NET.lobby.diff; Save.write();
    const roster = netRoster(), mode = NET.lobby.mode;
    NET.playing = true;
    hostAll({ t: 'state', s: 'wipe', stats: null });
    wipe(() => startRun(mode, roster));
  }
}
function netInvite() {
  const url = location.origin + location.pathname + '?join=' + NET.code;
  if (navigator.share && IS_TOUCH) navigator.share({ title: 'Star Garden', text: 'Join my Star Garden game! Code: ' + NET.code, url }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('INVITE LINK COPIED!'), () => toast('CODE: ' + NET.code));
  else toast('CODE: ' + NET.code);
  Audio_.sfx('confirm');
}
function drawLobby() {
  drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 134, 26, 268, 176);
  text('CO-OP LOBBY', VW / 2, 32, 'Y', 2, 1);
  if (NET.status || NET.err) text(NET.err || NET.status, VW / 2, 46, NET.err ? 'R' : 'c', 1, 1);
  else {
    text('CODE', VW / 2 - 30, 46, 'l', 1, 2);
    text(NET.code.split('').join(' '), VW / 2 - 22, 46, 'Y', 2);
    if (NET.role === 'host' && !NET.relays.some(M => M && M.up) && Math.floor(G.time * 2) % 2) text('RECONNECTING...', VW / 2 + 40, 46, 'c', 1);
  }
  // the heroes in the lobby, in their robes
  const L = NET.lobby.players, host = NET.role === 'host';
  for (let i = 0; i < NET_MAX; i++) {
    const x = VW / 2 - 126 + i * 64, y = 58, pl = L.find(q => q.pid === i), me = pl && pl.pid === NET.me;
    rect(x, y, 60, 32, me ? 'Y' : '0'); rect(x + 1, y + 1, 58, 30, pl ? '2' : '1');
    if (pl) {
      const skin = me ? Save.skin : pl.skin;
      drawFeet(S('hero_d0' + (Math.floor(G.time * 1.3 + i * 0.7) % 4 ? '' : 'b') + SKIN[skin]), x + 13, y + 29);
      drawS(S('wand_' + (me ? Save.wand : pl.wand)), x + 26, y + 13);
      text(me && NET.role === 'host' ? Save.name : pl.name, x + 30, y + 3, TAG_COL[skin], 2, 1);
    } else text(i ? 'OPEN' : '', x + 30, y + 13, '3', 1, 1);
  }
  const rows = lobbyRows(), sel = rows[G.menuSel], d = DIFFS[NET.lobby.diff];
  const modeName = NET.lobby.mode === 'arena' ? 'ARENA' : 'ADVENTURE';
  const line = (id, label, value) => {
    const y = lobbyY(id), on = sel === id, vx = VW / 2 + 24;
    text(label, VW / 2 - 116, y, on ? 'Y' : 'l', 1);
    if (on) pointer(VW / 2 - 126, y);
    text(value, vx, y, on ? 'Y' : 'w', 1, 1);
    if (PICK_ROWS.has(id)) {
      const w = textW(value), bob = on ? Math.floor(G.time * 4) % 2 : 0;
      text('<', vx - w / 2 - 10 - bob, y, on ? 'Y' : '3', 1);
      text('>', vx + w / 2 + 6 + bob, y, on ? 'Y' : '3', 1);
    }
  };
  line('name', 'NAME', Save.name);
  line('robe', 'ROBE', ROBES[Save.skin]);
  line('wand', 'WAND', WANDS[Save.wand].name);
  if (host) { line('mode', 'MODE', modeName); line('diff', 'LEVEL', d.name); }
  else {
    text(modeName + '   ' + d.name, VW / 2, 142, 'w', 1, 1);
    text(L.length > 1 ? 'WAITING FOR THE HOST TO START...' : 'CONNECTING...', VW / 2, 154, 'c', 1, 1);
  }
  const menuRow = (id, label, col) => {
    const y = lobbyY(id), on = sel === id;
    text(label, VW / 2, y, on ? 'Y' : col || 'l', 2, 1);
    if (on) pointer(VW / 2 - textW(label) / 2 - 10, y);
  };
  if (host) {
    menuRow('invite', IS_TOUCH && navigator.share ? 'SHARE INVITE LINK' : 'COPY INVITE LINK', 'c');
    menuRow('start', L.length > 1 ? 'START WITH ' + L.length + ' HEROES!' : 'START ALONE (OR WAIT FOR FRIENDS)', 'h');
  }
  menuRow('leave', host ? 'CLOSE THE GAME' : 'LEAVE');
}
// Opening an invite link (…/?join=CODE) goes straight to joining that game.
function netAutoJoin() {
  const m = /[?&]join=([A-Za-z0-9]{5})/.exec(location.search);
  if (!m) return;
  history.replaceState(null, '', location.pathname);
  openJoin(m[1].toUpperCase());
  netJoin(G.entry.value);
}

netAutoJoin();
