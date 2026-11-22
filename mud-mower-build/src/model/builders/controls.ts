import { CylinderGeometry, Mesh, SpotLight, Object3D, SphereGeometry } from 'three';
import type { PartDef } from '../registry';
import { keep, mats, solid } from '../../scene/materials';
import { boxAt, cylX, group, rod } from './util';

// Phases 7–8: brakes, cutting brakes, kill tether, electrical, lights (vehicle-local).
const HID = { defaultState: 'hidden' as const, parent: 'vehicle' };

/** A light: lens + a SpotLight (intensity driven by the `lights` action). */
function lamp(w: number, h: number, beamAngle: number) {
  const lens = boxAt(mats.lens(), [-w / 2, -h / 2, 0], [w / 2, h / 2, 0.5]);
  lens.name = 'lens';
  const body = boxAt(solid('#1b1b1b', 0.5, 0.5), [-w / 2 - 0.2, -h / 2 - 0.2, -1.6], [w / 2 + 0.2, h / 2 + 0.2, 0]);
  const spot = new SpotLight('#fff6e0', 0, 900, beamAngle, 0.5, 1.2);
  spot.name = 'spot'; spot.position.set(0, 0, 0.6);
  const target = new Object3D(); target.position.set(0, -6, 60); spot.target = target;
  return group(body, lens, spot, target);
}

export const controlParts: PartDef[] = [
  // ---- 7.1 hydraulic foot brake ----
  { ...HID, parent: 'transaxle2300', id: 'brakeDiscTrans', pivot: [-7.5, -1.5, 3], build: () => group(cylX(solid('#9a9da0', 0.35, 0.8), 2.6, 0.2, 28), cylX(solid('#5c5f62', 0.5, 0.6), 0.9, 0.4, 14)) },
  { ...HID, parent: 'transaxle2300', id: 'caliperTrans', pivot: [-7.5, -1.5, 3], build: () => group(boxAt(solid('#b8b8b8', 0.35, 0.8), [-0.7, 1.5, -1.2], [0.7, 3.0, 1.2]), boxAt(mats.rawSteel(), [-0.2, 2.6, -1.2], [0.6, 3.6, 2.6])) },
  { ...HID, id: 'brakePedal', pivot: [-9, 10.7, 21.5], build: () => group(rod(mats.black(), [0, 0, 0], [0, 3.6, 2.4], 0.27), boxAt(solid('#222', 0.6, 0.4), [-1.8, 3.4, 1.8], [1.8, 3.8, 4.4])) },
  { ...HID, id: 'masterCylinder', build: () => group(rod(solid('#bdbdbd', 0.3, 0.8), [-9, 11.4, 17], [-9, 11.4, 20.8], 0.55), boxAt(keep(solid('#e9e4cf', 0.3, 0)), [-9.6, 12, 17.3], [-8.4, 13.5, 18.6])) },
  // ---- 7.2 cutting brakes ----
  ...([-1, 1] as const).map((k, i): PartDef => ({
    ...HID, id: i ? 'cutLeverR' : 'cutLeverL', pivot: [-10.6 - i * 1.6, 24.5, -1 + i * 0.2],
    build: () => group(rod(mats.zinc(), [0, 0, 0], [0, 9, 2], 0.3), (() => { const h = new Mesh(new CylinderGeometry(0.5, 0.5, 3, 12), keep(solid(k < 0 ? '#b8281e' : '#1f4fa8', 0.6, 0))); h.position.set(0, 10, 2.2); return h; })()),
  })),
  { ...HID, id: 'parkRatchet', build: () => group(boxAt(mats.rawSteel(), [-13, 23.4, -2.5], [-10, 24.6, 1]), boxAt(mats.zinc(), [-12.8, 24.6, -2.3], [-10.2, 25.4, -2])) },
  // ---- 7.3 controls ----
  { ...HID, id: 'killTether', pivot: [3, 29.6, 31], build: () => group(boxAt(keep(solid('#d22', 0.5, 0.1)), [-0.7, 0, -0.7], [0.7, 0.9, 0.7]), rod(keep(solid('#d22', 0.5, 0.1)), [0, 0.9, 0], [0.5, 1.4, -4], 0.12), (() => { const c = new Mesh(new SphereGeometry(0.35, 10, 8), mats.zinc()); c.position.set(0.5, 1.4, -4.2); return c; })()) },
  { ...HID, id: 'keySwitch', build: () => group(cylX(mats.zinc(), 0.5, 0.6, 14), boxAt(mats.zinc(), [0.3, -0.1, -0.5], [0.4, 0.1, 0.5])).translateX(-3).translateY(29.9).translateZ(30.8) },
  // ---- 8.1 power ----
  { ...HID, id: 'batteryBox', build: () => group(boxAt(solid('#1c1c1c', 0.7, 0.1), [-3.8, 14.3, -9.5], [3.8, 21.8, -3.5]), boxAt(mats.zinc(), [-4, 21.6, -7], [4, 21.9, -6.2])) },
  { ...HID, id: 'batteryNew', build: () => group(boxAt(solid('#2a2a2a', 0.6, 0.1), [-3.4, 14.6, -9.1], [3.4, 20.8, -3.9]), boxAt(mats.red(), [1.4, 20.8, -6.9], [2.4, 21.3, -6.1]), boxAt(solid('#222', 0.5, 0.3), [-2.4, 20.8, -6.9], [-1.4, 21.3, -6.1])) },
  { ...HID, id: 'mainFuse', build: () => group(boxAt(keep(solid('#c9302c', 0.4, 0.1)), [3.9, 18.6, -6.6], [5.2, 20.4, -5.6])) },
  { ...HID, id: 'fuseBlock', build: () => group(boxAt(solid('#2f2f2f', 0.5, 0.2), [-4.2, 22, 26.5], [-1.2, 23, 28.5]), ...[0, 1, 2, 3, 4, 5].map(i => boxAt(keep(solid(['#e33', '#fb3', '#3b3', '#38f', '#e33', '#fb3'][i], 0.4, 0)), [-4 + i * 0.47, 23, 27.1], [-3.7 + i * 0.47, 23.5, 27.9]))) },
  { ...HID, id: 'relayLights', build: () => group(boxAt(solid('#111', 0.5, 0.2), [-1, 22, 26.6], [0.4, 23.4, 28])) },
  { ...HID, id: 'switchPanel', build: () => group(boxAt(solid('#141414', 0.5, 0.3), [-3.6, 28.2, 30.2], [3.6, 30.2, 30.5]), ...[-2.4, -0.8, 0.8, 2.4].map(x => boxAt(mats.zinc(), [x - 0.25, 28.9, 30.5], [x + 0.25, 29.5, 31.1]))) },
  // ---- 8.2 lights ----
  ...([-1, 1] as const).map((sd): PartDef => ({ ...HID, id: sd < 0 ? 'headlightL' : 'headlightR', pivot: [sd * 6, 21.5, 70.2], build: () => lamp(3, 2.2, 0.45) })),
  { ...HID, id: 'lightBar', pivot: [0, 28.6, 70], build: () => lamp(16, 1.8, 0.9) },
  { ...HID, id: 'tailLight', pivot: [0, 12.5, -24.6], build: () => group(boxAt(mats.redLens(), [-1.5, -0.8, -0.4], [1.5, 0.8, 0])) },
];
void Mesh;
