// ---------- engine: renderer, player, needs, clock, actions, phone, events, UI ----------
const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('fallapt3.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fallapt3.' + k, JSON.stringify(v)); } catch (e) { } }
};
const settings = Object.assign({ sens: 1, invert: false, quality: 'high', muted: false }, store.get('settings', {}));
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
renderer.localClippingEnabled = true; // used only by bitten food
Crumbs.init(scene);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.3;
scene.fog = new THREE.Fog(0xcfe3f5, 60, 260);
const hemi = new THREE.HemisphereLight(0xdfeaf7, 0x8a7a66, 0.9); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.0); sun.position.set(-25, 30, -40); scene.add(sun);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', () => { resize(); pausedDrawn = false; }); resize();

// ---- world state ----
const STATIC = [];
let TICKS = [], CLEANUPS = [];
const NEAR_R2 = 6 * 6, FAR_STRIDE = 4; // updates for objects more than 6 m away run every 4th frame (with accumulated time)
let frameNo = 0, ticksRun = 0;
let power = true;
const NEEDS = ['hunger', 'energy', 'hygiene', 'bladder', 'fun'];
const saved = store.get('state', null);
const P = {
  pos: V3(), vy: 0, yaw: 0, pitch: -0.05, eye: 1.62, crouch: false, sit: null, day: 1, dayTarget: 1, bob: 0, stepAcc: 0, caffeine: 0,
  needs: Object.assign({ hunger: 0.7, energy: 0.75, hygiene: 0.65, bladder: 0.7, fun: 0.6 }, saved && saved.needs),
  minutes: saved ? saved.minutes : 9 * 60, dayNum: saved ? saved.dayNum : 1, action: null, anim: null, cash: saved && saved.cash != null ? saved.cash : 85, drive: null, chew: 0, shake: 0,
};
const flags = { tvT: 0, musicT: 0, showering: false };
let held = null, heldSet = new Set(), hover = null, placeTarget = null;
const itemsGroup = new THREE.Group();
const hour = () => P.minutes / 60;
const fmtTime = (m) => { const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60); return ((h + 11) % 12 + 1) + ':' + String(mm).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); };

// ---- light pool: at most POOL_SIZE real point lights; every lamp/ceiling light is a virtual source ----
const POOL_SIZE = 6, FADE_S = 0.3;
const SOURCES = [];
const POOL = [];
const NEIGHBORS = { living: ['balcony', 'bedroom', 'bath', 'laundry', 'mech', 'corridor'], bedroom: ['living', 'bath'], bath: ['bedroom', 'living', 'closet'], closet: ['bath'], laundry: ['living'], mech: ['living'], balcony: ['living'], corridor: ['living'] };
const lightStats = { active: 0, sources: 0 };
const ctx = {
  flags,
  interact(obj, def) { obj.userData.int = def; },
  tick(owner, fn, always) { TICKS.push({ owner, fn, always: !!always, acc: 0, slot: TICKS.length % FAR_STRIDE }); },
  onRemove(owner, fn) { CLEANUPS.push({ owner, fn }); },
  addCollider(box, upd, door) { STATIC.push({ box, upd, door }); },
  // item lights (lamps, tree, fireplace) are virtual sources too, anchored to the item so they follow it
  light(parent, color, intensity, dist, x, y, z) {
    const anchor = new THREE.Object3D(); anchor.position.set(x, y, z); parent.add(anchor);
    const src = ctx.lightSource({ anchor, color, distance: dist, decay: 1.5 }); src.intensity = intensity;
    ctx.onRemove(parent, () => { const i = SOURCES.indexOf(src); if (i >= 0) SOURCES.splice(i, 1); }); return src;
  },
  lightSource(o) { const src = { intensity: 0, level: 0, slot: -1, color: new THREE.Color(o.color), distance: o.distance || 8, decay: o.decay || 1.5, anchor: o.anchor || null, pos: o.pos ? o.pos.clone() : V3() }; SOURCES.push(src); return src; },
  power: () => power,
  setPower(v) { power = v; },
  hour,
  isNight: () => hour() >= 19 || hour() < 6.5,
  playerPos: () => P.pos,
  rootOf(o) { while (o && !o.userData.item) o = o.parent; return o; },
  msg: (t) => toast(t),
  task: (id) => completeTask(id),
  need(k, d) { P.needs[k] = clamp(P.needs[k] + d, 0, 1); if (d > 0.05) floatNeed(k, d); },
  heatAt(p) { return A.heat.find(h => h.on && Math.hypot(h.pos.x - p.x, h.pos.z - p.z) < 0.14 && p.y - h.pos.y > -0.03 && p.y - h.pos.y < 0.12) || null; },
  give(type, d, opts) { if (held) dropHeld(); const g = spawnItem({ id: uid(), t: type, x: P.pos.x, y: 0, z: P.pos.z, r: P.yaw, d: d || {} }); startHold(g, opts); return g; },
  burnerAt(p) { return A.heat.find(h => Math.hypot(h.pos.x - p.x, h.pos.z - p.z) < 0.14 && p.y - h.pos.y > -0.03 && p.y - h.pos.y < 0.12) || null; },
  toggleBurner(b, on) { if (b.toggle) b.toggle(on); else b.on = on; },
  bite(g) { bite(g); },
  puzzle(d, onSolve, onChange) { openPuzzle(d, onSolve, onChange); },
  simon(d, onWin, onPad) { openSimon(d, onWin, onPad); },
  spend(n, what) { if (P.cash < n) { toast('💸 Not enough cash for ' + (what || 'that') + ' ($' + n + '). Do some work on the laptop.'); Sfx.tone(240, 0.2, 'square', 0.05); return false; } P.cash -= n; updateCash(); toast('💵 -$' + n + (what ? ' · ' + what : '')); return true; },
  earn(n, what) { P.cash += n; updateCash(); Sfx.chime(); },
  restock() { A.refillDishes && A.refillDishes(); itemsGroup.children.forEach(g => g.userData.refill && g.userData.refill()); },
  removeHeld() { if (held) { const g = held; held = null; heldSet.clear(); helper.visible = false; camera.remove(g); removeItem(g); } },
  flowerPhoto() { sendText('Lilah', '📷 [photo of a fall bouquet]'); completeTask('text'); setTimeout(() => {}, 0); queueReply('Lilah', ['WAIT. Are those for me??', 'Okay you\'re the best husband. Love you ❤️'], 1.5); ctx.need('fun', 0.1); toast('📸 Sent to Lilah.'); },
  enterCar() { enterCar(); },
  removeItem(g) { removeItem(g); },
  sit(pos, yaw, lie) {
    P.sit = { pos: pos.clone(), yaw, lie, prev: P.pos.clone(), root: arguments[3] || null }; P.yaw = yaw; P.pitch = lie ? 0.9 : -0.1;
  },
  sleep(bed) {
    if (P.needs.energy > 0.85 && !ctx.isNight()) return toast('You\'re not tired right now.');
    const p = V3(0, 0.6, 0.1); bed.localToWorld(p); const q = new THREE.Quaternion(); bed.getWorldQuaternion(q);
    const e = new THREE.Euler().setFromQuaternion(q, 'YXZ'); ctx.sit(p, e.y + Math.PI, true);
    fade(() => {
      const night = ctx.isNight() || P.needs.energy < 0.35;
      if (night) { const add = ((7 * 60 - P.minutes) + 1440) % 1440 || 1440; advanceTime(add, true); P.needs.energy = 1; toast('☀️ Good morning! Day ' + P.dayNum + '. You feel rested.'); }
      else { advanceTime(120, true); ctx.need('energy', 0.35); toast('😴 A two-hour nap. Refreshing.'); }
      A.refillDishes && A.refillDishes(); itemsGroup.children.forEach(g => g.userData.refill && g.userData.refill()); completeTask('sleep');
    });
  },
  eat(a = 0.5) { ctx.need('hunger', a); },
  drink(kind) { ctx.need('energy', kind === 'coffee' ? 0.3 : 0.1); if (kind === 'coffee') { P.caffeine = 90; toast('☕ Caffeine boost! You move faster for a while.'); } else { ctx.need('fun', 0.05); toast('🍵 Warm and soothing.'); } ctx.need('bladder', -0.1); },
  water(g) { toast('💧 Watered. The plant looks happier.'); Sfx.noise(0.8, 0.12, 1500, 0.8); completeTask('plants'); g.userData.wiggle = 1; },
  waterAhead() { const r = hover && hover.root; if (r && /plant|flowers|tray/.test(r.userData.item.t)) ctx.water(r); else toast('Aim at a plant to water it.'); },
  stretch() { ctx.need('energy', 0.1); ctx.need('fun', 0.05); },
  laundry(n) { A.laundry.load += n; },
  startAction(a) { startAction(a); },
  sittingOn: () => P.sit && P.sit.root,
};
const uid = () => Math.random().toString(36).slice(2, 9);

// ---- build apartment and items ----
const A = buildApartment(scene, ctx);
A.world.add(itemsGroup);
buildWorld(scene, ctx, A);
for (let i = 0; i < POOL_SIZE; i++) { const l = new THREE.PointLight(0xffffff, 0, 8, 1.5); l.userData.src = null; scene.add(l); POOL.push(l); } // fixed count: shaders never recompile
const _lp = V3();
function updateLightPool(dt) {
  let here = roomAt(P.pos.x, P.pos.z); if (!NEIGHBORS[here]) here = 'living';
  const near = new Set([here, ...NEIGHBORS[here]]);
  // 1. which sources deserve a real light: lit, in this room or a neighbor; own room first, then nearest
  const cand = [];
  for (const s of SOURCES) {
    if (s.anchor) s.anchor.getWorldPosition(s.pos);
    if (!(s.intensity > 0)) continue;
    const r = roomAt(s.pos.x, s.pos.z); if (!near.has(r)) continue;
    s._score = (r === here ? 0 : 100) + Math.hypot(s.pos.x - P.pos.x, s.pos.z - P.pos.z); cand.push(s);
  }
  cand.sort((a, b) => a._score - b._score);
  const want = new Set(cand.slice(0, POOL_SIZE));
  // 2. fade out lights whose source is no longer wanted (or switched off), freeing the slot at zero
  for (const l of POOL) { const s = l.userData.src; if (!s) continue; if (!want.has(s)) { s.level -= dt / FADE_S; if (s.level <= 0) { s.level = 0; s.slot = -1; l.userData.src = null; } } }
  // 3. give free slots to wanted sources (they fade in from zero)
  for (const s of cand) { if (!want.has(s) || s.slot >= 0) continue; const free = POOL.findIndex(l => !l.userData.src); if (free < 0) break; s.slot = free; s.level = 0; POOL[free].userData.src = s; }
  // 4. drive the real lights
  let active = 0;
  for (const l of POOL) {
    const s = l.userData.src; if (!s) { l.intensity = 0; continue; }
    if (want.has(s)) s.level = Math.min(1, s.level + dt / FADE_S);
    if (s.intensity > 0) s.lastIntensity = s.intensity; // keep fading out at the last brightness after a switch-off
    l.position.copy(s.pos); l.color.copy(s.color); l.distance = s.distance; l.decay = s.decay;
    l.intensity = (s.intensity > 0 ? s.intensity : (s.lastIntensity || 0)) * s.level; if (l.intensity > 0) active++;
  }
  lightStats.active = active; lightStats.sources = SOURCES.length;
}
function itemBox(g) {
  const def = CATALOG[g.userData.item.t]; if (!def.solid || def.mount !== 'floor') { g.userData.box = null; return; }
  g.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(g); if (b.max.y < 0.3) { g.userData.box = null; return; }
  const sh = def.shrink || 0.07; b.expandByVector(V3(-sh, 0, -sh)); g.userData.box = b;
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

const PI = Math.PI, HP = Math.PI / 2;
const DEFAULT_LAYOUT = {
  v: 2, items: [
    // living room: sofa on the half wall, TV on the east wall, tree by the sofa, bistro set top right
    ['sofa', 4.65, 0, 3.55, HP], ['art_wedding', 4.165, 1.62, 2.8, HP, null, { seed: 11 }], ['art_wedding', 4.165, 1.62, 3.55, HP, null, { seed: 12 }], ['art_wedding', 4.165, 1.62, 4.3, HP, null, { seed: 13 }],
    ['picture_light', 4.165, 2.17, 2.8, HP], ['picture_light', 4.165, 2.17, 3.55, HP], ['picture_light', 4.165, 2.17, 4.3, HP],
    ['xmas_tree', 4.55, 0, 2.0, 0], ['present', 5.05, 0, 1.75, 0.3], ['present', 5.2, 0, 2.2, -0.2, '#2e5a3a'], ['present', 5.55, 0, 1.45, 0.9, '#2e3a46'],
    ['rug_vintage', 5.9, 0, 3.6, HP], ['coffee_marble', 5.9, 0, 3.6, HP], ['tray_trees', 5.9, 0.485, 3.32, 0], ['albums', 5.9, 0.485, 3.8, 0.5],
    ['media_console', 7.32, 0, 3.85, -HP], ['tv', 7.535, 1.55, 3.85, -HP], ['speaker', 7.32, 0.63, 3.2, -HP], ['record_player', 7.32, 0.63, 3.85, -HP], ['mini_tree', 7.32, 0.63, 4.5, 0], ['basket', 4.45, 0, 5.0, 0],
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
    ['bed', 1.14, 0, 1.41, HP], ['nightstand', 0.27, 0, 0.31, HP], ['nightstand', 0.27, 0, 2.51, HP], ['lamp_table', 0.27, 0.63, 0.31, 0, null, { on: true }], ['lamp_table', 0.27, 0.63, 2.51, 0],
    ['desk', 2.3, 0, 3.065, PI], ['monitor', 2.3, 0.76, 3.0, PI], ['laptop', 1.85, 0.76, 3.05, PI + 0.25], ['plant_small', 2.75, 0.76, 3.2, 0], ['office_chair', 2.3, 0, 2.97, 0],
    ['art_monet', 0.06, 1.75, 1.41, HP], ['arched_cabinet', 2.78, 0, 0.27, 0], ['dresser', 3.8, 0, 1.7, -HP],
    ['art_photo', 4.04, 1.45, 1.25, -HP, null, { seed: 21 }], ['art_photo', 4.04, 1.45, 1.7, -HP, null, { seed: 22 }], ['art_photo', 4.04, 1.45, 2.15, -HP, null, { seed: 23 }],
    ['art_photo', 4.04, 1.9, 1.25, -HP, null, { seed: 24 }], ['art_photo', 4.04, 1.9, 1.7, -HP, null, { seed: 25 }], ['art_photo', 4.04, 1.9, 2.15, -HP, null, { seed: 26 }],
    ['vase', 3.8, 0.83, 1.25, 0], ['books', 3.8, 0.83, 2.2, 0.2], ['ironing', 2.88, 0, 1.6, 0],
    ['clothes_pile', 3.3, 0, 0.8, 0.4], ['clothes_pile', 3.35, 0, 2.7, 1.2],
    // bath, closet, balcony, corridor
    ['hair_dryer', 0.35, 0.9, 4.1, HP], ['candle', 0.32, 0.9, 5.3, 0], ['hamper', 0.93, 0, 9.05, 0],
    ['storage_bin', 4.6, 0, 0.45, 0], ['pumpkin', 7.2, 0, 0.6, 0], ['pumpkin', 7.85, 0, 6.9, 0.5],
  ].map(([t, x, y, z, r, c, d]) => { const o = { t, x, y, z, r }; if (c) o.c = c; if (d) o.d = d; return o; }),
  rooms: {}
};

DEFAULT_LAYOUT.items.forEach(i => spawnItem({ id: uid(), ...i, d: i.d ? JSON.parse(JSON.stringify(i.d)) : {} }));

// ---- merge static geometry (rendering only; picking still uses the original meshes) ----
camera.layers.enable(LAYER_MERGED);
const optStats = optimizeStatic({
  roots: [A.world, A.outdoor],
  tickOwners: TICKS.map(t => t.owner).filter(o => o !== A.world && o !== itemsGroup),
  registry: [...Object.values(A.lights).flatMap(L => L.mats), ...A.streetLamps, ...(A.glowMats || []), A.sky.material],
  isItemContainer: (o) => { const d = CATALOG[o.userData.item.t]; return d.small || d.removable; },
});
console.info('static merge', optStats);

// ---- clock & day/night ----
function advanceTime(mins, skip) {
  P.minutes += mins;
  while (P.minutes >= 1440) { P.minutes -= 1440; P.dayNum++; }
  if (skip) { for (const k of NEEDS) if (k !== 'energy') P.needs[k] = clamp(P.needs[k] - mins * RATES[k] * 0.35, 0.05, 1); P.day = P.dayTarget = dayFactor(); }
}
function dayFactor() { const h = hour(); return clamp(Math.min((h - 6.3) / 1.2, (19.3 - h) / 1.2), 0, 1); }

// ---- needs ----
const RATES = { hunger: 1 / 700, energy: 1 / 1000, hygiene: 1 / 1100, bladder: 1 / 520, fun: 1 / 650 }; // per game minute
const NEED_INFO = { hunger: ['🍽', 'Hunger', 'Your stomach growls. Time to eat something.'], energy: ['⚡', 'Energy', 'You\'re exhausted. Coffee or a nap would help.'], hygiene: ['🧼', 'Hygiene', 'You could really use a shower.'], bladder: ['🚽', 'Bladder', 'You need the bathroom!'], fun: ['🎉', 'Fun', 'You\'re bored. Watch TV, play some music or open a present.'] };
const warnAt = {};
function updateNeeds(dt, gameMin) {
  for (const k of NEEDS) P.needs[k] = clamp(P.needs[k] - gameMin * RATES[k] * (k === 'energy' && P.caffeine > 0 ? 0.3 : 1), 0, 1);
  const now = performance.now();
  if (P.sit && !P.sit.lie && now - flags.tvT < 600) { ctx.need('fun', dt / 70); completeTask('tv'); }
  if (now - flags.musicT < 600 || phoneMusic) ctx.need('fun', dt / 160);
  if (P.sit) ctx.need('energy', dt / (P.sit.lie ? 120 : 400));
  for (const k of NEEDS) {
    if (P.needs[k] < 0.18 && (!warnAt[k] || now - warnAt[k] > 60000)) { warnAt[k] = now; toast(NEED_INFO[k][0] + ' ' + NEED_INFO[k][2], 'warn'); if (k === 'hunger') Sfx.noise(0.8, 0.15, 120, 2, 'lowpass', 60); }
  }
  if (P.needs.bladder <= 0.01 && !P.action) { P.needs.bladder = 0.4; toast('😳 Oops… you didn\'t make it to the bathroom. Hygiene took a hit.', 'warn'); P.needs.hygiene = Math.max(0, P.needs.hygiene - 0.4); }
}
function mood() {
  const avg = NEEDS.reduce((s, k) => s + P.needs[k], 0) / NEEDS.length, min = Math.min(...NEEDS.map(k => P.needs[k]));
  if (min < 0.15) return ['😫', 'Struggling']; if (avg > 0.75) return ['😄', 'Great']; if (avg > 0.55) return ['🙂', 'Good']; if (avg > 0.35) return ['😐', 'Okay']; return ['😟', 'Low'];
}
function floatNeed(k, d) {
  const el = document.createElement('div'); el.className = 'floater'; el.textContent = NEED_INFO[k][0] + ' +' + Math.round(d * 100);
  $('#hud').appendChild(el); setTimeout(() => el.remove(), 1400);
}

// ---- timed actions (brushing, toilet…) ----
function startAction(a) {
  if (P.action) return;
  if (a.sit) { P.sit = { pos: a.sit.pos.clone(), yaw: a.sit.yaw, lie: false, prev: P.pos.clone(), locked: true }; P.yaw = a.sit.yaw; P.pitch = -0.2; }
  P.action = { ...a, t: 0, snd: a.sound ? Sfx.loop(a.sound, null, 0.12) : null };
}
function updateAction(dt) {
  const a = P.action; if (!a) { if (!EL.action.hidden) EL.action.hidden = true; return; }
  a.t += dt; const k = Math.min(1, a.t / a.dur);
  $('#action').hidden = false; $('#actionLabel').textContent = a.label + '…'; $('#actionRing').style.setProperty('--p', (k * 360) + 'deg');
  if (a.tick) a.tick(dt, k);
  if (k >= 1) { a.snd && a.snd.stop(); P.action = null; if (a.sit && P.sit) { P.pos.copy(P.sit.prev); P.sit = null; P.pitch = 0; } try { a.done && a.done(); } catch (e) { console.error(e); } }
}

// ---- player ----
// ---- collision: the player is a circle, colliders are boxes; push out along the shortest direction ----
const PR = 0.19; // player radius
const _cand = [];
function gatherColliders(feet, cx, cz, reach) { // broad phase: boxes at body height near the player
  _cand.length = 0; const y0 = feet + 0.3, y1 = feet + (P.crouch ? 1.5 : 1.75);
  const test = (b, ref) => { if (!b || b.isEmpty() || b.max.y <= y0 || b.min.y >= y1) return; if (cx + reach < b.min.x || cx - reach > b.max.x || cz + reach < b.min.z || cz - reach > b.max.z) return; _cand.push(b, ref); };
  for (const c of STATIC) test(c.box, c);
  for (const g of itemsGroup.children) test(g.userData.box, g);
  return _cand;
}
// penetration of a circle at (x,z) into box b: returns push vector length (0 if none) into _push
const _push = { x: 0, z: 0, d: 0 };
function penetration(x, z, b) {
  const qx = clamp(x, b.min.x, b.max.x), qz = clamp(z, b.min.z, b.max.z), dx = x - qx, dz = z - qz, d2 = dx * dx + dz * dz;
  if (d2 >= PR * PR) { _push.d = 0; return 0; }
  if (d2 > 1e-10) { const d = Math.sqrt(d2), k = (PR - d) / d; _push.x = dx * k; _push.z = dz * k; _push.d = PR - d; return _push.d; }
  // centre is inside the box: leave by the nearest face that has free space beyond it
  const exits = [[-(x - b.min.x + PR + 0.01), 0], [b.max.x - x + PR + 0.01, 0], [0, -(z - b.min.z + PR + 0.01)], [0, b.max.z - z + PR + 0.01]].sort((p, q) => Math.abs(p[0] + p[1]) - Math.abs(q[0] + q[1]));
  let pick = exits[0]; for (const e of exits) { if (!blockedExcept(x + e[0], z + e[1], b)) { pick = e; break; } }
  _push.x = pick[0]; _push.z = pick[1]; _push.d = Math.abs(pick[0] + pick[1]); return _push.d;
}
function blockedExcept(x, z, skip) { // is a circle at (x,z) overlapping anything other than box `skip`? (shallow test, no recursion)
  const y0 = P.pos.y + 0.3, y1 = P.pos.y + (P.crouch ? 1.5 : 1.75);
  const hit = (b) => { if (!b || b === skip || b.isEmpty() || b.max.y <= y0 || b.min.y >= y1) return false; const qx = clamp(x, b.min.x, b.max.x), qz = clamp(z, b.min.z, b.max.z); return (x - qx) ** 2 + (z - qz) ** 2 < PR * PR; };
  for (const c of STATIC) if (hit(c.box)) return true;
  for (const g of itemsGroup.children) if (hit(g.userData.box)) return true;
  return false;
}
function blocked(x, z, feet) { // used by tests and helpers: is a circle here overlapping anything?
  const c = gatherColliders(feet, x, z, PR + 0.01);
  for (let i = 0; i < c.length; i += 2) if (penetration(x, z, c[i]) > 0.001) return c[i + 1];
  return null;
}
let bumpT = 0;
function bump(hit, dt) { // walking into a closed door opens it
  if (!hit || !hit.door) { bumpT = 0; return; }
  const d = hit.door; bumpT += dt;
  if (bumpT > 0.12 && !d.open) { bumpT = 0; if (d.locked) { if (!d.toldT || performance.now() - d.toldT > 3000) { d.toldT = performance.now(); toast('🔒 The ' + d.label + ' is locked.'); } } else d.def.action(); }
}
function penetrationEscape(c, x, z, dt) {
  let best = 0, bx = 0, bz = 0; for (let i = 0; i < c.length; i += 2) { const d = penetration(x, z, c[i]); if (d > best) { best = d; bx = _push.x; bz = _push.z; } }
  if (!best) return; const l = Math.hypot(bx, bz), m = Math.min(l, GLIDE * dt); P.pos.x = x + bx / l * m; P.pos.z = z + bz / l * m;
}
const GLIDE = 2.0; // m/s: how fast you're eased out if you ever end up inside something (never a teleport)
function moveAndSlide(vx, vz, dt) {
  const dist = Math.hypot(vx, vz), steps = Math.max(1, Math.ceil(dist / (PR * 0.45)));
  const c = gatherColliders(P.pos.y, P.pos.x + vx / 2, P.pos.z + vz / 2, PR + dist / 2 + 0.3);
  let doorHit = null;
  const depth = (x, z) => { let m = 0; for (let i = 0; i < c.length; i += 2) { const d = penetration(x, z, c[i]); if (d > m) m = d; } return m; };
  for (let s = 0; s < steps; s++) {
    const sx = P.pos.x, sz = P.pos.z, startDepth = depth(sx, sz);
    let x = sx + vx / steps, z = sz + vz / steps;
    let budget = dist / steps + GLIDE * dt / steps; // total correction this substep: shallow contacts resolve fully, deep overlaps glide out
    for (let it = 0; it < 4 && budget > 1e-6; it++) {
      let px = 0, pz = 0, any = false;
      for (let i = 0; i < c.length; i += 2) {
        if (penetration(x, z, c[i]) <= 0.0005) continue; any = true;
        px += _push.x; pz += _push.z;
        const ref = c[i + 1]; if (ref && ref.door && !doorHit) doorHit = ref;
      }
      if (!any) break;
      const pl = Math.hypot(px, pz); if (pl > budget) { px *= budget / pl; pz *= budget / pl; }
      x += px; z += pz; budget -= Math.min(pl, budget);
    }
    // never accept a step that leaves you deeper inside something than where you started (e.g. squeezed between two corners)
    const endDepth = depth(x, z);
    if (endDepth > 0.01 && endDepth > startDepth + 0.001) { x = sx; z = sz; if (startDepth > 0.0005) { penetrationEscape(c, sx, sz, dt / steps); x = P.pos.x; z = P.pos.z; } }
    P.pos.x = x; P.pos.z = z;
  }
  return doorHit;
}
const keys = {}; const joy = { x: 0, y: 0 };
const joyRun = () => Math.hypot(joy.x, joy.y) > 0.95;
function updatePlayer(dt) {
  if (P.drive) return updateCar(dt);
  let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
  let mz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + joy.y;
  const anyMove = Math.abs(mx) + Math.abs(mz) > 0.15 || keys.Space;
  if (P.sit) {
    if (anyMove && !uiOpen() && !P.sit.locked) { P.pos.copy(P.sit.prev); P.sit = null; P.pitch = 0; } else {
      camera.position.set(P.sit.pos.x, P.sit.pos.y + (P.sit.lie ? 0.3 : 0.72) + Math.sin(performance.now() / 900) * 0.004, P.sit.pos.z);
      camera.rotation.set(P.pitch, P.yaw, 0); return;
    }
  }
  if (uiOpen() || P.action) { mx = mz = 0; }
  const len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; }
  P.crouch = !!(keys.ShiftLeft || P.crouchToggle); // sneak: Left Shift (or the touch Sneak toggle)
  const tired = P.needs.energy < 0.15 ? 0.7 : 1;
  const running = (keys.ControlLeft || P.sprintLatch || joyRun()) && !P.crouch && len > 0.2; // sprint: Left Ctrl or double-tap W
  const speed = (running ? 4.3 : 2.5) * (P.crouch ? 0.45 : 1) * (P.caffeine > 0 ? 1.3 : 1) * tired;
  const s = Math.sin(P.yaw), c = Math.cos(P.yaw);
  const vx = (mx * c + mz * s) * speed * dt, vz = (-mx * s + mz * c) * speed * dt;
  const ox = P.pos.x, oz = P.pos.z;
  const doorHit = moveAndSlide(vx, vz, dt);
  if (Math.abs(vx) + Math.abs(vz) > 0) bump(doorHit, dt); else bumpT = 0;
  const moved = Math.hypot(P.pos.x - ox, P.pos.z - oz);
  const gy = A.groundAt ? A.groundAt(P.pos.x, P.pos.z, P.pos.y) : 0;
  P.vy -= 9.8 * dt; P.pos.y += P.vy * dt; if (P.pos.y <= gy) { if (P.vy < -2) Sfx.step(); P.pos.y = gy; P.vy = 0; if (keys.Space && !uiOpen() && !P.action) P.vy = 3.6; }
  if (P.pos.y > gy + 0.02 && P.vy === 0) P.pos.y = Math.max(gy, P.pos.y - 6 * dt); // walking down a ramp keeps your feet on it
  if (moved > 0.001 && Math.abs(P.pos.y - gy) < 0.03) { P.bob += moved * 3.4; P.stepAcc += moved; if (P.stepAcc > (running ? 0.85 : 0.65)) { P.stepAcc = 0; Sfx.step(P.crouch || roomAt(P.pos.x, P.pos.z) === 'corridor'); } }
  P.eye = lerp(P.eye, P.crouch ? 1.38 : 1.62, dt * 10);
  const fov = lerp(camera.fov, running && moved > 0.01 ? 75 : 70, dt * 6); if (Math.abs(fov - camera.fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.position.set(P.pos.x, P.pos.y + P.eye + Math.sin(P.bob) * 0.03, P.pos.z);
  camera.rotation.set(P.pitch + (P.chew > 0 ? Math.sin(P.chew * 26) * 0.004 * P.chew : 0) + (P.shake > 0 ? (Math.random() - 0.5) * P.shake * 0.06 : 0), P.yaw, Math.sin(P.bob * 0.5) * 0.004);
  if (P.shake > 0) P.shake -= dt;
  if (P.pos.z < 1.4 && P.pos.x > 4.1 && P.pos.x < 7.6 && P.pos.y > -0.5) completeTask('outside');
}

// ---- input ----
let skipMoves = 0, locked = false, dragging = false, dragDist = 0, lastMouse = null; const mouseNDC = new THREE.Vector2(0, 0); let mouseInCanvas = false;
const EL = { menu: $('#menu'), start: $('#start'), tasks: $('#tasks'), phone: $('#phone'), prompt: $('#prompt'), vignette: $('#vignette'), wet: $('#wet'), action: $('#action'), perf: $('#perfHud') };
const uiOpen = () => !EL.menu.hidden || !EL.start.hidden || !EL.tasks.hidden || !EL.phone.hidden || !$('#puzzle').hidden || !$('#simon').hidden;
const uiFreezes = () => !EL.menu.hidden || !EL.start.hidden || !EL.tasks.hidden || !$('#puzzle').hidden || !$('#simon').hidden; // the phone keeps time moving
const tryLock = () => { if (isTouch) return; try { const p = canvas.requestPointerLock(); p && p.catch && p.catch(() => { }); } catch (e) { } };
// mouse: right click = use / interact, left click = hit, bite or the aimed thing's grab action
canvas.addEventListener('mousedown', (e) => {
  Sfx.init();
  if (e.button === 2) { primary(); if (!locked && !uiOpen()) tryLock(); return; }
  if (e.button !== 0) return;
  if (locked) { leftAction(); return; }
  dragging = true; dragDist = 0; lastMouse = [e.clientX, e.clientY];
});
addEventListener('mouseup', (e) => {
  if (!dragging || e.button !== 0) return; dragging = false;
  if (dragDist < 6 && e.target === canvas) { if (hover || held) leftAction(); if (!uiOpen()) tryLock(); }
});
addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect(); mouseNDC.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1); mouseInCanvas = e.target === canvas;
  if (locked) { if (skipMoves > 0) { skipMoves--; return; } if (Math.abs(e.movementX) + Math.abs(e.movementY) > 300) return; look(e.movementX, e.movementY); }
  else if (dragging && lastMouse) { const dx = e.clientX - lastMouse[0], dy = e.clientY - lastMouse[1]; dragDist += Math.abs(dx) + Math.abs(dy); dragLook.x += dx * 1.2; dragLook.y += dy * 1.2; lastMouse = [e.clientX, e.clientY]; }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
// drag-to-look only: ease mouse deltas in over ~40 ms (pointer lock and touch stay raw)
const dragLook = { x: 0, y: 0 };
function applyDragLook(dt) { if (!dragLook.x && !dragLook.y) return; const k = 1 - Math.exp(-dt / 0.04); const dx = dragLook.x * k, dy = dragLook.y * k; dragLook.x -= dx; dragLook.y -= dy; if (Math.abs(dragLook.x) + Math.abs(dragLook.y) < 0.01) { look(dragLook.x + dx, dragLook.y + dy); dragLook.x = dragLook.y = 0; return; } look(dx, dy); }
function look(dx, dy) { const k = 0.0022 * settings.sens; P.yaw -= dx * k; P.pitch = clamp(P.pitch - dy * k * (settings.invert ? -1 : 1), -1.45, 1.45); }
let suppressMenu = false;
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas; document.body.classList.toggle('locked', locked); skipMoves = 2;
  if (!locked && !uiOpen() && !suppressMenu && $('#start').hidden) openMenu();
  suppressMenu = false;
});
function unlock() { if (locked) { suppressMenu = true; document.exitPointerLock(); } }
let lastW = 0;
function toggleHud() { document.body.classList.toggle('nohud'); }
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  Sfx.init();
  if (e.ctrlKey && /^(Key[A-Z]|Digit\d|Space)$/.test(e.code)) e.preventDefault(); // Ctrl is sprint: stop Ctrl+S / Ctrl+D / Ctrl+A… browser shortcuts
  if (e.code === 'Space' || e.code === 'F1') e.preventDefault();
  if (e.code === 'KeyW' && !e.repeat) { const now = e.timeStamp; if (now - lastW < 300) P.sprintLatch = true; lastW = now; } // double-tap W to sprint
  keys[e.code] = true;
  if (e.code === 'F1') { toggleHud(); return; }
  if (!$('#simon').hidden) { if (e.code === 'Escape') closeSimon(); return; }
  if (!$('#puzzle').hidden) { const b = Puzzle.blank(), dir = { ArrowUp: 3, KeyW: 3, ArrowDown: -3, KeyS: -3, ArrowLeft: 1, KeyA: 1, ArrowRight: -1, KeyD: -1 }[e.code]; if (e.code === 'Escape') { closePuzzle(); return; } if (dir !== undefined) { e.preventDefault(); const i = b + dir; if (i >= 0 && i < 9 && (Math.abs(dir) === 3 || Math.floor(i / 3) === Math.floor(b / 3))) slidePz(i); } return; }
  if (e.code === 'Escape') { if (!$('#phone').hidden) { closePhone(); return; } if (!$('#tasks').hidden) { $('#tasks').hidden = true; return; } if (!$('#menu').hidden) { closeMenu(); return; } if (!locked && $('#start').hidden) openMenu(); return; }
  if (uiOpen() || e.repeat) return;
  if (e.code === 'KeyE') pickUp();
  if (e.code === 'KeyQ') dropHeld();
});
addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'KeyW') P.sprintLatch = false; });
// Ctrl+W can't be blocked by a web page: ask before the tab closes mid-game
addEventListener('beforeunload', (e) => { if ($('#start').hidden) { e.preventDefault(); e.returnValue = ''; } });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; P.sprintLatch = false; });

// ---- raycasting ----
const ray = new THREE.Raycaster();
const CENTER = new THREE.Vector2(0, 0);
ray.layers.set(0); ray.layers.enable(LAYER_PICK); // aim at real objects (incl. merged originals), never at merged render meshes
function aimRay() { ray.setFromCamera(locked || isTouch || !mouseInCanvas ? CENTER : mouseNDC, camera); }
let frameHits = [];
function castFrame() { aimRay(); ray.far = 9; frameHits.length = 0; ray.intersectObject(A.world, true, frameHits); } // the one raycast per frame
function findIntDeep(o) { while (o) { if (o.userData.int) return o; o = o.parent; } return null; }
const NOOPTS = {};
function hitList(maxDist, opts = NOOPTS) {
  const out = [];
  for (const h of frameHits) {
    if (h.distance > maxDist) break;
    const o = h.object; if (o.isPoints || o.isSprite || o.userData.noRay || heldSet.has(o) || (P.drive && driveSet.has(o))) continue;
    let vis = true, p = o; while (p) { if (!p.visible) { vis = false; break; } p = p.parent; } if (!vis) continue;
    const ghost = o.material && (o.material.visible === false || (o.material.transparent && o.material.opacity < 0.35));
    if (ghost && (opts.solidOnly || !findIntDeep(o))) continue;
    out.push(h);
  }
  return out;
}
function firstHit(maxDist, opts) { return hitList(maxDist, opts)[0] || null; }
function updateHover() {
  hover = null;
  const hits = hitList(9);
  const h = hits[0]; if (!h) return;
  let pick = h, io = findIntDeep(h.object);
  for (const k of hits) { if (k.distance > h.distance + 0.4) break; const ki = findIntDeep(k.object); if (ki && ki.userData.int.priority) { pick = k; io = ki; break; } } // stove knobs win over a pan handle hanging in front of them
  if (!(io && io.userData.int.priority)) for (const k of hits) { if (k.distance > h.distance + 0.06) break; const ki = findIntDeep(k.object); if (ki && (!io || ki !== io && k.object.userData.int && ctx.rootOf(k.object) === ctx.rootOf(h.object))) { pick = k; io = ki; break; } } // a button set into the thing you aim at wins, but a neighbouring object (the tree behind a present) never steals the click
  const reach = io && io.userData.int.reach || 2.6;
  if (pick.distance > reach) io = null;
  if (!io && h.distance > 2.6) return;
  hover = { obj: io, int: io && io.userData.int, root: ctx.rootOf(pick.object), point: pick.point, dist: pick.distance };
}

// ---- holding things in your hand ----
const helper = new THREE.Box3Helper(new THREE.Box3(), 0x6fe08a); helper.visible = false; scene.add(helper);
const HAND = V3(0.26, -0.3, -0.55), HAND_FOOD = V3(0.17, -0.25, -0.5); // food sits a little closer to the middle so you can watch it go
const _off = V3(), _n = V3(), _place = V3(), _ctr = V3(); // scratch vectors reused every frame
const TWEENS = [];
const _vb = new THREE.Box3(), _vbb = new THREE.Box3();
function visibleBox(g) { // bounds of the visible, solid parts only (ignores steam, crumbs, hidden extras)
  _vb.makeEmpty(); g.updateMatrixWorld(true);
  (function walk(o) { if (!o.visible || o.userData.noRay) return; if (o.isMesh && o.geometry) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _vbb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); _vb.union(_vbb); } for (const c of o.children) walk(c); })(g);
  return _vb;
}
// sinks are no-food zones: food goes on counters and tables, never in a sink
let SINK_BOXES = null; const _sb = new THREE.Box3();
function inSink(p) {
  if (!SINK_BOXES) SINK_BOXES = A.sinks.map(m => { m.updateWorldMatrix(true, false); const b = new THREE.Box3().setFromObject(m); b.expandByVector(V3(0.06, 0, 0.06)); b.max.y = b.min.y + 0.55; b.min.y -= 0.05; return b; });
  return SINK_BOXES.some(b => b.containsPoint(p));
}
let sinkBlocked = false;
function startHold(g, opts) {
  if (!g) return;
  held = g; heldSet.clear(); g.traverse(o => heldSet.add(o));
  g.userData.box = null;
  g.scale.setScalar(1); const sz = visibleBox(g).getSize(V3()); g.userData.size = sz;
  const s = Math.min(1, 0.32 / Math.max(sz.x, sz.y, sz.z, 0.01));
  g.parent && g.parent.remove(g); camera.add(g); g.position.copy(HAND); g.scale.setScalar(s); g.rotation.set(0, (g.userData.item.r || 0) - P.yaw, 0);
  g.userData.rise = opts && opts.rise ? 1 : 0; // handed to you from a pan / oven / fridge: it rises into view
  Sfx.click();
}
function updateAnim(dt) {
  if (P.chew > 0) P.chew -= dt;
  const a = P.anim; if (!a) return;
  a.t += dt; const k = a.t / a.dur;
  if (!a.fired && k >= a.at) { a.fired = true; a.fire && a.fire(a); }
  if (k >= 1) { P.anim = null; a.finish && a.finish(); }
}
function updateHeld(dt) {
  if (!held) { helper.visible = false; placeTarget = null; return; }
  const inst = held.userData.item, F = inst.food;
  const a = P.anim && P.anim.g === held ? P.anim : null; const off = _off.set(0, Math.sin(P.bob * 2) * 0.012, 0); let rx = 0, rz = 0;
  if (held.userData.rise > 0) { held.userData.rise = Math.max(0, held.userData.rise - dt * 3.2); const r = held.userData.rise; off.y -= r * r * 0.35; rx += r * 0.5; }
  if (a) {
    const up = Math.sin(Math.min(1, a.t / a.dur) * Math.PI);
    if (a.kind === 'sip') { off.x -= 0.22 * up; off.y += 0.24 * up; off.z += 0.28 * up; rx -= 0.9 * up; rz += 0.3 * up; }
    else { off.x -= 0.2 * up; off.y += 0.2 * up; off.z += 0.3 * up; rx += 0.35 * up; }
  }
  if (F && F.handTilt) rx += F.handTilt;
  held.position.copy(F ? HAND_FOOD : HAND).add(off); held.rotation.set(rx, F ? (F.handYaw || 0) : (inst.r || 0) - P.yaw, rz);
  const h = a ? null : firstHit(3, { solidOnly: true }); placeTarget = null;
  sinkBlocked = false;
  if (h) { const n = h.face ? _n.copy(h.face.normal).transformDirection(h.object.matrixWorld) : _n.set(0, 1, 0); if (n.y > 0.6) placeTarget = _place.copy(h.point); }
  if (placeTarget && F && inSink(placeTarget)) { placeTarget = null; sinkBlocked = true; }
  if (placeTarget) { const sz = held.userData.size; helper.box.setFromCenterAndSize(_ctr.copy(placeTarget).setY(placeTarget.y + sz.y / 2), sz); helper.visible = true; } else helper.visible = false;
}
function releaseTo(pos) {
  pos = pos.clone(); const g = held; held = null; heldSet.clear(); helper.visible = false;
  const it = g.userData.item; if (it.food) it.r = P.yaw + (it.food.handYaw || 0); // food keeps the facing it had in your hand
  camera.remove(g); itemsGroup.add(g); g.scale.setScalar(1); g.position.copy(pos); g.rotation.set(0, it.r || 0, 0);
  Object.assign(it, { x: pos.x, y: pos.y, z: pos.z }); itemBox(g); return g;
}
function placeHeld() {
  if (!held) return; if (!placeTarget) return toast(sinkBlocked ? 'Not in the sink — set food down on the counter.' : 'Aim at a table, counter or the floor to set it down.');
  // set it down gently: it glides from your hand to the spot, lowers onto it and settles
  const g = held, from = g.getWorldPosition(V3()), fromS = g.getWorldScale(V3()).x;
  releaseTo(placeTarget); const to = g.position.clone(), t0 = performance.now(), dur = 260;
  g.position.copy(from); g.scale.setScalar(fromS);
  TWEENS.push((now) => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    g.position.lerpVectors(from, to, e); g.position.y = lerp(from.y, to.y, e) + Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.04 * (1 - k);
    g.scale.setScalar(lerp(fromS, 1, e));
    if (k >= 1) { g.position.copy(to); g.scale.setScalar(1); g.userData.wiggle = 0.25; Sfx.noise(0.08, 0.12, 700, 1, 'lowpass'); if (g.userData.item.t === 'plate' || g.userData.item.t === 'bowl' || g.userData.item.t === 'mug') Sfx.clink(); return true; }
  });
}
function dropHeld() { if (!held) return; const p = P.pos.clone(); p.x -= Math.sin(P.yaw) * 0.5; p.z -= Math.cos(P.yaw) * 0.5; p.y = 0; releaseTo(p); Sfx.noise(0.12, 0.3, 300, 1, 'lowpass'); }
const labelOf = (d, k = 'label') => { const v = d && d[k]; return typeof v === 'function' ? v() : v; };
// Right click: use / interact (doors, appliances, eat, sit, set down what you hold)
function freshAim() { camera.updateMatrixWorld(); castFrame(); updateHover(); } // clicks use exactly what the crosshair is on right now
function primary() {
  Sfx.init();
  if (P.drive) { freshAim(); if (hover && hover.int && hover.int.cook) { try { hover.int.action(); } catch (e) { console.error(e); } return; } return carRadio(); }
  if (P.action || P.anim) return;
  freshAim();
  if (hover && hover.int) { const d = hover.int; try { d.action && d.action(); } catch (e) { console.error(e); } return; }
  const nd = nearDoor(); if (nd) { nd.def.action(); return; }
  if (held) { if (placeTarget || sinkBlocked) return placeHeld(); if (held.userData.item.food) return bite(held); return toast('Aim at a table, counter or the floor to set it down.'); }
}
// Left click: the aimed thing's grab action (flip, switch…), else a bite of what you hold, else a punch
let handHintT = 0;
function leftAction() {
  Sfx.init();
  if (P.drive) return carHorn();
  if (P.action || P.anim) return;
  freshAim();
  if (held && held.userData.item.food) return bite(held); // food in hand: left click always takes a bite
  const aimed = hover && hover.root, af = aimed && aimed.userData.item.food;
  if (af && !(af.empty && af.empty()) && aimed.userData.item.d.left > 0) return bite(aimed); // food on a table or counter: eat it where it sits
  if (hover && hover.int && hover.int.alt && labelOf(hover.int, 'altLabel')) { try { hover.int.alt(); } catch (e) { console.error(e); } return; }
  if (held) {
    const it = held.userData.item; if (it.handUse) return it.handUse();
    if (performance.now() - handHintT > 2500) { handHintT = performance.now(); toast('Right-click a counter or table to set it down · Q to drop it.'); }
    return;
  }
  punch();
}
// E: pick up the item you're looking at
function pickUp() {
  if (P.drive) return exitCar();
  if (P.action || P.anim) return;
  freshAim();
  if (held) return toast('Your hands are full — right-click a surface to set it down, or press Q to drop it.');
  const r = hover && hover.root; if (!r) return;
  if (!CATALOG[r.userData.item.t].small) return toast('That\'s too big to carry.');
  startHold(r);
}
function nearDoor() {
  const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); let best = null, bd = 1.7;
  for (const d of A.doors) { const dx = d.center.x - P.pos.x, dz = d.center.z - P.pos.z, dist = Math.hypot(dx, dz); if (dist < bd && (dx * fx + dz * fz) / (dist || 1) > 0.35) { bd = dist; best = d; } }
  return best;
}
// ---- eating: bring it to your mouth, bite lands halfway, chew with crumbs ----
const _cp = V3();
function bite(g) {
  if (!g || P.action || P.anim) return;
  const it = g.userData.item, F = it && it.food; if (!F) return;
  if (F.empty && F.empty()) return toast(F.emptyMsg || 'It\'s empty.');
  if (!(it.d.left > 0)) return;
  const drink = F.mode === 'drink'; if (drink) Sfx.sip();
  P.anim = { t: 0, dur: drink ? 1.0 : 0.6, at: 0.5, kind: drink ? 'sip' : 'bite', g, fire: (a) => landBite(g, a) };
}
function landBite(g, a) {
  const it = g.userData.item, F = it.food; if (!F || !(it.d.left > 0)) return;
  const first = it.d.left === F.bites;
  it.d.left--; camera.getWorldPosition(_cp); F.apply(_cp);
  if (F.hunger) ctx.need('hunger', F.hunger / F.bites);
  if (first) { F.onFirst && F.onFirst(); if (F.hunger) completeTask('eat'); }
  F.onSip && F.onSip(first);
  if (F.mode === 'drink') Sfx.gulp();
  else { Sfx.bite(F.sound); Sfx.chew(F.sound); P.chew = 0.9; (g === held ? g : (F.part || g)).getWorldPosition(_cp); _cp.y += 0.02; Crumbs.spawn(_cp, F.crumb, 9, g === held ? P.pos.y : g.position.y); }
  if (it.d.left <= 0) {
    const r = F.done ? F.done() : 'consume';
    if (F.msg) toast(F.msg);
    if (r === 'consume') a.finish = () => { if (held === g) { held = null; heldSet.clear(); helper.visible = false; } removeItem(g); };
  }
}
// ---- punching (left click with empty hands) ----
const fist = new THREE.Group();
{
  const skin = M(0xe2b08a, 0.6), f = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 10), skin); f.scale.set(1, 0.85, 1.2); fist.add(f);
  for (let i = 0; i < 4; i++) { const k = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), skin); k.position.set(-0.024 + i * 0.016, 0.018, -0.035); fist.add(k); }
  const sl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.046, 0.32, 14), M(0x7a4b32, 0.9)); sl.rotation.x = Math.PI / 2; sl.position.z = 0.19; fist.add(sl);
  fist.visible = false; fist.traverse(o => { o.userData.noRay = true; o.raycast = () => { }; }); camera.add(fist);
}
function punch() { P.anim = { t: 0, dur: 0.34, at: 0.35, kind: 'punch', fire: punchHit }; Sfx.whoosh(); }
function updateFist() {
  const a = P.anim, on = !!(a && a.kind === 'punch'); if (fist.visible !== on) fist.visible = on; if (!on) return;
  const k = Math.min(1, a.t / a.dur), ext = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
  fist.position.set(0.2 - 0.14 * ext, -0.26 + 0.12 * ext, -0.3 - 0.32 * ext); fist.rotation.set(0.1, 0.25 - 0.2 * ext, 0);
}
function punchHit() {
  const h = firstHit(1.6); if (!h) return;
  const io = findIntDeep(h.object), lab = io ? labelOf(io.userData.int) || '' : '';
  P.shake = 0.15;
  if (/door/i.test(lab) && !/oven|microwave|fridge|freezer|cabinet|dishwasher|washer|dryer|shower|closet|pizza|laptop/i.test(lab)) { Sfx.knock(); return; }
  const r = ctx.rootOf(h.object);
  if (r && r.userData.item && r.userData.item.food) { Sfx.thud(); return; } // never knock food off the table
  if (r && r !== held && r.userData.item && CATALOG[r.userData.item.t].small) { // bonk: nudge it away and give it a wobble
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); r.position.x += fx * 0.07; r.position.z += fz * 0.07;
    r.rotation.y += rand(-0.5, 0.5);
    Object.assign(r.userData.item, { x: r.position.x, z: r.position.z, r: r.rotation.y }); r.userData.wiggle = 0.6; itemBox(r); Sfx.thud(); Sfx.noise(0.1, 0.2, 1200, 1); return;
  }
  Sfx.thud();
}

// ---- sliding block puzzle (the red present under the tree) ----
const Puzzle = { d: null, onSolve: null, onChange: null, t0: 0, done: false, tiles: [], blank() { return Puzzle.d ? Puzzle.d.pz.indexOf(0) : -1; } };
const pzNbrs = (i) => [i - 3, i + 3, i % 3 ? i - 1 : -1, i % 3 < 2 ? i + 1 : -1].filter(k => k >= 0 && k < 9);
const pzSolved = (a) => a.every((v, i) => v === (i < 8 ? i + 1 : 0));
function shufflePz() { // random legal slides from the solved board, so it is always solvable (and quick: about a minute)
  const a = [1, 2, 3, 4, 5, 6, 7, 8, 0]; let b = 8, prev = -1;
  for (let i = 0; i < 36 || pzSolved(a); i++) { const n = pzNbrs(b).filter(k => k !== prev); const k = n[(Math.random() * n.length) | 0]; a[b] = a[k]; a[k] = 0; prev = b; b = k; }
  return a;
}
(function buildPzBoard() {
  const board = $('#pzBoard'), url = puzzlePicture().toDataURL();
  for (let n = 1; n <= 8; n++) {
    const t = document.createElement('button'); t.className = 'pztile'; t.setAttribute('aria-label', 'Tile ' + n);
    t.style.backgroundImage = `url(${url})`; t.style.backgroundPosition = `${((n - 1) % 3) * 50}% ${Math.floor((n - 1) / 3) * 50}%`; t.innerHTML = `<span>${n}</span>`;
    t.addEventListener('pointerdown', (e) => { e.preventDefault(); slidePz(Puzzle.d.pz.indexOf(n)); });
    board.appendChild(t); Puzzle.tiles.push(t);
  }
  $('#puzzle').addEventListener('pointerdown', (e) => { if (e.target === $('#puzzle')) closePuzzle(); }); // tap outside the board to put it down
  $('#pzClose').onclick = closePuzzle;
  $('#pzShuffle').onclick = () => { if (!Puzzle.d) return; Puzzle.d.pz = shufflePz(); Puzzle.d.moves = 0; Puzzle.d.secs = 0; Puzzle.t0 = performance.now(); Puzzle.done = false; renderPz(); Puzzle.onChange && Puzzle.onChange(); };
})();
function pzTime() { return (Puzzle.d.secs || 0) + (Puzzle.done ? 0 : (performance.now() - Puzzle.t0) / 1000); }
function renderPz() {
  const a = Puzzle.d.pz;
  Puzzle.tiles.forEach((t, k) => { const i = a.indexOf(k + 1); t.style.transform = `translate(${(i % 3) * 100}%, ${Math.floor(i / 3) * 100}%)`; });
  $('#pzStats').textContent = 'Moves ' + (Puzzle.d.moves || 0) + ' · ' + fmtClock(pzTime());
  $('#pzBoard').classList.toggle('solved', Puzzle.done);
}
const fmtClock = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
function openPuzzle(d, onSolve, onChange) {
  if (!d.pz) { d.pz = shufflePz(); d.moves = 0; d.secs = 0; }
  Object.assign(Puzzle, { d, onSolve, onChange, t0: performance.now(), done: false });
  $('#pzMsg').textContent = 'Slide the tiles back into the picture. Tap a tile next to the gap' + (isTouch ? '.' : ' (or use the arrow keys).');
  renderPz(); $('#puzzle').hidden = false; unlock();
  clearInterval(Puzzle.timer); Puzzle.timer = setInterval(() => { if (Puzzle.d && !Puzzle.done) $('#pzStats').textContent = 'Moves ' + (Puzzle.d.moves || 0) + ' · ' + fmtClock(pzTime()); }, 500);
}
function closePuzzle() {
  if ($('#puzzle').hidden) return; clearInterval(Puzzle.timer);
  if (Puzzle.d && !Puzzle.done) Puzzle.d.secs = pzTime(); // keep your progress for next time
  $('#puzzle').hidden = true; Puzzle.d = null; tryLock();
}
function slidePz(i) {
  const d = Puzzle.d; if (!d || Puzzle.done) return; const b = d.pz.indexOf(0);
  if (!pzNbrs(b).includes(i)) { Sfx.tone(260, 0.06, 'square', 0.03); return; }
  d.pz[b] = d.pz[i]; d.pz[i] = 0; d.moves = (d.moves || 0) + 1; Sfx.noise(0.06, 0.18, 1400, 2); Sfx.tone(320 + Math.random() * 40, 0.05, 'sine', 0.05);
  Puzzle.onChange && Puzzle.onChange();
  if (pzSolved(d.pz)) {
    Puzzle.done = true; const moves = d.moves, secs = pzTime(); renderPz();
    $('#pzMsg').textContent = '🎉 Solved in ' + moves + ' moves and ' + fmtClock(secs) + '!'; Sfx.chime(); setTimeout(() => Sfx.chime(), 260);
    const cb = Puzzle.onSolve; setTimeout(() => { d.pz = null; d.best = Math.min(d.best || 1e9, moves); closePuzzle(); cb && cb(moves, secs); }, 1300);
  } else renderPz();
}

// ---- driving the Corolla ----
const CAR_R = 1.12; const driveSet = new Set();
function carHit(x, z) {
  const y0 = A.GY + 0.28, y1 = A.GY + 1.25;
  for (const c of STATIC) {
    const b = c.box; if (!b || b.isEmpty() || b.max.y <= y0 || b.min.y >= y1) continue;
    const qx = clamp(x, b.min.x, b.max.x), qz = clamp(z, b.min.z, b.max.z);
    if ((x - qx) ** 2 + (z - qz) ** 2 < CAR_R * CAR_R) return true;
  }
  return false;
}
function enterCar() {
  const car = A.car; if (!car || P.drive || P.action) return;
  if (held) dropHeld();
  P.drive = { car }; P.sit = null; P.yaw = car.g.rotation.y; P.pitch = -0.04;
  driveSet.clear(); car.g.traverse(o => driveSet.add(o)); car.st.driving = true;
  car.st.snd = Sfx.loop('hum', () => car.g.position, 0.06);
  document.body.classList.add('driving');
  if (isTouch) { $('#tUse').textContent = 'Exit'; $('#tUseHeld').textContent = 'Horn'; $('#tGrab').textContent = 'Radio'; }
  $('#driveHud').hidden = false;
  toast(isTouch ? '🚗 Stick: drive & steer · Exit when stopped' : '🚗 W/S gas & reverse · A/D steer · left-click horn · right-click radio · E to get out');
  completeTask('drive'); Sfx.door(false);
}
function exitCar() {
  const car = P.drive && P.drive.car; if (!car) return;
  if (Math.abs(car.st.sp) > 2) return toast('Slow down to get out.');
  car.st.sp = 0; car.st.snd && car.st.snd.stop(); car.st.snd = null;
  if (car.st.radio) { car.st.radio.stop(); car.st.radio = null; }
  P.drive = null; driveSet.clear(); car.st.driving = false; document.body.classList.remove('driving');
  if (isTouch) { $('#tUse').textContent = 'Use'; $('#tUseHeld').textContent = 'Eat / Hit'; $('#tGrab').textContent = 'Grab / Drop'; }
  $('#driveHud').hidden = true;
  const g = car.g, side = _fwd.set(-1.6, 0, 0).applyAxisAngle(V3(0, 1, 0), g.rotation.y);
  let ex = g.position.x + side.x, ez = g.position.z + side.z;
  if (carHit(ex, ez)) { ex = g.position.x - side.x; ez = g.position.z - side.z; }
  P.pos.set(ex, A.groundAt(ex, ez, A.GY + 1), ez); P.vy = 0; Sfx.door(true);
}
function carHorn() { Sfx.tone(392, 0.45, 'square', 0.18); Sfx.tone(494, 0.45, 'square', 0.14); completeTask('horn'); }
function carRadio() {
  const car = P.drive && P.drive.car; if (!car) return;
  if (car.st.radio) { car.st.radio.stop(); car.st.radio = null; toast('📻 Radio off.'); }
  else { car.st.radio = Sfx.music(() => car.g.position, 0); toast('📻 Lo-fi on the radio.'); completeTask('music'); }
}
const _fwd = V3();
let fuelWarned = false, lastHudTxt = '';
function updateCar(dt) {
  const car = P.drive.car, st = car.st, g = car.g;
  let th = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
  let steer = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + joy.x;
  if (uiOpen() || P.action) { th = 0; steer = 0; }
  const area = A.areaAt(g.position.x, g.position.z, A.GY);
  const onRoad = area && area.id !== 'outside';
  const maxF = st.fuel <= 0 ? 2.2 : onRoad ? 16 : 6.5;
  const target = th > 0 ? th * maxF : th * 5;
  st.sp += clamp(target - st.sp, -1, 1) * (th !== 0 ? 9 : 4.5) * dt;
  if (th === 0 && Math.abs(st.sp) < 0.25) st.sp = 0;
  if (keys.Space) st.sp *= Math.max(0, 1 - 3.5 * dt);
  const dir = Math.abs(st.sp) > 0.05 ? Math.sign(st.sp) : 0;
  g.rotation.y -= steer * clamp(0.55 + Math.abs(st.sp) * 0.13, 0, 1.7) * dir * dt;
  _fwd.set(-Math.sin(g.rotation.y), 0, -Math.cos(g.rotation.y));
  const step = st.sp * dt, nx = g.position.x + _fwd.x * step, nz = g.position.z + _fwd.z * step;
  const noseX = nx + _fwd.x * 1.9 * dir, noseZ = nz + _fwd.z * 1.9 * dir;
  if (carHit(nx, nz) || carHit(noseX, noseZ)) { if (Math.abs(st.sp) > 3) { Sfx.thud(); P.shake = 0.25; } st.sp = -st.sp * 0.22; }
  else { g.position.x = clamp(nx, -235, 275); g.position.z = clamp(nz, -255, 25); }
  g.position.y = Math.min(A.groundAt(g.position.x, g.position.z, A.GY + 1), A.GY + 0.25);
  st.fuel = Math.max(0, st.fuel - Math.abs(step) * 0.00045);
  if (st.fuel < 0.15 && !fuelWarned && st.fuel > 0) { fuelWarned = true; toast('⛽ Low fuel! The BP is east on River Hwy, across the highway.'); }
  if (st.fuel <= 0 && Math.abs(st.sp) > 2.3) toast('⛽ Running on fumes…');
  car.wheels.forEach((w, i) => { w.rotation.x -= st.sp * dt / 0.32; if (i === 0 || i === 2) w.rotation.y = -steer * 0.4; });
  if (car.steer) car.steer.rotation.y = -steer * 0.55;
  if (st.snd) st.snd.setVol(0.05 + Math.abs(st.sp) / 16 * 0.22);
  const night = ctx.isNight(); st.lights.forEach((m, i) => m.emissiveIntensity = night ? (i < 2 ? 3 : 1.6) : (keys.Space && i >= 2 ? 2 : 0));
  // camera: driver seat, free look
  _cs.set(-0.42, 1.14, -0.12).applyAxisAngle(_up, g.rotation.y).add(g.position);
  camera.position.copy(_cs); camera.rotation.set(P.pitch + (P.shake > 0 ? (Math.random() - 0.5) * P.shake * 0.05 : 0), P.yaw, 0);
  if (P.shake > 0) P.shake -= dt;
  P.pos.set(g.position.x, g.position.y + 0.4, g.position.z); // keep ticks/lights centred on the car
  const mph = Math.abs(st.sp * 2.237) | 0, txt = mph + ' mph · ⛽ ' + Math.round(st.fuel * 100) + '%' + (st.radio ? ' · 📻' : '');
  if (txt !== lastHudTxt) { lastHudTxt = txt; $('#driveHud').textContent = txt; }
}
const _cs = V3(), _up = V3(0, 1, 0);

// ---- Simon says: the memory toy in the navy present ----
const Simon = { d: null, onWin: null, onPad: null, seq: [], at: 0, mode: 'idle', t: 0, round: 0, GOAL: 6 };
const SIMON_FREQ = [329.6, 392, 493.9, 587.3];
function simonBeep(i, dur = 0.32) { Sfx.tone(SIMON_FREQ[i], dur, 'triangle', 0.14); Simon.onPad && Simon.onPad(i); const pads = document.querySelectorAll('.spad'); pads.forEach((p, k) => p.classList.toggle('lit', k === i)); clearTimeout(Simon.litT); Simon.litT = setTimeout(() => { pads.forEach(p => p.classList.remove('lit')); Simon.onPad && Simon.onPad(-1); }, dur * 1000 * 0.75); }
function openSimon(d, onWin, onPad) {
  Object.assign(Simon, { d, onWin, onPad, seq: [], at: 0, mode: 'watch', t: 0, round: 0 });
  $('#simon').hidden = false; unlock();
  $('#sMsg').textContent = 'Watch the lights, then repeat them. Reach round ' + Simon.GOAL + ' to win!';
  simonNext();
}
function simonNext() {
  Simon.seq.push((Math.random() * 4) | 0); Simon.round = Simon.seq.length; Simon.at = 0; Simon.mode = 'watch';
  $('#sRound').textContent = 'Round ' + Simon.round + ' / ' + Simon.GOAL;
  let i = 0; clearInterval(Simon.player);
  Simon.player = setInterval(() => { if ($('#simon').hidden) return clearInterval(Simon.player); if (i >= Simon.seq.length) { clearInterval(Simon.player); Simon.mode = 'input'; $('#sMsg').textContent = 'Your turn!'; return; } simonBeep(Simon.seq[i++]); }, 560);
}
function simonPress(i) {
  if (Simon.mode !== 'input') return;
  simonBeep(i, 0.22);
  if (i !== Simon.seq[Simon.at++]) {
    Simon.mode = 'watch'; $('#sMsg').textContent = '❌ Oops — watch it again…'; Sfx.tone(140, 0.5, 'sawtooth', 0.12);
    const seq = Simon.seq; Simon.seq = seq; Simon.at = 0;
    setTimeout(() => { if ($('#simon').hidden) return; let k = 0; clearInterval(Simon.player); Simon.player = setInterval(() => { if (k >= seq.length) { clearInterval(Simon.player); Simon.mode = 'input'; $('#sMsg').textContent = 'Your turn!'; return; } simonBeep(seq[k++]); }, 560); }, 900);
    return;
  }
  if (Simon.at === Simon.seq.length) {
    if (Simon.round >= Simon.GOAL) {
      Simon.mode = 'idle'; $('#sMsg').textContent = '🏆 You win!'; Sfx.chime(); setTimeout(() => Sfx.chime(), 250);
      const cb = Simon.onWin, r = Simon.round; Simon.d.best = Math.max(Simon.d.best || 0, r);
      setTimeout(() => { closeSimon(); cb && cb(r); }, 1200);
      return;
    }
    Simon.mode = 'watch'; $('#sMsg').textContent = '✔ Nice!'; setTimeout(() => { if (!$('#simon').hidden) simonNext(); }, 700);
  }
}
function closeSimon() { if ($('#simon').hidden) return; clearInterval(Simon.player); clearTimeout(Simon.litT); Simon.onPad && Simon.onPad(-1); $('#simon').hidden = true; Simon.d = null; tryLock(); }
document.querySelectorAll('.spad').forEach((p, i) => p.addEventListener('pointerdown', (e) => { e.preventDefault(); simonPress(i); }));
$('#sClose').onclick = closeSimon;
$('#simon').addEventListener('pointerdown', (e) => { if (e.target === $('#simon')) closeSimon(); });

// ---- tasks ----
const TASKS = [
  ['coffee', 'Brew an espresso at the coffee bar'], ['cook', 'Cook something on the stove'], ['bake', 'Bake cookies in the oven'], ['tea', 'Boil the kettle for tea'], ['microwave', 'Heat leftovers in the microwave'],
  ['eat', 'Eat something'], ['order', 'Order food delivery on your phone'], ['dishes', 'Do the dishes'], ['tidy', 'Pick up a pile of clothes'], ['laundry', 'Wash, dry & fold laundry'], ['iron', 'Iron a shirt'],
  ['package', 'Open a package'],
  ['tv', 'Watch TV from the couch'], ['music', 'Put on some music'], ['tree', 'Switch the tree lights'], ['gift', 'Open a present'], ['plants', 'Water a plant'],
  ['outside', 'Step out onto the balcony'], ['shower', 'Take a shower'], ['teeth', 'Brush your teeth'], ['toilet', 'Use the toilet'], ['hands', 'Wash your hands'], ['outfit', 'Pick an outfit in the closet'],
  ['sleep', 'Sleep in your bed'], ['lights', 'Flip a light switch'], ['breaker', 'Flip the main breaker'], ['computer', 'Use the computer'], ['read', 'Look through the wedding album'],
  ['simon', 'Beat the memory game from under the tree'], ['text', 'Text somebody back'], ['work', 'Do some work on the laptop'], ['neighbor', 'Say hi to Marcus in 2B'], ['paydriver', 'Pay a delivery driver at the door'],
  ['drive', 'Take the Corolla for a drive'], ['horn', 'Honk the horn'], ['groceries', 'Buy groceries at Harris Teeter & put them away'], ['fuel', 'Fill up the tank at the BP'], ['garage', 'Get a check-up at the garage behind the BP'],
];
const done = new Set(store.get('tasks', []));
function completeTask(id) { if (done.has(id)) return; done.add(id); store.set('tasks', [...done]); const t = TASKS.find(t => t[0] === id); if (t) { toast('✅ ' + t[1] + '  (' + done.size + '/' + TASKS.length + ')', 'task'); Sfx.chime(); } updateHud(); }
function renderTasks() {
  $('#taskList').innerHTML = TASKS.map(([id, label]) => `<li class="${done.has(id) ? 'done' : ''}"><span class="box">${done.has(id) ? '✓' : ''}</span>${label}</li>`).join('');
  $('#taskCount').textContent = done.size + ' / ' + TASKS.length;
}

// ---- phone: contacts, texting, delivery, music, smart home ----
const orders = []; let phoneMusic = null;
const FOOD = [['🍕', 'Pizza', 'pizza', null, 35, 14], ['🍜', 'Thai food', 'takeout', 'Thai food', 40, 16], ['🍔', 'Burgers', 'takeout', 'Burgers', 30, 13], ['🌯', 'Burritos', 'takeout', 'Burritos', 30, 11]];
const CONTACTS = [
  { n: 'Lilah', e: '❤️', sub: 'Wife', chips: ['Love you ❤️', 'Want Thai tonight? 🍜', 'Come look at the tree with me 🎄', 'How\'s your day going?'], replies: [['Love you more!! See you at 6 ❤️'], ['YES. Extra spring rolls please 🥢'], ['Omw!! Put the fireplace on 🔥'], ['Long, but better now 😊 Miss you']] },
  { n: 'Joe', e: '🏀', sub: 'Little brother', chips: ['Game night Friday?', 'You seen the Hornets score? 😬', 'Come see the new place, man'], replies: [['BET. I\'m bringing the switch 🎮'], ['Bro don\'t even start 💀'], ['Pull up this weekend, I\'ll bring wings']] },
  { n: 'Mom', e: '🌼', sub: 'Mom', chips: ['Hi Mom ❤️', 'The tree looks great, sending pics!', 'Dinner Sunday still on?'], replies: [['Hi sweetheart! Eat something green today 🥦'], ['Send them!! Dad says hi 👋'], ['Of course! Bring Lilah, I\'m making the roast']] },
  { n: 'Marcus', e: '🏠', sub: 'Neighbor in 2B', needsMet: true, chips: ['Hey, it\'s your neighbor in 2A 👋', 'Panthers game this Sunday?', 'You need anything from Harris Teeter?'], replies: [['Hey! Knock any time, door\'s usually open'], ['I\'ve got the big TV. You bring the chips 🏈'], ['You\'re a legend — grab me some of that salsa']] },
  { n: 'DoorDash', e: '🛵', sub: 'Delivery updates', chips: ['Where\'s my order? 👀'], replies: [['Your dasher is on the way! 🛵']] },
  { n: 'Amazon', e: '📦', sub: 'Deliveries', chips: ['Where\'s my package? 📦'], replies: [['Out for delivery — it\'ll be at your door soon!']] },
  { n: 'Avalon Lake Norman', e: '🏢', sub: 'Leasing office', chips: ['When is rent due again?', 'The hallway light is out'], replies: [['Rent is due the 1st! Pay online any time 🙂'], ['Maintenance will stop by tomorrow — thanks for the heads up!']] },
];
const threads = store.get('threads', null) || {
  Lilah: [{ m: 0, b: 'Made it to work. The tree better be lit when I\'m home 🎄', t: '8:40 AM' }],
  Joe: [{ m: 0, b: 'yo send pics of the new place', t: '8:15 AM' }],
  Mom: [{ m: 0, b: 'How\'s the new place? Send pics of the tree! 🎄', t: '8:02 AM' }],
};
const unread = new Set(store.get('unread', []));
const pendingReplies = [];
const totalMin = () => P.dayNum * 1440 + P.minutes;
function saveThreads() { const trim = {}; for (const k in threads) trim[k] = threads[k].slice(-30); store.set('threads', trim); store.set('unread', [...unread]); }
function addText(from, body) {
  (threads[from] = threads[from] || []).push({ m: 0, b: body, t: fmtTime(P.minutes) });
  unread.add(from); saveThreads(); $('#phoneBadge').hidden = false;
  Sfx.tone(1320, 0.08, 'sine', 0.1); Sfx.tone(1760, 0.1, 'sine', 0.1, 0, 0.1);
  if ($('#phone').hidden) toast('💬 ' + from + ': ' + (body.length > 44 ? body.slice(0, 44) + '…' : body));
  else if (phoneView === 't:' + from) phoneApp(phoneView); else if (phoneView === 'msgs') phoneApp('msgs');
}
function sendText(to, body) {
  (threads[to] = threads[to] || []).push({ m: 1, b: body, t: fmtTime(P.minutes) }); saveThreads(); completeTask('text');
  Sfx.noise(0.06, 0.15, 3200, 2);
}
function queueReply(name, lines, delayMin = 2) { pendingReplies.push({ name, lines: [].concat(lines), at: totalMin() + delayMin + Math.random() * 2 }); }
function togglePhone() { $('#phone').hidden ? openPhone() : closePhone(); }
function openPhone(app = 'home') { $('#phone').hidden = false; unlock(); phoneApp(app); Sfx.click(); }
function closePhone() { $('#phone').hidden = true; tryLock(); }
const back = (to = 'home', lbl = '← Home') => `<button class="backbtn" data-back="${to}">${lbl}</button>`;
const esc = (t) => t.replace(/</g, '&lt;');
let phoneView = 'home';
function phoneApp(app) {
  phoneView = app;
  const scr = $('#phoneScreen'); $('#phoneTime').textContent = fmtTime(P.minutes);
  if (app === 'home') {
    scr.innerHTML = `<div class="weather"><strong>${ctx.isNight() ? '🌙' : '☀️'} ${ctx.isNight() ? 49 : 61}°F</strong><span>Lake Norman · ${ctx.isNight() ? 'Clear night' : 'Crisp and sunny'}</span><strong class="cash">💵 $${P.cash}</strong></div>
      <div class="apps"><button data-app="food"><i>🛵</i>Food</button><button data-app="music"><i>🎧</i>Music</button><button data-app="home2"><i>🏠</i>Home</button><button data-app="msgs"><i>💬</i>Messages${unread.size ? '<em class="dot"></em>' : ''}</button><button data-app="todo"><i>☑️</i>To-dos</button></div>
      ${orders.length ? `<div class="pill2">🛵 ${orders.map(o => o.name + ' arriving ' + fmtTime(o.eta)).join('<br>')}</div>` : ''}`;
  } else if (app === 'food') {
    scr.innerHTML = `<h3>Order delivery · 💵 $${P.cash}</h3><p class="sub">A dasher brings it to your door — say hi and pay there.</p>` + FOOD.map((f, i) => `<button class="row" data-order="${i}"><i>${f[0]}</i><span><b>${f[1]} · $${f[5]}</b><small>About ${f[4]} min</small></span></button>`).join('') + back();
  } else if (app === 'music') {
    scr.innerHTML = `<h3>Music</h3><p class="sub">${phoneMusic ? '▶ Playing: lo-fi fall beats' : 'Nothing playing'}</p><button class="row" data-music="1"><i>${phoneMusic ? '⏸' : '▶'}</i><span><b>${phoneMusic ? 'Pause' : 'Play lo-fi fall beats'}</b></span></button>` + back();
  } else if (app === 'home2') {
    const anyOn = Object.values(A.lights).some(L => L.on);
    scr.innerHTML = `<h3>Smart home</h3><button class="row" data-home="lights"><i>💡</i><span><b>${anyOn ? 'All lights off' : 'All lights on'}</b><small>Every room</small></span></button>
      <button class="row" data-home="lock"><i>${A.doorById.front.locked ? '🔓' : '🔒'}</i><span><b>${A.doorById.front.locked ? 'Unlock' : 'Lock'} front door</b><small>Currently ${A.doorById.front.locked ? 'locked' : 'unlocked'}</small></span></button>
      <button class="row" data-home="warm"><i>🌡</i><span><b>Thermostat ${A.temp}°F</b><small>Tap to warm up 1°</small></span></button>` + back();
  } else if (app === 'msgs') {
    const rows = CONTACTS.filter(c => !c.needsMet || store.get('metMarcus', false)).map(c => {
      const th = threads[c.n] || [], last = th[th.length - 1];
      return `<button class="row" data-thread="${c.n}"><i>${c.e}</i><span><b>${c.n}${unread.has(c.n) ? ' <em class="dot"></em>' : ''}</b><small>${last ? (last.m ? 'You: ' : '') + esc(last.b).slice(0, 38) : c.sub}</small></span></button>`;
    }).join('');
    scr.innerHTML = `<h3>Messages</h3>` + rows + back();
  } else if (app.startsWith('t:')) {
    const name = app.slice(2); unread.delete(name); saveThreads(); if (![...unread].length) $('#phoneBadge').hidden = true;
    const c = CONTACTS.find(k => k.n === name), th = threads[name] || [];
    scr.innerHTML = `<h3>${c ? c.e + ' ' : ''}${name}</h3><div class="thread">` +
      th.slice(-14).map(m => `<div class="bub ${m.m ? 'me' : 'them'}">${esc(m.b)}<small>${m.t}</small></div>`).join('') +
      `</div><div class="chips">` + (c ? c.chips.map((ch, i) => `<button class="chip" data-chip="${i}">${esc(ch)}</button>`).join('') : '') + `</div>` + back('msgs', '← Messages');
    const tEl = scr.querySelector('.thread'); if (tEl) tEl.scrollTop = 1e6;
    scr.querySelectorAll('[data-chip]').forEach(b2 => b2.onclick = () => {
      const i = +b2.dataset.chip; sendText(name, c.chips[i]);
      queueReply(name, c.replies[i] || c.replies[0], 1 + Math.random() * 2);
      phoneApp(app);
    });
  } else if (app === 'todo') {
    scr.innerHTML = `<h3>To-dos · ${done.size}/${TASKS.length}</h3>` + TASKS.filter(t => !done.has(t[0])).slice(0, 9).map(t => `<div class="msg"><p>☐ ${t[1]}</p></div>`).join('') + back();
  }
  scr.querySelectorAll('[data-app]').forEach(b => b.onclick = () => { Sfx.click(); phoneApp(b.dataset.app); });
  scr.querySelectorAll('[data-thread]').forEach(b => b.onclick = () => { Sfx.click(); phoneApp('t:' + b.dataset.thread); });
  scr.querySelectorAll('[data-order]').forEach(b => b.onclick = () => { const f = FOOD[+b.dataset.order]; orders.push({ name: f[1], type: f[2], label: f[3], eta: (P.minutes + f[4]) % 1440, left: f[4], cost: f[5] }); toast('🛵 ' + f[1] + ' ordered ($' + f[5] + ' at the door). About ' + f[4] + ' min.'); addText('DoorDash', 'Order confirmed: ' + f[1] + ' · $' + f[5] + '. Your dasher will be there around ' + fmtTime((P.minutes + f[4]) % 1440) + '.'); completeTask('order'); phoneApp('home'); });
  scr.querySelectorAll('[data-music]').forEach(b => b.onclick = () => { if (phoneMusic) { phoneMusic.stop(); phoneMusic = null; } else { phoneMusic = Sfx.music(null, 0); completeTask('music'); } phoneApp('music'); });
  scr.querySelectorAll('[data-home]').forEach(b => b.onclick = () => {
    const k = b.dataset.home;
    if (k === 'lights') { const anyOn = Object.values(A.lights).some(L => L.on); for (const L of Object.values(A.lights)) L.on = !anyOn; completeTask('lights'); }
    if (k === 'lock') { const f = A.doorById.front; if (f.open) toast('Close the front door first.'); else f.locked = !f.locked; }
    if (k === 'warm') { A.temp = Math.min(78, A.temp + 1); }
    Sfx.beep(1, 1800); phoneApp('home2');
  });
  scr.querySelectorAll('[data-back]').forEach(b => b.onclick = () => phoneApp(b.dataset.back));
}

// ---- random life events + the delivery driver ----
let nextPackage = 60 * (2 + Math.random() * 3), nextText = 40;
function spawnAtDoor(type, d) { return spawnItem({ id: uid(), t: type, x: 8.05 + Math.random() * 0.2, y: 0, z: 7.3 + Math.random() * 0.4, r: Math.random() * 3, d }); }
let driver = null;
function removeDriver() { if (!driver) return; TICKS = TICKS.filter(t => t.owner !== driver.p.g); driver.p.g.parent && driver.p.g.parent.remove(driver.p.g); driver = null; }
function makeDriver(o) {
  const p = makePerson({ shirt: 0xd93a35, pants: 0x222831, skin: [0xe2b08a, 0xc98a5e, 0x8a5a3a][(Math.random() * 3) | 0], hair: 0x241a10, hat: 0xd93a35 });
  p.g.position.set(8.7, 0, 5.75); A.world.add(p.g);
  const bag = G(p.g, 0.3, 0.9, 0.18); B(bag, 0.24, 0.26, 0.16, M(0xc9a27a, 0.95), 0, 0, 0); B(bag, 0.24, 0.03, 0.16, M(0xa9875f, 0.95), 0, 0.26, 0);
  const D = { p, o, bag, state: 'in', path: [[8.7, 6.7], [8.22, 7.42]], waitMin: 0, rung: false };
  ctx.interact(p.g, {
    reach: 2.8, cook: true,
    label: () => D.state === 'wait' ? 'Say hi & pay $' + o.cost + ' for the ' + o.name.toLowerCase() + ' 💵' : '',
    action: () => {
      if (D.state !== 'wait') return;
      const paid = P.cash >= o.cost; if (paid) { P.cash -= o.cost; updateCash(); toast('💵 -$' + o.cost + ' · ' + o.name); } else toast('💳 Covered by app credit (cash is low).');
      p.say(['Enjoy! Stay warm out there.', 'Have a good one!', 'Careful, it\'s hot!'][(Math.random() * 3) | 0]);
      spawnAtDoor(o.type, o.label ? { label: o.label } : {});
      addText('DoorDash', 'Delivered! Enjoy your ' + o.name.toLowerCase() + '. 🛵');
      completeTask('paydriver'); ctx.need('fun', 0.05);
      D.state = 'out'; D.path = [[8.7, 6.4], [8.7, 5.7]];
    }
  });
  ctx.tick(p.g, (dt, t) => {
    if (D.state === 'in') { if (walkPerson(p, dt, t, D.path, 1.25)) { D.state = 'wait'; p.g.rotation.y = Math.PI / 2 + 0.2; Sfx.doorbell(); setTimeout(() => Sfx.knock(), 1100); toast('🛎 The dasher is at your door with the ' + o.name.toLowerCase() + ' — say hi and pay!'); } }
    else if (D.state === 'wait') { animPerson(p, dt, t, 0); bag.position.y = 0.9 + Math.sin(t * 2) * 0.01; }
    else if (D.state === 'out') { if (walkPerson(p, dt, t, D.path, 1.5)) removeDriver(); }
  });
  return D;
}
function updateEvents(gameMin) {
  for (let i = orders.length - 1; i >= 0; i--) {
    const o = orders[i]; o.left -= gameMin;
    if (o.left <= 0) {
      orders.splice(i, 1);
      if (!driver) { driver = makeDriver(o); addText('DoorDash', 'Your dasher is at the door! 🛵'); }
      else { spawnAtDoor(o.type, o.label ? { label: o.label } : {}); Sfx.doorbell(); toast('🔔 Your ' + o.name.toLowerCase() + ' order was left at the front door.'); addText('DoorDash', 'Your ' + o.name + ' was left at your door. Enjoy!'); }
    }
  }
  if (driver && driver.state === 'wait') { driver.waitMin += gameMin; if (driver.waitMin > 120) { spawnAtDoor(driver.o.type, driver.o.label ? { label: driver.o.label } : {}); addText('DoorDash', 'We left your order at the door — no charge this time. 💙'); driver.state = 'out'; driver.path = [[8.7, 6.4], [8.7, 5.7]]; } }
  for (let i = pendingReplies.length - 1; i >= 0; i--) { const r = pendingReplies[i]; if (totalMin() >= r.at) { pendingReplies.splice(i, 1); addText(r.name, r.lines[(Math.random() * r.lines.length) | 0]); } }
  nextPackage -= gameMin;
  if (nextPackage <= 0) { nextPackage = 60 * (5 + Math.random() * 6); if (hour() > 8 && hour() < 20) { spawnAtDoor('package', {}); Sfx.knock(); toast('📦 *knock knock* A package was left at your door.'); addText('Amazon', 'Delivered: your package is at the front door.'); } }
  nextText -= gameMin;
  if (nextText <= 0) {
    nextText = 60 * (2 + Math.random() * 4);
    const pool = [['Mom', 'How are you two doing? Send pics! 🎄'], ['Lilah', 'Did you remember to water the plants? 🪴'], ['Lilah', 'Want to order Thai tonight?'], ['Joe', 'Game night this weekend?'], ['Avalon Lake Norman', 'Reminder: the fitness center is open 24/7.'], ['Lilah', 'Can you start the laundry? 🧺'], ['Joe', 'bro the Hornets are COOKING rn 🏀']];
    if (store.get('metMarcus', false)) pool.push(['Marcus', 'Heard you moving furniture — need a hand?'], ['Marcus', 'Grabbing wings later if you want in 🍗']);
    const m = pool[(Math.random() * pool.length) | 0]; addText(m[0], m[1]);
  }
}

// ---- toast / fade ----
let toastTimer = 0;
function toast(t, kind) { const el = $('#toast'); el.textContent = t; el.className = 'glass show ' + (kind || ''); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.className = 'glass', 3600); }
function fade(mid) { const f = $('#fade'); f.classList.add('on'); setTimeout(() => { mid(); setTimeout(() => f.classList.remove('on'), 500); }, 1100); }

// ---- menu ----
function openMenu(section) { $('#menu').hidden = false; unlock(); document.querySelectorAll('.msec').forEach(s => s.hidden = section ? s.dataset.sec !== section : s.dataset.sec !== 'main'); }
function closeMenu() { $('#menu').hidden = true; tryLock(); }
$('#resume').onclick = closeMenu;
document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openMenu(b.dataset.open));
$('#mTasks').onclick = () => { $('#menu').hidden = true; renderTasks(); $('#tasks').hidden = false; };
$('#mPhone').onclick = () => { $('#menu').hidden = true; openPhone(); };
$('#taskChip').onclick = () => { renderTasks(); $('#tasks').hidden = false; unlock(); };
$('#cashChip').onclick = () => { openPhone(); };
$('#closeTasks').onclick = () => { $('#tasks').hidden = true; tryLock(); };
$('#closePhone').onclick = closePhone;
$('#sens').value = settings.sens; $('#sens').oninput = (e) => { settings.sens = +e.target.value; store.set('settings', settings); };
$('#invert').checked = settings.invert; $('#invert').onchange = (e) => { settings.invert = e.target.checked; store.set('settings', settings); };
$('#quality').value = settings.quality; $('#quality').onchange = (e) => { settings.quality = e.target.value; applyQuality(); resize(); store.set('settings', settings); };
$('#mute').checked = settings.muted; $('#mute').onchange = (e) => { settings.muted = e.target.checked; Sfx.setMuted(settings.muted); store.set('settings', settings); };
$('#resetTasks').onclick = () => { done.clear(); store.set('tasks', []); P.needs = { hunger: 0.7, energy: 0.75, hygiene: 0.65, bladder: 0.7, fun: 0.6 }; P.minutes = 9 * 60; P.dayNum = 1; renderTasks(); updateHud(); toast('Fresh start: Day 1, 9:00 AM.'); };

// ---- start ----
$('#enter').onclick = () => {
  Sfx.init(); Sfx.setMuted(settings.muted); $('#start').hidden = true; tryLock();
  toast(isTouch ? 'Drag to look, joystick to walk, tap Use on things.' : 'WASD walk · right-click use · left-click eat / hit · E pick up · Esc menu');
  setTimeout(() => toast('☕ Good morning! How about an espresso at the coffee bar?'), 6000);
};

// ---- touch controls ----
document.body.classList.toggle('touch', isTouch);
if (isTouch) {
  const stick = $('#stick'), knob = $('#knob'); let sid = null, sc = null;
  stick.addEventListener('touchstart', e => { const t = e.changedTouches[0]; sid = t.identifier; const r = stick.getBoundingClientRect(); sc = [r.left + r.width / 2, r.top + r.height / 2]; e.preventDefault(); }, { passive: false });
  let lookId = null, lp = null, ltime = 0, lmoved = 0;
  addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === sid) { let dx = (t.clientX - sc[0]) / 62, dy = (t.clientY - sc[1]) / 62; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.x = dx; joy.y = dy; knob.style.transform = `translate(${dx * 46}px,${dy * 46}px)`; }
      if (t.identifier === lookId) { const dx = t.clientX - lp[0], dy = t.clientY - lp[1]; lmoved += Math.abs(dx) + Math.abs(dy); look(dx * 1.6, dy * 1.6); lp = [t.clientX, t.clientY]; }
    }
  }, { passive: true });
  addEventListener('touchend', e => { for (const t of e.changedTouches) { if (t.identifier === sid) { sid = null; joy.x = joy.y = 0; knob.style.transform = ''; } if (t.identifier === lookId) { lookId = null; if (lmoved < 10 && performance.now() - ltime < 300) primary(); } } });
  canvas.addEventListener('touchstart', e => { Sfx.init(); const t = e.changedTouches[0]; if (lookId === null) { lookId = t.identifier; lp = [t.clientX, t.clientY]; ltime = performance.now(); lmoved = 0; } }, { passive: true });
  const btn = (id, fn) => { const el = $(id); el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); Sfx.init(); fn(); }, { passive: false }); };
  btn('#tUse', primary); btn('#tGrab', () => held ? (placeTarget ? placeHeld() : dropHeld()) : pickUp()); btn('#bigAct', () => primary()); btn('#bigAlt', () => leftAction()); btn('#tUseHeld', leftAction); btn('#tJump', () => { if (P.pos.y === 0) P.vy = 3.6; if (P.sit && !P.sit.locked) { P.pos.copy(P.sit.prev); P.sit = null; } });
  btn('#tCrouch', () => { P.crouchToggle = !P.crouchToggle; $('#tCrouch').classList.toggle('on', P.crouchToggle); }); btn('#tMenu', () => openMenu()); btn('#tPhone', () => togglePhone());
}

// ---- HUD ----
function updateHud() {
  for (const k of NEEDS) { const el = $('#n_' + k); if (el) { el.style.width = (P.needs[k] * 100) + '%'; el.parentNode.parentNode.classList.toggle('low', P.needs[k] < 0.2); } }
  const m = mood(); $('#mood').textContent = m[0] + ' ' + m[1];
  $('#taskChip').textContent = '✓ ' + done.size + '/' + TASKS.length;
  updateCash();
}
function updateCash() { const el = $('#cashChip'); if (el && el.textContent !== '$' + P.cash) el.textContent = '$' + P.cash; }
const seenAreas = new Set(store.get('areas', []));
let lastAreaId = null;
function areaPulse() {
  const a = A.areaAt && A.areaAt(P.pos.x, P.pos.z, P.pos.y);
  if (!a) { lastAreaId = null; return a; }
  if (a.id !== lastAreaId) { lastAreaId = a.id; if (a.tip && !seenAreas.has(a.id)) { seenAreas.add(a.id); store.set('areas', [...seenAreas]); toast(a.tip); } }
  return a;
}
let lastPrompt = null;
// big pop-up action for cooking: a tap target on phones, a large card on desktop
const KITCHEN_ITEMS = new Set(['pan', 'kettle', 'toaster', 'espresso', 'fruit_bowl', 'pizza', 'takeout', 'stand_mixer']);
let lastBig = null, lastBigAlt = null;
function bigAction() {
  if (P.action || (P.anim && P.anim.kind !== 'punch')) return '';
  if (held && held.userData.item.food && placeTarget) return '⬇ Set it down here';
  if (!hover || !hover.int) return '';
  const r = hover.root, t = r && r.userData.item.t, food = r && r.userData.item.food;
  if (!(hover.int.cook || KITCHEN_ITEMS.has(t) || food)) return '';
  const lab = labelOf(hover.int); return lab || '';
}
function updatePrompt() {
  const big = bigAction(), alt = big && isTouch && !held && hover && hover.int && hover.int.alt ? labelOf(hover.int, 'altLabel') : '';
  if (big !== lastBig || alt !== lastBigAlt) {
    lastBig = big; lastBigAlt = alt; $('#bigRow').hidden = !big; document.body.classList.toggle('hasbig', !!big);
    if (big) $('#bigAct').innerHTML = (isTouch ? '' : '<b>Right-click</b>') + '<span>' + big + '</span>';
    $('#bigAlt').hidden = !alt; if (alt) $('#bigAlt').textContent = '↻ ' + alt;
  }
  const pr = EL.prompt; let html = '';
  const RK = isTouch ? 'Use' : 'Right-click', LK = isTouch ? 'Eat/Hit' : 'Left-click', QK = isTouch ? 'Grab' : 'Q';
  if (!P.action && !(P.anim && P.anim.kind !== 'punch')) {
    if (hover && hover.int) { const lab = labelOf(hover.int); if (lab && !big) html = `<b>${RK}</b> ${lab}`; const al = hover.int.alt && labelOf(hover.int, 'altLabel'); if (al) html += ` <b>${LK}</b> ${al}`; }
    const af = !held && hover && hover.root && hover.root.userData.item.food; if (af && !(af.empty && af.empty()) && hover.root.userData.item.d.left > 0) html = `<b>${LK}</b> or <b>${RK}</b> ${af.mode === 'drink' ? 'take a sip' : af.verb} (${hover.root.userData.item.d.left} left)`;
    if (!html && !(hover && hover.int)) { const nd = nearDoor(); if (nd) html = `<b>${RK}</b> ${nd.def.label()}`; }
    if (!held && hover && hover.root && CATALOG[hover.root.userData.item.t].small) html += (html ? ' · ' : '') + (isTouch ? '<b>Grab</b> to pick up' : 'Press <b>E</b> to pick up');
    if (held) {
      const d = CATALOG[held.userData.item.t], i = held.userData.item, F = i.food; let use = '';
      if (F && !(F.empty && F.empty()) && i.d.left > 0) use = ` <b>${LK}</b> ${F.mode === 'drink' ? 'sip' : F.verb} (${i.d.left} left)`; else if (i.handUse) use = ` <b>${LK}</b> ${i.handLabel || 'use'}`;
      const nm = F && F.name !== 'drink' && F.name !== 'food' ? F.name.charAt(0).toUpperCase() + F.name.slice(1) : d.name;
      html += (html ? ' · ' : '') + `<span class="nm">${nm}</span>${use} ${sinkBlocked ? 'Not in the sink — use the counter' : big ? '' : `<b>${RK}</b> set down`} <b>${QK}</b> drop`;
    }
    if (!html && P.sit) html = P.sit.lie ? 'Resting… move to get up' : 'Move to stand up';
  }
  html = html.trim(); if (html !== lastPrompt) { lastPrompt = html; pr.innerHTML = html; pr.hidden = !html; }
  document.body.classList.toggle('canuse', !!(hover && hover.int));
}

// ---- day / night from the clock ----
const daySky = new THREE.Color(0xcfe3f5), nightSky = new THREE.Color(0x0a1220), duskSky = new THREE.Color(0xf0a070);
function updateDay(dt) {
  P.dayTarget = dayFactor(); P.day = lerp(P.day, P.dayTarget, Math.min(1, dt * 2)); const d = P.day;
  sun.intensity = 2.0 * d; hemi.intensity = 0.12 + 0.85 * d; scene.environmentIntensity = 0.05 + 0.24 * d;
  hemi.color.setRGB(lerp(0.25, 0.87, d), lerp(0.3, 0.92, d), lerp(0.45, 0.97, d));
  const dusk = Math.max(0, 1 - Math.abs(d - 0.5) * 2.2);
  A.sky.material.color.setRGB(lerp(0.05, 1, d), Math.max(0, lerp(0.07, 1, d) - dusk * 0.12), Math.max(0, lerp(0.14, 1, d) - dusk * 0.25)); scene.fog.color.copy(nightSky).lerp(daySky, d).lerp(duskSky, dusk * 0.4);
  A.stars.material.opacity = 1 - d; A.streetLamps.forEach(m => m.emissiveIntensity = (1 - d) * 3);
  const vo = (0.15 + clamp((0.25 - P.needs.energy) / 0.25, 0, 1) * 0.6).toFixed(2); if (vo !== EL.vignette._o) { EL.vignette._o = vo; EL.vignette.style.opacity = vo; }
  const wo = flags.showering ? '1' : '0'; if (wo !== EL.wet._o) { EL.wet._o = wo; EL.wet.style.opacity = wo; }
}

// ---- main loop ----
let last = performance.now(), clockT = 0, hudAcc = 0, saveAcc = 0, pausedDrawn = false;
const perf = { logic: 0, render: 0 };
const _pp = V3();
function runTicks(dt) {
  frameNo++; ticksRun = 0; const px = P.pos.x, pz = P.pos.z;
  for (let i = 0; i < TICKS.length; i++) {
    const e = TICKS[i]; e.acc += dt;
    if (!e.always) { const m = e.owner.matrixWorld.elements, dx = m[12] - px, dz = m[14] - pz; if (dx * dx + dz * dz > NEAR_R2 && (frameNo % FAR_STRIDE) !== e.slot) continue; }
    const step = e.acc; e.acc = 0; ticksRun++;
    try { e.fn(step, clockT); } catch (err) { console.error(err); TICKS.splice(i--, 1); }
  }
}
function frame(now) {
  requestAnimationFrame(frame);
  const rawMs = now - last; const dt = Math.min(0.1, rawMs / 1000); last = now;
  // menus, phone and to-do list freeze the world: draw one last frame, then skip all work
  if (uiFreezes()) { if (pausedDrawn) { stats.paused = true; recordFrame(rawMs, 0, 0); return; } pausedDrawn = true; } else pausedDrawn = false;
  stats.paused = false; clockT += dt;
  const pf0 = performance.now();
  const playing = EL.start.hidden && EL.menu.hidden;
  const gameMin = playing ? dt : 0; // 1 real second = 1 game minute
  if (playing) { advanceTime(gameMin); updateNeeds(dt, gameMin); updateEvents(gameMin); }
  for (const c of STATIC) if (c.upd) c.upd();
  applyDragLook(dt); updatePlayer(dt); camera.updateMatrixWorld();
  updateAction(dt);
  castFrame(); updateHover(); updateAnim(dt); updateHeld(dt); updateFist(); updatePrompt(); Crumbs.update(dt);
  runTicks(playing ? dt : 0);
  for (let i = TWEENS.length - 1; i >= 0; i--) if (TWEENS[i](now)) TWEENS.splice(i, 1);
  updateLightPool(dt);
  for (const g of itemsGroup.children) if (g.userData.wiggle > 0) { g.userData.wiggle -= dt; g.scale.setScalar(1 + Math.sin(g.userData.wiggle * 20) * 0.03 * g.userData.wiggle); }
  updateDay(dt);
  if (P.caffeine > 0) P.caffeine -= dt;
  if ((hudAcc += dt) > 0.4) { hudAcc = 0; updateHud(); const r = roomAt(P.pos.x, P.pos.z); const area = areaPulse(); $('#roomName').textContent = A.inTower && A.inTower(P.pos.x, P.pos.z) ? 'Stairwell' : P.pos.y > -1.4 && ROOMS[r] ? ROOMS[r].name : (P.pos.y > -1.4 && P.pos.x > 9.9 && P.pos.x < 14.1 && P.pos.z > 5.5 ? "Marcus's place · 2B" : P.pos.y > -1.4 ? 'Stairwell' : area ? area.n : 'Outside'); $('#clock').textContent = (ctx.isNight() ? '🌙 ' : '☀️ ') + 'Day ' + P.dayNum + ' · ' + fmtTime(P.minutes); }
  if ((saveAcc += dt) > 10) { saveAcc = 0; store.set('state', { needs: P.needs, minutes: P.minutes, dayNum: P.dayNum, cash: P.cash }); }
  Sfx.updateLoops(camera.position);
  const pf1 = performance.now();
  renderer.render(scene, camera);
  const pf2 = performance.now();
  perf.logic = lerp(perf.logic, pf1 - pf0, 0.1); perf.render = lerp(perf.render, pf2 - pf1, 0.1);
  recordFrame(rawMs, pf1 - pf0, pf2 - pf1);
}

// ---- F3 performance overlay ----
const stats = { show: !!settings.perf, frames: [], logic: [], render: [], paused: false, lastDraw: 0 };
function recordFrame(ms, logic, render) {
  if (!stats.show) return;
  const now = performance.now(); stats.frames.push([now, ms, logic, render]);
  while (stats.frames.length && now - stats.frames[0][0] > 1000) stats.frames.shift();
  if (now - stats.lastDraw < 250) return; stats.lastDraw = now;
  const f = stats.frames, n = f.length || 1; let sum = 0, worst = 0, lg = 0, rd = 0; for (const x of f) { sum += x[1]; worst = Math.max(worst, x[1]); lg += x[2]; rd += x[3]; }
  const i = renderer.info;
  EL.perf.textContent = `FPS ${(1000 / (sum / n)).toFixed(0)}${stats.paused ? '  (paused)' : ''}
frame ${(sum / n).toFixed(1)} ms  worst ${worst.toFixed(1)} ms
logic ${(lg / n).toFixed(2)} ms  render ${(rd / n).toFixed(2)} ms
draw calls ${i.render.calls}  tris ${(i.render.triangles / 1000).toFixed(0)}k
programs ${i.programs.length}  tex ${i.memory.textures}  geo ${i.memory.geometries}
updates ${ticksRun}/${TICKS.length}  split-out ${detachedCount}
lights ${lightStats.active}/${POOL_SIZE} real (${lightStats.sources} sources)  pixel ratio ${renderer.getPixelRatio().toFixed(2)}`;
}
function setPerf(on) { stats.show = on; EL.perf.hidden = !on; settings.perf = on; store.set('settings', settings); const cb = $('#perfToggle'); if (cb) cb.checked = on; }
addEventListener('keydown', (e) => { if (e.code === 'F3') { e.preventDefault(); setPerf(!stats.show); } });
EL.perf.hidden = !stats.show;
$('#perfToggle').checked = stats.show; $('#perfToggle').onchange = (e) => setPerf(e.target.checked);

// ---- precompile shaders and upload textures before you walk in (avoids first-look hitches) ----
async function precompile() {
  const btn = $('#enter'); btn.disabled = true; const label = btn.textContent; btn.textContent = 'Loading…';
  const t0 = performance.now(); const hidden = [];
  scene.traverse(o => { if (!o.visible) { hidden.push(o); o.visible = true; } }); // include things that appear later (steam, food, water…)
  try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera); } catch (e) { console.warn('compile', e); }
  hidden.forEach(o => o.visible = false);
  const seen = new Set(); scene.traverse(o => { if (!o.material) return; for (const m of [].concat(o.material)) for (const k of ['map', 'emissiveMap']) { const t = m[k]; if (t && !seen.has(t)) { seen.add(t); renderer.initTexture(t); } } });
  stats.compileMs = performance.now() - t0; btn.disabled = false; btn.textContent = label;
  console.info('precompiled ' + renderer.info.programs.length + ' programs and ' + seen.size + ' textures in ' + stats.compileMs.toFixed(0) + ' ms');
}

// ---- boot ----
P.pos.set(A.spawn.x, 0, A.spawn.z); P.yaw = A.spawn.yaw; P.day = P.dayTarget = dayFactor();
updateHud(); renderTasks();
camera.position.set(P.pos.x, P.eye, P.pos.z); camera.rotation.set(P.pitch, P.yaw, 0); camera.updateMatrixWorld();
precompile().then(() => requestAnimationFrame(frame));
window.__game = { STATIC_LIST: () => STATIC, moveAndSlide, dragLook, PR, POOL, SOURCES, lightStats, optStats, stats, setPerf, blocked, probe() { camera.updateMatrixWorld(); castFrame(); updateHover(); const d = hover && hover.int; return d ? (typeof d.label === 'function' ? d.label() : d.label) : (hover && hover.root ? 'ROOT ' + hover.root.userData.item.t : null); }, perf, THREE, A, P, CATALOG, itemsGroup, primary, leftAction, pickUp, bite, Crumbs, simonPress, SimonState: () => ({ mode: Simon.mode, seq: Simon.seq.slice(), at: Simon.at, round: Simon.round }), enterCar, exitCar, held: () => held, inSink, sinkBlocked: () => sinkBlocked, clock: () => clockT, FOOD: { FOOD_MODELS, FRUIT, pastaBowl, pizzaSlice }, held: () => held, camera, ctx, renderer, scene, keys, openPhone, advanceTime };
