import { Object3D, Vector3 } from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

/** A 3D-anchored callout: dark pill + thin leader line down to the anchor point. */
export function makeCallout(title: string, sub?: string, kind: 'callout' | 'tag' = 'callout'): CSS2DObject {
  const outer = document.createElement('div');
  outer.className = `co ${kind}`;
  const line = document.createElement('div'); line.className = 'co-line';
  const pill = document.createElement('div'); pill.className = 'co-pill';
  const t = document.createElement('div'); t.className = 'co-title'; t.textContent = title; pill.appendChild(t);
  if (sub) { const s = document.createElement('div'); s.className = 'co-sub'; s.textContent = sub; pill.appendChild(s); }
  outer.append(line, pill);
  const o = new CSS2DObject(outer);
  o.visible = false;
  return o;
}

export function attachAt(o: Object3D, parent: Object3D, local: Vector3) { o.position.copy(local); parent.add(o); }
