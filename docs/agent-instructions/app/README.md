# Application instructions

These rules apply to both frontend applications. Read the relevant
[`mobile.md`](mobile.md) or [`admin.md`](admin.md) for app-specific rules.
Also follow the [core engineering principles](../principles.md).

## Shared frontend conventions

- Keep route files thin. They select a screen/page and pass route parameters;
  feature logic belongs under the feature folder.
- Keep HTTP transport in API modules and keep request/response types explicit.
  UI components must not create their own Axios/fetch clients.
- Use TanStack Query for remote server state, caching, loading/error state,
  invalidation, and mutations. Do not create a local entity replica, sync
  queue, mutation outbox, or conflict resolver.
- Keep authentication/session storage in the existing app-specific auth
  adapters. Do not store access or refresh tokens in ordinary feature state.
- Reuse shared design tokens and components before adding a screen-local
  variant. Keep loading, empty, error, retry, and permission states visible.
- Treat backend responses and authorization as authoritative. Client-side
  guards improve UX but are not security boundaries.

## Cross-app API changes

When an endpoint contract changes, update the API layer first, then the
affected client API module, types, hooks, and UI. Verify both mobile and admin
consumers if they share the endpoint.

## Validation

From the repository root:

```powershell
npm run check:mobile
npm run check:admin
```

Run a production/build check for the app that changed and mention any native
device or simulator checks that were not available.
