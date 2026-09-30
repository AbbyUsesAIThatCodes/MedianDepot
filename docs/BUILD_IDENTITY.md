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
| Injection | `.build/manifests/<identity>.json` → `BUILD_MANIFEST_PATH` → Vite define → `src/build.js` |
| Game UI | Persistent, wrapping, selectable `#build-identity` footer in `src/main.js` |
| Production output | `dist/build-manifest.json`; identical metadata in JS; versioned `artifacts/<identity>/` enclosing output |
| Offline launch | `Play Median Depot.html` inlines the same bundle and stylesheet, preserving the identity |
| Current report | Generated `docs/CURRENT_BUILD.md`; copy in artifact `BUILD-REPORT.md`; both derive from the manifest |
| Development | Vite labels live sessions `LIVE-DEVELOPMENT` with revision and dirty status; it never labels these as immutable builds |

Generated reports, ledgers, and artifacts are ignored by Git to avoid timestamp-only rebuild loops. Keep `.build/ledger/` when reopening the same workspace. Build 1 on September 30 failed before metadata injection because the sandbox denied a Git child process; its reservation remains consumed.

## Review and CI Boundaries

This task is local only. No PR number exists for these changes. Default scope is `local-YYYYMMDD`; local ordinals are not PR ordinals. A PR scope requires explicit `BUILD_SCOPE=pr-N` and a durable shared `BUILD_LEDGER_DIR`; the build rejects a PR scope without that ledger. CI currently has no durable PR allocator configured and must not claim PR build identity. That hosted setup remains pending, as do PR descriptions and release/deployment evidence. The existing deployment workflow has not been run or reconfigured by this task.

A failed or interrupted attempt keeps its reservation. Do not remove lock directories while an owning build is running. After an interrupted process is positively confirmed stopped, remove only its empty stale lock and retain the ledger. Reusing a ZIP, HTML file, or output folder does not allocate or relabel it.

See [Verification](VERIFICATION.md) and the generated [Current Local Build](CURRENT_BUILD.md) for actual results. A local source checkpoint and a deployed build are separate records.
