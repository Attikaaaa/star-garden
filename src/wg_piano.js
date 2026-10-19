'use strict';
// Wildgrove: a piano. USE plays the next of `WG_PIANO_TUNES` (the `pno0`..`pno7` sounds, the ocarina's pentatonic
// scale, its notes floating up as the ocarina's do), the keys going down as they sound. Which tune comes next is the
// tile's meta, so it goes over co-op with the tile, and a screen that gets a new tune for a piano within earshot plays it
// too (a `wgSetObj` wrapper while `WGN.applying`). Every tune played lights TICKLE THE IVORIES (`stats.piano`, a bitmask).
const WG_PIANO_TUNES = [[0, 0, 3, 3, 4, 4, 3], [0, 1, 2, 3, 4, 5, 7], [2, 1, 0, 1, 2, 2, 2], [5, 4, 3, 2, 3, 4, 5, 7], [3, 2, 0, 2, 3, 3, 4, 3]];
const WG_PIANO_STEP = 0.3, WG_PIANO_NEAR = 320; // seconds a note; how far a friend's tune is heard
const WGPN = { q: [], keys: new Map() }; // notes waiting to sound: at, k, x, y, key; tile key -> [note, when] for the key going down
(function () {
  wgObj('piano', { name: 'PIANO', kind: 'deco', tool: 'axe', hp: 5, piano: 1, drops: [DR('piano', 1, 1)] });
  wgItem('piano', 'PIANO', 'place', { place: 'piano' }); PLACE.piano = 'piano'; wgRec('piano', 1, { wood: 8, iron: 2, bone: 2 }, 'bench');
  WG_ACH.push(['piano', 'TICKLE THE IVORIES', 'PLAY EVERY TUNE ON A PIANO', (c) => ((c.st.piano | 0) & 31) === 31]);
})();
function wgPianoPlay(tx, ty, n) { // queue tune n at this piano, unless one is playing there already
  const key = WGS.dim + tx + ',' + ty; if (WGPN.q.some(q => q.key === key)) return false;
  WG_PIANO_TUNES[n].forEach((k, i) => WGPN.q.push({ at: WGS.t + i * WG_PIANO_STEP, k, x: tx * 16 + 8, y: ty * 16 - 10, key }));
  return true;
}
const _wgUsePiano = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = w && wgObjAt(w, dim, tx, ty);
  if (!id || !OBJ[id].piano) return _wgUsePiano(tx, ty);
  const n = wgMetaAt(w, dim, tx, ty) % WG_PIANO_TUNES.length;
  if (!wgPianoPlay(tx, ty, n)) return true; // let it finish
  wgSetObj(w, dim, tx, ty, id, (n + 1) % WG_PIANO_TUNES.length);
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.piano = (st.piano | 0) | (1 << n);
  return true;
};
const _wgSetObjPiano = wgSetObj;
wgSetObj = function (w, dim, x, y, id, meta) { // a friend played it: the tune they played, if it is within earshot
  const was = w === WGS.world && typeof WGN !== 'undefined' && WGN.applying && id && OBJ[id] && OBJ[id].piano && wgObjAt(w, dim, x, y) === id ? wgMetaAt(w, dim, x, y) : -1;
  const r = _wgSetObjPiano(w, dim, x, y, id, meta), p = WGS.p;
  if (was >= 0 && (meta | 0) !== was && dim === WGS.dim && p && Math.hypot(x * 16 + 8 - p.x, y * 16 + 8 - p.y) < WG_PIANO_NEAR) wgPianoPlay(x, y, ((meta | 0) + WG_PIANO_TUNES.length - 1) % WG_PIANO_TUNES.length);
  return r;
};
const _wgUpdPiano = updateWG;
updateWG = function (dt) {
  _wgUpdPiano(dt);
  const Q = WGPN.q; if (!Q.length) return;
  for (let i = Q.length - 1; i >= 0; i--) {
    const q = Q[i]; if (WGS.t < q.at) continue;
    Q.splice(i, 1); if (q.key[0] !== WGS.dim) continue;
    wgOcaShow(q.x + (q.k - 3.5) * 1.5, q.y, q.k, false); wgSfx('pno' + q.k); WGPN.keys.set(q.key, [q.k, WGS.t]);
  }
};
const _wgDrawObjPiano = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  const o = OBJ[id]; if (!o || !o.piano) return _wgDrawObjPiano(id, tx, ty, sx, sy);
  shadow(sx + 8, sy + 14, 16); ctx.drawImage(wgPianoArt(), sx - 1, sy - 3);
  const K = WGPN.keys.get(WGS.dim + tx + ',' + ty); if (K && WGS.t - K[1] < 0.22) rect(sx + 1 + K[0] * 2, sy + 7, 1, 2, 'l'); // the key going down
};
function wgPianoArt() { // an upright piano in plum with gold pedals, an open book of music on its stand, black and white keys
  if (WGA.cache.piano_up) return WGA.cache.piano_up;
  return wgMake('piano_up', 18, 19, (g) => {
    wgRc(g, 1, 1, 16, 1, 'V'); wgRc(g, 1, 2, 16, 1, 'v'); // the lid
    wgRc(g, 1, 3, 16, 6, 'v'); wgRc(g, 1, 3, 1, 6, 'V'); wgRc(g, 16, 3, 1, 6, '1'); // the upper case
    wgRc(g, 5, 4, 8, 3, 'w'); wgRc(g, 5, 7, 8, 1, 'L'); wgRc(g, 8, 4, 2, 4, 'L'); for (const x of [6, 10]) { wgRc(g, x, 5, 2, 1, 'l'); wgPx(g, x, 6, 'l'); } // an open book of music
    wgRc(g, 1, 9, 16, 1, 'V'); wgRc(g, 2, 10, 14, 2, 'w'); for (let x = 3; x < 16; x += 2) wgPx(g, x, 11, 'l'); for (const x of [3, 5, 9, 11, 13]) wgPx(g, x, 10, 'x'); wgPx(g, 1, 10, 'v'); wgPx(g, 1, 11, 'v'); wgPx(g, 16, 10, '1'); wgPx(g, 16, 11, '1'); // the keys
    wgRc(g, 1, 12, 16, 5, 'v'); wgRc(g, 1, 12, 1, 5, 'V'); wgRc(g, 16, 12, 1, 5, '1'); wgRc(g, 3, 13, 12, 1, '1'); wgRc(g, 3, 14, 1, 2, '1'); // the lower case with an inset panel
    wgRc(g, 7, 15, 1, 2, 'y'); wgRc(g, 10, 15, 1, 2, 'y'); // the pedals
    wgRc(g, 2, 17, 2, 1, '1'); wgRc(g, 14, 17, 2, 1, '1'); // its feet
  });
}
const _wgTipPiano = wgTipLines;
wgTipLines = function (s) { const L = _wgTipPiano(s); if (s.id === 'piano') L.push('USE IT TO PLAY A TUNE'); return L; };
const _wgBuildPiano = wgBuildAll;
wgBuildAll = function () { _wgBuildPiano(); wgReg('piano', [wgPianoArt()]); };
const _wgIconPiano = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (id !== 'piano' || WGA.cache[key]) return _wgIconPiano(id);
  const c = wgMake(key, 16, 16, (g) => { // the piano, small
    wgRc(g, 1, 1, 14, 1, 'V'); wgRc(g, 1, 2, 14, 5, 'v'); wgRc(g, 1, 2, 1, 5, 'V'); wgRc(g, 14, 2, 1, 5, '1'); wgRc(g, 4, 3, 8, 3, 'w'); wgRc(g, 7, 3, 2, 3, 'L');
    wgRc(g, 1, 7, 14, 2, 'w'); for (const x of [3, 5, 8, 10, 12]) wgPx(g, x, 7, 'x'); wgRc(g, 1, 9, 14, 4, 'v'); wgRc(g, 1, 9, 1, 4, 'V'); wgRc(g, 14, 9, 1, 4, '1'); wgRc(g, 6, 11, 1, 2, 'y'); wgRc(g, 9, 11, 1, 2, 'y'); wgRc(g, 2, 13, 2, 1, '1'); wgRc(g, 12, 13, 2, 1, '1');
  });
  WGA.cache[key] = c; return c;
};
