'use strict';
// Persistent settings and lifetime progress. Storage may be blocked: everything fails soft.
const Save = (() => {
  const KEY = 'csk_save';
  const s = {
    settings: { music: 7, sfx: 8, shake: true, vibe: 2, diff: 1, muted: false },
    stats: { runs: 0, wins: 0, kills: 0, bestDepth: 0, bestTime: 0, bestWave: 0, bestWaveKills: 0 },
    found: [], vault: 0, up: {}, wands: ['wand'], wand: 'wand', name: 'PIP', skin: 0,
  };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw) {
      Object.assign(s.settings, raw.settings);
      Object.assign(s.stats, raw.stats);
      if (Array.isArray(raw.found)) s.found = raw.found;
      s.up = raw.up || {};
      if (Array.isArray(raw.wands)) s.wands = raw.wands;
      if (s.wands.includes(raw.wand)) s.wand = raw.wand;
      s.vault = raw.vault || 0;
      if (typeof raw.name === 'string' && raw.name) s.name = raw.name.slice(0, 8);
      if (raw.skin >= 0 && raw.skin < 8) s.skin = raw.skin;
      // stars from before the vault become vault coins; the retired pouch upgrade is refunded
      if (raw.stars) s.vault += raw.stars * 2;
      if (s.up.coins) { s.vault += [16, 40, 80].slice(0, s.up.coins).reduce((a, b) => a + b, 0); delete s.up.coins; }
    } else {
      // carry over records from the first version
      const b = JSON.parse(localStorage.getItem('csk_best') || '{}');
      s.stats.bestDepth = b.depth || 0; s.stats.wins = b.wins || 0;
      s.settings.muted = localStorage.getItem('csk_mute') === '1';
    }
  } catch (e) { /* no storage */ }
  s.write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ settings: s.settings, stats: s.stats, found: s.found, vault: s.vault, up: s.up, wands: s.wands, wand: s.wand, name: s.name, skin: s.skin }));
    } catch (e) { /* no storage */ }
  };
  return s;
})();
