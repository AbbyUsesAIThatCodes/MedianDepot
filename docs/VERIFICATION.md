# First Shipment Verification

Verified September 27, 2026 for version 0.1.0 and Issue #1.

## Environment

- Node.js 24.19.0 and npm 11.9.0 on Linux.
- Playwright 1.63.0 with headless Chromium 153.0.8010.0 and software WebGL rendering.
- Desktop: 1440 × 1000; resize coverage: 1024 × 768 and 390 × 844; touch emulation: 390 × 844.
- Production output additionally served under `/MedianDepot/`, matching a GitHub Pages project path.

## Checks

| Check | Result |
| --- | --- |
| `npm test` | 8 passing tests |
| Shipment data preservation | Every permutation of both five-crate shipments, every crate, and every in-range destination plus the two out-of-range boundaries retain all IDs and values |
| First shipment | Arrival 8, 2, 18, 4, 3 → sorted 2, 3, 4, 8, 18 → select middle crate and submit 4 |
| Duplicate shipment | Both equal-value identity orders sort correctly; selecting the other quantity-4 crate is rejected when it is not in the middle |
| Wrong submissions | Unsorted order, missing selection, wrong crate, blank/nonfinite input, row-position answer, and incorrect numeric answer are rejected without data changes |
| Replay and identity | Reset/reload restore code-specific arrival order; manifest retains original IDs and quantities; unknown codes show a notice |
| Browser interaction | 9 Playwright scenarios: full loop, duplicates, manifest/replay codes, resizing/reduced motion, keyboard, touch, renderer fallback, 3D dragging, fullscreen |
| Direct 3D input | Actual raycast selection and dragging, including dragging outside the canvas, preserve whole crates |
| Keyboard and touch | Full touch playthrough without dragging; keyboard reorder retains focus; dialogs close with Escape and restore focus |
| Renderer fallback | Deliberately unavailable WebGL still permits a complete sorting-and-answer loop via HTML controls |
| Production build | `npm run build` passes; bundled app at `/MedianDepot/` loads 3D and completes median 4 with no page errors, HTTP failures, or external requests |
| Visual review | Desktop initial/completed states and mobile state inspected for framing, labels, clipping, selection cues, and controls |

## Repeat Locally

Review captures: [Desktop Yard](images/median-depot.png) and [Mobile Layout](images/mobile.png).

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The test configuration accepts `PLAYWRIGHT_CHROMIUM_EXECUTABLE` for an existing Chromium binary. `CAPTURE_DIR` optionally saves screenshots and extends the per-test timeout to allow slow software rendering. Neither variable is required for normal local/CI tests. The default Playwright browser download was unavailable in the authoring environment, so its equivalent npm-distributed Chromium binary was used there; CI uses Playwright's normal browser installation.

## Review Before Classroom Use

The classroom ViewBoard, student Windows machines, actual touch hardware, and Firefox/Safari have **not** been physically tested. A quick teacher playtest on those devices remains useful, especially for touch accuracy, label size at classroom distance, and GPU performance. Touch emulation is not a hardware certification. Screen-reader semantics and keyboard behavior are implemented, but no dedicated screen-reader audit is claimed.

The build reports a non-fatal bundle-size advisory: the Three.js application is approximately 589 kB minified / 152 kB gzip. The renderer draws on changes rather than continuously while idle. Actual classroom frame rate has not been measured.

Pages requires the repository's Pages source to be set to GitHub Actions and a successful `main` deployment. This implementation PR does not establish that a public deployment is live. The current scene has a fixed teaching camera; shared factory art, the opening camera move, and final asset sharing remain Issue #2. Pair assistance, even counts, teaching modes, and worksheets remain Issues #3–#8.
