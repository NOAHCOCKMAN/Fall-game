import type { Action, Step } from '../types';

// PHASE 2 — FRAME (Part E). Text transcribed from BUILD_SPEC.md.

const cutTabs = ['deckHangers.1', 'deckHangers.2', 'deckHangers.3', 'deckHangers.4', 'bracketsMisc.pedal', 'bracketsMisc.liftShaft', 'bracketsMisc.sector'];
const cuts: [string, string][] = [   // [cut line, piece] — left side first (leftSide camera), then right side from underneath
  ['cut.deckHangers.1', 'deckHangers.1'], ['cut.liftBrackets.pedal', 'bracketsMisc.pedal'], ['cut.deckHangers.3', 'deckHangers.3'],
  ['cut.liftBrackets.sector', 'bracketsMisc.sector'], ['cut.deckHangers.2', 'deckHangers.2'], ['cut.liftBrackets.1', 'bracketsMisc.liftShaft'],
  ['cut.deckHangers.4', 'deckHangers.4'],
];
const marks = ['mark.xRear', 'mark.rearLiftL', 'mark.rearLiftR', 'mark.apex', 'mark.xFrontSusp', 'mark.xEngineF', 'mark.xEngineR'];

export const phase2: Step[] = [
  {
    id: 'fr-cut', number: '2.1', phase: 2, title: "Cut off what you don't need",
    summary: 'Deck hangers, lift brackets, old pedal and sector mounts off; hood/grille/dash mounts kept.',
    durationSec: 16,
    camera: [{ t: 0, position: [-52, 22, 34], target: [-4, 10, 22] }, { t: 6.2, position: [6, -26, 30], target: [0, 10, 28], dur: 1.4 }],
    actions: [
      ...cutTabs.map((p): Action => ({ t: 0, dur: 3, type: 'highlight', part: p })),
      { t: 0, dur: 3, type: 'highlight', part: 'hoodMountTabs', color: '#3cd65a' },
      ...cuts.map(([cut, piece], i): Action => ({ t: 3 + i * 1.28, dur: 1.28, type: 'grindCut', cut, dropPart: piece })),
      { t: 12, dur: 2, type: 'grind', target: 'grind.spotsL' },
      { t: 14, dur: 2, type: 'grind', target: 'grind.spotsR' },
    ],
    callouts: [
      { showAt: 0, hideAt: 3, anchor: 'deckHangers.3', title: 'Cut', sub: 'deck hangers, lift + pedal brackets' },
      { showAt: 0, hideAt: 3, anchor: 'hoodMountTabs', title: 'Keep', sub: 'hood hinge / grille / dash mounts' },
    ],
    info: {
      how: [
        "Mark (soapstone) every tab you'll remove: deck hangers, lift-shaft brackets, pedal brackets you won't reuse, old steering sector mount.",
        'Keep anything that locates the hood hinge, grille and dash — you need them for the hood to sit right.',
        'Cut 1/16 proud of the rail with a cut-off disc; grind flush with a flap disc.',
      ],
      parts: ['—'],
      tools: ['Grinder (cut-off + flap)', 'Soapstone'],
      specs: [],
      safety: ["Face shield. Sparks travel far — check what's behind you."],
      doneWhen: ['All unneeded tabs removed and ground flush', 'Hood/grille/dash mounting points still intact'],
    },
  },
  {
    id: 'fr-layout', number: '2.2', phase: 2, title: 'Set ride height on the floor and lay out mounts',
    summary: 'Frame level at ride height (13.5 rear / 15 front); every mount position marked.',
    durationSec: 14,
    camera: [{ t: 0, position: [-70, 24, 30], target: [0, 9, 28] }, { t: 8.6, position: [-30, 55, 58], target: [0, 12, 30], dur: 1.4 }],
    actions: [
      // stands extend; frame rises to the new heights (rear +1 in, nose up ~1.2° → front ≈ 15 in)
      { t: 0.3, dur: 3, type: 'move', part: 'jackStand1Post', by: [0, 2.17, 0] },
      { t: 0.3, dur: 3, type: 'move', part: 'jackStand2Post', by: [0, 2.17, 0] },
      { t: 0.3, dur: 3, type: 'move', part: 'jackStand3Post', by: [0, 0.97, 0] },
      { t: 0.3, dur: 3, type: 'move', part: 'jackStand4Post', by: [0, 0.97, 0] },
      { t: 0.3, dur: 3, type: 'move', part: 'vehicle', by: [0, 1, 0] },
      { t: 0.3, dur: 3, type: 'rotate', part: 'vehicle', axis: 'x', deg: -1.23 },
      { t: 3.3, dur: 1.7, type: 'measure', a: 'pt.frameBottomRear', b: 'ground.rear', label: 'Rear 13.5 in', keep: true },
      { t: 3.6, dur: 1.4, type: 'measure', a: 'pt.frameBottomFront', b: 'ground.front', label: 'Front 15 in', keep: true },
      { t: 5, dur: 0.5, type: 'show', part: 'level' },
      { t: 5.6, dur: 2.6, type: 'move', part: 'levelBubble', by: [-0.7, 0, 0] },
      ...marks.map((m, i): Action => ({ t: 9 + i * 0.45, dur: 14 - (9 + i * 0.45), type: 'trace', path: m, color: '#f4f1ea', radius: 0.14 })),
      { t: 10.2, dur: 3.8, type: 'trace', path: 'line.axleOld', color: '#9fd3ff', radius: 0.12 },
      { t: 10.6, dur: 3.4, type: 'trace', path: 'line.axleNew', color: '#ffffff', radius: 0.16 },
      { t: 11, dur: 3, type: 'measure', a: 'pt.axleOld', b: 'pt.axleNew', label: '+3 in', keep: true },
      { t: 13.4, dur: 0.6, type: 'hide', part: 'level' },
    ],
    callouts: [
      { showAt: 6.4, hideAt: 9, anchor: 'level', title: 'Level side to side' },
      { showAt: 11, anchor: 'line.axleNew', title: 'New front axle', sub: '3 in forward of stock' },
    ],
    info: {
      why: 'Building on a level, known reference makes everything square.',
      how: [
        'Set the frame level side to side on 4 stands at final height: rear frame bottom ≈ 13.5 in, front ≈ 15 in (slight rake down to the rear is fine; adjust to taste).',
        'Mark the new front axle centerline 3 in forward of stock (more tire clearance for 25-in tires at full lock).',
        'Mark crossmember positions (engine ×2, front suspension, rear), the wishbone apex location (≈ 20 in behind the new axle centerline), and the rear lift-bracket locations.',
      ],
      parts: ['—'],
      tools: ['Level', 'Tape', 'Square', 'Soapstone', 'Stands'],
      specs: ['Frame bottom 13.5 rear / 15 front', 'Front axle +3 in forward'],
      safety: ['—'],
      doneWhen: ['Frame level side-to-side at ride height', 'All mount positions marked'],
    },
  },
  {
    id: 'fr-box', number: '2.3', phase: 2, title: 'Box the frame rails',
    summary: '3/16 plate closes each C-channel: tack, then alternate 1-in stitch welds.',
    durationSec: 20,
    camera: [{ t: 0, position: [-40, 42, 18], target: [0, 11, 24], dur: 1.2 }, { t: 18, position: [0, 95, 26], target: [0, 10, 25], dur: 1.2 }],
    actions: [
      { t: 0, dur: 2.6, type: 'install', part: 'boxPlateL', from: 'above', ghostFirst: true },
      { t: 0.6, dur: 2.6, type: 'install', part: 'boxPlateR', from: 'above', ghostFirst: true },
      { t: 3.3, dur: 0.6, type: 'show', part: 'clampsBox' },
      { t: 4, dur: 1, type: 'drill', anchor: 'holes.boxL', dia: 0.25 },
      { t: 5, dur: 1, type: 'drill', anchor: 'holes.boxR', dia: 0.25 },
      { t: 6, dur: 2, type: 'weld', seam: 'seam.boxL.top', tack: true },
      { t: 8, dur: 2, type: 'weld', seam: 'seam.boxR.top', tack: true },
      // stitch welds: 1 in every 3 in, alternating left / right and top / bottom to spread heat
      { t: 10, dur: 2, type: 'weld', seam: 'seam.boxL.top', stitch: [1, 3] },
      { t: 12, dur: 2, type: 'weld', seam: 'seam.boxR.bottom', stitch: [1, 3] },
      { t: 14, dur: 2, type: 'weld', seam: 'seam.boxL.bottom', stitch: [1, 3] },
      { t: 16, dur: 2, type: 'weld', seam: 'seam.boxR.top', stitch: [1, 3] },
      { t: 17.6, dur: 0.6, type: 'hide', part: 'clampsBox' },
      { t: 18.3, dur: 1.7, type: 'measure', a: 'pt.railL.rear', b: 'pt.railR.front', label: 'Diagonals match ±1/8', keep: true },
      { t: 18.5, dur: 1.5, type: 'measure', a: 'pt.railR.rear', b: 'pt.railL.front', label: '✓', keep: true },
    ],
    callouts: [
      { showAt: 10, hideAt: 18, anchor: 'pt.frameMid', title: 'Alternate sides to control heat', sub: 'L top → R bottom → L bottom → R top' },
    ],
    info: {
      why: 'An open C-channel twists. Boxing it makes it several times stiffer — needed for bigger tires, suspension loads and jumps.',
      how: [
        'Cut 3/16 × 3 flat bar to close the open side of each rail, from the front suspension area to the rear transaxle mounts.',
        'Drill 1/4 drain holes every 12 in along the bottom edge of each plate (mud and water must get out).',
        'Clamp, then tack both plates (ends + every 6 in).',
        'Stitch weld: 1-in welds every 3 in, alternating left rail / right rail and front / back, to spread heat and prevent warping. Fill later only if needed.',
        'Re-check the diagonals.',
      ],
      parts: ['3/16 × 3 flat bar'],
      tools: ['Welder', 'Clamps', 'Magnets', 'Drill', 'Grinder'],
      specs: ['3/16 plate', '1-in stitches every 3 in', 'Drain holes 1/4 every 12 in'],
      safety: ['Wear sleeves — vertical welds drop spatter.'],
      doneWhen: ['Both rails boxed, diagonals still within 1/8 in'],
    },
  },
  {
    id: 'fr-xmembers', number: '2.4', phase: 2, title: 'Add crossmembers',
    summary: 'Engine ×2, front suspension (with double-shear apex bracket + panhard tab), rear.',
    durationSec: 20,
    camera: [{ t: 0, position: [20, 70, 50], target: [0, 11, 40] }, { t: 5, position: [10, -30, 30], target: [0, 10, 30], dur: 1.4 }],
    actions: [
      { t: 0, dur: 1.5, type: 'install', part: 'xEngineF', from: 'above' },
      { t: 0.5, dur: 1.5, type: 'install', part: 'xEngineR', from: 'above' },
      { t: 2, dur: 1.5, type: 'weld', seam: 'seam.xEngineF.ends' },
      { t: 3.5, dur: 1.5, type: 'weld', seam: 'seam.xEngineR.ends' },
      { t: 5.2, dur: 1.8, type: 'install', part: 'xFrontSusp', from: 'side' },
      { t: 7, dur: 2, type: 'install', part: 'apexBracket', from: 'below', ghostFirst: true },
      { t: 9, dur: 1.5, type: 'weld', seam: 'seam.xFrontSusp.ends' },
      { t: 10.5, dur: 1.5, type: 'weld', seam: 'seam.apex' },
      // TODO(Noah): Part E's animation line says "panhard tab welded to right rail"; B2 and the How text put it on the LEFT rail — built on the left.
      { t: 12, dur: 1.5, type: 'install', part: 'panhardTab', from: 'below' },
      { t: 13.5, dur: 2.5, type: 'weld', seam: 'seam.panhardTab' },
      { t: 16, dur: 1.6, type: 'install', part: 'xRear', from: 'above' },
      { t: 17.6, dur: 2.4, type: 'weld', seam: 'seam.xRear.ends' },
    ],
    callouts: [
      { showAt: 9, hideAt: 12, anchor: 'pt.apex', title: 'Wishbone apex — double shear', sub: '5/8 hole' },
      { showAt: 13, hideAt: 16, anchor: 'panhardTab', title: 'Panhard tab', sub: 'left rail, new axle line' },
    ],
    info: {
      how: [
        'Engine crossmembers (1.5 × 1.5 × 1/8): at the front and rear of the engine mount plate position.',
        'Front suspension crossmember (2 × 2 × 3/16): at the wishbone apex location; weld on the apex bracket (two 3/8 ears, double shear, 5/8 hole) and the panhard frame tab (left rail, at the new front axle position).',
        'Rear crossmember ahead of the transaxle; it also anchors the driveshaft guard hoop later.',
        'Fit-up: each tube cut square, ends tight to the rails (gaps under 1/16). Tack, check square, then weld all around.',
      ],
      parts: ['1.5 × 1.5 × 1/8 square tube', '2 × 2 × 3/16 square tube', '3/8 plate (apex ears, panhard tab)'],
      tools: ['Saw', 'Grinder', 'Welder', 'Square'],
      specs: ['See sizes above', 'Apex hole 5/8'],
      safety: ['—'],
      doneWhen: ['4 crossmembers welded, square to rails', 'Apex bracket and panhard tab on'],
    },
  },
  {
    id: 'fr-frontclip', number: '2.5', phase: 2, title: 'Front clip, bumper mounts and tow point',
    summary: 'Rail extensions, front plate with a 3/4 tow hole, bumper tabs.',
    durationSec: 14,
    camera: [{ t: 0, preset: 'front3q' }, { t: 9.6, position: [22, 20, 100], target: [0, 12, 64], dur: 1.2 }],
    actions: [
      { t: 0, dur: 2.5, type: 'install', part: 'frontClip', from: 'front' },
      { t: 2.5, dur: 2.5, type: 'weld', seam: 'seam.frontClip' },
      { t: 5, dur: 2, type: 'install', part: 'frontClipPlate', from: 'front' },
      { t: 7, dur: 3, type: 'weld', seam: 'seam.frontPlate' },
      { t: 10.2, dur: 2, type: 'drill', anchor: 'pt.towHole', dia: 0.75 },
    ],
    callouts: [{ showAt: 11, anchor: 'pt.towHole', title: 'Tow / winch point' }],
    info: {
      how: [
        'If needed, extend the rails forward with 3/16 sleeves/plates so the bumper sits ahead of the grille.',
        'Weld a front plate across the rail ends with a 3/4 tow hole; add bumper mount tabs (two per side).',
      ],
      parts: ['3/16 plate / sleeves'],
      tools: ['Welder', 'Grinder', 'Drill'],
      specs: [],
      safety: ['—'],
      doneWhen: ['Front plate, tow point and bumper tabs welded'],
    },
  },
];
