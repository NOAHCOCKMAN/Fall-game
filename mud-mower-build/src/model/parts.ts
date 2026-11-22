import { Model, type PartDef } from './registry';
import { shopParts } from './builders/shop';
import { stockParts } from './builders/stock';
import { lineupParts } from './builders/lineup';
import { frameParts } from './builders/frame';
import { rearParts } from './builders/rear';
import { frontParts } from './builders/frontEnd';
import { steeringParts } from './builders/steering';
import { drivetrainParts } from './builders/drivetrain';
import { cageParts } from './builders/cage';
import { controlParts } from './builders/controls';
import { courseParts } from './builders/course';
import { initLinks } from './rig';

/** Every part definition, in parent-before-child order. */
export const ALL_PARTS: PartDef[] = [
  ...stockParts, ...frameParts, ...rearParts, ...frontParts, ...steeringParts, ...drivetrainParts,
  ...cageParts, ...controlParts, ...shopParts, ...lineupParts, ...courseParts,
];

/** Build the model and wire the front-end links. */
export function createModel() {
  const m = new Model(ALL_PARTS);
  m.root.traverse(o => { if (o.userData.explode) o.userData.home = { p: o.position.clone(), q: o.quaternion.clone() }; });
  initLinks(m);
  m.reset();
  return m;
}
