# MemoPal engineering principles

These principles apply to every change in the repository. Use them to resolve
choices that are not already determined by the current code or the more
specific app/backend instructions.

## 1. YAGNI: build only what is needed now

- Do not implement speculative features, extension points, configuration, or
  abstractions without a current caller.
- Do not add a second implementation "for future flexibility".
- Keep future product ideas in the design plan or backlog until they become
  part of the requested work.

## 2. KISS: prefer the simplest clear solution

- Choose the smallest design that solves the current problem correctly.
- Prefer straightforward control flow over clever indirection, magic, or
  unnecessary framework layers.
- Do not introduce a new library or architectural pattern when the existing
  platform and project utilities are sufficient.

## 3. Reuse existing solutions before creating new ones

- Search the repository for an existing component, hook, API client, helper,
  handler pattern, validation rule, or test fixture before adding one.
- Reuse shared behavior when the behavior and ownership are genuinely shared.
- Do not force unrelated code into a generic abstraction just to remove a few
  duplicated lines. Duplication is preferable to the wrong abstraction.

## 4. Consistency beats personal preference

- Follow the naming, folder, formatting, error, response, authentication, and
  testing patterns already used in the surrounding code.
- When introducing a new pattern is necessary, document why and keep the
  change narrowly scoped.
- Do not mix multiple styles in one feature or rewrite neighboring code only
  to match personal taste.

## 5. Single source of truth

- Keep server state in the server-backed query/cache layer and domain rules in
  the backend/domain layer that owns them.
- Do not duplicate authorization, subscription entitlement, review scheduling,
  ownership, progress, or audit rules in a way that can drift from the server.
- Derive values from existing state instead of maintaining a second mutable
  copy when possible.

## 6. Separation of concerns

- Keep presentation, transport, orchestration, domain rules, persistence, and
  external integrations in their established layers.
- A UI component should not become an API client; a controller should not
  become a business service; a database model should not become a public DTO.
- Keep each file and function focused on one understandable responsibility.

## 7. Make the smallest safe change

- Prefer a focused, incremental diff over a broad cleanup during feature work.
- Preserve existing behavior outside the requested scope.
- Remove obsolete code only when it is demonstrably unused or the request
  explicitly includes cleanup.
- Keep changes easy to review, test, revert, and diagnose.

## 8. Correctness and security are non-negotiable

- Validate at system boundaries and fail clearly rather than silently
  accepting invalid state.
- Enforce authorization and ownership on the server, even when the client has
  already hidden the action.
- Never trust client-provided audit fields, entitlement state, user identity,
  progress results, or security-sensitive configuration.
- Do not expose secrets or private memory content in logs, analytics, errors,
  tests, fixtures, or public API responses.

## 9. Test behavior and failure paths

- Add or update tests for the behavior being changed, not merely for code
  coverage or implementation details.
- Cover the happy path plus the most relevant invalid-input, not-found,
  authorization, conflict, idempotency, or failure path.
- Keep tests deterministic and aligned with the public contract.

## 10. Explicit is better than implicit

- Prefer descriptive names, typed contracts, explicit state transitions, and
  clear error handling.
- Avoid hidden side effects, global mutable state, unexplained constants, and
  behavior that depends on call order unless the existing framework requires
  it.
- Add comments for non-obvious constraints or product decisions, not for code
  that is already clear from its name and structure.

## Decision rule

When several designs are valid, choose the one that satisfies the request with
the fewest new concepts, reuses the closest existing pattern, keeps ownership
clear, and can be removed or changed later without a large migration.
