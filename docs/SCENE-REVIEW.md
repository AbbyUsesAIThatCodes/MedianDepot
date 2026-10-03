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

This initial checkpoint records scope only. Implementation and current verification are pending. No merge or deployment is authorized.
