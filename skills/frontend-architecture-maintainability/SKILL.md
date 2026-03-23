---
name: frontend-architecture-maintainability
description: Frontend maintainability and feature-structure guardrails for React + TypeScript admin apps. Use when implementing or refactoring pages/components/hooks/APIs to enforce separation of concerns, route-driven setup flows, reusable form/upload patterns, query and mutation boundaries, and scalable folder architecture.
---

# Frontend Architecture Maintainability

Apply this skill when building or refactoring frontend features to keep code modular and easy to evolve.

## Workflow

1. Map the current user flow and route hierarchy before editing UI.
2. Split responsibilities into dedicated layers:
- `pages/`: route-level orchestration and composition only.
- `components/`: reusable UI sections and form parts.
- `hooks/`: data-fetching, mutations, and derived state logic.
- `api/`: backend transport only.
- `types/`: request/response contracts and form types.
3. Keep each file focused on one concern; move payload builders and mappers to helper files.
4. Prefer nested routes over tabs/expand-row patterns when entities have parent-child setup dependencies.
5. Run validation (`eslint`, build, and relevant backend tests) after structural changes.

## Required Rules

- Avoid monolithic route pages; route pages compose sections and hooks, not implementation details.
- Avoid mixing transport concerns (axios calls) inside UI components.
- Avoid storing unrelated entities in one file.
- Prefer route-driven flow for setup dependencies:
- parent list page
- parent details page
- child configuration page
- Use reusable input components for repeated patterns (for example image upload and relation selectors).
- If order matters, implement explicit ordering UX (drag-and-drop + persisted position updates).

## Validation Checklist

- Does each page file stay mostly orchestration?
- Are API contracts centralized in `types/` and `api/`?
- Are create/edit forms isolated and reusable?
- Is parent-child navigation clear from URL routes?
- Are lint/build checks passing?

For detailed folder conventions, naming rules, and anti-patterns, read `references/frontend-rules.md`.
