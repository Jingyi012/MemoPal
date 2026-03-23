---
name: dotnet-clean-cqrs-mediatr-delivery
description: Deliver backend features in .NET using Clean Architecture, CQRS, and MediatR with strict layer boundaries. Use when adding or changing endpoints, commands, queries, handlers, DTOs, domain entities, persistence, DI wiring, or tests in Api/Application/Domain/Infrastructure solutions, especially when controllers must stay thin and response wrappers must be produced in the Application layer.
---

# .NET Clean CQRS Delivery

Implement backend work in this order:
1. Define request and response contracts in `Application`.
2. Implement command/query + MediatR handler in `Application`.
3. Add or update domain behavior in `Domain` (no infrastructure dependencies).
4. Add or update persistence and external integrations in `Infrastructure`.
5. Keep controller endpoints thin in `Api` and delegate with `Sender.Send(...)`.
6. Add or update tests, then run quality gates.

Follow these non-negotiable rules:
- Keep business logic in handlers and domain entities, never in controllers.
- Keep dependencies flowing inward (`Api -> Application -> Domain`, `Infrastructure -> Application/Domain`).
- Return API wrappers from handlers/application contracts (`ApiResponse<T>`, `PaginatedResponse<TItem>` in this repo).
- Keep user/authorization checks server-authoritative and centralized in handlers/services.
- Keep each feature grouped under `Application/Features/<Feature>/Commands|Queries|DTOs`.

Use the references for concrete execution:
- For end-to-end implementation flow: [references/feature-delivery-workflow.md](references/feature-delivery-workflow.md)
- For code scaffolds and naming patterns: [references/code-templates.md](references/code-templates.md)
- For verification and done criteria: [references/quality-gates.md](references/quality-gates.md)
