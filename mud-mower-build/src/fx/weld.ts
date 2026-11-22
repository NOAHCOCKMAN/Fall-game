import { CatmullRomCurve3, Color, Group, LineCurve3, Mesh, MeshStandardMaterial, SphereGeometry, TubeGeometry, Vector3, type Curve } from 'three';

const HOT = new Color('#ff7a1a');
const COOL = new Color('#3a3936');

export interface Bead { obj: Group; curve: Curve<Vector3>; tubes: Mesh[]; mat: MeshStandardMaterial; tack: boolean; length: number; }

/** Build a weld bead along a polyline. `tack` = short dots at the ends + midpoint. */
export function makeBead(pts: Vector3[], tack = false, radius = 0.17): Bead {
  const curve: Curve<Vector3> = pts.length === 2 ? new LineCurve3(pts[0], pts[1]) : new CatmullRomCurve3(pts);
  const mat = new MeshStandardMaterial({ color: COOL, roughness: 0.7, metalness: 0.4, emissive: HOT.clone(), emissiveIntensity: 0 });
  mat.userData.noPaint = true;
  const obj = new Group();
  const tubes: Mesh[] = [];
  if (tack) {
    for (const u of [0.04, 0.5, 0.96]) {
      const s = new Mesh(new SphereGeometry(radius * 1.5, 10, 8), mat);
      s.position.copy(curve.getPointAt(u)); s.scale.set(1, 0.7, 1.4);
      obj.add(s); tubes.push(s);
    }
  } else {
    const segs = Math.max(8, Math.round(curve.getLength() * 6));
    const m = new Mesh(new TubeGeometry(curve, segs, radius, 6, false), mat);
    obj.add(m); tubes.push(m);
  }
  obj.traverse(o => { (o as Mesh).castShadow = false; });
  return { obj, curve, tubes, mat, tack, length: curve.getLength() };
}

/** Draw progress 0..1 and heat 0..1 (1 = glowing orange, 0 = cooled dark gray). */
export function setBead(b: Bead, draw: number, heat: number) {
  if (b.tack) {
    b.tubes.forEach((t, i) => { t.visible = draw >= (i + 1) / b.tubes.length - 1e-6; });
  } else {
    const g = (b.tubes[0] as Mesh).geometry;
    const total = g.index ? g.index.count : g.attributes.position.count;
    const n = Math.floor((total / 6) * draw) * 6;
    g.setDrawRange(0, n);
  }
  b.obj.visible = draw > 0;
  b.mat.emissiveIntensity = heat * 2.2;
  b.mat.color.copy(COOL).lerp(HOT, heat * 0.6);
}
