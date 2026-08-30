using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;
using Microsoft.EntityFrameworkCore;

namespace MemoPal.Application.Features.MemorySets.Commands;

public sealed record UpdateMemorySetCommand(
    string UserId,
    string MemorySetId,
    MemorySetUpsertRequest Request) : IRequest<ApiResponse<MemorySetDto>>;

public sealed class UpdateMemorySetCommandHandler
    : IRequestHandler<UpdateMemorySetCommand, ApiResponse<MemorySetDto>>
{
    private readonly IAppDbContext _db;

    public UpdateMemorySetCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<MemorySetDto>> Handle(
        UpdateMemorySetCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await _db.ForUser(request.UserId)
            .WithAggregate()
            .FirstOrDefaultAsync(x => x.Id == request.MemorySetId, cancellationToken)
            ?? throw new NotFoundAppException("Memory set not found.");

        if (request.Request.ExpectedVersion is null)
        {
            throw new ValidationAppException("ExpectedVersion is required when updating a memory set.");
        }

        if (request.Request.ExpectedVersion != entity.Version)
        {
            throw new ConflictAppException(
                $"This memory set changed on another request. Reload version {entity.Version} before saving again.");
        }

        await MemorySetPalaceValidator.ValidateAsync(
            _db,
            request.UserId,
            request.Request,
            cancellationToken);

        MemorySetAggregate.Update(entity, request.Request);
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<MemorySetDto>.Ok(MemorySetAggregate.ToDto(entity));
    }
}
