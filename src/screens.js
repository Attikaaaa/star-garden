'use strict';
// Shared screen pieces: modal notices (what's new, gifts, install, stats consent), the
// end-of-run screen that points at the next goal, and small helpers for menus.

// ---------- Names of foes (end screen, bestiary, quests) ----------
const FOE_NAMES = {
  slime: 'SLIME', mini: 'MINI SLIME', gold: 'GOLDEN SLIME', bee: 'BEE', shroom: 'MUSHROOM', flower: 'FLOWER',
  crab: 'CRAB', wisp: 'WISP', jelly: 'JELLYFISH', bat: 'BAT', dummy: 'PRACTICE DUMMY',
  king: 'SLIME KING', bcrab: 'GIANT CRAB', golem: 'CRYSTAL GOLEM', sky: 'LONG FALL',
};
const foeName = (t) => FOE_NAMES[t] || (EDEF[t] && EDEF[t].name) || String(t || '').toUpperCase();
const aOrAn = (w) => (/^[AEIOU]/.test(w) ? 'AN ' : 'A ');

// ---------- Modal notices ----------
// A small panel over any screen: { title, lines: [..], icon?, buttons: [{ label, fn, col }] }.
// Opening one queues it; they show one at a time and block other input.
const MODALS = [];
function openModal(m) { MODALS.push(Object.assign({ sel: 0, t: 0 }, m)); }
const modalUp = () => MODALS.length > 0;
function modalRect(m) {
  // wide enough for every button, each with room for the pointer
  const bw = Math.max(...m.buttons.map(b => textW(b.label))) + 14;
  const w = Math.max(200, textW(m.title) + 24, ...m.lines.map(l => textW(l) + 20), m.buttons.length * bw + 16), h = 30 + m.lines.length * 11 + 16 + (m.icon ? 18 : 0);
  return [Math.round((VW - w) / 2), Math.round((VH - h) / 2), w, h];
}
function updateModal(dt) {
  const m = MODALS[0];
  m.t += dt;
  if (m.t < 0.25) return; // a moment to read before a stray press closes it
  const n = m.buttons.length, [x, y, w, h] = modalRect(m);
  if (pressed(...K_LEFT)) { m.sel = (m.sel + n - 1) % n; Audio_.sfx('select'); }
  if (pressed(...K_RIGHT)) { m.sel = (m.sel + 1) % n; Audio_.sfx('select'); }
  let hit = -1;
  const bw = Math.floor((w - 16) / n);
  for (let i = 0; i < n; i++) if (hoverRow(i, x + 8 + i * bw, y + h - 18, bw, 14)) hit = i;
  if (hit >= 0) m.sel = hit;
  const back = pressed(...K_BACK);
  if (pressed(...K_OK) || hit >= 0 || back) {
    const b = back ? m.buttons[n - 1] : m.buttons[m.sel];
    MODALS.shift();
    Audio_.sfx(back ? 'select' : 'confirm');
    if (b && b.fn) b.fn();
  }
}
function drawModal() {
  const m = MODALS[0];
  dim(0.45);
  const [x, y, w, h] = modalRect(m), a = Math.min(1, m.t * 6);
  const yy = Math.round(y + (1 - a) * 8);
  panel(x, yy, w, h);
  let ty = yy + 7;
  if (m.icon) { drawS(S(m.icon), VW / 2 - 8, ty - 2); ty += 18; }
  text(m.title, VW / 2, ty, 'Y', 1, 1);
  m.lines.forEach((l, i) => text(l, VW / 2, ty + 14 + i * 11, i === 0 && m.lead ? 'c' : 'w', 1, 1));
  const n = m.buttons.length, bw = Math.floor((w - 16) / n);
  m.buttons.forEach((b, i) => {
    const bx = x + 8 + i * bw + bw / 2, by = yy + h - 14, on = i === m.sel;
    text(b.label, bx, by, on ? 'Y' : b.col || 'l', 2, 1);
    if (on) pointer(bx - textW(b.label) / 2 - 10, by);
  });
}
// ---------- What the title screen has to say (once each) ----------
// NEWS: what changed in each version, shown once to returning players.
const NEWS = [
  { v: '1.16.62', lines: ['WILDGROVE: DEEP WINTER', 'SNOWY WALLS WITH ICICLES', 'ICE ALONG THE SHORES, BREATH IN THE COLD', 'BUNTING FOR A VILLAGE FAIR'] },
  { v: '1.16.61', lines: ['WILDGROVE: AUTUMN AT HOME', 'APPLES AND ACORNS FALL IN THE GRASS', 'A WOODPILE AND QUILTED BEDS', 'SNOW SETTLES ON EVERYTHING IN WINTER'] },
  { v: '1.16.60', lines: ['WILDGROVE: SMALL JOYS', 'CHALK DOODLES ON THE PATHS, UNTIL IT RAINS', 'A PICNIC BASKET WITH A TREAT EVERY DAY', 'SUNFLOWERS TURN, CRICKETS SING, DEW SHINES'] },
  { v: '1.16.59', lines: ['WILDGROVE: QUIET NIGHTS AND BUSY DAYS', 'OWLS AND MOTHS AT NIGHT, BEES BY DAY', 'A TENT TO SLEEP WHEREVER THE ROAD LEADS', 'CANDLES, A CANDELABRA AND BONSAI TREES'] },
  { v: '1.16.58', lines: ['WILDGROVE: A GARDEN FULL OF FRIENDS', 'GARDEN GNOMES, TOPIARY AND A WINDMILL', 'SQUIRRELS BY DAY, HEDGEHOGS BY NIGHT', 'SIX JAMS, CORNBREAD AND A PANTRY SHELF'] },
  { v: '1.16.57', lines: ['WILDGROVE: TREASURE AND WARM WATER', 'TREASURE MAPS: FOLLOW THE PIN, DIG AT THE X', 'HOT SPRINGS STEAM IN THE SNOW AND HEAL YOU', "A POTTER'S WHEEL: VASES IN FOUR GLAZES"] },
  { v: '1.16.56', lines: ['WILDGROVE: A RAINY DAY', 'UMBRELLAS IN FOUR COLOURS KEEP THE RAIN OFF', 'FROGS AND SNAILS COME OUT IN THE RAIN'] },
  { v: '1.16.55', lines: ['WILDGROVE: TUNES, FAIRIES AND SNOW', 'AN OCARINA: AIM TO PICK THE NOTE', 'FAIRY RINGS GLOW IN THE WOODS AT NIGHT', 'SNOWBALL FIGHTS WITH FRIENDS'] },
  { v: '1.16.54', lines: ['WILDGROVE: SKIES, MIST AND LAZY DAYS', 'GEESE FLY OVER IN SPRING AND AUTUMN', 'NORTHERN LIGHTS AND MORNING MIST', 'A HAMMOCK AND A CLOTHESLINE TO BUILD'] },
  { v: '1.16.53', lines: ['WILDGROVE: MESSAGES IN BOTTLES', 'BOTTLES WASH UP ON THE BEACH', 'USE ONE TO READ THE NOTE INSIDE', 'AND MAKE A SHIP IN A BOTTLE'] },
  { v: '1.16.52', lines: ['WILDGROVE: ICE SKATES', 'HOLD THEM ON ICE: QUICK AND SURE', 'LET GO AND GLIDE ON', 'YOUR LINES SWIRL ACROSS THE ICE'] },
  { v: '1.16.51', lines: ['WILDGROVE: ICE FISHING AND A SNOW GLOBE', 'USE THE ROD ON ICE TO CUT A HOLE', 'ICEFIN BITE MORE THROUGH THE ICE', 'SHAKE A SNOW GLOBE AND WATCH IT SNOW'] },
  { v: '1.16.50', lines: ['WILDGROVE: FOUR NEW HATS', 'A PARTY HAT, A WITCH HAT, A SAILOR CAP', 'AND A FROG HAT, OF COURSE', 'WEAR TEN TO BECOME A MAD HATTER'] },
  { v: '1.16.49', lines: ['WILDGROVE: A SPRING EGG HUNT', 'PAINTED EGGS HIDE IN THE GRASS IN SPRING', 'A NEW SET TO FIND EACH DAY', 'SIX EGGS MAKE A BASKET TO SET OUT'] },
  { v: '1.16.48', lines: ['WILDGROVE: A BIRD FEEDER', 'FILL A FEEDER WITH SEEDS', 'FOUR NEW BIRDS COME TO EAT BY DAY', 'SPOT THEM ALL TO BECOME A BIRDWATCHER'] },
  { v: '1.16.47', lines: ['WILDGROVE: FIREWORKS AND A DAY AT THE BEACH', 'SEND FIREWORKS UP ON A STARRY NIGHT', 'FRIENDS SEE THEM BURST TOO', 'DECK CHAIRS AND UMBRELLAS FOR THE BEACH'] },
  { v: '1.16.46', lines: ['WILDGROVE: A BED FOR YOUR COMPANION', 'SIT DOWN NEAR A PET BED TO REST', 'YOUR COMPANION CURLS UP AND NAPS IN IT', 'FRIENDS SEE IT SLEEP TOO'] },
  { v: '1.16.45', lines: ['WILDGROVE: A WEATHER VANE AND A RAIN BARREL', 'A COPPER ROOSTER TURNS WITH THE WIND', 'USE IT TO HEAR WHAT THE WEATHER WILL DO', 'A RAIN BARREL FILLS YOUR BUCKET IN THE RAIN'] },
  { v: '1.16.44', lines: ['WILDGROVE: SANDCASTLES AND A LIGHTHOUSE', 'USE A SHOVEL ON SAND TO START A CASTLE', 'BUILD IT UP, THEN TOP IT WITH A SHELL', 'A LIGHTHOUSE SWEEPS ITS BEAM AT NIGHT'] },
  { v: '1.16.43', lines: ['WILDGROVE: CLOUD SHADOWS AND SPARKLERS', 'SOFT CLOUD SHADOWS DRIFT OVER SUNNY DAYS', 'HOLD A SPARKLER TO LIGHT UP THE NIGHT', 'FRIENDS SEE YOUR SPARKLER TOO'] },
  { v: '1.16.42', lines: ['WILDGROVE: SKIPPING STONES', 'USE A STONE ON WATER TO SKIP IT', 'HOW MANY SKIPS CAN YOU MAKE?', 'FRIENDS SEE YOUR STONES SKIP TOO'] },
  { v: '1.16.41', lines: ['WILDGROVE: PETALS, LEAVES AND STRING LIGHTS', 'PETALS DRIFT FROM BLOSSOMING TREES IN SPRING', 'AUTUMN LEAVES FALL IN THEIR OWN COLOURS', 'STRING LIGHTS BETWEEN POSTS, LIT AT NIGHT'] },
  { v: '1.16.40', lines: ['WILDGROVE: TALES AND A FESTIVE TREE', 'BOOKSHELVES NOW HOLD EIGHT LITTLE TALES', 'VILLAGE SHELVES TOO, SO HAVE A READ', 'A FESTIVE TREE WITH A GIFT EACH WINTER DAY'] },
  { v: '1.16.39', lines: ['WILDGROVE: A FISH TANK AND CLOCKS', 'KEEP YOUR FAVOURITE FISH IN A TANK', 'A GRANDFATHER CLOCK AND A SUNDIAL TELL THE TIME', 'THE FROG TELLS YOU WHEN NEW WISHES COME'] },
  { v: '1.16.38', lines: ['WILDGROVE: AN EASEL TO PAINT ON', 'PAINT A LITTLE PICTURE IN EIGHT COLOURS', 'IT STANDS ON THE EASEL FOR ALL TO SEE', 'FRIENDS SEE YOUR PAINTINGS TOO'] },
  { v: '1.16.37', lines: ['WILDGROVE: LITTLE WISHES AND MORE HATS', 'THREE SMALL WISHES A DAY, A GIFT FOR ALL THREE', 'FOUR NEW HATS TO WEAR', 'FOOTPRINTS IN THE SNOW AND SAND'] },
  { v: '1.16.36', lines: ['WILDGROVE: EMOTES AND LEAF PILES', 'PRESS G (OR RT) TO WAVE, SMILE OR SEND A HEART', 'FRIENDS SEE YOUR EMOTES', 'JUMP INTO LEAF PILES IN AUTUMN'] },
  { v: '1.16.35', lines: ['WILDGROVE: PUDDLES AND MARSHMALLOWS', 'PUDDLES FILL IN THE RAIN, SO SPLASH AWAY', 'TOAST MARSHMALLOWS AT A CAMPFIRE', 'PULL THEM OUT WHEN THEY ARE GOLDEN'] },
  { v: '1.16.34', lines: ['WILDGROVE: SKY LANTERNS', 'LET ONE GO AT NIGHT AND MAKE A WISH', 'FRIENDS SEE YOUR LANTERNS RISE'] },
  { v: '1.16.33', lines: ['WILDGROVE: RAINBOWS', 'WHEN A DAYTIME RAIN STOPS, LOOK UP', 'A NEW STAR: OVER THE RAINBOW'] },
  { v: '1.16.32', lines: ['WILDGROVE: A WARDROBE', 'CHANGE YOUR SKIN, HAIR AND TUNIC ANY TIME', 'FRIENDS SEE YOUR NEW LOOK'] },
  { v: '1.16.31', lines: ['WILDGROVE: NEW FRIENDS', 'A RABBIT, A FROG OR A CRAB CAN FOLLOW YOU', 'CARROTS, FIREFLIES AND FISH WIN THEM OVER', 'PET YOUR FRIEND WITH AN EMPTY HAND'] },
  { v: '1.16.30', lines: ['WILDGROVE: WAYSTONES', 'BUILD TWO OR MORE AND TRAVEL BETWEEN THEM', 'A SIGN BESIDE ONE GIVES IT A NAME', 'THEY SHOW ON THE MAP'] },
  { v: '1.16.29', lines: ['WILDGROVE: A BICYCLE!', 'RIDE FASTER, QUICKER STILL ON PATHS', 'USE RINGS ITS BELL', 'FRIENDS SEE YOU RIDE BY'] },
  { v: '1.16.28', lines: ['WILDGROVE: POND LIFE', 'FISH GLIDE UNDER DEEP WATER', 'DRAGONFLIES OVER THE SHALLOWS IN SUMMER', 'CATCH ONE WITH THE BUG NET AND FRAME IT'] },
  { v: '1.16.27', lines: ['WILDGROVE: HATS!', 'A STRAW HAT, A FLOWER CROWN, A BEANIE', 'A TOP HAT AND A GOLD CROWN', 'FRIENDS SEE WHICH HAT IS YOURS'] },
  { v: '1.16.26', lines: ['WILDGROVE: THE TREES KEEP THE SEASONS', 'APPLE BLOSSOM IN SPRING', 'RED, ORANGE AND GOLD IN AUTUMN', 'SNOW ON THE TREETOPS IN WINTER'] },
  { v: '1.16.25', lines: ['WILDGROVE: COWS IN THE MEADOWS', 'MILK THEM WITH A BUCKET', 'A CHURN MAKES BUTTER AND CHEESE', 'TOAST, SOUP, ICE CREAM AND A SHAKE'] },
  { v: '1.16.24', lines: ['WILDGROVE: A FIREPLACE FOR YOUR HOUSE', 'IT COOKS, AND SEATS NEAR IT HEAL FASTER', 'A CAT SLEEPS ON THE HEARTH. IT PURRS', 'A ROCKING CHAIR AND A KITCHEN DRESSER'] },
  { v: '1.16.23', lines: ['WILDGROVE: A ROWBOAT FOR THE LAKES', 'HOLD IT TO ROW QUICKER THAN YOU SWIM', 'BUILD A WELL, IT FILLS YOUR BUCKET', 'DUCKS, DUCKLINGS AND WATER LILIES'] },
  { v: '1.16.22', lines: ['WILDGROVE: A GARDEN SWING TO SIT ON', 'IT SWAYS GENTLY WHILE YOU REST', 'A WARM BATH HEALS TWICE AS FAST', 'BIRDS COME TO SPLASH IN A BIRD BATH'] },
  { v: '1.16.21', lines: ['WILDGROVE: PATHS ARE QUICKER TO WALK', 'GRAVEL, COBBLESTONES, STEPPING STONES', 'A BOARDWALK BRIDGES SHALLOW WATER', 'THE DUG DIRT PATH IS QUICKER TOO'] },
  { v: '1.16.20', lines: ['WILDGROVE: KITES IN THREE COLOURS', 'HOLD ONE AND IT FLIES HIGH OVERHEAD', 'FRIENDS SEE YOUR KITE, YOU SEE THEIRS', 'AND PINWHEELS THAT SPIN IN THE BREEZE'] },
  { v: '1.16.19', lines: ['WILDGROVE: A TELESCOPE FOR STARGAZING', 'A STAR SIGN HIDES IN THE SKY EACH NIGHT', 'LIGHT ITS STARS, ADD IT TO YOUR CHART', 'EIGHT SIGNS AND THE SHOOTING STARS'] },
  { v: '1.16.18', lines: ['WILDGROVE: A WINTER PACK', 'SCOOP SNOWBALLS FROM SNOW WITH USE', 'BUILD SNOWMEN AND AN IGLOO OF SNOW WALLS', 'ICE LANTERNS AND A MUG OF HOT CIDER'] },
  { v: '1.16.17', lines: ['WILDGROVE: A HOMING FEATHER', 'USE IT, STAND STILL, AND FLY HOME TO BED', 'IT WORKS FROM THE CAVES AND CLOUDS TOO', 'AND IT IS NEVER USED UP'] },
  { v: '1.16.16', lines: ['WILDGROVE: A BUG NET', 'CATCH BUTTERFLIES BY DAY, FIREFLIES BY NIGHT', 'A FIREFLY JAR LAMP, FRAMED BUTTERFLIES', 'THE BUGS YOU CATCH JOIN YOUR ALBUM'] },
  { v: '1.16.15', lines: ['WILDGROVE: A MAILBOX WITH A DAILY LETTER', 'THE FROG WRITES, A SMALL GIFT INSIDE', 'FLOWER POTS IN FIVE COLOURS', 'AND A POTTED FERN FOR YOUR HOME'] },
  { v: '1.16.14', lines: ['WILDGROVE: A MUSIC BOX AND A GRAMOPHONE', 'FOUR NEW TUNES, USE IT TO PICK ONE', 'WALK CLOSE AND THE MUSIC FADES IN', 'SHELL CHIMES TINKLE IN THE BREEZE'] },
  { v: '1.16.13', lines: ['WILDGROVE: AN ALBUM IN THE PAUSE MENU', 'EVERY FOOD AND FISH YOU HAVE FOUND', 'DARK SHAPES SHOW WHAT IS LEFT TO FIND', 'FILL HALF OF IT FOR A NEW STAR'] },
  { v: '1.16.12', lines: ['WILDGROVE: A HEN HOUSE THAT FILLS WITH EGGS', 'A COMPOST BIN: SCRAPS IN, BONE MEAL OUT', 'BIRDS VISIT YOUR BIRDHOUSE BY DAY', 'FRIED EGGS, OMELETTES, BERRY PANCAKES'] },
  { v: '1.16.11', lines: ['WILDGROVE: SIT ON A CHAIR, COUCH OR BENCH', 'SITTING HEALS YOU SLOWLY', 'TEA BUSHES AMONG THE FERNS, FOUR TEAS', 'A CUP OF TEA SITTING DOWN HEALS MORE', 'PICNIC BLANKETS, LOG STOOLS, A TEA SET'] },
  { v: '1.16.10', lines: ['WILDGROVE: APPLE, CHERRY, ORANGE, LEMON TREES', 'PICK THE FRUIT, IT GROWS BACK', 'SOME WILD TREES BEAR FRUIT, PLANT YOUR OWN', 'APPLE PIE, LEMONADE, JAM TOAST AND MORE'] },
  { v: '1.16.9', lines: ['WILDGROVE: GROW TOMATOES, CORN AND SUNFLOWERS', 'STRAWBERRIES TOO, SEEDS HIDE IN TALL GRASS', 'PIZZA, POPCORN, STRAWBERRY CAKE AND MORE'] },
  { v: '1.16.8', lines: ['WILDGROVE: WHAT BITES DEPENDS ON THE WATER', 'SALMON, TROPICAL FISH, ICEFIN, GLOWFISH AT NIGHT', 'A RARE GOLDEN CARP FOR A TROPHY', 'GRILLED SALMON, A FISH SKEWER, FISH CHOWDER'] },
  { v: '1.16.7', lines: ['WILDGROVE: PIN A RECIPE, IT WAITS TOP LEFT', 'IT COUNTS WHAT YOUR CHESTS NEARBY HOLD TOO', 'ITEM TIPS SAY WHAT THINGS DO'] },
  { v: '1.16.6', lines: ['WILDGROVE: WRITE ON YOUR SIGNS', 'TYPE, TAP THE LETTERS OR USE THE PAD', 'THE WORDS SHOW OVER THE SIGN AS YOU WALK BY', 'CO-OP FRIENDS SEE THEM TOO'] },
  { v: '1.16.5', lines: ['WILDGROVE: CRAFT WITH WHAT CHESTS NEARBY HOLD', 'STASH TOPS UP THE CHESTS THAT HOLD THE SAME', 'A ROOMIER HELP PAGE'] },
  { v: '1.16.4', lines: ['WILDGROVE: CARPETS AND BANNERS IN EVERY PETAL COLOUR', 'A PUMPKIN LANTERN, A PEARL LAMP, A SHELL CHIME', 'BONE MEAL HURRIES CROPS, BUSHES AND SAPLINGS', 'OBSIDIAN WALLS, MUSHROOM SOUP AND FRUIT SALAD'] },
  { v: '1.16.3', lines: ['WILDGROVE: SHIFT+CLICK MOVES A WHOLE STACK', 'SORT, TAKE ALL, STORE ALL, MAKE FIVE AT ONCE', 'A WORN-OUT TOOL IS SWAPPED FOR YOUR NEXT ONE', 'CO-OP: A HOST IN A MENU NO LONGER STOPS THE WORLD', 'NO MORE DOUBLE CLICKS ON 120 HZ SCREENS'] },
  { v: '1.16.2', lines: ['WILDGROVE: A WORLD MAP (M) WITH A PIN TO WALK TO', 'PLAY WILDGROVE WITH A CONTROLLER', 'MENU CLICKS IN WILDGROVE ALWAYS LAND NOW'] },
  { v: '1.16.1', lines: ['WILDGROVE: CALMER GROUND, WATER AND MOUNTAINS', 'NO MORE HITCH WHEN YOU DIG OR TILL', 'A GOLD FRAME SHOWS YOUR CHOSEN SLOT'] },
  { v: '1.16.0', lines: ['24 NEW ITEMS: A LUCKY PIGGY, GALOSHES, A MAGIC BEAN...', 'THREE NEW SETS, SIX NEW COMBOS, THREE CO-OP ITEMS', 'COMBOS LIKE FULL MOON NOW GO INTO THE BOOK TOO'] },
  { v: '1.15.11', lines: ['THE CLOUD STEPS REDRAWN: A GAZEBO, MARBLE FOUNTAINS AND RAILS, GOLD HARPS', 'A SOFT, CALM CLOUD FLOOR: ITS HOLES SHOW THE OPEN SKY, THEN GROW BACK'] },
  { v: '1.15.10', lines: ['THE TOY ATTIC REDRAWN: ABC BLOCKS, STANDING DOMINOES, A ROCKING HORSE', 'STRIPED WALLPAPER WITH NOTES, A ROUND WINDOW AND CRAYON DRAWINGS'] },
  { v: '1.15.9', lines: ['THE EMBER FORGE REDRAWN: RIVETED IRON FLOORS, A BRICK FURNACE, STEAM PIPES', 'NO MORE SPECKS ON THE FLOOR: ONLY THE RUNES THAT ERUPT GLOW'] },
  { v: '1.15.8', lines: ['THE STORY LIBRARY REDRAWN: BOOKCASES, READING TABLES, A GRANDFATHER CLOCK', 'THE FLOOR IS A PAGE, AND EVERY ROOM KEEPS BOOKS OF ITS OWN COLOURS'] },
  { v: '1.15.7', lines: ['THE GLOW DEEP REDRAWN: KELP, BRAIN CORAL, FIRE CORAL AND AN OLD ANCHOR', 'REEF WALLS WITH CORAL FANS, ANEMONES AND PEARLS'] },
  { v: '1.15.6', lines: ['THE LANTERN WOODS REDRAWN: TEAL AND AUTUMN TREES, BIRCHES, FALLEN LOGS', 'LANTERNS ON THE TRUNKS LIGHT THE TOP OF EACH ROOM'] },
  { v: '1.15.5', lines: ['THE MOON GARDEN REDRAWN: SILVER TREES, CRESCENT PILLARS, PONDS OF SKY', 'NO MORE YELLOW SPECKS ON ITS FLOOR TO MISTAKE FOR STARS'] },
  { v: '1.15.4', lines: ['THE SUN TEMPLE REDRAWN: A PAVED COURT, OBELISKS, PYRAMIDS AND AN OASIS', 'QUICKSAND SINKS INTO THE FLOOR AS ONE WHIRL'] },
  { v: '1.15.3', lines: ['THE SNOWGLOBE REDRAWN: SNOWY PINES, CABINS, ICE AND DRIFTS', 'SNOW LIES ON ITS WALLS, ICICLES HANG FROM THEM'] },
  { v: '1.15.2', lines: ['A RING IN YOUR OWN COLOUR UNDER EVERY HERO', 'IN CO-OP AN ARROW OVER YOU, NAMES OVER YOUR FRIENDS', 'TREES TURN SEE-THROUGH WHEN SOMEONE IS BEHIND THEM'] },
  { v: '1.15.0', lines: ['THE MEADOW, SHORE AND CRYSTAL CAVE REDRAWN: NEW GROUND, PONDS AND WALLS', 'TREES, HEDGES, CRYSTALS AND LAMPS IN THE ROOMS', 'TALL GRASS TO CUT WITH SHOTS AND ROLLS', 'SIX NEW ROOM SHAPES', 'A NEW TITLE SCREEN AND TIDIER TEXT IN EVERY MENU'] },
  { v: '1.14.0', lines: ['A NEW GAME ON THE TITLE SCREEN: WILDGROVE', 'AN ENDLESS SURVIVAL WORLD: CHOP, BUILD, FARM, FIGHT', 'PLAY WITH FRIENDS, SAVE AND SHARE YOUR WORLDS'] },
  { v: '1.13.0', lines: ['THE LAST LAND: THE MOON GARDEN, WHERE THE STAR ROAD ENDS', 'LOW GRAVITY: YOU SLIDE, AND GOLD ROCKS BEND YOUR SHOTS', 'BEAT THE NIGHT BLOOM TO OPEN ROAD+: THE SAME ROAD, A LITTLE WILDER', 'DAILY RUNS NOW VISIT THE WHOLE STAR ROAD', 'THE CASINO: A VIP LOUNGE, A FOUNTAIN, QUESTS AND A CONSTELLATION', "HOLD'EM IN THE LOUNGE: BEAT A FROG, AN OWL AND A FOX", 'A VELVET ROBE AT THE PRIZE COUNTER'] },
  { v: '1.12.0', lines: ['A NEW LAND: THE GLOW DEEP', 'THE CURRENT CARRIES EVERYTHING: WATCH THE FLOOR ARROWS', 'CATCH A BUBBLE FOR ONE BIG BUBBLE SHOT'] },
  { v: '1.11.0', lines: ['TWO NEW LANDS: THE STORY LIBRARY AND THE EMBER FORGE', 'THE PAGES TURN: STEP CLEAR OF THE NEW SHELVES', 'THE FORGE KEEPS TIME: WATCH THE RUNES, THEN STEP OFF'] },
  { v: '1.10.0', lines: ['TWO NEW LANDS: THE SNOWGLOBE AND THE SUN TEMPLE', 'SHOOT ICE BRIDGES, HOLD ON WHEN THE GLOBE SHAKES', 'LIGHT THE PLATES AND ANSWER THE SPHINX'] },
  { v: '1.9.0', lines: ['A NEW LAND ON THE STAR ROAD: THE TOY ATTIC', 'EVERY TOY MOVES ON THE BEAT: DODGE IN TIME', 'TWO NEW BOSSES: THE MUSIC BOX BALLERINA AND JESTER JACK'] },
  { v: '1.8.0', lines: ['A NEW LAND ON THE STAR ROAD: THE CLOUD STEPS', 'HOP FROM SUNSTONE TO SUNSTONE BEFORE THE CLOUDS PUFF AWAY', 'TWO NEW BOSSES IN THE SKY: THE THUNDER WHALE AND THE STORM RAM'] },
  { v: '1.7.0', lines: ['THE STAR CASINO OPENS: FIND IT ON THE TITLE SCREEN', 'SLOTS, BLACKJACK, POKER, ROULETTE, SIC BO AND SCRATCH CARDS', 'PLAY FOR STAR CHIPS, NEVER FOR REAL MONEY'] },
  { v: '1.6.0', lines: ['A NEW BOSS IN THE CRYSTAL CAVE: THE GEODE SPIDER'] },
  { v: '1.5.1', lines: ['CO-OP: RUNS ARE SAVED, CONTINUE THEM FROM THE LOBBY', 'CO-OP: THE HOST CAN GO BACK TO THE LOBBY FROM THE PAUSE MENU'] },
  { v: '1.5.0', lines: ['A NEW BOSS ON THE SHORE: THE TIDE TURTLE'] },
  { v: '1.4.0', lines: ['A NEW BOSS IN THE MEADOW: THE MOLE MAYOR', 'EVERY BOSS SHOWS ITS ATTACKS BEFORE IT STRIKES', 'HIT A DIZZY BOSS FOR EXTRA DAMAGE'] },
  { v: '1.3.1', lines: ['YOUR GARDEN IS SAVED WHEN YOU CLOSE THE GAME', 'IPHONE: THE HOME SCREEN APP TAKES YOUR SAVE ALONG'] },
  { v: '1.3.0', lines: ['THE SKY: STAR RAIN, MOON NIGHTS AND SEASONS', 'A NEW BOSS OF THE WEEK EVERY MONDAY', 'COUCH CO-OP: PLUG IN MORE CONTROLLERS', 'CO-OP: REJOIN A GAME AFTER A DROP', 'SAVE CODES: TAKE YOUR GARDEN ANYWHERE', 'A NEW LANGUAGE: MAGYAR'] },
  { v: '1.2.0', lines: ['THE GARDEN: QUESTS, CONSTELLATIONS, A BOOK AND A MAILBOX', 'MISTER RIBBIT WRITES LETTERS AND GIVES DAILY GIFTS', 'ROLL THROUGH BULLETS TO CHARGE STARFALL', '15 ITEM COMBOS WITH REAL BONUSES TO FIND', 'THE END SCREEN SHOWS YOUR NEXT GOAL', 'TRAILS, PETS AND TITLES IN THE WARDROBE'] },
];
// '1.10.0' is newer than '1.9.0' (a plain string compare says otherwise)
const verNewer = (a, b) => { const x = a.split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
function titleNotices() {
  if (modalUp() || G.noticesShown) return;
  G.noticesShown = true;
  // what's new, for players who played an older version
  if (Save.ver !== GAME_VERSION) {
    const old = Save.ver, lines = [];
    if (Save.stats.runs > 0) for (const n of NEWS) if (!old || verNewer(n.v, old)) lines.push(...n.lines);
    const live = ONLINE.live && Array.isArray(ONLINE.live.news) ? ONLINE.live.news.filter(n => n && n.v === GAME_VERSION) : [];
    for (const n of live) if (Array.isArray(n.lines)) lines.push(...n.lines.map(String));
    Save.ver = GAME_VERSION; Save.write();
    if (lines.length) openModal({ title: 'WHAT IS NEW', lines: lines.slice(0, 7), buttons: [{ label: 'GREAT!' }] });
  }
  if (saveNotices()) return;
  if (typeof progressNotices === 'function') progressNotices();
  if (typeof linkNotice === 'function') linkNotice();
  if (typeof goalNotice === 'function') goalNotice();
  if (Save.flags.installAsk) {
    Save.flags.installAsk = false; Save.flags.installN = (Save.flags.installN || 0) + 1; Save.write();
    const ios = IS_IOS && !navigator.standalone;
    if (canPromptInstall() || ios) {
      openModal({
        title: 'KEEP YOUR GARDEN SAFE', icon: 'icon_heart',
        lines: ios ? ['SAFARI FORGETS A GAME AFTER A WEEK AWAY.', 'TAP SHARE, THEN ADD TO HOME SCREEN:', 'THE APP KEEPS YOUR GARDEN FOR GOOD'] : ['INSTALL STAR GARDEN LIKE AN APP:', 'IT PLAYS FULLSCREEN, WORKS OFFLINE', 'AND KEEPS YOUR SAVE SAFE'],
        buttons: ios ? [{ label: 'OK' }, { label: 'NOT NOW', fn: () => { Save.flags.installNo = true; Save.write(); } }]
          : [{ label: 'INSTALL', col: 'h', fn: () => { promptInstall(); requestPersist(true); } }, { label: 'LATER' }],
      });
    }
  }
  // anonymous stats: only asked when a game server is set up, and only once
  if (ONLINE.url && Save.settings.share === null && Save.stats.runs > 0) {
    openModal({
      title: 'HELP MAKE STAR GARDEN BETTER', lines: ['SHARE ANONYMOUS PLAY STATS?', 'NO NAMES, NO ACCOUNTS: JUST WHAT HAPPENS IN RUNS.', 'YOU CAN CHANGE THIS IN SETTINGS.'],
      buttons: [{ label: 'YES', col: 'h', fn: () => setShare(true) }, { label: 'NO', fn: () => setShare(false) }],
    });
  }
}

// Where the save could be lost or was just moved. True when a notice was shown.
// Apps inside Instagram, Facebook, TikTok and the like throw their storage away.
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|MicroMessenger|TikTok|musical_ly|Bytedance|Snapchat|Line\//.test(navigator.userAgent);
function saveNotices() {
  if (IN_APP) {
    openModal({ title: 'THIS BROWSER FORGETS', icon: 'icon_heart', lines: ['THE BROWSER INSIDE THIS APP DELETES', 'YOUR GARDEN WHEN YOU CLOSE IT.', 'OPEN THE LINK IN SAFARI OR CHROME.'], buttons: [{ label: 'OK' }] });
    return true;
  }
  if (Save._carried) {
    Save._carried = false;
    openModal({ title: 'YOUR GARDEN IS HERE', icon: 'icon_sprout', lines: ['YOUR SAVE CAME ALONG FROM SAFARI.', 'THE APP KEEPS IT FOR GOOD.'], buttons: [{ label: 'GREAT!' }] });
    return true;
  }
  // an iPhone app that starts empty: the save may still be waiting in Safari
  if (Save._app && !Save.stats.runs && !Save.flags.appAsk) {
    Save.flags.appAsk = true; Save.write();
    openModal({
      title: 'PLAYED IN SAFARI BEFORE?', icon: 'icon_sprout',
      lines: ['THIS APP HAS ITS OWN SAVE. IN SAFARI, COPY', 'YOUR SAVE CODE (SETTINGS > SAVE CODE)', 'AND LOAD IT HERE.'],
      buttons: [{ label: 'LOAD', col: 'h', fn: () => { let c = null; try { c = window.prompt('PASTE A SAVE CODE'); } catch (e) { /* blocked */ } if (c) confirmLoad(readSaveCode(c)); } }, { label: 'NEW GARDEN' }],
    });
    return true;
  }
  return false;
}

// ---------- The end of a run ----------
// The cheapest thing the vault can buy next: an upgrade level or a wand.
function nextGoal() {
  let best = null;
  for (const u of UPGRADES) {
    const lv = upLevel(u.id);
    if (lv < u.cost.length && (!best || u.cost[lv] < best.cost)) best = { name: u.name, icon: u.icon, cost: u.cost[lv] };
  }
  for (const id of WAND_IDS) {
    if (Save.wands.includes(id) || (typeof wandReady === 'function' && !wandReady(id))) continue;
    if (!best || WANDS[id].cost < best.cost) best = { name: WANDS[id].name, icon: 'wand_' + id, cost: WANDS[id].cost };
  }
  return best;
}
// Rooms between here and the boss room (through doors).
function roomsToBoss() {
  if (!G.floor || !G.room) return -1;
  const seen = new Set([G.room]), q = [[G.room, 0]];
  while (q.length) {
    const [r, d] = q.shift();
    if (r.type === 'boss') return d;
    for (const k in r.doors) { const o = r.doors[k]; if (o && o.gx !== undefined && !seen.has(o)) { seen.add(o); q.push([o, d + 1]); } }
  }
  return -1;
}
// "So close!": the boss's health left, rooms to the boss, waves to the record.
function nearMiss() {
  if (G.won || !G.floor) return '';
  if (G.mode === 'arena') {
    const w = Math.max(0, G.arena.wave - 1), best = G.bestBefore;
    return best > 0 && w < best ? (best - w === 1 ? 'ONE WAVE FROM YOUR RECORD!' : (best - w) + ' WAVES FROM YOUR RECORD') : '';
  }
  const b = G.boss && !G.boss.dead ? G.boss : null;
  if (b) return foeName(b.type) + ' HAD ONLY ' + Math.max(1, Math.ceil(b.hp / b.maxHp * 100)) + '% LEFT!';
  const d = roomsToBoss();
  return d === 1 ? 'ONE ROOM FROM THE BOSS!' : d > 1 ? d + ' ROOMS FROM THE BOSS' : '';
}
function endLineA() {
  if (G.record) return [G.mode === 'arena' ? 'NEW RECORD: WAVE ' + (G.arena.wave - 1) + '!' : 'NEW RECORD: LAND ' + (G.floor.depth + 1) + '!', 'c'];
  const k = G.player && G.player.lastHit;
  if (G.state === 'over' && k) { const n = foeName(k), boss = EDEF[k] && EDEF[k].boss; return [(boss ? 'THE ' : aOrAn(n)) + n + ' GOT YOU', 'w']; }
  return null;
}
// Layout: title, two lines, stats in two columns, the next goal, what this run unlocked, menu.
function drawEndScreen(title, col, sub) {
  dim(0.55);
  const daily = G.daily && G.daily.score, team = G.players.length > 1, news = RUNLOG.news, goal = !team && !daily ? nextGoal() : null;
  const x = VW / 2 - 112, w = 224;
  const base = 158 + (goal ? 24 : 0) + (news.length && !team ? 26 : 0) + (team ? 10 * Math.ceil(G.players.length / 2) : 0);
  // the frog's second line gets its own row only while the panel still fits the screen
  const frogRow = !team && G.frogLine && base + 10 <= VH - 8;
  let h = daily ? 178 : base + (frogRow ? 10 : 0);
  const y = Math.max(4, Math.round((VH - h) / 2));
  panel(x, y, w, h);
  const bob = Math.round(Math.sin(G.time * 3) * 1.5);
  text(title, VW / 2, y + 7 + bob, col, 2, 1);
  const a = daily ? [(G.daily.kind === 'weekly' ? 'WEEKLY CHALLENGE ' : 'DAILY STAR RUN ') + G.daily.key, 'c'] : endLineA();
  text(a ? a[0] : sub, VW / 2, y + 21, a ? a[1] : 'w', 1, 1);
  const b = G.gift ? 'THE FROG GAVE YOU ' + G.gift + ' VAULT COINS!' : nearMiss() || (G.state === 'over' && G.nemesisLine) || '';
  if (b) text(b, VW / 2, y + 32, G.gift ? 'Y' : 'c', 1, 1);
  let ly = y + 44;
  rect(x + 12, ly, w - 24, 1, '2');
  ly += 6;
  if (daily) {
    drawDailyEnd(x, ly, w);
    G.endMenuY = ly + 72;
    drawMenu(endItems(), G.endMenuY, 13);
    return;
  }
  const s = G.stats, arena = G.mode === 'arena';
  const cells = [[arena ? 'WAVE' : 'LAND', String(arena ? Math.max(1, G.arena.wave) : G.floor.depth + 1)], ['DEFEATED', String(s.kills)],
    ['COINS', String(s.coins)], ['TIME', fmtTime(s.time)], team ? ['HEROES', String(G.players.length)] : ['MAGIC ITEMS', String(s.items)], ['VAULT', '+' + G.run.vault]];
  cells.forEach(([k, v], i) => {
    const cx = i % 2 ? x + w / 2 + 6 : x + 12, cy = ly + Math.floor(i / 2) * 10, cw = w / 2 - 18;
    text(k, cx, cy, 'l', 1); text(v, cx + cw, cy, k === 'VAULT' ? 'c' : 'Y', 1, 2);
  });
  ly += 30;
  if (team) {
    G.players.forEach((p, i) => {
      const cx = i % 2 ? x + w / 2 + 6 : x + 12, cy = ly + Math.floor(i / 2) * 10;
      text(p.name, cx, cy, seatCol(p), 1); text(String(p.kills), cx + w / 2 - 18, cy, 'w', 1, 2);
    });
    ly += 10 * Math.ceil(G.players.length / 2);
  }
  rect(x + 12, ly + 1, w - 24, 1, '2');
  ly += 6;
  if (goal) {
    const can = Save.vault >= goal.cost, blink = can && Math.floor(G.time * 3) % 2;
    const ic = S(goal.icon);
    drawS(ic, x + 12 + ((16 - ic.w) >> 1), ly + ((16 - ic.h) >> 1));
    text(can ? 'YOU CAN BUY: ' + goal.name + '!' : 'NEXT: ' + goal.name, x + 34, ly + 1, can ? (blink ? 'w' : 'Y') : 'w', 1);
    const bx = x + 34, bw = w - 46 - 34, k = Math.min(1, Save.vault / goal.cost);
    rect(bx, ly + 11, bw + 2, 5, '0'); rect(bx + 1, ly + 12, Math.round(bw * k), 3, can ? 'Y' : 'c');
    text(Math.min(Save.vault, goal.cost) + '/' + goal.cost, x + w - 12, ly + 10, 'Y', 1, 2);
    ly += 24;
  }
  if (news.length && !team) {
    const n = Math.min(8, news.length), gx = VW / 2 - (n * 18 - 2) / 2;
    news.slice(0, n).forEach((it, i) => {
      rect(gx + i * 18 - 1, ly - 1, 18, 18, '2');
      if (it.icon) { const ic = S(it.icon); drawS(ic, gx + i * 18 + ((16 - ic.w) >> 1), ly + ((16 - ic.h) >> 1)); }
    });
    const hover = news.find((it, i) => mouseOn() && Input.mx >= gx + i * 18 && Input.mx < gx + i * 18 + 16 && Input.my >= ly && Input.my < ly + 16);
    text((hover || news[Math.floor(G.time / 1.6) % news.length]).text, VW / 2, ly + 19, 'h', 1, 1);
    ly += 30;
  }
  G.endMenuY = ly + 4;
  drawMenu(endItems(), G.endMenuY, 13);
  if (NET.role === 'client') text('WAITING FOR THE HOST...', VW / 2, y + h - 10, 'c', 1, 1);
  else if (!team) {
    // Mister Ribbit's word about this run, taking turns with a reason to come back
    const why = comeBackLine(), lines = G.frogLine ? wrapText(G.frogLine, w - 20).slice(0, 2) : [];
    const show = lines.length && (frogRow || lines.length < 2) && (!why || Math.floor(G.time / 4) % 2 === 0);
    if (show) lines.forEach((l, i, a) => text(l, VW / 2, y + h - 10 - (a.length - 1 - i) * 10, 'h', 1, 1));
    else if (why) text(why, VW / 2, y + h - 10, 'c', 1, 1);
  }
}

// ---------- NEW badges on menu rows (posOf(i): the row's [x, y]; default: centred) ----------
function drawNewTags(items, y, gap, keyOf, posOf) {
  items.forEach((it, i) => {
    const k = keyOf(it);
    if (!k || (k !== true && !hasBadge(k))) return;
    const sel = i === G.menuSel, [x, ry] = posOf ? posOf(i) : [VW / 2, y + i * gap];
    const nx = x + textW(it) / 2 + (sel ? 19 : 17);
    if (Math.floor(G.time * 3) % 3) text('NEW', nx, ry, 'P', 2);
  });
}
