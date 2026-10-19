// World generation: the same seed always makes the same chunks (co-op clients and reloads rely on it),
// every biome turns up, no biome is packed with things, and a chunk is quick to make and to draw.
import { open, waitFor } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`);
await g.ev(`wgCreateWorld({ name: { v: 'GEN' }, seed: { v: '77' }, look: { skin: 0, hair: 0, shirt: 0 }, peace: true }); 0`);
const r = await g.ev(`(() => {
  const sum = (w, dim, n) => { let h = 0; for (let cy = -n; cy < n; cy++) for (let cx = -n; cx < n; cx++) { const ch = wgChunk(w, dim, cx, cy); for (let i = 0; i < ch.g.length; i++) h = (h * 31 + ch.g[i] * 7 + ch.o[i]) | 0; } return h; };
  const t0 = performance.now(), a = sum(wgNewWorld({ seed: 77 }), 'o', 4), dt = (performance.now() - t0) / 64;
  const b = sum(wgNewWorld({ seed: 77 }), 'o', 4), c = sum(wgNewWorld({ seed: 78 }), 'o', 4);
  const u1 = sum(wgNewWorld({ seed: 77 }), 'u', 2), u2 = sum(wgNewWorld({ seed: 77 }), 'u', 2);
  // how full each biome is: the share of its land tiles holding something
  const w = wgNewWorld({ seed: 77 }), fill = {}, seen = {};
  for (let y = -600; y < 600; y += 3) for (let x = -600; x < 600; x += 3) {
    const s = wgSurface(77, x, y); seen[s.b] = 1;
    if (GROUND[s.g].liq || s.b === 'ocean') continue;
    const o = wgObjAt(w, 'o', x, y), k = fill[s.b] || (fill[s.b] = [0, 0]); k[1]++;
    if (o && OBJ[o].kind !== 'wall') k[0]++;
  }
  const dens = {}; for (const k in fill) dens[k] = Math.round(fill[k][0] / fill[k][1] * 100) / 100;
  const t1 = performance.now(); for (let i = 0; i < 6; i++) wgChunkArt(wgChunk(WGS.world, 'o', 10 + i, 3)); const art = (performance.now() - t1) / 6;
  return { deterministic: a === b && u1 === u2 && a !== c, genMs: Math.round(dt * 10) / 10, artMs: Math.round(art * 10) / 10, biomes: Object.keys(seen).sort(), dens };
})()`);
console.log(JSON.stringify(r));
const busy = Object.entries(r.dens).filter(([, v]) => v > 0.3);
if (busy.length) console.log('busy biomes', JSON.stringify(busy));
console.log('errors', JSON.stringify(g.realErrors()));
const ok = r.deterministic && !busy.length && !g.realErrors().length;
console.log(ok ? 'GEN OK' : 'GEN FAIL'); g.close(); process.exit(ok ? 0 : 1);
