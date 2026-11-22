// npm run validate — static checks on the step data + an apply() pass for every step prefix (A10).
import { createModel } from '../src/model/parts';
import { hasAnchor } from '../src/model/anchors';
import { STEPS } from '../src/steps';
import { applyStep } from '../src/engine/stepEngine';
import { HANDLERS, anchorsOf, partsOf } from '../src/engine/actions';
import { CAMERA_PRESETS } from '../src/scene/cameras';
import { setFrontPose } from '../src/model/rig';
import { Mesh, Vector3 } from 'three';

const errors: string[] = [];
const warns: string[] = [];
const model = createModel();
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
    if ((a.type === 'grind' || a.type === 'wireWheel') && !model.has(a.target) && !hasAnchor(a.target)) errors.push(`${where} ${a.type}: unknown part/anchor '${a.target}'`);
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
// Ackermann sweep: at full lock both ways (+ flex both ways) no front tire vertex may enter the frame rails' boxes.
if (!errors.length) {
  const i47 = STEPS.findIndex(s => s.number === '4.7');
  model.reset();
  for (let j = 0; j <= i47; j++) applyStep(STEPS[j], model);
  const lock = Math.max(...STEPS[i47].actions.filter(a => a.type === 'steerSweep').map(a => (a as { innerMaxDeg: number }).innerMaxDeg));
  const frame = ['frameRailL', 'frameRailR', 'boxPlateL', 'boxPlateR', 'frontClip'].map(id => model.bounds(id));
  const v = new Vector3();
  let worst = Infinity;
  for (const steer of [lock, -lock]) for (const roll of [-14, 0, 14]) {
    setFrontPose(model, { bump: 0, rollDeg: roll, steerDeg: steer });
    model.root.updateMatrixWorld(true);
    for (const id of ['wheelFrontL', 'wheelFrontR']) {
      model.get(id).obj.traverse(o => {
        const mesh = o as Mesh; if (!mesh.isMesh || (mesh as unknown as { isInstancedMesh?: boolean }).isInstancedMesh) return;
        const pos = mesh.geometry.attributes.position;
        for (let k = 0; k < pos.count; k += 3) {
          v.fromBufferAttribute(pos, k).applyMatrix4(mesh.matrixWorld);
          for (const b of frame) if (b.containsPoint(v)) errors.push(`Ackermann sweep: ${id} hits the frame at steer ${steer}°, roll ${roll}°`);
          for (const b of frame) worst = Math.min(worst, b.distanceToPoint(v));
        }
      });
    }
  }
  setFrontPose(model, { bump: 0, rollDeg: 0, steerDeg: 0 });
  console.log(`Ackermann sweep ±${lock}° with ±14° flex: closest tire-to-frame gap ${worst.toFixed(2)} in`);
}

for (const w of [...new Set(warns)]) console.warn('warn:', w);
if (errors.length) { for (const e of [...new Set(errors)].slice(0, 40)) console.error('ERROR:', e); console.error(`\n${errors.length} error(s)`); process.exit(1); }
console.log(`OK — ${STEPS.length} steps, ${model.parts.size} parts validated.`);
