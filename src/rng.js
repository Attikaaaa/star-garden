'use strict';
// Seeded randomness for everything that decides the game: floors, rooms, spawns, loot and
// enemy AI. Cosmetic randomness (particles, ambient life, sounds) stays on Math.random, so
// the same seed builds the same world for every player (daily and weekly runs).

// mulberry32: tiny, fast, good enough for games.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Mix any mix of numbers and strings into one 32-bit seed.
function hashSeed() {
  let h = 2166136261 >>> 0;
  for (let k = 0; k < arguments.length; k++) {
    const s = String(arguments[k]);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= 0x9e3779b9; h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  }
  return (h ^ (h >>> 15)) >>> 0;
}
const newSeed = () => (Math.random() * 4294967296) >>> 0;
const RNG = { f: mulberry32(newSeed()) };
const grand = () => RNG.f();
const grnd = (a, b) => a + RNG.f() * (b - a);
const grndi = (a, b) => Math.floor(grnd(a, b + 1));
const gpick = (arr) => arr[Math.floor(RNG.f() * arr.length)];
// In-place Fisher-Yates shuffle on the gameplay stream.
function gshuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(RNG.f() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  return arr;
}
// Start a fresh gameplay stream (a room being entered, a wave, a new floor).
function reseed() { RNG.f = mulberry32(hashSeed.apply(null, arguments)); }
// Run fn on its own stream and put the previous one back (world generation, room stock).
function withSeed(seed, fn) {
  const prev = RNG.f;
  RNG.f = mulberry32(seed >>> 0);
  try { return fn(); } finally { RNG.f = prev; }
}
