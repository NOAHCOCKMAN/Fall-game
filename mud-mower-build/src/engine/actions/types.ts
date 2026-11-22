import type { Action } from '../../steps/types';
import type { Ctx } from '../context';

export interface Handler<A extends Action = Action> {
  /** Add the animated version to the step timeline at a.t. Must not mutate model state at build time. */
  play(tl: gsap.core.Timeline, a: A, ctx: Ctx): void;
  /** Jump straight to the end state, no effects. */
  apply(a: A, ctx: Ctx): void;
}
