// ---------- the apartment: walls, rooms, built-ins, appliances, outdoors ----------
const WALL_H = 2.7, WT = 0.12;
const ROOMS = {
  laundry: { name: 'Laundry closet', rects: [[5.55, 8.9, 6.4, 10]], wall: '#dedad2', floor: 'oak' },
  mech: { name: 'Mechanical closet', rects: [[6.4, 8.9, 7.6, 10]], wall: '#dedad2', floor: 'oak' },
  living: { name: 'Living room & kitchen', rects: [[4.1, 1.45, 7.6, 8.9], [2.9, 4.4, 4.1, 8.9], [1.85, 6.5, 2.9, 8.9], [1.85, 8.9, 5.55, 10]], wall: '#dedad2', floor: 'oak' },
  bath: { name: 'Bathroom', rects: [[0, 3.4, 2.9, 6.5]], wall: '#e2ded6', floor: 'oak' },
  closet: { name: 'Walk-in closet', rects: [[0, 6.5, 1.85, 10]], wall: '#dedad2', floor: 'oak' },
  bedroom: { name: 'Bedroom', rects: [[0, 0, 4.1, 3.4], [2.9, 3.4, 4.1, 4.4]], wall: '#dcd7e8', floor: 'oak' },
  balcony: { name: 'Balcony', rects: [[4.1, 0, 7.6, 1.45]], fixed: true },
  corridor: { name: 'Building corridor', rects: [[7.6, 5.5, 9.8, 10.5]], fixed: true },
};
function roomAt(x, z) {
  for (const k in ROOMS) for (const r of ROOMS[k].rects) if (x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]) return k;
  return 'ext';
}

let _clockMin = -1, _clockStr = '';
function clockText() { const d = new Date(); if (d.getMinutes() !== _clockMin) { _clockMin = d.getMinutes(); _clockStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/ ?[AP]M/, ''); } return _clockStr; }
function buildApartment(scene, ctx) {
  const A = { world: new THREE.Group(), outdoor: new THREE.Group(), lights: {}, heat: [], sinks: [], wallMats: {}, floorMats: {}, floorMeshes: {} };
  const W = A.world; scene.add(W); scene.add(A.outdoor);
  const white = M(0xf7f6f2, 0.6), trim = M(0xf4f3ef, 0.5), nickel = M(0xb9bcbf, 0.3, 0.85), black = M(0x1b1b1d, 0.4, 0.3);
  const ss = M(0xc9cccf, 0.28, 0.9), ssDark = M(0x8d9094, 0.3, 0.9), quartz = M(0xffffff, 0.25, 0, { map: getTex('quartz') });
  const siding = M(0xffffff, 0.85, 0, { map: getTex('siding') });
  const corridorWall = M(0xd6cbb8, 0.9);
  const cabinet = M(0xf6f5f1, 0.55), pull = M(0x222224, 0.35, 0.6);
  for (const k in ROOMS) A.wallMats[k] = ROOMS[k].fixed ? (k === 'balcony' ? siding : corridorWall) : M(ROOMS[k].wall, 0.92);
  A.wallMats.ext = siding;
  const wallMat = (x, z) => A.wallMats[roomAt(x, z)] || siding;
  const col = (minx, miny, minz, maxx, maxy, maxz) => ctx.addCollider(new THREE.Box3(V3(minx, miny, minz), V3(maxx, maxy, maxz)));

  // ---------- lights registry ----------
  function lightKey(key, cfg) {
    const L = A.lights[key] = { on: cfg.on !== false, lights: [], mats: [], base: cfg.intensity || 6, fan: null };
    // virtual light sources: the light pool decides which ones get a real PointLight
    (cfg.points || []).forEach(p => { L.lights.push(ctx.lightSource({ pos: V3(...p), color: cfg.color || 0xfff1dc, distance: cfg.dist || 9, decay: 1.4 })); });
    return L;
  }
  function recessed(key, x, z) { const m = E(0xfff6e6, 2); const c = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), m); c.rotation.x = Math.PI / 2; c.position.set(x, WALL_H - 0.005, z); W.add(c); T(W, 0.085, 0.01, white, x, WALL_H - 0.01, z).rotation.x = Math.PI / 2; A.lights[key].mats.push(m); }
  lightKey('kitchen', { points: [[3.9, 2.3, 8.6], [5.0, 1.8, 7.25]], intensity: 5 });
  lightKey('living', { points: [[5.85, 2.3, 3.6]], intensity: 7 });
  lightKey('bedroom', { points: [[2.05, 2.3, 1.7]], intensity: 6, on: false });
  lightKey('bath', { points: [[1.2, 2.2, 4.9]], intensity: 5, on: false });
  lightKey('hall', { points: [[3.5, 2.3, 4.85]], intensity: 2.5, dist: 5, on: false });
  lightKey('closet', { points: [[0.9, 2.3, 8.2]], intensity: 9, dist: 6, on: false }); // brighter: it no longer borrows spill from the kitchen through the wall
  lightKey('laundry', { points: [[5.97, 2.2, 9.45]], intensity: 2.3, dist: 3.5, on: false });
  lightKey('mech', { points: [[7.0, 2.2, 9.45]], intensity: 2, dist: 3.5, on: false });
  lightKey('balcony', { points: [[5.85, 2.3, 0.7]], intensity: 3, dist: 6, on: false, color: 0xffd9a0 });
  lightKey('corridor', { points: [[8.7, 2.3, 8]], intensity: 2.5, dist: 6 });
  A.lightOn = (k) => A.lights[k] && A.lights[k].on && ctx.power();
  [[2.9, 8.4], [4.6, 8.6], [2.6, 7.3], [6.6, 7.6]].forEach(([x, z]) => recessed('kitchen', x, z));
  [[4.9, 2.4], [6.8, 2.4], [4.9, 5.0], [6.8, 5.0]].forEach(([x, z]) => recessed('living', x, z));
  recessed('hall', 3.5, 4.85); recessed('bedroom', 3.5, 3.9); recessed('closet', 0.9, 8.2); recessed('laundry', 5.97, 9.45); recessed('mech', 7.0, 9.45); recessed('corridor', 8.7, 7); recessed('corridor', 8.7, 9.3);
  // HVAC grilles and smoke detectors for realism
  for (const [x, z, w, d] of [[3.2, 7.6, 0.3, 0.3], [5.85, 5.4, 0.35, 0.2], [2.6, 1.0, 0.3, 0.2], [1.2, 5.6, 0.25, 0.25]]) { B(W, w, 0.012, d, M(0xf2f2f0, 0.5), x, WALL_H - 0.012, z); for (let i = 0; i < 6; i++) B(W, w - 0.03, 0.004, 0.006, M(0x9a9a98), x, WALL_H - 0.016, z - d / 2 + 0.03 + i * (d - 0.06) / 5); }
  for (const [x, z] of [[5.0, 4.2], [3.5, 4.3], [1.8, 2.6]]) C(W, 0.06, 0.06, 0.03, M(0xf6f6f4, 0.6), x, WALL_H - 0.03, z, 16);

  // ---------- walls ----------
  function wall(x1, z1, x2, z2, openings = [], opts = {}) {
    const horiz = z1 === z2; const a0 = horiz ? Math.min(x1, x2) : Math.min(z1, z2), a1 = horiz ? Math.max(x1, x2) : Math.max(z1, z2);
    const c = horiz ? z1 : x1; const H = opts.h || WALL_H; const y0 = opts.y0 || 0;
    const pieces = []; let cur = a0;
    openings.sort((p, q) => p.a - q.a).forEach(o => {
      if (o.a > cur) pieces.push([cur, o.a, y0, H]);
      if (o.bottom > y0) pieces.push([o.a, o.b, y0, o.bottom]);
      if (o.top < H) pieces.push([o.a, o.b, o.top, H]);
      cur = o.b;
    });
    if (cur < a1) pieces.push([cur, a1, y0, H]);
    const ext = WT / 2;
    for (const [s, e, b, t] of pieces) {
      const mid = (s + e) / 2, len = e - s + (opts.noExtend ? 0 : 0);
      const pos = horiz ? V3(mid, (b + t) / 2, c) : V3(c, (b + t) / 2, mid);
      const sideP = horiz ? wallMat(mid, c + 0.2) : wallMat(c + 0.2, mid);
      const sideN = horiz ? wallMat(mid, c - 0.2) : wallMat(c - 0.2, mid);
      const geo = horiz ? new THREE.BoxGeometry(len + (s === a0 ? ext : 0) + (e === a1 ? ext : 0), t - b, WT) : new THREE.BoxGeometry(WT, t - b, len + (s === a0 ? ext : 0) + (e === a1 ? ext : 0));
      const shift = ((e === a1 ? ext : 0) - (s === a0 ? ext : 0)) / 2;
      if (horiz) pos.x += shift; else pos.z += shift;
      const mats = horiz ? [sideP, sideP, white, white, sideP, sideN] : [sideP, sideN, white, white, sideP, sideP];
      const m = new THREE.Mesh(geo, mats); m.position.copy(pos); m.userData.wall = true; W.add(m);
      if (b < 1.7) { const bb = new THREE.Box3().setFromObject(m); ctx.addCollider(bb); }
      if (b === 0 && !opts.noBase) { // baseboards both sides
        for (const sgn of [1, -1]) {
          const r = horiz ? roomAt(mid, c + sgn * 0.2) : roomAt(c + sgn * 0.2, mid); if (r === 'ext' || r === 'balcony') continue;
          if (horiz) B(W, e - s, 0.1, 0.014, trim, mid, 0, c + sgn * (WT / 2 + 0.007)); else B(W, 0.014, 0.1, e - s, trim, c + sgn * (WT / 2 + 0.007), 0, mid);
          if (e - s > 1.2 && !opts.noOutlet) { const om = M(0xf6f5f1, 0.4); for (let q = s + 0.6; q < e - 0.4; q += 2.4) { const o = horiz ? B(W, 0.07, 0.115, 0.008, om, q, 0.28, c + sgn * (WT / 2 + 0.004)) : B(W, 0.008, 0.115, 0.07, om, c + sgn * (WT / 2 + 0.004), 0.28, q); o.userData.noRay = true; } }
        }
      }
    }
  }
  const doorOp = (a, b) => ({ a, b, bottom: 0, top: 2.08 });
  const winOp = (a, b) => ({ a, b, bottom: 0.55, top: 2.3 });
  // exterior (north facade faces the parking lot)
  wall(0, 0, 4.1, 0, [winOp(0.5, 1.95)]);
  wall(4.1, 1.45, 7.6, 1.45, [doorOp(5.0, 6.4)]);
  wall(4.1, 0, 4.1, 5.25); // half wall: runs past the recessed bedroom door
  wall(7.6, 0, 7.6, 1.45, [], { noBase: true });
  wall(7.6, 1.45, 7.6, 10, [doorOp(7.05, 7.95)]);
  wall(0, 10, 7.6, 10);
  wall(0, 0, 0, 10);
  // interior
  wall(0, 3.4, 2.9, 3.4, [doorOp(0.95, 1.7)]); // bedroom ↔ bathroom door
  wall(2.9, 4.4, 4.1, 4.4, [doorOp(3.15, 3.95)]); // bedroom door, sunk into the alcove
  wall(2.9, 3.4, 2.9, 6.5, [doorOp(5.55, 6.33)]); // bathroom door right beside the fridge
  wall(0, 6.5, 2.9, 6.5, [doorOp(0.62, 1.37)]); // closet door, centred on the closet
  wall(1.85, 6.5, 1.85, 10, [], { noOutlet: true });
  // laundry & mechanical closets
  wall(5.55, 8.9, 5.55, 10); wall(6.4, 8.9, 6.4, 10); wall(5.55, 8.9, 6.4, 8.9, [doorOp(5.62, 6.33)]); wall(6.4, 8.9, 7.6, 8.9, [doorOp(6.6, 7.35)]);
  // building corridor outside the front door
  wall(9.8, 5.5, 9.8, 10.5, [doorOp(7.0, 7.95)]); wall(7.6, 5.5, 9.8, 5.5, [doorOp(8.2, 9.2)]); wall(7.6, 10.5, 9.8, 10.5); wall(7.6, 10, 7.6, 10.5);

  // ---------- floors & ceilings ----------
  function floorPlane(rect, mat, y = 0) {
    const [x0, z0, x1, z1] = rect; const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
    const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 8, p.getZ(i) / 8);
    const m = new THREE.Mesh(g, mat); m.userData.floor = true; W.add(m); return m;
  }
  for (const k in ROOMS) {
    const R = ROOMS[k];
    if (k === 'balcony') { const dm = M(0xffffff, 0.85, 0, { map: getTex('deck') }); R.rects.forEach(r => floorPlane(r, dm)); continue; }
    if (k === 'corridor') { const cm = M(0xffffff, 1, 0, { map: floorTex('carpet') }); cm.color.set(0x8a8f99); R.rects.forEach(r => floorPlane(r, cm)); continue; }
    A.floorMats[k] = M(0xffffff, 0.55, 0, { map: floorTex(R.floor) }); A.floorMeshes[k] = R.rects.map(r => floorPlane(r, A.floorMats[k]));
  }
  // ceilings
  const ceil = M(0xfbfbf9, 0.95);
  for (const [x0, z0, x1, z1] of [[-0.1, -0.1, 4.1, 10.6], [4.1, 1.45, 9.9, 10.6]]) { const cg = new THREE.PlaneGeometry(x1 - x0, z1 - z0); cg.rotateX(Math.PI / 2); const cm = new THREE.Mesh(cg, ceil); cm.position.set((x0 + x1) / 2, WALL_H, (z0 + z1) / 2); W.add(cm); }
  // balcony (recessed, faces north): plank ceiling, joists, railing
  const plank = M(0xffffff, 0.8, 0, { map: getTex('deck') }); plane(W, 3.5, 1.45, plank, 5.85, WALL_H - 0.01, 0.72, Math.PI / 2);
  for (let i = 0; i < 4; i++) B(W, 0.08, 0.14, 1.45, M(0x9a7148, 0.7), 4.4 + i * 0.95, WALL_H - 0.15, 0.72);
  const rail = M(0xf7f7f5, 0.5);
  B(W, 3.5, 0.06, 0.08, rail, 5.85, 1.0, 0.03); B(W, 3.5, 0.05, 0.05, rail, 5.85, 0.08, 0.03);
  for (let x = 4.2; x < 7.55; x += 0.12) B(W, 0.035, 0.92, 0.035, rail, x, 0.1, 0.03);
  col(4.1, 0, -0.06, 7.6, 1.1, 0.08);
  const scon = G(W, 4.6, 2.0, 1.385, Math.PI); B(scon, 0.12, 0.2, 0.1, black, 0, -0.1, 0.05); const sconG = B(scon, 0.08, 0.12, 0.02, E(0xffd9a0, 0), 0, -0.06, 0.1); A.lights.balcony.mats.push(sconG.material);

  // ---------- doors ----------
  const doors = []; A.doorById = {};
  function makeDoor({ id, x, z, axis, len, hingeEnd = false, open: openSign, label = 'door', exterior = false, glass = false, lock = false }) {
    const H = 2.05, t = 0.04;
    // casing trims
    const casing = glass ? M(0x2b2f33, 0.5) : trim;
    const cas = [];
    for (const sgn of [1, -1]) {
      const off = sgn * (WT / 2 + 0.008);
      if (axis === 'x') cas.push(B(W, 0.07, H + 0.07, 0.016, trim, x - 0.035, 0, z + off), B(W, 0.07, H + 0.07, 0.016, trim, x + len + 0.035, 0, z + off), B(W, len + 0.14, 0.07, 0.016, trim, x + len / 2, H, z + off));
      else cas.push(B(W, 0.016, H + 0.07, 0.07, trim, x + off, 0, z - 0.035), B(W, 0.016, H + 0.07, 0.07, trim, x + off, 0, z + len + 0.035), B(W, 0.016, 0.07, len + 0.14, trim, x + off, H, z + len / 2));
    }
    const hx = axis === 'x' ? (hingeEnd ? x + len : x) : x, hz = axis === 'z' ? (hingeEnd ? z + len : z) : z;
    const piv = G(W, hx, 0, hz);
    const closed = axis === 'x' ? (hingeEnd ? Math.PI : 0) : (hingeEnd ? Math.PI / 2 : -Math.PI / 2);
    // choose swing sign so tip moves toward openSign along perpendicular axis
    const tipPerp = (a) => axis === 'x' ? -Math.sin(a) : Math.cos(a);
    const s = Math.sign(tipPerp(closed + 1.4)) === openSign ? 1 : -1;
    piv.rotation.y = closed;
    const L = len - 0.02, leaf = G(piv, 0.01, 0, 0);
    const lm = glass ? M(0xf5f5f3, 0.5) : M(0xf8f7f4, 0.45);
    if (glass) {
      B(leaf, L, 0.12, t, lm, L / 2, 0.01, 0); B(leaf, L, 0.12, t, lm, L / 2, H - 0.13, 0); B(leaf, 0.1, H - 0.02, t, lm, 0.05, 0.01, 0); B(leaf, 0.1, H - 0.02, t, lm, L - 0.05, 0.01, 0);
      B(leaf, L - 0.2, H - 0.26, 0.01, M(0xbfd6e6, 0.05, 0.1, { transparent: true, opacity: 0.25 }), L / 2, 0.13, 0);
      const blindsTex = canvasTex(64, 256, (g) => { g.fillStyle = '#f2f2ef'; g.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 8) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, y, 64, 2); } });
      const blinds = B(leaf, L - 0.24, H - 0.4, 0.012, M(0xffffff, 0.8, 0, { map: blindsTex, transparent: true, opacity: 0.95 }), L / 2, 0.3, -0.03);
      const bst = { up: false }; ctx.interact(blinds, { label: () => bst.up ? 'Lower blinds' : 'Raise blinds', action: () => { bst.up = !bst.up; Sfx.noise(0.6, 0.1, 2500, 1); } });
      ctx.tick(blinds, dt => { const hh = H - 0.4; blinds.scale.y = lerp(blinds.scale.y, bst.up ? 0.12 : 1, dt * 4); blinds.position.y = 0.3 + hh - hh * blinds.scale.y / 2; });
    } else {
      B(leaf, L, H - 0.01, t, lm, L / 2, 0.005, 0);
      for (const sd of [1, -1]) { // panel moldings
        const pz = sd * (t / 2 + 0.003);
        for (const [py, ph] of [[0.25, 0.75], [1.18, 0.65]]) { const fx = L / 2, fw = L - 0.24; B(leaf, fw, 0.02, 0.008, lm, fx, py, pz); B(leaf, fw, 0.02, 0.008, lm, fx, py + ph, pz); B(leaf, 0.02, ph, 0.008, lm, fx - fw / 2, py, pz); B(leaf, 0.02, ph, 0.008, lm, fx + fw / 2, py, pz); }
      }
    }
    for (const sd of [1, -1]) { const h = G(leaf, L - 0.07, 1.0, sd * 0.04); C(h, 0.025, 0.025, 0.015, glass ? black : nickel, 0, 0, 0, 12).rotation.x = Math.PI / 2; const lv = B(h, 0.12, 0.018, 0.02, glass ? black : nickel, -0.05, -0.01, sd * 0.02); }
    const st = { open: false, v: 0, locked: lock, label };
    const def = {
      label: () => st.locked && !st.open ? 'Locked 🔒 (unlock at the keypad)' : (st.open ? 'Close ' : 'Open ') + label,
      action: () => { if (st.locked && !st.open) { Sfx.tone(300, 0.15, 'square', 0.08); return; } st.open = !st.open; Sfx.door(st.open); if (exterior && st.open) ctx.task('outside'); }
    };
    ctx.interact(leaf, def); cas.forEach(m => m.userData.int = def);
    st.def = def; st.center = axis === 'x' ? V3(x + len / 2, 1, z) : V3(x, 1, z + len / 2);
    const box = new THREE.Box3();
    // a door only blocks you when it's fully shut; while swinging or open you can always pass
    ctx.addCollider(box, () => { const shut = !st.open && st.v === 0; if (shut && !st.boxOn) { piv.updateMatrixWorld(true); box.setFromObject(leaf); st.boxOn = true; } else if (!shut && st.boxOn) { box.makeEmpty(); st.boxOn = false; } }, st);
    leaf.userData.rigidTick = true;
    ctx.tick(leaf, dt => { const t = st.open ? 1 : 0; if (st.v === t) return; if (leaf.userData.detach) leaf.userData.detach(); st.v += (t - st.v) * Math.min(1, dt * 7); if (Math.abs(t - st.v) < 0.002) st.v = t; piv.rotation.y = closed + s * 1.55 * st.v; });
    doors.push(st); st.leaf = leaf; if (id) A.doorById[id] = st;
    return st;
  }
  const front = makeDoor({ id: 'front', x: 7.6, z: 7.05, axis: 'z', len: 0.9, hingeEnd: true, open: -1, label: 'front door', exterior: true, lock: true });
  makeDoor({ id: 'bedroom', x: 3.15, z: 4.4, axis: 'x', len: 0.8, hingeEnd: false, open: -1, label: 'bedroom door' });
  makeDoor({ id: 'bathK', x: 2.9, z: 5.55, axis: 'z', len: 0.78, hingeEnd: false, open: -1, label: 'bathroom door' });
  makeDoor({ id: 'bathB', x: 0.95, z: 3.4, axis: 'x', len: 0.75, hingeEnd: false, open: 1, label: 'bathroom door' });
  makeDoor({ x: 0.62, z: 6.5, axis: 'x', len: 0.75, hingeEnd: true, open: 1, label: 'closet door' }); // hinged on the left jamb as you face it from the bathroom
  makeDoor({ x: 5.62, z: 8.9, axis: 'x', len: 0.71, hingeEnd: false, open: -1, label: 'laundry closet' });
  makeDoor({ x: 6.6, z: 8.9, axis: 'x', len: 0.75, hingeEnd: true, open: 1, label: 'mechanical closet' });
  makeDoor({ x: 5.0, z: 1.45, axis: 'x', len: 0.7, hingeEnd: false, open: -1, label: 'balcony door', glass: true, exterior: true });
  makeDoor({ x: 5.7, z: 1.45, axis: 'x', len: 0.7, hingeEnd: true, open: -1, label: 'balcony door', glass: true, exterior: true });
  // peephole / unit number (corridor side)
  B(W, 0.01, 0.12, 0.2, M(0xb08d57, 0.3, 0.8), 7.675, 1.75, 7.5);
  // smart lock keypad (interior)
  const kp = B(W, 0.04, 0.16, 0.08, black, 7.515, 1.0, 7.2); const kpLed = B(W, 0.005, 0.015, 0.015, E(0x33ff66, 1.5), 7.492, 1.13, 7.2);
  ctx.interact(kp, { label: () => front.locked ? 'Unlock front door 🔓' : 'Lock front door 🔒', action: () => { if (front.open) return ctx.msg('Close the door first.'); front.locked = !front.locked; Sfx.beep(front.locked ? 2 : 1, front.locked ? 1200 : 1800); Sfx.noise(0.15, 0.3, 300, 2, 'lowpass', 0, 0.2); } });
  ctx.tick(kp, () => kpLed.material.emissive.set(front.locked ? 0xff3333 : 0x33ff66));
  A.doors = doors;

  // ---------- windows & curtains ----------
  function windowAt(x0, x1, z, curtain = true, inS = -1) {
    const glassM = M(0xcfe3f2, 0.05, 0.2, { transparent: true, opacity: 0.18, depthWrite: false });
    const w = x1 - x0, cx = (x0 + x1) / 2;
    plane(W, w, 1.75, glassM, cx, 0.55 + 0.875, z);
    const fm = M(0x2b2f33, 0.5); // dark exterior frame
    B(W, w, 0.05, WT + 0.02, trim, cx, 0.53, z); B(W, w, 0.05, WT + 0.02, trim, cx, 2.28, z); B(W, 0.05, 1.75, WT + 0.02, trim, x0, 0.55, z); B(W, 0.05, 1.75, WT + 0.02, trim, x1, 0.55, z); B(W, 0.04, 1.75, 0.04, fm, cx, 0.55, z + 0.02);
    B(W, w + 0.1, 0.03, 0.16, trim, cx, 0.52, z + inS * 0.06);
    blinds(x0 + 0.03, x1 - 0.03, z + inS * 0.075);
    if (!curtain) return;
    curtains(x0 - 0.35, x1 + 0.35, z + inS * (WT / 2 + 0.1));
  }
  function curtains(x0, x1, z) {
    const w = x1 - x0, cx = (x0 + x1) / 2;
    C(W, 0.012, 0.012, w + 0.2, M(0xb08d57, 0.3, 0.8), cx, 2.5, z, 8).rotation.z = Math.PI / 2; W.children[W.children.length - 1].position.set(cx, 2.5, z);
    const cmat = M(0xf3efe6, 0.95, 0, { side: THREE.DoubleSide, transparent: true, opacity: 0.93 });
    const panels = [];
    for (const sd of [-1, 1]) {
      const pw = w / 2; const geo = new THREE.PlaneGeometry(pw, 2.45, 24, 1); const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 40) * 0.025); geo.computeVertexNormals(); geo.translate(-sd * pw / 2, 0, 0);
      const p = new THREE.Mesh(geo, cmat); p.position.set(sd > 0 ? x1 : x0, 1.25, z); p.scale.x = 0.25; W.add(p); panels.push(p);
    }
    const st = { open: true };
    panels.forEach(p => ctx.interact(p, { reach: 4.5, label: () => st.open ? 'Close curtains' : 'Open curtains', action: () => { st.open = !st.open; Sfx.noise(0.5, 0.08, 1500, 1); } }));
    ctx.tick(panels[0], dt => panels.forEach(p => p.scale.x = lerp(p.scale.x, st.open ? 0.22 : 1.02, dt * 4)));
  }
  function blinds(x0, x1, z) {
    const w = x1 - x0, hh = 1.7; const tex = canvasTex(64, 256, (g) => { g.fillStyle = '#f4f4f1'; g.fillRect(0, 0, 64, 256); for (let y = 0; y < 256; y += 8) { g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(0, y, 64, 2); } });
    const b = B(W, w, hh, 0.012, M(0xffffff, 0.8, 0, { map: tex }), (x0 + x1) / 2, 0.58, z); B(W, w + 0.04, 0.05, 0.05, M(0xf4f4f1, 0.6), (x0 + x1) / 2, 2.26, z);
    const st = { up: true }; b.scale.y = 0.12; b.position.y = 0.58 + hh - hh * 0.06;
    ctx.interact(b, { reach: 4, label: () => st.up ? 'Lower blinds' : 'Raise blinds', action: () => { st.up = !st.up; Sfx.noise(0.6, 0.1, 2500, 1); } });
    ctx.tick(b, dt => { b.scale.y = lerp(b.scale.y, st.up ? 0.12 : 1, dt * 4); b.position.y = 0.58 + hh - hh * b.scale.y / 2; });
  }
  windowAt(0.5, 1.95, 0, true, 1);
  curtains(4.7, 6.7, 1.45 + WT / 2 + 0.1);

  // ---------- switches ----------
  function sw(x, z, ry, keys, label, fan) {
    const g = G(W, x, 1.2, z, ry); B(g, 0.08 * keys.length + 0.04, 0.13, 0.012, white, 0, -0.065, 0.006);
    keys.forEach((k, i) => {
      const pad = B(g, 0.035, 0.06, 0.012, M(0xffffff, 0.4), (i - (keys.length - 1) / 2) * 0.08, -0.03, 0.016);
      const isFan = k.endsWith(':fan'); const key = k.replace(':fan', '');
      ctx.interact(pad, {
        label: () => isFan ? (A.lights[key].fan && A.lights[key].fan.on ? 'Turn ceiling fan off' : 'Turn ceiling fan on') : (A.lights[key].on ? 'Turn off ' : 'Turn on ') + (ROOMS[key] ? ROOMS[key].name.toLowerCase() : key) + ' lights',
        action: () => { if (isFan) { const f = A.lights[key].fan; f.on = !f.on; } else A.lights[key].on = !A.lights[key].on; Sfx.click(); ctx.task('lights'); }
      });
      ctx.tick(pad, () => { const on = isFan ? A.lights[key].fan && A.lights[key].fan.on : A.lights[key].on; pad.rotation.x = on ? -0.25 : 0.25; });
    });
  }
  sw(7.535, 6.8, -Math.PI / 2, ['kitchen', 'living', 'living:fan'], '');
  sw(4.7, 1.515, 0, ['balcony', 'living'], '');
  sw(2.965, 4.55, Math.PI / 2, ['hall'], '');
  sw(4.035, 4.0, -Math.PI / 2, ['bedroom', 'bedroom:fan'], '');
  sw(2.45, 6.435, Math.PI, ['bath'], ''); sw(0.8, 3.465, 0, ['bath'], '');
  sw(0.555, 6.565, 0, ['closet'], '');
  sw(6.335, 9.1, -Math.PI / 2, ['laundry'], '');
  sw(6.465, 9.1, Math.PI / 2, ['mech'], '');
  sw(7.665, 6.8, Math.PI / 2, ['corridor'], '');
  sw(2.965, 5.3, Math.PI / 2, ['kitchen', 'hall'], '');

  // ---------- ceiling fans & pendants ----------
  function fan(key, x, z) {
    const g = G(W, x, WALL_H, z); C(g, 0.012, 0.012, 0.25, black, 0, -0.25, 0, 8); C(g, 0.1, 0.12, 0.12, black, 0, -0.36, 0, 20);
    const rot = G(g, 0, -0.33, 0); markMoves(rot); for (let i = 0; i < 5; i++) { const b = B(rot, 0.58, 0.012, 0.13, M(0x5a3d2a, 0.6), 0.36, 0, 0); const arm = G(rot, 0, 0, 0, i / 5 * TAU); arm.add(b); }
    const lm = E(0xfff3df, 0); const lk = S(g, 0.11, lm, 0, -0.42, 0, 20, 10); lk.scale.y = 0.45; A.lights[key].mats.push(lm);
    const F = A.lights[key].fan = { on: false, speed: 0 };
    g.userData.rigidTick = true; // only spins the blades; its light material is in the frozen registry
    ctx.tick(g, dt => { F.speed = lerp(F.speed, F.on && ctx.power() ? 9 : 0, dt * 0.8); rot.rotation.y += F.speed * dt; if (F.on && !F.snd) F.snd = Sfx.loop('fan', V3(x, 2, z), 0.04); if (!F.on && F.snd) { F.snd.stop(); F.snd = null; } }, true);
    ctx.interact(lk, { reach: 4, label: () => F.on ? 'Turn fan off' : 'Turn fan on', action: () => { F.on = !F.on; Sfx.click(); } });
  }
  fan('living', 5.85, 3.6); fan('bedroom', 2.05, 1.7);
  for (const x of [4.6, 5.4]) {
    const g = G(W, x, WALL_H, 7.25); C(g, 0.004, 0.004, 0.6, black, 0, -0.6, 0, 4);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12, 0, TAU, 0, Math.PI / 2.4), M(0x161616, 0.35, 0.4, { side: THREE.DoubleSide })); dome.position.y = -0.82; g.add(dome);
    C(g, 0.04, 0.05, 0.08, black, 0, -0.66, 0, 12);
    const lm = E(0xfff1d6, 0); const d = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), lm); d.rotation.x = Math.PI / 2; d.position.y = -0.75; g.add(d); A.lights.kitchen.mats.push(lm);
  }

  // ---------- kitchen ----------
  const K = G(W, 9.85, 0, 10, Math.PI); // kitchen built in its own frame, rotated so the range wall is the south wall
  const k2w = (x, z) => [9.85 - x, 10 - z];
  const colK = (x0, y0, z0, x1, y1, z1) => col(9.85 - x1, y0, 10 - z1, 9.85 - x0, y1, 10 - z0);
  const VK = (x, y, z) => V3(9.85 - x, y, 10 - z);
  function baseModule(parent, kind, w, x, z, ry, opts = {}) {
    const g = G(parent, x, 0, z, ry);
    B(g, w, 0.8, 0.6, cabinet, 0, 0.1, -0.3); B(g, w, 0.1, 0.55, M(0xdedcd6, 0.7), 0, 0, -0.33);
    const shaker = (p, pw, ph, px, py) => { B(p, pw, ph, 0.02, cabinet, px, py, 0.01); B(p, pw - 0.14, ph - 0.14, 0.006, M(0xefede8, 0.6), px, py + 0.07, 0.022); };
    if (kind === 'door' || kind === 'door2') {
      const n = kind === 'door2' ? 2 : 1, dw = w / n;
      for (let i = 0; i < n; i++) {
        const left = i === 0; const piv = G(g, left ? -w / 2 : w / 2, 0.12, 0);
        shaker(piv, dw - 0.006, 0.76, left ? dw / 2 : -dw / 2, 0);
        B(piv, 0.012, 0.14, 0.022, pull, left ? dw - 0.05 : -dw + 0.05, 0.56, 0.03);
        hinge(ctx, piv, 'y', left ? -1.9 : 1.9, 'cabinet', 'click');
      }
      // contents
      B(g, w - 0.06, 0.012, 0.52, cabinet, 0, 0.5, -0.3);
      if (opts.fill) opts.fill(g, w);
      else { for (let i = 0; i < 3; i++) C(g, 0.11, 0.11, 0.06 + i * 0.0, M(0xf2f0ea, 0.3), -w / 4 + 0.0, 0.11 + i * 0.012, -0.3, 20); C(g, 0.1, 0.09, 0.14, M(0x9aa0a6, 0.3, 0.8), w / 4, 0.52, -0.3, 16); }
    } else if (kind === 'drawers') {
      const hs = [0.2, 0.26, 0.3]; let y = 0.9 - 0.02;
      hs.forEach((h, i) => { y -= h; drawer(ctx, g, w - 0.006, h - 0.006, 0.5, cabinet, 0, y, -0.25, pull, 'drawer', i === 0 ? (d) => { for (let k = 0; k < 6; k++) B(d, 0.015, 0.006, 0.18, nickel, -0.12 + k * 0.05, 0.01, 0); } : null); });
    }
    return g;
  }
  // north run (facing +z), front at z=0.68
  const NZ = 0.68;
  [['door', 4.4, 4.95], ['drawers', 4.95, 5.55], ['drawers', 6.31, 6.91], ['door', 6.91, 7.32]].forEach(([k, a, b]) => baseModule(K, k, b - a, (a + b) / 2, NZ, 0));
  B(K, 0.62, 0.9, 0.62, cabinet, 7.63, 0, 0.37); // corner
  // east run (facing -x), front at x=7.32
  [['door', 0.68, 1.3], ['door2', 1.3, 2.2]].forEach(([k, a, b]) => baseModule(K, k, b - a, 7.32, (a + b) / 2, -Math.PI / 2));
  colK(4.4, 0, 0.06, 7.94, 0.95, 0.72); colK(7.3, 0, 0.06, 7.94, 0.95, 2.22);
  // countertops
  B(K, 1.17, 0.035, 0.66, quartz, 4.965, 0.9, 0.38); B(K, 1.65, 0.035, 0.66, quartz, 7.125, 0.9, 0.38); B(K, 0.66, 0.035, 1.52, quartz, 7.62, 0.9, 1.45);
  // backsplash
  const bs = M(0xffffff, 0.12, 0.05, { map: getTex('backsplash') }); bs.map.repeat.set(3, 1);
  plane(K, 3.54, 0.52, bs, 6.17, 1.19, 0.062); const bs2 = plane(K, 2.14, 0.52, bs, 7.938, 1.19, 1.13, 0, -Math.PI / 2);
  // uppers
  function upper(x0, x1, zFace, ry, y0 = 1.45, h = 0.9) {
    const w = x1 - x0; const g = ry ? G(K, zFace, y0, (x0 + x1) / 2, ry) : G(K, (x0 + x1) / 2, y0, zFace, ry);
    B(g, w, h, 0.33, cabinet, 0, 0, -0.165); B(g, w - 0.04, 0.012, 0.3, cabinet, 0, h / 2, -0.17);
    const n = w > 0.7 ? 2 : 1, dw = w / n;
    // dishes
    for (let i = 0; i < 4; i++) C(g, 0.035, 0.03, 0.1, M(0xe7f0f4, 0.05, 0, { transparent: true, opacity: 0.5 }), -w / 2 + 0.1 + i * 0.09, h / 2 + 0.012, -0.17, 10);
    for (let i = 0; i < 5; i++) C(g, 0.1, 0.1, 0.012, M(0xf4f1ea, 0.3), w / 4, 0.02 + i * 0.014, -0.17, 18);
    for (let i = 0; i < n; i++) {
      const left = i === 0; const piv = G(g, left ? -w / 2 : w / 2, 0, 0);
      B(piv, dw - 0.006, h, 0.02, cabinet, left ? dw / 2 : -dw / 2, 0, 0.01); B(piv, dw - 0.14, h - 0.14, 0.006, M(0xefede8, 0.6), left ? dw / 2 : -dw / 2, 0.07, 0.022);
      B(piv, 0.012, 0.14, 0.022, pull, left ? dw - 0.05 : -dw + 0.05, 0.04, 0.03);
      hinge(ctx, piv, 'y', left ? -1.8 : 1.8, 'cabinet', 'click');
    }
  }
  upper(4.4, 5.55, 0.39, 0); upper(6.31, 7.6, 0.39, 0);
  upper(0.4, 1.3, 7.61, -Math.PI / 2); upper(1.3, 2.2, 7.61, -Math.PI / 2);
  B(K, 0.76, 0.5, 0.36, cabinet, 5.93, 1.9, 0.24); // above microwave
  B(K, 3.54, 0.06, 0.36, trim, 6.17, 2.35, 0.24); // crown
  // ---- range ----
  const R = G(K, 5.93, 0, 0.06);
  // hollow oven box (sides, floor, roof, back) so the rack and cookies are reachable with the door open
  B(R, 0.07, 0.9, 0.66, ss, -0.345, 0, 0.33); B(R, 0.07, 0.9, 0.66, ss, 0.345, 0, 0.33); B(R, 0.62, 0.12, 0.66, ss, 0, 0, 0.33); B(R, 0.62, 0.16, 0.66, ss, 0, 0.74, 0.33); B(R, 0.62, 0.62, 0.04, ss, 0, 0.12, 0.02);
  const enamel = M(0x1b1b1d, 0.35, 0.1); B(R, 0.01, 0.62, 0.6, enamel, -0.305, 0.12, 0.36); B(R, 0.01, 0.62, 0.6, enamel, 0.305, 0.12, 0.36); B(R, 0.6, 0.01, 0.6, enamel, 0, 0.73, 0.36); B(R, 0.6, 0.01, 0.6, enamel, 0, 0.121, 0.36);
  B(R, 0.76, 0.02, 0.66, M(0x0c0c0e, 0.15, 0.3), 0, 0.9, 0.33); B(R, 0.76, 0.2, 0.06, ss, 0, 0.92, 0.03);
  const disp = canvasTex(128, 32, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 128, 32); }); const dm = new THREE.MeshBasicMaterial({ map: disp });
  plane(R, 0.14, 0.035, dm, 0, 1.04, 0.061);
  const burners = [], BURNER_NAMES = ['front-left', 'front-right', 'back-left', 'back-right'];
  [[-0.18, 0.5, 0.11], [0.18, 0.5, 0.09], [-0.18, 0.2, 0.09], [0.18, 0.2, 0.11]].forEach(([bx, bz, r], i) => {
    const bm = M(0x1a1a1c, 0.3, 0, { emissive: 0xff3a10, emissiveIntensity: 0 });
    const ring = T(R, r * 0.75, 0.012, bm, bx, 0.923, bz); ring.rotation.x = Math.PI / 2; const ring2 = T(R, r * 0.4, 0.01, bm, bx, 0.923, bz); ring2.rotation.x = Math.PI / 2;
    const hit = C(R, r, r, 0.01, new THREE.MeshBasicMaterial({ visible: false }), bx, 0.92, bz, 16);
    const h = { on: false, pos: V3(), mat: bm, i, name: BURNER_NAMES[i] };
    h.toggle = (on = !h.on) => { if (on && !ctx.power()) { ctx.msg('No power.'); return; } h.on = on; Sfx.click(); if (h.on) Sfx.noise(0.3, 0.1, 2000, 1); };
    hit.userData.noRay = true; // burners are switched only with the knobs; the ring is just cooktop you can set a pan on
    burners.push(h); A.heat.push(h); h.hit = hit;
  });
  // control knobs on the front of the range: the only way to switch a burner on or off
  const knobs = [];
  [[-0.3, 2], [-0.18, 0], [0.18, 1], [0.3, 3]].forEach(([kx, bi]) => {
    const kn = G(R, kx, 0.8, 0.668); markDyn(kn); // front-mounted, above the oven door, so pots never block them
    C(kn, 0.02, 0.022, 0.022, black, 0, 0, 0, 14).rotation.x = Math.PI / 2; B(kn, 0.004, 0.022, 0.006, M(0xd8d8d8, 0.4), 0, 0.0, 0.012);
    const kh = B(R, 0.08, 0.1, 0.03, new THREE.MeshBasicMaterial({ visible: false }), kx, 0.755, 0.675); const h = burners[bi];
    ctx.interact(kh, { priority: true, cook: true, label: () => (h.on ? 'Turn off the ' : 'Turn on the ') + h.name + ' burner', action: () => h.toggle() });
    knobs.push([kn, h]);
  });
  // oven door (hinged at bottom)
  const od = G(R, 0, 0.12, 0.66); B(od, 0.72, 0.62, 0.04, ss, 0, 0, 0.0); B(od, 0.5, 0.3, 0.005, M(0x101010, 0.1, 0.3, { transparent: true, opacity: 0.85 }), 0, 0.2, 0.021);
  const oh = C(od, 0.012, 0.012, 0.6, ssDark, 0, 0.55, 0.06, 8); oh.rotation.z = Math.PI / 2;
  B(R, 0.72, 0.08, 0.03, ssDark, 0, 0.02, 0.66);
  const ovenIn = M(0x1b1b1b, 0.5, 0, { emissive: 0xff7a2a, emissiveIntensity: 0 }); B(R, 0.58, 0.55, 0.02, ovenIn, 0, 0.15, 0.06);
  B(R, 0.6, 0.01, 0.55, nickel, 0, 0.35, 0.36); const tray = G(R, 0, 0.36, 0.36); markDyn(tray); B(tray, 0.4, 0.012, 0.3, M(0x555555, 0.4, 0.6), 0, 0, 0);
  const ckm = FOOD_MODELS.cookies(tray, { n: 6, layout: (i) => [-0.12 + (i % 3) * 0.12, 0.012, -0.06 + Math.floor(i / 3) * 0.12] }); markDyn(ckm.g);
  const oven = { on: false, t: 0, hasCookies: true };
  const ovenSmoke = Puffs(R, { n: 6, color: 0x3a3634, size: 0.03, height: 0.5, opacity: 0.4, spread: 0.08, y: 0.95, z: 0.1, speed: 0.35 });
  const ovenTimer = CookTimer(ctx, R, 0, 0.6, 0.76, 0.24); // floats in front of the oven door
  const ovenSteam = Puffs(tray, { n: 4, size: 0.02, height: 0.2, opacity: 0.18, spread: 0.08, y: 0.03 });
  const odSt = hinge(ctx, od, 'x', 1.45, 'oven', 'door');
  const bake = () => oven.t / 18; // 1 = done, 2+ = burnt
  const trayDef = { cook: true,
    label: () => !oven.hasCookies ? 'Put new cookie dough in' : bake() >= 1 ? (bake() >= 2 ? 'Take out the burnt cookies 😬' : 'Take the cookies 🍪') : oven.on ? 'Baking… ' + Math.round(bake() * 100) + '% (close the door)' : 'Cookie dough — turn the oven on',
    action: () => {
      if (!oven.hasCookies) { oven.hasCookies = true; oven.t = 0; ckm.set(0); Sfx.noise(0.2, 0.15, 800, 1); return; }
      if (bake() < 1) return ctx.msg(oven.on ? 'Not done yet. Close the door so they bake.' : 'Turn the oven on at the control panel above the burners.');
      const burnt = bake() >= 2; oven.hasCookies = false; oven.t = 0; ctx.give('plate', { food: 'cookies', fresh: true, hot: true, burnt }, { rise: true }); ctx.task('bake'); ctx.msg(burnt ? 'Oops. A bit charred.' : 'Warm cookies! Left-click to eat.');
    }
  };
  ctx.interact(tray, trayDef);
  // with the door open the whole oven opening reaches the tray (which also slides out toward you)
  const ovenMouth = B(R, 0.6, 0.6, 0.02, new THREE.MeshBasicMaterial({ visible: false }), 0, 0.13, 0.62); markDyn(ovenMouth); ovenMouth.visible = false;
  ctx.interact(ovenMouth, trayDef);
  const panelHit = B(R, 0.26, 0.12, 0.02, new THREE.MeshBasicMaterial({ visible: false }), 0, 0.98, 0.07);
  ctx.interact(panelHit, { cook: true, label: () => oven.on ? (oven.hasCookies && bake() < 1 ? 'Turn oven off (baking ' + Math.round(bake() * 100) + '%)' : 'Turn oven off') : 'Preheat oven to 350°F', action: () => { if (!ctx.power()) return ctx.msg('No power.'); oven.on = !oven.on; Sfx.beep(1, 1400); } });
  ctx.tick(R, (dt) => {
    if (!R.userData.posDone) { R.updateWorldMatrix(true, false); burners.forEach(h => { h.pos.copy(h.hit.position); h.pos.y = 0.93; R.localToWorld(h.pos); }); R.userData.posDone = true; } // the range never moves
    burners.forEach(h => { if (!ctx.power()) h.on = false; const t = h.on ? 1.6 : 0; if (h.mat.emissiveIntensity !== t) { h.mat.emissiveIntensity = lerp(h.mat.emissiveIntensity, t, dt * 2); if (Math.abs(h.mat.emissiveIntensity - t) < 0.01) h.mat.emissiveIntensity = t; } });
    knobs.forEach(([kn, h]) => { const r = h.on ? -1.2 : 0; if (kn.rotation.z !== r) kn.rotation.z = lerp(kn.rotation.z, r, Math.min(1, dt * 10)); if (Math.abs(kn.rotation.z - r) < 0.01) kn.rotation.z = r; });
    if (!ctx.power()) oven.on = false;
    ovenIn.emissiveIntensity = oven.on ? 0.35 : odSt.open ? 0.1 : 0;
    const was = bake();
    if (oven.on && oven.hasCookies && !odSt.open) { oven.t += dt; if (was < 1 && bake() >= 1) { Sfx.beep(4, 1500); ctx.msg('⏰ The cookies are ready! Open the oven door to take them out.'); } if (was < 2 && bake() >= 2) ctx.msg('🔥 Something smells burnt in the oven!'); }
    ckm.g.visible = oven.hasCookies; if (oven.hasCookies) ckm.set(bake());
    ovenMouth.visible = odSt.v > 0.6; tray.position.z = 0.36 + 0.22 * odSt.v; // rack slides out as the door opens
    ovenSmoke.update(dt, oven.hasCookies && bake() > 1.6 ? clamp((bake() - 1.6) * 2, 0, 1) : 0);
    ovenSteam.update(dt, odSt.v > 0.5 && oven.hasCookies && bake() > 0.6 ? 1 : 0);
    if (oven.hasCookies && (oven.on || bake() >= 1)) { const b = bake(); if (b < 1) ovenTimer.show('Cookies ' + fmtSecs((1 - b) * 18), b, TIMER_COL.cook); else if (b < 2) ovenTimer.show(oven.on && !odSt.open ? 'Cookies ready · burn ' + fmtSecs((2 - b) * 18) : 'Cookies ready', 1, TIMER_COL.ready); else ovenTimer.show('Cookies burnt', 1, TIMER_COL.burn); } else ovenTimer.hide();
    const txt = !ctx.power() ? '' : oven.on ? (oven.hasCookies && bake() < 1 ? '350° ' + String(Math.max(0, Math.ceil(18 - oven.t))).padStart(2, '0') : '350°') : clockText(); if (txt !== disp.userData.last) { disp.userData.last = txt; const g = disp.userData.ctx; g.fillStyle = '#000'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#4fb3ff'; g.font = 'bold 22px monospace'; g.fillText(txt, 8, 25); disp.needsUpdate = true; } // only re-upload when the text changes
  });
  colK(5.55, 0, 0.06, 6.31, 1.1, 0.74);
  // ---- microwave ----
  const MW = G(K, 5.93, 1.45, 0.06);
  B(MW, 0.02, 0.42, 0.4, ss, -0.37, 0, 0.2); B(MW, 0.18, 0.42, 0.4, ss, 0.29, 0, 0.2); B(MW, 0.56, 0.03, 0.4, ss, -0.08, 0, 0.2); B(MW, 0.56, 0.03, 0.4, ss, -0.08, 0.39, 0.2); B(MW, 0.56, 0.36, 0.02, ss, -0.08, 0.03, 0.01); // hollow shell
  const mwIn = M(0xe8e8e8, 0.5); B(MW, 0.54, 0.34, 0.005, mwIn, -0.08, 0.035, 0.025); B(MW, 0.005, 0.34, 0.37, mwIn, -0.355, 0.035, 0.205); B(MW, 0.005, 0.34, 0.37, mwIn, 0.195, 0.035, 0.205); B(MW, 0.54, 0.004, 0.37, mwIn, -0.08, 0.031, 0.205);
  const mwLight = M(0xe8e8e8, 0.5, 0, { emissive: 0xffe9b0, emissiveIntensity: 0 }); B(MW, 0.54, 0.01, 0.36, mwLight, -0.08, 0.37, 0.2);
  const turn = G(MW, -0.08, 0.05, 0.2); markMoves(turn); C(turn, 0.14, 0.14, 0.01, M(0xdfe8ee, 0.1, 0, { transparent: true, opacity: 0.6 }), 0, 0, 0, 24);
  const mwBowl = pastaBowl(turn).g; mwBowl.position.y = 0.01; mwBowl.visible = false; markDyn(mwBowl); noRay(mwBowl);
  const mwTimer = CookTimer(ctx, MW, -0.08, 0.37, 0.5, 0.18);
  const mwSteam = Puffs(turn, { n: 4, size: 0.015, height: 0.16, opacity: 0.22, spread: 0.03, y: 0.07 });
  const mwd = G(MW, -0.38, 0.01, 0.4); B(mwd, 0.05, 0.4, 0.025, ss, 0.025, 0, 0); B(mwd, 0.13, 0.4, 0.025, ss, 0.515, 0, 0); B(mwd, 0.4, 0.07, 0.025, ss, 0.25, 0, 0); B(mwd, 0.4, 0.07, 0.025, ss, 0.25, 0.33, 0); B(mwd, 0.4, 0.26, 0.004, M(0x0d0d0d, 0.1, 0.2, { transparent: true, opacity: 0.45 }), 0.25, 0.07, 0.006); B(mwd, 0.02, 0.3, 0.03, ssDark, 0.53, 0.05, 0.025);
  const mwDoor = hinge(ctx, mwd, 'y', -1.7, 'microwave', 'click');
  const kpd = B(MW, 0.15, 0.36, 0.02, M(0x111111, 0.3), 0.29, 0.03, 0.405); const mwDisp = canvasTex(64, 24, g => { }); plane(MW, 0.1, 0.035, new THREE.MeshBasicMaterial({ map: mwDisp }), 0.29, 0.33, 0.416);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) B(MW, 0.025, 0.02, 0.005, M(0x444444), 0.255 + c * 0.035, 0.1 + r * 0.04, 0.416);
  const mw = { on: false, t: 0, ready: false };
  const takeBowl = () => { if (!mwDoor.open) { mwDoor.open = true; Sfx.click(); } mw.ready = false; mwBowl.visible = false; ctx.give('bowl', { hot: true }, { rise: true }); ctx.msg('Hot leftovers! Left-click to eat.'); };
  ctx.interact(kpd, { cook: true,
    label: () => mw.ready ? 'Take the hot leftovers 🍝' : mw.on ? 'Stop microwave (' + fmtSecs(8 - mw.t) + ')' : 'Heat leftovers',
    action: () => {
      if (mw.ready) return takeBowl();
      if (!ctx.power()) return ctx.msg('No power.'); if (mwDoor.open) return ctx.msg('Close the microwave door first.');
      mw.on = !mw.on; mw.t = 0; Sfx.beep(1, 2000); if (mw.on) { mwBowl.visible = true; mw.snd = Sfx.loop('hum', VK(5.93, 1.6, 0.3), 0.15); } else { mw.snd && mw.snd.stop(); mwBowl.visible = false; }
    }
  });
  const bowlHit = B(turn, 0.15, 0.07, 0.15, new THREE.MeshBasicMaterial({ visible: false }), 0, 0.01, 0); markDyn(bowlHit);
  ctx.interact(bowlHit, { cook: true, label: () => mw.ready ? 'Take the hot leftovers 🍝' : '', action: () => { if (mw.ready) takeBowl(); } });
  ctx.tick(MW, dt => {
    mwSteam.update(dt, mw.ready ? 1 : 0); bowlHit.visible = mw.ready;
    if (mw.on) mwTimer.show('Leftovers ' + fmtSecs(8 - mw.t), mw.t / 8, TIMER_COL.cook); else if (mw.ready) mwTimer.show('Leftovers ready', 1, TIMER_COL.ready); else mwTimer.hide();
    if (mw.on) { mw.t += dt; turn.rotation.y += dt * 1.5; if (mw.t > 8 || !ctx.power() || mwDoor.open) { mw.on = false; mw.snd && mw.snd.stop(); if (mw.t > 8) { mw.ready = true; Sfx.beep(3, 2000); ctx.msg('Ding! Leftovers are hot — open the microwave.'); ctx.task('microwave'); } else mwBowl.visible = false; } }
    mwLight.emissiveIntensity = (mw.on || mwDoor.v > 0.2) && ctx.power() ? 1 : 0;
    const txt = !ctx.power() ? '' : mw.on ? fmtSecs(8 - mw.t) : clockText(); if (txt !== mwDisp.userData.last) { mwDisp.userData.last = txt; const g = mwDisp.userData.ctx; g.fillStyle = '#000'; g.fillRect(0, 0, 64, 24); g.fillStyle = '#4fffa0'; g.font = 'bold 18px monospace'; g.fillText(txt, 4, 19); mwDisp.needsUpdate = true; }
  });
  // ---- fridge ----
  const FR = G(K, 7.2, 0, 2.73, -Math.PI / 2); // local: front faces +z → world -x
  B(FR, 0.92, 1.78, 0.04, ss, 0, 0, -0.72); B(FR, 0.04, 1.78, 0.72, ss, -0.44, 0, -0.36); B(FR, 0.04, 1.78, 0.72, ss, 0.44, 0, -0.36); B(FR, 0.92, 0.04, 0.72, ss, 0, 1.74, -0.36);
  const frIn = M(0xf4f6f7, 0.4, 0, { emissive: 0xffffff, emissiveIntensity: 0 });
  B(FR, 0.84, 1.0, 0.02, frIn, 0, 0.7, -0.68); B(FR, 0.02, 1.0, 0.66, frIn, -0.415, 0.7, -0.36); B(FR, 0.02, 1.0, 0.66, frIn, 0.415, 0.7, -0.36); B(FR, 0.84, 0.02, 0.66, frIn, 0, 0.68, -0.36); B(FR, 0.84, 0.03, 0.66, frIn, 0, 1.7, -0.36);
  for (const sy of [1.0, 1.32]) B(FR, 0.82, 0.01, 0.6, M(0xdfe8ee, 0.1, 0, { transparent: true, opacity: 0.5 }), 0, sy, -0.38);
  const snacks = G(FR, 0, 0, -0.35);
  B(snacks, 0.08, 0.22, 0.08, M(0xffffff, 0.6), -0.3, 0.7, -0.1); B(snacks, 0.08, 0.04, 0.08, M(0x2a6fdb), -0.3, 0.92, -0.1); // milk
  B(snacks, 0.28, 0.07, 0.11, M(0xd8c8a8, 0.9), 0.1, 1.01, -0.1); for (let i = 0; i < 6; i++) S(snacks, 0.022, M(0xf3e9d8, 0.5), 0.0 + i * 0.04, 1.09, -0.1, 8, 6);
  C(snacks, 0.04, 0.04, 0.25, M(0xf2a516, 0.3, 0, { transparent: true, opacity: 0.8 }), 0.28, 0.7, 0.05, 12);
  for (let i = 0; i < 5; i++) S(snacks, 0.04, M([0x5d8f45, 0xc0262d, 0xe8892b][i % 3], 0.6), -0.25 + i * 0.1, 0.75, 0.15, 8, 6);
  C(snacks, 0.05, 0.05, 0.1, M(0xe8e2d0, 0.6), -0.1, 1.33, 0, 12); B(snacks, 0.18, 0.1, 0.14, M(0xffffff, 0.8), 0.2, 1.33, 0); C(snacks, 0.035, 0.035, 0.2, M(0x2b5a2b, 0.3), -0.3, 1.33, 0.05, 10);
  const snackSt = { i: 0 };
  ctx.interact(snacks, { cook: true,
    label: () => 'Grab ' + SNACKS[SNACK_ORDER[snackSt.i]] + ' 🧀',
    action: () => { Sfx.noise(0.2, 0.1, 1200, 1); ctx.give('snack', { kind: SNACK_ORDER[snackSt.i] }, { rise: true }); snackSt.i = (snackSt.i + 1) % SNACK_ORDER.length; },
    altLabel: () => 'pick ' + SNACKS[SNACK_ORDER[(snackSt.i + 1) % SNACK_ORDER.length]] + ' instead',
    alt: () => { snackSt.i = (snackSt.i + 1) % SNACK_ORDER.length; Sfx.click(); }
  });
  const frDoors = [];
  for (const sd of [-1, 1]) {
    const piv = G(FR, sd * 0.46, 0.71, 0); const lw = 0.455;
    B(piv, lw, 1.03, 0.07, ss, -sd * lw / 2, 0, 0.035); B(piv, lw - 0.04, 0.95, 0.01, frIn, -sd * lw / 2, 0.04, -0.005);
    for (const sy of [0.2, 0.5, 0.8]) { B(piv, lw - 0.06, 0.01, 0.08, M(0xdfe8ee, 0.1, 0, { transparent: true, opacity: 0.6 }), -sd * lw / 2, sy, -0.04); }
    C(piv, 0.03, 0.03, 0.18, M(0xb3141f, 0.3), -sd * 0.15, 0.51, -0.04, 10); C(piv, 0.03, 0.03, 0.15, M(0xf2c418, 0.4), -sd * 0.28, 0.51, -0.04, 10);
    const hd = C(piv, 0.012, 0.012, 0.7, ssDark, -sd * (lw - 0.04), 0.15, 0.1, 8);
    frDoors.push(hinge(ctx, piv, 'y', sd * 1.8, 'fridge', 'door'));
  }
  const fz = G(FR, 0, 0.05, 0); B(fz, 0.9, 0.6, 0.07, ss, 0, 0, 0.035); C(fz, 0.012, 0.012, 0.6, ssDark, 0, 0.5, 0.1, 8).rotation.z = Math.PI / 2;
  B(fz, 0.82, 0.4, 0.55, M(0xf4f6f7, 0.4), 0, 0.05, -0.28); B(fz, 0.25, 0.12, 0.18, M(0x6f3a2a), -0.2, 0.3, -0.3); B(fz, 0.25, 0.1, 0.3, M(0x6fa3d6), 0.15, 0.3, -0.3);
  const fzSt = slider(ctx, fz, 'z', 0.45, 'freezer');
  ctx.tick(FR, () => { frIn.emissiveIntensity = (frDoors[0].v > 0.1 || frDoors[1].v > 0.1) && ctx.power() ? 0.5 : 0; });
  B(K, 0.74, 0.6, 0.04, cabinet, 7.57, 0, 2.23); B(K, 0.74, 2.4, 0.04, cabinet, 7.57, 0, 3.23); B(K, 0.74, 0.5, 0.96, cabinet, 7.57, 1.85, 2.73); B(K, 0.74, 2.4, 0.04, cabinet, 7.57, 0, 2.21);
  colK(7.18, 0, 2.2, 7.94, 2.4, 3.27);
  // ---- island ----
  const IS = G(W, 5.0, 0, 7.25, Math.PI); // island: work side faces the range, stools on the living side
  // north (kitchen) side modules facing -z
  [['drawers', -1.15, -0.3], ['door2', -0.3, 0.3], ['door', 0.9, 1.15]].forEach(([k, a, b]) => baseModule(IS, k, b - a, -(a + b) / 2, -0.5, Math.PI));
  B(IS, 2.3, 0.9, 0.38, cabinet, 0, 0, 0.29); // body behind modules (south half)
  B(IS, 2.3, 0.8, 0.02, M(0xf0eeea, 0.6), 0, 0.1, 0.49);
  for (let i = 0; i < 5; i++) B(IS, 0.02, 0.7, 0.008, M(0xe4e2dc, 0.6), -1.0 + i * 0.5, 0.15, 0.5);
  // dishwasher at local x -0.6..0 (world 4.9..5.5)? place at a=0.3..0.9 → local x -0.6
  const DW = G(IS, -0.6, 0, -0.5, Math.PI); B(DW, 0.6, 0.86, 0.58, M(0x9fa3a7, 0.4, 0.6), 0, 0, -0.3);
  const dwd = G(DW, 0, 0.06, 0); B(dwd, 0.598, 0.82, 0.04, ss, 0, 0, 0.0); const dwh = B(dwd, 0.45, 0.02, 0.03, ssDark, 0, 0.72, 0.03);
  const dwIn = G(DW, 0, 0, -0.3); for (let i = 0; i < 6; i++) { const p = C(dwIn, 0.11, 0.11, 0.008, M(0xf4f1ea, 0.3), -0.2 + i * 0.08, 0.35, 0, 16); p.rotation.x = Math.PI / 2; }
  B(dwIn, 0.54, 0.01, 0.5, nickel, 0, 0.22, 0); B(dwIn, 0.54, 0.01, 0.5, nickel, 0, 0.55, 0);
  const dwSt = hinge(ctx, dwd, 'x', 1.5, 'dishwasher', 'click');
  const dwLed = B(DW, 0.04, 0.01, 0.01, E(0x33ff66, 0), 0.2, 0.86, 0.02);
  const dwRun = { on: false, t: 0 };
  const dwRunDef = { label: () => dwRun.on ? 'Dishwasher running…' : dwSt.open ? 'Close the dishwasher to run it' : 'Start dishwasher', action: () => { if (dwSt.open) return ctx.msg('Close the dishwasher first.'); if (!dwRun.on) { dwRun.on = true; dwRun.t = 0; Sfx.beep(2, 1300); dwRun.s = Sfx.loop('washer', V3(4.4, 0.4, 7.7), 0.08); } } };
  ctx.interact(dwLed, dwRunDef); ctx.interact(dwh, { label: () => dwSt.open ? 'Close dishwasher' : dwRun.on ? 'Dishwasher running…' : 'Start dishwasher', action: () => dwSt.open ? (dwSt.open = false, Sfx.click()) : dwRunDef.action() });
  ctx.tick(DW, dt => { if (dwRun.on) { dwRun.t += dt; if (dwRun.t > 14 || !ctx.power()) { dwRun.on = false; dwRun.s && dwRun.s.stop(); if (dwRun.t > 14) { Sfx.chime(); ctx.msg('Dishes are sparkling clean.'); ctx.task('dishes'); } } } dwLed.material.emissiveIntensity = dwRun.on ? 2 : 0; });
  // island top with sink cut-out (sink centered at local x 0, z -0.15)
  const it0 = (x0, x1, z0, z1) => B(IS, x1 - x0, 0.035, z1 - z0, quartz, (x0 + x1) / 2, 0.9, (z0 + z1) / 2);
  it0(-1.2, -0.38, -0.55, 0.85); it0(0.38, 1.2, -0.55, 0.85); it0(-0.38, 0.38, -0.55, -0.4); it0(-0.38, 0.38, 0.1, 0.85);
  const sinkM = M(0xb9bdc1, 0.25, 0.9); A.sinks.push(B(IS, 0.76, 0.01, 0.5, sinkM, 0, 0.7, -0.15)); // no-food zone B(IS, 0.76, 0.21, 0.01, sinkM, 0, 0.7, -0.4); B(IS, 0.76, 0.21, 0.01, sinkM, 0, 0.7, 0.1); B(IS, 0.01, 0.21, 0.5, sinkM, -0.38, 0.7, -0.15); B(IS, 0.01, 0.21, 0.5, sinkM, 0.38, 0.7, -0.15);
  C(IS, 0.03, 0.03, 0.005, M(0x333333), 0, 0.711, -0.15, 12);
  // dirty dishes
  const dishes = []; for (let i = 0; i < 4; i++) { const d = C(IS, 0.11, 0.1, 0.012, M(i % 2 ? 0xf4f1ea : 0xdde4f2, 0.3), -0.18 + i * 0.1, 0.72 + i * 0.02, -0.15 + (i % 2) * 0.05, 18); d.rotation.z = 0.3; dishes.push(d); } markDyn(dishes);
  // faucet (on stool side, arching toward kitchen)
  const fau = G(IS, 0.0, 0.935, 0.2); C(fau, 0.025, 0.03, 0.04, nickel, 0, 0, 0, 12); C(fau, 0.014, 0.014, 0.36, nickel, 0, 0.04, 0, 10);
  const arc = T(fau, 0.12, 0.014, nickel, 0, 0.4, -0.12, Math.PI); arc.rotation.y = Math.PI / 2; C(fau, 0.016, 0.014, 0.12, nickel, 0, 0.29, -0.24, 10);
  const lever = B(fau, 0.015, 0.012, 0.09, nickel, 0.05, 0.24, 0.02); markDyn(lever);
  const water = C(IS, 0.008, 0.012, 0.5, M(0xcfe8ff, 0.05, 0, { transparent: true, opacity: 0.55 }), 0, 0.72, -0.04, 8); water.visible = false;
  const sink = { on: false };
  ctx.interact(fau, { label: () => sink.on ? 'Turn off faucet' : 'Turn on faucet 💧', action: () => { sink.on = !sink.on; Sfx.click(); if (sink.on) sink.s = Sfx.loop('water', V3(5.0, 0.9, 7.4), 0.12); else sink.s && sink.s.stop(); } });
  const dishHit = B(IS, 0.7, 0.18, 0.45, new THREE.MeshBasicMaterial({ visible: false }), 0, 0.71, -0.15);
  ctx.interact(dishHit, { label: () => dishes.some(d => d.visible) ? (sink.on ? 'Wash a dish 🧽' : 'Wash dishes (turn the faucet on first)') : 'Sink is clean ✨', action: () => { if (!sink.on) return ctx.msg('Turn on the water first.'); const d = [...dishes].reverse().find(d => d.visible); if (d) { d.visible = false; Sfx.splash(); if (!dishes.some(d => d.visible)) { ctx.msg('All the dishes are clean!'); ctx.task('dishes'); } } } });
  ctx.tick(fau, (dt, t) => { water.visible = sink.on; water.scale.x = water.scale.z = 1 + Math.sin(t * 40) * 0.1; lever.rotation.y = sink.on ? 0.6 : 0; });
  col(3.82, 0, 6.75, 6.18, 0.95, 7.82);
  A.refillDishes = () => dishes.forEach(d => d.visible = true);

  // ---------- laundry (stacked washer/dryer) ----------
  const LD = G(W, 5.975, 0, 9.93, Math.PI);
  const st = { load: 0, wash: 'empty', t: 0, dry: 'empty' };
  function machine(y, kind) {
    const g = G(LD, 0, y, 0); B(g, 0.68, 0.84, 0.7, M(0xf7f7f7, 0.4), 0, 0, 0.35); B(g, 0.68, 0.14, 0.01, M(0xe9ecef, 0.4), 0, 0.68, 0.705);
    const dn = B(g, 0.6, 0.12, 0.01, M(0xffffff, 0.4), 0, 0.69, 0.71);
    const knob = C(g, 0.03, 0.03, 0.02, M(0xd9d9d9, 0.3, 0.5), 0.2, 0.75, 0.715, 16); knob.rotation.x = Math.PI / 2;
    const disp = B(g, 0.12, 0.04, 0.005, E(0x4fb3ff, 0), -0.1, 0.73, 0.712);
    const drum = G(g, 0, 0.36, 0.45); const dr = C(drum, 0.24, 0.24, 0.4, M(0x8d9196, 0.3, 0.8), 0, -0.2, 0, 24); dr.rotation.x = Math.PI / 2; dr.position.set(0, 0, -0.2); C(drum, 0.25, 0.25, 0.01, M(0x2a2a2a, 0.6), 0, 0, 0.0, 24).rotation.x = Math.PI / 2;
    const clothes = G(drum); markDyn(clothes); markMoves(g, drum); for (let i = 0; i < 6; i++) S(clothes, 0.08, M([0xe3b8b8, 0x2e3a46, 0xf1ece2, 0x7c8f6a, 0x9c3b3b, 0x6fb0a6][i], 1), Math.cos(i) * 0.12, Math.sin(i) * 0.12 - 0.05, -0.15, 8, 6);
    const door = G(g, -0.27, 0.36, 0.71); const ring = T(door, 0.22, 0.035, M(0xf7f7f7, 0.35), 0.27, 0, 0.02); const gl = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), M(0x404a55, 0.05, 0.3, { transparent: true, opacity: 0.45 })); gl.position.set(0.27, 0, 0.03); door.add(gl);
    const dSt = hinge(ctx, door, 'y', -1.8, kind + ' door', 'click');
    ctx.tick(g, () => { door.updateMatrixWorld(); });
    return { g, drum, clothes, disp, dn, knob, door: dSt };
  }
  const washer = machine(0, 'washer'), dryer = machine(0.86, 'dryer');
  B(LD, 0.68, 0.04, 0.6, white, 0, 1.95, 0.4); B(LD, 0.18, 0.28, 0.12, M(0xf28a1e, 0.4), -0.2, 1.99, 0.3); B(LD, 0.14, 0.22, 0.1, M(0x2a6fdb, 0.4), 0.05, 1.99, 0.3); C(LD, 0.05, 0.05, 0.2, M(0xffffff), 0.25, 1.99, 0.3, 10);
  col(5.6, 0, 9.2, 6.35, 1.75, 9.94);
  const panelLabel = (m, kind) => () => {
    if (kind === 'washer') { if (st.wash === 'running') return 'Washing… ' + Math.round(st.t / 12 * 100) + '%'; if (st.wash === 'done') return 'Move clothes to dryer'; if (st.load > 0) return 'Load clothes & start wash (' + st.load + ' pile' + (st.load > 1 ? 's' : '') + ')'; return 'Washer is empty (gather clothes first)'; }
    if (st.dry === 'running') return 'Drying… ' + Math.round(st.t / 12 * 100) + '%'; if (st.dry === 'done') return 'Fold the warm laundry 👕'; if (st.dry === 'loaded') return 'Start dryer'; return 'Dryer is empty';
  };
  ctx.interact(washer.dn, { label: panelLabel(washer, 'washer'), action: () => { if (!ctx.power()) return ctx.msg('No power.'); if (st.wash === 'empty' && st.load > 0) { if (washer.door.open) return ctx.msg('Close the washer door first.'); st.load = 0; st.wash = 'running'; st.t = 0; Sfx.beep(2, 1300); st.s = Sfx.loop('washer', V3(5.97, 0.4, 9.5), 0.15); } else if (st.wash === 'done') { st.wash = 'empty'; st.dry = 'loaded'; Sfx.noise(0.4, 0.2, 700, 1); } } });
  ctx.interact(dryer.dn, { label: panelLabel(dryer, 'dryer'), action: () => { if (!ctx.power()) return ctx.msg('No power.'); if (st.dry === 'loaded') { if (dryer.door.open) return ctx.msg('Close the dryer door first.'); st.dry = 'running'; st.t = 0; Sfx.beep(2, 1100); st.s = Sfx.loop('washer', V3(5.97, 1.2, 9.5), 0.12); } else if (st.dry === 'done') { st.dry = 'empty'; ctx.msg('Laundry folded and put away. 🧺✨'); ctx.task('laundry'); } } });
  ctx.tick(LD, (dt, t) => {
    if (st.wash === 'running' || st.dry === 'running') { st.t += dt; if (!ctx.power()) { st.s && st.s.stop(); } if (st.t > 12) { st.s && st.s.stop(); Sfx.chime(); if (st.wash === 'running') { st.wash = 'done'; ctx.msg('Wash cycle done!'); } else { st.dry = 'done'; ctx.msg('Dryer done — clothes are warm.'); } } }
    washer.drum.rotation.z += (st.wash === 'running' ? 12 : 0) * dt; dryer.drum.rotation.z += (st.dry === 'running' ? 6 : 0) * dt;
    washer.g.position.x = st.wash === 'running' ? Math.sin(t * 60) * 0.003 : 0; dryer.g.position.x = st.dry === 'running' ? Math.sin(t * 50) * 0.002 : 0;
    washer.clothes.visible = st.wash !== 'empty'; dryer.clothes.visible = st.dry !== 'empty';
    washer.disp.material.emissiveIntensity = st.wash === 'running' ? 2 : 0.4; dryer.disp.material.emissiveIntensity = st.dry === 'running' ? 2 : 0.4;
  });
  A.laundry = st;
  // ---------- bathroom: double vanity on the west wall, toilet, corner glass shower ----------
  const BA = G(W);
  const vw = 2.0; const vg = G(BA, 0.06, 0, 4.55, Math.PI / 2); // local +z faces into the room (east)
  B(vg, vw, 0.76, 0.54, cabinet, 0, 0.1, 0.27); B(vg, vw, 0.1, 0.5, M(0xdedcd6), 0, 0, 0.25);
  for (const c of [0, 3]) for (let r = 0; r < 2; r++) drawer(ctx, vg, vw / 4 - 0.01, 0.3, 0.45, cabinet, -vw / 2 + vw / 8 + c * vw / 4, 0.12 + r * 0.31, 0.3, pull, 'drawer', r === 1 ? (d) => { B(d, 0.1, 0.03, 0.05, M(0xd94f70), -0.05, 0.01, 0); C(d, 0.015, 0.015, 0.12, M(0xffffff), 0.05, 0.01, 0).rotation.x = Math.PI / 2; } : null);
  baseModule(vg, 'door2', vw / 2 - 0.01, 0, 0.54, 0, { fill: (g) => { C(g, 0.06, 0.06, 0.2, M(0x2a9df4), -0.15, 0.1, -0.3, 10); C(g, 0.05, 0.05, 0.18, M(0xffffff), 0.1, 0.1, -0.3, 10); B(g, 0.2, 0.12, 0.12, M(0xf2f2f2), 0.2, 0.1, -0.35); } });
  B(vg, vw + 0.02, 0.04, 0.58, quartz, 0, 0.86, 0.29);
  const mirrorM = M(0xc9d3db, 0.08, 0.55, { emissive: 0x2a3036, emissiveIntensity: 0.6 });
  const basin = M(0xffffff, 0.2);
  const mirrors = [];
  for (const sx of [-0.48, 0.48]) {
    A.sinks.push(B(vg, 0.42, 0.01, 0.3, basin, sx, 0.78, 0.3)); B(vg, 0.44, 0.08, 0.02, basin, sx, 0.79, 0.15); B(vg, 0.44, 0.08, 0.02, basin, sx, 0.79, 0.45); B(vg, 0.02, 0.08, 0.3, basin, sx - 0.21, 0.79, 0.3); B(vg, 0.02, 0.08, 0.3, basin, sx + 0.21, 0.79, 0.3);
    const bf = G(vg, sx, 0.9, 0.06); C(bf, 0.02, 0.025, 0.2, nickel, 0, 0, 0, 10); B(bf, 0.025, 0.025, 0.14, nickel, 0, 0.17, 0.06);
    const bwater = C(vg, 0.006, 0.006, 0.17, M(0xcfe8ff, 0.05, 0, { transparent: true, opacity: 0.6 }), sx, 0.79, 0.19, 6); bwater.visible = false;
    const bs = { on: false }; ctx.interact(bf, { label: () => bs.on ? 'Turn off faucet' : 'Wash your hands 🧼', action: () => { bs.on = !bs.on; Sfx.click(); if (bs.on) { bs.s = Sfx.loop('water', V3(0.4, 0.9, 4.55 - sx), 0.1); ctx.task('hands'); ctx.need('hygiene', 0.05); } else bs.s && bs.s.stop(); bwater.visible = bs.on; } });
    const mir = plane(vg, 0.8, 0.95, mirrorM, sx, 1.55, 0.016); mirrors.push(mir);
    B(vg, 0.84, 0.03, 0.02, black, sx, 1.06, 0.01); B(vg, 0.84, 0.03, 0.02, black, sx, 2.0, 0.01); B(vg, 0.03, 0.97, 0.02, black, sx - 0.41, 1.06, 0.01); B(vg, 0.03, 0.97, 0.02, black, sx + 0.41, 1.06, 0.01);
    B(vg, 0.6, 0.06, 0.06, nickel, sx, 2.1, 0.03); const bar = B(vg, 0.55, 0.04, 0.02, E(0xfff6e6, 0), sx, 2.11, 0.065); A.lights.bath.mats.push(bar.material);
    ctx.interact(mir, { label: () => A.fog > 0.3 ? 'Wipe the steam off the mirror' : 'Brush your teeth 🪥', action: () => { if (A.fog > 0.3) { A.fog = 0; ctx.msg('You wipe the fog off the mirror.'); return; } ctx.startAction({ label: 'Brushing teeth', dur: 4, sound: 'brush', done: () => { ctx.need('hygiene', 0.25); ctx.task('teeth'); ctx.msg('Minty fresh. ✨'); } }); } });
  }
  C(vg, 0.03, 0.03, 0.1, M(0xf2f2f2), -0.9, 0.9, 0.2, 10); C(vg, 0.03, 0.035, 0.12, M(0x2a9df4, 0.3), 0.92, 0.9, 0.2, 10);
  col(0.06, 0, 3.54, 0.66, 0.95, 5.56);
  A.fog = 0;
  // toilet (back to west wall, facing east)
  const TL = G(BA, 0.27, 0, 6.0, Math.PI / 2); const por = M(0xfdfdfb, 0.15);
  B(TL, 0.48, 0.38, 0.2, por, 0, 0.42, -0.1); B(TL, 0.5, 0.04, 0.22, por, 0, 0.8, -0.1);
  const bowl = C(TL, 0.18, 0.13, 0.4, por, 0, 0, 0.18, 20); bowl.scale.z = 1.3;
  const seat = T(TL, 0.15, 0.025, por, 0, 0.41, 0.2); seat.rotation.x = Math.PI / 2; seat.scale.y = 1.25;
  const waterT = C(TL, 0.13, 0.13, 0.005, M(0x9fd3ec, 0.05, 0, { transparent: true, opacity: 0.7 }), 0, 0.33, 0.2, 18); waterT.scale.z = 1.25;
  const tlid = G(TL, 0, 0.43, 0.01); const lidM = C(tlid, 0.17, 0.17, 0.02, por, 0, 0, 0.19, 20); lidM.scale.z = 1.3;
  const lidSt = { open: false, v: 0 }; ctx.tick(tlid, dt => { lidSt.v = lerp(lidSt.v, lidSt.open ? 1 : 0, Math.min(1, dt * 6)); tlid.rotation.x = -1.6 * lidSt.v; });
  const handle = B(TL, 0.06, 0.015, 0.02, nickel, 0.17, 0.72, 0.01);
  const fl = { t: 0 }; const flush = () => { if (fl.t > 0) return; fl.t = 2.5; Sfx.flush(); ctx.task('flush'); };
  ctx.interact(handle, { label: 'Flush 🚽', action: flush });
  const useToilet = { label: () => 'Use the toilet 🚽', action: () => { const p = V3(0, 0.45, 0.15); TL.localToWorld(p); lidSt.open = true; Sfx.click(); ctx.startAction({ label: 'Using the toilet', dur: 3.5, sit: { pos: p, yaw: Math.PI / 2 + Math.PI }, done: () => { ctx.need('bladder', 1); ctx.task('toilet'); flush(); lidSt.open = false; ctx.msg('Ahh, much better. Don\'t forget to wash your hands!'); } }); } };
  ctx.interact(bowl, useToilet); ctx.interact(tlid, useToilet); ctx.interact(seat, useToilet);
  ctx.tick(TL, (dt, t) => { if (fl.t > 0) { fl.t -= dt; waterT.rotation.y += dt * 8; waterT.scale.x = 0.7 + Math.sin(t * 20) * 0.1; } else waterT.scale.x = 1; });
  col(0.06, 0, 5.74, 0.85, 0.8, 6.26);
  // towel bar on the south wall, toilet paper
  const tp = C(BA, 0.05, 0.05, 0.1, M(0xffffff, 1), 0.11, 0.62, 5.64, 12); tp.rotation.x = Math.PI / 2; tp.position.set(0.11, 0.62, 5.64); // beside the toilet
  // walk-in shower along the hall-side wall: runs from the back (north) wall to the bathroom door,
  // glass front faces the vanity mirrors, shower head toward the right (south) end as you face it
  const SH = G(BA); const sx0 = 1.95, sx1 = 2.84, sz0 = 3.46, sz1 = 5.5; const scx = (sx0 + sx1) / 2, scz = (sz0 + sz1) / 2;
  const tile = M(0xf0efec, 0.3), panelM = M(0xf4f4f2, 0.3);
  B(SH, sx1 - sx0, 0.08, sz1 - sz0, panelM, scx, 0, scz);                      // tray
  B(SH, sx1 - sx0 + 0.03, 2.1, 0.06, panelM, scx - 0.015, 0, sz1 - 0.03);      // end wall beside the bathroom door
  B(SH, 0.01, 1.9, sz1 - sz0, tile, sx1 - 0.005, 0.08, scz);                    // tiled back wall
  for (let i = 0; i < 3; i++) B(SH, 0.25, 0.02, 0.1, panelM, sx1 - 0.06, 0.9 + i * 0.35, sz0 + 0.25);  // corner shelves
  C(SH, 0.03, 0.03, 0.2, M(0xd94f70), sx1 - 0.06, 1.27, sz0 + 0.15, 10); C(SH, 0.03, 0.03, 0.22, M(0x2b2b2b), sx1 - 0.06, 1.27, sz0 + 0.28, 10);
  const headZ = sz0 + (sz1 - sz0) * 0.72;
  const head = G(SH, sx1 - 0.01, 1.95, headZ); const arm = C(head, 0.012, 0.012, 0.2, nickel, 0, 0, 0, 8); arm.rotation.z = Math.PI / 2; arm.position.set(-0.1, 0, 0); const hd = C(head, 0.08, 0.05, 0.03, nickel, -0.2, -0.03, 0, 16); hd.rotation.z = 0.4;
  B(SH, 0.04, 0.03, sz1 - sz0, nickel, sx0, 2.05, scz); B(SH, 0.04, 0.03, sz1 - sz0, nickel, sx0, 0.08, scz);  // rails
  const glassM = M(0xdde8ee, 0.05, 0.1, { transparent: true, opacity: 0.2, depthWrite: false });
  const gw = (sz1 - sz0) / 2 + 0.03;
  // sliding panel starts at the back-wall end (the entrance); the fixed panel is at the head end so you don't get splashed
  const gp1 = B(SH, 0.01, 1.95, gw, glassM, sx0 - 0.02, 0.1, sz0 + gw / 2); markDyn(gp1); const gp2 = B(SH, 0.01, 1.95, gw, glassM, sx0, 0.1, sz1 - gw / 2);
  B(gp1, 0.04, 0.3, 0.02, nickel, -0.03, -0.15, -gw / 2 + 0.06);
  const shSt = { open: false, v: 0, on: false };
  ctx.interact(gp1, { label: () => shSt.open ? 'Close shower door' : 'Open shower door', action: () => { shSt.open = !shSt.open; Sfx.noise(0.4, 0.1, 2500, 2); } });
  const knobS = C(SH, 0.05, 0.05, 0.03, nickel, sx1 - 0.02, 1.15, headZ - 0.35, 16); knobS.rotation.z = Math.PI / 2;
  const wcx = sx1 - 0.25, wcz = headZ;
  const NP = 220, wp = new Float32Array(NP * 3), wv = new Float32Array(NP);
  for (let i = 0; i < NP; i++) { wp[i * 3] = wcx + rand(-0.12, 0.12); wp[i * 3 + 1] = Math.random() * 1.9; wp[i * 3 + 2] = wcz + rand(-0.12, 0.12); wv[i] = rand(3, 5); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(wp, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xcfe8ff, size: 0.025, transparent: true, opacity: 0.7, depthWrite: false })); pts.visible = false; SH.add(pts); pts.userData.noRay = true;
  ctx.interact(knobS, { label: () => shSt.on ? 'Turn off shower' : 'Turn on shower 🚿', action: () => { shSt.on = !shSt.on; Sfx.click(); if (shSt.on) { shSt.s = Sfx.loop('shower', V3(wcx, 1.2, wcz), 0.2); ctx.msg('Open the glass door and step in.'); } else shSt.s && shSt.s.stop(); } });
  ctx.tick(SH, dt => {
    shSt.v += ((shSt.open ? 1 : 0) - shSt.v) * Math.min(1, dt * 5); gp1.position.z = sz0 + gw / 2 + shSt.v * (gw - 0.08);
    if (shSt.on) { const pp = ctx.playerPos(); const inside = pp.x > sx0 && pp.x < sx1 && pp.z > sz0 && pp.z < sz1; ctx.flags.showering = inside; if (inside) { ctx.need('hygiene', dt / 12); if (!shSt.told) { shSt.told = true; ctx.task('shower'); ctx.msg('🚿 Ahh, hot water. Stay under it to get clean.'); } } else shSt.told = false; } else ctx.flags.showering = false;
    pts.visible = shSt.on; if (shSt.on) { for (let i = 0; i < NP; i++) { wp[i * 3 + 1] -= wv[i] * dt; if (wp[i * 3 + 1] < 0.08) { wp[i * 3 + 1] = 1.9; wp[i * 3] = wcx + rand(-0.04, 0.04); wp[i * 3 + 2] = wcz + rand(-0.04, 0.04); } wp[i * 3] += (wp[i * 3] - wcx) * dt * 1.2; wp[i * 3 + 2] += (wp[i * 3 + 2] - wcz) * dt * 1.2; } pg.attributes.position.needsUpdate = true; A.fog = Math.min(1, A.fog + dt / 20); }
    mirrorM.color.setRGB(0.79 + A.fog * 0.15, 0.83 + A.fog * 0.12, 0.86 + A.fog * 0.1); mirrorM.roughness = 0.08 + A.fog * 0.7; mirrorM.metalness = 0.55 - A.fog * 0.5;
  });
  col(sx0 - 0.03, 0, sz1 - gw, sx0 + 0.03, 2, sz1); col(sx0, 0, sz1 - 0.06, sx1, 2.1, sz1); const gpBox = new THREE.Box3(); ctx.addCollider(gpBox, () => gpBox.setFromObject(gp1));
  B(BA, 0.5, 0.012, 0.8, M(0xd9d4cc, 1), 1.0, 0, 4.55); // bath mat in front of vanity

  // ---------- walk-in closet (behind the bathroom) ----------
  const CL = G(W);
  // two matching racks, one each side of the doorway (left x 0.06–0.5, right x 1.37–1.79), aisle down the middle
  const rackL = 0.28, rackR = 1.58, rz0 = 6.65, rz1 = 9.9;
  for (const rx of [rackL, rackR]) { B(CL, 0.02, 0.02, rz1 - rz0, nickel, rx, 1.75, (rz0 + rz1) / 2); B(CL, 0.42, 0.02, rz1 - rz0 + 0.1, white, rx, 1.9, (rz0 + rz1) / 2); }
  const garmentCount = 96; const gGeo = new THREE.BoxGeometry(0.02, 1, 0.42); gGeo.translate(0, -0.5, 0);
  const inst = new THREE.InstancedMesh(gGeo, M(0xffffff, 0.95), garmentCount); const dummy = new THREE.Object3D(); const gc = new THREE.Color();
  const palette = [0xe3b8b8, 0x2e3a46, 0xf1ece2, 0x7c8f6a, 0x1f1f22, 0x9c3b3b, 0xb33a3a, 0xd9c7a0, 0x6c5b8f, 0xf2f2f2, 0x4a7fb5, 0xe8a5b5];
  for (let i = 0; i < garmentCount; i++) {
    const side = i % 2, k = i >> 1; dummy.position.set(side ? rackR : rackL, 1.74, rz0 + 0.12 + k * ((rz1 - rz0 - 0.5) / 48));
    dummy.rotation.set(0, Math.PI / 2 + rand(-0.15, 0.15), 0);
    dummy.scale.set(1, rand(0.55, 1.05), 1); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix); inst.setColorAt(i, gc.set(palette[(Math.random() * palette.length) | 0]));
  }
  CL.add(inst);
  for (let i = 0; i < 20; i++) B(CL, 0.3, rand(0.15, 0.25), rand(0.2, 0.3), M(palette[i % palette.length], 0.9), i % 2 ? rackR : rackL, 1.92, rz0 + 0.15 + (i >> 1) * 0.31);
  B(CL, 0.6, 0.3, 0.4, M(0xf2c418, 0.6), 0.93, 0, 9.65);
  for (let i = 0; i < 12; i++) B(CL, 0.1, 0.12, 0.26, M([0x1f1f22, 0xe8e2d6, 0x6b4a35][i % 3], 0.7), i % 2 ? rackR : rackL, 0.02, 7.0 + (i >> 1) * 0.42);
  ctx.interact(inst, { label: 'Pick an outfit 👗', action: () => { const o = ['a cozy cable-knit sweater', 'jeans and a flannel', 'a black dress', 'joggers and a hoodie', 'a corduroy jacket', 'your warm winter coat']; ctx.msg('You change into ' + o[(Math.random() * o.length) | 0] + '.'); ctx.task('outfit'); Sfx.noise(0.6, 0.1, 900, 1); } });
  col(0.06, 0, rz0, rackL + 0.2, 2.2, 9.94); col(rackR - 0.2, 0, rz0, 1.79, 2.2, 9.94);

  // ---------- thermostat (living room, by the hall) ----------
  const thermTex = canvasTex(128, 96, () => { }); const therm = G(W, 4.165, 1.45, 5.0, Math.PI / 2); B(therm, 0.12, 0.12, 0.025, white, 0, -0.06, 0.012); plane(therm, 0.09, 0.065, new THREE.MeshBasicMaterial({ map: thermTex }), 0, 0, 0.026);
  A.temp = 72; A.mode = 'Heat';
  const drawTherm = () => { const g = thermTex.userData.ctx; g.fillStyle = ctx.power() ? '#0d2a3a' : '#000'; g.fillRect(0, 0, 128, 96); if (!ctx.power()) { thermTex.needsUpdate = true; return; } g.fillStyle = '#fff'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.fillText(A.temp + '°', 64, 58); g.font = '16px sans-serif'; g.fillStyle = A.mode === 'Heat' ? '#ff9a4a' : '#6ac8ff'; g.fillText(A.mode, 64, 84); thermTex.needsUpdate = true; };
  ctx.interact(therm, { label: () => 'Thermostat ' + A.temp + '°F — raise temp', action: () => { A.temp = A.temp >= 78 ? 64 : A.temp + 1; A.mode = A.temp >= 70 ? 'Heat' : 'Cool'; Sfx.beep(1, 2200); drawTherm(); } });
  ctx.tick(therm, () => { const k = ctx.power() + '|' + A.temp + A.mode; if (k !== therm.userData.k) { therm.userData.k = k; drawTherm(); } }); // redraw only when it changes
  // ---------- mechanical closet: water heater, air handler, breaker panel ----------
  const MC = G(W);
  C(MC, 0.28, 0.28, 1.45, M(0xe8e8e4, 0.5), 6.85, 0.02, 9.6, 24); C(MC, 0.05, 0.05, 0.6, M(0xb87333, 0.3, 0.8), 6.75, 1.47, 9.6, 8);
  B(MC, 0.55, 1.2, 0.55, M(0xd9d9d6, 0.5, 0.2), 7.25, 1.1, 9.6); B(MC, 0.5, 0.35, 0.5, M(0xbfc2c4, 0.5, 0.4), 7.25, 2.3, 9.6);
  const humTick = G(MC); ctx.tick(humTick, () => { });
  const panel = G(W, 7.53, 1.25, 9.3, -Math.PI / 2); B(panel, 0.4, 0.62, 0.06, M(0x8f9497, 0.5, 0.4), 0, 0, 0.03);
  for (let i = 0; i < 12; i++) B(panel, 0.07, 0.03, 0.02, M(0x222222), -0.05 + (i % 2) * 0.1, 0.12 + Math.floor(i / 2) * 0.07, 0.065);
  const mainB = B(panel, 0.12, 0.05, 0.03, M(0x111111), 0, 0.53, 0.065);
  const pdoor = G(panel, -0.2, 0, 0.065); B(pdoor, 0.4, 0.62, 0.01, M(0x9aa0a3, 0.5, 0.4), 0.2, 0, 0); B(pdoor, 0.02, 0.06, 0.02, M(0x333333), 0.36, 0.3, 0.01);
  hinge(ctx, pdoor, 'y', -1.9, 'breaker panel', 'click');
  ctx.interact(mainB, { label: () => ctx.power() ? 'Flip main breaker OFF ⚡' : 'Flip main breaker ON ⚡', action: () => { ctx.setPower(!ctx.power()); Sfx.noise(0.15, 0.5, 300, 1, 'lowpass'); ctx.task('breaker'); ctx.msg(ctx.power() ? 'Power restored.' : 'Everything goes dark…'); } });
  ctx.tick(mainB, () => mainB.position.y = ctx.power() ? 0.53 : 0.5);
  col(6.55, 0, 9.3, 7.54, 2.6, 9.94);

  // ---------- corridor outside ----------
  const corrArt = G(W, 9.735, 1.5, 9.2, -Math.PI / 2); frameArt(ctx, corrArt, 0.6, 0.45, 'landscape', 9, 0x2a2a2a);

  // ---------- exterior building & surroundings ----------
  buildOutdoor(A, scene);

  // ---------- room lights tick ----------
  ctx.tick(W, () => {
    const p = ctx.power();
    for (const k in A.lights) { const L = A.lights[k]; const on = L.on && p; L.lights.forEach(l => l.intensity = on ? L.base : 0); L.mats.forEach(m => m.emissiveIntensity = on ? 2 : 0); }
  }, true);

  A.setWall = (room, color) => { if (A.wallMats[room] && !ROOMS[room].fixed) A.wallMats[room].color.set(color); };
  A.setFloor = (room, style) => { if (A.floorMats[room]) { A.floorMats[room].map = floorTex(style); A.floorMats[room].needsUpdate = true; } };
  A.spawn = { x: 6.9, z: 7.9, yaw: 0.95 };
  return A;
}

function buildOutdoor(A, scene) {
  const GY = -7.6; // ground level (3rd floor unit)
  const facadeTex = getTex('facade'); facadeTex.wrapS = facadeTex.wrapT = THREE.RepeatWrapping;
  const fac = (w, h) => { const t = facadeTex.clone(); t.needsUpdate = true; t.repeat.set(w / 12, h / 10); return M(0xffffff, 0.85, 0, { map: t }); };
  const BO = A.outdoor;
  const blk = (x0, y0, z0, x1, y1, z1) => B(BO, x1 - x0, y1 - y0, z1 - z0, fac(x1 - x0, y1 - y0), (x0 + x1) / 2, y0, (z0 + z1) / 2);
  // the rest of our building wrapped around this unit (facade faces north, toward the lot)
  blk(-16, GY, -0.06, 7.67, -0.02, 16); blk(9.87, GY, -0.06, 26, -0.02, 16); blk(7.67, GY, 5.43, 9.87, -0.02, 16); // floors below (stair shaft open)
  blk(-16, WALL_H + 0.02, -0.06, 26, WALL_H + 3.4, 16); // floor above
  blk(-16, -0.02, -0.06, -0.07, WALL_H + 0.03, 16);  // neighbor to the west
  blk(9.87, -0.02, -0.06, 26, WALL_H + 0.03, 5.5); blk(9.87, -0.02, 10.5, 26, WALL_H + 0.03, 16); blk(14.1, -0.02, 5.5, 26, WALL_H + 0.03, 10.5); // east neighbor (2B carved out)
  blk(-0.07, -0.02, 10.07, 7.6, WALL_H + 0.03, 16); blk(7.6, -0.02, 10.57, 9.87, WALL_H + 0.03, 16);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(24, 3.2, 4, 1), M(0x767c84, 0.85)); roof.scale.set(1, 1, 0.3); roof.rotation.y = Math.PI / 4; roof.position.set(5, WALL_H + 3.4 + 2, 8); BO.add(roof);
  // recessed balconies on the other floors, like ours
  const balc = (x0, x1, y) => { B(BO, x1 - x0, 0.06, 1.4, M(0x9a7148, 0.8), (x0 + x1) / 2, y, -0.75); B(BO, x1 - x0, 2.5, 0.02, M(0x50565c, 0.6), (x0 + x1) / 2, y, -1.45); for (let x = x0 + 0.1; x < x1; x += 0.12) B(BO, 0.035, 0.92, 0.035, M(0xf7f7f5, 0.5), x, y + 0.06, -0.03); B(BO, x1 - x0, 0.06, 0.08, M(0xf7f7f5, 0.5), (x0 + x1) / 2, y + 0.98, -0.03); };
  for (const y of [GY + 0.1, GY + 2.85, GY + 5.6]) balc(4.15, 7.55, y);
  for (const x of [-8, 14]) for (const y of [GY + 0.1, GY + 2.85, GY + 5.6, 0.0]) balc(x, x + 3.4, y);
  // (the drivable neighborhood — ground, roads, stores — is built in 03e_world.js)
  const O = G(BO, 8.8, 0, 9.26, Math.PI);
  A.streetLamps = A.streetLamps || [];
  // sky dome
  const skyTex = canvasTex(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3b7fd9'); gr.addColorStop(0.45, '#8fc0f0'); gr.addColorStop(0.5, '#cfe3f5'); gr.addColorStop(1, '#cfe3f5'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })); O.add(sky); A.sky = sky;
  // stars for night
  const sp = new Float32Array(600 * 3); for (let i = 0; i < 600; i++) { const a = Math.random() * TAU, e = Math.random() * 1.3 + 0.15; sp[i * 3] = Math.cos(a) * Math.cos(e) * 280; sp[i * 3 + 1] = Math.sin(e) * 280; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 280; }
  const sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3)); A.stars = new THREE.Points(sgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false })); O.add(A.stars);
}
function tree(p, x, y, z, s, seed) {
  C(p, 0.08 * s, 0.12 * s, 1.6 * s, M(0x4a3628), x, y, z, 6);
  const cols = [0xd9622b, 0xe8a23a, 0xb83a26];
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * s, 1), M(cols[i % 3], 0.9)); b.position.set(x + rand(-0.4, 0.4) * s, y + (1.5 + Math.random() * 0.6) * s, z + rand(-0.4, 0.4) * s); p.add(b); }
}
