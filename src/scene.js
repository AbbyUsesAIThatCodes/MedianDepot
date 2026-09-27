import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const COLORS = { wood: '#dcb474', edge: '#a87741', teal: '#357779', dark: '#254a4d', cream: '#f8edcc', orange: '#d37c4f', ground: '#b9c7a0', rail: '#647271' };
const SPACING = 2.65;
const xFor = index => (index - 2) * SPACING;

export function createDepot(container, { onSelect, onMove, onUnavailable, reducedMotion }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dce7dc');
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 160);
  const target = new THREE.Vector3(0, 0, -1.8);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.prepend(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    onUnavailable();
  });
  const hemisphere = new THREE.HemisphereLight('#fff6e1', '#718477', 2.6);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight('#fff0d3', 3.3);
  sun.position.set(-8, 18, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 16, bottom: -16, near: 1, far: 60 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);

  const materials = new Map();
  function material(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.86 }));
    return materials.get(color);
  }
  function box(parent, dimensions, position, color, radius = 0.035) {
    const geometry = radius ? new RoundedBoxGeometry(...dimensions, 2, radius) : new THREE.BoxGeometry(...dimensions);
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(parent, radius, height, position, color, sides = 12) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, sides), material(color));
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function label(parent, text, width, height, position, { background = COLORS.cream, color = COLORS.dark, subtitle = '' } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = Math.round(canvas.width * height / width);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const scale = canvas.height / 256;
    const textSize = canvas.height * (subtitle ? 0.57 : 0.65);
    ctx.font = `800 ${textSize}px system-ui, sans-serif`;
    // Match texture and plane aspect ratios so digits are never squeezed.
    const fit = Math.min(1, canvas.width * 0.9 / ctx.measureText(text).width);
    ctx.font = `800 ${textSize * fit}px system-ui, sans-serif`;
    ctx.fillText(text, canvas.width / 2, canvas.height * (subtitle ? 0.41 : 0.5));
    if (subtitle) {
      ctx.font = `600 ${30 * scale}px system-ui, sans-serif`;
      const subtitleFit = Math.min(1, canvas.width * 0.9 / ctx.measureText(subtitle).width);
      ctx.font = `600 ${30 * scale * subtitleFit}px system-ui, sans-serif`;
      ctx.fillText(subtitle, canvas.width / 2, canvas.height * 0.8);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }));
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  // Small, reusable diorama primitives. No external model or image requests.
  box(scene, [100, 0.5, 100], [0, -0.85, 0], COLORS.ground, 0);
  box(scene, [17.7, 0.55, 10.6], [0, -0.38, -0.15], '#d8d5b8', 0.24);
  box(scene, [15.7, 0.25, 3.45], [0, 0.02, 2], '#889592', 0.12);
  box(scene, [15.7, 0.12, 0.14], [0, 0.19, 3.64], COLORS.cream);
  box(scene, [15.7, 0.14, 0.12], [0, 0.19, 0.35], COLORS.cream);
  for (let index = 0; index < 5; index++) {
    box(scene, [2.35, 0.075, 2.85], [xFor(index), 0.2, 2], '#a4afa5');
    label(scene, `POSITION ${index + 1}`, 1.3, 0.25, [xFor(index), 0.025, 3.75], { background: '#566d6a', color: '#ffffff' });
  }

  // Rails and ties sit behind the sorting apron, never through the crates.
  for (let i = -12; i <= 12; i++) box(scene, [0.17, 0.12, 1.4], [i * 0.85, -0.1, -1.8], '#8b7760');
  for (const z of [-2.3, -1.3]) box(scene, [22, 0.13, 0.09], [0, 0, z], COLORS.rail);

  const building = new THREE.Group();
  building.position.set(-3.6, 0, -5.35);
  scene.add(building);
  box(building, [6.3, 3.45, 3.1], [0, 1.55, 0], '#f0ddae', 0.12);
  box(building, [6.4, 0.68, 3.2], [0, 0.16, 0], COLORS.teal);
  for (const x of [-2.75, 2.75]) box(building, [0.2, 3.25, 0.18], [x, 1.5, 1.63], COLORS.cream);
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-3.55, 0); roofShape.lineTo(3.55, 0); roofShape.lineTo(0, 1.65); roofShape.closePath();
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 3.75, bevelEnabled: false }), material(COLORS.orange));
  roof.position.set(0, 3.22, -1.85);
  roof.castShadow = true;
  building.add(roof);
  for (const x of [-2.05, 2.05]) {
    box(building, [1.0, 1.25, 0.12], [x, 1.5, 1.61], COLORS.dark);
    box(building, [0.8, 1.02, 0.08], [x, 1.5, 1.69], '#99c5c4');
    box(building, [0.07, 1.06, 0.08], [x, 1.5, 1.74], COLORS.cream);
    box(building, [0.9, 0.09, 0.08], [x, 1.5, 1.74], COLORS.cream);
  }
  box(building, [1.45, 2.1, 0.17], [0, 0.85, 1.66], COLORS.dark);
  for (let i = 0; i < 5; i++) box(building, [1.24, 0.27, 0.05], [0, 0.12 + i * 0.32, 1.77], COLORS.teal);
  box(building, [5.4, 0.85, 0.18], [0, 2.6, 1.75], COLORS.dark);
  label(building, 'MEDIAN DEPOT', 4.95, 0.7, [0, 2.6, 1.85], { background: COLORS.dark, color: COLORS.cream });
  box(building, [6.8, 0.13, 1.2], [0, 2.17, 2.1], COLORS.teal);
  for (const x of [-3.05, 3.05]) cylinder(building, 0.065, 2.25, [x, 1, 2.5], COLORS.dark);
  box(building, [6.8, 0.28, 1.2], [0, -0.02, 2.1], '#b9b5a1');

  // A stationary little switch engine establishes the rail-yard setting.
  const train = new THREE.Group();
  train.position.set(5.4, 0, -1.8);
  scene.add(train);
  box(train, [3.1, 0.3, 1.4], [0, 0.5, 0], COLORS.dark);
  for (const x of [-1, 1]) for (const z of [-0.65, 0.65]) {
    const wheel = cylinder(train, 0.38, 0.17, [x, 0.26, z], '#334346');
    wheel.rotation.x = Math.PI / 2;
    const cap = cylinder(train, 0.17, 0.19, [x, 0.26, z], '#b4bdb3');
    cap.rotation.x = Math.PI / 2;
  }
  box(train, [1.7, 1.05, 1.2], [-0.5, 1.13, 0], COLORS.teal, 0.15);
  box(train, [1.0, 1.8, 1.25], [0.87, 1.5, 0], COLORS.teal, 0.08);
  box(train, [1.4, 0.15, 1.6], [0.87, 2.46, 0], COLORS.cream);
  box(train, [0.7, 0.65, 0.06], [0.87, 1.98, 0.66], '#b4d5ce');
  cylinder(train, 0.13, 0.65, [-0.96, 1.85, 0], COLORS.dark);
  box(train, [0.13, 0.48, 0.9], [-1.44, 1.02, 0], COLORS.orange);
  label(train, '01', 0.6, 0.32, [-0.6, 1.2, 0.62], { background: COLORS.teal, color: COLORS.cream });

  function tree(x, z, scale = 1) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, -0.5, z);
    treeGroup.scale.setScalar(scale);
    cylinder(treeGroup, 0.15, 2.6, [0, 1, 0], '#8a7558');
    for (const [y, radius, color] of [[2.25, 1.05, '#738e62'], [3.05, 0.84, '#879c6a'], [3.7, 0.55, '#94aa77']]) {
      const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 1), material(color));
      foliage.position.set(0, y, 0);
      foliage.castShadow = true;
      treeGroup.add(foliage);
    }
    scene.add(treeGroup);
  }
  tree(-9, -7, 1.3); tree(1.3, -8, 1.15); tree(8.8, -7.6, 1.45); tree(-10, 1, 0.9);
  for (let x = 1; x < 10; x++) box(scene, [0.15, 1.0, 0.15], [x, 0.05, -5], '#d6d5b8');
  for (const y of [0.05, 0.5]) box(scene, [9.2, 0.12, 0.1], [5, y, -5], '#e9e2c5');
  // Yard lamps and small details provide scale without visual noise.
  for (const x of [-7.8, 7.8]) {
    cylinder(scene, 0.055, 3.2, [x, 1.48, -0.3], COLORS.dark);
    box(scene, [0.65, 0.14, 0.5], [x, 3.13, -0.3], COLORS.dark);
    box(scene, [0.43, 0.27, 0.3], [x, 2.98, -0.3], '#f8da9f');
  }
  for (const x of [-7.3, 7.3]) {
    box(scene, [0.5, 0.1, 0.5], [x, 0.24, 2.1], COLORS.dark);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.55, 12), material(COLORS.orange));
    cone.position.set(x, 0.52, 2.1); cone.castShadow = true; scene.add(cone);
  }

  let current = null;
  let crateMeshes = new Map();
  const crateRoot = new THREE.Group();
  scene.add(crateRoot);
  function disposeTree(root) {
    root.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material?.map) { object.material.map.dispose(); object.material.dispose(); }
    });
  }
  function makeCrate(crate, index) {
    const group = new THREE.Group();
    group.userData.crateId = crate.id;
    group.position.set(xFor(index), 0.35, 2);
    box(group, [1.95, 1.7, 1.85], [0, 0.85, 0], COLORS.edge, 0.095);
    for (let i = 0; i < 4; i++) {
      box(group, [1.85, 0.34, 1.91], [0, 0.28 + i * 0.39, 0], i % 2 ? '#dfb879' : '#e6c489', 0.035);
    }
    for (const x of [-0.79, 0.79]) {
      box(group, [0.2, 1.84, 1.99], [x, 0.88, 0], COLORS.wood);
      for (const y of [0.22, 1.52]) {
        const nail = new THREE.Mesh(new THREE.SphereGeometry(0.037, 6, 4), material('#765d45'));
        nail.position.set(x, y, 1.01); group.add(nail);
      }
    }
    box(group, [1.95, 0.16, 0.22], [0, 1.77, 0], COLORS.teal);
    box(group, [0.16, 1.74, 0.06], [0, 0.9, -0.98], COLORS.teal);
    label(group, String(crate.quantity), 1.33, 1.01, [0, 0.94, 1.018], { subtitle: `QUANTITY   /   ${crate.label}` });
    const outline = box(group, [2.2, 0.08, 2.13], [0, -0.02, 0], '#f3c25c', 0.05);
    outline.visible = false;
    const flag = label(group, 'SELECTED', 1.5, 0.29, [0, 2.15, 0.25], { background: COLORS.dark, color: COLORS.cream });
    flag.visible = false;
    crateRoot.add(group);
    crateMeshes.set(crate.id, { group, outline, flag, targetX: xFor(index) });
  }
  function update(crates, state) {
    const changedShipment = current?.code !== state.code;
    current = state;
    if (changedShipment) {
      disposeTree(crateRoot);
      crateRoot.clear();
      crateMeshes = new Map();
      crates.forEach(makeCrate);
    }
    crates.forEach((crate, index) => {
      const item = crateMeshes.get(crate.id);
      item.targetX = xFor(index);
      item.outline.visible = item.flag.visible = state.selectedId === crate.id;
      if (reducedMotion()) item.group.position.x = item.targetX;
    });
    container.dataset.phase = state.phase;
    requestDraw();
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);
  function rayFor(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
  }
  function idAt(event) {
    rayFor(event);
    const hit = raycaster.intersectObjects(crateRoot.children, true)[0];
    let object = hit?.object;
    while (object && !object.userData.crateId) object = object.parent;
    return object?.userData.crateId;
  }
  let drag = null;
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    const id = idAt(event);
    if (!id || current?.phase === 'complete') return;
    onSelect(id);
    drag = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag) { canvas.style.cursor = idAt(event) && current?.phase !== 'complete' ? 'grab' : 'default'; return; }
    if (current?.phase !== 'sort' || event.pointerId !== drag.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 12) return;
    rayFor(event);
    const point = raycaster.ray.intersectPlane(floor, new THREE.Vector3());
    if (point) onMove(drag.id, Math.max(0, Math.min(4, Math.round(point.x / SPACING + 2))));
  });
  function finishDrag() { drag = null; canvas.style.cursor = 'default'; }
  canvas.addEventListener('pointerup', finishDrag);
  canvas.addEventListener('pointercancel', finishDrag);
  canvas.addEventListener('lostpointercapture', finishDrag);

  let frame = 0;
  function requestDraw() { if (!frame) frame = requestAnimationFrame(draw); }
  function draw() {
    frame = 0;
    let moving = false;
    crateMeshes.forEach(item => {
      const delta = item.targetX - item.group.position.x;
      if (Math.abs(delta) > 0.005) {
        item.group.position.x += reducedMotion() ? delta : delta * 0.26;
        moving = true;
      } else item.group.position.x = item.targetX;
      item.group.position.y = 0.35 + (current?.selectedId === item.group.userData.crateId ? 0.12 : 0);
    });
    renderer.render(scene, camera);
    if (moving) requestDraw();
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    // Frame the complete sorting row at every aspect ratio without changing game state.
    const distance = camera.aspect < 1.45 ? 25 * (1.45 / camera.aspect) : 25;
    camera.position.set(distance * 0.16, distance * 0.49, distance * 0.83);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    requestDraw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestDraw(); });
  return { update, resize };
}
