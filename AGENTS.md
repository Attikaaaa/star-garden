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
  `index.html` (palette → save → online → rng → gfx → font → lang → art → audio → input →
  data → level → entities → enemies → fx → ui → meta → the progress and content files →
  couch → cloud → yard → casino → art_casino → slot → cards → roulette → scratch → lounge → events → road → lands → wardens → woods → toy → snow → sun → main → qr → net). `net.js` loads last because it wraps a few
  functions of the others (see *Co-op* below).
- **Only what is needed goes in.** No test framework and no debug UI in shipped code.

## File map (`src/`)

| File | Contents |
|---|---|
| `wg_*.js`, `dress.js`, `lang_hu_wg.js` | **Wildgrove** survival mode (`G.state === 'wg'`), self-contained: `wg_data` (items/objects/recipes, append-only ids), `wg_world` (seeded chunks, caves), `wg_art`/`wg_art2` (sprites), `wg_game` (session `WGS`, mining, use), `wg_mobs`, `wg_render`, `wg_ui`, `wg_main` (screens, play loop), `wg_store` (IndexedDB, `.sgworld` export/import), `wg_net` (host-authoritative MQTT+WebRTC). Server: `tools/wg-server.mjs`. Tests: `sh qa/_wg_all.sh` |
| `palette.js` | `PAL` (the one palette), `THEMES` (per-land tile colour slots and land names) |
| `save.js` | `Save`: settings, lifetime stats, found items, vault, Garden levels, wands, name, robe (localStorage, fails soft) |
| `gfx.js` | sprite registry, atlas baking, `drawS` / `drawFeet` / `drawGlow`, shadow, ring; art tools `sculpt`, `stamp`, `autoOutline`, `grid` |
| `font.js` | 5x7 capital pixel font (with accents), cached `text()` |
| `art_chars.js` | hero, enemies, bosses |
| `art_world.js` | tiles, doors, obstacles, pickups, shots, chest, star gate, ambient critters |
| `art_ui.js` | HUD bits, cursor, item icons, frog, title logo |
| `audio.js` | `Audio_`: sound effects and 4 songs on a step sequencer, cross-fades, volumes |
| `input.js` | keyboard, mouse, controller (`pollPad`), touch sticks (`pollTouch`), `IS_TOUCH`, haptics (`haptic`, `hapticAll`), `goFullscreen` |
| `data.js` | `ITEMS`, `LANDS`, the Star Road (`ROAD`, `roadPath`, `roadLand`), `LAYOUTS` (room layouts), `BOSS_LAYOUT`, `UPGRADES`, `WANDS`, `POTIONS`, `DIFFS` |
| `level.js` | floor generation, tile collision, flow field, cached static room layer, doors, land mechanic hooks (`LAND_MECH`; `rebuildMech` reruns a land's `build` for a co-op client's or a resumed run's room), page turns. Layout names (`LAND_LAYOUTS`, `LAY_RULE`) are global: keep them unique across lands |
| `entities.js` | players (input, movement, combat, down/revive, robes), wand shots, bolts, belt / potions, turrets, pickups, particles, props, combo, Starfall, warp |
| `enemies.js` | enemy bullets, enemy and boss AI, elites, golden slime, drawing |
| `fx.js` | diamond wipe (`wipe`), ambient life per land (`AMB`), animated pits, the light mask (`lightAdd` / `drawLight` / `lightAt`), the page-turn drawing |
| `ui.js` | HUD, minimap, banners, menus, settings, collection, pause, end screens, touch overlay |
| `meta.js` | the vault, `applyUpgrades`, the Garden (upgrades + wands tabs), the pre-run screen, solo run save / resume |
| `road.js` | the Star Road: forks (after a boss the team picks the next land from cards, each with a boon, `G.run.boon`), run lengths (full road, one act, quick; `G.run.span`, vault pay in `applyRunX`, `starterKit`), the difficulty curve (`depthHp`, `powDepth`: a run that starts down the road counts from its kit), ROAD+ (`plusAct`) and the campfire between acts. Until the first win only the first act is open (`openActs` in data.js) |
| `lands.js` | each land's own rule (`LAND_MECH`) and its art: the Meadow's Bloom Loop (flower patches, seeds, gusts), the Shore's tide and pier, the Crystal Cave's prism pillars and the Crystal Clock, the Cloud Steps' Puff Floor (sunstone, updraft hops); each land's own fight rooms (`LAND_LAYOUTS`, `LAY_RULE`) |
| `wardens.js` | the wardens, one mid-boss per land (`WARDENS`): Thistle Knight, Sandcastle Crab (with its sand fort, `room.fort`), Chandelier Bat, Weather Vane |
| `woods.js` | the Lantern Woods: lamp posts (`T_LAMP`, layout `l`, `lampHit`, `lampsBuild`), its light (`woodsLight`), foes' eyes in the dark, its rooms; its foes (Wisp Fox, Stump Sentry, Lamp Moth, Owlet, Mushroom Mime, Pumpkin Hopper), freed fireflies (`ffly` pickups that light dark lamps) and its warden, the Scarecrow |
| `toy.js` | the Toy Attic: the beat's metronome (`drawMetro`, BEAT CLICK), conveyor belts (layout `< > ^ v`, `room.belt`, a ground-only drift), wind-up keys that run down into a stagger (`EDEF.wind`), crayon lines (`zap` markers with `c: 'crayon'`), its floor, rooms, foes (Tin Soldier, Jack-in-the-Box, Marble Runner, Paper Plane, Teddy Drummer, Crayon Scribbler) and items |
| `snow.js` | the Snowglobe: ice bridges shot over its ponds (`freeze`, `room.frz`, melting after `FREEZE_T`), the globe's shake from the shared clock (`globe`, `shakeTell` / `shakePush`, mittens and arrows first, then a drift current) and the snowdrifts it piles up (`driftAtTile`, the `slow` hook in `moveBox`), its rooms, foes (Snowman, Sliding Penguin, Icicle Bat, Snow Hare, Bauble, Frost Fairy), the Sled Cub warden, Yeti Yodel, the Frost Queen, the Skating Rink and its items |
| `sun.js` | the Sun Temple: quicksand (`T_QSAND`, layout `z`: the `slow` and `drift` hooks), sun-glyph plates (`T_PLATE` / `T_PLATEON`, layout `o`) that open the room's gates when all are lit (`openGates`), its rooms, foes (Scarab Roller, Sand Cat, Sun Priest, Mummy Wrap, Canopic Jar, Golden Scarab), the Sun Disc Guardian warden, the Riddle Sphinx (plates in the glyphs' order drop her shield, `e.sh`), the Scarab Pharaoh, the Sun Beam room (`beamPath`) and its items |
| `library.js` | the Story Library: every fight room is a page of a pair (`PAGE_LAYOUTS`) that turns after a curled-corner tell (`libPage` / `libFold`, `turnPage` in level.js, NET.fx 'curl' / 'fold' for clients), ink puddles that slow (`inkList`), its foes (Ink Blot, Paper Crane, Bookworm, Quill Knight, Bookmark Ghost, the Proofreader elite), the Index Card Clerk warden, the Great Bookworm (three chapters), the Red Pen (`penLead`), the Choose Your Path room (`LIB_STORIES`) and its items |
| `forge.js` | the Ember Forge: the Heat Beat (runes from the room's seed in `room.rune`, groups erupting every 8 beats of `G.beat`, `forgeHurts` as the `hurts` hook that net.js `clientHits` also asks, lamps on the wall pipe), oil barrels that blow up in chains (`breakTile` wrapper, `room.fuse`, `barrelBlast`, zap `c: 'blast'`), belts (toy.js `beltsBuild`), cooling water (layout `w`, `room.cool`), anvil drops, cooled slag rocks (`room.rk0`, `rockArt` → `slagrock`), its foes (Ember Imp, Anvil Golem, Coal Hound, Tong Bat, Slag Slime, the Bellows Bug elite), the Hammer Sprite warden, the Forge Dragonling (checkerboard `e.hot`, lava flood rows `DR_ROWS`), the Magma Snail, the Quench Room (`QUENCH`, `p.qn` for one floor) and its items (Oven Mitts, Hot Coal, Tongs) |
| `deep.js` | the Glow Deep: the current (`room.cur` a direction or `'whirl'`, flipping every `CUR_BEATS` beats from `room.cb`, floor chevrons that flash before it turns, the `drift` hook moves heroes, foes and bullets), bubble vents (`bubbles` on the shared clock, `room.bpop`, NET fx `bpop`) and the big bubble shot (`p.bub`, `s.bubT` pops into a ring), its foes (Jelly Drifter with tendril zaps, Lantern Fish whose lure is the hitbox, Urchin Ball, Eel, Giant Clam, the Sea Angel elite as `room.wells`), the Manta Courier warden, the Grand Anglerfish (lure `e.lx/e.ly`, phase 2 darkness via fx.js light, phase 3 whirlpool and `ANG_VENTS`, a swallowed bubble stuns it), the Kraken (zap `c: 'tent'` / `'tsweep'`), the Pearl Room (`gclam` on the beat) and its items (Fins, Pearl Necklace, Glow Lure) |
| `moon.js` | the Moon Garden: low gravity (`drift` grip `MOON_GRIP`, the `glide` hook keeps dash momentum), gold well rocks (`rock_moonw`, `room.wellIdx` / `room.wells0` pull shots in via `room.wells`), its layouts (`'W'` = well rock), foes (Moon Courier, Moon Rabbit, Comet Pup, Star Petal, Sleepy Wisp, the Night Bloom Bud elite), the Lamp Bunny warden (its lamp is a well), the Night Bloom (moon phases: New, Crescent, Half `e.half` burns one side, Full; pillars `NB_PILLARS` turn to wells; the Eclipse on ROAD+; the Big Stars orbit it), the Wishing Pond (`wpond`, `WISH_COST`) and its items (Moon Boots, Comet Tail, Wishing Star) |
| `main.js` | `G` state, runs (`startRun`), room flow, the Arena, fixed-step loop, rendering, scaling |
| `net.js` | online co-op: MQTT broker links, WebRTC upgrade, host snapshots, client sync, rejoin, co-op menu, text entry, lobby |
| `duel.js` | the secret Boss Fight (co-op lobby mode `duel`, unlocked by a code): Big Grin's art, `AI.grin`, slippers, `duelWon` |
| `qr.js` | a small QR encoder (`qrMatrix`) for the co-op invite shown in the lobby |
| `rng.js` | seeded random streams for everything that decides the game (`grnd`, `gpick`, `withSeed`, `hashSeed`) |
| `online.js` | consent-gated stats (`track`), error reports, `live.json`, the optional game server (`api`, `online()`), install and storage |
| `lang.js`, `lang_hu.js` | languages: `tr()` looks up whole on-screen strings (`#` numbers, `*` words); one table per language |
| `progress.js` | the event bus (`note`, `onNote`, `noteFor`, `noteTeam`), counters (`cnt`, `bump`), unlocks and NEW badges, the run log |
| `firstrun.js` | the tutorial room, the curated first run, the first gift, naming |
| `screens.js` | modals (`openModal`), the what's-new list (`NEWS`), title notices, the end screen and its next goal |
| `quests.js`, `stars.js`, `book.js`, `mail.js` | quests; Constellations (achievements); the Book (items, bestiary, combos, runs, stats); the frog's letters and daily gifts |
| `hub.js`, `yard.js` | the Garden's menus and cosmetics (trails, pets, titles); the walkable Garden, plants and seed plots; the shared walk-to-a-tap helpers (`yardPath` BFS with a cell size, `pathDir`, `slideStep`) the casino uses too |
| `items2.js`, `loot.js`, `affix.js`, `mods.js` | more items, rarity and sets; door rewards, skull rooms, star scrolls; elite affixes and the nemesis; run modifiers |
| `foes.js`, `bosses.js`, `rooms.js`, `story.js` | the second wave of foes; alternate bosses, the Star Well and Big Stars; special rooms; the frog's lines and the ending |
| `heroes.js`, `options.js` | the four heroes; wand aspects, Star Trials, Quick Run, assist, bullet shapes, key remapping, the arena save |
| `daily.js`, `events.js` | the Daily Star Run, Weekly Challenge and share card (from `DAILY_ROAD_FROM` the whole road deals the lands; older keys keep the classic three); the sky calendar (Star Rain, Moon Night), seasons, Boss of the Week |
| `couch.js`, `cloud.js` | couch co-op (extra controllers); save codes, cloud backup, leaderboards and friend codes, the community goal, bloom reminders |
| `casino.js` | the Star Casino (`G.state` `casino`, from the title menu): chip wallet `cas()` (in `Save.casino`), house edges (`EDGE`), `CASINO_TUNING` (live-tunable), comp tiers, the walkable hall and the VIP lounge (`CAS.room`, `casSpots()`, Gold card), life on the floor (critters, the fountain, Star Rain chips, Halloween pumpkins), `wheelRaster` for both wheels. `casShown()` (visited and not hidden) gates everything outside: the casino quest, Cosmo's letter, the LUCKY CHIP constellation (`cas: true`, filtered by `skyList()`) and the Book's CASINO page. Rounds call `note('cas', game, what)` |
| `slot.js`, `cards.js`, `roulette.js`, `scratch.js`, `lounge.js` | the Star Slot and three land slots (fixed reel strips, jackpot); blackjack and video poker; European roulette and the Big Wheel; scratch cards; the VIP lounge's Sic Bo and the Prize Counter |
| `holdem.js` | the lounge's Hold'em sit-and-go: hand evaluator, no-limit betting with side pots, three bots (tight frog, odds owl, bluffing fox), the hand log replayed after a reload. The prize is paid flat (no quiet luck) |
| `art_casino.js` | chips, the hall's furniture, playing cards, dice and prizes |
| `art_heroes/more/items/foes/bosses/rooms/garden.js` | art for the content added after the first release |

`tools/dev.mjs` holds developer checks that drive the real game in headless Chromium (Node 22+,
nothing ships): `layouts` (every `*LAYOUT(S)` const: size, door lanes, BFS reachability),
`sheet [regex]` (sprite contact sheet at 3x) and `bot [land] [floors]` (an invulnerable bot
clears a run and reports errors and frame times). Run `layouts` after touching any layout.

`tools/casino_check.mjs` works out every casino game's return to player from its real
tables (reel strips, paytables, all 216 Sic Bo rolls); run it after touching any odds. Chips
are never money. The Prize Counter sells cosmetics, plus the Lucky Charm (+25 coins at the next
run's start); keep it that small. The browser checks: `qa/_cas_check.mjs` (chip conservation
over every game, reloads mid-round, determinism, RNG source, cashier caps, every station walked
to, save size, frame cost), `qa/_cas_input.mjs` (a round of every game by keyboard, pad and
touch), `qa/_cas_meta.mjs`, `qa/_lang_casino.mjs`, `qa/_robe_check.mjs` (the VELVET robe bought, worn and
kept through a reload), `qa/_holdem_check.mjs [games]` (whole tournaments: chips never leak, the
winner alone is paid, a reload mid-hand) and `qa/_cas_shots.mjs [hu|en]`.

`server/server.js` is the optional game server (Node 18+, no dependencies, JSON files in
`DATA_DIR`): stats, cloud saves and transfer codes, leaderboards with friend codes, the
weekly community goal, TURN credentials (`/api/ice`), payload-free web push for bloom
reminders and a retention dashboard (`/admin?key=ADMIN_KEY`). The game finds it through
`"server"` in `live.json` or `<meta name="sg-server">`; with neither, every online extra
stays hidden and the game is complete offline.

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

The step-by-step method, the tool reference and a contact-sheet snippet are in `PIXELART.md`.

- `def(name, art, { flip, flash, glow, sil, legend })` — `art` is a string or an array of
  rows; `.` is transparent, every other character is a `PAL` key. `flip` bakes a mirrored
  copy, `flash` a white hit copy, `glow` a 1px pale-yellow halo (elites), `sil` a solid
  silhouette in the given colour, `legend` recolours (slime variants, tinted shots).
- Draw variants (last argument of `drawS`): 0 normal, 1 mirrored, 2 white flash,
  3 mirrored flash, 4 silhouette. Halos are drawn with `drawGlow`.
- `defT(name, art)` bakes a tile per land as `name@<theme>` for every `THEME_ORDER` entry. Slot characters
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
  (text entry: join codes and names, `G.entry`), `lobby`, `play`, `pause`, `fork` (picking the next
  land, `G.fork`; the host picks for a co-op team), `over`, `win`, `casino` (the Star Casino
  hall and its games, solo only).
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
- Keeping the save: `flushSave()` (`main.js`) writes on `pagehide` and when the tab is hidden;
  a tab whose save another tab changed (`Save._stale`) does not overwrite it but reloads in
  menus. On iOS Safari the save also rides in the address (`#SG1...`, throttled), since a
  Home Screen app gets its own empty storage and opens that address; Safari pages drop the
  manifest link for this. Anything that replaces the save and reloads sets `Save._frozen`.

## Adding content

- **Item:** entry in `ITEMS` (`name`, short `desc`, `apply(p)`, optional `unique`), plus
  an `icon_<id>` sprite in `art_ui.js`. The description must fit the banner.
- **Enemy:** `EDEF` stats, an `AI.<type>` state machine, `enemySprite` and `enemyColors`
  branches, optionally `glintAt` (pre-shot sparkle), then add the type to a `LANDS[].pool`.
  At most two stationary (`still`) enemies spawn per room.
- **Land:** a new `THEMES` entry and `THEME_ORDER`, a `LANDS` entry, `rock_<theme>` and
  `brk_<theme>` sprites, a song in `SONGS` in `audio.js`, ambient life in `fx.js`, and its
  place on the Star Road (`ROAD` in `data.js`). A run walks one path of land ids
  (`G.run.path`, saved with the run); `roadLand(depth)` gives the land at a depth, and lands
  not in `LAND` yet are skipped. Daily, weekly and Boss of the Week runs keep `CLASSIC_ROAD`.
  Each land needs `rule`, `hint` (two card lines at most, in every language) and `danger`
  (1-3) for the fork cards in `road.js`.
  When an act's last boss falls (`campHere()`), the boss room also gets the campfire
  (`stockCamp`): a `camp` prop that heals the team once and saves the run, a small shop and the
  frog reading a letter (`CAMP_LETTERS`, one per act, every line in every language).
- **Land mechanic:** `LAND_MECH[land id] = { enter, update, kill, every, drawLayer, leave }`
  (hooks in `level.js`, the lands' own rules and art in `lands.js`). `enter` / `update` /
  `kill` (a non-boss foe died) / `leave` run only on the host or solo; `every(dt, room)` runs
  on every screen each frame of play, for state both sides can work out alone (it starts
  from `G.wind = G.wind0`, the room's own wind, so a land may add a gust);
  `drawLayer(ox, oy, room, layer)` runs on every screen: layer 0 on the floor, 1 over foes
  and heroes but under shots and bullets, 2 over everything. Change tiles only through
  `setTile`. Anything placed from `room.seed` with `hash()` looks the same on every screen;
  a shared clock is `performance.now() - NET.off` on a client.
- **Meadow (Bloom Loop):** flower patches (`meadowPatches`) flatten under heroes and
  regrow; a foe that dies on a bloom leaves a `seed` pickup (never collected, `k.pot` holds
  its reward) that grows into a half heart, coins or a `starbit` (Starfall charge) unless
  someone stands on it. A gust every 12 s from floor 2 on (petals first) nudges hero shots.
- **Land rooms:** `LAND_LAYOUTS[land id]` holds a land's own 22x10 fight rooms, mixed into
  normal rooms about one time in three (`room.lay` names the one in use); `LAY_RULE[lay]` can
  give that room its own foe `pool`, `max` and `calm`. Check them with
  `node tools/dev.mjs layouts`. A curated first run uses `FIRST_POOL` (`firstrun.js`).
- **Shore (tide):** `tideU(room)` is a 24 s clock shared by every screen (-1 where there is
  no tide). At high tide the pools are shallow water: heroes and foes wade at `WADE` speed,
  shots pass; when it ebbs, waders are set on dry sand and shells wash up. Pier rooms draw
  boardwalks over fixed tile cells (`PIER_V` / `PIER_H`, symmetric so flips keep them).
- **Crystal Cave:** layout chars `p` (prism pillar, `T_PRISM`: splits hero shots in three,
  foe bullets into a fan), `s` (bell crystal, `T_BELL`) and `g` (gate, `T_GATE`). All three are
  solid (prisms and bells not for `fly`). The Crystal Clock room plays a four-note tune on its
  bells; shooting them in order opens the gate's alcove. Its state is an off-screen `clock`
  prop so clients draw it from snapshots. Change tiles through `setTile`, and before carving
  or sinking a tile ask `keepsJoined(room, i, v)` so no floor is cut off. A bullet with
  `b.shard` (a Shard Sprite's) breaks into five small pieces on a prism instead of three.
- **Cloud Steps (Puff Floor):** cloud a hero lingers on wobbles (`T_PUFF`) and puffs into sky
  (`T_PIT`) for `HOLE_T` s; falling costs half a heart and sets the hero back on cloud.
  Sunstone (`skyStone(room)`: layout `o`, door approaches, a few patches) never puffs; `u`
  vents hop a hero over the sky (`p.hopT`). No puffing in cleared rooms, the arena, the
  tutorial or during a boss's name card (`puffLive`). One Rainbow Slide room per floor.
- **Warden:** one per land, in a spare dead end (`rooms.js` turns it into room type
  `warden`, laid out like a boss room). A warden is an ordinary enemy with `EDEF.warden`
  (the HUD bar finds it, knockback and sleep do not move it) and follows every boss rule
  below: tells, `stagger`, a safe gap, a second phase. Add one with an `EDEF` entry, `AI.<type>`,
  art through `bossFrames`, the land's entry in `WARDENS`, a name in `FOE_NAMES`, a Book entry
  and `lang_hu.js` strings; `wardenCleared` pays an item per hero, coins and vault.
- **Lantern Woods:** foes can bring their own `EDEF` hooks: `light(e)` adds light, `draw(e, ox, oy)`
  returning true replaces the sprite (the Mime standing as a lamp), `hits(e, p)` is an area that hurts
  a hero (judged by `clientHits` on a client too). A `zap` marker with `c: 'fire'` is burning ground.
- **Mirrors and drift:** layout chars `7 9 3 1` are mirrors (`T_MIRROR` + 0..3, the glass
  faces up-left, up-right, down-right, down-left; flips turn them). `mirrorPass` turns shots and
  bullets that cross the glass by 90 degrees; one that meets the back pops, and a hero's shot
  turns the mirror a quarter step (`mirrorTurn`). `i` is ice (`T_ICE`): heroes and walking
  foes keep momentum (`driftMove`, `driftFoe`), a dash cancels the slide. A land adds a current
  or its own slippery ground with `LAND_MECH[id].drift(room, x, y, out)` (`out.grip`,
  `out.cx`, `out.cy`), which also carries shots and bullets at half strength.
- **Darkness:** each frame `lightReset(ambient)`, `lightAdd(x, y, r)` per light, then
  `drawLight(ox, oy, alpha)` from a layer-1 hook: a dithered `'0'` tint in 2px cells, never
  black. Game logic asks `lightAt(x, y)` (0 dark .. 4 lit). Keep bullets above the mask.
- **Page turn:** `pageCurl(room, corner)` is the 1 s tell, `turnPage(room, layout, corner)`
  swaps the interior to another 22x10 layout (same mirroring as the room), pushes anyone
  inside a new solid tile to free ground (`nudgeOut`, never damage) and draws the fold over
  0.6 s. Corners: 0 top left, 1 top right, 2 bottom left, 3 bottom right.
- **Garden upgrade:** entry in `UPGRADES` plus its effect in `applyUpgrades(p, up)`
  (it gets the player's own levels, because co-op clients bring theirs).
- **Wand:** entry in `WANDS` (stat multipliers, cost), a `wand_<id>` icon, its projectile
  in `drawShots` / `updateShots` (`s.kind`), and a sound in `WAND_SFX`.
- **Potion / belt item:** entry in `POTIONS`, a `pot_<id>` sprite, its effect in `useBelt`
  (timed effects live in `p.buff`), a HUD timer if it lasts.
- **Robe:** saves hold the robe's index, so only append: a new colour goes at the end of
  `LATE_ROBES` (`art_chars.js`: name, legend, tag, `how`), never into `SKINS` (0-7) or between
  the meme robes. The tag colour must exist in `FONT_COLORS` (text in other colours does not
  render). Late robes are locked until `Save.unl.robes` holds them (`robeFree` in `entities.js`).

## Bosses

Every boss, old or new, follows the same rules, so the cast looks and plays as one family.

- **Art:** body 32x32 (wide ones up to 40x32), one colour family plus one accent, 4-tone
  `PAL` ramp lit from the top left, `rim()` for the 1px hue-shifted edge light on the
  bottom right. `sculpt` gives the mass; hand-`stamp`ed horns, crowns, cracks and teeth
  break the silhouette (check the `sil` copy at 1x). Big `BOSS_EYE` eyes via `bossEyes`.
- **Frames:** `bossFrames(t, make)` bakes the full set: `_0 _1 _move _tell _atk`, the same
  five angry (`_p0` ...), `_stag`, `_die`. The `EDEF` `sprite` picks one through
  `bossFrame(e, f)`, which already switches to the angry look and the dazed frame.
- **Tell language:** every attack has a tell of at least 0.45 s. Yellow glint (`glintAt`)
  = bullets, pink ground ring (`G.markers`) = area hit, cyan sparkle lane (`lane(e, p)`,
  chosen when the tell starts) = charge or dash, cyan sparkles over the boss = stagger.
- **Fight rules:** bullets at most about 95 px/s, and always a gap or a safe spot; no
  unavoidable damage, no regeneration, no stun-lock. After its signature attack a boss
  calls `stagger(e)` (1.5 s, x1.5 damage, no touch damage). `bossPhase(e, n)` starts a new
  phase (0.5 s freeze, bullets cleared, banner); list the thresholds in `EDEF.phases` if
  they are not 0.5, so the HP bar shows the notches. Each boss has its own bullet family
  in `bossBullets`.
- **Entrance and exit:** `EDEF.intro` is the subtitle on the name card (the cine is
  `CINE_T`, skippable once the boss was met twice); the corpse uses `_die` and its Big
  Star flies back to the sky.
- **Checklist for a new boss:** `EDEF` (`hp`, `intro`, `sprite`, `colors`), `AI.<type>`,
  art through `bossFrames`, a name in `FOE_NAMES`, a Book entry, `lang_hu.js` strings, new
  client-drawn fields in `EF_EXTRA`, then the boss bots: a bot that stands still must
  lose, a circling bot should reach phase 2, a dodging bot should win in 70-100 s on
  Normal with no hit that came without a tell.

## Live ops, languages, couch co-op

- Events come from the device's clock (`events.js`): meteor showers (`SHOWERS`), the
  moon's age, seasons (`SEASONS`), Halloween (`holiday()`). `live.json` can add
  `events` (`kind: "rain" | "moon"`, `from`/`to` dates), `news` and `tuning` without a
  release; the service worker fetches it network-first.
- Daily and weekly runs stay deterministic: event effects must never draw from the seeded
  streams (use `rnd`, not `grnd`), and a twist that depends on the date is chosen from the
  run's key, not from `Date.now()`.
- Text goes through `tr()` inside `text()`, `textW()` and `wrapText()`. New on-screen
  strings need an entry in every `lang_*.js` (a missing one simply shows in English);
  build dynamic strings so a `#`/`*` key can match them, and check that the longer
  translation still fits.
- Couch co-op: extra controllers join on the pre-run screen (`G.couch`); their heroes
  carry `p.pad` and read `PADS` in `readCouchInput`. A claimed controller no longer drives
  player one (`couchPad`). Couch runs are not saved.

## Co-op (`net.js`)

- The host simulates everything; clients only move their own hero (so it feels instant),
  send their controls (`in` packets, presses as counters) and draw what the host sends.
  Never run game logic on a client (`NET.role === 'client'`): `clientPlay` only animates.
- Host → client: snapshots (`netHostTick`: heroes `PF`, enemies `EF`, shots, bullets,
  pickups, turrets, props when they change, and recorded effects; 30/s on a direct link,
  15/s through a broker), plus events: `start`, `floor`, `room`, `trans`, `tile`,
  `state`, `you`. New fields a client must draw go into those field lists (other files
  can add `PF_EXTRA` / `EF_EXTRA`).
- Brokers do not guarantee delivery, so the sync heals itself: snapshots carry the room,
  floor, a tile checksum and the team's vault total; a client that sees a mismatch asks
  for `resync`, and the host repeats the lobby and end-of-run state every second.
- `net.js` wraps `burst`, `poof`, `dust`, `toast`, `breakTile` and `Audio_.sfx/play/stop`
  on the host, so effects show on every screen without extra code. Other one-off
  particles (`part`) are local.
- Moving a hero on the host (room entry, placement) must go through `placeHeroes` or bump
  `p.tpN`, otherwise the client keeps its own position.
- Transport: free public MQTT brokers (`NET_RELAYS`, a tiny MQTT 3.1.1 client in
  `mqttOpen`). The host subscribes to `stargarden/<NET_PROTO>/<CODE>/h` on every broker;
  a client tries them in turn, writes `{ f: clientId, q: seq, m: message }` there and
  listens on `.../c/<clientId>`. Once joined it also uses a second broker (`clientAlt`);
  every message goes through both and is numbered, so copies are dropped (`fresh`). After
  `hi` the client offers a WebRTC link through the broker (`clientUpgrade` / `hostOffer`);
  `sendR` / `sendU` use it whenever it is open. TURN servers for that link go into
  `NET_TURN` (fixed credentials) or `NET_TURN_API` (an address that returns fresh ones).
  Bump `NET_PROTO` when the messages change incompatibly.
- Feel on a slow link: remote heroes and enemies are drawn `NET.delay` in the past,
  interpolated between snapshots (`sample` / `interp`, timed by the host clock `ht`).
  A client draws its own shots when it fires (`pred`, `predShot`); the host's copies of
  them (`ps`) are left out of its snapshots. A client judges bullets, touches and falling
  crystals on its own hero (`clientHits`, message `hit`); on the host those sources are
  wrapped (`NET.judged`) so they do not hurt remote heroes a second time.
- Rejoin: `hello` carries the player's anonymous id (`rj`). When a client drops during a
  run, the host parks its hero in `NET.parked`; the same player coming back (the co-op
  menu offers `REJOIN <code>` for ten minutes) gets that hero again.
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
