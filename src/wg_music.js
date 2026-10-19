'use strict';
// Wildgrove: the music pack. A music box and a gramophone play one of four tunes (USE winds up the next one, the last
// USE lets it rest); near one the land's song fades into its tune. What plays is the object's meta, so every co-op
// screen hears the same. Little notes rise while it plays, and shell chimes tinkle now and then in the breeze.
// Ids are appended, so old worlds stay valid.
const WG_TUNES = [['mb_lull', 'LULLABY'], ['mb_dew', 'MORNING DEW'], ['mb_waltz', 'STARRY WALTZ'], ['mb_rain', 'RAIN ON THE ROOF']];
const WGMU = { t: -9, song: null, chime: false, chT: 4 }; // the last look around: the tune in reach, a chime close by
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'axe', hp: 4, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, at);
  };
  dec('musicbox', 'MUSIC BOX', { music: 6 }, { wood: 3, copper: 2 }, 'bench'); // heard within six tiles
  dec('gramophone', 'GRAMOPHONE', { music: 10 }, { wood: 4, copper: 3, iron: 1 }, 'anvil'); // and this one within ten
  WG_ACH.push(['tunes', 'MUSIC LOVER', 'PLAY ALL FOUR TUNES', (c) => c.st.tunes === 15]);
})();
// the nearest playing music in reach of the hero, looked up twice a second
function wgTuneNear() {
  if (WGS.t - WGMU.t < 0.5 && WGMU.t <= WGS.t) return WGMU.song;
  WGMU.t = WGS.t; WGMU.song = null; WGMU.chime = false;
  const w = WGS.world, d = WGS.dim, p = WGS.p; if (!w || !p) return null;
  const px = Math.floor(p.x / 16), py = Math.floor(p.y / 16), chime = O_ID.chime; let best = 1e9;
  for (let y = py - 10; y <= py + 10; y++) for (let x = px - 10; x <= px + 10; x++) {
    const id = wgObjAt(w, d, x, y); if (!id) continue;
    const o = OBJ[id], r = Math.hypot(x - px, y - py);
    if (id === chime && r <= 4 && d === 'o') WGMU.chime = true;
    if (!o.music || r > o.music || r >= best) continue;
    const m = wgMetaAt(w, d, x, y); if (m > 0 && m <= WG_TUNES.length) { best = r; WGMU.song = WG_TUNES[m - 1][0]; }
  }
  return WGMU.song;
}
const _wgSongMusic = wgSong;
wgSong = function () {
  const s = _wgSongMusic();
  if (s === 'boss' || !WGS.world || !WGS.p || ['worlds', 'create', 'join', 'browse', 'loading'].includes(WGS.scr)) return s;
  return wgTuneNear() || s;
};
const _wgUseMusic = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = wgObjAt(w, dim, tx, ty), o = id && OBJ[id];
  if (!o || !o.music) return _wgUseMusic(tx, ty);
  const n = (wgMetaAt(w, dim, tx, ty) + 1) % (WG_TUNES.length + 1); // the next tune, and after the last one a rest
  wgSetObj(w, dim, tx, ty, id, n); WGMU.t = -9; wgSfx('windup');
  if (n) {
    wgToast('PLAYING: ' + WG_TUNES[n - 1][1]); wgPart(tx * 16 + 8, ty * 16 + 4, 4, { c: ['q', 'C', 'w'], s: 14, up: 12, life: 0.6 });
    const m = w.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.tunes = (st.tunes || 0) | (1 << (n - 1));
  } else wgToast(o.music > 6 ? 'THE GRAMOPHONE RESTS' : 'THE MUSIC BOX RESTS');
  return true;
};
const _wgTipMusic = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipMusic(s), it = WGI[s.id], o = it && it.place && OBJ[O_ID[it.place]];
  if (o && o.music) L.push('USE IT TO PLAY A TUNE', 'FOUR TUNES TO CHOOSE FROM');
  else if (it && it.place === 'chime') L.push('TINKLES IN THE BREEZE');
  return L;
};
// a chime close by tinkles every few seconds, outdoors and in play
const _wgUpdMusic = updateWG;
updateWG = function (dt) {
  _wgUpdMusic(dt);
  if (WGS.scr !== 'play' || !WGS.world || !WGS.p) return;
  wgTuneNear();
  if (WGMU.chime && (WGMU.chT -= dt) <= 0) { WGMU.chT = 3 + Math.random() * 5; wgSfx('chime'); }
};

// ---------- drawing: the notes that rise from a playing box ----------
const _wgDrawObjMusic = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjMusic(id, tx, ty, sx, sy);
  const o = OBJ[id]; if (!o.music) return;
  const m = wgMetaAt(WGS.world, WGS.dim, tx, ty); if (!m) return;
  const top = sy + 16 - WGA.obj[o.id][0].c.height, h = hash(tx, ty, 515);
  for (let i = 0; i < 2; i++) { // two notes at a time, each drifting up and fading
    const k = (WGS.t * 0.42 + i * 0.5 + (h & 255) / 256) % 1, a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
    const x = Math.round(sx + 8 + (i ? 2 : -7) + Math.sin(k * 6.3 + i * 2) * 3), y = Math.round(top - 2 - k * 16);
    ctx.globalAlpha = a; ctx.drawImage(wgNoteSpr((h >> (8 + i)) & 1 ? 'q' : 'C'), x, y - 9); ctx.globalAlpha = 1;
  }
};
function wgNoteSpr(c) { // a little eighth note
  const key = 'mnote_' + c; if (WGA.cache[key]) return WGA.cache[key];
  const s = wgMake(key, 7, 9, (g) => {
    for (const [x, y] of [[3, 1], [4, 1], [3, 2], [5, 2], [3, 3], [3, 4], [2, 5], [3, 5], [1, 6], [2, 6], [3, 6], [2, 7]]) wgPx(g, x, y, c);
    wgPx(g, 1, 6, 'w');
  });
  return (WGA.cache[key] = s);
}
const _wgBuildMusic = wgBuildAll;
wgBuildAll = function () {
  _wgBuildMusic();
  const one = (id, w, h, fn) => wgReg(id, [wgMake(id, w, h, fn)]);
  // a wooden music box, its lid up to show a gold-framed mirror in the velvet; a winding key at the side
  one('musicbox', 16, 15, (g) => {
    wgRc(g, 2, 1, 10, 7, 'u'); wgRc(g, 2, 1, 10, 1, 'n'); wgRc(g, 3, 2, 8, 5, 'p'); wgRc(g, 3, 2, 8, 1, 'P'); // the lid, open
    wgRc(g, 5, 3, 4, 3, 'C'); wgRc(g, 6, 2, 2, 1, 'y'); wgRc(g, 6, 6, 2, 1, 'O'); wgRc(g, 4, 4, 1, 1, 'y'); wgRc(g, 9, 4, 1, 1, 'O'); // an oval mirror in gold
    wgPx(g, 5, 3, 'w'); wgPx(g, 6, 3, 'w'); wgPx(g, 8, 5, 'c');
    wgRc(g, 1, 8, 12, 1, 'N'); wgRc(g, 2, 9, 10, 1, 'u'); wgRc(g, 3, 9, 4, 1, 'y'); wgPx(g, 3, 9, 'Y'); wgPx(g, 9, 9, 'O'); // the open top, the comb
    wgRc(g, 1, 10, 12, 4, 'n'); wgRc(g, 1, 10, 12, 1, 'N'); wgRc(g, 1, 10, 1, 4, 'N'); wgRc(g, 12, 10, 1, 4, 'u'); wgRc(g, 1, 13, 12, 1, 'u'); // the front
    wgRc(g, 6, 11, 2, 1, 'y'); wgPx(g, 6, 11, 'Y'); wgPx(g, 6, 12, 'O'); wgPx(g, 7, 12, 'O'); // a gold keyhole plate
    wgPx(g, 13, 11, 'O'); wgRc(g, 14, 10, 1, 3, 'y'); wgPx(g, 14, 10, 'Y'); // the key
  });
  // a gramophone: a brass horn like a morning glory over a wooden cabinet, a record on the turntable
  one('gramophone', 16, 26, (g) => {
    wgRc(g, 2, 17, 12, 8, 'n'); wgRc(g, 2, 17, 12, 1, 'N'); wgRc(g, 2, 17, 1, 8, 'N'); wgRc(g, 13, 18, 1, 7, 'u'); wgRc(g, 2, 24, 12, 1, 'u');
    wgRc(g, 4, 19, 8, 4, 'u'); wgRc(g, 5, 20, 6, 2, 'n'); wgPx(g, 8, 21, 'y'); // the cabinet's panel and its knob
    wgRc(g, 3, 15, 10, 2, 'N'); wgRc(g, 4, 15, 7, 1, 'x'); wgRc(g, 3, 16, 9, 1, 'X'); wgPx(g, 7, 15, 'r'); wgPx(g, 8, 16, 'R'); // the record
    wgRc(g, 10, 11, 2, 5, 'O'); wgRc(g, 11, 11, 1, 5, 'n'); // the neck
    wgBlob(g, 7, 6.5, 6.5, 5.5, ['n', 'O', 'y', 'Y']); wgBlob(g, 7.8, 7.2, 3.6, 2.9, ['u', 'u', 'n', 'n']); wgPx(g, 9, 9, 'O'); // the bell and its throat
  });
};
