# Add Auth Pages and Auth Flow

## Goal
Enable optional account login/signup UX so users can authenticate for cloud features.

## User Stories
- As a user, I want to sign up/sign in with email and password.
- As a returning user, I want session persistence across visits.
- As a product owner, I want routes that require account features to enforce auth.

## Scope
- Add auth screens (Sign In, Sign Up, optional Forgot Password).
- Wire screens to existing Better Auth endpoints (`/api/auth/[...all]`).
- Add protected route handling for account-required pages.
- Add user menu/session indicator in app shell.

## Technical Plan
1. Build pages under `apps/web/src/app` (for example `/sign-in`, `/sign-up`).
2. Use `signIn`, `signUp`, `useSession` from `apps/web/src/lib/auth/client.ts`.
3. Add route guard strategy:
   - Middleware for protected paths, or
   - Server checks at page/layout level.
4. Define post-login redirect target and logout behavior.
5. Add form validation, loading, and error states.

## Acceptance Criteria
- New users can create account from UI.
- Existing users can log in and maintain session.
- Protected routes redirect unauthenticated users to sign-in.
- Auth errors display clear, actionable messages.

## Risks and Mitigations
- Risk: Breaking existing anonymous/local-only editing flow.
- Mitigation: Keep editor usable without auth unless cloud-only actions are triggered.

## Deliverables
- Auth screens and route protection.
- Updated navigation/session UI.
- Basic auth E2E tests.
