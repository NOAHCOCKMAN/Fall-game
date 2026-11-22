import type { Action } from '../../steps/types';
import { track } from '../context';
import type { Handler } from './types';

type NoteA = Extract<Action, { type: 'note' }>;

export const note: Handler<NoteA> = {
  apply() { /* captions leave no end state */ },
  play(tl, a, ctx) {
    const fx = ctx.fx; if (!fx) return;
    track(tl, a.t, a.dur, (_s, u) => fx.note(u > 0 && u < 1 ? a.text : null));
  },
};
