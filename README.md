# Star Garden

**Play it: https://attikaaaa.github.io/star-garden/**

A top-down pixel-art roguelite with a slight three-quarter view. Pip, the little star
wizard, fights through three colourful lands room by room, collects magic items, shops at
the frog's stall and beats a boss at the end of every land. Every run is generated anew;
stars earned along the way grow the Garden, which makes the next run stronger.

## Running it

No build step, no dependencies. Open `index.html` in a browser (Chrome, Firefox, Safari,
Edge). If the browser blocks local files, start a local server:

```
python3 -m http.server
```

and open `http://localhost:8000`.

## Controls

| Keyboard and mouse | Controller | Touch | Action |
|---|---|---|---|
| W A S D | left stick / d-pad | left half of the screen | move |
| mouse (hold) or arrows | right stick | right half of the screen | shoot |
| Space / Shift | A / LB / LT | boot button | roll (briefly invulnerable) |
| Q / right click | RB / RT | star button | Starfall (when charged) |
| E / Enter | X / Y | tap the tooltip | take an item, buy, enter the Star Gate |
| Esc / P | Start | pause button | pause |
| M | – | – | sound on/off |
| F | – | – | fullscreen |

Menus work with mouse, keyboard, controller (A: select, B: back) and touch.

## How it plays

- **Lands:** Bloom Meadow, Sunny Shore and Crystal Cave, each with its own enemies,
  music, atmosphere and boss (Slime King, Giant Crab, Crystal Golem).
- **Rooms:** the doors shut until every enemy is gone. Some rooms throw a second wave at
  you. The minimap shows the boss (crown), treasure room (star), shop (coin) and
  challenge room (swords).
- **Elite enemies** glow gold: tougher and faster, but they drop more coins.
- **Golden Slime:** a rare, harmless slime that runs away. Catch it before it escapes!
- **Combo:** defeat enemies in quick succession for bonus coins (and a star for big ones).
- **Starfall:** fighting charges the meter under your coins. When it is full, rain stars
  on every enemy and wipe out all bullets.
- **Treasure room:** pick one of three magic items. **Challenge room:** survive two
  waves for a free item and stars. **Chests** sometimes appear in cleared rooms.
- **Shop:** the frog sells hearts and magic items for coins.
- **Boss:** after it falls you get another item choice and the Star Gate to the next land.
- **The Garden:** stars you earn (per cleared room, boss, challenge, big combo, golden
  slime) buy permanent upgrades: extra heart, damage, speed, starting coins, luck,
  faster Starfall.
- **Saving:** the game saves automatically in cleared rooms. Use *Save and quit* in the
  pause menu and *Continue* on the title screen. A run ends when you run out of hearts.
- **Endless mode:** after the third land you can keep going; the lands return, harder.
- **Collection** and lifetime **statistics** are on the title screen; **Settings** has
  music and effect volume, screen shake and fullscreen.

## Magic items

| Item | Effect |
|---|---|
| Quick Spell | faster shots |
| Big Star | bigger, stronger shots |
| Triple Beam | three shots at once |
| Bouncy Ball | shots bounce off walls |
| Piercing Arrow | shots pierce through enemies |
| Firefly | homing shots |
| Little Moon | a moon orbits you, hurting enemies and eating bullets |
| Heart Blossom | +1 heart and a full heal |
| Wind Boots | faster running and rolling |
| Magnet | pulls treasure toward you |
| Fireworks | shots burst into sparks on hit |
| Honey Pot | every 12th defeated enemy heals you |
| Back Eye | you also shoot backwards |
| Lucky Clover | more loot, cheaper shop |
| Telescope | faster shots that fly farther |
| Stardust | rolling leaves harmful stardust |
| Bubble Shield | blocks one hit in every room |

Items stack and combine well; your shots change colour with the items you carry.

## Tips

- Rolling makes you immune to bullets, so you can dive through a ring of them.
- A sparkle on an enemy means it is about to shoot.
- Save Starfall for a boss or a crowded room; it also clears every bullet on screen.
- Bushes, buckets and vases break and sometimes hide coins or hearts.
- Hearts can only be picked up when you are hurt; they wait for you.
