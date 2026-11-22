import { CatmullRomCurve3, CylinderGeometry, Group, Mesh, PlaneGeometry, SphereGeometry, TubeGeometry, Vector3 } from 'three';
import type { PartDef } from '../registry';
import { keep, mats, solid } from '../../scene/materials';
import { ENGINE } from '../geom';
import { boxAt, cylZ, group, rod, spring } from './util';

// Phase 5 drivetrain (vehicle-local). Predator 420 PTO faces back; CVT behind it; driveshaft back to the transaxle input.
const HID = { defaultState: 'hidden' as const, parent: 'vehicle' };
type V3 = [number, number, number];
const steel = () => mats.rawSteel();
const E = ENGINE;

function predator() {
  // pivot at the block base center (0, baseY, 45). TODO(Noah): B2 says ≈18 W; kept 11.5 W so it fits the 17-in hood with the cage.
  const red = solid('#b32a1f', 0.45, 0.3), blk = solid('#2b2d30', 0.6, 0.4), al = mats.aluminum();
  const g = group(boxAt(blk, [-5.75, 0, -8], [5.75, 8, 8]));            // crankcase (16 L)
  g.add(boxAt(al, [-5, 8, -6], [3.5, 12.5, 4]));                         // cylinder + fins
  for (let i = 0; i < 5; i++) g.add(boxAt(al, [-5.4, 8.4 + i * 0.85, -6.2], [3.9, 8.75 + i * 0.85, 4.2]));
  g.add(boxAt(red, [-5, 12.5, -3], [5, 17, 6]));                          // fuel tank on top
  g.add((() => { const c = new Mesh(new CylinderGeometry(1, 1, 0.8, 12), mats.black()); c.position.set(2, 17.4, 2); return c; })());
  g.add((() => { const r = cylZ(red, 5.2, 2.4, 28); r.position.set(0, 4, 9.2); return r; })());   // recoil / fan housing forward
  g.add((() => { const p = cylZ(mats.zinc(), 0.5, 2.6, 14); p.position.set(0, E.crankY - E.baseY, -9.3); return p; })()); // 1-in PTO
  g.add(boxAt(solid('#1f1f1f', 0.5, 0.3), [-5.75, 1, 4], [-7.6, 5, 7]));   // electric-start box (left)
  return g;
}

function sheave(r: number, w: number) {
  const m = mats.aluminum();
  const a = new Mesh(new CylinderGeometry(r * 0.35, r, w / 2, 28), m); a.rotation.x = Math.PI / 2; a.position.z = -w / 4;
  const b = new Mesh(new CylinderGeometry(r, r * 0.35, w / 2, 28), m); b.rotation.x = Math.PI / 2; b.position.z = w / 4;
  return group(a, b);
}

/** Closed belt path around two pulleys (centers in the XY plane at Z = z). */
export function beltCurve(c1: V3, r1: number, c2: V3, r2: number) {
  const A = new Vector3(c1[0], c1[1], 0), B = new Vector3(c2[0], c2[1], 0);
  const d = A.distanceTo(B), th = Math.atan2(B.y - A.y, B.x - A.x), phi = Math.acos(Math.max(-1, Math.min(1, (r1 - r2) / d)));
  const pts: Vector3[] = [];
  const arc = (c: Vector3, r: number, a0: number, a1: number) => { for (let i = 0; i <= 12; i++) { const a = a0 + (a1 - a0) * (i / 12); pts.push(new Vector3(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c1[2])); } };
  arc(A, r1, th + phi, th + 2 * Math.PI - phi);   // big wrap around the driver (far side)
  arc(B, r2, th - phi, th + phi);                 // wrap around the driven (near side)
  return new CatmullRomCurve3(pts, true, 'catmullrom', 0.05);
}
export const CVT_R = { driverLow: 1.3, driverHigh: 3.2, drivenRadius: (ratio: number, rDriver: number) => ratio * rDriver };
export function driverRadiusFor(ratio: number) { return CVT_R.driverLow + (CVT_R.driverHigh - CVT_R.driverLow) * (2.8 - ratio) / (2.8 - 0.9); }

export const drivetrainParts: PartDef[] = [
  { ...HID, id: 'engineMountPlate', build: () => group(boxAt(steel(), [-5.06, 12.5, 37.2], [5.06, 12.75, 53.8])) },
  {
    ...HID, id: 'predator420', pivot: [0, E.baseY, E.center],
    build: predator,
  },
  {
    ...HID, parent: 'predator420', id: 'governorLever', pivot: [5.9, 10.5, 4],
    build: () => group(rod(mats.zinc(), [0, 0, 0], [1.2, 1.8, -0.4], 0.15), (() => { const h = new Mesh(new SphereGeometry(0.25, 8, 6), mats.zinc()); h.position.set(1.2, 1.8, -0.4); return h; })()),
  },
  { parent: 'predator420', id: 'carb', build: () => group(boxAt(solid('#8d8f91', 0.4, 0.7), [5.75, 5.2, 0.5], [7.6, 7.6, 3])) },
  { parent: 'predator420', id: 'airBox', build: () => group(boxAt(solid('#1e1e1e', 0.6, 0.2), [6, 7.6, -0.5], [7.9, 10.4, 4])) },
  { ...HID, id: 'cvtBackPlate', build: () => group(boxAt(steel(), [-2.5, 3.5, 36.6], [5, 20, 37.0])) },
  { ...HID, id: 'jackshaft', build: () => group(rod(mats.zinc(), [E.driven[0], E.driven[1], 36.7], E.jackshaftEnd, 0.5), boxAt(solid('#333', 0.5, 0.6), [E.driven[0] - 1, E.driven[1] - 1, 36.1], [E.driven[0] + 1, E.driven[1] + 1, 36.6])) },
  { ...HID, id: 'cvtDriver', pivot: E.driver, build: () => { const g = sheave(3.25, 2.2); g.add(cylZ(solid('#3c3f44', 0.4, 0.6), 2.2, 2, 20)); g.children[2].position.z = 1.8; g.add(boxAt(mats.black(), [-0.2, 2.8, -1.1], [0.2, 3.4, 1.1])); return g; } },
  { ...HID, id: 'cvtDriven', pivot: E.driven, build: () => { const g = sheave(3.75, 2.4); g.add(spring(solid('#e0b21c', 0.4, 0.5), 1.2, 1.6, 4, 0.12)); g.children[2].rotation.x = Math.PI / 2; g.children[2].position.z = -2.6; g.add(boxAt(mats.black(), [-0.2, 3.1, -1.2], [0.2, 3.7, 1.2])); return g; } },
  {
    // geometry is rebuilt by cvtShift (wrap radii follow the ratio); default = low ratio at idle
    ...HID, id: 'cvtBelt',
    build: () => {
      const r1 = driverRadiusFor(2.8), r2 = 2.8 * r1;
      return group(new Mesh(new TubeGeometry(beltCurve(E.driver, r1, E.driven, Math.min(3.6, r2)), 90, 0.28, 6, true), keep(solid('#262626', 0.85, 0))));
    },
  },
  {
    ...HID, id: 'cvtGuard', tags: ['xray'],
    build: () => {
      const m = solid('#3b3d40', 0.5, 0.6);
      const g = group(boxAt(m, [-4.3, 2.8, 33.4], [6.6, 21, 33.6]), boxAt(m, [-4.3, 2.8, 33.6], [-4.1, 21, 37.6]), boxAt(m, [6.4, 2.8, 33.6], [6.6, 21, 37.6]), boxAt(m, [-4.3, 20.8, 33.6], [6.6, 21, 37.6]), boxAt(m, [-4.3, 2.8, 33.6], [6.6, 3.0, 37.6]));
      for (let y = 6; y < 20; y += 2.2) g.add(boxAt(solid('#111', 0.9, 0), [-2, y, 33.35], [4.5, y + 0.7, 33.4]));   // vents
      return g;
    },
  },
  // ---- driveline (Layout A) ----
  { ...HID, id: 'uJointF', pivot: E.jackshaftEnd, build: () => uj() },
  {
    ...HID, id: 'driveshaft',
    build: () => {
      const a: V3 = [E.jackshaftEnd[0], E.jackshaftEnd[1], E.jackshaftEnd[2] - 0.9], b: V3 = [E.transInput[0], E.transInput[1], E.transInput[2] + 0.9];
      const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      const tube = rod(steel(), a, mid, 0.5);
      const slip = rod(mats.zinc(), mid, b, 0.42); slip.name = 'slipYoke';
      const sleeve = rod(steel(), [mid[0], mid[1], mid[2] + 1.6], [mid[0], mid[1], mid[2] - 1.6], 0.62);
      return group(tube, slip, sleeve);
    },
  },
  { ...HID, id: 'uJointR', pivot: E.transInput, build: () => uj() },
  {
    ...HID, id: 'driveshaftHoop',
    build: () => {
      const z = 20, t = (z - E.transInput[2]) / (E.jackshaftEnd[2] - E.transInput[2]);
      const x = E.transInput[0] + (E.jackshaftEnd[0] - E.transInput[0]) * t, y = E.transInput[1] + (E.jackshaftEnd[1] - E.transInput[1]) * t;
      const g = group();
      const pts: V3[] = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + (i / 16) * Math.PI; pts.push([x + Math.cos(a) * 1.9, y + Math.sin(a) * 1.9, z]); }
      for (let i = 0; i + 1 < pts.length; i++) g.add(boxAt(steel(), [Math.min(pts[i][0], pts[i + 1][0]) - 0.12, Math.min(pts[i][1], pts[i + 1][1]) - 0.12, z - 0.75], [Math.max(pts[i][0], pts[i + 1][0]) + 0.12, Math.max(pts[i][1], pts[i + 1][1]) + 0.12, z + 0.75]));
      g.add(boxAt(steel(), [x - 2, y, z - 0.75], [x - 1.76, 9.6, z + 0.75]), boxAt(steel(), [x + 1.76, y, z - 0.75], [x + 2, 9.6, z + 0.75]));
      g.add(boxAt(steel(), [-5.06, 9.4, z - 0.75], [5.06, 9.6, z + 0.75]));
      return g;
    },
  },
  // ---- throttle ----
  {
    ...HID, id: 'throttlePedal', pivot: [9, 10.7, 21.5],
    build: () => group(rod(mats.black(), [0, 0, 0], [0, 3.2, 2.4], 0.25), boxAt(solid('#222', 0.6, 0.4), [-1.4, 3, 1.6], [1.4, 3.4, 4.6])),
  },
  {
    ...HID, id: 'returnSprings',
    build: () => { const a = spring(mats.zinc(), 0.3, 2.2, 8, 0.06); a.position.set(9.6, 10.8, 21); a.rotation.x = 0.6; const b = spring(mats.zinc(), 0.3, 2.2, 8, 0.06); b.position.set(6.4, 23, 47.6); b.rotation.z = 1.2; return group(a, b); },
  },
  // ---- fuel ----
  { ...HID, id: 'fuelCell', pivot: [0, 24, -17], build: () => group(boxAt(solid('#c22a1b', 0.4, 0.2), [-4, 0, -2.5], [4, 6, 2.5]), (() => { const c = new Mesh(new CylinderGeometry(0.9, 0.9, 0.9, 14), mats.black()); c.position.set(2, 6.4, 0); return c; })()) },
  { ...HID, id: 'fuelShutoff', build: () => group(boxAt(solid('#c0902a', 0.4, 0.8), [2.2, 22.6, -14.6], [3.2, 23.6, -13.8])) },
  { ...HID, id: 'fuelFilter', build: () => group(rod(keep(solid('#e8e3cf', 0.2, 0.1)), [6.2, 15.6, 2], [6.2, 15.6, 4.6], 0.55)) },
  // ---- exhaust + intake ----
  { ...HID, id: 'exhaustHeader', build: () => group(...[rod(solid('#8a6a4a', 0.6, 0.6), [-5, 21, 48], [-8.2, 18, 52], 0.55), rod(solid('#8a6a4a', 0.6, 0.6), [-8.2, 18, 52], [-10.2, 14.6, 55], 0.55)]) },
  { ...HID, id: 'sparkArrestor', build: () => { const m = cylZ(solid('#2d2d2d', 0.7, 0.5), 2.0, 8, 18); m.position.set(-10.6, 14.2, 59.5); return group(m, rod(solid('#2d2d2d', 0.7, 0.5), [-10.6, 14.2, 63.5], [-10.6, 14.2, 65], 0.4)); } },
  {
    ...HID, id: 'heatShield',
    build: () => { const m = solid('#b9bcbf', 0.4, 0.8); const g = group(boxAt(m, [-13, 12, 55], [-12.8, 16.5, 64])); for (let z = 56; z < 63.5; z += 1.2) for (let y = 12.8; y < 16; y += 1.2) g.add(boxAt(solid('#222', 0.9, 0), [-13.05, y, z], [-13, y + 0.4, z + 0.4])); return g; },
  },
  { ...HID, id: 'snorkelFilter', build: () => { const f = new Mesh(new CylinderGeometry(1.6, 1.6, 3.4, 16), keep(solid('#c8c0a0', 0.9, 0))); f.rotation.x = Math.PI / 2; f.position.set(4.5, 29.4, 38.6); return group(f); } },
  {
    ...HID, id: 'waterPlane', parent: undefined, tags: ['prop'],
    build: () => { const p = new Mesh(new PlaneGeometry(220, 220), keep(solid('#3f7fb5', 0.1, 0.1))); (p.material as import('three').MeshStandardMaterial).transparent = true; (p.material as import('three').MeshStandardMaterial).opacity = 0.45; p.rotation.x = -Math.PI / 2; p.userData.noShadow = true; return group(p); },
  },
];

function uj() {
  const y = solid('#3d3f42', 0.4, 0.7);
  return group(new Mesh(new SphereGeometry(0.62, 12, 10), y), boxAt(y, [-0.16, -0.95, -0.55], [0.16, 0.95, 0.55]), boxAt(y, [-0.55, -0.95, -0.16], [0.55, 0.95, 0.16]));
}
void Group;
