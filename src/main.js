import * as THREE from 'three';
import { ROOM, WINDOWS, CONTROL_BOX } from './dimensions.js';
import { buildBooth, buildLights } from './booth.js';
import { WalkControls } from './walk-controls.js';
import { buildFlySpace } from './fly-space.js';
import { bindInfoPanel } from './info-panel.js';
import { bindVisibilityPanel } from './visibility-panel.js';
import { loadSession, saveSessionOnLeave } from './session.js';
import { BARCO, buildBarco, placeBarco } from './equipment/barco.js';
import { buildStand } from './equipment/stand.js';
import { buildHallway } from './outside.js';
import {
  buildElectricalCloset,
  buildRewindTable,
  buildWestWallConduit,
  buildControlBox,
  buildCeilingFixtures,
  buildEastShelves,
  buildEastClock,
  buildOpenDoor,
} from './fixtures.js';

const EYE_HEIGHT = 67; // inches (5'7")
const WALL_MARGIN = 3; // keep the camera this far from the walls
const OBSTACLE_MARGIN = 2; // keep the camera this far from the equipment
const CEILING_MARGIN = 6; // keep the camera this far below the ceiling
const FLOOR_MARGIN = 3; // keep the camera at least this far above the floor
const MIN_FOV = 90; // vertical field of view, degrees; lower is more zoomed in
const MAX_FOV = 110; // widest the view gets on tall phone screens

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// Apply the same shadow defaults to assembled models and later additions.
function enableModelShadows(object) {
  if (object.isLight && object.shadow) {
    object.shadow.mapSize.set(1024, 1024);
    object.shadow.radius = 2;
  }
  if (object.isMesh) {
    object.castShadow = true;
    object.receiveShadow = true;
  }
  object.addEventListener('childadded', onModelChildAdded);
  for (const child of object.children) enableModelShadows(child);
}

function onModelChildAdded(event) {
  enableModelShadows(event.child);
}

enableModelShadows(scene);
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
const controlBox = buildControlBox();
const { shelves: eastShelves, obstacle: shelvesObstacle } = buildEastShelves();
const eastClock = buildEastClock();
const { door: eastDoor, obstacle: doorObstacle } = buildOpenDoor();
const { hallway, obstacles: hallwayObstacles } = buildHallway();
scene.add(hallway);
scene.add(closet, rewindTable, buildWestWallConduit(), controlBox, buildCeilingFixtures(), eastShelves, eastClock, eastDoor);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 5000);

const controls = new WalkControls(camera, renderer.domElement, {
  eyeHeight: EYE_HEIGHT,
  // Walls are solid, but you can fly out through any window or the door.
  canBeAt: buildFlySpace({ wallMargin: WALL_MARGIN, ceilingMargin: CEILING_MARGIN, floorMargin: FLOOR_MARGIN }),
});
// Everything in the booth blocks you from floor to ceiling.
const inBooth = { minY: 0, maxY: ROOM.height };
// The open door stands between the closet and the door opening.
const closetObstacles = [{ ...closetFootprint, ...inBooth }, doorObstacle];
// Pieces you can show and hide from the side panel.  Hidden pieces stop
// blocking you too.
const toggleable = [
  {
    id: 'barco',
    label: 'Barco and stand',
    objects: [barco, stand],
    obstacles: [
      { ...barcoFootprint, maxZ: Math.max(barcoFootprint.maxZ, standFootprint.maxZ), ...inBooth },
      { ...standFootprint, ...inBooth },
    ],
  },
  {
    id: 'rewind-table',
    label: 'Rewind table',
    objects: [rewindTable],
    obstacles: [{ ...tableFootprint, ...inBooth }],
  },
  {
    id: 'control-box',
    label: 'Control box',
    objects: [controlBox],
    // Only as tall as the box itself, so you can still walk over it at eye level.
    obstacles: [{
      minX: CONTROL_BOX.x0,
      maxX: CONTROL_BOX.x1,
      minZ: 0,
      maxZ: CONTROL_BOX.baseDepth,
      minY: CONTROL_BOX.y0,
      maxY: CONTROL_BOX.y1,
    }],
  },
  {
    id: 'east-shelves',
    label: 'East wall shelves',
    objects: [eastShelves],
    // Blocks only the heights the shelves span.
    obstacles: [shelvesObstacle],
  },
  {
    id: 'east-clock',
    label: 'Wall clock',
    objects: [eastClock],
    // Flat on the wall; the wall margin already keeps you off it.
    obstacles: [],
  },
  {
    id: 'hallway',
    label: 'Hallway and outside floor (placeholder)',
    objects: [hallway],
    obstacles: hallwayObstacles,
  },
];
const setObstaclesFor = (shown) => {
  controls.setObstacles([...closetObstacles, ...shown.flatMap((item) => item.obstacles)], OBSTACLE_MARGIN);
};
setObstaclesFor(toggleable);

// Showing a piece while you stand inside it steps you just outside it.  If
// there's nowhere free nearby, the piece stays hidden.
const setShown = (shown, previous) => {
  setObstaclesFor(shown);
  if (controls.escapeObstacles()) return true;
  setObstaclesFor(previous);
  return false;
};

// Home is where you start: near the south end by the east wall, at eye
// height (67 in), turned 30 degrees right of the windows, looking level.
const HOME = { x: 29, y: EYE_HEIGHT, z: 116, yaw: THREE.MathUtils.degToRad(-30), pitch: 0 };
const HOME_GLIDE_SECONDS = 2.5;

// Clear any leftover glide, drift, or leveling so you end up standing still.
const settle = () => {
  controls.leveling = false;
  controls.nudge = 0;
  controls.drift = { forward: 0, right: 0, up: 0 };
};

controls.camera.position.set(HOME.x, HOME.y, HOME.z);
controls.setYaw(HOME.yaw);
controls.pitch = HOME.pitch;

// The Return home button and the H key fly you back home in a smooth,
// ease-in-out glide.  The glide goes straight there, through walls and
// equipment if they're in the way; walking resumes when it lands.
let homeGlide = null; // { from, t } while flying home

const startHomeGlide = () => {
  settle();
  const pos = camera.position;
  // Turn the short way around.
  let yawChange = (HOME.yaw - controls.yaw) % (Math.PI * 2);
  if (yawChange > Math.PI) yawChange -= Math.PI * 2;
  if (yawChange < -Math.PI) yawChange += Math.PI * 2;
  homeGlide = {
    from: { x: pos.x, y: pos.y, z: pos.z, yaw: controls.yaw, pitch: controls.pitch },
    yawChange,
    t: 0,
  };
};

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Move one frame along the glide.  Returns false once you've landed.
const stepHomeGlide = (dt) => {
  const glide = homeGlide;
  glide.t = Math.min(glide.t + dt / HOME_GLIDE_SECONDS, 1);
  const k = easeInOut(glide.t);
  const { from } = glide;
  camera.position.set(
    from.x + (HOME.x - from.x) * k,
    from.y + (HOME.y - from.y) * k,
    from.z + (HOME.z - from.z) * k,
  );
  controls.yaw = from.yaw + glide.yawChange * k;
  controls.pitch = from.pitch + (HOME.pitch - from.pitch) * k;
  camera.rotation.set(controls.pitch, controls.yaw, 0);
  if (glide.t < 1) return true;
  controls.yaw = HOME.yaw;
  settle();
  homeGlide = null;
  return false;
};

const homeButton = document.querySelector('.home-button');
homeButton?.addEventListener('click', () => {
  homeButton.blur();
  startHomeGlide();
});
window.addEventListener('keydown', (e) => {
  if (e.code !== 'KeyH' || e.repeat) return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  startHomeGlide();
});

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
  // While flying home, the glide drives the camera instead of your input.
  if (homeGlide) stepHomeGlide(dt);
  else controls.update(dt);
  eastClock.userData.update();
  renderer.render(scene, camera);
});

// Expose for debugging in the browser console.
window.booth = { scene, camera, controls };

bindInfoPanel();

// A reload puts you back where you were, with the same Show toggles off.
// See session.js.
const session = loadSession();
const panel = bindVisibilityPanel(toggleable, setShown, session?.hidden ?? []);
setObstaclesFor(panel.shownItems());
if (session && controls.canBeAt(session.x, session.y, session.z)) {
  camera.position.set(session.x, session.y, session.z);
  controls.setYaw(session.yaw);
  controls.pitch = session.pitch;
  // Step out if something new (say, a piece added in the code) is in the way.
  controls.escapeObstacles();
}
saveSessionOnLeave(() => {
  const { x, y, z } = camera.position;
  return { x, y, z, yaw: controls.yaw, pitch: controls.pitch, hidden: panel.hiddenIds() };
});
