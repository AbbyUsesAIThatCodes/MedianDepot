import { mkdir, readFile, writeFile, readdir, copyFile, cp, rmdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { reserveOrdinal, completeReservation } from './identity.mjs';

const root = process.cwd();
await mkdir('.build', { recursive: true });
// Serialize complete artifact-producing invocations: Vite's stable dist output
// must not be shared by simultaneous builders. Reservations survive failures.
await mkdir('.build/invocation.lock').catch(error => { throw new Error(`Another build owns .build/invocation.lock (${error.code}). Wait for it to finish.`); });
let manifest;
let reservation;
try {
  const release = JSON.parse(await readFile('release.json', 'utf8'));
  const scope = process.env.BUILD_SCOPE || `local-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`;
  if (scope.startsWith('pr-') && !process.env.BUILD_LEDGER_DIR) throw new Error('PR builds require a durable shared BUILD_LEDGER_DIR. Use a local scope until one is configured.');
  const ledgerDir = process.env.BUILD_LEDGER_DIR || '.build/ledger';
  const ordinal = await reserveOrdinal(ledgerDir, scope);
  reservation = { ledgerDir, scope, ordinal };
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const revision = git('rev-parse', 'HEAD');
  const dirty = Boolean(git('status', '--porcelain'));
  const inputs = [];
  async function collect(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const file = `${directory}/${item.name}`;
      if (item.isDirectory()) await collect(file); else inputs.push(file);
    }
  }
  for (const directory of ['src', 'public', 'scripts']) await collect(directory);
  inputs.push('package.json', 'package-lock.json', 'release.json', 'vite.config.js', 'index.html');
  const hash = createHash('sha256');
  for (const file of inputs.sort()) { hash.update(file); hash.update(await readFile(file)); }
  const sourceFingerprint = hash.digest('hex');
  const builtAt = new Date().toISOString();
  const stamp = builtAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const identifier = `${release.version}_${release.codenameSlug}_${scope}_build-${String(ordinal).padStart(3, '0')}_${stamp}_g${revision.slice(0, 12)}${dirty ? '-dirty' : ''}_web`;
  manifest = { ...release, scope, ordinal, builtAt, revision, dirty, sourceFingerprint, target: 'web', identifier };
  await mkdir('.build/manifests', { recursive: true });
  const manifestPath = path.resolve('.build/manifests', `${identifier}.json`);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  process.env.BUILD_MANIFEST_PATH = manifestPath;
  console.log(`BUILD START ${identifier}`);
  const { build } = await import('vite');
  await build();
  await copyFile(manifestPath, 'dist/build-manifest.json');
  // The single bundled entry has no external module imports. Inline it and its
  // CSS for an offline double-click launch while preserving the hosted entry.
  let standalone = await readFile('dist/index.html', 'utf8');
  const entry = standalone.match(/<script[^>]+src="\.\/([^\"]+)"[^>]*><\/script>/);
  const stylesheet = standalone.match(/<link[^>]+rel="stylesheet"[^>]+href="\.\/([^\"]+)"[^>]*>/);
  if (!entry || !stylesheet) throw new Error('Expected one bundled script and stylesheet for the offline launch.');
  const script = await readFile(path.join('dist', entry[1]), 'utf8');
  const css = await readFile(path.join('dist', stylesheet[1]), 'utf8');
  standalone = standalone.replace(entry[0], () => `<script type="module">${script.replaceAll('</script', '<\\/script')}</script>`).replace(stylesheet[0], () => `<style>${css}</style>`);
  await writeFile('dist/Play Median Depot.html', standalone);
  const artifact = path.join('artifacts', identifier);
  await cp('dist', artifact, { recursive: true });
  const report = `# Current Local Build\n\n\`${identifier}\`\n\n- Built At: ${builtAt}\n- Source: ${revision}${dirty ? ' (dirty local inputs)' : ''}\n- Source Fingerprint: \`${sourceFingerprint}\`\n- Target: web\n- Scope / Ordinal: ${scope} / ${ordinal}\n- Version Status: ${release.status}; release codename unassigned\n- Output: \`${artifact}\`\n- Deployed Build: unchanged; this invocation is local only\n\nThis record is generated once from the embedded manifest. Reopening the artifact preserves this identity.\n`;
  await writeFile(path.join(artifact, 'BUILD-REPORT.md'), report);
  await writeFile('docs/CURRENT_BUILD.md', report);
  await completeReservation(ledgerDir, scope, ordinal, { identifier, status: 'succeeded' });
  console.log(`BUILD SUCCESS ${identifier}`);
} catch (error) {
  if (reservation) await completeReservation(reservation.ledgerDir, reservation.scope, reservation.ordinal, { identifier: manifest?.identifier, status: 'failed', reason: error.message });
  console.error(`BUILD FAILED ${manifest?.identifier ?? '(reservation retained, metadata unavailable)'}`);
  throw error;
} finally { await rmdir(path.join(root, '.build/invocation.lock')); }
