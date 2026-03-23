# Feature Delivery Workflow (.NET + Clean Architecture + CQRS)

## 1. Classify the change first

Use `Command` when state changes.
Use `Query` when reading only.

Decide:
- Feature name (`Features/<Feature>/...`)
- Input contract and output contract
- Domain objects touched
- Infrastructure concerns (DB, files, external APIs)

## 2. Application-first design

Start in `src/MemoPal.Application`:
- Add DTOs/contracts in `Features/<Feature>/DTOs` (or alongside command/query when small).
- Add command/query record in `Features/<Feature>/Commands` or `Queries`.
- Add handler that orchestrates business flow and returns wrapper contract.

In this codebase, prefer:
- `ApiResponse<T>.Ok(...)` / `ApiResponse<T>.Fail(...)`
- `PaginatedResponse<T>.Ok(...)` for paged lists

## 3. Domain updates

Update `src/MemoPal.Domain` only for domain concerns:
- Entities
- Value objects
- Domain logic and invariants

Do not add:
- EF Core attributes/configuration
- ASP.NET abstractions
- External service code

## 4. Infrastructure updates

Update `src/MemoPal.Infrastructure` for:
- EF Core `DbContext` / entity configuration
- Repository or service implementations
- External provider clients

If schema changed:
- Add migration with clear name
- Ensure migration compiles and can run

## 5. API endpoint wiring

Update `src/MemoPal.Api/Controllers`:
- Parse route/body/query values
- Resolve user identity via existing helper/base controller
- Call `await Sender.Send(...)`
- Return result

Keep controllers thin:
- No business branching
- No persistence access
- No manual response-wrapping rules beyond simple HTTP response mapping

## 6. Cross-cutting concerns

Ensure:
- Authorization attributes and role checks are correct
- Validation is in handler/validator or domain, not controller glue code
- Logging/error behavior stays consistent with middleware and existing patterns

## 7. Testing strategy

Prefer:
- Unit tests for handler/domain rules
- Integration tests for endpoint + persistence flow

Test at least:
- Happy path
- Not found / invalid input
- Authorization boundary when endpoint is protected

## 8. Definition of done

The change is done when all are true:
- Layer boundaries are respected
- Build and tests pass
- Migrations are included (if needed)
- Endpoint behavior and response shape are consistent
- No controller business logic creep
