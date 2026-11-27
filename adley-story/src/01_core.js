// ---------- core helpers ----------
const W = 1920, H = 1080;
const FACES = window.STORY_FACES;
const TL = window.STORY_TL;
const IMG = {};
const PI = Math.PI, TAU = PI * 2;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const backOut = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const elastic = t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * TAU / 3) + 1;
const bounceOut = t => { const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; };
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const m = v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f); return `rgb(${m(r)},${m(g)},${m(b)})`; };

function rr(c, x, y, w, h, r) { if (w < 0) { x += w; w = -w; } if (h < 0) { y += h; h = -h; } r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function fillRR(c, x, y, w, h, r, fill, stroke, lw) { rr(c, x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 4; c.stroke(); } }
function ell(c, x, y, rx, ry, fill, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } }
function circ(c, x, y, r, fill) { ell(c, x, y, r, r, fill); }
function line(c, pts, color, w, cap = 'round') { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.strokeStyle = color; c.lineWidth = w; c.lineCap = cap; c.lineJoin = 'round'; c.stroke(); }
function poly(c, pts, fill, stroke, lw) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 3; c.lineJoin = 'round'; c.stroke(); } }

const FONT = 'Lilita, "Arial Black", sans-serif', FONT2 = 'Fredoka, "Arial Rounded MT Bold", sans-serif';
function text(c, s, x, y, size, color, o = {}) {
  c.save(); c.font = `${o.weight || ''} ${size}px ${o.font || FONT}`; c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle';
  if (o.rot) { c.translate(x, y); c.rotate(o.rot); x = 0; y = 0; }
  if (o.stroke) { c.lineJoin = 'round'; c.strokeStyle = o.stroke; c.lineWidth = o.sw || size * .16; c.strokeText(s, x, y); }
  if (o.shadow) { c.shadowColor = o.shadow; c.shadowOffsetY = size * .06; c.shadowBlur = 0; }
  c.fillStyle = color; c.fillText(s, x, y); c.restore(); }

function sparkle(c, x, y, r, a = 1, rot = 0, col = '#fff') {
  if (a <= 0 || r <= 0) return; c.save(); c.globalAlpha *= clamp(a); c.translate(x, y); c.rotate(rot);
  c.shadowColor = '#fff6b0'; c.shadowBlur = r * .9; c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 4; i++) { const a1 = i * PI / 2, a2 = a1 + PI / 4;
    c.lineTo(Math.cos(a1) * r, Math.sin(a1) * r); c.quadraticCurveTo(0, 0, Math.cos(a1 + PI / 2) * r, Math.sin(a1 + PI / 2) * r); void a2; }
  c.closePath(); c.fill(); c.restore(); }
function burstSparkles(c, x, y, R, p, n = 8, seed = 3) {
  if (p <= 0 || p >= 1) return; const r = rng(seed);
  for (let i = 0; i < n; i++) { const a = i / n * TAU + r() * .5, d = R * (.4 + .8 * easeOut(p)) * (.7 + r() * .5);
    sparkle(c, x + Math.cos(a) * d, y + Math.sin(a) * d, R * .22 * (1 - p) * (.6 + r()), 1 - p * p, p * 2); } }
function heartPath(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * .35);
  c.bezierCurveTo(x - s * 1.1, y - s * .35, x - s * .45, y - s * 1.05, x, y - s * .45);
  c.bezierCurveTo(x + s * .45, y - s * 1.05, x + s * 1.1, y - s * .35, x, y + s * .35); c.closePath(); }
function heart(c, x, y, s, fill = '#ff4d6d', a = 1) { if (s <= 0) return; c.save(); c.globalAlpha *= a; heartPath(c, x, y, s); c.fillStyle = fill; c.fill();
  c.fillStyle = 'rgba(255,255,255,.45)'; ell(c, x - s * .42, y - s * .45, s * .16, s * .1, null, -.6); c.fill(); c.restore(); }
function starPath(c, x, y, R, r, n = 5, rot = -PI / 2) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * PI / n, d = i % 2 ? r : R;
  c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } c.closePath(); }
function burst(c, x, y, R, fill, stroke, n = 12, seed = 1) { const r = rng(seed); c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = i * PI / n, d = i % 2 ? R * .62 : R * (.9 + r() * .2); c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 6; c.lineJoin = 'round'; c.stroke(); } }
function comic(c, s, x, y, size, p, rot = -.12, fill = '#ffe14d') {
  if (p <= 0) return; const k = backOut(clamp(p * 3)) * (p > .8 ? 1 - (p - .8) * 5 : 1); if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); burst(c, 0, 0, size * 1.6, fill, '#2b1d10', 11, size | 0);
  text(c, s, 0, 4, size, '#d6202f', { stroke: '#fff', sw: size * .14 }); c.restore(); }

// ---------- camera ----------
function camera(c, cx, cy, z, rot = 0) { c.translate(W / 2, H / 2); c.scale(z, z); c.rotate(rot); c.translate(-cx, -cy); }

// ---------- limbs (rubber-hose) ----------
function qpt(a, m, b, t) { const u = 1 - t; return { x: u * u * a.x + 2 * u * t * m.x + t * t * b.x, y: u * u * a.y + 2 * u * t * m.y + t * t * b.y }; }
function limb(c, a, b, bend, w, color, skin, frac, dir = 1) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const m = { x: (a.x + b.x) / 2 - dy / L * bend * L * dir, y: (a.y + b.y) / 2 + dx / L * bend * L * dir };
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (frac < 1) { c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(m.x, m.y, b.x, b.y); c.strokeStyle = skin; c.lineWidth = w * .86; c.stroke(); }
  if (frac > 0) { const q1 = { x: lerp(a.x, m.x, frac), y: lerp(a.y, m.y, frac) }, q2 = qpt(a, m, b, frac);
    c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(q1.x, q1.y, q2.x, q2.y); c.strokeStyle = color; c.lineWidth = w; c.stroke(); }
}
function hand(c, p, r, skin, thumb, dir = 1) {
  circ(c, p.x, p.y, r, skin); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.stroke();
  if (thumb) { c.save(); c.translate(p.x, p.y); fillRR(c, -r * .35, -r * 2.1, r * .7, r * 1.6, r * .35, skin, 'rgba(0,0,0,.25)', 2); c.restore(); }
}

/* Shared cartoon body. o: x,y (feet), B (feet to neck), shirt, pants, shoes, skin, outfit,
   handL/handR [dx,dy] in B units from shoulder, footL/footR [dx,dy] in B units, bendL/R, wide, belly,
   skirt (color), shorts, sleeve (0..1), facing (1/-1), thumbL/thumbR, spinX (body squash for twirls) */
function drawBody(c, o) {
  const { x, y, B } = o, w = o.wide || 1, dir = o.facing || 1;
  const yNeck = y - B, ySh = yNeck + B * .08, yHip = y - B * .47;
  const tw = B * .34 * w, hw = B * .3 * w * (o.hipW || 1);
  const lw = Math.max(9, B * .085) * (o.limb || 1);
  const sx = o.spinX == null ? 1 : o.spinX;
  const X = v => x + (v - x) * sx;
  const shL = { x: X(x - tw * .4), y: ySh + lw * .45 }, shR = { x: X(x + tw * .4), y: ySh + lw * .45 };
  const hL = o.handL || [-.07, .44], hR = o.handR || [.07, .44];
  const handL = { x: shL.x + hL[0] * B, y: shL.y + hL[1] * B }, handR = { x: shR.x + hR[0] * B, y: shR.y + hR[1] * B };
  const fL = o.footL || [0, 0], fR = o.footR || [0, 0];
  const hipL = { x: X(x - hw * .24), y: yHip }, hipR = { x: X(x + hw * .24), y: yHip };
  const footL = { x: X(x - hw * .26) + fL[0] * B, y: y + fL[1] * B }, footR = { x: X(x + hw * .26) + fR[0] * B, y: y + fR[1] * B };
  const skin = o.skin || '#e9b49a';
  // neck
  fillRR(c, x - o.neckW / 2, yNeck - o.neckUp, o.neckW, o.neckUp + B * .12, o.neckW * .3, skin);
  c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x - o.neckW / 2, yNeck - B * .01, o.neckW, B * .04);
  // legs
  const legCol = o.skirt ? skin : o.pants, legFrac = o.skirt ? 0 : o.shorts ? .45 : 1.05;
  limb(c, hipL, footL, o.kneeL || -.04, lw * 1.1, o.pants, legCol === skin ? skin : (o.shorts ? skin : o.pants), legFrac, dir);
  limb(c, hipR, footR, o.kneeR || -.04, lw * 1.1, o.pants, legCol === skin ? skin : (o.shorts ? skin : o.pants), legFrac, dir);
  for (const f of [footL, footR]) { ell(c, f.x + lw * .35 * dir, f.y - lw * .3, lw * .95, lw * .55, o.shoes || '#333');
    c.fillStyle = 'rgba(255,255,255,.25)'; ell(c, f.x + lw * .55 * dir, f.y - lw * .5, lw * .3, lw * .14); c.fill(); }
  // hips / pants top
  if (!o.skirt && !o.gown) fillRR(c, X(x - hw / 2), yHip - B * .08, hw * sx, B * .13, lw * .4, o.pants);
  if (o.skirt) { c.beginPath(); c.moveTo(X(x - hw * .5), yHip - B * .08); c.lineTo(X(x + hw * .5), yHip - B * .08);
    c.lineTo(X(x + hw * .95), yHip + B * .25); c.quadraticCurveTo(x, yHip + B * .3, X(x - hw * .95), yHip + B * .25); c.closePath();
    c.fillStyle = o.skirt; c.fill(); c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 3;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(X(x + i * hw * .14), yHip - B * .04); c.lineTo(X(x + i * hw * .3), yHip + B * .24); c.stroke(); } }
  // torso
  const belly = o.belly || 0, bot = o.coat ? yHip + B * .16 : o.gown ? y - B * .1 : yHip;
  const botW = o.coat || o.gown ? hw * 1.15 : hw * (1 + belly * .5);
  c.beginPath(); c.moveTo(X(x - tw / 2 + lw * .3), ySh); c.quadraticCurveTo(X(x - tw / 2), ySh, X(x - tw / 2), ySh + lw * .6);
  c.quadraticCurveTo(X(x - tw / 2 - belly * tw * .45), lerp(ySh, bot, .7), X(x - botW / 2), bot);
  c.lineTo(X(x + botW / 2), bot); c.quadraticCurveTo(X(x + tw / 2 + belly * tw * .45), lerp(ySh, bot, .7), X(x + tw / 2), ySh + lw * .6);
  c.quadraticCurveTo(X(x + tw / 2), ySh, X(x + tw / 2 - lw * .3), ySh); c.closePath();
  const torso = new Path2D(); // keep shape for clipping overlays
  c.fillStyle = o.gown ? (o.gownColor || '#1b1b22') : o.coat ? '#f7f9fb' : o.shirt; c.fill();
  c.save(); c.clip();
  const chest = { x, y: ySh + B * .14 };
  if (o.outfit === 'stripes') { c.fillStyle = o.stripe || '#fff'; for (let yy = ySh + B * .05; yy < bot; yy += B * .09) c.fillRect(x - tw, yy, tw * 2, B * .035); }
  if (o.coat) { c.fillStyle = o.shirt; c.beginPath(); c.moveTo(x - tw * .18, ySh); c.lineTo(x + tw * .18, ySh); c.lineTo(x + tw * .02, ySh + B * .3); c.lineTo(x - tw * .02, ySh + B * .3); c.fill();
    line(c, [x - tw * .2, ySh, x - tw * .02, ySh + B * .3], '#d5dbe2', 4); line(c, [x + tw * .2, ySh, x + tw * .02, ySh + B * .3], '#d5dbe2', 4);
    line(c, [x, ySh + B * .3, x, bot], '#d5dbe2', 3); fillRR(c, x + tw * .12, ySh + B * .2, tw * .22, B * .09, 4, '#e9eef3');
    line(c, [x + tw * .17, ySh + B * .2, x + tw * .17, ySh + B * .16], '#2a63d4', 5); line(c, [x + tw * .25, ySh + B * .2, x + tw * .25, ySh + B * .15], '#d42a2a', 5);
    if (o.badge) text(c, o.badge, x - tw * .22, ySh + B * .2, B * .035, '#2a4f8f', { font: FONT2, weight: 600 }); }
  if (o.outfit === 'vest' || o.outfit === 'vestBelly') { c.fillStyle = o.vest || '#1f3b5c';
    c.fillRect(x - tw, ySh, tw * .92, bot - ySh + 4); c.fillRect(x + tw * .08, ySh, tw * .92, bot - ySh + 4);
    line(c, [x + tw * .04, ySh + 6, x + tw * .04, bot], '#cfd6dd', 3); c.fillStyle = 'rgba(255,255,255,.08)';
    for (let yy = ySh + 14; yy < bot; yy += B * .06) c.fillRect(x - tw, yy, tw * 2, 2);
    fillRR(c, x - tw * .34, ySh + B * .05, tw * .16, B * .05, 3, shade(o.vest || '#1f3b5c', .25)); }
  if (o.outfit === 'button' || o.outfit === 'tie' || o.outfit === 'polo') {
    c.fillStyle = shade(o.shirt, .35); poly(c, [x - tw * .2, ySh - 2, x, ySh + B * .07, x - tw * .02, ySh - 2], c.fillStyle);
    poly(c, [x + tw * .2, ySh - 2, x, ySh + B * .07, x + tw * .02, ySh - 2], shade(o.shirt, .35));
    if (o.outfit === 'tie') { poly(c, [x - tw * .05, ySh + B * .05, x + tw * .05, ySh + B * .05, x + tw * .08, ySh + B * .26, x, ySh + B * .31, x - tw * .08, ySh + B * .26], o.tie || '#c22');
      fillRR(c, x - tw * .06, ySh + B * .02, tw * .12, B * .05, 4, o.tie || '#c22'); }
    else for (let i = 0; i < (o.outfit === 'polo' ? 2 : 4); i++) circ(c, x, ySh + B * (.1 + i * .07), Math.max(2.5, B * .008), 'rgba(0,0,0,.35)'); }
  if (o.outfit === 'hoodie') { fillRR(c, x - tw * .3, lerp(ySh, bot, .62), tw * .6, B * .1, 10, shade(o.shirt, -.15));
    line(c, [x - tw * .08, ySh + 4, x - tw * .1, ySh + B * .16], '#eee', 4); line(c, [x + tw * .08, ySh + 4, x + tw * .1, ySh + B * .16], '#eee', 4); }
  if (o.outfit === 'jersey') text(c, o.num || '1', x, lerp(ySh, bot, .45), B * .14, '#fff', { stroke: shade(o.shirt, -.4) });
  if (o.gown) { line(c, [x, ySh + B * .1, x, bot], 'rgba(255,255,255,.08)', 4); }
  c.restore();
  void torso;
  if (o.cross) drawCross(c, chest.x, ySh - 2, B, 1);
  if (o.steth) { c.save(); c.strokeStyle = '#2b2f36'; c.lineWidth = Math.max(4, B * .014); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - o.neckW * .55, ySh - 2); c.bezierCurveTo(x - tw * .45, ySh + B * .25, x + tw * .05, ySh + B * .3, x + tw * .12, ySh + B * .22); c.stroke();
    c.beginPath(); c.moveTo(x + o.neckW * .55, ySh - 2); c.bezierCurveTo(x + tw * .35, ySh + B * .12, x + tw * .2, ySh + B * .2, x + tw * .14, ySh + B * .22); c.stroke();
    circ(c, x + tw * .14, ySh + B * .24, B * .028, '#aab4bf'); circ(c, x + tw * .14, ySh + B * .24, B * .016, '#dfe6ee'); c.restore(); }
  // arms
  const slv = o.sleeve == null ? (o.coat ? 1.05 : .5) : o.sleeve, armCol = o.coat ? '#f7f9fb' : o.gown ? (o.gownColor || '#1b1b22') : (o.armColor || o.shirt);
  limb(c, shL, handL, o.bendL == null ? .12 : o.bendL, lw, armCol, skin, slv, -1);
  limb(c, shR, handR, o.bendR == null ? .12 : o.bendR, lw, armCol, skin, slv, 1);
  if (o.behindHands !== false) { hand(c, handL, lw * .62, skin, o.thumbL, -1); hand(c, handR, lw * .62, skin, o.thumbR, 1); }
  return { shL, shR, handL, handR, chest, neck: { x, y: yNeck }, ySh, yHip, B, lw, tw };
}

function drawCross(c, x, yTop, B, a = 1, sparkleP = 0) {
  c.save(); c.globalAlpha *= a; c.strokeStyle = '#e9b83a'; c.lineWidth = Math.max(2.5, B * .008);
  c.beginPath(); c.moveTo(x - B * .07, yTop); c.quadraticCurveTo(x - B * .05, yTop + B * .14, x, yTop + B * .17);
  c.quadraticCurveTo(x + B * .05, yTop + B * .14, x + B * .07, yTop); c.stroke();
  const s = B * .045, cy = yTop + B * .2; c.fillStyle = '#f2c544'; c.strokeStyle = '#a8781a'; c.lineWidth = 2;
  c.beginPath(); c.rect(x - s * .3, cy - s, s * .6, s * 2.6); c.rect(x - s, cy - s * .25, s * 2, s * .6); c.fill(); c.stroke();
  c.fillStyle = '#f2c544'; c.fillRect(x - s * .3 + 1, cy - s + 1, s * .6 - 2, s * 2.6 - 2);
  c.restore(); if (sparkleP) sparkle(c, x + s, cy - s, B * .07, sparkleP, sparkleP * 3);
}

// ---------- caps ----------
function drawCap(c, x, y, w, rot = 0, color = '#c8102e', spin = 1, grad = false) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(spin, 1); const h = w * .5;
  c.beginPath(); c.moveTo(-w / 2, 0); c.bezierCurveTo(-w / 2, -h * 1.3, w / 2, -h * 1.3, w / 2, 0); c.closePath();
  c.fillStyle = color; c.fill(); c.strokeStyle = shade(color, -.35); c.lineWidth = Math.max(2, w * .02); c.stroke();
  line(c, [0, -h * .95, 0, -h * .1], shade(color, -.2), Math.max(1.5, w * .012));
  circ(c, 0, -h * .97, w * .045, shade(color, -.15));
  ell(c, 0, h * .02, w * .52, h * .2, shade(color, -.28)); ell(c, 0, -h * .02, w * .5, h * .14, color);
  // patch: little mountain stripe
  const pw = w * .3, ph = w * .17, py = -h * .62;
  fillRR(c, -pw / 2, py, pw, ph, 2, '#f6f4ec');
  const gg = c.createLinearGradient(0, py, 0, py + ph); gg.addColorStop(0, '#7b5fd1'); gg.addColorStop(.45, '#f06a3f'); gg.addColorStop(.75, '#22b5c9'); gg.addColorStop(1, '#22b5c9');
  c.fillStyle = gg; c.fillRect(-pw / 2 + 2, py + 2, pw - 4, ph - 4);
  poly(c, [-pw / 2 + 2, py + ph - 2, -pw * .18, py + ph * .3, -pw * .02, py + ph * .62, pw * .12, py + ph * .2, pw / 2 - 2, py + ph - 2], '#1f2133');
  c.restore(); void grad; }
function drawMortarboard(c, x, y, w, rot = 0, tassel = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  fillRR(c, -w * .28, -w * .12, w * .56, w * .18, 6, '#1c1c24');
  poly(c, [-w / 2, -w * .14, 0, -w * .3, w / 2, -w * .14, 0, w * .02], '#26262f', '#111', 2);
  circ(c, 0, -w * .14, w * .03, '#e7c13c');
  const tx = w * .36 + Math.sin(tassel) * w * .05; line(c, [0, -w * .14, w * .3, -w * .1, tx, w * .12], '#e7c13c', 4);
  fillRR(c, tx - 5, w * .1, 10, w * .14, 3, '#e7c13c'); c.restore(); }

// ---------- cartoon people ----------
/* p: x,y,H, skin, hair, style, top, bottom, skirt, shoes, handL/handR, tilt, mouth, eyes, headFrac, lashes */
function drawToon(c, p) {
  const s = p.s || 1, Ht = p.H * s, hh = Ht * (p.headFrac || .21), B = Ht - hh * .95;
  const cx = p.x + (p.headDx || 0), cy = p.y - B - hh * .42 + (p.headDy || 0);
  c.save();
  // back hair
  c.save(); c.translate(cx, cy); c.rotate(p.tilt || 0); backHair(c, p, hh); c.restore();
  const j = drawBody(c, Object.assign({ shirt: p.top || '#e66', pants: p.bottom || '#335', shoes: p.shoes || '#523', skin: p.skin }, p,
    { B, neckW: hh * .26, neckUp: hh * .25, skirt: p.skirt }));
  c.save(); c.translate(cx, cy); c.rotate(p.tilt || 0);
  ell(c, -hh * .42, hh * .05, hh * .08, hh * .1, p.skin); ell(c, hh * .42, hh * .05, hh * .08, hh * .1, p.skin);
  ell(c, 0, 0, hh * .43, hh * .5, p.skin);
  const ey = hh * .02, ex = hh * .155;
  if (p.eyes === 'closed') { for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * ex, ey, hh * .05, PI * .15, PI * .85); c.strokeStyle = '#2b1d10'; c.lineWidth = hh * .025; c.stroke(); } }
  else if (p.eyes === 'happy') { for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * ex, ey + hh * .03, hh * .05, PI * 1.15, PI * 1.85); c.strokeStyle = '#2b1d10'; c.lineWidth = hh * .028; c.stroke(); } }
  else for (const sx of [-1, 1]) { ell(c, sx * ex + (p.look || 0) * hh * .02, ey, hh * .042, hh * .058, '#2b1d10'); circ(c, sx * ex + hh * .015, ey - hh * .02, hh * .014, '#fff');
    if (p.lashes) line(c, [sx * (ex + hh * .03), ey - hh * .05, sx * (ex + hh * .07), ey - hh * .08], '#2b1d10', hh * .015); }
  c.fillStyle = 'rgba(255,120,130,.35)'; ell(c, -hh * .25, hh * .15, hh * .07, hh * .045); c.fill(); ell(c, hh * .25, hh * .15, hh * .07, hh * .045); c.fill();
  const my = hh * .2;
  if (p.mouth === 'open') { c.beginPath(); c.moveTo(-hh * .09, my - hh * .02); c.quadraticCurveTo(0, my + hh * .16, hh * .09, my - hh * .02); c.closePath(); c.fillStyle = '#7a2230'; c.fill();
    ell(c, 0, my + hh * .07, hh * .045, hh * .025, '#ff8a9a'); }
  else if (p.mouth === 'o') ell(c, 0, my + hh * .02, hh * .04, hh * .05, '#7a2230');
  else { c.beginPath(); c.arc(0, my - hh * .05, hh * .09, PI * .2, PI * .8); c.strokeStyle = '#7a2230'; c.lineWidth = hh * .025; c.lineCap = 'round'; c.stroke(); }
  frontHair(c, p, hh);
  c.restore(); c.restore();
  j.head = { x: cx, y: cy, hh }; return j;
}
function backHair(c, p, hh) {
  const col = p.hair, st = p.style;
  if (st === 'long') { c.beginPath(); c.moveTo(-hh * .5, -hh * .1); c.bezierCurveTo(-hh * .62, -hh * .75, hh * .62, -hh * .75, hh * .5, -hh * .1);
    c.quadraticCurveTo(hh * .62, hh * .55, hh * .56, hh * .98); for (let i = 0; i <= 6; i++) c.quadraticCurveTo(hh * (.56 - i * .187 + .09), hh * 1.08, hh * (.56 - (i + 1) * .187 + .0), hh * .98);
    c.quadraticCurveTo(-hh * .62, hh * .55, -hh * .5, -hh * .1); c.fillStyle = col; c.fill(); }
  if (st === 'puffs') { for (const sx of [-1, 1]) { circ(c, sx * hh * .44, -hh * .42, hh * .27, col);
    c.fillStyle = shade(col, .12); for (let i = 0; i < 7; i++) circ(c, sx * hh * .44 + Math.cos(i) * hh * .15, -hh * .42 + Math.sin(i * 1.7) * hh * .15, hh * .04); } }
  if (st === 'pigtails') for (const sx of [-1, 1]) { ell(c, sx * hh * .56, hh * .1, hh * .13, hh * .26, col, sx * .3); circ(c, sx * hh * .5, -hh * .1, hh * .07, '#ff5c9d'); }
  if (st === 'bob') { c.beginPath(); c.ellipse(0, hh * .02, hh * .55, hh * .6, 0, 0, TAU); c.fillStyle = col; c.fill(); }
}
function frontHair(c, p, hh) {
  const col = p.hair, st = p.style; c.fillStyle = col;
  if (st === 'long' || st === 'bob') { c.beginPath(); c.moveTo(-hh * .46, hh * .05); c.bezierCurveTo(-hh * .55, -hh * .62, hh * .55, -hh * .62, hh * .46, hh * .05);
    c.quadraticCurveTo(hh * .3, -hh * .3, -hh * .05, -hh * .28); c.quadraticCurveTo(-hh * .3, -hh * .1, -hh * .46, hh * .05); c.fill();
    c.strokeStyle = shade(col, .3); c.lineWidth = hh * .025; c.beginPath(); c.arc(-hh * .05, -hh * .08, hh * .36, PI * 1.15, PI * 1.45); c.stroke(); }
  if (st === 'puffs') { c.beginPath(); c.ellipse(0, -hh * .3, hh * .45, hh * .26, 0, PI, TAU); c.quadraticCurveTo(0, -hh * .18, -hh * .45, -hh * .3); c.fill();
    fillRR(c, -hh * .44, -hh * .36, hh * .88, hh * .06, 4, '#ffd23f'); }
  if (st === 'boy' || st === 'boy2') { c.beginPath(); c.moveTo(-hh * .45, -hh * .02); c.bezierCurveTo(-hh * .52, -hh * .66, hh * .52, -hh * .66, hh * .45, -hh * .02);
    if (st === 'boy') { for (let i = 0; i < 5; i++) c.lineTo(hh * (.45 - (i + .5) * .18), -hh * (.2 + (i % 2) * .08)); }
    else { c.quadraticCurveTo(hh * .1, -hh * .38, -hh * .3, -hh * .22); } c.closePath(); c.fill(); }
  if (st === 'pigtails') { c.beginPath(); c.moveTo(-hh * .46, 0); c.bezierCurveTo(-hh * .52, -hh * .64, hh * .52, -hh * .64, hh * .46, 0);
    c.quadraticCurveTo(hh * .2, -hh * .26, 0, -hh * .3); c.quadraticCurveTo(-hh * .2, -hh * .26, -hh * .46, 0); c.fill(); }
  if (p.cap) drawCap(c, 0, -hh * .3, hh * .95, 0, p.cap);
}
// ---------- scenery ----------
function sky(c, top = '#7cc8ff', bot = '#d9f1ff', h = H) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-200, -2000, W + 400, h + 2000); }
function cloud(c, x, y, s, a = 1) { c.save(); c.globalAlpha *= a; c.fillStyle = '#fff';
  for (const [dx, dy, r] of [[-.5, .1, .32], [-.15, -.15, .42], [.25, -.05, .36], [.55, .12, .26], [0, .15, .35]]) circ(c, x + dx * s, y + dy * s, r * s);
  c.restore(); }
function sun(c, x, y, r, t) { c.save(); c.translate(x, y); c.rotate(t * .2); c.fillStyle = 'rgba(255,214,70,.35)';
  for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); poly(c, [-r * .12, -r * 1.15, r * .12, -r * 1.15, 0, -r * 1.6], 'rgba(255,214,70,.45)'); }
  circ(c, 0, 0, r, '#ffd84a'); c.restore(); }
function ground(c, y, col = '#7ccf5a', col2 = '#5fb447') { c.fillStyle = col; c.fillRect(-300, y, W + 600, H - y + 1200); c.fillStyle = col2; c.fillRect(-300, y, W + 600, 10); }
function roundTree(c, x, y, s, col = '#4caf50') { fillRR(c, x - s * .08, y - s * .5, s * .16, s * .5, 6, '#7a5230');
  circ(c, x, y - s * .7, s * .34, col); circ(c, x - s * .22, y - s * .55, s * .24, shade(col, -.1)); circ(c, x + s * .22, y - s * .58, s * .25, shade(col, .1)); }
function pineTree(c, x, y, s, a = 1) { if (s <= 0) return; c.save(); c.globalAlpha *= a; c.fillStyle = '#6b4a2b'; c.fillRect(x - s * .06, y - s * .2, s * .12, s * .2);
  for (let i = 0; i < 3; i++) poly(c, [x - s * (.42 - i * .09), y - s * (.15 + i * .26), x + s * (.42 - i * .09), y - s * (.15 + i * .26), x, y - s * (.55 + i * .26)], ['#2f7d4a', '#358f54', '#3ea05f'][i]);
  c.restore(); }
function palmTree(c, x, y, s, a = 1, t = 0) { if (s <= 0) return; c.save(); c.globalAlpha *= a; c.strokeStyle = '#9a6b3c'; c.lineWidth = s * .09; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * .12, y - s * .5, x + s * .05, y - s * .9); c.stroke();
  for (let i = 0; i < 6; i++) { const a2 = -PI / 2 + (i - 2.5) * .55 + Math.sin(t * 2 + i) * .05; c.save(); c.translate(x + s * .05, y - s * .9); c.rotate(a2);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * .3, -s * .14, s * .5, s * .08); c.quadraticCurveTo(s * .28, -s * .02, 0, 0); c.fillStyle = i % 2 ? '#3aa05a' : '#2e8a4a'; c.fill(); c.restore(); }
  circ(c, x + s * .02, y - s * .86, s * .05, '#7a4b25'); circ(c, x + s * .1, y - s * .85, s * .05, '#7a4b25'); c.restore(); }
function bill(c, x, y, s, rot) { c.save(); c.translate(x, y); c.rotate(rot); fillRR(c, -s, -s * .45, s * 2, s * .9, 3, '#7fcf7a', '#3f8f3f', 2);
  circ(c, 0, 0, s * .28, '#bfeab9'); text(c, '$', 0, 1, s * .5, '#2f7a2f'); c.restore(); }
function confetti(c, t, n, seed, x0 = 0, w = W, y0 = -50, speed = 380) { const r = rng(seed);
  const cols = ['#ff4d6d', '#ffd23f', '#3bceac', '#4d96ff', '#b36bff', '#ff8c42'];
  for (let i = 0; i < n; i++) { const st = r() * .6, x = x0 + r() * w + Math.sin((t + i) * 3) * 20, y = y0 + (t - st) * speed * (.7 + r() * .6);
    if (t < st || y > H + 50) continue; c.save(); c.translate(x, y); c.rotate(t * 6 + i); c.fillStyle = cols[i % 6]; c.fillRect(-7, -4, 14, 8); c.restore(); } }
