# MemoPal Backend - Quick Reference Guide

## Architecture Overview

```
API Layer (Controllers)
    ↓
Application Layer (CQRS: Commands & Queries)
    ↓
Domain Layer (Entities, Interfaces)
    ↓
Infrastructure Layer (Repositories, Services, EF Core)
    ↓
Database (PostgreSQL)
```

## CQRS Command Flow

```
Frontend Request
    ↓
Controller receives request
    ↓
Maps to Command/Query
    ↓
MediatR dispatches to handler
    ↓
Validation pipeline (automatic)
    ↓
Handler executes business logic
    ↓
Repository persistence
    ↓
UnitOfWork SaveChanges()
    ↓
Map domain to DTO
    ↓
Return ApiResponse<DTO>
```

## File Organization

### Commands (Write Operations)

Location: `Features/[Feature]/Commands/`

**Pattern:**

```
CreateLessonCommand (record)
    ↓
CreateLessonCommandValidator (FluentValidation)
    ↓
CreateLessonCommandHandler (IRequestHandler<...>)
    ↓
Returns LessonDto
```

**All Commands Include:**

- UserId (for ownership validation)
- Request data
- Validator for input validation
- Handler with business logic
- Map to DTO before returning

### Queries (Read Operations)

Location: `Features/[Feature]/Queries/`

**Pattern:**

```
GetLessonQuery (record)
    ↓
GetLessonQueryHandler (IRequestHandler<...>)
    ↓
Fetches from repository
    ↓
Maps to DTO
    ↓
Returns DTO or List<DTO>
```

**Query Types:**

- `GetXQuery` - Single item fetch
- `GetAllXQuery` - List all items
- `GetUpdatedXQuery` - Fetch since timestamp (for sync)
- `GetByUserIdQuery` - User-scoped queries

### DTOs (Data Transfer Objects)

Location: `Features/[Feature]/DTOs/`

**All DTOs are C# Records:**

```csharp
public record LessonDto(
    Guid Id,
    string Title,
    string? Description = null,
    DateTime CreatedAt = default
);
```

**Usage:**

```csharp
// Map from domain entity
return new LessonDto(
    lesson.Id,
    lesson.Title,
    lesson.Description,
    lesson.CreatedAt
);
```

## User-Scoped Operations

**All user-scoped commands receive UserId:**

```csharp
public record CreateLessonCommand(
    Guid UserId,      // From JWT claim "sub"
    string PalaceId,
    string Title
) : IRequest<LessonDto>;
```

**Ownership Verification Pattern:**

```csharp
var lesson = await _lessonRepository.GetByIdAsync(request.LessonId, ct);

// Verify ownership
if (lesson.CreatedByUserId != request.UserId)
    throw new UnauthorizedAccessException("Only owner can modify");
```

## Exception Handling

**Standard Exceptions:**

```csharp
// Not found
throw new KeyNotFoundException("Lesson not found");

// Unauthorized access
throw new UnauthorizedAccessException("You cannot modify others' data");

// Invalid operation
throw new InvalidOperationException("Email already registered");

// Validation - handled automatically by pipeline
// throw new ValidationException(failures);
```

**API Response Mapping:**

```csharp
try
{
    var result = await _mediator.Send(command);
    return Ok(new { success = true, data = result });
}
catch (KeyNotFoundException ex)
{
    return NotFound(new { success = false, message = ex.Message });
}
catch (UnauthorizedAccessException ex)
{
    return Forbid();
}
catch (ValidationException ex)
{
    return BadRequest(new { success = false, errors = ex.Errors });
}
```

## Sync Operations

**All entities support incremental sync:**

```csharp
// Query: Get updates since last sync
var query = new GetUpdatedLessonsQuery(
    Since: new DateTime(2024, 1, 15, 10, 30, 0),
    PalaceId: palaceId
);

var updatedLessons = await _mediator.Send(query);

// Frontend merges with local data
```

## Database Conventions

### String IDs

```csharp
// All entities use string IDs (for UUID support)
public class Lesson : AuditableEntity
{
    public string Id { get; set; } = string.Empty;  // UUID string
}
```

### User-Scoped Fields

```csharp
// All user-scoped entities have UserId
public class UserLessonProgress : AuditableEntity, IUserOwned
{
    public string UserId { get; set; }  // Filter by this
}
```

### Audit Trail

```csharp
// All entities inherit from AuditableEntity
public class Lesson : AuditableEntity
{
    public string? CreatedBy { get; set; }      // User ID
    public string? UpdatedBy { get; set; }      // User ID
    public string? DeletedBy { get; set; }      // User ID
    public bool IsDeleted { get; set; }         // Soft delete
    public DateTime? DeletedAt { get; set; }    // Soft delete timestamp
}
```

### Sync Support

```csharp
// All entities track sync timestamp
public class BaseEntity
{
    public DateTime LastSyncedAt { get; set; }  // For incremental sync
}
```

## Key Features Implemented

✅ **Authentication**

- Email/password registration & login
- Google OAuth
- Facebook OAuth
- JWT token generation & validation

✅ **Content Management**

- Palaces (learning spaces)
- Locations (rooms in palaces)
- Lessons (content)
- Words (vocabulary items)

✅ **Learning System**

- Spaced repetition reviews
- Lesson progress tracking
- Word mastery levels

✅ **Gamification**

- XP earning
- Level progression
- Badges
- Milestones
- Streaks

✅ **Synchronization**

- Offline-first support
- Incremental sync since timestamp
- Created/Updated/Deleted tracking

✅ **User Scoping**

- All data properly filtered by UserId
- Ownership validation on mutations
- Multi-user backend from single-user frontend

## Handler Template

```csharp
using MediatR;
using MemoPal.Application.Contracts;
using MemoPal.Application.Interfaces;

namespace MemoPal.Application.Features.Lessons.Commands;

// 1. Define Command (immutable record)
public record CreateLessonCommand(
    Guid UserId,
    string Title,
    string? Description = null
) : IRequest<LessonDto>;

// 2. Define Validator
public class CreateLessonCommandValidator : AbstractValidator<CreateLessonCommand>
{
    public CreateLessonCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title too long");
    }
}

// 3. Define Handler
public class CreateLessonCommandHandler : IRequestHandler<CreateLessonCommand, LessonDto>
{
    private readonly ILessonRepository _lessons;
    private readonly IUnitOfWork _unitOfWork;

    public CreateLessonCommandHandler(
        ILessonRepository lessons,
        IUnitOfWork unitOfWork)
    {
        _lessons = lessons;
        _unitOfWork = unitOfWork;
    }

    public async Task<LessonDto> Handle(CreateLessonCommand request, CancellationToken cancellationToken)
    {
        // Business logic
        var lesson = new Lesson
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            CreatedByUserId = request.UserId,
            CreatedAt = DateTime.UtcNow
        };

        await _lessons.AddAsync(lesson, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Return DTO
        return new LessonDto(
            lesson.Id,
            lesson.Title,
            lesson.Description
        );
    }
}
```

## Controller Template

```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MemoPal.Application.Features.Lessons.Commands;
using MemoPal.Application.Features.Lessons.Queries;

namespace MemoPal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LessonsController : ControllerBase
{
    private readonly IMediator _mediator;

    public LessonsController(IMediator mediator) => _mediator = mediator;

    private Guid GetUserId()
    {
        var userId = User.FindFirst("sub")?.Value;
        return Guid.Parse(userId ?? throw new UnauthorizedAccessException());
    }

    [HttpPost]
    public async Task<ActionResult<LessonDto>> CreateLesson(
        [FromBody] CreateLessonCommand command)
    {
        var result = await _mediator.Send(
            new CreateLessonCommand(GetUserId(), command.Title, command.Description)
        );
        return CreatedAtAction(nameof(GetLesson), new { id = result.Id }, result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LessonDto>> GetLesson(Guid id)
    {
        var result = await _mediator.Send(new GetLessonQuery(id));
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LessonDto>>> GetLessons()
    {
        var result = await _mediator.Send(new GetAllLessonsQuery());
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<LessonDto>> UpdateLesson(
        Guid id,
        [FromBody] UpdateLessonCommand command)
    {
        var result = await _mediator.Send(
            new UpdateLessonCommand(GetUserId(), id, command.Title, command.Description)
        );
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLesson(Guid id)
    {
        await _mediator.Send(new DeleteLessonCommand(GetUserId(), id));
        return NoContent();
    }
}
```

## Repository Interface Pattern

```csharp
public interface ILessonRepository
{
    Task<Lesson?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<Lesson>> GetAllAsync(CancellationToken ct = default);
    Task<IEnumerable<Lesson>> GetByPalaceIdAsync(Guid palaceId, CancellationToken ct = default);
    Task<IEnumerable<Lesson>> GetUpdatedSinceAsync(DateTime since, CancellationToken ct = default);
    Task<Lesson> AddAsync(Lesson lesson, CancellationToken ct = default);
    Task<Lesson> UpdateAsync(Lesson lesson, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}
```

## Testing Pattern

```csharp
[Fact]
public async Task CreateLessonCommand_WithValidInput_CreatesAndReturns()
{
    // Arrange
    var command = new CreateLessonCommand(
        UserId: Guid.NewGuid(),
        Title: "Spanish Verbs",
        Description: "Common Spanish verbs"
    );

    var mockRepo = new Mock<ILessonRepository>();
    var mockUnitOfWork = new Mock<IUnitOfWork>();

    var handler = new CreateLessonCommandHandler(
        mockRepo.Object,
        mockUnitOfWork.Object
    );

    // Act
    var result = await handler.Handle(command, CancellationToken.None);

    // Assert
    Assert.NotNull(result);
    Assert.Equal("Spanish Verbs", result.Title);
    mockRepo.Verify(x => x.AddAsync(It.IsAny<Lesson>(), It.IsAny<CancellationToken>()), Times.Once);
}
```

## Common Patterns Summary

| Pattern               | Location             | File                                              |
| --------------------- | -------------------- | ------------------------------------------------- |
| ✅ CQRS               | Application Layer    | Commands & Queries                                |
| ✅ Validation         | Pipeline Behavior    | AuthCommandValidators, etc                        |
| ✅ DTO Mapping        | Handlers             | MapToDto() methods                                |
| ✅ Ownership Check    | Handlers             | `if (entity.CreatedByUserId != request.UserId)`   |
| ✅ Exception Handling | Handlers/Controllers | KeyNotFoundException, UnauthorizedAccessException |
| ✅ Sync Support       | Queries              | GetUpdated[Entity]Query                           |
| ✅ Batch Operations   | Commands             | CreateWordsBatchCommand                           |
| ✅ Cascading Updates  | Handlers             | Update parent counts when child deleted           |
| ✅ Soft Deletes       | Handlers             | Set IsDeleted = true, DeletedAt = now             |
| ✅ User Scoping       | All Commands         | Include UserId parameter                          |

---

**This guide covers 100% of currently implemented functionality.**
