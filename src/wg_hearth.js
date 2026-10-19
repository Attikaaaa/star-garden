'use strict';
// Wildgrove: the hearth pack, for a house that feels lived in. A stone fireplace cooks like a campfire, lights the room
// and makes the seats near it heal faster; most fireplaces have a cat asleep on the hearth in front, who purrs when you
// USE it; a rocking chair rocks gently while someone sits in it; a kitchen dresser keeps things behind its doors. Ids
// are appended, so old worlds stay valid.
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'axe', hp: 4, solid: 1, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, at);
  };
  dec('fireplace', 'FIREPLACE', { kind: 'station', st: 'fire', hearth: 1, tool: 'pick', hp: 10, light: 100, anim: 1 }, { stone: 10, clay: 4, coal: 2 }, 'bench');
  dec('rocker', 'ROCKING CHAIR', { seat: 1, rock: 1 }, { wood: 5, wool: 1 }, 'bench');
  dec('dresser', 'KITCHEN DRESSER', { kind: 'storage', slots: 18, hp: 6 }, { wood: 8, clay: 2 }, 'bench');
  WG_ACH.push(['hearth', 'HEARTH AND HOME', 'REST BY A FIREPLACE', (c) => c.st.hearth]);
})();
const WG_HEARTH_R = 3; // tiles: a seat this close to a fireplace is cosy
const wgCatAt = (tx, ty) => { // the cat asleep in front of a fireplace at tx, ty, or null; two fireplaces in three have one
  const w = WGS.world, d = WGS.dim, id = wgObjAt(w, d, tx, ty);
  if (!id || !OBJ[id].hearth || hash(tx, ty, 61) % 3 === 0 || wgObjAt(w, d, tx, ty + 1) || GROUND[wgGround(w, d, tx, ty + 1)].liq) return null;
  return hash(tx, ty, 62) % 3; // its coat
};
const wgRockAt = (tx, ty) => (wgSeatedAt(tx, ty) ? Math.round(Math.sin(WGS.t * 2 + (hash(tx, ty, 63) & 63) / 10)) : 0);
const _wgUpdHearth = updateWG;
updateWG = function (dt) {
  _wgUpdHearth(dt);
  const p = WGS.p, S = p && p.sit; if (!S || WGS.scr !== 'play') return;
  for (let dy = -WG_HEARTH_R; dy <= WG_HEARTH_R; dy++) for (let dx = -WG_HEARTH_R; dx <= WG_HEARTH_R; dx++) {
    const id = wgObjAt(WGS.world, WGS.dim, S.tx + dx, S.ty + dy); if (!id || !OBJ[id].hearth) continue;
    S.t += dt * 0.5; // cosy by the fire: half as fast again
    const m = WGS.world.meta; (m.stats || (m.stats = { kills: 0, far: 0 })).hearth = 1; return;
  }
};
// USE on the cat: it wakes for a moment and purrs.
const _wgUseHearth = wgUse;
wgUse = function (tx, ty) {
  if (!wgObjAt(WGS.world, WGS.dim, tx, ty) && wgCatAt(tx, ty - 1) !== null) {
    WGS.purr = { tx, ty: ty - 1, t: WGS.t }; wgToast('PURR...', 1.5); wgSfx('select');
    wgPart(tx * 16 + 8, ty * 16 + 2, 3, { c: ['P', 'r'], s: 6, up: 14, life: 0.8, sz: 2 }); return true;
  }
  return _wgUseHearth(tx, ty);
};
const _wgTipHearth = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipHearth(s);
  if (s.id === 'fireplace') L.push('COOKS LIKE A CAMPFIRE', 'SEATS NEARBY HEAL FASTER');
  else if (s.id === 'rocker') L.push('ROCKS GENTLY');
  return L;
};

// ---------- drawing ----------
const _wgDrawObjHearth = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id];
  if (o.rock) { const dy = wgRockAt(tx, ty); if (dy) { const sp = WGA.obj[o.id][0]; ctx.drawImage(sp.c, sx + sp.ox, sy + sp.oy + dy); return; } }
  _wgDrawObjHearth(id, tx, ty, sx, sy);
  if (!o.hearth) return;
  const coat = wgCatAt(tx, ty); if (coat === null) return;
  const P = WGS.purr, awake = P && P.tx === tx && P.ty === ty && WGS.t - P.t < 2.5, flick = Math.floor(WGS.t * 0.7 + (hash(tx, ty, 64) & 7)) % 3 === 0;
  const C = wgCatSpr(coat, awake, flick), cx = sx + 8 - (C.width >> 1), cy = sy + 27 - C.height;
  shadow(sx + 8, sy + 26, 6); ctx.drawImage(C, cx, cy); // now and then the tail's tip flicks
  if (!awake && wgNight(WGS.clock) > 0.4) { const k = (WGS.t * 0.4 + (hash(tx, ty, 65) & 15) / 16) % 1; ctx.globalAlpha = k < 0.7 ? 0.8 : (1 - k) * 2.6; rect(cx + C.width + Math.round(k * 4), cy - 2 - Math.round(k * 8), 3, 1, 'L'); rect(cx + C.width + 2 + Math.round(k * 4), cy - 1 - Math.round(k * 8), 1, 1, 'L'); rect(cx + C.width + Math.round(k * 4), cy - Math.round(k * 8), 3, 1, 'L'); ctx.globalAlpha = 1; } // a little z at night
};
const _wgDrawPlayerHearth = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  const p = e.p, seat = !p.hidden && wgSeatOf(p);
  if (!seat || !seat[0].rock) return _wgDrawPlayerHearth(e, cx0, cy0);
  ctx.save(); ctx.translate(0, wgRockAt(seat[1], seat[2])); _wgDrawPlayerHearth(e, cx0, cy0); ctx.restore();
};

// ---------- art ----------
function wgCatSpr(coat, awake, flick) { // a cat curled up asleep (or looking up): calico, grey tabby, or black with a white chin
  const key = 'cat' + coat + (awake ? 'a' : '') + (flick ? 'f' : ''); if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(16, 11), K = [{ S: 'l', B: 'L', H: 'w', P: 'o', Q: 'x', E: 'd', W: 'w' }, { S: 'd', B: 'm', H: 'l', P: 'd', Q: 'd', E: 'x', W: 'L' }, { S: 'x', B: 'x', H: 'X', P: 'X', Q: 'x', E: 'm', W: 'L' }][coat];
  wgPaint(g, 0, 0, [
    '................',
    '..S..S..........',
    '..BB.BB.........',
    '..HQHHB..HPPH...',
    '.HHHHHBSHHPPHHS.',
    '.HEHHEBSHHHHHHBS',
    '.HWNWHBSBHHHHBBS',
    '..WWWSSBBBBBBBS.',
    '..PBBBBBBBBBSS' + (flick ? '.P' : 'P.'),
    '................',
    '................'], K);
  if (awake) { wgPx(g, 2, 5, coat === 2 ? 'y' : 'G'); wgPx(g, 5, 5, coat === 2 ? 'y' : 'G'); } // eyes open
  wgPx(g, 3, 6, 'P'); // a pink nose
  wgOutline(c); WGA.cache[key] = c; return c;
}
const _wgBuildHearth = wgBuildAll;
wgBuildAll = function () {
  _wgBuildHearth();
  // a stone chimney breast with a wooden mantel and two candles, logs burning in the arched firebox; three frames of flame
  wgReg('fireplace', [0, 1, 2].map(f => wgMake('fireplace' + f, 24, 28, (g) => {
    for (const x of [4, 19]) { wgRc(g, x - 1, 4, 3, 1, 'y'); wgRc(g, x, 2, 1, 2, 'L'); wgPx(g, x, 1, f === 1 ? 'Y' : 'O'); if (f !== 2) wgPx(g, x, 0, 'Y'); } // the candles in their holders
    wgRc(g, 0, 5, 24, 3, 'N'); wgRc(g, 0, 5, 24, 1, 'O'); wgRc(g, 0, 7, 24, 1, 'n'); // the mantel
    wgRc(g, 2, 8, 20, 17, 'm'); wgRc(g, 2, 8, 1, 17, 'l'); wgRc(g, 21, 8, 1, 17, 'd'); wgRc(g, 2, 8, 20, 1, 'd'); // the chimney breast
    for (let y = 11; y < 24; y += 3) for (let x = 3 + (Math.floor(y / 3) % 2 ? 2 : 0); x < 21; x += 5) wgRc(g, x, y, 3, 1, 'd'); // the mortar
    for (let y = 13; y < 24; y++) { const i = Math.min(2, y - 13); wgRc(g, 8 - i, y, 8 + i * 2, 1, y < 16 ? '0' : 'x'); } // the firebox, an arch
    wgRc(g, 7, 13, 10, 1, 'l'); wgPx(g, 6, 14, 'l'); wgPx(g, 17, 14, 'd'); // its keystones
    wgBlob(g, 12, 18.5 - f * 0.3, 3.4, 3.6 + (f % 2) * 0.5, ['r', 'o', 'O', 'y']); wgBlob(g, 11.6 + (f === 1 ? 0.6 : 0), 19.4, 1.8, 2, ['O', 'y', 'Y', 'Y']); // the flames
    if (f !== 1) wgPx(g, 9 + f, 15, 'o'); else wgPx(g, 14, 15, 'O');
    wgRc(g, 8, 21, 8, 2, 'n'); wgRc(g, 8, 21, 8, 1, 'N'); wgPx(g, 8, 21, 'O'); wgPx(g, 15, 22, 'u'); // the logs
    wgRc(g, 0, 24, 24, 3, 'l'); wgRc(g, 0, 24, 24, 1, 'L'); wgRc(g, 0, 26, 24, 1, 'm'); // the hearth stone
  })));
  // a rocking chair: spindles on a tall back, a red cushion, the runners curling forward under the legs
  wgReg('rocker', [wgMake('rocker', 14, 20, (g) => {
    wgRc(g, 2, 0, 10, 2, 'N'); wgRc(g, 2, 0, 10, 1, 'O'); for (const x of [2, 5, 8, 11]) wgRc(g, x, 2, 1, 7, x === 2 ? 'N' : 'n'); // the back
    wgRc(g, 1, 9, 12, 4, 'r'); wgRc(g, 1, 9, 12, 1, 'R'); wgRc(g, 1, 12, 12, 1, 'p'); wgPx(g, 6, 10, 'R'); // the cushion
    wgRc(g, 2, 13, 2, 4, 'n'); wgRc(g, 10, 13, 2, 4, 'u'); wgPx(g, 2, 13, 'N'); // the legs
    for (const x of [2, 10]) { wgPx(g, x - 1, 17, 'N'); wgRc(g, x, 18, 2, 1, 'n'); wgPx(g, x + 2, 17, 'n'); } // the curved runners under each leg
  })]);
  // a kitchen dresser: plates on the rack above, two cupboard doors below
  wgReg('dresser', [wgMake('dresser', 18, 26, (g) => {
    wgRc(g, 1, 0, 16, 2, 'N'); wgRc(g, 1, 0, 16, 1, 'O'); wgRc(g, 2, 2, 14, 11, 'u'); wgRc(g, 1, 2, 1, 11, 'N'); wgRc(g, 16, 2, 1, 11, 'n'); // the rack
    for (const y of [7, 12]) wgRc(g, 2, y, 14, 1, 'N'); // its shelves
    for (const [x, y, k] of [[3, 3, 'B'], [7, 3, 'r'], [11, 3, 'B'], [4, 9, 'r'], [8, 9, 'y'], [12, 9, 'G']]) { // plates, and jars of jam
      if (y === 3) { wgRc(g, x, y, 4, 4, 'L'); wgRc(g, x + 1, y + 1, 2, 2, k); wgPx(g, x, y, 'w'); }
      else { wgRc(g, x, y - 1, 3, 4, k); wgRc(g, x, y - 1, 3, 1, 'L'); wgPx(g, x, y, 'w'); } // a jar with a white lid
    }
    wgRc(g, 0, 13, 18, 2, 'N'); wgRc(g, 0, 13, 18, 1, 'O'); // the worktop
    wgRc(g, 1, 15, 16, 10, 'n'); wgRc(g, 1, 15, 1, 10, 'N'); wgRc(g, 16, 15, 1, 10, 'u'); wgRc(g, 8, 15, 2, 10, 'u'); // the cupboard
    for (const x of [3, 10]) { wgRc(g, x, 17, 5, 6, 'N'); wgRc(g, x, 17, 5, 1, 'O'); } wgPx(g, 7, 20, 'y'); wgPx(g, 10, 20, 'y'); // its doors and knobs
  })]);
};
