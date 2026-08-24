---
name: dotnet-clean-architecture
description: Implementation of the Clean Architecture pattern for .NET Web APIs using Domain-Driven Design, CQRS, MediatR, EF Core, and Dependency Injection. Enforces separation of concerns, long-term maintainability, and high testability.
---

## Description

This skill provides a **standardized blueprint** for building scalable, enterprise-grade .NET Web APIs using the **Clean Architecture (Onion) pattern**.

It enforces the **Dependency Inversion Principle** so that:

- Business rules are isolated from frameworks
- Infrastructure is replaceable
- The system remains testable and maintainable over years

The architecture follows a **Core-first design**:

> Domain → Application → Infrastructure → API

Where dependencies flow **only inward**.

---

## When to Use

Use this architecture when:

### ✔ Enterprise / Long-Lived Systems
Applications expected to evolve over years with complex business logic.

### ✔ Microservices
Each service remains isolated, modular, and independently deployable.

### ✔ High Testability Requirements
Supports unit testing without database or framework dependencies.

### ✔ Frequent Technology Changes
Allows replacing DB, messaging systems, or UI without touching business logic.

---

## Keywords

.NET 8/9/10, Clean Architecture, Onion Architecture, CQRS, MediatR, DDD, EF Core, Repository Pattern, Unit of Work, Dependency Injection, FluentValidation.

---

# 1. Architectural Layers & Responsibilities

The solution is divided into four main layers:

---

## Domain Layer (Core)

### Responsibilities
- Business rules
- Entities and Value Objects
- Domain events
- Domain exceptions
- Enumerations

### Rules
- ❌ No EF Core references
- ❌ No ASP.NET references
- ❌ No Application dependencies
- ❌ No external libraries

This layer must be **pure C# business logic**.

---

## Application Layer (Core)

### Responsibilities
- Use case implementation
- CQRS handlers (Commands/Queries)
- DTOs and mapping
- Validation logic
- Interfaces for persistence/services

### Depends only on:
- Domain

### Contains:
- MediatR Handlers
- Validators
- Service abstractions
- Pipeline behaviors

---

## Infrastructure Layer

### Responsibilities
- Database access (EF Core)
- Repository implementations
- Identity integration
- Email/file services
- External APIs

### Depends on:
- Application
- Domain

This layer contains **all external dependencies**.

---

## API / Web Layer

### Responsibilities
- Controllers / Endpoints
- Authentication / Authorization
- Middleware
- Exception handling
- Dependency Injection wiring

### Depends on:
- Application
- Infrastructure

Controllers should remain **thin** and contain no business logic.

---

# 2. Recommended Solution Structure

```text
src/
├── Domain/
│   ├── Common/
│   ├── Entities/
│   ├── ValueObjects/
│   ├── Events/
│   └── Exceptions/
│
├── Application/
│   ├── Common/
│   │   ├── Interfaces/
│   │   ├── Behaviors/
│   │   └── Models/
│   ├── Features/
│   │   └── Products/
│   │       ├── Commands/
│   │       ├── Queries/
│   │       ├── DTOs/
│   │       └── Validators/
│
├── Infrastructure/
│   ├── Persistence/
│   │   ├── Configurations/
│   │   ├── Migrations/
│   │   └── ApplicationDbContext.cs
│   └── Services/
│
└── WebApi/
    ├── Controllers/
    ├── Middleware/
    └── Extensions/