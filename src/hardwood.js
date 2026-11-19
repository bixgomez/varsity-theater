import * as THREE from 'three';

// Pretend hardwood for the floor: a drawn texture, not a photo and not a
// measurement.  The boards run north to south (along x) and are 3 in wide.
// The texture is 96 in square and tiles; surfaces should use world x and z as
// their texture coordinates (1 unit = 1 in), so the boards line up everywhere.
//
// The tile has no straight edge.  Each row starts at its own spot, and the
// board that runs off the tile's north edge carries on from its south edge,
// like a board running from one tile into the next.  So rows end at different
// places and the tiles interlock, with no line of joints across the floor.

const TILE_INCHES = 96;
const BOARD_INCHES = 3;
const SIZE = 1024; // pixels
// Board lengths, like random-length strip flooring.
const MIN_BOARD_INCHES = 16;
const MAX_BOARD_INCHES = 80;
// A joint stays at least this far from the joints in the rows on either side.
const JOINT_CLEARANCE_INCHES = 6;

// A small seeded random-number generator, so the floor looks the same every time.
function seeded(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// How far apart two joints are along the tile, counting the wrap from one
// tile into the next.
function jointDistance(a, b) {
  const d = Math.abs(a - b) % TILE_INCHES;
  return Math.min(d, TILE_INCHES - d);
}

// One row of boards: a start point, then random lengths until the row has
// covered one tile's length and comes back around to where it started.  The
// joints are where boards meet, in inches from the tile's south edge (0 to 96).
function layRow(random) {
  const start = random() * TILE_INCHES;
  const end = start + TILE_INCHES;
  const boards = [];
  let x = start;
  while (end - x > MAX_BOARD_INCHES) {
    // Leave room so the last board isn't too short.
    const longest = Math.min(MAX_BOARD_INCHES, end - x - MIN_BOARD_INCHES);
    const length = MIN_BOARD_INCHES + random() * (longest - MIN_BOARD_INCHES);
    boards.push([x, x + length]);
    x += length;
  }
  boards.push([x, end]);
  return { boards, joints: boards.map(([x0]) => x0 % TILE_INCHES) };
}

// How close a row's joints come to the joints of the rows on either side.
function closestJoint(row, neighbors) {
  let closest = Infinity;
  for (const other of neighbors) {
    for (const a of row.joints) {
      for (const b of other.joints) closest = Math.min(closest, jointDistance(a, b));
    }
  }
  return closest;
}

// Lay every row, trying again when a joint lands too close to one in the row
// before.  The last row also checks the first row, since the tile repeats
// that way too.
function layRows(random, count) {
  const rows = [];
  for (let r = 0; r < count; r += 1) {
    const neighbors = r === 0 ? [] : r === count - 1 ? [rows[r - 1], rows[0]] : [rows[r - 1]];
    let best = null;
    let bestGap = -1;
    for (let tries = 0; tries < 50; tries += 1) {
      const row = layRow(random);
      const gap = closestJoint(row, neighbors);
      if (gap > bestGap) {
        best = row;
        bestGap = gap;
      }
      if (gap >= JOINT_CLEARANCE_INCHES) break;
    }
    rows.push(best);
  }
  return rows;
}

function drawBoards() {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const random = seeded(2026);
  const px = SIZE / TILE_INCHES; // pixels per inch
  const rowHeight = SIZE / (TILE_INCHES / BOARD_INCHES);
  const rows = layRows(random, TILE_INCHES / BOARD_INCHES);

  rows.forEach((row, r) => {
    const y = r * rowHeight;
    for (const [start, end] of row.boards) {
      const x0 = start * px;
      const x1 = end * px;
      const length = x1 - x0;
      const hue = 26 + random() * 6;
      const sat = 38 + random() * 14;
      const light = 36 + random() * 12;
      const grain = [];
      const grainLines = 4 + Math.round((end - start) / 12);
      for (let g = 0; g < grainLines; g += 1) {
        const gy = y + 2 + random() * (rowHeight - 4);
        const gx = x0 + random() * length * 0.6;
        const gl = length * (0.2 + random() * 0.5);
        const dark = random() < 0.7;
        grain.push({ gy, gx, gl, dark, tilt: (random() - 0.5) * 2 });
      }

      // A board that runs off the tile's north edge is drawn a second time,
      // one tile to the south, so it carries on from the south edge.
      const shifts = x1 > SIZE ? [0, -SIZE] : [0];
      for (const shift of shifts) {
        ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
        ctx.fillRect(x0 + shift, y, length, rowHeight);

        // Faint grain along the board.
        for (const { gy, gx, gl, dark, tilt } of grain) {
          ctx.strokeStyle = dark ? 'rgba(40, 20, 5, 0.10)' : 'rgba(255, 235, 200, 0.07)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(gx + shift, gy);
          ctx.lineTo(Math.min(gx + gl, x1) + shift, gy + tilt);
          ctx.stroke();
        }

        // The dark gap at the board's end.
        ctx.fillStyle = 'rgba(20, 10, 0, 0.55)';
        ctx.fillRect(x0 + shift, y, 1.5, rowHeight);
      }
    }
    // The dark gap along the board's edge, with a faint highlight under it.
    ctx.fillStyle = 'rgba(20, 10, 0, 0.55)';
    ctx.fillRect(0, y, SIZE, 1.5);
    ctx.fillStyle = 'rgba(255, 235, 200, 0.08)';
    ctx.fillRect(0, y + 1.5, SIZE, 1);
  });
  return canvas;
}

let texture = null;

function hardwoodTexture() {
  if (!texture) {
    texture = new THREE.CanvasTexture(drawBoards());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1 / TILE_INCHES, 1 / TILE_INCHES);
    texture.anisotropy = 8;
  }
  return texture;
}

// A new material each call, all sharing the one drawn texture.
export function hardwoodMaterial() {
  return new THREE.MeshStandardMaterial({ map: hardwoodTexture(), roughness: 0.7, metalness: 0 });
}

// Give a geometry texture coordinates equal to world x and z, so the boards run
// along x and line up between separate pieces of floor.  `offset` is where the
// geometry's origin sits in the world.
export function setWorldFloorUVs(geometry, offset) {
  const position = geometry.attributes.position;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i += 1) {
    uv[i * 2] = position.getX(i) + offset.x;
    uv[i * 2 + 1] = position.getZ(i) + offset.z;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
