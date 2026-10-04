# Hover Fix Review Package

Issue #12 / draft PR #17. Clean source commit: `c4a348c8098dae9687f5cd9387a0613afb7e2c09`. Later evidence-only commits preserve this artifact; they do not rebuild or relabel it.

**Build:** `0.2.0_Uncodenamed_local-scene-20261003_build-003_20261004T005915Z_gc4a348c8098d_web`

**Built At:** `2026-10-04T00:59:15.705Z` UTC. Scope `local-scene-20261003`, ordinal 3, accepted version 0.2.0, release codename still unassigned. The scope identifies the continuing local review ledger; the actual build date is October 4.

## Launch And Check

Owner-machine review: **http://127.0.0.1:4176/?shipment=MD-1-006**. This is local only and requires the review server to remain running. Preserved build 002 remains on port 4175.

Download the [Review ZIP](0.2.0_Uncodenamed_local-scene-20261003_build-003_20261004T005915Z_gc4a348c8098d_web.zip), extract it, and open **Play Median Depot.html** for offline play. The regular `index.html` requires static HTTP serving. This package contains the application, not saved student work.

Sort MD-1-006 to `0, 1, 2, 4, 4, 6, 7, 8, 9`. Double-click the fifth pallet: the arrow and median remain 4. Hover over value 1: only its mouse light should follow the pointer; the median arrow stays at position five. Move onto the bottom controls, or press Tab: mouse glow clears, while checked Show Pairs retains the pair lights. Double-click the middle again to remove its arrow. Check keyboard moves, replay and another shipment for leftover mouse glow.

## Diagnosis And Scope

The reported arrow was correct. A focused dropdown can coexist with mouse hover because canvas input retains the HTML focus. Thus a second-left glow does not by itself mean the second-left pallet is selected as the median.

The confirmed defect was stale hover: build 002 remembered a pallet ID until the mouse moved. Replay/reordering could move that pallet away while retaining its glow, and keyboard interaction left the mouse cue behind. Build 003 refreshes hover against the current rendered positions and clears it on keyboard/pointer interruption. Pair lights, shaders, median arrows, accepted input rules, camera baseline and shipment data are unchanged. Only `src/scene.js` changed among the 27 runtime input files; [Input Delta](input-delta.json) verifies this.

## Evidence

- **19 unit tests passed**, including immutable shipment and frozen shared-world checks.
- **29 browser scenarios passed against this exact package** in Windows Chromium 153.0.8010.12 with software WebGL. [Browser Report](packaged-browser.log).
- The two stale-hover regressions failed on build 002 before the fix. [Before-State Samples](before-states.json) separate median, hover, pair and HTML-focus state; the [Diagnosis](../../HOVER-REVIEW.md) records the expected failures without private local paths.
- [Offline Check](offline-check.json): same artifact/manifest/UI/report identity, original shipment completed, no page errors and zero HTTP requests.
- [Source Parity](build-provenance.json): all 27 inputs match source Git bytes and aggregate fingerprint `5c7b551bac8418b6bc26e87ff8cc13fdeb5bdd6a53d81d0db3c6a918970915d5`.
- [Manifest](build-manifest.json), [Raw Input Inventory](build-inputs.json), [ZIP Entry Parity](package-parity.json), [SHA-256 Checksums](SHA256SUMS.txt) and [Retained Build Ledger](local-build-ledger.json).

Screenshots: [Build 002 Stale Replay Glow](before-keyboard-replay.png), [Build 003 Current-Pointer Replay Glow](replay-hover-current-position.png), [Independent Hover And Median](nine-hover-and-median.png), [Pair Lights Without Hover](nine-pairs-without-hover.png), and [Keyboard Clears Mouse Hover](keyboard-clears-hover.png). Before and after replay capture the same stationary mouse location near the second position; the old glow follows C08 to position eight, while the fixed glow corresponds to the C02 now under that pointer. Keyboard input in build 003 clears mouse hover altogether.

## Worksheet Impact And Limits

No worksheet content, quantities, codes, median answers, export or saving behavior changed. MD-1-006 still has median 4 at sorted position five. Equal quantities remain distinct observations. There is no worksheet export, student-result download or progress autosave; replay links identify the original shipment only. Use build 003 for new screenshots so they cannot contain the reproduced stale-hover defect.

Physical school touchscreens/trackpads, classroom projection/GPU performance, Firefox/Safari and dedicated screen-reader use remain unverified. Touch is emulated and pointer cancellation is simulated. The prior compact-camera label-size limit is unchanged. The original build 007 fingerprint caveat and PR #14/#16 historical camera-test failures remain recorded in their existing evidence. Public main, prior reviews, original 007 and scene build 002 are preserved. No merge or deployment.
