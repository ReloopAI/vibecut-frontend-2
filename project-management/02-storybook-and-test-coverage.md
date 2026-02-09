# Add Storybook and Test Coverage Baseline

## Goal
Establish UI review and automated quality checks with minimum viable Storybook + test coverage.

## User Stories
- As a designer/developer, I want isolated component previews to review UI quickly.
- As a maintainer, I want basic automated tests to prevent regressions.
- As a team lead, I want coverage visibility to track test health.

## Scope
- Add Storybook configuration for `apps/web` UI components.
- Create initial stories for core reusable UI components.
- Add unit tests for critical domain logic (project save/migrations, timeline helpers).
- Add coverage output and CI reporting.

## Technical Plan
1. Install Storybook for Next.js app and create `.storybook` config.
2. Add stories for top-priority components (button/input/dialog/editor panel shell).
3. Standardize test runner (Bun test or Vitest) and add scripts.
4. Add coverage reporting (`lcov` + text summary).
5. Add CI job for tests and coverage threshold checks.

## Acceptance Criteria
- `storybook` runs locally and stories load.
- At least 10 representative stories exist for shared UI.
- Tests run via one command from root.
- Coverage report generated in CI artifacts.
- Initial minimum threshold enforced (for example 30% lines, then ratchet upward).

## Risks and Mitigations
- Risk: Tooling drift with Bun/Next setup.
- Mitigation: Keep scripts simple and documented in README.

## Deliverables
- Storybook setup + starter stories.
- Test/coverage scripts and CI workflow update.
- Testing strategy doc for future contributors.
