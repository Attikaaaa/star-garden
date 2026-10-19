'use strict';
// Wildgrove: messages in bottles. Now and then a bottle washes up on the sand at the water's edge, a new few each day;
// where they lie comes from the tile, the world's seed and the day alone (`wgBottleAt`), so every screen has the same,
// but the finding is each hero's own: USE one to pull the cork and read the note inside (the `note` screen), from
// someone far away (`WG_NOTES`), with a little gift from `WG_GIFTS` tucked in and the glass to keep. The day's finds are
// kept in `w.meta.bottles`. A ship in a bottle to set out, and the MESSAGE IN A BOTTLE star after five.
const WG_NOTES = [ // two lines and who wrote them
  ['I AM ON AN ISLAND OF GULLS.', 'THEY TOOK MY SANDWICH. AGAIN.', 'A SAILOR'],
  ['IF YOU FIND THIS, MAKE A WISH.', 'I MADE MINE WHEN I LET IT GO.', 'SOMEONE HOPEFUL'],
  ['TODAY THE SEA WAS LIKE GLASS.', 'I COULD SEE THE FISH SMILING.', 'A FISHER'],
  ['THIS BOTTLE HAS COME A LONG WAY.', 'PLEASE SEND IT ON ITS WAY.', 'A TRAVELLER'],
  ['I DREW YOU A MAP TO MY GARDEN.', 'THE RAIN WASHED IT AWAY. SORRY!', 'A GARDENER'],
  ['THE WHALES SANG ALL NIGHT.', 'I HOPE YOU HEARD THEM TOO.', 'A LIGHTHOUSE KEEPER'],
  ['I PLANT A TREE FOR EVERY FRIEND', 'I MAKE. IT IS A FOREST NOW.', 'AN OLD FORESTER'],
  ['HELLO FROM THE OTHER SHORE!', 'THE SUNSETS HERE ARE PINK.', 'A PAINTER'],
];
(function () {
  wgObj('ship_bottle', { name: 'SHIP IN A BOTTLE', kind: 'deco', tool: 'pick', hp: 2, drops: [DR('ship_bottle', 1, 1)] });
  wgItem('ship_bottle', 'SHIP IN A BOTTLE', 'place', { place: 'ship_bottle' }); PLACE.ship_bottle = 'ship_bottle'; wgRec('ship_bottle', 1, { glass: 2, wood: 1, fiber: 1 }, 'bench');
  WG_ACH.push(['notes', 'MESSAGE IN A BOTTLE', 'READ FIVE MESSAGES IN BOTTLES', (c) => (c.st.notes | 0) >= 5]);
})();
function wgBottleAt(tx, ty) { // the bottle on a tile today, or null: its note, which way it lies and its spot in the tile
  const w = WGS.world; if (!w) return null;
  const h = hash(tx, ty, (w.seed | 0) * 41 + (WGS.day | 0) * 173 + 9091);
  if (h % 1000 >= 6) return null;
  if (wgGround(w, 'o', tx, ty) !== G_ID.sand || wgObjAt(w, 'o', tx, ty)) return null;
  let wet = false; // washed up: water beside it
  for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (GROUND[wgGround(w, 'o', tx + i, ty + j)].liq === 'water') { wet = true; break; }
  return wet ? { n: (h >>> 10) % WG_NOTES.length, f: (h >>> 8) & 1, dx: ((h >>> 12) % 5) - 2, dy: ((h >>> 15) % 3) - 1 } : null;
}
const wgBottleKey = (tx, ty) => tx + ',' + ty;
function wgBottleFound(tx, ty) { const B = WGS.world.meta.bottles; return !!(B && B.d === (WGS.day | 0) && B.k.includes(wgBottleKey(tx, ty))); }
function wgBottleOpen(tx, ty) { // pulls the cork on the bottle on a tile if there is one: true when it did
  const w = WGS.world, B0 = wgBottleAt(tx, ty); if (!B0 || wgBottleFound(tx, ty)) return false;
  const m = w.meta; if (!m.bottles || m.bottles.d !== (WGS.day | 0)) m.bottles = { d: WGS.day | 0, k: [] };
  if (m.bottles.k.length < 100) m.bottles.k.push(wgBottleKey(tx, ty));
  const gift = WG_GIFTS[hash(tx, ty, (w.seed | 0) + (WGS.day | 0) * 7 + 3) % WG_GIFTS.length], x = tx * 16 + 8, y = ty * 16 + 12;
  for (const [id, n] of [['glass', 1], gift]) { const left = wgInvAdd(WGS.inv, id, n); if (left) wgDrop(x, y, id, left); }
  const st = m.stats || (m.stats = { kills: 0, far: 0 }); st.notes = Math.min(9999, (st.notes | 0) + 1);
  wgPart(x, y - 3, 6, { c: ['C', 'w', 'G'], s: 16, up: 18, life: 0.6 }); wgSfx('pickup');
  WGS.note = { n: B0.n, gift, t0: WGS.t }; WGS.scr = 'note'; WGS.ui = {};
  return true;
}
const _wgUseBottle = wgUse;
wgUse = function (tx, ty) { return (WGS.world && WGS.dim === 'o' && wgBottleOpen(tx, ty)) || _wgUseBottle(tx, ty); };
// ---------- the note ----------
const _wgUpdBottle = updateWG;
updateWG = function (dt) {
  _wgUpdBottle(dt);
  if (WGS.scr !== 'note' || !WGS.world) return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  if (!WGS.note || WGS.t > WGS.note.t0 && pressed('Escape', 'PadB', wgKey('use'))) { WGS.scr = 'play'; WGS.note = null; } // not on the press that opened it
};
const _wgDrawBottle = drawWG;
drawWG = function () {
  _wgDrawBottle();
  if (WGS.scr === 'note' && WGS.world && WGS.note) wgDrawNote();
};
function wgDrawNote() { // a rolled-out scroll between two wooden rods
  const M = WGS.note, L = WG_NOTES[M.n], x = VW / 2 - 116, y = 22, ui = WGS.ui;
  dim(0.45);
  rect(x, y + 4, 232, 158, '0'); rect(x + 1, y + 5, 230, 156, 'A'); rect(x + 1, y + 5, 230, 1, 'w'); rect(x + 1, y + 160, 230, 1, 'a'); rect(x + 230, y + 5, 1, 156, 'a');
  for (const ry of [y, y + 158]) { rect(x - 6, ry, 244, 8, '0'); rect(x - 5, ry + 1, 242, 6, 'n'); rect(x - 5, ry + 1, 242, 2, 'O'); rect(x - 5, ry + 6, 242, 1, 'N'); } // the rods
  wtext('TO WHOEVER FINDS THIS,', x + 14, y + 20, '1', 0);
  wtext(L[0], x + 14, y + 42, '0', 0); wtext(L[1], x + 14, y + 56, '0', 0);
  wtext(L[2], x + 218, y + 78, '1', 0, 2);
  wtext('ALSO INSIDE:', x + 14, y + 98, '1', 0);
  const [id, n] = M.gift; rect(x + 14, y + 110, 20, 20, 'e'); rect(x + 15, y + 111, 18, 18, 'a'); ctx.drawImage(wgIcon(id), x + 16, y + 112);
  wtext(WGI[id].name, x + 42, y + 117, '0', 0); if (n > 1) wtext('X' + n, x + 48 + textW(WGI[id].name, 0), y + 117, '1', 0);
  wgUiBegin(ui);
  if (wgButton(ui, 'FOLD IT UP', VW / 2 - 52, y + 136, 104)) { WGS.scr = 'play'; WGS.note = null; }
  wgUiEnd(ui);
}
// ---------- drawing: bottles on the sand, a glint now and then; the ship in a bottle ----------
const _wgUpkeepBottle = wgChunkUpkeep;
wgChunkUpkeep = function (w, dim, cx0c, cy0c, cx1c, cy1c) {
  _wgUpkeepBottle(w, dim, cx0c, cy0c, cx1c, cy1c);
  if (dim !== 'o' || w !== WGS.world) return;
  const cam = WGS.cam, cx0 = Math.round(cam.x) - VW / 2, cy0 = Math.round(cam.y) - VH / 2;
  const x0 = Math.floor((cx0 - SCR.ox) / 16) - 1, y0 = Math.floor((cy0 - SCR.oy) / 16) - 1, x1 = x0 + Math.ceil(SCR.w / 16) + 2, y1 = y0 + Math.ceil(SCR.h / 16) + 2;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const B = wgBottleAt(tx, ty); if (!B || wgBottleFound(tx, ty)) continue;
    const c = WGA.cache['bottle_' + B.f]; if (!c) continue;
    const sx = tx * 16 + 8 + B.dx - cx0, sy = ty * 16 + 11 + B.dy - cy0; ctx.drawImage(c, sx - 6, sy - 5);
    if (Math.floor(WGS.t * 1.5 + tx * 3 + ty) % 6 === 0) { rect(sx + (B.f ? 1 : -2), sy - 6, 1, 3, 'w'); rect(sx + (B.f ? 0 : -3), sy - 5, 3, 1, 'w'); } // a glint
  }
};
const _wgBuildBottle = wgBuildAll;
wgBuildAll = function () {
  _wgBuildBottle();
  for (const f of [0, 1]) wgMake('bottle_' + f, 12, 7, (g) => { // green glass lying on its side, a rolled note inside, the cork in
    if (f) { g.translate(12, 0); g.scale(-1, 1); }
    wgRc(g, 1, 2, 6, 3, 'G'); wgRc(g, 1, 2, 6, 1, 'h'); wgRc(g, 1, 4, 6, 1, 'g'); wgRc(g, 7, 3, 2, 1, 'G'); wgPx(g, 7, 2, 'g'); wgPx(g, 7, 4, 'g');
    wgRc(g, 3, 3, 3, 1, 'A'); wgPx(g, 4, 3, 'r'); wgPx(g, 2, 2, 'w'); wgRc(g, 9, 2, 1, 3, 'n'); wgPx(g, 9, 2, 'O');
  });
  wgReg('ship_bottle', [wgMake('ship_bottle', 18, 13, (g) => { // a little sailing ship inside a bottle on a wooden stand
    wgRc(g, 1, 1, 12, 8, 'C'); wgRc(g, 1, 1, 12, 1, 'w'); wgRc(g, 1, 1, 1, 8, 'w'); wgRc(g, 12, 2, 1, 7, 'c'); wgRc(g, 2, 8, 10, 1, 'c');
    wgRc(g, 13, 3, 2, 4, 'C'); wgRc(g, 13, 3, 2, 1, 'w'); wgRc(g, 15, 3, 1, 4, 'n'); wgPx(g, 15, 3, 'O');
    wgRc(g, 3, 7, 8, 1, 'B'); wgRc(g, 4, 6, 6, 1, 'n'); wgRc(g, 5, 7, 4, 1, 'N'); // the sea and the hull
    wgRc(g, 7, 2, 1, 4, 'u'); wgRc(g, 4, 3, 3, 3, 'w'); wgRc(g, 8, 3, 2, 3, 'L'); wgPx(g, 7, 1, 'r'); // the mast, the sails, a flag
    wgRc(g, 2, 9, 12, 2, 'n'); wgRc(g, 2, 9, 12, 1, 'O'); wgRc(g, 3, 11, 1, 1, 'N'); wgRc(g, 12, 11, 1, 1, 'N');
  })]);
};
