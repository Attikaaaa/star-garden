'use strict';
// Wildgrove: preserves. Fruit, sugar and a glass jar cooked over a fire make jam (`WG_JAMS`: berry, apple, cherry,
// strawberry, orange marmalade and lemon curd), eaten from the jar; a scone with jam; a pantry shelf of jars to set
// out. Holding five kinds lights the PRESERVES star.
const WG_JAMS = [ // id, name, what goes in, the jam's ramp (shade, colour, light), the lid's check colour
  ['berry_jam', 'BERRY JAM', { berry: 4 }, ['1', '2', '3'], 'B'], ['apple_jam', 'APPLE JAM', { apple: 3 }, ['n', 'N', 'O'], 'G'],
  ['cherry_jam', 'CHERRY JAM', { cherry: 4 }, ['p', 'r', 'R'], 'r'], ['straw_jam', 'STRAWBERRY JAM', { strawberry: 4 }, ['r', 'R', 'q'], 'P'],
  ['marmalade', 'ORANGE MARMALADE', { orange: 3 }, ['o', 'O', 'Y'], 'o'], ['lemon_curd', 'LEMON CURD', { lemon: 2, egg: 1, butter: 1 }, ['e', 'y', 'Y'], 'y']];
(function () {
  for (const [id, name, rec] of WG_JAMS) { wgItem(id, name, 'food', { food: 7 }); wgRec(id, 1, Object.assign({ glass: 1, sugar: 1 }, rec), 'fire'); }
  wgItem('scone_jam', 'SCONE WITH JAM', 'food', { food: 12, buff: 'regen' }); wgRec('scone_jam', 2, { flour: 1, butter: 1, straw_jam: 1 }, 'fire');
  wgObj('pantry', { name: 'PANTRY SHELF', kind: 'deco', tool: 'axe', hp: 3, drops: [DR('pantry', 1, 1)] });
  wgItem('pantry', 'PANTRY SHELF', 'place', { place: 'pantry' }); PLACE.pantry = 'pantry'; wgRec('pantry', 1, { wood: 4, glass: 3, berry_jam: 1 }, 'bench');
  WG_ACH.push(['jam', 'PRESERVES', 'HOLD FIVE KINDS OF JAM', (c) => WG_JAMS.filter(j => c.seen[j[0]]).length >= 5]);
})();
function wgJarArt(g, x, y, k) { // a jar of jam: glass with the jam inside, a checked cloth over its lid tied with string
  const [, , , [D, M, L], chk] = WG_JAMS[k];
  wgRc(g, x + 1, y + 4, 8, 8, 'C'); wgRc(g, x + 2, y + 3, 6, 1, 'C'); // the glass
  wgRc(g, x + 2, y + 6, 6, 6, M); wgRc(g, x + 2, y + 6, 6, 1, L); wgRc(g, x + 6, y + 7, 2, 5, D); wgRc(g, x + 2, y + 11, 6, 1, D); // the jam
  wgRc(g, x + 2, y + 5, 1, 4, 'w'); wgPx(g, x + 3, y + 5, 'w'); // a shine on the glass
  wgRc(g, x + 1, y, 8, 3, 'w'); wgRc(g, x, y + 2, 10, 1, 'w'); for (const [a, b] of [[1, 0], [3, 0], [5, 0], [7, 0], [2, 1], [4, 1], [6, 1], [8, 1], [1, 2], [3, 2], [5, 2], [7, 2], [9, 2]]) wgPx(g, x + a, y + b, chk);
  wgRc(g, x + 2, y + 3, 6, 1, 'n'); // the string
}
function wgMiniJar(g, x, y, k) { // a little jar on a shelf, 5 by 8
  const [, , , [D, M], chk] = WG_JAMS[k];
  wgRc(g, x, y, 5, 2, 'w'); wgPx(g, x + 1, y, chk); wgPx(g, x + 3, y, chk); wgPx(g, x, y + 1, chk); wgPx(g, x + 2, y + 1, chk); wgPx(g, x + 4, y + 1, chk);
  wgRc(g, x + 1, y + 2, 3, 1, 'n'); wgRc(g, x, y + 3, 5, 5, 'C'); wgRc(g, x + 1, y + 4, 3, 4, M); wgRc(g, x + 3, y + 4, 1, 4, D); wgPx(g, x + 1, y + 4, 'w');
}
const _wgIconJam = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id, k = WG_JAMS.findIndex(j => j[0] === id); if ((k < 0 && id !== 'scone_jam') || WGA.cache[key]) return _wgIconJam(id);
  const [c, g] = wgCv(16, 16);
  if (k >= 0) wgJarArt(g, 3, 2, k);
  else { // a split scone, cream and strawberry jam on it
    wgBlob(g, 8, 10, 6, 3.4, ['e', 'a', 'A', 'A']); wgRc(g, 3, 8, 10, 2, 'w'); wgRc(g, 4, 7, 8, 1, 'w'); wgRc(g, 4, 6, 8, 2, 'r'); wgRc(g, 5, 5, 6, 1, 'R'); wgPx(g, 6, 6, 'q');
  }
  wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgBuildJam = wgBuildAll;
wgBuildAll = function () {
  _wgBuildJam();
  wgReg('pantry', [wgMake('pantry', 24, 27, (g) => { // a wooden shelf, two boards of little jars
    wgRc(g, 1, 1, 21, 24, 'n'); wgRc(g, 2, 2, 19, 22, 'u'); wgRc(g, 1, 1, 21, 1, 'N'); wgRc(g, 1, 1, 1, 24, 'N');
    for (const by of [12, 23]) { wgRc(g, 1, by, 21, 2, 'N'); wgRc(g, 1, by + 1, 21, 1, 'n'); }
    [0, 2, 4].forEach((k, i) => wgMiniJar(g, 3 + i * 6, 4, k)); [1, 3, 5].forEach((k, i) => wgMiniJar(g, 3 + i * 6, 15, k)); // a gap of the shelf's back between jars
  })]);
};
