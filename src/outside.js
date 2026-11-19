import * as THREE from 'three';
import { ROOM, WALL, HALLWAY } from './dimensions.js';
import { hardwoodMaterial } from './hardwood.js';
import { CEILING_COLOR, HALL_WALL_COLOR } from './booth.js';

// Placeholder pieces outside the booth, from Richard's Nov 18 field notes.
// Everything here is rough and unconfirmed.  The hallway walls are a light
// gray (the real ones are painted white), and the ceiling is the same soft
// white as the booth's ceiling.  The builder returns the objects and their
// collision boxes, { minX, maxX, minY, maxY, minZ, maxZ }.

// Thin darker lines distinguish the corners of the placeholder hallway.
const EDGE_COLOR = 0x6b6d70; // darker gray

function placeholderMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
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
function placeholder(geometry, material) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: EDGE_COLOR })));
  return mesh;
}

function box(minX, maxX, minY, maxY, minZ, maxZ) {
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

// A flat slab seen from above, from height y0 up to y1.  outline is a list of
// [x, z] corners; hole, if given, is a rectangle { minX, maxX, minZ, maxZ } cut
// out of it.
function slab(outline, hole, y0, y1, material) {
  const shape = new THREE.Shape();
  outline.forEach(([x, z], i) => (i === 0 ? shape.moveTo(x, z) : shape.lineTo(x, z)));
  shape.closePath();
  if (hole) {
    const cut = new THREE.Path();
    cut.moveTo(hole.minX, hole.minZ);
    cut.lineTo(hole.maxX, hole.minZ);
    cut.lineTo(hole.maxX, hole.maxZ);
    cut.lineTo(hole.minX, hole.maxZ);
    cut.closePath();
    shape.holes.push(cut);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false });
  geometry.rotateX(Math.PI / 2); // the shape's second axis becomes z; the extrusion hangs down from y = 0
  geometry.translate(0, y1, 0);
  return placeholder(geometry, material);
}

function rectOutline(r) {
  return [[r.minX, r.minZ], [r.maxX, r.minZ], [r.maxX, r.maxZ], [r.minX, r.maxZ]];
}

// A wall from the floor up to `top`, from xMin to xMax and zMin to zMax, with a
// doorway notched out of its bottom between doorMinX and doorMaxX.  Walls are
// light gray.
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
  return placeholder(geometry, placeholderMaterial(HALL_WALL_COLOR));
}

// The hallway east of the booth and the floor and ceiling around the booth (the
// floor is pretend hardwood; the ceiling is soft white; the walls are light gray): the
// far wall across from the booth, and the little office jutting out at the far
// wall's north end, with an opening into the office.  Both ends of the hallway
// are left open.  The floor and ceiling run 48 in past the booth's north and
// south sides for now.  On the west side the ceiling runs 20 ft past the booth,
// and the floor stops at the booth's west wall, which carries on down below it
// (booth.js), so the floor drops away right in front of the booth.
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

  // The floor and ceiling run past the booth to the north and south, and out to
  // the far wall.  The ceiling also runs out past the booth to the west; the
  // floor doesn't.  The booth's own floor and ceiling slabs fill the gap in the
  // middle.
  const sideMinX = minX - H.floorOvershoot;
  const sideMaxX = maxX + H.floorOvershoot;
  const boothHole = { minX: -WALL.side, maxX: ROOM.width + WALL.side, minZ: -WALL.west, maxZ: nearZ };
  const ceilingOuter = { minX: sideMinX, maxX: sideMaxX, minZ: -WALL.west - H.ceilingWest, maxZ: farMaxZ };
  // The floor, seen from above, is a U around the booth, open to the west.
  const floorOutline = [
    [sideMinX, boothHole.minZ],
    [boothHole.minX, boothHole.minZ],
    [boothHole.minX, boothHole.maxZ],
    [boothHole.maxX, boothHole.maxZ],
    [boothHole.maxX, boothHole.minZ],
    [sideMaxX, boothHole.minZ],
    [sideMaxX, farMaxZ],
    [sideMinX, farMaxZ],
  ];

  // Collision boxes for a slab: the hallway, south, and north parts, plus the
  // west part when the slab has one.
  const slabBoxes = (y0, y1, westMinZ) => [
    box(sideMinX, sideMaxX, y0, y1, nearZ, farMaxZ),
    box(sideMinX, boothHole.minX, y0, y1, boothHole.minZ, nearZ),
    box(boothHole.maxX, sideMaxX, y0, y1, boothHole.minZ, nearZ),
    ...(westMinZ === undefined ? [] : [box(sideMinX, sideMaxX, y0, y1, westMinZ, boothHole.minZ)]),
  ];

  // Collision boxes for a wall with the office opening: both sides and the lintel.
  const wallBoxes = (zMin, zMax, xMin) => [
    box(xMin, openMinX, 0, top, zMin, zMax),
    box(openMaxX, maxX, 0, top, zMin, zMax),
    box(openMinX, openMaxX, H.openingHeight, top, zMin, zMax),
  ];

  // The floor is pretend hardwood, like the booth's; it gets the same nudge as
  // the other pieces so the edge lines don't flicker.
  const floorMaterial = hardwoodMaterial();
  floorMaterial.polygonOffset = true;
  floorMaterial.polygonOffsetFactor = 1;
  floorMaterial.polygonOffsetUnits = 1;

  const hallway = new THREE.Group();
  hallway.name = 'hallway-placeholder';
  // Stand-in until the actual fixture is identified.  All fixture sizes are guesses.
  const fixture = new THREE.Group();
  fixture.name = 'hallway-fluorescent-placeholder';
  fixture.position.set((minX + maxX) / 2, top, (nearZ + farMinZ) / 2);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(49, 1, 3), placeholderMaterial(CEILING_COLOR));
  housing.position.y = -0.5;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 48, 16), new THREE.MeshBasicMaterial({ color: 0xfffefa }));
  tube.rotation.z = Math.PI / 2;
  tube.position.y = -1.75;
  fixture.add(housing, tube);
  // Spread the neutral light along the tube in this inch-scale scene.
  for (const x of [-16, 0, 16]) {
    const light = new THREE.SpotLight(0xfffefa, 550, 120, Math.PI * 0.48, 0.35, 2);
    light.position.set(x, -2.6, 0);
    light.target.position.set(x, -top, 0);
    fixture.add(light, light.target);
  }
  hallway.add(fixture);
  hallway.add(
    slab(floorOutline, null, -WALL.slab, 0, floorMaterial), // floor
    slab(rectOutline(ceilingOuter), boothHole, top, top + WALL.slab, placeholderMaterial(CEILING_COLOR)), // ceiling
    wallWithDoorway(minX, maxX, farMinZ, farMaxZ, top, openMinX, openMaxX, H.openingHeight), // the far wall
    wallWithDoorway(jutMinX, maxX, jutMinZ, farMinZ, top, openMinX, openMaxX, H.openingHeight), // the office jut
  );

  const obstacles = [
    ...slabBoxes(-WALL.slab, 0),
    ...slabBoxes(top, top + WALL.slab, ceilingOuter.minZ),
    ...wallBoxes(farMinZ, farMaxZ, minX),
    ...wallBoxes(jutMinZ, farMinZ, jutMinX),
  ];
  return { hallway, obstacles };
}
