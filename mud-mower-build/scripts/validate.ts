// npm run validate — static checks on the step data + an apply() pass for every step prefix (A10).
import { Model } from '../src/model/registry';
import { ALL_PARTS } from '../src/model/parts';
import { hasAnchor } from '../src/model/anchors';
import { STEPS } from '../src/steps';
import { applyStep } from '../src/engine/stepEngine';
import { HANDLERS, anchorsOf, partsOf } from '../src/engine/actions';
import { CAMERA_PRESETS } from '../src/scene/cameras';

const errors: string[] = [];
const warns: string[] = [];
const model = new Model(ALL_PARTS);
const ids = new Set<string>();

for (const s of STEPS) {
  const where = `[${s.number} ${s.id}]`;
  if (ids.has(s.id)) errors.push(`${where} duplicate step id`);
  ids.add(s.id);
  const i = s.info;
  for (const [k, v] of Object.entries({ how: i.how, parts: i.parts, tools: i.tools, safety: i.safety, doneWhen: i.doneWhen }))
    if (!v || !v.length || v.every(x => !x.trim())) errors.push(`${where} empty info.${k}`);
  for (const a of s.actions) {
    if (a.t + a.dur > s.durationSec + 1e-6) errors.push(`${where} ${a.type}@${a.t} ends at ${a.t + a.dur} > ${s.durationSec}s`);
    if (!HANDLERS[a.type]) warns.push(`${where} action '${a.type}' not implemented yet`);
    for (const p of partsOf(a)) if (!model.has(p)) errors.push(`${where} ${a.type}: unknown part '${p}'`);
    for (const n of anchorsOf(a)) if (!hasAnchor(n) && !model.has(n)) errors.push(`${where} ${a.type}: unknown anchor '${n}'`);
  }
  for (const c of s.callouts) {
    if (!hasAnchor(c.anchor) && !model.has(c.anchor)) errors.push(`${where} callout '${c.title}': unknown anchor '${c.anchor}'`);
    if (c.showAt > s.durationSec || (c.hideAt ?? 0) > s.durationSec) errors.push(`${where} callout '${c.title}' outside the step`);
  }
  for (const k of s.camera) {
    if (k.preset && !CAMERA_PRESETS[k.preset]) errors.push(`${where} unknown camera preset '${k.preset}'`);
    if (!k.preset && !(k.position && k.target)) errors.push(`${where} camera key at ${k.t} needs a preset or position+target`);
    if (k.t + (k.dur ?? 1.2) > s.durationSec + 1e-6) errors.push(`${where} camera key at ${k.t} runs past the step`);
  }
}

// Apply steps 0..N in sequence for every N: must never throw.
if (!errors.length) {
  for (let n = 0; n < STEPS.length; n++) {
    model.reset();
    try { for (let j = 0; j <= n; j++) applyStep(STEPS[j], model); }
    catch (e) { errors.push(`apply 0..${STEPS[n].number} threw: ${(e as Error).message}`); break; }
  }
}
// TODO(Noah): M4 adds the Ackermann sweep tire-vs-frame bounding-box check here.

for (const w of [...new Set(warns)]) console.warn('warn:', w);
if (errors.length) { for (const e of errors) console.error('ERROR:', e); console.error(`\n${errors.length} error(s)`); process.exit(1); }
console.log(`OK — ${STEPS.length} steps, ${model.parts.size} parts validated.`);
