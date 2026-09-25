'use strict';
// Live events that follow the real sky, worked out on the device (no server needed):
// Star Rain during the big meteor showers, Moon Night at full moon, seven seasons a year
// with a free reward track, and the Boss of the Week. live.json can add or extend events
// ({ "kind": "rain" | "moon", "id", "name", "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }).

// ---------- The sky calendar ----------
// [id, name, month, peak day, days either side]
const SHOWERS = [
  ['quadrantids', 'QUADRANTIDS', 1, 3, 2], ['lyrids', 'LYRIDS', 4, 22, 2], ['aquariids', 'ETA AQUARIIDS', 5, 6, 3],
  ['perseids', 'PERSEIDS', 8, 12, 3], ['orionids', 'ORIONIDS', 10, 21, 3], ['leonids', 'LEONIDS', 11, 17, 2], ['geminids', 'GEMINIDS', 12, 14, 3],
];
const DAY_MS = 86400000;
const dayStart = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
function liveEvents(kind, t) {
  const L = ONLINE.live && Array.isArray(ONLINE.live.events) ? ONLINE.live.events : [];
  const day = dayKey(t);
  return L.filter(e => e && e.kind === kind && typeof e.from === 'string' && typeof e.to === 'string' && e.from <= day && day <= e.to);
}
// The meteor shower on at time t (local days), or null: { id, name, end }.
function showerAt(t) {
  const ev = liveEvents('rain', t)[0];
  if (ev) return { id: String(ev.id || 'live'), name: String(ev.name || 'STAR RAIN').toUpperCase(), end: Date.parse(ev.to + 'T23:59:59') };
  const y = new Date(t).getFullYear();
  for (const yy of [y - 1, y, y + 1]) for (const [id, name, m, d, w] of SHOWERS) {
    const peak = new Date(yy, m - 1, d).getTime();
    if (t >= peak - w * DAY_MS && t < peak + (w + 1) * DAY_MS) return { id: id + yy, name, end: peak + (w + 1) * DAY_MS };
  }
  return null;
}
function nextShower(t) {
  for (let k = 1; k <= 400; k++) { const s = showerAt(dayStart(t) + k * DAY_MS); if (s) return { name: s.name, start: dayStart(t) + k * DAY_MS }; }
  return null;
}
// The moon's age in days (0 new, ~14.8 full), from a known new moon.
const SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const moonAge = (t) => ((((t - NEW_MOON) / DAY_MS) % SYNODIC) + SYNODIC) % SYNODIC;
const fullMoonAt = (t) => liveEvents('moon', t).length > 0 || Math.abs(moonAge(t) - SYNODIC / 2) < 1.1;
function nextFullMoon(t) { const left = (SYNODIC / 2 - moonAge(t) + SYNODIC) % SYNODIC; return t + left * DAY_MS; }
// Halloween week: the land's slimes dress up as pumpkins.
function holiday(t) { const d = new Date(t === undefined ? Date.now() : t), m = d.getMonth() + 1, day = d.getDate(); return (m === 10 && day >= 24) || (m === 11 && day <= 1) ? 'halloween' : ''; }
const slimeColor = (c) => (c === 'green' && holiday() === 'halloween' ? 'pumpkin' : c);

// ---------- Star Rain: shooting stars fall during runs and leave stardrops ----------
TRAILS.meteor = { name: 'METEOR', cols: ['w', 'Y', 'y', 'O'], how: 'STAR RAIN: 15 STARDROPS' };
TITLES.STARGAZER = 'STAR RAIN: 40 STARDROPS';
const RAIN_REWARDS = [[15, { trail: 'meteor' }], [40, { title: 'STARGAZER' }]];
const FALLING = [];
function updateStarRain(dt) {
  const room = G.room;
  if (!room || G.state !== 'play' || G.trans || G.warp || G.cine || !showerAt(Date.now())) return;
  if ((G.rainT = (G.rainT === undefined ? 6 : G.rainT) - dt) <= 0) {
    G.rainT = rnd(14, 22); // not the run's seeded dice: dailies stay the same for everyone
    // a random open spot on the floor
    for (let k = 0; k < 20; k++) {
      const tx = rnd(40, VW - 40), ty = rnd(OY + 48, OY + 180);
      if (solidPx(room, tx, ty, 'player')) continue;
      FALLING.push({ x: tx - 90, y: ty - 150, tx, ty, t: 0.6 });
      break;
    }
  }
  for (let i = FALLING.length - 1; i >= 0; i--) {
    const f = FALLING[i];
    f.t -= dt;
    const k = Math.max(0, f.t) / 0.6;
    f.x = f.tx - 90 * k; f.y = f.ty - 150 * k;
    part(f.x, f.y, 0, 0, 0.3, pick(['w', 'Y', 'y']), { drag: 1 });
    if (f.t > 0) continue;
    FALLING.splice(i, 1);
    burst(f.tx, f.ty - 4, 12, ['Y', 'y', 'w'], 80, 0.45, { g: -20 });
    room.pickups.push({ type: 'stardrop', x: f.tx, y: f.ty, z: 0, vz: 0, vx: 0, vy: 0, t: 0 });
    Audio_.sfx('star');
  }
}
onNote((ev) => {
  if (ev === 'start') FALLING.length = 0;
  if (ev !== 'stardrop') return;
  bump('stardrops');
  const n = cnt('stardrops');
  for (const [need, gift] of RAIN_REWARDS) if (n === need) {
    giveGift(gift);
    G.banner = { title: 'A STAR RAIN GIFT!', sub: giftText(gift), t: 2.6, icon: null };
    return;
  }
  toast('STARDROPS: ' + n);
});

// ---------- Moon Night: the daily run under a full moon ----------
MODS.moonlit = { name: 'MOON NIGHT', desc: 'A FULL MOON: EVERY HERO GETS A LITTLE MOON', event: true, player: (p) => { p.orbitals += 1; } };
const moonDay = (key) => fullMoonAt(Date.parse(key + 'T12:00:00Z'));

// ---------- Seasons: seven a year, each with a featured twist and a free reward track ----------
const SEASONS = [
  { id: 'frost', name: 'FROST SEASON', mod: 'swift', title: 'SNOWFLAKE' },
  { id: 'bloom', name: 'BLOOM SEASON', mod: 'crowd', title: 'BLOSSOM' },
  { id: 'rain', name: 'RAIN SEASON', mod: 'bouncy', title: 'RAINDROP' },
  { id: 'sun', name: 'SUN SEASON', mod: 'quick', title: 'SUNBEAM' },
  { id: 'star', name: 'SHOOTING STAR SEASON', mod: 'starry', title: 'STARDUST' },
  { id: 'harvest', name: 'HARVEST SEASON', mod: 'rich', title: 'PUMPKIN' },
  { id: 'night', name: 'LONG NIGHT SEASON', mod: 'night', title: 'MOONBEAM' },
];
for (const s of SEASONS) TITLES[s.title] = 'THE ' + s.name;
const SEASON_TRACK = [[30, { vault: 20 }], [80, { seeds: 1 }], [150, { vault: 50 }], [250, { seeds: 2 }], [400, 'title']];
function seasonAt(t) {
  const d = new Date(t), y = d.getFullYear(), start = new Date(y, 0, 1).getTime();
  const i = Math.min(SEASONS.length - 1, Math.floor((dayStart(t) - start) / DAY_MS / 52.2));
  const from = start + Math.round(i * 52.2) * DAY_MS, to = i === SEASONS.length - 1 ? new Date(y + 1, 0, 1).getTime() : start + Math.round((i + 1) * 52.2) * DAY_MS;
  return Object.assign({ key: SEASONS[i].id + '-' + y, from, to }, SEASONS[i]);
}
// The season of an ISO week (for the weekly challenge's featured twist).
function seasonOfWeek(key) {
  const [y, w] = key.split('-W').map(Number), jan4 = new Date(y, 0, 4), mon = jan4.getTime() - ((jan4.getDay() + 6) % 7) * DAY_MS;
  return seasonAt(mon + (w - 1) * 7 * DAY_MS + 3 * DAY_MS);
}
function seasonRec() {
  const S = seasonAt(Date.now());
  if (!Save.season || Save.season.key !== S.key) Save.season = { key: S.key, pts: 0, got: 0 };
  return Save.season;
}
function seasonGift(i) { const g = SEASON_TRACK[i][1]; return g === 'title' ? { title: seasonAt(Date.now()).title } : g; }
function seasonPoints(n) {
  const R = seasonRec();
  R.pts += n;
  while (R.got < SEASON_TRACK.length && R.pts >= SEASON_TRACK[R.got][0]) {
    const g = seasonGift(R.got++);
    giveGift(g);
    G.bannerNext = { title: 'SEASON REWARD!', sub: giftText(g), t: 2.4, icon: null };
  }
}
onNote((ev) => {
  if (ev === 'room') seasonPoints(1);
  else if (ev === 'boss') seasonPoints(10);
  else if (ev === 'daily' || ev === 'weekly') seasonPoints(5);
});

// ---------- Boss of the Week: a stronger boss at the end of its land ----------
const BOW_BOSSES = [['king', 0], ['bcrab', 1], ['golem', 2], ['queen', 0], ['octo', 1], ['cmoth', 2], ['mayor', 0, '2026-W40'], ['turtle', 1, '2026-W41'], ['geode', 2, '2026-W42']];
const BOW_HP = 1.4;
function bossOfWeek(key) {
  key = key || utcWeek();
  const pool = BOW_BOSSES.filter(b => !b[2] || key >= b[2]); // new bosses join from their week on, so past weeks stay the same
  const [boss, land] = pool[hashSeed('bow', key) % pool.length];
  return { key, boss, land, mod: withSeed(hashSeed('bow-mod', key), () => gpick(['swift', 'giants', 'glowing', 'echo'])) };
}
function startBossWeek() {
  const B = bossOfWeek();
  G.diff = 1;
  startRun('adv', null, { quick: true, depth: B.land, mods: [B.mod], bow: B });
  track('bow_start', { key: B.key, boss: B.boss });
}
onNote((ev, a) => {
  if (ev !== 'end' || !G.run || !G.run.bow || !a.won) return;
  const k = 'bow:' + G.run.bow.key;
  if (Save.flags[k]) return;
  Save.flags[k] = true;
  const g = { seeds: 1, vault: 40 };
  giveGift(g);
  toast('BOSS OF THE WEEK BEATEN! ' + giftText(g));
});

// ---------- The SKY tab of the daily screen ----------
const fmtDays = (ms) => { const d = Math.ceil(ms / DAY_MS); return d <= 1 ? 'TOMORROW' : 'IN ' + d + ' DAYS'; };
function drawSkyTab() {
  const now = Date.now(), x0 = VW / 2 - 138, rx = VW / 2 + 60;
  // left: tonight's sky
  const rain = showerAt(now), nr = rain ? null : nextShower(now);
  text('STAR RAIN', x0, 52, 'Y', 1);
  if (rain) { text(rain.name + ': ON NOW!', x0, 62, 'h', 1); text('CATCH FALLING STARS!', x0, 71, 'w', 1); }
  else if (nr) { text(nr.name + ' ' + fmtDays(nr.start - now), x0, 62, 'w', 1); text('STARS WILL FALL IN RUNS', x0, 71, 'l', 1); }
  text('STARDROPS: ' + cnt('stardrops'), x0, 80, 'c', 1);
  drawS(S('stardrop'), x0 + 90, 78);
  const moon = fullMoonAt(now);
  text('MOON NIGHT', x0, 94, 'Y', 1);
  text(moon ? 'FULL MOON TONIGHT!' : 'FULL MOON ' + fmtDays(nextFullMoon(now) - now), x0, 104, moon ? 'h' : 'w', 1);
  text('THE DAILY RUN GETS A MOON', x0, 113, 'l', 1);
  // the season and its track
  const S_ = seasonAt(now), R = seasonRec(), top = SEASON_TRACK[SEASON_TRACK.length - 1][0];
  text(S_.name, x0, 127, 'Y', 1);
  text('ENDS ' + fmtDays(S_.to - now) + '  FEATURED: ' + MODS[S_.mod].name, x0, 137, 'l', 1);
  const bw = 150, fill = Math.round(Math.min(1, R.pts / top) * (bw - 2));
  rect(x0, 146, bw, 7, '0'); rect(x0 + 1, 147, bw - 2, 5, '1'); rect(x0 + 1, 147, fill, 5, 'h');
  SEASON_TRACK.forEach(([n], i) => rect(x0 + 1 + Math.round(n / top * (bw - 2)) - 1, 145, 1, 9, i < R.got ? 'Y' : '3'));
  text(R.got < SEASON_TRACK.length ? R.pts + ' / ' + SEASON_TRACK[R.got][0] + ': ' + giftText(seasonGift(R.got)) : 'TRACK COMPLETE!', x0, 157, 'c', 1);
  // right: the Boss of the Week
  const B = bossOfWeek();
  text('BOSS OF THE WEEK', rx, 52, 'Y', 1, 1);
  text(bossName(B.boss), rx, 64, 'P', 1, 1);
  text(THEMES[LANDS[B.land].theme].name, rx, 76, 'w', 1, 1);
  text('+40% HEALTH, ' + MODS[B.mod].name, rx, 86, 'l', 1, 1);
  if (Save.flags['bow:' + B.key]) text('BEATEN THIS WEEK!', rx, 98, 'h', 1, 1);
  else { text('FIRST WIN PAYS', rx, 98, 'c', 1, 1); text('+1 SEED +40 VAULT', rx, 108, 'c', 1, 1); }
  text('NEW BOSS ' + fmtDays(weekLeft()), rx, 120, 'l', 1, 1);
}
function weekLeft() { const d = new Date(), mon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7))); return mon.getTime() - Date.now(); }
