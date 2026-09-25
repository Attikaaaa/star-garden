'use strict';
// The Book: magic items, the foes you have met (with lore that unlocks as you fight them),
// the combos (named item pairs with a real bonus), your last runs and your statistics.

// ---------- Combos ----------
// need: item ids (an id twice means two of it) or 'w:<wand>'. add(p): the bonus, applied
// once when the pair comes together; some set a flag that the shot code reads.
const SYNERGIES = [
  { id: 'swarm', name: 'FIREFLY SWARM', need: ['homing', 'firework'], desc: 'FIREWORK SPARKS HUNT FOES', add: p => { p.swarm = true; } },
  { id: 'pinball', name: 'PINBALL', need: ['bounce', 'pierce'], desc: '+2 BOUNCES, +1 PIERCE', add: p => { p.bounce += 2; p.pierce += 1; } },
  { id: 'shooting', name: 'SHOOTING STAR', need: ['big', 'scope'], desc: '+1 DAMAGE, FASTER SHOTS', add: p => { p.dmg += 1; p.shotSpeed *= 1.1; } },
  { id: 'twinmoon', name: 'TWIN MOONS', need: ['moon', 'moon'], desc: 'A THIRD MOON JOINS THEM', add: p => { p.orbitals += 1; } },
  { id: 'shower', name: 'STAR SHOWER', need: ['triple', 'rapid'], desc: 'SHOOT 10% FASTER', add: p => { p.fireDelay *= 0.9; } },
  { id: 'honeyshield', name: 'HONEY BUBBLE', need: ['honey', 'shield'], desc: 'HONEY HEALS ALSO RESTORE THE BUBBLE', add: p => { p.honeyShield = true; } },
  { id: 'luckymag', name: 'LUCKY MAGNET', need: ['magnet', 'clover'], desc: 'EVEN MORE LUCK', add: p => { p.luck += 1; } },
  { id: 'dustdash', name: 'DUST DEVIL', need: ['stardust', 'speed'], desc: 'ROLL MORE OFTEN', add: p => { p.dashCd *= 0.75; } },
  { id: 'backfire', name: 'BACK FAN', need: ['backshot', 'triple'], desc: 'THE BACK EYE FIRES THREE', add: p => { p.backTriple = true; } },
  { id: 'bloom', name: 'FULL BLOOM', need: ['heart', 'heart'], desc: '+1 HEART AND A FULL HEAL', add: p => { p.maxHp = Math.min(20, p.maxHp + 2); p.hp = p.maxHp; } },
  { id: 'bigbang', name: 'BIG BANG', need: ['w:comet', 'firework'], desc: 'COMET BLASTS ARE BIGGER', add: p => { p.bigBlast = true; } },
  { id: 'storm', name: 'STORM ROD', need: ['w:chain', 'pierce'], desc: 'LIGHTNING JUMPS ONE MORE TIME', add: p => { p.chain3 = true; } },
  { id: 'bath', name: 'BUBBLE BATH', need: ['w:bubble', 'bounce'], desc: '+2 BOUNCES FOR EVERY BUBBLE', add: p => { p.bounce += 2; } },
  { id: 'confetti', name: 'CONFETTI', need: ['w:scatter', 'big'], desc: 'ONE MORE SPARK PER SHOT', add: p => { p.shots += 1; } },
  { id: 'windboom', name: 'WIND BOOMERANG', need: ['w:boomer', 'speed'], desc: 'BOOMERANGS FLY FASTER', add: p => { p.shotSpeed *= 1.2; } },
];
const SYN_BY = Object.fromEntries(SYNERGIES.map(s => [s.id, s]));
function hasNeed(p, need) {
  const left = p.items.slice();
  for (const n of need) {
    if (n.startsWith('w:')) { if (p.wand !== n.slice(2)) return false; continue; }
    const i = left.indexOf(n);
    if (i < 0) return false;
    left.splice(i, 1);
  }
  return true;
}
// Called on the host after a hero takes an item.
function checkSynergies(p) {
  if (!p.syns) p.syns = [];
  for (const s of SYNERGIES) {
    if (p.syns.includes(s.id) || !hasNeed(p, s.need)) continue;
    p.syns.push(s.id);
    s.add(p);
    burst(p.x, p.y - 12, 20, ['Y', 'P', 'c', 'w'], 120, 0.8, { g: -30 });
    Audio_.sfx('star');
    noteFor(p, 'syn', s.id);
  }
}
// On the hero's own device: the first time a combo happens it goes into the book.
onNote((ev, a) => {
  if (ev !== 'syn' || !SYN_BY[a]) return;
  const s = SYN_BY[a], first = !Save.syn.includes(a);
  if (first) { Save.syn.push(a); Save.write(); logNews('syn', 'NEW COMBO: ' + s.name, 'icon_book'); addBadge('menu:book'); checkStars(false); }
  G.bannerNext = { title: (first ? 'NEW COMBO! ' : 'COMBO! ') + s.name, sub: s.desc, t: 2.6, icon: null };
});
function synNeedText(s) { return s.need.map(n => (n.startsWith('w:') ? WANDS[n.slice(2)].name : ITEMS[n].name)).join(' + '); }

// ---------- Foes ----------
// spr: a sprite for the page; boss: counts defeats, not kills. Lore opens at 1, 10 and 50
// defeats (bosses: 1, 3 and 5).
const BEASTS = [
  { t: 'slime', spr: 'slime_green_idle', lore: ['SLIMES BOUNCE ALL OVER THE MEADOW.', 'BLUE ONES SPLIT IN TWO WHEN THEY POP.', 'THEY GLOWED WITH STARLIGHT ONCE, AND MISS IT.'] },
  { t: 'mini', spr: 'slime_blue_mini', lore: ['WHAT IS LEFT OF A BLUE SLIME.', 'TWICE AS QUICK, HALF AS BRAVE.', 'THEY HOP BACK TOGETHER AT NIGHT, THEY SAY.'] },
  { t: 'gold', spr: 'slime_gold_idle', lore: ['A SLIME THAT SWALLOWED A PURSE.', 'IT RUNS AWAY IF YOU WAIT TOO LONG.', 'MISTER RIBBIT PAYS WELL FOR ITS COINS.'] },
  { t: 'bee', spr: 'bee_0', lore: ['BUSY BEES GUARD THE FLOWERS.', 'THEY DIVE STRAIGHT AT WHOEVER COMES CLOSE.', 'THEIR QUEEN IS SAID TO LIVE IN A GOLDEN HIVE.'] },
  { t: 'shroom', spr: 'shroom_0', lore: ['A MUSHROOM THAT PUFFS SPORES.', 'IT SWELLS UP JUST BEFORE IT SHOOTS.', 'IT NEVER MOVES: IT HAS NOWHERE TO BE.'] },
  { t: 'flower', spr: 'flower_0', lore: ['A FLOWER WITH A TEMPER.', 'IT SPINS ITS PETALS INTO A RING OF SEEDS.', 'WATERED WITH STARLIGHT, IT WOULD BE KIND.'] },
  { t: 'crab', spr: 'crab_0', lore: ['CRABS SIDESTEP ALONG THE SHORE.', 'WHEN THEY STOP AND SHAKE, A CHARGE IS COMING.', 'THEIR SHELLS HOLD THE SOUND OF THE SEA.'] },
  { t: 'jelly', spr: 'jelly_0', lore: ['JELLYFISH DRIFT OVER THE SAND.', 'THEY PULSE OUT A RING WHEN THEY FALL.', 'AT NIGHT THEY GLOW LIKE LITTLE MOONS.'] },
  { t: 'wisp', spr: 'wisp_0', lore: ['A WISP OF CAVE LIGHT.', 'IT BLINKS AWAY AND APPEARS BESIDE YOU.', 'SOME SAY WISPS ARE LOST PIECES OF STARS.'] },
  { t: 'bat', spr: 'bat_0', lore: ['BATS HANG IN THE CRYSTAL CAVE.', 'THEY SWOOP IN LONG CURVES.', 'THEY ARE ONLY AFRAID OF THE DARK.'] },
  { t: 'king', spr: 'king_0', boss: true, lore: ['THE SLIME KING RULES THE MEADOW.', 'HE WEARS A BIG STAR AS HIS CROWN.', 'THE NIGHT MOTH GAVE HIM THAT STAR.'] },
  { t: 'bcrab', spr: 'bcrab_0', boss: true, lore: ['THE GIANT CRAB GUARDS THE SHORE.', 'ITS CLAWS FOLD THE WAVES IN HALF.', 'A BIG STAR SHINES INSIDE ITS SHELL.'] },
  { t: 'golem', spr: 'golem_0', boss: true, lore: ['THE CRYSTAL GOLEM SLEPT FOR A THOUSAND YEARS.', 'A FALLEN STAR WOKE IT UP.', 'IT DREAMS OF THE SKY IT CANNOT REACH.'] },
];
const beastN = (b) => cnt((b.boss ? 'b:' : 'k:') + b.t);
const loreN = (b) => { const n = beastN(b), s = b.boss ? [1, 3, 5] : [1, 10, 50]; return s.filter(k => n >= k).length; };
const loreNext = (b) => { const n = beastN(b), s = b.boss ? [1, 3, 5] : [1, 10, 50]; return s.find(k => n < k); };

// ---------- Text helper ----------
function wrapText(str, w) {
  str = tr(String(str));
  const out = [];
  let line = '';
  for (const word of String(str).split(' ')) {
    const t = line ? line + ' ' + word : word;
    if (textW(t) > w && line) { out.push(line); line = word; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

// ---------- Screen ----------
const BOOK_TABS = ['ITEMS', 'FOES', 'COMBOS', 'RUNS', 'STATS'];
const BK = { x: 30, y: 50, pane: 216 };
function bookCount() {
  const t = G.bookTab;
  return t === 0 ? Object.keys(ITEMS).length : t === 1 ? BEASTS.length : t === 2 ? SYNERGIES.length : t === 3 ? Save.hist.length : 0;
}
const BOOK_COLS = [8, 7, 3, 1, 1];
function bookCell(i) {
  const t = G.bookTab;
  if (t === 0) return [BK.x + (i % 8) * 22, BK.y + Math.floor(i / 8) * 22, 20, 20];
  if (t === 1) return [BK.x + (i % 7) * 26, BK.y + Math.floor(i / 7) * 26, 24, 25];
  if (t === 2) return [BK.x + (i % 3) * 110, BK.y + Math.floor(i / 3) * 24, 106, 22];
  if (t === 3) { const k = i - (G.bookTop || 0); return [BK.x, BK.y + 4 + k * 13, 324, 12]; }
  return null;
}
function updateBook() {
  // tabs: Q / E, LB / RB, Tab, or a click
  let tab = pressed('PadLB', 'KeyQ') ? G.bookTab - 1 : pressed('PadRB', 'KeyE', 'Tab') ? G.bookTab + 1 : null;
  BOOK_TABS.forEach((t, i) => { const x = bookTabX(i); if (mouseOn() && Input.mouseHit && Input.mx >= x - 4 && Input.mx < x + textW(t) + 4 && Input.my >= 28 && Input.my < 42) tab = i; });
  if (tab !== null) {
    G.bookTab = (tab + BOOK_TABS.length) % BOOK_TABS.length; G.menuSel = 0; G.bookTop = 0;
    Audio_.sfx('select'); return false;
  }
  const n = bookCount(), cols = BOOK_COLS[G.bookTab];
  let s = G.menuSel;
  if (s < n) {
    if (cols > 1) {
      if (pressed(...K_RIGHT) && s % cols < cols - 1 && s + 1 < n) s++;
      if (pressed(...K_LEFT) && s % cols > 0) s--;
    } else {
      if (pressed(...K_RIGHT)) { G.bookTab = (G.bookTab + 1) % BOOK_TABS.length; G.menuSel = 0; G.bookTop = 0; Audio_.sfx('select'); return false; }
      if (pressed(...K_LEFT)) { G.bookTab = (G.bookTab + BOOK_TABS.length - 1) % BOOK_TABS.length; G.menuSel = 0; G.bookTop = 0; Audio_.sfx('select'); return false; }
    }
    if (pressed(...K_UP) && s >= cols) s -= cols;
  } else if (pressed(...K_UP) && n) s = n - 1;
  if (pressed(...K_DOWN) && s < n) s = s + cols < n ? s + cols : n;
  if (cols === 1 && n === 0 && (pressed(...K_RIGHT) || pressed(...K_LEFT))) {
    G.bookTab = (G.bookTab + (pressed(...K_RIGHT) ? 1 : BOOK_TABS.length - 1)) % BOOK_TABS.length; G.menuSel = 0; Audio_.sfx('select'); return false;
  }
  if (s !== G.menuSel) { G.menuSel = s; Audio_.sfx('select'); }
  // the run list scrolls
  if (G.bookTab === 3) { const top = G.bookTop || 0; if (s < n && s < top) G.bookTop = s; else if (s < n && s > top + 8) G.bookTop = s - 8; }
  for (let i = 0; i < n; i++) { const c = bookCell(i); if (c && (G.bookTab !== 3 || (i >= (G.bookTop || 0) && i <= (G.bookTop || 0) + 8))) hoverRow(i, c[0], c[1], c[2], c[3]); }
  const bw = textW('BACK') + 20;
  if (hoverRow(n, VW / 2 - bw / 2, 199, bw, 13) && Input.mouseHit) return true;
  return pressed(...K_BACK) || (pressed(...K_OK) && G.menuSel === n);
}
const bookTabX = (i) => 40 + i * 64;
function boxFrame(x, y, w, h, col) { rect(x - 1, y - 1, w + 2, 1, col); rect(x - 1, y + h, w + 2, 1, col); rect(x - 1, y, 1, h, col); rect(x + w, y, 1, h, col); }
function drawBook() {
  drawTitleBg();
  dim(0.5);
  panel(22, 24, 340, 172);
  BOOK_TABS.forEach((t, i) => {
    const x = bookTabX(i), on = G.bookTab === i;
    text(t, x, 31, on ? 'Y' : '3', 1);
    if (on) rect(x - 2, 40, textW(t) + 4, 1, 'Y');
  });
  if (Input.lastAim === 'pad') { text('LB', 28, 31, 'l', 0); text('RB', 346, 31, 'l', 0); }
  [drawBookItems, drawBookFoes, drawBookCombos, drawBookRuns, drawBookStats][G.bookTab]();
  const back = G.menuSel === bookCount();
  text('BACK', VW / 2, 202, back ? 'Y' : 'l', 2, 1);
  if (back) pointer(VW / 2 - textW('BACK') / 2 - 10, 202);
}
// A text block in the right-hand pane.
function paneLines(lines, y, col) { for (const l of lines) { for (const w of wrapText(l, 130)) { text(w, BK.pane + 64, y, col, 1, 1); y += 10; } } return y; }
function drawBookItems() {
  const ids = Object.keys(ITEMS), found = new Set(Save.found), unl = new Set(Save.unl.items);
  ids.forEach((id, i) => {
    const [x, y] = bookCell(i);
    rect(x, y, 20, 20, '0'); rect(x + 1, y + 1, 18, 18, unl.has(id) ? '2' : '1');
    if (unl.has(id)) drawS(S('icon_' + id), x + 2, y + 2, found.has(id) ? 0 : 4);
    else text('?', x + 10, y + 7, 'l', 1, 1);
    if (i === G.menuSel) boxFrame(x, y, 20, 20, 'Y');
  });
  text(found.size + ' / ' + ids.length + ' FOUND', BK.x + 87, 188, 'c', 1, 1);
  const id = ids[G.menuSel];
  if (!id) return paneLines(['PICK AN ITEM TO READ ABOUT IT'], 60, 'l');
  const it = ITEMS[id], has = found.has(id);
  drawS(S('icon_' + id), BK.pane + 56, 50, has ? 0 : 4);
  let y = 72;
  text(has ? it.name : '???', BK.pane + 64, y, has ? 'Y' : 'l', 1, 1); y += 12;
  y = paneLines([has ? it.desc : unl.has(id) ? 'NOT FOUND YET' : 'LEARN IT FROM A STAR SCROLL'], y, 'w') + 2;
  text(RARE_NAME[it.rare || 0] + (it.set ? '  ' + SETS[it.set] + ' SET' : ''), BK.pane + 64, y, it.rare === 2 ? 'P' : it.rare ? 'c' : 'l', 1, 1); y += 12;
  if (has) {
    const combos = SYNERGIES.filter(s => s.need.includes(id));
    if (combos.length) { text('COMBOS', BK.pane + 64, y, 'c', 1, 1); y += 10; }
    for (const s of combos) { text(Save.syn.includes(s.id) ? s.name : '???', BK.pane + 64, y, Save.syn.includes(s.id) ? 'h' : 'l', 1, 1); y += 10; }
  }
}
function drawBookFoes() {
  BEASTS.forEach((b, i) => {
    const [x, y, w, h] = bookCell(i), n = beastN(b);
    rect(x, y, w, h, '0'); rect(x + 1, y + 1, w - 2, h - 2, n ? '2' : '1');
    if (n) { const sp = S(b.boss ? 'mm_boss' : b.spr); drawFeet(sp, x + w / 2, y + (b.boss ? 15 : h - 2)); }
    else text('?', x + w / 2, y + 12, 'l', 1, 1);
    if (i === G.menuSel) boxFrame(x, y, w, h, 'Y');
  });
  const met = BEASTS.filter(b => beastN(b) > 0).length;
  text(met + ' / ' + BEASTS.length + ' MET', BK.x + 87, 188, 'c', 1, 1);
  const b = BEASTS[G.menuSel];
  if (!b) return paneLines(['EVERY FOE YOU MEET GETS A PAGE'], 60, 'l');
  const n = beastN(b);
  if (!n) return paneLines(['NOT MET YET'], 70, 'l');
  const sp = S(b.spr);
  shadow(BK.pane + 64, 78, Math.min(30, sp.w));
  drawFeet(sp, BK.pane + 64, 79);
  let y = 84;
  text(foeName(b.t), BK.pane + 64, y, 'Y', 1, 1); y += 10;
  text((b.boss ? 'BEATEN ' : 'DEFEATED ') + n + (b.boss && cnt('nhb:' + b.t) ? '   NO HIT: YES' : ''), BK.pane + 64, y, 'c', 1, 1); y += 13;
  y = paneLines(b.lore.slice(0, loreN(b)), y, 'w');
  const nx = loreNext(b);
  if (nx) paneLines(['MORE AT ' + nx + (b.boss ? ' WINS' : ' DEFEATED')], y + 2, 'l');
}
function drawBookCombos() {
  SYNERGIES.forEach((s, i) => {
    const [x, y, w, h] = bookCell(i), got = Save.syn.includes(s.id);
    rect(x, y, w, h, '0'); rect(x + 1, y + 1, w - 2, h - 2, got ? '2' : '1');
    text(got ? s.name : '???', x + w / 2, y + 8, got ? (i === G.menuSel ? 'Y' : 'w') : 'l', 1, 1);
    if (i === G.menuSel) boxFrame(x, y, w, h, 'Y');
  });
  const s = SYNERGIES[G.menuSel];
  if (!s) { text(Save.syn.length + ' / ' + SYNERGIES.length + ' COMBOS FOUND', VW / 2, 176, 'c', 1, 1); return; }
  const got = Save.syn.includes(s.id);
  // an undiscovered combo gives away one half as a hint
  text(got ? synNeedText(s) : 'HINT: ' + (s.need[0].startsWith('w:') ? WANDS[s.need[0].slice(2)].name : ITEMS[s.need[0]].name) + ' + ???', VW / 2, 172, got ? 'c' : 'l', 1, 1);
  text(got ? s.desc : 'TAKE THE RIGHT PAIR IN ONE RUN', VW / 2, 183, got ? 'w' : 'l', 1, 1);
}
function runLine(r) {
  const where = r.mode === 'arena' ? 'WAVE ' + Math.max(1, r.wave) : r.won ? 'WIN' : 'LAND ' + (r.depth + 1);
  return where;
}
function drawBookRuns() {
  const H = Save.hist, top = G.bookTop || 0;
  if (!H.length) { text('NO RUNS YET', VW / 2, 100, 'l', 1, 1); return; }
  [['RESULT', 4], ['MODE', 70], ['TIME', 150], ['FOES', 190], ['ENDED BY', 232]].forEach(([t, x]) => text(t, BK.x + x, 44, '3', 1));
  for (let i = top; i < Math.min(H.length, top + 9); i++) {
    const r = H[i], [x, y, w] = bookCell(i), sel = i === G.menuSel;
    if (sel) rect(x, y - 1, w, 11, '2');
    text(runLine(r), x + 4, y + 1, r.won ? 'h' : sel ? 'Y' : 'w', 1);
    text((r.daily ? 'DAILY' : r.mode === 'arena' ? 'ARENA' : 'ADVENTURE') + (r.team > 1 ? ' X' + r.team : ''), x + 70, y + 1, 'c', 1);
    text(fmtTime(r.time || 0), x + 150, y + 1, 'w', 1);
    text(String(r.kills || 0), x + 190, y + 1, 'w', 1);
    text(r.won ? '-' : r.killer ? foeName(r.killer) : '?', x + 232, y + 1, 'l', 1);
  }
  const r = H[G.menuSel];
  if (!r) return;
  const items = (r.items || []).slice(0, 18), x0 = VW / 2 - (items.length * 17) / 2;
  items.forEach((id, i) => { if (ITEMS[id]) drawS(S('icon_' + id), x0 + i * 17, 168); });
  const d = new Date(r.t), when = pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()) + '. ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  text(when + '   ' + (WANDS[r.wand] ? WANDS[r.wand].name : '') + '   ' + (DIFFS[r.diff] ? DIFFS[r.diff].name : ''), VW / 2, 187, 'l', 1, 1);
}
function drawBookStats() {
  const st = Save.stats, rows = [
    ['RUNS', st.runs], ['WINS', st.wins], ['FOES DEFEATED', st.kills], ['BOSSES BEATEN', cnt('b')],
    ['BEST LAND', st.bestDepth || '-'], ['BEST ARENA WAVE', st.bestWave || '-'], ['FASTEST WIN', st.bestTime ? fmtTime(st.bestTime) : '-'], ['BEST COMBO', cnt('combo') || '-'],
    ['ROOMS CLEARED', cnt('rooms')], ['NO-HIT ROOMS', cnt('nohit')], ['CHESTS OPENED', cnt('chests')], ['GOLDEN SLIMES', cnt('gold')],
    ['STARFALLS', cnt('starfall')], ['BULLETS ROLLED THROUGH', cnt('graze')], ['ROLLS', cnt('rolls')], ['POTIONS', cnt('potion')],
    ['FRIENDS HELPED UP', cnt('revive')], ['QUESTS DONE', cnt('quests')], ['DAYS PLAYED', Save.days], ['VAULT', Save.vault],
  ];
  rows.forEach(([k, v], i) => {
    const x = i % 2 ? VW / 2 + 6 : 34, y = 48 + Math.floor(i / 2) * 13;
    text(k, x, y, 'l', 1); text(String(v), x + 150, y, 'w', 1, 2);
  });
}
