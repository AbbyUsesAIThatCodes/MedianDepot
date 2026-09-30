export const INTRO_DURATION_MS = 7600;
export const EXTERIOR_POSE = Object.freeze({ position: Object.freeze([22, 18, 32]), target: Object.freeze([-6, 2, -4]), roll: 0, fov: 35 });
const pose = (position, target) => Object.freeze({ position: Object.freeze(position), target: Object.freeze(target), roll: 0 });
export const CAMERA_ROUTES = Object.freeze({
  median: Object.freeze([EXTERIOR_POSE, pose([22, 14, 12], [4, 1, 1]), pose([15, 12, 22], [4, 0.8, 3]), pose([8, 13, 26], [4, 0, 2])]),
  mean: Object.freeze([EXTERIOR_POSE, pose([-3, 11, 19], [-14, 2, -2]), pose([-14, 4.5, 2], [-14, 2, -9]), pose([-10, 8, -2], [-14, 0.8, -10])]),
});
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => value * value * (3 - 2 * value);
function catmull(a, b, c, d, t) {
  return b.map((value, i) => 0.5 * ((2 * value) + (-a[i] + c[i]) * t + (2 * a[i] - 5 * value + 4 * c[i] - d[i]) * t * t + (-a[i] + 3 * value - 3 * c[i] + d[i]) * t * t * t));
}
export function sampleIntro(destination, elapsedMs, endpoint) {
  if (!CAMERA_ROUTES[destination]) throw new RangeError(`Unknown destination: ${destination}`);
  const points = [...CAMERA_ROUTES[destination]];
  if (endpoint) points[3] = endpoint;
  const t = clamp(elapsedMs / INTRO_DURATION_MS);
  if (t >= 1) return { position: [...points[3].position], target: [...points[3].target], roll: 0, complete: true };
  // Hold the identical establishing pose briefly, then ease into a broad swing.
  const progress = smooth(clamp((t - 0.13) / 0.87)) * 3;
  const index = Math.min(2, Math.floor(progress));
  const local = progress - index;
  const controls = [points[Math.max(0, index - 1)], points[index], points[index + 1], points[Math.min(3, index + 2)]];
  return {
    position: catmull(...controls.map(p => p.position), local),
    target: catmull(...controls.map(p => p.target), local),
    roll: t < 0.13 || t >= 1 ? 0 : Math.sin((t - 0.13) / 0.87 * Math.PI * 2) * 0.025 * Math.sin(t * Math.PI),
    complete: t >= 1,
  };
}
