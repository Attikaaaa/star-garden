'use strict';
// Wildgrove: the album, from the pause menu. Every food, fish and bug in the game (`album: 1` items) as a grid: the ones you have held in
// colour, the rest as dark shapes still to find. The pointer, the arrows or the pad pick one to read its name.
const WG_ALBUM_COLS = 12, WG_ALBUM_ROWS = 5;
let _wgAlbumList = null;
function wgAlbumList() { // raw things first (caught, picked, grown), then what is cooked or mixed from them
  if (_wgAlbumList) return _wgAlbumList;
  const all = Object.values(WGI).filter(i => i.kind === 'food' || i.id === 'fish_gold' || i.album), made = (i) => RECIPES.some(r => r.out === i.id);
  return (_wgAlbumList = all.filter(i => !made(i)).concat(all.filter(made)).map(i => i.id));
}
function wgAlbumShape(id) { // a dark silhouette of the icon for what is not found yet
  const key = 'alb_' + id; if (WGA.cache[key]) return WGA.cache[key];
  const [c, g] = wgCv(16, 16); g.drawImage(wgIcon(id), 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = PAL['0']; g.fillRect(0, 0, 16, 16);
  WGA.cache[key] = c; return c;
}
function wgDrawAlbum(ui) {
  const list = wgAlbumList(), seen = WGS.p.seen || {}, per = WG_ALBUM_COLS * WG_ALBUM_ROWS, pages = Math.ceil(list.length / per);
  const pg = wgClamp(ui.pg || 0, 0, pages - 1), n = list.filter(id => seen[id]).length, part = list.slice(pg * per, pg * per + per);
  // the arrows walk the grid a row at a time, off its edge to the buttons; the first press lands on the first picture
  const C = WG_ALBUM_COLS, last = part.length - 1, s = ui.sel; if (pressed(...K_LEFT, ...K_RIGHT)) Audio_.sfx('select');
  if (pressed(...K_DOWN, ...K_UP, ...K_LEFT, ...K_RIGHT) && s === undefined) ui.sel = 0;
  else if (s !== undefined && s <= last) {
    if (pressed(...K_DOWN)) ui.sel = s + C <= last ? s + C : last + 2;
    else if (pressed(...K_UP)) ui.sel = s >= C ? s - C : last + 2;
    else if (pressed(...K_LEFT)) ui.sel = Math.max(0, s - 1);
    else if (pressed(...K_RIGHT)) ui.sel = Math.min(last, s + 1);
  } else if (s !== undefined) { // on the buttons: < BACK >
    if (pressed(...K_UP)) ui.sel = Math.floor(last / C) * C;
    else if (pressed(...K_DOWN)) ui.sel = 0;
    else if (pressed(...K_LEFT)) ui.sel = Math.max(last + 1, s - 1);
    else if (pressed(...K_RIGHT)) ui.sel = Math.min(last + 3, s + 1);
  }
  panel(24, 8, 336, 196); wtext('ALBUM  ' + n + ' / ' + list.length, VW / 2, 14, 'Y', 3, 1);
  const x0 = VW / 2 - WG_ALBUM_COLS * 12, y0 = 28; let pick = null;
  part.forEach((id, k) => {
    const i = ui.n++, x = x0 + (k % WG_ALBUM_COLS) * 24, y = y0 + Math.floor(k / WG_ALBUM_COLS) * 24, got = seen[id];
    if (Input.mx >= x && Input.mx < x + 22 && Input.my >= y && Input.my < y + 22 && ui.moved) ui.sel = i;
    const on = ui.sel === i; if (on) pick = id;
    rect(x, y, 22, 22, '0'); rect(x + 1, y + 1, 20, 20, on ? 'y' : got ? '2' : '1'); if (!on) rect(x + 1, y + 1, 20, 1, got ? '3' : '2');
    ctx.drawImage(got ? wgIcon(id) : wgAlbumShape(id), x + 3, y + 3);
  });
  if (pick) {
    const got = seen[pick];
    wtext(got ? WGI[pick].name : '???', VW / 2, 154, got ? 'w' : 'L', 2, 1);
    if (got) { const L = wgTipLines({ id: pick, n: 1 }); wtext(L.slice(0, 2).join('  '), VW / 2, 164, 'L', 2, 1); }
    else wtext('NOT FOUND YET', VW / 2, 164, 'L', 2, 1);
  } else wtext(n === list.length ? 'EVERY ONE FOUND!' : 'FOUND ' + n + ' OF ' + list.length, VW / 2, 158, n === list.length ? 'Y' : 'L', 2, 1);
  if (wgButton(ui, '<', 40, 182, 36, { h: 14, off: pg === 0 })) { ui.pg = pg - 1; ui.sel = undefined; }
  if (wgButton(ui, 'BACK', 140, 182, 104, { h: 14 }) || pressed('Escape', 'PadB')) { ui.album = false; ui.sel = undefined; }
  if (wgButton(ui, '>', 308, 182, 36, { h: 14, off: pg >= pages - 1 })) { ui.pg = pg + 1; ui.sel = undefined; }
}
const _wgPauseAlbum = wgDrawPause;
wgDrawPause = function () {
  const ui = WGS.ui;
  if (!ui.album) return _wgPauseAlbum();
  const sel = ui.sel; dim(0.55); wgUiBegin(ui); ui.sel = sel; wgDrawAlbum(ui); wgUiEnd(ui); // the album walks its own grid
};
WG_ACH.push(['album', 'FULL PANTRY', 'FILL HALF THE ALBUM', (c) => { const L = wgAlbumList(); return L.filter(id => c.seen[id]).length * 2 >= L.length; }]);
