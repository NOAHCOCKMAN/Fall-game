// ---------- furniture & decor catalog ----------
// Each item: origin at bottom-center (floor/surface) or at wall contact point (wall). Front faces +z.
const CATALOG = {};
const _c1 = new THREE.Color(); // shared scratch color (avoids per-frame allocations)
const CATS = ['Seating', 'Tables', 'Storage', 'Beds', 'Lighting', 'Electronics', 'Kitchen', 'Decor', 'Wall art', 'Plants', 'Rugs', 'Holiday', 'Fun'];
function def(id, name, cat, opts, build) { CATALOG[id] = { id, name, cat, mount: 'floor', solid: true, small: false, ...opts, build }; }
const PALETTE = ['#f1ece2', '#d9cbb5', '#b9bcbc', '#8a9aa0', '#5b6b73', '#2e3a46', '#1f1f22', '#6b4a35', '#a4764d', '#c9a27a', '#7c8f6a', '#3e5c48', '#a35d5d', '#c98c8c', '#e3b8b8', '#b8a7d6', '#6c5b8f', '#d9b44a', '#e07a3f', '#4a7fb5'];

// ---- shared mechanics ----
function hinge(ctx, pivot, axis, angle, label, sound = 'door', onToggle) {
  const st = { open: false, v: 0 };
  ctx.interact(pivot, {
    label: () => (st.open ? 'Close ' : 'Open ') + label,
    action: () => { st.open = !st.open; sound === 'door' ? Sfx.door(st.open) : Sfx.click(); onToggle && onToggle(st.open); }
  });
  ctx.tick(pivot, dt => { const t = st.open ? 1 : 0; if (st.v === t) return; st.v += (t - st.v) * Math.min(1, dt * 7); if (Math.abs(t - st.v) < 0.002) st.v = t; pivot.rotation[axis] = angle * st.v; });
  return st;
}
function slider(ctx, obj, axis, dist, label) {
  const st = { open: false, v: 0 }, base = obj.position[axis];
  ctx.interact(obj, { label: () => (st.open ? 'Close ' : 'Open ') + label, action: () => { st.open = !st.open; Sfx.drawer(); } });
  ctx.tick(obj, dt => { const t = st.open ? 1 : 0; if (st.v === t) return; st.v += (t - st.v) * Math.min(1, dt * 8); if (Math.abs(t - st.v) < 0.002) st.v = t; obj.position[axis] = base + dist * st.v; });
  return st;
}
// drawer: returns group with front at z=d/2
function drawer(ctx, p, w, h, d, mat, x, y, z, handleMat, label = 'drawer', fill) {
  const g = G(p, x, y, z);
  B(g, w - 0.01, h - 0.01, 0.02, mat, 0, 0, d / 2 - 0.01);
  const inner = M(0xe8e2d6);
  B(g, w - 0.04, 0.01, d - 0.04, inner, 0, 0.01, 0); B(g, 0.01, h * 0.7, d - 0.04, inner, -w / 2 + 0.025, 0.01, 0); B(g, 0.01, h * 0.7, d - 0.04, inner, w / 2 - 0.025, 0.01, 0);
  B(g, w * 0.35, 0.012, 0.02, handleMat || M(0x222222, 0.4, 0.6), 0, h / 2 - 0.006, d / 2 + 0.01);
  if (fill) fill(g, w, h, d);
  slider(ctx, g, 'z', d * 0.7, label);
  return g;
}
function sitOn(ctx, mesh, label, seatY, fwd = 0.1, lie = false) {
  ctx.interact(mesh, {
    label, action: () => {
      const root = ctx.rootOf(mesh); const p = new THREE.Vector3(0, seatY, fwd); mesh.localToWorld(p);
      const q = new THREE.Quaternion(); mesh.getWorldQuaternion(q); const e = new THREE.Euler().setFromQuaternion(q, 'YXZ');
      ctx.sit(p, e.y + Math.PI, lie, root);
    }
  });
}
function pot(p, r, h, mat) { C(p, r, r * 0.8, h, mat); C(p, r * 0.92, r * 0.92, 0.01, M(0x3b2a1e), 0, h - 0.03, 0); }
function leafy(p, n, spread, h, color, y0 = 0, size = 0.09) {
  const m = M(color, 0.8);
  const geo = new THREE.SphereGeometry(size, 7, 5); geo.scale(1, 0.35, 0.6);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, rr = Math.random() * spread, yy = y0 + Math.random() * h;
    const l = new THREE.Mesh(geo, m); l.position.set(Math.cos(a) * rr, yy, Math.sin(a) * rr); l.rotation.set(rand(-0.6, 0.6), a, rand(-0.5, 0.5)); p.add(l);
  }
}
function frameArt(ctx, g, w, h, kind, seed, frameColor, mat = 0) {
  const fm = M(frameColor, 0.5, frameColor === 0xb08d57 ? 0.6 : 0);
  const fw = 0.035;
  B(g, w, fw, 0.035, fm, 0, -h / 2, 0.0175); B(g, w, fw, 0.035, fm, 0, h / 2 - fw, 0.0175);
  B(g, fw, h, 0.035, fm, -w / 2 + fw / 2, -h / 2, 0.0175); B(g, fw, h, 0.035, fm, w / 2 - fw / 2, -h / 2, 0.0175);
  if (mat) { plane(g, w - fw * 2, h - fw * 2, M(0xf7f5f0, 0.9), 0, 0, 0.012); plane(g, (w - fw * 2) * (1 - mat), (h - fw * 2) * (1 - mat), M(0xffffff, 0.8, 0, { map: artTex(kind, seed) }), 0, 0, 0.014); }
  else plane(g, w - fw * 2, h - fw * 2, M(0xffffff, 0.8, 0, { map: artTex(kind, seed) }), 0, 0, 0.012);
  B(g, w - 0.02, h - 0.02, 0.008, M(0x777777), 0, -h / 2 + 0.01, 0.002);
}
function screenCanvas(w, h) { const t = canvasTex(w, h, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }); return t; }

// ================= SEATING =================
def('sofa', 'Slipcovered sofa', 'Seating', { color: '#e9e2d4', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), c = M(it.c || '#e9e2d4', 0.97);
  B(g, 2.36, 0.4, 0.98, c, 0, 0, 0); // skirted base to the floor
  for (const s of [-1, 1]) { const arm = B(g, 0.2, 0.66, 0.98, c, s * 1.08, 0, 0); const roll = C(g, 0.11, 0.11, 0.98, c, s * 1.08, 0.55, 0, 16); roll.rotation.x = Math.PI / 2; roll.position.y = 0.62; }
  B(g, 2.16, 0.48, 0.26, c, 0, 0.4, -0.36);
  const seats = [];
  for (let i = -1; i <= 1; i += 2) { const s = B(g, 1.0, 0.16, 0.7, c, i * 0.5, 0.4, 0.1); seats.push(s); const bk = B(g, 1.0, 0.44, 0.2, c, i * 0.5, 0.5, -0.24); bk.rotation.x = -0.12; }
  const pil = (w, h, d, mat, x, y, z, rx, ry) => { const p = B(g, w, h, d, mat, x, y, z); p.rotation.set(rx, ry, 0); return p; };
  const velvet = M(0xffffff, 1, 0, { map: getTex('velvet') }), toile = M(0xffffff, 0.95, 0, { map: getTex('toile') }), lumbar = M(0xffffff, 0.95, 0, { map: getTex('treepillow') }), cream = M(0xece6da, 0.95);
  pil(0.48, 0.48, 0.14, velvet, -0.88, 0.5, -0.12, -0.25, 0.15); pil(0.46, 0.46, 0.13, toile, -0.52, 0.52, -0.06, -0.3, 0.2);
  pil(0.62, 0.26, 0.13, lumbar, -0.05, 0.56, -0.08, -0.2, 0); pil(0.46, 0.46, 0.13, toile, 0.35, 0.52, -0.08, -0.28, -0.12);
  pil(0.46, 0.46, 0.13, velvet, 0.62, 0.55, -0.18, -0.2, -0.1); pil(0.42, 0.4, 0.13, cream, 0.88, 0.5, -0.1, -0.25, -0.2);
  const fur = S(g, 0.32, M(0x8f8378, 1), -1.02, 0.68, -0.15, 12, 8); fur.scale.set(0.6, 0.35, 1.3);
  seats.forEach((s) => sitOn(ctx, s, 'Sit on sofa', 0.2, 0.25));
  return g;
});
def('coffee_marble', 'Marble coffee table', 'Tables', { color: '#3a2620', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), wood = M(it.c || '#3a2620', 0.45);
  const sh = new THREE.Shape(); const N = 64;
  for (let i = 0; i <= N; i++) { const a = i / N * TAU; const r = 1 + 0.06 * Math.cos(a * 4) - 0.05 * Math.cos(a * 2); const x = Math.cos(a) * 0.55 * r, y = Math.sin(a) * 0.36 * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }); geo.rotateX(-Math.PI / 2);
  const tex = getTex('marble'); const top = new THREE.Mesh(geo, M(0xffffff, 0.2, 0, { map: tex })); top.position.y = 0.44; g.add(top);
  const pa = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < pa.count; i++) uv.setXY(i, pa.getX(i) + 0.5, pa.getZ(i) + 0.5);
  B(g, 0.9, 0.06, 0.55, wood, 0, 0.38, 0);
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 16, Math.PI * 0.7), wood); leg.position.set(sx * 0.32, 0.2, 0); leg.rotation.set(0, sx > 0 ? 0 : Math.PI, Math.PI * 0.15); g.add(leg); for (const sz of [-1, 1]) C(g, 0.025, 0.035, 0.4, wood, sx * 0.36, 0, sz * 0.2, 8); }
  B(g, 0.6, 0.03, 0.04, wood, 0, 0.12, 0);
  return g;
});
def('tray_trees', 'Tray with paper trees', 'Holiday', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.17, 0.16, 0.02, M(0xc9c4b8, 0.25, 0.9), 0, 0, 0, 28); T(g, 0.17, 0.01, M(0xb08d57, 0.3, 0.8), 0, 0.02, 0).rotation.x = Math.PI / 2;
  const pm = M(0x2c4a35, 0.8); for (const [x, z, h] of [[-0.04, 0.02, 0.3], [0.07, -0.03, 0.22]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(h * 0.3, h, 12), pm); c.position.set(x, 0.02 + h / 2, z); g.add(c); }
  return g;
});
def('albums', 'Wedding albums', 'Decor', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); const a1 = B(g, 0.3, 0.025, 0.3, M(0xf6f4ef, 0.6), 0, 0, 0); a1.rotation.y = 0.25; const a2 = B(g, 0.28, 0.025, 0.28, M(0xe8d9cf, 0.8), 0.04, 0.025, 0.03); a2.rotation.y = 0.05;
  ctx.interact(g, { label: 'Look through the wedding album 💍', action: () => { ctx.msg('Page after page of the best day. 🤍'); ctx.task('read'); } }); return g;
});
def('sectional', 'Sectional (L)', 'Seating', { color: '#b9bcbc', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), c = M(it.c || '#b9bcbc', 0.95);
  B(g, 2.6, 0.4, 0.95, c, 0, 0.05, 0); B(g, 0.95, 0.4, 1.0, c, 0.825, 0.05, 0.97);
  B(g, 2.6, 0.45, 0.22, c, 0, 0.45, -0.37); B(g, 0.2, 0.3, 0.95, c, -1.2, 0.45, 0);
  for (let i = 0; i < 3; i++) { const s = B(g, 0.8, 0.12, 0.7, c, -0.85 + i * 0.85, 0.45, 0.1); sitOn(ctx, s, 'Sit', 0.15, 0.1); }
  const s = B(g, 0.85, 0.12, 0.95, c, 0.825, 0.45, 0.95); sitOn(ctx, s, 'Stretch out on chaise', 0.15, 0.1);
  return g;
});
def('armchair', 'Swivel chair', 'Seating', { color: '#b8bec3', colorable: true, shrink: 0.15 }, (ctx, it) => {
  const g = new THREE.Group(), c = M(it.c || '#b8bec3', 0.95);
  const top = G(g);
  C(top, 0.38, 0.36, 0.2, c, 0, 0.18, 0, 24);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.38, 0.42, 24, 1, true, Math.PI * 0.5, Math.PI * 1.2), c);
  back.material.side = THREE.DoubleSide; back.position.y = 0.58; back.rotation.y = Math.PI; top.add(back);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.06, 8, 24, Math.PI * 1.2), c); rim.rotation.set(Math.PI / 2, 0, Math.PI * 0.4 + Math.PI); rim.position.y = 0.79; top.add(rim);
  const cush = C(top, 0.33, 0.33, 0.1, c, 0, 0.38, 0.03, 24);
  C(g, 0.18, 0.2, 0.18, M(0x9aa0a4), 0, 0, 0, 16);
  sitOn(ctx, cush, 'Sit in swivel chair', 0.15, 0.0);
  ctx.interact(top, { label: 'Spin chair', action: () => { top.userData.spin = 8; Sfx.noise(0.6, 0.06, 400, 2); } });
  ctx.tick(top, dt => { if (top.userData.spin > 0) { top.rotation.y += top.userData.spin * dt; top.userData.spin -= dt * 6; } });
  return g;
});
def('barstool', 'Bar stool', 'Seating', { color: '#efe8dc', colorable: true , solid: false }, (ctx, it) => {
  const g = new THREE.Group(), c = M(it.c || '#efe8dc', 0.9), mt = M(0x3b2b20, 0.5, 0.2);
  for (const [x, z] of [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]]) { const l = C(g, 0.014, 0.014, 0.66, mt, x, 0, z, 6); l.rotation.set(z * 0.3, 0, -x * 0.3); }
  B(g, 0.36, 0.015, 0.015, mt, 0, 0.25, 0.16); B(g, 0.36, 0.015, 0.015, mt, 0, 0.25, -0.16);
  const seat = B(g, 0.46, 0.09, 0.42, c, 0, 0.64, 0);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.26, 20, 1, true, Math.PI * 0.6, Math.PI * 0.8), c);
  back.material.side = THREE.DoubleSide; back.position.set(0, 0.86, 0.06); back.rotation.y = Math.PI; g.add(back);
  sitOn(ctx, seat, 'Sit on stool', 0.1, 0.0);
  return g;
});
def('dining_chair', 'Dining chair', 'Seating', { color: '#8a6446', colorable: true , solid: false }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#8a6446', 0.6);
  for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) B(g, 0.04, 0.45, 0.04, w, x, 0, z);
  const s = B(g, 0.46, 0.05, 0.46, w, 0, 0.45, 0);
  B(g, 0.04, 0.5, 0.04, w, -0.2, 0.5, -0.2); B(g, 0.04, 0.5, 0.04, w, 0.2, 0.5, -0.2); B(g, 0.44, 0.14, 0.03, w, 0, 0.82, -0.2); B(g, 0.44, 0.04, 0.03, w, 0, 0.62, -0.2);
  sitOn(ctx, s, 'Sit', 0.05, 0);
  return g;
});
def('office_chair', 'Desk chair (tucks under)', 'Seating', { color: '#2b2d31', colorable: true, solid: false }, (ctx, it) => {
  const g0 = new THREE.Group(), g = G(g0), c = M(it.c || '#2b2d31', 0.8), mt = M(0x777b80, 0.3, 0.8);
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; const l = B(g, 0.04, 0.03, 0.3, mt, Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15); l.rotation.y = a; S(g, 0.03, M(0x111111), Math.sin(a) * 0.3, 0.03, Math.cos(a) * 0.3, 8, 6); }
  C(g, 0.025, 0.025, 0.4, mt, 0, 0.08, 0, 8);
  const top = G(g, 0, 0.45, 0);
  const s = B(top, 0.5, 0.08, 0.48, c, 0, 0, 0); B(top, 0.46, 0.5, 0.06, c, 0, 0.12, -0.25).rotation.x = -0.1;
  // tucked under the desk; slides out when you sit, rolls back in when you get up
  const st = { out: 0 };
  const sit = { label: 'Pull out the chair and sit', action: () => { g.position.z = -0.5; g.updateMatrixWorld(true); const p = V3(0, 0.5, 0.05); top.localToWorld(p); const q = new THREE.Quaternion(); g0.getWorldQuaternion(q); const e = new THREE.Euler().setFromQuaternion(q, 'YXZ'); ctx.sit(p, e.y + Math.PI, false, g0); st.out = 1; Sfx.noise(0.4, 0.12, 600, 1); } };
  ctx.interact(g0, sit);
  ctx.tick(g, dt => { const sitting = ctx.sittingOn && ctx.sittingOn() === g0; if (st.out && !sitting) { st.out = 0; Sfx.noise(0.4, 0.1, 600, 1); } g.position.z = lerp(g.position.z, sitting ? -0.5 : 0, Math.min(1, dt * 6)); });
  return g0;
});
def('beanbag', 'Bean bag', 'Seating', { color: '#c98c8c', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); const s = S(g, 0.45, M(it.c || '#c98c8c', 1), 0, 0.3, 0, 20, 14); s.scale.set(1, 0.65, 1);
  sitOn(ctx, s, 'Flop onto bean bag', -0.05, 0.1); return g;
});
def('ottoman', 'Pouf', 'Seating', { color: '#d9cbb5', colorable: true , solid: false }, (ctx, it) => {
  const g = new THREE.Group(); const s = C(g, 0.26, 0.26, 0.4, M(it.c || '#d9cbb5', 1), 0, 0, 0, 24); sitOn(ctx, s, 'Sit on pouf', 0.2, 0); return g;
});
def('bench', 'Entry bench', 'Seating', { color: '#a4764d', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#a4764d', 0.6);
  const s = B(g, 1.1, 0.05, 0.38, w, 0, 0.42, 0); B(g, 0.05, 0.42, 0.36, w, -0.5, 0, 0); B(g, 0.05, 0.42, 0.36, w, 0.5, 0, 0); B(g, 1.0, 0.03, 0.33, w, 0, 0.12, 0);
  sitOn(ctx, s, 'Sit on bench', 0.05, 0); return g;
});

// ================= TABLES =================
def('coffee_round', 'Round coffee table', 'Tables', { color: '#f4f2ee', colorable: true }, (ctx, it) => {
  const g = new THREE.Group();
  C(g, 0.48, 0.48, 0.05, M(it.c || '#f4f2ee', 0.35), 0, 0.38, 0, 40);
  const base = M(0x3d2c22, 0.6);
  C(g, 0.09, 0.2, 0.36, base, 0, 0.02, 0, 16); C(g, 0.26, 0.28, 0.03, base, 0, 0, 0, 24);
  return g;
});
def('bistro_table', 'Bistro table', 'Tables', { color: '#6a3b2a', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#6a3b2a', 0.45);
  C(g, 0.4, 0.4, 0.035, w, 0, 0.7, 0, 32); C(g, 0.05, 0.07, 0.68, w, 0, 0.02, 0, 12);
  for (let i = 0; i < 3; i++) { const l = B(g, 0.05, 0.05, 0.42, w, Math.sin(i * TAU / 3) * 0.17, 0.0, Math.cos(i * TAU / 3) * 0.17); l.rotation.y = i * TAU / 3; }
  return g;
});
def('dining_table', 'Dining table', 'Tables', { color: '#a4764d', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#a4764d', 0.5);
  B(g, 1.6, 0.04, 0.9, w, 0, 0.72, 0); for (const x of [-0.72, 0.72]) for (const z of [-0.37, 0.37]) B(g, 0.06, 0.72, 0.06, w, x, 0, z);
  return g;
});
def('desk', 'Walnut desk', 'Tables', { color: '#4a2f22', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#4a2f22', 0.45);
  B(g, 1.2, 0.04, 0.55, w, 0, 0.72, 0); B(g, 0.04, 0.72, 0.55, w, -0.58, 0, 0); B(g, 0.04, 0.72, 0.55, w, 0.58, 0, 0); B(g, 1.12, 0.3, 0.02, w, 0, 0.42, -0.26);
  drawer(ctx, g, 0.5, 0.08, 0.45, w, 0.25, 0.63, 0.02, M(0xb08d57, 0.3, 0.8), 'desk drawer', (d) => { B(d, 0.15, 0.01, 0.2, M(0xffffff), -0.1, 0.02, 0); C(d, 0.004, 0.004, 0.14, M(0xd9a21c), 0.1, 0.02, 0).rotation.z = Math.PI / 2; });
  return g;
});
def('media_console', 'Media console', 'Tables', { color: '#c9a27a', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#c9a27a', 0.6), wov = M(0xffffff, 0.9, 0, { map: getTex('woven') });
  B(g, 1.8, 0.03, 0.45, w, 0, 0.6, 0); B(g, 1.8, 0.03, 0.45, w, 0, 0.08, 0); B(g, 0.03, 0.55, 0.45, w, -0.885, 0.08, 0); B(g, 0.03, 0.55, 0.45, w, 0.885, 0.08, 0); B(g, 1.78, 0.52, 0.02, w, 0, 0.09, -0.21);
  for (const x of [-0.8, 0.8]) for (const z of [-0.18, 0.18]) B(g, 0.04, 0.08, 0.04, w, x, 0, z);
  for (let i = 0; i < 4; i++) {
    const x0 = -0.87 + i * 0.435, s = i % 2 ? 1 : -1, hx = s < 0 ? x0 : x0 + 0.435;
    const piv = G(g, hx, 0.11, 0.225); const dd = B(piv, 0.43, 0.48, 0.02, wov, -s * 0.215, 0, 0.0); B(piv, 0.015, 0.1, 0.02, M(0x222222), -s * 0.38, 0.2, 0.02);
    hinge(ctx, piv, 'y', s * 1.6, 'cabinet', 'click');
  }
  B(g, 0.35, 0.06, 0.25, M(0x111111, 0.4), -0.5, 0.12, 0); // router/console inside
  return g;
});
def('nightstand', 'Nightstand', 'Tables', { color: '#d1b17f', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#d1b17f', 0.6);
  B(g, 0.5, 0.03, 0.4, w, 0, 0.6, 0); B(g, 0.03, 0.6, 0.4, w, -0.235, 0, 0); B(g, 0.03, 0.6, 0.4, w, 0.235, 0, 0); B(g, 0.44, 0.6, 0.02, w, 0, 0, -0.19); B(g, 0.44, 0.02, 0.38, w, 0, 0.06, 0);
  drawer(ctx, g, 0.44, 0.18, 0.36, w, 0, 0.4, 0.01, M(0x2b2b2b, 0.4, 0.6), 'drawer', (d) => { B(d, 0.12, 0.03, 0.18, M(0x9b3b3b), -0.1, 0.01, 0); B(d, 0.08, 0.01, 0.12, M(0x333333), 0.1, 0.01, 0); });
  drawer(ctx, g, 0.44, 0.18, 0.36, w, 0, 0.2, 0.01, M(0x2b2b2b, 0.4, 0.6), 'drawer');
  return g;
});
def('sideboard', 'Dark sideboard', 'Tables', { color: '#4a2c1f', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#4a2c1f', 0.45);
  B(g, 1.4, 0.03, 0.45, w, 0, 0.85, 0); B(g, 1.4, 0.75, 0.43, w, 0, 0.1, -0.01);
  for (const x of [-0.66, 0.66]) for (const z of [-0.18, 0.18]) C(g, 0.025, 0.02, 0.1, w, x, 0, z, 8);
  for (let i = 0; i < 3; i++) {
    const x0 = -0.69 + i * 0.46; const piv = G(g, x0, 0.12, 0.215);
    B(piv, 0.45, 0.7, 0.02, w, 0.225, 0, 0); B(piv, 0.35, 0.55, 0.005, M(0x6b4532, 0.3), 0.225, 0.07, 0.011); B(piv, 0.015, 0.1, 0.03, M(0xb08d57, 0.3, 0.8), 0.41, 0.33, 0.02);
    hinge(ctx, piv, 'y', -1.7, 'cabinet', 'click');
  }
  return g;
});
def('side_table', 'Side table', 'Tables', { color: '#1f1f22', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#1f1f22', 0.4, 0.3);
  C(g, 0.24, 0.24, 0.03, w, 0, 0.52, 0, 24); C(g, 0.02, 0.02, 0.52, w, 0, 0, 0, 8); C(g, 0.18, 0.18, 0.02, w, 0, 0, 0, 20);
  return g;
});

// ================= STORAGE =================
def('arched_cabinet', 'Arched cabinet', 'Storage', { color: '#cfae7c', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#cfae7c', 0.6), glass = M(0xddeeff, 0.05, 0, { transparent: true, opacity: 0.18 });
  const W = 1.0, D = 0.42, H = 1.75;
  B(g, W, 0.05, D, w, 0, 0.08, 0); B(g, 0.04, H - 0.1, D, w, -W / 2 + 0.02, 0.08, 0); B(g, 0.04, H - 0.1, D, w, W / 2 - 0.02, 0.08, 0); B(g, W, H, 0.02, w, 0, 0.08, -D / 2 + 0.01);
  const ag = new THREE.CylinderGeometry(W / 2, W / 2, D, 24, 1, false, -Math.PI / 2, Math.PI); ag.rotateX(-Math.PI / 2);
  const arch = new THREE.Mesh(ag, w); arch.position.set(0, H - 0.02, 0); g.add(arch);
  for (const sy of [0.6, 1.05, 1.45]) B(g, W - 0.08, 0.02, D - 0.04, w, 0, sy, 0);
  // stuff on shelves
  const cols = [0xd9c7a0, 0x7c4a5e, 0x5b7b6b, 0xe7e1d6, 0x9c3b3b, 0x384a5c];
  for (const sy of [0.62, 1.07]) for (let i = 0; i < 6; i++) B(g, 0.1, rand(0.12, 0.3), 0.18, M(cols[(Math.random() * 6) | 0], 0.8), -0.38 + i * 0.15, sy, rand(-0.05, 0.05));
  C(g, 0.06, 0.05, 0.18, M(0xe7e1d6, 0.3), 0, 1.47, 0);
  for (const s of [-1, 1]) {
    const piv = G(g, s * (W / 2 - 0.04), 0.48, D / 2);
    const fr = M(it.c || '#cfae7c', 0.6);
    B(piv, 0.03, 1.27, 0.025, fr, -s * 0.015, 0, 0); B(piv, 0.03, 1.27, 0.025, fr, -s * 0.445, 0, 0); B(piv, 0.46, 0.03, 0.025, fr, -s * 0.23, 0, 0); B(piv, 0.46, 0.03, 0.025, fr, -s * 0.23, 1.24, 0);
    B(piv, 0.42, 1.22, 0.006, glass, -s * 0.23, 0.02, 0); B(piv, 0.015, 0.08, 0.03, M(0xb08d57, 0.3, 0.8), -s * 0.42, 0.55, 0.02);
    hinge(ctx, piv, 'y', s * 1.5, 'glass door', 'click');
  }
  drawer(ctx, g, 0.46, 0.2, D - 0.04, w, -0.23, 0.18, 0.0, M(0xb08d57, 0.3, 0.8), 'drawer');
  drawer(ctx, g, 0.46, 0.2, D - 0.04, w, 0.23, 0.18, 0.0, M(0xb08d57, 0.3, 0.8), 'drawer');
  for (const x of [-0.42, 0.42]) B(g, 0.05, 0.08, 0.05, w, x, 0, 0);
  return g;
});
def('dresser', 'Dresser', 'Storage', { color: '#d1b17f', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#d1b17f', 0.6);
  B(g, 1.4, 0.03, 0.48, w, 0, 0.8, 0); B(g, 0.03, 0.72, 0.48, w, -0.685, 0.08, 0); B(g, 0.03, 0.72, 0.48, w, 0.685, 0.08, 0); B(g, 1.36, 0.72, 0.02, w, 0, 0.08, -0.23);
  for (const x of [-0.6, 0.6]) for (const z of [-0.2, 0.2]) B(g, 0.05, 0.08, 0.05, w, x, 0, z);
  const clothes = [0xe3b8b8, 0x2e3a46, 0xf1ece2, 0x7c8f6a, 0x1f1f22];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) drawer(ctx, g, 0.67, 0.23, 0.44, w, -0.34 + c * 0.68, 0.09 + r * 0.24, 0.01, M(0x2b2b2b, 0.4, 0.6), 'drawer', (d) => { for (let k = 0; k < 3; k++) B(d, 0.18, 0.05, 0.3, M(clothes[(Math.random() * 5) | 0], 1), -0.2 + k * 0.2, 0.01, 0); });
  return g;
});
def('bookshelf', 'Bookshelf', 'Storage', { color: '#f1ece2', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), w = M(it.c || '#f1ece2', 0.6);
  B(g, 0.9, 1.8, 0.02, w, 0, 0, -0.14); B(g, 0.03, 1.8, 0.3, w, -0.435, 0, 0); B(g, 0.03, 1.8, 0.3, w, 0.435, 0, 0);
  for (let s = 0; s < 5; s++) { B(g, 0.87, 0.025, 0.3, w, 0, s * 0.43 + 0.02, 0); let x = -0.41; if (s < 4) while (x < 0.38) { const bw = rand(0.025, 0.05), bh = rand(0.2, 0.33); const b = B(g, bw, bh, 0.2, M(new THREE.Color().setHSL(Math.random(), 0.4, rand(0.3, 0.6)), 0.8), x + bw / 2, s * 0.43 + 0.045, 0.02); x += bw + 0.003; if (Math.random() < 0.08) x += 0.1; } }
  ctx.interact(g, { label: 'Read a book', action: () => { ctx.msg(['"The leaves fell like little notes from the trees."', 'You read a chapter. Cozy.', 'You find a pressed maple leaf inside.'][(Math.random() * 3) | 0]); ctx.task('read'); Sfx.noise(0.2, 0.1, 3000, 1); } });
  return g;
});
def('basket', 'Woven basket', 'Storage', { color: '#b48c58' , solid: false }, (ctx, it) => {
  const g = new THREE.Group(), wv = M(0xffffff, 0.95, 0, { map: getTex('woven') });
  C(g, 0.2, 0.17, 0.42, wv, 0, 0, 0, 20); const lid = G(g, 0, 0.42, -0.2); C(lid, 0.21, 0.21, 0.04, wv, 0, 0, 0.2, 20);
  B(g, 0.2, 0.15, 0.2, M(0xd9cbb5, 1), 0, 0.27, 0);
  hinge(ctx, lid, 'x', -1.4, 'basket lid', 'click'); return g;
});
def('storage_bin', 'Storage tote', 'Storage', { color: '#1f1f22' }, (ctx, it) => {
  const g = new THREE.Group(); B(g, 0.75, 0.38, 0.5, M(0x1f1f22, 0.6), 0, 0, 0);
  const lid = G(g, 0, 0.38, -0.25); B(lid, 0.8, 0.05, 0.55, M(0xf2c418, 0.5), 0, 0, 0.25);
  hinge(ctx, lid, 'x', -1.6, 'tote lid', 'click'); B(g, 0.3, 0.1, 0.2, M(0x7c4a2e), -0.1, 0.05, 0); return g;
});
def('hamper', 'Laundry hamper', 'Storage', { color: '#d9cbb5' , solid: false }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.22, 0.2, 0.6, M(0xffffff, 1, 0, { map: getTex('woven') }), 0, 0, 0, 16); S(g, 0.18, M(0xe3b8b8, 1), 0, 0.58, 0, 10, 8).scale.y = 0.4; return g;
});

// ================= BEDS =================
def('bed', 'Queen bed (cane)', 'Beds', { color: '#f4f1ea', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), wood = M(0xcfae7c, 0.6), cane = M(0xffffff, 0.9, 0, { map: getTex('cane') });
  B(g, 1.66, 0.28, 2.1, wood, 0, 0.05, 0); for (const x of [-0.78, 0.78]) for (const z of [-1, 1]) B(g, 0.06, 0.06, 0.06, wood, x, 0, z);
  // headboard
  B(g, 1.7, 1.2, 0.08, wood, 0, 0.05, -1.07);
  const hb = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.6), cane); hb.position.set(0, 0.95, -1.025); g.add(hb);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 32, 1, false, -Math.PI / 2, Math.PI), wood); top.geometry.rotateX(Math.PI / 2); top.geometry.rotateZ(Math.PI / 2); top.scale.y = 0.18; top.position.set(0, 1.24, -1.07); g.add(top);
  const mat = B(g, 1.56, 0.28, 2.0, M(0xffffff, 0.9), 0, 0.33, 0.02);
  const duvet = B(g, 1.66, 0.12, 1.55, M(it.c || '#f4f1ea', 1), 0, 0.55, 0.26);
  B(g, 1.68, 0.13, 0.5, M(0xffffff, 1, 0, { map: getTex('blanket') }), 0, 0.555, 0.75);
  for (const x of [-0.42, 0.42]) { const p = B(g, 0.66, 0.42, 0.18, M(0xefe7d8, 1), x, 0.6, -0.85); p.rotation.x = -0.25; const f = B(g, 0.5, 0.38, 0.12, M(0xffffff, 1, 0, { map: getTex('floral') }), x, 0.6, -0.68); f.rotation.x = -0.2; }
  ctx.interact(g, { label: () => ctx.isNight() ? 'Sleep until morning' : 'Take a nap (until evening)', action: () => { ctx.sleep(g); } });
  return g;
});
def('daybed', 'Daybed', 'Beds', { color: '#e3b8b8', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), fr = M(0x1f1f22, 0.4, 0.5);
  B(g, 2.0, 0.35, 0.95, fr, 0, 0.05, 0); B(g, 2.0, 0.6, 0.04, fr, 0, 0.4, -0.45); B(g, 0.04, 0.45, 0.95, fr, -1, 0.4, 0); B(g, 0.04, 0.45, 0.95, fr, 1, 0.4, 0);
  const m = B(g, 1.92, 0.15, 0.9, M(it.c || '#e3b8b8', 1), 0, 0.4, 0); sitOn(ctx, m, 'Lounge on daybed', 0.1, 0); return g;
});

// ================= LIGHTING =================
def('lamp_table', 'Scalloped lamp', 'Lighting', { mount: 'surface', solid: false, small: true, color: '#3f4f45', colorable: true }, (ctx, it) => {
  const g = new THREE.Group();
  const base = S(g, 0.09, M(it.c || '#3f4f45', 0.25), 0, 0.12, 0, 16, 12); base.scale.y = 1.3;
  C(g, 0.012, 0.012, 0.16, M(0xb08d57, 0.3, 0.8), 0, 0.22, 0, 6);
  const shadeMat = M(0xfffaf0, 0.9, 0, { side: THREE.DoubleSide, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const sg = new THREE.CylinderGeometry(0.09, 0.2, 0.2, 20, 1, true); const pa = sg.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i), y = pa.getY(i); if (y < 0) { const a = Math.atan2(z, x); const k = 1 + 0.08 * Math.cos(a * 10); pa.setX(i, x * k); pa.setZ(i, z * k); } }
  sg.computeVertexNormals();
  const shade = new THREE.Mesh(sg, shadeMat); shade.position.y = 0.42; g.add(shade);
  const L = ctx.light(g, 0xffd6a0, 0, 4.5, 0, 0.4, 0);
  const st = { on: !!(it.d && it.d.on) };
  ctx.interact(g, { label: () => st.on ? 'Turn lamp off' : 'Turn lamp on', action: () => { st.on = !st.on; it.d = { ...(it.d || {}), on: st.on }; Sfx.click(); } });
  ctx.tick(g, () => { const on = st.on && ctx.power(); L.intensity = on ? 2.2 : 0; shadeMat.emissiveIntensity = on ? 0.9 : 0; });
  return g;
});
def('floor_lamp', 'Arc floor lamp', 'Lighting', { color: '#b08d57', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), mt = M(it.c || '#b08d57', 0.3, 0.8);
  C(g, 0.16, 0.18, 0.04, M(0x2b2b2b, 0.3), 0, 0, 0, 24);
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.012, 6, 30, Math.PI * 0.6), mt); arc.position.set(0.55, 1.3, 0); arc.rotation.z = Math.PI * 0.2; g.add(arc);
  C(g, 0.012, 0.012, 1.3, mt, 0, 0.04, 0, 6);
  const shadeMat = M(0xf4efe4, 0.8, 0, { side: THREE.DoubleSide, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 0.2, 20, 1, true), shadeMat); sh.position.set(0.95, 1.55, 0); g.add(sh);
  const L = ctx.light(g, 0xffd6a0, 0, 5, 0.95, 1.4, 0); const st = { on: false };
  ctx.interact(g, { label: () => st.on ? 'Turn lamp off' : 'Turn lamp on', action: () => { st.on = !st.on; Sfx.click(); } });
  ctx.tick(g, () => { const on = st.on && ctx.power(); L.intensity = on ? 3 : 0; shadeMat.emissiveIntensity = on ? 0.9 : 0; });
  return g;
});
def('candle', 'Candle', 'Lighting', { mount: 'surface', solid: false, small: true, color: '#f1ece2' }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.04, 0.04, 0.1, M(0xf1ece2, 0.6), 0, 0, 0, 16); C(g, 0.045, 0.045, 0.06, M(0x9c3b3b, 0.3, 0, { transparent: true, opacity: 0.6 }), 0, 0, 0, 16);
  const fl = S(g, 0.012, E(0xffb347, 2), 0, 0.125, 0, 8, 6); fl.scale.y = 2;
  const st = { on: true };
  ctx.interact(g, { label: () => st.on ? 'Blow out candle' : 'Light candle', action: () => { st.on = !st.on; st.on ? Sfx.noise(0.2, 0.2, 2000, 1) : Sfx.noise(0.3, 0.1, 600, 1); } });
  ctx.tick(g, (dt, t) => { fl.visible = st.on; fl.scale.set(1 + Math.sin(t * 23) * 0.15, 2 + Math.sin(t * 17) * 0.3, 1); });
  return g;
});
def('string_lights', 'String lights', 'Lighting', { mount: 'wall', solid: false, color: '#ffd27a' }, (ctx, it) => {
  const g = new THREE.Group(); const bulbs = [];
  for (let i = 0; i < 16; i++) { const x = -1 + i * 0.133, y = -Math.sin(i / 15 * Math.PI) * 0.18; const b = S(g, 0.018, E(0xffd27a, 1.5), x, y, 0.03, 8, 6); bulbs.push(b); }
  const st = { on: true }; ctx.interact(g, { label: () => st.on ? 'Turn off string lights' : 'Turn on string lights', action: () => { st.on = !st.on; Sfx.click(); } });
  ctx.tick(g, (dt, t) => bulbs.forEach((b, i) => { b.material.emissiveIntensity = (st.on && ctx.power()) ? 1 + Math.sin(t * 2 + i) * 0.5 : 0; }));
  return g;
});

// ================= ELECTRONICS =================
function tvDraw(g, w, h, ch, t) {
  if (ch === 1) { // fireplace
    g.fillStyle = '#120804'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { const x = w * 0.2 + Math.random() * w * 0.6, fh = h * (0.2 + Math.random() * 0.45); const gr = g.createLinearGradient(0, h, 0, h - fh); gr.addColorStop(0, 'rgba(255,200,80,.9)'); gr.addColorStop(0.5, 'rgba(255,110,20,.6)'); gr.addColorStop(1, 'rgba(120,20,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, h - fh / 2 - h * 0.12, 14, fh / 2, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#3a2216'; g.fillRect(w * 0.18, h * 0.84, w * 0.64, h * 0.08);
  } else if (ch === 2) { // nature: falling leaves
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8ec5ff'); gr.addColorStop(1, '#f2d7a8'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4e6b3a'; g.fillRect(0, h * 0.8, w, h * 0.2);
    for (let i = 0; i < 30; i++) { const x = (i * 97 + t * 30 * (1 + i % 3)) % w, y = (i * 53 + t * 40 * (1 + i % 2)) % h; g.fillStyle = ['#d9622b', '#e8a23a', '#b83a26', '#e3c14b'][i % 4]; g.save(); g.translate(x, y); g.rotate(t * 2 + i); g.beginPath(); g.ellipse(0, 0, 9, 5, 0, 0, TAU); g.fill(); g.restore(); }
    g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText('AUTUMN • LIVE', 16, 30);
  } else if (ch === 3) { // news
    g.fillStyle = '#163a6b'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8eef7'; g.fillRect(w * 0.3, h * 0.15, w * 0.4, h * 0.55);
    g.fillStyle = '#c9a27a'; g.beginPath(); g.arc(w * 0.5, h * 0.33, 34, 0, TAU); g.fill(); g.fillStyle = '#2e3a46'; g.fillRect(w * 0.4, h * 0.45, w * 0.2, h * 0.25);
    g.fillStyle = '#c0262d'; g.fillRect(0, h * 0.78, w, h * 0.1); g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; const txt = 'WEATHER: CRISP & SUNNY 58°F • LEAF PEEPING AT PEAK THIS WEEKEND • PUMPKIN SPICE SALES SOAR • '; g.fillText(txt + txt, w - ((t * 80) % (w * 3)), h * 0.85);
    g.fillStyle = '#0d2142'; g.fillRect(0, h * 0.88, w, h * 0.12); g.fillStyle = '#fff'; g.fillText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 12, h * 0.96);
  } else if (ch === 4) { // music visualizer / game
    g.fillStyle = '#1a1030'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 24; i++) { const bh = (Math.sin(t * 3 + i * 0.7) * 0.5 + 0.5) * h * 0.6 + 10; g.fillStyle = `hsl(${(i * 15 + t * 40) % 360},80%,60%)`; g.fillRect(i * (w / 24) + 2, h - bh, w / 24 - 4, bh); }
    g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText('♫ lo-fi fall beats', 16, 30);
  }
}
def('tv', 'Wall TV 55"', 'Electronics', { mount: 'wall', solid: false }, (ctx, it) => {
  const g = new THREE.Group();
  B(g, 1.24, 0.72, 0.05, M(0x111111, 0.4, 0.2), 0, -0.36, 0.035);
  const tex = screenCanvas(512, 288); const sm = new THREE.MeshBasicMaterial({ map: getTex('tvoff') });
  const scr = plane(g, 1.2, 0.68, sm, 0, 0, 0.061);
  B(g, 0.3, 0.2, 0.03, M(0x222222), 0, -0.1, 0.0);
  const st = { ch: 0, acc: 0 };
  ctx.interact(g, {
    reach: 9, label: () => st.ch === 0 ? 'Turn on TV' : st.ch < 4 ? 'Next channel (' + (st.ch + 1) + '/4)' : 'Turn off TV',
    action: () => { st.ch = (st.ch + 1) % 5; Sfx.click(); if (st.ch) ctx.task('tv'); if (st.ch === 4) { st.mus = Sfx.music(g.getWorldPosition(V3()), 1); } else if (st.mus) { st.mus.stop(); st.mus = null; } if (st.ch === 1) { st.fire = Sfx.loop('fire', g.getWorldPosition(V3()), 0.08); } else if (st.fire) { st.fire.stop(); st.fire = null; } }
  });
  ctx.onRemove(g, () => { st.mus && st.mus.stop(); st.fire && st.fire.stop(); });
  ctx.tick(g, (dt, t) => {
    if (!ctx.power() && st.ch) { st.ch = 0; st.mus && st.mus.stop(); st.fire && st.fire.stop(); }
    if (st.ch && ctx.flags) ctx.flags.tvT = performance.now();
    if (st.ch === 0) { if (sm.map !== getTex('tvoff')) { sm.map = getTex('tvoff'); sm.needsUpdate = true; } return; }
    if (sm.map !== tex) { sm.map = tex; sm.needsUpdate = true; }
    st.acc += dt; if (st.acc > 0.05) { st.acc = 0; tvDraw(tex.userData.ctx, 512, 288, st.ch, t); tex.needsUpdate = true; }
  });
  return g;
});
def('tv_stand', 'TV on stand 43"', 'Electronics', { mount: 'surface', solid: false }, (ctx, it) => {
  const g = new THREE.Group(); B(g, 0.3, 0.02, 0.2, M(0x111111), 0, 0, 0); B(g, 0.05, 0.1, 0.03, M(0x111111), 0, 0, -0.03);
  const tv = CATALOG.tv.build(ctx, it); tv.position.set(0, 0.62, -0.06); g.add(tv); return g;
});
def('monitor', 'Computer setup', 'Electronics', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(), blk = M(0x151515, 0.4);
  B(g, 0.22, 0.015, 0.16, blk, 0, 0, -0.08); B(g, 0.04, 0.3, 0.02, blk, 0, 0, -0.1);
  B(g, 0.56, 0.34, 0.03, blk, 0, 0.12, -0.08);
  const tex = screenCanvas(256, 150); const sm = new THREE.MeshBasicMaterial({ color: 0x050505, map: tex });
  plane(g, 0.53, 0.31, sm, 0, 0.29, -0.064);
  B(g, 0.44, 0.02, 0.14, M(0x222222, 0.6), 0, 0, 0.12); B(g, 0.06, 0.02, 0.1, M(0x222222, 0.6), 0.32, 0, 0.12);
  const st = { on: false, acc: 0 };
  ctx.interact(g, { label: () => st.on ? 'Turn off computer' : 'Turn on computer', action: () => { st.on = !st.on; Sfx.beep(1, st.on ? 880 : 440); if (st.on) ctx.task('computer'); } });
  ctx.tick(g, (dt, t) => {
    const on = st.on && ctx.power(); if (on !== st.was) { st.was = on; sm.color.set(on ? 0xffffff : 0x050505); st.drawn = ''; }
    const stamp = on ? new Date().getMinutes() + '' : ''; if (on && stamp !== st.drawn) {
      st.drawn = stamp; const c = tex.userData.ctx; const gr = c.createLinearGradient(0, 0, 256, 150); gr.addColorStop(0, '#e07a3f'); gr.addColorStop(1, '#6c5b8f'); c.fillStyle = gr; c.fillRect(0, 0, 256, 150);
      c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(30, 25, 120, 80); c.fillStyle = '#333'; c.font = '10px sans-serif'; c.fillText('apartment_plans.txt', 36, 40); c.fillText('- buy pumpkins', 36, 56); c.fillText('- redecorate living rm', 36, 70);
      c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, 138, 256, 12); c.fillStyle = '#fff'; c.fillText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 210, 147); tex.needsUpdate = true;
    }
  });
  return g;
});
def('laptop', 'Laptop', 'Electronics', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(), al = M(0xb9bcc0, 0.3, 0.8);
  B(g, 0.32, 0.015, 0.22, al, 0, 0, 0); B(g, 0.28, 0.002, 0.1, M(0x222222), 0, 0.015, -0.03);
  const lid = G(g, 0, 0.019, -0.11); B(lid, 0.32, 0.008, 0.22, al, 0, 0, 0.11);
  const scr = plane(lid, 0.29, 0.19, E(0x6c8fd6, 0.8), 0, -0.001, 0.11, Math.PI / 2);
  const st = hinge(ctx, lid, 'x', -1.9, 'laptop', 'click', (o) => { if (o) ctx.task('computer'); });
  ctx.tick(lid, () => { scr.visible = st.v > 0.3; });
  return g;
});
def('espresso', 'Espresso machine', 'Kitchen', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(), ss = M(0xc7c9cc, 0.25, 0.9), blk = M(0x1a1a1a, 0.4);
  B(g, 0.32, 0.36, 0.3, blk, 0, 0, 0); B(g, 0.32, 0.04, 0.3, ss, 0, 0.36, 0); B(g, 0.3, 0.02, 0.12, ss, 0, 0.02, 0.15);
  C(g, 0.06, 0.06, 0.06, ss, -0.08, 0.4, -0.05, 16); // bean hopper
  C(g, 0.055, 0.04, 0.12, M(0x5a3a22, 0.6, 0, { transparent: true, opacity: 0.8 }), -0.08, 0.46, -0.05, 16);
  const gauge = C(g, 0.03, 0.03, 0.01, M(0xffffff), 0.08, 0.27, 0.15, 16); gauge.rotation.x = Math.PI / 2;
  B(g, 0.1, 0.03, 0.06, ss, 0, 0.22, 0.17); // group head
  const cup = G(g, 0, 0.04, 0.16); C(cup, 0.035, 0.03, 0.08, M(0xf4f1ea, 0.3), 0, 0, 0, 16); const coffee = C(cup, 0.031, 0.031, 0.005, M(0x4a2a14, 0.2), 0, 0.01, 0, 16);
  const stream = C(g, 0.004, 0.004, 0.13, M(0x4a2a14, 0.3), 0, 0.09, 0.16, 6); stream.visible = false;
  const steam = []; for (let i = 0; i < 6; i++) { const s = S(g, 0.02, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }), 0, 0.15, 0.16, 6, 4); s.visible = false; steam.push(s); }
  const st = { state: 'idle', t: 0, fill: 0 };
  ctx.interact(g, {
    label: () => st.state === 'idle' ? (cup.visible ? 'Brew espresso ☕' : 'Place a cup & brew') : st.state === 'brewing' ? 'Brewing…' : 'Take your coffee',
    action: () => {
      if (!ctx.power()) return ctx.msg('No power — check the breaker panel in the hall.');
      if (st.state === 'idle') { cup.visible = true; st.state = 'brewing'; st.t = 0; st.snd = Sfx.loop('hum', g.getWorldPosition(V3()), 0.12); Sfx.beep(1, 1200); }
      else if (st.state === 'done') { cup.visible = false; st.state = 'idle'; st.fill = 0; ctx.give('mug', { fill: 'coffee' }); ctx.msg('Fresh espresso! Press F to drink it, or click to set it down.'); ctx.task('coffee'); }
    }
  });
  ctx.onRemove(g, () => st.snd && st.snd.stop());
  ctx.tick(g, (dt, t) => {
    if (st.state === 'brewing') {
      st.t += dt; stream.visible = st.t > 1; st.fill = clamp((st.t - 1) / 4, 0, 1);
      if (st.t > 5.5) { st.state = 'done'; stream.visible = false; st.snd && st.snd.stop(); Sfx.beep(2, 1500); }
    }
    coffee.position.y = 0.01 + st.fill * 0.06; coffee.visible = st.fill > 0.02;
    steam.forEach((s, i) => { s.visible = st.fill > 0.5 && cup.visible; const k = (t * 0.5 + i / 6) % 1; s.position.set(Math.sin(t + i) * 0.02, 0.12 + k * 0.2, 0.16); s.material.opacity = 0.25 * (1 - k); s.scale.setScalar(1 + k * 2); });
  });
  return g;
});
def('speaker', 'Smart speaker', 'Electronics', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.06, 0.06, 0.18, M(0x6f7378, 1), 0, 0, 0, 20); const ring = T(g, 0.05, 0.006, E(0x4fa3ff, 0), 0, 0.18, 0); ring.rotation.x = Math.PI / 2;
  const st = { on: false };
  ctx.interact(g, { label: () => st.on ? 'Stop music' : 'Play music ♫', action: () => { st.on = !st.on; if (st.on) { const mp = V3(); st.m = Sfx.music(() => g.getWorldPosition(mp), 0); ctx.task('music'); } else { st.m && st.m.stop(); } } });
  ctx.onRemove(g, () => st.m && st.m.stop());
  ctx.tick(g, (dt, t) => { ring.material.emissiveIntensity = st.on ? 1 + Math.sin(t * 6) : 0; if (st.on && ctx.flags) ctx.flags.musicT = performance.now(); });
  return g;
});
def('record_player', 'Record player', 'Electronics', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); B(g, 0.42, 0.09, 0.34, M(0x8a5a3a, 0.5), 0, 0, 0);
  const plat = G(g, -0.04, 0.09, 0); C(plat, 0.15, 0.15, 0.01, M(0x111111, 0.3), 0, 0, 0, 32); C(plat, 0.04, 0.04, 0.012, M(0xd9622b), 0, 0, 0, 16);
  B(g, 0.02, 0.02, 0.2, M(0xc0c0c0, 0.3, 0.8), 0.14, 0.1, -0.02).rotation.y = 0.3;
  const st = { on: false };
  ctx.interact(g, { label: () => st.on ? 'Lift needle' : 'Play a record', action: () => { st.on = !st.on; if (st.on) { const mp = V3(); st.m = Sfx.music(() => g.getWorldPosition(mp), 1); ctx.task('music'); } else st.m && st.m.stop(); Sfx.noise(0.3, 0.05, 2000, 1); } });
  ctx.onRemove(g, () => st.m && st.m.stop());
  ctx.tick(g, dt => { if (st.on) { plat.rotation.y += dt * 3.5; if (ctx.flags) ctx.flags.musicT = performance.now(); } });
  return g;
});
def('fireplace', 'Electric fireplace', 'Electronics', { color: '#f1ece2', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), m = M(it.c || '#f1ece2', 0.7);
  B(g, 1.3, 1.05, 0.35, m, 0, 0, 0); B(g, 1.4, 0.06, 0.42, m, 0, 1.05, 0);
  B(g, 0.8, 0.5, 0.02, M(0x111111), 0, 0.2, 0.17);
  const tex = screenCanvas(256, 160); const sm = new THREE.MeshBasicMaterial({ color: 0x0a0a0a, map: tex }); plane(g, 0.78, 0.48, sm, 0, 0.45, 0.181);
  const L = ctx.light(g, 0xff8a3a, 0, 5, 0, 0.5, 0.5); const st = { on: false, acc: 0 };
  ctx.interact(g, { reach: 6, label: () => st.on ? 'Turn off fireplace' : 'Turn on fireplace 🔥', action: () => { st.on = !st.on; Sfx.click(); if (st.on) { st.s = Sfx.loop('fire', g.getWorldPosition(V3()), 0.1); ctx.task('fire'); } else st.s && st.s.stop(); } });
  ctx.onRemove(g, () => st.s && st.s.stop());
  ctx.tick(g, (dt, t) => { const on = st.on && ctx.power(); L.intensity = on ? 2 + Math.sin(t * 13) * 0.4 : 0; if (on !== st.was) { st.was = on; sm.color.set(on ? 0xffffff : 0x0a0a0a); } if (on && (st.acc += dt) > 0.06) { st.acc = 0; tvDraw(tex.userData.ctx, 256, 160, 1, t); tex.needsUpdate = true; } });
  return g;
});

// ================= KITCHEN =================
const FOODS = { egg: { name: 'egg', raw: 0xfffbe8, cook: 0xf7e7a8, yolk: true }, pancake: { name: 'pancake', raw: 0xf1e2b8, cook: 0xc98a3e }, bacon: { name: 'bacon', raw: 0xe58a8a, cook: 0x9c4a2a }, grilled: { name: 'grilled cheese', raw: 0xf2e6c4, cook: 0xd49a45 } };
const FOOD_ORDER = ['egg', 'pancake', 'bacon', 'grilled'];
def('pan', 'Frying pan', 'Kitchen', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(), blk = M(0x202022, 0.4, 0.5);
  C(g, 0.13, 0.11, 0.045, blk, 0, 0, 0, 24); B(g, 0.03, 0.02, 0.2, blk, 0, 0.03, 0.22);
  const food = G(g, 0, 0.025, 0); const fm = M(0xffffff, 0.6); const fbody = C(food, 0.08, 0.08, 0.012, fm, 0, 0, 0, 20); const yolk = S(food, 0.025, M(0xf2a516, 0.3), 0, 0.015, 0, 10, 8); yolk.scale.y = 0.5;
  const smoke = []; for (let i = 0; i < 5; i++) { const s = S(g, 0.03, new THREE.MeshBasicMaterial({ color: 0x777777, transparent: true, opacity: 0.3, depthWrite: false }), 0, 0.1, 0, 6, 4); smoke.push(s); }
  const st = { food: null, cook: 0, sz: null }; const wp = V3();
  const doneness = () => st.cook < 1 ? 'raw' : st.cook < 2 ? 'cooked' : 'burnt';
  ctx.interact(g, {
    label: () => !st.food ? 'Add ' + FOODS[FOOD_ORDER[(st.next || 0) % 4]].name + ' (E) — tap again for other food' : doneness() === 'raw' ? (ctx.heatAt(g.getWorldPosition(V3())) ? 'Cooking ' + FOODS[st.food].name + '… ' + Math.round(st.cook * 100) + '%' : 'Put pan on a lit burner to cook') : doneness() === 'cooked' ? 'Plate the ' + FOODS[st.food].name + ' 🍽' : 'Scrape out burnt food 😬',
    action: () => {
      if (!st.food) { st.food = FOOD_ORDER[(st.next || 0) % 4]; st.next = (st.next || 0) + 1; st.cook = 0; Sfx.splash(); return; }
      if (doneness() === 'cooked') { ctx.give('plate', { food: st.food }); ctx.msg('Plated! Press F to eat, or set it down.'); ctx.task('cook'); st.food = null; }
      else if (doneness() === 'burnt') { st.food = null; ctx.msg('Into the trash it goes.'); }
      else if (!ctx.heatAt(g.getWorldPosition(V3()))) { st.food = null; ctx.msg('Removed the raw food.'); }
    }
  });
  ctx.onRemove(g, () => st.sz && st.sz.stop());
  ctx.tick(g, (dt, t) => {
    food.visible = !!st.food;
    const heat = st.food && ctx.heatAt(g.getWorldPosition(wp));
    if (heat) { st.cook += dt / 9; if (!st.sz) st.sz = Sfx.loop('sizzle', () => g.getWorldPosition(wp), 0.12); } else if (st.sz) { st.sz.stop(); st.sz = null; }
    if (st.food) { const f = FOODS[st.food]; fm.color.set(f.raw).lerp(_c1.set(f.cook), clamp(st.cook, 0, 1)); if (st.cook > 1.5) fm.color.lerp(_c1.set(0x1d1410), clamp(st.cook - 1.5, 0, 1)); yolk.visible = !!f.yolk; fbody.scale.set(st.food === 'bacon' ? 0.4 : 1, 1, 1); }
    smoke.forEach((s, i) => { s.visible = st.food && st.cook > 1.6; const k = (t * 0.4 + i / 5) % 1; s.position.set(Math.sin(i * 2 + t) * 0.05, 0.05 + k * 0.6, Math.cos(i) * 0.05); s.scale.setScalar(1 + k * 3); s.material.opacity = 0.35 * (1 - k); });
  });
  return g;
});
def('plate', 'Plate of food', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.12, 0.1, 0.015, M(0xf7f5f0, 0.3), 0, 0, 0, 24);
  const f = (it.d && it.d.food) || 'egg', F = FOODS[f];
  if (f === 'cookies') { for (let i = 0; i < 5; i++) C(g, 0.03, 0.03, 0.01, M(0xb57a3c), Math.cos(i) * 0.05, 0.016, Math.sin(i) * 0.05, 12); }
  else if (f === 'toast') { B(g, 0.1, 0.012, 0.1, M(0xc98a3e), 0, 0.016, 0); }
  else { C(g, 0.07, 0.07, 0.012, M(F ? F.cook : 0xccaa66), 0, 0.016, 0, 20); if (F && F.yolk) S(g, 0.022, M(0xf2a516, 0.3), 0, 0.03, 0, 10, 8).scale.y = 0.5; }
  it.use = () => { ctx.eat(); ctx.msg('Yum! That hit the spot. 🍽'); ctx.task('eat'); return 'consume'; };
  return g;
});
def('mug', 'Mug', 'Kitchen', { mount: 'surface', solid: false, small: true, color: '#f4f1ea', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.045, 0.04, 0.1, M(it.c || '#f4f1ea', 0.3), 0, 0, 0, 16); T(g, 0.025, 0.007, M(it.c || '#f4f1ea', 0.3), 0.05, 0.05, 0, TAU);
  const liq = C(g, 0.04, 0.04, 0.005, M(0x4a2a14, 0.2), 0, 0.085, 0, 16);
  ctx.tick(g, () => { liq.visible = !!(it.d && it.d.fill); liq.material.color.set(it.d && it.d.fill === 'tea' ? 0xa0622a : 0x4a2a14); });
  it.use = () => { if (it.d && it.d.fill) { ctx.drink(it.d.fill); it.d.fill = null; return 'keep'; } ctx.msg('The mug is empty. Brew some coffee or tea.'); return 'keep'; };
  return g;
});
def('kettle', 'Tea kettle', 'Kitchen', { mount: 'surface', solid: false, small: true, color: '#c7c9cc', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), m = M(it.c || '#c7c9cc', 0.25, 0.8);
  const body = S(g, 0.1, m, 0, 0.09, 0, 18, 12); body.scale.y = 0.9; C(g, 0.1, 0.1, 0.03, m, 0, 0, 0, 18);
  const sp = C(g, 0.012, 0.02, 0.12, m, 0.1, 0.08, 0, 8); sp.rotation.z = -0.9;
  const handle = T(g, 0.07, 0.01, M(0x1a1a1a), 0, 0.18, 0, Math.PI);
  const steam = []; for (let i = 0; i < 4; i++) { const s = S(g, 0.02, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false }), 0.16, 0.16, 0, 6, 4); steam.push(s); }
  const st = { temp: 0, whistle: 0 }; const wp = V3();
  ctx.interact(g, { label: () => st.temp >= 1 ? 'Pour a cup of tea 🍵' : ctx.heatAt(g.getWorldPosition(V3())) ? 'Heating… ' + Math.round(st.temp * 100) + '%' : 'Put on a lit burner to boil', action: () => { if (st.temp >= 1) { ctx.give('mug', { fill: 'tea' }); ctx.msg('Hot tea! Press F to sip.'); ctx.task('tea'); st.temp = 0.6; } } });
  ctx.onRemove(g, () => st.b && st.b.stop());
  ctx.tick(g, (dt, t) => {
    const heat = ctx.heatAt(g.getWorldPosition(wp));
    st.temp = clamp(st.temp + (heat ? dt / 12 : -dt / 60), 0, 1.2);
    if (st.temp >= 1 && heat) { if (!st.b) st.b = Sfx.loop('boil', () => g.getWorldPosition(wp), 0.1); if ((st.whistle -= dt) < 0) { Sfx.tone(2400, 0.8, 'sine', 0.05, 80); st.whistle = 1.2; } } else if (st.b) { st.b.stop(); st.b = null; }
    steam.forEach((s, i) => { s.visible = st.temp > 0.8; const k = (t * 0.6 + i / 4) % 1; s.position.set(0.17 + k * 0.1, 0.17 + k * 0.25, 0); s.scale.setScalar(1 + k * 2); s.material.opacity = 0.3 * (1 - k); });
  });
  return g;
});
def('toaster', 'Toaster', 'Kitchen', { mount: 'surface', solid: false, small: true, color: '#f1ece2', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), m = M(it.c || '#f1ece2', 0.3, 0.2);
  B(g, 0.28, 0.19, 0.17, m, 0, 0, 0); B(g, 0.2, 0.005, 0.03, M(0x111111), 0, 0.19, -0.035); B(g, 0.2, 0.005, 0.03, M(0x111111), 0, 0.19, 0.035);
  const lever = B(g, 0.03, 0.015, 0.04, M(0x333333), 0.15, 0.13, 0);
  const toasts = [B(g, 0.12, 0.1, 0.012, M(0xe8cf9a), 0, 0.12, -0.035), B(g, 0.12, 0.1, 0.012, M(0xe8cf9a), 0, 0.12, 0.035)];
  const st = { s: 'ready', t: 0 };
  ctx.interact(g, {
    label: () => st.s === 'ready' ? 'Make toast 🍞' : st.s === 'toasting' ? 'Toasting…' : 'Take toast',
    action: () => {
      if (st.s === 'ready') { if (!ctx.power()) return ctx.msg('No power.'); st.s = 'toasting'; st.t = 0; Sfx.click(); }
      else if (st.s === 'done') { st.s = 'ready'; toasts.forEach(t => t.material.color.set(0xe8cf9a)); ctx.give('plate', { food: 'toast' }); ctx.task('cook'); }
    }
  });
  ctx.tick(g, dt => {
    if (st.s === 'toasting') { st.t += dt; toasts.forEach(t => t.material.color.lerp(_c1.set(0xb57a3c), dt * 0.3)); if (st.t > 6) { st.s = 'done'; Sfx.pop(); } }
    lever.position.y = st.s === 'toasting' ? 0.04 : 0.13; toasts.forEach(t => t.position.y = st.s === 'toasting' ? 0.07 : st.s === 'done' ? 0.15 : 0.12);
  });
  return g;
});
def('stand_mixer', 'Stand mixer', 'Kitchen', { mount: 'surface', solid: false, small: true, color: '#e8a5b5', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), m = M(it.c || '#e8a5b5', 0.3, 0.1);
  B(g, 0.2, 0.04, 0.32, m, 0, 0, 0); B(g, 0.1, 0.3, 0.1, m, 0, 0.04, -0.11);
  const head = B(g, 0.12, 0.11, 0.32, m, 0, 0.3, -0.02); C(g, 0.1, 0.08, 0.14, M(0xd8d8d8, 0.2, 0.9), 0, 0.04, 0.05, 20);
  const whisk = G(g, 0, 0.12, 0.05); C(whisk, 0.025, 0.04, 0.12, M(0xd8d8d8, 0.2, 0.9), 0, 0, 0, 6);
  const st = { on: false };
  ctx.interact(g, { label: () => st.on ? 'Stop mixer' : 'Mix some batter', action: () => { st.on = !st.on; if (st.on) st.s = Sfx.loop('hum', g.getWorldPosition(V3()), 0.15); else st.s && st.s.stop(); } });
  ctx.onRemove(g, () => st.s && st.s.stop());
  ctx.tick(g, dt => { if (st.on) { whisk.rotation.y += dt * 20; head.position.x = Math.sin(performance.now() / 20) * 0.002; } });
  return g;
});
def('fruit_bowl', 'Fruit bowl', 'Kitchen', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 10, 0, TAU, Math.PI / 2, Math.PI / 2), M(0x8a5a3a, 0.5)); bowl.material.side = THREE.DoubleSide; bowl.position.y = 0.11; g.add(bowl);
  const fruit = []; const cols = [0xc0262d, 0xe8892b, 0xc0262d, 0x8fb339, 0xe8892b, 0xc0262d];
  for (let i = 0; i < 6; i++) fruit.push(S(g, 0.04, M(cols[i], 0.5), Math.cos(i) * 0.07, 0.07 + (i > 3 ? 0.04 : 0), Math.sin(i) * 0.07, 10, 8));
  const ban = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 6, 12, Math.PI * 0.7), M(0xf2d24b, 0.6)); ban.position.set(0, 0.13, 0); ban.rotation.x = -1.2; g.add(ban); fruit.push(ban);
  ctx.interact(g, { label: () => fruit.some(f => f.visible) ? 'Eat a piece of fruit 🍎' : 'Bowl is empty (refills tomorrow)', action: () => { const f = fruit.find(f => f.visible); if (f) { f.visible = false; Sfx.noise(0.15, 0.3, 2500, 2); ctx.eat(0.3); ctx.msg('Crunch. Fresh!'); ctx.task('eat'); } } });
  g.userData.refill = () => fruit.forEach(f => f.visible = true);
  return g;
});
def('bread', 'Bread bag', 'Kitchen', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); const b = S(g, 0.12, M(0xc89a5e, 0.9), 0, 0.12, 0, 14, 10); b.scale.set(1.2, 1.1, 1);
  B(g, 0.25, 0.04, 0.2, M(0xd8b98a, 1), 0, 0.2, 0).rotation.z = 0.3; return g;
});
def('knife_block', 'Knife block', 'Kitchen', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); const b = B(g, 0.12, 0.22, 0.16, M(0x6b4532, 0.6), 0, 0, 0); b.rotation.x = -0.25;
  for (let i = 0; i < 5; i++) B(g, 0.02, 0.06, 0.02, M(0x111111), -0.04 + i * 0.02, 0.22, -0.03 - (i % 2) * 0.03);
  return g;
});
def('canisters', 'Canister set', 'Kitchen', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); [0.22, 0.18, 0.14].forEach((h, i) => { C(g, 0.06, 0.06, h, M(0xf4f1ea, 0.3), -0.13 + i * 0.13, 0, 0, 18); C(g, 0.062, 0.062, 0.03, M(0xcfae7c, 0.5), -0.13 + i * 0.13, h, 0, 18); }); return g;
});
def('wine', 'Wine & glasses', 'Kitchen', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.037, 0.037, 0.22, M(0x2b0f17, 0.2), 0, 0, 0, 14); C(g, 0.012, 0.03, 0.08, M(0x2b0f17, 0.2), 0, 0.22, 0, 10);
  const gl = M(0xffffff, 0.05, 0, { transparent: true, opacity: 0.25 });
  for (const x of [0.1, 0.17]) { C(g, 0.025, 0.025, 0.004, gl, x, 0, 0, 10); C(g, 0.003, 0.003, 0.08, gl, x, 0, 0, 6); C(g, 0.035, 0.02, 0.07, gl, x, 0.08, 0, 12); }
  ctx.interact(g, { label: 'Pour a glass 🍷', action: () => { Sfx.noise(0.8, 0.1, 900, 2); ctx.msg('Cheers to the new place! 🥂'); } }); return g;
});

// ================= DECOR =================
def('flowers', 'Potted kalanchoe', 'Plants', { mount: 'surface', solid: false, small: true, color: '#e05a8a', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); pot(g, 0.08, 0.12, M(0xf2ede4, 0.4)); leafy(g, 22, 0.1, 0.1, 0x4f7a3a, 0.12, 0.05);
  const fc = M(it.c || '#e05a8a', 0.7); for (let i = 0; i < 26; i++) { const a = Math.random() * TAU, r = Math.random() * 0.1; S(g, 0.014, fc, Math.cos(a) * r, 0.2 + Math.random() * 0.08, Math.sin(a) * r, 6, 4); }
  ctx.interact(g, { label: 'Water the flowers 💧', action: () => { ctx.water(g); } }); return g;
});
def('plant_small', 'Pothos plant', 'Plants', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); pot(g, 0.07, 0.11, M(0xd9cbb5, 0.7)); leafy(g, 30, 0.14, 0.14, 0x5d8f45, 0.08, 0.05);
  ctx.interact(g, { label: 'Water the plant 💧', action: () => ctx.water(g) }); return g;
});
def('plant_floor', 'Fiddle leaf fig', 'Plants', { color: '#f1ece2', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); pot(g, 0.2, 0.38, M(it.c || '#f1ece2', 0.7)); C(g, 0.015, 0.02, 1.2, M(0x5a3d2a), 0, 0.35, 0, 6);
  const lm = M(0x3f6b34, 0.6); const geo = new THREE.SphereGeometry(0.11, 8, 6); geo.scale(1, 1.3, 0.25);
  for (let i = 0; i < 26; i++) { const y = 0.7 + Math.random() * 0.9, a = Math.random() * TAU, r = 0.1 + Math.random() * 0.2; const l = new THREE.Mesh(geo, lm); l.position.set(Math.cos(a) * r, y, Math.sin(a) * r); l.rotation.set(rand(-0.5, 0.5), -a + Math.PI / 2, rand(-0.5, 0.5)); g.add(l); }
  ctx.interact(g, { label: 'Water the plant 💧', action: () => ctx.water(g) }); return g;
});
def('plant_hanging', 'Snake plant', 'Plants', { color: '#2e3a46', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); pot(g, 0.16, 0.3, M(it.c || '#2e3a46', 0.5));
  for (let i = 0; i < 12; i++) { const l = B(g, 0.05, rand(0.4, 0.8), 0.01, M(i % 2 ? 0x3d6b3a : 0x6f8f45, 0.6), rand(-0.08, 0.08), 0.28, rand(-0.08, 0.08)); l.rotation.set(rand(-0.15, 0.15), Math.random() * 3, rand(-0.15, 0.15)); }
  ctx.interact(g, { label: 'Water the plant 💧', action: () => ctx.water(g) }); return g;
});
def('tray_plant', 'Tray centerpiece', 'Decor', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.22, 0.22, 0.03, M(0x6b4532, 0.5), 0, 0, 0, 28);
  const v = S(g, 0.08, M(0xf4f1ea, 0.4), 0.06, 0.1, 0.03, 16, 12); v.scale.y = 0.9;
  pot(G(g, -0.08, 0.03, -0.04), 0.06, 0.08, M(0xe9e2d4, 0.6)); leafy(G(g, -0.08, 0.1, -0.04), 30, 0.12, 0.15, 0x5d8f45, 0, 0.045);
  ctx.interact(g, { label: 'Water the plant 💧', action: () => ctx.water(g) }); return g;
});
def('vase', 'Bud vase', 'Decor', { mount: 'surface', solid: false, small: true, color: '#a35d5d', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); const v = S(g, 0.06, M(it.c || '#a35d5d', 0.2), 0, 0.07, 0, 16, 12); v.scale.y = 1.3; C(g, 0.02, 0.03, 0.08, M(it.c || '#a35d5d', 0.2), 0, 0.12, 0, 12);
  for (let i = 0; i < 4; i++) { const s = C(g, 0.003, 0.003, 0.25, M(0x6f8f45), 0, 0.15, 0, 4); s.rotation.set(rand(-0.3, 0.3), 0, rand(-0.3, 0.3)); }
  return g;
});
def('books', 'Book stack', 'Decor', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); let y = 0; for (let i = 0; i < 4; i++) { const h = rand(0.025, 0.045); const b = B(g, rand(0.2, 0.26), h, rand(0.15, 0.19), M(new THREE.Color().setHSL(Math.random(), 0.35, 0.45), 0.8), 0, y, 0); b.rotation.y = rand(-0.2, 0.2); y += h; }
  ctx.interact(g, { label: 'Flip through a book', action: () => { ctx.msg('You flip through a coffee-table book about national parks.'); ctx.task('read'); } }); return g;
});
def('pillow', 'Throw pillow', 'Decor', { mount: 'surface', solid: false, small: true, color: '#7c6a8a', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); const p = B(g, 0.42, 0.4, 0.13, M(it.c || '#7c6a8a', 1), 0, 0, 0); p.rotation.x = -0.2; return g;
});
def('throw', 'Faux fur throw', 'Decor', { mount: 'surface', solid: false, small: true, color: '#d9c7a0', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); const b = B(g, 0.5, 0.12, 0.4, M(it.c || '#d9c7a0', 1), 0, 0, 0); b.scale.y = 0.8; return g;
});
def('mini_tree', 'Mini pine tree', 'Holiday', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.05, 0.04, 0.06, M(0xd9cbb5, 0.7), 0, 0, 0, 12);
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.09 - i * 0.022, 0.12, 10), M(0x2f5a3a, 0.8)); c.position.y = 0.11 + i * 0.07; g.add(c); }
  return g;
});
def('xmas_tree', 'Pencil Christmas tree', 'Holiday', { shrink: 0.3 }, (ctx, it) => {
  const g = new THREE.Group();
  const skirt = C(g, 0.55, 0.6, 0.03, M(0xffffff, 0.95, 0, { map: getTex('treeskirt') }), 0, 0, 0, 24);
  C(g, 0.025, 0.03, 0.35, M(0x5a3d2a), 0, 0.02, 0, 6);
  const nm = M(0x1c3522, 0.95), nm2 = M(0x22402a, 0.95);
  for (let i = 0; i < 10; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.33 - i * 0.026, 0.38, 12), i % 2 ? nm2 : nm); c.position.y = 0.45 + i * 0.19; c.rotation.y = i; g.add(c); }
  const orn = [M(0x7a1018, 0.2, 0.5), M(0x9c1a22, 0.3, 0.4), M(0xe8e4dc, 0.1, 0.6)];
  const bulbs = []; const bm = E(0xffe2a8, 2);
  for (let i = 0; i < 150; i++) { const y = 0.3 + Math.random() * 1.95, r = (0.33 - (y - 0.3) / 1.95 * 0.3) * 0.98, a = Math.random() * TAU; if (i < 30) S(g, 0.028, orn[i % 3], Math.cos(a) * r, y, Math.sin(a) * r, 10, 8); else bulbs.push(S(g, 0.011, bm, Math.cos(a) * r, y, Math.sin(a) * r, 5, 4)); }
  S(g, 0.03, M(0x2a4a30), 0, 2.28, 0, 6, 4).scale.y = 3;
  const L = ctx.light(g, 0xffd8a0, 0, 4, 0, 1.2, 0.35);
  const st = { on: true };
  ctx.interact(g, { reach: 5, label: () => st.on ? 'Turn off tree lights' : 'Turn on tree lights ✨', action: () => { st.on = !st.on; Sfx.click(); ctx.task('tree'); } });
  ctx.tick(g, (dt, t) => { const on = st.on && ctx.power(); bm.emissiveIntensity = on ? 2 + Math.sin(t * 2) * 0.3 : 0; L.intensity = on ? 1.6 : 0; });
  return g;
});
def('present', 'Wrapped present', 'Holiday', { mount: 'surface', solid: false, small: true, color: '#b3141f', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); B(g, 0.25, 0.18, 0.25, M(it.c || '#b3141f', 0.6), 0, 0, 0);
  const lid = G(g, 0, 0.18, 0); B(lid, 0.27, 0.05, 0.27, M(it.c || '#b3141f', 0.6), 0, 0, 0); B(lid, 0.04, 0.052, 0.272, M(0xd4af37, 0.3, 0.6), 0, 0, 0); B(lid, 0.272, 0.052, 0.04, M(0xd4af37, 0.3, 0.6), 0, 0, 0);
  const gifts = ['cozy socks 🧦', 'a pumpkin candle 🎃', 'a new mug ☕', 'concert tickets 🎟', 'a scarf 🧣', 'a puzzle 🧩'];
  const st = { open: false };
  ctx.interact(g, { label: () => st.open ? 'Close the box' : 'Open present 🎁', action: () => { st.open = !st.open; if (st.open) { Sfx.chime(); ctx.msg('You got ' + gifts[(Math.random() * gifts.length) | 0] + '!'); ctx.task('gift'); } } });
  ctx.tick(g, dt => { lid.position.y = lerp(lid.position.y, st.open ? 0.4 : 0.18, dt * 6); lid.rotation.z = lerp(lid.rotation.z, st.open ? 0.5 : 0, dt * 6); });
  return g;
});
def('wreath', 'Wreath', 'Holiday', { mount: 'wall', solid: false }, (ctx, it) => {
  const g = new THREE.Group(); const w = T(g, 0.17, 0.05, M(0x2f5a3a, 0.9), 0, 0, 0.05); for (let i = 0; i < 10; i++) S(g, 0.02, M(0xb3141f, 0.3), Math.cos(i) * 0.17, Math.sin(i) * 0.17, 0.09, 6, 4);
  B(g, 0.12, 0.06, 0.03, M(0xb3141f), 0, -0.2, 0.07); return g;
});
def('pumpkin', 'Pumpkin', 'Holiday', { mount: 'surface', solid: false, small: true, color: '#e07a3f', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); for (let i = 0; i < 8; i++) { const s = S(g, 0.1, M(it.c || '#e07a3f', 0.6), Math.cos(i / 8 * TAU) * 0.05, 0.09, Math.sin(i / 8 * TAU) * 0.05, 12, 10); s.scale.set(0.7, 0.9, 0.7); }
  C(g, 0.012, 0.018, 0.06, M(0x5a6b2a), 0, 0.17, 0, 6); return g;
});
def('art_monet', 'Water lilies (large)', 'Wall art', { mount: 'wall', solid: false }, (ctx, it) => { const g = new THREE.Group(); frameArt(ctx, g, 1.0, 0.72, 'monet', 1, 0xb08d57); ctx.interact(g, { label: 'Admire the painting', action: () => ctx.msg('Monet\'s water lilies — so calm.') }); return g; });
def('art_landscape', 'Farmhouse print', 'Wall art', { mount: 'wall', solid: false }, (ctx, it) => { const g = new THREE.Group(); frameArt(ctx, g, 0.42, 0.5, 'landscape', 2, 0xb08d57); return g; });
def('art_garden', 'Garden painting', 'Wall art', { mount: 'wall', solid: false }, (ctx, it) => { const g = new THREE.Group(); frameArt(ctx, g, 0.4, 0.55, 'garden', 3, 0xb08d57); return g; });
def('art_bridge', 'Bridge painting', 'Wall art', { mount: 'wall', solid: false }, (ctx, it) => { const g = new THREE.Group(); frameArt(ctx, g, 0.3, 0.4, 'bridge', 4, 0x2a2a2a); return g; });
def('art_print', 'Gallery print', 'Wall art', { mount: 'wall', solid: false, color: '#2a2a2a' }, (ctx, it) => { const g = new THREE.Group(); frameArt(ctx, g, 0.6, 0.75, 'print', (it.d && it.d.seed) || 5, 0x2a2a2a, 0.4); return g; });
def('art_wedding', 'Matted photo (large)', 'Wall art', { mount: 'wall', solid: false }, (ctx, it) => { const g = new THREE.Group(); frameArt(ctx, g, 0.62, 0.8, 'wedding', (it.d && it.d.seed) || 31, 0x1a1a1a, 0.62); ctx.interact(g, { label: 'Look at the photo', action: () => ctx.msg('A favorite from the wedding. 🤍') }); return g; });
def('art_photo', 'B&W photo', 'Wall art', { mount: 'wall', solid: false }, (ctx, it) => { const g = new THREE.Group(); frameArt(ctx, g, 0.3, 0.38, 'photo', (it.d && it.d.seed) || 6, 0x1f1f1f, 0.25); return g; });
def('art_abstract', 'Abstract canvas', 'Wall art', { mount: 'wall', solid: false }, (ctx, it) => { const g = new THREE.Group(); B(g, 0.9, 0.9, 0.04, M(0xffffff, 0.9, 0, { map: artTex('abstract', 7) }), 0, -0.45, 0.02); return g; });
def('art_poster', 'Fall poster', 'Wall art', { mount: 'wall', solid: false }, (ctx, it) => { const g = new THREE.Group(); frameArt(ctx, g, 0.5, 0.7, 'poster', 8, 0xf1ece2); return g; });
def('picture_light', 'Picture light (brass)', 'Lighting', { mount: 'wall', solid: false }, (ctx, it) => {
  const g = new THREE.Group(), br = M(0xb08d57, 0.3, 0.85); B(g, 0.05, 0.05, 0.03, br, 0, -0.025, 0.015);
  const arm = C(g, 0.006, 0.006, 0.12, br, 0, 0, 0.06, 6); arm.rotation.x = Math.PI / 2;
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 12, 1, false, 0, Math.PI), br); sh.rotation.z = Math.PI / 2; sh.position.set(0, 0.0, 0.12); g.add(sh);
  const glow = B(g, 0.28, 0.005, 0.02, E(0xfff0c0, 0), 0, -0.02, 0.12);
  const st = { on: true };
  ctx.interact(g, { label: () => st.on ? 'Turn off picture light' : 'Turn on picture light', action: () => { st.on = !st.on; Sfx.click(); } });
  ctx.tick(g, () => glow.material.emissiveIntensity = (st.on && ctx.power()) ? 2 : 0);
  return g;
});
def('mirror', 'Round mirror', 'Decor', { mount: 'wall', solid: false }, (ctx, it) => {
  const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 40), M(0xb08d57, 0.3, 0.85)); f.rotation.x = Math.PI / 2; f.position.z = 0.015; g.add(f);
  const m = new THREE.Mesh(new THREE.CircleGeometry(0.37, 40), M(0xc9d3db, 0.08, 0.55, { emissive: 0x2a3036, emissiveIntensity: 0.6 })); m.position.z = 0.032; g.add(m);
  ctx.interact(g, { label: 'Check yourself out', action: () => ctx.msg('Looking good. 😎') }); return g;
});
def('clock', 'Wall clock', 'Decor', { mount: 'wall', solid: false }, (ctx, it) => {
  const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 32), M(0x1f1f22, 0.4)); f.rotation.x = Math.PI / 2; f.position.z = 0.02; g.add(f);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.165, 32), M(0xf7f5f0, 0.7)); face.position.z = 0.041; g.add(face);
  for (let i = 0; i < 12; i++) B(g, 0.008, 0.025, 0.004, M(0x222222), Math.sin(i / 12 * TAU) * 0.14, Math.cos(i / 12 * TAU) * 0.14 - 0.0125, 0.043);
  const mk = (len, w) => { const p = G(g, 0, 0, 0.046); B(p, w, len, 0.003, M(0x111111), 0, 0, 0); return p; };
  const hh = mk(0.08, 0.01), mh = mk(0.12, 0.006), sh = mk(0.13, 0.002); sh.children[0].material = M(0xb3141f);
  ctx.tick(g, () => { const d = new Date(); const s = d.getSeconds(), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60; sh.rotation.z = -s / 60 * TAU; mh.rotation.z = -m / 60 * TAU; hh.rotation.z = -h / 12 * TAU; });
  ctx.interact(g, { label: () => 'It\'s ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), action: () => Sfx.tone(800, 0.05) });
  return g;
});
def('rug_vintage', 'Vintage rug', 'Rugs', { solid: false, flat: true }, (ctx, it) => { const g = new THREE.Group(); B(g, 2.6, 0.012, 1.9, M(0xffffff, 1, 0, { map: getTex('oldrug') }), 0, 0, 0); return g; });
def('rug', 'Area rug', 'Rugs', { solid: false, color: '#9b6a6b', colorable: true, flat: true }, (ctx, it) => {
  const g = new THREE.Group(); const m = M(it.c ? new THREE.Color(it.c).lerp(new THREE.Color(0xffffff), 0.3) : 0xffffff, 1, 0, { map: getTex('rug') }); if (it.c) m.color.set(it.c).lerp(new THREE.Color(0xffffff), 0.4);
  B(g, 2.4, 0.012, 1.7, m, 0, 0, 0); return g;
});
def('rug_round', 'Round jute rug', 'Rugs', { solid: false, color: '#c9a27a', colorable: true, flat: true }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.9, 0.9, 0.012, M(it.c || '#c9a27a', 1, 0, { map: getTex('woven') }), 0, 0, 0, 40); return g;
});
def('runner', 'Hall runner', 'Rugs', { solid: false, color: '#2e3a46', colorable: true, flat: true }, (ctx, it) => {
  const g = new THREE.Group(); B(g, 0.75, 0.01, 2.2, M(it.c || '#2e3a46', 1), 0, 0, 0); B(g, 0.6, 0.012, 2.0, M(0xd9cbb5, 1), 0, 0, 0); return g;
});
def('clothes_pile', 'Pile of clothes', 'Fun', { solid: false, flat: true }, (ctx, it) => {
  const g = new THREE.Group(); const cols = [0xe3b8b8, 0x2e3a46, 0xf1ece2, 0x7c8f6a, 0x1f1f22, 0x9c3b3b, 0x6fb0a6];
  for (let i = 0; i < 14; i++) { const b = B(g, rand(0.25, 0.5), rand(0.03, 0.08), rand(0.2, 0.4), M(cols[i % 7], 1), rand(-0.3, 0.3), rand(0, 0.08), rand(-0.25, 0.25)); b.rotation.set(rand(-0.2, 0.2), Math.random() * 3, rand(-0.2, 0.2)); }
  ctx.interact(g, { label: 'Gather clothes for the washer 🧺', action: () => { ctx.removeItem(g); ctx.laundry(1); Sfx.noise(0.5, 0.2, 800, 1); ctx.msg('Clothes gathered. Load the washer by the front door!'); ctx.task('tidy'); } });
  return g;
});
def('ironing', 'Ironing board', 'Fun', { solid: false }, (ctx, it) => {
  const g = new THREE.Group(); const top = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 20, 1, false, 0, Math.PI), M(0xffffff, 0.9, 0, { map: getTex('floral') }));
  B(g, 0.38, 0.02, 1.0, M(0xffffff, 0.9, 0, { map: getTex('floral') }), 0, 0.88, 0); top.position.set(0, 0.89, 0.5); top.rotation.y = -Math.PI / 2; g.add(top);
  const leg = M(0xd9d9d9, 0.3, 0.8); const l1 = B(g, 0.02, 1.15, 0.02, leg, 0, 0, 0); l1.rotation.x = 0.5; l1.position.set(-0.15, 0.45, 0); const l2 = B(g, 0.02, 1.15, 0.02, leg, 0, 0, 0); l2.rotation.x = -0.5; l2.position.set(0.15, 0.45, 0);
  const iron = G(g, 0, 0.9, -0.3); const ib = B(iron, 0.11, 0.06, 0.22, M(0x2a5fb0, 0.3), 0, 0, 0); B(iron, 0.03, 0.06, 0.12, M(0x2a5fb0), 0, 0.06, 0);
  ctx.interact(iron, { label: 'Iron a shirt', action: () => { Sfx.noise(0.6, 0.3, 4000, 1); ctx.msg('Pssshhh... crisp and wrinkle-free.'); iron.userData.t = 1.5; ctx.task('iron'); } });
  ctx.tick(iron, dt => { if (iron.userData.t > 0) { iron.userData.t -= dt; iron.position.z = -0.3 + Math.sin(iron.userData.t * 8) * 0.12; } });
  return g;
});
def('aquarium', 'Aquarium', 'Fun', { mount: 'surface', solid: false }, (ctx, it) => {
  const g = new THREE.Group(); B(g, 0.62, 0.03, 0.32, M(0x111111), 0, 0, 0); B(g, 0.62, 0.03, 0.32, M(0x111111), 0, 0.4, 0);
  B(g, 0.6, 0.37, 0.3, M(0x6fc3e0, 0.05, 0, { transparent: true, opacity: 0.25, depthWrite: false }), 0, 0.03, 0);
  B(g, 0.58, 0.04, 0.28, M(0xd9c79a, 1), 0, 0.03, 0); for (let i = 0; i < 5; i++) { const w = B(g, 0.015, rand(0.1, 0.25), 0.015, M(0x3f8f45), rand(-0.25, 0.25), 0.07, rand(-0.1, 0.1)); w.rotation.z = rand(-0.2, 0.2); }
  const fish = []; for (let i = 0; i < 5; i++) { const f = G(g, 0, 0.2, 0); const b = S(f, 0.025, M([0xff7a1a, 0x2a9df4, 0xf2d24b, 0xff4f7a, 0xffffff][i], 0.4), 0, 0, 0, 8, 6); b.scale.set(1.4, 1, 0.5); const tl = B(f, 0.02, 0.03, 0.005, b.material, -0.04, -0.015, 0); fish.push(f); }
  ctx.interact(g, { label: 'Feed the fish 🐟', action: () => { ctx.msg('The fish swarm to the top. Happy fish!'); fish.forEach(f => f.userData.feed = 3); Sfx.noise(0.2, 0.1, 3000, 2); ctx.task('fish'); } });
  ctx.tick(g, (dt, t) => fish.forEach((f, i) => { const k = t * (0.4 + i * 0.1) + i * 2; const feed = f.userData.feed > 0; if (feed) f.userData.feed -= dt; f.position.set(Math.sin(k) * 0.24, feed ? 0.33 : 0.12 + (i * 0.05) + Math.sin(k * 1.3) * 0.03, Math.cos(k * 0.7) * 0.09); f.rotation.y = Math.cos(k) > 0 ? 0 : Math.PI; }));
  return g;
});
def('watering_can', 'Watering can', 'Fun', { mount: 'surface', solid: false, small: true, color: '#7c8f6a', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(), m = M(it.c || '#7c8f6a', 0.4, 0.3); C(g, 0.08, 0.09, 0.18, m, 0, 0, 0, 16); const sp = C(g, 0.01, 0.015, 0.2, m, 0.1, 0.1, 0, 8); sp.rotation.z = -0.9; T(g, 0.06, 0.01, m, -0.02, 0.2, 0, Math.PI);
  it.use = () => { ctx.waterAhead(); return 'keep'; }; return g;
});
def('yoga_mat', 'Yoga mat', 'Fun', { solid: false, flat: true, color: '#6c5b8f', colorable: true }, (ctx, it) => {
  const g = new THREE.Group(); const m = B(g, 0.6, 0.008, 1.8, M(it.c || '#6c5b8f', 0.9), 0, 0, 0);
  ctx.interact(g, { label: 'Do some yoga 🧘', action: () => { ctx.msg('Deep breath in… and out. Namaste.'); ctx.task('yoga'); ctx.stretch(); } }); return g;
});
def('basketball', 'Mini hoop', 'Fun', { mount: 'wall', solid: false }, (ctx, it) => {
  const g = new THREE.Group(); B(g, 0.45, 0.3, 0.02, M(0xffffff, 0.4), 0, -0.15, 0.01); B(g, 0.15, 0.1, 0.005, M(0xb3141f), 0, -0.2, 0.021);
  const rim = T(g, 0.08, 0.006, M(0xe85a1a, 0.4, 0.5), 0, -0.2, 0.11); rim.rotation.x = Math.PI / 2;
  const ball = S(g, 0.06, M(0xe07a3f, 0.7), 0, -0.6, 0.4, 12, 10); ball.visible = false; let st = { t: -1, score: 0 };
  ctx.interact(g, { label: 'Shoot a hoop 🏀', action: () => { st.t = 0; st.make = Math.random() < 0.6; ball.visible = true; } });
  ctx.tick(g, dt => { if (st.t < 0) return; st.t += dt; const k = st.t / 0.9; ball.position.set(st.make ? 0 : 0.1, -0.6 + Math.sin(Math.min(k, 1) * Math.PI) * 0.6 + k * 0.3 - (k > 1 ? (k - 1) * 3 : 0), 0.6 - k * 0.5); if (k > 1 && !st.done) { st.done = true; if (st.make) { st.score++; ctx.msg('Swish! Score: ' + st.score); Sfx.chime(); } else { ctx.msg('Clank! Brick.'); Sfx.tone(200, 0.2, 'square', 0.1); } } if (k > 1.6) { st.t = -1; st.done = false; ball.visible = false; } });
  return g;
});
def('hair_dryer', 'Hair dryer', 'Fun', { mount: 'surface', solid: false, small: true }, (ctx, it) => {
  const g = new THREE.Group(); C(g, 0.035, 0.04, 0.18, M(0x1f1f22, 0.4), 0, 0.04, 0, 12).rotation.z = Math.PI / 2; B(g, 0.03, 0.12, 0.03, M(0x1f1f22), 0, 0, 0);
  ctx.interact(g, { label: 'Use hair dryer', action: () => { Sfx.noise(2, 0.15, 1500, 0.5); ctx.msg('Fwoooosh. Great hair day.'); } }); return g;
});

// ================= LIFE: food delivery, packages =================
def('pizza', 'Pizza box', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(), card = M(0xd8b98a, 0.9); B(g, 0.38, 0.03, 0.38, card, 0, 0, 0);
  const lid = G(g, 0, 0.045, -0.19); B(lid, 0.38, 0.012, 0.38, card, 0, 0, 0.19); B(lid, 0.18, 0.002, 0.08, M(0xb3141f), 0, 0.012, 0.19);
  const slices = []; for (let i = 0; i < 8; i++) { const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.012, 6, 1, false, i / 8 * TAU, TAU / 8), M(0xe0a23e, 0.7)); sl.position.y = 0.036; g.add(sl); slices.push(sl); for (let k = 0; k < 2; k++) { const a = (i + 0.5) / 8 * TAU, r = 0.06 + k * 0.05; S(sl, 0.012, M(0x9c2a1e, 0.6), Math.sin(a) * r, 0.008, Math.cos(a) * r, 6, 4).scale.y = 0.4; } }
  const d = it.d || (it.d = {}); if (d.left == null) d.left = 8;
  const st = hinge(ctx, lid, 'x', -1.7, 'pizza box', 'click');
  ctx.tick(g, () => slices.forEach((sl, i) => sl.visible = i < d.left));
  it.use = () => { d.left--; ctx.eat(0.18); ctx.task('eat'); if (d.left <= 0) { ctx.msg('That was the last slice. 🍕'); return 'consume'; } ctx.msg('🍕 So good. ' + d.left + ' slice' + (d.left === 1 ? '' : 's') + ' left.'); return 'keep'; };
  it.useLabel = 'eat a slice'; return g;
});
def('takeout', 'Takeout bag', 'Kitchen', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(); B(g, 0.26, 0.3, 0.16, M(0xc9a27a, 0.95), 0, 0, 0); B(g, 0.26, 0.04, 0.16, M(0xa98a62, 0.95), 0, 0.3, 0);
  const lbl = (it.d && it.d.label) || 'Thai food';
  const tex = canvasTex(128, 64, (c) => { c.fillStyle = '#f6efe2'; c.fillRect(0, 0, 128, 64); c.fillStyle = '#b3141f'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.fillText(lbl.toUpperCase(), 64, 38); });
  plane(g, 0.2, 0.1, M(0xffffff, 0.8, 0, { map: tex }), 0, 0.18, 0.081);
  it.use = () => { ctx.eat(0.75); ctx.need('fun', 0.05); ctx.task('eat'); ctx.msg('Delicious ' + lbl.toLowerCase() + '. Totally worth it. 🥡'); return 'consume'; }; it.useLabel = 'eat';
  return g;
});
def('package', 'Package', 'Fun', { mount: 'surface', solid: false, small: true, hidden: true }, (ctx, it) => {
  const g = new THREE.Group(), card = M(0xc49a6c, 0.95); B(g, 0.45, 0.3, 0.35, card, 0, 0, 0);
  const tape = B(g, 0.06, 0.002, 0.36, M(0xd9c79a, 0.4), 0, 0.3, 0);
  const flaps = []; for (const s of [-1, 1]) { const f = G(g, s * 0.225, 0.3, 0); B(f, 0.225, 0.01, 0.35, card, -s * 0.1125, 0, 0); flaps.push([f, s]); }
  const d = it.d || (it.d = {});
  const gifts = ['a cozy throw blanket', 'new candles for the living room', 'a cookbook', 'string lights', 'fuzzy socks', 'a fall wreath', 'a coffee sampler'];
  ctx.interact(g, { label: () => d.opened ? 'Break down the box ♻️' : 'Open package 📦', action: () => { if (!d.opened) { d.opened = true; d.what = gifts[(Math.random() * gifts.length) | 0]; Sfx.noise(0.5, 0.25, 2500, 0.8, 'bandpass', -1500); ctx.msg('📦 It\'s ' + d.what + '!'); ctx.need('fun', 0.15); ctx.task('package'); } else { Sfx.noise(0.3, 0.2, 500, 1); ctx.removeItem(g); } } });
  ctx.tick(g, dt => { tape.visible = !d.opened; flaps.forEach(([f, s]) => f.rotation.z = lerp(f.rotation.z, d.opened ? s * 2.2 : 0, dt * 6)); });
  return g;
});
