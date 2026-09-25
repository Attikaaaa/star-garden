'use strict';
// The first session: a short hands-on tutorial in the first room, a hand-picked first run,
// the frog's welcome gift (so the very first run always buys an upgrade), and the gentle
// nudges that keep a garden safe (install, persistent storage).

// ---------- Tutorial: three small tasks, then the doors open ----------
EDEF.dummy = {
  hp: 6, r: 7, h: 20, hw: 6, hh: 4, sw: 14, still: true, practice: true, passive: true,
  sprite: (e) => S(e.flash > 0 ? 'dummy_1' : 'dummy_0'), colors: ['N', 'R', 'w'],
};
AI.dummy = function () { /* stands and takes it */ };

const TUT_STEPS = ['move', 'shoot', 'roll'];
const tutNeeded = () => !Save.flags.tutorial && !NET.role && G.mode === 'adv' && !G.daily;
function startTutorial(room) {
  G.tut = { step: 0, t: 0, all: 0, grazed: 0, fire: 0, dummy: null, mark: [112, 150] };
  room.cleared = false;
  track('ftue', { step: 'tutorial_start' });
}
function finishTutorial(skipped) {
  const room = G.room;
  if (G.dummyE) G.dummyE.dead = true;
  G.tut = null;
  Save.flags.tutorial = true;
  Save.write();
  if (room && !room.cleared) { room.cleared = true; Audio_.sfx('door'); Audio_.sfx('clear'); }
  clearEBullets();
  // the land's name was held back while the tutorial ran
  G.floorBanner = { t: 2.8, text: THEMES[G.floor.theme].name, small: 'LAND 1' };
  toast(skipped ? 'TUTORIAL SKIPPED' : 'WELL DONE! THE DOORS ARE OPEN');
  track('ftue', { step: skipped ? 'tutorial_skip' : 'tutorial_done' });
}
function tutNext() {
  const T = G.tut;
  T.step++; T.t = 0;
  Audio_.sfx('ready');
  burst(G.player.x, G.player.y - 10, 12, ['Y', 'w', 'c'], 80, 0.5, { g: -40 });
  track('ftue', { step: 'tutorial_' + (TUT_STEPS[T.step - 1] || 'end') });
  if (T.step >= TUT_STEPS.length) finishTutorial(false);
}
function updateTutorial(dt) {
  const T = G.tut, p = G.player;
  if (!T || !p || !alive(p)) return;
  T.t += dt; T.all += dt;
  const step = TUT_STEPS[T.step];
  if (step === 'move') {
    if (Math.hypot(p.x - T.mark[0], p.y - T.mark[1]) < 14) tutNext();
  } else if (step === 'shoot') {
    if (!T.dummy) {
      // close enough to hit from where the hero stands
      const x = p.x < 192 ? Math.min(330, p.x + 96) : Math.max(54, p.x - 96), y = Math.max(78, Math.min(176, p.y - 20));
      T.dummy = spawnEnemy('dummy', x, y, { instant: true });
      G.dummyE = T.dummy;
      poof(x, y - 8); Audio_.sfx('tele');
    }
    if (T.dummy.dead) tutNext();
  } else if (step === 'roll') {
    // a slow stream of harmless stars from the left wall, level with the hero
    if ((T.fire -= dt) <= 0) {
      T.fire = 0.55;
      const b = ebullet(24, p.y - 7 + rnd(-3, 3), 0, 46, 'cyan');
      b.soft = true; b.life = 9;
    }
    if (T.grazed > 0 || T.t > 22) { if (!T.grazed) toast('GOOD ENOUGH!'); tutNext(); }
  }
}
// The star to walk to (drawn in the room, under everyone).
function drawTutorialMark(ox, oy) {
  const T = G.tut;
  if (!T || TUT_STEPS[T.step] !== 'move') return;
  const [mx, my] = T.mark, k = Math.floor(G.time * 6) % 2;
  ctx.drawImage(ringSprite(10, k ? 'Y' : 'w'), Math.round(ox + mx - 10), Math.round(oy + my - 6));
  shadow(ox + mx, oy + my, 10);
  drawS(S('icon_big'), ox + mx - 8, oy + my - 20 - Math.round(Math.abs(Math.sin(G.time * 3)) * 3));
}
// The task prompt at the top of the screen (drawn with the HUD).
function drawTutorialPrompt() {
  const T = G.tut;
  if (!T) return;
  const how = Input.lastAim, step = TUT_STEPS[T.step];
  const keys = {
    move: how === 'pad' ? 'LEFT STICK' : how === 'touch' ? 'LEFT SIDE OF THE SCREEN' : 'W A S D',
    shoot: how === 'pad' ? 'RIGHT STICK' : how === 'touch' ? 'RIGHT SIDE OF THE SCREEN' : 'HOLD THE MOUSE OR THE ARROWS',
    roll: how === 'pad' ? 'A' : how === 'touch' ? 'THE BOOT BUTTON' : 'SPACE',
  };
  const title = step === 'move' ? 'WALK TO THE STAR' : step === 'shoot' ? 'SHOOT THE PRACTICE DUMMY' : 'ROLL THROUGH A SLOW STAR';
  const sub = (step === 'roll' ? 'ROLLING MAKES YOU SAFE: ' : '') + keys[step];
  const w = Math.max(textW(title) + 30, textW(sub)) + 20, x = Math.round((VW - w) / 2), y = 44;
  panel(x, y, w, 28);
  text((T.step + 1) + '/3  ' + title, VW / 2, y + 5, 'Y', 1, 1);
  text(sub, VW / 2, y + 16, 'w', 1, 1);
  if (T.all > 8) text(how === 'pad' ? 'START: SKIP' : how === 'touch' ? 'PAUSE: SKIP' : 'ESC: SKIP', VW / 2, 196, 'l', 2, 1);
}

// ---------- A hand-picked first run ----------
// The first treasure room shows off items you can see working; one golden slime appears;
// the first two tries at each boss are a little gentler.
const FIRST_PICKS = ['triple', 'moon', 'firework', 'homing', 'big', 'bounce'];
function firstRunItems(n) {
  const ok = FIRST_PICKS.filter(id => Save.unl.items.includes(id));
  return ok.length >= n ? ok.slice(0, n) : itemPool(n);
}
function gentleBoss(e) {
  const tries = bump('bt:' + e.type);
  if (tries > 2 || cnt('b:' + e.type) > 0) return;
  e.gentle = true;
  e.hp *= 0.85; e.maxHp *= 0.85;
}

// ---------- The frog's welcome gift and the guided first purchase ----------
function cheapestUpgrade() {
  let best = null;
  for (const u of UPGRADES) { const lv = upLevel(u.id); if (lv < u.cost.length && (!best || u.cost[lv] < best.cost)) best = { id: u.id, cost: u.cost[lv] }; }
  return best;
}
onNote((ev) => {
  if (ev !== 'end') return;
  if (!Save.flags.gift) {
    Save.flags.gift = true;
    const c = cheapestUpgrade(), need = c ? c.cost - Save.vault : 0;
    if (need > 0) { Save.vault += need; G.gift = need; }
    Save.flags.guide = true;
  }
  // after the first boss: offer to install (home-screen apps keep their data on iPhone too)
  if (cnt('b') > 0 && !isInstalled() && !Save.flags.installNo && (Save.flags.installN || 0) < 3) Save.flags.installAsk = true;
  if (Save.stats.runs >= 2) requestPersist(false);
  Save.write();
});

// ---------- Opening the Garden ----------
// The first visit: the frog asks the wizard's name. After the first run the cheapest
// upgrade is picked out for the player (G.kertGuide).
function openGarden() {
  G.gTab = 0;
  clearBadge('menu:garden');
  const go = () => {
    // right after the first run: straight to the upgrade the frog's gift can buy
    const c = Save.flags.guide ? cheapestUpgrade() : null;
    const i = c ? UPGRADES.findIndex(u => u.id === c.id) : -1;
    if (i >= 0 && Save.vault >= c.cost) { openHubCard('up'); G.menuSel = i; G.kertGuide = true; }
    else enterYard();
  };
  if (!Save.flags.named && !NET.role) {
    Save.flags.named = true; Save.write();
    openEntry({
      title: 'THE FROG ASKS YOUR NAME', hint: 'RIBBIT! WHAT SHALL I CALL YOU?', abc: NAME_ABC, min: 1, max: 8, value: Save.name, ok: 'THAT IS ME',
      done: (v) => { Save.name = v; Save.write(); go(); },
      back: go,
    });
    return;
  }
  go();
}
// When the vault can buy the first upgrade, the end screen starts on GARDEN.
function preselectGarden() {
  const g = Save.flags.guide && !NET.role ? nextGoal() : null;
  const i = endItems().indexOf('GARDEN');
  if (g && Save.vault >= g.cost && i >= 0) G.menuSel = i;
}
