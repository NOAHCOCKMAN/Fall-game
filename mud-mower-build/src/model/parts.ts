import type { PartDef } from './registry';
import { shopParts } from './builders/shop';
import { stockParts } from './builders/stock';
import { lineupParts } from './builders/lineup';

/** Every part definition, in parent-before-child order. */
export const ALL_PARTS: PartDef[] = [...stockParts, ...shopParts, ...lineupParts];
