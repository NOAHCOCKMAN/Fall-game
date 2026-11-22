import {
  BoxGeometry, CatmullRomCurve3, CylinderGeometry, ExtrudeGeometry, Group, LatheGeometry, Material, Mesh, Object3D,
  Shape, TorusGeometry, TubeGeometry, Vector2, Vector3,
} from 'three';

type V3 = [number, number, number];

/** Box spanning min..max corners, positioned relative to `origin` (the part's pivot). */
export function boxAt(mat: Material, min: V3, max: V3, origin: V3 = [0, 0, 0]) {
  const s = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const m = new Mesh(new BoxGeometry(s[0], s[1], s[2]), mat);
  m.position.set((min[0] + max[0]) / 2 - origin[0], (min[1] + max[1]) / 2 - origin[1], (min[2] + max[2]) / 2 - origin[2]);
  return m;
}

/** Cylinder along X, centered at origin. */
export function cylX(mat: Material, radius: number, width: number, seg = 32) {
  const m = new Mesh(new CylinderGeometry(radius, radius, width, seg), mat);
  m.rotation.z = Math.PI / 2;
  return m;
}
/** Cylinder along Z, centered at origin. */
export function cylZ(mat: Material, radius: number, len: number, seg = 24) {
  const m = new Mesh(new CylinderGeometry(radius, radius, len, seg), mat);
  m.rotation.x = Math.PI / 2;
  return m;
}
/** Cylinder from point a to point b. */
export function rod(mat: Material, a: V3, b: V3, radius: number, seg = 10) {
  const va = new Vector3(...a), vb = new Vector3(...b);
  const len = va.distanceTo(vb);
  const m = new Mesh(new CylinderGeometry(radius, radius, len, seg), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return m;
}
/** Smooth tube through points (cables, wiring, linkages). */
export function tube(mat: Material, pts: V3[], radius: number, closed = false) {
  const c = new CatmullRomCurve3(pts.map(p => new Vector3(...p)), closed, 'catmullrom', 0.2);
  return new Mesh(new TubeGeometry(c, Math.max(16, pts.length * 12), radius, 8, closed), mat);
}

/** Tire (lathe profile, axis along X) with `ribs` shallow circumferential grooves. */
export function tire(mat: Material, diameter: number, width: number, ribs = 3) {
  const R = diameter / 2, w = width / 2, r0 = R * 0.6, k = Math.min(w, R * 0.18);
  const pts: Vector2[] = [new Vector2(r0, -w)];
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push(new Vector2(R - k + Math.sin(a) * k, -w + k - Math.cos(a) * k)); }
  // tread band with grooves
  const n = ribs * 2 + 1;
  for (let i = 1; i < n; i++) {
    const y = -w + k + ((w - k) * 2 * i) / n;
    const groove = i % 2 === 1;
    pts.push(new Vector2(R - (groove ? 0 : 0.0), y - 0.15), new Vector2(R - (groove ? 0.3 : 0), y), new Vector2(R, y + 0.15));
  }
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push(new Vector2(R - k + Math.cos(a) * k, w - k + Math.sin(a) * k)); }
  pts.push(new Vector2(r0, w));
  const g = new LatheGeometry(pts, 40);
  const m = new Mesh(g, mat);
  m.rotation.z = -Math.PI / 2;  // lathe axis Y -> X
  return m;
}

/** Simple dished wheel rim (axis X). */
export function rim(mat: Material, diameter: number, width: number) {
  const g = new Group();
  const r = diameter / 2;
  const barrel = new Mesh(new CylinderGeometry(r, r, width * 0.92, 28, 1, true), mat);
  barrel.rotation.z = Math.PI / 2; g.add(barrel);
  const disc = cylX(mat, r * 0.98, 0.25, 28); g.add(disc);
  const hub = cylX(mat, r * 0.28, width * 0.5, 16); g.add(hub);
  return g;
}

/** Extrude a side profile (in Z,Y) across X from -halfW..+halfW. */
export function extrudeSide(mat: Material, profile: [number, number][], halfW: number, bevel = 0) {
  const s = new Shape(profile.map(([z, y]) => new Vector2(z, y)));
  const g = new ExtrudeGeometry(s, { depth: halfW * 2 - bevel * 2, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, steps: 1 });
  g.translate(0, 0, -halfW + bevel);
  g.rotateY(-Math.PI / 2);  // extrusion (local Z) -> X ; shape X (=Z) -> Z
  return new Mesh(g, mat);
}

export function ring(mat: Material, r: number, tubeR: number, arc = Math.PI * 2) { return new Mesh(new TorusGeometry(r, tubeR, 8, 32, arc), mat); }

export function group(...children: Object3D[]) { const g = new Group(); children.forEach(c => g.add(c)); return g; }
