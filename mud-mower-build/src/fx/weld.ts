import { CatmullRomCurve3, Color, Group, LineCurve3, Mesh, MeshStandardMaterial, SphereGeometry, TubeGeometry, Vector3, type Curve } from 'three';

const HOT = new Color('#ff7a1a');
const COOL = new Color('#3a3936');

export interface BeadOpts {
  tack?: boolean;               // short dots at the ends + every ~6 in
  stitch?: [number, number];    // [weld length, pitch] in inches, e.g. [1, 3]
  segs?: boolean;               // pts are endpoint pairs of separate segments
  radius?: number;
}

interface Piece { mesh: Mesh; start: number; end: number; }   // fraction of total run where this piece is laid
export interface Bead { obj: Group; pieces: Piece[]; mat: MeshStandardMaterial; heat: Mesh[]; total: number; at(u: number): Vector3; }

function curveOf(pts: Vector3[]): Curve<Vector3> {
  return pts.length === 2 ? new LineCurve3(pts[0], pts[1]) : new CatmullRomCurve3(pts);
}

/** Build a weld bead along a seam: continuous, tack dots, stitch dashes, or several separate segments. */
export function makeBead(pts: Vector3[], o: BeadOpts = {}): Bead {
  const r = o.radius ?? 0.17;
  const mat = new MeshStandardMaterial({ color: COOL, roughness: 0.7, metalness: 0.4, emissive: HOT.clone(), emissiveIntensity: 0 });
  mat.userData.noPaint = true;
  // faint straw/blue heat tint on the base metal next to the bead
  const tintMat = new MeshStandardMaterial({ color: '#c9a25a', emissive: '#5a6fb0', emissiveIntensity: 0.25, transparent: true, opacity: 0.0, depthWrite: false, roughness: 0.6 });
  tintMat.userData.noPaint = true;
  const curves: Curve<Vector3>[] = [];
  if (o.segs) for (let i = 0; i + 1 < pts.length; i += 2) curves.push(curveOf([pts[i], pts[i + 1]]));
  else curves.push(curveOf(pts));
  const lens = curves.map(c => c.getLength());
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  const obj = new Group();
  const pieces: Piece[] = [];
  const heat: Mesh[] = [];
  let acc = 0;
  curves.forEach((c, ci) => {
    const L = lens[ci];
    const add = (u0: number, u1: number) => {
      const start = (acc + u0 * L) / total, end = (acc + u1 * L) / total;
      if (o.tack) {
        const s = new Mesh(new SphereGeometry(r * 1.5, 10, 8), mat);
        s.position.copy(c.getPointAt((u0 + u1) / 2)); s.scale.set(1, 0.75, 1);
        obj.add(s); pieces.push({ mesh: s, start, end });
        return;
      }
      const sub = u0 === 0 && u1 === 1 ? c : new LineCurve3(c.getPointAt(u0), c.getPointAt(u1));
      const segN = Math.max(4, Math.round(sub.getLength() * 6));
      const m = new Mesh(new TubeGeometry(sub, segN, r, 6, false), mat);
      obj.add(m); pieces.push({ mesh: m, start, end });
      const h = new Mesh(new TubeGeometry(sub, Math.max(2, segN >> 1), r * 3.2, 6, false), tintMat);
      h.renderOrder = 2; obj.add(h); heat.push(h);
    };
    if (o.tack) {
      const n = Math.max(3, Math.round(L / 6) + 1);
      for (let i = 0; i < n; i++) { const u = 0.03 + (0.94 * i) / (n - 1); add(Math.max(0, u - 0.005), Math.min(1, u + 0.005)); }
    } else if (o.stitch) {
      const [w, pitch] = o.stitch;
      for (let z = 0; z < L - 0.2; z += pitch) add(z / L, Math.min(L, z + w) / L);
    } else add(0, 1);
    acc += L;
  });
  obj.traverse(x => { (x as Mesh).castShadow = false; x.userData.noShadow = true; });
  const at = (u: number) => {
    let d = u * total;
    for (let i = 0; i < curves.length; i++) { if (d <= lens[i] || i === curves.length - 1) return curves[i].getPointAt(Math.min(1, Math.max(0, d / lens[i]))); d -= lens[i]; }
    return pts[0].clone();
  };
  return { obj, pieces, mat, heat, total, at };
}

/** Draw progress 0..1 and heat 0..1 (1 = glowing orange, 0 = cooled dark gray). */
export function setBead(b: Bead, draw: number, heat: number) {
  for (const p of b.pieces) {
    const k = p.end <= p.start ? (draw >= p.end ? 1 : 0) : Math.max(0, Math.min(1, (draw - p.start) / (p.end - p.start)));
    p.mesh.visible = k > 0;
    const g = p.mesh.geometry;
    if (g.index && g.type === 'TubeGeometry') g.setDrawRange(0, Math.ceil((g.index.count / 6) * k) * 6);
  }
  b.heat.forEach((h, i) => { h.visible = b.pieces[i] ? b.pieces[i].mesh.visible : false; });
  if (b.heat[0]) (b.heat[0].material as MeshStandardMaterial).opacity = draw > 0 ? 0.18 + 0.12 * heat : 0;
  b.obj.visible = draw > 0;
  b.mat.emissiveIntensity = heat * 2.2;
  b.mat.color.copy(COOL).lerp(HOT, heat * 0.6);
}
