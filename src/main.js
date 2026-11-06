import * as THREE from 'three';
import { ROOM } from './dimensions.js';
import { buildBooth, buildLights } from './booth.js';
import { WalkControls } from './walk-controls.js';

const EYE_HEIGHT = 64; // inches
const WALL_MARGIN = 10; // keep the camera this far from the walls

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// Seen through the windows and door: a dim, cool blue, like the photos.
scene.background = new THREE.Color(0x1c2733);

scene.add(buildBooth());
scene.add(buildLights());

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 5000);

const controls = new WalkControls(camera, renderer.domElement, {
  eyeHeight: EYE_HEIGHT,
  bounds: {
    minX: WALL_MARGIN,
    maxX: ROOM.width - WALL_MARGIN,
    minZ: WALL_MARGIN,
    maxZ: ROOM.depth - WALL_MARGIN,
  },
});
// Start near the rewind table, facing the windows.
controls.setPosition(ROOM.width / 2, ROOM.depth - 24);
controls.setYaw(0);

// On a tall phone screen, a fixed vertical field of view feels like looking
// through a mail slot.  Widen it so you always see at least 60° side to side.
function fitCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const minHorizontal = THREE.MathUtils.degToRad(60);
  const neededVertical = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(minHorizontal / 2) / aspect));
  camera.aspect = aspect;
  camera.fov = THREE.MathUtils.clamp(neededVertical, 70, 95);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
fitCamera();
window.addEventListener('resize', fitCamera);

const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const dt = Math.min(timer.getDelta(), 0.1);
  controls.update(dt);
  renderer.render(scene, camera);
});

// Expose for debugging in the browser console.
window.booth = { scene, camera, controls };
