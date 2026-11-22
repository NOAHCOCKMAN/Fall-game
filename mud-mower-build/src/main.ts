import { createStage } from './scene/setup';
import { CameraRig } from './scene/cameras';
import { DONOR_IDS, PALETTES } from './scene/materials';
import { Model } from './model/registry';
import { ALL_PARTS } from './model/parts';
import { Fx } from './fx/fx';
import { StepEngine } from './engine/stepEngine';
import { STEPS } from './steps';
import type { DonorId } from './steps/types';
import { StepList } from './ui/stepList';
import { Panel } from './ui/panel';
import { $, el, fmtTime } from './ui/dom';
import { store } from './ui/store';

const stage = createStage($('canvasHost'));
const model = new Model(ALL_PARTS);
stage.scene.add(model.root, model.shelfRoot, model.persist);
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
  model.setDonor(donor); panel.show(engine.step, donor);
};

// ---------- step list + panel ----------
const panel = new Panel();
const list = new StepList(STEPS, i => { closeDrawer(); engine.open(i); });

// ---------- toggles ----------
type Toggle = { id: string; label: string; on: boolean; set(v: boolean): void; enabled?: () => boolean };
const toggles: Toggle[] = [
  { id: 'labels', label: 'Labels', on: true, set: v => { fx.labelsOn = v; stage.labelRenderer.domElement.classList.toggle('hide-labels', !v); } },
  { id: 'xray', label: 'X-ray', on: false, set: v => model.setXray(v) },
  { id: 'exploded', label: 'Exploded', on: false, set: () => { /* M4: explode step's group */ }, enabled: () => !!engine.step?.explodable },
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
  if (location.hash !== h) history.replaceState(null, '', h);
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

// ---------- render loop ----------
let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  fx.update(dt);
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
