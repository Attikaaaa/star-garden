'use strict';
// Wildgrove: fish records. Every fish caught has a size (`wgFishSize`: its kind's length in `WG_FISH_CM`, from a bit
// under two thirds to a third over, the big ones rarer); the biggest of each kind is kept in `w.meta.fishrec` (each
// hero's own), and beating one says so in place of the catch's toast (a `wgCatch` wrapper notes it, an `updateWG`
// wrapper tells it once the catch is told). An angler's board from the bench, or the fish trophy, opens the `fishlog`
// screen: each fish with its record, a dark shape for one not yet caught. A fish of `WG_FISH_BIG` cm lights FISH TALE.
const WG_FISH_CM = { fish: 24, fish_salmon: 46, fish_tropic: 20, fish_ice: 30, fish_glow: 18, fish_gold: 36 }, WG_FISH_BIG = 50;
const WGFL = { pend: null };
(function () {
  wgObj('fish_log', { name: 'ANGLER BOARD', kind: 'deco', tool: 'axe', hp: 3, fishlog: 1, drops: [DR('fish_log', 1, 1)] });
  wgItem('fish_log', 'ANGLER BOARD', 'place', { place: 'fish_log' }); PLACE.fish_log = 'fish_log'; wgRec('fish_log', 1, { wood: 4, string: 1, fish: 1 }, 'bench');
  OBJ[O_ID.fish_trophy].fishlog = 1;
  WG_ACH.push(['fishbig', 'FISH TALE', 'LAND A FISH OF 50 CM OR MORE', (c) => (c.st.fishbig | 0) > 0]);
})();
const wgFishSize = (id, r) => Math.round(WG_FISH_CM[id] * (0.65 + 0.7 * r * r));
const _wgCatchLog = wgCatch;
wgCatch = function (F) {
  const id = _wgCatchLog(F), w = WGS.world; if (!w || !WG_FISH_CM[id]) return id;
  const cm = wgFishSize(id, Math.random()), R = w.meta.fishrec || (w.meta.fishrec = {});
  if (cm > (R[id] | 0)) { const first = !R[id]; R[id] = cm; if (!first) WGFL.pend = cm; }
  if (cm >= WG_FISH_BIG) { const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 }); st.fishbig = 1; }
  return id;
};
const _wgUpdFishLog = updateWG;
updateWG = function (dt) {
  _wgUpdFishLog(dt);
  if (WGFL.pend) { wgToast('A NEW RECORD: ' + WGFL.pend + ' CM!', 3); wgSfx('chime'); WGFL.pend = null; }
  if (WGS.scr !== 'fishlog' || !WGS.world) return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  if (WGS.t > WGFL.t0 && pressed('Escape', 'PadB', wgKey('use'))) WGS.scr = 'play';
};
const _wgUseFishLog = wgUse;
wgUse = function (tx, ty) {
  const o = OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)]; if (!o || !o.fishlog) return _wgUseFishLog(tx, ty);
  WGS.scr = 'fishlog'; WGS.ui = {}; WGFL.t0 = WGS.t; wgSfx('select'); return true;
};
const _wgDrawFishLog = drawWG;
drawWG = function () {
  _wgDrawFishLog();
  if (WGS.scr === 'fishlog' && WGS.world) wgDrawFishLog();
};
function wgDrawFishLog() { // a wooden board, each fish pinned up with its record
  const R = WGS.world.meta.fishrec || {}, x = VW / 2 - 100, y = 18, ui = WGS.ui, L = Object.keys(WG_FISH_CM);
  dim(0.45);
  rect(x, y, 200, 176, '0'); rect(x + 1, y + 1, 198, 174, 'n'); rect(x + 1, y + 1, 198, 1, 'O'); rect(x + 1, y + 1, 1, 174, 'N'); rect(x + 198, y + 2, 1, 173, 'u'); rect(x + 2, y + 174, 197, 1, 'u');
  for (let k = 1; k < 7; k++) rect(x + 2, y + 6 + k * 21, 196, 1, 'u'); // the planks
  wtext('THE BIGGEST CATCHES', VW / 2, y + 9, 'Y', 0, 1);
  L.forEach((id, i) => {
    const ry = y + 30 + i * 21, got = R[id] | 0, ic = wgIcon(id);
    if (got) ctx.drawImage(ic, x + 12, ry); else { ctx.globalAlpha = 0.35; ctx.drawImage(wgFishShade(id), x + 12, ry); ctx.globalAlpha = 1; }
    wtext(got ? WGI[id].name : '???', x + 34, ry + 5, got ? 'w' : 'l', 0);
    wtext(got ? got + ' CM' : '-', x + 186, ry + 5, got >= WG_FISH_BIG ? 'Y' : 'w', 0, 2);
  });
  wgUiBegin(ui);
  if (wgButton(ui, 'CLOSE', VW / 2 - 40, y + 156, 80)) WGS.scr = 'play';
  wgUiEnd(ui);
}
function wgFishShade(id) { // a fish not yet caught: its dark shape
  const key = 'fshade_' + id; if (WGA.cache[key]) return WGA.cache[key];
  const s = wgIcon(id), [c, g] = wgCv(16, 16); g.drawImage(s, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = PAL['0']; g.fillRect(0, 0, 16, 16);
  WGA.cache[key] = c; return c;
}
const _wgTipFishLog = wgTipLines;
wgTipLines = function (s) { const L = _wgTipFishLog(s); if (s.id === 'fish_log' || s.id === 'fish_trophy') L.push('KEEPS YOUR BIGGEST CATCHES'); return L; };
const _wgBuildFishLog = wgBuildAll;
wgBuildAll = function () {
  _wgBuildFishLog();
  wgReg('fish_log', [wgMake('fish_log', 18, 22, (g) => { // a plank board on two posts, a fish outline and tally marks
    wgRc(g, 3, 13, 2, 8, 'n'); wgRc(g, 13, 13, 2, 8, 'n'); wgRc(g, 3, 13, 1, 8, 'N'); wgRc(g, 13, 13, 1, 8, 'N');
    wgRc(g, 1, 1, 16, 13, 'n'); wgRc(g, 1, 1, 16, 1, 'O'); wgRc(g, 1, 1, 1, 13, 'N'); wgRc(g, 2, 13, 15, 1, 'u'); wgRc(g, 16, 2, 1, 11, 'u'); wgRc(g, 2, 7, 14, 1, 'u');
    wgBlob(g, 7, 4, 3.6, 1.6, ['b', 'B', 'c', 'C']); wgLine(g, 10, 4, 12, 2, 'B'); wgLine(g, 10, 4, 12, 6, 'B'); wgPx(g, 5, 4, '0');
    for (let i = 0; i < 4; i++) wgRc(g, 4 + i * 2, 9, 1, 3, 'A'); wgLine(g, 3, 11, 11, 9, 'A');
  })]);
};
const _wgIconFishLog = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id; if (WGA.cache[key] || id !== 'fish_log') return _wgIconFishLog(id);
  const [c, g] = wgCv(16, 16); g.drawImage(WGA.cache.fish_log, 1, 1, 16, 15, 0, 1, 16, 15); WGA.cache[key] = c; return c;
};
