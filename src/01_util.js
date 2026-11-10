// ---------- util: materials, geometry helpers, procedural textures, audio ----------
const TAU = Math.PI * 2;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
let _seed = 1234;
const srand = () => { _seed = (_seed * 16807) % 2147483647; return (_seed - 1) / 2147483646; };

function M(color, r = 0.75, m = 0, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m, ...extra });
}
function E(color, intensity = 1) { // emissive material
  return new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 1 });
}
const geoCache = new Map();
function boxGeo(w, h, d) {
  const k = w.toFixed(3) + '|' + h.toFixed(3) + '|' + d.toFixed(3);
  let g = geoCache.get(k);
  if (!g) { g = new THREE.BoxGeometry(w, h, d); geoCache.set(k, g); }
  return g;
}
// Box with y = bottom
function B(p, w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat);
  m.position.set(x, y + h / 2, z); p.add(m); return m;
}
function C(p, rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y + h / 2, z); p.add(m); return m;
}
function S(p, r, mat, x = 0, y = 0, z = 0, ws = 16, hs = 12) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mat);
  m.position.set(x, y, z); p.add(m); return m;
}
function T(p, r, tube, mat, x = 0, y = 0, z = 0, arc = TAU) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 24, arc), mat);
  m.position.set(x, y, z); p.add(m); return m;
}
function G(p, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; if (p) p.add(g); return g;
}
function plane(p, w, h, mat, x, y, z, rx = 0, ry = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, 0); p.add(m); return m;
}

// ---------- canvas textures ----------
function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  t.userData = { canvas: c, ctx: g };
  return t;
}
function noise(g, w, h, amt, alpha = 0.06) {
  for (let i = 0; i < amt; i++) {
    g.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}
const TEX = {};
const FLOOR_STYLES = {
  oak: { name: 'Light oak', base: [196, 174, 146], var: 16 },
  greige: { name: 'Greige LVP', base: [190, 170, 145], var: 12 },
  walnut: { name: 'Walnut', base: [110, 74, 48], var: 16 },
  ash: { name: 'White ash', base: [222, 208, 186], var: 10 },
  tile: { name: 'White tile', tile: '#e9e7e3', grout: '#c9c5bf' },
  slate: { name: 'Slate tile', tile: '#5c6066', grout: '#3f4246' },
  checker: { name: 'Checker', checker: true },
  carpet: { name: 'Carpet', carpet: '#cfc4b4' },
  herring: { name: 'Herringbone', herring: true },
};
function floorTex(style) {
  if (TEX['floor_' + style]) return TEX['floor_' + style];
  const s = FLOOR_STYLES[style] || FLOOR_STYLES.oak;
  let t;
  if (s.base) {
    t = canvasTex(1024, 1024, (g, w, h) => {
      const rows = 8, rh = h / rows;
      for (let r = 0; r < rows; r++) {
        let x = -Math.random() * 400;
        while (x < w) {
          const len = 380 + Math.random() * 420;
          const v = (Math.random() - 0.5) * s.var * 2;
          const [R, Gc, Bc] = s.base.map(c => clamp(c + v, 0, 255) | 0);
          g.fillStyle = `rgb(${R},${Gc},${Bc})`; g.fillRect(x, r * rh, len, rh);
          for (let k = 0; k < 14; k++) { // grain
            g.strokeStyle = `rgba(${R - 40},${Gc - 40},${Bc - 40},${0.08 + Math.random() * 0.1})`;
            g.lineWidth = 1 + Math.random() * 2; g.beginPath();
            const yy = r * rh + Math.random() * rh; g.moveTo(x, yy);
            g.bezierCurveTo(x + len * 0.3, yy + rand(-6, 6), x + len * 0.6, yy + rand(-6, 6), x + len, yy + rand(-3, 3)); g.stroke();
          }
          g.fillStyle = 'rgba(60,40,20,0.35)'; g.fillRect(x, r * rh, 2, rh);
          x += len;
        }
        g.fillStyle = 'rgba(60,40,20,0.3)'; g.fillRect(0, r * rh, w, 2);
      }
      noise(g, w, h, 6000, 0.03);
    }, [4, 4]);
  } else if (s.tile) {
    t = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = s.grout; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        g.fillStyle = s.tile; g.fillRect(i * 256 + 3, j * 256 + 3, 250, 250);
        noise(g, w, h, 300, 0.03);
      }
    }, [5, 5]);
  } else if (s.checker) {
    t = canvasTex(256, 256, (g) => {
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#222' : '#eee'; g.fillRect(i * 128, j * 128, 128, 128); }
    }, [8, 8]);
  } else if (s.carpet) {
    t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = s.carpet; g.fillRect(0, 0, w, h); noise(g, w, h, 9000, 0.07); }, [6, 6]);
  } else if (s.herring) {
    t = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#7a5434'; g.fillRect(0, 0, w, h);
      for (let y = -64; y < h + 64; y += 32) for (let x = -64; x < w + 64; x += 128) {
        for (const d of [1, -1]) {
          g.save(); g.translate(x + (d > 0 ? 0 : 64), y); g.rotate(d * Math.PI / 4);
          const v = rand(-14, 14); g.fillStyle = `rgb(${165 + v},${120 + v},${80 + v})`;
          g.fillRect(0, 0, 90, 22); g.strokeStyle = 'rgba(50,30,10,.4)'; g.strokeRect(0, 0, 90, 22); g.restore();
        }
      }
    }, [3, 3]);
  }
  TEX['floor_' + style] = t; return t;
}
function getTex(name) {
  if (TEX[name]) return TEX[name];
  let t;
  switch (name) {
    case 'quartz': t = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#f3f2ef'; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, 0.05); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(150,150,150,${Math.random() * 0.2})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); } }, [2, 2]); break;
    case 'backsplash': t = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#8e8a84'; g.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = -1; c < 6; c++) { const o = r % 2 ? 48 : 0; const v = rand(-10, 10); const gr = g.createLinearGradient(0, r * 32, 0, r * 32 + 30); gr.addColorStop(0, `rgb(${178 + v},${176 + v},${170 + v})`); gr.addColorStop(1, `rgb(${158 + v},${155 + v},${150 + v})`); g.fillStyle = gr; g.fillRect(c * 96 + o + 2, r * 32 + 2, 92, 28); } }, [3, 1]); break;
    case 'siding': t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#eef0f0'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y, w, 3); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(0, y + 3, w, 2); } }, [4, 4]); break;
    case 'deck': t = canvasTex(512, 512, (g, w, h) => { for (let i = 0; i < 8; i++) { const v = rand(-12, 12); g.fillStyle = `rgb(${196 + v},${160 + v},${112 + v})`; g.fillRect(i * 64, 0, 62, h); g.fillStyle = 'rgba(70,40,10,.5)'; g.fillRect(i * 64 + 62, 0, 2, h); for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(90,60,30,.12)'; g.fillRect(i * 64 + Math.random() * 60, 0, 1, h); } } }, [2, 2]); break;
    case 'grass': t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#6f8a3e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${rand(60, 140)},${rand(100, 150)},${rand(30, 60)},.5)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 3); } }, [60, 60]); break;
    case 'asphalt': t = canvasTex(1024, 1024, (g, w, h) => {
      g.fillStyle = '#4a4c50'; g.fillRect(0, 0, w, h); noise(g, w, h, 30000, 0.08);
      g.fillStyle = '#e8e8e2';
      for (let i = 0; i < 16; i++) { g.fillRect(i * 64, 80, 4, 240); g.fillRect(i * 64, 704, 4, 240); }
      g.fillRect(0, 80, w, 3); g.fillRect(0, 941, w, 3);
    }); break;
    case 'facade': t = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#e8eaea'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, y, w, 1); }
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
        const x = c * 85 + 20, y = r * 128 + 30;
        g.fillStyle = '#2b3036'; g.fillRect(x - 3, y - 3, 46, 66);
        g.fillStyle = Math.random() < 0.3 ? '#8aa0b8' : '#5b6d82'; g.fillRect(x, y, 40, 60);
        if (c % 2 == 0) { g.fillStyle = '#d8dcdc'; g.fillRect(x - 10, y + 62, 64, 6); }
      }
    }, [1, 1]); break;
    case 'cane': t = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#d9c7a0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a8895a'; g.lineWidth = 2; for (let i = -w; i < w * 2; i += 10) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); } g.fillStyle = 'rgba(80,60,30,.6)'; for (let x = 5; x < w; x += 10) for (let y = 5; y < h; y += 10) { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); } }, [3, 2]); break;
    case 'floral': t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f2efe6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { const x = Math.random() * w, y = Math.random() * h; g.strokeStyle = '#5d7a52'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rand(-20, 20), y + 10, x + rand(-20, 20), y + 25); g.stroke(); g.fillStyle = Math.random() < 0.5 ? '#6f8f62' : '#94ad84'; g.beginPath(); g.ellipse(x, y, 7, 3, Math.random() * 3, 0, TAU); g.fill(); } }); break;
    case 'woven': t = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#b48c58'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 16) { g.fillStyle = `rgba(90,60,25,${0.2 + Math.random() * 0.2})`; g.fillRect(x + (y / 8 % 2) * 8, y, 8, 7); } }, [2, 2]); break;
    case 'runner': t = canvasTex(256, 64, (g, w, h) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#f3eee6' : '#2f6b48'; g.fillRect(i * 16, 0, 16, h); } }); break;
    case 'blanket': t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#b9bcbc'; g.fillRect(0, 0, w, h); g.fillStyle = '#4b4f52'; g.fillRect(0, 24, w, 6); g.fillRect(0, h - 30, w, 6); noise(g, w, h, 3000, 0.05); }); break;
    case 'rug': t = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#9b6a6b'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#d8c1a6'; g.lineWidth = 10; g.strokeRect(24, 24, w - 48, h - 48);
      g.strokeStyle = '#5f3b44'; g.lineWidth = 6; g.strokeRect(50, 50, w - 100, h - 100);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${rand(60, 220)},${rand(60, 160)},${rand(80, 140)},.35)`; g.beginPath(); g.ellipse(rand(80, w - 80), rand(80, h - 80), rand(8, 30), rand(8, 20), Math.random() * 3, 0, TAU); g.fill(); }
      noise(g, w, h, 20000, 0.07);
    }); break;
    case 'toile': t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f1ebe0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8c2a2e'; g.fillStyle = '#8c2a2e'; g.lineWidth = 2;
      for (let i = 0; i < 9; i++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y - 26); g.lineTo(x - 10, y); g.lineTo(x + 10, y); g.closePath(); g.fill(); g.fillRect(x - 1, y, 2, 6); }
      for (let i = 0; i < 6; i++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x - 30, y); g.lineTo(x - 10, y - 18); g.lineTo(x + 5, y - 6); g.lineTo(x + 25, y - 22); g.lineTo(x + 40, y); g.stroke(); }
      g.beginPath(); g.ellipse(128, 170, 26, 9, 0, 0, TAU); g.stroke(); g.fillRect(100, 150, 22, 12); g.fillRect(150, 152, 18, 8); }); break;
    case 'velvet': t = canvasTex(64, 128, (g, w, h) => { for (let x = 0; x < w; x += 4) { const v = rand(-12, 12); g.fillStyle = `rgb(${112 + v},${88 + v},${98 + v})`; g.fillRect(x, 0, 4, h); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, 0, 1, h); } }); break;
    case 'treepillow': t = canvasTex(256, 96, (g, w, h) => { g.fillStyle = '#efeae2'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3; i++) { const x = 45 + i * 83; for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#2f6b3f' : '#3f7d4c'; g.beginPath(); g.moveTo(x, 10 + k * 12); g.lineTo(x - 8 - k * 4, 26 + k * 12); g.lineTo(x + 8 + k * 4, 26 + k * 12); g.fill(); } g.fillStyle = '#5a3d2a'; g.fillRect(x - 2, 86, 4, 8); } }); break;
    case 'marble': t = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#eceae6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(120,120,125,${rand(0.08, 0.3)})`; g.lineWidth = rand(0.5, 2.5); g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += rand(-60, 80); y += rand(-30, 60); g.lineTo(x, y); } g.stroke(); } noise(g, w, h, 4000, 0.03); }); break;
    case 'treeskirt': t = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f2efe8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f2326'; for (let i = 0; i < 40; i++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y - 14); g.lineTo(x - 7, y + 4); g.lineTo(x + 7, y + 4); g.fill(); } }); break;
    case 'oldrug': t = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#5e4c42'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3e302a'; g.lineWidth = 14; g.strokeRect(20, 20, w - 40, h - 40); g.strokeStyle = '#7d6a5c'; g.lineWidth = 4; g.strokeRect(46, 46, w - 92, h - 92); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${rand(90, 150)},${rand(70, 120)},${rand(60, 100)},.25)`; g.beginPath(); g.ellipse(rand(60, w - 60), rand(60, h - 60), rand(8, 40), rand(6, 20), Math.random() * 3, 0, TAU); g.fill(); } noise(g, w, h, 30000, 0.09); }); break;
    case 'tvoff': t = canvasTex(64, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1a1c20'); gr.addColorStop(0.5, '#0b0c0e'); gr.addColorStop(1, '#16181b'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }); break;
  }
  TEX[name] = t; return t;
}

// Paintings & photos
function artTex(kind, seed = 1) {
  const key = 'art_' + kind + seed; if (TEX[key]) return TEX[key];
  _seed = seed * 7919 + 13;
  const t = canvasTex(512, 384, (g, w, h) => {
    if (kind === 'monet') {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5f86a6'); gr.addColorStop(0.5, '#4f7b7c'); gr.addColorStop(1, '#3d6a78'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { const c = ['#7aa0b8', '#9ab8c4', '#5c8a74', '#8c8ab8', '#4b6f6a', '#b3c9cf', '#6d9c86'][(srand() * 7) | 0]; g.fillStyle = c; g.globalAlpha = 0.5; g.fillRect(srand() * w, srand() * h, 12 + srand() * 26, 3 + srand() * 3); }
      g.globalAlpha = 1;
      for (let i = 0; i < 26; i++) { const x = srand() * w, y = h * 0.3 + srand() * h * 0.7; g.fillStyle = ['#5f8d4e', '#76a05c', '#4e7a45'][(srand() * 3) | 0]; g.beginPath(); g.ellipse(x, y, 18 + srand() * 22, 6 + srand() * 6, 0, 0, TAU); g.fill(); if (srand() < 0.6) { g.fillStyle = srand() < 0.5 ? '#f2b8c6' : '#f7f0e8'; g.beginPath(); g.arc(x + rand(-6, 6), y - 3, 4, 0, TAU); g.fill(); } }
    } else if (kind === 'landscape') {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2c6b4'); gr.addColorStop(0.55, '#f6dcc8'); gr.addColorStop(0.56, '#9fb57a'); gr.addColorStop(1, '#6f8f4f'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f4f0ea'; g.fillRect(w * 0.55, h * 0.4, 70, 45); g.fillStyle = '#8a4a3a'; g.beginPath(); g.moveTo(w * 0.55 - 6, h * 0.4); g.lineTo(w * 0.55 + 35, h * 0.3); g.lineTo(w * 0.55 + 76, h * 0.4); g.fill();
      for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${rand(80, 140)},${rand(120, 170)},${rand(60, 90)},.4)`; g.fillRect(srand() * w, h * 0.55 + srand() * h * 0.45, 10, 3); }
    } else if (kind === 'garden') {
      g.fillStyle = '#3e5a3c'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) { g.fillStyle = ['#577a4d', '#2e4630', '#6b8f5c'][(srand() * 3) | 0]; g.beginPath(); g.ellipse(srand() * w, srand() * h, 14, 6, srand() * 3, 0, TAU); g.fill(); }
      for (let i = 0; i < 80; i++) { const x = srand() * w, y = srand() * h; for (let k = 0; k < 5; k++) { g.fillStyle = '#f4f2ec'; g.beginPath(); g.ellipse(x + Math.cos(k * 1.25) * 6, y + Math.sin(k * 1.25) * 6, 5, 3, k * 1.25, 0, TAU); g.fill(); } g.fillStyle = '#e8c547'; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
    } else if (kind === 'bridge') {
      g.fillStyle = '#3c6b4a'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 700; i++) { g.fillStyle = ['#5a8c4e', '#2d5a3c', '#7aa65a', '#9cc078', '#46745a'][(srand() * 5) | 0]; g.fillRect(srand() * w, srand() * h, 8, 4); }
      g.strokeStyle = '#7fb0a0'; g.lineWidth = 8; g.beginPath(); g.ellipse(w / 2, h * 0.75, w * 0.45, h * 0.35, 0, Math.PI, TAU); g.stroke();
      g.lineWidth = 3; for (let x = 40; x < w - 40; x += 18) { g.beginPath(); g.moveTo(x, h * 0.45); g.lineTo(x, h * 0.6); g.stroke(); }
    } else if (kind === 'photo') {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d9d9d9'); gr.addColorStop(1, '#6d6d6d'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#2a2a2a'; g.beginPath(); g.arc(w * (0.3 + srand() * 0.4), h * 0.38, 40, 0, TAU); g.fill(); g.fillRect(w * 0.3 + srand() * 60, h * 0.5, 110, h * 0.5);
      if (srand() < 0.5) { g.fillStyle = '#444'; g.beginPath(); g.arc(w * 0.7, h * 0.42, 34, 0, TAU); g.fill(); g.fillRect(w * 0.62, h * 0.55, 90, h * 0.5); }
    } else if (kind === 'print') {
      g.fillStyle = '#f5f3ef'; g.fillRect(0, 0, w, h);
      const gr = g.createLinearGradient(0, h * 0.3, 0, h * 0.7); gr.addColorStop(0, '#9aa4ad'); gr.addColorStop(1, '#3d4248');
      g.fillStyle = gr; g.fillRect(w * 0.3, h * 0.28, w * 0.4, h * 0.44);
      g.fillStyle = '#20252a'; for (let i = 0; i < 6; i++) g.fillRect(w * 0.3 + srand() * w * 0.36, h * 0.5 + srand() * h * 0.18, 8, 10);
    } else if (kind === 'wedding') {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3d4a35'); gr.addColorStop(1, '#2a2620'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) { g.fillStyle = ['#56693f', '#33452c', '#6f7f52', '#8a8a6a'][(srand() * 4) | 0]; g.beginPath(); g.arc(srand() * w, srand() * h * 0.6, 6 + srand() * 14, 0, TAU); g.fill(); }
      g.fillStyle = '#6b5a4a'; g.fillRect(0, h * 0.72, w, h * 0.28);
      const cx = w * (0.35 + srand() * 0.3); g.fillStyle = '#f4f1ea'; g.beginPath(); g.moveTo(cx - 10, h * 0.42); g.lineTo(cx - 45, h * 0.9); g.lineTo(cx + 25, h * 0.9); g.closePath(); g.fill(); g.beginPath(); g.arc(cx - 6, h * 0.36, 14, 0, TAU); g.fill();
      g.fillStyle = '#2c2a28'; g.fillRect(cx + 20, h * 0.4, 30, h * 0.5); g.fillStyle = '#d7b79a'; g.beginPath(); g.arc(cx + 35, h * 0.34, 14, 0, TAU); g.fill();
    } else if (kind === 'abstract') {
      g.fillStyle = '#efe6da'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) { g.fillStyle = ['#c9774f', '#2f4858', '#d9b26f', '#7a9a8a', '#b05c5c'][(srand() * 5) | 0]; g.beginPath(); g.arc(srand() * w, srand() * h, 40 + srand() * 90, 0, TAU); g.fill(); }
    } else if (kind === 'poster') {
      g.fillStyle = '#1f2b38'; g.fillRect(0, 0, w, h); g.fillStyle = '#f2a65a'; g.beginPath(); g.arc(w / 2, h * 0.45, 90, 0, TAU); g.fill();
      g.fillStyle = '#e8ded0'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.fillText('FALL', w / 2, h * 0.88);
    }
  });
  TEX[key] = t; return t;
}

// ---------- audio (synthesized, no assets) ----------
const Sfx = {
  ctx: null, master: null, nbuf: null, loops: new Set(), muted: false,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.6; this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 2; this.nbuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.nbuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.6; },
  tone(f = 440, dur = 0.1, type = 'sine', vol = 0.2, slide = 0, delay = 0) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur = 0.2, vol = 0.2, freq = 1000, q = 1, type = 'bandpass', sweep = 0, delay = 0) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.nbuf; const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  click() { this.tone(1800, 0.03, 'square', 0.08); this.noise(0.04, 0.15, 3000, 2); },
  door(open) { this.noise(0.35, 0.12, open ? 500 : 900, 4, 'bandpass', open ? 400 : -500); if (!open) this.noise(0.08, 0.35, 180, 1, 'lowpass', 0, 0.25); },
  beep(n = 1, f = 1650) { for (let i = 0; i < n; i++) this.tone(f, 0.12, 'square', 0.06, 0, i * 0.2); },
  pop() { this.tone(500, 0.12, 'sine', 0.25, 600); },
  drawer() { this.noise(0.25, 0.12, 700, 1.5, 'bandpass', -200); },
  flush() { this.noise(2.2, 0.35, 900, 0.7, 'bandpass', -600); this.noise(1.2, 0.2, 2500, 1, 'highpass', 0, 0.3); },
  chime() { [659, 784, 988].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.12, 0, i * 0.12)); },
  splash() { this.noise(0.3, 0.25, 1800, 0.8, 'bandpass', -900); },
  loop(kind, pos = null, vol = 0.2) {
    if (!this.ctx) return { stop() { }, pos, setVol() { } };
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.master);
    const nodes = [];
    const mkNoise = (type, f, q) => { const s = c.createBufferSource(); s.buffer = this.nbuf; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); fl.connect(g); s.start(); nodes.push(s); return fl; };
    const mkOsc = (type, f, v) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; const og = c.createGain(); og.gain.value = v; o.connect(og); og.connect(g); o.start(); nodes.push(o); return o; };
    if (kind === 'water') mkNoise('bandpass', 1400, 0.6);
    else if (kind === 'shower') { mkNoise('bandpass', 2200, 0.4); mkNoise('lowpass', 500, 0.5); }
    else if (kind === 'hum') { mkOsc('sawtooth', 60, 0.15); mkOsc('sine', 120, 0.4); mkNoise('lowpass', 300, 0.5); }
    else if (kind === 'fan') mkNoise('lowpass', 350, 0.8);
    else if (kind === 'sizzle') { mkNoise('highpass', 3500, 0.5); }
    else if (kind === 'washer') { mkNoise('lowpass', 250, 1); mkOsc('sine', 48, 0.6); }
    else if (kind === 'boil') mkNoise('bandpass', 600, 2);
    else if (kind === 'fire') { mkNoise('lowpass', 800, 0.5); }
    const h = {
      pos, base: vol, gain: g, stopped: false,
      stop() { if (this.stopped) return; this.stopped = true; g.gain.setTargetAtTime(0, c.currentTime, 0.1); setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch (e) { } }); g.disconnect(); }, 600); Sfx.loops.delete(this); },
      setVol(v) { this.base = v; }
    };
    this.loops.add(h); return h;
  },
  updateLoops(listener) {
    if (!this.ctx) return;
    for (const h of this.loops) {
      let v = h.base;
      if (h.pos) { const p = h.pos.isVector3 ? h.pos : h.pos(); const d = p.distanceTo(listener); v *= clamp(1.4 - d / 7, 0, 1); }
      h.gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.08);
    }
  },
  // tiny lo-fi music sequencer, returns handle
  music(pos, style = 0) {
    if (!this.ctx) return { stop() { } };
    const c = this.ctx, g = c.createGain(); g.gain.value = 0; g.connect(this.master);
    const prog = style ? [[220, 277, 330, 415], [196, 247, 294, 370], [175, 220, 262, 330], [165, 208, 247, 311]] : [[262, 330, 392, 494], [220, 262, 330, 392], [175, 220, 262, 330], [196, 247, 294, 349]];
    let step = 0; const bpm = 78, beat = 60 / bpm; let next = c.currentTime + 0.1;
    const h = { pos, base: 0.18, gain: g, stopped: false, stop() { this.stopped = true; clearInterval(iv); g.gain.setTargetAtTime(0, c.currentTime, 0.2); Sfx.loops.delete(this); }, setVol(v) { this.base = v; } };
    const iv = setInterval(() => {
      while (next < c.currentTime + 0.4) {
        const ch = prog[Math.floor(step / 8) % 4];
        if (step % 8 === 0) ch.forEach(f => { const o = c.createOscillator(), og = c.createGain(); o.type = 'triangle'; o.frequency.value = f / 2; og.gain.setValueAtTime(0.05, next); og.gain.exponentialRampToValueAtTime(0.001, next + beat * 3.8); o.connect(og); og.connect(g); o.start(next); o.stop(next + beat * 4); });
        if (Math.random() < 0.6) { const f = ch[(Math.random() * 4) | 0] * (Math.random() < 0.5 ? 2 : 1); const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.value = f; og.gain.setValueAtTime(0.06, next); og.gain.exponentialRampToValueAtTime(0.001, next + beat * 0.9); o.connect(og); og.connect(g); o.start(next); o.stop(next + beat); }
        if (step % 2 === 0) { const s = c.createBufferSource(); s.buffer = this.nbuf; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const og = c.createGain(); og.gain.setValueAtTime(step % 4 === 2 ? 0.05 : 0.02, next); og.gain.exponentialRampToValueAtTime(0.001, next + 0.05); s.connect(f); f.connect(og); og.connect(g); s.start(next, Math.random()); s.stop(next + 0.06); }
        if (step % 8 === 0 || step % 8 === 5) { const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(110, next); o.frequency.exponentialRampToValueAtTime(40, next + 0.15); og.gain.setValueAtTime(0.25, next); og.gain.exponentialRampToValueAtTime(0.001, next + 0.2); o.connect(og); og.connect(g); o.start(next); o.stop(next + 0.25); }
        next += beat / 2; step++;
      }
    }, 100);
    this.loops.add(h); return h;
  }
};
