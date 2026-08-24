---
name: react-native-app
description: Build, refactor, and debug the MemoPal Expo React Native application in `apps/mobile`. Use for Expo Router screens, playful UI, TanStack Query server state, authentication, notifications, and typed API integration.
---

# MemoPal Expo Frontend

## Work in the monorepo

- Treat the repository root as the command root.
- Keep mobile code and Expo configuration under `apps/mobile`.
- Run `npm run dev:mobile` for development and `npm run check:mobile` before handoff.

## Follow the architecture contract

- Keep routes in `apps/mobile/src/app`, reusable UI in `src/components`, screen composition in `src/screens`, and feature hooks in `src/hooks`.
- Keep backend calls behind typed API modules in `src/core/api` or the relevant feature API directory.
- Use TanStack Query as the owner of remote server state, invalidation, optimistic updates, and request caching.
- Do not introduce a local SQLite entity replica, mutation outbox, conflict resolver, or background synchronization engine.
- Use SecureStore for credentials and tokens. Use small key-value persistence only for preferences, drafts, and recoverable active-session state.

## Routing and providers

- Add routes through Expo Router's file-based routing under `src/app`.
- Update `src/app/_layout.tsx` only when a feature needs global providers or startup behavior.
- Preserve provider order unless the change explicitly requires a lifecycle adjustment.

## API and authentication

- Reuse the shared Axios client; do not create duplicate HTTP clients.
- Respect `EXPO_PUBLIC_API_BASE_URL` and the checked-in environment examples.
- Keep the session flow consistent with the shared authentication context and SecureStore adapter.

## UI quality

- Prefer playful, accessible interactions with clear hierarchy and age-inclusive language.
- Reuse design tokens and components before introducing screen-local variants.
- Keep Memory Palace and Number Peg technique experiences distinct while sharing Memory Set creation, practice, and review foundations.

## Validation

- Run `npm run check:mobile` from the repository root.
- Smoke-test Expo routing when providers, routes, or native modules change.
- Report device-only checks that could not be run locally.
