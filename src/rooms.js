'use strict';
// Special rooms. A floor mixes in two of: the Star Shrine (one blessing of three), the
// Moon Altar (a heart for a rare item), a fountain, the gamble frog, a rescue room (a
// caged critter moves to your Garden) and a champion room (one big elite, a free item).
// A Star Key vault waits behind a locked door, and a secret room hides behind cracks.

// ---------- Floor layout (called while a floor is generated, seeded) ----------
const SPECIALS = [['shrine', 3], ['altar', 2], ['fountain', 2], ['gamble', 2], ['rescue', 2], ['champion', 2]];
function addSpecialRooms(list, at, add, depth) {
  const normals = gshuffle(list.filter(r => r.type === 'normal' && r.dist >= 1));
  const kinds = [];
  for (let k = 0; k < 6 && kinds.length < 2; k++) { const t = pickWeighted(SPECIALS); if (!kinds.includes(t)) kinds.push(t); }
  kinds.forEach((t, i) => { if (normals[i]) normals[i].type = t; });
  // a spare dead end becomes the vault; one normal room pays its key
  const ends = list.filter(r => r.type === 'normal' && Object.keys(r.doors).length === 1 && r.dist >= 2);
  if (ends.length && grand() < 0.6) {
    const v = ends[0];
    v.type = 'vault';
    const keys = list.filter(r => r.type === 'normal' && r !== v && r.dist < v.dist);
    if (keys.length) gpick(keys).keyRoom = true; else v.type = 'normal';
  }
  // a secret room: an empty spot next to exactly one room, behind a hidden door
  if (!NET.role && grand() < 0.55) {
    const spots = [];
    for (const r of list) for (const k in DIRS) {
      const x = r.gx + DIRS[k][0], y = r.gy + DIRS[k][1];
      if (x < 0 || y < 0 || x > 8 || y > 8 || at(x, y) || r.type === 'boss' || r.type === 'start') continue;
      let n = 0;
      for (const j in DIRS) if (at(x + DIRS[j][0], y + DIRS[j][1])) n++;
      if (n === 1) spots.push([r, k, x, y]);
    }
    if (spots.length) {
      const [r, k, x, y] = gpick(spots), s = add(x, y);
      s.type = 'secret'; s.dist = r.dist + 1;
      r.doors[k] = s; s.doors[OPP[k]] = r;
      r.hidden = { [k]: true };
    }
  }
}
// Normal-looking fights happen in these rooms too.
const FIGHT_ROOMS = new Set(['normal', 'challenge', 'champion', 'rescue']);

// ---------- Filling a room when it is first entered ----------
function stockSpecial(room) {
  const t = room.type;
  if (t === 'shrine') {
    const ids = gshuffle(Object.keys(BLESSINGS)).slice(0, 3);
    ids.forEach((id, i) => room.props.push({ kind: 'bless', x: 132 + i * 60, y: 132, t: 0, bless: id }));
  } else if (t === 'altar') {
    const id = rareItem();
    if (id) { addPedestal(room, 192, 132, id); room.props[room.props.length - 1].heart = 2; }
  } else if (t === 'fountain') room.props.push({ kind: 'fountain', x: 192, y: 126, t: 0, used: false });
  else if (t === 'gamble') room.props.push({ kind: 'gfrog', x: 192, y: 110, t: 0, plays: 0 });
  else if (t === 'rescue') { const [x, y] = freeSpot(room); room.props.push({ kind: 'cage', x, y, t: 0, open: false, critter: nextCritter() }); }
  else if (t === 'vault') {
    const ids = itemPool(Math.min(3, 1 + G.players.length));
    ids.forEach((id, i) => { addPedestal(room, 192 + (i - (ids.length - 1) / 2) * 48, 132, id); room.props[room.props.length - 1].group = 'vault'; });
    for (let i = 0; i < 6; i++) room.pickups.push({ type: 'coin', x: 150 + i * 16, y: 170, z: 0, vz: 0, vx: 0, vy: 0, t: Math.random() * 3, ok: true });
  } else if (t === 'secret') {
    if (!Save.story.stars.includes('secret') && !G.daily) room.props.push({ kind: 'bigstar', x: 192, y: 124, t: 0 });
    else { room.props.push({ kind: 'chest', x: 192, y: 128, t: 0, open: false }); spawnPickup('scroll', 150, 128); spawnPickup('gem', 234, 128); }
  }
}
// The one item of a Moon Altar: a rare or epic one.
function rareItem() {
  const owned = new Set([].concat(...G.players.map(p => p.items)));
  const pool = Object.keys(ITEMS).filter(k => (ITEMS[k].rare || 0) >= 1 && !(ITEMS[k].unique && owned.has(k)) && (G.daily || Save.unl.items.includes(k)));
  return pool.length ? gpick(pool) : itemPool(1)[0];
}
// Champion rooms: one elite with two affixes and a lot of health.
function spawnChampion(room) {
  const land = G.floor.land, pool = land.pool.filter(([t]) => !EDEF[t].still);
  const type = pickWeighted(pool), e = spawnEnemy(type, 192, 110, { elite: true });
  const two = gshuffle(AFFIX_IDS.filter(a => a !== 'split')).slice(0, 2);
  e.affix = two[0]; e.affix2 = two[1]; e.champion = true;
  e.shieldHp = two.includes('shield') ? 5 : 0; e.blinkT = 3;
  e.hp *= 3; e.maxHp = e.hp;
  G.banner = { title: 'A CHAMPION!', sub: foeName(type) + ': ' + AFFIXES[two[0]].name + ' AND ' + AFFIXES[two[1]].name, t: 2.4, icon: null };
  Audio_.sfx('roar');
}

// ---------- Blessings (Star Shrine) ----------
const BLESSINGS = {
  might: { name: 'MIGHT', desc: '+25% DAMAGE FOR THIS RUN', icon: 'icon_crown', apply: p => { p.dmg *= 1.25; } },
  swift: { name: 'SWIFTNESS', desc: 'RUN AND SHOOT FASTER', icon: 'icon_feather', apply: p => { p.speed *= 1.12; p.fireDelay *= 0.9; } },
  vigor: { name: 'VIGOR', desc: '+1 HEART AND A FULL HEAL', icon: 'icon_heartstone', apply: p => { p.maxHp = Math.min(20, p.maxHp + 2); p.hp = p.maxHp; } },
  fortune: { name: 'FORTUNE', desc: '+1 LUCK: MORE LOOT, CHEAPER SHOP', icon: 'icon_horseshoe', apply: p => { p.luck += 1; } },
  starlit: { name: 'STARLIGHT', desc: 'STARFALL CHARGES 50% FASTER', icon: 'icon_aura', apply: p => { p.chargeMul *= 1.5; } },
};

// ---------- Critters (rescued ones live in the Garden) ----------
const CRITTERS = { chick: 'CHICK', hedgehog: 'HEDGEHOG', duck: 'DUCKLING' };
function nextCritter() { const left = Object.keys(CRITTERS).filter(c => !Save.critters.includes(c)); return left.length ? gpick(left) : gpick(Object.keys(CRITTERS)); }

// ---------- Talking to the special props ----------
const ROOM_PROPS = new Set(['bless', 'fountain', 'gfrog', 'cage', 'bigstar']);
// Returns true when the prop was one of ours.
function roomInteract(o, p) {
  const room = G.room;
  if (o.kind === 'bless') {
    const B = BLESSINGS[o.bless];
    for (const q of G.players) if (!q.dead) { B.apply(q); if (q !== p) say(q, B.name); }
    say(p, B.name + '!');
    burst(o.x, o.y - 20, 24, ['Y', 'w', 'c'], 120, 0.8, { g: -40 });
    Audio_.sfx('ult');
    G.banner = { title: 'BLESSING: ' + B.name, sub: B.desc, t: 2.4, icon: null };
    for (let i = room.props.length - 1; i >= 0; i--) if (room.props[i].kind === 'bless') { poof(room.props[i].x, room.props[i].y - 12); room.props.splice(i, 1); }
    G.propsN++;
    return true;
  }
  if (o.kind === 'fountain') {
    if (o.used) { say(p, 'THE FOUNTAIN IS DRY'); Audio_.sfx('deny'); return true; }
    o.used = true;
    for (const q of G.players) if (alive(q)) { q.hp = q.maxHp; burst(q.x, q.y - 10, 12, ['C', 'c', 'w'], 80, 0.6, { g: -30 }); }
    Audio_.sfx('heart'); say(p, 'ALL HEALED!');
    G.propsN++;
    return true;
  }
  if (o.kind === 'gfrog') {
    if (o.plays >= 3) { o.say = { msg: 'NO MORE GAMES TODAY!', until: o.t + 1.3 }; Audio_.sfx('deny'); return true; }
    if (G.coins < 8) { o.say = { msg: 'IT COSTS 8 COINS!', until: o.t + 1.3 }; Audio_.sfx('deny'); return true; }
    G.coins -= 8; o.plays++;
    noteFor(p, 'buy', 'gamble', 8);
    const r = grand();
    let msg;
    if (r < 0.4) msg = 'BAD LUCK! RIBBIT!';
    else if (r < 0.7) { for (let i = 0; i < 15; i++) spawnPickup('coin', o.x, o.y + 8); msg = 'COINS! RIBBIT!'; }
    else if (r < 0.85) { spawnPotion(o.x, o.y + 8); msg = 'A POTION!'; }
    else if (r < 0.95) { addPedestal(room, o.x, o.y + 40, itemPool(1)[0] || 'heart'); msg = 'A MAGIC ITEM!'; }
    else { for (let i = 0; i < 40; i++) spawnPickup('coin', o.x, o.y + 8); msg = 'JACKPOT!!!'; G.shake = 4; }
    o.say = { msg, until: o.t + 1.6, happy: r >= 0.4 };
    Audio_.sfx(r < 0.4 ? 'deny' : 'coin');
    G.propsN++;
    return true;
  }
  if (o.kind === 'cage') {
    if (!room.cleared) { say(p, 'DEFEAT THE GUARDS FIRST'); Audio_.sfx('deny'); return true; }
    if (o.open) return true;
    o.open = true;
    noteTeam('rescue', o.critter);
    burst(o.x, o.y - 10, 20, ['Y', 'w', 'q'], 110, 0.7, { g: -30 });
    Audio_.sfx('clear');
    G.propsN++;
    return true;
  }
  if (o.kind === 'bigstar') {
    noteTeam('bigstar', 'secret');
    burst(o.x, o.y - 16, 40, ['Y', 'y', 'w'], 160, 1, { g: -40 });
    G.flashT = 0.1; Audio_.sfx('ult');
    room.props.splice(room.props.indexOf(o), 1);
    G.propsN++;
    return true;
  }
  return false;
}
// A rescued critter moves to the Garden (on every hero's own device).
onNote((ev, a) => {
  if (ev !== 'rescue' || !CRITTERS[a]) return;
  const first = !Save.critters.includes(a);
  if (first) Save.critters.push(a);
  toast(first ? 'THE ' + CRITTERS[a] + ' MOVES INTO YOUR GARDEN!' : 'THE ' + CRITTERS[a] + ' SAYS THANK YOU!');
  if (first) logNews('beast', 'RESCUED: ' + CRITTERS[a], 'crit_' + a + '_0');
  Save.write();
});
function drawRoomProp(o, ox, oy) {
  const x = ox + o.x, y = oy + o.y;
  if (o.kind === 'bless') {
    const B = BLESSINGS[o.bless], bob = Math.round(Math.sin(o.t * 3 + o.x) * 1.5);
    shadow(x, y, 16);
    drawS(S('shrine'), x - 8, y - 16);
    const s = S(B.icon);
    drawS(s, x - (s.w >> 1), y - 36 - s.h / 2 + bob);
    if (Math.hypot(G.player.x - o.x, G.player.y - o.y) < 40) text(B.name, x, y + 4, 'Y', 2, 1);
    return true;
  }
  if (o.kind === 'fountain') {
    shadow(x, y + 2, 30);
    drawS(S('fountain_' + (Math.floor(o.t * 4) % 2)), x - 16, y - 12);
    if (!o.used && Math.floor(o.t * 3) % 3 === 0) drawS(S('sparkle_0'), x + 8, y - 16);
    return true;
  }
  if (o.kind === 'gfrog') {
    // the frog's cousin, with a die
    const saying = o.say && o.t < o.say.until;
    drawProp({ kind: 'frog', x: o.x, y: o.y, t: o.t, say: saying ? o.say : { msg: o.plays >= 3 ? 'THAT WAS FUN!' : 'A GAME? 8 COINS!', until: o.t + 1 } }, ox, oy);
    drawS(S('icon_dice'), x + 10, y - 20);
    return true;
  }
  if (o.kind === 'cage') {
    shadow(x, y, 16);
    drawS(S('cage_back'), x - 8, y - 14);
    if (!o.open) {
      const c = S('crit_' + o.critter + '_' + (Math.floor(o.t * 2) % 2));
      drawFeet(c, x, y - 3);
      drawS(S('cage_bars'), x - 8, y - 14);
    } else if (o.t < 99) {
      const c = S('crit_' + o.critter + '_' + (Math.floor(o.t * 6) % 2));
      drawFeet(c, x + Math.sin(o.t * 2) * 20, y + 4);
    }
    return true;
  }
  if (o.kind === 'bigstar') {
    const bob = Math.round(Math.sin(o.t * 2) * 2);
    shadow(x, y, 14);
    drawGlow(S('bigstar'), x - 8, y - 30 + bob, false);
    drawS(S('bigstar'), x - 8, y - 30 + bob);
    if (Math.floor(o.t * 4) % 2) drawS(S('sparkle_1'), x + 8, y - 30 + bob);
    return true;
  }
  return false;
}

// ---------- Locked vaults and secret doors ----------
// Is the way through this door open? (the vault wants the star key)
function doorOpenFor(to) {
  if (to.type !== 'vault' || G.run.key || to.visited) return true;
  if (!G.lockMsgT || G.time > G.lockMsgT) { toast('LOCKED! FIND THE STAR KEY'); Audio_.sfx('deny'); G.lockMsgT = G.time + 1.5; }
  return false;
}
const hiddenDoor = (room, d) => !!(room.hidden && room.hidden[d]);
// A shot hit a wall tile: if it was the cracked spot, the secret door opens.
function shotWall(room, c, r) {
  if (!room.hidden) return;
  for (const d in room.hidden) {
    if (!DOOR_CELLS[d].some(([x, y]) => x === c && y === r)) continue;
    delete room.hidden[d];
    if (!Object.keys(room.hidden).length) room.hidden = null;
    for (const [x, y] of DOOR_CELLS[d]) room.tiles[y * COLS + x] = T_DOOR;
    room.dirty = true; flowKey = -1;
    room.doors[d].seen = true;
    const [px, py] = ENTRY[d];
    burst(px, py - 6, 30, ['l', 'm', 'w'], 120, 0.6, { g: 150 });
    G.shake = 5; Audio_.sfx('brk'); Audio_.sfx('clear');
    toast('A SECRET ROOM!');
    return;
  }
}
function drawCracks(room, ox, oy) {
  if (!room.hidden) return;
  for (const d in room.hidden) {
    const [x, y] = d === 'u' ? [188, OY + 18] : d === 'd' ? [188, OY + 196] : d === 'l' ? [4, OY + 104] : [372, OY + 104];
    drawS(S('crack'), ox + x, oy + y);
  }
}
