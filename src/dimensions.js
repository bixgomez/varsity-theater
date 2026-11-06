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

// Wall thicknesses aren't measured yet; these are placeholders.
export const WALL = {
  west: 6,
  east: 4,
  side: 4,
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

// Rewind table next to the door, on its north side.
// x0/x1: distance from the south wall.  gap: space between the table and the
// east wall.
export const REWIND_TABLE = { x0: 63, x1: 123.5, gap: 2, depth: 22, height: 38.5 };
