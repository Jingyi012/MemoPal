---
name: memopal-backend-clean-cqrs
description: Implement backend changes with Clean Architecture + CQRS/MediatR, thin controllers, and consistent wrapped responses from application layer.
---

# MemoPal Backend Skill

## Mandatory rules
- Keep controllers thin: receive request, call `Sender.Send`, return
- Business logic in Application handlers
- Domain entities in Domain only
- Infra concerns in Infrastructure only

## API wrapper rule
- Use unified response wrapper consistently
- Response shaping belongs in Application contracts/handlers, not controller logic

## Implementation flow
1) DTO/contract
2) Command/Query + Handler
3) Interface updates
4) Infra implementation
5) Controller endpoint
6) Migration if needed

## Validation
- `dotnet build MemoPal.sln`
- ensure no business logic in controllers
