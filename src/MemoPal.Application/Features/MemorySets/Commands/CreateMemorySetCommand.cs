using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;

namespace MemoPal.Application.Features.MemorySets.Commands;

public sealed record CreateMemorySetCommand(
    string UserId,
    MemorySetUpsertRequest Request) : IRequest<ApiResponse<MemorySetDto>>;

public sealed class CreateMemorySetCommandHandler
    : IRequestHandler<CreateMemorySetCommand, ApiResponse<MemorySetDto>>
{
    private readonly IAppDbContext _db;

    public CreateMemorySetCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<MemorySetDto>> Handle(
        CreateMemorySetCommand request,
        CancellationToken cancellationToken)
    {
        await MemorySetPalaceValidator.ValidateAsync(
            _db,
            request.UserId,
            request.Request,
            cancellationToken);
        var entity = MemorySetAggregate.Create(request.UserId, request.Request);
        await _db.MemorySets.AddAsync(entity, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<MemorySetDto>.Ok(MemorySetAggregate.ToDto(entity));
    }
}
