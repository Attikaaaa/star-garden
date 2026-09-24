'use strict';
// Synthesised chiptune SFX + a tiny step sequencer for music. No audio files.
const Audio_ = (() => {
  let ac = null, master, sfxBus, musBus, noiseBuf, pulse12, pulse25;
  const set = Save.settings;
  const MUS = 0.22, SFXV = 0.4;
  const musGain = () => MUS * set.music / 10;

  function pulseWave(duty) {
    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ac.createPeriodicWave(re, im);
  }
  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = set.muted ? 0 : 1; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = SFXV * set.sfx / 10; sfxBus.connect(master);
    musBus = ac.createGain(); musBus.gain.value = 0; musBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    pulse12 = pulseWave(0.125); pulse25 = pulseWave(0.25);
    if (pendingSong) { const s = pendingSong; pendingSong = null; play(s); }
  }

  function osc(wave, f0, f1, dur, vol, at, bus) {
    const t = ac.currentTime + (at || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    if (wave === 'p12') o.setPeriodicWave(pulse12);
    else if (wave === 'p25') o.setPeriodicWave(pulse25);
    else o.type = wave;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq, type, at, freq1, bus) {
    const t = ac.currentTime + (at || 0);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf;
    f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq, t);
    if (freq1) f.frequency.exponentialRampToValueAtTime(freq1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  const last = Object.create(null);
  const SFX = {
    shoot() { const p = 1 + (Math.random() - 0.5) * 0.08; osc('p25', 820 * p, 1400 * p, 0.07, 0.10); },
    hit() { osc('p25', 360, 160, 0.06, 0.12); noise(0.04, 0.12, 3000, 'highpass'); },
    kill() { osc('p25', 700, 90, 0.18, 0.16); noise(0.14, 0.18, 1800, 'lowpass'); },
    hurt() { osc('square', 440, 70, 0.32, 0.18); noise(0.2, 0.2, 900, 'lowpass'); },
    coin() { osc('p25', 988, 988, 0.06, 0.12); osc('p25', 1319, 1319, 0.16, 0.12, 0.06); },
    heart() { [523, 659, 784, 1047].forEach((f, i) => osc('p25', f, f, 0.08, 0.11, i * 0.05)); },
    item() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => osc('p25', f, f, i === 5 ? 0.4 : 0.09, 0.12, i * 0.07)); osc('triangle', 262, 262, 0.6, 0.2, 0.35); },
    door() { noise(0.18, 0.2, 400, 'lowpass'); osc('triangle', 110, 55, 0.2, 0.25); },
    clear() { [784, 988, 1175, 1568].forEach((f, i) => osc('triangle', f, f, 0.25, 0.18, i * 0.08)); },
    dash() { noise(0.14, 0.14, 700, 'bandpass', 0, 3000); },
    eshoot() { osc('triangle', 620, 320, 0.08, 0.10); },
    boom() { noise(0.45, 0.35, 500, 'lowpass', 0, 80); osc('triangle', 90, 35, 0.4, 0.35); },
    select() { osc('p25', 660, 660, 0.05, 0.09); },
    confirm() { osc('p25', 660, 660, 0.05, 0.1); osc('p25', 990, 990, 0.1, 0.1, 0.05); },
    deny() { osc('square', 180, 140, 0.15, 0.1); },
    pop() { noise(0.04, 0.08, 2500, 'bandpass'); },
    brk() { noise(0.16, 0.22, 1200, 'bandpass', 0, 300); osc('p25', 220, 90, 0.12, 0.1); },
    land() { osc('triangle', 180, 90, 0.1, 0.18); },
    tele() { osc('p12', 1400, 500, 0.18, 0.07); },
    charge() { osc('p12', 200, 600, 0.3, 0.06); },
    roar() { osc('square', 130, 70, 0.7, 0.14); noise(0.6, 0.2, 600, 'lowpass', 0, 150); },
    portal() { [392, 523, 659, 784, 1047].forEach((f, i) => osc('triangle', f, f * 1.01, 0.3, 0.14, i * 0.06)); },
    bossdie() { for (let i = 0; i < 6; i++) { noise(0.3, 0.25, 800, 'lowpass', i * 0.12, 100); } [523, 659, 784, 1047].forEach((f, i) => osc('p25', f, f, 0.3, 0.12, 0.8 + i * 0.1)); },
    over() { [523, 440, 349, 262].forEach((f, i) => osc('triangle', f, f, 0.35, 0.2, i * 0.22)); },
    win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => osc('p25', f, f, i === 6 ? 0.6 : 0.14, 0.12, i * 0.12)); },
    chest() { noise(0.12, 0.2, 800, 'lowpass'); [659, 784, 988, 1319].forEach((f, i) => osc('p25', f, f, 0.1, 0.11, 0.06 + i * 0.05)); },
    beat() { osc('triangle', 70, 50, 0.1, 0.35); osc('triangle', 70, 50, 0.1, 0.25, 0.16); },
    ready() { [784, 1047, 1319].forEach((f, i) => osc('p25', f, f * 1.01, 0.12, 0.1, i * 0.06)); },
    ult() { noise(0.5, 0.25, 3000, 'bandpass', 0, 300); [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => osc('p25', f, f, 0.14, 0.11, i * 0.04)); },
    wipe() { noise(0.3, 0.1, 400, 'bandpass', 0, 2400); },
    shield() { osc('triangle', 900, 1800, 0.2, 0.15); },
  };
  function sfx(name) {
    if (!ac || set.muted || !set.sfx) return;
    const now = ac.currentTime;
    if (last[name] && now - last[name] < 0.035) return; // avoid stacking the same sound
    last[name] = now;
    SFX[name]();
  }

  // ---------- Music ----------
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const freq = (n) => {
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    const midi = 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  };
  const CHORD = {
    C: ['C3', 'G3'], G: ['G2', 'D3'], Am: ['A2', 'E3'], F: ['F2', 'C3'], Em: ['E2', 'B2'], D: ['D3', 'A3'],
    Bm: ['B2', 'F#3'], A: ['A2', 'E3'], 'F#m': ['F#2', 'C#3'], FG: ['F2', 'G2'], CD: ['C3', 'D3'],
  };
  const SONGS = {
    meadow: {
      bpm: 132, wave: 'p25', drum: 'k h s h k h s h',
      chords: 'C G Am F C G FG C F C F G Am Em FG C',
      lead: 'E5 - G5 - C6 - B5 A5 G5 - D5 - G5 - . . A5 - C6 - E6 - D6 C6 C6 - A5 - F5 - . . ' +
        'E5 - G5 - C6 - D6 E6 D6 - B5 - G5 - A5 B5 A5 - C6 - B5 - D6 - C6 - - - . . G5 . ' +
        'A5 A5 . C6 . A5 G5 F5 G5 - E5 - C5 - . . A5 A5 . C6 . F6 E6 D6 D6 - B5 - G5 - . . ' +
        'C6 C6 . E6 . C6 B5 A5 B5 - G5 - E5 - . . F5 A5 C6 A5 G5 B5 D6 B5 C6 - E6 - C6 - . .',
    },
    beach: {
      bpm: 116, wave: 'p12', drum: 'k . h . s . h h',
      chords: 'G Em C D G Em C D C D Bm Em C D G G',
      lead: 'D5 - G5 - B5 - A5 G5 E5 - - - G5 - . . E5 - G5 - C6 - B5 A5 F#5 - - - A5 - . . ' +
        'D5 - G5 - B5 - D6 - B5 - G5 - E5 - G5 - A5 - G5 - E5 - C5 - D5 - - - . . . . ' +
        'E5 . G5 . C6 - B5 - A5 . F#5 . D5 - - - F#5 . B5 . D6 - C#6 - B5 - G5 - E5 - . . ' +
        'C6 . B5 . A5 - G5 - A5 . B5 . C6 - D6 - B5 - D6 - G6 - - - . . . . D5 E5 F#5 A5',
    },
    crystal: {
      bpm: 138, wave: 'p25', drum: 'k . h . s . h h',
      chords: 'D Bm G A D Bm Em A G A F#m Bm G A D D',
      lead: 'F#5 A5 D6 A5 F#5 A5 D6 E6 F#6 - D6 - B5 - . . G5 B5 D6 B5 G5 B5 D6 E6 E6 - C#6 - A5 - . . ' +
        'F#5 A5 D6 F#6 E6 D6 C#6 D6 B5 - D6 - F#6 - . . G5 B5 E6 G6 F#6 E6 D6 C#6 A5 - - - E5 - A5 - ' +
        'D6 - B5 - G5 - B5 D6 C#6 - A5 - E5 - A5 C#6 A5 - F#5 - C#6 - A5 - B5 - D6 - F#6 - E6 D6 ' +
        'G6 - F#6 - E6 - D6 - E6 - D6 - C#6 - A5 - D6 - F#6 - A6 - F#6 - D6 - - - . . . .',
    },
    boss: {
      bpm: 152, wave: 'p25', drum: 'k h s h k k s h', drive: true,
      chords: 'Em C D Em Em C D Em',
      lead: 'E5 E5 G5 E5 B5 E5 A5 G5 E5 E5 G5 E5 C6 B5 A5 G5 F#5 F#5 A5 F#5 D6 C6 B5 A5 B5 - E6 - B5 - G5 - ' +
        'E6 D6 B5 G5 E6 D6 B5 G5 E6 C6 G5 E5 E6 C6 G5 E5 F#6 D6 A5 F#5 F#6 D6 A5 F#5 E6 - - - B5 - E6 -',
    },
  };
  for (const k in SONGS) {
    const s = SONGS[k];
    s.leadT = s.lead.split(' ');
    s.drumT = s.drum.split(' ');
    const bass = [];
    for (const c of s.chords.split(' ')) {
      const [r, f] = CHORD[c];
      if (s.drive) bass.push(r, r, f, r, r, f, r, f);
      else if (c === 'FG' || c === 'CD') bass.push(r, '.', r, '.', f, '.', f, '.');
      else bass.push(r, '.', f, '.', r, '.', f, '.');
    }
    s.bassT = bass;
    s.len = s.leadT.length;
  }

  let song = null, pendingSong = null, step = 0, nextT = 0, timer = null;
  function schedule() {
    if (!song) return;
    const dt = 60 / song.bpm / 2;
    if (nextT < ac.currentTime - 0.2) nextT = ac.currentTime + 0.05; // resumed after a throttled tab
    while (nextT < ac.currentTime + 0.12) {
      const i = step % song.len;
      const at = nextT - ac.currentTime;
      const n = song.leadT[i];
      if (n !== '-' && n !== '.') {
        let len = 1;
        while (song.leadT[(i + len) % song.len] === '-' && len < 8) len++;
        const f = freq(n);
        osc(song.wave, f, f, dt * len * 0.95, 0.22, at, musBus);
      }
      const b = song.bassT[i % song.bassT.length];
      if (b !== '.') { const f = freq(b); osc('triangle', f, f, dt * 0.9, 0.5, at, musBus); }
      const d = song.drumT[i % song.drumT.length];
      if (d === 'k') { osc('triangle', 150, 45, 0.12, 0.55, at, musBus); }
      else if (d === 's') noise(0.1, 0.22, 2000, 'bandpass', at, 0, musBus);
      else if (d === 'h') noise(0.03, 0.1, 7000, 'highpass', at, 0, musBus);
      step++;
      nextT += dt;
    }
  }
  // Songs cross-fade: the old one ducks out, the new one swells in.
  function ramp(to, dur) {
    const g = musBus.gain, t = ac.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(to, t + dur);
  }
  function play(name) {
    if (!ac) { pendingSong = name; return; }
    if (song === SONGS[name]) return;
    const had = !!song;
    song = SONGS[name] || null;
    step = 0; nextT = ac.currentTime + (had ? 0.3 : 0.05);
    if (had) { ramp(0, 0.25); musBus.gain.linearRampToValueAtTime(musGain(), ac.currentTime + 0.7); }
    else ramp(musGain(), 0.4);
    if (!timer) timer = setInterval(schedule, 30);
  }
  function stop() { song = null; pendingSong = null; if (ac) ramp(0, 0.3); }
  function applySettings() {
    if (!ac) return;
    master.gain.value = set.muted ? 0 : 1;
    sfxBus.gain.value = SFXV * set.sfx / 10;
    if (song) ramp(musGain(), 0.1);
  }
  function toggleMute() { set.muted = !set.muted; Save.write(); applySettings(); }
  return { unlock, sfx, play, stop, toggleMute, applySettings };
})();
