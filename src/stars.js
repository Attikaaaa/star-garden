'use strict';
// Constellations: the achievements. Every star is a goal (+5 vault coins); a finished
// constellation lights up for good and gives a lasting reward (a robe, a trail, a pet, a
// title or a hero). Progress comes from the lifetime counters in progress.js.

// Special progress values that are not a single counter.
const SV = {
  wands: () => Save.wands.length,
  found: () => Save.found.length,
  syn: () => Save.syn.length,
  learned: () => cnt('learned'),
  winw: () => Object.keys(Save.cnt).filter(k => k.startsWith('winw:')).length,
  wandk: () => Math.max(0, ...Object.keys(Save.cnt).filter(k => k.startsWith('w:')).map(k => Save.cnt[k])),
  upmax: () => UPGRADES.filter(u => upLevel(u.id) >= u.cost.length).length,
  vault: () => Math.max(cnt('vaultmax'), Save.vault),
  wins: () => Save.stats.wins,
  wave: () => Math.max(cnt('wave'), Save.stats.bestWave),
  land: () => Math.max(cnt('land'), Save.stats.bestDepth),
  streak: () => cnt('streak'),
  stars: () => (Save.story.stars || []).length,
};
// A star: [id, text, source, goal]. source: a counter key, or '=name' for SV[name].
const CONSTELLATIONS = [
  { id: 'crown', name: 'THE SLIME CROWN', rew: { robe: 2 }, pts: [[6, 24], [10, 8], [22, 18], [34, 8], [46, 18], [50, 24]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
    stars: [['king1', 'DEFEAT THE SLIME KING', 'b:king', 1], ['king5', 'DEFEAT THE SLIME KING 5 TIMES', 'b:king', 5], ['kingnh', 'BEAT THE SLIME KING WITHOUT A HIT', 'nhb:king', 1],
      ['kingf', 'BEAT THE SLIME KING IN 45 SECONDS', 'fb:king', 1], ['slime200', 'DEFEAT 200 SLIMES', 'k:slime', 200], ['gold5', 'CATCH 5 GOLDEN SLIMES', 'gold', 5]] },
  { id: 'claw', name: 'THE GREAT CLAW', rew: { robe: 6 }, pts: [[8, 22], [14, 10], [24, 6], [28, 16], [40, 14], [48, 22]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
    stars: [['crab1', 'DEFEAT THE GIANT CRAB', 'b:bcrab', 1], ['crab5', 'DEFEAT THE GIANT CRAB 5 TIMES', 'b:bcrab', 5], ['crabnh', 'BEAT THE GIANT CRAB WITHOUT A HIT', 'nhb:bcrab', 1],
      ['crabf', 'BEAT THE GIANT CRAB IN 45 SECONDS', 'fb:bcrab', 1], ['crab100', 'DEFEAT 100 CRABS', 'k:crab', 100], ['jelly100', 'DEFEAT 100 JELLYFISH', 'k:jelly', 100]] },
  { id: 'gem', name: 'THE CRYSTAL HEART', rew: { robe: 7 }, pts: [[28, 2], [14, 12], [42, 12], [20, 26], [36, 26], [28, 16]], edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]],
    stars: [['golem1', 'DEFEAT THE CRYSTAL GOLEM', 'b:golem', 1], ['golem5', 'DEFEAT THE CRYSTAL GOLEM 5 TIMES', 'b:golem', 5], ['golemnh', 'BEAT THE GOLEM WITHOUT A HIT', 'nhb:golem', 1],
      ['golemf', 'BEAT THE GOLEM IN 45 SECONDS', 'fb:golem', 1], ['bat100', 'DEFEAT 100 BATS', 'k:bat', 100], ['wisp100', 'DEFEAT 100 WISPS', 'k:wisp', 100]] },
  { id: 'road', name: 'THE WANDERER', rew: { robe: 4 }, pts: [[4, 24], [14, 18], [22, 22], [32, 12], [42, 16], [52, 4]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
    stars: [['land2', 'REACH SUNNY SHORE', '=land', 2], ['land3', 'REACH CRYSTAL CAVE', '=land', 3], ['land4', 'REACH LAND 4 IN ENDLESS MODE', '=land', 4],
      ['land6', 'REACH LAND 6', '=land', 6], ['rooms100', 'CLEAR 100 ROOMS', 'rooms', 100], ['chests25', 'OPEN 25 CHESTS', 'chests', 25]] },
  { id: 'champ', name: 'THE CHAMPION', rew: { robe: 5 }, pts: [[12, 4], [44, 4], [18, 16], [38, 16], [28, 22], [28, 28]], edges: [[0, 2], [1, 3], [2, 4], [3, 4], [4, 5], [0, 1]],
    stars: [['win1', 'WIN A RUN', '=wins', 1], ['win5', 'WIN 5 RUNS', '=wins', 5], ['winhard', 'WIN ON HARD', 'win:2', 1],
      ['winsb', 'WIN ON STARBREAKER', 'win:3', 1], ['win15', 'WIN IN UNDER 15 MINUTES', 'win15', 1], ['win10', 'WIN IN UNDER 10 MINUTES', 'win10', 1]] },
  { id: 'wands', name: 'THE WAND MAKER', rew: { trail: 'spark' }, pts: [[6, 26], [16, 20], [26, 14], [36, 8], [46, 4], [50, 12]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 3]],
    stars: [['wand2', 'UNLOCK A SECOND WAND', '=wands', 2], ['wand4', 'UNLOCK FOUR WANDS', '=wands', 4], ['wand6', 'UNLOCK ALL SIX WANDS', '=wands', 6],
      ['winw2', 'WIN WITH 2 DIFFERENT WANDS', '=winw', 2], ['winw4', 'WIN WITH 4 DIFFERENT WANDS', '=winw', 4], ['wandk', 'DEFEAT 1000 FOES WITH ONE WAND', '=wandk', 1000]] },
  { id: 'magic', name: 'THE COLLECTOR', rew: { pet: 'bun' }, pts: [[8, 6], [28, 10], [48, 6], [8, 24], [28, 26], [48, 24]], edges: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5]],
    stars: [['found10', 'FIND 10 MAGIC ITEMS', '=found', 10], ['found20', 'FIND 20 MAGIC ITEMS', '=found', 20], ['found35', 'FIND 35 MAGIC ITEMS', '=found', 35],
      ['syn5', 'DISCOVER 5 COMBOS', '=syn', 5], ['syn15', 'DISCOVER 15 COMBOS', '=syn', 15], ['learn10', 'LEARN 10 STAR SCROLLS', '=learned', 10]] },
  { id: 'arena', name: 'THE ARENA', rew: { robe: 3 }, pts: [[28, 2], [46, 10], [46, 22], [28, 28], [10, 22], [10, 10]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
    stars: [['wave5', 'REACH ARENA WAVE 5', '=wave', 5], ['wave10', 'REACH ARENA WAVE 10', '=wave', 10], ['wave20', 'REACH ARENA WAVE 20', '=wave', 20],
      ['wave30', 'REACH ARENA WAVE 30', '=wave', 30], ['ka500', 'DEFEAT 500 FOES IN THE ARENA', 'ka', 500], ['ka2000', 'DEFEAT 2000 FOES IN THE ARENA', 'ka', 2000]] },
  { id: 'storm', name: 'THE STORM', rew: { trail: 'comet' }, pts: [[38, 2], [24, 12], [34, 14], [18, 27], [48, 20], [8, 8]], edges: [[0, 1], [1, 2], [2, 3]],
    stars: [['combo10', 'REACH A COMBO OF 10', 'combo', 10], ['combo20', 'REACH A COMBO OF 20', 'combo', 20], ['nohit50', 'CLEAR 50 ROOMS WITHOUT A HIT', 'nohit', 50],
      ['graze100', 'ROLL THROUGH 100 BULLETS', 'graze', 100], ['sf50', 'CAST STARFALL 50 TIMES', 'starfall', 50], ['sfk8', 'DEFEAT 8 FOES WITH ONE STARFALL', 'sfkills', 8]] },
  { id: 'friends', name: 'THE FRIENDS', rew: { pet: 'bee' }, pts: [[10, 6], [10, 18], [4, 26], [46, 6], [46, 18], [52, 26]], edges: [[0, 1], [1, 2], [3, 4], [4, 5], [1, 4]],
    stars: [['coop1', 'PLAY A CO-OP RUN', 'coop', 1], ['coopwin', 'WIN A CO-OP RUN', 'coopwin', 1], ['coopb', 'DEFEAT A BOSS IN CO-OP', 'coopb', 1],
      ['revive10', 'HELP 10 FRIENDS BACK UP', 'revive', 10], ['coop4', 'PLAY WITH FOUR HEROES', 'coop4', 1], ['couch', 'PLAY CO-OP ON ONE SCREEN', 'couch', 1]] },
  { id: 'garden', name: 'THE GARDENER', rew: { title: 'GARDENER' }, pts: [[28, 14], [28, 3], [39, 11], [35, 25], [21, 25], [17, 11]], edges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
    stars: [['up1', 'BUY A GARDEN UPGRADE', 'garden', 1], ['upmax', 'MAX OUT ONE UPGRADE', '=upmax', 1], ['upall', 'MAX OUT EVERY UPGRADE', '=upmax', 9],
      ['seeds10', 'HARVEST 10 STAR SEEDS', 'harvest', 10], ['spend1k', 'SPEND 1000 VAULT COINS', 'vspent', 1000], ['vault500', 'HOLD 500 VAULT COINS AT ONCE', '=vault', 500]] },
  { id: 'daily', name: 'THE STAR OF THE DAY', rew: { trail: 'rainbow' }, pts: [[28, 14], [28, 2], [42, 8], [42, 22], [14, 22], [14, 8]], edges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
    stars: [['daily1', 'PLAY A DAILY STAR RUN', 'daily', 1], ['daily7', 'PLAY 7 DAILY STAR RUNS', 'daily', 7], ['daily30', 'PLAY 30 DAILY STAR RUNS', 'daily', 30],
      ['streak3', 'A 3-DAY DAILY STREAK', '=streak', 3], ['streak7', 'A 7-DAY DAILY STREAK', '=streak', 7], ['weekly1', 'FINISH A WEEKLY CHALLENGE', 'weekly', 1]] },
  { id: 'frog', name: "THE FROG'S FRIEND", rew: { hero: 'bramble' }, pts: [[14, 6], [42, 6], [8, 16], [48, 16], [20, 26], [36, 26]], edges: [[0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [0, 1]],
    stars: [['buy10', 'BUY 10 THINGS FROM THE FROG', 'buy', 10], ['spent200', 'SPEND 200 COINS AT THE SHOP', 'spent', 200], ['spent500', 'SPEND 500 COINS AT THE SHOP', 'spent', 500],
      ['spent1k', 'SPEND 1000 COINS AT THE SHOP', 'spent', 1000], ['potion25', 'DRINK 25 POTIONS', 'potion', 25], ['turret10', 'PLACE 10 STAR TURRETS', 'p:turret', 10]] },
  { id: 'sky', name: 'THE NIGHT SKY', rew: { title: 'STARKEEPER' }, pts: [[28, 14], [12, 4], [6, 20], [44, 4], [50, 20], [28, 28]], edges: [[0, 1], [1, 2], [2, 0], [0, 3], [3, 4], [4, 0], [0, 5]],
    stars: [['big1', 'RETURN A BIG STAR TO THE SKY', '=stars', 1], ['big4', 'RETURN 4 BIG STARS', '=stars', 4], ['big7', 'RETURN ALL 7 BIG STARS', '=stars', 7],
      ['well', 'REACH THE STAR WELL', 'well', 1], ['moth', 'DEFEAT THE NIGHT MOTH', 'b:nmoth', 1], ['ending', 'SEE THE TRUE ENDING', 'ending', 1]] },
  { id: 'odd', name: 'THE ODDITIES', rew: { pet: 'slime' }, pts: [[18, 6], [28, 2], [38, 8], [30, 16], [28, 22], [28, 28]], edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
    stars: [['rolls', 'ROLL 1000 TIMES', 'rolls', 1000], ['brk100', 'BREAK 100 THINGS', 'brk', 100], ['hearts50', 'PICK UP 50 HEARTS', 'hearts', 50],
      ['deaths10', 'FALL 10 TIMES AND KEEP GOING', 'deaths', 10], ['goldx5', 'LET 5 GOLDEN SLIMES GET AWAY', 'goldx', 5], ['elite10', 'DEFEAT 10 ELITES IN ONE RUN', 'elitesrun', 10]] },
];
const STAR_TOTAL = CONSTELLATIONS.reduce((n, c) => n + c.stars.length, 0);
const STAR_REWARD = 5;
function starProg(s) {
  const src = s[2], v = src[0] === '=' ? SV[src.slice(1)]() : cnt(src);
  return [Math.min(v, s[3]), s[3]];
}
const starDone = (s) => !!Save.ach[s[0]];
const constDone = (c) => c.stars.every(starDone);
function rewardText(r) {
  if (r.robe !== undefined) return ROBES[r.robe] + ' ROBE';
  if (r.trail) return 'A ' + r.trail.toUpperCase() + ' TRAIL';
  if (r.pet) return 'A PET ' + (PET_NAMES[r.pet] || r.pet.toUpperCase());
  if (r.title) return 'THE TITLE ' + r.title;
  if (r.hero) return (HERO_NAMES[r.hero] || r.hero.toUpperCase()) + ', A NEW HERO';
  return '';
}
const PET_NAMES = { bun: 'BUNNY', bee: 'BEE', slime: 'SLIME' };
const HERO_NAMES = { pip: 'PIP', luma: 'LUMA', coral: 'CORAL', bramble: 'BRAMBLE' };
function grantReward(r) {
  const U = Save.unl;
  if (r.robe !== undefined && !U.robes.includes(r.robe)) U.robes.push(r.robe);
  if (r.trail && !U.trails.includes(r.trail)) U.trails.push(r.trail);
  if (r.pet && !U.pets.includes(r.pet)) U.pets.push(r.pet);
  if (r.title && !U.titles.includes(r.title)) U.titles.push(r.title);
  if (r.hero && !U.heroes.includes(r.hero)) U.heroes.push(r.hero);
  addBadge('wardrobe');
}
// Check every unfinished star; new ones pay out and are announced.
function checkStars(quiet) {
  let got = 0;
  for (const c of CONSTELLATIONS) {
    const was = constDone(c);
    for (const s of c.stars) {
      if (starDone(s)) continue;
      const [v, n] = starProg(s);
      if (v < n) continue;
      Save.ach[s[0]] = 1;
      Save.vault += STAR_REWARD;
      got++;
      logNews('star', 'STAR: ' + s[1], 'mm_item');
      track('star', { id: s[0] });
      if (!quiet) toast('STAR: ' + s[1] + '  +' + STAR_REWARD);
    }
    if (!was && constDone(c)) {
      grantReward(c.rew);
      logNews('const', c.name + ': ' + rewardText(c.rew), 'mm_item');
      if (!quiet) G.banner = { title: c.name + ' SHINES!', sub: 'REWARD: ' + rewardText(c.rew), t: 3, icon: null };
      track('constellation', { id: c.id });
    }
  }
  if (got) {
    if (!quiet) Audio_.sfx('star');
    addBadge('menu:stars');
    checkMenus();
    Save.write();
  }
  return got;
}
// Checked at natural pauses (a room cleared, a run over) and when unlocks happen.
onNote((ev) => { if (ev === 'room' || ev === 'end' || ev === 'boss' || ev === 'wave' || ev === 'garden' || ev === 'wand' || ev === 'item' || ev === 'daily' || ev === 'learn' || ev === 'harvest') checkStars(false); });

// ---------- Screen: the night sky ----------
const SKY_X = 22, SKY_Y = 44, SKY_W = 68, SKY_H = 42;
function updateStars() {
  const n = CONSTELLATIONS.length;
  if (G.starOpen !== null && G.starOpen !== undefined) {
    if (pressed(...K_BACK, ...K_OK) || Input.mouseHit) { G.starOpen = null; Audio_.sfx('select'); }
    return false;
  }
  let s = G.menuSel;
  if (s < n) {
    if (pressed(...K_RIGHT) && s % 5 < 4) s++;
    if (pressed(...K_LEFT) && s % 5 > 0) s--;
    if (pressed(...K_UP) && s >= 5) s -= 5;
  }
  if (pressed(...K_DOWN)) s = s + 5 < n ? s + 5 : n;
  if (s === n && pressed(...K_UP)) s = n - 3;
  if (s !== G.menuSel) { G.menuSel = s; Audio_.sfx('select'); }
  let click = -1;
  for (let i = 0; i < n; i++) if (hoverRow(i, SKY_X + (i % 5) * SKY_W, SKY_Y + Math.floor(i / 5) * SKY_H, SKY_W, SKY_H)) click = i;
  if (hoverRow(n, VW / 2 - 30, 197, 60, 13) && Input.mouseHit) return true;
  if (pressed(...K_BACK) || (pressed(...K_OK) && G.menuSel === n)) return true;
  if ((pressed(...K_OK) && G.menuSel < n) || (click >= 0 && Input.mouseHit)) { G.starOpen = G.menuSel; Audio_.sfx('confirm'); }
  return false;
}
function drawSkyBg() {
  fillScreen(PAL['0']);
  for (let i = 0; i < 90; i++) {
    const x = hash(i, 3, 11) % SCR.w - SCR.ox, y = hash(i, 5, 13) % SCR.h - SCR.oy, tw = (G.time * 0.8 + (i % 7) / 7) % 1;
    rect(x, y, 1, 1, tw < 0.1 ? 'w' : i % 3 ? '1' : '2');
  }
}
function drawConst(c, x0, y0, sel, big) {
  const done = constDone(c), k = big || 1;
  for (const [a, b] of c.edges) {
    const A = c.pts[a], B = c.pts[b], lit = starDone(c.stars[a] || c.stars[0]) && starDone(c.stars[b] || c.stars[0]);
    pxLine(x0 + A[0] * k, y0 + A[1] * k, x0 + B[0] * k, y0 + B[1] * k, done ? 'y' : lit ? '3' : '1');
  }
  c.pts.forEach(([x, y], i) => {
    const s = c.stars[i], on = s && starDone(s), px = x0 + x * k, py = y0 + y * k;
    if (on) drawS(S(Math.floor(G.time * 2 + i) % 5 ? 'sparkle_0' : 'sparkle_1'), px - 1, py - 1);
    else rect(px, py, 1, 1, sel ? '4' : '3');
  });
}
function drawStars() {
  drawSkyBg();
  const got = Object.keys(Save.ach).length;
  text('CONSTELLATIONS', VW / 2, 16, 'Y', 2, 1);
  text(got + ' / ' + STAR_TOTAL + ' STARS', VW / 2, 28, 'c', 2, 1);
  CONSTELLATIONS.forEach((c, i) => {
    const x = SKY_X + (i % 5) * SKY_W, y = SKY_Y + Math.floor(i / 5) * SKY_H, sel = i === G.menuSel;
    if (sel) { rect(x + 1, y + 1, SKY_W - 2, 1, 'Y'); rect(x + 1, y + SKY_H - 2, SKY_W - 2, 1, 'Y'); rect(x + 1, y + 1, 1, SKY_H - 2, 'Y'); rect(x + SKY_W - 2, y + 1, 1, SKY_H - 2, 'Y'); }
    drawConst(c, x + 6, y + 7, sel);
  });
  const c = CONSTELLATIONS[G.menuSel];
  if (c) {
    const n = c.stars.filter(starDone).length;
    text(c.name + '   ' + n + '/' + c.stars.length, VW / 2, 176, constDone(c) ? 'Y' : 'w', 2, 1);
    text((constDone(c) ? 'EARNED: ' : 'REWARD: ') + rewardText(c.rew), VW / 2, 187, 'c', 2, 1);
  }
  const back = G.menuSel === CONSTELLATIONS.length;
  text('BACK', VW / 2, 202, back ? 'Y' : 'l', 2, 1);
  if (back) pointer(VW / 2 - textW('BACK') / 2 - 10, 202);
  if (G.starOpen !== null && G.starOpen !== undefined) drawConstDetail(CONSTELLATIONS[G.starOpen]);
}
function drawConstDetail(c) {
  dim(0.6);
  panel(VW / 2 - 150, 24, 300, 172);
  text(c.name, VW / 2, 31, constDone(c) ? 'Y' : 'w', 2, 1);
  drawConst(c, VW / 2 - 56, 42, true, 2);
  c.stars.forEach((s, i) => {
    const y = 106 + i * 11, [v, n] = starProg(s), done = starDone(s);
    if (done) drawS(S('sparkle_0'), VW / 2 - 140, y + 2);
    else rect(VW / 2 - 138, y + 3, 1, 1, '3');
    text(s[1], VW / 2 - 130, y, done ? 'Y' : 'w', 1);
    text(done ? 'DONE' : n > 1 ? v + '/' + n : '', VW / 2 + 140, y, done ? 'h' : 'l', 1, 2);
  });
  text((constDone(c) ? 'EARNED: ' : 'REWARD: ') + rewardText(c.rew) + '   EACH STAR: +' + STAR_REWARD + ' VAULT', VW / 2, 176, 'c', 1, 1);
}
