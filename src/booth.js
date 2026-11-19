import * as THREE from 'three';
import { ROOM, WALL, WINDOWS, DOOR, WEST_DROP } from './dimensions.js';
import { hardwoodMaterial, setWorldFloorUVs } from './hardwood.js';

// Placeholder colors, roughly matched to the photos.  Step 4 refines these.
// The booth ceiling and the hallway ceiling are one continuous ceiling, so
// they share this color (outside.js imports it).
export const CEILING_COLOR = 0xeae8e3; // soft white

const COLORS = {
  westWall: 0x4f6b5c, // booth green
  eastWall: 0x4f6b5c,
  sideWall: 0xd9d4c5, // off-white
  ceiling: CEILING_COLOR,
  floor: 0x3a403c, // the old floor color; the floor is now pretend hardwood (see hardwood.js)
};

function material(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
}

// A flat wall shape extruded to a thickness.  The shape is drawn in the
// x/y plane and extruded along +z.
function extrudedWall(shape, thickness, color) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  return new THREE.Mesh(geometry, material(color));
}

function rectPath(path, x0, y0, x1, y1) {
  path.moveTo(x0, y0);
  path.lineTo(x1, y0);
  path.lineTo(x1, y1);
  path.lineTo(x0, y1);
  path.closePath();
  return path;
}

function buildWestWall() {
  const shape = rectPath(new THREE.Shape(), 0, 0, ROOM.width, ROOM.height);
  for (const w of WINDOWS) {
    shape.holes.push(rectPath(new THREE.Path(), w.x0, w.y0, w.x1, w.y1));
  }
  const wall = extrudedWall(shape, WALL.west, COLORS.westWall);
  wall.position.z = -WALL.west; // inner face at z = 0
  wall.name = 'west-wall';
  return wall;
}

function buildEastWall() {
  // The door opening touches the floor, so it's a notch in the outline
  // rather than a hole.
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(DOOR.x0, 0);
  shape.lineTo(DOOR.x0, DOOR.height);
  shape.lineTo(DOOR.x1, DOOR.height);
  shape.lineTo(DOOR.x1, 0);
  shape.lineTo(ROOM.width, 0);
  shape.lineTo(ROOM.width, ROOM.height);
  shape.lineTo(0, ROOM.height);
  shape.closePath();
  const wall = extrudedWall(shape, WALL.east, COLORS.eastWall);
  wall.position.z = ROOM.depth; // inner face at z = depth
  wall.name = 'east-wall';
  return wall;
}

function buildSideWall(name, x) {
  // Side walls run past the west and east walls to close the corners.
  const length = ROOM.depth + WALL.west + WALL.east;
  const geometry = new THREE.BoxGeometry(WALL.side, ROOM.height, length);
  const wall = new THREE.Mesh(geometry, material(COLORS.sideWall));
  wall.position.set(x, ROOM.height / 2, (ROOM.depth + WALL.east - WALL.west) / 2);
  wall.name = name;
  return wall;
}

// Floor and ceiling slabs, flush with the outside faces of the walls.  minZ is
// where the slab starts on the west side: the ceiling runs over the west wall,
// but the floor stops at the wall's inner face, because the wall carries on
// down past it (see buildWestDrop).
function buildSlab(name, y, color, minZ, wood = false) {
  const maxZ = ROOM.depth + WALL.east;
  const geometry = new THREE.BoxGeometry(ROOM.width + 2 * WALL.side, WALL.slab, maxZ - minZ);
  const slab = new THREE.Mesh(geometry, wood ? hardwoodMaterial() : material(color));
  slab.position.set(ROOM.width / 2, y, (minZ + maxZ) / 2);
  if (wood) setWorldFloorUVs(geometry, slab.position);
  slab.name = name;
  return slab;
}

// The floor drops away right in front of the booth, so the west wall carries
// on down below the booth floor, across the booth's full outside width.  It
// sits under the west wall and the corners of the side walls, from the floor
// line down, so the wall reads as one face with no seam.
function buildWestDrop() {
  const width = ROOM.width + 2 * WALL.side;
  const geometry = new THREE.BoxGeometry(width, WEST_DROP, WALL.west);
  const drop = new THREE.Mesh(geometry, material(COLORS.westWall));
  drop.position.set(ROOM.width / 2, -WEST_DROP / 2, -WALL.west / 2);
  drop.name = 'west-wall-drop';
  return drop;
}

export function buildBooth() {
  const booth = new THREE.Group();
  booth.name = 'booth';
  booth.add(
    buildWestWall(),
    buildEastWall(),
    buildSideWall('south-wall', -WALL.side / 2),
    buildSideWall('north-wall', ROOM.width + WALL.side / 2),
    buildWestDrop(),
    buildSlab('floor', -WALL.slab / 2, COLORS.floor, 0, true),
    buildSlab('ceiling', ROOM.height + WALL.slab / 2, COLORS.ceiling, -WALL.west),
  );
  return booth;
}

export function buildLights() {
  const lights = new THREE.Group();
  lights.add(new THREE.HemisphereLight(0xfff4e0, 0x8a8478, 1.2));

  // Two ceiling lights, like the spotlights in the photos.
  for (const x of [ROOM.width * 0.35, ROOM.width * 0.7]) {
    const bulb = new THREE.PointLight(0xffe8c0, 1.6, 0, 0);
    bulb.position.set(x, ROOM.height - 6, ROOM.depth * 0.3);
    lights.add(bulb);
  }
  return lights;
}
