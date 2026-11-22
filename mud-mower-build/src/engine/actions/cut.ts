import { CylinderGeometry, Group, LineCurve3, Mesh, MeshStandardMaterial, TubeGeometry, Vector3 } from 'three';
import type { Action } from '../../steps/types';
import { clamp01, seg, track } from '../context';
import type { Handler } from './types';
import { remove } from './parts';

type A<T extends Action['type']> = Extract<Action, { type: T }>;
const UP = new Vector3(0, 1, 0);

/** Angle grinder: body + guard + disc. The disc's axis is the tool's local Y. */
function grinderTool(discColor: string, discThick: number) {
  const g = new Group();
  const disc = new Mesh(new CylinderGeometry(2.25, 2.25, discThick, 24), new MeshStandardMaterial({ color: discColor, metalness: 0.3, roughness: 0.7 }));
  const guard = new Mesh(new CylinderGeometry(2.45, 2.45, 0.5, 20, 1, true, 0, Math.PI), new MeshStandardMaterial({ color: '#3a3a3a', metalness: 0.6, roughness: 0.4, side: 2 }));
  guard.position.y = 0.4;
  const body = new Mesh(new CylinderGeometry(1.15, 1.25, 8, 12), new MeshStandardMaterial({ color: '#2f6fb0', roughness: 0.5 }));
  body.rotation.z = Math.PI / 2; body.position.set(-4.5, 1.2, 0);
  g.add(disc, guard, body);
  return { g, disc };
}

/** Cut-off disc travels along a cut line; sparks; glowing kerf; the cut-off piece drops and goes to scrap. */
export const grindCut: Handler<A<'grindCut'>> = {
  apply(a, ctx) {
    if (a.dropPart) remove.apply({ t: 0, dur: 0, type: 'remove', part: a.dropPart, via: 'drop', to: 'scrap' }, ctx);
  },
  play(tl, a, ctx) {
    const cutDur = a.dropPart ? a.dur * 0.6 : a.dur;
    if (a.dropPart) {
      // capture the piece's start now, before this action's apply() moves it
      const b = ctx.model.bounds(a.dropPart);
      remove.play(tl, { t: a.t + cutDur, dur: a.dur - cutDur, type: 'remove', part: a.dropPart, via: 'drop', liftBy: Math.max(0.5, b.min.y), to: 'scrap' }, ctx);
    }
    const fx = ctx.fx; if (!fx) return;
    const m = ctx.model;
    const pts = m.anchorWorld(a.cut);
    const n = m.anchorNormal(a.cut);                // side the grinder works from
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const dir = p1.clone().sub(p0).normalize();
    const { g: tool, disc } = grinderTool('#7d6f5a', 0.12);
    // disc plane contains the cut direction and the normal → disc axis = dir × n
    const axis = new Vector3().crossVectors(dir, n).normalize();
    tool.quaternion.setFromUnitVectors(UP, axis.lengthSq() > 0 ? axis : UP);
    fx.transient.add(tool);
    const kerfMat = new MeshStandardMaterial({ color: '#2a2a2a', emissive: '#ff6a10', emissiveIntensity: 0, roughness: 0.6 });
    kerfMat.userData.noPaint = true;
    const kerf = new Mesh(new TubeGeometry(new LineCurve3(p0, p1), 12, 0.06, 5, false), kerfMat);
    fx.transient.add(kerf);
    const kIdx = kerf.geometry.index!.count;
    const sparkDir = n.clone().multiplyScalar(-0.3).add(dir.clone().multiplyScalar(-0.4)).add(new Vector3(0, -0.6, 0)).normalize();
    let lastEmit = -1;
    track(tl, a.t, a.dur, (s, u) => {
      const k = clamp01(s / cutDur);
      const cutting = u > 0 && s < cutDur;
      tool.visible = cutting;
      kerf.visible = u > 0 && (a.dropPart ? s < cutDur + 0.6 : u < 1);
      kerf.geometry.setDrawRange(0, Math.ceil((kIdx / 6) * k) * 6);
      kerfMat.emissiveIntensity = cutting ? 1.6 : 1.6 * (1 - seg(s, cutDur, cutDur + 0.6));
      if (!cutting) return;
      const at = p0.clone().lerp(p1, k);
      tool.position.copy(at).addScaledVector(n, 1.2);
      disc.rotation.y = s * 90;
      if (ctx.live() && s - lastEmit > 0.025) {
        lastEmit = s;
        fx.emit({ at, count: 14, dir: sparkDir, spread: 0.35, speed: [50, 110], life: [0.25, 0.7], colorA: '#fff6d0', colorB: '#ff5a00' });
      }
      if (s < lastEmit) lastEmit = -1;
    });
  },
};

/** Flap-disc pass over a set of spots (anchor points) — grinding tabs flush, no recolor of the whole part. */
export function grindSpots(tl: gsap.core.Timeline, a: A<'grind' | 'wireWheel'>, ctx: import('../context').Ctx) {
  const fx = ctx.fx; if (!fx) return;
  const m = ctx.model;
  const pts = m.anchorWorld(a.target), n = m.anchorNormal(a.target);
  const { g: tool, disc } = grinderTool(a.type === 'grind' ? '#8a7a55' : '#8c7b5c', 0.4);
  tool.quaternion.setFromUnitVectors(UP, n);
  fx.transient.add(tool);
  const per = a.dur / pts.length;
  let lastEmit = -1;
  track(tl, a.t, a.dur, (s, u) => {
    tool.visible = u > 0 && u < 1;
    if (!tool.visible) return;
    const i = Math.min(pts.length - 1, Math.floor(s / per));
    const k = (s - i * per) / per;
    const at = pts[i].clone().add(new Vector3(0, 0, Math.sin(k * Math.PI * 4) * 1.2));
    tool.position.copy(at).addScaledVector(n, 0.4 + (k < 0.1 || k > 0.9 ? 2 : 0));
    disc.rotation.y = s * 80;
    if (k > 0.1 && k < 0.9 && ctx.live() && s - lastEmit > 0.03) {
      lastEmit = s;
      fx.emit({ at, count: 9, dir: new Vector3(0, -0.5, -1).normalize(), spread: 0.5, speed: [40, 90], life: [0.25, 0.6], colorA: '#fff3c0', colorB: '#ff6a00' });
    }
    if (s < lastEmit) lastEmit = -1;
  });
}
