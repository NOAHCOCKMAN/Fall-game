import { Box3, Vector3 } from 'three';
import type { Stage } from '../scene/setup';
import { CAMERA_PRESETS, type CameraRig } from '../scene/cameras';
import type { Model } from '../model/registry';

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** User camera moves: smooth fly-to, zoom, fit, quick views. Any of these hands the camera to the user. */
export class CameraTools {
  private fly: { t0: number; dur: number; p0: Vector3; p1: Vector3; q0: Vector3; q1: Vector3 } | null = null;
  constructor(private stage: Stage, private rig: CameraRig, private model: Model, private invalidate: () => void) {}

  get flying() { return !!this.fly; }

  private takeOver() { if (!this.rig.override) { this.rig.override = true; this.rig.onOverride?.(); } }

  flyTo(pos: Vector3, target: Vector3, dur = 0.7) {
    this.takeOver();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.fly = { t0: performance.now(), dur: reduce ? 0.01 : dur, p0: this.stage.camera.position.clone(), p1: pos.clone(), q0: this.stage.controls.target.clone(), q1: target.clone() };
    this.invalidate();
  }

  /** Call every frame; returns true while flying. */
  update(now: number) {
    const f = this.fly; if (!f) return false;
    const k = Math.min(1, (now - f.t0) / (f.dur * 1000)), e = ease(k);
    this.stage.camera.position.lerpVectors(f.p0, f.p1, e);
    this.stage.controls.target.lerpVectors(f.q0, f.q1, e);
    this.stage.camera.lookAt(this.stage.controls.target);
    if (k >= 1) this.fly = null;
    return true;
  }

  zoom(factor: number) {
    const c = this.stage.controls, cam = this.stage.camera;
    const off = cam.position.clone().sub(c.target);
    const d = Math.min(c.maxDistance, Math.max(c.minDistance, off.length() * factor));
    this.flyTo(c.target.clone().add(off.setLength(d)), c.target.clone(), 0.25);
  }

  /** Frame a box from the current viewing direction. */
  fitBox(b: Box3, dur = 0.7) {
    if (b.isEmpty()) return;
    const cam = this.stage.camera, c = this.stage.controls;
    const center = b.getCenter(new Vector3()), r = Math.max(4, b.getSize(new Vector3()).length() / 2);
    const vfov = cam.fov * Math.PI / 180, hfov = 2 * Math.atan(Math.tan(vfov / 2) * cam.aspect);
    const dist = r / Math.sin(Math.min(vfov, hfov) / 2) * 1.05;
    const dir = cam.position.clone().sub(c.target); if (dir.lengthSq() < 1e-6) dir.set(1, 0.6, 1);
    this.flyTo(center.clone().add(dir.setLength(dist)), center, dur);
  }

  fitTractor() { this.fitBox(this.model.bounds('vehicle')); }

  /** A named preset, moved along with the tractor (it drives around in a few steps). */
  view(name: string) {
    const p = CAMERA_PRESETS[name]; if (!p) return;
    const shop = ['bench', 'shelf'].includes(name);
    const v = shop ? new Vector3() : this.model.vehicle.getWorldPosition(new Vector3()).setY(0);
    const pos = new Vector3(...p.position).add(v), tgt = new Vector3(...p.target).add(v);
    const off = pos.clone().sub(tgt);
    if (Math.abs(off.x) + Math.abs(off.z) < 0.05 * off.length()) off.z -= 0.02 * off.length();
    const k = name === 'driver' ? 1 : this.rig.framing();
    this.flyTo(tgt.clone().add(off.multiplyScalar(k)), tgt);
  }
}

export const QUICK_VIEWS: [string, string][] = [
  ['front3q', 'Front'], ['leftSide', 'Side'], ['rear3q', 'Rear'], ['top', 'Top'],
  ['engineBay', 'Engine'], ['frontEndLow', 'Front end'], ['underside', 'Under'], ['driver', 'Driver'], ['bench', 'Bench'], ['shelf', 'Shelf'],
];
