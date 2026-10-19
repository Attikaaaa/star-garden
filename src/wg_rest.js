'use strict';
// Wildgrove: the rest and tea pack. USE a chair, a couch, a park bench, a log stool or a picnic blanket to sit down;
// sitting heals slowly and any step stands you up. Tea bushes grow among the ferns, their leaves brew four teas, and a
// cup drunk sitting down heals more. Ids are appended, so old worlds stay valid.
const WG_TEA = ['green_tea', 'honey_tea', 'lemon_tea', 'chamomile'];
const WG_SIT_HEAL = 3; // seconds per heart sitting
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'axe', hp: 3, solid: 0, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, at);
  };
  for (const id of ['chair', 'couch']) OBJ[O_ID[id]].seat = 1;
  dec('park_bench', 'PARK BENCH', { seat: 1 }, { wood: 5, iron: 1 }, 'bench');
  dec('stool', 'LOG STOOL', { seat: 1 }, { wood: 2 }, 'hand');
  dec('picnic', 'PICNIC BLANKET', { seat: 1, tool: 'hand', hp: 1 }, { wool: 3, petal_r: 1 }, 'loom');
  dec('tea_set', 'TEA SET', { solid: 1 }, { table: 1, clay: 2, glass: 1 }, 'bench');
  // the tea bush: picked like a berry bush, planted from a cutting
  wgItem('tea_leaf', 'TEA LEAVES', 'res', {});
  wgObj('teabush', { name: 'TEA BUSH', kind: 'plant', hp: 2, solid: 1, grow: 1, ripe: 'teabush_r', drops: [DR('stick', 0, 1, 0.5)] });
  wgObj('teabush_r', { name: 'TEA BUSH', kind: 'plant', hp: 2, solid: 1, pick: 'teabush', drops: [DR('tea_leaf', 2, 3), DR('tea_cutting', 0, 1, 0.2)] });
  wgItem('tea_cutting', 'TEA CUTTING', 'place', { place: 'teabush' }); PLACE.tea_cutting = 'teabush';
  wgRec('tea_cutting', 1, { tea_leaf: 3, stick: 1 });
  for (const [id, name, food, buff, n, rec] of [
    ['green_tea', 'GREEN TEA', 2, 'regen', 1, { tea_leaf: 2 }], ['honey_tea', 'HONEY TEA', 4, 'regen', 1, { tea_leaf: 1, honey: 1 }],
    ['lemon_tea', 'LEMON TEA', 4, 'speed', 1, { tea_leaf: 1, lemon: 1 }], ['chamomile', 'CHAMOMILE TEA', 3, 'regen', 1, { petal_w: 3 }],
    ['cookies', 'COOKIES', 3, null, 4, { flour: 1, sugar: 1, egg: 1 }]]) {
    wgItem(id, name, 'food', buff ? { food, buff } : { food }); wgRec(id, n, rec, 'fire');
  }
  WG_ACH.push(['tea', 'TEA TIME', 'DRINK TEA SITTING DOWN', (c) => c.st.tea]);
})();

// Tea bushes: a fern in so many is one, chosen from the seed like the wild fruit trees.
const _wgGenRest = wgGenOver;
wgGenOver = function (seed, ch) {
  _wgGenRest(seed, ch);
  const CS = WG.CS, fern = O_ID.fern;
  for (let k = 0; k < CS * CS; k++) {
    if (ch.o[k] !== fern) continue;
    const h = hash(ch.cx * CS + k % CS, ch.cy * CS + Math.floor(k / CS), seed + 93);
    if (h % 10 === 0) ch.o[k] = O_ID[(h >> 8) & 1 ? 'teabush_r' : 'teabush'];
  }
};

// ---------- sitting ----------
// p.sit = { tx, ty, dim } while seated. The hero is set on the seat; a step, a knock or a trip elsewhere stands them up.
function wgSit(tx, ty) {
  const p = WGS.p; if (p.sit) return wgStand();
  p.sit = { tx, ty, dim: WGS.dim, t: 0 }; p.x = tx * 16 + 8; p.y = ty * 16 + 12; p.vx = p.vy = 0; p.face = 'd'; p.moving = false;
  wgSfx('select');
  return true;
}
function wgStand() { const p = WGS.p; if (p) p.sit = null; return true; }
const _wgUseRest = wgUse;
wgUse = function (tx, ty) {
  const o = OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)], s = WGS.inv[WGS.sel];
  if (o && o.seat) return WGS.p.sit && s && WGI[s.id].kind === 'food' ? false : wgSit(tx, ty); // seated with a cup in hand: drink it
  return _wgUseRest(tx, ty);
};
const _wgUpdRest = updateWG;
updateWG = function (dt) {
  _wgUpdRest(dt);
  const p = WGS.p, S = p && p.sit; if (!S) return;
  const seat = OBJ[wgObjAt(WGS.world, WGS.dim, S.tx, S.ty)];
  if (S.dim !== WGS.dim || !seat || !seat.seat || Math.hypot(p.x - (S.tx * 16 + 8), p.y - (S.ty * 16 + 12)) > 1.5 || p.hp <= 0) { p.sit = null; return; }
  if (WGS.scr !== 'play') return;
  if ((S.t += dt) >= WG_SIT_HEAL) { S.t = 0; if (p.hp < p.maxHp && p.food > 0) { p.hp++; wgPart(p.x, p.y - 20, 3, { c: ['h', 'H', 'w'], s: 8, up: 16, life: 0.7 }); } }
};
// A cup of tea sitting down: a little more health and the TEA TIME star.
const _wgEatRest = wgEat;
wgEat = function (slot) {
  const s = WGS.inv[slot], tea = s && WG_TEA.includes(s.id), p = WGS.p;
  if (!_wgEatRest(slot)) return false;
  if (tea && p.sit) {
    p.hp = Math.min(p.maxHp, p.hp + 4); wgToast('A NICE CUP OF TEA'); wgPart(p.x, p.y - 20, 6, { c: ['h', 'H', 'w'], s: 14, up: 20, life: 0.8 });
    const m = WGS.world.meta; (m.stats || (m.stats = { kills: 0, far: 0 })).tea = 1;
  }
  return true;
};
// Co-op: a seated hero is sent as facing 'S', so every screen draws them sitting.
const _wgnSendRest = wgnSend;
wgnSend = function (L, m, ...rest) {
  if (WGS.p && WGS.p.sit && m) { if (m.t === 'p') m.face = 'S'; else if (m.t === 'ps' && m.l[0] && m.l[0][0] === 0) m.l[0][3] = 'S'; }
  return _wgnSendRest(L, m, ...rest);
};
// Seated: the body drops two pixels and the shins fold away behind the seat's front.
const _wgDrawPlayerRest = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  const p = e.p; if (!(p.sit || p.face === 'S') || p.hidden) return _wgDrawPlayerRest(e, cx0, cy0);
  const sx = Math.round(p.x - cx0), sy = Math.round(p.y - cy0);
  if (p.inv > 0 && Math.floor(WGS.t * 20) % 2) return;
  const spr = wgPlayerSpr('d', 0, p.look || { skin: 0, hair: 0, shirt: 0 });
  ctx.drawImage(spr, 0, 0, 18, 19, sx - 9, sy - 22, 18, 19); ctx.drawImage(spr, 0, 21, 18, 5, sx - 9, sy - 3, 18, 5);
  if (p.name && p !== WGS.p) wgRawText(p.name, sx, sy - 30, 'w', 2, 1);
};
const _wgTipRest = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipRest(s), it = WGI[s.id], o = it && it.place && OBJ[O_ID[it.place]];
  if (o && o.seat) L.push('USE IT TO SIT AND REST');
  if (WG_TEA.includes(s.id)) L.push('BEST ENJOYED SITTING DOWN');
  return L;
};

// ---------- art ----------
const WG_REST_ART = ['tea_leaf', 'green_tea', 'honey_tea', 'lemon_tea', 'chamomile', 'cookies', 'tea_cutting'];
const _wgBuildRest = wgBuildAll;
wgBuildAll = function () {
  _wgBuildRest();
  const W4 = ['u', 'n', 'N', 'O'], one = (id, w, h, fn, ol) => wgReg(id, [wgMake(id, w, h, fn, ol)]);
  // a bench of three slats on two iron legs
  one('park_bench', 18, 15, (g) => {
    for (const y of [1, 4]) { wgRc(g, 1, y, 16, 2, W4[1]); wgRc(g, 1, y, 16, 1, W4[3]); }
    wgRc(g, 2, 1, 1, 8, 'X'); wgRc(g, 15, 1, 1, 8, 'X'); wgRc(g, 0, 8, 18, 3, W4[2]); wgRc(g, 0, 8, 18, 1, W4[3]); wgRc(g, 0, 10, 18, 1, W4[0]);
    for (const x of [1, 15]) { wgRc(g, x, 11, 2, 4, 'x'); wgPx(g, x, 11, 'X'); }
  });
  // a sawn log end with its rings
  one('stool', 12, 12, (g) => {
    wgRc(g, 1, 4, 10, 7, 'n'); wgRc(g, 1, 4, 2, 7, 'N'); wgRc(g, 9, 4, 2, 7, 'u'); for (const [x, y] of [[4, 6], [6, 7], [8, 5]]) wgRc(g, x, y, 1, 3, 'u');
    wgRc(g, 0, 10, 3, 1, 'u'); wgRc(g, 9, 10, 3, 1, 'u');
    wgBlob(g, 6, 3.6, 5, 2.4, ['N', 'N', 'e', 'a']); wgBlob(g, 6, 3.6, 3, 1.3, ['e', 'e', 'e', 'e']); wgRc(g, 5, 3, 2, 1, 'N');
  });
  // a red and white check blanket on the grass, no outline so it lies flat
  one('picnic', 24, 14, (g) => {
    for (let y = 1; y < 13; y++) for (let x = 1; x < 23; x++) wgPx(g, x, y, ((x >> 1) + (y >> 1)) & 1 ? 'L' : 'r');
    wgRc(g, 1, 12, 22, 1, 'p'); wgRc(g, 22, 1, 1, 12, 'p'); for (let x = 2; x < 22; x += 3) wgPx(g, x, 13, 'L');
  }, false);
  // a little table with a teapot and two cups
  one('tea_set', 18, 20, (g) => {
    wgRc(g, 1, 10, 16, 3, W4[2]); wgRc(g, 1, 10, 16, 1, W4[3]); wgRc(g, 1, 12, 16, 1, W4[0]); wgRc(g, 2, 13, 2, 7, W4[0]); wgRc(g, 14, 13, 2, 7, W4[0]);
    // a round white pot with a blue band, a lid and knob, a spout to the left and a handle to the right
    wgBlob(g, 9, 6.4, 4.2, 3.4, ['m', 'l', 'L', 'w']); wgRc(g, 5, 6, 9, 1, 'B'); wgRc(g, 7, 2, 4, 1, 'l'); wgRc(g, 8, 1, 2, 1, 'B');
    wgLine(g, 4, 7, 2, 4, 'l'); wgPx(g, 2, 3, 'L'); wgRc(g, 13, 5, 2, 1, 'l'); wgRc(g, 14, 5, 1, 4, 'l'); wgRc(g, 13, 8, 2, 1, 'm');
    for (const x of [2, 13]) { wgRc(g, x, 8, 3, 2, 'L'); wgPx(g, x + 1, 8, 'n'); wgPx(g, x + 2, 9, 'l'); }
  });
  // the tea bush: a low, dark rounded shrub; when there is picking to do, pale fresh tips and a few white flowers
  const bush = (g, ripe) => {
    wgBlob(g, 7, 8, 6.4, 4.6, ['z', 'g', 'G', 'h']); wgBlob(g, 4, 6, 3, 2.6, ['z', 'g', 'G', 'h']); wgBlob(g, 10, 5.6, 3, 2.6, ['z', 'g', 'G', 'h']);
    for (const [x, y] of [[3, 7], [8, 4], [11, 8], [6, 10], [9, 7]]) wgPx(g, x, y, 'g');
    if (ripe) { for (const [x, y] of [[4, 4], [9, 3], [12, 5], [2, 8], [7, 6], [11, 10], [5, 9]]) { wgPx(g, x, y, 'H'); wgPx(g, x, y + 1, 'h'); } for (const [x, y] of [[6, 3], [12, 8]]) { wgPx(g, x, y, 'w'); wgPx(g, x, y + 1, 'y'); } }
  };
  one('teabush', 14, 14, (g) => bush(g, false)); one('teabush_r', 14, 14, (g) => bush(g, true));
};
const _wgIconRest = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || !WG_REST_ART.includes(id)) return _wgIconRest(id);
  const [c, g] = wgCv(16, 16);
  const cup = (tea) => { // a white cup on a saucer, the tea inside, a wisp of steam
    wgBlob(g, 8, 13, 6.4, 1.6, ['l', 'L', 'w', 'w']); wgRc(g, 4, 7, 8, 6, 'L'); wgRc(g, 4, 7, 1, 6, 'w'); wgRc(g, 11, 7, 1, 6, 'l'); wgRc(g, 5, 12, 6, 1, 'l');
    wgRc(g, 12, 8, 2, 1, 'l'); wgRc(g, 13, 8, 1, 3, 'l'); wgRc(g, 12, 10, 2, 1, 'l'); wgRc(g, 5, 7, 6, 2, tea[1]); wgRc(g, 5, 7, 6, 1, tea[2]);
    wgPx(g, 7, 4, 'L'); wgPx(g, 8, 3, 'L'); wgPx(g, 7, 2, 'l'); wgPx(g, 10, 5, 'l');
  };
  if (id === 'tea_leaf') { // two leaves lying crosswise, each with its midrib
    const leaf = (x0, y0, x1, y1, w) => { // every pixel near the segment, as wide as a sine of the way along it
      const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy;
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const t = ((x - x0) * dx + (y - y0) * dy) / L2; if (t < 0 || t > 1) continue;
        const d = ((x - x0) * dy - (y - y0) * dx) / Math.sqrt(L2), r = Math.sin(t * Math.PI) * w; if (Math.abs(d) > r) continue;
        wgPx(g, x, y, d < -r / 3 ? 'h' : d > r / 3 ? 'g' : 'G');
      }
      wgLine(g, x0, y0, x1, y1, 'z');
    };
    leaf(2, 13, 11, 4, 2.6); leaf(6, 14, 14, 7, 2.2); wgPx(g, 1, 14, 'n'); wgPx(g, 5, 15, 'n');
  }
  else if (id === 'tea_cutting') { wgLine(g, 8, 6, 8, 15, 'n'); wgBlob(g, 5.6, 6, 2.6, 2, ['g', 'G', 'h', 'H']); wgBlob(g, 10.4, 4.6, 2.6, 2, ['g', 'G', 'h', 'H']); wgBlob(g, 8, 2.6, 2, 2, ['g', 'G', 'h', 'H']); wgPx(g, 7, 15, 'u'); wgPx(g, 9, 15, 'u'); }
  else if (id === 'green_tea') cup(['g', 'G', 'h']);
  else if (id === 'honey_tea') { cup(['n', 'o', 'O']); wgPx(g, 6, 7, 'Y'); }
  else if (id === 'lemon_tea') { cup(['n', 'O', 'y']); wgBlob(g, 11.6, 6.6, 2, 2, ['O', 'y', 'Y', 'w']); wgPx(g, 11, 6, 'w'); }
  else if (id === 'chamomile') { cup(['e', 'y', 'Y']); wgPx(g, 7, 7, 'w'); wgPx(g, 8, 7, 'y'); wgPx(g, 9, 7, 'w'); }
  else { for (const [x, y] of [[5, 11], [11, 11], [8, 6.6]]) { wgBlob(g, x, y, 3.4, 2.6, ['n', 'N', 'O', 'Y']); for (const [a, b] of [[-1, 0], [1, -1], [0, 1]]) wgPx(g, Math.round(x) + a, Math.round(y) + b, 'u'); } } // three cookies with chocolate chips
  wgOutline(c); WGA.cache[key] = c; return c;
};
