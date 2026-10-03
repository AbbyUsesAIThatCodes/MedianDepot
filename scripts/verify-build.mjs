import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import { captureInputs } from './inputs.mjs';

const artifact = process.argv[2] || 'dist';
const manifest = JSON.parse(await readFile(path.join(artifact, 'build-manifest.json')));
const bytes = await readFile(path.join(artifact, manifest.inputInventory));
const inventory = JSON.parse(bytes);
const sha = data => createHash('sha256').update(data).digest('hex');
assert.equal(sha(bytes), manifest.inputInventorySha256);
assert.equal(inventory.sourceFingerprint, manifest.sourceFingerprint);
assert.equal(inventory.inputs.length, manifest.inputCount);
assert.deepEqual(await captureInputs(), inventory);
const hash = createHash('sha256');
for (const input of inventory.inputs) {
  const committed = execFileSync('git', ['show', `${manifest.revision}:${input.path}`]);
  assert.equal(committed.length, input.bytes, input.path);
  assert.equal(sha(committed), input.sha256, input.path);
  hash.update(input.path); hash.update(committed);
}
assert.equal(hash.digest('hex'), manifest.sourceFingerprint);
assert.equal(manifest.dirty, false, 'Only a clean source build can be certified against its commit.');
const report = { identifier: manifest.identifier, revision: manifest.revision, sourceFingerprint: manifest.sourceFingerprint, inputCount: inventory.inputs.length, checks: ['inventory checksum', 'every input length and SHA-256 matches committed bytes', 'Git/source/artifact aggregate fingerprints match', 'clean source revision'], checkedAt: new Date().toISOString() };
await mkdir('evidence', { recursive: true });
await writeFile('evidence/build-provenance.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
