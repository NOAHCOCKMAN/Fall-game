import {
  ACESFilmicToneMapping, PCFShadowMap, CanvasTexture, Color, DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial,
  PerspectiveCamera, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Scene, WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

function concreteTexture() {
  // 256 px = 48 in: four 12-inch grid cells per tile.
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c9c5bd'; g.fillRect(0, 0, 256, 256);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    const v = 180 + rnd() * 40 | 0;
    g.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.25 + rnd() * 0.3})`;
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  g.strokeStyle = 'rgba(90,85,78,0.22)'; g.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.stroke();
    g.beginPath(); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke();
  }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function pegboardTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#b49a74'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#6b5a44';
  for (const x of [16, 48]) for (const y of [16, 48]) { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.colorSpace = SRGBColorSpace;
  return t;
}

export interface Stage {
  renderer: WebGLRenderer; labelRenderer: CSS2DRenderer; scene: Scene; camera: PerspectiveCamera;
  controls: OrbitControls; floorMat: MeshStandardMaterial; host: HTMLElement;
  hemi: HemisphereLight; sun: DirectionalLight;
  onResize: (() => void) | null;
  /** Device-pixel cap: lower it to trade sharpness for speed. */
  setPixelCap(cap: number): void;
}

export function createStage(host: HTMLElement): Stage {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const coarse = matchMedia('(pointer: coarse)').matches;
  let pixelCap = coarse ? 1.5 : 2;   // phones: sharp enough, much cheaper
  renderer.setPixelRatio(Math.min(devicePixelRatio, pixelCap));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'label-layer';
  host.appendChild(labelRenderer.domElement);

  const scene = new Scene();
  scene.background = new Color('#d8d4cc');

  const camera = new PerspectiveCamera(40, 1, 1, 4000);
  camera.position.set(80, 55, 110);

  const hemi = new HemisphereLight('#ffffff', '#8a8070', 1.4);
  scene.add(hemi);
  const sun = new DirectionalLight('#fff6e8', 2.4);
  sun.position.set(110, 220, 150);
  sun.target.position.set(20, 0, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -170; sc.right = 170; sc.top = 170; sc.bottom = -170; sc.near = 50; sc.far = 600;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);

  const floorTex = concreteTexture(); floorTex.repeat.set(800 / 48, 800 / 48);
  const floorMat = new MeshStandardMaterial({ map: floorTex, roughness: 0.92, metalness: 0 });
  const floor = new Mesh(new PlaneGeometry(800, 800), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.name = 'floor';
  scene.add(floor);

  const pegTex = pegboardTexture(); pegTex.repeat.set(400 / 2, 120 / 2);
  const wall = new Mesh(new PlaneGeometry(400, 120), new MeshStandardMaterial({ map: pegTex, roughness: 0.9 }));
  wall.position.set(0, 60, -70); wall.receiveShadow = true;
  scene.add(wall);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.1;
  controls.maxDistance = 600; controls.minDistance = 8;
  controls.target.set(0, 16, 24);

  const stage: Stage = {
    renderer, labelRenderer, scene, camera, controls, floorMat, host, hemi, sun, onResize: null,
    setPixelCap(cap: number) { pixelCap = cap; renderer.setPixelRatio(Math.min(devicePixelRatio, pixelCap)); resize(); },
  };
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h); labelRenderer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    stage.onResize?.();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  // touch: one finger orbits, two fingers pinch-zoom + pan; mouse: left orbit, right / shift-drag pan, wheel zoom
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;
  controls.rotateSpeed = coarse ? 0.7 : 0.9;
  controls.panSpeed = 0.9;
  return stage;
}
