# Clean Up Repo and Remove Home Page

## Goal
Reduce surface area for the initial release by removing the public marketing/home page and keeping only product-critical routes.

## User Stories
- As a product owner, I want only core editor routes enabled so maintenance burden is lower.
- As a developer, I want a simplified app structure so new features are easier to ship.
- As a user, I want to land directly on the app flow instead of a marketing page

## Scope
- Remove or deprecate current home page route (`/`).
- Redirect `/` to the primary product entry point (`/projects`).
- Remove non-product marketing/content routes from app runtime:
  - `/blog`
  - `/blog/[slug]`
  - `/contributors`
  - `/roadmap`
  - `/sponsors`
  - `/rss.xml`
- Remove unused landing-page components/assets tied only to home page.
- Update header/footer links to avoid removed pages.
- Update sitemap entries to include only active product/legal routes.

## Technical Plan
1. Identify root route implementation under `apps/web/src/app/page.tsx` (or equivalent).
2. Replace with server redirect using Next.js `redirect()`.
3. Remove non-product routes and related content modules.
4. Remove dead UI blocks/components no longer referenced.
5. Update header/footer links that still point to removed sections.
6. Update sitemap and route metadata to avoid deleted pages.
7. Run lint/build and smoke test key routes.

## Acceptance Criteria
- Visiting `/` redirects to chosen product entry route.
- Visiting removed marketing routes returns `404`.
- No broken imports from removed home-page files.
- No dead links in top-level navigation.
- Build succeeds without route-level errors.

## Risks and Mitigations
- Risk: Breaking SEO or legal content discoverability.
- Mitigation: Keep explicit routes for `/privacy`, `/terms`, etc.

## Deliverables
- PR removing home page and related dead files.
- Short migration note in README/changelog.
