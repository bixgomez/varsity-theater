import { ROOM, WALL, WINDOWS, DOOR } from './dimensions.js';

// Where the camera is allowed to be.  Inside the booth it keeps a margin from
// the walls, floor, and ceiling.  It can pass through a wall only where it
// fits inside a window or the door opening.  Outside the booth it can fly
// anywhere within a big outer box, but it can't pass through the booth's shell.

const OPENING_MARGIN = 2; // inches the eye must stay inside an opening's edges
const OUTER_LIMIT = 600; // inches you can fly out past the booth; a free choice, not a measurement

function box(minX, maxX, minY, maxY, minZ, maxZ) {
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

function grow(b, by) {
  return box(b.minX - by, b.maxX + by, b.minY - by, b.maxY + by, b.minZ - by, b.maxZ + by);
}

function contains(b, x, y, z) {
  return x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY && z >= b.minZ && z <= b.maxZ;
}

// wallMargin: how close the camera may get to a wall, inside or out.
// ceilingMargin: how close it may get to the ceiling, inside.
export function buildFlySpace({ wallMargin, ceilingMargin }) {
  const m = wallMargin;
  const t = OPENING_MARGIN;

  // The outside of the walls, floor slab, and ceiling slab.
  const shell = box(
    -WALL.side,
    ROOM.width + WALL.side,
    -WALL.slab,
    ROOM.height + WALL.slab,
    -WALL.west,
    ROOM.depth + WALL.east,
  );
  const nearShell = grow(shell, m);
  const outer = grow(shell, OUTER_LIMIT);

  const inside = box(m, ROOM.width - m, 0, ROOM.height - ceilingMargin, m, ROOM.depth - m);

  // Each opening is a short tunnel through its wall, long enough to join the
  // inside space to the outside space.
  const openings = WINDOWS.map((w) => box(w.x0 + t, w.x1 - t, w.y0 + t, w.y1 - t, shell.minZ - m, m));
  openings.push(box(DOOR.x0 + t, DOOR.x1 - t, 0, DOOR.height - t, ROOM.depth - m, shell.maxZ + m));

  return function canBeAt(x, y, z) {
    if (contains(inside, x, y, z)) return true;
    if (openings.some((o) => contains(o, x, y, z))) return true;
    return contains(outer, x, y, z) && !contains(nearShell, x, y, z);
  };
}
