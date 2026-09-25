'use strict';
// The story between runs: Mister Ribbit has a word after every run (a line picked for what
// just happened, each said once, then general chatter), and the true ending that rolls
// once the Night Moth is beaten in the Star Well.

// ---------- Mister Ribbit's word after a run ----------
// when(run): does this line fit the run that just ended? Lines higher up win.
const FROG_LINES = [
  { id: 'first', when: (r) => Save.stats.runs === 1, text: 'EVERY WIZARD FALLS THE FIRST TIME. RIBBIT!' },
  { id: 'firstwin', when: (r) => r.won && Save.stats.wins === 1, text: 'YOU DID IT! THE MEADOW IS SINGING AGAIN!' },
  { id: 'king', when: (r) => r.killer === 'king', text: 'THE KING JUMPS HIGH. WATCH HIS SHADOW!' },
  { id: 'bcrab', when: (r) => r.killer === 'bcrab', text: 'THAT CRAB CHARGES STRAIGHT. STEP ASIDE!' },
  { id: 'golem', when: (r) => r.killer === 'golem', text: 'THE GOLEM IS SLOW. KEEP MOVING AND KEEP SHOOTING.' },
  { id: 'queen', when: (r) => r.killer === 'queen', text: 'THE QUEEN LEAVES HONEY WHERE SHE FLIES. STAY OUT OF IT.' },
  { id: 'mayor', when: (r) => r.killer === 'mayor', text: 'WHEN THE GROUND BULGES, MOVE. HE POPS UP RIGHT THERE.' },
  { id: 'octo', when: (r) => r.killer === 'octo', text: 'WHEN THE OCTOPUS SINKS, GET READY TO MOVE.' },
  { id: 'cmoth', when: (r) => r.killer === 'cmoth', text: 'THAT MOTH SHEDS DUST. SHOOT IT BETWEEN THE CLOUDS.' },
  { id: 'nmoth', when: (r) => r.killer === 'nmoth', text: 'SO CLOSE TO THE SKY... TRY AGAIN, LITTLE WIZARD.' },
  { id: 'slime', when: (r) => r.killer === 'slime', text: 'EVEN A SLIME CAN SURPRISE YOU. RIBBIT.' },
  { id: 'bee', when: (r) => r.killer === 'bee', text: 'BEES STOP BEFORE THEY DIVE. THAT IS YOUR MOMENT!' },
  { id: 'crab', when: (r) => r.killer === 'crab', text: 'A SHAKING CRAB IS ABOUT TO CHARGE.' },
  { id: 'mole', when: (r) => r.killer === 'mole', text: 'A MOVING MOUND IS A MOLE. STEP AWAY FROM IT!' },
  { id: 'roll', when: (r) => cnt('graze') === 0 && Save.stats.runs >= 3, text: 'TRY ROLLING RIGHT THROUGH A BULLET. IT TICKLES!' },
  { id: 'garden', when: (r) => Save.vault >= 60 && cnt('garden') < 3, text: 'YOUR VAULT IS HEAVY. VISIT THE GARDEN!' },
  { id: 'shore', when: (r) => r.depth >= 1 && !r.won && cnt('land') === 2, text: 'THE SHORE! I HAVE NOT SEEN THE SEA IN YEARS.' },
  { id: 'cave', when: (r) => r.depth >= 2 && !r.won && cnt('land') === 3, text: 'THE CAVE IS DARK, BUT THE CRYSTALS REMEMBER THE STARS.' },
  { id: 'arena', when: (r) => r.mode === 'arena' && r.wave >= 10, text: 'TEN WAVES! THE ARENA SLIME IS IMPRESSED.' },
  { id: 'stars4', when: () => Save.story.stars.length >= 4, text: 'FOUR BIG STARS HOME. THE SKY IS WAKING UP.' },
  { id: 'stars6', when: () => Save.story.stars.length === 6, text: 'SIX STARS... I THINK THE LAST ONE IS HIDDEN. LOOK FOR CRACKS.' },
  { id: 'well', when: () => cnt('well') > 0 && !cnt('ending'), text: 'THE STAR WELL! NOBODY HAS BEEN THERE IN A THOUSAND YEARS.' },
  { id: 'deaths10', when: () => cnt('deaths') === 10, text: 'TEN FALLS AND YOU ARE STILL HERE. THAT IS COURAGE.' },
  { id: 'coop', when: (r) => r.team > 1 && cnt('coop') === 1, text: 'FRIENDS MAKE EVERY GARDEN GROW FASTER.' },
];
const FROG_CHATTER = [
  'THE SLIMES HAVE BEEN QUIETER SINCE YOU CAME.', 'I FOUND A SHINY BEETLE TODAY. RIBBIT.', 'DID YOU WATER THE STAR SEEDS?',
  'THE BEES SAY HELLO. THEY SAY IT ANGRILY, BUT STILL.', 'ONE MORE RUN? I WILL KEEP THE TEA WARM.', 'EVERY COIN IN THE VAULT IS A LITTLE STARLIGHT.',
  'I USED TO BE A WIZARD TOO, YOU KNOW. A VERY SMALL ONE.', 'THE MOON LOOKS BRIGHTER TONIGHT.', 'KEEP YOUR HAT ON. IT IS WINDY OUT THERE.',
  'RIBBIT. THAT IS ALL. RIBBIT.',
];
function frogLine(run) {
  const said = Save.story.lines;
  for (const L of FROG_LINES) if (!said[L.id] && L.when(run)) { said[L.id] = 1; Save.write(); return L.text; }
  return FROG_CHATTER[(Save.stats.runs * 7 + Save.days) % FROG_CHATTER.length];
}
onNote((ev, a) => {
  if (ev !== 'end') return;
  G.frogLine = NET.role === 'client' ? '' : frogLine(Object.assign({ killer: G.player && G.player.lastHit || '' }, a));
});

// ---------- The Star Well and the true ending ----------
function enterWell() {
  G.run.well = true;
  note('well');
  G.nextLock = true;
  wipe(() => {
    G.nextLock = false;
    loadFloor(LANDS.length);
    G.floorBanner = { t: 3.4, text: 'THE STAR WELL', small: 'THE SEVEN STARS OPEN THE WAY' };
  });
}
const ENDING = [
  ['THE NIGHT MOTH FALLS.', 'Y'], ['', 'w'],
  ['ALL THE STARLIGHT IT SWALLOWED', 'w'], ['POURS BACK INTO THE WELL,', 'w'], ['AND UP, AND UP, INTO THE SKY.', 'w'], ['', 'w'],
  ['OVER THE GARDEN, ONE BY ONE,', 'c'], ['THE CONSTELLATIONS LIGHT UP AGAIN.', 'c'], ['', 'w'],
  ['MISTER RIBBIT CRIES A LITTLE.', 'w'], ['HE SAYS IT IS JUST THE WIND.', 'w'], ['', 'w'],
  ['THE STAR GARDEN SHINES AGAIN.', 'Y'], ['', 'w'], ['', 'w'],
  ['STAR GARDEN', 'P'], ['', 'w'], ['MADE WITH LOVE, PIXEL BY PIXEL', 'l'], ['', 'w'],
  ['THANK YOU FOR PLAYING!', 'Y'], ['', 'w'], ['THE LANDS ARE STILL OUT THERE,', 'l'], ['AND SO ARE THE SLIMES.', 'l'],
];
function startEnding() {
  G.won = true;
  Audio_.stop(); Audio_.sfx('win');
  const first = !cnt('ending');
  note('ending');
  Save.story.ending = true;
  if (first) for (const t of ['STARKEEPER']) if (!Save.unl.titles.includes(t)) Save.unl.titles.push(t);
  Save.write();
  G.endT = 0;
  wipe(() => setState('ending'));
}
function updateEnding(dt) {
  G.endT += dt;
  if (G.endT > 3 && (pressed(...K_OK, ...K_BACK) || Input.mouseHit || G.endT > 32)) {
    noteCoins();
    note('end', runSummary(true));
    wipe(() => setState('win'));
  }
}
function drawEnding() {
  drawSkyBg();
  // the constellations light up one by one
  const lit = Math.min(CONSTELLATIONS.length, Math.floor(G.endT * 1.2));
  CONSTELLATIONS.forEach((c, i) => {
    const x = 16 + (i % 5) * 72, y = 8 + Math.floor(i / 5) * 40;
    for (const [a, b] of c.edges) { const A = c.pts[a], B = c.pts[b]; pxLine(x + A[0], y + A[1], x + B[0], y + B[1], i < lit ? 'y' : '1'); }
    if (i < lit) c.pts.forEach(([px, py], k) => drawS(S(Math.floor(G.time * 2 + k) % 5 ? 'sparkle_0' : 'sparkle_1'), x + px - 1, y + py - 1));
  });
  dim(0.35);
  const y0 = Math.round(VH + 10 - G.endT * 14);
  ENDING.forEach(([t, c], i) => { const y = y0 + i * 12; if (t && y > -10 && y < VH + 10) text(t, VW / 2, y, c, 2, 1); });
  if (G.endT > 3) { rect(-SCR.ox, VH - 16, SCR.w, 16 + SCR.oy, '0'); text(Input.lastAim === 'pad' ? 'A: CONTINUE' : 'PRESS TO CONTINUE', VW / 2, VH - 11, 'l', 2, 1); }
}
