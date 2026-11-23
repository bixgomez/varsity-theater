import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Strong Simplex 35 PR1014-style placeholder, in inches.
//
// The real projectors are in storage, so these are deliberately rough visual
// dimensions.  Keep lens height, reel height, and the threading-side clearance
// separate until the machines can be measured.
export const SIMPLEX_35 = {
  baseWidth: 28,
  baseDepth: 30,
  baseHeight: 24,
  bodyWidth: 18,
  bodyDepth: 20,
  bodyHeight: 28,
  bodyBottom: 24,
  lensFromSouth: 9,
  lensFromBodyBottom: 22.5,
  lensRadius: 2.5,
  lensReach: 5,
  supplyReelCenterY: 75,
  supplyReelRadius: 10.5,
  takeUpReelCenterY: 38,
  takeUpReelRadius: 8,
  reelThickness: 1.25,
  threadingClearance: 30,
};

const BASE = 0x202024;
const BODY = 0x8c8c88;
const PANEL = 0x62635f;
const DARK = 0x292a2a;
const STEEL = 0xb7b8b2;
const CLEARANCE = 0xf0c84b;

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.25, ...opts });
}

function buildReel(radius, thickness, material) {
  const reel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius - 1, 0.8, 8, 32), material);
  rim.rotation.y = Math.PI / 2;
  reel.add(rim);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, thickness, 24), material);
  hub.rotation.z = Math.PI / 2;
  reel.add(hub);

  for (let i = 0; i < 5; i += 1) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(thickness, 0.8, radius * 1.55), material);
    spoke.rotation.x = (i * Math.PI) / 5;
    reel.add(spoke);
  }

  return reel;
}

function buildThreadingZone({ width, depth, height, x, y, z }) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: CLEARANCE, transparent: true, opacity: 0.85 }),
  );
  edges.position.set(x, y, z);
  edges.name = 'threading-clearance';
  return edges;
}

// Builds a PR1014-style projector facing west (-z).  The origin is the
// south-west-bottom corner of the guessed base.
export function buildSimplex35() {
  const s = SIMPLEX_35;
  const g = new THREE.Group();
  g.name = 'simplex-35-pr1014-placeholder';

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(s.baseWidth, s.baseHeight, s.baseDepth),
    mat(BASE, { metalness: 0.4 }),
  );
  base.position.set(s.baseWidth / 2, s.baseHeight / 2, s.baseDepth / 2);
  base.name = 'pedestal';
  g.add(base);

  const baseTop = new THREE.Mesh(
    new THREE.BoxGeometry(s.baseWidth + 4, 2, s.baseDepth + 4),
    mat(DARK, { metalness: 0.5 }),
  );
  baseTop.position.set(s.baseWidth / 2, s.baseHeight + 1, s.baseDepth / 2);
  g.add(baseTop);

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(s.bodyWidth, s.bodyHeight, s.bodyDepth, 3, 1.2),
    mat(BODY, { metalness: 0.35 }),
  );
  body.position.set(
    (s.baseWidth - s.bodyWidth) / 2 + s.bodyWidth / 2,
    s.bodyBottom + s.bodyHeight / 2,
    s.bodyDepth / 2 + 2,
  );
  body.name = 'projector-head';
  g.add(body);

  // The film compartment and operator controls are on the north side of the
  // projector, matching the reference machine and the threading zone.
  const filmDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 16, 12),
    mat(PANEL, { metalness: 0.35 }),
  );
  filmDoor.position.set(s.baseWidth - 0.3, s.bodyBottom + 15, 12);
  filmDoor.name = 'film-compartment';
  g.add(filmDoor);

  const controls = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 8, 5),
    mat(DARK, { metalness: 0.45 }),
  );
  controls.position.set(s.baseWidth - 0.3, s.bodyBottom + 7, 5);
  controls.name = 'operator-controls';
  g.add(controls);

  for (const y of [s.bodyBottom + 5, s.bodyBottom + 8, s.bodyBottom + 11]) {
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.8, 16),
      mat(STEEL, { metalness: 0.8, roughness: 0.35 }),
    );
    knob.rotation.z = Math.PI / 2;
    knob.position.set(s.baseWidth + 0.1, y, 5);
    knob.name = 'operator-control';
    g.add(knob);
  }

  const lensPlate = new THREE.Mesh(
    new THREE.BoxGeometry(7, 7, 0.5),
    mat(PANEL, { metalness: 0.45 }),
  );
  lensPlate.position.set(s.lensFromSouth, s.bodyBottom + s.lensFromBodyBottom, -0.25);
  g.add(lensPlate);

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(s.lensRadius, s.lensRadius, s.lensReach, 32),
    mat(DARK, { metalness: 0.65, roughness: 0.35 }),
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(s.lensFromSouth, s.bodyBottom + s.lensFromBodyBottom, -s.lensReach / 2);
  lens.name = 'lens';
  g.add(lens);

  const lensGlass = new THREE.Mesh(
    new THREE.CircleGeometry(s.lensRadius * 0.72, 32),
    mat(0x4c6473, { metalness: 0.8, roughness: 0.12, emissive: 0x21313a, emissiveIntensity: 0.8 }),
  );
  lensGlass.rotation.y = Math.PI;
  lensGlass.position.set(s.lensFromSouth, s.bodyBottom + s.lensFromBodyBottom, -s.lensReach - 0.02);
  g.add(lensGlass);

  const soundhead = new THREE.Mesh(
    new THREE.CylinderGeometry(8, 8, 5, 32),
    mat(DARK, { metalness: 0.5 }),
  );
  soundhead.rotation.z = Math.PI / 2;
  soundhead.position.set(s.baseWidth - 2.5, 31, 17);
  soundhead.name = 'soundhead';
  g.add(soundhead);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(3, s.supplyReelCenterY - (s.bodyBottom + s.bodyHeight), 3),
    mat(STEEL, { metalness: 0.8, roughness: 0.35 }),
  );
  arm.position.set(s.baseWidth - 4, (s.supplyReelCenterY + s.bodyBottom + s.bodyHeight) / 2, 13);
  arm.name = 'reel-arm';
  g.add(arm);

  const supplyReel = buildReel(s.supplyReelRadius, s.reelThickness, mat(STEEL, { metalness: 0.9, roughness: 0.25 }));
  supplyReel.position.set(s.baseWidth - 4, s.supplyReelCenterY, 13);
  supplyReel.name = 'supply-reel';
  g.add(supplyReel);

  // The lower reel is intentionally separate and adjustable; its height is
  // the question we want to answer when the real machines are measured.
  const takeUpReel = buildReel(s.takeUpReelRadius, s.reelThickness, mat(STEEL, { metalness: 0.9, roughness: 0.25 }));
  takeUpReel.position.set(s.baseWidth - 4, s.takeUpReelCenterY, 10);
  takeUpReel.name = 'take-up-reel';
  g.add(takeUpReel);

  const threadingZone = buildThreadingZone({
    width: s.threadingClearance,
    depth: s.baseDepth + 8,
    height: s.supplyReelCenterY + s.supplyReelRadius,
    x: s.baseWidth + s.threadingClearance / 2,
    y: (s.supplyReelCenterY + s.supplyReelRadius) / 2,
    z: (s.baseDepth + 8) / 2,
  });
  g.userData.threadingZone = threadingZone;
  g.add(threadingZone);

  return g;
}

// Places the placeholder so the lens center sits at (lensX, lensY) and the
// front of the lens is lensFrontZ inches from the west wall.
export function placeSimplex35(projector, { lensX, lensY, lensFrontZ }) {
  const s = SIMPLEX_35;
  const x0 = lensX - s.lensFromSouth;
  const y0 = lensY - s.bodyBottom - s.lensFromBodyBottom;
  const z0 = lensFrontZ + s.lensReach;
  projector.position.set(x0, y0, z0);
  return {
    minX: x0,
    maxX: x0 + s.baseWidth,
    minZ: lensFrontZ,
    maxZ: z0 + s.baseDepth,
    bottom: y0,
  };
}
