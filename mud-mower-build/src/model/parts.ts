import type { PartDef } from './registry';
import { shopParts } from './builders/shop';
import { demoParts } from './builders/demo';

/** Every part definition, in parent-before-child order. */
export const ALL_PARTS: PartDef[] = [...shopParts, ...demoParts];
