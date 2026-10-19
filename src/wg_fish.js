'use strict';
// Wildgrove: the fishing pack. What bites depends on the water: salmon in fresh water, tropical fish by the sea and
// in the jungle, icefin in the cold, glowfish at night and underground, now and then a golden carp; the sea may give
// up a shell or a pearl. Each new fish has its own dish at the fire, the carp a trophy. Ids are appended.
const WG_FISH = ['fish', 'fish_salmon', 'fish_tropic', 'fish_ice', 'fish_glow', 'fish_gold'];
(function () {
  for (const [id, name, food, o] of [['fish_salmon', 'SALMON', 3, { bad: 1 }], ['fish_tropic', 'TROPICAL FISH', 2, { bad: 1 }], ['fish_ice', 'ICEFIN', 2, { bad: 1 }],
    ['fish_glow', 'GLOWFISH', 3, { buff: 'night' }]]) wgItem(id, name, 'food', Object.assign({ food }, o));
  wgItem('fish_gold', 'GOLDEN CARP', 'res', {});
  wgItem('grilled_salmon', 'GRILLED SALMON', 'food', { food: 11 }); wgRec('grilled_salmon', 1, { fish_salmon: 1 }, 'fire');
  wgItem('fish_skewer', 'FISH SKEWER', 'food', { food: 9, buff: 'speed' }); wgRec('fish_skewer', 1, { fish_tropic: 2, stick: 1 }, 'fire');
  wgItem('fish_chowder', 'FISH CHOWDER', 'food', { food: 15, buff: 'regen' }); wgRec('fish_chowder', 1, { fish_ice: 1, potato: 1, carrot: 1 }, 'fire');
  wgObj('fish_trophy', { name: 'FISH TROPHY', kind: 'deco', tool: 'axe', hp: 4, drops: [DR('fish_trophy', 1, 1)] });
  wgItem('fish_trophy', 'FISH TROPHY', 'place', { place: 'fish_trophy' }); PLACE.fish_trophy = 'fish_trophy';
  wgRec('fish_trophy', 1, { fish_gold: 1, wood: 4, copper: 1 }, 'bench');
  // any fish counts for the first fish; five kinds make an angler
  const a = WG_ACH.find(x => x[0] === 'fish'); if (a) a[3] = (c) => WG_FISH.some(f => c.seen[f]);
  WG_ACH.push(['angler', 'ANGLER', 'CATCH FIVE KINDS OF FISH', (c) => WG_FISH.filter(f => c.seen[f]).length >= 5]);
})();

// What bites at this water: the dimension, the night, the biome around the bobber.
function wgCatch(F) {
  const r = Math.random();
  if (r < 0.04) return 'fish_gold';
  if (WGS.dim !== 'o') return r < 0.55 ? 'fish_glow' : 'fish';
  const b = wgSurface(WGS.world.seed, F.tx, F.ty).b, sea = b === 'ocean' || b === 'beach';
  if (wgNight(WGS.clock) > 0.5 && r < 0.3) return 'fish_glow';
  if (sea && r < 0.07) return 'pearl';
  if (sea && r < 0.12) return 'shell';
  if ((sea || b === 'jungle') && r < 0.55) return 'fish_tropic';
  if ((b === 'snow' || b === 'mountain') && r < 0.55) return 'fish_ice';
  if (!sea && r < 0.45) return 'fish_salmon';
  return 'fish';
}

// ---------- art ----------
const WG_FISH_ART = ['fish_salmon', 'fish_tropic', 'fish_ice', 'fish_glow', 'fish_gold', 'grilled_salmon', 'fish_skewer', 'fish_chowder'];
const _wgIconFish = wgIcon;
wgIcon = function (id) {
  const key = 'ic_' + id;
  if (WGA.cache[key] || !WG_FISH_ART.includes(id)) return _wgIconFish(id);
  const [c, g] = wgCv(16, 16);
  const fish = (ramp, fin, eye) => { // the raw fish's cut: a body, a forked tail, an eye at the front
    wgBlob(g, 7.6, 8, 5.4, 3.4, ramp); wgLine(g, 13, 8, 15, 5, fin); wgLine(g, 13, 8, 15, 11, fin); wgPx(g, 14, 6, fin); wgPx(g, 14, 10, fin);
    wgRc(g, 6, 4, 3, 1, fin); wgPx(g, 4, 7, eye || '0'); wgPx(g, 3, 6, 'w');
  };
  if (id === 'fish_salmon') { fish(['p', 'P', 'q', 'w'], 'p'); wgRc(g, 6, 9, 5, 1, 'O'); wgPx(g, 8, 6, 'p'); wgPx(g, 10, 7, 'p'); }
  else if (id === 'fish_tropic') { fish(['n', 'o', 'O', 'y'], 'n'); wgRc(g, 6, 5, 1, 7, 'w'); wgRc(g, 10, 5, 1, 7, 'w'); }
  else if (id === 'fish_ice') { fish(['c', 'C', 'L', 'w'], 'B'); wgRc(g, 5, 9, 6, 1, 'B'); wgPx(g, 8, 6, 'w'); }
  else if (id === 'fish_glow') { fish(['1', '2', '3', '4'], '2', 'Y'); for (const [x, y] of [[7, 7], [9, 9], [11, 7], [6, 10]]) wgPx(g, x, y, 'Y'); wgPx(g, 4, 3, 'y'); wgPx(g, 3, 2, 'Y'); wgPx(g, 5, 4, '2'); }
  else if (id === 'fish_gold') { fish(['O', 'y', 'Y', 'w'], 'O'); wgPx(g, 9, 6, 'w'); wgPx(g, 11, 8, 'w'); wgPx(g, 7, 10, 'O'); }
  else if (id === 'grilled_salmon') { // a fillet with grill marks on a white plate
    wgBlob(g, 8, 10.5, 7, 3.2, ['m', 'l', 'L', 'w']); wgBlob(g, 8, 8.6, 4.6, 2.6, ['p', 'P', 'q', 'w']);
    for (const x of [5, 8, 11]) { wgPx(g, x, 9, 'n'); wgPx(g, x + 1, 8, 'n'); } wgRc(g, 11, 6, 2, 1, 'G'); wgPx(g, 12, 5, 'h');
  } else if (id === 'fish_skewer') { // three orange chunks on a stick
    wgLine(g, 2, 14, 14, 2, 'n'); wgPx(g, 1, 15, 'n');
    for (const [x, y] of [[5, 11], [8, 8], [11, 5]]) wgBlob(g, x, y, 2.2, 2.2, ['n', 'o', 'O', 'y']);
  } else { // the stew's bowl, a creamy soup with fish and carrot
    wgRc(g, 2, 8, 12, 5, 'x'); wgRc(g, 3, 13, 10, 1, 'x'); wgRc(g, 2, 8, 12, 1, 'X');
    wgBlob(g, 8, 8, 5.4, 1.8, ['m', 'l', 'L', 'w']); wgRc(g, 5, 7, 2, 1, 'o'); wgRc(g, 9, 8, 2, 1, 'P'); wgPx(g, 9, 4, 'w'); wgPx(g, 10, 2, 'l');
  }
  wgOutline(c); WGA.cache[key] = c; return c;
};
const _wgBuildFish = wgBuildAll;
wgBuildAll = function () {
  _wgBuildFish();
  // the golden carp on a wooden board, on a little stand
  wgReg('fish_trophy', [wgMake('fish_trophy', 16, 22, (g) => {
    wgRc(g, 7, 15, 2, 5, 'n'); wgRc(g, 7, 15, 1, 5, 'N'); wgRc(g, 4, 19, 8, 3, 'n'); wgRc(g, 4, 19, 8, 1, 'O');
    wgRc(g, 1, 2, 14, 13, 'n'); wgRc(g, 1, 2, 14, 1, 'O'); wgRc(g, 1, 2, 1, 13, 'N'); wgRc(g, 2, 14, 13, 1, 'u'); wgRc(g, 14, 3, 1, 11, 'u');
    wgBlob(g, 7, 8.5, 4.2, 2.6, ['O', 'y', 'Y', 'w']); wgLine(g, 11, 8, 13, 6, 'O'); wgLine(g, 11, 9, 13, 11, 'O'); wgPx(g, 4, 8, '0'); wgPx(g, 8, 7, 'w');
  })]);
};
