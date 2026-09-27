# PIXELART.md — how the Star Garden sprites are made

Read AGENTS.md first (the pixel-art rules and the boss rules there are mandatory). This file
is the working method behind the bosses (Mole Mayor, Tide Turtle, Geode Spider and the
seven redrawn older bosses): follow it step by step and the new art will match.

## 0. How to work (read this first)

Quality comes from the process, not from talent: every step below exists because
skipping it produced bad art. Do not skip or reorder steps.

1. Start from the template in section 8 (copy it, rename it). Never start from an empty file.
2. Change one thing at a time, then reload and look (section 5). Never write a whole boss
   blind.
3. Run `artCheck` (section 9) on every change. **FAIL = not done**, whatever you think of it.
4. A PASS is necessary, not sufficient. The checker cannot see ugliness: the template's
   first version passed with thin jagged horns and a green body invisible on the green
   meadow. Only looking finds that.
5. Finish with the review gate (section 10). You may not commit art that has not passed it.
6. Do not change `gfx.js`, `PAL`, `bossFrames`, `BOSS_EYE` or the existing bosses. If you
   think a tool is missing, stop and ask.

## 1. The core idea: art is code

There are no image files. Every sprite is a list of strings, one character per pixel:
`.` is transparent, every other character is a `PAL` key (`src/palette.js`). The strings
are built by small JavaScript functions at load time and baked into one atlas by `def()`.

You never draw pixel by pixel from scratch for big shapes. You **describe shapes**
(ellipses, rounded rects) and the tooling shades and outlines them; then you **stamp**
small hand-drawn details (eyes, crowns, cracks) on top. Hand-typed rows are only for
small things (≤ 16x16) or details.

## 2. The toolkit (`src/gfx.js`, `src/art_chars.js`)

| Tool | What it does |
|---|---|
| `sculpt(w, h, shapes)` | Shaded volumes. Each shape is `{ e: [cx, cy, rx, ry] }` (ellipse) or `{ r: [x, y, w, h, corner] }` (rounded rect) plus `ramp: 'dark base light highlight'` (4 PAL keys). Light is from the top left. Later shapes are in front; every shape gets a 1px `'0'` outline against emptiness and against shapes in front of it. Options: `hi: false` (no highlight), `cut: y` (clip rows below y), `noLine` (no outline against that shape). |
| `rim(rows, map)` | Hue-shifted edge light on the bottom right, just inside the outline. `map` recolours body keys, e.g. `{ 1: 'p', 2: 'p' }` puts magenta on the purple spider's right/bottom edge. Every boss uses it. |
| `stamp(rows, x, y, art)` | Paste hand-drawn detail at (x, y). `.` keeps the pixel below, `_` erases to transparent. Art can be a multi-line template string (indentation is ignored). |
| `grid(w, h)` | A tiny raster: `.px(x, y, c)`, `.line(x0, y0, x1, y1, c)`, `.fill(fn)`, `.rows()`. Use it for thin parts: legs, antennae, spears, whiskers. |
| `autoOutline(rows)` | Adds a 1px `'0'` outline around every coloured pixel. Use it after merging `grid` parts, since `sculpt` only outlines its own shapes. |
| `bossEyes(r, x, y, gap, face)` | The shared 4x4 boss eyes (`BOSS_EYE`: calm, mad, squint, daze, dead). Every boss uses them, which is what makes the cast look like one family. |
| `MOUTH[face]` | The shared small mouths (in `art_chars.js`, inside the bosses block). |
| `bossFrames(t, make, o)` | Calls your `make(f)` for every frame and registers `t_0 t_1 t_move t_tell t_atk`, the angry `t_p0 ...`, `t_stag`, `t_die`. |
| `def(name, rows, { flash, flip, glow, sil, legend })` | Registers a sprite. Bosses pass `{ flash: true }` (white hit copy). |

### The `f` flags your `make(f)` receives

| Flag | Frame | Typical change |
|---|---|---|
| (none) | `_0` idle | neutral pose |
| `b` | `_1` idle bob | body 1px lower/squashed |
| `m` | `_move` | stretched, legs apart |
| `tl` | `_tell` | wind-up: rears up, arms raised; `face: 'squint'` |
| `a` | `_atk` | release: lunges, mouth open |
| `p` | angry set (`_p*`) | redder cheeks, crown knocked aside, glowing accent; `face: 'mad'` |
| `st` | `_stag` | slumped, dizzy eyes (`face: 'daze'`) |
| `d` | `_die` | flattened, `face: 'dead'` |
| `face` | all | which `BOSS_EYE` / `MOUTH` to stamp |

You can add your own flags (the spider passes `leg: 0..3` for its walk cycle).

## 3. The recipe (do these in order)

1. **Write the concept in one comment line**: body shape, colour family, one accent, the
   one thing that makes the silhouette unique. Example: *"A dark-purple spider with crystal
   legs and six eyes, its back a broken geode."*
2. **Pick the ramp.** One colour family (4 tones, dark → highlight) plus one accent. Real
   ramps in use: purple `'1234'` / `'1223'`, green `'gGhH'`, red `'rRqw'`-like, orange
   `'oOYw'`-like, stone `'dmlL'`, cyan `'bBcC'`. Never grey-brown, never black.
3. **Size.** Bosses: 32x32 body, wide ones up to 40x32. Leave 2–4 empty rows at the top
   for crowns/horns and room at the bottom for the feet. The anchor is the feet
   (bottom centre).
4. **Mass with `sculpt`.** 1–4 ellipses/rects. Put the dimension in the pose flags:
   `const dy = f.st || f.d ? 3 : f.tl ? -1 : f.a ? 1 : f.b ? 1 : 0;` and add `dy` to
   every shape's y. That one line gives you idle bob, tell, attack and stagger.
5. **`rim`** with a hue-shifted neighbour (purple → magenta, green → teal, orange → red).
6. **`stamp` the face**: `bossEyes`, then a mouth from `MOUTH`, cheeks, a 2–3 pixel white
   glint on the top-left of the body (`'ww.\nw..'`). Then the signature detail (crown,
   hat, crack, pearl) as a stamp, which may change with `f.p` / `f.st`.
7. **Thin parts with `grid`** (legs, arms, horns): draw a darker shadow line offset by
   (+1, +1), then the main line, then a highlight pixel at the joint and a light tip.
   Merge only into transparent pixels (`c === '.' ? L[y][x] : c`) so they sit behind the
   body, then `autoOutline`.
8. **Frames**: `bossFrames(t, make, { flash: true })`, plus extra frames with `def()` in a
   loop if the boss walks (`t_walk0..3`, `t_pwalk0..3`).
9. **Look at it** (section 5), fix, look again. Expect 2–4 rounds. This step is not
   optional; the first version is never right.

Worked example: the Geode Spider, `src/art_bosses.js`, section "Geode Spider" (about 60
lines, uses every step above). The King Slime in `src/art_chars.js` is the simplest
example; start by reading those two.

## 4. Checklist before you call a sprite done

- Only `PAL` keys; no pure black; outline is `'0'` everywhere.
- Light from the top left: highlight top-left, shade and rim bottom-right, on every part
  including the stamped details.
- The silhouette (the `sil` copy, 1x) is readable on its own: you can tell what it is
  from the outline alone. Horns, crowns, legs and claws should break the round shape.
- At 1x the face is readable: eyes are the big `BOSS_EYE`s, not 1–2 px dots.
- Every frame differs visibly from `_0` (tell and atk must be readable at a glance: the
  tell is how the player sees an attack coming).
- The angry set looks angrier, the stagger frame dazed, the die frame flat.
- Row lengths match (`parseArt` throws at load time otherwise: check the console).
- It sits well next to the other bosses (same eye size, outline weight, saturation).

## 5. Looking at your work (the contact sheet)

Open `index.html` in a browser, open the developer console and paste this. It downloads
a PNG with every sprite whose name matches the regex, at 4x and at 1x, plus the
silhouette. Change the regex to your boss (`^geode`, `^(king|mayor|geode)_0$` ...).

```js
((re, S4 = 4) => {
  re = new RegExp(re);
  const names = Object.keys(SPR).filter(n => re.test(n)).sort(), pad = 6;
  const cw = Math.max(...names.map(n => SPR[n].w)), ch = Math.max(...names.map(n => SPR[n].h));
  const cols = Math.max(1, Math.floor(1400 / (cw * S4 + cw + pad * 3))), CW = cw * S4 + cw * 2 + pad * 4, CH = ch * S4 + 14 + pad;
  const c = document.createElement('canvas'); c.width = Math.min(names.length, cols) * CW; c.height = Math.ceil(names.length / cols) * CH;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  names.forEach((n, i) => { const s = SPR[n], x = (i % cols) * CW, y = Math.floor(i / cols) * CH;
    g.fillStyle = i % 2 ? '#7fd04f' : '#8be35a'; g.fillRect(x, y, CW, CH);
    g.drawImage(ATLAS, s.x[0], s.y[0], s.w, s.h, x + pad, y + pad, s.w * S4, s.h * S4);
    g.drawImage(ATLAS, s.x[0], s.y[0], s.w, s.h, x + pad * 2 + s.w * S4, y + pad, s.w, s.h);
    if (s.x[4] !== undefined) g.drawImage(ATLAS, s.x[4], s.y[4], s.w, s.h, x + pad * 2 + s.w * S4, y + pad + s.h + 4, s.w, s.h);
    g.fillStyle = '#2b1a47'; g.font = '10px monospace'; g.fillText(n, x + pad, y + CH - 3); });
  const a = document.createElement('a'); a.href = c.toDataURL(); a.download = 'sheet.png'; a.click();
})('^geode_');
```

Then look at the PNG yourself (an agent: open the image file with its image-reading
tool). Judge the 1x copy first: that is what players see. Then check the sprite in the
game itself (for a boss: start a run, and in the console
`G.floor.boss = 'geode'; enterRoom(G.floor.rooms.find(q => q.type === 'boss'), 'd')`),
because the ground colour and the shadow change how it reads.

## 6. Mistakes I made and how they were fixed

- **Legs as parallel lines** looked like a cage. Fix: fan them out from the hips (back
  legs point up-back, front legs down-forward), each with a knee.
- **Details too small** (a 4 px crack, 1 px eyes) vanish at 1x. Make the signature detail
  at least 8x6 and use the shared big eyes.
- **Walk frames that repeat**: check that frames 0 and 2 actually lift different legs.
- **Too many colours**: a second colour family makes the boss look like it belongs to a
  different game. One family + one accent, and the accent only on the signature detail.
- **Forgetting the angry/stagger/die sets**: `bossFrames` builds them from your flags; if
  `make` ignores `p`, `st` and `d`, the fight has no visual phase change.

- **Thin lines for big parts** (1px horns drawn with `grid`) look jagged at 1x. Anything
  wider than 2px is a `sculpt` shape; `grid` is only for legs, whiskers and spears.
- **Body colour = floor colour** (green on the meadow, sand on the shore): the boss
  disappears. Check the contact sheet on the land's floor and in the game.
- **Details on the canvas edge**: a pixel on row 0 or the last column cannot get its
  outline. Keep 1px free on every side for every frame (the tell frame rises highest).

## 7. After the art: hooking a boss up

The art is only half. The checklist for a new boss (EDEF, AI, names, Book entry,
`lang_hu.js`, `EF_EXTRA`, bot tests) is in AGENTS.md, section *Bosses*. The three existing
new bosses are the reference: `src/bosses.js` (search `mayor`, `turtle`, `geode`).

## 8. The template (copy this)

A complete, working boss that passes `artCheck` and matches the cast (checked next to
King Slime, Mole Mayor, Tide Turtle and Geode Spider). Paste it at the end of
`src/art_bosses.js`, replace `NAME`, then change it **one step at a time**: concept line,
`BODY`/`ACCENT`/`RIM`, the shapes, the signature detail. Keep the structure: the `f` flags
drive every pose, the feet stay on row 29, extra parts are shapes placed before the body.

```js
// ---------- NAME (LAND) ----------
// CONCEPT: a round blue toad-king with two curled orange horns (the accent).
(function bossNAME() {
  const t = 'NAME', o = { flip: true, flash: true, glow: true };
  const MOUTH = { calm: '0..0\n.00.', squint: '.00.\n0ww0\n.00.', mad: '.00.\n0ww0\n.00.', daze: '.0.\n0q0\n.0.', dead: '.00.\n0..0' };
  const BODY = 'bBcC';            // ONE family, dark -> highlight; must stand out from the land's floor
  const ACCENT = 'roOy';          // the accent family, only on the signature detail
  const RIM = { B: '2', c: '3' }; // bottom-right edge light: a hue-shifted neighbour (blue -> purple)
  const make = (f) => {
    // pose: the feet stay on row 29, the body changes height and width
    const ry = f.d ? 7 : f.a || f.st ? 9 : f.b ? 10 : f.m || f.tl ? 12 : 11;
    const rx = f.d ? 16 : f.a ? 15 : f.m ? 12 : f.tl ? 12 : 14;
    const cy = 29 - ry, top = cy - ry, spread = f.m ? 2 : f.a ? 1 : 0;
    const lift = f.tl ? 2 : f.st || f.d ? -2 : 0; // horns rise for the tell, droop when dazed
    // mass: earlier shapes sit behind later ones, so horns and feet come first
    const shapes = [];
    for (const s of [-1, 1]) shapes.push(
      { e: [18 + s * 12, top - 1 - lift, 2.5, 3], ramp: ACCENT },
      { e: [18 + s * 9, top + 2 - lift, 3.5, 3.5], ramp: ACCENT });
    shapes.push(
      { e: [11 - spread, 28, 4, 2.5], ramp: BODY },
      { e: [25 + spread, 28, 4, 2.5], ramp: BODY },
      { e: [18, cy, rx, ry], ramp: BODY });
    let r = rim(sculpt(36, 32, shapes), RIM);
    // face: the shared eyes, a mouth, cheeks when angry
    r = bossEyes(r, 12, cy - 2, 8, f.face);
    r = stamp(r, 16, cy + 3, f.a ? MOUTH.mad : MOUTH[f.face]);
    if (f.p && !f.d) { r = stamp(r, 9, cy + 3, 'PP'); r = stamp(r, 25, cy + 3, 'PP'); }
    // angry: the horn tips glow
    if (f.p) for (const s of [-1, 1]) r = stamp(r, 18 + s * 12 - (s < 0 ? 1 : 0), top - 2 - lift, 'y');
    return r;
  };
  bossFrames(t, make, o);
})();
```

Rules for changing it:

- `BODY` and `ACCENT` are 4-key ramps from `PAL`, dark to light. `RIM` maps two body keys
  to their hue-shifted neighbour (blue→purple, green→teal, orange→red, purple→magenta).
- The body must contrast with the floor of its land (meadow green, shore sand, cave
  stone/purple): pick the colour for that.
- Keep `bossEyes(r, x, y, 8, f.face)` and the `MOUTH` stamp; move them only as a pair.
- The tell (`f.tl`) must change the silhouette (rise, horns up, arms out), not only the face.

## 9. The quality gate: `artCheck`

Open `index.html`, open the developer console, paste the function once, then call
`artCheck('NAME')`. It reads your frames back from the atlas and prints a table.
Every threshold was measured on the existing bosses.

```js
function artCheck(t) {
  const rev = {}; for (const k in PAL) rev[PAL[k].toLowerCase()] = k;
  const px = ATLAS.getContext('2d').getImageData(0, 0, ATLAS.width, ATLAS.height).data;
  const read = (n) => { const s = SPR[n]; if (!s) return null; const o = [];
    for (let y = 0; y < s.h; y++) { let r = ''; for (let x = 0; x < s.w; x++) { const i = ((s.y[0] + y) * ATLAS.width + s.x[0] + x) * 4;
      r += px[i + 3] < 128 ? '.' : rev['#' + [px[i], px[i + 1], px[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('')] || '?'; } o.push(r); }
    return o; };
  const FR = ['0', '1', 'move', 'tell', 'atk', 'p0', 'p1', 'pmove', 'ptell', 'patk', 'stag', 'die'];
  const R = {}; for (const f of FR) R[f] = read(t + '_' + f);
  const miss = FR.filter(f => !R[f]); if (miss.length) return console.log('FAIL missing frames: ' + miss.map(f => t + '_' + f).join(' '));
  const A = R['0'], w = A[0].length, h = A.length, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const at = (r, x, y) => (y < 0 || y >= h || x < 0 || x >= w ? '.' : r[y][x]);
  const lum = (k) => { const n = parseInt(PAL[k].slice(1), 16); return 0.3 * (n >> 16) + 0.59 * (n >> 8 & 255) + 0.11 * (n & 255); };
  let bad = 0, holes = [], area = 0, edges = 0, tl = 0, tn = 0, br = 0, bn = 0;
  for (const f of FR) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = R[f][y][x]; if (c === '.') continue; if (c === '?') bad++;
    const open = N4.filter(([a, b]) => at(R[f], x + a, y + b) === '.').length + (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 1 : 0);
    if (open && c !== '0' && holes.length < 6) holes.push(t + '_' + f + ' x' + x + ' y' + y);
    if (open && c !== '0') holes.n = (holes.n || 0) + 1;
    if (f !== '0') continue; area++; edges += open;
    if (c === '0' || c === 'w') continue;
    const ln = (a, b) => '.0'.includes(at(A, x + a, y + b)), lt = ln(-1, 0) || ln(0, -1), rb = ln(1, 0) || ln(0, 1);
    if (lt && !rb) { tl += lum(c); tn++; } if (rb && !lt) { br += lum(c); bn++; }
  }
  let eyes = 0; const EYE = ['x00x', '0w00', '0000', 'x00x'];
  for (let y = 0; y + 4 <= h; y++) for (let x = 0; x + 4 <= w; x++) if (EYE.every((row, j) => [...row].every((c, i) => c === 'x' || A[y + j][x + i] === c))) eyes++;
  const d = (f) => { let n = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (A[y][x] !== R[f][y][x]) n++; return +(n / area).toFixed(2); };
  const cols = new Set(A.join('').replace(/[.0w?]/g, '')).size, cover = +(area / w / h).toFixed(2), light = Math.round(tl / tn - br / bn), shape = +(edges / Math.sqrt(area)).toFixed(1);
  const T = [ // [rule, value, ok, FAIL or WARN]
    ['size w<=40 h<=32', w + 'x' + h, w <= 40 && h <= 32, 'FAIL'],
    ['only PAL colours', bad + ' unknown px', bad === 0, 'FAIL'],
    ['outline: no body pixel touches air or the canvas edge', (holes.n || 0) + ' px ' + holes.join(', '), !holes.n, 'FAIL'],
    ['colours (without 0 and w) 6..12', cols, cols >= 6 && cols <= 12, 'FAIL'],
    ['fill 0.45..0.75 of the canvas', cover, cover >= 0.45 && cover <= 0.75, 'FAIL'],
    ['light from the top left (edge brightness TL - BR >= 10)', light, light >= 10, 'FAIL'],
    ['exactly 2 BOSS_EYE calm eyes in _0', eyes, eyes === 2, 'FAIL'],
    ['white hit copy (flash: true)', SPR[t + '_0'].x[2] !== undefined, SPR[t + '_0'].x[2] !== undefined, 'FAIL'],
    ['tell or atk differs from _0 by >= 0.25', d('tell') + ' / ' + d('atk'), Math.max(d('tell'), d('atk')) >= 0.25, 'FAIL'],
    ['angry _p0 differs from _0 (0.02..0.2)', d('p0'), d('p0') >= 0.02 && d('p0') <= 0.2, 'FAIL'],
    ['stagger differs >= 0.2', d('stag'), d('stag') >= 0.2, 'FAIL'],
    ['die differs >= 0.3', d('die'), d('die') >= 0.3, 'FAIL'],
    ['idle bob _1 differs >= 0.05', d('1'), d('1') >= 0.05, 'WARN'],
    ['silhouette not a plain blob (edge/sqrt(area) >= 5)', shape, shape >= 5, 'WARN'],
  ];
  const out = T.map(([r, v, ok, lvl]) => ({ rule: r, value: String(v), result: ok ? 'pass' : lvl }));
  console.table(out);
  const fails = out.filter(o => o.result === 'FAIL').length, warns = out.filter(o => o.result === 'WARN').length;
  const verdict = fails ? 'FAIL (' + fails + ')' : warns ? 'PASS with ' + warns + ' WARN' : 'PASS';
  console.log(t + ': ' + verdict);
  return { t, verdict, failed: out.filter(o => o.result !== 'pass').map(o => o.result + ' ' + o.rule + ' = ' + o.value.slice(0, 60)) };
}
```

What the rules mean and how to fix a FAIL:

| Rule | Fix |
|---|---|
| missing frames | use `bossFrames(t, make, o)`; walk frames are extra |
| size | 40x32 at most; wider bosses read as scenery |
| only PAL colours | you typed a key that is not in `PAL` |
| outline | the list shows frame and pixel; free 1px at the canvas edge, or run `autoOutline` after merging parts |
| colours 6..12 | fewer: you have two families; more than 12: drop details |
| fill 0.45..0.75 | too low: the boss is spindly or the canvas too big; too high: no room for the pose changes |
| light from the top left | a ramp is reversed, or `RIM` uses a lighter key than the body |
| 2 BOSS_EYE eyes | use `bossEyes`, and keep other shapes from covering the eyes |
| tell/atk >= 0.25 | the pose change is too small for a player to see the attack coming |
| angry 0.02..0.2 | below: `make` ignores `f.p`; above: the angry boss no longer looks like the same boss |
| stagger, die | `make` ignores `f.st` / `f.d` |

Results on the existing bosses (2026-09-25): octo PASS; king PASS with 1 WARN (a
slime is allowed to be a blob). The rest FAIL on a few outline pixels (queen's crown tips,
mayor's fork, turtle's shell ridge, the geode's and moths' legs on the canvas edge), bcrab,
golem and nmoth have no `BOSS_EYE`s, nmoth is 44px wide, and the turtle's tell is too
small (0.11). **These are known defects in older art, not examples.** New art must PASS.

## 10. The review gate (mandatory before commit)

1. `artCheck('NAME')` prints PASS. Warnings are explained in the commit message.
2. Make two contact sheets (section 5): all frames `^NAME_`, and the cast
   `^(king|mayor|turtle|geode|NAME)_0$`. Look at both at 1x and answer in writing:
   - Can you tell what it is from the silhouette alone?
   - Is the face as readable as King Slime's at 1x?
   - Does it look like the same game as the other four (outline weight, saturation, eye
     size)? If one of them looks "more detailed" or "flatter", it does not.
   - Can you see the tell frame is an attack coming, without the label?
   - Does it stand out on its land's floor, in the game (section 5)?
3. Send both sheets and your answers to the user (or a stronger model) and wait for a yes.
   No yes, no commit.
4. If it is still not right after four rounds of fixes, stop and ask; say what is wrong.
   Do not keep polishing blindly.
