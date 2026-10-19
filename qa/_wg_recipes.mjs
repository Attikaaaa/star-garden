// Every Wildgrove item can be had: dropped by something, crafted, traded, fished, caught in a net or found in a chest.
// Every recipe uses real items and a real station, and no recipe makes more than a stack.
import { open, waitFor } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
const r = await g.ev(`(() => {
  const got = new Set(['bucket_water', 'snowball', 'milk'].concat(typeof WG_FISH !== 'undefined' ? WG_FISH : ['fish'], typeof WG_BFLY !== 'undefined' ? WG_BFLY.map(b => 'bfly_' + b[0]).concat('firefly') : [], typeof WGPL !== 'undefined' ? ['dragonfly'] : [], typeof WG_MALLOW !== 'undefined' ? ['toasted_mallow', 'burnt_mallow'] : [], typeof wgEggAt !== 'undefined' ? ['painted_egg'] : [])), bad = []; // a bucket dipped in water; a snowball scooped from snow; every fish (wgCatch); the bugs (wgSwingNet) and dragonflies (wg_pondlife's net); painted eggs found in spring (wgEggTake)
  for (const o of OBJ) if (o) { for (const d of o.drops || []) got.add(d[0]); if (o.ripe) got.add(o.ripe); }
  for (const k in WG_MOBS) for (const d of WG_MOBS[k].drops || []) got.add(d[0]);
  for (const t of WG_TRADES) got.add(t[2]);
  for (let h = 0; h < 3000; h++) { for (const s of wgLoot(h)) got.add(s.id); for (const s of wgSkyLoot(h)) got.add(s.id); }
  const stations = new Set(['hand', 'fire']); for (const k in PLACE) stations.add(PLACE[k]);
  for (const rc of RECIPES) {
    got.add(rc.out);
    if (!WGI[rc.out]) bad.push('recipe makes no item: ' + rc.out);
    for (const k in rc.in) if (!WGI[k]) bad.push('recipe ' + rc.out + ' needs no item: ' + k);
    if (!stations.has(rc.at) && !O_ID[rc.at]) bad.push('recipe ' + rc.out + ' at no station: ' + rc.at);
    if (WGI[rc.out] && rc.n > WGI[rc.out].stack) bad.push('recipe ' + rc.out + ' makes more than a stack');
  }
  for (const k in PLACE) if (!O_ID[PLACE[k]]) bad.push('placed item ' + k + ' has no object');
  const none = Object.keys(WGI).filter(k => !got.has(k));
  return { items: Object.keys(WGI).length, recipes: RECIPES.length, none, bad };
})()`);
console.log(JSON.stringify(r));
const ok = !r.bad.length && !r.none.length && !g.realErrors().length;
console.log(ok ? 'RECIPES OK' : 'RECIPES FAIL'); g.close(); process.exit(ok ? 0 : 1);
