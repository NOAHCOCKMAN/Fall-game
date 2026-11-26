// ---------- THE UNTOLD LOVE STORY OF LILAH: scenes ----------
function bigText(c, s, x, y, size, p, col = '#fff', o = {}) { if (p <= 0) return; const k = backOut(clamp(p * 2.5)); c.save(); c.translate(x, y); c.scale(k, k); if (o.rot) c.rotate(o.rot);
  text(c, s, 0, 0, size, col, { stroke: o.stroke || '#1a1410', sw: size * .14, shadow: 'rgba(0,0,0,.35)' }); c.restore(); }
function photoProp(c, key, x, y, w, rot = 0, frame = true) { const im = IMG[key], m = FACES[key].meta, h = w * m.h / m.w; c.save(); c.translate(x, y); c.rotate(rot);
  if (frame) { c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 30; fillRR(c, -w / 2 - 18, -h / 2 - 18, w + 36, h + 80, 8, '#fdfcf6'); c.shadowBlur = 0; } c.drawImage(im, -w / 2, -h / 2, w, h); c.restore(); }
const ORANGE = '#f26b21', NAVY = '#13294b';
function arena(c, t, dim = 0) {
  const g = c.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#0b1020'); g.addColorStop(1, '#1d2a44'); c.fillStyle = g; c.fillRect(0, 0, W, 640);
  const r = rng(4); for (let i = 0; i < 260; i++) { const x = r() * W, y = 220 + r() * 380; circ(c, x, y, 5 + r() * 4, ['#f26b21', '#13294b', '#ffffff', '#c9d6e3'][(i * 7) % 4]); }
  for (let i = 0; i < 18; i++) { const x = (i * 137 + t * 30) % W; c.save(); c.globalAlpha = .5 * Math.max(0, Math.sin(t * 9 + i * 3)); circ(c, x, 260 + (i * 53) % 300, 6, '#fff'); c.restore(); }
  c.fillStyle = '#e9f3fb'; c.fillRect(0, 640, W, 440); c.fillStyle = 'rgba(160,200,230,.35)'; for (let i = 0; i < 10; i++) ell(c, (i * 251) % W, 760 + (i * 97) % 280, 220, 18);
  fillRR(c, 0, 600, W, 50, 0, '#f6f6f6'); line(c, [0, 650, W, 650], ORANGE, 8); line(c, [0, 840, W, 840], '#d62828', 10); line(c, [W / 2, 650, W / 2, 1080], '#2a5bd7', 8);
  if (dim) { c.fillStyle = `rgba(0,0,0,${dim})`; c.fillRect(0, 0, W, H); } }
function spotlight(c, x, a = .25) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; poly(c, [x - 70, -10, x + 70, -10, x + 330, 980, x - 330, 980], '#fff6d6'); ell(c, x, 960, 330, 50, 'rgba(255,246,214,.5)'); c.restore(); }
function stick(c, x, y, s, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); fillRR(c, -7, -10, 14, 330, 6, '#6b4a2b'); fillRR(c, -7, -10, 14, 60, 4, '#222'); c.save(); c.translate(0, 318); c.rotate(-1.2); fillRR(c, -10, -8, 110, 26, 10, '#222'); c.restore(); c.restore(); }
function leon(c, x, y, s, o = {}) { const j = person(c, Object.assign({ who: 'leon', x, y, s, age: 'adult', shirt: ORANGE, outfit: 'jersey', num: '29', pants: NAVY, shoes: '#111', armColor: ORANGE }, o)); if (o.stick !== false) stick(c, j.handR.x, j.handR.y, s * 1.05, -.25); return j; }
function poster(c, x, y, w, rot, k = 1) { if (k <= 0) return; const h = w * 1.3; c.save(); c.translate(x, y); c.rotate(rot); c.scale(backOut(clamp(k)), backOut(clamp(k)));
  fillRR(c, -w / 2, -h / 2, w, h, 6, '#fff', '#c8a0b0', 3); fillRR(c, -w / 2 + 10, -h / 2 + 10, w - 20, h - 60, 4, ORANGE); drawFace(c, 'leon', 0, -h * .08, w * .55);
  heart(c, w * .32, -h * .4, w * .1, '#ff4d6d'); text(c, 'LEON 29', 0, h / 2 - 26, w * .13, NAVY); line(c, [-w * .1, -h / 2 - 6, w * .1, -h / 2 - 6], '#bbb', 6); c.restore(); }
function bobblehead(c, x, y, s, t, sad = 0) { c.save(); c.translate(x, y); c.scale(s, s);
  fillRR(c, -90, -30, 180, 40, 8, NAVY); text(c, 'LEON 29', 0, -10, 24, '#fff'); fillRR(c, -40, -140, 80, 115, 20, ORANGE); text(c, '29', 0, -85, 34, '#fff');
  for (const sx of [-1, 1]) fillRR(c, sx * 40 - 12, -130, 24, 80, 12, ORANGE); line(c, [0, -140, 0, -165], '#ddd', 6);
  const bob = Math.sin(t * (sad ? 2 : 7)) * (sad ? .08 : .25), drop = sad ? 12 : 0; c.save(); c.translate(0, -170 + drop); c.rotate(bob); drawFace(c, 'leon', 0, -95, 150, 0, { tears: sad }); c.restore(); c.restore(); }
function bedroom(c, t, dim = 0) { c.fillStyle = '#f7cfdc'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.35)'; for (let y = 30; y < 760; y += 80) for (let x = 0; x < W; x += 80) heartPath(c, x + (y / 80 % 2) * 40, y, 10), c.fill();
  c.fillStyle = '#c99772'; c.fillRect(0, 760, W, 320); fillRR(c, 80, 600, 520, 200, 20, '#fff', '#e3b2c3', 4); fillRR(c, 80, 560, 140, 120, 30, '#ffe3ec'); fillRR(c, 1420, 610, 340, 190, 10, '#e9d3bf', '#b69378', 4);
  if (dim) { c.fillStyle = `rgba(30,30,60,${dim})`; c.fillRect(0, 0, W, H); } }
const POSTERS = [[300, 230, -.08], [560, 180, .05], [820, 240, -.03], [1100, 190, .07], [1360, 230, -.06], [1620, 200, .04], [180, 480, .06], [1780, 470, -.07]];
function wedding(c, t) { sky(c, '#ffd9e4', '#fff5f8'); c.fillStyle = '#9fd47f'; c.fillRect(0, 760, W, 320); fillRR(c, 860, 760, 200, 320, 0, '#fff'); for (let i = 0; i < 40; i++) circ(c, 860 + (i * 37) % 200, 770 + (i * 53) % 300, 6, ['#ff8fab', '#ffd6e0'][i % 2]);
  c.save(); c.lineWidth = 26; c.strokeStyle = '#fff'; c.beginPath(); c.arc(960, 760, 420, PI, TAU); c.stroke(); c.restore(); for (let i = 0; i <= 18; i++) { const a = PI + i / 18 * PI; circ(c, 960 + Math.cos(a) * 420, 760 + Math.sin(a) * 420, 26, ['#ff8fab', '#ffffff', '#ffd6e0'][i % 3]); }
  for (let i = 0; i < 18; i++) { const k = (t * .3 + i / 18) % 1; c.save(); c.translate((i * 113) % W + Math.sin(t + i) * 30, k * 1100 - 40); c.rotate(t + i); ell(c, 0, 0, 10, 5, '#ff8fab'); c.restore(); } }
function guests(c, t, cheer = 0) { const r = rng(12); for (let i = 0; i < 10; i++) { const x = i < 5 ? 80 + i * 150 : 1240 + (i - 5) * 150, j = cheer * Math.abs(Math.sin(t * 9 + i)) * 25;
  drawToon(c, { x, y: 1120 - j, H: 400, skin: ['#f3cfb3', '#d9a27e', '#8d5a3b', '#f0c8a8', '#c68a62'][i % 5], hair: ['#3a2418', '#e5c27a', '#1e1410', '#7a5230', '#b0b0b0'][i % 5], style: ['boy', 'long', 'puffs', 'bob', 'boy2'][i % 5],
    top: ['#6a4c93', '#1982c4', '#8ac926', '#ff595e', '#ffca3a'][i % 5], bottom: '#2f3e5c', mouth: cheer ? 'open' : 'smile', eyes: 'happy', handL: cheer ? [-.3, -.4] : [-.07, .44], handR: cheer ? [.3, -.4] : [.07, .44] }); void r; } }
function couple(c, t, o = {}) { const xn = o.xn || 780, xl = o.xl || 1140;
  // veil behind Lilah's head
  c.save(); c.globalAlpha = .55; poly(c, [xl - 60, 220, xl + 60, 220, xl + 150, 700, xl - 150, 700], '#ffffff'); c.restore();
  const jn = person(c, { who: 'noah', x: xn, y: 960, age: 'adult', shirt: '#111', outfit: 'tie', tie: '#111', pants: '#111', shoes: '#111', handR: [.25, .05], hearts: o.hearts || 0 });
  const jl = person(c, { who: 'lilah', x: xl, y: 960, age: 'woman', gown: true, gownColor: '#ffffff', shoes: '#fff', handL: [-.25, .05], hearts: o.hearts || 0 });
  ell(c, (jn.handR.x + jl.handL.x) / 2, (jn.handR.y + jl.handL.y) / 2, 40, 30, '#ff8fab'); return { jn, jl }; }
function tv(c, x, y, s, t) { c.save(); c.translate(x, y); c.scale(s, s); fillRR(c, -180, -120, 360, 230, 14, '#222'); c.save(); rr(c, -160, -100, 320, 190, 6); c.clip(); arena(c, t); c.restore();
  c.save(); rr(c, -160, -100, 320, 190, 6); c.clip(); c.scale(.25, .25); leon(c, 0, 360, 1, {}); c.restore(); fillRR(c, -30, 110, 60, 30, 4, '#333'); c.restore(); }

/* ===== 1. Leon ===== */
const SC_LEON = { id: 'leon',
  music: [['horror', 0, 'reveal', .7], ['heroic', 'reveal', 'title', .9], ['orchestral', 'title', 'end', 1]],
  sfx: [['reveal', 'sting'], [['n4b', 1.6], 'pop'], ['title', 'boom'], [['title', .3], 'sparkle']],
  draw(c, t) {
    if (!after('reveal')) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { const r = rng(i + 3); circ(c, r() * W, ((t * 30 * (r() + .3)) + r() * H) % H, 1 + r() * 2, `rgba(255,255,255,${.15 + r() * .3})`); }
      const k = S('n2', .5, 2.5); if (k > 0) { c.save(); c.globalAlpha = k * .5; leon(c, 960, 960, 1.05, { stick: false }); c.restore(); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, 0, W, H); } return; }
    const z = 1 + .12 * easeIO(S('reveal', 0, 6)); c.save(); camera(c, 960, 540, z); arena(c, t, .25); spotlight(c, 960, .3);
    const j = leon(c, 960, 960, 1.08); c.restore();
    const lk = S('n3', 0, .5); if (lk > 0) { c.save(); c.globalAlpha = lk; fillRR(c, 80, 760, 760, 150, 10, 'rgba(10,15,30,.85)'); fillRR(c, 80, 760, 14, 150, 0, ORANGE);
      text(c, 'LEON DRAISAITL', 120, 812, 58, '#fff', { align: 'left' }); text(c, 'Professional hockey player · Oilers superstar', 120, 870, 28, '#f6c7a8', { align: 'left', font: FONT2, weight: 600 }); c.restore(); }
    if (after('n4b', 1.0)) { const k = easeIn(S('n4b', 1.0, 1.6)); heart(c, lerp(-80, j.handL.x, k), lerp(700, j.handL.y - 40, k) - Math.sin(k * PI) * 160, 40, '#ff4d6d'); if (k >= 1) heart(c, j.handL.x, j.handL.y - 40, 40 + Math.sin(t * 9) * 4, '#ff4d6d'); }
    const tk = S('title', 0, .6); if (tk > 0) { c.save(); c.globalAlpha = tk; c.fillStyle = '#120a14'; c.fillRect(0, 0, W, H); c.restore();
      for (let i = 0; i < 12; i++) sparkle(c, 960 + Math.cos(i / 12 * TAU + t * .3) * 720, 520 + Math.sin(i / 12 * TAU + t * .3) * 330, 14 + 8 * Math.sin(t * 4 + i), tk, t);
      bigText(c, 'THE UNTOLD', 960, 330, 90, tk, '#fff'); bigText(c, 'LOVE STORY', 960, 450, 130, S('title', .2, .8), '#ff6a8a', { stroke: '#2a0a12' }); bigText(c, 'OF LILAH', 960, 590, 130, S('title', .4, 1), '#ffd23f', { stroke: '#2a0a12' });
      c.save(); c.globalAlpha = S('title', 1, 1.6); text(c, 'AN ORIGINAL DOCUMENTARY', 960, 710, 34, '#cbb7a4', { font: FONT2, weight: 600 }); c.restore(); }
  } };

/* ===== 2. The bedroom ===== */
const SC_BEDROOM = { id: 'bedroom',
  music: [['romance', 0, 'friends', .9, { bpm: 80 }], ['sneaky', 'friends', 'b8', .8], ['harp', 'b8', 'b9>', .8]],
  sfx: [[.2, 'harp'], ...POSTERS.map((p, i) => [['walls', i * .3], 'pop']), ['bobble', 'boing'], [['b4', 2.2], 'sparkle'], ['b6', 'squeak'], ['b9', 'ding']],
  draw(c, t) {
    bedroom(c, t);
    POSTERS.forEach(([x, y, r], i) => poster(c, x, y, 190, r, S('walls', i * .3, i * .3 + .35)));
    if (after('bobble')) { const k = backOut(S('bobble', 0, .5)); c.save(); c.translate(1590, 610); c.scale(k, k); bobblehead(c, 0, 0, .9, t); c.restore(); sparkle(c, 1660, 360, 30 * Math.sin(S('bobble', 0, 1.2) * PI), 1, t); }
    const fr = after('friends') && !after('b8');
    const jl = person(c, { who: 'lilah', x: 960, y: 980, age: 'woman', shirt: '#b36bff', skirt: '#3b2a5a', shoes: '#fff', hearts: after('b1') ? 1 : 0, handL: after('b4') ? [-.15, .05] : [-.07, .44], handR: after('b9') ? [.3, -.3] : [.07, .44] });
    if (after('b4') && !fr) { c.save(); c.translate(jl.handL.x + 40, jl.handL.y - 30); c.rotate(-.1); fillRR(c, -120, -80, 240, 160, 8, '#fffdf4', '#ff8fab', 4); text(c, 'Mrs. Draisaitl', 0, -20, 30, '#ff2d55', { font: FONT2, weight: 700 }); heart(c, -70, 30, 14); heart(c, 0, 40, 14); heart(c, 70, 30, 14); c.restore(); }
    if (after('b1')) for (let i = 0; i < 6; i++) { const k = (t * .5 + i / 6) % 1; heart(c, 960 + Math.sin(i * 2.2 + t) * 260, 520 - k * 380, 22, '#ff4d6d', 1 - k); }
    if (fr) { const k = easeOut(S('friends', 0, .8));
      drawToon(c, { x: lerp(-200, 300, k), y: 1000, H: 620, skin: '#f3cfb3', hair: '#e5c27a', style: 'long', top: '#3bceac', skirt: '#2a6f97', mouth: talk('friend1') > .2 ? 'open' : 'smile', eyes: 'closed', handR: [.3, -.1], lashes: true });
      drawToon(c, { x: lerp(2120, 1620, k), y: 1000, H: 600, skin: '#c68a62', hair: '#1e1410', style: 'puffs', top: '#ffca3a', skirt: '#6a4c93', mouth: talk('friend2') > .2 ? 'open' : 'smile', eyes: 'closed', handL: [-.3, -.1], lashes: true });
      if (after('b6')) { fillRR(c, 220, 260, 300, 90, 30, '#fff', '#333', 4); text(c, "It's a phase.", 370, 305, 36, '#333', { font: FONT2, weight: 600 }); }
      if (after('b7')) { fillRR(c, 1420, 260, 360, 90, 30, '#fff', '#333', 4); text(c, 'Totally a phase.', 1600, 305, 36, '#333', { font: FONT2, weight: 600 }); } }
    if (after('b9')) stamp(c, 'DESTINY', 1340, 300, 70, S('b9', .8, 1.3), '#ff2d55', .1);
  } };

/* ===== 3. The problem ===== */
const SC_NOCALL = { id: 'nocall',
  music: [['sad', 0, 'end', .9]],
  sfx: [['unaware', 'scratch'], ['c4', 'thud', .35], ['c5', 'thud', .35], ['c6', 'thud', .35], ['rain', 'trombone']],
  draw(c, t) {
    const rain = after('rain');
    if (!after('never')) { c.save(); c.beginPath(); c.rect(0, 0, W / 2, H); c.clip(); bedroom(c, t, .35); poster(c, 300, 230, 190, -.08, 1); poster(c, 760, 200, 190, .05, 1);
        person(c, { who: 'lilah', x: 480, y: 980, age: 'woman', shirt: '#b36bff', skirt: '#3b2a5a', shoes: '#fff', hearts: after('unaware') ? 0 : 1, tears: after('c3') ? .8 : 0 }); c.restore();
      c.save(); c.beginPath(); c.rect(W / 2, 0, W / 2, H); c.clip(); c.translate(W / 2, 0); c.save(); c.translate(-W / 4, 0); arena(c, t, .3); c.restore(); leon(c, 480, 980, 1);
        if (after('unaware')) { fillRR(c, 600, 250, 300, 110, 30, '#fff', '#333', 4); text(c, 'Lilah who?', 750, 305, 44, '#333', { font: FONT2, weight: 700 }); } c.restore();
      fillRR(c, W / 2 - 6, 0, 12, H, 0, '#111');
      if (after('c3')) { const k = Math.floor(S('c3', 0, cd('c3')) * 6); text(c, 'Years of devotion: ' + (k + 1), 480, 120, 44, '#fff', { stroke: '#333' }); }
      return; }
    c.fillStyle = '#2b2f45'; c.fillRect(0, 0, W, H); c.fillStyle = '#3a3f5c'; c.fillRect(0, 780, W, 300);
    [['c4', 'PROPOSALS', 360], ['c5', 'CALLS', 960], ['c6', 'CHRISTMAS CARDS', 1560]].forEach(([cue, label, x]) => { const k = S(cue, 0, .5); if (k <= 0) return; c.save(); c.translate(x, 380); c.scale(backOut(k), backOut(k));
      fillRR(c, -230, -170, 460, 340, 20, '#fff', '#888', 4); if (cue === 'c4') ringBox(c, 0, 20, 1.6, 1, .5); if (cue === 'c5') phone(c, 0, -10, 1, 1, ''); if (cue === 'c6') { fillRR(c, -120, -80, 240, 150, 8, '#f6efdc', '#c8102e', 5); poly(c, [-120, -80, 0, 10, 120, -80], null, '#c8102e', 4); }
      text(c, label + ': 0', 0, 120, 40, '#d62828'); c.restore(); });
    person(c, { who: 'lilah', x: 960, y: 1330, age: 'woman', shirt: '#b36bff', skirt: '#3b2a5a', tears: 1 });
    if (rain) { for (let i = 0; i < 140; i++) { const x = (i * 137) % W, y = ((t * 900 + i * 71) % 1200) - 60; line(c, [x, y, x - 8, y + 30], 'rgba(170,200,255,.6)', 3); } cloud(c, 700, 60, 300, .9); cloud(c, 1300, 40, 340, .9);
      bigText(c, 'HEARTBREAKING.', 960, 640, 110, S('rain', 0, .5), '#9ad0ff', { stroke: '#123' }); }
  } };

/* ===== 4. Acceptance ===== */
const SC_ACCEPT = { id: 'accept',
  music: [['mystery', 0, 'pack', .9], ['villain', 'pack', 'end', .9]],
  sfx: [['clock', 'tap'], [['clock', .5], 'tap'], [['clock', 1], 'tap'], [['clock', 1.5], 'tap'], [['a2', .5], 'tap'], [['a2', 1.5], 'tap'], [['a2', 2.5], 'tap'], ['pack', 'zip'], [['a3', 3], 'whoosh']],
  draw(c, t) {
    if (!after('pack')) { c.fillStyle = '#1a1424'; c.fillRect(0, 0, W, H); const tick = Math.floor(t * 2) % 2, sw = tick ? .03 : -.03;
      if (after('clock')) { photoProp(c, 'clock', 960, 470, 560, sw); bigText(c, tick ? 'TICK' : 'TOCK', tick ? 1560 : 360, 480, 90, 1, '#ffd23f'); text(c, 'Time was running out.', 960, 900, 46, '#fff', { stroke: '#000' }); }
      else { person(c, { who: 'lilah', x: 960, y: 1000, age: 'woman', shirt: '#b36bff', skirt: '#3b2a5a', tears: .5 }); }
      return; }
    bedroom(c, t, .1); const k = S('pack', 0, cd('a3'));
    POSTERS.forEach(([x, y, r], i) => { const down = clamp(k * 10 - i); if (down >= 1) return; c.save(); c.translate(0, down * 600); poster(c, x, y, 190, r + down * 2, 1 - down * .3); c.restore(); });
    fillRR(c, 1300, 760, 360, 240, 8, '#c8a06a', '#7a5230', 5); text(c, 'LEON STUFF', 1480, 880, 46, '#5a3a1a'); c.save(); c.beginPath(); c.rect(1290, 500, 380, 280); c.clip(); bobblehead(c, 1480, 860, .8, t, 1); c.restore();
    const look = after('a3', 2.6);
    person(c, { who: 'lilah', x: 760, y: 980, age: 'woman', shirt: '#b36bff', skirt: '#3b2a5a', shoes: '#fff', handR: look ? [.05, -.62] : [.35, -.2], handL: look ? [-.05, -.62] : [-.1, .35] });
    if (look) { fillRR(c, 680, 200, 160, 70, 30, '#333'); circ(c, 715, 235, 26, '#9ad'); circ(c, 805, 235, 26, '#9ad'); bigText(c, 'OTHER OPTIONS?', 1120, 160, 80, S('a3', 2.6, 3.1), '#ffd23f'); }
  } };

/* ===== 5. Enter Noah ===== */
const SC_NOAH = { id: 'noah',
  music: [['camp', 'e1', 'there', .8], ['romance', 'there', 'end', .9, { bpm: 76 }]],
  sfx: [['cut', 'scratch'], ['e1', 'sting'], [['e3', 0], 'stampF'], [['e3', 1.4], 'stampF'], [['e3', 2.8], 'stampF'], ['there', 'harp'], ['e6', 'pop']],
  draw(c, t) {
    if (!after('e1')) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); return; }
    const there = after('there');
    sky(c, '#8fd3ff', '#eaf8ff'); for (let i = 0; i < 6; i++) roundTree(c, 100 + i * 340, 760, 300, '#4caf50'); c.fillStyle = '#9ad17a'; c.fillRect(0, 760, W, 320);
    if (!there) { spotlight(c, 960, .22); const k = easeOut(S('e1', 0, 1.2));
      person(c, { who: 'noah', x: lerp(2200, 960, k), y: 980, age: 'adult', shirt: '#1b1b1b', outfit: 'button', pants: '#2b2b2b', shoes: '#5a3d2b', handR: after('e2') ? [.3, -.4] : [.07, .44] });
      bigText(c, 'ENTER NOAH.', 960, 160, 120, S('e1', 0, .5) * (1 - S('nos', 0, .3)), '#ffd23f');
      ['NHL CONTRACT', 'STANLEY CUP', 'HOCKEY CAREER'].forEach((s, i) => { const kk = S('e3', i * 1.4, i * 1.4 + .4); if (kk > 0) stamp(c, 'NO ' + s, 420 + i * 540, 240, 50, kk, '#d62828', -.08 + i * .06); });
      return; }
    tv(c, 1620, 300, .7, t); text(c, '(on TV, 2,000 miles away)', 1620, 430, 26, '#333', { font: FONT2, weight: 600 });
    const jl = person(c, { who: 'lilah', x: 1080, y: 980, age: 'woman', shirt: '#b36bff', skirt: '#3b2a5a', shoes: '#fff', hearts: after('e6') ? .8 : 0 });
    const jn = person(c, { who: 'noah', x: 760, y: 980, age: 'adult', shirt: '#1b1b1b', outfit: 'button', pants: '#2b2b2b', shoes: '#5a3d2b', handR: after('e6') ? [.3, -.55 + Math.sin(t * 9) * .05] : [.07, .44] });
    const k = S('there', 0, .5); if (k > 0) { c.save(); c.globalAlpha = k; line(c, [500, 300, 640, 380], '#d62828', 8); poly(c, [640, 380, 600, 350, 618, 392], '#d62828'); text(c, 'ACTUALLY THERE', 360, 270, 52, '#d62828', { stroke: '#fff' }); c.restore(); }
    void jl; void jn;
  } };

/* ===== 6. The wedding ===== */
function scoreboard(c, t, k) { c.save(); c.translate(960, 420); c.scale(backOut(k), backOut(k)); fillRR(c, -620, -260, 1240, 520, 24, '#111', '#444', 10);
  fillRR(c, -580, -230, 1160, 90, 10, '#222'); text(c, 'FINAL', 0, -184, 64, '#ff3b3b', { shadow: '#ff3b3b' });
  for (const [x, who, sc, face] of [[-300, 'NOAH', 1, 'noah'], [300, 'LEON', 0, 'leon']]) { fillRR(c, x - 240, -120, 480, 340, 12, '#1a1a1a'); c.save(); rr(c, x - 220, -110, 160, 160, 8); c.clip(); c.fillStyle = '#333'; c.fillRect(x - 220, -110, 160, 160); drawFace(c, face, x - 140, -24, 110); c.restore();
    text(c, who, x + 70, -40, 64, '#fff'); text(c, String(sc), x, 140, 150, '#ffd23f', { shadow: '#ffb000' }); }
  c.restore(); }
const SC_WEDDING = { id: 'wedding',
  music: [['orchestral', 0, 'upset', 1], ['triumph', 'upset', 'end', 1]],
  sfx: [[.4, 'bell'], [1.0, 'bell'], [1.6, 'bell'], ['w2', 'stampF'], ['w3', 'stampF'], ['noah', 'tada'], [['noah', .2], 'sparkle'], ['upset', 'whoosh'], ['buzzer', 'honk'], [['buzzer', .2], 'fireworks']],
  draw(c, t) {
    if (after('upset')) { arena(c, t, .2); scoreboard(c, t, S('upset', 0, .6)); if (after('buzzer')) confetti(c, t - cu('buzzer'), 140, 3);
      bigText(c, 'THE GREATEST UPSET IN SPORTS HISTORY', 960, 960, 60, S('upset', .5, 1), '#ffd23f'); return; }
    wedding(c, t); guests(c, t, after('noah') ? 1 : 0);
    const { jn } = couple(c, t, { hearts: after('noah') ? 1 : 0 });
    fillRR(c, 610, 60, 700, 110, 20, '#fff', '#ff8fab', 6); text(c, 'SEPTEMBER 5, 2026', 960, 115, 60, '#ff4d6d');
    if (after('not1') && !after('noah')) { const k = easeOut(S('not1', 0, .8)); c.save(); c.translate(lerp(2200, 1560, k), 0); leon(c, 0, 980, .9, { stick: false }); c.restore(); stamp(c, 'NOPE', 1560, 420, 80, S('w2', .4, .9)); }
    if (after('w3') && !after('noah')) stamp(c, 'NOT AN NHL SUPERSTAR', 960, 330, 56, S('w3', 0, .5), '#d62828', .05);
    if (after('noah')) { bigText(c, 'BUT TO NOAH.', 960, 290, 110, S('noah', 0, .5) * (1 - S('w5', 0, .4)), '#ffd23f'); if (after('noah')) confetti(c, t - cu('noah'), 80, 8); }
    if (after('w5')) { const k = S('w5', 0, .4); c.save(); c.globalAlpha = k; fillRR(c, 1360, 240, 440, 150, 20, '#fff', '#333', 4); text(c, 'settling?', 1580, 290, 42, '#888', { font: FONT2, weight: 600 }); text(c, 'moving on?', 1580, 345, 42, '#888', { font: FONT2, weight: 600 }); c.restore(); }
    void jn;
  } };

/* ===== 7. The upset (the photo, the zoom, the bobblehead) ===== */
const PHOTO = document.createElement('canvas'); PHOTO.width = W; PHOTO.height = H;
const SC_ZOOM = { id: 'zoom',
  music: [['orchestral', 0, 'bobble', .9], ['sad', 'bobble', 'end', .9]],
  sfx: [['zoomnoah', 'sting'], [['zoomnoah', .1], 'whoosh'], ['bobble', 'trombone']],
  draw(c, t) {
    if (!after('bobble')) { c.fillStyle = '#e9dccb'; c.fillRect(0, 0, W, H);
      const off = PHOTO.getContext('2d'); off.save(); off.setTransform(1, 0, 0, 1, 0, 0); wedding(off, t); couple(off, t, { hearts: 1 }); off.restore();
      const zk = easeIO(S('zoomnoah', 0, 1.4)), z = 1 + 1.7 * zk; c.save(); camera(c, lerp(960, 860, zk), lerp(540, 330, zk), z);
      c.save(); c.translate(960, 500); c.rotate(-.02); fillRR(c, -580, -380, 1160, 840, 10, '#fff'); c.drawImage(PHOTO, -540, -344, 1080, 608); text(c, 'Noah & Lilah · 9.5.26', 0, 380, 48, '#2a3d8f', { font: FONT2, weight: 600 }); c.restore(); c.restore();
      if (after('zoomnoah')) { c.save(); c.globalAlpha = .5 * S('zoomnoah', .3, 1); for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; line(c, [960 + Math.cos(a) * 600, 540 + Math.sin(a) * 600, 960 + Math.cos(a) * 1200, 540 + Math.sin(a) * 1200], '#fff', 8); } c.restore(); }
      const k = S('z1', 0, .5) * (1 - S('zoomnoah', 0, .3)); if (k > 0) { c.save(); c.globalAlpha = k; fillRR(c, 1380, 120, 480, 220, 16, '#111'); text(c, "LEON'S FANS", 1620, 170, 34, '#f6c7a8'); text(c, 'MILLIONS', 1620, 250, 72, ORANGE); c.restore(); }
      const k2 = S('z2', 1.2, 1.7); if (k2 > 0) { c.save(); c.globalAlpha = k2; fillRR(c, 60, 760, 640, 200, 16, '#111'); text(c, "NOAH'S FANS", 380, 810, 34, '#f6c7a8'); text(c, '1 (THE ONE)', 380, 890, 68, '#ff6a8a'); c.restore(); }
      return; }
    c.fillStyle = '#1e2233'; c.fillRect(0, 0, W, H); for (let i = 0; i < 120; i++) { const x = (i * 137) % W, y = ((t * 700 + i * 71) % 1200) - 60; line(c, [x, y, x - 6, y + 26], 'rgba(170,200,255,.35)', 3); }
    fillRR(c, 560, 720, 800, 30, 6, '#5a3a1a'); fillRR(c, 700, 500, 520, 230, 8, '#c8a06a', '#7a5230', 5); text(c, 'LEON STUFF', 960, 690, 44, '#5a3a1a');
    c.save(); c.beginPath(); c.rect(680, 100, 560, 520); c.clip(); bobblehead(c, 960, 640, 1.1, t, 1); c.restore();
    for (let i = 0; i < 3; i++) { const k = (t * .4 + i / 3) % 1; c.save(); c.globalAlpha = 1 - k; text(c, '?', 1180 + i * 60, 260 - k * 120, 70 + i * 10, '#fff'); c.restore(); }
  } };

/* ===== 8. The end ===== */
const SC_END = { id: 'end',
  music: [['romance', 0, 'congrats', .7, { bpm: 66 }], ['orchestral', 'congrats', 'card>', 1]],
  sfx: [['f1', 'sting'], ['congrats', 'tada'], [['congrats', .3], 'bell'], [['congrats', .9], 'bell'], [['card', 1], 'sparkle']],
  draw(c, t) {
    c.fillStyle = '#140c1c'; c.fillRect(0, 0, W, H);
    if (!after('congrats')) { bigText(c, 'THE END.', 960, 380, 220, S('f1', 0, .5), '#ffd23f', { stroke: '#3a0a12' });
      const k = S('f2', 0, cd('f2')); const words = 'A love story about dreams, heartbreak, acceptance, and ultimately...'; c.save(); c.globalAlpha = clamp(k * 3); text(c, words, 960, 600, 46, '#fff', { font: FONT2, weight: 600 }); c.restore();
      bigText(c, 'lowering your standards.', 960, 700, 74, S('f2', cd('f2') - 1.4, cd('f2') - .9), '#ff6a8a'); return; }
    const k = S('congrats', 0, .6); for (let i = 0; i < 16; i++) sparkle(c, 960 + Math.cos(i / 16 * TAU + t * .25) * 780, 540 + Math.sin(i / 16 * TAU + t * .25) * 400, 14 + 8 * Math.sin(t * 4 + i), k, t);
    for (const [x, key, rot] of [[720, 'noah', -.08], [1200, 'lilah', .08]]) { c.save(); c.translate(x, 380); c.rotate(rot); c.scale(backOut(k), backOut(k)); heartPath(c, 0, 60, 230); c.fillStyle = '#ff4d6d'; c.fill(); c.save(); heartPath(c, 0, 60, 210); c.clip(); c.fillStyle = '#ffd6e0'; c.fillRect(-260, -260, 520, 520); drawFace(c, key, 0, 10, 190); c.restore(); c.restore(); }
    bigText(c, 'Congratulations, Noah & Lilah', 960, 720, 84, S('congrats', .3, .9), '#ffd23f', { stroke: '#3a0a12' });
    bigText(c, 'SEPTEMBER 5, 2026', 960, 850, 56, S('congrats', .8, 1.3), '#fff');
    confetti(c, t - cu('congrats'), 120, 5);
  } };

const SCENES = [SC_LEON, SC_BEDROOM, SC_NOCALL, SC_ACCEPT, SC_NOAH, SC_WEDDING, SC_ZOOM, SC_END];
const TRANS = ['iris', 'pageflip', 'wipe', 'diag', 'star', 'heart', 'pageflip'];
