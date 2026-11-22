import type { Model } from '../model/registry';
import type { Fx } from '../fx/fx';
import type { Step } from '../steps/types';

export interface Ctx {
  model: Model;
  fx: Fx | null;        // null in apply-only contexts (validate script)
  step: Step;
  /** true while the timeline plays forward in real time (emit particles only then, not while scrubbing). */
  live(): boolean;
}

/** Run `fn(sec)` across [at, at+dur] on the timeline; sec = seconds into the action (0..dur). */
export function track(tl: gsap.core.Timeline, at: number, dur: number, fn: (sec: number, u: number) => void) {
  const d = Math.max(dur, 0.001);
  const o = { u: 0 };
  tl.to(o, { u: 1, duration: d, ease: 'none', immediateRender: false, onUpdate: () => fn(o.u * d, o.u) }, at);
}

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const easeInOut = (x: number) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const seg = (u: number, a: number, b: number) => clamp01((u - a) / (b - a));
