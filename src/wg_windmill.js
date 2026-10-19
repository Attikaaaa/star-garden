'use strict';
// Wildgrove: a windmill. A whitewashed tower with a wooden cap is a station (`WG_AT.windmill`) that grinds a wheat into
// a flour (half what the bench needs) and corn into cornmeal for cornbread. Its four sails turn all day, quicker in
// the rain and quicker still in a storm, worked out from the world's clock alone (`wgMillFrame`: four baked frames a
// quarter turn), so every co-op screen sees them turn alike; by night its window glows. Baking cornbread lights MILLER.
const WG_MILL_R = 20, WG_MILL_HUB = [8, -22]; // the sails' reach; the hub from the tile's top left
(function () {
  wgObj('windmill', { name: 'WINDMILL', kind: 'station', st: 'windmill', tool: 'axe', hp: 8, solid: 1, mill: 1, drops: [DR('windmill', 1, 1)] });
  wgItem('windmill', 'WINDMILL', 'place', { place: 'windmill' }); PLACE.windmill = 'windmill'; wgRec('windmill', 1, { wood: 8, stone: 6, wool: 3 }, 'bench');
  WG_AT.windmill = 'AT A WINDMILL';
  wgItem('cornmeal', 'CORNMEAL', 'res'); wgItem('cornbread', 'CORNBREAD', 'food', { food: 9 });
  wgRec('flour', 1, { wheat: 1 }, 'windmill'); wgRec('cornmeal', 1, { corn: 2 }, 'windmill'); wgRec('cornbread', 1, { cornmeal: 2, butter: 1 }, 'fire');
  WG_ACH.push(['mill', 'MILLER', 'BAKE CORNBREAD FROM YOUR OWN CORNMEAL', (c) => c.seen.cornbread]);
})();
const _wgUseMill = wgUse;
wgUse = function (tx, ty) { // the windmill opens the recipe book like any station
  const o = WGS.world && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (o && o.mill) { WGS.scr = 'inv'; WGS.ui = { tab: 'craft' }; return true; }
  return _wgUseMill(tx, ty);
};
function wgMillFrame() { // which of the four frames, from the world's clock: always turning, quicker in the rain
  const T = ((WGS.day | 0) + WGS.clock % 1) * wgDayLen(), W = WGS.weather, k = W ? (W.storm ? 2.2 : 1.6) : 1;
  return Math.floor((T * 0.55 + 2.4 * Math.sin(T / 53)) * k * 4) & 3; // never backwards: 0.55 + 2.4 / 53 cos > 0
}
const _wgDrawObjMill = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.mill) return _wgDrawObjMill(id, tx, ty, sx, sy);
  shadow(sx + 8, sy + 14, 13); _wgDrawObjMill(id, tx, ty, sx, sy);
  const hx = sx + WG_MILL_HUB[0], hy = sy + WG_MILL_HUB[1], dark = WGS.dim === 'o' && wgNight(WGS.clock) > 0.3;
  if (dark) { rect(hx - 1, hy + 12, 2, 3, 'Y'); rect(hx - 1, hy + 12, 1, 1, 'w'); WGR.lights.push({ x: hx, y: hy + 13, r: 16, f: 0.6 }); } // the window lit
  ctx.drawImage(wgMillSails(wgMillFrame()), hx - WG_MILL_R - 1, hy - WG_MILL_R - 1);
};
function wgMillSails(f) { // four sails at f eighths of a quarter turn: a spar, and a lattice of cloth on its trailing side
  const key = 'mill_sail' + f; if (WGA.cache[key]) return WGA.cache[key];
  const R = WG_MILL_R, n = 2 * R + 3;
  return wgMake(key, n, n, (g) => {
    const c = R + 1.5;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const dx = x + 0.5 - c, dy = y + 0.5 - c;
      for (let b = 0; b < 4; b++) {
        const a = (f / 8 + b) * Math.PI / 2, ux = Math.cos(a), uy = Math.sin(a), al = dx * ux + dy * uy, pp = -dx * uy + dy * ux; // along the spar, across it
        if (al < 1.5 || al > R) continue;
        if (Math.abs(pp) < 0.7) { wgPx(g, x, y, 'n'); break; }
        if (al > 6 && pp >= 0.7 && pp < 5) { wgPx(g, x, y, pp >= 4.2 || al > R - 1 || al < 7 || Math.floor(al) % 4 === 2 ? 'N' : pp < 2.2 ? 'w' : 'L'); break; }
      }
    }
    wgRc(g, R, R, 3, 3, 'u'); wgPx(g, R + 1, R + 1, 'N'); wgPx(g, R, R, 'n'); // the hub
  });
}
const _wgTipMill = wgTipLines;
wgTipLines = function (s) { const L = _wgTipMill(s); if (s.id === 'windmill') L.push('GRINDS WHEAT AND CORN'); return L; };
const _wgIconMill = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if ((id !== 'cornmeal' && id !== 'cornbread' && id !== 'windmill') || WGA.cache[key]) return _wgIconMill(id);
  const [c, g] = wgCv(16, 16);
  if (id === 'windmill') { // a little tower under its sails, crossed
    for (let i = 0; i < 6; i++) { wgPx(g, 3 + i, 1 + i, 'n'); wgPx(g, 12 - i, 1 + i, 'n'); wgPx(g, 4 + i, 1 + i, 'w'); wgPx(g, 11 - i, 1 + i, 'w'); }
    wgPx(g, 2, 7, 'n'); wgPx(g, 3, 8, 'n'); wgPx(g, 13, 7, 'n'); wgPx(g, 12, 8, 'n');
    wgRc(g, 5, 8, 6, 8, 'L'); wgRc(g, 5, 8, 2, 8, 'w'); wgRc(g, 10, 8, 1, 8, 'l'); wgRc(g, 7, 12, 2, 4, 'u');
    wgBlob(g, 8, 8, 3.4, 2.6, ['u', 'n', 'N', 'O']); wgRc(g, 7, 7, 2, 2, 'u');
  } else if (id === 'cornmeal') { // a little sack of yellow meal, its top open
    wgBlob(g, 8, 10.5, 5.4, 4.6, ['n', 'N', 'O', 'O']); wgRc(g, 4, 5, 8, 2, 'N'); wgRc(g, 5, 4, 6, 2, 'y'); wgRc(g, 6, 3, 4, 1, 'Y'); wgRc(g, 4, 7, 8, 1, 'n');
  } else { // a golden square of cornbread with a pat of butter
    wgRc(g, 3, 6, 10, 7, 'o'); wgRc(g, 3, 6, 10, 2, 'y'); wgRc(g, 3, 6, 1, 7, 'y'); wgRc(g, 12, 7, 1, 6, 'O'); wgRc(g, 4, 12, 9, 1, 'O');
    for (const [x, y] of [[5, 9], [8, 10], [10, 8], [6, 11]]) wgPx(g, x, y, 'Y'); wgRc(g, 7, 4, 3, 2, 'Y'); wgPx(g, 7, 4, 'w');
  }
  wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgBuildMill = wgBuildAll;
wgBuildAll = function () {
  _wgBuildMill();
  wgReg('windmill', [wgMake('windmill', 26, 54, (g) => { // a whitewashed tower narrowing up, a wooden cap, a door and a window
    wgBlob(g, 13, 21, 8.6, 9, ['u', 'n', 'N', 'O']); g.clearRect(0, 21, 26, 33); // the cap, a dome cut off at its brim
    wgRc(g, 12, 9, 2, 4, 'n'); wgPx(g, 12, 8, 'N');
    for (let y = 21; y <= 51; y++) {
      const u = (y - 21) / 30, x0 = Math.round(6 - 4 * u), x1 = Math.round(19 + 4 * u);
      wgRc(g, x0, y, x1 - x0 + 1, 1, 'L'); wgRc(g, x0, y, 2, 1, 'w'); wgRc(g, x1 - 1, y, 2, 1, 'l');
      if (y % 8 === 0) wgRc(g, x0 + 2, y, x1 - x0 - 3, 1, 'l');
    }
    wgRc(g, 4, 21, 18, 1, 'n'); wgRc(g, 5, 22, 16, 1, 'u'); // the brim
    wgRc(g, 11, 43, 5, 9, 'u'); wgRc(g, 12, 42, 3, 1, 'u'); wgRc(g, 12, 44, 3, 8, 'n'); wgPx(g, 14, 47, 'Y'); // the door
    wgRc(g, 12, 28, 2, 3, 'b'); wgPx(g, 12, 28, 'B'); // the window
    wgRc(g, 1, 52, 24, 1, 'm');
  })]);
};
