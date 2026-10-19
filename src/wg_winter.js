'use strict';
// Wildgrove: the winter pack. USE on bare snow, empty-handed or with a shovel, scoops a snowball; three make a snowman
// (each one gets its own scarf), four make snow walls for an igloo; an ice lantern glows warm through the ice, and hot
// cider warms you up. Ids are appended, so old worlds stay valid.
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'shovel', hp: 3, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, at);
  };
  wgItem('snowball', 'SNOWBALL', 'res', {});
  dec('snowman', 'SNOWMAN', {}, { snowball: 3, coal: 2, carrot: 1, stick: 2 }, 'hand');
  dec('ice_lantern', 'ICE LANTERN', { kind: 'light', light: 70, tool: 'pick' }, { ice_shard: 3, torch: 1 }, 'hand');
  wgObj('w_snow', { name: 'SNOW WALL', kind: 'wall', tool: 'shovel', hp: 6, ramp: ['m', 'l', 'L', 'w'], drops: [DR('wall_snow', 1, 1)] });
  PLACE.wall_snow = 'w_snow'; wgItem('wall_snow', 'SNOW WALL', 'place', { place: 'w_snow' }); wgRec('wall_snow', 2, { snowball: 4 }, 'hand');
  wgItem('hot_cider', 'HOT CIDER', 'food', { food: 8, buff: 'regen' }); wgRec('hot_cider', 1, { apple: 2, honey: 1 }, 'fire');
  WG_ACH.push(['snowman', 'FROSTY FRIEND', 'BUILD A SNOWMAN', (c) => c.seen.snowman]);
})();
const _wgUseWinter = wgUse;
wgUse = function (tx, ty) {
  if (_wgUseWinter(tx, ty)) return true;
  const s = WGS.inv[WGS.sel], it = s && WGI[s.id], w = WGS.world;
  if ((!s || it.tool === 'shovel') && !wgObjAt(w, WGS.dim, tx, ty) && wgGroundAtT(tx, ty).id === 'snow') { // scoop a snowball; the snow stays
    wgDrop(tx * 16 + 8, ty * 16 + 12, 'snowball', 1); wgSfx('select'); wgPart(tx * 16 + 8, ty * 16 + 10, 5, { c: ['w', 'L', 'l'], s: 20, up: 12 });
    return true;
  }
  return false;
};
const _wgTipWinter = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipWinter(s);
  if (s.id === 'snowball') L.push('SCOOP IT FROM SNOW WITH USE');
  return L;
};
const _wgBuildWinter = wgBuildAll;
wgBuildAll = function () {
  _wgBuildWinter();
  const SNOW = ['m', 'l', 'L', 'w'];
  // a snowman of three balls with coal eyes and buttons, a carrot nose and stick arms; the scarf (and a hat) differ
  wgReg('snowman', [['r', 'R', 0], ['B', 'c', 1], ['g', 'G', 0]].map(([s0, s1, hat], v) => wgMake('snowman' + v, 16, 27, (g) => {
    wgLine(g, 4, 13, 1, 10, 'n'); wgPx(g, 1, 9, 'n'); wgLine(g, 11, 13, 14, 10, 'n'); wgPx(g, 14, 9, 'n'); // the arms
    wgBlob(g, 8, 21, 6.4, 4.8, SNOW); wgBlob(g, 8, 13.6, 4.8, 3.8, SNOW); wgBlob(g, 8, 7.4, 3.6, 3.4, SNOW);
    wgPx(g, 7, 6, 'x'); wgPx(g, 9, 6, 'x'); wgRc(g, 9, 8, 2, 1, 'o'); wgPx(g, 11, 8, 'O'); // eyes and the nose
    for (const y of [13, 15, 20]) wgPx(g, 8, y, 'x');
    wgRc(g, 5, 10, 7, 2, s0); wgRc(g, 5, 10, 7, 1, s1); wgRc(g, 9, 12, 2, 3, s0); wgPx(g, 9, 12, s1); // the scarf
    if (hat) { wgRc(g, 6, 1, 5, 3, 'x'); wgRc(g, 6, 1, 5, 1, 'X'); wgRc(g, 5, 4, 7, 1, 'x'); wgRc(g, 6, 3, 5, 1, 'r'); } // a little top hat
  })));
  // a rough block of ice, its corners chipped, a candle's warm light glowing through it (flickering)
  wgReg('ice_lantern', [0, 1].map(v => wgMake('ice_lantern' + v, 14, 15, (g) => {
    wgPaint(g, 1, 1, ['..wwwwwwww..', '.wwwwwwwwwwC', 'wwccccccccCc', 'wCCCCCCCCCCc', 'wCCCCCCCCCCc', 'wCCCCCCCCCCc',
      'wCCCCCCCCCCc', 'wCCCCCCCCCCc', 'wCCCCCCCCCCc', 'wCCCCCCCCCCc', 'wCCCCCCCCCCB', '.CCCCCCCCCBc', '..cccccccBB.'], { w: 'w', C: 'C', c: 'c', B: 'B' });
    for (let y = 5; y <= 12; y++) for (let x = 3; x <= 10; x++) { // the warm light, soft at its edge
      const d = Math.hypot((x - 6.5) / 1.15, y - 8.5 + v * 0.3);
      if (d < 2.3 || (d < 3.7 && (x + y + v) % 2 === 0)) wgPx(g, x, y, 'Y');
    }
    wgRc(g, 6, 10, 1, 3, 'R'); wgRc(g, 7, 10, 1, 3, 'r'); // a little red candle
    wgPx(g, 6 + v, 6, 'Y'); wgPx(g, 6, 7, 'y'); wgPx(g, 7, 7, 'w'); wgPx(g, 6, 8, 'O'); wgPx(g, 7, 8, 'y'); wgPx(g, 6, 9, 'x'); // its flame
  })));
  OBJ[O_ID.ice_lantern].anim = 1;
};
const _wgIconWinter = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || (id !== 'snowball' && id !== 'hot_cider')) return _wgIconWinter(id);
  const [c, g] = wgCv(16, 16);
  if (id === 'snowball') { wgBlob(g, 8, 8.6, 5.4, 5, ['m', 'l', 'L', 'w']); wgPx(g, 6, 6, 'w'); wgPx(g, 10, 11, 'm'); }
  else { // a steaming mug of cider with a cinnamon stick
    wgRc(g, 3, 6, 8, 8, 'n'); wgRc(g, 3, 6, 2, 8, 'N'); wgRc(g, 10, 7, 1, 7, 'u'); wgRc(g, 4, 13, 6, 1, 'u'); wgRc(g, 11, 8, 2, 1, 'n'); wgRc(g, 12, 8, 1, 4, 'n'); wgRc(g, 11, 11, 2, 1, 'n'); // the mug
    wgRc(g, 4, 6, 6, 2, 'o'); wgRc(g, 4, 6, 6, 1, 'O'); wgRc(g, 8, 3, 1, 4, 'u'); wgPx(g, 8, 3, 'n'); // cider and the stick
    wgPx(g, 5, 3, 'L'); wgPx(g, 6, 2, 'L'); wgPx(g, 5, 1, 'L');
  }
  wgOutline(c); WGA.cache[key] = c; return c;
};
