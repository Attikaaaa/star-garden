'use strict';
// Wildgrove: an ocarina. Held in hand, USE plays a note, and which one comes from where you aim: low when you aim down,
// rising round through the left and up to the highest at the right and down again (`wgOcaNote`), eight notes of a
// pentatonic scale (the `oca0`..`oca7` sounds in audio.js), so a tune is played by sweeping the aim. A little note
// floats up from the player in its own colour. Friends near you hear it and see it: a guest sends 'oca' to the host,
// which checks it, rate-limits it and passes it on with the guest's pid (the host's own go out as pid 0). The MELODY
// MAKER star for all eight notes.
const WG_OCA_COLS = ['r', 'o', 'y', 'G', 'T', 'B', '2', 'P'], WG_OCA_NEAR = 320; // each note's colour; how far a friend's is heard
const WGOC = { list: [], t: -1 }; // notes floating up: x, y, note, time; when your last one played
(function () {
  wgItem('ocarina', 'OCARINA', 'tool', { tool: 'ocarina', stack: 1 }); wgRec('ocarina', 1, { clay: 3, petal_b: 1 }, 'furnace');
  WG_ACH.push(['oca', 'MELODY MAKER', 'PLAY ALL EIGHT NOTES ON THE OCARINA', (c) => ((c.st.oca | 0) & 255) === 255]);
})();
const wgOcaHeld = () => { const s = WGS.inv && WGS.inv[WGS.sel]; return !!(s && s.id === 'ocarina'); };
function wgOcaNote(a) { // the aim's angle (0 right, down positive) to a note: down 0, then round through left and up to the right
  const s = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; // 0 right, 1 down-right, 2 down ... 6 up, 7 up-right
  return (s + 6) % 8;
}
function wgOcaShow(x, y, k, near) { // a note floats up; heard if it is near enough
  WGOC.list.push({ x, y, k, t: WGS.t }); if (WGOC.list.length > 24) WGOC.list.shift();
  if (near) wgSfx('oca' + k);
}
function wgOcaPlay() { // your hero plays the note the aim says
  const p = WGS.p; if (!p || !WGS.world || WGS.t - WGOC.t < 0.12 && WGS.t >= WGOC.t) return false;
  WGOC.t = WGS.t; const k = wgOcaNote(WGS.aim || 0);
  wgOcaShow(p.x, p.y - 26, k, true); p.swing = 0.12;
  const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.oca = (st.oca | 0) | (1 << k);
  if (WGN.role === 'host') wgnAll({ t: 'oca', pid: 0, k }, null); else if (WGN.role === 'client') wgnSend(WGN.link, { t: 'oca', k });
  return true;
}
function wgOcaFriend(pid, k) { // a friend's note, over their hero if they are in this world near you
  const q = (WGS.remote || []).find(r => r.pid === pid), p = WGS.p; if (!q || !p || q.dim !== WGS.dim) return;
  wgOcaShow(q.x, q.y - 26, k, Math.hypot(q.x - p.x, q.y - p.y) < WG_OCA_NEAR);
}
const _wgnHostOca = wgnHostMsg;
wgnHostMsg = function (L, m) {
  _wgnHostOca(L, m);
  if (!m || m.t !== 'oca' || !(L.pid > 0) || !Number.isInteger(m.k) || m.k < 0 || m.k > 7) return;
  const now = performance.now(); if (now - (L.ocaT || 0) < 100) return; L.ocaT = now;
  wgOcaFriend(L.pid, m.k); wgnAll({ t: 'oca', pid: L.pid, k: m.k }, L);
};
const _wgnClientOca = wgnClientMsg;
wgnClientMsg = function (L, m) {
  _wgnClientOca(L, m);
  if (m && m.t === 'oca' && Number.isInteger(m.pid) && m.pid >= 0 && m.pid !== WGN.pid && Number.isInteger(m.k) && m.k >= 0 && m.k <= 7) wgOcaFriend(m.pid, m.k);
};
// USE plays, a door or a chest under the aim first; with the aim out of reach it plays all the same
const _wgUseOca = wgUse;
wgUse = function (tx, ty) {
  if (!wgOcaHeld()) return _wgUseOca(tx, ty);
  return _wgUseOca(tx, ty) || (wgOcaPlay(), true); // too soon after the last note: the press is spent all the same
};
const _wgUpdOca = updateWG;
updateWG = function (dt) {
  const fresh = WGS.scr === 'play' && wgOcaHeld() && (Input.rHit || pressed(wgKey('use'), 'KeyK', 'PadX', 'PadLT') || (WGS.touch && WGS.touch.use));
  _wgUpdOca(dt);
  if (fresh && WGS.scr === 'play' && !WGS.target) wgOcaPlay();
  const L = WGOC.list; while (L.length && (WGS.t - L[0].t > 1.6 || L[0].t > WGS.t)) L.shift();
};
// the notes, drawn over the world (and the dark): rising, swaying, fading
const _wgLightOca = wgDrawLight;
wgDrawLight = function (cx0, cy0) {
  _wgLightOca(cx0, cy0);
  for (const n of WGOC.list) {
    const u = (WGS.t - n.t) / 1.6, x = Math.round(n.x - cx0 + Math.sin(u * 7 + n.k) * 3 + (n.k - 3.5) * 2), y = Math.round(n.y - cy0 - 34 * (1 - (1 - u) * (1 - u))); // quick off the hero, slowing as it rises
    ctx.globalAlpha = u < 0.7 ? 1 : (1 - u) / 0.3; ctx.drawImage(wgOcaNoteArt(n.k), x - 3, y - 4); ctx.globalAlpha = 1;
  }
};
function wgOcaNoteArt(k) { // a little quaver in the note's colour
  const key = 'oca_note_' + k; if (WGA.cache[key]) return WGA.cache[key];
  const c = WG_OCA_COLS[k];
  return wgMake(key, 7, 8, (g) => wgPaint(g, 1, 1, ['..cc.', '..c.c', '..c..', '.cc..', 'ccc..', '.c...'], { c }));
}
const _wgTipOca = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipOca(s);
  if (s.id === 'ocarina') L.push('USE PLAYS A NOTE', 'WHERE YOU AIM PICKS WHICH');
  return L;
};
const _wgIconOca = wgIcon;
wgIcon = function (id) { // a round blue ocarina with its mouthpiece and finger holes, lit from the top left
  const key = 'ic_' + id; if (id !== 'ocarina' || WGA.cache[key]) return _wgIconOca(id);
  const [c, g] = wgCv(16, 16);
  wgBlob(g, 7.5, 9, 4.6, 3.4, ['b', 'B', 'B', 'c']); wgRc(g, 11, 6, 3, 2, 'B'); wgRc(g, 11, 6, 3, 1, 'c');
  for (const [x, y] of [[5, 8], [8, 8], [9, 10], [6, 10]]) wgPx(g, x, y, 'b'); wgPx(g, 5, 7, 'C');
  wgOutline(c); WGA.cache[key] = c; return c;
};
