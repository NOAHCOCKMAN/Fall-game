// ---------- Maple the cat: wanders the apartment, naps, eats, purrs, chases toys ----------
function buildCat(A, ctx) {
  // walkable waypoint graph (x, z, y) — perches have y > 0
  const N = {
    L1: [5.6, 2.45], L2: [6.6, 4.6], L3: [5.3, 4.95], K1: [4.0, 5.6], P1: [3.5, 4.95], A1: [3.5, 3.85], B1: [3.4, 2.95], B2: [3.0, 1.45],
    BB: [1.35, 2.98], BA: [2.25, 5.0], BA2: [1.3, 4.7], D1: [3.35, 6.0], K2a: [3.3, 6.55], K2: [3.2, 8.55], K3: [5.0, 8.45], E1: [6.7, 7.6], BW: [6.95, 4.85],
    SOFA: [4.8, 3.2, 0.45], BED: [1.5, 1.5, 0.62], RUG: [6.55, 3.6],
  };
  const EDGES = [['L1', 'L2'], ['L1', 'L3'], ['L2', 'L3'], ['L3', 'K1'], ['K1', 'P1'], ['P1', 'A1', 'bedroom'], ['A1', 'B1'], ['B1', 'B2'], ['B2', 'BED'], ['B1', 'BB'], ['BB', 'BA2', 'bathB'], ['BA2', 'BA'],
    ['K1', 'D1'], ['D1', 'BA', 'bathK'], ['K1', 'K2a'], ['K2a', 'D1'], ['K2a', 'K2'], ['K2', 'K3'], ['K3', 'E1'], ['E1', 'L2'], ['L2', 'BW'], ['L3', 'SOFA'], ['L1', 'SOFA'], ['L1', 'RUG'], ['L2', 'RUG']];
  const nodePos = (k) => V3(N[k][0], N[k][2] || 0, N[k][1]);
  const doorOpen = (id) => !id || (A.doorById[id] && A.doorById[id].v > 0.75);
  function neighbors(k) { const out = []; for (const [a, b, d] of EDGES) { if (!doorOpen(d)) continue; if (a === k) out.push(b); else if (b === k) out.push(a); } return out; }
  function route(from, to) {
    const prev = { [from]: null }, q = [from];
    while (q.length) { const k = q.shift(); if (k === to) break; for (const n of neighbors(k)) if (!(n in prev)) { prev[n] = k; q.push(n); } }
    if (!(to in prev)) return null; const path = []; for (let k = to; k !== from; k = prev[k]) path.unshift(k); return path;
  }
  function nearest(p, groundOnly) { let best = null, bd = 1e9; for (const k in N) { if (groundOnly && N[k][2]) continue; const d = Math.hypot(N[k][0] - p.x, N[k][1] - p.z); if (d < bd) { bd = d; best = k; } } return best; }

  // ---- model ----
  const fur = canvasTex(128, 128, (g) => { g.fillStyle = '#d4883e'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(140,70,20,.55)'; g.fillRect(0, i * 14 + 3, 128, 6); } });
  const furM = M(0xffffff, 0.95, 0, { map: fur }), light = M(0xf3e6d2, 0.95), pink = M(0xe89aa0, 0.6), eyeM = M(0x2b3a1e, 0.2, 0, { emissive: 0x9fe060, emissiveIntensity: 0 });
  const root = new THREE.Group(); A.world.add(root);
  const bodyG = G(root, 0, 0, 0);
  const body = S(bodyG, 0.1, furM, 0, 0.2, 0, 16, 12); body.scale.set(1.15, 1, 2.3);
  S(bodyG, 0.075, light, 0, 0.17, 0.12, 10, 8).scale.set(1.2, 1, 1.6);
  const headG = G(bodyG, 0, 0.3, 0.23);
  S(headG, 0.085, furM, 0, 0, 0, 16, 12).scale.set(1.1, 0.95, 1);
  S(headG, 0.045, light, 0, -0.03, 0.06, 10, 8).scale.set(1.2, 0.8, 0.8);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 4), furM); ear.position.set(s * 0.05, 0.08, -0.01); ear.rotation.z = -s * 0.25; headG.add(ear); }
  const eyes = [-1, 1].map(s => { const e = S(headG, 0.014, eyeM, s * 0.035, 0.015, 0.075, 8, 6); return e; });
  S(headG, 0.01, pink, 0, -0.012, 0.09, 6, 4);
  const legs = []; for (const [x, z] of [[-0.06, 0.15], [0.06, 0.15], [-0.06, -0.15], [0.06, -0.15]]) { const p = G(bodyG, x, 0.17, z); const l = C(p, 0.022, 0.02, 0.17, furM, 0, -0.17, 0, 8); S(p, 0.024, light, 0, -0.165, 0.01, 8, 6); legs.push(p); }
  const tail = []; let parent = G(bodyG, 0, 0.24, -0.22); for (let i = 0; i < 6; i++) { const seg = G(parent, 0, 0, i ? -0.05 : 0); C(seg, 0.02 - i * 0.002, 0.022 - i * 0.002, 0.055, furM, 0, 0, 0, 6).rotation.x = Math.PI / 2; seg.children[0].position.set(0, 0, -0.027); tail.push(seg); parent = seg; }
  const zTex = canvasTex(64, 64, (g) => { g.fillStyle = '#ffffff'; g.font = 'bold 44px sans-serif'; g.fillText('z', 18, 46); });
  const zs = [0, 1, 2].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false })); s.scale.setScalar(0.08); root.add(s); s.visible = false; return s; });
  const heartTex = canvasTex(64, 64, (g) => { g.fillStyle = '#ff5a7a'; g.beginPath(); g.moveTo(32, 54); g.bezierCurveTo(4, 34, 8, 8, 32, 22); g.bezierCurveTo(56, 8, 60, 34, 32, 54); g.fill(); });
  const hearts = [0, 1, 2].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false })); s.scale.setScalar(0.08); root.add(s); s.visible = false; return s; });

  // ---- state ----
  const cat = { root, pos: nodePos('RUG'), node: 'RUG', yaw: 0, path: [], seg: null, pose: 'loaf', idle: 4, hunger: 0.7, purr: 0, eat: 0, chaseTo: null, speed: 0, phase: 0, heartT: 0, meowT: 5, poseK: { sit: 0, loaf: 1 }, affection: 0 };
  root.position.copy(cat.pos);
  const playerPos = () => ctx.playerPos();
  function goTo(key, run) { const p = route(cat.node, key); if (!p) return false; cat.path = p; cat.run = !!run; cat.pose = 'stand'; return true; }
  function pickBehavior() {
    const hour = ctx.hour();
    const night = hour >= 22 || hour < 6;
    if (cat.hunger < 0.35 && ctx.catBowl) { if (cat.node !== 'BW') { goTo('BW'); return; } }
    const r = Math.random();
    if (night && r < 0.6) { goTo(Math.random() < 0.6 ? 'BED' : 'SOFA'); cat.after = 'sleep'; return; }
    if (r < 0.25) { goTo('SOFA'); cat.after = Math.random() < 0.5 ? 'sleep' : 'loaf'; }
    else if (r < 0.4) { goTo('RUG'); cat.after = 'loaf'; }
    else if (r < 0.5) { goTo('BED'); cat.after = 'sleep'; }
    else if (r < 0.65) { const pn = nearest(playerPos(), true); goTo(pn); cat.after = 'sit'; } // come say hi
    else { const ks = Object.keys(N).filter(k => !N[k][2]); goTo(ks[(Math.random() * ks.length) | 0]); cat.after = Math.random() < 0.5 ? 'sit' : 'stand'; }
  }
  cat.call = () => { if (ctx.catBowl && cat.node !== 'BW') { goTo('BW', true); } Sfx.meow(); };
  cat.chase = (p) => { const n = nearest(p, true); if (goTo(n, true) || n === cat.node) { cat.chaseTo = p.clone(); cat.chaseTo.y = 0; } };
  cat.pet = () => {
    cat.path = []; cat.seg = null; cat.purr = 4; cat.pose = cat.pose === 'sleep' ? 'loaf' : (cat.pose === 'stand' ? 'sit' : cat.pose); cat.heartT = 0; cat.affection++;
    if (!cat.purrSnd) cat.purrSnd = Sfx.loop('purr', () => root.position, 0.25);
    ctx.need('fun', 0.12); ctx.task('pet'); if (Math.random() < 0.4) Sfx.meow();
    ctx.msg(['Maple leans into the scritches. 🐱', 'Purrrrrr…', 'Maple headbutts your hand. ❤️', 'Maple flops over for belly rubs. (It\'s a trap.)'][(cat.affection - 1) % 4]);
  };
  ctx.interact(root, {
    label: () => cat.eat > 0 ? 'Maple is eating…' : cat.pose === 'sleep' ? 'Gently pet sleeping Maple 💤' : cat.hunger < 0.35 ? 'Pet Maple (she looks hungry)' : 'Pet Maple 🐱',
    action: () => { if (cat.eat > 0) return ctx.msg('Let her eat in peace. 🐟'); cat.pet(); }
  });

  // ---- update ----
  ctx.tick(root, (dt, t) => {
    cat.hunger = Math.max(0, cat.hunger - dt / 420);
    let moving = false;
    if (cat.purr > 0) {
      cat.purr -= dt; const pp = playerPos(); const want = Math.atan2(pp.x - cat.pos.x, pp.z - cat.pos.z); cat.yaw += Math.atan2(Math.sin(want - cat.yaw), Math.cos(want - cat.yaw)) * Math.min(1, dt * 4);
      cat.heartT += dt; hearts.forEach((h, i) => { const k = (cat.heartT * 0.7 + i / 3) % 1; h.visible = cat.purr > 0.3; h.position.set(Math.sin(i * 2 + t) * 0.06, 0.45 + k * 0.35, 0.1); h.material.opacity = 1 - k; });
      if (cat.purr <= 0) { hearts.forEach(h => h.visible = false); cat.purrSnd && cat.purrSnd.stop(); cat.purrSnd = null; cat.idle = 3; }
    } else if (cat.eat > 0) {
      cat.eat -= dt; cat.pose = 'eat'; if (Math.random() < dt * 3) Sfx.crunch();
      if (ctx.catBowl) ctx.catBowl.st.food = Math.max(0, ctx.catBowl.st.food - dt / 7);
      cat.hunger = Math.min(1, cat.hunger + dt / 6);
      if (cat.eat <= 0 || !ctx.catBowl || ctx.catBowl.st.food <= 0) { cat.eat = 0; cat.idle = 4; cat.pose = 'sit'; }
    } else if (cat.path.length || cat.chaseTo) {
      // walk along the route, hopping onto perches
      let target, tkey = cat.path[0];
      if (tkey) target = nodePos(tkey); else target = cat.chaseTo;
      if (!cat.seg) cat.seg = { from: cat.pos.clone(), to: target.clone(), k: 0, len: Math.max(0.01, Math.hypot(target.x - cat.pos.x, target.z - cat.pos.z)) };
      const sp = cat.run ? 2.0 : 0.65; cat.seg.k = Math.min(1, cat.seg.k + dt * sp / cat.seg.len);
      const s = cat.seg, k = s.k; cat.pos.lerpVectors(s.from, s.to, k);
      if (Math.abs(s.to.y - s.from.y) > 0.05) cat.pos.y = lerp(s.from.y, s.to.y, k) + Math.sin(k * Math.PI) * 0.35;
      const want = Math.atan2(s.to.x - s.from.x, s.to.z - s.from.z); cat.yaw += Math.atan2(Math.sin(want - cat.yaw), Math.cos(want - cat.yaw)) * Math.min(1, dt * 8);
      moving = true; cat.pose = 'stand';
      if (k >= 1) {
        cat.seg = null;
        if (tkey) { cat.node = tkey; cat.path.shift(); }
        else { cat.chaseTo = null; cat.idle = 5; cat.pose = 'sit'; Sfx.meow(); ctx.need('fun', 0.1); ctx.task('playcat'); ctx.msg('Maple pounces on the toy mouse! 🐭'); }
        if (!cat.path.length && !cat.chaseTo) {
          cat.run = false;
          if (cat.node === 'BW' && ctx.catBowl && ctx.catBowl.st.food > 0.05 && cat.hunger < 0.8) { cat.eat = 7; cat.yaw = Math.PI / 2; }
          else { cat.pose = cat.after || 'sit'; cat.after = null; cat.idle = cat.pose === 'sleep' ? rand(25, 50) : rand(6, 16); }
        }
      }
    } else {
      cat.idle -= dt;
      if (cat.node === 'BW' && cat.hunger < 0.35 && (!ctx.catBowl || ctx.catBowl.st.food <= 0.05)) { if ((cat.meowT -= dt) < 0) { cat.meowT = 9; Sfx.meow(); if (Math.random() < 0.5) ctx.msg('🐱 Maple is meowing at her empty bowl.'); } cat.pose = 'sit'; }
      else if (cat.node === 'BW' && ctx.catBowl && ctx.catBowl.st.food > 0.05 && cat.hunger < 0.8) { cat.eat = 7; }
      else if (cat.idle <= 0) pickBehavior();
    }
    cat.speed = lerp(cat.speed, moving ? (cat.run ? 2 : 0.65) : 0, dt * 6);
    // ---- pose & animation ----
    root.position.copy(cat.pos); root.rotation.y = cat.yaw;
    const pose = cat.pose; const sit = pose === 'sit' || pose === 'eat' ? 1 : 0, loaf = pose === 'loaf' || pose === 'sleep' ? 1 : 0;
    cat.poseK.sit = lerp(cat.poseK.sit, sit, dt * 5); cat.poseK.loaf = lerp(cat.poseK.loaf, loaf, dt * 4);
    const ps = cat.poseK.sit, pl = cat.poseK.loaf;
    bodyG.rotation.x = -0.55 * ps; bodyG.position.y = -0.03 * ps - 0.1 * pl; bodyG.position.z = -0.06 * ps;
    cat.phase += dt * cat.speed * 9;
    legs.forEach((l, i) => { const sw = Math.sin(cat.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.6 * Math.min(1, cat.speed); l.rotation.x = sw + (i >= 2 ? 1.2 * ps : -0.2 * ps) ; l.scale.y = 1 - 0.75 * pl; });
    headG.rotation.x = pose === 'eat' ? 0.9 + Math.sin(t * 8) * 0.08 : pose === 'sleep' ? 0.5 : 0.45 * ps - 0.1 * pl + Math.sin(t * 0.7) * 0.05;
    headG.rotation.y = pose === 'sleep' ? 0.6 : Math.sin(t * 0.4) * 0.3 * (1 - pl);
    tail.forEach((s, i) => { s.rotation.y = Math.sin(t * (moving ? 6 : 1.5) + i * 0.6) * (pose === 'sleep' ? 0.05 : 0.25); s.rotation.x = moving ? -0.25 : (pl > 0.5 ? 0.05 : -0.12 + i * 0.04); });
    const closed = pose === 'sleep' || cat.purr > 0; eyes.forEach(e => e.scale.y = closed ? 0.15 : 1 - (Math.sin(t * 0.9) > 0.985 ? 0.85 : 0));
    eyeM.emissiveIntensity = ctx.isNight() && !closed ? 0.6 : 0;
    zs.forEach((z, i) => { z.visible = pose === 'sleep' && cat.purr <= 0; const k = (t * 0.35 + i / 3) % 1; z.position.set(0.05 + k * 0.1, 0.35 + k * 0.4, 0.2); z.material.opacity = 1 - k; });
  });
  return cat;
}
