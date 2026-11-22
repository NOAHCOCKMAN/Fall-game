import { Vector3 } from 'three';
import { anchorLocal } from '../../model/anchors';
import { makeBead, setBead } from '../../fx/weld';
import type { Action } from '../../steps/types';
import { seg, track } from '../context';
import type { Handler } from './types';

type WeldA = Extract<Action, { type: 'weld' }>;

export const weld: Handler<WeldA> = {
  apply(a, ctx) {
    const b = makeBead(anchorLocal(a.seam), a.tack);
    setBead(b, 1, 0);
    ctx.model.addPersist(b.obj, ctx.model.anchorSpace(a.seam));
  },
  play(tl, a, ctx) {
    const fx = ctx.fx;
    if (!fx) return;
    const b = makeBead(ctx.model.anchorWorld(a.seam), a.tack);
    setBead(b, 0, 0);
    fx.transient.add(b.obj);
    const cool = Math.min(2, a.dur * 0.35);          // bead glows then cools over ~2 s
    const drawEnd = a.dur - cool;
    const away = new Vector3();
    let lastEmit = -1;
    track(tl, a.t, a.dur, (s, u) => {
      const draw = seg(s, 0, drawEnd);
      const heat = s < drawEnd ? 1 : 1 - seg(s, drawEnd, a.dur);
      setBead(b, u <= 0 ? 0 : draw, heat);
      const welding = u > 0 && s < drawEnd;
      if (!welding) { if (s >= drawEnd || u <= 0) fx.torch.intensity = 0; return; }
      const p = b.curve.getPointAt(a.tack ? Math.min(1, Math.floor(draw * 3) / 2) : draw);
      away.copy(p).add(new Vector3(0, 1.5, 0));
      fx.torch.position.copy(away);
      fx.torch.intensity = 400 * (0.6 + 0.4 * Math.random());   // 30–60 Hz flicker comes from per-frame randomness
      if (ctx.live() && s - lastEmit > 0.03) {
        lastEmit = s;
        fx.emit({ at: p, count: a.tack ? 6 : 10, dir: new Vector3(0, 1, 0), spread: 1.2, speed: [15, 55], life: [0.3, 0.8], gravity: 386 });
      }
      if (s < lastEmit) lastEmit = -1;
    });
  },
};
