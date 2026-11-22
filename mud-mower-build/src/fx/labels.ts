import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

/** A 3D-anchored label. 'callout' = pill + leader line; 'tag' = plain pill; 'measure' = dimension text. */
export function makeCallout(title: string, sub?: string, kind: 'callout' | 'tag' | 'measure' = 'callout'): CSS2DObject {
  const outer = document.createElement('div');
  outer.className = `co ${kind}`;
  const pill = document.createElement('div'); pill.className = 'co-pill';
  const t = document.createElement('div'); t.className = 'co-title'; t.textContent = title; pill.appendChild(t);
  if (sub) { const s = document.createElement('div'); s.className = 'co-sub'; s.textContent = sub; pill.appendChild(s); }
  if (kind === 'callout') { const line = document.createElement('div'); line.className = 'co-line'; outer.appendChild(line); }
  outer.appendChild(pill);
  const o = new CSS2DObject(outer);
  o.visible = false;
  return o;
}

/** Update a label's text in place (live values like ratios). */
export function setLabelText(o: CSS2DObject, title: string) {
  const t = o.element.querySelector('.co-title'); if (t) t.textContent = title;
}
