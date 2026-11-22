import { gsap } from 'gsap';
import { Quaternion, Vector3 } from 'three';
import { SCRAP_BIN } from '../../model/registry';
import type { Action } from '../../steps/types';
import { clamp01, easeInOut, seg, track, type Ctx } from '../context';
import type { Handler } from './types';
import { arc, currentPlace, homePlace, setPlace, shelfPlace, worldOf, worldPlace, type Place } from './fly';

type RemoveA = Extract<Action, { type: 'remove' }>;
type InstallA = Extract<Action, { type: 'install' }>;
type StateA = Extract<Action, { type: 'highlight' | 'ghost' | 'show' | 'hide' }>;

/** Where a removed part ends up. Also advances the shelf allocator (call once per action). */
function removeTarget(ctx: Ctx, a: RemoveA): { place: Place; hidden: boolean } {
  const m = ctx.model, r = m.get(a.part);
  const to = a.to ?? 'shelf';
  if (to === 'shelf') return { place: shelfPlace(m, r), hidden: false };
  const w = worldOf(currentPlace(r.obj));
  if (to === 'scrap') return { place: worldPlace(m, SCRAP_BIN.clone().setY(6), w.quat, w.scale.multiplyScalar(0.6)), hidden: true };
  // TODO(Noah): `to: <anchor>` destinations land in M2 with the real anchor set.
  return { place: shelfPlace(m, r), hidden: false };
}

export const remove: Handler<RemoveA> = {
  apply(a, ctx) {
    const r = ctx.model.get(a.part);
    const t = removeTarget(ctx, a);
    setPlace(r.obj, t.place);
    r.obj.visible = !t.hidden;
    r.look.glow = 0; r.look.opacity = 1;
    ctx.model.applyLook(r);
  },
  play(tl, a, ctx) {
    const m = ctx.model, r = m.get(a.part);
    const start = currentPlace(r.obj), startVis = r.obj.visible, startLook = { ...r.look };
    const sw = worldOf(start);
    const tgt = removeTarget(ctx, a);
    const ew = worldOf(tgt.place);
    const via = a.via ?? 'lift';
    const toScrap = tgt.hidden;
    track(tl, a.t, a.dur, (_s, u) => {
      if (u <= 0) { setPlace(r.obj, start); r.obj.visible = startVis; r.look = { ...startLook }; m.applyLook(r); return; }
      // first 15%: rise/slide clear of the vehicle; rest: arc to destination
      const k1 = seg(u, 0, 0.15), k2 = easeInOut(seg(u, 0.15, toScrap ? 0.8 : 1));
      const off = via === 'slide' ? new Vector3(sw.pos.x < 0 ? -12 : 12, 0, 0) : via === 'drop' ? new Vector3(0, -2, 0) : new Vector3(0, 6, 0);
      const p0 = sw.pos.clone().addScaledVector(off, easeInOut(k1));
      const lifted = sw.pos.clone().add(off);
      let pos = k2 > 0 ? arc(lifted, ew.pos.clone().add(new Vector3(0, toScrap ? 18 : 0, 0)), k2, 24) : p0;
      if (toScrap) pos = pos.clone().setY(pos.y - 18 * easeInOut(seg(u, 0.8, 1)));
      const q = new Quaternion().slerpQuaternions(sw.quat, ew.quat, k2);
      const s = sw.scale.clone().lerp(ew.scale, k2);
      setPlace(r.obj, worldPlace(m, pos, q, s));
      r.obj.visible = !(toScrap && u >= 1);
      r.look.glow = startLook.glow * (1 - k1);
      r.look.opacity = toScrap ? 1 - seg(u, 0.82, 1) : 1;
      m.applyLook(r);
    });
  },
};

function installStart(ctx: Ctx, a: InstallA, home: { pos: Vector3; quat: Quaternion; scale: Vector3 }) {
  const r = ctx.model.get(a.part);
  const from = a.from ?? 'above';
  if (from === 'shelf') return worldOf(currentPlace(r.obj));
  const off = Array.isArray(from) ? new Vector3(...from).sub(home.pos)
    : from === 'side' ? new Vector3(home.pos.x < 0 ? -30 : 30, 4, 0)
    : from === 'below' ? new Vector3(0, -Math.min(20, home.pos.y), 0)
    : new Vector3(0, 30, 0);
  return { pos: home.pos.clone().add(off), quat: home.quat.clone(), scale: home.scale.clone() };
}

export const install: Handler<InstallA> = {
  apply(a, ctx) {
    const r = ctx.model.get(a.part);
    setPlace(r.obj, homePlace(r));
    r.obj.visible = true; r.look = { opacity: 1, ghost: 0, glow: 0 };
    ctx.model.applyLook(r);
  },
  play(tl, a, ctx) {
    const m = ctx.model, r = m.get(a.part);
    const start = currentPlace(r.obj), startVis = r.obj.visible, startLook = { ...r.look };
    const home = homePlace(r), hw = worldOf(home);
    const sw = installStart(ctx, a, hw);
    const g = a.ghostFirst ? Math.min(0.8, a.dur * 0.3) : 0;
    track(tl, a.t, a.dur, (s) => {
      if (s <= 0) { setPlace(r.obj, start); r.obj.visible = startVis; r.look = { ...startLook }; m.applyLook(r); return; }
      r.obj.visible = true;
      if (s < g) { // ghost preview in place
        setPlace(r.obj, home); r.look = { opacity: 1, ghost: 1, glow: 0 }; m.applyLook(r); return;
      }
      const u = easeInOut((s - g) / Math.max(0.001, a.dur - g));
      if (u >= 1) { setPlace(r.obj, home); r.look = { opacity: 1, ghost: 0, glow: 0 }; m.applyLook(r); return; }
      const pos = a.from === 'shelf' ? arc(sw.pos, hw.pos, u, 24) : sw.pos.clone().lerp(hw.pos, u);
      setPlace(r.obj, worldPlace(m, pos, new Quaternion().slerpQuaternions(sw.quat, hw.quat, u), sw.scale.clone().lerp(hw.scale, u)));
      r.look = { opacity: 1, ghost: 0, glow: 0 }; m.applyLook(r);
    });
  },
};

export const stateAction: Handler<StateA> = {
  apply(a, ctx) {
    const r = ctx.model.get(a.part);
    if (a.type === 'show') { r.obj.visible = true; r.look.ghost = 0; }
    if (a.type === 'hide') r.obj.visible = false;
    if (a.type === 'ghost') { r.obj.visible = true; r.look.ghost = 1; }
    ctx.model.applyLook(r);
  },
  play(tl, a, ctx) {
    const m = ctx.model, r = m.get(a.part);
    const vis = r.obj.visible, look = { ...r.look };
    track(tl, a.t, a.dur, (s, u) => {
      if (u <= 0) { r.obj.visible = vis; r.look = { ...look }; m.applyLook(r); return; }
      if (a.type === 'highlight') {
        // emissive pulse, ~1.4 Hz, back to normal at the end
        r.look.glow = u >= 1 ? look.glow : 0.5 + 0.5 * Math.sin(s * Math.PI * 2.8 - Math.PI / 2);
      } else if (a.type === 'show') { r.obj.visible = true; r.look.ghost = look.ghost * (1 - clamp01(u * 3)); r.look.opacity = clamp01(u * 3); }
      else if (a.type === 'hide') { r.look.opacity = 1 - clamp01(u * 3); r.obj.visible = u < 1 / 3; if (u >= 1 / 3) r.look.opacity = 1; }
      else if (a.type === 'ghost') { r.obj.visible = true; r.look.ghost = clamp01(u * 3); }
      m.applyLook(r);
    });
  },
};

void gsap;
