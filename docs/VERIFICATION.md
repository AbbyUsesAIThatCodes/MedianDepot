# Full-Window Yard Verification

Verified September 27, 2026 for version 0.2.0 and Issue #11. The teacher's target is student laptops; phone-specific verification is out of scope.

## Environment

- Node.js 24.19.0 and npm 11.9.0 on Linux.
- Playwright 1.63.0 with headless Chromium 153.0.8010.0 and software WebGL rendering.
- Window sizes: 1024 × 600, 1280 × 720, 1366 × 768, 1440 × 1000, and 1920 × 1080.

## Checks

| Check | Result |
| --- | --- |
| Data tests | 8 passing tests, retaining the original sorting/median/identity coverage |
| Shipment preservation | Every permutation of both shipments and every crate/destination move retain the original IDs and quantities |
| Browser tests | 10 passing scenarios covering both shipments, feedback, replay, manifest, overlays, keyboard input, resizing, fullscreen, renderer fallback, and actual 3D dragging |
| Full-window canvas | Canvas bounds match the viewport; no permanent bottom quantities row or page scrolling |
| Laptop resizing | Overlay stays inside the viewport; shorter windows scroll internally; selection/order remain unchanged |
| Overlay toggles | Hide/reopen preserves order, selected crate, lesson phase, and an unfinished numeric answer |
| Keyboard access | Native crate selector and Move buttons work; movement retains focus; Escape hides the panel and returns focus; dialogs retain their own Escape behavior |
| Crate visibility and picking | All five crates can be selected through the actual 3D view outside the open overlay; dragging between the first and last bays preserves observations |
| Complete alternative flow | A 1024 × 600 laptop window completes the entire shipment through the selector and Move buttons without dragging |
| Renderer fallback | With WebGL deliberately disabled, accessible overlay controls still complete the sorting-and-answer loop |
| Build | `npm run build` passes; relative asset paths and the existing Pages workflow are retained |
| Visual inspection | Open/closed overlay, completed shipment, 1366 × 768 laptop, and 1024 × 600 compact-window captures checked for framing, clipping, labels, and selection |

## Repeat Locally

Review captures: [Laptop Yard](images/median-depot.png) and [Controls Hidden](images/unobstructed-yard.png).

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The test configuration accepts `PLAYWRIGHT_CHROMIUM_EXECUTABLE` for an existing Chromium binary. `CAPTURE_DIR` optionally saves review screenshots; it does not change the test timeout. Neither variable is required for normal local/CI tests. All runs use the same 60-second per-test budget and SwiftShader software WebGL launch flags. The authoring environment uses an npm-distributed Chromium binary because its normal Playwright browser download was unavailable; CI uses Playwright's normal browser installation.

## PR #13 CI Follow-Up

GitHub Actions run [36362974784](https://github.com/AbbyUsesAIThatCodes/MedianDepot/actions/runs/36362974784) passed the data tests and build, but three of the ten browser scenarios exhausted the original 30-second test budget. Local screenshot runs had a 60-second budget and explicit software WebGL flags; CI had neither. The configuration now applies that same budget and renderer setup to both environments, retaining every scenario and assertion. Failed browser runs retain traces, screenshots, and error contexts in the `browser-test-failures` workflow artifact for seven days. The list reporter records individual scenario durations in the job log.

## Practical Limits

Actual student Windows laptops and the classroom ViewBoard have not been physically tested. The primary remaining classroom checks are mouse/trackpad feel, label readability at classroom distance, and GPU performance. Firefox/Safari and dedicated screen-reader testing have not been performed. Phones are outside the target device scope.

The unchanged Three.js bundle triggers a non-fatal size advisory: approximately 589 kB minified / 152 kB gzip. The renderer draws on changes rather than continuously while idle. The camera adjusts framing when the overlay or viewport changes; crate data and game progress stay intact.

PR deployment occurs through the existing Pages workflow after merge to `main`. This PR does not change Pages settings. Shared-factory art and the opening sequence remain Issue #2; pair assistance, even counts, teaching modes, and worksheets remain Issues #3–#8.
