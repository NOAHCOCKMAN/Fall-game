import { Matrix4, Vector3 } from 'three';

/**
 * Final stance (set in 2.2 and kept from then on): the 'vehicle' group sits +4 in up and nose-up 1.23°,
 * so the frame bottom is 13.5 in at the rear axle and ≈ 15 in at the front.
 * Part B2 gives final positions in WORLD inches; `fin()` converts them to vehicle-local coordinates.
 */
export const STANCE = { y: 4, pitchDeg: -1.23 };
const W = new Matrix4().makeTranslation(0, STANCE.y, 0).multiply(new Matrix4().makeRotationX(STANCE.pitchDeg * Math.PI / 180));
const Winv = W.clone().invert();
export function fin(x: number, y: number, z: number): [number, number, number] {
  const v = new Vector3(x, y, z).applyMatrix4(Winv);
  return [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
}

// ---------------- rear (vehicle-local) ----------------
/** Transaxle lowered 3 in relative to the frame (3.2): axle center local Y 8.5 (world ≈ 12.5 with 26-in tires). */
export const REAR = { axleY: 8.5, drop: 3, wheelX: 17, tireDia: 26, tireW: 11, hubX: 12.4, discX: 13.4 };

// ---------------- front (vehicle-local) ----------------
// TODO(Noah): B2 puts the beam center at world Y 14.5, which is inside the frame rails (frame bottom ≈ 14.5 there).
// The beam is modeled 1 in lower (world 13.5) so it clears the rails at ride height; spindles stay 2 in below the
// kingpin center, so wheel centers sit at world 11.5 (25-in tires squat ~1 in at 5–7 psi).
const APEX = fin(0, 13, 27);
const BEAM = fin(0, 13.5, 47);
export const FRONT = {
  apex: APEX,                                           // wishbone apex = front axle assembly pivot
  beamRel: [0, BEAM[1] - APEX[1], BEAM[2] - APEX[2]] as [number, number, number],   // beam center, relative to the apex
  kpX: 12,                                              // kingpin axes at X = ±12 (24-in spacing)
  casterDeg: 6,                                         // kingpin top leans rearward
  spindleDrop: 2,                                       // spindle 2 in below kingpin center
  wheelOut: 4,                                          // wheel center 4 in outboard of the kingpin (X = ±16)
  tireDia: 25, tireW: 8,
  wheelbase: 47, kpSpacing: 24,
  steerArm: 5,
  towerY: fin(8, 26, 47)[1],
  pitman: [-7, fin(-7, 12, 51)[1], 51] as [number, number, number],   // TODO(Noah): B2 says Z = 49; moved to 51 to clear the panhard tab at Z 47.4–49.6
};

/** Ackermann: cot(outer) − cot(inner) = kingpin spacing / wheelbase. Degrees in, degrees out. */
export function ackermannOuter(innerDeg: number) {
  if (Math.abs(innerDeg) < 1e-6) return 0;
  const i = Math.abs(innerDeg) * Math.PI / 180;
  const cotO = 1 / Math.tan(i) + FRONT.kpSpacing / FRONT.wheelbase;
  return Math.sign(innerDeg) * Math.atan(1 / cotO) * 180 / Math.PI;
}

// ---------------- engine / CVT (vehicle-local) ----------------
/** Engine sits on a 1/4 plate on the engine crossmembers (top Y 12.5). Crank along Z, PTO end at the rear (Z 37). */
export const ENGINE = {
  baseY: 12.75, crankY: 16.75, pto: 37, center: 45,
  driver: [0, 16.75, 35.5] as [number, number, number],
  // TODO(Noah): B2's driven-pulley offset (X +7, Y −5) puts the pulley and jackshaft through the right rail; it's
  // placed (X +2.1, Y −9.55) — still 9.8 in from the crank — so the jackshaft runs between the rails.
  driven: [2.1, 7.2, 35.5] as [number, number, number],
  jackshaftEnd: [2.1, 7.2, 33.2] as [number, number, number],
  transInput: [0, 9.0, 8.4] as [number, number, number],
};
