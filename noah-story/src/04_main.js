// ---------- timeline, transitions, playback ----------
const TR = 0.8; // transition length (centred on each scene boundary)
const START = []; let TOTAL = 0; SCENES.forEach(s => { START.push(TOTAL); TOTAL += s.dur; });
window.STORY_DURATION = TOTAL;

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const offA = document.createElement('canvas'), offB = document.createElement('canvas');
offA.width = offB.width = W; offA.height = offB.height = H;
const cA = offA.getContext('2d'), cB = offB.getContext('2d');

function drawScene(c, i, lt) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  SCENES[i].draw(c, clamp(lt, 0, SCENES[i].dur + TR)); c.restore(); }

function transition(c, type, p, A, B) {
  const e = easeIO(p);
  if (type === 'wipe') { c.drawImage(A, 0, 0); const x = e * (W + 120) - 60; c.save(); c.beginPath(); c.rect(0, 0, x, H); c.clip(); c.drawImage(B, 0, 0); c.restore();
    c.fillStyle = '#ffd23f'; c.fillRect(x - 30, 0, 30, H); c.fillStyle = '#ff4d6d'; c.fillRect(x, 0, 18, H); }
  else if (type === 'pageflip') { c.drawImage(B, 0, 0); const th = e * PI / 2, n = 48, sw = W / n;
    for (let i = 0; i < n; i++) { const x0 = i * sw, z = x0 * Math.sin(th), f = 1400 / (1400 + z * .9), dx = x0 * Math.cos(th) * f, dx2 = (x0 + sw) * Math.cos(th) * (1400 / (1400 + (x0 + sw) * Math.sin(th) * .9));
      const hh = H * f; c.drawImage(A, x0, 0, sw, H, dx, (H - hh) / 2, Math.max(1, dx2 - dx + 1), hh); }
    const xe = W * Math.cos(th) * (1400 / (1400 + W * Math.sin(th) * .9)); const g = c.createLinearGradient(0, 0, xe, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${.45 * e})`);
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(xe, (H - H * 1400 / (1400 + W * Math.sin(th) * .9)) / 2); c.lineTo(xe, (H + H * 1400 / (1400 + W * Math.sin(th) * .9)) / 2); c.lineTo(0, H); c.fill();
    const sg = c.createLinearGradient(xe, 0, xe + 80, 0); sg.addColorStop(0, `rgba(0,0,0,${.35 * (1 - e)})`); sg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sg; c.fillRect(xe, 0, 80, H); }
  else if (type === 'iris') { const R = Math.hypot(W, H) / 2; if (p < .5) { const r = R * (1 - easeIn(p * 2)); c.drawImage(A, 0, 0); c.save(); c.fillStyle = '#000'; c.beginPath(); c.rect(0, 0, W, H); c.arc(W / 2, H / 2, r, 0, TAU, true); c.fill(); c.restore(); }
    else { const r = R * easeOut((p - .5) * 2); c.drawImage(B, 0, 0); c.save(); c.fillStyle = '#000'; c.beginPath(); c.rect(0, 0, W, H); c.arc(W / 2, H / 2, r, 0, TAU, true); c.fill(); c.restore(); } }
  else if (type === 'star' || type === 'heart') { c.drawImage(A, 0, 0); const s = easeIn(p) * 1500; c.save();
    if (type === 'star') starPath(c, W / 2, H / 2, s, s * .5, 5, -PI / 2 + p); else heartPath(c, W / 2, H / 2 + s * .2, s * .9);
    c.clip(); c.drawImage(B, 0, 0); c.restore(); c.save(); if (type === 'star') starPath(c, W / 2, H / 2, s, s * .5, 5, -PI / 2 + p); else heartPath(c, W / 2, H / 2 + s * .2, s * .9);
    c.strokeStyle = type === 'star' ? '#ffd23f' : '#ff4d6d'; c.lineWidth = 16; c.stroke(); c.restore(); }
  else if (type === 'slide') { c.drawImage(A, -e * W, 0); c.drawImage(B, W - e * W, 0); c.fillStyle = '#3a2614'; c.fillRect(W - e * W - 10, 0, 20, H); }
  else if (type === 'diag') { c.drawImage(A, 0, 0); const x = e * (W + H + 200) - 100; c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(x, 0); c.lineTo(x - H, H); c.lineTo(0, H); c.closePath(); c.clip(); c.drawImage(B, 0, 0); c.restore();
    line(c, [x, 0, x - H, H], '#ffd23f', 34); line(c, [x + 30, 0, x - H + 30, H], '#4d96ff', 14); }
  else if (type === 'blinds') { c.drawImage(A, 0, 0); const n = 9, bh = H / n; c.save(); c.beginPath(); for (let i = 0; i < n; i++) { const k = clamp(e * 1.6 - i * .06); c.rect(0, i * bh, W, bh * k); } c.clip(); c.drawImage(B, 0, 0); c.restore(); }
  else if (type === 'spin') { c.fillStyle = '#fff8e7'; c.fillRect(0, 0, W, H);
    if (p < .5) { const k = easeIn(p * 2); c.save(); c.translate(W / 2, H / 2); c.rotate(k * PI); c.scale(1 - k, 1 - k); c.drawImage(A, -W / 2, -H / 2); c.restore(); }
    else { const k = easeOut((p - .5) * 2); c.save(); c.translate(W / 2, H / 2); c.rotate((1 - k) * -PI); c.scale(k, k); c.drawImage(B, -W / 2, -H / 2); c.restore(); } }
  else { c.globalAlpha = 1; c.drawImage(A, 0, 0); c.globalAlpha = e; c.drawImage(B, 0, 0); c.globalAlpha = 1; }
}

function renderAt(T) {
  T = clamp(T, 0, TOTAL - 1e-3);
  let i = 0; while (i < SCENES.length - 1 && T >= START[i + 1]) i++;
  const lt = T - START[i];
  // inside a transition window?
  if (i < SCENES.length - 1 && T > START[i + 1] - TR / 2) { transitionAt(i, T); return; }
  if (i > 0 && lt < TR / 2) { transitionAt(i - 1, T); return; }
  drawScene(ctx, i, lt);
}
function transitionAt(i, T) { const b = START[i + 1], p = (T - (b - TR / 2)) / TR;
  drawScene(cA, i, T - START[i]); drawScene(cB, i + 1, Math.max(0, T - b));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); transition(ctx, SCENES[i].trans || 'wipe', clamp(p), offA, offB); ctx.restore(); }

// ---------- sound score ----------
function soundEvents() { const ev = []; SCENES.forEach((s, i) => { (s.sfx || []).forEach(e => ev.push([START[i] + e[0], e[1], e[2]]));
  if (i < SCENES.length - 1) ev.push([START[i + 1] - .3, SCENES[i].trans === 'pageflip' ? 'page' : 'whoosh']); }); return ev; }
function musicLevels() { const S = START, v = .85; return [[0, v], [S[1] + .78, v], [S[1] + .8, 0], [S[1] + 6.55, 0], [S[1] + 6.75, v], [S[5] + .5, v], [S[5] + 1.0, .12], [S[5] + 4.2, .12], [S[5] + 4.6, v],
  [S[10], v], [S[10] + .2, .3], [S[10] + 2.4, .3], [S[10] + 2.8, v], [S[14] + 6.6, v], [S[14] + 7.0, 0], [TOTAL, 0]]; }
function scheduleSound(ac, dest, from, acStart) {
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(dest);
  const master = ac.createGain(); master.gain.value = .9; master.connect(comp);
  const A = makeAudio(ac, master), toAc = T => acStart + (T - from);
  A.music(buildScore(TOTAL, musicLevels()), from, toAc);
  for (const [T, name, arg] of soundEvents()) if (T >= from - .02 && A[name]) A[name](toAc(Math.max(T, from)), arg);
  return master; }
window.renderAudioWav = async () => { const sr = 44100, ac = new OfflineAudioContext(1, Math.ceil(sr * TOTAL), sr);
  scheduleSound(ac, ac.destination, 0, 0); const buf = await ac.startRendering(); const bytes = wavFromBuffer(buf);
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };

// ---------- player ----------
const EXPORT = /[?&]export=1/.test(location.search);
let t0 = performance.now(), ac = null, master = null, soundOn = false, ended = false;
function now() { return ac && soundOn ? ac.currentTime - acOffset : (performance.now() - t0) / 1000; }
let acOffset = 0;
function startSound(from) { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); ac.resume();
  if (master) { try { master.disconnect(); } catch (e) { } } const st = ac.currentTime + .08; acOffset = st - from; master = scheduleSound(ac, ac.destination, from, st); soundOn = true; } catch (e) { console.warn(e); } }
function stopSound() { if (master) { try { master.disconnect(); } catch (e) { } master = null; } }
function restart() { ended = false; t0 = performance.now(); if (soundOn) { stopSound(); startSound(0); } }
window.renderAt = renderAt;

function loop() { const T = now(); if (T >= TOTAL) { renderAt(TOTAL); if (!ended) { ended = true; document.getElementById('replay').classList.add('show'); } }
  else { renderAt(T); document.getElementById('replay').classList.remove('show'); }
  document.getElementById('bar').style.width = (clamp(T / TOTAL) * 100) + '%'; requestAnimationFrame(loop); }

async function boot() {
  await Promise.all(['nohat', 'hat'].map(k => new Promise(res => { const im = new Image(); im.onload = res; im.onerror = res; im.src = FACES[k].src; IMG[k] = im; })));
  try { await Promise.all([document.fonts.load('60px Lilita'), document.fonts.load('600 40px Fredoka')]); } catch (e) { }
  window.STORY_READY = true;
  if (EXPORT) { document.body.classList.add('export'); renderAt(0); return; }
  const fit = () => { const s = Math.min(innerWidth / W, innerHeight / H); cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px'; }; addEventListener('resize', fit); fit();
  const snd = document.getElementById('sound');
  snd.onclick = () => { if (soundOn) { stopSound(); soundOn = false; t0 = performance.now() - (ac.currentTime - acOffset) * 1000; snd.textContent = '🔇 Sound off'; }
    else { const T = (performance.now() - t0) / 1000; startSound(Math.min(T, TOTAL)); snd.textContent = '🔊 Sound on'; } };
  document.getElementById('restart').onclick = restart; document.getElementById('replay').onclick = restart;
  // try sound right away; browsers usually wait for a click, so the first click anywhere turns it on
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'running') { startSound(0); snd.textContent = '🔊 Sound on'; } } catch (e) { }
  addEventListener('pointerdown', function once(e) { removeEventListener('pointerdown', once); if (!soundOn && e.target.id !== 'sound') { startSound(Math.min((performance.now() - t0) / 1000, TOTAL)); snd.textContent = '🔊 Sound on'; } });
  t0 = performance.now(); loop();
}
boot();
