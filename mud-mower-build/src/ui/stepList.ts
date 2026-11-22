import { PHASE_NAMES, type PhaseId, type Step } from '../steps/types';
import { $, el } from './dom';
import { store } from './store';

const KEY = 'mm.completed';

export class StepList {
  private items: HTMLElement[] = [];
  private completed = new Set<string>(store.getJSON<string[]>(KEY, []));

  constructor(private steps: Step[], onPick: (i: number) => void) {
    const nav = $('stepList');
    const phases = [...new Set(steps.map(s => s.phase))] as PhaseId[];
    for (const ph of phases) {
      const det = el('details', 'phase'); det.open = true;
      const sum = el('summary', '', `${ph} · ${PHASE_NAMES[ph]}`);
      det.appendChild(sum);
      const ol = el('ol');
      steps.forEach((s, i) => {
        if (s.phase !== ph) return;
        const li = el('li');
        const b = el('button', 'step-item');
        b.innerHTML = '';
        b.append(el('span', 'num', s.number), el('span', 'ttl', s.title));
        if (s.optional) b.append(el('span', 'opt', 'OPTIONAL'));
        b.append(el('span', 'chk', '✓'));
        b.title = s.summary;
        b.onclick = () => onPick(i);
        li.appendChild(b); ol.appendChild(li);
        this.items[i] = b;
      });
      det.appendChild(ol); nav.appendChild(det);
    }
    this.refresh(-1);
  }

  markDone(id: string) { this.completed.add(id); store.setJSON(KEY, [...this.completed]); }

  refresh(current: number) {
    this.items.forEach((b, i) => {
      b.classList.toggle('current', i === current);
      b.classList.toggle('done', this.completed.has(this.steps[i].id));
      if (i === current) {
        (b.closest('details') as HTMLDetailsElement).open = true;
        b.scrollIntoView({ block: 'nearest' });
      }
    });
  }
}
