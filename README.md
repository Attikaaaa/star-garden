# Star Garden

**Play it: https://attikaaaa.github.io/star-garden/**

A top-down pixel-art roguelite with a slight three-quarter view. Pip, the little star
wizard, fights through three colourful lands room by room, collects magic items, shops at
the frog's stall and beats a boss at the end of every land. Every run is generated anew;
part of every coin you find goes into your **vault**, which buys permanent upgrades and new
wands in the Garden. Play alone, in the endless **Arena**, or in **online co-op** with up
to four heroes.

## Running it

No build step, no dependencies. Open `index.html` in a browser (Chrome, Firefox, Safari,
Edge). If the browser blocks local files, start a local server:

```
python3 -m http.server
```

and open `http://localhost:8000`.

## On your phone

Open the link and turn your phone sideways. Star Garden fills the whole screen, with
twin thumb sticks (left half of the screen moves, right half aims and shoots), round
buttons for rolling, Starfall and pause, and gentle aim assist.

- **Install it:** on Android use *Install app* / *Add to Home screen*; on iPhone use
  *Share → Add to Home Screen*. It then starts fullscreen in landscape like a normal app,
  and works **offline** after the first visit.
- On Android the game goes fullscreen when you first tap the title screen.
- On Android the phone vibrates with the action: a light tick for a defeated enemy, a
  heavy thump when a boss slams the ground, a pattern for Starfall. Set it to *Low* or
  *Off* in Settings (*Vibration*). Controllers rumble the same way (*Rumble*). iPhones do
  not allow web pages to vibrate.

## Controls

| Keyboard and mouse | Controller | Touch | Action |
|---|---|---|---|
| W A S D | left stick / d-pad | left half of the screen | move |
| mouse (hold) or arrows | right stick | right half of the screen | shoot |
| Space / Shift | A / LB / LT | boot button | roll (briefly invulnerable) |
| Q / right click | RB / RT | star button | Starfall (when charged) |
| R, or 1–4 for a slot | Y | bottle button, or tap a belt slot | drink a potion / place a turret |
| E / Enter | X | tap the tooltip | take an item, buy, enter the Star Gate |
| Esc / P | Start | pause button | pause |
| M | – | – | sound on/off |
| F | – | – | fullscreen |

Menus work with mouse, keyboard, controller (A: select, B: back) and touch.

## How it plays

- **Lands:** Bloom Meadow, Sunny Shore and Crystal Cave, each with its own enemies,
  music, atmosphere and boss (Slime King, Giant Crab, Crystal Golem).
- **Rooms:** the doors shut until every enemy is gone. Some rooms throw a second wave at
  you. The minimap shows the boss (crown), treasure room (star), shop (coin) and
  challenge room (swords). The number under the map counts your defeated enemies.
- **Elite enemies** glow gold: tougher and faster, but they drop more coins.
- **Golden Slime:** a rare, harmless slime that runs away. Catch it for vault coins!
- **Combo:** defeat enemies in quick succession for bonus coins.
- **Starfall:** fighting charges the meter under your coins. When it is full, rain stars
  on every enemy and wipe out all bullets.
- **Treasure room:** pick one of the magic items. **Challenge room:** survive two waves
  for a free item. **Chests** sometimes appear in cleared rooms.
- **Shop:** the frog sells hearts, a potion and magic items for coins.
- **Boss:** after it falls you get another item choice and the Star Gate to the next land.
- **Endless mode:** after the third land you can keep going; the lands return, harder.
- **Difficulty:** Easy, Normal, Hard or Starbreaker, picked before each run. Harder runs
  pay more vault coins.

### The Arena

Endless waves in one room: enemies pour in through the four gates, faster and in bigger
numbers every wave. Between waves there is a short break with a little shop (a heart and
two belt items). Every 5th wave is a treasure wave with a free magic item and a new land;
every 10th wave brings a boss. How far can you get?

### Potions and turrets

Your belt holds two items (more with the *Potion Belt* upgrade). Find them in chests, from
enemies, in shops and after bosses:

| Belt item | Effect |
|---|---|
| Regeneration | heals three hearts over a few seconds |
| Haste | shoot and run faster |
| Power | much stronger spells |
| Guard | a few seconds where nothing can hurt you |
| Star Turret | a tower that shoots at enemies for 20 seconds (two at most) |

### The vault, the Garden and wands

A share of every coin you pick up stays forever in your **vault** (10%, up to 40% with the
*Piggy Bank* upgrade), and cleared rooms, waves and bosses add a bonus. Spend it in
**the Garden**:

- **Upgrades:** extra hearts, damage, faster shooting (*Quick Hands*), an extra projectile
  (*Extra Star*), speed, a bigger vault share, luck, faster Starfall and a bigger potion belt.
- **Wands**, unlocked forever and chosen before each run:

| Wand | Style |
|---|---|
| Star Wand | trusty and balanced |
| Spark Scatter | a spray of sparks, strong up close |
| Bubble Blaster | a fast stream of weak bubbles |
| Moon Boomerang | pierces everything and flies back to you |
| Lightning Rod | every hit arcs on to two more enemies |
| Comet Staff | slow comets that explode |

You also pick your **robe** colour before a run, and your **name** for co-op.

### Online co-op (2–4 players)

- **Host:** *Co-op → Host a game*. You get a 5-letter code; share it, or send the invite
  link (it opens the game and joins directly). Pick the mode (Adventure or Arena) and the
  difficulty, then start.
- **Join:** *Co-op → Join a game* and type the code.
- Everyone picks their own name, robe and wand, and brings their own Garden upgrades.
- More heroes means tougher enemies: more health, a few more foes, more elites and
  stronger bosses, so every hero matters. Coins go into a shared purse; every player
  keeps their own share in their own vault.
- A hero who runs out of hearts goes **down** instead of dying: stand next to them for a
  moment to help them up. Everyone who is down gets back up when the room or wave is
  cleared. The run ends only when the whole team is down.
- The team moves on together: a door takes everyone to the next room once every standing
  hero waits in it (the door shows how many are there, e.g. 2/4).
- In treasure rooms and after bosses every hero picks their own item. Anything bought in
  a shop goes to the whole team: every hero gets the item, a heart heals everyone who is
  hurt, and a potion or turret kit goes into every belt with room.
- Works on any network (Wi-Fi, mobile data, different homes) with nothing to install and
  no server to keep running: the host's browser runs the game, and the players meet
  through free, always-on public message brokers (HiveMQ, Eclipse Mosquitto and EMQX; the
  game uses whichever answers, and sends everything through two of them at once, so one
  stalling for a moment does not stop the game). When the two devices can reach each
  other directly, the game quietly switches to a direct, faster WebRTC link. Co-op needs
  an internet connection; the menu keeps running for everyone while one player has it open.
- Made to feel smooth on any connection: your own shots appear the moment you fire, a hit
  on your hero counts only if it hit on your own screen, and the other heroes and the
  enemies glide steadily even when the connection hiccups. The number in the bottom-left
  corner is the connection's round trip in milliseconds (green is great).

### Every day, every week

- **Daily Star Run:** one short run that is the same for everyone today (land, wand, hero,
  items and a twist). Only the first try counts; it pays a Star Seed and vault coins, and
  a streak counter forgives a missed day. **Weekly Challenge:** all three lands with two
  twists. Share your score as a picture, or send the seed to a friend.
- **Quests:** three small goals a day (one swap) and a bigger one each week.
- **Mister Ribbit** writes letters with a gift on your first days, and gives a small
  present on every day you play. Nothing ever resets or withers.

### The sky (live events, worked out on your device)

- **Star Rain:** during the real big meteor showers (Quadrantids, Lyrids, Eta Aquariids,
  Perseids, Orionids, Leonids, Geminids) shooting stars fall in your runs. Catch
  stardrops for the Meteor trail and the Stargazer title.
- **Moon Night:** under a real full moon the Daily Star Run gives every hero a little moon
  and pays an extra seed.
- **Seasons:** seven a year, each with a featured twist in the Weekly Challenge and a free
  reward track filled by clearing rooms and beating bosses.
- **Boss of the Week:** one boss, 40% tougher, in a short run; the first win each week
  pays a seed and vault coins. Halloween week dresses the meadow slimes as pumpkins.

All of it is on the **Sky** tab of the Daily Star Run screen.

### The Garden

Between runs you walk around the Garden: the Star Gate starts runs, upgrades grow as
plants, Star Seeds grow into flowers in real time (cleared rooms water them), and the
frog's stall, the wardrobe, the wand rack, the mailbox, the telescope (Constellations:
about 100 goals that light up the sky) and the Book (items, foes, combos, your last runs)
are all there. Star Scrolls found in runs teach new magic items.

### Heroes, trials and more ways to play

- **Four heroes** with their own stats, roll and ult: Pip, Luma the Moon Witch, Coral the
  Sea Sprite and Bramble the Frog Knight (unlocked by beating bosses and befriending the frog).
- **Wand aspects:** three ways to use every wand, unlocked by mastering it.
- **Star Trials 1–20** after your first win, each adding one more twist and paying more.
- **Quick Run:** one land and its boss, about five minutes.
- **The true ending:** return all seven Big Stars to open the Star Well.
- **Couch co-op:** plug in more controllers; on the pre-run screen each friend presses A
  to join (B to leave) and you play together on one screen.
- **Co-op rejoin:** if your connection drops, *Co-op → Rejoin* puts you back into the
  running game with the same hero.

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

## Saving

Solo adventures and Arena runs save automatically. Use *Save and quit* in the pause menu
and *Continue* on the title screen. The vault, upgrades, wands, records and your collection
are always saved.

**Moving your garden:** *Settings → Save code* copies your whole garden as a code; paste it
on another device with *Load*. On iPhone, Safari deletes the data of sites you have not
opened for seven days, so add the game to your Home Screen (it is then kept), or keep a
save code.

**Settings** has music and effect volume, screen shake, vibration, fullscreen, an assist
mode (slower game, two more hearts), bullet shapes for colour-blind players, key remapping
or a left-handed touch layout, and the language (English or Magyar).

## The optional game server

The game is complete without any server. `server/server.js` (Node 18+, no dependencies)
adds cloud saves with short transfer codes, leaderboards with friend codes, a weekly
community goal, TURN credentials for co-op, bloom reminders (web push) and a retention
dashboard:

```
ADMIN_KEY=secret node server/server.js      # PORT (8787), DATA_DIR, GOAL_TARGET, TURN_URLS, TURN_USER, TURN_PASS, PUSH_SUBJECT
```

Then put its address into `live.json` (`"server": "https://your.server"`). Anonymous play
stats are only sent after the player agrees.

## Tips

- Rolling makes you immune to bullets, so you can dive through a ring of them.
- A sparkle on an enemy means it is about to shoot.
- Save Starfall for a boss or a crowded room; it also clears every bullet on screen.
- Bushes, buckets and vases break and sometimes hide coins or hearts.
- Hearts can only be picked up when you are hurt, and potions only when your belt has
  room; they wait for you.
- Guard makes you immune to everything for a moment: drink it before diving into a boss.
- In co-op, stay close enough to help each other up, but spread out so bullets cannot
  catch you all at once.
