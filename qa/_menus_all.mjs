import { open, waitFor, sleep } from './lib.mjs';
import fs from 'node:fs';
const g = await open();
await waitFor(g.ev, 'typeof G === "object" && G.state === "title"', 15000);
await g.ev(`(() => { Save.settings.sfx = 0; Save.settings.music = 0; Save.stats.runs = 12; Save.flags.menus = true; Save.vault = 900; })()`);
const states = ['title','settings','coop','lobby','daily','prep','wardrobe','stars','quests','mail','keys','book','kert','garden'];
for (const s of states) {
  const err = await g.ev(`(() => { try { if ('${s}' === 'lobby') { netHost(); return 'ok'; } setState('${s}'); return 'ok'; } catch (e) { return 'ERR ' + e.message; } })()`);
  await sleep(900);
  console.log(s, err, await g.shot('menu_' + s + '.png'));
}
console.log(JSON.stringify(g.realErrors()).slice(0, 400)); process.exit(0);
