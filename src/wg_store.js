'use strict';
// Wildgrove: worlds live in IndexedDB (one record per world: its meta plus every chunk the player changed).
// Export / import move a world as a gzip file, so it can be backed up or handed to a friend.
const WGDB = { db: null };
function wgOpenDB() {
  if (WGDB.db) return Promise.resolve(WGDB.db);
  return new Promise((ok, no) => {
    const r = indexedDB.open('wildgrove', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('w'); };
    r.onsuccess = () => { WGDB.db = r.result; ok(r.result); };
    r.onerror = () => no(r.error);
  });
}
function wgTx(mode, fn) {
  return wgOpenDB().then(db => new Promise((ok, no) => { const t = db.transaction('w', mode), st = t.objectStore('w'), q = fn(st); t.oncomplete = () => ok(q && q.result); t.onerror = () => no(t.error); }));
}
const wgStoreAll = () => wgTx('readonly', st => st.getAll());
const wgStoreGet = (id) => wgTx('readonly', st => st.get(id));
const wgStorePut = (rec) => wgTx('readwrite', st => st.put(rec, rec.meta.id));
const wgStoreDel = (id) => wgTx('readwrite', st => st.delete(id));

// A world record: { meta, saved: [[chunkKey, packed]], st: { player, inv, clock, day, dim, signs, spawn } }
function wgSnapshot() {
  const w = WGS.world, saved = [];
  const keep = new Map(w.saved || []);
  for (const [k, ch] of w.chunks) if (ch.mod) keep.set(k, wgPackChunk(ch));
  for (const [k, v] of keep) saved.push([k, v]);
  w.saved = keep;
  const p = WGS.p;
  w.meta.played = (w.meta.played || 0) + Math.round(WGS.tf || 0); WGS.tf = 0;
  w.meta.last = Date.now(); w.meta.day = WGS.day;
  return { meta: w.meta, saved, st: { p: { x: p.x, y: p.y, hp: p.hp, food: p.food, sat: p.sat, armor: p.armor, spawn: p.spawn, look: p.look, grave: p.grave, pet: p.pet, name: p.name, xp: p.xp, seen: p.seen }, inv: WGS.inv, sel: WGS.sel, clock: WGS.clock, day: WGS.day, dim: WGS.dim, signs: WGS.signs || {}, spawn: w.spawn, mobs: [] } };
}
function wgSaveNow() {
  if (!WGS.world || WGS.readonly) return Promise.resolve();
  const rec = wgSnapshot();
  return wgStorePut(rec).then(() => { WGS.saved = WGS.t; wgBackup(rec); }).catch(() => wgToast('SAVE FAILED'));
}
function wgLoadRecord(rec) {
  const w = wgNewWorld(rec.meta); w.saved = new Map(rec.saved); w.spawn = rec.st.spawn;
  WGS.world = w; WGS.dim = rec.st.dim || 'o'; WGS.clock = rec.st.clock; WGS.day = rec.st.day || 0; WGS.signs = rec.st.signs || {};
  const p = wgNewPlayer(rec.st.p.x, rec.st.p.y); Object.assign(p, rec.st.p); WGS.p = p;
  WGS.inv = rec.st.inv; WGS.sel = rec.st.sel || 0; WGS.mobs = []; WGS.drops = []; WGS.parts = []; WGS.tf = 0; WGS.t = 0;
  for (const s of WGS.inv) if (s) (p.seen || (p.seen = {}))[s.id] = 1; // older saves: what you carry is known
  WGS.cam.x = p.x; WGS.cam.y = p.y;
}
// ---------- export / import ----------
async function wgGzip(str) { const s = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip')); return new Response(s).arrayBuffer(); }
async function wgGunzip(buf) { const s = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip')); return new Response(s).text(); }
async function wgExport(id) {
  if (WGS.world && WGS.world.meta.id === id) await wgSaveNow();
  const rec = await wgStoreGet(id);
  const buf = await wgGzip(JSON.stringify({ wildgrove: WG.VER, rec }));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: 'application/gzip' }));
  a.download = rec.meta.name.replace(/[^A-Za-z0-9 _-]/g, '').trim().replace(/ +/g, '_') + '.sgworld'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function wgImportFile(file) {
  const j = JSON.parse(await wgGunzip(await file.arrayBuffer()));
  if (!j.wildgrove || !j.rec || !j.rec.meta || !Array.isArray(j.rec.saved)) throw new Error('not a world');
  const rec = j.rec; rec.meta.id = 'w' + Date.now().toString(36) + Math.floor(Math.random() * 1e4); rec.meta.name = (rec.meta.name + ' (IMPORTED)').slice(0, 24);
  await wgStorePut(rec); return rec.meta;
}
function wgPickImport(cb) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = '.sgworld,application/gzip';
  i.onchange = () => { if (i.files[0]) wgImportFile(i.files[0]).then(cb, () => cb(null)); };
  i.click();
}

// ---------- the same world in two tabs would overwrite itself: one lock per world (BroadcastChannel) ----------
const WGL = { ch: null, mine: null, id: null };
function wgLockWorld(id) {
  try { if (!WGL.ch) { WGL.ch = new BroadcastChannel('wildgrove-lock'); WGL.ch.onmessage = (e) => { const m = e.data; if (m.t === 'who' && WGL.mine === m.id) WGL.ch.postMessage({ t: 'busy', id: m.id, from: WGL.id }); if (m.t === 'busy' && m.id === WGL.mine && m.from !== WGL.id) WGL.clash = true; }; WGL.id = Math.random().toString(36).slice(2); } } catch (e) { return Promise.resolve(true); }
  WGL.clash = false; WGL.ch.postMessage({ t: 'who', id });
  return new Promise(ok => setTimeout(() => { if (WGL.clash) ok(false); else { WGL.mine = id; ok(true); } }, 250));
}
const wgUnlockWorld = () => { WGL.mine = null; };
// ---------- three rolling backups: the world as it was a while ago ----------
function wgBackup(rec) {
  return wgStoreGet('bak:' + rec.meta.id).then(b => {
    const list = (b && b.list) || [], now = Date.now();
    if (list.length && now - list[0].at < 20 * 60 * 1000) return;
    list.unshift({ at: now, rec }); list.length = Math.min(list.length, 3);
    return wgTx('readwrite', st => st.put({ meta: { id: 'bak:' + rec.meta.id, name: rec.meta.name + ' (BACKUPS)', hidden: true }, list }, 'bak:' + rec.meta.id));
  }).catch(() => {});
}
function wgRestoreBackup(id, i) {
  return wgStoreGet('bak:' + id).then(b => { if (!b || !b.list[i]) return false; return wgStorePut(b.list[i].rec).then(() => true); });
}
