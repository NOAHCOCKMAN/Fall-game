import { BoxGeometry, CylinderGeometry, DoubleSide, Mesh } from 'three';
import type { PartDef } from '../registry';
import { mats, solid } from '../../scene/materials';
import { boxAt, cylX, extrudeSide, group, rod, tube } from './util';

// Shop diorama props (A8). Most start hidden and pop in during 0.3.
const H: Pick<PartDef, 'defaultState' | 'tags'> = { defaultState: 'hidden', tags: ['prop'] };

function jackStand() {
  const m = solid('#b8321f', 0.5, 0.4), z = mats.zinc();
  const g = group();
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; g.add(rod(m, [Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5], [0, 6, 0], 0.35)); }
  g.add(rod(z, [0, 5, 0], [0, 11.4, 0], 0.55));
  g.add(boxAt(m, [-1.4, 11.4, -0.6], [1.4, 12.4, 0.6]));   // saddle: top at Y = 12.4
  return g;
}

function grinder() {
  const body = solid('#2f6fb0', 0.5, 0.2);
  const g = group(cylX(body, 1.2, 9));
  const head = new Mesh(new CylinderGeometry(1.6, 1.6, 2.4, 14), solid('#333', 0.5, 0.5)); head.position.set(5, 0, 0); g.add(head);
  const disc = new Mesh(new CylinderGeometry(2.25, 2.25, 0.15, 24), solid('#555', 0.7, 0.3)); disc.position.set(5, -1.5, 0); g.add(disc);
  return g;
}

export const shopParts: PartDef[] = [
  {
    ...H, id: 'workbench', pivot: [100, 0, 0],
    build() {
      const w = mats.wood(), s = mats.black();
      const g = group(boxAt(w, [-24, 32, -10], [24, 34, 10]));
      for (const x of [-22, 22]) for (const z of [-8, 8]) g.add(boxAt(s, [x - 1, 0, z - 1], [x + 1, 32, z + 1]));
      g.add(boxAt(w, [-22, 8, -8], [22, 9, 8]));
      const vise = group(boxAt(solid('#3a5d8c', 0.5, 0.4), [-3, 34, 7], [3, 38, 10])); g.add(vise);
      return g;
    },
  },
  {
    ...H, id: 'partsShelf', pivot: [77, 0, 46],
    build() {
      const s = mats.oldSteel(), w = mats.wood();
      const g = group();
      for (const y of [20, 40]) g.add(boxAt(w, [-8, y, -28], [8, y + 1, 28]));
      for (const x of [-8, 7]) for (const z of [-28, 27]) g.add(boxAt(s, [x, 0, z], [x + 1, 46, z + 1]));
      return g;
    },
  },
  {
    ...H, id: 'scrapBin', pivot: [75, 0, -30],
    build() {
      const m = mats.oldSteel();
      return group(boxAt(m, [-10, 0, -8], [10, 1, 8]), boxAt(m, [-10, 0, -8], [10, 18, -7.5]), boxAt(m, [-10, 0, 7.5], [10, 18, 8]),
        boxAt(m, [-10, 0, -8], [-9.5, 18, 8]), boxAt(m, [9.5, 0, -8], [10, 18, 8]));
    },
  },
  {
    ...H, id: 'toolbox', pivot: [64, 0, 6],
    build() {
      const r = mats.toolRed(), z = mats.zinc();
      const g = group(boxAt(r, [-12, 3, -7], [12, 36, 7]));
      for (const y of [10, 17, 24, 31]) g.add(boxAt(z, [-8, y, 7], [8, y + 0.8, 7.6]));
      for (const x of [-10, 10]) for (const zz of [-5, 5]) { const c = cylX(mats.black(), 1.5, 1.2, 16); c.position.set(x, 1.5, zz); g.add(c); }
      return g;
    },
  },
  {
    ...H, id: 'fireExtinguisher', pivot: [66, 0, -48],
    build() {
      const body = new Mesh(new CylinderGeometry(2.6, 2.6, 16, 24), mats.red()); body.position.y = 8;
      const head = new Mesh(new BoxGeometry(2, 3, 3), mats.black()); head.position.y = 17.5;
      const hose = tube(mats.black(), [[1, 17, 0], [3, 14, 0.5], [3, 6, 1]], 0.3);
      return group(body, head, hose);
    },
  },
  {
    ...H, id: 'welder', pivot: [40, 0, -55],
    build() {
      const c = solid('#c9461d', 0.5, 0.3);
      const g = group(boxAt(c, [-8, 8, -5], [8, 22, 5]), boxAt(mats.black(), [-9, 6, -6], [9, 8, 6]));
      g.add(boxAt(solid('#1e1e1e', 0.4, 0.2), [-6, 15, 5], [2, 20, 5.3]));
      for (const x of [-7, 7]) { const w = cylX(mats.black(), 3, 1.5, 16); w.position.set(x, 3, -4); g.add(w); }
      g.add(tube(mats.black(), [[6, 12, 5], [12, 6, 12], [20, 2, 16], [30, 1, 22]], 0.35));
      return g;
    },
  },
  { ...H, id: 'grinder', pivot: [80, 34.6, 6], build: grinder },
  { ...H, id: 'grinder2', pivot: [119, 34.6, 6], build: () => { const g = grinder(); g.rotation.y = 0.4; return group(g); } },
  ...[1, 2, 3, 4].map((i): PartDef => ({ ...H, id: `jackStand${i}`, pivot: [52 + (i - 1) * 9, 0, 34], build: jackStand })),
  {
    ...H, id: 'boltTrays', pivot: [114, 34, -5],
    build: () => group(...[-4, 0, 4].map(x => boxAt(solid('#8f9498', 0.5, 0.6), [x - 1.8, 0, -1.5], [x + 1.8, 0.8, 1.5]))),
  },
  {
    // Engine hoist: legs + mast + boom; the hook is its own part so it can move.
    ...H, id: 'hoist', pivot: [30, 0, 45],
    build: () => {
      const m = solid('#c2a316', 0.5, 0.4);
      return group(rod(m, [0, 0.8, -12], [0, 0.8, 12], 0.9), rod(m, [0, 0.8, 0], [10, 0.8, 0], 0.9),
        rod(m, [6, 1, 0], [6, 46, 0], 1.1), rod(m, [6, 44, 0], [-30, 52, 0], 0.9));
    },
  },
  {
    ...H, id: 'hoistHook', parent: 'hoist', pivot: [-30, 51, 0],
    build: () => {
      const c = solid('#777', 0.5, 0.8);
      return group(rod(c, [0, 0, 0], [0, -8, 0], 0.25), (() => { const h = new Mesh(new CylinderGeometry(1.2, 1.2, 0.5, 14, 1, true, 0, Math.PI * 1.5), c); h.rotation.x = Math.PI / 2; h.position.y = -9; (h.material as typeof c).side = DoubleSide; return h; })());
    },
  },
  {
    ...H, id: 'floorJack', pivot: [0, 0, 62],
    build: () => {
      const r = solid('#b8321f', 0.5, 0.4);
      const g = group(boxAt(r, [-3.5, 1, -2], [3.5, 4, 14]), rod(mats.zinc(), [0, 4, 14], [0, 22, 30], 0.45));
      for (const [x, z] of [[-3.5, 12], [3.5, 12], [-3.5, 0], [3.5, 0]]) { const w = cylX(mats.black(), 1.1, 0.8, 12); w.position.set(x, 1.1, z); g.add(w); }
      g.add(boxAt(r, [-1.6, 4, -2], [1.6, 7.5, 1]));
      return g;
    },
  },
  {
    // 0.2 cardboard template of the hood's inside profile (pivot like the hood hinge, offset to the side)
    ...H, id: 'hoodTemplate', parent: 'vehicle', pivot: [-22, 17, 61],
    build: () => {
      const m = mats.cardboard(); m.side = DoubleSide;
      return group(extrudeSide(m, [[-27, 0], [-27, 14], [-6, 14], [-3, 13.6], [-0.5, 12.4], [1.2, 10.4], [1.6, 7], [1.4, 3], [0.6, 0]], 0.08));
    },
  },
];

