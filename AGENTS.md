# AGENTS.md — Star Garden

Guide for agents and developers working on this code. Everything is in English: game
text, code, comments and docs.

Live build: https://attikaaaa.github.io/star-garden/ (GitHub Pages, served from `main`).
`og.png`, `favicon.png` and `apple-touch-icon.png` are the link-preview and icon assets;
the `og:` / `twitter:` URLs in `index.html` must stay absolute.

## Principles

- **No build, no dependencies, no external assets.** All graphics are generated from code
  (sprite strings), all audio is Web Audio synthesis. Keep it that way.
- **Classic `<script>` tags**, not ES modules, so the game runs from `file://`. The files
  share one global scope: top-level names must not collide. Load order is fixed in
  `index.html` (palette → save → gfx → font → art → audio → input → data → level →
  entities → enemies → fx → ui → meta → main).
- **Only what is needed goes in.** No test framework and no debug UI in shipped code.

## File map (`src/`)

| File | Contents |
|---|---|
| `palette.js` | `PAL` (the one palette), `THEMES` (per-land tile colour slots and land names) |
| `save.js` | `Save`: settings, lifetime stats, found items, stars, Garden levels (localStorage, fails soft) |
| `gfx.js` | sprite registry, atlas baking, `drawS` / `drawFeet` / `drawGlow`, shadow, ring; art tools `sculpt`, `stamp`, `autoOutline`, `grid` |
| `font.js` | 5x7 capital pixel font (with accents), cached `text()` |
| `art_chars.js` | hero, enemies, bosses |
| `art_world.js` | tiles, doors, obstacles, pickups, shots, chest, star gate, ambient critters |
| `art_ui.js` | HUD bits, cursor, item icons, frog, title logo |
| `audio.js` | `Audio_`: sound effects and 4 songs on a step sequencer, cross-fades, volumes |
| `input.js` | keyboard, mouse, controller (`pollPad`) and touch sticks (`pollTouch`) |
| `data.js` | `ITEMS`, `LANDS`, `LAYOUTS` (room layouts), `BOSS_LAYOUT`, `UPGRADES` |
| `level.js` | floor generation, tile collision, flow field, cached static room layer, doors |
| `entities.js` | player, shots, pickups, particles, props, combo, Starfall, star-gate warp |
| `enemies.js` | enemy bullets, enemy and boss AI, elites, golden slime, drawing |
| `fx.js` | diamond wipe (`wipe`), ambient life per land (`AMB`), animated pits |
| `ui.js` | HUD, minimap, banners, menus, settings, collection, pause, end screens, touch overlay |
| `meta.js` | stars, the Garden upgrade screen, run save / resume |
| `main.js` | `G` state, room flow, fixed-step loop, rendering, scaling |

## Pixel-art rules (mandatory)

1. **Only `PAL` colours.** Add a colour only with good reason, by extending the palette.
   The mood is cheerful and saturated: no grey-brown gloom, no pure black (outlines use the
   deep indigo `'0'`).
2. **1px `'0'` outline** on every character and object. Light **always comes from the top
   left**: highlights on the top-left edges, shade on the bottom-right.
3. **No rotation, no non-integer scaling, no mixels.** Everything is drawn at native
   resolution; `drawS` rounds positions. Even the 2x logo is upscaled at mask level, with
   native-pixel shading and outline.
4. **Three-quarter view:** a sprite's anchor `(x, y)` is its feet; `drawFeet` aligns
   bottom-centre. Depth comes from sorting by y. The top wall's face is 16px tall and heads
   may overlap it.
5. **Shadows** under everything that stands, floats or flies, via `shadow()`.
6. Internal resolution is **384x216**, tiles are 16px, display scaling is integer-only.

## Making sprites

- `def(name, art, { flip, flash, glow, sil, legend })` — `art` is a string or an array of
  rows; `.` is transparent, every other character is a `PAL` key. `flip` bakes a mirrored
  copy, `flash` a white hit copy, `glow` a 1px pale-yellow halo (elites), `sil` a solid
  silhouette in the given colour, `legend` recolours (slime variants, tinted shots).
- Draw variants (last argument of `drawS`): 0 normal, 1 mirrored, 2 white flash,
  3 mirrored flash, 4 silhouette. Halos are drawn with `drawGlow`.
- `defT(name, art)` bakes a tile per land as `name@meadow|beach|crystal`. Slot characters
  are explained in `THEMES` in `palette.js`; in themed sprites `a b c e g h 1-9` are slots,
  not `PAL` colours.
- Big round shapes: `sculpt(w, h, shapes)` (shaded ellipses / rounded rects with automatic
  outlines), then `stamp()` hand-drawn details (faces, eyes, crowns).
- Icons: draw colour pixels only, then `autoOutline()`; use `grid()` for lines.
- Row lengths are checked by `parseArt`, which throws at load time on a mismatch.

## Rooms and coordinates

- A room is 24x13 tiles with a vertical offset `OY = 8`. Rows 0–1: top wall (cap + face),
  row 12: bottom wall, columns 0 and 23: side walls. Interior: 22x10.
- `LAYOUTS`: `.` floor, `#` rock, `b` breakable, `~` pit/water, `e` enemy slot. Tiles in
  front of doors must stay open (top/bottom centre: columns 10–11, left/right middle: rows
  4–5), and every door and `e` slot must be reachable. Check new layouts with a BFS.
  Layouts are mirrored at random.
- Door openings: `DOOR_OPEN`, entry points: `ENTRY`. Room types: `start`, `normal`,
  `item`, `shop`, `challenge`, `boss`.
- Collision modes (`solidPx`): `player`, `enemy` (pits are walls), `fly` (walls only),
  `shot` (rocks block, pits do not). Shots test enemies before walls.

## States and input

- `G.state`: `title`, `kert` (the Garden screen), `collection`, `settings` (`G.back` says
  where to return), `play`, `pause`, `over`, `win`. Use `wipe(cb)` when switching between
  the game and menus; `cb` runs while the screen is fully covered.
- Query input through the shared code lists (`K_UP`, `K_OK`, `K_BACK`... in `ui.js`).
  Controller and touch buttons are virtual codes (`PadA`, `PadStart`, `TouchDash`...), so
  they can go into any `pressed()` call.
- Change settings and stats only through `Save`, then call `Save.write()`. Short feedback:
  `toast('TEXT')`. Stars: `earnStars(n)`.
- Runs are saved with `saveRun()` only while standing in a cleared room (room entry, room
  clear, boss reward, new floor, save-and-quit); `loadRun()` rebuilds the floor. A run's
  save is deleted when the hero dies or the player leaves after a victory.

## Adding content

- **Item:** entry in `ITEMS` (`name`, short `desc`, `apply(p)`, optional `unique`), plus
  an `icon_<id>` sprite in `art_ui.js`. The description must fit the banner.
- **Enemy:** `EDEF` stats, an `AI.<type>` state machine, `enemySprite` and `enemyColors`
  branches, optionally `glintAt` (pre-shot sparkle), then add the type to a `LANDS[].pool`.
  At most two stationary (`still`) enemies spawn per room.
- **Land:** a new `THEMES` entry and `THEME_ORDER`, a `LANDS` entry, `rock_<theme>` and
  `brk_<theme>` sprites, a song in `SONGS` in `audio.js`, ambient life in `fx.js`.
- **Garden upgrade:** entry in `UPGRADES` plus its effect in `applyUpgrades`.

## Performance

- Each room's static layer is baked to its own canvas and only redrawn after something
  breaks (`room.dirty`).
- All sprites live in one atlas. Text comes from a canvas cache.
- Particles, ambient life and enemy bullets are pooled; avoid allocations in hot loops.
- Fixed 60 Hz logic with an accumulator; the game pauses when the tab is hidden.

## Checking your work

After a change, open `index.html` and look at the title, a fight in each land, the shop,
the treasure and challenge rooms and a boss. For art changes, inspect the sprite zoomed in:
every pixel matters.
