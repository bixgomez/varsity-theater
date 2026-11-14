// Booth measurements, in inches.  See MEASUREMENTS.md.
//
// World axes (1 unit = 1 inch):
//   x: south wall (0) to north wall (179)
//   y: floor (0) to ceiling (87)
//   z: west wall (0) to east wall (128)
// The default camera looks down -z, so it starts out facing the windows.

export const ROOM = {
  width: 179, // south to north (x)
  depth: 128, // west to east (z)
  height: 87, // floor to ceiling (y)
};

// Wall, floor, and ceiling thicknesses aren't measured yet; Richard set
// these as placeholders.  slab: floor and ceiling thickness.
export const WALL = {
  west: 4,
  east: 4,
  side: 4,
  slab: 8,
};

// West wall window openings, numbered south to north.
// x0/x1: distance from the south wall.  y0/y1: height from the floor.
export const WINDOWS = [
  { n: 1, x0: 8.75, x1: 25.25, y0: 43, y1: 53.25 },
  { n: 2, x0: 32, x1: 44, y0: 57.5, y1: 70.5 }, // sliding fire shutter
  { n: 3, x0: 53.5, x1: 64.5, y0: 41, y1: 53 },
  { n: 4, x0: 84.75, x1: 94, y0: 58.25, y1: 67.5 },
  { n: 5, x0: 113.5, x1: 124.5, y0: 40.5, y1: 52.5 },
  { n: 6, x0: 132.5, x1: 142.5, y0: 58.25, y1: 68.75 },
  { n: 7, x0: 149.5, x1: 161.5, y0: 42, y1: 54.5 }, // cardboard
  { n: 8, x0: 165, x1: 177, y0: 58, y1: 71 }, // sliding fire shutter
];

// East wall door opening.
export const DOOR = { x0: 25, x1: 61, height: 80.5 };

// Electrical closet in the southeast corner, floor to ceiling.
// x0/x1: distance from the south wall.  depth: out from the east wall.
export const CLOSET = { x0: 0, x1: 21, depth: 50 };

// Conduit ledge on the west wall, running the full width.
// y0/y1: height from the floor.  depth: out from the west wall.
export const CONDUIT_LEDGE = { y0: 32.5, y1: 39, depth: 3.5 };

// Vertical conduit at the south end of the west wall, running up from the
// ledge.  Its top height isn't measured; it's drawn up to the ceiling.
export const VERTICAL_CONDUIT = { width: 6.5, depth: 3.25 };

// Wedge-shaped control box sitting on the conduit ledge.  x0/x1: distance
// from the south wall; the 24 in width is an estimate.  y0/y1: height from
// the floor.  The base is baseDepth deep for the first baseHeight inches; the
// front then slopes back to topDepth at the top.
export const CONTROL_BOX = { x0: 77, x1: 101, y0: 39, y1: 50.5, baseDepth: 7, baseHeight: 3, topDepth: 3.5 };

// Ceiling duct, running the full width.  z0/z1: distance out from the east
// wall.  height: how far it hangs below the ceiling.
export const DUCT = { z0: 46, z1: 58, height: 5.5 };

// Exhaust box hanging from the ceiling.  z0/z1: distance out from the west
// wall.  hang: how far it hangs below the ceiling.  Its position along the
// wall isn't measured; it's centered between the south and north walls.
export const EXHAUST_BOX = { z0: 45.5, z1: 54, width: 8.5, hang: 9.5 };

// Rewind table next to the door, on its north side.
// x0/x1: distance from the south wall.  gap: space between the table and the
// east wall.
export const REWIND_TABLE = { x0: 63, x1: 123.5, gap: 2, depth: 22, height: 38.5 };
