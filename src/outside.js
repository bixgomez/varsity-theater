import * as THREE from 'three';
import { ROOM, WALL, NORTH_END } from './dimensions.js';

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

// The wall past the north end of the booth, with the 32 in door in it.  It
// spans the booth's full outside width (west face to east face), floor to
// ceiling.  The door is a gap near the east end.
export function buildNorthEndWall() {
  const minX = ROOM.width + WALL.side + NORTH_END.gap;
  const maxX = minX + NORTH_END.thickness;
  const minZ = -WALL.west;
  const maxZ = ROOM.depth + WALL.east;
  const doorMaxZ = maxZ - NORTH_END.doorOffset;
  const doorMinZ = doorMaxZ - NORTH_END.doorWidth;

  const pieces = [
    block(minX, maxX, 0, ROOM.height, minZ, doorMinZ), // west of the door
    block(minX, maxX, 0, ROOM.height, doorMaxZ, maxZ), // the sliver east of the door
    block(minX, maxX, NORTH_END.doorHeight, ROOM.height, doorMinZ, doorMaxZ), // above the door
  ];

  const wall = new THREE.Group();
  wall.name = 'north-end-wall-placeholder';
  wall.add(...pieces.map((p) => p.mesh));
  return { wall, obstacles: pieces.map((p) => p.obstacle) };
}
