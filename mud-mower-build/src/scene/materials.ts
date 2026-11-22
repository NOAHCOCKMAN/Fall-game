import { Color, MeshStandardMaterial } from 'three';
import type { DonorId } from '../steps/types';

export type PaintSlot = 'body' | 'accent' | 'wheel' | 'seat';

export interface Palette {
  name: string; body: string; accent: string; wheel: string; seat: string; seatPan: string;
  hood: 'rounded' | 'squared';
}

// A8/A9: approximate donor palettes. No logos or trademark art anywhere — names are plain UI text.
export const PALETTES: Record<DonorId, Palette> = {
  jd112:    { name: 'JD 112-style',               body: '#367C2B', accent: '#F2C500', wheel: '#F2C500', seat: '#F2C500', seatPan: '#1b1b1b', hood: 'rounded' },
  jd212:    { name: 'JD 212-style',               body: '#367C2B', accent: '#F2C500', wheel: '#F2C500', seat: '#F2C500', seatPan: '#1b1b1b', hood: 'squared' },
  fordLT11: { name: 'Ford LT-11-style',           body: '#2F5DA8', accent: '#ECEBE4', wheel: '#C9CBCF', seat: '#1E1E1E', seatPan: '#1E1E1E', hood: 'squared' },
  fordYT16: { name: 'Ford YT-16-style',           body: '#2F5DA8', accent: '#ECEBE4', wheel: '#C9CBCF', seat: '#1E1E1E', seatPan: '#1E1E1E', hood: 'squared' },
  sears:    { name: 'Sears garden-tractor-style', body: '#B3261E', accent: '#1E1E1E', wheel: '#ECEBE4', seat: '#1E1E1E', seatPan: '#1E1E1E', hood: 'squared' },
  murray:   { name: 'Murray-style',               body: '#C0392B', accent: '#B8BCC2', wheel: '#8E9297', seat: '#1E1E1E', seatPan: '#1E1E1E', hood: 'rounded' },
};
export const DONOR_IDS = Object.keys(PALETTES) as DonorId[];

/** Material that takes its color from the active donor palette. */
export function painted(slot: PaintSlot, opts: { roughness?: number; metalness?: number } = {}) {
  const m = new MeshStandardMaterial({ color: '#888', roughness: opts.roughness ?? 0.55, metalness: opts.metalness ?? 0.2 });
  m.userData.paintSlot = slot;
  return m;
}

export const mats = {
  rawSteel: () => new MeshStandardMaterial({ color: '#8a8d90', metalness: 0.6, roughness: 0.45 }),
  oldSteel: () => new MeshStandardMaterial({ color: '#5d5048', metalness: 0.35, roughness: 0.8 }),
  rubber: () => new MeshStandardMaterial({ color: '#1c1c1c', metalness: 0, roughness: 0.92 }),
  zinc: () => new MeshStandardMaterial({ color: '#c9ccc4', metalness: 0.8, roughness: 0.35 }),
  bronze: () => new MeshStandardMaterial({ color: '#b07a3c', metalness: 0.8, roughness: 0.35 }),
  aluminum: () => new MeshStandardMaterial({ color: '#c3c6ca', metalness: 0.75, roughness: 0.3 }),
  black: () => new MeshStandardMaterial({ color: '#202020', metalness: 0.2, roughness: 0.6 }),
  wood: () => new MeshStandardMaterial({ color: '#9a7650', metalness: 0, roughness: 0.85 }),
  cardboard: () => new MeshStandardMaterial({ color: '#b99566', metalness: 0, roughness: 0.95 }),
  red: () => new MeshStandardMaterial({ color: '#b5281f', metalness: 0.3, roughness: 0.5 }),
  toolRed: () => new MeshStandardMaterial({ color: '#a82a20', metalness: 0.4, roughness: 0.45 }),
};

export const GHOST_COLOR = new Color('#9fd3ff');
export const HIGHLIGHT_COLOR = new Color('#ffb020');
