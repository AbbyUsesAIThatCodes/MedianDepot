import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const INPUT_ROOTS = Object.freeze(['src', 'public', 'scripts']);
export const INPUT_FILES = Object.freeze(['package.json', 'package-lock.json', 'release.json', 'vite.config.js', 'index.html']);
export async function captureInputs(root = process.cwd()) {
  const files = [];
  async function collect(directory) {
    for (const item of await readdir(path.join(root, directory), { withFileTypes: true })) {
      const file = `${directory}/${item.name}`;
      if (item.isSymbolicLink()) throw new Error(`Build inputs must be regular files, not links: ${file}`);
      if (item.isDirectory()) await collect(file); else files.push(file);
    }
  }
  for (const directory of INPUT_ROOTS) await collect(directory);
  files.push(...INPUT_FILES);
  const hash = createHash('sha256'), inputs = [];
  for (const file of files.sort()) {
    const bytes = await readFile(path.join(root, file));
    hash.update(file); hash.update(bytes);
    inputs.push({ path: file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  return { schema: 1, algorithm: 'sha256(sorted UTF-8 relative path + raw file bytes; no separators)', sourceFingerprint: hash.digest('hex'), inputs };
}
