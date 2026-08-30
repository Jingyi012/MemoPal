# MemoPal backend instructions

These instructions apply to `apps/api`, the ASP.NET Core API using .NET 10,
C#, MediatR/CQRS, EF Core, PostgreSQL/Npgsql, and Clean Architecture.
Also follow the [core engineering principles](../principles.md).

## Solution layout

```text
src/MemoPal.Domain/          entities, invariants, value/domain primitives
src/MemoPal.Application/     commands, queries, handlers, DTOs, interfaces
src/MemoPal.Infrastructure/  EF Core, migrations, storage, auth integrations
src/MemoPal.Api/             controllers, middleware, options, composition root
tests/MemoPal.UnitTests/     domain/application/unit tests
tests/MemoPal.IntegrationTests/ endpoint and persistence-flow tests
```

Dependencies point inward: `Api -> Application -> Domain`; Infrastructure
implements Application/Domain-facing abstractions and may depend on both.

## Required architecture rules

- Put each use case under `Application/Features/<Feature>/Commands`, `Queries`,
  and `DTOs` as appropriate. Commands change state; queries read state.
- A handler orchestrates the use case, authorization/ownership checks, domain
  operations, persistence, and DTO mapping. Keep business rules out of
  controllers.
- Controllers parse HTTP input, resolve the current user using existing
  helpers, dispatch with `Sender.Send(...)`, and return the result. They must
  not access EF Core, call external providers, or implement business branches.
- Keep `Domain` free of ASP.NET, EF Core, MediatR, and infrastructure concerns.
  Put persistence mappings and external providers in `Infrastructure`.
- Define application-facing abstractions in
  `Application/Common/Interfaces`; implement them in Infrastructure. Reuse
  `IAppDbContext` and existing services before introducing a repository layer.
- Use the existing response contracts (`ApiResponse<T>` and
  `PaginatedResponse<T>`/`PagedResult` as applicable in the current feature).
  Response shaping belongs in Application handlers/contracts, not ad hoc
  controller wrappers.
- Keep authorization server-authoritative. Every user-owned read and mutation
  must scope data to the authenticated user; admin operations must use the
  existing role/authorization conventions.
- Use UTC for timestamps and preserve audit metadata. The current
  `AppDbContext.ApplyAuditMetadata()` is the central audit hook; do not stamp
  audit values repeatedly in handlers or accept them from public DTOs.
- Use soft-delete and filtered uniqueness consistently with the existing entity
  model. A schema/model change requires an EF migration and tests.
- Practice-attempt writes are append-oriented and use client attempt identity
  for idempotency. Review scheduling and entitlements remain server-owned.

## Feature delivery workflow

1. Inspect the existing controller, feature handler, entity, DTO, client caller,
   and tests.
2. Define/update the Application request and response contracts.
3. Add/update the command/query and handler.
4. Update Domain entities/invariants only when the rule belongs there.
5. Update Infrastructure persistence, external service code, and migrations if
   required.
6. Add the thin API endpoint and authorization attributes.
7. Update client contracts if the response/request changed.
8. Add a happy-path test and relevant failure/ownership/idempotency tests.

## Naming and placement

- Commands use imperative names such as `CreateMemorySetCommand` or
  `UpdateUserSubscriptionCommand`.
- Queries use read names such as `GetMemorySetQuery`, `GetMemorySetsQuery`, or
  `GetPagedBadgeDefinitionsQuery`.
- Keep file and primary type names aligned. Prefer immutable records for
  request/response DTOs when consistent with the surrounding feature.
- Keep cross-feature primitives in `Application/Common`; do not create a
  catch-all feature folder for unrelated behavior.

## Database and migration rules

- Do not edit an existing migration to change an already-created schema.
  Create a new descriptive migration unless the local baseline is explicitly
  being regenerated as a deliberate pre-production operation.
- Use the configured startup migration behavior and verify that application
  startup does not serve against a failed/partially compatible schema.
- Avoid exposing database entities directly from controllers. Map to DTOs and
  exclude internal audit/credential fields from public contracts.

## Validation

From the repository root:

```powershell
dotnet build MemoPal.slnx
dotnet test apps/api/tests/MemoPal.UnitTests/MemoPal.UnitTests.csproj
dotnet test apps/api/tests/MemoPal.IntegrationTests/MemoPal.IntegrationTests.csproj
```

Run integration tests for endpoint, authorization, persistence, migration, or
response-contract changes. For schema changes, create/update the migration
with the API startup project and rebuild afterward.
