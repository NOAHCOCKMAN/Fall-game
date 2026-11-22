import { Vector3 } from 'three';
import { anchorDef, anchorLocal } from '../../model/anchors';
import { makeBead, setBead, type BeadOpts } from '../../fx/weld';
import type { Action } from '../../steps/types';
import { seg, track } from '../context';
import type { Handler } from './types';

type WeldA = Extract<Action, { type: 'weld' }>;
const opts = (a: WeldA): BeadOpts => ({ tack: a.tack, stitch: a.stitch, segs: !!anchorDef(a.seam).segs });

export const weld: Handler<WeldA> = {
  apply(a, ctx) {
    const b = makeBead(anchorLocal(a.seam), opts(a));
    setBead(b, 1, 0);
    ctx.model.addPersist(b.obj, ctx.model.anchorSpace(a.seam));
  },
  play(tl, a, ctx) {
    const fx = ctx.fx;
    if (!fx) return;
    const b = makeBead(ctx.model.anchorWorld(a.seam), opts(a));
    setBead(b, 0, 0);
    fx.transient.add(b.obj);
    const cool = Math.min(2, a.dur * 0.35);          // bead glows then cools over ~2 s
    const drawEnd = a.dur - cool;
    let lastEmit = -1;
    track(tl, a.t, a.dur, (s, u) => {
      const draw = seg(s, 0, drawEnd);
      const heat = s < drawEnd ? 1 : 1 - seg(s, drawEnd, a.dur);
      setBead(b, u <= 0 ? 0 : draw, heat);
      const welding = u > 0 && s < drawEnd;
      if (!welding) { fx.torch.intensity = 0; return; }
      // torch only burns over a piece being laid (gaps in stitch / between tacks are travel)
      const laying = b.pieces.some(p => draw >= p.start - 0.002 && draw <= p.end + 0.002);
      const p = b.at(draw);
      fx.torch.position.copy(p).add(new Vector3(0, 1.5, 0));
      fx.torch.intensity = laying ? 400 * (0.6 + 0.4 * Math.random()) : 0;   // 30–60 Hz flicker from per-frame randomness
      if (laying && ctx.live() && s - lastEmit > 0.03) {
        lastEmit = s;
        fx.emit({ at: p, count: a.tack ? 6 : 10, dir: new Vector3(0, 1, 0), spread: 1.2, speed: [15, 55], life: [0.3, 0.8], gravity: 386 });
      }
      if (s < lastEmit) lastEmit = -1;
    });
  },
};
