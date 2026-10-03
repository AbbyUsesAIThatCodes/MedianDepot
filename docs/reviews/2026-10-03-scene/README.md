# Direct Scene Review Package

Issue #12 / draft PR #17. Source commit: `5bc26ce240810462395f1da28e19b783e73df1c5`. Later documentation-only commits preserve this artifact's identity; they do not relabel or rebuild it.

**Build:** `0.2.0_Uncodenamed_local-scene-20261003_build-002_20261003T230803Z_g5bc26ce24081_web`

**Built At:** `2026-10-03T23:08:03.149Z` (UTC). Explicit local scope `local-scene-20261003`, ordinal 2, version 0.2.0, no agreed release codename (`Uncodenamed` is a placeholder).

## Launch

The owner machine's current review server is **http://127.0.0.1:4175/**. That address works only on that machine while its server is running; it is not a deployment.

For a portable copy, download the [Review ZIP](0.2.0_Uncodenamed_local-scene-20261003_build-002_20261003T230803Z_g5bc26ce24081_web.zip), extract it, and open **Play Median Depot.html**. The regular `index.html` requires a local static HTTP server. The standalone file completes offline with no HTTP requests. The ZIP contains application files, not saved answers. There is no student-result download, worksheet export or persistent progress save. Reload/replay restores arrival order; the shipment replay link encodes the shipment code only.

## Five-Minute Teacher Review

1. **One minute - Direct Control:** Skip or watch arrival. Keep Yard Controls closed. Drag the default five pallets into `2, 3, 4, 8, 18`. Double-click the middle `4`: one large yellow arrow and a correct result should appear. Double-click again to undo. Hover over another pallet: its soft light should follow the pointer independently of the arrow.
2. **One minute - Even Calculation:** Choose **MD-1-003 - Between Two Middles**. Sort `0, 2, 3, 8`. Double-click both `2` and `3`. Enter `3.5` for feedback, then `2.5` to complete. Unselect either arrow and check that completion clears.
3. **One minute - Duplicate Position:** Choose **MD-1-002 - Matching Quantities**. Sort `2, 3, 4, 4, 8`. The fourth-position `4` should not pass; the third-position `4` should. Replay restores the original row.
4. **One minute - Camera And Size:** Choose **MD-1-006 - The Long Line**, resize to a compact laptop window, and rotate by dragging empty background. Drag a pallet and check that the camera stays still. Reset View should restore the default framing. Judge label readability and drag feel, especially at the highest angle.
5. **One minute - Alternatives And Replay:** Open Yard Controls and try the pallet selector, Move buttons and Toggle Median Arrow with the keyboard. If available, try touch dragging and double-tapping. Change shipment, replay and reload: all should restore a fresh immutable shipment, without retaining answers.

## Verification

- 19 unit tests passed.
- 25 browser scenarios passed against the exact packaged artifact in Chromium 153.0.8010.12 on Windows, using software WebGL. The [Browser Report](packaged-browser.log) records every scenario. Mouse and keyboard used browser input; touch used Chromium emulation, not a physical touchscreen.
- [Offline Check](offline-check.json): full original shipment completion, matching artifact/manifest/UI/report identity, no page errors, zero HTTP requests.
- [Build Provenance](build-provenance.json): all 27 raw input lengths/hashes match source Git blobs; the aggregate is `8c873e54bc095df9a165042eadc07fbc76fe6a125eeb34b2f13deeef00903830`.
- [Input Inventory](build-inputs.json) and [Build Manifest](build-manifest.json) retain exact provenance. [Package Parity](package-parity.json) verifies every ZIP entry against the built artifact. [SHA-256 Checksums](SHA256SUMS.txt) cover the evidence and package.
- [Local Build Ledger](local-build-ledger.json) retains successful 001 and 002 reservations, distinct timestamps and identities; both builds used the same source fingerprint. No shared PR-scoped allocator was claimed.
- Implementation [CI run 37160650883](https://github.com/AbbyUsesAIThatCodes/MedianDepot/actions/runs/37160650883) passed. Draft PR #17 remains unmerged and undeployed.

## Screenshots And Remaining Review Limits

[Even Calculation](even-4-arrows.png), [Independent Hover And Arrow](hover-and-arrow.png), [Compact Nine Pallets](compact-nine.png), [Compact Keyboard Controls](compact-keyboard.png), and [Highest Compact Camera Angle](camera-extreme-1024-left-high.png) are captures of this packaged build.

All pallets remain framed and pickable at tested camera limits. At the highest camera angle in 1024x600, nine-pallet labels become small; Reset View restores the clearer teaching view. The three-pallet result still says "1 pallets on each side." Physical school touchscreens/trackpads, projection-distance readability, GPU performance, Firefox/Safari and dedicated screen-reader use remain unverified. Eight fixed shipments are practice, not new Example/Challenge modes or an independent-mastery assessment.

## Preserved History

Public main, PR #14, PR #15 and preservation PR #16 remain unchanged. The original 007 ZIP is checksum-verified and browser-tested, but its historical source-input fingerprint remains unresolved; see the [PR #16 QA Note](https://github.com/AbbyUsesAIThatCodes/MedianDepot/pull/16#issuecomment-5973840660). The new build's verified inventory does not resolve or replace that caveat. The frozen six shared-world source files remain byte-identical.

Historical PR #14/#16 exterior-camera assertion failures remain recorded. This review's test fixes sampling timing by holding animation frames for the initial exact-pose assertion and then running the real arrival. The expected camera baseline and frozen world are unchanged.
