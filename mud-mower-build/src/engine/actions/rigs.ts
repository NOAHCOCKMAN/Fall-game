import { CatmullRomCurve3, Color, CylinderGeometry, Mesh, MeshBasicMaterial, Object3D, Quaternion, TubeGeometry, Vector3 } from 'three';
import type { Action } from '../../steps/types';
import type { Model } from '../../model/registry';
import { setFrontPose, wheelYaws } from '../../model/rig';
import { ackermannOuter, ENGINE } from '../../model/geom';
import { beltCurve, driverRadiusFor } from '../../model/builders/drivetrain';
import { terrainHeight } from '../../model/builders/course';
import { setLabelText } from '../../fx/labels';
import { expandParts } from '../../model/groups';
import { clamp01, easeInOut, seg, track, type Ctx } from '../context';
import type { Handler } from './types';

type A<T extends Action['type']> = Extract<Action, { type: T }>;
const noop = () => { /* no end state */ };
const UP = new Vector3(0, 1, 0);

// ---------------- suspension ----------------
/** Bump cycles, then articulation (one wheel up a rock, the other down), then settle. Frame stays; vehicle lifts so the drooping wheel stays planted. */
export const cycleSuspension: Handler<A<'cycleSuspension'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const m = ctx.model;
    const v = m.vehicle, y0 = v.position.y;
    const rock = a.rock && m.has('rockProp') ? m.get('rockProp') : null;
    const bumpEnd = a.articulationDeg ? 0.45 : 1;
    track(tl, a.t, a.dur, (_s, u) => {
      let bump = 0, roll = 0;
      if (u > 0 && u < 1) {
        if (u < bumpEnd) bump = a.bumpIn * Math.sin(Math.PI * a.cycles * 2 * (u / bumpEnd)) ** 2 * (u / bumpEnd < 0.999 ? 1 : 0);
        else {
          const k = seg(u, bumpEnd, 1);
          const env = k < 0.3 ? easeInOut(k / 0.3) : k > 0.75 ? 1 - easeInOut((k - 0.75) / 0.25) : 1;
          roll = -a.articulationDeg * env;          // left wheel climbs
        }
      }
      m.pose.bump = bump; m.pose.rollDeg = roll;
      v.position.y = y0 + 16 * Math.sin(Math.abs(roll) * Math.PI / 180) * 0.5;
      if (rock) { rock.obj.visible = u > bumpEnd - 0.03 && u < 0.98; }
      setFrontPose(m, m.pose);
    });
  },
};

// ---------------- steering ----------------
function ackermannLine(): Mesh {
  const mat = new MeshBasicMaterial({ color: '#ffd23f', transparent: true, opacity: 0.85, depthTest: false });
  mat.userData.noPaint = true;
  const g = new Mesh(new CylinderGeometry(0.08, 0.08, 1, 6), mat);
  g.geometry.translate(0, 0.5, 0); g.renderOrder = 999;
  return g;
}

/** Lock-to-lock sweeps. Inside wheel to innerMaxDeg, outside follows Ackermann; optional live labels + Ackermann lines. */
export const steerSweep: Handler<A<'steerSweep'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const m = ctx.model, fx = ctx.fx;
    const lab = fx && a.label ? fx.callout(fx.transient, new Vector3(0, 36, 52), `Inside 0° / Outside 0°`, undefined, 'measure') : null;
    const lines = fx && a.ackermannLines ? [ackermannLine(), ackermannLine()] : [];
    lines.forEach(l => fx!.transient.add(l));
    track(tl, a.t, a.dur, (_s, u) => {
      const on = u > 0 && u < 1;
      const steer = on ? a.innerMaxDeg * Math.sin(2 * Math.PI * a.cycles * u) * Math.min(1, Math.sin(Math.PI * u) * 3) : 0;
      m.pose.steerDeg = steer;
      setFrontPose(m, m.pose);
      if (lab) {
        lab.visible = on;
        const inner = Math.abs(steer), outer = Math.abs(ackermannOuter(inner));
        setLabelText(lab, `Inside ${inner.toFixed(0)}° / Outside ≈ ${outer.toFixed(0)}°`);
      }
      lines.forEach((l, i) => {
        const k = m.has(i ? 'knuckleR' : 'knuckleL') ? m.get(i ? 'knuckleR' : 'knuckleL').obj : null;
        l.visible = on && !!k && Math.abs(steer) > 8;
        if (!l.visible || !k) return;
        // line along each spindle axis, inward — they meet near the rear axle center when Ackermann is right
        const p = k.getWorldPosition(new Vector3());
        const axis = new Vector3(i ? -1 : 1, 0, 0).applyQuaternion(k.getWorldQuaternion(new Quaternion()));
        axis.y = 0; axis.normalize();
        l.position.copy(p).setY(1); l.quaternion.setFromUnitVectors(UP, axis); l.scale.set(1, 70, 1);
      });
      void wheelYaws;
    });
  },
};

// ---------------- CVT ----------------
function setBelt(m: Model, ratio: number) {
  if (!m.has('cvtBelt')) return;
  const r1 = driverRadiusFor(ratio), r2 = Math.min(3.6, ratio * r1);
  const mesh = m.get('cvtBelt').obj.children[0] as Mesh;
  mesh.geometry.dispose();
  mesh.geometry = new TubeGeometry(beltCurve(ENGINE.driver, r1, ENGINE.driven, r2), 90, 0.28, 6, true);
  // driver sheaves close as it shifts up
  const drv = m.has('cvtDriver') ? m.get('cvtDriver').obj : null;
  if (drv && drv.children.length > 1) { const k = clamp01(1 - (ratio - 0.9) / 1.9); drv.children[0].position.z = -0.55 + 0.3 * k; drv.children[1].position.z = 0.55 - 0.3 * k; }
}

/** Idle → engage → shift: belt climbs the driver and drops into the driven; pulley speeds follow the ratio. */
export const cvtShift: Handler<A<'cvtShift'>> = {
  apply(_a, ctx) { setBelt(ctx.model, 2.8); },
  play(tl, a, ctx) {
    const m = ctx.model, fx = ctx.fx;
    const drv = m.has('cvtDriver') ? m.get('cvtDriver').obj : null, dvn = m.has('cvtDriven') ? m.get('cvtDriven').obj : null;
    const q1 = drv?.quaternion.clone(), q2 = dvn?.quaternion.clone();
    const lab = fx ? fx.callout(fx.transient, new Vector3(...ENGINE.driven).add(new Vector3(4, 7, -2)).applyMatrix4(m.vehicle.matrixWorld), `CVT ratio ${a.from}`, undefined, 'measure') : null;
    let a1 = 0, a2 = 0, last = 0;
    track(tl, a.t, a.dur, (s, u) => {
      const idle = 0.2;
      const k = seg(u, idle, 0.9);
      const ratio = a.from + (a.to - a.from) * easeInOut(k);
      const rpm = u < idle ? 1700 : 2000 + 1600 * easeInOut(clamp01(k * 1.5));
      if (u <= 0) { a1 = a2 = 0; }
      const ds = s - last; last = s;
      if (ds > 0 && ds < 0.5) { a1 += ds * rpm / 60 * 0.12 * Math.PI * 2; if (u >= idle) a2 += ds * rpm / ratio / 60 * 0.12 * Math.PI * 2; }
      if (drv && q1) drv.quaternion.copy(q1).multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), u >= 1 ? 0 : a1));
      if (dvn && q2) dvn.quaternion.copy(q2).multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), u >= 1 ? 0 : a2));
      setBelt(m, u <= 0 ? a.from : ratio);
      if (lab) { lab.visible = u > 0 && u < 1; setLabelText(lab, a.rpm ? `${Math.round(rpm / 100) * 100} rpm · ratio ${ratio.toFixed(1)}` : `CVT ratio ${a.from} → ${ratio.toFixed(1)}`); }
    });
  },
};

// ---------------- spin ----------------
function spinAxis(id: string) { return /wheel|hub|disc|axle|uJoint/i.test(id) ? new Vector3(1, 0, 0) : new Vector3(0, 0, 1); }
/** Rotate shafts / pulleys / wheels about their own axis (visual rpm scaled down). Temporary. */
export const spin: Handler<A<'spin'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const m = ctx.model;
    const rs = expandParts(a.parts).filter(id => m.has(id)).map(id => ({ r: m.get(id), q: m.get(id).obj.quaternion.clone(), ax: spinAxis(id) }));
    track(tl, a.t, a.dur, (s, u) => {
      const ramp = Math.min(1, s / 0.8);
      const ang = (a.rpm / 60) * 2 * Math.PI * 0.15 * s * ramp;
      for (const x of rs) x.r.obj.quaternion.copy(x.q).multiply(new Quaternion().setFromAxisAngle(x.ax, u <= 0 || u >= 1 ? 0 : ang));
    });
  },
};

// ---------------- explode / collapse ----------------
interface Target { obj: Object3D; home: Vector3; off: Vector3; part?: boolean; }
/** Children with userData.explode of a part, one child ('part:child'), or a part group (parts fly out around the frame). */
function targets(m: Model, group: string, factor: number): Target[] {
  if (group.startsWith('grp.')) {
    return expandParts([group]).filter(id => m.has(id)).map((id, i) => {
      const r = m.get(id);
      const c = r.obj.position.clone();
      const dir = new Vector3(c.x, 0, c.z - 25); if (dir.lengthSq() < 1) dir.set(i % 2 ? 1 : -1, 0, 0.3);
      dir.normalize();
      const off = dir.multiplyScalar(26 + (i % 4) * 7).add(new Vector3(0, -Math.max(0, c.y - 6) + (i % 3) * 0.5, 0));
      return { obj: r.obj, home: r.homePos.clone(), off: off.multiplyScalar(factor), part: true };
    });
  }
  const [pid, child] = group.split(':');
  const root = m.get(pid).obj;
  const kids = child ? [root.getObjectByName(child)!].filter(Boolean) : root.children.filter(c => c.userData.explode);
  return kids.map(k => ({ obj: k, home: (k.userData.home?.p as Vector3 ?? k.position).clone(), off: new Vector3(...(k.userData.explode as [number, number, number])).multiplyScalar(factor) }));
}
export const explode: Handler<A<'explode' | 'collapse'>> = {
  apply(a, ctx) {
    for (const t of targets(ctx.model, a.group, a.factor ?? 1)) t.obj.position.copy(t.home).add(a.type === 'explode' ? t.off : new Vector3());
  },
  play(tl, a, ctx) {
    const ts = targets(ctx.model, a.group, a.factor ?? 1).map(t => ({ ...t, start: t.obj.position.clone() }));
    const n = ts.length;
    track(tl, a.t, a.dur, (_s, u) => {
      ts.forEach((t, i) => {
        // stagger a little so parts move one after another
        const k = easeInOut(seg(u, (i / n) * 0.35, (i / n) * 0.35 + 0.65));
        const end = t.home.clone().add(a.type === 'explode' ? t.off : new Vector3());
        t.obj.position.lerpVectors(t.start, end, k);
      });
    });
  },
};

// ---------------- drive ----------------
const WHEELS: [string, number][] = [['wheelRearL', 13], ['wheelRearR', 13], ['wheelFrontL', 12.5], ['wheelFrontR', 12.5], ['wheelRearStockL', 11.5], ['wheelRearStockR', 11.5], ['wheelFrontStockL', 8], ['wheelFrontStockR', 8]];
/** Drive the tractor along a world path; wheels roll, the body follows the terrain, mud flies in the pit. */
export const drive: Handler<A<'drive'>> = {
  apply(a, ctx) {
    if (a.returnHome) return;
    const m = ctx.model, v = m.vehicle;
    const pose = poseOnPath(ctx, a, 1, v.quaternion.clone(), v.position.clone());
    v.position.copy(pose.pos); v.quaternion.copy(pose.quat);
  },
  play(tl, a, ctx) {
    const m = ctx.model, v = m.vehicle, fx = ctx.fx;
    const p0 = v.position.clone(), q0 = v.quaternion.clone();
    const wheels = WHEELS.filter(([id]) => m.has(id)).map(([id, r]) => ({ rec: m.get(id), r, q: m.get(id).obj.quaternion.clone() }));
    const curve = curveOf(ctx, a);
    const L = curve.getLength();
    let lastEmit = -1;
    track(tl, a.t, a.dur, (s, u) => {
      if (u <= 0 || (a.returnHome && u >= 1)) {
        v.position.copy(p0); v.quaternion.copy(q0);
        wheels.forEach(w => w.rec.obj.quaternion.copy(w.q));
        m.vehicle.updateMatrixWorld(true);
        return;
      }
      const k = progress(a, s, u);
      const pose = poseOnPath(ctx, a, k, q0, p0, curve);
      v.position.copy(pose.pos); v.quaternion.copy(pose.quat);
      const dist = L * k;
      for (const w of wheels) {
        const braked = (a.brake === 'RL' && w.rec.id === 'wheelRearL') || (a.brake === 'RR' && w.rec.id === 'wheelRearR');
        w.rec.obj.quaternion.copy(w.q).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), braked ? 0 : dist / w.r));
        if (braked) { w.rec.look.glow = 1; w.rec.look.glowColor = '#ff2020'; m.applyLook(w.rec); }
      }
      m.vehicle.updateMatrixWorld(true);
      // mud: inside the pit (world terrain below 0) throw brown particles behind the rear tires
      if (fx && ctx.live() && s - lastEmit > 0.05 && terrainHeight(pose.pos.x, pose.pos.z) < -0.6) {
        lastEmit = s;
        for (const id of ['wheelRearL', 'wheelRearR']) {
          if (!m.has(id)) continue;
          const at = m.get(id).obj.getWorldPosition(new Vector3()).setY(2);
          fx.emitBlob({ at, count: 14, dir: new Vector3(0, 1, 0).sub(pose.fwd.clone().multiplyScalar(1.2)).normalize(), spread: 0.6, speed: [40, 90], life: [0.5, 1.1], colorA: '#4a3520', gravity: 386 });
        }
        m.setMud(Math.min(1, m.world.mud + 0.02));
      }
      if (s < lastEmit) lastEmit = -1;
    });
    if (a.brake) track(tl, a.t + a.dur, 0.01, () => { for (const w of wheels) { w.rec.look.glow = 0; m.applyLook(w.rec); } });
  },
};

function curveOf(ctx: Ctx, a: A<'drive'>) {
  return new CatmullRomCurve3(ctx.model.anchorWorld(a.path), false, 'catmullrom', 0.3);
}
/** Path progress with ease-in/out and an optional slow-motion window [t0, t1, rate] in step seconds. */
function progress(a: A<'drive'>, s: number, u: number) {
  if (!a.slowmo) return easeInOut(u) * 0.3 + u * 0.7;
  const [t0, t1, rate] = a.slowmo.map((x, i) => i < 2 ? x - a.t : x) as [number, number, number];
  const warp = (x: number) => x < t0 ? x : x < t1 ? t0 + (x - t0) * rate : t0 + (t1 - t0) * rate + (x - t1);
  const k = warp(s) / warp(a.dur);
  return easeInOut(k) * 0.25 + k * 0.75;
}
function poseOnPath(ctx: Ctx, a: A<'drive'>, k: number, q0: Quaternion, p0: Vector3, curve = curveOf(ctx, a)) {
  const p = curve.getPointAt(Math.min(1, Math.max(0, k)));
  const t = curve.getTangentAt(Math.min(0.999, Math.max(0.001, k)));
  const fwd = new Vector3(t.x, 0, t.z).normalize();
  const yaw = Math.atan2(fwd.x, fwd.z);
  // stance pitch (q0 without yaw) + terrain pitch from the height 24 in ahead vs at the rear axle
  const hRear = terrainHeight(p.x, p.z), hFront = terrainHeight(p.x + fwd.x * 44, p.z + fwd.z * 44);
  const pitch = -Math.atan2(hFront - hRear, 44);
  const q0yaw = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(0, 0, 1));
  const quat = new Quaternion().setFromAxisAngle(UP, yaw).multiply(q0yaw).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch)).multiply(stancePitchOf(q0));
  return { pos: new Vector3(p.x, p0.y - terrainHeightAtStart(p0) + hRear, p.z), quat, fwd };
}
function terrainHeightAtStart(p0: Vector3) { return terrainHeight(p0.x, p0.z); }
/** Strip yaw from a quaternion, keep the stance pitch about X. */
function stancePitchOf(q: Quaternion) {
  const f = new Vector3(0, 0, 1).applyQuaternion(q);
  const pitch = Math.atan2(-f.y, Math.hypot(f.x, f.z));
  return new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch);
}
void Color;
