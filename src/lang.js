'use strict';
// Languages. The game is written in English; another language is a table of whole
// on-screen strings (lang_<id>.js). text(), textW() and wrapText() look every string up,
// so game code never changes. Keys may hold placeholders: '#' for a number and '*' for
// any words (a name, an item), filled in order: 'PLAYER # JOINS!', '* JOINED!'.
// A string with no entry simply stays in English.
const LANGS = [['en', 'ENGLISH']];
const LANG = {};
function addLang(id, name, table) {
  LANGS.push([id, name]);
  const wild = [];
  for (const k in table) if (k.includes('*')) {
    const re = new RegExp('^' + k.replace(/[.?+^$()[\]{}|\\/]/g, '\\$&').replace(/\*/g, '(.+?)').replace(/#/g, '(\\d+)') + '$');
    wild.push([re, table[k], k.match(/[*#]/g), k.replace(/[*#]/g, '').length]);
  }
  // the most specific pattern first: 'DEFEAT # FOES WITH THE *' before 'DEFEAT # *'
  wild.sort((a, b) => b[3] - a[3]);
  LANG[id] = { table, wild };
}
const langId = () => (typeof Save !== 'undefined' && LANG[Save.settings.lang] ? Save.settings.lang : 'en');
const _trCache = new Map();
function tr(str) {
  const id = langId();
  if (id === 'en') return str;
  const key = id + '\u0001' + str;
  let r = _trCache.get(key);
  if (r !== undefined) return r;
  const L = LANG[id], T = L.table;
  r = T[str];
  if (r === undefined) {
    // numbers: 'NEW RUN IN 5H 03M' finds 'NEW RUN IN #H #M'
    const nums = [], k = str.replace(/\d+/g, (m) => { nums.push(m); return '#'; });
    if (nums.length && T[k] !== undefined) { let i = 0; r = T[k].replace(/#/g, () => nums[i++]); }
  }
  if (r === undefined) {
    for (const [re, val, kinds] of L.wild) {
      const m = re.exec(str);
      if (!m) continue;
      // the words that fill a '*' are looked up too (an item or a foe name)
      const words = [], nums = [];
      kinds.forEach((kd, i) => (kd === '*' ? words : nums).push(kd === '*' ? tr(m[i + 1]) : m[i + 1]));
      let w = 0, n = 0;
      r = val.replace(/[*#]/g, (c) => (c === '*' ? words[w++] : nums[n++]));
      break;
    }
  }
  if (r === undefined) r = str;
  if (_trCache.size > 4000) _trCache.clear();
  _trCache.set(key, r);
  return r;
}
