// ---------- static-mesh optimizer: share materials and merge everything that never moves ----------
// Rendering and picking are split with layers:
//   layer 0 = normal meshes (rendered + raycast)        – anything dynamic is left exactly as it was
//   layer 1 = originals that were merged (raycast only) – keeps the full hierarchy, so clicking/aiming is unchanged
//   layer 2 = merged meshes (rendered only)             – a few big meshes per container, one per material
const LAYER_PICK = 1, LAYER_MERGED = 2;
let detachedCount = 0;

function matKey(m) {
  const c = (x) => (x && x.getHexString) ? x.getHexString() : '';
  return [m.type, c(m.color), c(m.emissive), m.emissiveIntensity, m.roughness, m.metalness, m.map ? m.map.uuid : '', m.side, m.opacity, m.transparent, m.depthWrite, m.flatShading, m.vertexColors].join('|');
}
const isEmissive = (m) => m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0;

// Clone the triangles of one material slot of a mesh into container space, with exactly position/normal/uv
function slotGeometry(mesh, group, rel, vcolor) {
  let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  const start = group ? group.start : 0, count = group ? Math.min(group.count, pos.count - start) : pos.count;
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos.array.slice(start * 3, (start + count) * 3), 3));
  if (nor) out.setAttribute('normal', new THREE.BufferAttribute(nor.array.slice(start * 3, (start + count) * 3), 3));
  out.setAttribute('uv', uv ? new THREE.BufferAttribute(uv.array.slice(start * 2, (start + count) * 2), 2) : new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  if (!nor) out.computeVertexNormals();
  if (vcolor) { const c = new Float32Array(count * 3); for (let i = 0; i < count; i++) { c[i * 3] = vcolor.r; c[i * 3 + 1] = vcolor.g; c[i * 3 + 2] = vcolor.b; } out.setAttribute('color', new THREE.BufferAttribute(c, 3)); }
  out.applyMatrix4(rel);
  g.dispose();
  return out;
}

function optimizeStatic({ roots, tickOwners, registry, isItemContainer }) {
  const t0 = performance.now();
  const owners = new Set(tickOwners);
  const frozenMats = new Set(registry); // materials changed from outside their own subtree – never swapped for a shared one
  for (const r of roots) r.updateMatrixWorld(true);
  // containers: things that move (or may be removed) as a unit. Merged geometry is parented to its container.
  // owners whose update only moves them (doors, drawers, cabinet doors, fans) never touch materials
  const touchesMats = (o) => owners.has(o) && !o.userData.rigidTick;
  const vcMats = new Map(); // finish key -> shared vertex-colored material
  const isContainer = (o, root) => o === root || o.userData.moves || (owners.has(o) && !o.isMesh && !o.userData.rigidTick) || (o.userData.item && isItemContainer(o));
  // doors, drawers and cabinet doors are 'detachable': merged into their surroundings while closed, split back out the first time they move
  const isDetachable = (o) => owners.has(o) && !o.isMesh && o.userData.rigidTick;
  const groups = new Set();
  const canonical = new Map(); // matKey -> shared material
  const buckets = new Map();   // container -> Map(bucketKey -> {mat, geos})
  const merged = [];
  let before = 0, sharedSwaps = 0;
  const inv = new THREE.Matrix4(), rel = new THREE.Matrix4();

  function collect(mesh, container, inTick, grp) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (mats.some(m => !m || m.transparent || m.visible === false || m.wireframe)) return;
    const geo = mesh.geometry; if (!geo || !geo.attributes.position || geo.attributes.position.count === 0) return;
    if (!buckets.has(container)) buckets.set(container, new Map());
    const B = buckets.get(container);
    inv.copy(container.matrixWorld).invert(); rel.multiplyMatrices(inv, mesh.matrixWorld);
    const slots = Array.isArray(mesh.material) ? (geo.groups.length ? geo.groups : [{ start: 0, count: Infinity, materialIndex: 0 }]) : [null];
    for (const slot of slots) {
      let m = Array.isArray(mesh.material) ? mesh.material[slot.materialIndex] : mesh.material;
      // share identical-looking materials, but only where nothing will ever change them at runtime
      const shareable = !inTick && !frozenMats.has(m) && !isEmissive(m);
      let vcolor = null;
      if (shareable && m.isMeshStandardMaterial && !m.map && !m.vertexColors) {
        // untextured: bake the color into the vertices so every part with the same finish is one draw call
        const q = (v) => Math.round(v * 20) / 20, fk = q(m.roughness) + '|' + q(m.metalness) + '|' + m.side + '|' + m.flatShading;
        if (!vcMats.has(fk)) vcMats.set(fk, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: q(m.roughness), metalness: q(m.metalness), side: m.side, flatShading: m.flatShading }));
        vcolor = m.color; m = vcMats.get(fk); sharedSwaps++;
      } else if (shareable) { const k = matKey(m); if (!canonical.has(k)) canonical.set(k, m); else if (canonical.get(k) !== m) sharedSwaps++; m = canonical.get(k); }
      const bk = m.uuid;
      if (!B.has(bk)) B.set(bk, { mat: m, geos: [], tags: [] });
      B.get(bk).geos.push(slotGeometry(mesh, slot, rel, vcolor)); B.get(bk).tags.push(grp);
    }
    mesh.layers.set(LAYER_PICK); merged.push(mesh); before++;
    if (grp) { grp.userData.detachMeshes.push(mesh); }
  }
  function visit(o, root, container, inTick, grp) {
    if (o.userData.dyn) return;                     // moves/hides/changes on its own: leave it alone
    if (o.isInstancedMesh || o.isPoints || o.isLine || o.isSprite || o.isLight || o.isCamera) return;
    if (!o.visible) return;                          // hidden things are toggled at runtime
    if (o !== container && isContainer(o, root)) { container = o; inTick = inTick || touchesMats(o); grp = null; }
    else if (o !== root && isDetachable(o)) { grp = o; groups.add(o); o.userData.detachMeshes = []; o.userData.ranges = []; }
    if (o.isMesh) { if (owners.has(o)) return; collect(o, container, inTick, grp); } // a mesh with its own update animates itself
    for (const c of o.children.slice()) visit(c, root, container, inTick, grp);
  }
  for (const r of roots) visit(r, r, r, false, null);

  let drawMeshes = 0;
  for (const [container, B] of buckets) {
    for (const { mat, geos, tags } of B.values()) {
      const counts = geos.map(x => x.attributes.position.count);
      const g = geos.length === 1 ? geos[0] : THREE_mergeGeometries(geos, false);
      if (!g) { console.warn('merge failed'); continue; }
      if (geos.length > 1) geos.forEach(x => x.dispose());
      g.computeBoundingSphere(); g.computeBoundingBox();
      const mesh = new THREE.Mesh(g, mat); mesh.layers.set(LAYER_MERGED); mesh.matrixAutoUpdate = false; mesh.userData.mergedFrom = geos.length; mesh.name = 'merged';
      container.add(mesh); drawMeshes++;
      let off = 0; tags.forEach((t, i) => { if (t) t.userData.ranges.push({ mesh, start: off, count: counts[i] }); off += counts[i]; });
    }
  }
  for (const G of groups) {
    G.userData.detach = () => {
      G.traverse(o => { if (o.userData.detach && o !== G) o.userData.detach(); }); // nested drawers/doors go too
      G.userData.detach = null;
      for (const { mesh, start, count } of G.userData.ranges) { const a = mesh.geometry.attributes.position; a.array.fill(0, start * 3, (start + count) * 3); a.needsUpdate = true; } // collapse its triangles
      for (const m of G.userData.detachMeshes) m.layers.set(0); // the real parts render (and stay pickable) from now on
      detachedCount++;
    };
  }
  return { detachable: groups.size, originals: before, mergedMeshes: drawMeshes, containers: buckets.size, sharedMaterials: canonical.size + vcMats.size, vertexColorMaterials: vcMats.size, sharedSwaps, ms: Math.round(performance.now() - t0) };
}
