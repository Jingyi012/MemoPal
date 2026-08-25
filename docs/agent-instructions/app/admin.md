# MemoPal admin portal instructions

These instructions apply to `apps/admin`, a Vite React TypeScript app using
React Router, Ant Design, Ant Design ProComponents, Axios, and TanStack Query.
Also follow the [shared application instructions](README.md).

## Source layout

```text
src/features/<domain>/pages/       feature route pages
src/features/<domain>/components/  feature-specific UI sections/forms
src/features/<domain>/hooks/       feature queries, mutations, orchestration
src/api/                            typed transport modules by backend context
src/types/                          API DTOs and shared view/request types
src/schemas/                        JSON/form validation schemas
src/auth/                            auth context and auth hooks
src/components/                     shared portal shell and reusable UI
src/navigation/                     route paths and menu definitions
src/lib/                            shared API client, query client, auth/media helpers
```

The repository still contains older route pages in `src/pages`. Do not move
all existing pages as unrelated cleanup. For new or substantially changed
work, use the feature-first layout and migrate only the files in scope.

## Required conventions

- Keep `App.tsx` focused on route composition. Add paths to
  `src/navigation/adminPaths.ts`, menu entries to `src/navigation/adminMenu.ts`,
  and route elements in the appropriate feature/page location.
- Keep pages mostly orchestration: route/page layout, query/mutation wiring,
  navigation, breadcrumbs, and composition. Move complex forms, tables,
  payload builders, and derived state into feature components/hooks/helpers.
- Put all backend calls behind `src/lib/apiClient.ts` and typed modules under
  `src/api`. Do not use Axios/fetch directly in pages or presentational
  components. Do not create a second auth-refresh client.
- Keep API DTOs and request types in `src/types` or the owning feature's typed
  module. Keep transport response-envelope handling consistent with the
  existing `ApiResponse` types.
- Use TanStack Query for server state. Query keys must be stable and scoped;
  mutation success should invalidate the affected scope and show the existing
  notification behavior. Do not duplicate server data in unrelated React
  state.
- Preserve `ProtectedRoute`, `AdminRoute`, `AuthContext`, and the existing
  refresh/session-expiry behavior. Client role checks are UX guards, not the
  authorization boundary.
- Use Ant Design/ProComponents and the existing `ConfigProvider` shell. Prefer
  `ProTable`, `ProForm`, `ModalForm`, or `DrawerForm` for data-heavy CRUD when
  their interaction model fits the page. Keep empty, loading, error, forbidden,
  and destructive-action confirmation states explicit.
- For media, use the existing media API, `ImageUploadField`, compression helper,
  and `mediaUrl` resolver. Do not upload files directly from arbitrary forms.
- For parent/child setup flows, use explicit nested routes and stable IDs in
  the URL rather than hiding multiple unrelated editors in expandable rows.

## Feature delivery checklist

1. Update `src/types` or feature contracts.
2. Add/update the typed module under `src/api`.
3. Add/update feature query and mutation hooks.
4. Extract reusable form/table sections into feature components.
5. Wire the page, route path, menu, and auth/role guard as needed.
6. Verify invalidation, notifications, media URLs, and forbidden behavior.

## Validation

From the repository root:

```powershell
npm run check:admin
```

The admin check runs the TypeScript/Vite build and ESLint. Run backend unit or
integration tests too when the UI change depends on a changed API contract.
