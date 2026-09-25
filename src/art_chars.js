'use strict';
// Character art: the hero, enemies, bosses, merchant.
// Light always comes from the top-left; outlines use '0'.

// ---------- Hero: Pip the little star wizard (16x19) ----------
(function hero() {
  const blank = '................';
  const FRONT = [
    '..........00....',
    '.........0cB0...',
    '........0cBb0...',
    '.......0cyBb0...',
    '......0cyyyb0...',
    '.....0cBByBb0...',
    '....0qPPPPPp0...',
    '.0cBBBBBBBBBBb0.',
    '.0bbbbbbbbbbbb0.',
    '.00oOOoOOoOOo00.',
    '..0os0ssss0so0..',
    '..0ks0ssss0sk0..',
    '..0kqsskkssqk0..',
    '..00qPPPPPPp00..',
    '..0scBBBBBPbs0..',
    '...0bbbbbbbb0...',
  ];
  const BACK = [
    '..........00....',
    '.........0cB0...',
    '........0cBb0...',
    '.......0cBBb0...',
    '......0cBBBb0...',
    '.....0cBBBBb0...',
    '....0qPPPPPp0...',
    '.0cBBBBBBBBBBb0.',
    '.0bbbbbbbbbbbb0.',
    '.00oOOOOOOOOo00.',
    '..0oOOOOOOOOo0..',
    '..0ooOOOOOOoo0..',
    '..0oooooooooo0..',
    '..00qPPPPPPp00..',
    '..0scBPBBBBbs0..',
    '...0bbPbbbbb0...',
  ];
  const SIDE = [
    '..000...........',
    '.0cB0...........',
    '..0cBb00........',
    '..0cBBBb00......',
    '...0cBBByb0.....',
    '...0cBByyyb0....',
    '...0qPPPyPPp0...',
    '.0cBBBBBBBBBBb0.',
    '.0bbbbbbbbbbbb0.',
    '.00oOOOOOkkkk00.',
    '..0oOOOsss0ss0..',
    '..0ooOOsss0sss0.',
    '..0oooksssqss0..',
    '..00qPPPPPPp00..',
    '...0cBBBBBsb0...',
    '...0bbbbbbbb0...',
  ];
  const LEGS = {
    idle: ['....0nn00nn0....', '.....00..00.....'],
    stepA: ['....0nn00nn0....', '....0nn0.00.....', '.....00.........'],
    stepB: ['....0nn00nn0....', '.....00.0nn0....', '.........00.....'],
    sideIdle: ['....0nn0nnn0....', '.....00.0000....'],
    sideA: ['....0nn0.0nn0...', '...0nn0...0nn0..', '....00.....00...'],
    sideB: ['.....0nnnnn0....', '.....0nn0nn0....', '......00.00.....'],
  };
  const idle = (up, legs) => [blank].concat(up, legs);
  const step = (up, legs) => up.concat(legs);
  // robe colours the player can choose (see ROBES): sprite names get '', '#1', '#2'...
  const SKINS = [null, { c: 'q', B: 'P', b: 'p', q: 'Y', P: 'y', p: 'o' }, { c: 'H', B: 'G', b: 'g' }, { c: '4', B: '3', b: '2' },
    { c: 'Y', B: 'y', b: 'o', q: 'C', P: 'c', p: 'B' }, { c: 'R', B: 'r', b: 'p', q: 'Y', P: 'y', p: 'o' }, { c: 'T', B: 't', b: 'g' }, { c: 'L', B: 'l', b: 'm' }];
  for (let k = 0; k < SKINS.length; k++) {
    const sk = k ? '#' + k : '';
    const o = { flip: true, flash: true, legend: SKINS[k] };
    const def = (name, rows, opts) => window.def(name + sk, rows, opts);
    def('hero_d0', idle(FRONT, LEGS.idle), o);
    def('hero_d1', step(FRONT, LEGS.stepA), o);
    def('hero_d2', step(FRONT, LEGS.stepB), o);
    def('hero_u0', idle(BACK, LEGS.idle), o);
    def('hero_u1', step(BACK, LEGS.stepA), o);
    def('hero_u2', step(BACK, LEGS.stepB), o);
    def('hero_s0', idle(SIDE, LEGS.sideIdle), o);
    def('hero_s1', step(SIDE, LEGS.sideA), o);
    def('hero_s2', step(SIDE, LEGS.sideB), o);
    // blink: the upper eye pixels close
    const shut = (rows, cols) => rows.map((r, i) => i === 10 ? r.split('').map((c, x) => cols.includes(x) ? 's' : c).join('') : r);
    def('hero_d0b', idle(shut(FRONT, [5, 10]), LEGS.idle), o);
    def('hero_s0b', idle(shut(SIDE, [10]), LEGS.sideIdle), o);
    // hurt: squeezed ><-eyes and an open mouth
    const hurtF = FRONT.slice(), hurtS = SIDE.slice();
    hurtF[10] = '..0o0ssssss0o0..'; hurtF[12] = '..0k0ss00ss0k0..';
    hurtS[10] = '..0oOOOss0sss0..'; hurtS[12] = '..0oookss0qs00..';
    def('hero_d0h', idle(hurtF, LEGS.idle), o);
    def('hero_s0h', idle(hurtS, LEGS.sideIdle), o);
  }
  // the other heroes are built on Pip's body (art_heroes.js)
  window.HERO_ART = { FRONT, BACK, SIDE, LEGS, SKINS };
})();

// ---------- Meme robes: whole new heads on the hero's body (skins 8+) ----------
// f / s / b: the 13 head rows seen from the front, the side (facing right) and the back.
// lg: legend for the robe and the feet; body: robe rows of its own per view (d, s, u);
// blink: [row, cols, colour] per view, drawn with the eyes shut.
const MEME_SKINS = [
  { name: 'DOGE', tag: 'Y', lg: { c: 'Y', B: 'y', b: 'o', q: 'A', P: 'a', p: 'e' },
    blink: { d: [[7, [4, 10], '0']], s: [[7, [10], '0']] },
    f: [
      '................',
      '................',
      '..00........00..',
      '.0ON0......0Nn0.',
      '.0OqN000000Nqn0.',
      '.0OOOOONNNNNnn0.',
      '.0ONANNNNNNANn0.',
      '.0NNw0NNNNw0Nn0.',
      '.0NAAAAAAAAAan0.',
      '.0NAAAA00AAAan0.',
      '..0NAA0AA0Aan0..',
      '..0nAAA00Aaen0..',
      '..0neeeeeeenn0..',
    ],
    b: [
      '................',
      '................',
      '..00........00..',
      '.0ON0......0Nn0.',
      '.0ONN000000NNn0.',
      '.0OOOOONNNNNnn0.',
      '.0ONNNNNNNNNNn0.',
      '.0NNNNNNNNNNnn0.',
      '.0NNNNNNNNNNnn0.',
      '.0NNNNNNNNNnnn0.',
      '..0NNNNNNNNnn0..',
      '..0nNNNNNNnnn0..',
      '..0nnnnnnnnnn0..',
    ],
    s: [
      '................',
      '................',
      '.....00.........',
      '....0ON0........',
      '...0OqN000000...',
      '..0OOOONNNNnn0..',
      '..0ONNNNNNANN0..',
      '..0NNNNNNNw0N0..',
      '..0NNNNNNAAAA00.',
      '..0NNNNNAAAAAa0.',
      '..0nNNNAAAAaa0..',
      '..0nnNNAAAaee0..',
      '..0nnnnnaaeee0..',
    ] },
  { name: 'TROLL', tag: 'w', lg: null,
    blink: { d: [[6, [5, 10], 'L']], s: [[6, [10], 'L']] },
    f: [
      '................',
      '................',
      '....00000000....',
      '..00wwwwwwLL00..',
      '.0wwwwwwwLLLLl0.',
      '.0wLL000L000Ll0.',
      '.0wL0w0LL0w0Ll0.',
      '.0LLLLLLLLLLLl0.',
      '.0L0000000000l0.',
      '.00wwlwwwwlww00.',
      '..00wlwwwwlw00..',
      '...0l000000l0...',
      '....0llllll0....',
    ],
    b: [
      '................',
      '................',
      '....00000000....',
      '..00wwwwwwLL00..',
      '.0wwwwwwwLLLLl0.',
      '.0wLLLLLLLLLLl0.',
      '.0wLLLLLLLLLLl0.',
      '.0LLLLLLLLLLll0.',
      '.0LLLLLLLLLlll0.',
      '.00LLLLLLLlll00.',
      '..00lLLLLlll00..',
      '...0lllllllm0...',
      '....0mmmmmm0....',
    ],
    s: [
      '................',
      '................',
      '....00000000....',
      '..00wwwwwwLL00..',
      '.0wwwwwwwLLLLl0.',
      '.0wLLLLLL000Ll0.',
      '.0wLLLLLL0w0Ll0.',
      '.0LLLLLLLLLLLl0.',
      '.0LLLLL000000l0.',
      '.00LLL0wwlwww00.',
      '..00LLL0wlww00..',
      '...0lll0000l0...',
      '....0llllll0....',
    ] },
  { name: 'SUS', tag: 'R', lg: { n: 'r' }, blink: null,
    f: [
      '................',
      '................',
      '................',
      '................',
      '.....000000.....',
      '....0RRRRRr0....',
      '...0RRRRRRrr0...',
      '..0RRR0000000...',
      '..0RR0wCCCCcc0..',
      '..0RR0cccccBB0..',
      '..0RRr0000000...',
      '..0RRRRrrrrrr0..',
      '..0Rrrrrrrrrp0..',
    ],
    b: [
      '................',
      '................',
      '................',
      '................',
      '.....000000.....',
      '....0RRRRRr0....',
      '...0RRRRRRrr0...',
      '..0RRRRRRRRrr0..',
      '..0RR000000rr0..',
      '..0R0Rrrrrp0r0..',
      '..0R0rrrrrp0r0..',
      '..0R0rrrrpp0r0..',
      '..0R0pppppp0p0..',
    ],
    s: [
      '................',
      '................',
      '................',
      '................',
      '......000000....',
      '.....0RRRRRr0...',
      '....0RRRRRRrr0..',
      '..000RRR0000000.',
      '.0Rr0RR0wCCCCc0.',
      '.0rr0RR0ccccBB0.',
      '.0rr0RRr0000000.',
      '.0rp0RRRRrrrr0..',
      '.0pp0Rrrrrrrp0..',
    ],
    body: {
      d: ['..0rrrrrrrrrp0..', '..0rrrrrrrrpp0..', '...0pppppppp0...'],
      u: ['..0rr000000rp0..', '..0rrrrrrrrpp0..', '...0pppppppp0...'],
      s: ['..00rrrrrrrrp0..', '...0rrrrrrrpp0..', '...0pppppppp0...'],
    } },
  { name: 'CHAD', tag: 'Y', lg: { c: 'l', B: 'm', b: 'd', q: 's', P: 's', p: 'k' },
    blink: { d: [[7, [5, 10], '0']], s: [[7, [10], '0']] },
    f: [
      '................',
      '......00000.....',
      '....000NNNNN0...',
      '...0NNNNNNNNn0..',
      '...0NNnnnnnnn0..',
      '...0nsssssssn0..',
      '...0s00sss00k0..',
      '...0sw0sssw0k0..',
      '..0ksssskssskk0.',
      '..0ssssnnnsskk0.',
      '..0kksssssskkk0.',
      '...0kkkk0kkkk0..',
      '....000000000...',
    ],
    b: [
      '................',
      '......00000.....',
      '....000NNNNN0...',
      '...0NNNNNNNNn0..',
      '...0NNNNNNNnn0..',
      '...0NNNNNNNnn0..',
      '...0NNNNNNnnn0..',
      '...0nNNNNNnnn0..',
      '..0knnnnnnnnkk0.',
      '..0ksssssssskk0.',
      '..0kssssssskkk0.',
      '...0kkkkkkkkk0..',
      '....000000000...',
    ],
    s: [
      '................',
      '......00000.....',
      '....000NNNNN0...',
      '...0NNNNNNNNn0..',
      '...0NNNnnnnnn0..',
      '...0NNNnnssss0..',
      '...0NNnnss00s0..',
      '...0Nnnkssw0s0..',
      '...0nnkkssssss0.',
      '...0nkssssssns0.',
      '...0kksssssssk0.',
      '....0kkkkkkkkk0.',
      '.....000000000..',
    ] },
  { name: 'STONKS', tag: 'c', lg: { n: '1' },
    blink: { d: [[7, [5, 10], 'k']], s: [[7, [11], 'k']] },
    f: [
      '................',
      '................',
      '.....000000.....',
      '....0AAssss0....',
      '...0AAsssssk0...',
      '..0Assssssssk0..',
      '..0sssssssssk0..',
      '..0ss0ssss0sk0..',
      '..0sssskksssk0..',
      '..0ss0ssss0sk0..',
      '...0ss0000sk0...',
      '...0sssssskk0...',
      '....0kkkkkk0....',
    ],
    b: [
      '................',
      '................',
      '.....000000.....',
      '....0AAssss0....',
      '...0AAsssssk0...',
      '..0Assssssssk0..',
      '..0sssssssssk0..',
      '..0sssssssskk0..',
      '..0sssssssskk0..',
      '..0ssssssskkk0..',
      '...0sssssskk0...',
      '...0ssssskkk0...',
      '....0kkkkkk0....',
    ],
    s: [
      '................',
      '................',
      '.....000000.....',
      '....0AAssss0....',
      '...0AAsssssk0...',
      '..0Assssssssk0..',
      '..0ssssssssss0..',
      '..0ssskssss0s0..',
      '..0sskksssssss0.',
      '..0sssssss00s0..',
      '...0ssssssskk0..',
      '...0kssssskk0...',
      '....0kkkkkk0....',
    ],
    body: {
      d: ['..00BBwrrwbb00..', '..0sBBBrrBbbs0..', '...0bbbrbbbb0...'],
      u: ['..00BBBBBBbb00..', '..0sBBBBBbbbs0..', '...0bbbbbbbb0...'],
      s: ['..00BBBBBwrb00..', '...0BBBBBsbb0...', '...0bbbbbbbb0...'],
    } },
  { name: 'GRUMPY', tag: 'l', lg: { c: 'l', B: 'm', b: 'd', q: 'L', P: 'l', p: 'm' },
    blink: { d: [[8, [4, 5, 10, 11], 'd']], s: [[8, [9, 10], 'd']] },
    f: [
      '................',
      '................',
      '..00........00..',
      '.0md0......0dd0.',
      '.0mdd000000ddd0.',
      '.0mmmmmmmmmmdd0.',
      '.0mddddmmddddd0.',
      '.0m0000mm0000d0.',
      '.0LdB0dLLd0Bdl0.',
      '.0LLLLLPPLLLLl0.',
      '..0LLL0000LLl0..',
      '..0LL0wwww0ll0..',
      '..0llLLLLLlll0..',
    ],
    b: [
      '................',
      '................',
      '..00........00..',
      '.0md0......0dd0.',
      '.0mdd000000ddd0.',
      '.0mmmmmmmmmmdd0.',
      '.0mmmmmmmmmmdd0.',
      '.0mmmmmmmmmddd0.',
      '.0mmmmmmmmmddd0.',
      '.0mmmmmmmmdddd0.',
      '..0mmmmmmmddd0..',
      '..0lmmmmmmddl0..',
      '..0llllllllll0..',
    ],
    s: [
      '................',
      '................',
      '....00..........',
      '...0md0.........',
      '..0mdd0000000...',
      '..0mmmmmmmmmm0..',
      '..0mmmmmmdddd0..',
      '..0mmmmmd0000L0.',
      '..0mmmmmdB0dLl0.',
      '..0dmmmLLLLLLP0.',
      '..0ddmLLLLL00l0.',
      '..0dddLLLL0ll0..',
      '..0ddddllllll0..',
    ] },
  { name: 'NYAN', tag: 'P', lg: { n: 'd' },
    blink: { d: [[7, [4, 5, 10, 11], 'm']], s: [[7, [7, 8, 11, 12], 'm']] },
    f: [
      '................',
      '................',
      '..00........00..',
      '.0lm0......0md0.',
      '.0lqm000000mqd0.',
      '.0llmmmmmmmmmd0.',
      '.0lmmmmmmmmmmd0.',
      '.0mmw0mmmmw0md0.',
      '.0mm00mmmm00md0.',
      '.0mPmm0mm0mmPd0.',
      '..0mmmm00mmmd0..',
      '..0dmmmmmmmdd0..',
      '...0dddddddd0...',
    ],
    b: [
      '................',
      '................',
      '..00........00..',
      '.0lm0......0md0.',
      '.0lmm000000mdd0.',
      '.0llmmmmmmmmmd0.',
      '.0lmmmmmmmmmmd0.',
      '.0mmmmmmmmmmmd0.',
      '.0mmmmmmmmmmdd0.',
      '.0mmmmmmmmmmdd0.',
      '..0mmmmmmmmdd0..',
      '..0dmmmmmmddd0..',
      '...0dddddddd0...',
    ],
    s: [
      '................',
      '................',
      '...00......00...',
      '..0lm0....0md0..',
      '..0lqm0000mqd0..',
      '.0llmmmmmmmmmd0.',
      '.0lmmmmmmmmmmd0.',
      '.0mmmmmw0mmw0d0.',
      '.0mmmmm00mm00d0.',
      '.0mmmmPm0mm0mP0.',
      '..0dmmmmm00mm0..',
      '..0ddmmmmmmmd0..',
      '...0dddddddd0...',
    ],
    body: {
      d: ['..00aqqpqqqe00..', '..0maqqqqpqem0..', '...0aeeeeeee0...'],
      u: ['..00aaaaaaae00..', '..0maaaaaaeem0..', '...0eeeeeeee0...'],
      s: ['..00aqqpqqqe00..', '...0aqqqqqme0...', '...0aeeeeeee0...'],
    } },
  { name: 'BUNNY', tag: 'P', lg: { c: 'q', B: 'P', b: 'p', q: 'L', P: 'l', p: 'm', n: 'l' },
    blink: { d: [[8, [4, 5, 10, 11], 'L']], s: [[8, [10, 11], 'L']] },
    f: [
      '...00......00...',
      '..0wL0....0Ll0..',
      '..0wq0....0ql0..',
      '..0wq0....0ql0..',
      '..0wq0....0ql0..',
      '..0wLL0000LLl0..',
      '.0wLLLLLLLLLLl0.',
      '.0wLLLLLLLLLll0.',
      '.0LLw0LLLLw0Ll0.',
      '.0LL00LLLL00Ll0.',
      '.0LqLLLPPLLLql0.',
      '..0LLL0ww0Lll0..',
      '...0llllllll0...',
    ],
    b: [
      '...00......00...',
      '..0wL0....0Ll0..',
      '..0wL0....0Ll0..',
      '..0wL0....0Ll0..',
      '..0wL0....0Ll0..',
      '..0wLL0000LLl0..',
      '.0wLLLLLLLLLLl0.',
      '.0wLLLLLLLLLll0.',
      '.0LLLLLLLLLLll0.',
      '.0LLLLLLLLLLll0.',
      '.0LLLLLLLLLlll0.',
      '..0lLLLLLLlll0..',
      '...0llllllll0...',
    ],
    s: [
      '....00.00.......',
      '...0wL0Ll0......',
      '...0wq0ql0......',
      '...0wq0ql0......',
      '...0wq0ql0......',
      '..0wLLLLLl0000..',
      '.0wLLLLLLLLLLl0.',
      '.0wLLLLLLLLLLl0.',
      '.0LLLLLLLLw0LL0.',
      '.0LLLLLLLL00LL0.',
      '.0lLLLLLLLLqLP0.',
      '..0llLLLLLL0w0..',
      '...0lllllllll0..',
    ],
    // a cotton tail on the back
    body: {
      d: ['..00qPPPPPPp00..', '..0scBBBBBPbs0..', '...0bbbbbbbb0...'],
      u: ['..00qPPPPPPp00..', '..0scBBwLBBbs0..', '...0bbBLlbbb0...'],
      s: ['..00qPPPPPPp00..', '..0wLBBBBBsb0...', '...0lbbbbbbb0...'],
    } },
  // wet brown fringe, rosy cheeks, a small smile, black zip hoodie with a white tick
  { name: 'FRINGE', tag: 'h', lg: { n: 'b' },
    blink: { d: [[8, [4, 5, 10, 11], 's']], s: [[8, [11, 12], 's']] },
    f: [
      '................',
      '.....00.000.....',
      '....0nN0NNn00...',
      '...0nNNNNNNnu0..',
      '..0nNNnNNNNnuu0.',
      '..0nNnNNnNNnnu0.',
      '..0unsnNsnnsnu0.',
      '.0kunssnssnsuk0.',
      '.0ksw0ssssw0sk0.',
      '.0ks00ssss00sk0.',
      '.0kqssssssssqk0.',
      '..0ksss00sssk0..',
      '..0xXxkkkkxXx0..',
    ],
    b: [
      '................',
      '.....00.000.....',
      '....0nN0NNn00...',
      '...0nNNNNNNnu0..',
      '..0nNNnNNNNnuu0.',
      '..0nNNNNNNNnnu0.',
      '..0nNnNNNnNnnu0.',
      '.0knnNnnnNnnuk0.',
      '.0knnnnnnnnnuk0.',
      '..0unnnnnnnuu0..',
      '..0uunnnnnuuu0..',
      '...0kssssssk0...',
      '..0xXxkkkkxXx0..',
    ],
    s: [
      '................',
      '....00.000......',
      '...0nN0NNn00....',
      '..0nNNNNNNNn0...',
      '..0nNNNNNNNNn0..',
      '.0nNNNNNNNnNn0..',
      '.0unNNNNnsnsn0..',
      '.0unnNNksssnns0.',
      '.0uunnkssssw0s0.',
      '.0uunnkssss00s0.',
      '.0uuunksssqssss0',
      '..0uuksssss0s0..',
      '...0Xxkkkkkkx0..',
    ],
    body: {
      d: ['..00Xxxlxxwx00..', '..0sXxxlxxxxs0..', '...0xxxlxxxx0...'],
      u: ['..00Xxxxxxxx00..', '..0sXxxxxxxxs0..', '...0xxxxxxxx0...'],
      s: ['..00Xxxxxxwx00..', '...0Xxxxxxsx0...', '...0xxxxxxxx0...'],
    } },
  // short dark-blond fringe, grey-blue eyes, a faint moustache, grey hoodie open over a black tee
  { name: 'ZIPPER', tag: 'l', lg: { n: 'b' },
    blink: { d: [[8, [4, 5, 10, 11], 's']], s: [[8, [10, 11], 's']] },
    f: [
      '................',
      '................',
      '.....000000.....',
      '....0aaeeeeN0...',
      '...0aeeeeeeeN0..',
      '..0aeeaeeeeeNN0.',
      '..0eeeeeeeeeNN0.',
      '.0NeseesseeesN0.',
      '.0ksc0ssssc0sk0.',
      '.0ks00ssss00sk0.',
      '.0kssssksssssk0.',
      '..0ksseeeessk0..',
      '..0Lks0000skL0..',
    ],
    b: [
      '................',
      '................',
      '.....000000.....',
      '....0aaeeeeN0...',
      '...0aeeeeeeeN0..',
      '..0aeeaeeeeeNN0.',
      '..0eeeeeeeeeNN0.',
      '.0NeeeeeeeeeNN0.',
      '.0kNeeeeeeeeNk0.',
      '.0kNNeeeeeeNNk0.',
      '..0kNNNNNNNNk0..',
      '...0kssssssk0...',
      '..0LllllllllL0..',
    ],
    s: [
      '................',
      '................',
      '....000000......',
      '...0aeeeeee0....',
      '..0aeeeeeeeN0...',
      '.0aeeeeeeeeeN0..',
      '.0eeeeeeeeesss0.',
      '.0NeeeeeNsesss0.',
      '.0NNeeksssc0ss0.',
      '.0NNeeksss00sss0',
      '.0NNNekssseeess0',
      '..0NNNkssss00s0.',
      '...0Llkssssk0...',
    ],
    body: {
      d: ['..00Llxxxxlm00..', '..0sLlxxxxlms0..', '...0lmxxxxmm0...'],
      u: ['..00Lllllllm00..', '..0sLllllllms0..', '...0lllllmmm0...'],
      s: ['..00Lllllxlm00..', '...0Lllllsxm0...', '...0lllllxmm0...'],
    } },
  // big messy dark hair, thick brows, a squinting grin, moustache, black tee, gold chain, khakis
  { name: 'GRIN', tag: 'R', lg: { n: 'e' },
    blink: null,
    f: [
      '....0..00.0..0..',
      '...0u00nu0u00u0.',
      '..0unuunuuNuuun0',
      '.0uuNnuuNnuunuu0',
      '.0unuuuNuuuuNnu0',
      '.0uuuuuuuuuuuuu0',
      '.0uusnsssnssuu0.',
      '..0suussssuus0..',
      '..0s00ssss00s0..',
      '..0qssskksssq0..',
      '..0kssnnnnssk0..',
      '..0ks0wwww0sk0..',
      '...0ks0000sk0...',
    ],
    b: [
      '....0..00.0..0..',
      '...0u00nu0u00u0.',
      '..0unuunuuNuuun0',
      '.0uuNnuuNnuunuu0',
      '.0unuuuNuuuuNnu0',
      '.0uuuuuuuuuuuuu0',
      '.0uuuuuuuuuuuu0.',
      '.0uuuuuuuuuuuu0.',
      '..0uuuuuuuuuu0..',
      '..0uuuuuuuuuu0..',
      '..0kuuuuuuuuk0..',
      '...0kssssssk0...',
      '...0kssssssk0...',
    ],
    s: [
      '.....0..00.0....',
      '....0u00nu0u0...',
      '...0unuunuuNuu0.',
      '..0uuNnuuNnuunu0',
      '.0unuuuNuuuuNnu0',
      '.0uuuuuuuuuuuuu0',
      '.0uuuuuuusnsuu0.',
      '.0uuuuuksssuus0.',
      '.0uuuuukss00ss0.',
      '.0uuuukssqsssss0',
      '.0uuuukssnnnns0.',
      '..0uuksss0www0..',
      '...0kksss0000...',
    ],
    body: {
      d: ['..00xxyssyxx00..', '..0sxxxyyxxxs0..', '...0xxxxxxxx0...'],
      u: ['..00xxxxxxxx00..', '..0sxxxxxxxxs0..', '...0xxxxxxxx0...'],
      s: ['..00xxxyxxxx00..', '...0xxxxxxsx0...', '...0xxxxxxxx0...'],
    } },
];

(function memeHeroes() {
  const BODY = { d: ['..00qPPPPPPp00..', '..0scBBBBBPbs0..', '...0bbbbbbbb0...'],
    u: ['..00qPPPPPPp00..', '..0scBPBBBBbs0..', '...0bbPbbbbb0...'],
    s: ['..00qPPPPPPp00..', '...0cBBBBBsb0...', '...0bbbbbbbb0...'] };
  const LEGS = {
    idle: ['....0nn00nn0....', '.....00..00.....'],
    stepA: ['....0nn00nn0....', '....0nn0.00.....', '.....00.........'],
    stepB: ['....0nn00nn0....', '.....00.0nn0....', '.........00.....'],
    sideIdle: ['....0nn0nnn0....', '.....00.0000....'],
    sideA: ['....0nn0.0nn0...', '...0nn0...0nn0..', '....00.....00...'],
    sideB: ['.....0nnnnn0....', '.....0nn0nn0....', '......00.00.....'],
  };
  const blank = '................';
  // the legend only touches the body and feet, so a head's colours stay as drawn
  const paint = (rows, lg) => lg ? rows.map(r => r.split('').map(c => lg[c] || c).join('')) : rows;
  const shut = (rows, bl) => bl ? rows.map((r, y) => {
    const hit = bl.filter(b => b[0] === y);
    return hit.length ? r.split('').map((c, x) => { const b = hit.find(h => h[1].includes(x)); return b ? b[2] : c; }).join('') : r;
  }) : rows;
  MEME_SKINS.forEach((m, i) => {
    const sk = '#' + (8 + i), o = { flip: true, flash: true };
    const body = m.body || BODY, bl = m.blink || {};
    const F = m.f.concat(paint(body.d, m.lg)), B = m.b.concat(paint(body.u, m.lg)), Sd = m.s.concat(paint(body.s, m.lg));
    const idle = (u, l) => [blank].concat(u, paint(l, m.lg)), step = (u, l) => u.concat(paint(l, m.lg));
    const d = (n, rows) => def(n + sk, rows, o);
    d('hero_d0', idle(F, LEGS.idle)); d('hero_d1', step(F, LEGS.stepA)); d('hero_d2', step(F, LEGS.stepB));
    d('hero_u0', idle(B, LEGS.idle)); d('hero_u1', step(B, LEGS.stepA)); d('hero_u2', step(B, LEGS.stepB));
    d('hero_s0', idle(Sd, LEGS.sideIdle)); d('hero_s1', step(Sd, LEGS.sideA)); d('hero_s2', step(Sd, LEGS.sideB));
    d('hero_d0b', idle(shut(F, bl.d), LEGS.idle)); d('hero_s0b', idle(shut(Sd, bl.s), LEGS.sideIdle));
    d('hero_d0h', idle(shut(F, bl.d), LEGS.idle)); d('hero_s0h', idle(shut(Sd, bl.s), LEGS.sideIdle));
  });
})();

// ---------- Enemies (authored in their base colours; variants use legends) ----------
(function enemies() {
  const o = { flip: true, flash: true, glow: true };
  // Slime: idle / squash / stretch. Base green; recoloured per land.
  const SLIME = {
    idle: `
      .....000000.....
      ...00hhhhhh00...
      ..0hHHhhhhhhG0..
      .0hHwHhhhhhhhG0.
      .0hHHhhhhhhhGG0.
      .0hhh0hhhh0hGG0.
      0hhhh0hhhh0hGGg0
      0hhhqhh00hhqGgg0
      0GGhhhhhhhhhGgg0
      0gGGGGGGGGGGggg0
      .0gggggggggggg0.
      ..000000000000..`,
    squash: `
      ....00000000....
      ..00hhhhhhhh00..
      .0hHHhhhhhhhhG0.
      0hHwHhhhhhhhhGG0
      0hhh0hhhhhh0hGg0
      0hhh0hhhhhh0GGg0
      0hhqhhh00hhhqgg0
      0GGhhhhhhhhhhgg0
      0gGGGGGGGGGGGgg0
      .00000000000000.`,
    stretch: `
      ......0000......
      .....0hhhh0.....
      ....0hHhhhG0....
      ...0hHwHhhhG0...
      ...0hHHhhhhG0...
      ...0hhhhhhhG0...
      ...0h0hhhh0G0...
      ...0h0hhhh0G0...
      ...0qhh00hqG0...
      ...0hhhhhhGg0...
      ...0GhhhhhGg0...
      ..0GGGGGGGGgg0..
      ..0gggggggggg0..
      ...0000000000...`,
    mini: `
      ...000000...
      .00hhhhhG00.
      0hHwhhhhhGG0
      0hh0hh0hGGg0
      0hhhq00qGgg0
      0gGGGGGGGgg0
      .0000000000.`,
  };
  const SLIME_COL = {
    gold: { g: 'o', G: 'y', h: 'Y', H: 'w', q: 'O' },
    green: null,
    blue: { g: 'b', G: 'B', h: 'c', H: 'C' },
    pink: { g: 'p', G: 'P', h: 'q', H: 'w', q: 'R' },
    pumpkin: { g: 'n', G: 'o', h: 'O', H: 'Y', q: 'y' }, // Halloween week
  };
  for (const c in SLIME_COL) for (const f in SLIME) def('slime_' + c + '_' + f, SLIME[f], { flash: true, glow: true, legend: SLIME_COL[c] });

  // Bee (faces right): two wing frames.
  const BEE_BODY = [
    '....0000000.....',
    '...0Yyy1yy1yy0..',
    '..0Yyyy1yy1yyy0.',
    '.0yyyyy1yy1w0y0.',
    '0oyyyyy1yy100y0.',
    '.0oyyyy1yy1yRy0.',
    '..0oooo1oo1oo0..',
    '...0000000000...',
  ];
  def('bee_0', [
    '.....000.000....',
    '....0CCw0CCw0...',
    '....0CCC0CCC0...',
    '.....000.000....',
  ].concat(BEE_BODY), o);
  def('bee_1', [
    '................',
    '..000......000..',
    '.0CCw0....0CCw0.',
    '..0CC000000CC0..',
  ].concat(BEE_BODY), o);

  // Mushroom: idle / charge (cap swells) / shoot (mouth open).
  def('shroom_0', `
    ................
    .....000000.....
    ...00qqPPPP00...
    ..0qwwqPPwwPp0..
    .0PqwwPPPwwPPp0.
    .0PPqPPPPPPPPp0.
    0PPPPPwwPPPPppp0
    0pPPPPwwPPPPppp0
    .0pppppppppppp0.
    ..000000000000..
    ....0AAAAAa0....
    ....0A0AA0a0....
    ....0A0AA0a0....
    ....0qAAAAq0....
    ...0aAAAAAaa0...
    ...0000000000...`, o);
  def('shroom_1', `
    .....000000.....
    ...00qqPPPP00...
    ..0qwwqPPwwPp0..
    .0PqwwPPPwwPPp0.
    0PPPqPPPPPPPPpp0
    0PPPPPPwwPPPPpp0
    0pPPPPPwwPPPPpp0
    0ppPPPPPPPPPppp0
    .0pppppppppppp0.
    ..000000000000..
    ....0AAAAAa0....
    ....0A0AA0a0....
    ....0A0AA0a0....
    ....0qAAAAq0....
    ...0aAAAAAaa0...
    ...0000000000...`, o);
  def('shroom_2', `
    ................
    ................
    .....000000.....
    ...00qqPPPP00...
    ..0qwwqPPwwPp0..
    .0PqwwPPPwwPPp0.
    0PPPPPwwPPPPppp0
    0pPPPPwwPPPPppp0
    .0pppppppppppp0.
    ..000000000000..
    ....0A0AA0a0....
    ....0A0AA0a0....
    ....0qA00Aq0....
    ....0AA00Aa0....
    ...0aAAAAAaa0...
    ...0000000000...`, o);

  // Crab: symmetric; claws up / claws down (legs alternate).
  const CRAB_BODY = (legA) => [
    '...0R000000R0...',
    '..0RwRRRRRRRr0..',
    '.0RwRRRRRRRRrr0.',
    '.0RRRRRRRRRRrr0.',
    (legA ? '0.0' : '.00') + 'RRR0RR0Rrr' + (legA ? '0.0' : '00.'),
    (legA ? '.00' : '0.0') + 'rRRR00RRrr' + (legA ? '00.' : '0.0'),
    (legA ? '0..' : '.0.') + '0rrrrrrrr0' + (legA ? '..0' : '.0.'),
    '....00000000....',
  ];
  def('crab_0', [
    '00.00......00.00',
    '0R0R0......0R0R0',
    '0RRR000..000RRR0',
    '.0RR0w0..0w0RR0.',
    '..0R000..000R0..',
  ].concat(CRAB_BODY(true)), o);
  def('crab_1', [
    '................',
    '.000........000.',
    '0RRR000..000RRR0',
    '0RwR0w0..0w0RwR0',
    '.000000..000000.',
  ].concat(CRAB_BODY(false)), o);

  // Flower turret: idle / charge (squint) / shoot (mouth wide).
  const FLOWER = [
    '....00.00.00....',
    '...0qP0qP0Pp0...',
    '..0qPPPPPPPPp0..',
    '.0qPP000000Ppp0.',
    '.0PP0Yyyyyy0pp0.',
    '0qPP0y0yy0y0Ppp0',
    '0PPP0y0yy0o0ppp0',
    '0PPP0yyyyyo0ppp0',
    '.0Pp0yo00oo0pp0.',
    '.0PPp000000ppp0.',
    '..0pPpppppppp0..',
    '...0pp0gg0pp0...',
    '......0Gg0......',
    '..000.0Gg0.000..',
    '.0hGG00Gg00GGg0.',
    '..000000000000..',
  ];
  const edit = (rows, ed) => rows.map((r, i) => ed[i] || r);
  def('flower_0', FLOWER, o);
  def('flower_1', edit(FLOWER, { 5: '0qPP0yyyyyy0Ppp0', 6: '0PPP0y0yy0o0ppp0', 8: '.0Pp0yoooooo0pp0'.slice(0, 16) }), o);
  def('flower_2', edit(FLOWER, { 7: '0PPP0yy00yo0ppp0', 8: '.0Pp0y0000o0pp0.' }), o);

  // Wisp: flickering spirit, three frames.
  const WISP_BODY = [
    '..0CwwwwwwCcc0..',
    '..0Cww0ww0wCc0..',
    '.0Cwww0ww0wwCc0.',
    '.0Cwqwwwwwwqwc0.',
    '.0cCwwwwwwwwCc0.',
    '.0ccCwwwwwwCcc0.',
    '..0ccCCCCCCcc0..',
  ];
  def('wisp_0', [
    '.......00.......',
    '......0Cc0......',
    '.....0CwCc0.....',
    '....0CwwCcc0....',
    '...0CwwwwCcc0...',
  ].concat(WISP_BODY, [
    '..0c0cc00cc0c0..',
    '...0.00..00.0...',
    '................',
  ]), o);
  def('wisp_1', [
    '......00........',
    '.....0Cc0.......',
    '.....0CwCc0.....',
    '....0CwwCcc0....',
    '...0CwwwwCcc0...',
  ].concat(WISP_BODY, [
    '..00cc0cc0cc00..',
    '....00.00.00....',
    '................',
  ]), o);
  def('wisp_2', [
    '........00......',
    '.......0cC0.....',
    '.....0CwCc0.....',
    '....0CwwCcc0....',
    '...0CwwwwCcc0...',
  ].concat(WISP_BODY, [
    '..0cc0cccc0cc0..',
    '...00.0000.00...',
    '................',
  ]), o);
})();

// ---------- Bosses ----------
// Every boss has the same frame set (see AGENTS.md, Art Bible): <t>_0/_1 idle, _move, _tell,
// _atk, the same five with a 'p' prefix for the angry phase look (_p0 ...), _stag, _die.
// Shared 4x4 eyes: pupil with a top-left glint; brows lean in when angry.
const BOSS_EYE = {
  calm: '.00.\n0w00\n0000\n.00.',
  madL: '00..\n.000\n0w00\n.00.',
  madR: '..00\n000.\n0w00\n.00.',
  daze: '.00.\n0..0\n0.00\n.00.',
  dead: '0..0\n.00.\n.00.\n0..0',
  shut: '....\n0..0\n.00.\n....',
  squintL: '00..\n..00\n00..\n....',
  squintR: '..00\n00..\n..00\n....',
};
// stamp a pair of eyes (left eye at x, right eye at x + gap); kind 'mad' picks the brows
function bossEyes(r, x, y, gap, kind) {
  const two = kind === 'mad' || kind === 'squint';
  r = stamp(r, x, y, BOSS_EYE[two ? kind + 'L' : kind]);
  return stamp(r, x + gap, y, BOSS_EYE[two ? kind + 'R' : kind]);
}
function bossFrames(t, make, o) {
  const F = { 0: {}, 1: { b: 1 }, move: { m: 1 }, tell: { tl: 1, face: 'squint' }, atk: { a: 1 } };
  for (const k in F) {
    def(t + '_' + k, make(Object.assign({ face: 'calm' }, F[k])), o);
    def(t + '_p' + k, make(Object.assign({ face: 'mad' }, F[k], { p: 1 })), o);
  }
  def(t + '_stag', make({ face: 'daze', st: 1, p: 1 }), o);
  def(t + '_die', make({ face: 'dead', d: 1, p: 1 }), o);
}
(function bosses() {
  const o = { flash: true };
  // 1. King Slime (32x32): squash and stretch, the crown slips when he is angry.
  const CROWN = `
    .0....00....0.
    0Y0..0YY0..0y0
    0YY00YyyY00yy0
    0YyyYyyyyyyyo0
    0yPyyyPPyyyPo0
    0yyyyyyyyyyoo0
    00000000000000`;
  const MOUTH = {
    calm: '0....0\n.0000.', squint: '.0000.\n0wwww0\n.0000.', mad: '.0000.\n0wqqw0\n.0000.', daze: '.00...\n0qq0..\n.00...', dead: '.0000.\n0....0',
  };
  const king = (f) => {
    // body shape per pose: [rx, ry, cy]
    const [rx, ry, cy] = f.m ? [12, 15.5, 19.5] : f.tl ? [16, 11, 23] : f.a ? [16, 10, 24] : f.b ? [16, 13.5, 20.5] : f.d ? [16, 9, 25] : [15.5, 14, 20];
    let r = sculpt(32, 32, [{ e: [16, cy, rx, ry], ramp: 'gGhH', cut: 30 }]);
    r = rim(r, { g: 'T' });
    const ey = Math.round(cy - ry * 0.25) - 1, gap = f.m ? 9 : 11, ex = 16 - Math.floor(gap / 2) - 2;
    r = bossEyes(r, ex, ey, gap, f.face);
    // cheeks: pink, red when furious
    const ck = f.p ? 'rr' : 'qq';
    r = stamp(r, ex - 2, ey + 5, ck);
    r = stamp(r, ex + gap + 4, ey + 5, ck);
    r = stamp(r, 13, ey + 5, f.a && !f.p ? '.0000.\n0wqqw0\n.0000.' : MOUTH[f.face]);
    r = stamp(r, Math.round(16 - rx * 0.55), Math.round(cy - ry * 0.6), 'ww.\nw..');
    // the crown sits on top; angry: knocked 2px sideways, stagger: sliding off, death: on the ground
    const top = Math.round(cy - ry) - 5;
    const cx = f.d ? 18 : f.st ? 14 : f.p ? 11 : 9, cyy = f.d ? 25 : f.st ? top + 2 : top;
    return stamp(r, cx, Math.max(0, cyy), CROWN);
  };
  bossFrames('king', king, o);

  // 2. Giant Crab (40x30): claws up to tell, snapped down to attack; a Big Star in the shell.
  const crab = (f) => {
    const clawY = f.tl ? -3 : f.a ? 2 : f.st || f.d ? 4 : f.b ? 1 : 0, sy = f.d ? 2 : f.st ? 1 : 0;
    let r = sculpt(40, 30, [
      { e: [20, 18.5 + sy, 14.5, 9 - sy], ramp: 'nrRA' },
      { e: [8.5, 16 + clawY * 0.5, 3.5, 2.5], ramp: 'nrRA', hi: false },
      { e: [31.5, 16 + clawY * 0.5, 3.5, 2.5], ramp: 'nrRA', hi: false },
      { e: [5.5, 9 + clawY, 5.5, 5.5], ramp: 'nrRA' },
      { e: [34.5, 9 + clawY, 5.5, 5.5], ramp: 'nrRA' },
    ]);
    r = rim(r, { n: 'p' });
    // pincer notches: open when telling, shut on the snap
    if (!f.a) {
      r = stamp(r, 4, 3 + clawY, '_0\n_0\n0.');
      r = stamp(r, 34, 3 + clawY, '0_\n0_\n.0');
    }
    // eye stalks droop when staggered or beaten
    const ey = 4 + sy * 2, EYE = {
      calm: '.00.\n0ww0\n0w00\n.00.', mad: '0000\n0w00\n0ww0\n.00.', squint: '....\n0000\n0ww0\n.00.',
      daze: '.00.\n0ww0\n0ww0\n.00.', dead: '.00.\n0w00\n00w0\n.00.',
    }[f.face];
    r = stamp(r, 13, ey, EYE);
    r = stamp(r, 23, ey, EYE);
    r = stamp(r, 14, ey + 4, '00\n00');
    r = stamp(r, 24, ey + 4, '00\n00');
    // the Big Star shows through the shell once it is angry
    if (f.p && !f.d) r = stamp(r, 18, 12 + sy, '.y.\nyYy\n.y.');
    r = stamp(r, 17, 19 + sy, f.face === 'mad' || f.a ? '000000\n0wwww0\n.0000.' : f.face === 'squint' ? '.0000.\n0wwww0\n.0000.'
      : f.face === 'daze' ? '..00..\n.0qq0.\n..00..' : f.d ? '.0000.\n0....0' : '0....0\n.0000.');
    r = stamp(r, 12, 18 + sy, f.p ? 'rr' : 'qq');
    r = stamp(r, 26, 18 + sy, f.p ? 'rr' : 'qq');
    // legs
    const L = f.m || f.b ? ['0.0.0', '.0.0.'] : ['.0.0.', '0.0.0'];
    r = stamp(r, 6, 25 + sy, L.join('\n'));
    return stamp(r, 29, 25 + sy, (f.m ? L.slice().reverse() : L).join('\n'));
  };
  bossFrames('bcrab', crab, o);

  // 3. Crystal Golem (32x32): arms up to tell, slammed down to attack; its crystals turn
  // pink and its heart gem cracks when it is angry.
  const GEYES = {
    calm: '.00..00.\n0cw00wc0\n.00..00.', mad: '0000.0000\n.0cw0wc0.\n..00.00..', squint: '.00..00.\n0ww00ww0\n.00..00.',
    daze: '.00..00.\n0dd00dd0\n.00..00.', dead: '0.0..0.0\n.0....0.\n0.0..0.0',
  };
  const golem = (f) => {
    const armY = f.tl ? -4 : f.a ? 3 : f.st || f.d ? 2 : f.b ? 1 : 0, sy = f.d ? 3 : f.st ? 1 : 0;
    const lA = f.m ? -1 : 0, lB = f.m ? 1 : 0;
    let r = sculpt(32, 32, [
      { r: [8, 24 + lA, 7, 8 - lA, 2], ramp: 'dmlL', hi: false },
      { r: [17, 24 + lB, 7, 8 - lB, 2], ramp: 'dmlL', hi: false },
      { r: [5, 11 + sy, 22, 16 - sy, 5], ramp: 'dmlL' },
      { r: [10, 3 + sy, 12, 11, 4], ramp: 'dmlL' },
      { r: [0, 12 + armY, 7, 13, 3], ramp: 'dmlL' },
      { r: [25, 12 + armY, 7, 13, 3], ramp: 'dmlL' },
    ]);
    r = rim(r, { d: '2' });
    // crystals: cyan, pink when angry, dull when beaten
    const k = f.d ? 'dmd' : f.p ? 'qPp' : 'Ccb', tint = (a) => a.replace(/C/g, k[0]).replace(/c/g, k[1]).replace(/b/g, k[2]);
    const crystal = tint('.0.\n0C0\n0cb\n0c0'), tall = tint('.0.\n0C0\n0cb\n0cb\n0c0');
    r = stamp(r, 1, 9 + armY, crystal);
    r = stamp(r, 3, 8 + armY, tall);
    r = stamp(r, 26, 8 + armY, tall);
    r = stamp(r, 28, 9 + armY, crystal);
    r = stamp(r, 13, sy, tint('.0..0.\n0C00C0\n0cbCcb\n0cb0cb'));
    r = stamp(r, 12, 7 + sy, GEYES[f.face]);
    // heart gem in the chest (cracked when angry)
    r = stamp(r, 13, 16 + sy, f.d ? '.0000.\n0d0mm0\n0mm0d0\n.0dd0.\n..00..' : f.p ? `
      .0000.
      0qw0P0
      0P0Pp0
      .0Pp0.
      ..00..` : `
      .0000.
      0qwPP0
      0qPPp0
      .0Pp0.
      ..00..`);
    return r;
  };
  bossFrames('golem', golem, o);
})();

// ---------- Land-specific newcomers ----------
(function newcomers() {
  const o = { flip: true, flash: true, glow: true };
  // Jellyfish (beach): relaxed / contracted pulse.
  def('jelly_0', `
    ................
    .....000000.....
    ...00qwwqqq00...
    ..0qwwqqqqqqP0..
    .0qwqqqqqqqqPP0.
    .0qqq0qqqq0qPP0.
    .0qqq0qqqq0qPP0.
    .0qRqqq00qqRPP0.
    0PPPPPPPPPPPPpp0
    0PP0PP0PP0PP0pp0
    .00q00q00q00q00.
    ..q..q..q..q....
    ...q..q..q..q...
    ..3..3..3..3....
    ................
    ................`, o);
  def('jelly_1', `
    ......0000......
    ....00qwwq00....
    ...0qwwqqqqP0...
    ...0qwqqqqqP0...
    ..0qqq0qq0qPP0..
    ..0qqq0qq0qPP0..
    ..0qRqq00qRPP0..
    ..0PPPPPPPPPp0..
    ...0PP0PP0Pp0...
    ....00q00q00....
    .....q..q..q....
    .....q..q..q....
    .....3..3..3....
    ......3....3....
    ................
    ................`, o);
  // Bat (crystal cave): wings up / level / down, drawn in colour and auto-outlined.
  const bat = (art) => autoOutline(parseArt('bat', art));
  def('bat_0', bat(`
    ................
    .P...2....2...P.
    .PP..22..22..PP.
    .pPP.322222.PPp.
    ..pPP3w22w2PPp..
    ...pP322222Pp...
    ....p12ww21p....
    .....111111.....
    ......1..1......
    ................`), o);
  def('bat_1', bat(`
    ................
    .....2....2.....
    .....22..22.....
    .....322222.....
    .PPPP3w22w2PPPP.
    ..ppP322222Ppp..
    ....p12ww21p....
    .....111111.....
    ......1..1......
    ................`), o);
  def('bat_2', bat(`
    ................
    .....2....2.....
    .....22..22.....
    .....322222.....
    ...PP3w22w2PP...
    ..pPP322222PPp..
    .pPp.12ww21.pPp.
    .Pp..111111..pP.
    .p....1..1....p.
    ................`), o);
})();
