import { mkdir, readFile, writeFile, copyFile, cp, rmdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { reserveOrdinal, completeReservation } from './identity.mjs';
import { captureInputs } from './inputs.mjs';

const root = process.cwd();
await mkdir('.build', { recursive: true });
// Serialize complete artifact-producing invocations: Vite's stable dist output
// must not be shared by simultaneous builders. Reservations survive failures.
await mkdir('.build/invocation.lock').catch(error => { throw new Error(`Another build owns .build/invocation.lock (${error.code}). Wait for it to finish.`); });
let manifest;
let reservation;
try {
  const release = JSON.parse(await readFile('release.json', 'utf8'));
  const scope = process.env.BUILD_SCOPE || (process.env.GITHUB_RUN_ID ? `ci-${process.env.GITHUB_RUN_ID}-attempt-${process.env.GITHUB_RUN_ATTEMPT || '1'}` : `local-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`);
  if (scope.startsWith('pr-') && !process.env.BUILD_LEDGER_DIR) throw new Error('PR builds require a durable shared BUILD_LEDGER_DIR. Use a local scope until one is configured.');
  const ledgerDir = process.env.BUILD_LEDGER_DIR || '.build/ledger';
  const ordinal = await reserveOrdinal(ledgerDir, scope);
  reservation = { ledgerDir, scope, ordinal };
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  const revision = git('rev-parse', 'HEAD');
  const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8')) : null;
  const prHead = event?.pull_request?.head?.sha ?? null;
  const dirty = Boolean(git('status', '--porcelain'));
  const inventory = await captureInputs(root);
  const tracked = new Set(git('ls-files').split('\n'));
  for (const input of inventory.inputs) {
    if (!tracked.has(input.path)) throw new Error(`Untracked or ignored build input: ${input.path}. Checkpoint it before building.`);
    if (/\.(?:js|mjs|css|json|html|svg|txt)$/.test(input.path) && (await readFile(input.path, 'utf8')).includes('\r\n')) throw new Error(`Build input requires LF line endings: ${input.path}`);
  }
  const sourceFingerprint = inventory.sourceFingerprint;
  const inventoryBytes = JSON.stringify(inventory, null, 2) + '\n';
  const inputInventorySha256 = createHash('sha256').update(inventoryBytes).digest('hex');
  const builtAt = new Date().toISOString();
  const stamp = builtAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const identifier = `${release.version}_${release.codenameSlug}_${scope}_build-${String(ordinal).padStart(3, '0')}_${stamp}_g${revision.slice(0, 12)}${dirty ? '-dirty' : ''}_web`;
  manifest = { ...release, scope, ordinal, builtAt, revision, prHead, dirty, sourceFingerprint, inputInventory: 'build-inputs.json', inputCount: inventory.inputs.length, inputInventorySha256, target: 'web', identifier };
  await mkdir('.build/manifests', { recursive: true });
  const manifestPath = path.resolve('.build/manifests', `${identifier}.json`);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  process.env.BUILD_MANIFEST_PATH = manifestPath;
  console.log(`BUILD START ${identifier}`);
  const { build } = await import('vite');
  await build();
  if ((await captureInputs(root)).sourceFingerprint !== sourceFingerprint) throw new Error('Build inputs changed during compilation. Reservation retained; do not distribute this output.');
  await copyFile(manifestPath, 'dist/build-manifest.json');
  await writeFile('dist/build-inputs.json', inventoryBytes);
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
