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
  data → level → scenery → entities → enemies → fx → ui → meta → the progress and content files →
  couch → cloud → yard → casino → art_casino → slot → cards → roulette → scratch → lounge → events → road → lands → wardens → woods → toy → snow → sun → library → forge → deep → moon → items3 → main → qr → net). `net.js` loads last because it wraps a few
  functions of the others (see *Co-op* below).
- **Only what is needed goes in.** No test framework and no debug UI in shipped code.

## File map (`src/`)

| File | Contents |
|---|---|
| `wg_*.js`, `lang_hu_wg.js` | **Wildgrove** survival mode (`G.state === 'wg'`), self-contained: `wg_data` (items/objects/recipes, append-only ids), `wg_world` (seeded chunks, caves), `wg_art`/`wg_art2` (sprites), `wg_game` (session `WGS`, mining, use), `wg_mobs`, `wg_render`, `wg_ui`, `wg_main` (screens, play loop), `wg_store` (IndexedDB, `.sgworld` export/import), `wg_net` (host-authoritative MQTT+WebRTC), `wg_cozy` (the cozy pack: carpets and banners in every petal colour, a pumpkin lantern, a pearl lamp, a shell chime, obsidian walls, bone meal that hurries crops, saplings and bushes on, two dishes; it wraps `wgUse`, `wgIcon` and `wgBuildAll` like `wg_extra`), `wg_sign` (signs to write on: placing or using one opens a board typed on the keyboard, tapped or walked with the pad, `wgSignOpen`; the words live in `WGS.signs` by dim + `x,y`, saved with the world, go out in the co-op welcome and as `sign` messages that the host checks through `wgSignSet`; the two nearest show in a bubble, a broken sign loses its words; player words are drawn with `wgRawText`, which sets `TR_RAW` so `tr()` leaves them alone), `wg_fish` (the fishing pack: `wgCatch(F)` picks the catch from the dimension, the night and the biome at the bobber; salmon, tropical fish, icefin, glowfish, the rare golden carp, shells and pearls at sea; three dishes, the FISH TROPHY and the ANGLER star; `WG_FISH` lists the fish), `wg_garden` (the garden pack: tomatoes, corn, strawberries and sunflowers as `crop_*` with four stages each, their seeds now and then in cut grass, seven dishes and the MARKET GARDEN star; `WG_GARDEN` lists the crops), `wg_orchard` (the orchard pack: apple, cherry, orange and lemon trees, `tree_<k>` bare and `tree_<k>_r` ripe with one crown shape, picked by USE (`wgPickFruit`), ripening again in about ten minutes on the host (a `wgGrowTick` wrapper, which also grows fruit saplings); a few wild oaks, birches, jungle trees and palms are fruit trees, chosen from the seed (a `wgGenOver` wrapper, `WG_ORCH_WILD`); saplings from two fruit and a stick, six dishes, a fruit basket and the ORCHARD star), `wg_rest` (the rest and tea pack: objects with `seat` (chair, couch, park bench, log stool, picnic blanket) seat the hero on USE, `p.sit = { tx, ty, dim }`, healing a heart every `WG_SIT_HEAL` s; any step, knock or trip stands them up; a seated hero is drawn lowered with folded shins and goes out over co-op as facing `'S'` (a `wgnSend` wrapper); tea bushes among the ferns, four teas (`WG_TEA`) that heal more drunk seated and light TEA TIME, cookies, a tea set), `wg_farm` (the farmyard pack: a hen house that ticks like a beehive (`kind: 'hive'` with `prod: 'egg'`, its USE is its own), a compost bin whose meta counts scraps to `WG_COMPOST_N` (`wgIsScrap`) and gives bone meal, its heap drawn by a `wgDrawObj` wrapper; a birdhouse whose songbirds (`wgBirdSpr`) hop about by day, drawn after the ambient life, and keep to its roof while a hero is near; three egg dishes and the HAPPY HENS star), `wg_album` (the album from the pause menu's ALBUM button: every food, the golden carp and the bugs (items with `album: 1`), `wgAlbumList`, raw before made, in colour once held (`p.seen`) and as a dark shape before; it walks its own grid with the arrows and pad (a row at a time, off the edge to its buttons) and lights FULL PANTRY at half), `wg_music` (the music pack: a music box and a gramophone, `o.music` their reach in tiles, whose meta is the tune that plays (`WG_TUNES`, the `mb_*` songs in `audio.js` with `box: true`), USE winds on to the next and rests after the last; `wgTuneNear`, twice a second, lets the `wgSong` wrapper play the nearest one in reach, so every co-op screen hears the same; notes rise from a playing one, a shell chime close by tinkles (the `chime` sound), the MUSIC LOVER star), `wg_post` (the post and pots pack: a mailbox whose letter from the frog (`WG_LETTERS`, picked by the day and the seed, so every screen reads the same) waits while `meta.mail` is not today, its flag drawn up or down by a `wgDrawObj` wrapper; USE opens the `mail` screen (`wgDrawLetter`, closed by THANK YOU, Escape or USE) and drops a small gift from `WG_GIFTS`; flower pots in the five petal colours and a potted fern; the PEN PAL star), `wg_bugs` (the bug net pack: USE the net near a butterfly by day or a firefly by night to catch it; the bugs are wg_render's ambient life, noted as they are drawn in `WGBUG.seen` (cell, n, world x and y, kind), a caught one kept out of sight by `WGBUG.gone` for `WG_BUG_GONE` seconds; nothing goes over the net, the catch is your own; a firefly jar (a lamp), framed butterflies, a bug in hand let go with USE (`WGBF`), the BUG CATCHER star; `wgPaint` draws a small pixel map), `wg_home` (the homing feather: USE it, even with the aim out of reach, and stand still for `WG_HOME_T` seconds (`WGS.homing`); it carries the hero to `p.spawn` or the world's spawn, across dimensions, a step or a hit breaks the glow, and it is never used up), `wg_winter` (the winter pack: USE on bare snow with an empty hand or a shovel scoops a snowball and leaves the snow; snowmen in three scarves, snow walls for an igloo, an ice lantern with a candle inside, hot cider and the FROSTY FRIEND star), `wg_gaze` (stargazing: a telescope USEd at night, outdoors or above the clouds, opens the round view `WGS.scr === 'gaze'` (`WGS.gaze`); each night `wgSignTonight()` hides one of the eight `WG_SIGNS` there, the same on every screen, a night counting from its evening; sweeping the view over its stars lights them and the sign goes into `meta.stats.signs`; the star chart easel shows the found ones; shooting stars pass; the STARGAZER star), `wg_breeze` (kites and pinwheels: a kite in hand flies over its hero outdoors (`wgKiteHeld`, drawn after the world with its string, tail and shadow, places in `WGKT`), USE tugs it; the kite's colour rides in the `p` and `ps` messages (`kt`, index 11) so friends see it; pinwheels in the petal colours turn through four frames; the HIGH FLYER star), `wg_paths` (paths: grounds flagged `path` with a `speed` over 1 (gravel, cobblestones, stepping stones, a boardwalk that may also go over shallow water), the dug dirt path quicker too, floors indoors at a walk; their tiles drawn by a `wgGroundTex` wrapper), `wg_swing` (the garden rest pack for the seats of `wg_rest`: a garden swing whose seat and rider sway while anyone sits on it (`wgSwayAt`; `wgSeatedAt` also sees a friend sent as seated), a bathtub that heals twice as fast as a chair with its front drawn over the bather, a bird bath where a little bird splashes by day), `wg_pond` (the pond pack: a rowboat in hand on water swaps the water's slowness for a brisk pace while the hero's move runs (`wgBoatHeld`), drawn as the hull, the hero from the waist up, the near side over them, oars and a wake, side on or end on; the boat rides in the `p` and `ps` messages (`bt`, index 12) so friends row too; the village well can be built and fills a bucket, in new round-stone art; lily pads come up whole and go on water only, a water lily too; a duck and her ducklings paddle round a pond by day, spots found once per 160 px cell (`WGDK`); the ROW YOUR BOAT star), `wg_hearth` (the hearth pack: a fireplace is a `fire` station with light, and a seat within `WG_HEARTH_R` tiles of one heals half as fast again; two fireplaces in three have a cat asleep on the free tile in front (`wgCatAt`, its coat from the tile's hash, the same on every screen), USE on it wakes it to purr, a local `WGS.purr`; a rocking chair rocks with its sitter (`wgRockAt`); a kitchen dresser is a storage; the HEARTH AND HOME star), `wg_dairy` (the dairy pack: `WG_MOBS.cow` takes a share of the meadow and highland spawns; a bucket milks a cow where the creatures are simulated, as shearing does (`m.milked`, `WG_MILK_WAIT`), wheat brings a calf; a butter churn is a `churn` station (`WG_AT.churn`) for butter and cheese; five milk dishes and the DAIRY FARMER star. A client leaves out a creature type it does not know (`wgnMobs`), so an older guest never breaks on a newer host's animals), `wg_trees` (the trees through the seasons: `wgSeasonTrees` swaps each tree's sprite list in `WGA.obj` for the season's, recoloured once from its own art by `wgTreeTint` (`WG_SEASON_TREES`: the crown's ramp, autumn ramps, a winter ramp): apple blossom in spring, autumn palettes laid out palette after palette so a tree keeps its shape, snow on the crowns' tops in winter; citrus and pines stay green; the ALL FOUR SEASONS star), `wg_hats` (hats: USE one in hand to put it on or take it off (it stays in the pack); the worn hat is `p.look.hat`, a number in `WG_HATS`, drawn into the hero's own sprite by a `wgPlayerSpr` wrapper, so it shows seated, rowing or wading; the host shares it inside the look it sends, a guest sends theirs as `ht` in the `p` message, checked by `wgnHat`; the HAT TRICK star), `wg_pondlife` (pond life: fish glide as shadows under deep water, drawn by a `wgDrawLiquids` wrapper so the shore and swimmers stay over them, and now and then leave a ring; dragonflies in three colours (`wgDflySpr`) hover and dart over the shallows on spring and summer days, not in rain, noted in `WGPL.seen`; both come from 128 px cells (`wgPondSpot`, `wgPondCells`) whose ground is looked at again every 2 s and forgotten in another world; the bug net catches a dragonfly unless a butterfly is nearer (a caught one stays away for `WG_BUG_GONE` s, `WGPL.gone`), one in hand is let go with USE; a framed dragonfly and the POND DIPPER star), `wg_bike` (the bicycle: held on dry ground (`wgBikeHeld`, `wgCanRide`: not seated, not in water) the ground under the hero is made `WG_BIKE` times quicker for the hero's move, capped at `WG_BIKE_MAX`, then put back; the tiles ridden count for FREEWHEELING; USE rings the bell; a rider is drawn by a `wgDrawPlayer` wrapper, side on from `wgBikeArt` pieces with the arm on the grips (`wgRiderSpr`) and a bent leg on the turning pedal, end on with the wheel between the feet; a guest sends `bk` in the `p` message, the host lists it at index 13 of `ps`), `wg_ways` (waystones: USE one to open the `way` screen listing the others (`wgWayList`: nearest first with a distance and an arrow, another dimension last), named by a sign beside the stone or its land (`wgWayName`; a sign's words go out raw, also in a `raw` toast); picking one starts a glow like the homing feather's (`WGS.waying`, `WG_WAY_T`) that carries the hero beside it, across dimensions; the stones are listed in `w.meta.ways` (`'dx,y'` keys) by a `wgSetObj` wrapper on every screen, ride in the co-op welcome (`wgnWelcome` / `wgnEnter` wrappers, keys checked), and show on the map (`wgMapWays`); the host drops a stone that is gone; the WAYFARER star), `wg_pets` (more companions for `p.pet`: `WG_PET_FOOD` says what wins each (the fox's meat, a rabbit's carrot, a frog's firefly, a crab's raw fish), two times in five, and a new friend sends the old one back to the wild; USE with an empty hand on a bare tile pets your companion (`patT`, `patAt`: a wiggle and a floating heart, drawn by a `wgDrawMob` wrapper); all of it where the creatures are simulated; the BEST FRIENDS star), `wg_wardrobe` (a wardrobe whose USE opens the `robe` screen: SKIN, HAIR and SHIRT cycle `p.look` as on the new-world page, the hero shown walking from four sides at native size, a hat kept; a guest sends the look as `lk` (skin * 100 + hair * 10 + shirt) in the `p` message, read by `wgnLookNum`, and every look from the net (hello, `ps`) goes through `wgnLook`, so an odd one never breaks a screen; the NEW LOOK star), `wg_rainbow` (a rainbow after the rain: when a daytime rain stops outdoors (`WGBOW.wet` to dry, `wgNight` under 0.3), a soft arc fades in over the view for `WG_BOW_T` seconds (`wgBowAlpha`), drawn by a `wgDrawWeatherFX` wrapper, so a guest sees it with the host's weather and nobody with the weather effects off; the arc is baked once per screen size (`wgBowArt`); the OVER THE RAINBOW star), `wg_lanterns` (sky lanterns: USE one in hand at dusk or at night under the open sky (`wgSkyOpen`, `wgNight` over 0.1) to let it go; it rises from over the hero's head, slower as it climbs (`wgSkyAt`), sways on its own breeze, shrinks through four sizes and fades after `WG_SKY_T` s (`WGSL.list`, at most `WG_SKY_MAX`); drawn by a `wgDrawLight` wrapper over the dark with a warm halo in the light's 2px cells and a little ground light while near; the release goes out as a `sky` message that the host checks (`wgSkyAdd`), rate-limits per friend and passes on, each screen flying it from its own clock; the LANTERN NIGHT star), `wg_puddles` (puddles: `WGPD.wet` fills in the rain (about 40 s) and dries after it (about two minutes); `wgPuddle(tx, ty)` says from the tile, the world's seed and the wetness alone whether a tile of `WG_PUD_GROUNDS` with nothing on it holds one and how big (each its own threshold, so they come and go one by one), so every screen sees the same; drawn flat on the ground through a `wgChunkUpkeep` wrapper (it runs right after the chunks are painted), ringed by raindrops; a step in one splashes (`wgPudSplash`, friends' steps too, at most every 0.3 s each) and counts once per puddle; none with the weather effects off; the PUDDLE JUMPER star), `wg_mallow` (marshmallows: USE one on a `fire` station puts it on a stick over the flames (`WGS.mallow`, drawn by a `wgDrawAmbient` wrapper, the held icon hidden meanwhile); `WG_MALLOW` times it from white through golden (a chime) and brown to smoke and fire; USE again, a step back or the fire gone pulls it (`wgMallowPull`): raw, TOASTED or BURNT, dropped at the feet if the pack is full; a MALLOW SANDWICH with cookies; the GOLDEN BROWN star for one pulled while golden), `wg_emote` (emotes: G, the pad's RT or, with friends in the world, a touch button under MAP (a `wgTouchBtns` wrapper) opens the `emote` row of six (a wave, a heart, a smile, a note, a question, Zz; the arrows, a number or a tap pick); `wgEmote(k)` shows it over the hero for `WG_EMO_T` s (`WGEM.me`), drawn after the world in a speech bubble; a guest sends `emo` to the host, which checks it, rate-limits it and passes it on with the guest's pid (the host's own go out as pid 0), kept by pid in `WGEM.f`; the SAY IT WITH A SMILE star for all six), `wg_leaves` (leaf piles: in autumn (`wgSeason()` 2) `wgLeafPile(tx, ty)` puts a heap on some grass tiles beside a tree that turns (`WG_SEASON_TREES` with autumn ramps), from the tile and the seed alone; walking in, yours or a friend's, scatters it (`WGLF.gone`, a flurry, the `cut` sound), strewn for half of `WG_LEAF_BACK` s, small after, then whole; drawn on the ground through a `wgChunkUpkeep` wrapper; the LEAF LEAPER star after ten), `wg_prints` (footprints: each step on snow, sand or mud (`WG_PRINT_G`), yours or a friend's (from their `walkT`), leaves a 2x2 print, left and right, that fades over `WG_PRINT_T` s in three steps; not on a bike, in a boat or seated; at most `WG_PRINT_MAX` (`WGFP.list`), each screen's own, drawn on the ground through a `wgChunkUpkeep` wrapper), `wg_hats2` (more hats appended to `WG_HATS`, never reordered: a mushroom cap, a chef's hat, a pumpkin hat, bunny ears; the colours they need are added to `WG_HAT_KEY`; the HAT COLLECTOR star for six), `wg_wishes` (the frog's little wishes: `wgWishesToday()` picks three of `WG_WISHES` from the day and the seed, the same for every friend; counted in `m.wish` (started over on a new day) through `wgBreak` (trees, rocks, flowers, tall grass, only by the player), `wgEat`, `wgEmote` and the walk in tiles (a jump is no walk); each granted rings a chime, all three bring one gift from `WG_GIFTS`; a card beside the pause menu's main page shows them, a toast tells when a new day brings new ones; the LITTLE HELPER star after five days), `wg_paint` (the easel: USE opens the `paint` screen, a 12x12 canvas in `WG_PAINT_COLS` (0 is the bare canvas), mouse or finger dabs and drags, a right click or pad X rubs out, the arrows and pad walk a cursor; DONE, Enter or Start keeps it in `w.meta.paints` by dim + `x,y` (a bare canvas clears it, at most `WG_PAINT_MAX`), drawn on the easel in the world from a cached canvas (`wgPaintCanvas`); a guest sends `paint`, which the host checks through `wgPaintSet` (the easel must be there), rate-limits and passes on; the welcome carries them; a broken easel loses its picture (a `wgSetObj` wrapper); the LITTLE ARTIST star; the host takes a guest's picture, like a sign's words, only for an easel beside that guest's hero), `wg_tank` (a fish tank: USE a fish on it to let it in, two at most, each in its own lane; who is inside is the tile's meta, an index into `WG_TANK` (every way to keep two of the six `WG_FISH`, `WG_TANK_IX` the other way), so it goes over co-op with the tile; USE with anything else feeds them (a local `WGTK.fed`: flakes sink, the fish dart about); a bubble rises, a glowfish lights the tank at night, a broken tank drops its fish; the FISH KEEPER star), `wg_clock` (a grandfather clock whose hands (in eight directions, `WG_DIR8`) and pendulum are drawn over its sprite from `WGS.clock`, striking a bell at dawn, noon and dusk (`WG_CLOCK_STRIKE`) for a hero within `WG_CLOCK_R` tiles; a sundial whose shadow lies opposite the sun, none by night or underground; USE tells the time, `wgTimeText`), `wg_books` (tales on the bookshelf that homes and village houses already have (`book` on its object): USE opens the `tale` screen with the tale the shelf has out, the tile's meta turned by its hash (`WG_TALES`: a title, an icon, one paragraph that `wrapText` fits, so a translation is one string), closing it (THE END, Escape or USE) puts the next one out for every screen; the BOOKWORM star for all eight, `stats.tales` a bitmask), `wg_festive` (a festive tree whose lights step through `WG_FEST_COLS` and glow at night; each winter day a gift from `WG_FEST_GIFTS` waits under it, drawn while the tile's meta is not today's mark (`wgFestMark`: the day % 255, plus one), so on every co-op screen it is gone once someone opens it; the FESTIVE SPIRIT star), `wg_drift` (petals and leaves: every 0.8 s the trees in view that let something go this season are listed (`wgDriftCols`: a spring blossom's colours from `WG_DRIFT_BLOOM`, or the autumn palette `wgDrawObj` picks for that very tree), and about once a second one lets a petal or a leaf drift down from its crown, settle at its foot and fade (`WGDR.list`, at most `WG_DRIFT_MAX`); ambient life, each screen its own, outdoors only, off with the ambient life), `wg_garland` (string lights: a light post strings to the nearest post on its right within `WG_GARLAND_SPAN` tiles, a row up or down at most (`wgGarlandTo`), drawn as a sagging wire with bulbs by the left post's `wgDrawObj`, glowing at night; all from the tiles, nothing to send; the GLOWING GARDEN star when a placed post meets another), `wg_skip` (skipping stones: USE a stone on water throws it; `wgSkipPath` works out the touches from the throw (from, angle, skips, first hop to the aim) and the tiles alone, hops shorter and quicker each time, sinking after its skips or resting on dry ground; a guest's throw goes out as `skip` (the host checks it came from beside that guest, rate-limits and passes it on), each screen flying it only when near (`WG_SKIP_NEAR`); rings at each touch, the count told when it stops; the STONE SKIPPER star for five), `wg_clouds` (cloud shadows: a field of faint shadows laid out from the seed in cells (`wgCloudList`) slides with the world's clock (`wgCloudT`, the day and the hour), so every screen sees the same; drawn first in a `wgDrawAmbient` wrapper, under the flying things and over the ground and all that stands on it; `WGCS.k` fades them in on a clear day and out at dusk, under weather, underground and with the weather effects off; each shape baked once in 2px cells with a dithered rim), `wg_sparkler` (sparklers: held, one is lit (`wgSparkHeld`, not in water) and burns down after `WG_SPARK_T` s of holding; it is drawn by a `wgDrawPlayer` wrapper instead of as the held tool (mirrored facing left) with sparks and a light at its tip; a guest sends `sk` in the `p` message and the host lists it at index 14 of `ps`, so friends' sparklers show; the SPARKLE star), `wg_seaside` (the seaside pack: a shovel on bare sand (not under your own feet) heaps a mound, `sandcastle`, and each USE with the shovel builds it up a stage, its meta (`WG_CASTLE_TOP`); a shell on the last stage adds shells and a flag, the SANDCASTLE star; a lighthouse in red and white stripes whose lamp glows by night with a beam of three lights sweeping round it (`wgBeamA`, from the world's clock, so every screen sees the same); the KEEPER OF THE LIGHT star), `wg_vane` (a weather vane: a copper rooster on an arrow over a post, turning through five frames with the wind's heading `wgWindA`, worked out from the world's clock alone (gusty in the rain); USE tells the forecast (`wgForecast`: fair, rain coming, rain that lasts, a storm that lasts, clearing soon) from the weather and `WGS.wxT`, which only the host knows, so a `wgnAll` wrapper puts it in the `clk` message as `fc` and a guest reads it into `WGVN.fc`; rain that starts within 240 s of the vane saying so lights WEATHER WISE), `wg_rainbarrel` (a rain barrel: the host fills each one under the open sky a step at a time while it rains, up to `WG_BARREL_FULL` in its meta; an empty bucket USEd on it comes away full; its water is drawn in the open top by level, rippled in the rain; the RAINY DAY star), `wg_petbed` (a pet bed: while the hero rests near one (seated, or standing still for `WG_PETBED_STILL` s at night), the nearest within `WG_PETBED_R` tiles (`wgPetBedNear`) draws the companion: a `wgUpdateMobs` wrapper takes back its step and walks it to the bed, where `m.nap` is set; one that cannot get there gives up for 20 s (`bedNo`); all where the creatures are simulated; the nap rides at index 9 of the `mobs` message (a `wgnSend` wrapper, read by a `wgnMobs` wrapper); a sleeper is drawn with a slow breath, the bed's front rim over its feet and z's by its head; the SWEET DREAMS star), `wg_fireworks` (fireworks: USE one in hand at dusk or at night under the open sky (`wgSkyOpen`) and it goes up beside the hero, rising for `WG_FW_UP` s (`wgFwAt`) to burst into two rings of sparks in one of `WG_FW_COLS` (`wgFwSpark`) that spread, sag, trail and twinkle out by `WG_FW_T`, with a white flash and a moment's light on the ground; all from the firework's seed (`WGFW.list`, at most `WG_FW_MAX`), drawn by a `wgDrawLight` wrapper over the dark; the launch goes out as an `fw` message that the host checks, rate-limits per friend and passes on, like a sky lantern; the bang only for those near; the FIREWORKS NIGHT star after five), `wg_beach` (a day at the beach: a deck chair, a seat for `wg_rest`, and a solid beach umbrella with a wide shade, each in three stripe colours (`WG_BEACH_COLS`) picked by the tile's hash; sitting in a deck chair on sand lights BEACH DAY), `wg_feeder` (a bird feeder: seeds USEd on it fill its meta two steps at a time up to `WG_FEED_FULL`; while it holds seeds, on dry days outdoors, four birds of its own (`WG_FEED_BIRDS`, `wgFeedBirdSpr`) visit its two perches, a visit every `WG_FEED_SLOT` s worked out from the tile and the world's clock alone (`wgFeedVisit`), flying in, pecking and flying off, so every screen sees the same; none within `WG_FEED_SHY` px of a hero, none with the ambient life off; feeders in view are noted by a `wgDrawObj` wrapper and their birds drawn by a `wgDrawAmbient` wrapper; a perched bird seen from near counts in `stats.birds` (a bitmask, with a toast the first time); the host lets them eat it down; the BIRDWATCHER star for all four), `wg_eggs` (the spring egg hunt: in spring (`wgSeason()` 0) `wgEggAt(tx, ty)` puts a painted egg (`WG_EGG_COLS`, striped or spotted) on some bare grass tiles beside a plant or a flower, from the tile, the seed and the day alone, a new set each day; drawn on the ground through a `wgChunkUpkeep` wrapper; walking onto one or USE picks it up (`wgEggTake`), dropped at the feet if the pack is full; the hunt is each hero's own, the day's finds kept in `w.meta.eggs`; six make an egg basket to set out; the EGG HUNT star after ten), `wg_hats3` (a third box of hats appended to `WG_HATS` after `wg_hats2`'s, never reordered: a party hat, a witch hat (its purples added to `WG_HAT_KEY`), a sailor cap and a frog hat; the MAD HATTER star for ten), `wg_icefish` (ice fishing: a rod USEd on bare ice, not under your own feet, cuts an `ice_hole` (solid, closed again with a pick, nothing dropped); the rod on the hole fishes through it (`WGS.fish.ice`), where a `wgCatch` wrapper makes `WG_ICE_BITE` of the catches icefin; a snow globe whose flakes drift inside the glass and whirl for 2.5 s when USEd (`WGSG.shake`, this screen only); the ICE FISHER star), `wg_skates` (ice skates: held on ice (`wgSkating`: not seated) the ice is made `WG_SKATE` times quicker and not slippery while the hero's move runs, then put back; let go of the keys the hero glides on (`WGKS.vx`, `vy`, dying away by `WG_SKATE_GLIDE`); a skater is drawn standing on blades (a `wgDrawPlayer` wrapper), and leaves a thin swaying line on the ice, friends too, that fades over `WG_SKATE_MARK` s (`WGKS.marks`, drawn through a `wgChunkUpkeep` wrapper); a guest sends `sa` in the `p` message, the host lists it at index 15 of `ps`; the ICE DANCER star), `wg_map` (the world map on M / pad Back / touch MAP from the chunks seen, `w.meta.seen`; a pin per hero, `p.pin`, with a HUD arrow; controller play: sticks move and aim, A mines, X uses, LB/RB hotbar, a stick pointer in the backpack where RB is a shift-click). The backpack and chests (`wg_ui`): shift-click moves a whole stack (`wgMoveStack` with slot ranges, the backpack before the hotbar), SORT tidies the backpack, a chest has TAKE ALL / STORE ALL (the hotbar stays in hand), shift-click on a recipe makes five; chests within five tiles count for the recipe book (`wgNearChests`, `wgTakeNear` spends the pack first) and STASH puts backpack stacks into a nearby chest that already holds that item (`wgStash`), both alone or as the host only, since a client's chest copy can lag; the tip under the pointer names a thing and says what it does in a line or two (`wgTipLines`: food, damage, defence, uses left, how many recipes use it; each line its own string for `tr`, drawn by `wgDrawTip`); a recipe is pinned with a right click, pad X or a tap on the tack in its row's corner (`p.track`, saved with the hero) and shown top left with what the pack and nearby chests hold (`wgDrawTrack`), until it is made; `wgSmallBtn` is the small mouse/touch button these and the map share. Stacks are spent from the backpack first; a hotbar slot that still empties in play (a tool worn out) is refilled from the backpack (`wgRefillHand`: the same item, else the best tool or weapon of its kind; never after a drop or a menu). Alone, a menu stops the world; a host with friends in it keeps it running behind every menu, the map and the death screen (`wgHostLive`, `wgHostWorld`: clock, weather, mobs, crops, the autosave, with the host's hero standing still). Server: `tools/wg-server.mjs`. Each chunk's ground is baked once (`wgChunkArt`); a ground change repaints only that tile and its neighbours (`wgDirty(..., true)` lists them, `wgChunkReady` paints), an object change repaints nothing, chunks next to the view are baked ahead and far ones let go (`wgChunkUpkeep`). Natural ground stays calm: one small feature per tile at most. Tests: `sh qa/_wg_all.sh` (generation and density, save and reload, every item obtainable, frame cost, the map, the backpack and chests, a host's menus, co-op join...) |
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
| `scenery.js` | how a room of every land (`SCN_LANDS`: meadow, shore, crystal, the Star Well, the Snowglobe, the Sun Temple, the Moon Garden, the Lantern Woods, the Glow Deep, the Story Library, the Ember Forge, the Toy Attic, the Cloud Steps) looks, baked from its seed: ground, decals, pits, rock groups, the top wall's face and lamps, tall pieces, the boss ring, the static room layer (`renderRoomStatic`), the Shore's high-tide water over its pools (`shallowLayer`); tall grass; the title scene |
| `entities.js` | players (input, movement, combat, down/revive, robes, seat colours: `SEATS`, `seatCol`, the ring at their feet and your arrow, `seatMark`), wand shots, bolts, belt / potions, turrets, pickups, particles, props, combo, Starfall, warp |
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
| `items3.js` | the third item batch (comfort, defence, harder hits, co-op items) with its sets, combos and icons; its hooks (`itemFloorStart`, `itemBossDown`, `heartHeal`, `hurtInv`, `reviveRate`, `knockOf`, `treasureCount`, `shopCount`) are called from main.js, entities.js and enemies.js; it also wraps `shotHitDmg(s, e)`, `itemTick`, `playerShoot`, `useBelt` and `itemRoomClear`, and adds the movement flags a client needs (`galosh`, `anchor`, ...) to `PF_EXTRA` |
| `foes.js`, `bosses.js`, `rooms.js`, `story.js` | the second wave of foes; alternate bosses, the Star Well and Big Stars; special rooms; the frog's lines and the ending |
| `heroes.js`, `options.js` | the four heroes; wand aspects, Star Trials, Quick Run, assist, bullet shapes, key remapping, the arena save |
| `daily.js`, `events.js` | the Daily Star Run, Weekly Challenge and share card (from `DAILY_ROAD_FROM` the whole road deals the lands; older keys keep the classic three); the sky calendar (Star Rain, Moon Night), seasons, Boss of the Week |
| `couch.js`, `cloud.js` | couch co-op (extra controllers); save codes, cloud backup, leaderboards and friend codes, the community goal, bloom reminders |
| `casino.js` | the Star Casino (`G.state` `casino`, from the title menu): chip wallet `cas()` (in `Save.casino`), house edges (`EDGE`), `CASINO_TUNING` (live-tunable), comp tiers, the walkable hall and the VIP lounge (`CAS.room`, `casSpots()`, Gold card), life on the floor (critters, the fountain, Star Rain chips, Halloween pumpkins), `wheelRaster` for both wheels. `casShown()` (visited and not hidden) gates everything outside: the casino quest, Cosmo's letter, the LUCKY CHIP constellation (`cas: true`, filtered by `skyList()`) and the Book's CASINO page. Rounds call `note('cas', game, what)` |
| `slot.js`, `cards.js`, `roulette.js`, `scratch.js`, `lounge.js` | the Star Slot and three land slots (fixed reel strips, jackpot); blackjack and video poker; European roulette and the Big Wheel; scratch cards; the VIP lounge's Sic Bo and the Prize Counter |
| `holdem.js` | the lounge's Hold'em sit-and-go: hand evaluator, no-limit betting with side pots, three bots (tight frog, odds owl, bluffing fox), the hand log replayed after a reload. The prize is paid flat (no quiet luck) |
| `art_casino.js` | chips, the hall's furniture, playing cards, dice and prizes |
| `art_heroes/more/items/foes/bosses/rooms/garden.js` | art for the content added after the first release |
| `art_scenery.js` | scenery art: obstacles and breakables per land, tall pieces (trees, palms, crystals), things on the top wall, lamp flames, tall grass |

`tools/dev.mjs` holds developer checks that drive the real game in headless Chromium (Node 22+,
nothing ships): `layouts` (every `*LAYOUT(S)` const: size, door lanes, BFS reachability),
`sheet [regex]` (sprite contact sheet at 3x) and `bot [land] [floors] [items]` (an invulnerable bot
clears a run, holding the given items, and reports errors and frame times). Run `layouts` after touching any layout.
The headless browser itself lives in `tools/browser.mjs` (`open()` gives `ev`, `shot`, `press`, `realErrors`,
`close`; it finds Chrome or Edge, or takes `CHROME=`); the `qa/` scripts import it through `qa/lib.mjs`.

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
- Scenery (`scenery.js`, the lands in `SCN_LANDS`) is worked out from `room.seed` and the
  tiles alone (`hash`, `vnoise`, `worley`, `scnRand`), never from the gameplay streams, so
  every co-op screen and a resumed run draw the same room. Rocks are grouped: a lone `#` is
  an obstacle, a run of them a ridge (hedge, stone wall), an exact 2x2 block a giant (tree,
  palm, crystal) drawn as a tall piece sorted by y (display-list kind 7); in a land with a
  `POST` entry two rocks stacked in a column stand as one tall post (an obelisk). A land's own
  pieces (prisms, bells, the gate) are drawn with `tileArt`; a land layout built of
  breakables uses one kind (`LAY_BRK`), and a layout can name its own rock (`LAY_ROCK`) and
  tall piece (`LAY_TALL`). A rock `rockArt` draws its own way (a moon well, slag) always
  stands alone. Every per-land table (`SCN_GROUND`, `SCN_DECALS`, `CAP`, `PIT`, `RIDGE`,
  `FACE_GROW`, `FACE_THINGS`, `OBSTACLES`, `BREAKABLES`, `TALL`, `RING`, `GRASS_BITS`...)
  needs an entry for a new land with scenery. `FACE_GROW` can give the face its own `wall`,
  a `spill` over its top (snow) and `drip`s hanging from it; `FACE_KEEP[t]` keeps stretches
  of the face clear of hung things (the forge's wall pipe). A land's `THEMES[t].paint(g,
  room)` draws its floor marks over the scenery (plates, vents, sunstone). Tiles that change often stay out of the baked base: `SCN_TILE[t]` says what the
  base sees (a frozen pond is still water) and `SCN_OVER[t](g, room)` draws the change on the
  static layer (a puffed cloud's hole). A land's own ground goes into the base through `SCN_BASE[t]` (the Sun Temple's
  quicksand, the Toy Attic's rug, keys, record and belts, the little clouds in the Cloud Steps' sky; tiles it draws are listed in `BASE_T`), a ridge can be topped by `RIDGE[t].topAt`.
  Every `gi_*` sprite gets a see-through `_d` copy (`seeThroughTall`).
- Tall grass (`room.grass`, one byte per tile: 1 grass, 2 cut) grows in `start`, `normal`
  and `challenge` rooms of the lands in `GRASS_LANDS`, never in front of doors or where
  the land's `LAND_MECH[id].noGrass(room, c, r)` says (the pier, the bee ring, the clock's
  alcove); the Meadow's flower patches keep off it. Shots and rolls cut it on the host
  (`cutGrass`, sent as the `grass` event and kept in `roomMsg`, the tile checksum and the
  run save); feet in it hide behind `grassFront`.
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
- Query input through the shared code lists (`K_UP`, `K_OK`, `K_BACK`... in `ui.js`). Hits are cleared after
  each update; draw code that reads input (Wildgrove's menus) runs inside `withFrameInput` (`input.js`),
  which shows it exactly what the frame's updates saw (each press once; a frame with no update draws with
  none, so a fast screen never clicks twice). The global M (mute) and F (fullscreen) keys stay out of Wildgrove.
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

- **Item:** entry in `ITEMS` (`name`, short `desc`, `apply(p)`, optional `unique`, `rare`,
  `set`, `team`), plus an `icon_<id>` sprite (16x16). The description must fit the banner. A
  `team` item is offered only when friends play along (`teamOk` in loot.js). A flag that changes
  how a hero moves goes into `PF_EXTRA`, since a client moves its own hero.
- **Enemy:** `EDEF` stats, an `AI.<type>` state machine, `enemySprite` and `enemyColors`
  branches, optionally `glintAt` (pre-shot sparkle), then add the type to a `LANDS[].pool`.
  At most two stationary (`still`) enemies spawn per room.
- **Land:** a new `THEMES` entry and `THEME_ORDER`, a `LANDS` entry, `rock_<theme>` and
  `brk_<theme>` sprites (for scenery: a `SCN_LANDS` entry and its scenery tables, see *Rooms
  and coordinates*), a song in `SONGS` in `audio.js`, ambient life in `fx.js`, and its
  place on the Star Road (`ROAD` in `data.js`). A run walks one path of land ids
  (`G.run.path`, saved with the run); `roadLand(depth)` gives the land at a depth, and lands
  not in `LAND` yet are skipped. Daily, weekly and Boss of the Week runs keep `CLASSIC_ROAD`.
  Each land needs `rule`, `hint` (two card lines at most, in every language) and `danger`
  (1-3) for the fork cards in `road.js`.
  When an act's last boss falls (`campHere()`), the boss room also gets the campfire
  (`stockCamp`): a `camp` prop that heals the team once and saves the run, a small shop and the
  frog reading a letter (`CAMP_LETTERS`, one per act, every line in every language).
- **Land mechanic:** `LAND_MECH[land id] = { enter, update, kill, every, drawLayer, leave, noGrass }`
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
  tutorial or during a boss's name card (`puffLive`). One Rainbow Slide room per floor. The
  layout's own sky is in the base (`room.pit0`, from `build`); a puffed hole is drawn over it
  (`SCN_OVER.cloud`) and grows back from the base itself (`baseDither`).
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
  translation still fits. `*` keys are compiled when a language is added (`addLang`); a file
  that adds to a table later (`lang_hu_wg.js`) calls `langWild(id)` at its end, and its `*`
  keys must not be so loose that they catch the main game's strings.
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
  breaks or is cut (`room.dirty`). Under it, the scenery base (`bakeBase`) is cached by a
  key of the land and the tiles, so a broken crate does not bake the ground again.
- All sprites live in one atlas. Text comes from a canvas cache.
- Particles, ambient life and enemy bullets are pooled; avoid allocations in hot loops.
- Fixed 60 Hz logic with an accumulator; the game pauses when the tab is hidden, and on
  touch devices when the phone is turned to portrait.

## Checking your work

After a change, open `index.html` and look at the title, a fight in each land, the shop,
the treasure and challenge rooms, a boss, a few Arena waves, and a co-op game with two
browsers. For art changes, inspect the sprite zoomed in: every pixel matters.
