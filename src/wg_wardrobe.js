'use strict';
// Wildgrove: the wardrobe. USE it to change your look (skin, hair, tunic) as on the new-world page, with the hero shown
// walking from all four sides; a hat stays on. Friends see the change: a guest sends 'lk' (skin * 100 + hair * 10 +
// shirt) in the 'p' message and the host shares the look in 'ps' as always; every look from the net is checked
// (wgnLook in wg_net). The NEW LOOK star.
(function () {
  wgObj('wardrobe', { name: 'WARDROBE', kind: 'deco', tool: 'axe', hp: 6, robe: 1, drops: [DR('wardrobe', 1, 1)] });
  wgItem('wardrobe', 'WARDROBE', 'place', { place: 'wardrobe' }); PLACE.wardrobe = 'wardrobe'; wgRec('wardrobe', 1, { wood: 6, glass: 2 }, 'bench');
  WG_ACH.push(['look', 'NEW LOOK', 'CHANGE YOUR LOOK AT A WARDROBE', (c) => c.st.look]);
})();
const _wgUseWardrobe = wgUse;
wgUse = function (tx, ty) {
  const o = OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (!o || !o.robe) return _wgUseWardrobe(tx, ty);
  const p = WGS.p; p.look = p.look || { skin: 0, hair: 0, shirt: 0 };
  WGS.robe = { t0: WGS.t, was: Object.assign({}, p.look) }; WGS.scr = 'robe'; WGS.ui = {}; wgSfx('select');
  return true;
};
function wgRobeDone() {
  const p = WGS.p, R = WGS.robe; WGS.scr = 'play'; WGS.robe = null;
  if (!R || ['skin', 'hair', 'shirt'].every(k => (p.look[k] | 0) === (R.was[k] | 0))) return;
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.look = 1; wgToast('LOOKING GOOD!', 2);
}
const _wgUpdWardrobe = updateWG;
updateWG = function (dt) {
  _wgUpdWardrobe(dt);
  if (WGS.scr !== 'robe' || !WGS.world) return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  if (!WGS.robe) WGS.scr = 'play'; else if (WGS.t > WGS.robe.t0 && pressed('Escape', 'PadB')) wgRobeDone(); // not on the press that opened it
};
const _wgDrawWardrobe = drawWG;
drawWG = function () {
  _wgDrawWardrobe();
  if (WGS.scr !== 'robe' || !WGS.world || !WGS.robe) return;
  const p = WGS.p, L = p.look, ui = WGS.ui, x = VW / 2 - 100, y = 40, fr = Math.floor(WGS.t * 6) % 4;
  dim(0.45); panel(x, y, 200, 128);
  wtext('WARDROBE', VW / 2, y + 8, 'Y', 0, 1);
  rect(x + 16, y + 24, 168, 34, 'A'); rect(x + 16, y + 24, 168, 1, 'w'); rect(x + 16, y + 57, 168, 1, 'e'); // a pale floor to stand the hero on, from all four sides
  ['d', 'l', 'u', 'r'].forEach((d, i) => { const sx = x + 46 + i * 36, spr = wgPlayerSpr(d === 'r' ? 'l' : d, fr, L); ctx.save(); ctx.translate(sx, y + 28); if (d === 'r') ctx.scale(-1, 1); ctx.drawImage(spr, -9, 0); ctx.restore(); });
  wgUiBegin(ui);
  const cyc = (k, n, bx, lab) => { if (wgButton(ui, lab + ' <>', bx, y + 68, 52, { h: 12 })) p.look = Object.assign({}, L, { [k]: ((L[k] | 0) + 1) % n }); };
  cyc('skin', WG_SKIN.length, x + 16, 'SKIN'); cyc('hair', WG_HAIR.length, x + 74, 'HAIR'); cyc('shirt', WG_SHIRT.length, x + 132, 'SHIRT');
  if (wgButton(ui, 'DONE', VW / 2 - 40, y + 98, 80)) wgRobeDone();
  wgUiEnd(ui);
};
// ---------- art: a tall wooden wardrobe, a mirror on its left door catching the light, a knob on the right ----------
const _wgBuildWardrobe = wgBuildAll;
wgBuildAll = function () {
  _wgBuildWardrobe();
  wgReg('wardrobe', [wgMake('wardrobe', 16, 28, (g) => {
    wgRc(g, 1, 2, 14, 24, 'n'); wgRc(g, 0, 1, 16, 2, 'N'); wgRc(g, 0, 1, 16, 1, 'a'); wgRc(g, 1, 3, 1, 23, 'N'); wgRc(g, 14, 3, 1, 23, 'u'); // the case, its crown lit
    wgRc(g, 2, 4, 6, 19, 'C'); wgRc(g, 2, 4, 6, 1, 'w'); wgRc(g, 2, 4, 1, 19, 'w'); wgRc(g, 7, 5, 1, 18, 'c'); wgLine(g, 3, 12, 6, 8, 'w'); wgLine(g, 3, 16, 6, 12, 'w'); // the mirror and its glints
    wgRc(g, 8, 4, 1, 19, 'u'); wgRc(g, 9, 4, 5, 19, 'N'); wgRc(g, 9, 4, 5, 1, 'a'); wgRc(g, 13, 5, 1, 18, 'n'); wgPx(g, 10, 13, 'y'); wgPx(g, 10, 14, 'o'); // the right door and its knob
    wgRc(g, 1, 24, 14, 2, 'u'); wgRc(g, 2, 26, 2, 1, 'u'); wgRc(g, 12, 26, 2, 1, 'u'); // the plinth and its feet
  })]);
};
const _wgTipWardrobe = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipWardrobe(s);
  if (s.id === 'wardrobe') L.push('USE IT TO CHANGE YOUR LOOK', 'FRIENDS SEE IT TOO');
  return L;
};
