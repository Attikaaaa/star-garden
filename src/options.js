'use strict';
// Choices before a run and ways to play: wand aspects (unlocked by wand mastery), the Star
// Trials (twenty steps of extra challenge after the first win), Quick Run (one land), and
// the comfort options: assist mode, colour-blind bullet shapes, left-handed touch, keys.

// ---------- Wand aspects ----------
// Three ways to use every wand: the second opens after 300 defeated foes with that wand,
// the third after a win with it.
const ASPECTS = {
  wand: [{ name: 'CLASSIC', desc: 'TRUSTY AND BALANCED' }, { name: 'TWIN STAR', desc: 'TWO STARS AT ONCE, EACH A LITTLE WEAKER', apply: p => { p.shots += 1; p.dmg *= 0.7; } },
    { name: 'NORTH STAR', desc: 'PIERCING STARS THAT FLY FARTHER', apply: p => { p.pierce += 1; p.shotSpeed *= 1.2; p.range *= 1.2; } }],
  scatter: [{ name: 'CLASSIC', desc: 'A SPRAY OF SPARKS UP CLOSE' }, { name: 'WIDE FAN', desc: 'TWO MORE SPARKS, A LITTLE SHORTER', apply: p => { p.fanX = 2; p.range *= 0.85; } },
    { name: 'BUCKSHOT', desc: 'FEWER, HARDER SPARKS', apply: p => { p.fanX = -1; p.dmg *= 1.35; p.fireDelay *= 1.15; } }],
  bubble: [{ name: 'CLASSIC', desc: 'A STREAM OF SPEEDY BUBBLES' }, { name: 'FOAM', desc: 'BUBBLES BOUNCE OFF WALLS', apply: p => { p.bounce += 1; } },
    { name: 'PRESSURE', desc: 'SLOWER, HEAVIER BUBBLES', apply: p => { p.dmg *= 1.3; p.fireDelay *= 1.25; } }],
  boomer: [{ name: 'CLASSIC', desc: 'PIERCES ALL AND COMES BACK' }, { name: 'TWIN MOONS', desc: 'TWO BOOMERANGS, EACH A LITTLE WEAKER', apply: p => { p.shots += 1; p.dmg *= 0.75; } },
    { name: 'HEAVY MOON', desc: 'SLOWER, MUCH HARDER HITS', apply: p => { p.dmg *= 1.4; p.shotSpeed *= 0.85; } }],
  chain: [{ name: 'CLASSIC', desc: 'SHOTS ARC TO NEARBY ENEMIES' }, { name: 'STORM', desc: 'LIGHTNING JUMPS ONE MORE TIME', apply: p => { p.chain3 = true; } },
    { name: 'SPARK', desc: 'FASTER, LIGHTER BOLTS', apply: p => { p.fireDelay *= 0.8; p.dmg *= 0.85; } }],
  comet: [{ name: 'CLASSIC', desc: 'SLOW COMETS THAT EXPLODE' }, { name: 'METEOR SHOWER', desc: 'TWO COMETS AT ONCE, EACH WEAKER', apply: p => { p.shots += 1; p.dmg *= 0.7; } },
    { name: 'SUPERNOVA', desc: 'BIGGER BLASTS, SLOWER CASTING', apply: p => { p.bigBlast = true; p.fireDelay *= 1.2; } }],
};
const ASPECT_KILLS = 300;
function aspectReady(w, i) { return i === 0 || (i === 1 ? cnt('w:' + w) >= ASPECT_KILLS : cnt('winw:' + w) > 0); }
const aspectOf = (w) => { const i = Save.unl.aspects[w] || 0; return aspectReady(w, i) ? i : 0; };
function applyAspect(p, i) { const A = ASPECTS[p.wand] && ASPECTS[p.wand][i]; if (A && A.apply) A.apply(p); }
function aspectHow(w, i) { return i === 1 ? 'DEFEAT ' + ASPECT_KILLS + ' FOES WITH THIS WAND' : 'WIN A RUN WITH THIS WAND'; }
// Mastery milestones are announced when they happen.
onNote((ev) => {
  if ((ev !== 'kill' && ev !== 'win') || !G.player) return;
  const w = G.player.wand, k = 'asp:' + w;
  for (const i of [1, 2]) {
    if (!aspectReady(w, i) || Save.flags[k + i]) continue;
    Save.flags[k + i] = true;
    addBadge('wardrobe');
    G.bannerNext = { title: 'WAND MASTERY: ' + ASPECTS[w][i].name, sub: WANDS[w].name + ' HAS A NEW WAY TO FIGHT', t: 2.6, icon: null };
    logNews('unlock', 'ASPECT: ' + ASPECTS[w][i].name, 'wand_' + w);
  }
});

// ---------- Star Trials ----------
// Each trial adds one more twist on top of all the ones before, and pays 5% more vault.
Object.assign(MODS, {
  t_pace: { name: 'QUICKER FOES', desc: 'FOES MOVE A LITTLE FASTER', pace: 1.1, trial: true },
  t_elite: { name: 'MORE ELITES', desc: 'MORE GLOWING FOES', elite: 0.06, trial: true },
  t_count: { name: 'BIGGER CROWDS', desc: 'ONE MORE FOE IN EVERY ROOM', count: 1, trial: true },
  t_hp: { name: 'TOUGHER FOES', desc: 'FOES HAVE 15% MORE HEALTH', hp: 1.15, trial: true },
  t_price: { name: 'GREEDY FROG', desc: 'THE SHOP COSTS 50% MORE', trial: true },
  t_heal: { name: 'NO SPARE HEARTS', desc: 'NO HEART AFTER A BOSS', trial: true },
  t_boss: { name: 'MIGHTY BOSSES', desc: 'BOSSES HAVE 25% MORE HEALTH', trial: true },
  t_affix2: { name: 'DOUBLE TWIST', desc: 'ELITES HAVE TWO AFFIXES', trial: true },
  t_bullet: { name: 'FAST BULLETS', desc: 'ENEMY BULLETS ARE FASTER', bullet: 1.12, trial: true },
  t_count2: { name: 'EVEN MORE FOES', desc: 'ANOTHER FOE IN EVERY ROOM', count: 1, trial: true },
  t_skull: { name: 'SKULL LANDS', desc: 'MORE SKULL ROOMS', trial: true },
  t_fragile: { name: 'FRAGILE', desc: 'ONE HEART LESS', player: (p) => { p.maxHp = Math.max(2, p.maxHp - 2); p.hp = Math.min(p.hp, p.maxHp); }, trial: true },
  t_dusk: { name: 'DUSK', desc: 'THE CRYSTAL CAVE IS DARK', trial: true },
  t_count3: { name: 'SWARMS', desc: 'YET ANOTHER FOE IN EVERY ROOM', count: 1, trial: true },
  t_rage: { name: 'ANGRY BOSSES', desc: 'BOSSES START FURIOUS', trial: true },
  t_star: { name: 'DIM STARS', desc: 'STARFALL CHARGES HALF AS FAST', player: (p) => { p.chargeMul *= 0.5; }, trial: true },
});
const TRIALS = ['t_pace', 't_elite', 't_count', 't_hp', 't_price', 'echo', 't_heal', 't_boss', 't_affix2', 'glowing',
  't_bullet', 'windy', 't_count2', 'giants', 't_skull', 't_fragile', 't_dusk', 't_count3', 't_rage', 't_star'];
const TRIAL_TITLES = { 5: 'BRAVE', 10: 'BOLD', 15: 'FEARLESS', 20: 'STAR WIZARD' };
Object.assign(TITLES, { BRAVE: 'STAR TRIAL 5', BOLD: 'STAR TRIAL 10', FEARLESS: 'STAR TRIAL 15', 'STAR WIZARD': 'STAR TRIAL 20' });
const trialsOpen = () => Save.stats.wins > 0 || Save.trials.max > 0;
const trialMax = () => Math.max(1, Math.min(20, Save.trials.max || 1));
const trialMods = (n) => TRIALS.slice(0, n);
// A win on a trial opens the next one (and pays a title every five).
onNote((ev) => {
  if (ev !== 'win' || !G.trial) return;
  const n = G.trial, h = G.player ? G.player.hero || 'pip' : 'pip';
  Save.trials.best[h] = Math.max(Save.trials.best[h] || 0, n);
  if (n >= (Save.trials.max || 1)) Save.trials.max = Math.min(20, n + 1);
  const t = TRIAL_TITLES[n];
  if (t && !Save.unl.titles.includes(t)) { Save.unl.titles.push(t); addBadge('wardrobe'); G.bannerNext = { title: 'STAR TRIAL ' + n + ' BEATEN!', sub: 'A NEW TITLE: ' + t, t: 3, icon: null }; }
  Save.write();
});

// ---------- The pre-run screen ----------
function prepRows() {
  const out = ['hero', 'wand'];
  if (ASPECTS[Save.wand].some((a, i) => i && aspectReady(Save.wand, i))) out.push('aspect');
  out.push('robe', 'diff');
  if (trialsOpen()) out.push('trial');
  if (G.prep.mode === 'adv' && Save.stats.runs >= 2) out.push('length');
  return out.concat(['start', 'back']);
}
const PREP_TOP = 58, PREP_GAP = 13;
function prepAdjust(row, dir) {
  const ok = () => Audio_.sfx('select'), no = () => Audio_.sfx('deny');
  if (row === 'hero') { const list = HERO_IDS.filter(heroUnlocked); if (list.length > 1) { Save.hero = cycle(list, heroUnlocked(Save.hero) ? Save.hero : 'pip', dir); ok(); } else no(); }
  else if (row === 'wand') { const owned = WAND_IDS.filter(id => Save.wands.includes(id)); if (owned.length > 1) { Save.wand = cycle(owned, Save.wand, dir); ok(); } else no(); }
  else if (row === 'aspect') { const list = [0, 1, 2].filter(i => aspectReady(Save.wand, i)); Save.unl.aspects[Save.wand] = cycle(list, aspectOf(Save.wand), dir); ok(); }
  else if (row === 'robe') { const r = nextRobe(Save.skin, dir); if (r !== Save.skin) { Save.skin = r; ok(); } else no(); }
  else if (row === 'diff') {
    // locked difficulties are skipped (HARD opens with a win, STARBREAKER with a HARD win)
    let d = Save.settings.diff;
    for (let k = 0; k < DIFFS.length; k++) { d = (d + dir + DIFFS.length) % DIFFS.length; if (diffUnlocked(d)) break; }
    if (d !== Save.settings.diff) { Save.settings.diff = d; ok(); } else no();
  } else if (row === 'trial') { const m = trialMax(); G.prepTrial = ((G.prepTrial || 0) + dir + m + 1) % (m + 1); ok(); }
  else if (row === 'length') { G.prepQuick = !G.prepQuick; ok(); }
}
function updatePrep() {
  const rows = prepRows();
  if (G.menuSel >= rows.length) G.menuSel = rows.length - 1;
  menuNav(rows.length);
  let click = -1;
  rows.forEach((r, i) => { if (hoverRow(i, VW / 2 - 130, prepY(rows, i) - 3, 260, PREP_GAP)) click = i; });
  const row = rows[G.menuSel];
  const dir = pressed(...K_RIGHT) ? 1 : pressed(...K_LEFT) ? -1 : 0;
  if (dir && row !== 'start' && row !== 'back') prepAdjust(row, dir);
  if (click >= 0 && Input.mouseHit && rows[click] !== 'start' && rows[click] !== 'back') prepAdjust(row, Input.mx < VW / 2 + 40 ? -1 : 1);
  if (pressed(...K_BACK) || ((pressed(...K_OK) || (click >= 0 && Input.mouseHit)) && row === 'back')) { Save.write(); return 'back'; }
  if ((pressed(...K_OK) && row !== 'back') || (row === 'start' && click >= 0 && Input.mouseHit)) { G.diff = Save.settings.diff; Save.write(); return 'start'; }
  return null;
}
const prepY = (rows, i) => (i < rows.length - 2 ? PREP_TOP + i * PREP_GAP : 172 + (i - rows.length + 2) * 13);
function prepValue(row) {
  const H = HEROES[heroUnlocked(Save.hero) ? Save.hero : 'pip'], w = WANDS[Save.wand], d = DIFFS[Save.settings.diff];
  switch (row) {
    case 'hero': return [H.name + ', ' + H.title, H.desc];
    case 'wand': return [w.name, w.desc];
    case 'aspect': { const A = ASPECTS[Save.wand][aspectOf(Save.wand)]; return [A.name, A.desc]; }
    case 'robe': return [ROBES[Save.skin], robeList().length < ROBES.length ? 'MORE ROBES SHINE IN THE CONSTELLATIONS' : ''];
    case 'diff': return [d.name, d.desc + (d.vault !== 1 ? '  VAULT X' + d.vault : '') + (!diffUnlocked(2) ? '  (WIN TO UNLOCK HARD)' : !diffUnlocked(3) ? '  (WIN ON HARD FOR MORE)' : '')];
    case 'trial': { const n = G.prepTrial || 0; return [n ? 'STAR TRIAL ' + n : 'OFF', n ? 'NEW: ' + MODS[TRIALS[n - 1]].desc + '  VAULT +' + n * 5 + '%' : 'EVERY TRIAL ADDS A TWIST ON TOP OF THE LAST'] }
    case 'length': return [G.prepQuick ? 'QUICK RUN' : 'FULL RUN', G.prepQuick ? 'ONE LAND AND ITS BOSS: ABOUT FIVE MINUTES' : 'THREE LANDS, THREE BOSSES'];
  }
  return ['', ''];
}
const PREP_LABEL = { hero: 'HERO', wand: 'WAND', aspect: 'ASPECT', robe: 'ROBE', diff: 'DIFFICULTY', trial: 'TRIAL', length: 'LENGTH' };
function drawPrep() {
  drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 150, 26, 300, 176);
  text(G.prep.mode === 'arena' ? 'THE ARENA' : 'ADVENTURE', VW / 2, 33, 'Y', 2, 1);
  // the hero as they will set out
  const hid = heroUnlocked(Save.hero) ? Save.hero : 'pip';
  shadow(VW / 2 + 118, 52, 12);
  drawFeet(S(heroPre(hid) + 'd' + HERO_WALK[Math.floor(G.time / 0.14) % 4] + SKIN[Save.skin]), VW / 2 + 118, 53);
  drawS(S('wand_' + Save.wand), VW / 2 + 126, 38);
  const rows = prepRows(), sel = rows[G.menuSel];
  rows.forEach((r, i) => {
    if (r === 'start' || r === 'back') return;
    const y = prepY(rows, i), on = r === sel, [v] = prepValue(r);
    text(PREP_LABEL[r], VW / 2 - 138, y, on ? 'Y' : 'l', 1);
    text(v, VW / 2 + 30, y, on ? 'Y' : 'w', 1, 1);
    if (on) { const bob = Math.floor(G.time * 4) % 2, hw = textW(v) / 2; text('<', VW / 2 + 30 - hw - 9 - bob, y, 'Y', 1); text('>', VW / 2 + 30 + hw + 5 + bob, y, 'Y', 1); }
  });
  const [, desc] = sel && sel !== 'start' && sel !== 'back' ? prepValue(sel) : ['', G.prepQuick && G.prep.mode === 'adv' ? 'QUICK RUN: ONE LAND' : ''];
  if (desc) wrapText(desc, 280).slice(0, 2).forEach((l, i) => text(l, VW / 2, 150 + i * 9, 'c', 1, 1));
  const si = rows.indexOf('start');
  drawMenu(['START!', 'BACK'], 172, 13, G.menuSel - si);
  drawCouchJoin();
}

// ---------- Quick Run ----------
// One land (one you have reached) and its boss.
function quickLand() { return withSeed(newSeed(), () => grndi(0, Math.max(0, Math.min(LANDS.length, cnt('land') || 1) - 1))); }

// ---------- Assist mode, colour-blind shapes, left-handed touch ----------
const ASSIST_SPEED = 0.85;
const assistOn = () => !!Save.settings.assist && !NET.role;
// Colour-blind shapes: each bullet colour also gets its own shape.
const CB_SHAPE = { pink: 'dot', cyan: 'diamond', orange: 'square', purple: 'cross' };
function cbSprite(b) {
  if (!Save.settings.cb || !b.key) return b.spr;
  return S(b.key.replace(/^ebb?_/, (m) => (m === 'ebb_' ? 'ebbcb_' : 'ebcb_')));
}
const lefty = () => !!Save.settings.lefty;

// ---------- Keys ----------
const KEY_ACTS = [['up', 'UP', 'KeyW'], ['down', 'DOWN', 'KeyS'], ['left', 'LEFT', 'KeyA'], ['right', 'RIGHT', 'KeyD'],
  ['roll', 'ROLL', 'Space'], ['star', 'STARFALL', 'KeyQ'], ['potion', 'POTION', 'KeyR'], ['use', 'USE', 'KeyE']];
const keyOf = (act) => (Save.settings.keys && Save.settings.keys[act]) || KEY_ACTS.find(k => k[0] === act)[2];
const keyName = (code) => code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Arrow/, '').replace('ShiftLeft', 'SHIFT').replace('ControlLeft', 'CTRL').toUpperCase();
function updateKeys() {
  const n = KEY_ACTS.length + 2;
  if (G.keyWait) {
    // the next key pressed becomes the action's key
    const code = Object.keys(Input.hit).find(c => !c.startsWith('Pad') && !c.startsWith('Touch') && !c.startsWith('Mouse'));
    if (!code) return false;
    if (code !== 'Escape') {
      const K = Save.settings.keys = Object.assign({}, Save.settings.keys);
      // swap with an action that already had this key
      const other = KEY_ACTS.find(k => keyOf(k[0]) === code);
      if (other) K[other[0]] = keyOf(G.keyWait);
      K[G.keyWait] = code;
      Save.write();
      Audio_.sfx('confirm');
    }
    G.keyWait = null;
    return false;
  }
  menuNav(n);
  let click = -1;
  for (let i = 0; i < n; i++) if (hoverRow(i, VW / 2 - 100, 56 + i * 13 - 3, 200, 13)) click = i;
  const ok = pressed(...K_OK) || (click >= 0 && Input.mouseHit);
  if (pressed('Escape', 'PadB') || (ok && G.menuSel === n - 1)) return true;
  if (ok && G.menuSel === n - 2) { Save.settings.keys = null; Save.write(); Audio_.sfx('select'); toast('KEYS RESET'); }
  else if (ok) { G.keyWait = KEY_ACTS[G.menuSel][0]; Audio_.sfx('select'); }
  return false;
}
function drawKeys() {
  drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 110, 30, 220, 172);
  text('KEYS', VW / 2, 38, 'Y', 2, 1);
  KEY_ACTS.forEach(([act, label], i) => {
    const y = 56 + i * 13, sel = i === G.menuSel;
    if (sel) pointer(VW / 2 - 100, y);
    text(label, VW / 2 - 88, y, sel ? 'Y' : 'l', 1);
    const wait = G.keyWait === act;
    text(wait ? (Math.floor(G.time * 3) % 2 ? 'PRESS A KEY' : '') : keyName(keyOf(act)), VW / 2 + 90, y, wait ? 'Y' : 'w', 1, 2);
  });
  const n = KEY_ACTS.length;
  text('RESET', VW / 2, 56 + n * 13 + 4, G.menuSel === n ? 'Y' : 'l', 1, 1);
  text('BACK', VW / 2, 56 + (n + 1) * 13 + 4, G.menuSel === n + 1 ? 'Y' : 'l', 1, 1);
  text('ARROWS AND THE MOUSE ALWAYS AIM', VW / 2, 190, 'c', 1, 1);
}

// ---------- Arena save: a solo Arena run can be continued from its last break ----------
const ARENA_KEY = 'csk_arena';
function hasArena() { try { return !!localStorage.getItem(ARENA_KEY); } catch (e) { return false; } }
function clearArena() { try { localStorage.removeItem(ARENA_KEY); } catch (e) { /* no storage */ } }
function saveArena() {
  const p = G.player;
  if (NET.role || G.mode !== 'arena' || !p || p.dead || G.state === 'over') return;
  const player = {};
  for (const k in p) if (k !== 'orbitHit' && k !== 'in' && k !== 'meteorHit') player[k] = p[k];
  const A = Object.assign({}, G.arena);
  const data = { v: 1, tier: G.floor.depth, arena: A, player, coins: G.coins, stats: G.stats, run: G.run, diff: G.diff, mods: G.mods || [],
    props: G.room.props.filter(o => o.kind === 'ped'), pickups: G.room.pickups };
  try { localStorage.setItem(ARENA_KEY, JSON.stringify(data)); } catch (e) { /* no storage */ }
}
function loadArena() {
  let d;
  try { d = JSON.parse(localStorage.getItem(ARENA_KEY)); } catch (e) { d = null; }
  if (!d || d.v !== 1) { clearArena(); return false; }
  G.mode = 'arena'; G.daily = null; G.trial = 0;
  G.diff = d.diff || 1;
  G.run = d.run; setMods(d.mods);
  const p = Object.assign(newPlayer(0), d.player, { orbitHit: new Map(), in: newInput(), inv: 1, dashT: 0, cool: 0, hurtT: 0, remote: false, down: false, dead: false });
  G.players = [p]; G.player = p;
  G.coins = d.coins; G.stats = d.stats; G.won = false; G.record = false; G.bestBefore = Save.stats.bestWave;
  resetRunFx(); resetRunLog();
  G.arena = Object.assign(d.arena, { phase: 'break', t: ARENA_BREAK, hold: 0, savedW: d.arena.wave });
  arenaLand(d.tier);
  G.room.props.push(...d.props); G.room.pickups.push(...d.pickups);
  G.floorBanner = { t: 2.4, text: 'THE ARENA', small: 'CONTINUE: WAVE ' + (G.arena.wave + 1) };
  setState('play');
  return true;
}
