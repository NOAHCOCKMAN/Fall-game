// Data types from BUILD_SPEC Appendix F.
export type Vec3 = [number, number, number];
export type PhaseId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type DonorId = 'jd112' | 'jd212' | 'fordLT11' | 'fordYT16' | 'sears' | 'murray';

export interface CameraKey { t: number; preset?: string; position?: Vec3; target?: Vec3; dur?: number; }

export interface Callout {
  showAt: number; hideAt?: number;
  anchor: string;                 // anchor name or partId
  title: string; sub?: string;
}

export type Action =
  | { t: number; dur: number; type: 'remove'; part: string; via?: 'lift' | 'slide' | 'drop'; to?: 'shelf' | 'scrap' | string; liftBy?: number }
  | { t: number; dur: number; type: 'install'; part: string; from?: 'above' | 'side' | 'below' | 'front' | 'rear' | 'shelf' | Vec3; ghostFirst?: boolean }
  | { t: number; dur: number; type: 'bolt'; fasteners: string[]; dir: 'out' | 'in'; torqueLabel?: string }
  | { t: number; dur: number; type: 'weld'; seam: string; tack?: boolean; stitch?: [number, number] }  // stitch: [length, pitch] (extension)
  | { t: number; dur: number; type: 'grindCut'; cut: string; dropPart?: string }
  | { t: number; dur: number; type: 'grind' | 'wireWheel'; target: string }
  | { t: number; dur: number; type: 'drill'; anchor: string; dia: number }
  | { t: number; dur: number; type: 'measure'; a: string; b?: string; label: string; keep?: boolean }   // b omitted: a is a 2-point anchor
  | { t: number; dur: number; type: 'laser'; a: string; b: string }
  | { t: number; dur: number; type: 'angleGauge'; anchor: string; deg: number; label: string }
  | { t: number; dur: number; type: 'paint'; parts: string[]; color: string }
  | { t: number; dur: number; type: 'explode' | 'collapse'; group: string; factor?: number }
  | { t: number; dur: number; type: 'cycleSuspension'; bumpIn: number; articulationDeg: number; cycles: number }
  | { t: number; dur: number; type: 'steerSweep'; innerMaxDeg: number; cycles: number }
  | { t: number; dur: number; type: 'cvtShift'; from: number; to: number }
  | { t: number; dur: number; type: 'spin'; parts: string[]; rpm: number }
  | { t: number; dur: number; type: 'fluid'; part: string; mode: 'drain' | 'fill'; color: string }
  | { t: number; dur: number; type: 'mud'; at: string; amount: number }
  | { t: number; dur: number; type: 'drive'; path: string; speed: number }
  | { t: number; dur: number; type: 'highlight' | 'ghost' | 'show' | 'hide'; part: string; color?: string }  // color: highlight tint (extension)
  | { t: number; dur: number; type: 'note'; text: string }
  | { t: number; dur: number; type: 'lighting'; mode: 'normal' | 'dusk' }
  // ---- implementation extensions (not in Appendix F; needed to script Part E literally) ----
  | { t: number; dur: number; type: 'move'; part: string; by?: Vec3; to?: string }          // translate (parent space) or to an anchor
  | { t: number; dur: number; type: 'rotate'; part: string; axis: 'x' | 'y' | 'z'; deg: number } // about the part's pivot
  | { t: number; dur: number; type: 'trace'; path: string; color?: string; radius?: number; keep?: boolean } // line draws itself
  | { t: number; dur: number; type: 'mist'; at: string; label?: string }                      // spray puffs at each anchor point
  | { t: number; dur: number; type: 'xray' }                                                 // body X-ray during [t, t+dur]
  | { t: number; dur: number; type: 'wrap'; part: string; color: string | null }             // moving blanket on / off
  | { t: number; dur: number; type: 'donorLineup' };                                         // 0.1 turntable lineup

export type ActionType = Action['type'];

export interface StepInfo {
  why?: string;
  how: string[];        // numbered instructions
  parts: string[];
  tools: string[];
  specs: string[];
  safety: string[];
  doneWhen: string[];
}

export interface Step {
  id: string;           // e.g. 'fe-knuckles'
  number: string;       // e.g. '4.2'
  phase: PhaseId;
  title: string;
  summary: string;      // one line for the step list
  durationSec: number;
  optional?: boolean;
  explodable?: string;  // group id enabled for the Exploded toggle
  camera: CameraKey[];
  actions: Action[];
  callouts: Callout[];
  info: StepInfo;
  donorNotes?: Partial<Record<DonorId, string>>;
}

export const PHASE_NAMES: Record<PhaseId, string> = {
  0: 'Plan', 1: 'Teardown', 2: 'Frame', 3: 'Rear End', 4: 'Front End',
  5: 'Engine & Drivetrain', 6: 'Cage & Body', 7: 'Brakes & Controls', 8: 'Electrical', 9: 'Finish',
};
