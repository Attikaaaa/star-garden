import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'SE' }, seed: { v: '12' }, look: { skin: 1, hair: 4, shirt: 3 }, peace: true })`); await sleep(800);
for (const d of [0, 8, 16, 24]) {
  await g.ev(`WGS.scr='play'; WGS.clock = 0.4; WGS.day = ${d}; WGS.hint = null; 0`); await sleep(900);
  console.log(await g.ev(`WG_SEASONS[wgSeason()]`), await g.shot('wg_season_' + d + '.png'));
}
console.log(JSON.stringify(g.realErrors()).slice(0, 300)); process.exit(0);
