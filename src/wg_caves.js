'use strict';
// Wildgrove: cave life. Underground, one rock face in `WG_GLOW_ONE` (a natural wall with open floor below it) holds a
// cluster of glow worms (`wgGlowAt`, from the tile and the seed): each hangs a fine silk thread with a bead of light at
// its end, twinkling on its own beat, drawn by a `wgDrawLight` wrapper over the dark. Now and then water drips from a
// face near the hero (`WGCV.drips`, at most `WG_DRIP_MAX`): a drop falls, splashes in a few specks and plips (the
// `drip` sound), each screen its own. Ambient life, off with the option. The first glow worms seen up close light
// GLOW WORMS.
const WG_GLOW_ONE = 3, WG_GLOW_SEE = 48, WG_DRIP_MAX = 4, WG_DRIP_GAP = 2.2;
const WGCV = { drips: [], next: 0, saw: 0 };
(function () {
  WG_ACH.push(['glowworm', 'GLOW WORMS', 'FIND GLOW WORMS IN A CAVE', (c) => !!c.st.glowworm]);
})();
const wgCaveWall = (w, tx, ty) => { const o = OBJ[wgObjAt(w, 'u', tx, ty)]; return !!o && o.kind === 'wall' && !!o.natural; };
function wgGlowAt(tx, ty) { // the glow worms on a rock face, or null: [dx, thread length, beat, phase, colour] each
  const w = WGS.world, h = hash(tx, ty, (w.seed | 0) * 17 + 9013) >>> 0; if (h % WG_GLOW_ONE || !wgCaveWall(w, tx, ty) || wgCaveWall(w, tx, ty + 1) || wgObjAt(w, 'u', tx, ty + 1)) return null;
  const L = [], n = 3 + (h >>> 3) % 4;
  for (let i = 0; i < n; i++) { const q = hash(h, i, 31) >>> 0; L.push([1 + (q % 14), 2 + (q >>> 4) % 6, 0.8 + (q >>> 8) % 10 / 8, (q >>> 12) % 628 / 100, (q >>> 22) % 4 ? 'T' : 'C']); }
  return L;
}
const _wgLightCaves = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  _wgLightCaves(cx0, cy0);
  const w = WGS.world, p = WGS.p; if (!w || !p || WGS.dim !== 'u' || !wgOpt().amb) return;
  const T = WGS.t, x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  let near = false;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const L = wgGlowAt(tx, ty); if (!L) continue;
    const bx = tx * 16 - cx0, by = ty * 16 + 16 - cy0; // threads hang from the foot of the face
    if (!near && Math.abs(p.x - (tx * 16 + 8)) < WG_GLOW_SEE && Math.abs(p.y - (ty * 16 + 16)) < WG_GLOW_SEE) near = true;
    for (const [dx, len, sp, ph, c] of L) {
      const a = 0.45 + 0.55 * Math.max(0, Math.sin(T * sp + ph)), x = bx + dx;
      ctx.globalAlpha = 0.22; rect(x, by - 2, 1, len, 'C');
      ctx.globalAlpha = a; rect(x, by - 2 + len, 1, 1, c);
      if (a > 0.85) { ctx.globalAlpha = (a - 0.85) * 2; rect(x - 1, by - 2 + len, 3, 1, c); rect(x, by - 3 + len, 1, 3, c); }
    }
  }
  ctx.globalAlpha = 1;
  for (const d of WGCV.drips) { // a falling drop catches the light too
    const u = (T - d.t0) / d.fall; if (u < 0 || u >= 1) continue;
    ctx.globalAlpha = 0.8; rect(Math.round(d.x - cx0), Math.round(d.y0 + (d.y1 - d.y0) * u * u - cy0), 1, 2, 'C'); ctx.globalAlpha = 1;
  }
  if (near) WGCV.saw = 1; // told by the update
};
const _wgUpdCaves = updateWG;
updateWG = function (dt) {
  _wgUpdCaves(dt);
  const w = WGS.world, p = WGS.p, T = WGS.t; if (!w || !p || WGS.dim !== 'u' || !wgOpt().amb) { WGCV.drips.length = 0; WGCV.saw = 0; return; }
  if (WGCV.saw) { WGCV.saw = 0; const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); if (!st.glowworm) { st.glowworm = 1; wgToast('GLOW WORMS!', 3); wgSfx('chime'); } }
  for (let i = WGCV.drips.length - 1; i >= 0; i--) { // a drop lands: a few specks and a plip
    const d = WGCV.drips[i]; if (T - d.t0 < d.fall) continue;
    WGCV.drips.splice(i, 1); wgPart(d.x, d.y1, 3, { c: ['C', 'c'], s: 14, up: 6, life: 0.35 });
    if (Math.abs(p.x - d.x) + Math.abs(p.y - d.y1) < 140) wgSfx('drip');
  }
  if (T < WGCV.next || WGCV.drips.length >= WG_DRIP_MAX) return;
  WGCV.next = T + WG_DRIP_GAP * (0.6 + Math.random() * 0.8);
  const tx0 = Math.floor(p.x / 16), ty0 = Math.floor(p.y / 16);
  for (let k = 0; k < 8; k++) { // a face within a few tiles with open floor below
    const tx = tx0 + Math.floor(Math.random() * 15) - 7, ty = ty0 + Math.floor(Math.random() * 11) - 6;
    if (!wgCaveWall(w, tx, ty) || wgCaveWall(w, tx, ty + 1) || wgObjAt(w, 'u', tx, ty + 1) || GROUND[wgGround(w, 'u', tx, ty + 1)].liq) continue;
    const x = tx * 16 + 2 + Math.floor(Math.random() * 12), y0 = ty * 16 + 14, y1 = ty * 16 + 20 + Math.floor(Math.random() * 10);
    WGCV.drips.push({ x, y0, y1, t0: T, fall: Math.sqrt((y1 - y0) / 120) * 1.6 }); return;
  }
};
