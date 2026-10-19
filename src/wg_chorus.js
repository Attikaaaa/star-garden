'use strict';
// Wildgrove: the dawn chorus. Each morning as the sky lightens (`WGS.clock` between `WG_CHORUS_FROM` and
// `WG_CHORUS_TO`) the birds in the trees sing: every so often a tree in view (a tall one, not in winter, not in the
// rain, outdoors) lets out a soft trill (the `song` sound) and a little note floats up from its crown (`WGCH.list`,
// drawn by a `wgDrawAmbient` wrapper). Ambient life, each screen its own; none with it switched off. The first
// morning you hear them is told, the EARLY BIRD star.
const WG_CHORUS_FROM = 0.15, WG_CHORUS_TO = 0.3, WG_CHORUS_GAP = 0.9; // the morning's stretch of the day; seconds between songs, about
const WGCH = { list: [], t: 0 }; // notes rising from crowns: world x, y, colour, start
(function () {
  WG_ACH.push(['chorus', 'EARLY BIRD', 'HEAR THE DAWN CHORUS', (c) => (c.st.chorus | 0) > 0]);
})();
const wgChorusOn = () => !!WGS.world && WGS.dim === 'o' && wgOpt().amb && wgSeason() !== 3 && WGS.clock > WG_CHORUS_FROM && WGS.clock < WG_CHORUS_TO && !(WGS.weather && WGS.weather.kind === 'rain');
const _wgUpdChorus = updateWG;
updateWG = function (dt) {
  _wgUpdChorus(dt);
  const L = WGCH.list; while (L.length && (WGS.t - L[0].t > 1.6 || L[0].t > WGS.t)) L.shift();
  if (WGS.scr !== 'play' || !wgChorusOn()) return;
  if ((WGCH.t -= dt) > 0) return; WGCH.t = WG_CHORUS_GAP * (0.5 + Math.random());
  const w = WGS.world, cam = WGS.cam, tx0 = Math.floor((cam.x - SCR.w / 2) / 16), ty0 = Math.floor((cam.y - SCR.h / 2) / 16), trees = [];
  for (let ty = ty0; ty <= ty0 + Math.ceil(SCR.h / 16); ty++) for (let tx = tx0; tx <= tx0 + Math.ceil(SCR.w / 16); tx++) {
    const o = OBJ[wgObjAt(w, 'o', tx, ty)]; if (o && o.kind === 'tree' && o.tall >= 2) trees.push([tx, ty]);
  }
  if (!trees.length) return;
  const [tx, ty] = trees[Math.floor(Math.random() * trees.length)];
  L.push({ x: tx * 16 + 8 + Math.round(Math.random() * 8 - 4), y: ty * 16 - 18 - Math.round(Math.random() * 6), k: Math.floor(Math.random() * 8), t: WGS.t }); if (L.length > 12) L.shift();
  wgSfx('song');
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); if (!st.chorus) { st.chorus = 1; wgToast('THE BIRDS ARE SINGING', 2.5); }
};
const _wgAmbChorus = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbChorus(cx0, cy0);
  for (const n of WGCH.list) {
    const u = (WGS.t - n.t) / 1.6, x = Math.round(n.x - cx0 + Math.sin(u * 6 + n.k) * 2), y = Math.round(n.y - cy0 - 16 * u);
    ctx.globalAlpha = u < 0.6 ? 1 : (1 - u) / 0.4; ctx.drawImage(wgOcaNoteArt(n.k), x - 3, y - 4); ctx.globalAlpha = 1;
  }
};
