import { CylinderGeometry, DodecahedronGeometry, Group, Mesh, Object3D, SphereGeometry, TorusGeometry } from 'three';
import type { PartDef } from '../registry';
import { mats, painted, solid } from '../../scene/materials';
import { FRONT } from '../geom';
import { boxAt, cylX, group, mudTire, rim, rod, spring } from './util';

// Phase 4 front end. The axle assembly hangs off the wishbone apex (its pivot), so cycleSuspension only rotates it.
const HID = { defaultState: 'hidden' as const };
const steel = () => mats.rawSteel();
const [, BY, BZ] = FRONT.beamRel;           // beam center relative to the apex
const KP = FRONT.kpX;
const CASTER = -FRONT.casterDeg * Math.PI / 180;

function marker(name: string, x: number, y: number, z: number) { const o = new Object3D(); o.name = name; o.position.set(x, y, z); return o; }
function named<T extends Object3D>(o: T, name: string, explode?: [number, number, number]) { o.name = name; if (explode) o.userData.explode = explode; return o; }

/** A link (rod end to rod end): tube along +Y of unit length; the rig stretches it between two markers. */
export function linkRod(radius: number, heim = 0.42, color = '#8a8d90') {
  const m = solid(color, 0.45, 0.6);
  const tube = new Mesh(new CylinderGeometry(radius, radius, 1, 12), m); tube.geometry.translate(0, 0.5, 0);
  const ends = [0, 1].map(i => { const e = group(new Mesh(new SphereGeometry(heim, 12, 10), mats.zinc())); e.name = i ? 'endB' : 'endA'; return e; });
  return group(named(group(tube), 'tube'), ...ends);
}

/** Coilover: body + spring + shaft between eyes; the rig stretches the spring and slides the shaft. */
function coilover() {
  const body = new Mesh(new CylinderGeometry(0.9, 0.9, 5, 16), solid('#d64b1c', 0.35, 0.5)); body.position.y = 2.5;
  const shaft = new Mesh(new CylinderGeometry(0.32, 0.32, 1, 10), mats.zinc()); shaft.geometry.translate(0, 0.5, 0);
  const sp = spring(solid('#e0b21c', 0.4, 0.5), 1.35, 1, 8, 0.2);
  const eyeA = group(new Mesh(new TorusGeometry(0.45, 0.18, 8, 16), mats.zinc())); eyeA.name = 'endA';
  const eyeB = group(new Mesh(new TorusGeometry(0.45, 0.18, 8, 16), mats.zinc())); eyeB.name = 'endB';
  return group(named(group(body), 'body'), named(group(shaft), 'shaft'), named(group(sp), 'spring'), eyeA, eyeB);
}

function knuckle(sd: -1 | 1, withDragArm: boolean) {
  const g = new Group();
  g.rotation.x = CASTER;                      // kingpin top leans rearward 6°
  const s = steel();
  const tube = named(group(new Mesh(new CylinderGeometry(0.5, 0.5, 3, 18), s)), 'kpTube', [0, 0, 0]);
  const bush = named(group(...[-1.5, 1.5].map(y => { const b = new Mesh(new CylinderGeometry(0.55, 0.55, 0.25, 16), mats.bronze()); b.position.y = y; return b; })), 'kpBushings', [0, 0, 6]);
  const plate = named(group(boxAt(s, [sd < 0 ? -0.875 : 0.5, -2.75, -1.5], [sd < 0 ? -0.5 : 0.875, 1.5, 1.5])), 'spindlePlate', [sd * 5, 0, 0]);
  const sp = cylX(mats.zinc(), 0.375, 3.2, 14); sp.position.set(sd * 2.2, -FRONT.spindleDrop, 0);
  const spindle = named(group(sp), 'spindle', [sd * 9, 0, 0]);
  const gus = named(group(
    boxAt(s, [sd < 0 ? -2.0 : 0.875, -1.5, -0.12], [sd < 0 ? -0.875 : 2.0, -1.0, 0.12]),
    boxAt(s, [sd < 0 ? -2.0 : 0.875, -3.0, -0.12], [sd < 0 ? -0.875 : 2.0, -2.5, 0.12]),
  ), 'gussets', [sd * 5, -4, 4]);
  // steering arm: rearward + inward so the line kingpin → hole points at the rear axle center (Ackermann)
  const inX = -sd * FRONT.steerArm * Math.sin(Math.atan2(KP, FRONT.wheelbase)), backZ = -FRONT.steerArm * Math.cos(Math.atan2(KP, FRONT.wheelbase));
  const arm = named(group(rod(s, [0, -1.2, 0], [inX, -1.2, backZ], 0.32), (() => { const h = new Mesh(new CylinderGeometry(0.5, 0.5, 0.4, 14), s); h.position.set(inX, -1.2, backZ); return h; })(), marker('steerHole', inX, -1.2, backZ)), 'steerArm', [0, 0, -7]);
  g.add(tube, bush, plate, spindle, gus, arm);
  if (withDragArm) {
    const dx = -sd * 4.3;
    g.add(named(group(rod(s, [0, 1.0, 0], [dx, 2.3, 0], 0.3), (() => { const h = new Mesh(new CylinderGeometry(0.45, 0.45, 0.38, 14), s); h.position.set(dx, 2.3, 0); return h; })(), marker('dragHole', dx, 2.3, 0)), 'dragArm', [-sd * 6, 5, 0]));
  }
  const zerk = new Mesh(new CylinderGeometry(0.12, 0.12, 0.5, 8), mats.zinc()); zerk.rotation.x = Math.PI / 2; zerk.position.z = -0.7;
  g.add(named(group(zerk), 'zerk', [0, 2, -6]));
  const bolt = new Mesh(new CylinderGeometry(0.31, 0.31, 4.6, 10), mats.zinc());
  g.add(named(group(bolt), 'kpBolt', [0, 9, 0]));
  return g;
}

function hub(sd: -1 | 1) {
  const g = new Group();
  const parts: [string, Mesh, number][] = [
    ['seal', cylX(solid('#202020', 0.8, 0), 1.3, 0.3, 16), -0.9],
    ['innerBearing', cylX(mats.bronze(), 1.1, 0.6, 16), -0.5],
    ['hubBody', cylX(steel(), 1.5, 2.2, 20), 0],
    ['outerBearing', cylX(mats.bronze(), 0.9, 0.5, 16), 0.9],
    ['washer', cylX(mats.zinc(), 0.8, 0.12, 16), 1.25],
    ['castleNut', cylX(mats.zinc(), 0.6, 0.45, 6), 1.5],
    ['cotter', rod(mats.zinc(), [0, -0.7, 0], [0, 0.7, 0], 0.06) as Mesh, 1.55],
    ['dustCap', cylX(solid('#9da1a6', 0.3, 0.8), 0.95, 0.4, 16), 1.85],
  ];
  parts.forEach(([n, m, x], i) => { m.position.x += sd * x; g.add(named(group(m), n, [sd * (2 + i * 1.8), 0, 0])); });
  const fl = cylX(steel(), 2.9, 0.35, 24); fl.position.x = sd * 0.9; g.children[2].add(fl);
  return g;
}

export const frontParts: PartDef[] = [
  {
    ...HID, parent: 'vehicle', id: 'axleBeam', pivot: FRONT.apex,
    build: () => {
      const m = steel();
      return group(
        boxAt(m, [-11, BY - 1, BZ - 1], [11, BY + 1, BZ + 1]),
        marker('panhardEnd', 10, 7.8 - FRONT.apex[1], BZ + 1.5),
        marker('coilLowerL', -11, BY + 1.5, BZ), marker('coilLowerR', 11, BY + 1.5, BZ),
        marker('strapL', -7, BY + 1, BZ - 0.5), marker('strapR', 7, BY + 1, BZ - 0.5),
      );
    },
  },
  { parent: 'axleBeam', id: 'beamOffcut', build: () => group(boxAt(steel(), [11, BY - 1, BZ - 1], [15, BY + 1, BZ + 1])) },
  { ...HID, parent: 'axleBeam', id: 'beamCaps', build: () => group(boxAt(steel(), [-11.19, BY - 1, BZ - 1], [-11, BY + 1, BZ + 1]), boxAt(steel(), [11, BY - 1, BZ - 1], [11.19, BY + 1, BZ + 1])) },
  ...([-1, 1] as const).map((sd): PartDef => ({
    ...HID, parent: 'axleBeam', id: sd < 0 ? 'kpEarsL' : 'kpEarsR', pivot: [sd * KP, BY, BZ],
    build: () => {
      const g = new Group(); g.rotation.x = CASTER;
      for (const y of [1.75, -1.75]) {
        const e = boxAt(steel(), [-1.25, y - 0.19, -1.5], [1.25, y + 0.19, 1.5]); e.position.x += -sd * 0.6; g.add(e);
        const hole = new Mesh(new CylinderGeometry(0.33, 0.33, 0.42, 14), solid('#111', 0.9, 0)); hole.position.set(0, y, 0); g.add(hole);
      }
      const stop = rod(mats.zinc(), [-sd * 0.6, 1.95, -1.2], [-sd * 0.6, 1.95, -2.4], 0.19); stop.name = 'stopBolt'; g.add(stop);
      return group(g);
    },
  })),
  ...([-1, 1] as const).map((sd): PartDef => ({
    ...HID, parent: 'axleBeam', id: sd < 0 ? 'alignRodL' : 'alignRodR', pivot: [sd * KP, BY, BZ], tags: ['prop'],
    build: () => { const g = new Group(); g.rotation.x = CASTER; g.add(new Mesh(new CylinderGeometry(0.31, 0.31, 9, 12), solid('#d8d8d8', 0.3, 0.9))); return group(g); },
  })),
  {
    ...HID, parent: 'axleBeam', id: 'beamTabs',
    build: () => group(
      boxAt(steel(), [-11.5, BY + 1, BZ - 0.19], [-10.5, BY + 2.2, BZ + 0.19]), boxAt(steel(), [10.5, BY + 1, BZ - 0.19], [11.5, BY + 2.2, BZ + 0.19]),
      boxAt(steel(), [9.4, BY - 1, BZ + 1], [10.6, BY + 0.5, BZ + 2.4]),       // panhard tab, right end
    ),
  },
  ...([-1, 1] as const).flatMap((sd): PartDef[] => {
    const s = sd < 0 ? 'L' : 'R';
    return [
      { ...HID, parent: 'axleBeam', id: `knuckle${s}`, pivot: [sd * KP, BY, BZ], build: () => knuckle(sd, sd > 0) },
      { ...HID, parent: `knuckle${s}`, id: `hubFront${s}`, pivot: [sd * 3.2, -FRONT.spindleDrop, 0], build: () => hub(sd) },
      {
        ...HID, parent: `hubFront${s}`, id: `wheelFront${s}`, pivot: [sd * (FRONT.wheelOut - 3.2), 0, 0],
        build: () => group(mudTire(mats.rubber(), FRONT.tireDia, FRONT.tireW), rim(painted('wheel', { weathered: false }), 12, 7)),
      },
    ];
  }),
  {
    ...HID, parent: 'axleBeam', id: 'wishbone',
    build: () => {
      const m = steel();
      const g = group(rod(m, [-10, BY, BZ - 0.5], [-0.6, 0, 1.5], 0.5), rod(m, [10, BY, BZ - 0.5], [0.6, 0, 1.5], 0.5));
      g.add(boxAt(m, [-10.6, BY - 0.6, BZ - 3], [-9.4, BY + 0.6, BZ - 1]), boxAt(m, [9.4, BY - 0.6, BZ - 3], [10.6, BY + 0.6, BZ - 1]));  // gussets
      g.add(rod(m, [0, 0, 0.6], [0, 0, 2.2], 0.55));      // bung to the apex heim
      return g;
    },
  },
  {
    ...HID, parent: 'axleBeam', id: 'apexJoint',
    build: () => group(new Mesh(new SphereGeometry(0.55, 14, 12), mats.zinc()), cylX(mats.zinc(), 0.31, 2.6, 10)),
  },
  { ...HID, parent: 'vehicle', id: 'panhard', build: () => linkRod(0.375, 0.5) },
  ...([-1, 1] as const).flatMap((sd): PartDef[] => {
    const s = sd < 0 ? 'L' : 'R';
    return [
      {
        ...HID, parent: 'vehicle', id: `shockTower${s}`,
        build: () => group(boxAt(steel(), [sd < 0 ? -8.4 : 6.5, 12.5, 45.6], [sd < 0 ? -6.5 : 8.4, FRONT.towerY + 1, 45.8]), boxAt(steel(), [sd < 0 ? -8.4 : 6.5, 12.5, 48.2], [sd < 0 ? -6.5 : 8.4, FRONT.towerY + 1, 48.4]), marker('eye', sd * 8, FRONT.towerY, 47)),
      },
      { ...HID, parent: 'vehicle', id: `coilover${s}`, build: coilover },
      { ...HID, parent: 'vehicle', id: `bumpStop${s}`, build: () => { const b = new Mesh(new CylinderGeometry(0.8, 1, 1.6, 14), solid('#e5c02a', 0.7, 0)); b.position.set(sd * 6, 8.7, 47); return group(b); } },
      { ...HID, parent: 'vehicle', id: `limitStrap${s}`, build: () => linkRod(0.18, 0.3, '#2a3a8a') },
    ];
  }),
  {
    ...HID, id: 'rockProp', tags: ['prop'], pivot: [-16, 0, 47],
    build: () => { const r = new Mesh(new DodecahedronGeometry(6, 0), solid('#7a7770', 0.95, 0)); r.scale.set(1.2, 0.55, 1.1); r.position.y = 1.5; return group(r); },
  },
];
