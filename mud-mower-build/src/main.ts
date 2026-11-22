import { createStage } from './scene/setup';
import { CameraRig } from './scene/cameras';
import { DONOR_IDS, PALETTES } from './scene/materials';
import { createModel } from './model/parts';
import { Fx } from './fx/fx';
import { StepEngine } from './engine/stepEngine';
import { STEPS } from './steps';
import type { DonorId } from './steps/types';
import { StepList } from './ui/stepList';
import { Panel } from './ui/panel';
import { $, el, fmtTime } from './ui/dom';
import { store } from './ui/store';
import { HANDLERS } from './engine/actions';
import { PAINT_PRESETS } from './model/paint';
import { Color, Mesh, MeshStandardMaterial, SpotLight } from 'three';

const stage = createStage($('canvasHost'));
const model = createModel();
stage.scene.add(model.root, model.shelfRoot);
const fx = new Fx(stage.scene, $('note'));
const rig = new CameraRig(stage.camera, stage.controls);
const engine = new StepEngine(STEPS, model, fx, rig);

// ---------- donor picker ----------
let donor = (store.get('mm.donor') as DonorId) || 'jd112';
if (!PALETTES[donor]) donor = 'jd112';
const picker = $<HTMLSelectElement>('donorPicker');
for (const d of DONOR_IDS) { const o = el('option', '', PALETTES[d].name); o.value = d; picker.appendChild(o); }
picker.value = donor;
model.setDonor(donor);
picker.onchange = () => {
  donor = picker.value as DonorId; store.set('mm.donor', donor);
  model.setDonor(donor);
  // re-open the step at the same time so donor-dependent animation (0.1 lineup) is rebuilt
  const t = engine.time, playing = engine.playing;
  engine.open(engine.index, false); engine.seek(t); if (playing) engine.play();
};

// ---------- step list + panel ----------
const panel = new Panel();
const list = new StepList(STEPS, i => { closeDrawer(); engine.open(i); });

// ---------- toggles ----------
type Toggle = { id: string; label: string; on: boolean; set(v: boolean): void; enabled?: () => boolean };
const toggles: Toggle[] = [
  { id: 'labels', label: 'Labels', on: true, set: v => { stage.labelRenderer.domElement.classList.toggle('hide-labels', !v); } },
  { id: 'xray', label: 'X-ray', on: false, set: v => model.setXray(v) },
  { id: 'exploded', label: 'Exploded', on: false, set: v => setExploded(v), enabled: () => !!engine.step?.explodable },
  { id: 'measure', label: 'Measurements', on: true, set: v => stage.labelRenderer.domElement.classList.toggle('hide-measure', !v) },
  { id: 'free', label: 'Free cam', on: false, set: v => { rig.freeCam = v; if (!v) { rig.override = false; engine.seek(engine.time); } updateResume(); } },
];
const togHost = $('toggles');
const togBtns = new Map<string, HTMLButtonElement>();
for (const t of toggles) {
  const b = el('button', 'toggle', t.label);
  b.setAttribute('aria-pressed', String(t.on));
  b.onclick = () => { t.on = !t.on; b.setAttribute('aria-pressed', String(t.on)); t.set(t.on); };
  togHost.appendChild(b); togBtns.set(t.id, b);
}
const freeToggle = toggles.find(t => t.id === 'free')!;
function refreshToggles() {
  for (const t of toggles) if (t.enabled) {
    const b = togBtns.get(t.id)!; b.disabled = !t.enabled();
    if (b.disabled && t.on) { t.on = false; b.setAttribute('aria-pressed', 'false'); t.set(false); }
  }
}

// ---------- camera override ----------
const resumeBtn = $<HTMLButtonElement>('resumeCam');
function updateResume() { resumeBtn.hidden = !(rig.override && !rig.freeCam); }
rig.onOverride = updateResume;
resumeBtn.onclick = () => { rig.override = false; engine.seek(engine.time); updateResume(); };

// ---------- transport ----------
const btnPlay = $<HTMLButtonElement>('btnPlay');
const scrub = $<HTMLInputElement>('scrubber');
const timeEl = $('time');
const completeEl = $('complete');
$('btnPrev').onclick = () => engine.prev();
$('btnNext').onclick = () => engine.next();
$('btnRestart').onclick = () => engine.restart();
btnPlay.onclick = () => engine.toggle();
const speeds = $('speeds');
for (const s of [0.5, 1, 2]) {
  const b = el('button', 'speed', `${s}×`); b.dataset.s = String(s);
  b.onclick = () => engine.setSpeed(s);
  speeds.appendChild(b);
}
const auto = $<HTMLInputElement>('autoAdvance');
auto.onchange = () => { engine.autoAdvance = auto.checked; };

let wasPlaying = false;
scrub.addEventListener('pointerdown', () => { wasPlaying = engine.playing; engine.scrubbing = true; engine.pause(); });
scrub.addEventListener('input', () => engine.seek((+scrub.value / 1000) * engine.duration));
const endScrub = () => { if (!engine.scrubbing) return; engine.scrubbing = false; if (wasPlaying) engine.play(); };
scrub.addEventListener('pointerup', endScrub);
scrub.addEventListener('change', endScrub);

engine.on('time', () => {
  if (!engine.scrubbing) scrub.value = String(Math.round((engine.time / engine.duration) * 1000));
  timeEl.textContent = `${fmtTime(engine.time)} / ${fmtTime(engine.duration)}`;
  if (!completeEl.hidden && engine.time < engine.duration - 0.05) completeEl.hidden = true;
});
engine.on('state', () => {
  btnPlay.textContent = engine.playing ? '❚❚' : '▶';
  btnPlay.setAttribute('aria-label', engine.playing ? 'Pause' : 'Play');
  speeds.querySelectorAll<HTMLElement>('.speed').forEach(b => b.classList.toggle('on', +b.dataset.s! === engine.speed));
  if (engine.playing) { completeEl.hidden = true; $('btnNext').classList.remove('pulse'); }
});
engine.on('complete', () => {
  completeEl.hidden = false;
  $('btnNext').classList.add('pulse');
  list.markDone(engine.step.id); list.refresh(engine.index);
});
engine.on('step', () => {
  const s = engine.step;
  $('stepNum').textContent = s.number; $('stepTitle').textContent = s.title;
  completeEl.hidden = true; $('btnNext').classList.remove('pulse');
  panel.show(s, donor);
  list.refresh(engine.index);
  refreshToggles(); updateResume();
  const h = `#step=${s.number}`;
  if (location.hash !== h) { try { history.replaceState(null, '', h); } catch { /* sandboxed frames may refuse */ } }
  timeEl.textContent = `0:00 / ${fmtTime(s.durationSec)}`; scrub.value = '0';
});

// ---------- deep links ----------
function stepFromHash(): number {
  const m = /step=([\w.-]+)/.exec(location.hash);
  if (!m) return 0;
  const i = STEPS.findIndex(s => s.number === m[1] || s.id === m[1]);
  return i < 0 ? 0 : i;
}
window.addEventListener('hashchange', () => { const i = stepFromHash(); if (i !== engine.index) engine.open(i); });

// ---------- keys ----------
window.addEventListener('keydown', e => {
  const t = e.target as HTMLElement;
  if (t && (t.tagName === 'INPUT' && (t as HTMLInputElement).type !== 'range' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
  if (e.key === 'ArrowRight') { engine.next(); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { engine.prev(); e.preventDefault(); }
  else if (e.key === ' ') { engine.toggle(); e.preventDefault(); }
  else if (e.key === 'r' || e.key === 'R') engine.restart();
  else if (e.key === 'f' || e.key === 'F') togBtns.get('free')!.click();
});
void freeToggle;

// ---------- mobile drawer + bottom sheet ----------
const sidebar = $('sidebar'), scrim = $('scrim');
function openDrawer() { sidebar.classList.add('open'); scrim.hidden = false; }
function closeDrawer() { sidebar.classList.remove('open'); scrim.hidden = true; }
$('drawerOpen').onclick = openDrawer; $('drawerClose').onclick = closeDrawer; scrim.onclick = closeDrawer;
{
  const panelEl = $('panel'), handle = $('sheetHandle');
  let startY = 0, startH = 0, dragging = false;
  handle.addEventListener('pointerdown', e => { dragging = true; startY = e.clientY; startH = panelEl.getBoundingClientRect().height; handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    const h = Math.max(innerHeight * 0.45, Math.min(innerHeight * 0.9, startH + (startY - e.clientY)));
    panelEl.style.height = `${h}px`;
  });
  handle.addEventListener('pointerup', () => { dragging = false; });
}

// ---------- exploded toggle ----------
function setExploded(on: boolean) {
  const g = engine.step?.explodable; if (!g) return;
  engine.pause();
  const h = HANDLERS.explode!;
  h.apply({ t: 0, dur: 0, type: on ? 'explode' : 'collapse', group: g, factor: 1 }, { model, fx: null, step: engine.step, live: () => false });
}

// ---------- paint presets (9.2) + finale title card ----------
const presetsEl = el('div', 'presets'); presetsEl.hidden = true; $('viewport').appendChild(presetsEl);
model.paintPreset = (store.get('mm.paint') as typeof model.paintPreset) || 'factory';
for (const p of PAINT_PRESETS) {
  const b = el('button', 'preset', p.label); b.dataset.p = p.id;
  b.onclick = () => {
    model.paintPreset = p.id; store.set('mm.paint', p.id);
    const t = engine.time; engine.open(engine.index, false); engine.seek(t);
    refreshPresets();
  };
  presetsEl.appendChild(b);
}
function refreshPresets() { presetsEl.querySelectorAll<HTMLElement>('.preset').forEach(b => b.classList.toggle('on', b.dataset.p === model.paintPreset)); }
refreshPresets();
fx.showPresets = on => { presetsEl.hidden = !on; };
const titleEl = el('div', 'title-card'); titleEl.hidden = true; $('viewport').appendChild(titleEl);
fx.showTitle = (text, replay) => {
  if (!text) { titleEl.hidden = true; return; }
  if (titleEl.dataset.text !== text) {
    titleEl.dataset.text = text; titleEl.innerHTML = '';
    titleEl.appendChild(el('h1', '', text));
    if (replay) {
      const b = el('button', 'primary', 'Replay full build');
      b.onclick = () => { auto.checked = true; engine.autoAdvance = true; engine.setSpeed(2); engine.open(0); };
      titleEl.appendChild(b);
    }
  }
  titleEl.hidden = false;
};

// ---------- environment (shop / dusk / grass / outdoors) + lights ----------
const ENV = {
  normal: { bg: '#d8d4cc', hemi: 1.4, sun: 2.4, floor: '#ffffff', wall: 1 },
  dusk: { bg: '#232834', hemi: 0.22, sun: 0.18, floor: '#ffffff', wall: 1 },
  grass: { bg: '#bcd6ea', hemi: 1.5, sun: 2.6, floor: '#86a85e', wall: 0 },
  outdoor: { bg: '#b7d3ea', hemi: 1.5, sun: 2.6, floor: '#7d9c55', wall: 0 },
} as const;
const cA = new Color(), cB = new Color();
const wall = stage.scene.children.find(o => (o as Mesh).isMesh && o.position.z === -70) as Mesh | undefined;
function applyEnv() {
  const w = model.world;
  const A = ENV[w.envFrom ?? w.env], B = ENV[w.env], k = w.envK;
  (stage.scene.background as Color).copy(cA.set(A.bg).lerp(cB.set(B.bg), k));
  stage.hemi.intensity = A.hemi + (B.hemi - A.hemi) * k;
  stage.sun.intensity = A.sun + (B.sun - A.sun) * k;
  stage.floorMat.color.copy(cA.set(A.floor).lerp(cB.set(B.floor), k));
  if (wall) { const op = A.wall + (B.wall - A.wall) * k; const wm = wall.material as MeshStandardMaterial; wm.transparent = op < 1; wm.opacity = op; wall.visible = op > 0.02; }
  // lights: lens glow + spot lights on the installed lamps
  for (const id of ['headlightL', 'headlightR', 'lightBar']) {
    if (!model.has(id)) continue;
    const o = model.get(id).obj;
    const spot = o.getObjectByName('spot') as SpotLight | undefined;
    const lens = o.getObjectByName('lens') as Mesh | undefined;
    const on = o.visible ? w.lights : 0;
    if (spot) spot.intensity = on * (id === 'lightBar' ? 2500 : 1600);
    if (lens) { const lm = lens.material as MeshStandardMaterial; lm.emissive.set('#fff3c8'); lm.emissiveIntensity = on * 3; }
  }
}

// ---------- render loop ----------
let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  fx.update(dt);
  applyEnv();
  stage.controls.update();
  // underside preset: floor goes 85% transparent while the camera is below it
  const under = stage.camera.position.y < 0;
  if (stage.floorMat.transparent !== under) { stage.floorMat.transparent = under; stage.floorMat.needsUpdate = true; }
  stage.floorMat.opacity = under ? 0.15 : 1;
  stage.renderer.render(stage.scene, stage.camera);
  stage.labelRenderer.render(stage.scene, stage.camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

engine.open(stepFromHash(), false);
// expose for debugging in the console
(window as unknown as { mm: unknown }).mm = { engine, model, stage };
