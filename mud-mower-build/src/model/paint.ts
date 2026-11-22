import { PALETTES } from '../scene/materials';
import type { Model } from './registry';

export const PAINT_PRESETS = [
  { id: 'factory', label: 'Factory colors' },
  { id: 'blackHood', label: 'Gloss black + factory hood' },
  { id: 'satin', label: 'Satin black everything' },
] as const;

/** Resolve 'preset.chassis' / 'preset.body' / 'preset.hood' / 'preset.wheel' against the paint preset + donor. */
export function resolvePaint(m: Model, color: string): string {
  if (!color.startsWith('preset.')) return color;
  const pal = PALETTES[m.donor], p = m.paintPreset, slot = color.slice(7);
  const satin = '#222324', gloss = '#0f1011';
  if (slot === 'chassis') return p === 'blackHood' ? gloss : satin;
  if (slot === 'body') return p === 'factory' ? pal.body : p === 'blackHood' ? gloss : satin;
  if (slot === 'hood') return p === 'satin' ? satin : pal.body;
  if (slot === 'wheel') return p === 'factory' ? pal.wheel : p === 'blackHood' ? gloss : satin;
  if (slot === 'accent') return p === 'factory' ? pal.accent : p === 'blackHood' ? pal.accent : satin;
  return color;
}
