import * as THREE from 'three';
import { ROOM, WALL, HALLWAY } from './dimensions.js';

// Placeholder pieces outside the booth, from Richard's Nov 18 field notes.
// Everything here is rough and unconfirmed, so it's drawn in solid amber to
// stand out from the measured booth.  The builder returns the objects and
// their collision boxes, { minX, maxX, minY, maxY, minZ, maxZ }.

const PLACEHOLDER_COLOR = 0xe0a64a; // amber, so it's clearly not a real finish
// There are no lights out here, so faces that point the same way get the same
// shade and their corners would blur together.  A thin darker line along every
// corner keeps them visible, without changing the lighting in the booth.
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

// A mesh with a line along its corners.  Lines are drawn only where two faces
// meet at an angle, so each piece is one continuous surface with no seams.
function placeholder(geometry) {
  const mesh = new THREE.Mesh(geometry, placeholderMaterial());
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: EDGE_COLOR })));
  return mesh;
}

function box(minX, maxX, minY, maxY, minZ, maxZ) {
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

// A flat slab seen from above: the rectangle `outer` with the rectangle `hole`
// cut out of it, from height y0 up to y1.  Each is { minX, maxX, minZ, maxZ }.
function slab(outer, hole, y0, y1) {
  const shape = new THREE.Shape();
  shape.moveTo(outer.minX, outer.minZ);
  shape.lineTo(outer.maxX, outer.minZ);
  shape.lineTo(outer.maxX, outer.maxZ);
  shape.lineTo(outer.minX, outer.maxZ);
  shape.closePath();
  const cut = new THREE.Path();
  cut.moveTo(hole.minX, hole.minZ);
  cut.lineTo(hole.maxX, hole.minZ);
  cut.lineTo(hole.maxX, hole.maxZ);
  cut.lineTo(hole.minX, hole.maxZ);
  cut.closePath();
  shape.holes.push(cut);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false });
  geometry.rotateX(Math.PI / 2); // the shape's second axis becomes z; the extrusion hangs down from y = 0
  geometry.translate(0, y1, 0);
  return placeholder(geometry);
}

// A wall from the floor up to `top`, from xMin to xMax and zMin to zMax, with a
// doorway notched out of its bottom between doorMinX and doorMaxX.
function wallWithDoorway(xMin, xMax, zMin, zMax, top, doorMinX, doorMaxX, doorTop) {
  const shape = new THREE.Shape();
  shape.moveTo(xMin, 0);
  shape.lineTo(doorMinX, 0);
  shape.lineTo(doorMinX, doorTop);
  shape.lineTo(doorMaxX, doorTop);
  shape.lineTo(doorMaxX, 0);
  shape.lineTo(xMax, 0);
  shape.lineTo(xMax, top);
  shape.lineTo(xMin, top);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: zMax - zMin, bevelEnabled: false });
  geometry.translate(0, 0, zMin);
  return placeholder(geometry);
}

// The hallway east of the booth and the floor and ceiling around the booth: the
// far wall across from the booth, and the little office jutting out at the far
// wall's north end, with an opening into the office.  Both ends of the hallway
// are left open.  The floor and ceiling run 48 in past the booth's north,
// south, and west sides for now.
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

  // The floor and ceiling run past the booth on three sides, and out to the far
  // wall.  The booth's own floor and ceiling slabs fill the hole in the middle.
  const slabOuter = {
    minX: minX - H.floorOvershoot,
    maxX: maxX + H.floorOvershoot,
    minZ: -WALL.west - H.floorOvershoot,
    maxZ: farMaxZ,
  };
  const boothHole = { minX: -WALL.side, maxX: ROOM.width + WALL.side, minZ: -WALL.west, maxZ: nearZ };

  // Collision boxes for a slab: the hallway, west, south, and north parts.
  const slabBoxes = (y0, y1) => [
    box(slabOuter.minX, slabOuter.maxX, y0, y1, nearZ, farMaxZ),
    box(slabOuter.minX, slabOuter.maxX, y0, y1, slabOuter.minZ, boothHole.minZ),
    box(slabOuter.minX, boothHole.minX, y0, y1, boothHole.minZ, nearZ),
    box(boothHole.maxX, slabOuter.maxX, y0, y1, boothHole.minZ, nearZ),
  ];

  // Collision boxes for a wall with the office opening: both sides and the lintel.
  const wallBoxes = (zMin, zMax, xMin) => [
    box(xMin, openMinX, 0, top, zMin, zMax),
    box(openMaxX, maxX, 0, top, zMin, zMax),
    box(openMinX, openMaxX, H.openingHeight, top, zMin, zMax),
  ];

  const hallway = new THREE.Group();
  hallway.name = 'hallway-placeholder';
  hallway.add(
    slab(slabOuter, boothHole, -WALL.slab, 0), // floor
    slab(slabOuter, boothHole, top, top + WALL.slab), // ceiling
    wallWithDoorway(minX, maxX, farMinZ, farMaxZ, top, openMinX, openMaxX, H.openingHeight), // the far wall
    wallWithDoorway(jutMinX, maxX, jutMinZ, farMinZ, top, openMinX, openMaxX, H.openingHeight), // the office jut
  );

  const obstacles = [
    ...slabBoxes(-WALL.slab, 0),
    ...slabBoxes(top, top + WALL.slab),
    ...wallBoxes(farMinZ, farMaxZ, minX),
    ...wallBoxes(jutMinZ, farMinZ, jutMinX),
  ];
  return { hallway, obstacles };
}
