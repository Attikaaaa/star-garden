'use strict';
// Persistent settings and lifetime progress. Storage may be blocked: everything fails soft.
const Save = (() => {
  const KEY = 'csk_save';
  const s = {
    settings: { music: 7, sfx: 8, shake: true, muted: false },
    stats: { runs: 0, wins: 0, kills: 0, bestDepth: 0, bestTime: 0 },
    found: [], stars: 0, up: {},
  };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw) {
      Object.assign(s.settings, raw.settings);
      Object.assign(s.stats, raw.stats);
      if (Array.isArray(raw.found)) s.found = raw.found;
      s.stars = raw.stars || 0; s.up = raw.up || {};
    } else {
      // carry over records from the first version
      const b = JSON.parse(localStorage.getItem('csk_best') || '{}');
      s.stats.bestDepth = b.depth || 0; s.stats.wins = b.wins || 0;
      s.settings.muted = localStorage.getItem('csk_mute') === '1';
    }
  } catch (e) { /* no storage */ }
  s.write = () => { try { localStorage.setItem(KEY, JSON.stringify({ settings: s.settings, stats: s.stats, found: s.found, stars: s.stars, up: s.up })); } catch (e) { /* no storage */ } };
  return s;
})();
