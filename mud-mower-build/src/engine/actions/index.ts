import type { Action, ActionType } from '../../steps/types';
import type { Handler } from './types';
import { install, remove, stateAction } from './parts';
import { weld } from './weld';
import { note } from './misc';
import { angleGauge, bolt, drill, fluid, laser, measure, mist, surface, trace } from './tools';
import { grindCut } from './cut';
import { donorLineup, move, rotate, wrap, xray } from './motion';

/** Action library (A7). Types not yet implemented are flagged by validate. */
export const HANDLERS: Partial<Record<ActionType, Handler<any>>> = {
  remove, install, weld, note, measure, laser, angleGauge, drill, bolt, fluid, mist, trace,
  grind: surface, wireWheel: surface, grindCut,
  move, rotate, xray, wrap, donorLineup,
  highlight: stateAction, ghost: stateAction, show: stateAction, hide: stateAction,
};

export function handlerFor(a: Action): Handler<Action> | null {
  return (HANDLERS[a.type] as Handler<Action> | undefined) ?? null;
}

/** Part ids an action references (for validation). */
export function partsOf(a: Action): string[] {
  switch (a.type) {
    case 'remove': case 'install': case 'highlight': case 'ghost': case 'show': case 'hide': case 'fluid':
    case 'move': case 'rotate': case 'wrap': return [a.part];
    case 'paint': case 'spin': return a.parts;
    case 'grindCut': return a.dropPart ? [a.dropPart] : [];
    default: return [];
  }
}

/** Anchor names an action references (for validation). Remove destinations other than shelf/scrap are anchors. */
export function anchorsOf(a: Action): string[] {
  switch (a.type) {
    case 'weld': return [a.seam];
    case 'grindCut': return [a.cut];
    case 'drill': case 'angleGauge': return [a.anchor];
    case 'measure': return a.b ? [a.a, a.b] : [a.a];
    case 'laser': return [a.a, a.b];
    case 'mud': return [a.at];
    case 'drive': return [a.path];
    case 'bolt': return a.fasteners;
    case 'trace': return [a.path];
    case 'mist': return [a.at];
    case 'move': return a.to ? [a.to] : [];
    case 'remove': return a.to && a.to !== 'shelf' && a.to !== 'scrap' ? [a.to] : [];
    default: return [];
  }
}
