import { ConeGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, RingGeometry, SphereGeometry, Vector3, DoubleSide, TorusGeometry } from 'three';

/** Overlay material: always drawn on top so dimensions read through parts. */
export function overlayMat(color: string, opacity = 1) {
  const m = new MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity });
  m.userData.noPaint = true;
  return m;
}
function onTop(o: Mesh) { o.renderOrder = 999; o.userData.noShadow = true; o.castShadow = false; return o; }

/** Dimension line a→b with arrowheads; grow 0..1 draws it out from the middle. */
export function makeDimension(a: Vector3, b: Vector3, color = '#ffd23f') {
  const g = new Group();
  const mat = overlayMat(color);
  const len = a.distanceTo(b);
  const dir = b.clone().sub(a).normalize();
  const line = onTop(new Mesh(new CylinderGeometry(0.12, 0.12, 1, 6), mat));
  const ca = onTop(new Mesh(new ConeGeometry(0.55, 1.6, 10), mat));
  const cb = onTop(new Mesh(new ConeGeometry(0.55, 1.6, 10), mat));
  g.add(line, ca, cb);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const up = new Vector3(0, 1, 0);
  const set = (grow: number) => {
    const half = Math.max(0.001, (len / 2) * grow);
    line.scale.set(1, half * 2, 1);
    line.position.copy(mid);
    line.quaternion.setFromUnitVectors(up, dir);
    ca.position.copy(mid).addScaledVector(dir, -half + 0.8); ca.quaternion.setFromUnitVectors(up, dir.clone().negate());
    cb.position.copy(mid).addScaledVector(dir, half - 0.8); cb.quaternion.setFromUnitVectors(up, dir);
    g.visible = grow > 0;
  };
  set(0);
  return { obj: g, set, mid };
}

/** Thin red alignment laser a→b with a bright dot at b. */
export function makeLaser(a: Vector3, b: Vector3) {
  const g = new Group();
  const mat = overlayMat('#ff2a2a', 0.9);
  const dir = b.clone().sub(a); const len = dir.length(); dir.normalize();
  const beam = onTop(new Mesh(new CylinderGeometry(0.06, 0.06, 1, 6), mat));
  const dot = onTop(new Mesh(new SphereGeometry(0.35, 10, 8), overlayMat('#ff8080')));
  g.add(beam, dot);
  const set = (grow: number) => {
    const l = Math.max(0.001, len * grow);
    beam.scale.set(1, l, 1);
    beam.position.copy(a).addScaledVector(dir, l / 2);
    beam.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir);
    dot.position.copy(a).addScaledVector(dir, l);
    g.visible = grow > 0;
  };
  set(0);
  return { obj: g, set };
}

/** Protractor arc (in the YZ plane, i.e. seen from the side) showing `deg`. */
export function makeGauge(at: Vector3, deg: number, radius = 4) {
  const g = new Group();
  g.position.copy(at);
  const faceMat = overlayMat('#ffd23f', 0.35); faceMat.side = DoubleSide;
  const face = onTop(new Mesh(new RingGeometry(radius * 0.2, radius, 32, 1, Math.PI / 2, 0.0001), faceMat));
  const ref = onTop(new Mesh(new CylinderGeometry(0.08, 0.08, radius * 1.2, 6), overlayMat('#ffffff', 0.8)));
  ref.position.y = radius * 0.6;
  const arm = onTop(new Mesh(new CylinderGeometry(0.1, 0.1, radius * 1.2, 6), overlayMat('#ffd23f')));
  const armPivot = new Group(); arm.position.y = radius * 0.6; armPivot.add(arm);
  const arc = onTop(new Mesh(new TorusGeometry(radius * 0.8, 0.07, 6, 40, 0.0001), overlayMat('#ffd23f')));
  g.add(face, ref, armPivot, arc);
  g.rotation.y = Math.PI / 2;    // XY-plane geometry -> YZ plane
  const set = (k: number) => {
    const a = (deg * Math.PI / 180) * k;
    armPivot.rotation.z = a;
    face.geometry.dispose(); face.geometry = new RingGeometry(radius * 0.2, radius, 24, 1, Math.PI / 2, Math.max(0.0001, a));
    arc.geometry.dispose(); arc.geometry = new TorusGeometry(radius * 0.8, 0.07, 6, 32, Math.max(0.0001, a));
    arc.rotation.z = Math.PI / 2;
    g.visible = k > 0;
  };
  set(0);
  return { obj: g, set };
}
