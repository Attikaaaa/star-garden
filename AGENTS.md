# AGENTS.md — Star Garden

Guide for agents and developers working on this code. Everything is in English: game
text, code, comments and docs.

Live build: https://attikaaaa.github.io/star-garden/ (GitHub Pages, served from `main`).
`og.png`, `favicon.png` and `apple-touch-icon.png` are the link-preview and icon assets;
the `og:` / `twitter:` URLs in `index.html` must stay absolute. It is an installable PWA
(`manifest.webmanifest`, icons `icon-192/512.png`) with offline support in `sw.js`:
**bump `VERSION` in `sw.js` on every release** and keep its file list in sync with
`index.html`, or players keep a stale cached copy.

## Principles

- **No build, no dependencies, no external assets.** All graphics are generated from code
  (sprite strings), all audio is Web Audio synthesis. Keep it that way.
- **Classic `<script>` tags**, not ES modules, so the game runs from `file://`. The files
  share one global scope: top-level names must not collide. Load order is fixed in
  `index.html` (palette → save → gfx → font → art → audio → input → data → level →
  entities → enemies → fx → ui → meta → main → net). `net.js` loads last because it wraps
  a few functions of the others (see *Co-op* below).
- **Only what is needed goes in.** No test framework and no debug UI in shipped code.

## File map (`src/`)

| File | Contents |
|---|---|
| `palette.js` | `PAL` (the one palette), `THEMES` (per-land tile colour slots and land names) |
| `save.js` | `Save`: settings, lifetime stats, found items, vault, Garden levels, wands, name, robe (localStorage, fails soft) |
| `gfx.js` | sprite registry, atlas baking, `drawS` / `drawFeet` / `drawGlow`, shadow, ring; art tools `sculpt`, `stamp`, `autoOutline`, `grid` |
| `font.js` | 5x7 capital pixel font (with accents), cached `text()` |
| `art_chars.js` | hero, enemies, bosses |
| `art_world.js` | tiles, doors, obstacles, pickups, shots, chest, star gate, ambient critters |
| `art_ui.js` | HUD bits, cursor, item icons, frog, title logo |
| `audio.js` | `Audio_`: sound effects and 4 songs on a step sequencer, cross-fades, volumes |
| `input.js` | keyboard, mouse, controller (`pollPad`), touch sticks (`pollTouch`), `IS_TOUCH`, haptics (`haptic`, `hapticAll`), `goFullscreen` |
| `data.js` | `ITEMS`, `LANDS`, `LAYOUTS` (room layouts), `BOSS_LAYOUT`, `UPGRADES`, `WANDS`, `POTIONS`, `DIFFS` |
| `level.js` | floor generation, tile collision, flow field, cached static room layer, doors |
| `entities.js` | players (input, movement, combat, down/revive, robes), wand shots, bolts, belt / potions, turrets, pickups, particles, props, combo, Starfall, warp |
| `enemies.js` | enemy bullets, enemy and boss AI, elites, golden slime, drawing |
| `fx.js` | diamond wipe (`wipe`), ambient life per land (`AMB`), animated pits |
| `ui.js` | HUD, minimap, banners, menus, settings, collection, pause, end screens, touch overlay |
| `meta.js` | the vault, `applyUpgrades`, the Garden (upgrades + wands tabs), the pre-run screen, solo run save / resume |
| `main.js` | `G` state, runs (`startRun`), room flow, the Arena, fixed-step loop, rendering, scaling |
| `net.js` | online co-op: broker signaling, WebRTC links, host snapshots, client sync, co-op menu, text entry, lobby |

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
6. The play view is **384x216**, tiles are 16px, display scaling is integer-only. The
   canvas itself is resized to cover the whole screen (`SCR`: size in game pixels and the
   play view's offset `ox/oy`); the margins show more wall/meadow, never stretched pixels.
   Rendering is translated so game code keeps using play-view coordinates; use
   `fillScreen()` / `screenEdges()` for anything that must reach the real screen edges
   (overlays, HUD corners, touch buttons).

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
  `item`, `shop`, `challenge`, `boss`, `arena` (four gates that never open, no minimap).
- Collision modes (`solidPx`): `player`, `enemy` (pits are walls), `fly` (walls only),
  `shot` (rocks block, pits do not). Shots test enemies before walls.

## States and input

- `G.state`: `title`, `prep` (wand / robe / difficulty before a solo run), `kert` (the
  Garden), `collection`, `settings` (`G.back` says where to return), `coop`, `entry`
  (text entry: join codes and names, `G.entry`), `lobby`, `play`, `pause`, `over`, `win`.
- `G.mode` is `adv` or `arena`; `G.diff` indexes `DIFFS`. `G.players` holds every hero,
  `G.player` is the one this device controls. Never assume a single hero: loop over
  `G.players`, pick targets with `nearestHero`, and check `alive(p)` (not dead, not down).
- Coins are a team purse, `G.coins`, changed through `gainCoins(n)` (it also fills the
  vault). Vault bonuses: `earnVault(n)` (scaled by difficulty, sent to every co-op player). Use `wipe(cb)` when switching between
  the game and menus; `cb` runs while the screen is fully covered.
- Query input through the shared code lists (`K_UP`, `K_OK`, `K_BACK`... in `ui.js`).
  Controller and touch buttons are virtual codes (`PadA`, `PadStart`, `TouchDash`...), so
  they can go into any `pressed()` call.
- Change settings and stats only through `Save`, then call `Save.write()`. Short feedback:
  `toast('TEXT')`, `say(p, 'TEXT')` over a hero's head. Feedback for one hero only (their
  red flash, their vibration, their item banner) goes through `youFx(p, kind)`, which is
  sent over the network when that hero is remote. Shared rumble: `hapticAll(kind)`.
- Haptics: add a pattern to `HAPTIC` in `input.js`. Small, frequent events must be marked
  minor and rate limited, so it never becomes a constant buzz.
- Solo adventure runs are saved with `saveRun()` only while standing in a cleared room (room entry, room
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
- **Garden upgrade:** entry in `UPGRADES` plus its effect in `applyUpgrades(p, up)`
  (it gets the player's own levels, because co-op clients bring theirs).
- **Wand:** entry in `WANDS` (stat multipliers, cost), a `wand_<id>` icon, its projectile
  in `drawShots` / `updateShots` (`s.kind`), and a sound in `WAND_SFX`.
- **Potion / belt item:** entry in `POTIONS`, a `pot_<id>` sprite, its effect in `useBelt`
  (timed effects live in `p.buff`), a HUD timer if it lasts.
- **Robe:** a legend in `SKINS` (`art_chars.js`), a name in `ROBES` and a tag colour in
  `TAG_COL` that exists in `FONT_COLORS` (text in other colours does not render).

## Co-op (`net.js`)

- The host simulates everything; clients only move their own hero (so it feels instant),
  send their controls (`in` packets, presses as counters) and draw what the host sends.
  Never run game logic on a client (`NET.role === 'client'`): `clientPlay` only animates.
- Host → client: snapshots ~30/s on an unreliable channel (`netHostTick`: heroes `PF`,
  enemies `EF`, shots, bullets, pickups, turrets, props when they change, and recorded
  effects), plus reliable events: `start`, `floor`, `room`, `trans`, `tile`, `state`,
  `vault`, `you`. New fields a client must draw go into those field lists.
- `net.js` wraps `burst`, `poof`, `dust`, `toast`, `breakTile` and `Audio_.sfx/play/stop`
  on the host, so effects show on every screen without extra code. Other one-off
  particles (`part`) are local.
- Moving a hero on the host (room entry, placement) must go through `placeHeroes` or bump
  `p.tpN`, otherwise the client keeps its own position.
- Signaling uses the public PeerJS broker (`NET_BROKER`) with the room id
  `stargarden-<CODE>`; bump `NET_PROTO` when the messages change incompatibly.
- Test co-op with two separate browsers (two profiles): the host must stay in the
  foreground, a hidden tab stops the game for everyone.

## Performance

- Each room's static layer is baked to its own canvas and only redrawn after something
  breaks (`room.dirty`).
- All sprites live in one atlas. Text comes from a canvas cache.
- Particles, ambient life and enemy bullets are pooled; avoid allocations in hot loops.
- Fixed 60 Hz logic with an accumulator; the game pauses when the tab is hidden, and on
  touch devices when the phone is turned to portrait.

## Checking your work

After a change, open `index.html` and look at the title, a fight in each land, the shop,
the treasure and challenge rooms, a boss, a few Arena waves, and a co-op game with two
browsers. For art changes, inspect the sprite zoomed in: every pixel matters.
