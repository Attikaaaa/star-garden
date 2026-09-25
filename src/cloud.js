'use strict';
// Saves that travel, and the online extras. The save code works everywhere, offline too.
// With a game server (see online.js) come cloud backup and transfer codes, leaderboards
// with friend codes, the weekly community goal and "your flower has bloomed" reminders.
// Without one, none of those show up.

// ---------- Save codes ----------
const SAVE_KEY = 'csk_save';
function saveJson() { Save.write(); try { return localStorage.getItem(SAVE_KEY) || '{}'; } catch (e) { return '{}'; } }
const saveCode = () => packSave(saveJson());
// Replace this device's save with another one and start again from it.
function loadSaveData(obj) {
  if (!obj || typeof obj !== 'object' || !obj.stats || !obj.settings) return false;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); } catch (e) { return false; }
  Save._frozen = true;
  clearRun(); clearArena();
  track('save_loaded');
  location.reload();
  return true;
}
const readSaveCode = (code) => unpackSave(String(code || '').replace(/\s+/g, ''));
function confirmLoad(obj) {
  if (!obj || !obj.stats) { Audio_.sfx('deny'); toast('THAT CODE DID NOT WORK'); return; }
  openModal({ title: 'LOAD THIS GARDEN?', lines: [(obj.stats.runs || 0) + ' RUNS, ' + (obj.stats.wins || 0) + ' WINS, ' + (obj.vault || 0) + ' VAULT COINS', 'IT REPLACES THE GARDEN ON THIS DEVICE.'],
    buttons: [{ label: 'LOAD', col: 'h', fn: () => { if (!loadSaveData(obj)) toast('THAT CODE DID NOT WORK'); } }, { label: 'NO' }] });
}
function copyText(str, done) {
  const fail = () => { try { window.prompt('COPY THIS:', str); } catch (e) { toast('COULD NOT COPY'); } };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(str).then(() => toast(done), fail);
  else fail();
}
// The save screen, from the settings.
function openSaveMenu() {
  const lines = ['A SAVE CODE CARRIES YOUR WHOLE GARDEN.', 'PASTE IT ON ANOTHER DEVICE TO PLAY ON THERE.'];
  const buttons = [
    { label: 'COPY', col: 'h', fn: () => { copyText(saveCode(), 'SAVE CODE COPIED!'); track('save_code'); } },
    { label: 'LOAD', fn: () => { let c = null; try { c = window.prompt('PASTE A SAVE CODE'); } catch (e) { /* blocked */ } if (c) confirmLoad(readSaveCode(c)); } },
  ];
  if (online()) {
    lines.push('ONLINE: A SHORT TRANSFER CODE DOES THE SAME.');
    buttons.push({ label: 'ONLINE', fn: openTransfer });
  }
  buttons.push({ label: 'BACK' });
  openModal({ title: 'YOUR SAVE', lines, buttons });
}

// ---------- Cloud backup and transfer codes ----------
const CLOUD_EVERY = 10 * 60000;
function cloudBackup(force) {
  if (!online() || (!force && (!Save.cloud || Date.now() - (Save.cloud.t || 0) < CLOUD_EVERY))) return Promise.resolve(Save.cloud);
  const data = JSON.parse(saveJson());
  return api('/api/save', { id: Save.anonId(), data }, 10000).then(r => {
    if (!r || !r.code) return null;
    Save.cloud = { code: r.code, t: Date.now() }; Save.write();
    return Save.cloud;
  });
}
function openTransfer() {
  toast('SAVING...');
  cloudBackup(true).then(c => {
    openModal({
      title: 'TRANSFER CODE', lines: c ? [c.code, 'ENTER IT ON YOUR OTHER DEVICE.', 'YOUR GARDEN IS BACKED UP AFTER EVERY RUN.'] : ['THE SERVER DID NOT ANSWER.', 'TRY AGAIN IN A MOMENT.'], lead: false,
      buttons: [{ label: 'ENTER A CODE', fn: enterTransfer }, { label: 'OK' }],
    });
  });
}
function enterTransfer() {
  const back = G.state;
  openEntry({
    title: 'TRANSFER CODE', hint: 'FROM YOUR OTHER DEVICE', abc: NET_ALPHA, min: 8, max: 8, ok: 'LOAD',
    done: (v) => { setState(back); api('/api/save?code=' + v).then(r => (r && r.data ? confirmLoad(r.data) : toast('NO SAVE WITH THIS CODE'))); },
    back: () => setState(back),
  });
}

// ---------- Leaderboards and friend codes ----------
function postScore(board, key, score) {
  if (!online() || NET.role === 'client') return;
  api('/api/score', { board, key, id: Save.anonId(), score }).then(r => { if (r && r.friend) { Save.me = { name: r.name, friend: r.friend }; Save.write(); } });
}
function openBoard(board, key, friends) {
  if (!online()) return;
  let q = '/api/board?board=' + board + '&key=' + key + '&id=' + Save.anonId();
  if (friends) q += '&friends=' + Save.friends.join(',');
  toast('LOADING...');
  api(q).then(r => {
    G.toast = null;
    if (!r) { toast('THE SERVER DID NOT ANSWER'); return; }
    if (r.me) { Save.me = r.me; Save.write(); }
    const lines = r.top.length ? r.top.map((e, i) => (i + 1) + '. ' + e.n + '  ' + e.s + (e.me ? ' <' : '')) : [friends ? 'ADD A FRIEND\'S CODE TO RACE THEM' : 'NOBODY YET: BE THE FIRST!'];
    if (r.rank) lines.push('YOU: #' + r.rank + ' OF ' + r.n + (r.beat ? ', AHEAD OF ' + r.beat + '%' : ''));
    if (Save.me) lines.push('YOUR FRIEND CODE: ' + Save.me.friend);
    if (goalLine()) lines.push(goalLine());
    openModal({
      title: (friends ? 'FRIENDS ' : 'EVERYONE ') + key, lines, lead: false,
      buttons: [{ label: friends ? 'EVERYONE' : 'FRIENDS', fn: () => openBoard(board, key, !friends) }, { label: 'ADD FRIEND', fn: () => addFriend(board, key) }, { label: 'CLOSE' }],
    });
  });
}
function addFriend(board, key) {
  const back = G.state;
  openEntry({
    title: 'ADD A FRIEND', hint: 'THEIR FRIEND CODE (ON THEIR LEADERBOARD)', abc: NET_ALPHA, min: 6, max: 6, ok: 'ADD',
    done: (v) => {
      setState(back);
      if (Save.me && v === Save.me.friend) { toast('THAT IS YOUR OWN CODE!'); return; }
      if (!Save.friends.includes(v)) Save.friends.unshift(v);
      Save.friends.length = Math.min(Save.friends.length, 30); Save.write();
      Audio_.sfx('ready'); toast('FRIEND ADDED!'); track('friend_add');
      openBoard(board, key, true);
    },
    back: () => setState(back),
  });
}

// ---------- The weekly community goal ----------
function loadGoal() {
  if (!online()) return;
  api('/api/goal').then(g => { if (g && g.id) { ONLINE.goal = g; goalNotice(); } });
}
function goalNotice() {
  const g = ONLINE.goal;
  if (!g || g.now < g.target || Save.flags['goal:' + g.id] || G.state !== 'title' || modalUp()) return;
  Save.flags['goal:' + g.id] = true;
  const gift = { seeds: 2, vault: 50 };
  giveGift(gift);
  openModal({ title: 'WE DID IT TOGETHER!', icon: 'icon_heart', lines: ['EVERYONE\'S WIZARDS DEFEATED ' + g.target + ' FOES THIS WEEK.', 'A THANK-YOU FOR YOUR PART:', giftText(gift)], buttons: [{ label: 'HOORAY!' }] });
}
const goalLine = () => (ONLINE.goal ? 'THIS WEEK TOGETHER: ' + Math.min(ONLINE.goal.now, ONLINE.goal.target) + ' / ' + ONLINE.goal.target + ' FOES' : '');

// ---------- Bloom reminders (web push, opt-in) ----------
const pushable = () => online() && 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification === 'function' && location.protocol === 'https:';
const bloomTimes = () => Save.plots.filter(Boolean).map(P => Date.now() + plotLeft(P)).filter(t => t > Date.now() + 60000);
function syncPush() {
  if (!Save.flags.push || !pushable()) return;
  api('/api/push', { id: Save.anonId(), at: bloomTimes(), tz: -new Date().getTimezoneOffset() / 60 });
}
// Asked once, right after planting: that is when a reminder makes sense.
function askPush() {
  if (!pushable() || Save.flags.pushAsked || Notification.permission === 'denied') { syncPush(); return; }
  Save.flags.pushAsked = true; Save.write();
  openModal({ title: 'A LITTLE REMINDER?', lines: ['SHALL WE TELL YOU WHEN IT BLOOMS?', 'AT MOST ONCE A DAY, NEVER AT NIGHT.'],
    buttons: [{ label: 'YES', col: 'h', fn: subscribePush }, { label: 'NO' }] });
}
function subscribePush() {
  const u8 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  Promise.all([Notification.requestPermission(), navigator.serviceWorker.ready, api('/api/push-key')]).then(([perm, reg, k]) => {
    track('push_opt', { ok: perm === 'granted' });
    if (perm !== 'granted' || !k || !k.key) return null;
    return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(k.key) }).then(sub => {
      Save.flags.push = true; Save.write();
      return api('/api/push', { id: Save.anonId(), sub: sub.toJSON(), at: bloomTimes(), tz: -new Date().getTimezoneOffset() / 60 });
    });
  }).then(r => { if (r) toast('WE WILL LET YOU KNOW!'); }).catch(() => toast('REMINDERS ARE NOT AVAILABLE HERE'));
}

// ---------- Hooks ----------
onNote((ev, a) => {
  if (ev === 'plant') askPush();
  else if (ev === 'harvest') syncPush();
  if (ev !== 'end' || NET.role === 'client') return;
  if (online() && a.kills > 0) api('/api/goal', { kills: a.kills }).then(g => { if (g && g.id) ONLINE.goal = g; });
  if (!G.daily && !couchOn()) {
    if (a.mode === 'arena' && a.wave > 0) postScore('arena', utcWeek(), a.wave);
    else if (a.won && a.mode === 'adv' && !G.run.quick) postScore('win', 'all', a.time);
  }
  cloudBackup(false);
});
