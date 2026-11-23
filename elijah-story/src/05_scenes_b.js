// ---------- scenes 8-14 ----------
function desert(c, t, dusk = 0) { sky(c, dusk ? '#ff7b54' : '#6ec3f4', dusk ? '#ffd28a' : '#ffe9c2'); sun(c, 1600, dusk ? 560 : 170, 90, t);
  poly(c, [-50, 760, 200, 520, 520, 520, 640, 760], '#c8643c'); poly(c, [1250, 760, 1380, 470, 1720, 470, 1880, 760], '#b85a34'); fillRR(c, 1380, 460, 340, 20, 4, '#9c4a2a');
  c.fillStyle = '#e9b872'; c.fillRect(-50, 740, W + 100, 400); c.fillStyle = '#ddaa62'; for (let i = 0; i < 9; i++) ell(c, (i * 233) % W, 820 + (i * 71) % 220, 120, 14);
  for (const [x, s] of [[180, 1], [1150, .8], [1750, 1.1]]) cactus(c, x, 800, s); }
function cactus(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); fillRR(c, -26, -260, 52, 270, 26, '#2f8f4a'); fillRR(c, -90, -170, 30, 90, 15, '#2f8f4a'); fillRR(c, -90, -100, 70, 28, 14, '#2f8f4a');
  fillRR(c, 60, -210, 30, 110, 15, '#2f8f4a'); fillRR(c, 20, -120, 70, 28, 14, '#2f8f4a'); c.restore(); }
function tumbleweed(c, x, y, s, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = '#a0794a'; c.lineWidth = 4; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(0, 0, 60 * s, 30 * s, i * .35, 0, TAU); c.stroke(); } c.restore(); }
function photoFrame(c, x, y, s, key, rot = 0) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); fillRR(c, -80, -100, 160, 200, 8, '#f6e7c8', '#8a5a2b', 8); c.save(); rr(c, -64, -84, 128, 168, 4); c.clip(); c.fillStyle = '#cfe8ff'; c.fillRect(-64, -84, 128, 168); drawFace(c, key, 0, 10, 110); c.restore(); heart(c, 50, -80, 20, '#ff4d6d'); c.restore(); }

/* ===== 8. THE ARIZONA INCIDENT ===== */
const SC_ARIZONA = { id: 'arizona',
  music: [['country', 0, 'tumble', .9], ['country', 'wheresEmma', 'wheresEmma>', 1, { bpm: 116 }], ['country', 'z7', 'z9>', .6]],
  sfx: [['tumble', 'tumbleweed'], [['tumble', .2], 'whistle'], ['z6', 'sting'], ['z7', 'whoosh']],
  draw(c, t) {
    const song = after('wheresEmma') && !after('z7');
    desert(c, t, song ? 1 : 0);
    if (!song) { fillRR(c, 1460, 520, 300, 140, 10, '#2a7a3a', '#fff', 6); text(c, 'WELCOME TO', 1610, 565, 30, '#fff'); text(c, 'ARIZONA', 1610, 615, 54, '#fff'); line(c, [1520, 660, 1520, 780], '#777', 10); line(c, [1700, 660, 1700, 780], '#777', 10); }
    if (!song) {
      const deadpan = after('tumble') && !after('wheresEmma'), look = after('z6');
      person(c, { who: 'mia', x: 1200, y: 940, age: 'woman', shirt: '#f2c14e', skirt: '#2a9d8f', shoes: '#8a5a2b', handR: after('z3') && !after('tumble') ? [.3, -.55 + Math.sin(t * 9) * .05] : [.1, .35], handL: [-.1, .35] });
      const je = person(c, { who: 'elijah', x: 720, y: 940, age: 'adult', shirt: '#6f8fb0', pants: '#2b2b2b', shoes: '#8a5a2b', headRot: deadpan ? -.04 : 0, handL: look ? [-.25, -.6] : [-.1, .35], handR: look ? [.3, .05] : [.1, .35] });
      if (look) photoFrame(c, je.handR.x + 30, je.handR.y - 60, .9, 'emma', .1);
      if (after('tumble')) tumbleweed(c, lerp(-150, 2100, S('tumble', 0, 2.2)), 880 - Math.abs(Math.sin(t * 6)) * 60, 1.2, t * 6);
      if (after('nod')) { const nod = Math.sin(t * 7) * .06; c.save(); c.globalAlpha = .9; fillRR(c, 1320, 330, 360, 110, 30, '#fff', '#333', 4); text(c, 'blah blah blah', 1500, 385, 40, '#333', { font: FONT2, weight: 600 }); c.restore(); void nod; }
    } else { // the song: wandering the desert with her picture
      const k = S('wheresEmma', 0, cd('wheresEmma')), x = lerp(300, 1500, k), wp = Math.sin(t * 5);
      bigfoot(c, 1560, 470, .32, { wave: k > .55 && k < .75, armUp: k > .55 && k < .75 });
      const je = person(c, { who: 'elijah', x, y: 930, age: 'adult', shirt: '#6f8fb0', pants: '#2b2b2b', shoes: '#8a5a2b', footL: [wp * .14, -Math.max(0, wp) * .1], footR: [-wp * .14, -Math.max(0, -wp) * .1], handR: [.3, -.1], handL: [-.4, -.5] });
      photoFrame(c, je.handR.x + 30, je.handR.y - 60, .9, 'emma', .1 + Math.sin(t * 3) * .05);
      for (let i = 0; i < 3; i++) heart(c, je.head.x + 120 + i * 30, je.head.y - 150 - ((t * 60 + i * 50) % 140), 16, '#ff4d6d', .7); }
    if (after('z7')) { const k = S('z7', 0, .4); if (k > 0 && !after('nod')) { const L = [['PHYSICALLY:', 'ARIZONA', 840], ['EMOTIONALLY:', 'INDIANA', 520], ['MENTALLY:', 'NEAR EMMA', 300]];
      L.forEach(([a, b, y], i) => { const kk = S('z7', i * 1.3, i * 1.3 + .4); if (kk <= 0) return; fillRR(c, 90, y - 50, 420, 100, 14, `rgba(255,255,255,${kk})`); text(c, a, 300, y - 18, 30, '#555'); text(c, b, 300, y + 22, 40, '#d62839'); line(c, [510, y, 640, y], '#fff', 6); }); } }
    karaoke(c, CUR.sc, t);
  } };

/* ===== 9. ONE GLIMMER OF HOPE ===== */
function airplane(c, x, y, s, faceKey2) { c.save(); c.translate(x, y); c.scale(s, s); fillRR(c, -220, -40, 440, 80, 40, '#f4f6f8', '#8a96a3', 4); poly(c, [-40, 0, 60, 0, -20, 160, -90, 160], '#d0d7de'); poly(c, [-40, 0, 60, 0, -20, -150, -90, -150], '#d0d7de');
  poly(c, [-200, -10, -160, -10, -210, -110, -240, -110], '#d62839'); for (let i = 0; i < 6; i++) circ(c, -100 + i * 45, -8, 12, '#a9d6ef'); if (faceKey2) { c.save(); c.beginPath(); c.arc(130, -8, 30, 0, TAU); c.clip(); drawFace(c, faceKey2, 130, -4, 46); c.restore(); } c.restore(); }
const SC_GLIMMER = { id: 'glimmer',
  music: [['mystery', 0, 'pack', .7], ['circus', 'pack', 'reunite', .8], ['romance', 'reunite', 'superbowl', 1, { bpm: 60 }], ['triumph', 'superbowl', 'g10', 1], ['horror', 'g10', 'g10>', .8]],
  sfx: [['buzz', 'buzz'], [['g2', .3], 'sparkle'], ['g3', 'ding'], ['pack', 'zip'], [['pack', .3], 'whoosh'], [['g4', 1.2], 'flyby'], ['plane', 'plane', 3], ['reunite', 'harp'], [['reunite', 1], 'fireworks'], ['g10', 'scratch'], [['g10', .1], 'horrorHit']],
  draw(c, t) {
    if (!after('plane')) { desert(c, t, 0); const slow = after('buzz') && !after('pack') ? 1 : 0;
      if (slow) { c.fillStyle = 'rgba(255,200,120,.18)'; c.fillRect(0, 0, W, H); }
      const gone = after('g4', .9), zoom = S('g4', .9, 1.3);
      person(c, { who: 'mia', x: 1300, y: 940, age: 'woman', shirt: '#f2c14e', skirt: '#2a9d8f', shoes: '#8a5a2b', handL: [-.3, -.2], handR: [.3, -.2] });
      if (after('g5')) for (let i = 0; i < 3; i++) text(c, '?', 1240 + i * 60, 380 - i * 30 - Math.sin(t * 4 + i) * 10, 70 + i * 10, '#2b2d42', { stroke: '#fff' });
      if (!gone) { const je = person(c, { who: 'elijah', x: 700, y: 940, age: 'adult', shirt: '#6f8fb0', pants: '#2b2b2b', shoes: '#8a5a2b', bigEyes: after('g3') ? 1 : 0, handR: [.25, -.05], handL: [-.1, .35] });
        phone(c, je.handR.x + 20, je.handR.y - 40, .9, after('buzz') ? 1 : 0, 'hey :)');
        if (after('buzz') && !after('pack')) { sparkle(c, je.handR.x + 40, je.handR.y - 110, 40 * (.7 + .3 * Math.sin(t * 6)), 1, t); }
        if (after('pack')) { suitcase(c, 520, 940, .8, null); for (let i = 0; i < 10; i++) { const k = ((t - cu('pack')) * 3 + i / 10) % 1; c.save(); c.translate(lerp(900, 520, k), 600 - Math.sin(k * PI) * 260); c.rotate(k * 9 + i); fillRR(c, -25, -18, 50, 36, 4, ['#ff4d6d', '#4d96ff', '#ffd23f', '#3bceac'][i % 4]); c.restore(); } } }
      else { for (let i = 0; i < 6; i++) { c.save(); c.globalAlpha = 1 - zoom; line(c, [700 - i * 80, 600 + i * 40, 200 - i * 120, 600 + i * 40], '#fff', 10); c.restore(); } puff(c, 650, 880, 80 * zoom + 30, 1 - zoom); }
      bigText(c, 'ONE. SINGLE. GLIMMER.', 960, 200, 92, S('g3', 0, .5) * (1 - S('pack', 0, .3)), '#ffd23f');
    } else if (!after('reunite')) { sky(c, '#7ec8ff', '#e6f6ff'); for (let i = 0; i < 5; i++) cloud(c, ((i * 500 - (t * 300)) % 2400 + 2400) % 2400 - 250, 200 + i * 130, 150);
      airplane(c, lerp(-300, 2200, S('plane', 0, cd('g7') + .6)), 520, 1.4, 'elijah');
    } else { const sb = after('superbowl'); sky(c, sb ? '#1b1f4a' : '#ffb36b', sb ? '#3a3f8a' : '#ffe3b0'); c.fillStyle = sb ? '#2f7d32' : '#8fd16a'; c.fillRect(0, 760, W, 320);
      if (sb) { c.strokeStyle = '#fff'; c.lineWidth = 6; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(i * 280 - 100, 760); c.lineTo(i * 280 - 400, 1080); c.stroke(); } }
      const run = easeOut(S('reunite', 0, 2.2)), wp = Math.sin(t * 4), hug = run >= 1;
      for (let i = 0; i < 5; i++) { const k = ((t - cu('reunite')) * .6 + i * .2) % 1; if (after('reunite', 1)) burstSparkles(c, 300 + i * 340, 260, 180, k, 12, i + 4); }
      const je = person(c, { who: 'elijah', x: lerp(200, 840, run), y: 930, age: 'adult', shirt: '#6f8fb0', pants: '#2b2b2b', shoes: '#eee', footL: hug ? [0, 0] : [wp * .15, -.05], footR: hug ? [0, 0] : [-wp * .15, -.05], handL: sb ? [-.3, -.75] : [-.3, -.1], handR: sb ? [.3, -.75] : [.35, -.1], hearts: hug ? 1 : 0, headDy: sb ? -Math.abs(Math.sin(t * 8)) * 30 : 0 });
      person(c, { who: 'emma', x: lerp(1720, 1080, run), y: 930, age: 'woman', shirt: '#f4a6b8', skirt: '#7a4a9a', footL: hug ? [0, 0] : [-wp * .15, -.05], footR: hug ? [0, 0] : [wp * .15, -.05], wind: 1, handL: [-.3, -.1] });
      if (sb) { c.save(); c.translate(je.handR.x, je.handR.y - 30); fillRR(c, -14, -10, 28, 40, 4, '#c0c0c0'); poly(c, [-60, -10, 60, -10, 30, -120, -30, -120], '#e8e8e8', '#999', 3); c.restore(); confetti(c, t - cu('superbowl'), 120, 6); }
      if (after('g10')) { c.fillStyle = `rgba(0,0,0,${.55 * S('g10', 0, .3)})`; c.fillRect(0, 0, W, H); } }
  } };

/* ===== 10. THE DR PEPPER INCIDENT ===== */
function shirtText(c, j, lines, col = '#fff', k = 1) { const x = j.chest.x, y = j.chest.y - j.B * .03; lines.forEach((l, i) => text(c, l, x, y + i * j.B * .05 * k, j.B * .042 * k, col, { font: FONT2, weight: 700 })); }
const SC_DRPEPPER = { id: 'drpepper',
  music: [['hum', 0, 'parents', .9], ['sneaky', 'parents', 'crack', .9], ['sad', 'crack', 'fizz', .9], ['romance', 'fizz', 'p11>', .9]],
  sfx: [[.1, 'ding'], ['p3', 'whoosh'], [['p3', .3], 'thud', .3], ['shirts', 'zip'], ['flash', 'camera'], [['flash', .8], 'buzz'], ['crack', 'crack'], ['p8', 'trombone'], ['p10', 'stampF'], ['fizz', 'fizz', 2], [['fizz', 1], 'harp']],
  draw(c, t) {
    const shirts = after('shirts'), broken = after('crack') && !after('fizz'), back = easeOut(S('fizz', .8, 2));
    if (!after('parents')) { c.fillStyle = '#2a0a10'; c.fillRect(0, 0, W, H); for (let i = 0; i < 12; i++) { c.save(); c.translate(960, -100); c.rotate((i - 6) * .13 + Math.sin(t * .6) * .03); poly(c, [-20, 0, 20, 0, 80, 1300, -80, 1300], 'rgba(255,220,180,.12)'); c.restore(); }
      fillRR(c, 860, 640, 200, 300, 10, '#e9e2d0', '#a99', 4); drPepper(c, 960, 640, 2.2, 0, 1); bigText(c, 'THE SACRED FOUNDATION', 960, 150, 70, S('p1', 0, .5), '#ffd23f');
      if (after('p2')) person(c, { who: 'emma', x: 1420, y: 960, age: 'woman', shirt: '#f4a6b8', skirt: '#7a4a9a', handL: [-.3, -.2] });
      if (after('p3')) { const k = S('p3', 0, .6); person(c, { who: 'elijah', x: 480, y: 960, age: 'adult', shirt: '#6f8fb0', pants: '#2b2b2b' }); for (let i = 0; i < 12; i++) drPepper(c, lerp(-100, 300 + (i % 4) * 70, k), 990 - Math.floor(i / 4) * 95, .9, 0); }
      return; }
    c.fillStyle = '#f2e6d4'; c.fillRect(0, 0, W, H); c.fillStyle = '#c9a77c'; c.fillRect(0, 780, W, 300); fillRR(c, 100, 140, 400, 300, 8, '#fff', '#8a5a2b', 10);
    const sep = broken ? easeOut(S('crack', 0, .8)) * 300 : (after('crack') ? (1 - back) * 300 : 0);
    const ex = 800 - sep, mx = 1120 + sep;
    const je = person(c, { who: 'elijah', x: ex, y: 950, age: 'adult', shirt: shirts ? '#7a1424' : '#6f8fb0', pants: '#2b2b2b', red: after('flash') && !after('crack') ? .35 : 0, handR: shirts && !broken ? [.35, -.05] : [.1, .35], hearts: after('fizz', 1) ? 1 : 0 });
    const jm = person(c, { who: 'emma', x: mx, y: 950, age: 'woman', shirt: shirts ? '#7a1424' : '#f4a6b8', skirt: '#2b2b2b', red: after('flash') && !after('crack') ? .35 : 0, handL: shirts && !broken ? [-.35, -.05] : [-.1, .35], tears: broken ? .7 : 0, hearts: after('fizz', 1) ? 1 : 0 });
    if (shirts) { shirtText(c, je, ["I'M A", 'DR PEPPER']); shirtText(c, jm, ['BRING ME A', 'DR PEPPER &', "I'LL LOVE YOU", 'FOREVER'], '#fff', .78); }
    if (!after('crack')) { const sh = after('shirts');
      person(c, { who: 'stephanie', x: sh ? 380 : 1500, y: 980, age: 'woman', s: .9, shirt: '#e07a5f', skirt: '#3d405b', handL: [-.3, -.4], handR: sh ? [.45, -.25] : [.3, -.4], jaw: null });
      person(c, { who: 'luke', x: sh ? 1560 : 1720, y: 980, age: 'adult', s: .9, shirt: '#577590', pants: '#3d405b', handL: sh ? [-.45, -.25] : [-.3, -.4], handR: [.3, -.4] });
      if (!sh) { for (const [x, col] of [[1440, '#7a1424'], [1660, '#7a1424']]) fillRR(c, x - 60, 520, 120, 110, 10, col, '#3a0a12', 3); }
      if (sh) { c.save(); c.translate(1420, 420); fillRR(c, -70, -45, 140, 90, 12, '#222'); circ(c, 0, 0, 30, '#555'); circ(c, 0, 0, 18, '#9ad'); c.restore(); } }
    const fl = 1 - S('flash', 0, .5); if (after('flash') && fl > 0) { c.fillStyle = `rgba(255,255,255,${fl})`; c.fillRect(0, 0, W, H); }
    if (after('flash') && !after('crack')) { const k = S('flash', .4, 1.6); fillRR(c, 1460, 120, 380, 90, 12, '#222'); text(c, 'CRINGE LEVEL', 1650, 145, 30, '#fff'); fillRR(c, 1480, 170, 340 * k, 26, 8, k > .8 ? '#ff2a2a' : '#ffb21a');
      if (k > .9 && Math.sin(t * 20) > 0) text(c, 'CRITICAL', 1650, 250, 54, '#ff2a2a', { stroke: '#fff' }); }
    if (broken) { const k = S('crack', 0, .4); line(c, [960, 0, 930, 250, 990, 420, 940, 650, 980, 1080], '#3a2614', 10 * k); }
    if (after('p9') && !after('fizz')) { const k = S('p9', 0, .6); c.save(); c.translate(960, 420); c.scale(k, k); fillRR(c, -250, -200, 500, 360, 10, 'rgba(200,230,255,.4)', '#88a', 6);
      fillRR(c, -200, -150, 180, 220, 10, '#7a1424'); fillRR(c, 20, -150, 180, 220, 10, '#7a1424'); text(c, "I'M A DR PEPPER", -110, -40, 20, '#fff', { font: FONT2, weight: 700 }); text(c, 'LOVE YOU FOREVER', 110, -40, 18, '#fff', { font: FONT2, weight: 700 });
      fillRR(c, -150, 120, 300, 50, 8, '#f6efdc'); text(c, 'EXHIBIT A', 0, 146, 30, '#5a4020'); c.restore(); stamp(c, 'CONFIRMED', 960, 760, 80, S('p10', 0, .4)); }
    if (after('fizz')) { drPepper(c, 960, 520, 1.6, 0, 1); for (let i = 0; i < 30; i++) { const k = ((t - cu('fizz')) * 1.5 + i / 30) % 1; circ(c, 960 + Math.sin(i * 7) * 30 * k, 360 - k * 300, 4 + (i % 3), 'rgba(255,255,255,.8)'); } }
  } };

/* ===== 11. NORTH CAROLINA AND TREX LAWN CARE ===== */
function trexLogo(c, x, y, s, a = 1) { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s);
  fillRR(c, -420, -150, 840, 300, 30, '#111', '#d62828', 10); text(c, 'TREX', 0, -40, 170, '#d62828', { stroke: '#fff', sw: 10 }); text(c, 'LAWN CARE', 0, 90, 70, '#fff');
  // little T-rex mascot
  c.save(); c.translate(-330, 40); c.scale(.8, .8); ell(c, 0, 0, 60, 40, '#3bb273'); circ(c, 50, -40, 34, '#3bb273'); poly(c, [-60, 0, -120, 30, -60, 20], '#3bb273'); circ(c, 60, -50, 6, '#111'); line(c, [30, -15, 46, -5], '#3bb273', 8); fillRR(c, -20, 30, 16, 40, 6, '#3bb273'); fillRR(c, 15, 30, 16, 40, 6, '#3bb273'); c.restore(); c.restore(); }
function zeroTurn(c, x, y, s, t) { c.save(); c.translate(x, y + Math.sin(t * 40) * 1.5); c.scale(s, s); fillRR(c, -170, -70, 340, 70, 14, '#d62828', '#7a1212', 4); fillRR(c, -60, -140, 140, 70, 10, '#222'); fillRR(c, -40, -230, 80, 100, 14, '#333');
  for (const [wx, r] of [[-130, 50], [130, 34]]) { circ(c, wx, 0, r, '#1a1a1a'); circ(c, wx, 0, r * .4, '#888'); } c.restore(); }
function ncMap(c, t) { c.fillStyle = '#9ed0ec'; c.fillRect(0, 0, W, H); poly(c, [300, 120, 1100, 120, 1250, 300, 1480, 330, 1700, 560, 1640, 700, 1500, 980, 300, 980], '#f1e3b6', '#c9b27a', 4);
  poly(c, [560, 200, 760, 200, 770, 520, 560, 540], '#ffcf8b', '#c98b3a', 4); text(c, 'INDIANA', 665, 360, 32, '#a35d14'); poly(c, [1000, 560, 1560, 520, 1640, 600, 1500, 680, 980, 680], '#a8dc8c', '#5c9a3e', 4); text(c, 'NORTH CAROLINA', 1290, 615, 34, '#3e7a24'); }
const SC_TREX = { id: 'trex',
  music: [['country', 0, 'zoom', .7, { bpm: 110 }], ['romance', 'zoom', 'team', .8, { bpm: 72 }], ['rock', 'team', 'r9>', 1]],
  sfx: [[.4, 'plane', 2.5], [['r2', 0], 'thud', .3], [['r2', 1.4], 'thud', .3], [['r2', 2.8], 'thud', .3], ['zoom', 'whoosh'], ['r3', 'ding'], ['logo', 'boom'], [['logo', .1], 'sting'], ['montage', 'mow', 3], [['r7', 1.4], 'blower', 2], ['r9', 'tada']],
  draw(c, t) {
    if (!after('zoom')) { ncMap(c, t); const k = easeIO(S('r1', .2, 3)); airplane(c, lerp(665, 1290, k), lerp(330, 560, k) - Math.sin(k * PI) * 120, .5, 'elijah');
      ['MOUNTAINS', 'BEACHES', 'BARBECUE'].forEach((s, i) => { const kk = S('r2', i * 1.4, i * 1.4 + .4); if (kk > 0) stamp(c, s + ' ✗', 400 + i * 560, 860, 56, kk, '#d62839', -.1 + i * .08); }); return; }
    if (!after('team')) { street(c, t, 0); const k = easeIO(S('zoom', 0, 1)); c.save(); camera(c, 960, 520, 1 + .2 * k);
      farmhouse(c, 620, 780, .9); farmhouse(c, 1300, 780, .9); fillRR(c, 1180, 400, 240, 60, 10, '#fff', '#d62839', 4); text(c, "EMMA'S HOUSE", 1300, 430, 30, '#d62839');
      fillRR(c, 500, 400, 240, 60, 10, '#fff', '#2a6fdb', 4); text(c, "ELIJAH'S HOUSE", 620, 430, 30, '#2a6fdb'); c.save(); c.beginPath(); c.rect(1225, 618, 80, 70); c.clip(); drawFace(c, 'emma', 1265, 655, 60); c.restore();
      c.save(); c.beginPath(); c.rect(545, 618, 80, 70); c.clip(); drawFace(c, 'elijah', 585, 655, 60); c.restore(); line(c, [700, 560, 1180, 560], '#d62839', 6); text(c, '0.0 MILES', 940, 530, 46, '#d62839', { stroke: '#fff' });
      c.restore(); bigText(c, 'FOR PROXIMITY.', 960, 180, 110, S('r3', 0, .5), '#ff4d6d'); return; }
    // the crew + montage
    const mont = after('montage'); sky(c, '#7ec8ff', '#e6f6ff'); sun(c, 1700, 150, 80, t); for (let i = 0; i < 12; i++) pineTree(c, -40 + i * 170, 700, 300);
    c.fillStyle = '#6cc24a'; c.fillRect(0, 700, W, 380); c.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 720; y < H; y += 90) c.fillRect(0, y, W, 45);
    if (!mont) { person(c, { who: 'joseph', x: 520, y: 950, age: 'adult', shirt: '#d62828', pants: '#222', handR: [.4, -.1] }); person(c, { who: 'noah', x: 1400, y: 950, age: 'adult', shirt: '#d62828', pants: '#222', handL: [-.4, -.1] });
      person(c, { who: 'elijah', look: 'trex', x: 960, y: 950, age: 'adult', shirt: '#f2c230', pants: '#222', handL: [-.3, -.3], handR: [.3, -.3] });
      trexLogo(c, 960, 260, .8 * backOut(S('logo', 0, .5)), S('logo', 0, .2)); }
    else { const k = S('montage', 0, cd('r7') + cd('r8') + 1.5), panel = Math.min(3, Math.floor(k * 4));
      if (panel === 0 || panel === 2) { const x = 300 + ((t - cu('montage')) * 200) % 1500; zeroTurn(c, x, 930, 1, t); person(c, { who: 'elijah', look: 'trex', x: x + 10, y: 820, age: 'adult', s: .8, shirt: '#f2c230', pants: '#222', footL: [.15, -.25], footR: [.2, -.25], handL: [-.15, .1], handR: [.15, .1] });
        for (let i = 0; i < 20; i++) { const kk = (t * 3 + i / 20) % 1; c.fillStyle = '#3f9a32'; c.fillRect(x - 200 - kk * 200, 900 - Math.sin(kk * PI) * 80, 8, 4); } }
      if (panel === 1) { const j = person(c, { who: 'elijah', look: 'trex', x: 800, y: 950, age: 'adult', shirt: '#f2c230', pants: '#222', handR: [.45, .05], handL: [.2, .1] });
        fillRR(c, j.handR.x - 10, j.handR.y - 10, 160, 26, 10, '#ff7b00'); for (let i = 0; i < 30; i++) { const kk = (t * 1.5 + i / 30) % 1; c.save(); c.translate(j.handR.x + 160 + kk * 900, 900 - kk * 300 + Math.sin(i + t * 5) * 60); c.rotate(t * 5 + i); ell(c, 0, 0, 16, 8, ['#e76f51', '#f4a261', '#e9c46a'][i % 3]); c.restore(); } }
      if (panel === 3) { c.fillStyle = 'rgba(255,120,0,.15)'; c.fillRect(0, 0, W, H); sun(c, 960, 160, 140, t * 3); const j = person(c, { who: 'elijah', look: 'trex', x: 960, y: 950, age: 'adult', shirt: '#f2c230', pants: '#222', sweat: 1, handR: [.35, -.45], thumbR: true });
        text(c, '104°F', 1500, 300, 120, '#d62828', { stroke: '#fff' }); void j; }
      if (panel !== 3) { c.save(); c.globalAlpha = .9; fillRR(c, 1500, 820, 360, 160, 10, '#fff'); drawTruckSmall(c, 1680, 960, .5); c.restore(); }
      bigfoot(c, 1700, 700, .45, { hold: c => { fillRR(c, -6, 0, 12, 150, 4, '#ff7b00'); } }); }
    if (mont) { const r = after('r9') ? S('r9', 0, .5) : 0; if (r > 0) { c.save(); c.globalAlpha = r; text(c, 'LIFE WAS GOOD.', 960, 160, 100, '#fff', { stroke: '#2b2d42', sw: 14 }); c.restore(); } floatingRing(c, 1820, 120, .9); }
  } };
function drawTruckSmall(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); fillRR(c, -300, -170, 360, 130, 12, '#f6f6f6', '#999', 4); fillRR(c, 60, -200, 200, 160, 20, '#f6f6f6', '#999', 4); fillRR(c, 90, -185, 120, 70, 8, '#a9d6ef');
  text(c, 'TREX', -120, -110, 70, '#d62828'); text(c, 'Lawn Care', -120, -65, 30, '#111'); circ(c, -200, -30, 40, '#1a1a1a'); circ(c, 170, -30, 40, '#1a1a1a'); c.restore(); }

/* ===== 12. THE HAND-HOLDING EPIDEMIC ===== */
function park(c, t, scroll = 0) { sky(c, '#9fd8ff', '#eef9ff'); for (let i = -1; i < 8; i++) { const x = ((i * 320 - scroll) % 2560 + 2560) % 2560 - 320; roundTree(c, x, 760, 300, i % 2 ? '#5cbd60' : '#4caf50'); }
  c.fillStyle = '#8fd16a'; c.fillRect(0, 760, W, 320); c.fillStyle = '#d9cbb0'; c.fillRect(0, 860, W, 120); }
// one slap beat: reach starts at a, Emma's hand smacks at a + reachT
function slapBeat(t, a, reachT = .6) { const reach = easeIO(seg(t, a, a + reachT)), hit = t >= a + reachT, rec = hit ? easeOut(seg(t, a + reachT, a + reachT + .25)) : 0; return { reach: hit ? (1 - rec) * reach : reach, hit, flash: hit ? 1 - seg(t, a + reachT, a + reachT + .5) : 0 }; }
const SC_HANDS = { id: 'hands',
  music: [['romance', 0, 'h1>', .5, { bpm: 80 }], ['horror', 'slap1', 'h5', .9], ['mystery', 'therapy', 'couch', .6], ['sneaky', 'couch', 'sign', .7], ['ballad', 'holdYourHand', 'slap5', 1, { bpm: 76 }], ['sad', ['h14', .2], 'h14>', .6]],
  sfx: [[['slap1', .9], 'slap'], [['slap1', 1.0], 'scratch'], [['slap2', .55], 'slap'], [['slap3', .45], 'slap'], [['slap4', .5], 'slap'], ['therapy', 'pop'], ['scoot', 'zip'], ['sign', 'boing'], [['slap5', .5], 'slap'], [['slap5', 1.2], 'pianoKey']],
  draw(c, t) {
    const therapy = after('therapy') && !after('couch'), couch = after('couch') && !after('holdYourHand');
    if (therapy) { c.fillStyle = '#e8dccb'; c.fillRect(0, 0, W, H); c.fillStyle = '#b08a64'; c.fillRect(0, 760, W, 320); fillRR(c, 200, 160, 300, 220, 8, '#fff', '#8a5a2b', 10); text(c, 'Dr. Feelings', 350, 270, 36, '#5a4020');
      fillRR(c, 820, 600, 520, 120, 40, '#7a4a9a'); fillRR(c, 820, 520, 120, 200, 40, '#6a3a8a');
      // the hand on the couch, bandaged, with a little face
      c.save(); c.translate(1080, 560); c.rotate(-.2); ell(c, 0, 0, 120, 70, '#ecb59c'); for (let i = 0; i < 4; i++) fillRR(c, 60 + i * 2, -60 + i * 34, 90, 30, 14, '#ecb59c'); fillRR(c, -60, -70, 30, 140, 6, '#fff'); fillRR(c, 10, -70, 30, 140, 6, '#fff');
      circ(c, -20, -10, 8, '#222'); circ(c, 30, -10, 8, '#222'); const tk = talk('hand'); ell(c, 5, 25, 18, 5 + tk * 14, '#7a2230'); c.restore();
      drawToon(c, { x: 560, y: 900, H: 520, skin: '#d9a27e', hair: '#b0b0b0', style: 'boy2', top: '#3d5a80', bottom: '#2b2b2b', mouth: talk('therapist') > .2 ? 'open' : 'smile', handR: [.3, .1] });
      fillRR(c, 600, 640, 70, 90, 4, '#fff8dd'); return; }
    if (couch) { c.fillStyle = '#efe2cc'; c.fillRect(0, 0, W, H); c.fillStyle = '#b08a64'; c.fillRect(0, 780, W, 300); fillRR(c, 260, 600, 1400, 200, 40, '#2a6f97'); fillRR(c, 260, 480, 1400, 170, 40, '#22577a'); fillRR(c, 200, 520, 120, 280, 40, '#22577a'); fillRR(c, 1600, 520, 120, 280, 40, '#22577a');
      const scoot = easeOut(S('scoot', 0, .5)), reachA = after('scoot') && !after('sign') ? easeIO(S('h12', 0, .8)) : 0;
      person(c, { who: 'elijah', look: 'trex', x: 520, y: 860, age: 'adult', shirt: '#f2c230', pants: '#222', footL: [.12, -.1], footR: [.16, -.1], handR: after('sign') ? [.3, -.25] : [.3 + reachA * .5, -.3 - reachA * .1], handL: after('sign') ? [-.3, -.25] : [-.1, .2] });
      person(c, { who: 'emma', x: 1400 + scoot * 60, y: 860, age: 'woman', shirt: '#f4a6b8', skirt: '#7a4a9a', footL: [-.12, -.1], footR: [-.16, -.1], handL: [-.1, .2] });
      const gx0 = 660, gx1 = 1260 + scoot * 60; line(c, [gx0, 560, gx1, 560], '#ffd23f', 10); text(c, after('scoot') ? 'A LOT + 6 in.' : 'A LOT', (gx0 + gx1) / 2, 520, 50, '#ffd23f', { stroke: '#2b2d42' });
      for (const [cue, x] of [['h9', 280], ['h10', 960], ['h11', 1640]]) { if (!after(cue)) continue; const k = S(cue, 0, .4); c.save(); c.globalAlpha = k;
        drawToon(c, { x, y: 1100, H: 520, skin: ['#f0c8a8', '#8d5a3b', '#d9a27e'][(x / 680) | 0], hair: ['#3a2418', '#1e1410', '#e5c27a'][(x / 680) | 0], style: ['boy', 'puffs', 'bob'][(x / 680) | 0], top: ['#ff8c42', '#3bceac', '#b36bff'][(x / 680) | 0], bottom: '#2f3e5c', mouth: talk(cue === 'h9' ? 'p1' : cue === 'h10' ? 'p2' : 'p3') > .2 ? 'open' : 'smile' });
        text(c, '?', x + 120, 640, 90, '#2b2d42', { stroke: '#fff' }); c.restore(); }
      if (after('sign')) { const k = backOut(S('sign', 0, .5)); c.save(); c.translate(520, 420); c.scale(k, k); heartPath(c, 0, 0, 260); c.fillStyle = '#ff4d6d'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#fff'; c.stroke(); text(c, 'PLEASE', 0, -60, 60, '#fff'); text(c, 'LOVE ME', 0, 10, 60, '#fff'); c.restore(); }
      floatingRing(c, 1800, 120, .9); return; }
    // walking in the park (slaps) / the ballad
    const song = after('holdYourHand');
    if (!song) { park(c, t, t * 180); } else { c.fillStyle = '#1a1030'; c.fillRect(0, 0, W, H); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .25; poly(c, [700, -10, 1000, -10, 1250, 950, 450, 950], '#ffe6f0'); c.restore();
      c.fillStyle = '#2a1a40'; c.fillRect(0, 900, W, 180); for (let i = 0; i < 30; i++) { const k = ((t * .3 + i / 30) % 1); c.save(); c.translate((i * 197) % W, k * 1100 - 50); c.rotate(t + i); ell(c, 0, 0, 12, 6, '#ff4d6d'); c.restore(); } }
    let s = { reach: 0, flash: 0, hit: false };
    for (const [cue, a] of [['slap1', .3], ['slap2', .0], ['slap3', .0], ['slap4', .0], ['slap5', -.1]]) { if (!after(cue, -.5)) continue; const b = slapBeat(t, cu(cue) + a, cue === 'slap1' ? .6 : .5); if (t < cu(cue) + 2) s = b; }
    const walk = !song && !after('h5'), wp = Math.sin(t * 5);
    const ex = song ? 820 : 800, mx = song ? 1180 : 1100;
    const je = person(c, { who: 'elijah', look: 'trex', x: ex, y: 950, age: 'adult', shirt: '#f2c230', pants: '#222', footL: walk ? [wp * .12, -.05] : [0, 0], footR: walk ? [-wp * .12, -.05] : [0, 0], handR: [.07 + s.reach * .45, .44 - s.reach * .2], handL: [-.1, .35],
      bigEyes: s.flash > .3 ? 1 : 0, hearts: song && !after('slap5') ? .6 : 0, headDy: walk ? -Math.abs(wp) * 6 : 0 });
    const jm = person(c, { who: 'emma', x: mx, y: 950, age: 'woman', shirt: '#f4a6b8', skirt: '#7a4a9a', footL: walk ? [-wp * .12, -.05] : [0, 0], footR: walk ? [wp * .12, -.05] : [0, 0], handL: s.flash > 0 ? [-.5, .05] : [-.1, .35] });
    if (s.flash > 0) { comic(c, 'SLAP!', (je.handR.x + jm.handL.x) / 2, je.handR.y - 120, 60, 1 - s.flash * .9, -.1, '#ff6a6a'); c.save(); c.globalAlpha = s.flash * .5; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.restore(); }
    if (after('h5') && !song) { // the injured hand close-up
      const k = S('h5', 0, .5); c.save(); c.globalAlpha = k; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H); c.translate(960, 520); c.scale(2.2, 2.2); ell(c, 0, 0, 120, 70, '#ecb59c'); for (let i = 0; i < 4; i++) fillRR(c, 60, -60 + i * 34, 90, 30, 14, '#ecb59c');
      ell(c, 20, 0, 70, 40, 'rgba(255,60,60,.45)'); fillRR(c, -60, -70, 30, 140, 6, '#fff'); circ(c, -20, -10, 7, '#222'); circ(c, 30, -10, 7, '#222'); c.beginPath(); c.arc(5, 30, 16, PI + .3, -.3); c.strokeStyle = '#222'; c.lineWidth = 4; c.stroke(); c.restore();
      text(c, 'REJECTIONS: ' + (4 + Math.floor(S('h5', .5, 3) * 9995)), 960, 180, 70, '#ff4d6d', { stroke: '#fff' }); }
    if (after('slap5', 1.1)) { c.fillStyle = `rgba(0,0,0,${.6 * S('slap5', 1.1, 1.6)})`; c.fillRect(0, 0, W, H); stamp(c, 'DENIED. AGAIN.', 960, 400, 110, S('h14', 0, .4)); }
    karaoke(c, CUR.sc, t);
  } };

/* ===== 13. THE ENGAGEMENT RING DILEMMA ===== */
const SC_RING = { id: 'ring',
  music: [['sad', 0, 'engaged', .6], ['triumph', 'engaged', 'k3', .7], ['romance', 'k3', 'flashback', .9, { bpm: 70 }], ['horror', 'flashback', 'k7', .8], ['sad', 'k7', 'k9>', .7]],
  sfx: [['engaged', 'pop'], [['engaged', .5], 'pop'], [['engaged', 1], 'pop'], [['engaged', 1.2], 'fireworks'], ['store', 'ding'], [['store', .2], 'sparkle'], [['flashback', .4], 'slap'], [['k7', .3], 'zip']],
  draw(c, t) {
    if (!after('k3')) { c.fillStyle = '#fff0f5'; c.fillRect(0, 0, W, H); const r = rng(2);
      for (let i = 0; i < 3; i++) { const k = S('engaged', i * .5, i * .5 + .4); if (k <= 0) continue; c.save(); c.translate(320 + i * 640, 560); c.scale(backOut(k), backOut(k)); fillRR(c, -290, -330, 580, 660, 20, ['#ffd6e0', '#d6f0ff', '#fff0c2'][i]);
        drawToon(c, { x: -90, y: 260, H: 420, skin: ['#f0c8a8', '#8d5a3b', '#d9a27e'][i], hair: ['#3a2418', '#1e1410', '#7a5230'][i], style: 'boy', top: '#2b2d42', bottom: '#2b2d42', handR: [.4, -.05], footL: [-.05, -.15] });
        drawToon(c, { x: 120, y: 260, H: 440, skin: ['#f3cfb3', '#c68a62', '#f0c8a8'][i], hair: ['#e5c27a', '#3a2418', '#b0533a'][i], style: ['long', 'puffs', 'bob'][i], top: '#fff', skirt: '#fff', mouth: 'open', eyes: 'happy', handL: [-.3, -.4], handR: [.3, -.4] });
        fillRR(c, -200, -300, 400, 70, 16, '#ff4d6d'); text(c, 'SHE SAID YES!', 0, -265, 40, '#fff'); c.restore(); void r; }
      if (after('k2', 1)) { const j = person(c, { who: 'elijah', look: 'trex', x: 960, y: 1180, age: 'adult', s: .9, shirt: '#f2c230', pants: '#222', sweat: 1, bigEyes: 1 }); void j; } return; }
    // jewelry store
    c.fillStyle = after('store') ? '#2b1d3a' : '#7a8a9a'; c.fillRect(0, 0, W, H);
    if (!after('store')) { fillRR(c, 420, 140, 1080, 120, 14, '#1e1a3a', '#e2b33b', 6); text(c, 'JEWELRY', 960, 200, 80, '#e2b33b'); fillRR(c, 460, 300, 1000, 480, 10, '#cfe8ff', '#e2b33b', 8); for (let i = 0; i < 4; i++) ringBox(c, 600 + i * 240, 600, 1.2, 1, .6);
      person(c, { who: 'elijah', look: 'trex', x: 960, y: 1080, age: 'adult', shirt: '#f2c230', pants: '#222', hearts: .7 }); }
    else { fillRR(c, 0, 760, W, 320, 0, '#3a2a4a'); fillRR(c, 300, 640, 1320, 140, 10, '#cfe8ff', '#e2b33b', 6);
      const back = easeIO(S('k7', .2, 1.4)); ringBox(c, lerp(960, 1300, back), 620, 2.2, 1, 1);
      const jj = drawToon(c, { x: 1400, y: 760, H: 640, skin: '#f0c8a8', hair: '#d0d0d0', style: 'boy2', top: '#2b2d42', bottom: '#2b2d42', mouth: talk('jeweler') > .2 ? 'open' : 'smile', handL: [-.4, .15] });
      c.beginPath(); c.arc(jj.head.x + 22, jj.head.y + 2, 16, 0, TAU); c.strokeStyle = '#e2b33b'; c.lineWidth = 4; c.stroke(); fillRR(c, jj.head.x - 40, jj.head.y + 25, 80, 14, 7, '#d0d0d0');
      person(c, { who: 'elijah', look: 'trex', x: 560, y: 1000, age: 'adult', shirt: '#f2c230', pants: '#222', handR: [.35, -.1], hearts: !after('k5') ? 1 : 0, bigEyes: after('k6') ? 1 : 0 });
      if (after('flashback') && !after('k7')) { c.save(); c.filter = 'sepia(1)'; thoughtCorner(c, 960, 300, 230, c => { c.fillStyle = '#cfe8ff'; c.fillRect(-240, -240, 480, 480); drawFace(c, 'elijah_trex', -90, 0, 150, 0, { bigEyes: 1 }); drawFace(c, 'emma', 90, 0, 150);
        comic(c, 'SLAP!', 0, -90, 50, S('flashback', .3, 1.3)); }, S('flashback', 0, 2)); c.restore(); c.filter = 'none'; }
      floatingRing(c, 1820, 120, .9); }
  } };

/* ===== 14. THE LEGEND CONTINUES ===== */
const MONTAGE = [['elijah_baby', 'THE SCANDAL'], ['luke', 'DAD'], ['stephanie', 'MOM'], ['alyssa', 'SISTER #1'], ['naomi', 'SISTER #2'], ['levi', 'LEVI'], ['vivian', 'VIVIAN'], ['joseph', 'THE MENTOR'],
  ['emma', 'EMMA'], ['eli', 'RIVAL #1'], ['adam', 'RIVAL #2'], ['mia', 'THE ARIZONA INCIDENT'], ['noah', 'THE BOSS'], ['elijah_trex', 'THE LEGEND']];
const SC_FINALE = { id: 'finale',
  music: [['orchestral', 0, 'slap', 1], ['orchestral', ['slap', 1.2], 'bigfoot', .8], ['sneaky', 'bigfoot', 'f9>', .9], ['orchestral', 'endcard', 'endcard>', 1]],
  sfx: [...MONTAGE.map((m, i) => [i * .45, 'pop']), [['slap', 1.1], 'slap'], [['slap', 1.15], 'scratch'], ['f8', 'stampF'], [['bigfoot', 1], 'thud', .2], [['bigfoot', 2.2], 'pop'], [['bigfoot', 3.6], 'whoosh'], ['endcard', 'sting'], [['endcard', 2.4], 'stampF'], [['endcard', 4], 'sparkle']],
  draw(c, t) {
    if (!after('hill')) { c.fillStyle = '#1c1530'; c.fillRect(0, 0, W, H);
      MONTAGE.forEach(([k, label], i) => { const p = S('montage', i * .45, i * .45 + .4); if (p <= 0) return; const col = i % 5, row = Math.floor(i / 5), x = 240 + col * 360, y = 200 + row * 330;
        c.save(); c.translate(x, y); c.scale(backOut(p), backOut(p)); c.rotate((i % 3 - 1) * .04); fillRR(c, -150, -150, 300, 300, 14, '#fff8e7', '#3a2614', 5);
        c.save(); rr(c, -135, -135, 270, 220, 8); c.clip(); c.fillStyle = ['#ffd6e0', '#d6f0ff', '#fff0c2', '#e0ffd6'][i % 4]; c.fillRect(-135, -135, 270, 220);
        if (FACES[k]) drawFace(c, k, 0, -10, 150); else drawToon(c, Object.assign({ x: 0, y: 560, H: 640, top: '#999', bottom: '#555', mouth: 'open', eyes: 'happy' }, CAST[k].toon)); c.restore(); text(c, label, 0, 118, label.length > 14 ? 24 : 32, '#3a2614'); c.restore(); });
      return; }
    const frozen = after('slap', 1.1) && !after('bigfoot'), end = after('endcard');
    if (end) { const k = S('endcard', 0, .6); c.fillStyle = '#140c1c'; c.fillRect(0, 0, W, H); for (let i = 0; i < 14; i++) sparkle(c, 960 + Math.cos(i / 14 * TAU + t * .3) * 760, 520 + Math.sin(i / 14 * TAU + t * .3) * 380, 16 + 8 * Math.sin(t * 4 + i), k, t);
      bigText(c, 'ELIJAH', 960, 300, 230, k, '#ffd23f', { stroke: '#3a0a12' });
      ['CONCEIVED IN SIN.', 'DELIVERED IN GLORY.', "REJECTED BY HIS GIRLFRIEND'S HAND."].forEach((s, i) => bigText(c, s, 960, 500 + i * 80, 58, S('endcard', .7 + i * .5, 1.2 + i * .5), i === 2 ? '#ff6a8a' : '#fff'));
      stamp(c, 'THE END... FOR NOW.', 960, 870, 80, S('endcard', 2.4, 2.9), '#ffd23f', -.05); floatingRing(c, 1700, 860, 1.2); return; }
    c.save(); if (frozen) grayscale(c, .85);
    const z = 1 + 1.1 * easeIO(S('zoomface', 0, 1)) * (1 - easeIO(S('bigfoot', 0, .6))); camera(c, 960, lerp(540, 330, easeIO(S('zoomface', 0, 1)) * (1 - easeIO(S('bigfoot', 0, .6)))), z);
    sky(c, '#ff7b54', '#ffd28a'); circ(c, 960, 640, 180, '#ffdf7a'); c.fillStyle = '#4a6b3a'; c.beginPath(); c.moveTo(-100, 880); c.quadraticCurveTo(960, 640, 2020, 880); c.lineTo(2020, 1200); c.lineTo(-100, 1200); c.fill();
    const sl = slapBeat(t, cu('slap') + .5, .6), ew = easeIO(S('slap', -.3, .9)) * (1 - easeIO(S('bigfoot', 0, 1)) * 0);
    const bf = S('bigfoot', 0, 3.6), hasCan = after('bigfoot', 2.2);
    if (after('bigfoot')) { const bx = bf < .45 ? lerp(-300, 760, bf / .45) : bf < .7 ? 760 : lerp(760, -400, (bf - .7) / .3); bigfoot(c, bx, 790, .85, { walk: bf < .45 || bf > .7 ? t * 1.5 : 0, flip: bf > .7, armUp: bf > .5 && bf < .65, hold: bf < .62 ? (c => drPepper(c, 0, 20, .8, 0)) : null }); }
    const je = person(c, { who: 'elijah', look: 'trex', x: 960, y: 790, age: 'adult', shirt: '#f2c230', pants: '#222', handR: [.07 + sl.reach * .45, .44 - sl.reach * .2], handL: hasCan ? [-.3, -.05] : [-.1, .2], bigEyes: sl.flash > .2 ? 1 : 0, headRot: after('f9') ? .15 : 0 });
    if (!after('slap')) ringBox(c, je.handR.x + 20, je.handR.y - 10, 1, 1);
    if (hasCan) drPepper(c, je.handL.x, je.handL.y + 20, .8, -.1);
    if (after('slap', -.3) && !after('bigfoot')) person(c, { who: 'emma', x: lerp(1900, 1250, ew), y: 800, age: 'woman', shirt: '#f4a6b8', skirt: '#7a4a9a', handL: sl.flash > 0 || frozen ? [-.5, .05] : [-.1, .35] });
    if (after('f9')) exclaim(c, je.head.x, je.head.y - 220, 1, S('f9', .2, .7));
    c.restore(); grayscale(c, 0);
    if (sl.flash > 0) comic(c, 'SLAP!', 1150, 440, 60, 1 - sl.flash * .9, -.1, '#ff6a6a');
    if (frozen) { c.save(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; rr(c, 40, 40, W - 80, H - 80, 10); c.stroke(); text(c, '❚❚ FREEZE FRAME', 200, 90, 30, '#fff'); c.restore(); }
    stamp(c, 'STILL NOT MARRIED.', 960, 860, 90, S('f8', 0, .4) * (1 - S('bigfoot', 0, .3)));
    if (!after('bigfoot')) floatingRing(c, 1780, 160, 1);
  } };

const SCENES = [SC_SIN, SC_SISTERS, SC_BIGFOOT, SC_TRIANGLE, SC_EMMA, SC_ELI, SC_ADAM, SC_ARIZONA, SC_GLIMMER, SC_DRPEPPER, SC_TREX, SC_HANDS, SC_RING, SC_FINALE];
const TRANS = ['pageflip', 'wipe', 'iris', 'star', 'heart', 'diag', 'slide', 'pageflip', 'blinds', 'wipe', 'iris', 'spin', 'pageflip'];
