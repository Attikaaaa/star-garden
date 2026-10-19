'use strict';
// Wildgrove: a scythe. USE with it in hand reaps a three by three patch round the aimed tile (`wgScytheReap`): every ripe
// crop is harvested and set growing again, as USE on one does, and tall grass is cut; with nothing there to reap, USE
// does what it would anyway. The crops reaped count in `stats.reap`; fifty light BOUNTIFUL HARVEST.
(function () {
  wgItem('scythe', 'SCYTHE', 'tool', { tool: 'scythe', tier: 0, stack: 1 }); wgRec('scythe', 1, { iron: 2, stick: 3, string: 1 }, 'anvil');
  WG_ACH.push(['reap', 'BOUNTIFUL HARVEST', 'REAP 50 CROPS WITH A SCYTHE', (c) => (c.st.reap | 0) >= 50]);
})();
function wgScytheReap(tx, ty) { // the crops and grass reaped round (tx, ty): [crops, grass]
  const w = WGS.world, dim = WGS.dim; let crops = 0, grass = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const x = tx + dx, y = ty + dy, id = wgObjAt(w, dim, x, y), o = id && OBJ[id]; if (!o) continue;
    if (o.kind === 'crop' && wgMetaAt(w, dim, x, y) >= 3) { wgBreak(x, y, true); wgSetObj(w, dim, x, y, id, 0); crops++; }
    else if (o.id === 'tallgrass') { wgBreak(x, y, true); grass++; }
  }
  return [crops, grass];
}
const _wgUseScythe = wgUse;
wgUse = function (tx, ty) {
  const s = WGS.inv[WGS.sel]; if (!s || s.id !== 'scythe' || !WGS.world) return _wgUseScythe(tx, ty);
  const [crops, grass] = wgScytheReap(tx, ty); if (!crops && !grass) return _wgUseScythe(tx, ty);
  WGS.p.swing = 0.25; wgSfx('cut'); wgPart(tx * 16 + 8, ty * 16 + 8, 10, { c: crops ? ['y', 'Y', 'O', 'h'] : ['g', 'G', 'h'], s: 40, up: 20 });
  if (crops) { const st = WGS.world.meta.stats || (WGS.world.meta.stats = { kills: 0, far: 0 }); st.reap = (st.reap | 0) + crops; }
  return true;
};
const _wgTipScythe = wgTipLines;
wgTipLines = function (s) { const L = _wgTipScythe(s); if (s.id === 'scythe') L.push('REAPS THREE BY THREE', 'RIPE CROPS GROW AGAIN'); return L; };
const _wgIconScythe = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (id !== 'scythe' || WGA.cache[key]) return _wgIconScythe(id);
  const c = wgMake(key, 16, 16, (g) => { // a long snath with a grip, the curved blade across its top
    for (let i = 0; i < 11; i++) wgPx(g, 4 + i, 14 - i, i % 3 ? 'N' : 'n'); wgPx(g, 7, 12, 'n'); wgPx(g, 8, 12, 'N'); // the snath and its grip
    wgPaint(g, 1, 1, ['.....LLLL..', '...Lllmm...', '.Llm.......', 'Lm.........', 'm..........'], { L: 'L', l: 'l', m: 'm' }); wgRc(g, 12, 2, 3, 2, 'X'); // the blade, its tang
  });
  WGA.cache[key] = c; return c;
};
