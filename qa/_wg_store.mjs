// A Wildgrove world survives a save and a reload: dug ground, placed things, a chest's contents, the
// backpack, the hero's place and the time of day; an exported file reads back as the same world.
import { open, waitFor, sleep } from './lib.mjs';
const g = await open({ w: 1152, h: 648 });
await waitFor(g.ev, 'typeof enterWG === "function"', 15000);
await g.ev(`enterWG()`); await sleep(300);
await g.ev(`wgCreateWorld({ name: { v: 'KEEP' }, seed: { v: '4' }, look: { skin: 2, hair: 1, shirt: 5 }, peace: true }); 0`); await sleep(800);
const id = await g.ev(`(() => {
  const w = WGS.world, tx = Math.floor(WGS.p.x / 16) + 3, ty = Math.floor(WGS.p.y / 16);
  wgSetGround(w, 'o', tx, ty, G_ID.tilled); wgSetObj(w, 'o', tx + 1, ty, O_ID.chest);
  wgCont(w, 'o', tx + 1, ty, true).push({ id: 'iron', n: 7 });
  wgSetObj(w, 'o', tx + 40, ty + 40, O_ID.torch); // a second chunk
  wgInvAdd(WGS.inv, 'apple', 5); WGS.p.x += 33; WGS.clock = 0.61; WGS.day = 3;
  window.__want = { tx, ty, x: WGS.p.x, apples: wgInvCount(WGS.inv, 'apple') };
  return w.meta.id;
})()`);
await g.ev(`wgSaveNow()`);
// a fresh state, then the stored record read back
const r = await g.ev(`(async () => {
  WGS.world = null; WGS.inv = []; const rec = await wgStoreGet(${JSON.stringify(id)});
  wgLoadRecord(rec); const w = WGS.world, W = __want;
  const chest = wgCont(w, 'o', W.tx + 1, W.ty) || [];
  const packed = JSON.stringify(rec).length;
  const back = JSON.parse(await wgGunzip(await wgGzip(JSON.stringify({ wildgrove: WG.VER, rec }))));
  return {
    ground: wgGround(w, 'o', W.tx, W.ty) === G_ID.tilled, chest: wgObjAt(w, 'o', W.tx + 1, W.ty) === O_ID.chest && chest.some(s => s.id === 'iron' && s.n === 7),
    torch: wgObjAt(w, 'o', W.tx + 40, W.ty + 40) === O_ID.torch, apples: wgInvCount(WGS.inv, 'apple') === W.apples,
    hero: Math.abs(WGS.p.x - W.x) < 0.01, time: Math.abs(WGS.clock - 0.61) < 0.01 && WGS.day === 3, file: back.rec.meta.id === rec.meta.id && back.rec.saved.length === rec.saved.length, kb: Math.round(packed / 1024)
  };
})()`);
console.log(JSON.stringify(r), JSON.stringify(g.realErrors()).slice(0, 200));
const ok = Object.entries(r).every(([k, v]) => k === 'kb' || v === true) && !g.realErrors().length;
console.log(ok ? 'STORE OK' : 'STORE FAIL'); g.close(); process.exit(ok ? 0 : 1);
