import { Group, PointLight, type Object3D, type Scene, type Vector3 } from 'three';
import { Particles, type EmitOpts } from './particles';
import { makeCallout } from './labels';

/** Browser-only effects layer. Actions use it in play(); apply() never touches it. */
export class Fx {
  readonly transient = new Group();     // step-scoped world-space objects
  readonly sparks = new Particles(2000, true, 0.6);
  readonly blobs = new Particles(1500, false, 0.9);   // fluid, mist, dust, chips, mud
  readonly torch = new PointLight('#bcd7ff', 0, 60, 1.6);
  readonly noteEl: HTMLElement;
  private tracked: Object3D[] = [];

  constructor(scene: Scene, noteEl: HTMLElement) {
    this.noteEl = noteEl;
    this.transient.name = 'fxTransient';
    scene.add(this.transient, this.sparks.points, this.blobs.points, this.torch);
  }

  emit(o: EmitOpts) { this.sparks.emit(o); }
  emitBlob(o: EmitOpts) { this.blobs.emit({ colorB: o.colorA, bounce: false, ...o }); }

  /** Callout pill + leader line. kind 'measure' labels follow the Measurements toggle. */
  callout(parent: Object3D, at: Vector3, title: string, sub?: string, kind: 'callout' | 'tag' | 'measure' = 'callout') {
    const c = makeCallout(title, sub, kind);
    c.position.copy(at);
    parent.add(c);
    this.tracked.push(c);
    return c;
  }
  /** Register any step-scoped object that isn't under `transient` (e.g. attached to a part). */
  trackObj(o: Object3D) { this.tracked.push(o); }

  note(text: string | null) {
    if (text) { this.noteEl.textContent = text; this.noteEl.hidden = false; }
    else this.noteEl.hidden = true;
  }

  clearTransient() {
    for (const o of this.tracked) o.removeFromParent();
    this.tracked = [];
    for (const c of [...this.transient.children]) c.removeFromParent();
    this.sparks.clear(); this.blobs.clear();
    this.torch.intensity = 0;
    this.note(null);
  }

  update(dt: number) { this.sparks.update(dt); this.blobs.update(dt); }
}
