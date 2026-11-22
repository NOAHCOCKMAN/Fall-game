import {
  CatmullRomCurve3, CircleGeometry, Color, CylinderGeometry, Group, LineCurve3, Mesh, MeshStandardMaterial, Quaternion,
  TubeGeometry, Vector3, type Curve,
} from 'three';
import type { Action } from '../../steps/types';
import { anchorDef, anchorLocal, centerOf } from '../../model/anchors';
import { makeDimension, makeGauge, makeLaser } from '../../fx/measure';
import { clamp01, easeInOut, seg, track, type Ctx } from '../context';
import type { Handler } from './types';

type A<T extends Action['type']> = Extract<Action, { type: T }>;
const UP = new Vector3(0, 1, 0);
const noop = () => { /* effect only: no end state */ };

/** Visible window for an effect: [t, t+dur], or to the step's end when `keep`. */
function windowOf(a: { t: number; dur: number }, ctx: Ctx, keep?: boolean) { return keep ? ctx.step.durationSec - a.t : a.dur; }

// ---------------- measure ----------------
export const measure: Handler<A<'measure'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    const m = ctx.model;
    const [p, q] = a.b ? [m.anchorWorldCenter(a.a), m.anchorWorldCenter(a.b)] : m.anchorWorld(a.a);
    const d = makeDimension(p, q);
    fx.transient.add(d.obj);
    const lab = fx.callout(fx.transient, d.mid.clone().add(new Vector3(0, 1.2, 0)), a.label, undefined, 'measure');
    const win = windowOf(a, ctx, a.keep);
    track(tl, a.t, win, (s, u) => {
      const live = u > 0 && (a.keep || u < 1);
      d.set(live ? easeInOut(clamp01(s / Math.min(1, a.dur * 0.4))) : 0);
      lab.visible = live && s > Math.min(1, a.dur * 0.4);
    });
  },
};

// ---------------- laser ----------------
export const laser: Handler<A<'laser'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    const pa = ctx.model.anchorWorld(a.a), pb = a.b ? ctx.model.anchorWorldCenter(a.b) : pa[pa.length - 1];
    const l = makeLaser(pa[0], a.b ? pb : pa[pa.length - 1]);
    fx.transient.add(l.obj);
    track(tl, a.t, a.dur, (s, u) => l.set(u > 0 && u < 1 ? easeInOut(clamp01(s / Math.min(0.8, a.dur * 0.3))) : 0));
  },
};

// ---------------- angle gauge ----------------
export const angleGauge: Handler<A<'angleGauge'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    const at = ctx.model.anchorWorld(a.anchor)[0];
    const g = makeGauge(at, a.deg);
    fx.transient.add(g.obj);
    const lab = fx.callout(fx.transient, at.clone().add(new Vector3(0, 5.5, 0)), a.label, undefined, 'measure');
    track(tl, a.t, a.dur, (s, u) => {
      const on = u > 0 && u < 1;
      g.set(on ? easeInOut(clamp01(s / Math.min(1.2, a.dur * 0.5))) : 0);
      lab.visible = on && s > 0.4;
    });
  },
};

// ---------------- drill ----------------
function holeDecal(dia: number) {
  const m = new MeshStandardMaterial({ color: '#0c0c0c', roughness: 0.9, metalness: 0.2, polygonOffset: true, polygonOffsetFactor: -2 });
  m.userData.noPaint = true;
  const d = new Mesh(new CircleGeometry(dia / 2, 16), m);
  d.userData.noShadow = true; d.castShadow = false;
  return d;
}
function orientDecal(d: Mesh, at: Vector3, n: Vector3) {
  d.position.copy(at).addScaledVector(n, 0.03);
  d.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), n);
}

export const drill: Handler<A<'drill'>> = {
  apply(a, ctx) {
    const sp = ctx.model.anchorSpace(a.anchor);
    const n = new Vector3(...(anchorDef(a.anchor).normal ?? [0, 1, 0])).normalize();
    for (const p of anchorLocal(a.anchor)) { const d = holeDecal(a.dia); orientDecal(d, p, n); ctx.model.addPersist(d, sp); }
  },
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    const pts = ctx.model.anchorWorld(a.anchor), n = ctx.model.anchorNormal(a.anchor);
    const bitMat = new MeshStandardMaterial({ color: '#d7b26a', metalness: 0.8, roughness: 0.3 });
    const bit = new Mesh(new CylinderGeometry(Math.max(0.06, a.dia / 2), Math.max(0.06, a.dia / 2), 5, 10), bitMat);
    const chuck = new Mesh(new CylinderGeometry(0.9, 0.9, 2.4, 14), new MeshStandardMaterial({ color: '#222', metalness: 0.6, roughness: 0.4 }));
    chuck.position.y = 3.6;
    const tool = new Group(); tool.add(bit, chuck);
    tool.quaternion.setFromUnitVectors(UP, n);
    fx.transient.add(tool);
    const holes = pts.map(p => { const d = holeDecal(a.dia); orientDecal(d, p, n); d.visible = false; fx.transient.add(d); return d; });
    const per = a.dur / pts.length;
    let lastEmit = -1;
    track(tl, a.t, a.dur, (s, u) => {
      tool.visible = u > 0 && u < 1;
      const i = Math.min(pts.length - 1, Math.floor(s / per));
      holes.forEach((h, k) => { h.visible = u > 0 && (k < i || (k === i && s - i * per > per * 0.6) || u >= 1); });
      if (!tool.visible) return;
      const k = (s - i * per) / per;                       // approach 0–0.3, cut 0.3–0.6, retract 0.6–1
      const depth = k < 0.3 ? 4 - (k / 0.3) * 2.5 : k < 0.6 ? 1.5 - ((k - 0.3) / 0.3) * 2 : -0.5 + ((k - 0.6) / 0.4) * 4.5;
      tool.position.copy(pts[i]).addScaledVector(n, depth + 2.5);
      bit.rotation.y = s * 60;
      if (ctx.live() && k > 0.3 && k < 0.6 && s - lastEmit > 0.05) {
        lastEmit = s;
        fx.emitBlob({ at: pts[i].clone().addScaledVector(n, 0.2), count: 4, dir: n, spread: 1.5, speed: [8, 20], life: [0.4, 0.9], colorA: '#b9bcbf', gravity: 386 });
      }
      if (s < lastEmit) lastEmit = -1;
    });
  },
};

// ---------------- bolts ----------------
function boltMesh() {
  const g = new Group();
  const zinc = new MeshStandardMaterial({ color: '#cfd2c8', metalness: 0.85, roughness: 0.3 });
  const head = new Mesh(new CylinderGeometry(0.42, 0.42, 0.3, 6), zinc); head.position.y = 0.15;
  const shank = new Mesh(new CylinderGeometry(0.22, 0.22, 1.6, 8), zinc); shank.position.y = -0.8;
  g.add(head, shank);
  return g;
}
const TRAY = new Vector3(114, 34.9, -5);

export const bolt: Handler<A<'bolt'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    const m = ctx.model;
    type B = { at: Vector3; n: Vector3; obj: Group; tray: Vector3 };
    const bolts: B[] = [];
    let k = 0;
    for (const f of a.fasteners) {
      const n = m.anchorNormal(f);
      for (const p of m.anchorWorld(f)) {
        const obj = boltMesh(); obj.visible = false; fx.transient.add(obj);
        const tray = TRAY.clone().add(new Vector3(((k % 5) - 2) * 0.7, 0, Math.floor(k / 5) * 0.7 - 0.7));
        bolts.push({ at: p, n, obj, tray }); k++;
      }
    }
    const sock = new Mesh(new CylinderGeometry(0.6, 0.6, 2.2, 12), new MeshStandardMaterial({ color: '#9ea3a8', metalness: 0.9, roughness: 0.25 }));
    sock.visible = false; fx.transient.add(sock);
    const lab = a.dir === 'in' && bolts.length
      ? fx.callout(fx.transient, centerOf(bolts.map(b => b.at)), 'click', a.torqueLabel ?? 'Torque to chart') : null;
    const per = a.dur / Math.max(1, bolts.length);
    const turns = 4, travel = 1.4;
    track(tl, a.t, a.dur, (s, u) => {
      sock.visible = false;
      bolts.forEach((b, i) => {
        const k0 = (s - i * per) / per;                           // this bolt's local progress
        const q = new Quaternion().setFromUnitVectors(UP, b.n);
        if (a.dir === 'out') {
          if (u <= 0 || k0 < 0) { b.obj.visible = u > 0; b.obj.position.copy(b.at); b.obj.quaternion.copy(q); return; }
          b.obj.visible = true;
          const spin = clamp01(k0 / 0.6);
          if (k0 < 0.6) {
            b.obj.position.copy(b.at).addScaledVector(b.n, travel * spin);
            b.obj.quaternion.copy(q).multiply(new Quaternion().setFromAxisAngle(UP, spin * turns * Math.PI * 2));
            sock.visible = true; sock.position.copy(b.obj.position).addScaledVector(b.n, 1.3); sock.quaternion.copy(q);
          } else {
            const f = easeInOut(clamp01((k0 - 0.6) / 0.4 * 1.0) * (i === bolts.length - 1 ? 1 : 1));
            const from = b.at.clone().addScaledVector(b.n, travel);
            const mid = from.clone().lerp(b.tray, 0.5); mid.y = Math.max(from.y, b.tray.y) + 14;
            const t1 = 1 - f;
            b.obj.position.set(
              t1 * t1 * from.x + 2 * t1 * f * mid.x + f * f * b.tray.x,
              t1 * t1 * from.y + 2 * t1 * f * mid.y + f * f * b.tray.y,
              t1 * t1 * from.z + 2 * t1 * f * mid.z + f * f * b.tray.z);
            b.obj.quaternion.slerpQuaternions(q, new Quaternion(), f);
            if (k0 > 1) b.obj.position.copy(b.tray);
          }
        } else {
          if (u <= 0) { b.obj.visible = false; return; }
          b.obj.visible = true;
          if (k0 < 0) { b.obj.position.copy(b.at).addScaledVector(b.n, travel); b.obj.quaternion.copy(q); b.obj.visible = false; return; }
          const spin = clamp01(k0 / 0.8);
          b.obj.position.copy(b.at).addScaledVector(b.n, travel * (1 - spin));
          b.obj.quaternion.copy(q).multiply(new Quaternion().setFromAxisAngle(UP, -spin * turns * Math.PI * 2));
          if (k0 < 0.85) { sock.visible = true; sock.position.copy(b.obj.position).addScaledVector(b.n, 1.3); sock.quaternion.copy(q); }
        }
      });
      if (a.dir === 'out' && u >= 1) bolts.forEach(b => { b.obj.visible = true; b.obj.position.copy(b.tray); });
      if (lab) lab.visible = u > 0.85 && u < 1;
    });
  },
};

// ---------------- grind / wire wheel ----------------
const CLEAN = new Color('#a7abae');
export const surface: Handler<A<'grind' | 'wireWheel'>> = {
  apply(a, ctx) { const r = ctx.model.get(a.target); r.paint = CLEAN.clone(); ctx.model.applyLook(r); },
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    const m = ctx.model, r = m.get(a.target);
    const b = m.bounds(a.target);
    const startPaint = r.paint?.clone() ?? null;
    const before = r.mats[0]?.mat.color.clone() ?? new Color('#777');
    const long = (b.max.z - b.min.z) >= (b.max.x - b.min.x) ? 'z' : 'x';
    const sideX = (b.min.x + b.max.x) / 2 < 0 ? b.min.x - 0.6 : b.max.x + 0.6;
    const disc = new Mesh(new CylinderGeometry(2.25, 2.25, 0.5, 20), new MeshStandardMaterial({ color: a.type === 'wireWheel' ? '#8c7b5c' : '#6f6a5d', metalness: 0.4, roughness: 0.7 }));
    const body = new Mesh(new CylinderGeometry(1.2, 1.2, 8, 12), new MeshStandardMaterial({ color: '#2f6fb0', roughness: 0.5 }));
    body.position.y = 4.4;
    const tool = new Group(); tool.add(disc, body);
    fx.transient.add(tool);
    const pass = a.dur * 0.9;
    let lastEmit = -1;
    track(tl, a.t, a.dur, (s, u) => {
      if (u <= 0) { tool.visible = false; r.paint = startPaint?.clone() ?? null; m.applyLook(r); return; }
      const k = clamp01(s / pass);
      // sweep end to end with a small weave
      const along = long === 'z' ? b.min.z + (b.max.z - b.min.z) * k : b.min.x + (b.max.x - b.min.x) * k;
      const weave = Math.sin(s * 9) * (b.max.y - b.min.y) * 0.3;
      const at = long === 'z'
        ? new Vector3(sideX, (b.min.y + b.max.y) / 2 + weave, along)
        : new Vector3(along, b.max.y + 0.4, (b.min.z + b.max.z) / 2 + weave);
      tool.visible = u < 1 && k < 1;
      tool.position.copy(at);
      tool.quaternion.setFromUnitVectors(UP, long === 'z' ? new Vector3(Math.sign(sideX), 0, 0) : UP);
      disc.rotation.y = s * 80;
      r.paint = before.clone().lerp(CLEAN, k);
      m.applyLook(r);
      if (tool.visible && ctx.live() && s - lastEmit > 0.03) {
        lastEmit = s;
        const away = new Vector3(Math.sign(sideX) * 0.4, 0.3, -1).normalize();
        if (a.type === 'grind') fx.emit({ at, count: 10, dir: away, spread: 0.5, speed: [40, 90], life: [0.25, 0.6], colorA: '#fff3c0', colorB: '#ff6a00' });
        else { fx.emitBlob({ at, count: 6, dir: away, spread: 1, speed: [10, 30], life: [0.4, 1.0], colorA: '#7a5a40', gravity: 120 }); fx.emit({ at, count: 2, dir: away, spread: 0.6, speed: [30, 60], life: [0.15, 0.3] }); }
      }
      if (s < lastEmit) lastEmit = -1;
    });
  },
};

// ---------------- fluid drain / fill ----------------
export const fluid: Handler<A<'fluid'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    const m = ctx.model;
    const b = m.bounds(a.part);
    const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
    const drain = a.mode === 'drain';
    // drain: from the part's low side edge into a pan on the floor; fill: from a jug above into the top
    const src = drain ? new Vector3(cx + (b.max.x - cx) * 0.4, b.min.y + 0.2, cz + 1) : new Vector3(cx, b.max.y + 9, cz);
    const dst = drain ? new Vector3(src.x, 0.4, src.z) : new Vector3(cx, b.max.y, cz);
    const color = new Color(a.color);
    const liquid = new MeshStandardMaterial({ color, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 });
    liquid.userData.noPaint = true;
    const len = src.y - dst.y;
    const stream = new Mesh(new CylinderGeometry(0.22, 0.3, 1, 8), liquid);
    const pan = new Group();
    const panMat = new MeshStandardMaterial({ color: '#2d2d2d', roughness: 0.6, metalness: 0.5 });
    const rimM = new Mesh(new CylinderGeometry(6, 5.4, 2, 24, 1, true), panMat); rimM.position.y = 1; panMat.side = 2;
    const pool = new Mesh(new CylinderGeometry(5.6, 5.6, 0.1, 24), liquid);
    pan.add(rimM, pool); pan.position.copy(dst).setY(0);
    const jug = new Mesh(new CylinderGeometry(1.8, 2.2, 6, 14), new MeshStandardMaterial({ color: '#d9d3c0', roughness: 0.6 }));
    jug.position.copy(src).add(new Vector3(0, 3.5, 0)); jug.rotation.z = 0.9;
    fx.transient.add(stream, drain ? pan : jug);
    let lastEmit = -1;
    track(tl, a.t, a.dur, (s, u) => {
      const on = u > 0 && u < 1;
      pan.visible = jug.visible = on;
      const pour = on && s > 0.4 && s < a.dur - 0.5;
      stream.visible = pour;
      stream.scale.set(1, Math.max(0.01, len * clamp01((s - 0.4) / 0.4)), 1);
      stream.position.copy(src).add(new Vector3(0, -stream.scale.y / 2, 0));
      pool.position.y = 0.2 + 1.2 * seg(s, 0.4, a.dur);
      pool.visible = drain && s > 0.6;
      if (pour && ctx.live() && s - lastEmit > 0.04) {
        lastEmit = s;
        fx.emitBlob({ at: drain ? dst.clone().setY(1.2) : dst, count: 3, dir: UP, spread: 1.4, speed: [4, 10], life: [0.2, 0.4], colorA: a.color, gravity: 200 });
      }
      if (s < lastEmit) lastEmit = -1;
    });
  },
};

// ---------------- mist (penetrating oil / spray puffs) ----------------
export const mist: Handler<A<'mist'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    const pts = ctx.model.anchorWorld(a.at);
    const can = new Group();
    const body = new Mesh(new CylinderGeometry(0.9, 0.9, 5, 12), new MeshStandardMaterial({ color: '#2b5fb8', roughness: 0.4, metalness: 0.5 }));
    const cap = new Mesh(new CylinderGeometry(0.5, 0.7, 1, 10), new MeshStandardMaterial({ color: '#ddd', roughness: 0.4 }));
    cap.position.y = 3; can.add(body, cap);
    fx.transient.add(can);
    const lab = a.label ? fx.callout(fx.transient, centerOf(pts), a.label) : null;
    const per = a.dur / pts.length;
    let last = -1;
    track(tl, a.t, a.dur, (s, u) => {
      const on = u > 0 && u < 1;
      can.visible = on; if (lab) lab.visible = on;
      if (!on) return;
      const i = Math.min(pts.length - 1, Math.floor(s / per));
      can.position.copy(pts[i]).add(new Vector3(3, 4, 3));
      can.rotation.set(0.5, 0, -0.5);
      if (ctx.live() && i !== last) {
        last = i;
        fx.emitBlob({ at: pts[i].clone().add(new Vector3(1.6, 2, 1.6)), count: 40, dir: new Vector3(-0.6, -0.5, -0.6), spread: 0.35, speed: [6, 16], life: [0.4, 0.9], colorA: '#d8d3a8', gravity: 20 });
      }
      if (s < 0.01) last = -1;
    });
  },
};

// ---------------- trace: a line that draws itself along a path ----------------
function traceMesh(pts: Vector3[], color: string, radius: number) {
  const curve: Curve<Vector3> = pts.length === 2 ? new LineCurve3(pts[0], pts[1]) : new CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
  const mat = new MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1, emissive: color, emissiveIntensity: 0.25 });
  mat.userData.noPaint = true;
  const mesh = new Mesh(new TubeGeometry(curve, Math.max(24, pts.length * 20), radius, 6, false), mat);
  mesh.castShadow = false; mesh.userData.noShadow = true;
  return mesh;
}
export const trace: Handler<A<'trace'>> = {
  apply(a, ctx) {
    if (!a.keep) return;
    ctx.model.addPersist(traceMesh(anchorLocal(a.path), a.color ?? '#ffffff', a.radius ?? 0.12), ctx.model.anchorSpace(a.path));
  },
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    const mesh = traceMesh(ctx.model.anchorWorld(a.path), a.color ?? '#ffffff', a.radius ?? 0.12);
    fx.transient.add(mesh);
    const g = mesh.geometry; const total = g.index!.count;
    track(tl, a.t, a.dur, (_s, u) => {
      mesh.visible = u > 0 && (a.keep || u < 1);
      g.setDrawRange(0, Math.floor((total / 6) * clamp01(u / 0.85)) * 6);
    });
  },
};
