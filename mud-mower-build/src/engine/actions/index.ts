import type { Action, ActionType } from '../../steps/types';
import type { Handler } from './types';
import { expandParts } from '../../model/groups';
import { install, remove, stateAction } from './parts';
import { weld } from './weld';
import { note } from './misc';
import { angleGauge, bolt, drill, fluid, laser, measure, mist, surface, trace } from './tools';
import { grindCut } from './cut';
import { cvtShift, cycleSuspension, drive, explode, spin, steerSweep } from './rigs';
import { fitCheck, lighting, lights, marks, mud, oscillate, paint, paintPresets, placeAt, title, vibrate } from './finish';
import { donorLineup, move, rotate, wrap, xray } from './motion';

/** Action library (A7). Types not yet implemented are flagged by validate. */
export const HANDLERS: Partial<Record<ActionType, Handler<any>>> = {
  remove, install, weld, note, measure, laser, angleGauge, drill, bolt, fluid, mist, trace,
  grind: surface, wireWheel: surface, grindCut,
  move, rotate, xray, wrap, donorLineup,
  cycleSuspension, steerSweep, cvtShift, spin, drive, explode, collapse: explode,
  paint, mud, lighting, lights, vibrate, marks, placeAt, fitCheck, oscillate, paintPresets, title,
  highlight: stateAction, ghost: stateAction, show: stateAction, hide: stateAction,
};

export function handlerFor(a: Action): Handler<Action> | null {
  return (HANDLERS[a.type] as Handler<Action> | undefined) ?? null;
}

/** Part ids an action references (for validation). */
export function partsOf(a: Action): string[] {
  switch (a.type) {
    case 'remove': case 'install': case 'highlight': case 'ghost': case 'show': case 'hide': case 'fluid':
    case 'move': case 'rotate': case 'wrap': case 'placeAt': case 'fitCheck': case 'oscillate': case 'vibrate': return [a.part];
    case 'paint': case 'spin': return expandParts(a.parts);
    case 'explode': case 'collapse': return a.group.startsWith('grp.') ? expandParts([a.group]) : [a.group.split(':')[0]];
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
    case 'laser': return [a.a, a.b].filter(Boolean);
    case 'mud': return [a.at];
    case 'drive': return [a.path];
    case 'bolt': return a.fasteners;
    case 'trace': return [a.path];
    case 'mist': return [a.at];
    case 'move': return a.to ? [a.to] : [];
    case 'rotate': case 'oscillate': return a.about ? [a.about] : [];
    case 'placeAt': return [a.anchor];
    case 'marks': return [a.at];
    case 'vibrate': return a.puff ? [a.puff] : [];
    case 'remove': return a.to && a.to !== 'shelf' && a.to !== 'scrap' ? [a.to] : [];
    default: return [];
  }
}
