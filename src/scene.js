import * as THREE from 'three';
import { PALETTE, appearanceFor } from './shared/palette.js';
import { createPallet } from './shared/cargo.js';
import { createMeshKit, createLabel, disposeTree } from './shared/primitives.js';
import { createSharedWorld, WORLD } from './shared/world.js';
import { EXTERIOR_POSE, INTRO_DURATION_MS, sampleIntro } from './shared/camera.js';
import { pairMarkers } from './pairs.js';
import { createGlow, createMedianArrow } from './scene-cues.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const CAMERA_LIMITS = Object.freeze({ yaw: [-0.55, 0.55], elevation: [0.35, 0.8] });
const DEFAULT_VIEW = Object.freeze({ yaw: 0.06, elevation: 0.52 });

export function createDepot(container, { onSelect, onMove, onActivate, onUnavailable, onIntroEnd, reducedMotion, viewBounds }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.sky); scene.fog = new THREE.Fog(PALETTE.sky, 65, 125);
  const camera = new THREE.PerspectiveCamera(EXTERIOR_POSE.fov, 1, 0.1, 180);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
  const canvas = renderer.domElement; canvas.setAttribute('aria-hidden', 'true'); container.prepend(canvas);
  scene.add(new THREE.HemisphereLight('#fff5de', '#7d9c98', 2.7));
  const sun = new THREE.DirectionalLight('#fff0d2', 3.2);
  sun.position.set(-15, 26, 18); sun.target.position.set(-4, 0, -3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 27, bottom: -27, near: 1, far: 80 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.045; scene.add(sun, sun.target);
  const world = createSharedWorld(); scene.add(world.root);
  const cargoRoot = new THREE.Group(), slotsRoot = new THREE.Group(), pairsRoot = new THREE.Group(); scene.add(cargoRoot, slotsRoot, pairsRoot);
  let current = null, pallets = new Map(), frame = 0, lastTime = 0;
  let gesture = null, lastTap = null, hoveredId = null, hoverPointer = null, pairsVisible = false;
  let introActive = true, introStart = null, unavailable = false;
  let view = { ...DEFAULT_VIEW }, endpoint = { position: [8, 13, 26], target: [4, 1.5, 5], roll: 0 };
  let size = { width: 1, height: 1 }, framingCorners = [];
  const xFor = index => WORLD.yard[0] + (index - ((current?.order.length ?? 5) - 1) / 2) * WORLD.spacing;
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.4), raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  container.dataset.intro = 'playing';
  function applyPose(pose) {
    camera.position.set(...pose.position); camera.up.set(0, 1, 0); camera.lookAt(new THREE.Vector3(...pose.target)); camera.rotateZ(pose.roll ?? 0); camera.updateMatrixWorld();
  }
  function setProjection(progress = 1) {
    const safe = viewBounds(); camera.aspect = size.width / size.height;
    camera.setViewOffset(size.width, size.height, (size.width / 2 - (safe.x + safe.width / 2)) * progress, (size.height / 2 - (safe.y + safe.height / 2)) * progress, size.width, size.height); camera.updateProjectionMatrix();
  }
  function fitEndpoint() {
    const safe = viewBounds(), count = current?.order.length ?? 5, half = (count - 1) * WORLD.spacing / 2 + 1.4;
    const top = Math.max(4.25, ...[...pallets.values()].map(p => p.arrow.position.y + 1.53));
    const target = new THREE.Vector3(4, (top + 0.15) / 2, 5);
    const outward = new THREE.Vector3(Math.sin(view.yaw) * Math.cos(view.elevation), Math.sin(view.elevation), Math.cos(view.yaw) * Math.cos(view.elevation));
    const right = new THREE.Vector3(Math.cos(view.yaw), 0, -Math.sin(view.yaw)), up = new THREE.Vector3().crossVectors(outward, right);
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), tanX = tangent * safe.width / size.height, tanY = tangent * safe.height / size.height;
    let distance = 5; framingCorners = [];
    for (const x of [4 - half, 4 + half]) for (const y of [0.15, top]) for (const z of [3.5, 7.3]) {
      const corner = new THREE.Vector3(x, y, z), relative = corner.clone().sub(target); framingCorners.push(corner);
      distance = Math.max(distance, relative.dot(outward) + Math.max(Math.abs(relative.dot(right)) / tanX, Math.abs(relative.dot(up)) / tanY) * 1.1);
    }
    endpoint = { position: target.clone().addScaledVector(outward, distance).toArray(), target: target.toArray(), roll: 0 };
  }
  function refreshView() { fitEndpoint(); setProjection(); applyPose(endpoint); requestDraw(); }
  function rotateView(yawDelta, elevationDelta) {
    if (introActive || unavailable) return;
    view.yaw = clamp(view.yaw + yawDelta, ...CAMERA_LIMITS.yaw); view.elevation = clamp(view.elevation + elevationDelta, ...CAMERA_LIMITS.elevation); refreshView();
  }
  function resetView() { view = { ...DEFAULT_VIEW }; if (!introActive) refreshView(); }
  function finishGesture() {
    const previous = gesture; gesture = null;
    if (previous && canvas.hasPointerCapture(previous.pointerId)) canvas.releasePointerCapture(previous.pointerId);
    canvas.style.cursor = hoveredId ? 'grab' : 'default';
  }
  function setHover(id) {
    if (hoveredId === id) return; hoveredId = id;
    for (const [key, item] of pallets) item.hoverGlow.visible = key === id;
    if (!gesture) canvas.style.cursor = id ? 'grab' : 'default';
    requestDraw();
  }
  function rememberHoverPointer(event) {
    hoverPointer = event.pointerType === 'touch' ? null : { clientX: event.clientX, clientY: event.clientY };
  }
  function clearHover() { hoverPointer = null; setHover(null); }
  function refreshHover() {
    if (gesture) return;
    // A pallet may move under a stationary mouse, or an overlay may cover it.
    const overCanvas = hoverPointer && document.elementFromPoint(hoverPointer.clientX, hoverPointer.clientY) === canvas;
    setHover(overCanvas ? idAt(hoverPointer) : null);
  }
  function finishIntro(reason = 'skip') {
    if (!introActive) return;
    introActive = false; introStart = null; container.dataset.intro = 'complete'; container.dataset.introEnd = reason;
    cargoRoot.position.set(0, 0, 0); world.train.position.x = 13.5; finishGesture(); onIntroEnd?.(reason); refreshView();
  }
  function markUnavailable() { unavailable = true; finishIntro('renderer-unavailable'); finishGesture(); onUnavailable(); }
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); markUnavailable(); });
  function makePallet(crate, index) {
    const appearanceIndex = Number(crate.id.match(/C(\d+)$/)?.[1] ?? index + 1) - 1;
    const group = createPallet({ ...crate, appearance: appearanceFor(appearanceIndex) }); group.userData.crateId = crate.id;
    const top = new THREE.Box3().setFromObject(group).max.y, arrow = createMedianArrow(top);
    const hoverGlow = createGlow('#fff2a3', Math.max(3.2, top + 0.5)), pairGlow = createGlow('#ffffff', Math.max(3.2, top + 0.5));
    hoverGlow.visible = pairGlow.visible = false; group.add(pairGlow, hoverGlow, arrow); group.position.set(xFor(index), 0.28, 5); cargoRoot.add(group);
    pallets.set(crate.id, { group, arrow, hoverGlow, pairGlow, targetX: xFor(index), startX: xFor(index), moveAt: null });
  }
  function rebuildSlots(count) {
    disposeTree(slotsRoot); slotsRoot.clear(); disposeTree(pairsRoot); pairsRoot.clear(); const { box } = createMeshKit();
    pairMarkers(count).forEach((marker, index) => {
      box(slotsRoot, [2.34, 0.035, 2.85], [xFor(index), 0.22, 5], '#b2c2b9');
      const number = createLabel(slotsRoot, `Position ${index + 1}`, 1.42, 0.27, [xFor(index), 0.27, 6.6], { background: PALETTE.ink, color: PALETTE.cream }); number.rotation.x = -Math.PI / 4;
      createLabel(pairsRoot, marker.label, 1.8, 0.3, [xFor(index), 0.29, 7.05], { background: marker.color, color: marker.middle ? PALETTE.ink : '#ffffff' }).rotation.x = -Math.PI / 4;
    });
  }
  function update(crates, state, { showPairs = true } = {}) {
    const changed = current?.code !== state.code; current = state;
    if (changed) {
      finishGesture(); lastTap = null; hoveredId = null; view = { ...DEFAULT_VIEW }; disposeTree(cargoRoot); cargoRoot.clear(); pallets = new Map();
      crates.forEach(makePallet); rebuildSlots(crates.length); fitEndpoint(); if (!introActive) refreshView();
    }
    const markers = pairMarkers(crates.length); pairsVisible = showPairs && state.phase !== 'sort';
    crates.forEach((crate, index) => {
      const item = pallets.get(crate.id), targetX = xFor(index);
      if (item.targetX !== targetX) { item.startX = item.group.position.x; item.targetX = targetX; item.moveAt = performance.now(); }
      item.arrow.visible = state.medianIds?.includes(crate.id) ?? false; item.pairGlow.visible = pairsVisible;
      item.pairGlow.userData.material.uniforms.tint.value.set(markers[index].color);
      if (reducedMotion()) { item.group.position.x = targetX; item.moveAt = null; }
    });
    container.dataset.phase = state.phase; pairsRoot.visible = pairsVisible;
    if (reducedMotion()) finishIntro('reduced-motion'); requestDraw();
  }
  function rayFor(event) {
    const rect = canvas.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
  }
  function idAt(event) {
    if (introActive || unavailable) return null;
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    rayFor(event); let object = raycaster.intersectObjects(cargoRoot.children, true)[0]?.object;
    while (object && !object.userData.crateId) object = object.parent;
    return object?.userData.crateId ?? null;
  }
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || gesture || introActive || unavailable || !event.isPrimary) return;
    rememberHoverPointer(event);
    const id = idAt(event); setHover(event.pointerType === 'touch' ? null : id);
    gesture = { id, pointerId: event.pointerId, kind: id ? 'pallet' : 'camera', startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false, pointerType: event.pointerType };
    if (id) onSelect(id); canvas.setPointerCapture(event.pointerId); canvas.style.cursor = id ? 'grabbing' : 'move'; event.preventDefault();
  });
  canvas.addEventListener('pointermove', event => {
    rememberHoverPointer(event);
    if (!gesture) { const id = idAt(event); setHover(event.pointerType === 'touch' ? null : id); canvas.style.cursor = id ? 'grab' : 'default'; return; }
    if (event.pointerId !== gesture.pointerId || introActive) return;
    if (!gesture.moved && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) < (gesture.pointerType === 'touch' ? 10 : 8)) return;
    gesture.moved = true; lastTap = null;
    if (gesture.kind === 'camera') rotateView(-(event.clientX - gesture.lastX) * 0.004, (event.clientY - gesture.lastY) * 0.003);
    else { rayFor(event); const point = raycaster.ray.intersectPlane(floor, new THREE.Vector3()); if (point) onMove(gesture.id, clamp(Math.round((point.x - 4) / WORLD.spacing + (current.order.length - 1) / 2), 0, current.order.length - 1)); }
    gesture.lastX = event.clientX; gesture.lastY = event.clientY;
  });
  canvas.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    rememberHoverPointer(event);
    const completed = gesture; finishGesture();
    if (!completed.moved && completed.id) {
      const now = performance.now();
      if (lastTap?.id === completed.id && now - lastTap.at < 400 && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 14) { lastTap = null; onActivate?.(completed.id); }
      else lastTap = { id: completed.id, at: now, x: event.clientX, y: event.clientY };
    } else lastTap = null;
    refreshHover();
  });
  canvas.addEventListener('dblclick', event => event.preventDefault());
  canvas.addEventListener('pointerleave', () => { if (!gesture) clearHover(); });
  for (const event of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(event, () => { if (gesture) { lastTap = null; finishGesture(); clearHover(); } });
  document.addEventListener('keydown', clearHover);
  window.addEventListener('blur', () => { lastTap = null; finishGesture(); clearHover(); });
  function requestDraw() { if (!frame && !unavailable) frame = requestAnimationFrame(draw); }
  function draw(now) {
    frame = 0; lastTime = now; let moving = false;
    if (introActive) {
      if (reducedMotion()) finishIntro('reduced-motion');
      else {
        if (introStart === null) introStart = now;
        const elapsed = now - introStart, pose = sampleIntro('median', elapsed, endpoint);
        setProjection(clamp((elapsed / INTRO_DURATION_MS - 0.7) / 0.3, 0, 1)); applyPose(pose);
        const arrival = clamp((elapsed / INTRO_DURATION_MS - 0.56) / 0.4, 0, 1), eased = 1 - Math.pow(1 - arrival, 3);
        cargoRoot.position.set(26 * (1 - eased), Math.sin(arrival * Math.PI) * 0.5, 0); world.train.position.x = 13.5 + 24 * (1 - eased);
        if (pose.complete) finishIntro('arrived'); moving = introActive;
      }
    }
    pallets.forEach(item => {
      if (item.moveAt !== null && !reducedMotion()) {
        const t = Math.min(1, (now - item.moveAt) / 280), eased = 1 - Math.pow(1 - t, 3);
        item.group.position.x = item.startX + (item.targetX - item.startX) * eased; item.group.position.y = 0.28 + Math.sin(t * Math.PI) * 0.18;
        if (t >= 1) item.moveAt = null; else moving = true;
      } else { item.group.position.x = item.targetX; item.group.position.y = 0.28; }
      for (const light of [item.hoverGlow, item.pairGlow]) light.userData.veil.rotation.y = Math.atan2(camera.position.x - item.group.position.x, camera.position.z - item.group.position.z);
    });
    refreshHover(); renderer.render(scene, camera); if (moving) requestDraw();
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect(); if (!width || !height || unavailable) return;
    size = { width, height }; renderer.setSize(width, height); fitEndpoint();
    if (introActive) { const elapsed = introStart === null ? 0 : Math.max(0, lastTime - introStart); setProjection(clamp((elapsed / INTRO_DURATION_MS - 0.7) / 0.3, 0, 1)); applyPose(sampleIntro('median', elapsed, endpoint)); }
    else { setProjection(); applyPose(endpoint); } requestDraw();
  }
  new ResizeObserver(resize).observe(container); resize();
  document.addEventListener('visibilitychange', () => { if (document.hidden) { finishGesture(); lastTap = null; clearHover(); finishIntro('interrupted'); } else requestDraw(); });
  function project(point) { const p = point.clone().project(camera); return { x: (p.x + 1) / 2 * size.width, y: (1 - p.y) / 2 * size.height }; }
  function inspect() {
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    return {
      introActive, pairsVisible, pairLabels: pairMarkers(current?.order.length ?? 5).map(marker => marker.label), hoveredId,
      camera: { position: camera.position.toArray(), target: introActive ? null : endpoint.target, fov: camera.fov },
      view: { ...view }, limits: CAMERA_LIMITS, safeBounds: viewBounds(), framingCorners: framingCorners.map(project), gesture: gesture?.kind ?? null,
      pallets: [...pallets].map(([id, item]) => ({ id, quantity: item.group.userData.quantity, covered: item.group.userData.covered, visibleRings: item.group.getObjectByName('Load').children.filter(c => c.userData.fraction === 1).length, appearance: item.group.userData.appearance,
        ...project(item.group.localToWorld(new THREE.Vector3(0, 0.68, 1.06))), arrow: item.arrow.visible, arrowTip: project(item.arrow.localToWorld(new THREE.Vector3(0, -0.05, 0))),
        hoverGlow: item.hoverGlow.visible, glowTransparent: item.hoverGlow.userData.material.transparent, glowDepthWrite: item.hoverGlow.userData.material.depthWrite, pairGlow: item.pairGlow.visible, moving: item.moveAt !== null,
      })),
    };
  }
  return { update, resize, resetView, rotateView, skipIntro: () => finishIntro('skip'), reduceMotion: () => { finishIntro('reduced-motion'); requestDraw(); }, inspect };
}
