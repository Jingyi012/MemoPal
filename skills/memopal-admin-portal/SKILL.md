---
name: memopal-admin-portal
description: Build MemoPal admin portal with feature-based structure, typed APIs, auth/role guards, and reusable Ant Design Pro CRUD components.
---

# MemoPal Admin Skill

## Mandatory rules
- Feature-first folders: `features/<domain>/{components,hooks,pages}`
- Keep page entry files thin
- API calls only in `src/api/*`
- No direct axios/fetch in UI pages

## Auth/roles
- Enforce auth + admin route guards
- Handle forbidden state cleanly

## Checklist
1) type updates
2) API client update
3) hooks
4) reusable components
5) page wiring/guards
6) build check

## Validation
- `npm run build`
