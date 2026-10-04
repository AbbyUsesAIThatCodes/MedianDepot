# Local Release Validation

Validated 2026-10-04T14:44:46.045Z on Abigail against the exact public payload.

Build: `0.2.0_Uncodenamed_local-scene-20261003_build-003_20261004T005915Z_gc4a348c8098d_web`. Runtime source: `c4a348c8098dae9687f5cd9387a0613afb7e2c09`.

- Unit tests: **19 passed; zero failed**.
- Browser suites: **1 passed**. All 29 scenarios passed.
- Public-path, identity, runtime-byte and exclusion checks passed. The local rollback snapshot loads.
- Workflow YAML is manual-only and main-only, with one standard Ubuntu publishing job and one-day artifact retention. No hosted build, browser test, package install or cache step.

[Machine-Readable Validation](LOCAL_VALIDATION.json) records hashes of retained local evidence. Raw screenshots, synthetic response downloads and local paths remain outside the public repository. Hosted CI was not run. Physical school-device/projector/screen-reader checks remain separate.
