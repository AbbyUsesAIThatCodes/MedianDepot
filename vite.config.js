import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

export default defineConfig(() => {
  const release = JSON.parse(readFileSync('release.json', 'utf8'));
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const dirty = Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim());
  const manifest = process.env.BUILD_MANIFEST_PATH
    ? JSON.parse(readFileSync(process.env.BUILD_MANIFEST_PATH, 'utf8'))
    : { ...release, revision, dirty, identifier: `${release.version}_${release.codenameSlug}_LIVE-DEVELOPMENT_g${revision.slice(0, 12)}${dirty ? '-dirty' : ''}_web` };
  return { base: './', define: { __BUILD_MANIFEST__: JSON.stringify(manifest) } };
});
