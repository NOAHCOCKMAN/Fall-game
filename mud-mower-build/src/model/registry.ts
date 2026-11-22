import { Box3, Color, Group, Material, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
import type { DonorId } from '../steps/types';
import { GHOST_COLOR, HIGHLIGHT_COLOR, PALETTES, type PaintSlot } from '../scene/materials';

/** A part definition. The object's origin must sit on the part's real pivot (A4). */
export interface PartDef {
  id: string;
  build(): Object3D;
  /** Parent part id. Omitted = attached to the vehicle root. */
  parent?: string;
  /** Local position of the pivot inside the parent. */
  pivot?: [number, number, number];
  defaultState?: 'visible' | 'hidden' | 'ghost';
  /** 'xray' = faded by the X-ray toggle (hood/body/fenders). */
  tags?: string[];
}

export interface Look { opacity: number; ghost: number; glow: number; }

interface MatRec { mat: MeshStandardMaterial; base: Color; baseOpacity: number; baseEmissive: Color; slot?: PaintSlot; }

export interface PartRec {
  id: string;
  def: PartDef;
  obj: Object3D;
  homeParent: Object3D;
  homePos: Vector3; homeQuat: Quaternion; homeScale: Vector3;
  defaultVisible: boolean;
  defaultGhost: number;
  look: Look;
  paint: Color | null;
  mats: MatRec[];
  tags: Set<string>;
}

export interface PartSnap {
  parent: Object3D; pos: Vector3; quat: Quaternion; scale: Vector3; visible: boolean; look: Look; paint: Color | null;
}
export interface ModelSnap { parts: Map<string, PartSnap>; persistCount: number; shelfNext: number; }

const tmpC = new Color();

/** Owns every part, its default ("stock") state, and its current look. */
export class Model {
  readonly root = new Group();       // the vehicle + its props
  readonly shelfRoot = new Group();  // world-space holder for parts in flight / on the shelf / in scrap
  readonly persist = new Group();    // persistent effects (cooled weld beads, drill holes) rebuilt on random access
  readonly parts = new Map<string, PartRec>();
  shelfNext = 0;
  xray = false;
  donor: DonorId = 'jd112';

  constructor(defs: PartDef[]) {
    this.root.name = 'vehicleRoot';
    this.shelfRoot.name = 'shelfRoot';
    this.persist.name = 'persist';
    for (const def of defs) this.add(def);
    this.reset();
  }

  private add(def: PartDef) {
    if (this.parts.has(def.id)) throw new Error(`Duplicate part id ${def.id}`);
    const obj = def.build();
    obj.name = def.id;
    obj.userData.partId = def.id;
    if (def.pivot) obj.position.set(...def.pivot);
    const parent = def.parent ? this.get(def.parent).obj : this.root;
    parent.add(obj);
    const mats: MatRec[] = [];
    obj.traverse(o => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      // A mesh inside a nested part belongs to that part; it's cloned when that part is added.
      if (o !== obj && o.userData.partId && o.userData.partId !== def.id) return;
      m.castShadow = true; m.receiveShadow = true;
      const src = (Array.isArray(m.material) ? m.material[0] : m.material) as Material;
      const mat = (src as MeshStandardMaterial).clone();
      m.material = mat;
      mats.push({
        mat, base: mat.color.clone(), baseOpacity: mat.opacity,
        baseEmissive: mat.emissive.clone(), slot: src.userData.paintSlot,
      });
    });
    const st = def.defaultState ?? 'visible';
    this.parts.set(def.id, {
      id: def.id, def, obj, homeParent: parent,
      homePos: obj.position.clone(), homeQuat: obj.quaternion.clone(), homeScale: obj.scale.clone(),
      defaultVisible: st !== 'hidden', defaultGhost: st === 'ghost' ? 1 : 0,
      look: { opacity: 1, ghost: 0, glow: 0 }, paint: null, mats, tags: new Set(def.tags ?? []),
    });
  }

  has(id: string) { return this.parts.has(id); }
  get(id: string): PartRec {
    const r = this.parts.get(id);
    if (!r) throw new Error(`Unknown part: ${id}`);
    return r;
  }

  /** Back to the stock state (start of step 0.1). */
  reset() {
    for (const r of this.parts.values()) {
      if (r.obj.parent !== r.homeParent) r.homeParent.add(r.obj);
      r.obj.position.copy(r.homePos); r.obj.quaternion.copy(r.homeQuat); r.obj.scale.copy(r.homeScale);
      r.obj.visible = r.defaultVisible;
      r.look = { opacity: 1, ghost: r.defaultGhost, glow: 0 };
      r.paint = null;
      this.applyLook(r);
    }
    this.clearPersist();
    this.shelfNext = 0;
    this.root.updateMatrixWorld(true);
  }

  clearPersist() {
    for (const c of [...this.persist.children]) {
      this.persist.remove(c);
      c.traverse(o => { const m = o as Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as Material).dispose(); } });
    }
  }

  snapshot(): ModelSnap {
    const parts = new Map<string, PartSnap>();
    for (const r of this.parts.values()) {
      parts.set(r.id, {
        parent: r.obj.parent!, pos: r.obj.position.clone(), quat: r.obj.quaternion.clone(), scale: r.obj.scale.clone(),
        visible: r.obj.visible, look: { ...r.look }, paint: r.paint?.clone() ?? null,
      });
    }
    return { parts, persistCount: this.persist.children.length, shelfNext: this.shelfNext };
  }

  restore(s: ModelSnap) {
    for (const [id, p] of s.parts) {
      const r = this.get(id);
      if (r.obj.parent !== p.parent) p.parent.add(r.obj);
      r.obj.position.copy(p.pos); r.obj.quaternion.copy(p.quat); r.obj.scale.copy(p.scale);
      r.obj.visible = p.visible; r.look = { ...p.look }; r.paint = p.paint?.clone() ?? null;
      this.applyLook(r);
    }
    while (this.persist.children.length > s.persistCount) {
      const c = this.persist.children[this.persist.children.length - 1];
      this.persist.remove(c);
    }
    this.shelfNext = s.shelfNext;
    this.root.updateMatrixWorld(true);
  }

  setDonor(d: DonorId) { this.donor = d; this.refreshLooks(); }
  setXray(on: boolean) { this.xray = on; this.refreshLooks(); }
  refreshLooks() { for (const r of this.parts.values()) this.applyLook(r); }

  /** Push look/paint/xray/donor state into the part's materials. */
  applyLook(r: PartRec) {
    const pal = PALETTES[this.donor];
    const xr = this.xray && r.tags.has('xray') ? 0.15 : 1;
    for (const m of r.mats) {
      const base = r.paint && !m.mat.userData.noPaint ? r.paint : m.slot ? tmpC.set(pal[m.slot]) : m.base;
      m.mat.color.copy(base).lerp(GHOST_COLOR, r.look.ghost);
      const op = m.baseOpacity * r.look.opacity * (1 - 0.75 * r.look.ghost) * xr;
      m.mat.opacity = op;
      const transparent = op < 0.999;
      if (m.mat.transparent !== transparent) { m.mat.transparent = transparent; m.mat.needsUpdate = true; }
      m.mat.depthWrite = op > 0.6;
      m.mat.emissive.copy(m.baseEmissive).lerp(HIGHLIGHT_COLOR, r.look.glow * 0.6);
      m.mat.emissiveIntensity = 1;
    }
  }

  /** World-space bounding box of a part (including children). */
  bounds(id: string): Box3 {
    const r = this.get(id);
    r.obj.updateWorldMatrix(true, true);
    return new Box3().setFromObject(r.obj);
  }

  /** Next free shelf slot (deterministic: same order in play and apply). */
  nextShelfSlot(): Vector3 {
    const i = this.shelfNext++;
    // Floor zone: 2 columns x 4 rows at X 95/110, Z 24..66; then a 2-level rack at X 77 (behind, seen from the shelf camera).
    const floor: [number, number][] = [];
    for (const z of [24, 38, 52, 66]) for (const x of [95, 110]) floor.push([x, z]);
    const rack: [number, number, number][] = [];
    for (const y of [21, 41]) for (const z of [26, 40, 54, 66]) rack.push([77, y, z]);
    const n = floor.length + rack.length;
    const k = i % n, layer = Math.floor(i / n);
    if (k < floor.length) return new Vector3(floor[k][0], layer * 8, floor[k][1]);
    const s = rack[k - floor.length];
    return new Vector3(s[0], s[1] + layer * 6, s[2]);
  }
}

export const SCRAP_BIN = new Vector3(75, 0, -30);
