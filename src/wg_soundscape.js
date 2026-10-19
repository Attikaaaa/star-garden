'use strict';
// Wildgrove: soft sounds of the place. Rain patters while it rains outdoors; waves wash in now and then while the hero
// stands near open water (`WG_SEA_N` deep tiles or more within `WG_SEA_R` tiles); a fire crackles while the hero is
// within `WG_CRACKLE_R` tiles of one (a fire station: a campfire, a fireplace). All quiet one-shot sounds on timers
// (`WGSS`), looked about twice a second, each screen its own; off with the ambient life option.
const WG_SEA_R = 5, WG_SEA_N = 30, WG_CRACKLE_R = 3;
const WGSS = { look: 0, sea: false, fire: false, rainT: 0, waveT: 0, fireT: 0 };
const _wgUpdSounds = updateWG;
updateWG = function (dt) {
  _wgUpdSounds(dt);
  const w = WGS.world, p = WGS.p;
  if (!w || !p || WGS.scr !== 'play' || !wgOpt().amb) { WGSS.sea = WGSS.fire = false; return; }
  if ((WGSS.look -= dt) <= 0) { // what is about: open water, a fire
    WGSS.look = 0.5; const tx = Math.floor(p.x / 16), ty = Math.floor(p.y / 16); let sea = 0, fire = false;
    for (let j = -WG_SEA_R; j <= WG_SEA_R; j++) for (let i = -WG_SEA_R; i <= WG_SEA_R; i++) {
      if (WGS.dim === 'o' && GROUND[wgGround(w, 'o', tx + i, ty + j)].id === 'deep') sea++;
      if (!fire && Math.abs(i) <= WG_CRACKLE_R && Math.abs(j) <= WG_CRACKLE_R) { const o = OBJ[wgObjAt(w, WGS.dim, tx + i, ty + j)]; if (o && o.st === 'fire') fire = true; }
    }
    WGSS.sea = sea >= WG_SEA_N; WGSS.fire = fire;
  }
  const rain = WGS.dim === 'o' && WGS.weather && WGS.weather.kind === 'rain';
  if (rain && (WGSS.rainT -= dt) <= 0) { WGSS.rainT = 0.25 + Math.random() * 0.2; wgSfx('patter'); }
  if (WGSS.sea && (WGSS.waveT -= dt) <= 0) { WGSS.waveT = 4.5 + Math.random() * 3; wgSfx('surf'); }
  if (WGSS.fire && (WGSS.fireT -= dt) <= 0) { WGSS.fireT = 0.35 + Math.random() * 0.8; wgSfx('crackle'); }
};
