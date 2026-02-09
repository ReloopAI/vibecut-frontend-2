# Cloud Sync for Projects and Assets

## Goal
Provide reliable sync of project state and media assets across devices/accounts.

## User Stories
- As a logged-in user, I want my projects available on another device.
- As a user, I want large media files to upload reliably and resume when interrupted.
- As a user, I want local edits to sync automatically without losing data.

## Scope
- Sync project JSON snapshots to backend storage.
- Sync media assets to object storage.
- Add conflict handling and sync status UI.
- Keep offline-first local save as primary immediate write path.

## Data Model (Proposed)
- `projects` table: `id`, `user_id`, `name`, `project_json`, `version`, timestamps.
- `project_media` table: `project_id`, `asset_id`, `storage_key`, `checksum`, `size`, `mime`, timestamps.

## Technical Plan
1. Backend API
- `GET /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id` (optimistic concurrency)
- `POST /api/projects/:id/media/presign`

2. Client Sync Service
- Hook into existing autosave flow after local save success.
- Queue sync tasks (project snapshot, then missing media uploads).
- Retry with backoff when offline/errors occur.

3. Upload Strategy
- Use presigned multipart uploads for large files.
- Track checksum to avoid re-upload unchanged assets.

4. Conflict Strategy (v1)
- Version-based conflict detect.
- If conflict, fetch latest and prompt user to choose local or remote.

## Acceptance Criteria
- Logged-in user can create project on device A and open on device B.
- Media assets referenced by timeline are available after sync completes.
- Failed uploads retry automatically and expose status.
- No loss of local data when cloud is unavailable.

## Risks and Mitigations
- Risk: Cost and latency for large asset storage.
- Mitigation: Incremental uploads, dedupe by checksum, optional upload limits.
- Risk: Conflict complexity.
- Mitigation: Start with simple version conflict policy before merge logic.

## Deliverables
- DB schema migrations and API endpoints.
- Client cloud sync manager integrated with save lifecycle.
- Sync status indicators and error recovery UX.
