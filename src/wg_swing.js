'use strict';
// Wildgrove: the garden rest pack, for the seats of wg_rest. A garden swing sways gently while someone sits on it; a
// warm bathtub heals twice as fast as a chair, with steam rising and its rim in front of the bather; a bird bath where
// little birds come down to splash by day. Who sits where is already shared (a seated friend is sent as facing 'S'),
// so every screen sways the same swing. Ids are appended, so old worlds stay valid.
(function () {
  const dec = (id, name, o, rec, at) => {
    wgObj(id, Object.assign({ name, kind: 'deco', tool: 'axe', hp: 4, solid: 0, drops: [DR(id, 1, 1)] }, o));
    wgItem(id, name, 'place', { place: id }); PLACE[id] = id; wgRec(id, 1, rec, at);
  };
  dec('swing', 'GARDEN SWING', { seat: 1, swing: 1 }, { wood: 6, string: 4 }, 'bench');
  dec('bathtub', 'BATHTUB', { seat: 1, bath: 1, tool: 'pick' }, { iron: 3, clay: 2, bucket_water: 1 }, 'anvil');
  dec('birdbath', 'BIRD BATH', { solid: 1, tool: 'pick', bbath: 1 }, { stone: 4, bucket_water: 1 }, 'bench');
  WG_ACH.push(['bath', 'SQUEAKY CLEAN', 'TAKE A WARM BATH', (c) => c.st.bath]);
})();
const wgSwayAt = (tx, ty) => Math.round(Math.sin(WGS.t * 2.4 + (hash(tx, ty, 77) & 63) / 10) * 2); // a swing's sway, the same for the seat and its rider
function wgSeatedAt(tx, ty) { // is anyone sitting on this seat, here or a friend
  const p = WGS.p; if (p && p.sit && p.sit.tx === tx && p.sit.ty === ty && p.sit.dim === WGS.dim) return true;
  for (const q of WGS.remote || []) if (q.face === 'S' && q.dim === WGS.dim && Math.floor(q.x / 16) === tx && Math.floor(q.y / 16) === ty) return true;
  return false;
}
const wgSeatOf = (p) => { const tx = Math.floor(p.x / 16), ty = Math.floor(p.y / 16), o = (p.sit || p.face === 'S') && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)]; return o ? [o, tx, ty] : null; };
const _wgUpdSwing = updateWG;
updateWG = function (dt) {
  _wgUpdSwing(dt);
  const p = WGS.p, S = p && p.sit; if (!S || WGS.scr !== 'play') return;
  const o = OBJ[wgObjAt(WGS.world, WGS.dim, S.tx, S.ty)]; if (!o || !o.bath) return;
  S.t += dt; // a warm bath heals twice as fast as a chair
  const m = WGS.world.meta; (m.stats || (m.stats = { kills: 0, far: 0 })).bath = 1;
};
const _wgTipSwing = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipSwing(s);
  if (s.id === 'bathtub') L.push('HEALS TWICE AS FAST');
  else if (s.id === 'birdbath') L.push('LITTLE BIRDS COME TO SPLASH');
  return L;
};

// ---------- drawing ----------
// The swing's seat and ropes move with its rider; the bather sits in the water behind the tub's front.
const _wgDrawObjSwing = wgDrawObj;
wgDrawObj = function (id, tx, ty, sx, sy) {
  _wgDrawObjSwing(id, tx, ty, sx, sy);
  const o = OBJ[id], t = WGS.t;
  if (o.swing) {
    const dy = wgSeatedAt(tx, ty) ? wgSwayAt(tx, ty) : 0, top = sy - 14, seat = sy + 8 + dy;
    for (const x of [sx + 4, sx + 11]) rect(x, top, 1, seat - top, 'a'); // the ropes
    rect(sx + 3, seat - 1, 10, 1, '0'); rect(sx + 2, seat, 12, 2, '0'); rect(sx + 3, seat + 2, 10, 1, '0'); rect(sx + 3, seat, 10, 1, 'N'); rect(sx + 3, seat + 1, 10, 1, 'n'); // the seat
  } else if (o.bath) {
    for (let i = 0; i < 2; i++) { // steam curling up
      const k = (t * 0.35 + i * 0.5 + (hash(tx, ty, 7) & 15) / 16) % 1;
      ctx.globalAlpha = k < 0.2 ? k * 4 : (1 - k) * 0.9;
      rect(Math.round(sx + 5 + i * 6 + Math.sin(k * 7 + i) * 2), Math.round(sy - 2 - k * 18), 2, 1, 'L'); ctx.globalAlpha = 1;
    }
  } else if (o.bbath && WGS.dim === 'o' && wgNight(WGS.clock) < 0.3) { // a little bird hops on the rim and dips, now and then
    const k = (t * 0.12 + (hash(tx, ty, 9) & 255) / 256) % 1; if (k > 0.55) return;
    const dip = Math.floor(t * 3) % 4 === 0, left = k < 0.27, bx = sx + (left ? 2 : 13), by = sy + 1 + (dip ? 1 : 0);
    ctx.drawImage(wgBirdSpr(hash(tx, ty, 11) % 3, !left), bx - 4, by - 7);
    if (dip && Math.floor(t * 6) % 2) { rect(bx + (left ? 3 : -3), by - 3, 1, 1, 'C'); rect(bx + (left ? 5 : -5), by - 4, 1, 1, 'w'); }
  }
};
const _wgDrawPlayerSwing = wgDrawPlayer;
wgDrawPlayer = function (e, cx0, cy0) {
  const p = e.p, seat = !p.hidden && wgSeatOf(p);
  if (!seat || (!seat[0].swing && !seat[0].bath)) return _wgDrawPlayerSwing(e, cx0, cy0);
  const [o, tx, ty] = seat, sx = tx * 16 - cx0, sy = ty * 16 - cy0;
  if (o.swing) { const dy = wgSwayAt(tx, ty); ctx.save(); ctx.translate(0, dy); _wgDrawPlayerSwing(e, cx0, cy0); ctx.restore(); return; }
  _wgDrawPlayerSwing(e, cx0, cy0);
  const sp = WGA.obj[o.id][0], c = sp.c, cut = 5; // the tub's front, over the bather from the water line down
  ctx.drawImage(c, 0, cut, c.width, c.height - cut, sx + sp.ox, sy + sp.oy + cut, c.width, c.height - cut);
};
const _wgBuildSwing = wgBuildAll;
wgBuildAll = function () {
  _wgBuildSwing();
  const one = (id, w, h, fn) => wgReg(id, [wgMake(id, w, h, fn)]);
  // a wooden A-frame with a beam across; the ropes and the seat are drawn on their own so they can sway
  one('swing', 22, 34, (g) => {
    for (const [a, b] of [[5, 2], [15, 18]]) { wgLine(g, a, 3, b, 32, 'N'); wgLine(g, a + 1, 3, b + 1, 32, 'n'); wgRc(g, b - 1, 32, 4, 1, 'u'); } // the legs splay out, lit on their left
    wgRc(g, 2, 1, 18, 2, 'N'); wgRc(g, 2, 1, 18, 1, 'A'); wgRc(g, 2, 3, 18, 1, 'n'); // the beam
  });
  // a white tub on four little gold feet, full of warm water with a few bubbles
  one('bathtub', 22, 20, (g) => {
    wgRc(g, 2, 1, 18, 15, 'l'); wgRc(g, 1, 2, 20, 13, 'l'); wgRc(g, 2, 1, 18, 1, 'w'); wgRc(g, 1, 2, 1, 12, 'w'); wgRc(g, 20, 3, 1, 12, 'm'); wgRc(g, 2, 15, 18, 1, 'm'); // the tub
    wgRc(g, 3, 2, 16, 3, 'c'); wgRc(g, 3, 2, 16, 1, 'C'); wgPx(g, 6, 3, 'w'); wgPx(g, 14, 3, 'w'); wgPx(g, 15, 4, 'C'); // the water
    wgRc(g, 2, 5, 18, 1, 'w'); wgRc(g, 2, 6, 18, 1, 'L'); // the front rim, the bather sits behind it
    for (const x of [3, 17]) { wgRc(g, x, 16, 2, 3, 'y'); wgPx(g, x, 16, 'Y'); } // little gold feet
  });
  // a stone basin on a pillar, water in its dish
  one('birdbath', 16, 18, (g) => {
    wgRc(g, 6, 8, 4, 8, 'm'); wgRc(g, 6, 8, 1, 8, 'l'); wgRc(g, 9, 8, 1, 8, 'd'); wgRc(g, 4, 15, 8, 2, 'm'); wgRc(g, 4, 15, 8, 1, 'l'); // the pillar and its foot
    wgBlob(g, 8, 5, 7, 3, ['d', 'm', 'l', 'L']); wgBlob(g, 8, 4.6, 5, 1.6, ['B', 'c', 'c', 'C']); wgPx(g, 6, 4, 'w'); // the dish and the water
  });
};
