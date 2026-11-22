import { CylinderGeometry, Group, Mesh } from 'three';
import type { PartDef } from '../registry';
import { mats, painted, solid } from '../../scene/materials';
import { REAR } from '../geom';
import { boxAt, cylX, group, mudTire, rim, rod } from './util';

// Phase 3 parts. Hubs, discs, calipers and wheels are children of the transaxle (pivot = axle center),
// so they ride along with it (3.2 drop, 3.5 swingarm demo).
const HID = { defaultState: 'hidden' as const };
const T = { ...HID, parent: 'transaxle2300' };
const steel = () => mats.rawSteel();

export const rearParts: PartDef[] = [
  ...([-1, 1] as const).map((sd): PartDef => ({
    // 3/16 drop brackets on the rail outer faces + 1/4 gussets: transaxle bolts 3 in lower
    ...HID, parent: 'vehicle', id: sd < 0 ? 'rearLiftBracketL' : 'rearLiftBracketR',
    build: () => {
      const x0 = sd < 0 ? -6.69 : 6.5, x1 = sd < 0 ? -6.5 : 6.69;
      const g = group(boxAt(steel(), [x0, 6.0, -5], [x1, 12.5, 5]));
      const gx0 = sd < 0 ? -7.6 : 6.69, gx1 = sd < 0 ? -6.69 : 7.6;
      g.add(boxAt(steel(), [gx0, 6.0, -0.13], [gx1, 9.5, 0.13]));        // gusset
      return g;
    },
  })),
  ...([-1, 1] as const).flatMap((sd): PartDef[] => {
    const s = sd < 0 ? 'L' : 'R';
    return [
      {
        ...T, id: `hubRear${s}`, pivot: [REAR.hubX * sd, 0, 0],
        build: () => {
          const g = group(cylX(steel(), 1.25, 2.2, 20));
          const fl = cylX(steel(), 2.9, 0.35, 24); fl.position.x = sd * 1.0; g.add(fl);
          for (const a of [0, 1, 2, 3]) { const st = cylX(mats.zinc(), 0.25, 1.4, 8); st.position.set(sd * 1.6, Math.cos(a * Math.PI / 2 + 0.78) * 2.2, Math.sin(a * Math.PI / 2 + 0.78) * 2.2); g.add(st); }
          const set = rod(mats.black(), [0, 1.25, 0], [0, 1.6, 0], 0.15); g.add(set);   // set screw
          const ret = cylX(mats.zinc(), 0.8, 0.25, 16); ret.position.x = sd * 1.25; g.add(ret);   // end retainer
          return g;
        },
      },
      {
        ...T, id: `discRear${s}`, pivot: [REAR.discX * sd, 0, 0],
        build: () => group(cylX(solid('#9a9da0', 0.35, 0.8), 3.5, 0.2, 32), cylX(solid('#5c5f62', 0.5, 0.6), 1.4, 0.3, 16)),
      },
      {
        ...T, id: `caliperRear${s}`, pivot: [REAR.discX * sd, 0, 0],
        build: () => group(boxAt(solid('#2b2b2b', 0.5, 0.5), [-0.7, 2.4, -1.3], [0.7, 4, 1.3]), boxAt(steel(), [sd < 0 ? 0.5 : -1.6, 2.6, -0.6], [sd < 0 ? 1.6 : -0.5, 3.6, 0.6])),
      },
      {
        ...T, id: `wheelRear${s}`, pivot: [REAR.wheelX * sd, 0, 0],
        build: () => group(mudTire(mats.rubber(), REAR.tireDia, REAR.tireW), rim(painted('wheel', { weathered: false }), 12, 9)),
      },
    ];
  }),
  {
    // 3.5 v2 swingarm (ghost only): cradle around the transaxle pivoting near the slip yoke, two coilovers
    ...HID, parent: 'vehicle', id: 'swingCradle',
    build: () => {
      const m = steel();
      return group(
        rod(m, [-6, REAR.axleY - 4, -7], [-6, REAR.axleY - 4, 12], 1), rod(m, [6, REAR.axleY - 4, -7], [6, REAR.axleY - 4, 12], 1),
        rod(m, [-6, REAR.axleY - 4, -7], [6, REAR.axleY - 4, -7], 1), rod(m, [-6, REAR.axleY - 4, 12], [6, REAR.axleY - 4, 12], 1),
        rod(mats.zinc(), [-7, REAR.axleY - 4, 12], [7, REAR.axleY - 4, 12], 0.4),
      );
    },
  },
  {
    ...HID, parent: 'vehicle', id: 'swingCoilovers',
    build: () => group(...[-1, 1].map(sd => rod(solid('#d64b1c', 0.4, 0.4), [sd * 6, REAR.axleY - 3, -7], [sd * 6, 14, -9], 0.9))),
  },
  {
    // a lighter stock transaxle for non-JD donors (3.1 swap animation) — sits on the shelf
    ...HID, id: 'lightTransaxle', pivot: [124, 0, 52],
    build: () => {
      const c = solid('#6c6f73', 0.6, 0.4);
      return group(boxAt(c, [-4, 3, -4], [4, 10, 4]), (() => { const t = cylX(c, 0.9, 16, 12); t.position.y = 6.5; return t; })());
    },
  },
];

void Group; void Mesh; void CylinderGeometry;
