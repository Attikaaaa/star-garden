import { open, waitFor, sleep, OUT } from './lib.mjs';
const lands = ['meadow','shore','crystal','cloud','lantern','toy','snow','sun','library','forge','deep','moon'];
const t = process.argv[2] || 'normal';
for (const l of lands) {
  const g = await open();
  await waitFor(g.ev, 'typeof G === "object" && G.state === "title"', 15000);
  await g.ev(`(() => { Save.settings.sfx = 0; Save.settings.music = 0; Save.stats.runs = 5; startRun('adv', null, {}); G.run.path = ['${l}'].concat(roadPath().filter(i => i !== '${l}')); loadFloor(0); MODALS.length = 0;
    const r = G.floor.rooms.find(r => r.type === '${t}') || G.floor.rooms[1]; enterRoom(r, Object.keys(r.doors)[0]); })()`);
  await sleep(3500);
  await g.shot(`sheet_${t}_${l}.png`); g.close();
}
console.log(OUT); process.exit(0);
