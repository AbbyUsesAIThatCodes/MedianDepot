# Hover Indicator Review

Narrow owner-approved follow-up to Issue #12 / draft PR #17, October 4, 2026. Preserve build 002, all earlier review packages and the frozen shared world. No merge or deployment.

## Diagnosis

Reproduced MD-1-006 in immutable scene build 002: sort `0, 1, 2, 4, 4, 6, 7, 8, 9`, then double-click position five. The median state and yellow arrow correctly select C06 (value 4). Moving the mouse over C08 (value 1, second from the left) produces the reported bright glow while the shipment dropdown can retain focus: canvas input intentionally does not take keyboard focus. Show Pairs independently enables positional pair lights on all nine pallets. Clicking the dropdown clears mouse hover; pair lighting remains.

The screenshot alone cannot establish an incorrect median or a stale hover without the pointer position. A separate stale-hover defect was reproduced: replay/reordering can move C08 away from the stationary pointer, yet its mouse glow stays attached to C08 because the old implementation refreshed hover only on pointer movement. Keyboard interaction also leaves that old mouse cue visible. Both regression checks fail against preserved build 002.

## Narrow Change

Only the scene's hover lifecycle changes. Retain the last mouse coordinates and raycast the current pallet geometry on scene draws and gesture completion. Check that the pointer is over the canvas rather than an HTML overlay. Clear mouse hover when keyboard interaction, pointer cancellation, blur or hidden-tab interruption takes over. Touch still produces no persistent mouse glow. A QA-only moving flag lets the replay test verify the final settled position as well as the animation transition.

Median candidates, double-click rules, pair colors/styles/labels, pallet appearance, camera bounds, instructional text, all shipment IDs/quantities and math/answer feedback remain unchanged. A real mouse hovering over a nonmedian pallet still lights that pallet; only a yellow arrow denotes a median candidate.

## Verification Checkpoint

Development checks passed: 19 existing unit tests and 10 focused browser scenarios. Four new scenarios cover the exact nine-pallet report, independent indicators with dropdown focus, keyboard switching/reordering/replay/shipment changes, stationary-pointer animated replay, and drag release/cancellation. The two targeted checks failed for the expected stale-hover reason on original build 002 before the fix. Final immutable-artifact evidence is added after packaging.

Physical school touchscreens/trackpads and classroom projection remain owner-review checks. Existing compact-camera readability and original build 007 provenance limits remain as recorded in earlier review notes.

## Worksheet Impact

None to worksheet content, data or answers. The median for MD-1-006 remains 4 at sorted position five; equal quantities remain separate observations. No worksheet feature, export, student-result download or progress persistence was added. New screenshots should use the fixed review build to avoid capturing a stale hover; yellow arrows and optional pair labels retain their meanings.
