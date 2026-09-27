# Assets and Attribution

## Original Procedural Art

Asset set: `median-depot-yard-v1`, introduced with application version 0.1.0.

`src/scene.js` builds the crate geometry, canvas quantity labels, depot, rail tracks, stationary switch engine, trees, lamps, cones, and materials at runtime. These are original code-generated meshes and labels for this repository. `public/favicon.svg` and the interface icons in `src/main.js` are original vector shapes. No external imagery, model downloads, generated-image assets, or proprietary classroom files are included. Fonts use the device's local system font stack.

The crates are all the same size. Labels, not crate dimensions or colors, carry the numeric quantity. The thin gold selection base and SELECTED flag indicate selection only; they are not the future mirrored-pair assistance.

These are provisional local assets. Sharing or synchronizing them with Mean Machine requires the explicit ownership/versioning decision in Issue #2. No asset compatibility with that repository is claimed yet.

## Dependencies

- Three.js 0.186.1: MIT; bundled at build time. Its license is preserved at `public/licenses/three-LICENSE.txt` and therefore in the production output.
- Vite 8.3.1: MIT; development/build tool.
- Playwright 1.63.0: Apache-2.0; development verification tool.

The exact dependency graph and integrity hashes are pinned in `package-lock.json`. The production application makes no analytics, account, font-CDN, image-CDN, or student-data requests.
