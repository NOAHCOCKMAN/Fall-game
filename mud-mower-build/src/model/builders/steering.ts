import { CylinderGeometry, Mesh, SphereGeometry } from 'three';
import type { PartDef } from '../registry';
import { mats, solid } from '../../scene/materials';
import { FRONT } from '../geom';
import { boxAt, group, rod } from './util';
import { linkRod } from './frontEnd';

// 4.6–4.7: new steering down the LEFT side of the engine bay. Reuses the stock steering wheel (pivot 0, 38, 20).
const HID = { defaultState: 'hidden' as const, parent: 'vehicle' };
type V3 = [number, number, number];
export const STEER: Record<string, V3> = {
  hub: [0, 37.3, 20.5], uUpper: [-1.5, 29, 30], uLower: [-7.9, 16, 44], bearing: [-7.9, 14.4, 45.6],
};
const P = FRONT.pitman;
const shaft = () => mats.zinc();
function uj() {
  const y = solid('#3d3f42', 0.4, 0.7);
  return group(new Mesh(new SphereGeometry(0.6, 12, 10), y), boxAt(y, [-0.15, -0.9, -0.5], [0.15, 0.9, 0.5]), boxAt(y, [-0.5, -0.9, -0.15], [0.5, 0.9, 0.15]));
}

export const steeringParts: PartDef[] = [
  { ...HID, id: 'steerShaftUpper', build: () => group(rod(shaft(), STEER.hub, STEER.uUpper, 0.375)) },
  { ...HID, id: 'uJointUpper', pivot: STEER.uUpper, build: uj },
  { ...HID, id: 'steerShaftMid', build: () => group(rod(shaft(), STEER.uUpper, STEER.uLower, 0.375)) },
  { ...HID, id: 'uJointLower', pivot: STEER.uLower, build: uj },
  {
    ...HID, id: 'steerSupportBearing', pivot: STEER.bearing,
    build: () => group(boxAt(solid('#2f2f2f', 0.5, 0.5), [-1.2, -0.4, -1.2], [1.2, 0.4, 1.2]), boxAt(mats.rawSteel(), [1.2, -0.3, -0.8], [1.5, 0.3, 0.8])),
  },
  { ...HID, id: 'steerShaftLower', build: () => group(rod(shaft(), STEER.uLower, [P[0], P[1] + 0.4, P[2]], 0.375)) },
  {
    // pitman arm swings in a near-horizontal plane; ball end marker drives the drag link
    ...HID, id: 'pitmanArm', pivot: P,
    build: () => {
      const m = mats.rawSteel();
      const g = group(rod(m, [0, 0, 0], [3.5, -0.4, -0.8], 0.35), (() => { const h = new Mesh(new CylinderGeometry(0.6, 0.6, 0.8, 14), m); return h; })());
      const ball = new Mesh(new SphereGeometry(0.1), m); ball.name = 'ball'; ball.position.set(3.5, -0.4, -0.8); ball.userData.noBounds = true; g.add(ball);
      return g;
    },
  },
  { ...HID, id: 'dragLink', build: () => linkRod(0.375, 0.42) },
  { ...HID, id: 'tieRod', build: () => linkRod(0.375, 0.42) },
];
