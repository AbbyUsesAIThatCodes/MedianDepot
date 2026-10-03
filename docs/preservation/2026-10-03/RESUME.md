# Jess Preservation And Abigail Resume

Original source: `60cd6252a52106a1b56296a03bb18d24923d6edb` on `local/issue-12-variable-median`. The original branch remains at the exact source commit; this separate preservation branch adds only evidence and this handoff.

Original build: `0.2.0_Uncodenamed_local-20260930_build-007_20260930T140157Z_g60cd6252a521_web`. This remains a local review build, not a PR build or readiness claim. 16 unit tests passed again on 2026-10-03 (Node 24, process isolation disabled because of sandbox spawn restrictions). Original source notes record 22 browser tests; final build 007 offline evidence is included. No server or new browser run was started.

## Resume On Abigail

```sh
git clone --branch local/issue-12-variable-median https://github.com/AbbyUsesAIThatCodes/MedianDepot.git
cd MedianDepot
git rev-parse HEAD
git fetch origin preserve/jess-2026-10-03
```

Expected HEAD: `60cd6252a52106a1b56296a03bb18d24923d6edb`. Evidence can be viewed on `origin/preserve/jess-2026-10-03` without changing the original branch. Verify artifact SHA-256 against `CHECKSUMS.json` before use. Retain the original local build ledger as historical evidence; use a fresh explicit local scope or the documented durable PR allocator for any later build.

## Shared Factory

Canonical editable source: MedianDepot `871ca3d2e5d605524cd846db13de3e22a1ea9658`, branch `local/issue-2-shared-world`. MeanMachine consumes the original six `src/shared/` files byte-identically under its existing consumer lock. Do not reverse engineer MeanMachine or recreate this factory. The frozen archive is preserved on MedianDepot's preservation branch with SHA-256 `8ea6a139f9d3147ef7569e2405f0840590a24fc5f4a06ae14deccc355592833e`.

## Boundaries

No gameplay changes, merge, deployment, settings changes, or new build were made. MeanMachine Issues #4/#5/#9 remain outside this preservation task. Source history was screened for credential signatures, private-file candidates and oversized blobs; no exclusions or history rewriting were necessary for this repository. Dependency caches, browser profiles, private auth records and source-workspace metadata are excluded. Original browser evidence has not been represented as a new run. Read repository AGENTS.md and the shared integration contract before resuming.
