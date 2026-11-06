import * as THREE from 'three';
import {
  ROOM,
  CLOSET,
  REWIND_TABLE,
  CONDUIT_LEDGE,
  VERTICAL_CONDUIT,
  DUCT,
  EXHAUST_BOX,
} from './dimensions.js';

// Fixed pieces of the booth.  Each builder returns the object and its
// footprint, { minX, maxX, minZ, maxZ }, for walking collisions.

// Placeholder colors and sizes, to be replaced with measurements or photos.
const CLOSET_COLOR = 0xd9d4c5; // off-white, like the side walls (guess)
const WOOD = 0x9e7c4a; // guess
const TABLE_TOP = 1.5; // top thickness (guess)
const TABLE_LEG = 2; // square leg size (guess)
const CONDUIT_COLOR = 0xb8b4a6; // painted conduit (guess)
const DUCT_COLOR = 0x9a9ea3; // galvanized steel (guess)

function material(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0 });
}

// A plain block from the floor to the ceiling, in the southeast corner.
export function buildElectricalCloset() {
  const width = CLOSET.x1 - CLOSET.x0;
  const closet = new THREE.Mesh(
    new THREE.BoxGeometry(width, ROOM.height, CLOSET.depth),
    material(CLOSET_COLOR),
  );
  const minZ = ROOM.depth - CLOSET.depth;
  closet.position.set(CLOSET.x0 + width / 2, ROOM.height / 2, minZ + CLOSET.depth / 2);
  closet.name = 'electrical-closet';
  return { closet, footprint: { minX: CLOSET.x0, maxX: CLOSET.x1, minZ, maxZ: ROOM.depth } };
}

// A simple table: a wood top on four square legs, open underneath.
export function buildRewindTable() {
  const t = REWIND_TABLE;
  const maxZ = ROOM.depth - t.gap;
  const minZ = maxZ - t.depth;
  const width = t.x1 - t.x0;
  const wood = material(WOOD);

  const table = new THREE.Group();
  table.name = 'rewind-table';

  const top = new THREE.Mesh(new THREE.BoxGeometry(width, TABLE_TOP, t.depth), wood);
  top.position.set(t.x0 + width / 2, t.height - TABLE_TOP / 2, minZ + t.depth / 2);
  table.add(top);

  const legHeight = t.height - TABLE_TOP;
  const legGeo = new THREE.BoxGeometry(TABLE_LEG, legHeight, TABLE_LEG);
  for (const x of [t.x0 + TABLE_LEG / 2, t.x1 - TABLE_LEG / 2]) {
    for (const z of [minZ + TABLE_LEG / 2, maxZ - TABLE_LEG / 2]) {
      const leg = new THREE.Mesh(legGeo, wood);
      leg.position.set(x, legHeight / 2, z);
      table.add(leg);
    }
  }

  return { table, footprint: { minX: t.x0, maxX: t.x1, minZ, maxZ } };
}

// A box described by its corners, in room coordinates.
function box(name, color, [x0, y0, z0], [x1, y1, z1]) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0),
    material(color),
  );
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  mesh.name = name;
  return mesh;
}

// The conduit on the west wall: a ledge across the full width, and a
// vertical run at the south end from the ledge up to the ceiling.
export function buildWestWallConduit() {
  const group = new THREE.Group();
  group.name = 'west-wall-conduit';
  group.add(
    box('conduit-ledge', CONDUIT_COLOR, [0, CONDUIT_LEDGE.y0, 0], [ROOM.width, CONDUIT_LEDGE.y1, CONDUIT_LEDGE.depth]),
    box('vertical-conduit', CONDUIT_COLOR, [0, CONDUIT_LEDGE.y1, 0], [VERTICAL_CONDUIT.width, ROOM.height, VERTICAL_CONDUIT.depth]),
  );
  return group;
}

// The duct across the ceiling, and the exhaust box hanging from the ceiling.
export function buildCeilingFixtures() {
  const group = new THREE.Group();
  group.name = 'ceiling-fixtures';
  const east = ROOM.depth;
  group.add(
    box('duct', DUCT_COLOR, [0, ROOM.height - DUCT.height, east - DUCT.z1], [ROOM.width, ROOM.height, east - DUCT.z0]),
    box(
      'exhaust-box',
      DUCT_COLOR,
      [ROOM.width / 2 - EXHAUST_BOX.width / 2, ROOM.height - EXHAUST_BOX.hang, EXHAUST_BOX.z0],
      [ROOM.width / 2 + EXHAUST_BOX.width / 2, ROOM.height, EXHAUST_BOX.z1],
    ),
  );
  return group;
}
