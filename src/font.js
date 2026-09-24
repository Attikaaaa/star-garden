'use strict';
// 5x7 capital pixel font with Hungarian accents. Glyph box is 10 px tall:
// rows 0-1 accent, row 2 gap, rows 3-9 letter. Text y = top of the capitals.
const GLYPHS = {
  'A': '.xxx. x...x x...x xxxxx x...x x...x x...x',
  'B': 'xxxx. x...x x...x xxxx. x...x x...x xxxx.',
  'C': '.xxx. x...x x.... x.... x.... x...x .xxx.',
  'D': 'xxxx. x...x x...x x...x x...x x...x xxxx.',
  'E': 'xxxxx x.... x.... xxxx. x.... x.... xxxxx',
  'F': 'xxxxx x.... x.... xxxx. x.... x.... x....',
  'G': '.xxx. x...x x.... x.xxx x...x x...x .xxxx',
  'H': 'x...x x...x x...x xxxxx x...x x...x x...x',
  'I': 'xxx .x. .x. .x. .x. .x. xxx',
  'J': '..xxx ...x. ...x. ...x. ...x. x..x. .xx..',
  'K': 'x...x x..x. x.x.. xx... x.x.. x..x. x...x',
  'L': 'x.... x.... x.... x.... x.... x.... xxxxx',
  'M': 'x...x xx.xx x.x.x x.x.x x...x x...x x...x',
  'N': 'x...x xx..x x.x.x x..xx x...x x...x x...x',
  'O': '.xxx. x...x x...x x...x x...x x...x .xxx.',
  'P': 'xxxx. x...x x...x xxxx. x.... x.... x....',
  'Q': '.xxx. x...x x...x x...x x.x.x x..x. .xx.x',
  'R': 'xxxx. x...x x...x xxxx. x.x.. x..x. x...x',
  'S': '.xxxx x.... x.... .xxx. ....x ....x xxxx.',
  'T': 'xxxxx ..x.. ..x.. ..x.. ..x.. ..x.. ..x..',
  'U': 'x...x x...x x...x x...x x...x x...x .xxx.',
  'V': 'x...x x...x x...x x...x x...x .x.x. ..x..',
  'W': 'x...x x...x x...x x.x.x x.x.x xx.xx x...x',
  'X': 'x...x x...x .x.x. ..x.. .x.x. x...x x...x',
  'Y': 'x...x x...x .x.x. ..x.. ..x.. ..x.. ..x..',
  'Z': 'xxxxx ....x ...x. ..x.. .x... x.... xxxxx',
  '0': '.xxx. x...x x..xx x.x.x xx..x x...x .xxx.',
  '1': '.x. xx. .x. .x. .x. .x. xxx',
  '2': '.xxx. x...x ....x ...x. ..x.. .x... xxxxx',
  '3': 'xxxx. ....x ....x .xxx. ....x ....x xxxx.',
  '4': '...x. ..xx. .x.x. x..x. xxxxx ...x. ...x.',
  '5': 'xxxxx x.... xxxx. ....x ....x x...x .xxx.',
  '6': '.xxx. x.... x.... xxxx. x...x x...x .xxx.',
  '7': 'xxxxx ....x ...x. ..x.. ..x.. ..x.. ..x..',
  '8': '.xxx. x...x x...x .xxx. x...x x...x .xxx.',
  '9': '.xxx. x...x x...x .xxxx ....x ....x .xxx.',
  '.': '. . . . . . x',
  ',': '.. .. .. .. .. .x x.',
  '!': 'x x x x x . x',
  '?': '.xxx. x...x ....x ...x. ..x.. ..... ..x..',
  ':': '. x . . . x .',
  '-': '... ... ... xxx ... ... ...',
  '+': '... ... .x. xxx .x. ... ...',
  '/': '....x ....x ...x. ..x.. .x... x.... x....',
  "'": 'x x . . . . .',
  '(': '.x x. x. x. x. x. .x',
  ')': 'x. .x .x .x .x .x x.',
  '%': 'xx..x xx..x ...x. ..x.. .x... x..xx x..xx',
  '*': '... ... x.x .x. x.x ... ...',
  '<': '...x ..xx .xxx xxxx .xxx ..xx ...x',
  '>': 'x... xx.. xxx. xxxx xxx. xx.. x...',
  ' ': '... ... ... ... ... ... ...',
};
const ACCENTS = {
  'Á': ['A', 'acute'], 'É': ['E', 'acute'], 'Í': ['I', 'acute'], 'Ó': ['O', 'acute'],
  'Ö': ['O', 'uml'], 'Ő': ['O', 'dbl'], 'Ú': ['U', 'acute'], 'Ü': ['U', 'uml'], 'Ű': ['U', 'dbl'],
};
const ACCENT_ROWS = {
  acute: { 5: ['...x.', '..x..'], 3: ['..x', '.x.'] },
  uml: { 5: ['.....', '.x.x.'] },
  dbl: { 5: ['..x.x', '.x.x.'] },
};
const FONT_COLORS = 'wY0PchRl1';
const FONT_W = Object.create(null);

(function registerFont() {
  const all = Object.assign({}, GLYPHS);
  for (const ch in ACCENTS) all[ch] = ACCENTS[ch];
  for (const ch in all) {
    let rows;
    if (Array.isArray(all[ch])) {
      const base = GLYPHS[all[ch][0]].split(' ');
      rows = ACCENT_ROWS[all[ch][1]][base[0].length].concat([base[0].replace(/x/g, '.')], base);
    } else {
      const base = all[ch].split(' ');
      const blank = base[0].replace(/x/g, '.');
      rows = [blank, blank, blank].concat(base);
    }
    FONT_W[ch] = rows[0].length;
    for (const c of FONT_COLORS) {
      def('f' + c + ch, rows.map(r => r.replace(/x/g, c)));
    }
  }
})();

function textW(str) {
  let w = 0;
  for (const ch of str) w += (FONT_W[ch] || 3) + 1;
  return Math.max(0, w - 1);
}

// Rendered strings are cached as small canvases: text never costs more than one drawImage.
const _txtCache = new Map();
function _renderText(str, col, style) {
  const w = textW(str) + 2, h = 12;
  const c = document.createElement('canvas');
  c.width = Math.max(1, w); c.height = h;
  const g = c.getContext('2d');
  const put = (key, ox, oy) => {
    let x = 1 + ox;
    for (const ch of str) {
      const s = SPR['f' + key + ch];
      if (s) g.drawImage(ATLAS, s.x[0], s.y[0], s.w, s.h, x, 1 + oy, s.w, s.h);
      x += (FONT_W[ch] || 3) + 1;
    }
  };
  if (style === 2) {
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (ox || oy) put('0', ox, oy);
  } else if (style === 1) put('0', 0, 1);
  put(col, 0, 0);
  return c;
}

// style: 0 plain, 1 drop shadow, 2 outline. align: 0 left, 1 centre, 2 right.
function text(str, x, y, col, style, align) {
  str = String(str).toUpperCase();
  col = col || 'w';
  style = style === undefined ? 1 : style;
  const key = str + '\u0001' + col + style;
  let c = _txtCache.get(key);
  if (!c) {
    if (_txtCache.size > 400) _txtCache.clear();
    c = _renderText(str, col, style);
    _txtCache.set(key, c);
  }
  let dx = Math.round(x) - 1;
  if (align === 1) dx -= (c.width - 2) >> 1;
  else if (align === 2) dx -= c.width - 2;
  ctx.drawImage(c, dx, Math.round(y) - 4);
}
