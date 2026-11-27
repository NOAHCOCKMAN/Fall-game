// ---------- AVALEY'S BIG DAY: scenes ----------
function walkPose(ph, a = .13) { const s = Math.sin(ph * TAU), cc = Math.cos(ph * TAU); return { footL: [s * a, -Math.max(0, cc) * a * .5], footR: [-s * a, -Math.max(0, -cc) * a * .5] }; }
function bigText(c, s, x, y, size, p, col = '#fff', o = {}) { if (p <= 0) return; const k = backOut(clamp(p * 2.5)); c.save(); c.translate(x, y); c.scale(k, k); if (o.rot) c.rotate(o.rot);
  text(c, s, 0, 0, size, col, { stroke: o.stroke || '#3a2614', sw: size * .14, shadow: 'rgba(0,0,0,.3)' }); c.restore(); }
function polaroid(c, key, x, y, w, rot, k, label, labelCol = '#2a3d8f') { if (k <= 0) return; const im = IMG[key], m = FACES[key].meta, h = w * m.h / m.w; c.save(); c.translate(x, y); c.rotate(rot); c.scale(backOut(clamp(k)), backOut(clamp(k)));
  c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30; fillRR(c, -w / 2 - 20, -h / 2 - 20, w + 40, h + 110, 8, '#fdfcf6'); c.shadowBlur = 0; c.drawImage(im, -w / 2, -h / 2, w, h);
  if (label) text(c, label, 0, h / 2 + 46, 40, labelCol, { font: FONT2, weight: 700 }); c.restore(); }
const KID = { who: 'adley', H: 480, fh: 150, noHair: true, shirt: '#f2c4bd', skirt: '#4a6fa5', shoes: '#f3f0ec' };
function adley(c, x, y, o = {}) { return person(c, Object.assign({}, KID, { x, y }, o)); }
function crazyHair(c, j, k, t) { if (k <= 0) return; const h = j.head, r = h.fh * (.75 + .25 * k); c.save(); c.globalCompositeOperation = 'destination-over';
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, wob = Math.sin(t * 6 + i * 1.7) * .08, d = r * (1 + .35 * k * (i % 2) + wob);
    c.beginPath(); c.arc(h.x + Math.cos(a) * d * .95, h.y - h.fh * .2 + Math.sin(a) * d, h.fh * (.2 + .12 * k), 0, TAU); c.fillStyle = i % 3 ? '#c49a5e' : '#d8b276'; c.fill(); }
  c.restore(); c.save(); c.strokeStyle = '#b4884e'; c.lineWidth = 6; for (let i = 0; i < 12; i++) { const a = -PI + i / 11 * PI, x0 = h.x + Math.cos(a) * r * 1.1, y0 = h.y - h.fh * .3 + Math.sin(a) * r * 1.2;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + Math.cos(a) * 40 + Math.sin(t * 8 + i) * 12, y0 + Math.sin(a) * 40, x0 + Math.cos(a) * 70 * k, y0 + Math.sin(a) * 70 * k); c.stroke(); } c.restore(); }
function kidRoom(c, t) { c.fillStyle = '#e8d8f4'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.45)'; for (let y = 40; y < 760; y += 90) for (let x = 0; x < W; x += 90) starPath(c, x + (y / 90 % 2) * 45, y, 12, 5), c.fill();
  c.fillStyle = '#c9a98a'; c.fillRect(0, 760, W, 320); fillRR(c, 1300, 160, 360, 300, 12, '#fff'); const g = c.createLinearGradient(0, 180, 0, 440); g.addColorStop(0, '#ffb36b'); g.addColorStop(1, '#ffe3b0'); fillRR(c, 1318, 178, 324, 264, 4, g); circ(c, 1480, 400, 60 + Math.sin(t) * 3, '#ffd84a');
  fillRR(c, 120, 620, 560, 200, 30, '#ffd6e7', '#e7a6c3', 6); fillRR(c, 120, 560, 160, 120, 40, '#fff'); }
function hallway(c, t) { c.fillStyle = '#efe6da'; c.fillRect(0, 0, W, H); c.fillStyle = '#b08a64'; c.fillRect(0, 820, W, 260);
  for (let i = 0; i < 8; i++) fillRR(c, -40 + i * 90, 820 - i * 70, 760 - i * 90, 70, 4, '#a07a54', '#7a5a3a', 3); line(c, [40, 760, 640, 300], '#7a5a3a', 10); }
function door(c, x, y, label, open = 0, col = '#fff') { c.save(); c.translate(x, y); fillRR(c, -150, -480, 300, 480, 6, '#3a2a20'); c.save(); c.translate(150, 0); c.scale(Math.max(.08, 1 - open), 1);
  fillRR(c, -300, -470, 300, 470, 6, col, '#cdbca4', 4); fillRR(c, -270, -440, 240, 180, 6, null, '#d9cbb6', 4); fillRR(c, -270, -230, 240, 190, 6, null, '#d9cbb6', 4); circ(c, -40, -230, 14, '#c9a43a'); c.restore();
  if (label) { fillRR(c, -120, -560, 240, 60, 10, '#fff', '#c9a43a', 4); text(c, label, 0, -530, 28, '#5a4030'); } c.restore(); }
function bedroomBig(c, t) { c.fillStyle = '#dfe9f3'; c.fillRect(0, 0, W, H); c.fillStyle = '#b8a48c'; c.fillRect(0, 780, W, 300); fillRR(c, 1500, 140, 320, 260, 10, '#fff'); fillRR(c, 1516, 156, 288, 228, 4, '#bfe3ff');
  fillRR(c, 360, 380, 1200, 140, 20, '#7a5a3a'); }
function bed(c, t, bounce = 0) { const sq = bounce; fillRR(c, 360, 620 + sq * 20, 1200, 220 - sq * 20, 30, '#ffffff', '#cfcfcf', 4); fillRR(c, 450, 560 + sq * 10, 300, 110, 50, '#fff', '#ddd', 3); fillRR(c, 1170, 560 + sq * 10, 300, 110, 50, '#fff', '#ddd', 3); }
function blanket(c, sq = 0) { c.beginPath(); c.moveTo(380, 680 + sq * 20); c.quadraticCurveTo(960, 620 + sq * 30, 1540, 680 + sq * 20); c.lineTo(1560, 860); c.lineTo(360, 860); c.closePath(); c.fillStyle = '#8fb3e0'; c.fill(); c.strokeStyle = '#6f93c0'; c.lineWidth = 5; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 8; i++) c.fillRect(400 + i * 145, 690 + sq * 20, 60, 160); }
function zzz(c, x, y, t, a = 1) { for (let i = 0; i < 3; i++) { const k = (t * .7 + i / 3) % 1; c.save(); c.globalAlpha = a * (1 - k); text(c, 'Z', x + k * 90, y - k * 120, 34 + k * 30, '#5a6fa0', { rot: -.2 }); c.restore(); } }
function bathroom(c, t) { c.fillStyle = '#f3efe9'; c.fillRect(0, 0, W, H); c.fillStyle = '#d9d2c6'; c.fillRect(0, 780, W, 300); fillRR(c, 300, 120, 1320, 460, 14, '#cfe3ee', '#c9c9c9', 10);
  c.fillStyle = 'rgba(255,255,255,.35)'; poly(c, [400, 140, 520, 140, 360, 560, 320, 560]); c.fill(); fillRR(c, 260, 600, 1400, 60, 10, '#e8e1d6', '#bbb', 3); fillRR(c, 300, 660, 1320, 140, 6, '#c8b49a'); }
function kitchen(c, t) { c.fillStyle = '#f2ebe0'; c.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) fillRR(c, 80 + i * 300, 90, 270, 260, 10, '#6b3f26', '#4a2a18', 4);
  fillRR(c, 0, 640, W, 60, 0, '#4f6b5e'); fillRR(c, 0, 700, W, 380, 0, '#7a4a2a'); for (let i = 0; i < 6; i++) fillRR(c, 100 + i * 300, 760, 240, 120, 8, '#6b3f26', '#4a2a18', 3); }
function sandwichToon(c, x, y, s, done) { c.save(); c.translate(x, y); c.scale(s, s); fillRR(c, -120, -20, 240, 40, 16, '#f3dfb5', '#c9a46a', 3); ell(c, 0, -30, 110, 22, '#f2a7b0'); fillRR(c, -90, -48, 120, 20, 4, '#ffb21a');
  if (done) fillRR(c, -120, -90, 240, 44, 18, '#f3dfb5', '#c9a46a', 3); c.restore(); }
function knife(c, x, y, rot, mayo = 1) { c.save(); c.translate(x, y); c.rotate(rot); fillRR(c, -10, 0, 20, 80, 6, '#333'); c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.lineTo(10, -170); c.quadraticCurveTo(0, -190, -14, -150); c.closePath(); c.fillStyle = '#d6dbe0'; c.fill();
  if (mayo) { c.fillStyle = '#fffbe8'; ell(c, 0, -110, 12, 40); c.fill(); } c.restore(); }
function chefHat(c, j) { const h = j.head, top = h.top + 10; c.save(); c.translate(h.x, top); fillRR(c, -70, -30, 140, 50, 10, '#fff', '#ddd', 3); for (const dx of [-45, 0, 45]) circ(c, dx, -60, 48, '#fff'); c.restore(); }
const NOAH = { who: 'noah', age: 'adult', shirt: '#2b3a55', outfit: 'hoodie', pants: '#3a4a6a', shoes: '#333' };
const LILAH = { who: 'lilah', age: 'woman', shirt: '#efe4d2', skirt: '#6b4a3a', shoes: '#8a5a3a' };

/* ===== 1. Good morning ===== */
const SC_MORNING = { id: 'morning',
  music: [['harp', 0, 'title>', .9], ['romance', 'room', 'end', .8, { bpm: 84 }]],
  sfx: [[.3, 'sparkle'], ['room', 'chirp'], [['room', .8], 'chirp'], ['hair', 'boing'], [['m3', 2.4], 'boing']],
  draw(c, t) {
    if (!after('room')) { c.fillStyle = '#fff4f8'; c.fillRect(0, 0, W, H); for (let i = 0; i < 14; i++) sparkle(c, 960 + Math.cos(i / 14 * TAU + t * .4) * 700, 520 + Math.sin(i / 14 * TAU + t * .4) * 330, 16 + 8 * Math.sin(t * 4 + i), 1, t, '#ffd23f');
      bigText(c, "AVALEY'S", 960, 360, 140, S('title', 0, .6), '#ff6a8a', { stroke: '#fff' }); bigText(c, 'BIG DAY', 960, 520, 170, S('title', .3, .9), '#ffb21a', { stroke: '#fff' });
      c.save(); c.globalAlpha = S('title', 1, 1.6); text(c, 'A Black Friday Documentary', 960, 680, 44, '#8a5a7a', { font: FONT2, weight: 600 }); c.restore(); return; }
    kidRoom(c, t); const hair = S('hair', .3, 1.2), stretch = after('m2') ? easeOut(S('m2', 0, .6)) : 0;
    const j = adley(c, 960, 960, { handL: stretch ? [-.35, -.9] : [-.1, .4], handR: stretch ? [.35, -.9] : [.1, .4], headDy: Math.sin(t * 3) * 4, eyes: null });
    crazyHair(c, j, hair, t);
    if (!after('m2')) bigText(c, 'AVALEY', 960, 180, 110, S('m1', 0, .5), '#ff6a8a', { stroke: '#fff' });
    stamp(c, 'BEDHEAD LEVEL: MAXIMUM', 1460, 640, 48, S('m3', 2.2, 2.7), '#d62839', .08);
  } };

/* ===== 2. The locked door ===== */
const SC_DOOR = { id: 'door',
  music: [['camp', 0, 'sneak', .7], ['sneaky', 'sneak', 'anyway', .9], ['triumph', 'anyway', 'end', .6]],
  sfx: [['knock', 'thud', .3], [['knock', .25], 'thud', .3], [['knock', 1], 'squeak'], [['d2', 1.6], 'buzz'], ['key', 'ding'], [['key', .1], 'sparkle'], ['d7', 'stampF'], ['anyway', 'click']],
  draw(c, t) {
    if (!after('sneak')) { hallway(c, t); door(c, 1300, 820, 'NOAH & LILAH', 0);
      const climb = easeIO(S('d1', 0, cd('d1') + .6)), jx = lerp(-100, 1060, climb), jy = 830;
      adley(c, jx, jy, { handR: after('knock') && !after('d2') ? [.35, -.3 + Math.abs(Math.sin(t * 14)) * .1] : [.1, .4], footL: climb < 1 ? walkPose(t * 2).footL : [0, 0], footR: climb < 1 ? walkPose(t * 2).footR : [0, 0], jaw: null });
      comic(c, 'KNOCK KNOCK', 1300, 260, 46, S('knock', 0, 1.8));
      stamp(c, 'LOCKED', 1300, 420, 64, S('d2', 1.2, 1.7)); return; }
    hallway(c, t); door(c, 600, 820, 'NOAH & LILAH', 0); door(c, 1400, 820, "LUKE'S ROOM", after('d5') ? .7 : 0, '#e8eef5');
    const tip = S('d4', 0, cd('d4') + cd('d5') + .4), x = lerp(700, 1400, easeIO(tip)), hasKey = after('key');
    const j = adley(c, after('anyway') ? 760 : x, 830 + Math.abs(Math.sin(t * 8)) * -10 * (tip < 1 ? 1 : 0), { footL: tip < 1 ? walkPose(t * 1.5, .2).footL : [0, 0], footR: tip < 1 ? walkPose(t * 1.5, .2).footR : [0, 0], handR: hasKey ? [.35, -.35] : [.1, .4], handL: tip < 1 ? [-.2, -.1] : [-.1, .4] });
    if (hasKey) { c.save(); c.translate(j.handR.x + 10, j.handR.y - 30); c.rotate(-.5); circ(c, 0, 0, 22, null); c.lineWidth = 10; c.strokeStyle = '#e2b33b'; c.stroke(); fillRR(c, -6, 20, 12, 80, 4, '#e2b33b'); fillRR(c, 0, 70, 26, 10, 3, '#e2b33b'); fillRR(c, 0, 88, 20, 10, 3, '#e2b33b'); c.restore();
      sparkle(c, j.handR.x + 30, j.handR.y - 70, 40 * (.7 + .3 * Math.sin(t * 6)), 1, t * 3); }
    bigText(c, 'THE SECRET KEY', 1100, 160, 90, S('d6', 0, .5) * (1 - S('d7', 0, .3)), '#e2b33b');
    stamp(c, 'NOT ALLOWED', 1200, 300, 72, S('d7', 0, .5) * (1 - S('anyway', .8, 1.2)));
    if (after('anyway')) bigText(c, 'DID IT ANYWAY.', 960, 200, 90, S('anyway', .2, .7), '#ff6a8a', { stroke: '#fff' });
  } };

/* ===== 3. The wake-up call ===== */
const SC_WAKE = { id: 'wake',
  music: [['circus', 'jump', 'cuddle', .8], ['romance', 'cuddle', 'w6', .8, { bpm: 72 }], ['sneaky', 'w6', 'end', .7]],
  sfx: [['open', 'creak'], ...[0, .45, .9, 1.35, 1.8, 2.25, 2.7, 3.15, 3.6, 4.05].map(k => [['jump', k], 'boing']), ['cuddle', 'harp']],
  draw(c, t) {
    bedroomBig(c, t); const jumping = after('jump') && !after('cuddle'), ph = jumping ? Math.abs(Math.sin((t - cu('jump')) * PI / .45)) : 0, sq = jumping ? 1 - ph : 0;
    bed(c, t, sq * .6); const shake = sq * 10;
    drawFace(c, 'noah', 640, 560 + shake, 150, -.08, { jaw: 0 }); drawFace(c, 'lilah', 1280, 560 + shake, 150, .08, { jaw: 0 }); blanket(c, sq * .6);
    if (!after('jump')) { zzz(c, 720, 420, t); zzz(c, 1340, 420, t + .5); door(c, 200, 780, null, after('open') ? easeOut(S('open', 0, .8)) : 0); return; }
    if (jumping) { adley(c, 960, 700 - ph * 360, { handL: [-.4, -.85], handR: [.4, -.85], footL: [-.1, -.1 * ph], footR: [.1, -.1 * ph], hearts: 0 }); comic(c, 'BOING!', 960, 180, 44, ((t - cu('jump')) / .9) % 1, .1, '#9be7ff'); return; }
    const j = adley(c, 960, 760, { handL: [-.55, .05], handR: [.55, .05], hearts: after('w5') ? 0 : 1, headRot: after('w5') ? .12 : 0 });
    if (after('w5')) { fillRR(c, 1080, 250, 380, 110, 30, '#fff', '#333', 4); text(c, 'Pleeease get up!', 1270, 305, 40, '#ff4d6d', { font: FONT2, weight: 700 }); }
    if (after('w6')) { zzz(c, 720, 420, t, .8); zzz(c, 1340, 420, t + .5, .8); const k = S('w6', 0, .5);
      c.save(); c.globalAlpha = k; fillRR(c, 80, 120, 560, 200, 16, '#fff', '#333', 4); text(c, '✓ Technically awake', 360, 185, 40, '#2a9d8f', { font: FONT2, weight: 700 }); text(c, '✓ Spiritually asleep', 360, 255, 40, '#d62839', { font: FONT2, weight: 700 }); c.restore(); }
    void j;
  } };

/* ===== 4. Getting ready ===== */
const SC_READY = { id: 'ready',
  music: [['triumph', 'bf', 'bath', .8], ['romance', 'bath', 'ouch', .8, { bpm: 90 }], ['sad', 'ouch', 'book', .8], ['romance', 'book', 'end', .9, { bpm: 66 }]],
  sfx: [['r2', 'chaching'], ['gloss', 'sparkle'], ['lash', 'zip'], ['photo', 'camera'], ['ouch', 'horrorHit'], [['r7', .1], 'pop'], ['book', 'page'], ['happy', 'harp'], [['happy', .3], 'sparkle']],
  draw(c, t) {
    if (!after('bath')) { c.fillStyle = '#111'; c.fillRect(0, 0, W, H); const k = S('r2', 0, .5);
      for (let i = 0; i < 10; i++) { const x = (i * 211) % W, y = ((t * 220 + i * 97) % 1200) - 60; c.save(); c.translate(x, y); c.rotate(Math.sin(t + i)); fillRR(c, -40, -30, 80, 70, 8, ['#ff4d6d', '#ffd23f', '#4d96ff'][i % 3]); text(c, '%', 0, 4, 34, '#fff'); c.restore(); }
      adley(c, 760, 960, { handL: [-.3, -.6], handR: [.3, -.6] }); person(c, Object.assign({}, NOAH, { x: 1260, y: 980, handR: [.3, -.5] })); person(c, Object.assign({}, LILAH, { x: 1560, y: 980, handL: [-.3, -.5] }));
      bigText(c, 'BLACK FRIDAY', 960, 200, 140, k, '#ffd23f', { stroke: '#111' }); return; }
    if (after('photo') && !after('ouch')) { c.fillStyle = '#f3efe9'; c.fillRect(0, 0, W, H); polaroid(c, 'primp', 960, 470, 480, -.04, S('photo', 0, .5), 'ACTUAL FOOTAGE', '#d62839'); return; }
    if (after('book')) { c.fillStyle = '#f6ead6'; c.fillRect(0, 0, W, H); c.fillStyle = '#c99772'; c.fillRect(0, 760, W, 320); fillRR(c, 420, 560, 1080, 260, 40, '#b5523b'); fillRR(c, 420, 480, 1080, 140, 40, '#9a4330');
      const happy = after('happy'); if (happy) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .25 * S('happy', 0, 1); circ(c, 1100, 300, 500, '#fff3c0'); c.restore(); }
      person(c, Object.assign({}, NOAH, { x: 760, y: 880, footL: [.1, -.12], footR: [.14, -.12], handR: [.3, -.05], handL: [.15, -.05] }));
      c.save(); c.translate(980, 600); c.rotate(-.08); fillRR(c, -150, -100, 150, 200, 6, '#ffd6e7', '#c8638a', 4); fillRR(c, 0, -100, 150, 200, 6, '#ffd6e7', '#c8638a', 4); starPath(c, -75, 0, 40, 18); c.fillStyle = '#ffd23f'; c.fill(); heart(c, 75, 10, 36); c.restore();
      adley(c, 1180, 880, { hearts: happy ? 1 : 0, tears: happy ? 0 : .5, handL: [-.2, .05] }); if (happy) for (let i = 0; i < 6; i++) { const k = (t * .5 + i / 6) % 1; heart(c, 1180 + Math.sin(i * 2 + t) * 160, 500 - k * 300, 24, '#ff4d6d', 1 - k); }
      return; }
    bathroom(c, t); const ouch = after('ouch');
    const jl = person(c, Object.assign({}, LILAH, { x: 620, y: 1000, handR: [.15, -.45], handL: [-.1, .4] })); fillRR(c, jl.handR.x - 6, jl.handR.y - 70, 12, 70, 5, '#c8638a');
    fillRR(c, 1100, 860, 300, 140, 10, '#9a8a7a'); // step stool
    const tool = after('lash') ? 'lash' : after('gloss') ? 'gloss' : null;
    const j = adley(c, 1250, 860, { handR: tool ? [.05, -.42] : ouch ? [.35, -.1] : [.1, .4], handL: ouch ? [-.05, -.1] : [-.1, .4], tears: after('r8') ? 1 : 0, headRot: ouch ? -.1 : 0 });
    if (tool === 'gloss' && !ouch) fillRR(c, j.handR.x - 8, j.handR.y - 60, 16, 60, 6, '#ff8fab'); if (tool === 'lash' && !ouch) { c.save(); c.translate(j.handR.x, j.handR.y - 50); line(c, [-10, 30, 0, -20, 10, 30], '#ccc', 6); c.beginPath(); c.arc(0, -30, 16, PI, TAU); c.strokeStyle = '#ccc'; c.lineWidth = 6; c.stroke(); c.restore(); }
    if (after('gloss') && !ouch) { fillRR(c, 1420, 170, 420, 70, 14, '#fff'); text(c, '✓ LIP GLOSS', 1630, 205, 38, '#2a9d8f'); }
    if (after('lash') && !ouch) { fillRR(c, 1420, 260, 420, 70, 14, '#fff'); text(c, '✓ EYELASH CURLER', 1630, 295, 34, '#2a9d8f'); }
    if (ouch) { c.save(); c.translate(1520, 640); c.rotate(-.6); fillRR(c, -20, -40, 40, 220, 14, '#333'); fillRR(c, -26, -220, 52, 190, 20, '#888'); c.restore(); for (let i = 0; i < 3; i++) { const k = (t * .8 + i / 3) % 1; circ(c, 1560 + i * 30, 440 - k * 160, 16 + k * 20, `rgba(255,255,255,${.6 * (1 - k)})`); }
      comic(c, 'OW!', 1440, 420, 54, S('r7', 0, 1.6), -.1, '#ff6a6a'); if (after('r8')) { c.save(); c.translate(j.handL.x, j.handL.y); c.rotate(.4); fillRR(c, -20, -10, 40, 20, 8, '#f6d3a8', '#d9a86a', 2); c.restore(); } }
  } };

/* ===== 5. Chef Adley ===== */
const SC_SANDWICH = { id: 'sandwich',
  music: [['country', 0, 'lick', .7, { bpm: 104 }], ['sneaky', 'lick', 'end', .8]],
  sfx: [['chef', 'ding'], ['s3', 'tada'], ['p1', 'camera'], ['p2', 'camera'], [['p2', .3], 'sparkle'], ['lick', 'squeak'], [['lick', .5], 'squeak'], ['s5', 'pop']],
  draw(c, t) {
    if (after('p1') && !after('lick')) { c.fillStyle = '#4f6b5e'; c.fillRect(0, 0, W, H);
      polaroid(c, 'sandwich1', 640, 470, 520, -.06, S('p1', 0, .5), 'IN PROGRESS'); if (after('p2')) { polaroid(c, 'sandwich2', 1300, 470, 600, .05, S('p2', 0, .5), 'FINISHED'); text(c, '★★★★★', 1300, 960, 70, '#ffd23f', { stroke: '#3a2614' }); } return; }
    kitchen(c, t);
    const jl = person(c, Object.assign({}, LILAH, { x: 500, y: 980, handR: [.3, .02], handL: [.2, .05] })); sandwichToon(c, jl.handR.x + 60, 650, .9, 1);
    const lick = after('lick'), j = adley(c, 1200, 930, { handR: lick ? [-.05, -.44] : [.3, .05], handL: [.2, .05], jaw: lick ? .5 + .4 * Math.abs(Math.sin(t * 8)) : null });
    if (after('chef')) chefHat(c, j); if (!lick) { sandwichToon(c, 1400, 650, .8, after('s2', 1)); knife(c, 1500, 640, .9); }
    if (lick) { knife(c, j.handR.x + 6, j.handR.y + 20, -.2, 1); comic(c, 'SLURP!', 1450, 300, 44, S('lick', 0, 1.6), .1, '#fffbe8'); }
    fillRR(c, 1600, 560, 110, 150, 20, '#fffbe8', '#ccc', 4); text(c, 'MAYO', 1655, 630, 26, '#4a6b3a');
    bigText(c, 'CHEF AVALEY', 1200, 160, 100, S('chef', 0, .5) * (1 - S('p1', -.3, 0)), '#ffb21a');
    if (after('s5')) stamp(c, "CHEF'S KISS", 700, 280, 80, S('s5', 0, .4), '#ff4d6d');
  } };

/* ===== 6. The end ===== */
const SC_END = { id: 'end',
  music: [['orchestral', 0, 'card>', 1]],
  sfx: [[.2, 'sparkle'], ['card', 'tada'], [['card', .4], 'sparkle']],
  draw(c, t) {
    c.fillStyle = '#fff4f8'; c.fillRect(0, 0, W, H); for (let i = 0; i < 16; i++) sparkle(c, 960 + Math.cos(i / 16 * TAU + t * .3) * 800, 540 + Math.sin(i / 16 * TAU + t * .3) * 420, 14 + 8 * Math.sin(t * 4 + i), 1, t, '#ffd23f');
    c.save(); c.translate(560, 470); starPath(c, 0, 0, 330, 200); c.fillStyle = '#ffd23f'; c.fill(); c.save(); c.beginPath(); c.arc(0, 0, 200, 0, TAU); c.clip(); c.fillStyle = '#ffe3ec'; c.fillRect(-220, -220, 440, 440); drawFace(c, 'adley', 0, 20, 230); c.restore(); c.restore();
    [['PROFESSIONAL CUTIE', 'e1', 0], ['MASTER LOCK PICKER', 'e1', 1.3], ['FIVE-STAR CHEF', 'e1', 2.6], ['BEST LITTLE ALARM CLOCK', 'e2', 1.4]].forEach(([s, cue, d], i) => {
      const k = S(cue, d, d + .5); if (k <= 0) return; c.save(); c.globalAlpha = k; fillRR(c, 980, 220 + i * 120, 820, 92, 20, ['#ff6a8a', '#4d96ff', '#ffb21a', '#2a9d8f'][i]); text(c, '✓ ' + s, 1390, 266 + i * 120, 46, '#fff'); c.restore(); });
    if (after('card')) { bigText(c, 'THE END', 960, 860, 130, S('card', 0, .6), '#ff6a8a', { stroke: '#fff' }); c.save(); c.globalAlpha = S('card', .8, 1.4); text(c, "Avaley's Big Day · Black Friday 2026", 960, 970, 36, '#8a5a7a', { font: FONT2, weight: 600 }); c.restore(); confetti(c, t - cu('card'), 100, 4); }
  } };

const SCENES = [SC_MORNING, SC_DOOR, SC_WAKE, SC_READY, SC_SANDWICH, SC_END];
const TRANS = ['pageflip', 'wipe', 'star', 'heart', 'iris'];
