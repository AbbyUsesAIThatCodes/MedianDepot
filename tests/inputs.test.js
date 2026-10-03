import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { captureInputs, INPUT_ROOTS, INPUT_FILES } from '../scripts/inputs.mjs';

test('per-file inventory detects bytes and extra ignored inputs while excluding generated metadata', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'median-inputs-'));
  try {
    for (const dir of [...INPUT_ROOTS, '.build', 'docs']) await mkdir(path.join(root, dir));
    for (const file of INPUT_FILES) await writeFile(path.join(root, file), file + '\n');
    await writeFile(path.join(root, 'src/game.js'), 'game\n');
    const before = await captureInputs(root);
    await writeFile(path.join(root, '.build/manifest.json'), 'new timestamp');
    await writeFile(path.join(root, 'docs/CURRENT_BUILD.md'), 'new build');
    assert.deepEqual(await captureInputs(root), before);
    await writeFile(path.join(root, 'src/game.js'), 'game\r\n');
    const endings = await captureInputs(root);
    assert.notEqual(endings.sourceFingerprint, before.sourceFingerprint);
    const changed = endings.inputs.filter((input, index) => input.sha256 !== before.inputs[index].sha256);
    assert.deepEqual(changed.map(input => input.path), ['src/game.js']);
    await writeFile(path.join(root, 'src/extra.local'), 'ignored but inventoried');
    const extra = await captureInputs(root);
    assert.equal(extra.inputs.length, before.inputs.length + 1);
    assert.notEqual(extra.sourceFingerprint, endings.sourceFingerprint);
    assert.ok(extra.inputs.some(input => input.path === 'src/extra.local'));
  } finally { await rm(root, { recursive: true, force: true }); }
});
