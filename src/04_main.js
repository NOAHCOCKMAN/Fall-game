// ---------- engine: renderer, player, interaction, build mode, saving, UI ----------
const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('fallapt2.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fallapt2.' + k, JSON.stringify(v)); } catch (e) { } }
};
const settings = Object.assign({ sens: 1, invert: false, quality: 'high', muted: false, snap: true }, store.get('settings', {}));
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

// ---- renderer ----
const canvas = $('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const applyQuality = () => renderer.setPixelRatio(Math.min(devicePixelRatio, settings.quality === 'high' ? 1.75 : settings.quality === 'med' ? 1.2 : 0.8));
applyQuality();
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 700); camera.rotation.order = 'YXZ';
scene.add(camera);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;
scene.fog = new THREE.Fog(0xcfe3f5, 60, 260);
const hemi = new THREE.HemisphereLight(0xdfeaf7, 0x8a7a66, 0.9); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.0); sun.position.set(-25, 30, -40); scene.add(sun);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---- world state ----
const STATIC = []; // {box, upd}
let TICKS = [], CLEANUPS = [];
let power = true, lightCount = 0;
const MAX_LIGHTS = 18;
const P = { pos: V3(), vy: 0, yaw: 0, pitch: -0.05, eye: 1.62, crouch: false, sit: null, day: 1, dayTarget: 1, hunger: 0.7, energy: 0.6, caffeine: 0, bob: 0 };
let buildMode = false, held = null, heldSet = new Set(), heldInfo = null, hover = null, buildHover = null;
let undoStack = [];
const itemsGroup = new THREE.Group();

const ctx = {
  lightCount: 0,
  interact(obj, def) { obj.userData.int = def; },
  tick(owner, fn) { TICKS.push({ owner, fn }); },
  onRemove(owner, fn) { CLEANUPS.push({ owner, fn }); },
  addCollider(box, upd) { STATIC.push({ box, upd }); },
  light(parent, color, intensity, dist, x, y, z) {
    if (lightCount >= MAX_LIGHTS) return { intensity: 0 };
    const l = new THREE.PointLight(color, intensity, dist, 1.5); l.position.set(x, y, z); parent.add(l); lightCount++;
    ctx.onRemove(parent, () => lightCount--); return l;
  },
  power: () => power,
  setPower(v) { power = v; },
  isNight: () => P.dayTarget < 0.5,
  rootOf(o) { while (o && !o.userData.item) o = o.parent; return o; },
  msg: (t) => toast(t),
  task: (id) => completeTask(id),
  heatAt(p) { return A.heat.find(h => h.on && Math.hypot(h.pos.x - p.x, h.pos.z - p.z) < 0.14 && p.y - h.pos.y > -0.03 && p.y - h.pos.y < 0.12) || null; },
  give(type, d) {
    if (held) cancelHold();
    const inst = { id: uid(), t: type, x: P.pos.x, y: 0, z: P.pos.z, r: P.yaw, d: d || {} };
    const g = spawnItem(inst); startHold(g, true);
  },
  removeItem(g) { removeItem(g); saveCurrentSoon(); },
  sit(pos, yaw, lie, root) {
    if (held) return toast('Put down what you\'re holding first.');
    P.sit = { pos: pos.clone(), yaw, lie, prev: P.pos.clone() }; P.yaw = yaw; P.pitch = lie ? 0.9 : -0.1;
    toast(lie ? 'Press any move key to get up.' : 'Sitting. Move to stand up.');
  },
  sleep(bed) {
    const p = V3(0, 0.6, 0.1); bed.localToWorld(p); const q = new THREE.Quaternion(); bed.getWorldQuaternion(q);
    const e = new THREE.Euler().setFromQuaternion(q, 'YXZ'); ctx.sit(p, e.y + Math.PI, true, bed);
    fade(() => { P.dayTarget = P.dayTarget > 0.5 ? 0 : 1; P.day = P.dayTarget; P.energy = 1; P.hunger = Math.max(0.2, P.hunger - 0.2); A.refillDishes && A.refillDishes(); itemsGroup.children.forEach(g => g.userData.refill && g.userData.refill()); toast(P.dayTarget > 0.5 ? '☀️ Good morning! You feel rested.' : '🌙 You napped until evening.'); completeTask('sleep'); });
  },
  eat(a = 0.5) { P.hunger = Math.min(1, P.hunger + a); },
  drink(kind) { P.energy = Math.min(1, P.energy + 0.35); if (kind === 'coffee') { P.caffeine = 60; toast('☕ Caffeine boost! You move faster for a minute.'); } else toast('🍵 Warm and soothing.'); Sfx.noise(0.5, 0.1, 700, 2); },
  water(g) { toast('💧 Watered. The plant looks happier.'); Sfx.noise(0.8, 0.12, 1500, 0.8); completeTask('plants'); g.userData.wiggle = 1; },
  waterAhead() { const r = hover && hover.root; if (r && /plant|flowers|tray/.test(r.userData.item.t)) ctx.water(r); else toast('Aim at a plant to water it.'); },
  stretch() { P.energy = Math.min(1, P.energy + 0.15); },
  laundry(n) { A.laundry.load += n; },
};
const uid = () => Math.random().toString(36).slice(2, 9);

// ---- build apartment ----
const A = buildApartment(scene, ctx);
lightCount += 0; lightCount = Object.values(A.lights).reduce((s, L) => s + L.lights.length, 0);
A.world.add(itemsGroup);

// ---- items ----
function itemBox(g) {
  const def = CATALOG[g.userData.item.t]; if (!def.solid || def.mount !== 'floor') { g.userData.box = null; return; }
  g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g); if (b.max.y < 0.3) { g.userData.box = null; return; }
  b.expandByVector(V3(-0.03, 0, -0.03)); g.userData.box = b;
}
function spawnItem(inst) {
  const def = CATALOG[inst.t]; if (!def) return null;
  let g; try { g = def.build(ctx, inst); } catch (e) { console.error('build failed', inst.t, e); return null; }
  g.userData.item = inst; g.position.set(inst.x, inst.y, inst.z); g.rotation.y = inst.r || 0;
  itemsGroup.add(g); itemBox(g); return g;
}
function removeItem(g) {
  const set = new Set(); g.traverse(o => set.add(o));
  CLEANUPS = CLEANUPS.filter(c => { if (set.has(c.owner)) { try { c.fn(); } catch (e) { } return false; } return true; });
  TICKS = TICKS.filter(t => !set.has(t.owner));
  g.parent && g.parent.remove(g);
  if (held === g) { held = null; heldSet.clear(); }
}
function clearItems() { [...itemsGroup.children].forEach(removeItem); }
function serialize() {
  const items = itemsGroup.children.filter(g => g !== held || heldInfo && heldInfo.prev).map(g => { const i = g.userData.item; const o = { t: i.t, x: +i.x.toFixed(3), y: +i.y.toFixed(3), z: +i.z.toFixed(3), r: +(i.r || 0).toFixed(3) }; if (i.c) o.c = i.c; if (i.d && Object.keys(i.d).length) o.d = i.d; return o; });
  const rooms = {}; for (const k in ROOMS) if (!ROOMS[k].fixed) rooms[k] = { wall: '#' + A.wallMats[k].color.getHexString(), floor: roomStyle[k] && roomStyle[k].floor || ROOMS[k].floor };
  return { v: 1, items, rooms };
}
const roomStyle = {};
function loadLayout(data) {
  if (held) { removeItem(held); held = null; }
  clearItems();
  (data.items || []).forEach(i => spawnItem({ id: uid(), ...i, d: i.d ? JSON.parse(JSON.stringify(i.d)) : {} }));
  for (const k in ROOMS) {
    if (ROOMS[k].fixed) continue; const r = (data.rooms || {})[k] || {};
    A.setWall(k, r.wall || ROOMS[k].wall); roomStyle[k] = { floor: r.floor || ROOMS[k].floor }; A.setFloor(k, roomStyle[k].floor);
  }
}
let saveTimer = 0; function saveCurrentSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set('current', serialize()), 400); }
function pushUndo() { undoStack.push(JSON.stringify(serialize())); if (undoStack.length > 60) undoStack.shift(); }
function undo() { const s = undoStack.pop(); if (!s) return toast('Nothing to undo.'); loadLayout(JSON.parse(s)); saveCurrentSoon(); toast('↶ Undone'); }

// ---- default layout: my apartment as filmed ----
const PI = Math.PI, HP = Math.PI / 2;
const DEFAULT_LAYOUT = {
  v: 2, items: [
    // living room: sofa on the half wall, TV on the east wall, tree by the sofa, bistro set top right
    ['sofa', 4.65, 0, 3.55, HP], ['art_wedding', 4.165, 1.62, 2.8, HP, null, { seed: 11 }], ['art_wedding', 4.165, 1.62, 3.55, HP, null, { seed: 12 }], ['art_wedding', 4.165, 1.62, 4.3, HP, null, { seed: 13 }],
    ['picture_light', 4.165, 2.17, 2.8, HP], ['picture_light', 4.165, 2.17, 3.55, HP], ['picture_light', 4.165, 2.17, 4.3, HP],
    ['xmas_tree', 4.55, 0, 2.0, 0], ['present', 5.05, 0, 1.75, 0.3], ['present', 5.2, 0, 2.2, -0.2, '#2e5a3a'],
    ['rug_vintage', 5.85, 0, 3.6, HP], ['coffee_marble', 5.75, 0, 3.6, HP], ['tray_trees', 5.75, 0.485, 3.32, 0], ['albums', 5.75, 0.485, 3.8, 0.5],
    ['media_console', 7.32, 0, 3.85, -HP], ['tv', 7.535, 1.55, 3.85, -HP], ['speaker', 7.32, 0.63, 3.2, -HP], ['mini_tree', 7.32, 0.63, 4.5, 0], ['basket', 4.45, 0, 5.0, 0],
    ['bistro_table', 6.95, 0, 1.95, 0], ['armchair', 6.2, 0, 2.0, HP], ['armchair', 6.9, 0, 2.62, PI], ['candle', 6.88, 0.735, 1.88, 0], ['mini_tree', 7.05, 0.735, 2.02, 0], ['wine', 6.83, 0.735, 2.08, 0],
    ['clothes_pile', 6.4, 0, 4.9, 0.6],
    // coffee bar by the entry
    ['sideboard', 7.38, 0, 5.75, -HP], ['espresso', 7.37, 0.88, 5.4, -HP], ['mug', 7.35, 0.88, 5.95, 0, '#2e3a46'], ['mug', 7.4, 0.88, 6.1, 0.5], ['plant_small', 7.38, 0.88, 6.3, 0],
    ['wreath', 7.535, 2.4, 7.5, -HP], ['art_landscape', 7.535, 1.75, 1.75, -HP], ['art_garden', 7.535, 1.35, 1.95, -HP], ['art_bridge', 7.535, 1.85, 2.4, -HP],
    // kitchen (range on the south wall, island in the middle)
    ['barstool', 4.35, 0, 6.05, 0], ['barstool', 5.0, 0, 6.05, 0], ['barstool', 5.65, 0, 6.05, 0],
    ['flowers', 4.3, 0.935, 6.7, 0], ['tray_plant', 5.65, 0.935, 6.75, 0], ['bread', 5.92, 0.935, 7.1, 0.4], ['mug', 4.15, 0.935, 7.05, 0.8, '#a35d5d'],
    ['canisters', 2.3, 0.935, 9.7, PI], ['knife_block', 2.85, 0.935, 9.72, PI], ['toaster', 3.22, 0.935, 9.65, PI], ['pan', 4.10, 0.935, 9.44, PI], ['kettle', 3.74, 0.935, 9.74, PI],
    ['lamp_table', 4.62, 0.935, 9.7, 0, null, { on: true }], ['stand_mixer', 5.1, 0.935, 9.62, PI], ['fruit_bowl', 2.22, 0.935, 8.9, 0], ['plant_small', 2.22, 0.935, 8.05, 0],
    // bedroom
    ['bed', 1.14, 0, 1.9, HP], ['nightstand', 0.27, 0, 0.6, HP], ['nightstand', 0.27, 0, 3.0, HP], ['lamp_table', 0.27, 0.63, 0.6, 0, null, { on: true }], ['lamp_table', 0.27, 0.63, 3.0, 0],
    ['art_monet', 0.06, 1.75, 1.9, HP], ['arched_cabinet', 3.56, 0, 0.27, 0], ['dresser', 3.8, 0, 2.3, -HP],
    ['art_photo', 4.04, 1.45, 1.85, -HP, null, { seed: 21 }], ['art_photo', 4.04, 1.45, 2.3, -HP, null, { seed: 22 }], ['art_photo', 4.04, 1.45, 2.75, -HP, null, { seed: 23 }],
    ['art_photo', 4.04, 1.9, 1.85, -HP, null, { seed: 24 }], ['art_photo', 4.04, 1.9, 2.3, -HP, null, { seed: 25 }], ['art_photo', 4.04, 1.9, 2.75, -HP, null, { seed: 26 }],
    ['record_player', 3.8, 0.83, 1.85, -HP], ['books', 3.8, 0.83, 2.8, 0.2], ['ironing', 2.45, 0, 0.95, 0],
    ['clothes_pile', 2.75, 0, 1.4, 0.4], ['clothes_pile', 2.5, 0, 2.95, 1.2],
    // bath, closet, balcony, corridor
    ['hair_dryer', 0.35, 0.9, 4.1, HP], ['candle', 0.32, 0.9, 5.3, 0], ['hamper', 1.45, 0, 6.95, 0],
    ['storage_bin', 4.6, 0, 0.45, 0], ['pumpkin', 7.2, 0, 0.6, 0], ['pumpkin', 7.85, 0, 6.9, 0.5],
  ].map(([t, x, y, z, r, c, d]) => { const o = { t, x, y, z, r }; if (c) o.c = c; if (d) o.d = d; return o; }),
  rooms: {}
};

// ---- player & collisions ----
function blocked(x, z, feet) {
  const r = 0.22, y0 = feet + 0.3, y1 = feet + (P.crouch ? 1.1 : 1.75);
  for (const c of STATIC) { const b = c.box; if (b.isEmpty()) continue; if (b.max.y > y0 && b.min.y < y1 && x + r > b.min.x && x - r < b.max.x && z + r > b.min.z && z - r < b.max.z) return true; }
  for (const g of itemsGroup.children) { const b = g.userData.box; if (!b || g === held) continue; if (b.max.y > y0 && b.min.y < y1 && x + r > b.min.x && x - r < b.max.x && z + r > b.min.z && z - r < b.max.z) return true; }
  return false;
}
const keys = {}; const joy = { x: 0, y: 0 };
function updatePlayer(dt) {
  let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
  let mz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + joy.y;
  const anyMove = Math.abs(mx) + Math.abs(mz) > 0.15 || keys.Space;
  if (P.sit) {
    if (anyMove && !uiOpen()) { P.pos.copy(P.sit.prev); P.sit = null; P.pitch = 0; } else {
      camera.position.set(P.sit.pos.x, P.sit.pos.y + (P.sit.lie ? 0.3 : 0.72), P.sit.pos.z);
      camera.rotation.set(P.pitch, P.yaw, 0); return;
    }
  }
  if (uiOpen()) { mx = mz = 0; }
  const len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; }
  const crouch = keys.ControlLeft || keys.KeyC && !buildMode || P.crouchToggle; P.crouch = !!crouch;
  let speed = (keys.ShiftLeft || keys.ShiftRight ? 4.3 : 2.5) * (P.crouch ? 0.5 : 1) * (P.caffeine > 0 ? 1.35 : 1);
  const s = Math.sin(P.yaw), c = Math.cos(P.yaw);
  const vx = (mx * c + mz * s) * speed * dt, vz = (-mx * s + mz * c) * speed * dt;
  const feet = P.pos.y;
  if (!blocked(P.pos.x + vx, P.pos.z, feet)) P.pos.x += vx;
  if (!blocked(P.pos.x, P.pos.z + vz, feet)) P.pos.z += vz;
  // gravity / jump
  P.vy -= 9.8 * dt; P.pos.y += P.vy * dt; if (P.pos.y <= 0) { P.pos.y = 0; P.vy = 0; if (keys.Space && !uiOpen()) P.vy = 3.6; }
  if (len > 0.1 && P.pos.y === 0) P.bob += dt * speed * 3.2;
  P.eye = lerp(P.eye, P.crouch ? 1.05 : 1.62, dt * 10);
  camera.position.set(P.pos.x, P.pos.y + P.eye + Math.sin(P.bob) * 0.025, P.pos.z);
  camera.rotation.set(P.pitch, P.yaw, 0);
  if (P.pos.z < 1.4 && P.pos.x > 4.1 && P.pos.x < 7.6) completeTask('outside');
}

// ---- input ----
let skipMoves = 0, locked = false, dragging = false, dragDist = 0, lastMouse = null; const mouseNDC = new THREE.Vector2(0, 0); let mouseInCanvas = false;
const uiOpen = () => !$('#menu').hidden || !$('#panel').hidden || !$('#start').hidden || !$('#tasks').hidden;
canvas.addEventListener('mousedown', (e) => {
  Sfx.init();
  if (e.button === 2) { if (held) cancelHold(); return; }
  if (locked) { primary(); return; }
  dragging = true; dragDist = 0; lastMouse = [e.clientX, e.clientY];
});
addEventListener('mouseup', (e) => {
  if (!dragging) return; dragging = false;
  if (dragDist < 6 && e.target === canvas) {
    if (!isTouch && !buildMode && !held && settings.lockOnClick !== false) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { settings.lockOnClick = false; primary(); }); } catch (err) { primary(); } if (!hover) return; }
    primary();
  }
});
addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect(); mouseNDC.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1); mouseInCanvas = e.target === canvas;
  if (locked) { if (skipMoves > 0) { skipMoves--; return; } if (Math.abs(e.movementX) + Math.abs(e.movementY) > 300) return; look(e.movementX, e.movementY); }
  else if (dragging && lastMouse) { const dx = e.clientX - lastMouse[0], dy = e.clientY - lastMouse[1]; dragDist += Math.abs(dx) + Math.abs(dy); look(dx * 1.2, dy * 1.2); lastMouse = [e.clientX, e.clientY]; }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', (e) => { if (held) { held.userData.item.r = (held.userData.item.r || 0) + Math.sign(e.deltaY) * (settings.snap ? PI / 12 : 0.05); } }, { passive: true });
function look(dx, dy) { const k = 0.0022 * settings.sens; P.yaw -= dx * k; P.pitch = clamp(P.pitch - dy * k * (settings.invert ? -1 : 1), -1.45, 1.45); }
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas; document.body.classList.toggle('locked', locked); skipMoves = 2;
  if (!locked && !uiOpen() && !suppressMenu && $('#start').hidden) openMenu();
  suppressMenu = false;
});
let suppressMenu = false;
function unlock() { if (locked) { suppressMenu = true; document.exitPointerLock(); } }
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  Sfx.init();
  keys[e.code] = true;
  if (e.code === 'Tab') { e.preventDefault(); if (!buildMode) setBuild(true); togglePanel(); return; }
  if (e.code === 'Escape') { if (held) { cancelHold(); return; } if (!$('#panel').hidden) { closePanel(); return; } if (!$('#tasks').hidden) { $('#tasks').hidden = true; return; } if (!$('#menu').hidden) { closeMenu(); return; } if (!locked && $('#start').hidden) openMenu(); return; }
  if (uiOpen()) return;
  if (e.code === 'KeyE') primary();
  if (e.code === 'KeyG') grab();
  if (e.code === 'KeyF') useHeld();
  if (e.code === 'KeyB') setBuild(!buildMode);
  if (e.code === 'KeyN') { P.dayTarget = P.dayTarget > 0.5 ? 0 : 1; toast(P.dayTarget ? '☀️ Daytime' : '🌙 Nighttime'); }
  if (e.code === 'KeyL') { const r = roomAt(P.pos.x, P.pos.z); const key = r === 'living' ? (P.pos.z > 5.6 ? 'kitchen' : 'living') : r; if (A.lights[key]) { A.lights[key].on = !A.lights[key].on; Sfx.click(); completeTask('lights'); } }
  if (e.code === 'KeyM') { settings.muted = !settings.muted; Sfx.setMuted(settings.muted); store.set('settings', settings); toast(settings.muted ? '🔇 Muted' : '🔊 Sound on'); }
  if (e.code === 'KeyT') { renderTasks(); $('#tasks').hidden = false; unlock(); }
  if (e.code === 'KeyR') rotateTarget(e.shiftKey ? HP : PI / 12);
  if (e.code === 'KeyQ') rotateTarget(e.shiftKey ? -HP : -PI / 12);
  if (e.code === 'KeyX' || e.code === 'Delete' || e.code === 'Backspace') deleteTarget();
  if (e.code === 'KeyC' && buildMode) duplicateTarget();
  if (e.code === 'KeyV') recolorTarget();
  if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey || buildMode)) undo();
  if (e.code === 'KeyH') openMenu('help');
  if (e.code === 'KeyP') { if (buildMode) { settings.snap = !settings.snap; store.set('settings', settings); toast('Grid snap ' + (settings.snap ? 'on' : 'off')); } }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// ---- raycasting & hover ----
const ray = new THREE.Raycaster();
function aimRay() { ray.setFromCamera(locked || isTouch || !mouseInCanvas ? new THREE.Vector2(0, 0) : mouseNDC, camera); }
function hitList(maxDist, opts = {}) {
  aimRay(); ray.far = maxDist;
  const out = [];
  for (const h of ray.intersectObject(A.world, true)) {
    const o = h.object; if (o.isPoints || o.userData.noRay || heldSet.has(o)) continue;
    let vis = true, p = o; while (p) { if (!p.visible) { vis = false; break; } p = p.parent; } if (!vis) continue;
    const ghost = o.material && (o.material.visible === false || (o.material.transparent && o.material.opacity < 0.35));
    if (ghost && (opts.solidOnly || !findIntDeep(o))) continue;
    out.push(h);
  }
  return out;
}
function firstHit(maxDist, opts) { return hitList(maxDist, opts)[0] || null; }
function findInt(o) { while (o) { if (o.userData.int) return o; if (o.userData.item) return null; o = o.parent; } return null; }
function findIntDeep(o) { while (o) { if (o.userData.int) return o; o = o.parent; } return null; }
function updateHover() {
  hover = null; buildHover = null;
  const hits = hitList(buildMode ? 14 : 9);
  const h = hits[0]; if (!h) return;
  const root = ctx.rootOf(h.object);
  if (buildMode) { if (root) buildHover = root; return; }
  // prefer an interactive part touching the first surface (buttons on panels, dishes in sinks)
  let pick = h, io = findIntDeep(h.object);
  for (const k of hits) { if (k.distance > h.distance + 0.06) break; const ki = findIntDeep(k.object); if (ki && (!io || ki !== io && k.object.userData.int)) { pick = k; io = ki; break; } }
  const reach = io && io.userData.int.reach || 2.6;
  if (pick.distance > reach) io = null;
  if (!io && h.distance > 2.6) return;
  hover = { obj: io, int: io && io.userData.int, root: ctx.rootOf(pick.object), point: pick.point };
}
// ---- holding / placement ----
const helper = new THREE.Box3Helper(new THREE.Box3(), 0x6fe08a); helper.visible = false; scene.add(helper);
const hoverHelper = new THREE.Box3Helper(new THREE.Box3(), 0xffd27a); hoverHelper.visible = false; scene.add(hoverHelper);
let placeValid = false;
function startHold(g, isNew = false) {
  if (!g) return;
  if (!isNew) pushUndo();
  held = g; heldSet.clear(); g.traverse(o => heldSet.add(o));
  const i = g.userData.item; heldInfo = { prev: isNew ? null : { x: i.x, y: i.y, z: i.z, r: i.r }, isNew };
  if (!locked && !isTouch) { /* follow cursor */ }
}
function cancelHold() {
  if (!held) return; const g = held, info = heldInfo; held = null; heldSet.clear();
  if (info && info.prev) { Object.assign(g.userData.item, info.prev); g.position.set(info.prev.x, info.prev.y, info.prev.z); g.rotation.y = info.prev.r; itemBox(g); undoStack.pop(); }
  else removeItem(g);
  helper.visible = false;
}
function updateHeld() {
  if (!held) { helper.visible = false; return; }
  const inst = held.userData.item, def = CATALOG[inst.t];
  const h = firstHit(buildMode ? 14 : 3.5, { solidOnly: true });
  let pos = null, rot = inst.r || 0; placeValid = false;
  if (h) {
    const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : V3(0, 1, 0);
    if (def.mount === 'wall') { if (Math.abs(n.y) < 0.35) { pos = h.point.clone().addScaledVector(n, 0.004); rot = Math.atan2(n.x, n.z); placeValid = true; } }
    else if (def.mount === 'floor') {
      const t = -ray.ray.origin.y / ray.ray.direction.y;
      if (ray.ray.direction.y < -0.02 && t > 0 && t <= h.distance + 0.05) { pos = ray.ray.origin.clone().addScaledVector(ray.ray.direction, t); placeValid = true; }
      else if (n.y < 0.5) { pos = h.point.clone().addScaledVector(n, 0.35); pos.y = 0; placeValid = true; }
      else if (h.point.y < 0.05) { pos = h.point.clone(); pos.y = 0; placeValid = true; }
    } else if (n.y > 0.6) { pos = h.point.clone(); placeValid = true; }
  }
  if (!pos) { pos = camera.position.clone().addScaledVector(ray.ray.direction, 1.3); pos.y = Math.max(0, pos.y - 0.2); }
  if (settings.snap && buildMode && placeValid && def.mount !== 'wall') { pos.x = Math.round(pos.x * 20) / 20; pos.z = Math.round(pos.z * 20) / 20; }
  if (def.mount === 'wall') inst.r = rot;
  held.position.copy(pos); held.rotation.y = inst.r || 0;
  inst.x = pos.x; inst.y = pos.y; inst.z = pos.z;
  held.updateMatrixWorld(true);
  helper.box.setFromObject(held); helper.material.color.set(placeValid ? 0x6fe08a : 0xff6a5a); helper.visible = true;
}
function placeHeld() {
  if (!held) return;
  if (!placeValid) { toast(CATALOG[held.userData.item.t].mount === 'wall' ? 'Aim at a wall to hang this.' : 'Aim at the floor or a surface.'); return; }
  const g = held, info = heldInfo; held = null; heldSet.clear(); helper.visible = false; itemBox(g);
  if (info && info.isNew && info.snapshot) undoStack.push(info.snapshot);
  Sfx.noise(0.12, 0.25, 400, 1, 'lowpass');
  if (buildMode) completeTask('decorate');
  saveCurrentSoon();
}
function primary() {
  Sfx.init();
  if (held) return placeHeld();
  if (buildMode) { if (buildHover) { startHold(buildHover); Sfx.click(); } return; }
  if (hover && hover.int) { const d = hover.int; try { d.action && d.action(); } catch (e) { console.error(e); } return; }
}
function grab() {
  if (held) return placeHeld();
  const r = buildMode ? buildHover : hover && hover.root;
  if (!r) return;
  const def = CATALOG[r.userData.item.t];
  if (!buildMode && !def.small) return toast('That\'s too big to carry — use Build mode (B) to move furniture.');
  startHold(r); Sfx.click();
}
function useHeld() {
  if (!held) return;
  const inst = held.userData.item; if (!inst.use) return toast('Nothing to do with this — click to set it down.');
  const r = inst.use(); if (r === 'consume') { const g = held; held = null; heldSet.clear(); helper.visible = false; removeItem(g); saveCurrentSoon(); }
}
function targetItem() { return held || (buildMode ? buildHover : null); }
function rotateTarget(a) { const g = targetItem(); if (!g) return; const i = g.userData.item; if (CATALOG[i.t].mount === 'wall') return; if (g !== held) pushUndo(); i.r = (i.r || 0) + a; g.rotation.y = i.r; if (g !== held) { itemBox(g); saveCurrentSoon(); } }
function deleteTarget() {
  const g = targetItem(); if (!g) return;
  if (g === held && heldInfo && heldInfo.isNew) { cancelHold(); return; }
  if (g !== held) pushUndo();
  if (g === held) { held = null; heldSet.clear(); helper.visible = false; }
  removeItem(g); Sfx.noise(0.2, 0.2, 300, 1); toast('🗑 Removed ' + CATALOG[g.userData.item.t].name.toLowerCase() + ' (Z to undo)'); saveCurrentSoon();
}
function duplicateTarget() { const g = targetItem(); if (!g) return; const i = g.userData.item; const inst = { ...JSON.parse(JSON.stringify(i)), id: uid() }; const n = spawnItem(inst); if (held) placeHeld(); startHold(n, true); }
function recolorTarget(color) {
  const g = targetItem() || (hover && hover.root); if (!g) return; const i = g.userData.item, def = CATALOG[i.t];
  if (!def.colorable) return toast('This item has a fixed finish.');
  pushUndo(); const idx = PALETTE.indexOf(i.c || def.color); i.c = color || PALETTE[(idx + 1) % PALETTE.length];
  const wasHeld = g === held; removeItem(g); const n = spawnItem(i); if (wasHeld) { held = n; heldSet.clear(); n.traverse(o => heldSet.add(o)); }
  saveCurrentSoon();
}

// ---- tasks & stats ----
const TASKS = [
  ['coffee', 'Brew an espresso at the coffee bar'], ['cook', 'Cook something on the stove'], ['bake', 'Bake cookies in the oven'], ['tea', 'Boil the kettle for tea'], ['microwave', 'Heat leftovers in the microwave'],
  ['eat', 'Eat something'], ['dishes', 'Do the dishes'], ['tidy', 'Pick up a pile of clothes'], ['laundry', 'Wash, dry & fold laundry'], ['iron', 'Iron a shirt'],
  ['tv', 'Watch TV'], ['music', 'Put on some music'], ['tree', 'Switch the tree lights'], ['gift', 'Open a present'], ['plants', 'Water a plant'],
  ['outside', 'Step out onto the balcony'], ['shower', 'Take a shower'], ['flush', 'Flush the toilet'], ['hands', 'Wash your hands'], ['outfit', 'Pick an outfit in the closet'],
  ['sleep', 'Sleep in your bed'], ['lights', 'Flip a light switch'], ['breaker', 'Flip the main breaker'], ['computer', 'Use the computer'], ['read', 'Read a book'],
  ['decorate', 'Move or add furniture in Build mode'], ['paint', 'Repaint a room or change a floor'], ['save', 'Save a decoration layout'],
];
const done = new Set(store.get('tasks', []));
function completeTask(id) { if (done.has(id)) return; done.add(id); store.set('tasks', [...done]); const t = TASKS.find(t => t[0] === id); if (t) { toast('✅ ' + t[1] + '  (' + done.size + '/' + TASKS.length + ')', 'task'); Sfx.chime(); } updateHud(); }
function renderTasks() {
  $('#taskList').innerHTML = TASKS.map(([id, label]) => `<li class="${done.has(id) ? 'done' : ''}"><span class="box">${done.has(id) ? '✓' : ''}</span>${label}</li>`).join('');
  $('#taskCount').textContent = done.size + ' / ' + TASKS.length;
}

// ---- toast / fade ----
let toastTimer = 0;
function toast(t, kind) { const el = $('#toast'); el.textContent = t; el.className = 'glass show ' + (kind || ''); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.className = 'glass', 3200); }
function fade(mid) { const f = $('#fade'); f.classList.add('on'); setTimeout(() => { mid(); setTimeout(() => f.classList.remove('on'), 400); }, 1100); }

// ---- build mode ----
function setBuild(on) {
  if (held && !on) placeValid ? placeHeld() : cancelHold();
  buildMode = on; document.body.classList.toggle('build', on);
  $('#modeChip').textContent = on ? 'BUILD' : 'EXPLORE';
  if (on) { toast('🛠 Build mode — click furniture to move it, Tab for the catalog'); if (P.sit) { P.pos.copy(P.sit.prev); P.sit = null; } }
  else { closePanel(); hoverHelper.visible = false; }
}
function togglePanel(tab) { if ($('#panel').hidden || tab) openPanel(tab); else closePanel(); }
function openPanel(tab) { $('#panel').hidden = false; unlock(); if (tab) showTab(tab); else showTab(currentTab); renderRoomTab(); if (currentTab === 'items') renderCatalog(); }
function closePanel() { $('#panel').hidden = true; }
let currentTab = 'items', currentCat = 'Seating';
function showTab(t) { currentTab = t; document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); document.querySelectorAll('.tab').forEach(el => el.hidden = el.id !== 'tab-' + t); if (t === 'items') renderCatalog(); if (t === 'room') renderRoomTab(); if (t === 'layouts') renderLayouts(); }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));
function renderCatalog() {
  $('#cats').innerHTML = CATS.map(c => `<button class="chip ${c === currentCat ? 'on' : ''}" data-cat="${c}">${c}</button>`).join('');
  $('#cats').querySelectorAll('button').forEach(b => b.onclick = () => { currentCat = b.dataset.cat; renderCatalog(); });
  const list = Object.values(CATALOG).filter(d => d.cat === currentCat && !d.hidden);
  $('#grid').innerHTML = list.map(d => `<button class="card" data-id="${d.id}"><img alt="" src="${thumbs[d.id] || ''}" data-thumb="${d.id}"><span>${d.name}</span></button>`).join('');
  $('#grid').querySelectorAll('.card').forEach(b => b.onclick = () => addFromCatalog(b.dataset.id));
  queueThumbs(list.map(d => d.id));
}
function addFromCatalog(id) {
  if (held) cancelHold();
  pushUndo(); const snap = undoStack.pop();
  const def = CATALOG[id]; const inst = { id: uid(), t: id, x: P.pos.x, y: 0, z: P.pos.z, r: P.yaw + PI, d: {} };
  const g = spawnItem(inst); startHold(g, true); heldInfo.snapshot = snap;
  closePanel(); toast('Placing ' + def.name + ' — click to set it down, R/Q to rotate, right-click to cancel');
  if (!isTouch) { try { const p = canvas.requestPointerLock(); p && p.catch && p.catch(() => { }); } catch (e) { } }
}
const WALL_SWATCHES = ['#e7e3dc', '#f4f2ee', '#dcd7e8', '#d7e3dd', '#e8dccd', '#f1e3d3', '#cfd8e3', '#c9b8a6', '#a9b6a0', '#8a9aa0', '#5b6b73', '#3d4a4f', '#b36a4f', '#e6c38a', '#d9a7a7', '#2e3a46'];
function renderRoomTab() {
  const r = roomAt(P.pos.x, P.pos.z); const sel = $('#roomSel');
  const editable = Object.keys(ROOMS).filter(k => !ROOMS[k].fixed);
  sel.innerHTML = editable.map(k => `<option value="${k}" ${k === (editable.includes(r) ? r : 'living') ? 'selected' : ''}>${ROOMS[k].name}</option>`).join('');
  const draw = () => {
    const k = sel.value;
    $('#swatches').innerHTML = WALL_SWATCHES.map(c => `<button class="sw" style="background:${c}" data-c="${c}" aria-label="Wall color ${c}"></button>`).join('');
    $('#swatches').querySelectorAll('.sw').forEach(b => b.onclick = () => { pushUndo(); A.setWall(k, b.dataset.c); $('#wallColor').value = b.dataset.c; completeTask('paint'); saveCurrentSoon(); });
    $('#wallColor').value = '#' + A.wallMats[k].color.getHexString();
    $('#floors').innerHTML = Object.entries(FLOOR_STYLES).map(([id, f]) => `<button class="chip ${roomStyle[k] && roomStyle[k].floor === id ? 'on' : ''}" data-f="${id}">${f.name}</button>`).join('');
    $('#floors').querySelectorAll('button').forEach(b => b.onclick = () => { pushUndo(); roomStyle[k] = { floor: b.dataset.f }; A.setFloor(k, b.dataset.f); completeTask('paint'); saveCurrentSoon(); draw(); });
  };
  sel.onchange = draw; $('#wallColor').oninput = (e) => { A.setWall(sel.value, e.target.value); }; $('#wallColor').onchange = () => { completeTask('paint'); saveCurrentSoon(); };
  draw();
}
function renderLayouts() {
  const L = store.get('layouts', {});
  const names = Object.keys(L).sort((a, b) => L[b].date - L[a].date);
  $('#layoutList').innerHTML = names.length ? names.map(n => `<li><div><strong>${esc(n)}</strong><small>${new Date(L[n].date).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${L[n].data.items.length} items</small></div><span><button data-load="${esc(n)}">Load</button><button data-over="${esc(n)}" class="ghost">Overwrite</button><button data-del="${esc(n)}" class="ghost danger">Delete</button></span></li>`).join('') : '<li class="empty">No saved layouts yet. Name your current design above and save it.</li>';
  $('#layoutList').querySelectorAll('[data-load]').forEach(b => b.onclick = () => { pushUndo(); loadLayout(L[b.dataset.load].data); saveCurrentSoon(); toast('Loaded "' + b.dataset.load + '"'); });
  $('#layoutList').querySelectorAll('[data-over]').forEach(b => b.onclick = () => { L[b.dataset.over] = { date: Date.now(), data: serialize() }; store.set('layouts', L); renderLayouts(); toast('Saved over "' + b.dataset.over + '"'); });
  $('#layoutList').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { if (b.dataset.armed) { delete L[b.dataset.del]; store.set('layouts', L); renderLayouts(); } else { b.dataset.armed = 1; b.textContent = 'Confirm'; } });
}
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
$('#saveLayout').onclick = () => {
  const name = $('#layoutName').value.trim() || 'Layout ' + new Date().toLocaleDateString(); const L = store.get('layouts', {});
  L[name] = { date: Date.now(), data: serialize() }; store.set('layouts', L); $('#layoutName').value = ''; renderLayouts(); toast('💾 Saved "' + name + '"'); completeTask('save');
};
$('#resetLayout').onclick = (e) => { const b = e.currentTarget; if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Click again to reset'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Reset to my real apartment'; }, 3000); return; } pushUndo(); loadLayout(DEFAULT_LAYOUT); saveCurrentSoon(); b.dataset.armed = ''; b.textContent = 'Reset to my real apartment'; toast('Apartment restored to how it was filmed.'); };
$('#emptyLayout').onclick = (e) => { const b = e.currentTarget; if (!b.dataset.armed) { b.dataset.armed = 1; b.textContent = 'Click again to empty'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Start from an empty apartment'; }, 3000); return; } pushUndo(); loadLayout({ items: [], rooms: serialize().rooms }); saveCurrentSoon(); b.dataset.armed = ''; b.textContent = 'Start from an empty apartment'; toast('Blank canvas! Open the catalog to furnish it.'); };
$('#exportLayout').onclick = () => { const txt = JSON.stringify(serialize()); $('#io').value = txt; $('#io').select(); try { navigator.clipboard.writeText(txt).then(() => toast('Layout code copied to clipboard'), () => toast('Select the text and copy it')); } catch (e) { toast('Select the text and copy it'); } };
$('#importLayout').onclick = () => { try { const d = JSON.parse($('#io').value); if (!d.items) throw 0; pushUndo(); loadLayout(d); saveCurrentSoon(); toast('Layout imported!'); } catch (e) { toast('That doesn\'t look like layout code. Paste a code exported from this game.'); } };

// ---- thumbnails (rendered offscreen) ----
const thumbs = {}; let thumbR = null, thumbQ = [], thumbBusy = false;
const dummyCtx = new Proxy({ light: () => ({ intensity: 0 }), power: () => true, isNight: () => false, rootOf: () => null, heatAt: () => null }, { get: (t, p) => p in t ? t[p] : () => { } });
function queueThumbs(ids) { ids.forEach(id => { if (!thumbs[id] && !thumbQ.includes(id)) thumbQ.push(id); }); if (!thumbBusy) setTimeout(thumbStep, 30); }
function thumbStep() {
  const id = thumbQ.shift(); if (!id) { thumbBusy = false; return; } thumbBusy = true;
  try {
    if (!thumbR) { thumbR = { r: new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }), s: new THREE.Scene(), c: new THREE.PerspectiveCamera(30, 1, 0.01, 50) }; thumbR.r.setSize(160, 160); thumbR.r.toneMapping = THREE.ACESFilmicToneMapping; thumbR.s.add(new THREE.HemisphereLight(0xffffff, 0x887766, 2.2)); const d = new THREE.DirectionalLight(0xffffff, 2); d.position.set(2, 3, 4); thumbR.s.add(d); thumbR.s.environment = scene.environment; }
    const def = CATALOG[id]; const g = def.build(dummyCtx, { t: id, d: {} }); thumbR.s.add(g);
    const b = new THREE.Box3().setFromObject(g), c = b.getCenter(V3()), sz = b.getSize(V3()); const r = Math.max(sz.x, sz.y, sz.z) * 0.62 + 0.01;
    const dir = def.mount === 'wall' ? V3(0.35, 0.15, 1) : V3(0.8, 0.65, 1); dir.normalize();
    thumbR.c.position.copy(c).addScaledVector(dir, r / Math.tan(15 * PI / 180)); thumbR.c.lookAt(c); thumbR.c.near = 0.01; thumbR.c.far = 100; thumbR.c.updateProjectionMatrix();
    thumbR.r.render(thumbR.s, thumbR.c); thumbs[id] = thumbR.r.domElement.toDataURL(); thumbR.s.remove(g);
    const img = document.querySelector(`img[data-thumb="${id}"]`); if (img) img.src = thumbs[id];
  } catch (e) { console.warn('thumb', id, e); }
  setTimeout(thumbStep, 16);
}

// ---- menu ----
function openMenu(section) { $('#menu').hidden = false; unlock(); document.querySelectorAll('.msec').forEach(s => s.hidden = section ? s.dataset.sec !== section : s.dataset.sec !== 'main'); }
function closeMenu() { $('#menu').hidden = true; }
$('#resume').onclick = () => { closeMenu(); if (!isTouch) { try { const p = canvas.requestPointerLock(); p && p.catch && p.catch(() => { }); } catch (e) { } } };
document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openMenu(b.dataset.open));
$('#mBuild').onclick = () => { closeMenu(); setBuild(!buildMode); };
$('#mLayouts').onclick = () => { closeMenu(); if (!buildMode) setBuild(true); openPanel('layouts'); };
$('#mTasks').onclick = () => { closeMenu(); renderTasks(); $('#tasks').hidden = false; };
$('#taskChip').onclick = () => { renderTasks(); $('#tasks').hidden = false; unlock(); };
$('#closeTasks').onclick = () => { $('#tasks').hidden = true; };
$('#closePanel').onclick = closePanel;
$('#sens').value = settings.sens; $('#sens').oninput = (e) => { settings.sens = +e.target.value; store.set('settings', settings); };
$('#invert').checked = settings.invert; $('#invert').onchange = (e) => { settings.invert = e.target.checked; store.set('settings', settings); };
$('#quality').value = settings.quality; $('#quality').onchange = (e) => { settings.quality = e.target.value; applyQuality(); resize(); store.set('settings', settings); };
$('#mute').checked = settings.muted; $('#mute').onchange = (e) => { settings.muted = e.target.checked; Sfx.setMuted(settings.muted); store.set('settings', settings); };
$('#resetTasks').onclick = () => { done.clear(); store.set('tasks', []); renderTasks(); updateHud(); };

// ---- start ----
$('#enter').onclick = () => {
  Sfx.init(); Sfx.setMuted(settings.muted); $('#start').hidden = true;
  if (!isTouch) { try { const p = canvas.requestPointerLock(); p && p.catch && p.catch(() => { }); } catch (e) { } }
  toast(isTouch ? 'Drag to look, joystick to walk, tap Use on things.' : 'WASD to walk · mouse to look · E to interact · B to decorate');
};

// ---- touch controls ----
document.body.classList.toggle('touch', isTouch);
if (isTouch) {
  const stick = $('#stick'), knob = $('#knob'); let sid = null, sc = null;
  stick.addEventListener('touchstart', e => { const t = e.changedTouches[0]; sid = t.identifier; const r = stick.getBoundingClientRect(); sc = [r.left + r.width / 2, r.top + r.height / 2]; e.preventDefault(); }, { passive: false });
  let lookId = null, lp = null, ltime = 0, lmoved = 0;
  addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === sid) { let dx = (t.clientX - sc[0]) / 50, dy = (t.clientY - sc[1]) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.x = dx; joy.y = dy; knob.style.transform = `translate(${dx * 36}px,${dy * 36}px)`; }
      if (t.identifier === lookId) { const dx = t.clientX - lp[0], dy = t.clientY - lp[1]; lmoved += Math.abs(dx) + Math.abs(dy); look(dx * 1.6, dy * 1.6); lp = [t.clientX, t.clientY]; }
    }
  }, { passive: true });
  addEventListener('touchend', e => { for (const t of e.changedTouches) { if (t.identifier === sid) { sid = null; joy.x = joy.y = 0; knob.style.transform = ''; } if (t.identifier === lookId) { lookId = null; if (lmoved < 10 && performance.now() - ltime < 300) primary(); } } });
  canvas.addEventListener('touchstart', e => { Sfx.init(); const t = e.changedTouches[0]; if (lookId === null) { lookId = t.identifier; lp = [t.clientX, t.clientY]; ltime = performance.now(); lmoved = 0; } }, { passive: true });
  const btn = (id, fn) => { const el = $(id); el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); Sfx.init(); fn(); }, { passive: false }); };
  btn('#tUse', primary); btn('#tGrab', grab); btn('#tUseHeld', useHeld); btn('#tJump', () => { if (P.pos.y === 0) P.vy = 3.6; if (P.sit) { P.pos.copy(P.sit.prev); P.sit = null; } });
  btn('#tCrouch', () => { P.crouchToggle = !P.crouchToggle; }); btn('#tBuild', () => setBuild(!buildMode)); btn('#tMenu', () => openMenu());
  btn('#tCat', () => togglePanel()); btn('#tRot', () => rotateTarget(PI / 8)); btn('#tDel', deleteTarget); btn('#tDup', duplicateTarget); btn('#tColor', () => recolorTarget()); btn('#tUndo', undo); btn('#tCancel', cancelHold);
}

// ---- HUD ----
function updateHud() {
  const hunger = $('#hungerBar'), energy = $('#energyBar'); if (hunger) { hunger.style.width = (P.hunger * 100) + '%'; energy.style.width = (P.energy * 100) + '%'; }
  $('#taskChip').textContent = '✓ ' + done.size + '/' + TASKS.length;
}
let hudAcc = 0;
function updatePrompt() {
  const pr = $('#prompt');
  let html = '';
  if (held) {
    const d = CATALOG[held.userData.item.t];
    html = `<b>${isTouch ? 'Tap' : 'Click'}</b> place ${d.name.toLowerCase()} <b>R/Q</b> rotate${held.userData.item.use ? ' <b>F</b> use' : ''}${buildMode ? ' <b>X</b> delete <b>V</b> color' : ''} <b>${isTouch ? 'Cancel' : 'Right-click'}</b> cancel`;
  } else if (buildMode) {
    if (buildHover) { const d = CATALOG[buildHover.userData.item.t]; html = `<span class="nm">${d.name}</span> <b>${isTouch ? 'Tap' : 'Click'}</b> move <b>R</b> rotate <b>X</b> delete <b>C</b> copy${d.colorable ? ' <b>V</b> color' : ''}`; }
    else html = `<b>Tab</b> catalog · aim at furniture to move it`;
  } else if (hover && (hover.int || hover.root)) {
    const lab = hover.int ? (typeof hover.int.label === 'function' ? hover.int.label() : hover.int.label) : '';
    const small = hover.root && CATALOG[hover.root.userData.item.t].small;
    if (lab) html += `<b>E</b> ${lab}`;
    if (small) html += ` <b>G</b> pick up`;
  } else if (P.sit) html = P.sit.lie ? 'Resting… move to get up' : 'Move to stand up';
  if (pr.innerHTML !== html) pr.innerHTML = html;
  pr.hidden = !html;
  document.body.classList.toggle('canuse', !!(hover && hover.int) || !!buildHover);
  if (buildMode && buildHover && !held) { hoverHelper.box.setFromObject(buildHover); hoverHelper.visible = true; } else hoverHelper.visible = false;
}

// ---- day / night ----
const daySky = new THREE.Color(0xcfe3f5), nightSky = new THREE.Color(0x0a1220);
function updateDay(dt) {
  P.day = lerp(P.day, P.dayTarget, Math.min(1, dt * 1.5)); const d = P.day;
  sun.intensity = 2.0 * d; hemi.intensity = 0.12 + 0.85 * d; scene.environmentIntensity = 0.05 + 0.24 * d;
  hemi.color.setRGB(lerp(0.25, 0.87, d), lerp(0.3, 0.92, d), lerp(0.45, 0.97, d));
  A.sky.material.color.setRGB(lerp(0.05, 1, d), lerp(0.07, 1, d), lerp(0.14, 1, d)); scene.fog.color.copy(nightSky).lerp(daySky, d);
  A.stars.material.opacity = 1 - d; A.streetLamps.forEach(m => m.emissiveIntensity = (1 - d) * 3);
}

// ---- main loop ----
let last = performance.now(), clockT = 0; const perf = { logic: 0, render: 0 };
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clockT += dt;
  const pf0 = performance.now();
  for (const c of STATIC) if (c.upd) c.upd();
  updatePlayer(dt); camera.updateMatrixWorld();
  updateHover(); updateHeld(); updatePrompt();
  for (let i = 0; i < TICKS.length; i++) { try { TICKS[i].fn(dt, clockT); } catch (e) { console.error(e); TICKS.splice(i--, 1); } }
  itemsGroup.children.forEach(g => { if (g.userData.wiggle > 0) { g.userData.wiggle -= dt; g.scale.setScalar(1 + Math.sin(g.userData.wiggle * 20) * 0.03 * g.userData.wiggle); } });
  updateDay(dt);
  P.hunger = Math.max(0, P.hunger - dt / 900); P.energy = Math.max(0, P.energy - dt / 1200); if (P.caffeine > 0) P.caffeine -= dt;
  if ((hudAcc += dt) > 0.5) { hudAcc = 0; updateHud(); const r = roomAt(P.pos.x, P.pos.z); $('#roomName').textContent = ROOMS[r] ? ROOMS[r].name : 'Outside'; $('#clock').textContent = (P.dayTarget > 0.5 ? '☀️ ' : '🌙 ') + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  Sfx.updateLoops(camera.position);
  const pf1 = performance.now();
  renderer.render(scene, camera);
  perf.logic = lerp(perf.logic, pf1 - pf0, 0.1); perf.render = lerp(perf.render, performance.now() - pf1, 0.1);
}

// ---- boot ----
const saved = store.get('current', null);
loadLayout(saved && saved.items ? saved : DEFAULT_LAYOUT);
P.pos.set(A.spawn.x, 0, A.spawn.z); P.yaw = A.spawn.yaw;
updateHud(); renderTasks();
requestAnimationFrame(frame);
window.__game = { probe() { camera.updateMatrixWorld(); updateHover(); const d = hover && hover.int; return d ? (typeof d.label === 'function' ? d.label() : d.label) : (hover && hover.root ? 'ROOT ' + hover.root.userData.item.t : null); }, perf, THREE, A, P, CATALOG, itemsGroup, serialize, loadLayout, setBuild, primary, camera, ctx, renderer, scene, keys };
