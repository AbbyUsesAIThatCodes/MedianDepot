# Local Development Verification

## September 30: Variable Counts and Middle Activation — Issue #12

The separate local Issue #12 slice uses the frozen shared source from Issue #2 commit `871ca3d2e5d605524cd846db13de3e22a1ea9658`; `src/shared/` is byte-for-byte unchanged. Existing Issues #3/#4 supply the pair/averaging context; no duplicate issues or PRs were created.

- `npm test`: **16 passing**. All eight immutable shipment definitions; original small-shipment permutations; rotations/reversals and every destination for larger rows; zero and distinct duplicate IDs; valid positional odd activation; either even middle; blank, invalid, one-middle-only, and wrong-average rejection; correct fractional medians; reset/edit locks; all pair counts 2–9; frozen-source SHA-256 consistency.
- `npm run test:browser`: **22 passing**. The 14 shared-world/regression scenarios remain, with the old odd-count input checks adapted to activation. New checks play every added shipment, preserve appearance and visible cargo counts, toggle text-labeled pairs, reject wrong middle positions, calculate 2.5 and 3.5, activate each even middle through actual double-clicks, and pick all nine pallets in a 1024×600 window. Repeated activation and Next Shipment preserve state and stay in the yard.
- `npm run build`: succeeds. Local Build 5 was checked from disk with `scripts/verify-offline.mjs`; identity matched the output folder, manifest, UI, and report, the full original shipment completed, and no page errors or HTTP requests occurred.
- Visually reviewed the seven- and nine-pallet rows, both middle markers, covered high-value cargo, visible zero pallet, 2.5 completion equation, and compact unobstructed nine-pallet view. Pair colors live on separate frames; numbered Pair/Middle labels provide noncolor cues. The compact status strip clears the build footer.

Evidence: `evidence/issue-12/`, including `sorted-9-pallets.png`, `nine-pallets-unobstructed.png`, and `fractional-median-complete.png`. Generated current-build and offline reports record the final packaged checkpoint without introducing a timestamp-only source commit.

The environment and physical-device limitations below still apply. Eight fixed shipments provide practice, not a complete Example/Challenge curriculum or independent-mastery assessment. Public curriculum alignment and scope limits are recorded in [Learning Notes](LEARNING-NOTES.md).

## September 30: Shared World and Camera — Issue #2

Environment: Windows, Node 22.12.0 / npm 10.9.0, Playwright 1.63.0, headless Microsoft Edge 154.0.4258.37 with software WebGL. Laptop viewports: 1024×600, 1280×720, 1366×768, 1440×1000, and 1920×1080. This is local development, not a deployment or classroom hardware acceptance.

- `npm test`: **11 passing**. Original permutation/identity tests retained; shared route endpoints, both exterior transforms, flat fractional-ring contacts, distinct relief profiles, and concurrent build ordinal reservations checked.
- `npm run test:browser`: **14 passing**. Full animated arrival; identical exterior pose; intro gameplay lock; repeated Skip Intro; reduced-motion equality; resize during intro; preference change during intro; simulated hidden-tab/context-loss interruptions; keyboard focus return; actual raycast selection and drag reordering; both existing shipments; errors/retry; replay; manifest; dialogs; fullscreen; responsive overlays; WebGL fallback.
- `npm run build`: succeeds. Generated console, output folder, embedded manifest, UI footer, and current report use one identity. Build 2 and Build 3 have distinct ordinals/timestamps. Build 1 was a sandbox child-process failure and its reservation remains consumed.
- `scripts/verify-offline.mjs`: **passed** against Build 3. Opened `Play Median Depot.html` directly from disk, completed the original shipment, checked exact identity equality, observed no page errors and zero HTTP requests. This reuses the artifact without allocating a new identity.
- Visually inspected exterior, arrival, selected cargo, 1366×768 and 1024×600 captures. Tightened teaching framing, moved the depot sign clear of its roof, and added ring contours after first inspection. Cargo values remain readable outside the overlay. A large value shows a covered load rather than a misleading smaller visible count.

Evidence is under ignored `evidence/issue-2/`, with `evidence/offline-build.png` and `evidence/offline-check.json`. The generated [Current Local Build](CURRENT_BUILD.md) is authoritative for the latest immutable artifact. The frozen shared handoff records its own local source SHA and file hashes separately.

Limitations: physical student laptops/trackpads, classroom projection, Firefox/Safari, and teacher acceptance of thin Studded fractional profiles are unverified. Hidden-tab/context-loss events are simulated browser events. MeanMachine's eventual integration is not tested by these MedianDepot results. The shared camera routes and ring geometry are tested independently; no claim is made that MeanMachine gameplay exists in this repository. No issues, PRs, remote branches, or deployments were created.

## Historical: Full-Window Yard Verification

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

The next run passed all three original failures but exposed a separate fullscreen assertion timeout. Its trace showed the browser state read returning `true` after 5.2 seconds, just beyond the default five-second assertion deadline; the error snapshot also showed **Exit Fullscreen**. Only the enter/exit fullscreen polling assertions now allow 15 seconds for that asynchronous transition. They still require the real Fullscreen API state and preserve the crate-order and selection checks; other assertions retain their existing deadlines.

## Practical Limits

Actual student Windows laptops and the classroom ViewBoard have not been physically tested. The primary remaining classroom checks are mouse/trackpad feel, label readability at classroom distance, and GPU performance. Firefox/Safari and dedicated screen-reader testing have not been performed. Phones are outside the target device scope.

The unchanged Three.js bundle triggers a non-fatal size advisory: approximately 589 kB minified / 152 kB gzip. The renderer draws on changes rather than continuously while idle. The camera adjusts framing when the overlay or viewport changes; crate data and game progress stay intact.

PR deployment occurs through the existing Pages workflow after merge to `main`. This PR does not change Pages settings. Shared-factory art and the opening sequence remain Issue #2; pair assistance, even counts, teaching modes, and worksheets remain Issues #3–#8.
