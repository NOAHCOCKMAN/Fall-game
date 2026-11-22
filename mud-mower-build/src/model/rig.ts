import { Object3D, Quaternion, Vector3 } from 'three';
import type { Model } from './registry';
import { FRONT, ackermannOuter } from './geom';
import { STEER } from './builders/steering';

/**
 * Front-end rig: bump/articulation about the wishbone apex, Ackermann steering about the kingpins, and
 * links (panhard, drag link, tie rod, coilovers, limit straps) stretched between their end markers.
 */
interface LinkDef { id: string; a: [string, string]; b: [string, string]; kind: 'rod' | 'coil'; }
const LINKS: LinkDef[] = [
  { id: 'panhard', a: ['panhardTab', 'hole'], b: ['axleBeam', 'panhardEnd'], kind: 'rod' },
  { id: 'dragLink', a: ['pitmanArm', 'ball'], b: ['knuckleR', 'dragHole'], kind: 'rod' },
  { id: 'tieRod', a: ['knuckleL', 'steerHole'], b: ['knuckleR', 'steerHole'], kind: 'rod' },
  { id: 'coiloverL', a: ['shockTowerL', 'eye'], b: ['axleBeam', 'coilLowerL'], kind: 'coil' },
  { id: 'coiloverR', a: ['shockTowerR', 'eye'], b: ['axleBeam', 'coilLowerR'], kind: 'coil' },
  { id: 'limitStrapL', a: ['frameRailL', 'strapTop'], b: ['axleBeam', 'strapL'], kind: 'rod' },
  { id: 'limitStrapR', a: ['frameRailR', 'strapTop'], b: ['axleBeam', 'strapR'], kind: 'rod' },
];

export interface FrontPose { bump: number; rollDeg: number; steerDeg: number; }
export const NEUTRAL: FrontPose = { bump: 0, rollDeg: 0, steerDeg: 0 };

const UP = new Vector3(0, 1, 0);
const COLUMN = new Vector3(...STEER.uUpper).sub(new Vector3(...STEER.hub)).normalize();

function marker(m: Model, [part, name]: [string, string]): Object3D | null {
  if (!m.has(part)) return null;
  return m.get(part).obj.getObjectByName(name) ?? null;
}

/** true when the part hangs (via its parents) on the vehicle — not on the bench / shelf / in flight. */
function onVehicle(m: Model, o: Object3D) {
  for (let p: Object3D | null = o; p; p = p.parent) { if (p === m.vehicle) return true; if (p === m.shelfRoot) return false; }
  return false;
}

/** Shape a link part so it spans a→b (vehicle-local). */
function shape(o: Object3D, a: Vector3, b: Vector3, kind: LinkDef['kind'], restLen?: number) {
  const d = b.clone().sub(a); const len = Math.max(0.01, d.length());
  o.position.copy(a);
  o.quaternion.setFromUnitVectors(UP, d.normalize());
  const endB = o.getObjectByName('endB'); if (endB) endB.position.set(0, len, 0);
  if (kind === 'rod') { const t = o.getObjectByName('tube'); if (t) t.scale.set(1, len, 1); }
  else {
    // coilover: body hangs from the top eye, shaft slides out of it; the spring spans eye to eye
    const sp = o.getObjectByName('spring'); if (sp) sp.scale.set(1, len, 1);
    const sh = o.getObjectByName('shaft'); if (sh) { sh.position.y = 4.5; sh.scale.set(1, Math.max(0.2, len - 4.5), 1); }
    void restLen;
  }
}

function ends(m: Model, l: LinkDef) {
  const ma = marker(m, l.a), mb = marker(m, l.b);
  if (!ma || !mb) return null;
  m.vehicle.updateMatrixWorld(true);
  const a = m.vehicle.worldToLocal(ma.getWorldPosition(new Vector3()));
  const b = m.vehicle.worldToLocal(mb.getWorldPosition(new Vector3()));
  return { a, b, ma, mb };
}

/** Called once after the model is built: link home transforms come from the markers at home. */
export function initLinks(m: Model) {
  for (const l of LINKS) {
    if (!m.has(l.id)) continue;
    const e = ends(m, l); if (!e) continue;
    const r = m.get(l.id);
    shape(r.obj, e.a, e.b, l.kind);
    r.homePos.copy(r.obj.position); r.homeQuat.copy(r.obj.quaternion);
  }
  m.onReset.push(() => updateLinks(m));
}

/** Re-shape every installed link whose both ends are on the vehicle. */
export function updateLinks(m: Model) {
  for (const l of LINKS) {
    if (!m.has(l.id)) continue;
    const r = m.get(l.id);
    if (r.obj.parent !== r.homeParent) continue;
    // moved by the 9.2 strip-down (or not installed yet and parked): leave it alone
    if (r.obj.position.distanceTo(r.homePos) > 3 || (m.has('axleBeam') && m.get('axleBeam').obj.position.distanceTo(m.get('axleBeam').homePos) > 3)) continue;
    const e = ends(m, l);
    if (!e) continue;
    if (!onVehicle(m, e.ma) || !onVehicle(m, e.mb)) { r.obj.position.copy(r.homePos); r.obj.quaternion.copy(r.homeQuat); continue; }
    shape(r.obj, e.a, e.b, l.kind);
  }
}

/** Inner/outer wheel yaw (degrees, about each kingpin) for a steering input. steerDeg > 0 = left turn. */
export function wheelYaws(steerDeg: number) {
  const inner = Math.abs(steerDeg), outer = Math.abs(ackermannOuter(inner));
  // yaw > 0 turns the wheel toward +X (right)
  return steerDeg >= 0 ? { L: -inner, R: -outer } : { L: outer, R: inner };
}

/** Pose the front end. Knuckles only follow the steering wheel once the drag link is connected. */
export function setFrontPose(m: Model, p: FrontPose) {
  const rad = Math.PI / 180;
  if (m.has('axleBeam')) {
    const r = m.get('axleBeam');
    if (r.obj.parent === r.homeParent) {
      const pitch = -Math.atan2(p.bump, FRONT.beamRel[2]);
      r.obj.quaternion.copy(r.homeQuat).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch))
        .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), p.rollDeg * rad));
    }
  }
  const linked = m.has('dragLink') && m.get('dragLink').obj.visible && m.get('dragLink').obj.parent === m.get('dragLink').homeParent;
  const yaw = linked ? wheelYaws(p.steerDeg) : { L: 0, R: 0 };
  for (const s of ['L', 'R'] as const) {
    if (!m.has(`knuckle${s}`)) continue;
    const r = m.get(`knuckle${s}`);
    if (r.obj.parent !== r.homeParent) continue;
    r.obj.quaternion.copy(r.homeQuat).multiply(new Quaternion().setFromAxisAngle(UP, yaw[s] * rad));
  }
  // steering wheel ≈ 3:1 visual ratio to the inside wheel; pitman swings with the input
  if (m.has('steeringWheel')) {
    const r = m.get('steeringWheel');
    if (r.obj.parent === r.homeParent) r.obj.quaternion.copy(new Quaternion().setFromAxisAngle(COLUMN, -p.steerDeg * 3 * rad)).multiply(r.homeQuat);
  }
  for (const id of ['uJointUpper', 'uJointLower']) if (m.has(id)) { const r = m.get(id); r.obj.quaternion.copy(r.homeQuat).multiply(new Quaternion().setFromAxisAngle(UP, p.steerDeg * 3 * rad)); }
  if (m.has('pitmanArm')) { const r = m.get('pitmanArm'); r.obj.quaternion.copy(r.homeQuat).multiply(new Quaternion().setFromAxisAngle(UP, p.steerDeg * 1.1 * rad)); }
  m.vehicle.updateMatrixWorld(true);
  updateLinks(m);
}
