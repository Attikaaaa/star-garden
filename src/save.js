'use strict';
// Persistent settings and lifetime progress in one versioned record. Storage may be
// blocked: everything fails soft. Older records are upgraded on load.
const SAVE_V = 2;
// Calendar keys in local time (letters, the gentle calendar) and in UTC (the daily run,
// which is the same day for every player).
const pad2 = (n) => String(n).padStart(2, '0');
const dayKey = (t) => { const d = new Date(t === undefined ? Date.now() : t); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
const utcDay = (t) => new Date(t === undefined ? Date.now() : t).toISOString().slice(0, 10);
// ISO week in UTC, e.g. '2026-W39' (the weekly challenge).
function utcWeek(t) {
  const d = new Date(t === undefined ? Date.now() : t);
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const wd = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - wd);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return x.getUTCFullYear() + '-W' + pad2(Math.ceil(((x - y0) / 86400000 + 1) / 7));
}
// Whole local days from key a to key b ('2026-09-24' style).
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);

// The magic items of the first release: players from back then keep all of them unlocked.
const FIRST_ITEMS = ['rapid', 'big', 'triple', 'bounce', 'pierce', 'homing', 'moon', 'heart', 'speed', 'magnet',
  'firework', 'honey', 'backshot', 'clover', 'scope', 'stardust', 'shield'];

const Save = (() => {
  const KEY = 'csk_save';
  const s = {
    v: SAVE_V,
    settings: { music: 7, sfx: 8, shake: true, vibe: 2, diff: 1, muted: false, assist: false, cb: false, lefty: false, share: null },
    stats: { runs: 0, wins: 0, kills: 0, bestDepth: 0, bestTime: 0, bestWave: 0, bestWaveKills: 0 },
    found: [], vault: 0, up: {}, wands: ['wand'], wand: 'wand', name: 'PIP', skin: 0,
    id: '', born: 0, lastDay: '', days: 0,
    flags: {}, badge: [],
    unl: { items: [], robes: [0, 1], heroes: ['pip'], pets: [], trails: [], titles: [], aspects: {} },
    hero: 'pip', pet: '', trail: '', title: '',
    seeds: 0, scrolls: [], plots: [], critters: [], decor: [],
    cnt: {}, ach: {}, syn: [], hist: [],
    quests: null, mail: { got: [], read: [] }, cal: { step: 0, last: '' },
    daily: { day: '', tries: 0, best: 0, ranked: -1, streak: 0, last: '', log: [] },
    weekly: { week: '', tries: 0, best: 0, ranked: -1 },
    trials: { max: 0, best: {} },
    story: { stars: [], ending: false, lines: {} },
    nemesis: null, frog: 0, cloud: null, ver: '',
    friends: [], me: null, season: null,
  };
  const arr = (v, d) => (Array.isArray(v) ? v : d);
  const obj = (v, d) => (v && typeof v === 'object' && !Array.isArray(v) ? v : d);
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw) {
      Object.assign(s.settings, raw.settings);
      Object.assign(s.stats, raw.stats);
      s.found = arr(raw.found, s.found);
      s.up = obj(raw.up, {});
      s.wands = arr(raw.wands, s.wands);
      if (s.wands.includes(raw.wand)) s.wand = raw.wand;
      s.vault = raw.vault || 0;
      if (typeof raw.name === 'string' && raw.name) s.name = raw.name.slice(0, 8);
      if (raw.skin >= 0 && raw.skin < 8) s.skin = raw.skin;
      // stars from before the vault become vault coins; the retired pouch upgrade is refunded
      if (raw.stars) s.vault += raw.stars * 2;
      if (s.up.coins) { s.vault += [16, 40, 80].slice(0, s.up.coins).reduce((a, b) => a + b, 0); delete s.up.coins; }
      if (raw.v >= 2) {
        for (const k of ['id', 'born', 'lastDay', 'days', 'hero', 'pet', 'trail', 'title', 'seeds', 'frog', 'ver']) if (raw[k] !== undefined) s[k] = raw[k];
        s.flags = obj(raw.flags, {}); s.badge = arr(raw.badge, []);
        Object.assign(s.unl, obj(raw.unl, {}));
        s.scrolls = arr(raw.scrolls, []); s.plots = arr(raw.plots, []); s.critters = arr(raw.critters, []); s.decor = arr(raw.decor, []);
        s.cnt = obj(raw.cnt, {}); s.ach = obj(raw.ach, {}); s.syn = arr(raw.syn, []); s.hist = arr(raw.hist, []);
        s.quests = obj(raw.quests, null);
        Object.assign(s.mail, obj(raw.mail, {})); Object.assign(s.cal, obj(raw.cal, {}));
        Object.assign(s.daily, obj(raw.daily, {})); Object.assign(s.weekly, obj(raw.weekly, {}));
        Object.assign(s.trials, obj(raw.trials, {})); Object.assign(s.story, obj(raw.story, {}));
        s.nemesis = obj(raw.nemesis, null); s.cloud = obj(raw.cloud, null);
        s.friends = arr(raw.friends, []).filter(c => typeof c === 'string').slice(0, 30); s.me = obj(raw.me, null); s.season = obj(raw.season, null);
      } else {
        // a player from before progress tracking: keep everything they could already use
        s.unl.items = FIRST_ITEMS.slice();
        s.unl.robes = [0, 1, 2, 3, 4, 5, 6, 7];
        s.flags = { tutorial: s.stats.runs > 0, gift: s.stats.runs > 0, menus: s.stats.runs > 0, legacy: true };
        if (s.stats.runs > 0) s.born = Date.now() - 86400000;
        // the old HARD / STARBREAKER picks stay available to the players who used them
        if (s.settings.diff >= 2) s.flags.hard = true;
        if (s.settings.diff >= 3) s.flags.starbreaker = true;
      }
    } else {
      // carry over records from the first version
      const b = JSON.parse(localStorage.getItem('csk_best') || '{}');
      s.stats.bestDepth = b.depth || 0; s.stats.wins = b.wins || 0;
      s.settings.muted = localStorage.getItem('csk_mute') === '1';
      if (s.stats.bestDepth || s.stats.wins) { s.unl.items = FIRST_ITEMS.slice(); s.flags = { tutorial: true, gift: true, menus: true, legacy: true }; }
    }
  } catch (e) { /* no storage */ }
  s.write = () => {
    const out = {};
    for (const k in s) if (typeof s[k] !== 'function' && k[0] !== '_') out[k] = s[k];
    out.v = SAVE_V;
    try { localStorage.setItem(KEY, JSON.stringify(out)); } catch (e) { /* no storage */ }
  };
  // Called once per boot: count distinct days of play (letters, the calendar, analytics).
  s.touch = () => {
    const today = dayKey();
    if (!s.born) s.born = Date.now();
    // _gap: days since the last visit (0 = played today already); not saved
    if (s.lastDay !== today) { s.days++; s._gap = s.lastDay ? daysBetween(s.lastDay, today) : 0; s.lastDay = today; }
    else s._gap = 0;
  };
  // A random anonymous id, made only when something needs it (cloud save, consented stats).
  s.anonId = () => {
    if (!s.id) { const a = 'abcdefghijkmnpqrstuvwxyz23456789'; for (let i = 0; i < 16; i++) s.id += a[Math.floor(Math.random() * a.length)]; s.write(); }
    return s.id;
  };
  return s;
})();
