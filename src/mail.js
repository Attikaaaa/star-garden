'use strict';
// Mister Ribbit's letters (a story piece and a small gift on the days after you start),
// the gentle calendar (a gift on every day you play, never reset) and the welcome back
// gift. All of it is local: it works offline and on the first day.

// day: whole days since the first visit when the letter arrives. gift: { vault, seeds, title }
const LETTERS = [
  { id: 'hello', day: 0, title: 'WELCOME, LITTLE WIZARD', gift: { vault: 10 }, lines: [
    'RIBBIT! I AM MISTER RIBBIT, THE KEEPER OF THIS GARDEN.',
    'LONG AGO THE STARS SHONE ON IT EVERY NIGHT.',
    'THEN THE NIGHT MOTH CAME AND STOLE THE STARLIGHT.',
    'EVERY COIN YOU BRING BACK HELPS THE GARDEN GROW. HERE ARE A FEW TO START.'] },
  { id: 'bosses', day: 1, title: 'THE CROWNS', gift: { vault: 15 }, lines: [
    'I HAVE BEEN THINKING ABOUT THE SLIME KING.',
    'HIS CROWN IS NO CROWN: IT IS ONE OF THE BIG STARS!',
    'THE MOTH HANDED THEM OUT TO THE GRUMPIEST FOLK OF EVERY LAND.',
    'BRING THEM BACK AND THE SKY WILL REMEMBER.'] },
  { id: 'seed', day: 2, title: 'A STAR SEED', gift: { seeds: 1 }, lines: [
    'I FOUND THIS SEED WHERE A STAR ONCE FELL.',
    'KEEP IT SAFE. STAR SEEDS GROW INTO WONDERFUL THINGS.',
    'IF YOU FINISH ALL THREE QUESTS IN A DAY, I WILL FIND YOU ANOTHER.'] },
  { id: 'shore', day: 4, title: 'THE SHORE', gift: { vault: 25 }, lines: [
    'THE SEA WAS ONCE FULL OF GLOWING JELLYFISH.',
    'NOW THEY DRIFT IN THE DARK AND STING WHOEVER COMES CLOSE.',
    'BE KIND TO THEM WHEN YOU CAN. BE QUICK WHEN YOU CANNOT.'] },
  { id: 'week', day: 6, title: 'ONE WEEK!', gift: { vault: 30, seeds: 1 }, lines: [
    'A WHOLE WEEK OF ADVENTURES. THE GARDEN LOOKS BRIGHTER ALREADY.',
    'DID YOU KNOW YOU CAN ROLL RIGHT THROUGH A BULLET?',
    'EVERY CLOSE CALL FILLS YOUR STARFALL A LITTLE.'] },
  { id: 'cave', day: 9, title: 'DEEP IN THE CAVE', gift: { vault: 30 }, lines: [
    'THE CRYSTAL GOLEM IS OLDER THAN THIS GARDEN.',
    'IT WAS SLEEPING UNTIL A STAR FELL ON ITS HEAD.',
    'I DO NOT THINK IT IS ANGRY. I THINK IT IS JUST VERY TIRED.'] },
  { id: 'moth', day: 13, title: 'WINGS IN THE DARK', gift: { vault: 40, seeds: 1 }, lines: [
    'LAST NIGHT I SAW GREY WINGS CROSS THE MOON.',
    'THE NIGHT MOTH IS STILL OUT THERE, EATING STARLIGHT.',
    'SOMEWHERE PAST THE CAVE THERE IS A WELL FULL OF IT.'] },
  { id: 'friends', day: 20, title: 'OLD FRIENDS', gift: { vault: 50 }, lines: [
    'THE CRITTERS TALK ABOUT YOU, YOU KNOW.',
    'THE BEES SAY YOU ARE FAST. THE SLIMES SAY YOU ARE BOUNCY.',
    'I SAY YOU ARE THE BEST GARDENER I HAVE MET IN A HUNDRED YEARS.'] },
  { id: 'month', day: 29, title: 'A MONTH OF STARS', gift: { vault: 60, seeds: 2, title: 'OLD FRIEND' }, lines: [
    'A MONTH! I HAVE WRITTEN YOU A LETTER FOR EVERY BIG DAY.',
    'THIS IS THE LAST ONE FOR NOW, BUT I WILL KEEP WATCHING THE SKY.',
    'FROM NOW ON YOU MAY CALL YOURSELF MY OLD FRIEND. RIBBIT!'] },
];
const LETTER_BY = Object.fromEntries(LETTERS.map(l => [l.id, l]));
const unreadMail = () => Save.mail.got.filter(id => !Save.mail.read.includes(id)).length;
const firstDay = () => dayKey(Save.born || Date.now());
// New letters arrive once the first run is over (never during the first minutes).
function checkMail() {
  if (Save.stats.runs < 1) return 0;
  const days = daysBetween(firstDay(), dayKey());
  let n = 0;
  for (const l of LETTERS) if (days >= l.day && !Save.mail.got.includes(l.id)) { Save.mail.got.push(l.id); n++; }
  if (n) { checkMenus(); Save.write(); }
  return n;
}
function giftText(g) {
  const out = [];
  if (g.vault) out.push('+' + g.vault + ' VAULT COINS');
  if (g.seeds) out.push('+' + g.seeds + ' STAR SEED' + (g.seeds > 1 ? 'S' : ''));
  if (g.trail) out.push('THE ' + TRAILS[g.trail].name + ' TRAIL');
  if (g.title) out.push('THE TITLE ' + g.title);
  return out.join(', ');
}
function giveGift(g) {
  if (g.vault) { Save.vault += g.vault; maxCnt('vaultmax', Save.vault); }
  if (g.seeds) Save.seeds += g.seeds;
  if (g.trail && !Save.unl.trails.includes(g.trail)) { Save.unl.trails.push(g.trail); addBadge('wardrobe'); }
  if (g.title && !Save.unl.titles.includes(g.title)) { Save.unl.titles.push(g.title); addBadge('wardrobe'); }
  Save.write();
}
// Reading a letter hands over its gift.
function readLetter(id) {
  if (Save.mail.read.includes(id)) return;
  Save.mail.read.push(id);
  giveGift(LETTER_BY[id].gift);
  Audio_.sfx('item');
  track('mail', { id });
}

// ---------- The gentle calendar: a gift on each day you play ----------
// Seven steps; a step is taken on each new day of play and is never lost. The seventh
// gift of the first round is the leaf trail, later rounds give coins and a seed.
const CAL_GIFTS = [{ vault: 5 }, { vault: 8 }, { seeds: 1 }, { vault: 10 }, { vault: 12 }, { seeds: 1 }, { trail: 'leaf', vault: 15 }];
function calGift(step) { const g = Object.assign({}, CAL_GIFTS[step % 7]); if (step % 7 === 6 && step >= 7) { delete g.trail; g.vault = 30; g.seeds = 1; } return g; }
// Once per new day (not the first one): take the next step.
function checkCalendar() {
  const C = Save.cal, today = dayKey();
  if (C.last === today) return null;
  const first = !C.last;
  C.last = today;
  if (first || Save.stats.runs < 1) { Save.write(); return null; }
  const g = calGift(C.step);
  C.step++;
  giveGift(g);
  return { n: (C.step - 1) % 7 + 1, g };
}

// ---------- On the title: one notice that sums up what the day brought ----------
function progressNotices() {
  if (Save.stats.runs < 1) return;
  refreshQuests();
  const lines = [];
  // back after a break: a welcome gift
  if (Save._gap >= 3 && !G.welcomed) {
    G.welcomed = true;
    const g = { vault: Math.min(40, 10 + Save._gap * 2), seeds: 1 };
    giveGift(g);
    lines.push('WELCOME BACK! ' + giftText(g));
  }
  const cal = checkCalendar();
  if (cal) lines.push('DAILY GIFT ' + cal.n + '/7: ' + giftText(cal.g));
  const mail = checkMail();
  if (unreadMail()) lines.push(unreadMail() > 1 ? unreadMail() + ' LETTERS ARE WAITING IN THE MAILBOX' : 'A LETTER IS WAITING IN THE MAILBOX');
  const Q = Save.quests;
  if (Q && Q.day === dayKey() && !Q.seen) { Q.seen = true; Save.write(); lines.push(Q.list.length + ' NEW QUESTS FOR TODAY'); }
  if (!lines.length) return;
  const buttons = unreadMail() ? [{ label: 'READ IT', col: 'h', fn: () => { openHub(HUB.findIndex(c => c.id === 'mail')); openHubCard('mail'); } }, { label: 'LATER' }] : [{ label: 'THANKS!' }];
  openModal({ title: cal || Save._gap >= 3 ? 'GOOD TO SEE YOU!' : 'NEWS FROM THE GARDEN', icon: mail || unreadMail() ? 'icon_mail' : 'icon_sprout', lines, buttons });
}
// A letter can also arrive at the end of a run (the first one does).
onNote((ev) => { if (ev === 'end' && checkMail()) toast('A LETTER ARRIVED IN THE MAILBOX!'); });

// ---------- Screen: the mailbox ----------
function updateMail() {
  const got = Save.mail.got, n = got.length;
  if (G.letter) {
    if (pressed(...K_BACK, ...K_OK) || Input.mouseHit) { G.letter = null; Audio_.sfx('select'); }
    return false;
  }
  menuNav(n + 1);
  let click = -1;
  for (let i = 0; i < n; i++) if (hoverRow(i, VW / 2 - 130, 48 + i * 13 - 3, 260, 13)) click = i;
  const bw = textW('BACK') + 20;
  if (hoverRow(n, VW / 2 - bw / 2, 199, bw, 13) && Input.mouseHit) return true;
  if (pressed(...K_BACK) || (pressed(...K_OK) && G.menuSel === n)) return true;
  const i = pressed(...K_OK) && G.menuSel < n ? G.menuSel : click >= 0 && Input.mouseHit ? click : -1;
  if (i >= 0) {
    // newest first
    const id = got[n - 1 - i];
    G.letter = { id, fresh: !Save.mail.read.includes(id) };
    readLetter(id);
    Audio_.sfx('confirm');
  }
  return false;
}
function drawMail() {
  drawTitleBg();
  dim(0.5);
  panel(VW / 2 - 144, 24, 288, 172);
  text('MAILBOX', VW / 2, 31, 'Y', 1, 1);
  const got = Save.mail.got, n = got.length;
  if (!n) text('NO LETTERS YET', VW / 2, 90, 'l', 1, 1);
  for (let i = 0; i < n; i++) {
    const id = got[n - 1 - i], l = LETTER_BY[id], sel = i === G.menuSel, unread = !Save.mail.read.includes(id), y = 48 + i * 13;
    if (sel) pointer(VW / 2 - 136, y);
    // a little envelope: white while unread
    const ex = VW / 2 - 122;
    rect(ex, y, 11, 8, '0'); rect(ex + 1, y + 1, 9, 6, unread ? 'L' : 'm');
    for (let k = 0; k < 4; k++) { rect(ex + 1 + k, y + 1 + k, 1, 1, unread ? 'l' : 'd'); rect(ex + 9 - k, y + 1 + k, 1, 1, unread ? 'l' : 'd'); }
    if (unread) rect(ex + 5, y + 4, 1, 2, 'r');
    text(l.title, VW / 2 - 104, y, sel ? 'Y' : unread ? 'w' : 'l', 1);
    if (unread && Math.floor(G.time * 3) % 3) text('NEW', VW / 2 + 130, y, 'P', 1, 2);
  }
  const C = Save.cal, k = C.step % 7;
  text('DAILY GIFTS: ONE FOR EVERY DAY YOU PLAY', VW / 2, 166, 'c', 1, 1);
  for (let i = 0; i < 7; i++) {
    const x = VW / 2 - 70 + i * 20 + 3, got = i < k;
    rect(x, 177, 14, 12, '0'); rect(x + 1, 178, 12, 10, got ? 'h' : '1');
    if (i === k && Math.floor(G.time * 2) % 2) boxFrame(x, 177, 14, 12, 'Y');
    text(String(i + 1), x + 7, 180, got ? '0' : 'l', 0, 1);
  }
  const back = G.menuSel === n;
  text('BACK', VW / 2, 202, back ? 'Y' : 'l', 2, 1);
  if (back) pointer(VW / 2 - textW('BACK') / 2 - 10, 202);
  if (G.letter) drawLetter(LETTER_BY[G.letter.id], G.letter.fresh);
}
function drawLetter(l, fresh) {
  dim(0.5);
  const lines = [].concat(...l.lines.map(t => wrapText(t, 228)));
  const h = 46 + lines.length * 10 + 24, y = Math.round((VH - h) / 2), x = VW / 2 - 128;
  rect(x - 1, y - 1, 258, h + 2, '0');
  rect(x, y, 256, h, 'A'); rect(x + 2, y + 2, 252, h - 4, 'a');
  rect(x, y + h - 2, 256, 2, 'e');
  text(l.title, VW / 2, y + 8, '1', 0, 1);
  lines.forEach((t, i) => text(t, x + 14, y + 24 + i * 10, '0', 0));
  text('- MISTER RIBBIT', x + 242, y + 26 + lines.length * 10, '1', 0, 2);
  const g = giftText(l.gift);
  text((fresh ? 'GIFT: ' : 'GIFT TAKEN: ') + g, VW / 2, y + h - 14, fresh ? 'R' : '3', 0, 1);
}
