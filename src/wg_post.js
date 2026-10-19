'use strict';
// Wildgrove: the post and pots pack. A mailbox gets a letter from the frog every morning, with a small gift tucked
// inside (its flag is up while one waits, USE reads it); flower pots in the five petal colours and a potted fern.
// The day's letter is the same on every screen; who has read it is kept in the world (`meta.mail`, the day it was read).
// Ids are appended, so old worlds stay valid.
const WG_LETTERS = [
  ['THE MORNING SMELLS OF RAIN', 'AND FRESH BREAD. SLEEP WELL?'],
  ['I FOUND A SHINY PEBBLE BY THE', 'POND. THIS IS FOR YOU INSTEAD.'],
  ['REMEMBER TO REST NOW AND THEN.', 'A CUP OF TEA FIXES MOST THINGS.'],
  ['THE STARS WERE SO BRIGHT LAST', 'NIGHT. I COUNTED UNTIL I SLEPT.'],
  ['A LITTLE BIRD SANG AT MY WINDOW.', 'I THINK IT WAS ABOUT YOU.'],
  ['THE FISH ARE BITING BY THE', 'REEDS. BRING A ROD AND A SNACK.'],
  ['I TRIED TO BAKE A PIE TODAY.', 'IT IS MOSTLY CRUMBS. HAPPY ONES.'],
  ['THE WIND TOLD ME A SECRET:', 'FLOWERS GROW PAST THE HILLS.'],
  ['DO NOT FORGET TO DRINK SOME', 'WATER. AND TO SMILE, A LITTLE.'],
  ['I SAW YOUR LIGHTS FROM AFAR.', 'YOUR HOME LOOKS VERY COZY.'],
  ['MUSHROOMS CAME UP IN THE RAIN.', 'SOME ARE TASTY. SOME ARE CUTE.'],
  ['EVERY DAY IS A NEW PAGE.', 'WHAT WILL YOU WRITE ON THIS ONE?'],
];
const WG_GIFTS = [['seed_tomato', 2], ['seed_straw', 2], ['seed_sun', 2], ['seed_corn', 2], ['cookies', 2], ['apple', 2], ['tea_leaf', 3], ['berry', 4], ['honey', 1], ['petal_p', 3], ['bonemeal', 2], ['pearl', 1]];
const WG_POTS = [['r', 'RED', ['p', 'r', 'R'], 'Y'], ['y', 'YELLOW', ['o', 'y', 'Y'], 'O'], ['b', 'BLUE', ['b', 'B', 'c'], 'Y'], ['w', 'WHITE', ['l', 'L', 'w'], 'y'], ['p', 'PURPLE', ['1', '2', '3'], 'Y']];
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'axe', hp: 3, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, at);
  };
  dec('mailbox', 'MAILBOX', { mail: 1 }, { wood: 4, stick: 2 }, 'bench');
  for (const [k, c] of WG_POTS) dec('pot_' + k, c + ' FLOWER POT', { tool: 'pick' }, { brick: 1, ['petal_' + k]: 2 }, 'hand');
  dec('pot_fern', 'POTTED FERN', { tool: 'pick' }, { brick: 1, fiber: 3 }, 'hand');
  WG_ACH.push(['letters', 'PEN PAL', 'READ FIVE LETTERS', (c) => (c.st.letters || 0) >= 5]);
})();
const wgMailWaits = () => !!WGS.world && WGS.world.meta.mail !== WGS.day;
function wgLetterToday() { return (WGS.day * 5 + (WGS.world.seed | 0)) % WG_LETTERS.length; } // the same letter on every screen
function wgReadMail(tx, ty) {
  const w = WGS.world, m = w.meta, st = m.stats || (m.stats = { kills: 0, far: 0 });
  const gift = WG_GIFTS[hash(WGS.day, w.seed | 0, 61) % WG_GIFTS.length];
  m.mail = WGS.day; st.letters = (st.letters || 0) + 1;
  wgDrop(tx * 16 + 8, ty * 16 + 20, gift[0], gift[1]);
  WGS.mail = { n: wgLetterToday(), gift, t0: WGS.t }; WGS.scr = 'mail'; WGS.ui = {}; wgSfx('pickup');
}
const _wgUsePost = wgUse;
wgUse = function (tx, ty) {
  const id = wgObjAt(WGS.world, WGS.dim, tx, ty), o = id && OBJ[id];
  if (!o || !o.mail) return _wgUsePost(tx, ty);
  if (wgMailWaits()) wgReadMail(tx, ty); else wgToast('NO NEW LETTER TODAY');
  return true;
};
const _wgTipPost = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipPost(s), it = WGI[s.id], o = it && it.place && OBJ[O_ID[it.place]];
  if (o && o.mail) L.push('A LETTER COMES EVERY MORNING');
  return L;
};

// ---------- the letter ----------
const _wgUpdPost = updateWG;
updateWG = function (dt) {
  _wgUpdPost(dt);
  if (WGS.scr !== 'mail' || !WGS.world) return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  if (!WGS.mail || WGS.t > WGS.mail.t0 && pressed('Escape', 'PadB', wgKey('use'))) { WGS.scr = 'play'; WGS.mail = null; } // not on the press that opened it
};
const _wgDrawPost = drawWG;
drawWG = function () {
  _wgDrawPost();
  if (WGS.scr === 'mail' && WGS.world && WGS.mail) wgDrawLetter();
};
function wgDrawLetter() {
  const M = WGS.mail, L = WG_LETTERS[M.n], x = VW / 2 - 120, y = 18, ui = WGS.ui;
  dim(0.45);
  rect(x, y, 240, 176, '0'); rect(x + 1, y + 1, 238, 174, 'A'); rect(x + 3, y + 3, 234, 170, 'e'); rect(x + 4, y + 4, 232, 168, 'A');
  rect(x + 4, y + 4, 232, 1, 'w'); rect(x + 4, y + 88, 232, 1, 'a'); // the light on the paper, the fold
  // the frog's stamp, top right, with a perforated edge
  const sx = x + 206, sy = y + 10; rect(sx - 3, sy - 3, 22, 22, 'q'); rect(sx - 1, sy - 1, 18, 18, 'C');
  for (let i = 0; i < 22; i += 2) { rect(sx - 3 + i, sy - 3, 1, 1, 'A'); rect(sx - 3 + i, sy + 18, 1, 1, 'A'); rect(sx - 3, sy - 3 + i, 1, 1, 'A'); rect(sx + 18, sy - 3 + i, 1, 1, 'A'); }
  drawS(S('frog_0'), sx, sy);
  wtext('DEAR FRIEND,', x + 16, y + 16, '1', 0);
  L.forEach((s, i) => wtext(s, x + 16, y + 40 + i * 14, '0', 0));
  wtext('YOUR FRIEND, THE FROG', x + 224, y + 76, '1', 0, 2);
  wtext('TUCKED INSIDE:', x + 16, y + 100, '1', 0);
  const [id, n] = M.gift; rect(x + 16, y + 113, 20, 20, 'e'); rect(x + 17, y + 114, 18, 18, 'a'); ctx.drawImage(wgIcon(id), x + 18, y + 115);
  wtext(WGI[id].name, x + 44, y + 120, '0', 0); if (n > 1) wtext('X' + n, x + 50 + textW(WGI[id].name, 0), y + 120, '1', 0);
  wgUiBegin(ui);
  if (wgButton(ui, 'THANK YOU', VW / 2 - 52, y + 150, 104)) { WGS.scr = 'play'; WGS.mail = null; }
  wgUiEnd(ui);
}

// ---------- drawing: the mailbox's flag, up while a letter waits ----------
const _wgDrawObjPost = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjPost(id, tx, ty, sx, sy);
  if (!OBJ[id].mail) return;
  if (wgMailWaits()) ctx.drawImage(wgMailFlag(1), sx + 10, sy - 4); else ctx.drawImage(wgMailFlag(0), sx + 10, sy + 2);
};
function wgMailFlag(up) {
  const key = 'mflag' + up; if (WGA.cache[key]) return WGA.cache[key];
  const c = up ? wgMake(key, 6, 10, (g) => { wgRc(g, 1, 1, 1, 8, 'l'); wgRc(g, 2, 1, 3, 3, 'r'); wgRc(g, 2, 1, 3, 1, 'R'); })
    : wgMake(key, 7, 5, (g) => { wgRc(g, 1, 1, 2, 3, 'l'); wgRc(g, 3, 1, 3, 3, 'r'); wgRc(g, 3, 1, 3, 1, 'R'); });
  return (WGA.cache[key] = c);
}
const _wgBuildPost = wgBuildAll;
wgBuildAll = function () {
  _wgBuildPost();
  const one = (id, w, h, fn) => wgReg(id, [wgMake(id, w, h, fn)]);
  // a little wooden mailbox with a red roof on a post; the flag is drawn on its own
  one('mailbox', 16, 22, (g) => {
    wgRc(g, 6, 12, 3, 9, 'n'); wgRc(g, 6, 12, 1, 9, 'N'); wgRc(g, 4, 20, 7, 1, 'u');
    wgRc(g, 2, 5, 9, 7, 'N'); wgRc(g, 2, 5, 9, 1, 'A'); wgRc(g, 2, 5, 1, 7, 'a'); wgRc(g, 10, 6, 1, 6, 'n'); wgRc(g, 2, 11, 9, 1, 'n');
    wgRc(g, 4, 7, 5, 1, 'u'); wgRc(g, 5, 9, 3, 1, 'e'); // the slot and a little name plate
    for (let r = 0; r < 4; r++) { wgRc(g, 5 - r * 1.5 | 0, 1 + r, 3 + r * 3, 1, 'r'); wgPx(g, 5 - r * 1.5 | 0, 1 + r, 'R'); }
    wgRc(g, 6, 1, 1, 1, 'R'); wgRc(g, 1, 4, 11, 1, 'p');
  });
  // flower pots: a terracotta pot, three blossoms over green leaves
  const pot = (g) => { wgRc(g, 3, 9, 8, 6, 'n'); wgRc(g, 3, 9, 2, 6, 'N'); wgRc(g, 10, 9, 1, 6, 'u'); wgRc(g, 4, 14, 6, 1, 'u'); wgRc(g, 2, 8, 10, 2, 'N'); wgRc(g, 2, 8, 10, 1, 'k'); wgRc(g, 11, 9, 1, 1, 'n'); };
  for (const [k, , c, mid] of WG_POTS) one('pot_' + k, 14, 16, (g) => {
    wgRc(g, 4, 6, 1, 3, 'g'); wgRc(g, 7, 4, 1, 5, 'g'); wgRc(g, 9, 6, 1, 3, 'g');
    wgRc(g, 2, 6, 2, 1, 'G'); wgRc(g, 10, 6, 2, 1, 'G'); wgPx(g, 5, 7, 'h'); wgPx(g, 8, 6, 'G');
    for (const [x, y] of [[4, 4], [7, 2], [10, 4]]) { wgRc(g, x - 1, y, 3, 1, c[1]); wgRc(g, x, y - 1, 1, 3, c[1]); wgPx(g, x - 1, y, c[2]); wgPx(g, x, y - 1, c[2]); wgPx(g, x + 1, y + 1, c[0]); wgPx(g, x, y, mid); }
    pot(g);
  });
  one('pot_fern', 14, 16, (g) => {
    for (const [x0, y0, x1, y1] of [[7, 8, 2, 3], [7, 8, 5, 1], [7, 8, 9, 1], [7, 8, 12, 3], [7, 8, 7, 0]]) wgLine(g, x0, y0, x1, y1, 'g');
    for (const [x, y] of [[3, 3], [4, 4], [5, 2], [6, 3], [9, 2], [8, 3], [11, 3], [10, 4], [7, 1], [6, 5], [8, 5]]) wgPx(g, x, y, 'G');
    for (const [x, y] of [[3, 4], [5, 3], [7, 2], [9, 3], [11, 4]]) wgPx(g, x, y, 'h');
    pot(g);
  });
};
