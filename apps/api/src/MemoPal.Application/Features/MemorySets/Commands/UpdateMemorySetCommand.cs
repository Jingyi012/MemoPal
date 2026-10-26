using MediatR;
using MemoPal.Application.Common;
using MemoPal.Application.Common.Exceptions;
using MemoPal.Application.Common.Interfaces;
using MemoPal.Application.Features.MemorySets.DTOs;
using Microsoft.EntityFrameworkCore;
using MemoPal.Application.Features.CommunityMemorySets;

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
        await AccountRestrictions.RequirePrivateAsync(_db, request.UserId, request.Request.Visibility, cancellationToken);
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

        if (request.Request.Visibility != entity.Visibility)
            throw new ValidationAppException("Use the visibility endpoint to change sharing settings.");

        await MemorySetPalaceValidator.ValidateAsync(
            _db,
            request.UserId,
            request.Request,
            cancellationToken);

        await MemorySetAiImageValidator.ValidateAsync(_db, request.UserId, request.Request, cancellationToken);
        MemorySetAggregate.Update(entity, request.Request);
        if (entity.Visibility == MemoPal.Domain.Entities.MemorySetVisibilities.Public)
            entity.SharesPrivateAssets = await CommunityMemorySetPublishingValidator.ValidateAsync(
                _db, entity, entity.SharesPrivateAssets, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);
        return ApiResponse<MemorySetDto>.Ok(MemorySetAggregate.ToDto(entity));
    }
}
