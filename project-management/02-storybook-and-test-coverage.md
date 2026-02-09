# Storybook and Test Coverage

## Goal
Introduce stable quality gates in phases: lock in repeatable tests first, then add Storybook for UI review.

## Why This Order
- Tests provide immediate regression protection for core editor behavior.
- Storybook is valuable, but should not delay foundational reliability.
- Existing migration tests already exist and can be expanded instead of starting from zero.

## User Stories
- As a maintainer, I want deterministic tests for critical editor logic so refactors are safer.
- As a lead, I want CI coverage artifacts and baseline thresholds to monitor progress.
- As a designer/developer, I want isolated stories for shared UI components.

## Scope
### Phase 1 (implement now)
- Standardize `bun test` scripts for `apps/web` and root workspace.
- Enable coverage reports (`text` + `lcov`) and CI artifact upload.
- Add high-value domain tests for timeline/time helpers and storage migrations.

### Phase 2
- Add Storybook to `apps/web` targeting reusable shared components first.
- Add at least 10 focused stories (button/input/dialog/shell components).

### Phase 3
- Introduce coverage threshold policy and ratchet strategy.
- Add guardrail: coverage must not decrease on PRs.

## Non-Goals (This Initiative)
- Full E2E test suite for rendering/export pipelines.
- Browser automation for editor interactions.
- Large auth/backend integration testing.

## Technical Plan
1. Add explicit scripts:
   - `apps/web`: `test`, `test:coverage`
   - root: `test:web`, `test:web:coverage`
2. Update CI:
   - run tests in `apps/web`
   - generate coverage files
   - upload coverage artifact
3. Expand unit coverage in pure modules:
   - timecode parsing/formatting/snap behavior
   - timeline bookmark helper behavior
   - existing storage migration tests remain mandatory
4. Storybook setup in a separate implementation PR after test baseline is stable.

## Acceptance Criteria
- `npm run test:web` executes and passes locally.
- `npm run test:web:coverage` generates `apps/web/coverage/lcov.info`.
- CI uploads coverage artifacts for inspection.
- New tests cover critical branches in time/timeline helpers.
- Storybook remains planned, but does not block Phase 1 rollout.

## Risks and Mitigations
- Risk: Bun/Next/tooling mismatch in CI.
- Mitigation: Keep to Bun-native test runner and simple scripts.
- Risk: Initial threshold too strict causing noisy failures.
- Mitigation: start with baseline visibility + no-regression policy, then ratchet.

## Deliverables
- Updated scripts and CI workflow for tests + coverage.
- Added domain tests under `apps/web/src`.
- Updated planning document with phased rollout.
