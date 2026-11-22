import { gsap } from 'gsap';
import { Vector3 } from 'three';
import type { Model } from '../model/registry';
import type { Fx } from '../fx/fx';
import type { Step } from '../steps/types';
import { anchorLocal, centerOf, hasAnchor } from '../model/anchors';
import { CameraRig, resolveCameraKey } from '../scene/cameras';
import { easeInOut, track, type Ctx } from './context';
import { handlerFor } from './actions';

export type EngineEvent = 'step' | 'time' | 'state' | 'complete';

const byTime = <T extends { t: number }>(xs: T[]) => xs.map((x, i) => [x, i] as const).sort((a, b) => a[0].t - b[0].t || a[1] - b[1]).map(p => p[0]);

/** Apply every action of a step instantly (end state, no effects). Shared with scripts/validate.ts. */
export function applyStep(step: Step, model: Model, fx: Fx | null = null) {
  const ctx: Ctx = { model, fx: null, step, live: () => false };
  void fx;
  for (const a of byTime(step.actions)) {
    const h = handlerFor(a);
    if (h) h.apply(a, ctx);
  }
}

/** A5: state machine with deterministic random access. */
export class StepEngine {
  index = -1;
  tl: gsap.core.Timeline | null = null;
  playing = false;
  speed = 1;
  autoAdvance = false;
  scrubbing = false;
  private listeners: Record<EngineEvent, Array<() => void>> = { step: [], time: [], state: [], complete: [] };
  private advanceTimer = 0;

  constructor(public steps: Step[], public model: Model, public fx: Fx, public rig: CameraRig) {}

  on(e: EngineEvent, f: () => void) { this.listeners[e].push(f); }
  private emit(e: EngineEvent) { this.listeners[e].forEach(f => f()); }

  get step() { return this.steps[this.index]; }
  get time() { return this.tl?.time() ?? 0; }
  get duration() { return this.step?.durationSec ?? 0; }

  /** Open step i: reset to stock -> apply steps 0..i-1 -> build and (optionally) play step i. */
  open(i: number, autoplay = true) {
    i = Math.max(0, Math.min(this.steps.length - 1, i));
    clearTimeout(this.advanceTimer);
    this.tl?.kill(); this.tl = null;
    this.fx.clearTransient();
    this.model.reset();
    for (let j = 0; j < i; j++) applyStep(this.steps[j], this.model);
    this.model.root.updateMatrixWorld(true);
    this.index = i;
    this.rig.override = false;
    this.tl = this.build(this.steps[i]);
    // render frame 0 once so every action shows its own start state
    this.tl.progress(0.0001, true).progress(0, true);
    this.playing = false;
    this.emit('step');
    if (autoplay) this.play(); else this.emit('state');
  }

  private build(step: Step) {
    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => this.emit('time'),
      onComplete: () => this.complete(),
    });
    tl.to({ x: 0 }, { x: 1, duration: step.durationSec, ease: 'none' }, 0); // fixes the step length
    const ctx: Ctx = { model: this.model, fx: this.fx, step, live: () => this.playing && !this.scrubbing };

    // Actions: schedule play(), then advance the model to the action's end state so the next action
    // captures the right start. Restore the snapshot afterwards so the timeline starts from the true start.
    const snap = this.model.snapshot();
    for (const a of byTime(step.actions)) {
      const h = handlerFor(a);
      if (!h) { console.warn(`[${step.number}] action '${a.type}' not implemented yet`); continue; }
      const shelf = this.model.shelfNext;
      h.play(tl, a, ctx);
      this.model.shelfNext = shelf;
      h.apply(a, ctx);
      this.model.root.updateMatrixWorld(true);
    }
    this.model.restore(snap);

    this.buildCamera(tl, step);
    this.buildCallouts(tl, step);
    tl.timeScale(this.speed);
    return tl;
  }

  private buildCamera(tl: gsap.core.Timeline, step: Step) {
    let prev = this.rig.current();
    const keys = byTime(step.camera);
    for (const k of keys) {
      const from = prev, to = resolveCameraKey(k);
      const dur = k.dur ?? 1.2;
      track(tl, k.t, dur, (_s, u) => {
        if (u <= 0 && k !== keys[0]) return;
        const e = easeInOut(u);
        this.rig.set(from.position.clone().lerp(to.position, e), from.target.clone().lerp(to.target, e));
      });
      prev = to;
    }
  }

  private buildCallouts(tl: gsap.core.Timeline, step: Step) {
    for (const c of step.callouts) {
      let label;
      if (this.model.has(c.anchor)) {
        // ride along with the part: attach just above its bounding box
        const r = this.model.get(c.anchor);
        const b = this.model.bounds(c.anchor);
        const top = new Vector3((b.min.x + b.max.x) / 2, b.max.y + 0.5, (b.min.z + b.max.z) / 2);
        label = this.fx.callout(r.obj, r.obj.worldToLocal(top), c.title, c.sub);
      } else if (hasAnchor(c.anchor)) {
        label = this.fx.callout(this.model.anchorSpace(c.anchor), centerOf(anchorLocal(c.anchor)), c.title, c.sub);
      } else { console.warn(`callout anchor ${c.anchor} not found`); continue; }
      const end = c.hideAt ?? step.durationSec;
      const len = end - c.showAt;
      const hides = c.hideAt !== undefined;
      track(tl, c.showAt, len, (s, u) => { label.visible = u > 0 && (!hides || u < 1) && s >= 0; });
    }
  }

  play() {
    if (!this.tl) return;
    clearTimeout(this.advanceTimer);
    if (this.tl.progress() >= 1) this.tl.seek(0);
    this.playing = true;
    this.tl.play();
    this.emit('state');
  }
  pause() { this.tl?.pause(); this.playing = false; clearTimeout(this.advanceTimer); this.emit('state'); }
  toggle() { this.playing ? this.pause() : this.play(); }
  restart() { if (!this.tl) return; this.fx.sparks.clear(); this.rig.override = false; this.tl.seek(0); this.play(); }
  seek(t: number) {
    if (!this.tl) return;
    this.tl.seek(Math.max(0, Math.min(this.duration, t)), false);
    this.emit('time');
  }
  setSpeed(s: number) { this.speed = s; this.tl?.timeScale(s); this.emit('state'); }
  next() { if (this.index < this.steps.length - 1) this.open(this.index + 1); }
  prev() { if (this.index > 0) this.open(this.index - 1); }

  private complete() {
    this.playing = false;
    this.fx.torch.intensity = 0;
    this.emit('state');
    this.emit('complete');
    if (this.autoAdvance && this.index < this.steps.length - 1) {
      this.advanceTimer = window.setTimeout(() => this.next(), 900 / this.speed);
    }
  }
}
