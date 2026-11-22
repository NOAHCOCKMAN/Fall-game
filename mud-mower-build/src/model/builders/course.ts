import { CircleGeometry, ConeGeometry, CylinderGeometry, DodecahedronGeometry, Mesh, SphereGeometry } from 'three';
import type { PartDef } from '../registry';
import { keep, solid } from '../../scene/materials';
import { group } from './util';

// 9.6 finale terrain, laid out in front of the shop (world space). The drive path is in anchors ('path.finale').
export const COURSE = {
  pit: { x: 0, z: 150, r: 26 },
  logs: [{ x: 0, z: 205 }, { x: 0, z: 222 }],
  rock: { x: -16, z: 265 },
  trees: [{ x: -34, z: 320 }, { x: 34, z: 320 }, { x: -60, z: 300 }, { x: 70, z: 260 }, { x: -70, z: 200 }, { x: 60, z: 360 }],
  rise: { x: 40, z: 380, r: 40, h: 7 },
};

/** Terrain height at a world point (the drive action follows it). */
export function terrainHeight(x: number, z: number) {
  const { pit, rise, logs, rock } = COURSE;
  let h = 0;
  const dp = Math.hypot(x - pit.x, z - pit.z); if (dp < pit.r) h -= 2.5 * (1 + Math.cos(Math.PI * dp / pit.r)) / 2;
  const dr = Math.hypot(x - rise.x, z - rise.z); if (dr < rise.r) h += rise.h * (1 + Math.cos(Math.PI * dr / rise.r)) / 2;
  for (const l of logs) if (Math.abs(z - l.z) < 5) h += 3.5 * Math.cos((z - l.z) / 5 * Math.PI / 2);
  const dk = Math.hypot(x - rock.x, z - rock.z); if (dk < 8) h += 0; // rock step handled as articulation
  return h;
}

export const courseParts: PartDef[] = [
  {
    id: 'mudCourse', defaultState: 'hidden', tags: ['prop'],
    build: () => {
      const grass = keep(solid('#5c7a3a', 0.95, 0)), mud = keep(solid('#4a3520', 0.4, 0)), bark = keep(solid('#5a4128', 0.9, 0)), leaf = keep(solid('#2f5a2a', 0.9, 0)), rockM = keep(solid('#7a7770', 0.95, 0));
      const g = group();
      const ground = new Mesh(new CircleGeometry(260, 48), grass); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0.05, 230); ground.userData.noShadow = true; g.add(ground);
      const pit = new Mesh(new CircleGeometry(COURSE.pit.r, 40), mud); pit.rotation.x = -Math.PI / 2; pit.position.set(COURSE.pit.x, 0.12, COURSE.pit.z); g.add(pit);
      for (const l of COURSE.logs) { const m = new Mesh(new CylinderGeometry(3.5, 3.5, 60, 14), bark); m.rotation.z = Math.PI / 2; m.position.set(l.x, 1.8, l.z); g.add(m); }
      const r = new Mesh(new DodecahedronGeometry(7, 0), rockM); r.scale.set(1.1, 0.6, 1.3); r.position.set(COURSE.rock.x, 2.5, COURSE.rock.z); g.add(r);
      for (const t of COURSE.trees) {
        const trunk = new Mesh(new CylinderGeometry(2.5, 3.2, 40, 10), bark); trunk.position.set(t.x, 20, t.z); g.add(trunk);
        const crown = new Mesh(new ConeGeometry(16, 60, 12), leaf); crown.position.set(t.x, 66, t.z); g.add(crown);
      }
      const rise = new Mesh(new SphereGeometry(COURSE.rise.r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), grass); rise.scale.y = COURSE.rise.h / COURSE.rise.r; rise.position.set(COURSE.rise.x, 0, COURSE.rise.z); g.add(rise);
      return g;
    },
  },
  {
    id: 'mudPatch', defaultState: 'hidden', tags: ['prop'], pivot: [17, 0.1, 0],
    build: () => { const p = new Mesh(new CircleGeometry(14, 28), keep(solid('#4a3520', 0.35, 0))); p.rotation.x = -Math.PI / 2; return group(p); },
  },
];
