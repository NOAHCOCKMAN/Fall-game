import { CylinderGeometry, Group, Mesh, DoubleSide, SphereGeometry } from 'three';
import type { PartDef } from '../registry';
import { mats, painted, solid, weathered } from '../../scene/materials';
import { boxAt, cylX, cylZ, extrudeSide, group, rim, ring, rod, tire, tube } from './util';

// Stock JD 112-style tractor (Part B1). Visualization dimensions in inches.
// Every part hangs off the 'vehicle' group (origin on the ground under the rear axle) and has its pivot on its real pivot.

type V3 = [number, number, number];
const V: Pick<PartDef, 'parent'> = { parent: 'vehicle' };

const oldSteel = () => weathered(mats.oldSteel());
const blackOld = () => weathered(mats.black());

/** C-channel rail: web on the outer face, flanges pointing inward (open side faces in). */
function rail(side: -1 | 1) {
  const m = painted('body');
  const xo = 6.5 * side, xi = (6.5 - 0.19) * side, xf = (6.5 - 1.25) * side;
  const lo = (a: number, b: number) => [Math.min(a, b), Math.max(a, b)] as const;
  const [w0, w1] = lo(xo, xi), [f0, f1] = lo(xo, xf);
  return group(
    boxAt(m, [w0, 9.5, -10], [w1, 12.5, 60]),
    boxAt(m, [f0, 12.31, -10], [f1, 12.5, 60]),
    boxAt(m, [f0, 9.5, -10], [f1, 9.69, 60]),
  );
}

/** Hood: pivot on the hinge line (Z = 61, Y = 17). Two silhouettes, chosen by donor (A9). */
function hood() {
  const m = painted('body', { roughness: 0.45 });
  // side profiles in (Z, Y) relative to the hinge
  const rounded: [number, number][] = [
    [-27, 0], [-27, 14], [-6, 14], [-3, 13.6], [-0.5, 12.4], [1.2, 10.4], [1.6, 7], [1.4, 3], [0.6, 0],
  ];
  const squared: [number, number][] = [[-27, 0], [-27, 14], [0.8, 14], [1.6, 12.8], [1.6, 0]];
  const shell = (prof: [number, number][], shape: string) => {
    const g = new Group();
    const top = extrudeSide(m, prof, 8.5, shape === 'rounded' ? 0.9 : 0.3);
    g.add(top);
    g.userData.donorShape = shape;
    return g;
  };
  const h = group(shell(rounded, 'rounded'), shell(squared, 'squared'));
  return h;
}

function grille() {
  const frame = painted('accent');
  const mesh = solid('#2a2a2a', 0.7, 0.4);
  const mk = (shape: string, top: number) => {
    const g = group(boxAt(frame, [-7, 11, 62.1], [7, top, 62.9]));
    for (let y = 12.2; y < top - 0.8; y += 1.4) g.add(boxAt(mesh, [-6.2, y, 62.9], [6.2, y + 0.6, 63.2]));
    g.userData.donorShape = shape;
    return g;
  };
  return group(mk('rounded', 26), mk('squared', 29));
}

function wheel(diameter: number, width: number, rimDia: number) {
  return () => group(tire(weathered(mats.rubber()), diameter, width, 3), rim(painted('wheel'), rimDia, width));
}

function engineStock() {
  // Horizontal-shaft single: crank along Z, flywheel/fan forward. Pivot at the block's base center.
  const blk = solid('#3f4247', 0.6, 0.35), fan = painted('body'), al = mats.aluminum();
  const g = group(boxAt(blk, [-7.5, 0, -7], [7.5, 11, 7]));         // crankcase + block (15 W × 14 L)
  g.add(boxAt(blk, [-6, 11, -5.5], [3, 15, 5.5]));                    // upper block
  for (let i = 0; i < 6; i++) g.add(boxAt(al, [3, 4 + i * 1.6, -5], [7.2, 4.6 + i * 1.6, 5]));  // cylinder fins (right)
  const shroud = cylZ(fan, 6.8, 3.2, 28); shroud.position.set(0, 6, 8.6); g.add(shroud); // flywheel/fan shroud forward
  const screen = cylZ(solid('#1d1d1d', 0.8, 0.2), 4.5, 0.4, 24); screen.position.set(0, 6, 10.3); g.add(screen);
  const pulley = cylZ(solid('#2c2c2c', 0.5, 0.6), 2.2, 1.2, 20); pulley.position.set(0, 3, -8.6); g.add(pulley); // PTO / drive pulley at rear
  return g;
}

function transaxle() {
  const cast = weathered(solid('#4b4e52', 0.6, 0.45));
  const g = new Group(); // pivot = rear axle center (0, 11.5, 0)
  const parts: [string, Mesh | Group][] = [
    ['case', boxAt(cast, [-5.2, -5, -6], [5.2, 5, 6])],
    ['cover', boxAt(cast, [-5.4, 5, -5.5], [5.4, 5.6, 5.5])],
    ['tubeL', (() => { const m = cylX(cast, 1.25, 5.4); m.position.x = -7.9; return m; })()],
    ['tubeR', (() => { const m = cylX(cast, 1.25, 5.4); m.position.x = 7.9; return m; })()],
    ['axleL', (() => { const m = cylX(mats.zinc(), 0.5, 2); m.position.x = -11.4; return m; })()],
    ['axleR', (() => { const m = cylX(mats.zinc(), 0.5, 2); m.position.x = 11.4; return m; })()],
    ['input', (() => { const m = cylZ(mats.zinc(), 0.5, 3); m.position.set(0, 0.5, 7.5); return m; })()],
    ['inputPulley', (() => { const m = cylZ(solid('#2c2c2c', 0.5, 0.6), 2.6, 1); m.position.set(0, 0.5, 8.6); return m; })()],
    ['shiftLever', group(rod(mats.black(), [0, 5.6, 1], [1.5, 21, -2], 0.3), (() => { const k = new Mesh(new SphereGeometry(0.9, 12, 10), mats.black()); k.position.set(1.5, 21.4, -2); return k; })())],
    ['brakeShaft', (() => { const m = cylX(mats.zinc(), 0.4, 2); m.position.set(-6, -1.5, 3); return m; })()],
  ];
  for (const [n, m] of parts) { m.name = n; g.add(m); }
  return g;
}

function fenderDeck() {
  const m = painted('body', { roughness: 0.5 });
  m.side = DoubleSide;
  const g = new Group(); // pivot at (0, 24, 0)
  g.add(boxAt(m, [-9.5, -0.3, -12], [9.5, 0.3, 10]));            // seat platform
  g.add(boxAt(m, [-9.5, -12, -12.3], [9.5, 0, -11.7]));         // rear panel
  for (const s of [-1, 1]) {
    const f = new Mesh(new CylinderGeometry(13.2, 13.2, 9.6, 30, 1, true, Math.PI * 0.06, Math.PI * 0.88), m);
    f.rotation.z = Math.PI / 2;
    f.position.set(15 * s, 11.5 - 24, 0);
    g.add(f);
    g.add(boxAt(m, [Math.min(9.5 * s, 10.4 * s), -1.2, -8], [Math.max(9.5 * s, 10.4 * s), 0.3, 8])); // inner skirt
  }
  return g;
}

function seat() {
  const pan = painted('seat', { roughness: 0.6 });
  const g = new Group(); // pivot on the seat spring at (0, 30, -2)
  g.add(boxAt(pan, [-8, 0, -7], [8, 1.6, 7]));
  const back = extrudeSide(pan, [[-7, 1.6], [-5.5, 1.6], [-7, 9], [-8.5, 9]], 8, 0.3);
  g.add(back);
  g.add(boxAt(blackOld(), [-1.5, -5.5, -3], [1.5, 0, 3]));       // spring + post
  return g;
}

function dash() {
  const m = painted('body');
  const g = new Group(); // pivot (0, 12.5, 29)
  g.add(extrudeSide(m, [[-4, 0], [4, 0], [4, 17.5], [1, 17.5], [-4, 14]], 6.5, 0.4));
  g.add(boxAt(solid('#1d1d1d', 0.6, 0.2), [-4, 15.5, -2.6], [4, 16.6, 0.4]));   // panel
  const throttle = rod(mats.zinc(), [-4.5, 14, -1], [-6, 19, -2], 0.25); g.add(throttle);
  const k = new Mesh(new SphereGeometry(0.7, 10, 8), mats.black()); k.position.set(-6, 19.3, -2); g.add(k);
  return g;
}

function deck() {
  const m = painted('body');
  m.side = DoubleSide;
  const g = new Group(); // pivot (0, 5, 19)
  g.add(boxAt(m, [-19, 0.8, -11], [19, 1.2, 11]));                 // deck top
  g.add(boxAt(m, [-19, -3, -11], [19, 0.8, -10.6]), boxAt(m, [-19, -3, 10.6], [19, 0.8, 11]));
  g.add(boxAt(m, [-19.2, -3, -11], [-18.8, 0.8, 11]), boxAt(m, [18.8, -3, -11], [19.2, 0.8, 11]));
  for (const x of [-10, 0, 10]) { const sp = new Mesh(new CylinderGeometry(2.2, 2.2, 1.6, 16), solid('#333', 0.6, 0.5)); sp.position.set(x, 2, 0); g.add(sp); }
  for (const [x, z] of [[-17, -9], [17, -9], [-17, 9], [17, 9]]) {
    const w = cylX(solid('#222', 0.8, 0), 1.3, 1, 12); w.position.set(x, -2.3, z); g.add(w);
  }
  return g;
}

export const stockParts: PartDef[] = [
  { id: 'vehicle', build: () => new Group() },

  // ---------------- frame ----------------
  { ...V, id: 'frameRailL', build: () => rail(-1) },
  { ...V, id: 'frameRailR', build: () => rail(1) },
  { ...V, id: 'frameXStock', build: () => group(...[2, 30, 56].map(z => boxAt(painted('body'), [-6.31, 10, z - 0.75], [6.31, 12.31, z + 0.75]))) },
  // Tabs that get cut off in 2.1 — one part per tab so each piece can drop.
  { ...V, id: 'deckHangers', build: () => new Group() },
  ...[10, 28].flatMap(z => [-1, 1].map((sd, k): PartDef => ({
    parent: 'deckHangers', id: `deckHangers.${z === 10 ? 1 + k : 3 + k}`,
    build: () => group(boxAt(oldSteel(), [sd < 0 ? -6.9 : 6.5, 6.8, z - 0.9], [sd < 0 ? -6.5 : 6.9, 9.6, z + 0.9])),
  }))),
  { ...V, id: 'bracketsMisc', build: () => new Group() },
  { parent: 'bracketsMisc', id: 'bracketsMisc.pedal', build: () => group(boxAt(oldSteel(), [-6.9, 7.5, 22], [-6.5, 9.6, 24])) },
  { parent: 'bracketsMisc', id: 'bracketsMisc.liftShaft', build: () => group(boxAt(oldSteel(), [6.5, 7.8, 24], [6.9, 9.6, 26])) },
  { parent: 'bracketsMisc', id: 'bracketsMisc.sector', build: () => group(boxAt(oldSteel(), [-6.4, 8.2, 39], [-4.6, 9.55, 42])) },
  {
    // hood hinge / grille locating tabs — KEEP (2.1)
    ...V, id: 'hoodMountTabs',
    build: () => group(...[-1, 1].map(sd => boxAt(painted('body'), [sd < 0 ? -6.5 : 5.9, 12.5, 58.6], [sd < 0 ? -5.9 : 6.5, 17.2, 60]))),
  },
  { ...V, id: 'rearHitch', build: () => group(boxAt(painted('body'), [-4, 7.5, -12], [4, 11, -10]), boxAt(oldSteel(), [-1.2, 7.5, -14], [1.2, 8, -12])) },

  // ---------------- front axle ----------------
  {
    ...V, id: 'frontAxleStock', pivot: [0, 8.6, 44],
    build: () => {
      const m = weathered(solid('#3a3c3f', 0.6, 0.4));
      return group(boxAt(m, [-11, -1.2, -0.9], [11, 0.6, 0.9]), cylZ(mats.zinc(), 0.5, 3.4));
    },
  },
  ...([-1, 1] as const).map((s): PartDef => ({
    id: s < 0 ? 'spindleStockL' : 'spindleStockR', parent: 'frontAxleStock', pivot: [11 * s, -0.6, 0],
    build: () => {
      const m = weathered(solid('#3a3c3f', 0.6, 0.4));
      const g = group(rod(m, [0, -1.8, 0], [0, 2.2, 0], 0.55));
      const stub = cylX(mats.zinc(), 0.4, 2.4); stub.position.set(1.2 * s, 0, 0); g.add(stub);
      g.add(boxAt(m, [-0.3, 1.2, -4.5], [0.3, 1.8, 0]));            // steering arm, pointing back
      return g;
    },
  })),
  {
    ...V, id: 'dragLinkStock',
    build: () => group(rod(weathered(mats.zinc()), [-11, 10.2, 39.8], [-2.5, 9.2, 40.5], 0.28)),
  },
  ...(['L', 'R'] as const).map((s): PartDef => ({ ...V, id: `wheelFrontStock${s}`, pivot: [s === 'L' ? -13 : 13, 8, 44], build: wheel(16, 6.5, 8) })),
  ...(['L', 'R'] as const).map((s): PartDef => ({ ...V, id: `wheelRearStock${s}`, pivot: [s === 'L' ? -15 : 15, 11.5, 0], build: wheel(23, 8.5, 12) })),

  // ---------------- body ----------------
  { ...V, id: 'hood', tags: ['xray'], pivot: [0, 17, 61], build: hood },
  { ...V, id: 'grille', tags: ['xray'], build: grille },
  { ...V, id: 'dash', tags: ['xray'], pivot: [0, 12.5, 29], build: dash },
  { ...V, id: 'fenderDeck', tags: ['xray'], pivot: [0, 24, 0], build: fenderDeck },
  { ...V, id: 'seat', pivot: [0, 30, -2], build: seat },
  ...(['L', 'R'] as const).map((s): PartDef => ({
    ...V, id: `footrest${s}`, build: () => {
      const x = s === 'L' ? -1 : 1, m = painted('body');
      return group(boxAt(m, [Math.min(6.6 * x, 13 * x), 9.6, 6], [Math.max(6.6 * x, 13 * x), 10.1, 26]), boxAt(blackOld(), [Math.min(7 * x, 12.6 * x), 10.1, 7], [Math.max(7 * x, 12.6 * x), 10.3, 25]));
    },
  })),

  // ---------------- steering ----------------
  {
    // Wheel plane perpendicular to the column. TODO(Noah): spec says "tilted 30° back from vertical" — modeled with
    // the column running from the wheel hub down to the sector, which gives ≈ 35° from horizontal.
    ...V, id: 'steeringWheel', pivot: [0, 38, 20],
    build: () => {
      const m = blackOld();
      const g = group(ring(m, 7, 0.55));
      for (const a of [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]) g.add(rod(m, [0, 0, 0], [Math.cos(a) * 6.8, Math.sin(a) * 6.8, 0], 0.4));
      const hub = new Mesh(new CylinderGeometry(1.3, 1.3, 1.4, 16), m); hub.rotation.x = Math.PI / 2; g.add(hub);
      // ring lies in the local XY plane (axis Z); tip the axis onto the column direction (0, -27.7, 20.1)
      g.rotation.x = Math.atan2(27.7, 20.1);
      return group(g);
    },
  },
  { ...V, id: 'steeringColumnStock', build: () => group(rod(weathered(mats.zinc()), [0, 37.3, 20.5], [0, 9.6, 40.6], 0.5)) },
  {
    ...V, id: 'steeringSector', pivot: [0, 8.8, 40.5],
    build: () => {
      const m = weathered(solid('#3a3c3f', 0.6, 0.4));
      const s = new Mesh(new CylinderGeometry(3.2, 3.2, 0.6, 20, 1, false, -0.6, 1.2), m);
      s.position.set(-0.5, 0, -0.5);
      return group(s, rod(m, [0, 0.4, 0], [-2.5, 1.2, -0.5], 0.4));
    },
  },

  // ---------------- engine bay ----------------
  { ...V, id: 'engineStock', pivot: [0, 12.5, 45], build: engineStock },
  { ...V, id: 'mufflerStock', build: () => { const m = cylZ(weathered(solid('#3b332d', 0.8, 0.4)), 2.2, 8, 16); m.position.set(-5.6, 15.4, 57); return group(m, rod(weathered(solid('#3b332d', 0.8, 0.4)), [-3.5, 18, 51], [-5.6, 16.5, 54], 0.5)); } },
  { ...V, id: 'airCleanerStock', build: () => group(boxAt(painted('body'), [3.2, 25, 46], [8, 28.2, 52])) },
  { ...V, id: 'fuelTankStock', build: () => group(boxAt(painted('body'), [-6.5, 22.5, 34.4], [6.5, 29.8, 38.2]), (() => { const c = new Mesh(new CylinderGeometry(1, 1, 0.8, 12), mats.black()); c.position.set(3, 30.2, 36.3); return c; })()) },
  { ...V, id: 'battery', pivot: [0, 13.6, 35.5], build: () => group(boxAt(solid('#262626', 0.6, 0.1), [-3.5, 0, -2], [3.5, 6.6, 2]), boxAt(mats.red(), [1, 6.6, -0.5], [2.2, 7.1, 0.5]), boxAt(solid('#222', 0.5, 0.3), [-2.2, 6.6, -0.5], [-1, 7.1, 0.5])) },

  // ---------------- drive ----------------
  {
    ...V, id: 'variator', pivot: [0, 6.6, 18],
    build: () => {
      const m = weathered(solid('#3a3c3f', 0.6, 0.5));
      const sheave = (y: number) => { const c = new Mesh(new CylinderGeometry(3, 3, 1.3, 24), m); c.position.y = y; return c; };
      return group(sheave(0.8), sheave(-0.8), rod(m, [0, 0, 0], [-5.4, 2.3, 4], 0.35));
    },
  },
  { ...V, id: 'beltStockEngine', build: () => group(tube(mats.rubber(), [[-2.2, 15.5, 36.5], [-3, 7.4, 18], [3, 7.4, 18], [2.2, 15.5, 36.5]], 0.32, true)) },
  { ...V, id: 'beltStockTrans', build: () => group(tube(mats.rubber(), [[-3, 5.8, 18], [-2.6, 12, 8.6], [2.6, 12, 8.6], [3, 5.8, 18]], 0.32, true)) },
  {
    ...V, id: 'clutchBrakePedal', pivot: [-6.8, 9.2, 19],
    build: () => { const m = blackOld(); return group(rod(m, [0, 0, 0], [-2.2, 4.8, 3], 0.35), boxAt(m, [-4.2, 4.6, 2], [-1.2, 5.2, 5])); },
  },
  { ...V, id: 'pedalLinkage', build: () => group(rod(weathered(mats.zinc()), [-6.6, 8.8, 18.6], [-5.8, 9.6, 3.2], 0.22)) },
  { ...V, id: 'transaxle2300', pivot: [0, 11.5, 0], build: transaxle },

  // ---------------- deck ----------------
  { ...V, id: 'mowerDeck', pivot: [0, 5, 19], build: deck },
  {
    ...V, id: 'deckLiftLinkage',
    build: () => {
      const m = weathered(mats.zinc());
      return group(rod(m, [-6.4, 8.6, 24], [6.4, 8.6, 24], 0.35), rod(m, [-6, 8.6, 24], [-9, 6.2, 12], 0.22), rod(m, [6, 8.6, 24], [9, 6.2, 12], 0.22), rod(m, [-6, 8.6, 24], [-9, 6.2, 27], 0.22), rod(m, [6, 8.6, 24], [9, 6.2, 27], 0.22));
    },
  },
  {
    ...V, id: 'liftLever', pivot: [6.8, 12.6, 25],
    build: () => { const g = group(rod(weathered(mats.zinc()), [0, 0, 0], [2.2, 13, -1.5], 0.3)); const k = new Mesh(new SphereGeometry(0.8, 10, 8), painted('accent')); k.position.set(2.2, 13.4, -1.5); g.add(k); return g; },
  },

  // ---------------- wiring / cables ----------------
  { ...V, id: 'wiringStock', build: () => group(tube(mats.black(), [[-3.2, 20, 35.5], [-6.8, 15, 32], [-7, 13, 26], [-6.9, 13.2, 38], [-4, 16, 46], [-3, 20, 30]], 0.2)) },
  { ...V, id: 'throttleCableStock', build: () => group(tube(mats.black(), [[-6.3, 30.4, 27], [-7.2, 26, 32], [-7.6, 22, 40], [-5.5, 24, 46]], 0.16)) },
];
