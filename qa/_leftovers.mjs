import { open, waitFor, sleep } from './lib.mjs';
for (const l of ['cloud','toy']) for (const t of ['normal','boss']) {
  const g = await open();
  await waitFor(g.ev, 'typeof G === "object" && G.state === "title"', 15000);
  await g.ev(`(() => { Save.settings.sfx = 0; Save.settings.music = 0; Save.stats.runs = 5; startRun('adv', null, {}); G.run.path = ['${l}'].concat(roadPath().filter(i => i !== '${l}')); loadFloor(0); MODALS.length = 0;
    const r = G.floor.rooms.find(r => r.type === '${t}'); enterRoom(r, Object.keys(r.doors)[0]); })()`);
  await sleep(4500);
  console.log(await g.shot(`lo_${l}_${t}.png`)); g.close();
}
process.exit(0);
