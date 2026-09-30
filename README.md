# Median Depot

A 3D classroom game about **median**, in the rail yard beside Mean Machine's foam factory. Sort intact pallets, find the middle observation or observations, and average both middle values when the count is even.

**Current Local Development:** Issue #2 adds shared foam-ring pallets and the factory-to-yard opening. Both games consume the same exterior pose and world sources; MedianDepot swings into the yard. **Skip Intro** settles immediately, and **Reduce Motion** cuts to the same stable teaching view. Replay and shipment changes stay in the yard. Issue #12 adds variable counts, optional numbered pair guides, middle-pallet activation, and correct even-count averaging. Existing shipment IDs and quantities remain unchanged. This work has not been published or deployed.

The accepted release baseline remains **0.2.0**. Local review builds use explicit development scope, a durable ordinal, UTC timestamp, source revision, and dirty-source fingerprint. See [Build Identity](docs/BUILD_IDENTITY.md) and the generated [Current Local Build](docs/CURRENT_BUILD.md).

## Launch Locally

Install Node.js **22.12 or later**, then run from this repository:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173`. Keep that terminal running. Students use a laptop with a modern WebGL2-capable browser; Node is needed on the development/hosting machine. If 3D is unavailable, the accessible HTML controls remain playable.

For a production build:

```sh
npm run build
npm run preview
```

Open the preview URL, normally `http://127.0.0.1:4173`. Serve `dist/` with a static HTTP server, or open the separately bundled **Play Median Depot.html** directly for offline play. The normal `index.html` entry still requires HTTP. Versioned copies are placed in `artifacts/<full-build-identity>/`.

## Play a Shipment

1. Drag whole pallets in the 3D yard, or open **Yard Controls**, choose **Select a Pallet**, and use **Move Left** / **Move Right**. Keyboard: Tab to the selector, use arrow keys to choose a pallet (Enter to confirm if the native menu requires it), then Tab to a Move button and press Enter or Space.
2. Arrange quantities from least to greatest, then choose **Check My Order**. Equal quantities may be in either order.
3. With an odd count, double-click the middle pallet to complete the round. Keyboard alternative: choose it in **Select a Pallet**, then activate **Use Selected Pallet**. With an even count, activate either middle pallet, add both displayed middle quantities, divide by 2, and **Submit Median**. Selecting one middle value alone does not complete an even round.
4. **Show Pairs** toggles mirrored outlines and numbered labels after the order is checked; source cargo colors stay unchanged. **Next Shipment** advances only when you choose it. **Replay Shipment** restores the exact arrival order. **Edit the Order** reopens sorting without changing values. These actions stay in the yard.

Pallet IDs travel with the pallets. **Quantity** is the number inside; **Position** is the pallet's current place in the row. Original quantities and IDs are always available in **Shipment Manifest**. That dialog also contains a selectable replay link. **Yard Controls** hides/reopens the overlay without changing order, selection, phase, or a typed answer. Escape hides the overlay when a dialog or native selector is not using that key. **Fullscreen** optionally hides browser chrome; the yard already fills the browser viewport by default. **Reduce Motion** is inside the overlay. All of these controls preserve the current arrangement.

| Shipment Code | Arrival Quantities | Sorted Quantities | Median |
| --- | --- | --- | --- |
| `MD-1-001` | 8, 2, 18, 4, 3 | 2, 3, 4, 8, 18 | 4 |
| `MD-1-002` | 4, 8, 2, 4, 3 | 2, 3, 4, 4, 8 | 4 |
| `MD-1-003` | 8, 2, 0, 3 | 0, 2, 3, 8 | 2.5 |
| `MD-1-004` | 7, 4, 0, 9, 4, 2 | 0, 2, 4, 4, 7, 9 | 4 |
| `MD-1-005` | 6, 0, 3, 3, 1, 8, 2 | 0, 1, 2, 3, 3, 6, 8 | 3 |
| `MD-1-006` | 9, 2, 7, 0, 4, 4, 6, 1, 8 | 0, 1, 2, 4, 4, 6, 7, 8, 9 | 4 |
| `MD-1-007` | 5, 2 | 2, 5 | 3.5 |
| `MD-1-008` | 0, 6, 3 | 0, 3, 6 | 3 |

Append `?shipment=MD-1-002` to the launch URL to reproduce that shipment. Codes identify immutable versioned datasets **and arrival order**, not a saved in-progress game. Reload starts fresh. Unknown codes show a notice and use the default. See [Runtime and Launch Decision](docs/RUNTIME.md) for the full contract.

## Classroom Device Target

The teacher's standing target for all educational games is **student laptops**. Prioritize laptop windows, mouse/trackpad input, keyboard access, and readable classroom projection. Phone-specific layouts, screenshots, and testing are outside this project's scope.

On shorter laptop windows the overlay scrolls internally; the page and yard remain fixed to the viewport. The camera frames all current pallets in the area clear of the open overlay. Collapse **Yard Controls** for an unobstructed yard.

## GitHub Pages

In repository **Settings → Pages → Build and Deployment**, choose **GitHub Actions** as the source. The included workflow tests and builds PRs, and deploys after a merge to `main` or a manual workflow run on `main`. No deployment occurs from a PR. The final public URL appears in the successful deployment; this README does not claim a deployment has already happened.

## Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Tests cover shipment identity, sorting, duplicates, middle-pallet activation, rejected answers, replay, data preservation across all smaller-shipment permutations and larger-row move checks, and browser interactions. [Verification Notes](docs/VERIFICATION.md) record actual checks and classroom-device limitations. [Assets and Attribution](docs/ASSETS.md) describes the original procedural art and bundled dependency licenses.

## Start Here

- [Roadmap](ROADMAP.md): build order, issue links, dependencies, and the first classroom release.
- [Design Brief](docs/DESIGN.md): agreed direction, teaching examples, and open choices.
- [Issue #1](https://github.com/AbbyUsesAIThatCodes/MedianDepot/issues/1): scope for the first playable implementation.

## A Shared Factory World

Both games begin outside the same factory in the same cartoon place:

| Game | Camera Destination | Student Action |
| --- | --- | --- |
| Mean Machine | Inside the factory | Redistribute foam rings or equal fractional layers among bays until quantities are equal. |
| Median Depot | Away from the factory entrance toward the rail yard | Sort whole pallets and find the middle observation or observations. |

The shared source and camera interface are documented in [Shared World Contract](docs/SHARED-WORLD-CONTRACT.md). MeanMachine integration is separate; the parent coordinates a frozen source copy.

## Planned Features

- Example Mode and Challenge Mode.
- Intact-pallet sorting, including repeated values as separate observations.
- Implemented locally in Issue #12: toggleable mirrored pair guides with distinct middle markers.
- Implemented locally in Issue #12: odd-count activation and averaging both middle values for even counts.
- Stable, replayable shipments.
- Worksheet integration **after** the game is playable.

## Working on the Project

Use focused issues and reviewable PRs, with one implementation handoff at a time. PR descriptions should explain the classroom purpose, changed behavior, verification, and remaining limitations. Refer explicitly to **Issue #N** and **PR #N**.

The roadmap is revisable and is not a release-date promise. Future implementation PRs should add actual launch instructions and keep feature status accurate. Use Title Case for user-facing game titles and interface labels; preserve exact code and repository identifiers.
