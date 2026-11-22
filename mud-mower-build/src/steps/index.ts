import type { Step } from './types';
import { phase0 } from './data/phase0';
import { phase1 } from './data/phase1';
import { phase2 } from './data/phase2';
import { phase3 } from './data/phase3';
import { phase4 } from './data/phase4';
import { phase5 } from './data/phase5';
import { phase6 } from './data/phase6';
import { phase7, phase8, phase9 } from './data/phase7to9';

export const STEPS: Step[] = [...phase0, ...phase1, ...phase2, ...phase3, ...phase4, ...phase5, ...phase6, ...phase7, ...phase8, ...phase9];
