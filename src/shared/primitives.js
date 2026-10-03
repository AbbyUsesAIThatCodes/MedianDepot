import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PALETTE } from './palette.js';

export function createMeshKit() {
  const materials = new Map();
  function material(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.83 }));
    return materials.get(color);
  }
  function mesh(parent, geometry, position, color) {
    const object = new THREE.Mesh(geometry, material(color));
    object.position.set(...position);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(parent, size, position, color, radius = 0.04) {
    return mesh(parent, radius ? new RoundedBoxGeometry(...size, 1, radius) : new THREE.BoxGeometry(...size), position, color);
  }
  function cylinder(parent, radius, height, position, color, sides = 16) {
    return mesh(parent, new THREE.CylinderGeometry(radius, radius, height, sides), position, color);
  }
  function ball(parent, radius, position, color) {
    return mesh(parent, new THREE.IcosahedronGeometry(radius, 1), position, color);
  }
  return { material, mesh, box, cylinder, ball };
}

export function createLabel(parent, text, width, height, position, { background = PALETTE.cream, color = PALETTE.ink, subtitle = '' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = Math.round(canvas.width * height / width);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  function line(value, size, y) {
    ctx.font = `800 ${size}px system-ui, sans-serif`;
    const fit = Math.min(1, canvas.width * 0.9 / ctx.measureText(value).width);
    ctx.font = `800 ${size * fit}px system-ui, sans-serif`;
    ctx.fillText(value, canvas.width / 2, y);
  }
  line(text, canvas.height * (subtitle ? 0.57 : 0.66), canvas.height * (subtitle ? 0.4 : 0.5));
  if (subtitle) line(subtitle, canvas.height * 0.15, canvas.height * 0.81);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const object = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }));
  object.position.set(...position);
  parent.add(object);
  return object;
}

export function disposeTree(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
      if (!material) continue;
      materials.add(material);
      if (material.map) textures.add(material.map);
    }
  });
  geometries.forEach(item => item.dispose());
  textures.forEach(item => item.dispose());
  materials.forEach(item => item.dispose());
}
