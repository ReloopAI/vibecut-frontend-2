# Frontend-Backend Contract for Cloud Editor Sync

## Audience
- Backend engineers who are not familiar with this frontend codebase.
- Frontend engineers integrating cloud sync with `EditorCore`.

## Context: How the Frontend Editor Works
- Frontend editor state is managed by a singleton `EditorCore`.
- React components use `useEditor()` and read/write through editor managers.
- Local save is offline-first and remains the immediate source of truth.
- Cloud sync runs after local save and mirrors the same state to backend.

## What Backend Must Treat as Source of Truth
- `state` payload sent by frontend is the canonical editor snapshot.
- Backend stores it as opaque JSON (`state_json`) with light validation only.
- Backend must not rewrite timeline internals (track layout, element ordering, etc).

## API Base Paths
- Editor state API: `/api/editor`
- File binary API: `/api/files` (already exists)

## TypeScript Contract (Shared Shapes)

```ts
export type ISODateString = string;
export type UUID = string;

export interface EditorProjectState {
  schemaVersion: number;
  currentSceneId: string;
  metadata: {
    id: string;
    name: string;
    duration: number;
    updatedAt: ISODateString;
  };
  settings: Record<string, unknown>;
  scenes: Array<Record<string, unknown>>;
}

export interface EditorProjectListItem {
  id: UUID;
  workspaceId: string;
  ownerId: number;
  name: string;
  version: number;
  updatedAt: ISODateString;
  createdAt: ISODateString;
}

export interface ListEditorProjectsResponse {
  items: EditorProjectListItem[];
  total: number;
}

export interface GetEditorProjectResponse {
  id: UUID;
  workspaceId: string;
  ownerId: number;
  name: string;
  version: number;
  state: EditorProjectState;
  updatedAt: ISODateString;
  createdAt: ISODateString;
}

export interface PutEditorProjectRequest {
  name: string;
  baseVersion: number;
  state: EditorProjectState;
  assetFileIds: UUID[];
  clientRequestId?: string;
}

export interface PutEditorProjectResponse {
  id: UUID;
  version: number;
  updatedAt: ISODateString;
}

export interface VersionConflictResponse {
  error: "VERSION_CONFLICT";
  message: string;
  serverVersion: number;
  serverUpdatedAt: ISODateString;
}
```

## Endpoint Details

### `GET /api/editor/projects`
Purpose:
- Load project picker and recent projects list.

Query:
- `offset` default `0`
- `limit` default `20`, max `100`
- `search` optional

Returns:
- `200` with `ListEditorProjectsResponse`

### `GET /api/editor/projects/:id`
Purpose:
- Open project on app load or after conflict.

Returns:
- `200` with `GetEditorProjectResponse`
- `404` if not in workspace

### `PUT /api/editor/projects/:id`
Purpose:
- Autosave cloud snapshot with optimistic concurrency.

Request:
- `PutEditorProjectRequest`

Returns:
- `200` with `PutEditorProjectResponse`
- `409` with `VersionConflictResponse` when `baseVersion` mismatches current
- `400` invalid body
- `401` invalid auth
- `404` project/workspace not found
- `413` payload too large

## Required Backend Semantics

### Optimistic concurrency
- Compare `baseVersion` with current server `version`.
- If equal: write state and increment version atomically.
- If different: reject with `409 VERSION_CONFLICT`.

### Idempotency (recommended)
- Respect `clientRequestId` for repeated retries of the same autosave.
- If same `(projectId, clientRequestId)` is seen again, return prior success response.

### Transaction behavior
- `PUT` should run in one transaction:
1. Read current row with lock.
2. Validate `baseVersion`.
3. Update `name`, `state_json`, `version`, `updated_at`.
4. Upsert `editor_project_assets` from `assetFileIds` (if implemented).

## File Service Integration (`/api/files`)

### Frontend upload sequence
1. User adds media file in editor.
2. Frontend calls existing `POST /api/files` with filename/contentType/size.
3. Frontend uploads binary to returned `uploadUrl`.
4. Frontend stores returned `file.id` in timeline element (`fileId`).
5. Next autosave sends `assetFileIds` including that `fileId`.

### Backend expectations
- Do not add editor-specific binary upload endpoint.
- Validate `assetFileIds` belong to same workspace (strongly recommended).
- Keep editor API and file API responsibilities separate.

## Frontend Sync Lifecycle (Backend Should Support)

### A) Open project
1. Frontend requests `GET /api/editor/projects/:id`.
2. Frontend hydrates `EditorCore` from `state`.
3. Frontend stores returned `version` as `remoteVersion`.

### B) Autosave success path
1. Local save completes.
2. Frontend builds snapshot from `EditorCore`.
3. Frontend calls `PUT` with `baseVersion = remoteVersion`.
4. Backend returns new `version`.
5. Frontend updates `remoteVersion`.

### C) Autosave conflict path
1. Frontend sends `PUT`.
2. Backend returns `409 VERSION_CONFLICT`.
3. Frontend fetches latest `GET /api/editor/projects/:id`.
4. Frontend prompts user: keep local or use server.
5. Frontend resolves by re-saving chosen state with latest `baseVersion`.

## Non-Functional Requirements
- P95 `PUT` latency target: under 300ms for normal payloads.
- Support bursty autosave traffic (same project every few seconds).
- Enforce per-user/workspace rate limiting without breaking normal autosave.

## Validation Rules (Minimum)
- `name`: required, string, max 255
- `baseVersion`: required, integer, `>= 0`
- `state.schemaVersion`: required integer
- `state.scenes`: required array
- `assetFileIds`: required array (can be empty), each UUID format

## Error Format (Consistent Across Endpoints)
```json
{
  "error": "SOME_ERROR_CODE",
  "message": "Human-readable message"
}
```

Conflict is the only error that must include extra fields:
```json
{
  "error": "VERSION_CONFLICT",
  "message": "Project has a newer version on server",
  "serverVersion": 10,
  "serverUpdatedAt": "2026-02-09T16:02:00.000Z"
}
```

## Backend Test Cases (Must Implement)
1. Auth required: all `/api/editor/*` return `401` without valid JWT.
2. Workspace isolation: project from another workspace returns `404`.
3. Create/update path: `PUT` creates new and increments version on subsequent saves.
4. Conflict path: stale `baseVersion` returns deterministic `409`.
5. Payload validation: malformed `state` returns `400`.
6. Payload size limit: oversized request returns `413`.
7. File reference check: invalid cross-workspace `assetFileId` rejected.
8. Idempotent retry (if enabled): duplicate `clientRequestId` returns same result.

## Copy/Paste Prompt for Backend Agent
```text
Use these two specs as the source of truth:
- project-management/04a-editor-backend-spec.md
- project-management/04b-editor-frontend-backend-contract.md

Implement `/api/editor` for cloud project sync with optimistic concurrency.
Important: frontend editor state is an opaque JSON snapshot from EditorCore; do not rewrite timeline internals.

Build:
1) Migrations:
   - editor_projects
   - editor_project_assets (recommended)
2) Endpoints:
   - GET /api/editor/projects
   - GET /api/editor/projects/:id
   - PUT /api/editor/projects/:id
3) Validation and error shapes exactly as documented.
4) Workspace isolation + JWT auth on every endpoint.
5) Integration with existing /api/files via file references only.
6) Integration tests for auth, tenancy, concurrency conflict, validation, and size limits.

Return:
- Migration files
- Route handlers
- Validation schemas
- Tests
- Short implementation notes for frontend consumers
```
