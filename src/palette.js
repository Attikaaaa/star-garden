'use strict';
// The one and only palette. Every pixel in the game comes from here.
// Keys are single characters used in the sprite strings (see art*.js).
const PAL = {
  '0': '#2b1a47', // outline (deep indigo, never pure black)
  '1': '#4b2f82', // deep purple
  '2': '#7a4fd0', // purple
  '3': '#a97ff5', // light purple
  '4': '#dcc6ff', // lavender
  'w': '#ffffff',
  'b': '#2f4fc4', // dark blue
  'B': '#4f8cff', // blue
  'c': '#6fd6ff', // cyan
  'C': '#c9f5ff', // pale cyan
  't': '#1f9e9a', // teal
  'T': '#3fd6b8', // aqua
  'g': '#1f8f5a', // dark green
  'G': '#3cc45a', // green
  'h': '#8be35a', // light green
  'H': '#d4f77a', // lime
  'p': '#cf2f7e', // magenta
  'P': '#ff5fae', // pink
  'q': '#ffaad8', // light pink
  'r': '#e8334d', // red
  'R': '#ff7b6b', // coral
  'o': '#f0762a', // orange
  'O': '#ffad47', // light orange
  'y': '#ffd43b', // yellow
  'Y': '#fff4a3', // pale yellow
  'k': '#ec9a72', // skin shade
  's': '#ffc9a0', // skin
  'n': '#a8503e', // rust
  'N': '#dd8450', // tan
  'e': '#eab064', // sand shade
  'a': '#f8cd76', // sand
  'A': '#ffe8b0', // pale sand
  'd': '#6b6aa8', // stone dark
  'm': '#9796d6', // stone
  'l': '#c9c8f2', // stone light
  'L': '#f0efff', // near white
  'u': '#5c3629', // dark brown (hair)
  'x': '#363049', // charcoal (black clothes)
  'X': '#4f4868', // charcoal light
  'v': '#6a2a63', // plum (the casino's carpet and velvet)
  'V': '#8e3a7e', // light plum
  'z': '#15694a', // deep felt (card and roulette tables)
};

// Semi-transparent shade used for drop shadows under everything that stands.
const SHADOW = 'rgba(43,26,71,0.32)';

// Tile slot legend per land. Tile art (art_world.js) uses these slot chars:
// 1-6 floor (dark, base, light, accentA, accentB, accentC)
// 7-9 wall cap (dark, base, light)   a-c wall face (dark, base, light)
// i-j wall face accents              e-h pit (deep, base, light, sparkle)
const THEMES = {
  meadow: {
    name: 'BLOOM MEADOW',
    '1': 'G', '2': 'h', '3': 'H', '4': 'w', '5': 'y', '6': 'P',
    '7': 'g', '8': 'G', '9': 'h',
    'a': 'n', 'b': 'N', 'c': 'O', 'i': 'g', 'j': 'G',
    'e': 'b', 'f': 'B', 'g': 'c', 'h': 'C',
  },
  beach: {
    name: 'SUNNY SHORE',
    '1': 'e', '2': 'a', '3': 'A', '4': 'q', '5': 'P', '6': 'o',
    '7': 't', '8': 'T', '9': 'C',
    'a': 'P', 'b': 'q', 'c': 'w', 'i': 'T', 'j': 'C',
    'e': 't', 'f': 'T', 'g': 'C', 'h': 'w',
  },
  crystal: {
    name: 'CRYSTAL CAVE',
    '1': 'm', '2': 'l', '3': 'L', '4': 'c', '5': 'C', '6': 'q',
    '7': '2', '8': '3', '9': '4',
    'a': '1', 'b': '2', 'c': '3', 'i': 'c', 'j': 'C',
    'e': '0', 'f': '1', 'g': '2', 'h': 'Y',
  },
};
// The Star Well: the hidden fourth land (a night sky under your feet).
THEMES.well = {
  name: 'THE STAR WELL',
  '1': '1', '2': '2', '3': '3', '4': 'Y', '5': 'w', '6': 'c',
  '7': '1', '8': '2', '9': '3',
  'a': '1', 'b': '2', 'c': '4', 'i': 'Y', 'j': 'C',
  'e': '0', 'f': '1', 'g': '2', 'h': 'Y',
};
// Cloud Steps: a floor of soft clouds over an open sky, with sunstone slabs that hold (the
// clouds and slabs are painted by THEMES.cloud.paint in lands.js). Its pits are the sky itself,
// its walls cloud banks on sunstone bricks.
THEMES.cloud = {
  name: 'CLOUD STEPS',
  '1': 'l', '2': 'L', '3': 'w', '4': 'Y', '5': 'y', '6': 'q',
  '7': 'l', '8': 'L', '9': 'w',
  'a': 'e', 'b': 'a', 'c': 'A', 'i': 'y', 'j': 'Y',
  'e': 'C', 'f': 'c', 'g': 'C', 'h': 'w',
};
// Lantern Woods: a dusk forest of teal moss under plum trees, lit by lanterns (the darkness
// itself is LAND_MECH.lantern's light mask, see fx.js). Its pits are a slow night creek.
THEMES.lantern = {
  name: 'LANTERN WOODS',
  '1': 't', '2': 'g', '3': 'G', '4': 'O', '5': 'q', '6': 'Y',
  '7': 'g', '8': 't', '9': 'T',
  'a': 'v', 'b': 'V', 'c': 'P', 'i': 'O', 'j': 'y',
  'e': '0', 'f': 'b', 'g': 'B', 'h': 'O',
};
// Toy Attic: warm floorboards under a rug, walls of wallpaper over a skirting board, letter
// blocks for rocks (the floor itself is painted by THEMES.toy.paint in toy.js). Its pits are
// gaps in the boards.
THEMES.toy = {
  name: 'TOY ATTIC',
  '1': 'n', '2': 'N', '3': 'e', '4': 'r', '5': 'y', '6': 'B',
  '7': 'u', '8': 'n', '9': 'N',
  'a': 'e', 'b': 'a', 'c': 'A', 'i': 'r', 'j': 'R',
  'e': '0', 'f': 'u', 'g': 'n', 'h': 'O',
};
// Snowglobe: fresh snow on the floor, ice-brick walls under a snow cap, frozen blue water in the
// pits (and slippery ice, T_ICE, from the layouts). The glass of the globe shows in the margins.
THEMES.snow = {
  name: 'SNOWGLOBE',
  '1': 'l', '2': 'L', '3': 'w', '4': 'c', '5': 'q', '6': 'C',
  '7': 'C', '8': 'L', '9': 'w',
  'a': 'b', 'b': 'B', 'c': 'c', 'i': 'C', 'j': 'w',
  'e': 'b', 'f': 'B', 'g': 'c', 'h': 'w',
};
// Sun Temple: warm sandstone slabs, walls with a turquoise frieze, oasis water in the pits (and
// quicksand, T_QSAND, from the layouts; its mirrors and plates are drawn by sun.js).
THEMES.sun = {
  name: 'SUN TEMPLE',
  '1': 'e', '2': 'a', '3': 'A', '4': 'T', '5': 'o', '6': 'y',
  '7': 'N', '8': 'a', '9': 'A',
  'a': 'n', 'b': 'N', 'c': 'T', 'i': 'y', 'j': 'Y',
  'e': 't', 'f': 'T', 'g': 'C', 'h': 'w',
};
// Story Library: parchment floors, violet bookshelves in the walls, ink in the pits (and ink
// puddles and turning pages, library.js).
THEMES.library = {
  name: 'STORY LIBRARY',
  '1': 'A', '2': 'a', '3': 'A', '4': 'e', '5': 'q', '6': 'A',
  '7': '1', '8': '2', '9': '3',
  'a': '1', 'b': '2', 'c': '3', 'i': 'y', 'j': 'Y',
  'e': '0', 'f': '1', 'g': '2', 'h': '3',
};
// Ember Forge: plum iron plates with runes cut in them, cherry brick walls under a dark iron cap,
// molten metal in the pits (the runes' heat, belts and barrels are forge.js).
THEMES.forge = {
  name: 'EMBER FORGE',
  '1': 'v', '2': 'V', '3': 'p', '4': 'O', '5': 'y', '6': 'T',
  '7': 'x', '8': 'X', '9': 'd',
  'a': 'n', 'b': 'r', 'c': 'R', 'i': 'o', 'j': 'y',
  'e': 'r', 'f': 'o', 'g': 'O', 'h': 'Y',
};
// Glow Deep: a dark blue sea floor, coral rock walls with pink anemones, a trench of black water
THEMES.deep = {
  name: 'GLOW DEEP',
  '1': '0', '2': '1', '3': 'b', '4': 'T', '5': 'P', '6': 'H',
  '7': '0', '8': '1', '9': '2',
  'a': '1', 'b': '2', 'c': '3', 'i': 'P', 'j': 'q',
  'e': '0', 'f': '1', 'g': '2', 'h': 'T',
};
// Moon Garden: a lavender lawn under the night, silver moon-rock walls, gold moonflowers, a pit of stars
THEMES.moon = {
  name: 'MOON GARDEN',
  '1': '1', '2': '2', '3': '3', '4': 'Y', '5': 'y', '6': 'C',
  '7': 'd', '8': 'm', '9': 'l',
  'a': 'd', 'b': 'm', 'c': 'l', 'i': 'y', 'j': 'Y',
  'e': '0', 'f': '1', 'g': '1', 'h': 'Y',
};
const THEME_ORDER = ['meadow', 'beach', 'crystal', 'cloud', 'well', 'lantern', 'toy', 'snow', 'sun', 'library', 'forge', 'deep', 'moon'];
