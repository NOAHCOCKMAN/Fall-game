import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import type { Action } from '../../steps/types';
import { anchorLocal } from '../../model/anchors';
import { expandParts } from '../../model/groups';
import { resolvePaint } from '../../model/paint';
import { clamp01, easeInOut, seg, track, type Ctx } from '../context';
import type { Handler } from './types';
import { arc, currentPlace, homePlace, setPlace, worldOf, worldPlace } from './fly';

type A<T extends Action['type']> = Extract<Action, { type: T }>;
const noop = () => { /* no end state */ };

// ---------------- paint ----------------
/** Spray-can sweeps over each part in turn; mist; color lerps to the new paint. */
export const paint: Handler<A<'paint'>> = {
  apply(a, ctx) {
    const c = new Color(resolvePaint(ctx.model, a.color));
    for (const id of expandParts(a.parts)) if (ctx.model.has(id)) { const r = ctx.model.get(id); r.paint = c.clone(); ctx.model.applyLook(r); }
  },
  play(tl, a, ctx) {
    const m = ctx.model, fx = ctx.fx;
    const c = new Color(resolvePaint(m, a.color));
    const recs = expandParts(a.parts).filter(id => m.has(id)).map(id => m.get(id));
    const starts = recs.map(r => ({ paint: r.paint?.clone() ?? null, col: (r.mats.find(x => !x.mat.userData.noPaint)?.mat.color ?? new Color('#888')).clone() }));
    const can = fx ? new Group() : null;
    if (can && fx) {
      const body = new Mesh(new BoxGeometry(1.8, 5, 1.8), new MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.4 }));
      const nozzle = new Mesh(new BoxGeometry(0.6, 0.8, 0.6), new MeshStandardMaterial({ color: '#ddd' })); nozzle.position.y = 2.9;
      can.add(body, nozzle); fx.transient.add(can);
    }
    const n = Math.max(1, recs.length);
    let last = -1;
    track(tl, a.t, a.dur, (s, u) => {
      recs.forEach((r, i) => {
        const k = seg(u, (i / n) * 0.8, (i / n) * 0.8 + 0.2 + 0.8 / n);
        r.paint = u <= 0 ? starts[i].paint?.clone() ?? null : starts[i].col.clone().lerp(c, k);
        if (u <= 0 && !starts[i].paint) r.paint = null;
        m.applyLook(r);
      });
      if (!can || !fx) return;
      can.visible = u > 0 && u < 1;
      if (!can.visible) return;
      const i = Math.min(n - 1, Math.floor(u * 0.999 * n));
      const b = m.bounds(recs[i].id);
      const ctr = b.getCenter(new Vector3());
      const sweep = Math.sin(s * 5) * (b.max.x - b.min.x) * 0.45;
      const at = new Vector3(ctr.x + sweep, b.max.y + 7, ctr.z + Math.cos(s * 3) * (b.max.z - b.min.z) * 0.3);
      can.position.copy(at); can.rotation.set(0.5, 0, 0.3);
      if (ctx.live() && s - last > 0.05) { last = s; fx.emitBlob({ at: at.clone().add(new Vector3(0, -2.5, 0)), count: 10, dir: new Vector3(0, -1, 0), spread: 0.35, speed: [10, 24], life: [0.3, 0.7], colorA: '#' + c.getHexString(), gravity: 40 }); }
      if (s < last) last = -1;
    });
  },
};

// ---------------- mud ----------------
export const mud: Handler<A<'mud'>> = {
  apply(a, ctx) { ctx.model.setMud(Math.min(1, ctx.model.world.mud + a.amount)); },
  play(tl, a, ctx) {
    const m = ctx.model, fx = ctx.fx;
    const m0 = m.world.mud;
    let last = -1;
    track(tl, a.t, a.dur, (s, u) => {
      m.setMud(u <= 0 ? m0 : Math.min(1, m0 + a.amount * u));
      if (fx && u > 0 && u < 1 && ctx.live() && s - last > 0.05) {
        last = s;
        fx.emitBlob({ at: m.anchorWorldCenter(a.at).setY(2), count: 12, dir: new Vector3(0, 1, -0.6).normalize(), spread: 0.6, speed: [30, 70], life: [0.5, 1], colorA: '#4a3520', gravity: 386 });
      }
      if (s < last) last = -1;
    });
  },
};

// ---------------- environment ----------------
export const lighting: Handler<A<'lighting'>> = {
  apply(a, ctx) { ctx.model.world.env = a.mode; ctx.model.world.envK = 1; ctx.model.world.envFrom = a.mode; },
  play(tl, a, ctx) {
    const m = ctx.model; const from = { ...m.world };
    track(tl, a.t, a.dur, (_s, u) => {
      if (u <= 0) { m.world.env = from.env; m.world.envK = from.envK; return; }
      // blend: first leave the old mode (if not normal), then enter the new one
      m.world.env = a.mode; m.world.envK = easeInOut(u);
      m.world.envFrom = from.env;
    });
  },
};

/** Headlights / light bar on or off (lens glow + spot lights). */
export const lights: Handler<A<'lights'>> = {
  apply(a, ctx) { ctx.model.world.lights = a.on ? 1 : 0; },
  play(tl, a, ctx) {
    const m = ctx.model; const k0 = m.world.lights;
    track(tl, a.t, a.dur, (_s, u) => { m.world.lights = u <= 0 ? k0 : k0 + ((a.on ? 1 : 0) - k0) * clamp01(u * 4); });
  },
};

// ---------------- running engine ----------------
export const vibrate: Handler<A<'vibrate'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const m = ctx.model, fx = ctx.fx, r = m.get(a.part);
    const p0 = r.obj.position.clone();
    let last = -1;
    track(tl, a.t, a.dur, (s, u) => {
      const on = u > 0 && u < 1;
      r.obj.position.copy(p0);
      if (!on) return;
      r.obj.position.x += Math.sin(s * 157) * 0.05; r.obj.position.y += Math.sin(s * 131) * 0.04;
      if (fx && a.puff && ctx.live() && s - last > 0.12) {
        last = s;
        fx.emitBlob({ at: m.anchorWorldCenter(a.puff), count: 5, dir: new Vector3(-0.3, 1, 0.4).normalize(), spread: 0.4, speed: [6, 14], life: [0.6, 1.2], colorA: '#8a8a8a', gravity: -20 });
      }
      if (s < last) last = -1;
    });
  },
};

// ---------------- torque stripes ----------------
function stripe(color: string) {
  const m = new MeshStandardMaterial({ color, roughness: 0.5, emissive: color, emissiveIntensity: 0.2 });
  m.userData.noPaint = true;
  const s = new Mesh(new BoxGeometry(0.12, 0.6, 0.12), m); s.castShadow = false; s.userData.noShadow = true;
  return s;
}
export const marks: Handler<A<'marks'>> = {
  apply(a, ctx) { for (const p of anchorLocal(a.at)) { const s = stripe(a.color); s.position.copy(p).add(new Vector3(0, 0.3, 0)); ctx.model.addPersist(s, ctx.model.anchorSpace(a.at)); } },
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    const pts = ctx.model.anchorWorld(a.at);
    const ss = pts.map(p => { const s = stripe(a.color); s.position.copy(p).add(new Vector3(0, 0.3, 0)); s.visible = false; fx.transient.add(s); return s; });
    track(tl, a.t, a.dur, (_s, u) => ss.forEach((s, i) => { s.visible = u > (i + 0.5) / ss.length; }));
  },
};

// ---------------- placement helpers ----------------
/** Put a part at an anchor (world), e.g. on the bench to build it. */
export const placeAt: Handler<A<'placeAt'>> = {
  apply(a, ctx) {
    const m = ctx.model, r = m.get(a.part);
    const at = m.anchorWorldCenter(a.anchor);
    const w = worldOf(homePlace(r));
    setPlace(r.obj, worldPlace(m, at, w.quat, w.scale));
    r.obj.visible = true; r.look.ghost = 0; r.look.opacity = 1; m.applyLook(r);
  },
  play(tl, a, ctx) {
    const m = ctx.model, r = m.get(a.part);
    const start = currentPlace(r.obj), vis = r.obj.visible, look = { ...r.look }, sc = r.obj.scale.clone();
    const at = m.anchorWorldCenter(a.anchor), w = worldOf(homePlace(r));
    track(tl, a.t, a.dur, (s, u) => {
      if (u <= 0) { setPlace(r.obj, start); r.obj.visible = vis; r.look = { ...look }; m.applyLook(r); return; }
      setPlace(r.obj, worldPlace(m, at, w.quat, w.scale.clone().multiplyScalar(Math.min(1, 0.2 + s / Math.min(0.5, a.dur)))));
      r.obj.visible = true; r.look = { opacity: 1, ghost: 0, glow: 0 }; m.applyLook(r);
      void sc;
    });
  },
};

/** Ghost test-fit: the part (from wherever it is) floats to its mounted spot as a ghost, holds, and floats back. */
export const fitCheck: Handler<A<'fitCheck'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const m = ctx.model, r = m.get(a.part);
    const start = currentPlace(r.obj), vis = r.obj.visible, look = { ...r.look };
    const sw = worldOf(start), hw = worldOf(homePlace(r));
    track(tl, a.t, a.dur, (_s, u) => {
      if (u <= 0 || u >= 1) { setPlace(r.obj, start); r.obj.visible = vis; r.look = { ...look }; m.applyLook(r); return; }
      const k = u < 0.3 ? easeInOut(u / 0.3) : u > 0.7 ? 1 - easeInOut((u - 0.7) / 0.3) : 1;
      setPlace(r.obj, worldPlace(m, arc(sw.pos, hw.pos, k, 20), new Quaternion().slerpQuaternions(sw.quat, hw.quat, k), sw.scale.clone().lerp(hw.scale, k)));
      r.obj.visible = true; r.look = { ...look, ghost: 1 }; m.applyLook(r);
    });
  },
};

const AX = { x: new Vector3(1, 0, 0), y: new Vector3(0, 1, 0), z: new Vector3(0, 0, 1) };
/** Swing a part back and forth about its pivot (knuckle free-swing, hood tilt, pedal press). Returns to start. */
export const oscillate: Handler<A<'oscillate'>> = {
  apply: noop,
  play(tl, a, ctx) {
    const r = ctx.model.get(a.part); const q0 = r.obj.quaternion.clone(), p0 = r.obj.position.clone();
    const P = a.about ? r.obj.parent!.worldToLocal(ctx.model.anchorWorldCenter(a.about)) : null;
    track(tl, a.t, a.dur, (_s, u) => {
      const ang = u <= 0 || u >= 1 ? 0 : a.cycles <= 0.5 ? (a.deg * Math.PI / 180) * Math.sin(Math.PI * u)
        : (a.deg * Math.PI / 180) * Math.sin(2 * Math.PI * a.cycles * u) * Math.min(1, Math.sin(Math.PI * u) * 4);
      const qr = new Quaternion().setFromAxisAngle(AX[a.axis], ang);
      if (!P) { r.obj.quaternion.copy(q0).multiply(qr); return; }
      r.obj.quaternion.copy(qr).multiply(q0);
      r.obj.position.copy(p0).sub(P).applyQuaternion(qr).add(P);
    });
  },
};

// ---------------- UI overlays ----------------
export const paintPresets: Handler<A<'paintPresets'>> = {
  apply: noop,
  play(tl, a, ctx) { const fx = ctx.fx; if (!fx) return; track(tl, a.t, a.dur, (_s, u) => fx.showPresets(u > 0)); },
};
export const title: Handler<A<'title'>> = {
  apply: noop,
  play(tl, a, ctx) { const fx = ctx.fx; if (!fx) return; track(tl, a.t, a.dur, (_s, u) => fx.showTitle(u > 0 ? a.text : null, !!a.replay)); },
};
export type { Ctx };
