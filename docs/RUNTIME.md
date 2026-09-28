# Runtime and Launch Decision

Recorded before implementation for Issue #1, September 27, 2026.

Use **Three.js with JavaScript ES modules and Vite**. A static browser build gives the classroom a launch route without an engine editor, account, backend, or runtime CDN. Pin dependencies in the lockfile. Node.js 22.12+ is for development only; students use a modern WebGL2-capable browser. The initial scene is a small, original, procedural 3D rail yard: softly rounded timber crates, warm lighting, teal depot furniture, and clear quantity labels. The shared factory opening and final art remain Issue #2.

The interaction must also work through semantic HTML buttons. Clicking or tapping a crate selects it; Move Left and Move Right reorder that whole observation. Keyboard and drag input use the same data operations. A renderer failure leaves the accessible sorting row usable.

Shipments are curated and versioned, not randomly generated. `MD-1-001` identifies arrival values `8, 2, 18, 4, 3`; `MD-1-002` identifies `4, 8, 2, 4, 3`. The `1` is the dataset schema/catalog version, not the application version. Each observation receives an immutable code-derived ID (`MD-1-001-C01`, etc.) in arrival order. Codes and their ordered values must never be reassigned: changed data requires a new code or catalog version. Equal quantities retain different IDs.

Reset, reload, and a URL with `?shipment=MD-1-001` restore the exact arrival order and clear selection, feedback, and completion. A code does not restore an in-progress arrangement. Unsupported codes display an explicit notice before using the default; they never silently resolve to different data. The original arrival list remains available in the Shipment Manifest.

Local launch, controls, and build commands are maintained in the README. A GitHub Pages workflow will build static assets on merge to `main`; the repository owner must enable Pages with GitHub Actions as its source. A submitted PR is not a published classroom URL.

## Full-Window Overlay Update (Version 0.2.0)

Issue #11 replaces the surrounding page layout and bottom quantities strip with an edge-to-edge canvas and a collapsible Yard Controls overlay. A native crate selector and Move buttons preserve keyboard access without duplicating a permanent row of quantity cards. The perspective camera frames the same yard inside the clear area beside the overlay using a view offset; toggles do not mutate game state. Short laptop windows scroll inside the overlay.

The teacher clarified that student laptops are the target across all educational games. Phone-specific layout and testing are out of scope. Keep mouse/trackpad and keyboard operation, laptop resizing, optional browser fullscreen, and classroom display readability.
