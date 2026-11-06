import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Barco SP4K-12C digital cinema projector, in inches.
//
// Overall size is from Barco's spec sheet.  The lens position and the
// smaller details are estimated from Barco's front-view photo; check them
// against the installation manual's dimension drawing.
export const BARCO = {
  width: 27.95, // side to side
  length: 42.13, // front to back, without the lens holder
  height: 21.54, // including feet
  feetHeight: 1.1,
  lensHolderDepth: 44.55 - 42.13, // B-lensholder sticks out this far
  lensFromSouth: 8.2, // lens center, from the body's south side (facing west)
  lensFromBottom: 11.1, // lens center, from the bottom of the feet
  lensRadius: 2.45, // outer barrel (estimate)
  lensProtrusion: 6, // barrel length past the holder (guess; depends on the lens)
};

const BLACK = 0x2c2c30;
const PANEL = 0x2a2a2d;
const ACCENT = 0xe0451f; // red-orange corner bumpers

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2, ...opts });
}

// Builds the projector facing west (-z).  The group's origin is the
// south-west-bottom corner of the body: x runs north, y up, z east (back).
export function buildBarco() {
  const b = BARCO;
  const g = new THREE.Group();
  g.name = 'barco-sp4k-12c';

  const bodyHeight = b.height - b.feetHeight;
  const body = new THREE.Mesh(new RoundedBoxGeometry(b.width, bodyHeight, b.length, 3, 0.8), mat(BLACK));
  body.position.set(b.width / 2, b.feetHeight + bodyHeight / 2, b.length / 2);
  body.name = 'body';
  g.add(body);

  // Corner bumpers, which double as feet.
  const foot = new THREE.BoxGeometry(5.4, b.feetHeight + 0.6, 4);
  for (const x of [2.7, b.width - 2.7]) {
    for (const z of [2, b.length - 2]) {
      const f = new THREE.Mesh(foot, mat(ACCENT, { roughness: 0.4 }));
      f.position.set(x, (b.feetHeight + 0.6) / 2, z);
      g.add(f);
    }
  }

  const lensX = b.lensFromSouth;
  const lensY = b.lensFromBottom;

  // Recessed front panel around the lens.
  const panel = new THREE.Mesh(new THREE.BoxGeometry(9.3, 14.3, 0.2), mat(PANEL));
  panel.position.set(lensX, lensY, -0.1);
  g.add(panel);

  // Lens holder plate.
  const holder = new THREE.Mesh(new THREE.BoxGeometry(6.5, 6.5, b.lensHolderDepth), mat(PANEL));
  holder.position.set(lensX, lensY, -b.lensHolderDepth / 2);
  g.add(holder);

  // Lens barrel and front glass.
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(b.lensRadius, b.lensRadius, b.lensProtrusion, 40),
    mat(0x111113, { metalness: 0.5, roughness: 0.4 }),
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(lensX, lensY, -b.lensHolderDepth - b.lensProtrusion / 2);
  g.add(barrel);

  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(b.lensRadius * 0.75, 40),
    mat(0x3a5a7a, { metalness: 0.9, roughness: 0.1 }),
  );
  glass.rotation.y = Math.PI; // face west
  glass.position.set(lensX, lensY, -b.lensHolderDepth - b.lensProtrusion - 0.01);
  g.add(glass);

  return g;
}

// Distance from the body's front face to the front of the lens.
export const LENS_REACH = BARCO.lensHolderDepth + BARCO.lensProtrusion;

// Places the projector so its lens center sits at (lensX, lensY) and the
// front of the lens is lensFrontZ inches from the west wall.  Returns the
// projector and its footprint for collisions.
export function placeBarco(projector, { lensX, lensY, lensFrontZ }) {
  const x0 = lensX - BARCO.lensFromSouth;
  const y0 = lensY - BARCO.lensFromBottom;
  const z0 = lensFrontZ + LENS_REACH;
  projector.position.set(x0, y0, z0);
  return { minX: x0, maxX: x0 + BARCO.width, minZ: lensFrontZ, maxZ: z0 + BARCO.length, bottom: y0 };
}
