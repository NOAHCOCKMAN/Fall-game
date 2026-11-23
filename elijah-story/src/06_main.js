// ---------- timeline, transitions, subtitles, playback ----------
const TR = 0.8;
const TLS = TL.scenes, TOTAL = TL.total; window.STORY_DURATION = TOTAL;
SCENES.forEach((s, i) => { if (s.id !== TLS[i].id) throw new Error('scene order mismatch: ' + s.id + ' vs ' + TLS[i].id); });
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const offA = document.createElement('canvas'), offB = document.createElement('canvas'); offA.width = offB.width = W; offA.height = offB.height = H;
const cA = offA.getContext('2d'), cB = offB.getContext('2d');

function subtitles(c, sc, t) {
  let cur = null; for (const l of sc.lines) { if (l.song || l.who === 'choir' || t < l.t || t > l.t + l.d + .25) continue; if (!cur || l.t > cur.t) cur = l; }
  for (const l of cur ? [cur] : []) {
    c.save(); c.font = `600 44px ${FONT2}`; const words = l.text.split(' '), lines = []; let cur = '';
    for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (c.measureText(tr).width > 1500 && cur) { lines.push(cur); cur = w; } else cur = tr; } lines.push(cur);
    const n = lines.length; lines.forEach((s, i) => { const y = 1040 - (n - 1 - i) * 54; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.85)'; c.lineWidth = 9; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.strokeText(s, W / 2, y); c.fillStyle = l.who === 'N' ? '#ffffff' : '#ffe27a'; c.fillText(s, W / 2, y); }); c.restore(); } }
function chapter(c, i, t) { if (i === 0) return; const k = seg(t, .3, .8) * (1 - seg(t, 3.2, 3.7)); if (k <= 0) return; const sc = TLS[i];
  c.save(); c.globalAlpha = k; c.translate(-(1 - easeOut(seg(t, .3, .8))) * 300, 0); fillRR(c, 40, 40, 20 + Math.max(380, sc.title.length * 26), 120, 16, 'rgba(20,10,20,.78)');
  text(c, 'CHAPTER ' + (i + 1), 70, 78, 28, '#ffd23f', { align: 'left' }); text(c, sc.title.toUpperCase(), 70, 122, 38, '#fff', { align: 'left' }); c.restore(); }
function drawScene(c, i, lt) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const t = clamp(lt, 0, TLS[i].dur + TR); CUR.sc = TLS[i]; CUR.t = t; c.save(); SCENES[i].draw(c, t); c.restore(); c.filter = 'none';
  subtitles(c, TLS[i], t); chapter(c, i, t); c.restore(); }
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


function renderAt(T) { T = clamp(T, 0, TOTAL - 1e-3); let i = 0; while (i < TLS.length - 1 && T >= TLS[i + 1].start) i++;
  const lt = T - TLS[i].start;
  if (i < TLS.length - 1 && T > TLS[i + 1].start - TR / 2) return transitionAt(i, T);
  if (i > 0 && lt < TR / 2) return transitionAt(i - 1, T);
  drawScene(ctx, i, lt); }
function transitionAt(i, T) { const b = TLS[i + 1].start, p = (T - (b - TR / 2)) / TR;
  drawScene(cA, i, T - TLS[i].start); drawScene(cB, i + 1, Math.max(0, T - b));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); transition(ctx, TRANS[i] || 'wipe', clamp(p), offA, offB); ctx.restore(); }
window.renderAt = renderAt;

// ---------- sound plan (absolute times) ----------
function rt(sc, x) { if (typeof x === 'number') return x; if (Array.isArray(x)) return rt(sc, x[0]) + x[1]; if (x === 'end') return sc.dur;
  const end = x.endsWith('>'), k = end ? x.slice(0, -1) : x, c = sc.cues[k]; if (!c) { console.warn('missing cue', sc.id, k); return 0; } return c[0] + (end ? c[1] : 0); }
const PLAN = { music: [], sfx: [], duck: [] };
SCENES.forEach((s, i) => { const sc = TLS[i], o = sc.start;
  for (const [style, a, b, lvl, opt] of s.music || []) { const t0 = o + rt(sc, a), t1 = o + rt(sc, b) + (typeof b === 'string' && b.endsWith('>') ? .4 : 0); if (t1 > t0 + .05) PLAN.music.push(Object.assign({ style, t0, t1, level: lvl == null ? .9 : lvl }, opt || {})); }
  for (const [at, name, arg] of s.sfx || []) PLAN.sfx.push([o + rt(sc, at), name, arg]);
  if (i < TLS.length - 1) PLAN.sfx.push([TLS[i + 1].start - .35, TRANS[i] === 'pageflip' ? 'page' : 'whoosh']);
  for (const l of sc.lines) if (!l.song) PLAN.duck.push([o + l.t, o + l.t + l.d]); });

function schedule(ac, out, w0, w1, state) {   // schedule everything that starts in [w0, w1); ac time = T + state.off
  const A = state.A || (state.A = makeSynth(ac, out)), toAc = T => T + state.off;
  const extra = { bell: t => { [[N('C6'), .18], [N('G6'), .08], [N('C7'), .05]].forEach(([f, v]) => { const g = A.gain(out, 0); A.env(g, t, .003, v, 2.2); A.osc('sine', f, t, 2.3, g); A.osc('sine', f * 2.76, t, .6, A.gain(g, .3)); }); },
    chirp: t => { for (let i = 0; i < 3; i++) { const g = A.gain(out, 0); A.env(g, t + i * .12, .005, .05, .08); const o = A.osc('sine', 3200, t + i * .12, .1, g); o.frequency.exponentialRampToValueAtTime(4400, t + i * .12 + .07); } },
    stampF: t => { A.fx.thud(t, .5); A.fx.camera(t); }, harp: t => A.harpGliss(out, t, 'C5', true) };
  if (!state.bus) { state.bus = A.gain(out, 1); const g = state.bus.gain; g.setValueAtTime(1, Math.max(0, toAc(w0)));
    for (const [a, b] of PLAN.duck) { if (b < w0) continue; g.setTargetAtTime(.34, Math.max(0, toAc(a - .08)), .05); g.setTargetAtTime(1, Math.max(0, toAc(b + .1)), .12); }
    state.segs = PLAN.music.map(s => null); }
  PLAN.music.forEach((s, k) => { if (s.t1 <= w0 || s.t0 >= w1) return; let g = state.segs[k];
    if (!g) { g = state.segs[k] = A.gain(state.bus, 0); const a = Math.max(s.t0, w0); g.gain.setValueAtTime(0, Math.max(0, toAc(a))); g.gain.linearRampToValueAtTime(s.level, Math.max(0, toAc(a)) + .15);
      g.gain.setValueAtTime(s.level, Math.max(0, toAc(s.t1 - .25))); g.gain.linearRampToValueAtTime(0, Math.max(0, toAc(s.t1))); }
    const shifted = Object.assign({}, s, { t0: toAc(s.t0), t1: toAc(s.t1) }); MUSIC[s.style](A, g, shifted, toAc(w0), toAc(w1)); });
  for (const [T, name, arg] of PLAN.sfx) { if (T < w0 || T >= w1) continue; const f = A.fx[name] || extra[name]; if (f) f(Math.max(0, toAc(T)), arg); else console.warn('no sfx', name); }
}
window.renderMusicWav = async () => { const sr = 44100, ac = new OfflineAudioContext(1, Math.ceil(sr * (TOTAL + 1)), sr);
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(ac.destination); const out = ac.createGain(); out.gain.value = .9; out.connect(comp);
  schedule(ac, out, -1, TOTAL + 1, { off: 0 }); const buf = await ac.startRendering(); const ch = buf.getChannelData(0), n = ch.length, dv = new DataView(new ArrayBuffer(44 + n * 2));
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); }; ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, n * 2, true); for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, clamp(ch[i], -1, 1) * 32767, true);
  const bytes = new Uint8Array(dv.buffer); let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };

// ---------- live player ----------
const EXPORT = /[?&]export=1/.test(location.search);
let t0 = performance.now(), ac = null, live = null, voiceBuf = null, ended = false, paused = false, pausedAt = 0;
function clock() { return live ? ac.currentTime - live.off : paused ? pausedAt : (performance.now() - t0) / 1000; }
function stopSound() { if (live) { try { live.out.disconnect(); } catch (e) { } if (live.src) try { live.src.stop(); } catch (e) { } clearInterval(live.timer); live = null; } }
async function startSound(from) { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); await ac.resume();
    if (!voiceBuf) { const b64 = window.STORY_VOICE, bin = atob(b64.split(',')[1]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); voiceBuf = await ac.decodeAudioData(u.buffer); }
    stopSound(); const st = ac.currentTime + .12, out = ac.createGain(); out.gain.value = .9; const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; out.connect(comp); comp.connect(ac.destination);
    const vg = ac.createGain(); vg.gain.value = 1.15; vg.connect(ac.destination); const src = ac.createBufferSource(); src.buffer = voiceBuf; src.connect(vg); src.start(st, from);
    live = { off: st - from, out, src, state: { off: st - from }, next: from }; live.state.off = live.off;
    const pump = () => { if (!live) return; const now = ac.currentTime - live.off; while (live.next < now + 3 && live.next < TOTAL + 1) { schedule(ac, out, live.next, live.next + 1, live.state); live.next += 1; } };
    pump(); live.timer = setInterval(pump, 400); } catch (e) { console.warn(e); } }
function restart() { ended = false; paused = false; t0 = performance.now(); if (live) startSound(0); }
function loop() { const T = clock(); if (T >= TOTAL) { renderAt(TOTAL); if (!ended) { ended = true; document.getElementById('replay').classList.add('show'); stopSound(); paused = true; pausedAt = TOTAL; } }
  else { renderAt(T); document.getElementById('replay').classList.remove('show'); }
  document.getElementById('bar').style.width = (clamp(T / TOTAL) * 100) + '%'; requestAnimationFrame(loop); }
async function boot() {
  await Promise.all(Object.keys(FACES).map(k => new Promise(res => { const im = new Image(); im.onload = res; im.onerror = res; im.src = FACES[k].src; IMG[k] = im; })));
  try { await Promise.all([document.fonts.load('60px Lilita'), document.fonts.load('600 40px Fredoka')]); } catch (e) { }
  window.STORY_READY = true; if (EXPORT) { document.body.classList.add('export'); renderAt(0); return; }
  const fit = () => { const s = Math.min(innerWidth / W, innerHeight / H); cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px'; }; addEventListener('resize', fit); fit();
  const snd = document.getElementById('sound');
  const on = () => { const T = clock(); paused = false; startSound(Math.min(T, TOTAL)); snd.textContent = '🔊 Sound on'; };
  snd.onclick = e => { e.stopPropagation(); if (live) { const T = clock(); stopSound(); t0 = performance.now() - T * 1000; snd.textContent = '🔇 Sound off'; } else on(); };
  document.getElementById('restart').onclick = e => { e.stopPropagation(); if (!live) on(); restart(); }; document.getElementById('replay').onclick = e => { e.stopPropagation(); if (!live) on(); restart(); };
  addEventListener('pointerdown', function once(e) { removeEventListener('pointerdown', once); if (!live && e.target.tagName !== 'BUTTON') on(); });
  t0 = performance.now(); loop(); }
boot();
