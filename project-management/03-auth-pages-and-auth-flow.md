# Auth Pages and Backend Auth Flow

## Goal
Integrate frontend auth UX with the external backend auth API as the single auth source. Do not authenticate directly against database from frontend code.

## Decision
- Use backend REST auth endpoints under `/api/auth/*`.
- Do not use direct frontend DB auth paths for production user auth.
- Keep anonymous/local editing usable; enforce auth only for cloud/account features.

## User Stories
- As a user, I can register and log in from UI.
- As a returning user, I keep a valid session via refresh flow.
- As a user, I can access organisation/workspace data after login.
- As a product owner, cloud-only pages/actions require auth while local editor remains usable.

## Backend Contract (Current)
- `POST /api/auth/user/login`
- `POST /api/auth/user/register`
- `GET /api/auth/refresh` (refresh token cookie-based)
- `GET /api/auth/user/init`
- `GET /api/auth/user/organisation` (Bearer backend JWT)
- `GET /api/auth/user/workspaces` (Bearer backend JWT)

## Scope
### Phase 1 (implement first)
- Add auth API client module for backend routes.
- Add auth state store (token + user + loading/error state).
- Add pages:
  - `/auth/login`
  - `/auth/register`
- Implement session bootstrap:
  - on app load call `/api/auth/refresh`
  - if valid, hydrate user/token
- Add basic route guard for cloud/account routes only (not editor core local flow).

### Phase 2
- Add logout flow and token-clear behavior.
- Add auth-aware header/user menu.
- Add organisation/workspace bootstrap after login.
- Add error normalization and UI messaging from backend error shape.

### Phase 3
- Add init check (`/api/auth/user/init`) onboarding path for first admin.
- Add Google login route integration when backend mock is replaced.
- Add E2E coverage for login/refresh/guard behavior.

## Non-Goals
- Replacing local project save flow.
- Direct DB access from frontend for identity/session.
- Full RBAC/permission matrix in this phase.

## Technical Plan
1. Create `lib/auth/api-client.ts` for backend endpoints and typed response mapping.
2. Create `lib/auth/session.ts` (token memory + persistence policy + refresh logic).
3. Build auth pages/forms with validation and backend error mapping.
4. Add guarded route list for account/cloud screens.
5. Add `Authorization: Bearer <backend JWT>` injection for protected API calls.
6. Handle 401 with one refresh attempt, then force sign-in.

## Security Notes
- Keep refresh token in httpOnly cookie (backend-managed).
- Avoid storing refresh token in frontend storage.
- If access token is stored client-side, prefer short-lived in-memory storage with minimal persistence.

## Acceptance Criteria
- Register/login works end-to-end against backend API.
- Refresh flow restores session after reload when cookie is valid.
- Protected cloud/account pages redirect to login when unauthenticated.
- Organisation/workspace endpoints load successfully after auth.
- Local-only editor route remains accessible without login.

## Risks and Mitigations
- Risk: Auth guard accidentally blocks local editing.
- Mitigation: explicit protected-route allowlist; default editor paths remain public.
- Risk: Token mismatch/expiry causes noisy UX.
- Mitigation: centralized fetch wrapper with refresh-once retry policy.
- Risk: Backend error shape differences.
- Mitigation: normalize `{ status, message, statusCode }` at API client boundary.

## Deliverables
- Backend-auth-based login/register pages.
- Auth client + session/refresh handling.
- Protected routes for cloud/account features.
- Updated header/session UX and test coverage baseline.
