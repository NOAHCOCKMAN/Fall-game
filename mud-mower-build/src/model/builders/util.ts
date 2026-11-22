import { BoxGeometry, CylinderGeometry, Group, Material, Mesh, Object3D } from 'three';

/** Box whose min corner is at (x0,y0,z0) and max corner at (x1,y1,z1), positioned relative to `origin`. */
export function boxAt(mat: Material, min: [number, number, number], max: [number, number, number], origin: [number, number, number] = [0, 0, 0]) {
  const s = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const m = new Mesh(new BoxGeometry(s[0], s[1], s[2]), mat);
  m.position.set((min[0] + max[0]) / 2 - origin[0], (min[1] + max[1]) / 2 - origin[1], (min[2] + max[2]) / 2 - origin[2]);
  return m;
}

/** Cylinder along X (axle style), centered at origin. */
export function cylX(mat: Material, radius: number, width: number, seg = 32) {
  const m = new Mesh(new CylinderGeometry(radius, radius, width, seg), mat);
  m.rotation.z = Math.PI / 2;
  return m;
}

export function group(...children: Object3D[]) { const g = new Group(); children.forEach(c => g.add(c)); return g; }
