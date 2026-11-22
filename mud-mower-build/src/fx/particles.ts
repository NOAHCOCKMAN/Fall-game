import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, NormalBlending, Points, PointsMaterial, Vector3,
} from 'three';

export interface EmitOpts {
  at: Vector3; count: number;
  dir?: Vector3; spread?: number; speed?: [number, number];
  life?: [number, number]; gravity?: number; bounce?: boolean;
  colorA?: string; colorB?: string;
}

function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return new CanvasTexture(c);
}

/** Pooled particle system (sparks / dust / mud / mist). Max `cap` live particles. */
export class Particles {
  readonly points: Points;
  private pos: Float32Array; private col: Float32Array;
  private vel: Float32Array; private life: Float32Array; private maxLife: Float32Array;
  private grav: Float32Array; private bounce: Uint8Array;
  private cA: Float32Array; private cB: Float32Array;
  private next = 0;
  private live = 0;

  constructor(public cap = 2000, private additive = true, size = 0.7) {
    const g = new BufferGeometry();
    this.pos = new Float32Array(cap * 3).fill(-9999);
    this.col = new Float32Array(cap * 3);
    g.setAttribute('position', new BufferAttribute(this.pos, 3));
    g.setAttribute('color', new BufferAttribute(this.col, 3));
    this.vel = new Float32Array(cap * 3); this.life = new Float32Array(cap); this.maxLife = new Float32Array(cap).fill(1);
    this.grav = new Float32Array(cap); this.bounce = new Uint8Array(cap);
    this.cA = new Float32Array(cap * 3); this.cB = new Float32Array(cap * 3);
    const m = new PointsMaterial({
      size, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false,
      blending: additive ? AdditiveBlending : NormalBlending, sizeAttenuation: true,
    });
    this.points = new Points(g, m);
    this.points.frustumCulled = false;
  }

  emit(o: EmitOpts) {
    const ca = new Color(o.colorA ?? '#fff6d0'), cb = new Color(o.colorB ?? '#ff7a10');
    const dir = o.dir ?? new Vector3(0, 1, 0), spread = o.spread ?? 1;
    const [s0, s1] = o.speed ?? [20, 60]; const [l0, l1] = o.life ?? [0.3, 0.8];
    for (let n = 0; n < o.count; n++) {
      const i = this.next; this.next = (this.next + 1) % this.cap;
      const v = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(2 * spread).add(dir).normalize()
        .multiplyScalar(s0 + Math.random() * (s1 - s0));
      this.pos.set([o.at.x, o.at.y, o.at.z], i * 3);
      this.vel.set([v.x, v.y, v.z], i * 3);
      this.life[i] = this.maxLife[i] = l0 + Math.random() * (l1 - l0);
      this.grav[i] = o.gravity ?? 386; this.bounce[i] = o.bounce === false ? 0 : 1;
      this.cA.set([ca.r, ca.g, ca.b], i * 3); this.cB.set([cb.r, cb.g, cb.b], i * 3);
    }
    this.live = this.cap;
  }

  clear() { this.life.fill(0); this.pos.fill(-9999); this.live = 0; this.flag(); }

  update(dt: number) {
    if (!this.live) return;
    let any = 0;
    for (let i = 0; i < this.cap; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const k = i * 3;
      if (this.life[i] <= 0) { this.pos[k + 1] = -9999; continue; }
      any++;
      this.vel[k + 1] -= this.grav[i] * dt;
      this.pos[k] += this.vel[k] * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
      if (this.pos[k + 1] < 0.1 && this.vel[k + 1] < 0) {
        this.pos[k + 1] = 0.1;
        if (this.bounce[i]) { this.vel[k + 1] *= -0.35; this.vel[k] *= 0.6; this.vel[k + 2] *= 0.6; this.bounce[i] = 0; }
        else { this.vel[k] = this.vel[k + 1] = this.vel[k + 2] = 0; }
      }
      const f = 1 - this.life[i] / this.maxLife[i]; const fade = this.additive ? 1 - f * f : 1;
      this.col[k] = (this.cA[k] + (this.cB[k] - this.cA[k]) * f) * fade;
      this.col[k + 1] = (this.cA[k + 1] + (this.cB[k + 1] - this.cA[k + 1]) * f) * fade;
      this.col[k + 2] = (this.cA[k + 2] + (this.cB[k + 2] - this.cA[k + 2]) * f) * fade;
    }
    this.live = any;
    this.flag();
  }

  private flag() {
    (this.points.geometry.attributes.position as BufferAttribute).needsUpdate = true;
    (this.points.geometry.attributes.color as BufferAttribute).needsUpdate = true;
  }
}
