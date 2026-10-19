'use strict';
// Wildgrove: the breeze pack. A kite held in hand flies high over its hero outdoors, trailing behind as they walk and
// bobbing more in the rain (USE gives it a tug); friends see each other's kites, since the kite's colour rides along
// with the hero's position. Pinwheels in the five petal colours spin in the garden. Ids are appended, so old worlds
// stay valid.
const WG_KITES = [['r', 'RED', ['p', 'r', 'R']], ['y', 'YELLOW', ['o', 'y', 'Y']], ['b', 'BLUE', ['b', 'B', 'c']]]; // shade, base, light
const WGKT = new Map(); // each flying kite's place in the sky, by hero (-1 is you, else a friend's pid), and its tug
(function () {
  for (const [k, c] of WG_KITES) { wgItem('kite_' + k, c + ' KITE', 'res', { stack: 1 }); wgRec('kite_' + k, 1, { stick: 2, string: 3, ['petal_' + k]: 2 }, 'hand'); }
  for (const [k, c] of WG_POTS) {
    wgObj('pinwheel_' + k, { name: c + ' PINWHEEL', kind: 'deco', tool: 'hand', hp: 1, solid: 0, drops: [DR('pinwheel_' + k, 1, 1)] });
    wgItem('pinwheel_' + k, c + ' PINWHEEL', 'place', { place: 'pinwheel_' + k }); PLACE['pinwheel_' + k] = 'pinwheel_' + k; wgRec('pinwheel_' + k, 1, { stick: 1, ['petal_' + k]: 2 }, 'hand');
  }
  WG_ACH.push(['kite', 'HIGH FLYER', 'FLY A KITE FOR A MINUTE', (c) => (c.st.kite || 0) >= 60]);
})();
function wgKiteHeld() { // the colour of the kite in hand, 1 to 3, or 0
  const s = WGS.inv && WGS.inv[WGS.sel]; if (!s || !s.id.startsWith('kite_')) return 0;
  return WG_KITES.findIndex(k => 'kite_' + k[0] === s.id) + 1;
}
const wgKiteSky = () => WGS.dim === 'o' || WGS.dim === 'k'; // no wind underground
const _wgUseBreeze = wgUse;
wgUse = function (tx, ty) {
  if (_wgUseBreeze(tx, ty)) return true;
  if (!wgKiteHeld() || !wgKiteSky()) return false;
  const K = WGKT.get(-1); if (K) K.tug = WGS.t; wgSfx('swing'); // a tug on the string
  return true;
};
const _wgUpdBreeze = updateWG;
updateWG = function (dt) {
  _wgUpdBreeze(dt);
  if (WGS.scr !== 'play' || !WGS.world || !wgKiteHeld() || !wgKiteSky()) return;
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.kite = Math.min(9999, (st.kite || 0) + dt);
};
const _wgTipBreeze = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipBreeze(s);
  if (s.id.startsWith('kite_')) L.push('HOLD IT TO FLY IT OUTDOORS', 'USE IT TO GIVE A TUG');
  else if (s.id.startsWith('pinwheel_')) L.push('SPINS IN THE BREEZE');
  return L;
};

// ---------- the kites in the sky: drawn after the world, each with its string, its tail and its shadow ----------
const _wgAmbBreeze = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbBreeze(cx0, cy0);
  if (!WGS.p || !wgKiteSky()) { WGKT.clear(); return; }
  const live = new Set(), mine = wgKiteHeld();
  if (mine && !WGS.p.hidden) { wgKiteDraw(-1, WGS.p, mine, cx0, cy0); live.add(-1); }
  for (const q of WGS.remote || []) if (q.kite && q.dim === WGS.dim) { wgKiteDraw(q.pid, q, q.kite, cx0, cy0); live.add(q.pid); }
  for (const k of WGKT.keys()) if (!live.has(k)) WGKT.delete(k); // a kite put away starts from the hand next time
};
function wgKiteDraw(id, p, kind, cx0, cy0) {
  const t = WGS.t, wind = WGS.weather ? 1.6 : 1, ph = ((id + 1) * 2.3) % 6.28;
  let K = WGKT.get(id); if (!K) WGKT.set(id, K = { x: p.x + 4, y: p.y - 20, lt: t, tug: -9 });
  const dt = Math.min(0.1, Math.max(0, t - K.lt)); K.lt = t;
  const tug = t - K.tug < 0.6 ? Math.sin((t - K.tug) / 0.6 * 3.14) * 14 : 0;
  const gx = p.x + 30 + Math.sin(t * 0.35 * wind + ph) * 16 * wind, gy = p.y - 66 + Math.sin(t * 0.8 * wind + ph) * 5 * wind - tug; // where the breeze holds it
  if (Math.hypot(gx - K.x, gy - K.y) > 240) { K.x = gx; K.y = gy; } // after a trip home it is simply up there
  K.x += (gx - K.x) * Math.min(1, dt * 1.4); K.y += (gy - K.y) * Math.min(1, dt * 1.4); // it trails behind a walking hero
  const kx = Math.round(K.x - cx0), ky = Math.round(K.y - cy0), hx = Math.round(p.x - cx0) + 4, hy = Math.round(p.y - cy0) - 14;
  shadow(kx, Math.round(p.y - cy0) + 6, 6);
  // the string, sagging a little between the hand and the kite
  const bx = kx, by = ky + 6, mx = (hx + bx) / 2, my = (hy + by) / 2 + 12, n = Math.ceil(Math.hypot(bx - hx, by - hy));
  ctx.globalAlpha = 0.85;
  for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; rect(Math.round(v * v * hx + 2 * v * u * mx + u * u * bx), Math.round(v * v * hy + 2 * v * u * my + u * u * by), 1, 1, 'L'); }
  ctx.globalAlpha = 1;
  // the tail: a wavy line with little bows
  const c = WG_KITES[kind - 1][2];
  for (let i = 1; i <= 12; i++) {
    const x = Math.round(kx - i * 0.6 + Math.sin(t * 5 * wind - i * 0.6) * 1.5), y = ky + 6 + i;
    rect(x, y, 1, 1, 'L'); if (i % 4 === 0) { rect(x - 1, y, 3, 1, c[1]); rect(x - 1, y, 1, 1, c[2]); }
  }
  ctx.drawImage(wgKiteSpr(kind), kx - 6, ky - 7);
}
function wgKiteSpr(kind) { // a diamond kite in four panels, lit from the top left, with its spars
  const key = 'kite' + kind; if (WGA.cache[key]) return WGA.cache[key];
  const [s, b, l] = WG_KITES[kind - 1][2];
  return (WGA.cache[key] = wgMake(key, 13, 15, (g) => {
    for (let y = 1; y <= 13; y++) {
      const half = y <= 5 ? y - 1 : Math.round((13 - y) * 5 / 8);
      for (let x = 6 - half; x <= 6 + half; x++) wgPx(g, x, y, y <= 5 ? (x <= 6 ? l : b) : (x <= 6 ? b : s));
    }
    wgLine(g, 6, 1, 6, 13, 'N'); wgLine(g, 2, 5, 10, 5, 'N'); wgPx(g, 6, 5, 'n'); // the spars
  }));
}

// ---------- art: a pinwheel on a stick, its four blades turning (four frames, a quarter turn) ----------
const _wgBuildBreeze = wgBuildAll;
wgBuildAll = function () {
  _wgBuildBreeze();
  for (const [k, , c] of WG_POTS) {
    wgReg('pinwheel_' + k, [0, 1, 2, 3].map(f => wgMake('pinwheel_' + k + f, 13, 22, (g) => {
      wgRc(g, 6, 9, 1, 12, 'n'); wgRc(g, 6, 9, 1, 3, 'N'); // the stick
      for (let y = 1; y <= 11; y++) for (let x = 1; x <= 11; x++) {
        const dx = x - 6, dy = y - 6, r = Math.hypot(dx, dy); if (r > 5.2 || r < 0.5) continue;
        const q = ((Math.atan2(dy, dx) - f * Math.PI / 8) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2), a = q % (Math.PI / 2), w = Math.floor(q / (Math.PI / 2)) % 2; // the angle within a blade's quarter, every other blade lighter
        if (a < 0.95) wgPx(g, x, y, w ? (a < 0.45 ? 'w' : k === 'w' ? 'C' : c[2]) : a < 0.45 ? c[1] : c[0]); // each blade folded in two tones, light and dark blades in turn
      }
      wgPx(g, 6, 6, 'y'); // the pin
    })));
    OBJ[O_ID['pinwheel_' + k]].anim = 1;
  }
};
const _wgIconBreeze = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || !id.startsWith('kite_')) return _wgIconBreeze(id);
  const kind = WG_KITES.findIndex(k => 'kite_' + k[0] === id) + 1, [c, g] = wgCv(16, 16);
  g.drawImage(wgKiteSpr(kind), 0, 0, 13, 15, 1, 0, 13, 15);
  WGA.cache[key] = c; return c;
};
