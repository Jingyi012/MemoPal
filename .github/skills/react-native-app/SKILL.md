---
name: react-native-app
description: Build, refactor, and debug the MemoPal Expo React Native frontend in `MemoPal/`. Use when working on App Router screens, NativeWind UI components, React Query hooks, service/repository/API layers, offline-first SQLite plus sync queue behavior, auth/session flow, notifications, or frontend API integration.
---

# MemoPal Expo Frontend

## Work in the right root

- Run all frontend commands from `MemoPal/` (the Expo app root).
- Keep frontend changes under `src/`, plus Expo config files in root (`app.json`, `babel.config.js`, `tsconfig.json`, etc.).

## Follow the architecture contract

- Keep UI in `src/app`, `src/screens`, and `src/components`.
- Keep hooks in `src/hooks` and call services from hooks, not repositories or API files directly.
- Keep business orchestration and sync logic in `src/services`.
- Keep local SQLite data access in `src/repositories` only.
- Keep backend calls in `src/api`.
- Keep shared types in `src/types` and align request and response shapes before wiring UI.

## Use routing and providers correctly

- Add routes using Expo Router file-based routing in `src/app`.
- Update `src/app/_layout.tsx` when a change needs global providers or app startup behavior.
- Update `src/app/(tabs)/_layout.tsx` when adding or changing bottom-tab screens.
- Preserve provider order unless the feature explicitly requires a global lifecycle change.

## Keep offline-first behavior intact

- Read and write local state through repositories first when touching data flows.
- Queue local mutations through sync utilities (`src/services/sync`) for eventual backend sync.
- Emit sync change events after successful local writes so queued work is processed.
- Preserve last-write-wins timestamp conflict handling when merging remote and local records.

## Data model changes

- Update `src/db/schema.ts` and relevant types together.
- Generate and commit corresponding SQL migration files under `src/drizzle`.
- Update seed logic in `src/db/seed.ts` when new required data is introduced.
- Verify repository upsert and save code maps booleans and timestamps consistently with SQLite column modes.

## API and auth conventions

- Reuse the shared axios client in `src/api/api.ts`; do not create duplicate clients.
- Respect `EXPO_PUBLIC_API_BASE_URL` and keep HTTPS fallback behavior.
- Keep auth token and session persistence consistent with `src/contexts/AuthProvider.tsx` and `src/services/user.service.ts`.

## UI and styling conventions

- Use NativeWind class names for most styling and shared color tokens from `src/constants/colors.ts`.
- Keep reusable pieces in `src/components`; keep screen-specific composition in `src/screens`.
- Avoid duplicating logic that already exists in hooks or utility modules.

## Validation before handoff

- Run `pnpm lint`.
- Run `pnpm exec tsc --noEmit`.
- Run `pnpm expo start --clear` for a smoke check when routing, provider setup, or native modules changed.
- Summarize what changed, what was validated, and any follow-up checks that still need a device or emulator run.
