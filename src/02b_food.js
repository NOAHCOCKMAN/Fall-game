// ================= FOOD =================
// Rounded, layered food models with raw → cooked → burnt stages, steam / smoke / grease,
// animated plating, and bite-by-bite eating (the food is cut away from the side nearest your mouth).

const _fc = new THREE.Color(), _fc2 = new THREE.Color(), _fv = new THREE.Vector3(), _fv2 = new THREE.Vector3();
const FGEO = new Map();
function fgeo(key, make) { let g = FGEO.get(key); if (!g) { g = make(); FGEO.set(key, g); } return g; }
function FM(color, r = 0.6, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: r, metalness: 0, ...extra }); }
function fmesh(p, geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); p.add(m); return m; }
const noRay = (...objs) => objs.flat().forEach(o => o.traverse(c => { c.userData.noRay = true; c.raycast = () => { }; }));
// colour for a cooking stage: c < 1 raw→cooked, 1–1.5 cooked, 1.5–2.1 cooked→burnt
function stageCol(out, raw, cooked, burnt, c) {
  if (c < 1) return out.set(raw).lerp(_fc2.set(cooked), Math.max(0, c));
  if (c < 1.5) return out.set(cooked);
  return out.set(cooked).lerp(_fc2.set(burnt), clamp((c - 1.5) / 0.6, 0, 1));
}
const easeBounce = (k) => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375; };

// ---- shared geometry ----
// rounded puck (pancake, cookie, bun, patty…): lathe with a rounded rim, bottom at y = 0
function puckGeo(r, h, seg = 24) {
  return fgeo(`puck|${r}|${h}|${seg}`, () => {
    const rr = Math.min(h / 2, r * 0.4), pts = [new THREE.Vector2(0, 0)];
    for (let i = 0; i <= 4; i++) { const a = -Math.PI / 2 + (i / 4) * Math.PI / 2; pts.push(new THREE.Vector2(r - rr + Math.cos(a) * rr, rr + Math.sin(a) * rr)); }
    for (let i = h - 2 * rr > 1e-5 ? 0 : 1; i <= 4; i++) { const a = (i / 4) * Math.PI / 2; pts.push(new THREE.Vector2(r - rr + Math.cos(a) * rr, h - rr + Math.sin(a) * rr)); }
    pts.push(new THREE.Vector2(0, h));
    return new THREE.LatheGeometry(pts, seg);
  });
}
// irregular outline (fried egg white, lettuce, syrup puddle)
function wobbleGeo(key, base, amp, seed) {
  return fgeo('wob|' + key, () => {
    const g = base.clone(), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), f = 1 + amp * (Math.sin(a * 3 + seed) * 0.6 + Math.sin(a * 5 + seed * 2.3) * 0.4); p.setX(i, x * f); p.setZ(i, z * f); }
    return g;
  });
}
function domeGeo(r, h, ws = 20, hs = 8) { return fgeo(`dome|${r}|${h}`, () => { const g = new THREE.SphereGeometry(r, ws, hs, 0, TAU, 0, Math.PI / 2); g.scale(1, h / r, 1); return g; }); }
function ballGeo(r, ws = 12, hs = 9) { return fgeo(`ball|${r}|${ws}`, () => new THREE.SphereGeometry(r, ws, hs)); }
// bread slice: domed top, crust on the sides (material 1), crumb on the faces (material 0); stands in XY, thickness along z
function breadGeo(w, h, t) {
  return fgeo(`bread|${w}|${h}|${t}`, () => {
    const s = new THREE.Shape(), hw = w / 2;
    s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(hw, h * 0.62);
    s.bezierCurveTo(hw * 1.18, h * 0.98, hw * 0.5, h * 1.08, 0, h * 0.96); s.bezierCurveTo(-hw * 0.5, h * 1.08, -hw * 1.18, h * 0.98, -hw, h * 0.62); s.lineTo(-hw, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: t * 0.5, bevelEnabled: true, bevelThickness: t * 0.25, bevelSize: Math.min(t * 0.35, w * 0.06), bevelSegments: 2, curveSegments: 10 });
    g.translate(0, -h * 0.5, -t * 0.25); return g;
  });
}
// rounded slab (butter, cheese slice, cutting board), lying flat, bottom at y = 0
function slabGeo(w, d, h, r) {
  return fgeo(`slab|${w}|${d}|${h}|${r}`, () => {
    const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    const b = Math.min(h * 0.3, r * 0.8);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0005, h - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4 });
    g.rotateX(-Math.PI / 2); g.translate(0, b, 0); return g;
  });
}
// wavy bacon strip with fat streaks baked into vertex colours
function baconGeo() {
  return fgeo('bacon', () => {
    const g = new THREE.BoxGeometry(0.17, 0.004, 0.034, 28, 1, 6), p = g.attributes.position, col = new Float32Array(p.count * 3);
    const fat = new THREE.Color(0xf7e3d6), meat = new THREE.Color(0xd2525a), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, p.getY(i) + Math.sin(x * 55) * 0.005 + Math.sin(z * 90 + x * 20) * 0.0008);
      const f = Math.abs(z) > 0.0125 ? 1 : Math.abs(z - 0.002) < 0.004 ? 0.8 : 0; c.copy(meat).lerp(fat, f); col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  });
}
function wedgeGeo(r, h, arc) { return fgeo(`wedge|${r}|${h}|${arc}`, () => { const g = new THREE.CylinderGeometry(r, r, h, 8, 1, false, -arc / 2, arc); g.translate(0, h / 2, 0); return g; }); }
function crustArcGeo(r, tube, arc) { return fgeo(`crust|${r}|${tube}|${arc}`, () => { const g = new THREE.TorusGeometry(r, tube, 6, 10, arc); g.rotateX(-Math.PI / 2); g.rotateY(-(Math.PI / 2 + arc / 2)); return g; }); }
function appleGeo(R) {
  return fgeo('apple' + R, () => {
    const pts = [], N = 16;
    for (let i = 0; i <= N; i++) { const t = i / N * Math.PI, d = Math.pow(1 - Math.sin(t), 3); let y = R * (1 - Math.cos(t)) * 0.92; y += t < Math.PI / 2 ? d * R * 0.12 : -d * R * 0.2; pts.push(new THREE.Vector2(Math.max(0, R * Math.sin(t) * (1 + 0.1 * Math.sin(t))), y)); }
    return new THREE.LatheGeometry(pts, 20);
  });
}
function pearGeo() {
  return fgeo('pear', () => {
    const r = [0, 0.03, 0.037, 0.037, 0.033, 0.025, 0.019, 0.016, 0.012, 0], h = [0.004, 0.002, 0.012, 0.025, 0.038, 0.05, 0.06, 0.07, 0.079, 0.083];
    return new THREE.LatheGeometry(r.map((x, i) => new THREE.Vector2(x, h[i])), 18);
  });
}
function bananaGeo() {
  return fgeo('banana', () => {
    const curve = new THREE.CatmullRomCurve3([V3(0, 0.03, -0.085), V3(0, 0.008, -0.045), V3(0, 0.0, 0), V3(0, 0.008, 0.045), V3(0, 0.03, 0.085)]);
    const T = 18, R = 7, g = new THREE.TubeGeometry(curve, T, 0.018, R, false), p = g.attributes.position;
    for (let i = 0; i <= T; i++) { const u = i / T, ctr = curve.getPointAt(u), k = 0.35 + 0.65 * Math.pow(Math.sin(Math.PI * u), 0.6); for (let j = 0; j <= R; j++) { const idx = i * (R + 1) + j; _fv.fromBufferAttribute(p, idx).sub(ctr).multiplyScalar(k).add(ctr); p.setXYZ(idx, _fv.x, _fv.y + 0.018, _fv.z); } }
    g.computeVertexNormals(); return g;
  });
}
function bowlGeo(r, h) {
  return fgeo(`bowl|${r}|${h}`, () => {
    const t = 0.004, pts = [[0, 0], [r * 0.45, 0], [r * 0.5, 0.006], [r * 0.85, h * 0.45], [r, h], [r - t, h + 0.002], [r - t - 0.002, h], [r * 0.82, h * 0.48], [r * 0.45, 0.006 + t], [0, 0.006 + t]];
    return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 28);
  });
}

// ---- steam / smoke puffs ----
const PUFF_GEO = new THREE.SphereGeometry(1, 8, 6);
function Puffs(parent, o) {
  o = Object.assign({ n: 5, color: 0xffffff, size: 0.018, speed: 0.5, height: 0.22, opacity: 0.25, spread: 0.03, x: 0, y: 0, z: 0, grow: 2.2 }, o);
  const ps = [];
  for (let i = 0; i < o.n; i++) {
    const m = new THREE.Mesh(PUFF_GEO, new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false; m.scale.setScalar(0.001); parent.add(m); ps.push({ m, k: i / o.n, a: Math.random() * TAU });
  }
  noRay(ps.map(p => p.m)); markDyn(ps.map(p => p.m));
  return {
    amt: 0, o,
    update(dt, amount) {
      this.amt += (amount - this.amt) * Math.min(1, dt * 3); const a = this.amt;
      for (const p of ps) {
        if (a < 0.02) { if (p.m.visible) p.m.visible = false; continue; }
        p.k += dt * o.speed; if (p.k > 1) { p.k -= 1; p.a = Math.random() * TAU; }
        const k = p.k, r = o.spread * (0.4 + k);
        p.m.visible = true; p.m.position.set(o.x + Math.cos(p.a + k * 3) * r, o.y + k * o.height, o.z + Math.sin(p.a + k * 3) * r);
        p.m.scale.setScalar(o.size * (1 + k * o.grow)); p.m.material.opacity = o.opacity * a * (1 - k) * Math.min(1, k * 6);
      }
    }
  };
}
// hot-grease spatter: tiny droplets hopping out of the pan, with crackle sounds
function Spatter(parent, n = 5) {
  const mat = FM(0xf3d27a, 0.2, { emissive: 0x3a2a00, emissiveIntensity: 0.4 }), ds = [];
  for (let i = 0; i < n; i++) { const m = fmesh(parent, ballGeo(0.0028, 5, 4), mat); m.visible = false; ds.push({ m, t: 1, vx: 0, vz: 0, vy: 0 }); }
  noRay(ds.map(d => d.m)); markDyn(ds.map(d => d.m));
  return {
    update(dt, rate, near) {
      for (const d of ds) {
        if (d.t >= 1) { if (rate > 0 && Math.random() < rate * dt) { d.t = 0; const a = Math.random() * TAU, s = rand(0.15, 0.35); d.vx = Math.cos(a) * s; d.vz = Math.sin(a) * s; d.vy = rand(0.5, 0.9); d.m.position.set(Math.cos(a) * 0.03, 0.02, Math.sin(a) * 0.03); d.m.visible = true; if (near && Math.random() < 0.6) Sfx.crackle(); } else { d.m.visible = false; continue; } }
        d.t += dt * 2.2; d.vy -= 3.5 * dt; d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt; if (d.t >= 1 || d.m.position.y < 0.01) { d.t = 1; d.m.visible = false; }
      }
    }
  };
}

// ---- crumbs: a small pooled particle burst that falls to the floor ----
const Crumbs = {
  pool: [], live: 0,
  init(scene) {
    const geo = new THREE.BoxGeometry(0.006, 0.004, 0.006);
    for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(geo, FM(0xc8a070, 0.9)); m.visible = false; m.frustumCulled = false; noRay(m); scene.add(m); this.pool.push({ m, v: V3(), life: 0, floor: 0 }); }
  },
  spawn(pos, color, n = 8, floorY = 0) {
    for (let i = 0; i < n; i++) {
      const c = this.pool.find(c => c.life <= 0); if (!c) return;
      c.life = rand(0.9, 1.6); c.floor = floorY + 0.003; c.m.visible = true; c.m.material.color.set(color).offsetHSL(0, 0, rand(-0.08, 0.06));
      c.m.position.set(pos.x + rand(-0.03, 0.03), pos.y + rand(-0.01, 0.02), pos.z + rand(-0.03, 0.03)); c.v.set(rand(-0.35, 0.35), rand(0.1, 0.7), rand(-0.35, 0.35));
      c.m.rotation.set(rand(0, 3), rand(0, 3), 0); c.m.scale.setScalar(rand(0.7, 1.5)); this.live++;
    }
  },
  update(dt) {
    if (!this.live) return; this.live = 0;
    for (const c of this.pool) {
      if (c.life <= 0) continue; c.life -= dt; this.live++;
      if (c.m.position.y > c.floor) { c.v.y -= 9.8 * dt; c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += dt * 8; if (c.m.position.y <= c.floor) { c.m.position.y = c.floor; c.v.set(0, 0, 0); } }
      if (c.life < 0.4) c.m.scale.setScalar(Math.max(0.01, c.life / 0.4));
      if (c.life <= 0) c.m.visible = false;
    }
  }
};

// ================= food models =================
// Each returns { g, set(c) } — set() shows a cooking stage (0 raw, 1 cooked, 2+ burnt).
const FOOD_MODELS = {
  egg(p, o = {}) {
    const g = G(p), white = FM(0xf1ece0, 0.25, { transparent: true, opacity: 0.7 }), lace = FM(0xd99a4e, 0.85), yolkM = FM(0xf6a21a, 0.15);
    const lc = fmesh(g, wobbleGeo('egglace', puckGeo(0.08, 0.004, 32), 0.16, 2.1), lace, 0, 0, 0);
    fmesh(g, wobbleGeo('eggwhite', puckGeo(0.074, 0.01, 32), 0.12, 1.3), white, 0, 0.001, 0);
    const y = fmesh(g, domeGeo(0.026, 0.017), yolkM, 0.012, 0.009, -0.008);
    if (o.garnish) { const pep = FM(0x2a2622, 0.9); for (let i = 0; i < 7; i++) fmesh(g, ballGeo(0.0018, 4, 3), pep, rand(-0.04, 0.05), 0.012, rand(-0.045, 0.04)); const herb = FM(0x4f8a2e, 0.8); for (let i = 0; i < 4; i++) fmesh(g, ballGeo(0.003, 4, 3), herb, rand(-0.03, 0.04), 0.013, rand(-0.04, 0.03)).scale.y = 0.3; }
    return {
      g, set(c) {
        stageCol(white.color, 0xf1ece0, 0xfbf8f1, 0x5c3f22, c); white.opacity = lerp(0.62, 1, clamp(c * 1.6, 0, 1)); white.roughness = lerp(0.2, 0.7, clamp(c, 0, 1));
        lc.visible = c > 0.35; lc.scale.setScalar(lerp(0.85, 1.05, clamp(c, 0, 1.5))); stageCol(lace.color, 0xe8b46a, 0xc98436, 0x1d120a, c);
        stageCol(yolkM.color, 0xf6a21a, 0xf4ad3e, 0x6b4416, c); yolkM.roughness = lerp(0.12, 0.5, clamp(c, 0, 1)); y.scale.y = lerp(1, 0.8, clamp(c, 0, 1));
      }
    };
  },
  pancake(p, o = {}) {
    const g = G(p), n = o.stack || 1, body = FM(0xf4e6c0, 0.6), top = FM(0xf3e3b5, 0.5), bub = FM(0xd5b06e, 0.7), bubs = [];
    for (let i = 0; i < n; i++) {
      const y = i * 0.0135, s = 1 - i * 0.03;
      fmesh(g, puckGeo(0.07 * s, 0.014, 28), body, rand(-0.003, 0.003), y, rand(-0.003, 0.003));
      fmesh(g, fgeo('pctop', () => new THREE.CircleGeometry(0.064, 28).rotateX(-Math.PI / 2)), top, 0, y + 0.0142, 0);
    }
    const ty = (n - 1) * 0.0135 + 0.0145;
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.012 + (i % 4) * 0.012; bubs.push(fmesh(g, fgeo('pcbub', () => new THREE.CircleGeometry(0.0045, 8).rotateX(-Math.PI / 2)), bub, Math.cos(a) * r, ty + 0.0004, Math.sin(a) * r)); }
    if (o.garnish) {
      const syrup = FM(0x7a3d0e, 0.08, { transparent: true, opacity: 0.88 });
      fmesh(g, wobbleGeo('syrup', puckGeo(0.058, 0.0025, 28), 0.2, 4.2), syrup, 0.004, ty, 0);
      for (let i = 0; i < 4; i++) { const a = i * 1.7 + 0.4, d = fmesh(g, ballGeo(0.005, 6, 5), syrup, Math.cos(a) * 0.066, ty - 0.012, Math.sin(a) * 0.066); d.scale.set(0.8, 2.6, 0.8); }
      fmesh(g, slabGeo(0.026, 0.026, 0.011, 0.004), FM(0xf8e391, 0.35), 0, ty + 0.002, 0).rotation.y = 0.5;
    }
    return {
      g, set(c) {
        stageCol(body.color, 0xf4e6c0, 0xe7bf74, 0x3a2412, c); stageCol(top.color, 0xf3e3b5, 0xbf7a33, 0x1e130a, c); top.roughness = c < 1 ? 0.25 : 0.6;
        bubs.forEach((b, i) => { b.visible = c > 0.25 + (i % 3) * 0.08; b.scale.setScalar(clamp((c - 0.2) * 2, 0.3, 1)); });
      }
    };
  },
  bacon(p, o = {}) {
    const g = G(p), m = FM(0xffffff, 0.5, { vertexColors: true }), strips = [], n = o.n || 2;
    for (let i = 0; i < n; i++) { const s = fmesh(g, baconGeo(), m, 0, 0.006 + i * 0.001, (i - (n - 1) / 2) * 0.04); s.rotation.y = (i - (n - 1) / 2) * 0.12; strips.push(s); }
    return { g, set(c) { stageCol(m.color, 0xffffff, 0xb46a42, 0x2a160a, c); m.roughness = lerp(0.55, 0.32, clamp(c, 0, 1)); strips.forEach(s => s.scale.set(lerp(1, 0.82, clamp(c, 0, 1)), lerp(1, 2.0, clamp(c, 0, 1.5)), 1)); } };
  },
  grilled(p, o = {}) {
    const g = G(p), crumb = FM(0xf4e9cf, 0.85), crust = FM(0xc9944e, 0.8), cheese = FM(0xf8dd7e, 0.45), mats = [crumb, crust];
    const b1 = fmesh(g, breadGeo(0.1, 0.1, 0.012), mats, 0, 0.006, 0); b1.rotation.x = -Math.PI / 2;
    fmesh(g, slabGeo(0.098, 0.098, 0.006, 0.006), cheese, 0.002, 0.012, -0.001).rotation.y = 0.05;
    const b2 = fmesh(g, breadGeo(0.1, 0.1, 0.012), mats, 0, 0.024, 0); b2.rotation.x = -Math.PI / 2;
    const drips = []; [[0.05, 0.01], [-0.051, -0.02], [0.02, -0.052], [-0.015, 0.051]].forEach(([x, z]) => { const d = fmesh(g, ballGeo(0.006, 7, 5), cheese, x, 0.008, z); d.scale.set(1, 1.7, 1); drips.push(d); });
    return { g, set(c) { stageCol(crumb.color, 0xf4e9cf, 0xd8954a, 0x26160b, c); stageCol(crust.color, 0xc9944e, 0x99561f, 0x1a0f08, c); stageCol(cheese.color, 0xf8dd7e, 0xf5b52e, 0x6b4a10, c); cheese.roughness = c > 0.5 ? 0.3 : 0.5; drips.forEach(d => d.scale.setScalar(clamp((c - 0.4) * 1.6, 0.001, 1))); drips.forEach(d => d.scale.y *= 1.7); } };
  },
  toast(p, o = {}) {
    const g = G(p), crumb = FM(0xf3e6c8, 0.85), crust = FM(0xc68a48, 0.8), n = o.n || 2;
    for (let i = 0; i < n; i++) { const s = fmesh(g, breadGeo(0.1, 0.105, 0.012), [crumb, crust], (i - (n - 1) / 2) * 0.05, 0.007 + i * 0.012, (i - (n - 1) / 2) * 0.02); s.rotation.set(-Math.PI / 2 + (i ? 0.12 : 0), 0, i * 0.5 - 0.2); }
    if (o.garnish) { const butter = fmesh(g, slabGeo(0.024, 0.02, 0.008, 0.003), FM(0xf8e391, 0.2), 0.03, 0.026, 0.01); butter.rotation.y = 0.7; butter.scale.y = 0.6; }
    return { g, set(c) { stageCol(crumb.color, 0xf3e6c8, 0xcf8d43, 0x2a170b, c); stageCol(crust.color, 0xc68a48, 0x8f4f1e, 0x1a0e06, c); } };
  },
  cookies(p, o = {}) {
    const g = G(p), m = FM(0xe9d2a6, 0.85), chipM = FM(0x3a1f12, 0.45), cks = [], n = o.n || 6;
    for (let i = 0; i < n; i++) {
      const pos = o.layout ? o.layout(i) : [Math.cos(i * 1.26) * (i ? 0.05 : 0), 0, Math.sin(i * 1.26) * (i ? 0.05 : 0)];
      const ck = fmesh(g, puckGeo(0.032, 0.011, 20), m, pos[0], pos[1], pos[2]);
      for (let k = 0; k < 5; k++) { const a = k * 1.9 + i, r = k ? 0.017 : 0; fmesh(ck, ballGeo(0.0048, 6, 5), chipM, Math.cos(a) * r, 0.0105, Math.sin(a) * r).scale.y = 0.6; }
      cks.push(ck);
    }
    return { g, cks, set(c) { stageCol(m.color, 0xe9d2a6, 0xc98b45, 0x3a2312, c); const k = clamp(c, 0, 1); cks.forEach(ck => ck.scale.set(lerp(0.7, 1, k), lerp(1.9, 1, k), lerp(0.7, 1, k))); } };
  },
};

// ================= edible items: bite-by-bite eating =================
// it.food = { bites, hunger, sound, crumb, flesh, mode ('cut' | 'level' | 'drink'), level(frac), done() }
// 'cut' slices the food away from the side facing your mouth; inner faces show the food's inside colour.
function makeEdible(ctx, it, root, part, o) {
  const d = it.d || (it.d = {});
  const F = it.food = Object.assign({ bites: 4, hunger: 0.5, sound: 'crunch', crumb: 0xc8a070, flesh: 0xf0e0c0, mode: 'cut', handYaw: 0, verb: 'take a bite', name: 'food' }, o);
  if (d.left == null) d.left = F.bites;
  F.part = part;
  F.apply = (camPos) => {
    const eaten = 1 - d.left / F.bites;
    if (F.mode !== 'cut') { F.level && F.level(1 - eaten); return; }
    if (!F.plane) setupClip(F, part, camPos);
    F.local.set(_fv2.copy(F.dir).negate(), F.max - eaten * (F.max - F.min));
  };
  ctx.interact(root, {
    label: () => F.empty && F.empty() ? (F.emptyLabel || '') : d.left > 0 ? (F.mode === 'drink' ? 'Drink — take a sip' : 'Eat — ' + F.verb) + ' (' + d.left + ' left)' : '',
    action: () => ctx.bite(root)
  });
  if (d.left < F.bites) F.level && F.level(d.left / F.bites);
  return F;
}
function setupClip(F, part, camPos) {
  part.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(part.matrixWorld).invert(), rel = new THREE.Matrix4(), box = new THREE.Box3(), bb = new THREE.Box3(), meshes = [];
  part.traverse(o => { if (o.isMesh && !o.userData.inner && !o.userData.noClip && o.visible) meshes.push(o); });
  for (const o of meshes) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); rel.multiplyMatrices(inv, o.matrixWorld); bb.copy(o.geometry.boundingBox).applyMatrix4(rel); box.union(bb); }
  const ctr = box.getCenter(V3()), camL = part.worldToLocal(camPos.clone());
  F.dir = camL.sub(ctr); F.dir.y *= 0.35; if (F.dir.lengthSq() < 1e-8) F.dir.set(0, 0, 1); F.dir.normalize();
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < 8; i++) { _fv.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z); const v = _fv.dot(F.dir); mn = Math.min(mn, v); mx = Math.max(mx, v); }
  F.min = mn; F.max = mx; F.local = new THREE.Plane(); F.plane = new THREE.Plane();
  const upd = () => F.plane.copy(F.local).applyMatrix4(part.matrixWorld);
  const flesh = new THREE.MeshStandardMaterial({ color: F.flesh, roughness: 0.85, side: THREE.BackSide, clippingPlanes: [F.plane] });
  for (const o of meshes) {
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.clippingPlanes = [F.plane]; m.needsUpdate = true; });
    o.onBeforeRender = upd;
    const inner = new THREE.Mesh(o.geometry, flesh); inner.userData.inner = true; inner.onBeforeRender = upd; noRay(inner); o.add(inner);
  }
}

// ================= cooking gear =================
const FOODS = {
  egg: { name: 'fried egg', hunger: 0.35, bites: 3, crumb: 0xf4e9c8, flesh: 0xf6d27a, sound: 'soft' },
  pancake: { name: 'pancakes', hunger: 0.5, bites: 5, crumb: 0xd9a65a, flesh: 0xf3e2b8, sound: 'soft' },
  bacon: { name: 'bacon', hunger: 0.35, bites: 3, crumb: 0x8a4a2a, flesh: 0xc0704a, sound: 'crunch' },
  grilled: { name: 'grilled cheese', hunger: 0.5, bites: 4, crumb: 0xd8954a, flesh: 0xf5c040, sound: 'crunch' },
  toast: { name: 'buttered toast', hunger: 0.3, bites: 4, crumb: 0xcf8d43, flesh: 0xf1e2c0, sound: 'crunch' },
  cookies: { name: 'cookies', hunger: 0.35, bites: 5, crumb: 0xc98b45, flesh: 0xe2b77a, sound: 'crunch' },
};
const PAN_ORDER = ['egg', 'pancake', 'bacon', 'grilled'];
def('pan', 'Frying pan', 'Kitchen', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(), blk = M(0x202022, 0.4, 0.5);
  C(g, 0.13, 0.11, 0.045, blk, 0, 0, 0, 28); C(g, 0.118, 0.118, 0.002, M(0x2c2c30, 0.25, 0.6), 0, 0.012, 0, 28);
  const hdl = B(g, 0.03, 0.02, 0.2, M(0x1a1a1a, 0.6), 0, 0.03, 0.22); hdl.rotation.x = -0.12;
  const food = G(g, 0, 0.013, 0); markDyn(food);
  const models = {}; for (const k of PAN_ORDER) { models[k] = FOOD_MODELS[k](food); models[k].g.visible = false; }
  noRay(food);
  const steam = Puffs(g, { n: 6, size: 0.02, height: 0.3, opacity: 0.22, spread: 0.05, y: 0.04 });
  const smoke = Puffs(g, { n: 6, color: 0x36322f, size: 0.025, height: 0.45, opacity: 0.5, spread: 0.05, y: 0.05, speed: 0.4 });
  const spat = Spatter(g);
  const st = { food: null, cook: 0, sz: null, choice: 0, flip: -1, plate: -1 }, wp = V3(), pp = V3();
  const nm = () => FOODS[st.food].name;
  const stage = () => st.cook < 1 ? 'raw' : st.cook < 1.6 ? 'cooked' : st.cook < 2 ? 'browning' : 'burnt';
  const heatHere = () => ctx.heatAt(g.getWorldPosition(wp));
  ctx.interact(g, {
    label: () => {
      if (st.plate >= 0) return 'Plating…';
      const burner = ctx.burnerAt(g.getWorldPosition(wp));
      if (!st.food) return 'Add ' + FOODS[PAN_ORDER[st.choice]].name + ' to the pan';
      const s = stage(), heat = heatHere();
      if (s === 'raw') return heat ? 'Cooking ' + nm() + '… ' + Math.round(st.cook * 100) + '% (raw)' : burner ? 'Turn on the burner under the pan' : 'Put the pan on the stove';
      if (s === 'cooked') return 'Plate the ' + nm() + ' 🍽 (cooked)';
      if (s === 'browning') return 'Plate it now — the ' + nm() + ' is browning!';
      return 'Scrape out the burnt ' + nm() + ' 😬';
    },
    action: () => {
      if (st.plate >= 0 || st.flip >= 0) return;
      if (!st.food) { st.food = PAN_ORDER[st.choice]; st.cook = 0; Sfx.splash(); return; }
      const s = stage();
      if (s === 'raw') {
        if (heatHere()) return ctx.msg('Still raw — give it a few more seconds.');
        const b = ctx.burnerAt(g.getWorldPosition(wp)); if (b) return ctx.toggleBurner(b, true);
        st.food = null; ctx.msg('Took the raw food out. Set the pan on a burner to cook.'); return;
      }
      if (s === 'burnt') { st.food = null; Sfx.noise(0.4, 0.2, 900, 1, 'bandpass', -400); ctx.msg('Into the trash it goes.'); return; }
      st.plate = 0; Sfx.noise(0.25, 0.12, 1400, 1, 'bandpass', 600); // scoop it out
    },
    altLabel: () => st.plate >= 0 ? '' : !st.food ? 'switch to ' + FOODS[PAN_ORDER[(st.choice + 1) % PAN_ORDER.length]].name : stage() !== 'burnt' && heatHere() ? 'flip it' : '',
    alt: () => {
      if (st.plate >= 0) return;
      if (!st.food) { st.choice = (st.choice + 1) % PAN_ORDER.length; Sfx.click(); return; }
      if (st.flip < 0 && heatHere()) { st.flip = 0; Sfx.whoosh(); }
    }
  });
  ctx.onRemove(g, () => st.sz && st.sz.stop());
  ctx.tick(g, (dt, t) => {
    for (const k of PAN_ORDER) { const v = st.food === k; if (models[k].g.visible !== v) models[k].g.visible = v; }
    const heat = st.food && st.plate < 0 && heatHere();
    if (heat) { st.cook += dt / 9; if (!st.sz) st.sz = Sfx.loop('sizzle', () => g.getWorldPosition(pp), 0.14); st.sz.setVol(st.cook > 1.6 ? 0.2 : 0.14); }
    else if (st.sz) { st.sz.stop(); st.sz = null; }
    if (st.food) models[st.food].set(st.cook);
    const near = g.getWorldPosition(pp).distanceTo(ctx.playerPos()) < 4;
    steam.update(dt, heat ? clamp(st.cook * 1.2, 0.3, 1) * (st.cook > 1.8 ? 0.4 : 1) : 0);
    smoke.update(dt, st.food && st.cook > 1.6 ? clamp((st.cook - 1.6) * 2, 0, 1) : 0);
    spat.update(dt, heat ? (st.food === 'bacon' ? 6 : 3) : 0, near);
    if (st.flip >= 0) {
      st.flip += dt / 0.55; const k = Math.min(1, st.flip);
      food.position.y = 0.013 + Math.sin(k * Math.PI) * 0.13; food.rotation.x = k * TAU * (st.food === 'bacon' ? 0.5 : 1); food.rotation.z = Math.sin(k * Math.PI) * 0.2;
      if (k >= 1) { st.flip = -1; food.position.y = 0.013; food.rotation.set(0, 0, 0); Sfx.noise(0.12, 0.3, 500, 1, 'lowpass'); }
    }
    if (st.plate >= 0) { // the food lifts out of the pan toward you, then lands on a plate in your hand
      st.plate += dt / 0.35; const k = Math.min(1, st.plate);
      food.position.y = 0.013 + k * 0.22; food.scale.setScalar(1 - k * 0.4);
      if (k >= 1) { const f = st.food; st.food = null; st.plate = -1; food.position.y = 0.013; food.scale.setScalar(1); ctx.give('plate', { food: f, fresh: true, hot: true }, { rise: true }); ctx.task('cook'); }
    }
  });
  return g;
});

def('plate', 'Plate of food', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(), d = it.d || (it.d = {});
  fmesh(g, fgeo('plate', () => new THREE.LatheGeometry([[0, 0], [0.07, 0], [0.075, 0.004], [0.12, 0.012], [0.128, 0.016], [0.122, 0.017], [0.075, 0.009], [0, 0.009]].map(([x, y]) => new THREE.Vector2(x, y)), 36)), M(0xf7f5f0, 0.25));
  const kind = FOODS[d.food] ? d.food : 'egg', F = FOODS[kind];
  const food = G(g, 0, 0.009, 0); markDyn(food);
  let model;
  if (kind === 'egg') { model = FOOD_MODELS.egg(food, { garnish: true }); const t = FOOD_MODELS.toast(food, { n: 1 }); t.g.position.set(0.055, 0, 0.03); t.g.scale.setScalar(0.75); t.set(1.2); }
  else if (kind === 'pancake') model = FOOD_MODELS.pancake(food, { stack: 3, garnish: true });
  else if (kind === 'bacon') model = FOOD_MODELS.bacon(food, { n: 3 });
  else if (kind === 'grilled') { model = FOOD_MODELS.grilled(food); model.g.rotation.y = 0.6; }
  else if (kind === 'toast') model = FOOD_MODELS.toast(food, { n: 2, garnish: true });
  else if (kind === 'cookies') model = FOOD_MODELS.cookies(food, { n: 5, layout: (i) => i < 4 ? [Math.cos(i * 1.57 + 0.4) * 0.05, 0, Math.sin(i * 1.57 + 0.4) * 0.05] : [0, 0.011, 0] });
  model.set(d.burnt ? 2.05 : 1.15);
  const steam = Puffs(g, { n: 5, size: 0.016, height: 0.24, opacity: 0.2, spread: 0.035, y: 0.04, speed: 0.45 });
  const anim = d.fresh ? { t: 0 } : null; delete d.fresh;
  const born = performance.now() - (d.hot ? 0 : 1e9);
  makeEdible(ctx, it, g, food, { bites: F.bites, hunger: d.burnt ? F.hunger * 0.5 : F.hunger, sound: F.sound, crumb: F.crumb, flesh: F.flesh, name: F.name, msg: d.burnt ? 'Crunchy… a little too crunchy.' : 'Yum! That hit the spot. 🍽' });
  ctx.tick(g, (dt) => {
    const age = (performance.now() - born) / 1000;
    steam.update(dt, age < 90 && it.d.left > 0 ? clamp(1 - age / 90, 0, 1) : 0);
    if (anim) {
      if (anim.t < 1) { anim.t = Math.min(1, anim.t + dt / 0.55); const k = anim.t; food.position.y = 0.009 + 0.16 * (1 - easeBounce(k)); food.rotation.y = (1 - k) * 1.2; food.scale.setScalar(lerp(0.6, 1, Math.min(1, k * 2))); if (k >= 1) Sfx.clink(); }
    }
  });
  return g;
});

def('mug', 'Mug', 'Kitchen', { mount: 'surface', solid: false, small: true, color: '#f4f1ea', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), cm = M(it.c || '#f4f1ea', 0.3), d = it.d || (it.d = {});
  fmesh(g, fgeo('mugbody', () => new THREE.LatheGeometry([[0, 0], [0.04, 0], [0.044, 0.004], [0.046, 0.1], [0.042, 0.1], [0.04, 0.008], [0, 0.008]].map(([x, y]) => new THREE.Vector2(x, y)), 24)), cm);
  T(g, 0.026, 0.007, cm, 0.05, 0.05, 0, TAU);
  const liq = C(g, 0.04, 0.04, 0.004, M(0x4a2a14, 0.12), 0, 0.006, 0, 20); markDyn(liq);
  const crema = C(g, 0.034, 0.034, 0.001, M(0xc8915a, 0.4), 0, 0.01, 0, 18); markDyn(crema);
  const steam = Puffs(g, { n: 4, size: 0.012, height: 0.18, opacity: 0.2, spread: 0.02, y: 0.1 });
  if (d.fill && d.left == null) d.left = 3;
  const F = makeEdible(ctx, it, g, liq, { mode: 'drink', bites: 3, hunger: 0, verb: 'sip', name: 'drink', handYaw: -0.6,
    level: (f) => { liq.scale.y = 1; liq.position.y = 0.006 + 0.084 * f; },
    empty: () => !d.fill, emptyLabel: '',
    done: () => { d.fill = null; return 'keep'; } });
  F.onSip = (first) => { if (first) ctx.drink(d.fill); };
  ctx.tick(g, (dt) => {
    const has = !!d.fill && d.left > 0; liq.visible = has; crema.visible = has && d.fill === 'coffee';
    if (has) { liq.material.color.set(d.fill === 'tea' ? 0x9a5a22 : 0x3e220f); liq.position.y = 0.006 + 0.084 * (d.left / 3); crema.position.y = liq.position.y + 0.004; }
    steam.update(dt, has ? 0.8 : 0);
  });
  return g;
});

def('kettle', 'Tea kettle', 'Kitchen', { mount: 'surface', solid: false, small: true, color: '#c7c9cc', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), m = M(it.c || '#c7c9cc', 0.25, 0.8);
  const body = S(g, 0.1, m, 0, 0.09, 0, 18, 12); body.scale.y = 0.9; C(g, 0.1, 0.1, 0.03, m, 0, 0, 0, 18);
  const sp = C(g, 0.012, 0.02, 0.12, m, 0.1, 0.08, 0, 8); sp.rotation.z = -0.9;
  T(g, 0.07, 0.01, M(0x1a1a1a), 0, 0.18, 0, Math.PI);
  const steam = Puffs(g, { n: 6, size: 0.018, height: 0.3, opacity: 0.3, spread: 0.02, x: 0.17, y: 0.17 });
  const st = { temp: 0, whistle: 0 }; const wp = V3(), pp = V3();
  ctx.interact(g, {
    label: () => st.temp >= 1 ? 'Pour a cup of tea 🍵' : ctx.heatAt(g.getWorldPosition(wp)) ? 'Heating water… ' + Math.round(st.temp * 100) + '%' : ctx.burnerAt(g.getWorldPosition(wp)) ? 'Turn on the burner under the kettle' : 'Put the kettle on the stove',
    action: () => {
      if (st.temp >= 1) { Sfx.noise(0.8, 0.12, 900, 1.5, 'bandpass', -300); ctx.give('mug', { fill: 'tea' }, { rise: true }); ctx.msg('Hot tea! Left-click to sip.'); ctx.task('tea'); st.temp = 0.6; return; }
      const b = !ctx.heatAt(g.getWorldPosition(wp)) && ctx.burnerAt(g.getWorldPosition(wp)); if (b) ctx.toggleBurner(b, true);
    }
  });
  ctx.onRemove(g, () => st.b && st.b.stop());
  ctx.tick(g, (dt) => {
    const heat = ctx.heatAt(g.getWorldPosition(wp));
    st.temp = clamp(st.temp + (heat ? dt / 12 : -dt / 60), 0, 1.2);
    if (st.temp >= 1 && heat) { if (!st.b) st.b = Sfx.loop('boil', () => g.getWorldPosition(pp), 0.1); if ((st.whistle -= dt) < 0) { Sfx.tone(2400, 0.8, 'sine', 0.05, 80); st.whistle = 1.2; } } else if (st.b) { st.b.stop(); st.b = null; }
    steam.update(dt, clamp((st.temp - 0.7) * 3, 0, 1));
  });
  return g;
});

def('toaster', 'Toaster', 'Kitchen', { mount: 'surface', solid: false, small: true, color: '#f1ece2', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), m = M(it.c || '#f1ece2', 0.3, 0.2);
  fmesh(g, slabGeo(0.28, 0.17, 0.19, 0.03), m);
  B(g, 0.2, 0.005, 0.03, M(0x111111), 0, 0.19, -0.035); B(g, 0.2, 0.005, 0.03, M(0x111111), 0, 0.19, 0.035);
  const lever = B(g, 0.03, 0.015, 0.04, M(0x333333), 0.15, 0.13, 0); markDyn(lever);
  const crumb = FM(0xf3e6c8, 0.85), crust = FM(0xc68a48, 0.8);
  const toasts = [-0.035, 0.035].map(z => { const s = fmesh(g, breadGeo(0.11, 0.1, 0.012), [crumb, crust], 0, 0.12, z); return s; }); markDyn(toasts);
  const smoke = Puffs(g, { n: 4, color: 0xdddddd, size: 0.014, height: 0.2, opacity: 0.18, spread: 0.04, y: 0.2 });
  const st = { s: 'ready', t: 0, pop: 1 };
  ctx.interact(g, {
    label: () => st.s === 'ready' ? 'Make toast 🍞' : st.s === 'toasting' ? 'Toasting… ' + Math.round(st.t / 6 * 100) + '%' : 'Take the toast',
    action: () => {
      if (st.s === 'ready') { if (!ctx.power()) return ctx.msg('No power.'); st.s = 'toasting'; st.t = 0; Sfx.click(); Sfx.noise(0.15, 0.2, 600, 1, 'lowpass'); }
      else if (st.s === 'done') { st.s = 'ready'; st.t = 0; ctx.give('plate', { food: 'toast', fresh: true, hot: true }, { rise: true }); ctx.task('cook'); }
    }
  });
  ctx.tick(g, dt => {
    if (st.s === 'toasting') { st.t += dt; if (st.t > 6) { st.s = 'done'; st.pop = 0; Sfx.pop(); } }
    const c = st.s === 'ready' ? 0 : clamp(st.t / 6, 0, 1.15);
    stageCol(crumb.color, 0xf3e6c8, 0xcf8d43, 0x2a170b, c); stageCol(crust.color, 0xc68a48, 0x8f4f1e, 0x1a0e06, c);
    if (st.pop < 1) st.pop = Math.min(1, st.pop + dt / 0.45);
    const y = st.s === 'toasting' ? 0.07 : st.s === 'done' ? 0.15 + 0.07 * Math.sin(st.pop * Math.PI) * (1 - st.pop * 0.6) : 0.12; // pops up, then settles
    lever.position.y = st.s === 'toasting' ? 0.04 : 0.13; toasts.forEach(t => { t.position.y = y + 0.05; });
    smoke.update(dt, st.s === 'toasting' && st.t > 3 ? 0.6 : 0);
  });
  return g;
});

def('fruit_bowl', 'Fruit bowl', 'Kitchen', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); fmesh(g, bowlGeo(0.15, 0.09), M(0x8a5a3a, 0.5));
  const kinds = ['apple', 'orange', 'apple', 'pear', 'orange', 'apple'], fruit = [];
  kinds.forEach((k, i) => { const f = FRUIT[k](g); f.position.set(Math.cos(i) * 0.07, 0.03 + (i > 3 ? 0.04 : 0), Math.sin(i) * 0.07); f.rotation.set(rand(-0.4, 0.4), rand(0, 6), rand(-0.4, 0.4)); f.userData.kind = k; fruit.push(f); });
  const ban = FRUIT.banana(g); ban.position.set(0, 0.07, 0); ban.rotation.set(0.2, 1.2, 0.15); ban.userData.kind = 'banana'; fruit.push(ban); markDyn(fruit);
  const next = () => fruit.slice().reverse().find(f => f.visible);
  ctx.interact(g, {
    label: () => { const f = next(); return f ? 'Take ' + (f.userData.kind === 'orange' ? 'an orange' : f.userData.kind === 'apple' ? 'an apple' : 'a ' + f.userData.kind) : 'Bowl is empty (refills tomorrow)'; },
    action: () => { const f = next(); if (!f) return; f.visible = false; Sfx.noise(0.15, 0.2, 1500, 1); ctx.give('fruit', { kind: f.userData.kind }, { rise: true }); }
  });
  g.userData.refill = () => fruit.forEach(f => f.visible = true);
  return g;
});
const FRUIT = {
  apple(p) { const g = G(p); fmesh(g, appleGeo(0.038), M(0xb8202a, 0.45)); C(g, 0.0025, 0.0025, 0.022, M(0x5a3a1a, 0.8), 0, 0.055, 0, 5).rotation.z = 0.25; const leaf = fmesh(g, ballGeo(0.011, 6, 4), M(0x4f8a2e, 0.7), 0.009, 0.072, 0); leaf.scale.set(1.3, 0.25, 0.6); return g; },
  orange(p) { const g = G(p); const o = fmesh(g, ballGeo(0.037, 18, 14), M(0xf08a1c, 0.85), 0, 0.035, 0); o.scale.y = 0.93; fmesh(g, ballGeo(0.005, 6, 4), M(0x7a7a2a, 0.8), 0, 0.068, 0).scale.y = 0.4; return g; },
  pear(p) { const g = G(p); fmesh(g, pearGeo(), M(0xb8c24a, 0.6)); C(g, 0.002, 0.003, 0.02, M(0x5a3a1a, 0.8), 0, 0.08, 0, 5).rotation.z = 0.3; return g; },
  banana(p) { const g = G(p), m = M(0xf1cf3e, 0.55), tip = M(0x4a3a1a, 0.8); fmesh(g, bananaGeo(), m); fmesh(g, ballGeo(0.006, 6, 4), tip, 0, 0.048, -0.085); C(g, 0.006, 0.007, 0.02, M(0x8a7a3a, 0.7), 0, 0.044, 0.085, 6).rotation.x = Math.PI / 2 + 0.6; return g; },
};
const FRUIT_INFO = { apple: ['apple', 0xf3e6b5, 0.25, 4], orange: ['orange', 0xf5a53a, 0.22, 4], pear: ['pear', 0xf1ecc4, 0.22, 4], banana: ['banana', 0xf6efc8, 0.25, 3] };
def('fruit', 'Fruit', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(), d = it.d || (it.d = {}), k = FRUIT[d.kind] ? d.kind : 'apple', inf = FRUIT_INFO[k];
  const part = FRUIT[k](g);
  makeEdible(ctx, it, g, part, { bites: inf[3], hunger: inf[2], sound: k === 'banana' ? 'soft' : 'crunch', crumb: inf[1], flesh: inf[1], name: inf[0], msg: k === 'apple' ? 'Crisp and sweet. 🍎' : k === 'banana' ? 'Potassium! 🍌' : 'Fresh! 🍊', handYaw: k === 'banana' ? 0.3 : 0 });
  return g;
});

// ---- fridge snacks, leftovers, pizza slices and delivery meals ----
const SNACKS = { cheese: 'cheese & grapes', yogurt: 'yogurt with honey', milk: 'a glass of milk', slice: 'a cold pizza slice' };
const SNACK_ORDER = ['cheese', 'yogurt', 'milk', 'slice'];
function pizzaSlice(p, o = {}) {
  const g = G(p, 0, 0, -0.075), arc = TAU / 8;
  fmesh(g, wedgeGeo(0.15, 0.008, arc), FM(0xe6bd78, 0.85));
  fmesh(g, wedgeGeo(0.138, 0.004, arc * 0.92), FM(o.cold ? 0xf0cf6a : 0xf3c24e, 0.35), 0, 0.008, 0);
  fmesh(g, crustArcGeo(0.146, 0.01, arc), FM(0xcf9550, 0.8), 0, 0.009, 0);
  const pep = FM(0xa3281c, 0.5); [[0.005, 0.05], [-0.012, 0.09], [0.014, 0.1], [0, 0.125]].forEach(([x, z]) => fmesh(g, puckGeo(0.014, 0.003, 14), pep, x, 0.011, z));
  const herb = FM(0x3f7a2a, 0.8); for (let i = 0; i < 5; i++) fmesh(g, ballGeo(0.0025, 4, 3), herb, rand(-0.02, 0.02), 0.013, rand(0.03, 0.13)).scale.y = 0.3;
  return g;
}
def('slice', 'Pizza slice', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(), d = it.d || (it.d = {});
  const part = G(g); pizzaSlice(part, { cold: d.cold }); part.rotation.y = Math.PI; // tip toward you
  makeEdible(ctx, it, g, part, { bites: 4, hunger: 0.2, sound: 'soft', crumb: 0xe0a85a, flesh: 0xf3d27a, name: 'pizza', handTilt: 0.85, msg: d.cold ? 'Cold pizza: underrated. 🍕' : '🍕 So good.' });
  return g;
});
def('snack', 'Snack', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(), d = it.d || (it.d = {}), k = SNACKS[d.kind] ? d.kind : 'cheese';
  if (k === 'cheese') {
    fmesh(g, slabGeo(0.17, 0.11, 0.012, 0.012), M(0xb0834f, 0.6));
    const part = G(g, 0, 0.012, 0);
    const w = fmesh(part, wedgeGeo(0.055, 0.03, TAU / 7), FM(0xf2c75a, 0.6), -0.035, 0, -0.02); w.rotation.y = 0.8;
    const cr = FM(0xd8a656, 0.85); for (let i = 0; i < 3; i++) fmesh(part, puckGeo(0.02, 0.004, 14), cr, 0.035 + i * 0.006, i * 0.004, 0.025);
    const gr = [FM(0x6b2a5a, 0.3), FM(0x7b3a6a, 0.3)]; for (let i = 0; i < 10; i++) fmesh(part, ballGeo(0.0095, 8, 6), gr[i % 2], 0.03 + (i % 3) * 0.016 + rand(-0.003, 0.003), 0.008 + Math.floor(i / 6) * 0.012, -0.03 + Math.floor(i / 3) % 2 * 0.016);
    makeEdible(ctx, it, g, part, { bites: 4, hunger: 0.3, sound: 'soft', crumb: 0xe9c56a, flesh: 0xf3d58a, name: 'cheese plate', msg: 'Cheese and grapes. Classy. 🧀' });
  } else if (k === 'yogurt') {
    const cup = FM(0xffffff, 0.4); fmesh(g, fgeo('ycup', () => new THREE.CylinderGeometry(0.032, 0.026, 0.065, 20, 1, true).translate(0, 0.0325, 0)), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, side: THREE.DoubleSide }));
    C(g, 0.0325, 0.0295, 0.03, M(0x3a6fd0, 0.5), 0, 0.012, 0, 20); C(g, 0.026, 0.026, 0.002, cup, 0, 0, 0, 20);
    const top = G(g, 0, 0.055, 0); markDyn(top); C(top, 0.03, 0.03, 0.003, FM(0xf6f1e6, 0.5), 0, 0, 0, 20); const hn = T(top, 0.012, 0.0025, FM(0xe0a020, 0.1), 0, 0.004, 0); hn.rotation.x = Math.PI / 2;
    const sp = G(g, 0.01, 0.05, 0); sp.rotation.z = -0.5; B(sp, 0.006, 0.09, 0.003, M(0xd6d6d8, 0.25, 0.9), 0, 0, 0);
    makeEdible(ctx, it, g, top, { mode: 'level', bites: 4, hunger: 0.25, sound: 'soft', crumb: 0xf6f1e6, name: 'yogurt', verb: 'take a spoonful', msg: 'Yogurt with honey. 🍯', level: (f) => { top.position.y = 0.008 + 0.047 * f; } });
  } else if (k === 'milk') {
    fmesh(g, fgeo('glass', () => new THREE.CylinderGeometry(0.032, 0.028, 0.12, 20, 1, true).translate(0, 0.06, 0)), new THREE.MeshStandardMaterial({ color: 0xdfe8ee, roughness: 0.05, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
    const milk = C(g, 0.029, 0.026, 0.1, FM(0xf7f7f2, 0.35), 0, 0.004, 0, 20); markDyn(milk); milk.geometry.translate(0, 0.05, 0); milk.position.y = 0.004;
    makeEdible(ctx, it, g, milk, { mode: 'drink', bites: 3, hunger: 0.12, name: 'milk', verb: 'sip', msg: 'A cold glass of milk. 🥛', level: (f) => { milk.scale.y = Math.max(0.01, f); } });
    it.food.onSip = (first) => { if (first) ctx.need('energy', 0.05); };
  } else {
    const part = G(g); pizzaSlice(part, { cold: true }); part.rotation.y = Math.PI;
    makeEdible(ctx, it, g, part, { bites: 4, hunger: 0.2, sound: 'soft', crumb: 0xe0a85a, flesh: 0xf3d27a, name: 'cold pizza', handTilt: 0.85, msg: 'Cold pizza: underrated. 🍕' });
  }
  return g;
});
function pastaBowl(p) {
  const g = G(p); fmesh(g, bowlGeo(0.07, 0.045), M(0xf4f1ea, 0.25));
  const top = G(g, 0, 0.02, 0); markDyn(top);
  fmesh(top, wobbleGeo('pasta', domeGeo(0.052, 0.03, 20, 8), 0.08, 1.1), FM(0xe8b04a, 0.55));
  const tube = FM(0xf0c060, 0.5); for (let i = 0; i < 9; i++) { const a = i * 2.3, r = 0.012 + (i % 3) * 0.014, m = fmesh(top, fgeo('penne', () => new THREE.CylinderGeometry(0.004, 0.004, 0.02, 8, 1, true)), tube, Math.cos(a) * r, 0.022 + (2 - i % 3) * 0.004, Math.sin(a) * r); m.rotation.set(rand(0, 3), rand(0, 3), 1.2); }
  fmesh(top, wobbleGeo('sauce', domeGeo(0.036, 0.02, 16, 6), 0.15, 2.2), FM(0xb3301f, 0.3), 0, 0.02, 0);
  const basil = FM(0x3f8a2e, 0.6); for (let i = 0; i < 2; i++) { const l = fmesh(top, ballGeo(0.009, 6, 4), basil, -0.01 + i * 0.018, 0.04, 0.005 * i); l.scale.set(1.3, 0.2, 0.7); l.rotation.y = i; }
  const parm = FM(0xfaf6e8, 0.9); for (let i = 0; i < 8; i++) fmesh(top, ballGeo(0.0022, 4, 3), parm, rand(-0.025, 0.025), 0.038, rand(-0.025, 0.025));
  return { g, top };
}
def('bowl', 'Bowl of leftovers', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(), d = it.d || (it.d = {}), b = pastaBowl(g);
  const steam = Puffs(g, { n: 5, size: 0.016, height: 0.24, opacity: 0.22, spread: 0.03, y: 0.06 }); const born = performance.now() - (d.hot ? 0 : 1e9);
  makeEdible(ctx, it, g, b.top, { mode: 'level', bites: 5, hunger: 0.6, sound: 'soft', crumb: 0xc84a2a, name: 'leftover pasta', verb: 'take a forkful', msg: 'Leftover pasta, even better the next day. 🍝', level: (f) => { b.top.scale.y = Math.max(0.05, f); b.top.position.y = 0.02 - (1 - f) * 0.012; } });
  ctx.tick(g, dt => steam.update(dt, it.d.left > 0 && (performance.now() - born) < 90000 ? 1 - (performance.now() - born) / 90000 : 0));
  return g;
});
const MEALS = { thai: 'pad thai', burger: 'burger', burrito: 'burrito' };
const mealKind = (label) => /burger/i.test(label || '') ? 'burger' : /burrito/i.test(label || '') ? 'burrito' : 'thai';
def('meal', 'Takeout meal', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(), d = it.d || (it.d = {}), k = MEALS[d.kind] ? d.kind : 'thai';
  if (k === 'burger') {
    const part = G(g);
    fmesh(part, puckGeo(0.055, 0.02, 24), FM(0xd9974a, 0.7));
    fmesh(part, wobbleGeo('patty', puckGeo(0.058, 0.017, 24), 0.04, 0.7), FM(0x4e2d1b, 0.9), 0, 0.02, 0);
    const ch = fmesh(part, slabGeo(0.1, 0.1, 0.003, 0.004), FM(0xf5b52e, 0.35), 0, 0.036, 0); ch.rotation.y = Math.PI / 4;
    fmesh(part, wobbleGeo('lettuce', puckGeo(0.064, 0.005, 24), 0.15, 3.3), FM(0x76c043, 0.6), 0, 0.039, 0);
    fmesh(part, puckGeo(0.046, 0.008, 20), FM(0xd23a2a, 0.4), 0, 0.044, 0);
    fmesh(part, domeGeo(0.057, 0.04), FM(0xd88d3f, 0.55), 0, 0.052, 0);
    const ses = FM(0xf3e6c8, 0.6); for (let i = 0; i < 12; i++) { const a = i * 2.4, r = 0.01 + (i % 4) * 0.011, y = 0.052 + 0.04 * Math.sqrt(Math.max(0, 1 - (r / 0.057) ** 2)); const s = fmesh(part, ballGeo(0.0025, 4, 3), ses, Math.cos(a) * r, y, Math.sin(a) * r); s.scale.set(1, 0.5, 1.6); s.rotation.y = a; }
    makeEdible(ctx, it, g, part, { bites: 5, hunger: 0.7, sound: 'soft', crumb: 0xd9974a, flesh: 0x9a5a34, name: 'burger', msg: 'That burger was perfect. 🍔' });
  } else if (k === 'burrito') {
    const part = G(g, 0, 0.036, 0);
    fmesh(part, fgeo('burrito', () => new THREE.CapsuleGeometry(0.034, 0.12, 6, 14).rotateX(Math.PI / 2)), FM(0xe9d29c, 0.8));
    const foil = fmesh(part, fgeo('foil', () => new THREE.CylinderGeometry(0.037, 0.037, 0.08, 18, 1, true).rotateX(Math.PI / 2)), new THREE.MeshStandardMaterial({ color: 0xd6d6d8, roughness: 0.3, metalness: 0.9, side: THREE.DoubleSide }), 0, 0, -0.045); foil.userData.noClip = true;
    makeEdible(ctx, it, g, part, { bites: 5, hunger: 0.7, sound: 'soft', crumb: 0xc8743a, flesh: 0xa55a2a, name: 'burrito', msg: 'Burrito: demolished. 🌯' });
  } else {
    const pail = FM(0xf4f1ea, 0.6); fmesh(g, fgeo('pail', () => new THREE.CylinderGeometry(0.065, 0.048, 0.085, 4, 1, true).rotateY(Math.PI / 4).translate(0, 0.0425, 0)), new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.6, side: THREE.DoubleSide }));
    C(g, 0.034, 0.034, 0.002, pail, 0, 0, 0, 4).rotation.y = Math.PI / 4;
    const top = G(g, 0, 0.06, 0); markDyn(top);
    fmesh(top, wobbleGeo('noodle', domeGeo(0.05, 0.03, 18, 7), 0.1, 0.4), FM(0xe1b56a, 0.5));
    const nd = FM(0xe9c27a, 0.45); for (let i = 0; i < 7; i++) { const t = fmesh(top, fgeo('noodleT', () => new THREE.TorusGeometry(0.02, 0.0035, 4, 12, Math.PI * 1.3)), nd, rand(-0.02, 0.02), 0.02 + rand(0, 0.01), rand(-0.02, 0.02)); t.rotation.set(Math.PI / 2 + rand(-0.4, 0.4), 0, rand(0, 6)); }
    const on = FM(0x6db04a, 0.6); for (let i = 0; i < 8; i++) { const c = fmesh(top, fgeo('onion', () => new THREE.CylinderGeometry(0.003, 0.003, 0.006, 6)), on, rand(-0.03, 0.03), 0.034, rand(-0.03, 0.03)); c.rotation.x = Math.PI / 2; }
    const lime = fmesh(top, wedgeGeo(0.022, 0.012, Math.PI * 0.6), FM(0x8cc04a, 0.4), 0.03, 0.02, 0.02); lime.rotation.set(0, 0.5, Math.PI / 2);
    makeEdible(ctx, it, g, top, { mode: 'level', bites: 5, hunger: 0.75, sound: 'soft', crumb: 0xe1b56a, name: 'pad thai', verb: 'take a bite of noodles', msg: 'Delicious pad thai. Totally worth it. 🥡', level: (f) => { top.scale.y = Math.max(0.05, f); top.position.y = 0.06 - (1 - f) * 0.03; } });
  }
  it.food.onFirst = () => ctx.need('fun', 0.05);
  return g;
});

def('pizza', 'Pizza box', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(), card = M(0xd8b98a, 0.9); B(g, 0.38, 0.03, 0.38, card, 0, 0, 0);
  const lid = G(g, 0, 0.045, -0.19); B(lid, 0.38, 0.012, 0.38, card, 0, 0, 0.19); B(lid, 0.18, 0.002, 0.08, M(0xb3141f), 0, 0.012, 0.19);
  const pie = G(g, 0, 0.03, 0); markDyn(pie); const slices = [];
  for (let i = 0; i < 8; i++) { const s = G(pie); pizzaSlice(s); s.children[0].position.z = 0; s.rotation.y = (i + 0.5) / 8 * TAU; slices.push(s); }
  const d = it.d || (it.d = {}); if (d.left == null) d.left = 8;
  const st = hinge(ctx, lid, 'x', -1.7, 'pizza box', 'click');
  ctx.interact(pie, {
    label: () => d.left > 0 ? 'Take a slice 🍕 (' + d.left + ' left)' : '',
    action: () => {
      if (d.left <= 0) return;
      if (!st.open) { st.open = true; Sfx.click(); return; }
      d.left--; Sfx.noise(0.2, 0.12, 900, 1); ctx.give('slice', { cold: false }, { rise: true });
      if (d.left === 0) ctx.msg('That was the last slice. The box can go now (press E to pick it up).');
    }
  });
  ctx.tick(g, () => slices.forEach((sl, i) => { const v = i < d.left; if (sl.visible !== v) sl.visible = v; }));
  it.handLabel = 'set it down to take a slice'; it.handUse = () => ctx.msg('Set the box down (right-click a counter), then right-click it for a slice.');
  return g;
});
def('takeout', 'Takeout bag', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(); B(g, 0.26, 0.3, 0.16, M(0xc9a27a, 0.95), 0, 0, 0); B(g, 0.26, 0.04, 0.16, M(0xa98a62, 0.95), 0, 0.3, 0);
  const lbl = (it.d && it.d.label) || 'Thai food';
  const tex = canvasTex(128, 64, (c) => { c.fillStyle = '#f6efe2'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#b3141f'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.fillText(lbl.toUpperCase(), 64, 38); });
  plane(g, 0.2, 0.1, M(0xffffff, 0.8, 0, { map: tex }), 0, 0.18, 0.081);
  const unpack = () => { Sfx.noise(0.5, 0.2, 2200, 0.8, 'bandpass', -1200); const kind = mealKind(lbl); ctx.removeItem(g); ctx.give('meal', { kind }, { rise: true }); ctx.msg('Unpacked your ' + MEALS[kind] + '. Left-click to eat.'); };
  ctx.interact(g, { label: 'Unpack your ' + lbl.toLowerCase() + ' 🥡', action: unpack });
  it.handLabel = 'unpack it'; it.handUse = unpack;
  return g;
});
