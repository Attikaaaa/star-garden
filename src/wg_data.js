'use strict';
// Wildgrove (the Survival mode): data tables. Everything is data driven: ground, objects, items,
// recipes. Ids of ground and objects are array indices that go into saved worlds, so the lists
// are append only: never reorder or delete an entry.
const WG = { VER: 1, CS: 32, T: 16 };

// ---------- Ground ----------
// pri: the higher one spreads its edge over a lower neighbour. liq: water/lava drawn as animated backdrop.
const GROUND = [];
const G_ID = {};
function wgDefGround(id, o) { G_ID[id] = GROUND.length; GROUND.push(Object.assign({ id, pri: 5, speed: 1, ramp: ['g', 'G', 'h', 'H'] }, o)); }
wgDefGround('deep', { name: 'DEEP WATER', pri: 0, liq: 'water', swim: 1, speed: 0.45, ramp: ['b', 'B', 'c', 'C'] });
wgDefGround('shallow', { name: 'SHALLOW WATER', pri: 1, liq: 'water', wade: 1, speed: 0.7, ramp: ['B', 'c', 'C', 'w'] });
wgDefGround('sand', { name: 'SAND', pri: 3, ramp: ['e', 'a', 'A', 'w'], step: 'sand' });
wgDefGround('grass', { name: 'GRASS', pri: 6, ramp: ['g', 'G', 'h', 'H'], step: 'grass' });
wgDefGround('dirt', { name: 'DIRT', pri: 4, ramp: ['u', 'n', 'N', 'k'], step: 'dirt' });
wgDefGround('snow', { name: 'SNOW', pri: 7, ramp: ['m', 'l', 'L', 'w'], step: 'snow' });
wgDefGround('rock', { name: 'STONE FLOOR', pri: 5, ramp: ['X', 'd', 'm', 'l'], step: 'stone' });
wgDefGround('mud', { name: 'MUD', pri: 4, ramp: ['u', 'n', 't', 'T'], speed: 0.8, step: 'dirt' });
wgDefGround('jungle', { name: 'JUNGLE FLOOR', pri: 6, ramp: ['z', 'g', 'G', 'h'], step: 'grass' });
wgDefGround('ash', { name: 'ASH', pri: 5, ramp: ['x', 'X', 'X', 'd'], step: 'stone' });
wgDefGround('lava', { name: 'LAVA', pri: 0, liq: 'lava', hurt: 1, speed: 0.4, ramp: ['r', 'o', 'O', 'y'] });
wgDefGround('tilled', { name: 'TILLED SOIL', pri: 4, ramp: ['u', 'n', 'N', 'k'], tilled: 1, step: 'dirt' });
wgDefGround('ice', { name: 'ICE', pri: 5, ramp: ['B', 'c', 'C', 'w'], slip: 1, step: 'snow' });
wgDefGround('cave', { name: 'CAVE FLOOR', pri: 5, ramp: ['x', 'X', 'd', 'm'], step: 'stone' });
wgDefGround('moss', { name: 'MOSSY STONE', pri: 5, ramp: ['z', 'g', 'G', 'm'], step: 'stone' });
wgDefGround('path', { name: 'PATH', pri: 5, ramp: ['n', 'N', 'O', 'a'], step: 'dirt' });
wgDefGround('f_wood', { name: 'WOOD FLOOR', pri: 8, ramp: ['u', 'n', 'N', 'O'], floor: 1, step: 'wood' });
wgDefGround('f_stone', { name: 'STONE TILES', pri: 8, ramp: ['d', 'm', 'l', 'L'], floor: 1, step: 'stone' });
wgDefGround('f_brick', { name: 'BRICK FLOOR', pri: 8, ramp: ['n', 'R', 'N', 'O'], floor: 1, step: 'stone' });
wgDefGround('f_red', { name: 'RED CARPET', pri: 8, ramp: ['p', 'r', 'R', 'q'], floor: 1, step: 'rug' });
wgDefGround('f_blue', { name: 'BLUE CARPET', pri: 8, ramp: ['b', 'B', 'c', 'C'], floor: 1, step: 'rug' });
wgDefGround('f_green', { name: 'GREEN CARPET', pri: 8, ramp: ['g', 'G', 'h', 'H'], floor: 1, step: 'rug' });

// ---------- Tools and tiers ----------
// power = how hard a hit lands on an object that wants this tool
const TIERS = [
  { id: 'wood', name: 'WOODEN', col: ['u', 'n', 'N', 'O'], pow: 1, dmg: 2 },
  { id: 'stone', name: 'STONE', col: ['d', 'm', 'l', 'L'], pow: 1.7, dmg: 3 },
  { id: 'copper', name: 'COPPER', col: ['n', 'N', 'O', 'Y'], pow: 2.4, dmg: 4 },
  { id: 'iron', name: 'IRON', col: ['X', 'm', 'l', 'L'], pow: 3.4, dmg: 6 },
  { id: 'crystal', name: 'CRYSTAL', col: ['b', 'B', 'c', 'C'], pow: 4.8, dmg: 9 },
  { id: 'star', name: 'STAR', col: ['o', 'y', 'Y', 'w'], pow: 6.5, dmg: 14 },
];

// ---------- Items ----------
// kind: res | tool | weapon | food | place | armor | seed | misc. icon: art recipe name (wg_art.js).
const WGI = {};
function wgItem(id, name, kind, o) { WGI[id] = Object.assign({ id, name, kind, stack: 99 }, o || {}); }
for (const [id, name, o] of [
  ['wood', 'WOOD', {}], ['stick', 'STICK', {}], ['stone', 'STONE', {}], ['fiber', 'PLANT FIBER', {}], ['flint', 'FLINT', {}],
  ['coal', 'COAL', { fuel: 40 }], ['copper_ore', 'COPPER ORE', {}], ['iron_ore', 'IRON ORE', {}], ['copper', 'COPPER BAR', {}], ['iron', 'IRON BAR', {}],
  ['crystal', 'CRYSTAL', {}], ['star_ore', 'STAR ORE', {}], ['star_bar', 'STAR BAR', {}], ['sand', 'SAND', {}], ['clay', 'CLAY', {}],
  ['glass', 'GLASS', {}], ['brick', 'BRICK', {}], ['leather', 'LEATHER', {}], ['wool', 'WOOL', {}], ['feather', 'FEATHER', {}],
  ['bone', 'BONE', {}], ['slime', 'SLIME', {}], ['string', 'STRING', {}], ['egg', 'EGG', {}], ['honey', 'HONEY', {}],
  ['flour', 'FLOUR', {}], ['sugar', 'SUGAR', {}], ['petal_r', 'RED PETALS', {}], ['petal_y', 'YELLOW PETALS', {}], ['petal_b', 'BLUE PETALS', {}],
  ['petal_w', 'WHITE PETALS', {}], ['petal_p', 'PURPLE PETALS', {}], ['ember', 'EMBER', {}], ['obsidian', 'OBSIDIAN', {}], ['pearl', 'PEARL', {}],
  ['shell', 'SHELL', {}], ['cactus_fruit', 'CACTUS FRUIT', {}], ['ice_shard', 'ICE SHARD', {}], ['glow_berry', 'GLOW BERRY', {}],
]) wgItem(id, name, 'res', o);
for (const [id, name, hp, o] of [
  ['berry', 'BERRIES', 2, {}], ['apple', 'APPLE', 4, {}], ['carrot', 'CARROT', 3, {}], ['potato', 'POTATO', 2, {}], ['wheat', 'WHEAT', 1, {}],
  ['pumpkin', 'PUMPKIN', 3, {}], ['mush_r', 'RED MUSHROOM', 1, { bad: 1 }], ['mush_b', 'BROWN MUSHROOM', 3, {}], ['fish', 'RAW FISH', 2, { bad: 1 }],
  ['meat', 'RAW MEAT', 2, { bad: 1 }], ['cooked_fish', 'COOKED FISH', 7, {}], ['cooked_meat', 'STEAK', 9, {}], ['bread', 'BREAD', 8, {}],
  ['baked_potato', 'BAKED POTATO', 6, {}], ['stew', 'HEARTY STEW', 14, { buff: 'regen' }], ['pie', 'BERRY PIE', 12, { buff: 'speed' }],
  ['carrot_soup', 'CARROT SOUP', 10, { buff: 'night' }], ['honey_cake', 'HONEY CAKE', 12, { buff: 'dig' }],
]) wgItem(id, name, 'food', Object.assign({ food: hp }, o));
for (const [id, name, crop] of [['seed_wheat', 'WHEAT SEEDS', 'wheat'], ['seed_carrot', 'CARROT SEEDS', 'carrot'], ['seed_potato', 'POTATO EYES', 'potato'],
  ['seed_pumpkin', 'PUMPKIN SEEDS', 'pumpkin'], ['seed_berry', 'BERRY CUTTING', 'berrybush']]) wgItem(id, name, 'seed', { crop });
// tools and weapons per tier
for (const t of TIERS) {
  for (const [k, n, tool] of [['pick', 'PICKAXE', 'pick'], ['axe', 'AXE', 'axe'], ['shovel', 'SHOVEL', 'shovel'], ['hoe', 'HOE', 'hoe']])
    wgItem(k + '_' + t.id, t.name + ' ' + n, 'tool', { tool, tier: TIERS.indexOf(t), stack: 1 });
  wgItem('sword_' + t.id, t.name + ' SWORD', 'weapon', { weapon: 'sword', tier: TIERS.indexOf(t), stack: 1 });
  wgItem('spear_' + t.id, t.name + ' SPEAR', 'weapon', { weapon: 'spear', tier: TIERS.indexOf(t), stack: 1 });
}
wgItem('bow', 'HUNTING BOW', 'weapon', { weapon: 'bow', tier: 0, stack: 1 });
wgItem('longbow', 'STAR LONGBOW', 'weapon', { weapon: 'bow', tier: 4, stack: 1 });
wgItem('arrow', 'ARROW', 'res', {});
wgItem('wand_spark', 'SPARK WAND', 'weapon', { weapon: 'wand', tier: 1, stack: 1 });
wgItem('wand_frost', 'FROST WAND', 'weapon', { weapon: 'wand', tier: 3, stack: 1 });
wgItem('wand_star', 'STARFALL WAND', 'weapon', { weapon: 'wand', tier: 5, stack: 1 });
wgItem('rod', 'FISHING ROD', 'tool', { tool: 'rod', tier: 0, stack: 1 });
wgItem('can', 'WATERING CAN', 'tool', { tool: 'can', tier: 0, stack: 1 });
wgItem('bucket', 'BUCKET', 'tool', { tool: 'bucket', tier: 0, stack: 16 });
wgItem('bucket_water', 'WATER BUCKET', 'tool', { tool: 'bucket', tier: 0, stack: 16, full: 'water' });
wgItem('shears', 'SHEARS', 'tool', { tool: 'shears', tier: 0, stack: 1 });
wgItem('torch', 'TORCH', 'place', { place: 'torch' });
// armour: head, body, feet by tier (leather, copper, iron, crystal, star)
for (const [i, t] of [['leather', 'LEATHER'], ['copper', 'COPPER'], ['iron', 'IRON'], ['crystal', 'CRYSTAL'], ['star', 'STAR']].entries())
  for (const [slot, n, base] of [['head', 'CAP', 1], ['body', 'TUNIC', 2], ['feet', 'BOOTS', 1]])
    wgItem(slot + '_' + t[0], t[1] + ' ' + n, 'armor', { slot, def: base + i * (slot === 'body' ? 2 : 1), stack: 1, tint: i });

// ---------- Objects (anything standing on a tile) ----------
// kind: tree | rock | plant | wall | station | crop | deco | door | storage | light | floor-like
// tool: what mines it; tier: min tier; hp: hit points; drops: [item, min, max, chance]
const OBJ = [null];
const O_ID = {};
function wgObj(id, o) { O_ID[id] = OBJ.length; OBJ.push(Object.assign({ id, name: id.toUpperCase(), hp: 4, tool: 'hand', tier: 0, solid: 1, drops: [], kind: 'deco' }, o)); }
const DR = (it, a, b, c) => [it, a, b === undefined ? a : b, c === undefined ? 1 : c];
// trees
wgObj('oak', { name: 'OAK TREE', kind: 'tree', tool: 'axe', hp: 10, drops: [DR('wood', 3, 4), DR('stick', 1, 2), DR('apple', 1, 1, 0.12)], sap: 'sap_oak', tall: 2 });
wgObj('birch', { name: 'BIRCH TREE', kind: 'tree', tool: 'axe', hp: 9, drops: [DR('wood', 3, 4), DR('stick', 1, 2)], sap: 'sap_birch', tall: 2 });
wgObj('pine', { name: 'PINE TREE', kind: 'tree', tool: 'axe', hp: 11, drops: [DR('wood', 3, 5), DR('stick', 1, 2)], sap: 'sap_pine', tall: 2 });
wgObj('snowpine', { name: 'SNOWY PINE', kind: 'tree', tool: 'axe', hp: 11, drops: [DR('wood', 3, 5), DR('stick', 1, 2), DR('ice_shard', 1, 1, 0.1)], sap: 'sap_pine', tall: 2 });
wgObj('palm', { name: 'PALM TREE', kind: 'tree', tool: 'axe', hp: 8, drops: [DR('wood', 2, 3), DR('fiber', 1, 2), DR('shell', 1, 1, 0.1)], sap: 'sap_palm', tall: 2 });
wgObj('jungle', { name: 'JUNGLE TREE', kind: 'tree', tool: 'axe', hp: 16, drops: [DR('wood', 5, 7), DR('stick', 2, 3), DR('fiber', 1, 2)], sap: 'sap_jungle', tall: 3 });
wgObj('dead', { name: 'DEAD TREE', kind: 'tree', tool: 'axe', hp: 6, drops: [DR('wood', 1, 2), DR('stick', 2, 3)], tall: 2 });
wgObj('willow', { name: 'WILLOW', kind: 'tree', tool: 'axe', hp: 9, drops: [DR('wood', 2, 3), DR('string', 1, 2, 0.4), DR('fiber', 1, 2)], tall: 2 });
wgObj('cactus', { name: 'CACTUS', kind: 'tree', tool: 'axe', hp: 4, drops: [DR('fiber', 1, 2), DR('cactus_fruit', 1, 1, 0.5)], thorn: 1, tall: 1 });
wgObj('bigmush', { name: 'GIANT MUSHROOM', kind: 'tree', tool: 'axe', hp: 7, drops: [DR('mush_b', 1, 2), DR('mush_r', 0, 1, 0.4), DR('glow_berry', 0, 1, 0.1)], tall: 2, light: 40 });
for (const n of ['oak', 'birch', 'pine', 'palm', 'jungle']) wgObj('sap_' + n, { name: n.toUpperCase() + ' SAPLING', kind: 'sapling', hp: 1, solid: 0, grow: n, drops: [DR('stick', 1, 1)] });
// stone and ore (natural boulders on the surface; solid rock walls underground use the walls below)
wgObj('boulder', { name: 'BOULDER', kind: 'rock', tool: 'pick', hp: 14, drops: [DR('stone', 3, 4), DR('flint', 0, 1, 0.3)] });
wgObj('pebbles', { name: 'PEBBLES', kind: 'rock', tool: 'hand', hp: 1, solid: 0, drops: [DR('stone', 1, 1)] });
wgObj('ore_coal', { name: 'COAL VEIN', kind: 'rock', tool: 'pick', hp: 16, drops: [DR('coal', 2, 3), DR('stone', 0, 1, 0.5)] });
wgObj('ore_copper', { name: 'COPPER VEIN', kind: 'rock', tool: 'pick', hp: 18, tier: 1, drops: [DR('copper_ore', 2, 3)] });
wgObj('ore_iron', { name: 'IRON VEIN', kind: 'rock', tool: 'pick', hp: 24, tier: 2, drops: [DR('iron_ore', 2, 3)] });
wgObj('ore_crystal', { name: 'CRYSTAL CLUSTER', kind: 'rock', tool: 'pick', hp: 30, tier: 3, drops: [DR('crystal', 2, 3)], light: 56 });
wgObj('ore_star', { name: 'STAR ORE', kind: 'rock', tool: 'pick', hp: 40, tier: 4, drops: [DR('star_ore', 1, 2)], light: 64 });
wgObj('obsidian', { name: 'OBSIDIAN', kind: 'rock', tool: 'pick', hp: 36, tier: 3, drops: [DR('obsidian', 1, 1)] });
wgObj('iceblock', { name: 'ICE CHUNK', kind: 'rock', tool: 'pick', hp: 8, drops: [DR('ice_shard', 1, 2)] });
wgObj('clayrock', { name: 'CLAY DEPOSIT', kind: 'rock', tool: 'shovel', hp: 6, drops: [DR('clay', 2, 3)], solid: 0 });
wgObj('sandpile', { name: 'SAND DUNE', kind: 'rock', tool: 'shovel', hp: 4, drops: [DR('sand', 2, 3)], solid: 0 });
// plants
wgObj('tallgrass', { name: 'TALL GRASS', kind: 'plant', hp: 1, solid: 0, drops: [DR('fiber', 1, 1, 0.6), DR('seed_wheat', 1, 1, 0.1)] });
wgObj('fern', { name: 'FERN', kind: 'plant', hp: 1, solid: 0, drops: [DR('fiber', 1, 2)] });
wgObj('reeds', { name: 'REEDS', kind: 'plant', hp: 1, solid: 0, drops: [DR('fiber', 1, 2), DR('string', 0, 1, 0.3)] });
wgObj('deadbush', { name: 'DRY BUSH', kind: 'plant', hp: 1, solid: 0, drops: [DR('stick', 1, 2)] });
wgObj('berrybush', { name: 'BERRY BUSH', kind: 'plant', hp: 2, solid: 1, grow: 1, ripe: 'berrybush_r', drops: [DR('stick', 0, 1, 0.5)] });
wgObj('berrybush_r', { name: 'RIPE BERRY BUSH', kind: 'plant', hp: 2, solid: 1, pick: 'berrybush', drops: [DR('berry', 2, 4), DR('seed_berry', 0, 1, 0.3)] });
for (const [n, p] of [['r', 'RED'], ['y', 'YELLOW'], ['b', 'BLUE'], ['w', 'WHITE'], ['p', 'PURPLE']])
  wgObj('flower_' + n, { name: p + ' FLOWER', kind: 'plant', hp: 1, solid: 0, drops: [DR('petal_' + n, 1, 2)] });
wgObj('mush_red', { name: 'RED MUSHROOM', kind: 'plant', hp: 1, solid: 0, drops: [DR('mush_r', 1, 1)] });
wgObj('mush_brown', { name: 'BROWN MUSHROOM', kind: 'plant', hp: 1, solid: 0, drops: [DR('mush_b', 1, 2)] });
wgObj('glowcap', { name: 'GLOWCAP', kind: 'plant', hp: 1, solid: 0, drops: [DR('glow_berry', 1, 2)], light: 36 });
wgObj('lilypad', { name: 'LILY PAD', kind: 'plant', hp: 1, solid: 0, drops: [DR('fiber', 1, 1)], water: 1 });
wgObj('wild_wheat', { name: 'WILD WHEAT', kind: 'plant', hp: 1, solid: 0, drops: [DR('wheat', 1, 2), DR('seed_wheat', 1, 2)] });
wgObj('wild_carrot', { name: 'WILD CARROT', kind: 'plant', hp: 1, solid: 0, drops: [DR('carrot', 1, 1), DR('seed_carrot', 1, 2)] });
wgObj('wild_pumpkin', { name: 'PUMPKIN PATCH', kind: 'plant', hp: 2, solid: 1, drops: [DR('pumpkin', 1, 2), DR('seed_pumpkin', 1, 2)] });
wgObj('shellrock', { name: 'SHELLS', kind: 'plant', hp: 1, solid: 0, drops: [DR('shell', 1, 2), DR('pearl', 0, 1, 0.08)] });
// crops: four growth stages in meta (0..3); stage 3 is ripe
for (const [c, name, item, seed] of [['wheat', 'WHEAT', 'wheat', 'seed_wheat'], ['carrot', 'CARROTS', 'carrot', 'seed_carrot'], ['potato', 'POTATOES', 'potato', 'seed_potato'], ['pumpkin', 'PUMPKIN VINE', 'pumpkin', 'seed_pumpkin']])
  wgObj('crop_' + c, { name: name, kind: 'crop', hp: 1, solid: 0, crop: c, drops: [DR(item, 1, 3), DR(seed, 1, 2)], seed });
// walls: solid blocks you can build with (and the underground's rock walls)
for (const [id, name, drop, tool, hp, ramp] of [
  ['w_wood', 'WOOD WALL', 'wall_wood', 'axe', 6, ['u', 'n', 'N', 'O']], ['w_stone', 'STONE WALL', 'wall_stone', 'pick', 10, ['d', 'm', 'l', 'L']],
  ['w_brick', 'BRICK WALL', 'wall_brick', 'pick', 10, ['n', 'R', 'N', 'O']], ['w_sand', 'SANDSTONE WALL', 'wall_sand', 'pick', 8, ['e', 'a', 'A', 'w']],
  ['w_ice', 'ICE WALL', 'wall_ice', 'pick', 6, ['B', 'c', 'C', 'w']], ['w_glass', 'GLASS WALL', 'wall_glass', 'pick', 3, ['c', 'C', 'w', 'w']],
  ['w_iron', 'IRON WALL', 'wall_iron', 'pick', 24, ['X', 'm', 'l', 'L']],
]) wgObj(id, { name, kind: 'wall', tool, hp, ramp, tier: id === 'w_iron' ? 2 : 0, drops: [DR(drop, 1, 1)], glass: id === 'w_glass' ? 1 : 0 });
// the natural rock the caves are cut from (drops stone, ores are in it)
wgObj('cliff', { name: 'ROCK', kind: 'wall', tool: 'pick', hp: 12, ramp: ['X', 'd', 'm', 'l'], natural: 1, drops: [DR('stone', 1, 2)] });
wgObj('cliff_ice', { name: 'FROZEN ROCK', kind: 'wall', tool: 'pick', hp: 12, ramp: ['b', 'B', 'c', 'C'], natural: 1, drops: [DR('stone', 1, 1), DR('ice_shard', 0, 1, 0.4)] });
wgObj('cliff_sand', { name: 'SANDSTONE', kind: 'wall', tool: 'pick', hp: 10, ramp: ['e', 'a', 'A', 'w'], natural: 1, drops: [DR('sand', 1, 2), DR('stone', 0, 1, 0.5)] });
wgObj('cliff_ash', { name: 'ASH ROCK', kind: 'wall', tool: 'pick', hp: 14, ramp: ['x', 'X', 'd', 'm'], natural: 1, drops: [DR('stone', 1, 2), DR('coal', 0, 1, 0.4)] });
// doors, storage, stations, light, decoration (placeable)
wgObj('door', { name: 'WOODEN DOOR', kind: 'door', tool: 'axe', hp: 5, drops: [DR('door_wood', 1, 1)] });
wgObj('door_open', { name: 'OPEN DOOR', kind: 'door', tool: 'axe', hp: 5, solid: 0, drops: [DR('door_wood', 1, 1)], open: 1 });
wgObj('irondoor', { name: 'IRON DOOR', kind: 'door', tool: 'pick', hp: 16, tier: 2, drops: [DR('door_iron', 1, 1)] });
wgObj('irondoor_open', { name: 'OPEN IRON DOOR', kind: 'door', tool: 'pick', hp: 16, tier: 2, solid: 0, drops: [DR('door_iron', 1, 1)], open: 1 });
wgObj('fence', { name: 'FENCE', kind: 'wall', tool: 'axe', hp: 3, fence: 1, drops: [DR('fence', 1, 1)] });
wgObj('chest', { name: 'CHEST', kind: 'storage', tool: 'axe', hp: 6, slots: 18, drops: [DR('chest', 1, 1)] });
wgObj('barrel', { name: 'BARREL', kind: 'storage', tool: 'axe', hp: 6, slots: 12, drops: [DR('barrel', 1, 1)] });
wgObj('bench', { name: 'WORKBENCH', kind: 'station', st: 'bench', tool: 'axe', hp: 8, drops: [DR('bench', 1, 1)] });
wgObj('furnace', { name: 'FURNACE', kind: 'station', st: 'furnace', tool: 'pick', hp: 10, drops: [DR('furnace', 1, 1)], light: 44 });
wgObj('anvil', { name: 'ANVIL', kind: 'station', st: 'anvil', tool: 'pick', hp: 12, tier: 1, drops: [DR('anvil', 1, 1)] });
wgObj('alch', { name: 'ALCHEMY TABLE', kind: 'station', st: 'alch', tool: 'axe', hp: 8, drops: [DR('alch', 1, 1)] });
wgObj('loom', { name: 'LOOM', kind: 'station', st: 'loom', tool: 'axe', hp: 8, drops: [DR('loom', 1, 1)] });
wgObj('campfire', { name: 'CAMPFIRE', kind: 'station', st: 'fire', tool: 'hand', hp: 2, drops: [DR('campfire', 1, 1)], light: 72, solid: 0 });
wgObj('torch', { name: 'TORCH', kind: 'light', tool: 'hand', hp: 1, solid: 0, drops: [DR('torch', 1, 1)], light: 76 });
wgObj('lantern', { name: 'LANTERN', kind: 'light', tool: 'hand', hp: 2, solid: 1, drops: [DR('lantern', 1, 1)], light: 96 });
wgObj('bed', { name: 'BED', kind: 'bed', tool: 'axe', hp: 6, solid: 0, drops: [DR('bed', 1, 1)] });
wgObj('table', { name: 'TABLE', kind: 'deco', tool: 'axe', hp: 5, drops: [DR('table', 1, 1)] });
wgObj('chair', { name: 'CHAIR', kind: 'deco', tool: 'axe', hp: 3, solid: 0, drops: [DR('chair', 1, 1)] });
wgObj('sign', { name: 'SIGN', kind: 'sign', tool: 'axe', hp: 2, solid: 0, drops: [DR('sign', 1, 1)] });
wgObj('bookshelf', { name: 'BOOKSHELF', kind: 'deco', tool: 'axe', hp: 6, drops: [DR('bookshelf', 1, 1)] });
wgObj('scarecrow', { name: 'SCARECROW', kind: 'deco', tool: 'axe', hp: 3, drops: [DR('scarecrow', 1, 1)] });
wgObj('well', { name: 'WELL', kind: 'well', tool: 'pick', hp: 12, drops: [DR('stone', 4, 6)] });
wgObj('stairs_down', { name: 'CAVE STAIRS', kind: 'stairs', solid: 0, hp: 99999, down: 1 });
wgObj('stairs_up', { name: 'STAIRS UP', kind: 'stairs', solid: 0, hp: 99999, up: 1 });
wgObj('altar', { name: 'OLD ALTAR', kind: 'altar', solid: 1, hp: 99999, light: 40 });
wgObj('ruin_pillar', { name: 'OLD PILLAR', kind: 'rock', tool: 'pick', hp: 18, drops: [DR('stone', 2, 3)] });
wgObj('ruin_chest', { name: 'OLD CHEST', kind: 'storage', tool: 'axe', hp: 6, slots: 12, loot: 1, drops: [] });
wgObj('bones', { name: 'BONES', kind: 'plant', hp: 1, solid: 0, drops: [DR('bone', 1, 2)] });
wgObj('cobweb', { name: 'COBWEB', kind: 'plant', hp: 1, solid: 0, drops: [DR('string', 1, 2)], slow: 1 });
wgObj('geyser', { name: 'STEAM VENT', kind: 'deco', solid: 0, hp: 99999 });
wgObj('rift', { name: 'STAR RIFT', kind: 'altar', solid: 1, hp: 99999, light: 120 });

// placeable items: the item that puts an object down (id => object)
const PLACE = { torch: 'torch', lantern: 'lantern', chest: 'chest', barrel: 'barrel', bench: 'bench', furnace: 'furnace', anvil: 'anvil', alch: 'alch', loom: 'loom',
  campfire: 'campfire', bed: 'bed', table: 'table', chair: 'chair', sign: 'sign', bookshelf: 'bookshelf', scarecrow: 'scarecrow', fence: 'fence',
  door_wood: 'door', door_iron: 'irondoor', wall_wood: 'w_wood', wall_stone: 'w_stone', wall_brick: 'w_brick', wall_sand: 'w_sand', wall_ice: 'w_ice',
  wall_glass: 'w_glass', wall_iron: 'w_iron', sap_oak: 'sap_oak', sap_birch: 'sap_birch', sap_pine: 'sap_pine', sap_palm: 'sap_palm', sap_jungle: 'sap_jungle' };
const PLACE_G = { floor_wood: 'f_wood', floor_stone: 'f_stone', floor_brick: 'f_brick', carpet_red: 'f_red', carpet_blue: 'f_blue', carpet_green: 'f_green', path_dirt: 'path' };
for (const [id, name] of [['lantern', 'LANTERN'], ['chest', 'CHEST'], ['barrel', 'BARREL'], ['bench', 'WORKBENCH'], ['furnace', 'FURNACE'], ['anvil', 'ANVIL'],
  ['alch', 'ALCHEMY TABLE'], ['loom', 'LOOM'], ['campfire', 'CAMPFIRE'], ['bed', 'BED'], ['table', 'TABLE'], ['chair', 'CHAIR'], ['sign', 'SIGN'],
  ['bookshelf', 'BOOKSHELF'], ['scarecrow', 'SCARECROW'], ['fence', 'FENCE'], ['door_wood', 'WOODEN DOOR'], ['door_iron', 'IRON DOOR'],
  ['wall_wood', 'WOOD WALL'], ['wall_stone', 'STONE WALL'], ['wall_brick', 'BRICK WALL'], ['wall_sand', 'SANDSTONE WALL'], ['wall_ice', 'ICE WALL'],
  ['wall_glass', 'GLASS WALL'], ['wall_iron', 'IRON WALL'], ['floor_wood', 'WOOD FLOOR'], ['floor_stone', 'STONE TILES'], ['floor_brick', 'BRICK FLOOR'],
  ['carpet_red', 'RED CARPET'], ['carpet_blue', 'BLUE CARPET'], ['carpet_green', 'GREEN CARPET'], ['path_dirt', 'DIRT PATH'],
  ['sap_oak', 'OAK SAPLING'], ['sap_birch', 'BIRCH SAPLING'], ['sap_pine', 'PINE SAPLING'], ['sap_palm', 'PALM SAPLING'], ['sap_jungle', 'JUNGLE SAPLING']])
  wgItem(id, name, 'place', { place: PLACE[id] || null, placeG: PLACE_G[id] || null });
WGI.torch.place = 'torch';

// ---------- Recipes ----------
// at: hand | bench | furnace | anvil | alch | loom | fire. in: {item: n}.
const RECIPES = [];
function wgRec(out, n, inp, at, o) { RECIPES.push(Object.assign({ out, n, in: inp, at: at || 'hand' }, o || {})); }
wgRec('stick', 4, { wood: 1 });
wgRec('torch', 4, { stick: 1, coal: 1 });
wgRec('torch', 2, { stick: 2, fiber: 1, ember: 1 });
wgRec('bench', 1, { wood: 8, stick: 2 });
wgRec('campfire', 1, { wood: 4, stick: 3, stone: 2 });
wgRec('chest', 1, { wood: 8 });
wgRec('barrel', 1, { wood: 6, stick: 2 });
wgRec('bed', 1, { wood: 6, wool: 3 }, 'bench');
wgRec('table', 1, { wood: 6 }, 'bench'); wgRec('chair', 1, { wood: 3, stick: 1 }, 'bench');
wgRec('sign', 2, { wood: 2, stick: 1 }, 'bench'); wgRec('bookshelf', 1, { wood: 8, leather: 2 }, 'bench');
wgRec('fence', 4, { stick: 4, wood: 1 }, 'bench'); wgRec('door_wood', 1, { wood: 6 }, 'bench');
wgRec('scarecrow', 1, { stick: 4, fiber: 4, wheat: 2 }, 'bench');
wgRec('furnace', 1, { stone: 10, coal: 1 }, 'bench'); wgRec('anvil', 1, { iron: 6, stone: 4 }, 'bench');
wgRec('alch', 1, { wood: 6, glass: 3, stone: 2 }, 'bench'); wgRec('loom', 1, { wood: 8, string: 4 }, 'bench');
wgRec('wall_wood', 4, { wood: 2 }, 'bench'); wgRec('wall_stone', 4, { stone: 4 }, 'bench'); wgRec('wall_brick', 4, { brick: 4 }, 'bench');
wgRec('wall_sand', 4, { sand: 4 }, 'bench'); wgRec('wall_ice', 4, { ice_shard: 4 }, 'bench'); wgRec('wall_glass', 4, { glass: 2 }, 'bench');
wgRec('wall_iron', 4, { iron: 3 }, 'anvil'); wgRec('door_iron', 1, { iron: 6 }, 'anvil');
wgRec('floor_wood', 6, { wood: 2 }, 'bench'); wgRec('floor_stone', 6, { stone: 3 }, 'bench'); wgRec('floor_brick', 6, { brick: 3 }, 'bench');
wgRec('carpet_red', 4, { wool: 2, petal_r: 2 }, 'loom'); wgRec('carpet_blue', 4, { wool: 2, petal_b: 2 }, 'loom'); wgRec('carpet_green', 4, { wool: 2, fiber: 2 }, 'loom');
wgRec('path_dirt', 6, { stone: 1, sand: 2 }, 'bench');
wgRec('lantern', 1, { copper: 2, glass: 1, torch: 1 }, 'anvil');
wgRec('string', 2, { fiber: 3 }); wgRec('arrow', 6, { stick: 2, flint: 1, feather: 1 });
wgRec('bucket', 1, { copper: 3 }, 'anvil'); wgRec('shears', 1, { copper: 2, stick: 1 }, 'anvil');
wgRec('rod', 1, { stick: 3, string: 2 }, 'bench'); wgRec('can', 1, { copper: 2, bucket: 1 }, 'anvil');
wgRec('bow', 1, { wood: 4, string: 3 }, 'bench'); wgRec('longbow', 1, { star_bar: 3, string: 4, crystal: 2 }, 'anvil');
wgRec('wand_spark', 1, { stick: 2, crystal: 1, copper: 1 }, 'alch'); wgRec('wand_frost', 1, { stick: 2, crystal: 2, ice_shard: 6 }, 'alch');
wgRec('wand_star', 1, { stick: 2, star_bar: 3, crystal: 3 }, 'alch');
// smelting and cooking (furnace / campfire)
wgRec('copper', 1, { copper_ore: 2, coal: 1 }, 'furnace'); wgRec('iron', 1, { iron_ore: 2, coal: 1 }, 'furnace');
wgRec('star_bar', 1, { star_ore: 3, coal: 2 }, 'furnace');
wgRec('glass', 2, { sand: 3, coal: 1 }, 'furnace'); wgRec('brick', 2, { clay: 3, coal: 1 }, 'furnace');
wgRec('cooked_fish', 1, { fish: 1 }, 'fire'); wgRec('cooked_meat', 1, { meat: 1 }, 'fire'); wgRec('baked_potato', 1, { potato: 1 }, 'fire');
wgRec('flour', 1, { wheat: 2 }, 'bench'); wgRec('bread', 1, { flour: 2 }, 'fire'); wgRec('sugar', 1, { honey: 1 }, 'bench');
wgRec('stew', 1, { cooked_meat: 1, carrot: 1, potato: 1 }, 'fire'); wgRec('pie', 1, { flour: 1, berry: 3, sugar: 1 }, 'fire');
wgRec('carrot_soup', 1, { carrot: 3, glow_berry: 1 }, 'fire'); wgRec('honey_cake', 1, { flour: 1, honey: 1, egg: 1 }, 'fire');
// tools and weapons: wood at the bench, stone with flint binding, then bars at the anvil
const ING = ['wood', 'stone', 'copper', 'iron', 'crystal', 'star_bar'];
TIERS.forEach((t, i) => {
  const m = ING[i], at = i < 2 ? 'bench' : 'anvil', s = i === 0 ? 2 : 2;
  wgRec('pick_' + t.id, 1, { [m]: 3, stick: s }, at); wgRec('axe_' + t.id, 1, { [m]: 3, stick: s }, at);
  wgRec('shovel_' + t.id, 1, { [m]: 1, stick: s }, at); wgRec('hoe_' + t.id, 1, { [m]: 2, stick: s }, at);
  wgRec('sword_' + t.id, 1, { [m]: 2, stick: 1 }, at); wgRec('spear_' + t.id, 1, { [m]: 1, stick: 3 }, at);
  if (i === 5) for (const r of RECIPES.slice(-6)) r.in.crystal = 1;
});
[['leather', 'leather'], ['copper', 'copper'], ['iron', 'iron'], ['crystal', 'crystal'], ['star', 'star_bar']].forEach(([t, m], i) => {
  const at = i === 0 ? 'loom' : 'anvil';
  wgRec('head_' + t, 1, { [m]: 4 + i }, at); wgRec('body_' + t, 1, { [m]: 7 + i * 2 }, at); wgRec('feet_' + t, 1, { [m]: 3 + i }, at);
});
// the dye of seeds and the seed itself is from the plants; potatoes and carrots plant as themselves
wgRec('seed_potato', 1, { potato: 1 }); wgRec('seed_carrot', 1, { carrot: 1 });

// ---------- Biomes ----------
// Vegetation lists: [object id, weight]. Density is per tile before the forest-noise multiplier.
const BIOMES = {
  ocean: { name: 'OCEAN', col: 'B' },
  beach: { name: 'BEACH', col: 'a', ground: 'sand', dens: 0.05, veg: [['palm', 2], ['shellrock', 3], ['reeds', 1], ['pebbles', 2]] },
  meadow: { name: 'MEADOW', col: 'G', ground: 'grass', dens: 0.12, veg: [['tallgrass', 14], ['flower_r', 3], ['flower_y', 3], ['flower_b', 2], ['flower_w', 3], ['flower_p', 1], ['oak', 2], ['birch', 1], ['berrybush', 1], ['pebbles', 1], ['wild_wheat', 1], ['boulder', 0.5], ['mush_red', 0.4]] },
  forest: { name: 'FOREST', col: 'g', ground: 'grass', dens: 0.34, veg: [['oak', 12], ['birch', 6], ['tallgrass', 8], ['fern', 5], ['mush_brown', 1.5], ['mush_red', 1], ['berrybush', 1.2], ['flower_y', 0.8], ['boulder', 0.7], ['wild_carrot', 0.6], ['pebbles', 0.8]] },
  jungle: { name: 'JUNGLE', col: 'z', ground: 'jungle', dens: 0.3, veg: [['jungle', 9], ['fern', 9], ['tallgrass', 6], ['flower_r', 1.5], ['flower_p', 1.5], ['glowcap', 0.4], ['berrybush', 1], ['wild_pumpkin', 0.5], ['cobweb', 0.3]] },
  desert: { name: 'DESERT', col: 'A', ground: 'sand', dens: 0.07, veg: [['cactus', 5], ['deadbush', 5], ['sandpile', 3], ['bones', 0.5], ['pebbles', 1.5], ['boulder', 0.5], ['dead', 0.6]] },
  snow: { name: 'SNOWFIELD', col: 'L', ground: 'snow', dens: 0.14, veg: [['snowpine', 8], ['pine', 3], ['iceblock', 2], ['pebbles', 1], ['boulder', 0.7], ['tallgrass', 1]] },
  swamp: { name: 'SWAMP', col: 't', ground: 'mud', dens: 0.26, veg: [['willow', 5], ['reeds', 8], ['lilypad', 0], ['mush_red', 2], ['mush_brown', 2], ['fern', 3], ['cobweb', 0.6], ['dead', 1.5], ['clayrock', 1.2]] },
  mountain: { name: 'MOUNTAINS', col: 'm', ground: 'rock', dens: 0.20, veg: [['boulder', 8], ['pine', 3], ['ore_coal', 1.4], ['ore_copper', 1], ['ore_iron', 0.5], ['pebbles', 2], ['tallgrass', 1], ['ore_crystal', 0.15]] },
  highland: { name: 'HIGHLAND', col: 'l', ground: 'rock', dens: 0.18, veg: [['boulder', 8], ['iceblock', 2], ['ore_iron', 1], ['ore_crystal', 0.5], ['ore_star', 0.08], ['pebbles', 2]] },
  volcano: { name: 'VOLCANO', col: 'o', ground: 'ash', dens: 0.18, veg: [['obsidian', 4], ['boulder', 2], ['ore_coal', 3], ['ore_iron', 1.2], ['geyser', 0.5], ['deadbush', 1], ['bones', 0.5]] },
};
const BIOME_ORDER = ['ocean', 'beach', 'meadow', 'forest', 'jungle', 'desert', 'snow', 'swamp', 'mountain', 'highland', 'volcano'];

// ---------- Crop growth ----------
// seconds per stage at normal weather; watered soil doubles the pace
const CROP = { wheat: 60, carrot: 70, potato: 80, pumpkin: 110, berrybush: 120 };

// item and recipe checks used by the tests: every item must be obtainable
function wgItemOf(id) { return WGI[id]; }

// ore veins inside the caves' rock (appended: ids are saved)
for (const [id, name, tier, ore, ramp] of [['u_coal', 'COAL SEAM', 0, 'coal', ['x', 'X', 'd', 'm']], ['u_copper', 'COPPER SEAM', 1, 'copper_ore', ['n', 'N', 'O', 'Y']],
  ['u_iron', 'IRON SEAM', 2, 'iron_ore', ['d', 'm', 'R', 'l']], ['u_crystal', 'CRYSTAL SEAM', 3, 'crystal', ['b', 'B', 'c', 'C']], ['u_star', 'STAR SEAM', 4, 'star_ore', ['o', 'y', 'Y', 'w']]])
  wgObj(id, { name, kind: 'wall', tool: 'pick', hp: 14 + tier * 8, tier, ore: ramp, natural: 1, ramp: ['X', 'd', 'm', 'l'], drops: [DR(ore, 2, 3), DR('stone', 0, 1, 0.4)], light: tier >= 3 ? 48 : 0 });

// ---------- later additions (append only: ids are saved in worlds) ----------
wgObj('wild_potato', { name: 'WILD POTATOES', kind: 'plant', hp: 1, solid: 0, drops: [DR('potato', 1, 2), DR('seed_potato', 0, 1, 0.4)] });
BIOMES.forest.veg.push(['wild_potato', 0.5]); BIOMES.swamp.veg.push(['wild_potato', 0.6]);
wgObj('cliff_hi', { name: 'ROCK', kind: 'wall', tool: 'pick', hp: 12, ramp: ['x', 'X', 'm', 'l'], natural: 1, drops: [DR('stone', 1, 2)] }); // surface ridges: darker face than the floor
// coal gives the odd glowing ember, trees give saplings as items
for (const o of OBJ) { if (!o) continue;
  if (o.id === 'ore_coal' || o.id === 'u_coal') o.drops.push(DR('ember', 0, 1, 0.25));
  if (o.kind === 'tree' && o.sap) o.drops.push(DR(o.sap, 0, 1, 0.3));
}
