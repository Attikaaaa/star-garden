'use strict';
// Wildgrove: the homing feather. USE it and stand still while it glows; it carries you home to your bed (or the
// world's spawn), across dimensions too. A step or a hit breaks the glow. It is never used up. Your hero moves on your
// own screen, so a co-op client goes home as easily as the host. Ids are appended, so old worlds stay valid.
const WG_HOME_T = 1.6; // seconds to stand still
(function () {
  wgItem('home_feather', 'HOMING FEATHER', 'res', { stack: 1 }); wgRec('home_feather', 1, { feather: 3, crystal: 1 }, 'bench');
})();
function wgHomeStart() {
  const p = WGS.p; if (WGS.homing) return;
  WGS.homing = { t: WG_HOME_T, x: p.x, y: p.y, hp: p.hp }; wgToast('STAND STILL...'); wgSfx('chime');
}
function wgHomeArrive() {
  const p = WGS.p, sp = p.spawn || WGS.world.spawn, dim = sp.dim || 'o';
  wgPart(p.x, p.y - 10, 8, { c: ['Y', 'y', 'w'], s: 30, up: 20 });
  if (dim !== WGS.dim) { WGS.dim = dim; WGS.mobs = []; WGS.mine = null; } // what roams another dimension stays there
  p.x = sp.x; p.y = sp.y; p.vx = p.vy = 0; WGS.cam.x = p.x; WGS.cam.y = p.y;
  wgPart(p.x, p.y - 10, 10, { c: ['Y', 'y', 'w'], s: 30, up: 20 }); wgToast('HOME AGAIN'); wgSfx('pickup');
  const m = WGS.world.meta; (m.stats || (m.stats = { kills: 0, far: 0 })).home = 1;
}
const wgHoldsFeather = () => { const s = WGS.inv[WGS.sel]; return !!s && s.id === 'home_feather'; };
const _wgUseHome = wgUse;
wgUse = function (tx, ty) {
  if (wgHoldsFeather() && !_wgUseHome(tx, ty)) wgHomeStart(); // a door or a chest under the aim still opens
  else if (!wgHoldsFeather()) return _wgUseHome(tx, ty);
  return true;
};
const _wgUpdHome = updateWG;
updateWG = function (dt) {
  const fresh = WGS.scr === 'play' && !WGS.target && wgHoldsFeather() && (Input.rHit || pressed(wgKey('use'), 'KeyK', 'PadX', 'PadLT') || (WGS.touch && WGS.touch.use));
  _wgUpdHome(dt);
  if (fresh && WGS.scr === 'play') wgHomeStart(); // the aim out of reach: the feather works anyway
  const H = WGS.homing; if (!H) return;
  const p = WGS.p;
  if (WGS.scr !== 'play' && WGS.scr !== 'pause') { WGS.homing = null; return; }
  if (WGS.scr !== 'play') return;
  if (Math.hypot(p.x - H.x, p.y - H.y) > 3 || p.hp < H.hp || !wgHoldsFeather()) { WGS.homing = null; wgToast('THE GLOW FADES'); return; }
  if (Math.random() < dt * 14) { const a = Math.random() * 6.28; wgPart(p.x + Math.cos(a) * 14, p.y - 10 + Math.sin(a) * 10, 1, { c: ['Y', 'y', 'w'], s: 4, up: 10, life: 0.5 }); }
  if ((H.t -= dt) <= 0) { WGS.homing = null; wgHomeArrive(); }
};
const _wgTipHome = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipHome(s);
  if (s.id === 'home_feather') L.push('USE IT TO GO HOME TO YOUR BED', 'STAND STILL WHILE IT GLOWS');
  return L;
};
// a glow at the hero's feet while the feather works
const _wgAmbHome = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbHome(cx0, cy0);
  const H = WGS.homing; if (!H || !WGS.p) return;
  const k = 1 - H.t / WG_HOME_T, x = WGS.p.x - cx0, y = WGS.p.y - cy0, r = 13 - k * 6, t = WGS.t * 3; // a ring of sparks that closes in
  for (let i = 0; i < 12; i++) { const a = t + i * 0.5236; rect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.4), 1, 1, i % 3 ? 'Y' : 'w'); }
};
const _wgIconHome = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || id !== 'home_feather') return _wgIconHome(id);
  const [c, g] = wgCv(16, 16);
  for (let i = 0; i <= 11; i++) { // a golden feather on the slant: the quill, then the shaft between a light vane and a warm one
    const x = 2 + i, y = 13 - i, v = i < 3 ? 0 : i < 5 || i > 9 ? 1 : 2;
    wgPx(g, x, y, i < 3 ? 'n' : 'O'); for (let k = 1; k <= v; k++) { wgPx(g, x, y - k, 'Y'); wgPx(g, x, y + k, 'y'); }
  }
  wgPx(g, 13, 1, 'Y'); wgPx(g, 7, 6, 'w'); wgPx(g, 9, 4, 'w');
  wgOutline(c); WGA.cache[key] = c; return c;
};
