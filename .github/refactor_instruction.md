# Copilot Instructions - Memory Palace Project

## Objective

Refactor the entire **Memory Palace project** following clean architecture and offline-first best practices:

- Modular, scalable, and testable
- Offline-first with two-way sync (local ↔ backend)
- Fully reactive UI using **TanStack Query**
- Clear separation of concerns between repository, service, hooks, and API layers

---

## Architecture Layers

### 1. Repository Layer

- Handle **local database operations only** (Drizzle SQLite + sync queue)
- CRUD methods: `getAll`, `getById`, `upsert`, `delete`
- No business logic or API calls
- Transactions allowed for single-entity updates

### 2. Service Layer

- Orchestrates business logic and multi-entity operations
- Handles **two-way sync**: uploads unsynced local changes and downloads backend updates
- Calls repository for local DB and API layer for remote operations
- Performs conflict resolution using timestamps (`updated_at`)
- Exposes simple methods for hooks (`getAll`, `sync`, `addOrUpdate`)

### 3. API Layer

- Contains all **remote/backend calls**, organized by entity (`lessonProgress.ts`, `memoryPalace.ts`, etc.)
- Repositories never call API directly; services call API
- Should return strongly typed results

### 4. Hooks Layer

- Uses **TanStack Query** (`useQuery`, `useMutation`) for reactive UI
- Only call service methods; no direct DB or API logic
- Manage caching, query keys, and invalidation

### 5. UI Layer (Pages / Components)

- Only consume hooks
- Do not call repository or service methods directly

---

## Offline-First and Sync Rules

1. Always read/write to local DB first
2. Track local changes in a sync queue (`create`, `update`, `delete`)
3. Two-way sync:
   - Upload queued changes to backend
   - Fetch backend updates since last sync
   - Merge into local DB with conflict resolution

4. Trigger sync automatically on app start, resume, or network reconnect
5. Failed syncs retry automatically; local changes never lost

---

## Folder / File Structure (all under `src`)

```
/src
  /app               # Expo App Router pages and layouts
  /components        # Reusable UI components
  /contexts          # Global state contexts
  /hooks             # Custom hooks using TanStack Query
  /repositories      # Local DB CRUD + sync queue (Drizzle SQLite)
  /services          # Business logic, orchestration, two-way sync
  /api               # Remote API calls, organized by entity
  /types             # TypeScript types for domain, API, and local DB
  /utils             # Utility functions
```

- Repository class names: `<Entity>Repository`
- Service class names: `<Entity>Service`
- Hook names: `use<Entity>`
- API files: `<entity>.ts` (e.g., `lessonProgress.ts`, `memoryPalace.ts`)

---

## Refactor Rules

1. Repositories only handle local DB + sync queue
2. Service layer handles business logic, multi-entity orchestration, and two-way sync
3. Hooks only call service methods and manage TanStack Query state
4. UI pages consume hooks only; do not call service or repository directly
5. Implement last-write-wins conflict resolution using timestamps
6. Batch large sync queues for performance
7. Ensure UI reacts to sync updates by invalidating queries

---

## Testing Guidelines

- Unit test **repositories** independently (local DB logic)
- Unit test **services** for sync, orchestration, and business rules
- Test hooks for reactive UI behavior with mocked services
- Keep sync queue logic modular for easy extension to new entities

---

## Copilot Instructions

When refactoring:

1. Split all existing repository + hook logic into **repository → service → hook** layers
2. Keep offline-first DB operations functional
3. Implement **two-way sync** with conflict resolution
4. Update hooks to use **TanStack Query** for reactivity
5. Keep UI pages unchanged, only update hook interfaces if needed
6. Use **TypeScript types** consistently for API responses, local DB, and domain models
7. Place API calls in `/src/api` files by entity, never call API from repository directly
8. Service layer should orchestrate sync, merge, and conflict resolution
