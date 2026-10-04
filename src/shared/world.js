import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { createMeshKit, createLabel } from './primitives.js';

export const WORLD = Object.freeze({ factory: Object.freeze([-14, 0, -7]), yard: Object.freeze([4, 0, 5]), spacing: 2.65, floorY: 0.22 });

export function createSharedWorld() {
  const root = new THREE.Group();
  root.name = 'Foam Factory and Rail Yard';
  const { box, cylinder, ball } = createMeshKit();
  box(root, [120, 0.6, 120], [0, -0.65, 0], PALETTE.ground, 0);
  box(root, [30, 0.35, 13], [4, -0.18, 4], PALETTE.pavement, 0.15);
  box(root, [27, 0.18, 3.45], [4, 0.1, 5], '#849c9d');
  for (const z of [3.28, 6.72]) box(root, [27, 0.07, 0.09], [4, 0.23, z], PALETTE.cream);
  box(root, [8, 0.07, 16], [-14, -0.29, 8], '#c4c5ad');
  for (let z = 3; z < 16; z += 3) box(root, [0.14, 0.025, 1.5], [-14, -0.24, z], PALETTE.cream, 0);

  const factoryInterior = new THREE.Group();
  factoryInterior.position.set(...WORLD.factory);
  factoryInterior.name = 'Factory Interior';
  root.add(factoryInterior);
  box(factoryInterior, [14, 0.35, 12], [0, -0.05, 0], '#9cb9b7');
  box(factoryInterior, [14, 6.2, 0.35], [0, 3, -6], PALETTE.cream);
  box(factoryInterior, [0.35, 6.2, 12], [-7, 3, 0], PALETTE.coral);
  box(factoryInterior, [0.35, 6.2, 12], [7, 3, 0], PALETTE.coral);
  for (const x of [-4.5, 0, 4.5]) {
    box(factoryInterior, [3, 1.6, 0.1], [x, 3.3, -5.76], PALETTE.teal);
    box(factoryInterior, [0.12, 1.7, 0.15], [x, 3.3, -5.65], PALETTE.cream);
  }
  const factoryShell = new THREE.Group();
  factoryShell.name = 'Factory Roof and Front (Hide for Interior Teaching View)';
  factoryShell.position.copy(factoryInterior.position);
  root.add(factoryShell);
  for (const x of [-5.25, 5.25]) box(factoryShell, [3.5, 6, 0.35], [x, 3, 6], PALETTE.coral);
  box(factoryShell, [7, 2, 0.4], [0, 5, 6], PALETTE.coral);
  box(factoryShell, [7.4, 0.24, 1.8], [0, 4.03, 6.55], PALETTE.teal);
  for (const x of [-3.6, 3.6]) box(factoryShell, [0.25, 4, 0.3], [x, 2, 6.35], PALETTE.cream);
  createLabel(factoryShell, 'Foam Works', 7.1, 1.05, [0, 5.2, 6.25], { background: PALETTE.teal, color: PALETTE.cream });
  createLabel(factoryShell, 'Mean Machine', 4.3, 0.58, [0, 3.4, 7.48]);
  for (const x of [-4.8, 4.8]) {
    box(factoryShell, [1.5, 1.9, 0.13], [x, 2.5, 6.25], PALETTE.cream);
    box(factoryShell, [1.24, 1.6, 0.16], [x, 2.5, 6.33], '#78b3bf');
  }
  box(factoryShell, [14.7, 0.45, 12.8], [0, 6.14, 0], PALETTE.teal, 0.12);
  for (const [x, height] of [[-4.6, 4], [-1.8, 2.8]]) {
    cylinder(factoryShell, 0.65, height, [x, 6.4 + height / 2, -2.6], PALETTE.cream);
    cylinder(factoryShell, 0.84, 0.32, [x, 6.4 + height, -2.6], PALETTE.coral);
  }
  // Stylized stationary foam-like puffs, not constantly moving visual noise.
  ball(root, 0.85, [-18.6, 11.1, -9.6], '#eff5dd');
  ball(root, 1.13, [-18.9, 12.4, -10], '#eff5dd');

  for (let x = -8; x <= 29; x++) box(root, [0.22, 0.14, 1.5], [x, -0.03, -0.65], PALETTE.woodDark, 0);
  for (const z of [-1.2, -0.1]) box(root, [39, 0.13, 0.11], [10, 0.08, z], PALETTE.rail, 0);
  const station = new THREE.Group();
  station.position.set(6, 0, -7.2);
  root.add(station);
  box(station, [9, 3.5, 3.5], [0, 1.6, 0], PALETTE.cream);
  box(station, [9.5, 0.55, 4.2], [0, 3.45, 0], PALETTE.coral);
  box(station, [9.5, 0.16, 1.6], [0, 2.4, 2.2], PALETTE.teal);
  box(station, [1.8, 2.2, 0.1], [0, 1, 1.79], PALETTE.teal);
  for (const x of [-3.1, 3.1]) box(station, [1.5, 1.3, 0.12], [x, 1.6, 1.8], '#8dc7ce');
  createLabel(station, 'Median Depot', 6.8, 0.78, [0, 2.91, 2.68], { background: PALETTE.ink, color: PALETTE.cream });

  const train = new THREE.Group();
  train.name = 'Arriving Shipment Engine';
  train.position.set(13.5, 0, -0.65);
  root.add(train);
  box(train, [3.4, 0.3, 1.5], [0, 0.52, 0], PALETTE.ink);
  for (const x of [-1.1, 1.1]) for (const z of [-0.75, 0.75]) {
    const wheel = cylinder(train, 0.42, 0.18, [x, 0.31, z], '#3c5158');
    wheel.rotation.x = Math.PI / 2;
  }
  box(train, [1.9, 1.2, 1.3], [-0.6, 1.25, 0], PALETTE.teal, 0.15);
  box(train, [1.05, 1.9, 1.37], [0.91, 1.6, 0], PALETTE.teal);
  box(train, [1.45, 0.19, 1.75], [0.91, 2.6, 0], PALETTE.cream);
  box(train, [0.72, 0.63, 0.1], [0.91, 2.08, 0.73], '#b9e0dc');
  cylinder(train, 0.16, 0.73, [-1.08, 2.1, 0], PALETTE.ink);
  createLabel(train, '01', 0.8, 0.45, [-0.65, 1.4, 0.68], { background: PALETTE.teal, color: PALETTE.cream });

  for (const [x, z, scale] of [[-25,-14,1.5],[-25,6,1.1],[21,-10,1.5],[27,6,1.2],[0,-17,1.3],[15,-17,1.5],[-6,14,0.9]]) {
    const tree = new THREE.Group();
    tree.position.set(x, -0.3, z); tree.scale.setScalar(scale); root.add(tree);
    cylinder(tree, 0.2, 2.5, [0, 1, 0], PALETTE.woodDark);
    ball(tree, 1.35, [0, 2.8, 0], '#689a70');
    ball(tree, 0.97, [0.35, 3.8, 0], '#8cba7e');
  }
  for (const x of [-9.8, 17.8]) {
    cylinder(root, 0.075, 4, [x, 1.9, 2], PALETTE.ink);
    box(root, [0.8, 0.23, 0.65], [x, 4, 2], PALETTE.ink);
    box(root, [0.53, 0.22, 0.43], [x, 3.8, 2], '#ffdf9c');
  }
  createLabel(root, 'Rail Yard  →', 3.8, 0.64, [-5, 1.6, 4], { background: PALETTE.teal, color: PALETTE.cream });
  for (const x of [-6.5,-3.5]) cylinder(root, 0.06, 1.4, [x,0.6,4], PALETTE.woodDark);
  return { root, train, factoryInterior, factoryShell };
}
