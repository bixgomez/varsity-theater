import * as THREE from 'three';

// Pretend hardwood for the floor: a drawn texture, not a photo and not a
// measurement.  The boards run north to south (along x) and are 3 in wide.
// The texture is 96 in square and tiles; surfaces should use world x and z as
// their texture coordinates (1 unit = 1 in), so the boards line up everywhere.

const TILE_INCHES = 96;
const BOARD_INCHES = 3;
const SIZE = 1024; // pixels

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

function drawBoards() {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const random = seeded(2026);
  const px = SIZE / TILE_INCHES; // pixels per inch
  const rows = TILE_INCHES / BOARD_INCHES;
  const rowHeight = SIZE / rows;

  for (let row = 0; row < rows; row += 1) {
    const y = row * rowHeight;
    // Each row is two boards meeting at one end joint, at a different spot per row.
    const joint = Math.round((10 + random() * 76) * px);
    const pieces = [
      [0, joint],
      [joint, SIZE],
    ];
    for (const [x0, x1] of pieces) {
      const hue = 26 + random() * 6;
      const sat = 38 + random() * 14;
      const light = 36 + random() * 12;
      ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
      ctx.fillRect(x0, y, x1 - x0, rowHeight);

      // Faint grain along the board.
      for (let g = 0; g < 7; g += 1) {
        const gy = y + 2 + random() * (rowHeight - 4);
        const gx = x0 + random() * (x1 - x0) * 0.6;
        const gl = (x1 - x0) * (0.2 + random() * 0.5);
        ctx.strokeStyle = random() < 0.7 ? 'rgba(40, 20, 5, 0.10)' : 'rgba(255, 235, 200, 0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(Math.min(gx + gl, x1), gy + (random() - 0.5) * 2);
        ctx.stroke();
      }

      // The dark gap at the board's end.
      ctx.fillStyle = 'rgba(20, 10, 0, 0.55)';
      ctx.fillRect(x0, y, 1.5, rowHeight);
    }
    // The dark gap along the board's edge, with a faint highlight under it.
    ctx.fillStyle = 'rgba(20, 10, 0, 0.55)';
    ctx.fillRect(0, y, SIZE, 1.5);
    ctx.fillStyle = 'rgba(255, 235, 200, 0.08)';
    ctx.fillRect(0, y + 1.5, SIZE, 1);
  }
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
