'use strict';
// Wildgrove: telling the time. A grandfather clock whose hands show the hour of the day (the minute hand steps on
// every few seconds) and whose pendulum swings; it strikes a soft bell at dawn, noon and dusk for a hero within
// WG_CLOCK_R tiles. A sundial whose shadow walks from west to east with the sun, short at noon and gone by night or
// underground. USE either one to hear the time. Both read WGS.clock, so every co-op screen shows the same hour.
const WG_CLOCK_R = 6, WG_CLOCK_STRIKE = [0.25, 0.5, 0.75];
const WGCK = { last: -1 };
(function () {
  wgObj('grand_clock', { name: 'GRANDFATHER CLOCK', kind: 'deco', tool: 'axe', hp: 5, clock: 1, drops: [DR('grand_clock', 1, 1)] });
  wgItem('grand_clock', 'GRANDFATHER CLOCK', 'place', { place: 'grand_clock' }); PLACE.grand_clock = 'grand_clock'; wgRec('grand_clock', 1, { wood: 6, copper: 2, glass: 1 }, 'bench');
  wgObj('sundial', { name: 'SUNDIAL', kind: 'deco', tool: 'pick', hp: 4, dial: 1, drops: [DR('sundial', 1, 1)] });
  wgItem('sundial', 'SUNDIAL', 'place', { place: 'sundial' }); PLACE.sundial = 'sundial'; wgRec('sundial', 1, { stone: 4, copper: 1 }, 'bench');
})();
function wgTimeText(c) { // the hour of the day in words
  const h = Math.floor(wgMod(c, 1) * 24), n = h % 12 || 12;
  if (h === 12) return 'IT IS NOON'; if (h === 0) return 'IT IS MIDNIGHT';
  return 'IT IS ' + n + (h < 5 ? ' AT NIGHT' : h < 12 ? ' IN THE MORNING' : h < 18 ? ' IN THE AFTERNOON' : h < 22 ? ' IN THE EVENING' : ' AT NIGHT');
}
const wgSunUp = () => WGS.dim === 'o' && WGS.clock % 1 > 0.25 && WGS.clock % 1 < 0.75;
const _wgUseClock = wgUse;
wgUse = function (tx, ty) {
  const o = WGS.world && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (!o || !(o.clock || o.dial)) return _wgUseClock(tx, ty);
  if (o.dial && !wgSunUp()) { wgToast('A SUNDIAL NEEDS THE SUN'); return true; }
  wgToast(wgTimeText(WGS.clock), 2.5); wgSfx(o.clock ? 'bell' : 'select');
  return true;
};
// the clock strikes at dawn, noon and dusk for whoever stands near one
const _wgUpdClock = updateWG;
updateWG = function (dt) {
  _wgUpdClock(dt);
  const w = WGS.world, p = WGS.p, c = WGS.clock % 1; if (!w || !p) { WGCK.last = -1; return; }
  const was = WGCK.last; WGCK.last = c; if (was < 0 || c < was || WGS.scr !== 'play') return;
  if (!WG_CLOCK_STRIKE.some(m => was < m && c >= m)) return;
  const x = Math.floor(p.x / 16), y = Math.floor(p.y / 16);
  for (let j = -WG_CLOCK_R; j <= WG_CLOCK_R; j++) for (let i = -WG_CLOCK_R; i <= WG_CLOCK_R; i++) {
    const id = wgObjAt(w, WGS.dim, x + i, y + j);
    if (id && OBJ[id].clock) { wgSfx('bell'); wgPart((x + i) * 16 + 8, (y + j) * 16 - 14, 4, { c: ['y', 'Y', 'w'], s: 14, up: 14, life: 0.7 }); return; }
  }
};
// ---------- drawing: the hands, the pendulum, the shadow ----------
const WG_DIR8 = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
const _wgDrawObjClock = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjClock(id, tx, ty, sx, sy);
  const o = OBJ[id]; if (!o.clock && !o.dial) return;
  const c = WGS.clock % 1;
  if (o.clock) { // the face's centre is at (8, 9) of the sprite, which stands 14 px above its tile
    const X = sx + 8, Y = sy - 5, h = c * 24, hd = WG_DIR8[Math.round((h % 12) / 12 * 8) % 8], md = WG_DIR8[Math.round((h % 1) * 8) % 8];
    ctx.fillStyle = PAL.x; for (let k = 1; k <= 3; k++) ctx.fillRect(X + md[0] * k, Y + md[1] * k, 1, 1);
    ctx.fillStyle = PAL['0']; for (let k = 1; k <= 2; k++) ctx.fillRect(X + hd[0] * k, Y + hd[1] * k, 1, 1);
    ctx.fillStyle = PAL.o; ctx.fillRect(X, Y, 1, 1);
    const s = Math.sin(WGS.t * 2.6 + hash(tx, ty, 9) % 7), off = s > 0.4 ? 1 : s < -0.4 ? -1 : 0, PY = sy - 14 + 16; // the pendulum in its window
    ctx.fillStyle = PAL.O; for (let y = 0; y < 6; y++) ctx.fillRect(X + (y > 2 ? off : 0), PY + y, 1, 1);
    ctx.fillStyle = PAL.y; ctx.fillRect(X - 1 + off, PY + 6, 3, 2); ctx.fillStyle = PAL.Y; ctx.fillRect(X - 1 + off, PY + 6, 1, 1);
  } else if (wgSunUp()) { // the gnomon's shadow, opposite the sun: west in the morning, short at noon, east at dusk
    const f = (c - 0.25) * Math.PI * 2, dx = -Math.cos(f) * 4, dy = -Math.sin(f) * 2, n = Math.max(Math.abs(Math.round(dx)), Math.abs(Math.round(dy)));
    ctx.fillStyle = PAL.m;
    for (let k = 1; k <= n; k++) { const x = Math.round(dx * k / n), y = Math.round(dy * k / n); if (y < 0 && x === 0) continue; ctx.fillRect(sx + 8 + x, sy + 6 + y, 1, 1); }
  }
};
const _wgTipClock = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipClock(s);
  if (s.id === 'grand_clock') L.push('USE IT TO HEAR THE TIME', 'STRIKES AT DAWN, NOON AND DUSK');
  else if (s.id === 'sundial') L.push('ITS SHADOW FOLLOWS THE SUN', 'USE IT TO READ THE TIME');
  return L;
};
const _wgBuildClock = wgBuildAll;
wgBuildAll = function () {
  _wgBuildClock();
  wgReg('grand_clock', [wgMake('grand_clock', 17, 30, (g) => { // a tall wooden case: an arched crown, a round face, a window for the pendulum
    wgRc(g, 5, 1, 7, 1, 'N'); wgRc(g, 4, 2, 9, 1, 'n'); wgRc(g, 3, 3, 11, 1, 'n'); wgRc(g, 5, 2, 3, 1, 'N');
    wgRc(g, 3, 4, 11, 11, 'n'); wgRc(g, 3, 4, 1, 11, 'N'); wgRc(g, 13, 4, 1, 11, 'u');
    wgBlob(g, 8.5, 9.5, 4.4, 4.4, ['O', 'O', 'O', 'O']); wgBlob(g, 8.5, 9.5, 3.6, 3.6, ['a', 'A', 'A', 'w']); // the brass ring, the face
    for (const [x, y] of [[8, 6], [11, 9], [8, 12], [5, 9]]) wgPx(g, x, y, 'u');
    wgRc(g, 4, 15, 9, 12, 'n'); wgRc(g, 4, 15, 1, 12, 'N'); wgRc(g, 12, 15, 1, 12, 'u'); wgRc(g, 6, 16, 5, 9, 'u'); // the waist, its window
    wgRc(g, 3, 27, 11, 2, 'n'); wgRc(g, 3, 27, 11, 1, 'N'); wgRc(g, 13, 27, 1, 2, 'u');
  })]);
  wgReg('sundial', [wgMake('sundial', 16, 16, (g) => { // a stone pedestal, a round dial with its marks, a brass pin
    wgRc(g, 4, 13, 8, 2, 'm'); wgRc(g, 4, 14, 8, 1, 'd'); wgRc(g, 4, 13, 2, 1, 'l');
    wgRc(g, 6, 9, 4, 4, 'm'); wgRc(g, 6, 9, 1, 4, 'l'); wgRc(g, 9, 9, 1, 4, 'd');
    wgBlob(g, 8.5, 6.5, 6.2, 3.2, ['m', 'l', 'l', 'L']);
    for (const [x, y] of [[3, 6], [4, 5], [8, 4], [12, 5], [13, 6]]) wgPx(g, x, y, 'd');
    wgPx(g, 8, 5, 'o'); wgPx(g, 8, 4, 'O');
  })]);
};
