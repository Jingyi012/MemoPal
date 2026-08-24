# Code Templates and Naming Patterns

## Command + Handler

```csharp
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Example.DTOs;

namespace MemoPal.Application.Features.Example.Commands;

public sealed record CreateExampleCommand(string UserId, CreateExampleRequest Request)
    : IRequest<ApiResponse<ExampleDto>>;

public sealed class CreateExampleCommandHandler
    : IRequestHandler<CreateExampleCommand, ApiResponse<ExampleDto>>
{
    public async Task<ApiResponse<ExampleDto>> Handle(
        CreateExampleCommand request,
        CancellationToken cancellationToken)
    {
        // Orchestrate domain and infrastructure dependencies here.
        // Keep controller logic out of this flow.

        var dto = new ExampleDto(/* map values */);
        return ApiResponse<ExampleDto>.Ok(dto);
    }
}
```

## Query + Handler

```csharp
using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Features.Example.DTOs;

namespace MemoPal.Application.Features.Example.Queries;

public sealed record GetExampleQuery(string UserId, string Id)
    : IRequest<ApiResponse<ExampleDto>>;

public sealed class GetExampleQueryHandler
    : IRequestHandler<GetExampleQuery, ApiResponse<ExampleDto>>
{
    public async Task<ApiResponse<ExampleDto>> Handle(
        GetExampleQuery request,
        CancellationToken cancellationToken)
    {
        // Load and map result.
        return ApiResponse<ExampleDto>.Ok(new ExampleDto(/* ... */));
    }
}
```

## Paged Query

```csharp
public sealed record GetPagedExamplesQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<PaginatedResponse<ExampleDto>>;

public sealed class GetPagedExamplesQueryHandler
    : IRequestHandler<GetPagedExamplesQuery, PaginatedResponse<ExampleDto>>
{
    public async Task<PaginatedResponse<ExampleDto>> Handle(
        GetPagedExamplesQuery request,
        CancellationToken cancellationToken)
    {
        var items = new List<ExampleDto>();
        var totalCount = 0;
        return PaginatedResponse<ExampleDto>.Ok(items, request.PageNumber, request.PageSize, totalCount);
    }
}
```

## Thin Controller Endpoint

```csharp
[HttpPost]
public async Task<IActionResult> Create(
    [FromBody] CreateExampleRequest request,
    CancellationToken cancellationToken)
{
    var result = await Sender.Send(
        new CreateExampleCommand(GetUserIdOrThrow(), request),
        cancellationToken);

    return Ok(result);
}
```

## Folder Layout Pattern

```text
src/MemoPal.Application/Features/Example/
  Commands/
    CreateExampleCommand.cs
    UpdateExampleCommand.cs
  Queries/
    GetExampleQuery.cs
    GetPagedExamplesQuery.cs
  DTOs/
    ExampleDtos.cs
```

## Naming Checklist

- Commands use imperative verbs: `CreateX`, `UpdateX`, `DeleteX`, `SyncX`.
- Queries use read verbs: `GetX`, `ListX`, `GetPagedX`, `GetUpdatedX`.
- Request/response DTO names are explicit (`ExampleUpsertRequest`, `ExampleDto`).
- Keep command/query file names aligned with type names.
