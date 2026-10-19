'use strict';
// Wildgrove: a sled. Held on snow it carries the hero sitting on it, quicker than walking (`WG_SLED`, the snow made quick
// while the hero's move runs, then put back), and let go of the keys it glides on a little way (`WGSD.vx`, `vy`). It
// leaves two thin runner tracks in the snow that fade in `WG_SLED_MARK` s instead of footprints (a `wgPrintStep`
// wrapper), friends' too: a guest sends `sl` in the `p` message and the host lists it at index 17 of `ps` (wg_net), so
// friends are drawn sledding. Each screen its own tracks, never saved. The SNOW DAY star after 100 tiles sledded.
const WG_SLED = 1.8, WG_SLED_GLIDE = 2.4, WG_SLED_MARK = 12, WG_SLED_MARKS = 200; // speed on snow; how fast a glide dies away; tracks
const WGSD = { vx: 0, vy: 0, marks: [], last: new Map(), w: null };
(function () {
  wgItem('sled', 'SLED', 'res', { stack: 1 }); wgRec('sled', 1, { wood: 5, iron: 1, string: 2 }, 'bench');
  WG_ACH.push(['sled', 'SNOW DAY', 'SLED 100 TILES ON SNOW', (c) => (c.st.sled | 0) >= 100]);
})();
const wgOnSnow = (q, dim) => { const g = GROUND[wgGround(WGS.world, dim, Math.floor(q.x / 16), Math.floor(q.y / 16))]; return !!(g && g.id === 'snow'); };
const wgSledHeld = () => { const s = WGS.inv && WGS.inv[WGS.sel]; return !!(s && s.id === 'sled'); };
const wgSledding = () => { const p = WGS.p; return !!(WGS.world && p && wgSledHeld() && !p.sit && p.face !== 'S' && wgOnSnow(p, WGS.dim)); };
const wgSledFriend = (q) => !!q.sled && q.dim === WGS.dim && q.face !== 'S' && wgOnSnow(q, q.dim);
function wgSledTrack(key, q, dim) { // two runner lines from where the sled was to where it is
  const was = WGSD.last.get(key), x = q.x, y = q.y;
  if (!was || was.dim !== dim) { WGSD.last.set(key, { x, y, dim }); return; }
  const d = Math.hypot(x - was.x, y - was.y); if (d < 4) return;
  WGSD.last.set(key, { x, y, dim }); if (d > 24 || !wgOnSnow(q, dim) || !wgOnSnow(was, dim)) return;
  const side = Math.abs(x - was.x) > Math.abs(y - was.y); // going across: the runners one above the other; up or down: side by side
  for (const o of [-3, 3]) WGSD.marks.push({ x0: Math.round(was.x + (side ? 0 : o)), y0: Math.round(was.y + (side ? o * 0.5 : 0)), x1: Math.round(x + (side ? 0 : o)), y1: Math.round(y + (side ? o * 0.5 : 0)), d: dim, t: WGS.t });
  while (WGSD.marks.length > WG_SLED_MARKS) WGSD.marks.shift();
}
const _wgUpdSled = updateWG;
updateWG = function (dt) {
  const w = WGS.world, p = WGS.p; if (WGSD.w !== w) { WGSD.w = w; WGSD.marks.length = 0; WGSD.last.clear(); WGSD.vx = WGSD.vy = 0; }
  const on = WGS.scr === 'play' && wgSledding();
  if (!on) { WGSD.vx = WGSD.vy = 0; _wgUpdSled(dt); }
  else {
    const g = GROUND[G_ID.snow], s0 = g.speed, x0 = p.x, y0 = p.y;
    g.speed = s0 * WG_SLED; try { _wgUpdSled(dt); } finally { g.speed = s0; }
    const mx = p.x - x0, my = p.y - y0;
    if (p.moving && dt > 0 && Math.hypot(mx, my) < 8) { WGSD.vx = mx / dt; WGSD.vy = my / dt; }
    else if (!p.moving && WGS.scr === 'play' && wgSledding() && (WGSD.vx || WGSD.vy)) { // let go: it runs on, slower and slower
      const k = Math.exp(-dt * WG_SLED_GLIDE); WGSD.vx *= k; WGSD.vy *= k;
      if (Math.hypot(WGSD.vx, WGSD.vy) < 6) WGSD.vx = WGSD.vy = 0;
      else { const ax = p.x; wgMoveBox(p, WGSD.vx * dt, 0, 4, 2); if (p.x === ax) WGSD.vx = 0; const ay = p.y; wgMoveBox(p, 0, WGSD.vy * dt, 4, 2); if (p.y === ay) WGSD.vy = 0; }
    } else WGSD.vx = WGSD.vy = 0;
    const d = Math.hypot(p.x - x0, p.y - y0); if (d > 0 && d < 8) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.sled = Math.min(99999, (st.sled || 0) + d / 16); }
  }
  if (!w || !p || WGS.scr !== 'play') return;
  const L = WGSD.marks; while (L.length && (WGS.t - L[0].t > WG_SLED_MARK || L[0].t > WGS.t)) L.shift();
  if (wgSledding()) wgSledTrack(-1, p, WGS.dim); else WGSD.last.delete(-1);
  for (const q of WGS.remote || []) if (wgSledFriend(q)) wgSledTrack(q.pid, q, q.dim); else WGSD.last.delete(q.pid);
};
const _wgPrintSled = wgPrintStep;
wgPrintStep = function (key, q, dim, walkT, skip) { // a sled leaves runner tracks, not footprints
  return _wgPrintSled(key, q, dim, walkT, skip || (key === -1 ? wgSledding() : wgSledFriend(q)));
};
const _wgUpkeepSled = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) { // the tracks, on the snow under everything that stands
  _wgUpkeepSled(w, dim, cx0c, cy0c, cx1c, cy1c);
  const L = WGSD.marks; if (!L.length || w !== WGS.world) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2, T = WGS.t;
  ctx.fillStyle = PAL.l;
  for (const m of L) {
    if (m.d !== dim) continue;
    const sx = m.x0 - cx0, sy = m.y0 - cy0; if (sx < -SCR.ox - 30 || sy < -SCR.oy - 30 || sx > SCR.w - SCR.ox + 30 || sy > SCR.h - SCR.oy + 30) continue;
    const age = T - m.t; ctx.globalAlpha = age < WG_SLED_MARK * 0.5 ? 0.7 : age < WG_SLED_MARK * 0.8 ? 0.45 : 0.2; // fading in three steps
    const dx = m.x1 - m.x0, dy = m.y1 - m.y0, n = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i < n; i++) ctx.fillRect(Math.round(sx + dx * i / n), Math.round(sy + dy * i / n), 1, 1);
  }
  ctx.globalAlpha = 1;
};
const _wgDrawPlayerSled = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) { // sitting on the sled: side on the legs stretched out to its curled front, end on the boots in front
  const p = e.p, on = p === WGS.p ? wgSledding() : wgSledFriend(p);
  if (!on || p.hidden) return _wgDrawPlayerSled(e, cx0, cy0);
  if (p.inv > 0 && Math.floor(WGS.t * 20) % 2) return;
  const sx = Math.round(p.x - cx0), sy = Math.round(p.y - cy0), side = p.face === 'l' || p.face === 'r', S = wgSledArt(side ? p.face : 'd'), look = p.look || { skin: 0, hair: 0, shirt: 0 };
  shadow(sx, sy + 1, side ? 16 : 12);
  if (side) { // drawn facing left, mirrored about the hero for right, as the walking hero is; the rider sits at the back
    ctx.drawImage(S, sx - (S.width >> 1), sy - S.height + 2);
    ctx.save(); ctx.translate(sx, 0); if (p.face === 'r') ctx.scale(-1, 1);
    ctx.drawImage(wgSledLegs(), -11, sy - 11); ctx.drawImage(wgPlayerSpr('l', 0, look), 0, 0, 18, 18, -6, sy - 23, 18, 18); ctx.restore();
  } else { // end on: sitting down in it, the sled's front over the hips and the boots up on it (none seen from behind)
    const spr = wgPlayerSpr(p.face === 'u' ? 'u' : 'd', 0, look);
    ctx.drawImage(spr, 0, 0, 18, 19, sx - 9, sy - 23, 18, 19); ctx.drawImage(S, sx - (S.width >> 1), sy - S.height + 2);
    if (p.face !== 'u') ctx.drawImage(spr, 0, 21, 18, 5, sx - 9, sy - 6, 18, 5);
  }
  if (p.name && p !== WGS.p) wgRawText(p.name, sx, sy - 31, 'w', 2, 1);
};
function wgSledLegs() { // side on, facing left: trousers along the seat, the boots at the front with their toes up
  return WGA.cache.sled_legs || wgMake('sled_legs', 15, 7, (g) => {
    wgRc(g, 5, 4, 9, 2, 'u'); wgRc(g, 5, 4, 9, 1, 'n'); // the legs
    wgRc(g, 3, 2, 2, 4, 'x'); wgPx(g, 3, 2, 'X'); // the boots
  });
}
function wgSledArt(k) { // side on (facing left, mirrored for right): red slats on curled runners; end on: the slats between two runners
  const key = 'sled_' + k; if (WGA.cache[key]) return WGA.cache[key];
  if (k === 'r') { const L = wgSledArt('l'), [c, g] = wgCv(L.width, L.height); g.scale(-1, 1); g.drawImage(L, -L.width, 0); return (WGA.cache[key] = c); }
  if (k === 'l') return wgMake(key, 22, 7, (g) => {
    wgRc(g, 3, 1, 17, 2, 'r'); wgRc(g, 3, 1, 17, 1, 'R'); wgRc(g, 19, 1, 1, 2, 'p'); // the seat of slats
    wgPx(g, 6, 3, 'n'); wgPx(g, 16, 3, 'n'); wgRc(g, 2, 4, 19, 1, 'l'); wgPx(g, 1, 3, 'l'); wgPx(g, 1, 2, 'm'); wgPx(g, 2, 1, 'm'); // the runner curling up in front
  });
  return wgMake(key, 16, 8, (g) => { wgRc(g, 3, 1, 10, 4, 'r'); wgRc(g, 3, 1, 10, 1, 'R'); wgRc(g, 12, 2, 1, 3, 'p'); wgRc(g, 2, 2, 1, 4, 'l'); wgRc(g, 13, 2, 1, 4, 'm'); wgPx(g, 2, 1, 'l'); wgPx(g, 13, 1, 'm'); });
}
const _wgTipSled = wgTipLines;
wgTipLines = function (s) { const L = _wgTipSled(s); if (s.id === 'sled') L.push('HOLD IT TO SLED ON SNOW', 'LET GO AND IT RUNS ON'); return L; };
const _wgIconSled = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (id !== 'sled' || WGA.cache[key]) return _wgIconSled(id);
  const c = wgMake(key, 16, 16, (g) => { wgRc(g, 3, 6, 11, 3, 'r'); wgRc(g, 3, 6, 11, 1, 'R'); wgRc(g, 13, 6, 1, 3, 'p'); wgPx(g, 5, 9, 'n'); wgPx(g, 11, 9, 'n'); wgRc(g, 2, 10, 12, 1, 'l'); wgPx(g, 1, 9, 'l'); wgPx(g, 1, 8, 'm'); wgPx(g, 2, 7, 'm'); });
  WGA.cache[key] = c; return c;
};
