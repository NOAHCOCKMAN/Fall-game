import { CylinderGeometry, DoubleSide, Group, Mesh, SphereGeometry } from 'three';
import type { PartDef } from '../registry';
import { keep, mats, painted, solid } from '../../scene/materials';
import { boxAt, group, rod, rodPath, sqPath, sqTube } from './util';

// Phase 6: engine cage following the hood's inner profile (½ in inside the skin), bumper, guard, skid plate, ROPS, body.
const HID = { defaultState: 'hidden' as const, parent: 'vehicle' };
type V3 = [number, number, number];
const steel = () => mats.rawSteel();
const CX = 7.0;   // side frames sit on the rails' outer edge, ½ in+ inside the 17-in hood

/** Side frame profile (Z, Y) — the hood template offset ½ in inward. */
export const CAGE_PROFILE: [number, number][] = [[34.6, 12.5], [34.6, 30.5], [55, 30.5], [58.4, 29.9], [60.3, 28.2], [61.4, 25.2], [61.6, 21], [61.6, 12.5]];
const side = (x: number): V3[] => CAGE_PROFILE.map(([z, y]) => [x, y, z]);

export const cageParts: PartDef[] = [
  { ...HID, id: 'cageHoopL', build: () => group(sqPath(steel(), [...side(-CX), [-CX, 12.5, 34.6]], 1)) },
  { ...HID, id: 'cageHoopR', build: () => group(sqPath(steel(), [...side(CX), [CX, 12.5, 34.6]], 1)) },
  {
    ...HID, id: 'cageCrossbars',
    build: () => group(
      sqTube(steel(), [-CX, 30.5, 34.6], [CX, 30.5, 34.6]),            // rear hoop top
      sqTube(steel(), [-CX, 21, 34.6], [CX, 21, 34.6]),                // rear hoop mid (dash)
      sqTube(steel(), [-CX, 25.2, 61.4], [CX, 25.2, 61.4]),            // front hoop (behind the grille)
      sqTube(steel(), [-CX, 14, 61.6], [CX, 14, 61.6]),
      ...[-1, 1].map(sd => sqTube(steel(), [sd * CX, 12.8, 50], [sd * (CX - 0.6), 24, 47])),   // diagonal braces
      ...[-1, 1].map(sd => boxAt(steel(), [sd < 0 ? -CX - 0.5 : CX - 1.6, 12.5, 33.6], [sd < 0 ? -CX + 1.6 : CX + 0.5, 12.75, 35.6])),  // gussets to the frame
    ),
  },
  {
    ...HID, id: 'cageTopRailRemovable',
    build: () => group(sqTube(solid('#a3a8ad', 0.4, 0.7), [0, 30.5, 34.6], [0, 30.5, 57]), boxAt(mats.zinc(), [-0.8, 31, 34.2], [0.8, 31.3, 35.4]), boxAt(mats.zinc(), [-0.8, 31, 56.4], [0.8, 31.3, 57.6])),
  },
  { ...HID, id: 'cageHingeTabs', build: () => group(...[-1, 1].map(sd => boxAt(steel(), [sd * CX - 0.2, 16, 61.7], [sd * CX + 0.2, 18.2, 63]))) },
  { ...HID, id: 'hoodBumpers', build: () => group(...[-1, 1].flatMap(sd => [40, 52].map(z => { const b = new Mesh(new CylinderGeometry(0.5, 0.5, 0.5, 12), keep(solid('#141414', 0.9, 0))); b.position.set(sd * CX, 31.25, z); return b; }))) },
  { ...HID, id: 'hoodPins', build: () => group(...[-1, 1].map(sd => group(boxAt(steel(), [sd * 4.5 - 0.3, 29.5, 34.0], [sd * 4.5 + 0.3, 31.4, 34.2]), rod(mats.zinc(), [sd * 4.5, 31.4, 34.1], [sd * 4.5, 32.6, 34.1], 0.15)))) },
  { ...HID, id: 'lightBarMount', build: () => group(boxAt(steel(), [-9, 27.2, 69.6], [9, 27.6, 70.4]), boxAt(steel(), [-9, 25, 69.6], [-8.6, 27.6, 70.4]), boxAt(steel(), [8.6, 25, 69.6], [9, 27.6, 70.4])) },
  {
    ...HID, id: 'bumperFront',
    build: () => group(sqTube(steel(), [-12, 10.75, 69.5], [12, 10.75, 69.5], 1.5), sqTube(steel(), [-5.1, 10.75, 66.3], [-5.1, 10.75, 68.8], 1.2), sqTube(steel(), [5.1, 10.75, 66.3], [5.1, 10.75, 68.8], 1.2)),
  },
  {
    ...HID, id: 'grilleGuard',
    build: () => group(rodPath(steel(), [[-9, 11.5, 69.7], [-9, 22, 69.7], [-6, 25.2, 69.7], [6, 25.2, 69.7], [9, 22, 69.7], [9, 11.5, 69.7]], 0.5),
      rod(steel(), [-3, 11.5, 69.7], [-3, 25.2, 69.7], 0.5), rod(steel(), [3, 11.5, 69.7], [3, 25.2, 69.7], 0.5),
      rod(steel(), [-6, 25.2, 69.7], [-CX, 25.2, 61.9], 0.5), rod(steel(), [6, 25.2, 69.7], [CX, 25.2, 61.9], 0.5)),
  },
  {
    ...HID, id: 'skidPlate',
    build: () => { const m = steel(); const g = group(boxAt(m, [-8, 8.8, 27], [8, 9.0, 66])); const lip = boxAt(m, [-8, 0, 0], [8, 0.19, 4]); lip.position.set(0, 9.6, 67.8); lip.rotation.x = -0.6; g.add(lip); return g; },
  },
  // ---- ROPS + seat ----
  {
    ...HID, id: 'ropsHoop',
    build: () => group(rodPath(steel(), [[-11.5, 11, -13], [-11.5, 60, -13], [-8, 67.5, -13], [8, 67.5, -13], [11.5, 60, -13], [11.5, 11, -13]], 0.75),
      ...[-1, 1].map(sd => boxAt(steel(), [sd < 0 ? -13 : 5.25, 10.5, -14.5], [sd < 0 ? -5.25 : 13, 10.75, -11.5]))),     // 1/4 base plates on outriggers
  },
  {
    ...HID, id: 'ropsBraces',
    build: () => group(rod(steel(), [-11, 44, -13.6], [-6.6, 11, -24], 0.6), rod(steel(), [11, 44, -13.6], [6.6, 11, -24], 0.6),
      sqTube(steel(), [-6.6, 11, -24], [6.6, 11, -24], 1.25), sqTube(steel(), [-6, 11, -24], [-6, 11, -10.5], 1.25), sqTube(steel(), [6, 11, -24], [6, 11, -10.5], 1.25)),
  },
  { ...HID, id: 'seatNew', build: () => group(boxAt(mats.zinc(), [-6, 27.4, -8], [-5, 28.1, 4]), boxAt(mats.zinc(), [5, 27.4, -8], [6, 28.1, 4]), boxAt(steel(), [-6.5, 24.2, -5], [6.5, 27.4, -4])) },
  {
    ...HID, id: 'seatBelt',
    build: () => { const m = keep(solid('#1b2b4a', 0.9, 0)); const g = group(); const pts: V3[] = [[-7.6, 30.4, -5], [-7, 37, 1.5], [0, 38, 4.4], [7, 37, 1.5], [7.6, 30.4, -5]]; for (let i = 0; i + 1 < pts.length; i++) g.add(sqTube(m, pts[i], pts[i + 1], 0.25)); return g; },
  },
  {
    ...HID, id: 'riderMannequin', tags: ['prop'],
    build: () => {
      const m = keep(solid('#9a9ea4', 0.8, 0)), h = keep(solid('#d0d3d6', 0.3, 0.2));
      const g = group(boxAt(m, [-6.5, 31.6, -6], [6.5, 37, 3]), boxAt(m, [-6, 37, -6.5], [6, 55, -1]));
      g.add(boxAt(m, [-5.5, 33, 3], [-1, 37, 18]), boxAt(m, [1, 33, 3], [5.5, 37, 18]), boxAt(m, [-5.5, 14, 14], [-1, 33, 18]), boxAt(m, [1, 14, 14], [5.5, 33, 18]));
      const helmet = new Mesh(new SphereGeometry(5.2, 18, 14), h); helmet.position.set(0, 60.2, -3.5); g.add(helmet);
      return g;
    },
  },
  // ---- body ----
  ...([-1, 1] as const).map((sd): PartDef => ({
    ...HID, id: sd < 0 ? 'fenderFlareL' : 'fenderFlareR',
    build: () => { const m = keep(solid('#161616', 0.85, 0)); m.side = DoubleSide; const f = new Mesh(new CylinderGeometry(14.2, 14.2, 3.2, 30, 1, true, Math.PI * 0.08, Math.PI * 0.84), m); f.rotation.z = Math.PI / 2; f.position.set(sd * 21.2, 8.5, 0); return group(f); },
  })),
  ...([-1, 1] as const).map((sd): PartDef => ({
    ...HID, id: sd < 0 ? 'floorboardL' : 'floorboardR',
    build: () => group(boxAt(mats.diamond(), [sd < 0 ? -13.5 : 6.6, 10.4, 5], [sd < 0 ? -6.6 : 13.5, 10.6, 27]), boxAt(steel(), [sd < 0 ? -13.5 : 6.6, 9.6, 8], [sd < 0 ? -6.6 : 13.5, 10.4, 8.3]), boxAt(steel(), [sd < 0 ? -13.5 : 6.6, 9.6, 23], [sd < 0 ? -6.6 : 13.5, 10.4, 23.3])),
  })),
  { ...HID, id: 'cageBenchFrame', parent: undefined, tags: ['prop'], pivot: [100, 34.3, 0], build: () => { const g = group(); CAGE_PROFILE.slice(0, -1).forEach(([z, y], i) => { const [z2, y2] = CAGE_PROFILE[i + 1]; g.add(benchStick(i, z, y, z2, y2)); }); return g; } },
];

/** One straight cage stick lying flat on the bench (X = profile Z − 48, Z = profile Y − 21). Explodes apart. */
function benchStick(i: number, z: number, y: number, z2: number, y2: number) {
  const s = sqTube(steel(), [z - 48, 0.5, y - 21], [z2 - 48, 0.5, y2 - 21], 1);
  const g = group(s); g.name = `stick${i}`; g.userData.explode = [(i % 3 - 1) * 4, 0, (i - 3) * 3.5];
  return g;
}
void Group; void painted;
