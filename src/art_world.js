'use strict';
// World art: land tiles (themed via slot legends), doors, obstacles, pickups, shots.

// ---------- Themed tiles (16x16). Slots: see THEMES in palette.js ----------
defT('floor_0', `
  2222222222222222
  2222222222222222
  2222222222222222
  2223222222222222
  2221232222222222
  2231212232222222
  2221112212322222
  2222222221122222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222223222
  2222222222221222
  2222222222222222
  2222222222222222`);
defT('floor_1', `
  2222222222222222
  2222222222222222
  2222222222222222
  2223222222222222
  2221222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222322222
  2222222222123222
  2222232223121222
  2222212322111222
  2222221122222222
  2222222222222222
  2222222222222222`);
defT('floor_2', `
  2222222222222222
  2222222222222222
  2222422222222222
  2224542222222222
  2222422222222222
  2222122222226222
  2222222222265622
  2222222222226222
  2222222222221222
  2222222222222222
  2222222222222222
  2222222422222222
  2222224542222222
  2222222422222222
  2222222122222222
  2222222222222222`);
defT('floor_3', `
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222223322222
  2222222231132222
  2222222221122222
  2222222222222222
  2222222222222222
  2233222222222222
  2311322222222222
  2211222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222`);
defT('floor_4', `
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222232222
  2222222222212222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222
  2222222222222222`);
defT('floor_5', `
  2222222222222222
  2232222222222222
  2212322222322222
  2312122222123222
  2211122223121222
  2222222222111222
  2222222222222222
  2222232222222232
  2222212322222212
  2222221122222222
  2222222222232222
  2232222222212322
  2212322222312122
  2221122222211122
  2222222222222222
  2222222222222222`);
// The floor tile at a cell. Detail grows in patches: two offset 2x2-cell hash grids add up to a
// lushness that is high in a few spots (clumps, flowers) and low in others (bare ground, pebbles),
// so the floor reads calm instead of evenly speckled. Hashed from the room seed: every screen agrees.
function floorTile(c, r, seed) {
  const lush = hash(c >> 1, r >> 1, seed ^ 0x5bd1) % 8 + hash((c + 1) >> 1, (r + 1) >> 1, seed ^ 0x1b87) % 8;
  const h = hash(c, r, seed) % 100;
  if (lush > 10) return h < 45 ? 'floor_2' : 'floor_5';   // about 12% detail tiles in all (screenshots: 22% speckles, 7% looks bare)
  if (lush < 4) return h < 15 ? 'floor_3' : 'floor_4';
  return h < 40 ? 'floor_0' : h < 75 ? 'floor_1' : 'floor_4';
}
defT('cap', `
  8889999888888887
  8899999988888877
  8888888888888877
  7888888878888877
  7788888777888777
  7777777777777777
  8888888788999988
  8888887789999998
  8888887788888888
  8888877778888888
  8778777777788877
  7777777777777777
  9998888888889999
  9999888888899999
  8888888888888888
  8888888778888888`);
// The top wall's face. Each land has its own masonry, top rim (the cap spilling over as hedge,
// foam, stalactites, cloud or moss) and corner post: f0 / f2 are two plain tiles that share
// their course and seam heights, f1 an accent, post the 4px column at both ends of the wall
// (lit from the left on both sides). Lands without an entry use the plain brick below.
const FACE_BRICK = `
  0000000000000000
  cccccccccccccccc
  bcbbbbbabcbbbbba
  bbbbbbbabbbbbbba
  bbbbbbbabbbbbbba
  aaaaaaaaaaaaaaaa
  bbbabcbbbbbbbabc
  bbbabbbbbbbbbabb
  bbbabbbbbbbbbabb
  aaaaaaaaaaaaaaaa
  bcbbbbbabcbbbbba
  bbbbbbbabbbbbbba
  bbbbbbbabbbbbbba
  aaaaaaaaaaaaaaaa
  aaaaaaaaaaaaaaaa
  0000000000000000`;
const FACE_VINE = `
  0000000000000000
  cciicccccccccccc
  bijibbbabcbbbbba
  bbjibbbabbbbbbba
  bbibbbbabbbbbbba
  aajaaaaaaaaaaaaa
  bbbibcbbbbbbbabc
  bbbjbbbbbbbbbabb
  bbbabbbbbbbbbabb
  aaaaaaaaaaaaaaaa
  bcbbbbbabcbbbbba
  bbbbbbbabbbbbbba
  bbbbbbbabbbbbbba
  aaaaaaaaaaaaaaaa
  aaaaaaaaaaaaaaaa
  0000000000000000`;
const WALLS = {
  meadow: {
    f0: `
      9989998899899989
      8878807888788078
      00770a0007700a00
      aa00abaaa00aabaa
      cbaabbbacaabbbba
      cbbbbbbacbbbbbba
      aaaaaaaaaaaaaaaa
      bbbaccbbbbbaccbb
      bbbacbbbbbbacbbb
      bbbacbbbbbbacbbb
      aaaaaaaaaaaaaaaa
      ccbbbbbaccbbbbba
      cbbbbbbacbbbbbba
      cbbbbbbacbbbbbba
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    f2: `
      9989998899899989
      0878887800788870
      a0077700aa07000a
      baa000aabba0aaab
      bbbaaabbbbbacbbb
      bbbacbbbbbbacbbb
      aaaaaaaaaaaaaaaa
      ccbbbbbaccbbbbba
      cbbbbbbacbbbbbba
      cbbbbbbacbbbbbba
      aaaaaaaaaaaaaaaa
      bbbaccbbbbbaccbb
      bjbacbbbbjbacbbj
      jijacbbbjijijbji
      iiiaaaaaiiiiiaii
      0000000000000000`,
    f1: `
      9989998899899989
      8878807888788078
      00770j0007700a00
      aa00jiaaa00aabaa
      cbaabijacaabbbba
      cbbbbibacbbbbbba
      aaaajiaaaaaaaaaa
      bbbacibbbbbaccbb
      bbbacibPbbbacbbb
      bbbaciPyPbbacbbb
      aaaaaiaPaaaaaaaa
      ccbbijbaccbbbbba
      cbbbjbbacbbbbbba
      cbbbbbbacbbbbbba
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    post: 'AAAN AOON AOON AOON nnnn AAN AON AON nnn AAAN AOON AOON nnnn AAN nnn 0000',
  },
  beach: {
    f0: `
      9w9999w99w9999w9
      099w999009w99990
      a008800aa008800a
      baa00aabbaa00aab
      bbbaabbbbbbaabbb
      bbbbbbbbbbbbbbbb
      bbbaaaabbbbbaabb
      aaaAAAwaaaaaAAaa
      AwAAAAAAAAAwAAAA
      AAAAAAAAAAAAAAAA
      AAaaAAAAaaaAAAAA
      aabbaaaabbbaaaaa
      bbbbbbbbbbbbbbbb
      bbbbbbbbbbbbbbbb
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    f2: `
      9w9999w99w9999w9
      99w90099999w0099
      8800aa008800aa08
      00aabbaa00aabba0
      aabbbbbbaabbbbba
      bbbbbbbbbbbbbbbb
      baabbbbaaaabbbbb
      awAaaaaAAAAaaaaa
      AAAAAAwAAAAwAAAA
      AAAAAAAAAqAqAAAA
      AAAAaaaaAAqaaAAA
      aaaabbbbaaabbaaa
      bbbbbbbbbbbbbbbb
      bbbbbbbbbbbbbbbb
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    f1: `
      9w9999w99w9999w9
      099w999009w99990
      a008800aa008800a
      baa00aabbaa00aab
      bbbaabbbbbbaabbb
      bbbbbbbbbbbbbbbb
      bbbaaaabbbbbaabb
      aaaAAAwaaaaaAAaa
      AwAAwwwAAAAwAAAA
      AAAwqwqwAAAAjAAA
      AAawqwqwaaaAiAjA
      aabbaPaabbbjaija
      bbbbbbbbbbbbijib
      bbbbbbbbbbbjibib
      aaaaaaaaaaaiiiia
      0000000000000000`,
    post: 'wwAq AAAq wqqP wqqP CTTt wqqP wqqP wqqP wqqP wqqP CTTt wqqP wqqP AAAq PPPP 0000',
  },
  crystal: {
    f0: `
      9989999899899998
      0098888008009880
      aa07870aa0aa070a
      bba070acbabba0ac
      bbba0acbbbbbaacb
      bbbaacbbbbbaccbb
      bbaccbbbbbaccbbb
      baccbbbbbaccbbbb
      aaaaaaaaaaaaaaaa
      baccbbbbbaccbbbb
      bbaccbbbbbaccbbb
      bbbaccbbbbbaccbb
      bbbbaccbbbbbaccb
      bbbbbaccbbbbbacc
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    f2: `
      9899899999899898
      8009088988880080
      0aa0a0798870aa0a
      aacaba07870abbab
      accbbba070abbbbb
      ccbbbbba0abbbbba
      cbbbbbacabbbbbac
      bbbbbaccbbbbbacc
      aaaaaaaaaaaaaaaa
      bbbbbaccbbbbbacc
      cbbbbbaccbbbbbac
      ccbbbbbaccbbbbba
      accbbbbbaccbbbbb
      baccbbbbbaccbbbb
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    f1: `
      9989999899899998
      0098888008009880
      aa07870aa0aa070a
      bba070acbabba0ac
      bbba0acbbbbbaacb
      bbbaacb0bbbaccbb
      bbaccb0j0baccbbb
      baccb0jji0ccbbbb
      aaaaa0jji0aaaaaa
      baccb0jii0cc0bbb
      bbacc0jii00j0bbb
      bbbac0jii0jji0bb
      bbbba0jii0jii0cb
      bbbbb0jii0jii0cc
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    post: 'CjiB wjiB jwiB jjwB jjiw BBBB CjiB wjiB jwiB jjwB jjiB BBBB CjiB jjiB BBBB 0000',
  },
  cloud: {
    f0: `
      9999w99999w99999
      998999899998999w
      0777007999700770
      a000aa07770aa00a
      baaabba000abbaaa
      cbbbbbbaaabbbbba
      cbbbbbbacbbbbbba
      cbbbbbbacbbbbbba
      abbbbbaaabbbbbaa
      aaaaaaaaaaaaaaaa
      bbbabbbbbbbabbbb
      bbbabbbbbbbabbbb
      bbbabbbbbbbabbbb
      bbaaabbbbbaaabbb
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    f2: `
      99w99999999w9999
      9899989999899989
      7700789700777007
      00aa0770aa000aa0
      aabaa00abbaaabba
      bbbacaabbbbacbbb
      bbbacbbbbbbacbbb
      bbbacbbbbbbacbbb
      bbaaabbbbbaaabbb
      aaaaaaaaaaaaaaaa
      bbbbbbbabbbbbbba
      bbbbbbbabbbbbbba
      bbbbbbbabbbbbbba
      abbbbbaaabbbbbaa
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    f1: `
      9999w99999w99999
      998999899998999w
      0777007999700770
      a000aa07770aa00a
      baaabba000abbaaa
      cbbbbbbaaabbbbba
      cbbbbbbacbbbbbba
      cbbbbbyyybbbbbba
      abbbbyYYYybbbbaa
      aaaayYYYYOyaaaaa
      bbbayYYYYOyabbbb
      bbbayYYYOOyabbbb
      bbbabyOOOybabbbb
      bbaaabyyybaaabbb
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    post: 'AAAa eeee AbeA AbeA AbeA AbeA AbeA AbeA AbeA AbeA AbeA AbeA eeee AAAa eeee 0000',
  },
  lantern: {
    f0: `
      9989998899899989
      8808887088788078
      00a0700a00770a00
      aaba07aaaa00abaa
      cbbaa7bacaaacbba
      cbbacb7acbbacbaa
      bbbabbbabbbabbba
      cbaacbbacbbacaba
      cbbacbbacbbacbba
      bababbbabababbba
      cbbacbaaacaacbba
      cbbacbbacabacbba
      bbbabababbbabbba
      cbbacbbacbaacbba
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    f2: `
      9899989998899899
      0788870887880788
      a07700a00070a070
      ba00aabaaa0aaa0a
      cbaaacbaca7bacaa
      cbbaacbacbb7acaa
      bbababbabbb7abba
      cacaacbacb7bacba
      cbabacbacbbbacba
      babbabbabbbbabba
      cbbbacaacbabacba
      cbbbacbacacaacba
      bbbbabbabbababba
      cbbbacbacbabacba
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    f1: `
      9989998899899989
      8808887088788078
      00a0700a00770a00
      aaba07aaaa00abaa
      cbbaa7bacaaacbba
      cbbacb7acbbacbaa
      bbba000abbbabbba
      cba0yyO0cbbacaba
      cbb0Ooo0cbbacbba
      baba000abababbba
      cbbacbaaa000cbba
      cbbacbba0yyO0bba
      bbbababa0Ooo0bba
      cbbacbbac000cbba
      aaaaaaaaaaaaaaaa
      0000000000000000`,
    post: 'GGGG PVVv PVvv PVVv VvVv PVVv PVVv PvVv PVVv PVVv PVvv PVVv VVVv GGGv ggGg 0000',
  },
  // Toy Attic: striped wallpaper with little flowers over a wooden skirting board (a mouse hole)
  toy: {
    f0: `
      9999999999999999
      7777777777777777
      bbcbbbbbbbcbbbbb
      bbcbbbbbbbcbjibb
      bbcbjibbbbcbiabb
      bbcbiabbbbcbbbbb
      bbcbbbbbbbcbbbbb
      bbcbbbbbbbcbbbbb
      bbcbbbbjibcbbbbb
      bbcbbbbiabcbbbbb
      bbcbbbbbbbcbbbbb
      aaaaaaaaaaaaaaaa
      9999999999999999
      8888888888888888
      7777777777777777
      0000000000000000`,
    f2: `
      9999999999999999
      7777777777777777
      bbbbbbcbbbbbbbcb
      bjibbbcbbbbbbbcb
      biabbbcbbbjibbcb
      bbbbbbcbbbiabbcb
      bbbbbbcbbbbbbbcb
      bbbbbbcbbbbbbbcb
      bbbbbbcbjibbbbcb
      bbbbbbcbiabbbbcb
      bbbbbbcbbbbbbbcb
      aaaaaaaaaaaaaaaa
      9999999999999999
      8888888888888888
      7777777777777777
      0000000000000000`,
    f1: `
      9999999999999999
      7777777777777777
      bbcbbbbbbbcbbbbb
      bbcbbbbbbbcbjibb
      bbcbjibbbbcbiabb
      bbcbiabbbbcbbbbb
      bbcbbbbbbbcbbbbb
      bbcbbbbbbbcbbbbb
      bbcbbbbbbbcbbbbb
      bbcbb0000bcbbbbb
      bbcb0uuuu0cbbbbb
      aaaa0uuuu0aaaaaa
      99990uuuu0999999
      88880uuuu0888888
      77770uuuu0777777
      0000000000000000`,
    post: '9999 7777 9887 9887 9887 9887 9887 9887 9887 9887 9887 9887 9998 8887 7777 0000',
  },
  // Snowglobe: ice bricks under a snow cap, frost glints, icicles
  snow: {
    f0: `
      9999999999999999
      8999899989998999
      7887788778877887
      aaaaaaaaaaaaaaaa
      cccccccaccccccca
      cbbbbbbacbbbbbba
      cbbbbbbacbbbbbba
      aaaaaaaaaaaaaaaa
      cccacccccccacccc
      bbbacbbbbbbacbbb
      bbbacbbbbbbacbbb
      aaaaaaaaaaaaaaaa
      cccccccaccccccca
      cbbbbbbacbbbbbba
      cbbbbbbacbbbbbba
      0000000000000000`,
    f2: `
      9999999999999999
      8999899989998999
      7887788778877887
      aaaaaaaaaaaaaaaa
      cccccccaccccccca
      cbjbbbbacbbbbiba
      cbbbbbbacbbbbbba
      aaaaaaaaaaaaaaaa
      cccacccccccacccc
      bbbacbjbbbbacbbb
      bbbacbbbbbbacbbb
      aaaaaaaaaaaaaaaa
      cccccccaccccccca
      cbbbbbbacbbjbbba
      cbbbbbbacbbbbbba
      0000000000000000`,
    f1: `
      9999999999999999
      8999899989998999
      7887788778877887
      aaaiiaaaaaiiaaia
      cccijccaccijccia
      cbbjbbbacbibbbja
      cbbbbbbacbjbbbba
      aaaaaaaaaaaaaaaa
      cccacccccccacccc
      bbbacbbbbbbacbbb
      bbbacbbbbbbacbbb
      aaaaaaaaaaaaaaaa
      cccccccaccccccca
      cbbbbbbacbbbbbba
      cbbbbbbacbbbbbba
      0000000000000000`,
    post: '9999 8888 7777 abcc abcc abcc abcc abcc abcc abcc abcc abcc abcc abcc aaaa 0000',
  },
  // Sun Temple: sandstone blocks under a turquoise frieze, a sun glyph panel now and then
  sun: {
    f0: `
      9999999999999999
      8888888888888888
      7777777777777777
      aaaaaaaaaaaaaaaa
      cccccccccccccccc
      cicccccicccccicc
      cccccccccccccccc
      aaaaaaaaaaaaaaaa
      bbbbbbbabbbbbbba
      bbbbbbbabbbbbbba
      bbbbbbbabbbbbbba
      aaaaaaaaaaaaaaaa
      bbbabbbbbbbabbbb
      bbbabbbbbbbabbbb
      bbbabbbbbbbabbbb
      0000000000000000`,
    f2: `
      9999999999999999
      8888888888888888
      7777777777777777
      aaaaaaaaaaaaaaaa
      cccccccccccccccc
      ccjiiccccccciijc
      cccccccccccccccc
      aaaaaaaaaaaaaaaa
      bbbbbbbabbbbbbba
      bbbbbbbabbbbbbba
      bbbbbbbabbbbbbba
      aaaaaaaaaaaaaaaa
      bbbabbbbbbbabbbb
      bbbabbbbbbbabbbb
      bbbabbbbbbbabbbb
      0000000000000000`,
    f1: `
      9999999999999999
      8888888888888888
      7777777777777777
      aaaaaaaaaaaaaaaa
      cccccccccccccccc
      cicccccicccccicc
      cccccccccccccccc
      aaaaaaaaaaaaaaaa
      bbbbbiiiiibbbbba
      bbbbijjjjjibbbba
      bbbbijaaajibbbba
      bbbbijjjjjibbbba
      bbbbbiiiiibbbbba
      aaaaaaaaaaaaaaaa
      bbbabbbbbbbabbbb
      0000000000000000`,
    post: '9999 8888 7777 abib abib abib abib abib abib abib abib abib abib abib aaaa 0000',
  },
  // Ember Forge: cherry bricks under a riveted teal cap, a glowing vent, a furnace mouth, pipes
  forge: {
    f0: `
      9999999999999999
      8988898888898889
      7777777777777777
      aaaaaaaaaaaaaaaa
      cccccccacccccccc
      bbbbbbbabbbbbbbb
      bbbbbbbabbbbbbbb
      aaaaaaaaaaaaaaaa
      cccacccccccacccc
      bbbabbbbbbbabbbb
      bbbabbbbbbbabbbb
      aaaaaaaaaaaaaaaa
      cccccccacccccccc
      bbbbbbbabbbbbbbb
      bbbbbbbabbbbbbbb
      0000000000000000`,
    f2: `
      9999999999999999
      8889888898888898
      7777777777777777
      aaaaaaaaaaaaaaaa
      cccccccacccccccc
      bbbbbbbabbbbbbbb
      bbbbbbbabbbbbbbb
      aaaaaaaaaaaaaaaa
      cccacaaaaaaacccc
      bbbaajjjjjjabbbb
      bbbaaiiiiiiabbbb
      aaaaaaaaaaaaaaaa
      cccccccacccccccc
      bbbbbbbabbbbbbbb
      bbbbbbbabbbbbbbb
      0000000000000000`,
    f1: `
      9999999999999999
      8988898888898889
      7777777777777777
      aaaaaaaaaaaaaaaa
      cccccaaaaaaccccc
      bbbbaiiiiiiabbbb
      bbbaijjjjjjiabbb
      aaaijjYYYYjjiaaa
      cccijYwwwwYjiccc
      bbbijYwwwwYjibbb
      bbbijjYYYYjjibbb
      aaaaiiiiiiiiaaaa
      cccc00000000cccc
      bbbbbbbabbbbbbbb
      bbbbbbbabbbbbbbb
      0000000000000000`,
    post: '9999 8888 7777 7987 7987 7987 7987 7987 9998 7987 7987 7987 7987 7987 7777 0000',
  },
  // Glow Deep: coral rock under a dark ledge, pink anemones, a frond of glowing kelp
  deep: {
    f0: `
      9999999999999999
      8898888988888988
      7777777777777777
      aaaaaaaaaaaaaaaa
      bbbbcccbbbbbbccb
      bbbccbbbbabbcccb
      abbbbbbbaabbbbba
      aabbbbbaaaabbbaa
      bbbbcbbbbbbbbbbb
      bbbccbbbbbbccbbb
      bbbbbbaabbbbbbbb
      abbbbaaaabbbbbba
      bbcbbbbbbbbcbbbb
      bccbbbbbbbbccbbb
      bbbbbbbabbbbbbbb
      0000000000000000`,
    f2: `
      9999999999999999
      8888988888898888
      7777777777777777
      aaaaaaaaaaaaaaaa
      bbbbbbbbbbbbbbbb
      bbbbbbbbbbbbbbcb
      bbbbijibbbbbbccb
      bbbijjjibbbbbbbb
      bbbbijibbbbbbbbb
      bbbbbabbbbabbbbb
      bbccbabbbbbbijib
      bbbbbbbbbbbijjji
      abbbbbbbbbbbbabb
      aabbbbcbbbbbbabb
      bbbbbccbbbbbbbbb
      0000000000000000`,
    f1: `
      9999999999999999
      8898888988888988
      7777777777777777
      aaaaaaaaaaaaaaaa
      bbbbbbb6bbbbbbbb
      bbbbbb646bbbbbbb
      bbbbbbb64bbbbbbb
      bbbbbb46bbbbbbbb
      bbbbbbb64bbbbbbb
      bbbbbb646bbbbbbb
      bbbbbbb46bbbbbbb
      bbbbbb46bbbbbbbb
      bbbbbbb64bbbbbbb
      bbbbbbb6bbbbbbbb
      bbbbbbaaabbbbbbb
      0000000000000000`,
    post: '9999 8888 7777 abba abba abca abba abba abba abba abca abba abba abba abba aaaa 0000',
  },
  // Moon Garden: silver moon rock with craters, gold moonflowers, a crescent in the stone
  moon: {
    f0: `
      9999999999999999
      8898888988888988
      7777777777777777
      aaaaaaaaaaaaaaaa
      bbbbcccbbbbbbbbb
      bbbca.acbbbbcccb
      bbbcaaacbbbbcabb
      bbbbcccbbbbbbbbb
      bbbbbbbbbbcccbbb
      bccbbbbbbca.acbb
      ca.cbbbbbcaaacbb
      bccbbbbbbbcccbbb
      bbbbbbbbbbbbbbbb
      bbbbcccbbbbbbbbb
      bbbbbbbbbbbbbbbb
      0000000000000000`,
    f2: `
      9999999999999999
      8888988888898888
      7777777777777777
      aaaaaaaaaaaaaaaa
      bbbbbbbbbbbbbbbb
      bbbbbbbbbbbbbbbb
      bbbbijibbbbbbbbb
      bbbijjjibbbbijib
      bbbbijibbbbijjji
      bbbbbabbbbbbijib
      bbbbbabbbbbbbabb
      bbcccbbbbbbbbabb
      bca.acbbbbbbbbbb
      bcaaacbbbbbbbbbb
      bbcccbbbbbbbbbbb
      0000000000000000`,
    f1: `
      9999999999999999
      8898888988888988
      7777777777777777
      aaaaaaaaaaaaaaaa
      bbbbbbbbbbbbbbbb
      bbbbbbjjjbbbbbbb
      bbbbbjjbbbbbbbbb
      bbbbjjbbbbbbbbbb
      bbbbjjbbbbbbbbbb
      bbbbjjbbbbbbbbbb
      bbbbbjjbbbbbbbbb
      bbbbbbjjjbbbbbbb
      bbbbbbbbbbbbbbbb
      bbbbbbbbbbcccbbb
      bbbbbbbbbbbbbbbb
      0000000000000000`,
    post: '9999 8888 7777 abba abba acba abba abba abba abba abca abba abba abba abba aaaa 0000',
  },
  // Story Library: two shelves of books in every colour under a violet cap
  library: (() => {
    // a shelf: 'R3' is a red book three wide, a lower-case letter a shorter one, 'a1' a gap
    const SP = { R: 'Rr', T: 'Tt', Y: 'Yo', P: 'qp', O: 'On', G: 'HG', L: 'Ll' };
    const shelf = (spec, h) => {
      const rows = Array.from({ length: h }, () => 'c');
      for (const t of spec.split(' ')) {
        const K = t[0].toUpperCase(), c = SP[K], w = +t.slice(1), short = t[0] !== K;
        for (let x = 0; x < w; x++) for (let y = 0; y < h; y++)
          rows[y] += !c || short && y === 0 ? 'a' : y === 2 ? (K === 'Y' ? 'O' : 'y') : x === 0 ? c[0] : c[1];
      }
      return rows.map(r => r + 'a');
    };
    const face = (s1, s2) => ['9999999999999999', '8888888888888888', '7777777777777777', 'aaaaaaaaaaaaaaaa']
      .concat(shelf(s1, 5), ['cccccccccccccccc', 'bbbbbbbbbbbbbbbb'], shelf(s2, 4), ['0000000000000000']).join('\n');
    return {
      f0: face('R2 T3 a1 Y2 P3 O2 G1', 'G2 P2 a1 T3 R3 y3'),
      f2: face('O3 p2 L2 a1 R3 T3', 'Y2 R3 G2 T2 a1 P2 o2'),
      f1: face('T2 a1 l2 a3 R3 Y3', 'P3 O3 a1 G2 R2 t3'),
      post: '9999 8888 7777 aaaa cbba cbba cbba cbba cbba cccc bbbb cbba cbba cbba cbba 0000',
    };
  })(),
};
for (const t of THEME_ORDER) {
  const w = WALLS[t] || { f0: FACE_BRICK, f2: FACE_BRICK, f1: FACE_VINE, post: '' };
  const f0 = parseArt('face_0', w.f0), post = w.post ? w.post.split(' ') : null;
  const o = { theme: THEMES[t] };
  def('face_0@' + t, f0, o);
  def('face_1@' + t, parseArt('face_1', w.f1), o);
  def('face_2@' + t, parseArt('face_2', w.f2), o);
  // corner posts spliced over f0 (a short post block leaves the wall showing beside it)
  def('face_l@' + t, post ? f0.map((r, y) => post[y] + '0' + r.slice(post[y].length + 1)) : f0, o);
  def('face_r@' + t, post ? f0.map((r, y) => r.slice(0, 15 - post[y].length) + '0' + post[y]) : f0, o);
}
// The face tile at column c of a top wall (edges: c is a room column, so the ends get posts).
// Accents never stand side by side. Hashed from the room seed: every screen agrees.
function faceTile(c, seed, edges) {
  if (edges && c === 1) return 'face_l';
  if (edges && c === COLS - 2) return 'face_r';
  const h = hash(c, 99, seed);
  if (h % 5 === 0 && hash(c - 1, 99, seed) % 5) return 'face_1';
  return (h >>> 8) & 1 ? 'face_2' : 'face_0';
}
defT('pit', `
  ffffffffffffffff
  ffffffffffffffff
  fffffgggffffffff
  ffffggffggffffff
  ffffffffffffffff
  ffffffffffffffff
  fffffffffffhffff
  ffffffffffffffff
  ffffffffffffffff
  ffffffffffgggfff
  fhfffffffggffggf
  ffffffffffffffff
  ffffffffffffffff
  ffggffffffffffff
  fgffgfffffffffff
  ffffffffffffffff`);

// ---------- Doors (stone / boss / treasure frames) ----------
(function doors() {
  const RAMPS = { n: 'dmlL', b: 'prRq', t: 'oOyY', c: '1234' };
  const arch = (ramp) => {
    let r = sculpt(32, 24, [{ r: [3, 0, 26, 26, 11], ramp }]);
    r = r.map((row, y) => row.split('').map((c, x) => {
      const inX = x >= 9 && x <= 22;
      const top = y >= 6 || (y >= 4 && x >= 10 && x <= 21) || (y >= 3 && x >= 12 && x <= 19);
      return inX && top ? '.' : c;
    }).join(''));
    // outline the opening
    return r.map((row, y) => row.split('').map((c, x) => {
      if (c === '.') return c;
      const open = (X, Y) => Y >= 0 && Y < 24 && X >= 0 && X < 32 && r[Y][X] === '.' && X >= 9 && X <= 22 && Y >= 3;
      return open(x - 1, y) || open(x + 1, y) || open(x, y + 1) ? '0' : c;
    }).join(''));
  };
  const openFill = (r) => r.map((row, y) => row.split('').map((c, x) => {
    if (c !== '.' || x < 9 || x > 22 || y < 3) return c;
    if (y < 10) return '0';
    if (y < 16) return (x + y) % 2 ? '1' : '0';
    return y < 21 ? '1' : '2';
  }).join(''));
  const closedFill = (r) => r.map((row, y) => row.split('').map((c, x) => {
    if (c !== '.' || x < 9 || x > 22 || y < 3) return c;
    if (x === 15 || x === 16) return '0';
    if (y === 23) return '0';
    if (x === 9 || x === 22) return 'n';
    if ((x === 12 || x === 19) && y > 5) return 'n';
    return y < 6 ? 'N' : x === 10 || x === 17 ? 'O' : 'N';
  }).join(''));
  for (const k in RAMPS) {
    const a = arch(RAMPS[k]);
    def('door_t_' + k + '_open', openFill(a));
    def('door_t_' + k + '_shut', stamp(closedFill(a), 13, 12, '.0000.\n0yYYy0\n0y00y0\n.0000.'));
    // half-open: the two leaves swing back toward the frame
    const op = openFill(a), cl = closedFill(a);
    def('door_t_' + k + '_mid', cl.map((row, y) => row.split('').map((c, x) =>
      y < 3 || x < 9 || x > 22 || a[y][x] !== '.' ? c : x >= 13 && x <= 18 ? op[y][x] : x === 12 || x === 19 ? '0' : c).join('')));
  }
  // Side door (left wall; mirrored for right). 16x32 gap in the wall cap.
  // st: 0 open, 1 half (gate slid up), 2 shut
  const side = (ramp, st) => {
    const shut = st > 0;
    let r = sculpt(16, 32, [{ r: [0, 0, 16, 8, 3], ramp }, { r: [0, 24, 16, 8, 3], ramp }]);
    return r.map((row, y) => row.split('').map((c, x) => {
      if (y < 8 || y >= 24) return c;
      const top = st === 2 ? 23 : 15;
      if (shut && x >= 9 && x <= 12 && y <= top) return x === 9 || x === 12 || y === 8 || y === top || y % 5 === 0 ? '0' : x === 10 ? 'O' : 'N';
      return x < 5 ? '0' : x < 10 ? ((x + y) % 2 ? '1' : '0') : x < 14 ? '1' : '2';
    }).join(''));
  };
  const bottom = (ramp, st) => {
    const shut = st > 0;
    let r = sculpt(32, 16, [{ r: [0, 0, 8, 16, 3], ramp }, { r: [24, 0, 8, 16, 3], ramp }]);
    return r.map((row, y) => row.split('').map((c, x) => {
      if (x < 8 || x >= 24) return c;
      const end = st === 2 ? 23 : 15;
      if (shut && y >= 4 && y <= 7 && x <= end) return y === 4 || y === 7 || x === 8 || x === end || x % 5 === 0 ? '0' : y === 5 ? 'O' : 'N';
      return y > 11 ? '0' : y > 6 ? ((x + y) % 2 ? '1' : '0') : y > 2 ? '1' : '2';
    }).join(''));
  };
  for (const k in RAMPS) {
    ['open', 'mid', 'shut'].forEach((n, st) => {
      def('door_s_' + k + '_' + n, side(RAMPS[k], st), { flip: true });
      def('door_b_' + k + '_' + n, bottom(RAMPS[k], st));
    });
  }
})();

// ---------- Obstacles (16x16, fill their tile) ----------
(function obstacles() {
  // each land's rock has its own silhouette, so rooms of different lands never read as one
  // Meadow: a little cairn, a flat stone resting on a big one, grass at its foot
  def('rock_meadow', stamp(sculpt(16, 16, [
    { e: [9, 6.5, 6, 3.5], ramp: 'dmlL' }, { e: [7.5, 11, 7.5, 4.5], ramp: 'dmlL' },
  ]), 11, 12, '.h.\nGhG'));
  // Shore: two sea-worn pebbles side by side, a starfish on the big one
  def('rock_beach', stamp(sculpt(16, 16, [
    { e: [6.5, 10, 6, 5.5], ramp: 'dmlL' }, { e: [12.5, 12, 3.5, 3.5], ramp: 'dmlL' },
  ]), 4, 8, '.o.\nooo\n.o.'));
  def('rock_crystal', `
    ......00........
    .....0CC0.......
    .....0Ccb0..0...
    ..0..0Ccb0.0C0..
    .0C0.0Ccb0.0cb0.
    .0Cb00Ccbb00cb0.
    .0cb0Cccbb0Ccb0.
    00cb0Cccbb0ccbb0
    0Ccbb0Ccbb0ccb0.
    0ccbb0ccbb0cbb0.
    .0cbb0ccbb0cb00.
    .0cbbb0cb00bb0..
    ..0bbbb00bbbb0..
    ..00bbbbbbbb00..
    ....00000000....
    ................`);
  def('brk_meadow', stamp(sculpt(16, 16, [
    { e: [5, 10, 5, 5], ramp: 'gGhH' }, { e: [11, 10, 5, 5], ramp: 'gGhH' }, { e: [8, 7, 5.5, 5.5], ramp: 'gGhH' },
  ]), 4, 5, 'P...\n....\n...P'));
  def('brk_beach', `
    ................
    ..........000...
    ..........0y0...
    .........0y0....
    ...000000y000...
    ..0RaAAAAyAaR0..
    ..0RRRRRRRRRr0..
    ...0RwRRRRRr0...
    ...0RwRRRRRr0...
    ...0yYyyyyyo0...
    ...0RRRRRRrr0...
    ....0RRRRRr0....
    ....0RRRRrr0....
    ....0rrrrrr0....
    .....000000.....
    ................`);
  def('brk_crystal', stamp(sculpt(16, 16, [
    { e: [8, 10, 6.5, 6], ramp: '1234' }, { r: [5, 1, 6, 5, 1], ramp: '1234', hi: false },
  ]), 6, 9, '.c.\ncCc\n.c.'));
  // Cloud Steps: a sunstone boulder with a gold sun, and a pink candy-floss puff
  def('rock_cloud', stamp(sculpt(16, 16, [{ r: [1, 2, 14, 13, 5], ramp: 'eaAY' }]), 6, 6, '.y.\nyoy\n.y.'));
  def('brk_cloud', stamp(sculpt(16, 16, [
    { e: [5, 10, 4.5, 4.5], ramp: 'pPqw' }, { e: [11, 10, 4.5, 4.5], ramp: 'pPqw' }, { e: [8, 7, 5.5, 5], ramp: 'pPqw' },
  ]), 5, 5, 'Y...\n....\n...w'));
  // Lantern Woods: an old stump with a tuft of glowing moss, and a pumpkin
  def('rock_lantern', stamp(parseArt('rock_lantern', `
    ................
    ................
    ....00000000....
    ...0AAAAAAaa0...
    ..0AAeeeeeeaa0..
    ..0AeaAaaaeae0..
    ..0aAeeeeeeae0..
    ..0uaaaaaaeeu0..
    ..0NNnnnnnnnu0..
    ..0NnNnnnnnuu0..
    ..0NnNnnunnuu0..
    ..0NnNnnunnuu0..
    .0NNnNnnunnuuu0.
    0NnNnnnnunnnuuu0
    .00000000000000.
    ................`), 4, 10, '.T.\nTOT'));
  def('brk_lantern', stamp(sculpt(16, 16, [
    { e: [5, 10, 4, 5], ramp: 'noOy' }, { e: [11, 10, 4, 5], ramp: 'noOy' }, { e: [8, 10, 4.5, 5.5], ramp: 'noOy' },
  ]), 7, 3, '.g\ngG'));
  // Toy Attic: a letter block (blue top, red face, a white A), and a taped cardboard box
  def('rock_toy', parseArt('rock_toy', `
    ................
    ..000000000000..
    .0AAAAAAAAAAAa0.
    .0AcccccccccBa0.
    .0AcBBBBBBBBBa0.
    .0aaaaaaaaaaae0.
    .0ARRRRRRRRRre0.
    .0ARrrrwwrrrne0.
    .0ARrrwrrwrrne0.
    .0ARrrwwwwrrne0.
    .0ARrrwrrwrrne0.
    .0ARrrwrrwrrne0.
    .0Annnnnnnnnne0.
    .0eeeeeeeeeeee0.
    ..000000000000..
    ................`));
  def('brk_toy', stamp(sculpt(16, 16, [{ r: [2, 3, 12, 12, 2], ramp: 'neaA' }]), 7, 3, 'Y\nY\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny'));
  // Snowglobe: a snow-capped stone, and a present with a gold ribbon
  def('rock_snow', sculpt(16, 16, [{ e: [8, 10.5, 6.5, 5], ramp: 'dmlL' }, { e: [7.5, 6.5, 5.5, 3], ramp: 'lLww' }]));
  def('brk_snow', stamp(sculpt(16, 16, [{ r: [2, 4, 12, 11, 1], ramp: 'prRq' }]), 7, 2, 'yy.\n.yy\nyy.\nyy.\nyy.\nyy.\nyy.\nyy.\nyy.\nyy.\nyy.\nyy.'));
})();

// ---------- Pickups, shots, props ----------
def('coin_0', `
  ..0000..
  .0yYYy0.
  0yYyyyo0
  0yYyyyo0
  0yYyyyo0
  0yyyyoo0
  .0oooo0.
  ..0000..`);
def('coin_1', `
  ..0000..
  ..0yyo0.
  .0yYyo0.
  .0yYyo0.
  .0yYyo0.
  .0yyoo0.
  ..0oo0..
  ..0000..`);
def('coin_2', `
  ...00...
  ...0y0..
  ...0Y0..
  ...0y0..
  ...0y0..
  ...0o0..
  ...0o0..
  ...00...`);
def('gem', `
  ..0000..
  .0CwcB0.
  0CwccBb0
  0cccBBb0
  .0cBBb0.
  ..0Bb0..
  ...00...`);
def('heart', `
  .00...00.
  0RwR0rRr0
  0RRrrrrr0
  0rrrrrrp0
  .0rrrrp0.
  ..0rrp0..
  ...0p0...
  ....0....`, { flash: true });
def('heart_half', `
  .00......
  0RwR0....
  0RRr0....
  0rrr0....
  .0rr0....
  ..0r0....
  ...00....
  .........`, { flash: true });
def('pedestal', stamp(sculpt(16, 12, [
  { r: [3, 4, 10, 8, 2], ramp: 'dmlL', hi: false }, { e: [8, 3.5, 7.5, 3.5], ramp: 'dmlL', hi: false },
]), 4, 2, '.llll.\nlLLLLl'));
def('rug', grid(176, 28).fill((x, y) => {
  if (x < 3 || x > 172) return y > 1 && y < 26 && y % 2 === 0 ? (x === 1 || x === 174 ? 'Y' : x === 0 || x === 175 ? null : 'y') : null;
  if (y === 0 || y === 27 || x === 3 || x === 172) return '0';
  if (y === 1 || y === 26 || x === 4 || x === 171) return 'o';
  if (y === 2 || y === 25 || x === 5 || x === 170) return 'y';
  if (y === 3 || y === 24 || x === 6 || x === 169) return 'o';
  const dx = (x - 6) % 16 - 8, dy = y - 13.5;
  return Math.abs(dx) + Math.abs(dy) < 6 ? (Math.abs(dx) + Math.abs(dy) < 3 ? 'y' : 'P') : 'p';
}).rows());

def('shot_0', `
  ...0...
  ..0Y0..
  00YwY00
  0YwwwY0
  00YwY00
  ..0Y0..
  ...0...`);
def('shoth_0', `
  ...0...
  ..0Y0..
  00YwY00
  0YwwwY0
  00YwY00
  ..0Y0..
  ...0...`, { legend: { Y: 'H' } });
def('shotc_0', `
  ...0...
  ..0Y0..
  00YwY00
  0YwwwY0
  00YwY00
  ..0Y0..
  ...0...`, { legend: { Y: 'C' } });
def('shotp_0', `
  ...0...
  ..0Y0..
  00YwY00
  0YwwwY0
  00YwY00
  ..0Y0..
  ...0...`, { legend: { Y: 'q' } });
def('shot_1', `
  .0...0.
  0Y0.0Y0
  .0YwY0.
  ..www..
  .0YwY0.
  0Y0.0Y0
  .0...0.`);
def('shoth_1', `
  .0...0.
  0Y0.0Y0
  .0YwY0.
  ..www..
  .0YwY0.
  0Y0.0Y0
  .0...0.`, { legend: { Y: 'H' } });
def('shotc_1', `
  .0...0.
  0Y0.0Y0
  .0YwY0.
  ..www..
  .0YwY0.
  0Y0.0Y0
  .0...0.`, { legend: { Y: 'C' } });
def('shotp_1', `
  .0...0.
  0Y0.0Y0
  .0YwY0.
  ..www..
  .0YwY0.
  0Y0.0Y0
  .0...0.`, { legend: { Y: 'q' } });
def('shotbig_0', `
  ....0....
  ...0Y0...
  ...0Y0...
  000YwY000
  0YYwwwYY0
  000YwY000
  ...0Y0...
  ...0Y0...
  ....0....`);
def('shotbigh_0', `
  ....0....
  ...0Y0...
  ...0Y0...
  000YwY000
  0YYwwwYY0
  000YwY000
  ...0Y0...
  ...0Y0...
  ....0....`, { legend: { Y: 'H' } });
def('shotbigc_0', `
  ....0....
  ...0Y0...
  ...0Y0...
  000YwY000
  0YYwwwYY0
  000YwY000
  ...0Y0...
  ...0Y0...
  ....0....`, { legend: { Y: 'C' } });
def('shotbigp_0', `
  ....0....
  ...0Y0...
  ...0Y0...
  000YwY000
  0YYwwwYY0
  000YwY000
  ...0Y0...
  ...0Y0...
  ....0....`, { legend: { Y: 'q' } });
def('shotbig_1', `
  0.......0
  .0Y...Y0.
  ..0Y.Y0..
  ...YwY...
  ...www...
  ...YwY...
  ..0Y.Y0..
  .0Y...Y0.
  0.......0`);
def('shotbigh_1', `
  0.......0
  .0Y...Y0.
  ..0Y.Y0..
  ...YwY...
  ...www...
  ...YwY...
  ..0Y.Y0..
  .0Y...Y0.
  0.......0`, { legend: { Y: 'H' } });
def('shotbigc_1', `
  0.......0
  .0Y...Y0.
  ..0Y.Y0..
  ...YwY...
  ...www...
  ...YwY...
  ..0Y.Y0..
  .0Y...Y0.
  0.......0`, { legend: { Y: 'C' } });
def('shotbigp_1', `
  0.......0
  .0Y...Y0.
  ..0Y.Y0..
  ...YwY...
  ...www...
  ...YwY...
  ..0Y.Y0..
  .0Y...Y0.
  0.......0`, { legend: { Y: 'q' } });
def('moon', `
  ..000..
  .0YY00.
  0YY0...
  0Yy0...
  0yy0...
  .0yy00.
  ..000..`);
for (const [k, r] of [['pink', 'pPqw'], ['cyan', 'bcCw'], ['orange', 'oOYw'], ['purple', '134w']]) {
  def('eb_' + k, `
    .0000.
    0${r[2]}${r[3]}${r[2]}${r[1]}0
    0${r[3]}${r[3]}${r[2]}${r[1]}0
    0${r[2]}${r[2]}${r[1]}${r[0]}0
    0${r[1]}${r[1]}${r[0]}${r[0]}0
    .0000.`);
  def('ebb_' + k, `
    ..0000..
    .0${r[2]}${r[3]}${r[2]}${r[2]}0.
    0${r[2]}${r[3]}${r[3]}${r[2]}${r[2]}${r[1]}0
    0${r[3]}${r[3]}${r[2]}${r[2]}${r[1]}${r[1]}0
    0${r[2]}${r[2]}${r[2]}${r[1]}${r[1]}${r[0]}0
    0${r[2]}${r[1]}${r[1]}${r[1]}${r[0]}${r[0]}0
    .0${r[1]}${r[0]}${r[0]}${r[0]}0.
    ..0000..`);
}
// Puff of smoke / sparkle / hit spark
def('poof_0', `
  ..........
  ..........
  ...0000...
  ..0wwwL0..
  ..0wwLl0..
  ..0wLll0..
  ..0Llll0..
  ...0000...
  ..........
  ..........`);
def('poof_1', `
  ...000....
  ..0wwL0000
  .0wwLl0wL0
  .0wLll0Ll0
  ..0000l00.
  .0wL00000.
  0wwLl0wL0.
  0wLll0Ll0.
  .0ll0.000.
  ..00......`);
def('poof_2', `
  .00....00.
  0wL0..0wL0
  0Ll0..0Ll0
  .00....00.
  ..........
  ..........
  .00....00.
  0wL0..0Ll0
  .00....00.
  ..........`);
def('sparkle_0', '.Y.\nYwY\n.Y.');
def('sparkle_1', 'Y.Y\n.w.\nY.Y');
def('sparkle_c', '.C.\nCwC\n.C.');
// Stardrop: the Star Rain event's pickup (a fallen shooting star)
def('stardrop', autoOutline(parseArt('stardrop', `
  ...........
  .....w.....
  ....wYy....
  .wwwYYyyyO.
  ..wYYYYyO..
  ...YYyyO...
  ..Yyy.yyO..
  ..yO...yO..
  ...........`)));

// Star gate that appears after a boss: a swirling flat disc on the floor.
for (let f = 0; f < 3; f++) {
  def('portal_' + f, autoOutline(grid(32, 20).fill((x, y) => {
    const nx = (x + 0.5 - 16) / 14.5, ny = (y + 0.5 - 10) / 8.5, d = Math.hypot(nx, ny);
    if (d > 1) return null;
    if (d < 0.22) return 'w';
    const a = Math.atan2(ny, nx) / (Math.PI * 2);
    const band = ((Math.floor(a * 6 + d * 3 - f * 2 / 3) % 4) + 4) % 4;
    return d > 0.86 ? 'Y' : '3PqC'[band];
  }).rows()));
}

// Ambient critters and bubbles (see fx.js)
def('bfly_0', autoOutline(parseArt('bfly', `
  .........
  .Yy...Yy.
  .yyy1yyy.
  ..yo1oy..
  ...o.o...
  .........`)), { flip: true });
def('bfly_1', autoOutline(parseArt('bfly', `
  .........
  .........
  ..Yy.Yy..
  ..yy1yy..
  ...o1o...
  .........`)), { flip: true });
def('bubble', `
  .CC.
  Cw.C
  C..C
  .CC.`);

// Treasure chest (closed / open)
def('chest_0', `
  ..000000000000..
  .0AAOOOOOOOOON0.
  .0OOOOOOOOOONn0.
  0yyyyyyyyyyyyyo0
  0NNNNN0yy0NNNNn0
  0000000yY0000000
  0yNNNN0yo0NNNNy0
  0yNNNNN00NNNNNy0
  0ynnnnnnnnnnnny0
  0yNNNNNNNNNNNNy0
  0yNNNNNNNNNNNNy0
  0onnnnnnnnnnnno0
  .00000000000000.`);
def('chest_1', `
  ..000000000000..
  .0nNNNNNNNNNNn0.
  .0nNNNNNNNNNNn0.
  0yyyyyyyyyyyyyo0
  0yYwYyYYwYyYwYy0
  0oyYyoyYyoyYyoo0
  0nnnnnnnnnnnnnn0
  0yNNNNNNNNNNNNy0
  0ynnnnnnnnnnnny0
  0yNNNNNNNNNNNNy0
  0yNNNNNNNNNNNNy0
  0onnnnnnnnnnnno0
  .00000000000000.`);

// ---------- Potions and the turret kit (belt items) ----------
const POTION_ART = autoOutline(parseArt('potion', `
  ...........
  ....NNN....
  ....nNn....
  ....lLl....
  ....lLl....
  ...lLLLl...
  ..lXXXXXl..
  ..lXwXXxl..
  ..lXXXXxl..
  ..lXXXxxl..
  ...lxxxl...
  ....lll....
  ...........`));
const POTION_COL = { regen: { X: 'P', x: 'p' }, haste: { X: 'y', x: 'o' }, power: { X: 'R', x: 'r' }, guard: { X: 'c', x: 'B' } };
for (const k in POTION_COL) def('pot_' + k, POTION_ART, { legend: POTION_COL[k] });
def('pot_turret', autoOutline(parseArt('kit', `
  ...........
  .....Y.....
  ....YwY....
  ...YYYYy...
  ....Yyo....
  ...Yy.yo...
  ...........
  ...3344....
  ..3322221..
  ..3222211..
  ..mmmmmmd..
  ..mllmmdd..
  ...........`)));

// ---------- Star turret (placed by the hero) ----------
(function turret() {
  for (let f = 0; f < 2; f++) {
    let r = sculpt(16, 20, [{ r: [3, 11, 10, 9, 2], ramp: 'dmlL', hi: false }, { e: [8, 8, 5.5, 5.5], ramp: '1234' }]);
    r = stamp(r, 6, 6, f ? '.w.\nwYw\n.w.' : '.Y.\nYwY\n.Y.');
    r = stamp(r, 4, 15, 'dddddddd');
    def('turret_' + f, r, { flash: true });
  }
})();

// ---------- Projectiles of the other wands ----------
for (let f = 0; f < 2; f++) {
  def('shotcomet_' + f, stamp(sculpt(9, 9, [{ e: [4.5, 4.5, 4.4, 4.4], ramp: 'oOyY' }]), f ? 2 : 3, f ? 2 : 3, f ? 'ww\nw.' : 'w'));
}
def('shotspark_0', autoOutline(parseArt('spark', '.......\n...Y...\n..YwY..\n...Y...\n.......')));
def('shotspark_1', autoOutline(parseArt('spark', '.......\n..Y.Y..\n...w...\n..Y.Y..\n.......')));
def('shotbubble_0', `
  ..000..
  .0CwC0.
  0CwCCc0
  0CCCCc0
  0CCCcc0
  .0ccc0.
  ..000..`);
def('shotbubble_1', `
  .......
  ..000..
  .0CwC0.
  0CwCCc0
  0CCCcc0
  .0ccc0.
  ..000..`);
// Moon boomerang, four spin poses from three drawings (the side pose is mirrored).
def('shotboom_d', autoOutline(parseArt('boom', `
  .........
  .YY...YY.
  .Yyy.yyo.
  ..yyyyo..
  ...yoo...
  .........`)));
def('shotboom_u', autoOutline(parseArt('boom', `
  .........
  ...YYy...
  ..Yyyyo..
  .Yyy.yoo.
  .yo...oo.
  .........`)));
def('shotboom_s', autoOutline(parseArt('boom', `
  .......
  .YY....
  .Yyy...
  ..yyy..
  ..yyo..
  .yyo...
  .yo....
  .......`)), { flip: true });
