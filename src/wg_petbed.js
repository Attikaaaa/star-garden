'use strict';
// Wildgrove: a pet bed. A round padded bed with a soft cushion; while your companion's friend rests near one (seated,
// or standing still at night) the companion trots over, curls up in it and sleeps, little z's rising, until you get up
// or walk on. It all happens where the creatures are simulated (alone, or on the host); the nap rides in the `mobs`
// message (index 9) so friends see it too. A companion that cannot reach the bed gives up for a while. SWEET DREAMS.
const WG_PETBED_R = 6, WG_PETBED_STILL = 2;
const WGPB = { bed: null, scanT: 0, stillT: 0 };
(function () {
  wgObj('pet_bed', { name: 'PET BED', kind: 'deco', tool: 'axe', hp: 2, solid: 0, petbed: 1, drops: [DR('pet_bed', 1, 1)] });
  wgItem('pet_bed', 'PET BED', 'place', { place: 'pet_bed' }); PLACE.pet_bed = 'pet_bed'; wgRec('pet_bed', 1, { wool: 2, stick: 3 }, 'loom');
  WG_ACH.push(['nap', 'SWEET DREAMS', 'WATCH YOUR COMPANION NAP IN ITS BED', (c) => c.st.nap]);
})();
function wgPetBedNear() { // the nearest pet bed within reach of a resting friend, looked for twice a second
  const p = WGS.p, w = WGS.world; if (!p || !w) return null;
  if (p.moving) WGPB.stillT = WGS.t;
  const rest = (p.sit && p.sit.dim === WGS.dim) || (wgNight(WGS.clock) > 0.5 && WGS.t - WGPB.stillT >= WG_PETBED_STILL);
  if (!rest) { WGPB.bed = null; return null; }
  if (WGS.t >= WGPB.scanT) {
    WGPB.scanT = WGS.t + 0.5; WGPB.bed = null; const x = Math.floor(p.x / 16), y = Math.floor(p.y / 16); let best = 1e9;
    for (let j = -WG_PETBED_R; j <= WG_PETBED_R; j++) for (let i = -WG_PETBED_R; i <= WG_PETBED_R; i++) {
      const id = wgObjAt(w, WGS.dim, x + i, y + j); if (!id || !OBJ[id].petbed) continue;
      const d = i * i + j * j; if (d < best) { best = d; WGPB.bed = { x: x + i, y: y + j, dim: WGS.dim }; }
    }
  }
  return WGPB.bed && WGPB.bed.dim === WGS.dim ? WGPB.bed : null;
}
// the companion goes to the bed instead of following: its step this frame is taken back and made toward the bed
const _wgUpdMobsBed = wgUpdateMobs;
wgUpdateMobs = function (dt) {
  const pet = wgSimHere() ? WGS.mobs.find(m => m.pet && m.dim === WGS.dim) : null, bed = pet && !(pet.bedNo > WGS.t) ? wgPetBedNear() : null, at = bed && [pet.x, pet.y];
  _wgUpdMobsBed(dt);
  if (!pet) return;
  if (!bed || pet.dead || !WGS.mobs.includes(pet)) { pet.nap = 0; pet.bedS = 0; return; }
  const d = WG_MOBS[pet.type], bx = bed.x * 16 + 8, by = bed.y * 16 + 12; pet.x = at[0]; pet.y = at[1]; pet.vx = pet.vy = 0;
  const dx = bx - pet.x, dy = by - pet.y, dist = Math.hypot(dx, dy), sp = d.spd * dt;
  if (dist <= Math.max(1.5, sp)) {
    pet.x = bx; pet.y = by; pet.fr = 0; pet.bedS = 0;
    if (!pet.nap) { pet.nap = 1; const st = WGS.world.meta.stats || (WGS.world.meta.stats = { kills: 0, far: 0 }); st.nap = 1; }
    return;
  }
  pet.nap = 0; wgMoveBox(pet, dx / dist * sp, 0, d.w, 2); wgMoveBox(pet, 0, dy / dist * sp, d.w, 2); pet.blockedX = pet.blockedY = false;
  pet.ft += dt * 6; pet.fr = Math.floor(pet.ft) % 2; if (Math.abs(dx) > 1) pet.flip = dx > 0;
  if (Math.hypot(bx - pet.x, by - pet.y) > dist - sp * 0.3) { if ((pet.bedS = (pet.bedS || 0) + dt) > 2) { pet.bedNo = WGS.t + 20; pet.bedS = 0; } } else pet.bedS = 0; // stuck: try again later
};
const _wgUsePetBed = wgUse;
wgUse = function (tx, ty) {
  const o = WGS.world && OBJ[wgObjAt(WGS.world, WGS.dim, tx, ty)];
  if (!o || !o.petbed) return _wgUsePetBed(tx, ty);
  const asleep = WGS.mobs.some(m => m.nap && m.dim === WGS.dim && Math.abs(m.x - (tx * 16 + 8)) < 4 && Math.abs(m.y - (ty * 16 + 12)) < 4);
  wgToast(asleep ? 'SHH... IT IS ASLEEP' : 'A COSY BED FOR YOUR COMPANION');
  return true;
};
// the nap goes out with the creatures, and a guest reads it
const _wgnSendBed = wgnSend;
wgnSend = function (L, msg, unreliable) {
  if (msg && msg.t === 'mobs' && Array.isArray(msg.l)) for (const m of WGS.mobs) if (m.nap) { const a = msg.l.find(q => q[0] === m.id); if (a) a[9] = 1; }
  return _wgnSendBed(L, msg, unreliable);
};
const _wgnMobsBed = wgnMobs;
wgnMobs = function (list) {
  _wgnMobsBed(list);
  const nap = new Map(); for (const a of list) if (Array.isArray(a)) nap.set(a[0], a[9] === 1 ? 1 : 0);
  for (const m of WGS.mobs) m.nap = nap.get(m.id) || 0;
};
// ---------- drawing: curled up low in the cushion, the basket's front over it, z's rising ----------
const _wgDrawMobBed = wgDrawMob;
wgDrawMob = function (e, cx0, cy0) {
  const m = e.m; if (!m.nap) return _wgDrawMobBed(e, cx0, cy0);
  const y = m.y, fr = m.fr, b = Math.floor(WGS.t / 1.6) % 2; m.y += b; m.fr = 0; // a slow breath
  try { _wgDrawMobBed(e, cx0, cy0); } finally { m.y = y; m.fr = fr; }
  const F = WGA.cache.pet_bed_front, sx = Math.round(m.x - cx0), sy = Math.round(m.y - cy0); if (F) ctx.drawImage(F, sx - 14, sy); // the bed's rows 10-13 (it stands 2 px down its tile, the sleeper's feet at 12)
  const s = m.flip ? 1 : -1; // the head's side
  for (let k = 0; k < 2; k++) { // two z's drifting up and away from the head
    const u = (WGS.t / 2.4 + k / 2) % 1, zx = sx + s * (6 + Math.round(u * 5)) - 2, zy = sy - 18 - Math.round(u * 12);
    ctx.globalAlpha = u < 0.75 ? 1 : (1 - u) * 4; rect(zx, zy, 4, 1, 'w'); rect(zx + 2, zy + 1, 1, 1, 'w'); rect(zx + 1, zy + 2, 1, 1, 'w'); rect(zx, zy + 3, 4, 1, 'w'); ctx.globalAlpha = 1;
  }
};
const _wgTipPetBed = wgTipLines;
wgTipLines = function (s) { const L = _wgTipPetBed(s); if (s.id === 'pet_bed') L.push('YOUR COMPANION NAPS HERE WHILE YOU REST'); return L; };
const _wgBuildPetBed = wgBuildAll;
wgBuildAll = function () {
  _wgBuildPetBed();
  // a round padded bed in blue, wider than its biggest sleeper: a soft back rim, a cream cushion in the hollow and a
  // deep front rim with a seam (kept apart too, to draw over a sleeper's feet)
  wgReg('pet_bed', [wgMake('pet_bed', 28, 14, (g) => {
    wgBlob(g, 14, 7.5, 12.5, 5, ['b', 'B', 'c', 'C']); wgBlob(g, 14, 6.5, 9.5, 3, ['e', 'a', 'A', 'L']);
    for (let x = 4; x <= 23; x += 3) wgPx(g, x, 11, 'C');
  })]);
  const [f, h] = wgCv(28, 4); h.drawImage(WGA.cache.pet_bed, 0, 10, 28, 4, 0, 0, 28, 4); WGA.cache.pet_bed_front = f; // the front rim and its outline
};
