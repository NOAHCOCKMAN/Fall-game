import { Vector3 } from 'three';
import type { Vec3 } from '../steps/types';

// Named points, axes, seams, cut lines and measurement endpoints.
// A single-point anchor is a point; 2+ points form a polyline (seam / cut / axis).
// Units: inches. +Y up, +Z forward, +X driver's right, origin on the ground under the rear axle.
export const anchors: Record<string, Vec3[]> = {
  'pt.origin': [[0, 0, 0]],
  'pt.rearAxleCenter': [[0, 11.5, 0]],
  'pt.hoodTop': [[0, 31, 48]],
  // ---- M1 demo anchors (replaced by the real model in M2) ----
  'seam.demo.bracketTop': [[-6.72, 12.3, 20.5], [-6.72, 12.3, 27.5]],
  'seam.demo.bracketEnds': [[-6.72, 12.3, 20.2], [-6.72, 8.5, 20.2]],
  'pt.demo.bracket': [[-7, 10, 24]],
};

export function hasAnchor(name: string): boolean { return name in anchors; }

export function anchorPoints(name: string): Vector3[] {
  const a = anchors[name];
  if (!a) throw new Error(`Unknown anchor: ${name}`);
  return a.map(p => new Vector3(p[0], p[1], p[2]));
}

export function anchorCenter(name: string): Vector3 {
  const pts = anchorPoints(name);
  const c = new Vector3();
  pts.forEach(p => c.add(p));
  return c.multiplyScalar(1 / pts.length);
}
