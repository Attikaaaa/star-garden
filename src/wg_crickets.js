'use strict';
// Wildgrove: crickets. On dry spring and summer nights, while the hero stands on grass outdoors, a cricket chirps
// somewhere near every few seconds (the soft `cricket` sound). Each screen its own; off with the ambient life option.
const WG_CRICKET_GROUNDS = ['grass', 'moss', 'jungle'];
const WGCRK = { next: 0 };
const _wgUpdCricket = updateWG;
updateWG = function (dt) {
  _wgUpdCricket(dt);
  const w = WGS.world, p = WGS.p, T = WGS.t;
  if (!w || !p || WGS.scr !== 'play' || WGS.dim !== 'o' || !wgOpt().amb || wgSeason() > 1 || wgNight(WGS.clock) < 0.5 || WGS.weather) { WGCRK.next = 0; return; }
  if (!WG_CRICKET_GROUNDS.includes(GROUND[wgGround(w, 'o', Math.floor(p.x / 16), Math.floor(p.y / 16))].id)) return;
  if (!WGCRK.next) { WGCRK.next = T + 2 + Math.random() * 3; return; }
  if (T > WGCRK.next) { wgSfx('cricket'); WGCRK.next = T + 4 + Math.random() * 7; }
};
