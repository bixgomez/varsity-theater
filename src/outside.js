import * as THREE from 'three';
import { ROOM, WALL, HALLWAY } from './dimensions.js';

// Placeholder pieces outside the booth, from Richard's Nov 18 field notes.
// Everything here is rough and unconfirmed, so it's drawn in solid amber to
// stand out from the measured booth.  Each builder returns the
// object and its collision boxes, { minX, maxX, minY, maxY, minZ, maxZ }.

const PLACEHOLDER_COLOR = 0xe0a64a; // amber, so it's clearly not a real finish
// There are no lights out here, so faces that point the same way get the same
// shade and their corners would blur together.  A thin darker line along every
// edge keeps the corners visible, without changing the lighting in the booth.
const EDGE_COLOR = 0x5a3a0a;

function placeholderMaterial() {
  return new THREE.MeshStandardMaterial({
    color: PLACEHOLDER_COLOR,
    roughness: 0.9,
    metalness: 0,
    // Nudge the faces back a hair so the edge lines don't flicker against them.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

// A box given by its edges, with its matching collision box.
function block(minX, maxX, minY, maxY, minZ, maxZ) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ),
    placeholderMaterial(),
  );
  mesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
  mesh.add(
    new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: EDGE_COLOR })),
  );
  return { mesh, obstacle: { minX, maxX, minY, maxY, minZ, maxZ } };
}

// The hallway east of the booth: a floor and ceiling, the far wall across from
// the booth, and the little office jutting out at the far wall's north end,
// with an opening into the office.  Both ends of the hallway are left open;
// the floor and ceiling run 48 in past the booth's north, south, and west sides
// for now.
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

  // A flat slab outside the booth, used for both the floor and the ceiling: the
  // hallway part, running past both ends of the booth, plus strips along the
  // booth's north, south, and west sides.  The booth's own floor and ceiling
  // slabs cover the middle, so the strips go around it.
  const outsideSlab = (y0, y1) => {
    const slabMinX = minX - H.floorOvershoot;
    const slabMaxX = maxX + H.floorOvershoot;
    const westZ = -WALL.west - H.floorOvershoot;
    const boothMinX = -WALL.side;
    const boothMaxX = ROOM.width + WALL.side;
    return [
      block(slabMinX, slabMaxX, y0, y1, nearZ, farMaxZ), // the hallway
      block(slabMinX, slabMaxX, y0, y1, westZ, -WALL.west), // west of the booth
      block(slabMinX, boothMinX, y0, y1, -WALL.west, nearZ), // south of the booth
      block(boothMaxX, slabMaxX, y0, y1, -WALL.west, nearZ), // north of the booth
    ];
  };

  const pieces = [
    ...outsideSlab(-WALL.slab, 0), // floor
    ...outsideSlab(top, top + WALL.slab), // ceiling
    ...withOpening(farMinZ, farMaxZ, minX), // the far wall
    ...withOpening(jutMinZ, farMinZ, jutMinX), // the office jut
  ];

  const hallway = new THREE.Group();
  hallway.name = 'hallway-placeholder';
  hallway.add(...pieces.map((p) => p.mesh));
  return { hallway, obstacles: pieces.map((p) => p.obstacle) };
}
