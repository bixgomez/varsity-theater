import * as THREE from 'three';
import { ROOM, WALL, HALLWAY } from './dimensions.js';

// Placeholder pieces outside the booth, from Richard's Nov 18 field notes.
// Everything here is rough and unconfirmed, so it's drawn in a see-through
// amber to stand out from the measured booth.  Each builder returns the
// object and its collision boxes, { minX, maxX, minY, maxY, minZ, maxZ }.

const PLACEHOLDER_COLOR = 0xe0a64a; // amber, so it's clearly not a real finish
const PLACEHOLDER_OPACITY = 0.45;

function placeholderMaterial() {
  return new THREE.MeshStandardMaterial({
    color: PLACEHOLDER_COLOR,
    roughness: 0.9,
    metalness: 0,
    transparent: true,
    opacity: PLACEHOLDER_OPACITY,
    depthWrite: false,
  });
}

// A box given by its edges, with its matching collision box.
function block(minX, maxX, minY, maxY, minZ, maxZ) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ),
    placeholderMaterial(),
  );
  mesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
  return { mesh, obstacle: { minX, maxX, minY, maxY, minZ, maxZ } };
}

// The hallway east of the booth: a floor and ceiling, the far wall across from
// the booth, and the little office jutting out at the far wall's north end,
// with an opening into the office.  Both ends of the hallway are left open.
export function buildHallway() {
  const H = HALLWAY;
  const minX = 0;
  const maxX = ROOM.width;
  const nearZ = ROOM.depth + WALL.east; // the booth's outer east face
  const farMinZ = nearZ + H.width; // the far wall's face toward the booth
  const farMaxZ = farMinZ + H.wallThickness;
  const jutMinZ = farMinZ - H.jutDepth;
  const jutMinX = maxX - H.jutLength;
  const openMaxX = maxX - H.openingFromNorth;
  const openMinX = openMaxX - H.openingWidth;
  const top = ROOM.height;

  // A wall piece with the office opening cut out of it.
  const withOpening = (zMin, zMax, xMin) => [
    block(xMin, openMinX, 0, top, zMin, zMax),
    block(openMaxX, maxX, 0, top, zMin, zMax),
    block(openMinX, openMaxX, H.openingHeight, top, zMin, zMax),
  ];

  const pieces = [
    block(minX, maxX, -WALL.slab, 0, nearZ, farMaxZ), // floor
    block(minX, maxX, top, top + WALL.slab, nearZ, farMaxZ), // ceiling
    ...withOpening(farMinZ, farMaxZ, minX), // the far wall
    ...withOpening(jutMinZ, farMinZ, jutMinX), // the office jut
  ];

  const hallway = new THREE.Group();
  hallway.name = 'hallway-placeholder';
  hallway.add(...pieces.map((p) => p.mesh));
  return { hallway, obstacles: pieces.map((p) => p.obstacle) };
}
