---
name: memopal-mobile-expo
description: Build and maintain MemoPal Expo mobile app with strict offline-first architecture (hook -> service -> repository), SQLite/Drizzle consistency, and UI patterns aligned to existing screens.
---

# MemoPal Mobile (Expo) Skill

Use this skill when implementing features in this repo.

## Mandatory rules
- UI -> hook -> service -> repository -> db/api
- No direct repository/db in screens
- Local-first writes + sync after
- Keep TS types aligned with backend DTOs

## Checklist
1) types
2) repository
3) service
4) hook
5) screen/component
6) query invalidation
7) offline behavior sanity

## Validation
- `npx expo-doctor`
- verify affected flows end-to-end
