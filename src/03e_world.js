// ---------- the neighborhood: stairs, parking lot, Highway 150, Perth Rd → Harris Teeter, BP + garage ----------
// Layout mirrors the real one: Avalon Lake Norman off Caspian Pl, Harris Teeter in the plaza next door,
// Highway 150 runs along the front of the complex; Perth Rd splits off east up to the Harris Teeter;
// the BP (with the garage behind it) is at the west end of the road. The unit looks out the back, over the lot.
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
    COL(TW.ix0, GY, TW.z0 - 0.04, 8.2, top, TW.z0 + 0.1); COL(9.2, GY, TW.z0 - 0.04, TW.ix1, top, TW.z0 + 0.1); COL(8.2, GY + 2.2, TW.z0 - 0.04, 9.2, top, TW.z0 + 0.1); // above the exit door
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
      lines: ['How\'s the apartment treating you?', 'That Harris Teeter next door is dangerous. I\'m there daily.', 'If you hear my TV through the wall, just bang on it.', 'Panthers game on Sunday — you watching?', 'The BP down on 150 fixed my brakes. Good folks.', 'Lilah seems great, by the way. You two settling in?'],
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

  // ================= ground, parking lot, Highway 150, Perth Rd =================
  // (matches the real route: Hwy 150 along the front of the complex, Perth Rd splitting
  //  off east up to the Harris Teeter, the BP + garage at the west end of the road)
  const grass = M(0xffffff, 1, 0, { map: getTex('grass') });
  plane(W, 760, 760, grass, 20, GY - 0.01, -20, -Math.PI / 2);
  const asphTex = () => { const m = M(0xffffff, 0.95, 0, { map: getTex('asphalt').clone() }); m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; return m; };
  // every drivable surface in one list: drawn from it, mapped from it, and kept tree-free from it
  const RD = A.ROADS = [
    { r: [-34, -31, 40, -3.8], n: 'lot' },        // back parking lot (your side)
    { r: [-20, 18, 24, 28], n: 'frontlot' },      // front lot along the highway
    { r: [-4, 27.5, 4, 36], n: 'apron' },
    { r: [31, -10, 39, 36], n: 'caspian' },       // Caspian Pl: the complex drive, east side
    { r: [-200, 30, 224, 44], n: 'hwy' },         // Highway 150
    { r: [44, -92, 52, 36], n: 'perth' },         // Perth Rd north to the Harris Teeter
    { r: [30, -92, 102, -38], n: 'htlot' },       // Harris Teeter lot
    { r: [-134, 44, -80, 99], n: 'bp' },          // BP apron + forecourt
    { r: [-134, 99, -84, 121], n: 'bplot' },      // behind: the garage's lot
    { r: [64, 52, 96, 76], n: 'out1' }, { r: [110, 52, 142, 78], n: 'out2' }, // outparcels across the hwy
  ];
  const road = (x0, z0, x1, z1, y = 0.02) => { const m = asphTex(); m.map.repeat.set((x1 - x0) / 9, (z1 - z0) / 9); plane(W, x1 - x0, z1 - z0, m, (x0 + x1) / 2, GY + y, (z0 + z1) / 2, -Math.PI / 2); };
  for (const q of RD) road(q.r[0], q.r[1], q.r[2], q.r[3], q.n === 'hwy' ? 0.025 : 0.02);
  const paint = (x0, z0, x1, z1, col = 0xe8e6e0, y = 0.045) => plane(W, Math.abs(x1 - x0), Math.abs(z1 - z0), M(col, 0.7), (x0 + x1) / 2, GY + y, (z0 + z1) / 2, -Math.PI / 2);
  const dashZ = (x, z0, z1, col = 0xd9b44a) => { for (let z = z0; z < z1; z += 4) paint(x - 0.08, z, x + 0.08, Math.min(z + 1.8, z1), col); };
  const dashX = (z, x0, x1, col = 0xe8e6e0) => { for (let x = x0; x < x1; x += 5) paint(x, z - 0.09, Math.min(x + 2.2, x1), z + 0.09, col); };
  const walk = (x0, z0, x1, z1) => plane(W, x1 - x0, z1 - z0, conc, (x0 + x1) / 2, GY + 0.06, (z0 + z1) / 2, -Math.PI / 2);

  // back lot (unchanged spot): stripes, sidewalk by the stair door
  walk(-16, -3.8, 26, -0.4);
  for (let x = -32; x <= 36; x += 2.9) { if (x > 18 && x < 33) continue; paint(x - 0.07, -30.5, x + 0.07, -25.2); paint(x - 0.07, -9.2, x + 0.07, -3.9); }
  // front lot stripes
  for (let x = -18; x <= 22; x += 2.9) paint(x - 0.07, 18.4, x + 0.07, 23.4);
  // Highway 150 lane paint
  paint(-200, 36.6, 224, 36.9, 0xd9b44a); paint(-200, 37.1, 224, 37.4, 0xd9b44a);
  dashX(33.4, -198, 222); dashX(40.6, -198, 222);
  // Caspian + Perth center dashes
  dashZ(35, -8, 34); dashZ(48, -88, 34);
  // crosswalks at the two T junctions
  for (let z = 30.6; z < 43.5; z += 1.4) { paint(31.4, z, 38.6, z + 0.7); paint(44.4, z, 51.6, z + 0.7); }
  // sidewalks along the highway's north side and up Perth to the store
  walk(-140, 27.4, 30, 29.3); walk(52.2, -88, 54.2, 30); walk(40.5, -10, 43.5, 30);
  A.streetLamps = A.streetLamps || [];
  const lamp = (x, z) => { C(W, 0.09, 0.12, 7, M(0x2a2a2a, 0.6), x, GY, z, 8); const h = S(W, 0.28, E(0xffe0a0, 0), x, GY + 7, z, 10, 8); A.streetLamps.push(h.material); COL(x - 0.15, GY, z - 0.15, x + 0.15, GY + 2, z + 0.15); };
  for (const [x, z] of [[-20, -17], [2, -17], [24, -17], [-20, -32], [2, -32]]) lamp(x, z);          // back lot
  for (let x = -180; x <= 210; x += 36) lamp(x, 28.4);                                                // hwy north
  for (let x = -162; x <= 200; x += 36) if (x < -140 || x > -76) lamp(x, 45.6);                       // hwy south
  for (const z of [-20, -50, -80]) lamp(54.8, z);                                                     // Perth
  const carCols = [0x2e3a46, 0xf2f2f2, 0x1f1f22, 0x7a8a99, 0x4a7fb5, 0xc9ccd0, 0x6b4a35, 0x8a9aa0];
  function parkedCar(x, z, ry, col) {
    const c = G(W, x, GY, z, ry); const cm = M(col, 0.3, 0.6);
    B(c, 1.8, 0.55, 4.3, cm, 0, 0.25, 0); B(c, 1.6, 0.5, 2.2, M(0x1c232b, 0.1, 0.5), 0, 0.8, -0.1); B(c, 1.62, 0.06, 2.0, cm, 0, 1.3, -0.1);
    for (const wx of [-0.86, 0.86]) for (const wz of [-1.4, 1.4]) { const w = C(c, 0.33, 0.33, 0.2, M(0x111111, 0.8), wx, 0.33, wz, 10); w.rotation.z = Math.PI / 2; w.position.y = 0.33; }
    COL(x - 1.6, GY + 0.25, z - 1.6, x + 1.6, GY + 1.3, z + 1.6);
    return c;
  }
  for (let i = 0; i < 12; i++) { const x = -29 + i * 2.9 * 1.8 + rand(-0.2, 0.2); if (x > 8 && x < 17) continue; parkedCar(x, i % 2 ? -6.6 : -27.8, (i % 2 ? Math.PI : 0) + rand(-0.04, 0.04), carCols[(Math.random() * carCols.length) | 0]); }
  walk(58, -92, 104, -89.4); // storefront walk at the Harris Teeter doors
  for (let i = 0; i < 6; i++) { const x = -16 + i * 6.5; parkedCar(x, 20.8, Math.PI + rand(-0.04, 0.04), carCols[(Math.random() * carCols.length) | 0]); }
  // complex entrance sign (at the Caspian Pl junction)
  {
    const t = canvasTex(256, 128, (g) => { g.fillStyle = '#2e3a34'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#c8b273'; g.lineWidth = 5; g.strokeRect(7, 7, 242, 114); g.fillStyle = '#e8dcc0'; g.textAlign = 'center'; g.font = 'bold 30px Georgia'; g.fillText('Avalon', 128, 48); g.fillText('Lake Norman', 128, 82); g.font = '18px Georgia'; g.fillText('136 Caspian Pl', 128, 110); });
    const sg = G(W, 27.5, GY, 25, 0.4); B(sg, 0.25, 1.2, 1.1, M(0x8a8178, 0.9), 0, 0, 0); plane(sg, 2.2, 1.1, M(0xffffff, 0.8, 0, { map: t }), 0, 1.6, 0.0); B(sg, 2.4, 1.3, 0.18, M(0x2e3a34, 0.8), 0, 1.0, -0.12);
    COL(26.5, GY, 24, 28.5, GY + 2, 26);
  }
  // more complex buildings (kept off every road)
  const facT = getTex('facade');
  function bgBuilding(x, z, w, d, h, ry = 0) {
    const b = G(W, x, GY, z, ry); const t = facT.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 12, h / 10);
    B(b, w, h, d, M(0xffffff, 0.85, 0, { map: t }), 0, 0, 0);
    const r = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, 2.6, 4), M(0x4a4f55, 0.8)); r.rotation.y = Math.PI / 4; r.scale.z = d / w; r.position.y = h + 1.3; b.add(r);
    COL(x - w / 2 - 1, GY, z - d / 2 - 1, x + w / 2 + 1, GY + h, z + d / 2 + 1);
  }
  bgBuilding(-48, 7, 18, 12, 9, 0); bgBuilding(-44, -22, 16, 12, 9, 0.15); bgBuilding(-10, -48, 22, 13, 9, -0.05);
  // outparcels across the highway (image's bottom-right buildings)
  for (const [bx, bz, w, d, c] of [[80, 66, 16, 10, 0xd9cbb5], [126, 64, 14, 9, 0xc9ccd0]]) {
    const b = G(W, bx, GY, bz + 8, 0); B(b, w, 4.5, d, M(c, 0.9), 0, 0, 0); B(b, w * 0.8, 1.1, 0.3, M(0x4a4f55, 0.8), 0, 4.5, d / 2 - 0.1); COL(bx - w / 2, GY, bz + 8 - d / 2, bx + w / 2, GY + 4.5, bz + 8 + d / 2);
  }
  // signs
  function sign(x, z, draw, w = 1.0, h = 1.0, ry = 0, poleH = 2.6) {
    const t = canvasTex(160, 160, draw); const sg = G(W, x, GY, z, ry);
    C(sg, 0.04, 0.05, poleH, steel, 0, 0, 0, 8); plane(sg, w, h, M(0xffffff, 0.7, 0, { map: t }), 0, poleH - h / 2 + 0.2, 0.03);
    COL(x - 0.12, GY, z - 0.12, x + 0.12, GY + 1.8, z + 0.12); return sg;
  }
  const stopDraw = (g) => { g.fillStyle = '#b32025'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + TAU / 16; g.lineTo(80 + 70 * Math.cos(a), 80 + 70 * Math.sin(a)); } g.closePath(); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 42px system-ui'; g.textAlign = 'center'; g.fillText('STOP', 80, 95); };
  sign(41.5, 28.6, stopDraw, 0.8, 0.8); sign(53.4, 28.6, stopDraw, 0.8, 0.8); sign(5.4, 28.6, stopDraw, 0.8, 0.8);
  sign(42.5, 25, (g) => { g.fillStyle = '#1f5a30'; g.fillRect(0, 40, 160, 44); g.fillStyle = '#fff'; g.font = 'bold 24px system-ui'; g.textAlign = 'center'; g.fillText('Caspian Pl', 80, 70); g.fillStyle = '#1f5a30'; g.fillRect(0, 88, 160, 44); g.fillStyle = '#fff'; g.fillText('Highway 150', 80, 118); }, 1.1, 1.1, 0, 3.0);
  sign(55.5, 24, (g) => { g.fillStyle = '#1f5a30'; g.fillRect(0, 40, 160, 44); g.fillStyle = '#fff'; g.font = 'bold 26px system-ui'; g.textAlign = 'center'; g.fillText('Perth Rd', 80, 70); g.fillStyle = '#1f5a30'; g.fillRect(0, 88, 160, 44); g.fillStyle = '#fff'; g.fillText('Highway 150', 80, 118); }, 1.1, 1.1, 0, 3.0);
  sign(-60, 28.6, (g) => { g.fillStyle = '#fff'; g.fillRect(20, 20, 120, 130); g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(24, 24, 112, 122); g.fillStyle = '#111'; g.textAlign = 'center'; g.font = '20px system-ui'; g.fillText('SPEED', 80, 52); g.fillText('LIMIT', 80, 74); g.font = 'bold 52px system-ui'; g.fillText('45', 80, 126); }, 0.85, 0.9);
  sign(-72, 45.6, (g) => { g.fillStyle = '#1f5a30'; g.fillRect(0, 30, 160, 100); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 22px system-ui'; g.fillText('NC-150', 80, 68); g.font = '19px system-ui'; g.fillText('← bp · gas', 80, 104); }, 1.2, 1.2, Math.PI);
  sign(56, -34, (g) => { g.fillStyle = '#1f4432'; g.fillRect(0, 30, 160, 100); g.fillStyle = '#f6efe0'; g.textAlign = 'center'; g.font = 'bold 20px Georgia'; g.fillText('Harris Teeter', 80, 72); g.font = '18px system-ui'; g.fillText('↑ just ahead', 80, 102); }, 1.25, 1.25);
  // street trees with trunks you can't drive through, set WELL back from every curb
  { const leafColsT = [0xd9622b, 0xe8a23a, 0xb83a26, 0xe3c14b]; for (let x = -170; x <= 215; x += 26) { for (const sz of [25.2, 47.6]) { if (sz > 40 && x > -140 && x < -74) continue; if (sz > 40 && x > 60 && x < 146) continue; if (x > 27 && x < 57) continue; C(W, 0.14, 0.2, 2.6, M(0x4a3628, 0.9), x, GY, sz, 7); const lv = S(W, 1.5, M(leafColsT[(Math.random() * 4) | 0], 0.9), x, GY + 3.4, sz, 10, 8); lv.scale.y = 1.25; COL(x - 0.25, GY, sz - 0.25, x + 0.25, GY + 2, sz + 0.25); } } }

  // ================= Harris Teeter plaza (next door) =================
  const HT = { x0: -118, x1: -72, z0: -34, z1: -58 };
  {
    const cxH = -14, czH = -150; const S_ = G(W, cxH, 0, czH, Math.PI);
    const colHT = (x0, y0, z0, x1, y1, z1) => COL(cxH - x1, y0, czH - z1, cxH - x0, y1, czH - z0);
    EXT_FLOORS.push({ x0: 54, z0: -116, x1: 104, z1: -92, y: 0.08 });
    const brickTex = canvasTex(512, 512, (g) => {
      g.fillStyle = '#b7a894'; g.fillRect(0, 0, 512, 512); // mortar
      const cols = ['#8a4a38', '#7c4234', '#95543e', '#6e3c30', '#8f4e3a', '#a05c42', '#5c352b', '#884b36'];
      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      for (let r = 0; r < 32; r++) for (let c = -1; c < 13; c++) {
        const off = r % 2 ? 22 : 0, x = c * 44 + off, y = r * 16;
        const base = cols[(rnd() * cols.length) | 0];
        g.fillStyle = base; g.fillRect(x + 2, y + 2, 40, 12);
        g.fillStyle = 'rgba(255,255,255,' + (rnd() * 0.07).toFixed(3) + ')'; g.fillRect(x + 2, y + 2, 40, 5); // top catch-light
        g.fillStyle = 'rgba(30,14,8,' + (0.18 + rnd() * 0.14).toFixed(3) + ')'; g.fillRect(x + 2, y + 11, 40, 3); // shadow into the mortar joint
        if (rnd() < 0.08) { g.fillStyle = 'rgba(40,22,14,.5)'; g.fillRect(x + 2, y + 2, 40, 12); } // the odd dark clinker
      }
    });
    const brick = (w, h) => { const t = brickTex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 2.3, h / 2.3); return M(0xffffff, 0.9, 0, { map: t }); };
    const wallM = brick(24, 7), band = M(0x1f4432, 0.7), cream = M(0xe8e0cc, 0.85), hgreen = M(0x1f4432, 0.6);
    const bx = (x0, y0, z0, x1, y1, z1, m = wallM) => B(S_, x1 - x0, y1 - y0, z1 - z0, m, (x0 + x1) / 2, GY + y0, (z0 + z1) / 2);
    // shell (entrance on the south face, toward its lot)
    bx(HT.x0, 0, HT.z0 - 0.4, HT.x1 + 4, 7, HT.z0, brick(50, 7)); colHT(HT.x0, GY, HT.z0 - 0.4, HT.x1 + 4, GY + 7, HT.z0);
    bx(HT.x0 - 0.4, 0, HT.z0, HT.x0, 7, HT.z1, brick(24, 7)); colHT(HT.x0 - 0.4, GY, HT.z0, HT.x0, GY + 7, HT.z1);
    bx(HT.x1 + 4, 0, HT.z0, HT.x1 + 4.4, 7, HT.z1, brick(24, 7)); colHT(HT.x1 + 4, GY, HT.z0, HT.x1 + 4.4, GY + 7, HT.z1);
    // ---- storefront: projecting brick pavilion, cream pilaster towers, deep arched bay ----
    const glassM = new THREE.MeshStandardMaterial({ color: 0x9fc4d8, roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.45 });
    const F = HT.z1, FP = F - 1.2; // wing face and the projected pavilion face
    // wings (brick) with piers between recessed window bays, cream sills/headers, cornice
    bx(HT.x0, 0, F - 0.4, -106.7, 6.4, F, brick(12, 6.4)); colHT(HT.x0, GY, F - 0.4, -106.7, GY + 7, F);
    bx(-83.3, 0, F - 0.4, HT.x1 + 4, 6.4, F, brick(16, 6.4)); colHT(-83.3, GY, F - 0.4, HT.x1 + 4, GY + 7, F);
    for (const px of [-114.9, -111.7, -108.5, -84.9, -78.6, -72.3]) bx(px - 0.5, 0.0, F - 0.5, px + 0.5, 6.4, F + 0.02, brick(1, 6.4)); // piers proud of the bays
    bx(HT.x0, 6.4, F - 0.55, -106.7, 6.9, F + 0.1, cream); bx(-83.3, 6.4, F - 0.55, HT.x1 + 4, 6.9, F + 0.1, cream);
    bx(HT.x0, 6.9, F - 0.45, -106.7, 7.06, F + 0.14, M(0xf6f2e6, 0.8)); bx(-83.3, 6.9, F - 0.45, HT.x1 + 4, 7.06, F + 0.14, M(0xf6f2e6, 0.8));
    // window bays: cream header + sill around each
    for (const wx of [-116.6, -110.1, -81.2, -75.4, -69.6]) { bx(wx - 2.7, 3.55, F - 0.46, wx + 2.7, 3.95, F + 0.04, cream); bx(wx - 2.7, 0.55, F - 0.46, wx + 2.7, 0.85, F + 0.04, cream); }
    // corner towers at the wing ends (cream, layered caps)
    for (const tx of [HT.x0 + 0.9, HT.x1 + 3.1]) {
      bx(tx - 1.1, 0, F - 0.8, tx + 1.1, 7.3, F + 0.25, cream); colHT(tx - 1.1, GY, F - 0.8, tx + 1.1, GY + 7.3, F + 0.25);
      bx(tx - 1.3, 7.3, F - 0.95, tx + 1.3, 7.62, F + 0.4, M(0xf6f2e6, 0.8)); bx(tx - 1.15, 7.62, F - 0.85, tx + 1.15, 7.86, F + 0.3, cream);
    }
    // ---- the pavilion: projects 1.2 m, full-height brick, pediment on top ----
    bx(-105, 0, FP, -97.2, 7.9, F, brick(8, 7.9)); colHT(-105, GY, FP, -97.2, GY + 7.9, F);
    bx(-92.8, 0, FP, -85, 7.9, F, brick(8, 7.9)); colHT(-92.8, GY, FP, -92.8 + 7.8, GY + 7.9, F);
    bx(-97.2, 3.05, FP, -92.8, 7.9, FP + 0.5, brick(4.4, 4.9)); // lintel over the door tunnel
    for (const sd of [[-97.2, -96.9], [-93.1, -92.8]]) bx(sd[0], 0, FP, sd[1], 3.05, F, cream); // door reveal cheeks
    // big cream pilaster towers flanking the pavilion, quoin blocks up the sides
    for (const tx of [-105.9, -84.1]) {
      bx(tx - 1.35, 0, FP - 0.35, tx + 1.35, 8.6, FP + 1.0, cream); colHT(tx - 1.35, GY, FP - 0.35, tx + 1.35, GY + 8.6, F);
      bx(tx - 1.6, 8.6, FP - 0.5, tx + 1.6, 8.95, FP + 1.15, M(0xf6f2e6, 0.8));
      bx(tx - 1.4, 8.95, FP - 0.38, tx + 1.4, 9.22, FP + 1.0, cream);
      bx(tx - 1.05, 9.22, FP - 0.2, tx + 1.05, 9.42, FP + 0.8, M(0xf6f2e6, 0.8));
      for (let q = 0; q < 5; q++) bx(tx - 1.47, 0.7 + q * 1.55, FP - 0.42, tx + 1.47, 1.25 + q * 1.55, FP + 1.05, M(0xefe9d8, 0.85)); // quoin bands
    }
    // pediment: brick triangle on the pavilion face, cream raking cornice with returns, green coping
    {
      const tw = 20.4, th = 3.6, shp = new THREE.Shape(); shp.moveTo(-tw / 2, 0); shp.lineTo(tw / 2, 0); shp.lineTo(0, th); shp.closePath();
      const tg = new THREE.ExtrudeGeometry(shp, { depth: 1.1, bevelEnabled: false });
      const tm = new THREE.Mesh(tg, brick(tw, th)); tm.position.set(-95, GY + 7.9, FP); S_.add(tm);
      bx(-105.6, 7.72, FP - 0.2, -84.4, 8.08, FP + 1.2, cream); // base cornice
      for (const sd of [-1, 1]) bx(-95 + sd * 9.9 - 1.0, 7.72, FP - 0.3, -95 + sd * 9.9 + 1.0, 8.28, FP + 1.3, M(0xf6f2e6, 0.8)); // cornice returns
      const slope = Math.atan2(th, tw / 2), L = Math.hypot(tw / 2, th);
      for (const sd of [-1, 1]) {
        const cr = B(S_, L * 0.98, 0.34, 1.25, M(0xf6f2e6, 0.82), -95 + sd * tw / 4, GY + 7.78 + th / 2 - 0.05, FP + 0.55); cr.rotation.z = -sd * slope; // raking fascia
        const tr = B(S_, L * 1.02, 0.26, 1.45, hgreen, -95 + sd * tw / 4, GY + 8.08 + th / 2, FP + 0.55); tr.rotation.z = -sd * slope; // green coping
      }
    }
    // deep arched window bay, recessed into the pavilion
    {
      const AR = 1.9, cy = 4.5; // spring line
      const ring = new THREE.Shape(); ring.absarc(0, 0, AR + 0.42, 0, Math.PI, false); ring.absarc(0, 0, AR, Math.PI, 0, true);
      const rg = new THREE.ExtrudeGeometry(ring, { depth: 0.34, bevelEnabled: false });
      const rm = new THREE.Mesh(rg, cream); rm.position.set(-95, GY + cy, FP - 0.05); S_.add(rm); // cream arch surround
      for (const sd of [-1, 1]) bx(-95 + sd * AR + (sd < 0 ? -0.42 : 0), 3.3, FP - 0.05, -95 + sd * AR + (sd < 0 ? 0 : 0.42), cy, FP + 0.3, cream); // surround legs
      bx(-95 - 0.35, GY + cy + AR + 0.34 - GY, FP - 0.12, -95 + 0.35, cy + AR + 0.78, FP + 0.3, M(0xf6f2e6, 0.8)); // keystone
      // glazing fills the arch, flush in the surround
      const archT2 = canvasTex(512, 512, (g) => {
        g.fillStyle = '#1f3a2e'; g.fillRect(0, 0, 512, 512);
        const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#60808f'); gr.addColorStop(1, '#2a3844');
        g.fillStyle = gr; g.fillRect(14, 14, 484, 484);
        g.strokeStyle = '#1f3a2e'; g.lineWidth = 15;
        for (let x = 102; x < 512; x += 102) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
        for (let y = 102; y < 512; y += 102) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(90, 512); g.lineTo(290, 0); g.lineTo(390, 0); g.lineTo(190, 512); g.closePath(); g.fill();
      });
      const glz = new THREE.Mesh(new THREE.CircleGeometry(AR - 0.02, 28, 0, Math.PI), M(0xffffff, 0.5, 0, { map: archT2 }));
      glz.position.set(-95, GY + cy, FP - 0.08); glz.rotation.y = Math.PI; S_.add(glz);
      const t2 = archT2.clone(); t2.needsUpdate = true;
      plane(S_, (AR - 0.02) * 2, cy - 3.3, M(0xffffff, 0.5, 0, { map: t2 }), -95, GY + (cy + 3.3) / 2, FP - 0.08, 0, Math.PI);
    }
    // the sign, high on the pediment: logo near the apex, letters across, oval below the cornice
    const htT = canvasTex(1024, 560, (g) => {
      g.clearRect(0, 0, 1024, 560);
      g.save(); g.translate(512, 96); g.rotate(-0.25); g.strokeStyle = '#e8892b'; g.lineWidth = 13; g.beginPath(); g.ellipse(0, 0, 138, 52, 0, 0, TAU); g.stroke(); g.restore();
      g.fillStyle = '#c0262d'; g.beginPath(); g.arc(476, 76, 42, 0, TAU); g.fill(); g.fillStyle = '#2f7a3a'; g.beginPath(); g.ellipse(489, 32, 18, 8, 0.6, 0, TAU); g.fill();
      g.fillStyle = '#2a6fdb'; g.beginPath(); g.ellipse(568, 100, 47, 23, -0.18, 0, TAU); g.fill(); g.beginPath(); g.moveTo(608, 93); g.lineTo(638, 76); g.lineTo(634, 118); g.closePath(); g.fill();
      g.fillStyle = '#f6f3ea'; g.beginPath(); g.arc(560, 93, 5, 0, TAU); g.fill();
      g.font = '700 112px Georgia, serif'; g.textAlign = 'center'; g.lineWidth = 9; g.strokeStyle = 'rgba(40,30,20,.45)';
      g.strokeText('HarrisTeeter', 512, 285); g.fillStyle = '#f6f3ea'; g.fillText('HarrisTeeter', 512, 285);
      g.fillStyle = '#1f4432'; g.beginPath(); g.roundRect(226, 340, 572, 82, 41); g.fill(); g.strokeStyle = '#e8e0cc'; g.lineWidth = 5; g.beginPath(); g.roundRect(232, 346, 560, 70, 35); g.stroke();
      g.fillStyle = '#f2ecd9'; g.font = 'italic 700 44px Georgia, serif'; g.fillText('Neighborhood Food & Pharmacy', 512, 395);
    });
    const htSign = new THREE.MeshStandardMaterial({ map: htT, transparent: true, depthWrite: false, emissive: 0xffffff, emissiveMap: htT, emissiveIntensity: 0.22, roughness: 0.6 });
    plane(S_, 12.6, 6.9, htSign, -95, GY + 8.55, FP - 1.25, 0, Math.PI); A.glowMats.push(htSign);
    // wing windows with dark-green frames (recessed between the piers)
    const winT = canvasTex(512, 256, (g) => {
      g.fillStyle = '#1f4432'; g.fillRect(0, 0, 512, 256);
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#5a7584'); gr.addColorStop(1, '#2c3a44');
      for (let c = 0; c < 4; c++) for (let r = 0; r < 2; r++) { g.fillStyle = gr; g.fillRect(14 + c * 124, 14 + r * 120, 108, 106); }
      g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(60, 256); g.lineTo(170, 0); g.lineTo(240, 0); g.lineTo(130, 256); g.closePath(); g.fill();
    });
    for (const wx of [-116.6, -110.1, -81.2, -75.4, -69.6]) { const t = winT.clone(); t.needsUpdate = true; plane(S_, 5.0, 2.7, M(0xffffff, 0.55, 0, { map: t }), wx, GY + 2.2, F - 0.42, 0, Math.PI); }
    // Pharmacy letters on the right wing (as you face the store)
    const phT = canvasTex(512, 128, (g) => { g.clearRect(0, 0, 512, 128); g.font = '700 86px Georgia, serif'; g.textAlign = 'center'; g.strokeStyle = 'rgba(40,30,20,.4)'; g.lineWidth = 7; g.strokeText('Pharmacy', 256, 92); g.fillStyle = '#f6f3ea'; g.fillText('Pharmacy', 256, 92); });
    const phM = new THREE.MeshStandardMaterial({ map: phT, transparent: true, depthWrite: false, emissive: 0xffffff, emissiveMap: phT, emissiveIntensity: 0.2, roughness: 0.6 });
    plane(S_, 6.2, 1.55, phM, -112.8, GY + 5.3, F - 0.52, 0, Math.PI); A.glowMats.push(phM);
    // black lantern sconces on the piers
    for (const sxp of [-114.9, -111.7, -108.5, -84.9, -78.6, -72.3]) {
      const sc = G(S_, sxp, GY + 4.35, F - 0.55, Math.PI); B(sc, 0.08, 0.08, 0.5, M(0x15181a, 0.6), 0, 0.3, 0.25);
      const sh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.26, 8), M(0x15181a, 0.6)); sh.position.set(0, 0.26, 0.48); sc.add(sh);
      const bulb = S(sc, 0.07, E(0xffd9a0, 0), 0, 0.14, 0.48, 8, 6); A.streetLamps.push(bulb.material);
    }
    // bushes + the yellow curb line along the storefront
    const bushG = M(0x3f6b35, 0.95), bushR = M(0x8a3a2a, 0.9);
    for (let bxp = -117; bxp <= -69; bxp += 2.4) { if (bxp > -98.6 && bxp < -91.4) continue; const r = 0.4 + ((bxp * 7) % 3) * 0.06; const bsh = S(S_, r, (bxp * 13 | 0) % 4 ? bushG : bushR, bxp + ((bxp * 11) % 2) * 0.3, GY + 0.3, F - 1.5, 8, 6); bsh.scale.y = 0.72; noRay(bsh); }
    plane(S_, 50, 0.18, M(0xd9c33a, 0.6), -93, GY + 0.085, F - 3.6, -Math.PI / 2);
    bx(HT.x0, 7, HT.z0 - 0.4, HT.x1 + 4.4, 7.4, F - 0.2); // roof

    // sliding doors
    const dL = B(S_, 2.2, 3.0, 0.08, glassM, -96.1, GY + 0.08, HT.z1 - 0.16), dR = B(S_, 2.2, 3.0, 0.08, glassM, -93.9, GY + 0.08, HT.z1 - 0.16);
    markDyn(dL, dR); const doorB = new THREE.Box3(V3(78.7, GY, -92.05), V3(83.3, GY + 3, -91.6));
    ctx.addCollider(doorB, null);
    ctx.tick(S_, (dt) => {
      const p = ctx.playerPos(); const near = p.y < -2 && Math.abs(p.z + 92) < 3.5 && p.x > 77 && p.x < 85;
      const o = lerp(dL.userData.o || 0, near ? 1 : 0, Math.min(1, dt * 4)); dL.userData.o = o;
      if (Math.abs(o - (dL.userData.lo || 0)) > 0.002) { dL.userData.lo = o; dL.position.x = -96.1 - o * 2.1; dR.position.x = -93.9 + o * 2.1; if (o > 0.6) doorB.makeEmpty(); else doorB.set(V3(78.7, GY, -92.05), V3(83.3, GY + 3, -91.6)); }
    });
    // sign band + letters
    // interior: bright ceiling, tile floor, aisles, produce, dairy glow, registers
    const tile = M(0xffffff, 0.55, 0, { map: floorTex('tile') }); plane(S_, HT.x1 + 4 - HT.x0 - 0.8, HT.z0 - HT.z1 - 0.8, tile, (HT.x0 + HT.x1 + 4) / 2, GY + 0.08, (HT.z0 + HT.z1) / 2, -Math.PI / 2);
    plane(S_, HT.x1 + 4 - HT.x0 - 0.8, HT.z0 - HT.z1 - 0.8, M(0xf4f2ec, 0.95), (HT.x0 + HT.x1 + 4) / 2, GY + 6.9, (HT.z0 + HT.z1) / 2, Math.PI / 2);
    for (let i = 0; i < 4; i++) plane(S_, 30, 0.8, E(0xfff6e2, 1.5), -93, GY + 6.85, -38.5 - i * 5, Math.PI / 2);
    const shelfM = M(0x8a9aa0, 0.6), goodCols = [0xc0392b, 0xd9b44a, 0x4a7fb5, 0x7c8f6a, 0xe07a3f, 0xb8a7d6, 0xf2f2f2];
    function aisle(xc, z0, z1) {
      B(S_, 1.4, 1.9, z1 - z0, shelfM, xc, GY + 0.08, (z0 + z1) / 2); colHT(xc - 0.7, GY, z0, xc + 0.7, GY + 2, z1);
      for (let z = z0 + 0.6; z < z1 - 0.4; z += 0.62) for (let lv = 0; lv < 3; lv++) for (const s of [-1, 1])
        B(S_, 0.12, 0.26, 0.42, M(goodCols[(Math.random() * goodCols.length) | 0], 0.7), xc + s * 0.78, GY + 0.35 + lv * 0.55, z);
    }
    aisle(-104, -52, -38); aisle(-98, -52, -38); aisle(-92, -52, -38); aisle(-86, -52, -38);
    // produce bins
    for (const [x, z] of [[-112, -44], [-112, -48], [-112, -52]]) { B(S_, 2.6, 0.9, 2.2, M(0x3a5a40, 0.8), x, GY + 0.08, z); for (let i = 0; i < 12; i++) S(S_, 0.11, M([0xc0262d, 0xe8892b, 0x8fb339, 0xf2d24b][i % 4], 0.55), x + rand(-1, 1), GY + 1.05, z + rand(-0.8, 0.8), 8, 6); colHT(x - 1.3, GY, z - 1.1, x + 1.3, GY + 1, z + 1.1); }
    // dairy wall (back)
    const dairy = E(0xdff0ff, 0.9); B(S_, 36, 2.4, 0.7, M(0xe8ecef, 0.5), -92, GY + 0.08, HT.z0 + 0.8); plane(S_, 35, 1.8, dairy, -92, GY + 0.6, HT.z0 + 1.16, 0, Math.PI); colHT(-110, GY, HT.z0, -74, GY + 2.5, HT.z0 + 1.2);
    // flower stand & cooler near the front
    const flw = G(S_, -108.5, GY + 0.08, -55.5); B(flw, 1.6, 0.8, 1.2, M(0x6b4a35, 0.7), 0, 0, 0); for (let i = 0; i < 8; i++) { C(flw, 0.05, 0.06, 0.3, M(0x2a6b4f, 0.8), -0.6 + (i % 4) * 0.4, 0.8, i < 4 ? -0.3 : 0.3, 6); S(flw, 0.11, M([0xd94f70, 0xf2d24b, 0xe3b8b8, 0xb8a7d6][i % 4], 0.6), -0.6 + (i % 4) * 0.4, 1.2, i < 4 ? -0.3 : 0.3, 8, 6); }
    colHT(-109.3, GY, -56.1, -107.7, GY + 1, -54.9);
    const cool = G(S_, -80, GY + 0.08, -55.5); B(cool, 2.0, 2.0, 1.0, M(0xb32025, 0.5), 0, 0, 0); plane(cool, 1.7, 1.4, E(0xcfe8ff, 0.8), 0, 0.3, 0.51); colHT(-81, GY, -56, -79, GY + 2, -55);
    // registers + Dana
    for (const x of [-96.5, -91.5]) { B(S_, 0.9, 1.0, 3.2, M(0x3f4a52, 0.7), x, GY + 0.08, -54.2); B(S_, 0.9, 0.08, 1.0, M(0x222, 0.5), x, GY + 1.08, -53.2); colHT(x - 0.45, GY, -55.8, x + 0.45, GY + 1.1, -52.6); }
    const dana = makePerson({ shirt: 0x1f4432, pants: 0x2e3a46, skin: 0xe8c39a, hair: 0x6b3a1a, apron: 0x16352a });
    dana.g.position.set(77.5, GY + 0.08, -97.1); dana.g.rotation.y = 0; W.add(dana.g);
    ctx.tick(dana.g, (dt, t) => animPerson(dana, dt, t, 0));
    makeTalker(ctx, dana, { name: 'Dana', firstLine: 'Welcome to Harris Teeter! Holler if you need anything.', lines: ['The gala apples came in this morning.', 'VIC card? I\'ll scan mine for you.', 'Cold out there today, huh?'] });
    // buying
    const buy = (obj, label, cost, after) => ctx.interact(obj, { cook: true, reach: 3, label: () => label + ' · $' + cost, action: () => { if (!ctx.spend(cost, label)) return; Sfx.chime(); after(); } });
    buy(flw, 'Fall bouquet for Lilah 💐', 6, () => { ctx.give('flowers', {}, { rise: true }); ctx.msg('She\'s going to love these. Left-click to snap her a photo. 💐'); });
    for (const xc of [-104, -98, -92, -86]) { const h = B(S_, 1.6, 2, 14, new THREE.MeshBasicMaterial({ visible: false }), xc, GY + 0.08, -45); ctx.interact(h, { cook: true, reach: 3, label: () => 'Grab a bag of groceries 🛒 · $12', action: () => { if (!ctx.spend(12, 'groceries')) return; Sfx.pop(); ctx.give('groceries', {}, { rise: true }); ctx.msg('Got the essentials. Pay at the register, then put them away at home.'); } }); }
    buy(cool, 'Energy drink ⚡', 3, () => { ctx.need('energy', 0.25); ctx.drink('coffee'); ctx.msg('Wings: acquired. ⚡'); });
    // cart corral
    const corral = G(W, 72, GY, -58); B(corral, 0.06, 1.0, 5, steel, -1, 0, 0); B(corral, 0.06, 1.0, 5, steel, 1, 0, 0); COL(70.8, GY, -60.6, 73.2, GY + 1.1, -55.4);
    for (let i = 0; i < 3; i++) { const c = G(corral, 0, 0.15, -1.6 + i * 0.8); B(c, 0.8, 0.5, 0.9, steel, 0, 0.35, 0); for (const [wx, wz] of [[-0.3, -0.35], [0.3, -0.35], [-0.3, 0.35], [0.3, 0.35]]) S(c, 0.07, M(0x222222, 0.6), wx, 0.07, wz, 6, 4); }
    parkedCar(62, -62.5, 0.03, 0xf2f2f2); parkedCar(80, -62.3, -0.02, 0x2e3a46);
  }

  // ================= the BP + the garage behind it (west end of Highway 150) =================
  {
    const cxB = 66, czB = -97; const B_ = G(W, cxB, 0, czB, Math.PI);
    const colBP = (x0, y0, z0, x1, y1, z1) => COL(cxB - x1, y0, czB - z1, cxB - x0, y1, czB - z0);
    // canopy
    const canM = M(0xf2f2f0, 0.7), greenM = M(0x1e7a46, 0.6);
    B(B_, 34, 0.7, 20, canM, 167, GY + 5.0, -161); B(B_, 34.2, 0.5, 20.2, greenM, 167, GY + 4.6, -161);
    const bpT = canvasTex(128, 128, (g) => { g.fillStyle = '#1e7a46'; g.fillRect(0, 0, 128, 128); for (let r = 54, i = 0; r > 10; r -= 11, i++) { g.fillStyle = ['#ffe600', '#ffffff', '#ffe600', '#1e7a46'][i % 4]; g.beginPath(); for (let k = 0; k < 20; k++) { const a = k / 20 * TAU, rr = k % 2 ? r * 0.62 : r; g.lineTo(64 + rr * Math.cos(a), 56 + rr * Math.sin(a)); } g.closePath(); g.fill(); } g.fillStyle = '#fff'; g.font = 'bold italic 30px system-ui'; g.textAlign = 'center'; g.fillText('bp', 64, 120); });
    for (const ry of [0, Math.PI]) plane(B_, 4, 4, new THREE.MeshStandardMaterial({ map: bpT, emissive: 0xffffff, emissiveMap: bpT, emissiveIntensity: 0.25, roughness: 0.6 }), 167, GY + 4.65, -161 + (ry ? 10.2 : -10.2), 0, ry);
    for (const [cx, cz] of [[154, -155], [180, -155], [154, -167], [180, -167]]) { C(B_, 0.22, 0.26, 5, canM, cx, GY, cz, 10); colBP(cx - 0.3, GY, cz - 0.3, cx + 0.3, GY + 2, cz + 0.3); }
    // pump islands + dispensers
    A.pumps = [];
    for (const ix of [160, 174]) {
      B(B_, 3.2, 0.18, 10, curb, ix, GY, -161); EXT_FLOORS.push({ x0: cxB - ix - 1.6, z0: 59, x1: cxB - ix + 1.6, z1: 69, y: 0.18 });
      for (const pz of [-158.2, -163.8]) {
        const p = G(B_, ix, GY + 0.18, pz); B(p, 1.0, 1.9, 0.62, M(0xe8e8e6, 0.5), 0, 0, 0); B(p, 1.04, 0.5, 0.66, greenM, 0, 1.1, 0);
        plane(p, 0.5, 0.3, E(0x1a2a1a, 0.6), 0, 1.25, 0.34); for (const s of [-1, 1]) B(p, 0.1, 0.5, 0.08, M(0x222222, 0.6), s * 0.38, 0.5, s * 0.28);
        colBP(ix - 0.55, GY, pz - 0.35, ix + 0.55, GY + 2, pz + 0.35);
        A.pumps.push(V3(cxB - ix, GY, czB - pz));
        ctx.interact(p, { cook: true, reach: 4.8, label: () => { const c = A.car && A.car.g.position; if (!c || Math.hypot(c.x - (cxB - ix), c.z - (czB - pz)) > 6) return 'Pump ' + A.pumps.length + ' — park the Corolla here first'; return A.car.st.fuel > 0.97 ? 'Tank is full ⛽' : 'Fill up the Corolla ⛽ (' + Math.round(A.car.st.fuel * 100) + '%) · $18'; }, action: () => {
          const c = A.car && A.car.g.position; if (!c || Math.hypot(c.x - (cxB - ix), c.z - (czB - pz)) > 6) return ctx.msg('Park the Corolla beside this pump first.');
          if (A.car.st.fuel > 0.97) return ctx.msg('She\'s already full.');
          if (!ctx.spend(18, 'gas')) return;
          const snd = Sfx.loop('water', V3(cxB - ix, GY + 1, czB - pz), 0.1);
          ctx.startAction({ label: 'Filling the tank', dur: 5, done: () => { snd.stop(); A.car.st.fuel = 1; Sfx.beep(2, 1500); ctx.task('fuel'); ctx.msg('⛽ Full tank. Receipt? No thanks.'); } });
          setTimeout(() => snd.stop(), 6500);
        } });
      }
    }
    // price sign
    const prT = canvasTex(160, 220, (g) => { g.fillStyle = '#1e7a46'; g.fillRect(0, 0, 160, 220); g.drawImage(bpT.userData.ctx ? bpT.userData.ctx.canvas : bpT.image, 30, 8, 100, 100); g.fillStyle = '#111'; g.fillRect(12, 116, 136, 96); g.fillStyle = '#ffe600'; g.textAlign = 'center'; g.font = 'bold 44px system-ui'; g.fillText('2.89', 80, 162); g.fillStyle = '#fff'; g.font = '20px system-ui'; g.fillText('Regular', 80, 196); });
    const pr = G(W, -78.5, GY, 47); B(pr, 0.5, 2.6, 0.5, steel, 0, 0, 0); plane(pr, 1.6, 2.2, new THREE.MeshStandardMaterial({ map: prT, emissive: 0xffffff, emissiveMap: prT, emissiveIntensity: 0.25 }), 0, 3.6, 0.3); plane(pr, 1.6, 2.2, new THREE.MeshStandardMaterial({ map: prT, emissive: 0xffffff, emissiveMap: prT, emissiveIntensity: 0.25 }), 0, 3.6, -0.3, 0, Math.PI);
    COL(-78.9, GY, 46.6, -78.1, GY + 2, 47.4);
    // the shop
    const SH = { x0: 156, x1: 182, z0: -176, z1: -190 };
    const shM = M(0xe3ded2, 0.85);
    const sb = (x0, y0, z0, x1, y1, z1, m = shM) => B(B_, x1 - x0, y1 - y0, z1 - z0, m, (x0 + x1) / 2, GY + y0, (z0 + z1) / 2);
    EXT_FLOORS.push({ x0: -116, z0: 79, x1: -90, z1: 93, y: 0.06 });
    sb(SH.x0, 0, SH.z1, SH.x1, 4, SH.z1 + 0.4); colBP(SH.x0, GY, SH.z1, SH.x1, GY + 4, SH.z1 + 0.4);
    sb(SH.x0, 0, SH.z1, SH.x0 + 0.4, 4, SH.z0); colBP(SH.x0, GY, SH.z1, SH.x0 + 0.4, GY + 4, SH.z0);
    sb(SH.x1 - 0.4, 0, SH.z1, SH.x1, 4, SH.z0); colBP(SH.x1 - 0.4, GY, SH.z1, SH.x1, GY + 4, SH.z0);
    // front wall with door gap x 167..169.2
    sb(SH.x0, 0, SH.z0 - 0.4, 167, 4, SH.z0); colBP(SH.x0, GY, SH.z0 - 0.4, 167, GY + 4, SH.z0);
    sb(169.2, 0, SH.z0 - 0.4, SH.x1, 4, SH.z0); colBP(169.2, GY, SH.z0 - 0.4, SH.x1, GY + 4, SH.z0);
    sb(167, 3.0, SH.z0 - 0.4, 169.2, 4, SH.z0);
    sb(SH.x0 - 0.2, 4, SH.z1 - 0.2, SH.x1 + 0.2, 4.35, SH.z0 + 0.2); B(B_, SH.x1 - SH.x0 + 0.4, 0.8, 0.3, greenM, 167 + 2, GY + 3.6, SH.z0 + 0.15);
    plane(B_, (SH.x1 - SH.x0) * 0.8, 0.9, M(0xdfeef7, 0.1, 0.4, { transparent: true, opacity: 0.5 }), 169, GY + 1.9, SH.z0 + 0.01); // window strip
    const shInT = canvasTex(256, 64, (g) => { g.fillStyle = '#1e7a46'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#fff'; g.font = 'bold 34px system-ui'; g.textAlign = 'center'; g.fillText('bp shop', 128, 44); });
    plane(B_, 5, 1.1, new THREE.MeshStandardMaterial({ map: shInT, emissive: 0xffffff, emissiveMap: shInT, emissiveIntensity: 0.3 }), 168, GY + 3.55, SH.z0 + 0.32);
    plane(B_, SH.x1 - SH.x0 - 0.9, -SH.z1 + SH.z0 - 0.9, M(0xffffff, 0.55, 0, { map: floorTex('tile') }), 169, GY + 0.06, -183, -Math.PI / 2);
    plane(B_, SH.x1 - SH.x0 - 0.9, -SH.z1 + SH.z0 - 0.9, M(0xf2f0ea, 0.95), 169, GY + 3.9, -183, Math.PI / 2);
    plane(B_, 10, 0.7, E(0xfff6e2, 1.4), 169, GY + 3.86, -183, Math.PI / 2);
    // cooler wall + snack shelf + counter + Sam
    B(B_, 10, 2.2, 0.8, M(0xcfd4d8, 0.5), 169, GY + 0.06, -189.2); plane(B_, 9.4, 1.7, E(0xcfe8ff, 0.9), 169, GY + 0.5, -188.75); colBP(164, GY, -189.8, 174, GY + 2.2, -188.4);
    const snk = B(B_, 4.6, 1.5, 1.0, M(0x8a9aa0, 0.6), 165, GY + 0.06, -183); for (let i = 0; i < 12; i++) B(B_, 0.3, 0.34, 0.2, M([0xe07a3f, 0xd9b44a, 0xc0392b, 0x4a7fb5][i % 4], 0.6), 163.2 + (i % 6) * 0.72, GY + 0.6 + Math.floor(i / 6) * 0.55, -183 + (i % 2 ? 0.25 : -0.25));
    colBP(162.7, GY, -183.6, 167.3, GY + 1.6, -182.4);
    const cnt = B(B_, 3.4, 1.05, 1.0, M(0x4a4038, 0.7), 176, GY + 0.06, -180); colBP(174.3, GY, -180.6, 177.7, GY + 1.1, -179.4);
    const sam = makePerson({ shirt: 0x1e7a46, pants: 0x222831, skin: 0xd9a06b, hair: 0x2a1a0e, hat: 0x1e7a46 });
    sam.g.position.set(-110, GY + 0.06, 84.4); sam.g.rotation.y = Math.PI; W.add(sam.g);
    ctx.tick(sam.g, (dt, t) => animPerson(sam, dt, t, 0));
    makeTalker(ctx, sam, { name: 'Sam', firstLine: 'Hey! Pump\'s on whenever you\'re ready.', lines: ['Coffee\'s fresh… ish.', 'Ray out back will sort that Corolla right up.', 'Cold snap coming this weekend, they say.'] });
    const snkHit = B(B_, 4.6, 1.7, 2.0, new THREE.MeshBasicMaterial({ visible: false }), 165, GY + 0.06, -183);
    ctx.interact(snkHit, { cook: true, reach: 3, label: () => 'Grab road snacks 🥨 · $4', action: () => { if (!ctx.spend(4, 'snacks')) return; ctx.give('snack', { kind: 'cheese' }, { rise: true }); } });
    const coolHit = B(B_, 9.4, 1.9, 0.5, new THREE.MeshBasicMaterial({ visible: false }), 169, GY + 0.1, -188.5);
    ctx.interact(coolHit, { cook: true, reach: 3, label: () => 'Energy drink from the cooler ⚡ · $3', action: () => { if (!ctx.spend(3, 'energy drink')) return; ctx.need('energy', 0.25); ctx.drink('coffee'); } });

    // ---- the garage behind the BP ----
    const GA = { x0: 150, x1: 182, z0: -198, z1: -214 };
    const gaM = M(0xb9bcbf, 0.7);
    sb(GA.x0, 0, GA.z1, GA.x1, 4.6, GA.z1 + 0.5, gaM); colBP(GA.x0, GY, GA.z1, GA.x1, GY + 4.6, GA.z1 + 0.5);
    sb(GA.x0, 0, GA.z1, GA.x0 + 0.5, 4.6, GA.z0, gaM); colBP(GA.x0, GY, GA.z1, GA.x0 + 0.5, GY + 4.6, GA.z0);
    sb(GA.x1 - 0.5, 0, GA.z1, GA.x1, 4.6, GA.z0, gaM); colBP(GA.x1 - 0.5, GY, GA.z1, GA.x1, GY + 4.6, GA.z0);
    // north face: two open bays + office strip
    sb(GA.x0, 0, GA.z0 - 0.5, 154, 4.6, GA.z0, gaM); colBP(GA.x0, GY, GA.z0 - 0.5, 154, GY + 4.6, GA.z0);
    sb(160, 0, GA.z0 - 0.5, 164, 4.6, GA.z0, gaM); colBP(160, GY, GA.z0 - 0.5, 164, GY + 4.6, GA.z0);
    sb(170, 0, GA.z0 - 0.5, GA.x1, 4.6, GA.z0, gaM); colBP(170, GY, GA.z0 - 0.5, GA.x1, GY + 4.6, GA.z0);
    sb(154, 3.2, GA.z0 - 0.5, 160, 4.6, GA.z0, gaM); sb(164, 3.2, GA.z0 - 0.5, 170, 4.6, GA.z0, gaM);
    for (const x of [157, 167]) { const rd = B(B_, 5.6, 0.9, 0.12, M(0x7a8288, 0.5, 0.3), x, GY + 3.1, GA.z0 - 0.2); rd.rotation.x = 0.5; } // rolled-up doors
    sb(GA.x0 + 0.2, 4.6, GA.z1 + 0.2, GA.x1 - 0.2, 4.95, GA.z0 - 0.2, M(0x4a4f55, 0.8));
    const gaT = canvasTex(512, 80, (g) => { g.fillStyle = '#b32025'; g.fillRect(0, 0, 512, 80); g.fillStyle = '#fff'; g.font = 'bold 40px system-ui'; g.textAlign = 'center'; g.fillText('MOORESVILLE AUTO & TIRE', 256, 54); });
    plane(B_, 14, 1.6, new THREE.MeshStandardMaterial({ map: gaT, emissive: 0xffffff, emissiveMap: gaT, emissiveIntensity: 0.25 }), 166, GY + 4.0, GA.z0 + 0.3);
    plane(B_, GA.x1 - GA.x0 - 1, -GA.z1 + GA.z0 - 1, M(0x6d7277, 0.9), 166, GY + 0.05, -206, -Math.PI / 2); EXT_FLOORS.push({ x0: -116, z0: 101, x1: -84, z1: 117, y: 0.05 });
    plane(B_, 10, 0.7, E(0xfff6e2, 1.3), 166, GY + 4.5, -206, Math.PI / 2);
    // lift with a car up on it
    const lift = G(B_, 157, GY + 0.05, -206);
    for (const s of [-1.3, 1.3]) { B(lift, 0.3, 2.0, 0.3, M(0xd94f20, 0.5), s, 0, -1.2); B(lift, 0.3, 2.0, 0.3, M(0xd94f20, 0.5), s, 0, 1.2); B(lift, 0.25, 0.12, 3.4, M(0x333a40, 0.5), s, 1.6, 0); }
    colBP(155.4, GY, -207.6, 158.6, GY + 2, -204.4);
    const liftedCar = G(lift, 0, 1.75, 0); const lcM = M(0x5b6b73, 0.35, 0.5); B(liftedCar, 1.8, 0.55, 4.2, lcM, 0, 0.1, 0); B(liftedCar, 1.6, 0.5, 2.1, M(0x1c232b, 0.2, 0.4), 0, 0.62, -0.1);
    for (const wx of [-0.86, 0.86]) for (const wz of [-1.35, 1.35]) { const w = C(liftedCar, 0.32, 0.32, 0.2, M(0x111111, 0.8), wx, 0.05, wz, 10); w.rotation.z = Math.PI / 2; }
    // tires, tool wall, bench
    for (const [tx, tz, n] of [[176, -210, 4], [179, -209, 3], [173.5, -211.5, 5]]) { for (let i = 0; i < n; i++) { const t = T(B_, 0.42, 0.16, M(0x16181a, 0.9), tx, GY + 0.22 + i * 0.34, tz, TAU); t.rotation.x = Math.PI / 2; } colBP(tx - 0.6, GY, tz - 0.6, tx + 0.6, GY + 1.6, tz + 0.6); }
    B(B_, 6, 1.0, 0.8, M(0x4a4038, 0.7), 166, GY + 0.05, -213.1); colBP(163, GY, -213.6, 169, GY + 1.2, -212.6);
    for (let i = 0; i < 10; i++) B(B_, 0.18, 0.5 + (i % 3) * 0.14, 0.06, M([0xc0392b, 0x4a7fb5, 0xd9b44a][i % 3], 0.6), 163 + i * 0.6, GY + 2.2, -213.4);
    const ray = makePerson({ shirt: 0x3a6ea5, pants: 0x32383e, skin: 0xb97a4e, hair: 0x4a4a4a, apron: 0x2e3a46 });
    ray.g.position.set(-93.5, GY + 0.05, 109.5); ray.g.rotation.y = 1.9; W.add(ray.g);
    ctx.tick(ray.g, (dt, t) => animPerson(ray, dt, t, 0));
    makeTalker(ctx, ray, { name: 'Ray', firstLine: 'Afternoon! Ray. That the Corolla from over at Avalon?', lines: ['Tires look decent. Rotate \'em in spring.', 'Bring her round back any time.', 'Sam up front makes terrible coffee. Don\'t tell him.'] });
    const svcHit = B(B_, 3.2, 2, 3.2, new THREE.MeshBasicMaterial({ visible: false }), 166.5, GY + 0.05, -206);
    ctx.interact(svcHit, { cook: true, reach: 4, label: () => 'Quick check-up for the Corolla 🔧 · $20', action: () => {
      const c = A.car && A.car.g.position; if (!c || Math.hypot(c.x + 100, c.z - 103) > 14) return ctx.msg('Ray: "Pull the Corolla around back first — park it by the bay."');
      if (!ctx.spend(20, 'check-up')) return;
      ctx.startAction({ label: 'Watching Ray work', dur: 6, done: () => { ray.say('All set. She\'s healthy!'); A.car.st.fuel = Math.max(A.car.st.fuel, 0.35); ctx.need('fun', 0.12); ctx.task('garage'); ctx.msg('🔧 Check-up done. The Corolla purrs now.'); } });
    } });
  }

  // autumn woods (instanced), provably clear of every road, lot and parcel
  {
    const leafCols = [0xd9622b, 0xe8a23a, 0xb83a26, 0xe3c14b, 0x8f5a2a, 0x6f8a3e, 0xc94f1f, 0xf0b54a];
    const NO = [[-40, -37, 46, 22], [26, -14, 57, 40], [-204, 24, 228, 48], [28, -120, 108, -34], [-140, 40, -76, 125], [40, -96, 58, 40], [60, 48, 100, 88], [106, 48, 146, 90], [-60, -2, -34, 16], [-56, -30, -32, -12], [-24, -58, 4, -38]];
    const clearOf = (x, z) => !RD.some(q => x > q.r[0] - 5 && x < q.r[2] + 5 && z > q.r[1] - 5 && z < q.r[3] + 5) && !NO.some(r => x > r[0] && x < r[2] && z > r[1] && z < r[3]);
    A.treeClear = clearOf;
    const N = 420, sg = new THREE.IcosahedronGeometry(1, 1), im = new THREE.InstancedMesh(sg, M(0xffffff, 0.9), N);
    const tg = new THREE.CylinderGeometry(0.15, 0.25, 1, 6), tm = new THREE.InstancedMesh(tg, M(0x4a3628, 0.9), N);
    const d = new THREE.Object3D(), c = new THREE.Color(); let k = 0, guard = 0;
    A.treeSpots = [];
    while (k < N && guard++ < 9000) {
      const x = rand(-230, 250), z = rand(-230, 180);
      if (!clearOf(x, z)) continue;
      const sc = rand(1.6, 3.2), h = rand(5, 10);
      d.position.set(x, GY + h, z); d.scale.set(sc, sc * 1.3, sc); d.rotation.set(Math.random(), Math.random(), 0); d.updateMatrix(); im.setMatrixAt(k, d.matrix); im.setColorAt(k, c.set(leafCols[(Math.random() * leafCols.length) | 0]).offsetHSL(0, 0, rand(-0.05, 0.05)));
      d.position.set(x, GY + h / 2, z); d.scale.set(1, h, 1); d.rotation.set(0, 0, 0); d.updateMatrix(); tm.setMatrixAt(k, d.matrix); A.treeSpots.push([x, z]); k++;
    }
    W.add(im); W.add(tm);
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
  A.inTower = (x, z) => x > 7.6 && x < 9.95 && z > -0.2 && z < 5.6;
  const AREAS = [
    { id: 'lot', n: 'Parking lot · Avalon', r: [-34, -31, 40, -0.4], tip: '🅿 Your red Corolla is parked by the stairs. Right-click the door to drive — and press M for the map.' },
    { id: 'caspian', n: 'Caspian Pl', r: [29, -12, 41, 38], tip: '🛣 Caspian Pl runs down to Highway 150. Left at the stop for the BP, or straight over onto Perth Rd for Harris Teeter.' },
    { id: 'frontlot', n: 'Avalon Lake Norman · front', r: [-22, 16, 26, 30], tip: '🏢 The front of your complex, along Highway 150.' },
    { id: 'hwy', n: 'Highway 150', r: [-202, 28, 226, 46], tip: '🛣 Highway 150. The BP is west at the end of the road; Perth Rd (east) goes up to Harris Teeter.' },
    { id: 'perth', n: 'Perth Rd', r: [42, -94, 56, 28], tip: '🛣 Perth Rd — Harris Teeter is just up ahead.' },
    { id: 'ht', n: 'Harris Teeter · Perth Rd', r: [28, -120, 108, -36], tip: '🛒 Harris Teeter: in through the sliding doors. Groceries $12, flowers $6, energy drink $3.' },
    { id: 'bp', n: 'BP · Highway 150', r: [-136, 42, -78, 100], tip: '⛽ The BP. Park beside a pump and right-click it to fill the tank ($18). Snacks in the shop.' },
    { id: 'garage', n: 'Mooresville Auto & Tire', r: [-136, 98, -82, 124], tip: '🔧 The garage behind the BP. Park by the bays and Ray will give the Corolla a check-up ($20).' },
  ];
  A.areaAt = (x, z, y = GY) => {
    if (y > -2) return null;
    for (const a of AREAS) if (x > a.r[0] && x < a.r[2] && z > a.r[1] && z < a.r[3]) return a;
    return { id: 'outside', n: 'Mooresville, NC' };
  };
  // data for the in-game map (drawn by the HUD)
  A.map = {
    bounds: [-210, -130, 235, 135], // x0, z0, x1, z1 shown
    roads: RD.map(q => q.r),
    hwyLine: [-200, 37, 224],
    blds: [
      { r: [-16, -0.06, 26, 16], c: '#e8c54a' }, { r: [9.87, 5.5, 14.1, 10.5], c: '#e8c54a' },
      { r: [-57, 1, -39, 13], c: '#e3dccd' }, { r: [-52, -28, -36, -16], c: '#e3dccd' }, { r: [-21, -54, 1, -41], c: '#e3dccd' },
      { r: [54, -116, 104, -92], c: '#1f4432' },
      { r: [-116, 55, -82, 73], c: '#1e7a46' }, { r: [-116, 79, -90, 93], c: '#e3ded2' }, { r: [-116, 101, -84, 117], c: '#8a8f94' },
      { r: [72, 69, 88, 79], c: '#d6c3ab' }, { r: [119, 67, 133, 76], c: '#d6c3ab' },
    ],
    labels: [
      ['Apartment Complex', 5, 8, 12, '#4a3a28', 0], ['P', 3, -17, 15, '#f6f3ea', 0], ['stairs ▾', 8.8, -24.5, 10, '#4a3a28', 0],
      ['Caspian Pl', 35, 10, 10, '#4a3a28', -1.5708], ['HIGHWAY 150', -30, 37, 13, '#f6f3ea', 0],
      ['Perth Rd', 48, -18, 11, '#f6f3ea', -1.5708], ['Harris Teeter', 79, -104, 12, '#f6efe0', 0],
      ['bp', -99, 64, 14, '#ffe600', 0], ['shop', -103, 86, 9, '#4a3a28', 0], ['Auto & Tire', -100, 109, 9, '#f6f3ea', 0],
    ],
  };
  return A;
}
