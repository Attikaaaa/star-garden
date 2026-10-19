'use strict';
// Wildgrove: quilted beds. A bed, some wool and a few petals at the loom make a bed under a patchwork quilt in one of
// four colourings (`WG_QUILTS`); each is a bed like any other (it sets the spawn point and sleeps the night away), only
// cosier to look at.
const WG_QUILTS = [ // id, name, petal, the patches' three colours
  ['quilt_rose', 'ROSE QUILT BED', 'petal_r', ['r', 'q', 'w']], ['quilt_sky', 'SKY QUILT BED', 'petal_b', ['B', 'C', 'w']],
  ['quilt_sun', 'SUNNY QUILT BED', 'petal_y', ['o', 'y', 'Y']], ['quilt_lilac', 'LILAC QUILT BED', 'petal_p', ['2', '3', '4']],
];
(function () {
  for (const [id, name, petal] of WG_QUILTS) {
    wgObj(id, { name, kind: 'bed', tool: 'axe', hp: 6, solid: 0, quilt: 1, drops: [DR(id, 1, 1)] });
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id;
    wgRec(id, 1, { bed: 1, wool: 2, [petal]: 2 }, 'loom');
  }
})();
const _wgBuildQuilt = wgBuildAll;
wgBuildAll = function () {
  _wgBuildQuilt();
  const W4 = ['u', 'n', 'N', 'O'];
  for (const [id, , , Q] of WG_QUILTS) wgReg(id, [wgMake(id, 16, 16, (g) => { // the frame as the plain bed's, the quilt in diagonal patches, a turned-down sheet and a pillow
    wgRc(g, 0, 3, 16, 12, W4[1]); wgRc(g, 0, 3, 16, 1, W4[2]); wgRc(g, 0, 3, 1, 12, W4[2]); wgRc(g, 15, 4, 1, 11, W4[0]); wgRc(g, 1, 14, 15, 1, W4[0]);
    for (let y = 4; y <= 13; y++) for (let x = 1; x <= 14; x++) wgPx(g, x, y, Q[(Math.floor((x - 1) / 2) + Math.floor((y - 4) / 2)) % 3]);
    wgRc(g, 1, 9, 14, 1, 'w'); wgRc(g, 1, 10, 14, 1, 'l');
    wgRc(g, 2, 5, 5, 4, 'L'); wgRc(g, 2, 5, 5, 1, 'w'); wgRc(g, 6, 5, 1, 4, 'l'); wgRc(g, 2, 8, 5, 1, 'l');
  })]);
};
const _wgTipQuilt = wgTipLines;
wgTipLines = function (s) { const L = _wgTipQuilt(s), o = OBJ[O_ID[s.id]]; if (o && o.quilt) L.push('A BED UNDER A PATCHWORK QUILT'); return L; };
