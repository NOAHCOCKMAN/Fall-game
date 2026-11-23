// ---------- scenes 1-7 ----------
// Each scene: id (matches the timeline), music [[style, from, to, level, opts]], sfx [[at, name, arg]], draw(c, t).
// Times: a number (seconds into the scene), a cue name ('n3'), 'name>' for the end of that cue, or [cue, offset].

// ----- shared scenery -----
function hills(c, t, night = 0) {
  sky(c, night ? '#0e1838' : '#7ec8ff', night ? '#2a3a6a' : '#e6f6ff');
  if (!night) { sun(c, 1650, 170, 70, t); cloud(c, 300 + t * 8, 150, 110); cloud(c, 1100 + t * 5, 110, 90); } else { circ(c, 1600, 170, 60, '#f6f0c8'); for (let i = 0; i < 40; i++) circ(c, (i * 389) % W, (i * 211) % 500, 2, '#fff'); }
  c.fillStyle = night ? '#1f3a2a' : '#8fd16a'; c.beginPath(); c.moveTo(-100, 700); c.quadraticCurveTo(400, 520, 900, 640); c.quadraticCurveTo(1400, 760, 2100, 560); c.lineTo(2100, 1200); c.lineTo(-100, 1200); c.fill();
  c.fillStyle = night ? '#173022' : '#74bd55'; c.beginPath(); c.moveTo(-100, 820); c.quadraticCurveTo(700, 700, 1300, 800); c.quadraticCurveTo(1700, 860, 2100, 760); c.lineTo(2100, 1200); c.lineTo(-100, 1200); c.fill(); }
function church(c, x, y, s, bell = 0) { c.save(); c.translate(x, y); c.scale(s, s); fillRR(c, -90, -160, 180, 160, 4, '#f4f1ea', '#999', 3); poly(c, [-105, -158, 0, -240, 105, -158], '#b03a2e');
  fillRR(c, -30, -330, 60, 100, 2, '#f4f1ea', '#999', 3); poly(c, [-40, -328, 0, -420, 40, -328], '#b03a2e'); line(c, [0, -470, 0, -420], '#555', 6); line(c, [-16, -452, 16, -452], '#555', 6);
  c.save(); c.translate(0, -295); c.rotate(Math.sin(bell * 9) * .4 * bell); poly(c, [-14, 0, 14, 0, 10, -22, -10, -22], '#e2b33b'); c.restore(); fillRR(c, -22, -80, 44, 80, 22, '#7a4b28'); c.restore(); }
function farmhouse(c, x, y, s, night = 0) { c.save(); c.translate(x, y); c.scale(s, s); fillRR(c, -170, -200, 340, 200, 4, night ? '#c9c4b4' : '#fff8ea', '#9a8f7a', 4); poly(c, [-195, -195, 0, -330, 195, -195], '#6b3a2a');
  for (const wx of [-110, 110]) fillRR(c, wx - 40, -160, 80, 70, 4, night ? '#ffe27a' : '#a9d6ef', '#fff', 6); fillRR(c, -35, -120, 70, 120, 4, '#2f5b8a');
  for (let i = -4; i <= 4; i++) fillRR(c, -360 + i * 80 + 360 - 30, -60, 14, 60, 3, '#fff'); fillRR(c, -360 + 0, -45, 720, 10, 3, '#fff'); c.restore(); }
function birds(c, t, n = 5, y0 = 220) { for (let i = 0; i < n; i++) { const x = ((t * 90 + i * 260) % 2300) - 200, y = y0 + Math.sin(i * 2 + t) * 40, f = Math.sin(t * 8 + i) * 10;
  line(c, [x - 16, y - f, x, y, x + 16, y - f], '#333', 4); } }
function bigText(c, s, x, y, size, p, col = '#fff', o = {}) { if (p <= 0) return; const k = backOut(clamp(p * 2.5)); c.save(); c.translate(x, y); c.scale(k, k); if (o.rot) c.rotate(o.rot);
  text(c, s, 0, 0, size, col, { stroke: o.stroke || '#1a1410', sw: size * .14, shadow: 'rgba(0,0,0,.35)' }); c.restore(); }
function shades(c, j) { const h = j.head, m = FACES[h.key].meta, ex = m.eyeDX * h.fh, ey = h.y + m.eyeY * h.fh; c.save();
  for (const s of [-1, 1]) fillRR(c, h.x + s * ex - h.fh * .14, ey - h.fh * .07, h.fh * .28, h.fh * .15, h.fh * .05, '#101010'); line(c, [h.x - ex + h.fh * .12, ey - h.fh * .03, h.x + ex - h.fh * .12, ey - h.fh * .03], '#101010', h.fh * .03); c.restore(); }
function halo(c, x, y, w, a = 1) { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.shadowColor = '#fff3a0'; c.shadowBlur = 25; c.beginPath(); c.ellipse(x, y, w * .5, w * .14, 0, 0, TAU); c.strokeStyle = '#ffd84a'; c.lineWidth = w * .07; c.stroke(); c.restore(); }
function horns(c, x, y, w, a = 1) { if (a <= 0) return; c.save(); c.globalAlpha *= a; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * w * .2, y + w * .1); c.quadraticCurveTo(x + s * w * .48, y - w * .05, x + s * w * .42, y - w * .42); c.quadraticCurveTo(x + s * w * .32, y - w * .05, x + s * w * .05, y + w * .12); c.fillStyle = '#c4161c'; c.fill(); } c.restore(); }
function pitchfork(c, x, y, s, a = 1) { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s); line(c, [0, 0, 0, -200], '#3a3a3a', 8); line(c, [-30, -200, 30, -200], '#c4161c', 8); for (const dx of [-30, 0, 30]) line(c, [dx, -200, dx, -245], '#c4161c', 8); c.restore(); }
function bible(c, x, y, s, rot = 0, a = 1, glow = 0) { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot); c.scale(s, s);
  if (glow) { c.shadowColor = '#fff3a0'; c.shadowBlur = 40 * glow; } fillRR(c, -45, -60, 90, 120, 6, '#2b1a12', '#160c08', 3); c.shadowBlur = 0; fillRR(c, -38, -55, 4, 110, 2, '#e9d9b0');
  line(c, [0, -30, 0, 20], '#e2b33b', 7); line(c, [-16, -14, 16, -14], '#e2b33b', 7); c.restore(); }
function angel(c, x, y, s, t, i) { c.save(); c.translate(x, y + Math.sin(t * 2 + i) * 12); c.scale(s, s);
  for (const sx of [-1, 1]) { c.save(); c.scale(sx, 1); c.rotate(Math.sin(t * 6 + i) * .15); c.beginPath(); c.ellipse(70, -170, 70, 34, -.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,.95)'; c.fill(); c.restore(); }
  drawToon(c, { x: 0, y: 0, H: 300, skin: ['#f3cfb3', '#c68a62', '#8d5a3b'][i % 3], hair: ['#e5c27a', '#3a2418', '#1e1410'][i % 3], style: ['bob', 'boy', 'puffs'][i % 3], top: '#fdfcf7', skirt: '#fdfcf7', shoes: '#fdfcf7', mouth: 'open', eyes: 'happy', handL: [-.3, -.35], handR: [.3, -.35] });
  halo(c, 0, -300, 70); c.restore(); }
function congregation(c, t, y0, jump = 0, n = 14) { const r = rng(5); for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) { const x = 60 + i * (W - 120) / (n - 1) + row * 40, ph = r() * TAU, j = jump * Math.abs(Math.sin(t * 9 + ph)) * 40;
  const sway = Math.sin(t * 3.4 + ph) * .3;
  drawToon(c, { x, y: y0 + row * 70 - j, H: 300 + r() * 40, skin: ['#f3cfb3', '#d9a27e', '#8d5a3b', '#c68a62', '#f0c8a8'][i % 5], hair: ['#3a2418', '#e5c27a', '#1e1410', '#7a5230', '#b0b0b0'][(i + row) % 5], style: ['boy', 'long', 'puffs', 'bob', 'boy2'][(i * 3 + row) % 5],
    top: ['#6a4c93', '#1982c4', '#8ac926', '#ff595e', '#ffca3a'][(i + 2 * row) % 5], bottom: '#2f3e5c', skirt: (i + row) % 2 ? '#6a4c93' : null, mouth: jump ? 'open' : 'smile', eyes: 'happy', handL: [-.3 - sway, -.4], handR: [.3 - sway, -.4] }); } }
function karaoke(c, sc, t) { for (const sg of sc.songs) for (const l of sg.lines) { if (t < l.t - .1 || t > l.t + l.slot - .05) continue; const p = clamp((t - l.t) / Math.max(.3, l.d));
  c.save(); c.font = `68px ${FONT}`; const w = c.measureText(l.text).width; const x0 = W / 2 - w / 2, y = 960;
  fillRR(c, x0 - 40, y - 60, w + 80, 112, 30, 'rgba(20,10,30,.72)'); c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillStyle = '#ffffff'; c.fillText(l.text, x0, y); c.save(); c.beginPath(); c.rect(x0, y - 60, w * p, 120); c.clip(); c.fillStyle = '#ffd23f'; c.fillText(l.text, x0, y); c.restore();
  text(c, '♪', x0 - 70, y - 30, 50, '#ffd23f'); c.restore(); } }
function grayscale(c, k) { c.filter = k > 0 ? `grayscale(${k}) contrast(${1 + .15 * k})` : 'none'; }
function lightning(c, t, x, k = 1) { if (k <= 0) return; c.save(); c.globalAlpha = k; const r = rng(Math.floor(t * 7)); let px = x, py = 0; c.beginPath(); c.moveTo(px, py);
  while (py < 650) { px += (r() - .5) * 90; py += 50 + r() * 40; c.lineTo(px, py); } c.strokeStyle = '#fffbe0'; c.lineWidth = 8; c.shadowColor = '#fff'; c.shadowBlur = 30; c.stroke(); c.restore(); }
function shake(c, k, t) { if (k > 0) c.translate(Math.sin(t * 73) * 18 * k, Math.cos(t * 61) * 14 * k); }
function crib(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); fillRR(c, -170, -40, 340, 40, 8, '#c58c55', '#7a4b28', 4); for (let i = -4; i <= 4; i++) fillRR(c, i * 38 - 5, -160, 10, 130, 4, '#e0b07a'); fillRR(c, -180, -175, 360, 20, 8, '#c58c55', '#7a4b28', 4); c.restore(); }
function throne(c, x, y, s, evil = 1) { c.save(); c.translate(x, y); c.scale(s, s); const col = evil ? '#5a0f16' : '#e8c86a';
  fillRR(c, -140, -420, 280, 420, 30, col, '#1b0a0c', 6); fillRR(c, -170, -150, 340, 150, 20, evil ? '#7a1420' : '#f2d98a', '#1b0a0c', 6);
  for (const sx of [-1, 1]) poly(c, [sx * 140, -420, sx * 165, -470, sx * 110, -430], evil ? '#c4161c' : '#fff'); poly(c, [-30, -420, 0, -480, 30, -420], evil ? '#c4161c' : '#fff'); c.restore(); }
function flames(c, x, y, w, h, t, a = 1) { if (a <= 0) return; c.save(); c.globalAlpha *= a; for (let i = 0; i < 9; i++) { const fx = x - w / 2 + (i + .5) * w / 9, fh = h * (.6 + .4 * Math.sin(t * 9 + i * 1.7));
  c.beginPath(); c.moveTo(fx - w / 12, y); c.quadraticCurveTo(fx - w / 18, y - fh * .6, fx, y - fh); c.quadraticCurveTo(fx + w / 18, y - fh * .6, fx + w / 12, y); c.fillStyle = i % 2 ? '#ff6a1a' : '#ffb21a'; c.fill(); } c.restore(); }

/* ===== 1. THE SIN OF INDIANA ===== */
const SC_SIN = { id: 'sin',
  music: [['hum', 0, 'scratch', .9], ['spy', 'spy', 'n6', .9], ['horror', 'n6', 'boom', .6], ['horror', 'baby', 'heaven', .7], ['hum', 'heaven', 'bornInSin', 1], ['gospel', 'bornInSin', 'title>', 1, { bpm: 104 }]],
  sfx: [[.2, 'bell'], [.9, 'bell'], [1.6, 'bell'], [.5, 'chirp'], [2.4, 'chirp'], ['scratch', 'scratch'], ['n3', 'sting'], ['n4a', 'thud', .25], [['n4a', 1.5], 'thud', .25], [['n4a', 2.6], 'thud', .25],
    ['n6', 'page'], [['n6', .5], 'page'], [['n6', 1], 'page'], [['n6', 1.5], 'page'], ['quake', 'thunder'], [['quake', .3], 'rumble', 2.2], ['boom', 'boom'], ['baby', 'horrorHit'], [['n8a', .2], 'zap'],
    ['cackle', 'thunder'], [['n10a', .4], 'stampF'], ['heaven', 'harp'], [['heaven', .3], 'sparkle'], [['bornInSin', 10], 'sparkle'], ['n11', 'ding'], ['hal', 'tada'], ['title', 'sting'], [['title', .2], 'sparkle']],
  draw(c, t) {
    const night = after('spy') && !after('n6') ? 1 : 0;
    if (t < cu('n6')) { // ----- Indiana / the scandal -----
      const bw = after('scratch') && !after('spy') ? 1 : 0, z = 1 + .9 * easeIO(S('n3', 0, .6)) * (1 - easeIO(S('n4a', 0, .8))) + .35 * easeIO(S('n2', 0, 2.5));
      c.save(); grayscale(c, bw); camera(c, 960, lerp(540, 470, easeIO(S('n2', 0, 2.5))), z);
      hills(c, t, night); church(c, 380, 690, .9, after('open') && t < 3 ? t : 0); farmhouse(c, 1320, 700, .9, night);
      if (!night) birds(c, t);
      if (!night) { const g = after('n2', .8) ? 1 : 0;
        person(c, { who: 'luke', x: 840, y: 900, age: 'adult', shirt: '#577590', pants: '#3d405b', facing: 1, headRot: .05, handR: [.25, .3] });
        person(c, { who: 'stephanie', x: 1080, y: 900, age: 'woman', shirt: '#e07a5f', skirt: '#3d405b', shoes: '#5a2d2d', facing: -1, headRot: -.05, handL: [-.25, .3] });
        if (g) for (let i = 0; i < 4; i++) { const k = (t * .6 + i / 4) % 1; heart(c, 960 + Math.sin(i * 2 + t) * 50, 380 - k * 260, 26, '#ff4d6d', (1 - k) * (bw ? 0 : 1)); }
        const p = S('n4a', 0, cd('n4a')); ['NO WEDDING', 'NO VOWS', 'NO CERTIFICATE'].forEach((s, i) => { const k = clamp(p * 3 - i); if (k > 0) stamp(c, s + ' ✗', 1480, 250 + i * 95, 46, k, '#d62839', -.06 + i * .05); });
      } else { // spies at night
        const k = S('spy', 0, cd('n5') + .2); for (const [who, dx, age] of [['luke', 0, 'adult'], ['stephanie', -170, 'woman']]) {
          const x = lerp(-200, 2100, k) + dx, wp = Math.sin(t * 6), j = person(c, { who, x, y: 900 - Math.abs(wp) * 20, age, shirt: '#222', pants: '#111', skirt: who === 'stephanie' ? '#111' : null, shoes: '#000', footL: [wp * .18, -Math.max(0, wp) * .2], footR: [-wp * .18, -Math.max(0, -wp) * .2], handL: [-.3, .1], handR: [.3, .1], headDy: -10 });
          shades(c, j); }
        const sx = 960 + Math.sin(t * 1.3) * 600; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .18; poly(c, [sx - 30, 0, sx + 30, 0, sx + 220, 950, sx - 220, 950], '#fffbd0'); c.restore();
        bigText(c, 'TOP SECRET', 960, 160, 70, S('spy', .3, 1), '#d62839', { rot: -.08 }); }
      c.restore(); grayscale(c, 0);
    } else if (t < cu('boom')) { // ----- nine months later -----
      const quake = after('quake'); c.save(); shake(c, quake ? 1 : 0, t);
      if (!quake) { c.fillStyle = '#1a1a2a'; c.fillRect(0, 0, W, H); const k = S('n6', 0, cd('n6') + .8), months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP'], i = Math.min(8, Math.floor(k * 9));
        fillRR(c, 660, 220, 600, 640, 20, '#fff', '#b33', 8); fillRR(c, 660, 220, 600, 150, 20, '#d62828'); text(c, months[i], 960, 300, 100, '#fff'); text(c, String(i + 1), 960, 600, 260, '#2b2d42');
        bigText(c, '9 MONTHS LATER...', 960, 960, 70, S('n6', .2, 1), '#ffd23f'); }
      else { c.fillStyle = '#0b0b18'; c.fillRect(-50, -50, W + 100, H + 100); const fl = Math.max(0, Math.sin(t * 23)) > .7 ? 1 : 0; if (fl) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, 0, W, H); }
        lightning(c, t, 500 + Math.sin(t * 3) * 300, fl); fillRR(c, 560, 360, 800, 560, 6, '#dfe6ea'); fillRR(c, 700, 300, 520, 60, 8, '#c4161c'); text(c, 'HOSPITAL', 960, 332, 46, '#fff');
        for (let r = 0; r < 4; r++) for (let q = 0; q < 6; q++) fillRR(c, 600 + q * 125, 400 + r * 115, 90, 70, 4, (q + r + Math.floor(t * 8)) % 3 ? '#ffe27a' : '#ff4040');
        bigText(c, 'THE UNTHINKABLE.', 960, 200, 110, S('n7', 0, .6), '#fff'); }
      c.restore();
    } else if (t < cu('heaven') || true) { // ----- the baby -----
      const sb = cu('bornInSin'), ln = (CUR.sc.songs[0] || { lines: [] }).lines, li = i => ln[i] ? ln[i].t : 1e9;
      const holy = S('heaven', 0, 1.2), haloA = seg(t, li(0), li(0) + .8), hornA = 1 - seg(t, li(2), li(2) + .8), bibleK = seg(t, li(4), li(4) + .6);
      const evilBg = 1 - holy;
      c.save(); const z = 1 + .5 * easeIO(S('baby', 0, 1.2)) * (1 - easeIO(S('n8a', .6, 1.6))); camera(c, 960, lerp(540, 470, easeIO(S('baby', 0, 1.2)) * (1 - easeIO(S('n8a', .6, 1.6)))), z);
      // backgrounds: evil lair vs heaven
      if (evilBg > 0) { c.fillStyle = '#1a0508'; c.fillRect(-100, -100, W + 200, H + 200); flames(c, 960, 1000, 2200, 380, t, after('n8a') ? 1 : .3); }
      if (holy > 0) { c.save(); c.globalAlpha = holy; sky(c, '#fff6d6', '#ffe9a8'); for (let i = 0; i < 14; i++) { c.save(); c.translate(960, -100); c.rotate((i - 7) * .14 + Math.sin(t * .5) * .03); poly(c, [-20, 0, 20, 0, 90, 1400, -90, 1400], 'rgba(255,255,255,.35)'); c.restore(); }
        cloud(c, 300, 820, 260); cloud(c, 1650, 820, 280); cloud(c, 960, 900, 320); c.restore(); }
      const bx = 960, by = 830, onThrone = after('n8a') && !after('heaven');
      if (onThrone || holy > 0) throne(c, bx, by + 60, .95, holy < .5 ? 1 : 0); else crib(c, bx, by + 40, 1.1);
      if (after('n8a')) pitchfork(c, bx + 190, by + 20, 1.2, (1 - bibleK) * (1 - holy * 0));
      const raise = after('hal') ? easeOut(S('hal', 0, .3)) : 0;
      const j = person(c, { who: 'elijah', look: 'baby', baby: true, x: bx, y: by, H: 540, fh: 210, cape: after('n8a') && hornA > .5, shirt: '#9fd3ff', evil: (after('baby') ? 1 : 0) * hornA * (1 - holy) });
      const hh = j.head; horns(c, hh.x, hh.top + hh.fh * .3, hh.fh * .95, after('n8a') ? hornA : 0); halo(c, hh.x, hh.top - 10, hh.fh * .8, haloA);
      bible(c, bx + 175, by - 120, .8, .15, bibleK, 1); if (raise) { c.save(); c.translate(j.handL.x, j.handL.y); c.rotate(-.3); fillRR(c, -16, -raise * 150, 32, raise * 150, 14, '#ecb59c'); circ(c, 0, -raise * 150, 22, '#ecb59c'); c.restore(); }
      // parents
      if (after('n9') && !after('heaven')) { const appr = easeIO(S('d3', 0, 1));
        const jl = person(c, { who: 'luke', x: lerp(380, 560, appr), y: 960, age: 'adult', shirt: '#577590', pants: '#3d405b', handL: [.02, -.42], handR: [-.02, -.42], bendL: .5, bendR: -.5, red: after('n10a') ? .2 : 0, bigEyes: !after('d3') ? 1 : 0 });
        const js = person(c, { who: 'stephanie', x: lerp(1540, 1360, appr), y: 960, age: 'woman', shirt: '#e07a5f', skirt: '#3d405b', handL: [.02, -.42], bendL: .5, bendR: -.5, handR: appr > 0 ? [-.25, .1] : [-.02, -.42], tears: after('n10a') ? 1 : 0 });
        if (appr > 0) bible(c, js.handR.x, js.handR.y - 20, .8, -.2, 1, 0); void jl; }
      if (holy > 0) { for (let i = 0; i < 4; i++) angel(c, [260, 600, 1320, 1660][i], lerp(-300, [330, 250, 250, 330][i], easeOut(S('heaven', i * .25, 1.8 + i * .25))), .8, t, i);
        if (after('bornInSin')) congregation(c, t, 1180, after('hal') && !after('title') ? 1 : 0, 12); }
      if (after('hal')) confetti(c, t - cu('hal'), 80, 9);
      birthCert(c, 1500, 330, .8, S('n10a', .3, 1.2) * (1 - S('d3', 0, .4)));
      c.restore();
      if (after('cackle') && !after('n10a', 1)) lightning(c, t, 300, Math.max(0, Math.sin((t - cu('cackle')) * 14)));
      if (!after('heaven')) bigText(c, 'MWAHAHA', 960, 140, 90, S('cackle', 0, .5) * (1 - S('cackle', 1.6, 2)), '#ff2a2a');
      karaoke(c, CUR.sc, t);
      bigText(c, 'HALLELUJAH!', 960, 190, 130, S('hal', 0, .5) * (1 - S('hal', 2.4, 2.8)), '#ffd23f');
      // title card
      const tk = S('title', 0, .6); if (tk > 0) { c.save(); c.globalAlpha = tk; c.fillStyle = 'rgba(20,8,10,.82)'; c.fillRect(0, 0, W, H); c.restore();
        for (let i = 0; i < 10; i++) sparkle(c, 960 + Math.cos(i / 10 * TAU + t) * 640, 470 + Math.sin(i / 10 * TAU + t) * 300, 18 + 8 * Math.sin(t * 4 + i), tk, t);
        bigText(c, 'ELIJAH', 960, 420, 230, tk, '#ffd23f', { stroke: '#2a0a0e' }); bigText(c, 'CONCEIVED IN SIN. DELIVERED IN GLORY.', 960, 610, 64, S('title', .5, 1), '#fff'); }
    }
  } };

/* ===== 2. THE ARRIVAL OF THE SISTERS ===== */
function livingRoom(c, t) { c.fillStyle = '#f4d9a8'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.25)'; for (let y = 0; y < 760; y += 70) for (let x = 0; x < W; x += 70) circ(c, x + (y / 70 % 2) * 35, y, 6);
  c.fillStyle = '#b9834f'; c.fillRect(0, 760, W, 320); fillRR(c, 1450, 170, 300, 240, 10, '#fff'); fillRR(c, 1464, 184, 272, 212, 4, '#9fd6ff'); ell(c, 960, 930, 640, 80, '#c95b6b'); }
function giftBox(c, x, y, s, p, col = '#ff4d6d') { if (p >= 1) return; c.save(); c.translate(x, y); c.scale(s, s); const lid = easeOut(clamp(p * 2)), shakeA = p <= 0 ? Math.sin(CUR.t * 30) * .06 : 0; c.rotate(shakeA);
  fillRR(c, -90, -150, 180, 150, 6, col, shade(col, -.4), 4); fillRR(c, -15, -150, 30, 150, 2, '#ffd23f'); c.save(); c.translate(0, -150 - lid * 260); c.rotate(lid * 2); fillRR(c, -100, -30, 200, 34, 6, col, shade(col, -.4), 4); fillRR(c, -15, -30, 30, 34, 2, '#ffd23f'); c.restore(); c.restore(); }
const SC_SISTERS = { id: 'sisters',
  music: [['romance', 0, 's2', .7, { bpm: 90 }], ['villain', 's2', 'sis1', .6], ['circus', 'sis1', 's9', .9], ['sad', 's9', 's9>', .4]],
  sfx: [['s2', 'thunder'], ['sis1', 'pop'], [['sis1', .1], 'boing'], ['sis2', 'pop'], [['sis2', .1], 'boing'], ['s6', 'sting'], ['count', 'squeak'], [['count', .7], 'squeak'], ['montage', 'whoosh'], [['s8', 1.6], 'thud', .3], [['s8', 2.3], 'thud', .3], [['s8', 3.0], 'thud', .3], ['blame1', 'scratch'], ['s9', 'stampF']],
  draw(c, t) {
    const mont = after('montage');
    if (!mont) { livingRoom(c, t);
      // throne of toys
      const sx = 960, gl = 1 - S('s2', 0, 1) * .6; for (let i = 0; i < 7; i++) fillRR(c, sx - 260 + i * 75, 760 - (i % 3) * 30, 70, 70, 8, ['#ff4d6d', '#ffd23f', '#3bceac', '#4d96ff', '#b36bff', '#ff8c42', '#3bceac'][i]);
      throne(c, sx, 830, .7, 0); ell(c, sx - 330, 780, 70, 90, '#a0703f'); circ(c, sx - 330, 690, 55, '#a0703f'); circ(c, sx - 370, 650, 22, '#a0703f'); circ(c, sx - 290, 650, 22, '#a0703f');
      if (after('s2')) { c.fillStyle = `rgba(20,20,50,${.35 * S('s2', 0, .6)})`; c.fillRect(0, 0, W, H); }
      const shock = after('sis1', .6) ? 1 : 0, count = after('count'), cnt = count ? clamp(Math.floor((t - cu('count')) / .7) + 1, 1, 2) : 0;
      const j = person(c, { who: 'elijah', look: 'kid', x: sx, y: 770, age: 'tod', shirt: '#4d96ff', outfit: 'stripes', stripe: '#ffd23f', pants: '#3b4a6b', shorts: true, shoes: '#e94f64',
        bigEyes: shock && !count ? 1 : 0, red: after('sis2') && !count ? .3 : 0, handR: count ? [.35, -.35] : [.1, .35], handL: count && cnt > 1 ? [-.35, -.35] : [-.1, .35], headDy: Math.sin(t * 5) * 3 * gl });
      const hh = j.head; c.save(); c.translate(hh.x, hh.top + 8); poly(c, [-55, 0, -55, -50, -28, -22, 0, -60, 28, -22, 55, -50, 55, 0], '#ffd23f', '#b8860b', 3); c.restore();
      if (count) for (let k = 0; k < cnt; k++) text(c, String(k + 1), j[k ? 'handL' : 'handR'].x, j[k ? 'handL' : 'handR'].y - 60, 60, '#fff', { stroke: '#222' });
      // sisters pop out of presents
      for (const [cue, who, x, col] of [['sis1', 'alyssa', 560, '#ff4d6d'], ['sis2', 'naomi', 1360, '#3bceac']]) { giftBox(c, x, 860, 1, S(cue, 0, .6), col);
        if (after(cue)) { const k = backOut(S(cue, 0, .5)); c.save(); c.translate(x, 860); c.scale(k, k); person(c, { who, look: 'kid', baby: true, x: 0, y: 0, H: 440, fh: 165, shirt: '#ffd6e7', noHair: true, jaw: 0 }); c.restore(); } }
      bigText(c, 'ANOTHER ONE.', 960, 170, 110, S('s6', 0, .5), '#d62839');
      if (after('s7')) { const k = S('s7', 0, .4); c.save(); c.globalAlpha = k; text(c, 'NO RETURNS', 960, 300, 64, '#d62839', { stroke: '#fff', sw: 10, rot: -.1 }); c.restore(); }
    } else { // childhood montage: four panels
      c.fillStyle = '#2b2d42'; c.fillRect(0, 0, W, H); const P = [[0, 0, 'CHRISTMAS'], [960, 0, 'BIRTHDAYS'], [0, 540, 'SIBLING WARFARE'], [960, 540, 'WHO DID THIS?']];
      P.forEach(([px, py, label], i) => { const k = S('montage', i * .5, i * .5 + .4); if (k <= 0) return; c.save(); c.translate(px + 480, py + 270); c.scale(backOut(k), backOut(k)); c.translate(-480, -270);
        c.beginPath(); c.rect(12, 12, 936, 516); c.clip(); c.fillStyle = ['#cfe8ff', '#ffe3ec', '#f3e1c6', '#e6e0ff'][i]; c.fillRect(0, 0, 960, 540);
        if (i === 0) { poly(c, [160, 470, 300, 120, 440, 470], '#2f7d4a'); for (let q = 0; q < 6; q++) circ(c, 220 + q * 40, 260 + (q % 3) * 60, 10, ['#ff4d6d', '#ffd23f', '#4d96ff'][q % 3]); for (let q = 0; q < 3; q++) giftBox(c, 560 + q * 120, 480, .5, 0, ['#ff4d6d', '#3bceac', '#b36bff'][q]); }
        if (i === 1) { fillRR(c, 360, 330, 240, 120, 12, '#fff', '#e09', 4); for (let q = 0; q < 5; q++) { fillRR(c, 395 + q * 40, 280, 10, 50, 3, '#4d96ff'); ell(c, 400 + q * 40, 272, 6, 10, '#ffb627'); } }
        if (i === 2) { const r = rng(Math.floor(CUR.t * 10)); c.save(); c.translate(480, 300); for (let q = 0; q < 14; q++) circ(c, (r() - .5) * 360, (r() - .5) * 220, 50 + r() * 40, '#e6d3b3'); for (let q = 0; q < 5; q++) line(c, [(r() - .5) * 300, (r() - .5) * 200, (r() - .5) * 420, (r() - .5) * 280], '#ecb59c', 18); c.restore(); comic(c, 'POW!', 760, 120, 40, (CUR.t * 1.5) % 1); }
        const faces = i === 2 ? [['elijah_kid', 340, 230], ['alyssa_kid', 600, 210], ['naomi_kid', 470, 380]] : [['elijah_kid', 230, 260], ['alyssa_kid', 700, 250], ['naomi_kid', 830, 330]];
        if (i === 3) { drawFace(c, 'elijah_kid', 480, 270, 150, Math.sin(CUR.t * 3) * .05, { jaw: talk('elijah'), bigEyes: 1 }); drawFace(c, 'alyssa_kid', 200, 300, 120, .1, { jaw: talk('alyssa_kid') }); halo(c, 200, 195, 120); drawFace(c, 'naomi_kid', 760, 300, 120, -.1, { jaw: talk('naomi_kid') }); halo(c, 760, 195, 120);
          for (const s of [-1, 1]) { c.save(); c.translate(480 + s * 360, 60); c.rotate(s * 2.4); fillRR(c, -14, 0, 28, 160, 12, '#ecb59c'); circ(c, 0, 165, 22, '#ecb59c'); c.restore(); } }
        else for (const [k2, fx, fy] of faces) drawFace(c, k2, fx, fy + Math.sin(CUR.t * 6 + fx) * 6, 130, Math.sin(CUR.t * 4 + fx) * .1);
        c.restore(); fillRR(c, px + 30, py + 30, 330, 60, 12, '#ffd23f'); text(c, label, px + 195, py + 62, 34, '#2b2d42'); });
      birthCert(c, 960, 520, .9, S('s9', 0, 1)); parentsCringe(c, 1640, 820, S('s9', .4, 4)); }
  } };

/* ===== 3. THE BELIEVER (Bigfoot) ===== */
function forestNight(c, t) { c.fillStyle = '#0b1530'; c.fillRect(0, 0, W, H); circ(c, 1600, 160, 70, '#f6f0c8'); for (let i = 0; i < 50; i++) circ(c, (i * 389) % W, (i * 211) % 420, 2, 'rgba(255,255,255,.8)');
  for (let i = 0; i < 16; i++) pineTree(c, -60 + i * 135, 760 + (i % 3) * 14, 380 + (i % 4) * 70, 1); c.fillStyle = 'rgba(8,16,30,.45)'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#16261a'; c.fillRect(0, 780, W, 300); }
function campfire(c, x, y, t) { for (let i = 0; i < 5; i++) { c.save(); c.translate(x, y); c.rotate(i / 5 * PI - PI / 2 + .3); fillRR(c, -8, -70, 16, 80, 6, '#6b4423'); c.restore(); }
  flames(c, x, y - 10, 110, 120, t); const g = c.createRadialGradient(x, y - 40, 10, x, y - 40, 520); g.addColorStop(0, 'rgba(255,170,60,.35)'); g.addColorStop(1, 'rgba(255,170,60,0)'); c.fillStyle = g; c.fillRect(x - 520, y - 560, 1040, 1040); }
function flashlight(c, x, y, ang, len = 700, a = .22) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.translate(x, y); c.rotate(ang); poly(c, [0, -10, len, -170, len, 170, 0, 10], '#fff7c0'); c.restore(); }
const SC_BIGFOOT = { id: 'bigfoot',
  music: [['sneaky', 0, 'reveal', .6], ['mystery', 'reveal', 'camp', .9], ['camp', 'camp', 'walkby', .5], ['sneaky', 'walkby', 'b9', .9], ['mystery', 'b9', 'b10>', .7]],
  sfx: [['reveal', 'sting'], ['b2', 'thunder'], [['b4', .5], 'stampF'], ['camp', 'crickets', 9], [['camp', 1.4], 'owl'], [['walkby', 3.2], 'twig'], [['walkby', 3.3], 'whoosh']],
  draw(c, t) {
    if (!after('camp')) { // bedroom conspiracy board
      c.fillStyle = '#3a4a5a'; c.fillRect(0, 0, W, H); c.fillStyle = '#5a4a3a'; c.fillRect(0, 800, W, 280);
      const z = 1 + .5 * easeIO(S('reveal', 0, 1)) * (1 - easeIO(S('b3', 0, .6))); c.save(); camera(c, lerp(960, 1200, easeIO(S('reveal', 0, 1)) * (1 - easeIO(S('b3', 0, .6)))), 450, z);
      fillRR(c, 900, 140, 640, 460, 10, '#c9a46a', '#7a5230', 8); for (const [x, y, r] of [[1000, 230, -.05], [1420, 240, .06], [1050, 480, .04], [1400, 500, -.04]]) { c.save(); c.translate(x, y); c.rotate(r); fillRR(c, -80, -60, 160, 120, 3, '#eee'); fillRR(c, -70, -50, 140, 90, 2, '#5a7a5a'); bigfoot(c, 0, 35, .17, { a: .7 }); c.restore(); }
      line(c, [1000, 230, 1220, 360, 1420, 240], '#d62839', 3); line(c, [1050, 480, 1220, 360, 1400, 500], '#d62839', 3); fillRR(c, 1110, 320, 220, 80, 6, '#fff7a8'); text(c, 'HE IS REAL', 1220, 360, 34, '#d62839');
      c.restore();
      person(c, { who: 'elijah', look: 'kid', x: 520, y: 900, age: 'kid', shirt: '#4b6b3a', pants: '#5a4a2a', shoes: '#3a2a1a', handR: after('b3') ? [.4, -.3] : [.1, .35], handL: [-.1, .35], bigEyes: S('b2', 0, .3) * (1 - S('b3', 0, .3)) });
      bigText(c, 'BIGFOOT.', 960, 900, 150, S('b2', 0, .5) * (1 - S('b3', 0, .4)), '#ffd23f');
      if (after('b4')) { stamp(c, 'SCIENCE SAYS: NO', 1220, 720, 56, S('b4', 0, .5)); stamp(c, 'ELIJAH SAYS: YES', 1220, 830, 56, S('b4', 1.4, 1.9), '#2a9d8f', .08); }
    } else { // the expedition
      forestNight(c, t); campfire(c, 960, 900, t); fillRR(c, 1350, 700, 10, 10, 0, '#000'); poly(c, [1250, 880, 1420, 640, 1590, 880], '#c8702e', '#6b3a17', 4); poly(c, [1390, 880, 1420, 700, 1450, 880], '#6b3a17');
      const wb = S('walkby', 0, 3.2), turned = after('walkby', 3.3);
      // Bigfoot strolls right behind them
      if (wb > 0 && wb < 1) bigfoot(c, lerp(-200, 2100, wb), 820, 1.05, { walk: wb * 5, wave: wb > .42 && wb < .58, armUp: wb > .42 && wb < .58 });
      const fl = turned ? -1 : 1;
      const je = person(c, { who: 'elijah', look: 'kid', x: 720, y: 930, age: 'kid', shirt: '#4b6b3a', pants: '#5a4a2a', shoes: '#3a2a1a', handR: [.25 * fl, .05], facing: fl, sweat: after('b8') && !turned ? .5 : 0 });
      const jl = person(c, { who: 'levi', x: 1180, y: 930, age: 'kid', shirt: '#c8553d', pants: '#2f3e5c', shoes: '#333', handL: [-.25 * fl, .05], facing: -fl, eyes: after('b7') && !after('b8') ? 'closed' : null });
      flashlight(c, je.handR.x, je.handR.y, fl > 0 ? -.2 : PI + .2); flashlight(c, jl.handL.x, jl.handL.y, fl > 0 ? PI + .2 : -.2);
      if (after('b6')) { const k = S('b6', 0, .4) * (1 - S('b7', 0, .3)); if (k > 0) { fillRR(c, 1010, 420, 340, 90, 14, `rgba(255,210,63,${k})`); text(c, 'LEVI', 1180, 452, 44, `rgba(43,45,66,${k})`); text(c, 'loyal companion', 1180, 490, 26, `rgba(43,45,66,${k})`, { font: FONT2, weight: 600 }); } }
      if (turned) { exclaim(c, 720, 380, .8, S('walkby', 3.3, 3.8)); exclaim(c, 1180, 380, .8, S('walkby', 3.3, 3.8)); }
      if (after('b10')) bigfoot(c, 1700, 520, .55, { wave: true, armUp: true, a: S('b10', 0, .5) });
    }
  } };

/* ===== 4. THE GREAT LOVE TRIANGLE THAT WASN'T ===== */
function hallway(c) { c.fillStyle = '#e9edf2'; c.fillRect(0, 0, W, H); for (let i = 0; i < 14; i++) { fillRR(c, i * 140, 260, 128, 500, 6, ['#3a86ff', '#2a6fdb'][i % 2], '#1d4e89', 3); line(c, [i * 140 + 30, 330, i * 140 + 100, 330], '#1d4e89', 4); line(c, [i * 140 + 30, 350, i * 140 + 100, 350], '#1d4e89', 4); circ(c, i * 140 + 110, 520, 7, '#ccc'); }
  c.fillStyle = '#c9c2b6'; c.fillRect(0, 760, W, 320); c.fillStyle = '#d9d2c6'; for (let i = 0; i < 12; i++) c.fillRect(i * 170, 760, 85, 320); }
function coffeeShop(c, t) { c.fillStyle = '#6f4e37'; c.fillRect(0, 0, W, H); fillRR(c, 140, 120, 760, 420, 8, '#bfe3ff', '#3b2a20', 12); fillRR(c, 1020, 120, 760, 420, 8, '#bfe3ff', '#3b2a20', 12);
  c.fillStyle = '#8bc4e8'; c.fillRect(152, 420, 736, 108); c.fillRect(1032, 420, 736, 108); text(c, 'COFFEE', 960, 80, 60, '#ffd8a8');
  for (const [x, col] of [[520, '#1982c4'], [1400, '#ff595e']]) { line(c, [x, 580, x, 300], '#888', 6); poly(c, [x, 300, x + 120, 330, x, 360], col); } }
const SC_TRIANGLE = { id: 'triangle',
  music: [['sneaky', 0, 'hearts', .7], ['romance', 'hearts', 'cut', 1, { bpm: 72 }], ['villain', 'rage', 'summit', 1], ['summit', 'summit', 'detail', .9], ['sad', 'shatter', 't14', .9], ['summit', 't14', 't14>', .8]],
  sfx: [['hearts', 'harp'], [['hearts', .9], 'thud', .3], ['cut', 'scratch'], ['rage', 'thunder'], [['rage', .2], 'steam', 2], ['t6', 'sting'], ['summit', 'sting'], ['detail', 'whoosh'], ['shatter', 'shatter'], [['t14', 1.5], 'ding']],
  draw(c, t) {
    if (!after('summit')) { hallway(c);
      const rage = after('rage') ? 1 : 0, faint = easeOut(S('hearts', .7, 1.3)) * (1 - easeIO(S('t3', 0, .6)));
      if (rage) { c.fillStyle = `rgba(120,0,0,${.4 * S('rage', 0, .4)})`; c.fillRect(0, 0, W, H); lightning(c, t, 300, Math.max(0, Math.sin(t * 9)) > .8 ? 1 : 0); lightning(c, t + 3, 1600, Math.max(0, Math.sin(t * 7 + 1)) > .85 ? 1 : 0); }
      const z = 1 + .9 * easeIO(S('t5', 0, 1.2)) * (1 - easeIO(S('t7', 0, .6))); c.save(); camera(c, lerp(960, 1450, easeIO(S('t5', 0, 1.2)) * (1 - easeIO(S('t7', 0, .6)))), lerp(540, 420, easeIO(S('t5', 0, 1.2)) * (1 - easeIO(S('t7', 0, .6)))), z);
      const grab = easeOut(S('t7', .2, .7));
      const je = person(c, { who: 'elijah', look: 'kid', x: lerp(860, 1180, grab), y: 930 - grab * 40, age: 'kid', shirt: '#4d96ff', pants: '#3b4a6b', shoes: '#333', bigEyes: grab, handL: grab ? [-.3, -.3] : [-.1, .35], handR: grab ? [.3, -.3] : [.1, .35] });
      c.save(); c.translate(420, 930); c.rotate(-faint * 1.3); c.translate(-420, -930);
      person(c, { who: 'vivian', x: 420, y: 930, age: 'kid', shirt: '#b36bff', skirt: '#6a4c93', shoes: '#fff', eyes: after('hearts') ? 'happy' : null, handL: [-.2, -.2], handR: [.2, -.2] }); c.restore();
      if (after('hearts')) { for (let i = 0; i < 8; i++) { const k = (t * .5 + i / 8) % 1; heart(c, 420 + Math.sin(i * 2.4 + t * 2) * 140, 520 - k * 400, 28, '#ff4d6d', 1 - k); } }
      const jl = person(c, { who: 'levi', x: 1450, y: 930, age: 'kid', shirt: '#c8553d', pants: '#2f3e5c', shoes: '#333', handL: grab ? [-.45, -.15] : [-.1, .35], handR: rage ? [.25, -.4] : [.1, .35] });
      if (rage) { steam(c, jl.head.x, jl.head.y - 40, 140, 1, t); c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .55; circ(c, jl.head.x, jl.head.y - 50, 100, '#ff2a2a'); c.restore(); }
      c.restore(); void je;
      // notebook
      const nb = S('t3', 0, .5) * (1 - S('cut', 0, .3)); if (nb > 0) { c.save(); c.translate(960, 380); c.scale(backOut(nb), backOut(nb)); c.rotate(-.04); fillRR(c, -330, -210, 660, 420, 10, '#fffdf4', '#3a86ff', 6);
        for (let i = 0; i < 7; i++) line(c, [-300, -150 + i * 52, 300, -150 + i * 52], '#bcd4f6', 2); text(c, 'Vivian + Elijah', 0, -60, 58, '#ff2d55', { font: FONT2, weight: 700 }); text(c, 'Mrs. Vivian Elijah', 0, 30, 44, '#ff2d55', { font: FONT2, weight: 600 });
        const n = Math.floor(clamp(S('t4', 0, 2)) * 18) + 4; for (let i = 0; i < n; i++) heart(c, -280 + (i * 97) % 560, -170 + (i * 53) % 330, 20, '#ff2d55'); c.restore(); }
      bigText(c, 'ELIJAH!', 1450, 200, 120, S('t6', 0, .4) * (1 - S('t7', .4, .8)), '#ff2a2a');
    } else { // THE COFFEE SUMMIT
      coffeeShop(c, t);
      if (after('t8', 1) && !after('detail')) { c.save(); c.beginPath(); c.rect(152, 132, 736, 396); c.clip(); bigfoot(c, lerp(80, 980, S('t8', 1, 6)), 640, .55, { walk: t * 1.2, wave: S('t8', 1, 6) > .45 && S('t8', 1, 6) < .6, armUp: S('t8', 1, 6) > .45 && S('t8', 1, 6) < .6 }); c.restore(); }
      const det = easeIO(S('detail', 0, .8)) * (1 - easeIO(S('t14', 0, .6))); c.save(); camera(c, lerp(960, 960, det), lerp(540, 480, det), 1 + det * .9);
      // the families on either side, kids in the middle
      person(c, { who: 'luke', x: 220, y: 1000, age: 'adult', shirt: '#577590', pants: '#3d405b', s: .85, handR: [.3, .05] });
      person(c, { who: 'stephanie', x: 420, y: 1000, age: 'woman', shirt: '#e07a5f', skirt: '#3d405b', s: .85, handL: [-.2, .2] });
      drawToon(c, { x: 1520, y: 1000, H: 600, skin: '#f0c8a8', hair: '#6b4a2e', style: 'boy', top: '#2a9d8f', bottom: '#333', handL: [-.3, .05] });
      drawToon(c, { x: 1720, y: 1000, H: 580, skin: '#f0c8a8', hair: '#b58a52', style: 'bob', top: '#e9c46a', skirt: '#264653', handL: [-.2, .2] });
      const point = after('t9') ? 1 : 0;
      person(c, { who: 'levi', x: 1230, y: 900, age: 'kid', shirt: '#c8553d', pants: '#2f3e5c', handL: point ? [-.6, -.15] : [-.1, .3], red: point && !after('t10') ? .5 : 0, steam: point && !after('t10') ? .6 : 0 });
      const vivBreak = after('shatter');
      person(c, { who: 'vivian', x: 1000, y: 900, age: 'kid', shirt: '#b36bff', skirt: '#6a4c93', eyes: vivBreak ? 'closed' : 'happy', handL: [-.15, .1], handR: [.15, .1] });
      const je = person(c, { who: 'elijah', look: 'kid', x: 720, y: 900, age: 'kid', shirt: '#4d96ff', pants: '#3b4a6b', handR: [.05, .05], handL: [-.12, .25] });
      // muffin
      c.save(); c.translate(je.handR.x + 10, je.handR.y - 20); ell(c, 0, 0, 40, 26, '#c8823c'); fillRR(c, -30, 0, 60, 40, 6, '#e3b87a'); c.restore();
      // the table
      fillRR(c, 0, 820, W, 60, 10, '#3b2a20'); fillRR(c, 0, 880, W, 200, 0, '#2c1f17'); for (const x of [600, 860, 1120, 1380]) { fillRR(c, x - 30, 760, 60, 70, 8, '#fff', '#ccc', 3); fillRR(c, x - 24, 768, 48, 12, 4, '#6f4e37'); }
      fillRR(c, 160, 735, 300, 70, 8, '#fff', '#1982c4', 4); text(c, "ELIJAH'S FAMILY", 310, 770, 30, '#1982c4'); fillRR(c, 1460, 735, 300, 70, 8, '#fff', '#ff595e', 4); text(c, "LEVI'S FAMILY", 1610, 770, 30, '#ff595e');
      if (vivBreak) { const k = S('shatter', 0, 1.4); const r = rng(3); for (let i = 0; i < 12; i++) { const a = r() * TAU, d = easeOut(k) * 300; c.save(); c.translate(1000 + Math.cos(a) * d, 420 + Math.sin(a) * d + k * k * 300); c.rotate(r() * 6 * k); poly(c, [0, 0, 22, 8, 8, 26], '#ff2d55'); c.restore(); } if (k < .1) heart(c, 1000, 420, 90, '#ff2d55'); }
      else if (after('t10')) heart(c, 1000, 420, 60 + Math.sin(t * 9) * 6, '#ff2d55');
      c.restore();
      if (after('detail') && !after('t14')) stamp(c, 'INTEREST LEVEL: 0%', 960, 160, 64, S('t13', 0, .5));
      if (after('t14')) { const k = S('t14', .6, 1.4); if (k > 0) { c.save(); c.translate(960, 420); c.scale(backOut(k), backOut(k)); fillRR(c, -330, -200, 660, 400, 10, '#fbf6e4', '#8a6a3a', 6); text(c, 'PEACE TREATY', 0, -130, 54, '#5a4020');
        text(c, 'Article 1: Elijah may keep his muffin.', 0, -40, 28, '#5a4020', { font: FONT2, weight: 600 }); text(c, 'Article 2: Nobody likes anybody.', 0, 0, 28, '#5a4020', { font: FONT2, weight: 600 }); stamp(c, 'RATIFIED', 0, 110, 60, clamp(k * 2 - 1), '#2a9d8f'); c.restore(); } }
    }
  } };

/* ===== 5. JOSEPH AND THE LONG-HAIRED DISTRACTION ===== */
function street(c, t, golden = 0) { sky(c, golden ? '#ffb36b' : '#8fd3ff', golden ? '#ffe3b0' : '#eaf8ff'); for (let i = 0; i < 6; i++) roundTree(c, 100 + i * 340, 760, 320, '#4caf50');
  c.fillStyle = '#cfc8bb'; c.fillRect(0, 760, W, 320); c.fillStyle = '#bdb6a8'; for (let i = 0; i < 12; i++) c.fillRect(i * 180, 760, 4, 320); }
const SC_EMMA = { id: 'emma',
  music: [['camp', 0, 'joseph', .6], ['heroic', 'joseph', 'e6', .9], ['harp', 'emma', ['emma', 2], 1], ['romance', ['emma', 2], 'pepper', 1, { bpm: 66 }], ['hum', 'pepper', 'e13', .8]],
  sfx: [['e1', 'zip'], ['joseph', 'flyby'], [['joseph', .4], 'sting'], ['emma', 'harp'], [['emma', .3], 'sparkle'], ['cooked', 'boing'], [['cooked', 1.6], 'thud', .4], ['pepper', 'ding'], [['e12', .1], 'sparkle'], ['e13', 'trombone']],
  draw(c, t) {
    const em = after('emma'), slow = em && !after('cooked', 3) ? 1 : 0;
    street(c, t, em ? 1 : 0);
    const grow = easeIO(S('e1', 0, 2.2)), jo = easeOut(S('joseph', 0, 1.6));
    // Joseph's entrance
    if (after('joseph')) { const jx = lerp(2200, 1180, jo), arm = after('e3') ? 1 : 0;
      if (!em) for (let i = 0; i < 3; i++) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .12 * (1 - jo * .5); circ(c, jx - 80 + i * 40, 300, 160 - i * 40, '#fff6c8'); c.restore(); }
      const jj = person(c, { who: 'joseph', x: em ? 1500 : jx, y: 930, age: 'adult', shirt: '#2a9d8f', outfit: 'button', pants: '#264653', handL: arm && !em ? [-.55, -.05] : [-.1, .35], handR: after('e13') ? [-.05, -.35] : [.1, .35], wind: 1 });
      if (!after('e6')) shades(c, jj); if (!em) bigText(c, 'JOSEPH', jx, 140, 90, S('joseph', .6, 1.1) * (1 - S('e6', 0, .4)), '#ffd23f');
      if (after('e4') && !em) stamp(c, 'MENTOR', 1560, 420, 56, S('e4', 0, .4), '#2a9d8f'); }
    // Elijah grows up (kid face to HONDO face)
    const fall = easeIn(S('cooked', 1.0, 1.7)), fx = em ? 520 : 860;
    c.save(); c.translate(fx, 930); c.rotate(-fall * 1.45); c.translate(-fx, -930);
    const kid = grow < .5;
    person(c, { who: 'elijah', look: kid ? 'kid' : null, x: fx, y: 930, H: lerp(470, 700, grow), fh: lerp(165, 150, grow), shirt: '#6f8fb0', pants: '#2b2b2b', shoes: '#eee',
      jaw: after('cooked') ? .7 : null, hearts: S('cooked', 0, .4), bigEyes: 0, handL: after('pepper') ? [-.15, .1] : [-.1, .35], handR: after('pepper') ? [.15, .1] : [.1, .35] });
    c.restore();
    if (grow > 0 && grow < 1) for (let i = 0; i < 6; i++) line(c, [fx - 120 + i * 48, 940, fx - 120 + i * 48, 920 - grow * 600], `rgba(255,255,255,${.4 * Math.sin(grow * PI)})`, 6);
    if (after('cooked', 1.7)) for (let i = 0; i < 6; i++) heart(c, fx - 260 + Math.cos(t * 3 + i) * 90, 860 + Math.sin(t * 3 + i) * 30, 22, '#ff4d6d');
    // Emma's entrance
    if (em) { const k = easeOut(S('emma', 0, 2.2)), ex = lerp(2100, 1160, k), wind = 1.2 + Math.sin(t * 2) * .3, hairK = 1 + 1.4 * easeIO(S('e8', 0, cd('e8')));
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .25; circ(c, ex, 420, 380, '#fff3c0'); c.restore();
      person(c, { who: 'emma', x: ex, y: 930, age: 'woman', shirt: '#f4a6b8', skirt: '#7a4a9a', shoes: '#fff', wind, hairK, handL: after('pepper') ? [-.15, .1] : [-.1, .35] });
      for (let i = 0; i < 12; i++) sparkle(c, ex + Math.cos(t * 1.5 + i) * 260, 500 + Math.sin(t * 2 + i * 2) * 300, 16 + 6 * Math.sin(t * 5 + i), .9, t);
      bigText(c, 'EMMA', ex, 140, 100, S('e7', 0, .5) * (1 - S('e8', 0, .4)), '#ff8fb1');
      stamp(c, 'COOKED', fx, 260, 80, S('e9', 0, .4) * (1 - S('e10', 0, .3)), '#ff6a1a');
      if (after('pepper')) { drPepper(c, fx + 150, 760, 1.3, .1, 1); drPepper(c, ex - 150, 760, 1.3, -.1, 1); bigText(c, 'DR PEPPER', 960, 200, 100, S('e12', 0, .5), '#8a1c2c', { stroke: '#fff' }); } }
    if (slow) { c.fillStyle = 'rgba(255,210,150,.08)'; c.fillRect(0, 0, W, H); }
  } };

/* ===== 6. THE ELI PROBLEM ===== */
const SC_ELI = { id: 'eli',
  music: [['villain', 0, 'noble', .9], ['sad', 'noble', 'i8>', .8]],
  sfx: [['eli', 'thunder'], [['i4', 0], 'zap'], [['i4', .5], 'zap'], [['i4', 1], 'zap'], [['i4', 1.5], 'zap'], ['zone', 'stampF'], [['zone', .1], 'sting']],
  draw(c, t) {
    const bench = after('bench');
    if (!bench) { sky(c, '#3a3f5a', '#7a7f9a'); c.fillStyle = '#5a6a4a'; c.fillRect(0, 760, W, 320);
      for (let i = 0; i < 5; i++) { c.save(); c.globalAlpha = .9; cloud(c, 200 + i * 400 + Math.sin(t + i) * 30, 120, 260, .9); c.restore(); } c.fillStyle = 'rgba(30,30,50,.35)'; c.fillRect(0, 0, W, H);
      lightning(c, t, 1300, Math.max(0, Math.sin(t * 5)) > .9 ? 1 : 0);
      const ek = easeOut(S('eli', 0, 1));
      person(c, { who: 'emma', x: 1060, y: 930, age: 'woman', shirt: '#f4a6b8', skirt: '#7a4a9a', tears: after('i4') ? .6 : 0 });
      person(c, { who: 'eli', x: lerp(2100, 1380, ek), y: 930, age: 'adult', shirt: '#2b2d42', outfit: 'hoodie', pants: '#111', shoes: '#111', red: .15 });
      if (after('i4') && !after('noble')) { const on = Math.floor((t - cu('i4')) * 2) % 2 === 0; fillRR(c, 1050, 230, 340, 140, 20, '#111', on ? '#3bff7a' : '#ff3b5c', 8); text(c, on ? 'ON' : 'OFF', 1220, 300, 90, on ? '#3bff7a' : '#ff3b5c', { shadow: on ? '#3bff7a' : '#ff3b5c' }); }
      const nb = after('noble'); const je = person(c, { who: 'elijah', x: nb ? 640 : 300, y: 930, age: 'adult', shirt: '#6f8fb0', pants: '#2b2b2b', shoes: '#eee', handR: nb ? [.25, .05] : [.1, .35], handL: [-.1, .35] });
      if (nb) { fillRR(c, je.handR.x - 30, je.handR.y - 40, 60, 50, 6, '#e0f2ff', '#89b', 3); text(c, 'tissues', je.handR.x, je.handR.y - 14, 13, '#456', { font: FONT2, weight: 600 }); }
      if (after('i6')) suitcase(c, lerp(-300, 330, easeOut(S('i6', 0, 1))), 960, 1.5, ['EMOTIONAL', 'BAGGAGE'], -.05);
      if (after('zone')) { c.save(); c.globalAlpha = S('zone', 0, .3); for (let i = -2; i < 22; i++) poly(c, [i * 100, 0, i * 100 + 50, 0, i * 100 - 50, 120, i * 100 - 100, 120], i % 2 ? '#ffd23f' : '#111'); c.restore();
        stamp(c, 'FRIEND ZONE STATUS: EXTREME', 960, 220, 70, S('zone', 0, .5)); }
    } else { // the bench through the seasons
      const k = S('bench', 0, cd('i8') + 2.2), season = Math.min(3, Math.floor(k * 4)), sk = ['#8fd3ff', '#f4a261', '#c9d6e3', '#a8e6a3'][season], gr = ['#74bd55', '#c08a3a', '#f4f7fb', '#8fd16a'][season];
      sky(c, sk, '#ffffff'); c.fillStyle = gr; c.fillRect(0, 760, W, 320); for (let i = 0; i < 5; i++) roundTree(c, 150 + i * 420, 770, 320, ['#4caf50', '#e76f51', '#ffffff', '#9be27a'][season]);
      if (season === 1) for (let i = 0; i < 20; i++) { const y = ((t * 120 + i * 97) % 1100) - 50; c.save(); c.translate((i * 211) % W + Math.sin(t + i) * 40, y); c.rotate(t + i); ell(c, 0, 0, 14, 7, '#e76f51'); c.restore(); }
      if (season === 2) for (let i = 0; i < 80; i++) circ(c, (i * 137 + Math.sin(t + i) * 30) % W, ((t * 90 + i * 61) % 1100) - 30, 5, '#fff');
      if (season === 2) bigfoot(c, lerp(-200, 2100, seg(k, .5, .75)), 770, .7, { walk: t * 1.2 });
      fillRR(c, 700, 760, 520, 26, 8, '#8a5a2b'); fillRR(c, 700, 690, 520, 22, 8, '#8a5a2b'); fillRR(c, 730, 786, 20, 120, 4, '#5a3a1a'); fillRR(c, 1170, 786, 20, 120, 4, '#5a3a1a');
      person(c, { who: 'elijah', x: 960, y: 900, age: 'adult', shirt: '#6f8fb0', pants: '#2b2b2b', shoes: '#eee', footL: [.08, -.12], footR: [.12, -.12], handL: [-.1, .2], handR: [.1, .2], headRot: season === 2 ? .2 : 0 });
      if (season >= 2) { c.save(); c.globalAlpha = .7; c.strokeStyle = '#fff'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(830, 440); c.lineTo(830 + Math.cos(i) * 120, 440 + Math.sin(i) * 120); c.stroke(); } c.restore(); }
      if (season === 2) text(c, 'Z z z', 1140, 380, 60, '#fff', { stroke: '#456' });
      fillRR(c, 80, 80, 360, 80, 14, '#fff'); text(c, ['SUMMER', 'FALL', 'WINTER', 'SPRING'][season] + '  (still waiting)', 260, 120, 26, '#2b2d42'); }
  } };

/* ===== 7. ADAM STEALS THE SHOW ===== */
const SC_ADAM = { id: 'adam',
  music: [['triumph', 'a2', 'tux', .7], ['romance', 'tux', 'swoop', .8, { bpm: 96 }], ['villain', 'swoop', 'a10>', 1]],
  sfx: [['a1', 'crack'], ['a2', 'fireworks'], [['a3', 0], 'thud', .4], [['a3', .5], 'thud', .4], [['a3', 1], 'thud', .4], [['a4', .4], 'zip'], [['a4', 1.6], 'sparkle'], ['swoop', 'flyby'], [['a6', 0], 'sting'], [['a7', 1.6], 'flyby'], ['fire', 'fire', 6], ['a9', 'stampF']],
  draw(c, t) {
    sky(c, after('a2') && !after('swoop') ? '#1b1f4a' : '#8fd3ff', after('a2') && !after('swoop') ? '#4b3f8a' : '#eaf8ff'); c.fillStyle = '#7ab55c'; c.fillRect(0, 780, W, 300);
    if (after('a2') && !after('swoop')) for (let i = 0; i < 5; i++) { const k = ((t - cu('a2')) * .7 + i * .2) % 1; burstSparkles(c, 300 + i * 340, 300 - i % 2 * 80, 160, k, 12, i); }
    if (!after('a2')) { // the breakup
      const k = S('a1', 0, 1); person(c, { who: 'emma', x: 900 - k * 200, y: 930, age: 'woman', shirt: '#f4a6b8', skirt: '#7a4a9a' }); person(c, { who: 'eli', x: 1100 + k * 900, y: 930, age: 'adult', shirt: '#2b2d42', outfit: 'hoodie', pants: '#111' });
      if (k > 0) line(c, [1000, 0, 980, 300, 1020, 500, 990, 1080], '#222', 8 * Math.sin(k * PI)); }
    const tux = after('tux'), fire = after('fire');
    const ad = easeInOutSwoop(S('swoop', 0, 1.4)), carry = after('a7', 1.4) ? easeIn(S('a7', 1.4, 2.4)) : 0;
    if (after('a2')) { const jx = 760;
      const j = person(c, { who: 'elijah', x: jx, y: 930, age: 'adult', shirt: tux ? '#111' : '#6f8fb0', outfit: tux ? 'tie' : null, tie: '#111', pants: tux ? '#111' : '#2b2b2b', shoes: '#111', bigEyes: S('a2', 0, .3) * (1 - S('tux', 0, .3)),
        handR: tux && !after('swoop') ? [.15, -.55] : [.1, .35], handL: [-.1, .35], jaw: after('swoop', .5) ? .8 : null });
      if (tux && !after('swoop')) { c.save(); c.translate(j.handR.x, j.handR.y - 10); c.rotate(Math.sin(t * 10) * .4); fillRR(c, -50, -8, 100, 16, 4, '#333'); c.restore(); }
      if (tux) { c.save(); c.globalCompositeOperation = 'source-over'; } if (tux) c.restore();
      if (fire) flames(c, jx, 930, 300, 500 * S('fire', 0, 2), t, 1);
      if (fire && after('a8')) { const z = S('a10', 0, .8); if (z > 0) { c.fillStyle = `rgba(0,0,0,${.4 * z})`; c.fillRect(0, 0, W, H); } } }
    if (after('swoop')) { const x = lerp(2300, 1300, ad) + carry * 1400, y = lerp(-200, 560, ad) - carry * 700;
      if (!after('a7', 1.4)) person(c, { who: 'emma', x: 1300, y: 930, age: 'woman', shirt: '#f4a6b8', skirt: '#7a4a9a' });
      else { c.save(); c.translate(x - 40, y + 60); c.rotate(-.3); person(c, { who: 'emma', x: 0, y: 330, age: 'woman', s: .8, shirt: '#f4a6b8', skirt: '#7a4a9a', wind: 2 }); c.restore(); }
      c.save(); c.translate(x, y); c.rotate(-.5 + ad * .5);
      poly(c, [-40, -300, 40, -300, 180, 120, -140, 100], '#d62839'); person(c, { who: 'adam', x: 0, y: 260, age: 'adult', s: .95, shirt: '#3a86ff', pants: '#3a86ff', shoes: '#d62839', handR: [.3, -.6], handL: [-.25, -.1] }); c.restore();
      text(c, 'A', x, y - 30, 70, '#ffd23f', { stroke: '#d62839' }); bigText(c, 'ADAM.', 1300, 180, 140, S('a6', 0, .5) * (1 - S('a7', 0, .4)), '#ffd23f', { stroke: '#d62839' }); }
    if (after('a3') && !after('tux')) ['THIS.', 'WAS.', 'IT.'].forEach((s, i) => bigText(c, s, 1100 + i * 300, 360, 100, S('a3', i * .45, i * .45 + .3), '#ffd23f'));
    if (after('a9')) parentsCringe(c, 1650, 300, S('a9', 0, cd('a9') + .4));
    if (after('a10')) stamp(c, 'NARRATOR: CONCERNED', 1360, 820, 52, S('a10', .3, .8), '#2a6fdb');
  } };
function easeInOutSwoop(t) { return easeOut(t); }
