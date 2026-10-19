'use strict';
// Wildgrove: the bug net pack. USE the net near one of the butterflies that flutter about by day, or the fireflies of
// the night, to catch it (they are the ambient life drawn in wg_render, noted in WGBUG.seen as they are drawn; a caught
// one stays away a while). Fireflies go into a jar that glows; butterflies into frames; USE one in hand to let it go.
// The catch is your own, so nothing here goes over the net. Ids are appended, so old worlds stay valid.
const WG_BFLY = [['p', 'PINK', ['p', 'P', 'q']], ['c', 'BLUE', ['B', 'c', 'C']], ['o', 'ORANGE', ['o', 'O', 'y']], ['w', 'WHITE', ['l', 'L', 'w']]]; // the ambient colours' order
const WG_BUG_GONE = 90; // seconds a caught bug stays away
const WGBF = []; // bugs let go, flying off: x, y, kind, age
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'axe', hp: 3, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, at);
  };
  wgItem('bugnet', 'BUG NET', 'tool', { tool: 'net', tier: 0, stack: 1 }); wgRec('bugnet', 1, { stick: 2, string: 2 }, 'hand');
  for (const [k, c] of WG_BFLY) wgItem('bfly_' + k, c + ' BUTTERFLY', 'res', { album: 1 });
  wgItem('firefly', 'FIREFLY', 'res', { album: 1 });
  dec('firefly_jar', 'FIREFLY JAR', { tool: 'hand', light: 40 }, { glass: 1, firefly: 3 }, 'hand');
  for (const [k, c] of WG_BFLY) dec('bcase_' + k, 'FRAMED ' + c + ' BUTTERFLY', {}, { wood: 2, glass: 1, ['bfly_' + k]: 1 }, 'bench');
  WG_ACH.push(['bugs', 'BUG CATCHER', 'CATCH FOUR BUTTERFLIES AND A FIREFLY', (c) => c.st.bugs === 31]);
})();
const wgBugId = (kind) => kind === 4 ? 'firefly' : 'bfly_' + WG_BFLY[kind][0];
function wgSwingNet(tx, ty) { // the nearest bug drawn last frame, near the aim or the hero
  const p = WGS.p, S = WGBUG.seen, ax = tx * 16 + 8, ay = ty * 16 + 8; let best = -1, bd = 22;
  p.swing = 0.25;
  for (let i = 0; i < S.length; i += 6) { const d = Math.min(Math.hypot(S[i + 3] - ax, S[i + 4] - ay), Math.hypot(S[i + 3] - p.x, S[i + 4] - p.y + 10)); if (d < bd) { bd = d; best = i; } }
  if (best < 0) return false;
  const kind = S[best + 5], id = wgBugId(kind), w = WGS.world, st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  WGBUG.gone.set((S[best] * 65536 + S[best + 1]) * 4 + S[best + 2], WGS.t + WG_BUG_GONE);
  wgDrop(p.x, p.y, id, 1); wgToast('CAUGHT: ' + WGI[id].name); wgSfx('pickup');
  wgPart(S[best + 3], S[best + 4], 5, { c: kind === 4 ? ['y', 'Y', 'w'] : ['w', 'C', 'q'], s: 16, up: 8, life: 0.5 });
  st.bugs = (st.bugs || 0) | (1 << kind);
  return true;
}
const _wgUseBugs = wgUse;
wgUse = function (tx, ty) {
  const s = WGS.inv[WGS.sel];
  if (s && s.id === 'bugnet') { if (wgSwingNet(tx, ty)) return true; if (!_wgUseBugs(tx, ty)) wgSfx('select'); return true; }
  if (_wgUseBugs(tx, ty)) return true;
  if (s && (s.id === 'firefly' || s.id.startsWith('bfly_'))) { // let it go
    const p = WGS.p; wgInvTake(WGS.inv, s.id, 1); WGBF.push(p.x, p.y - 14, s.id === 'firefly' ? 4 : WG_BFLY.findIndex(b => 'bfly_' + b[0] === s.id), 0);
    wgToast('FLY FREE!'); return true;
  }
  return false;
};
const _wgTipBugs = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipBugs(s), it = WGI[s.id];
  if (s.id === 'bugnet') L.push('BUTTERFLIES BY DAY, FIREFLIES BY NIGHT');
  else if (it && it.album && it.kind === 'res') L.push('USE IT TO LET IT GO');
  else if (s.id === 'firefly_jar') L.push('A SOFT LIGHT THAT NEVER GOES OUT');
  return L;
};
// bugs let go flutter up and away; drawn with the ambient life
const _wgAmbBugs = wgDrawAmbient;
wgDrawAmbient = function (cx0, cy0) {
  _wgAmbBugs(cx0, cy0);
  for (let i = WGBF.length - 4; i >= 0; i -= 4) {
    const a = (WGBF[i + 3] += 1 / 60); if (a > 2.2) { WGBF.splice(i, 4); continue; }
    const k = WGBF[i + 2], x = Math.round(WGBF[i] + Math.sin(a * 5 + i) * 6 + a * 14 - cx0), y = Math.round(WGBF[i + 1] - a * 30 - cy0), f = Math.floor(a * 9) % 2;
    ctx.globalAlpha = Math.min(1, (2.2 - a) * 1.5);
    if (k === 4) { rect(x - 1, y - 1, 3, 3, 'y'); rect(x, y, 1, 1, 'Y'); }
    else { const col = ['P', 'c', 'O', 'w'][k]; rect(x, y, 1, 1, '0'); rect(x - 1 - f, y - 1, 1 + f, 1 + f, col); rect(x + 1, y - 1, 1 + f, 1 + f, col); }
    ctx.globalAlpha = 1;
  }
};

// ---------- art ----------
function wgPaint(g, x0, y0, rows, key) { rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (key[row[x]]) wgPx(g, x0 + x, y0 + y, key[row[x]]); }); } // a little pixel map
const _wgIconBugs = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || (id !== 'bugnet' && id !== 'firefly' && !id.startsWith('bfly_'))) return _wgIconBugs(id);
  const [c, g] = wgCv(16, 16);
  if (id === 'bugnet') { // a hoop of net on a long handle
    wgLine(g, 2, 14, 9, 7, 'n'); wgLine(g, 3, 14, 9, 8, 'N');
    wgBlob(g, 11, 5, 3.6, 3.6, ['l', 'L', 'w', 'w']); wgBlob(g, 11, 5, 2.4, 2.4, ['m', 'l', 'l', 'L']);
    for (const [x, y] of [[10, 4], [12, 4], [11, 5], [10, 6], [12, 6]]) wgPx(g, x, y, 'm');
  } else if (id === 'firefly') { // a little beetle seen from above, clear wings open, its tail aglow
    wgPaint(g, 1, 2, ['....k....k....', '.....k..k.....', '......kk......', '..CCC.XX.CCC..', '.CwwCCxxCCwwC.', '.CwCCCxxCCCwC.',
      '..CCC.xx.CCC..', '.....oyyo.....', '....oyYYyo....', '....yYwwYy....', '....oyYYyo....', '.....oyyo.....'], { k: 'x', x: 'x', X: 'X', C: 'C', w: 'w', o: 'O', y: 'y', Y: 'Y' });
  } else { // a butterfly, its wings open: big ones on top, small ones below, a dark body and two feelers
    const r = WG_BFLY.find(b => 'bfly_' + b[0] === id)[2];
    wgPaint(g, 1, 1, ['.cc.k....k.cc.', 'cbbc.k..k.cbbc', 'cbabc.kk.cbabc', 'cbaabckkcbaabc', 'cbwaabkkbaawbc', 'cbaaabkkbaaabc', '.cbabbkkbbabc.',
      '..cbbckkcbbc..', '..ccbbkkbbcc..', '..cbabkkbabc..', '.cbaabkkbaabc.', '.cbbbc..cbbbc.', '..ccc....ccc..'], { a: r[2], b: r[1], c: r[0], k: 'x', w: 'Y' });
  }
  wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgBuildBugs = wgBuildAll;
wgBuildAll = function () {
  _wgBuildBugs();
  // a glass jar with a cork, three fireflies blinking inside
  wgReg('firefly_jar', [0, 1].map(v => wgMake('firefly_jar' + v, 12, 15, (g) => {
    wgRc(g, 2, 4, 8, 10, 'C'); wgRc(g, 3, 13, 6, 1, 'c'); wgRc(g, 9, 5, 1, 8, 'c'); wgRc(g, 2, 4, 1, 9, 'w'); wgRc(g, 3, 5, 1, 3, 'w'); // the glass
    wgRc(g, 3, 1, 6, 3, 'n'); wgRc(g, 3, 1, 6, 1, 'N'); wgRc(g, 8, 2, 1, 2, 'u'); // the cork
    for (const [x, y] of v ? [[5, 7], [7, 10], [4, 11]] : [[6, 8], [4, 9], [7, 11]]) { wgPx(g, x, y, 'Y'); wgPx(g, x + 1, y, 'y'); }
  })));
  OBJ[O_ID.firefly_jar].anim = 1;
  // a butterfly pinned in a little wooden frame on a stand
  for (const [k, , r] of WG_BFLY) wgReg('bcase_' + k, [wgMake('bcase_' + k, 14, 16, (g) => {
    wgRc(g, 1, 1, 12, 11, 'n'); wgRc(g, 1, 1, 12, 1, 'N'); wgRc(g, 1, 1, 1, 11, 'N'); wgRc(g, 12, 2, 1, 10, 'u'); wgRc(g, 1, 11, 12, 1, 'u');
    wgRc(g, 2, 2, 10, 9, 'A'); wgRc(g, 2, 2, 10, 1, 'w'); // the card behind the glass
    wgPaint(g, 2, 3, ['bb......bb', 'bab.kk.bab', 'baabkkbaab', '.bbbkkbbb.', '..bbkkbb..', '.bab..bab.', '..b....b..'], { a: r[2], b: r[1], k: 'x' });
    wgRc(g, 6, 12, 2, 3, 'n'); wgRc(g, 4, 14, 6, 1, 'u'); // the stand
  })]);
};
