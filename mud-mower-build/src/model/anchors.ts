import { Vector3 } from 'three';
import type { Vec3 } from '../steps/types';

/**
 * Named points, axes, seams, cut lines, fastener sets and measurement endpoints.
 * A single point is a point; 2+ points form a polyline (seam / cut / axis / path) or a set (fasteners, holes).
 * Coordinates are in the local space of `space` (default: the 'vehicle' part, whose origin is on the ground
 * under the rear axle — so anchors follow the tractor when it is jacked up). `space: 'world'` = shop floor.
 * `normal` = approach direction for bolts / drills (default +Y).
 */
export interface AnchorDef { pts: Vec3[]; space?: string; normal?: Vec3; }

const A = (pts: Vec3[], o: Omit<AnchorDef, 'pts'> = {}): AnchorDef => ({ pts, ...o });
const W = (pts: Vec3[], o: Omit<AnchorDef, 'pts' | 'space'> = {}): AnchorDef => ({ pts, space: 'world', ...o });

export const anchors: Record<string, AnchorDef> = {
  // ---------- general points ----------
  'pt.origin': A([[0, 0, 0]]),
  'pt.rearAxleCenter': A([[0, 11.5, 0]]),
  'pt.frontAxleStock': A([[0, 8, 44]]),
  'pt.hoodTop': A([[0, 31, 48]]),
  'pt.frameFront': A([[0, 12.5, 58]]),
  'pt.frameMid': A([[-6.5, 12.5, 24]]),
  'pt.railL.rear': A([[-6.5, 12.5, -10]]),
  'pt.railR.rear': A([[6.5, 12.5, -10]]),
  'pt.railL.front': A([[-6.5, 12.5, 60]]),
  'pt.railR.front': A([[6.5, 12.5, 60]]),
  'pt.axlesRear': A([[13, 11.5, 0]]),
  'pt.crack': A([[-6.6, 10.6, 46]], { normal: [-1, 0, 0] }),
  'seam.crack': A([[-6.62, 10.0, 45.5], [-6.62, 11.4, 46.5]]),

  // ---------- axes ----------
  'axis.transInput': A([[0, 12, 6], [0, 12, 15]]),
  'axis.crank': A([[0, 18, 36], [0, 18, 56]]),

  // ---------- measurements (2-point anchors = dimension endpoints) ----------
  'meas.wheelbase': A([[-21, 3, 0], [-21, 3, 44]]),
  'meas.trackRear': A([[-15, 11.5, 0], [15, 11.5, 0]]),
  'meas.trackFront': A([[-13, 8, 44], [13, 8, 44]]),
  'meas.frameWidth': A([[-6.5, 12.5, 20], [6.5, 12.5, 20]]),
  'meas.hoodHeight': A([[9.8, 0, 50], [9.8, 31, 50]]),
  'meas.diag1': A([[-6.5, 12.6, -10], [6.5, 12.6, 60]]),
  'meas.diag2': A([[6.5, 12.6, -10], [-6.5, 12.6, 60]]),

  // ---------- traced paths ----------
  'path.hoodProfile': A([[8.7, 17, 34.2], [8.7, 31, 34.2], [8.7, 31.2, 50], [8.7, 30.6, 58], [8.7, 28.6, 61.2], [8.7, 25, 62.6], [8.7, 20, 62.6], [8.7, 17.2, 61.5]]),

  // ---------- fastener sets ----------
  'fast.battery': A([[-1.6, 20.4, 35.5], [1.6, 20.4, 35.5]]),
  'fast.hoodHinge': A([[-7.6, 17, 61], [7.6, 17, 61]], { normal: [1, 0, 0] }),
  'fast.fenderDeck': A([[-7.5, 24.3, 6], [7.5, 24.3, 6], [-7.5, 24.3, -8], [7.5, 24.3, -8]]),
  'fast.engineMount': A([[-5.5, 12.7, 40], [5.5, 12.7, 40], [-5.5, 12.7, 50], [5.5, 12.7, 50]]),
  'fast.axlePivot': A([[0, 8.6, 45.6]], { normal: [0, 0, 1] }),
  'fast.transMount': A([[-6.7, 11, -4], [-6.7, 11, 4], [6.7, 11, -4], [6.7, 11, 4]], { normal: [1, 0, 0] }),

  // ---------- penetrating-oil spray points (1.1) ----------
  'mist.bolts': A([[0, 17, 61.5], [-7.5, 24.5, 6], [-5.5, 13, 40], [0, 8.6, 45.8], [-6.8, 11, -4], [6.8, 11, 4]]),

  // ---------- shop (world space) ----------
  'bench.top': W([[100, 34, 0]]),
  'shop.extinguisher': W([[66, 18, -48]]),
  'shop.flammables': W([[-60, 2, -60]]),
  'shop.fan': W([[-80, 30, -60]]),
  'shop.standsFrontL': W([[-5.9, 0, 50]]),
  'shop.standsFrontR': W([[5.9, 0, 50]]),
  'shop.standsRearL': W([[-5.9, 0, -6]]),
  'shop.standsRearR': W([[5.9, 0, -6]]),
  'shop.jackRear': W([[0, 0, -12.5]]),
  'shop.jackTrans': W([[0, 0, 1]]),
};

export function hasAnchor(name: string): boolean { return name in anchors; }

export function anchorDef(name: string): AnchorDef {
  const a = anchors[name];
  if (!a) throw new Error(`Unknown anchor: ${name}`);
  return a;
}

/** Points in the anchor's own space (no transform). */
export function anchorLocal(name: string): Vector3[] {
  return anchorDef(name).pts.map(p => new Vector3(p[0], p[1], p[2]));
}

export function centerOf(pts: Vector3[]) {
  const c = new Vector3();
  pts.forEach(p => c.add(p));
  return c.multiplyScalar(1 / Math.max(1, pts.length));
}
