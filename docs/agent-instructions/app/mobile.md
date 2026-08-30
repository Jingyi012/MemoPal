# MemoPal mobile app instructions

These instructions apply to `apps/mobile`, an Expo SDK 54 React Native app
using Expo Router, TypeScript, NativeWind, Axios, and TanStack Query. Also
follow the [shared application instructions](README.md).

## Source layout

```text
src/app/                  Expo Router route adapters only
src/features/<feature>/   feature screens, components, hooks, APIs, types
src/core/                 cross-feature infrastructure and shared contracts
src/components/           genuinely reusable UI components
src/contexts/              app-wide providers and user/session state
src/constants/             shared product constants and theme values
src/utils/                 small cross-cutting utilities
```

Current feature areas include `auth`, `gamification`, `home`, `library`,
`memory-composer`, `memory-sets`, `notifications`, `number-peg`, `onboarding`,
`palace-scenes`, `practice-attempts`, `profile`, `referral`, `subscription`,
`support`, and `tutorial`.

## Required conventions

- Add navigation under `src/app` using file-based Expo Router routes. Route
  files should import a feature screen from its feature `index.ts` or module
  entry and avoid owning business logic.
- Put new feature code in `src/features/<feature>`. Prefer the existing
  `screens`, `components`, `hooks`, `api`, `types`, and `utils` vocabulary.
  Do not add feature-specific code to `src/components`, `src/core`, or
  `src/utils` just because those folders are convenient.
- Use `src/core/api/apiClient.ts` for HTTP transport. Feature API modules such
  as `src/features/memory-sets/api/memorySet.api.ts` define endpoint calls and
  types; they do not create duplicate Axios clients.
- Use TanStack Query hooks for server data and mutations. Invalidate the
  smallest affected query scope after a successful mutation and surface
  server errors instead of silently replacing them with local state.
- Use SecureStore through the existing auth services for credentials/tokens.
  AsyncStorage is for the existing small user-state, preference, draft, and
  recoverable-session uses; it is not a database.
- Keep `src/app/_layout.tsx` provider order stable. Only add global providers
  or startup work there when the behavior is genuinely app-wide.
- Keep Palace and Number Peg experiences distinct while sharing the common
  memory-set, practice-attempt, and review contracts.
- Respect `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_STRICT_BASE_URL`, and the
  checked-in `apps/mobile/.env.example`. Do not hard-code a new environment
  URL in a feature.
- Preserve accessibility: usable text scaling, logical screen-reader order,
  non-color-only feedback, reduced-motion behavior, and touch targets of at
  least 44 points for new interactions.

## Service versus API modules

Use `api/` for typed HTTP endpoint calls. Use `services/` for local or
side-effect integrations such as SecureStore session handling, notification
scheduling, avatar handling, and session recovery. Do not add a service that
only forwards an API call; put that call in the feature API module and expose
it through a query/mutation hook.

## Feature delivery checklist

1. Check the route and feature module that own the flow.
2. Add/update types and the feature API module.
3. Add/update the TanStack Query hook and query keys.
4. Compose the screen from feature components.
5. Add loading, empty, error, retry, permission, and session-expiry behavior.
6. Verify auth, user switching, and cache invalidation when relevant.

## Validation

From the repository root:

```powershell
npm run check:mobile
```

Smoke-test Expo Router and native modules when routes, providers, storage,
notifications, or platform-specific code changes. Report device-only checks
that were not run.
