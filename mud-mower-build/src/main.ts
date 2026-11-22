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
import { CameraTools, QUICK_VIEWS } from './ui/cameraTools';
import { Picker } from './ui/picker';

const stage = createStage($('canvasHost'));
const model = createModel();
stage.scene.add(model.root, model.shelfRoot);
const fx = new Fx(stage.scene, $('note'));
const rig = new CameraRig(stage.camera, stage.controls);
const engine = new StepEngine(STEPS, model, fx, rig);

// ---------- render on demand: draw only when something changed (big saving on laptops / phones) ----------
let dirtyFrames = 2;
const invalidate = (frames = 2) => { dirtyFrames = Math.max(dirtyFrames, frames); };
stage.onResize = () => invalidate();
stage.controls.addEventListener('change', () => invalidate());
for (const ev of ['pointerdown', 'pointerup', 'keydown', 'click', 'input', 'change', 'wheel']) window.addEventListener(ev, () => invalidate(3), { passive: true });
engine.on('time', () => invalidate());
engine.on('step', () => invalidate(3));
engine.on('state', () => invalidate());
const tools = new CameraTools(stage, rig, model, invalidate);
const picker = new Picker(stage, model, engine, STEPS, tools, invalidate);

// ---------- donor picker ----------
let donor = (store.get('mm.donor') as DonorId) || 'jd112';
if (!PALETTES[donor]) donor = 'jd112';
const donorSel = $<HTMLSelectElement>('donorPicker');
for (const d of DONOR_IDS) { const o = el('option', '', PALETTES[d].name); o.value = d; donorSel.appendChild(o); }
donorSel.value = donor;
model.setDonor(donor);
donorSel.onchange = () => {
  donor = donorSel.value as DonorId; store.set('mm.donor', donor);
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
  b.onclick = () => { t.on = !t.on; b.setAttribute('aria-pressed', String(t.on)); t.set(t.on); invalidate(); };
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
const camAuto = $<HTMLButtonElement>('camAuto');
function updateResume() {
  const scripted = !rig.override && !rig.freeCam;
  resumeBtn.hidden = scripted || rig.freeCam;
  camAuto.setAttribute('aria-pressed', String(scripted));
  camAuto.textContent = scripted ? 'Auto' : 'Auto ↺';
}
rig.onOverride = updateResume;
function resumeCamera() {
  if (rig.freeCam) togBtns.get('free')!.click();
  rig.override = false; engine.seek(engine.time); updateResume(); invalidate();
}
resumeBtn.onclick = resumeCamera;

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
const autoM = $<HTMLInputElement>('autoAdvanceM');
auto.onchange = () => { engine.autoAdvance = auto.checked; autoM.checked = auto.checked; };
autoM.onchange = () => { engine.autoAdvance = autoM.checked; auto.checked = autoM.checked; };
const speedCycle = $<HTMLButtonElement>('speedCycle');
speedCycle.onclick = () => engine.setSpeed(engine.speed === 1 ? 2 : engine.speed === 2 ? 0.5 : 1);

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
  speedCycle.textContent = `${engine.speed}×`;
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
  if (picker.selected) picker.select(picker.selected);   // refresh "Go to step" on the card
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
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'ArrowRight') { engine.next(); e.preventDefault(); }
  else if (k === 'ArrowLeft') { engine.prev(); e.preventDefault(); }
  else if (k === ' ') { engine.toggle(); e.preventDefault(); }
  else if (k === 'r' || k === 'R') engine.restart();
  else if (k === 'f' || k === 'F') togBtns.get('free')!.click();
  else if (k === 'a' || k === 'A') resumeCamera();
  else if (k === '+' || k === '=') tools.zoom(0.8);
  else if (k === '-' || k === '_') tools.zoom(1.25);
  else if (k === '0') tools.fitTractor();
  else if (/^[1-9]$/.test(k)) tools.view(QUICK_VIEWS[+k - 1][0]);
  else if (k === 'l' || k === 'L') togBtns.get('labels')!.click();
  else if (k === 'x' || k === 'X') togBtns.get('xray')!.click();
  else if (k === 'e' || k === 'E') { const b = togBtns.get('exploded')!; if (!b.disabled) b.click(); }
  else if (k === '[') toggleSide();
  else if (k === ']') togglePanel();
  else if (k === '?' || k === 'h' || k === 'H') toggleHelp();
  else if (k === 'Escape') { if (!helpEl.hidden) toggleHelp(false); else if (!viewsMenu.hidden) setViewsMenu(false); else picker.select(null); }
  else if ((k === 'c' || k === 'C') && picker.selected) picker.focus();
});
void freeToggle;

// ---------- drawer (phone) / collapsible panels (computer) ----------
const appEl = $('app'), sidebar = $('sidebar'), scrim = $('scrim');
const isPhone = () => matchMedia('(max-width: 1023px)').matches;
function openDrawer() { sidebar.classList.add('open'); scrim.hidden = false; }
function closeDrawer() { sidebar.classList.remove('open'); scrim.hidden = true; }
$('drawerOpen').onclick = openDrawer; $('drawerClose').onclick = closeDrawer; scrim.onclick = closeDrawer;
$('stepTitleBtn').onclick = () => { if (isPhone()) openDrawer(); else if (appEl.classList.contains('no-side')) toggleSide(); };
function toggleSide(force?: boolean) {
  const hide = force ?? !appEl.classList.contains('no-side');
  appEl.classList.toggle('no-side', hide); store.set('mm.noSide', hide ? '1' : '');
  $('sideToggle').textContent = hide ? '⟩' : '⟨'; $('sideToggle').setAttribute('aria-label', hide ? 'Show step list' : 'Hide step list');
}
function togglePanel(force?: boolean) {
  const hide = force ?? !appEl.classList.contains('no-panel');
  appEl.classList.toggle('no-panel', hide); store.set('mm.noPanel', hide ? '1' : '');
  $('panelToggle').textContent = hide ? '⟨' : '⟩'; $('panelToggle').setAttribute('aria-label', hide ? 'Show details panel' : 'Hide details panel');
}
$('sideToggle').onclick = () => toggleSide();
$('panelToggle').onclick = () => togglePanel();
if (store.get("mm.noSide")) toggleSide(true);
if (store.get('mm.noPanel')) togglePanel(true);

// ---------- phone bottom sheet: peek / half / full, drag or tap the handle ----------
{
  const handle = $('sheetHandle'), tabs = $('tabs');
  type Snap = 'peek' | 'half' | 'full';
  const px = (s: Snap) => s === 'peek' ? 118 : s === 'half' ? Math.round(innerHeight * 0.4) : Math.round(innerHeight * 0.86);
  let snap: Snap = (store.get('mm.sheet') as Snap) || 'half';
  const setH = (h: number) => appEl.style.setProperty('--sheet', `${h}px`);
  const apply = (s: Snap) => { snap = s; store.set('mm.sheet', s); setH(px(s)); appEl.dataset.sheet = s; };
  apply(snap);
  addEventListener('resize', () => apply(snap));
  let startY = 0, startH = 0, moved = false, dragging = false;
  handle.addEventListener('pointerdown', e => { dragging = true; moved = false; startY = e.clientY; startH = px(snap); handle.setPointerCapture(e.pointerId); appEl.classList.add('sheet-drag'); });
  handle.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dy = startY - e.clientY; if (Math.abs(dy) > 6) moved = true;
    setH(Math.max(px('peek'), Math.min(px('full'), startH + dy)));
  });
  handle.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false; appEl.classList.remove('sheet-drag');
    if (!moved) { setH(px(snap)); return; }     // a tap: handled by 'click'
    const h = startH + (startY - e.clientY);
    const order: Snap[] = ['peek', 'half', 'full'];
    apply(order.reduce((a, b) => Math.abs(px(b) - h) < Math.abs(px(a) - h) ? b : a));
  });
  handle.addEventListener('pointercancel', () => { dragging = false; appEl.classList.remove('sheet-drag'); setH(px(snap)); });
  handle.addEventListener('click', () => { if (!moved) apply(snap === 'peek' ? 'half' : snap === 'half' ? 'peek' : 'half'); moved = false; });
  handle.setAttribute('role', 'button'); handle.setAttribute('aria-label', 'Resize details'); handle.tabIndex = 0;
  handle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(snap === 'peek' ? 'half' : 'peek'); } });
  // picking a tab while peeking opens the sheet so the text is readable
  tabs.addEventListener('click', () => { if (snap === 'peek') apply('half'); });
}

// ---------- View menu (phone): donor, toggles, auto-advance ----------
const viewMenuBtn = $('viewMenuBtn'), viewport = $('viewport');
function setViewMenu(open: boolean) { viewport.classList.toggle('view-open', open); viewMenuBtn.setAttribute('aria-expanded', String(open)); }
viewMenuBtn.onclick = () => setViewMenu(!viewport.classList.contains('view-open'));
viewport.addEventListener('pointerdown', e => { if (!(e.target as HTMLElement).closest('#viewMenu, #viewMenuBtn')) setViewMenu(false); });

// ---------- camera dock ----------
const viewsMenu = $('viewsMenu'), viewsBtn = $('camViews');
QUICK_VIEWS.forEach(([id, label], i) => {
  const b = el('button', 'view-item'); b.append(el('span', '', label), el('kbd', '', String(i + 1)));
  if (i > 8) b.lastChild!.textContent = '';
  b.onclick = () => { tools.view(id); setViewsMenu(false); };
  viewsMenu.appendChild(b);
});
function setViewsMenu(open: boolean) { viewsMenu.hidden = !open; viewsBtn.setAttribute('aria-expanded', String(open)); }
viewsBtn.onclick = () => setViewsMenu(viewsMenu.hidden === true);
camAuto.onclick = resumeCamera;
$('camIn').onclick = () => tools.zoom(0.75);
$('camOut').onclick = () => tools.zoom(1.33);
$('camFit').onclick = () => (picker.selected ? picker.focus() : tools.fitTractor());
viewport.addEventListener('pointerdown', e => { if (!(e.target as HTMLElement).closest('#viewsMenu, #camViews')) setViewsMenu(false); });

// ---------- help + first-visit hint ----------
const helpEl = $('help');
const touch = matchMedia('(pointer: coarse)').matches;
helpEl.innerHTML = `
  <div class="help-head"><strong>Controls</strong><button class="icon-btn" id="helpClose" aria-label="Close">✕</button></div>
  <div class="help-grid">
    <h3>Camera</h3>
    <dl>
      ${touch ? `<dt>Drag</dt><dd>Orbit around the tractor</dd><dt>Pinch</dt><dd>Zoom</dd><dt>Two-finger drag</dt><dd>Pan</dd>`
              : `<dt>Drag</dt><dd>Orbit</dd><dt>Wheel</dt><dd>Zoom (toward the cursor)</dd><dt>Right-drag / Shift-drag</dt><dd>Pan</dd>`}
      <dt>Tap a part</dt><dd>Select it — then Focus or jump to its step</dd>
      <dt>Double-${touch ? 'tap' : 'click'}</dt><dd>Select + fly to it</dd>
      <dt>Auto</dt><dd>Give the camera back to the step's scripted moves</dd>
    </dl>
    ${touch ? '' : `<h3>Keys</h3>
    <dl class="keys">
      <dt>← →</dt><dd>Previous / next step</dd><dt>Space</dt><dd>Play / pause</dd><dt>R</dt><dd>Restart step</dd>
      <dt>A</dt><dd>Auto camera</dd><dt>+ −</dt><dd>Zoom</dd><dt>0</dt><dd>Fit the tractor</dd><dt>1–9</dt><dd>Quick views</dd>
      <dt>C</dt><dd>Focus the selected part</dd><dt>Esc</dt><dd>Clear selection</dd>
      <dt>L · X · E</dt><dd>Labels · X-ray · Exploded</dd><dt>F</dt><dd>Free camera</dd><dt>[ ]</dt><dd>Hide / show side panels</dd>
    </dl>`}
  </div>`;
function toggleHelp(force?: boolean) { helpEl.hidden = !(force ?? helpEl.hidden === true); }
$('helpBtn').onclick = () => toggleHelp();
helpEl.addEventListener('click', e => { if ((e.target as HTMLElement).id === 'helpClose') toggleHelp(false); });
{
  const hint = $('hint');
  if (!store.get('mm.hinted')) {
    hint.textContent = touch ? 'Drag to orbit · pinch to zoom · tap a part to select it' : 'Drag to orbit · scroll to zoom · click a part to select it · ? for shortcuts';
    hint.hidden = false;
    const done = () => { hint.hidden = true; store.set('mm.hinted', '1'); };
    setTimeout(done, 7000);
    $('canvasHost').addEventListener('pointerdown', done, { once: true });
  }
}

// ---------- exploded toggle ----------
function setExploded(on: boolean) {
  const g = engine.step?.explodable; if (!g) return;
  engine.pause();
  const h = HANDLERS.explode!;
  invalidate();
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
    refreshPresets(); invalidate();
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

// ---------- render loop (on demand) ----------
let last = performance.now();
let slow = 0;
function frame(now: number) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  fx.update(dt);
  const flying = tools.update(now);
  const camMoved = stage.controls.update();
  const busy = engine.playing || flying || camMoved || fx.animating;
  if (!busy && dirtyFrames <= 0) return;
  if (dirtyFrames > 0) dirtyFrames--;
  applyEnv();
  picker.update();
  // underside preset: floor goes 85% transparent while the camera is below it
  const under = stage.camera.position.y < 0;
  if (stage.floorMat.transparent !== under) { stage.floorMat.transparent = under; stage.floorMat.needsUpdate = true; }
  stage.floorMat.opacity = under ? 0.15 : 1;
  const t0 = performance.now();
  stage.renderer.render(stage.scene, stage.camera);
  stage.labelRenderer.render(stage.scene, stage.camera);
  // adaptive sharpness: if frames keep running slow while playing, render fewer pixels
  if (engine.playing && dt > 0.045 && performance.now() - t0 > 12) {
    if (++slow > 45) { slow = 0; const cur = stage.renderer.getPixelRatio(); if (cur > 1) stage.setPixelCap(Math.max(1, cur - 0.25)); }
  } else slow = Math.max(0, slow - 1);
}
requestAnimationFrame(frame);

engine.open(stepFromHash(), false);
// expose for debugging in the console
(window as unknown as { mm: unknown }).mm = { engine, model, stage, tools, picker, invalidate };
