import { Box3, Box3Helper, Color, Object3D, Raycaster, Vector2, type Mesh, type MeshStandardMaterial } from 'three';
import type { Stage } from '../scene/setup';
import type { Model } from '../model/registry';
import type { StepEngine } from '../engine/stepEngine';
import type { Step } from '../steps/types';
import { partName } from '../model/names';
import type { CameraTools } from './cameraTools';
import { $, el } from './dom';

/** Tap / click a part to select it: outline box + a card with its name, the step it goes on, Focus and Go to step. */
export class Picker {
  selected: string | null = null;
  private helper = new Box3Helper(new Box3(), new Color('#ffd23f'));
  private ray = new Raycaster();
  private card: HTMLElement;
  private firstStep = new Map<string, { added?: number; removed?: number }>();

  constructor(private stage: Stage, private model: Model, private engine: StepEngine, steps: Step[], private tools: CameraTools, private invalidate: () => void) {
    this.helper.visible = false;
    (this.helper.material as MeshStandardMaterial).depthTest = false;
    this.helper.renderOrder = 998;
    stage.scene.add(this.helper);
    steps.forEach((s, i) => s.actions.forEach(a => {
      const id = 'part' in a ? (a as { part: string }).part : undefined; if (!id) return;
      const e = this.firstStep.get(id) ?? {};
      if (['install', 'placeAt', 'show'].includes(a.type) && e.added === undefined) e.added = i;
      if (a.type === 'remove' && e.removed === undefined) e.removed = i;
      this.firstStep.set(id, e);
    }));
    this.card = el('div', 'sel-card'); this.card.hidden = true; this.card.setAttribute('role', 'dialog'); this.card.setAttribute('aria-label', 'Selected part');
    $('viewport').appendChild(this.card);

    // a tap is a press + release that barely moved (a drag orbits the camera instead)
    const dom = stage.renderer.domElement;
    let down: { x: number; y: number; t: number } | null = null;
    dom.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    dom.addEventListener('pointerup', e => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y), dt = performance.now() - down.t;
      down = null;
      if (moved < 7 && dt < 450) this.pickAt(e.clientX, e.clientY);
    });
    dom.addEventListener('dblclick', e => { this.pickAt(e.clientX, e.clientY); this.focus(); });
  }

  private pickAt(cx: number, cy: number) {
    const r = this.stage.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.stage.camera);
    const hits = this.ray.intersectObjects([this.model.root, this.model.shelfRoot], true);
    for (const h of hits) {
      if (!visible(h.object)) continue;
      const m = (h.object as Mesh).material as MeshStandardMaterial | undefined;
      if (m && m.opacity !== undefined && m.opacity < 0.35) continue;      // click through X-rayed / ghost parts
      const id = partOf(h.object);
      if (id && id !== 'vehicle' && !id.startsWith('donorShow')) { this.select(id); return; }
    }
    this.select(null);
  }

  select(id: string | null) {
    this.selected = id;
    this.helper.visible = !!id;
    this.card.hidden = !id;
    if (id) this.renderCard(id);
    this.update();
    this.invalidate();
  }

  focus() { if (this.selected) this.tools.fitBox(this.model.bounds(this.selected)); }

  private renderCard(id: string) {
    const steps = this.engine.steps, info = this.firstStep.get(id);
    this.card.innerHTML = '';
    const head = el('div', 'sel-head');
    head.append(el('strong', '', partName(id)));
    const close = el('button', 'icon-btn sel-close', '✕'); close.setAttribute('aria-label', 'Clear selection'); close.onclick = () => this.select(null);
    head.append(close);
    const meta = el('div', 'sel-meta');
    const bits: string[] = [];
    if (info?.added !== undefined) bits.push(`Goes on in ${steps[info.added].number}`);
    else if (this.model.get(id).defaultVisible) bits.push('Stock part');
    if (info?.removed !== undefined) bits.push(`comes off in ${steps[info.removed].number}`);
    meta.textContent = bits.join(' · ');
    const row = el('div', 'sel-actions');
    const focus = el('button', 'primary', 'Focus'); focus.onclick = () => this.focus();
    row.append(focus);
    const go = info?.added ?? info?.removed;
    if (go !== undefined && go !== this.engine.index) {
      const b = el('button', '', `Go to ${steps[go].number}`); b.onclick = () => { this.engine.open(go); };
      row.append(b);
    }
    this.card.append(head, meta, row);
  }

  /** Keep the outline on the part as it moves. */
  update() {
    if (!this.selected || !this.model.has(this.selected)) { this.helper.visible = false; return; }
    const r = this.model.get(this.selected);
    if (!visible(r.obj)) { this.helper.visible = false; return; }
    this.helper.box.copy(this.model.bounds(this.selected)).expandByScalar(0.4);
    this.helper.visible = true;
  }
}

function partOf(o: Object3D | null): string | null {
  for (let p = o; p; p = p.parent) if (p.userData.partId) return p.userData.partId as string;
  return null;
}
function visible(o: Object3D) { for (let p: Object3D | null = o; p; p = p.parent) if (!p.visible) return false; return true; }
