// ---------- cast: photo heads on cartoon bodies, lip sync, expressions ----------
// Who speaks which line (from the timeline) -> which character's jaw moves.
const MOUTH_OF = { elijah_kid: 'elijah', baby: 'elijah', elijah: 'elijah' };
const CUR = { sc: null, t: 0 };  // set by the player for the scene being drawn
function talk(who) {
  const sc = CUR.sc; if (!sc) return 0; let v = 0;
  for (const l of sc.lines) { const w = MOUTH_OF[l.who] || l.who; if (w !== who) continue;
    const k = CUR.t - l.t; if (k < 0 || k > l.d) continue; const i = Math.floor(k * 30); v = Math.max(v, l.env[i] || 0); }
  return v; }
// cue helpers for the scene being drawn
const cu = n => { const c = CUR.sc.cues[n]; if (!c) { console.warn('no cue', n); return 0; } return c[0]; };
const cd = n => (CUR.sc.cues[n] || [0, 0])[1];
const ce = n => cu(n) + cd(n);
const S = (n, a = 0, b = 1) => seg(CUR.t, cu(n) + a, cu(n) + b);   // 0..1 progress near a cue
const after = (n, a = 0) => CUR.t >= cu(n) + a;

// Character looks. face = photo key; hair = cartoon hair drawn behind the photo (long hair).
const CAST = {
  elijah:    { skin: '#ecb59c' },
  luke:      { skin: '#e9ae95' },
  stephanie: { skin: '#ebb79f', hair: '#2a1b16', hairLen: .55 },
  alyssa:    { skin: '#f1c3a8', hair: '#3b2a21', hairLen: .7 },
  naomi:     { skin: '#f0c3aa', hair: '#2e231e', hairLen: .7 },
  emma:      { skin: '#f3c2a6', hair: '#a8754a', hairLen: 2.6 },
  joseph:    { skin: '#eab49b' },
  noah:      { skin: '#eab49b' },
  eli:       { skin: '#eab69e' },
  adam:      { skin: '#e3a98d' },
  mia:       { skin: '#ebbda5', hair: '#7d5b45', hairLen: .8 },
  // no photos yet: cartoon stand-ins (drawToon)
  levi:      { skin: '#f0c4a8' },
  vivian:    { skin: '#f0c0a6', hair: '#3a2a22', hairLen: .75 },
};
const AGE = { baby: [330, 230], tod: [390, 175], kid: [470, 165], teen: [600, 158], adult: [700, 150], woman: [672, 145] };

function faceKey(who, look) { const k = look ? who + '_' + look : who; return FACES[k] ? k : (FACES[who] ? who : null); }

/* Photo face with talking jaw + overlays. o: jaw 0..1, hearts 0..1, tears 0..1, red 0..1, evil 0..1, a alpha, flipX */
function drawFace(c, key, cx, cy, fh, rot = 0, o = {}) {
  const im = IMG[key], m = FACES[key].meta, dh = fh / m.fh, dw = dh * m.w / m.h, x0 = -m.fcx * dw, y0 = -m.fcy * dh;
  c.save(); c.translate(cx, cy); c.rotate(rot); if (o.a != null) c.globalAlpha *= o.a; if (o.sx) c.scale(o.sx, o.sy || 1);
  const open = clamp(o.jaw || 0), my = m.mouth * fh, gap = open * fh * .13;
  c.drawImage(im, x0, y0, dw, dh);
  if (open > .03) {
    const jaw = () => { c.beginPath(); c.ellipse(0, my + fh * .18, fh * .36, fh * .4, 0, 0, TAU); c.rect(x0, my, dw, dh); };
    c.save(); c.beginPath(); c.ellipse(0, my + fh * .18, fh * .3, fh * .42, 0, 0, TAU); c.clip(); c.beginPath(); c.rect(x0, my, dw, gap + 2); c.clip();
    c.fillStyle = o.skin || '#e0a88e'; c.fillRect(x0, my, dw, gap + 2); ell(c, 0, my + gap * .5, fh * .15, gap * .55 + 1, '#2a090d'); ell(c, 0, my + gap * .8, fh * .09, gap * .25, '#b8424f'); c.restore();
    c.save(); c.beginPath(); c.ellipse(0, my + fh * .18 + gap, fh * .3, fh * .42, 0, 0, TAU); c.clip(); c.beginPath(); c.rect(x0, my + gap, dw, dh); c.clip();
    c.drawImage(im, x0, y0 + gap, dw, dh); c.restore(); void jaw;
  }
  const ex = m.eyeDX * fh, ey = m.eyeY * fh;
  if (o.red > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha *= clamp(o.red); ell(c, 0, 0, fh * .55, fh * .7, '#ff3b2f'); c.restore(); }
  if (o.evil > 0) for (const s of [-1, 1]) { c.save(); c.globalAlpha *= clamp(o.evil); c.shadowColor = '#ff1a1a'; c.shadowBlur = fh * .2; circ(c, s * ex, ey, fh * .045, '#ff2a2a'); circ(c, s * ex, ey, fh * .018, '#fff0a0'); c.restore(); }
  if (o.hearts > 0) { const k = backOut(clamp(o.hearts)) * (1 + Math.sin(CUR.t * 12) * .08); for (const s of [-1, 1]) heart(c, s * ex, ey + fh * .02, fh * .15 * k, '#ff2d55'); }
  if (o.tears > 0) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const ph = (CUR.t * 1.4 + i / 3) % 1;
    c.save(); c.globalAlpha *= clamp(o.tears) * (1 - ph); c.fillStyle = '#7cc8ff'; const tx = s * (ex + fh * .05) + s * ph * fh * .08, ty = ey + fh * .08 + ph * fh * .55;
    c.beginPath(); c.moveTo(tx, ty - fh * .05); c.quadraticCurveTo(tx + fh * .035, ty + fh * .01, tx, ty + fh * .03); c.quadraticCurveTo(tx - fh * .035, ty + fh * .01, tx, ty - fh * .05); c.fill(); c.restore(); }
  if (o.bigEyes > 0) for (const s of [-1, 1]) { const r = fh * .09 * clamp(o.bigEyes); circ(c, s * ex, ey, r, '#fff'); c.lineWidth = 3; c.strokeStyle = '#222'; c.stroke(); circ(c, s * ex, ey + r * .1, r * .45, '#222'); circ(c, s * ex + r * .2, ey - r * .15, r * .15, '#fff'); }
  c.restore(); }
function faceTop(key, fh) { return FACES[key].meta.headTop * fh; }

function hairBehind(c, x, y, fh, col, len, t, wind = 0) {
  if (!col) return; const w = fh * .7, L = fh * (.5 + len);
  c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(x - w * .95, y - fh * .35);
  c.bezierCurveTo(x - w * 1.15, y - fh * 1.05, x + w * 1.15, y - fh * 1.05, x + w * .95, y - fh * .35);
  const sway = i => Math.sin(t * 3 + i) * fh * .06 * (1 + wind) + wind * fh * .5 * (i / 6);
  const fl = 1 + Math.min(1, len) * .35;
  c.quadraticCurveTo(x + w * 1.25 * fl + sway(2), y + L * .45, x + w * 1.1 * fl + sway(6), y + L);
  for (let i = 0; i < 8; i++) { const a = 1.1 * fl - i * .275 * fl, b = 1.1 * fl - (i + 1) * .275 * fl; c.quadraticCurveTo(x + w * (a + b) / 2 + sway(i), y + L + fh * .14, x + w * b + sway(i + 1), y + L); }
  c.quadraticCurveTo(x - w * 1.25 * fl + sway(0), y + L * .45, x - w * .95, y - fh * .35); c.fill();
  c.strokeStyle = shade(col, .18); c.lineWidth = fh * .02; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * w * .3, y); c.quadraticCurveTo(x + i * w * .35 + sway(i + 3), y + L * .5, x + i * w * .3 + sway(i + 4), y + L * .95); c.stroke(); }
  c.restore(); }

/* A cast member. p: who, look (baby|kid|trex...), x, y (feet), age (AGE key) or H/fh, s scale, outfit fields for drawBody,
   jaw (auto from voice unless given), hearts/tears/red/evil/bigEyes, headRot, headDy, wind, noHair */
function person(c, p) {
  const C = CAST[p.who] || {}, s = p.s || 1;
  if (C.toon || !faceKey(p.who, p.look)) { return drawToon(c, Object.assign({ x: p.x, y: p.y, H: (p.H || AGE[p.age || 'adult'][0]) * s, top: p.shirt, bottom: p.pants, skirt: p.skirt, shoes: p.shoes,
    handL: p.handL, handR: p.handR, mouth: talk(p.who) > .2 ? 'open' : p.mouth, eyes: p.eyes, tilt: p.headRot, headDy: p.headDy, facing: p.facing }, C.toon || {}, p.toon || {})); }
  const key = faceKey(p.who, p.look), [H0, fh0] = p.H ? [p.H, p.fh || 150] : AGE[p.age || 'adult'];
  const Ht = H0 * s, fh = (p.fh || fh0) * s, B = Ht - 1.38 * fh;
  const hx = p.x + (p.headDx || 0) * s, hy = p.y - B - fh * .42 + (p.headDy || 0) * s, t = CUR.t;
  c.save();
  if (p.alpha != null) c.globalAlpha *= p.alpha;
  if (!p.noHair && C.hair) hairBehind(c, hx, hy, fh, C.hair, C.hairLen * (p.hairK || 1), t, p.wind || 0);
  let j;
  if (p.baby) { j = babyBody(c, p.x, p.y, B, C.skin, p); }
  else j = drawBody(c, Object.assign({ shirt: '#4a7bd0', pants: '#2f3e5c', shoes: '#2b2b2b', skin: C.skin }, p, { B, neckW: fh * .34, neckUp: fh * .3, x: p.x, y: p.y }));
  drawFace(c, key, hx, hy, fh, p.headRot || 0, { skin: C.skin, jaw: p.jaw != null ? p.jaw : talk(p.who), hearts: p.hearts, tears: p.tears, red: p.red, evil: p.evil, bigEyes: p.bigEyes, a: p.faceA });
  if (p.sweat) sweatDrops(c, hx, hy, fh, p.sweat, t);
  if (p.steam) steam(c, hx, hy, fh, p.steam, t);
  c.restore();
  j.head = { x: hx, y: hy, fh, key, top: hy + faceTop(key, fh) }; return j;
}
function babyBody(c, x, y, B, skin, p) {
  const w = B * .9; ell(c, x, y - B * .45, w * .55, B * .5, p.shirt || '#9fd3ff'); ell(c, x - w * .15, y - B * .62, w * .18, B * .14, 'rgba(255,255,255,.35)');
  fillRR(c, x - w * .45, y - B * .35, w * .9, B * .35, B * .15, p.pants || '#fff'); // diaper
  for (const s of [-1, 1]) { ell(c, x + s * w * .32, y - B * .05, B * .14, B * .1, skin); ell(c, x + s * w * .62, y - B * .55, B * .1, B * .16, skin, s * .5); }
  if (p.cape) { c.save(); c.globalCompositeOperation = 'destination-over'; poly(c, [x - w * .5, y - B * .9, x + w * .5, y - B * .9, x + w * .9, y + B * .05, x - w * .9, y + B * .05], '#2a0d12'); c.restore(); }
  return { handL: { x: x - w * .62, y: y - B * .55 }, handR: { x: x + w * .62, y: y - B * .55 }, chest: { x, y: y - B * .6 }, B, ySh: y - B * .85 }; }
function sweatDrops(c, hx, hy, fh, k, t) { for (let i = 0; i < 6; i++) { const ph = (t * 1.6 + i / 6) % 1, side = i % 2 ? 1 : -1;
  const x = hx + side * (fh * .55 + ph * fh * .5), y = hy - fh * .3 + ph * ph * fh * .9 - Math.sin(ph * PI) * fh * .3;
  c.save(); c.globalAlpha = k * (1 - ph); c.fillStyle = '#7cc4ff'; c.beginPath(); c.moveTo(x, y - 14); c.quadraticCurveTo(x + 9, y + 2, x, y + 7); c.quadraticCurveTo(x - 9, y + 2, x, y - 14); c.fill(); c.restore(); } }
function steam(c, hx, hy, fh, k, t) { for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const ph = (t * 2 + i / 4) % 1;
  c.save(); c.globalAlpha = k * (1 - ph) * .9; circ(c, hx + s * (fh * .55 + ph * fh * .4), hy - fh * .1 - ph * fh * .7, fh * (.06 + ph * .12), '#f4f4f4'); c.restore(); } }

// ---------- Bigfoot ----------
function bigfoot(c, x, y, s, o = {}) {
  const t = CUR.t, ph = o.walk == null ? 0 : o.walk, fur = '#6b4423', dark = '#4a2e17', face = '#3b2a20';
  c.save(); c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s); if (o.a != null) c.globalAlpha *= o.a;
  const sw = Math.sin(ph * TAU), lift = k => Math.max(0, Math.sin(ph * TAU + k)) * 14;
  // legs
  fillRR(c, -48 + sw * 18, -150 - lift(0), 42, 150, 18, dark); fillRR(c, 8 - sw * 18, -150 - lift(PI), 42, 150, 18, dark);
  ell(c, -26 + sw * 18, -6 - lift(0), 38, 14, '#2e1c10'); ell(c, 30 - sw * 18, -6 - lift(PI), 38, 14, '#2e1c10');
  // body
  c.beginPath(); c.ellipse(0, -250, 92, 135, 0, 0, TAU); c.fillStyle = fur; c.fill();
  c.strokeStyle = dark; c.lineWidth = 4; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 80, -250 + Math.sin(a) * 120); c.lineTo(Math.cos(a) * 98, -250 + Math.sin(a) * 138); c.stroke(); }
  ell(c, 0, -230, 52, 70, '#8a5a32');
  // arms
  const wave = o.wave ? Math.sin(t * 10) * .5 : 0, armR = o.armUp ? -2.4 + wave : .25 - sw * .3, armL = .15 + sw * .3;
  for (const [sx, a] of [[-1, armL], [1, armR]]) { c.save(); c.translate(sx * 82, -330); c.rotate(-sx * a); fillRR(c, -20, 0, 40, 170, 18, fur); ell(c, 0, 172, 24, 20, face); c.restore(); }
  if (o.hold) { c.save(); c.translate(82 + Math.sin(-armR) * 170, -330 + Math.cos(armR) * 170); o.hold(c); c.restore(); }
  // head
  c.beginPath(); c.ellipse(0, -395, 62, 66, 0, 0, TAU); c.fillStyle = fur; c.fill();
  ell(c, 0, -380, 40, 42, face); fillRR(c, -40, -412, 80, 14, 7, dark);
  circ(c, -15, -395, 6, '#fff'); circ(c, 15, -395, 6, '#fff'); circ(c, -14, -394, 3, '#000'); circ(c, 16, -394, 3, '#000');
  c.beginPath(); c.arc(0, -372, 14, .2, PI - .2); c.strokeStyle = '#1b120c'; c.lineWidth = 4; c.stroke();
  c.restore(); }

// ---------- props ----------
function drPepper(c, x, y, s, rot = 0, glow = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  if (glow) { c.save(); c.globalAlpha = glow; c.shadowColor = '#fff2a8'; c.shadowBlur = 40; ell(c, 0, -45, 46, 62, 'rgba(255,240,170,.35)'); c.restore(); }
  fillRR(c, -26, -95, 52, 95, 8, '#7a1424'); ell(c, 0, -95, 26, 7, '#c9ccd1'); ell(c, 0, 0, 26, 7, '#9a1c2e');
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-20, -90, 8, 84);
  text(c, 'Dr', 0, -62, 22, '#fff', { font: FONT2, weight: 700 }); text(c, 'Pepper', 0, -40, 15, '#fff', { font: FONT2, weight: 700 });
  c.restore(); }
function ringBox(c, x, y, s, open = 1, spark = 0) { c.save(); c.translate(x, y); c.scale(s, s);
  fillRR(c, -40, -30, 80, 40, 8, '#1e1a3a'); c.save(); c.translate(0, -30); c.rotate(-open * 1.9); fillRR(c, -40, -30, 80, 30, 8, '#2a2550'); c.restore();
  if (open > .3) { c.beginPath(); c.arc(0, -42, 18, 0, TAU); c.strokeStyle = '#f2c544'; c.lineWidth = 6; c.stroke(); poly(c, [-10, -64, 10, -64, 14, -72, 0, -82, -14, -72], '#dff6ff', '#9ad', 2);
    sparkle(c, 12, -80, 18 * (spark || (.6 + .4 * Math.sin(CUR.t * 6))), 1, CUR.t * 3); }
  c.restore(); }
function floatingRing(c, x, y, s = 1) { c.save(); c.translate(x, y + Math.sin(CUR.t * 2) * 8); c.scale(s, s); c.beginPath(); c.arc(0, 0, 14, 0, TAU); c.strokeStyle = '#f2c544'; c.lineWidth = 5; c.stroke();
  poly(c, [-8, -14, 8, -14, 11, -20, 0, -28, -11, -20], '#dff6ff', '#9ad', 2); sparkle(c, 10, -26, 14 * (.6 + .4 * Math.sin(CUR.t * 5)), 1, CUR.t * 3); c.restore(); }
function suitcase(c, x, y, s, label, rot = 0) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  fillRR(c, -120, -150, 240, 150, 14, '#8a4b2a', '#4a2512', 5); fillRR(c, -40, -175, 80, 30, 10, null, '#4a2512', 8);
  line(c, [-120, -110, 120, -110], '#4a2512', 4); if (label) { fillRR(c, -105, -95, 210, 60, 8, '#f6efdc'); text(c, label[0], 0, -78, 24, '#4a2512'); if (label[1]) text(c, label[1], 0, -52, 24, '#4a2512'); }
  c.restore(); }
function phone(c, x, y, s, lit = 0, msg) { c.save(); c.translate(x, y); c.scale(s, s); fillRR(c, -40, -80, 80, 160, 14, '#1b1b1f');
  fillRR(c, -34, -70, 68, 140, 8, lit ? '#e9f4ff' : '#24324a'); if (lit && msg) { fillRR(c, -30, -40, 60, 34, 10, '#2a7cff'); text(c, msg, 0, -23, 12, '#fff', { font: FONT2, weight: 600 }); }
  c.restore(); }
function stamp(c, s, x, y, size, p, col = '#d62839', rot = -.18) { if (p <= 0) return; const k = p < .25 ? lerp(2.6, 1, easeOut(p / .25)) : 1;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); c.globalAlpha *= clamp(p * 4);
  c.font = `${size}px ${FONT}`; const w = c.measureText(s).width + size * .6; rr(c, -w / 2, -size * .75, w, size * 1.5, 10); c.strokeStyle = col; c.lineWidth = size * .1; c.stroke();
  text(c, s, 0, 2, size, col); c.restore(); }
function birthCert(c, x, y, s, p, rot = .05) { if (p <= 0) return; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * backOut(clamp(p * 2)), s * backOut(clamp(p * 2)));
  fillRR(c, -230, -150, 460, 300, 6, '#fbf6e4', '#8a6a3a', 6); rr(c, -215, -135, 430, 270, 4); c.strokeStyle = '#c8a86a'; c.lineWidth = 3; c.stroke();
  text(c, 'CERTIFICATE OF BIRTH', 0, -100, 30, '#5a4020'); text(c, 'Name: Elijah', -190, -48, 24, '#5a4020', { align: 'left', font: FONT2, weight: 600 });
  text(c, 'Place: Indiana', -190, -14, 24, '#5a4020', { align: 'left', font: FONT2, weight: 600 }); text(c, 'Circumstances of Birth:', -190, 22, 24, '#5a4020', { align: 'left', font: FONT2, weight: 600 });
  stamp(c, 'UNDER INVESTIGATION', 20, 82, 34, clamp(p * 1.5 - .3)); c.restore(); }
function exclaim(c, x, y, s, p) { if (p <= 0) return; c.save(); c.translate(x, y); c.scale(s * backOut(clamp(p * 3)), s * backOut(clamp(p * 3))); text(c, '!', 0, 0, 120, '#ffd23f', { stroke: '#3a2614', sw: 14 }); c.restore(); }
function thoughtCorner(c, x, y, r, draw, p) { if (p <= 0) return; const k = backOut(clamp(p * 3)) * (p > .85 ? 1 - (p - .85) / .15 : 1); if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(k, k); circ(c, 0, 0, r + 10, '#fff'); c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); draw(c); c.restore();
  c.beginPath(); c.arc(0, 0, r + 4, 0, TAU); c.strokeStyle = '#3a2614'; c.lineWidth = 6; c.stroke(); c.restore(); }
// the embarrassed-parents cutaway that pops in whenever the birth comes up
function parentsCringe(c, x, y, p) { thoughtCorner(c, x, y, 120, c => { c.fillStyle = '#ffd9d9'; c.fillRect(-130, -130, 260, 260);
  drawFace(c, 'stephanie', -45, 15, 95, -.1, { red: .35 }); drawFace(c, 'luke', 50, 5, 90, .1, { red: .35 }); sweatDrops(c, 0, -10, 80, 1, CUR.t); }, p); }
// running gag: Bigfoot just out of sight
function bigfootPeek(c, x, y, s, p, flip) { if (p <= 0 || p >= 1) return; const k = Math.sin(p * PI); c.save(); c.beginPath(); c.rect(x - 400 * s, y - 900 * s, 800 * s, 900 * s); c.clip();
  bigfoot(c, x + (flip ? -1 : 1) * (1 - k) * 120 * s, y, s, { flip, wave: k > .8 }); c.restore(); }
function puff(c, x, y, r, a) { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.fillStyle = '#d8d2c4'; for (const [dx, dy, s] of [[0, 0, 1], [-.6, .2, .7], [.6, .1, .75], [0, -.5, .7]]) circ(c, x + dx * r, y + dy * r, s * r); c.restore(); }
