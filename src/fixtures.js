import * as THREE from 'three';
import {
  ROOM,
  CLOSET,
  DOOR,
  REWIND_TABLE,
  CONDUIT_LEDGE,
  VERTICAL_CONDUIT,
  DUCT,
  EXHAUST_BOX,
  CONTROL_BOX,
  EAST_SHELVES,
  EAST_CLOCK,
} from './dimensions.js';

// Fixed pieces of the booth.  Each builder returns the object and its
// footprint, { minX, maxX, minZ, maxZ }, for walking collisions.

// Placeholder colors and sizes, to be replaced with measurements or photos.
const CLOSET_COLOR = 0xd9d4c5; // off-white, like the side walls (guess)
const TABLE_TOP = 1.5; // top thickness (guess)
const TABLE_TOP_COLOR = 0x3e5248; // dark gray green, like the photo (guess)
const TABLE_BODY_COLOR = 0x161616; // black body (guess)
const TABLE_FOOT_COLOR = 0x8a8d90; // metal feet and drawer pulls (guess)
const TABLE_PANEL = 0.75; // side, bottom, and divider panel thickness (guess)
const TABLE_FOOT = 3; // sides and bottom panel stop this far off the floor (Richard, about)
const TABLE_FOOT_SIZE = 1.5; // square metal foot (guess)
// width, height: space per drawer; each is built 0.5 smaller each way, so 10.75 by 6.
// gap: space between the two drawers.  drop: space from the underside of the
// top down to the top drawer.  All guesses from the photo.
const TABLE_DRAWERS = { count: 2, width: 11.25, height: 6.5, gap: 2, drop: 4.5 };
const CONDUIT_COLOR = 0xb8b4a6; // painted conduit (guess)
const DUCT_COLOR = 0x9a9ea3; // galvanized steel (guess)
const CONTROL_BOX_COLOR = 0x8a8d8f; // gray metal panel (guess)
const SHELF_WOOD = 0xc9a66b; // light raw wood, like the photo (guess)
const BRACKET_COLOR = 0x6f7275; // gray steel (guess)
const BRACKET_WIDTH = 1; // (guess)
const BRACKET_THICKNESS = 0.25; // (guess)
const BRACKET_DROP = 6; // how far the wall leg runs down under the shelf (guess)
const BRACKET_INSET = 6; // bracket distance in from each shelf end (guess)

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

// The door leaf, hinged on the south side of the opening and swung into the
// booth until its free edge rests against the electrical closet's north face.
// Colors, thickness, and the gap under it are guesses.
const DOOR_COLOR = 0xc9b48a; // tan, like the photo (guess)
const DOOR_KNOB_COLOR = 0x9a9da0;
const DOOR_THICKNESS = 1.5; // Richard
const DOOR_FLOOR_GAP = 0.5;

export function buildOpenDoor() {
  const width = DOOR.x1 - DOOR.x0;
  const height = DOOR.height - DOOR_FLOOR_GAP;

  // Pivot at the hinge: the south edge of the opening, on the inside face of
  // the east wall.  Turning about y swings the free edge into the room.
  const door = new THREE.Group();
  door.name = 'east-door';
  // The hinge sits one door thickness north of the opening's south edge, so
  // the open leaf stands inside the opening's width (Richard).
  const hingeX = DOOR.x0 + DOOR_THICKNESS;
  door.position.set(hingeX, DOOR_FLOOR_GAP, ROOM.depth);

  door.add(box('door-leaf', DOOR_COLOR, [0, 0, -DOOR_THICKNESS], [width, height, 0]));

  // Round knob on the face that looks into the booth when the door is open
  // (the hallway face when closed), near the free edge.  Sizes are guesses.
  const knob = new THREE.Group();
  knob.name = 'door-knob';
  knob.position.set(width - 2.75, 36 - DOOR_FLOOR_GAP, 0);
  const metal = new THREE.MeshStandardMaterial({ color: DOOR_KNOB_COLOR, roughness: 0.35, metalness: 0.8 });
  const along = (mesh, z) => {
    mesh.rotation.x = Math.PI / 2; // cylinder axis out from the door face
    mesh.position.z = z;
    knob.add(mesh);
  };
  along(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.3, 24), metal), 0.15); // rose
  along(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.4, 16), metal), 1);    // neck
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 16), metal);
  ball.scale.z = 0.8;
  ball.position.z = 2.3;
  knob.add(ball);
  door.add(knob);

  // Just past 90 degrees, so the free edge touches the closet.
  const reach = hingeX - CLOSET.x1 - DOOR_THICKNESS;
  door.rotation.y = Math.PI / 2 + Math.asin(Math.max(0, reach) / width);

  // Collision: the strip between the closet and the hinge, as deep as the door.
  const obstacle = { minX: CLOSET.x1, maxX: hingeX, minZ: ROOM.depth - width, maxZ: ROOM.depth, minY: 0, maxY: DOOR.height };
  return { door, obstacle };
}

// A simple table: a wood top on four square legs, open underneath.
export function buildRewindTable() {
  const t = REWIND_TABLE;
  const maxZ = ROOM.depth - t.gap;
  const minZ = maxZ - t.depth;
  const underTop = t.height - TABLE_TOP;
  const sideBottom = TABLE_FOOT; // the sides stop this far off the floor
  const p = TABLE_PANEL;

  const table = new THREE.Group();
  table.name = 'rewind-table';

  // Green top over a black body.
  table.add(box('rewind-top', TABLE_TOP_COLOR, [t.x0, underTop, minZ], [t.x1, t.height, maxZ]));

  // Solid end panels, raised on short metal feet.
  table.add(
    box('rewind-side-south', TABLE_BODY_COLOR, [t.x0, sideBottom, minZ], [t.x0 + p, underTop, maxZ]),
    box('rewind-side-north', TABLE_BODY_COLOR, [t.x1 - p, sideBottom, minZ], [t.x1, underTop, maxZ]),
  );
  for (const x of [t.x0, t.x1 - TABLE_FOOT_SIZE]) {
    for (const z of [minZ + 1, maxZ - 1 - TABLE_FOOT_SIZE]) {
      table.add(box('rewind-foot', TABLE_FOOT_COLOR, [x, 0, z], [x + TABLE_FOOT_SIZE, sideBottom, z + TABLE_FOOT_SIZE]));
    }
  }

  // Bottom panel between the sides, at the same height the sides stop.
  table.add(box('rewind-bottom', TABLE_BODY_COLOR, [t.x0 + p, sideBottom, minZ], [t.x1 - p, sideBottom + p, maxZ]));

  // Drawers at the south end (the right side, facing the table), hung under
  // the top, with a divider panel on their north side.
  const dx0 = t.x0 + p;
  const dx1 = dx0 + TABLE_DRAWERS.width;
  table.add(box('rewind-drawer-divider', TABLE_BODY_COLOR, [dx1, sideBottom + p, minZ], [dx1 + p, underTop, maxZ]));
  for (let i = 0; i < TABLE_DRAWERS.count; i += 1) {
    const drawerHeight = TABLE_DRAWERS.height - 0.5;
    const y1 = underTop - TABLE_DRAWERS.drop - i * (drawerHeight + TABLE_DRAWERS.gap);
    const y0 = y1 - drawerHeight;
    table.add(box(`rewind-drawer-${i + 1}`, TABLE_BODY_COLOR, [dx0 + 0.25, y0, minZ - 0.5], [dx1 - 0.25, y1, maxZ - p]));
    const pullY = (y0 + y1) / 2;
    const mid = (dx0 + dx1) / 2;
    table.add(box(`rewind-drawer-pull-${i + 1}`, TABLE_FOOT_COLOR, [mid - 2, pullY - 0.3, minZ - 1.1], [mid + 2, pullY + 0.3, minZ - 0.5]));
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

// The wedge-shaped control box on the conduit ledge.  Its side profile (depth
// out from the west wall, height from the floor) is extruded along the wall.
export function buildControlBox() {
  const c = CONTROL_BOX;
  const profile = new THREE.Shape();
  profile.moveTo(0, c.y0);
  profile.lineTo(c.baseDepth, c.y0);
  profile.lineTo(c.baseDepth, c.y0 + c.baseHeight);
  profile.lineTo(c.topDepth, c.y1);
  profile.lineTo(0, c.y1);
  profile.closePath();

  const geometry = new THREE.ExtrudeGeometry(profile, { depth: c.x1 - c.x0, bevelEnabled: false });
  const controlBox = new THREE.Mesh(geometry, material(CONTROL_BOX_COLOR));
  // The profile's x becomes depth from the west wall (z).  Its extrusion runs
  // toward the south, so start at the north edge.
  controlBox.rotation.y = -Math.PI / 2;
  controlBox.position.x = c.x1;
  controlBox.name = 'control-box';
  return controlBox;
}

// The three shelves on the east wall above the rewind table, their north
// ends lined up with the table's, each on two L-shaped metal brackets.
// Returns the group and one box around all of it, brackets included, for
// walking collisions.
export function buildEastShelves() {
  const s = EAST_SHELVES;
  const x1 = REWIND_TABLE.x1;
  const x0 = x1 - s.width;
  const wall = ROOM.depth;
  const front = wall - s.depth;
  const group = new THREE.Group();
  group.name = 'east-shelves';

  s.tops.forEach((top, i) => {
    const under = top - s.thickness;
    group.add(box(`east-shelf-${i + 1}`, SHELF_WOOD, [x0, under, front], [x1, top, wall]));
    for (const bx of [x0 + BRACKET_INSET, x1 - BRACKET_INSET - BRACKET_WIDTH]) {
      // Arm under the shelf, and a leg down the wall.
      group.add(
        box('shelf-bracket-arm', BRACKET_COLOR, [bx, under - BRACKET_THICKNESS, front + 1], [bx + BRACKET_WIDTH, under, wall]),
        box('shelf-bracket-leg', BRACKET_COLOR, [bx, under - BRACKET_DROP, wall - BRACKET_THICKNESS], [bx + BRACKET_WIDTH, under, wall]),
      );
    }
  });

  const lowest = Math.min(...s.tops) - s.thickness - BRACKET_DROP;
  const highest = Math.max(...s.tops);
  return {
    shelves: group,
    obstacle: { minX: x0, maxX: x1, minZ: front, maxZ: wall, minY: lowest, maxY: highest },
  };
}

// The clock face: white, with sans-serif numerals, drawn on a canvas.  The
// hands are separate meshes so they can move.
function clockFaceTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#111111';
  ctx.font = `600 ${size * 0.11}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let n = 1; n <= 12; n += 1) {
    const a = (n / 12) * Math.PI * 2;
    ctx.fillText(String(n), c + Math.sin(a) * size * 0.38, c - Math.cos(a) * size * 0.38);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// A round wall clock flat on the east wall, just north of the shelves: a
// black frame with the face set into its front.
export function buildEastClock() {
  const k = EAST_CLOCK;
  const radius = k.size / 2;
  const frameWidth = 0.6; // black rim around the face (guess)
  const wall = ROOM.depth;
  const x = REWIND_TABLE.x1 + k.gap + radius;

  const clock = new THREE.Group();
  clock.name = 'east-clock';
  clock.position.set(x, k.centerY, wall);

  const frame = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, k.depth, 48),
    material(0x111111),
  );
  frame.rotation.x = Math.PI / 2; // axis out from the wall
  frame.position.z = -k.depth / 2;
  clock.add(frame);

  const face = new THREE.Mesh(
    new THREE.CircleGeometry(radius - frameWidth, 48),
    new THREE.MeshStandardMaterial({ map: clockFaceTexture(), roughness: 0.6 }),
  );
  face.rotation.y = Math.PI; // face into the room (toward the west)
  face.position.z = -k.depth - 0.02;
  clock.add(face);

  // Hands, each on a pivot at the face's center.  Lengths and widths are
  // guesses; the second hand is thin and red so it reads apart from the others.
  const faceZ = -k.depth - 0.02;
  const hand = (length, width, color, lift) => {
    const geometry = new THREE.BoxGeometry(width, length, 0.08);
    geometry.translate(0, length / 2 - width, 0); // short tail past the center
    const pivot = new THREE.Group();
    pivot.position.z = faceZ - lift;
    pivot.add(new THREE.Mesh(geometry, material(color)));
    clock.add(pivot);
    return pivot;
  };
  const hourHand = hand(2.3, 0.3, 0x111111, 0.06);
  const minuteHand = hand(3.4, 0.2, 0x111111, 0.16);
  const secondHand = hand(3.6, 0.07, 0xc0392b, 0.26);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), material(0x111111));
  cap.rotation.x = Math.PI / 2;
  cap.position.z = faceZ - 0.34;
  clock.add(cap);

  // Sets the hands from the browser's local time.  The face looks west, so a
  // positive turn about z reads as clockwise from inside the room.
  clock.userData.update = (now = new Date()) => {
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    secondHand.rotation.z = (seconds / 60) * Math.PI * 2;
    minuteHand.rotation.z = (minutes / 60) * Math.PI * 2;
    hourHand.rotation.z = (hours / 12) * Math.PI * 2;
  };
  clock.userData.update();

  return clock;
}
