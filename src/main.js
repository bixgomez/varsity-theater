import * as THREE from 'three';
import { ROOM, WINDOWS } from './dimensions.js';
import { buildBooth, buildLights } from './booth.js';
import { WalkControls } from './walk-controls.js';
import { BARCO, buildBarco, placeBarco } from './equipment/barco.js';
import { buildStand } from './equipment/stand.js';
import {
  buildElectricalCloset,
  buildRewindTable,
  buildWestWallConduit,
  buildControlBox,
  buildCeilingFixtures,
} from './fixtures.js';

const EYE_HEIGHT = 67; // inches (5'7")
const WALL_MARGIN = 10; // keep the camera this far from the walls
const CEILING_MARGIN = 6; // keep the camera this far below the ceiling
const MIN_FOV = 90; // vertical field of view, degrees; lower is more zoomed in
const MAX_FOV = 110; // widest the view gets on tall phone screens

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// Seen through the windows and door: a dim, cool blue, like the photos.
scene.background = new THREE.Color(0x1c2733);

scene.add(buildBooth());
scene.add(buildLights());

// The Barco, with its lens lined up on window 4 (the center port).
const LENS_TARGET = WINDOWS.find((w) => w.n === 4);
const barco = buildBarco();
const barcoFootprint = placeBarco(barco, {
  lensX: (LENS_TARGET.x0 + LENS_TARGET.x1) / 2,
  lensY: (LENS_TARGET.y0 + LENS_TARGET.y1) / 2,
  lensFrontZ: 3, // inches from the west wall
});
const { stand, footprint: standFootprint } = buildStand({ ...barcoFootprint, minZ: barcoFootprint.maxZ - BARCO.length, top: barcoFootprint.bottom });
scene.add(barco, stand);

const { closet, footprint: closetFootprint } = buildElectricalCloset();
const { table: rewindTable, footprint: tableFootprint } = buildRewindTable();
scene.add(closet, rewindTable, buildWestWallConduit(), buildControlBox(), buildCeilingFixtures());

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 5000);

const controls = new WalkControls(camera, renderer.domElement, {
  eyeHeight: EYE_HEIGHT,
  bounds: {
    minX: WALL_MARGIN,
    maxX: ROOM.width - WALL_MARGIN,
    minZ: WALL_MARGIN,
    maxZ: ROOM.depth - WALL_MARGIN,
    maxY: ROOM.height - CEILING_MARGIN,
  },
});
controls.setObstacles([
  { ...barcoFootprint, maxZ: Math.max(barcoFootprint.maxZ, standFootprint.maxZ) },
  standFootprint,
  closetFootprint,
  tableFootprint,
]);
// Start near the rewind table, facing the windows.
controls.setPosition(ROOM.width / 2, ROOM.depth - 40);
controls.setYaw(0);

// On a tall phone screen, a fixed vertical field of view feels like looking
// through a mail slot.  Widen it so you always see at least 60° side to side.
function fitCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const minHorizontal = THREE.MathUtils.degToRad(60);
  const neededVertical = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(minHorizontal / 2) / aspect));
  camera.aspect = aspect;
  camera.fov = THREE.MathUtils.clamp(neededVertical, MIN_FOV, MAX_FOV);
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
