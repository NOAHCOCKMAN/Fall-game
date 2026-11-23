// ---------- synthesized soundtrack (same score plays live and renders offline for the MP4) ----------
const NOTE = (() => { const m = {}, names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let o = 1; o < 8; o++) names.forEach((n, i) => m[n + o] = 440 * Math.pow(2, (o * 12 + i - 57) / 12)); return m; })();

function makeAudio(ac, out) {
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = nb.getChannelData(0);
  const r = rng(99); for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
  const A = {};
  const env = (g, t, a, peak, dec, sus = 0.0001, hold = 0) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
    if (hold) g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + hold + dec); };
  const osc = (type, f, t, dur, dest) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(dest); o.start(t); o.stop(t + dur + .05); return o; };
  const gain = (dest, v = 1) => { const g = ac.createGain(); g.gain.value = v; g.connect(dest); return g; };
  const noise = (t, dur, dest, rate = 1) => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.playbackRate.value = rate; s.connect(dest); s.start(t, (t * 7.31) % 1); s.stop(t + dur + .05); return s; };
  const filt = (type, f, dest, q = 1) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };

  // instruments
  A.pluck = (t, f, v = .18, dur = .35, dest = out) => { const g = gain(dest, 0); env(g, t, .004, v, dur); const lp = filt('lowpass', 2600, g);
    osc('triangle', f, t, dur + .1, lp); osc('square', f * 2, t, dur * .3, gain(lp, .06)); };
  A.glock = (t, f, v = .14, dest = out) => { const g = gain(dest, 0); env(g, t, .002, v, .9); osc('sine', f, t, 1, g); osc('sine', f * 4.01, t, .3, gain(g, .25)); };
  A.bass = (t, f, v = .3, dur = .3, dest = out) => { const g = gain(dest, 0); env(g, t, .006, v, dur); const lp = filt('lowpass', 600, g); osc('triangle', f, t, dur + .1, lp); osc('sine', f, t, dur + .1, lp); };
  A.kick = (t, v = .5, dest = out) => { const g = gain(dest, 0); env(g, t, .002, v, .22); const o = osc('sine', 140, t, .3, g); o.frequency.exponentialRampToValueAtTime(42, t + .18); };
  A.snare = (t, v = .12, dest = out) => { const g = gain(dest, 0); env(g, t, .002, v, .14); noise(t, .2, filt('highpass', 1600, g)); };
  A.hat = (t, v = .04, dest = out) => { const g = gain(dest, 0); env(g, t, .001, v, .04); noise(t, .06, filt('highpass', 7000, g)); };

  // sound effects
  A.ding = t => { [[1568, .22], [2349, .12], [3136, .07]].forEach(([f, v]) => { const g = gain(out, 0); env(g, t, .003, v, 1.6); osc('sine', f, t, 1.7, g); });
    [2637, 3136, 3951, 5274].forEach((f, i) => A.glock(t + .05 + i * .045, f, .05)); };
  A.sparkle = t => [2093, 2637, 3136, 4186, 5274].forEach((f, i) => A.glock(t + i * .05, f, .07));
  A.pop = t => { const g = gain(out, 0); env(g, t, .002, .3, .12); const o = osc('sine', 320, t, .15, g); o.frequency.exponentialRampToValueAtTime(950, t + .08); };
  A.boing = t => { const g = gain(out, 0); env(g, t, .005, .25, .5); const o = osc('triangle', 220, t, .6, g); o.frequency.linearRampToValueAtTime(520, t + .12);
    const l = osc('sine', 18, t, .6, gain(o.frequency, 40)); void l; };
  A.whoosh = (t, dur = .45) => { const g = gain(out, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.16, t + dur * .5); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const b = filt('bandpass', 400, g, 1.2); b.frequency.setValueAtTime(400, t); b.frequency.exponentialRampToValueAtTime(3000, t + dur); noise(t, dur, b); };
  A.page = t => { for (let i = 0; i < 3; i++) { const g = gain(out, 0); env(g, t + i * .07, .004, .1 - i * .02, .09); noise(t + i * .07, .12, filt('bandpass', 2500 + i * 900, g, .7)); } };
  A.scratch = t => { const g = gain(out, 0); env(g, t, .005, .35, .45); const b = filt('bandpass', 2000, g, 3);
    b.frequency.setValueAtTime(3500, t); b.frequency.exponentialRampToValueAtTime(300, t + .18); b.frequency.exponentialRampToValueAtTime(1800, t + .32); noise(t, .5, b);
    const o = osc('sawtooth', 600, t, .4, gain(g, .25)); o.frequency.exponentialRampToValueAtTime(80, t + .35); };
  A.drone = (t, dur) => { const g = gain(out, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.06, t + .8); g.gain.setValueAtTime(.06, t + dur - .3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const lp = filt('lowpass', 300, g); osc('sine', 55, t, dur, lp); osc('triangle', 82.4, t, dur, gain(lp, .4)); const tr = osc('sine', .7, t, dur, gain(lp.frequency, 120)); void tr;
    for (let k = .4; k < dur - .3; k += 1.15) { A.kick(t + k, .16, out); A.kick(t + k + .22, .1, out); } };
  A.thud = (t, v = .45) => { const g = gain(out, 0); env(g, t, .002, v, .35); const o = osc('sine', 110, t, .4, g); o.frequency.exponentialRampToValueAtTime(38, t + .3);
    const g2 = gain(out, 0); env(g2, t, .002, v * .4, .25); noise(t, .3, filt('lowpass', 600, g2)); };
  A.tap = t => A.thud(t, .18);
  A.clink = t => { const g = gain(out, 0); env(g, t, .001, .1, .25); osc('sine', 2600, t, .3, g); osc('sine', 3900, t, .2, gain(g, .4)); };
  A.slap = t => { const g = gain(out, 0); env(g, t, .001, .5, .12); noise(t, .15, filt('bandpass', 1800, g, .8)); A.thud(t, .25); };
  A.backfire = t => { const g = gain(out, 0); env(g, t, .001, .6, .3); noise(t, .35, filt('lowpass', 900, g)); A.thud(t, .5); };
  A.creak = t => { const g = gain(out, 0); env(g, t, .05, .12, .6, .0001, .2); const b = filt('bandpass', 900, g, 6);
    const o = osc('sawtooth', 160, t, .9, b); o.frequency.linearRampToValueAtTime(120, t + .8); const l = osc('sine', 23, t, .9, gain(o.frequency, 25)); void l; };
  A.chitter = t => { for (let i = 0; i < 6; i++) { const g = gain(out, 0); env(g, t + i * .07, .002, .08, .05); const o = osc('square', 1800 + (i % 2) * 500, t + i * .07, .07, filt('bandpass', 2200, g, 2)); void o; } };
  A.click = t => { for (const k of [0, .07]) { const g = gain(out, 0); env(g, t + k, .001, .3, .03); noise(t + k, .05, filt('highpass', 3000, g)); } };
  A.choir = (t, dur) => { const g = gain(out, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.34, t + .9); g.gain.setValueAtTime(.34, t + dur - .8); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const f1 = filt('bandpass', 750, g, 4), f2 = filt('bandpass', 1150, gain(g, .7), 5), mix = gain(f1, 1); mix.connect(f2);
    ['C4', 'E4', 'G4', 'C5', 'E5', 'G3'].forEach((n, i) => { const o = osc('sawtooth', NOTE[n], t, dur, gain(mix, .5)); o.detune.value = (i - 2.5) * 5;
      osc('sine', 5 + i * .3, t, dur, gain(o.frequency, NOTE[n] * .006)); });
    for (let k = 0; k < 4; k++) A.sparkle(t + .8 + k * .7); };
  A.tada = (t, v = .16) => ['C4', 'E4', 'G4', 'C5'].forEach((n, i) => { const g = gain(out, 0); env(g, t + i * .02, .01, v, 1.4, .0001, .25);
    const lp = filt('lowpass', 2400, g); osc('sawtooth', NOTE[n], t, 1.8, lp); osc('sawtooth', NOTE[n] * 1.005, t, 1.8, lp); });
  A.beep = t => { const g = gain(out, 0); env(g, t, .002, .16, .12, .0001, .08); osc('sine', 1046, t, .25, g); };
  A.heartbeat = t => { A.thud(t, .3); A.thud(t + .2, .22); };
  A.chaching = t => { A.click(t); [[2637, .14], [3520, .12], [5274, .06]].forEach(([f, v], i) => { const g = gain(out, 0); env(g, t + .08 + i * .03, .002, v, .9); osc('sine', f, t + .08, 1, g); osc('square', f * 1.5, t + .08, .05, gain(g, .1)); }); };
  A.splash = t => { const g = gain(out, 0); env(g, t, .005, .45, 1.1); const b = filt('lowpass', 4000, g); b.frequency.setValueAtTime(5000, t); b.frequency.exponentialRampToValueAtTime(400, t + 1); noise(t, 1.2, b);
    for (let i = 0; i < 8; i++) A.glock(t + .1 + i * .09, 600 + i * 140, .03); };
  A.rev = t => { const g = gain(out, 0); env(g, t, .05, .22, 1.2, .0001, .4); const lp = filt('lowpass', 900, g);
    const o = osc('sawtooth', 55, t, 1.7, lp); o.frequency.linearRampToValueAtTime(160, t + .45); o.frequency.linearRampToValueAtTime(110, t + .8); o.frequency.linearRampToValueAtTime(200, t + 1.5);
    const o2 = osc('square', 56, t, 1.7, gain(lp, .4)); o2.frequency.linearRampToValueAtTime(162, t + .45); o2.frequency.linearRampToValueAtTime(205, t + 1.5); };
  A.screech = t => { const g = gain(out, 0); env(g, t, .02, .1, .9, .0001, .3); const b = filt('bandpass', 2300, g, 8); noise(t, 1.3, b);
    const o = osc('sine', 2100, t, 1.2, gain(g, .25)); osc('sine', 13, t, 1.2, gain(o.frequency, 120)); };
  A.honk = t => { for (const k of [0, .3]) { const g = gain(out, 0); env(g, t + k, .01, .1, .18, .0001, .1); const lp = filt('lowpass', 1500, g); osc('square', 349, t + k, .3, lp); osc('square', 440, t + k, .3, lp); } };
  A.rumble = (t, dur) => { const g = gain(out, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.4, t + .3); g.gain.linearRampToValueAtTime(0.0001, t + dur); noise(t, dur, filt('lowpass', 250, g));
    for (let k = 0; k < dur; k += .13) A.tap(t + k + (k * 7 % .05)); };
  A.tear = t => { const g = gain(out, 0); env(g, t, .003, .08, .12); noise(t, .15, filt('highpass', 2500, g)); };
  A.mower = (t, dur) => { const g = gain(out, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.07, t + .2); g.gain.setValueAtTime(.07, t + dur - .3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const lp = filt('lowpass', 700, g); osc('sawtooth', 68, t, dur, lp); osc('sawtooth', 102, t, dur, gain(lp, .5)); };
  A.snore = (t, dur) => { for (let k = 0; k < dur; k += 1.4) { const g = gain(out, 0); g.gain.setValueAtTime(0.0001, t + k); g.gain.linearRampToValueAtTime(.08, t + k + .5); g.gain.linearRampToValueAtTime(0.0001, t + k + .9);
    noise(t + k, 1, filt('bandpass', 380, g, 3)); } };
  A.music = (score, from, toAc) => {
    const mg = gain(out, 0); A.musicGain = mg; // volume automation
    const L = score.levels; let v0 = L[0][1];
    for (let i = 0; i < L.length - 1; i++) if (from >= L[i][0] && from < L[i + 1][0]) v0 = lerp(L[i][1], L[i + 1][1], (from - L[i][0]) / (L[i + 1][0] - L[i][0]));
    if (from >= L[L.length - 1][0]) v0 = L[L.length - 1][1];
    mg.gain.setValueAtTime(v0, toAc(from)); for (const [T, v] of L) if (T > from) mg.gain.linearRampToValueAtTime(v, toAc(T));
    for (const n of score.notes) { if (n[0] < from - .01) continue; const t = toAc(n[0]);
      if (n[1] === 'bass') A.bass(t, n[2], .24, n[3], mg); else if (n[1] === 'pluck') A.pluck(t, n[2], .085, .28, mg);
      else if (n[1] === 'mel') A.glock(t, n[2], .12, mg); else if (n[1] === 'kick') A.kick(t, .3, mg); else if (n[1] === 'snare') A.snare(t, .07, mg); else if (n[1] === 'hat') A.hat(t, .025, mg); }
  };
  return A;
}

// the tune: bouncy C-major, 118 bpm, 16-bar loop
function buildScore(total, levels) {
  const bpm = 118, b = 60 / bpm, notes = [];
  const CH = { C: ['C2', ['C4', 'E4', 'G4']], Am: ['A1', ['A3', 'C4', 'E4']], F: ['F1', ['F3', 'A3', 'C4']], G: ['G1', ['G3', 'B3', 'D4']], Em: ['E2', ['E3', 'G3', 'B3']], Dm: ['D2', ['D3', 'F3', 'A3']] };
  const prog = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'C'];
  const mel = [[['E5', 1], ['G5', .5], ['E5', .5], ['C5', 1], ['D5', 1]], [['E5', 1], ['C5', 1], ['A4', 2]], [['F5', 1], ['A5', .5], ['F5', .5], ['C5', 1], ['D5', 1]], [['D5', 1], ['B4', 1], ['G4', 1], [null, 1]],
    [['E5', .5], ['F5', .5], ['G5', 1], ['C6', 1], ['G5', 1]], [['A5', 1], ['G5', .5], ['E5', .5], ['C5', 2]], [['F5', 1], ['E5', 1], ['D5', 1], ['C5', 1]], [['D5', 1], ['E5', .5], ['D5', .5], ['B4', 1], ['G4', 1]]];
  const fifth = f => f * 1.5;
  for (let bar = 0; bar * 4 * b < total; bar++) {
    const t0 = bar * 4 * b, ch = CH[prog[bar % 16]], root = NOTE[ch[0]];
    notes.push([t0, 'bass', root * 2, b * .9], [t0 + b, 'bass', fifth(root), b * .6], [t0 + 2 * b, 'bass', root * 2, b * .9], [t0 + 3 * b, 'bass', fifth(root), b * .6]);
    for (let k = 0; k < 4; k++) { notes.push([t0 + k * b, k % 2 ? 'snare' : 'kick']); notes.push([t0 + k * b + b / 2, 'hat']);
      if (k % 2) ch[1].forEach((n, i) => notes.push([t0 + k * b + i * .012, 'pluck', NOTE[n]])); else ch[1].forEach((n, i) => notes.push([t0 + k * b + b / 2 + i * .012, 'pluck', NOTE[n]])); }
    if (bar % 16 < 8 && (bar >> 4) % 2 === 0) { let tt = t0; for (const [n, d] of mel[bar % 8]) { if (n) notes.push([tt, 'mel', NOTE[n]]); tt += d * b; } }
    else if (bar % 16 >= 8) { ch[1].concat([ch[1][0].replace(/\d/, m => +m + 1)]).forEach((n, i) => notes.push([t0 + (i + 4) * b / 2, 'mel', NOTE[n] * 2])); }
  }
  return { notes: notes.filter(n => n[0] < total), levels };
}

function wavFromBuffer(buf) { // mono 16-bit
  const ch = buf.getChannelData(0), n = ch.length, out = new DataView(new ArrayBuffer(44 + n * 2));
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); ws(36, 'data'); out.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, clamp(ch[i], -1, 1) * 32767, true);
  return new Uint8Array(out.buffer); }
