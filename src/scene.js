import * as THREE from 'three';
import { PALETTE, appearanceFor } from './shared/palette.js';
import { createPallet } from './shared/cargo.js';
import { createMeshKit, createLabel, disposeTree } from './shared/primitives.js';
import { createSharedWorld, WORLD } from './shared/world.js';
import { EXTERIOR_POSE, INTRO_DURATION_MS, sampleIntro } from './shared/camera.js';
import { pairMarkers } from './pairs.js';

export function createDepot(container, { onSelect, onMove, onActivate, onUnavailable, onIntroEnd, reducedMotion, viewBounds }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.sky);
  scene.fog = new THREE.Fog(PALETTE.sky, 65, 125);
  const camera = new THREE.PerspectiveCamera(EXTERIOR_POSE.fov, 1, 0.1, 180);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  container.prepend(canvas);
  scene.add(new THREE.HemisphereLight('#fff5de', '#7d9c98', 2.7));
  const sun = new THREE.DirectionalLight('#fff0d2', 3.2);
  sun.position.set(-15, 26, 18);
  sun.target.position.set(-4, 0, -3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 27, bottom: -27, near: 1, far: 80 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.045;
  scene.add(sun, sun.target);
  const world = createSharedWorld();
  scene.add(world.root);
  const cargoRoot = new THREE.Group(), slotsRoot = new THREE.Group(), pairsRoot = new THREE.Group();
  scene.add(cargoRoot, slotsRoot, pairsRoot);
  let current = null, pallets = new Map();
  let frame = 0, lastTime = 0, drag = null;
  let introActive = true, introStart = null, unavailable = false;
  let endpoint = { position: [8, 13, 26], target: [4, 0, 2], roll: 0 };
  let size = { width: 1, height: 1 };
  const xFor = index => WORLD.yard[0] + (index - ((current?.order.length ?? 5) - 1) / 2) * WORLD.spacing;
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.4);
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  container.dataset.intro = 'playing';
  function applyPose(pose) {
    camera.position.set(...pose.position);
    camera.up.set(0, 1, 0);
    camera.lookAt(new THREE.Vector3(...pose.target));
    camera.rotateZ(pose.roll ?? 0);
    camera.updateMatrixWorld();
  }
  function setProjection(progress = 1) {
    const safe = viewBounds();
    const offsetX = size.width / 2 - (safe.x + safe.width / 2);
    const offsetY = size.height / 2 - (safe.y + safe.height / 2);
    camera.setViewOffset(size.width, size.height, offsetX * progress, offsetY * progress, size.width, size.height);
    camera.updateProjectionMatrix();
  }
  function fitEndpoint() {
    const safe = viewBounds();
    const aspect = safe.width / safe.height;
    const countScale = Math.max(1, (current?.order.length ?? 5) / 5);
    const distance = 19.5 * Math.max(1, 1.45 / aspect * countScale) * size.height / safe.height;
    endpoint = { position: [4 + distance * 0.1, distance * 0.49, 3 + distance * 0.83], target: [4, 0.7, 2.4], roll: 0 };
  }
  function finishDrag() {
    const previous = drag;
    drag = null;
    if (previous && canvas.hasPointerCapture(previous.pointerId)) canvas.releasePointerCapture(previous.pointerId);
    canvas.style.cursor = 'default';
  }
  function finishIntro(reason = 'skip') {
    if (!introActive) return;
    introActive = false;
    introStart = null;
    container.dataset.intro = 'complete';
    container.dataset.introEnd = reason;
    cargoRoot.position.set(0, 0, 0);
    world.train.position.x = 13.5;
    fitEndpoint(); setProjection(); applyPose(endpoint); finishDrag();
    onIntroEnd?.(reason);
    requestDraw();
  }
  function markUnavailable() {
    unavailable = true;
    finishIntro('renderer-unavailable'); finishDrag(); onUnavailable();
  }
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); markUnavailable(); });
  function makePallet(crate, index) {
    const appearanceIndex = Number(crate.id.match(/C(\d+)$/)?.[1] ?? index + 1) - 1;
    const group = createPallet({ ...crate, appearance: appearanceFor(appearanceIndex) });
    group.userData.crateId = crate.id;
    group.position.set(xFor(index), 0.28, 5);
    const { box } = createMeshKit();
    const selectedBase = box(group, [2.22, 0.08, 2.11], [0, -0.015, 0], '#f4c059');
    selectedBase.visible = false;
    const flag = createLabel(group, 'Selected', 1.55, 0.3, [0, 2.75, 0.3], { background: PALETTE.ink, color: PALETTE.cream });
    flag.visible = false;
    cargoRoot.add(group);
    pallets.set(crate.id, { group, selectedBase, flag, targetX: xFor(index), startX: xFor(index), moveAt: null });
  }
  function rebuildSlots(count) {
    disposeTree(slotsRoot); slotsRoot.clear();
    disposeTree(pairsRoot); pairsRoot.clear();
    const { box } = createMeshKit();
    const markers = pairMarkers(count);
    for (let index = 0; index < count; index++) {
      box(slotsRoot, [2.34, 0.035, 2.85], [xFor(index), 0.22, 5], '#b2c2b9');
      const number = createLabel(slotsRoot, `Position ${index + 1}`, 1.42, 0.27, [xFor(index), 0.27, 6.6], { background: PALETTE.ink, color: PALETTE.cream });
      number.rotation.x = -Math.PI / 4;
      const marker = markers[index];
      for (const xOffset of [-1.16, 1.16]) box(pairsRoot, [0.07, 0.12, 2.6], [xFor(index) + xOffset, 0.35, 5], marker.color);
      for (const z of [3.7, 6.3]) box(pairsRoot, [2.38, 0.12, 0.07], [xFor(index), 0.35, z], marker.color);
      createLabel(pairsRoot, marker.label, 1.95, 0.36, [xFor(index), 3.3, 5.2], { background: marker.color, color: marker.middle ? PALETTE.ink : '#ffffff' });
    }
  }
  function update(crates, state, { showPairs = true } = {}) {
    const changed = current?.code !== state.code;
    current = state;
    if (changed) {
      disposeTree(cargoRoot); cargoRoot.clear(); pallets = new Map();
      crates.forEach(makePallet); rebuildSlots(crates.length); fitEndpoint();
      if (!introActive) { setProjection(); applyPose(endpoint); }
    }
    crates.forEach((crate, index) => {
      const item = pallets.get(crate.id), targetX = xFor(index);
      if (item.targetX !== targetX) {
        item.startX = item.group.position.x; item.targetX = targetX; item.moveAt = performance.now();
      }
      item.selectedBase.visible = item.flag.visible = state.selectedId === crate.id;
      if (reducedMotion()) { item.group.position.x = targetX; item.moveAt = null; }
    });
    container.dataset.phase = state.phase;
    pairsRoot.visible = showPairs && state.phase !== 'sort';
    if (reducedMotion()) finishIntro('reduced-motion');
    requestDraw();
  }
  function rayFor(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
  }
  function idAt(event) {
    if (introActive || unavailable) return null;
    rayFor(event);
    let object = raycaster.intersectObjects(cargoRoot.children, true)[0]?.object;
    while (object && !object.userData.crateId) object = object.parent;
    return object?.userData.crateId;
  }
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag || introActive) return;
    const id = idAt(event);
    if (!id || current?.phase === 'complete') return;
    onSelect(id);
    drag = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    canvas.setPointerCapture(event.pointerId); canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag) { canvas.style.cursor = idAt(event) && current?.phase !== 'complete' ? 'grab' : 'default'; return; }
    if (introActive || current?.phase !== 'sort' || event.pointerId !== drag.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 12) return;
    rayFor(event);
    const point = raycaster.ray.intersectPlane(floor, new THREE.Vector3());
    if (point) onMove(drag.id, Math.max(0, Math.min(current.order.length - 1, Math.round((point.x - 4) / WORLD.spacing + (current.order.length - 1) / 2))));
  });
  canvas.addEventListener('dblclick', event => { const id = idAt(event); if (id) onActivate?.(id); });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, finishDrag);
  window.addEventListener('blur', finishDrag);
  function requestDraw() { if (!frame && !unavailable) frame = requestAnimationFrame(draw); }
  function draw(now) {
    frame = 0; lastTime = now;
    let moving = false;
    if (introActive) {
      if (reducedMotion()) finishIntro('reduced-motion');
      else {
        if (introStart === null) introStart = now;
        const elapsed = now - introStart, pose = sampleIntro('median', elapsed, endpoint);
        setProjection(Math.max(0, Math.min(1, (elapsed / INTRO_DURATION_MS - 0.7) / 0.3))); applyPose(pose);
        const arrival = Math.max(0, Math.min(1, (elapsed / INTRO_DURATION_MS - 0.56) / 0.4));
        const eased = 1 - Math.pow(1 - arrival, 3);
        cargoRoot.position.x = 26 * (1 - eased);
        cargoRoot.position.y = Math.sin(arrival * Math.PI) * 0.5;
        world.train.position.x = 13.5 + 24 * (1 - eased);
        if (pose.complete) finishIntro('arrived');
        moving = introActive;
      }
    }
    pallets.forEach(item => {
      if (item.moveAt !== null && !reducedMotion()) {
        const t = Math.min(1, (now - item.moveAt) / 420), eased = 1 - Math.pow(1 - t, 3);
        item.group.position.x = item.startX + (item.targetX - item.startX) * eased;
        item.group.position.y = 0.28 + Math.sin(t * Math.PI) * 0.38;
        if (t >= 1) item.moveAt = null; else moving = true;
      } else { item.group.position.x = item.targetX; item.group.position.y = 0.28; }
    });
    renderer.render(scene, camera);
    if (moving) requestDraw();
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height || unavailable) return;
    size = { width, height }; renderer.setSize(width, height); fitEndpoint();
    if (introActive) {
      const elapsed = introStart === null ? 0 : Math.max(0, lastTime - introStart);
      setProjection(Math.max(0, Math.min(1, (elapsed / INTRO_DURATION_MS - 0.7) / 0.3))); applyPose(sampleIntro('median', elapsed, endpoint));
    } else { setProjection(); applyPose(endpoint); }
    requestDraw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container); resize();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { finishDrag(); finishIntro('interrupted'); } else requestDraw();
  });
  function inspect() {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    return {
      introActive, pairsVisible: pairsRoot.visible, pairLabels: pairMarkers(current?.order.length ?? 5).map(marker => marker.label), camera: { position: camera.position.toArray(), target: introActive ? null : endpoint.target, fov: camera.fov },
      pallets: [...pallets].map(([id, item]) => {
        const point = item.group.localToWorld(new THREE.Vector3(0, 0.68, 1.06)).project(camera);
        return { id, quantity: item.group.userData.quantity, covered: item.group.userData.covered, visibleRings: item.group.getObjectByName('Load').children.filter(child => child.userData.fraction === 1).length, appearance: item.group.userData.appearance, x: (point.x + 1) / 2 * size.width, y: (1 - point.y) / 2 * size.height };
      }),
    };
  }
  return { update, resize, skipIntro: () => finishIntro('skip'), reduceMotion: () => { finishIntro('reduced-motion'); requestDraw(); }, inspect };
}
