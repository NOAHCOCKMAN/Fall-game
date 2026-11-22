import { Vector3, type PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Vec3 } from '../steps/types';

// A5.6 camera presets: position -> target.
export const CAMERA_PRESETS: Record<string, { position: Vec3; target: Vec3 }> = {
  overview:     { position: [80, 55, 110],  target: [0, 16, 24] },
  front3q:      { position: [55, 32, 115],  target: [0, 16, 40] },
  rear3q:       { position: [-55, 34, -60], target: [0, 16, 5] },
  leftSide:     { position: [-110, 26, 24], target: [0, 16, 24] },
  top:          { position: [0, 140, 25],   target: [0, 0, 25] },
  engineBay:    { position: [32, 48, 58],   target: [0, 24, 46] },
  frontEndLow:  { position: [34, 10, 88],   target: [0, 12, 46] },
  knuckleClose: { position: [6, 16, 66],    target: [14, 12, 47] },
  underside:    { position: [0, -40, 30],   target: [0, 12, 26] },
  rearLow:      { position: [26, 10, -40],  target: [0, 12, 0] },
  driver:       { position: [0, 47, -5],    target: [0, 24, 42] },   // spec [0,40,-6]→[0,20,40], raised for the +4 in stance
  bench:        { position: [100, 50, 30],  target: [100, 34, 0] },
  shelf:        { position: [140, 50, 90],  target: [100, 10, 30] },
};

/** Scripted camera driver. Any user touch on the viewport pauses scripted moves for the rest of the step. */
export class CameraRig {
  override = false;   // set by user interaction during a step
  noFrame = false;    // first-person presets (driver) are not pulled back
  freeCam = false;    // Free cam toggle: scripted moves off entirely
  onOverride: (() => void) | null = null;

  constructor(public camera: PerspectiveCamera, public controls: OrbitControls) {
    // a press alone (e.g. a tap to select a part) keeps the scripted camera; an actual drag / zoom takes it over
    let interacting = false;
    controls.addEventListener('start', () => { interacting = true; });
    controls.addEventListener('end', () => { interacting = false; });
    controls.addEventListener('change', () => {
      if (interacting && !this.override && !this.applying) { this.override = true; this.onOverride?.(); }
    });
  }

  get scripted() { return !this.override && !this.freeCam; }

  /** Presets are framed for a ~16:10 viewport; pull back on narrower ones (sidebar + panel, phones). */
  framing() { return Math.min(2.1, Math.max(1, 1.25 / this.camera.aspect)); }

  private applying = false;
  set(pos: Vector3, target: Vector3) {
    if (!this.scripted) return;
    this.applying = true; queueMicrotask(() => { this.applying = false; });
    this.lastPos.copy(pos); this.lastTarget.copy(target);
    const off = pos.clone().sub(target);
    // straight-down views: nudge so lookAt has a defined "up" (nose of the tractor at the top of the screen)
    if (Math.abs(off.x) + Math.abs(off.z) < 0.05 * off.length()) off.z -= 0.02 * off.length();
    let k = this.noFrame ? 1 : this.framing();
    // never pull back through the pegboard wall / props along it (Z ≈ -70)
    if (off.z < 0) k = Math.min(k, Math.max(1, (-50 - target.z) / off.z));
    this.camera.position.copy(target).addScaledVector(off, k);
    this.controls.target.copy(target);
    this.camera.lookAt(target);
  }

  private lastPos = new Vector3(80, 55, 110);
  private lastTarget = new Vector3(0, 16, 24);
  /** Unscaled scripted pose (so the next tween starts from the preset, not the pulled-back camera). */
  current() { return { position: this.lastPos.clone(), target: this.lastTarget.clone() }; }
}

export function resolveCameraKey(k: { preset?: string; position?: Vec3; target?: Vec3 }) {
  const p = k.preset ? CAMERA_PRESETS[k.preset] : undefined;
  if (k.preset && !p) throw new Error(`Unknown camera preset ${k.preset}`);
  const position = k.position ?? p!.position, target = k.target ?? p!.target;
  return { position: new Vector3(...position), target: new Vector3(...target) };
}
