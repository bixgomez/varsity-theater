import * as THREE from 'three';

// A placeholder projector stand: a steel top plate on four square legs.
// Barco requires a 16" zone around the projector free of anything
// combustible, so this is drawn as steel.
const STEEL = 0x6d7175;
const PLATE = 1.5; // top plate thickness
const LEG = 2; // square leg size
const OVERHANG = 1; // plate overhang past the footprint on each side

export function buildStand({ minX, maxX, minZ, maxZ, top }) {
  const g = new THREE.Group();
  g.name = 'projector-stand';
  const material = new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.5, metalness: 0.6 });

  const x0 = minX - OVERHANG;
  const x1 = maxX + OVERHANG;
  const z0 = minZ - OVERHANG;
  const z1 = maxZ + OVERHANG;

  const plate = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, PLATE, z1 - z0), material);
  plate.position.set((x0 + x1) / 2, top - PLATE / 2, (z0 + z1) / 2);
  g.add(plate);

  const legHeight = top - PLATE;
  const legGeo = new THREE.BoxGeometry(LEG, legHeight, LEG);
  for (const x of [x0 + LEG / 2, x1 - LEG / 2]) {
    for (const z of [z0 + LEG / 2, z1 - LEG / 2]) {
      const leg = new THREE.Mesh(legGeo, material);
      leg.position.set(x, legHeight / 2, z);
      g.add(leg);
    }
  }

  return { stand: g, footprint: { minX: x0, maxX: x1, minZ: z0, maxZ: z1 } };
}
