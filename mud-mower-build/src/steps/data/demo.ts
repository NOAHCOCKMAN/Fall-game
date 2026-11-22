import type { Step } from '../types';

// M1 demo steps using box placeholders. Replaced by Part E step data (phase0.ts … phase9.ts) from M2 on.
export const demoSteps: Step[] = [
  {
    id: 'demo-remove', number: '0.1', phase: 0, title: 'Demo: remove the hood',
    summary: 'Engine test — remove() flies a part to the shelf.',
    durationSec: 10,
    camera: [{ t: 0, preset: 'front3q' }, { t: 6, preset: 'shelf', dur: 1.8 }],
    actions: [
      { t: 0.5, dur: 2, type: 'highlight', part: 'hood' },
      { t: 3, dur: 5, type: 'remove', part: 'hood', via: 'lift', to: 'shelf' },
    ],
    callouts: [{ showAt: 0.5, hideAt: 3, anchor: 'hood', title: 'Original hood', sub: 'It goes back on in 9.3' }],
    info: {
      why: 'Milestone 1 skeleton: proves remove(), callouts, highlight and camera moves.',
      how: ['Press Play or scrub the timeline.', 'Watch the hood pulse, lift and arc to the parts shelf.'],
      parts: ['Placeholder hood box'], tools: ['—'], specs: ['—'], safety: ['—'],
      doneWhen: ['Hood ends up on the shelf', 'Scrubbing back puts it on the tractor again'],
    },
    donorNotes: { fordLT11: 'Donor notes show here for the active donor only.' },
  },
  {
    id: 'demo-install', number: '1.1', phase: 1, title: 'Demo: install a bracket',
    summary: 'Engine test — install() with a ghost preview.',
    durationSec: 10,
    camera: [{ t: 0, preset: 'leftSide' }, { t: 2, position: [-50, 22, 40], target: [-6, 10, 24], dur: 1.6 }],
    actions: [
      { t: 0.5, dur: 2.5, type: 'note', text: 'Install from above, ghost first' },
      { t: 3, dur: 3.5, type: 'install', part: 'demoBracket', from: 'above', ghostFirst: true },
      { t: 7, dur: 2, type: 'highlight', part: 'demoBracket' },
    ],
    callouts: [{ showAt: 7, anchor: 'pt.demo.bracket', title: 'New bracket', sub: '3/16 plate' }],
    info: {
      how: ['A light-blue ghost shows where the part goes.', 'Then it drops into place.'],
      parts: ['Placeholder bracket'], tools: ['Clamps'], specs: ['3/16 plate'], safety: ['Gloves'],
      doneWhen: ['Bracket sits on the left rail'],
    },
  },
  {
    id: 'demo-weld', number: '2.1', phase: 2, title: 'Demo: weld the bracket',
    summary: 'Engine test — tack then full weld with sparks and cooling bead.',
    durationSec: 14,
    camera: [{ t: 0, position: [-34, 20, 36], target: [-6, 11, 24], dur: 1.4 }],
    actions: [
      { t: 1.5, dur: 2.5, type: 'weld', seam: 'seam.demo.bracketTop', tack: true },
      { t: 5, dur: 6.5, type: 'weld', seam: 'seam.demo.bracketTop' },
      { t: 11.5, dur: 2.5, type: 'weld', seam: 'seam.demo.bracketEnds' },
    ],
    callouts: [{ showAt: 1.5, hideAt: 4.5, anchor: 'seam.demo.bracketTop', title: 'Tack first', sub: 'ends + middle' }],
    info: {
      how: ['Tack at both ends and the middle.', 'Check fit, then run the full bead.'],
      parts: ['—'], tools: ['Welder', 'Helmet'], specs: ['E71T-11 wire for multi-pass'], safety: ['Sleeves, helmet, extinguisher nearby'],
      doneWhen: ['Bead cools to dark gray', 'Jumping to 0.1 and back here shows the same result'],
    },
  },
];
