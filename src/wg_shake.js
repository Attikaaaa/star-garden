'use strict';
// Wildgrove: brushing past trees. A hero who walks close by a tree's trunk shakes its crown: in winter a puff of snow
// drifts down from it, in autumn a few leaves of its colour, in spring blossom from a tree in flower (wg_drift's
// colours); then that tree rests for `WG_SHAKE_REST` s (`WGSHK.rest`, this screen's own). Particles only, for your hero
// alone; none with the particles off.
const WG_SHAKE_NEAR = 14, WG_SHAKE_REST = 15;
const WGSHK = { rest: new Map(), t: 0, x: 0, y: 0 };
function wgShakeCols(o, tx, ty) { // what falls from this tree now, or null: snow in winter, else what wg_drift lets it drop
  const s = wgSeason();
  if (s === 3) return o.id === 'palm' || o.id === 'jungle' ? null : ['w', 'L', 'w'];
  return s === 0 || s === 2 ? wgDriftCols(o.id, tx, ty, s) : null;
}
const _wgUpdShake = updateWG;
updateWG = function (dt) {
  _wgUpdShake(dt);
  const w = WGS.world, p = WGS.p; if (!w || !p || p.hidden || WGS.scr !== 'play' || WGS.dim !== 'o') return;
  if ((WGSHK.t += dt) < 0.1) return; WGSHK.t = 0; // a look round ten times a second is plenty
  const moved = Math.hypot(p.x - WGSHK.x, p.y - WGSHK.y) > 0.5; WGSHK.x = p.x; WGSHK.y = p.y; if (!moved || p.sit) return; // only walking by shakes it
  const tx0 = Math.floor(p.x / 16), ty0 = Math.floor(p.y / 16), T = WGS.t;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const tx = tx0 + i, ty = ty0 + j, o = OBJ[wgObjAt(w, 'o', tx, ty)]; if (!o || o.kind !== 'tree' || o.tall < 2) continue;
    if (Math.hypot(p.x - (tx * 16 + 8), p.y - (ty * 16 + 12)) > WG_SHAKE_NEAR) continue;
    const key = tx + ',' + ty; if (WGSHK.rest.get(key) > T) continue;
    const c = wgShakeCols(o, tx, ty); if (!c) continue;
    WGSHK.rest.set(key, T + WG_SHAKE_REST); if (WGSHK.rest.size > 200) WGSHK.rest.clear();
    for (let n = 0; n < 3; n++) wgPart(tx * 16 + 8 + (n - 1) * 7, ty * 16 - 14 - n * 3, 3, { c, s: 10, up: -4, g: 22, life: 1.4 });
  }
};
