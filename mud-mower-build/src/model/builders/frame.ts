import { CylinderGeometry, Group, Mesh, SphereGeometry } from 'three';
import type { PartDef } from '../registry';
import { mats, solid } from '../../scene/materials';
import { boxAt, group, rod } from './util';

// Phase 2 frame parts (Part B2), in vehicle-local coordinates: rail bottom Y = 9.5, top Y = 12.5, rails' outer faces X = ±6.5.
// B2 lists final world positions with the frame at ride height (+4 in at the rear axle, nose up ~1.2°).
const V = { parent: 'vehicle' as const };
const steel = () => mats.rawSteel();
const HID = { ...V, defaultState: 'hidden' as const };

/** Square crossmember between the boxed rails at Z = z. */
function xMember(z: number, size: number, topY = 12.5) {
  const hw = z > -4 && z < 52 ? 5.06 : 5.25;     // boxed section is Z −4…52
  return group(boxAt(steel(), [-hw, topY - size, z - size / 2], [hw, topY, z + size / 2]));
}

function holePlate(min: [number, number, number], max: [number, number, number]) {
  return boxAt(steel(), min, max);
}

export const frameParts: PartDef[] = [
  // 2.3 — 3/16 × 3 flat bar closing the open (inner) side of each rail, Z −4 → 52
  { ...HID, id: 'boxPlateL', build: () => group(holePlate([-5.25, 9.5, -4], [-5.06, 12.5, 52])) },
  { ...HID, id: 'boxPlateR', build: () => group(holePlate([5.06, 9.5, -4], [5.25, 12.5, 52])) },

  // 2.4 — crossmembers
  { ...HID, id: 'xEngineF', build: () => xMember(38, 1.5) },
  { ...HID, id: 'xEngineR', build: () => xMember(53, 1.5) },
  { ...HID, id: 'xFrontSusp', build: () => xMember(28, 2) },
  {
    // wishbone apex bracket: two 3/8 ears (double shear), 5/8 hole; apex pivot at (0, 8.6, 27)
    ...HID, id: 'apexBracket', pivot: [0, 8.6, 27],
    build: () => {
      const g = group();
      for (const x of [-0.75, 0.75]) g.add(boxAt(steel(), [x - 0.19, -1.1, -1.2], [x + 0.19, 1.9, 1.4]));
      const bolt = new Mesh(new CylinderGeometry(0.31, 0.31, 2.4, 12), mats.zinc()); bolt.rotation.z = Math.PI / 2; g.add(bolt);
      return g;
    },
  },
  {
    // panhard frame tab — LEFT rail at the new front axle position (B2: X = −6.5, Z = 48.5)
    ...HID, id: 'panhardTab', pivot: [-6.7, 8.2, 48.5],
    build: () => {
      const hole = new Group(); hole.name = 'hole'; hole.position.set(0, -0.4, 0);
      return group(boxAt(steel(), [-0.19, -1.4, -1.1], [0.19, 1.4, 1.1]), (() => { const h = new Mesh(new CylinderGeometry(0.33, 0.33, 0.42, 14), solid('#111', 0.9, 0)); h.rotation.z = Math.PI / 2; h.position.y = -0.4; return h; })(), hole);
    },
  },
  { ...HID, id: 'xRear', build: () => xMember(8, 1.5) },

  // 2.5 — front clip: rail extensions Z 60 → 66 (with 3/16 sleeves over the old rail ends), front plate, tow point, bumper tabs
  {
    ...HID, id: 'frontClip',
    build: () => group(...[-1, 1].flatMap(sd => [
      boxAt(steel(), sd < 0 ? [-6.5, 9.5, 60] : [5.25, 9.5, 60], sd < 0 ? [-5.25, 12.5, 66] : [6.5, 12.5, 66]),
      boxAt(steel(), sd < 0 ? [-6.69, 9.5, 57] : [6.5, 9.5, 57], sd < 0 ? [-6.5, 12.5, 63] : [6.69, 12.5, 63]),
    ])),
  },
  {
    ...HID, id: 'frontClipPlate',
    build: () => group(
      boxAt(steel(), [-7.2, 9, 66], [7.2, 13, 66.19]),
      ...[-6.1, -4.1, 3.9, 5.9].map(x => boxAt(steel(), [x, 10, 66.19], [x + 0.25, 12, 68.2])),   // bumper tabs, two per side
    ),
  },

  // shop helpers used in Phase 2
  {
    ...HID, id: 'clampsBox', tags: ['prop'],
    build: () => {
      const m = solid('#c47a17', 0.5, 0.5), z = mats.zinc();
      const g = group();
      for (const sd of [-1, 1]) for (const zz of [2, 16, 30, 44]) {
        const c = group(boxAt(m, [-0.3, -1.3, -0.3], [0.3, 4.3, 0.3]), boxAt(m, [-0.3, 3.7, -0.3], [2.4, 4.3, 0.3]), boxAt(m, [-0.3, -1.3, -0.3], [2.4, -0.7, 0.3]), rod(z, [2.1, -0.7, 0], [2.1, 1.4, 0], 0.15));
        c.position.set(sd * 6.9, 9.5, zz); c.rotation.y = sd < 0 ? 0 : Math.PI;
        g.add(c);
      }
      return g;
    },
  },
  {
    ...HID, id: 'level', tags: ['prop'], pivot: [0, 12.5, 20],
    build: () => group(boxAt(solid('#c8cbd0', 0.35, 0.8), [-8.5, 0, -0.6], [8.5, 1.3, 0.6]), boxAt(solid('#c9e86a', 0.2, 0, ), [-1.2, 1.3, -0.4], [1.2, 1.45, 0.4])),
  },
  {
    id: 'levelBubble', parent: 'level', pivot: [0.7, 1.5, 0],
    build: () => { const b = new Mesh(new SphereGeometry(0.22, 10, 8), solid('#ffffff', 0.1, 0)); b.scale.set(1.4, 0.6, 1); return group(b); },
  },
];

void Group;
