'use strict';
// Wildgrove rendering: cached chunk art (ground and soft edges), animated water and lava, objects sorted by depth,
// entities, the day-night light mask and weather. World pixels map to the play view with the camera at its centre.
const WGR = { lightCv: null, lights: [], frame: 0 };

const WG_TONED = { grass: 1, jungle: 1, sand: 1, snow: 1, dirt: 1, mud: 1, ash: 1 };
function wgTone(seed, x, y) { const n = WGW.f(seed + 40, x / 13, y / 13, 2); return n > 0.28 ? 2 : n < -0.3 ? 1 : 0; }
function wgChunkArt(ch) {
  const CS = WG.CS, [c, g] = wgCv(CS * 16, CS * 16), w = WGS.world, dim = ch.dim, X0 = ch.cx * CS, Y0 = ch.cy * CS;
  for (let j = 0; j < CS; j++) for (let i = 0; i < CS; i++) {
    const tx = X0 + i, ty = Y0 + j, gid = ch.g[j * CS + i], gr = GROUND[gid], v = hash(tx, ty, 77) & 3;
    if (gr.void) continue;
    if (!gr.liq) g.drawImage(wgGroundTex(gid, v, WG_TONED[gr.id] && dim === 'o' ? wgTone(w.seed, tx, ty) : 0), i * 16, j * 16);
    if (dim === 'k') wgSkyRim(g, i * 16, j * 16, GROUND[wgGround(w, dim, tx, ty - 1)].void, GROUND[wgGround(w, dim, tx + 1, ty)].void, GROUND[wgGround(w, dim, tx, ty + 1)].void, GROUND[wgGround(w, dim, tx - 1, ty)].void);
    else if (gid === G_ID.shallow) { g.fillStyle = 'rgba(201,245,255,0.18)'; g.fillRect(i * 16, j * 16, 16, 16); }
    // edges: every higher priority neighbour type grows into this tile
    const ng = new Array(8);
    let any = false;
    for (let k = 0; k < 8; k++) { const q = wgGround(w, dim, tx + WG_D8[k][0], ty + WG_D8[k][1]); ng[k] = q; if (q !== gid) any = true; }
    if (!any) continue;
    const kinds = new Set();
    for (let k = 0; k < 8; k++) { const q = ng[k]; if (q !== gid && GROUND[q].pri > gr.pri && !GROUND[q].floor && !GROUND[q].liq) kinds.add(q); }
    const order = [...kinds].sort((a, b) => GROUND[a].pri - GROUND[b].pri).slice(-3);
    for (const q of order) {
      let bits = 0;
      for (let k = 0; k < 4; k++) if (ng[k] === q) bits |= 1 << k;
      for (let k = 4; k < 8; k++) { // a diagonal only counts when neither side next to it already covers it
        const a = k === 4 ? 0 : k === 5 ? 1 : k === 6 ? 2 : 3, b = k === 4 ? 1 : k === 5 ? 2 : k === 6 ? 3 : 0;
        if (ng[k] === q && !(bits & (1 << a)) && !(bits & (1 << b))) bits |= 1 << k;
      }
      if (bits) g.drawImage(wgOverlay(q, bits, hash(tx, ty, 91) & 3, !!gr.liq && gr.liq === 'water'), i * 16, j * 16);
    }
  }
  ch.art = c; ch.artDirty = false; ch.artSe = wgSeason();
  return c;
}

const wgFrameT = () => Math.floor(WGS.t * 3) % 4;
function wgDrawLiquids(x0, y0, x1, y1, cx0, cy0) {
  const w = WGS.world, dim = WGS.dim, f = wgFrameT();
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const gr = GROUND[wgGround(w, dim, tx, ty)];
    if (!gr.liq) continue;
    const kind = gr.liq === 'lava' ? 'lava' : gr.id, pat = wgLiquid(kind, f);
    ctx.drawImage(pat, (tx & 1) * 16, (ty & 1) * 16, 16, 16, tx * 16 - cx0, ty * 16 - cy0, 16, 16);
  }
}

function wgIsWallLike(id) { if (!id) return false; const o = OBJ[id]; return o.kind === 'wall' && !o.fence || (o.kind === 'door' && !o.open); }
function wgDrawObj(id, tx, ty, sx, sy) {
  const o = OBJ[id], w = WGS.world, dim = WGS.dim, t = WGS.t;
  if (o.kind === 'wall' && !o.fence) {
    let mask = 0;
    if (wgIsWallLike(wgObjAt(w, dim, tx, ty - 1))) mask |= 1;
    if (wgIsWallLike(wgObjAt(w, dim, tx + 1, ty))) mask |= 2;
    if (wgIsWallLike(wgObjAt(w, dim, tx, ty + 1))) mask |= 4;
    if (wgIsWallLike(wgObjAt(w, dim, tx - 1, ty))) mask |= 8;
    ctx.drawImage(wgWall(id, mask, hash(tx, ty, 5) % 3), sx, sy - 6);
    return;
  }
  if (o.fence) {
    let mask = 0; const f = (a, b) => { const q = wgObjAt(w, dim, a, b); return q && (OBJ[q].fence || wgIsWallLike(q)); };
    if (f(tx, ty - 1)) mask |= 1; if (f(tx + 1, ty)) mask |= 2; if (f(tx, ty + 1)) mask |= 4; if (f(tx - 1, ty)) mask |= 8;
    shadow(sx + 8, sy + 15, 12); ctx.drawImage(wgFence(mask), sx, sy - 1); return;
  }
  const list = WGA.obj[o.id];
  if (!list) { // never leave a hole: a plain marker if a sprite is missing
    ctx.fillStyle = PAL.p; ctx.fillRect(sx + 4, sy + 4, 8, 8); return;
  }
  let st = 0;
  const m = wgMetaAt(w, dim, tx, ty);
  const sp = list[o.kind === 'crop' ? Math.min(m, list.length - 1) : hash(tx, ty, 3) % list.length], c = sp.c;
  const mine = WGS.mine && WGS.mine.tx === tx && WGS.mine.ty === ty && WGS.mine.shake > 0 ? Math.round(Math.sin(t * 60) * 1) : 0;
  if (o.kind === 'tree' || o.kind === 'rock' && c.height > 12) shadow(sx + 8, sy + 14, o.kind === 'tree' ? (c.width > 30 ? 20 : 14) : 14);
  const x = sx + sp.ox + mine, y = sy + sp.oy;
  if ((o.kind === 'tree' && o.tall >= 2) || o.id === 'tallgrass' || o.id === 'fern' || o.id === 'reeds' || o.id === 'wild_wheat' || o.id === 'beachgrass') { // only what really bends in the wind: not pumpkins, mushrooms or bushes
    // wind: the upper part leans a pixel back and forth, the roots stay put
    const sway = Math.round(Math.sin(t * 1.6 + tx * 0.7 + ty * 0.3) * (o.kind === 'tree' ? 0.9 : 1.1) + (WGS.weather && WGS.weather.wind ? WGS.weather.wind * Math.sin(t * 5 + tx) : 0));
    const cut = Math.floor(c.height * (o.kind === 'tree' ? 0.55 : 0.5));
    ctx.drawImage(c, 0, 0, c.width, cut, x + sway, y, c.width, cut);
    ctx.drawImage(c, 0, cut, c.width, c.height - cut, x, y + cut, c.width, c.height - cut);
  } else ctx.drawImage(c, x, y);
  if (o.light) WGR.lights.push({ x: sx + 8, y: sy + 8, r: o.light, f: o.kind === 'light' || o.st === 'fire' || o.st === 'furnace' ? 1 : 0.3 });
}

function wgDrawWorld() {
  const w = WGS.world, dim = WGS.dim, cam = WGS.cam, T = 16;
  const cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  const vx0 = cx0 - SCR.ox, vy0 = cy0 - SCR.oy, vx1 = vx0 + SCR.w, vy1 = vy0 + SCR.h;
  const x0 = Math.floor(vx0 / T) - 1, y0 = Math.floor(vy0 / T) - 1, x1 = Math.floor(vx1 / T) + 1, y1 = Math.floor(vy1 / T) + 2;
  WGR.lights.length = 0;
  fillScreen(dim === 'u' ? PAL['0'] : dim === 'k' ? PAL.B : PAL.b); if (dim === 'k') wgDrawSkyBack(cx0, cy0);
  wgDrawLiquids(x0, y0, x1, y1, cx0, cy0);
  const CS = WG.CS;
  for (let cy = Math.floor(y0 / CS); cy <= Math.floor(y1 / CS); cy++) for (let cx = Math.floor(x0 / CS); cx <= Math.floor(x1 / CS); cx++) {
    const ch = wgChunk(w, dim, cx, cy);
    ch.used = WGS.t;
    ctx.drawImage(ch.art && !ch.artDirty && ch.artSe === wgSeason() ? ch.art : wgChunkArt(ch), cx * CS * T - cx0, cy * CS * T - cy0);
  }
  // wet soil is darker
  if (WGS.wet) for (const [k, until] of WGS.wet) {
    if (until < WGS.t) { WGS.wet.delete(k); continue; }
    if (k[0] !== dim) continue;
    const [a, b] = k.slice(1).split(',').map(Number);
    if (a < x0 || a > x1 || b < y0 || b > y1 || !GROUND[wgGround(w, dim, a, b)].tilled) continue;
    ctx.fillStyle = 'rgba(43,26,71,0.28)'; ctx.fillRect(a * T - cx0, b * T - cy0, T, T);
  }
  // objects, with entities slotted in by depth
  const ents = wgEntities(x0 * T, y0 * T, x1 * T, (y1 + 2) * T);
  ents.sort((a, b) => a.y - b.y);
  let ei = 0;
  for (let ty = y0 - 3; ty <= y1; ty++) {
    for (let tx = x0 - 2; tx <= x1 + 2; tx++) {
      const id = wgObjAt(w, dim, tx, ty);
      if (id) wgDrawObj(id, tx, ty, tx * T - cx0, ty * T - cy0);
    }
    while (ei < ents.length && ents[ei].y < (ty + 1) * T) { ents[ei].draw(ents[ei], cx0, cy0); ei++; }
  }
  while (ei < ents.length) { ents[ei].draw(ents[ei], cx0, cy0); ei++; }
  return { cx0, cy0 };
}

// every drawable thing that moves: the player(s), mobs, dropped items
function wgEntities(x0, y0, x1, y1) {
  const out = [];
  for (const d of WGS.drops) if (d.dim === WGS.dim && d.x > x0 - 16 && d.x < x1 + 16 && d.y > y0 - 16 && d.y < y1 + 16) out.push({ x: d.x, y: d.y, d, draw: wgDrawDrop });
  for (const m of WGS.mobs) if (m.dim === WGS.dim && m.x > x0 - 40 && m.x < x1 + 40 && m.y > y0 - 40 && m.y < y1 + 40) out.push({ x: m.x, y: m.y, m, draw: wgDrawMob });
  if (WGS.p) out.push({ x: WGS.p.x, y: WGS.p.y, p: WGS.p, draw: wgDrawPlayer });
  for (const r of WGS.remote || []) if (r.dim === WGS.dim) out.push({ x: r.x, y: r.y, p: r, draw: wgDrawPlayer });
  return out;
}
function wgDrawDrop(e, cx0, cy0) {
  const d = e.d, sx = Math.round(d.x - cx0), sy = Math.round(d.y - cy0);
  const bob = Math.round(Math.sin(WGS.t * 3 + d.x) * 1.2);
  shadow(sx, sy, 8);
  const ic = wgIcon(d.id);
  ctx.drawImage(ic, sx - 8, sy - 14 - Math.round(d.z) + bob, 16, 16);
  if (d.n > 1) text(String(d.n), sx + 7, sy - 4 - Math.round(d.z), 'w', 2, 2);
}

// ---------- light and weather ----------
function wgDrawLight(cx0, cy0) {
  const amb = wgAmbient();
  const lights = WGR.lights;
  const p = WGS.p;
  // the hero carries a small glow in the dark; a lit torch in hand makes it bigger
  if (amb > 0.15 && p) { const h = WGS.inv[WGS.sel]; lights.push({ x: p.x - cx0, y: p.y - 10 - cy0, r: h && (h.id === 'torch' || h.id === 'lantern') ? 96 : WGS.dim === 'u' ? 64 : 30, f: 1 }); }
  if (amb < 0.06) return;
  const W = Math.ceil(SCR.w / 2), H = Math.ceil(SCR.h / 2);
  if (!WGR.lightCv || WGR.lightCv.width !== W || WGR.lightCv.height !== H) { WGR.lightCv = wgCv(W, H)[0]; }
  const L = WGR.lightCv.getContext('2d');
  L.globalCompositeOperation = 'source-over';
  L.clearRect(0, 0, W, H);
  const night = WGS.dim === 'u' ? 'rgba(10,8,30,' : 'rgba(18,12,56,';
  L.fillStyle = night + amb + ')'; L.fillRect(0, 0, W, H);
  L.globalCompositeOperation = 'destination-out';
  const punch = (cx, cy, r, a) => {
    L.fillStyle = 'rgba(0,0,0,' + a + ')';
    for (let y = -r; y <= r; y++) { const hw = Math.floor(Math.sqrt(r * r - y * y)); L.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); }
  };
  for (const l of lights) {
    const fl = l.f ? 1 + Math.sin(WGS.t * 9 + l.x * 0.3) * 0.04 : 1;
    const cx = Math.round((l.x + SCR.ox) / 2), cy = Math.round((l.y + SCR.oy) / 2), R = Math.round(l.r / 2 * fl);
    for (const [k, a] of [[1, 0.12], [0.88, 0.12], [0.76, 0.13], [0.64, 0.14], [0.52, 0.15], [0.4, 0.18], [0.28, 0.22], [0.16, 0.3]]) punch(cx, cy, Math.round(R * k), a);
  }
  L.globalCompositeOperation = 'source-over';
  const prev = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(WGR.lightCv, 0, 0, W, H, -SCR.ox, -SCR.oy, W * 2, H * 2);
  ctx.imageSmoothingEnabled = prev;
  // a warm glow round the flames: the same rings, tinted and added on top
  if (!WGR.warmCv || WGR.warmCv.width !== W || WGR.warmCv.height !== H) WGR.warmCv = wgCv(W, H)[0];
  const Wm = WGR.warmCv.getContext('2d'); Wm.clearRect(0, 0, W, H); Wm.fillStyle = 'rgba(255,140,40,0.05)';
  for (const l of lights) if (l.f && l.r > 40) {
    const cx = Math.round((l.x + SCR.ox) / 2), cy = Math.round((l.y + SCR.oy) / 2), R = Math.round(l.r / 2 * 0.8);
    for (const k of [1, 0.8, 0.6, 0.4, 0.22]) { const r = Math.round(R * k); for (let y = -r; y <= r; y++) { const hw = Math.floor(Math.sqrt(r * r - y * y)); Wm.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); } }
  }
  ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(WGR.warmCv, 0, 0, W, H, -SCR.ox, -SCR.oy, W * 2, H * 2);
  ctx.globalCompositeOperation = 'source-over';
}
function wgDrawSky() { // dawn and dusk colour over the whole surface
  if (WGS.dim === 'u') return;
  const c = WGS.clock;
  let a = 0, col = '255,120,50';
  if (c > 0.6 && c < 0.8) a = Math.sin((c - 0.6) / 0.2 * Math.PI) * 0.16;
  else if (c > 0.18 && c < 0.34) { a = Math.sin((c - 0.18) / 0.16 * Math.PI) * 0.12; col = '255,170,120'; }
  if (a > 0.01) fillScreen('rgba(' + col + ',' + a.toFixed(3) + ')');
  const s = wgSeason(); // a faint wash of the season: warm gold autumn, cold blue winter
  if (s === 2) fillScreen('rgba(255,140,30,0.15)'); else if (s === 3) fillScreen('rgba(200,225,255,0.2)'); else if (s === 0) fillScreen('rgba(255,170,220,0.05)');
}

// ---------- ambient life: butterflies by day, fireflies by night, drifting leaves and desert dust (no entities, nothing saved) ----------
function wgDrawAmbient(cx0, cy0) {
  if (WGS.dim !== 'o' || !wgOpt().amb) return;
  const w = WGS.world, t = WGS.t, night = wgNight(WGS.clock), C = 80, gx0 = Math.floor(cx0 / C) - 1, gy0 = Math.floor(cy0 / C) - 1, gx1 = Math.floor((cx0 + SCR.w) / C) + 1, gy1 = Math.floor((cy0 + SCR.h) / C) + 1;
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const h = hash(gx, gy, 4242), ax = gx * C + (h & 63), ay = gy * C + ((h >>> 6) & 63), b = wgSurface(w.seed, Math.floor(ax / 16), Math.floor(ay / 16)).b, ph = (h >>> 12) % 628 / 100;
    const sx = (n, k) => Math.round(ax + Math.sin(t * 0.5 * k + ph + n) * 22 - cx0), sy = (n, k) => Math.round(ay + Math.cos(t * 0.37 * k + ph * 1.7 + n) * 14 - cy0);
    const se = wgSeason();
    if (se !== 1 && h % 2 === 0 && b !== 'desert' && b !== 'volcano' && b !== 'beach' && !(se === 3 && b === 'jungle')) { // petals, falling leaves, snowflakes
      const k = (t * (se === 3 ? 0.3 : 0.2) + ph) % 1, x = Math.round(ax + Math.sin(t * 1.1 + ph) * 9 + k * 26 - cx0), y = Math.round(ay - 36 + k * 84 - cy0);
      if (se === 3) { rect(x, y, 2, 2, 'w'); rect(x + 14, y + 20, 1, 1, 'w'); rect(x - 20, y + 9, 2, 2, 'w'); }
      else if (b === 'meadow' || b === 'forest' || b === 'highland' || b === 'swamp' || b === 'jungle') { rect(x, y, 2, 1, se === 0 ? 'P' : (h >>> 9) % 2 ? 'O' : 'o'); rect(x + 1, y + 1, 1, 1, se === 0 ? 'p' : 'n'); }
    }
    if (night < 0.35 && (b === 'meadow' || b === 'forest' || b === 'highland') && h % 3 === 0) {
      for (let n = 0; n < 2; n++) {
        const x = sx(n * 2, 1), y = sy(n * 2, 1) - Math.round(Math.abs(Math.sin(t * 3 + n)) * 3), col = ['P', 'y', 'c', 'O', 'w'][(h >>> 20) % 5], f = Math.floor(t * 9 + n) % 2;
        shadow(x, y + 10, 3); rect(x, y, 1, 1, '0'); rect(x - 1 - f, y - 1, 1 + f, 1 + f, col); rect(x + 1, y - 1, 1 + f, 1 + f, col);
      }
    } else if (night > 0.4 && (b === 'forest' || b === 'swamp' || b === 'jungle' || b === 'meadow') && h % 2 === 0) {
      for (let n = 0; n < 3; n++) { const a = 0.35 + Math.sin(t * 2.2 + n * 2 + ph) * 0.35; if (a > 0.15) { const x = sx(n * 3, 0.8), y = sy(n * 3, 0.8) - 6; ctx.globalAlpha = Math.min(1, a * 0.35); rect(x - 1, y - 1, 3, 3, 'y'); ctx.globalAlpha = Math.min(1, a + 0.3); rect(x, y, 1, 1, 'Y'); ctx.globalAlpha = 1; } }
    } else if ((b === 'forest' || b === 'jungle') && h % 2 === 1) {
      const k = (t * 0.25 + ph) % 1, x = Math.round(ax + Math.sin(t * 1.3 + ph) * 8 + k * 30 - cx0), y = Math.round(ay - 40 + k * 90 - cy0);
      rect(x, y, 2, 1, (h >>> 9) % 2 ? 'O' : 'g'); rect(x + 1, y + 1, 1, 1, 'n');
    } else if (b === 'volcano' && h % 2 === 0) { // embers rising off the ash
      for (let n = 0; n < 3; n++) { const k = (t * 0.35 + ph + n * 0.33) % 1, x = Math.round(ax + Math.sin(t + n * 2 + ph) * 6 + n * 14 - cx0), y = Math.round(ay + 30 - k * 70 - cy0); ctx.globalAlpha = 1 - k; rect(x, y, 1, 1, n % 2 ? 'O' : 'o'); ctx.globalAlpha = 1; }
    } else if (b === 'desert' && h % 2 === 0) {
      const k = (t * 0.6 + ph) % 1, x = Math.round(ax - 60 + k * 160 - cx0), y = Math.round(ay + Math.sin(k * 9) * 3 - cy0);
      ctx.globalAlpha = 0.6; rect(x, y, 3, 1, 'A'); rect(x + 5, y + 1, 2, 1, 'a'); ctx.globalAlpha = 1;
    }
  }
}
