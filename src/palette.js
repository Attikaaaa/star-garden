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
const THEME_ORDER = ['meadow', 'beach', 'crystal', 'well'];
