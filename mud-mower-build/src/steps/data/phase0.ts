import type { Step } from '../types';

// PHASE 0 — PLAN (Part E). Text transcribed from BUILD_SPEC.md.
export const phase0: Step[] = [
  {
    id: 'plan-donor', number: '0.1', phase: 0, title: 'Pick the donor',
    summary: 'Gear-transaxle garden tractor with 1-in axles and a heavy frame.',
    durationSec: 16,
    camera: [
      { t: 0, position: [-30, 150, 330], target: [-15, 8, -28], dur: 1.2 },
      { t: 1.5, position: [50, 140, 320], target: [5, 8, -22], dur: 8 },   // slow dolly right
      { t: 11, preset: 'front3q', dur: 2.5 },
    ],
    actions: [
      { t: 0, dur: 16, type: 'donorLineup' },
    ],
    callouts: [
      { showAt: 13, anchor: 'transaxle2300', title: 'Gear transaxle' },
      { showAt: 13.6, anchor: 'pt.axlesRear', title: '1-in axles' },
      { showAt: 14.2, anchor: 'pt.frameFront', title: 'Heavy channel frame' },
    ],
    info: {
      why: 'The donor sets your frame strength, transaxle and axle size. Picking right saves weeks.',
      how: [
        'Look for a garden tractor with a gear transaxle and 1-in axles — heavy channel frame, cast transaxle case, real shifter. Skip anything hydrostatic (the "H" models) — hydros overheat and slip under mud loads and don\'t pair with a CVT.',
        'Ranking for this build: JD 110 / 112 (best): heavy frame, horizontal-shaft engine layout, factory Peerless 2300 4-speed + reverse. JD 200-series (210/212/214/216): also heavy-duty garden tractors — check the transaxle tag before buying. Sears/Craftsman garden tractors (GT-type): many have a Peerless 2300 or similar — check the tag. Ford YT-16 (gear version): Gilson-built yard tractor, 5-speed or hydrostatic — get the 5-speed. Ford LT-11: Gilson-built lawn tractor, lighter — plan on a transaxle swap and frame boxing. Murray: lightest frames, usually light-duty 5-speeds — workable for a light build, expect to rebuild most of it.',
        'Inspect before paying: frame cracks (front axle pivot, transaxle mounts, steering sector mount), rear wheels off the ground → transaxle shifts all gears + reverse with no grinding, no wobble in the axles, steering sector teeth intact, hood straight enough to fix.',
        'Get a bill of sale. Take photos of the data plate.',
      ],
      parts: ['Donor tractor'],
      tools: ['Flashlight', 'Jack', 'Phone camera'],
      specs: ['Must-haves: gear transaxle, 1-in axles, solid frame.'],
      safety: ["Don't put fingers in pulleys when test-running a donor. Chock wheels."],
      doneWhen: [
        'Donor bought, transaxle model tag photographed',
        'Frame inspected, no unrepairable cracks',
        "It's not the clean collector one you'd regret cutting",
      ],
    },
    donorNotes: {
      fordLT11: 'Lighter lawn tractor. Treat step 3.1 as a full transaxle swap and box the frame in 2.3 no matter what. If this is the LT-11 you\'re restoring, buy a second, rough one for the mud build.',
      fordYT16: "Make sure it's the 5-speed, not the YT-16H hydrostatic.",
      murray: 'Thin stamped frame — plan extra boxing and crossmembers.',
    },
  },
  {
    id: 'plan-measure', number: '0.2', phase: 0, title: 'Measure and document the stock tractor',
    summary: 'Every number, photo and the hood-profile template before teardown.',
    durationSec: 18,
    camera: [
      { t: 0, preset: 'leftSide' },
      { t: 4, preset: 'top' },
      { t: 8, position: [70, 40, 62], target: [2, 20, 48], dur: 1.2 },
      { t: 12, preset: 'rear3q' },
    ],
    actions: [
      { t: 0.4, dur: 3.4, type: 'measure', a: 'meas.wheelbase', label: 'Wheelbase 44 in', keep: true },
      { t: 4.6, dur: 7.4, type: 'measure', a: 'meas.trackRear', label: 'Rear track 30 in' },
      { t: 5.2, dur: 6.8, type: 'measure', a: 'meas.trackFront', label: 'Front track 26 in' },
      { t: 5.8, dur: 6.2, type: 'measure', a: 'meas.frameWidth', label: 'Frame 13 in' },
      { t: 8, dur: 4, type: 'xray' },
      { t: 8.6, dur: 3.4, type: 'measure', a: 'meas.hoodHeight', label: 'Hood top 31 in' },
      { t: 8.8, dur: 0.6, type: 'show', part: 'hoodTemplate' },
      { t: 9.4, dur: 2.6, type: 'trace', path: 'path.hoodProfile', color: '#e8d6b0', radius: 0.16 },
      { t: 12.2, dur: 3, type: 'highlight', part: 'transaxle2300' },
      { t: 13, dur: 5, type: 'measure', a: 'axis.transInput', label: 'Input direction?' },
      // the template is stored on the shelf — it comes back in 6.1
      { t: 15.5, dur: 2.5, type: 'remove', part: 'hoodTemplate', to: 'shelf' },
    ],
    callouts: [
      { showAt: 9.4, hideAt: 12, anchor: 'hoodTemplate', title: 'Hood-profile template', sub: 'cardboard — becomes the cage shape' },
      { showAt: 12.2, anchor: 'transaxle2300', title: 'Tag: Peerless 2300' },
    ],
    info: {
      why: "Everything later (cage, hood fit, suspension mounts, driveshaft) depends on these numbers. You can't measure it after it's in pieces.",
      how: [
        'Photograph every side, under the hood, under the frame, the steering linkage and the belt routing.',
        'Measure and write down: wheelbase, rear and front track, frame rail spacing and height, hood inside width/height/length, seat height, steering column angle, engine mount bolt pattern.',
        "Make a cardboard template of the hood's inside profile (trace the sides and the top curve) — this becomes the engine cage shape in Phase 6.",
        "Find the transaxle tag and record the model. Note the input shaft direction: does it point forward (horizontal), sideways, or straight up (vertical)? You'll need this at the Phase 5 decision gate.",
        'Get bags + a marker. Every fastener goes in a labeled bag ("hood hinge", "steering sector", …).',
      ],
      parts: ['Zip bags', 'Cardboard'],
      tools: ['Tape measure', 'Angle finder', 'Marker', 'Camera'],
      specs: ['Record all numbers in one note on your phone.'],
      safety: ['—'],
      doneWhen: ['Measurement sheet complete', 'Hood-profile template cut', 'Transaxle tag + input direction recorded'],
    },
  },
  {
    id: 'plan-shop', number: '0.3', phase: 0, title: 'Set up the shop',
    summary: 'Clear flammables, extinguisher in reach, ventilation, PPE, stands.',
    durationSec: 12,
    camera: [
      { t: 0, preset: 'bench' },
      { t: 6, position: [150, 85, 95], target: [55, 10, -12], dur: 1.6 },
    ],
    actions: [
      { t: 0.0, dur: 0.6, type: 'show', part: 'workbench' },
      { t: 0.5, dur: 0.6, type: 'show', part: 'welder' },
      { t: 1.0, dur: 0.6, type: 'show', part: 'grinder' },
      { t: 1.4, dur: 0.6, type: 'show', part: 'grinder2' },
      { t: 1.9, dur: 0.6, type: 'show', part: 'jackStand1' },
      { t: 2.2, dur: 0.6, type: 'show', part: 'jackStand2' },
      { t: 2.5, dur: 0.6, type: 'show', part: 'jackStand3' },
      { t: 2.8, dur: 0.6, type: 'show', part: 'jackStand4' },
      { t: 3.3, dur: 0.6, type: 'show', part: 'toolbox' },
      { t: 3.8, dur: 0.6, type: 'show', part: 'fireExtinguisher' },
      { t: 4.3, dur: 1.7, type: 'highlight', part: 'fireExtinguisher' },
      { t: 4.4, dur: 0.6, type: 'show', part: 'boltTrays' },
      { t: 4.9, dur: 0.6, type: 'show', part: 'partsShelf' },
      { t: 5.3, dur: 0.6, type: 'show', part: 'scrapBin' },
      { t: 6.5, dur: 5.5, type: 'highlight', part: 'fireExtinguisher' },
    ],
    callouts: [
      { showAt: 6.5, anchor: 'shop.extinguisher', title: 'Extinguisher within reach' },
      { showAt: 7.5, anchor: 'shop.flammables', title: 'No flammables within 35 ft' },
      { showAt: 8.5, anchor: 'shop.fan', title: 'Ventilation' },
    ],
    info: {
      why: 'Grinding and welding near fuel, rags and old grease is how shops burn down.',
      how: [
        'Clear a 10 × 15 ft area. Sweep. No rags, cardboard piles, gas cans or aerosol cans within 35 ft of grinding/welding sparks (or cover them with a welding blanket).',
        'Fire extinguisher (ABC) within reach. Bucket of water. Stay 30 minutes after the last weld to watch for smoldering.',
        'Welder on its own 120 V 20 A circuit if possible; short heavy extension only if you must.',
        'Ventilation: fan pulling fumes away from you. Never weld or grind galvanized or painted metal without stripping it first — strip it outdoors and wear a respirator.',
        'PPE: helmet, safety glasses under it, gloves, leather or cotton (no synthetics), boots, hearing protection for grinding.',
        'Jack stands rated for the weight; never work under a tractor on a jack alone.',
      ],
      parts: ['—'],
      tools: ['Extinguisher', 'PPE', 'Jack stands', 'Fan'],
      specs: ['—'],
      safety: ['This step is the safety step.'],
      doneWhen: ['Extinguisher mounted', 'Flammables cleared', 'PPE ready'],
    },
  },
];
