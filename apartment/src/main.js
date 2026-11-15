// Apartment Model — Step 1: blank test scene.
// UNITS: 1 world unit = 1 inch, everywhere, forever.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const INCH = 1;
const FOOT = 12 * INCH;

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('app').appendChild(renderer.domElement);

// --- Scene & camera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202228);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  1,          // near: 1 inch
  5000        // far: ~416 feet
);
camera.position.set(10 * FOOT, 8 * FOOT, 10 * FOOT);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2 * FOOT, 0);
controls.enableDamping = true;

// --- Lights ---
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(8 * FOOT, 15 * FOOT, 5 * FOOT);
scene.add(sun);

// --- Ground grid: 20ft x 20ft, one square = 1 foot ---
const grid = new THREE.GridHelper(20 * FOOT, 20, 0x5588ff, 0x444444);
scene.add(grid);

// --- Scale references ---
// A 12-inch (1 ft) cube. It should fit exactly in one grid square.
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1 * FOOT, 1 * FOOT, 1 * FOOT),
  new THREE.MeshStandardMaterial({ color: 0xff7043 })
);
cube.position.set(0, 0.5 * FOOT, 0);
scene.add(cube);

// A 68-inch post (5'8" — typical eye height) so you can judge human scale.
const post = new THREE.Mesh(
  new THREE.CylinderGeometry(1.5 * INCH, 1.5 * INCH, 68 * INCH, 16),
  new THREE.MeshStandardMaterial({ color: 0x4db6ac })
);
post.position.set(3 * FOOT, 34 * INCH, 0);
scene.add(post);

// --- Resize handling ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Render loop ---
renderer.setAnimationLoop(() => {
  cube.rotation.y += 0.005;
  controls.update();
  renderer.render(scene, camera);
});
