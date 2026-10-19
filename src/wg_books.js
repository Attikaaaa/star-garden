'use strict';
// Wildgrove: a bookshelf of little tales. USE a bookshelf (one built, or one in a village house) to read the tale it has
// out (the tile's meta, turned by the tile's hash so shelves start at different tales; friends who read the same shelf
// read the same tale); closing the book puts the next one out. Eight short tales from the frog's
// shelf, each a paragraph that wrapText fits to the page in any language. The BOOKWORM star for reading all eight.
const WG_TALES = [ // the title, an icon for the page's corner, the tale
  ['THE SLEEPY FOX', 'berry', 'A LITTLE FOX FOUND A WARM STONE IN THE SUN AND CURLED UP ON IT. A BEE BUZZED BY. A LEAF FELL. THE FOX DID NOT MIND AT ALL. SOME DAYS ARE FOR ADVENTURES. THIS ONE WAS FOR NAPS.'],
  ['THE LOST STAR', 'crystal', 'ONE NIGHT A SMALL STAR SLIPPED AND FELL INTO THE POND. SPLASH! THE FISH GATHERED ROUND, AMAZED. A KIND HERON LIFTED IT OUT, AND A KITE CARRIED IT BACK UP HIGH. NOW IT WINKS AT THE POND EVERY NIGHT.'],
  ['THE BIGGEST PUMPKIN', 'pumpkin', 'MILO GREW A PUMPKIN SO BIG THAT IT WOULD NOT FIT THROUGH ANY DOOR IN THE VILLAGE. SO EVERYONE CAME TO IT INSTEAD, WITH SPOONS AND SMILES. IT WAS THE BEST SOUP OF THE AUTUMN.'],
  ['THE SNOW RABBIT', 'ice_shard', 'IN WINTER A WHITE RABBIT HID SO WELL IN THE SNOW THAT EVEN ITS FRIENDS COULD NOT FIND IT. SO IT KNITTED A RED SCARF. NOW EVERYONE WAVES HELLO, AND IT IS NEVER LONELY.'],
  ['THE TEA PARTY', 'tea_leaf', 'THE MOUSE, THE OWL AND THE BEAR HAD TEA UNDER THE OLD OAK. THE CUPS DID NOT MATCH. THE CAKE WAS A LITTLE BURNT. NOBODY CARED. THEY TALKED AND LAUGHED UNTIL THE STARS CAME OUT.'],
  ['THE LITTLE LANTERN', 'lantern', 'AN OLD LANTERN SAT BY THE SEA. IT WAS SMALL AND A BIT DENTED, BUT EVERY NIGHT IT SHONE AS BRIGHT AS IT COULD. ONE NIGHT A LOST BOAT SAW IT AND CAME SAFELY HOME.'],
  ['THE SEED THAT WAITED', 'seed_sun', 'A TINY SEED SLEPT ALL WINTER. THE OTHER SEEDS SPROUTED FIRST, AND IT WORRIED THAT IT WAS TOO SLOW. BUT WHEN SUMMER CAME, IT GREW INTO THE TALLEST SUNFLOWER OF ALL. EVERYTHING HAS ITS OWN TIME.'],
  ['THE FROG AND THE HATS', 'feather', 'THE FROG HAD A HAT FOR RAIN, A HAT FOR SUN, A HAT FOR TEA AND ONE JUST FOR THURSDAYS. ONE DAY THE WIND TOOK THEM ALL. THE FROG ONLY LAUGHED: NOW THE CLOUDS ARE WEARING HATS TOO.'],
];
(function () {
  OBJ[O_ID.bookshelf].book = 1; // the bookshelf every home and village house already has
  WG_ACH.push(['tales', 'BOOKWORM', 'READ ALL EIGHT TALES', (c) => ((c.st.tales | 0) & 255) === 255]);
})();
const _wgUseBooks = wgUse;
wgUse = function (tx, ty) {
  const w = WGS.world, dim = WGS.dim, id = wgObjAt(w, dim, tx, ty), o = id && OBJ[id];
  if (!o || !o.book) return _wgUseBooks(tx, ty);
  const m = wgMetaAt(w, dim, tx, ty) % WG_TALES.length, n = (m + hash(tx, ty, 77)) % WG_TALES.length; // shelves start at different tales
  const st = w.meta.stats || (w.meta.stats = { kills: 0, far: 0 });
  st.tales = (st.tales | 0) | (1 << n);
  WGS.tale = { n, m, tx, ty, dim, t0: WGS.t }; WGS.scr = 'tale'; WGS.ui = {}; wgSfx('pickup');
  return true;
};
function wgTaleClose() { // the next tale goes out on the shelf, for whoever reads it next
  const T = WGS.tale, w = WGS.world; WGS.tale = null; WGS.scr = 'play';
  if (T && w && T.dim === WGS.dim && OBJ[wgObjAt(w, T.dim, T.tx, T.ty)] && OBJ[wgObjAt(w, T.dim, T.tx, T.ty)].book) wgSetObj(w, T.dim, T.tx, T.ty, wgObjAt(w, T.dim, T.tx, T.ty), (T.m + 1) % WG_TALES.length);
}
const _wgUpdBooks = updateWG;
updateWG = function (dt) {
  _wgUpdBooks(dt);
  if (WGS.scr !== 'tale' || !WGS.world) return;
  if (wgHostLive()) wgHostWorld(dt); else wgUpdateWorldBg(dt);
  if (!WGS.tale || WGS.t > WGS.tale.t0 && pressed('Escape', 'PadB', wgKey('use'))) wgTaleClose(); // not on the press that opened it
};
const _wgDrawBooks = drawWG;
drawWG = function () {
  _wgDrawBooks();
  if (WGS.scr === 'tale' && WGS.world && WGS.tale) wgDrawTale();
};
function wgDrawTale() { // an open storybook: a cloth cover, a cream page, the title, the tale, a little picture in the corner
  const T = WG_TALES[WGS.tale.n], x = VW / 2 - 122, y = 22, w = 244, h = 170, ui = WGS.ui;
  dim(0.45);
  rect(x, y, w, h, '0'); rect(x + 1, y + 1, w - 2, h - 2, 'p'); rect(x + 1, y + 1, w - 2, 1, 'P'); // the cover
  rect(x + 5, y + 5, w - 10, h - 10, 'e'); rect(x + 6, y + 6, w - 12, h - 12, 'A'); rect(x + 6, y + 6, w - 12, 1, 'w'); // the page
  rect(x + w - 34, y + 10, 22, 22, 'a'); ctx.drawImage(wgIcon(T[1]), x + w - 31, y + 13);
  wtext(T[0], x + 16, y + 18, '1', 0);
  rect(x + 16, y + 30, textW(T[0], 0), 1, 'e');
  wrapText(T[2], w - 40).forEach((s, i) => wtext(s, x + 16, y + 42 + i * 12, '0', 0));
  wtext((WGS.tale.n + 1) + ' / ' + WG_TALES.length, x + w - 14, y + h - 16, '1', 0, 2);
  wgUiBegin(ui);
  if (wgButton(ui, 'THE END', VW / 2 - 52, y + h - 34, 104)) wgTaleClose();
  wgUiEnd(ui);
}
const _wgTipBooks = wgTipLines;
wgTipLines = function (s) {
  const L = _wgTipBooks(s);
  if (s.id === 'bookshelf') L.push('USE IT TO READ A TALE', 'EIGHT TALES TO READ');
  return L;
};
