# Assets and Attribution

## Shared Procedural Art

Asset set: `foam-factory-world@1.0.0`, implemented locally for existing Issue #2. The accepted September 28 foam-ring/pallet direction in MeanMachine's mechanics proposal supersedes the earlier generic crates. No external images, models, fonts, proprietary classroom files, or generated bitmap artwork are used.

MedianDepot owns initial authorship of `src/shared/`. MeanMachine consumes a byte-identical frozen copy with its source manifest and SHA-256 hashes. The parent coordinates the copy; this task does not edit or publish MeanMachine. See [Shared World Contract](SHARED-WORLD-CONTRACT.md) for APIs, world coordinates, camera poses, and consumption instructions.

The meshes and canvas tags are original procedural project source, authored for reuse across these two games. No third-party art attribution is required. This records provenance and authorized companion reuse, not a new license grant for unrelated repository contents. Three.js retains its separate MIT license.

A whole ring is one unit. Smooth, Ribbed, Grooved, and Studded use distinct geometric side profiles with flat top/bottom contacts and uniform vertical cross-section. Color is an independent material property. Fractional layers preserve the same identity/profile and scale thickness exactly. Thin Studded slices remain subject to teacher visual acceptance.

MedianDepot moves each pallet intact. Source colors, relief, and A–J symbols are assigned from immutable arrival IDs. Tags carry the fixed quantity. Integers 0–8 show that many rings; zero is a tagged empty pallet. Larger values show a covered load and a quantity tag. Selection uses a separate base and flag without recoloring cargo. Per-layer contour lines make flat stacked contacts countable.

## Dependencies

- Three.js 0.186.1: MIT; `public/licenses/three-LICENSE.txt` is copied into output.
- Vite 8.3.1: MIT; local build tool.
- Playwright 1.63.0: Apache-2.0; verification tool.

The dependency graph and integrity hashes are pinned in `package-lock.json`. Runtime artwork, fonts, and game data are local. No analytics, account, student-data, or asset-CDN requests are made.
