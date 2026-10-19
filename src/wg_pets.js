'use strict';
// Wildgrove: more friends. Besides the fox (meat), a rabbit trusts you for a carrot, a frog for a firefly and a crab for
// a raw fish, two times in five like the fox; a new friend lets the old one go home to the wild. USE with an empty hand
// on your companion pets it: hearts and a happy wiggle, and the BEST FRIENDS star after ten. Taming and petting happen
// where the creatures are simulated (alone, or on the host), as taming always has.
const WG_PET_FOOD = { fox: 'meat', rabbit: 'carrot', frog: 'firefly', crab: 'fish' }; // what each friend trusts you for
(function () {
  WG_ACH.push(['pats', 'BEST FRIENDS', 'PET YOUR COMPANION TEN TIMES', (c) => (c.st.pats | 0) >= 10]);
})();
const wgMobAt = (tx, ty, f) => WGS.mobs.find(m => m.dim === WGS.dim && f(m) && Math.hypot(m.x - (tx * 16 + 8), m.y - 6 - (ty * 16 + 8)) < 20);
const _wgUsePets = wgUse;
wgUse = function (tx, ty) {
  if (WGN.role === 'client' || !WGS.world) return _wgUsePets(tx, ty);
  const s = WGS.inv[WGS.sel], p = WGS.p, t = WGS.t;
  const wild = s && wgMobAt(tx, ty, (m) => !m.pet && WG_PET_FOOD[m.type] === s.id);
  if (wild) { // a treat: two times in five it trusts you, and an old friend goes home
    const name = WG_MOBS[wild.type].name;
    wgInvTake(WGS.inv, s.id, 1); wgSfx('select'); wgPart(wild.x, wild.y - 14, 3, { c: ['P', 'r'], s: 6, up: 14, life: 0.8, sz: 2 });
    if (Math.random() < 0.4) {
      for (const m of WGS.mobs) if (m.pet) m.pet = 0;
      wild.pet = 1; p.pet = wild.type; wgToast('THE ' + name + ' TRUSTS YOU', 3); wgSfx('confirm');
    } else wgToast('THE ' + name + ' SNIFFS...');
    return true;
  }
  const pet = !s && !wgObjAt(WGS.world, WGS.dim, tx, ty) && wgMobAt(tx, ty, (m) => m.pet);
  if (pet) { // petting, with an empty hand on a bare tile (a chest beside a friend still opens, a seed still goes in): hearts and a wiggle
    if ((pet.patT || 0) > t) return true;
    pet.patT = t + 0.6; pet.patAt = t; pet.fear = 0; wgSfx('select');
    const m = WGS.world.meta, st = m.stats || (m.stats = { kills: 0, far: 0 }); st.pats = (st.pats | 0) + 1;
    return true;
  }
  return _wgUsePets(tx, ty);
};
const _wgTipPets = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipPets(s);
  const k = { meat: 'FOXES LOVE IT', carrot: 'RABBITS LOVE THEM', firefly: 'FROGS LOVE THEM', fish: 'CRABS LOVE IT' }[s.id]; if (k) L.push(k);
  return L;
};
// the happy wiggle: a petted friend turns this way and that for a moment, and a heart floats up from it
function wgPetHeart() {
  if (WGA.cache.pet_heart) return WGA.cache.pet_heart;
  const [c, g] = wgCv(7, 6); wgPaint(g, 1, 1, ['qP.PP', 'PPPPr', '.PPr.', '..r..'], { q: 'q', P: 'P', r: 'r' }); wgOutline(c);
  return (WGA.cache.pet_heart = c);
}
const _wgDrawMobPets = wgDrawMob;
wgDrawMob = function (e, cx0, cy0) {
  const m = e.m, t = WGS.t; if (!m.pet || m.patAt === undefined || t - m.patAt > 1.2 || t < m.patAt) return _wgDrawMobPets(e, cx0, cy0);
  const f = m.flip; if (m.patT > t) m.flip = Math.floor(t * 10) % 2 === 1;
  try { _wgDrawMobPets(e, cx0, cy0); } finally { m.flip = f; }
  const k = (t - m.patAt) / 1.2; ctx.globalAlpha = 1 - k * k; ctx.drawImage(wgPetHeart(), Math.round(m.x - cx0 - 3 + Math.sin(k * 7) * 1.5), Math.round(m.y - cy0 - 22 - k * 12)); ctx.globalAlpha = 1;
};
