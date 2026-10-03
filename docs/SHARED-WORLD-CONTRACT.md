# Shared World Contract

Contract: `foam-factory-world@1.0.0`. Local implementation for existing Issue #2; no publication or companion-repository write is authorized by this document.

## Source Ownership and Handoff

MedianDepot is the sole author of this initial shared source. MeanMachine consumes a frozen, byte-identical copy of `src/shared/` with `manifest.json` and its SHA-256 source inventory. No npm package, submodule, remote runtime asset, or separate repository is required. A later shared change increments the asset version and refreshes the manifest in both repositories. Each repository retains its own gameplay and integration code.

| Source | Public Interface |
| --- | --- |
| `palette.js` | `PALETTE`, `PATTERNS`, `appearanceFor(index)`; independent color, pattern, and symbol |
| `primitives.js` | Original mesh and canvas-label helpers; no network requests |
| `cargo.js` | `RING_THICKNESS`, `createFoamRing({ color, pattern, symbol, identity, fraction })`, `createPallet({ id, label, quantity, appearance, coveredAbove })` |
| `world.js` | `WORLD`, `createSharedWorld()` → `{ root, train, factoryInterior, factoryShell }`; a common exterior, factory shell, rail spur, yard, and scenery |
| `camera.js` | `EXTERIOR_POSE`, `CAMERA_ROUTES`, `INTRO_DURATION_MS`, `sampleIntro(destination, elapsedMs, endpoint?)`; pure deterministic poses |
| `manifest.json` | Version, originating repository/base revision, license/provenance, files, and hashes |

All positions are Three.js Y-up world units, forward toward +Z. Factory center is `[-14, 0, -7]`; rail-yard sorting center is `[4, 0, 5]`. The factory entrance faces +Z. The shared exterior camera begins at `[22, 18, 32]`, looks at `[-6, 2, -4]`, uses vertical FOV 35°, and has zero roll. Neither game applies overlay view offsets to that start. The exact viewport aspect can differ; camera transform and FOV cannot.

`sampleIntro('median', ...)` swings right toward the yard; `sampleIntro('mean', ...)` swings left and enters the factory. It returns `{ position, target, roll, complete }`. Its final pose may be replaced by an integration-specific fitted teaching pose. Skip, reduced motion, hidden-tab interruption, and context loss must settle once at that endpoint. Resizing changes projection and the fitted endpoint without restarting the clock or changing observations. New shipments and replay remain at the teaching view.

## Cargo Rules

- A whole foam ring is one quantity unit. `fraction` sets exact vertical thickness; halves/thirds inherit the supplied identity, color, pattern, and symbol. Flat contact faces and a constant extruded cross-section make equal layers equal portions. Relief is on the side wall so it survives horizontal slicing.
- Smooth, Ribbed, Grooved, and Studded are actual geometric profiles, independent of material color. These first source profiles remain subject to visual classroom review, particularly thin Studded slices.
- Pallets show exact countable whole rings for integers 0–8. Zero remains a tagged empty pallet. Greater quantities are visibly covered and tagged; a cover never pretends to display a smaller visible count.
- MedianDepot moves the entire pallet and never changes its quantity or source appearance. MeanMachine may build a pallet's load from individually identified whole/fractional rings using the same factory functions.
- Pair assistance and selection use separate bases/flags. They do not replace source cargo colors or patterns.

## Integration Sequence

1. Implement and freeze this shared source and the MedianDepot Issue #2 opening; verify the current sorting loop and local build identity.
2. Checkpoint Issue #2 locally and hand the frozen bundle to the parent for MeanMachine consumption.
3. Only then implement existing Issue #12 in a separate local checkpoint, coordinated with Issues #3/#4: variable odd/even shipments, duplicates/zero, optional mirrored pairs, and averaging both middle quantities after activating either.

No proprietary PLTW content is copied into the source or assets. Public curriculum adaptations remain planning context; the game does not claim to assess all of DM 1.3 or DM 1.4.

## MeanMachine Consumer Instructions

1. Copy the complete frozen `src/shared/` directory unchanged into MeanMachine's `src/shared/`. Pin Three.js to 0.186.1 and preserve its MIT license. Verify every manifest SHA-256 against file bytes before integrating. Record the handoff's source commit SHA in the companion documentation; do not run `shared-manifest.mjs` in the consumer to bless divergent files.
2. Add `createSharedWorld().root` to the scene. Match the exterior camera transform/FOV above, with no view offset at time zero. Use `sampleIntro('mean', elapsedMs, fittedEndpoint)` for travel. At about 60% through the route, hide `factoryShell` for a cutaway interior view; keep `factoryInterior` visible. MeanMachine owns its bay layout, fitted endpoint, UI-safe framing, and interaction locks.
3. `createPallet` returns a `THREE.Group` whose origin is its ground contact. Its `Load` child begins at Y=0.29. Whole rings start at Y=0 and have thickness `RING_THICKNESS=0.26`; stack them by summed quantity, without per-piece gaps. For a dynamic fractional load, create an empty pallet, fill its `Load` group with identified rings/pieces, and replace the named `Quantity Tag` with a current-load label using `createLabel`. Keep original shipment quantities separately.
4. `createFoamRing` accepts `fraction` in (0,1], with 1/2 and 1/3 markings supported; all supplied source identity fields survive unchanged in `userData`. Reuse the parent's appearance for split pieces. Mathematical conservation, transfer, splitting, undo, bounce, and move locks remain consumer responsibilities.
5. Share source appearance and world geometry; keep destination gameplay independent. A frozen copy does not claim MeanMachine's integration, fractions, or animation have passed MedianDepot's tests. Thin Studded slices still need teacher review.

The handoff directory's `CONSUMER-LOCK.json` records the exact local source commit and every copied file hash, including `manifest.json`, without embedding a self-referential commit SHA inside source. The parent owns copying that frozen directory to the companion worker.
