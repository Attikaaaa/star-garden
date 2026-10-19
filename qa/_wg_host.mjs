// A co-op host's menus do not stop the world for the friends in it: time and mobs go on behind the
// backpack, the pause menu and the map. Alone, a menu still stops everything. A stack held when the hero
// dies goes back into the pack first.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'HOST' }, seed: { v: '9' }, look: { skin: 1, hair: 2, shirt: 1 } }); 0`); await sleep(800);
const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
// a slime a few tiles off, the clock read before and after a moment in a menu
const probe = (scr) => g.ev(`(async () => {
  WGS.world.meta.hintDone = 1; WGS.mobs = []; const m = wgSpawnMob('slime', WGS.p.x + 70, WGS.p.y); m.hp = 999;
  WGS.scr = '${scr}'; WGS.ui = {}; const c0 = WGS.clock, x0 = m.x, y0 = m.y;
  await new Promise(r => setTimeout(r, 1500));
  const moved = Math.hypot(m.x - x0, m.y - y0); WGS.scr = 'play'; return [WGS.clock - c0, moved];
})()`);
let r = await probe('inv');
ok(r[0] === 0 && r[1] < 0.5, 'alone, the backpack stops the world: ' + JSON.stringify(r));
await g.ev(`WGN.role = 'host'; WGN.peers = [{ pid: 1, name: 'PIP', x: WGS.p.x + 200, y: WGS.p.y, dim: 'o', send() {} }]; 0`);
for (const scr of ['inv', 'pause', 'map']) {
  r = await probe(scr);
  ok(r[0] > 0 && r[1] > 4, 'a host with a friend: the world goes on behind ' + scr + ': ' + JSON.stringify(r));
}
// hurt to death with a stack in hand: the stack is not lost
r = await g.ev(`(() => { WGS.scr = 'inv'; WGS.world.meta.rules = Object.assign({}, WGS.world.meta.rules, { keepInv: true }); WGS.cur = { id: 'wood', n: 17 }; const before = wgInvCount(WGS.inv, 'wood'); WGS.p.inv = 0; WGS.p.hp = 1; wgHurtPlayer(5, WGS.p.x + 10, WGS.p.y); return [WGS.scr, !!WGS.cur, wgInvCount(WGS.inv, 'wood') - before]; })()`);
ok(r[0] === 'dead' && !r[1] && r[2] === 17, 'dying in a menu puts the held stack back: ' + JSON.stringify(r));
await g.ev(`WGN.role = null; WGN.peers = []; 0`);
console.log(out.join('\n'));
console.log('errors', JSON.stringify(g.realErrors()).slice(0, 300));
const pass = out.every(l => l.startsWith('ok')) && !g.realErrors().length;
console.log(pass ? 'HOST OK' : 'HOST FAIL'); g.close(); process.exit(pass ? 0 : 1);
