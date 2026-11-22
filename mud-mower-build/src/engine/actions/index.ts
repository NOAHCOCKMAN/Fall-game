import type { Action, ActionType } from '../../steps/types';
import type { Handler } from './types';
import { install, remove, stateAction } from './parts';
import { weld } from './weld';
import { note } from './misc';

/** Action library (A7). Types not yet implemented are listed so validate can flag them. */
export const HANDLERS: Partial<Record<ActionType, Handler<any>>> = {
  remove, install, weld, note,
  highlight: stateAction, ghost: stateAction, show: stateAction, hide: stateAction,
};

export function handlerFor(a: Action): Handler<Action> | null {
  return (HANDLERS[a.type] as Handler<Action> | undefined) ?? null;
}

/** Part ids an action references (for validation). */
export function partsOf(a: Action): string[] {
  switch (a.type) {
    case 'remove': case 'install': case 'highlight': case 'ghost': case 'show': case 'hide': case 'fluid': return [a.part];
    case 'paint': case 'spin': return a.parts;
    case 'grind': case 'wireWheel': return [a.target];
    case 'grindCut': return a.dropPart ? [a.dropPart] : [];
    case 'bolt': return [];
    default: return [];
  }
}

/** Anchor names an action references (for validation). */
export function anchorsOf(a: Action): string[] {
  switch (a.type) {
    case 'weld': return [a.seam];
    case 'grindCut': return [a.cut];
    case 'drill': case 'angleGauge': return [a.anchor];
    case 'measure': case 'laser': return [a.a, a.b];
    case 'mud': return [a.at];
    case 'drive': return [a.path];
    default: return [];
  }
}
