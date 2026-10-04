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
  function bell(f, at) { osc('sine', f, f, 0.7, 0.14, at); osc('triangle', f * 2, f * 2, 0.25, 0.04, at); }
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
    horn() { osc('triangle', 196, 196, 0.55, 0.16); osc('triangle', 294, 290, 0.5, 0.1, 0.08); },
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
    scatter() { noise(0.06, 0.12, 2600, 'bandpass'); osc('p25', 1100, 700, 0.06, 0.07); },
    bubble() { const p = 1 + (Math.random() - 0.5) * 0.3; osc('triangle', 500 * p, 1100 * p, 0.05, 0.08); },
    crow() { osc('square', 520, 1180, 0.16, 0.07); osc('square', 1180, 760, 0.34, 0.07, 0.16); osc('triangle', 260, 590, 0.16, 0.06); },
    swish() { noise(0.16, 0.1, 1200, 'bandpass', 0, 3200); },
    heat() { noise(0.3, 0.14, 700, 'lowpass', 0, 2400); osc('sawtooth', 120, 70, 0.22, 0.05); }, // the Ember Forge's runes erupt
    anvil() { osc('square', 1760, 1700, 0.05, 0.08); osc('triangle', 2630, 2600, 0.35, 0.09); osc('triangle', 3520, 3500, 0.2, 0.05); noise(0.04, 0.1, 4000, 'highpass'); },
    bubble() { osc('sine', 300, 900, 0.12, 0.12); osc('sine', 600, 1400, 0.06, 0.05, 0.05); }, // a Glow Deep bubble pops
    chomp() { osc('square', 220, 60, 0.12, 0.12); noise(0.08, 0.14, 900, 'lowpass'); },
    page() { noise(0.26, 0.1, 2600, 'bandpass', 0, 900); noise(0.1, 0.07, 4200, 'highpass', 0.16); }, // a page turns
    zap() { osc('square', 1600, 400, 0.07, 0.05); noise(0.05, 0.1, 5000, 'highpass'); },
    comet() { osc('p25', 300, 700, 0.14, 0.1); noise(0.12, 0.08, 900, 'lowpass'); },
    blast() { noise(0.25, 0.22, 700, 'lowpass', 0, 120); osc('triangle', 140, 50, 0.2, 0.2); },
    bottle() { osc('triangle', 700, 1400, 0.06, 0.1); osc('triangle', 1050, 2100, 0.08, 0.08, 0.06); },
    potion() { [0, 0.07, 0.14].forEach((t, i) => osc('triangle', 300 + i * 120, 600 + i * 200, 0.07, 0.12, t)); osc('p25', 784, 1568, 0.25, 0.08, 0.2); },
    turret() { osc('square', 200, 120, 0.12, 0.12); [523, 784, 1047].forEach((f, i) => osc('p25', f, f, 0.08, 0.09, 0.1 + i * 0.05)); },
    tshoot() { osc('p12', 1200, 1800, 0.05, 0.05); },
    graze() { osc('p25', 1760, 2349, 0.05, 0.06); osc('triangle', 2637, 2637, 0.08, 0.05, 0.03); },
    quest() { [659, 880, 1109, 1319].forEach((f, i) => osc('triangle', f, f, 0.16, 0.13, i * 0.07)); osc('p25', 1760, 1760, 0.3, 0.07, 0.28); },
    clack() { osc('triangle', 1900, 1200, 0.035, 0.12); osc('triangle', 2600, 1700, 0.03, 0.06, 0.04); noise(0.025, 0.06, 5000, 'highpass'); },
    wave() { noise(1.2, 0.12, 250, 'lowpass', 0, 1500); noise(1.0, 0.08, 2200, 'bandpass', 0.35, 500); },
    mirror() { osc('triangle', 1760, 2637, 0.06, 0.08); osc('p12', 2637, 2637, 0.03, 0.03, 0.04); },
    prism() { [1568, 1976, 2349].forEach((f, i) => osc('triangle', f, f * 1.01, 0.1, 0.06, i * 0.025)); },
    // Crystal Clock bells (C E G A, a bell's sine with a faint octave), and the gate opening
    bell0() { bell(1047); }, bell1() { bell(1319); }, bell2() { bell(1568); }, bell3() { bell(1760); },
    cgate() { noise(0.3, 0.12, 900, 'lowpass'); [1047, 1319, 1568, 1760, 2093].forEach((f, i) => bell(f, 0.08 + i * 0.07)); },
    // Lantern Woods: a wick catching (a soft whoosh and a warm chime), a lamp guttering out
    lamp() { noise(0.18, 0.1, 1200, 'bandpass', 0, 3000); osc('sine', 880, 880, 0.35, 0.1, 0.05); osc('sine', 1320, 1320, 0.3, 0.05, 0.08); },
    snuff() { noise(0.2, 0.08, 600, 'lowpass', 0, 200); osc('sine', 660, 440, 0.15, 0.05); },
    star() { [1047, 1319, 1568, 2093].forEach((f, i) => osc('p25', f, f * 1.005, 0.12, 0.09, i * 0.05)); },
    // the Star Casino
    chip() { osc('triangle', 2400, 1800, 0.03, 0.09); osc('triangle', 3100, 2500, 0.03, 0.06, 0.035); },
    card() { noise(0.05, 0.14, 3500, 'bandpass', 0, 1500); },
    shuffle() { for (let i = 0; i < 7; i++) noise(0.035, 0.1, 3000 + i * 150, 'bandpass', i * 0.045); },
    reel() { noise(0.09, 0.05, 1800, 'bandpass'); osc('p12', 330, 300, 0.05, 0.03); },
    rstop() { osc('triangle', 180, 90, 0.07, 0.22); noise(0.03, 0.1, 2400, 'highpass'); },
    tick() { osc('triangle', 2200, 1700, 0.02, 0.07); },
    ball() { osc('triangle', 1500, 1200, 0.03, 0.06); noise(0.02, 0.05, 6000, 'highpass'); },
    dice() { for (let i = 0; i < 4; i++) { osc('triangle', 900 + i * 170, 600, 0.03, 0.09, i * 0.06); noise(0.02, 0.08, 4000, 'highpass', i * 0.06); } },
    cwin() { [784, 988, 1175, 1568].forEach((f, i) => osc('p25', f, f, 0.09, 0.1, i * 0.06)); osc('triangle', 2093, 2093, 0.2, 0.06, 0.24); },
    bigwin() { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => { osc('p25', f, f, 0.12, 0.11, i * 0.07); bell(f * 2, 0.5 + i * 0.05); }); osc('triangle', 131, 131, 0.9, 0.25, 0.45); },
    scratch() { noise(0.05, 0.05, 5200, 'highpass'); },
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
    Dm: ['D3', 'A3'], Gm: ['G2', 'D3'], Bb: ['Bb2', 'F3'], E: ['E2', 'B2'], B: ['B2', 'F#3'],
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
    // the Cloud Steps: F Lydian (the bright B natural over G), a harp with bells on the downbeats
    cloud: {
      bpm: 128, wave: 'triangle', drum: 'k . h . s . h .', bells: true,
      chords: 'F G F G Am G F C F G Em Am Dm G F F',
      lead: 'A5 - C6 - F6 - E6 C6 B5 - D6 - G6 - - - A5 C6 F6 C6 A5 - F5 - G5 B5 D6 B5 G5 - D5 - ' +
        'E5 - A5 - C6 - B5 A5 B5 - D6 - B5 - G5 - A5 - F5 - C6 - A5 - G5 - E5 - C5 - . . ' +
        'F5 A5 C6 E6 F6 - E6 - D6 B5 G5 B5 D6 - G6 - E6 - B5 - G5 - B5 - C6 - A5 - E5 - A5 C6 ' +
        'D6 - F6 - A6 - F6 D6 B5 - G5 - D6 - B5 - C6 - A5 - F5 - A5 C6 F6 - - - . . . .',
    },
    // the Lantern Woods: a celesta over an A minor pentatonic line, an owl on the beat, crickets
    lantern: {
      bpm: 84, wave: 'sine', celesta: true, drum: 'o . c . . c c .',
      chords: 'Am C G Am F C G Em Am C G Am F G Am Am',
      lead: 'E5 - A5 - C6 - . . D6 - C6 A5 G5 - - - A5 - C6 - E6 - D6 C6 A5 - - - . . . . ' +
        'G5 - A5 - C6 - D6 - E6 - G6 - E6 D6 C6 - D6 - C6 A5 G5 - E5 - A5 - - - . . . . ' +
        'C6 - . E6 D6 - C6 - A5 - G5 - E5 - . . D5 - E5 G5 A5 - C6 - D6 - - - . . . . ' +
        'E6 - D6 C6 A5 - C6 - D6 - E6 - G6 - E6 - D6 - C6 - A5 - G5 - A5 - - - . . . .',
    },
    // the Toy Attic: a music box in C over a woodblock metronome (tick, tock), locked to the land's beat
    toy: {
      bpm: 90, wave: 'sine', celesta: true, sync: true, drum: 't . T . t . T .',
      chords: 'C Am F G C Am Dm G F G Em Am F G C C',
      lead: 'E5 - G5 - C6 - G5 - A5 - C6 - E6 - C6 - F5 - A5 - C6 - A5 G5 G5 - B5 - D6 - - - ' +
        'E6 - D6 C6 G5 - E5 - A5 - E5 - C5 - . . D5 F5 A5 - D6 - C6 - B5 - G5 - D5 - . . ' +
        'A5 - C6 - F6 - E6 D6 D6 - B5 - G5 - B5 - E6 - B5 - G5 - E5 - A5 - C6 - E6 - D6 C6 ' +
        'C6 - A5 - F5 - A5 - B5 - D6 - G6 - F6 - E6 - C6 - G5 - E5 - C6 - - - . . . .',
    },
    // the Music Box Ballerina: a 3/4 waltz (oom-pah-pah), each bar two beats of the attic's clock
    waltz: {
      bpm: 135, wave: 'sine', celesta: true, sync: true, waltz: true, drum: 'k . t . t .',
      chords: 'Am E Am Am Dm Am E Am F C G C Dm Am E Am',
      lead: 'A5 - C6 - E6 - G#5 - B5 - E6 - A5 - E6 - C6 - A5 - - - . . D6 - F6 - A6 - E6 - C6 - A5 - ' +
        'B5 - G#5 - E5 - A5 - - - . . A5 - C6 - F6 - G5 - C6 - E6 - D6 - B5 - G5 - E6 - D6 - C6 - ' +
        'F6 - E6 - D6 - C6 - B5 - A5 - G#5 - B5 - E6 - A5 - - - . .',
    },
    // the Snowglobe: sleigh bells and a celesta in G, warm and slow
    snow: {
      bpm: 92, wave: 'sine', celesta: true, drum: 'k . j . s . j j',
      chords: 'G Em C D G Em C D Em C G D C D G G',
      lead: 'B5 - D6 - G6 - F#6 E6 D6 - B5 - G5 - . . C6 - E6 - G6 - E6 C6 A5 - - - F#5 - A5 - D6 - C6 B5 A5 - F#5 - D5 - . . ' +
        'G5 - B5 - D6 - B5 G5 E5 - G5 - B5 - . . C6 - B5 - A5 - G5 - E5 - G5 - A5 - - - . . . . ' +
        'E6 - D6 - B5 - D6 - E6 - G6 - E6 - D6 - C6 - B5 - A5 - C6 - E6 - D6 - C6 - A5 - ' +
        'C6 - D6 - E6 - D6 - B5 - A5 - F#5 - A5 - G5 - B5 - D6 - B5 - G5 - - - . . . .',
    },
    // Yeti Yodel: E minor over a low choir, bells on the off-beats
    yeti: {
      bpm: 126, wave: 'triangle', choir: true, drum: 'k j s j k k s j',
      chords: 'Em C G D Em C D Em',
      lead: 'E5 - G5 - B5 - E6 - D6 B5 G5 - A5 - C6 - E6 - D6 C6 A5 - B5 - D6 - F#6 - E6 D6 B5 - G5 - E5 - . . E5 . ' +
        'E6 - D6 - B5 - G5 - A5 - B5 - C6 - B5 - A5 - G5 - F#5 - A5 - B5 - - - E5 - G5 - B5 - E6 - - - . .',
    },
    // the Sun Temple: D Dorian (the bright B natural over Dm), a reedy pulse over hand drums
    sun: {
      bpm: 112, wave: 'p12', drum: 'k . t k s . t t',
      chords: 'Dm C Dm G Dm C Am Dm F C G Dm Dm C G Dm',
      lead: 'D5 - F5 - A5 - B5 A5 G5 - E5 - D5 - . . C5 - E5 - G5 - A5 G5 E5 - C5 - D5 - - - ' +
        'A5 - C6 - D6 - C6 A5 B5 - G5 - D5 - . . A5 - G5 - F5 - E5 - C5 - E5 - D5 - - - . . ' +
        'F5 - A5 - C6 - A5 F5 E5 - G5 - C6 - . . D6 - B5 - G5 - B5 D6 A5 - F5 - D5 - . . ' +
        'D6 - C6 - A5 - G5 A5 E5 - G5 - B5 - . . A5 - F5 - D5 - E5 F5 D5 - - - . . . .',
    },
    // the Riddle Sphinx: D minor, fast drums and a low choir
    sphinx: {
      bpm: 140, wave: 'p25', choir: true, drum: 'k t s t k k s t',
      chords: 'Dm Dm C Dm Bm C A Dm',
      lead: 'D5 - F5 - A5 - D6 - C6 A5 G5 - A5 - . . D6 - C6 - A5 - F5 - G5 - E5 - C5 - E5 - D5 - - - . . ' +
        'A5 - A5 - C6 - D6 - F6 - E6 D6 C6 - A5 - . . B5 - D6 - F#6 - E6 - C#6 - A5 - D6 - - - . . . .',
    },
    // the Story Library: A minor, a plucky harpsichord over pizzicato drums
    library: {
      bpm: 120, wave: 'p25', drum: 'k . h . s . h h',
      chords: 'Am E Am G C G Am E F C Dm E Am G E Am',
      lead: 'A5 - C6 - E6 - C6 A5 G#5 - B5 - E6 - . . A5 - C6 - E6 - A6 G6 F6 - E6 - D6 - B5 - ' +
        'C6 - E6 - G6 - E6 C6 B5 - D6 - G6 - . . A5 - C6 - E6 - D6 C6 B5 - G#5 - E5 - - - ' +
        'F5 - A5 - C6 - A5 F5 E5 - G5 - C6 - . . D5 - F5 - A5 - F5 D5 E5 - G#5 - B5 - . . ' +
        'A5 - E6 - C6 - A5 E5 G5 - B5 - D6 - B5 G5 G#5 - B5 - E6 - D6 B5 A5 - - - . . . .',
    },
    // the Great Bookworm: A minor, driving, the harpsichord in a hurry
    worm: {
      bpm: 150, wave: 'p25', drum: 'k h s h k k s h', drive: true,
      chords: 'Am Am F E Am Am Dm E',
      lead: 'A5 C6 E6 C6 A5 C6 E6 A6 G6 E6 C6 A5 G5 A5 C6 E6 F5 A5 C6 F6 E6 C6 A5 F5 E5 G#5 B5 E6 D6 B5 G#5 E5 ' +
        'A5 - C6 - E6 - A6 - G6 E6 C6 A5 E6 - - - D6 - F6 - A6 - F6 D6 B5 - G#5 - E5 - . .',
    },
    // the Ember Forge: E minor, a brassy saw lead over anvil hits, locked to the land's beat (the runes erupt on it)
    forge: {
      bpm: 140, wave: 'sawtooth', sync: true, drum: 'k a s a k k s a',
      chords: 'Em Em C D Em Em Am B Em G C D Am C B B',
      lead: 'E5 - G5 - B5 - G5 E5 F#5 - A5 - B5 - . . E5 - G5 - B5 - E6 - D6 B5 A5 - F#5 - D5 - . . ' +
        'G5 - B5 - D6 - B5 G5 A5 - C6 - E6 - . . B5 - D#6 - F#6 - D#6 B5 B5 - - - . . . . ' +
        'E6 - D6 - B5 - G5 E5 F#5 - G5 - A5 - . . C6 - B5 - A5 - G5 F#5 E5 - G5 - B5 - . . ' +
        'A5 - C6 - E6 - C6 A5 B5 - D#6 - F#6 - D#6 B5 E5 - G5 - B5 - E6 - - - . . . .',
    },
    // the Forge Dragonling: E minor, fast and hot, anvils on every beat
    dragon: {
      bpm: 156, wave: 'sawtooth', drum: 'k a s a k a s a', drive: true,
      chords: 'Em Em C B Em Em Am B',
      lead: 'E5 G5 B5 G5 E5 G5 B5 E6 D6 B5 G5 E5 F#5 G5 A5 B5 C6 B5 A5 G5 C6 E6 D6 C6 B5 A5 G5 F#5 D#5 F#5 B5 D#6 ' +
        'E6 - B5 - G5 - E5 - E6 D6 B5 G5 E6 - - - A5 - C6 - E6 - C6 A5 B5 - D#6 - B5 - . .',
    },
    // the Glow Deep: a glassy marimba over a slow sub, bubbles for hats (synced: the current turns on the bar)
    deep: {
      bpm: 100, wave: 'sine', sync: true, marimba: true, choir: true, drum: 'k . b . s . b .',
      chords: 'Dm Dm Bb C Dm Dm Gm A Dm F Bb C Gm Bb A A',
      lead: 'D5 . F5 . A5 . D6 . C6 . A5 . F5 . G5 . . . E5 . C5 . D5 . . . . . . . ' +
        'F5 . A5 . C6 . F6 . E6 . C6 . A5 . Bb5 . . . G5 . E5 . C#5 . . . . . . . ' +
        'A5 . D6 . F6 . D6 . C6 . A5 . C6 . F6 . D6 . Bb5 . F5 . D6 . C6 . . . E5 . . . ' +
        'D6 . Bb5 . G5 . Bb5 . A5 . E5 . C#5 . E5 . A5 . . . . . . . D5 . . . . . . .',
    },
    // the Grand Anglerfish: the same sea, faster and darker
    angler: {
      bpm: 128, wave: 'p25', drum: 'k b s b k k s b', marimba: true,
      chords: 'Dm Dm Bb A Dm Dm Gm A',
      lead: 'D5 F5 A5 D6 C6 A5 F5 A5 Bb5 A5 G5 F5 E5 C#5 E5 A5 D6 - A5 - F5 - D5 - G5 Bb5 D6 Bb5 A5 E5 C#5 E5 ' +
        'F5 - A5 - D6 - F6 - E6 D6 C6 A5 Bb5 - - - G5 - Bb5 - D6 - G6 - F6 E6 D6 C#6 A5 - - -',
    },
    // the Moon Garden: a music-box lullaby in three, a soft choir under it
    moon: {
      bpm: 108, wave: 'sine', celesta: true, bells: true, choir: true, waltz: true, drum: 'k . . t . .',
      chords: 'F Dm Bb C F Am Bb C Dm Am Bb F Gm C F F',
      lead: 'A5 - C6 - F6 - E6 - D6 - C6 - A5 - - - G5 - A5 - Bb5 - D6 - C6 - Bb5 - A5 - G5 - . . ' +
        'F5 - A5 - C6 - A5 - F6 - E6 - D6 - - - C6 - Bb5 - A5 - G5 - A5 - C6 - F5 - - - . . . . ' +
        'D6 - F6 - E6 - D6 - C6 - A5 - Bb5 - D6 - F6 - E6 - C6 - - - A5 - C6 - F6 - E6 - D6 - E6 - ' +
        'C6 - Bb5 - A5 - G5 - F5 - G5 - A5 - - - C6 - Bb5 - G5 - E5 - F5 - - - - - - - . . . .',
    },
    // the Night Bloom: the lullaby grown big, bells on every bar
    bloom: {
      bpm: 132, wave: 'p25', celesta: true, bells: true, choir: true, drum: 'k t s t k k s t',
      chords: 'Dm Bb F C Dm Bb Gm A',
      lead: 'D5 F5 A5 D6 C6 A5 F5 A5 Bb5 D6 F6 D6 C6 A5 G5 E5 F5 A5 C6 F6 E6 C6 A5 C6 D6 - C6 - A5 - G5 - ' +
        'A5 D6 F6 A6 G6 F6 E6 D6 Bb5 D6 F6 Bb6 A6 F6 D6 Bb5 G5 Bb5 D6 G6 F6 D6 Bb5 G5 A5 - C#6 - E6 - A6 -',
    },
    // the campfire between acts: a slow, warm lullaby with the fire crackling
    camp: {
      bpm: 76, wave: 'triangle', drum: 'k . . f . . f .',
      chords: 'G Em C D G Em C G',
      lead: 'D5 - G5 - B5 - A5 G5 E5 - - - . . . . C5 - E5 - G5 - E5 D5 D5 - - - . . . . ' +
        'B4 - D5 - G5 - F#5 E5 C5 - E5 - D5 - . . G5 - B5 - A5 - F#5 - G5 - - - . . . .',
    },
    // the Star Well: slow and starry
    well: {
      bpm: 104, wave: 'p12', drum: 'k . . h s . h .',
      chords: 'Em C G D Em Am Bm Em',
      lead: 'E5 - G5 - B5 - A5 G5 E5 - - - . . G5 A5 B5 - D6 - B5 - G5 - A5 - F#5 - D5 - . . ' +
        'E5 - B5 - E6 - D6 B5 C6 - A5 - E5 - . . D6 - B5 - F#5 - A5 B5 G5 - E5 - - - . .',
    },
    boss: {
      bpm: 152, wave: 'p25', drum: 'k h s h k k s h', drive: true,
      chords: 'Em C D Em Em C D Em',
      lead: 'E5 E5 G5 E5 B5 E5 A5 G5 E5 E5 G5 E5 C6 B5 A5 G5 F#5 F#5 A5 F#5 D6 C6 B5 A5 B5 - E6 - B5 - G5 - ' +
        'E6 D6 B5 G5 E6 D6 B5 G5 E6 C6 G5 E5 E6 C6 G5 E5 F#6 D6 A5 F#5 F#6 D6 A5 F#5 E6 - - - B5 - E6 -',
    },
    // the Star Casino floor: a bouncy lounge tune; and the VIP room, slower and moodier
    lounge: {
      bpm: 112, wave: 'p12', drum: 'k . h s . h k h',
      chords: 'F Dm Gm C F Dm Bb C Gm C Am Dm Bb C F F',
      lead: 'A5 - C6 - F6 - E6 D6 C6 - A5 - F5 - . . Bb5 - D6 - G6 - F6 E6 D6 - C6 - Bb5 - G5 - ' +
        'A5 C6 . F6 . C6 A5 F5 D6 - - - A5 - . . D6 - F6 - D6 Bb5 F5 - E6 - D6 - C6 - . . ' +
        'G5 Bb5 D6 Bb5 G5 - D5 - E5 G5 C6 G5 E5 - C5 - A5 C6 E6 C6 A5 - E5 - F5 A5 D6 A5 F5 - D5 - ' +
        'F6 - D6 - Bb5 - F5 - G5 - Bb5 - E6 - G6 - F6 - - - C6 - A5 - F5 - - - . . . .',
    },
    vip: {
      bpm: 96, wave: 'triangle', drum: 'k . . h s . . h',
      chords: 'Am Dm E Am F Dm E E',
      lead: 'E5 - A5 - C6 - B5 A5 F5 - A5 - D6 - C6 - B5 - G#5 - E5 - B5 - A5 - - - E5 - . . ' +
        'F5 - A5 - C6 - F6 - E6 - D6 - A5 - F5 - E5 - G#5 - B5 - D6 - C6 - B5 - G#5 - - -',
    },
  };
  for (const k in SONGS) {
    const s = SONGS[k];
    s.leadT = s.lead.split(' ');
    s.drumT = s.drum.split(' ');
    const bass = [];
    for (const c of s.chords.split(' ')) {
      const [r, f] = CHORD[c];
      if (s.waltz) bass.push(r, '.', f, '.', f, '.'); // oom-pah-pah: six steps, three beats
      else if (s.drive) bass.push(r, r, f, r, r, f, r, f);
      else if (c === 'FG' || c === 'CD') bass.push(r, '.', r, '.', f, '.', f, '.');
      else bass.push(r, '.', f, '.', r, '.', f, '.');
    }
    s.bassT = bass;
    s.len = s.leadT.length;
  }

  let song = null, pendingSong = null, step = 0, nextT = 0, timer = null;
  // A sync song keeps step s at s * dt on the shared clock (skyNow), so what foes march to is
  // what you hear; it re-anchors when the clocks drift apart (a throttled tab, a new host offset).
  const sdt = () => 60 / (song.bpm * (song.sync && typeof beatK === 'function' ? beatK() : 1)) / 2; // assist slows the beat (options.js)
  function anchor(lead) { const dt = sdt(), now = skyNow(); step = Math.ceil((now + lead) / dt); nextT = ac.currentTime + step * dt - now; }
  function schedule() {
    if (!song) return;
    const dt = sdt();
    if (song.sync) { if (Math.abs(nextT - (ac.currentTime + step * dt - skyNow())) > 0.06) anchor(0.05); }
    else if (nextT < ac.currentTime - 0.2) nextT = ac.currentTime + 0.05; // resumed after a throttled tab
    while (nextT < ac.currentTime + 0.12) {
      const i = step % song.len;
      const at = nextT - ac.currentTime;
      const n = song.leadT[i];
      if (n !== '-' && n !== '.') {
        let len = 1;
        while (song.leadT[(i + len) % song.len] === '-' && len < 8) len++;
        const f = freq(n);
        osc(song.wave, f, f, dt * len * 0.95, 0.22, at, musBus);
        if (song.marimba) osc('triangle', f * 4, f * 4, 0.035, 0.05, at, musBus); // the mallet's knock
        if (song.celesta) osc('triangle', f * 2, f * 2, dt * len * 0.6, 0.06, at, musBus); // the celesta's octave shimmer
        if (song.bells && i % 8 === 0) { osc('sine', f * 2, f * 2, 0.8, 0.09, at, musBus); osc('triangle', f * 4, f * 4, 0.2, 0.025, at, musBus); }
      }
      const b = song.bassT[i % song.bassT.length];
      if (b !== '.') { const f = freq(b); osc('triangle', f, f, dt * 0.9, 0.5, at, musBus); if (song.choir && i % 8 === 0) { osc('sine', f * 2, f * 2, dt * 8, 0.07, at, musBus); osc('sine', f * 3, f * 3, dt * 8, 0.04, at, musBus); } } // choir: a low held pad
      const d = song.drumT[i % song.drumT.length];
      if (d === 'k') { osc('triangle', 150, 45, 0.12, 0.55, at, musBus); }
      else if (d === 's') noise(0.1, 0.22, 2000, 'bandpass', at, 0, musBus);
      else if (d === 'h') noise(0.03, 0.1, 7000, 'highpass', at, 0, musBus);
      else if (d === 'o') { osc('sine', 392, 349, 0.28, 0.16, at, musBus); if (i % 32 === 0) osc('sine', 392, 330, 0.4, 0.12, at + 0.34, musBus); } // hoo, hoo-oo
      else if (d === 't') osc('triangle', 1900, 1500, 0.03, 0.16, at, musBus); // woodblock tick
      else if (d === 'T') osc('triangle', 1150, 900, 0.045, 0.16, at, musBus); // and tock
      else if (d === 'j') for (let j = 0; j < 3; j++) noise(0.025, 0.07, 9000, 'highpass', at + j * 0.03, 0, musBus); // sleigh bells
      else if (d === 'f') { noise(0.02, 0.07, 2600, 'bandpass', at, 0, musBus); if (i % 3 === 0) noise(0.015, 0.05, 4200, 'bandpass', at + 0.07, 0, musBus); } // the fire crackles
      else if (d === 'b') osc('sine', 500 + (i % 7) * 60, 1300 + (i % 5) * 90, 0.06, 0.05, at, musBus); // a bubble
      else if (d === 'c') for (let j = 0; j < 3; j++) osc('sine', 4200, 4150, 0.018, 0.025, at + j * 0.04, musBus); // a cricket
      else if (d === 'a') { osc('square', 1760, 1700, 0.05, 0.05, at, musBus); osc('triangle', 2630, 2600, 0.22, 0.05, at, musBus); osc('triangle', 3520, 3500, 0.12, 0.025, at, musBus); } // an anvil ring
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
    if (song && song.sync) anchor(had ? 0.3 : 0.05);
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
  return { unlock, sfx, local: sfx, play, stop, toggleMute, applySettings }; // local: never sent to co-op screens
})();
