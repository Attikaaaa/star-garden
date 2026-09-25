'use strict';
// Everything that talks to the outside world, all optional and failing soft:
// anonymous play stats (only with the player's consent), error reports, live config
// (live.json: events, news, tuning), the install prompt, persistent storage and the
// optional game server (cloud save, leaderboards, push). With no server configured the
// game is complete offline; online features simply stay hidden.
const GAME_VERSION = '1.4.0';

const ONLINE = {
  url: '',            // game server base URL: <meta name="sg-server"> or live.json "server"
  session: Math.random().toString(36).slice(2, 10),
  q: [],              // queued stats events (kept on the device until the player agrees)
  live: null,         // parsed live.json
  installEvt: null,   // the browser's deferred install prompt (Android / desktop Chromium)
  flushT: 0,
};
(function readServerMeta() {
  const m = document.querySelector('meta[name="sg-server"]');
  if (m && m.content) ONLINE.url = m.content.replace(/\/+$/, '');
})();

// ---------- Anonymous play stats ----------
const Q_KEY = 'csk_q';
try { ONLINE.q = JSON.parse(localStorage.getItem(Q_KEY) || '[]'); if (!Array.isArray(ONLINE.q)) ONLINE.q = []; } catch (e) { ONLINE.q = []; }
// Nothing is sent before consent; until then events wait on the device (at most 400).
function track(ev, props) {
  if (Save.settings.share === false) return;
  ONLINE.q.push({ e: ev, t: Date.now(), s: ONLINE.session, p: props || null });
  if (ONLINE.q.length > 400) ONLINE.q.splice(0, ONLINE.q.length - 400);
  ONLINE.dirty = true;
}
function flushStats(force) {
  if (ONLINE.dirty) { ONLINE.dirty = false; try { localStorage.setItem(Q_KEY, JSON.stringify(ONLINE.q)); } catch (e) { /* full or blocked */ } }
  if (!ONLINE.url || Save.settings.share !== true || !ONLINE.q.length) return;
  if (!force && (ONLINE.flushT += 1) < 20) return; // called every few seconds; sends in batches
  ONLINE.flushT = 0;
  const batch = ONLINE.q.splice(0, 100);
  const body = JSON.stringify({ id: Save.anonId(), v: GAME_VERSION, installed: isInstalled(), touch: IS_TOUCH_EARLY, ev: batch });
  let ok = false;
  try { ok = navigator.sendBeacon && navigator.sendBeacon(ONLINE.url + '/api/events', new Blob([body], { type: 'text/plain' })); } catch (e) { ok = false; }
  if (!ok) ONLINE.q.unshift(...batch);
  ONLINE.dirty = true;
}
setInterval(() => flushStats(false), 3000);
document.addEventListener('visibilitychange', () => { if (document.hidden) flushStats(true); });
function setShare(on) {
  Save.settings.share = !!on;
  if (!on) { ONLINE.q = []; ONLINE.dirty = true; }
  Save.write();
  track('consent', { on: !!on });
  flushStats(true);
}
// Touch detection before input.js loads (stats only).
const IS_TOUCH_EARLY = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

// ---------- Error reports (through the same consent-gated queue) ----------
let _errN = 0;
window.addEventListener('error', (e) => {
  if (_errN++ > 5) return;
  track('error', { m: String(e.message || '').slice(0, 160), f: String(e.filename || '').split('/').pop(), l: e.lineno || 0, st: typeof G !== 'undefined' ? G.state : '' });
});
window.addEventListener('unhandledrejection', (e) => {
  if (_errN++ > 5) return;
  track('error', { m: String(e.reason && e.reason.message || e.reason || '').slice(0, 160), f: 'promise' });
});

// ---------- Live config: live.json next to index.html ----------
// { "server": "", "news": [{ "v": "1.2.0", "lines": [..] }], "events": [{ "id", "from", "to", ... }], "tuning": {} }
function loadLive() {
  try {
    fetch('live.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).then(j => {
      if (!j || typeof j !== 'object') return;
      ONLINE.live = j;
      if (typeof j.server === 'string' && j.server && !ONLINE.url) ONLINE.url = j.server.replace(/\/+$/, '');
      if (typeof loadGoal === 'function') loadGoal();
    }).catch(() => {});
  } catch (e) { /* offline */ }
}
const liveTuning = (key, dflt) => (ONLINE.live && ONLINE.live.tuning && ONLINE.live.tuning[key] !== undefined ? ONLINE.live.tuning[key] : dflt);

// ---------- Server API (cloud save, leaderboards, community goals, push) ----------
function api(path, body, timeoutMs) {
  if (!ONLINE.url) return Promise.resolve(null);
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const t = setTimeout(() => ctl && ctl.abort(), timeoutMs || 6000);
  const opts = body === undefined ? { method: 'GET' } : { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body) };
  if (ctl) opts.signal = ctl.signal;
  return fetch(ONLINE.url + path, opts).then(r => (r.ok ? r.json() : null)).catch(() => null).finally(() => clearTimeout(t));
}
const online = () => !!ONLINE.url && navigator.onLine !== false;

// ---------- Install and storage ----------
function isInstalled() {
  try { return matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; }
}
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); ONLINE.installEvt = e; });
window.addEventListener('appinstalled', () => { ONLINE.installEvt = null; track('installed'); });
const canPromptInstall = () => !!ONLINE.installEvt;
function promptInstall() {
  const e = ONLINE.installEvt;
  if (!e) return Promise.resolve(false);
  ONLINE.installEvt = null;
  try {
    e.prompt();
    return e.userChoice.then(c => { track('install_choice', { out: c && c.outcome }); return !!c && c.outcome === 'accepted'; }).catch(() => false);
  } catch (err) { return Promise.resolve(false); }
}
// Ask the browser to keep the save even under storage pressure. Firefox asks the player,
// so there it only happens when the player chose to (keepSafe from the install panel).
function requestPersist(fromPlayer) {
  try {
    if (!navigator.storage || !navigator.storage.persist) return;
    if (/Firefox/.test(navigator.userAgent) && !fromPlayer) return;
    navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist().then(ok => track('persist', { ok })); }).catch(() => {});
  } catch (e) { /* not supported */ }
}
