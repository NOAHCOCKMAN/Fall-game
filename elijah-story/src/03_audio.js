// ---------- synthesized score + sound effects (same code plays live and renders offline for the MP4) ----------
const NOTE = (() => { const m = {}, names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let o = 0; o < 9; o++) names.forEach((n, i) => m[n + o] = 440 * Math.pow(2, (o * 12 + i - 57) / 12));
  m.Bb = m['A#']; for (let o = 0; o < 9; o++) { m['Bb' + o] = m['A#' + o]; m['Eb' + o] = m['D#' + o]; m['Ab' + o] = m['G#' + o]; m['Db' + o] = m['C#' + o]; m['Gb' + o] = m['F#' + o]; } return m; })();
const N = n => NOTE[n];

function makeSynth(ac, out) {
  const len = ac.sampleRate * 2, nb = ac.createBuffer(1, len, ac.sampleRate), d = nb.getChannelData(0), r = rng(99);
  for (let i = 0; i < len; i++) d[i] = r() * 2 - 1;
  const curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 4); }
  const A = { ac };
  const env = (g, t, a, peak, dec, hold = 0) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); if (hold) g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + dec); };
  const osc = (type, f, t, dur, dest, det = 0) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = det; o.connect(dest); o.start(t); o.stop(t + dur + .05); return o; };
  const gain = (dest, v = 1) => { const g = ac.createGain(); g.gain.value = v; g.connect(dest); return g; };
  const noise = (t, dur, dest, rate = 1) => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.playbackRate.value = rate; s.connect(dest); s.start(t, (t * 7.31) % 1.5); s.stop(t + dur + .05); return s; };
  const filt = (type, f, dest, q = 1) => { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };
  A.gain = gain; A.filt = filt; A.osc = osc; A.noise = noise; A.env = env;

  // ---- instruments (dest = a bus) ----
  A.pluck = (d, t, f, v = .14, dur = .35) => { const g = gain(d, 0); env(g, t, .004, v, dur); const lp = filt('lowpass', 2800, g); osc('triangle', f, t, dur + .1, lp); osc('square', f * 2, t, dur * .3, gain(lp, .05)); };
  A.twang = (d, t, f, v = .13, dur = .5) => { const g = gain(d, 0); env(g, t, .003, v, dur); const bp = filt('bandpass', 1400, g, 1.5); const o = osc('sawtooth', f * .97, t, dur + .1, bp); o.frequency.linearRampToValueAtTime(f, t + .06); osc('square', f, t, dur * .4, gain(bp, .3)); };
  A.glock = (d, t, f, v = .1) => { const g = gain(d, 0); env(g, t, .002, v, 1); osc('sine', f, t, 1.1, g); osc('sine', f * 4.01, t, .3, gain(g, .25)); };
  A.bass = (d, t, f, v = .25, dur = .3) => { const g = gain(d, 0); env(g, t, .006, v, dur); const lp = filt('lowpass', 520, g); osc('triangle', f, t, dur + .1, lp); osc('sine', f, t, dur + .1, lp); };
  A.tuba = (d, t, f, v = .25, dur = .25) => { const g = gain(d, 0); env(g, t, .02, v, dur); const lp = filt('lowpass', 700, g, 2); osc('sawtooth', f, t, dur + .1, lp); };
  A.kick = (d, t, v = .45) => { const g = gain(d, 0); env(g, t, .002, v, .22); const o = osc('sine', 140, t, .3, g); o.frequency.exponentialRampToValueAtTime(42, t + .18); };
  A.snare = (d, t, v = .1) => { const g = gain(d, 0); env(g, t, .002, v, .14); noise(t, .2, filt('highpass', 1600, g)); };
  A.hat = (d, t, v = .035) => { const g = gain(d, 0); env(g, t, .001, v, .04); noise(t, .06, filt('highpass', 7000, g)); };
  A.clap = (d, t, v = .12) => { for (const k of [0, .012, .024]) { const g = gain(d, 0); env(g, t + k, .001, v, .07); noise(t + k, .1, filt('bandpass', 1200, g, .8)); } };
  A.tamb = (d, t, v = .05) => { const g = gain(d, 0); env(g, t, .001, v, .12); noise(t, .14, filt('highpass', 6000, g)); };
  A.organ = (d, t, notes, dur, v = .05) => { const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .03); g.gain.setValueAtTime(v, t + dur - .05); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const trem = gain(g.gain, v * .25); osc('sine', 6, t, dur, trem); for (const f of notes) for (const [h, a] of [[1, 1], [2, .6], [3, .35], [4, .25], [8, .1]]) osc('sine', f * h, t, dur, gain(g, a)); };
  A.pad = (d, t, notes, dur, v = .04, att = .6, cut = 1800) => { const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + att); g.gain.setValueAtTime(v, t + Math.max(att, dur - .4)); g.gain.linearRampToValueAtTime(0.0001, t + dur + .3);
    const lp = filt('lowpass', cut, g); for (const f of notes) for (const det of [-9, 7]) osc('sawtooth', f, t, dur + .4, lp, det); };
  A.choirPad = (d, t, notes, dur, v = .05) => { const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .5); g.gain.setValueAtTime(v, t + dur - .3); g.gain.linearRampToValueAtTime(0.0001, t + dur + .3);
    const f1 = filt('bandpass', 750, g, 4), f2 = filt('bandpass', 1150, g, 5), mix = gain(f1, 1); mix.connect(f2);
    notes.forEach((n, i) => { const o = osc('sawtooth', n, t, dur + .4, gain(mix, .5), (i - 1.5) * 6); osc('sine', 5 + i * .3, t, dur + .4, gain(o.frequency, n * .006)); }); };
  A.brass = (d, t, notes, dur, v = .06) => { const g = gain(d, 0); env(g, t, .04, v, dur * .8, dur * .25); const lp = filt('lowpass', 600, g, 2); lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(2600, t + .08); lp.frequency.linearRampToValueAtTime(1400, t + dur);
    for (const f of notes) { osc('sawtooth', f, t, dur + .2, lp, -5); osc('sawtooth', f, t, dur + .2, lp, 5); } };
  A.piano = (d, t, f, v = .12, dur = 1.6) => { const g = gain(d, 0); env(g, t, .003, v, dur); const lp = filt('lowpass', 3500, g); osc('triangle', f, t, dur + .1, lp); osc('sine', f * 2, t, dur * .6, gain(lp, .3)); osc('sine', f * 3, t, .2, gain(lp, .12)); };
  A.violin = (d, t, f, dur, v = .06) => { const g = gain(d, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .15); g.gain.setValueAtTime(v, t + dur - .15); g.gain.linearRampToValueAtTime(0.0001, t + dur + .1);
    const bp = filt('bandpass', f * 2.5, g, .8); const o = osc('sawtooth', f, t, dur + .2, bp); osc('sine', 5.5, t + .2, dur, gain(o.frequency, f * .012)); };
  A.calliope = (d, t, f, v = .07, dur = .18) => { const g = gain(d, 0); env(g, t, .006, v, dur, dur * .4); const o = osc('square', f, t, dur * 1.6, filt('lowpass', 3000, g)); osc('sine', 7, t, dur * 1.6, gain(o.frequency, f * .01)); osc('sine', f * 2, t, dur, gain(g, .3)); };
  A.guitar = (d, t, notes, dur, v = .07) => { const g = gain(d, 0); env(g, t, .005, v, dur, dur * .3); const ws = ac.createWaveShaper(); ws.curve = curve; const lp = filt('lowpass', 2400, g); ws.connect(lp);
    for (const f of notes) { osc('sawtooth', f, t, dur + .1, ws, -6); osc('sawtooth', f, t, dur + .1, ws, 6); } };
  A.timpani = (d, t, f, v = .35) => { const g = gain(d, 0); env(g, t, .004, v, 1.2); const o = osc('sine', f * 1.05, t, 1.3, g); o.frequency.exponentialRampToValueAtTime(f, t + .1); const g2 = gain(d, 0); env(g2, t, .002, v * .3, .2); noise(t, .25, filt('lowpass', 400, g2)); };
  A.roll = (d, t, dur, v = .08) => { for (let k = 0; k < dur; k += .05) A.snare(d, t + k, v * (.4 + .6 * k / dur)); };
  A.harpGliss = (d, t, base = 'C4', up = true) => { const sc = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; sc.forEach((s, i) => A.glock(d, t + i * .045, N(base) * Math.pow(2, (up ? s : 24 - s) / 12), .06)); };

  // ---- one-shot sound effects (to the main bus) ----
  const fx = A.fx = {};
  const o_ = out;
  fx.ding = t => { [[1568, .2], [2349, .1], [3136, .06]].forEach(([f, v]) => { const g = gain(o_, 0); env(g, t, .003, v, 1.6); osc('sine', f, t, 1.7, g); }); };
  fx.sparkle = t => [2093, 2637, 3136, 4186, 5274].forEach((f, i) => A.glock(o_, t + i * .05, f, .07));
  fx.pop = t => { const g = gain(o_, 0); env(g, t, .002, .3, .12); const o = osc('sine', 320, t, .15, g); o.frequency.exponentialRampToValueAtTime(950, t + .08); };
  fx.boing = t => { const g = gain(o_, 0); env(g, t, .005, .22, .5); const o = osc('triangle', 220, t, .6, g); o.frequency.linearRampToValueAtTime(520, t + .12); osc('sine', 18, t, .6, gain(o.frequency, 40)); };
  fx.whoosh = (t, dur = .45) => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.15, t + dur * .5); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const b = filt('bandpass', 400, g, 1.2); b.frequency.setValueAtTime(400, t); b.frequency.exponentialRampToValueAtTime(3000, t + dur); noise(t, dur, b); };
  fx.page = t => { for (let i = 0; i < 3; i++) { const g = gain(o_, 0); env(g, t + i * .07, .004, .09 - i * .02, .09); noise(t + i * .07, .12, filt('bandpass', 2500 + i * 900, g, .7)); } };
  fx.scratch = t => { const g = gain(o_, 0); env(g, t, .005, .4, .45); const b = filt('bandpass', 2000, g, 3);
    b.frequency.setValueAtTime(3500, t); b.frequency.exponentialRampToValueAtTime(300, t + .18); b.frequency.exponentialRampToValueAtTime(1800, t + .32); noise(t, .5, b);
    const o = osc('sawtooth', 600, t, .4, gain(g, .25)); o.frequency.exponentialRampToValueAtTime(80, t + .35); };
  fx.thud = (t, v = .45) => { const g = gain(o_, 0); env(g, t, .002, v, .35); const o = osc('sine', 110, t, .4, g); o.frequency.exponentialRampToValueAtTime(38, t + .3); const g2 = gain(o_, 0); env(g2, t, .002, v * .4, .25); noise(t, .3, filt('lowpass', 600, g2)); };
  fx.thunder = t => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.7, t + .05); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6); noise(t, 2.7, filt('lowpass', 300, g)); fx.thud(t, .6); };
  fx.boom = t => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.9, t + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2); noise(t, 2.3, filt('lowpass', 500, g)); const o = osc('sine', 80, t, 1.5, gain(o_, .6)); o.frequency.exponentialRampToValueAtTime(25, t + 1.2); };
  fx.rumble = (t, dur = 2) => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.45, t + .3); g.gain.linearRampToValueAtTime(0.0001, t + dur); noise(t, dur, filt('lowpass', 160, g)); };
  // THE slap: always exactly this sound
  fx.slap = t => { const g = gain(o_, 0); env(g, t, .0008, .95, .09); noise(t, .12, filt('bandpass', 2600, g, .9)); const g2 = gain(o_, 0); env(g2, t, .001, .5, .16); noise(t, .2, filt('lowpass', 900, g2));
    const o = osc('sine', 260, t, .2, gain(o_, .3)); o.frequency.exponentialRampToValueAtTime(70, t + .15); const w = gain(o_, 0); w.gain.setValueAtTime(0.0001, t - .14); w.gain.linearRampToValueAtTime(.12, t - .02); w.gain.linearRampToValueAtTime(0.0001, t);
    const bp = filt('bandpass', 1200, w, 2); bp.frequency.setValueAtTime(600, t - .14); bp.frequency.exponentialRampToValueAtTime(4000, t); noise(t - .14, .15, bp); };
  fx.pianoKey = t => A.piano(o_, t, N('C3'), .35, 3);
  fx.trombone = t => { [N('Bb3'), N('A3'), N('Ab3'), N('G3')].forEach((f, i) => { const g = gain(o_, 0); env(g, t + i * .45, .05, .14, i === 3 ? 1.4 : .4, i === 3 ? .6 : 0); const o = osc('sawtooth', f, t + i * .45, 2, filt('lowpass', 900, g, 3)); if (i === 3) osc('sine', 6, t + 1.5, 1.5, gain(o.frequency, 8)); }); };
  fx.shatter = t => { for (let i = 0; i < 14; i++) { const g = gain(o_, 0); env(g, t + i * .03, .001, .12, .25); osc('sine', 2000 + (i * 733 % 3000), t + i * .03, .3, g); } const g = gain(o_, 0); env(g, t, .001, .3, .4); noise(t, .4, filt('highpass', 3000, g)); };
  fx.camera = t => { for (const k of [0, .07]) { const g = gain(o_, 0); env(g, t + k, .001, .3, .03); noise(t + k, .05, filt('highpass', 3000, g)); } fx.whoosh(t + .05, .3); };
  fx.twig = t => { const g = gain(o_, 0); env(g, t, .001, .4, .06); noise(t, .08, filt('bandpass', 1500, g, 2)); };
  fx.crickets = (t, dur) => { for (let k = 0; k < dur; k += .45) for (let i = 0; i < 4; i++) { const g = gain(o_, 0); env(g, t + k + i * .035, .002, .02, .02); osc('sine', 4300 + (k * 97 % 300), t + k + i * .035, .04, g); } };
  fx.owl = t => { for (const [k, d] of [[0, .3], [.5, .6]]) { const g = gain(o_, 0); env(g, t + k, .06, .1, d); const o = osc('sine', 420, t + k, d + .1, filt('lowpass', 900, g)); o.frequency.linearRampToValueAtTime(380, t + k + d); } };
  fx.steam = (t, dur = 1.2) => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.12, t + .1); g.gain.linearRampToValueAtTime(0.0001, t + dur); noise(t, dur, filt('highpass', 4000, g)); };
  fx.zap = t => { const g = gain(o_, 0); env(g, t, .002, .2, .3); const o = osc('sawtooth', 1200, t, .35, filt('lowpass', 3000, g)); o.frequency.exponentialRampToValueAtTime(100, t + .3); };
  fx.flyby = t => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.25, t + .35); g.gain.linearRampToValueAtTime(0.0001, t + .9); const b = filt('bandpass', 300, g, 1); b.frequency.setValueAtTime(300, t); b.frequency.exponentialRampToValueAtTime(2500, t + .4); b.frequency.exponentialRampToValueAtTime(400, t + .9); noise(t, 1, b); };
  fx.fire = (t, dur = 2) => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.18, t + .3); g.gain.linearRampToValueAtTime(0.0001, t + dur); noise(t, dur, filt('bandpass', 800, g, .5)); for (let k = 0; k < dur; k += .13) { const c = gain(o_, 0); env(c, t + k, .001, .08, .03); noise(t + k, .04, filt('highpass', 2000, c)); } };
  fx.tumbleweed = t => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.12, t + .5); g.gain.linearRampToValueAtTime(0.0001, t + 2.2); const b = filt('bandpass', 700, g, .6); b.frequency.linearRampToValueAtTime(1100, t + 2); noise(t, 2.3, b); };
  fx.whistle = t => { const g = gain(o_, 0); env(g, t, .05, .1, .9, .3); const o = osc('sine', 1400, t, 1.4, g); o.frequency.linearRampToValueAtTime(900, t + 1.2); };
  fx.buzz = t => { for (const k of [0, .25]) { const g = gain(o_, 0); env(g, t + k, .005, .15, .15, .05); osc('square', 150, t + k, .25, filt('lowpass', 500, g)); } };
  fx.zip = t => { const g = gain(o_, 0); env(g, t, .005, .2, .2); const b = filt('bandpass', 1000, g, 3); b.frequency.setValueAtTime(800, t); b.frequency.exponentialRampToValueAtTime(5000, t + .2); noise(t, .22, b); };
  fx.plane = (t, dur = 2.5) => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.2, t + dur * .5); g.gain.linearRampToValueAtTime(0.0001, t + dur); noise(t, dur, filt('lowpass', 500, g)); osc('sawtooth', 110, t, dur, filt('lowpass', 300, gain(g, .3))); };
  fx.fireworks = t => { for (let i = 0; i < 4; i++) { const tt = t + i * .35; fx.whistle(tt); const g = gain(o_, 0); env(g, tt + .9, .002, .35, .6); noise(tt + .9, .7, filt('lowpass', 2000, g)); } };
  fx.chaching = t => { fx.camera(t); [[2637, .14], [3520, .12], [5274, .06]].forEach(([f, v], i) => { const g = gain(o_, 0); env(g, t + .08 + i * .03, .002, v, .9); osc('sine', f, t + .08, 1, g); }); };
  fx.crack = t => { const g = gain(o_, 0); env(g, t, .001, .6, .5); noise(t, .6, filt('lowpass', 1800, g)); fx.thud(t, .5); };
  fx.fizz = (t, dur = 1.8) => { const g = gain(o_, 0); env(g, t, .01, .16, dur); noise(t, dur + .1, filt('highpass', 5000, g)); for (let k = 0; k < dur; k += .06) { const c = gain(o_, 0); env(c, t + k, .001, .04, .02); osc('sine', 3000 + (k * 1913 % 2500), t + k, .03, c); } };
  fx.tada = (t, v = .14) => ['C4', 'E4', 'G4', 'C5'].forEach((n, i) => { const g = gain(o_, 0); env(g, t + i * .02, .01, v, 1.4, .25); const lp = filt('lowpass', 2400, g); osc('sawtooth', N(n), t, 1.8, lp); osc('sawtooth', N(n) * 1.005, t, 1.8, lp); });
  fx.sting = t => { A.brass(o_, t, [N('C3'), N('G3'), N('C4'), N('E4')], 2.2, .12); A.timpani(o_, t, N('C2'), .5); };
  fx.horrorHit = t => { A.violin(o_, t, N('B5'), 1.2, .08); A.violin(o_, t, N('C6'), 1.2, .08); A.violin(o_, t, N('F5'), 1.2, .06); fx.thud(t, .4); };
  fx.mow = (t, dur) => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.05, t + .2); g.gain.setValueAtTime(.05, t + dur - .3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const lp = filt('lowpass', 700, g); osc('sawtooth', 68, t, dur, lp); osc('sawtooth', 102, t, dur, gain(lp, .5)); };
  fx.blower = (t, dur) => { const g = gain(o_, 0); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.08, t + .2); g.gain.linearRampToValueAtTime(0.0001, t + dur); noise(t, dur, filt('bandpass', 1500, g, .8)); };
  fx.heartbeat = t => { fx.thud(t, .3); fx.thud(t + .2, .22); };
  fx.squeak = t => { const g = gain(o_, 0); env(g, t, .002, .12, .12); const o = osc('sine', 1500, t, .15, g); o.frequency.linearRampToValueAtTime(2200, t + .1); };
  return A;
}

// ---------- music styles: each schedules notes for the part of [seg.t0, seg.t1) inside [w0, w1) ----------
function beats(seg, w0, w1, bpm, sub, fn) { const b = 60 / bpm / sub, a = Math.max(seg.t0, w0), z = Math.min(seg.t1, w1);
  let i = Math.ceil((a - seg.t0) / b - 1e-6); for (let t = seg.t0 + i * b; t < z - 1e-6; i++, t = seg.t0 + i * b) fn(i, t); }
const CH = { C: ['C3', 'E3', 'G3'], Dm: ['D3', 'F3', 'A3'], Em: ['E3', 'G3', 'B3'], F: ['F3', 'A3', 'C4'], G: ['G3', 'B3', 'D4'], Am: ['A2', 'C3', 'E3'], Bb: ['Bb2', 'D3', 'F3'],
  D: ['D3', 'F#3', 'A3'], A: ['A2', 'C#3', 'E3'], E: ['E3', 'G#3', 'B3'], Gm: ['G2', 'Bb2', 'D3'], Cm: ['C3', 'Eb3', 'G3'], Ab: ['Ab2', 'C3', 'Eb3'], Eb: ['Eb3', 'G3', 'Bb3'] };
const up = (n, o = 1) => n.replace(/\d/, d => +d + o);
const chord = (c, o = 0) => CH[c].map(n => N(up(n, o)));
const root = (c, o = -1) => N(up(CH[c][0], o));
const MUSIC = {
  hum(A, d, s, w0, w1) { beats(s, w0, w1, 60, .25, (i, t) => { const c = ['F', 'Bb', 'F', 'C'][i % 4]; A.organ(d, t, chord(c, 1), 4.05, .035); A.choirPad(d, t, chord(c, 1), 4, .03); }); },
  gospel(A, d, s, w0, w1) { const bpm = s.bpm || 104; beats(s, w0, w1, bpm, 1, (i, t) => { const bar = Math.floor(i / 4), c = ['F', 'F', 'Bb', 'F', 'C', 'Bb', 'F', 'C'][bar % 8], k = i % 4;
      if (k === 0) { A.organ(d, t, chord(c, 1), 60 / bpm * 4, .03); A.choirPad(d, t, chord(c, 1), 60 / bpm * 4, .03); }
      A.bass(d, t, root(c, -1) * (k % 2 ? 1.5 : 1), .28, .3); if (k % 2) { A.clap(d, t, .12); A.organ(d, t, chord(c, 2), .18, .03); } else A.kick(d, t, .4); A.tamb(d, t + 60 / bpm / 2, .04); }); },
  spy(A, d, s, w0, w1) { const bpm = 132; beats(s, w0, w1, bpm, 2, (i, t) => { const k = i % 16, line = ['E2', 'E2', 'F#2', 'F#2', 'G2', 'G2', 'F#2', 'F#2'];
      A.bass(d, t, N(line[(i >> 1) % 8]), .3, .2); if (i % 2 === 0) A.hat(d, t, .03); if (k === 4 || k === 12) A.snare(d, t, .06);
      if (k === 0 || k === 8) A.twang(d, t, N(['E4', 'G4'][(i >> 3) % 2]), .12, .9); if (k === 14) A.brass(d, t, [N('E4'), N('G4'), N('B4')], .25, .05); }); },
  circus(A, d, s, w0, w1) { const bpm = 160, mel = ['C5', 'B4', 'C5', 'G4', 'A4', 'G4', 'E4', 'G4', 'F4', 'E4', 'F4', 'A4', 'G4', 'F4', 'E4', 'D4'];
    beats(s, w0, w1, bpm, 1, (i, t) => { const c = ['C', 'G', 'C', 'G', 'F', 'C', 'G', 'C'][Math.floor(i / 4) % 8], k = i % 2;
      if (k === 0) A.tuba(d, t, root(c, -1), .3); else A.calliope(d, t, chord(c, 1)[1], .04, .12); A.calliope(d, t, N(mel[i % 16]), .06, .14); if (k) A.snare(d, t, .03); }); },
  mystery(A, d, s, w0, w1) { beats(s, w0, w1, 70, .5, (i, t) => { A.pad(d, t, [N('A2'), N('E3'), N('C4')], 1.7 * 2, .025, 1, 900); if (i % 2 === 0) A.violin(d, t + .4, N(['E5', 'F5', 'E5', 'D#5'][(i / 2) % 4]), 2.2, .03); A.timpani(d, t, N('A1'), .12); }); },
  sneaky(A, d, s, w0, w1) { const bpm = 120, mel = ['E4', 0, 'G4', 0, 'A4', 'Bb4', 'A4', 0, 'E4', 0, 'G4', 0, 'D4', 'E4', 0, 0]; beats(s, w0, w1, bpm, 2, (i, t) => { const n = mel[i % 16];
      if (n) A.pluck(d, t, N(n), .1, .15); if (i % 4 === 0) A.bass(d, t, N('E2'), .25, .15); if (i % 4 === 2) A.bass(d, t, N('B1'), .2, .15); }); },
  romance(A, d, s, w0, w1) { const bpm = s.bpm || 72; beats(s, w0, w1, bpm, 2, (i, t) => { const c = ['C', 'Am', 'F', 'G'][Math.floor(i / 8) % 4], ns = chord(c, 1).concat([chord(c, 2)[0]]);
      A.piano(d, t, ns[[0, 1, 2, 3, 2, 1, 2, 3][i % 8]], .08, 1.4); if (i % 8 === 0) { A.pad(d, t, chord(c, 1), 60 / bpm * 4, .025, 1); A.bass(d, t, root(c, -1), .2, 1.5); } }); },
  harp(A, d, s, w0, w1) { beats(s, w0, w1, 60, .5, (i, t) => { A.harpGliss(d, t, 'C5', true); A.pad(d, t, chord('F', 2), 2, .02, .5); }); },
  sad(A, d, s, w0, w1) { const mel = ['A4', 'G4', 'F4', 'E4', 'D4', 'E4', 'C4', 'A3']; beats(s, w0, w1, 60, 1, (i, t) => { A.violin(d, t, N(mel[i % 8]), 1.05, .055); if (i % 4 === 0) A.pad(d, t, chord(['Dm', 'Am'][(i / 4) % 2], 0), 4, .025, .8, 1000); }); },
  villain(A, d, s, w0, w1) { const bpm = 96; beats(s, w0, w1, bpm, 2, (i, t) => { const n = ['D2', 'D2', 'F2', 'D2', 'Eb2', 'D2', 'C#2', 'D2'][i % 8];
      A.bass(d, t, N(n), .3, .2); A.violin(d, t, N(up(n, 2)), .2, .03); if (i % 8 === 0) { A.brass(d, t, [N('D3'), N('F3'), N('A3')], .6, .06); A.timpani(d, t, N('D2'), .35); } if (i % 16 === 14) A.brass(d, t, [N('Eb3'), N('G3'), N('Bb3')], .35, .07); }); },
  summit(A, d, s, w0, w1) { const bpm = 76; beats(s, w0, w1, bpm, 1, (i, t) => { const c = ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'G'][Math.floor(i / 2) % 8];
      if (i % 2 === 0) { A.brass(d, t, chord(c, 0), 60 / bpm * 2 - .1, .045); A.pad(d, t, chord(c, 1), 60 / bpm * 2, .02, .3); } if (i % 8 === 0) A.timpani(d, t, root(c, -1), .3); A.snare(d, t, .015); A.snare(d, t + 60 / bpm / 4, .01); }); },
  heroic(A, d, s, w0, w1) { const bpm = 100, fan = [['C4', 1], ['G4', 1], ['C5', 2], ['D5', 1], ['E5', 1], ['G5', 2]]; beats(s, w0, w1, bpm, 1, (i, t) => {
      const c = ['C', 'G', 'Am', 'F'][Math.floor(i / 4) % 4]; if (i % 4 === 0) { A.pad(d, t, chord(c, 1), 60 / bpm * 4, .03, .2); A.timpani(d, t, root(c, -1), .3); } A.bass(d, t, root(c, -1), .2, .25);
      let acc = 0; for (const [n, l] of fan) { if (acc === i % 8) A.brass(d, t, [N(n), N(n) * 1.5], 60 / bpm * l * .9, .05); acc += l; } }); },
  country(A, d, s, w0, w1) { const bpm = s.bpm || 116; beats(s, w0, w1, bpm, 2, (i, t) => { const c = ['G', 'G', 'C', 'G', 'D', 'C', 'G', 'D'][Math.floor(i / 8) % 8], k = i % 4;
      if (k === 0) A.bass(d, t, root(c, -1), .3, .25); if (k === 2) A.bass(d, t, root(c, -1) * 1.5, .25, .25); if (k === 1 || k === 3) chord(c, 1).forEach((f, j) => A.twang(d, t + j * .01, f, .05, .25));
      if (i % 2 === 0) A.hat(d, t, .02); if (k === 2) A.snare(d, t, .05); if (i % 16 === 15) A.twang(d, t, chord(c, 2)[2], .09, .6); }); },
  rock(A, d, s, w0, w1) { const bpm = 128; beats(s, w0, w1, bpm, 2, (i, t) => { const c = ['E', 'E', 'A', 'E', 'D', 'A', 'E', 'E'][Math.floor(i / 8) % 8], k = i % 8;
      if (k % 2 === 0) A.guitar(d, t, [root(c, 0), root(c, 0) * 1.5], .22, .05); A.bass(d, t, root(c, -1), .25, .15); if (k === 0 || k === 3 || k === 5) A.kick(d, t, .45); if (k === 2 || k === 6) A.snare(d, t, .1); A.hat(d, t, .025); }); },
  horror(A, d, s, w0, w1) { beats(s, w0, w1, 40, .25, (i, t) => { A.pad(d, t, [N('C2'), N('C#2'), N('G2')], 6, .04, 1.5, 500); A.violin(d, t + 2, N('C#6'), 3, .025); }); },
  ballad(A, d, s, w0, w1) { const bpm = s.bpm || 76; beats(s, w0, w1, bpm, 2, (i, t) => { const c = ['C', 'G', 'Am', 'F'][Math.floor(i / 8) % 4];
      A.piano(d, t, chord(c, 1)[[0, 2, 1, 2][i % 4]] * (i % 8 < 4 ? 1 : 2), .09, 1.5); if (i % 8 === 0) { A.piano(d, t, root(c, 0), .12, 3); A.pad(d, t, chord(c, 1), 60 / bpm * 4, .03, 1.2); A.violin(d, t, chord(c, 2)[2], 60 / bpm * 3.6, .03); } }); },
  orchestral(A, d, s, w0, w1) { const bpm = 66; beats(s, w0, w1, bpm, 1, (i, t) => { const c = ['C', 'Am', 'F', 'G', 'C', 'Em', 'F', 'G'][Math.floor(i / 4) % 8];
      if (i % 4 === 0) { A.pad(d, t, chord(c, 0).concat(chord(c, 1)), 60 / bpm * 4, .03, 1); A.bass(d, t, root(c, -1), .25, 3); A.violin(d, t, chord(c, 2)[(i / 4) % 3], 60 / bpm * 3.8, .04); }
      A.piano(d, t, chord(c, 2)[i % 3], .06, 1.2); if (i % 16 === 12) A.timpani(d, t, root(c, -1), .25); }); },
  triumph(A, d, s, w0, w1) { const bpm = 140; beats(s, w0, w1, bpm, 1, (i, t) => { const c = ['C', 'F', 'G', 'C'][Math.floor(i / 4) % 4]; if (i % 4 === 0) A.brass(d, t, chord(c, 1), .9, .06);
      A.kick(d, t, .4); if (i % 2) A.snare(d, t, .1); A.bass(d, t, root(c, -1), .25, .2); }); },
  camp(A, d, s, w0, w1) { beats(s, w0, w1, 80, .5, (i, t) => { A.pluck(d, t, N(['G3', 'D4', 'B3', 'D4'][i % 4]), .06, .9); }); },
};
