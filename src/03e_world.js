// ---------- the neighborhood: stairs, parking lot, Caspian Pl → River Hwy, Harris Teeter, BP + garage ----------
// Layout mirrors the real one: Avalon Lake Norman off Caspian Pl, Harris Teeter in the plaza next door,
// River Hwy (NC-150) as the main road, and the BP with the auto shop behind it across the highway.
const GY = -7.6; // ground level (the unit is on the 3rd floor)

function buildWorld(scene, ctx, A) {
  const W = G(A.world); // exterior lives inside A.world so aiming & interacting work everywhere
  A.worldX = W; A.GY = GY; A.glowMats = A.glowMats || [];
  const COL = (x0, y0, z0, x1, y1, z1) => ctx.addCollider(new THREE.Box3(V3(Math.min(x0, x1), y0, Math.min(z0, z1)), V3(Math.max(x0, x1), y1, Math.max(z0, z1))));
  const conc = M(0xb9b6ae, 0.9), curb = M(0xc9c6be, 0.85), white = M(0xe8e6e0, 0.6), steel = M(0x9aa0a5, 0.4, 0.6);

  // ================= stair tower: corridor (floor 3) down to the lot =================
  // five switchback flights, each dropping 1.52 m; lane A is the west half, lane B the east half
  const TW = { x0: 7.67, x1: 9.87, ix0: 7.77, ix1: 9.77, mid: 8.77, z0: -0.06, z1: 5.43, fz0: 0.93, fz1: 4.93, drop: 1.52 };
  {
    const T_ = G(W), wallM = M(0xd6cbb8, 0.92), inWall = new THREE.MeshStandardMaterial({ color: 0xd6cbb8, roughness: 0.92, side: THREE.DoubleSide });
    const box = (x0, y0, z0, x1, y1, z1, m = inWall) => B(T_, x1 - x0, y1 - y0, z1 - z0, m, (x0 + x1) / 2, y0, (z0 + z1) / 2);
    const top = WALL_H + 0.03;
    // shell: west, east, north (with ground exit), south (with corridor doorway at the top)
    box(TW.x0, GY - 0.1, TW.z0, TW.ix0, top, TW.z1); COL(TW.x0, GY, TW.z0, TW.ix0, top, TW.z1);
    box(TW.ix1, GY - 0.1, TW.z0, TW.x1, top, TW.z1); COL(TW.ix1, GY, TW.z0, TW.x1, top, TW.z1);
    // north wall: solid except a ground-level doorway x 8.2..9.2
    box(TW.ix0, GY - 0.1, TW.z0, 8.2, top, TW.z0 + 0.1); box(9.2, GY - 0.1, TW.z0, TW.ix1, top, TW.z0 + 0.1); box(8.2, GY + 2.2, TW.z0, 9.2, top, TW.z0 + 0.1);
    COL(TW.ix0, GY, TW.z0 - 0.04, 8.2, top, TW.z0 + 0.1); COL(9.2, GY, TW.z0 - 0.04, TW.ix1, top, TW.z0 + 0.1);
    // south wall: solid except the corridor doorway (x 8.2..9.2 at floor-3 level)
    box(TW.ix0, GY - 0.1, TW.z1, 8.2, top, TW.z1 + 0.07); box(9.2, GY - 0.1, TW.z1, TW.ix1, top, TW.z1 + 0.07); box(8.2, GY - 0.1, TW.z1, 9.2, -0.02, TW.z1 + 0.07); box(8.2, 2.2, TW.z1, 9.2, top, TW.z1 + 0.07);
    COL(TW.ix0, GY, TW.z1, 8.2, top, TW.z1 + 0.07); COL(9.2, GY, TW.z1, TW.ix1, top, TW.z1 + 0.07); COL(8.2, GY, TW.z1, 9.2, -0.02, TW.z1 + 0.07);
    // centre wall between the two lanes (flight region only)
    box(TW.mid - 0.05, GY - 0.1, TW.fz0, TW.mid + 0.05, top, TW.fz1); COL(TW.mid - 0.05, GY, TW.fz0, TW.mid + 0.05, top, TW.fz1);
    // roof
    box(TW.x0, top, TW.z0, TW.x1, top + 0.1, TW.z1);
    // flights: visible steps (physics is the ramp in groundAt)
    const stepM = M(0xb9b6ae, 0.9), railM = M(0x3a3f45, 0.5, 0.5);
    for (let i = 0; i < 5; i++) {
      const laneA = i % 2 === 0, x0 = laneA ? TW.ix0 : TW.mid + 0.05, x1 = laneA ? TW.mid - 0.05 : TW.ix1;
      const yTop = -i * TW.drop;
      for (let s = 0; s < 8; s++) {
        const f = (s + 0.5) / 8; // fraction along the flight (from its top end)
        const z = laneA ? TW.fz1 - f * (TW.fz1 - TW.fz0) : TW.fz0 + f * (TW.fz1 - TW.fz0);
        const y = yTop - f * TW.drop;
        B(T_, x1 - x0 - 0.04, 0.09, 0.52, stepM, (x0 + x1) / 2, y - 0.1, z);
      }
      const rail = C(T_, 0.022, 0.022, Math.hypot(TW.fz1 - TW.fz0, TW.drop), railM, (x0 + x1) / 2 + (laneA ? -0.42 : 0.42), yTop - TW.drop / 2 + 0.85, (TW.fz0 + TW.fz1) / 2, 8);
      rail.rotation.x = Math.PI / 2 + Math.atan2(TW.drop, TW.fz1 - TW.fz0) * (laneA ? -1 : 1);
    }
    // landings
    for (const y of [0, -3.04, -6.08]) B(T_, TW.ix1 - TW.ix0, 0.12, TW.z1 - TW.fz1 + 0.06, stepM, (TW.ix0 + TW.ix1) / 2, y - 0.13, (TW.fz1 + TW.z1) / 2);
    for (const y of [-1.52, -4.56, -7.6]) if (y !== -7.6) B(T_, TW.ix1 - TW.ix0, 0.12, TW.fz0 - TW.z0 - 0.06, stepM, (TW.ix0 + TW.ix1) / 2, y - 0.13, (TW.z0 + TW.fz0) / 2);
    // landing lights (always on) + floor tags
    for (const [y, n] of [[2.25, '3'], [-0.8, '2'], [-3.84, '1'], [-6.6, 'G']]) {
      plane(T_, 0.5, 0.22, E(0xfff3dc, 1.4), TW.mid, y, TW.z0 + 0.12);
      const t = canvasTex(64, 64, (g) => { g.fillStyle = '#2e3a46'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#fff'; g.font = 'bold 44px system-ui'; g.textAlign = 'center'; g.fillText(n, 32, 48); });
      plane(T_, 0.28, 0.28, M(0xffffff, 0.8, 0, { map: t }), TW.mid, y - 0.5, TW.z0 + 0.12);
    }
    const sgn = canvasTex(128, 48, (g) => { g.fillStyle = '#2e3a46'; g.fillRect(0, 0, 128, 48); g.fillStyle = '#fff'; g.font = 'bold 22px system-ui'; g.textAlign = 'center'; g.fillText('STAIRS ▾', 64, 32); });
    plane(T_, 0.6, 0.22, M(0xffffff, 0.8, 0, { map: sgn }), 8.7, 2.25, TW.z1 + 0.085, 0, Math.PI);
  }
  // ground height: ramps inside the tower, 0 in the home/corridor/neighbor floor, GY outside
  const FLOORS_UP = [{ x0: -0.2, z0: -1.75, x1: 9.95, z1: 10.6 }, { x0: 9.8, z0: 5.5, x1: 14.15, z1: 10.5 }];
  A.groundAt = (x, z, y = 0) => {
    if (x > TW.ix0 && x < TW.ix1 && z > TW.z0 && z < TW.z1 + 0.1 && y < 0.95) {
      let cand;
      if (z >= TW.fz1) cand = [0, -3.04, -6.08];
      else if (z <= TW.fz0) cand = [-1.52, -4.56, -7.6];
      else { const f = (TW.fz1 - z) / (TW.fz1 - TW.fz0); cand = x <= TW.mid ? [-f * TW.drop, -3.04 - f * TW.drop, -6.08 - f * TW.drop] : [-3.04 + f * TW.drop, -6.08 + f * TW.drop]; }
      let best = -1e9; for (const c of cand) if (c <= y + 0.6 && c > best) best = c;
      return best > -1e8 ? best : Math.min(...cand);
    }
    for (const r of FLOORS_UP) if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1 && y > -1.4) return 0;
    for (const f of EXT_FLOORS) if (x > f.x0 && x < f.x1 && z > f.z0 && z < f.z1) return GY + f.y;
    return GY;
  };
  const EXT_FLOORS = []; // raised slabs outside (store floors, islands)

  // ================= neighbor: Marcus in 2B (through the door across the hall) =================
  {
    const R_ = G(W), wallM = new THREE.MeshStandardMaterial({ color: 0xe3dccd, roughness: 0.92, side: THREE.DoubleSide });
    const box = (x0, y0, z0, x1, y1, z1, m = wallM) => B(R_, x1 - x0, y1 - y0, z1 - z0, m, (x0 + x1) / 2, y0, (z0 + z1) / 2);
    // shell x 9.87..14.1, z 5.5..10.5 (the corridor wall already has the doorway at z 7.0..7.95)
    box(14.03, 0, 5.5, 14.1, WALL_H, 10.5); COL(14.03, 0, 5.5, 14.1, WALL_H, 10.5);
    box(9.87, 0, 5.5, 14.1, WALL_H, 5.57); COL(9.87, 0, 5.43, 14.1, WALL_H, 5.57);
    box(9.87, 0, 10.43, 14.1, WALL_H, 10.5); COL(9.87, 0, 10.43, 14.1, WALL_H, 10.5);
    box(9.87, 0, 5.5, 9.94, WALL_H, 7.0); box(9.87, 0, 7.95, 9.94, WALL_H, 10.5); // his side of the corridor wall
    const fl = M(0xffffff, 0.6, 0, { map: floorTex('walnut') }); plane(R_, 4.2, 5.0, fl, 12.0, 0.001, 8.0, -Math.PI / 2);
    plane(R_, 4.2, 5.0, M(0xf6f4ef, 0.95), 12.0, WALL_H - 0.01, 8.0, Math.PI / 2);
    plane(R_, 0.8, 0.5, E(0xfff3dc, 1.2), 12.0, WALL_H - 0.02, 8.0, Math.PI / 2); // always-on ceiling light
    // his front door (opens into his place, hinged in the corridor doorway)
    const piv = G(R_, 9.9, 0, 7.95); const leaf = B(piv, 0.06, 2.1, 0.92, M(0x5b4632, 0.6), 0.03, 0, -0.46);
    B(leaf.parent, 0.02, 0.04, 0.04, M(0xc8b273, 0.3, 0.8), 0.07, 1.02, -0.8);
    const num = canvasTex(64, 32, (g) => { g.fillStyle = '#3a2f22'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#e8dcc0'; g.font = 'bold 20px Georgia'; g.textAlign = 'center'; g.fillText('2B', 32, 24); });
    plane(R_, 0.18, 0.09, M(0xffffff, 0.7, 0, { map: num }), 9.858, 1.75, 7.475, 0, -Math.PI / 2);
    const dSt = { open: false, v: 0, answering: 0 }; markMoves(piv); markDyn(piv);
    const doorBox = new THREE.Box3(V3(9.84, 0, 7.0), V3(9.97, 2.1, 7.95));
    ctx.addCollider(doorBox, () => { if (dSt.v > 0.4) doorBox.makeEmpty(); else doorBox.set(V3(9.84, 0, 7.0), V3(9.97, 2.1, 7.95)); });
    // furnishings: sofa toward a TV, rug, lamp, kitchenette strip, posters
    B(R_, 1.9, 0.72, 0.85, M(0x4a5a68, 0.9), 12.0, 0, 9.9); B(R_, 1.9, 0.5, 0.2, M(0x4a5a68, 0.9), 12.0, 0.7, 10.25); COL(11.05, 0, 9.45, 12.95, 0.8, 10.4);
    plane(R_, 2.2, 1.6, M(0xffffff, 0.9, 0, { map: getTex('oldrug') }), 12.0, 0.005, 8.6, -Math.PI / 2);
    B(R_, 1.3, 0.1, 0.65, M(0x6b4a35, 0.6), 12.0, 0.3, 8.55); COL(11.35, 0, 8.2, 12.65, 0.45, 8.9);
    const tvm = new THREE.MeshBasicMaterial({ color: 0x223038 }); B(R_, 1.5, 0.85, 0.06, M(0x111111, 0.4), 12.0, 1.0, 5.65); plane(R_, 1.38, 0.74, tvm, 12.0, 1.06, 5.69);
    const consM = M(0x3a2f26, 0.7); B(R_, 1.7, 0.4, 0.4, consM, 12.0, 0, 5.8); COL(11.15, 0, 5.6, 12.85, 0.5, 6.0);
    B(R_, 1.6, 0.9, 0.55, M(0xd9d5cc, 0.8), 13.6, 0, 7.0); B(R_, 1.6, 0.05, 0.6, M(0x8a8f94, 0.3, 0.6), 13.6, 0.9, 7.0); COL(13.3, 0, 6.2, 14.0, 1.0, 7.8); // kitchenette
    C(R_, 0.14, 0.18, 0.4, M(0x2e3a46, 0.8), 10.6, 0, 9.9, 10); S(R_, 0.3, M(0x7c8f6a, 0.8), 10.6, 0.62, 9.9, 8, 6); // plant
    const lampG = E(0xffd9a0, 1.1); C(R_, 0.02, 0.02, 1.4, M(0x222222, 0.5), 13.5, 0, 9.9, 8); const lsh = C(R_, 0.14, 0.18, 0.22, lampG, 13.5, 1.4, 9.9, 12);
    plane(R_, 0.6, 0.8, M(0xffffff, 0.8, 0, { map: artTex('poster', 7) }), 14.0, 1.3, 8.6, 0, -Math.PI / 2);
    // Marcus himself
    const marcus = makePerson({ shirt: 0x7a4a2a, pants: 0x32383e, skin: 0xc98a5e, hair: 0x18120c });
    marcus.g.position.set(12.4, 0, 9.4); marcus.g.rotation.y = Math.PI; W.add(marcus.g);
    makeTalker(ctx, marcus, {
      name: 'Marcus', task: 'neighbor',
      firstLine: 'Hey! You must be from 2A — I\'m Marcus. Welcome!',
      lines: ['How\'s the apartment treating you?', 'That Harris Teeter next door is dangerous. I\'m there daily.', 'If you hear my TV through the wall, just bang on it.', 'Panthers game on Sunday — you watching?', 'The BP on River Hwy fixed my brakes. Good folks.', 'Lilah seems great, by the way. You two settling in?'],
    });
    const mState = { phase: 'home' };
    ctx.interact(leaf, {
      label: () => dSt.open ? 'Close Marcus\'s door' : dSt.answering ? '' : 'Knock on 2B 🚪',
      action: () => {
        if (dSt.open) { dSt.open = false; Sfx.door(false); return; }
        if (dSt.answering) return;
        Sfx.knock(); dSt.answering = 1;
        setTimeout(() => { marcus.say('Coming!'); }, 700);
        setTimeout(() => { dSt.open = true; Sfx.door(true); dSt.answering = 0; if (!store.get('metMarcus', false)) { store.set('metMarcus', true); ctx.msg('👋 Marcus opens the door. Right-click him to say hi.'); } }, 1900);
      }
    });
    ctx.tick(R_, (dt, t) => {
      dSt.v = lerp(dSt.v, dSt.open ? 1 : 0, Math.min(1, dt * 6)); piv.rotation.y = -dSt.v * 1.9; // opens into his place
      const px = ctx.playerPos();
      if (dSt.open) {
        // he walks to the doorway while you're there, then drifts back to his TV spot
        const near = Math.hypot(px.x - 10.6, px.z - 7.5) < 3.2;
        walkPerson(marcus, dt, t, near ? (Math.hypot(marcus.g.position.x - 10.9, marcus.g.position.z - 7.5) > 0.3 ? [[10.9, 7.5]] : []) : (Math.hypot(marcus.g.position.x - 12.4, marcus.g.position.z - 9.4) > 0.3 ? [[12.4, 9.4]] : []), 1.1);
        if (!near && Math.hypot(px.x - 10.6, px.z - 7.5) > 6) { dSt.open = false; Sfx.door(false); }
      } else animPerson(marcus, dt, t, 0);
      tvm.color.setHSL(0.6 + Math.sin(t * 0.7) * 0.05, 0.3, dSt.open || true ? 0.22 + Math.sin(t * 3.1) * 0.05 : 0.1);
    });
  }

  // ================= ground, parking lot, Caspian Pl, River Hwy =================
  const grass = M(0xffffff, 1, 0, { map: getTex('grass') });
  plane(W, 760, 700, grass, 30, GY - 0.01, -100, -Math.PI / 2);
  const asphTex = () => { const m = M(0xffffff, 0.95, 0, { map: getTex('asphalt').clone() }); m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; return m; };
  const road = (x0, z0, x1, z1, y = 0.02) => { const m = asphTex(); m.map.repeat.set((x1 - x0) / 9, (z1 - z0) / 9); m.map.needsUpdate = true; plane(W, x1 - x0, z1 - z0, m, (x0 + x1) / 2, GY + y, (z0 + z1) / 2, -Math.PI / 2); };
  const paint = (x0, z0, x1, z1, col = 0xe8e6e0, y = 0.045) => plane(W, Math.abs(x1 - x0), Math.abs(z1 - z0), M(col, 0.7), (x0 + x1) / 2, GY + y, (z0 + z1) / 2, -Math.PI / 2);
  const dashZ = (x, z0, z1, col = 0xd9b44a) => { for (let z = z0; z < z1; z += 4) paint(x - 0.08, z, x + 0.08, Math.min(z + 1.8, z1), col); };
  const dashX = (z, x0, x1, col = 0xe8e6e0) => { for (let x = x0; x < x1; x += 5) paint(x, z - 0.09, Math.min(x + 2.2, x1), z + 0.09, col); };
  const walk = (x0, z0, x1, z1) => plane(W, x1 - x0, z1 - z0, conc, (x0 + x1) / 2, GY + 0.06, (z0 + z1) / 2, -Math.PI / 2);

  // parking lot (north of the building, at the bottom of the stairs)
  road(-34, -31, 40, -3.8); walk(-16, -3.8, 26, -0.4);
  for (let x = -32; x <= 36; x += 2.9) { if (x > 18 && x < 33) continue; paint(x - 0.07, -30.5, x + 0.07, -25.2); paint(x - 0.07, -9.2, x + 0.07, -3.9); }
  // light posts
  A.streetLamps = A.streetLamps || [];
  const lamp = (x, z) => { C(W, 0.09, 0.12, 7, M(0x2a2a2a, 0.6), x, GY, z, 8); const h = S(W, 0.28, E(0xffe0a0, 0), x, GY + 7, z, 10, 8); A.streetLamps.push(h.material); COL(x - 0.15, GY, z - 0.15, x + 0.15, GY + 2, z + 0.15); };
  for (const [x, z] of [[-20, -17], [2, -17], [24, -17], [-20, -32], [2, -32]]) lamp(x, z);
  // parked cars (decorative, with colliders)
  const carCols = [0x2e3a46, 0xf2f2f2, 0x1f1f22, 0x7a8a99, 0x4a7fb5, 0xc9ccd0, 0x6b4a35, 0x8a9aa0];
  function parkedCar(x, z, ry, col) {
    const c = G(W, x, GY, z, ry); const cm = M(col, 0.3, 0.6);
    B(c, 1.8, 0.55, 4.3, cm, 0, 0.25, 0); B(c, 1.6, 0.5, 2.2, M(0x1c232b, 0.1, 0.5), 0, 0.8, -0.1); B(c, 1.62, 0.06, 2.0, cm, 0, 1.3, -0.1);
    for (const wx of [-0.86, 0.86]) for (const wz of [-1.4, 1.4]) { const w = C(c, 0.33, 0.33, 0.2, M(0x111111, 0.8), wx, 0.33, wz, 10); w.rotation.z = Math.PI / 2; w.position.y = 0.33; }
    COL(x - 1.6, GY + 0.25, z - 1.6, x + 1.6, GY + 1.3, z + 1.6);
    return c;
  }
  for (let i = 0; i < 12; i++) { const x = -29 + i * 2.9 * 1.8 + rand(-0.2, 0.2); if (x > 8 && x < 17) continue; parkedCar(x, i % 2 ? -6.6 : -27.8, (i % 2 ? Math.PI : 0) + rand(-0.04, 0.04), carCols[(Math.random() * carCols.length) | 0]); }

  // Caspian Pl → north to River Hwy
  road(21, -126, 31, -30); dashZ(26, -122, -34);
  walk(31, -120, 33.5, -31);
  // complex entrance sign
  {
    const t = canvasTex(256, 128, (g) => { g.fillStyle = '#2e3a34'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#c8b273'; g.lineWidth = 5; g.strokeRect(7, 7, 242, 114); g.fillStyle = '#e8dcc0'; g.textAlign = 'center'; g.font = 'bold 30px Georgia'; g.fillText('Avalon', 128, 48); g.fillText('Lake Norman', 128, 82); g.font = '18px Georgia'; g.fillText('136 Caspian Pl', 128, 110); });
    const s = G(W, 35.5, GY, -36, -0.5); B(s, 0.25, 1.2, 1.1, M(0x8a8178, 0.9), 0, 0, 0); plane(s, 2.2, 1.1, M(0xffffff, 0.8, 0, { map: t }), 0, 1.6, 0.0); B(s, 2.4, 1.3, 0.18, M(0x2e3a34, 0.8), 0, 1.0, -0.12);
    COL(34.5, GY, -37, 36.5, GY + 2, -35);
  }
  // more complex buildings along Caspian
  const facT = getTex('facade');
  function bgBuilding(x, z, w, d, h, ry = 0) {
    const b = G(W, x, GY, z, ry); const t = facT.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 12, h / 10);
    B(b, w, h, d, M(0xffffff, 0.85, 0, { map: t }), 0, 0, 0);
    const r = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, 2.6, 4), M(0x4a4f55, 0.8)); r.rotation.y = Math.PI / 4; r.scale.z = d / w; r.position.y = h + 1.3; b.add(r);
    COL(x - w / 2 - 1, GY, z - d / 2 - 1, x + w / 2 + 1, GY + h, z + d / 2 + 1);
  }
  bgBuilding(2, -56, 26, 13, 9, 0.06); bgBuilding(46, -52, 24, 13, 9, -0.1); bgBuilding(-24, -46, 20, 12, 9, 0.2); bgBuilding(50, -16, 16, 12, 9, -1.2);

  // Town Center Dr (to the Harris Teeter plaza)
  road(-46, -72, 22, -65); dashX(-68.5, -44, 20, 0xd9b44a);
  // River Hwy (NC-150)
  road(-220, -141, 262, -126);
  paint(-220, -133.8, 262, -133.5, 0xd9b44a); paint(-220, -133.2, 262, -132.9, 0xd9b44a);
  dashX(-129.7, -218, 260); dashX(-137.3, -218, 260);
  for (let x = -200; x <= 250; x += 34) { lamp(x, -124.3); if (x > -90) lamp(x + 17, -142.7); }
  // crosswalk + stop at the Caspian T
  for (let x = 21.8; x < 31; x += 1.4) paint(x, -126.3, x + 0.7, -140.7);
  paint(21.5, -125.4, 31, -124.9);
  function sign(x, z, draw, w = 1.0, h = 1.0, ry = 0, poleH = 2.6) {
    const t = canvasTex(160, 160, draw); const s = G(W, x, GY, z, ry);
    C(s, 0.04, 0.05, poleH, steel, 0, 0, 0, 8); plane(s, w, h, M(0xffffff, 0.7, 0, { map: t }), 0, poleH - h / 2 + 0.2, 0.03);
    COL(x - 0.12, GY, z - 0.12, x + 0.12, GY + 1.8, z + 0.12); return s;
  }
  sign(33, -123, (g) => { g.fillStyle = '#b32025'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + TAU / 16; g.lineTo(80 + 70 * Math.cos(a), 80 + 70 * Math.sin(a)); } g.closePath(); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 42px system-ui'; g.textAlign = 'center'; g.fillText('STOP', 80, 95); }, 0.8, 0.8);
  sign(33, -119, (g) => { g.fillStyle = '#1f5a30'; g.fillRect(0, 40, 160, 44); g.fillStyle = '#fff'; g.font = 'bold 26px system-ui'; g.textAlign = 'center'; g.fillText('Caspian Pl', 80, 70); g.fillStyle = '#1f5a30'; g.fillRect(0, 88, 160, 44); g.fillStyle = '#fff'; g.fillText('River Hwy', 80, 118); }, 1.1, 1.1, 0, 3.0);
  sign(-60, -123, (g) => { g.fillStyle = '#fff'; g.fillRect(20, 20, 120, 130); g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(24, 24, 112, 122); g.fillStyle = '#111'; g.textAlign = 'center'; g.font = '20px system-ui'; g.fillText('SPEED', 80, 52); g.fillText('LIMIT', 80, 74); g.font = 'bold 52px system-ui'; g.fillText('45', 80, 126); }, 0.85, 0.9);
  sign(120, -144.5, (g) => { g.fillStyle = '#1f5a30'; g.fillRect(0, 30, 160, 100); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 24px system-ui'; g.fillText('NC-150', 80, 72); g.font = '20px system-ui'; g.fillText('River Hwy →', 80, 106); }, 1.2, 1.2, Math.PI);

  // ================= Harris Teeter plaza (next door) =================
  const HT = { x0: -118, x1: -72, z0: -34, z1: -58 };
  {
    road(-116, -112, -44, -58); // plaza lot
    road(-88, -126, -76, -108); // driveway to the highway
    for (let x = -112; x <= -50; x += 2.9) { paint(x - 0.07, -86, x + 0.07, -80.5); paint(x - 0.07, -79.5, x + 0.07, -74); }
    walk(HT.x0 - 2, HT.z1 - 3.4, HT.x1 + 6, HT.z1);
    const S_ = G(W); EXT_FLOORS.push({ x0: HT.x0, z0: HT.z1, x1: HT.x1 + 4, z1: HT.z0, y: 0.08 });
    const wallM = M(0xd9cfc0, 0.9), band = M(0x1f4432, 0.7);
    const bx = (x0, y0, z0, x1, y1, z1, m = wallM) => B(S_, x1 - x0, y1 - y0, z1 - z0, m, (x0 + x1) / 2, GY + y0, (z0 + z1) / 2);
    // shell (entrance on the south face, toward its lot)
    bx(HT.x0, 0, HT.z0 - 0.4, HT.x1 + 4, 7, HT.z0); COL(HT.x0, GY, HT.z0 - 0.4, HT.x1 + 4, GY + 7, HT.z0);
    bx(HT.x0 - 0.4, 0, HT.z0, HT.x0, 7, HT.z1); COL(HT.x0 - 0.4, GY, HT.z0, HT.x0, GY + 7, HT.z1);
    bx(HT.x1 + 4, 0, HT.z0, HT.x1 + 4.4, 7, HT.z1); COL(HT.x1 + 4, GY, HT.z0, HT.x1 + 4.4, GY + 7, HT.z1);
    // south face: wall pieces + glass front + sliding doors at centre x -97..-93
    bx(HT.x0, 0, HT.z1 - 0.4, -106, 7, HT.z1); COL(HT.x0, GY, HT.z1 - 0.4, -106, GY + 7, HT.z1);
    bx(-84, 0, HT.z1 - 0.4, HT.x1 + 4, 7, HT.z1); COL(-84, GY, HT.z1 - 0.4, HT.x1 + 4, GY + 7, HT.z1);
    bx(-106, 3.2, HT.z1 - 0.4, -84, 7, HT.z1);
    const glassM = new THREE.MeshStandardMaterial({ color: 0x9fc4d8, roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.45 });
    for (const [a, b2] of [[-106, -97.2], [-92.8, -84]]) { bx(a, 0, HT.z1 - 0.22, b2, 3.2, HT.z1 - 0.1, glassM); COL(a, GY, HT.z1 - 0.3, b2, GY + 3.2, HT.z1 - 0.05); }
    bx(HT.x0, 7, HT.z0 - 0.4, HT.x1 + 4.4, 7.4, HT.z1); // roof
    // sliding doors
    const dL = B(S_, 2.2, 3.0, 0.08, glassM, -96.1, GY + 0.08, HT.z1 - 0.16), dR = B(S_, 2.2, 3.0, 0.08, glassM, -93.9, GY + 0.08, HT.z1 - 0.16);
    markDyn(dL, dR); const doorB = new THREE.Box3(V3(-97.3, GY, HT.z1 - 0.35), V3(-92.7, GY + 3, HT.z1));
    ctx.addCollider(doorB, null);
    ctx.tick(S_, (dt) => {
      const p = ctx.playerPos(); const near = p.y < -2 && Math.abs(p.z - HT.z1) < 3.5 && p.x > -99 && p.x < -91;
      const o = lerp(dL.userData.o || 0, near ? 1 : 0, Math.min(1, dt * 4)); dL.userData.o = o;
      if (Math.abs(o - (dL.userData.lo || 0)) > 0.002) { dL.userData.lo = o; dL.position.x = -96.1 - o * 2.1; dR.position.x = -93.9 + o * 2.1; if (o > 0.6) doorB.makeEmpty(); else doorB.set(V3(-97.3, GY, HT.z1 - 0.35), V3(-92.7, GY + 3, HT.z1)); }
    });
    // sign band + letters
    const htT = canvasTex(512, 96, (g) => { g.fillStyle = '#1f4432'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#f6efe0'; g.font = 'bold 56px Georgia'; g.textAlign = 'center'; g.fillText('Harris Teeter', 256, 64); });
    const htSign = new THREE.MeshStandardMaterial({ map: htT, emissive: 0xffffff, emissiveMap: htT, emissiveIntensity: 0.35, roughness: 0.6 });
    plane(S_, 18, 3.4, htSign, -95, GY + 4.9, HT.z1 + 0.02, 0, Math.PI); A.glowMats.push(htSign);
    // interior: bright ceiling, tile floor, aisles, produce, dairy glow, registers
    const tile = M(0xffffff, 0.55, 0, { map: floorTex('tile') }); plane(S_, HT.x1 + 4 - HT.x0 - 0.8, HT.z0 - HT.z1 - 0.8, tile, (HT.x0 + HT.x1 + 4) / 2, GY + 0.08, (HT.z0 + HT.z1) / 2, -Math.PI / 2);
    plane(S_, HT.x1 + 4 - HT.x0 - 0.8, HT.z0 - HT.z1 - 0.8, M(0xf4f2ec, 0.95), (HT.x0 + HT.x1 + 4) / 2, GY + 6.9, (HT.z0 + HT.z1) / 2, Math.PI / 2);
    for (let i = 0; i < 4; i++) plane(S_, 30, 0.8, E(0xfff6e2, 1.5), -93, GY + 6.85, -38.5 - i * 5, Math.PI / 2);
    const shelfM = M(0x8a9aa0, 0.6), goodCols = [0xc0392b, 0xd9b44a, 0x4a7fb5, 0x7c8f6a, 0xe07a3f, 0xb8a7d6, 0xf2f2f2];
    function aisle(xc, z0, z1) {
      B(S_, 1.4, 1.9, z1 - z0, shelfM, xc, GY + 0.08, (z0 + z1) / 2); COL(xc - 0.7, GY, z0, xc + 0.7, GY + 2, z1);
      for (let z = z0 + 0.6; z < z1 - 0.4; z += 0.62) for (let lv = 0; lv < 3; lv++) for (const s of [-1, 1])
        B(S_, 0.12, 0.26, 0.42, M(goodCols[(Math.random() * goodCols.length) | 0], 0.7), xc + s * 0.78, GY + 0.35 + lv * 0.55, z);
    }
    aisle(-104, -52, -38); aisle(-98, -52, -38); aisle(-92, -52, -38); aisle(-86, -52, -38);
    // produce bins
    for (const [x, z] of [[-112, -44], [-112, -48], [-112, -52]]) { B(S_, 2.6, 0.9, 2.2, M(0x3a5a40, 0.8), x, GY + 0.08, z); for (let i = 0; i < 12; i++) S(S_, 0.11, M([0xc0262d, 0xe8892b, 0x8fb339, 0xf2d24b][i % 4], 0.55), x + rand(-1, 1), GY + 1.05, z + rand(-0.8, 0.8), 8, 6); COL(x - 1.3, GY, z - 1.1, x + 1.3, GY + 1, z + 1.1); }
    // dairy wall (back)
    const dairy = E(0xdff0ff, 0.9); B(S_, 36, 2.4, 0.7, M(0xe8ecef, 0.5), -92, GY + 0.08, HT.z0 + 0.8); plane(S_, 35, 1.8, dairy, -92, GY + 0.6, HT.z0 + 1.16, 0, Math.PI); COL(-110, GY, HT.z0, -74, GY + 2.5, HT.z0 + 1.2);
    // flower stand & cooler near the front
    const flw = G(S_, -108.5, GY + 0.08, -55.5); B(flw, 1.6, 0.8, 1.2, M(0x6b4a35, 0.7), 0, 0, 0); for (let i = 0; i < 8; i++) { C(flw, 0.05, 0.06, 0.3, M(0x2a6b4f, 0.8), -0.6 + (i % 4) * 0.4, 0.8, i < 4 ? -0.3 : 0.3, 6); S(flw, 0.11, M([0xd94f70, 0xf2d24b, 0xe3b8b8, 0xb8a7d6][i % 4], 0.6), -0.6 + (i % 4) * 0.4, 1.2, i < 4 ? -0.3 : 0.3, 8, 6); }
    COL(-109.3, GY, -56.1, -107.7, GY + 1, -54.9);
    const cool = G(S_, -80, GY + 0.08, -55.5); B(cool, 2.0, 2.0, 1.0, M(0xb32025, 0.5), 0, 0, 0); plane(cool, 1.7, 1.4, E(0xcfe8ff, 0.8), 0, 0.3, 0.51); COL(-81, GY, -56, -79, GY + 2, -55);
    // registers + Dana
    for (const x of [-96.5, -91.5]) { B(S_, 0.9, 1.0, 3.2, M(0x3f4a52, 0.7), x, GY + 0.08, -54.2); B(S_, 0.9, 0.08, 1.0, M(0x222, 0.5), x, GY + 1.08, -53.2); COL(x - 0.45, GY, -55.8, x + 0.45, GY + 1.1, -52.6); }
    const dana = makePerson({ shirt: 0x1f4432, pants: 0x2e3a46, skin: 0xe8c39a, hair: 0x6b3a1a, apron: 0x16352a });
    dana.g.position.set(-91.5, GY + 0.08, -52.9); dana.g.rotation.y = Math.PI; W.add(dana.g);
    ctx.tick(dana.g, (dt, t) => animPerson(dana, dt, t, 0));
    makeTalker(ctx, dana, { name: 'Dana', firstLine: 'Welcome to Harris Teeter! Holler if you need anything.', lines: ['The gala apples came in this morning.', 'VIC card? I\'ll scan mine for you.', 'Cold out there today, huh?'] });
    // buying
    const buy = (obj, label, cost, after) => ctx.interact(obj, { cook: true, reach: 3, label: () => label + ' · $' + cost, action: () => { if (!ctx.spend(cost, label)) return; Sfx.chime(); after(); } });
    buy(flw, 'Fall bouquet for Lilah 💐', 6, () => { ctx.give('flowers', {}, { rise: true }); ctx.msg('She\'s going to love these. Left-click to snap her a photo. 💐'); });
    for (const xc of [-104, -98, -92, -86]) { const h = B(S_, 1.6, 2, 14, new THREE.MeshBasicMaterial({ visible: false }), xc, GY + 0.08, -45); ctx.interact(h, { cook: true, reach: 3, label: () => 'Grab a bag of groceries 🛒 · $12', action: () => { if (!ctx.spend(12, 'groceries')) return; Sfx.pop(); ctx.give('groceries', {}, { rise: true }); ctx.msg('Got the essentials. Pay at the register, then put them away at home.'); } }); }
    buy(cool, 'Energy drink ⚡', 3, () => { ctx.need('energy', 0.25); ctx.drink('coffee'); ctx.msg('Wings: acquired. ⚡'); });
    // cart corral
    const corral = G(W, -62, GY, -70); B(corral, 0.06, 1.0, 5, steel, -1, 0, 0); B(corral, 0.06, 1.0, 5, steel, 1, 0, 0); COL(-63.2, GY, -72.6, -60.8, GY + 1.1, -67.4);
    for (let i = 0; i < 3; i++) { const c = G(corral, 0, 0.15, -1.6 + i * 0.8); B(c, 0.8, 0.5, 0.9, steel, 0, 0.35, 0); for (const [wx, wz] of [[-0.3, -0.35], [0.3, -0.35], [-0.3, 0.35], [0.3, 0.35]]) S(c, 0.07, M(0x222222, 0.6), wx, 0.07, wz, 6, 4); }
    parkedCar(-70, -77.5, 0.03, 0xf2f2f2); parkedCar(-58, -77.3, -0.02, 0x2e3a46);
  }

  // ================= BP + the garage behind it (across River Hwy, down the road) =================
  {
    road(146, -148, 200, -141); // apron from the highway
    road(146, -196, 200, -148); // forecourt
    road(146, -216, 186, -196); // back lot by the garage
    const B_ = G(W);
    // canopy
    const canM = M(0xf2f2f0, 0.7), greenM = M(0x1e7a46, 0.6);
    B(B_, 34, 0.7, 20, canM, 167, GY + 5.0, -161); B(B_, 34.2, 0.5, 20.2, greenM, 167, GY + 4.6, -161);
    const bpT = canvasTex(128, 128, (g) => { g.fillStyle = '#1e7a46'; g.fillRect(0, 0, 128, 128); for (let r = 54, i = 0; r > 10; r -= 11, i++) { g.fillStyle = ['#ffe600', '#ffffff', '#ffe600', '#1e7a46'][i % 4]; g.beginPath(); for (let k = 0; k < 20; k++) { const a = k / 20 * TAU, rr = k % 2 ? r * 0.62 : r; g.lineTo(64 + rr * Math.cos(a), 56 + rr * Math.sin(a)); } g.closePath(); g.fill(); } g.fillStyle = '#fff'; g.font = 'bold italic 30px system-ui'; g.textAlign = 'center'; g.fillText('bp', 64, 120); });
    for (const ry of [0, Math.PI]) plane(B_, 4, 4, new THREE.MeshStandardMaterial({ map: bpT, emissive: 0xffffff, emissiveMap: bpT, emissiveIntensity: 0.25, roughness: 0.6 }), 167, GY + 4.65, -161 + (ry ? 10.2 : -10.2), 0, ry);
    for (const [cx, cz] of [[154, -155], [180, -155], [154, -167], [180, -167]]) { C(B_, 0.22, 0.26, 5, canM, cx, GY, cz, 10); COL(cx - 0.3, GY, cz - 0.3, cx + 0.3, GY + 2, cz + 0.3); }
    // pump islands + dispensers
    A.pumps = [];
    for (const ix of [160, 174]) {
      B(B_, 3.2, 0.18, 10, curb, ix, GY, -161); EXT_FLOORS.push({ x0: ix - 1.6, z0: -166, x1: ix + 1.6, z1: -156, y: 0.18 });
      for (const pz of [-158.2, -163.8]) {
        const p = G(B_, ix, GY + 0.18, pz); B(p, 1.0, 1.9, 0.62, M(0xe8e8e6, 0.5), 0, 0, 0); B(p, 1.04, 0.5, 0.66, greenM, 0, 1.1, 0);
        plane(p, 0.5, 0.3, E(0x1a2a1a, 0.6), 0, 1.25, 0.34); for (const s of [-1, 1]) B(p, 0.1, 0.5, 0.08, M(0x222222, 0.6), s * 0.38, 0.5, s * 0.28);
        COL(ix - 0.55, GY, pz - 0.35, ix + 0.55, GY + 2, pz + 0.35);
        A.pumps.push(V3(ix, GY, pz));
        ctx.interact(p, { cook: true, reach: 4.8, label: () => { const c = A.car && A.car.g.position; if (!c || Math.hypot(c.x - ix, c.z - pz) > 6) return 'Pump ' + A.pumps.length + ' — park the Corolla here first'; return A.car.st.fuel > 0.97 ? 'Tank is full ⛽' : 'Fill up the Corolla ⛽ (' + Math.round(A.car.st.fuel * 100) + '%) · $18'; }, action: () => {
          const c = A.car && A.car.g.position; if (!c || Math.hypot(c.x - ix, c.z - pz) > 6) return ctx.msg('Park the Corolla beside this pump first.');
          if (A.car.st.fuel > 0.97) return ctx.msg('She\'s already full.');
          if (!ctx.spend(18, 'gas')) return;
          const snd = Sfx.loop('water', V3(ix, GY + 1, pz), 0.1);
          ctx.startAction({ label: 'Filling the tank', dur: 5, done: () => { snd.stop(); A.car.st.fuel = 1; Sfx.beep(2, 1500); ctx.task('fuel'); ctx.msg('⛽ Full tank. Receipt? No thanks.'); } });
          setTimeout(() => snd.stop(), 6500);
        } });
      }
    }
    // price sign
    const prT = canvasTex(160, 220, (g) => { g.fillStyle = '#1e7a46'; g.fillRect(0, 0, 160, 220); g.drawImage(bpT.userData.ctx ? bpT.userData.ctx.canvas : bpT.image, 30, 8, 100, 100); g.fillStyle = '#111'; g.fillRect(12, 116, 136, 96); g.fillStyle = '#ffe600'; g.textAlign = 'center'; g.font = 'bold 44px system-ui'; g.fillText('2.89', 80, 162); g.fillStyle = '#fff'; g.font = '20px system-ui'; g.fillText('Regular', 80, 196); });
    const pr = G(W, 149, GY, -146); B(pr, 0.5, 2.6, 0.5, steel, 0, 0, 0); plane(pr, 1.6, 2.2, new THREE.MeshStandardMaterial({ map: prT, emissive: 0xffffff, emissiveMap: prT, emissiveIntensity: 0.25 }), 0, 3.6, 0.3); plane(pr, 1.6, 2.2, new THREE.MeshStandardMaterial({ map: prT, emissive: 0xffffff, emissiveMap: prT, emissiveIntensity: 0.25 }), 0, 3.6, -0.3, 0, Math.PI);
    COL(148.6, GY, -146.4, 149.4, GY + 2, -145.6);
    // the shop
    const SH = { x0: 156, x1: 182, z0: -176, z1: -190 };
    const shM = M(0xe3ded2, 0.85);
    const sb = (x0, y0, z0, x1, y1, z1, m = shM) => B(B_, x1 - x0, y1 - y0, z1 - z0, m, (x0 + x1) / 2, GY + y0, (z0 + z1) / 2);
    EXT_FLOORS.push({ x0: SH.x0, z0: SH.z1, x1: SH.x1, z1: SH.z0, y: 0.06 });
    sb(SH.x0, 0, SH.z1, SH.x1, 4, SH.z1 + 0.4); COL(SH.x0, GY, SH.z1, SH.x1, GY + 4, SH.z1 + 0.4);
    sb(SH.x0, 0, SH.z1, SH.x0 + 0.4, 4, SH.z0); COL(SH.x0, GY, SH.z1, SH.x0 + 0.4, GY + 4, SH.z0);
    sb(SH.x1 - 0.4, 0, SH.z1, SH.x1, 4, SH.z0); COL(SH.x1 - 0.4, GY, SH.z1, SH.x1, GY + 4, SH.z0);
    // front wall with door gap x 167..169.2
    sb(SH.x0, 0, SH.z0 - 0.4, 167, 4, SH.z0); COL(SH.x0, GY, SH.z0 - 0.4, 167, GY + 4, SH.z0);
    sb(169.2, 0, SH.z0 - 0.4, SH.x1, 4, SH.z0); COL(169.2, GY, SH.z0 - 0.4, SH.x1, GY + 4, SH.z0);
    sb(167, 3.0, SH.z0 - 0.4, 169.2, 4, SH.z0);
    sb(SH.x0 - 0.2, 4, SH.z1 - 0.2, SH.x1 + 0.2, 4.35, SH.z0 + 0.2); B(B_, SH.x1 - SH.x0 + 0.4, 0.8, 0.3, greenM, 167 + 2, GY + 3.6, SH.z0 + 0.15);
    plane(B_, (SH.x1 - SH.x0) * 0.8, 0.9, M(0xdfeef7, 0.1, 0.4, { transparent: true, opacity: 0.5 }), 169, GY + 1.9, SH.z0 + 0.01); // window strip
    const shInT = canvasTex(256, 64, (g) => { g.fillStyle = '#1e7a46'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#fff'; g.font = 'bold 34px system-ui'; g.textAlign = 'center'; g.fillText('bp shop', 128, 44); });
    plane(B_, 5, 1.1, new THREE.MeshStandardMaterial({ map: shInT, emissive: 0xffffff, emissiveMap: shInT, emissiveIntensity: 0.3 }), 168, GY + 3.55, SH.z0 + 0.32);
    plane(B_, SH.x1 - SH.x0 - 0.9, -SH.z1 + SH.z0 - 0.9, M(0xffffff, 0.55, 0, { map: floorTex('tile') }), 169, GY + 0.06, -183, -Math.PI / 2);
    plane(B_, SH.x1 - SH.x0 - 0.9, -SH.z1 + SH.z0 - 0.9, M(0xf2f0ea, 0.95), 169, GY + 3.9, -183, Math.PI / 2);
    plane(B_, 10, 0.7, E(0xfff6e2, 1.4), 169, GY + 3.86, -183, Math.PI / 2);
    // cooler wall + snack shelf + counter + Sam
    B(B_, 10, 2.2, 0.8, M(0xcfd4d8, 0.5), 169, GY + 0.06, -189.2); plane(B_, 9.4, 1.7, E(0xcfe8ff, 0.9), 169, GY + 0.5, -188.75); COL(164, GY, -189.8, 174, GY + 2.2, -188.4);
    const snk = B(B_, 4.6, 1.5, 1.0, M(0x8a9aa0, 0.6), 165, GY + 0.06, -183); for (let i = 0; i < 12; i++) B(B_, 0.3, 0.34, 0.2, M([0xe07a3f, 0xd9b44a, 0xc0392b, 0x4a7fb5][i % 4], 0.6), 163.2 + (i % 6) * 0.72, GY + 0.6 + Math.floor(i / 6) * 0.55, -183 + (i % 2 ? 0.25 : -0.25));
    COL(162.7, GY, -183.6, 167.3, GY + 1.6, -182.4);
    const cnt = B(B_, 3.4, 1.05, 1.0, M(0x4a4038, 0.7), 176, GY + 0.06, -180); COL(174.3, GY, -180.6, 177.7, GY + 1.1, -179.4);
    const sam = makePerson({ shirt: 0x1e7a46, pants: 0x222831, skin: 0xd9a06b, hair: 0x2a1a0e, hat: 0x1e7a46 });
    sam.g.position.set(176, GY + 0.06, -181.4); W.add(sam.g);
    ctx.tick(sam.g, (dt, t) => animPerson(sam, dt, t, 0));
    makeTalker(ctx, sam, { name: 'Sam', firstLine: 'Hey! Pump\'s on whenever you\'re ready.', lines: ['Coffee\'s fresh… ish.', 'Ray out back will sort that Corolla right up.', 'Cold snap coming this weekend, they say.'] });
    const snkHit = B(B_, 4.6, 1.7, 1.2, new THREE.MeshBasicMaterial({ visible: false }), 165, GY + 0.06, -183);
    ctx.interact(snkHit, { cook: true, reach: 3, label: () => 'Grab road snacks 🥨 · $4', action: () => { if (!ctx.spend(4, 'snacks')) return; ctx.give('snack', { kind: 'cheese' }, { rise: true }); } });
    const coolHit = B(B_, 9.4, 1.9, 0.5, new THREE.MeshBasicMaterial({ visible: false }), 169, GY + 0.1, -188.5);
    ctx.interact(coolHit, { cook: true, reach: 3, label: () => 'Energy drink from the cooler ⚡ · $3', action: () => { if (!ctx.spend(3, 'energy drink')) return; ctx.need('energy', 0.25); ctx.drink('coffee'); } });

    // ---- the garage behind the BP ----
    const GA = { x0: 150, x1: 182, z0: -198, z1: -214 };
    const gaM = M(0xb9bcbf, 0.7);
    sb(GA.x0, 0, GA.z1, GA.x1, 4.6, GA.z1 + 0.5, gaM); COL(GA.x0, GY, GA.z1, GA.x1, GY + 4.6, GA.z1 + 0.5);
    sb(GA.x0, 0, GA.z1, GA.x0 + 0.5, 4.6, GA.z0, gaM); COL(GA.x0, GY, GA.z1, GA.x0 + 0.5, GY + 4.6, GA.z0);
    sb(GA.x1 - 0.5, 0, GA.z1, GA.x1, 4.6, GA.z0, gaM); COL(GA.x1 - 0.5, GY, GA.z1, GA.x1, GY + 4.6, GA.z0);
    // north face: two open bays + office strip
    sb(GA.x0, 0, GA.z0 - 0.5, 154, 4.6, GA.z0, gaM); COL(GA.x0, GY, GA.z0 - 0.5, 154, GY + 4.6, GA.z0);
    sb(160, 0, GA.z0 - 0.5, 164, 4.6, GA.z0, gaM); COL(160, GY, GA.z0 - 0.5, 164, GY + 4.6, GA.z0);
    sb(170, 0, GA.z0 - 0.5, GA.x1, 4.6, GA.z0, gaM); COL(170, GY, GA.z0 - 0.5, GA.x1, GY + 4.6, GA.z0);
    sb(154, 3.2, GA.z0 - 0.5, 160, 4.6, GA.z0, gaM); sb(164, 3.2, GA.z0 - 0.5, 170, 4.6, GA.z0, gaM);
    for (const x of [157, 167]) { const rd = B(B_, 5.6, 0.9, 0.12, M(0x7a8288, 0.5, 0.3), x, GY + 3.1, GA.z0 - 0.2); rd.rotation.x = 0.5; } // rolled-up doors
    sb(GA.x0 + 0.2, 4.6, GA.z1 + 0.2, GA.x1 - 0.2, 4.95, GA.z0 - 0.2, M(0x4a4f55, 0.8));
    const gaT = canvasTex(512, 80, (g) => { g.fillStyle = '#b32025'; g.fillRect(0, 0, 512, 80); g.fillStyle = '#fff'; g.font = 'bold 40px system-ui'; g.textAlign = 'center'; g.fillText('RIVER HWY AUTO & TIRE', 256, 54); });
    plane(B_, 14, 1.6, new THREE.MeshStandardMaterial({ map: gaT, emissive: 0xffffff, emissiveMap: gaT, emissiveIntensity: 0.25 }), 166, GY + 4.0, GA.z0 + 0.3);
    plane(B_, GA.x1 - GA.x0 - 1, -GA.z1 + GA.z0 - 1, M(0x6d7277, 0.9), 166, GY + 0.05, -206, -Math.PI / 2); EXT_FLOORS.push({ x0: GA.x0, z0: GA.z1, x1: GA.x1, z1: GA.z0, y: 0.05 });
    plane(B_, 10, 0.7, E(0xfff6e2, 1.3), 166, GY + 4.5, -206, Math.PI / 2);
    // lift with a car up on it
    const lift = G(B_, 157, GY + 0.05, -206);
    for (const s of [-1.3, 1.3]) { B(lift, 0.3, 2.0, 0.3, M(0xd94f20, 0.5), s, 0, -1.2); B(lift, 0.3, 2.0, 0.3, M(0xd94f20, 0.5), s, 0, 1.2); B(lift, 0.25, 0.12, 3.4, M(0x333a40, 0.5), s, 1.6, 0); }
    COL(155.4, GY, -207.6, 158.6, GY + 2, -204.4);
    const liftedCar = G(lift, 0, 1.75, 0); const lcM = M(0x5b6b73, 0.35, 0.5); B(liftedCar, 1.8, 0.55, 4.2, lcM, 0, 0.1, 0); B(liftedCar, 1.6, 0.5, 2.1, M(0x1c232b, 0.2, 0.4), 0, 0.62, -0.1);
    for (const wx of [-0.86, 0.86]) for (const wz of [-1.35, 1.35]) { const w = C(liftedCar, 0.32, 0.32, 0.2, M(0x111111, 0.8), wx, 0.05, wz, 10); w.rotation.z = Math.PI / 2; }
    // tires, tool wall, bench
    for (const [tx, tz, n] of [[176, -210, 4], [179, -209, 3], [173.5, -211.5, 5]]) { for (let i = 0; i < n; i++) { const t = T(B_, 0.42, 0.16, M(0x16181a, 0.9), tx, GY + 0.22 + i * 0.34, tz, TAU); t.rotation.x = Math.PI / 2; } COL(tx - 0.6, GY, tz - 0.6, tx + 0.6, GY + 1.6, tz + 0.6); }
    B(B_, 6, 1.0, 0.8, M(0x4a4038, 0.7), 166, GY + 0.05, -213.1); COL(163, GY, -213.6, 169, GY + 1.2, -212.6);
    for (let i = 0; i < 10; i++) B(B_, 0.18, 0.5 + (i % 3) * 0.14, 0.06, M([0xc0392b, 0x4a7fb5, 0xd9b44a][i % 3], 0.6), 163 + i * 0.6, GY + 2.2, -213.4);
    const ray = makePerson({ shirt: 0x3a6ea5, pants: 0x32383e, skin: 0xb97a4e, hair: 0x4a4a4a, apron: 0x2e3a46 });
    ray.g.position.set(159.5, GY + 0.05, -206.5); ray.g.rotation.y = -1.2; W.add(ray.g);
    ctx.tick(ray.g, (dt, t) => animPerson(ray, dt, t, 0));
    makeTalker(ctx, ray, { name: 'Ray', firstLine: 'Afternoon! Ray. That the Corolla from over at Avalon?', lines: ['Tires look decent. Rotate \'em in spring.', 'Bring her round back any time.', 'Sam up front makes terrible coffee. Don\'t tell him.'] });
    const svcHit = B(B_, 3.2, 2, 3.2, new THREE.MeshBasicMaterial({ visible: false }), 166.5, GY + 0.05, -206);
    ctx.interact(svcHit, { cook: true, reach: 4, label: () => 'Quick check-up for the Corolla 🔧 · $20', action: () => {
      const c = A.car && A.car.g.position; if (!c || Math.hypot(c.x - 166, c.z + 200) > 14) return ctx.msg('Ray: "Pull the Corolla around back first — park it by the bay."');
      if (!ctx.spend(20, 'check-up')) return;
      ctx.startAction({ label: 'Watching Ray work', dur: 6, done: () => { ray.say('All set. She\'s healthy!'); A.car.st.fuel = Math.max(A.car.st.fuel, 0.35); ctx.need('fun', 0.12); ctx.task('garage'); ctx.msg('🔧 Check-up done. The Corolla purrs now.'); } });
    } });
  }

  // Perth Rd + houses (background flavor)
  road(204, -240, 212, -126); dashZ(208, -236, -130);
  sign(215, -131, (g) => { g.fillStyle = '#1f5a30'; g.fillRect(0, 56, 160, 48); g.fillStyle = '#fff'; g.font = 'bold 28px system-ui'; g.textAlign = 'center'; g.fillText('Perth Rd', 80, 89); }, 1.1, 1.1);
  for (const [hx, hz, c] of [[224, -160, 0xd9cbb5], [226, -190, 0xb9c4c9], [222, -220, 0xd6b9a0]]) {
    const h = G(W, hx, GY, hz, -Math.PI / 2 + rand(-0.1, 0.1)); B(h, 9, 4, 8, M(c, 0.9), 0, 0, 0); const r = new THREE.Mesh(new THREE.ConeGeometry(6.5, 2.6, 4), M(0x5a4a3a, 0.9)); r.rotation.y = Math.PI / 4; r.scale.z = 0.9; r.position.y = 5.3; h.add(r);
    B(h, 1.1, 2.1, 0.15, M(0x4a3628, 0.7), 0, 0, 4.05); COL(hx - 5, GY, hz - 5, hx + 5, GY + 4, hz + 5);
  }

  // autumn trees (instanced, kept clear of roads and parcels)
  {
    const NO = [[-36, -33, 42, -2], [19, -128, 33, -28], [-48, -74, 24, -63], [-222, -143, 264, -124], [-120, -114, -42, -30], [144, -218, 202, -139], [202, -242, 214, -124], [216, -228, 234, -152], [-2, -70, 56, -42], [-36, -52, -12, -40]];
    const leafCols = [0xd9622b, 0xe8a23a, 0xb83a26, 0xe3c14b, 0x8f5a2a, 0x6f8a3e, 0xc94f1f, 0xf0b54a];
    const N = 420, sg = new THREE.IcosahedronGeometry(1, 1), im = new THREE.InstancedMesh(sg, M(0xffffff, 0.9), N);
    const tg = new THREE.CylinderGeometry(0.15, 0.25, 1, 6), tm = new THREE.InstancedMesh(tg, M(0x4a3628, 0.9), N);
    const d = new THREE.Object3D(), c = new THREE.Color(); let k = 0, guard = 0;
    while (k < N && guard++ < 6000) {
      const x = rand(-240, 280), z = rand(-260, 30);
      if (x > -40 && x < 44 && z > -34 && z < 18) continue; // our building + lot
      if (NO.some(r => x > r[0] - 3 && x < r[2] + 3 && z > r[1] - 3 && z < r[3] + 3)) continue;
      const s = rand(1.6, 3.2), h = rand(5, 10);
      d.position.set(x, GY + h, z); d.scale.set(s, s * 1.3, s); d.rotation.set(Math.random(), Math.random(), 0); d.updateMatrix(); im.setMatrixAt(k, d.matrix); im.setColorAt(k, c.set(leafCols[(Math.random() * leafCols.length) | 0]).offsetHSL(0, 0, rand(-0.05, 0.05)));
      d.position.set(x, GY + h / 2, z); d.scale.set(1, h, 1); d.rotation.set(0, 0, 0); d.updateMatrix(); tm.setMatrixAt(k, d.matrix); k++;
    }
    W.add(im); W.add(tm);
    // a line of maples along Caspian with real trunks you can't drive through
    for (let z = -44; z > -120; z -= 14) { for (const sx of [17.5, 35]) { C(W, 0.14, 0.2, 2.6, M(0x4a3628, 0.9), sx, GY, z, 7); const lv = S(W, 1.5, M(leafCols[(Math.random() * 8) | 0], 0.9), sx, GY + 3.4, z, 10, 8); lv.scale.y = 1.25; COL(sx - 0.25, GY, z - 0.25, sx + 0.25, GY + 2, z + 0.25); } }
  }

  // ================= your red Corolla =================
  const car = { st: { sp: 0, yaw: Math.PI, fuel: 0.55, radio: null, snd: null, lights: [] } };
  {
    const g = G(W, 12.5, GY, -7.2, Math.PI); markDyn(g); car.g = g;
    const red = M(0xc8102e, 0.25, 0.55), dark = M(0x1a1d21, 0.3, 0.4), glass = M(0x2a3640, 0.08, 0.6, { transparent: true, opacity: 0.85 });
    B(g, 1.76, 0.5, 4.54, red, 0, 0.26, 0); // body
    const hood = B(g, 1.7, 0.16, 1.1, red, 0, 0.72, -1.6); hood.rotation.x = 0.06;
    B(g, 1.7, 0.2, 1.25, red, 0, 0.68, 1.55); // trunk
    B(g, 1.58, 0.58, 2.2, glass, 0, 0.78, 0.08); // greenhouse
    B(g, 1.62, 0.06, 2.1, red, 0, 1.36, 0.08); // roof
    B(g, 1.74, 0.16, 0.2, dark, 0, 0.3, -2.22); B(g, 1.74, 0.16, 0.2, dark, 0, 0.3, 2.22); // bumpers
    const head = E(0xfff3c8, 0); for (const s of [-1, 1]) { plane(g, 0.34, 0.14, head, s * 0.56, 0.52, -2.273); car.st.lights.push(head); }
    const tail = E(0xff2a22, 0); for (const s of [-1, 1]) plane(g, 0.3, 0.12, tail, s * 0.6, 0.56, 2.273, 0, Math.PI); car.st.lights.push(tail);
    const plate = canvasTex(128, 64, (gc) => { gc.fillStyle = '#f4f6f8'; gc.fillRect(0, 0, 128, 64); gc.fillStyle = '#2a4b8a'; gc.font = 'bold 30px system-ui'; gc.textAlign = 'center'; gc.fillText('NOAH', 64, 42); gc.fillStyle = '#b32025'; gc.font = '12px system-ui'; gc.fillText('NORTH CAROLINA', 64, 14); });
    plane(g, 0.42, 0.21, M(0xffffff, 0.7, 0, { map: plate }), 0, 0.42, 2.274, 0, Math.PI);
    car.wheels = [];
    for (const wx of [-0.82, 0.82]) for (const wz of [-1.42, 1.42]) { const w = G(g, wx, 0.32, wz); const ty = C(w, 0.32, 0.32, 0.22, M(0x101214, 0.85), 0, 0, 0, 14); ty.rotation.z = Math.PI / 2; ty.position.y = 0; const hub = C(w, 0.14, 0.14, 0.24, M(0xc9ccd0, 0.3, 0.8), 0, 0, 0, 10); hub.rotation.z = Math.PI / 2; car.wheels.push(w); }
    // interior bits you see while driving
    B(g, 1.5, 0.08, 0.5, dark, 0, 0.85, -0.85); // dash
    const wheelO = G(g, -0.42, 0.92, -0.72); const sw = T(wheelO, 0.17, 0.025, dark, 0, 0, 0, TAU); sw.rotation.x = -1.1; car.steer = wheelO;
    B(g, 0.5, 0.5, 0.5, M(0x24282d, 0.8), -0.42, 0.5, -0.1); B(g, 0.5, 0.5, 0.5, M(0x24282d, 0.8), 0.42, 0.5, -0.1); // seats
    ctx.interact(g, { reach: 3.4, label: () => car.st.driving ? '' : 'Get in the Corolla 🚗', action: () => ctx.enterCar && ctx.enterCar() });
    A.car = car;
  }

  // ================= areas (names + first-visit tips) =================
  const AREAS = [
    { id: 'lot', n: 'Parking lot · Avalon', r: [-34, -31, 40, -0.4], tip: '🅿 Your red Corolla is parked by the stairs. Right-click the door to drive.' },
    { id: 'caspian', n: 'Caspian Pl', r: [16, -126, 36, -31], tip: '🛣 Caspian Pl — follow it north to River Hwy. Harris Teeter is off Town Center Dr.' },
    { id: 'towncenter', n: 'Town Center Dr', r: [-46, -74, 16, -63], tip: '🛒 Town Center Dr — the Harris Teeter plaza is just ahead on the right.' },
    { id: 'ht', n: 'Harris Teeter · Town Center Dr', r: [-120, -114, -42, -32], tip: '🛒 Harris Teeter: walk in through the sliding doors. Groceries $12, flowers $6, energy drink $3.' },
    { id: 'hwy', n: 'River Hwy · NC-150', r: [-222, -143, 264, -124], tip: '🛣 River Hwy (NC-150). The BP is down the road to the east, across the highway.' },
    { id: 'bp', n: 'BP · 1208 River Hwy', r: [144, -194, 202, -141], tip: '⛽ The BP. Park beside a pump and right-click it to fill the tank ($18). The shop has snacks.' },
    { id: 'garage', n: 'River Hwy Auto & Tire', r: [144, -218, 202, -194], tip: '🔧 Ray\'s garage. Park by the bays and he\'ll give the Corolla a check-up ($20).' },
    { id: 'perth', n: 'Perth Rd', r: [202, -242, 216, -126], tip: '🏡 Perth Rd — quiet street, nice houses.' },
  ];
  A.inTower = (x, z) => x > 7.6 && x < 9.95 && z > -0.2 && z < 5.6;
  A.areaAt = (x, z, y = GY) => {
    if (y > -2) return null;
    for (const a of AREAS) if (x > a.r[0] && x < a.r[2] && z > a.r[1] && z < a.r[3]) return a;
    return { id: 'outside', n: 'Mooresville, NC' };
  };
  return A;
}
