import type { PartDef } from '../registry';
import { mats, painted } from '../../scene/materials';
import { boxAt, cylX, group } from './util';

// M1 placeholder tractor built from boxes. Replaced by the full stock model (Part B1) in M2.
export const demoParts: PartDef[] = [
  {
    id: 'frameRailL', build: () => group(boxAt(mats.oldSteel(), [-6.5, 9.5, -10], [-5.25, 12.5, 60])),
  },
  {
    id: 'frameRailR', build: () => group(boxAt(mats.oldSteel(), [5.25, 9.5, -10], [6.5, 12.5, 60])),
  },
  {
    // Hood pivot on its hinge line: front lower edge (Z = 61, Y = 17).
    id: 'hood', tags: ['xray'], pivot: [0, 17, 61],
    build: () => group(boxAt(painted('body'), [-8.5, 0, -27], [8.5, 14, 1])),
  },
  {
    id: 'demoBracket', defaultState: 'hidden',
    build: () => group(boxAt(mats.rawSteel(), [-6.9, 7.5, 20], [-6.55, 12.3, 28])),
  },
  ...(['L', 'R'] as const).flatMap((s): PartDef[] => {
    const x = s === 'L' ? -1 : 1;
    const wheel = (r: number, w: number) => () => {
      const tire = cylX(mats.rubber(), r, w); const rim = cylX(painted('wheel'), r * 0.55, w + 0.2);
      return group(tire, rim);
    };
    return [
      { id: `wheelRearStock${s}`, pivot: [15 * x, 11.5, 0], build: wheel(11.5, 8.5) },
      { id: `wheelFrontStock${s}`, pivot: [13 * x, 8, 44], build: wheel(8, 6.5) },
    ];
  }),
  {
    id: 'seat', pivot: [0, 30, -2],
    build: () => {
      const pan = boxAt(painted('seat'), [-8, 0, -7], [8, 2, 7]);
      const back = boxAt(painted('seat'), [-8, 2, -8], [8, 10, -6]);
      const post = boxAt(mats.black(), [-1, -12, -1], [1, 0, 1]);
      return group(pan, back, post);
    },
  },
];
