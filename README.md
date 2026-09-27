# Median Depot

A planned classroom game about **median**, set in the rail yard beside the cartoon factory shared with **Mean Machine**.

Students sort intact cargo crates by quantity, optionally highlight matching positions from the ends of the row, and find the middle value. Even-sized shipments introduce the average of the two middle values.

**Status:** Design and implementation planning, recorded September 27, 2026. There is no playable game or selected runtime yet.

## Start Here

- [Roadmap](ROADMAP.md): build order, issue links, dependencies, and the first classroom release.
- [Design Brief](docs/DESIGN.md): agreed direction, teaching examples, and open choices.
- [Issue #1](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/1): the first implementation handoff.

## A Shared Factory World

Both games begin outside the same factory in the same cartoon place:

| Game | Camera Destination | Student Action |
| --- | --- | --- |
| Mean Machine | Inside the factory | Redistribute blocks among available bays until every bay has the same amount. |
| Median Depot | Away from the factory entrance toward the rail yard | Sort whole crates and find the middle observation or observations. |

The games are intended to share aesthetics and assets, especially crates. The exact asset-sharing mechanism remains open. This repository records the Median Depot work; companion-repository changes receive their own scoped PR.

## Planned Features

- Example Mode and Challenge Mode.
- Intact-crate sorting, including repeated values as separate observations.
- Toggleable mirrored pair highlights with a distinct middle marker.
- Odd-count median and averaging the two middle values for even counts.
- Stable, replayable shipments.
- Worksheet integration **after** the game is playable.

## Working on the Project

Use focused issues and reviewable PRs, with one implementation handoff at a time. PR descriptions should explain the classroom purpose, changed behavior, verification, and remaining limitations. Refer explicitly to **Issue #N** and **PR #N**.

The roadmap is revisable and is not a release-date promise. Future implementation PRs should add actual launch instructions and keep feature status accurate. Use Title Case for user-facing game titles and interface labels; preserve exact code and repository identifiers.
