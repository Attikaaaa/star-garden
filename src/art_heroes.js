'use strict';
// The other heroes, built on Pip's body: a new hat (drawn in colour, then outlined), their
// own hair and skin colours, and the same robe colours as Pip (see ROBES).
(function heroes() {
  const { FRONT, BACK, SIDE, LEGS, SKINS } = HERO_ART, blank = '................';
  // rows 0-8 are the hat; the rest (face, collar, robe) is Pip's, recoloured
  const HATS = {
    luma: {
      front: ['...........33...', '..........3321..', '.........3321...', '........33221...', '.......3Y3221...', '......3YY32221..', '.....qPPPPPPp...', '.33333333333322.', '.22222222222221.'],
      back: ['...........33...', '..........3321..', '.........3321...', '........33221...', '.......333221...', '......33332221..', '.....qPPPPPPp...', '.33333333333322.', '.22222222222221.'],
      side: ['..33............', '..332...........', '...3322.........', '...33222........', '....3Y3221......', '....3YY32221....', '....qPPPPPPp....', '.33333333333322.', '.22222222222221.'],
      colors: { o: 'l', O: 'L' },
    },
    coral: {
      front: ['.......T........', '.......TT.......', '......TTTt......', '.....TTTTtt.....', '....TTCTTTtt....', '...TTCCTTTTtt...', '...TTqwqTTTtt...', '.TTTTTTTTTTTTtt.', '.tttttttttttttt.'],
      back: ['.......T........', '.......TT.......', '......TTTt......', '.....TTTTtt.....', '....TTTTTTtt....', '...TTTTTTTTtt...', '...TTTTTTTTtt...', '.TTTTTTTTTTTTtt.', '.tttttttttttttt.'],
      side: ['................', '...T............', '...TT...........', '...TTTt.........', '....TTTTtt......', '....TCTTTTtt....', '....TqwqTTTt....', '.TTTTTTTTTTTTtt.', '.tttttttttttttt.'],
      colors: { o: 'c', O: 'C' },
    },
    bramble: {
      front: ['................', '...hhh....hhh...', '..hHw1h..hw1Hh..', '..hhhhh..hhhhh..', '...LLLLLLLLLL...', '..LLllllllllLm..', '..LlqPPPPPPplm..', '.LLLLLLLLLLLLmm.', '.mmmmmmmmmmmmmm.'],
      back: ['................', '...hhh....hhh...', '..hHhhh..hhhHh..', '..hhhhh..hhhhh..', '...LLLLLLLLLL...', '..LLllllllllLm..', '..LlqPPPPPPplm..', '.LLLLLLLLLLLLmm.', '.mmmmmmmmmmmmmm.'],
      side: ['................', '.....hhh........', '....hHw1h.......', '....hhhhh.......', '...LLLLLLLL.....', '..LLlllllllm....', '..LlqPPPPPplm...', '.LLLLLLLLLLLLmm.', '.mmmmmmmmmmmmmm.'],
      colors: { o: 'g', O: 'G', s: 'h', k: 'G' },
    },
  };
  const build = (hat, body, colors) => autoOutline(hat.concat(body.slice(9).map(r => r.split('').map(c => colors[c] || c).join(''))));
  for (const id in HATS) {
    const H = HATS[id];
    const F = build(H.front, FRONT, H.colors), B = build(H.back, BACK, H.colors), Sd = build(H.side, SIDE, H.colors);
    const idle = (up, legs) => [blank].concat(up, legs);
    const step = (up, legs) => up.concat(legs);
    const shut = (rows, cols, c) => rows.map((r, i) => (i === 10 ? r.split('').map((ch, x) => (cols.includes(x) ? c : ch)).join('') : r));
    const skin = H.colors.s || 's';
    const hurtF = F.slice(), hurtS = Sd.slice();
    const rec = (row) => row.split('').map(c => H.colors[c] || c).join('');
    hurtF[10] = rec('..0o0ssssss0o0..'); hurtF[12] = rec('..0k0ss00ss0k0..');
    hurtS[10] = rec('..0oOOOss0sss0..'); hurtS[12] = rec('..0oookss0qs00..');
    for (let k = 0; k < SKINS.length; k++) {
      const sk = k ? '#' + k : '', o = { flip: true, flash: true, legend: SKINS[k] };
      const d = (name, rows) => def(id + '_' + name + sk, rows, o);
      d('d0', idle(F, LEGS.idle)); d('d1', step(F, LEGS.stepA)); d('d2', step(F, LEGS.stepB));
      d('u0', idle(B, LEGS.idle)); d('u1', step(B, LEGS.stepA)); d('u2', step(B, LEGS.stepB));
      d('s0', idle(Sd, LEGS.sideIdle)); d('s1', step(Sd, LEGS.sideA)); d('s2', step(Sd, LEGS.sideB));
      d('d0b', idle(shut(F, [5, 10], skin), LEGS.idle)); d('s0b', idle(shut(Sd, [10], skin), LEGS.sideIdle));
      d('d0h', idle(hurtF, LEGS.idle)); d('s0h', idle(hurtS, LEGS.sideIdle));
    }
  }
})();
