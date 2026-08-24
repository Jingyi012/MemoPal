# Frontend Rules Reference

## Folder Blueprint

Use feature-first structure:

- `src/features/<feature>/pages/*Page.tsx`: route pages only
- `src/features/<feature>/components/*`: UI sections and form widgets
- `src/features/<feature>/hooks/*`: query/mutation and local orchestration logic
- `src/api/*`: transport clients per bounded context
- `src/types/*`: DTOs, request contracts, and shared view models

## Page Boundaries

A page should:
- read route params
- wire query/mutation hooks
- compose section components
- handle navigation and breadcrumbs

A page should not:
- contain long inline forms for multiple unrelated entities
- contain direct axios logic
- duplicate mapping/normalization utilities

## Component Boundaries

Section components should:
- own one domain section (example: `LocationsSetupCard`)
- encapsulate local modal state
- expose callbacks for parent refresh

Shared form widgets should:
- be stateless where possible
- receive `value` and `onChange`
- avoid backend-specific branching

## Query and Mutation Rules

- Use stable query keys and invalidate by scope.
- Keep mutation success handlers minimal: toast + invalidate.
- Centralize payload builders in `forms.ts` or `mappers.ts`.

## Route Design Rules

For dependency chains, use nested routes:

- `/content/palaces`
- `/content/palaces/:palaceId`
- `/content/palaces/:palaceId/lessons/:lessonId`

This keeps setup flow explicit and prevents hidden expandable UIs from becoming unmaintainable.

## Upload Pattern

- Use a dedicated upload API endpoint.
- Wrap uploader in a reusable field component.
- Store returned server path and render preview using a resolver helper.

## Ordering Pattern

- Use drag-and-drop table for user ordering.
- Keep draft order locally.
- Persist only changed positions.
- Provide `Save Order` and `Reset` actions.

## Anti-Patterns To Avoid

- One giant page managing all entities.
- Tabs used as workaround for route architecture.
- Expand-row CRUD for deep dependencies.
- URL text fields for media where upload should be controlled.
- Duplicate form and payload mapping logic in multiple files.
