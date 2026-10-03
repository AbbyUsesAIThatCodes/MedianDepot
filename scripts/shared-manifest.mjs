import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const names = ['palette.js', 'primitives.js', 'cargo.js', 'world.js', 'camera.js'];
const files = {};
for (const name of names) files[name] = createHash('sha256').update(await readFile(`src/shared/${name}`)).digest('hex');
const manifest = {
  assetSet: 'foam-factory-world', version: '1.0.0',
  ownerRepository: 'AbbyUsesAIThatCodes/MedianDepot',
  originalBaseRevision: '08e90aed0a884d25c435adfd5c010487ebb765bf',
  provenance: 'Original procedural project source. Authorized companion reuse in MeanMachine. No external artwork or proprietary curriculum content.',
  runtime: { three: '0.186.1', license: 'MIT; preserve public/licenses/three-LICENSE.txt' },
  coordinateSystem: 'Y-up, +Z forward; world units',
  exterior: { position: [22,18,32], target: [-6,2,-4], fov: 35, roll: 0 },
  files,
};
await writeFile('src/shared/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
