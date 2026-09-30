# Median Depot Working Guidance

## Classroom Device Target

The teacher clarified on September 27, 2026 that **student laptops are the target for all of their educational games**. Apply that standing preference here. Do not spend implementation, screenshot, or verification work on phone-specific layouts unless the teacher changes this direction.

Prioritize laptop-sized windows, browser fullscreen, mouse/trackpad dragging, and keyboard access. Keep labels readable for classroom display use. Reasonable resizing and internally scrollable overlays are still useful on laptops.

## Scope and Review

- Use one focused issue and one reviewable PR per agreed handoff.
- Refer to issues as **Issue #N** and pull requests as **PR #N**.
- Use Title Case for user-facing titles and interface labels.
- Preserve immutable shipment IDs, quantities, and replay behavior when changing presentation.
- Keep current controls, screenshots, and verification notes accurate. State actual device-test limitations.
- Apply [Build Identity](docs/BUILD_IDENTITY.md) for artifact-producing work. Use the canonical build script and retain local allocation history; do not invent PR numbers or release codenames.
- Shared sources in `src/shared/` follow [the frozen world contract](docs/SHARED-WORLD-CONTRACT.md). MeanMachine consumes byte-identical copies and a matching source manifest; gameplay changes belong outside the shared directory.
