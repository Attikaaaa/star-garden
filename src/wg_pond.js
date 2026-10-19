'use strict';
// Wildgrove: the pond pack. A rowboat held in hand on water rows quicker than any swimmer (a friend in a boat is drawn
// in theirs, the boat rides along with the hero's position); the village well can be built at home and fills a bucket; lily pads
// come up whole when cut and go back on any water, a water lily too; and by day a duck leads her ducklings round a pond.
// Ids are appended, so old worlds stay valid.
(function () {
  wgItem('rowboat', 'ROWBOAT', 'res', { stack: 1 }); wgRec('rowboat', 1, { wood: 8, stick: 2 }, 'bench');
  OBJ[O_ID.well].drops = [DR('well', 1, 1)]; // the well comes along whole
  wgItem('well', 'WELL', 'place', { place: 'well' }); PLACE.well = 'well'; wgRec('well', 1, { stone: 8, wood: 4, string: 2, bucket: 1 }, 'bench');
  OBJ[O_ID.lilypad].drops = [DR('lilypad', 1, 1)]; // a cut lily pad comes up whole
  wgItem('lilypad', 'LILY PAD', 'place', { place: 'lilypad' }); PLACE.lilypad = 'lilypad';
  wgObj('waterlily', { name: 'WATER LILY', kind: 'plant', hp: 1, solid: 0, water: 1, drops: [DR('waterlily', 1, 1)] });
  wgItem('waterlily', 'WATER LILY', 'place', { place: 'waterlily' }); PLACE.waterlily = 'waterlily'; wgRec('waterlily', 1, { lilypad: 1, petal_w: 2 }, 'hand');
  WG_ACH.push(['row', 'ROW YOUR BOAT', 'ROW A HUNDRED TILES', (c) => (c.st.row || 0) >= 100]);
})();
const wgBoatHeld = () => { const s = WGS.inv && WGS.inv[WGS.sel]; return !!(s && s.id === 'rowboat'); };
const wgOnWater = (p) => GROUND[wgGround(WGS.world, WGS.dim, Math.floor(p.x / 16), Math.floor(p.y / 16))].liq === 'water';
// Rowing: the water's own slowness is swapped for a brisk pace while the hero's move runs, then put back.
const _wgUpdPond = updateWG;
updateWG = function (dt) {
  const p = WGS.p, row = WGS.scr === 'play' && p && WGS.world && wgBoatHeld() && wgOnWater(p);
  if (!row) return _wgUpdPond(dt);
  const D = GROUND[G_ID.deep], S = GROUND[G_ID.shallow], d0 = D.speed, s0 = S.speed, x0 = p.x, y0 = p.y;
  D.speed = 1.2; S.speed = 1.1;
  try { _wgUpdPond(dt); } finally { D.speed = d0; S.speed = s0; }
  const d = Math.hypot(p.x - x0, p.y - y0); if (d > 0 && d < 8) { const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.row = Math.min(99999, (st.row || 0) + d / 16); }
};
// A lily pad or a water lily goes on water only; a well fills an empty bucket (else a sip heals, as it always has).
const _wgCanPlacePond = wgCanPlaceAt;
wgCanPlaceAt = function (tx, ty, item) {
  if ((item.place === 'lilypad' || item.place === 'waterlily') && wgGroundAtT(tx, ty).liq !== 'water') return false;
  return _wgCanPlacePond(tx, ty, item);
};
const _wgUsePond = wgUse;
wgUse = function (tx, ty) {
  const o = OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)], s = WGS.inv[WGS.sel];
  if (o && o.kind === 'well' && s && s.id === 'bucket') { wgInvTake(WGS.inv, 'bucket', 1); wgInvAdd(WGS.inv, 'bucket_water', 1); wgSfx('pickup'); wgPart(tx * 16 + 8, ty * 16 + 4, 5, { c: ['c', 'C', 'B'], s: 14, up: 12, life: 0.5 }); return true; }
  return _wgUsePond(tx, ty);
};
const _wgTipPond = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipPond(s);
  if (s.id === 'rowboat') L.push('HOLD IT TO ROW ON WATER');
  else if (s.id === 'well') L.push('DRAW WATER WITH A BUCKET');
  else if (s.id === 'lilypad' || s.id === 'waterlily') L.push('FLOATS ON WATER');
  return L;
};

// ---------- the hero in a boat: the hull, the hero from the waist up, the near side over them, oars and a wake ----------
const _wgDrawPlayerPond = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  const p = e.p;
  if (p.hidden || p.sit || p.face === 'S' || !(p === WGS.p ? wgBoatHeld() : p.boat) || !wgOnWater(p)) return _wgDrawPlayerPond(e, cx0, cy0);
  const sx = Math.round(p.x - cx0), sy = Math.round(p.y - cy0), t = WGS.t, side = p.face === 'l' || p.face === 'r';
  const bob = Math.floor(t * 1.6 + (p.x >> 4)) % 2, dir = p.face === 'r' || p.face === 'd' ? 1 : -1, st = p.moving ? (t * 5) % 1 : 0.25;
  shadow(sx, sy + 1, side ? 13 : 10);
  if (p.moving) for (let i = 0; i < 3; i++) { // a wake spreading behind
    const k = (t * 1.8 + i / 3) % 1, d = (side ? 13 : dir > 0 ? 26 : 5) + k * 9, a = Math.round(k * 3); ctx.globalAlpha = (1 - k) * 0.8;
    if (side) { rect(sx - dir * d, sy - 1 - a, 2, 1, 'w'); rect(sx - dir * d, sy + 2 + a, 2, 1, 'w'); } else { rect(sx - 5 - a, sy - dir * d, 1, 2, 'w'); rect(sx + 4 + a, sy - dir * d, 1, 2, 'w'); }
    ctx.globalAlpha = 1;
  }
  if (p.inv > 0 && Math.floor(t * 20) % 2) return;
  const B = wgBoatSpr(side ? (p.face === 'r' ? 'r' : 'l') : 'v'), bw = B.width, bh = B.height, bx = sx - (bw >> 1), by = side ? sy - 7 + bob : sy - 24 + bob, cut = side ? 5 : 22;
  const oar = (x0, y0, x1, y1) => { // a shaft and its blade, outlined so it reads on the water
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1), at = (i) => [Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)];
    for (let i = 0; i <= n; i++) { const [x, y] = at(i); rect(x - 1, y, 3, 1, '0'); } for (let i = 0; i <= n; i++) { const [x, y] = at(i); rect(x, y, 1, 1, i > n - 3 ? 'O' : 'N'); }
  };
  const sw = Math.round(Math.sin(st * 6.283) * 4); // the stroke, back and forth
  ctx.drawImage(B, bx, by);
  if (!side) for (const s of [-1, 1]) oar(sx + s * 5, by + 15, sx + s * 13, by + 17 - sw * dir); // two oars over the gunwales, under the rower's arms
  const spr = wgPlayerSpr(side ? 'l' : p.face, 0, p.look || { skin: 0, hair: 0, shirt: 0 }), hy = by + cut - 18;
  ctx.save(); ctx.translate(sx, hy); if (p.face === 'r') ctx.scale(-1, 1); ctx.drawImage(spr, 0, 0, 18, 18, -9, 0, 18, 18); ctx.restore();
  ctx.drawImage(B, 0, cut, bw, bh - cut, bx, by + cut, bw, bh - cut); // the near side, over the hero's legs
  if (side) oar(sx - dir, by + 3, sx + sw * 2 * dir, by + 11); // one oar on the near side, sweeping fore and aft
  const wl = Math.floor(t * 4) % 2; rect(bx + 2 + wl, by + bh - 2, bw - 4 - wl * 2, 1, 'C'); // the water at the hull
  if (p.name && p !== WGS.p) wgRawText(p.name, sx, sy - 32, 'w', 2, 1);
};
// ---------- ducks: a mother and her ducklings paddle round a pond by day, the same on every screen ----------
const WGDK = new Map(); // a grid cell's pond spot (or none), worked out once
const _wgAmbPond = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbPond(cx0, cy0);
  if (WGS.dim !== 'o' || !wgOpt().amb || wgNight(WGS.clock) > 0.3 || wgSeason() === 3) return;
  const w = WGS.world, t = WGS.t, C = 160, gx0 = Math.floor((cx0 - 40) / C), gy0 = Math.floor((cy0 - 40) / C), gx1 = Math.floor((cx0 + SCR.w + 40) / C), gy1 = Math.floor((cy0 + SCR.h + 40) / C);
  if (WGDK.size > 400 || WGDK.w !== w) { WGDK.clear(); WGDK.w = w; } // another world has its own ponds
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const key = gx * 65536 + gy; let spot = WGDK.get(key);
    if (spot === undefined) {
      const h = hash(gx, gy, 5151 + (w.seed | 0)), ax = gx * C + 40 + (h & 63) + ((h >>> 6) & 15), ay = gy * C + 40 + ((h >>> 10) & 63), wet = (x, y) => GROUND[wgGround(w, 'o', Math.floor(x / 16), Math.floor(y / 16))].liq === 'water';
      spot = null;
      if (h % 3 === 0) { let ok = true; for (let a = 0; a < 8 && ok; a++) ok = wet(ax + Math.cos(a * 0.785) * 34, ay + Math.sin(a * 0.785) * 22); if (ok && wet(ax, ay)) spot = [ax, ay, (h >>> 16) % 628 / 100, 2 + (h >>> 24) % 2]; }
      WGDK.set(key, spot);
    }
    if (!spot) continue;
    const [ax, ay, ph, n] = spot; if (GROUND[wgGround(w, 'o', Math.floor(ax / 16), Math.floor(ay / 16))].liq !== 'water') continue; // the pond was filled in
    for (let i = n; i >= 0; i--) { // ducklings first, so their mother is drawn over the one behind her
      const a = ph + t * 0.22 + Math.sin(t * 0.11 + ph) * 0.6 - i * 0.3, x = Math.round(ax + Math.cos(a) * 26 - cx0), y = Math.round(ay + Math.sin(a) * 14 - cy0);
      if (x < -20 || y < -20 || x > SCR.w + 20 || y > SCR.h + 20) continue;
      const left = Math.sin(a) > 0, b = Math.floor(t * 2 + i) % 2, D = wgDuckSpr(i ? 1 : 0, left);
      ctx.drawImage(D, x - (D.width >> 1), y - D.height + 2 + b);
      rect(x - (i ? 3 : 4), y + 2, i ? 6 : 8, 1, 'C'); // the ripple at the waterline
    }
  }
};

// ---------- art ----------
function wgBoatSpr(k) { // a little rowboat: side on (facing left, mirrored for right) or end on (going up or down)
  const key = 'boat' + k; if (WGA.cache[key]) return WGA.cache[key];
  let c;
  if (k === 'r') { const l = wgBoatSpr('l'); [c] = wgCv(l.width, l.height); const g = c.getContext('2d'); g.scale(-1, 1); g.drawImage(l, -l.width, 0); }
  else if (k === 'l') c = wgMake('boat_l', 26, 10, (g) => wgPaint(g, 0, 0, [
    '..........................',
    '.O........................',
    '.ONNNNNNNNNNNNNNNNNNNNNNN.',
    '..OuuuuuuuuNNuuuuuuuuuNNN.',
    '..NOuuuuuuuNNuuuuuuuuuNNN.',
    '..NNOOOOOOOOOOOOOOOOOOOOO.',
    '...NNNNNNNNNNNNNNNNNNNNNn.',
    '....nnnnnnnnnnnnnnnnnnnnu.',
    '......uuuuuuuuuuuuuuuuuu..',
    '..........................'], { O: 'O', N: 'N', n: 'n', u: 'u' }));
  else { // end on: the bow far up the screen, floorboards between the gunwales, the rower's bench by the stern
    const fl = '..ON' + 'unnnunnunnnN' + 'Nn..', bench = '..ON' + 'NNNNNNNNNNNN' + 'Nn..';
    c = wgMake('boat_v', 20, 29, (g) => wgPaint(g, 0, 0, [
      '....................',
      '.........OO.........',
      '........ONNn........',
      '.......ONuuNn.......',
      '......ONuuuuNn......',
      '.....ONuuuuuuNn.....',
      '....ONuuuuuuuuNn....',
      '...ONuuuuuuuuuuNn...',
      '..ONuuuuuuuuuuuuNn..',
      bench, fl, fl, fl, fl, fl, fl, fl, fl, fl, fl, bench, fl, fl,
      '...OOOOOOOOOOOOOOn..',
      '...NNNNNNNNNNNNNNn..',
      '...nnnnnnnnnnnnnnu..',
      '....nnnnnnnnnnnnu...',
      '.....uuuuuuuuuu.....',
      '....................'], { O: 'O', N: 'N', n: 'n', u: 'u' }));
  }
  WGA.cache[key] = c; return c;
}
function wgDuckSpr(kind, left) { // a white duck with an orange bill, or a yellow duckling; baked once per facing
  const key = 'duck' + kind + (left ? 'l' : 'r'); if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(kind ? 8 : 11, kind ? 7 : 9);
  if (!left) { g.scale(-1, 1); g.drawImage(wgDuckSpr(kind, true), -c.width, 0); WGA.cache[key] = c; return c; }
  if (kind) { wgBlob(g, 4.6, 4.6, 2.6, 1.6, ['e', 'y', 'y', 'Y']); wgBlob(g, 2.8, 2.6, 1.5, 1.4, ['y', 'y', 'Y', 'Y']); wgPx(g, 1, 3, 'o'); wgPx(g, 2, 2, '0'); }
  else { wgBlob(g, 6.2, 5.8, 3.8, 2.1, ['m', 'l', 'L', 'w']); wgRc(g, 9, 3, 1, 2, 'L'); wgBlob(g, 3.3, 3.2, 1.8, 1.8, ['l', 'L', 'w', 'w']); wgRc(g, 1, 4, 2, 1, 'o'); wgPx(g, 1, 3, 'O'); wgPx(g, 3, 2, '0'); wgRc(g, 5, 5, 3, 1, 'l'); }
  wgOutline(c); WGA.cache[key] = c; return c;
}
const _wgBuildPond = wgBuildAll;
wgBuildAll = function () {
  _wgBuildPond();
  // the well, now round stones under a little red roof, a bucket hanging on its rope over the dark water
  wgReg('well', [wgMake('well', 18, 26, (g) => {
    for (let i = 0; i < 4; i++) wgRc(g, 8 - i * 2, 1 + i, 2 + i * 4, 1, i < 2 ? 'R' : 'r'); wgRc(g, 1, 5, 16, 1, 'p'); // the roof
    for (const x of [2, 14]) { wgRc(g, x, 6, 2, 10, 'n'); wgPx(g, x, 6, 'N'); wgRc(g, x, 7, 1, 9, 'N'); } // the posts, lit on their left
    wgRc(g, 4, 8, 10, 1, 'u'); wgRc(g, 16, 7, 1, 3, 'X'); // the axle and its crank
    wgRc(g, 9, 9, 1, 2, 'a'); wgRc(g, 7, 11, 5, 3, 'm'); wgRc(g, 7, 11, 5, 1, 'l'); wgRc(g, 11, 12, 1, 2, 'd'); // the rope and the bucket
    wgBlob(g, 9, 16, 8, 2.8, ['m', 'l', 'l', 'L']); wgBlob(g, 9, 16.2, 5.6, 1.6, ['b', 'b', 'B', 'B']); // the rim and the water
    wgRc(g, 1, 17, 16, 7, 'm'); wgRc(g, 1, 17, 1, 7, 'l'); wgRc(g, 16, 17, 1, 7, 'd'); wgRc(g, 2, 24, 14, 1, 'd'); // the wall
    for (let y = 19; y < 24; y += 2) for (let x = 2 + (y % 4 === 3 ? 2 : 0); x < 16; x += 4) wgRc(g, x, y, 1, 1, 'd'); // the joints
    for (let x = 2; x < 16; x++) wgPx(g, x, 18 + (x % 4 === 1 ? 1 : 0), 'd');
  })]);
  // a lily pad with a big white flower, pink at the tips
  wgReg('waterlily', [wgMake('waterlily', 14, 10, (g) => {
    wgBlob(g, 7, 6, 6, 3, ['g', 'G', 'h', 'H']); wgPx(g, 11, 6, 'c'); wgPx(g, 12, 6, 'c');
    wgBlob(g, 7, 4, 3.2, 2.4, ['l', 'L', 'w', 'w']); for (const [x, y] of [[4, 3], [10, 3], [7, 1]]) wgPx(g, x, y, 'q'); wgRc(g, 6, 3, 2, 2, 'y'); wgPx(g, 6, 3, 'Y');
  })]);
};
const _wgIconPond = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || (id !== 'rowboat' && id !== 'well' && id !== 'lilypad')) return _wgIconPond(id);
  const [c, g] = wgCv(16, 16);
  if (id === 'rowboat') { // a little boat with an oar across it
    wgLine(g, 4, 3, 11, 10, 'N'); wgRc(g, 3, 2, 2, 2, 'O');
    wgPaint(g, 0, 6, [
      '.O............O.',
      '.ONNNNNNNNNNNNN.',
      '..OuuuuNNuuuuN..',
      '..OOOOOOOOOOOON.',
      '...NNNNNNNNNNn..',
      '....nnnnnnnnn...',
      '......uuuuu.....'], { O: 'O', N: 'N', n: 'n', u: 'u' });
    wgLine(g, 11, 10, 13, 12, 'N'); wgOutline(c);
  } else if (id === 'lilypad') { const s = WGA.obj.lilypad[1].c; g.drawImage(s, 1, 4); wgOutline(c); }
  else { const s = WGA.obj.well[0].c; g.drawImage(s, 1, 0, 16, 7, 0, 0, 16, 7); g.drawImage(s, 1, 14, 16, 11, 0, 5, 16, 11); } // the roof over the wall, the posts left out
  WGA.cache[key] = c; return c;
};
