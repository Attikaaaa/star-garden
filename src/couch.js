'use strict';
// Couch co-op: friends on the same screen, each with their own controller. On the pre-run
// screen a second, third or fourth controller joins with A (and leaves with B); the run
// then plays like online co-op (shared purse, help each other up), all on this device.

// ---------- Extra controllers ----------
// The first connected controller belongs to player one (see pollPad); the others to friends.
const PADS = {}; // index -> { mx, my, ax, ay, prev: [], hit: {} }
function pollCouchPads() {
  const list = navigator.getGamepads ? navigator.getGamepads() : [];
  let first = -1;
  for (let i = 0; i < list.length; i++) if (list[i] && list[i].connected) { first = i; break; }
  for (let i = 0; i < list.length; i++) {
    const gp = list[i];
    if (!gp || !gp.connected) { delete PADS[i]; continue; }
    const P = PADS[i] || (PADS[i] = { mx: 0, my: 0, ax: 0, ay: 0, prev: [], hit: {}, first: false });
    P.first = i === first;
    const dz = (v) => (Math.abs(v || 0) < 0.22 ? 0 : v);
    P.mx = dz(gp.axes[0]); P.my = dz(gp.axes[1]); P.ax = gp.axes[2] || 0; P.ay = gp.axes[3] || 0;
    if (Math.hypot(P.ax, P.ay) < 0.4) P.ax = P.ay = 0;
    const b = gp.buttons.map(x => x.pressed || x.value > 0.5);
    if (b[12]) P.my = -1; if (b[13]) P.my = 1; if (b[14]) P.mx = -1; if (b[15]) P.mx = 1;
    P.hit = {};
    for (const k in PAD_BTN) if (b[k] && !P.prev[k]) P.hit[PAD_BTN[k]] = true;
    P.prev = b;
  }
}
// A controller a friend has claimed no longer drives player one (see pollPad).
const couchPad = (i) => !NET.role && !!G.couch && G.couch.some(c => c.pad === i);
// Which controllers could join: every one but player one's (when player one plays on the
// keyboard, the mouse or touch, even the first controller is free).
// (Judged by the device used before this frame, so the join press itself does not count.)
const freePads = () => Object.keys(PADS).map(Number).filter(i => !(PADS[i].first && Input.aimWas === 'pad' && !couchPad(i)));

// ---------- Joining on the pre-run screen ----------
// Returns true when someone joined or left, so that press does not also work the menu.
function updateCouchJoin() {
  if (NET.role) return false;
  pollCouchPads();
  G.couch = G.couch || [];
  let moved = false;
  for (const i of freePads()) {
    const P = PADS[i], j = G.couch.findIndex(c => c.pad === i);
    if (P.hit.PadA && j < 0 && G.couch.length < 3) { G.couch.push({ pad: i }); Audio_.sfx('confirm'); toast('PLAYER ' + (G.couch.length + 1) + ' JOINS!'); moved = true; }
    else if (P.hit.PadB && j >= 0) { G.couch.splice(j, 1); Audio_.sfx('select'); toast('PLAYER ' + (j + 2) + ' LEAVES'); moved = true; }
  }
  G.couch = G.couch.filter(c => PADS[c.pad]);
  if (moved) Input.lastAim = Input.aimWas;
  return moved;
}
// The heroes of a couch game: player one plus each friend's controller.
function couchRoster() {
  const out = soloRoster();
  (G.couch || []).forEach((c, k) => out.push({ pid: k + 1, wand: 'wand', up: Save.up, name: 'P' + (k + 2), skin: (Save.skin + k + 1) % ROBES.length, hero: 'pip', aspect: 0, couch: true, pad: c.pad, cos: {} }));
  return out;
}
const couchOn = () => G.players.some(p => p.pad !== undefined);
function drawCouchJoin() {
  if (NET.role || !Object.keys(PADS).length) return;
  const c = G.couch || [], x0 = VW / 2 - 140;
  c.forEach((k, i) => {
    const x = x0 + 18 + i * 22;
    drawFeet(S('hero_d0' + SKIN[(Save.skin + i + 1) % ROBES.length]), x, 56);
    text('P' + (i + 2), x, 58, TAG_COL[(Save.skin + i + 1) % ROBES.length], 1, 1);
  });
  if (c.length < 3 && freePads().some(i => !c.some(k => k.pad === i))) text('ANOTHER CONTROLLER: PRESS A TO JOIN', VW / 2, 206, Math.floor(G.time * 2) % 2 ? 'Y' : 'c', 2, 1);
}

// ---------- A friend's controls during the run ----------
function readCouchInput(p) {
  const I = p.in, P = PADS[p.pad];
  if (!P || G.state !== 'play') { Object.assign(I, newInput()); return; }
  I.mx = P.mx; I.my = P.my;
  const l = Math.hypot(I.mx, I.my);
  if (l > 1) { I.mx /= l; I.my /= l; }
  I.dash = !!(P.hit.PadA || P.hit.PadLB || P.hit.PadLT);
  I.star = !!(P.hit.PadRB || P.hit.PadRT);
  I.use = !!P.hit.PadX;
  I.belt = P.hit.PadY ? 0 : -1;
  let ax = P.ax, ay = P.ay;
  if (ax || ay) {
    // the same gentle aim assist as player one's stick
    const a0 = Math.atan2(ay, ax);
    let best = null, bd = 0.38;
    for (const e of G.enemies) {
      if (e.dead || e.spawnT > 0 || e.ghost || e.passive) continue;
      const ex = e.x - p.x, ey = e.y - e.h / 2 - (p.y - 8), dist = Math.hypot(ex, ey);
      if (dist > p.range + 20) continue;
      let da = Math.abs(Math.atan2(ey, ex) - a0);
      if (da > Math.PI) da = Math.PI * 2 - da;
      if (da < bd) { bd = da; best = [ex, ey]; }
    }
    if (best) { ax = best[0]; ay = best[1]; }
  }
  I.aim = !!(ax || ay); I.pad = true;
  if (I.aim) { I.ax = ax; I.ay = ay; }
  if (P.hit.PadStart && G.state === 'play') { setState('pause'); Audio_.sfx('select'); }
}
function readCouchInputs() {
  if (!couchOn()) return;
  pollCouchPads();
  for (const p of G.players) if (p.pad !== undefined) readCouchInput(p);
}
