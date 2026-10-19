'use strict';
// Wildgrove: fairy rings. Here and there in the woods a ring of tiny mushrooms grows on the grass (`wgFairyAt`: from
// the tile and the world's seed alone, on grass with nothing solid in its middle and trees about, so every screen has the same).
// At night little lights dance round it, and standing in its middle brings the fairies' gift once a night (one of
// `WG_GIFTS`, kept in `w.meta.fairy` as the night it was given, each hero's own). The FAIRY RING star.
const WG_FAIRY_R = 22, WG_FAIRY_N = 11, WG_FAIRY_COLS = ['Y', 'q', 'C', 'H', 'Y', '4']; // ring radius, mushrooms, lights
const WGFR = { seen: [] }; // the rings drawn this frame (their middles)
(function () {
  WG_ACH.push(['fairy', 'FAIRY RING', 'STAND IN A FAIRY RING AT NIGHT', (c) => c.st.fairy]);
})();
function wgFairyAt(tx, ty) { // is a ring's middle on this tile (outdoors)
  const w = WGS.world; if (!w || hash(tx, ty, (w.seed | 0) * 53 + 7177) % 900) return false;
  const gid = wgGround(w, 'o', tx, ty); if (gid !== G_ID.grass && gid !== G_ID.jungle) return false;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const o = OBJ[wgObjAt(w, 'o', tx + i, ty + j)]; if ((o && o.solid !== 0) || GROUND[wgGround(w, 'o', tx + i, ty + j)].liq) return false; } // grass and flowers may grow in it
  let trees = 0; // in the woods: trees about
  for (let j = -4; j <= 4 && trees < 2; j++) for (let i = -4; i <= 4; i++) { const o = OBJ[wgObjAt(w, 'o', tx + i, ty + j)]; if (o && o.kind === 'tree' && ++trees >= 2) break; }
  return trees >= 2;
}
const wgFairyNight = () => WGS.day - (WGS.clock < 0.5 ? 1 : 0); // a night belongs to the evening it began on
function wgFairyNear(p) { // the ring whose middle the hero stands in, or null
  const cx = Math.floor(p.x / 16), cy = Math.floor(p.y / 16);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (wgFairyAt(cx + i, cy + j) && Math.hypot(p.x - (cx + i) * 16 - 8, p.y - (cy + j) * 16 - 8) < 12) return [cx + i, cy + j];
  return null;
}
const _wgUpdFairy = updateWG;
updateWG = function (dt) { // the fairies' gift, once a night, for standing in a ring's middle in the dark
  _wgUpdFairy(dt);
  const w = WGS.world, p = WGS.p; if (!w || !p || WGS.scr !== 'play' || WGS.dim !== 'o' || p.hidden || wgNight(WGS.clock) < 0.5) return;
  const m = w.meta, n = wgFairyNight(); if (m.fairy === n) return;
  const R = wgFairyNear(p); if (!R) return;
  m.fairy = n; const gift = WG_GIFTS[hash(R[0], R[1], n) % WG_GIFTS.length], left = wgInvAdd(WGS.inv, gift[0], gift[1]); if (left) wgDrop(p.x, p.y, gift[0], left);
  const st = m.stats || (m.stats = { kills: 0, far: 0 }); st.fairy = 1;
  wgToast('THE FAIRIES DANCE AROUND YOU', 3); wgSfx('chime'); wgPart(p.x, p.y - 12, 12, { c: WG_FAIRY_COLS, s: 22, up: 26, life: 0.9 });
};
// the mushrooms, on the ground under everything that stands
const _wgUpkeepFairy = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepFairy(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (dim !== 'o' || w !== WGS.world) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2, L = WGFR.seen; L.length = 0;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 2, y0 = Math.floor((cy0 - SCR.oy) / 16) - 2, x1 = x0 + Math.ceil(SCR.w / 16) + 4, y1 = y0 + Math.ceil(SCR.h / 16) + 4;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (!wgFairyAt(tx, ty)) continue;
    const mx = tx * 16 + 8 - cx0, my = ty * 16 + 8 - cy0; L.push([tx, ty]);
    for (let i = 0; i < WG_FAIRY_N; i++) {
      const a = i / WG_FAIRY_N * Math.PI * 2 + (hash(tx, ty, i) % 7) / 20, r = WG_FAIRY_R + (hash(tx, ty, i + 40) % 5) - 2;
      ctx.drawImage(wgFairyShroom(hash(tx, ty, i + 80) % 3), Math.round(mx + Math.cos(a) * r) - 3, Math.round(my + Math.sin(a) * r * 0.62) - 5);
    }
  }
};
// the lights, at night, over the dark: six of them circling, bobbing, each with a little glow
const _wgLightFairy = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  _wgLightFairy(cx0, cy0);
  if (WGS.dim !== 'o' || wgNight(WGS.clock) < 0.35 || !WGFR.seen.length) return;
  const T = WGS.t;
  for (const [tx, ty] of WGFR.seen) for (let i = 0; i < 6; i++) {
    const a = T * 0.7 + i * Math.PI / 3, r = WG_FAIRY_R - 4 + Math.sin(T * 1.9 + i * 2) * 4;
    const x = Math.round(tx * 16 + 8 - cx0 + Math.cos(a) * r), y = Math.round(ty * 16 + 8 - cy0 + Math.sin(a) * r * 0.62 - 9 - Math.sin(T * 2.6 + i) * 3);
    rect(x, y, 1, 1, Math.floor(T * 5 + i) % 3 ? WG_FAIRY_COLS[i] : 'w'); ctx.globalAlpha = 0.45; rect(x - 1, y, 3, 1, WG_FAIRY_COLS[i]); rect(x, y - 1, 1, 3, WG_FAIRY_COLS[i]); ctx.globalAlpha = 1;
    if (i % 2 === 0) WGR.lights.push({ x, y: y + 6, r: 16, f: 0.2 });
  }
};
function wgFairyShroom(v) { // a tiny mushroom: a red cap with white spots, a pale brown cap, a white one
  const key = 'fairy_shroom_' + v; if (WGA.cache[key]) return WGA.cache[key];
  const cap = [['r', 'R', 'w'], ['n', 'N', 'A'], ['l', 'L', 'w']][v];
  return wgMake(key, 6, 6, (g) => { wgRc(g, 1, 1, 4, 2, cap[0]); wgRc(g, 1, 1, 3, 1, cap[1]); wgPx(g, 3, 2, cap[2]); wgRc(g, 2, 3, 2, 2, 'A'); wgPx(g, 3, 4, 'e'); });
}
