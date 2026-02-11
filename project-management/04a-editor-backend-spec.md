# Editor Backend API Spec (`/api/editor`)

## Purpose
Provide a backend contract for storing and syncing editor project state (timeline, scenes, settings, metadata).

## Scope
- Persist editor state as JSON snapshots.
- Support optimistic concurrency for autosave sync.
- Support project listing and retrieval across devices.

## Out of Scope (v1)
- Real-time collaborative editing.
- Server-side timeline merge.
- Asset transcoding.

## Auth and Tenancy
- All endpoints require `Authorization: Bearer <JWT>`.
- All reads/writes are scoped to the authenticated user and workspace context.
- Return `401` when JWT/context is invalid.
- Return `404` when project does not exist in the caller workspace.

## Data Model

### `editor_projects`
- `id` UUID PK
- `workspace_id` string not null
- `owner_id` bigint/int not null
- `name` string(255) not null
- `state_json` JSONB not null
- `version` bigint not null default `1`
- `created_at` timestamptz not null
- `updated_at` timestamptz not null
- `deleted_at` timestamptz nullable

Indexes:
- `(workspace_id, updated_at desc)`
- `(workspace_id, owner_id, updated_at desc)`
- Optional GIN on `state_json` if querying inside JSON is needed later.

## Project State Envelope (stored in `state_json`)
Use a versioned envelope so backend can validate shape at a high level while keeping timeline details client-owned.

```json
{
  "schemaVersion": 3,
  "currentSceneId": "scene_main",
  "metadata": {
    "id": "proj_123",
    "name": "My Project",
    "duration": 42.5,
    "updatedAt": "2026-02-09T16:00:00.000Z"
  },
  "settings": {},
  "scenes": []
}
```

Validation (v1):
- `schemaVersion` required integer.
- `scenes` required array.
- JSON payload size limit: recommend `<= 5 MB` (return `413` if exceeded).
- Backend should not mutate timeline internals except metadata timestamps/version fields it owns.

## API Contract

Base path: `/api/editor`

### 1) List Projects
`GET /api/editor/projects?offset=0&limit=20&search=my`

Query:
- `offset` optional int `>= 0`, default `0`
- `limit` optional int `1..100`, default `20`
- `search` optional string (name contains)

Response `200`:
```json
{
  "items": [
    {
      "id": "uuid",
      "workspaceId": "ws_123",
      "ownerId": 1,
      "name": "My Project",
      "version": 8,
      "updatedAt": "2026-02-09T16:00:00.000Z",
      "createdAt": "2026-02-08T16:00:00.000Z"
    }
  ],
  "total": 1
}
```

### 2) Get Project
`GET /api/editor/projects/:id`

Response `200`:
```json
{
  "id": "uuid",
  "workspaceId": "ws_123",
  "ownerId": 1,
  "name": "My Project",
  "version": 8,
  "state": {},
  "updatedAt": "2026-02-09T16:00:00.000Z",
  "createdAt": "2026-02-08T16:00:00.000Z"
}
```

Errors:
- `404` project not found in workspace

### 3) Upsert Project State (Optimistic Concurrency)
`PUT /api/editor/projects/:id`

Request:
```json
{
  "name": "My Project",
  "baseVersion": 8,
  "state": {},
  "clientRequestId": "optional-idempotency-key"
}
```

Rules:
- If project does not exist, allow create when caller has write access. New record starts at `version = 1`.
- If project exists, `baseVersion` must equal current `version`.
- On success, increment version by 1 (or set to 1 for create), set `updated_at = now()`.
- If `baseVersion` mismatch, return conflict.

Success `200`:
```json
{
  "id": "uuid",
  "version": 9,
  "updatedAt": "2026-02-09T16:00:00.000Z"
}
```

Conflict `409`:
```json
{
  "error": "VERSION_CONFLICT",
  "message": "Project has a newer version on server",
  "serverVersion": 10,
  "serverUpdatedAt": "2026-02-09T16:02:00.000Z"
}
```

Validation errors:
- `400` invalid payload
- `413` payload too large

## Sync and Conflict Behavior (Client Contract)
- Client reads project `version` from `GET /api/editor/projects/:id`.
- Autosave sends `PUT` with `baseVersion`.
- On `409`, client fetches latest server project and prompts user: keep local or server (v1 policy).
- Do not silently overwrite newer server versions.

## Security and Limits
- Enforce workspace isolation on every query.
- Validate project ownership or workspace role before writes.
- Rate limit write endpoint (`PUT`) to protect autosave storms.
- Sanitize/validate `name` length and UTF-8 validity.

## Observability
- Log structured fields: `workspaceId`, `projectId`, `userId`, `version`, `status`, latency.
- Emit metrics:
- `editor_api_put_success_total`
- `editor_api_put_conflict_total`
- `editor_api_put_validation_error_total`
- `editor_api_payload_bytes`

## Suggested Backend Tasks
1. Add DB migration for `editor_projects`.
2. Implement `GET /api/editor/projects`.
3. Implement `GET /api/editor/projects/:id`.
4. Implement `PUT /api/editor/projects/:id` with optimistic concurrency transaction.
5. Add request/response validation schema and shared error format.
6. Add integration tests for auth, tenancy, conflict, payload size, and create/update flows.

## Acceptance Criteria
- Project created on device A appears in list on device B.
- Autosave updates increase `version` monotonically.
- Concurrent writes produce deterministic `409` conflict responses.
- Unauthorized cross-workspace access is blocked.
