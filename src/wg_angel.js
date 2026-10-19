'use strict';
// Wildgrove: snow angels. USE with an empty hand on the snow under your own feet (nothing on it, not seated) and the
// hero lies back and sweeps out a snow angel: a flat `snow_angel` on that tile, so it goes over co-op with the tile,
// pressed into the snow with its lip in shade (`wgAngelArt`), puffs of snow to either side. It can be walked over; a
// knock smooths it away; while it rains or snows the host lets the fresh fall fill them in one by one (a `wgGrowTick`
// wrapper). Angels made count in `stats.angels`; the first lights SNOW ANGEL. (Elsewhere an empty hand still scoops.)
const WG_ANGEL = ['.....###.....', '#...#####...#', '##..#####..##', '###..###..###', '.###########.', '..#########..', '...#######...', '...#######...', '...#######...', '..#########..', '.###########.', '#############', '.###########.'];
(function () {
  wgObj('snow_angel', { name: 'SNOW ANGEL', kind: 'deco', tool: 'hand', hp: 1, solid: 0, angel: 1, drops: [] });
  WG_ACH.push(['angel', 'SNOW ANGEL', 'EMPTY HANDED, USE THE SNOW UNDER YOU', (c) => (c.st.angels | 0) > 0]);
})();
const _wgUseAngel = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, p = WGS.p, s = WGS.inv[WGS.sel];
  if (!w || !p || s || p.sit || tx !== Math.floor(p.x / 16) || ty !== Math.floor(p.y / 16) || wgObjAt(w, WGS.dim, tx, ty) || wgGroundAtT(tx, ty).id !== 'snow') return _wgUseAngel(tx, ty);
  wgSetObj(w, WGS.dim, tx, ty, O_ID.snow_angel, 0);
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.angels = (st.angels | 0) + 1; if (st.angels === 1) wgToast('A SNOW ANGEL!', 3);
  wgSfx('cut'); for (const dx of [-7, 7]) wgPart(tx * 16 + 8 + dx, ty * 16 + 8, 5, { c: ['w', 'L', 'l'], s: 18, up: 10, life: 0.6 });
  return true;
};
function wgAngelArt() { // pressed into the snow: the lip at the top left in shade, the far rim catching the light
  return WGA.cache.snow_angel || wgMake('snow_angel', 13, 13, (g) => {
    const on = (x, y) => y >= 0 && y < 13 && x >= 0 && x < 13 && WG_ANGEL[y][x] === '#';
    for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) if (on(x, y)) wgPx(g, x, y, !on(x, y - 1) || !on(x - 1, y) ? 'm' : !on(x, y + 1) || !on(x + 1, y) ? 'w' : 'l');
  }, false);
}
const _wgDrawObjAngel = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.angel) return _wgDrawObjAngel(id, tx, ty, sx, sy);
  ctx.globalAlpha = 0.7; ctx.drawImage(wgAngelArt(), sx + 2, sy + 2); ctx.globalAlpha = 1;
};
const _wgGrowAngel = wgGrowTick;
wgGrowTick = function (dt) { // the fresh fall fills them in, one here and one there
  _wgGrowAngel(dt);
  const w = WGS.world; if (WGS.growT !== 1 || !w || !WGS.weather) return;
  const A = O_ID.snow_angel, CS = WG.CS;
  for (const ch of w.chunks.values()) {
    if (ch.dim !== 'o') continue;
    for (let k = 0; k < CS * CS; k++) if (ch.o[k] === A && Math.random() < 1 / 20) wgSetObj(w, 'o', ch.cx * CS + k % CS, ch.cy * CS + Math.floor(k / CS), 0);
  }
};
