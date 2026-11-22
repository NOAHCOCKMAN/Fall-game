import { Group, PointLight, type Object3D, type Scene, type Vector3 } from 'three';
import { Particles, type EmitOpts } from './particles';
import { makeCallout } from './labels';

/** Browser-only effects layer. Actions use it in play(); apply() never touches it. */
export class Fx {
  readonly transient = new Group();     // step-scoped objects (beads being drawn, labels, gauges)
  readonly sparks = new Particles(2000, true, 0.6);
  readonly torch = new PointLight('#bcd7ff', 0, 60, 1.6);
  readonly noteEl: HTMLElement;
  labelsOn = true;

  constructor(scene: Scene, noteEl: HTMLElement) {
    this.noteEl = noteEl;
    this.transient.name = 'fxTransient';
    scene.add(this.transient, this.sparks.points, this.torch);
  }

  emit(o: EmitOpts) { this.sparks.emit(o); }

  callout(parent: Object3D, at: Vector3, title: string, sub?: string) {
    const c = makeCallout(title, sub);
    c.position.copy(at);
    parent.add(c);
    this.tracked.push(c);
    return c;
  }
  private tracked: Object3D[] = [];

  note(text: string | null) {
    if (text) { this.noteEl.textContent = text; this.noteEl.hidden = false; }
    else this.noteEl.hidden = true;
  }

  clearTransient() {
    for (const o of this.tracked) o.removeFromParent();
    this.tracked = [];
    for (const c of [...this.transient.children]) c.removeFromParent();
    this.sparks.clear();
    this.torch.intensity = 0;
    this.note(null);
  }

  update(dt: number) { this.sparks.update(dt); }
}
