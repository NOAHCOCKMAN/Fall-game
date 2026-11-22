import type { Step } from './types';
import { phase0 } from './data/phase0';
import { phase1 } from './data/phase1';
import { phase2 } from './data/phase2';

export const STEPS: Step[] = [...phase0, ...phase1, ...phase2];
