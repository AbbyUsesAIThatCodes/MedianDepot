import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { EXTERIOR_POSE, INTRO_DURATION_MS, sampleIntro } from '../src/shared/camera.js';
import { createRingGeometry, RING_THICKNESS } from '../src/shared/cargo.js';
import { PATTERNS } from '../src/shared/palette.js';
import { reserveOrdinal } from '../scripts/identity.mjs';

test('both routes have exactly the same exterior transform and finite bounded endpoints', () => {
  for (const destination of ['median', 'mean']) {
    assert.deepEqual(sampleIntro(destination, 0).position, EXTERIOR_POSE.position);
    assert.deepEqual(sampleIntro(destination, 0).target, EXTERIOR_POSE.target);
    assert.equal(sampleIntro(destination, 0).roll, 0);
    for (let time = 0; time <= INTRO_DURATION_MS; time += 50) {
      const pose = sampleIntro(destination, time);
      assert.ok([...pose.position, ...pose.target, pose.roll].every(Number.isFinite));
    }
    const endpoint = { position: [4, 15, 35], target: [4, 1, 5] };
    const result = sampleIntro(destination, INTRO_DURATION_MS + 100, endpoint);
    assert.deepEqual(result.position, endpoint.position);
    assert.deepEqual(result.target, endpoint.target);
    assert.equal(result.complete, true);
    assert.equal(result.roll, 0);
  }
  assert.notDeepEqual(sampleIntro('median', 4000).position, sampleIntro('mean', 4000).position);
});

test('every relief profile has flat contacts and halves/thirds fill one whole thickness', () => {
  const profiles = [];
  for (const pattern of PATTERNS) {
    for (const fraction of [1, 1 / 2, 1 / 3]) {
      const geometry = createRingGeometry(pattern, fraction);
      geometry.computeBoundingBox();
      const { min, max } = geometry.boundingBox;
      assert.ok(Math.abs(min.y) < 1e-6);
      assert.ok(Math.abs(max.y - RING_THICKNESS * fraction) < 1e-6);
      const heights = new Set(Array.from(geometry.attributes.position.array).filter((_, index) => index % 3 === 1).map(value => value.toFixed(6)));
      assert.ok(heights.size <= 3, 'Relief must never protrude above or below the contact planes.');
      if (fraction === 1) profiles.push(Array.from(geometry.attributes.position.array).filter((_, index) => index % 3 !== 1).join(','));
      geometry.dispose();
    }
  }
  assert.equal(new Set(profiles).size, PATTERNS.length);
});

test('concurrent ordinal allocation cannot collide and failed attempts stay consumed', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'median-build-ledger-'));
  const ordinals = await Promise.all(Array.from({ length: 8 }, () => reserveOrdinal(directory, 'local-test')));
  assert.deepEqual(ordinals.sort((a,b) => a-b), [1,2,3,4,5,6,7,8]);
  assert.equal(await reserveOrdinal(directory, 'local-test'), 9);
  const ledger = JSON.parse(await readFile(path.join(directory, 'local-test.json')));
  assert.equal(ledger.attempts.length, 9);
});

test('frozen shared-source bytes match the consumer manifest', async () => {
  const base = new URL('../src/shared/', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('manifest.json', base), 'utf8'));
  for (const [file, expected] of Object.entries(manifest.files)) {
    const actual = createHash('sha256').update(await readFile(new URL(file, base))).digest('hex');
    assert.equal(actual, expected, `${file} diverged from the frozen shared asset source.`);
  }
});
