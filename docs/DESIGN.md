# Median Depot Design Brief

**Recorded:** September 27, 2026  
**Status:** A revisable design record from the initial brainstorm. Version 0.2.0 implements the sorting-and-odd-median foundation in a full-window 3D yard with collapsible controls. The broader features below remain planned unless documented as implemented in the README.

## Issue #1 Decisions

- Three.js and Vite, served as a static browser game; see [Runtime and Launch Decision](RUNTIME.md).
- Original rounded timber crates with unchanged numeric labels, persistent crate IDs, and separate row-position labels. Every crate is the same physical size; size does not encode quantity.
- Two immutable five-crate shipments: the first design example and an odd-count duplicate example. Codes restore both data and initial arrival order.
- 3D dragging, click/tap selection with Move buttons, and keyboard movement all use the same pure data operations. Correct sorting unlocks middle-crate selection and numeric submission.
- A simple procedural yard establishes the requested cartoony but professional appearance. It does not settle shared asset ownership or build the factory opening. That remains Issue #2; no companion repository is changed.

## Confirmed Direction

The teacher explicitly requested:

- A median game called **Median Depot**, alongside **Mean Machine**.
- A shared cartoon factory exterior in a shared cartoon place.
- Mean Machine's opening camera entering the factory.
- Median Depot's camera going in the other direction toward the rail yard.
- Shared aesthetics and assets, especially crates.
- Optional pair highlights that can be toggled on and off.
- Mirrored highlight colors such as purple, orange, blue, white, blue, orange, purple.
- **Example Mode** and **Challenge Mode**.
- Averaging the two middle values for even-sized datasets.
- Worksheet integration after the game is built.

The rest of this brief records the proposed teaching flow and implementation details discussed with that direction. They remain adjustable during issue work.

## The Shared Factory World

Both games begin with the same recognizable establishing view. The destination then communicates the job students will perform.

| Game | Destination | Mathematical Action |
| --- | --- | --- |
| Mean Machine | Factory interior and load bays | Share the total equally across the available bays. |
| Median Depot | Rail yard and sorting row | Order observations and find their middle value(s). |

The companion Mean Machine concept starts with irregular quantities of blocks in groups, with one color per incoming group. Students redistribute the blocks into equally sized groups, mixing colors as needed.

Median Depot moves intact crates. Each crate represents one observation whose numeric quantity stays fixed. Shared artwork should make the games feel related while each interaction preserves its mathematical meaning.

Potential scenery includes a factory sign, trucks, chimneys, tracks, and an arriving train. The exact scenery is an art choice. Skip Intro and a reduced-motion/static route are proposed classroom conveniences.

### Shared Assets

Prioritize reusable crates, block appearances, quantity labels, materials/palette, and suitable factory exterior elements. Keep a source and attribution manifest and a way to identify asset versions.

The exact sharing method is not selected. Inspect the companion repository before choosing a package, copied/versioned assets, submodule, or other method. Record the agreement here; implement Mean Machine changes through separately scoped work in that repository.

## Core Learning Loop

1. **Receive the Shipment:** Crates arrive in an unsorted order with readable quantities.
2. **Sort the Crates:** Move whole crates from least to greatest. Equal values can be in either relative order.
3. **Find the Middle:** Count or optionally pair inward from both ends.
4. **Read or Calculate the Median:** Use the central value for an odd count, or average the two central values for an even count.
5. **Explain and Retry:** Give useful feedback; allow a clean replay of the same shipment.

Pairing is a visual aid. Paired crates can dim or be marked as considered, but the full original dataset remains available. Two inspector robots walking inward are an optional presentation idea, not a required control scheme.

### Mathematical Rules

- One crate equals one observation. Duplicate quantities still occupy separate positions.
- Sorting changes order only; crate IDs and quantities persist.
- Row slots represent rank, not numeric distance.
- For an odd number of observations, the median is the quantity in the middle position.
- For an even number, the median is the arithmetic mean of the two middle quantities.
- A median may be fractional and may not appear in the original dataset.
- Pair colors reflect positions relative to the ends; paired values need not be equal.
- Median Depot does not redistribute the original shipment's blocks.

## Toggleable Pair Assistance

The teacher's requested seven-position example is captured exactly in order:

| Position From Left | Pair Role | Glow Color |
| --- | --- | --- |
| 1 | Outer pair, left | Purple |
| 2 | Second pair, left | Orange |
| 3 | Third pair, left | Blue |
| 4 | Middle observation | White |
| 5 | Third pair, right | Blue |
| 6 | Second pair, right | Orange |
| 7 | Outer pair, right | Purple |

For six observations, a corresponding pattern is purple, orange, white, white, orange, purple. Both central observations are needed.

Proposed behavior:

- Label the control **Show Pairs** and allow switching it on and off.
- Make the guide available after correct sorting so it reinforces the correct sequence.
- Use outlines, halos, or floor lights; keep original crate colors intact.
- Include a non-color relationship cue such as pair symbols or arcs.
- Keep help readily available in Example Mode; begin with it off in Challenge Mode.
- Do not impose a help penalty unless that is deliberately chosen later.
- Toggling assistance must not reorder crates, alter values, or reset progress.

The final palette for larger datasets and exact animation remain open.

## Odd and Even Shipments

| Arrival Order | Sorted Values | Middle Value(s) | Median | Teaching Point |
| --- | --- | --- | --- | --- |
| 8, 2, 18, 4, 3 | 2, 3, 4, 8, 18 | 4 | 4 | Sort before locating the middle. |
| 18, 3, 2, 8 | 2, 3, 8, 18 | 3 and 8 | 5.5 | Average the two middle values. |
| 18, 4, 2, 4 | 2, 4, 4, 18 | 4 and 4 | 4 | Equal quantities remain separate observations. |
| 8, 2, 180, 4, 3 | 2, 3, 4, 8, 180 | 4 | 4 | Increasing a value that stays largest leaves this median unchanged. |

For the second shipment, show the calculation **(3 + 8) / 2 = 5.5**.

A number line can show the median halfway between 3 and 8. It must look distinct from the ordered row: row position and numerical distance are different ideas.

An optional workbench can copy the two middle amounts and show equal sharing, connecting to Mean Machine. The original crates remain untouched. Explain that the calculation uses those two middle values, not the entire shipment.

## Example Mode

Proposed guided flow:

- Introduce the shipment and its quantities.
- Demonstrate or guide sorting.
- Reveal pairs from the outside inward.
- Identify the middle observation or two observations.
- Read the central quantity or calculate the two-value average.
- Explain the result and allow replay.

Use **Next Step** and **Replay** so the teacher controls pacing. Include odd and even counts, repeated values, and a fractional median. Keep text readable and do not rely only on animation or narration.

## Challenge Mode

Students sort and submit the median themselves. Provide feedback and retry, with optional pair assistance after sorting.

Proposed progression:

| Challenge Idea | Learning Focus |
| --- | --- |
| Five Crates Arrive | Sort and identify the middle of an odd count. |
| Matching Shipments | Count every occurrence of repeated quantities. |
| Two in the Middle | Average the central pair, including fractional results. |
| One Giant Delivery | Predict the effect of changing the largest value while it stays largest. |
| A Late Arrival | Insert a new observation, reorder, and find the new median. |

The last two are extension ideas. Avoid the broad claim that every outlier or every inserted value leaves the median unchanged.

Scoring, time limits, adaptive difficulty, and persistent student progress are undecided. They are not prerequisites for a useful classroom game.

## Shipments and Future Worksheets

Prepare stable shipment codes early. A code must refer to a defined dataset/version with documented replay behavior, including initial order where appropriate. Replaying or resetting should never silently generate a different task.

Worksheet integration comes later, after the game is playable and the current worksheet has been reviewed. A future task may ask students to record original values, sorted values, the middle value(s), the calculation, and an explanation.

The format, exports, automatic transfers, and external services remain undecided. Stable codes do not imply accounts or student-data collection.

## Classroom Use and Presentation

**Teacher clarification, September 27, 2026:** All educational games target student laptops. Phone-specific layouts, screenshots, and testing are out of scope. The Issue #11 overlay replaces the former bottom Crate Quantities strip with a compact native selector in Yard Controls. Keep keyboard and mouse/trackpad access as well as classroom display readability.

Plan for the classroom ViewBoard and student computers:

- Readable quantity labels, mode names, controls, and feedback.
- Mouse and touch operation, plus a practical alternative to precise dragging.
- Stable layout and state through fullscreen and resizing.
- Non-color pair cues and reduced-motion options.
- Fast replay without watching the introduction again.
- Short prompts that explain the next action.

Use Title Case for user-facing titles and controls. Keep explanatory sentences in natural sentence case.

## Open Questions

1. Which runtime and hosting approach fit the actual classroom devices?
2. What existing Mean Machine assets can be reused, and how will versions stay aligned?
3. Are quantities shown by visible block stacks, labels, or both?
4. Which shipment sizes and value ranges fit the first classroom progression?
5. Are shipments curated, generated, or a mixture?
6. What input alternatives best support sorting on the ViewBoard?
7. How should the midpoint demonstration and feedback be paced?
8. Which optional characters, sounds, and extension challenges improve learning?
9. What does the current worksheet require once the game is ready?

Track answers in the relevant issue and update this brief when a decision is made. See the [Roadmap](../ROADMAP.md) for the next implementation handoff.
