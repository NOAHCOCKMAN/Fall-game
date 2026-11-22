import { Box3, Color, Group, Material, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
import type { DonorId } from '../steps/types';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GHOST_COLOR, HIGHLIGHT_COLOR, PALETTES, type PaintSlot } from '../scene/materials';
import { anchorDef, anchorLocal, centerOf } from './anchors';

/** A part definition. The object's origin must sit on the part's real pivot (A4). */
export interface PartDef {
  id: string;
  build(): Object3D;
  /** Parent part id. Omitted = the shop root. Tractor parts use 'vehicle'. */
  parent?: string;
  /** Local position of the pivot inside the parent. */
  pivot?: [number, number, number];
  defaultState?: 'visible' | 'hidden' | 'ghost';
  /** 'xray' = faded by the X-ray toggle (hood/body/fenders). 'prop' = shop prop. */
  tags?: string[];
}

export interface Look { opacity: number; ghost: number; glow: number; glowColor?: string; }

interface MatRec { mat: MeshStandardMaterial; base: Color; baseOpacity: number; baseEmissive: Color; slot?: PaintSlot; weathered: boolean; }

export interface PartRec {
  id: string;
  def: PartDef;
  obj: Object3D;
  homeParent: Object3D;
  homePos: Vector3; homeQuat: Quaternion; homeScale: Vector3;
  defaultVisible: boolean;
  defaultGhost: number;
  look: Look;
  paint: Color | null;   // new paint / cleaned metal (overrides donor colors + weathering)
  wrap: Color | null;    // temporary cover (moving blanket)
  mats: MatRec[];
  tags: Set<string>;
}

export interface PartSnap {
  parent: Object3D; pos: Vector3; quat: Quaternion; scale: Vector3; visible: boolean; look: Look; paint: Color | null; wrap: Color | null;
}
export interface ModelSnap { parts: Map<string, PartSnap>; persistCount: number; shelfNext: number; world: WorldState; }

/** Scene-wide state that steps change (persisted through random access like part state). */
export type EnvMode = 'normal' | 'dusk' | 'grass' | 'outdoor';
export interface WorldState { mud: number; env: EnvMode; envFrom?: EnvMode; envK: number; lights: number; }
export type PaintPreset = 'factory' | 'blackHood' | 'satin';
const MUD = new Color('#4a3520');

const tmpC = new Color();
const RUST = new Color('#6b4630');

/** Owns every part, its default ("stock") state, and its current look. */
export class Model {
  readonly root = new Group();       // shop props + the 'vehicle' part
  readonly shelfRoot = new Group();  // world-space holder for parts in flight / on the shelf / in scrap
  readonly parts = new Map<string, PartRec>();
  /** Persistent effects (cooled weld beads, drill holes, traced lines) attached to parts; rebuilt on random access. */
  private persistList: Object3D[] = [];
  /** Hooks run after reset()/restore() (e.g. re-shaping suspension links). */
  readonly onReset: Array<() => void> = [];
  shelfNext = 0;
  xray = false;
  forceXray = false;
  donor: DonorId = 'jd112';
  paintPreset: PaintPreset = 'factory';
  world: WorldState = { mud: 0, env: 'normal', envK: 1, lights: 0 };
  /** Current front-end pose (bump / articulation / steering), combined by concurrent actions. */
  pose = { bump: 0, rollDeg: 0, steerDeg: 0 };

  constructor(defs: PartDef[]) {
    this.root.name = 'shopRoot';
    this.shelfRoot.name = 'shelfRoot';
    for (const def of defs) this.add(def);
    this.reset();
  }

  private add(def: PartDef) {
    if (this.parts.has(def.id)) throw new Error(`Duplicate part id ${def.id}`);
    const obj = def.build();
    mergeStatic(obj);
    obj.name = def.id;
    obj.userData.partId = def.id;
    if (def.pivot) obj.position.set(...def.pivot);
    const parent = def.parent ? this.get(def.parent).obj : this.root;
    parent.add(obj);
    const mats: MatRec[] = [];
    obj.traverse(o => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = !o.userData.noShadow; m.receiveShadow = true;
      const src = (Array.isArray(m.material) ? m.material[0] : m.material) as Material;
      const mat = (src as MeshStandardMaterial).clone();
      m.material = mat;
      mats.push({
        mat, base: mat.color.clone(), baseOpacity: mat.opacity,
        baseEmissive: mat.emissive.clone(), slot: src.userData.paintSlot, weathered: !!src.userData.weathered,
      });
    });
    const st = def.defaultState ?? 'visible';
    this.parts.set(def.id, {
      id: def.id, def, obj, homeParent: parent,
      homePos: obj.position.clone(), homeQuat: obj.quaternion.clone(), homeScale: obj.scale.clone(),
      defaultVisible: st !== 'hidden', defaultGhost: st === 'ghost' ? 1 : 0,
      look: { opacity: 1, ghost: 0, glow: 0 }, paint: null, wrap: null, mats, tags: new Set(def.tags ?? []),
    });
  }

  has(id: string) { return this.parts.has(id); }
  get(id: string): PartRec {
    const r = this.parts.get(id);
    if (!r) throw new Error(`Unknown part: ${id}`);
    return r;
  }
  get vehicle() { return this.get('vehicle').obj; }

  /** Back to the stock state (start of step 0.1). */
  reset() {
    for (const r of this.parts.values()) {
      if (r.obj.parent !== r.homeParent) r.homeParent.add(r.obj);
      r.obj.position.copy(r.homePos); r.obj.quaternion.copy(r.homeQuat); r.obj.scale.copy(r.homeScale);
      r.obj.visible = r.defaultVisible;
      r.look = { opacity: 1, ghost: r.defaultGhost, glow: 0 };
      r.paint = null; r.wrap = null;
    }
    this.forceXray = false;
    this.world = { mud: 0, env: 'normal', envK: 1, lights: 0 };
    this.pose = { bump: 0, rollDeg: 0, steerDeg: 0 };
    this.clearPersist();
    this.shelfNext = 0;
    this.applyDonorShapes();
    this.resetChildren();
    this.refreshLooks();
    this.root.updateMatrixWorld(true);
    this.onReset.forEach(f => f());
  }

  /** Children moved by explode / oscillate (not parts) go back to their build-time pose. */
  resetChildren() {
    this.root.traverse(o => {
      const h = o.userData.home as { p: Vector3; q: Quaternion } | undefined;
      if (h) { o.position.copy(h.p); o.quaternion.copy(h.q); }
    });
  }

  addPersist(obj: Object3D, parent: Object3D) { parent.add(obj); this.persistList.push(obj); }

  private dropPersist(o: Object3D) {
    o.removeFromParent();
    o.traverse(c => { const m = c as Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as Material).dispose(); } });
  }
  clearPersist() { this.persistList.forEach(o => this.dropPersist(o)); this.persistList = []; }

  snapshot(): ModelSnap {
    const parts = new Map<string, PartSnap>();
    for (const r of this.parts.values()) {
      parts.set(r.id, {
        parent: r.obj.parent!, pos: r.obj.position.clone(), quat: r.obj.quaternion.clone(), scale: r.obj.scale.clone(),
        visible: r.obj.visible, look: { ...r.look }, paint: r.paint?.clone() ?? null, wrap: r.wrap?.clone() ?? null,
      });
    }
    return { parts, persistCount: this.persistList.length, shelfNext: this.shelfNext, world: { ...this.world } };
  }

  restore(s: ModelSnap) {
    for (const [id, p] of s.parts) {
      const r = this.get(id);
      if (r.obj.parent !== p.parent) p.parent.add(r.obj);
      r.obj.position.copy(p.pos); r.obj.quaternion.copy(p.quat); r.obj.scale.copy(p.scale);
      r.obj.visible = p.visible; r.look = { ...p.look };
      r.paint = p.paint?.clone() ?? null; r.wrap = p.wrap?.clone() ?? null;
      this.applyLook(r);
    }
    while (this.persistList.length > s.persistCount) this.dropPersist(this.persistList.pop()!);
    this.shelfNext = s.shelfNext;
    this.world = { ...s.world };
    this.pose = { bump: 0, rollDeg: 0, steerDeg: 0 };
    this.root.updateMatrixWorld(true);
    this.onReset.forEach(f => f());
  }

  setMud(k: number) { if (Math.abs(this.world.mud - k) > 1e-4) { this.world.mud = k; for (const id of MUDDY) if (this.has(id)) this.applyLook(this.get(id)); } }

  setDonor(d: DonorId) { this.donor = d; this.applyDonorShapes(); this.refreshLooks(); }
  setXray(on: boolean) { this.xray = on; this.refreshLooks(); }
  setForceXray(on: boolean) { if (this.forceXray !== on) { this.forceXray = on; this.refreshLooks(); } }
  refreshLooks() { for (const r of this.parts.values()) this.applyLook(r); }

  /** Rounded vs squared hood/grille silhouettes (A9). */
  private applyDonorShapes() {
    const shape = PALETTES[this.donor].hood;
    this.root.traverse(o => { if (o.userData.donorShape) o.visible = o.userData.donorShape === shape; });
  }

  /** Push look/paint/xray/donor state into the part's materials. */
  applyLook(r: PartRec) {
    const pal = PALETTES[this.donor];
    const xr = (this.xray || this.forceXray) && r.tags.has('xray') ? 0.15 : 1;
    for (const m of r.mats) {
      const noPaint = !!m.mat.userData.noPaint;
      if (r.wrap && !noPaint) tmpC.copy(r.wrap);
      else if (r.paint && !noPaint) tmpC.copy(r.paint);
      else {
        tmpC.copy(m.slot ? tmpC.set(pal[m.slot]) : m.base);
        if (m.weathered) tmpC.multiplyScalar(0.84).lerp(RUST, 0.1);
      }
      if (this.world.mud > 0 && MUDDY.has(r.id) && !m.mat.userData.noMud) tmpC.lerp(MUD, Math.min(0.75, this.world.mud * 0.75));
      m.mat.color.copy(tmpC).lerp(GHOST_COLOR, r.look.ghost);
      const op = m.baseOpacity * r.look.opacity * (1 - 0.75 * r.look.ghost) * xr;
      m.mat.opacity = op;
      const transparent = op < 0.999;
      if (m.mat.transparent !== transparent) { m.mat.transparent = transparent; m.mat.needsUpdate = true; }
      m.mat.depthWrite = op > 0.6;
      m.mat.emissive.copy(m.baseEmissive).lerp(r.look.glowColor ? tmpC.set(r.look.glowColor) : HIGHLIGHT_COLOR, r.look.glow * 0.6);
    }
  }

  /** World-space bounding box of a part (visible meshes only, including children). */
  bounds(id: string): Box3 {
    const r = this.get(id);
    r.obj.updateWorldMatrix(true, true);
    const b = new Box3();
    r.obj.traverse(o => {
      const m = o as Mesh;
      if (!m.isMesh || o.userData.noBounds) return;
      let vis = true; for (let p: Object3D | null = o; p && p !== r.obj; p = p.parent) if (!p.visible) vis = false;
      if (!vis) return;
      m.geometry.computeBoundingBox();
      b.union(m.geometry.boundingBox!.clone().applyMatrix4(m.matrixWorld));
    });
    if (b.isEmpty()) r.obj.getWorldPosition(b.min), b.max.copy(b.min);
    return b;
  }

  /** The object an anchor's coordinates live in. */
  anchorSpace(name: string): Object3D {
    const sp = anchorDef(name).space ?? 'vehicle';
    return sp === 'world' ? this.shelfRoot : this.get(sp).obj;
  }
  /** Anchor points in world space, using the current transform of the anchor's space. */
  anchorWorld(name: string): Vector3[] {
    const sp = this.anchorSpace(name);
    sp.updateWorldMatrix(true, false);
    return anchorLocal(name).map(p => p.applyMatrix4(sp.matrixWorld));
  }
  anchorWorldCenter(name: string) { return centerOf(this.anchorWorld(name)); }
  /** Approach normal of an anchor, in world space. */
  anchorNormal(name: string): Vector3 {
    const n = anchorDef(name).normal ?? [0, 1, 0];
    const sp = this.anchorSpace(name);
    const q = new Quaternion(); sp.getWorldQuaternion(q);
    return new Vector3(...n).applyQuaternion(q).normalize();
  }

  /** Next free shelf slot (deterministic: same order in play and apply). */
  nextShelfSlot(): Vector3 {
    const i = this.shelfNext++;
    // Floor zone: 3 columns x 4 rows at X 92..124, Z 20..68; then a 2-level rack at X 77 (behind, seen from the shelf camera).
    const floor: [number, number][] = [];
    for (const z of [20, 36, 52, 68]) for (const x of [92, 108, 124]) floor.push([x, z]);
    const rack: [number, number, number][] = [];
    for (const y of [21, 41]) for (const z of [26, 40, 54, 66]) rack.push([77, y, z]);
    const n = floor.length + rack.length;
    const k = i % n, layer = Math.floor(i / n);
    if (k < floor.length) return new Vector3(floor[k][0], layer * 8, floor[k][1]);
    const s = rack[k - floor.length];
    return new Vector3(s[0], s[1] + layer * 6, s[2]);
  }
}

/**
 * Draw-call budget: merge a part's static meshes that share a material into one mesh.
 * Anything under a named object (explode pieces, rig handles, markers), a donor-shape variant, or an InstancedMesh stays as is.
 */
export function mergeStatic(root: Object3D) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const groups = new Map<string, { mat: MeshStandardMaterial; meshes: Mesh[] }>();
  root.traverse(o => {
    const m = o as Mesh;
    if (!m.isMesh || (m as unknown as { isInstancedMesh?: boolean }).isInstancedMesh || o === root) return;
    for (let p: Object3D | null = o; p && p !== root; p = p.parent) if (p.name || p.userData.explode || p.userData.donorShape || p.userData.noMerge) return;
    const mat = m.material as MeshStandardMaterial;
    if (Array.isArray(m.material)) return;
    const key = [mat.type, mat.color?.getHexString(), mat.roughness, mat.metalness, mat.opacity, mat.side, mat.transparent, mat.emissive?.getHexString(), mat.map?.uuid ?? '', JSON.stringify(mat.userData)].join('|');
    const g = groups.get(key) ?? { mat, meshes: [] };
    g.meshes.push(m); groups.set(key, g);
  });
  for (const { mat, meshes } of groups.values()) {
    if (meshes.length < 2) continue;
    const geos = meshes.map(m => {
      let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
      if (!g.attributes.uv) g = g; // all primitives used here carry uvs
      return g.applyMatrix4(inv.clone().multiply(m.matrixWorld));
    });
    let merged;
    try { merged = mergeGeometries(geos, false); } catch { merged = null; }
    if (!merged) continue;
    meshes.forEach(m => m.removeFromParent());
    const mm = new Mesh(merged, mat);
    mm.userData.merged = true;
    root.add(mm);
  }
}

export const SCRAP_BIN = new Vector3(75, 0, -30);

/** Parts that get mud on them in the finale. */
const MUDDY = new Set(['wheelRearL', 'wheelRearR', 'wheelFrontL', 'wheelFrontR', 'frameRailL', 'frameRailR', 'boxPlateL', 'boxPlateR', 'skidPlate',
  'bumperFront', 'axleBeam', 'wishbone', 'floorboardL', 'floorboardR', 'fenderFlareL', 'fenderFlareR', 'hubRearL', 'hubRearR', 'transaxle2300', 'panhard', 'tieRod', 'dragLink']);
