'use strict';
// Wildgrove: the session (player, camera, time, inventory), the world renderer, mining, building and the game loop pieces.
// The main loop calls updateWG(dt) and drawWG() while G.state === 'wg'.
const WGS = {
  scr: 'worlds',            // worlds | create | play | pause | inv | chest | settings | dead | loading
  world: null, dim: 'o', t: 0, day: 0, clock: 0.3,
  p: null, inv: [], sel: 0, cursor: null, cam: { x: 0, y: 0 }, mobs: [], drops: [], parts: [], dmg: new Map(),
  target: null, mine: null, mid: 0, remote: [], net: false, readonly: false, toast: null, tf: 0, acc: 0, autosave: 0, ui: {},
};
const WG_DAY = 840;            // seconds per full day (a world can change it: meta.rules.dayLen)
const wgDayLen = () => (WGS.world && WGS.world.meta.rules && WGS.world.meta.rules.dayLen) || WG_DAY;
const WG_REACH = 56;           // px
const wgClamp = (v, a, b) => Math.max(a, Math.min(b, v));

function wgNewPlayer(x, y) {
  return { x, y, vx: 0, vy: 0, face: 'd', flip: false, hp: 20, maxHp: 20, food: 20, maxFood: 20, sat: 5, stam: 100, walkT: 0, moving: false, swing: 0, hurt: 0, inv: 0,
    buff: {}, armor: { head: null, body: null, feet: null }, xp: 0, spawn: null, name: 'WANDERER', look: { skin: 0, hair: 0, shirt: 0 } };
}

// ---------- inventory ----------
function wgInvNew() { return new Array(36).fill(null); }
// ---------- player options (kept with the other settings) ----------
const WG_KEYS = [['up', 'UP', 'KeyW'], ['down', 'DOWN', 'KeyS'], ['left', 'LEFT', 'KeyA'], ['right', 'RIGHT', 'KeyD'], ['bag', 'BAG', 'KeyE'], ['drop', 'DROP', 'KeyQ'], ['use', 'USE', 'KeyF'], ['run', 'RUN', 'ShiftLeft']];
function wgOpt() { const S = Save.settings; return S.wg || (S.wg = { part: 2, amb: 1, wx: 1, info: 0, hc: 0, slow: 0, keys: {} }); }
const wgKey = (n) => wgOpt().keys[n] || WG_KEYS.find(k => k[0] === n)[2];
const wgKeyName = (c) => c.replace('Key', '').replace('Arrow', '').replace('Left', ' L').replace('Right', ' R').toUpperCase();
function wgInvAdd(inv, id, n) {
  if (inv === WGS.inv && WGS.p) (WGS.p.seen || (WGS.p.seen = {}))[id] = 1; // recipe book: an item you have held unlocks its recipes
  const max = WGI[id].stack;
  for (let i = 0; i < inv.length && n > 0; i++) if (inv[i] && inv[i].id === id && inv[i].n < max) { const t = Math.min(n, max - inv[i].n); inv[i].n += t; n -= t; }
  for (let i = 0; i < inv.length && n > 0; i++) if (!inv[i]) { const t = Math.min(n, max); inv[i] = { id, n: t }; n -= t; }
  return n; // what did not fit
}
function wgInvCount(inv, id) { let c = 0; for (const s of inv) if (s && s.id === id) c += s.n; return c; }
function wgInvTake(inv, id, n) {
  for (let i = inv.length - 1; i >= 0 && n > 0; i--) if (inv[i] && inv[i].id === id) { const t = Math.min(n, inv[i].n); inv[i].n -= t; n -= t; if (!inv[i].n) inv[i] = null; }
  return n === 0;
}
function wgCanCraft(inv, r) { for (const k in r.in) if (wgInvCount(inv, k) < r.in[k]) return false; return true; }

// ---------- time of day ----------
// clock 0..1: 0.25 morning, 0.5 noon, 0.75 dusk, 0 / 1 midnight. night factor 0..1
function wgNight(clock) {
  const d = Math.abs(clock - 0.5) * 2; // 0 at noon, 1 at midnight
  return wgClamp((d - 0.55) / 0.3, 0, 1);
}
function wgAmbient() {
  if (WGS.dim === 'u') return 0.66;
  const w = WGS.weather ? WGS.weather.dark : 0;
  return wgClamp(wgNight(WGS.clock) * 0.78 + w, 0, 0.88);
}

// ---------- world access shortcuts ----------
const wgW = () => WGS.world;
const wgTileOf = (px) => Math.floor(px / 16);
function wgObjectAtT(tx, ty) { return wgObjAt(WGS.world, WGS.dim, tx, ty); }
function wgGroundAtT(tx, ty) { return GROUND[wgGround(WGS.world, WGS.dim, tx, ty)]; }
function wgSolidAt(px, py) {
  const tx = wgTileOf(px), ty = wgTileOf(py), o = wgObjAt(WGS.world, WGS.dim, tx, ty);
  if (o && OBJ[o].solid) {
    const ob = OBJ[o];
    if (ob.kind === 'tree') { const cx = tx * 16 + 8; return Math.abs(px - cx) < 5 && py > ty * 16 + 6; } // only the trunk
    if (ob.fence) return true;
    return true;
  }
  return false;
}
function wgBoxSolid(x, y, hw, hh) { return wgSolidAt(x - hw, y - hh) || wgSolidAt(x + hw, y - hh) || wgSolidAt(x - hw, y + hh) || wgSolidAt(x + hw, y + hh); }
function wgMoveBox(e, dx, dy, hw, hh) {
  if (dx) { const nx = e.x + dx; if (!wgBoxSolid(nx, e.y, hw, hh)) e.x = nx; else if (!wgBoxSolid(e.x + Math.sign(dx) * 0.5, e.y, hw, hh)) e.x += Math.sign(dx) * 0.5; else e.blockedX = true; }
  if (dy) { const ny = e.y + dy; if (!wgBoxSolid(e.x, ny, hw, hh)) e.y = ny; else if (!wgBoxSolid(e.x, e.y + Math.sign(dy) * 0.5, hw, hh)) e.y += Math.sign(dy) * 0.5; else e.blockedY = true; }
}

// ---------- effects ----------
function wgPart(x, y, n, o) {
  const po = wgOpt().part; if (!po) return; if (po === 1) n = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    if (WGS.parts.length > 260) WGS.parts.shift();
    const a = Math.random() * 6.283, s = (o.s || 30) * (0.4 + Math.random() * 0.8);
    WGS.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), g: o.g === undefined ? 90 : o.g, life: (o.life || 0.5) * (0.6 + Math.random() * 0.6), max: o.life || 0.5, c: o.c[Math.floor(Math.random() * o.c.length)], sz: o.sz || 1 });
  }
}
function wgToast(msg, t) { WGS.toast = { msg, t: t || 2 }; }
const WG_SFX = { pickup: 'item', break: 'brk', place: 'pop', swing: 'swish', hit: 'graze', shoot: 'eshoot' };
function wgSfx(n) { try { Audio_.sfx(WG_SFX[n] || n); } catch (e) { /* audio is optional */ } }

// ---------- drops ----------
function wgDrop(x, y, id, n, o) {
  if (!n) return;
  const a = Math.random() * 6.283;
  WGS.drops.push({ x, y, z: 6, vz: 70 + Math.random() * 40, vx: Math.cos(a) * 26, vy: Math.sin(a) * 18, id, n, age: 0, dim: WGS.dim, keep: o && o.keep });
}
function wgUpdateDrops(dt) {
  const p = WGS.p;
  for (let i = WGS.drops.length - 1; i >= 0; i--) {
    const d = WGS.drops[i];
    if (d.dim !== WGS.dim) continue;
    d.age += dt;
    d.vz -= 260 * dt; d.z += d.vz * dt;
    if (d.z < 0) { d.z = 0; d.vz = Math.abs(d.vz) > 40 ? -d.vz * 0.4 : 0; d.vx *= 0.7; d.vy *= 0.7; }
    const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt;
    if (!wgSolidAt(nx, d.y)) d.x = nx; else d.vx = 0;
    if (!wgSolidAt(d.x, ny)) d.y = ny; else d.vy = 0;
    d.vx *= 1 - Math.min(1, dt * 3); d.vy *= 1 - Math.min(1, dt * 3);
    const dx = p.x - d.x, dy = p.y - 4 - d.y, dist = Math.hypot(dx, dy);
    if (d.age > 0.5 && p.hp > 0) {
      if (dist < 30) { d.x += dx / dist * 150 * dt; d.y += dy / dist * 150 * dt; }
      if (dist < 8) {
        const left = wgInvAdd(WGS.inv, d.id, d.n);
        if (left < d.n) { wgSfx('select'); WGS.pickup = { id: d.id, n: d.n - left, t: 1.2 }; }
        if (left > 0) d.n = left; else { WGS.drops.splice(i, 1); }
      }
    }
    if (!d.keep && d.age > 300) WGS.drops.splice(i, 1);
  }
}

// ---------- mining and using ----------
function wgHeld() { const s = WGS.inv[WGS.sel]; return s ? Object.assign({ n: s.n }, WGI[s.id]) : null; }
function wgToolPower(it, o) {
  if (!it) return o.tool === 'hand' ? 1.1 : o.kind === 'tree' ? 0.8 : 0.5;
  if (it.kind === 'tool' && it.tool === o.tool) return TIERS[it.tier].pow * 1.4;
  if (it.kind === 'weapon' && it.weapon === 'sword' && (o.kind === 'plant')) return 3;
  return o.tool === 'hand' ? 1.1 : o.kind === 'tree' ? 0.8 : 0.45;
}
function wgBreak(tx, ty, byPlayer) {
  const w = WGS.world, dim = WGS.dim, id = wgObjAt(w, dim, tx, ty), o = OBJ[id];
  const cont = wgCont(w, dim, tx, ty, false);
  const cx = tx * 16 + 8, cy = ty * 16 + 10;
  if (cont) { for (const s of cont) if (s) wgDrop(cx, cy, s.id, s.n); }
  let drops = o.drops;
  if (o.kind === 'crop') { // ripe crops give the harvest; young ones just the seed back
    const st = wgMetaAt(w, dim, tx, ty);
    drops = st >= 3 ? o.drops : [[o.seed, 1, 1, 1]];
  }
  for (const [it, a, b, ch] of drops) if (Math.random() < ch) wgDrop(cx + (Math.random() - 0.5) * 8, cy, it, a + Math.floor(Math.random() * (b - a + 1)));
  if (o.pick) { wgSetObj(w, dim, tx, ty, O_ID[o.pick]); } // berry bush: back to bare
  else if (o.kind === 'tree' && o.sap && Math.random() < 0.3) wgSetObj(w, dim, tx, ty, O_ID[o.sap]);
  else wgSetObj(w, dim, tx, ty, 0);
  if (o.kind === 'rock' || o.kind === 'wall') wgPart(cx, cy, 8, { c: o.ramp || ['d', 'm', 'l'], s: 40, up: 30, life: 0.5 });
  else if (o.kind === 'tree') wgPart(cx, cy - 8, 10, { c: ['G', 'h', 'g', 'n'], s: 36, up: 20, life: 0.7, sz: 2 });
  else wgPart(cx, cy, 6, { c: ['G', 'h', 'H'], s: 30, up: 20, life: 0.5 });
  wgSfx(o.kind === 'rock' || o.kind === 'wall' ? 'break' : 'pickup');
}
function wgMineStep(dt, tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = wgObjAt(w, dim, tx, ty);
  if (!id) { WGS.mine = null; return; }
  const o = OBJ[id];
  if (o.hp > 9000) { WGS.mine = null; return; }
  const it = wgHeld();
  if (o.tier > 0 && !(it && it.kind === 'tool' && it.tool === o.tool && it.tier >= o.tier)) { if (!WGS.mine || WGS.mine.warn <= 0) wgToast('NEEDS A BETTER ' + (o.tool === 'pick' ? 'PICKAXE' : 'TOOL'), 1.2); WGS.mine = WGS.mine || { tx, ty, hp: o.hp, t: 0, warn: 1 }; WGS.mine.warn = 1; return; }
  let m = WGS.mine;
  if (!m || m.tx !== tx || m.ty !== ty) m = WGS.mine = { tx, ty, hp: o.hp, t: 0, warn: 0 };
  m.t += dt;
  const dig = WGS.p.buff.dig ? 1.4 : 1;
  const gap = 0.32;
  WGS.p.swing = 0.25;
  if (m.t >= gap) {
    m.t -= gap;
    m.hp -= wgToolPower(it, o) * dig * (it && it.kind === 'tool' ? 1 : 1);
    m.shake = 0.12;
    const cx = tx * 16 + 8, cy = ty * 16 + 8;
    wgPart(cx, cy, 3, { c: o.ramp || (o.kind === 'tree' ? ['n', 'N', 'u'] : ['d', 'm', 'l']), s: 26, up: 14, life: 0.35 });
    wgSfx(o.kind === 'tree' ? 'select' : 'select');
    if (m.hp <= 0) { wgBreak(tx, ty, true); WGS.mine = null; }
  }
}

// ---------- placing and interacting ----------
function wgCanPlaceAt(tx, ty, item) {
  const w = WGS.world, dim = WGS.dim;
  const px = WGS.p.x, py = WGS.p.y;
  if (item.placeG) { const g = wgGroundAtT(tx, ty); return !g.liq || false; }
  const g = wgGroundAtT(tx, ty), cur = wgObjAt(w, dim, tx, ty);
  if (cur) return false;
  const oid = O_ID[item.place];
  const o = OBJ[oid];
  if (g.liq && !(o && o.water)) return false;
  if (o && o.solid) { // not on top of anyone
    const x0 = tx * 16, y0 = ty * 16;
    if (px > x0 - 5 && px < x0 + 21 && py > y0 && py < y0 + 22) return false;
    for (const m of WGS.mobs) if (m.dim === dim && m.x > x0 - 4 && m.x < x0 + 20 && m.y > y0 - 2 && m.y < y0 + 20) return false;
  }
  if (item.place && item.place.startsWith('sap_') && !(g.id === 'grass' || g.id === 'dirt' || g.id === 'jungle' || g.id === 'sand' || g.id === 'snow' || g.id === 'mud' || g.id === 'tilled')) return false;
  return true;
}
function wgUse(tx, ty) { // right click on a tile: open, toggle, plant, place, eat...
  const w = WGS.world, dim = WGS.dim, id = wgObjAt(w, dim, tx, ty), o = id ? OBJ[id] : null;
  const s = WGS.inv[WGS.sel], it = s ? WGI[s.id] : null;
  const trd = WGS.mobs.find(m => m.type === 'trader' && Math.hypot(m.x - (tx * 16 + 8), m.y - 6 - (ty * 16 + 8)) < 26);
  if (trd && Math.hypot(trd.x - WGS.p.x, trd.y - WGS.p.y) < 60) { WGS.trade = trd.id; WGS.scr = 'trade'; WGS.ui = {}; wgSfx('select'); return true; }
  const mob = WGN.role !== 'client' && it && WGS.mobs.find(m => WG_MOBS[m.type].pas && Math.hypot(m.x - (tx * 16 + 8), m.y - 6 - (ty * 16 + 8)) < 20);
  if (mob) {
    if (it.id === 'shears' && mob.type === 'sheep') { if ((mob.shorn || 0) > WGS.t) { wgToast('ALREADY SHEARED'); return true; } mob.shorn = WGS.t + 150; wgDrop(mob.x, mob.y - 4, 'wool', 2 + Math.floor(Math.random() * 2)); wgSfx('pickup'); wgPart(mob.x, mob.y - 8, 6, { c: ['w', 'L'], s: 24, up: 14 }); return true; }
    if (it.id === 'wheat' && (mob.type === 'sheep' || mob.type === 'chicken')) {
      if ((mob.cool || 0) > WGS.t || mob.love > 0) { wgToast('NOT NOW'); return true; }
      if (WGS.mobs.filter(m => WG_MOBS[m.type].pas).length >= 14) { wgToast('TOO CROWDED'); return true; }
      wgInvTake(WGS.inv, 'wheat', 1); mob.love = 2.2; wgSfx('select'); return true;
    }
  }
  if (o) {
    if (o.kind === 'door') { wgSetObj(w, dim, tx, ty, O_ID[o.open ? o.id.replace('_open', '') : o.id + '_open']); wgSfx('door'); return true; }
    if (o.kind === 'storage') { WGS.chest = { tx, ty, dim }; WGS.scr = 'chest'; WGS.ui = {}; wgSfx('select'); return true; }
    if (o.kind === 'station') { if (o.st === 'fire' || o.st === 'furnace' || o.st === 'bench' || o.st === 'anvil' || o.st === 'alch' || o.st === 'loom') { WGS.scr = 'inv'; WGS.ui = { tab: 'craft' }; return true; } }
    if (o.kind === 'bed') { WGS.p.spawn = { x: tx * 16 + 8, y: ty * 16 + 20, dim }; wgToast('SPAWN POINT SET'); if (wgNight(WGS.clock) > 0.5 && dim === 'o') { WGS.clock = 0.27; WGS.day++; wgToast('GOOD MORNING'); } return true; }
    if (o.kind === 'stairs') { if (o.sky) wgGoSky(tx, ty); else if (o.skyup) wgLeaveSky(); else wgGoDim(o.down ? 'u' : 'o', tx, ty); return true; }
    if (o.kind === 'sign') { wgToast('SIGN: ' + (wgSignText(tx, ty) || 'EMPTY'), 3); return true; }
    if (o.kind === 'hive') { const n = wgMetaAt(w, dim, tx, ty); if (n > 0) { wgDrop(tx * 16 + 8, ty * 16 + 20, 'honey', n); wgSetObj(w, dim, tx, ty, id, 0); wgPart(tx * 16 + 8, ty * 16 + 8, 5, { c: ['y', 'Y', 'O'], s: 24, up: 14 }); } else wgToast('THE BEES ARE BUSY'); return true; }
    if (o.kind === 'well') { wgToast('FRESH WATER (+HP)'); WGS.p.hp = Math.min(WGS.p.maxHp, WGS.p.hp + 2); return true; }
    if (o.kind === 'plant' && o.pick) { wgBreak(tx, ty, true); return true; }
    if (o.kind === 'crop' && wgMetaAt(w, dim, tx, ty) >= 3) { wgBreak(tx, ty, true); wgSetObj(w, dim, tx, ty, id, 0); wgPart(tx * 16 + 8, ty * 16 + 8, 6, { c: ['y', 'Y', 'O'], s: 30, up: 20 }); return true; }
    if (o.kind === 'altar' && o.id === 'rift') {
      if (WGN.role === 'client') { wgToast('ONLY THE HOST CAN CALL IT'); return true; }
      if (it && it.id === 'star_bar' && s.n >= 3) {
        if (WGS.mobs.some(m => m.type === 'starwarden')) { wgToast('THE WARDEN IS ALREADY HERE'); return true; }
        wgInvTake(WGS.inv, 'star_bar', 3); const k = wgSpawnMob('starwarden', tx * 16 + 8, ty * 16 - 40); WGS.shake = 0.6; wgToast('THE STAR WARDEN AWAKENS!', 3); wgSfx('roar'); wgPart(k.x, k.y, 24, { c: ['y', 'Y', 'w'], s: 60, up: 20, life: 0.7 }); return true;
      }
      wgToast('THE RIFT WANTS 3 STAR BARS'); return true;
    }
    if (o.kind === 'altar') {
      if (WGN.role === 'client') { wgToast('ONLY THE HOST CAN CALL IT'); return true; }
      if (it && it.id === 'slime' && s.n >= 5) {
        if (WGS.mobs.some(m => m.type === 'slimeking')) { wgToast('THE KING IS ALREADY HERE'); return true; }
        wgInvTake(WGS.inv, 'slime', 5); const k = wgSpawnMob('slimeking', tx * 16 + 8, ty * 16 + 52); WGS.shake = 0.5; wgToast('THE SLIME KING WAKES!', 3); wgSfx('roar'); wgPart(k.x, k.y, 20, { c: ['g', 'h', 'H'], s: 50, up: 20, life: 0.6 }); return true;
      }
      wgToast('THE ALTAR WANTS 5 SLIME'); return true;
    }
    return false;
  }
  if (!s) return false;
  if (it.kind === 'place') {
    if (!wgCanPlaceAt(tx, ty, it)) return false;
    if (it.placeG) { wgSetGround(w, dim, tx, ty, G_ID[it.placeG]); }
    else { wgSetObj(w, dim, tx, ty, O_ID[it.place]); if (it.place === 'chest' || it.place === 'barrel') wgCont(w, dim, tx, ty, true); }
    wgInvTake(WGS.inv, s.id, 1); wgSfx('place'); wgPart(tx * 16 + 8, ty * 16 + 12, 4, { c: ['L', 'l'], s: 20, up: 10, life: 0.3 });
    return true;
  }
  if (it.kind === 'seed') {
    const g = wgGroundAtT(tx, ty);
    if (!g.tilled) { wgToast('PLANT ON TILLED SOIL'); return false; }
    const crop = it.crop;
    wgSetObj(w, dim, tx, ty, O_ID[crop === 'berrybush' ? 'berrybush' : 'crop_' + crop], 0);
    wgInvTake(WGS.inv, s.id, 1); wgSfx('place'); return true;
  }
  if (it.kind === 'tool' && it.tool === 'hoe') {
    const g = wgGroundAtT(tx, ty);
    if (g.id === 'grass' || g.id === 'dirt' || g.id === 'jungle' || g.id === 'mud') { wgSetGround(w, dim, tx, ty, G_ID.tilled); wgSfx('place'); wgPart(tx * 16 + 8, ty * 16 + 10, 5, { c: ['n', 'N', 'u'], s: 24, up: 14 }); return true; }
  }
  if (it.kind === 'tool' && it.tool === 'shovel') {
    const g = wgGroundAtT(tx, ty);
    if (g.id === 'grass' || g.id === 'jungle') { wgSetGround(w, dim, tx, ty, G_ID.path); wgSfx('place'); return true; }
    if (g.id === 'tilled') { wgSetGround(w, dim, tx, ty, G_ID.dirt); return true; }
  }
  if (it.kind === 'tool' && it.tool === 'bucket') {
    const g = wgGroundAtT(tx, ty);
    if (!it.full && g.liq === 'water') { wgInvTake(WGS.inv, 'bucket', 1); wgInvAdd(WGS.inv, 'bucket_water', 1); wgSfx('pickup'); return true; }
    if (it.full && !g.liq) { wgInvTake(WGS.inv, 'bucket_water', 1); wgInvAdd(WGS.inv, 'bucket', 1); wgWater(tx, ty); return true; }
  }
  if (it.kind === 'tool' && it.tool === 'rod') {
    const g = wgGroundAtT(tx, ty);
    if (g.liq === 'water') { WGS.fish = { tx, ty, t: 3 + Math.random() * 4 }; wgToast('FISHING...', 1.5); wgSfx('select'); return true; }
  }
  if (it.kind === 'tool' && it.tool === 'can') {
    const g = wgGroundAtT(tx, ty);
    if (g.tilled) { wgWater(tx, ty); return true; }
  }
  return false;
}
function wgWater(tx, ty) { WGS.wet = WGS.wet || new Map(); WGS.wet.set(WGS.dim + tx + ',' + ty, WGS.t + 240); wgPart(tx * 16 + 8, ty * 16 + 8, 6, { c: ['c', 'C', 'B'], s: 22, up: 16 }); wgSfx('select'); }
function wgSignText(tx, ty) { return (WGS.signs && WGS.signs[WGS.dim + tx + ',' + ty]) || ''; }
function wgEat(slot) {
  const s = WGS.inv[slot]; if (!s) return false;
  const it = WGI[s.id], p = WGS.p;
  if (it.kind !== 'food' || p.food >= p.maxFood && !it.buff) return false;
  p.food = Math.min(p.maxFood, p.food + it.food); p.sat = Math.min(p.maxFood, p.sat + it.food * 0.5);
  if (it.bad && Math.random() < 0.5) { p.hp = Math.max(1, p.hp - 2); wgToast('YUCK! RAW FOOD'); }
  if (it.buff) { p.buff[it.buff] = 90; wgToast(it.name + ': ' + it.buff.toUpperCase() + '!'); }
  wgInvTake(WGS.inv, s.id, 1); wgSfx('select'); wgPart(p.x, p.y - 12, 5, { c: ['y', 'O', 'Y'], s: 20, up: 24, g: -10 });
  return true;
}
function wgGoDim(dim, tx, ty) {
  WGS.dim = dim; WGS.mobs = []; WGS.mine = null;
  // arrive on the matching stairs, one tile below
  WGS.p.x = tx * 16 + 8; WGS.p.y = ty * 16 + 26;
  wgToast(dim === 'u' ? 'DOWN INTO THE CAVES' : dim === 'k' ? 'UP IN THE CLOUDS' : 'BACK TO THE SURFACE');
  wgSfx('door');
}

// ---------- stars: things to aim for ----------
const WG_ACH = [
  ['wood', 'FIRST WOOD', 'PICK UP SOME WOOD', (c) => c.seen.wood], ['stone', 'STONE AGE', 'MINE SOME STONE', (c) => c.seen.stone], ['bench', 'CRAFTSPERSON', 'MAKE A WORKBENCH', (c) => c.seen.bench],
  ['torch', 'LET THERE BE LIGHT', 'MAKE A TORCH', (c) => c.seen.torch], ['bed', 'HOME SWEET HOME', 'MAKE A BED', (c) => c.seen.bed], ['farm', 'GREEN THUMB', 'HARVEST A CROP', (c) => c.seen.wheat || c.seen.carrot || c.seen.potato || c.seen.pumpkin],
  ['bread', 'BAKER', 'BAKE BREAD', (c) => c.seen.bread], ['stew', 'CHEF', 'COOK A STEW', (c) => c.seen.stew], ['fish', 'CATCH OF THE DAY', 'CATCH A FISH', (c) => c.seen.fish], ['wool', 'SHEARER', 'SHEAR A SHEEP', (c) => c.seen.wool],
  ['copper', 'COPPER TOUCH', 'SMELT A COPPER BAR', (c) => c.seen.copper], ['iron', 'IRON WILL', 'SMELT AN IRON BAR', (c) => c.seen.iron], ['crystal', 'SHINY!', 'FIND A CRYSTAL', (c) => c.seen.crystal], ['starbar', 'STAR FORGED', 'MAKE A STAR BAR', (c) => c.seen.star_bar],
  ['armor', 'WELL DRESSED', 'WEAR HEAD, BODY AND FEET', (c) => c.p.armor.head && c.p.armor.body && c.p.armor.feet], ['cave', 'DEEP DIVER', 'GO DOWN INTO THE CAVES', (c) => c.st.cave],
  ['far', 'EXPLORER', 'WALK 600 TILES AWAY', (c) => c.st.far >= 600], ['kills10', 'HUNTER', 'DEFEAT 10 CREATURES', (c) => c.st.kills >= 10], ['kills50', 'SLAYER', 'DEFEAT 50 CREATURES', (c) => c.st.kills >= 50],
  ['day4', 'SURVIVOR', 'SEE THE FOURTH DAY', (c) => WGS.day >= 3], ['day11', 'VETERAN', 'SEE THE ELEVENTH DAY', (c) => WGS.day >= 10], ['king', 'KING OF SLIME', 'DEFEAT THE SLIME KING', (c) => c.st.slimeking], ['warden', 'STAR WARDEN', 'DEFEAT THE STAR WARDEN', (c) => c.st.starwarden],
  ['sky', 'HEAD IN THE CLOUDS', 'CLIMB TO THE SKY ISLANDS', (c) => c.st.sky],
  ['friend', 'BETTER TOGETHER', 'PLAY WITH A FRIEND', () => typeof WGN !== 'undefined' && WGN.role && (WGN.role === 'client' || WGN.peers.some(q => q.pid > 0))],
];
function wgAchTick() {
  const m = WGS.world && WGS.world.meta, p = WGS.p; if (!m || !p || WGS.net) return;
  const st = m.stats || (m.stats = { kills: 0, far: 0 }), ach = m.ach || (m.ach = {}), c = { seen: p.seen || {}, p, st };
  st.far = Math.max(st.far, Math.round(Math.hypot(p.x, p.y) / 16)); if (WGS.dim === 'u') st.cave = 1;
  for (const [id, name, , test] of WG_ACH) if (!ach[id] && test(c)) { ach[id] = WGS.day + 1; wgToast('STAR: ' + name, 3.5); wgSfx('confirm'); wgPart(p.x, p.y - 14, 12, { c: ['y', 'Y', 'w'], s: 40, up: 30, life: 0.8, sz: 2 }); }
}

// ---------- the wandering trader ----------
const WG_TRADES = [['copper', 2, 'seed_pumpkin', 3], ['wood', 12, 'sap_palm', 1], ['honey', 2, 'sap_jungle', 1], ['fish', 3, 'pearl', 1], ['bone', 6, 'arrow', 12], ['slime', 3, 'torch', 8], ['iron', 2, 'lantern', 1], ['crystal', 1, 'glow_berry', 4],
  ['pearl', 2, 'crystal', 1], ['leather', 4, 'rod', 1], ['petal_r', 4, 'banner', 1], ['clay', 6, 'planter', 1], ['stone', 20, 'statue', 1], ['wool', 6, 'couch', 1], ['apple', 4, 'sap_oak', 2], ['feather', 6, 'bow', 1], ['copper', 6, 'bucket', 1], ['glass', 4, 'lamppost', 1]];
function wgTradesOf(id) { const out = [], used = new Set(); for (let i = 0; out.length < 5 && i < 40; i++) { const k = hash(id, i, 61) % WG_TRADES.length; if (!used.has(k) && WGI[WG_TRADES[k][0]] && WGI[WG_TRADES[k][2]]) { used.add(k); out.push(WG_TRADES[k]); } } return out; }
