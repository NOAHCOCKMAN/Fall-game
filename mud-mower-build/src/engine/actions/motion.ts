import { Color, Quaternion, Vector3 } from 'three';
import type { Action } from '../../steps/types';
import { DONOR_IDS, PALETTES } from '../../scene/materials';
import { LINEUP_Z, lineupX } from '../../model/builders/lineup';
import { clamp01, easeInOut, seg, track } from '../context';
import type { Handler } from './types';

type A<T extends Action['type']> = Extract<Action, { type: T }>;

/** Translate a part by `by` (parent space) or to an anchor (world). */
export const move: Handler<A<'move'>> = {
  apply(a, ctx) {
    const r = ctx.model.get(a.part);
    r.obj.position.copy(endPos(a, ctx.model, r.obj));
    r.obj.updateMatrixWorld(true);
  },
  play(tl, a, ctx) {
    const r = ctx.model.get(a.part);
    const from = r.obj.position.clone(), to = endPos(a, ctx.model, r.obj);
    track(tl, a.t, a.dur, (_s, u) => { r.obj.position.lerpVectors(from, to, easeInOut(u)); });
  },
};
function endPos(a: A<'move'>, m: import('../../model/registry').Model, o: import('three').Object3D) {
  if (a.to) { const w = m.anchorWorldCenter(a.to); o.parent!.updateWorldMatrix(true, false); return o.parent!.worldToLocal(w); }
  return o.position.clone().add(new Vector3(...(a.by ?? [0, 0, 0])));
}

const AX = { x: new Vector3(1, 0, 0), y: new Vector3(0, 1, 0), z: new Vector3(0, 0, 1) };
/** Rotate a part about its own pivot (local axis). */
/** Rotate a part about its own pivot (local axis), or with `about` (an anchor) about that point (parent-space axis). */
function rotTo(a: A<'rotate'>, m: import('../../model/registry').Model, o: import('three').Object3D, q0: Quaternion, p0: Vector3, k: number) {
  const qr = new Quaternion().setFromAxisAngle(AX[a.axis], (a.deg * Math.PI / 180) * k);
  if (!a.about) { o.quaternion.copy(q0).multiply(qr); return; }
  const P = o.parent!.worldToLocal(m.anchorWorldCenter(a.about));
  o.quaternion.copy(qr).multiply(q0);
  o.position.copy(p0).sub(P).applyQuaternion(qr).add(P);
}
export const rotate: Handler<A<'rotate'>> = {
  apply(a, ctx) {
    const r = ctx.model.get(a.part);
    rotTo(a, ctx.model, r.obj, r.obj.quaternion.clone(), r.obj.position.clone(), 1);
  },
  play(tl, a, ctx) {
    const r = ctx.model.get(a.part);
    const q0 = r.obj.quaternion.clone(), p0 = r.obj.position.clone();
    track(tl, a.t, a.dur, (_s, u) => rotTo(a, ctx.model, r.obj, q0, p0, easeInOut(u)));
  },
};

/** Body X-ray during the action window (step-scoped, no end state). */
export const xray: Handler<A<'xray'>> = {
  apply() { /* step-scoped */ },
  play(tl, a, ctx) { track(tl, a.t, a.dur, (_s, u) => ctx.model.setForceXray(u > 0 && u < 1)); },
};

/** Moving blanket on (color) / off (null). */
export const wrap: Handler<A<'wrap'>> = {
  apply(a, ctx) { const r = ctx.model.get(a.part); r.wrap = a.color ? new Color(a.color) : null; ctx.model.applyLook(r); },
  play(tl, a, ctx) {
    const m = ctx.model, r = m.get(a.part);
    const start = r.wrap?.clone() ?? null;
    track(tl, a.t, a.dur, (_s, u) => {
      if (u <= 0) r.wrap = start?.clone() ?? null;
      else if (a.color) { r.wrap = (start ?? new Color(r.mats[0]?.mat.color ?? '#777')).clone().lerp(new Color(a.color), clamp01(u * 1.5)); }
      else r.wrap = u >= 1 ? null : start;
      m.applyLook(r);
    });
  },
};

// ---------------- 0.1 donor lineup ----------------
const STOCK_WHEELS: [string, number][] = [['wheelRearStockL', 11.5], ['wheelRearStockR', 11.5], ['wheelFrontStockL', 8], ['wheelFrontStockR', 8]];
const START = 9, ROLL_END = 13;

/** Six donors turn on turntables; the active donor (picker) highlights, then the real tractor rolls to the work area. */
export const donorLineup: Handler<A<'donorLineup'>> = {
  apply(_a, ctx) {
    const m = ctx.model;
    for (const d of DONOR_IDS) m.get(`donorShow.${d}`).obj.visible = false;
    const v = m.get('vehicle');
    v.obj.visible = true; v.obj.position.set(0, 0, 0);
    const i = DONOR_IDS.indexOf(m.donor);
    const dist = Math.hypot(lineupX(i), LINEUP_Z);
    for (const [id, rad] of STOCK_WHEELS) if (m.has(id)) m.get(id).obj.rotation.x = dist / rad;
  },
  play(tl, a, ctx) {
    const m = ctx.model;
    const active = DONOR_IDS.indexOf(m.donor);
    const v = m.get('vehicle');
    const startX = lineupX(active);
    const shows = DONOR_IDS.map(d => m.get(`donorShow.${d}`));
    const spins = shows.map(r => r.obj.getObjectByName('spin')!);
    const labels = ctx.fx ? shows.map((r, i) => ctx.fx!.callout(ctx.fx!.transient, new Vector3(lineupX(i), 34, LINEUP_Z), (PALETTE_NAMES[i]), undefined, 'tag')) : [];
    const dist = Math.hypot(startX, LINEUP_Z);
    const wheels = STOCK_WHEELS.filter(([id]) => m.has(id)).map(([id, rad]) => ({ r: m.get(id), rad, x0: m.get(id).obj.rotation.x }));
    const vis0 = v.obj.visible;
    track(tl, a.t, a.dur, (s, u) => {
      void vis0; // the step's first frame (u = 0) already shows the lineup
      const fadeOthers = seg(s, 6, START);        // 6–9 others fade to 20%
      const gone = seg(s, START, ROLL_END);       // 9–13 others fade out
      shows.forEach((r, i) => {
        // one full turn per 9 s: every turntable faces forward again at t = 9
        spins[i].rotation.y = (Math.min(s, START) / START) * Math.PI * 2;
        const isActive = i === active;
        r.obj.visible = isActive ? s < START : gone < 1;
        r.look.opacity = isActive ? 1 : (1 - 0.8 * fadeOthers) * (1 - gone);
        r.look.glow = isActive && s >= 6 && s < START ? 0.5 + 0.5 * Math.sin((s - 6) * 6) : 0;
        m.applyLook(r);
        if (labels[i]) labels[i].visible = isActive ? s < ROLL_END : gone < 0.6;
      });
      // the real tractor takes over from the active turntable at t = 9 and rolls forward to the origin
      v.obj.visible = s >= START;
      const roll = easeInOut(gone);
      v.obj.position.set(startX * (1 - roll), 0, LINEUP_Z * (1 - roll));
      for (const w of wheels) w.r.obj.rotation.x = w.x0 + (dist * roll) / w.rad;
    });
  },
};
const PALETTE_NAMES = DONOR_IDS.map(d => PALETTES[d].name);
