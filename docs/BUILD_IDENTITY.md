# Build Identity

## Release and Compatibility

`release.json` is authoritative. The accepted baseline remains **0.2.0** and this work is **development**. No new release version or codename is inferred: `Uncodenamed` is an explicit filename placeholder, not a proposed release name. Immutable shipment codes and original quantities are the compatibility contract. Existing `MD-1-*` codes retain their datasets, IDs, and arrival orders.

## Implemented Surfaces

| Surface | Source and Verification |
| --- | --- |
| Release metadata | `release.json`; package version remains 0.2.0 |
| Build entry | `npm run build` → `scripts/build.mjs`; prints full identity at start and success/failure |
| Reservation | `scripts/identity.mjs`; local durable `.build/ledger/<scope>.json`, atomic directory lock, every attempt consumes an ordinal |
| Concurrency | Complete local builds serialize using `.build/invocation.lock`; separate allocators use the scope lock; the focused test races eight reservations |
| Time and provenance | Capture UTC once before Vite compilation; full Git SHA, dirty flag, SHA-256 build-input fingerprint, target `web` |
| Input inventory | `scripts/inputs.mjs` records every input path, byte count and SHA-256 in `dist/build-inputs.json`; its checksum/count are embedded in the manifest |
| Reproducibility check | `node scripts/verify-build.mjs` compares every raw input against the declared Git commit and rechecks the aggregate; LF text and tracked inputs are required by the builder |
| Injection | `.build/manifests/<identity>.json` → `BUILD_MANIFEST_PATH` → Vite define → `src/build.js` |
| Game UI | Persistent, wrapping, selectable `#build-identity` footer in `src/main.js` |
| Production output | `dist/build-manifest.json`; identical metadata in JS; versioned `artifacts/<identity>/` enclosing output |
| Offline launch | `Play Median Depot.html` inlines the same bundle and stylesheet, preserving the identity |
| Current report | Generated `docs/CURRENT_BUILD.md`; copy in artifact `BUILD-REPORT.md`; both derive from the manifest |
| Development | Vite labels live sessions `LIVE-DEVELOPMENT` with revision and dirty status; it never labels these as immutable builds |

Generated reports, ledgers, and artifacts are ignored by Git to avoid timestamp-only rebuild loops. Keep `.build/ledger/` when reopening the same workspace. Build 1 on September 30 failed before metadata injection because the sandbox denied a Git child process; its reservation remains consumed.

## Review and CI Boundaries

The direct scene review is draft PR #17, based on original PR #15 source. Local artifacts use a separate explicit `local-scene-20261003` scope and retained ledger; these are not PR ordinals. A PR scope requires explicit `BUILD_SCOPE=pr-N` and a durable shared `BUILD_LEDGER_DIR`; the build rejects a PR scope without that ledger. A shared PR allocator remains unconfigured. CI uses a unique `ci-<run>-attempt-<attempt>` scope, with an ordinal inside that scope; it records the built revision and PR head separately. No merge or deployment is authorized.

The builder hashes the same sorted path/raw-byte algorithm used historically, now retaining the per-file inventory. It rejects untracked/ignored inputs, rejects CRLF text inputs, and checks the input fingerprint again after compilation. `.gitattributes` pins repository text to LF for portable checkout bytes. Generated metadata remains outside the input roots. Original build 007 is not relabeled or repaired: its ZIP integrity and gameplay QA are verified, while its historical source-input fingerprint remains unresolved. See the PR #16 QA note and [Direct Scene Review](SCENE-REVIEW.md).

A failed or interrupted attempt keeps its reservation. Do not remove lock directories while an owning build is running. After an interrupted process is positively confirmed stopped, remove only its empty stale lock and retain the ledger. Reusing a ZIP, HTML file, or output folder does not allocate or relabel it.

See [Verification](VERIFICATION.md) and the generated [Current Local Build](CURRENT_BUILD.md) for actual results. A local source checkpoint and a deployed build are separate records.

## October 4 Local Pages Promotion

[Locally Verified Pages Release](LOCAL_PAGES_RELEASE.md) is the current publication path. `site/` contains the unchanged identified runtime; `deployment/payload.json` records the separate deployment inventory. The manual-only workflow validates and publishes these bytes without rebuilding, relabeling or changing build counters. Runtime source and release-orchestration commit remain distinct.
