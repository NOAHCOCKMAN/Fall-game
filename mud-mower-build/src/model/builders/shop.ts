import { BoxGeometry, CylinderGeometry, Mesh } from 'three';
import type { PartDef } from '../registry';
import { mats } from '../../scene/materials';
import { boxAt, group } from './util';

// Static shop diorama props (A8). Parts so later steps can animate them (0.3 pops them in).
export const shopParts: PartDef[] = [
  {
    id: 'workbench', tags: ['prop'], pivot: [100, 0, 0],
    build() {
      const w = mats.wood(), s = mats.black();
      const g = group(boxAt(w, [-24, 32, -10], [24, 34, 10]));
      for (const x of [-22, 22]) for (const z of [-8, 8]) g.add(boxAt(s, [x - 1, 0, z - 1], [x + 1, 32, z + 1]));
      g.add(boxAt(w, [-22, 8, -8], [22, 9, 8]));
      return g;
    },
  },
  {
    id: 'partsShelf', tags: ['prop'], pivot: [77, 0, 46],
    build() {
      const s = mats.oldSteel(), w = mats.wood();
      const g = group();
      for (const y of [20, 40]) g.add(boxAt(w, [-8, y, -28], [8, y + 1, 28]));
      for (const x of [-8, 7]) for (const z of [-28, 27]) g.add(boxAt(s, [x, 0, z], [x + 1, 46, z + 1]));
      return g;
    },
  },
  {
    id: 'scrapBin', tags: ['prop'], pivot: [75, 0, -30],
    build() {
      const m = mats.oldSteel();
      const g = group(boxAt(m, [-10, 0, -8], [10, 1, 8]));
      g.add(boxAt(m, [-10, 0, -8], [10, 18, -7.5]), boxAt(m, [-10, 0, 7.5], [10, 18, 8]));
      g.add(boxAt(m, [-10, 0, -8], [-9.5, 18, 8]), boxAt(m, [9.5, 0, -8], [10, 18, 8]));
      return g;
    },
  },
  {
    id: 'toolbox', tags: ['prop'], pivot: [70, 0, 10],
    build() {
      const r = mats.toolRed(), z = mats.zinc();
      const g = group(boxAt(r, [-12, 3, -7], [12, 36, 7]));
      for (const y of [10, 17, 24, 31]) g.add(boxAt(z, [-8, y, 7], [8, y + 0.8, 7.6]));
      for (const x of [-10, 10]) for (const zz of [-5, 5]) {
        const c = new Mesh(new CylinderGeometry(1.5, 1.5, 1.2, 16), mats.black());
        c.rotation.z = Math.PI / 2; c.position.set(x, 1.5, zz); g.add(c);
      }
      return g;
    },
  },
  {
    id: 'fireExtinguisher', tags: ['prop'], pivot: [66, 0, -48],
    build() {
      const body = new Mesh(new CylinderGeometry(2.6, 2.6, 16, 24), mats.red());
      body.position.y = 8;
      const head = new Mesh(new BoxGeometry(2, 3, 3), mats.black());
      head.position.y = 17.5;
      return group(body, head);
    },
  },
];
