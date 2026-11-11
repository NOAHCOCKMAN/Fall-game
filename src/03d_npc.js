// ---------- people: low-poly folks you can say hi to ----------
const _npcV = new THREE.Vector3(), _npcV2 = new THREE.Vector3();
function makePerson(o) {
  o = Object.assign({ shirt: 0x5b6b73, pants: 0x2e3a46, skin: 0xe2b08a, hair: 0x3a2a1a, shoes: 0x222222, hat: null, apron: null }, o);
  const g = new THREE.Group(); markDyn(g);
  const skin = M(o.skin, 0.6), shirt = M(o.shirt, 0.8), pants = M(o.pants, 0.8);
  const legL = G(g, -0.09, 0.47, 0), legR = G(g, 0.09, 0.47, 0);
  for (const l of [legL, legR]) { B(l, 0.13, 0.47, 0.15, pants, 0, -0.47, 0); B(l, 0.14, 0.09, 0.26, M(o.shoes, 0.7), 0, -0.47, 0.04); }
  const torso = G(g, 0, 0.47, 0);
  B(torso, 0.4, 0.52, 0.22, shirt, 0, 0.42, 0);
  if (o.apron) { B(torso, 0.34, 0.44, 0.02, M(o.apron, 0.85), 0, 0.44, 0.125); }
  const armL = G(torso, -0.235, 0.86, 0), armR = G(torso, 0.235, 0.86, 0);
  for (const a of [armL, armR]) { B(a, 0.11, 0.42, 0.13, shirt, 0, -0.44, 0); S(a, 0.055, skin, 0, -0.46, 0, 8, 6); }
  const head = G(torso, 0, 0.94, 0);
  S(head, 0.135, skin, 0, 0.14, 0, 14, 10);
  const hair = S(head, 0.14, M(o.hair, 0.9), 0, 0.17, -0.015, 12, 8); hair.scale.set(1, 0.72, 1);
  if (o.hat) { C(head, 0.145, 0.145, 0.09, M(o.hat, 0.8), 0, 0.2, 0, 14); C(head, 0.145, 0.145, 0.015, M(o.hat, 0.8), 0, 0.2, 0.09, 14).position.z = 0.1; }
  // eyes
  for (const s of [-1, 1]) S(head, 0.014, M(0x1a1a1a, 0.4), s * 0.05, 0.16, 0.125, 6, 4);
  // speech bubble
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const bg = cv.getContext('2d');
  const btex = new THREE.CanvasTexture(cv); btex.colorSpace = THREE.SRGBColorSpace;
  const bub = new THREE.Sprite(new THREE.SpriteMaterial({ map: btex, transparent: true, depthWrite: false, toneMapped: false }));
  bub.scale.set(1.1, 0.275, 1); bub.position.set(0, 2.05, 0); bub.visible = false; g.add(bub); noRay(bub);
  const P_ = { g, torso, head, legL, legR, armL, armR, bub, phase: Math.random() * 6, say(text, secs = 3.2) {
    bg.clearRect(0, 0, 256, 64); bg.fillStyle = 'rgba(250,247,240,0.95)'; bg.beginPath(); bg.roundRect(4, 2, 248, 50, 22); bg.fill();
    bg.beginPath(); bg.moveTo(118, 50); bg.lineTo(138, 50); bg.lineTo(128, 62); bg.fill();
    bg.fillStyle = '#2a211a'; let fs = 22; bg.font = '600 ' + fs + 'px system-ui, sans-serif'; while (bg.measureText(text).width > 232 && fs > 12) { fs--; bg.font = '600 ' + fs + 'px system-ui, sans-serif'; }
    bg.textAlign = 'center'; bg.textBaseline = 'middle'; bg.fillText(text, 128, 28); btex.needsUpdate = true;
    bub.visible = true; P_.bubUntil = performance.now() + secs * 1000;
  } };
  g.userData.person = P_;
  return P_;
}
// idle sway / walk cycle; call every tick with speed (m/s)
function animPerson(P_, dt, t, speed) {
  const w = speed > 0.05;
  const k = w ? Math.sin((P_.phase += dt * speed * 4.4)) : 0;
  P_.legL.rotation.x = k * 0.55; P_.legR.rotation.x = -k * 0.55;
  P_.armL.rotation.x = -k * 0.4; P_.armR.rotation.x = k * 0.4;
  P_.torso.position.y = 0.47 + (w ? Math.abs(Math.cos(P_.phase)) * 0.025 : Math.sin(t * 1.7 + P_.phase) * 0.008);
  P_.head.rotation.y = w ? 0 : Math.sin(t * 0.43 + P_.phase) * 0.35;
  if (P_.bubUntil && performance.now() > P_.bubUntil) { P_.bub.visible = false; P_.bubUntil = 0; }
}
// walk a person along waypoints at ground height gy(x,z); returns true when arrived
function walkPerson(P_, dt, t, path, speed, gyFn) {
  if (!path.length) { animPerson(P_, dt, t, 0); return true; }
  const g = P_.g, tgt = path[0];
  const dx = tgt[0] - g.position.x, dz = tgt[1] - g.position.z, d = Math.hypot(dx, dz);
  if (d < 0.12) { path.shift(); animPerson(P_, dt, t, 0.1); return path.length === 0; }
  const step = Math.min(d, speed * dt);
  g.position.x += dx / d * step; g.position.z += dz / d * step;
  if (gyFn) g.position.y = gyFn(g.position.x, g.position.z, g.position.y);
  const want = Math.atan2(dx, dz); let dy = want - g.rotation.y; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU;
  g.rotation.y += clamp(dy, -4 * dt, 4 * dt);
  animPerson(P_, dt, t, speed);
  return false;
}
// a chatty NPC: rotating lines, says hi back, completes a task the first time
function makeTalker(ctx, P_, { name, lines, task, firstLine }) {
  let i = 0, met = false;
  ctx.interact(P_.g, {
    reach: 3,
    label: () => 'Say hi to ' + name + ' 👋',
    action: () => {
      const line = !met && firstLine ? firstLine : lines[i++ % lines.length];
      P_.say(line); met = true;
      Sfx.tone(300 + Math.random() * 60, 0.14, 'sine', 0.06, 40); Sfx.tone(240, 0.12, 'sine', 0.05, -30, 0.14); // friendly mumble
      if (task) ctx.task(task);
    }
  });
  return P_;
}
