import { CylinderGeometry, Mesh } from 'three';
import type { PartDef } from '../registry';
import { DONOR_IDS, PALETTES, solid, type Palette } from '../../scene/materials';
import { boxAt, extrudeSide, group, rim, tire } from './util';

// 0.1: six simplified donors on floor turntables in a row (X = −150…+150, Z = −30), each in its own palette.
export const LINEUP_Z = -30;
export const lineupX = (i: number) => -150 + i * 60;

function simpleTractor(p: Palette) {
  const body = solid(p.body, 0.5, 0.2), acc = solid(p.accent, 0.5, 0.2), wh = solid(p.wheel, 0.5, 0.3), rub = solid('#1c1c1c', 0.9, 0);
  const g = group();
  // centered on mid-wheelbase so it spins in place: rear axle at z = -22, front at z = +22
  g.add(boxAt(body, [-6.5, 9.5, -32], [6.5, 12.5, 38]));
  const prof: [number, number][] = p.hood === 'rounded'
    ? [[12, 17], [12, 31], [33, 31], [37, 29.5], [39.5, 25], [39.6, 17]]
    : [[12, 17], [12, 31], [39, 31], [39.6, 30], [39.6, 17]];
  g.add(extrudeSide(body, prof, 8.5, 0.4));
  g.add(boxAt(acc, [-6.5, 11, 39.6], [6.5, 26, 40.4]));
  g.add(boxAt(body, [-7, 12.5, 3], [7, 30, 11]));                       // dash
  g.add(boxAt(body, [-9.5, 23.7, -34], [9.5, 24.3, -12]));             // fender deck
  g.add(boxAt(acc, [-8, 26, -31], [8, 28, -17]), boxAt(acc, [-8, 28, -32], [8, 35, -30]));
  for (const s of [-1, 1]) {
    const r = group(tire(rub, 23, 8.5, 3), rim(wh, 12, 8.5)); r.position.set(15 * s, 11.5, -22); g.add(r);
    const f = group(tire(rub, 16, 6.5, 3), rim(wh, 8, 6.5)); f.position.set(13 * s, 8, 22); g.add(f);
  }
  return g;
}

export const lineupParts: PartDef[] = DONOR_IDS.map((d, i): PartDef => ({
  id: `donorShow.${d}`, defaultState: 'hidden', tags: ['prop', 'lineup'], pivot: [lineupX(i), 0, LINEUP_Z],
  build: () => {
    const table = new Mesh(new CylinderGeometry(30, 30, 0.8, 48), solid('#7d7a74', 0.7, 0.2));
    table.position.y = 0.4;
    const t = simpleTractor(PALETTES[d]); t.name = 'spin'; t.scale.setScalar(0.7); t.position.y = 0.8;
    return group(table, t);
  },
}));
