import { Object3D, Quaternion, Vector3 } from 'three';
import type { Model, PartRec } from '../../model/registry';

/** A part's placement: parent + local transform. */
export interface Place { parent: Object3D; pos: Vector3; quat: Quaternion; scale: Vector3; }

export function currentPlace(o: Object3D): Place {
  return { parent: o.parent!, pos: o.position.clone(), quat: o.quaternion.clone(), scale: o.scale.clone() };
}
export function homePlace(r: PartRec): Place {
  return { parent: r.homeParent, pos: r.homePos.clone(), quat: r.homeQuat.clone(), scale: r.homeScale.clone() };
}

/** World-space transform of a placement. */
export function worldOf(p: Place) {
  p.parent.updateWorldMatrix(true, false);
  const pq = new Quaternion(), ps = new Vector3(), pp = new Vector3();
  p.parent.matrixWorld.decompose(pp, pq, ps);
  return {
    pos: p.pos.clone().multiply(ps).applyQuaternion(pq).add(pp),
    quat: pq.clone().multiply(p.quat),
    scale: p.scale.clone().multiply(ps),
  };
}

export function setPlace(o: Object3D, p: Place) {
  if (o.parent !== p.parent) p.parent.add(o);
  o.position.copy(p.pos); o.quaternion.copy(p.quat); o.scale.copy(p.scale);
}

/** World-space placement under model.shelfRoot (identity transform). */
export function worldPlace(m: Model, pos: Vector3, quat: Quaternion, scale: Vector3): Place {
  return { parent: m.shelfRoot, pos, quat, scale };
}

/** Quadratic arc from a to b with apex `lift` above the higher end. */
export function arc(a: Vector3, b: Vector3, u: number, lift: number) {
  const c = a.clone().add(b).multiplyScalar(0.5); c.y = Math.max(a.y, b.y) + lift;
  const i = 1 - u;
  return new Vector3(
    i * i * a.x + 2 * i * u * c.x + u * u * b.x,
    i * i * a.y + 2 * i * u * c.y + u * u * b.y,
    i * i * a.z + 2 * i * u * c.z + u * u * b.z,
  );
}

/** Shelf placement for a part: next slot, scale 0.6, bottom resting on the slot surface. */
export function shelfPlace(m: Model, r: PartRec): Place {
  const slot = m.nextShelfSlot();
  const b = m.bounds(r.id);
  const wq = new Quaternion(), wp = new Vector3(), ws = new Vector3();
  r.obj.updateWorldMatrix(true, false);
  r.obj.matrixWorld.decompose(wp, wq, ws);
  const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
  const k = 0.6;
  const pos = new Vector3(slot.x - (cx - wp.x) * k, slot.y + (wp.y - b.min.y) * k, slot.z - (cz - wp.z) * k);
  return worldPlace(m, pos, wq, ws.multiplyScalar(k));
}
