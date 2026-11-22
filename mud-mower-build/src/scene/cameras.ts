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
  driver:       { position: [0, 40, -6],    target: [0, 20, 40] },
  bench:        { position: [100, 50, 30],  target: [100, 34, 0] },
  shelf:        { position: [140, 50, 90],  target: [100, 10, 30] },
};

/** Scripted camera driver. Any user touch on the viewport pauses scripted moves for the rest of the step. */
export class CameraRig {
  override = false;   // set by user interaction during a step
  freeCam = false;    // Free cam toggle: scripted moves off entirely
  onOverride: (() => void) | null = null;

  constructor(public camera: PerspectiveCamera, public controls: OrbitControls) {
    controls.addEventListener('start', () => {
      if (!this.override) { this.override = true; this.onOverride?.(); }
    });
  }

  get scripted() { return !this.override && !this.freeCam; }

  set(pos: Vector3, target: Vector3) {
    if (!this.scripted) return;
    this.camera.position.copy(pos);
    this.controls.target.copy(target);
    this.camera.lookAt(target);
  }

  current() { return { position: this.camera.position.clone(), target: this.controls.target.clone() }; }
}

export function resolveCameraKey(k: { preset?: string; position?: Vec3; target?: Vec3 }) {
  const p = k.preset ? CAMERA_PRESETS[k.preset] : undefined;
  if (k.preset && !p) throw new Error(`Unknown camera preset ${k.preset}`);
  const position = k.position ?? p!.position, target = k.target ?? p!.target;
  return { position: new Vector3(...position), target: new Vector3(...target) };
}
