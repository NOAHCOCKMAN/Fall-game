import type { DonorId, Step } from '../steps/types';
import { $, el } from './dom';
import { store } from './store';
import { PALETTES } from '../scene/materials';

const TABS = [
  ['how', 'How'], ['parts', 'Parts'], ['tools', 'Tools'], ['specs', 'Specs'], ['safety', 'Safety'], ['done', 'Done when'],
] as const;
type TabId = typeof TABS[number][0];

export class Panel {
  private tab: TabId = (store.get('mm.tab') as TabId) || 'how';
  private step: Step | null = null;
  private donor: DonorId = 'jd112';

  constructor() {
    const tabs = $('tabs');
    for (const [id, label] of TABS) {
      const b = el('button', 'tab', label);
      b.setAttribute('role', 'tab'); b.dataset.tab = id;
      b.onclick = () => { this.tab = id; store.set('mm.tab', id); this.render(); };
      tabs.appendChild(b);
    }
  }

  show(step: Step, donor: DonorId) { this.step = step; this.donor = donor; this.render(); }

  private list(items: string[], ordered = false) {
    const l = el(ordered ? 'ol' : 'ul');
    for (const t of items) l.appendChild(el('li', '', t));
    return l;
  }

  render() {
    document.querySelectorAll<HTMLElement>('#tabs .tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === this.tab)));
    const body = $('tabBody'); body.innerHTML = '';
    const s = this.step; if (!s) return;
    const h = el('h2', '', `${s.number} — ${s.title}`); body.appendChild(h);
    const info = s.info;
    switch (this.tab) {
      case 'how': {
        const note = s.donorNotes?.[this.donor];
        if (note) {
          const box = el('div', 'donor-note');
          box.append(el('strong', '', `${PALETTES[this.donor].name}: `), document.createTextNode(note));
          body.appendChild(box);
        }
        if (info.why) body.appendChild(el('p', 'why', info.why));
        body.appendChild(this.list(info.how, true));
        break;
      }
      case 'parts': body.appendChild(this.list(info.parts)); break;
      case 'tools': body.appendChild(this.list(info.tools)); break;
      case 'specs': body.appendChild(this.list(info.specs)); break;
      case 'safety': { const l = this.list(info.safety); l.className = 'safety'; body.appendChild(l); break; }
      case 'done': {
        const key = `mm.done.${s.id}`;
        const state = store.getJSON<boolean[]>(key, []);
        const ul = el('ul', 'checks');
        info.doneWhen.forEach((t, i) => {
          const li = el('li'); const lab = el('label'); const cb = el('input');
          cb.type = 'checkbox'; cb.checked = !!state[i];
          cb.onchange = () => { state[i] = cb.checked; store.setJSON(key, state); };
          lab.append(cb, document.createTextNode(' ' + t)); li.appendChild(lab); ul.appendChild(li);
        });
        body.appendChild(ul);
        break;
      }
    }
  }
}
