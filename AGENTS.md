# AGENTS.md

## Overview

Privacy-first video editor, with a focus on simplicity and ease of use.

## Lib vs Utils

- `lib/` - domain logic (specific to this app)
- `utils/` - small helper utils (generic, could be copy-pasted into any other app)

## Core Editor System

The editor uses a **singleton EditorCore** that manages all editor state through specialized managers.

### Architecture

```
EditorCore (singleton)
├── playback: PlaybackManager
├── timeline: TimelineManager
├── scene: SceneManager
├── project: ProjectManager
├── media: MediaManager
└── renderer: RendererManager
```

### When to Use What

#### In React Components

**Always use the `useEditor()` hook:**

```typescript
import { useEditor } from '@/hooks/use-editor';

function MyComponent() {
  const editor = useEditor();
  const tracks = editor.timeline.getTracks();

  // Call methods
  editor.timeline.addTrack({ type: 'media' });

  // Display data (auto re-renders on changes)
  return <div>{tracks.length} tracks</div>;
}
```

The hook:

- Returns the singleton instance
- Subscribes to all manager changes
- Automatically re-renders when state changes

#### Outside React Components

**Use `EditorCore.getInstance()` directly:**

```typescript
// In utilities, event handlers, or non-React code
import { EditorCore } from "@/core";

const editor = EditorCore.getInstance();
await editor.export({ format: "mp4", quality: "high" });
```

## Actions System

Actions are the trigger layer for user-initiated operations. The single source of truth is `@/lib/actions/definitions.ts`.

**To add a new action:**

1. Add it to `ACTIONS` in `@/lib/actions/definitions.ts`:

```typescript
export const ACTIONS = {
  "my-action": {
    description: "What the action does",
    category: "editing",
    defaultShortcuts: ["ctrl+m"],
  },
  // ...
};
```

2. Add handler in `@/hooks/use-editor-actions.ts`:

```typescript
useActionHandler(
  "my-action",
  () => {
    // implementation
  },
  undefined,
);
```

**In components, use `invokeAction()` for user-triggered operations:**

```typescript
import { invokeAction } from '@/lib/actions';

// Good - uses action system
const handleSplit = () => invokeAction("split-selected");

// Avoid - bypasses UX layer (toasts, validation feedback)
const handleSplit = () => editor.timeline.splitElements({ ... });
```

Direct `editor.xxx()` calls are for internal use (commands, tests, complex multi-step operations).

## Commands System

Commands handle undo/redo. They live in `@/lib/commands/` organized by domain (timeline, media, scene).

Each command extends `Command` from `@/lib/commands/base-command` and implements:

- `execute()` - saves current state, then does the mutation
- `undo()` - restores the saved state

Actions and commands work together: actions are "what triggered this", commands are "how to do it (and undo it)".

# Frontend Agent Guide (React + Clean UI)

This repository uses **test-first development** and **clean UI/code** principles.
AI agents must follow these rules when planning, coding, and refactoring.

---

## 1) Core Principles

### Test-first is mandatory

Follow **Red → Green → Refactor** where practical:

1. **Red:** Write a failing test that captures the behavior.
2. **Green:** Implement the simplest code to pass.
3. **Refactor:** Improve structure/readability with tests green.

UI work that is purely presentational may start with a minimal component and then tests, but behavior changes must be test-first.

### Clean code and clean UI always

- Prefer **clarity over cleverness**.
- Use **small components**, **meaningful names**, **single responsibility**.
- Keep UI structure simple; avoid deeply nested layouts.
- Avoid over-engineering; introduce abstractions only when pressure appears.

### Minimal scope

- Implement only what’s needed for the current task/tests.
- No premature “future-proofing.”

### Never use `any`

- **Do not use `any` as a type.**
- Prefer precise types or generics.

---

## 2) Workflow Rules (How the agent works)

### Before coding

- Identify the smallest behavior to add.
- Decide where it belongs (component, hook, util, store).
- Write/adjust tests first for behavior changes.

### While coding

- Keep changes small and incremental.
- Run tests frequently and keep them green.

### After coding

- Refactor for readability and structure.
- Ensure linting/formatting pass.
- Update docs only if behavior/usage changed.

---

## 3) Project Architecture Expectations (React)

### Component structure

- **UI components**: presentational, no side effects.
- **Feature components**: orchestrate UI + hooks/state.
- **Hooks**: encapsulate shared logic.
- **Utilities**: pure functions.

### Dependency direction

- Features can use shared UI/components/utils.
- Shared UI must not depend on feature-specific logic.

### State

- Prefer local state where possible.
- Use a shared store only when state must be shared across major areas.

---

## 4) Testing Strategy (React)

### Preferred test types

1. **Unit tests**: pure utils, hooks (default).
2. **Component tests**: React Testing Library for behavior.
3. **E2E tests**: only for high-level flows.

### What to test

- Behavior and user interactions, not implementation details.
- Edge cases and failure paths.

### Testing rules

- Every new behavior must include tests.
- Tests must be deterministic.
- Avoid snapshot tests for logic-heavy components.

---

## 5) Clean Code Rules (Non-negotiable)

### Naming

- Use intention-revealing names.
- Avoid ambiguous abbreviations.

### Functions & components

- Keep functions small.
- Keep components focused.
- Avoid prop drilling if a context or store is more appropriate.

### Error handling

- Fail fast; show user-friendly messages where needed.
- No silent failures.

### Comments

- Use comments sparingly, only for _why_, not _what_.

### Formatting

- Follow repo lint/format rules.
- No unused variables or dead code.

---

## 6) React Conventions

### Props & types

- Use typed props and shared types in `types/` or local `types.ts`.
- Avoid widening types; keep them as narrow as possible.

### Accessibility

- Use semantic HTML.
- Ensure keyboard navigability for interactive elements.

### Styling

- Follow repo styling approach consistently.
- Keep styles co-located with components when possible.

---

## 7) Implementation Guidelines

### When adding new UI behavior

1. Write a test describing the interaction.
2. Implement the smallest change to pass.
3. Refactor for clarity and reusability.

### When fixing a bug

1. Add a failing test.
2. Fix with minimal change.
3. Refactor if needed.

---

## 8) Agent Output Expectations

When producing changes, the agent should:

- Include tests with each behavior change.
- Keep patches focused and minimal.
- Summarize what changed and why.

---

## 9) Quality Gate Checklist (must pass)

- [ ] All tests pass (`unit`, `component`, `e2e` as applicable)
- [ ] Lint/format checks pass
- [ ] No flaky or time-dependent tests
- [ ] No new unused exports or dead code
- [ ] Accessibility reviewed for interactive changes

---

## 10) Default Commands (adjust if repo differs)

Prefer these commands if they exist:

- `npm test` / `pnpm test`
- `npm run test:watch`
- `npm run test:e2e`
- `npm run lint`
- `npm run format`

Follow `package.json` scripts if different.

---

## 11) Anti-Patterns to Avoid

- Writing behavior before tests (unless purely presentational).
- Mixing unrelated refactors with feature work.
- Over-mocking your own code.
- Snapshot tests for logic-heavy UI.
- Large shared “utils” dumping grounds.

---

## 12) When uncertain

- Choose the simplest interpretation.
- Write tests that document the behavior.
- Keep changes minimal and reversible.

---

## 13) Commit message

- Follow commit message convention standard