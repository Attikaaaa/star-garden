import { open, waitFor, sleep } from './lib.mjs';
const g = await open();
await waitFor(g.ev, 'typeof G === "object" && G.state === "title"', 15000);
await sleep(1500); console.log(await g.shot('sgm_title.png'));
await g.ev(`(() => { Save.settings.sfx = 0; Save.settings.music = 0; Save.stats.runs = 8; Save.flags.menus = true; Save.vault = 500; enterYard(); })()`);
await sleep(2500); console.log(await g.shot('sgm_yard.png'));
await g.ev(`(() => { startRun('adv', null, {}); MODALS.length = 0; })()`); await sleep(2500); await g.press('Escape'); await sleep(800);
console.log(await g.shot('sgm_pause.png'), JSON.stringify(g.realErrors())); process.exit(0);
