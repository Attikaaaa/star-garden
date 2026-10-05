'use strict';
// Wildgrove multiplayer. One player hosts (the world lives in their browser, like a server); friends join with a
// 5 letter code, or find the world in the public list. The signalling goes through the same free MQTT brokers the
// co-op uses, the game itself over a direct WebRTC link. The host runs mobs, time and crops; tiles, chests and
// positions are shared; everybody keeps their own backpack (the host remembers it for the next visit).
const WGN = { role: null, code: '', pub: false, peers: [], relays: [], q: [], link: null, status: '', err: '', pid: 0, list: [], listing: false, applying: false, sendT: 0, mobT: 0, annT: 0, clkT: 0, chat: [], max: 6 };
const WGN_PROTO = 1, WGN_TOPIC = 'wildgrove/' + WGN_PROTO + '/', WGN_PUB = 'wildgrove/' + WGN_PROTO + '/public';
const wgnOn = () => !!WGN.role;
function wgnSend(L, msg, unreliable) {
  if (!L) return;
  const s = JSON.stringify(msg);
  if (L.r && L.r.readyState === 'open' && L.u && L.u.readyState === 'open') { if (unreliable) { if (L.u.bufferedAmount < 64000) L.u.send(s); } else L.r.send(s); }
  else if (L.send) L.send(s);
}
function wgnAll(msg, except, unreliable) { for (const L of WGN.peers) if (L.pid > 0 && L !== except) wgnSend(L, msg, unreliable); }
function wgnListen(L, ch) { if (ch.label === 'r') L.r = ch; else L.u = ch; ch.onmessage = (m) => { let d; try { d = JSON.parse(m.data); } catch (e) { return; } WGN.q.push([L, d]); }; }
function wgnClose(L) { if (!L) return; try { if (L.own) L.own.close(); if (L.conns) for (const M of L.conns) M.close(); L.r && L.r.close(); L.u && L.u.close(); L.pc && L.pc.close(); } catch (e) { /* closed */ } L.r = L.u = L.pc = null; }

// ---------- host ----------
function wgnHost(pub, code) {
  wgnStop();
  WGN.role = 'host'; WGN.pub = !!pub; WGN.pid = 0; WGN.code = code || netRandom(5, NET_ALPHA); WGN.status = 'OPENING...'; WGN.err = '';
  if (typeof fetchTurn === 'function') fetchTurn();
  WGN.relays = NET_RELAYS.map((u, i) => wgnRelay(i));
  WGS.remote = []; wgToast('OPEN TO FRIENDS: ' + WGN.code, 4);
}
function wgnRelay(i) {
  const code = WGN.code, base = WGN_TOPIC + code;
  const M = mqttOpen(NET_RELAYS[i], base + '/h', (payload) => {
    let d; try { d = JSON.parse(payload); } catch (e) { return; }
    if (!d || typeof d.f !== 'string' || !d.m) return;
    let L = WGN.peers.find(q => q.cid === d.f);
    if (!L) {
      if (d.m.t !== 'hello') return;
      const topic = base + '/c/' + d.f;
      L = { cid: d.f, ris: new Set(), pid: -1, heard: performance.now(), sq: 0 };
      L.send = (str) => { const out = '{"q":' + (++L.sq) + ',"m":' + str + '}'; for (const j of L.ris) { const R = WGN.relays[j]; if (R && R.up) R.pub(topic, out); } };
      WGN.peers.push(L);
    }
    L.ris.add(i);
    if (typeof fresh === 'function' ? fresh(L, d.q) : true) WGN.q.push([L, d.m]);
  }, (up) => {
    if (up) { WGN.status = ''; return; }
    if (WGN.role === 'host' && WGN.code === code && WGN.relays[i] === M) setTimeout(() => { if (WGN.role === 'host' && WGN.code === code && WGN.relays[i] === M) WGN.relays[i] = wgnRelay(i); }, 3000);
  });
  return M;
}
function wgnPerm() { const mt = WGS.world.meta; return mt.perm || (mt.perm = { pass: '', white: 0, wl: [], ban: [], ops: [] }); }
function wgnHostMsg(L, m) {
  L.heard = performance.now();
  const w = WGS.world;
  if (m.t === 'hello') {
    if (L.pid > 0) { wgnSend(L, { t: 'hi', pid: L.pid, w: wgnWelcome(L) }); return; }
    if (m.v !== WGN_PROTO) { wgnSend(L, { t: 'no', why: 'PLEASE RELOAD THE PAGE: NEW VERSION' }); return; }
    const pm = wgnPerm(), nm = wgnClean(m.name), rj0 = String(m.rj || '').slice(0, 24);
    if (pm.ban.includes(rj0) || pm.ban.includes(nm)) { wgnSend(L, { t: 'no', why: 'YOU ARE BANNED FROM THIS WORLD' }); return; }
    if (pm.white && !pm.wl.includes(nm)) { wgnSend(L, { t: 'no', why: 'NOT ON THE WHITELIST' }); return; }
    if (pm.pass && wgnClean(m.pw) !== pm.pass) { wgnSend(L, { t: 'no', why: m.pw ? 'WRONG PASSWORD' : 'THIS WORLD NEEDS A PASSWORD' }); return; }
    const old = WGN.peers.find(q => q !== L && q.rj && q.rj === m.rj && q.pid > 0); if (old) wgnDrop(old, true);
    const used = new Set(WGN.peers.map(q => q.pid)); let pid = 1; while (used.has(pid)) pid++;
    if (pid >= WGN.max) { wgnSend(L, { t: 'no', why: 'THAT WORLD IS FULL' }); return; }
    L.pid = pid; L.rj = String(m.rj || '').slice(0, 24); L.name = wgnClean(m.name) || 'FRIEND' + pid; L.ping = 0; L.look = m.look || { skin: 0, hair: 0, shirt: 0 };
    const st = (w.guests || {})[L.rj]; L.guest = st || null;
    const sp = st ? { x: st.x, y: st.y } : w.spawn; L.x = sp.x; L.y = sp.y; L.dim = st && st.dim || 'o'; L.hp = st ? st.hp : 20; L.face = 'd'; L.moving = false; L.walkT = 0;
    wgnSend(L, { t: 'hi', pid, w: wgnWelcome(L) });
    wgToast(L.name + ' JOINED!'); wgSfx('select'); wgnAll({ t: 'chat', who: '', msg: L.name + ' JOINED' }, L); WGN.chat.push({ who: '', msg: L.name + ' JOINED', t: 8 });
  } else if (m.t === 'offer') wgnOffer(L, m);
  else if (L.pid < 0) return;
  else if (m.t === 'p') { Object.assign(L, { x: m.x, y: m.y, face: m.face, moving: m.mv, walkT: m.wt, dim: m.dim, hp: m.hp, swing: m.sw, held: m.held, inv: 0 }); }
  else if (m.t === 'tile') { WGN.applying = true; wgnApplyTile(m); WGN.applying = false; wgnAll(Object.assign({}, m, { t: 'set' }), L); }
  else if (m.t === 'chunkreq') { const ch = wgChunk(w, m.d, m.cx, m.cy); wgnSend(L, { t: 'chunk', d: m.d, cx: m.cx, cy: m.cy, pk: ch.mod ? wgPackChunk(ch) : null }); }
  else if (m.t === 'hit') { const mob = WGS.mobs.find(q => q.id === m.id); if (mob && !mob.dead) { WGS.lootTo = L.pid; wgHurtMob(mob, Math.min(40, +m.dmg || 1), L.x, L.y); WGS.lootTo = 0; if (mob.hp > 0) mob.fear = 3; } }
  else if (m.t === 'cset') { const ch = wgCont(w, m.d, m.x, m.y, true); ch.length = 0; for (const s of m.a) ch.push(s); wgChunkAt(w, m.d, m.x, m.y).mod = true; wgnAll(m, L); }
  else if (m.t === 'me') { w.guests = w.guests || {}; w.guests[L.rj] = { x: L.x, y: L.y, dim: L.dim, hp: m.hp, food: m.food, inv: m.inv, armor: m.armor, sel: m.sel }; }
  else if (m.t === 'ping') wgnSend(L, { t: 'pong', s: m.s });
  else if (m.t === 'chat' && String(m.msg || '')[0] === '/') { const r = wgnPerm().ops.includes(L.rj) ? wgnCmd(m.msg, L) : 'ONLY OPERATORS CAN DO THAT'; wgnSend(L, { t: 'chat', who: '', msg: r }); }
  else if (m.t === 'chat') { const msg = String(m.msg || '').slice(0, 60); wgnAll({ t: 'chat', who: L.name, msg }, null); WGN.chat.push({ who: L.name, msg, t: 8 }); }
  else if (m.t === 'bye') wgnDrop(L, false);
}
// host / operator commands, typed in chat: /KICK name, /BAN name, /UNBAN name, /OP name, /WHITE ON|OFF|ADD name|DEL name, /PASS word|OFF, /TIME DAY|NIGHT, /LIST, /SAY text
function wgnCmd(txt, by) {
  const a = String(txt).trim().replace(/^\//, '').toUpperCase().split(/\s+/), c = a[0], arg = wgnClean(a[1]), pm = wgnPerm();
  const peer = (n) => WGN.peers.find(q => q.pid > 0 && q.name === n);
  if (c === 'KICK' || c === 'BAN') {
    const q = peer(arg); if (!q) return 'NO PLAYER ' + arg;
    if (c === 'BAN') { pm.ban.push(q.rj, q.name); }
    wgnSend(q, { t: 'no', why: c === 'BAN' ? 'YOU WERE BANNED' : 'YOU WERE KICKED' }); wgnDrop(q, false); return (c === 'BAN' ? 'BANNED ' : 'KICKED ') + arg;
  }
  if (c === 'UNBAN') { pm.ban = pm.ban.filter(x => x !== arg); return 'UNBANNED ' + arg; }
  if (c === 'OP') { const q = peer(arg); if (!q) return 'NO PLAYER ' + arg; if (!pm.ops.includes(q.rj)) pm.ops.push(q.rj); return arg + ' IS AN OPERATOR'; }
  if (c === 'WHITE') {
    if (a[1] === 'ON' || a[1] === 'OFF') { pm.white = a[1] === 'ON' ? 1 : 0; return 'WHITELIST ' + a[1]; }
    const n = wgnClean(a[2]); if (a[1] === 'ADD' && n) { if (!pm.wl.includes(n)) pm.wl.push(n); return 'ADDED ' + n; }
    if (a[1] === 'DEL' && n) { pm.wl = pm.wl.filter(x => x !== n); return 'REMOVED ' + n; }
    return 'WHITE ON|OFF|ADD NAME|DEL NAME';
  }
  if (c === 'PASS') { pm.pass = arg === 'OFF' ? '' : arg; return pm.pass ? 'PASSWORD SET' : 'PASSWORD OFF'; }
  if (c === 'TIME') { WGS.clock = arg === 'NIGHT' ? 0.85 : 0.3; return 'TIME SET'; }
  if (c === 'LIST') return 'PLAYERS: ' + [WGS.p.name].concat(WGN.peers.filter(q => q.pid > 0).map(q => q.name)).join(' ');
  if (c === 'SAY') { const msg = a.slice(1).join(' '); wgnAll({ t: 'chat', who: 'SERVER', msg }, null); WGN.chat.push({ who: 'SERVER', msg, t: 8 }); return ''; }
  return 'KICK BAN UNBAN OP WHITE PASS TIME LIST SAY';
}
function wgnClean(n) { return String(n || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10); }
function wgnWelcome(L) {
  const w = WGS.world;
  return { name: w.meta.name, seed: w.seed, diff: w.meta.diff, spawn: w.spawn, clock: WGS.clock, day: WGS.day, st: L.guest, pid: L.pid, host: WGS.p.name, hd: WGS.dim };
}
function wgnDrop(L, quiet) {
  const i = WGN.peers.indexOf(L); if (i < 0) return;
  WGN.peers.splice(i, 1); wgnClose(L);
  if (L.pid > 0 && !quiet) { wgToast(L.name + ' LEFT'); wgnAll({ t: 'chat', who: '', msg: L.name + ' LEFT' }, null); }
}
function wgnOffer(L, m) {
  if (L.pc) { try { L.pc.close(); } catch (e) { /* */ } }
  const pc = L.pc = new RTCPeerConnection({ iceServers: iceServers() });
  pc.ondatachannel = (e) => wgnListen(L, e.channel);
  pc.setRemoteDescription(m.sdp).then(() => pc.createAnswer()).then(a => pc.setLocalDescription(a)).then(() => gathered(pc)).then(() => { if (L.pc === pc) wgnSend(L, { t: 'answer', sdp: pc.localDescription }); }).catch(() => {});
}
function wgnApplyTile(m) {
  const w = WGS.world;
  if (m.g !== undefined) wgSetGround(w, m.d, m.x, m.y, m.g);
  wgSetObj(w, m.d, m.x, m.y, m.o, m.m);
}
// every local tile edit is shared (hooked into wgSetObj / wgSetGround)
function wgNetTile(dim, x, y) {
  if (!WGN.role || WGN.applying || !WGS.world) return;
  const w = WGS.world, msg = { t: WGN.role === 'host' ? 'set' : 'tile', d: dim, x, y, g: wgGround(w, dim, x, y), o: wgObjAt(w, dim, x, y), m: wgMetaAt(w, dim, x, y) };
  if (WGN.role === 'host') wgnAll(msg, null); else wgnSend(WGN.link, msg);
}
function wgNetChunk(w, dim, cx, cy) { if (WGN.role === 'client' && w === WGS.world && WGN.link && WGN.link.open) wgnSend(WGN.link, { t: 'chunkreq', d: dim, cx, cy }); }
function wgNetChest(dim, x, y, arr) { if (!WGN.role) return; const m = { t: 'cset', d: dim, x, y, a: arr }; if (WGN.role === 'host') wgnAll(m, null); else wgnSend(WGN.link, m); }

// ---------- client ----------
function wgnJoin(code) {
  wgnStop();
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  WGN.role = 'client'; WGN.code = code; WGN.status = 'CONNECTING...'; WGN.err = '';
  const cid = netRandom(10, RND_ID), base = WGN_TOPIC + code;
  let rj = ''; try { rj = localStorage.wgRj || (localStorage.wgRj = netRandom(16, RND_ID)); } catch (e) { rj = netRandom(16, RND_ID); }
  const L = WGN.link = { cid, open: false, sq: 0, conns: [], t0: performance.now() };
  L.send = (str) => { const out = '{"f":"' + cid + '","q":' + (++L.sq) + ',"m":' + str + '}'; for (const M of L.conns) if (M.up) M.pub(base + '/h', out); };
  const look = (typeof WGU !== 'undefined' && WGU.look) || { skin: 0, hair: 0, shirt: 0 };
  let name = ''; try { name = localStorage.wgName || ''; } catch (e) { /* */ }
  const hello = () => wgnSend(L, { t: 'hello', v: WGN_PROTO, rj, name: name || 'FRIEND', look, pw: WGN.pw || '' });
  const open = () => NET_RELAYS.map(u => mqttOpen(u, base + '/c/' + cid, (payload) => {
    let d; try { d = JSON.parse(payload); } catch (e) { return; }
    if (!d || !d.m) return;
    if (typeof fresh === 'function' ? fresh(L, d.q) : true) WGN.q.push([L, d.m]);
  }, (up) => { if (up) hello(); }));
  L.conns = open();
  L.helloT = setInterval(() => { if (!L.open && WGN.link === L) { hello(); const n = L.conns.filter(M => M.up).length; WGN.status = 'CONNECTING... ' + n + '/' + NET_RELAYS.length + ' SERVERS'; } else clearInterval(L.helloT); }, 1800);
  // a broker that quietly lost our subscription never answers: after a few seconds start the connections over once
  setTimeout(() => { if (WGN.link === L && !L.open && WGN.role === 'client') { for (const M of L.conns) M.close(); L.conns = open(); } }, 9000);
  setTimeout(() => { if (WGN.link === L && !L.open && WGN.role === 'client') { const n = L.conns.filter(M => M.up).length; WGN.err = n ? 'NO ONE ANSWERED. THE HOST MAY HAVE LEFT: REFRESH THE LIST.' : 'CANNOT REACH THE SERVERS. CHECK YOUR CONNECTION.'; WGN.status = ''; wgnStop(); } }, 24000);
}
function wgnClientMsg(L, m) {
  if (m.t === 'pong') { WGN.ping = Math.round(performance.now() - m.s); return; }
  if (m.t === 'no') { const was = L.open; WGN.err = m.why; WGN.status = ''; wgnStop(); if (was) wgnLeaveGame(); return; }
  if (m.t === 'hi' && !L.open) {
    L.open = true; clearInterval(L.helloT); WGN.pid = m.pid; WGN.status = '';
    wgnEnter(m.w);
    // upgrade to a direct link
    const pc = L.pc = new RTCPeerConnection({ iceServers: iceServers() });
    wgnListen(L, pc.createDataChannel('r', { ordered: true })); wgnListen(L, pc.createDataChannel('u', { ordered: false, maxRetransmits: 0 }));
    pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => gathered(pc)).then(() => wgnSend(L, { t: 'offer', sdp: pc.localDescription })).catch(() => {});
    return;
  }
  if (m.t === 'answer' && L.pc) { L.pc.setRemoteDescription(m.sdp).catch(() => {}); return; }
  if (!L.open) return;
  L.heard = performance.now();
  const w = WGS.world;
  if (m.t === 'ps') { WGS.remote = m.l.filter(a => a[0] !== WGN.pid).map(a => ({ pid: a[0], x: a[1], y: a[2], face: a[3], moving: a[4], walkT: a[5], dim: a[6], hp: a[7], name: a[8], look: a[9], swing: a[10], inv: 0 })); }
  else if (m.t === 'mobs') { if (WGS.dim === WGN.hd) wgnMobs(m.l); }
  else if (m.t === 'set') { WGN.applying = true; wgnApplyTile(m); WGN.applying = false; }
  else if (m.t === 'chunk') { const ch = wgChunk(w, m.d, m.cx, m.cy); if (m.pk) { WGN.applying = true; wgReadChunk(ch, m.pk); ch.artDirty = true; WGN.applying = false; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const n = wgChunk(w, m.d, m.cx + dx, m.cy + dy, false); if (n) n.artDirty = true; } } }
  else if (m.t === 'cset') { const c = wgCont(w, m.d, m.x, m.y, true); c.length = 0; for (const s of m.a) c.push(s); }
  else if (m.t === 'loot') wgDrop(m.x, m.y, m.id, m.n);
  else if (m.t === 'dmg') wgHurtPlayer(m.dmg, m.fx, m.fy);
  else if (m.t === 'clk') { WGS.clock = m.c; WGS.day = m.d; WGS.wk = m.wk; WGN.hd = m.hd || 'o'; }
  else if (m.t === 'chat') WGN.chat.push({ who: m.who, msg: m.msg, t: 8 });
  else if (m.t === 'kick' || (m.t === 'no' && L.open)) { WGN.err = 'THE HOST CLOSED THE WORLD'; wgnStop(); wgnLeaveGame(); }
}
function wgnEnter(wl) { // we are in: build the host's world around us
  const meta = { id: 'net', name: wl.name, seed: wl.seed, diff: wl.diff, created: 0, last: 0, played: 0, day: wl.day };
  WGN.hd = wl.hd || 'o'; const w = wgNewWorld(meta); w.spawn = wl.spawn; WGS.world = w; WGS.readonly = true; WGS.net = true;
  WGS.dim = 'o'; WGS.clock = wl.clock; WGS.day = wl.day; WGS.signs = {}; WGS.mobs = []; WGS.drops = []; WGS.parts = []; WGS.remote = []; WGS.t = 0; WGS.tf = 0;
  const p = wgNewPlayer(wl.spawn.x, wl.spawn.y); WGS.p = p; WGS.inv = wgInvNew(); WGS.sel = 0;
  const lk = (typeof WGU !== 'undefined' && WGU.look) || { skin: 0, hair: 0, shirt: 0 }; p.look = lk;
  if (wl.st) { Object.assign(p, { x: wl.st.x, y: wl.st.y, hp: wl.st.hp, food: wl.st.food, armor: wl.st.armor || p.armor }); WGS.inv = wl.st.inv || WGS.inv; WGS.dim = wl.st.dim || 'o'; }
  WGS.cam.x = p.x; WGS.cam.y = p.y; WGS.scr = 'play'; wgToast('JOINED ' + wl.name, 3);
}
function wgnLeaveGame() { WGS.net = false; WGS.world = null; WGS.remote = []; WGS.scr = 'worlds'; WGS.ui = {}; }
function wgnMobs(list) {
  const old = new Map(WGS.mobs.map(m => [m.id, m])), out = [];
  for (const a of list) {
    let m = old.get(a[0]);
    if (!m) { m = { id: a[0], type: a[1], x: a[2], y: a[3], fr: 0, ft: 0, hurt: 0, flip: false, dim: WGS.dim, hp: a[6] }; }
    m.type = a[1]; m.tx = a[2]; m.ty = a[3]; m.flip = !!a[4]; m.fr = a[5]; m.hp = a[6]; m.hurt = a[7] / 10; m.dim = a[8]; out.push(m);
  }
  WGS.mobs = out;
}
function wgnStop() {
  if (WGN.role === 'host') wgnAll({ t: 'kick' }, null);
  for (const L of WGN.peers) wgnClose(L);
  for (const M of WGN.relays) if (M) M.close();
  if (WGN.link) { try { wgnSend(WGN.link, { t: 'bye' }); } catch (e) { /* */ } clearInterval(WGN.link.helloT); wgnClose(WGN.link); }
  WGN.peers = []; WGN.relays = []; WGN.link = null; WGN.role = null; WGN.q.length = 0; WGN.pub = false;
}

// ---------- the per-frame pump ----------
function wgnUpdate(dt) {
  if (!WGN.role) return;
  const now = performance.now();
  for (let n = 0; n < 200 && WGN.q.length; n++) { const [L, m] = WGN.q.shift(); if (WGN.role === 'host') wgnHostMsg(L, m); else wgnClientMsg(L, m); }
  for (const c of WGN.chat) c.t -= dt; WGN.chat = WGN.chat.filter(c => c.t > 0).slice(-6);
  const p = WGS.p; if (!p || !WGS.world) return;
  if (WGN.role === 'host') {
    WGS.remote = WGN.peers.filter(L => L.pid > 0).map(L => ({ pid: L.pid, x: L.x, y: L.y, face: L.face, moving: L.moving, walkT: L.walkT, dim: L.dim, hp: L.hp, name: L.name, look: L.look, swing: L.swing ? 0.1 : 0, inv: 0 }));
    for (const L of WGN.peers.slice()) if (L.pid > 0 && now - L.heard > 20000) wgnDrop(L, false);
    WGN.sendT -= dt;
    if (WGN.sendT <= 0) {
      WGN.sendT = 0.1;
      const l = [[0, Math.round(p.x), Math.round(p.y), p.face, p.moving ? 1 : 0, +p.walkT.toFixed(2), WGS.dim, p.hp, p.name, p.look, p.swing > 0 ? 1 : 0]];
      for (const L of WGN.peers) if (L.pid > 0) l.push([L.pid, Math.round(L.x), Math.round(L.y), L.face, L.moving ? 1 : 0, L.walkT, L.dim, L.hp, L.name, L.look, L.swing ? 1 : 0]);
      for (const L of WGN.peers) if (L.pid > 0) {
        wgnSend(L, { t: 'ps', l }, true);
        const ms = []; for (const m of WGS.mobs) if (m.dim === L.dim && Math.hypot(m.x - L.x, m.y - L.y) < 330) ms.push([m.id, m.type, Math.round(m.x), Math.round(m.y), m.flip ? 1 : 0, m.fr, m.hp, Math.round(m.hurt * 10), m.dim]);
        wgnSend(L, { t: 'mobs', l: ms }, true);
      }
    }
    WGN.clkT -= dt; if (WGN.clkT <= 0) { WGN.clkT = 2; wgnAll({ t: 'clk', c: WGS.clock, d: WGS.day, wk: WGS.wk || null, hd: WGS.dim }, null); }
    WGN.annT -= dt; if (WGN.annT <= 0) { WGN.annT = 6; wgnAnnounce(); }
  } else if (WGN.link && WGN.link.open) {
    WGN.sendT -= dt;
    if (WGN.sendT <= 0) { WGN.sendT = 0.066; wgnSend(WGN.link, { t: 'p', x: Math.round(p.x), y: Math.round(p.y), face: p.face, mv: p.moving ? 1 : 0, wt: +p.walkT.toFixed(2), dim: WGS.dim, hp: p.hp, sw: p.swing > 0 ? 1 : 0 }, true); }
    WGN.pgT = (WGN.pgT || 0) - dt; if (WGN.pgT <= 0) { WGN.pgT = 3; wgnSend(WGN.link, { t: 'ping', s: performance.now() }); }
    WGN.meT = (WGN.meT || 0) - dt; if (WGN.meT <= 0) { WGN.meT = 5; wgnSend(WGN.link, { t: 'me', hp: p.hp, food: p.food, inv: WGS.inv, armor: p.armor, sel: WGS.sel }); }
    // glide the mobs towards their last reported spot
    for (const m of WGS.mobs) if (m.tx !== undefined) { const k = Math.min(1, dt * 12); m.x += (m.tx - m.x) * k; m.y += (m.ty - m.y) * k; if (m.hurt > 0) m.hurt = Math.max(0, m.hurt - dt); }
    if (now - WGN.link.heard > 20000) { WGN.err = 'LOST THE CONNECTION'; wgnStop(); wgnLeaveGame(); }
  }
}
// ---------- the public list ----------
function wgnAnnounce() {
  if (!WGN.pub || WGN.role !== 'host') return;
  const m = JSON.stringify({ c: WGN.code, n: WGS.world.meta.name, h: WGS.p.name, p: 1 + WGN.peers.filter(q => q.pid > 0).length, x: WGN.max, d: WGS.world.meta.diff, v: WGN_PROTO, k: wgnPerm().pass ? 1 : 0 });
  for (const M of WGN.relays) if (M && M.up) M.pub(WGN_PUB, m);
}
function wgnBrowse() {
  WGN.listing = true; WGN.list = [];
  const seen = new Map(), Ms = NET_RELAYS.map(u => mqttOpen(u, WGN_PUB, (payload) => { try { const d = JSON.parse(payload); if (d && d.c && d.v === WGN_PROTO) { d.seen = performance.now(); seen.set(d.c, d); WGN.list = [...seen.values()]; } } catch (e) { /* */ } }, () => {}));
  setTimeout(() => { for (const M of Ms) M.close(); WGN.listing = false; }, 9000);
}
