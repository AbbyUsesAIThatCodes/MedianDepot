# Direct Scene Interaction Review

Focused follow-up to Issue #12 and the October 3 owner review of original build 007. This branch starts at original source `60cd6252a52106a1b56296a03bb18d24923d6edb`; preservation PR #16 and the original artifact remain unchanged. Related learning/accessibility context remains in Issues #3, #4 and #7; this does not close those broader gates.

## Owner Request

> Click and drag to rearrange the pallets in order from smallest to biggest.
>
> Double click on the median pallet/s.

The owner requests direct scene mechanics, reversible double-click selections, a large yellow downward arrow for each selected candidate, hover glow independent of median selection, a soft transparent glow fading upward from the bottom, useful automatic framing and bounded rotatable camera controls. Retain keyboard/touch alternatives, immutable shipments, mathematical feedback, retry and replay. Mechanics and readability precede decoration; no worksheets or new teaching modes.

The visible second instruction will clarify the mathematics: “Double-click the middle pallet. If there are two middle pallets, select both.” Even rows still require adding both middle quantities and dividing by 2; selecting two values does not itself demonstrate that calculation.

## Implementation Contract

- Pallet dragging takes precedence over background camera dragging. Movement thresholds separate dragging from a double click/tap.
- Double-click/tap toggles median candidates; the equivalent accessible button is available in Yard Controls. An odd candidate can replace the previous candidate; even rows hold at most two candidates. Incorrect positions receive feedback and remain reversible.
- The first median attempt checks ordering automatically. There is no required hidden-panel step. Reordering clears median candidates and completion and starts sorting again.
- Median arrows, hover light and optional pair assistance are separate state/visual channels. Frozen `src/shared/` remains byte-identical.
- The scene displays instructions, feedback, explicit even-average calculation, shipment/replay/next controls and Reset View. Yard Controls remains an optional accessible selector/move/toggle/camera alternative.
- Fit all pallets and arrows to the usable viewport across two through nine pallets and laptop resizing; clamp rotation and reset the view on replay/shipment change.
- Preserve the eight shipment codes and arrival orders. No student-data writes or progress-saving claims.

## Verification And Provenance

Required before final review: pure odd/even candidate-state tests, real browser drag/double-toggle tests, duplicate/zero/fractional cases, pointer priority and thresholds, touch and keyboard equivalents, glow/arrow independence, camera limits/reset/resize, original intro/renderer fallback, and visual inspection at laptop sizes.

New builds must contain a per-file raw-byte input inventory and a reproducible aggregate fingerprint. Use a new explicit local scope while a shared PR allocator is unavailable. Do not relabel original build 007 or change its manifest: its ZIP is checksum-verified and browser-tested, while the historical input fingerprint remains unresolved. Details remain in the additive QA note on PR #16.

## Development Checkpoint

The implementation now provides the direct interaction contract above. The current local development run passed 25 browser scenarios, including real mouse dragging/double-clicks, Chromium touch dispatch, keyboard controls, camera extremes and laptop resizing. The unit suite passed 19 tests including the per-file inventory check. Final packaged-artifact verification is recorded separately when complete; a development-preview pass is not an artifact pass.

The historical PR #14/#16 exterior-camera failures remain recorded on those PRs. The new intro test samples the unchanged exact exterior position/FOV before releasing queued animation frames, then independently checks the real animated arrival. This removes the race between a CPU-delayed assertion and the 988ms exterior hold without changing the camera baseline or treating old CI as passed.

No merge or deployment is authorized. Physical touchscreens, trackpads and classroom projection remain owner-review checks.

## October 3 Packaged Review Result

The preserved October 3 review is `0.2.0_Uncodenamed_local-scene-20261003_build-002_20261003T230803Z_g5bc26ce24081_web`, built from clean source `5bc26ce240810462395f1da28e19b783e73df1c5`. It passed all 25 browser scenarios against the versioned artifact, the 19-test unit suite, and offline full-shipment completion with zero HTTP requests and no page errors. All 27 build inputs match the declared Git commit byte for byte. [Review Evidence And Five-Minute Check](reviews/2026-10-03-scene/README.md) preserves the package, inventory, hashes and screenshots.

Visual limit: at the highest camera angle in a 1024x600 window, nine-pallet quantity labels become small although each pallet remains pickable. Reset View returns to the clearer teaching view. Classroom-distance readability and physical touch/trackpad feel still require owner review. The three-pallet success sentence also retains the minor grammar issue "1 pallets on each side."

## October 4 Hover Follow-Up

The latest review is build 003, source `c4a348c8098dae9687f5cd9387a0613afb7e2c09`. It fixes a stale mouse-hover ID after scene movement and keyboard interaction. The median arrow was already correct in the reported nine-pallet example; median logic and pair styling remain unchanged. See [Hover Diagnosis](HOVER-REVIEW.md) and [Build 003 Evidence](reviews/2026-10-04-hover/README.md). All 29 packaged browser scenarios, 19 unit tests and offline completion passed. Original build 007 and scene build 002 remain preserved.
