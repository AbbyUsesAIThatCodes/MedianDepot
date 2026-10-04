import * as THREE from 'three';
import { PALETTE, PATTERNS, appearanceFor } from './palette.js';
import { createMeshKit, createLabel } from './primitives.js';

export const RING_THICKNESS = 0.26;

// Side-wall relief has a constant cross-section at every height. The contact
// faces stay planar, and any fractional layer has exactly its share of volume.
export function createRingGeometry(pattern = 'smooth', fraction = 1) {
  if (!PATTERNS.includes(pattern)) throw new RangeError(`Unknown ring pattern: ${pattern}`);
  if (!(fraction > 0 && fraction <= 1)) throw new RangeError('A ring fraction must be greater than zero and at most one.');
  const shape = new THREE.Shape();
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const angle = i / segments * Math.PI * 2;
    let radius = 0.73 + 0.045 * Math.cos(8 * angle);
    if (pattern === 'ribbed') radius += 0.055 * Math.pow(Math.max(0, Math.cos(16 * angle)), 2);
    if (pattern === 'grooved') radius -= 0.085 * Math.pow(Math.max(0, Math.cos(12 * angle)), 4);
    if (pattern === 'studded') radius += 0.075 * Math.pow(Math.max(0, Math.cos(8 * angle)), 4);
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.31, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: RING_THICKNESS * fraction, bevelEnabled: false, curveSegments: 24, steps: 1 });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function createFoamRing({ color = '#64b7b3', pattern = 'smooth', symbol = 'A', identity = 'ring', fraction = 1 } = {}) {
  const group = new THREE.Group();
  group.name = `Foam Ring ${identity}`;
  group.userData = { identity, color, pattern, symbol, fraction };
  const mesh = new THREE.Mesh(createRingGeometry(pattern, fraction), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh);
  const contours = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 50), new THREE.LineBasicMaterial({ color: new THREE.Color(color).multiplyScalar(0.62), transparent: true, opacity: 0.8 }));
  group.add(contours);
  // Symbols stay readable on thin layers via an attached tag; their text never
  // changes with the destination. Integrators may use their own anchored labels.
  const mark = createLabel(group, fraction === 1 ? symbol : `${symbol} · ${fraction === 0.5 ? '1/2' : fraction === 1 / 3 ? '1/3' : fraction}`, 0.35, 0.13, [0, RING_THICKNESS * fraction + 0.006, 0.53]);
  mark.rotation.x = -Math.PI / 2;
  return group;
}

export function createPallet({ id, label, quantity, appearance = appearanceFor(0), coveredAbove = 8 }) {
  if (!Number.isInteger(quantity) || quantity < 0) throw new RangeError('Whole-pallet quantities must be nonnegative integers.');
  const group = new THREE.Group();
  group.name = `Pallet ${id}`;
  group.userData = { id, quantity, appearance: { ...appearance }, covered: quantity > coveredAbove };
  const { box } = createMeshKit();
  for (const x of [-0.76, 0, 0.76]) box(group, [0.22, 0.18, 1.72], [x, 0.09, 0], PALETTE.woodDark);
  for (const z of [-0.66, -0.22, 0.22, 0.66]) box(group, [2.05, 0.12, 0.36], [0, 0.23, z], PALETTE.wood);
  const load = new THREE.Group();
  load.name = 'Load';
  load.position.y = 0.29;
  group.add(load);
  if (quantity > coveredAbove) {
    box(load, [1.77, 1.48, 1.51], [0, 0.74, 0], appearance.color, 0.18);
    for (const x of [-0.59, 0.59]) box(load, [0.09, 1.51, 1.55], [x, 0.75, 0], PALETTE.cream);
    createLabel(load, 'Covered Load', 1.22, 0.24, [0, 1.23, 0.8]);
    createLabel(load, `${appearance.symbol} · ${appearance.pattern}`, 1.2, 0.21, [0, 0.91, 0.8]);
  } else {
    for (let i = 0; i < quantity; i++) {
      const ring = createFoamRing({ ...appearance, identity: `${id}-R${i + 1}` });
      ring.position.y = i * RING_THICKNESS;
      load.add(ring);
    }
  }
  box(group, [1.36, 0.9, 0.09], [0, 0.62, 0.99], PALETTE.ink);
  const quantityTag = createLabel(group, String(quantity), 1.29, 0.83, [0, 0.62, 1.042], { subtitle: `${label} · ${appearance.symbol} · Quantity` });
  quantityTag.name = 'Quantity Tag';
  // An invisible solid pick volume also makes an empty pallet easy to select.
  const hit = new THREE.Mesh(new THREE.BoxGeometry(2.1, Math.max(1.3, quantity <= coveredAbove ? 0.3 + quantity * RING_THICKNESS : 1.8), 1.9), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = hit.geometry.parameters.height / 2;
  group.add(hit);
  return group;
}
