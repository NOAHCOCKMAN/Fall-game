// ---------- scenes ----------
function caption(c, s, t, o = {}) {
  const start = o.start == null ? .35 : o.start, end = o.end == null ? 1e9 : o.end;
  const a = seg(t, start, start + .4), out = seg(t, end, end + .3); if (a <= 0 || out >= 1) return;
  const k = backOut(a) * (1 - easeIn(out)), size = o.size || 56, sub = o.sub;
  c.save(); c.font = `${size}px ${FONT}`; const lines = []; let cur = '';
  for (const w of s.split(' ')) { const tr = cur ? cur + ' ' + w : w; if (c.measureText(tr).width > 1500 && cur) { lines.push(cur); cur = w; } else cur = tr; } lines.push(cur);
  const tw = Math.max(...lines.map(l => c.measureText(l).width)), lh = size * 1.12;
  let bh = lines.length * lh + 44, bw = tw + 100; if (sub) { c.font = `600 ${size * .55}px ${FONT2}`; bw = Math.max(bw, c.measureText(sub).width + 100); bh += size * .7; }
  const cy = (o.y || 1030) - bh / 2;
  c.translate(o.x || 960, cy); c.scale(k, k); c.rotate(o.rot || -.008);
  c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowOffsetY = 8; c.shadowBlur = 0;
  fillRR(c, -bw / 2, -bh / 2, bw, bh, 26, o.bg || '#fff8e7'); c.shadowColor = 'transparent';
  rr(c, -bw / 2, -bh / 2, bw, bh, 26); c.strokeStyle = o.border || '#3a2614'; c.lineWidth = 6; c.stroke();
  lines.forEach((l, i) => text(c, l, 0, -bh / 2 + 22 + lh * (i + .5) + 2, size, o.color || '#3a2614'));
  if (sub) text(c, sub, 0, bh / 2 - size * .62, size * .55, o.subColor || '#7a4a22', { font: FONT2, weight: 600 });
  c.restore(); }

function walkPose(ph, a = .13) { const s = Math.sin(ph * TAU), cc = Math.cos(ph * TAU);
  return { footL: [s * a, -Math.max(0, cc) * a * .5], footR: [-s * a, -Math.max(0, -cc) * a * .5], handL: [-.07 - s * .12, .42], handR: [.07 + s * .12, .42], bob: Math.abs(cc) * 6 }; }
// hand target (absolute) -> offsets used by drawBody for our guy
function aim(p, side, X, Y) { const h = guyHead(p), B = h.B, w = p.wide || 1, lw = Math.max(9, B * .085);
  const sx = p.x + (side < 0 ? -1 : 1) * B * .34 * w * .4, sy = p.y - B + B * .08 + lw * .45; return [(X - sx) / B, (Y - sy) / B]; }
function aimToon(p, side, X, Y) { const s = p.s || 1, Ht = p.H * s, hh = Ht * (p.headFrac || .21), B = Ht - hh * .95, lw = Math.max(9, B * .085) * (p.limb || 1);
  const sx = p.x + (side < 0 ? -1 : 1) * B * .34 * (p.wide || 1) * .4, sy = p.y - B + B * .08 + lw * .45; return [(X - sx) / B, (Y - sy) / B]; }
const mixHand = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

function room(c, wall, floor, deco) {
  c.fillStyle = wall; c.fillRect(-600, -1200, W + 1200, 2400);
  c.fillStyle = 'rgba(255,255,255,.22)'; for (let y = -200; y < 760; y += 70) for (let x = -300; x < W + 300; x += 70) circ(c, x + (y / 70 % 2) * 35, y, 6);
  c.fillStyle = floor; c.fillRect(-600, 760, W + 1200, 1200);
  c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 3; for (let y = 800; y < 1400; y += 50) { c.beginPath(); c.moveTo(-600, y); c.lineTo(W + 600, y); c.stroke(); }
  c.fillStyle = shade(wall, -.25); c.fillRect(-600, 744, W + 1200, 22);
  if (deco) deco(c); }
function windowFrame(c, x, y, w, h, inner) { fillRR(c, x - 14, y - 14, w + 28, h + 28, 10, '#fff'); c.save(); rr(c, x, y, w, h, 4); c.clip(); inner(c); c.restore();
  line(c, [x + w / 2, y, x + w / 2, y + h], '#fff', 12); line(c, [x, y + h / 2, x + w, y + h / 2], '#fff', 12); }
function frame(c, x, y, w, h, fill, inner) { fillRR(c, x - 12, y - 12, w + 24, h + 24, 6, '#8a5a2b'); c.fillStyle = fill; c.fillRect(x, y, w, h); if (inner) inner(c); }
function banner(c, s, x, y, col, t0, t) { const k = backOut(seg(t, t0, t0 + .45)); if (k <= 0) return; c.save(); c.translate(x, y); c.scale(k, k); c.rotate(-.05 + Math.sin(t * 3) * .02);
  poly(c, [-330, -50, -380, 0, -330, 50, 330, 50, 380, 0, 330, -50], col, '#fff', 8); text(c, s, 0, 4, 64, '#fff', { stroke: shade(col, -.4), sw: 10 }); c.restore(); }
function retiredBox(c, x, y, lid = 1, frontOnly = false, backOnly = false) {
  const w = 170, h = 100;
  if (!frontOnly) { fillRR(c, x - w / 2, y - h, w, h, 6, '#a8743f'); if (lid < 1) { c.save(); c.translate(x - w / 2, y - h); c.rotate(-(1 - lid) * 1.9);
    fillRR(c, -6, -14, w + 12, 22, 5, '#c78d4f', '#6e4520', 3); c.restore(); } }
  if (backOnly) return;
  fillRR(c, x - w / 2, y - h * .85, w, h * .85, 6, '#c78d4f', '#6e4520', 4);
  fillRR(c, x - w * .4, y - h * .62, w * .8, h * .36, 4, '#fff6df'); text(c, 'RETIRED', x, y - h * .44, 30, '#7a2e1a');
  if (lid >= 1) fillRR(c, x - w / 2 - 6, y - h - 10, w + 12, 22, 5, '#c78d4f', '#6e4520', 3); }

/* ===== 1. Little Jewish boy ===== */
function drawDreidel(c, x, y, s, ph, tilt) {
  c.save(); c.translate(x, y); c.rotate(tilt); const cols = ['#4d7cff', '#f5c518', '#3bb273', '#e94f64'], L = ['נ', 'ג', 'ה', 'ש'];
  const f = ((ph * 4) % 1 + 1) % 1, i0 = Math.floor(ph * 4), bx = -s / 2 + s * (1 - f);
  ell(c, 0, 4, s * .5, s * .1, 'rgba(0,0,0,.18)');
  c.save(); c.beginPath(); c.moveTo(-s / 2, -s * 1.25); c.lineTo(s / 2, -s * 1.25); c.lineTo(s / 2, -s * .45); c.lineTo(0, 0); c.lineTo(-s / 2, -s * .45); c.closePath(); c.clip();
  c.fillStyle = cols[(i0) % 4]; c.fillRect(-s / 2, -s * 1.3, bx + s / 2, s * 1.4); c.fillStyle = cols[(i0 + 1) % 4]; c.fillRect(bx, -s * 1.3, s / 2 - bx, s * 1.4);
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-s / 2, -s * 1.3, s * .18, s * 1.4);
  const big = bx > 0 ? [(-s / 2 + bx) / 2, i0] : [(bx + s / 2) / 2, i0 + 1];
  text(c, L[big[1] % 4], big[0], -s * .8, s * .5, '#fff', { font: 'DejaVu Sans, sans-serif', weight: 'bold' });
  c.restore(); fillRR(c, -s * .08, -s * 1.55, s * .16, s * .34, 4, '#8a5a2b'); c.restore(); }
const S1 = { dur: 8, trans: 'pageflip', cap: 'Once upon a time, there was a little Jewish boy...',
  sfx: [[2.35, 'ding'], [4.5, 'whoosh'], [5.9, 'sparkle'], [6.35, 'ding']],
  draw(c, t) {
    const P = { x: 840, y: 905, s: 1.45, stage: 'kid', shirt: '#4d96ff', outfit: 'stripes', stripe: '#ffd23f', pants: '#3b4a6b', shorts: true, shoes: '#e94f64' };
    const h0 = guyHead(P), y0 = yarmOnHead(h0);
    const z = 1 + 1.5 * (easeIO(seg(t, 1.3, 2.3)) - easeIO(seg(t, 3.3, 4.1)));
    const zc = easeIO(seg(t, 1.3, 2.3)) - easeIO(seg(t, 3.3, 4.1));
    c.save(); camera(c, lerp(960, y0.x, zc), lerp(540, y0.y + 40, zc), z);
    room(c, '#f7d9a6', '#c08a55', c => {
      windowFrame(c, 1370, 190, 380, 300, c => { sky(c, '#7cc8ff', '#cdefff'); cloud(c, 1500, 300, 120); cloud(c, 1700, 400, 80); });
      frame(c, 250, 220, 220, 170, '#bfe3ff', c => { sun(c, 300, 270, 30, t); line(c, [250, 390, 330, 300, 400, 360, 470, 290], '#3a8f4a', 10); });
      fillRR(c, 1450, 610, 220, 18, 6, '#8a5a2b'); for (let i = 0; i < 7; i++) { fillRR(c, 1480 + i * 27, 560 - (i === 3 ? 20 : 0), 10, 50 + (i === 3 ? 20 : 0), 3, '#ffffff'); ell(c, 1485 + i * 27, 552 - (i === 3 ? 20 : 0), 5, 9, '#ffb627'); }
      ell(c, 900, 900, 520, 70, '#d35d6e'); ell(c, 900, 900, 470, 55, '#e98a7c'); });
    // dreidel
    const ds = seg(t, 4.5, 9), spun = t > 4.5;
    const ph = spun ? 7 * (1 - Math.exp(-(t - 4.5) / 1.4)) : 0, wob = spun ? Math.sin((t - 4.5) * 13) * .12 * ds : 0;
    drawDreidel(c, 1130 + (spun ? Math.sin((t - 4.5) * 2) * 30 * ds : 0), 900, 80, ph, wob);
    if (spun && t < 7.5) for (let i = 0; i < 3; i++) line(c, [1060 - i * 6, 820 + i * 18, 1050 - i * 6 - 20, 820 + i * 18], 'rgba(0,0,0,.25)', 4);
    // kid
    const reach = easeIO(seg(t, 4.0, 4.4)) - easeIO(seg(t, 4.55, 4.9));
    const thumb = easeOut(seg(t, 6.0, 6.35));
    let hR = mixHand([.07, .44], aim(P, 1, 1125, 770), reach); hR = mixHand(hR, [.62, -.62], thumb);
    const twirl = easeIO(seg(t, 4.9, 5.8));
    const p = Object.assign({}, P, { limb: 1.35, headDy: Math.sin(t * 5) * 3 - (twirl > 0 && twirl < 1 ? Math.sin(twirl * PI) * 18 : 0), handR: hR, thumbR: thumb > .6, bendR: thumb > .5 ? -.35 : .12,
      spinX: Math.cos(twirl * TAU), handL: [-.1 - Math.sin(twirl * PI) * .3, .4 - Math.sin(twirl * PI) * .25] });
    const j = drawGuy(c, p);
    const y = yarmOnHead(j.head); drawYarmulke(c, y.x, y.y, y.w, y.rot);
    burstSparkles(c, y.x, y.y - 30, 120, seg(t, 2.3, 3.2), 9, 4);
    sparkle(c, y.x - y.w * .3, y.y - y.w * .3, 38 * Math.sin(seg(t, 2.3, 3.2) * PI), 1, t * 3);
    sparkle(c, y.x + y.w * .25, y.y - y.w * .18, 26 * Math.sin(seg(t, 5.85, 6.4) * PI), 1, t * 3);
    if (thumb > .6) { sparkle(c, j.handR.x + 10, j.handR.y - 40, 34 * Math.sin(seg(t, 6.3, 7.1) * PI), 1, t * 4); }
    c.restore();
    caption(c, this.cap, t, { start: .3 });
  } };

/* ===== 2. Plot twist ===== */
const S2 = { dur: 8.5, trans: 'wipe', cap: 'Plot twist.',
  sfx: [[.8, 'scratch'], [1.0, 'drone', 5.6], [4.25, 'sparkle'], [5.65, 'tap'], [5.95, 'thud', .2], [6.45, 'ding'], [6.62, 'whoosh']],
  draw(c, t) {
    room(c, '#9fc3e6', '#8f6a48', c => {
      frame(c, 200, 180, 200, 270, '#2b2d42', c => { circ(c, 300, 290, 60, '#f77f00'); line(c, [240, 290, 360, 290], '#2b2d42', 4); line(c, [300, 230, 300, 350], '#2b2d42', 4); text(c, 'HOOPS', 300, 410, 34, '#fff'); });
      frame(c, 1500, 160, 260, 200, '#ffd166', c => { poly(c, [1630, 190, 1680, 320, 1580, 320], '#ef476f'); circ(c, 1630, 260, 18, '#fff'); text(c, 'TO THE MOON', 1630, 340, 24, '#073b4c'); });
      windowFrame(c, 620, 170, 300, 240, c => { sky(c, '#7cc8ff', '#cdefff'); cloud(c, 760, 260, 90); }); });
    // table + box (back)
    fillRR(c, 1180, 700, 260, 24, 6, '#6e4520'); fillRR(c, 1200, 724, 18, 156, 4, '#5a381a'); fillRR(c, 1402, 724, 18, 156, 4, '#5a381a');
    const lid = easeOut(seg(t, 5.7, 6.0)); retiredBox(c, 1310, 700, lid, false, true);
    const walkK = easeIO(seg(t, 4.75, 5.5)), back = easeIO(seg(t, 6.7, 7.4));
    const gx = lerp(800, 1000, walkK) - (1010 - 900) * back * 0;
    const P = { x: gx, y: 885, s: 1.25, stage: 'teen1', shirt: '#ef476f', pants: '#264653', shoes: '#fff', outfit: 'polo' };
    const h0 = guyHead(P), on = yarmOnHead(h0);
    // yarmulke path
    let yx = on.x, yy = on.y, yw = on.w, rot = on.rot, fold = 0;
    const lift = easeIO(seg(t, 2.6, 3.4)), look = easeIO(seg(t, 3.4, 4.2)), carry = easeIO(seg(t, 4.85, 5.5)), drop = easeIn(seg(t, 5.5, 5.72));
    yy -= lift * 80; yx = lerp(yx, gx + 10, look); yy = lerp(yy, h0.y + h0.fh * 1.05, look); rot = lerp(rot, -.25, look);
    fold = easeIO(seg(t, 4.2, 4.8));
    yx = lerp(yx, 1310, carry); yy = lerp(yy, 640, carry) - Math.sin(carry * PI) * 60 + drop * 50; rot = lerp(rot, 0, carry);
    const inBox = t > 5.5;
    // hands
    const toHead = easeIO(seg(t, 1.4, 2.6)), shrug = easeOut(seg(t, 6.8, 7.2));
    const grip = (side) => { const k = side * (yw * (1 - fold * .5)) * .46; return aim(P, side, yx + k, yy - 10); };
    let hL = mixHand([-.07, .44], grip(-1), toHead), hR = mixHand([.07, .44], grip(1), toHead);
    hL = mixHand(hL, [-.07, .44], carry); if (t > 5.72) hR = mixHand(grip(1), [.07, .44], easeIO(seg(t, 5.72, 6.1)));
    hL = mixHand(hL, [-.38, -.02], shrug); hR = mixHand(hR, [.38, -.02], shrug);
    const p = Object.assign({}, P, { handL: hL, handR: hR, headRot: look * .1 * (1 - carry), headDy: look * 8 * (1 - carry),
      footL: walkK > 0 && walkK < 1 ? walkPose(walkK * 2).footL : [0, 0], footR: walkK > 0 && walkK < 1 ? walkPose(walkK * 2).footR : [0, 0], bendL: -.2, bendR: .2 });
    const j = drawGuy(c, p);
    // cross necklace drops in
    if (t > 5.95) { const k = bounceOut(seg(t, 5.95, 6.45)); c.save(); c.translate(0, (1 - k) * -620); drawCross(c, j.chest.x, j.ySh - 2, j.B, 1); c.restore();
      burstSparkles(c, j.chest.x, j.ySh + j.B * .2, 90, seg(t, 6.42, 7.2), 8, 9); sparkle(c, j.chest.x + 20, j.ySh + j.B * .17, 30 * Math.sin(seg(t, 6.4, 7.4) * PI), 1, t * 4); }
    if (!inBox || drop < 1) { if (inBox) { c.save(); c.beginPath(); c.rect(0, 0, W, 640 + 50); c.clip(); }
      drawYarmulke(c, yx, yy, yw, rot, fold); if (inBox) c.restore(); }
    retiredBox(c, 1310, 700, lid, true);
    // spotlight + slow-mo framing
    const dark = seg(t, .82, 1.15) * (1 - seg(t, 6.6, 6.75));
    if (dark > 0) {
      const lx = lerp(860, 1080, walkK);
      const g = c.createRadialGradient(lx, 560, 120, lx, 560, 620); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, `rgba(5,5,20,${.55 * dark})`); g.addColorStop(1, `rgba(5,5,20,${.9 * dark})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .16 * dark; poly(c, [lx - 90, -10, lx + 90, -10, lx + 360, 900, lx - 360, 900], '#fff6c8');
      ell(c, lx, 885, 340, 50, 'rgba(255,246,200,.6)');
      const r = rng(5); for (let i = 0; i < 40; i++) { const px = lx - 250 + r() * 500, py = (r() * 900 + t * 12 * (r() + .2)) % 900; circ(c, px + Math.sin(t + i) * 10, py, 2 + r() * 2, '#fff'); }
      c.restore();
      const bar = 90 * easeIO(seg(t, .9, 1.4)) * (1 - easeIO(seg(t, 6.6, 6.8))); c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    }
    caption(c, this.cap, t, { start: 1.1, size: 78 });
  } };

/* ===== 3. First girlfriend ===== */
function gym(c, t) {
  const g = c.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, '#2b1e5c'); g.addColorStop(1, '#5a3a8c'); c.fillStyle = g; c.fillRect(0, 0, W, 760);
  const fg = c.createLinearGradient(0, 760, 0, H); fg.addColorStop(0, '#d9a066'); fg.addColorStop(1, '#b87a42'); c.fillStyle = fg; c.fillRect(0, 760, W, H - 760);
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 3; for (let x = -400; x < W + 400; x += 120) { c.beginPath(); c.moveTo(x, 760); c.lineTo(x + (x - 960) * .6, H); c.stroke(); }
  const cols = ['#ff4d6d', '#ffd23f', '#3bceac', '#4d96ff'];
  for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(i * 170, 0); c.quadraticCurveTo(i * 170 + 85, 110, i * 170 + 170, 0); c.strokeStyle = cols[i % 4]; c.lineWidth = 14; c.stroke(); }
  for (let i = 0; i < 26; i++) { const x = i * 76, y = 60 + Math.sin(i * .5) * 30; circ(c, x, y, 9, ['#fff2a8', '#ffd1f0', '#b8f3ff'][i % 3]); }
  fillRR(c, 1330, 300, 500, 80, 18, '#ff4d6d', '#fff', 6); text(c, 'SPRING DANCE', 1580, 343, 54, '#fff');
  // disco ball + light spots
  line(c, [960, 0, 960, 40], '#ccc', 4); circ(c, 960, 80, 42, '#cfd8e3');
  c.save(); c.beginPath(); c.arc(960, 80, 42, 0, TAU); c.clip(); for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) { c.fillStyle = (x + y + Math.floor(t * 6)) % 2 ? '#ffffff' : '#8fa3b8'; c.fillRect(960 + x * 13 - 6, 80 + y * 13 - 6, 12, 12); } c.restore();
  c.save(); c.globalCompositeOperation = 'lighter'; const r = rng(11);
  for (let i = 0; i < 30; i++) { const a = r() * TAU + t * .7, d = 250 + r() * 800; circ(c, 960 + Math.cos(a) * d * 1.2, 380 + Math.sin(a) * d * .45, 8 + r() * 6, `rgba(${r() * 255 | 0},${200 + r() * 55 | 0},255,.35)`); }
  c.restore(); }
const S3 = { dur: 5.5, trans: 'star', cap: 'A few years later... his first girlfriend. Sweaty palms, full heart.',
  sfx: [[2.35, 'boing'], [2.45, 'sparkle']],
  draw(c, t) {
    gym(c, t);
    const P = { x: 730, y: 905, s: 1.05, stage: 'teen2', shirt: '#cfe3ff', outfit: 'tie', tie: '#d62839', pants: '#2b3445', shoes: '#222' };
    const G = Object.assign({ x: 1190, y: 905, H: 690, headFrac: .22, skin: '#8d5a3b', hair: '#2b1a12', style: 'puffs', top: '#ff6f91', skirt: '#ff6f91', shoes: '#fff', facing: -1, lashes: true }, {});
    const M = { x: 965, y: 705 };
    const kH = easeIO(seg(t, .5, 1.2)) * .55 - easeIO(seg(t, 1.2, 1.5)) * .25 + easeIO(seg(t, 1.6, 2.3)) * .7, kG = easeIO(seg(t, .7, 2.3));
    const trem = t < 2.35 ? Math.sin(t * 47) * 6 : 0;
    const hR = mixHand([.07, .44], aim(P, 1, M.x - 8 + trem, M.y + trem * .5), kH);
    const gL = mixHand([-.07, .44], aimToon(G, -1, M.x + 6, M.y - 4), kG);
    const joy = seg(t, 2.4, 2.8);
    drawToon(c, Object.assign(G, { handL: gL, eyes: joy > 0 ? 'happy' : 'open', mouth: joy > 0 ? 'open' : 'smile', tilt: -.06 * joy, headDy: Math.sin(t * 6) * 3 * joy }));
    drawGuy(c, Object.assign(P, { handR: hR, sweat: seg(t, .3, .9) * (1 - .6 * seg(t, 2.6, 3.6)), t, headDy: joy * Math.sin(t * 9) * 5, headRot: joy * .05 }));
    const hk = backOut(seg(t, 2.35, 2.75)) * (1 + Math.sin(t * 9) * .06 * joy);
    heart(c, 965, 300, 95 * hk);
    for (let i = 0; i < 6; i++) { const st = 2.6 + i * .3, k = seg(t, st, st + 1.6); if (k > 0 && k < 1) heart(c, 965 + Math.sin(i * 2.3 + k * 6) * 160, 330 - k * 300, 26, ['#ff8fab', '#ff4d6d'][i % 2], 1 - k); }
    burstSparkles(c, M.x, M.y, 90, seg(t, 2.35, 3.1), 8, 2);
    caption(c, this.cap, t);
  } };

/* ===== 4. Landscaping ===== */
function drawMower(c, x, y, t, on) {
  const vib = on ? Math.sin(t * 60) * 1.5 : 0; c.save(); c.translate(x, y + vib);
  fillRR(c, -80, -48, 160, 40, 12, '#d62828', '#7a1212', 3); fillRR(c, -40, -82, 70, 40, 8, '#333'); fillRR(c, -30, -96, 40, 18, 5, '#555');
  for (const wx of [-56, 56]) { circ(c, wx, -8, 22, '#222'); circ(c, wx, -8, 9, '#bbb'); }
  c.restore(); }
function drawTruck(c, x, y, t, o = {}) {
  c.save(); c.translate(x, y);
  // bed
  fillRR(c, 170, -190, 330, 120, 8, '#b5513b', '#5a2418', 4); fillRR(c, 178, -200, 314, 14, 4, '#8f3b2a');
  ell(c, 330, -130, 40, 22, '#7a4a2a'); ell(c, 440, -110, 22, 14, '#7a4a2a'); ell(c, 250, -100, 18, 10, '#8a5a35');
  // cab
  c.beginPath(); c.moveTo(-60, -70); c.lineTo(-60, -150); c.quadraticCurveTo(-55, -175, -20, -180); c.lineTo(20, -180); c.lineTo(50, -280); c.lineTo(165, -285); c.lineTo(175, -70); c.closePath();
  c.fillStyle = '#b5513b'; c.fill(); c.strokeStyle = '#5a2418'; c.lineWidth = 4; c.stroke();
  poly(c, [60, -270, 155, -272, 160, -195, 40, -195], '#a9d6ef', '#5a2418', 4); line(c, [70, -255, 100, -215], 'rgba(255,255,255,.6)', 6);
  // mismatched door
  fillRR(c, 30, -190, 140, 118, 6, '#5d7fb5', '#2c4570', 4); line(c, [140, -160, 160, -160], '#ddd', 6);
  // primer patch + dent
  fillRR(c, -50, -140, 60, 40, 8, '#9a9a96'); c.beginPath(); c.arc(-20, -95, 18, PI, TAU); c.strokeStyle = '#6b2a1c'; c.lineWidth = 4; c.stroke();
  // headlight with tape
  circ(c, -52, -125, 14, '#fff6b3'); line(c, [-64, -137, -40, -113], '#c8c8c8', 6); line(c, [-64, -113, -40, -137], '#c8c8c8', 6);
  fillRR(c, -72, -82, 50, 18, 5, '#888');
  // bumper (can fall)
  const bd = o.bumper || 0; c.save(); c.translate(470, -78 + bd * 70); c.rotate(bd * .5); fillRR(c, 0, 0, 60, 16, 4, '#9a9a9a', '#555', 2); c.restore();
  // wheels
  for (const wx of [40, 400]) { circ(c, wx, -40, 48, '#1e1e1e'); circ(c, wx, -40, 22, wx === 400 ? '#555' : '#c9c9c9'); }
  // antenna
  line(c, [150, -285, 170, -360, 210, -380], '#555', 4);
  // sign
  if (o.sign) { const k = o.sign; c.save(); c.translate(100, -132); c.rotate(-.04 + Math.sin(t * 9) * .03 * (1 - seg(t, 3.5, 4.5))); c.scale(k, k);
    fillRR(c, -78, -46, 156, 92, 8, '#fffdf3', '#2f6b2f', 4); text(c, SIGN[0], 0, -18, 22, '#2f6b2f'); text(c, SIGN[1], 0, 12, 22, '#2f6b2f');
    ell(c, 0, 34, 16, 7, '#4caf50', -.3); line(c, [-70, -44, -50, -38], '#c8c8c8', 8); line(c, [70, 44, 50, 38], '#c8c8c8', 8); c.restore(); }
  c.restore(); }
function puff(c, x, y, r, a) { if (a <= 0) return; c.save(); c.globalAlpha *= a; c.fillStyle = '#9a9a9a'; for (const [dx, dy, s] of [[0, 0, 1], [-.6, .2, .7], [.6, .1, .75], [0, -.5, .7]]) circ(c, x + dx * r, y + dy * r, s * r); c.restore(); }
const S4 = { dur: 6, trans: 'heart', cap: 'He mowed one lawn... then started a whole company.',
  sfx: [[0, 'mower', 2.6], [3.45, 'slap'], [4.6, 'backfire'], [5.15, 'thud', .3]],
  draw(c, t) {
    sky(c, '#79c6ff', '#d8f2ff'); sun(c, 220, 160, 70, t); cloud(c, 700, 170, 110); cloud(c, 1250, 120, 80);
    for (let i = 0; i < 6; i++) roundTree(c, 120 + i * 360, 700, 260, i % 2 ? '#56b85a' : '#47a64c');
    fillRR(c, -20, 640, 300, 70, 0, '#e8e0d0'); poly(c, [-20, 640, 130, 560, 280, 640], '#c2523d'); // little house
    ground(c, 700, '#6cc24a', '#58a83c');
    const mowK = easeIO(seg(t, 0, 2.6)), gx = lerp(150, 850, mowK), mx = gx + 230;
    c.fillStyle = 'rgba(255,255,255,.12)'; for (let yy = 720; yy < H; yy += 90) c.fillRect(0, yy, Math.min(mx - 80, W), 45);
    const r = rng(3); c.fillStyle = '#3f9a32'; for (let i = 0; i < 260; i++) { const x = r() * W, y = 705 + r() * 370; if (x > mx + 70 || (x > 1250)) { c.beginPath(); c.moveTo(x - 6, y + 12); c.lineTo(x, y - 14); c.lineTo(x + 6, y + 12); c.fill(); } }
    drawTruck(c, 1330, 880, t, { sign: t > 3.42 ? 1 : 0, bumper: bounceOut(seg(t, 4.9, 5.2)) });
    puff(c, 1860, 820, 40 + seg(t, 4.6, 5.6) * 40, 1 - seg(t, 4.6, 5.6));
    const walkTo = easeIO(seg(t, 2.7, 3.25)), px = lerp(gx, 1250, walkTo);
    const P = { x: px, y: 880, s: 1.12, stage: 'teen3', shirt: '#2a9d8f', pants: '#3d5a80', shoes: '#6b4a2b', outfit: 'tee' };
    const moving = mowK > 0 && mowK < 1 || walkTo > 0 && walkTo < 1, wp = walkPose(t * 1.8);
    const grip = aim(P, 1, gx + 120, 640);
    let hL = grip, hR = grip;
    if (t > 2.6) { const sign = aim(P, 1, 1430, 752); const slap = easeOut(seg(t, 3.25, 3.42)); hR = mixHand(mixHand([.2, .25], [.3, .1], walkTo), sign, slap); hL = mixHand(grip, [-.07, .44], seg(t, 2.6, 2.9)); }
    const proud = easeOut(seg(t, 3.9, 4.2)); hL = mixHand(hL, [-.02, .36], proud); hR = mixHand(hR, [.02, .36], proud);
    drawMower(c, t > 2.6 ? 850 + 230 : mx, 880, t, t < 2.6);
    if (t < 2.62) line(c, [mx - 60, 840, gx + 120, 640], '#333', 10);
    else line(c, [850 + 170, 840, 850 + 110, 650], '#333', 10);
    drawGuy(c, Object.assign(P, { handL: hL, handR: hR, bendL: proud ? -.9 * proud : .1, bendR: proud ? .9 * proud : .1, footL: moving ? wp.footL : [0, 0], footR: moving ? wp.footR : [0, 0], headDy: moving ? -wp.bob : 0 }));
    if (t > 2.75 && t < 3.42) { const k = seg(t, 2.75, 2.95); const hx = lerp(px + 120, 1430, easeOut(seg(t, 3.25, 3.42))); c.save(); c.translate(hx, lerp(700, 752, seg(t, 3.25, 3.42))); c.scale(k * .85, k * .85);
      fillRR(c, -78, -46, 156, 92, 8, '#fffdf3', '#2f6b2f', 4); text(c, SIGN[0], 0, -18, 22, '#2f6b2f'); text(c, SIGN[1], 0, 12, 22, '#2f6b2f'); c.restore(); }
    if (t < 2.6) for (let i = 0; i < 14; i++) { const k = (t * 3 + i / 14) % 1; c.fillStyle = '#4caf50'; c.fillRect(mx - 90 - k * 140 + Math.sin(i) * 20, 850 - Math.sin(k * PI) * 90 - i % 3 * 6, 8, 4); }
    comic(c, 'SLAP!', 1430, 640, 54, seg(t, 3.4, 4.3));
    comic(c, 'BANG!', 1800, 720, 46, seg(t, 4.6, 5.3), .15, '#ffb347');
    caption(c, this.cap, t);
  } };

/* ===== 5. Meets Leah ===== */
function parkBG(c, t) { sky(c, '#86cfff', '#e6f6ff'); cloud(c, 400, 180, 110); cloud(c, 1500, 140, 130); sun(c, 1700, 170, 60, t);
  for (let i = 0; i < 7; i++) roundTree(c, 80 + i * 300, 720, 300 + (i % 3) * 30, ['#4caf50', '#5cbd60', '#43a047'][i % 3]);
  ground(c, 720, '#7fcf5f', '#6ab84d'); fillRR(c, -20, 780, W + 40, 60, 0, '#d9d4c8'); c.fillStyle = '#5d6168'; c.fillRect(-20, 880, W + 40, 200);
  for (let x = 0; x < W; x += 200) fillRR(c, x + 40, 975, 100, 14, 4, '#f2d24b'); }
function curb(c) { fillRR(c, 560, 832, 230, 60, 6, '#c9c4b8', '#8a857a', 4); c.fillStyle = '#b3ad9f'; c.fillRect(564, 852, 222, 6); }
function s5content(c, t) {
  parkBG(c, t); curb(c);
  const hop = easeIO(seg(t, 2.2, 2.9)), lk = easeIO(seg(t, 2.6, 3.1));
  const gx = lerp(890, 680, hop), gy = lerp(880, 834, hop) - Math.sin(hop * PI) * 70;
  const L = Object.assign({}, LEAH, { x: lerp(1090, 950, lk), y: 880, H: 735 * 1.1, facing: -1, eyes: t > 3.3 ? 'happy' : 'open' });
  const P = { x: gx, y: gy, s: 1.1, stage: 'adult', shirt: '#7fb069', outfit: 'button', pants: '#2f3e5c', shoes: '#5a3d2b' };
  const hp = hop > 0 && hop < 1 ? Math.sin(hop * PI) : 0;
  const tip = seg(t, .3, 2.0) - seg(t, 2.0, 2.2);
  const arm = easeOut(seg(t, 3.0, 3.25));
  drawToon(c, Object.assign(L, { tilt: -.08 * arm, handL: [-.07, .44], handR: [.07, .44] }));
  drawGuy(c, Object.assign(P, { footL: [0, -hp * .1], footR: [0, -hp * .1], headRot: .06 * arm, handR: mixHand([.07, .44], aim(P, 1, L.x - 40, 470), arm), bendR: -.2 }));
  if (tip > 0) { const hh = guyHead(P), ly = 880 - L.H; c.save(); c.globalAlpha = clamp(tip * 2); c.setLineDash([14, 10]);
    line(c, [hh.x - 160, hh.top, L.x + 160, hh.top], '#d62839', 4); line(c, [hh.x - 160, ly, L.x + 160, ly], '#2a6fdb', 4); c.setLineDash([]);
    text(c, '+3 in.', L.x + 260, (ly + hh.top) / 2, 46, '#d62839', { stroke: '#fff' }); c.restore(); }
}
const S5 = { dur: 6, trans: 'pageflip', cap: 'Then he met Leah. He married up. Literally.', sfx: [[2.25, 'boing'], [3.35, 'click'], [3.9, 'whoosh'], [4.3, 'sparkle']],
  draw(c, t) {
    const pol = easeIO(seg(t, 3.7, 4.4));
    if (pol <= 0) s5content(c, t);
    else { c.fillStyle = '#c98f5a'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 400; i++) { const r = rng(i + 7); circ(c, r() * W, r() * H, 2 + r() * 3); }
      const sc = lerp(1, .55, pol), rot = lerp(0, -.06, pol), cy = lerp(540, 470, pol);
      c.save(); c.translate(960, cy); c.rotate(rot); c.scale(sc, sc);
      c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 30 * pol; fillRR(c, -W / 2 - 70 * pol, -H / 2 - 70 * pol, W + 140 * pol, H + 300 * pol, 8, '#fdfdf8'); c.shadowBlur = 0;
      c.save(); c.beginPath(); c.rect(-W / 2, -H / 2, W, H); c.clip(); c.translate(-W / 2, -H / 2); s5content(c, 3.3); c.restore();
      text(c, NAME ? NAME + ' + Leah ♥' : 'Just married! ♥', 0, H / 2 + 115, 96, '#2a3d8f', { font: FONT2, weight: 600, rot: -.02 });
      c.restore(); circ(c, 960, cy - H * sc / 2 - 20, 22, '#e63946'); circ(c, 953, cy - H * sc / 2 - 27, 7, '#ff8a8a'); }
    const fl = 1 - seg(t, 3.35, 3.75); if (t > 3.35 && fl > 0) { c.fillStyle = `rgba(255,255,255,${fl})`; c.fillRect(0, 0, W, H); }
    caption(c, this.cap, t);
  } };

/* ===== 6. The hat from the heavens ===== */
function mountains(c) { poly(c, [-50, 720, 200, 380, 330, 480, 520, 250, 600, 330, 700, 180, 760, 260, 860, 150, 940, 300, 1100, 380, 1300, 260, 1480, 420, 1700, 300, 1980, 720], '#5b6f8f');
  poly(c, [500, 280, 520, 250, 545, 285, 530, 300], '#fff'); poly(c, [680, 210, 700, 180, 722, 215], '#fff'); poly(c, [840, 180, 860, 150, 885, 190, 865, 200], '#fff');
  poly(c, [-50, 720, 300, 520, 600, 600, 900, 470, 1250, 600, 1600, 500, 1980, 640, 1980, 720], '#7b8fad'); }
const S6 = { dur: 6.5, trans: 'diag', cap: 'Then came THE HAT. He would never take it off again.',
  sfx: [[.6, 'choir', 3.9], [4.0, 'pop'], [4.05, 'ding'], [4.15, 'tada', .12]],
  draw(c, t) {
    sky(c, '#5aa9ef', '#cfeaff'); mountains(c); ground(c, 720, '#86c96a', '#74b558');
    for (let i = 0; i < 5; i++) pineTree(c, 140 + i * 420 + (i % 2) * 90, 760, 170);
    const dim = seg(t, .2, .7) * (1 - seg(t, 4.6, 5.6)); c.fillStyle = `rgba(20,30,70,${.35 * dim})`; c.fillRect(0, 0, W, H);
    const part = easeIO(seg(t, .4, 1.3)); cloud(c, 960 - part * 560, 90, 260, .95); cloud(c, 960 + part * 560, 110, 280, .95); cloud(c, 800 - part * 400, 30, 200, .9); cloud(c, 1120 + part * 400, 40, 220, .9);
    const beam = seg(t, .6, 1.2) * (1 - seg(t, 4.6, 5.4));
    if (beam > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = beam;
      const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, 'rgba(255,236,150,.75)'); g.addColorStop(1, 'rgba(255,236,150,.15)'); poly(c, [880, -20, 1040, -20, 1220, 900, 700, 900], g);
      c.translate(960, 0); for (let i = 0; i < 9; i++) { c.save(); c.rotate((i - 4) * .12 + Math.sin(t + i) * .02); poly(c, [-6, 0, 6, 0, 22, 1000, -22, 1000], 'rgba(255,250,210,.12)'); c.restore(); } c.restore(); }
    const landed = t >= 4.0;
    const P = { x: 960, y: 890, s: 1.15, stage: 'adult', shirt: '#cfd6de', outfit: 'vest', vest: '#1f3b5c', pants: '#4a5568', shoes: '#6b4a2b', face: landed ? 'hat' : 'nohat' };
    const up = easeIO(seg(t, 1.6, 2.4)) * (1 - easeIO(seg(t, 3.7, 4.0))), cheer = easeOut(seg(t, 4.4, 4.7));
    const hb = guyHead(P);
    let hL = mixHand([-.07, .44], [-.3, -.55], up), hR = mixHand([.07, .44], [.3, -.55], up);
    hR = mixHand(hR, [.25, -.62], cheer); hL = mixHand(hL, [-.05, .4], cheer);
    drawGuy(c, Object.assign(P, { handL: hL, handR: hR, thumbR: cheer > .5, headDy: landed ? -Math.abs(Math.sin((t - 4) * 9)) * 10 * (1 - seg(t, 4, 5.2)) : 0 }));
    if (!landed) { const k0 = seg(t, .8, 4.0), d = k0 < .8 ? k0 * .85 : .68 + (1 - Math.pow(1 - (k0 - .8) / .2, 2)) * .32, hx = 960 + Math.sin(t * 2.2) * 40 * (1 - d), hy = lerp(-90, hb.top + hb.fh * .42, d);
      const glow = c.createRadialGradient(hx, hy - 30, 10, hx, hy - 30, 190); glow.addColorStop(0, 'rgba(255,245,180,.9)'); glow.addColorStop(1, 'rgba(255,245,180,0)');
      c.fillStyle = glow; c.fillRect(hx - 200, hy - 230, 400, 400);
      const sp = Math.cos(t * 3.2); drawCap(c, hx, hy, hb.fh * .98, Math.sin(t * 2) * .12 * (1 - d), HAT, d > .92 ? 1 : (Math.abs(sp) < .2 ? .2 * Math.sign(sp || 1) : sp));
      for (let i = 0; i < 5; i++) sparkle(c, hx + Math.cos(t * 2 + i * 1.3) * 120, hy - 40 + Math.sin(t * 2.6 + i) * 70, 14 + 8 * Math.sin(t * 5 + i), .9, t); }
    burstSparkles(c, 960, hb.top + 30, 220, seg(t, 4.0, 5.0), 12, 6);
    const fl = 1 - seg(t, 4.0, 4.35); if (t >= 4.0 && fl > 0) { c.fillStyle = `rgba(255,252,230,${fl})`; c.fillRect(0, 0, W, H); }
    caption(c, this.cap, t, { start: 2.2 });
  } };

/* ===== 7. Back to school ===== */
const BOOKS = ['ANATOMY', 'BIOCHEM', 'MCAT', 'PHYSIOLOGY', 'PHARMACOLOGY', 'PATHOLOGY', 'MICROBIO', 'CARDIOLOGY', 'EKG MADE EASY', 'BOARDS', 'MORE BOARDS'];
const BCOL = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#8338ec', '#f4a261', '#264653', '#d62828', '#3a86ff', '#6a994e', '#bc4749'];
const S7 = { dur: 6.5, trans: 'iris', cap: 'Back to school. Lots... and lots... of school.',
  sfx: [...BOOKS.map((b, i) => [.55 + i * .38, 'tap']), ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => [.75 + i * .4, 'clink']), ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => [.3 + i * .5, 'tear']), [5.25, 'ding'], [5.3, 'tada', .1]],
  draw(c, t) {
    room(c, '#e8dcc6', '#a77b55', c => {
      windowFrame(c, 260, 150, 320, 260, c => { const night = Math.floor(t * 2.5) % 2; sky(c, night ? '#14213d' : '#7cc8ff', night ? '#2b3a67' : '#d8f2ff');
        if (night) { circ(c, 500, 230, 40, '#f8f3d4'); circ(c, 515, 220, 36, '#14213d'); for (let i = 0; i < 9; i++) circ(c, 280 + i * 30, 180 + (i * 37 % 90), 3, '#fff'); } else sun(c, 340, 220, 40, t); });
      // calendar
      fillRR(c, 1560, 160, 260, 300, 10, '#fff', '#b33', 5); fillRR(c, 1560, 160, 260, 70, 10, '#d62828');
      const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], step = .25, idx = Math.floor(t / step);
      text(c, M[idx % 12], 1690, 196, 44, '#fff'); for (let r = 0; r < 4; r++) for (let q = 0; q < 6; q++) fillRR(c, 1582 + q * 38, 250 + r * 48, 28, 32, 4, '#e3caca');
      const fk = (t % step) / step; c.save(); c.translate(1690 + fk * 260, 300 - fk * 240); c.rotate(fk * 2.5); c.globalAlpha = 1 - fk; fillRR(c, -130, -140, 260, 280, 10, '#fff', '#b33', 4); text(c, M[(idx + 11) % 12], 0, -100, 40, '#d62828'); c.restore(); });
    const P = { x: 960, y: 960, s: 1.1, stage: 'adult', face: 'hat', shirt: '#5b6b7f', outfit: 'hoodie', pants: '#333', shoes: '#333' };
    const scrib = Math.sin(t * 22) * .02;
    drawGuy(c, Object.assign(P, { handR: [.12 + scrib, .34], handL: [-.02, .36 + Math.sin(t * 3) * .02], headDy: Math.sin(t * 4) * 4, headRot: Math.sin(t * 1.3) * .04 }));
    const hd = guyHead(P);
    // desk
    fillRR(c, 330, 690, 1260, 40, 8, '#7a4b28'); fillRR(c, 360, 730, 1200, 360, 4, '#8f5b33'); fillRR(c, 380, 760, 520, 120, 6, '#7a4b28'); fillRR(c, 1020, 760, 520, 120, 6, '#7a4b28');
    circ(c, 640, 820, 10, '#e9c46a'); circ(c, 1280, 820, 10, '#e9c46a');
    fillRR(c, 860, 660, 210, 34, 4, '#fff', '#ccc', 2); line(c, [880, 670, 1040, 670], '#88a', 3); line(c, [880, 682, 1000, 682], '#88a', 3);
    // book tower
    BOOKS.forEach((b, i) => { const tb = .3 + i * .38, k = seg(t, tb, tb + .28); if (k <= 0) return; const yb = 690 - i * 50, yy = lerp(-120, yb, bounceOut(k));
      c.save(); c.translate(620 + Math.sin(i * 1.7) * 14, yy); c.rotate(Math.sin(i * 2.1) * .03); fillRR(c, -130, -50, 260, 50, 6, BCOL[i], shade(BCOL[i], -.35), 3);
      c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(-126, -44, 8, 38); text(c, b, 4, -24, 26, '#fff'); c.restore(); });
    // coffee pyramid
    const slots = []; [4, 3, 2, 1].forEach((n, r) => { for (let q = 0; q < n; q++) slots.push([1320 + (q - (n - 1) / 2) * 74, 690 - r * 84]); });
    slots.forEach(([x, y], i) => { const tb = .5 + i * .4, k = seg(t, tb, tb + .25); if (k <= 0) return; const yy = lerp(-100, y, bounceOut(k));
      c.save(); c.translate(x, yy); poly(c, [-30, -78, 30, -78, 24, 0, -24, 0], '#fff', '#bbb', 3); fillRR(c, -30, -60, 60, 26, 3, '#b07a4a'); c.beginPath(); c.arc(30, -45, 14, -1.2, 1.2); c.strokeStyle = '#ddd'; c.lineWidth = 6; c.stroke();
      if (Math.sin(t * 3 + i) > 0) line(c, [-6, -90, 0, -110, -6, -130], 'rgba(255,255,255,.7)', 4); c.restore(); });
    // grad cap on top of the hat
    const gk = seg(t, 4.9, 5.3); if (gk > 0) { const top = hd.y + FACES.hat.meta.headTop * hd.fh + hd.fh * .08; drawMortarboard(c, hd.x, lerp(-200, top, bounceOut(gk)), hd.fh * 1.25, Math.sin(t * 4) * .04, t * 5);
      burstSparkles(c, hd.x, top - 40, 200, seg(t, 5.25, 6.2), 10, 8); confetti(c, t - 5.25, 60, 4); }
    caption(c, this.cap, t);
  } };

/* ===== 8-10. babies and houses ===== */
function neighborhood(c, t) { sky(c, '#8fd3ff', '#e8f7ff'); cloud(c, 300, 150, 100); cloud(c, 1100, 110, 120); cloud(c, 1650, 190, 90);
  for (let i = 0; i < 8; i++) roundTree(c, 60 + i * 270, 740, 220, i % 2 ? '#62b862' : '#4fa555'); ground(c, 740, '#80cc5e', '#6db84f'); }
function babyDrop(c, t, t0, tx, ty, col) { // stork flies in, lets go of the bundle, which lands at (tx,ty)
  const fly = seg(t, t0, t0 + 1.3), rel = t0 + 1.3;
  const sx = lerp(-250, tx - 120, easeOut(fly)), sy = lerp(60, ty - 575, easeOut(fly));
  const leave = seg(t, rel, rel + 1.3), ex = lerp(sx, W + 300, easeIn(leave)), ey = lerp(sy, -150, easeIn(leave));
  if (leave < 1) drawStork(c, t < rel ? sx : ex, t < rel ? sy : ey, 230, t, t < rel ? col : null);
  if (t >= rel) { const k = seg(t, rel, rel + .45), bx = lerp(sx + 184, tx, k), by = lerp(sy + 5, ty, bounceOut(k)); return { x: bx, y: by }; }
  return null; }
function house1(c, t, x, y) {
  const crook = -.05 - .08 * easeOut(seg(t, 2.5, 3.0)), roofSlide = 40 * easeOut(seg(t, 2.5, 3.0));
  c.save(); c.translate(x, y); c.rotate(-.025);
  fillRR(c, -260, -330, 520, 330, 4, '#d8c49a', '#7d6a45', 5);
  c.fillStyle = '#b8a47a'; for (let i = 0; i < 9; i++) c.fillRect(-250 + (i * 97 % 480), -310 + (i * 61 % 280), 50, 16);
  fillRR(c, -180, -250, 120, 100, 4, '#9fd6ff', '#7d6a45', 6); line(c, [-120, -250, -120, -150], '#7d6a45', 6); line(c, [-180, -200, -60, -200], '#7d6a45', 6);
  const rac = backOut(seg(t, 4.1, 4.45)); if (rac > 0) { c.save(); c.beginPath(); c.rect(-176, -246, 112, 92); c.clip(); c.translate(-120, -150 - rac * 70);
    circ(c, -26, -42, 14, '#777'); circ(c, 26, -42, 14, '#777'); ell(c, 0, 0, 52, 44, '#8c8c8c'); ell(c, 0, -4, 46, 16, '#333'); circ(c, -16, -6, 8, '#fff'); circ(c, 16, -6, 8, '#fff'); circ(c, -16, -6, 4, '#000'); circ(c, 16, -6, 4, '#000'); ell(c, 0, 18, 22, 16, '#ddd'); circ(c, 0, 12, 6, '#222'); c.restore(); }
  line(c, [60, -280, 220, -200], '#5d4a2a', 5); line(c, [70, -200, 210, -290], '#5d4a2a', 5); fillRR(c, 60, -290, 160, 100, 2, null, '#7d6a45', 6);
  // door frame, door falls toward us
  fillRR(c, -30, -210, 120, 210, 4, '#3d2b1a'); const df = easeIn(seg(t, 3.3, 3.62)), db = df >= 1 ? bounceOut(seg(t, 3.62, 3.9)) : 0;
  c.save(); c.translate(30, 0); c.scale(1, Math.max(.08, Math.cos(df * PI / 2) - db * 0)); fillRR(c, -60, -210, 120, 210, 4, '#9c5a2c', '#5a3315', 4); circ(c, 35, -105, 7, '#e9c46a'); c.restore();
  if (df >= 1) puff(c, 30, -10, 36 + 30 * seg(t, 3.62, 4.3), 1 - seg(t, 3.62, 4.3));
  c.restore();
  c.save(); c.translate(x + roofSlide, y - 330); c.rotate(crook); poly(c, [-320, 10, 0, -230, 320, 10], '#8a4b3a', '#4a2318', 6);
  c.fillStyle = '#6d3a2b'; for (let i = 0; i < 6; i++) c.fillRect(-200 + i * 60, -60 - (i % 2) * 40, 40, 16); fillRR(c, 150, -170, 50, 110, 2, '#7d6a45'); c.restore();
}
function soldSign(c, x, y, s, rot, lines, big) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); fillRR(c, -10, -300, 20, 300, 3, '#7a5230');
  fillRR(c, -150, -300, 300, 150, 8, '#fff', '#c1121f', 6); text(c, 'SOLD', 0, -258, 62, '#c1121f'); if (lines) text(c, lines, 0, -192, big || 36, '#1d3557'); c.restore(); }
const S8 = { dur: 6.5, trans: 'slide', cap: 'Baby #1! And their very first house... a real fixer-upper.',
  sfx: [[0, 'whoosh'], [1.75, 'pop'], [1.8, 'tada', .12], [2.5, 'creak'], [3.62, 'thud'], [4.12, 'chitter'], [5.25, 'thud', .35]],
  draw(c, t) {
    neighborhood(c, t); house1(c, t, 1270, 860);
    const tip = easeIn(seg(t, 4.9, 5.25)), tb = tip >= 1 ? bounceOut(seg(t, 5.25, 5.55)) * 0 : 0; soldSign(c, 1700, 880, .75, tip * 1.45 + tb, '', 0);
    const P = { x: 560, y: 900, stage: 'adult', face: 'hat', shirt: '#5e60ce', outfit: 'polo', pants: '#3a3a4a', shoes: '#333' };
    const L = Object.assign({}, LEAH, { x: 330, y: 900, H: 735, top: '#ffb4a2', skirt: '#6d597a' });
    const hold = aim(P, 1, 600, 640), hold2 = aim(P, -1, 520, 650);
    const ready = easeOut(seg(t, .8, 1.3));
    drawToon(c, Object.assign(L, { handL: [-.07, .44], handR: aimToon(L, 1, 430, 650), eyes: t > 1.8 ? 'happy' : 'open', mouth: t > 3.3 ? 'o' : 'smile' }));
    const j = drawGuy(c, Object.assign(P, { handR: mixHand([.07, .44], hold, ready), handL: mixHand([-.07, .44], hold2, ready), headDy: t > 1.8 ? Math.sin(t * 8) * 3 : 0 }));
    const b = babyDrop(c, t, .05, 565, 640, '#7fb8ff'); if (b) drawBundle(c, b.x, b.y, 120, '#7fb8ff', -.2);
    void j; banner(c, "IT'S A BOY!", 520, 170, '#4d96ff', 1.75, t);
    caption(c, this.cap, t);
  } };
function house2(c, t, x, y) {
  c.save(); c.translate(x, y); fillRR(c, -280, -300, 560, 300, 4, '#e3d5b8', '#9c8a66', 5); poly(c, [-310, -295, 0, -420, 310, -295], '#8d99ae', '#5c677d', 5);
  fillRR(c, -200, -230, 120, 100, 4, '#bfe3ff', '#fff', 8); fillRR(c, 80, -230, 120, 100, 4, '#bfe3ff', '#fff', 8);
  const sh = easeOut(seg(t, 3.0, 3.4)); c.save(); c.translate(200, -230); c.rotate(sh * .5); fillRR(c, 0, 0, 34, 100, 3, '#6b705c'); c.restore(); fillRR(c, -234, -230, 34, 100, 3, '#6b705c');
  fillRR(c, -50, -190, 100, 190, 4, '#bc6c25', '#6f3d12', 4); circ(c, 30, -95, 6, '#e9c46a');
  c.restore();
  for (let i = 0; i < 12; i++) if (i !== 7) fillRR(c, x - 560 + i * 34, y - 90, 22, 90, 3, '#fff', '#ccc', 2); fillRR(c, x - 570, y - 70, 410, 12, 3, '#fff');
  roundTree(c, x + 380, y, 120, '#9bb57a');
  line(c, [x + 460, y, x + 460, y - 70], '#333', 4); ell(c, x + 470, y - 90, 26, 18, '#ff70a6'); line(c, [x + 486, y - 100, x + 500, y - 125], '#ff70a6', 8);
}
const S9 = { dur: 5, trans: 'pageflip', cap: 'Baby #2! House #2. An upgrade... technically.',
  sfx: [[0, 'whoosh'], [1.32, 'pop'], [1.36, 'tada', .12], [2.4, 'sparkle'], [3.0, 'creak']],
  draw(c, t) {
    neighborhood(c, t); house2(c, t, 1300, 860);
    c.save(); c.translate(1650, 610); c.rotate(.04); fillRR(c, -10, 0, 20, 250, 3, '#7a5230'); fillRR(c, -150, -60, 300, 120, 10, '#fffaf0', '#6b4a2b', 5);
    text(c, 'HOME', -82, -20, 40, '#6b4a2b'); text(c, 'SWEET', 64, -20, 40, '#6b4a2b'); line(c, [8, -16, 122, -26], '#d62828', 7);
    text(c, 'OKAY', 62, -56, 28, '#d62828', { font: FONT2, weight: 700, rot: -.1 }); text(c, 'HOME', 0, 30, 40, '#6b4a2b'); c.restore();
    const meh = seg(t, 2.4, 3.2); burstSparkles(c, 1300, 600, 260, meh, 10, 12); if (meh > .6 && meh < 1) text(c, 'meh.', 1300, 560, 70, '#5c677d', { stroke: '#fff', rot: -.1 });
    const L = Object.assign({}, LEAH, { x: 640, y: 900, H: 735, top: '#ffd166', skirt: '#ef476f' });
    const hold = aimToon(L, 1, 700, 650), hold2 = aimToon(L, -1, 610, 660), r = easeOut(seg(t, .3, .9));
    drawToon(c, Object.assign(L, { handR: mixHand([.07, .44], hold, r), handL: mixHand([-.07, .44], hold2, r), eyes: t > 1.3 ? 'happy' : 'open' }));
    drawToon(c, Object.assign({}, KID1, { x: 430, y: 900 - Math.abs(Math.sin(t * 6)) * 20, H: 300, headFrac: .3, mouth: 'open', handL: [-.25, -.2], handR: [.25, -.2] }));
    drawGuy(c, { x: 240, y: 900, stage: 'adult', face: 'hat', shirt: '#2a9d8f', outfit: 'polo', pants: '#3a3a4a', shoes: '#333', handL: [-.02, .36], handR: [.02, .36], bendL: -.9, bendR: .9 });
    const b = babyDrop(c, t, -.4, 660, 650, '#7fb8ff'); if (b) drawBundle(c, b.x, b.y, 110, '#7fb8ff', .2);
    banner(c, 'ANOTHER BOY!', 560, 170, '#4d96ff', 1.32, t);
    caption(c, this.cap, t);
  } };
const S10 = { dur: 5, trans: 'blinds', cap: 'Baby #3! Still in school. Still in the hat.',
  sfx: [[0, 'snore', 5], [1.05, 'pop'], [1.1, 'tada', .12]],
  draw(c, t) {
    room(c, '#3d4a7a', '#5b4636', c => { windowFrame(c, 1280, 140, 300, 240, c => { sky(c, '#0d1b3d', '#24356b'); circ(c, 1480, 220, 44, '#fbf3c8'); circ(c, 1500, 206, 40, '#13234d');
      for (let i = 0; i < 12; i++) circ(c, 1300 + i * 23, 160 + (i * 53 % 200), 3, '#fff'); });
      fillRR(c, 200, 180, 220, 160, 8, '#2b3560'); text(c, '2 AM', 310, 260, 60, '#ff6b6b'); });
    // kids running laps behind the table
    for (const [k, ph, sz] of [[KID1, 0, 330], [KID2, 2.6, 280]]) { const x = 960 + Math.sin(t * 2.4 + ph) * 520, fl = Math.cos(t * 2.4 + ph) > 0 ? 1 : -1;
      drawToon(c, Object.assign({}, k, { x, y: 780 - Math.abs(Math.sin(t * 9 + ph)) * 16, H: sz, headFrac: .3, mouth: 'open', facing: fl, handL: [-.3, -.25], handR: [.3, -.25], footL: walkPose(t * 3 + ph).footL, footR: walkPose(t * 3 + ph).footR })); }
    const P = { x: 820, y: 960, stage: 'adult', face: 'hat', shirt: '#6c757d', outfit: 'hoodie', pants: '#333', shoes: '#333' };
    const nod = Math.sin(t * 1.4);
    drawGuy(c, Object.assign(P, { headRot: .14 + nod * .06, headDy: 16 + nod * 6, handL: [-.06, .36], handR: [.1, .33] }));
    const hd = guyHead(P);
    fillRR(c, 330, 700, 1100, 40, 8, '#6d4c33'); fillRR(c, 360, 740, 1040, 360, 4, '#7d5a3e');
    fillRR(c, 600, 670, 200, 34, 4, '#fff', '#ccc', 2); fillRR(c, 880, 664, 120, 40, 4, '#e63946'); fillRR(c, 890, 640, 110, 30, 4, '#457b9d');
    // coffee IV
    line(c, [480, 700, 480, 250], '#9aa', 8); line(c, [430, 250, 530, 250], '#9aa', 6); fillRR(c, 440, 260, 80, 120, 16, 'rgba(240,240,255,.9)', '#9aa', 3);
    fillRR(c, 446, 300 + Math.sin(t) * 3, 68, 74, 12, '#6f4518'); text(c, 'COFFEE', 480, 320, 18, '#fff');
    c.beginPath(); c.moveTo(480, 380); c.bezierCurveTo(470, 520, 640, 520, 700, 660); c.strokeStyle = 'rgba(111,69,24,.8)'; c.lineWidth = 6; c.stroke();
    for (let i = 0; i < 3; i++) { const k = (t * .7 + i / 3) % 1; text(c, 'Z', hd.x + 120 + k * 120, hd.y - 120 - k * 160, 40 + k * 40, `rgba(255,255,255,${1 - k})`, { rot: -.2 }); }
    const L = Object.assign({}, LEAH, { x: 1520, y: 960, H: 735, top: '#cdb4db', skirt: '#5e548e', facing: -1 });
    const r = easeOut(seg(t, .7, 1.1));
    drawToon(c, Object.assign(L, { handL: mixHand([-.07, .44], aimToon(L, -1, 1440, 690), r), handR: mixHand([.07, .44], aimToon(L, 1, 1530, 700), r), eyes: t > 1.1 ? 'happy' : 'open' }));
    const b = babyDrop(c, t, -.5, 1480, 690, '#ffafcc'); if (b) drawBundle(c, b.x, b.y, 110, '#ffafcc', -.25);
    banner(c, "IT'S A GIRL!", 960, 160, '#ff70a6', 1.05, t);
    caption(c, this.cap, t);
  } };

/* ===== 11. Dr. Cardiologist ===== */
function hospital(c) { sky(c, '#8ecbff', '#e9f6ff'); cloud(c, 260, 140, 90); cloud(c, 1700, 120, 110);
  fillRR(c, 260, 220, 1400, 560, 6, '#e9edf0', '#b7c0c8', 4); fillRR(c, 220, 200, 1480, 40, 6, '#cfd6dc');
  for (let r = 0; r < 4; r++) for (let q = 0; q < 12; q++) if (!(r > 1 && q > 2 && q < 5)) fillRR(c, 310 + q * 112, 340 + r * 100, 80, 64, 4, '#7fb3d5', '#5b8fb0', 2);
  fillRR(c, 300, 248, 900, 74, 10, '#1d4e89'); text(c, 'FRYE REGIONAL MEDICAL CENTER', 750, 287, 48, '#fff');
  fillRR(c, 1220, 240, 90, 90, 10, '#fff'); c.fillStyle = '#d62839'; c.fillRect(1250, 252, 30, 66); c.fillRect(1232, 270, 66, 30);
  fillRR(c, 610, 560, 280, 30, 6, '#1d4e89'); fillRR(c, 630, 590, 240, 190, 0, '#a7d3ef', '#5b8fb0', 4); line(c, [750, 590, 750, 780], '#5b8fb0', 4);
  ground(c, 780, '#cfcfcf', '#b5b5b5'); c.fillStyle = '#7cc45a'; c.fillRect(0, 780, 400, 40); c.fillRect(1520, 780, 400, 40);
  for (const x of [120, 300, 1620, 1800]) roundTree(c, x, 800, 200, '#4caf50'); }
const S11 = { dur: 6.5, trans: 'iris', cap: DR + ', Cardiologist.',
  sfx: [[.45, 'beep'], [1.05, 'beep'], [1.65, 'beep'], [2.25, 'beep'], [2.6, 'tada', .16], [2.7, 'sparkle']],
  draw(c, t) {
    hospital(c);
    const P = { x: 1400, y: 905, s: 1.12, stage: 'adult', face: 'hat', coat: true, steth: true, shirt: '#7fb3d5', pants: '#3d5a80', shoes: '#222' };
    const th = easeOut(seg(t, 3.0, 3.3));
    drawGuy(c, Object.assign(P, { handL: [-.02, .36], bendL: -.9, handR: mixHand([.07, .44], [.4, -.18], th), thumbR: th > .6, bendR: -.25, headDy: Math.sin(t * 3) * 3 }));
    const dark = 1 - easeOut(seg(t, 2.45, 2.9)); if (dark > 0) { c.fillStyle = `rgba(4,18,14,${.88 * dark})`; c.fillRect(0, 0, W, H);
      c.strokeStyle = `rgba(30,120,80,${.5 * dark})`; c.lineWidth = 1; for (let x = 0; x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } }
    // heartbeat trace
    const sweep = seg(t, .15, 2.45) * W, fade = 1 - seg(t, 2.5, 3.2), y0 = 470;
    if (fade > 0) { const pts = []; for (let x = 0; x <= Math.min(sweep, W); x += 4) { let y = y0; for (const bx of [280, 860, 1440]) { const d = x - bx;
      if (d > -40 && d < 0) y = y0 - 18 * Math.sin((d + 40) / 40 * PI); if (d >= 0 && d < 16) y = y0 + d * 4; if (d >= 16 && d < 40) y = y0 + 64 - (d - 16) * 16; if (d >= 40 && d < 64) y = y0 - 320 + (d - 40) * 18; if (d >= 64 && d < 80) y = y0 + 112 - (d - 64) * 7; if (d > 120 && d < 200) y = y0 - 30 * Math.sin((d - 120) / 80 * PI); }
      if (x > 1700) { const k = (x - 1700) / 200; } pts.push(x, y); }
      c.save(); c.globalAlpha = fade; c.shadowColor = '#3dff9a'; c.shadowBlur = 24; if (pts.length > 3) line(c, pts, '#5dffa8', 7); c.shadowBlur = 0;
      if (sweep < W) circ(c, sweep, pts[pts.length - 1], 10, '#e9fff3'); if (sweep >= 1700) heart(c, 1760, y0 - 10, 70 * backOut(seg(t, 2.05, 2.4)), '#ff4d6d'); c.restore(); }
    burstSparkles(c, 1400, 380, 300, seg(t, 2.6, 3.6), 14, 21);
    caption(c, this.cap, t, { start: 2.7, size: 84, sub: 'Now at Frye Regional Medical Center', bg: '#fffdf2', y: 1045 });
  } };

/* ===== 12. Florida -> North Carolina ===== */
const MAP = { k: 80, ox: 382, oy: 30 };
const ll = (lon, lat) => [MAP.ox + (lon + 90) * MAP.k * .85, MAP.oy + (37.3 - lat) * MAP.k];
const LAND = [[-90, 37.6], [-75.6, 37.6], [-75.9, 36.55], [-75.5, 35.8], [-75.53, 35.25], [-76.5, 34.6], [-77.9, 34.0], [-78.9, 33.7], [-79.9, 32.75], [-81.1, 32.0], [-81.4, 30.3], [-81.0, 29.2], [-80.6, 28.4], [-80.05, 26.7], [-80.15, 25.75], [-80.4, 25.2], [-81.1, 25.1], [-81.8, 26.1], [-82.0, 26.6], [-82.7, 27.7], [-83.0, 29.1], [-84.0, 30.0], [-85.0, 29.6], [-85.7, 30.1], [-87.3, 30.35], [-88.0, 30.4], [-89.6, 30.2], [-90, 30.2]];
const FLA = [[-87.6, 31.0], [-85.0, 31.0], [-84.9, 30.7], [-82.2, 30.55], [-81.5, 30.7], [-81.4, 30.3], [-81.0, 29.2], [-80.6, 28.4], [-80.05, 26.7], [-80.15, 25.75], [-80.4, 25.2], [-81.1, 25.1], [-81.8, 26.1], [-82.0, 26.6], [-82.7, 27.7], [-83.0, 29.1], [-84.0, 30.0], [-85.0, 29.6], [-85.7, 30.1], [-87.3, 30.35], [-87.5, 30.3]];
const NCA = [[-84.3, 35.0], [-83.1, 35.0], [-82.4, 35.2], [-81.0, 35.15], [-80.8, 34.8], [-79.7, 34.8], [-78.55, 33.85], [-77.9, 34.0], [-76.5, 34.6], [-75.53, 35.25], [-75.5, 35.8], [-75.9, 36.55], [-81.7, 36.6], [-82.0, 36.1], [-83.1, 35.5]];
const BORDERS = [[[-85.6, 35.0], [-83.1, 35.0], [-82.3, 34.4], [-81.4, 33.2], [-80.9, 32.05]], [[-85.6, 35.0], [-85.0, 32.3], [-85.0, 31.0]], [[-90, 35.0], [-85.6, 35.0]], [[-83.7, 36.6], [-81.7, 36.6]], [[-88.2, 35.0], [-88.4, 30.4]]];
const ROUTE = [[-81.4, 28.5], [-81.75, 30.2], [-81.45, 31.4], [-81.05, 32.2], [-80.95, 33.0], [-81.05, 34.0], [-81.0, 35.0], [-81.34, 35.73]].map(p => ll(...p));
function routeAt(p) { let tot = 0; const L = []; for (let i = 1; i < ROUTE.length; i++) { const d = Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]); L.push(d); tot += d; }
  let d = p * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const k = clamp(d / L[i]); return { x: lerp(ROUTE[i][0], ROUTE[i + 1][0], k), y: lerp(ROUTE[i][1], ROUTE[i + 1][1], k), dx: ROUTE[i + 1][0] - ROUTE[i][0], dy: ROUTE[i + 1][1] - ROUTE[i][1] }; } d -= L[i]; } }
const polyLL = (c, pts, fill, stroke, lw) => poly(c, pts.flatMap(p => ll(...p)), fill, stroke, lw);
function drawMovingTruck(c, x, y, s, dir, t) { c.save(); c.translate(x, y + Math.sin(t * 20) * 1.5); c.scale(dir * s, s);
  fillRR(c, -60, -70, 90, 60, 6, '#fff', '#555', 3); fillRR(c, -60, -42, 90, 10, 0, '#f77f00'); fillRR(c, 30, -52, 34, 42, 8, '#4d96ff', '#2a5ab0', 3); fillRR(c, 42, -48, 18, 16, 3, '#bfe3ff');
  circ(c, -38, -8, 11, '#222'); circ(c, 44, -8, 11, '#222'); circ(c, -38, -8, 4, '#bbb'); circ(c, 44, -8, 4, '#bbb'); c.restore(); }
function gator(c, x, y, s, t) { c.save(); c.translate(x, y); c.scale(s, s);
  ell(c, 0, 0, 70, 24, '#4c9a2a'); poly(c, [60, -6, 120, 0, 60, 14], '#4c9a2a'); poly(c, [-60, -4, -130, 6, -60, 12], '#4c9a2a');
  for (let i = -3; i <= 3; i++) poly(c, [i * 16 - 6, -20, i * 16, -32, i * 16 + 6, -20], '#3a7d1f');
  circ(c, -50, -18, 10, '#fff'); circ(c, -52, -18, 5, '#000'); line(c, [-128, 8, -80, 12], '#2b5f12', 3);
  c.save(); c.translate(-20, 10); c.rotate(-1.9 + Math.sin(t * 9) * .5); fillRR(c, -5, 0, 10, 44, 5, '#4c9a2a'); circ(c, 0, 46, 8, '#4c9a2a'); c.restore();
  line(c, [-20, 22, -24, 40], '#4c9a2a', 9); line(c, [30, 22, 34, 40], '#4c9a2a', 9); c.restore(); }
const TREES = (() => { const out = [], r = rng(8); for (let i = 0; i < 14; i++) { const p = .05 + i * .068, q = routeAt(p), L = Math.hypot(q.dx, q.dy), side = i % 2 ? 1 : -1;
  out.push({ p, x: q.x - q.dy / L * side * (75 + r() * 25), y: q.y + q.dx / L * side * (75 + r() * 25) + 10 }); } return out; })();
const S12 = { dur: 6, trans: 'pageflip', cap: 'Next stop: North Carolina!', capY: 160, sfx: [[.85, 'honk'], [5.05, 'pop'], [5.1, 'ding']],
  draw(c, t) {
    c.fillStyle = '#7ec8e3'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
    for (let y = 60; y < H; y += 70) for (let x = (y / 70 % 2) * 60; x < W; x += 160) { c.beginPath(); c.arc(x + Math.sin(t + y) * 10, y, 18, PI * 1.1, PI * 1.9); c.stroke(); }
    polyLL(c, LAND, '#f1e3b6', '#c9b27a', 4); polyLL(c, FLA, '#ffcf8b', '#c98b3a', 4); polyLL(c, NCA, '#a8dc8c', '#5c9a3e', 4);
    c.setLineDash([10, 8]); for (const b of BORDERS) line(c, b.flatMap(p => ll(...p)), '#b89c64', 3); c.setLineDash([]);
    text(c, 'FLORIDA', ...ll(-81.6, 28.0), 40, '#a35d14'); text(c, 'GEORGIA', ...ll(-83.6, 32.6), 34, '#a38a52'); text(c, 'SOUTH CAROLINA', ...ll(-80.3, 33.55), 24, '#a38a52');
    text(c, 'NORTH CAROLINA', ...ll(-79.2, 35.7), 40, '#3e7a24'); text(c, 'ATLANTIC OCEAN', 1640, 700, 40, 'rgba(255,255,255,.8)'); text(c, 'Gulf of Mexico', 420, 930, 36, 'rgba(255,255,255,.8)');
    const p = easeIO(seg(t, .9, 5.0)), q = routeAt(p);
    c.setLineDash([16, 12]); line(c, ROUTE.flat(), 'rgba(120,80,40,.35)', 6); c.setLineDash([]);
    const done = []; for (let i = 0; i <= 60; i++) { const r = routeAt(Math.min(p, i / 60)); done.push(r.x, r.y); } line(c, done, '#d62828', 8);
    TREES.forEach((tr, i) => { const north = tr.y < ll(0, 31.3)[1]; const m = north ? backOut(seg(t, .9 + tr.p * 4.1 + .1, .9 + tr.p * 4.1 + .45)) : 0;
      palmTree(c, tr.x, tr.y, 62 * (1 - clamp(m * 1.3)), 1, t + i); pineTree(c, tr.x, tr.y, 60 * m); });
    const g = ll(-81.2, 27.0); gator(c, g[0] - 20, g[1] + 10, .75, t);
    const bub = seg(t, .2, .5) * (1 - seg(t, 3.2, 3.5)); if (bub > 0) { c.save(); c.translate(g[0] - 190, g[1] - 70); c.scale(bub, bub); fillRR(c, -100, -45, 200, 80, 30, '#fff', '#3a2614', 4); poly(c, [40, 30, 90, 70, 70, 30], '#fff'); text(c, "Bye, y'all!", 0, -4, 34, '#3a2614'); c.restore(); }
    const dst = ROUTE[ROUTE.length - 1], pin = backOut(seg(t, 5.0, 5.35));
    if (pin > 0) { c.save(); c.translate(dst[0], dst[1]); c.scale(pin, pin); starPath(c, 0, -10, 38, 16); c.fillStyle = '#ffd23f'; c.fill(); c.strokeStyle = '#3a2614'; c.lineWidth = 4; c.stroke();
      fillRR(c, -70, -110, 140, 56, 14, '#fff8e7', '#3a2614', 4); text(c, 'HOME!', 0, -82, 34, '#d62828'); c.restore(); burstSparkles(c, dst[0], dst[1], 120, seg(t, 5.0, 5.9), 9, 3); }
    drawMovingTruck(c, q.x, q.y, 1.3, q.dx >= 0 ? 1 : -1, t);
    caption(c, this.cap, t, { x: 1500, y: 1040 });
  } };

/* ===== 13. The big NC house ===== */
function bigHouse(c, x, y) {
  c.save(); c.translate(x, y);
  fillRR(c, -560, -380, 1120, 380, 4, '#f4f1ea', '#9a9486', 5); poly(c, [-600, -375, -380, -560, 380, -560, 600, -375], '#4a4e69', '#2e3047', 5);
  poly(c, [-260, -380, 0, -620, 260, -380], '#5c6080', '#2e3047', 5); fillRR(c, -60, -520, 120, 90, 50, '#bfe3ff', '#fff', 8);
  for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) for (let r = 0; r < 2; r++) { fillRR(c, sx * (300 + i * 140) - 50, -340 + r * 160, 100, 110, 4, '#bfe3ff', '#fff', 8); fillRR(c, sx * (300 + i * 140) - 70, -340 + r * 160, 18, 110, 2, '#2e4057'); fillRR(c, sx * (300 + i * 140) + 52, -340 + r * 160, 18, 110, 2, '#2e4057'); }
  fillRR(c, -230, -400, 460, 30, 4, '#e3ded3'); for (let i = 0; i < 4; i++) fillRR(c, -210 + i * 140 - 14, -372, 28, 372, 6, '#fff', '#ccc', 2);
  fillRR(c, -60, -230, 120, 230, 60, '#7a3e1d', '#4a250f', 4); circ(c, 40, -110, 7, '#e9c46a'); fillRR(c, -720, -250, 180, 250, 4, '#ebe6da', '#9a9486', 4); fillRR(c, -700, -200, 140, 200, 3, '#d3cdbf');
  for (let i = 0; i < 4; i++) line(c, [-700, -160 + i * 40, -560, -160 + i * 40], '#bfb8a8', 3);
  c.restore(); }
const S13 = { dur: 5.5, trans: 'wipe', cap: 'Home sweet (BIG) home.', sfx: [[.8, 'thud', .4], [.85, 'chaching'], [2.7, 'tada', .12]],
  draw(c, t) {
    sky(c, '#8fd3ff', '#eaf8ff'); cloud(c, 300, 130, 110); cloud(c, 1500, 100, 140);
    for (let i = 0; i < 14; i++) pineTree(c, -40 + i * 150, 680 + (i % 2) * 14, 300 + (i % 3) * 50);
    ground(c, 680, '#76c35a', '#62ad48'); bigHouse(c, 1060, 690);
    fillRR(c, 960 - 80, 690, 160, 400, 0, '#d9d4c8');
    const k = bounceOut(seg(t, .45, .85)); c.save(); c.translate(0, (1 - k) * -900); soldSign(c, 1700, 900, 1.05, Math.sin(t * 3) * .01 * k, '$1,800,000', 46); c.restore();
    if (k >= 1) puff(c, 1700, 900, 40 + 40 * seg(t, .85, 1.6), 1 - seg(t, .85, 1.6));
    const walk = easeOut(seg(t, .2, 2.6)), off = (1 - walk) * -900, wp = walkPose(t * 1.7), mv = walk < 1;
    const hop = i => t > 2.7 ? Math.abs(Math.sin(t * 8 + i)) * 26 : 0;
    const kids = [[KID1, 1020, 640, 0], [KID2, 1160, 585, 1], [KID3, 1290, 510, 2]];
    drawToon(c, Object.assign({}, LEAH, { x: 820 + off, y: 960, H: 735 * .92, top: '#90be6d', skirt: '#277da1', facing: 1, footL: mv ? wp.footL : [0, 0], footR: mv ? wp.footR : [0, 0], eyes: t > 2.7 ? 'happy' : 'open', mouth: t > 2.7 ? 'open' : 'smile' }));
    kids.forEach(([k, x, h, i]) => drawToon(c, Object.assign({}, k, { x: x + off, y: 960 - hop(i), H: h * .92, headFrac: .22, mouth: t > 2.7 ? 'open' : 'smile', footL: mv ? wp.footL : [0, 0], footR: mv ? wp.footR : [0, 0], handL: t > 2.7 ? [-.25, -.3] : [-.07, .44], handR: t > 2.7 ? [.25, -.3] : [.07, .44] })));
    const ch = easeOut(seg(t, 2.7, 3.0));
    drawGuy(c, { x: 600 + off, y: 960, stage: 'adult', s: .92, face: 'hat', shirt: '#577590', outfit: 'vest', vest: '#33473b', pants: '#4a5568', shoes: '#5a3d2b',
      footL: mv ? wp.footL : [0, 0], footR: mv ? wp.footR : [0, 0], handL: mixHand([-.07, .44], [-.28, -.5], ch), handR: mixHand([.07, .44], [.28, -.5], ch), headDy: mv ? -wp.bob : 0 });
    if (t > 2.7) confetti(c, t - 2.7, 70, 5);
    caption(c, this.cap, t);
  } };

/* ===== 14. Rolling in it ===== */
function sportsCar(c, x, y, t, spin) { c.save(); c.translate(x, y);
  c.beginPath(); c.moveTo(-260, -40); c.quadraticCurveTo(-250, -95, -150, -105); c.lineTo(-40, -110); c.quadraticCurveTo(30, -175, 120, -165); c.quadraticCurveTo(200, -150, 240, -105); c.quadraticCurveTo(280, -95, 280, -40); c.closePath();
  c.fillStyle = '#d62828'; c.fill(); c.strokeStyle = '#7a1010'; c.lineWidth = 4; c.stroke();
  poly(c, [-10, -112, 60, -160, 130, -158, 180, -110], '#aee0ff', '#7a1010', 3); fillRR(c, 210, -150, 70, 14, 4, '#222'); line(c, [240, -136, 250, -108], '#222', 6);
  line(c, [-250, -70, 270, -70], 'rgba(255,255,255,.5)', 5); ell(c, -255, -60, 12, 8, '#fff6b3'); ell(c, 275, -62, 10, 8, '#ff6b6b');
  for (const wx of [-160, 170]) { circ(c, wx, -32, 42, '#1d1d1d'); c.save(); c.translate(wx, -32); c.rotate(spin); for (let i = 0; i < 5; i++) { c.rotate(TAU / 5); fillRR(c, -4, 0, 8, 26, 3, '#ccc'); } c.restore(); circ(c, wx, -32, 8, '#eee'); }
  c.restore(); }
const S14 = { dur: 6.5, trans: 'spin', cap: 'A few years later... cardiology pays.',
  sfx: [[.2, 'chaching'], [2.45, 'boing'], [3.15, 'splash'], [3.38, 'pop'], [3.7, 'whoosh'], [4.05, 'rev'], [4.75, 'screech'], [4.9, 'whoosh']],
  draw(c, t) {
    const part2 = t >= 3.85;
    if (!part2) {
      sky(c, '#7fcbff', '#e8f7ff'); for (let i = 0; i < 12; i++) pineTree(c, -40 + i * 170, 620, 260 + (i % 3) * 40);
      fillRR(c, -20, 380, 640, 300, 0, '#f4f1ea'); for (let i = 0; i < 3; i++) fillRR(c, 40 + i * 190, 440, 130, 120, 4, '#bfe3ff', '#fff', 8);
      ground(c, 680, '#d7c9ad', '#c4b597'); fillRR(c, 860, 740, 980, 200, 30, '#2f9e44', '#e9e3d3', 18);
      c.save(); rr(c, 870, 750, 960, 180, 24); c.clip(); const r = rng(2); for (let i = 0; i < 140; i++) bill(c, 870 + r() * 960, 760 + r() * 170 + Math.sin(t * 3 + i) * 4, 30, r() * 3); c.restore();
      fillRR(c, 820, 720, 70, 20, 6, '#e9e3d3'); line(c, [880, 720, 880, 640], '#bbb', 6);
      const jump = seg(t, 2.45, 3.15), run = easeIn(seg(t, 1.9, 2.45));
      let x = lerp(480, 820, run), y = 900; const tuck = easeOut(seg(t, 2.5, 2.7));
      if (jump > 0) { x = lerp(820, 1290, jump); y = lerp(900, 880, jump) - Math.sin(jump * PI) * 330; }
      const P = { x: 0, y: 0, stage: 'adult', face: 'hat', shirt: '#f28482', outfit: 'polo', belly: .5, wide: 1.1, pants: '#c9b28a', shorts: true, shoes: '#fff' };
      const yay = t < 1.9;
      if (jump < 1) { c.save(); c.translate(x, y); if (jump > 0) { c.translate(0, -300); c.rotate(jump * TAU * .9); c.translate(0, 300); }
        drawGuy(c, Object.assign(P, { handL: yay ? [-.3, -.55 + Math.sin(t * 8) * .05] : mixHand([-.1, .3], [.15, .2], tuck), handR: yay ? [.3, -.55 + Math.cos(t * 8) * .05] : mixHand([.1, .3], [-.05, .25], tuck),
          footL: jump > 0 ? [.1 * tuck, -.3 * tuck] : run > 0 ? walkPose(t * 3).footL : [0, 0], footR: jump > 0 ? [.15 * tuck, -.28 * tuck] : run > 0 ? walkPose(t * 3).footR : [0, 0], headDy: yay ? Math.sin(t * 8) * 5 : 0 })); c.restore(); }
      const sp = seg(t, 3.15, 3.85); if (sp > 0) { const r2 = rng(4); for (let i = 0; i < 40; i++) { const a = -PI / 2 + (r2() - .5) * 2.2, v = 400 + r2() * 600; bill(c, 1290 + Math.cos(a) * v * sp, 820 + Math.sin(a) * v * sp + 900 * sp * sp, 28, r2() * 6 + sp * 9); } }
      if (t > 3.3) { const k = backOut(seg(t, 3.3, 3.55)); c.save(); c.beginPath(); c.rect(0, 0, W, 830); c.clip(); drawFace(c, 'hat', 1290, 830 - 70 * k + Math.sin(t * 6) * 4, 150); c.restore(); }
      // money rain
      const r3 = rng(77); for (let i = 0; i < 70; i++) { const st = r3() * 2.2, x0 = r3() * W, sp2 = 260 + r3() * 220, yy = -60 + (t - st) * sp2; if (t < st || yy > 1100) continue;
        bill(c, x0 + Math.sin(t * 2 + i) * 40, yy, 26, Math.sin(t * 3 + i) * 1.2); }
      if (t > 3.6) { const k = seg(t, 3.6, 3.85); c.fillStyle = `rgba(255,255,255,${k * .9})`; for (let i = 0; i < 30; i++) c.fillRect(0, (i * 97) % H, W, 6 + k * 30); }
    } else {
      const lt = t - 3.85;
      sky(c, '#7fcbff', '#e8f7ff'); for (let i = 0; i < 12; i++) pineTree(c, -40 + i * 170, 640, 260 + (i % 3) * 40);
      fillRR(c, 1300, 360, 620, 300, 0, '#f4f1ea'); fillRR(c, 1380, 440, 420, 220, 6, '#d3cdbf'); ground(c, 660, '#76c35a', '#62ad48');
      c.fillStyle = '#9a9a9a'; c.fillRect(-20, 760, W + 40, 220);
      const go = easeIn(seg(lt, 1.0, 1.75)), cx = 820 + go * 1700, shake = lt < 1 ? Math.sin(lt * 80) * 3 : 0;
      if (lt > .9) { c.fillStyle = 'rgba(20,20,20,.7)'; c.fillRect(820 - 160 - 40, 930, cx - 820 + 40, 14); c.fillRect(820 + 170 - 40, 930, cx - 820 + 40, 14); }
      sportsCar(c, cx, 950 + shake, t, lt * (lt < 1 ? 25 : 60));
      if (go < .3) drawFace(c, 'hat', cx + 60, 950 - 165 + shake, 110, -.05);
      for (let i = 0; i < 8; i++) { const k = ((lt * 1.5 + i / 8) % 1); if (lt > .2 && lt < 2.2) puff(c, 820 - 200 - k * 300 + go * 400, 920 - k * 120, 30 + k * 50, (1 - k) * .8); }
      const r4 = rng(9); if (go > 0) for (let i = 0; i < 20; i++) { const k = clamp(go * 1.4 - r4() * .4); if (k > 0) bill(c, cx - 300 - k * 600 + r4() * 200, 800 - Math.sin(k * PI) * 260 + r4() * 60, 24, k * 8 + i); }
      comic(c, 'VROOOM!', 1150, 640, 60, seg(lt, .95, 2.2), -.08, '#ffd23f');
    }
    caption(c, this.cap, t, { start: .3 });
  } };

/* ===== 15. The hat avalanche ===== */
const PILE = (() => { const r = rng(42), out = [], cols = [HAT, HAT, '#1f3b5c', '#c9b28a', '#6c757d', '#8b2635', '#2a6f97', '#e9c46a', '#5e548e', '#344e41'];
  for (let hh = 0; hh < 780; hh += 40) { const span = 560 * Math.sqrt(Math.max(0, 1 - hh / 780)); for (let x = -span; x <= span; x += 78) out.push({ x: 640 + x + (r() - .5) * 30, y: 885 - hh - r() * 20, rot: (r() - .5) * 1.2, col: cols[(r() * cols.length) | 0], w: 105 + r() * 25, sx: 920 + r() * 360, sy: 260 + r() * 520 }); }
  out.forEach((h, i) => { h.t = 1.1 + (i / out.length) * 2.0 + r() * .25; }); return out; })();
const S15 = { dur: 9.5, trans: null, cap: 'And he lived happily ever after.',
  sfx: [[.55, 'creak'], [1.1, 'rumble', 2.3], [3.55, 'pop'], [3.6, 'sparkle'], [6.1, 'ding'], [7.0, 'tada', .2], [7.05, 'sparkle']],
  draw(c, t) {
    const pan = easeIO(seg(t, 4.7, 6.1)), cy = lerp(540, -40, pan);
    c.save(); camera(c, 960, cy, 1);
    c.fillStyle = '#f0e3cc'; c.fillRect(-200, -1200, W + 400, 2400); c.fillStyle = 'rgba(255,255,255,.3)'; for (let x = 0; x < W; x += 90) c.fillRect(x, -1200, 40, 2400);
    c.fillStyle = '#b0875a'; c.fillRect(-200, 885, W + 400, 400); c.fillStyle = '#d9c7a6'; c.fillRect(-200, 870, W + 400, 18);
    // high shelf with the retired box
    fillRR(c, 820, -190, 560, 26, 6, '#8a5a2b'); fillRR(c, 860, -164, 20, 60, 4, '#6e4520'); fillRR(c, 1320, -164, 20, 60, 4, '#6e4520');
    retiredBox(c, 1080, -190, 1); drawCap(c, 900, -190, 90, -.1, '#6c757d'); drawCap(c, 1260, -190, 90, .1, '#8b2635');
    const glowA = .5 + .5 * Math.sin(t * 4); sparkle(c, 1150, -300, 26 * glowA, seg(t, 5.6, 6.0), t); sparkle(c, 1005, -250, 18 * (1 - glowA), seg(t, 5.6, 6.0), -t); sparkle(c, 1170, -215, 14 * glowA, seg(t, 5.8, 6.2), t * 2);
    // closet
    fillRR(c, 800, 140, 600, 745, 6, '#5b4636'); fillRR(c, 830, 170, 540, 715, 4, '#2d2420');
    for (let s = 0; s < 4; s++) { fillRR(c, 840, 300 + s * 150, 520, 14, 3, '#6e5545'); if (t < 1.4) for (let i = 0; i < 5; i++) drawCap(c, 890 + i * 105, 300 + s * 150, 95, 0, PILE[(s * 5 + i) * 3 % PILE.length].col); }
    const open = easeIO(seg(t, .5, 1.0)); c.save(); c.translate(1370, 0); c.scale(Math.max(.06, 1 - open * .94), 1); fillRR(c, -540, 170, 540, 715, 4, '#e8d8be', '#a68a62', 4);
    fillRR(c, -500, 210, 460, 290, 6, null, '#c4ad87', 4); fillRR(c, -500, 540, 460, 300, 6, null, '#c4ad87', 4); circ(c, -480, 520, 14, '#c9a43a'); c.restore();
    // him
    const walk = easeIO(seg(t, 0, .5)), buried = t > 1.2;
    const P = { x: lerp(470, 640, walk), y: 885, stage: 'adult', face: 'hat', shirt: '#e07a5f', outfit: 'vest', vest: '#1f3b5c', pants: '#4a5568', shoes: '#5a3d2b' };
    const scared = easeOut(seg(t, 1.0, 1.3));
    if (t < 3.6) drawGuy(c, Object.assign(P, { handR: mixHand(mixHand([.07, .44], aim(P, 1, 830, 520), easeIO(seg(t, .3, .55)) * (1 - easeIO(seg(t, .9, 1.1)))), [.35, -.6], scared), handL: mixHand([-.07, .44], [-.35, -.6], scared), headDy: buried ? Math.sin(t * 30) * 4 : 0 }));
    // avalanche
    PILE.forEach(h => { const k = seg(t, h.t - .5, h.t); if (k <= 0) return; const x = lerp(h.sx, h.x, k), y = lerp(h.sy, h.y, k) - Math.sin(k * PI) * 160;
      drawCap(c, x, y, h.w, h.rot * k + (1 - k) * 4 * (h.x % 3), h.col); });
    if (t > 3.5) { const k = backOut(seg(t, 3.5, 3.85)); c.save(); c.translate(640, 140 + (1 - k) * 120); c.scale(k, k); drawFace(c, 'hat', 0, 0, 150, Math.sin(t * 3) * .06); c.restore();
      for (const [dx, r] of [[-90, -.3], [0, .1], [95, .35]]) drawCap(c, 640 + dx, 250, 125, r, PILE[(dx + 100) % 7].col); burstSparkles(c, 640, 120, 170, seg(t, 3.55, 4.4), 10, 2); }
    c.restore();
    caption(c, this.cap, t, { start: .4, end: 6.6 });
    // end card
    const e = seg(t, 6.75, 7.2); if (e > 0) {
      c.save(); c.globalAlpha = e; const g = c.createRadialGradient(960, 520, 80, 960, 540, 1100); g.addColorStop(0, '#fff8e7'); g.addColorStop(1, '#f3c98b'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#3a2614'; c.lineWidth = 10; rr(c, 50, 50, W - 100, H - 100, 30); c.stroke(); c.lineWidth = 3; rr(c, 72, 72, W - 144, H - 144, 22); c.stroke();
      for (let i = 0; i < 12; i++) sparkle(c, 960 + Math.cos(i / 12 * TAU + t * .4) * 720, 520 + Math.sin(i / 12 * TAU + t * .4) * 360, 16 + 8 * Math.sin(t * 4 + i), 1, t);
      c.restore();
      const k = backOut(seg(t, 7.0, 7.5)); if (k > 0) { c.save(); c.translate(960, 470); c.scale(k, k); c.rotate(-.03); text(c, 'THE END.', 0, 0, 230, '#d62839', { stroke: '#3a2614', sw: 18, shadow: 'rgba(0,0,0,.25)' }); c.restore(); }
      const k2 = seg(t, 7.5, 7.9); if (k2 > 0) { c.save(); c.globalAlpha = k2; text(c, 'Starring ' + DR + '  ·  and The Hat', 960, 690, 54, '#3a2614', { font: FONT2, weight: 600 }); c.restore(); }
      const k3 = backOut(seg(t, 7.3, 7.7)); if (k3 > 0) { c.save(); c.translate(960, 215); c.scale(k3, k3); drawFace(c, 'hat', 0, 0, 120, Math.sin(t * 2) * .05); c.restore(); }
    }
  } };

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15];
