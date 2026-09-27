# Median Depot Roadmap

Recorded September 27, 2026 from the teacher-and-Rowan brainstorm.

**Current State:** Planning only. This document records the intended direction; it does not claim that any gameplay, art, hosting, or integration exists. All implementation issues below are open at the time of writing.

See the [Design Brief](docs/DESIGN.md) for teaching mechanics, examples, and the distinction between confirmed direction and proposed details.

## Product Direction

Build a median game in the rail yard beside Mean Machine's cartoon factory. Both games open on the same exterior. Mean Machine goes inside; Median Depot takes the other camera route to the yard. Share the visual style and reusable assets, especially crates.

Median Depot preserves each crate's quantity while students order observations, use optional mirrored-pair assistance, and identify the middle value(s). Include Example Mode and Challenge Mode, with correct treatment of even-sized datasets.

Worksheet integration follows the playable game.

## Implementation Sequence

| Order | Issue | Deliverable | Dependencies |
| --- | --- | --- | --- |
| 1 | [Issue #1](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/1) | Small playable sorting loop, odd-count median, preserved crate identities, and reproducible shipment foundation | None |
| 2 | [Issue #2](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/2) | Shared factory/yard art direction, reusable crates, and exterior-to-yard opening | Issue #1 runtime decision |
| 3 | [Issue #3](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/3) | Toggleable mirrored pair highlights and odd/even middle markers | Issue #1 |
| 4 | [Issue #4](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/4) | Two-middle-value selection, averaging, and numeric midpoint explanation | Issues #1 and #3 |
| 5 | [Issue #5](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/5) | Guided Example Mode with Next Step and Replay | Issues #1, #3, and #4 |
| 6 | [Issue #6](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/6) | Independent Challenge Mode and reproducible progression | Issues #1, #3, and #4 |
| 7 | [Issue #7](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/7) | Integrated classroom usability checks and a documented launch route | Issues #2 through #6 |
| 8 | [Issue #8](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/8) | Worksheet alignment and verified shipment references | Issue #7; explicitly deferred |

This is the recommended handoff order. Art planning may begin early; integration follows the selected runtime. Example Mode and Challenge Mode share the same data and median logic. No dependency requires implementing another repository's opening before Median Depot can run.

## Phase 1: Prove the Learning Interaction

Use Issue #1 to choose and document a suitable runtime and create one small playable shipment. Preserve one observation per crate, support equal values, and keep quantity separate from position.

A simple scene is enough for this phase. A correct, replayable sorting-and-answer loop is the completion signal.

## Phase 2: Build the World and Teaching Modes

Use Issues #2 through #6 to establish the shared cartoon setting, optional pair assistance, even-count averaging, Example Mode, and Challenge Mode.

The requested seven-crate highlight pattern, from left to right, is:

**PURPLE · ORANGE · BLUE · WHITE · BLUE · ORANGE · PURPLE**

For an even shipment, the two middle crates are both white. Pair colors identify mirrored positions and must remain distinguishable from the original crate colors.

## Phase 3: Reach a Classroom-Playable Release

Issue #7 checks the integrated result. The first classroom release is complete when:

- [ ] The shared factory exterior leads into the rail yard, with a practical way to skip or reduce camera motion.
- [ ] Students can sort whole crates without changing or losing any observation.
- [ ] Repeated values, odd counts, even counts, and fractional medians work correctly.
- [ ] Show Pairs is toggleable and readable without relying solely on color.
- [ ] Example Mode supports guided steps and replay.
- [ ] Challenge Mode supports independent work, optional help, feedback, and replay.
- [ ] Stable shipment references reproduce the intended data.
- [ ] Classroom controls, labels, screen resizing, and representative input methods have been checked.
- [ ] The actual launch procedure, tested devices, limitations, and any published URL are documented accurately.

This gate is a feature target, not a scheduled delivery date. Scores, timers, accounts, leaderboards, and student tracking are not requirements for this release.

## Phase 4: Connect the Worksheet

Issue #8 starts after the game is playable and the teacher has reviewed the current worksheet.

Use the game's real vocabulary and actions. Align shipment references, ordered data, central values, calculations, and answer keys. Decide the worksheet format and any export or data-transfer mechanism at that point.

Preparing stable shipment codes early is useful; building worksheet integration early is outside the agreed sequence.

## Open Decisions

- Runtime/engine and classroom hosting route.
- Shared asset ownership, source locations, versioning, and synchronization with Mean Machine.
- Exact crate design and how quantities are visible.
- Dataset sizes, value ranges, curated versus generated shipments, and progression.
- Final controls, help defaults, feedback wording, and presentation of the midpoint.
- Whether inspector robots, extra challenge scenarios, sound, scoring, or timers add teaching value.

These choices should be resolved in the relevant issue rather than silently treated as prior agreements.

## Next Handoff

Start a new implementation conversation with [Issue #1](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/1):

> Implement Median Depot Issue #1 as one focused PR. Read README.md, ROADMAP.md, and docs/DESIGN.md first. Build the smallest playable sorting-and-odd-median loop, preserve all crate observations, and document the runtime choice, shipment replay behavior, and verification.

Keep later issues open until their implementation and acceptance criteria are satisfied. The documentation PR records this plan; it does not complete the game issues.
